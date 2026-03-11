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
})

export async function bookLesson(formData: z.infer<typeof BookingSchema>) {
  // 1. Validazione input
  const validated = BookingSchema.safeParse(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { slotId, studentName, studentContact, notes, turnstileToken } = validated.data

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

  // 3. Update Supabase con controllo concorrenza
  const supabase = await createAdminClient()
  
  const { count, error: updateError } = await supabase
    .from('lessons')
    .update({
      student_name: studentName,
      student_contact: studentContact,
      notes: notes,
      is_available: false,
      status: 'pending'
    }, { count: 'exact' })
    .eq('id', slotId)
    .eq('is_available', true)

  if (updateError || count === 0) {
    if (updateError) console.error("Errore Supabase:", updateError);
    return { error: "Questo slot è stato appena prenotato da qualcun altro o non è più disponibile." }
  }

  // 4. Invio email con Resend (se la chiave è presente)
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_...') {
    try {
      await resend.emails.send({
        from: 'Prenotazioni <onboarding@resend.dev>', // Cambia con il tuo dominio verificato quando possibile
        to: studentContact,
        subject: 'Conferma Richiesta Prenotazione',
        html: `<p>Ciao <strong>${studentName}</strong>,</p>
               <p>Abbiamo ricevuto la tua richiesta di prenotazione per la lezione.</p>
               <p>Riceverai una conferma definitiva non appena il professore avrà visionato la richiesta.</p>`,
      })
    } catch (emailErr) {
      console.error("Errore invio email:", emailErr)
      // Non blocchiamo il successo della prenotazione se l'email fallisce
    }
  }

  return { success: true }
}
