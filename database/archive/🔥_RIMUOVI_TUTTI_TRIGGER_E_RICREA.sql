-- ===================================================================
-- RIMUOVI TUTTI I TRIGGER PROBLEMATICI E RICREA SISTEMA PULITO
-- ===================================================================

-- STEP 1: Rimuovi TUTTI i trigger da user_profiles
-- =================================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'user_profiles') 
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON user_profiles CASCADE';
    END LOOP;
END $$;

-- STEP 2: Rimuovi funzioni problematiche
-- =======================================
DROP FUNCTION IF EXISTS create_default_privacy_settings() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_profile_for_new_user() CASCADE;
DROP FUNCTION IF EXISTS auto_accept_admin_invite() CASCADE;

-- STEP 3: Ricrea solo il trigger per updated_at
-- ==============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- STEP 4: RLS Policy Permissive
-- ==============================
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_for_authenticated" ON user_profiles;

CREATE POLICY "full_access_authenticated"
ON user_profiles FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- private_users
ALTER TABLE private_users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_for_authenticated_private" ON private_users;

CREATE POLICY "full_access_authenticated_private"
ON private_users FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

ALTER TABLE private_users ENABLE ROW LEVEL SECURITY;

-- school_institutes  
ALTER TABLE school_institutes DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_for_authenticated_institutes" ON school_institutes;

CREATE POLICY "full_access_authenticated_institutes"
ON school_institutes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

ALTER TABLE school_institutes ENABLE ROW LEVEL SECURITY;

-- STEP 5: Crea Trigger Automatico su auth.users (SEMPLICE)
-- =========================================================
CREATE OR REPLACE FUNCTION public.auto_create_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type TEXT;
BEGIN
  -- Ottieni tipo utente dal metadata
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'privato');
  
  -- Crea user_profiles
  INSERT INTO public.user_profiles (
    id,
    user_type,
    email_verified,
    profile_completed
  ) VALUES (
    NEW.id,
    v_user_type,
    NEW.email_confirmed_at IS NOT NULL,
    false
  );
  
  -- Crea tabella specifica
  IF v_user_type = 'privato' THEN
    INSERT INTO public.private_users (id) VALUES (NEW.id);
  ELSIF v_user_type = 'istituto' THEN
    INSERT INTO public.school_institutes (
      id,
      institute_name,
      verified
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'institute_name', 'Nuovo Istituto'),
      false
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignora errori (profilo già esistente)
    RETURN NEW;
END;
$$;

-- Rimuovi trigger esistente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crea nuovo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_profile();

-- STEP 6: Trigger per aggiornare email_verified
-- ==============================================
CREATE OR REPLACE FUNCTION public.update_email_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.user_profiles
    SET email_verified = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;

CREATE TRIGGER on_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.update_email_verified();

-- STEP 7: Crea profili per utenti esistenti
-- ==========================================
INSERT INTO public.user_profiles (id, user_type, email_verified, profile_completed)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'user_type', 'privato'),
  u.email_confirmed_at IS NOT NULL,
  false
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Crea private_users per utenti privati senza profilo
INSERT INTO public.private_users (id)
SELECT up.id
FROM public.user_profiles up
LEFT JOIN public.private_users pu ON up.id = pu.id
WHERE up.user_type = 'privato' AND pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Crea school_institutes per istituti senza profilo
INSERT INTO public.school_institutes (id, institute_name, verified)
SELECT up.id, 'Istituto', false
FROM public.user_profiles up
LEFT JOIN public.school_institutes si ON up.id = si.id
WHERE up.user_type = 'istituto' AND si.id IS NULL
ON CONFLICT (id) DO NOTHING;

SELECT '✅ SISTEMA PULITO E RICREATO!' as status,
       'Registrazione automatica attiva' as message;
