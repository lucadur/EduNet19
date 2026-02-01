-- ===================================================================
-- 🔒 FIX SECURITY WARNINGS - Database Linter
-- Risolve tutti gli errori e warning di sicurezza
-- ===================================================================

-- 1️⃣ FIX: Security Definer View (ERROR)
-- ===================================================================
-- Problema: user_avatars_view usa SECURITY DEFINER
-- Soluzione: Ricreare senza SECURITY DEFINER

DROP VIEW IF EXISTS user_avatars_view CASCADE;

CREATE VIEW user_avatars_view 
-- ✅ Rimosso SECURITY DEFINER
AS
SELECT 
  up.id as user_id,
  up.user_type,
  CASE 
    WHEN up.user_type = 'istituto' THEN si.logo_url
    WHEN up.user_type = 'privato' THEN pu.avatar_url
    ELSE NULL
  END as avatar_url,
  CASE 
    WHEN up.user_type = 'istituto' THEN si.institute_name
    WHEN up.user_type = 'privato' THEN CONCAT(pu.first_name, ' ', pu.last_name)
    ELSE 'Utente'
  END as display_name,
  CASE 
    WHEN up.user_type = 'istituto' THEN si.city
    ELSE NULL
  END as location
FROM user_profiles up
LEFT JOIN school_institutes si ON up.id = si.id AND up.user_type = 'istituto'
LEFT JOIN private_users pu ON up.id = pu.id AND up.user_type = 'privato';

-- 2️⃣ FIX: Function Search Path Mutable (WARN)
-- ===================================================================
-- Problema: get_user_avatar_url non ha search_path impostato
-- Soluzione: Aggiungere SET search_path = public

CREATE OR REPLACE FUNCTION get_user_avatar_url(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- ✅ Aggiunto search_path
AS $$
DECLARE
  user_type_val TEXT;
  avatar_path TEXT;
BEGIN
  SELECT user_type INTO user_type_val
  FROM user_profiles
  WHERE id = user_uuid;
  
  IF user_type_val = 'istituto' THEN
    SELECT logo_url INTO avatar_path
    FROM school_institutes
    WHERE id = user_uuid;
  ELSIF user_type_val = 'privato' THEN
    SELECT avatar_url INTO avatar_path
    FROM private_users
    WHERE id = user_uuid;
  END IF;
  
  RETURN avatar_path;
END;
$$;

-- 3️⃣ FIX: invalidate_recommendation_cache (WARN)
-- ===================================================================

CREATE OR REPLACE FUNCTION invalidate_recommendation_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public  -- ✅ Aggiunto search_path
AS $$
BEGIN
  -- Invalida cache quando cambiano dati rilevanti
  PERFORM pg_notify('recommendation_cache_invalidate', NEW.id::text);
  RETURN NEW;
END;
$$;

-- 4️⃣ FIX: update_post_likes_count (WARN)
-- ===================================================================

CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public  -- ✅ Aggiunto search_path
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE institute_posts
    SET likes = COALESCE(likes, 0) + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE institute_posts
    SET likes = GREATEST(COALESCE(likes, 0) - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- ===================================================================
-- ✅ VERIFICA FIX APPLICATI
-- ===================================================================

-- Verifica view (non dovrebbe più avere SECURITY DEFINER)
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE viewname = 'user_avatars_view';

-- Verifica funzioni (dovrebbero avere search_path = public)
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proconfig as configuration
FROM pg_proc
WHERE proname IN (
  'get_user_avatar_url',
  'invalidate_recommendation_cache',
  'update_post_likes_count'
);

-- ===================================================================
-- 📋 RISULTATO ATTESO
-- ===================================================================
-- 
-- user_avatars_view:
-- ✅ Non ha più SECURITY DEFINER
-- 
-- Funzioni:
-- ✅ get_user_avatar_url: search_path = public
-- ✅ invalidate_recommendation_cache: search_path = public
-- ✅ update_post_likes_count: search_path = public
-- 
-- ===================================================================

-- 5️⃣ NOTA: Leaked Password Protection (WARN)
-- ===================================================================
-- Questo warning si risolve tramite Supabase Dashboard:
-- 
-- 1. Vai su Authentication → Policies
-- 2. Abilita "Leaked Password Protection"
-- 
-- Oppure tramite API (non SQL):
-- https://supabase.com/docs/guides/auth/password-security
-- 
-- ===================================================================
