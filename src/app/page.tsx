import Link from "next/link";
import { Metadata } from "next";
import {
  GraduationCap,
  CalendarCheck,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  Star,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Ripetizioni Private | Lezioni di Qualità",
  description:
    "Prenota la tua lezione privata online o in presenza in pochi click. Senza registrazione, senza stress.",
};

const features = [
  {
    icon: GraduationCap,
    title: "Esperienza Comprovata",
    description:
      "Anni di insegnamento con un metodo chiaro, personalizzato sulle esigenze di ogni studente.",
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

const subjects = [
  "Matematica",
  "Fisica",
  "Analisi",
  "Algebra",
  "Geometria",
  "Statistica",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── NAVBAR ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>RipetizioniPro</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#about" className="hover:text-foreground transition-colors">
              Chi sono
            </Link>
            <Link href="/contatti" className="hover:text-foreground transition-colors">
              Contatti
            </Link>
          </nav>

          {/* CTA */}
          <Link href="/prenota">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Prenota ora
              <ArrowRight className="ml-1.5 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

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
            Ripetizioni private di{" "}
            <span className="text-indigo-600">Matematica</span> e{" "}
            <span className="text-indigo-600">Fisica</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Prenota una sessione online o in presenza in pochi click.{" "}
            <strong className="text-foreground">Senza registrazione</strong>,
            senza attese.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/prenota">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 shadow-lg shadow-indigo-200"
              >
                Vedi le disponibilità
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="#about">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8"
              >
                Scopri di più
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section className="py-20 bg-muted/40 border-y">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Perché scegliermi?
            </h2>
            <p className="text-muted-foreground">
              Un servizio pensato per rendere le ripetizioni semplici ed
              efficaci.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-card rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ─────────────────────────────────────────────── */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex flex-col md:flex-row items-center gap-12">
            {/* Avatar illustrativo */}
            <div className="flex-shrink-0">
              <div className="relative w-44 h-44 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center border-4 border-white shadow-xl">
                <GraduationCap className="w-20 h-20 text-indigo-400" />
                {/* Decorazione */}
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow">
                  <Star className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="text-center md:text-left">
              <Badge
                variant="outline"
                className="mb-3 text-indigo-600 border-indigo-200 bg-indigo-50"
              >
                Il tuo insegnante
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                Ciao, sono il Prof.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Ho una passione per la matematica e la fisica che cerco di
                trasmettere ai miei studenti con un metodo chiaro e diretto.
                Aiuto studenti delle scuole medie, superiori e universitari a
                superare le difficoltà e a ritrovare fiducia nelle proprie
                capacità.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Ogni lezione è personalizzata: partiamo da dove sei e arriviamo
                dove vuoi essere.
              </p>

              {/* Materie */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {subjects.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────── */}
      <section className="py-20 bg-indigo-600">
        <div className="container mx-auto px-4 max-w-3xl text-center text-white">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            Pronto a fare il salto di qualità?
          </h2>
          <p className="text-indigo-100 mb-8 text-lg">
            Scegli uno slot libero e prenota la tua prima lezione. È gratis
            farlo — paghi solo se sei soddisfatto.
          </p>
          <Link href="/prenota">
            <Button
              size="lg"
              variant="secondary"
              className="px-10 font-semibold shadow-xl hover:bg-white/90"
            >
              Prenota la prima lezione
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t py-8 bg-card">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            RipetizioniPro
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
