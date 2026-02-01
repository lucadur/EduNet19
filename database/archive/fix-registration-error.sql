-- ===================================================================
-- FIX ERRORE REGISTRAZIONE: "Database error saving new user"
-- ===================================================================

-- Questo script risolve l'errore 500 durante la registrazione
-- causato da trigger o policy che falliscono

-- 1. Verifica trigger esistenti su auth.users
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- 2. Verifica se esiste un trigger che crea automaticamente il profilo
-- Se esiste, potrebbe essere la causa del problema

-- 3. Disabilita temporaneamente trigger problematici (se esistono)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- 4. Verifica policy su user_profiles che potrebbero bloccare l'inserimento
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_profiles';

-- 5. Assicurati che la policy INSERT permetta la creazione del profilo
-- durante la registrazione (quando l'utente è appena stato creato)

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

CREATE POLICY "Users can insert own profile" 
  ON public.user_profiles 
  FOR INSERT 
  WITH CHECK (
    -- Permetti inserimento se l'ID corrisponde all'utente autenticato
    id = (SELECT auth.uid())
  );

-- 6. Verifica policy su school_institutes
DROP POLICY IF EXISTS "Institutes can insert own data" ON public.school_institutes;

CREATE POLICY "Institutes can insert own data" 
  ON public.school_institutes 
  FOR INSERT 
  WITH CHECK (
    -- Permetti inserimento se l'ID corrisponde all'utente autenticato
    -- E se l'utente è di tipo istituto
    id = (SELECT auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = (SELECT auth.uid()) 
      AND user_type = 'istituto'
    )
  );

-- 7. Verifica policy su private_users
DROP POLICY IF EXISTS "Users can insert own data" ON public.private_users;

CREATE POLICY "Users can insert own data" 
  ON public.private_users 
  FOR INSERT 
  WITH CHECK (
    -- Permetti inserimento se l'ID corrisponde all'utente autenticato
    -- E se l'utente è di tipo privato
    id = (SELECT auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = (SELECT auth.uid()) 
      AND user_type = 'privato'
    )
  );

-- 8. Verifica che RLS sia abilitato ma non troppo restrittivo
-- Le policy sopra dovrebbero permettere la creazione del profilo

-- 9. Test: Prova a creare un profilo manualmente per verificare
-- (Sostituisci con un UUID reale per testare)
/*
INSERT INTO public.user_profiles (id, user_type, email_verified, profile_completed)
VALUES ('test-uuid-here', 'istituto', false, false);
*/

-- 10. Se il problema persiste, potrebbe essere un trigger su auth.users
-- Verifica i log di Supabase per dettagli specifici

-- ===================================================================
-- SOLUZIONE ALTERNATIVA: Creazione profilo al primo login
-- ===================================================================

-- Se i trigger continuano a dare problemi, la soluzione migliore è:
-- 1. NON creare il profilo durante la registrazione
-- 2. Salvare i dati in localStorage
-- 3. Creare il profilo al primo login (già implementato in auth.js)

-- Questo approccio evita problemi con trigger e policy durante la registrazione
-- e garantisce che il profilo venga creato quando l'utente è completamente autenticato

COMMENT ON TABLE public.user_profiles IS 
'Profili utente - Creati al primo login per evitare problemi con trigger durante registrazione';
