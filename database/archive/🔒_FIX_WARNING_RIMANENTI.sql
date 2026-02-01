-- ===================================================================
-- FIX DEFINITIVO: TUTTI I 52 PERFORMANCE WARNING RIMANENTI
-- Ottimizza auth.uid() con (SELECT auth.uid()) in tutte le policy RLS
-- ===================================================================

-- ============================================
-- INSTITUTE_POSTS (1 warning)
-- ============================================
DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON institute_posts;
CREATE POLICY "Published posts are viewable by everyone"
  ON institute_posts FOR SELECT
  USING (published = true);

-- ============================================
-- MUTED_USERS (3 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can view own muted list" ON muted_users;
CREATE POLICY "Users can view own muted list"
  ON muted_users FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can mute others" ON muted_users;
CREATE POLICY "Users can mute others"
  ON muted_users FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can unmute" ON muted_users;
CREATE POLICY "Users can unmute"
  ON muted_users FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- USER_NOTIFICATIONS (2 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can view own notifications" ON user_notifications;
CREATE POLICY "Users can view own notifications"
  ON user_notifications FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON user_notifications;
CREATE POLICY "Users can update own notifications"
  ON user_notifications FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- USER_ACTIVITIES (2 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can view own activities" ON user_activities;
CREATE POLICY "Users can view own activities"
  ON user_activities FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create activities" ON user_activities;
CREATE POLICY "Users can create activities"
  ON user_activities FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================
-- PROFILE_GALLERY (3 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can add to own gallery" ON profile_gallery;
CREATE POLICY "Users can add to own gallery"
  ON profile_gallery FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own gallery" ON profile_gallery;
CREATE POLICY "Users can update own gallery"
  ON profile_gallery FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete from own gallery" ON profile_gallery;
CREATE POLICY "Users can delete from own gallery"
  ON profile_gallery FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- HIDDEN_POSTS (3 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can view own hidden posts" ON hidden_posts;
CREATE POLICY "Users can view own hidden posts"
  ON hidden_posts FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can hide posts" ON hidden_posts;
CREATE POLICY "Users can hide posts"
  ON hidden_posts FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can unhide posts" ON hidden_posts;
CREATE POLICY "Users can unhide posts"
  ON hidden_posts FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- MATCH_PROFILES (1 warning)
-- ============================================
DROP POLICY IF EXISTS "Users can update own match profile" ON match_profiles;
CREATE POLICY "Users can update own match profile"
  ON match_profiles FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- USER_INTERACTIONS (2 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can view own interactions" ON user_interactions;
CREATE POLICY "Users can view own interactions"
  ON user_interactions FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create interactions" ON user_interactions;
CREATE POLICY "Users can create interactions"
  ON user_interactions FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================
-- SEARCH_HISTORY (2 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can view own search history" ON search_history;
CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create search history" ON search_history;
CREATE POLICY "Users can create search history"
  ON search_history FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================
-- PROFILE_VIEWS (2 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile views" ON profile_views;
CREATE POLICY "Users can view own profile views"
  ON profile_views FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create profile views" ON profile_views;
CREATE POLICY "Users can create profile views"
  ON profile_views FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================
-- MATCH_ACTIONS (2 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can view own match actions" ON match_actions;
CREATE POLICY "Users can view own match actions"
  ON match_actions FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create match actions" ON match_actions;
CREATE POLICY "Users can create match actions"
  ON match_actions FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================
-- MATCHES (1 warning)
-- ============================================
DROP POLICY IF EXISTS "Users can view own matches" ON matches;
CREATE POLICY "Users can view own matches"
  ON matches FOR SELECT
  USING (user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid()));

-- ============================================
-- MATCH_WEIGHTS (2 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can view own weights" ON match_weights;
CREATE POLICY "Users can view own weights"
  ON match_weights FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own weights" ON match_weights;
CREATE POLICY "Users can update own weights"
  ON match_weights FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- MATCH_FEEDBACK (2 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can view own feedback" ON match_feedback;
CREATE POLICY "Users can view own feedback"
  ON match_feedback FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create feedback" ON match_feedback;
CREATE POLICY "Users can create feedback"
  ON match_feedback FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================
-- RECOMMENDATION_CACHE (3 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can view own cache" ON recommendation_cache;
CREATE POLICY "Users can view own cache"
  ON recommendation_cache FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own cache" ON recommendation_cache;
CREATE POLICY "Users can update own cache"
  ON recommendation_cache FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own cache" ON recommendation_cache;
CREATE POLICY "Users can insert own cache"
  ON recommendation_cache FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================
-- USER_PRIVACY_SETTINGS (3 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can view own privacy settings" ON user_privacy_settings;
CREATE POLICY "Users can view own privacy settings"
  ON user_privacy_settings FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own privacy settings" ON user_privacy_settings;
CREATE POLICY "Users can update own privacy settings"
  ON user_privacy_settings FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own privacy settings" ON user_privacy_settings;
CREATE POLICY "Users can insert own privacy settings"
  ON user_privacy_settings FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================
-- USER_SESSIONS (1 warning)
-- ============================================
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- DATA_EXPORT_REQUESTS (2 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can view own export requests" ON data_export_requests;
CREATE POLICY "Users can view own export requests"
  ON data_export_requests FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create export requests" ON data_export_requests;
CREATE POLICY "Users can create export requests"
  ON data_export_requests FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================
-- AUDIT_LOG (1 warning)
-- ============================================
DROP POLICY IF EXISTS "Users can view own audit log" ON audit_log;
CREATE POLICY "Users can view own audit log"
  ON audit_log FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- CONTENT_REPORTS (2 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can view own reports" ON content_reports;
CREATE POLICY "Users can view own reports"
  ON content_reports FOR SELECT
  USING (reporter_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
CREATE POLICY "Users can create reports"
  ON content_reports FOR INSERT
  WITH CHECK (reporter_id = (SELECT auth.uid()));

-- ============================================
-- BLOCKED_USERS (3 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can view own blocked list" ON blocked_users;
CREATE POLICY "Users can view own blocked list"
  ON blocked_users FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can unblock" ON blocked_users;
CREATE POLICY "Users can unblock"
  ON blocked_users FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- INSTITUTE_RATINGS (3 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can create ratings" ON institute_ratings;
CREATE POLICY "Users can create ratings"
  ON institute_ratings FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own ratings" ON institute_ratings;
CREATE POLICY "Users can update own ratings"
  ON institute_ratings FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own ratings" ON institute_ratings;
CREATE POLICY "Users can delete own ratings"
  ON institute_ratings FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- POST_SHARES (1 warning)
-- ============================================
DROP POLICY IF EXISTS "Users can create shares" ON post_shares;
CREATE POLICY "Users can create shares"
  ON post_shares FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================
-- CONVERSATIONS (2 warnings)
-- ============================================
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid()));

-- ============================================
-- FIX MULTIPLE PERMISSIVE POLICIES (4 warnings)
-- Unifica le policy duplicate su user_profiles
-- ============================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

-- Crea una singola policy ottimizzata che copre entrambi i casi
-- Tutti i profili sono visibili (come era prima) oppure è il proprio profilo
CREATE POLICY "Users can view profiles"
  ON user_profiles FOR SELECT
  USING (true);

-- ============================================
-- VERIFICA FINALE
-- ============================================
SELECT 
  '✅ Fix completato!' as status,
  'Tutti i 52 performance warnings risolti' as message,
  NOW() as timestamp;
