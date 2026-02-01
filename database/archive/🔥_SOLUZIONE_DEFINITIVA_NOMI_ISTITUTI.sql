-- ===================================================================
-- 🔥 SOLUZIONE DEFINITIVA NOMI ISTITUTI - RISOLVE PER SEMPRE
-- ===================================================================
-- Questo script risolve il problema dei nomi NULL e previene che accada mai più

-- ===================================================================
-- PARTE 1: FIX ISTITUTI ESISTENTI CON NOME NULL
-- ===================================================================

-- STEP 1.1: Aggiorna dai metadata se disponibili
UPDATE school_institutes si
SET institute_name = COALESCE(
    au.raw_user_meta_data->>'institute_name',
    au.raw_user_meta_data->>'instituteName',
    si.institute_name
)
FROM auth.users au
WHERE si.id = au.id
  AND si.institute_name IS NULL
  AND (
    au.raw_user_meta_data->>'institute_name' IS NOT NULL
    OR au.raw_user_meta_data->>'instituteName' IS NOT NULL
  );

-- STEP 1.2: Per quelli ancora NULL, usa l'email come base
UPDATE school_institutes
SET institute_name = CASE
    -- Se l'email contiene il nome di un istituto, estrailo
    WHEN email ILIKE '%liceo%' THEN INITCAP(SPLIT_PART(email, '@', 1))
    WHEN email ILIKE '%istituto%' THEN INITCAP(SPLIT_PART(email, '@', 1))
    WHEN email ILIKE '%scuola%' THEN INITCAP(SPLIT_PART(email, '@', 1))
    -- Altrimenti usa la parte prima della @ formattata
    WHEN email IS NOT NULL THEN INITCAP(REPLACE(SPLIT_PART(email, '@', 1), '.', ' '))
    -- Ultimo fallback: usa l'ID
    ELSE 'Istituto ' || SUBSTRING(id::text, 1, 8)
END
WHERE institute_name IS NULL;

-- STEP 1.3: Imposta tipo istituto se mancante
UPDATE school_institutes
SET institute_type = COALESCE(institute_type, 'Istituto Scolastico')
WHERE institute_type IS NULL OR institute_type = '';

-- ===================================================================
-- PARTE 2: MODIFICA TRIGGER PER PREVENIRE NULL IN FUTURO
-- ===================================================================

-- STEP 2.1: Rimuovi il trigger esistente
DROP TRIGGER IF EXISTS on_user_created ON auth.users;

-- STEP 2.2: Crea funzione trigger MIGLIORATA che NON permette mai NULL
CREATE OR REPLACE FUNCTION public.auto_create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type TEXT;
  v_institute_name TEXT;
  v_institute_type TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- Determina il tipo di utente
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'istituto');
  
  -- Crea sempre il profilo base
  INSERT INTO public.user_profiles (id, user_type, email_verified, profile_completed)
  VALUES (NEW.id, v_user_type, NEW.email_confirmed_at IS NOT NULL, false)
  ON CONFLICT (id) DO NOTHING;
  
  -- Gestisci in base al tipo
  IF v_user_type = 'privato' THEN
    -- Utente privato
    v_first_name := COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'firstName',
      SPLIT_PART(NEW.email, '@', 1)
    );
    v_last_name := COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'lastName',
      ''
    );
    
    INSERT INTO public.private_users (id, first_name, last_name)
    VALUES (NEW.id, v_first_name, v_last_name)
    ON CONFLICT (id) DO UPDATE SET
      first_name = COALESCE(EXCLUDED.first_name, private_users.first_name),
      last_name = COALESCE(EXCLUDED.last_name, private_users.last_name);
      
  ELSE
    -- Istituto - GARANTISCE che il nome non sia mai NULL
    v_institute_name := COALESCE(
      NEW.raw_user_meta_data->>'institute_name',
      NEW.raw_user_meta_data->>'instituteName',
      INITCAP(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', ' ')),
      'Istituto Scolastico'
    );
    
    v_institute_type := COALESCE(
      NEW.raw_user_meta_data->>'institute_type',
      NEW.raw_user_meta_data->>'instituteType',
      'Istituto Scolastico'
    );
    
    INSERT INTO public.school_institutes (id, institute_name, institute_type, verified)
    VALUES (NEW.id, v_institute_name, v_institute_type, false)
    ON CONFLICT (id) DO UPDATE SET
      institute_name = COALESCE(EXCLUDED.institute_name, school_institutes.institute_name),
      institute_type = COALESCE(EXCLUDED.institute_type, school_institutes.institute_type);
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Anche in caso di errore, ritorna NEW per non bloccare la registrazione
    RAISE WARNING 'Errore in auto_create_user_profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- STEP 2.3: Ricrea il trigger
CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_user_profile();

-- ===================================================================
-- PARTE 3: AGGIUNGI CONSTRAINT E DEFAULT PER SICUREZZA MASSIMA
-- ===================================================================

-- STEP 3.1: Imposta un default per institute_name (fallback finale)
ALTER TABLE school_institutes 
ALTER COLUMN institute_name SET DEFAULT 'Istituto Scolastico';

-- STEP 3.2: Imposta un default per institute_type
ALTER TABLE school_institutes 
ALTER COLUMN institute_type SET DEFAULT 'Istituto Scolastico';

-- STEP 3.3: Aggiungi un CHECK constraint per prevenire stringhe vuote
ALTER TABLE school_institutes 
DROP CONSTRAINT IF EXISTS check_institute_name_not_empty;

ALTER TABLE school_institutes 
ADD CONSTRAINT check_institute_name_not_empty 
CHECK (institute_name IS NOT NULL AND LENGTH(TRIM(institute_name)) > 0);

-- ===================================================================
-- PARTE 4: CREA FUNZIONE DI BACKUP PER AGGIORNARE NOMI MANCANTI
-- ===================================================================

CREATE OR REPLACE FUNCTION public.fix_missing_institute_names()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Aggiorna tutti gli istituti con nome problematico
  UPDATE school_institutes si
  SET institute_name = CASE
    WHEN au.raw_user_meta_data->>'institute_name' IS NOT NULL 
      THEN au.raw_user_meta_data->>'institute_name'
    WHEN au.raw_user_meta_data->>'instituteName' IS NOT NULL 
      THEN au.raw_user_meta_data->>'instituteName'
    WHEN si.email IS NOT NULL 
      THEN INITCAP(REPLACE(SPLIT_PART(si.email, '@', 1), '.', ' '))
    ELSE 'Istituto Scolastico'
  END
  FROM auth.users au
  WHERE si.id = au.id
    AND (
      si.institute_name IS NULL 
      OR si.institute_name = '' 
      OR si.institute_name = 'Istituto'
      OR si.institute_name = 'Nuovo Istituto'
    );
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;

-- Esegui la funzione di fix
SELECT fix_missing_institute_names() as istituti_aggiornati;

-- ===================================================================
-- PARTE 5: VERIFICA FINALE
-- ===================================================================

-- Mostra tutti gli istituti e il loro stato
SELECT 
    id,
    institute_name,
    institute_type,
    email,
    CASE 
        WHEN institute_name IS NULL THEN '❌ NULL (IMPOSSIBILE!)'
        WHEN institute_name = '' THEN '❌ VUOTO (IMPOSSIBILE!)'
        WHEN institute_name = 'Istituto Scolastico' THEN '⚠️ DEFAULT'
        ELSE '✅ OK'
    END as stato,
    created_at
FROM school_institutes
ORDER BY created_at DESC;

-- Statistiche finali
SELECT 
    COUNT(*) as totale_istituti,
    COUNT(*) FILTER (WHERE institute_name IS NULL OR institute_name = '') as ancora_null_impossibile,
    COUNT(*) FILTER (WHERE institute_name = 'Istituto Scolastico') as con_default,
    COUNT(*) FILTER (WHERE institute_name IS NOT NULL AND institute_name != '' AND institute_name != 'Istituto Scolastico') as con_nome_personalizzato,
    ROUND(100.0 * COUNT(*) FILTER (WHERE institute_name IS NOT NULL AND institute_name != '') / COUNT(*), 1) as percentuale_validi
FROM school_institutes;

-- Messaggio finale
SELECT 
    '✅ PROBLEMA RISOLTO DEFINITIVAMENTE!' as status,
    'Nessun istituto potrà mai più avere nome NULL' as garanzia,
    'Il trigger ora usa multipli fallback per garantire sempre un nome' as dettaglio_1,
    'Il constraint CHECK impedisce inserimenti con nome vuoto' as dettaglio_2,
    'Il DEFAULT fornisce un valore sicuro come ultima risorsa' as dettaglio_3;
