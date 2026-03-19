import Link from "next/link";
import { Metadata } from "next";
import {
  GraduationCap,
  CalendarCheck,
  ShieldCheck,
  Star,
  Mail,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PublicNavbar from "@/components/public-navbar";

export const metadata: Metadata = {
  title: "Prenotazione Lezioni Private",
  description:
    "Prenota la tua lezione privata online o in presenza in pochi click. Senza registrazione, senza stress.",
};

const features = [
  {
    icon: GraduationCap,
    title: "Insegnamento Personalizzato",
    description:
      "Ogni lezione è calibrata sulle esigenze dello studente: si parte dal livello attuale per raggiungere gli obiettivi fissati.",
  },
  {
    icon: CalendarCheck,
    title: "Orari Flessibili",
    description:
      "Scegli la data e l'orario che preferisci tra gli slot disponibili. Nessun vincolo fisso.",
  },
  {
    icon: ShieldCheck,
    title: "Nessuna Registrazione",
    description:
      "Basta nome ed email per prenotare. La tua privacy è garantita, i tuoi dati non vengono ceduti a terzi.",
  },
];

import { createClient } from "@/utils/supabase/server";
import SearchInput from "@/components/search-input";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> | { q?: string } }) {
  const resolvedParams = await Promise.resolve(searchParams);
  const q = resolvedParams.q || "";

  const supabase = await createClient();
  let query = supabase.from("professors").select("id, name, bio, subjects");
  
  if (q) {
    query = query.ilike("name", `%${q}%`);
    // Note: To search in an array 'subjects' or text 'bio', you'd use .or()
    // query = query.or(`name.ilike.%${q}%,bio.ilike.%${q}%`);
  }

  const { data: professors, error } = await query;
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 md:py-36">
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

      {/* ── PROFESSORS LIST ──────────────────────────────────────────── */}
      <section className="py-20 bg-muted/40 border-y flex-1">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              {q ? `Risultati per "${q}"` : "Tutti i docenti responsabili"}
            </h2>
            <p className="text-muted-foreground">
              {professors && professors.length > 0 
                ? `Trovati ${professors.length} professionisti pronti ad aiutarti.` 
                : "Nessun docente trovato con questa ricerca."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professors?.map((prof) => (
              <div
                key={prof.id}
                className="bg-card rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl flex-shrink-0">
                    {prof.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold inset-0 text-lg">{prof.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {prof.subjects?.map((sub: string) => (
                         <Badge key={sub} variant="secondary" className="text-[10px] px-1.5 py-0">{sub}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
                  {prof.bio || "Insegnante qualificato e pronto ad aiutarti a raggiungere i tuoi obiettivi."}
                </p>

                <div className="flex gap-2 mt-auto">
                    <Link href={`/${prof.id}/prenota`} className="flex-1">
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                         Prenota
                      </Button>
                    </Link>
                    <Link href={`/${prof.id}/contatti`} className="flex-1">
                      <Button variant="outline" className="w-full">
                         Contatta
                      </Button>
                    </Link>
                </div>
              </div>
            ))}
          </div>
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
