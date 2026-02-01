-- ===================================================================
-- RIPRISTINA AVATAR - Rimuovi Placeholder e Ricarica
-- ===================================================================

-- 1. VERIFICA STATO ATTUALE
SELECT 
  id,
  institute_name,
  logo_url
FROM school_institutes
WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8';

-- 2. RIMUOVI PLACEHOLDER ERRATO
UPDATE school_institutes
SET logo_url = NULL
WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8';

-- 3. VERIFICA AGGIORNAMENTO
SELECT 
  id,
  institute_name,
  logo_url,
  CASE 
    WHEN logo_url IS NULL THEN '✅ PRONTO PER UPLOAD'
    ELSE '⚠️ ANCORA POPOLATO'
  END as status
FROM school_institutes
WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8';

-- ===================================================================
-- ISTRUZIONI DOPO AVER ESEGUITO QUESTO SCRIPT
-- ===================================================================
-- 1. Ricarica la pagina (Ctrl+Shift+R)
-- 2. Vai su "Modifica Profilo"
-- 3. Carica la tua immagine avatar
-- 4. Salva
-- 5. L'avatar dovrebbe apparire ovunque

-- ===================================================================
-- VERIFICA ALTRI ISTITUTI
-- ===================================================================

-- Controlla se altri istituti hanno avatar
SELECT 
  id,
  institute_name,
  LEFT(logo_url, 80) as logo_preview,
  CASE 
    WHEN logo_url IS NULL THEN '❌ NO AVATAR'
    WHEN logo_url = '' THEN '❌ VUOTO'
    WHEN logo_url LIKE 'http%' THEN '✅ URL VALIDO'
    ELSE '⚠️ URL INVALIDO'
  END as status
FROM school_institutes
ORDER BY created_at DESC;

-- ===================================================================
-- FIX REGISTRAZIONE PRIVATO (Policy RLS)
-- ===================================================================

-- Abilita RLS su private_users
ALTER TABLE private_users ENABLE ROW LEVEL SECURITY;

-- Policy per INSERT (registrazione)
DROP POLICY IF EXISTS "Users can create their own private profile" ON private_users;
CREATE POLICY "Users can create their own private profile"
ON private_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy per SELECT (visualizzazione)
DROP POLICY IF EXISTS "Users can view their own private profile" ON private_users;
CREATE POLICY "Users can view their own private profile"
ON private_users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy per UPDATE (modifica)
DROP POLICY IF EXISTS "Users can update their own private profile" ON private_users;
CREATE POLICY "Users can update their own private profile"
ON private_users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verifica policy
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'private_users';

-- ===================================================================
-- ISTRUZIONI COMPLETE
-- ===================================================================
-- 1. Esegui questo script completo
-- 2. Ricarica homepage (Ctrl+Shift+R)
-- 3. Vai su "Modifica Profilo"
-- 4. Carica avatar
-- 5. Salva
-- 6. Verifica che appaia ovunque
-- 7. Prova a registrare nuovo utente privato (dovrebbe funzionare)
