import BookingDashboard from "@/components/booking-dashboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 md:py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary">Prenotazione Lezioni</h1>
          {/* Aggiungeremo qui eventuali link per login prof */}
        </div>
      </header>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">Disponibilità</h2>
          <p className="text-muted-foreground">
            Seleziona uno degli slot disponibili nel calendario e prenota la tua lezione.
            Gli orari sono mostrati nel tuo fuso orario locale.
          </p>
        </div>
        <BookingDashboard />
      </div>
    </main>
  );
}
