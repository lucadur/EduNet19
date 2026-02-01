-- ===================================================================
-- VERIFICA E CREA RECORD PRIVATE_USERS
-- ===================================================================

-- 1️⃣ Verifica se il record esiste
SELECT 
  id,
  first_name,
  last_name,
  email,
  avatar_url,
  cover_image_url,
  created_at,
  updated_at
FROM private_users
WHERE id = '6713ef77-ea20-44ce-b58b-80951af7740a';

-- Se il risultato è vuoto, esegui questo:
-- 2️⃣ Crea il record se non esiste
INSERT INTO private_users (
  id,
  first_name,
  last_name,
  email,
  created_at,
  updated_at
)
VALUES (
  '6713ef77-ea20-44ce-b58b-80951af7740a',
  'Nome',  -- Cambia con il nome reale
  'Cognome',  -- Cambia con il cognome reale
  'email@example.com',  -- Cambia con l'email reale
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 3️⃣ Verifica colonne esistono
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'private_users'
ORDER BY ordinal_position;

-- 4️⃣ Verifica policy RLS per UPDATE
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'private_users'
AND cmd = 'UPDATE';

-- Se la policy non esiste, creala:
-- 5️⃣ Crea policy UPDATE se mancante
CREATE POLICY IF NOT EXISTS "Users can update own profile"
ON private_users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6️⃣ Verifica policy SELECT (necessaria per .select() dopo update)
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'private_users'
AND cmd = 'SELECT';

-- Se mancante, crea:
CREATE POLICY IF NOT EXISTS "Users can view own profile"
ON private_users
FOR SELECT
USING (auth.uid() = id);

-- 7️⃣ Abilita RLS se non attivo
ALTER TABLE private_users ENABLE ROW LEVEL SECURITY;

-- 8️⃣ Verifica finale
SELECT 
  'Record exists' as check_type,
  COUNT(*) as count
FROM private_users
WHERE id = '6713ef77-ea20-44ce-b58b-80951af7740a'
UNION ALL
SELECT 
  'UPDATE policy exists',
  COUNT(*)
FROM pg_policies
WHERE tablename = 'private_users' AND cmd = 'UPDATE'
UNION ALL
SELECT 
  'SELECT policy exists',
  COUNT(*)
FROM pg_policies
WHERE tablename = 'private_users' AND cmd = 'SELECT';
