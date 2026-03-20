import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Home, LogOut, User as UserIcon, ArrowLeft } from 'lucide-react'
import LogoutButton from '@/components/logout-button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/?auth=login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name, last_name')
    .eq('id', user.id)
    .single()

  const fullName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}` 
    : user.email?.split('@')[0] || 'User'
  
  const roleDisplay = profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1) || 'User'

  return (
    <div className="min-h-screen bg-muted/10 flex flex-col">
      <header className="bg-background border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-1.5 font-bold text-xl text-indigo-600 hover:text-indigo-700 transition-colors group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <Home className="w-6 h-6" />
            <span className="hidden sm:inline">Torna al Sito</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium border-l pl-6">
            <Link href="/dashboard" className="text-foreground hover:text-indigo-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
              Il Mio Profilo
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold leading-none">{fullName}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{roleDisplay}</div>
          </div>
          <Link href="/profile" className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 hover:bg-indigo-200 transition-colors">
            <UserIcon className="w-5 h-5" />
          </Link>
          <LogoutButton />
        </div>
      </header>
      
      <main className="flex-1 p-6 md:p-10 container mx-auto">
        {children}
      </main>
    </div>
  )
}
