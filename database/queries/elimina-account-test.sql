-- ===================================================================
-- ELIMINA ACCOUNT TEST - amilcare.ciconte@gmail.com
-- ===================================================================
-- Questo script elimina completamente un account di test per permettere
-- una nuova registrazione con la stessa email

-- IMPORTANTE: Esegui questo script nel SQL Editor di Supabase

-- ===================================================================
-- STEP 1: Trova l'ID dell'utente
-- ===================================================================

-- Prima verifica che l'utente esista
SELECT 
  au.id,
  au.email,
  au.created_at,
  up.user_type,
  CASE 
    WHEN up.user_type = 'istituto' THEN si.institute_name
    WHEN up.user_type = 'privato' THEN pu.first_name || ' ' || pu.last_name
  END as nome
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
LEFT JOIN school_institutes si ON au.id = si.id
LEFT JOIN private_users pu ON au.id = pu.id
WHERE au.email = 'amilcare.ciconte@gmail.com';

-- ===================================================================
-- STEP 2: Elimina tutti i dati associati (CASCADE)
-- ===================================================================

-- Elimina in ordine per rispettare le foreign key

-- 2.1: Elimina dati specifici istituto (se esiste)
DELETE FROM school_institutes 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'amilcare.ciconte@gmail.com'
);

-- 2.2: Elimina dati specifici utente privato (se esiste)
DELETE FROM private_users 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'amilcare.ciconte@gmail.com'
);

-- 2.3: Elimina profilo generico
DELETE FROM user_profiles 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'amilcare.ciconte@gmail.com'
);

-- 2.4: Elimina post (se esistono)
DELETE FROM institute_posts 
WHERE institute_id IN (
  SELECT id FROM auth.users WHERE email = 'amilcare.ciconte@gmail.com'
);

-- 2.5: Elimina commenti (se esistono)
DELETE FROM post_comments 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'amilcare.ciconte@gmail.com'
);

-- 2.6: Elimina valutazioni (se esistono)
DELETE FROM institute_ratings 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'amilcare.ciconte@gmail.com'
);

-- 2.7: Elimina connessioni (se esistono)
DELETE FROM user_connections 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'amilcare.ciconte@gmail.com'
)
OR connected_user_id IN (
  SELECT id FROM auth.users WHERE email = 'amilcare.ciconte@gmail.com'
);

-- 2.8: Elimina galleria foto (se esistono)
DELETE FROM profile_gallery 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'amilcare.ciconte@gmail.com'
);

-- ===================================================================
-- STEP 3: Elimina l'utente da auth.users
-- ===================================================================

-- ATTENZIONE: Questo richiede permessi admin!
-- Se non funziona, usa il Dashboard di Supabase → Authentication → Users

DELETE FROM auth.users 
WHERE email = 'amilcare.ciconte@gmail.com';

-- ===================================================================
-- STEP 4: Verifica eliminazione
-- ===================================================================

-- Dovrebbe restituire 0 righe
SELECT * FROM auth.users WHERE email = 'amilcare.ciconte@gmail.com';

-- ===================================================================
-- ALTERNATIVA: Se DELETE da auth.users non funziona
-- ===================================================================

-- Usa il Dashboard di Supabase:
-- 1. Vai su Authentication → Users
-- 2. Cerca: amilcare.ciconte@gmail.com
-- 3. Click sui tre puntini → Delete user
-- 4. Conferma eliminazione

-- Oppure usa l'Admin API:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users

-- ===================================================================
-- NOTE IMPORTANTI
-- ===================================================================

-- 1. L'eliminazione è PERMANENTE e NON reversibile
-- 2. Tutti i dati associati verranno eliminati
-- 3. Dopo l'eliminazione, l'email sarà disponibile per nuova registrazione
-- 4. Se ci sono foreign key constraints, potrebbero bloccare l'eliminazione
-- 5. In quel caso, elimina prima i dati dipendenti

-- ===================================================================
-- VERIFICA FINALE
-- ===================================================================

-- Controlla che non ci siano più tracce
SELECT 'auth.users' as tabella, COUNT(*) as count FROM auth.users WHERE email = 'amilcare.ciconte@gmail.com'
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'amilcare.ciconte@gmail.com')
UNION ALL
SELECT 'school_institutes', COUNT(*) FROM school_institutes WHERE id IN (SELECT id FROM auth.users WHERE email = 'amilcare.ciconte@gmail.com')
UNION ALL
SELECT 'private_users', COUNT(*) FROM private_users WHERE id IN (SELECT id FROM auth.users WHERE email = 'amilcare.ciconte@gmail.com');

-- Tutti i count dovrebbero essere 0

-- ===================================================================
-- SCRIPT RAPIDO (TUTTO IN UNO)
-- ===================================================================

-- Copia e incolla questo blocco per eliminazione rapida:

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Trova ID utente
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'amilcare.ciconte@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Elimina dati associati
    DELETE FROM profile_gallery WHERE user_id = v_user_id;
    DELETE FROM user_connections WHERE user_id = v_user_id OR connected_user_id = v_user_id;
    DELETE FROM institute_ratings WHERE user_id = v_user_id OR institute_id = v_user_id;
    DELETE FROM post_comments WHERE user_id = v_user_id;
    DELETE FROM institute_posts WHERE institute_id = v_user_id;
    DELETE FROM school_institutes WHERE id = v_user_id;
    DELETE FROM private_users WHERE id = v_user_id;
    DELETE FROM user_profiles WHERE id = v_user_id;
    
    -- Elimina utente (potrebbe richiedere permessi admin)
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RAISE NOTICE 'Utente % eliminato con successo', v_user_id;
  ELSE
    RAISE NOTICE 'Utente con email amilcare.ciconte@gmail.com non trovato';
  END IF;
END $$;
