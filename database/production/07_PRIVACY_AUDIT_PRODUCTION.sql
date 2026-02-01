-- ===================================================================
-- EDUNET19 - PRIVACY & AUDIT (PRODUCTION)
-- Script 7/7: Privacy, Audit Log, Sessions
-- ===================================================================
-- Esegui DOPO 06_EDUMATCH_TABLES_PRODUCTION.sql
-- ===================================================================

-- ===================================================================
-- 1. USER PRIVACY SETTINGS
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'connections', 'private')),
    show_email BOOLEAN DEFAULT FALSE,
    show_phone BOOLEAN DEFAULT FALSE,
    show_location BOOLEAN DEFAULT TRUE,
    show_activity BOOLEAN DEFAULT TRUE,
    allow_messages_from VARCHAR(20) DEFAULT 'everyone' CHECK (allow_messages_from IN ('everyone', 'connections', 'none')),
    allow_profile_indexing BOOLEAN DEFAULT TRUE,
    data_processing_consent BOOLEAN DEFAULT TRUE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 2. USER SESSIONS (Tracking)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT,
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(50),
    os VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ===================================================================
-- 3. DATA EXPORT REQUESTS (GDPR)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.data_export_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type VARCHAR(20) CHECK (request_type IN ('export', 'delete')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    export_url TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ===================================================================
-- 4. AUDIT LOG
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 5. CONTENT REPORTS (Segnalazioni)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    reported_content_type VARCHAR(50),
    reported_content_id UUID,
    report_reason VARCHAR(100) NOT NULL,
    report_description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    moderator_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- ===================================================================
-- 6. BLOCKED USERS
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- ===================================================================
-- 7. INSTITUTE RATINGS (Valutazioni)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.institute_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institute_id UUID REFERENCES public.school_institutes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_title VARCHAR(255),
    review_text TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(institute_id, user_id)
);

-- ===================================================================
-- INDICI PER PERFORMANCE
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created ON public.user_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user ON public.data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON public.data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON public.content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reported ON public.content_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_id);
CREATE INDEX IF NOT EXISTS idx_institute_ratings_institute ON public.institute_ratings(institute_id);
CREATE INDEX IF NOT EXISTS idx_institute_ratings_user ON public.institute_ratings(user_id);

-- ===================================================================
-- TRIGGER: updated_at
-- ===================================================================

DROP TRIGGER IF EXISTS update_privacy_settings_updated_at ON public.user_privacy_settings;
CREATE TRIGGER update_privacy_settings_updated_at
    BEFORE UPDATE ON public.user_privacy_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_institute_ratings_updated_at ON public.institute_ratings;
CREATE TRIGGER update_institute_ratings_updated_at
    BEFORE UPDATE ON public.institute_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- RLS POLICIES
-- ===================================================================

ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_ratings ENABLE ROW LEVEL SECURITY;

-- Policies: user_privacy_settings
CREATE POLICY "Users can view own privacy settings"
ON public.user_privacy_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy settings"
ON public.user_privacy_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy settings"
ON public.user_privacy_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies: user_sessions
CREATE POLICY "Users can view own sessions"
ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);

-- Policies: data_export_requests
CREATE POLICY "Users can view own export requests"
ON public.data_export_requests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create export requests"
ON public.data_export_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies: audit_log
CREATE POLICY "Users can view own audit log"
ON public.audit_log FOR SELECT USING (auth.uid() = user_id);

-- Policies: content_reports
CREATE POLICY "Users can view own reports"
ON public.content_reports FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
ON public.content_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Policies: blocked_users
CREATE POLICY "Users can view own blocked list"
ON public.blocked_users FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
ON public.blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock"
ON public.blocked_users FOR DELETE USING (auth.uid() = blocker_id);

-- Policies: institute_ratings
CREATE POLICY "Ratings are viewable by everyone"
ON public.institute_ratings FOR SELECT USING (true);

CREATE POLICY "Users can create ratings"
ON public.institute_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
ON public.institute_ratings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
ON public.institute_ratings FOR DELETE USING (auth.uid() = user_id);

-- ===================================================================
-- FUNZIONE: Auto-crea privacy settings
-- ===================================================================

CREATE OR REPLACE FUNCTION create_default_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_privacy_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Crea privacy settings alla registrazione
DROP TRIGGER IF EXISTS create_privacy_settings_on_profile_create ON public.user_profiles;
CREATE TRIGGER create_privacy_settings_on_profile_create
    AFTER INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_privacy_settings();
