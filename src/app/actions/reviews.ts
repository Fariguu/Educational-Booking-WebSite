'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReviewAction(
  professorId: string, 
  rating: number, 
  comment: string
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Devi effettuare l\'accesso per lasciare una recensione.' }
  }

  // Controllo validità rating
  if (rating < 1 || rating > 5) {
    return { error: 'Il punteggio deve essere compreso tra 1 e 5 stelle.' }
  }

  const { error: insertError } = await supabase
    .from('reviews')
    .insert({
      professor_id: professorId,
      student_id: user.id,
      rating: rating,
      comment: comment || null
    })

  if (insertError) {
    // Gestione dell'errore di violazione policy o chiave univoca
    if (insertError.code === '23505') {
      return { error: 'Hai già lasciato una recensione per questo docente.' }
    }
    // RLS fallisce se lo studente non ha fatto lezioni confermate passate
    if (insertError.code === '42501' || insertError.message.includes('policy')) {
      return { error: 'Puoi recensire solo i docenti con cui hai completato almeno una lezione.' }
    }
    return { error: 'Errore durante il salvataggio della recensione: ' + insertError.message }
  }

  // Revalida le cache in modo che il profilo e la pagina di ricerca si aggiornino
  revalidatePath('/professori/[slug]', 'page')
  revalidatePath('/cerca')

  return { success: true }
}

export async function getProfessorReviewsAction(professorId: string) {
  const supabase = await createClient()
  
  // Otteniamo la lista delle recensioni del professore, con i dati base dell'utente
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      profiles:student_id (
        first_name,
        last_name
      )
    `)
    .eq('professor_id', professorId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore getProfessorReviewsAction:', error)
    return { data: [], error: error.message }
  }

  return { data: data || [], error: null }
}
