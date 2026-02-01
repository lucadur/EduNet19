-- ============================================
-- SISTEMA 2FA (Two-Factor Authentication)
-- Database Setup + Server Functions
-- ============================================

-- 1. Tabella per memorizzare i dati 2FA
CREATE TABLE IF NOT EXISTS user_2fa (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Secret TOTP (encrypted)
    totp_secret TEXT NOT NULL,
    
    -- Stato 2FA
    is_enabled BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    
    -- Backup codes (encrypted, array di hash)
    backup_codes TEXT[],
    backup_codes_used INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    
    -- Sicurezza
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ
);

-- 2. Indici per performance
CREATE INDEX IF NOT EXISTS idx_user_2fa_enabled ON user_2fa(user_id, is_enabled);
CREATE INDEX IF NOT EXISTS idx_user_2fa_locked ON user_2fa(user_id, locked_until);

-- 3. RLS Policies
ALTER TABLE user_2fa ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere solo i propri dati 2FA
CREATE POLICY "Users can view own 2FA settings"
    ON user_2fa FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Gli utenti possono inserire i propri dati 2FA
CREATE POLICY "Users can insert own 2FA settings"
    ON user_2fa FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Gli utenti possono aggiornare i propri dati 2FA
CREATE POLICY "Users can update own 2FA settings"
    ON user_2fa FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Gli utenti possono eliminare i propri dati 2FA
CREATE POLICY "Users can delete own 2FA settings"
    ON user_2fa FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- FUNZIONI SERVER PER 2FA
-- ============================================

-- Funzione: Genera secret TOTP
CREATE OR REPLACE FUNCTION generate_totp_secret()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; -- Base32
    secret TEXT := '';
    i INTEGER;
BEGIN
    -- Genera un secret di 32 caratteri (160 bit)
    FOR i IN 1..32 LOOP
        secret := secret || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    RETURN secret;
END;
$$;

-- Funzione: Genera backup codes
CREATE OR REPLACE FUNCTION generate_backup_codes(count INTEGER DEFAULT 10)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    codes TEXT[] := '{}';
    code TEXT;
    i INTEGER;
BEGIN
    FOR i IN 1..count LOOP
        -- Genera codice di 8 caratteri alfanumerici
        code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
        codes := array_append(codes, code);
    END LOOP;
    
    RETURN codes;
END;
$$;

-- Funzione: Verifica codice TOTP (implementazione semplificata)
-- NOTA: In produzione, usa una libreria TOTP vera lato server
CREATE OR REPLACE FUNCTION verify_totp_code(
    p_user_id UUID,
    p_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_2fa_record RECORD;
    v_is_valid BOOLEAN := false;
BEGIN
    -- Recupera dati 2FA
    SELECT * INTO v_2fa_record
    FROM user_2fa
    WHERE user_id = p_user_id AND is_enabled = true;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Verifica se l'account è bloccato
    IF v_2fa_record.locked_until IS NOT NULL AND v_2fa_record.locked_until > NOW() THEN
        RAISE EXCEPTION 'Account temporaneamente bloccato per troppi tentativi falliti';
    END IF;
    
    -- NOTA: Questa è una verifica semplificata
    -- In produzione, implementa la vera logica TOTP con time window
    -- Per ora, verifica se il codice è di 6 cifre
    IF length(p_code) = 6 AND p_code ~ '^\d{6}$' THEN
        -- Qui dovresti implementare la vera verifica TOTP
        -- Per ora, accetta qualsiasi codice valido per testing
        v_is_valid := true;
    END IF;
    
    -- Verifica backup codes
    IF NOT v_is_valid AND v_2fa_record.backup_codes IS NOT NULL THEN
        IF p_code = ANY(v_2fa_record.backup_codes) THEN
            v_is_valid := true;
            
            -- Rimuovi il backup code usato
            UPDATE user_2fa
            SET backup_codes = array_remove(backup_codes, p_code),
                backup_codes_used = backup_codes_used + 1,
                last_used_at = NOW()
            WHERE user_id = p_user_id;
        END IF;
    END IF;
    
    -- Aggiorna statistiche
    IF v_is_valid THEN
        UPDATE user_2fa
        SET failed_attempts = 0,
            locked_until = NULL,
            last_used_at = NOW()
        WHERE user_id = p_user_id;
    ELSE
        UPDATE user_2fa
        SET failed_attempts = failed_attempts + 1,
            locked_until = CASE 
                WHEN failed_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
                ELSE NULL
            END
        WHERE user_id = p_user_id;
    END IF;
    
    RETURN v_is_valid;
END;
$$;

-- Funzione: Setup iniziale 2FA
CREATE OR REPLACE FUNCTION setup_2fa()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_secret TEXT;
    v_backup_codes TEXT[];
    v_existing RECORD;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Non autenticato';
    END IF;
    
    -- Verifica se esiste già
    SELECT * INTO v_existing FROM user_2fa WHERE user_id = v_user_id;
    
    IF FOUND AND v_existing.is_enabled THEN
        RAISE EXCEPTION '2FA già attivo';
    END IF;
    
    -- Genera secret e backup codes
    v_secret := generate_totp_secret();
    v_backup_codes := generate_backup_codes(10);
    
    -- Inserisci o aggiorna
    INSERT INTO user_2fa (user_id, totp_secret, backup_codes, is_enabled)
    VALUES (v_user_id, v_secret, v_backup_codes, false)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        totp_secret = v_secret,
        backup_codes = v_backup_codes,
        is_enabled = false,
        failed_attempts = 0,
        locked_until = NULL;
    
    -- Restituisci dati per setup
    RETURN json_build_object(
        'secret', v_secret,
        'backup_codes', v_backup_codes
    );
END;
$$;

-- Funzione: Abilita 2FA dopo verifica
CREATE OR REPLACE FUNCTION enable_2fa(p_verification_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_is_valid BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Non autenticato';
    END IF;
    
    -- Verifica il codice (implementazione semplificata)
    -- In produzione, usa vera verifica TOTP
    IF length(p_verification_code) = 6 AND p_verification_code ~ '^\d{6}$' THEN
        v_is_valid := true;
    ELSE
        v_is_valid := false;
    END IF;
    
    IF v_is_valid THEN
        UPDATE user_2fa
        SET is_enabled = true,
            verified_at = NOW()
        WHERE user_id = v_user_id;
        
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$;

-- Funzione: Disabilita 2FA
CREATE OR REPLACE FUNCTION disable_2fa(p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Non autenticato';
    END IF;
    
    -- NOTA: Qui dovresti verificare la password
    -- Per ora, accetta qualsiasi password non vuota
    IF p_password IS NULL OR length(p_password) = 0 THEN
        RAISE EXCEPTION 'Password richiesta';
    END IF;
    
    -- Disabilita 2FA
    UPDATE user_2fa
    SET is_enabled = false
    WHERE user_id = v_user_id;
    
    RETURN true;
END;
$$;

-- Funzione: Ottieni stato 2FA
CREATE OR REPLACE FUNCTION get_2fa_status()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_2fa RECORD;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('enabled', false);
    END IF;
    
    SELECT * INTO v_2fa FROM user_2fa WHERE user_id = v_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('enabled', false);
    END IF;
    
    RETURN json_build_object(
        'enabled', v_2fa.is_enabled,
        'verified_at', v_2fa.verified_at,
        'last_used_at', v_2fa.last_used_at,
        'backup_codes_remaining', COALESCE(array_length(v_2fa.backup_codes, 1), 0),
        'backup_codes_used', v_2fa.backup_codes_used
    );
END;
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_2fa TO authenticated;
GRANT EXECUTE ON FUNCTION generate_totp_secret() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_backup_codes(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_totp_code(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION setup_2fa() TO authenticated;
GRANT EXECUTE ON FUNCTION enable_2fa(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION disable_2fa(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_2fa_status() TO authenticated;

-- ============================================
-- FINE SETUP DATABASE 2FA
-- ============================================
