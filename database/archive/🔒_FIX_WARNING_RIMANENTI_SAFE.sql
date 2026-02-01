-- ===================================================================
-- FIX DEFINITIVO: TUTTI I 52 PERFORMANCE WARNING RIMANENTI
-- Versione SAFE - Salta tabelle che non esistono
-- ===================================================================

-- ============================================
-- INSTITUTE_POSTS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'institute_posts') THEN
    DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON institute_posts;
    CREATE POLICY "Published posts are viewable by everyone"
      ON institute_posts FOR SELECT
      USING (published = true);
  END IF;
END $$;

-- ============================================
-- MUTED_USERS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'muted_users') THEN
    DROP POLICY IF EXISTS "Users can view own muted list" ON muted_users;
    DROP POLICY IF EXISTS "Users can mute others" ON muted_users;
    DROP POLICY IF EXISTS "Users can unmute" ON muted_users;
    
    CREATE POLICY "Users can view own muted list"
      ON muted_users FOR SELECT
      USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can mute others"
      ON muted_users FOR INSERT
      WITH CHECK (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can unmute"
      ON muted_users FOR DELETE
      USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- USER_NOTIFICATIONS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_notifications') THEN
    DROP POLICY IF EXISTS "Users can view own notifications" ON user_notifications;
    DROP POLICY IF EXISTS "Users can update own notifications" ON user_notifications;
    
    CREATE POLICY "Users can view own notifications"
      ON user_notifications FOR SELECT
      USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can update own notifications"
      ON user_notifications FOR UPDATE
      USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- USER_ACTIVITIES
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_activities') THEN
    DROP POLICY IF EXISTS "Users can view own activities" ON user_activities;
    DROP POLICY IF EXISTS "Users can create activities" ON user_activities;
    
    CREATE POLICY "Users can view own activities"
      ON user_activities FOR SELECT
      USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can create activities"
      ON user_activities FOR INSERT
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- PROFILE_GALLERY
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profile_gallery') THEN
    DROP POLICY IF EXISTS "Users can add to own gallery" ON profile_gallery;
    DROP POLICY IF EXISTS "Users can update own gallery" ON profile_gallery;
    DROP POLICY IF EXISTS "Users can delete from own gallery" ON profile_gallery;
    
    CREATE POLICY "Users can add to own gallery"
      ON profile_gallery FOR INSERT
      WITH CHECK (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can update own gallery"
      ON profile_gallery FOR UPDATE
      USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can delete from own gallery"
      ON profile_gallery FOR DELETE
      USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- HIDDEN_POSTS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'hidden_posts') THEN
    DROP POLICY IF EXISTS "Users can view own hidden posts" ON hidden_posts;
    DROP POLICY IF EXISTS "Users can hide posts" ON hidden_posts;
    DROP POLICY IF EXISTS "Users can unhide posts" ON hidden_posts;
    
    CREATE POLICY "Users can view own hidden posts"
      ON hidden_posts FOR SELECT
      USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can hide posts"
      ON hidden_posts FOR INSERT
      WITH CHECK (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can unhide posts"
      ON hidden_posts FOR DELETE
      USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- MATCH_PROFILES
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'match_profiles') THEN
    DROP POLICY IF EXISTS "Users can update own match profile" ON match_profiles;
    
    CREATE POLICY "Users can update own match profile"
      ON match_profiles FOR UPDATE
      USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- USER_INTERACTIONS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_interactions') THEN
    DROP POLICY IF EXISTS "Users can view own interactions" ON user_interactions;
    DROP POLICY IF EXISTS "Users can create interactions" ON user_interactions;
    
    CREATE POLICY "Users can view own interactions"
      ON user_interactions FOR SELECT
      USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can create interactions"
      ON user_interactions FOR INSERT
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- SEARCH_HISTORY
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'search_history') THEN
    DROP POLICY IF EXISTS "Users can view own search history" ON search_history;
    DROP POLICY IF EXISTS "Users can create search history" ON search_history;
    
    CREATE POLICY "Users can view own search history"
      ON search_history FOR SELECT
      USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can create search history"
      ON search_history FOR INSERT
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- PROFILE_VIEWS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profile_views') THEN
    DROP POLICY IF EXISTS "Users can view own profile views" ON profile_views;
    DROP POLICY IF EXISTS "Users can create profile views" ON profile_views;
    
    CREATE POLICY "Users can view own profile views"
      ON profile_views FOR SELECT
      USING (viewer_id = (SELECT auth.uid()) OR viewed_profile_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can create profile views"
      ON profile_views FOR INSERT
      WITH CHECK (viewer_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- MATCH_ACTIONS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'match_actions') THEN
    DROP POLICY IF EXISTS "Users can view own match actions" ON match_actions;
    DROP POLICY IF EXISTS "Users can create match actions" ON match_actions;
    
    CREATE POLICY "Users can view own match actions"
      ON match_actions FOR SELECT
      USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can create match actions"
      ON match_actions FOR INSERT
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- MATCHES
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'matches') THEN
    DROP POLICY IF EXISTS "Users can view own matches" ON matches;
    
    CREATE POLICY "Users can view own matches"
      ON matches FOR SELECT
      USING (user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- MATCH_WEIGHTS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'match_weights') THEN
    DROP POLICY IF EXISTS "Users can view own weights" ON match_weights;
    DROP POLICY IF EXISTS "Users can update own weights" ON match_weights;
    
    CREATE POLICY "Users can view own weights"
      ON match_weights FOR SELECT
      USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can update own weights"
      ON match_weights FOR UPDATE
      USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- MATCH_FEEDBACK
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'match_feedback') THEN
    DROP POLICY IF EXISTS "Users can view own feedback" ON match_feedback;
    DROP POLICY IF EXISTS "Users can create feedback" ON match_feedback;
    
    CREATE POLICY "Users can view own feedback"
      ON match_feedback FOR SELECT
      USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can create feedback"
      ON match_feedback FOR INSERT
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- RECOMMENDATION_CACHE
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'recommendation_cache') THEN
    DROP POLICY IF EXISTS "Users can view own cache" ON recommendation_cache;
    DROP POLICY IF EXISTS "Users can update own cache" ON recommendation_cache;
    DROP POLICY IF EXISTS "Users can insert own cache" ON recommendation_cache;
    
    CREATE POLICY "Users can view own cache"
      ON recommendation_cache FOR SELECT
      USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can update own cache"
      ON recommendation_cache FOR UPDATE
      USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can insert own cache"
      ON recommendation_cache FOR INSERT
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- USER_PRIVACY_SETTINGS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_privacy_settings') THEN
    DROP POLICY IF EXISTS "Users can view own privacy settings" ON user_privacy_settings;
    DROP POLICY IF EXISTS "Users can update own privacy settings" ON user_privacy_settings;
    DROP POLICY IF EXISTS "Users can insert own privacy settings" ON user_privacy_settings;
    
    CREATE POLICY "Users can view own privacy settings"
      ON user_privacy_settings FOR SELECT
      USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can update own privacy settings"
      ON user_privacy_settings FOR UPDATE
      USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can insert own privacy settings"
      ON user_privacy_settings FOR INSERT
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- USER_SESSIONS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_sessions') THEN
    DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
    
    CREATE POLICY "Users can view own sessions"
      ON user_sessions FOR SELECT
      USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- DATA_EXPORT_REQUESTS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'data_export_requests') THEN
    DROP POLICY IF EXISTS "Users can view own export requests" ON data_export_requests;
    DROP POLICY IF EXISTS "Users can create export requests" ON data_export_requests;
    
    CREATE POLICY "Users can view own export requests"
      ON data_export_requests FOR SELECT
      USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can create export requests"
      ON data_export_requests FOR INSERT
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- AUDIT_LOG
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_log') THEN
    DROP POLICY IF EXISTS "Users can view own audit log" ON audit_log;
    
    CREATE POLICY "Users can view own audit log"
      ON audit_log FOR SELECT
      USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- CONTENT_REPORTS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_reports') THEN
    DROP POLICY IF EXISTS "Users can view own reports" ON content_reports;
    DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
    
    CREATE POLICY "Users can view own reports"
      ON content_reports FOR SELECT
      USING (reporter_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can create reports"
      ON content_reports FOR INSERT
      WITH CHECK (reporter_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- BLOCKED_USERS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blocked_users') THEN
    DROP POLICY IF EXISTS "Users can view own blocked list" ON blocked_users;
    DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
    DROP POLICY IF EXISTS "Users can unblock" ON blocked_users;
    
    CREATE POLICY "Users can view own blocked list"
      ON blocked_users FOR SELECT
      USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can block others"
      ON blocked_users FOR INSERT
      WITH CHECK (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can unblock"
      ON blocked_users FOR DELETE
      USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- INSTITUTE_RATINGS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'institute_ratings') THEN
    DROP POLICY IF EXISTS "Users can create ratings" ON institute_ratings;
    DROP POLICY IF EXISTS "Users can update own ratings" ON institute_ratings;
    DROP POLICY IF EXISTS "Users can delete own ratings" ON institute_ratings;
    
    CREATE POLICY "Users can create ratings"
      ON institute_ratings FOR INSERT
      WITH CHECK (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can update own ratings"
      ON institute_ratings FOR UPDATE
      USING (user_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can delete own ratings"
      ON institute_ratings FOR DELETE
      USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- POST_SHARES
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'post_shares') THEN
    DROP POLICY IF EXISTS "Users can create shares" ON post_shares;
    
    CREATE POLICY "Users can create shares"
      ON post_shares FOR INSERT
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- CONVERSATIONS
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations') THEN
    DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
    DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
    
    CREATE POLICY "Users can view own conversations"
      ON conversations FOR SELECT
      USING (user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid()));
    
    CREATE POLICY "Users can create conversations"
      ON conversations FOR INSERT
      WITH CHECK (user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid()));
  END IF;
END $$;

-- ============================================
-- USER_PROFILES - FIX MULTIPLE PERMISSIVE POLICIES
-- ============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
    DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
    
    -- Usa 'id' invece di 'user_id' per user_profiles
    CREATE POLICY "Users can view profiles"
      ON user_profiles FOR SELECT
      USING (true);
  END IF;
END $$;

-- ============================================
-- VERIFICA FINALE
-- ============================================
SELECT 
  '✅ Fix completato!' as status,
  'Policy RLS ottimizzate con successo' as message,
  NOW() as timestamp;
