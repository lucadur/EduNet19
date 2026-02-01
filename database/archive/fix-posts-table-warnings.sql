-- ===================================================================
-- FIX SUPABASE WARNINGS - Posts Table
-- Risolve auth_rls_initplan e multiple_permissive_policies
-- ===================================================================

-- ===================================================================
-- 1. DROP POLICY DUPLICATE
-- ===================================================================

-- Drop vecchie policy con nomi italiani lunghi (da supabase-setup-corrected.sql)
DROP POLICY IF EXISTS "Posts sono visibili a tutti gli utenti autenticati" ON public.posts;
DROP POLICY IF EXISTS "Gli utenti possono creare i propri post" ON public.posts;
DROP POLICY IF EXISTS "Gli utenti possono modificare i propri post" ON public.posts;
DROP POLICY IF EXISTS "Gli utenti possono eliminare i propri post" ON public.posts;

DROP POLICY IF EXISTS "I likes sono visibili a tutti" ON public.post_likes;
DROP POLICY IF EXISTS "Gli utenti possono gestire i propri likes" ON public.post_likes;

DROP POLICY IF EXISTS "I commenti sono visibili a tutti" ON public.post_comments;
DROP POLICY IF EXISTS "Gli utenti possono creare commenti" ON public.post_comments;
DROP POLICY IF EXISTS "Gli utenti possono modificare i propri commenti" ON public.post_comments;
DROP POLICY IF EXISTS "Gli utenti possono eliminare i propri commenti" ON public.post_comments;

DROP POLICY IF EXISTS "Le condivisioni sono visibili a tutti" ON public.post_shares;
DROP POLICY IF EXISTS "Gli utenti possono registrare le proprie condivisioni" ON public.post_shares;

DROP POLICY IF EXISTS "Gli utenti vedono solo le proprie attività" ON public.user_activities;
DROP POLICY IF EXISTS "Il sistema può registrare attività per gli utenti" ON public.user_activities;

-- ===================================================================
-- 2. DROP ANCHE LE POLICY OTTIMIZZATE (per sicurezza)
-- ===================================================================

DROP POLICY IF EXISTS "Posts visibili a utenti autenticati" ON public.posts;
DROP POLICY IF EXISTS "Utenti creano propri post" ON public.posts;
DROP POLICY IF EXISTS "Utenti modificano propri post" ON public.posts;
DROP POLICY IF EXISTS "Utenti eliminano propri post" ON public.posts;

DROP POLICY IF EXISTS "Likes visibili a tutti" ON public.post_likes;
DROP POLICY IF EXISTS "Utenti creano likes" ON public.post_likes;
DROP POLICY IF EXISTS "Utenti eliminano propri likes" ON public.post_likes;

DROP POLICY IF EXISTS "Commenti visibili a tutti autenticati" ON public.post_comments;
DROP POLICY IF EXISTS "Utenti creano commenti" ON public.post_comments;
DROP POLICY IF EXISTS "Utenti modificano propri commenti" ON public.post_comments;
DROP POLICY IF EXISTS "Utenti eliminano propri commenti" ON public.post_comments;

DROP POLICY IF EXISTS "Condivisioni visibili a tutti" ON public.post_shares;
DROP POLICY IF EXISTS "Utenti registrano proprie condivisioni" ON public.post_shares;

DROP POLICY IF EXISTS "Utenti vedono proprie attività" ON public.user_activities;
DROP POLICY IF EXISTS "Sistema registra attività" ON public.user_activities;

-- ===================================================================
-- 3. CREA POLICY OTTIMIZZATE (con select auth.uid())
-- ===================================================================

-- Posts
CREATE POLICY "Posts visibili a utenti autenticati"
  ON public.posts FOR SELECT
  USING ((select auth.role()) = 'authenticated' AND is_published = true);

CREATE POLICY "Utenti creano propri post"
  ON public.posts FOR INSERT
  WITH CHECK ((select auth.uid()) = author_id);

CREATE POLICY "Utenti modificano propri post"
  ON public.posts FOR UPDATE
  USING ((select auth.uid()) = author_id);

CREATE POLICY "Utenti eliminano propri post"
  ON public.posts FOR DELETE
  USING ((select auth.uid()) = author_id);

-- Post Likes
CREATE POLICY "Likes visibili a tutti"
  ON public.post_likes FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Utenti creano likes"
  ON public.post_likes FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Utenti eliminano propri likes"
  ON public.post_likes FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Post Comments
CREATE POLICY "Commenti visibili a tutti autenticati"
  ON public.post_comments FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Utenti creano commenti"
  ON public.post_comments FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Utenti modificano propri commenti"
  ON public.post_comments FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Utenti eliminano propri commenti"
  ON public.post_comments FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Post Shares
CREATE POLICY "Condivisioni visibili a tutti"
  ON public.post_shares FOR SELECT
  USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Utenti registrano proprie condivisioni"
  ON public.post_shares FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- User Activities
CREATE POLICY "Utenti vedono proprie attività"
  ON public.user_activities FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Sistema registra attività"
  ON public.user_activities FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- ===================================================================
-- 4. FIX DUPLICATE INDEX
-- ===================================================================

DROP INDEX IF EXISTS public.idx_content_reports_reporter;

-- ===================================================================
-- FINE
-- ===================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Policy ottimizzate e duplicate rimosse!';
  RAISE NOTICE '✅ Indici duplicati rimossi!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NOTA: La tabella "posts" NON È USATA dal frontend.';
  RAISE NOTICE '   Il frontend usa "institute_posts".';
  RAISE NOTICE '   Puoi eliminare la tabella "posts" se vuoi:';
  RAISE NOTICE '   DROP TABLE IF EXISTS public.posts CASCADE;';
END $$;
