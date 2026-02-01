-- =====================================================
-- SETUP TABELLE PER STATISTICHE DINAMICHE
-- Esegui questo script nel SQL Editor di Supabase
-- =====================================================

-- Prima elimina le tabelle esistenti se hanno constraints problematici
DROP TABLE IF EXISTS post_shares CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;

-- Tabella per i likes dei post
CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL, -- Nessun foreign key constraint per flessibilità
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Tabella per i commenti dei post
CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL, -- Nessun foreign key constraint per flessibilità
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT false
);

-- Tabella per le condivisioni dei post
CREATE TABLE post_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL, -- Nessun foreign key constraint per flessibilità
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram', 'email', 'copy_link')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDICI PER PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON post_likes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_user_id ON post_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_created_at ON post_shares(created_at DESC);

-- =====================================================
-- ABILITAZIONE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES PER LA SICUREZZA
-- =====================================================

-- Policies per post_likes
DROP POLICY IF EXISTS "I likes sono visibili a tutti" ON post_likes;
CREATE POLICY "I likes sono visibili a tutti" ON post_likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gli utenti possono gestire i propri likes" ON post_likes;
CREATE POLICY "Gli utenti possono gestire i propri likes" ON post_likes
    FOR ALL USING (auth.uid() = user_id);

-- Policies per post_comments
DROP POLICY IF EXISTS "I commenti sono visibili a tutti" ON post_comments;
CREATE POLICY "I commenti sono visibili a tutti" ON post_comments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gli utenti possono creare commenti" ON post_comments;
CREATE POLICY "Gli utenti possono creare commenti" ON post_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gli utenti possono modificare i propri commenti" ON post_comments;
CREATE POLICY "Gli utenti possono modificare i propri commenti" ON post_comments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gli utenti possono eliminare i propri commenti" ON post_comments;
CREATE POLICY "Gli utenti possono eliminare i propri commenti" ON post_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Policies per post_shares
DROP POLICY IF EXISTS "Le condivisioni sono visibili a tutti" ON post_shares;
CREATE POLICY "Le condivisioni sono visibili a tutti" ON post_shares
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gli utenti possono registrare le proprie condivisioni" ON post_shares;
CREATE POLICY "Gli utenti possono registrare le proprie condivisioni" ON post_shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNZIONI PER AGGIORNARE I CONTATORI
-- =====================================================

-- Funzione per aggiornare il contatore dei likes
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER 
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Prova prima la tabella posts, poi institute_posts
        UPDATE public.posts 
        SET likes_count = COALESCE(likes_count, 0) + 1,
            updated_at = NOW()
        WHERE id = NEW.post_id;
        
        -- Se non ha aggiornato nessuna riga in posts, prova institute_posts
        IF NOT FOUND THEN
            UPDATE public.institute_posts 
            SET likes_count = COALESCE(likes_count, 0) + 1,
                updated_at = NOW()
            WHERE id = NEW.post_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Prova prima la tabella posts, poi institute_posts
        UPDATE public.posts 
        SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.post_id;
        
        -- Se non ha aggiornato nessuna riga in posts, prova institute_posts
        IF NOT FOUND THEN
            UPDATE public.institute_posts 
            SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0),
                updated_at = NOW()
            WHERE id = OLD.post_id;
        END IF;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Funzione per aggiornare il contatore dei commenti
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER 
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Prova prima la tabella posts, poi institute_posts
        UPDATE public.posts 
        SET comments_count = COALESCE(comments_count, 0) + 1,
            updated_at = NOW()
        WHERE id = NEW.post_id;
        
        -- Se non ha aggiornato nessuna riga in posts, prova institute_posts
        IF NOT FOUND THEN
            UPDATE public.institute_posts 
            SET comments_count = COALESCE(comments_count, 0) + 1,
                updated_at = NOW()
            WHERE id = NEW.post_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Prova prima la tabella posts, poi institute_posts
        UPDATE public.posts 
        SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.post_id;
        
        -- Se non ha aggiornato nessuna riga in posts, prova institute_posts
        IF NOT FOUND THEN
            UPDATE public.institute_posts 
            SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0),
                updated_at = NOW()
            WHERE id = OLD.post_id;
        END IF;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Funzione per aggiornare il contatore delle condivisioni
CREATE OR REPLACE FUNCTION update_post_shares_count()
RETURNS TRIGGER 
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Prova prima la tabella posts, poi institute_posts
        UPDATE public.posts 
        SET shares_count = COALESCE(shares_count, 0) + 1,
            updated_at = NOW()
        WHERE id = NEW.post_id;
        
        -- Se non ha aggiornato nessuna riga in posts, prova institute_posts
        IF NOT FOUND THEN
            UPDATE public.institute_posts 
            SET shares_count = COALESCE(shares_count, 0) + 1,
                updated_at = NOW()
            WHERE id = NEW.post_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Prova prima la tabella posts, poi institute_posts
        UPDATE public.posts 
        SET shares_count = GREATEST(COALESCE(shares_count, 0) - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.post_id;
        
        -- Se non ha aggiornato nessuna riga in posts, prova institute_posts
        IF NOT FOUND THEN
            UPDATE public.institute_posts 
            SET shares_count = GREATEST(COALESCE(shares_count, 0) - 1, 0),
                updated_at = NOW()
            WHERE id = OLD.post_id;
        END IF;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS PER AGGIORNARE AUTOMATICAMENTE I CONTATORI
-- =====================================================

-- Trigger per likes
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON post_likes;
CREATE TRIGGER trigger_update_post_likes_count
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Trigger per comments
DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON post_comments;
CREATE TRIGGER trigger_update_post_comments_count
    AFTER INSERT OR DELETE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Trigger per shares
DROP TRIGGER IF EXISTS trigger_update_post_shares_count ON post_shares;
CREATE TRIGGER trigger_update_post_shares_count
    AFTER INSERT OR DELETE ON post_shares
    FOR EACH ROW EXECUTE FUNCTION update_post_shares_count();

-- =====================================================
-- AGGIUNTA COLONNE CONTATORI ALLE TABELLE POSTS
-- =====================================================

-- Aggiungi colonne per i contatori alla tabella posts se non esistono già
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- Aggiungi colonne per i contatori alla tabella institute_posts se esiste
DO $$
BEGIN
    -- Controlla se la tabella institute_posts esiste
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'institute_posts') THEN
        ALTER TABLE public.institute_posts 
        ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
        
        RAISE NOTICE 'Colonne contatori aggiunte anche alla tabella institute_posts';
    END IF;
END $$;

-- =====================================================
-- DATI DI ESEMPIO PER TESTARE LE STATISTICHE
-- =====================================================

-- Prima verifica che esistano post nella tabella corretta
DO $$
DECLARE
    sample_post_id UUID;
    sample_user_id UUID := '813ebb9e-93f0-4f40-90ae-6204e3935fe8';
BEGIN
    -- Trova un post esistente (prova prima posts, poi institute_posts)
    SELECT id INTO sample_post_id FROM public.posts WHERE is_published = true LIMIT 1;
    
    -- Se non trova post in 'posts', prova 'institute_posts'
    IF sample_post_id IS NULL THEN
        SELECT id INTO sample_post_id FROM public.institute_posts WHERE is_published = true LIMIT 1;
    END IF;
    
    -- Se trova un post, inserisci i dati di esempio
    IF sample_post_id IS NOT NULL THEN
        -- Inserisci alcuni likes di esempio
        INSERT INTO public.post_likes (post_id, user_id) VALUES (sample_post_id, sample_user_id)
        ON CONFLICT (post_id, user_id) DO NOTHING;
        
        -- Inserisci alcuni commenti di esempio
        INSERT INTO public.post_comments (post_id, user_id, content) VALUES 
        (sample_post_id, sample_user_id, 'Ottimo post! Molto interessante.')
        ON CONFLICT DO NOTHING;
        
        -- Inserisci alcune condivisioni di esempio
        INSERT INTO public.post_shares (post_id, user_id, platform) VALUES 
        (sample_post_id, sample_user_id, 'facebook')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Dati di esempio inseriti per il post ID: %', sample_post_id;
    ELSE
        RAISE NOTICE 'Nessun post trovato nelle tabelle posts o institute_posts. Salta inserimento dati di esempio.';
    END IF;
END $$;

-- =====================================================
-- MESSAGGIO DI COMPLETAMENTO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Setup completato! Tabelle create: post_likes, post_comments, post_shares';
    RAISE NOTICE 'Triggers configurati per aggiornare automaticamente i contatori';
    RAISE NOTICE 'Policies di sicurezza abilitate';
    RAISE NOTICE 'Ora le statistiche saranno dinamiche e aggiornate in tempo reale!';
END $$;