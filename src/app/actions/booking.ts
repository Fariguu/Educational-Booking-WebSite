'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_...'
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const BookingSchema = z.object({
  slotId: z.uuid(),
  studentName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  studentContact: z.email({ message: "Inserisci un indirizzo email valido" }),
  notes: z.string().optional(),
  turnstileToken: z.string().min(1, "Validazione anti-spam fallita"),
  requestedStartTime: z.iso.datetime(),
  requestedEndTime: z.iso.datetime(),
  studentId: z.uuid().optional(),
})

async function sendBookingConfirmationEmail(
  resendClient: any, 
  user: any, 
  supabase: any, 
  data: { studentContact: string, studentName: string, requestedStartTime: string, requestedEndTime: string, slotId: string }
) {
  if (!resendClient) return;

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Prenotazioni <onboarding@resend.dev>'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const manageUrl = `${siteUrl}/gestisci/${data.slotId}`
  
  try {
    let studentEmail = data.studentContact
    let studentFirstName = data.studentName

    if (user) {
      const { data: studentProfile } = await supabase.from('profiles').select('email, first_name').eq('id', user.id).single()
      if (studentProfile) {
        studentEmail = studentProfile.email || data.studentContact
        studentFirstName = studentProfile.first_name || data.studentName
      }
    }
    
    await resendClient.emails.send({
      from: fromEmail,
      to: studentEmail,
      subject: 'Conferma Richiesta Prenotazione',
      html: `<p>Ciao <strong>${studentFirstName}</strong>,</p>
             <p>Abbiamo ricevuto la tua richiesta di prenotazione per la lezione (Orario: ${new Date(data.requestedStartTime).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})} - ${new Date(data.requestedEndTime).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}).</p>
             <p>Riceverai un'email definitiva non appena il professore avrà visionato la richiesta.</p>
             <hr />
             <p>Vuoi riprogrammare, aggiungere note o gestire la tua prenotazione?</p>
             <p><a href="${manageUrl}" style="background-color: #9333ea; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block;">Gestisci Prenotazione</a></p>
             <p><small>(Link privato, non inoltrare a nessuno)</small></p>`,
    })
  } catch (emailErr) {
    console.error("Errore invio email:", emailErr)
  }
}

export async function bookLesson(formData: z.infer<typeof BookingSchema>) {
  try {
    // 1. Validazione input
    const validated = BookingSchema.safeParse(formData)
    if (!validated.success) {
      return { error: validated.error.issues[0].message }
    }

    const { 
      slotId, 
      studentName, 
      studentContact, 
      notes, 
      turnstileToken, 
      requestedStartTime, 
      requestedEndTime
    } = validated.data

    // 2. Verifica Turnstile
    try {
      const turnstileResponse = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: turnstileToken,
          }),
        }
      )

      const turnstileData = await turnstileResponse.json()
      
      if (!turnstileData.success) {
        return { error: `Validazione anti-spam fallita: ${turnstileData['error-codes']?.join(', ') || 'errore generico'}` }
      }
    } catch (err) {
      console.error("Turnstile error:", err)
      return { error: "Errore durante la verifica anti-spam." }
    }

    // 3. Verifica Utente e prenotazione
    const supabase = await createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Se loggato, usiamo il suo id. Altrimenti procediamo come guest.
    const finalStudentId = user?.id || null
    
    // Se l'utente è loggato, assicuriamoci che esista nella tabella 'students'
    if (finalStudentId) {
      const { data: studentRecord } = await supabase.from('students').select('id').eq('id', finalStudentId).single()
      if (!studentRecord) {
         await supabase.from('students').insert({ id: finalStudentId })
      }
    }

    const { data: result, error: rpcError } = await supabase.rpc('split_and_book_slot', {
        p_slot_id: slotId,
        p_req_start: requestedStartTime,
        p_req_end: requestedEndTime,
        p_notes: notes || null,
        p_student_id: finalStudentId,
        p_guest_name: user ? null : studentName,
        p_guest_email: user ? null : studentContact
    })

    if (rpcError) {
      console.error("Errore Supabase RPC:", rpcError);
      return { error: `Errore RPC: ${rpcError.message} (Verifica SQL refactoring)` }
    }

    if (result?.success === false) {
      return { error: result.error || "Questo blocco orario è appena stato prenotato da qualcun altro." }
    }

    // 4. Invio email con Resend
    await sendBookingConfirmationEmail(resend, user, supabase, {
      studentContact, studentName, requestedStartTime, requestedEndTime, slotId
    })

    return { success: true }
  } catch (globalErr: any) {
    console.error("Global booking error:", globalErr)
    return { error: "Si è verificato un errore imprevisto durante la prenotazione." }
  }
}

const RescheduleSchema = z.object({
  slotId: z.uuid(),
  notes: z.string().min(5, "Specifica un motivo o un orario alternativo"),
  turnstileToken: z.string().min(1, "Validazione anti-spam fallita")
})

export async function requestReschedule(formData: z.infer<typeof RescheduleSchema>) {
  const validated = RescheduleSchema.safeParse(formData)
  if (!validated.success) return { error: validated.error.issues[0].message }
  
  const { slotId, notes, turnstileToken } = validated.data

  try {
    const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: turnstileToken }),
    })
    const turnstileData = await turnstileResponse.json()
    if (!turnstileData.success) return { error: "Spam block." }
  } catch (err) {
    console.error("Turnstile verification error:", err)
    return { error: "Errore durante la verifica anti-spam." }
  }

  const supabase = await createAdminClient()

  const { data: lesson, error: fetchError } = await supabase
    .from('lessons')
    .select('*, students(profiles(first_name, last_name))')
    .eq('id', slotId)
    .single()
  
  if (fetchError || !lesson) return { error: "Lezione non trovata." }
  
  const studentProfile = lesson.students?.profiles;
  const studentNameDisplay = studentProfile?.first_name 
    ? `${studentProfile.first_name} ${studentProfile.last_name || ''}`.trim() 
    : 'Uno studente';

  const { error: updateError } = await supabase
    .from('lessons')
    .update({ 
      reschedule_requested: true,
      reschedule_notes: notes
    })
    .eq('id', slotId)

  if (updateError) return { error: "Impossibile aggiornare la prenotazione." }

  if (resend) {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Prenotazioni <onboarding@resend.dev>'
    let adminEmail = process.env.ADMIN_EMAIL || fromEmail;
    
    if (lesson.professor_id) {
       const { data: profAuthData, error: profAuthError } = await supabase.auth.admin.getUserById(lesson.professor_id);
       if (!profAuthError && profAuthData?.user?.email) {
           adminEmail = profAuthData.user.email;
       }
    }

    try {
      await resend.emails.send({
        from: fromEmail,
        to: adminEmail,
        subject: `⚠️ Richiesta Reschedule da ${studentNameDisplay}`,
        html: `
          <h3>Richiesta di Spostamento Lezione</h3>
          <p>Lo studente <strong>${studentNameDisplay}</strong> ha richiesto di spostare la lezione prevista per il ${new Date(lesson.start_time).toLocaleString('it-IT')}.</p>
          <p><strong>Motivazione:</strong></p>
          <blockquote style="background: #f1f5f9; padding: 12px; border-left: 4px solid #94a3b8; font-style: italic;">
            ${notes}
          </blockquote>
          <p>Accedi alla dashboard per gestire la richiesta.</p>
        `,
      })
    } catch (e) { console.error(e) }
  }

  return { success: true }
}
