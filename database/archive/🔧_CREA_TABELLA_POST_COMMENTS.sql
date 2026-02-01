-- =====================================================
-- CREA TABELLA POST_COMMENTS
-- Sistema commenti per i post
-- =====================================================

-- 1. Crea la tabella post_comments
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0)
);

-- 2. Crea indici per performance
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);

-- 3. Abilita RLS
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- 4. Elimina policy vecchie se esistono
DROP POLICY IF EXISTS "Anyone can view comments" ON post_comments;
DROP POLICY IF EXISTS "Authenticated users can add comments" ON post_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON post_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON post_comments;

-- 5. Crea policy RLS
-- Tutti possono vedere i commenti
CREATE POLICY "post_comments_public_select"
ON post_comments FOR SELECT
TO public
USING (true);

-- Solo utenti autenticati possono inserire commenti
CREATE POLICY "post_comments_authenticated_insert"
ON post_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Solo il proprietario può aggiornare il proprio commento
CREATE POLICY "post_comments_authenticated_update"
ON post_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Solo il proprietario può eliminare il proprio commento
CREATE POLICY "post_comments_authenticated_delete"
ON post_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6. Trigger per updated_at
CREATE OR REPLACE FUNCTION update_post_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS post_comments_updated_at ON post_comments;
CREATE TRIGGER post_comments_updated_at
  BEFORE UPDATE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_updated_at();

-- 7. Funzione per contare i commenti di un post
CREATE OR REPLACE FUNCTION get_post_comments_count(post_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM post_comments
    WHERE post_id = post_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICA
-- =====================================================
-- Verifica struttura tabella
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'post_comments'
ORDER BY ordinal_position;

-- Verifica policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'post_comments'
ORDER BY policyname;

-- Verifica indici
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'post_comments'
ORDER BY indexname;
