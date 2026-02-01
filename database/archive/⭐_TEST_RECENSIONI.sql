-- ============================================
-- TEST SISTEMA RECENSIONI
-- ============================================
-- Esegui questi test per verificare il funzionamento

-- TEST 1: Verifica tabella creata
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'institute_reviews'
ORDER BY ordinal_position;

-- TEST 2: Verifica funzioni create
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name IN (
    'get_institute_rating',
    'get_institute_reviews',
    'verify_review',
    'update_institute_rating_cache'
)
ORDER BY routine_name;

-- TEST 3: Verifica RLS attivo
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'institute_reviews';

-- TEST 4: Verifica policies
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'institute_reviews'
ORDER BY policyname;

-- TEST 5: Inserisci recensione di test (ISTITUTO)
-- SOSTITUISCI GLI UUID CON VALORI REALI
/*
INSERT INTO institute_reviews (
    reviewer_id,
    reviewed_institute_id,
    rating,
    review_text,
    reviewer_type,
    is_verified
) VALUES (
    'UUID_ISTITUTO_REVIEWER',
    'UUID_ISTITUTO_RECENSITO',
    5,
    'Ottima collaborazione! Progetto molto interessante e ben organizzato.',
    'institute',
    true
);
*/

-- TEST 6: Inserisci recensione di test (PRIVATO)
-- SOSTITUISCI GLI UUID CON VALORI REALI
/*
INSERT INTO institute_reviews (
    reviewer_id,
    reviewed_institute_id,
    rating,
    review_text,
    reviewer_type,
    is_verified
) VALUES (
    'UUID_UTENTE_PRIVATO',
    'UUID_ISTITUTO_RECENSITO',
    4,
    NULL,
    'private',
    false
);
*/

-- TEST 7: Verifica calcolo rating
-- SOSTITUISCI UUID_ISTITUTO con un istituto reale
/*
SELECT * FROM get_institute_rating('UUID_ISTITUTO');
*/

-- TEST 8: Verifica recupero recensioni
-- SOSTITUISCI UUID_ISTITUTO con un istituto reale
/*
SELECT * FROM get_institute_reviews('UUID_ISTITUTO', 10, 0);
*/

-- TEST 9: Verifica cache rating su user_profiles
SELECT 
    up.id,
    si.institute_name,
    up.rating_average,
    up.rating_count
FROM user_profiles up
JOIN school_institutes si ON si.id = up.id
WHERE up.rating_count > 0
ORDER BY up.rating_average DESC;

-- TEST 10: Verifica recensioni in attesa
SELECT 
    ir.id,
    ir.rating,
    ir.reviewer_type,
    ir.is_verified,
    ir.created_at,
    CASE 
        WHEN ir.reviewer_type = 'institute' THEN si.institute_name
        ELSE pu.first_name || ' ' || pu.last_name
    END as reviewer_name
FROM institute_reviews ir
LEFT JOIN school_institutes si ON si.id = ir.reviewer_id AND ir.reviewer_type = 'institute'
LEFT JOIN private_users pu ON pu.id = ir.reviewer_id AND ir.reviewer_type = 'private'
WHERE ir.is_verified = false
ORDER BY ir.created_at DESC;

-- TEST 11: Statistiche generali
SELECT 
    COUNT(*) as total_reviews,
    COUNT(*) FILTER (WHERE is_verified = true) as verified_reviews,
    COUNT(*) FILTER (WHERE is_verified = false) as pending_reviews,
    COUNT(*) FILTER (WHERE reviewer_type = 'institute') as institute_reviews,
    COUNT(*) FILTER (WHERE reviewer_type = 'private') as private_reviews,
    ROUND(AVG(rating), 2) as average_rating,
    MIN(rating) as min_rating,
    MAX(rating) as max_rating
FROM institute_reviews;

-- TEST 12: Distribuzione rating
SELECT 
    rating,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM institute_reviews
WHERE is_verified = true
GROUP BY rating
ORDER BY rating DESC;

-- TEST 13: Top 5 istituti per rating
SELECT 
    si.institute_name,
    up.rating_average,
    up.rating_count,
    si.city
FROM user_profiles up
JOIN school_institutes si ON si.id = up.id
WHERE up.rating_count >= 1
ORDER BY up.rating_average DESC, up.rating_count DESC
LIMIT 5;

-- TEST 14: Recensioni recenti
SELECT 
    ir.rating,
    ir.review_text,
    ir.reviewer_type,
    ir.is_verified,
    ir.created_at,
    CASE 
        WHEN ir.reviewer_type = 'institute' THEN si_reviewer.institute_name
        ELSE pu_reviewer.first_name || ' ' || pu_reviewer.last_name
    END as reviewer_name,
    si_reviewed.institute_name as institute_name
FROM institute_reviews ir
LEFT JOIN school_institutes si_reviewer ON si_reviewer.id = ir.reviewer_id AND ir.reviewer_type = 'institute'
LEFT JOIN private_users pu_reviewer ON pu_reviewer.id = ir.reviewer_id AND ir.reviewer_type = 'private'
JOIN school_institutes si_reviewed ON si_reviewed.id = ir.reviewed_institute_id
ORDER BY ir.created_at DESC
LIMIT 10;

-- TEST 15: Verifica trigger funzionante
-- Dopo aver inserito una recensione, verifica che rating_average sia aggiornato
SELECT 
    si.institute_name,
    up.rating_average,
    up.rating_count,
    (
        SELECT ROUND(AVG(rating)::numeric, 1)
        FROM institute_reviews
        WHERE reviewed_institute_id = up.id
        AND is_verified = true
    ) as calculated_average
FROM user_profiles up
JOIN school_institutes si ON si.id = up.id
WHERE up.rating_count > 0
LIMIT 5;

-- ============================================
-- CLEANUP (Esegui solo se vuoi rimuovere dati di test)
-- ============================================

-- Rimuovi recensioni di test
/*
DELETE FROM institute_reviews
WHERE review_text LIKE '%test%' OR review_text LIKE '%prova%';
*/

-- Reset cache rating
/*
UPDATE user_profiles
SET rating_average = 0, rating_count = 0
WHERE user_type = 'institute';
*/

-- ============================================
-- QUERY UTILI PER ADMIN
-- ============================================

-- Trova istituti senza recensioni
SELECT 
    up.id,
    si.institute_name,
    si.city,
    up.rating_count
FROM user_profiles up
JOIN school_institutes si ON si.id = up.id
WHERE up.rating_count = 0
ORDER BY si.institute_name;

-- Trova utenti che hanno recensito di più
SELECT 
    ir.reviewer_id,
    CASE 
        WHEN ir.reviewer_type = 'institute' THEN si.institute_name
        ELSE pu.first_name || ' ' || pu.last_name
    END as reviewer_name,
    ir.reviewer_type,
    COUNT(*) as reviews_given,
    ROUND(AVG(ir.rating), 2) as avg_rating_given
FROM institute_reviews ir
LEFT JOIN school_institutes si ON si.id = ir.reviewer_id AND ir.reviewer_type = 'institute'
LEFT JOIN private_users pu ON pu.id = ir.reviewer_id AND ir.reviewer_type = 'private'
GROUP BY ir.reviewer_id, ir.reviewer_type, si.institute_name, pu.first_name, pu.last_name
ORDER BY reviews_given DESC
LIMIT 10;

-- Recensioni che necessitano moderazione per istituto specifico
-- SOSTITUISCI UUID_ISTITUTO
/*
SELECT 
    ir.id,
    ir.rating,
    ir.created_at,
    CASE 
        WHEN ir.reviewer_type = 'institute' THEN si.institute_name
        ELSE pu.first_name || ' ' || pu.last_name
    END as reviewer_name,
    ir.reviewer_type
FROM institute_reviews ir
LEFT JOIN school_institutes si ON si.id = ir.reviewer_id AND ir.reviewer_type = 'institute'
LEFT JOIN private_users pu ON pu.id = ir.reviewer_id AND ir.reviewer_type = 'private'
WHERE ir.reviewed_institute_id = 'UUID_ISTITUTO'
AND ir.is_verified = false
ORDER BY ir.created_at DESC;
*/
