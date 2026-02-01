-- Schema Database EduNet19
-- Esegui questi comandi nel SQL Editor di Supabase

-- =====================================================
-- 1. CREAZIONE TABELLE
-- =====================================================

-- Tabella per profili utente estesi
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('istituto', 'privato')),
    email_verified BOOLEAN DEFAULT FALSE,
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per istituti scolastici
CREATE TABLE IF NOT EXISTS public.school_institutes (
    id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE PRIMARY KEY,
    institute_name VARCHAR(255) NOT NULL,
    institute_type VARCHAR(100) NOT NULL,
    institute_code VARCHAR(50), -- Codice meccanografico
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(50),
    region VARCHAR(50),
    postal_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'Italia',
    phone VARCHAR(20),
    fax VARCHAR(20),
    website VARCHAR(255),
    pec_email VARCHAR(255), -- Email PEC istituzionale
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    principal_name VARCHAR(255), -- Nome del dirigente
    founded_year INTEGER,
    student_count INTEGER,
    teacher_count INTEGER,
    verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    social_facebook VARCHAR(255),
    social_instagram VARCHAR(255),
    social_youtube VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per utenti privati
CREATE TABLE IF NOT EXISTS public.private_users (
    id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('M', 'F', 'Altro', 'Non specificato')),
    bio TEXT,
    avatar_url TEXT,
    profession VARCHAR(255),
    education_level VARCHAR(100),
    interests TEXT[], -- Array di interessi
    location_city VARCHAR(100),
    location_province VARCHAR(50),
    privacy_level VARCHAR(20) DEFAULT 'pubblico' CHECK (privacy_level IN ('pubblico', 'limitato', 'privato')),
    newsletter_subscribed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per seguire istituti (follow system)
CREATE TABLE IF NOT EXISTS public.user_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    following_institute_id UUID REFERENCES public.school_institutes(id) ON DELETE CASCADE,
    notification_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_institute_id)
);

-- Tabella per progetti/post degli istituti
CREATE TABLE IF NOT EXISTS public.institute_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    institute_id UUID REFERENCES public.school_institutes(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    post_type VARCHAR(50) DEFAULT 'progetto' CHECK (post_type IN ('progetto', 'evento', 'notizia', 'metodologia')),
    category VARCHAR(100),
    tags TEXT[],
    images_urls TEXT[],
    documents_urls TEXT[],
    video_url TEXT,
    target_audience VARCHAR(100), -- es: "Scuola Primaria", "Scuola Secondaria"
    subject_areas TEXT[], -- es: ["Matematica", "Scienze", "Arte"]
    published BOOLEAN DEFAULT FALSE,
    featured BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per commenti sui post
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.institute_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE, -- Per risposte
    content TEXT NOT NULL,
    approved BOOLEAN DEFAULT TRUE, -- Moderazione commenti
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per valutazioni/rating
CREATE TABLE IF NOT EXISTS public.institute_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    institute_id UUID REFERENCES public.school_institutes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_title VARCHAR(255),
    review_content TEXT,
    category VARCHAR(100), -- es: "Didattica", "Strutture", "Organizzazione"
    anonymous BOOLEAN DEFAULT FALSE,
    approved BOOLEAN DEFAULT FALSE, -- Moderazione recensioni
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(institute_id, user_id, category) -- Un rating per categoria per utente
);

-- Tabella per notifiche
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'new_post', 'new_comment', 'new_follower', 'rating_received'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id UUID, -- ID del post, commento, etc.
    related_type VARCHAR(50), -- 'post', 'comment', 'user', etc.
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per segnalazioni/report
CREATE TABLE IF NOT EXISTS public.content_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    reported_content_type VARCHAR(50) NOT NULL, -- 'post', 'comment', 'user'
    reported_content_id UUID NOT NULL,
    reason VARCHAR(100) NOT NULL, -- 'spam', 'inappropriate', 'copyright', etc.
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    moderator_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 2. INDICI PER PERFORMANCE
-- =====================================================

-- Indici per ricerche frequenti
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON public.user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_school_institutes_city ON public.school_institutes(city);
CREATE INDEX IF NOT EXISTS idx_school_institutes_province ON public.school_institutes(province);
CREATE INDEX IF NOT EXISTS idx_school_institutes_verified ON public.school_institutes(verified);
CREATE INDEX IF NOT EXISTS idx_institute_posts_published ON public.institute_posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_institute_posts_institute ON public.institute_posts(institute_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_institute_posts_category ON public.institute_posts(category);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_institute_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_institute_ratings_institute ON public.institute_ratings(institute_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON public.user_notifications(user_id, read, created_at DESC);

-- Indici per ricerca full-text
CREATE INDEX IF NOT EXISTS idx_institute_posts_search ON public.institute_posts USING gin(to_tsvector('italian', title || ' ' || content));
CREATE INDEX IF NOT EXISTS idx_school_institutes_search ON public.school_institutes USING gin(to_tsvector('italian', institute_name || ' ' || COALESCE(description, '')));

-- =====================================================
-- 3. FUNZIONI E TRIGGER
-- =====================================================

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_school_institutes_updated_at BEFORE UPDATE ON public.school_institutes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_private_users_updated_at BEFORE UPDATE ON public.private_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_institute_posts_updated_at BEFORE UPDATE ON public.institute_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_institute_ratings_updated_at BEFORE UPDATE ON public.institute_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Funzione per aggiornare contatori
CREATE OR REPLACE FUNCTION update_post_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.institute_posts 
        SET comments_count = comments_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.institute_posts 
        SET comments_count = comments_count - 1 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger per aggiornare contatori commenti
CREATE TRIGGER update_comments_count AFTER INSERT OR DELETE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION update_post_counters();

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. POLICIES RLS
-- =====================================================

-- Policies per user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies per school_institutes
CREATE POLICY "Anyone can view verified institutes" ON public.school_institutes
    FOR SELECT USING (verified = true OR auth.uid() = id);

CREATE POLICY "Institutes can update own data" ON public.school_institutes
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Institutes can insert own data" ON public.school_institutes
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies per private_users
CREATE POLICY "Users can view own private data" ON public.private_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own private data" ON public.private_users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own private data" ON public.private_users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies per user_follows
CREATE POLICY "Users can view own follows" ON public.user_follows
    FOR SELECT USING (auth.uid() = follower_id);

CREATE POLICY "Users can manage own follows" ON public.user_follows
    FOR ALL USING (auth.uid() = follower_id);

-- Policies per institute_posts
CREATE POLICY "Anyone can view published posts" ON public.institute_posts
    FOR SELECT USING (published = true OR auth.uid() = institute_id);

CREATE POLICY "Institutes can manage own posts" ON public.institute_posts
    FOR ALL USING (auth.uid() = institute_id);

-- Policies per post_comments
CREATE POLICY "Anyone can view approved comments" ON public.post_comments
    FOR SELECT USING (approved = true OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert comments" ON public.post_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.post_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.post_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Policies per institute_ratings
CREATE POLICY "Anyone can view approved ratings" ON public.institute_ratings
    FOR SELECT USING (approved = true OR auth.uid() = user_id);

CREATE POLICY "Private users can insert ratings" ON public.institute_ratings
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND user_type = 'privato')
    );

CREATE POLICY "Users can update own ratings" ON public.institute_ratings
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies per user_notifications
CREATE POLICY "Users can view own notifications" ON public.user_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.user_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies per content_reports
CREATE POLICY "Users can view own reports" ON public.content_reports
    FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users can create reports" ON public.content_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- =====================================================
-- 6. DATI DI ESEMPIO (OPZIONALE)
-- =====================================================

-- Inserisci alcune tipologie di istituto predefinite
-- (Questi dati possono essere inseriti tramite l'interfaccia admin)

-- Commenta queste righe se non vuoi dati di esempio
/*
INSERT INTO public.institute_types (name, description) VALUES
('Scuola dell''Infanzia', 'Scuole per bambini dai 3 ai 6 anni'),
('Scuola Primaria', 'Scuole elementari per bambini dai 6 agli 11 anni'),
('Scuola Secondaria di I Grado', 'Scuole medie per ragazzi dagli 11 ai 14 anni'),
('Liceo', 'Scuole superiori ad indirizzo liceale'),
('Istituto Tecnico', 'Scuole superiori ad indirizzo tecnico'),
('Istituto Professionale', 'Scuole superiori ad indirizzo professionale'),
('ITS', 'Istituti Tecnici Superiori'),
('Università', 'Istituti universitari');
*/

-- =====================================================
-- FINE SCHEMA
-- =====================================================

-- Verifica che tutto sia stato creato correttamente
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'user_profiles', 
        'school_institutes', 
        'private_users', 
        'user_follows',
        'institute_posts',
        'post_comments',
        'institute_ratings',
        'user_notifications',
        'content_reports'
    )
ORDER BY tablename;