import BookingCalendar from "@/components/booking-calendar";
import { Metadata } from "next";
import PublicNavbar from "@/components/public-navbar";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Prenota una Lezione",
  description:
    "Scegli uno slot dal calendario e prenota la tua lezione privata in pochi secondi. Nessuna registrazione richiesta.",
};

export default async function PrenotaPage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug;

  // Risolvi slug → UUID
  const supabase = await createClient();
  const { data: professor } = await supabase
    .from('professors')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (!professor) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <PublicNavbar />

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Disponibilità di {professor.name}
          </h1>
          <p className="text-muted-foreground">
            Seleziona un giorno evidenziato nel calendario per vedere gli orari
            disponibili. Gli orari sono mostrati nel tuo fuso orario locale.
          </p>
        </div>
        <BookingCalendar professorId={professor.id} />
      </div>
    </main>
  );
}
