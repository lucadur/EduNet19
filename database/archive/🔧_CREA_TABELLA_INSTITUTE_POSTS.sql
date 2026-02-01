-- =====================================================
-- CREA TABELLA INSTITUTE_POSTS
-- Sistema pubblicazione contenuti per istituti
-- =====================================================

-- 1. Crea la tabella institute_posts
CREATE TABLE IF NOT EXISTS institute_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  post_type VARCHAR(50) NOT NULL DEFAULT 'post',
  category VARCHAR(100),
  tags TEXT[],
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  target_audience TEXT[],
  subject_areas TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0),
  CONSTRAINT valid_post_type CHECK (post_type IN ('post', 'methodology', 'project', 'event', 'news'))
);

-- 2. Crea indici per performance
CREATE INDEX IF NOT EXISTS idx_institute_posts_institute_id ON institute_posts(institute_id);
CREATE INDEX IF NOT EXISTS idx_institute_posts_post_type ON institute_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_institute_posts_category ON institute_posts(category);
CREATE INDEX IF NOT EXISTS idx_institute_posts_published ON institute_posts(published);
CREATE INDEX IF NOT EXISTS idx_institute_posts_published_at ON institute_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_institute_posts_created_at ON institute_posts(created_at DESC);

-- 3. Abilita RLS
ALTER TABLE institute_posts ENABLE ROW LEVEL SECURITY;

-- 4. Elimina policy vecchie se esistono
DROP POLICY IF EXISTS "Anyone can view published posts" ON institute_posts;
DROP POLICY IF EXISTS "Institutes can manage own posts" ON institute_posts;
DROP POLICY IF EXISTS "Public can view published posts" ON institute_posts;
DROP POLICY IF EXISTS "Authenticated institutes can insert" ON institute_posts;
DROP POLICY IF EXISTS "Institutes can update own posts" ON institute_posts;
DROP POLICY IF EXISTS "Institutes can delete own posts" ON institute_posts;
DROP POLICY IF EXISTS "institute_posts_public_select" ON institute_posts;
DROP POLICY IF EXISTS "institute_posts_authenticated_insert" ON institute_posts;
DROP POLICY IF EXISTS "institute_posts_authenticated_update" ON institute_posts;
DROP POLICY IF EXISTS "institute_posts_authenticated_delete" ON institute_posts;
DROP POLICY IF EXISTS "institute_posts_owner_select_all" ON institute_posts;

-- 5. Crea policy RLS
-- Tutti possono vedere i post pubblicati
CREATE POLICY "institute_posts_public_select"
ON institute_posts FOR SELECT
TO public
USING (published = true);

-- Solo istituti autenticati possono inserire i propri post
CREATE POLICY "institute_posts_authenticated_insert"
ON institute_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = institute_id);

-- Solo l'istituto proprietario può aggiornare i propri post
CREATE POLICY "institute_posts_authenticated_update"
ON institute_posts FOR UPDATE
TO authenticated
USING (auth.uid() = institute_id)
WITH CHECK (auth.uid() = institute_id);

-- Solo l'istituto proprietario può eliminare i propri post
CREATE POLICY "institute_posts_authenticated_delete"
ON institute_posts FOR DELETE
TO authenticated
USING (auth.uid() = institute_id);

-- Gli istituti possono vedere i propri post (anche non pubblicati)
CREATE POLICY "institute_posts_owner_select_all"
ON institute_posts FOR SELECT
TO authenticated
USING (auth.uid() = institute_id);

-- 6. Trigger per published_at
CREATE OR REPLACE FUNCTION update_institute_posts_published_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Se il post viene pubblicato per la prima volta
  IF NEW.published = true AND (OLD.published = false OR OLD.published IS NULL) THEN
    NEW.published_at = NOW();
  -- Se il post viene depubblicato
  ELSIF NEW.published = false THEN
    NEW.published_at = NULL;
  END IF;
  
  -- Aggiorna sempre updated_at
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS institute_posts_published_at_trigger ON institute_posts;
CREATE TRIGGER institute_posts_published_at_trigger
  BEFORE UPDATE ON institute_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_institute_posts_published_at();

-- 7. Trigger per updated_at su INSERT
CREATE OR REPLACE FUNCTION update_institute_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Se è un INSERT e published è true, imposta published_at
  IF TG_OP = 'INSERT' AND NEW.published = true THEN
    NEW.published_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS institute_posts_updated_at_trigger ON institute_posts;
CREATE TRIGGER institute_posts_updated_at_trigger
  BEFORE INSERT OR UPDATE ON institute_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_institute_posts_updated_at();

-- 8. Funzioni helper
CREATE OR REPLACE FUNCTION get_institute_posts_count(institute_uuid UUID, post_type_filter VARCHAR DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
  IF post_type_filter IS NULL THEN
    RETURN (
      SELECT COUNT(*)::INTEGER
      FROM institute_posts
      WHERE institute_id = institute_uuid AND published = true
    );
  ELSE
    RETURN (
      SELECT COUNT(*)::INTEGER
      FROM institute_posts
      WHERE institute_id = institute_uuid 
        AND published = true 
        AND post_type = post_type_filter
    );
  END IF;
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
WHERE table_name = 'institute_posts'
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
WHERE tablename = 'institute_posts'
ORDER BY policyname;

-- Verifica indici
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'institute_posts'
ORDER BY indexname;
