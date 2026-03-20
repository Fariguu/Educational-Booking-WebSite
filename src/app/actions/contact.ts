'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { Resend } from 'resend'
import { z } from 'zod'

const ContactSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  email: z.string().email('Inserisci un indirizzo email valido'),
  message: z.string().min(10, 'Il messaggio deve avere almeno 10 caratteri'),
  turnstileToken: z.string().min(1, 'Validazione anti-spam fallita'),
  professorId: z.string().uuid().optional(), // opzionale solo per compatibilità temporanea se serve
})

const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_...'
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export async function sendContactMessage(formData: z.infer<typeof ContactSchema>) {
  // 1. Validazione input
  const validated = ContactSchema.safeParse(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { name, email, message, turnstileToken, professorId } = validated.data

  // 2. Verifica Turnstile
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      }),
    })
    const data = await res.json()
    if (!data.success) {
      return { error: `Validazione anti-spam fallita: ${data['error-codes']?.join(', ') || 'errore generico'}` }
    }
  } catch {
    return { error: 'Errore durante la verifica anti-spam.' }
  }

  // 3. Salvataggio su Supabase
  const supabase = await createAdminClient()
  const { error: dbError } = await supabase
    .from('contacts')
    .insert({ name, email, message, professor_id: professorId })

  if (dbError) {
    console.error('Errore Supabase contacts:', dbError)
    return { error: 'Errore nel salvataggio del messaggio. Riprova più tardi.' }
  }

  // 4. Email di notifica all'admin/insegnante
  if (resend) {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Notifiche <onboarding@resend.dev>'
    let adminEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    
    // Recupera l'email del professore se presente
    if (professorId) {
       const { data: profAuthData, error: profAuthError } = await supabase.auth.admin.getUserById(professorId);
       if (!profAuthError && profAuthData?.user?.email) {
           adminEmail = profAuthData.user.email;
       }
    }
    
    try {
      await resend.emails.send({
        from: fromEmail,
        to: adminEmail,
        subject: `Nuovo messaggio di contatto da ${name}`,
        html: `
          <h2>Nuovo messaggio dal form di contatto</h2>
          <p><strong>Nome:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <hr />
          <p><strong>Messaggio:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      })
    } catch (e) {
      console.error('Errore invio email notifica contatto:', e)
      // Non blocchiamo il successo se l'email fallisce
    }
  }

  return { success: true }
}

export async function getContactMessages(professorId?: string) {
  const supabase = await createAdminClient()
  let query = supabase.from('contacts').select('*').order('created_at', { ascending: false })
  
  if (professorId) {
    query = query.eq('professor_id', professorId)
  } else {
    query = query.is('professor_id', null)
  }

  const { data, error } = await query

  if (error) return { error: "Errore nel recupero dei messaggi." }
  return { data }
}
