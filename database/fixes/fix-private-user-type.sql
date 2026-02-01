-- ===================================================================
-- FIX: Corregge il user_type per utenti privati erroneamente marcati come istituti
-- ===================================================================

-- Trova utenti che sono in private_users ma hanno user_type = 'istituto' in user_profiles
-- e NON hanno dati validi in school_institutes

-- 1. Prima verifica quali utenti hanno il problema
SELECT 
    up.id,
    up.user_type as current_type,
    pu.first_name,
    pu.last_name,
    si.institute_name
FROM user_profiles up
LEFT JOIN private_users pu ON up.id = pu.id
LEFT JOIN school_institutes si ON up.id = si.id
WHERE up.user_type = 'istituto'
  AND pu.id IS NOT NULL  -- Esiste in private_users
  AND (si.id IS NULL OR si.institute_name IS NULL);  -- Non esiste o è incompleto in school_institutes

-- 2. Correggi il user_type per questi utenti
UPDATE user_profiles
SET user_type = 'privato'
WHERE id IN (
    SELECT up.id
    FROM user_profiles up
    LEFT JOIN private_users pu ON up.id = pu.id
    LEFT JOIN school_institutes si ON up.id = si.id
    WHERE up.user_type = 'istituto'
      AND pu.id IS NOT NULL
      AND (si.id IS NULL OR si.institute_name IS NULL)
);

-- 3. Verifica anche utenti che NON sono in nessuna tabella specifica
-- ma hanno metadata che indicano che sono privati
-- (Questo richiede accesso a auth.users che potrebbe non essere disponibile via SQL diretto)

-- 4. Rimuovi eventuali record zombie in school_institutes per utenti privati
DELETE FROM school_institutes
WHERE id IN (
    SELECT si.id
    FROM school_institutes si
    INNER JOIN private_users pu ON si.id = pu.id
    WHERE si.institute_name IS NULL
);

-- 5. Verifica finale
SELECT 
    up.id,
    up.user_type,
    CASE 
        WHEN pu.id IS NOT NULL THEN 'private_users: ' || pu.first_name || ' ' || pu.last_name
        ELSE 'NO private_users data'
    END as private_data,
    CASE 
        WHEN si.id IS NOT NULL THEN 'school_institutes: ' || COALESCE(si.institute_name, 'NO NAME')
        ELSE 'NO school_institutes data'
    END as institute_data
FROM user_profiles up
LEFT JOIN private_users pu ON up.id = pu.id
LEFT JOIN school_institutes si ON up.id = si.id
ORDER BY up.created_at DESC
LIMIT 20;
