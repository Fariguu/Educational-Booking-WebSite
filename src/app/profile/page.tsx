import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/profile-form'
import Link from 'next/link'
import { ArrowLeft, Edit3, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function ProfilePage(props: { readonly searchParams: Promise<{ edit?: string }> | { edit?: string } }) {
  const searchParams = await Promise.resolve(props.searchParams)
  const isEditing = searchParams?.edit === 'true'

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

  const name = profile?.first_name || profile?.last_name 
    ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() 
    : 'Utente Anonimo'

  const renderBadges = () => {
    if (roleData?.teaching_subjects && roleData.teaching_subjects.length > 0) {
      return roleData.teaching_subjects.map((sub: string) => (
        <Badge key={sub} variant="secondary" className="text-xs px-2.5 py-0.5">
          <GraduationCap className="w-3 h-3 mr-1" />
          {sub}
        </Badge>
      ))
    }
    
    if (profile?.role === 'professor') {
      return (
        <Badge variant="outline" className="text-xs px-2.5 py-0.5 text-muted-foreground">
          Nessuna materia inserita
        </Badge>
      )
    }
    
    return null
  }

  if (isEditing) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <div className="mb-6">
          <Link href="/profile" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna al tuo profilo
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Modifica il Tuo Profilo</h1>
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

  // Vista Profilo Pubblico per il proprietario
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto p-4 max-w-4xl mt-4">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Dashboard
        </Link>
      </div>
      <main className="flex-1">
        <section className="relative overflow-hidden border-y bg-gradient-to-br from-indigo-50/60 via-background to-purple-50/40 py-16 md:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
          />
          <div className="container mx-auto px-4 max-w-4xl relative z-10">
            <div className="bg-amber-50 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full inline-flex mb-6 border border-amber-200">
              Vista Pubblica (così gli altri vedono il tuo profilo)
            </div>
            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Avatar */}
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-4xl md:text-5xl shadow-lg flex-shrink-0">
                {name?.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                  {name}
                </h1>

                <div className="flex flex-wrap gap-2 mb-4">
                  {renderBadges()}
                </div>

                <p className="text-muted-foreground leading-relaxed max-w-2xl whitespace-pre-wrap">
                  {profile?.bio || roleData?.bio || 'Non hai ancora inserito una biografia. Clicca su Modifica Profilo per aggiungerla e farti conoscere meglio!'}
                </p>

                {/* CTA */}
                <div className="flex flex-wrap gap-3 mt-8">
                  <Link href="/profile?edit=true">
                    <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md gap-2">
                      <Edit3 className="w-5 h-5" />
                      Modifica Profilo
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
