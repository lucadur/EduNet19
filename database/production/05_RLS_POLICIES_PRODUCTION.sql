-- ===================================================================
-- EDUNET19 - ROW LEVEL SECURITY POLICIES (PRODUCTION)
-- Script 5/7: Sicurezza e Permessi
-- ===================================================================
-- Esegui DOPO 04_STORAGE_BUCKETS_PRODUCTION.sql
-- ===================================================================

-- ===================================================================
-- ABILITA RLS SU TUTTE LE TABELLE
-- ===================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_gallery ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- POLICIES: user_profiles
-- ===================================================================

CREATE POLICY "Public profiles are viewable by everyone"
ON public.user_profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id);

-- ===================================================================
-- POLICIES: school_institutes
-- ===================================================================

CREATE POLICY "Institutes are viewable by everyone"
ON public.school_institutes FOR SELECT
USING (true);

CREATE POLICY "Institutes can update own data"
ON public.school_institutes FOR UPDATE
USING (auth.uid() = id);

-- ===================================================================
-- POLICIES: private_users
-- ===================================================================

CREATE POLICY "Private users are viewable by everyone"
ON public.private_users FOR SELECT
USING (true);

CREATE POLICY "Users can update own data"
ON public.private_users FOR UPDATE
USING (auth.uid() = id);

-- ===================================================================
-- POLICIES: user_follows
-- ===================================================================

CREATE POLICY "Follows are viewable by everyone"
ON public.user_follows FOR SELECT
USING (true);

CREATE POLICY "Users can follow others"
ON public.user_follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.user_follows FOR DELETE
USING (auth.uid() = follower_id);

-- ===================================================================
-- POLICIES: institute_posts
-- ===================================================================

CREATE POLICY "Published posts are viewable by everyone"
ON public.institute_posts FOR SELECT
USING (published = true OR auth.uid() = institute_id);

CREATE POLICY "Institutes can create posts"
ON public.institute_posts FOR INSERT
WITH CHECK (auth.uid() = institute_id);

CREATE POLICY "Institutes can update own posts"
ON public.institute_posts FOR UPDATE
USING (auth.uid() = institute_id);

CREATE POLICY "Institutes can delete own posts"
ON public.institute_posts FOR DELETE
USING (auth.uid() = institute_id);

-- ===================================================================
-- POLICIES: post_comments
-- ===================================================================

CREATE POLICY "Comments are viewable by everyone"
ON public.post_comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can comment"
ON public.post_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON public.post_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.post_comments FOR DELETE
USING (auth.uid() = user_id);

-- ===================================================================
-- POLICIES: post_likes
-- ===================================================================

CREATE POLICY "Likes are viewable by everyone"
ON public.post_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like"
ON public.post_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike"
ON public.post_likes FOR DELETE
USING (auth.uid() = user_id);

-- ===================================================================
-- POLICIES: saved_posts
-- ===================================================================

CREATE POLICY "Users can view own saved posts"
ON public.saved_posts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
ON public.saved_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
ON public.saved_posts FOR DELETE
USING (auth.uid() = user_id);

-- ===================================================================
-- POLICIES: hidden_posts
-- ===================================================================

CREATE POLICY "Users can view own hidden posts"
ON public.hidden_posts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can hide posts"
ON public.hidden_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unhide posts"
ON public.hidden_posts FOR DELETE
USING (auth.uid() = user_id);

-- ===================================================================
-- POLICIES: muted_users
-- ===================================================================

CREATE POLICY "Users can view own muted list"
ON public.muted_users FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can mute others"
ON public.muted_users FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unmute"
ON public.muted_users FOR DELETE
USING (auth.uid() = user_id);

-- ===================================================================
-- POLICIES: user_notifications
-- ===================================================================

CREATE POLICY "Users can view own notifications"
ON public.user_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.user_notifications FOR UPDATE
USING (auth.uid() = user_id);

-- ===================================================================
-- POLICIES: user_activities
-- ===================================================================

CREATE POLICY "Users can view own activities"
ON public.user_activities FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create activities"
ON public.user_activities FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ===================================================================
-- POLICIES: profile_gallery
-- ===================================================================

CREATE POLICY "Gallery photos are viewable by everyone"
ON public.profile_gallery FOR SELECT
USING (true);

CREATE POLICY "Users can add to own gallery"
ON public.profile_gallery FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gallery"
ON public.profile_gallery FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own gallery"
ON public.profile_gallery FOR DELETE
USING (auth.uid() = user_id);
