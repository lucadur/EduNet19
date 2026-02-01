-- ===================================================================
-- SCHEMA DATABASE PER AZIONI MENU POST
-- Tabelle per gestire: salvataggio, mute, nascondimento, segnalazioni
-- ===================================================================

-- ===================================================================
-- TABELLA: saved_posts
-- Salvataggio post nei preferiti
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
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
-- TABELLA: content_reports (se non esiste già)
-- Segnalazioni di contenuti inappropriati
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('post', 'comment', 'profile', 'project')),
  content_id UUID NOT NULL,
  reason VARCHAR(100) NOT NULL CHECK (reason IN (
    'spam',
    'harassment',
    'inappropriate',
    'false_information',
    'violence',
    'hate_speech',
    'sexual_content',
    'user_report',
    'other'
  )),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolution_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON public.content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_content_type_id ON public.content_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON public.content_reports(created_at DESC);

-- Commento tabella
COMMENT ON TABLE public.content_reports IS 'Segnalazioni di contenuti inappropriati da parte degli utenti';

-- ===================================================================
-- ROW LEVEL SECURITY (RLS)
-- ===================================================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- POLICY: saved_posts
-- ===================================================================

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
-- POLICY: content_reports
-- ===================================================================

-- Gli utenti possono vedere solo le proprie segnalazioni
-- Gli admin possono vedere tutte le segnalazioni
CREATE POLICY "content_reports_select_own_or_admin"
  ON public.content_reports
  FOR SELECT
  USING (
    reporter_id = (select auth.uid())
    OR
    (select auth.uid()) IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Gli utenti possono inserire segnalazioni
CREATE POLICY "content_reports_insert_authenticated"
  ON public.content_reports
  FOR INSERT
  WITH CHECK (
    reporter_id = (select auth.uid())
    AND (select auth.uid()) IS NOT NULL
  );

-- Solo gli admin possono aggiornare lo stato delle segnalazioni
CREATE POLICY "content_reports_update_admin"
  ON public.content_reports
  FOR UPDATE
  USING (
    (select auth.uid()) IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    (select auth.uid()) IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ===================================================================
-- TRIGGER: auto-update updated_at per content_reports
-- ===================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER content_reports_updated_at
  BEFORE UPDATE ON public.content_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

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
GRANT SELECT, INSERT ON public.content_reports TO authenticated;

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
  RAISE NOTICE '  - content_reports (segnalazioni)';
  RAISE NOTICE '';
  RAISE NOTICE 'Funzioni utility create:';
  RAISE NOTICE '  - count_saved_posts(user_uuid)';
  RAISE NOTICE '  - is_post_saved(post_uuid, user_uuid)';
  RAISE NOTICE '  - is_user_muted(muted_uuid, user_uuid)';
  RAISE NOTICE '  - is_post_hidden(post_uuid, user_uuid)';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS policies configurate per tutte le tabelle';
END $$;
