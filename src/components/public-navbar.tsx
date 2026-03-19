import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Navbar pubblica condivisa tra Landing Page (/), Prenota (/prenota) e Contatti (/contatti).
 * Server Component — nessuna interattività richiesta.
 */
export default function PublicNavbar() {
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
        </nav>

        {/* CTA & Auth */}
        <div className="flex items-center gap-4">
          <Link href="/?auth=login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Accedi
          </Link>
          <Link href="/">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Cerca
              <ArrowRight className="ml-1.5 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
