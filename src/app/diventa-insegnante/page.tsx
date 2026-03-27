import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import PublicNavbar from "@/components/public-navbar"
import ProfessorApplicationForm from "@/components/professor-application-form"
import { Mail } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function DiventaInsegnantePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/?auth=login')
  }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'professor') {
    return (
        <div className="min-h-screen bg-muted/20 flex flex-col">
          <PublicNavbar />
          <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center p-8 bg-white rounded-2xl border shadow-sm max-w-md">
                  <h1 className="text-2xl font-bold mb-2">Sei già un insegnante!</h1>
                  <p className="text-muted-foreground">Il tuo account è già configurato come docente.</p>
              </div>
          </div>
        </div>
    )
  }

  if (profile?.role === 'pending_professor') {
    return (
        <div className="min-h-screen bg-muted/20 flex flex-col">
          <PublicNavbar />
          <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="w-full max-w-lg text-center p-8 bg-indigo-50 border-indigo-100 rounded-2xl border shadow-sm">
                  <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2 text-indigo-900">Richiesta in elaborazione</h1>
                  <p className="text-indigo-700 text-sm">La tua candidatura è attualmente in fase di revisione. Ti contatteremo direttamente via email con la risposta o per ulteriori informazioni.</p>
              </div>
          </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <PublicNavbar />
      
      <main className="container mx-auto px-4 mt-10">
        <ProfessorApplicationForm />
      </main>
    </div>
  )
}
