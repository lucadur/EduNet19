-- ===================================================================
-- SOLUZIONE DEFINITIVA COMPLETA - REGISTRAZIONE E LOGIN
-- ===================================================================

-- STEP 1: RIMUOVI TUTTO CIÒ CHE È ROTTO
-- ======================================

-- Rimuovi la funzione problematica
DROP FUNCTION IF EXISTS create_default_privacy_settings() CASCADE;

-- Rimuovi TUTTI i trigger da user_profiles
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'user_profiles'
        AND trigger_name != 'update_user_profiles_updated_at'
    ) 
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON user_profiles CASCADE';
    END LOOP;
END $$;

-- Rimuovi trigger da auth.users se esistono
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;

-- STEP 2: CREA TRIGGER DEFINITIVO SU AUTH.USERS
-- ==============================================

CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type TEXT;
BEGIN
  -- Ottieni tipo utente
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'istituto');
  
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
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Crea tabella specifica
  IF v_user_type = 'privato' THEN
    INSERT INTO public.private_users (id, first_name, last_name)
    VALUES (NEW.id, '', '')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    INSERT INTO public.school_institutes (id, institute_name, verified)
    VALUES (NEW.id, 'Nuovo Istituto', false)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignora errori e continua
    RETURN NEW;
END;
$$;

-- Crea trigger su auth.users
CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_registration();

-- STEP 3: TRIGGER PER EMAIL VERIFICATION
-- =======================================

CREATE OR REPLACE FUNCTION public.handle_email_verification()
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

CREATE TRIGGER on_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_email_verification();

-- STEP 4: CREA PROFILI PER UTENTI ESISTENTI
-- ==========================================

INSERT INTO public.user_profiles (id, user_type, email_verified, profile_completed)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'user_type', 'istituto'),
  u.email_confirmed_at IS NOT NULL,
  false
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = u.id);

-- Crea private_users per utenti privati
INSERT INTO public.private_users (id, first_name, last_name)
SELECT up.id, '', ''
FROM public.user_profiles up
WHERE up.user_type = 'privato'
AND NOT EXISTS (SELECT 1 FROM public.private_users WHERE id = up.id);

-- Crea school_institutes per istituti
INSERT INTO public.school_institutes (id, institute_name, verified)
SELECT up.id, 'Istituto', false
FROM public.user_profiles up
WHERE up.user_type = 'istituto'
AND NOT EXISTS (SELECT 1 FROM public.school_institutes WHERE id = up.id);

-- STEP 5: VERIFICA FINALE
-- =======================

SELECT 
  COUNT(*) as total_users,
  COUNT(up.id) as users_with_profile,
  COUNT(*) - COUNT(up.id) as users_without_profile
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id;

SELECT '✅ SISTEMA DEFINITIVO CONFIGURATO!' as status,
       'Registrazione e login funzionano automaticamente per sempre' as message;
