-- ===================================================================
-- SISTEMA INVITI AUTO-ADMIN
-- Gli invitati diventano automaticamente admin quando si registrano
-- ===================================================================

-- Abilita estensione pgcrypto se non esiste
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Modifica la funzione invite_institute_admin per creare direttamente l'admin
CREATE OR REPLACE FUNCTION invite_institute_admin(
  p_institute_id UUID,
  p_email TEXT,
  p_role TEXT DEFAULT 'admin'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_id UUID;
  v_invite_token TEXT;
  v_existing_user_id UUID;
  v_result JSON;
BEGIN
  -- Verifica permessi
  IF NOT can_manage_admins(p_institute_id) THEN
    RAISE EXCEPTION 'Non hai i permessi per invitare amministratori';
  END IF;

  -- Verifica se l'email è già registrata
  SELECT id INTO v_existing_user_id
  FROM auth.users
  WHERE email = p_email;

  -- Se l'utente esiste già, aggiungilo direttamente come admin
  IF v_existing_user_id IS NOT NULL THEN
    -- Verifica se è già admin
    IF EXISTS (
      SELECT 1 FROM institute_admins
      WHERE institute_id = p_institute_id
        AND user_id = v_existing_user_id
        AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Questo utente è già un amministratore';
    END IF;

    -- Aggiungi come admin direttamente
    INSERT INTO institute_admins (institute_id, user_id, role, status)
    VALUES (p_institute_id, v_existing_user_id, p_role, 'active');

    RETURN json_build_object(
      'success', true,
      'message', 'Utente aggiunto come amministratore',
      'user_exists', true
    );
  END IF;

  -- Se l'utente non esiste, crea un invito che lo renderà admin automaticamente
  v_invite_token := gen_random_uuid()::text;
  
  INSERT INTO institute_admin_invites (
    institute_id,
    email,
    role,
    invited_by,
    invite_token,
    expires_at,
    accepted
  ) VALUES (
    p_institute_id,
    p_email,
    p_role,
    auth.uid(),
    v_invite_token,
    NOW() + INTERVAL '7 days',
    false
  )
  RETURNING id INTO v_invite_id;

  RETURN json_build_object(
    'success', true,
    'invite_id', v_invite_id,
    'invite_token', v_invite_token,
    'invite_url', 'https://tuodominio.com/accept-invite?token=' || v_invite_token,
    'user_exists', false,
    'message', 'Invito creato. L''utente diventerà admin automaticamente alla registrazione.'
  );
END;
$$;

-- 2. Crea un trigger che rende automaticamente admin chi si registra con email invitata
CREATE OR REPLACE FUNCTION auto_accept_admin_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
BEGIN
  -- Cerca inviti pendenti per questa email
  FOR v_invite IN
    SELECT id, institute_id, role, invite_token
    FROM institute_admin_invites
    WHERE email = NEW.email
      AND accepted = false
      AND expires_at > NOW()
  LOOP
    -- Aggiungi l'utente come admin
    INSERT INTO institute_admins (institute_id, user_id, role, status)
    VALUES (v_invite.institute_id, NEW.id, v_invite.role, 'active')
    ON CONFLICT (institute_id, user_id) DO NOTHING;

    -- Marca l'invito come accettato
    UPDATE institute_admin_invites
    SET accepted = true,
        accepted_at = NOW()
    WHERE id = v_invite.id;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Rimuovi il trigger se esiste già
DROP TRIGGER IF EXISTS auto_accept_admin_invite_trigger ON user_profiles;

-- Crea il trigger sulla tabella user_profiles (si attiva dopo la registrazione)
CREATE TRIGGER auto_accept_admin_invite_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_accept_admin_invite();

-- 3. Aggiorna anche la funzione di accettazione manuale (per chi usa il link)
CREATE OR REPLACE FUNCTION accept_admin_invite(p_invite_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Devi essere autenticato per accettare un invito';
  END IF;

  -- Trova l'invito
  SELECT * INTO v_invite
  FROM institute_admin_invites
  WHERE invite_token = p_invite_token
    AND accepted = false
    AND expires_at > NOW();

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invito non valido o scaduto';
  END IF;

  -- Verifica che l'email corrisponda
  IF v_invite.email != (SELECT email FROM auth.users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'Questo invito non è per il tuo account';
  END IF;

  -- Aggiungi come admin
  INSERT INTO institute_admins (institute_id, user_id, role, status)
  VALUES (v_invite.institute_id, v_user_id, v_invite.role, 'active')
  ON CONFLICT (institute_id, user_id) DO NOTHING;

  -- Marca come accettato
  UPDATE institute_admin_invites
  SET accepted = true,
      accepted_at = NOW()
  WHERE id = v_invite.id;

  RETURN json_build_object(
    'success', true,
    'institute_id', v_invite.institute_id,
    'role', v_invite.role
  );
END;
$$;

SELECT '✅ Sistema inviti auto-admin configurato!' as status,
       'Gli utenti invitati diventano automaticamente admin alla registrazione' as message;
