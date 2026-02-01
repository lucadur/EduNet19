-- ===================================================================
-- CREA TABELLA USER_CONNECTIONS
-- Tabella per gestire le connessioni tra utenti (follow/following)
-- ===================================================================

-- Drop table if exists (per ricreazione pulita)
DROP TABLE IF EXISTS user_connections CASCADE;

-- Crea tabella user_connections
CREATE TABLE user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint per evitare duplicati
  UNIQUE(follower_id, followed_id),
  
  -- Constraint per evitare auto-follow
  CHECK (follower_id != followed_id)
);

-- Indici per performance
CREATE INDEX idx_user_connections_follower ON user_connections(follower_id);
CREATE INDEX idx_user_connections_followed ON user_connections(followed_id);
CREATE INDEX idx_user_connections_status ON user_connections(status);
CREATE INDEX idx_user_connections_follower_status ON user_connections(follower_id, status);
CREATE INDEX idx_user_connections_followed_status ON user_connections(followed_id, status);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_user_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_connections_updated_at
  BEFORE UPDATE ON user_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_user_connections_updated_at();

-- ===================================================================
-- RLS POLICIES
-- ===================================================================

-- Enable RLS
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere le proprie connessioni
CREATE POLICY "Users can view their own connections"
  ON user_connections
  FOR SELECT
  USING (
    auth.uid() = follower_id 
    OR auth.uid() = followed_id
  );

-- Policy: Gli utenti possono creare connessioni (follow)
CREATE POLICY "Users can create connections"
  ON user_connections
  FOR INSERT
  WITH CHECK (
    auth.uid() = follower_id
  );

-- Policy: Gli utenti possono aggiornare le proprie connessioni
CREATE POLICY "Users can update their own connections"
  ON user_connections
  FOR UPDATE
  USING (
    auth.uid() = follower_id 
    OR auth.uid() = followed_id
  )
  WITH CHECK (
    auth.uid() = follower_id 
    OR auth.uid() = followed_id
  );

-- Policy: Gli utenti possono eliminare le proprie connessioni (unfollow)
CREATE POLICY "Users can delete their own connections"
  ON user_connections
  FOR DELETE
  USING (
    auth.uid() = follower_id
  );

-- Policy: Tutti possono vedere le connessioni pubbliche (per conteggi follower/following)
CREATE POLICY "Public can view accepted connections"
  ON user_connections
  FOR SELECT
  USING (status = 'accepted');

-- ===================================================================
-- FUNZIONI HELPER
-- ===================================================================

-- Funzione per seguire un utente
CREATE OR REPLACE FUNCTION follow_user(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  existing_connection user_connections;
BEGIN
  -- Verifica che non sia auto-follow
  IF auth.uid() = target_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot follow yourself'
    );
  END IF;
  
  -- Verifica se esiste già una connessione
  SELECT * INTO existing_connection
  FROM user_connections
  WHERE follower_id = auth.uid()
    AND followed_id = target_user_id;
  
  IF existing_connection IS NOT NULL THEN
    -- Se esiste, aggiorna lo status
    UPDATE user_connections
    SET status = 'accepted',
        updated_at = NOW()
    WHERE follower_id = auth.uid()
      AND followed_id = target_user_id;
    
    RETURN json_build_object(
      'success', true,
      'action', 'updated',
      'connection_id', existing_connection.id
    );
  ELSE
    -- Crea nuova connessione
    INSERT INTO user_connections (follower_id, followed_id, status)
    VALUES (auth.uid(), target_user_id, 'accepted')
    RETURNING json_build_object(
      'success', true,
      'action', 'created',
      'connection_id', id
    ) INTO result;
    
    RETURN result;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per smettere di seguire un utente
CREATE OR REPLACE FUNCTION unfollow_user(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_connections
  WHERE follower_id = auth.uid()
    AND followed_id = target_user_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', deleted_count > 0,
    'deleted_count', deleted_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per ottenere conteggio follower
CREATE OR REPLACE FUNCTION get_follower_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM user_connections
    WHERE followed_id = target_user_id
      AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per ottenere conteggio following
CREATE OR REPLACE FUNCTION get_following_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM user_connections
    WHERE follower_id = target_user_id
      AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per verificare se un utente segue un altro
CREATE OR REPLACE FUNCTION is_following(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_connections
    WHERE follower_id = auth.uid()
      AND followed_id = target_user_id
      AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- GRANT PERMISSIONS
-- ===================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION follow_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unfollow_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_follower_count(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_following_count(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_following(UUID) TO authenticated;

-- ===================================================================
-- COMMENTI
-- ===================================================================

COMMENT ON TABLE user_connections IS 'Tabella per gestire le connessioni tra utenti (follow/following)';
COMMENT ON COLUMN user_connections.follower_id IS 'ID dell''utente che segue';
COMMENT ON COLUMN user_connections.followed_id IS 'ID dell''utente seguito';
COMMENT ON COLUMN user_connections.status IS 'Stato della connessione: pending, accepted, rejected, blocked';

-- ===================================================================
-- VERIFICA
-- ===================================================================

-- Verifica che la tabella sia stata creata
SELECT 
  'user_connections' as table_name,
  COUNT(*) as row_count
FROM user_connections;

-- Verifica policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_connections'
ORDER BY policyname;

-- Verifica funzioni
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name IN (
  'follow_user',
  'unfollow_user',
  'get_follower_count',
  'get_following_count',
  'is_following'
)
ORDER BY routine_name;

-- ===================================================================
-- FINE SCRIPT
-- ===================================================================
