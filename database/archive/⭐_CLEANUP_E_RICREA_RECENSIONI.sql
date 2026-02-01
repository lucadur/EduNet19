-- ============================================
-- CLEANUP E RICREAZIONE SISTEMA RECENSIONI
-- ============================================
-- Esegui questo se hai già eseguito lo script principale
-- e vuoi ricominciare da zero

-- STEP 1: Rimuovi trigger
DROP TRIGGER IF EXISTS update_rating_cache_insert_update_trigger ON public.institute_reviews;
DROP TRIGGER IF EXISTS update_rating_cache_delete_trigger ON public.institute_reviews;
DROP TRIGGER IF EXISTS update_review_timestamp_trigger ON public.institute_reviews;

-- STEP 2: Rimuovi funzioni
DROP FUNCTION IF EXISTS update_institute_rating_cache();
DROP FUNCTION IF EXISTS update_review_timestamp();
DROP FUNCTION IF EXISTS verify_review(UUID);
DROP FUNCTION IF EXISTS get_institute_reviews(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_institute_rating(UUID);

-- STEP 3: Rimuovi indici
DROP INDEX IF EXISTS idx_reviews_reviewed_institute;
DROP INDEX IF EXISTS idx_reviews_reviewer;
DROP INDEX IF EXISTS idx_reviews_verified;
DROP INDEX IF EXISTS idx_reviews_rating;

-- STEP 4: Rimuovi tabella
DROP TABLE IF EXISTS public.institute_reviews CASCADE;

-- STEP 5: Rimuovi colonne da user_profiles (se esistono)
ALTER TABLE public.user_profiles 
DROP COLUMN IF EXISTS rating_average,
DROP COLUMN IF EXISTS rating_count;

-- ============================================
-- ORA ESEGUI LO SCRIPT PRINCIPALE
-- ⭐_CREA_SISTEMA_VALUTAZIONI.sql
-- ============================================
