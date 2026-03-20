'use server'

import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const AuthSchema = z.object({
  email: z.string().email("Inserisci un indirizzo email valido"),
  password: z.string().min(6, "La password deve contenere almeno 6 caratteri"),
})

export async function loginWithPassword(formData: z.infer<typeof AuthSchema>) {
  const validated = AuthSchema.safeParse(formData)
  
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function registerWithPassword(formData: z.infer<typeof AuthSchema>) {
  const validated = AuthSchema.safeParse(formData)
  
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const supabase = await createClient()

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

  if (data?.session === null) {
      return { success: true, message: "Registrazione completata! Controlla la tua email per confermare l'account." }
  }

  return { success: true }
}

export async function logoutAction() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return { success: true }
}
