-- 🗑️ ELIMINA ACCOUNT COMPLETO
-- Script per eliminare completamente un account utente
-- ATTENZIONE: Questa operazione è IRREVERSIBILE!

-- ⚠️ SOSTITUISCI 'USER_ID_QUI' con l'ID utente effettivo

-- 1. Elimina post e contenuti
DELETE FROM institute_posts WHERE institute_id = 'USER_ID_QUI';
DELETE FROM post_likes WHERE user_id = 'USER_ID_QUI';
DELETE FROM post_comments WHERE user_id = 'USER_ID_QUI';
DELETE FROM saved_posts WHERE user_id = 'USER_ID_QUI';

-- 2. Elimina relazioni sociali
DELETE FROM user_follows WHERE follower_id = 'USER_ID_QUI' OR following_id = 'USER_ID_QUI';
DELETE FROM user_connections WHERE user_id = 'USER_ID_QUI' OR connected_user_id = 'USER_ID_QUI';

-- 3. Elimina profili
DELETE FROM school_institutes WHERE id = 'USER_ID_QUI';
DELETE FROM private_users WHERE id = 'USER_ID_QUI';
DELETE FROM user_profiles WHERE id = 'USER_ID_QUI';

-- 4. Elimina da auth.users (SOLO ADMIN)
-- NOTA: Questo può essere fatto solo da admin o tramite Dashboard Supabase
-- DELETE FROM auth.users WHERE id = 'USER_ID_QUI';

-- Verifica eliminazione
SELECT 'Verifica eliminazione completata' as status;

SELECT 
  (SELECT COUNT(*) FROM institute_posts WHERE institute_id = 'USER_ID_QUI') as posts_rimasti,
  (SELECT COUNT(*) FROM school_institutes WHERE id = 'USER_ID_QUI') as profilo_istituto,
  (SELECT COUNT(*) FROM private_users WHERE id = 'USER_ID_QUI') as profilo_privato,
  (SELECT COUNT(*) FROM user_profiles WHERE id = 'USER_ID_QUI') as user_profile;

-- Se tutti i conteggi sono 0, l'eliminazione è completa
