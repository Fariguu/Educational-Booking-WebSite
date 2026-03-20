import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import PublicNavbar from "@/components/public-navbar"
import ProfessorApplicationForm from "@/components/professor-application-form"

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
    const { data: application } = await supabase
      .from('professor_applications')
      .select('admin_notes')
      .eq('id', user.id)
      .single()

    return (
        <div className="min-h-screen bg-muted/20 flex flex-col">
          <PublicNavbar />
          <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center p-8 bg-indigo-50 border-indigo-100 rounded-2xl border max-w-md shadow-sm">
                  <h1 className="text-2xl font-bold mb-2 text-indigo-900">Richiesta in elaborazione</h1>
                  <p className="text-indigo-700 mb-6 text-sm">La tua candidatura è attualmente in fase di revisione da parte del nostro team amministrativo.</p>
                  
                  {application?.admin_notes && (
                    <div className="bg-white p-4 rounded-xl border border-indigo-200 text-left shadow-inner">
                        <span className="text-[10px] font-bold uppercase text-indigo-400 block mb-1">Feedback dall'Amministrazione</span>
                        <p className="text-sm text-indigo-900 italic">"{application.admin_notes}"</p>
                        <p className="text-[10px] text-indigo-400 mt-2">Rispondi via email o aggiorna il tuo profilo se richiesto.</p>
                    </div>
                  )}
                  
                  {!application?.admin_notes && (
                    <p className="text-xs text-indigo-400 mt-4 italic">Verrai contattato non appena avremo novità.</p>
                  )}
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
