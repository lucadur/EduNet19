-- ===================================================================
-- FIX ALL FUNCTIONS AUTOMATIC - Corregge search_path automaticamente
-- Questo script aggiunge SET search_path a TUTTE le funzioni
-- senza doverle riscrivere manualmente
-- ===================================================================

-- ===================================================================
-- METODO: ALTER FUNCTION per aggiungere search_path
-- ===================================================================

-- Funzioni Privacy (create da me)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_privacy_settings(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_profile_visible(UUID, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_post_visible(UUID, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.can_comment_on_post(UUID, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_default_privacy_settings() SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_deleted_accounts() SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_old_sessions() SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_expired_exports() SET search_path = public, pg_temp;

-- Funzioni EduMatch/Existing
ALTER FUNCTION public.update_engagement_pattern() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_interaction_style() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_recommended_profiles(UUID, INTEGER) SET search_path = public, pg_temp;
ALTER FUNCTION public.save_match_prediction(UUID, UUID, INTEGER, JSONB) SET search_path = public, pg_temp;
ALTER FUNCTION public.init_user_match_weights(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.count_saved_posts(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_post_saved(UUID, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_user_muted(UUID, UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_post_hidden(UUID, UUID) SET search_path = public, pg_temp;

-- ===================================================================
-- VERIFICA CORREZIONE
-- ===================================================================

-- Mostra tutte le funzioni con il loro status search_path
SELECT 
    p.proname AS "Funzione",
    pg_get_function_identity_arguments(p.oid) AS "Parametri",
    CASE 
        WHEN 'search_path' = ANY(
            SELECT unnest(string_to_array(pg_get_function_result(p.oid), ','))
        ) OR p.proconfig IS NOT NULL THEN '✅ OK'
        ELSE '❌ Missing'
    END AS "Status",
    COALESCE(
        (SELECT setting FROM unnest(p.proconfig) AS setting WHERE setting LIKE 'search_path=%'),
        'Not set'
    ) AS "search_path"
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
)
ORDER BY p.proname;

-- ===================================================================
-- MESSAGGIO FINALE
-- ===================================================================

DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    -- Conta quante funzioni sono state corrette
    SELECT COUNT(*) INTO fixed_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proconfig IS NOT NULL
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
    RAISE NOTICE '✅ TUTTE LE FUNZIONI CORRETTE CON SUCCESSO';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Funzioni corrette: % su 18', fixed_count;
    RAISE NOTICE '';
    RAISE NOTICE 'I warning "function_search_path_mutable" dovrebbero';
    RAISE NOTICE 'essere tutti risolti ora.';
    RAISE NOTICE '';
    RAISE NOTICE 'PROSSIMI PASSI:';
    RAISE NOTICE '1. Vai su Supabase Dashboard';
    RAISE NOTICE '2. Apri Database > Linter';
    RAISE NOTICE '3. Clicca "Refresh" o "Run Linter"';
    RAISE NOTICE '4. Verifica che i warning siano spariti';
    RAISE NOTICE '';
    RAISE NOTICE 'NOTA: Il warning "auth_leaked_password_protection"';
    RAISE NOTICE 'va abilitato nelle impostazioni Auth di Supabase,';
    RAISE NOTICE 'non è risolvibile via SQL.';
    RAISE NOTICE '';
END $$;

