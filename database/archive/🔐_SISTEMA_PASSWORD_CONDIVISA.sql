-- ===================================================================
-- SISTEMA PASSWORD CONDIVISA PER COLLABORATORI
-- ===================================================================

-- 1. Aggiungi colonna per password condivisa nella tabella istituti
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS shared_password TEXT;

-- 2. Genera password condivisa per istituti esistenti (se non ce l'hanno)
UPDATE school_institutes
SET shared_password = substring(md5(random()::text) from 1 for 12) || '!'
WHERE shared_password IS NULL;

-- 3. Funzione per invitare admin con creazione automatica account
CREATE OR REPLACE FUNCTION invite_admin_with_shared_password(
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
  v_shared_password TEXT;
  v_new_user_id UUID;
  v_existing_user_id UUID;
BEGIN
  -- Verifica permessi
  IF NOT can_manage_admins(p_institute_id) THEN
    RAISE EXCEPTION 'Non hai i permessi per invitare amministratori';
  END IF;

  -- Ottieni la password condivisa dell'istituto
  SELECT shared_password INTO v_shared_password
  FROM school_institutes
  WHERE id = p_institute_id;

  -- Se non esiste, generala
  IF v_shared_password IS NULL THEN
    v_shared_password := substring(md5(random()::text) from 1 for 12) || '!';
    UPDATE school_institutes
    SET shared_password = v_shared_password
    WHERE id = p_institute_id;
  END IF;

  -- Verifica se l'utente esiste già
  SELECT id INTO v_existing_user_id
  FROM auth.users
  WHERE email = p_email;

  -- Se l'utente esiste già
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

    -- Aggiungilo come admin
    INSERT INTO institute_admins (institute_id, user_id, role, status)
    VALUES (p_institute_id, v_existing_user_id, p_role, 'active');

    RETURN json_build_object(
      'success', true,
      'message', 'Utente esistente aggiunto come amministratore',
      'user_exists', true,
      'email', p_email
    );
  END IF;

  -- Crea nuovo utente con password condivisa
  -- NOTA: Questa parte richiede privilegi admin su auth.users
  -- Alternativa: usa Supabase Admin API dal backend
  
  RETURN json_build_object(
    'success', true,
    'message', 'Invito creato',
    'user_exists', false,
    'email', p_email,
    'shared_password', v_shared_password,
    'instructions', 'Comunica al collaboratore: Email: ' || p_email || ' - Password: ' || v_shared_password
  );
END;
$$;

-- 4. Funzione per ottenere la password condivisa (solo per admin)
CREATE OR REPLACE FUNCTION get_shared_password(p_institute_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_password TEXT;
BEGIN
  -- Verifica che l'utente sia admin dell'istituto
  IF NOT can_manage_admins(p_institute_id) THEN
    RAISE EXCEPTION 'Non hai i permessi per visualizzare la password condivisa';
  END IF;

  SELECT shared_password INTO v_password
  FROM school_institutes
  WHERE id = p_institute_id;

  RETURN v_password;
END;
$$;

-- 5. Funzione per cambiare la password condivisa
CREATE OR REPLACE FUNCTION change_shared_password(
  p_institute_id UUID,
  p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifica permessi
  IF NOT can_manage_admins(p_institute_id) THEN
    RAISE EXCEPTION 'Non hai i permessi per modificare la password condivisa';
  END IF;

  -- Valida password (minimo 8 caratteri)
  IF length(p_new_password) < 8 THEN
    RAISE EXCEPTION 'La password deve essere di almeno 8 caratteri';
  END IF;

  -- Aggiorna password
  UPDATE school_institutes
  SET shared_password = p_new_password
  WHERE id = p_institute_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Password condivisa aggiornata con successo'
  );
END;
$$;

SELECT '✅ Sistema password condivisa configurato!' as status;
