-- ✏️ AGGIORNA NOMI SPECIFICI DEGLI ISTITUTI
-- Usa questo script per impostare manualmente i nomi corretti degli istituti

-- STEP 1: Prima vedi quali istituti devi aggiornare
SELECT 
    id,
    institute_name as nome_attuale,
    email,
    created_at
FROM school_institutes
WHERE institute_name IS NULL OR institute_name = ''
ORDER BY created_at DESC;

-- STEP 2: Copia gli ID dalla query sopra e aggiorna manualmente
-- Sostituisci 'ID_ISTITUTO_QUI' con l'ID reale e 'NOME_CORRETTO' con il nome vero

-- Esempio per il primo istituto:
-- UPDATE school_institutes
-- SET 
--     institute_name = 'Liceo Scientifico Galileo Galilei',
--     institute_type = 'Liceo'
-- WHERE id = 'INSERISCI_ID_QUI';

-- Esempio per il secondo istituto:
-- UPDATE school_institutes
-- SET 
--     institute_name = 'Istituto Tecnico Leonardo da Vinci',
--     institute_type = 'Istituto Tecnico'
-- WHERE id = 'INSERISCI_ID_QUI';

-- STEP 3: Verifica che tutto sia aggiornato
SELECT 
    id,
    institute_name,
    institute_type,
    email,
    CASE 
        WHEN institute_name IS NULL OR institute_name = '' THEN '❌ MANCANTE'
        WHEN institute_name LIKE '%@%' THEN '⚠️ EMAIL USATA COME NOME'
        ELSE '✅ OK'
    END as stato
FROM school_institutes
ORDER BY created_at DESC;

-- STEP 4: Se vuoi aggiornare TUTTI gli istituti NULL con un nome generico
-- UPDATE school_institutes
-- SET institute_name = 'Istituto Scolastico'
-- WHERE institute_name IS NULL OR institute_name = '';
