-- Creazione Tabella lessons
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'confirmed')),
    student_name TEXT,
    student_contact TEXT,
    notes TEXT
);

-- Abilita Row Level Security
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- POLICY PUBBLICA (Lettura anonima/pubblica)
-- Consente a chiunque di leggere solo gli slot disponibili (is_available = true)
-- NOTA: Poiché le policy agiscono a livello di riga, per nascondere le colonne
-- student_name e student_contact dovrai usare una vista, oppure assicurare che 
-- se is_available = true quei campi siano sempre nulli, oppure bloccare l'accesso 
-- a quelle colonne a livello grafico. 
-- In Supabase, per restringere la lettura di colonne specifiche si può usare un GRANT o una vista.
-- Per semplicità, qui la policy consente la lettura di tutta la riga se is_available = true.
CREATE POLICY "Public can view available lessons" 
ON lessons 
FOR SELECT 
USING (is_available = true);

-- POLICY PER PRENOTAZIONI (Update anonimo limitato)
-- Per permettere agli studenti (anonimi) di prenotare uno slot,
-- devono poter aggiornare una riga dove is_available = true.
CREATE POLICY "Public can book available lessons" 
ON lessons 
FOR UPDATE 
USING (is_available = true)
WITH CHECK (
    is_available = false AND 
    status = 'pending'
);

-- POLICY ADMIN (CRUD completo per l'amministratore autenticato)
-- In questo MVP assumiamo che il professore si autentichi usando l'Auth di Supabase.
CREATE POLICY "Admin has full access" 
ON lessons 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
