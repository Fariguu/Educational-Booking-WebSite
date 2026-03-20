import Link from "next/link";
import { Metadata } from "next";
import { Star, Mail, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PublicNavbar from "@/components/public-navbar";
import SearchInput from "@/components/search-input";

export const metadata: Metadata = {
  title: "Prenotazione Lezioni Private",
  description:
    "Prenota la tua lezione privata online o in presenza in pochi click. Senza registrazione, senza stress.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 md:py-36 flex-1 flex flex-col justify-center">
        {/* Blob decorativo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, #6366f1 0%, #8b5cf6 40%, transparent 70%)",
          }}
        />
        {/* Griglia sottofondo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="container mx-auto px-4 relative z-10 max-w-3xl text-center">
          <Badge
            variant="outline"
            className="mb-6 px-3 py-1 text-indigo-600 border-indigo-200 bg-indigo-50"
          >
            <Star className="w-3 h-3 mr-1.5 fill-indigo-400 text-indigo-400" />
            Lezioni individuali su misura
          </Badge>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Trova il tuo <span className="text-indigo-600">insegnante</span> ideale
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Cerca tra i nostri docenti e prenota la tua lezione privata in pochi click. {" "}
            <strong className="text-foreground">Senza registrazione</strong>.
          </p>

          <SearchInput />
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t py-8 bg-card">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            PrenotaLezioni
          </div>
          <div className="flex items-center gap-5">
            <Link href="/contatti" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Contatti
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Tutti i diritti riservati</p>
        </div>
      </footer>
    </div>
  );
}
