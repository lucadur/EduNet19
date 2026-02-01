-- Fix RLS policies per bucket profile-images (cover images)
-- Problema: "new row violates row-level security policy"

-- 1. Verifica che il bucket esista
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'profile-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('profile-images', 'profile-images', true);
    RAISE NOTICE 'Bucket profile-images creato';
  ELSE
    RAISE NOTICE 'Bucket profile-images già esistente';
  END IF;
END $$;

-- 2. Elimina policy esistenti per evitare conflitti
DROP POLICY IF EXISTS "Users can upload their own cover images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own cover images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own cover images" ON storage.objects;
DROP POLICY IF EXISTS "Cover images are publicly accessible" ON storage.objects;

-- 3. Policy per INSERT (upload)
CREATE POLICY "Users can upload their own cover images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy per UPDATE
CREATE POLICY "Users can update their own cover images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy per DELETE
CREATE POLICY "Users can delete their own cover images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Policy per SELECT (lettura pubblica)
CREATE POLICY "Cover images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- Verifica policy create
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%cover%'
ORDER BY policyname;
