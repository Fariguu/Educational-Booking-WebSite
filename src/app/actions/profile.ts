'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const ProfileUpdateSchema = z.object({
  firstName: z.string().min(2, "Nome non valido"),
  lastName: z.string().min(2, "Cognome non valido"),
  bio: z.string().optional(),
  phone: z.string().optional(),
  publicEmail: z.string().email("Email pubblica non valida").optional().or(z.literal('')),
  subjects: z.array(z.string()).optional(),
})

export async function updateProfile(formData: z.infer<typeof ProfileUpdateSchema>) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non sei autenticato." }

  const validated = ProfileUpdateSchema.safeParse(formData)
  if (!validated.success) return { error: validated.error.issues[0].message }

  const { firstName, lastName, bio, phone, publicEmail, subjects } = validated.data

  // 1. Update Profile as individual fields
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      first_name: firstName,
      last_name: lastName,
      bio: bio,
      phone: phone,
      teaching_subjects: subjects || [],
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (profileError) {
    return { error: "Errore durante l'aggiornamento del profilo." }
  }

  // 2. Fetch current role to see where else to sync
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // 3. Sync to role-specific tables
  if (profile?.role === 'professor') {
    const { error } = await supabase
      .from('professors')
      .update({
        name: `${firstName} ${lastName}`,
        bio: bio,
        phone: phone,
        email: publicEmail || user.email,
        subjects: subjects || []
      })
      .eq('id', user.id)
    
    if (error) console.error("Error syncing to professors:", error)
  } else if (profile?.role === 'user' || profile?.role === 'student') {
     const { error } = await supabase
      .from('students')
      .update({
        first_name: firstName,
        last_name: lastName,
        bio: bio,
        phone: phone,
        email: publicEmail || user.email
      })
      .eq('id', user.id)
    
    if (error) console.error("Error syncing to students:", error)
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  
  return { success: true }
}
