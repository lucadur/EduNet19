-- ===================================================================
-- AGGIUNGI ISTITUTI DI TEST - VERSIONE CORRETTA
-- ===================================================================
-- Questo script crea prima i user_profiles e poi gli istituti collegati
-- ===================================================================

-- 📊 STEP 1: VERIFICA DATI ESISTENTI
-- ===================================================================

SELECT '📊 DATI ATTUALI' as info;

SELECT 
  '🏫 Istituti' as tipo,
  COUNT(*) as totale
FROM school_institutes
UNION ALL
SELECT 
  '👥 Studenti',
  COUNT(*)
FROM private_users;

-- ===================================================================
-- 🎯 STEP 2: CREA ISTITUTI DI TEST
-- ===================================================================
-- Nota: Usiamo gli ID degli utenti esistenti o creiamo profili base
-- ===================================================================

-- Istituto 1: Liceo Scientifico Galilei
DO $$
DECLARE
  v_profile_id UUID;
BEGIN
  -- Crea o usa un profilo esistente
  INSERT INTO user_profiles (id, user_type, email, full_name, created_at)
  VALUES (
    gen_random_uuid(),
    'istituto',
    'galilei@test.edumatch.it',
    'Liceo Scientifico Galileo Galilei',
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
  RETURNING id INTO v_profile_id;

  -- Crea l'istituto
  INSERT INTO school_institutes (
    id,
    institute_name,
    institute_type,
    description,
    city,
    province,
    region,
    country,
    website,
    student_count,
    teacher_count,
    verified
  )
  VALUES (
    v_profile_id,
    'Liceo Scientifico Galileo Galilei',
    'Liceo Scientifico',
    'Eccellenza nella formazione scientifica con laboratori all''avanguardia. Offriamo un percorso di studi completo in matematica, fisica, scienze naturali e informatica.',
    'Milano',
    'MI',
    'Lombardia',
    'Italia',
    'www.liceogalilei-mi.edu.it',
    850,
    65,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE '✅ Creato: Liceo Scientifico Galilei';
END $$;

-- Istituto 2: Istituto Tecnico Da Vinci
DO $$
DECLARE
  v_profile_id UUID;
BEGIN
  INSERT INTO user_profiles (id, user_type, email, full_name, created_at)
  VALUES (
    gen_random_uuid(),
    'istituto',
    'davinci@test.edumatch.it',
    'Istituto Tecnico Leonardo Da Vinci',
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
  RETURNING id INTO v_profile_id;

  INSERT INTO school_institutes (
    id,
    institute_name,
    institute_type,
    description,
    city,
    province,
    region,
    country,
    website,
    student_count,
    teacher_count,
    verified
  )
  VALUES (
    v_profile_id,
    'Istituto Tecnico Leonardo Da Vinci',
    'Istituto Tecnico Tecnologico',
    'Formazione tecnica di qualità con focus su innovazione e tecnologia. Specializzazioni in informatica, elettronica, meccanica e automazione.',
    'Roma',
    'RM',
    'Lazio',
    'Italia',
    'www.itisdavinci-roma.edu.it',
    920,
    72,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE '✅ Creato: Istituto Tecnico Da Vinci';
END $$;

-- Istituto 3: Liceo Classico Manzoni
DO $$
DECLARE
  v_profile_id UUID;
BEGIN
  INSERT INTO user_profiles (id, user_type, email, full_name, created_at)
  VALUES (
    gen_random_uuid(),
    'istituto',
    'manzoni@test.edumatch.it',
    'Liceo Classico Alessandro Manzoni',
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
  RETURNING id INTO v_profile_id;

  INSERT INTO school_institutes (
    id,
    institute_name,
    institute_type,
    description,
    city,
    province,
    region,
    country,
    website,
    student_count,
    teacher_count,
    verified
  )
  VALUES (
    v_profile_id,
    'Liceo Classico Alessandro Manzoni',
    'Liceo Classico',
    'Tradizione umanistica e preparazione universitaria di eccellenza. Latino, greco, filosofia e storia dell''arte con metodi didattici innovativi.',
    'Torino',
    'TO',
    'Piemonte',
    'Italia',
    'www.liceomanzoni-to.edu.it',
    680,
    58,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE '✅ Creato: Liceo Classico Manzoni';
END $$;

-- Istituto 4: Liceo Linguistico
DO $$
DECLARE
  v_profile_id UUID;
BEGIN
  INSERT INTO user_profiles (id, user_type, email, full_name, created_at)
  VALUES (
    gen_random_uuid(),
    'istituto',
    'linguistico@test.edumatch.it',
    'Liceo Linguistico Internazionale',
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
  RETURNING id INTO v_profile_id;

  INSERT INTO school_institutes (
    id,
    institute_name,
    institute_type,
    description,
    city,
    province,
    region,
    country,
    website,
    student_count,
    teacher_count,
    verified
  )
  VALUES (
    v_profile_id,
    'Liceo Linguistico Internazionale',
    'Liceo Linguistico',
    'Formazione linguistica d''eccellenza con certificazioni internazionali. Inglese, francese, spagnolo, tedesco e cinese con docenti madrelingua.',
    'Firenze',
    'FI',
    'Toscana',
    'Italia',
    'www.linguistico-fi.edu.it',
    540,
    48,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE '✅ Creato: Liceo Linguistico';
END $$;

-- Istituto 5: Istituto Professionale
DO $$
DECLARE
  v_profile_id UUID;
BEGIN
  INSERT INTO user_profiles (id, user_type, email, full_name, created_at)
  VALUES (
    gen_random_uuid(),
    'istituto',
    'fermi@test.edumatch.it',
    'Istituto Professionale Enrico Fermi',
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
  RETURNING id INTO v_profile_id;

  INSERT INTO school_institutes (
    id,
    institute_name,
    institute_type,
    description,
    city,
    province,
    region,
    country,
    website,
    student_count,
    teacher_count,
    verified
  )
  VALUES (
    v_profile_id,
    'Istituto Professionale Enrico Fermi',
    'Istituto Professionale',
    'Formazione professionale con stage e alternanza scuola-lavoro. Settori: servizi commerciali, turismo, enogastronomia e ospitalità.',
    'Bologna',
    'BO',
    'Emilia-Romagna',
    'Italia',
    'www.ipfermi-bo.edu.it',
    720,
    62,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE '✅ Creato: Istituto Professionale Fermi';
END $$;

-- ===================================================================
-- 📊 STEP 3: VERIFICA FINALE
-- ===================================================================

SELECT '✅ VERIFICA FINALE' as info;

SELECT 
  '🏫 ISTITUTI TOTALI' as tipo,
  COUNT(*) as totale
FROM school_institutes
UNION ALL
SELECT 
  '👥 STUDENTI TOTALI',
  COUNT(*)
FROM private_users;

-- Lista istituti appena creati
SELECT 
  '📋 ISTITUTI CREATI' as info,
  institute_name,
  institute_type,
  city,
  CASE WHEN verified THEN '✅' ELSE '⏳' END as verificato
FROM school_institutes
WHERE institute_name IN (
  'Liceo Scientifico Galileo Galilei',
  'Istituto Tecnico Leonardo Da Vinci',
  'Liceo Classico Alessandro Manzoni',
  'Liceo Linguistico Internazionale',
  'Istituto Professionale Enrico Fermi'
)
ORDER BY created_at DESC;

-- ===================================================================
-- ✅ COMPLETATO!
-- ===================================================================
-- 
-- Ora hai 5 istituti di test nel database.
-- 
-- Prossimi passi:
-- 1. Ricarica la homepage (Ctrl+F5)
-- 2. Apri la console (F12)
-- 3. Dovresti vedere: "✅ Found 5 institutes"
-- 4. Le raccomandazioni appariranno nella sezione "Scopri"
-- 
-- ===================================================================
