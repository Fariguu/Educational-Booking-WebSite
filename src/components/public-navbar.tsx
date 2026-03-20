import Link from "next/link";
import { BookOpen, ArrowRight, LayoutDashboard, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import LogoutButton from "./logout-button";

/**
 * Navbar pubblica condivisa tra Landing Page (/), Prenota (/prenota) e Contatti (/contatti).
 * Server Component — nessuna interattività richiesta.
 */
export default async function PublicNavbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = profile?.role || null
  }

  const getDashboardUrl = () => {
    if (role === 'superadmin' || role === 'admin') return '/admin-dashboard'
    if (role === 'professor') return '/admin'
    return null
  }

  const dashboardUrl = getDashboardUrl()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span>PrenotaLezioni</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted-foreground mr-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            Cerca Docente
          </Link>
          {user && role === 'user' && (
            <Link href="/diventa-insegnante" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              Lavora con noi
            </Link>
          )}
        </nav>

        {/* CTA & Auth */}
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link href="/?auth=login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                Accedi
              </Link>
              <Link href="/">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                  Cerca
                  <ArrowRight className="ml-1.5 w-4 h-4" />
                </Button>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              {dashboardUrl && (
                <Link href={dashboardUrl}>
                  <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              )}
              <LogoutButton />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
