import BookingDashboard from "@/components/booking-dashboard";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Prenota una Lezione | Ripetizioni Private",
  description:
    "Scegli uno slot disponibile e prenota la tua lezione privata in pochi secondi. Nessuna registrazione richiesta.",
};

export default function PrenotaPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla home
          </Link>
          <h1 className="text-base font-semibold tracking-tight">
            Prenotazione Lezioni
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">
            Disponibilità
          </h2>
          <p className="text-muted-foreground">
            Seleziona uno degli slot disponibili e prenota la tua lezione. Gli
            orari sono mostrati nel tuo fuso orario locale.
          </p>
        </div>
        <BookingDashboard />
      </div>
    </main>
  );
}
