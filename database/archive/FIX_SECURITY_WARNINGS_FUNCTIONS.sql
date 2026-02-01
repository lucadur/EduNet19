-- FIX SECURITY WARNINGS - Function Search Path Mutable
-- Questo script aggiunge SET search_path = '' a tutte le funzioni per sicurezza

-- ========================================
-- 1. update_post_shares_count
-- ========================================
CREATE OR REPLACE FUNCTION public.update_post_shares_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts
        SET shares_count = shares_count + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts
        SET shares_count = GREATEST(0, shares_count - 1)
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$;

-- ========================================
-- 2. update_updated_at_column
-- ========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- ========================================
-- 3. update_post_counters
-- ========================================
CREATE OR REPLACE FUNCTION public.update_post_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Incrementa il contatore appropriato
        IF TG_TABLE_NAME = 'post_likes' THEN
            UPDATE public.posts
            SET likes_count = likes_count + 1
            WHERE id = NEW.post_id;
        ELSIF TG_TABLE_NAME = 'post_comments' THEN
            UPDATE public.posts
            SET comments_count = comments_count + 1
            WHERE id = NEW.post_id;
        ELSIF TG_TABLE_NAME = 'post_shares' THEN
            UPDATE public.posts
            SET shares_count = shares_count + 1
            WHERE id = NEW.post_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrementa il contatore appropriato
        IF TG_TABLE_NAME = 'post_likes' THEN
            UPDATE public.posts
            SET likes_count = GREATEST(0, likes_count - 1)
            WHERE id = OLD.post_id;
        ELSIF TG_TABLE_NAME = 'post_comments' THEN
            UPDATE public.posts
            SET comments_count = GREATEST(0, comments_count - 1)
            WHERE id = OLD.post_id;
        ELSIF TG_TABLE_NAME = 'post_shares' THEN
            UPDATE public.posts
            SET shares_count = GREATEST(0, shares_count - 1)
            WHERE id = OLD.post_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$;

-- ========================================
-- 4. update_likes_count
-- ========================================
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts
        SET likes_count = likes_count + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$;

-- ========================================
-- 5. check_gallery_photo_limit
-- ========================================
CREATE OR REPLACE FUNCTION public.check_gallery_photo_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    photo_count INTEGER;
BEGIN
    -- Conta le foto esistenti per questo utente
    SELECT COUNT(*)
    INTO photo_count
    FROM public.profile_gallery
    WHERE user_id = NEW.user_id;
    
    -- Limite massimo di 10 foto
    IF photo_count >= 10 THEN
        RAISE EXCEPTION 'Maximum gallery photo limit (10) reached';
    END IF;
    
    RETURN NEW;
END;
$$;

-- ========================================
-- 6. create_default_privacy_settings
-- ========================================
CREATE OR REPLACE FUNCTION public.create_default_privacy_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.privacy_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- ========================================
-- VERIFICA FINALE
-- ========================================
SELECT 
    routine_name,
    routine_type,
    security_type,
    routine_definition LIKE '%SET search_path%' as has_search_path_set
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_post_shares_count',
    'update_updated_at_column',
    'update_post_counters',
    'update_likes_count',
    'check_gallery_photo_limit',
    'create_default_privacy_settings'
  )
ORDER BY routine_name;
