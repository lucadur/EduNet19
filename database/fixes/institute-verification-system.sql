-- ===================================================================
-- SISTEMA VERIFICA ISTITUTI - Doppio livello email + stato verifica
-- ===================================================================

-- 1. Aggiungi colonne per gestione verifica istituto
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending_verification' 
    CHECK (verification_status IN ('pending_verification', 'verification_sent', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS email_miur TEXT,  -- Email ufficiale MIUR (per verifica)
ADD COLUMN IF NOT EXISTS email_account TEXT,  -- Email dell'account (per login)
ADD COLUMN IF NOT EXISTS verification_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by TEXT,  -- 'miur_email', 'manual_admin', 'auto_domain'
ADD COLUMN IF NOT EXISTS registrant_name TEXT,  -- Nome di chi ha registrato
ADD COLUMN IF NOT EXISTS registrant_role TEXT;  -- Ruolo: 'dirigente', 'docente', 'segreteria', 'altro'

-- 2. Commenti per documentazione
COMMENT ON COLUMN school_institutes.verification_status IS 'Stato verifica: pending_verification, verification_sent, verified, rejected';
COMMENT ON COLUMN school_institutes.email_miur IS 'Email ufficiale MIUR dell''istituto (usata per verifica)';
COMMENT ON COLUMN school_institutes.email_account IS 'Email dell''account che ha registrato (usata per login)';
COMMENT ON COLUMN school_institutes.verification_token IS 'Token univoco per link di verifica';
COMMENT ON COLUMN school_institutes.registrant_name IS 'Nome completo di chi ha effettuato la registrazione';
COMMENT ON COLUMN school_institutes.registrant_role IS 'Ruolo di chi registra: dirigente, docente, segreteria, altro';

-- 3. Indice per ricerca token verifica
CREATE INDEX IF NOT EXISTS idx_school_institutes_verification_token 
ON school_institutes(verification_token) 
WHERE verification_status != 'verified';

-- 4. Funzione per verificare istituto via token
CREATE OR REPLACE FUNCTION verify_institute_by_token(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_institute RECORD;
    v_result JSON;
BEGIN
    -- Trova l'istituto con questo token
    SELECT * INTO v_institute
    FROM school_institutes
    WHERE verification_token = p_token
    AND verification_status IN ('pending_verification', 'verification_sent');
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token non valido o già utilizzato'
        );
    END IF;
    
    -- Verifica scadenza token (7 giorni)
    IF v_institute.verification_token_expires_at IS NOT NULL 
       AND v_institute.verification_token_expires_at < NOW() THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token scaduto. Richiedi una nuova verifica.'
        );
    END IF;
    
    -- Aggiorna stato a verificato
    UPDATE school_institutes
    SET 
        verification_status = 'verified',
        verified_at = NOW(),
        verified_by = 'miur_email',
        verification_token = NULL  -- Invalida il token
    WHERE id = v_institute.id;
    
    RETURN json_build_object(
        'success', true,
        'institute_name', v_institute.institute_name,
        'message', 'Istituto verificato con successo!'
    );
END;
$$;

-- 5. Funzione per generare nuovo token di verifica
CREATE OR REPLACE FUNCTION generate_verification_token(p_institute_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_new_token UUID;
    v_institute RECORD;
BEGIN
    -- Genera nuovo token
    v_new_token := gen_random_uuid();
    
    -- Aggiorna istituto
    UPDATE school_institutes
    SET 
        verification_token = v_new_token,
        verification_token_expires_at = NOW() + INTERVAL '7 days',
        verification_status = 'verification_sent',
        verification_sent_at = NOW()
    WHERE id = p_institute_id
    RETURNING * INTO v_institute;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Istituto non trovato'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'token', v_new_token,
        'email_miur', v_institute.email_miur,
        'institute_name', v_institute.institute_name,
        'expires_at', v_institute.verification_token_expires_at
    );
END;
$$;

-- 6. Vista per istituti in attesa di verifica (per admin)
-- Usa security_invoker per rispettare RLS
CREATE OR REPLACE VIEW pending_institute_verifications 
WITH (security_invoker = true)
AS
SELECT 
    si.id,
    si.institute_name,
    si.institute_type,
    si.institute_code,
    si.email_miur,
    si.email_account,
    si.registrant_name,
    si.registrant_role,
    si.verification_status,
    si.verification_sent_at,
    si.created_at,
    up.id as user_id
FROM school_institutes si
LEFT JOIN user_profiles up ON si.id = up.id
WHERE si.verification_status != 'verified'
ORDER BY si.created_at DESC;

-- 7. Migrazione dati esistenti: imposta email_account = email se non presente
UPDATE school_institutes
SET 
    email_account = email,
    email_miur = COALESCE((miur_data->>'email')::TEXT, email),
    verification_status = CASE 
        WHEN verified = true THEN 'verified'
        ELSE 'pending_verification'
    END
WHERE email_account IS NULL;

COMMENT ON VIEW pending_institute_verifications IS 'Vista per amministratori: istituti in attesa di verifica';
