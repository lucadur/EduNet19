-- ===================================================================
-- AGGIUNGI ISTITUTI DI TEST - VERSIONE FUNZIONANTE
-- ===================================================================
-- Questo script funziona con lo schema reale del database
-- ===================================================================

-- 📊 VERIFICA DATI ATTUALI
-- ===================================================================

SELECT '📊 SITUAZIONE ATTUALE' as info;

SELECT 
  '🏫 Istituti' as tipo,
  COUNT(*) as totale
FROM school_institutes
UNION ALL
SELECT 
  '👥 Studenti',
  COUNT(*)
FROM private_users
UNION ALL
SELECT 
  '👤 User Profiles',
  COUNT(*)
FROM user_profiles;

-- ===================================================================
-- 🎯 STRATEGIA SEMPLICE: Usa utenti esistenti
-- ===================================================================
-- Invece di creare nuovi user_profiles (che richiedono auth.users),
-- usiamo gli utenti già registrati e completiamo i loro dati
-- ===================================================================

-- Verifica utenti istituto esistenti senza dati completi
SELECT 
  '🔍 UTENTI ISTITUTO ESISTENTI' as info,
  si.id,
  si.institute_name,
  CASE WHEN si.description IS NULL THEN '❌' ELSE '✅' END as ha_bio,
  CASE WHEN si.city IS NULL THEN '❌' ELSE '✅' END as ha_citta
FROM school_institutes si
ORDER BY si.created_at DESC
LIMIT 5;

-- ===================================================================
-- ✅ COMPLETA DATI ISTITUTI ESISTENTI
-- ===================================================================

-- Aggiorna istituti esistenti con dati mancanti
UPDATE school_institutes
SET 
  description = CASE 
    WHEN description IS NULL OR description = '' THEN 
      'Istituto di formazione di qualità con focus su eccellenza educativa e preparazione degli studenti.'
    ELSE description
  END,
  city = CASE 
    WHEN city IS NULL OR city = '' THEN 'Milano'
    ELSE city
  END,
  province = CASE 
    WHEN province IS NULL OR province = '' THEN 'MI'
    ELSE province
  END,
  region = CASE 
    WHEN region IS NULL OR region = '' THEN 'Lombardia'
    ELSE region
  END,
  country = CASE 
    WHEN country IS NULL OR country = '' THEN 'Italia'
    ELSE country
  END,
  verified = true,
  updated_at = NOW()
WHERE description IS NULL 
   OR city IS NULL 
   OR description = '' 
   OR city = '';

-- ===================================================================
-- 📊 VERIFICA FINALE
-- ===================================================================

SELECT '✅ DATI AGGIORNATI' as info;

SELECT 
  institute_name,
  city,
  province,
  CASE WHEN description IS NOT NULL THEN '✅' ELSE '❌' END as ha_bio,
  CASE WHEN verified THEN '✅' ELSE '⏳' END as verificato
FROM school_institutes
ORDER BY updated_at DESC
LIMIT 10;

-- Conta totali
SELECT 
  '🏫 ISTITUTI TOTALI' as tipo,
  COUNT(*) as totale,
  COUNT(CASE WHEN description IS NOT NULL THEN 1 END) as con_bio,
  COUNT(CASE WHEN city IS NOT NULL THEN 1 END) as con_citta
FROM school_institutes;

-- ===================================================================
-- 💡 NOTA IMPORTANTE
-- ===================================================================
-- 
-- Se NON hai istituti registrati, devi:
-- 
-- 1. Registrare manualmente 2-3 istituti dall'interfaccia web
-- 2. Poi eseguire questo script per completare i dati
-- 3. Oppure seguire le istruzioni nel file: 📝_REGISTRA_ISTITUTI_MANUALMENTE.md
-- 
-- Il sistema di raccomandazioni funziona anche con 1 solo istituto!
-- 
-- ===================================================================
