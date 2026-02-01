-- Script per aggiornare il sistema di recensioni con stato di approvazione e tipo recensore

-- 1. Aggiunge colonne per lo stato e il tipo di recensore se non esistono
ALTER TABLE institute_reviews 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS reviewer_type text;

-- 2. Aggiorna le policy RLS (Row Level Security) per gestire le recensioni

-- Abilita RLS se non è già abilitato
ALTER TABLE institute_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Chiunque può leggere le recensioni approvate
DROP POLICY IF EXISTS "Public can view approved reviews" ON institute_reviews;
CREATE POLICY "Public can view approved reviews" ON institute_reviews
    FOR SELECT
    USING (status = 'approved');

-- Policy: L'istituto proprietario può vedere tutte le recensioni (anche pending/rejected)
DROP POLICY IF EXISTS "Institute owner can view all own reviews" ON institute_reviews;
CREATE POLICY "Institute owner can view all own reviews" ON institute_reviews
    FOR SELECT
    USING (auth.uid() = reviewed_institute_id);

-- Policy: L'autore della recensione può vedere le proprie recensioni
DROP POLICY IF EXISTS "Reviewer can view own reviews" ON institute_reviews;
CREATE POLICY "Reviewer can view own reviews" ON institute_reviews
    FOR SELECT
    USING (auth.uid() = reviewer_id);

-- Policy: Utenti autenticati possono inserire recensioni
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON institute_reviews;
CREATE POLICY "Authenticated users can insert reviews" ON institute_reviews
    FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id);

-- Policy: L'istituto proprietario può aggiornare lo stato (approvare/rifiutare)
DROP POLICY IF EXISTS "Institute owner can update review status" ON institute_reviews;
CREATE POLICY "Institute owner can update review status" ON institute_reviews
    FOR UPDATE
    USING (auth.uid() = reviewed_institute_id);

-- 3. Indici per performance
CREATE INDEX IF NOT EXISTS idx_reviews_status ON institute_reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_institute_status ON institute_reviews(reviewed_institute_id, status);

