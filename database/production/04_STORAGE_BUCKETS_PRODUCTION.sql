-- ===================================================================
-- EDUNET19 - STORAGE BUCKETS (PRODUCTION)
-- Script 4/7: Storage e File Management
-- ===================================================================
-- Esegui DOPO 03_FUNCTIONS_TRIGGERS_PRODUCTION.sql
-- ===================================================================

-- ===================================================================
-- PARTE 1: CREA BUCKETS (Esegui in SQL Editor)
-- ===================================================================

-- Inserisci buckets nella tabella storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('covers', 'covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('post-images', 'post-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('gallery', 'gallery', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ===================================================================
-- PARTE 2: STORAGE POLICIES
-- ===================================================================

-- Policy: Chiunque può vedere file pubblici
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id IN ('avatars', 'covers', 'post-images', 'gallery'));

-- Policy: Utenti autenticati possono caricare nei propri folder
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND
    bucket_id IN ('avatars', 'covers', 'post-images', 'gallery') AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Utenti possono aggiornare i propri file
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
    auth.role() = 'authenticated' AND
    bucket_id IN ('avatars', 'covers', 'post-images', 'gallery') AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Utenti possono eliminare i propri file
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
    auth.role() = 'authenticated' AND
    bucket_id IN ('avatars', 'covers', 'post-images', 'gallery') AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- ===================================================================
-- VERIFICA
-- ===================================================================

-- Verifica che i buckets siano stati creati
SELECT id, name, public, file_size_limit FROM storage.buckets;

-- ===================================================================
-- NOTE
-- ===================================================================
-- 
-- Se l'INSERT dei buckets fallisce, puoi crearli manualmente:
-- 1. Vai su Storage nella Dashboard Supabase
-- 2. Clicca "New bucket"
-- 3. Crea: avatars, covers, post-images, gallery
-- 4. Imposta come Public
-- 5. Configura file size limits
-- 
-- Poi esegui solo le POLICIES sopra
-- ===================================================================
