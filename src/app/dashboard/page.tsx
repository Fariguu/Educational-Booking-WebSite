import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SuperAdminDashboardView from '@/components/dashboard/superadmin-view'
import AdminDashboardView from '@/components/dashboard/admin-view'
import ProfessorDashboardView from '@/components/dashboard/professor-view'
import { Loader2, Mail } from 'lucide-react'
import StudentDashboardView from '@/components/dashboard/student-view'
import { getContactMessages } from '@/app/actions/contact'

export const dynamic = 'force-dynamic'

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
      const [
        { data: adminProfiles },
        { data: professorProfiles },
        { data: studentProfiles },
        { data: applications },
        { data: contactMessages }
      ] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, email, phone').eq('role', 'admin').order('first_name'),
        supabase.from('profiles').select('id, first_name, last_name, email').eq('role', 'professor').order('first_name'),
        supabase.from('profiles').select('id, first_name, last_name, email').in('role', ['user', 'student']).order('first_name'),
        supabase.from('professor_applications').select('*').order('created_at', { ascending: false }),
        getContactMessages()
      ])

      return (
        <SuperAdminDashboardView
          user={user}
          stats={{
            admins: adminProfiles?.length ?? 0,
            professors: professorProfiles?.length ?? 0,
            students: studentProfiles?.length ?? 0
          }}
          admins={adminProfiles ?? []}
          professors={professorProfiles ?? []}
          students={studentProfiles ?? []}
          initialApplications={applications ?? []}
          contactMessages={contactMessages ?? []}
        />
      )
    }
    case 'admin': {
      const [{ data: professors }, { data: students }] = await Promise.all([
        supabase.from('professors').select('*, profiles!inner(*)'),
        supabase.from('profiles').select('*').in('role', ['user', 'student']).order('created_at', { ascending: false })
      ])
      
      const mappedProfessors = professors?.map((p: any) => ({
         ...p,
         name: `${p.profiles?.first_name} ${p.profiles?.last_name || ''}`.trim(),
         email: p.profiles?.email,
         phone: p.profiles?.phone,
         subjects: p.teaching_subjects
      })).sort((a: any, b: any) => a.name.localeCompare(b.name)) || []

      return <AdminDashboardView user={user} professors={mappedProfessors} students={students || []} />
    }
    case 'professor': {
      const [{ data: lessons }, { data: studentsHours }, { data: contactMessages }, { data: profData }] = await Promise.all([
        supabase.from('lessons').select('*, students(profiles(first_name, last_name, email))').eq('professor_id', user.id).order('start_time', { ascending: true }),
        supabase.rpc('get_professor_student_hours', { p_professor_id: user.id, p_year: new Date().getFullYear(), p_month: new Date().getMonth() + 1 }),
        getContactMessages(user.id),
        supabase.from('professors').select('*, profiles!inner(*)').eq('id', user.id).single()
      ])
      
      const mappedLessons = lessons?.map((l: any) => ({
        ...l,
        student_name: l.students?.profiles 
          ? `${l.students.profiles.first_name} ${l.students.profiles.last_name || ''}`.trim() 
          : (l.guest_name || null),
        student_contact: l.students?.profiles?.email || (l.guest_email || null)
      })) || []

      const pData = profData ? {
        ...profData,
        name: `${profData.profiles?.first_name} ${profData.profiles?.last_name || ''}`.trim(),
        bio: profData.profiles?.bio,
        subjects: profData.teaching_subjects
      } : {}

      return (
        <ProfessorDashboardView 
          user={user} 
          lessons={mappedLessons} 
          studentsHours={studentsHours || []} 
          contactMessages={contactMessages || []}
          profData={pData}
        />
      )
    }
    case 'student':
    case 'user': {
      const [{ data: followedProfessors }, { data: hoursData }] = await Promise.all([
        supabase.from('lessons').select('professor_id, professors(*, profiles!inner(first_name, last_name, email, avatar_url))').eq('student_id', user.id).eq('status', 'confirmed'),
        supabase.rpc('get_monthly_hours', { p_user_id: user.id, p_year: new Date().getFullYear(), p_month: new Date().getMonth() + 1 })
      ])

      // Filtra professori unici
      const uniqueProfs = Array.from(new Set((followedProfessors || []).map((p: any) => p.professor_id))).map(id => {
        const prof = (followedProfessors || []).find((p: any) => p.professor_id === id)?.professors as any
        if (!prof) return null;
        return {
           ...prof,
           name: `${prof.profiles?.first_name} ${prof.profiles?.last_name || ''}`.trim(),
           email: prof.profiles?.email,
           avatar_url: prof.profiles?.avatar_url
        }
      }).filter(Boolean)

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
