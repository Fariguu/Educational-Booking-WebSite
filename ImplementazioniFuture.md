# Roadmap e Implementazioni Future - Piattaforma Prenotazioni

Questo documento traccia l'evoluzione architetturale dell'applicativo, partendo dall'attuale struttura "Single-Prof" per scalare verso una soluzione SaaS "Multi-Tenant" divisa in due branch logici: Educational (Scolastico) e Business (Aziendale).

---

## Fase 1: Completamento Architettura Single-Prof
**Obiettivo:** Finalizzare le logiche di flessibilità e gestione operativa per l'insegnante singolo prima di introdurre la complessità del multi-tenant.

### Milestone 11: Flessibilità Oraria e CRUD Avanzato
- [ ] **11.1 - Implementazione "Mega-Slot" Dinamici**
  - **DB:** Modifica struttura `lessons` per supportare blocchi orari estesi (es. disponibilità 13:00-18:00).
  - **Frontend:** Aggiornamento di `booking-dashboard.tsx` per permettere allo studente di selezionare uno slot specifico (es. 16:15-17:15) all'interno del Mega-Slot.
  - **Backend:** Nuova Server Action per il partizionamento del record a database: lo slot prenotato diventa `pending`, mentre le fasce rimanenti (13:00-16:15 e 17:15-18:00) generano nuovi record `available`.
- [ ] **11.2 - Sistema di Reschedule (Lato Studente)**
  - **Frontend:** Modulo per la richiesta di cambio orario per lezioni già in `pending` o `confirmed`.
  - **Backend:** Aggiunta dello stato `reschedule_requested` e trigger per l'invio della notifica via Resend all'admin.
- [ ] **11.3 - Gestione CRUD Completa (Lato Admin)**
  - **Frontend:** Estensione dell'interfaccia admin per modificare orari, aggiungere note private e gestire cancellazioni post-conferma.
  - **Backend:** Azioni di Update/Delete con integrazione Resend per avvisare automaticamente lo studente in caso di variazioni.

---

## Fase 2: Transizione a Multi-Prof (Lato Scolastico)
**Obiettivo:** Trasformare l'app in una piattaforma per più insegnanti e permettere la profilazione degli studenti.

### Milestone 12: Architettura Multi-Tenant Educativa
- [ ] **12.1 - Refactoring Database (Isolamento Tenant)**
  - Introduzione della tabella `professors` (collegata ad `auth.users`).
  - Aggiunta di `professor_id` come foreign key sulla tabella `lessons`.
  - Aggiornamento rigoroso delle policy RLS: gli amministratori (professori) hanno permessi CRUD esclusivi solo sui record associati al proprio `professor_id`.
- [ ] **12.2 - Sistema di Registrazione Studenti**
  - Creazione del flusso di Sign-Up/Sign-In per gli studenti (mantenendo opzionale la prenotazione come "guest").
  - Richiesta del numero di telefono in fase di iscrizione per agevolare le comunicazioni.
- [ ] **12.3 - Dashboard Multi-Ruolo e Statistiche**
  - **Dashboard Studente:** Nuova interfaccia per visualizzare storico lezioni, stato richieste e ore complessive.
  - **Dashboard Prof:** Aggiornamento delle query (tramite `JOIN`) per separare le statistiche relative agli studenti *iscritti* alla piattaforma da quelli *guest*.

---

## Fasi 3 e 4: Architettura Single-Business
**Obiettivo:** Astrarre le entità del database per supportare casi d'uso aziendali (consulenze, riparazioni, colloqui) senza duplicare la codebase.

### Milestone 13: Bivio Architetturale e Tassonomia Aziendale
- [ ] **13.1 - Routing Dinamico e Landing Page**
  - Ristrutturazione di `src/app/page.tsx` in un hub di smistamento verso i percorsi `/edu` (Scolastico) o `/biz` (Aziendale).
- [ ] **13.2 - Astrazione del Modello Dati**
  - Refactoring della nomenclatura: transizione logica da "lezioni" a "eventi/appuntamenti".
  - Aggiunta della colonna `event_type` a database, gestibile dinamicamente dal responsabile aziendale (es. label personalizzate per i servizi offerti).
- [ ] **13.3 - Form di Prenotazione Aziendale (Zod Avanzato)**
  - Nuovo modulo in `/biz` che non richiede login per il cliente.
  - Validazione `zod` con `superRefine` per imporre l'inserimento di Nome, Cognome, Indirizzo e garantire che almeno uno tra Email e Telefono sia presente.

---

## Fase 5: Scalabilità Aziendale
**Obiettivo:** Estendere il lato Business a più aziende sulla stessa infrastruttura.

### Milestone 14: Multi-Business e Isolamento Dati Sicuro
- [ ] **14.1 - Gestione Organizzazioni B2B**
  - Creazione delle entità `companies` e relazione con i profili dei dipendenti/responsabili autorizzati alla gestione.
- [ ] **14.2 - Sicurezza e RLS Aziendale**
  - Configurazione avanzata delle Row Level Security per assicurare che i dati e gli appuntamenti dei clienti di un'azienda (Tenant A) siano fisicamente inaccessibili per gli account di un'altra azienda (Tenant B).

---

## Fase 6: R&D (Ricerca e Sviluppo)
**Obiettivo:** Gestione delle eccezioni e verticalizzazioni.

### Milestone 15: Progetti Custom
- [ ] Analisi e architettura per casi d'uso specifici non standardizzabili all'interno dei flow `/edu` o `/biz`. Specifiche da definire.