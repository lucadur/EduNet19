-- ===================================================================
-- EDUNET19 - PRIVACY SETTINGS DATABASE SCHEMA
-- Schema completo per implementare privacy e impostazioni utente
-- ===================================================================
-- SEO Keywords: database privacy settings, user preferences schema,
-- GDPR compliance database, account management SQL
-- ===================================================================

-- ===================================================================
-- 1. TABELLA USER_PRIVACY_SETTINGS
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- ===== PRIVACY E VISIBILITÀ =====
    profile_visibility VARCHAR(20) DEFAULT 'public' 
        CHECK (profile_visibility IN ('public', 'private')),
    show_email BOOLEAN DEFAULT FALSE,
    searchable_by_email BOOLEAN DEFAULT TRUE,
    
    posts_visibility VARCHAR(20) DEFAULT 'public' 
        CHECK (posts_visibility IN ('public', 'followers', 'network', 'private')),
    comments_permission VARCHAR(20) DEFAULT 'everyone' 
        CHECK (comments_permission IN ('everyone', 'followers', 'none')),
    
    -- ===== NOTIFICHE EMAIL =====
    email_new_posts BOOLEAN DEFAULT TRUE,
    email_new_followers BOOLEAN DEFAULT TRUE,
    email_comments BOOLEAN DEFAULT TRUE,
    email_matches BOOLEAN DEFAULT TRUE,
    email_notifications_enabled BOOLEAN DEFAULT TRUE, -- Master switch
    
    -- ===== NOTIFICHE PUSH =====
    push_enabled BOOLEAN DEFAULT FALSE,
    notification_sounds BOOLEAN DEFAULT TRUE,
    push_subscription_data JSONB, -- Dati per web push (endpoint, keys)
    
    -- ===== SICUREZZA =====
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT, -- TOTP secret (encrypted)
    backup_codes TEXT[], -- Array di codici backup (hashed)
    social_login_enabled BOOLEAN DEFAULT FALSE,
    password_last_changed TIMESTAMP WITH TIME ZONE,
    
    -- ===== PREFERENZE INTERFACCIA =====
    theme VARCHAR(20) DEFAULT 'light' 
        CHECK (theme IN ('light', 'dark', 'auto')),
    font_size VARCHAR(20) DEFAULT 'medium' 
        CHECK (font_size IN ('small', 'medium', 'large')),
    autoplay_videos BOOLEAN DEFAULT TRUE,
    data_saver_mode BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'it',
    
    -- ===== METADATA =====
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commenti per documentazione
COMMENT ON TABLE public.user_privacy_settings IS 'Impostazioni privacy e preferenze utente per piattaforma educativa';
COMMENT ON COLUMN public.user_privacy_settings.profile_visibility IS 'Visibilità profilo: public (tutti) o private (solo utente)';
COMMENT ON COLUMN public.user_privacy_settings.posts_visibility IS 'Chi può vedere i post: public, followers, network, private';
COMMENT ON COLUMN public.user_privacy_settings.comments_permission IS 'Chi può commentare: everyone, followers, none';

-- ===================================================================
-- 2. AGGIUNTE A TABELLE ESISTENTI
-- ===================================================================

-- Aggiungi stato account a user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active' 
    CHECK (account_status IN ('active', 'deactivated', 'deleted', 'pending_deletion'));

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.user_profiles.account_status IS 'Stato account: active, deactivated, deleted, pending_deletion';
COMMENT ON COLUMN public.user_profiles.deletion_scheduled_at IS 'Data programmata eliminazione definitiva (14 giorni grace period)';

-- ===================================================================
-- 3. TABELLA USER_SESSIONS (Gestione Sessioni)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informazioni dispositivo/browser
    device_info TEXT,
    browser_info TEXT,
    os_info TEXT,
    
    -- Informazioni connessione
    ip_address INET,
    location_city TEXT,
    location_country TEXT,
    
    -- Timestamps
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Token sessione (opzionale, per invalidare sessione specifica)
    session_token TEXT UNIQUE
);

COMMENT ON TABLE public.user_sessions IS 'Tracciamento sessioni utente attive per gestione multi-device';

-- Indice per performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id 
    ON public.user_sessions(user_id, last_active DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active 
    ON public.user_sessions(last_active DESC);

-- ===================================================================
-- 4. TABELLA DATA_EXPORT_REQUESTS (GDPR Compliance)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.data_export_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
    
    -- File generato
    export_file_url TEXT,
    export_file_size_mb NUMERIC(10,2),
    
    -- Scadenza link (24-48 ore)
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    downloaded_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE public.data_export_requests IS 'Richieste export dati utente per compliance GDPR';

CREATE INDEX IF NOT EXISTS idx_data_export_user 
    ON public.data_export_requests(user_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_export_status 
    ON public.data_export_requests(status, expires_at);

-- ===================================================================
-- 5. TABELLA AUDIT_LOG (Azioni Sensibili)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    action_type VARCHAR(50) NOT NULL, -- 'password_change', 'email_change', 'account_delete', etc.
    action_details JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.audit_log IS 'Log audit per azioni sensibili e sicurezza account';

CREATE INDEX IF NOT EXISTS idx_audit_log_user 
    ON public.audit_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_type 
    ON public.audit_log(action_type, created_at DESC);

-- ===================================================================
-- 6. INDICI PER PERFORMANCE
-- ===================================================================

-- Indice principale per privacy settings
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user 
    ON public.user_privacy_settings(user_id);

-- Indice per ricerca profili pubblici
CREATE INDEX IF NOT EXISTS idx_privacy_profile_visibility 
    ON public.user_privacy_settings(profile_visibility) 
    WHERE profile_visibility = 'public';

-- Indice per posts visibility
CREATE INDEX IF NOT EXISTS idx_privacy_posts_visibility 
    ON public.user_privacy_settings(user_id, posts_visibility);

-- ===================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ===================================================================

-- Abilita RLS su tutte le nuove tabelle
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 8. POLICIES PER USER_PRIVACY_SETTINGS
-- ===================================================================

DROP POLICY IF EXISTS "Users can view own settings" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_privacy_settings;

-- Policy: Visualizzazione (solo proprie settings)
CREATE POLICY "Users can view own settings" 
    ON public.user_privacy_settings
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy: Aggiornamento (solo proprie settings)
CREATE POLICY "Users can update own settings" 
    ON public.user_privacy_settings
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Inserimento (solo proprie settings)
CREATE POLICY "Users can insert own settings" 
    ON public.user_privacy_settings
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- ===================================================================
-- 9. POLICIES PER USER_SESSIONS
-- ===================================================================

DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.user_sessions;

CREATE POLICY "Users can view own sessions" 
    ON public.user_sessions
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" 
    ON public.user_sessions
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Policy per inserimento (gestito dal sistema)
CREATE POLICY "System can insert sessions" 
    ON public.user_sessions
    FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- ===================================================================
-- 10. POLICIES PER DATA_EXPORT_REQUESTS
-- ===================================================================

DROP POLICY IF EXISTS "Users can view own export requests" ON public.data_export_requests;

CREATE POLICY "Users can view own export requests" 
    ON public.data_export_requests
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create export requests" 
    ON public.data_export_requests
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- ===================================================================
-- 11. POLICIES PER AUDIT_LOG
-- ===================================================================

DROP POLICY IF EXISTS "Users can view own audit log" ON public.audit_log;

CREATE POLICY "Users can view own audit log" 
    ON public.audit_log
    FOR SELECT 
    USING (auth.uid() = user_id);

-- ===================================================================
-- 12. TRIGGER UPDATED_AT
-- ===================================================================

-- Assicurati che la funzione update_updated_at_column esista
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per privacy_settings
DROP TRIGGER IF EXISTS update_privacy_settings_updated_at ON public.user_privacy_settings;
CREATE TRIGGER update_privacy_settings_updated_at 
    BEFORE UPDATE ON public.user_privacy_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- 13. FUNZIONI HELPER
-- ===================================================================

-- Funzione: Ottieni impostazioni privacy di un utente
CREATE OR REPLACE FUNCTION get_user_privacy_settings(target_user_id UUID)
RETURNS TABLE (
    profile_visibility VARCHAR,
    posts_visibility VARCHAR,
    comments_permission VARCHAR,
    show_email BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ups.profile_visibility,
        ups.posts_visibility,
        ups.comments_permission,
        ups.show_email
    FROM public.user_privacy_settings ups
    WHERE ups.user_id = target_user_id
    LIMIT 1;
    
    -- Se non esistono settings, ritorna defaults
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            'public'::VARCHAR AS profile_visibility,
            'public'::VARCHAR AS posts_visibility,
            'everyone'::VARCHAR AS comments_permission,
            FALSE AS show_email;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_privacy_settings IS 'Ottiene impostazioni privacy utente con fallback a defaults';

-- Funzione: Verifica se profilo è visibile
CREATE OR REPLACE FUNCTION is_profile_visible(
    target_user_id UUID,
    viewer_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    visibility VARCHAR;
BEGIN
    -- Se viewer è il proprietario, sempre visibile
    IF viewer_id = target_user_id THEN
        RETURN TRUE;
    END IF;
    
    -- Ottieni visibilità profilo
    SELECT profile_visibility INTO visibility
    FROM public.user_privacy_settings
    WHERE user_id = target_user_id;
    
    -- Default public se non esistono settings
    IF visibility IS NULL THEN
        visibility := 'public';
    END IF;
    
    -- Profilo pubblico = visibile a tutti
    RETURN visibility = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_profile_visible IS 'Verifica se profilo utente è visibile al viewer';

-- Funzione: Verifica se post è visibile
CREATE OR REPLACE FUNCTION is_post_visible(
    post_author_id UUID,
    viewer_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    visibility VARCHAR;
    is_following BOOLEAN;
BEGIN
    -- Se viewer è l'autore, sempre visibile
    IF viewer_id = post_author_id THEN
        RETURN TRUE;
    END IF;
    
    -- Ottieni visibilità post
    SELECT posts_visibility INTO visibility
    FROM public.user_privacy_settings
    WHERE user_id = post_author_id;
    
    -- Default public se non esistono settings
    IF visibility IS NULL THEN
        visibility := 'public';
    END IF;
    
    -- Check visibility
    CASE visibility
        WHEN 'public' THEN
            RETURN TRUE;
        WHEN 'private' THEN
            RETURN FALSE;
        WHEN 'network' THEN
            -- Solo utenti loggati
            RETURN viewer_id IS NOT NULL;
        WHEN 'followers' THEN
            -- Solo follower
            IF viewer_id IS NULL THEN
                RETURN FALSE;
            END IF;
            
            -- Verifica se segue
            SELECT EXISTS(
                SELECT 1 FROM public.user_follows
                WHERE follower_id = viewer_id
                AND following_institute_id = post_author_id
            ) INTO is_following;
            
            RETURN is_following;
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_post_visible IS 'Verifica se post è visibile al viewer in base a privacy settings';

-- Funzione: Verifica se può commentare
CREATE OR REPLACE FUNCTION can_comment_on_post(
    post_author_id UUID,
    commenter_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    permission VARCHAR;
    is_following BOOLEAN;
BEGIN
    -- Se commenter è l'autore, sempre può commentare
    IF commenter_id = post_author_id THEN
        RETURN TRUE;
    END IF;
    
    -- Ottieni permessi commenti
    SELECT comments_permission INTO permission
    FROM public.user_privacy_settings
    WHERE user_id = post_author_id;
    
    -- Default everyone se non esistono settings
    IF permission IS NULL THEN
        permission := 'everyone';
    END IF;
    
    -- Check permission
    CASE permission
        WHEN 'everyone' THEN
            RETURN TRUE;
        WHEN 'none' THEN
            RETURN FALSE;
        WHEN 'followers' THEN
            -- Verifica se segue
            SELECT EXISTS(
                SELECT 1 FROM public.user_follows
                WHERE follower_id = commenter_id
                AND following_institute_id = post_author_id
            ) INTO is_following;
            
            RETURN is_following;
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION can_comment_on_post IS 'Verifica se utente può commentare post in base a privacy settings';

-- ===================================================================
-- 14. AGGIORNAMENTO POLICIES ESISTENTI CON PRIVACY
-- ===================================================================

-- ===== SCHOOL_INSTITUTES =====
DROP POLICY IF EXISTS "Anyone can view verified institutes" ON public.school_institutes;
DROP POLICY IF EXISTS "View public profiles or own" ON public.school_institutes;

CREATE POLICY "View public profiles or own" 
    ON public.school_institutes
    FOR SELECT
    USING (
        -- Proprio profilo
        auth.uid() = id 
        OR
        -- Profilo pubblico (usa funzione helper)
        is_profile_visible(id, auth.uid())
    );

-- ===== PRIVATE_USERS =====
DROP POLICY IF EXISTS "Users can view own private data" ON public.private_users;
DROP POLICY IF EXISTS "View public private users or own" ON public.private_users;

CREATE POLICY "View public private users or own" 
    ON public.private_users
    FOR SELECT
    USING (
        -- Propri dati
        auth.uid() = id 
        OR
        -- Profilo pubblico
        is_profile_visible(id, auth.uid())
    );

-- ===== INSTITUTE_POSTS =====
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.institute_posts;
DROP POLICY IF EXISTS "View posts based on privacy" ON public.institute_posts;

CREATE POLICY "View posts based on privacy" 
    ON public.institute_posts
    FOR SELECT
    USING (
        -- Proprio post
        auth.uid() = institute_id
        OR
        -- Post visibile secondo privacy (usa funzione helper)
        (published = true AND is_post_visible(institute_id, auth.uid()))
    );

-- ===== POST_COMMENTS - INSERT =====
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.post_comments;
DROP POLICY IF EXISTS "Insert comments with permission check" ON public.post_comments;

CREATE POLICY "Insert comments with permission check" 
    ON public.post_comments
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND
        -- Verifica permessi usando funzione helper
        EXISTS (
            SELECT 1 FROM public.institute_posts p
            WHERE p.id = post_id
            AND can_comment_on_post(p.institute_id, auth.uid())
        )
    );

-- ===================================================================
-- 15. FUNZIONE DI INIZIALIZZAZIONE SETTINGS
-- ===================================================================

-- Funzione: Crea settings di default per nuovo utente
CREATE OR REPLACE FUNCTION create_default_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_privacy_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_default_privacy_settings IS 'Crea automaticamente privacy settings con valori default per nuovo utente';

-- Trigger: Auto-crea settings alla creazione user_profile
DROP TRIGGER IF EXISTS create_privacy_settings_on_profile_create ON public.user_profiles;
CREATE TRIGGER create_privacy_settings_on_profile_create
    AFTER INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_privacy_settings();

-- ===================================================================
-- 16. FUNZIONE PULIZIA DATI (CRON JOB)
-- ===================================================================

-- Funzione: Pulisci dati account eliminati (dopo grace period)
CREATE OR REPLACE FUNCTION cleanup_deleted_accounts()
RETURNS void AS $$
BEGIN
    -- Elimina account in pending_deletion dopo 14 giorni
    DELETE FROM auth.users
    WHERE id IN (
        SELECT id FROM public.user_profiles
        WHERE account_status = 'pending_deletion'
        AND deletion_scheduled_at < NOW() - INTERVAL '14 days'
    );
    
    -- Log cleanup
    RAISE NOTICE 'Deleted accounts cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione: Pulisci sessioni vecchie (>30 giorni)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM public.user_sessions
    WHERE last_active < NOW() - INTERVAL '30 days';
    
    RAISE NOTICE 'Old sessions cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione: Pulisci export scaduti
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS void AS $$
BEGIN
    -- Marca come expired gli export oltre scadenza
    UPDATE public.data_export_requests
    SET status = 'expired'
    WHERE status = 'completed'
    AND expires_at < NOW();
    
    -- Elimina file vecchi (>7 giorni dalla scadenza)
    -- Questo dovrebbe essere fatto dal backend che gestisce storage
    
    RAISE NOTICE 'Expired exports cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- 17. VIEW PER STATISTICHE (OPZIONALE)
-- ===================================================================

-- View: Statistiche privacy settings
-- View: Statistiche privacy settings (con SECURITY INVOKER per sicurezza)
CREATE OR REPLACE VIEW privacy_statistics
WITH (security_invoker = true)  -- Usa i permessi dell'utente che interroga (sicuro)
AS
SELECT
    COUNT(*) AS total_users,
    COUNT(*) FILTER (WHERE profile_visibility = 'public') AS public_profiles,
    COUNT(*) FILTER (WHERE profile_visibility = 'private') AS private_profiles,
    COUNT(*) FILTER (WHERE posts_visibility = 'public') AS posts_public,
    COUNT(*) FILTER (WHERE posts_visibility = 'followers') AS posts_followers_only,
    COUNT(*) FILTER (WHERE posts_visibility = 'network') AS posts_network_only,
    COUNT(*) FILTER (WHERE posts_visibility = 'private') AS posts_private,
    COUNT(*) FILTER (WHERE comments_permission = 'everyone') AS comments_everyone,
    COUNT(*) FILTER (WHERE comments_permission = 'followers') AS comments_followers,
    COUNT(*) FILTER (WHERE comments_permission = 'none') AS comments_disabled,
    COUNT(*) FILTER (WHERE two_factor_enabled = true) AS two_factor_users
FROM public.user_privacy_settings;

COMMENT ON VIEW privacy_statistics IS 'Statistiche aggregate uso privacy settings (per admin)';

-- ===================================================================
-- 18. SEED DATA (OPZIONALE - Solo per testing)
-- ===================================================================

-- Inserisci settings di default per utenti esistenti che non le hanno
INSERT INTO public.user_privacy_settings (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_privacy_settings)
ON CONFLICT (user_id) DO NOTHING;

-- ===================================================================
-- 19. VERIFICA INSTALLAZIONE
-- ===================================================================

-- Verifica che tutte le tabelle siano state create
DO $$
DECLARE
    missing_tables TEXT[];
BEGIN
    SELECT ARRAY_AGG(table_name)
    INTO missing_tables
    FROM (
        VALUES 
            ('user_privacy_settings'),
            ('user_sessions'),
            ('data_export_requests'),
            ('audit_log')
    ) AS required(table_name)
    WHERE required.table_name NOT IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    );
    
    IF missing_tables IS NOT NULL THEN
        RAISE WARNING 'Missing tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ All privacy tables created successfully!';
    END IF;
END;
$$;

-- ===================================================================
-- FINE SCHEMA PRIVACY
-- ===================================================================

-- ===================================================================
-- VERIFICA INSTALLAZIONE
-- ===================================================================

-- Mostra riepilogo tabelle create
SELECT 
    tablename AS "Tabella",
    schemaname AS "Schema"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'user_privacy_settings',
    'user_sessions',
    'data_export_requests',
    'audit_log'
)
ORDER BY tablename;

-- Messaggio di successo
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ SCHEMA PRIVACY INSTALLATO CON SUCCESSO';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Prossimi passi:';
    RAISE NOTICE '1. Aggiorna settings-page.js per usare il database';
    RAISE NOTICE '2. Implementa filtri privacy in ricerca e feed';
    RAISE NOTICE '3. Testa tutti gli scenari privacy';
    RAISE NOTICE '';
    RAISE NOTICE 'Funzioni helper disponibili:';
    RAISE NOTICE '- get_user_privacy_settings(user_id)';
    RAISE NOTICE '- is_profile_visible(target_user_id, viewer_id)';
    RAISE NOTICE '- is_post_visible(post_author_id, viewer_id)';
    RAISE NOTICE '- can_comment_on_post(post_author_id, commenter_id)';
    RAISE NOTICE '';
END $$;

