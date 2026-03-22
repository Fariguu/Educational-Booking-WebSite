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

## 3. Struttura del Progetto

```text
Sito Prenotazioni/
├── public/                 # Asset statici
├── src/
│   ├── app/                # Next.js App Router (Pagine e Server Actions)
│   │   ├── [professorId]/  # Pagine dinamiche per docente
│   │   ├── actions/        # Server Actions (Auth, Booking, Admin, ecc.)
│   │   ├── admin/          # Dashboard amministrativa
│   │   ├── auth/           # Gestione autenticazione
│   │   ├── dashboard/      # Dashboard utente/docente
│   │   ├── privacy/        # Pagina Privacy Policy
│   │   ├── layout.tsx      # Layout principale
│   │   └── page.tsx        # Homepage (Calendario pubblico)
│   ├── components/         # Componenti React riutilizzabili
│   │   ├── admin/          # Componenti specifici per l'admin
│   │   ├── ui/             # Componenti base shadcn/ui
│   │   ├── auth-modal.tsx  # Modale di autenticazione
│   │   └── ...
│   ├── lib/                # Librerie e utility esterne
│   ├── utils/              # Utility interne e configurazione Supabase
│   │   └── supabase/       # Client e Server helpers per Supabase
│   └── middleware.ts       # Middleware di protezione rotte e sessioni
├── .env.local              # Variabili d'ambiente (non in git)
├── components.json         # Configurazione shadcn/ui
├── package.json            # Dipendenze e script
├── README.md               # Documentazione del progetto
└── tsconfig.json           # Configurazione TypeScript
```

## 4. Stack Tecnologico
- **Framework Core**: Next.js 16.1 (App Router) basato su React 19.
- **Linguaggio**: TypeScript.
- **Styling & Animazioni**: Tailwind CSS v4 e Framer Motion (per interazioni fluide e modali).
- **Componenti UI**: *shadcn/ui* (Radix UI).
- **Database e Autenticazione**: Supabase (PostgreSQL) con Row Level Security (RLS).
  - **Auth**: Sistema ibrido Email/Password con verifica OTP durante la registrazione e ripristino password.
- **Gestione Form**: `react-hook-form` con validazione `zod`.
- **Protezione Anti-Spam**: Cloudflare Turnstile.
- **Email Transazionali**: Resend SDK (Onboarding, Notifiche Admin, Conferme Prenotazione).

## 5. Documentazione Strutturale del Codice

### 5.1 Architettura del Database
Il sistema utilizza un'architettura **Multi-Tenant (Multi-Docente)**.

- **Tabella `profiles`**: Estende `auth.users` per gestire i ruoli e i metadati utenti (`id`, `email`, `role`, ecc.). Un trigger SQL crea automaticamente un profilo al sign-up.
- **Tabella `professor_applications`**: Gestisce le richieste degli utenti per diventare docenti.
- **Tabella `lessons`**: Gestisce gli slot temporali. Include `professor_id` per collegare lo slot a un docente specifico. Supporta il partizionamento dinamico tramite RPC (`split_and_book_slot`).
- **Tabella `contacts`**: Messaggi inviati tramite il modulo pubblico.

### 5.2 Server Actions (`src/app/actions/`)
- **`auth.ts`**: Gestisce `registerWithPassword`, `loginWithPassword`, `resetPassword` e invio email di benvenuto.
- **`roles.ts`**: Workflow delle candidature (`applyForProfessor`, `approveApplication`, `rejectApplication`).
- **`booking.ts`**: Gestisce `bookLesson` (validazione Turnstile, RPC split, notifiche).
- **`admin.ts`**: Creazione slot, conferme, cancellazioni e integrazione Google Calendar.
- **`contact.ts`**: Invio messaggi di contatto.

### 5.3 Architettura UI & Dashboard
- **`auth-modal.tsx`**: Modale unificato per Login/Register/Forgot con animazioni Framer Motion.
- **Dashboard Multi-Livello (`/dashboard`)**:
  - **Superadmin**: Gestione candidature e messaggi.
  - **Professor**: Gestione calendario e statistiche.
  - **Student**: Elenco prenotazioni.
- **Calendario Pubblico**: Filtra gli slot disponibili (`is_available = true`).
- **Gestione Prenotazione (`/gestisci/[id]`)**: Permette agli studenti di richiedere reschedule tramite "access token".


## 6. Analisi Privacy, Sicurezza e Flusso dei Dati

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
