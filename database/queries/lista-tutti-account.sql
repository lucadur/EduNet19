-- Script per visualizzare tutti gli account registrati su EduNet19

-- ============================================
-- OPZIONE 1: Lista Completa con Tutti i Dettagli
-- ============================================

SELECT 
  au.id,
  au.email,
  au.created_at as registrato_il,
  au.email_confirmed_at as email_verificata_il,
  au.last_sign_in_at as ultimo_accesso,
  up.user_type as tipo_utente,
  up.profile_completed as profilo_completato,
  CASE 
    WHEN up.user_type = 'istituto' THEN si.institute_name
    WHEN up.user_type = 'privato' THEN pu.first_name || ' ' || pu.last_name
    ELSE 'N/A'
  END as nome_completo,
  CASE 
    WHEN up.user_type = 'istituto' THEN si.institute_type
    ELSE NULL
  END as tipo_istituto,
  CASE 
    WHEN up.user_type = 'istituto' THEN si.city
    ELSE NULL
  END as citta
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
LEFT JOIN school_institutes si ON au.id = si.id AND up.user_type = 'istituto'
LEFT JOIN private_users pu ON au.id = pu.id AND up.user_type = 'privato'
ORDER BY au.created_at DESC;


-- ============================================
-- OPZIONE 2: Lista Semplice (Solo Info Base)
-- ============================================

SELECT 
  au.id,
  au.email,
  up.user_type,
  au.created_at,
  au.last_sign_in_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC;


-- ============================================
-- OPZIONE 3: Solo Istituti
-- ============================================

SELECT 
  au.id,
  au.email,
  si.institute_name as nome_istituto,
  si.institute_type as tipo,
  si.city as citta,
  si.website as sito_web,
  au.created_at as registrato_il,
  au.last_sign_in_at as ultimo_accesso
FROM auth.users au
INNER JOIN user_profiles up ON au.id = up.id
INNER JOIN school_institutes si ON au.id = si.id
WHERE up.user_type = 'istituto'
ORDER BY au.created_at DESC;


-- ============================================
-- OPZIONE 4: Solo Utenti Privati
-- ============================================

SELECT 
  au.id,
  au.email,
  pu.first_name as nome,
  pu.last_name as cognome,
  pu.bio,
  au.created_at as registrato_il,
  au.last_sign_in_at as ultimo_accesso
FROM auth.users au
INNER JOIN user_profiles up ON au.id = up.id
INNER JOIN private_users pu ON au.id = pu.id
WHERE up.user_type = 'privato'
ORDER BY au.created_at DESC;


-- ============================================
-- OPZIONE 5: Statistiche Account
-- ============================================

SELECT 
  'Totale Account' as categoria,
  COUNT(*) as numero
FROM auth.users

UNION ALL

SELECT 
  'Istituti' as categoria,
  COUNT(*) as numero
FROM user_profiles
WHERE user_type = 'istituto'

UNION ALL

SELECT 
  'Utenti Privati' as categoria,
  COUNT(*) as numero
FROM user_profiles
WHERE user_type = 'privato'

UNION ALL

SELECT 
  'Email Verificate' as categoria,
  COUNT(*) as numero
FROM auth.users
WHERE email_confirmed_at IS NOT NULL

UNION ALL

SELECT 
  'Profili Completati' as categoria,
  COUNT(*) as numero
FROM user_profiles
WHERE profile_completed = true

UNION ALL

SELECT 
  'Accessi Ultimi 7 Giorni' as categoria,
  COUNT(*) as numero
FROM auth.users
WHERE last_sign_in_at > NOW() - INTERVAL '7 days';


-- ============================================
-- OPZIONE 6: Account con Dettagli Attività
-- ============================================

SELECT 
  au.email,
  up.user_type,
  CASE 
    WHEN up.user_type = 'istituto' THEN si.institute_name
    WHEN up.user_type = 'privato' THEN pu.first_name || ' ' || pu.last_name
    ELSE 'N/A'
  END as nome,
  au.created_at as registrato_il,
  au.last_sign_in_at as ultimo_accesso,
  CASE 
    WHEN au.last_sign_in_at > NOW() - INTERVAL '7 days' THEN '🟢 Attivo'
    WHEN au.last_sign_in_at > NOW() - INTERVAL '30 days' THEN '🟡 Recente'
    WHEN au.last_sign_in_at IS NOT NULL THEN '🔴 Inattivo'
    ELSE '⚪ Mai loggato'
  END as stato_attivita,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN '✅ Verificata'
    ELSE '❌ Non verificata'
  END as stato_email,
  CASE 
    WHEN up.profile_completed THEN '✅ Completo'
    ELSE '⚠️ Incompleto'
  END as stato_profilo
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
LEFT JOIN school_institutes si ON au.id = si.id AND up.user_type = 'istituto'
LEFT JOIN private_users pu ON au.id = pu.id AND up.user_type = 'privato'
ORDER BY au.last_sign_in_at DESC NULLS LAST;


-- ============================================
-- OPZIONE 7: Cerca Account Specifico
-- ============================================

-- Per email
SELECT 
  au.id,
  au.email,
  up.user_type,
  CASE 
    WHEN up.user_type = 'istituto' THEN si.institute_name
    WHEN up.user_type = 'privato' THEN pu.first_name || ' ' || pu.last_name
  END as nome,
  au.created_at,
  au.last_sign_in_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
LEFT JOIN school_institutes si ON au.id = si.id
LEFT JOIN private_users pu ON au.id = pu.id
WHERE au.email ILIKE '%cerca_qui%'; -- Sostituisci con l'email da cercare

-- Per nome istituto
SELECT 
  au.id,
  au.email,
  si.institute_name,
  si.institute_type,
  si.city,
  au.created_at
FROM auth.users au
INNER JOIN user_profiles up ON au.id = up.id
INNER JOIN school_institutes si ON au.id = si.id
WHERE si.institute_name ILIKE '%cerca_qui%'; -- Sostituisci con il nome da cercare


-- ============================================
-- OPZIONE 8: Account Registrati Oggi
-- ============================================

SELECT 
  au.email,
  up.user_type,
  CASE 
    WHEN up.user_type = 'istituto' THEN si.institute_name
    WHEN up.user_type = 'privato' THEN pu.first_name || ' ' || pu.last_name
  END as nome,
  au.created_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
LEFT JOIN school_institutes si ON au.id = si.id
LEFT JOIN private_users pu ON au.id = pu.id
WHERE DATE(au.created_at) = CURRENT_DATE
ORDER BY au.created_at DESC;


-- ============================================
-- OPZIONE 9: Export CSV-Friendly
-- ============================================

SELECT 
  au.email as "Email",
  up.user_type as "Tipo",
  CASE 
    WHEN up.user_type = 'istituto' THEN si.institute_name
    WHEN up.user_type = 'privato' THEN pu.first_name || ' ' || pu.last_name
  END as "Nome",
  TO_CHAR(au.created_at, 'DD/MM/YYYY HH24:MI') as "Data Registrazione",
  TO_CHAR(au.last_sign_in_at, 'DD/MM/YYYY HH24:MI') as "Ultimo Accesso",
  CASE WHEN au.email_confirmed_at IS NOT NULL THEN 'Si' ELSE 'No' END as "Email Verificata",
  CASE WHEN up.profile_completed THEN 'Si' ELSE 'No' END as "Profilo Completo"
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
LEFT JOIN school_institutes si ON au.id = si.id AND up.user_type = 'istituto'
LEFT JOIN private_users pu ON au.id = pu.id AND up.user_type = 'privato'
ORDER BY au.created_at DESC;
