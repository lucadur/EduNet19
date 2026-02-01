-- ============================================
-- SISTEMA VALUTAZIONI COMPLETO
-- ============================================
-- Due tipologie:
-- 1. Istituti → Istituti: stelle + commento
-- 2. Privati → Istituti: solo stelle (da verificare)

-- STEP 1: Crea tabella valutazioni
CREATE TABLE IF NOT EXISTS public.institute_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewed_institute_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    reviewer_type TEXT NOT NULL CHECK (reviewer_type IN ('institute', 'private')),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraint: un utente può recensire un istituto una sola volta
    UNIQUE(reviewer_id, reviewed_institute_id)
);

-- STEP 2: Indici per performance
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_institute ON public.institute_reviews(reviewed_institute_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON public.institute_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON public.institute_reviews(is_verified) WHERE is_verified = false;
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.institute_reviews(rating);

-- STEP 3: Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_review_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_review_timestamp_trigger ON public.institute_reviews;

CREATE TRIGGER update_review_timestamp_trigger
    BEFORE UPDATE ON public.institute_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_review_timestamp();

-- STEP 4: RLS Policies
ALTER TABLE public.institute_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Tutti possono leggere recensioni verificate
CREATE POLICY "Recensioni verificate pubbliche"
    ON public.institute_reviews
    FOR SELECT
    USING (is_verified = true);

-- Policy: Utenti autenticati vedono anche le proprie recensioni non verificate
CREATE POLICY "Utenti vedono proprie recensioni"
    ON public.institute_reviews
    FOR SELECT
    USING (auth.uid() = reviewer_id);

-- Policy: Istituti possono inserire recensioni con commento
CREATE POLICY "Istituti possono recensire"
    ON public.institute_reviews
    FOR INSERT
    WITH CHECK (
        auth.uid() = reviewer_id
        AND reviewer_type = 'institute'
        AND EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND user_type = 'institute'
        )
        AND review_text IS NOT NULL
        AND LENGTH(TRIM(review_text)) >= 10
    );

-- Policy: Privati possono inserire solo valutazioni (senza commento obbligatorio)
CREATE POLICY "Privati possono valutare"
    ON public.institute_reviews
    FOR INSERT
    WITH CHECK (
        auth.uid() = reviewer_id
        AND reviewer_type = 'private'
        AND EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE id = auth.uid()
            AND user_type = 'private'
        )
    );

-- Policy: Utenti possono aggiornare solo le proprie recensioni
CREATE POLICY "Aggiorna proprie recensioni"
    ON public.institute_reviews
    FOR UPDATE
    USING (auth.uid() = reviewer_id)
    WITH CHECK (auth.uid() = reviewer_id);

-- Policy: Utenti possono eliminare solo le proprie recensioni
CREATE POLICY "Elimina proprie recensioni"
    ON public.institute_reviews
    FOR DELETE
    USING (auth.uid() = reviewer_id);

-- STEP 5: Funzione per calcolare media valutazioni
CREATE OR REPLACE FUNCTION get_institute_rating(institute_id_param UUID)
RETURNS TABLE (
    average_rating NUMERIC,
    total_reviews BIGINT,
    rating_distribution JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(rating)::numeric, 1) as average_rating,
        COUNT(*)::bigint as total_reviews,
        jsonb_build_object(
            '5_stars', COUNT(*) FILTER (WHERE rating = 5),
            '4_stars', COUNT(*) FILTER (WHERE rating = 4),
            '3_stars', COUNT(*) FILTER (WHERE rating = 3),
            '2_stars', COUNT(*) FILTER (WHERE rating = 2),
            '1_star', COUNT(*) FILTER (WHERE rating = 1)
        ) as rating_distribution
    FROM public.institute_reviews
    WHERE reviewed_institute_id = institute_id_param
    AND is_verified = true;
END;
$$;

-- STEP 6: Funzione per verificare recensioni (solo admin)
CREATE OR REPLACE FUNCTION verify_review(review_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    review_record RECORD;
BEGIN
    -- Verifica che l'utente sia admin dell'istituto recensito
    SELECT ir.* INTO review_record
    FROM public.institute_reviews ir
    WHERE ir.id = review_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recensione non trovata';
    END IF;
    
    -- Verifica che l'utente corrente sia admin dell'istituto recensito
    IF NOT EXISTS (
        SELECT 1 FROM public.institute_admins
        WHERE institute_id = review_record.reviewed_institute_id
        AND admin_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;
    
    -- Verifica la recensione
    UPDATE public.institute_reviews
    SET is_verified = true
    WHERE id = review_id_param;
    
    RETURN true;
END;
$$;

-- STEP 7: Funzione per ottenere recensioni con dettagli reviewer
CREATE OR REPLACE FUNCTION get_institute_reviews(
    institute_id_param UUID,
    limit_param INTEGER DEFAULT 10,
    offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
    review_id UUID,
    reviewer_id UUID,
    reviewer_name TEXT,
    reviewer_type TEXT,
    reviewer_avatar TEXT,
    rating INTEGER,
    review_text TEXT,
    is_verified BOOLEAN,
    created_at TIMESTAMPTZ,
    can_edit BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ir.id as review_id,
        ir.reviewer_id,
        CASE 
            WHEN ir.reviewer_type = 'institute' THEN si.institute_name
            ELSE pu.first_name || ' ' || pu.last_name
        END as reviewer_name,
        ir.reviewer_type,
        CASE 
            WHEN ir.reviewer_type = 'institute' THEN si.logo_url
            ELSE pu.avatar_url
        END as reviewer_avatar,
        ir.rating,
        ir.review_text,
        ir.is_verified,
        ir.created_at,
        (ir.reviewer_id = auth.uid()) as can_edit
    FROM public.institute_reviews ir
    LEFT JOIN public.school_institutes si ON si.id = ir.reviewer_id AND ir.reviewer_type = 'institute'
    LEFT JOIN public.private_users pu ON pu.id = ir.reviewer_id AND ir.reviewer_type = 'private'
    WHERE ir.reviewed_institute_id = institute_id_param
    AND ir.is_verified = true
    ORDER BY ir.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$;

-- STEP 8: Aggiungi colonna rating_average a user_profiles (cache)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS rating_average NUMERIC(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- STEP 9: Trigger per aggiornare cache rating su user_profiles
CREATE OR REPLACE FUNCTION update_institute_rating_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    new_average NUMERIC;
    new_count INTEGER;
BEGIN
    -- Calcola nuova media e conteggio
    SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
        COUNT(*)::integer
    INTO new_average, new_count
    FROM public.institute_reviews
    WHERE reviewed_institute_id = COALESCE(NEW.reviewed_institute_id, OLD.reviewed_institute_id)
    AND is_verified = true;
    
    -- Aggiorna cache su user_profiles
    UPDATE public.user_profiles
    SET 
        rating_average = new_average,
        rating_count = new_count
    WHERE id = COALESCE(NEW.reviewed_institute_id, OLD.reviewed_institute_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger separati per INSERT/UPDATE e DELETE
DROP TRIGGER IF EXISTS update_rating_cache_insert_update_trigger ON public.institute_reviews;
DROP TRIGGER IF EXISTS update_rating_cache_delete_trigger ON public.institute_reviews;

CREATE TRIGGER update_rating_cache_insert_update_trigger
    AFTER INSERT OR UPDATE ON public.institute_reviews
    FOR EACH ROW
    WHEN (NEW.is_verified = true)
    EXECUTE FUNCTION update_institute_rating_cache();

CREATE TRIGGER update_rating_cache_delete_trigger
    AFTER DELETE ON public.institute_reviews
    FOR EACH ROW
    WHEN (OLD.is_verified = true)
    EXECUTE FUNCTION update_institute_rating_cache();

-- STEP 10: Grant permissions
GRANT SELECT ON public.institute_reviews TO authenticated;
GRANT INSERT ON public.institute_reviews TO authenticated;
GRANT UPDATE ON public.institute_reviews TO authenticated;
GRANT DELETE ON public.institute_reviews TO authenticated;

GRANT EXECUTE ON FUNCTION get_institute_rating(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_institute_reviews(UUID, INTEGER, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION verify_review(UUID) TO authenticated;

-- STEP 11: Commenti
COMMENT ON TABLE public.institute_reviews IS 
'Recensioni degli istituti. Istituti possono lasciare stelle+commento, privati solo stelle (da verificare).';

COMMENT ON COLUMN public.institute_reviews.is_verified IS 
'Le recensioni dei privati devono essere verificate dagli admin dell''istituto prima di essere pubbliche.';

COMMENT ON FUNCTION verify_review IS 
'Permette agli admin di un istituto di verificare/approvare recensioni in sospeso.';
