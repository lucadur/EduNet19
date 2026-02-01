
-- ===================================================================
-- FUNZIONI PER STATISTICHE UTENTE (FIX RPC 400)
-- ===================================================================

-- Drop old function to ensure clean slate
DROP FUNCTION IF EXISTS public.get_user_storage_usage(UUID);

-- Funzione per calcolare la dimensione stimata dei dati utente
-- FIX: Gestione tipi esplicita e controlli NULL
CREATE OR REPLACE FUNCTION public.get_user_storage_usage(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_size BIGINT := 0;
    posts_size BIGINT := 0;
    images_size BIGINT := 0;
    docs_size BIGINT := 0;
    avatar_size BIGINT := 0;
    user_type_val VARCHAR;
    result JSONB;
BEGIN
    -- Controllo input
    IF target_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'total_bytes', 0,
            'error', 'User ID is null'
        );
    END IF;

    -- Determina tipo utente
    SELECT user_type INTO user_type_val 
    FROM public.user_profiles 
    WHERE id = target_user_id;

    -- Se utente non trovato, ritorna 0
    IF user_type_val IS NULL THEN
         RETURN jsonb_build_object(
            'total_bytes', 0,
            'limit_bytes', 1073741824
        );
    END IF;

    -- 1. Stima dimensione Post (testo + immagini) - Solo per istituti
    IF user_type_val = 'istituto' THEN
        -- Testo
        SELECT COALESCE(SUM(LENGTH(COALESCE(content, '')) + LENGTH(COALESCE(title, ''))), 0)
        INTO posts_size
        FROM public.institute_posts
        WHERE institute_id = target_user_id;
        
        -- Immagini Post (Usa image_urls e image_url)
        -- Stima: 500KB per immagine array, 500KB per immagine singola
        SELECT COALESCE(SUM(
            (COALESCE(array_length(image_urls, 1), 0) * 512000) + 
            (CASE WHEN image_url IS NOT NULL THEN 512000 ELSE 0 END)
        ), 0)
        INTO images_size
        FROM public.institute_posts
        WHERE institute_id = target_user_id;
    END IF;

    -- 2. Stima dimensione Immagini Gallery (comune a tutti)
    DECLARE
        gallery_count BIGINT := 0;
    BEGIN
        SELECT COALESCE(COUNT(*), 0) INTO gallery_count
        FROM public.profile_gallery
        WHERE user_id = target_user_id;
        
        images_size := images_size + (gallery_count * 512000); -- 500KB avg
    END;

    -- 3. Stima dimensione Documenti/Dati Profilo + Avatar/Cover
    IF user_type_val = 'istituto' THEN
        SELECT COALESCE(LENGTH(COALESCE(description, '')) + LENGTH(COALESCE(address, '')), 0)
        INTO docs_size
        FROM public.school_institutes
        WHERE id = target_user_id;

        -- Avatar & Cover
        SELECT 
            (CASE WHEN logo_url IS NOT NULL THEN 512000 ELSE 0 END) +
            (CASE WHEN cover_image IS NOT NULL THEN 1024000 ELSE 0 END)
        INTO avatar_size
        FROM public.school_institutes
        WHERE id = target_user_id;

    ELSE
        SELECT COALESCE(LENGTH(COALESCE(bio, '')) + LENGTH(COALESCE(current_school, '')), 0)
        INTO docs_size
        FROM public.private_users
        WHERE id = target_user_id;

        -- Avatar
        SELECT 
            (CASE WHEN avatar_url IS NOT NULL THEN 512000 ELSE 0 END)
        INTO avatar_size
        FROM public.private_users
        WHERE id = target_user_id;
    END IF;

    images_size := images_size + COALESCE(avatar_size, 0);

    -- Gestione NULL finale
    posts_size := COALESCE(posts_size, 0);
    images_size := COALESCE(images_size, 0);
    docs_size := COALESCE(docs_size, 0);

    total_size := posts_size + images_size + docs_size;
    
    -- Se total_size è 0, metti un valore minimo di presenza
    IF total_size = 0 THEN
        total_size := 1024; 
    END IF;

    result := jsonb_build_object(
        'total_bytes', total_size,
        'posts_bytes', posts_size,
        'images_bytes', images_size,
        'documents_bytes', docs_size,
        'limit_bytes', 1073741824 -- 1GB limit
    );

    RETURN result;
EXCEPTION WHEN OTHERS THEN
    -- Fallback in caso di errore interno
    RETURN jsonb_build_object(
        'total_bytes', 1024,
        'error', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_storage_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_storage_usage(UUID) TO service_role;
