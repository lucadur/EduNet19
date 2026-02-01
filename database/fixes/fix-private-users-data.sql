-- =====================================================
-- FIX DATI UTENTI PRIVATI
-- =====================================================
-- Questo script corregge i dati degli utenti privati che:
-- 1. Non hanno first_name/last_name in private_users
-- 2. Hanno metadata inconsistenti
-- =====================================================

-- 1. Inserisci record in private_users per utenti che non ce l'hanno
-- Usa i metadata se disponibili, altrimenti estrai dall'email
INSERT INTO public.private_users (id, first_name, last_name, privacy_level)
SELECT 
  up.id,
  COALESCE(
    au.raw_user_meta_data->>'first_name',
    INITCAP(SPLIT_PART(au.email, '@', 1))
  ) as first_name,
  COALESCE(
    au.raw_user_meta_data->>'last_name',
    ''
  ) as last_name,
  'pubblico' as privacy_level
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.id
LEFT JOIN public.private_users pu ON pu.id = up.id
WHERE up.user_type = 'privato'
  AND pu.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  first_name = COALESCE(EXCLUDED.first_name, public.private_users.first_name),
  last_name = COALESCE(EXCLUDED.last_name, public.private_users.last_name);

-- 2. Aggiorna first_name/last_name per utenti che ce l'hanno NULL
UPDATE public.private_users pu
SET 
  first_name = COALESCE(
    au.raw_user_meta_data->>'first_name',
    INITCAP(SPLIT_PART(au.email, '@', 1))
  ),
  last_name = COALESCE(
    au.raw_user_meta_data->>'last_name',
    ''
  )
FROM auth.users au
WHERE pu.id = au.id
  AND (pu.first_name IS NULL OR pu.first_name = '');

-- 3. Correggi utenti che hanno user_type='privato' ma sono in school_institutes
-- (questi sono account confusi - rimuovi da school_institutes se non hanno dati validi)
DELETE FROM public.school_institutes si
WHERE si.id IN (
  SELECT up.id 
  FROM public.user_profiles up
  WHERE up.user_type = 'privato'
)
AND (
  si.institute_code IS NULL 
  AND si.institute_name NOT ILIKE '%liceo%'
  AND si.institute_name NOT ILIKE '%istituto%'
  AND si.institute_name NOT ILIKE '%scuola%'
  AND si.institute_name NOT ILIKE '%comprensivo%'
);

-- 4. Verifica risultati
SELECT 
  up.id,
  up.user_type,
  pu.first_name,
  pu.last_name,
  au.email
FROM public.user_profiles up
LEFT JOIN public.private_users pu ON pu.id = up.id
JOIN auth.users au ON au.id = up.id
WHERE up.user_type = 'privato';
