-- ===================================================================
-- CRITICAL FIX: Disabilita Trigger Problematico su auth.users
-- ===================================================================
-- Questo script identifica e disabilita il trigger che causa l'errore 500
-- durante la registrazione

-- STEP 1: Identifica tutti i trigger su auth.users
-- ===================================================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- STEP 2: Identifica funzioni che potrebbero essere chiamate dai trigger
-- ===================================================================
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'auth')
  AND (
    p.proname LIKE '%user%' OR 
    p.proname LIKE '%profile%' OR
    p.proname LIKE '%handle%' OR
    p.proname LIKE '%create%'
  )
ORDER BY n.nspname, p.proname;

-- STEP 3: Cerca trigger specifici comuni che potrebbero causare problemi
-- ===================================================================

-- Trigger comune 1: on_auth_user_created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- Trigger comune 2: handle_new_user
DROP TRIGGER IF EXISTS handle_new_user ON auth.users CASCADE;

-- Trigger comune 3: create_profile_for_new_user
DROP TRIGGER IF EXISTS create_profile_for_new_user ON auth.users CASCADE;

-- Trigger comune 4: init_user_profile
DROP TRIGGER IF EXISTS init_user_profile ON auth.users CASCADE;

-- STEP 4: Disabilita trigger di EduMatch se esistono
-- ===================================================================
DROP TRIGGER IF EXISTS init_match_weights_on_user_create ON auth.users CASCADE;

-- STEP 5: Verifica trigger rimasti
-- ===================================================================
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- STEP 6: Se necessario, disabilita TUTTI i trigger su auth.users temporaneamente
-- ===================================================================
-- ATTENZIONE: Questo disabilita TUTTI i trigger. Usare solo se necessario.
-- Decommentare solo se i passaggi precedenti non hanno risolto il problema.

/*
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users CASCADE', r.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
    END LOOP;
END $$;
*/

-- STEP 7: Verifica che non ci siano più trigger
-- ===================================================================
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Nessun trigger su auth.users - Problema risolto!'
        ELSE '⚠️ Ci sono ancora ' || COUNT(*) || ' trigger su auth.users'
    END as status
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- ===================================================================
-- ISTRUZIONI POST-FIX
-- ===================================================================

-- Dopo aver eseguito questo script:
-- 1. Prova a registrare un nuovo utente
-- 2. Se funziona, il problema era un trigger
-- 3. Se non funziona ancora, il problema potrebbe essere:
--    - Una policy RLS troppo restrittiva
--    - Un vincolo di foreign key
--    - Una funzione chiamata da Supabase internamente

-- Per verificare policy RLS:
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'school_institutes', 'private_users')
ORDER BY tablename, policyname;

-- ===================================================================
-- NOTA IMPORTANTE
-- ===================================================================
-- Se questo script risolve il problema, significa che c'era un trigger
-- che cercava di creare automaticamente il profilo utente.
-- 
-- La soluzione corretta è:
-- 1. NON usare trigger automatici su auth.users
-- 2. Creare il profilo manualmente dopo la registrazione
-- 3. Usare l'approccio "pending profile" già implementato in auth.js
-- ===================================================================

COMMENT ON SCHEMA auth IS 'Schema di autenticazione Supabase - Trigger rimossi per evitare errori durante registrazione';
