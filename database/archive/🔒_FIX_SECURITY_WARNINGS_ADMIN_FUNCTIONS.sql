-- ===================================================================
-- FIX SECURITY WARNINGS - Admin Functions
-- Aggiunge search_path sicuro a tutte le funzioni
-- ===================================================================

-- 1. count_active_admins
CREATE OR REPLACE FUNCTION count_active_admins(p_institute_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM institute_admins
    WHERE institute_id = p_institute_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- 2. is_institute_admin
CREATE OR REPLACE FUNCTION is_institute_admin(p_user_id UUID, p_institute_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM institute_admins
    WHERE user_id = p_user_id
    AND institute_id = p_institute_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- 3. can_manage_admins
CREATE OR REPLACE FUNCTION can_manage_admins(p_user_id UUID, p_institute_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM institute_admins
    WHERE user_id = p_user_id
    AND institute_id = p_institute_id
    AND status = 'active'
    AND (role = 'owner' OR (permissions->>'can_manage_admins')::boolean = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- 4. check_max_admins
CREATE OR REPLACE FUNCTION check_max_admins()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM institute_admins
  WHERE institute_id = NEW.institute_id
  AND status = 'active';
  
  IF TG_OP = 'INSERT' AND admin_count >= 3 THEN
    RAISE EXCEPTION 'Limite massimo di 3 amministratori raggiunto per questo istituto';
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active' AND admin_count >= 3 THEN
    RAISE EXCEPTION 'Limite massimo di 3 amministratori raggiunto per questo istituto';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- 5. update_institute_admins_timestamp
CREATE OR REPLACE FUNCTION update_institute_admins_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

-- 6. create_institute_owner
CREATE OR REPLACE FUNCTION create_institute_owner(
  p_institute_id UUID,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  INSERT INTO institute_admins (
    institute_id,
    user_id,
    role,
    status,
    permissions,
    accepted_at
  ) VALUES (
    p_institute_id,
    p_user_id,
    'owner',
    'active',
    '{"can_edit_profile": true, "can_create_posts": true, "can_delete_posts": true, "can_manage_admins": true}'::jsonb,
    NOW()
  )
  RETURNING id INTO v_admin_id;
  
  RETURN v_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- 7. invite_institute_admin
CREATE OR REPLACE FUNCTION invite_institute_admin(
  p_institute_id UUID,
  p_email TEXT,
  p_invited_by UUID,
  p_role TEXT DEFAULT 'admin'
)
RETURNS UUID AS $$
DECLARE
  v_invite_id UUID;
  v_token TEXT;
  v_admin_count INTEGER;
BEGIN
  IF NOT can_manage_admins(p_invited_by, p_institute_id) THEN
    RAISE EXCEPTION 'Non hai i permessi per invitare amministratori';
  END IF;
  
  SELECT count_active_admins(p_institute_id) INTO v_admin_count;
  IF v_admin_count >= 3 THEN
    RAISE EXCEPTION 'Limite massimo di 3 amministratori raggiunto';
  END IF;
  
  v_token := encode(gen_random_bytes(32), 'hex');
  
  INSERT INTO institute_admin_invites (
    institute_id,
    email,
    invited_by,
    role,
    token
  ) VALUES (
    p_institute_id,
    LOWER(p_email),
    p_invited_by,
    p_role,
    v_token
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- 8. accept_admin_invite
CREATE OR REPLACE FUNCTION accept_admin_invite(
  p_token TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_invite RECORD;
  v_user_email TEXT;
BEGIN
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  SELECT * INTO v_invite
  FROM institute_admin_invites
  WHERE token = p_token
  AND accepted = FALSE
  AND expires_at > NOW()
  AND LOWER(email) = LOWER(v_user_email);
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invito non valido o scaduto';
  END IF;
  
  INSERT INTO institute_admins (
    institute_id,
    user_id,
    role,
    status,
    invited_by,
    invited_at,
    accepted_at
  ) VALUES (
    v_invite.institute_id,
    p_user_id,
    v_invite.role,
    'active',
    v_invite.invited_by,
    v_invite.created_at,
    NOW()
  );
  
  UPDATE institute_admin_invites
  SET accepted = TRUE, accepted_at = NOW()
  WHERE id = v_invite.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- 9. remove_institute_admin
CREATE OR REPLACE FUNCTION remove_institute_admin(
  p_admin_id UUID,
  p_removed_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin RECORD;
BEGIN
  SELECT * INTO v_admin
  FROM institute_admins
  WHERE id = p_admin_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Amministratore non trovato';
  END IF;
  
  IF v_admin.role = 'owner' THEN
    RAISE EXCEPTION 'Non è possibile rimuovere il proprietario dell''istituto';
  END IF;
  
  IF NOT can_manage_admins(p_removed_by, v_admin.institute_id) THEN
    RAISE EXCEPTION 'Non hai i permessi per rimuovere amministratori';
  END IF;
  
  UPDATE institute_admins
  SET status = 'removed', updated_at = NOW()
  WHERE id = p_admin_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- 10. get_admin_institute
CREATE OR REPLACE FUNCTION get_admin_institute(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_institute_id UUID;
BEGIN
  SELECT institute_id INTO v_institute_id
  FROM institute_admins
  WHERE user_id = p_user_id
  AND status = 'active'
  LIMIT 1;
  
  RETURN v_institute_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- 11. fix_incomplete_institute_account
CREATE OR REPLACE FUNCTION fix_incomplete_institute_account(
  p_user_id UUID,
  p_institute_name TEXT,
  p_institute_type TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF p_email IS NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  ELSE
    v_email := p_email;
  END IF;
  
  INSERT INTO school_institutes (
    id,
    institute_name,
    institute_type,
    email,
    verified,
    created_at
  ) VALUES (
    p_user_id,
    p_institute_name,
    p_institute_type,
    v_email,
    false,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    institute_name = EXCLUDED.institute_name,
    institute_type = EXCLUDED.institute_type,
    email = COALESCE(EXCLUDED.email, school_institutes.email);
  
  PERFORM create_institute_owner(p_user_id, p_user_id);
  
  RAISE NOTICE 'Account istituto fixato con successo!';
  RETURN TRUE;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Errore: %', SQLERRM;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- ===================================================================
-- FINE FIX SECURITY WARNINGS
-- ===================================================================

-- Verifica che tutte le funzioni abbiano search_path
SELECT 
  routine_name,
  routine_type,
  security_type,
  CASE 
    WHEN prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security,
  proconfig as config
FROM information_schema.routines r
LEFT JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_schema = 'public'
AND routine_name IN (
  'count_active_admins',
  'is_institute_admin',
  'can_manage_admins',
  'check_max_admins',
  'update_institute_admins_timestamp',
  'create_institute_owner',
  'invite_institute_admin',
  'accept_admin_invite',
  'remove_institute_admin',
  'get_admin_institute',
  'fix_incomplete_institute_account'
)
ORDER BY routine_name;
