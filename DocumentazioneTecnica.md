# Documentazione Tecnica - Sito Prenotazioni

Questa documentazione fornisce una panoramica tecnica dell'architettura aggiornata, dei componenti e del flusso di dati dell'applicazione.

## 1. Stack Tecnologico
- **Framework Core**: Next.js 16.1 (App Router) basato su React 19.
- **Linguaggio**: TypeScript.
- **Styling & Animazioni**: Tailwind CSS v4 e Framer Motion (per interazioni fluide e modali).
- **Componenti UI**: *shadcn/ui* (Radix UI).
- **Database e Autenticazione**: Supabase (PostgreSQL) con Row Level Security (RLS).
  - **Auth**: Sistema ibrido Email/Password con verifica OTP durante la registrazione e ripristino password.
- **Gestione Form**: `react-hook-form` con validazione `zod`.
- **Protezione Anti-Spam**: Cloudflare Turnstile.
- **Email Transazionali**: Resend SDK (Onboarding, Notifiche Admin, Conferme Prenotazione).

## 2. Architettura del Database
Il sistema è passato da un modello Single-Prof a un'architettura **Multi-Tenant (Multi-Docente)**.

### Tabella `profiles`
Estende `auth.users` per gestire i ruoli e i metadati utenti.
- **Campi**: `id`, `email`, `first_name`, `last_name`, `role` (`user`, `pending_professor`, `professor`, `admin`), `phone`, `created_at`.
- **Note**: Un trigger SQL crea automaticamente un profilo al momento del sign-up.

### Tabella `professor_applications`
Gestisce le richieste degli utenti per diventare docenti.
- **Campi**: `id` (FK profiles), `full_name`, `email`, `bio`, `subjects` (TEXT[]), `created_at`.

### Tabella `lessons`
Gestisce gli slot temporali e le prenotazioni.
- **Nuova colonna**: `professor_id` (UUID, FK profiles) - Collega lo slot a uno specifico docente.
- **Logica**: Gli slot "Mega-Slot" possono essere partizionati dinamicamente tramite RPC (`split_and_book_slot`).
- **Sicurezza**: RLS assicura che un docente veda/modifichi solo le proprie lezioni.

### Tabella `contacts`
Messaggi inviati tramite il modulo pubblico. Salvati per consultazione in dashboard admin.

## 3. Server Actions (`src/app/actions/`)
L'applicazione è modulare e isola la logica di business in azioni server-side.

- **`auth.ts`**: Gestisce `registerWithPassword`, `loginWithPassword`, `resetPassword`. Include l'invio della mail di benvenuto tramite Resend.
- **`roles.ts`**: Gestisce il workflow delle candidature (`applyForProfessor`, `approveApplication`, `rejectApplication`).
- **`booking.ts`**: Gestisce `bookLesson` (validazione Turnstile, RPC split, notifica email studente).
- **`admin.ts`**: Gestisce la creazione slot (anche ricorrenti), conferme, cancellazioni e aggiornamento orari con invio link GCal.
- **`contact.ts`**: Inviato messaggi di contatto e salvataggio su DB.

## 4. Architettura UI & Dashboard
L'interfaccia è dinamica e basata sui ruoli definiti nel profilo Supabase.

- **`auth-modal.tsx`**: Modale unificato per Login/Register/Forgot con animazioni Framer Motion e stati di attesa verifica email.
- **Dashboard Multi-Livello (`/dashboard`)**:
  - **Superadmin**: Vista globale, gestione candidature docenti e messaggi piattaforma.
  - **Professor**: Gestione calendario personale, statistiche ore e contatti ricevuti.
  - **Student**: Elenco prenotazioni effettuate e stato (attesa/confermata).
- **Calendario Pubblico**: Filtra dinamicamente gli slot disponibili (`is_available = true`).
- **Gestione Prenotazione Studente (`/gestisci/[id]`)**: Pagina protetta da "access token" (UUID della lezione) che permette allo studente di richiedere reschedule o aggiungere note senza login obbligatorio.
