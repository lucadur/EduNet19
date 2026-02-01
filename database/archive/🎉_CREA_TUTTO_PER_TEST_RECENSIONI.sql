-- ============================================
-- CREA TUTTO IL NECESSARIO PER TESTARE LE RECENSIONI
-- ============================================

-- STEP 1: Crea utente privato di test (se non esiste)
DO $$
DECLARE
    test_user_id UUID;
    test_email TEXT := 'mario.rossi.test@example.com';
    institute_id UUID := '58f402fa-47c4-4963-9044-018254ce3461';
BEGIN
    -- Verifica se esiste già
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = test_email;
    
    IF test_user_id IS NULL THEN
        -- Crea utente in auth.users
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data
        )
        VALUES (
            gen_random_uuid(),
            test_email,
            crypt('Test123!', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"user_type": "private"}'::jsonb
        )
        RETURNING id INTO test_user_id;
        
        -- Crea record in user_profiles (richiesto da foreign key)
        INSERT INTO user_profiles (
            id,
            user_type,
            created_at
        )
        VALUES (
            test_user_id,
            'privato', -- In italiano!
            NOW()
        );
        
        -- Crea profilo privato
        INSERT INTO private_users (
            id,
            first_name,
            last_name,
            created_at
        )
        VALUES (
            test_user_id,
            'Mario',
            'Rossi',
            NOW()
        );
        
        RAISE NOTICE 'Utente privato creato: % (%)', test_email, test_user_id;
    ELSE
        RAISE NOTICE 'Utente privato già esistente: % (%)', test_email, test_user_id;
    END IF;
    
    -- STEP 2: Elimina recensioni esistenti per questo utente/istituto
    DELETE FROM institute_reviews
    WHERE reviewer_id = test_user_id
      AND reviewed_institute_id = institute_id;
    
    -- STEP 3: Crea recensione PENDING
    INSERT INTO institute_reviews (
        reviewer_id,
        reviewer_type,
        reviewed_institute_id,
        rating,
        review_text,
        is_verified,
        created_at
    )
    VALUES (
        test_user_id,
        'private',
        institute_id,
        5,
        'Scuola eccellente! Personale qualificato, ambiente stimolante e ottima preparazione. I miei figli sono molto contenti e hanno fatto grandi progressi. Consigliata a tutte le famiglie!',
        false, -- NON VERIFICATA
        NOW()
    );
    
    RAISE NOTICE '✅ Recensione PENDING creata con successo!';
    
    -- STEP 4: Crea anche una recensione VERIFICATA per test
    INSERT INTO institute_reviews (
        reviewer_id,
        reviewer_type,
        reviewed_institute_id,
        rating,
        review_text,
        is_verified,
        created_at
    )
    VALUES (
        test_user_id,
        'institute',
        institute_id,
        4,
        'Ottima collaborazione con questa scuola. Progetti interessanti e personale disponibile.',
        true, -- VERIFICATA
        NOW() - INTERVAL '1 day'
    )
    ON CONFLICT (reviewer_id, reviewed_institute_id) DO NOTHING;
    
END $$;

-- STEP 5: Verifica risultati
SELECT 
    '=== RECENSIONI TOTALI ===' as info,
    COUNT(*) as count
FROM institute_reviews
WHERE reviewed_institute_id = '58f402fa-47c4-4963-9044-018254ce3461'

UNION ALL

SELECT 
    '=== RECENSIONI PENDING ===' as info,
    COUNT(*) as count
FROM institute_reviews
WHERE reviewed_institute_id = '58f402fa-47c4-4963-9044-018254ce3461'
  AND is_verified = false

UNION ALL

SELECT 
    '=== RECENSIONI VERIFICATE ===' as info,
    COUNT(*) as count
FROM institute_reviews
WHERE reviewed_institute_id = '58f402fa-47c4-4963-9044-018254ce3461'
  AND is_verified = true;

-- STEP 6: Mostra dettaglio recensioni
SELECT 
    ir.id,
    ir.rating,
    LEFT(ir.review_text, 60) as review_preview,
    ir.is_verified,
    ir.reviewer_type,
    COALESCE(pu.first_name || ' ' || pu.last_name, 'Istituto') as reviewer_name,
    ir.created_at
FROM institute_reviews ir
LEFT JOIN private_users pu ON ir.reviewer_id = pu.id
WHERE ir.reviewed_institute_id = '58f402fa-47c4-4963-9044-018254ce3461'
ORDER BY ir.created_at DESC;
