-- Aggiungi campi per dati MIUR alla tabella school_institutes

DO $$ 
BEGIN
    -- institute_code (codice meccanografico)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'school_institutes' AND column_name = 'institute_code'
    ) THEN
        ALTER TABLE school_institutes ADD COLUMN institute_code TEXT UNIQUE;
        RAISE NOTICE 'Colonna institute_code aggiunta';
        
        -- Crea indice per ricerche veloci
        CREATE INDEX IF NOT EXISTS idx_school_institutes_code 
        ON school_institutes(institute_code);
    END IF;

    -- miur_data (JSON con tutti i metadata MIUR)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'school_institutes' AND column_name = 'miur_data'
    ) THEN
        ALTER TABLE school_institutes ADD COLUMN miur_data JSONB;
        RAISE NOTICE 'Colonna miur_data aggiunta';
        
        -- Crea indice GIN per query JSON veloci
        CREATE INDEX IF NOT EXISTS idx_school_institutes_miur_data 
        ON school_institutes USING GIN (miur_data);
    END IF;

    -- cap (codice avviamento postale)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'school_institutes' AND column_name = 'cap'
    ) THEN
        ALTER TABLE school_institutes ADD COLUMN cap TEXT;
        RAISE NOTICE 'Colonna cap aggiunta';
    END IF;

END $$;

-- Verifica colonne aggiunte
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'school_institutes'
  AND column_name IN ('institute_code', 'miur_data', 'cap')
ORDER BY column_name;
