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
  - `reschedule_requested` (BOOLEAN) / `reschedule_notes` (TEXT): Tracciano le richieste di spostamento.
- **Sicurezza (RLS)**:
  - Lettura pubblica limitata ai soli record con `is_available = true`.
  - Scrittura pubblica bloccata. La prenotazione o il reschedule (che convertono rispettivamente in `pending` o in richiesta esplicita) avvengono tramite RPC o con bypass `createAdminClient` interno alle Server Actions.
  - Accesso CRUD completo garantito solo agli amministratori autenticati via UI.

### Tabella `contacts`
Gestisce i messaggi inviati tramite il modulo di contatto.
- **Colonne**: `id`, `name`, `email`, `message`, `created_at`.
- **Sicurezza (RLS)**: Inserimento consentito tramite Server Action (bypass RLS tramite Service Role client o Admin client), ma la lettura diretta del database è esclusiva per l'amministratore.

## 3. Server Actions (`src/app/actions/`)
L'applicazione sfrutta il pattern delle Server Actions di Next.js per isolare la logica di business e impedire l'esposizione diretta delle API.

- **`booking.ts`**: 
  - **`bookLesson`**: Valida i dati di prenotazione dello studente con Zod e Turnstile, inserisce invocando la stored procedure `split_and_book_slot` su Supabase per garantire il partizionamento frazionale dei Mega-Slot concorrenti, poi invia l'email tramite Resend includendo il link magico alla gestione appuntamento.
  - **`requestReschedule`**: Raccoglie dal link magico la richiesta dello studente (motivo/richiesta spostamento), si autentica come bypass admin role e aggiorna il record avvisando il professore via Resend.
- **`contact.ts` (`sendContactMessage`)**:
  - Simile a `booking.ts` per validazione e anti-spam. Salva il messaggio nella tabella `contacts` e inoltra una notifica email immediata all'amministratore.
- **`admin.ts`**:
  - **`createSlot`**: Inserisce nuove finestre temporali, generabili in via ricorsiva tramite `date-fns`.
  - **`confirmLesson` / `rejectLesson`**: Approvano o bocciano la lezione inviando note via email (incluso il link GCal).
  - **`updateLessonTime`**: Permette il CRUD di aggiornamento esplicito degli orari per accogliere i Reschedule.
  - **`cancelLessonWithChoice`**: Permette ad admin di distruggere record postumi (ripristinando la disponibilità verde sul calendario, o cancellando la fascia per sé).

## 4. Componenti UI Principali (`src/components/`)
I componenti dell'interfaccia si appoggiano profondamente a `shadcn/ui` per garantire accessibilità e un design sistematico.

- **`booking-dashboard.tsx`**: Componente asincrono lato client che recupera le lezioni con `is_available = true`. Implementa un Dialog modale che incapsula il form di prenotazione e l'integrazione del widget Turnstile.
- **`contact-form.tsx`**: Modulo contatti client-side che include un controllo obbligatorio (checkbox) per l'accettazione della Privacy Policy, vincolato dalla validazione Zod prima della sottomissione alla Server Action.
- **Area Login & Admin**: Interfacce protette che gestiscono l'invio dell'OTP e tab layout per la visualizzazione segmentata (`available`, `pending`, `confirmed`) tramite fetching server-side autenticato.
