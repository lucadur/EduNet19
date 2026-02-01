-- ===================================================================
-- EDUNET19 - SOCIAL FEATURES DATABASE SCHEMA
-- Schema per funzionalità social: likes, commenti, attività utente
-- ===================================================================

-- Tabella per i post/contenuti
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    post_type VARCHAR(50) DEFAULT 'post' CHECK (post_type IN ('post', 'project', 'methodology')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_published BOOLEAN DEFAULT true,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0
);

-- Tabella per i likes
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Tabella per i commenti
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT false
);

-- Tabella per le condivisioni
CREATE TABLE IF NOT EXISTS post_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram', 'email', 'copy_link')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per le attività utente
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('like', 'comment', 'share', 'post_created', 'post_updated')),
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('post', 'comment')),
    target_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_user_id ON post_shares(user_id);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);

-- Funzioni per aggiornare i contatori
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_shares_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET shares_count = shares_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare automaticamente i contatori
CREATE TRIGGER trigger_update_likes_count
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER trigger_update_comments_count
    AFTER INSERT OR DELETE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

CREATE TRIGGER trigger_update_shares_count
    AFTER INSERT OR DELETE ON post_shares
    FOR EACH ROW EXECUTE FUNCTION update_post_shares_count();

-- Funzione per registrare attività utente
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Determina il tipo di attività basato sulla tabella
        IF TG_TABLE_NAME = 'post_likes' THEN
            INSERT INTO user_activities (user_id, activity_type, target_type, target_id, metadata)
            VALUES (NEW.user_id, 'like', 'post', NEW.post_id, '{}');
        ELSIF TG_TABLE_NAME = 'post_comments' THEN
            INSERT INTO user_activities (user_id, activity_type, target_type, target_id, metadata)
            VALUES (NEW.user_id, 'comment', 'post', NEW.post_id, jsonb_build_object('comment_id', NEW.id));
        ELSIF TG_TABLE_NAME = 'post_shares' THEN
            INSERT INTO user_activities (user_id, activity_type, target_type, target_id, metadata)
            VALUES (NEW.user_id, 'share', 'post', NEW.post_id, jsonb_build_object('platform', NEW.platform));
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger per registrare le attività
CREATE TRIGGER trigger_log_like_activity
    AFTER INSERT ON post_likes
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER trigger_log_comment_activity
    AFTER INSERT ON post_comments
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER trigger_log_share_activity
    AFTER INSERT ON post_shares
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

-- RLS (Row Level Security) Policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Policy per i post (tutti possono leggere, solo l'autore può modificare)
CREATE POLICY "Posts are viewable by everyone" ON posts
    FOR SELECT USING (is_published = true);

CREATE POLICY "Users can insert their own posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" ON posts
    FOR DELETE USING (auth.uid() = author_id);

-- Policy per i likes
CREATE POLICY "Likes are viewable by everyone" ON post_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON post_likes
    FOR ALL USING (auth.uid() = user_id);

-- Policy per i commenti
CREATE POLICY "Comments are viewable by everyone" ON post_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON post_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON post_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON post_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Policy per le condivisioni
CREATE POLICY "Shares are viewable by everyone" ON post_shares
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own shares" ON post_shares
    FOR ALL USING (auth.uid() = user_id);

-- Policy per le attività
CREATE POLICY "Users can view their own activities" ON user_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Activities are inserted automatically" ON user_activities
    FOR INSERT WITH CHECK (true);

-- Inserimento di alcuni post di esempio per testing
INSERT INTO posts (author_id, title, content, post_type) VALUES
    ('813ebb9e-93f0-4f40-90ae-6204e3935fe8', 'Post di esempio 1', 'Questo è un contenuto di esempio per testare il sistema di like e commenti.', 'post'),
    ('813ebb9e-93f0-4f40-90ae-6204e3935fe8', 'Progetto STEM innovativo', 'Un progetto educativo che integra scienza, tecnologia, ingegneria e matematica.', 'project'),
    ('813ebb9e-93f0-4f40-90ae-6204e3935fe8', 'Metodologia di apprendimento cooperativo', 'Una metodologia didattica che promuove la collaborazione tra studenti.', 'methodology');