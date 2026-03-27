'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { requireRole } from '@/utils/auth-check'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_...'
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// ─── Invite Admin ─────────────────────────────────────────────────────────────

const InviteAdminSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
})

export async function inviteAdmin(formData: z.infer<typeof InviteAdminSchema>) {
  try {
    await requireRole(['superadmin'])
  } catch (e: any) {
    return { error: e.message || 'Non autorizzato' }
  }

  const validated = InviteAdminSchema.safeParse(formData)
  if (!validated.success) return { error: 'Dati non validi' }

  const { first_name, last_name, email, phone } = validated.data

  const adminClient = await createAdminClient()

  // 1. Create auth user and send invitation email
  const { data: invited, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { first_name, last_name, phone },
  })

  if (inviteErr || !invited?.user) {
    return { error: inviteErr?.message ?? 'Errore durante la creazione dell\'account.' }
  }

  const userId = invited.user.id

  // 2. Upsert the profile so the user lands on the correct role on first login
  const { error: profileErr } = await adminClient
    .from('profiles')
    .upsert({
      id: userId,
      first_name,
      last_name,
      email,
      phone: phone ?? null,
      role: 'admin',
    })

  if (profileErr) {
    // Best-effort cleanup of the orphan auth user
    await adminClient.auth.admin.deleteUser(userId)
    return { error: profileErr.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Demote Professor → User ─────────────────────────────────────────────────

export async function demoteProfessor(professorId: string) {
  try {
    await requireRole(['superadmin'])
  } catch (e: any) {
    return { error: e.message || 'Non autorizzato' }
  }

  if (!professorId) return { error: 'ID professore mancante.' }

  const supabase = await createAdminClient()

  // Downgrade role to 'user'
  const { error: roleErr } = await supabase
    .from('profiles')
    .update({ role: 'user' })
    .eq('id', professorId)

  if (roleErr) return { error: roleErr.message }

  // Future-proof: remove from professors table so their public profile disappears
  await supabase.from('professors').delete().eq('id', professorId)

  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Delete Student Account (GDPR) ───────────────────────────────────────────

export async function deleteStudentAccount(userId: string) {
  try {
    await requireRole(['superadmin'])
  } catch (e: any) {
    return { error: e.message || 'Non autorizzato' }
  }

  if (!userId) return { error: 'ID utente mancante.' }

  const adminClient = await createAdminClient()

  // Fetch email before deletion for notification
  const { data: profile } = await adminClient
    .from('profiles')
    .select('email, first_name')
    .eq('id', userId)
    .single()

  // Hard-delete auth user → cascade deletes profile via DB foreign key
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  // Optional GDPR notification
  if (resend && profile?.email) {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Prenotazioni <onboarding@resend.dev>'
    try {
      await resend.emails.send({
        from: fromEmail,
        to: profile.email,
        subject: 'Conferma eliminazione account',
        html: `<p>Ciao ${profile.first_name ?? ''},</p>
               <p>Il tuo account e tutti i dati ad esso associati sono stati eliminati definitivamente dalla nostra piattaforma in conformità con il GDPR.</p>
               <p>Se ritieni che ci sia un errore, contattaci rispondendo a questa email.</p>`,
      })
    } catch (e) { console.error('Errore invio email eliminazione:', e) }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Contact User via Email (Superadmin) ─────────────────────────────────────

const ContactUserSchema = z.object({
  to: z.email(),
  subject: z.string().min(1),
  body: z.string().min(1),
})

export async function sendEmailToUser(formData: z.infer<typeof ContactUserSchema>) {
  try {
    await requireRole(['superadmin', 'admin'])
  } catch (e: any) {
    return { error: e.message || 'Non autorizzato' }
  }

  const validated = ContactUserSchema.safeParse(formData)
  if (!validated.success) return { error: 'Dati non validi' }

  if (!resend) return { error: 'Servizio email non configurato.' }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Prenotazioni <onboarding@resend.dev>'

  try {
    await resend.emails.send({
      from: fromEmail,
      to: validated.data.to,
      subject: validated.data.subject,
      html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
               <p>${validated.data.body.replaceAll('\n', '<br/>')}</p>
               <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;"/>
               <p style="font-size: 12px; color: #9ca3af;">Questo messaggio è stato inviato dalla piattaforma PrenotaLezioni.</p>
             </div>`,
    })
  } catch (e) {
    console.error('Errore invio email:', e)
    return { error: 'Impossibile inviare l\'email. Riprova più tardi.' }
  }

  return { success: true }
}
