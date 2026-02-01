-- ===================================================================
-- EDUNET19 - FUNCTIONS & TRIGGERS (PRODUCTION)
-- Script 3/7: Funzioni e Trigger
-- ===================================================================
-- Esegui DOPO 02_SOCIAL_FEATURES_PRODUCTION.sql
-- ===================================================================

-- ===================================================================
-- 1. FUNZIONE: Aggiorna updated_at
-- ===================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 2. FUNZIONE: Aggiorna contatori post
-- ===================================================================

CREATE OR REPLACE FUNCTION update_post_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.institute_posts
        SET comments_count = comments_count + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.institute_posts
        SET comments_count = GREATEST(0, comments_count - 1)
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 3. FUNZIONE: Aggiorna contatore likes
-- ===================================================================

CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.institute_posts
        SET likes_count = likes_count + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.institute_posts
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 4. FUNZIONE: Limita foto gallery
-- ===================================================================

CREATE OR REPLACE FUNCTION check_gallery_photo_limit()
RETURNS TRIGGER AS $$
DECLARE
    photo_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO photo_count
    FROM public.profile_gallery
    WHERE user_id = NEW.user_id;
    
    IF photo_count >= 10 THEN
        RAISE EXCEPTION 'Maximum 10 photos allowed in gallery';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- TRIGGER: updated_at per tutte le tabelle
-- ===================================================================

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_school_institutes_updated_at ON public.school_institutes;
CREATE TRIGGER update_school_institutes_updated_at
    BEFORE UPDATE ON public.school_institutes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_private_users_updated_at ON public.private_users;
CREATE TRIGGER update_private_users_updated_at
    BEFORE UPDATE ON public.private_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_institute_posts_updated_at ON public.institute_posts;
CREATE TRIGGER update_institute_posts_updated_at
    BEFORE UPDATE ON public.institute_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_post_comments_updated_at ON public.post_comments;
CREATE TRIGGER update_post_comments_updated_at
    BEFORE UPDATE ON public.post_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profile_gallery_updated_at ON public.profile_gallery;
CREATE TRIGGER update_profile_gallery_updated_at
    BEFORE UPDATE ON public.profile_gallery
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- TRIGGER: Contatori
-- ===================================================================

DROP TRIGGER IF EXISTS update_comments_count ON public.post_comments;
CREATE TRIGGER update_comments_count
    AFTER INSERT OR DELETE ON public.post_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_counters();

DROP TRIGGER IF EXISTS update_post_likes_count ON public.post_likes;
CREATE TRIGGER update_post_likes_count
    AFTER INSERT OR DELETE ON public.post_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_likes_count();

-- ===================================================================
-- TRIGGER: Limiti Gallery
-- ===================================================================

DROP TRIGGER IF EXISTS enforce_gallery_photo_limit ON public.profile_gallery;
CREATE TRIGGER enforce_gallery_photo_limit
    BEFORE INSERT ON public.profile_gallery
    FOR EACH ROW
    EXECUTE FUNCTION check_gallery_photo_limit();
