-- Elimina la vecchia funzione con gen_random_bytes

-- Elimina tutte le versioni della funzione
DROP FUNCTION IF EXISTS invite_institute_admin(UUID, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS invite_institute_admin(UUID, TEXT, TEXT);

-- Ora ricrea solo quella corretta (dal file 🚀_INVITI_AUTO_ADMIN.sql)
-- Copia e incolla qui la funzione corretta dal file precedente

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

SELECT '✅ Funzione vecchia eliminata e ricreata correttamente!' as status;
