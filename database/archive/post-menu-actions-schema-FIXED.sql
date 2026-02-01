-- ===================================================================
-- SCHEMA DATABASE PER AZIONI MENU POST - FIXED
-- Tabelle per gestire: salvataggio, mute, nascondimento
-- (content_reports già esistente)
-- ===================================================================

-- ===================================================================
-- TABELLA: saved_posts
-- Salvataggio post nei preferiti
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.institute_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint: un utente può salvare un post una sola volta
  CONSTRAINT saved_posts_unique_user_post UNIQUE (user_id, post_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON public.saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_post_id ON public.saved_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_created_at ON public.saved_posts(created_at DESC);

-- Commento tabella
COMMENT ON TABLE public.saved_posts IS 'Post salvati dagli utenti nei preferiti';

-- ===================================================================
-- TABELLA: muted_users
-- Silenziamento autori (non vedere più i loro post)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.muted_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint: non può mutare se stesso
  CONSTRAINT muted_users_not_self CHECK (user_id != muted_user_id),
  
  -- Constraint: un utente può mutare un altro utente una sola volta
  CONSTRAINT muted_users_unique_user_muted UNIQUE (user_id, muted_user_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_muted_users_user_id ON public.muted_users(user_id);
CREATE INDEX IF NOT EXISTS idx_muted_users_muted_user_id ON public.muted_users(muted_user_id);
CREATE INDEX IF NOT EXISTS idx_muted_users_created_at ON public.muted_users(created_at DESC);

-- Commento tabella
COMMENT ON TABLE public.muted_users IS 'Utenti silenziati da altri utenti';

-- ===================================================================
-- TABELLA: hidden_posts
-- Post nascosti dall'utente
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.hidden_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.institute_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint: un utente può nascondere un post una sola volta
  CONSTRAINT hidden_posts_unique_user_post UNIQUE (user_id, post_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_hidden_posts_user_id ON public.hidden_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_hidden_posts_post_id ON public.hidden_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_hidden_posts_created_at ON public.hidden_posts(created_at DESC);

-- Commento tabella
COMMENT ON TABLE public.hidden_posts IS 'Post nascosti dagli utenti';

-- ===================================================================
-- NOTA: content_reports ESISTE GIÀ
-- Struttura esistente:
--   - reported_content_type (invece di content_type)
--   - reported_content_id (invece di content_id)
--   - moderator_notes (invece di resolution_notes)
-- ===================================================================

-- Aggiungi indici mancanti per content_reports se non esistono
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON public.content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_content_type_id ON public.content_reports(reported_content_type, reported_content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON public.content_reports(created_at DESC);

-- ===================================================================
-- ROW LEVEL SECURITY (RLS)
-- ===================================================================

-- Abilita RLS sulle nuove tabelle
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_posts ENABLE ROW LEVEL SECURITY;

-- content_reports dovrebbe già avere RLS abilitato

-- ===================================================================
-- POLICY: saved_posts
-- ===================================================================

-- Drop policies esistenti se presenti
DROP POLICY IF EXISTS "saved_posts_select_own" ON public.saved_posts;
DROP POLICY IF EXISTS "saved_posts_insert_own" ON public.saved_posts;
DROP POLICY IF EXISTS "saved_posts_delete_own" ON public.saved_posts;

-- Gli utenti possono vedere solo i propri post salvati
CREATE POLICY "saved_posts_select_own"
  ON public.saved_posts
  FOR SELECT
  USING (user_id = (select auth.uid()));

-- Gli utenti possono inserire solo i propri salvataggi
CREATE POLICY "saved_posts_insert_own"
  ON public.saved_posts
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- Gli utenti possono eliminare solo i propri salvataggi
CREATE POLICY "saved_posts_delete_own"
  ON public.saved_posts
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ===================================================================
-- POLICY: muted_users
-- ===================================================================

-- Drop policies esistenti se presenti
DROP POLICY IF EXISTS "muted_users_select_own" ON public.muted_users;
DROP POLICY IF EXISTS "muted_users_insert_own" ON public.muted_users;
DROP POLICY IF EXISTS "muted_users_delete_own" ON public.muted_users;

-- Gli utenti possono vedere solo i propri mute
CREATE POLICY "muted_users_select_own"
  ON public.muted_users
  FOR SELECT
  USING (user_id = (select auth.uid()));

-- Gli utenti possono inserire solo i propri mute
CREATE POLICY "muted_users_insert_own"
  ON public.muted_users
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- Gli utenti possono eliminare solo i propri mute
CREATE POLICY "muted_users_delete_own"
  ON public.muted_users
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ===================================================================
-- POLICY: hidden_posts
-- ===================================================================

-- Drop policies esistenti se presenti
DROP POLICY IF EXISTS "hidden_posts_select_own" ON public.hidden_posts;
DROP POLICY IF EXISTS "hidden_posts_insert_own" ON public.hidden_posts;
DROP POLICY IF EXISTS "hidden_posts_delete_own" ON public.hidden_posts;

-- Gli utenti possono vedere solo i propri post nascosti
CREATE POLICY "hidden_posts_select_own"
  ON public.hidden_posts
  FOR SELECT
  USING (user_id = (select auth.uid()));

-- Gli utenti possono inserire solo i propri nascondimenti
CREATE POLICY "hidden_posts_insert_own"
  ON public.hidden_posts
  FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

-- Gli utenti possono eliminare solo i propri nascondimenti
CREATE POLICY "hidden_posts_delete_own"
  ON public.hidden_posts
  FOR DELETE
  USING (user_id = (select auth.uid()));

-- ===================================================================
-- STATISTICHE UTILI
-- ===================================================================

-- Funzione per contare i post salvati di un utente
CREATE OR REPLACE FUNCTION public.count_saved_posts(user_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM public.saved_posts WHERE user_id = user_uuid;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Funzione per verificare se un post è salvato
CREATE OR REPLACE FUNCTION public.is_post_saved(post_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.saved_posts 
    WHERE post_id = post_uuid AND user_id = user_uuid
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Funzione per verificare se un utente è mutato
CREATE OR REPLACE FUNCTION public.is_user_muted(muted_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.muted_users 
    WHERE muted_user_id = muted_uuid AND user_id = user_uuid
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Funzione per verificare se un post è nascosto
CREATE OR REPLACE FUNCTION public.is_post_hidden(post_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.hidden_posts 
    WHERE post_id = post_uuid AND user_id = user_uuid
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ===================================================================
-- GRANT PERMISSIONS
-- ===================================================================

-- Grant permissions alle tabelle per authenticated users
GRANT SELECT, INSERT, DELETE ON public.saved_posts TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.muted_users TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.hidden_posts TO authenticated;

-- Grant permissions alle funzioni
GRANT EXECUTE ON FUNCTION public.count_saved_posts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_post_saved(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_muted(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_post_hidden(UUID, UUID) TO authenticated;

-- ===================================================================
-- FINE SCHEMA
-- ===================================================================

-- Verifica creazione tabelle
DO $$
BEGIN
  RAISE NOTICE '✅ Schema post-menu-actions creato con successo!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tabelle create:';
  RAISE NOTICE '  - saved_posts (post salvati)';
  RAISE NOTICE '  - muted_users (utenti silenziati)';
  RAISE NOTICE '  - hidden_posts (post nascosti)';
  RAISE NOTICE '  - content_reports (già esistente, indici aggiunti)';
  RAISE NOTICE '';
  RAISE NOTICE 'Funzioni utility create:';
  RAISE NOTICE '  - count_saved_posts(user_uuid)';
  RAISE NOTICE '  - is_post_saved(post_uuid, user_uuid)';
  RAISE NOTICE '  - is_user_muted(muted_uuid, user_uuid)';
  RAISE NOTICE '  - is_post_hidden(post_uuid, user_uuid)';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS policies configurate per tutte le tabelle';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NOTA: content_reports usa "reported_content_type" e "reported_content_id"';
  RAISE NOTICE '   Verifica che il codice JavaScript usi i nomi corretti!';
END $$;
