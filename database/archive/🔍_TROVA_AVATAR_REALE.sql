-- ===================================================================
-- 🔍 TROVA AVATAR REALE - Dove è salvato veramente?
-- ===================================================================

-- 1️⃣ Verifica TUTTE le colonne che potrebbero contenere l'avatar
SELECT 
  id,
  institute_name,
  logo_url,
  cover_image,
  -- Verifica se ci sono altre colonne con URL
  created_at,
  updated_at
FROM school_institutes
WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8';

-- 2️⃣ Verifica se l'avatar è in una colonna non standard
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'school_institutes'
  AND (
    column_name LIKE '%avatar%' OR
    column_name LIKE '%logo%' OR
    column_name LIKE '%image%' OR
    column_name LIKE '%photo%' OR
    column_name LIKE '%picture%'
  )
ORDER BY ordinal_position;

-- 3️⃣ Verifica file nello storage
SELECT 
  name,
  bucket_id,
  created_at,
  metadata,
  CONCAT(
    'https://wpimtdpvrgpgmowdsuec.supabase.co/storage/v1/object/public/',
    bucket_id,
    '/',
    name
  ) as full_url
FROM storage.objects
WHERE name LIKE '%813ebb9e-93f0-4f40-90ae-6204e3935fe8%'
ORDER BY created_at DESC;

-- ===================================================================
-- 📋 INTERPRETAZIONE
-- ===================================================================
--
-- CASO 1: logo_url ha valore
-- → L'avatar è dove dovrebbe essere
-- → Problema: avatar-manager.js non lo trova (cache? permessi?)
--
-- CASO 2: cover_image ha valore ma logo_url è NULL
-- → L'avatar è stato salvato nella colonna sbagliata!
-- → Soluzione: Copia cover_image → logo_url
--
-- CASO 3: Nessuna colonna ha valore MA storage ha file
-- → Il file esiste ma non è linkato nel database
-- → Soluzione: Aggiorna logo_url con l'URL del file
--
-- CASO 4: Tutto NULL ma avatar appare in edit-profile
-- → L'avatar viene caricato da localStorage o cache browser
-- → Soluzione: Ricarica l'avatar
--
-- ===================================================================

-- 4️⃣ FIX: Se l'avatar è in cover_image, copialo in logo_url
-- UPDATE school_institutes
-- SET logo_url = cover_image
-- WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8'
--   AND logo_url IS NULL
--   AND cover_image IS NOT NULL;

-- 5️⃣ FIX: Se l'avatar è nello storage, linkalo in logo_url
-- UPDATE school_institutes
-- SET logo_url = (
--   SELECT CONCAT(
--     'https://wpimtdpvrgpgmowdsuec.supabase.co/storage/v1/object/public/',
--     bucket_id,
--     '/',
--     name
--   )
--   FROM storage.objects
--   WHERE name LIKE '%813ebb9e-93f0-4f40-90ae-6204e3935fe8%'
--     AND bucket_id = 'avatars'
--   ORDER BY created_at DESC
--   LIMIT 1
-- )
-- WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8'
--   AND logo_url IS NULL;

-- 6️⃣ RIMUOVI placeholder iniziali (se presente)
-- UPDATE school_institutes
-- SET logo_url = NULL
-- WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8'
--   AND logo_url LIKE '%ui-avatars.com%';
