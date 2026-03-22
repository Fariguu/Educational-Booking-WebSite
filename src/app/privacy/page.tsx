import { Metadata } from "next";
import Link from "next/link";
import PublicNavbar from "@/components/public-navbar";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Informativa sulla privacy per il trattamento dei dati personali ai sensi del GDPR (Reg. EU 2016/679).",
};

export default function PrivacyPage() {
  const lastUpdated = "20 marzo 2026";

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
              Il titolare del trattamento dei dati è{" "}
              <strong className="text-foreground">Gabriele Vitocosmo Farigu</strong>,
              contattabile all&apos;indirizzo email:{" "}
              <a href="mailto:farigugabriele@gmail.com" className="text-indigo-600 hover:underline">
                farigugabriele@gmail.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              2. Dati Raccolti
            </h2>
            <p>
              Raccogliamo i seguenti tipi di dati per fornirti i nostri servizi:
            </p>
            <div className="space-y-4 mt-3">
              <div>
                <h3 className="font-semibold text-foreground">A. Dati degli Utenti Registrati</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Dati Identificativi: Nome, Cognome.</li>
                  <li>Dati di Contatto: Indirizzo Email, Numero di Telefono.</li>
                  <li>Dati Profilo: Biografia, Materie di insegnamento (solo per docenti).</li>
                  <li>Dati di Autenticazione: Password (criptata tramite Supabase).</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">B. Dati delle Prenotazioni</h3>
                <p>Nome dello studente, Email di contatto, Note opzionali, Data e Ora della lezione.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">C. Modulo di Contatto</h3>
                <p>Nome, Email, Messaggio inviato.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              3. Finalità del Trattamento
            </h2>
            <p>I dati vengono trattati esclusivamente per:</p>
            <ol className="list-decimal list-inside space-y-1 mt-3">
              <li>Consentire la registrazione e l&apos;accesso alla piattaforma.</li>
              <li>Gestire le prenotazioni tra studenti e docenti.</li>
              <li>Inviare notifiche email transazionali (conferme, promemoria, alert sicurezza).</li>
              <li>Rispondere alle richieste inviate tramite il modulo di contatto.</li>
              <li>Garantire la sicurezza del sito tramite protezione anti-spam.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              4. Base Giuridica
            </h2>
            <p>Il trattamento dei tuoi dati si basa su:</p>
            <ul className="list-disc list-inside space-y-1 mt-3">
              <li>
                <strong className="text-foreground">Esecuzione di un contratto</strong>: Per la gestione delle prenotazioni e dell&apos;account.
              </li>
              <li>
                <strong className="text-foreground">Consenso</strong>: Per l&apos;invio di messaggi tramite il modulo contatti e la candidatura a docente.
              </li>
              <li>
                <strong className="text-foreground">Legittimo interesse</strong>: Per la protezione del sito da spam e attacchi informatici.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              5. Destinatari dei Dati e Processori Terzi
            </h2>
            <p>
              I tuoi dati non saranno venduti a terzi. Utilizziamo i seguenti servizi per gestire l&apos;infrastruttura tecnologica:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3">
              <li>
                <strong className="text-foreground">Supabase</strong> – archiviazione sicura dei dati e autenticazione.
              </li>
              <li>
                <strong className="text-foreground">Resend</strong> – invio di email transazionali.
              </li>
              <li>
                <strong className="text-foreground">Cloudflare</strong> – protezione anti-spam tramite il widget Turnstile.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              6. Conservazione dei Dati
            </h2>
            <p>
              Conserveremo i tuoi dati personali solo per il tempo necessario a soddisfare gli scopi per cui li abbiamo raccolti, incluse eventuali necessità di legge o reportistica. Puoi richiedere la cancellazione del tuo account in qualsiasi momento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              7. I Tuoi Diritti
            </h2>
            <p>In base al GDPR, hai il diritto di:</p>
            <ul className="list-disc list-inside space-y-1 mt-3">
              <li>Accedere ai tuoi dati personali;</li>
              <li>Rettificare dati inesatti;</li>
              <li>Richiedere la cancellazione dei tuoi dati (&quot;diritto all&apos;oblio&quot;);</li>
              <li>Limitare il trattamento;</li>
              <li>Portabilità dei dati;</li>
              <li>Opporti al trattamento.</li>
            </ul>
            <p className="mt-3">
              Per esercitare questi diritti, scrivi a:{" "}
              <a href="mailto:farigugabriele@gmail.com" className="text-indigo-600 hover:underline">
                farigugabriele@gmail.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">
              8. Sicurezza dei Dati
            </h2>
            <p>
              Adottiamo misure di sicurezza avanzate, tra cui la crittografia dei dati a riposo (su Supabase) e in transito tramite protocollo HTTPS. L&apos;accesso ai dati sensibili è limitato tramite Row Level Security (RLS) e controlli di autorizzazione server-side.
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
