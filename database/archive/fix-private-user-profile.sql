-- ===================================================================
-- FIX PROFILO UTENTE PRIVATO
-- Crea profilo per utente appena registrato
-- ===================================================================

-- Inserisci profilo per l'utente che ha appena fatto login
-- Sostituisci l'ID con quello che vedi nel log console
INSERT INTO user_profiles (
  id,
  user_type,
  first_name,
  last_name,
  email_verified,
  profile_completed,
  created_at
) VALUES (
  'f8cc47a5-2d7a-4a5b-befd-62fa44c61b45', -- ID dall'errore
  'privato',
  'Mario',
  'Rossi',
  true,
  true,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  user_type = EXCLUDED.user_type,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  profile_completed = true;

-- Verifica profilo creato
SELECT 
  id,
  user_type,
  first_name,
  last_name,
  profile_completed
FROM user_profiles
WHERE id = 'f8cc47a5-2d7a-4a5b-befd-62fa44c61b45';

-- Messaggio
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Profilo utente privato creato!';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ora prova a fare login di nuovo';
  RAISE NOTICE '   Email: mario.rossi@test.com';
  RAISE NOTICE '   Dovrebbe funzionare!';
  RAISE NOTICE '';
END $$;
