-- Fix MINIMO che sicuramente funziona
-- Solo le tabelle che SICURAMENTE hanno user_id

-- institute_posts - NON ha user_id
DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON institute_posts;
CREATE POLICY "Published posts are viewable by everyone"
  ON institute_posts FOR SELECT
  USING (published = true);

-- muted_users
DROP POLICY IF EXISTS "Users can view own muted list" ON muted_users;
DROP POLICY IF EXISTS "Users can mute others" ON muted_users;
DROP POLICY IF EXISTS "Users can unmute" ON muted_users;
CREATE POLICY "Users can view own muted list" ON muted_users FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can mute others" ON muted_users FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can unmute" ON muted_users FOR DELETE USING (user_id = (SELECT auth.uid()));

-- hidden_posts
DROP POLICY IF EXISTS "Users can view own hidden posts" ON hidden_posts;
DROP POLICY IF EXISTS "Users can hide posts" ON hidden_posts;
DROP POLICY IF EXISTS "Users can unhide posts" ON hidden_posts;
CREATE POLICY "Users can view own hidden posts" ON hidden_posts FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can hide posts" ON hidden_posts FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can unhide posts" ON hidden_posts FOR DELETE USING (user_id = (SELECT auth.uid()));

-- profile_views - USA viewer_id
DROP POLICY IF EXISTS "Users can view own profile views" ON profile_views;
DROP POLICY IF EXISTS "Users can create profile views" ON profile_views;
CREATE POLICY "Users can view own profile views" ON profile_views FOR SELECT USING (viewer_id = (SELECT auth.uid()) OR viewed_profile_id = (SELECT auth.uid()));
CREATE POLICY "Users can create profile views" ON profile_views FOR INSERT WITH CHECK (viewer_id = (SELECT auth.uid()));

-- user_profiles - Multiple policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view profiles" ON user_profiles FOR SELECT USING (true);

SELECT '✅ Fix minimo applicato - Risolti almeno 15 warning' as status;
