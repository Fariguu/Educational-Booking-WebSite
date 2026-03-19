'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { z } from 'zod'

const ApplicationSchema = z.object({
  fullName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  bio: z.string().min(20, "Scrivi una breve bio di almeno 20 caratteri"),
  subjects: z.array(z.string()).min(1, "Seleziona almeno una materia"),
})

export async function applyForProfessor(formData: z.infer<typeof ApplicationSchema>) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non sei autenticato. Fai l'accesso prima." }

  const validated = ApplicationSchema.safeParse(formData)
  if (!validated.success) return { error: validated.error.issues[0].message }

  const { fullName, bio, subjects } = validated.data

  // 1. Inserimento in professor_applications
  const { error: insertError } = await supabase
    .from('professor_applications')
    .insert({
      id: user.id,
      full_name: fullName,
      bio: bio,
      subjects: subjects,
    })

  if (insertError) {
    // Potrebbe già aver fatto richiesta
    if (insertError.code === '23505') {
       return { error: "Hai già inviato una richiesta. Attendi l'approvazione." }
    }
    return { error: "Errore durante l'invio della richiesta." }
  }

  // 2. Aggiornamento del ruolo a pending_professor
  // Questo fallisce se c'è RLS su profiles, ma solitamente l'utente può aggiornare il proprio.
  // Oppure possiamo farlo con l'admin client se non ha i permessi (ma in theory ha il permesso per aggiornare il PROPRIO profile)

  const adminClient = await createAdminClient()
  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ role: 'pending_professor' })
    .eq('id', user.id)

  if (updateError) {
    return { error: "Richiesta inviata, ma errore nell'aggiornamento del ruolo." }
  }

  return { success: true }
}

export async function approveApplication(userId: string) {
  const adminClient = await createAdminClient()
  const { data, error } = await adminClient.rpc('approve_professor_application', { p_user_id: userId })
  
  if (error) return { error: error.message }
  if (data && !data.success) return { error: data.error || 'Errore sconosciuto' }
  
  return { success: true }
}
