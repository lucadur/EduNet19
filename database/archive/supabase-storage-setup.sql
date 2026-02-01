-- ===================================================================
-- SUPABASE STORAGE SETUP FOR PROFILE IMAGES
-- Esegui questo script nel SQL Editor di Supabase
-- ===================================================================

-- 1. Crea il bucket per le immagini profilo (se non esiste già)
-- Nota: Questo può essere fatto anche dalla UI di Supabase Storage
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('profile-images', 'profile-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- 2. ELIMINA eventuali policy esistenti per evitare conflitti
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read profile images" ON storage.objects;

-- 3. Policy SEMPLICE per permettere agli utenti autenticati di CARICARE immagini
CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images');

-- 4. Policy per permettere agli utenti autenticati di AGGIORNARE immagini
CREATE POLICY "Authenticated users can update profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

-- 5. Policy per permettere agli utenti autenticati di ELIMINARE immagini
CREATE POLICY "Authenticated users can delete profile images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');

-- 6. Policy per permettere a TUTTI di LEGGERE le immagini profilo (pubbliche)
CREATE POLICY "Public can read profile images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- ===================================================================
-- AGGIUNGI COLONNE MANCANTI ALLA TABELLA school_institutes
-- ===================================================================

-- Aggiungi colonna bio se non esiste
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Aggiungi colonna cover_image se non esiste
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- Aggiungi colonna avatar_image se non esiste
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS avatar_image TEXT;

-- Aggiungi colonna email se non esiste
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Aggiungi colonna phone se non esiste
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Aggiungi colonna website se non esiste
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS website TEXT;

-- Aggiungi colonna address se non esiste
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Aggiungi colonna city se non esiste
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS city TEXT;

-- Aggiungi colonna province se non esiste
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS province TEXT;

-- Aggiungi colonna specializations se non esiste
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS specializations TEXT;

-- Aggiungi colonna methodologies se non esiste (array di testo)
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS methodologies TEXT[];

-- Aggiungi colonna interests se non esiste (array di testo)
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS interests TEXT[];

-- Aggiungi colonne social media se non esistono
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS facebook TEXT;

ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS twitter TEXT;

ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS instagram TEXT;

ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS linkedin TEXT;

-- ===================================================================
-- VERIFICA COLONNE
-- ===================================================================
-- Esegui questa query per verificare che tutte le colonne siano state create:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'school_institutes' 
-- ORDER BY column_name;
