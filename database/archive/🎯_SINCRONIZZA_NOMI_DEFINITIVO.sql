-- ===================================================================
-- SINCRONIZZAZIONE NOMI DEFINITIVA
-- Aggiorna tutti i nomi da auth.users metadata
-- ===================================================================

-- STEP 1: Sincronizza nomi istituti esistenti dai metadata
-- =========================================================
UPDATE school_institutes si
SET institute_name = COALESCE(
  u.raw_user_meta_data->>'institute_name',
  si.institute_name
)
FROM auth.users u
WHERE si.id = u.id
AND u.raw_user_meta_data->>'institute_name' IS NOT NULL
AND u.raw_user_meta_data->>'institute_name' != '';

-- STEP 2: Sincronizza nomi utenti privati esistenti dai metadata
-- ===============================================================
UPDATE private_users pu
SET 
  first_name = COALESCE(u.raw_user_meta_data->>'first_name', pu.first_name, ''),
  last_name = COALESCE(u.raw_user_meta_data->>'last_name', pu.last_name, '')
FROM auth.users u
WHERE pu.id = u.id;

-- STEP 3: Aggiorna trigger per nuovi account (già fatto in FIX_ASSOLUTO_FINALE)
-- ==============================================================================
-- Il trigger è già aggiornato per leggere i nomi dai metadata

-- STEP 4: Verifica risultati
-- ===========================
SELECT 
  'Istituti aggiornati' as tipo,
  COUNT(*) as totale,
  COUNT(CASE WHEN institute_name NOT IN ('Istituto', 'Nuovo Istituto', 'altro') THEN 1 END) as con_nome_valido
FROM school_institutes
UNION ALL
SELECT 
  'Utenti privati aggiornati' as tipo,
  COUNT(*) as totale,
  COUNT(CASE WHEN first_name != '' OR last_name != '' THEN 1 END) as con_nome_valido
FROM private_users;

-- STEP 5: Mostra utenti con i loro nomi
-- ======================================
SELECT 
  u.email,
  up.user_type,
  CASE 
    WHEN up.user_type = 'istituto' THEN si.institute_name
    WHEN up.user_type = 'privato' THEN pu.first_name || ' ' || pu.last_name
  END as display_name
FROM auth.users u
JOIN user_profiles up ON u.id = up.id
LEFT JOIN school_institutes si ON u.id = si.id AND up.user_type = 'istituto'
LEFT JOIN private_users pu ON u.id = pu.id AND up.user_type = 'privato'
ORDER BY u.created_at DESC;

SELECT '✅ NOMI SINCRONIZZATI PER TUTTI GLI UTENTI!' as status,
       'Ora tutti i nomi sono corretti' as message;
