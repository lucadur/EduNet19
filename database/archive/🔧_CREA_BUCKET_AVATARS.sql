-- ===================================================================
-- 🔧 CREA BUCKET AVATARS E POLICY
-- Esegui questo DOPO aver creato il bucket tramite UI
-- ===================================================================

-- 1️⃣ Verifica che il bucket esista
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'avatars';

-- Se il bucket non esiste, crealo tramite UI Supabase:
-- Storage → New bucket → Nome: "avatars" → Public: YES

-- 2️⃣ Assicurati che sia pubblico
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';

-- 3️⃣ Policy per permettere a tutti di LEGGERE gli avatar
DROP POLICY IF EXISTS "Avatar pubblici leggibili" ON storage.objects;
CREATE POLICY "Avatar pubblici leggibili"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 4️⃣ Policy per permettere agli utenti autenticati di CARICARE i propri avatar
DROP POLICY IF EXISTS "Utenti possono caricare propri avatar" ON storage.objects;
CREATE POLICY "Utenti possono caricare propri avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5️⃣ Policy per permettere agli utenti di AGGIORNARE i propri avatar
DROP POLICY IF EXISTS "Utenti possono aggiornare propri avatar" ON storage.objects;
CREATE POLICY "Utenti possono aggiornare propri avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6️⃣ Policy per permettere agli utenti di ELIMINARE i propri avatar
DROP POLICY IF EXISTS "Utenti possono eliminare propri avatar" ON storage.objects;
CREATE POLICY "Utenti possono eliminare propri avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 7️⃣ Verifica policy create
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%avatar%';

-- ===================================================================
-- ✅ RISULTATO ATTESO
-- ===================================================================
-- Dovresti vedere 4 policy:
-- 1. Avatar pubblici leggibili (SELECT)
-- 2. Utenti possono caricare propri avatar (INSERT)
-- 3. Utenti possono aggiornare propri avatar (UPDATE)
-- 4. Utenti possono eliminare propri avatar (DELETE)
-- ===================================================================
