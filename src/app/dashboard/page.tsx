import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SuperAdminDashboardView from '@/components/dashboard/superadmin-view'
import AdminDashboardView from '@/components/dashboard/admin-view'
import ProfessorDashboardView from '@/components/dashboard/professor-view'
import { Loader2, Mail } from 'lucide-react'
import StudentDashboardView from '@/components/dashboard/student-view'
import { getContactMessages } from '@/app/actions/contact'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/?auth=login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-destructive/5 rounded-3xl border border-destructive/10">
        <h2 className="text-xl font-bold text-destructive mb-2">Profilo non trovato</h2>
        <p className="text-muted-foreground">Non abbiamo trovato un profilo associato al tuo account. Contatta il supporto se il problema persiste.</p>
      </div>
    )
  }

  switch (profile.role) {
    case 'superadmin': {
      const [{ count: adminCount }, { count: professorCount }, { count: studentCount }, { data: applications }, { data: contactMessages }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'professor'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'), // 'user' represents students
        supabase.from('professor_applications').select('*').order('created_at', { ascending: false }),
        getContactMessages() // General messages (professor_id is null)
      ])
      
      return (
        <SuperAdminDashboardView 
          user={user} 
          stats={{
            admins: adminCount || 0,
            professors: professorCount || 0,
            students: studentCount || 0
          }}
          initialApplications={applications || []}
          contactMessages={contactMessages || []}
        />
      )
    }
    case 'admin': {
      const [{ data: professors }, { data: students }] = await Promise.all([
        supabase.from('professors').select('*').order('name', { ascending: true }),
        supabase.from('profiles').select('*').eq('role', 'user').order('created_at', { ascending: false })
      ])
      return <AdminDashboardView user={user} professors={professors || []} students={students || []} />
    }
    case 'professor': {
      const [{ data: lessons }, { data: studentsHours }, { data: contactMessages }, { data: profData }] = await Promise.all([
        supabase.from('lessons').select('*').eq('professor_id', user.id).order('start_time', { ascending: true }),
        supabase.rpc('get_professor_student_hours', { p_professor_id: user.id, p_year: new Date().getFullYear(), p_month: new Date().getMonth() + 1 }),
        getContactMessages(user.id),
        supabase.from('professors').select('*').eq('id', user.id).single()
      ])
      
      return (
        <ProfessorDashboardView 
          user={user} 
          lessons={lessons || []} 
          studentsHours={studentsHours || []} 
          contactMessages={contactMessages || []}
          profData={profData || {}}
        />
      )
    }
    case 'student':
    case 'user': {
      const [{ data: followedProfessors }, { data: hoursData }] = await Promise.all([
        supabase.from('lessons').select('professor_id, professors(*)').eq('student_id', user.id).eq('status', 'confirmed'),
        supabase.rpc('get_monthly_hours', { p_user_id: user.id, p_year: new Date().getFullYear(), p_month: new Date().getMonth() + 1 })
      ])

      // Filtra professori unici
      const uniqueProfs = Array.from(new Set((followedProfessors || []).map(p => p.professor_id))).map(id => {
        return (followedProfessors || []).find(p => p.professor_id === id)?.professors
      })

      return (
        <StudentDashboardView 
          user={user} 
          professors={uniqueProfs || []} 
          monthlyHours={hoursData?.[0]?.total_hours || 0}
        />
      )
    }
    case 'pending_professor': {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 shadow-sm max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-indigo-900 mb-2">Candidatura in Revisione</h2>
          <p className="text-muted-foreground mb-6">
            Stiamo esaminando il tuo profilo. Riceverai una risposta al più presto.
          </p>
          <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-sm w-full flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <p className="text-sm text-indigo-800 text-left">
              L'amministrazione ti contatterà direttamente via email per comunicarti l'esito della candidatura o per richiedere eventuali informazioni aggiuntive.
            </p>
          </div>
        </div>
      )
    }
    default:
      return (
        <div className="p-6 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
          <h2 className="text-lg font-bold">Ruolo Non Riconosciuto</h2>
          <p>Il tuo account è in fase di revisione o il ruolo non è stato ancora assegnato correttamente.</p>
        </div>
      )
  }
}
