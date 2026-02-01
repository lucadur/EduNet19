-- ===================================================================
-- FIX ULTIMI WARNING SUPABASE
-- Risolve Multiple Permissive Policies e Duplicate Indexes
-- ===================================================================

BEGIN;

-- ===================================================================
-- 1. RISOLVI MULTIPLE PERMISSIVE POLICIES SU POST_LIKES
-- ===================================================================

-- Drop TUTTE le policy esistenti su post_likes
DROP POLICY IF EXISTS "Tutti possono vedere likes" ON public.post_likes;
DROP POLICY IF EXISTS "Tutti vedono likes" ON public.post_likes;
DROP POLICY IF EXISTS "Utenti autenticati gestiscono propri likes" ON public.post_likes;
DROP POLICY IF EXISTS "Utenti gestiscono propri likes" ON public.post_likes;
DROP POLICY IF EXISTS "I likes sono visibili a tutti" ON public.post_likes;
DROP POLICY IF EXISTS "Gli utenti possono gestire i propri likes" ON public.post_likes;

-- Crea SOLO 1 policy per SELECT (risolve multiple permissive)
CREATE POLICY "Likes visibili a tutti" 
  ON public.post_likes 
  FOR SELECT
  USING (true); -- Tutti (anche anonimi) possono vedere i likes

-- Policy separata SOLO per INSERT
CREATE POLICY "Utenti creano likes" 
  ON public.post_likes 
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- Policy separata SOLO per DELETE  
CREATE POLICY "Utenti eliminano propri likes" 
  ON public.post_likes 
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ===================================================================
-- 2. RIMUOVI INDICI DUPLICATI
-- ===================================================================

-- 2.1 post_comments - Drop idx_post_comments_user (mantieni idx_post_comments_user_id)
DROP INDEX IF EXISTS public.idx_post_comments_user;

-- 2.2 post_likes - Drop idx_post_likes_user (mantieni idx_post_likes_user_id)
DROP INDEX IF EXISTS public.idx_post_likes_user;

-- 2.3 post_shares - Drop idx_post_shares_user (mantieni idx_post_shares_user_id)
DROP INDEX IF EXISTS public.idx_post_shares_user;

-- 2.4 posts - Drop idx_posts_author (mantieni idx_posts_author_id)
DROP INDEX IF EXISTS public.idx_posts_author;

-- 2.5 user_activities - Drop idx_user_activities_user (mantieni idx_user_activities_user_id)
DROP INDEX IF EXISTS public.idx_user_activities_user;

-- ===================================================================
-- 3. AGGIUNGI INDICI MANCANTI PER FOREIGN KEYS
-- ===================================================================

-- 3.1 match_feedback.target_profile_id (foreign key non indicizzata)
CREATE INDEX IF NOT EXISTS idx_match_feedback_target_profile 
  ON public.match_feedback(target_profile_id);

-- 3.2 match_profiles.user_id (foreign key non indicizzata)
CREATE INDEX IF NOT EXISTS idx_match_profiles_user 
  ON public.match_profiles(user_id);

COMMIT;

-- ===================================================================
-- VERIFICA
-- ===================================================================

-- Verifica policy su post_likes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'post_likes'
ORDER BY policyname;

-- Verifica indici rimasti (no duplicati)
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('post_comments', 'post_likes', 'post_shares', 'posts', 'user_activities')
ORDER BY tablename, indexname;

-- ===================================================================
-- RIEPILOGO
-- ===================================================================

/*
✅ WARNING RISOLTI:

1. Multiple Permissive Policies (4 warning) ✅
   - Rimosse TUTTE le policy duplicate su post_likes
   - Creata 1 SOLA policy per SELECT: "Likes visibili a tutti"
   - Policy separate per INSERT e DELETE
   - Ora ogni ruolo (anon, authenticated, authenticator, dashboard_user) 
     esegue 1 SOLA policy per SELECT invece di 2!

2. Duplicate Index (5 warning) ✅
   - Rimosso idx_post_comments_user (mantiene idx_post_comments_user_id)
   - Rimosso idx_post_likes_user (mantiene idx_post_likes_user_id)
   - Rimosso idx_post_shares_user (mantiene idx_post_shares_user_id)
   - Rimosso idx_posts_author (mantiene idx_posts_author_id)
   - Rimosso idx_user_activities_user (mantiene idx_user_activities_user_id)

3. Unindexed Foreign Keys (2 suggestions) ✅
   - Aggiunto idx_match_feedback_target_profile
   - Aggiunto idx_match_profiles_user

TOTALE: 9 warning + 2 suggestions = 11 problemi risolti! ✨

📝 NOTA SUGLI "UNUSED INDEX" (46 suggestions):
Gli indici non usati sono NORMALI in fase di sviluppo/testing!
Questi indici SARANNO utilizzati quando:
- L'app sarà in produzione con utenti reali
- Ci saranno migliaia di record nelle tabelle
- Le query RLS useranno questi indici per performance

❌ NON eliminare indici strategici come:
- Indici su foreign keys (user_id, post_id, ecc.)
- Indici per RLS policies (author_id, follower_id, ecc.)
- Indici per ricerche full-text (idx_*_search)
- Indici composite (idx_*_type_active, ecc.)

✅ Questi indici sono ESSENZIALI per le performance a scala!
*/
