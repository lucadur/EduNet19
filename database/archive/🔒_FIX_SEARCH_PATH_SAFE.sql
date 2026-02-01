-- ===================================================================
-- FIX SEARCH PATH - Versione Sicura
-- Aggiunge SET search_path = '' solo alle funzioni trigger
-- ===================================================================

-- Le funzioni trigger sono più semplici da aggiornare
-- perché non hanno parametri che possono cambiare

-- 1. update_profile_gallery_updated_at
CREATE OR REPLACE FUNCTION update_profile_gallery_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. update_post_comments_updated_at
CREATE OR REPLACE FUNCTION update_post_comments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 4. update_user_connections_updated_at
CREATE OR REPLACE FUNCTION update_user_connections_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 10. update_post_likes_count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.institute_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.institute_posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- 11. update_post_comments_count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.institute_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.institute_posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- 12. update_updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 14. update_institute_posts_published_at
CREATE OR REPLACE FUNCTION update_institute_posts_published_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.published = true AND OLD.published = false THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- 15. update_institute_posts_updated_at
CREATE OR REPLACE FUNCTION update_institute_posts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ===================================================================
-- VERIFICA
-- ===================================================================

SELECT 
  '✅ Funzioni trigger aggiornate!' as status,
  COUNT(*) as functions_fixed
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_profile_gallery_updated_at',
    'update_post_comments_updated_at',
    'update_user_connections_updated_at',
    'update_post_likes_count',
    'update_post_comments_count',
    'update_updated_at',
    'update_institute_posts_published_at',
    'update_institute_posts_updated_at'
  );

-- ===================================================================
-- NOTA: Funzioni con parametri
-- ===================================================================
-- Le seguenti funzioni hanno parametri e potrebbero richiedere
-- un approccio diverso. Verifica prima la signature esistente:
--
-- - get_post_comments_count(post_uuid UUID)
-- - follow_user(target_user_id UUID)
-- - unfollow_user(target_user_id UUID)
-- - get_follower_count(target_user_id UUID)
-- - get_following_count(target_user_id UUID)
-- - is_following(target_user_id UUID)
-- - fix_missing_institute_names()
-- - get_institute_posts_count(institute_uuid UUID)
--
-- Per fixare queste, usa lo script completo dopo aver verificato
-- i nomi dei parametri originali
-- ===================================================================
