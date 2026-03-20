'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { requireRole } from '@/utils/auth-check'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_...'
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const ApplicationSchema = z.object({
  fullName: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  bio: z.string().min(20, "Scrivi una breve bio di almeno 20 caratteri"),
  subjects: z.array(z.string()).min(1, "Seleziona almeno una materia"),
})

export async function applyForProfessor(formData: z.infer<typeof ApplicationSchema>) {
  // Solo utenti base o studenti possono candidarsi
  try {
    await requireRole(['user', 'student' as any])
  } catch (e: any) {
    return { error: e.message || "Non autorizzato" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Utente non trovato" }

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
      email: user.email, // Salva l'email di registrazione
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

  // 3. Email notifica all'admin
  if (resend) {
    try {
      const adminClient2 = await createAdminClient()
      const { data: authUserData } = await adminClient2.auth.admin.getUserById(user.id)
      const applicantEmail = authUserData?.user?.email || 'N/D'
      const adminEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

      await resend.emails.send({
        from: `Notifiche Piattaforma <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
        to: adminEmail,
        subject: `📋 Nuova candidatura docente: ${fullName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #4f46e5; margin-bottom: 4px;">Nuova Richiesta Docente</h2>
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">Un utente vuole diventare insegnante sulla piattaforma.</p>

            <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <p style="margin: 0 0 8px;"><strong>👤 Nome:</strong> ${fullName}</p>
              <p style="margin: 0 0 8px;"><strong>📧 Email:</strong> ${applicantEmail}</p>
              <p style="margin: 0 0 8px;"><strong>📚 Materie:</strong> ${subjects.join(', ')}</p>
              <p style="margin: 0;"><strong>📝 Bio:</strong> ${bio.substring(0, 200)}${bio.length > 200 ? '...' : ''}</p>
            </div>

            <a href="${siteUrl}/dashboard" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Vai alla Dashboard →
            </a>
          </div>
        `,
      })
    } catch (e) {
      console.error('Errore invio email admin:', e)
      // Non blocchiamo il successo
    }
  }

  return { success: true }
}

export async function approveApplication(userId: string) {
  try {
    await requireRole(['admin', 'superadmin'])
  } catch (e: any) {
    return { error: e.message || "Non autorizzato" }
  }

  const adminClient = await createAdminClient()
  const { data, error } = await adminClient.rpc('approve_professor_application', { p_user_id: userId })
  
  if (error) return { error: error.message }
  if (data && !data.success) return { error: data.error || 'Errore sconosciuto' }
  
  return { success: true }
}

export async function rejectApplication(userId: string) {
  try {
    await requireRole(['admin', 'superadmin'])
  } catch (e: any) {
    return { error: e.message || "Non autorizzato" }
  }

  const adminClient = await createAdminClient()

  // 1. Elimina la candidatura
  const { error: deleteError } = await adminClient
    .from('professor_applications')
    .delete()
    .eq('id', userId)

  if (deleteError) return { error: 'Errore durante l\'eliminazione della candidatura.' }

  // 2. Ripristina il ruolo a 'user'
  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ role: 'user' })
    .eq('id', userId)

  if (updateError) return { error: 'Candidatura eliminata ma errore nel ripristino del ruolo.' }

  return { success: true }
}

export async function updateApplicationNotes(userId: string, notes: string) {
  try {
    await requireRole(['admin', 'superadmin'])
  } catch (e: any) {
    return { error: e.message || "Non autorizzato" }
  }

  const adminClient = await createAdminClient()
  const { error } = await adminClient
    .from('professor_applications')
    .update({ admin_notes: notes })
    .eq('id', userId)

  if (error) return { error: 'Errore durante l\'aggiornamento delle note.' }
  return { success: true }
}


