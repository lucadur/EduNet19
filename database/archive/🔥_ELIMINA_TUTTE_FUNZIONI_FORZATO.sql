-- ============================================
-- STEP 1: TROVA TUTTE LE VERSIONI DELLE FUNZIONI
-- ============================================

-- Esegui questa query per vedere tutte le versioni esistenti
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    'DROP FUNCTION ' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ') CASCADE;' as drop_command
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('get_institute_reviews', 'get_institute_rating')
ORDER BY p.proname, p.oid;

-- ============================================
-- STEP 2: ELIMINA TUTTE LE VERSIONI CON CASCADE
-- ============================================

-- Elimina TUTTE le funzioni con questo nome, qualunque sia la firma
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
-- STEP 3: RICREA LE FUNZIONI CORRETTE
-- ============================================

-- Funzione per ottenere le recensioni di un istituto
CREATE FUNCTION get_institute_reviews(p_institute_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    institute_id UUID,
    rating INTEGER,
    review_text TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_name TEXT,
    user_avatar TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ir.id,
        ir.user_id,
        ir.institute_id,
        ir.rating,
        ir.review_text,
        ir.status,
        ir.created_at,
        ir.updated_at,
        COALESCE(up.full_name, up.username, 'Utente') as user_name,
        up.avatar_url as user_avatar
    FROM institute_reviews ir
    LEFT JOIN user_profiles up ON ir.user_id = up.id
    WHERE ir.institute_id = p_institute_id
      AND ir.status = 'approved'
    ORDER BY ir.created_at DESC;
END;
$$;

-- Funzione per ottenere il rating medio di un istituto
CREATE FUNCTION get_institute_rating(p_institute_id UUID)
RETURNS TABLE (
    average_rating NUMERIC,
    total_reviews BIGINT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(AVG(rating), 0)::NUMERIC(3,2) as average_rating,
        COUNT(*)::BIGINT as total_reviews
    FROM institute_reviews
    WHERE institute_id = p_institute_id
      AND status = 'approved';
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_institute_reviews(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_institute_reviews(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_institute_rating(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_institute_rating(UUID) TO anon;

-- ============================================
-- STEP 4: VERIFICA CHE ESISTA UNA SOLA VERSIONE
-- ============================================

SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    'OK - Una sola versione' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('get_institute_reviews', 'get_institute_rating')
ORDER BY p.proname;
