'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const BookingSchema = z.object({
  slotId: z.string().uuid(),
  studentName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  studentContact: z.string().email("Inserisci un indirizzo email valido"),
  notes: z.string().optional(),
  turnstileToken: z.string().min(1, "Validazione anti-spam fallita"),
  requestedStartTime: z.string().datetime(),
  requestedEndTime: z.string().datetime(),
})

export async function bookLesson(formData: z.infer<typeof BookingSchema>) {
  // 1. Validazione input
  const validated = BookingSchema.safeParse(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { slotId, studentName, studentContact, notes, turnstileToken, requestedStartTime, requestedEndTime } = validated.data

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
  } catch (_err) {
    return { error: "Errore durante la verifica anti-spam." }
  }

  // 3. Update Supabase tramite RPC per partizionamento atomico (Mega-Slot)
  const supabase = await createAdminClient()
  
  const { data: result, error: rpcError } = await supabase.rpc('split_and_book_slot', {
      p_slot_id: slotId,
      p_req_start: requestedStartTime,
      p_req_end: requestedEndTime,
      p_name: studentName,
      p_email: studentContact,
      p_notes: notes || null
  })

  // Poiché la RPC usa FOR UPDATE, se c'è un errore Postgres lo troveremo qui
  if (rpcError) {
    console.error("Errore Supabase RPC:", rpcError);
    return { error: "Errore durante la prenotazione. Riprova più tardi." }
  }

  // La RPC ritorna un costrutto in formato JSONB per gestire le asserzioni custom
  if (result && result.success === false) {
    return { error: result.error || "Questo blocco orario è appena stato prenotato da qualcun altro." }
  }

  // 4. Invio email con Resend (se la chiave è presente)
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_...') {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Prenotazioni <onboarding@resend.dev>'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const manageUrl = `${siteUrl}/gestisci/${slotId}`
    
    try {
      await resend.emails.send({
        from: fromEmail,
        to: studentContact,
        subject: 'Conferma Richiesta Prenotazione',
        html: `<p>Ciao <strong>${studentName}</strong>,</p>
               <p>Abbiamo ricevuto la tua richiesta di prenotazione per la lezione (Orario: ${new Date(requestedStartTime).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})} - ${new Date(requestedEndTime).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}).</p>
               <p>Riceverai un'email definitiva non appena il professore avrà visionato la richiesta.</p>
               <hr />
               <p>Vuoi riprogrammare, aggiungere note o gestire la tua prenotazione?</p>
               <p><a href="${manageUrl}" style="background-color: #9333ea; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block;">Gestisci Prenotazione</a></p>
               <p><small>(Link privato, non inoltrare a nessuno)</small></p>`,
      })
    } catch (emailErr) {
      console.error("Errore invio email:", emailErr)
      // Non blocchiamo il successo della prenotazione se l'email fallisce
    }
  }

  return { success: true }
}

const RescheduleSchema = z.object({
  slotId: z.string().uuid(),
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
  } catch (_err) {
    return { error: "Errore durante la verifica anti-spam." }
  }

  // Bypass RLS con Admin Client
  const supabase = await createAdminClient()

  // Recupera prima la lezione per i dati dell'email
  const { data: lesson, error: fetchError } = await supabase.from('lessons').select('*').eq('id', slotId).single()
  
  if (fetchError || !lesson) return { error: "Lezione non trovata." }

  const { error: updateError } = await supabase
    .from('lessons')
    .update({ 
      reschedule_requested: true,
      reschedule_notes: notes
    })
    .eq('id', slotId)

  if (updateError) return { error: "Impossibile aggiornare la prenotazione." }

  // Notifica all'insegnante
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_...') {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Prenotazioni <onboarding@resend.dev>'
    // L'insegnante è temporaneamente associato al destinatario hard-coded o prendiamo l'Auth user se fosse MultiTenant. In SingleTenant, mandiamo al fromEmail (o se avessimo una env var ADMIN_EMAIL). 
    // Per ora mandiamo alla mail di onboading (o quella validata su resend)
    const adminEmail = process.env.ADMIN_EMAIL || fromEmail

    try {
      await resend.emails.send({
        from: fromEmail,
        to: adminEmail,
        subject: `⚠️ Richiesta Reschedule da ${lesson.student_name}`,
        html: `
          <h3>Richiesta di Spostamento Lezione</h3>
          <p>Lo studente <strong>${lesson.student_name}</strong> ha richiesto di spostare la lezione prevista per il ${new Date(lesson.start_time).toLocaleString('it-IT')}.</p>
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
