-- ===================================================================
-- FIX URGENTE LOGIN - CREA PROFILI PER TUTTI GLI UTENTI ESISTENTI
-- ===================================================================

-- STEP 1: Crea profili per TUTTI gli utenti in auth.users che non ce l'hanno
-- ===========================================================================

DO $$
DECLARE
  v_user RECORD;
  v_user_type TEXT;
BEGIN
  FOR v_user IN 
    SELECT u.id, u.email, u.email_confirmed_at, u.raw_user_meta_data
    FROM auth.users u
  LOOP
    -- Determina tipo utente
    v_user_type := COALESCE(v_user.raw_user_meta_data->>'user_type', 'istituto');
    
    -- Crea/aggiorna user_profiles
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
    ) ON CONFLICT (id) DO UPDATE SET
      email_verified = v_user.email_confirmed_at IS NOT NULL;
    
    -- Crea private_users se necessario
    IF v_user_type = 'privato' THEN
      INSERT INTO public.private_users (
        id,
        first_name,
        last_name,
        created_at
      ) VALUES (
        v_user.id,
        '',
        '',
        NOW()
      ) ON CONFLICT (id) DO NOTHING;
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
    
    RAISE NOTICE 'Profilo creato per: % (tipo: %)', v_user.email, v_user_type;
  END LOOP;
END $$;

-- STEP 2: Verifica che tutti gli utenti abbiano un profilo
-- =========================================================

SELECT 
  u.id,
  u.email,
  up.user_type,
  CASE 
    WHEN up.id IS NULL THEN '❌ MANCA PROFILO'
    ELSE '✅ OK'
  END as status
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
ORDER BY u.created_at DESC;

SELECT '✅ PROFILI CREATI PER TUTTI GLI UTENTI!' as status,
       'Ora il login dovrebbe funzionare' as message;
