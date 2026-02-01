-- ===================================================================
-- FIX DEFINITIVO: Rimuovi Trigger Problematico
-- ===================================================================
-- Questo script rimuove il trigger che causa l'errore 500
-- durante la registrazione

-- PROBLEMA IDENTIFICATO:
-- Il trigger "init_match_weights_on_user_create" su auth.users
-- cerca di inserire un record in match_weights ma fallisce

-- ===================================================================
-- STEP 1: Rimuovi il trigger problematico
-- ===================================================================

DROP TRIGGER IF EXISTS init_match_weights_on_user_create ON auth.users CASCADE;

-- ===================================================================
-- STEP 2: Verifica che il trigger sia stato rimosso
-- ===================================================================

SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 
            FROM information_schema.triggers 
            WHERE trigger_name = 'init_match_weights_on_user_create'
        ) THEN '✅ Trigger rimosso con successo!'
        ELSE '❌ Trigger ancora presente'
    END as status;

-- ===================================================================
-- STEP 3: Verifica altri trigger su auth.users
-- ===================================================================

SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- Se ci sono altri trigger, rimuovili uno per uno:
-- DROP TRIGGER IF EXISTS nome_trigger ON auth.users CASCADE;

-- ===================================================================
-- STEP 4: Soluzione Alternativa - Crea match_weights al primo login
-- ===================================================================

-- Invece di usare un trigger su auth.users (che causa problemi),
-- crea i match_weights quando l'utente accede per la prima volta

-- Opzione A: Crea la funzione per creare match_weights manualmente
CREATE OR REPLACE FUNCTION public.create_match_weights_for_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verifica se la tabella match_weights esiste
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'match_weights'
  ) THEN
    -- Inserisci solo se non esiste già
    INSERT INTO public.match_weights (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Opzione B: Crea match_weights quando viene creato il profilo utente
-- (Questo è più sicuro perché avviene dopo che l'utente è completamente creato)

CREATE OR REPLACE FUNCTION public.create_match_weights_on_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se la tabella match_weights esiste
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'match_weights'
  ) THEN
    -- Inserisci solo se non esiste già
    INSERT INTO public.match_weights (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crea trigger su user_profiles invece che su auth.users
DROP TRIGGER IF EXISTS init_match_weights_on_profile_create ON public.user_profiles;

CREATE TRIGGER init_match_weights_on_profile_create
    AFTER INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_match_weights_on_profile();

-- ===================================================================
-- STEP 5: Verifica che match_weights esista
-- ===================================================================

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'match_weights'
        ) THEN '✅ Tabella match_weights esiste'
        ELSE '⚠️ Tabella match_weights NON esiste - EduMatch non è stato installato'
    END as status;

-- ===================================================================
-- STEP 6: Se match_weights non esiste, creala (opzionale)
-- ===================================================================

-- Decommentare solo se vuoi abilitare EduMatch
/*
CREATE TABLE IF NOT EXISTS public.match_weights (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    content_similarity DECIMAL(3,2) DEFAULT 0.30,
    geographic_proximity DECIMAL(3,2) DEFAULT 0.25,
    interaction_history DECIMAL(3,2) DEFAULT 0.20,
    temporal_relevance DECIMAL(3,2) DEFAULT 0.15,
    user_preferences DECIMAL(3,2) DEFAULT 0.10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT weights_sum_check CHECK (
        content_similarity + geographic_proximity + 
        interaction_history + temporal_relevance + 
        user_preferences = 1.00
    )
);

-- Abilita RLS
ALTER TABLE public.match_weights ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere e modificare solo i propri pesi
CREATE POLICY "Users can manage own match weights"
    ON public.match_weights
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
*/

-- ===================================================================
-- STEP 7: Test finale
-- ===================================================================

-- Verifica che non ci siano più trigger su auth.users
SELECT 
    COUNT(*) as trigger_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Nessun trigger su auth.users - Registrazione dovrebbe funzionare!'
        ELSE '⚠️ Ci sono ancora ' || COUNT(*) || ' trigger su auth.users'
    END as status
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- ===================================================================
-- ISTRUZIONI POST-FIX
-- ===================================================================

-- 1. Esegui questo script nel SQL Editor di Supabase
-- 2. Verifica che tutti i comandi siano eseguiti con successo
-- 3. Prova a registrare un nuovo utente
-- 4. Se funziona, il problema era il trigger init_match_weights_on_user_create
-- 5. I match_weights verranno ora creati quando viene creato il profilo utente

-- ===================================================================
-- NOTA IMPORTANTE
-- ===================================================================

-- Questo script:
-- ✅ Rimuove il trigger problematico su auth.users
-- ✅ Crea un nuovo trigger su user_profiles (più sicuro)
-- ✅ Gestisce il caso in cui match_weights non esista
-- ✅ Non causa errori durante la registrazione

-- La registrazione ora dovrebbe funzionare correttamente!

COMMENT ON FUNCTION public.create_match_weights_on_profile() IS 
'Crea match_weights quando viene creato il profilo utente (più sicuro del trigger su auth.users)';
