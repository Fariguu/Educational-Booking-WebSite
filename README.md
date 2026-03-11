# Sito Prenotazioni Lezioni Private

## 1. A cosa serve il programma
Questa è una Web App serverless progettata per permettere a un professore (amministratore) di gestire le proprie disponibilità orarie e agli studenti di prenotare rapidamente lezioni private senza dover creare un account. L'obiettivo principale è massimizzare le performance, minimizzare i costi (sfruttando un'architettura 100% serverless cloud e servizi in free-tier) e garantire un'esperienza utente semplice ed efficace per entrambe le parti.

## 2. Funzionalità

### Per gli Studenti:
* **Visualizzazione Calendario:** Interfaccia pubblica chiara e intuitiva per vedere immediatamente i giorni e le fasce orarie messe a disposizione.
* **Prenotazione Rapida:** Modulo di prenotazione snello che richiede solo identificazione base (nome, email) e opzionalmente delle note aggiuntive. Nessuna registrazione necessaria.
* **Protezione Anti-Spam:** Integrazione con il widget Cloudflare Turnstile per garantire che i form vengano compilati solo da esseri umani reali, fermando bot malintenzionati.
* **Notifiche Email:** Ricezione di email automatiche transazionali quando la richiesta viene inviata al sistema e, successivamente, quando viene accettata o declinata.

### Per l'Amministratore (Professore):
* **Accesso Sicuro Passwordless:** Login protetto senza password, tramite un sistema OTP (codice numerico a 6 cifre) generato da Supabase Auth e inviato in tempo reale via email.
* **Dashboard Completa:** Un pannello di controllo riservato e protetto da middleware Next.js per gestire l'intero workflow:
  * *Richieste in attesa:* Visualizzazione rapida di chi ha prenotato, con opzione in un click per confermare o rifiutare le lezioni.
  * *Lezioni confermate:* Riepilogo delle lezioni future già approvate.
  * *Gestione Disponibilità:* Possibilità di inserire singoli orari liberi nel calendario.
* **Generazione Slot in Serie (Ricorrenze):** Creazione rapida di disponibilità ricorrenti (es. "Tutti i giovedì alle 16:00 per 4 settimane") con calcolo automatico coerente al variare dei fusi orari (transizioni Ora Legale/Ora Solare salvaguardate).
* **Integrazione Dinamica Google Calendar:** Al momento della conferma di una lezione, il sistema redige un URL custom per Google Calendar preconfezionato con tutti i dettagli della lezione (studente, orario, note), pronto per un "Salva" ad un click.
* **Email Automatizzate:** Invio di risposte (conferma con esito positivo o scuse via rifiuto) automatizzate allo studente in base al routing e all'azione effettuata in dashboard.

## 3. Specifiche Tecniche

* **Struttura Core:** Next.js (App Router, pattern Server Actions)
* **Lingua / Tipizzazione:** TypeScript
* **Stile e UI:** Tailwind CSS, componenti Shadcn UI (basati su Radix UI)
* **Database e Autenticazione:** Supabase (Database PostgreSQL relazionale, Supabase SSR, Auth OTP, regole Row Level Security)
* **Gestione Email:** Resend Platform via libreria SDK ufficiale
* **Sicurezza Frontend:** Cloudflare Turnstile CAPTCHA alternativo
* **Hosting e Misurazioni:** Vercel (Hosting serverless super reattivo, Vercel Analytics globale, Vercel Speed Insights)
* **Manipolazione Date/Orari:** `date-fns`

## 4. Documentazione Strutturale del Codice

### Il layer di Visualizzazione `src/app/`
* **`page.tsx` & `layout.tsx`**: Contengono l'Homepage pubblica (frontend studenti). Orchestrano il visualizzatore del calendario asincrono e formattano i dialog di iterazione di prenotazione.
* **`login/page.tsx`**: La pagina di autenticazione dell'admin. Possiede logiche sia client che chiamate server per interpretare l'erogazione OTP o mettersi in ascolto della validazione utente.
* **`admin/page.tsx` & `admin/layout.tsx`**: L'area protetta della dashboard (raggiungibile solo in conformità al cookie auth verificato dal Middleware). Qui la navigazione si spezza tramite tab precaricando lato server i blocchi di "lezioni" secondo lo status del record.

### Il layer Logico `src/app/actions/` (Next.js Server Actions)
Moduli cruciali di elaborazione dati e chiamate API interne che sfruttano l'isolamento del backend integrato in Next.
* **`auth.ts`**: Gestisce l'ingresso. Genera magic link (`signInWithOtp`) o valuta token manuali OTP numerici (`verifyOtp`).
* **`booking.ts`**: Modulo che convalida lato server il form student, incrocia la risposta Turnstile verso i server Cloudflare e gestisce l'inserzione a db commutandolo a stato pre-impegnato `pending`.
* **`admin.ts`**: Controlli logici di amministrazione garantiti. Include script bulk (`insert` massivi con calcolo scalare ciclico per le ricorrenze), routine di reiezione e procedure per le validazioni `confirmed` con sparo e-mail concomitante tramite Resend client e composizione URL di rinvio al Google Calendar prof.

### Le componenti `src/components/`
Scomposizione delle interfacce. L'intricamento principale risiede in `components/admin/`:
* `admin-tabs.tsx`: Interpreta e formatta tutti i ritorni array delle lezioni catalogandoli utilmente in liste. Contiene bottoni di aggancio interattivi verso l'esecuzione di una Server Action.
* `create-slot-dialog.tsx`: Modale complesso che gestisce stati per datazioni e reiterazioni temporali in input, normalizzando il formato testuale prima dell'interrogazione dell'ORM di backend.

### Moduli Supabase `src/utils/supabase/`
* **`server.ts` & `client.ts`**: Helper boilerplate forniti secondo le norme correnti Supabase per impiantare il contesto in ambiti client, framework page server o SSR middleware a seconda di come viene invocato.
* **`middleware.ts`**: Richiamato nel root (`src/middleware.ts`), garantisce refresh del JWT o scarto restrittivo della directory `/admin/*` nel caso in cui un visitatore immetta esplicitamente un percorso privato.

### Il Livello Dati (Configurato su Supabase)
La tabella monolitica `lessons` gestisce lo stato di fatto del tempo prof: uno slot fluisce programmaticamente variando lungo gli stati di record `available` (sola presenza temporale) -> `pending` (arricchito da dati stringa studente) -> `confirmed` / `available` in loop continuo. È protetta a livello RLS.

### Environment (Costanti)
La piattaforma richiede token di backend segregati per il service bypass (es. Service Role di supabase) in concomitanza a public ID esportati (`NEXT_PUBLIC_` prefissi). Include le chiavi Cloudflare, API di Resend e configurazioni URL dinamici come `NEXT_PUBLIC_SITE_URL` utili negli script di recap e invio transazionale. Le credenziali non sono cablate duramente sui commit esposti ma lette nei profili variabili d'ambiente in locale (`.env.local`) o in Dashboard host online (es. Vercel env settings).
