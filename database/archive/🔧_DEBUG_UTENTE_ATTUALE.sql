-- ===================================================================
-- DEBUG UTENTE ATTUALE - Verifica Tipo e Dati
-- ===================================================================

-- 1. VERIFICA PROFILO UTENTE
-- Sostituisci con il tuo user_id: c30ebcb7-e3ae-4d90-b513-f673d4096fcc
SELECT 
  id,
  user_type,
  email_verified,
  profile_completed,
  created_at
FROM user_profiles
WHERE id = 'c30ebcb7-e3ae-4d90-b513-f673d4096fcc';

-- 2. VERIFICA DATI PRIVATO
SELECT 
  id,
  first_name,
  last_name,
  avatar_url,
  profession,
  created_at
FROM private_users
WHERE id = 'c30ebcb7-e3ae-4d90-b513-f673d4096fcc';

-- 3. VERIFICA DATI ISTITUTO
SELECT 
  id,
  institute_name,
  logo_url,
  institute_type,
  created_at
FROM school_institutes
WHERE id = 'c30ebcb7-e3ae-4d90-b513-f673d4096fcc';

-- 4. VERIFICA AUTH METADATA
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users
WHERE id = 'c30ebcb7-e3ae-4d90-b513-f673d4096fcc';

-- ===================================================================
-- DIAGNOSI
-- ===================================================================
-- Se vedi:
-- - user_profiles.user_type = 'privato' MA
-- - school_institutes ha dati (institute_name = 'IIS Leonardo da Vinci')
-- 
-- PROBLEMA: Dati inconsistenti!
-- 
-- CAUSA PROBABILE:
-- 1. Registrazione ha creato profilo privato
-- 2. Ma poi ha anche creato profilo istituto
-- 3. Sistema confuso su quale usare

-- ===================================================================
-- FIX: Pulisci Dati Inconsistenti
-- ===================================================================

-- OPZIONE A: Sei PRIVATO (rimuovi dati istituto)
/*
DELETE FROM school_institutes
WHERE id = 'c30ebcb7-e3ae-4d90-b513-f673d4096fcc';

UPDATE user_profiles
SET user_type = 'privato'
WHERE id = 'c30ebcb7-e3ae-4d90-b513-f673d4096fcc';
*/

-- OPZIONE B: Sei ISTITUTO (rimuovi dati privato)
/*
DELETE FROM private_users
WHERE id = 'c30ebcb7-e3ae-4d90-b513-f673d4096fcc';

UPDATE user_profiles
SET user_type = 'istituto'
WHERE id = 'c30ebcb7-e3ae-4d90-b513-f673d4096fcc';
*/

-- ===================================================================
-- VERIFICA ALTRI ISTITUTI CON AVATAR
-- ===================================================================

-- Trova istituti che hanno avatar caricato
SELECT 
  id,
  institute_name,
  logo_url,
  CASE 
    WHEN logo_url IS NULL THEN '❌ NO AVATAR'
    WHEN logo_url = '' THEN '❌ AVATAR VUOTO'
    ELSE '✅ HAS AVATAR'
  END as avatar_status
FROM school_institutes
ORDER BY created_at DESC;

-- ===================================================================
-- ISTRUZIONI
-- ===================================================================
-- 1. Esegui le query di verifica (1-4)
-- 2. Guarda i risultati
-- 3. Decidi se sei privato o istituto
-- 4. Esegui il FIX appropriato (OPZIONE A o B)
-- 5. Ricarica homepage e verifica
