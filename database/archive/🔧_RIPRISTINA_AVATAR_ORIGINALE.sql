-- ===================================================================
-- 🔧 RIPRISTINA AVATAR ORIGINALE
-- Rimuove placeholder e ripristina avatar reale
-- ===================================================================

-- 1️⃣ PRIMA: Verifica situazione attuale
SELECT 
  'SITUAZIONE ATTUALE' as step,
  id,
  institute_name,
  logo_url,
  cover_image,
  CASE 
    WHEN logo_url LIKE '%ui-avatars.com%' THEN '⚠️ Placeholder iniziali'
    WHEN logo_url IS NULL THEN '❌ NULL'
    WHEN logo_url LIKE '%supabase%' THEN '✅ Avatar reale Supabase'
    ELSE '✅ Avatar presente'
  END as logo_status,
  CASE 
    WHEN cover_image IS NULL THEN '❌ NULL'
    WHEN cover_image LIKE '%supabase%' THEN '✅ Cover Supabase'
    ELSE '✅ Cover presente'
  END as cover_status
FROM school_institutes
WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8';

-- 2️⃣ Verifica file nello storage
SELECT 
  'FILE NELLO STORAGE' as step,
  name,
  bucket_id,
  created_at,
  CONCAT(
    'https://wpimtdpvrgpgmowdsuec.supabase.co/storage/v1/object/public/',
    bucket_id,
    '/',
    name
  ) as url_completo
FROM storage.objects
WHERE name LIKE '%813ebb9e-93f0-4f40-90ae-6204e3935fe8%'
ORDER BY created_at DESC
LIMIT 5;

-- ===================================================================
-- 🔧 FIX AUTOMATICO
-- ===================================================================

-- 3️⃣ OPZIONE A: Se avatar è in cover_image, copialo in logo_url
UPDATE school_institutes
SET logo_url = cover_image,
    updated_at = NOW()
WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8'
  AND (logo_url IS NULL OR logo_url LIKE '%ui-avatars.com%')
  AND cover_image IS NOT NULL
  AND cover_image NOT LIKE '%ui-avatars.com%';

-- 4️⃣ OPZIONE B: Se avatar è nello storage, linkalo
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
    AND bucket_id IN ('avatars', 'profile-images')
    AND name LIKE '%avatar%'
  ORDER BY created_at DESC
  LIMIT 1
),
updated_at = NOW()
WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8'
  AND (logo_url IS NULL OR logo_url LIKE '%ui-avatars.com%');

-- 5️⃣ DOPO: Verifica risultato
SELECT 
  'DOPO FIX' as step,
  id,
  institute_name,
  logo_url,
  CASE 
    WHEN logo_url LIKE '%ui-avatars.com%' THEN '⚠️ Ancora placeholder'
    WHEN logo_url IS NULL THEN '❌ Ancora NULL'
    WHEN logo_url LIKE '%supabase%' THEN '✅ Avatar ripristinato!'
    ELSE '✅ Avatar presente'
  END as status,
  updated_at
FROM school_institutes
WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8';

-- ===================================================================
-- 📋 RISULTATI POSSIBILI
-- ===================================================================
--
-- ✅ Avatar ripristinato!
-- → Ricarica la pagina (Ctrl+Shift+R)
-- → L'avatar originale dovrebbe apparire ovunque
--
-- ⚠️ Ancora placeholder o NULL
-- → Nessun avatar trovato in cover_image o storage
-- → Vai su "Modifica Profilo" e ricarica l'avatar
--
-- ===================================================================

-- 6️⃣ OPZIONALE: Rimuovi SOLO placeholder senza sostituire
-- (Usa questo se vuoi ricaricare l'avatar manualmente)
-- UPDATE school_institutes
-- SET logo_url = NULL
-- WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8'
--   AND logo_url LIKE '%ui-avatars.com%';
