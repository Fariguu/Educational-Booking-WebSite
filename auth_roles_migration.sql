-- ─────────────────────────────────────────────────────────────────
-- Auth & Role Workflow Migration
-- ─────────────────────────────────────────────────────────────────

-- 1. Aggiornamento ENUM user_role
-- Aggiungiamo i valori 'user' e 'pending_professor' qualora non ci siano.
DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE 'user';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE 'pending_professor';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- 2. Trigger automatico per la registrazione: Ogni utente appena registrato diventa 'user'
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, created_at, updated_at)
  VALUES (new.id, 'user', now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminare eventuale trigger preesistente per pulizia
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. Tabella professor_applications (Richieste Profilo Docente)
CREATE TABLE IF NOT EXISTS professor_applications (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    bio TEXT NOT NULL,
    subjects TEXT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE professor_applications ENABLE ROW LEVEL SECURITY;

-- Gli utenti 'user' possono inserire una propria richiesta
CREATE POLICY "Users can insert own applications" ON professor_applications 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Gli utenti possono vedere la propria richiesta in sospeso
CREATE POLICY "Users can view own application" ON professor_applications 
FOR SELECT USING (auth.uid() = id);

-- Superadmin e Admin possono visualizzare tutto e cancellare
CREATE POLICY "Admins full access to applications" ON professor_applications 
FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
);


-- 4. Funzione RPC "Approve Professor Application"
CREATE OR REPLACE FUNCTION approve_professor_application(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_full_name TEXT;
    v_bio TEXT;
    v_subjects TEXT[];
BEGIN
    -- 1. Legge la richiesta esistente bloccandola per previenere concorrenze multiple
    SELECT full_name, bio, subjects
    INTO v_full_name, v_bio, v_subjects
    FROM professor_applications
    WHERE id = p_user_id
    FOR UPDATE;

    -- Se non trova la richiesta
    IF NOT FOUND THEN
        RETURN '{"success": false, "error": "Richiesta non trovata."}'::jsonb;
    END IF;

    -- 2. Inserisce (o aggiorna) i dati in professors
    INSERT INTO professors (id, name, bio, subjects)
    VALUES (p_user_id, v_full_name, v_bio, v_subjects)
    ON CONFLICT (id) DO UPDATE 
    SET name = EXCLUDED.name, bio = EXCLUDED.bio, subjects = EXCLUDED.subjects;

    -- 3. Aggiorna il ruolo nel profile allo stato professor
    UPDATE profiles
    SET role = 'professor', updated_at = NOW()
    WHERE id = p_user_id;

    -- 4. Rimuove la richiesta da professor_applications essendo approvata
    DELETE FROM professor_applications WHERE id = p_user_id;

    RETURN '{"success": true}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
