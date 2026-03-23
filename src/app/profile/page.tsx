import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/profile-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/?auth=login')
  }

  // Fetch complete profile and specific role data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  let roleData = null
  if (profile?.role === 'professor') {
    const { data } = await supabase.from('professors').select('*').eq('id', user.id).single()
    roleData = data
  } else if (profile?.role === 'user' || profile?.role === 'student') {
    const { data } = await supabase.from('students').select('*').eq('id', user.id).single()
    roleData = data
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Il Tuo Profilo</h1>
        <p className="text-muted-foreground mt-2">Gestisci i tuoi dati personali e le informazioni che verranno mostrate pubblicamente.</p>
      </div>
      
      <ProfileForm 
        profile={profile || {}} 
        roleData={roleData || {}} 
        userEmail={user.email || ''} 
      />
    </div>
  )
}
