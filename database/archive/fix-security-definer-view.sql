-- ===================================================================
-- FIX SECURITY DEFINER VIEW - privacy_statistics
-- Risolve l'advisory di sicurezza di Supabase
-- ===================================================================

-- Il problema: La view privacy_statistics è definita con SECURITY DEFINER
-- che bypassa le RLS policies e usa i permessi del creatore della view
-- invece di quelli dell'utente che la interroga.

-- Soluzione: Ricreare la view senza SECURITY DEFINER (usa SECURITY INVOKER)

-- 1. Prima elimina la view esistente
DROP VIEW IF EXISTS public.privacy_statistics;

-- 2. Ricrea la view con SECURITY INVOKER (default sicuro)
CREATE OR REPLACE VIEW public.privacy_statistics
WITH (security_invoker = true)  -- Usa i permessi dell'utente che interroga
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
-- ALTERNATIVA: Se la view non è necessaria, eliminala semplicemente
-- ===================================================================

-- Se non usi questa view, puoi semplicemente eliminarla:
-- DROP VIEW IF EXISTS public.privacy_statistics;

-- ===================================================================
-- VERIFICA
-- ===================================================================

-- Verifica che la view sia stata ricreata correttamente:
-- SELECT * FROM pg_views WHERE viewname = 'privacy_statistics';

-- Verifica che non ci siano più view con SECURITY DEFINER:
-- SELECT 
--     schemaname,
--     viewname,
--     viewowner,
--     definition
-- FROM pg_views
-- WHERE definition ILIKE '%SECURITY DEFINER%'
-- AND schemaname = 'public';
