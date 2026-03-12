import { Metadata } from "next";
import Link from "next/link";
import PublicNavbar from "@/components/public-navbar";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Informativa sulla privacy per il trattamento dei dati personali ai sensi del GDPR (Reg. EU 2016/679).",
};

export default function PrivacyPage() {
  const lastUpdated = "12 marzo 2026";

  return (
    <main className="min-h-screen bg-background">
      <PublicNavbar />

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-2">
            Documento legale
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-sm">
            Ultimo aggiornamento: {lastUpdated}
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-muted-foreground leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              1. Titolare del Trattamento
            </h2>
            <p>
              Il titolare del trattamento dei dati personali è il docente privato
              che gestisce questo sito di prenotazioni (di seguito "il Professore").
              Per qualsiasi richiesta relativa ai tuoi dati personali, puoi
              contattarlo tramite il{" "}
              <Link href="/contatti" className="text-indigo-600 hover:underline">
                modulo di contatto
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              2. Dati Raccolti e Finalità
            </h2>
            <p>
              Il sito raccoglie i seguenti dati personali, esclusivamente forniti
              volontariamente dall&apos;utente:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>
                <strong className="text-foreground">Prenotazione lezione</strong>: nome
                completo, indirizzo email, note opzionali. Finalità: gestire la
                richiesta di prenotazione e comunicare l&apos;esito.
              </li>
              <li>
                <strong className="text-foreground">Modulo di contatto</strong>: nome
                completo, indirizzo email, messaggio. Finalità: rispondere alla
                richiesta o domanda inviata.
              </li>
            </ul>
            <p className="mt-3">
              Non vengono raccolti dati sensibili, dati di minori o dati di
              profilazione a fini commerciali.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              3. Base Giuridica del Trattamento
            </h2>
            <p>
              Il trattamento dei dati si basa sul consenso esplicito dell&apos;utente,
              espresso mediante la spunta della casella di accettazione privacy
              presente nei moduli del sito (art. 6, par. 1, lett. a del GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              4. Conservazione dei Dati
            </h2>
            <p>
              I dati relativi alle prenotazioni e ai messaggi di contatto vengono
              conservati per il tempo strettamente necessario alla gestione della
              richiesta e comunque non oltre <strong className="text-foreground">12 mesi</strong> dalla
              raccolta, salvo obblighi di legge.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              5. Terze Parti e Trasferimento Dati
            </h2>
            <p>
              Per il funzionamento del sito vengono utilizzati i seguenti servizi
              di terze parti, ciascuno con propria informativa privacy:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>
                <strong className="text-foreground">Supabase</strong> – database
                e autenticazione (server in EU). Informativa:{" "}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  supabase.com/privacy
                </a>
              </li>
              <li>
                <strong className="text-foreground">Cloudflare Turnstile</strong> –
                protezione anti-spam (nessun dato biometrico raccolto). Informativa:{" "}
                <a
                  href="https://www.cloudflare.com/privacypolicy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  cloudflare.com/privacypolicy
                </a>
              </li>
              <li>
                <strong className="text-foreground">Vercel</strong> – hosting e
                analytics anonimi. Informativa:{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  vercel.com/legal/privacy-policy
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              6. Diritti dell&apos;Interessato
            </h2>
            <p>
              Ai sensi del GDPR (artt. 15-22), hai il diritto di:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-3">
              <li>Accedere ai tuoi dati personali;</li>
              <li>Ottenere la rettifica o la cancellazione dei dati;</li>
              <li>Limitare od opporti al trattamento;</li>
              <li>Richiedere la portabilità dei dati;</li>
              <li>Revocare il consenso in qualsiasi momento senza pregiudizio.</li>
            </ul>
            <p className="mt-3">
              Per esercitare questi diritti, scrivi tramite il{" "}
              <Link href="/contatti" className="text-indigo-600 hover:underline">
                modulo di contatto
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              7. Cookie
            </h2>
            <p>
              Il sito utilizza esclusivamente cookie tecnici necessari al
              funzionamento (sessione di autenticazione). Non vengono utilizzati
              cookie di profilazione o di tracciamento di terze parti.
            </p>
          </section>

          <section className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Per qualsiasi domanda o chiarimento,{" "}
              <Link href="/contatti" className="text-indigo-600 hover:underline">
                contattaci
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
