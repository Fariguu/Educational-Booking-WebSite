'use server'

import { createClient } from '@/utils/supabase/server'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_...'
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const AuthSchema = z.object({
  email: z.email({ message: "Inserisci un indirizzo email valido" }),
  password: z.string().min(8, "La password deve contenere almeno 8 caratteri").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,}$/, "La password deve contenere almeno 1 maiuscola, 1 minuscola e 1 numero o carattere speciale"),
  firstName: z.string().min(1).optional(),
  phone: z.string().optional(),
})

export async function loginWithPassword(formData: z.infer<typeof AuthSchema>) {
  const validated = AuthSchema.safeParse(formData)
  
  if (!validated.success) {
    return { error: "Email o password errata." }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  })

  if (error) {
    return { error: "Email o password errata." }
  }

  return { success: true }
}

async function sendWelcomeEmail(email: string) {
  if (!resend) return;
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    await resend.emails.send({
      from: `Benvenuto su EduBook <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: email,
      subject: '🎉 Benvenuto su EduBook – Confirm your account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h1 style="color: #4f46e5; font-size: 24px; margin-bottom: 8px;">Benvenuto su EduBook! 🎓</h1>
          <p style="color: #6b7280; margin-bottom: 24px;">La tua registrazione è avvenuta con successo. Controlla la tua casella di posta per confermare il tuo account e poi accedi per iniziare.</p>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #374151; font-size: 14px;">Una volta confermato il tuo account, potrai:</p>
            <ul style="color: #374151; font-size: 14px; margin: 8px 0 0; padding-left: 20px;">
              <li>Prenotare lezioni con i nostri docenti</li>
              <li>Candidarti come insegnante</li>
              <li>Accedere alla tua dashboard personale</li>
            </ul>
          </div>

          <a href="${siteUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Vai alla Piattaforma →
          </a>
          
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Se non ti sei registrato tu, ignora questa email.</p>
        </div>
      `,
    })
  } catch (e) {
    console.error('Errore invio email benvenuto:', e)
  }
}

async function saveUserProfile(userId: string, data: z.infer<typeof AuthSchema>) {
  const { createAdminClient } = await import('@/utils/supabase/server')
  const adminClient = await createAdminClient()
  
  const fullName = data.firstName || '';
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || null;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

  await adminClient
    .from('profiles')
    .update({
      email: data.email,
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName ? { last_name: lastName } : {}),
      ...(data.phone ? { phone: data.phone } : {}),
    })
    .eq('id', userId)
}

export async function registerWithPassword(formData: z.infer<typeof AuthSchema>) {
  const validated = AuthSchema.safeParse(formData)
  
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const supabase = await createClient()

  if (validated.data.phone) {
    const { createAdminClient } = await import('@/utils/supabase/server')
    const adminClient = await createAdminClient()
    const { data: existingPhone } = await adminClient.from('profiles').select('id').eq('phone', validated.data.phone).maybeSingle()
    if (existingPhone) {
      return { error: "Questo numero di telefono è già associato ad un altro account." }
    }
  }

  const { error, data } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  // Se l'utente è stato creato ma richiede conferma email, Supabase data.user sarà presente
  if (data?.user && data.user.identities?.length === 0) {
    return { error: "Email già registrata. Prova ad accedere." }
  }

  // Save name parts, phone and email to profiles (created by DB trigger)
  if (data?.user?.id) {
    await saveUserProfile(data.user.id, validated.data)
  }

  if (data?.session === null) {
    await sendWelcomeEmail(validated.data.email)
    return { success: true, message: "Registrazione completata! Controlla la tua email per confermare l'account." }
  }

  return { success: true }
}

export async function logoutAction() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return { success: true }
}

export async function resetPasswordAction(email: string) {
  const supabase = await createClient()

  // We construct the absolute URL for the redirect
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updatePasswordAction(newPassword: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
