-- ===================================================================
-- FIX VALIDAZIONE ISTITUTI - EduNet19
-- Corregge profili con tipo errato e crea record mancanti
-- ===================================================================

-- 1. Trova e correggi utenti con dati istituto ma segnati come privati
-- (Solo se hanno codice meccanografico valido)
UPDATE user_profiles up
SET user_type = 'istituto'
FROM school_institutes si
WHERE up.id = si.id
  AND up.user_type = 'privato'
  AND si.institute_code IS NOT NULL
  AND si.institute_code != ''
  AND LENGTH(si.institute_code) >= 8;

-- 2. Crea record mancanti in private_users per utenti privati
INSERT INTO private_users (id, first_name, last_name)
SELECT 
  up.id,
  COALESCE(
    au.raw_user_meta_data->>'first_name',
    au.raw_user_meta_data->>'name',
    SPLIT_PART(au.email, '@', 1)
  ) as first_name,
  COALESCE(
    au.raw_user_meta_data->>'last_name',
    au.raw_user_meta_data->>'surname',
    ''
  ) as last_name
FROM user_profiles up
LEFT JOIN private_users pu ON up.id = pu.id
JOIN auth.users au ON up.id = au.id
WHERE up.user_type = 'privato'
  AND pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3. Verifica risultati
SELECT 
  'Utenti privati senza dati' as check_type,
  COUNT(*) as count
FROM user_profiles up
LEFT JOIN private_users pu ON up.id = pu.id
WHERE up.user_type = 'privato'
  AND pu.id IS NULL

UNION ALL

SELECT 
  'Istituti con codice MIUR segnati privati' as check_type,
  COUNT(*) as count
FROM user_profiles up
INNER JOIN school_institutes si ON up.id = si.id
WHERE up.user_type = 'privato'
  AND si.institute_code IS NOT NULL
  AND si.institute_code != '';
