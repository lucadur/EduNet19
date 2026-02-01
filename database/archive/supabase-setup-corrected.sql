-- ===================================================================
-- EDUNET19 - SOCIAL FEATURES DATABASE SCHEMA
-- Schema per funzionalità social: likes, commenti, attività utente
-- ===================================================================

-- Abilita Row Level Security per tutte le tabelle
-- (Supabase lo richiede per la sicurezza)

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

-- Abilita RLS per posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Tabella per i likes
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Abilita RLS per post_likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

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

-- Abilita RLS per post_comments
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Tabella per le condivisioni
CREATE TABLE IF NOT EXISTS post_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram', 'email', 'copy_link')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abilita RLS per post_shares
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;

-- Tabella per le attività utente
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abilita RLS per user_activities
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- INDICI PER PERFORMANCE
-- ===================================================================

-- Indici per posts
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(is_published) WHERE is_published = true;

-- Indici per post_likes
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- Indici per post_comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id);

-- Indici per post_shares
CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_user_id ON post_shares(user_id);

-- Indici per user_activities
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);

-- ===================================================================
-- ROW LEVEL SECURITY POLICIES
-- ===================================================================

-- Policies per posts
CREATE POLICY "Posts sono visibili a tutti gli utenti autenticati" ON posts
    FOR SELECT USING (auth.role() = 'authenticated' AND is_published = true);

CREATE POLICY "Gli utenti possono creare i propri post" ON posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Gli utenti possono modificare i propri post" ON posts
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Gli utenti possono eliminare i propri post" ON posts
    FOR DELETE USING (auth.uid() = author_id);

-- Policies per post_likes
CREATE POLICY "I likes sono visibili a tutti" ON post_likes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Gli utenti possono gestire i propri likes" ON post_likes
    FOR ALL USING (auth.uid() = user_id);

-- Policies per post_comments
CREATE POLICY "I commenti sono visibili a tutti" ON post_comments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Gli utenti possono creare commenti" ON post_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Gli utenti possono modificare i propri commenti" ON post_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Gli utenti possono eliminare i propri commenti" ON post_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Policies per post_shares
CREATE POLICY "Le condivisioni sono visibili a tutti" ON post_shares
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Gli utenti possono registrare le proprie condivisioni" ON post_shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies per user_activities
CREATE POLICY "Gli utenti vedono solo le proprie attività" ON user_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Il sistema può registrare attività per gli utenti" ON user_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===================================================================
-- FUNZIONI E TRIGGER PER CONTATORI AUTOMATICI
-- ===================================================================

-- Funzione per aggiornare il contatore dei likes
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Trigger per likes
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON post_likes;
CREATE TRIGGER trigger_update_post_likes_count
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Funzione per aggiornare il contatore dei commenti
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Trigger per commenti
DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON post_comments;
CREATE TRIGGER trigger_update_post_comments_count
    AFTER INSERT OR DELETE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Funzione per aggiornare il contatore delle condivisioni
CREATE OR REPLACE FUNCTION update_post_shares_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET shares_count = shares_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Trigger per condivisioni
DROP TRIGGER IF EXISTS trigger_update_post_shares_count ON post_shares;
CREATE TRIGGER trigger_update_post_shares_count
    AFTER INSERT OR DELETE ON post_shares
    FOR EACH ROW EXECUTE FUNCTION update_post_shares_count();

-- ===================================================================
-- DATI DI ESEMPIO (OPZIONALE)
-- ===================================================================

-- Inserisci alcuni post di esempio (solo se non esistono già)
-- NOTA: Sostituisci 'your-user-id-here' con un ID utente reale dal tuo auth.users

-- INSERT INTO posts (author_id, title, content, post_type) 
-- SELECT 
--     id,
--     'Post di Benvenuto su EduNet19',
--     'Benvenuti nella nuova piattaforma educativa! Qui potrete condividere progetti, metodologie e collaborare con altri istituti.',
--     'post'
-- FROM auth.users 
-- WHERE email = 'your-email@example.com'
-- AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Post di Benvenuto su EduNet19');

-- ===================================================================
-- FINE SCHEMA
-- ===================================================================

-- Messaggio di conferma
DO $$
BEGIN
    RAISE NOTICE 'Schema EduNet19 Social Features creato con successo!';
    RAISE NOTICE 'Tabelle create: posts, post_likes, post_comments, post_shares, user_activities';
    RAISE NOTICE 'RLS abilitato e policies configurate';
    RAISE NOTICE 'Trigger per contatori automatici attivati';
END $$;