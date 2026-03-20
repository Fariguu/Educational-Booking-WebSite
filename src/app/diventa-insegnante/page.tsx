import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import PublicNavbar from "@/components/public-navbar"
import ProfessorApplicationForm from "@/components/professor-application-form"
import { ApplicationChat } from "@/components/application-chat"

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
              <div className="w-full max-w-2xl text-center p-8 bg-indigo-50 border-indigo-100 rounded-2xl border shadow-sm">
                  <h1 className="text-2xl font-bold mb-2 text-indigo-900">Richiesta in elaborazione</h1>
                  <p className="text-indigo-700 mb-8 text-sm">La tua candidatura è attualmente in fase di revisione da parte del nostro team amministrativo.</p>
                  
                  <div className="bg-white p-6 rounded-2xl border border-indigo-200 text-left shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="p-1 px-2 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded">Conversazione con Admin</span>
                      </div>
                      <ApplicationChat 
                        applicationId={user.id} 
                        currentUserId={user.id} 
                        userRole="pending_professor" 
                      />
                  </div>
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
