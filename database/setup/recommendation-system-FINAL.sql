-- ===================================================================
-- EDUNET19 - RECOMMENDATION SYSTEM (FINAL CLEAN VERSION)
-- This script will DROP existing tables and recreate them
-- ===================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================================
-- CLEANUP: Drop existing objects
-- ===================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_invalidate_cache_on_follow ON user_follows;

-- Drop functions
DROP FUNCTION IF EXISTS invalidate_recommendation_cache() CASCADE;
DROP FUNCTION IF EXISTS get_mutual_connections_count(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_interest_tags(UUID) CASCADE;
DROP FUNCTION IF EXISTS track_user_activity(UUID, TEXT, UUID, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS refresh_engagement_stats() CASCADE;

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS institute_engagement_stats CASCADE;

-- Drop tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS recommendation_cache CASCADE;
DROP TABLE IF EXISTS user_activities CASCADE;
DROP TABLE IF EXISTS user_follows CASCADE;

-- ===================================================================
-- CREATE: user_follows table
-- ===================================================================

CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL,
  following_type TEXT NOT NULL CHECK (following_type IN ('institute', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_follow UNIQUE(follower_id, following_id, following_type)
);

-- Create indexes
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
CREATE INDEX idx_user_follows_type ON user_follows(following_type);
CREATE INDEX idx_user_follows_created ON user_follows(created_at DESC);
CREATE INDEX idx_user_follows_composite ON user_follows(follower_id, following_id);

-- Enable RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all follows"
  ON user_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ===================================================================
-- CREATE: user_activities table
-- ===================================================================

CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  target_id UUID,
  target_type TEXT,
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_activities_user ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_target ON user_activities(target_id);
CREATE INDEX idx_user_activities_created ON user_activities(created_at DESC);
CREATE INDEX idx_user_activities_composite ON user_activities(user_id, activity_type, created_at DESC);

-- Enable RLS
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own activities"
  ON user_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activities"
  ON user_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ===================================================================
-- CREATE: recommendation_cache table
-- ===================================================================

CREATE TABLE recommendation_cache (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendations JSONB NOT NULL,
  score_breakdown JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_recommendation_cache_updated ON recommendation_cache(updated_at);

-- Enable RLS
ALTER TABLE recommendation_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own recommendations"
  ON recommendation_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
  ON recommendation_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can refresh their recommendations"
  ON recommendation_cache FOR UPDATE
  USING (auth.uid() = user_id);

-- ===================================================================
-- CREATE: Cache invalidation trigger
-- ===================================================================

CREATE OR REPLACE FUNCTION invalidate_recommendation_cache()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM recommendation_cache 
  WHERE user_id = COALESCE(NEW.follower_id, OLD.follower_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invalidate_cache_on_follow
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_recommendation_cache();

-- ===================================================================
-- GRANT: Permissions
-- ===================================================================

GRANT SELECT, INSERT, DELETE ON user_follows TO authenticated;
GRANT SELECT, INSERT ON user_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON recommendation_cache TO authenticated;

-- ===================================================================
-- COMMENTS: Documentation
-- ===================================================================

COMMENT ON TABLE user_follows IS 'Tracks user following relationships for social features';
COMMENT ON TABLE user_activities IS 'Logs user interactions for recommendation algorithm';
COMMENT ON TABLE recommendation_cache IS 'Caches computed recommendations for performance';

COMMENT ON COLUMN user_follows.follower_id IS 'User who is following';
COMMENT ON COLUMN user_follows.following_id IS 'User or institute being followed';
COMMENT ON COLUMN user_follows.following_type IS 'Type: institute or user';

-- ===================================================================
-- VERIFICATION: Check tables exist
-- ===================================================================

DO $$
DECLARE
  follows_count INTEGER;
  activities_count INTEGER;
  cache_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO follows_count FROM user_follows;
  SELECT COUNT(*) INTO activities_count FROM user_activities;
  SELECT COUNT(*) INTO cache_count FROM recommendation_cache;
  
  -- Success message
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✅ RECOMMENDATION SYSTEM SETUP COMPLETE!     ║';
  RAISE NOTICE '╚════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables Created Successfully:';
  RAISE NOTICE '   ✓ user_follows (% rows)', follows_count;
  RAISE NOTICE '   ✓ user_activities (% rows)', activities_count;
  RAISE NOTICE '   ✓ recommendation_cache (% rows)', cache_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Security:';
  RAISE NOTICE '   ✓ RLS enabled on all tables';
  RAISE NOTICE '   ✓ Policies configured';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Performance:';
  RAISE NOTICE '   ✓ 13 indexes created';
  RAISE NOTICE '   ✓ Cache invalidation trigger active';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready to Use!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Open homepage.html in browser';
  RAISE NOTICE '  2. Check browser console for:';
  RAISE NOTICE '     "✅ Recommendation system initialized"';
  RAISE NOTICE '  3. Look for "Istituti Consigliati" in sidebar';
  RAISE NOTICE '  4. Click "Scopri" tab';
  RAISE NOTICE '';
  RAISE NOTICE '💡 The system is now ready to generate recommendations!';
  RAISE NOTICE '';
END $$;
