-- ===================================================================
-- 🔧 SEPARA AVATAR E COVER IMAGE
-- Assicura che logo_url contenga l'avatar e cover_image la copertina
-- ===================================================================

-- 1️⃣ Verifica situazione attuale
SELECT 
  'SITUAZIONE ATTUALE' as step,
  id,
  institute_name,
  logo_url,
  cover_image,
  CASE 
    WHEN logo_url IS NULL THEN '❌ Avatar mancante'
    WHEN logo_url LIKE '%Glutatione%' OR logo_url LIKE '%cover%' THEN '⚠️ Avatar è una cover!'
    ELSE '✅ Avatar OK'
  END as logo_status,
  CASE 
    WHEN cover_image IS NULL THEN '❌ Cover mancante'
    WHEN cover_image LIKE '%avatar%' THEN '⚠️ Cover è un avatar!'
    ELSE '✅ Cover OK'
  END as cover_status
FROM school_institutes
WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8';

-- 2️⃣ Verifica file nello storage
SELECT 
  'FILE NELLO STORAGE' as step,
  name,
  bucket_id,
  created_at,
  CASE 
    WHEN name LIKE '%avatar%' THEN '👤 Avatar'
    WHEN name LIKE '%cover%' THEN '🖼️ Cover'
    ELSE '❓ Sconosciuto'
  END as tipo_file,
  CONCAT(
    'https://wpimtdpvrgpgmowdsuec.supabase.co/storage/v1/object/public/',
    bucket_id,
    '/',
    name
  ) as url_completo
FROM storage.objects
WHERE name LIKE '%813ebb9e-93f0-4f40-90ae-6204e3935fe8%'
ORDER BY created_at DESC
LIMIT 10;

-- ===================================================================
-- 🔧 FIX: Se logo_url contiene la cover, scambia i valori
-- ===================================================================

-- 3️⃣ OPZIONE A: Se logo_url e cover_image sono scambiati
-- (Esegui SOLO se logo_url contiene "Glutatione" o sembra una cover)

-- Backup temporaneo
-- DO $$
-- DECLARE
--   temp_logo TEXT;
--   temp_cover TEXT;
-- BEGIN
--   SELECT logo_url, cover_image INTO temp_logo, temp_cover
--   FROM school_institutes
--   WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8';
--   
--   -- Scambia i valori
--   UPDATE school_institutes
--   SET logo_url = temp_cover,
--       cover_image = temp_logo
--   WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8';
-- END $$;

-- 4️⃣ OPZIONE B: Imposta logo_url dal file avatar nello storage
UPDATE school_institutes
SET logo_url = (
  SELECT CONCAT(
    'https://wpimtdpvrgpgmowdsuec.supabase.co/storage/v1/object/public/',
    bucket_id,
    '/',
    name
  )
  FROM storage.objects
  WHERE name LIKE '%813ebb9e-93f0-4f40-90ae-6204e3935fe8%'
    AND name LIKE '%avatar%'
    AND bucket_id = 'avatars'
  ORDER BY created_at DESC
  LIMIT 1
)
WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8';

-- 5️⃣ OPZIONE C: Rimuovi cover_image da logo_url se presente
UPDATE school_institutes
SET logo_url = NULL
WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8'
  AND (logo_url LIKE '%Glutatione%' OR logo_url LIKE '%cover%');

-- 6️⃣ Verifica risultato
SELECT 
  'DOPO FIX' as step,
  id,
  institute_name,
  logo_url,
  cover_image,
  CASE 
    WHEN logo_url IS NULL THEN '❌ Avatar mancante - Ricarica avatar'
    WHEN logo_url LIKE '%Glutatione%' THEN '⚠️ Ancora cover in logo_url'
    ELSE '✅ Avatar corretto!'
  END as status
FROM school_institutes
WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8';

-- ===================================================================
-- 📋 ISTRUZIONI
-- ===================================================================
--
-- 1. Esegui query 1 e 2 per vedere la situazione
-- 2. Se logo_url contiene "Glutatione" o una cover:
--    - Esegui OPZIONE C per rimuoverla
--    - Poi vai su "Modifica Profilo" e ricarica l'avatar
-- 3. Se hai un file avatar nello storage:
--    - Esegui OPZIONE B per linkarlo
-- 4. Ricarica la pagina (Ctrl+Shift+R)
--
-- ===================================================================
