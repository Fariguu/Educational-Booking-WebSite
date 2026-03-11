'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CreateSlotSchema = z.object({
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
})

export async function createSlot(formData: z.infer<typeof CreateSlotSchema>) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non autorizzato" }

  const validated = CreateSlotSchema.safeParse(formData)
  if (!validated.success) return { error: "Dati non validi" }

  const { error } = await supabase.from('lessons').insert({
    start_time: validated.data.start_time,
    end_time: validated.data.end_time,
    is_available: true,
    status: 'available'
  })

  if (error) return { error: error.message }

  // Invalidazione per aggiornare sia la dashboard admin sia il calendario pubblico
  revalidatePath('/admin')
  revalidatePath('/') 
  return { success: true }
}

export async function removeAvailableSlot(slotId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non autorizzato" }

  // Può eliminare solo se è effettivamente 'available' (sicurezza extra per non cancellare prenotazioni in corso)
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', slotId)
    .eq('status', 'available')

  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true }
}

import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_...' 
    ? new Resend(process.env.RESEND_API_KEY) 
    : null;

export async function confirmLesson(lessonId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non autorizzato" }

  const { data: lesson, error: fetchErr } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single()

  if (fetchErr || !lesson) return { error: "Lezione non trovata" }

  const { error } = await supabase
    .from('lessons')
    .update({ status: 'confirmed' })
    .eq('id', lessonId)

  if (error) return { error: error.message }

  // Genera link Google Calendar in UTC format essenziale YYYYMMDDTHHmmssZ
  const startDate = new Date(lesson.start_time)
  const endDate = new Date(lesson.end_time)
  const formatS = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const formatE = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Lezione+Privata+-+${encodeURIComponent(lesson.student_name || 'Studente')}&dates=${formatS}/${formatE}&details=Contatto:+${encodeURIComponent(lesson.student_contact || '')}`

  // Notify via Resend
  if (resend && lesson.student_contact) {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Prenotazioni <onboarding@resend.dev>'
    try {
        await resend.emails.send({
            from: fromEmail,
            to: lesson.student_contact,
            subject: 'Lezione Confermata!',
            html: `<p>Ciao <strong>${lesson.student_name}</strong>,</p><p>Ottime notizie! La tua lezione del ${startDate.toLocaleDateString('it-IT')} è stata ufficialmente confermata!</p>`,
        })
    } catch(e) { console.error("Errore invio email conferma:", e) }
  }

  revalidatePath('/admin')
  return { success: true, gcalUrl }
}

export async function rejectLesson(lessonId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non autorizzato" }

  const { data: lesson } = await supabase.from('lessons').select('student_contact, student_name').eq('id', lessonId).single()

  // Resetta lo slot, rimettendolo a disposizione per altri
  const { error } = await supabase
    .from('lessons')
    .update({ 
        status: 'available', 
        is_available: true, 
        student_name: null, 
        student_contact: null, 
        notes: null 
    })
    .eq('id', lessonId)

  if (error) return { error: error.message }

  if (resend && lesson?.student_contact) {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Prenotazioni <onboarding@resend.dev>'
      try {
        await resend.emails.send({
            from: fromEmail,
            to: lesson.student_contact,
            subject: 'Aggiornamento Prenotazione',
            html: `<p>Ciao <strong>${lesson.student_name}</strong>,</p><p>Purtroppo non è stato possibile confermare l'orario richiesto. Riprova sul sito con una nuova disponibilità!</p>`,
        })
    } catch(e) { console.error("Errore invio email rifiuto:", e) }
  }

  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true }
}
