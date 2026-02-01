-- =====================================================
-- CREA/AGGIORNA TABELLA PROFILE_GALLERY
-- =====================================================

-- 1. Crea la tabella (se non esiste)
CREATE TABLE IF NOT EXISTS profile_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aggiungi colonne se mancano (per tabelle esistenti)
DO $$ 
BEGIN
  -- Aggiungi photo_url se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profile_gallery' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE profile_gallery ADD COLUMN photo_url TEXT NOT NULL DEFAULT '';
  END IF;

  -- Aggiungi caption se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profile_gallery' AND column_name = 'caption'
  ) THEN
    ALTER TABLE profile_gallery ADD COLUMN caption TEXT;
  END IF;

  -- Aggiungi created_at se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profile_gallery' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE profile_gallery ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Aggiungi updated_at se non esiste
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profile_gallery' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE profile_gallery ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 3. Crea indici per performance
CREATE INDEX IF NOT EXISTS idx_profile_gallery_user_id ON profile_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_gallery_created_at ON profile_gallery(created_at DESC);

-- 4. Abilita RLS
ALTER TABLE profile_gallery ENABLE ROW LEVEL SECURITY;

-- 5. Elimina policy vecchie
DROP POLICY IF EXISTS "Users can view own gallery" ON profile_gallery;
DROP POLICY IF EXISTS "Users can insert own photos" ON profile_gallery;
DROP POLICY IF EXISTS "Users can update own photos" ON profile_gallery;
DROP POLICY IF EXISTS "Users can delete own photos" ON profile_gallery;
DROP POLICY IF EXISTS "Public can view all galleries" ON profile_gallery;

-- 6. Crea policy RLS corrette
-- Tutti possono vedere tutte le gallery (pubblico)
CREATE POLICY "profile_gallery_public_select"
ON profile_gallery FOR SELECT
TO public
USING (true);

-- Solo utenti autenticati possono inserire nella propria gallery
CREATE POLICY "profile_gallery_authenticated_insert"
ON profile_gallery FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Solo il proprietario può aggiornare
CREATE POLICY "profile_gallery_authenticated_update"
ON profile_gallery FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Solo il proprietario può eliminare
CREATE POLICY "profile_gallery_authenticated_delete"
ON profile_gallery FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 7. Trigger per updated_at
CREATE OR REPLACE FUNCTION update_profile_gallery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profile_gallery_updated_at ON profile_gallery;
CREATE TRIGGER profile_gallery_updated_at
  BEFORE UPDATE ON profile_gallery
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_gallery_updated_at();

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
WHERE table_name = 'profile_gallery'
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
WHERE tablename = 'profile_gallery'
ORDER BY policyname;
