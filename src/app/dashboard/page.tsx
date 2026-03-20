import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SuperAdminDashboardView from '@/components/dashboard/superadmin-view'
import AdminDashboardView from '@/components/dashboard/admin-view'
import ProfessorDashboardView from '@/components/dashboard/professor-view'
import StudentDashboardView from '@/components/dashboard/student-view'

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
      <div className="p-4 bg-destructive/15 text-destructive rounded-md">
        Profilo non trovato. Contatta il supporto.
      </div>
    )
  }

  switch (profile.role) {
    case 'superadmin': {
      const [{ count: adminCount }, { count: professorCount }, { count: studentCount }, { data: applications }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'professor'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'), // 'user' represents students
        supabase.from('professor_applications').select('*').order('created_at', { ascending: false })
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
      const [{ data: lessons }, { data: studentsHours }] = await Promise.all([
        supabase.from('lessons').select('*').eq('professor_id', user.id).order('start_time', { ascending: true }),
        supabase.rpc('get_professor_student_hours', { p_professor_id: user.id, p_year: new Date().getFullYear(), p_month: new Date().getMonth() + 1 })
      ])
      
      return (
        <ProfessorDashboardView 
          user={user} 
          lessons={lessons || []} 
          studentsHours={studentsHours || []} 
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
    default:
      return (
        <div className="p-6 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
          <h2 className="text-lg font-bold">Ruolo Non Riconosciuto</h2>
          <p>Il tuo account è in fase di revisione o il ruolo non è stato ancora assegnato correttamente.</p>
        </div>
      )
  }
}
