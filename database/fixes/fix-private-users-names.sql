-- =====================================================
-- FIX NOMI UTENTI PRIVATI
-- Recupera i nomi dai metadata di auth.users
-- Data: 27 Novembre 2025
-- =====================================================

-- 1. Verifica utenti privati senza nome
SELECT 
    pu.id,
    pu.first_name,
    pu.last_name,
    au.raw_user_meta_data->>'first_name' as meta_first_name,
    au.raw_user_meta_data->>'last_name' as meta_last_name,
    au.email
FROM private_users pu
JOIN auth.users au ON pu.id = au.id
WHERE pu.first_name IS NULL 
   OR pu.first_name = '' 
   OR pu.first_name = 'Utente'
   OR pu.last_name IS NULL 
   OR pu.last_name = '';

-- 2. Aggiorna i nomi dai metadata (se disponibili)
UPDATE private_users pu
SET 
    first_name = COALESCE(
        NULLIF(au.raw_user_meta_data->>'first_name', ''),
        NULLIF(au.raw_user_meta_data->>'name', ''),
        pu.first_name,
        'Utente'
    ),
    last_name = COALESCE(
        NULLIF(au.raw_user_meta_data->>'last_name', ''),
        NULLIF(au.raw_user_meta_data->>'surname', ''),
        pu.last_name,
        ''
    ),
    updated_at = NOW()
FROM auth.users au
WHERE pu.id = au.id
AND (
    pu.first_name IS NULL 
    OR pu.first_name = '' 
    OR pu.first_name = 'Utente'
);

-- 3. Per utenti senza metadata, estrai nome dall'email (prima parte)
UPDATE private_users pu
SET 
    first_name = INITCAP(SPLIT_PART(SPLIT_PART(au.email, '@', 1), '.', 1)),
    updated_at = NOW()
FROM auth.users au
WHERE pu.id = au.id
AND (pu.first_name IS NULL OR pu.first_name = '' OR pu.first_name = 'Utente')
AND au.raw_user_meta_data->>'first_name' IS NULL;

-- 4. Verifica risultato
SELECT 
    pu.id,
    pu.first_name,
    pu.last_name,
    au.email
FROM private_users pu
JOIN auth.users au ON pu.id = au.id
ORDER BY pu.created_at DESC
LIMIT 20;

-- 5. Crea utenti privati mancanti (utenti in user_profiles con tipo 'privato' ma senza record in private_users)
INSERT INTO private_users (id, first_name, last_name, privacy_level, created_at, updated_at)
SELECT 
    up.id,
    COALESCE(
        NULLIF(au.raw_user_meta_data->>'first_name', ''),
        NULLIF(au.raw_user_meta_data->>'name', ''),
        INITCAP(SPLIT_PART(SPLIT_PART(au.email, '@', 1), '.', 1)),
        'Utente'
    ) as first_name,
    COALESCE(
        NULLIF(au.raw_user_meta_data->>'last_name', ''),
        NULLIF(au.raw_user_meta_data->>'surname', ''),
        ''
    ) as last_name,
    'pubblico' as privacy_level,
    NOW() as created_at,
    NOW() as updated_at
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
LEFT JOIN private_users pu ON up.id = pu.id
WHERE up.user_type = 'privato'
AND pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 6. Verifica finale
SELECT 
    'Utenti privati totali' as metric,
    COUNT(*) as count
FROM private_users
UNION ALL
SELECT 
    'Utenti con nome valido' as metric,
    COUNT(*) as count
FROM private_users
WHERE first_name IS NOT NULL 
AND first_name != '' 
AND first_name != 'Utente';
