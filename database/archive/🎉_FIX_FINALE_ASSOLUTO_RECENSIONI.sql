-- ============================================
-- FIX FINALE ASSOLUTO: Funzioni recensioni con TUTTI i nomi corretti
-- ============================================

-- STEP 1: Elimina tutte le versioni esistenti
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT 
            p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname IN ('get_institute_reviews', 'get_institute_rating')
    LOOP
        EXECUTE 'DROP FUNCTION ' || func_record.func_signature || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', func_record.func_signature;
    END LOOP;
END $$;

-- ============================================
-- STEP 2: Crea funzioni con TUTTI i nomi corretti
-- ============================================

-- Funzione per ottenere le recensioni
CREATE FUNCTION get_institute_reviews(
    institute_id_param UUID,
    limit_param INTEGER DEFAULT 10,
    offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
    review_id UUID,
    reviewed_institute_id UUID,
    reviewer_id UUID,
    reviewer_name TEXT,
    reviewer_avatar TEXT,
    reviewer_type TEXT,
    rating INTEGER,
    review_text TEXT,
    is_verified BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    can_edit BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Ottieni l'utente corrente (se loggato)
    current_user_id := auth.uid();
    
    RETURN QUERY
    SELECT 
        ir.id as review_id,
        ir.reviewed_institute_id,
        ir.reviewer_id,
        CASE 
            WHEN ir.reviewer_type = 'institute' THEN COALESCE(si.institute_name, 'Istituto')::TEXT
            WHEN ir.reviewer_type = 'private' THEN COALESCE(pu.first_name || ' ' || pu.last_name, pu.first_name, 'Utente')::TEXT
            ELSE 'Utente'::TEXT
        END as reviewer_name,
        CASE 
            WHEN ir.reviewer_type = 'institute' THEN si.logo_url
            WHEN ir.reviewer_type = 'private' THEN pu.avatar_url
            ELSE NULL
        END as reviewer_avatar,
        ir.reviewer_type,
        ir.rating,
        ir.review_text,
        ir.is_verified,
        ir.created_at,
        ir.updated_at,
        (current_user_id = ir.reviewer_id) as can_edit
    FROM institute_reviews ir
    LEFT JOIN school_institutes si ON ir.reviewer_id = si.id AND ir.reviewer_type = 'institute'
    LEFT JOIN private_users pu ON ir.reviewer_id = pu.id AND ir.reviewer_type = 'private'
    WHERE ir.reviewed_institute_id = institute_id_param
      AND ir.is_verified = true
    ORDER BY ir.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$;

-- Funzione per ottenere il rating medio
CREATE FUNCTION get_institute_rating(institute_id_param UUID)
RETURNS TABLE (
    average_rating NUMERIC,
    total_reviews BIGINT,
    rating_distribution JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(AVG(rating), 0)::NUMERIC(3,2) as average_rating,
        COUNT(*)::BIGINT as total_reviews,
        jsonb_build_object(
            '5_stars', COUNT(*) FILTER (WHERE rating = 5),
            '4_stars', COUNT(*) FILTER (WHERE rating = 4),
            '3_stars', COUNT(*) FILTER (WHERE rating = 3),
            '2_stars', COUNT(*) FILTER (WHERE rating = 2),
            '1_star', COUNT(*) FILTER (WHERE rating = 1)
        ) as rating_distribution
    FROM institute_reviews
    WHERE reviewed_institute_id = institute_id_param
      AND is_verified = true;
END;
$$;

-- ============================================
-- STEP 3: Grant permissions
-- ============================================

GRANT EXECUTE ON FUNCTION get_institute_reviews(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_institute_reviews(UUID, INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_institute_rating(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_institute_rating(UUID) TO anon;

-- ============================================
-- STEP 4: Verifica finale
-- ============================================

SELECT 
    '✅ Sistema recensioni pronto!' as status,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('get_institute_reviews', 'get_institute_rating')
ORDER BY p.proname;
