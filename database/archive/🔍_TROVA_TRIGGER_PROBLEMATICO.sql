-- ===================================================================
-- TROVA E RIMUOVI TRIGGER PROBLEMATICO
-- ===================================================================

-- 1. Lista tutti i trigger su user_profiles
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_profiles';

-- 2. Rimuovi il trigger auto_accept_admin_invite se esiste su user_profiles
DROP TRIGGER IF EXISTS auto_accept_admin_invite_trigger ON user_profiles;

-- 3. Il trigger dovrebbe essere su auth.users, non su user_profiles
-- Verifica se esiste già
SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'auto_accept_admin_invite_trigger';

-- 4. Se necessario, ricrea il trigger sulla tabella corretta (auth.users non è accessibile)
-- Quindi lo mettiamo su user_profiles ma con la logica corretta

SELECT '✅ Verifica trigger completata!' as status;
