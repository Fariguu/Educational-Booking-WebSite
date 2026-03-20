# Sito Prenotazioni Lezioni Private

## 1. A cosa serve il programma
Questa è una Web App serverless progettata per permettere a un professore (amministratore) di gestire le proprie disponibilità orarie e agli studenti di prenotare rapidamente lezioni private o inviare richieste di contatto senza dover creare un account. 
L'obiettivo principale è massimizzare le performance, minimizzare i costi (sfruttando un'architettura 100% serverless cloud e servizi in free-tier) e garantire un'esperienza utente semplice ed efficace per entrambe le parti, mantenendo alti standard di sicurezza e rispetto per la privacy dei dati personali (GDPR compliance).

## 2. Funzionalità

### Per gli Studenti:
* **Visualizzazione Calendario:** Interfaccia pubblica chiara e intuitiva per vedere immediatamente i giorni e le fasce orarie messe a disposizione (inclusi i "Mega-Slot" frazionabili a piacimento).
* **Prenotazione Rapida:** Modulo di prenotazione snello che richiede solo identificazione base (nome, email) e opzionalmente delle note aggiuntive. Nessuna registrazione necessaria.
* **Sistema di Reschedule (Magic Link):** Tramite un link segreto ricevuto via email, lo studente può accedere alla pagina di gestione della sua prenotazione (`/gestisci/[id]`) e richiedere in autonomia uno spostamento orario al professore.
* **Modulo di Contatto:** Form dedicato per richiedere informazioni pre-prenotazione, con accettazione esplicita della privacy policy.
* **Protezione Anti-Spam:** Integrazione con il widget Cloudflare Turnstile per garantire che i form vengano compilati solo da esseri umani reali.
* **Notifiche Email:** Ricezione di email automatiche transazionali ad ogni cambio di stato (inviata, confermata, rifiutata, orario modificato dall'insegnante).

### Per l'Amministratore (Professore):
* **Accesso Sicuro Passwordless:** Login protetto tramite un sistema OTP generato da Supabase Auth e inviato via email.
* **Dashboard Completa (CRUD Avanzato):** Un pannello di controllo per gestire l'intero workflow:
  * *Richieste in attesa:* Visualizzazione rapida di chi ha prenotato, con opzione per confermare o rifiutare.
  * *Lezioni confermate:* Riepilogo delle lezioni future già approvate.
  * *Gestione Disponibilità:* Possibilità di inserire singoli orari liberi nel calendario.
  * *Modifica e Cancellazione (CRUD):* Capacità di alterare l'orario di lezioni già prenotate e di annullare impegni (con scelta se ripristinare o distruggere il blocco temporale). Include badge visivi per avvisare di richieste di "Spostamento" da parte degli studenti.
* **Generazione Slot in Serie:** Creazione di disponibilità ricorrenti.
* **Integrazione Dinamica Google Calendar:** In fase di conferma o "salvataggio" di una modifica oraria, generazione dinamica di link Google Calendar.
* **Email Automatizzate:** Invio di note transazionali automatiche via piattaforma Resend.

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
* **`auth.ts`**: Gestisce l'ingresso. Genera magic link o valuta token manuali OTP numerici (`verifyOtp`).
* **`booking.ts`**: Modulo che convalida lato server il form student, gestisce l'inserzione tramite RPC per il partizionamento dinamico in "Mega-Slots" (evitando i double-booking in concorrenza) e funge da recettore per `requestReschedule` dal lato studente inviando notifiche al prof.
* **`admin.ts`**: Controlli logici di amministrazione garantiti. Include script bulk per generazione, routine di accettazione (`confirmLesson`), aggiornamento (`updateLessonTime`) e cancellazione controllata (`cancelLessonWithChoice`), supportando l'invio asincrono di Email Resend e link aggiuntivi per Google Calendar.

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
La piattaforma richiede token di backend segregati per il service bypass (es. Service Role di supabase) in concomitanza a public ID esportati (`NEXT_PUBLIC_` prefissi). Include le chiavi Cloudflare, API di Resend e configurazioni URL dinamici come `NEXT_PUBLIC_SITE_URL`.

## 5. Analisi Privacy, Sicurezza e Flusso dei Dati

L'applicazione è stata progettata seguendo il principio del "Privacy by Design" ed è resistente a vulnerabilità comuni, proteggendo i dati degli utenti:

### Dati acquisiti e Finalità d'uso
Il sistema raccoglie unicamente i dati strettamente necessari:
- **Nome e Cognome**: per identificare la prenotazione o il mittente del messaggio.
- **Indirizzo Email**: come punto di contatto obbligatorio per le comunicazioni transazionali (conferme/rifiuti) e risposte ai messaggi.
- **Note/Messaggi**: testo libero fornito volontariamente dallo studente per inquadrare la lezione.

### Flusso di Validazione e Sicurezza
1. **Validazione Front-end e Back-end (Zod)**: Tutti gli input testuali (nome, email, note, messaggi) subiscono una rigorosa validazione strutturale sia nel browser (React Hook Form) sia sul server prima di processare qualsiasi richiesta. Questo previene SQL Injection e XSS.
2. **Anti-Spam e Bot Mitigation (Turnstile)**: Ad ogni sottomissione di form (prenotazione o contatto) viene interpellato invisibilmente il motore Cloudflare Turnstile. Se il server non riceve un token di superamento sfida valido, la richiesta viene bloccata all'origine.
3. **Gestione del Consenso (GDPR compliance)**: Il form di contatto obbliga l'utente a spuntare esplicitamente un checkbox di accettazione della "Privacy Policy" integrata, garantendo trasparenza ai sensi della normativa europea.

### Visibilità dei Dati e Row Level Security (RLS)
Il database Supabase isola i permessi operativi in base allo stato di autenticazione:
- **Visibilità Pubblica (Anonima)**: Gli utenti non loggati possono solo eseguire chiamate `SELECT` filtrate dalla condizione intrinseca `is_available = true`. Questo significa che **possono vedere unicamente gli orari vuoti**.
- **Segretezza delle Prenotazioni**: Nel momento in cui uno studente prenota uno slot, inserendo il proprio nome e la propria email, la colonna `is_available` diventa `false`. Da quel millisecondo in poi, il record scompare dalla visibilità pubblica. Gli altri studenti non potranno **mai** vedere chi ha prenotato o quali orari sono occupati, evitando colli di bottiglia sulla privacy.
- **Controllo Concorrenza (Double Booking)**: Il comando di update per agganciare uno slot controlla a basso livello che il record sia effettivamente "ancora" marcato come available usando conteggi esatti (`count: 'exact'`), annullando ogni problematica di prenotazione simultanea tra due utenti.
- **Accesso ai dati riservati**: I messaggi di contatto (`contacts`) e tutti i record dei calendari (`lessons`) in chiaro sono concessi esclusivamente tramite lettura protetta al ruolo `authenticated`, validato via Magic Link OTP direttamente sulla casella email dell'amministratore (niente password esposte o craccabili).
