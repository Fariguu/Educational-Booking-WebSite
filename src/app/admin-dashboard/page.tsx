import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SuperadminDashboard from '@/components/superadmin-dashboard'
import PublicNavbar from '@/components/public-navbar'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?auth=login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin' && profile?.role !== 'admin') {
     // Non autorizzato
     redirect('/')
  }

  // Fetch iniziali
  const { data: applications, error } = await supabase
    .from('professor_applications')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <PublicNavbar />
      
      <main className="container mx-auto px-4 py-10 flex-1">
        <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">Pannello di Amministrazione</h1>
            <p className="text-muted-foreground mt-2">Gestisci le candidature dei nuovi docenti e monitora la piattaforma.</p>
        </div>

        {error ? (
            <p className="text-destructive font-medium">Errore durante il caricamento delle candidature.</p>
        ) : (
            <SuperadminDashboard initialApplications={applications || []} />
        )}
      </main>
    </div>
  )
}
