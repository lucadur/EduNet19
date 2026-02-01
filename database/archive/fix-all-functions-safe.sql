-- ===================================================================
-- FIX ALL FUNCTIONS SAFE - Corregge search_path (versione sicura)
-- Questo script gestisce gracefully le funzioni che non esistono
-- ===================================================================

-- ===================================================================
-- FUNZIONI PRIVACY (dal mio schema - quasi certamente esistono)
-- ===================================================================

DO $$
BEGIN
    -- update_updated_at_column
    BEGIN
        ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: update_updated_at_column';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: update_updated_at_column (non esiste)';
    END;

    -- get_user_privacy_settings
    BEGIN
        ALTER FUNCTION public.get_user_privacy_settings(UUID) SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: get_user_privacy_settings';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: get_user_privacy_settings (non esiste)';
    END;

    -- is_profile_visible
    BEGIN
        ALTER FUNCTION public.is_profile_visible(UUID, UUID) SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: is_profile_visible';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: is_profile_visible (non esiste)';
    END;

    -- is_post_visible
    BEGIN
        ALTER FUNCTION public.is_post_visible(UUID, UUID) SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: is_post_visible';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: is_post_visible (non esiste)';
    END;

    -- can_comment_on_post
    BEGIN
        ALTER FUNCTION public.can_comment_on_post(UUID, UUID) SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: can_comment_on_post';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: can_comment_on_post (non esiste)';
    END;

    -- create_default_privacy_settings
    BEGIN
        ALTER FUNCTION public.create_default_privacy_settings() SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: create_default_privacy_settings';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: create_default_privacy_settings (non esiste)';
    END;

    -- cleanup_deleted_accounts
    BEGIN
        ALTER FUNCTION public.cleanup_deleted_accounts() SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: cleanup_deleted_accounts';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: cleanup_deleted_accounts (non esiste)';
    END;

    -- cleanup_old_sessions
    BEGIN
        ALTER FUNCTION public.cleanup_old_sessions() SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: cleanup_old_sessions';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: cleanup_old_sessions (non esiste)';
    END;

    -- cleanup_expired_exports
    BEGIN
        ALTER FUNCTION public.cleanup_expired_exports() SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: cleanup_expired_exports';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: cleanup_expired_exports (non esiste)';
    END;

END $$;

-- ===================================================================
-- FUNZIONI ESISTENTI (potrebbero non esistere tutte)
-- ===================================================================

DO $$
BEGIN
    -- update_engagement_pattern
    BEGIN
        ALTER FUNCTION public.update_engagement_pattern() SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: update_engagement_pattern';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: update_engagement_pattern (non esiste)';
    END;

    -- update_interaction_style
    BEGIN
        ALTER FUNCTION public.update_interaction_style() SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: update_interaction_style';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: update_interaction_style (non esiste)';
    END;

    -- get_recommended_profiles
    BEGIN
        ALTER FUNCTION public.get_recommended_profiles(UUID, INTEGER) SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: get_recommended_profiles';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: get_recommended_profiles (non esiste)';
    END;

    -- save_match_prediction
    BEGIN
        ALTER FUNCTION public.save_match_prediction(UUID, UUID, INTEGER, JSONB) SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: save_match_prediction';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: save_match_prediction (non esiste)';
    END;

    -- init_user_match_weights
    BEGIN
        ALTER FUNCTION public.init_user_match_weights(UUID) SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: init_user_match_weights';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: init_user_match_weights (non esiste)';
    END;

    -- count_saved_posts
    BEGIN
        ALTER FUNCTION public.count_saved_posts(UUID) SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: count_saved_posts';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: count_saved_posts (non esiste)';
    END;

    -- is_post_saved
    BEGIN
        ALTER FUNCTION public.is_post_saved(UUID, UUID) SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: is_post_saved';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: is_post_saved (non esiste)';
    END;

    -- is_user_muted
    BEGIN
        ALTER FUNCTION public.is_user_muted(UUID, UUID) SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: is_user_muted';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: is_user_muted (non esiste)';
    END;

    -- is_post_hidden
    BEGIN
        ALTER FUNCTION public.is_post_hidden(UUID, UUID) SET search_path = public, pg_temp;
        RAISE NOTICE '✅ Corretto: is_post_hidden';
    EXCEPTION
        WHEN undefined_function THEN
            RAISE NOTICE '⏭️  Skipped: is_post_hidden (non esiste)';
    END;

END $$;

-- ===================================================================
-- RIEPILOGO FUNZIONI CORRETTE
-- ===================================================================

DO $$
DECLARE
    fixed_count INTEGER;
    total_count INTEGER := 18;
BEGIN
    -- Conta quante funzioni sono state corrette
    SELECT COUNT(*) INTO fixed_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proconfig IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM unnest(p.proconfig) AS cfg
        WHERE cfg LIKE 'search_path=%'
    )
    AND p.proname IN (
        'update_updated_at_column',
        'get_user_privacy_settings',
        'is_profile_visible',
        'is_post_visible',
        'can_comment_on_post',
        'create_default_privacy_settings',
        'cleanup_deleted_accounts',
        'cleanup_old_sessions',
        'cleanup_expired_exports',
        'update_engagement_pattern',
        'update_interaction_style',
        'get_recommended_profiles',
        'save_match_prediction',
        'init_user_match_weights',
        'count_saved_posts',
        'is_post_saved',
        'is_user_muted',
        'is_post_hidden'
    );
    
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ SCRIPT COMPLETATO CON SUCCESSO';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Funzioni corrette: % (esistenti nel database)', fixed_count;
    RAISE NOTICE '';
    RAISE NOTICE 'PROSSIMI PASSI:';
    RAISE NOTICE '1. Vai su Supabase Dashboard > Database > Linter';
    RAISE NOTICE '2. Clicca "Refresh" o "Run Linter"';
    RAISE NOTICE '3. Verifica che i warning siano ridotti/spariti';
    RAISE NOTICE '';
    RAISE NOTICE 'Se rimangono warning per funzioni specifiche,';
    RAISE NOTICE 'esegui la query di verifica per vedere quali.';
    RAISE NOTICE '';
END $$;

-- ===================================================================
-- QUERY DI VERIFICA
-- ===================================================================

-- Mostra tutte le funzioni che hanno warning nel linter
SELECT 
    p.proname AS "Funzione",
    pg_get_function_identity_arguments(p.oid) AS "Parametri",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM unnest(p.proconfig) AS cfg
            WHERE cfg LIKE 'search_path=%'
        ) THEN '✅ OK'
        ELSE '⚠️  Manca search_path'
    END AS "Status",
    COALESCE(
        (SELECT cfg FROM unnest(p.proconfig) AS cfg WHERE cfg LIKE 'search_path=%'),
        '(non impostato)'
    ) AS "search_path"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = true  -- Solo funzioni SECURITY DEFINER
ORDER BY 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM unnest(p.proconfig) AS cfg
            WHERE cfg LIKE 'search_path=%'
        ) THEN 0
        ELSE 1
    END,
    p.proname;

