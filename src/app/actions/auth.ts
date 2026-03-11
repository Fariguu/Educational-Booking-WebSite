'use server'

import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email("Inserisci un indirizzo email valido"),
})

export async function loginWithMagicLink(formData: z.infer<typeof LoginSchema>) {
  const validated = LoginSchema.safeParse(formData)
  
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const supabase = await createClient()

  // In Next.js App Router non possiamo prendere window.location.origin
  // Usiamo NEXT_PUBLIC_SITE_URL se presente, altrimenti diamo priorità a localhost
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.signInWithOtp({
    email: validated.data.email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/admin`,
      shouldCreateUser: true, // Permettiamo la creazione al primo accesso
    },
  })

  if (error) {
    if (error.message.includes('Signups not allowed')) {
        return { error: "Utente non autorizzato o inesistente."}
    }
    return { error: error.message }
  }

  return { success: true }
}
