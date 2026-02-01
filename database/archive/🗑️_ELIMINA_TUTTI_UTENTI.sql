-- ===================================================================
-- ELIMINA TUTTI GLI UTENTI (ATTENZIONE: OPERAZIONE IRREVERSIBILE!)
-- ===================================================================

-- ATTENZIONE: Questo eliminerà TUTTI gli utenti e i loro dati
-- Usa con cautela!

-- STEP 1: Elimina tutti i dati correlati agli utenti
-- ===================================================

-- Elimina admin e inviti
DELETE FROM institute_admins;
DELETE FROM institute_admin_invites;

-- Elimina profili
DELETE FROM private_users;
DELETE FROM school_institutes;
DELETE FROM user_profiles;

-- STEP 2: Elimina utenti da auth.users
-- =====================================
-- NOTA: Questo richiede privilegi su auth schema
-- Se non funziona, elimina manualmente dal Dashboard

DELETE FROM auth.users;

SELECT '✅ TUTTI GLI UTENTI ELIMINATI!' as status,
       'Ora puoi registrare nuovi account con le stesse email' as message;

-- ===================================================================
-- ALTERNATIVA: Elimina solo utenti di test (non quello principale)
-- ===================================================================

-- Se vuoi mantenere il tuo account principale, usa questo invece:
/*
DELETE FROM auth.users 
WHERE email NOT IN ('tua-email-principale@example.com');

DELETE FROM user_profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

DELETE FROM private_users 
WHERE id NOT IN (SELECT id FROM auth.users);

DELETE FROM school_institutes 
WHERE id NOT IN (SELECT id FROM auth.users);
*/
