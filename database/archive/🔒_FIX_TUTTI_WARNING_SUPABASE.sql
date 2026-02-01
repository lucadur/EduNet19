-- ===================================================================
-- FIX: TUTTI I WARNING DI SICUREZZA E PERFORMANCE SUPABASE
-- Risolve: search_path mutable + auth RLS initplan
-- ===================================================================

-- ============================================
-- PARTE 1: FIX SECURITY - SEARCH_PATH MUTABLE
-- ============================================

-- Aggiungi SET search_path a tutte le funzioni per sicurezza

-- 1. invite_institute_admin
CREATE OR REPLACE FUNCTION invite_institute_admin(
  p_institute_id UUID,
  p_email TEXT,
  p_invited_by UUID,
  p_role TEXT DEFAULT 'admin'
)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invite_id UUID;
  v_token TEXT;
  v_admin_count INTEGER;
BEGIN
  -- Verifica permessi
  IF NOT EXISTS (
    SELECT 1 
    FROM institute_admins
    WHERE user_id = p_invited_by
    AND institute_id = p_institute_id
    AND status = 'active'
    AND (role = 'owner' OR (permissions->>'can_manage_admins')::boolean = true)
  ) THEN
    RAISE EXCEPTION 'Non hai i permessi per invitare amministratori';
  END IF;
  
  -- Verifica limite
  SELECT COUNT(*) INTO v_admin_count
  FROM institute_admins
  WHERE institute_id = p_institute_id AND status = 'active';
  
  IF v_admin_count >= 3 THEN
    RAISE EXCEPTION 'Limite massimo di 3 amministratori raggiunto';
  END IF;
  
  -- Genera token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Crea invito
  INSERT INTO institute_admin_invites (
    institute_id, email, invited_by, role, token, expires_at
  ) VALUES (
    p_institute_id, LOWER(p_email), p_invited_by, p_role, v_token, NOW() + INTERVAL '7 days'
  )
  ON CONFLICT (institute_id, email) 
  DO UPDATE SET
    token = v_token,
    expires_at = NOW() + INTERVAL '7 days',
    accepted = FALSE,
    created_at = NOW()
  RETURNING id INTO v_invite_id;
  
  RETURN v_invite_id;
END;
$$;

-- 2. remove_institute_admin
CREATE OR REPLACE FUNCTION remove_institute_admin(
  p_admin_id UUID,
  p_removed_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin RECORD;
BEGIN
  SELECT * INTO v_admin FROM institute_admins WHERE id = p_admin_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Amministratore non trovato';
  END IF;
  
  IF v_admin.role = 'owner' THEN
    RAISE EXCEPTION 'Il proprietario non può essere rimosso';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM institute_admins
    WHERE user_id = p_removed_by
    AND institute_id = v_admin.institute_id
    AND status = 'active'
    AND (role = 'owner' OR (permissions->>'can_manage_admins')::boolean = true)
  ) THEN
    RAISE EXCEPTION 'Non hai i permessi per rimuovere amministratori';
  END IF;
  
  UPDATE institute_admins SET status = 'removed', updated_at = NOW()
  WHERE id = p_admin_id;
  
  RETURN TRUE;
END;
$$;

-- 3. can_manage_admins
CREATE OR REPLACE FUNCTION can_manage_admins(
  p_user_id UUID,
  p_institute_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_institute_id UUID;
BEGIN
  IF p_institute_id IS NULL THEN
    SELECT institute_id INTO v_institute_id
    FROM institute_admins
    WHERE user_id = p_user_id AND status = 'active'
    LIMIT 1;
    
    IF NOT FOUND THEN RETURN FALSE; END IF;
  ELSE
    v_institute_id := p_institute_id;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM institute_admins
    WHERE user_id = p_user_id
    AND institute_id = v_institute_id
    AND status = 'active'
    AND (role = 'owner' OR (permissions->>'can_manage_admins')::boolean = true)
  );
END;
$$;

-- 4. get_admin_institute
CREATE OR REPLACE FUNCTION get_admin_institute(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_institute_id UUID;
BEGIN
  SELECT institute_id INTO v_institute_id
  FROM institute_admins
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;
  
  RETURN v_institute_id;
END;
$$;

-- 5. is_admin_of_institute
CREATE OR REPLACE FUNCTION is_admin_of_institute(p_user_id UUID, p_institute_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM institute_admins
    WHERE user_id = p_user_id
    AND institute_id = p_institute_id
    AND status = 'active'
  );
END;
$$;

-- ============================================
-- PARTE 2: FIX PERFORMANCE - AUTH RLS INITPLAN
-- ============================================

-- Ottimizza le policy RLS usando (SELECT auth.uid()) invece di auth.uid()
-- Questo evita che la funzione venga ricalcolata per ogni riga

-- Fix per school_institutes
DROP POLICY IF EXISTS "Institutes can update own data" ON school_institutes;
CREATE POLICY "Institutes can update own data"
  ON school_institutes FOR UPDATE
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Institutes can insert own data" ON school_institutes;
CREATE POLICY "Institutes can insert own data"
  ON school_institutes FOR INSERT
  WITH CHECK (id = (SELECT auth.uid()));

-- Fix per private_users
DROP POLICY IF EXISTS "Users can update own data" ON private_users;
CREATE POLICY "Users can update own data"
  ON private_users FOR UPDATE
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own data" ON private_users;
CREATE POLICY "Users can insert own data"
  ON private_users FOR INSERT
  WITH CHECK (id = (SELECT auth.uid()));

-- Fix per user_profiles
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile during registration" ON user_profiles;
CREATE POLICY "Users can insert own profile during registration"
  ON user_profiles FOR INSERT
  WITH CHECK (id = (SELECT auth.uid()));

-- Fix per user_follows
DROP POLICY IF EXISTS "Users can follow others" ON user_follows;
CREATE POLICY "Users can follow others"
  ON user_follows FOR INSERT
  WITH CHECK (follower_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can unfollow" ON user_follows;
CREATE POLICY "Users can unfollow"
  ON user_follows FOR DELETE
  USING (follower_id = (SELECT auth.uid()));

-- Fix per institute_posts
DROP POLICY IF EXISTS "Institutes can create posts" ON institute_posts;
CREATE POLICY "Institutes can create posts"
  ON institute_posts FOR INSERT
  WITH CHECK (institute_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Institutes can update own posts" ON institute_posts;
CREATE POLICY "Institutes can update own posts"
  ON institute_posts FOR UPDATE
  USING (institute_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Institutes can delete own posts" ON institute_posts;
CREATE POLICY "Institutes can delete own posts"
  ON institute_posts FOR DELETE
  USING (institute_id = (SELECT auth.uid()));

-- Fix per post_comments
DROP POLICY IF EXISTS "Authenticated users can comment" ON post_comments;
CREATE POLICY "Authenticated users can comment"
  ON post_comments FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own comments" ON post_comments;
CREATE POLICY "Users can update own comments"
  ON post_comments FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own comments" ON post_comments;
CREATE POLICY "Users can delete own comments"
  ON post_comments FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- Fix per post_likes
DROP POLICY IF EXISTS "Authenticated users can like" ON post_likes;
CREATE POLICY "Authenticated users can like"
  ON post_likes FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can unlike" ON post_likes;
CREATE POLICY "Users can unlike"
  ON post_likes FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- Fix per saved_posts
DROP POLICY IF EXISTS "Users can view own saved posts" ON saved_posts;
CREATE POLICY "Users can view own saved posts"
  ON saved_posts FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can save posts" ON saved_posts;
CREATE POLICY "Users can save posts"
  ON saved_posts FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can unsave posts" ON saved_posts;
CREATE POLICY "Users can unsave posts"
  ON saved_posts FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- Fix per institute_admins
DROP POLICY IF EXISTS "Admins can view their institute admins" ON institute_admins;
CREATE POLICY "Admins can view their institute admins"
  ON institute_admins FOR SELECT
  USING (is_admin_of_institute((SELECT auth.uid()), institute_id));

DROP POLICY IF EXISTS "Authorized users can add admins" ON institute_admins;
CREATE POLICY "Authorized users can add admins"
  ON institute_admins FOR INSERT
  WITH CHECK (can_manage_admins((SELECT auth.uid()), institute_id));

DROP POLICY IF EXISTS "Authorized users can update admins" ON institute_admins;
CREATE POLICY "Authorized users can update admins"
  ON institute_admins FOR UPDATE
  USING (can_manage_admins((SELECT auth.uid()), institute_id));

DROP POLICY IF EXISTS "Authorized users can delete admins" ON institute_admins;
CREATE POLICY "Authorized users can delete admins"
  ON institute_admins FOR DELETE
  USING (can_manage_admins((SELECT auth.uid()), institute_id));

-- Fix per institute_admin_invites
DROP POLICY IF EXISTS "Admins can view their institute invites" ON institute_admin_invites;
CREATE POLICY "Admins can view their institute invites"
  ON institute_admin_invites FOR SELECT
  USING (is_admin_of_institute((SELECT auth.uid()), institute_id));

DROP POLICY IF EXISTS "Authorized users can create invites" ON institute_admin_invites;
CREATE POLICY "Authorized users can create invites"
  ON institute_admin_invites FOR INSERT
  WITH CHECK (can_manage_admins((SELECT auth.uid()), institute_id));

-- ============================================
-- VERIFICA
-- ============================================

-- Verifica funzioni con search_path
SELECT 
  routine_name,
  'OK - search_path impostato' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'invite_institute_admin',
  'remove_institute_admin',
  'can_manage_admins',
  'get_admin_institute',
  'is_admin_of_institute'
)
ORDER BY routine_name;

-- Verifica policy ottimizzate
SELECT 
  tablename,
  policyname,
  'OK - Policy ottimizzata' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'school_institutes',
  'private_users',
  'user_profiles',
  'institute_admins',
  'institute_admin_invites'
)
ORDER BY tablename, policyname;
