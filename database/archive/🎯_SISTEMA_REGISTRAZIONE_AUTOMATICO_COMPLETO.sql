-- ===================================================================
-- SISTEMA REGISTRAZIONE AUTOMATICO COMPLETO
-- Crea automaticamente i profili quando un utente si registra
-- ===================================================================

-- STEP 1: Pulisci tutto
-- =====================

-- Rimuovi trigger esistenti problematici
DROP TRIGGER IF EXISTS auto_accept_admin_invite_trigger ON user_profiles;
DROP TRIGGER IF EXISTS create_user_profile_trigger ON user_profiles;
DROP TRIGGER IF EXISTS sync_user_email_trigger ON user_profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Rimuovi funzioni vecchie
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_profile_for_new_user() CASCADE;

-- STEP 2: RLS Policy Semplici e Funzionanti
-- ==========================================

-- user_profiles
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated" ON user_profiles;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON user_profiles;

CREATE POLICY "allow_all_for_authenticated"
ON user_profiles FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- private_users
ALTER TABLE private_users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated_private" ON private_users;

CREATE POLICY "allow_all_for_authenticated_private"
ON private_users FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

ALTER TABLE private_users ENABLE ROW LEVEL SECURITY;

-- school_institutes
ALTER TABLE school_institutes DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated_institutes" ON school_institutes;

CREATE POLICY "allow_all_for_authenticated_institutes"
ON school_institutes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

ALTER TABLE school_institutes ENABLE ROW LEVEL SECURITY;

-- STEP 3: Funzione per Creare Profilo Automaticamente
-- ====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type TEXT;
  v_email TEXT;
BEGIN
  -- Ottieni email dall'utente
  v_email := NEW.email;
  
  -- Determina il tipo di utente dal metadata o default a 'privato'
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'privato');
  
  -- Crea record in user_profiles
  INSERT INTO public.user_profiles (
    id,
    user_type,
    email_verified,
    profile_completed,
    created_at
  ) VALUES (
    NEW.id,
    v_user_type,
    NEW.email_confirmed_at IS NOT NULL,
    false,
    NOW()
  );
  
  -- Se è un utente privato, crea anche il record in private_users
  IF v_user_type = 'privato' THEN
    INSERT INTO public.private_users (
      id,
      created_at
    ) VALUES (
      NEW.id,
      NOW()
    );
  END IF;
  
  -- Se è un istituto, crea anche il record in school_institutes
  IF v_user_type = 'istituto' THEN
    INSERT INTO public.school_institutes (
      id,
      institute_name,
      verified,
      created_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'institute_name', 'Nuovo Istituto'),
      false,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- STEP 4: Crea Trigger su auth.users
-- ===================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 5: Funzione per Aggiornare email_verified
-- ===============================================

CREATE OR REPLACE FUNCTION public.handle_user_email_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quando l'email viene confermata, aggiorna user_profiles
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.user_profiles
    SET email_verified = true
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_user_email_verified();

-- STEP 6: Crea Profili per Utenti Esistenti Senza Profilo
-- =========================================================

DO $$
DECLARE
  v_user RECORD;
  v_user_type TEXT;
BEGIN
  FOR v_user IN 
    SELECT u.id, u.email, u.email_confirmed_at, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.user_profiles up ON u.id = up.id
    WHERE up.id IS NULL
  LOOP
    -- Determina tipo utente
    v_user_type := COALESCE(v_user.raw_user_meta_data->>'user_type', 'privato');
    
    -- Crea user_profiles
    INSERT INTO public.user_profiles (
      id,
      user_type,
      email_verified,
      profile_completed,
      created_at
    ) VALUES (
      v_user.id,
      v_user_type,
      v_user.email_confirmed_at IS NOT NULL,
      false,
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Crea private_users se necessario
    IF v_user_type = 'privato' THEN
      INSERT INTO public.private_users (id, created_at)
      VALUES (v_user.id, NOW())
      ON CONFLICT (id) DO NOTHING;
    END IF;
    
    -- Crea school_institutes se necessario
    IF v_user_type = 'istituto' THEN
      INSERT INTO public.school_institutes (
        id,
        institute_name,
        verified,
        created_at
      ) VALUES (
        v_user.id,
        COALESCE(v_user.raw_user_meta_data->>'institute_name', 'Istituto'),
        false,
        NOW()
      ) ON CONFLICT (id) DO NOTHING;
    END IF;
  END LOOP;
END $$;

SELECT '✅ SISTEMA REGISTRAZIONE AUTOMATICO CONFIGURATO!' as status,
       'Ora la registrazione funziona automaticamente per privati e istituti' as message;
