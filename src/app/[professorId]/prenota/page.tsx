import BookingCalendar from "@/components/booking-calendar";
import { Metadata } from "next";
import PublicNavbar from "@/components/public-navbar";

export const metadata: Metadata = {
  title: "Prenota una Lezione",
  description:
    "Scegli uno slot dal calendario e prenota la tua lezione privata in pochi secondi. Nessuna registrazione richiesta.",
};

export default async function PrenotaPage({ params }: { readonly params: Promise<{ professorId: string }> | { professorId: string } }) {
  // Support for Next.js 15+ async params or Next.js 14 sync params
  const resolvedParams = await Promise.resolve(params);
  const professorId = resolvedParams.professorId;

  return (
    <main className="min-h-screen bg-background">
      <PublicNavbar />

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Disponibilità
          </h1>
          <p className="text-muted-foreground">
            Seleziona un giorno evidenziato nel calendario per vedere gli orari
            disponibili. Gli orari sono mostrati nel tuo fuso orario locale.
          </p>
        </div>
        <BookingCalendar professorId={professorId} />
      </div>
    </main>
  );
}
