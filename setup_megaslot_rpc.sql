-- ─────────────────────────────────────────────────────────────────
-- RPC per Milestone 11.1: Partizionamento Atomico "Mega-Slot"
-- ─────────────────────────────────────────────────────────────────
-- Esegui questo script nel SQL Editor della dashboard di Supabase.
-- Questa funzione impedisce concorrenze tramite FOR UPDATE.

CREATE OR REPLACE FUNCTION split_and_book_slot(
    p_slot_id UUID,
    p_req_start TIMESTAMPTZ,
    p_req_end TIMESTAMPTZ,
    p_name TEXT,
    p_email TEXT,
    p_notes TEXT
) RETURNS JSONB AS $$
DECLARE
    v_original_start TIMESTAMPTZ;
    v_original_end TIMESTAMPTZ;
    v_new_booking_id UUID;
BEGIN
    -- 1. Blocca la riga per prevenire race conditions (Double Booking)
    SELECT start_time, end_time
    INTO v_original_start, v_original_end
    FROM lessons
    WHERE id = p_slot_id AND is_available = true AND status = 'available'
    FOR UPDATE;

    -- Se non trovata o già presa
    IF NOT FOUND THEN
        RETURN '{"success": false, "error": "Questo blocco orario non è più disponibile o è già stato prenotato."}'::jsonb;
    END IF;

    -- 2. Validazione che la richiesta sia all'interno del range originale
    IF p_req_start < v_original_start OR p_req_end > v_original_end OR p_req_start >= p_req_end THEN
        RETURN '{"success": false, "error": "Gli orari richiesti non sono validi per la disponibilità di questo slot."}'::jsonb;
    END IF;

    -- 3. Aggiorna il record originale perché diventi la prenotazione effettiva
    UPDATE lessons
    SET start_time = p_req_start,
        end_time = p_req_end,
        is_available = false,
        status = 'pending',
        student_name = p_name,
        student_contact = p_email,
        notes = p_notes
    WHERE id = p_slot_id
    RETURNING id INTO v_new_booking_id;

    -- 4. Ricava i frammenti di tempo restanti e inseriscili come nuovi slot disponibili
    
    -- Frammento precedente (se l'utente non ha prenotato dall'inizio esatto dello slot)
    IF v_original_start < p_req_start THEN
        INSERT INTO lessons (start_time, end_time, is_available, status)
        VALUES (v_original_start, p_req_start, true, 'available');
    END IF;

    -- Frammento successivo (se l'utente non ha prenotato fino alla fine esatta dello slot)
    IF v_original_end > p_req_end THEN
        INSERT INTO lessons (start_time, end_time, is_available, status)
        VALUES (p_req_end, v_original_end, true, 'available');
    END IF;

    RETURN '{"success": true}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
