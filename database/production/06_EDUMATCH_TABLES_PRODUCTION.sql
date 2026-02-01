-- ===================================================================
-- EDUNET19 - EDUMATCH TABLES (PRODUCTION)
-- Script 6/7: Sistema Match e Raccomandazioni
-- ===================================================================
-- Esegui DOPO 05_RLS_POLICIES_PRODUCTION.sql
-- ===================================================================

-- ===================================================================
-- 1. MATCH PROFILES
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.match_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_type VARCHAR(20) CHECK (profile_type IN ('institute', 'student')),
    is_active BOOLEAN DEFAULT TRUE,
    tags TEXT[],
    interests TEXT[],
    methodologies TEXT[],
    location_city VARCHAR(100),
    location_region VARCHAR(100),
    engagement_score DECIMAL(5,2) DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ===================================================================
-- 2. USER INTERACTIONS (per AI)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL,
    target_id UUID,
    target_type VARCHAR(50),
    interaction_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 3. SEARCH HISTORY
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    search_query TEXT NOT NULL,
    search_filters JSONB,
    results_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 4. PROFILE VIEWS
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    view_duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 5. MATCH ACTIONS (Swipe)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.match_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_profile_id UUID,
    action_type VARCHAR(20) CHECK (action_type IN ('like', 'pass', 'super_like')),
    predicted_score DECIMAL(5,2),
    prediction_breakdown JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 6. MATCHES (Confermati)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_super_match BOOLEAN DEFAULT FALSE,
    match_score DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_1_id, profile_2_id)
);

-- ===================================================================
-- 7. MATCH WEIGHTS (Personalizzazione AI)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.match_weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    content_similarity DECIMAL(3,2) DEFAULT 0.30,
    geographic_proximity DECIMAL(3,2) DEFAULT 0.25,
    engagement_rate DECIMAL(3,2) DEFAULT 0.20,
    mutual_connections DECIMAL(3,2) DEFAULT 0.15,
    activity_recency DECIMAL(3,2) DEFAULT 0.10,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 8. MATCH FEEDBACK (Learning)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.match_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    feedback_type VARCHAR(20) CHECK (feedback_type IN ('positive', 'negative', 'neutral')),
    feedback_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 9. RECOMMENDATION CACHE
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.recommendation_cache (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendations JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- INDICI PER PERFORMANCE
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_match_profiles_user ON public.match_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_match_profiles_type ON public.match_profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_match_profiles_active ON public.match_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user ON public.user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created ON public.user_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON public.profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed ON public.profile_views(viewed_profile_id);
CREATE INDEX IF NOT EXISTS idx_match_actions_actor ON public.match_actions(actor_id);
CREATE INDEX IF NOT EXISTS idx_match_actions_target ON public.match_actions(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_matches_profile1 ON public.matches(profile_1_id);
CREATE INDEX IF NOT EXISTS idx_matches_profile2 ON public.matches(profile_2_id);

-- ===================================================================
-- TRIGGER: updated_at
-- ===================================================================

DROP TRIGGER IF EXISTS update_match_profiles_updated_at ON public.match_profiles;
CREATE TRIGGER update_match_profiles_updated_at
    BEFORE UPDATE ON public.match_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_match_weights_updated_at ON public.match_weights;
CREATE TRIGGER update_match_weights_updated_at
    BEFORE UPDATE ON public.match_weights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- RLS POLICIES
-- ===================================================================

ALTER TABLE public.match_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_cache ENABLE ROW LEVEL SECURITY;

-- Policies: match_profiles
CREATE POLICY "Match profiles viewable by everyone"
ON public.match_profiles FOR SELECT USING (is_active = true);

CREATE POLICY "Users can update own match profile"
ON public.match_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Policies: user_interactions
CREATE POLICY "Users can view own interactions"
ON public.user_interactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create interactions"
ON public.user_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies: search_history
CREATE POLICY "Users can view own search history"
ON public.search_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create search history"
ON public.search_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies: profile_views
CREATE POLICY "Users can view own profile views"
ON public.profile_views FOR SELECT USING (auth.uid() = viewer_id OR auth.uid() = viewed_profile_id);

CREATE POLICY "Users can create profile views"
ON public.profile_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Policies: match_actions
CREATE POLICY "Users can view own match actions"
ON public.match_actions FOR SELECT USING (auth.uid() = actor_id);

CREATE POLICY "Users can create match actions"
ON public.match_actions FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- Policies: matches
CREATE POLICY "Users can view own matches"
ON public.matches FOR SELECT USING (auth.uid() = profile_1_id OR auth.uid() = profile_2_id);

-- Policies: match_weights
CREATE POLICY "Users can view own weights"
ON public.match_weights FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own weights"
ON public.match_weights FOR UPDATE USING (auth.uid() = user_id);

-- Policies: match_feedback
CREATE POLICY "Users can view own feedback"
ON public.match_feedback FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback"
ON public.match_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies: recommendation_cache
CREATE POLICY "Users can view own cache"
ON public.recommendation_cache FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own cache"
ON public.recommendation_cache FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cache"
ON public.recommendation_cache FOR INSERT WITH CHECK (auth.uid() = user_id);
