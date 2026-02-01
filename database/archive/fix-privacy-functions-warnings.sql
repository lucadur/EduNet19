-- ===================================================================
-- FIX PRIVACY FUNCTIONS - Risolve Warning search_path
-- Aggiunge SET search_path a tutte le funzioni per sicurezza
-- ===================================================================

-- ===================================================================
-- 1. UPDATE_UPDATED_AT_COLUMN
-- ===================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_updated_at_column IS 'Aggiorna automaticamente la colonna updated_at';

-- ===================================================================
-- 2. GET_USER_PRIVACY_SETTINGS
-- ===================================================================

CREATE OR REPLACE FUNCTION get_user_privacy_settings(target_user_id UUID)
RETURNS TABLE (
    profile_visibility VARCHAR,
    posts_visibility VARCHAR,
    comments_permission VARCHAR,
    show_email BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

COMMENT ON FUNCTION get_user_privacy_settings IS 'Ottiene impostazioni privacy utente con fallback a defaults';

-- ===================================================================
-- 3. IS_PROFILE_VISIBLE
-- ===================================================================

CREATE OR REPLACE FUNCTION is_profile_visible(
    target_user_id UUID,
    viewer_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

COMMENT ON FUNCTION is_profile_visible IS 'Verifica se profilo utente è visibile al viewer';

-- ===================================================================
-- 4. IS_POST_VISIBLE
-- ===================================================================

CREATE OR REPLACE FUNCTION is_post_visible(
    post_author_id UUID,
    viewer_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

COMMENT ON FUNCTION is_post_visible IS 'Verifica se post è visibile al viewer in base a privacy settings';

-- ===================================================================
-- 5. CAN_COMMENT_ON_POST
-- ===================================================================

CREATE OR REPLACE FUNCTION can_comment_on_post(
    post_author_id UUID,
    commenter_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

COMMENT ON FUNCTION can_comment_on_post IS 'Verifica se utente può commentare post in base a privacy settings';

-- ===================================================================
-- 6. CREATE_DEFAULT_PRIVACY_SETTINGS
-- ===================================================================

CREATE OR REPLACE FUNCTION create_default_privacy_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.user_privacy_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION create_default_privacy_settings IS 'Crea automaticamente privacy settings con valori default per nuovo utente';

-- ===================================================================
-- 7. CLEANUP_DELETED_ACCOUNTS
-- ===================================================================

CREATE OR REPLACE FUNCTION cleanup_deleted_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

COMMENT ON FUNCTION cleanup_deleted_accounts IS 'Elimina account in pending_deletion dopo grace period di 14 giorni';

-- ===================================================================
-- 8. CLEANUP_OLD_SESSIONS
-- ===================================================================

CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    DELETE FROM public.user_sessions
    WHERE last_active < NOW() - INTERVAL '30 days';
    
    RAISE NOTICE 'Old sessions cleanup completed at %', NOW();
END;
$$;

COMMENT ON FUNCTION cleanup_old_sessions IS 'Elimina sessioni utente inattive da più di 30 giorni';

-- ===================================================================
-- 9. CLEANUP_EXPIRED_EXPORTS
-- ===================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

COMMENT ON FUNCTION cleanup_expired_exports IS 'Marca come expired gli export dati scaduti';

-- ===================================================================
-- VERIFICA CORREZIONE
-- ===================================================================

-- Query per verificare che tutte le funzioni hanno ora search_path impostato
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    CASE 
        WHEN p.proconfig IS NOT NULL THEN 'HAS search_path ✅'
        ELSE 'MISSING search_path ❌'
    END AS search_path_status,
    p.proconfig AS config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'update_updated_at_column',
    'get_user_privacy_settings',
    'is_profile_visible',
    'is_post_visible',
    'can_comment_on_post',
    'create_default_privacy_settings',
    'cleanup_deleted_accounts',
    'cleanup_old_sessions',
    'cleanup_expired_exports'
)
ORDER BY p.proname;

-- ===================================================================
-- MESSAGGIO FINALE
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ FUNZIONI PRIVACY CORRETTE CON SUCCESSO';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Tutte le funzioni privacy ora hanno search_path impostato';
    RAISE NOTICE 'I warning di sicurezza dovrebbero essere risolti';
    RAISE NOTICE '';
    RAISE NOTICE 'Funzioni corrette:';
    RAISE NOTICE '  - update_updated_at_column';
    RAISE NOTICE '  - get_user_privacy_settings';
    RAISE NOTICE '  - is_profile_visible';
    RAISE NOTICE '  - is_post_visible';
    RAISE NOTICE '  - can_comment_on_post';
    RAISE NOTICE '  - create_default_privacy_settings';
    RAISE NOTICE '  - cleanup_deleted_accounts';
    RAISE NOTICE '  - cleanup_old_sessions';
    RAISE NOTICE '  - cleanup_expired_exports';
    RAISE NOTICE '';
    RAISE NOTICE 'NOTA: Le altre funzioni con warning non fanno parte';
    RAISE NOTICE 'dello schema privacy e dovrebbero essere corrette';
    RAISE NOTICE 'separatamente.';
    RAISE NOTICE '';
END $$;

