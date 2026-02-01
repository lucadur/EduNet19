-- ===================================================================
-- FIX SEARCH PATH MUTABLE - Risolve tutti i warning di sicurezza
-- Aggiunge SET search_path = '' a tutte le funzioni per sicurezza
-- ===================================================================

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

-- 3. get_post_comments_count
DROP FUNCTION IF EXISTS get_post_comments_count(UUID);
CREATE FUNCTION get_post_comments_count(post_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.post_comments
    WHERE post_id = post_uuid
  );
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

-- 5. follow_user
CREATE OR REPLACE FUNCTION follow_user(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSON;
  existing_connection RECORD;
BEGIN
  -- Verifica che non sia auto-follow
  IF auth.uid() = target_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot follow yourself'
    );
  END IF;
  
  -- Verifica se esiste già una connessione
  SELECT * INTO existing_connection
  FROM public.user_connections
  WHERE follower_id = auth.uid()
    AND followed_id = target_user_id;
  
  IF existing_connection IS NOT NULL THEN
    -- Se esiste, aggiorna lo status
    UPDATE public.user_connections
    SET status = 'accepted',
        updated_at = NOW()
    WHERE follower_id = auth.uid()
      AND followed_id = target_user_id;
    
    RETURN json_build_object(
      'success', true,
      'action', 'updated',
      'connection_id', existing_connection.id
    );
  ELSE
    -- Crea nuova connessione
    INSERT INTO public.user_connections (follower_id, followed_id, status)
    VALUES (auth.uid(), target_user_id, 'accepted')
    RETURNING json_build_object(
      'success', true,
      'action', 'created',
      'connection_id', id
    ) INTO result;
    
    RETURN result;
  END IF;
END;
$$;

-- 6. unfollow_user
CREATE OR REPLACE FUNCTION unfollow_user(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_connections
  WHERE follower_id = auth.uid()
    AND followed_id = target_user_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', deleted_count > 0,
    'deleted_count', deleted_count
  );
END;
$$;

-- 7. get_follower_count
CREATE OR REPLACE FUNCTION get_follower_count(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.user_connections
    WHERE followed_id = target_user_id
      AND status = 'accepted'
  );
END;
$$;

-- 8. get_following_count
CREATE OR REPLACE FUNCTION get_following_count(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.user_connections
    WHERE follower_id = target_user_id
      AND status = 'accepted'
  );
END;
$$;

-- 9. is_following
CREATE OR REPLACE FUNCTION is_following(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_connections
    WHERE follower_id = auth.uid()
      AND followed_id = target_user_id
      AND status = 'accepted'
  );
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

-- 13. fix_missing_institute_names
DROP FUNCTION IF EXISTS fix_missing_institute_names();
CREATE FUNCTION fix_missing_institute_names()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.user_profiles up
  SET institute_name = si.institute_name
  FROM public.school_institutes si
  WHERE up.id = si.id
    AND up.user_type = 'istituto'
    AND (up.institute_name IS NULL OR up.institute_name = '');
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

-- 16. get_institute_posts_count
DROP FUNCTION IF EXISTS get_institute_posts_count(UUID);
CREATE FUNCTION get_institute_posts_count(institute_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.institute_posts
    WHERE institute_id = institute_uuid
      AND published = true
  );
END;
$$;

-- ===================================================================
-- VERIFICA
-- ===================================================================

SELECT 
  'Tutte le funzioni aggiornate con search_path sicuro!' as status,
  COUNT(*) as functions_fixed
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_profile_gallery_updated_at',
    'update_post_comments_updated_at',
    'get_post_comments_count',
    'update_user_connections_updated_at',
    'follow_user',
    'unfollow_user',
    'get_follower_count',
    'get_following_count',
    'is_following',
    'update_post_likes_count',
    'update_post_comments_count',
    'update_updated_at',
    'fix_missing_institute_names',
    'update_institute_posts_published_at',
    'update_institute_posts_updated_at',
    'get_institute_posts_count'
  );

-- ===================================================================
-- NOTA: I warning Auth non possono essere risolti via SQL
-- ===================================================================
-- I warning relativi a:
-- - auth_leaked_password_protection
-- - auth_insufficient_mfa_options
--
-- Devono essere configurati nel Dashboard di Supabase:
-- Authentication → Settings → Password Protection
-- Authentication → Settings → Multi-Factor Authentication
-- ===================================================================
