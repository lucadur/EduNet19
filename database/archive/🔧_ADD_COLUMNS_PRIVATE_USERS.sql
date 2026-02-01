-- ===================================================================
-- AGGIUNGI COLONNE MANCANTI A PRIVATE_USERS
-- ===================================================================

-- 1️⃣ VERIFICA COLONNE ATTUALI
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'private_users'
ORDER BY ordinal_position;

-- 2️⃣ AGGIUNGI COLONNA AVATAR_URL (se non esiste)
ALTER TABLE private_users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3️⃣ AGGIUNGI COLONNA COVER_IMAGE_URL (se non esiste)
ALTER TABLE private_users 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- 4️⃣ VERIFICA CHE LE COLONNE SIANO STATE AGGIUNTE
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'private_users'
AND column_name IN ('avatar_url', 'cover_image_url');

-- 5️⃣ ORA CREA IL RECORD (se non esiste già)
INSERT INTO private_users (
  id,
  first_name,
  last_name,
  created_at,
  updated_at
)
VALUES (
  '6713ef77-ea20-44ce-b58b-80951af7740a',
  'Nome',      -- ⚠️ CAMBIA
  'Cognome',   -- ⚠️ CAMBIA
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 6️⃣ VERIFICA RECORD
SELECT * FROM private_users 
WHERE id = '6713ef77-ea20-44ce-b58b-80951af7740a';

-- 7️⃣ POLICY UPDATE (se non esiste)
DROP POLICY IF EXISTS "Users can update own profile" ON private_users;
CREATE POLICY "Users can update own profile"
ON private_users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 8️⃣ POLICY SELECT (se non esiste)
DROP POLICY IF EXISTS "Users can view own profile" ON private_users;
CREATE POLICY "Users can view own profile"
ON private_users FOR SELECT
USING (auth.uid() = id);

-- 9️⃣ ABILITA RLS
ALTER TABLE private_users ENABLE ROW LEVEL SECURITY;

-- 🔟 VERIFICA FINALE
SELECT 
  'avatar_url column' as check_name,
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.columns
WHERE table_name = 'private_users' AND column_name = 'avatar_url'
UNION ALL
SELECT 
  'cover_image_url column',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM information_schema.columns
WHERE table_name = 'private_users' AND column_name = 'cover_image_url'
UNION ALL
SELECT 
  'Record exists',
  CASE WHEN COUNT(*) > 0 THEN '✅ EXISTS' ELSE '❌ MISSING' END
FROM private_users
WHERE id = '6713ef77-ea20-44ce-b58b-80951af7740a';
