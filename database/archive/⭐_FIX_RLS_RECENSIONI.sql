-- ============================================
-- FIX RLS POLICIES RECENSIONI
-- ============================================
-- Corregge le policies per usare i valori corretti del database

-- STEP 1: Rimuovi policies esistenti
DROP POLICY IF EXISTS "Istituti possono recensire" ON public.institute_reviews;
DROP POLICY IF EXISTS "Privati possono valutare" ON public.institute_reviews;

-- STEP 2: Ricrea policy per ISTITUTI con valori corretti
CREATE POLICY "Istituti possono recensire"
    ON public.institute_reviews
    FOR INSERT
    WITH CHECK (
        auth.uid() = reviewer_id
        AND reviewer_type = 'institute'
        AND EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND user_type = 'istituto'  -- ✅ Valore corretto nel database
        )
        AND review_text IS NOT NULL
        AND LENGTH(TRIM(review_text)) >= 10
    );

-- STEP 3: Ricrea policy per PRIVATI con valori corretti
CREATE POLICY "Privati possono valutare"
    ON public.institute_reviews
    FOR INSERT
    WITH CHECK (
        auth.uid() = reviewer_id
        AND reviewer_type = 'private'
        AND EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND user_type = 'privato'  -- ✅ Valore corretto nel database
        )
    );

-- STEP 4: Verifica policies
SELECT 
    policyname,
    cmd,
    SUBSTRING(qual, 1, 100) as condition
FROM pg_policies
WHERE tablename = 'institute_reviews'
AND cmd = 'INSERT'
ORDER BY policyname;
