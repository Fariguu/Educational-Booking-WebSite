import { createClient } from './supabase/server'

export type UserRole = 'user' | 'student' | 'professor' | 'pending_professor' | 'admin' | 'superadmin'

/**
 * Verifica se l'utente attuale è autenticato e ha uno dei ruoli richiesti.
 * @param allowedRoles Array di ruoli permessi. Se vuoto, basta l'autenticazione.
 * @returns L'oggetto user di Supabase e il suo profilo, oppure lancia un errore.
 */
export async function requireRole(allowedRoles: UserRole[] = []) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Non autenticato")
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    throw new Error("Profilo non trovato")
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    throw new Error("Non autorizzato (Permessi insufficienti)")
  }

  return { user, profile }
}
