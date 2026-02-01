-- Aggiungi colonne mancanti alla tabella school_institutes
-- Per permettere il salvataggio del profilo completo

-- Verifica e aggiungi colonne se non esistono
DO $$ 
BEGIN
    -- cover_image
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'school_institutes' AND column_name = 'cover_image'
    ) THEN
        ALTER TABLE school_institutes ADD COLUMN cover_image TEXT;
        RAISE NOTICE 'Colonna cover_image aggiunta';
    END IF;

    -- email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'school_institutes' AND column_name = 'email'
    ) THEN
        ALTER TABLE school_institutes ADD COLUMN email TEXT;
        RAISE NOTICE 'Colonna email aggiunta';
    END IF;

    -- phone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'school_institutes' AND column_name = 'phone'
    ) THEN
        ALTER TABLE school_institutes ADD COLUMN phone TEXT;
        RAISE NOTICE 'Colonna phone aggiunta';
    END IF;

    -- website
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'school_institutes' AND column_name = 'website'
    ) THEN
        ALTER TABLE school_institutes ADD COLUMN website TEXT;
        RAISE NOTICE 'Colonna website aggiunta';
    END IF;

    -- address
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'school_institutes' AND column_name = 'address'
    ) THEN
        ALTER TABLE school_institutes ADD COLUMN address TEXT;
        RAISE NOTICE 'Colonna address aggiunta';
    END IF;

    -- city
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'school_institutes' AND column_name = 'city'
    ) THEN
        ALTER TABLE school_institutes ADD COLUMN city TEXT;
        RAISE NOTICE 'Colonna city aggiunta';
    END IF;

    -- province
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'school_institutes' AND column_name = 'province'
    ) THEN
        ALTER TABLE school_institutes ADD COLUMN province TEXT;
        RAISE NOTICE 'Colonna province aggiunta';
    END IF;

    -- specializations
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'school_institutes' AND column_name = 'specializations'
    ) THEN
        ALTER TABLE school_institutes ADD COLUMN specializations TEXT;
        RAISE NOTICE 'Colonna specializations aggiunta';
    END IF;

    -- methodologies (array)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'school_institutes' AND column_name = 'methodologies'
    ) THEN
        ALTER TABLE school_institutes ADD COLUMN methodologies TEXT[];
        RAISE NOTICE 'Colonna methodologies aggiunta';
    END IF;

    -- interests (array)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'school_institutes' AND column_name = 'interests'
    ) THEN
        ALTER TABLE school_institutes ADD COLUMN interests TEXT[];
        RAISE NOTICE 'Colonna interests aggiunta';
    END IF;

    -- updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'school_institutes' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE school_institutes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Colonna updated_at aggiunta';
    END IF;

END $$;

-- Verifica colonne aggiunte
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'school_institutes'
ORDER BY ordinal_position;
