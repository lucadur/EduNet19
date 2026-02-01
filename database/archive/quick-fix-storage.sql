-- ===================================================================
-- QUICK FIX - Storage Policies per Profile Images
-- Esegui questo script per risolvere velocemente il problema RLS
-- ===================================================================

-- IMPORTANTE: Assicurati che il bucket 'profile-images' esista e sia pubblico
-- Se non esiste, crealo dalla UI: Storage → New Bucket → Nome: profile-images, Public: YES

-- 1. Rimuovi tutte le policy esistenti per evitare conflitti
DO $$ 
BEGIN
    -- Elimina policy se esistono
    DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can update profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can delete profile images" ON storage.objects;
    DROP POLICY IF EXISTS "Public can read profile images" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- 2. Crea policy SEMPLICE per upload (INSERT)
CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images');

-- 3. Crea policy per lettura pubblica (SELECT)
CREATE POLICY "Public can read profile images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- 4. Crea policy per update
CREATE POLICY "Authenticated users can update profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

-- 5. Crea policy per delete
CREATE POLICY "Authenticated users can delete profile images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');

-- ===================================================================
-- VERIFICA
-- ===================================================================

-- Verifica che le policy siano state create:
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

-- Dovresti vedere 4 policy per il bucket profile-images
