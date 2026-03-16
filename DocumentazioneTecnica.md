# Documentazione Tecnica - Sito Prenotazioni

Questa documentazione fornisce una panoramica tecnica dell'architettura, dei componenti e del flusso di dati dell'applicazione web per la prenotazione di lezioni private.

## 1. Stack Tecnologico
- **Framework Core**: Next.js 16.1 (App Router) basato su React 19.
- **Linguaggio**: TypeScript.
- **Styling**: Tailwind CSS v4 e componenti UI predefiniti forniti da *shadcn/ui* (Radix UI).
- **Database e Autenticazione**: Supabase (PostgreSQL) con funzionalità di Row Level Security (RLS) e Supabase Auth (accesso senza password tramite OTP via email).
- **Gestione Form e Validazione**: `react-hook-form` accoppiato con `zod` per la validazione strutturata dei dati sia lato client che server.
- **Protezione Anti-Spam**: Cloudflare Turnstile (`@marsidev/react-turnstile`).
- **Gestione Email Transazionali**: Resend SDK.
- **Manipolazione Date**: `date-fns` (gestione delle ricorrenze e formattazione locale).

## 2. Architettura del Database
Il sistema si appoggia su un database relazionale PostgreSQL gestito tramite Supabase con le seguenti tabelle principali:

### Tabella `lessons`
Gestisce gli slot temporali e le relative prenotazioni.
- **Colonne principali**:
  - `id` (UUID)
  - `start_time` / `end_time` (TIMESTAMPTZ)
  - `is_available` (BOOLEAN): Definisce se lo slot è pubblico e libero.
  - `status` (TEXT): Enum tra `available`, `pending`, `confirmed`.
  - `student_name`, `student_contact`, `notes` (TEXT): Dettagli dello studente.
- **Sicurezza (RLS)**:
  - Lettura pubblica limitata ai soli record con `is_available = true`.
  - Scrittura (Update) pubblica consentita solo per passare da `available` a `pending` durante una prenotazione.
  - Accesso CRUD completo garantito solo agli amministratori autenticati.

### Tabella `contacts`
Gestisce i messaggi inviati tramite il modulo di contatto.
- **Colonne**: `id`, `name`, `email`, `message`, `created_at`.
- **Sicurezza (RLS)**: Inserimento consentito tramite Server Action (bypass RLS tramite Service Role client o Admin client), ma la lettura diretta del database è esclusiva per l'amministratore.

## 3. Server Actions (`src/app/actions/`)
L'applicazione sfrutta il pattern delle Server Actions di Next.js per isolare la logica di business e impedire l'esposizione diretta delle API.

- **`booking.ts` (`bookLesson`)**: 
  - Valida i dati di prenotazione dello studente con Zod.
  - Verifica il token anti-spam di Turnstile chiamando le API di Cloudflare.
  - Esegue un aggiornamento atomico a livello di database utilizzando vincoli di concorrenza (`eq('is_available', true)`) per evitare "double bookings".
  - Invia una notifica di presa in carico via Resend.
- **`contact.ts` (`sendContactMessage`)**:
  - Simile a `booking.ts` per validazione e anti-spam. Salva il messaggio nella tabella `contacts` e inoltra una notifica email immediata all'amministratore.
- **`admin.ts`**:
  - **`createSlot`**: Inserisce nuove finestre temporali, inclusa la logica per generare disponibilità ricorrenti aggiungendo settimane tramite `date-fns`.
  - **`confirmLesson` / `rejectLesson`**: Modificano lo stato della lezione, inviano l'email di notifica finale e, nel caso di conferma, generano dinamicamente un URL con i dettagli precompilati per l'aggiunta su Google Calendar.

## 4. Componenti UI Principali (`src/components/`)
I componenti dell'interfaccia si appoggiano profondamente a `shadcn/ui` per garantire accessibilità e un design sistematico.

- **`booking-dashboard.tsx`**: Componente asincrono lato client che recupera le lezioni con `is_available = true`. Implementa un Dialog modale che incapsula il form di prenotazione e l'integrazione del widget Turnstile.
- **`contact-form.tsx`**: Modulo contatti client-side che include un controllo obbligatorio (checkbox) per l'accettazione della Privacy Policy, vincolato dalla validazione Zod prima della sottomissione alla Server Action.
- **Area Login & Admin**: Interfacce protette che gestiscono l'invio dell'OTP e tab layout per la visualizzazione segmentata (`available`, `pending`, `confirmed`) tramite fetching server-side autenticato.
