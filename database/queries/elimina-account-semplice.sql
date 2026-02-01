-- ===================================================================
-- ELIMINA ACCOUNT - Script Semplificato
-- ===================================================================
-- Elimina solo le tabelle essenziali per permettere nuova registrazione

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Trova ID utente
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'amilcare.ciconte@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE 'Trovato utente con ID: %', v_user_id;
    
    -- Elimina dati specifici istituto
    DELETE FROM school_institutes WHERE id = v_user_id;
    RAISE NOTICE 'Eliminato da school_institutes';
    
    -- Elimina dati specifici utente privato
    DELETE FROM private_users WHERE id = v_user_id;
    RAISE NOTICE 'Eliminato da private_users';
    
    -- Elimina profilo generico
    DELETE FROM user_profiles WHERE id = v_user_id;
    RAISE NOTICE 'Eliminato da user_profiles';
    
    -- Elimina utente da auth (potrebbe richiedere permessi admin)
    DELETE FROM auth.users WHERE id = v_user_id;
    RAISE NOTICE 'Eliminato da auth.users';
    
    RAISE NOTICE '✅ Utente eliminato con successo!';
  ELSE
    RAISE NOTICE '❌ Utente con email amilcare.ciconte@gmail.com non trovato';
  END IF;
END $$;

-- Verifica eliminazione
SELECT 
  'Verifica eliminazione' as status,
  COUNT(*) as utenti_rimasti 
FROM auth.users 
WHERE email = 'amilcare.ciconte@gmail.com';
