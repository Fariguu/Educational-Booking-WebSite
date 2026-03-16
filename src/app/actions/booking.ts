'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
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
  } catch (err) {
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
    try {
      await resend.emails.send({
        from: fromEmail,
        to: studentContact,
        subject: 'Conferma Richiesta Prenotazione',
        html: `<p>Ciao <strong>${studentName}</strong>,</p>
               <p>Abbiamo ricevuto la tua richiesta di prenotazione per la lezione (Orario: ${new Date(requestedStartTime).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})} - ${new Date(requestedEndTime).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}).</p>
               <p>Riceverai una conferma definitiva non appena il professore avrà visionato la richiesta.</p>`,
      })
    } catch (emailErr) {
      console.error("Errore invio email:", emailErr)
      // Non blocchiamo il successo della prenotazione se l'email fallisce
    }
  }

  return { success: true }
}
