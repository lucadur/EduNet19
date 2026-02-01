-- ============================================
-- FIX COMPLETO: Rimuove view e crea funzione sicura
-- ============================================
-- Questo script risolve entrambi gli errori di sicurezza:
-- 1. auth_users_exposed
-- 2. security_definer_view

-- STEP 1: Elimina la view problematica
DROP VIEW IF EXISTS public.institute_admins_view CASCADE;

-- STEP 2: Crea una funzione SECURITY DEFINER sicura
-- Questa funzione restituisce solo i dati necessari senza esporre auth.users
CREATE OR REPLACE FUNCTION public.get_institute_admins(institute_id_param UUID)
RETURNS TABLE (
    admin_id UUID,
    admin_email TEXT,
    admin_role TEXT,
    is_primary BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Verifica che l'utente sia autorizzato a vedere questi dati
    -- (deve essere admin dell'istituto o l'istituto stesso)
    IF NOT EXISTS (
        SELECT 1 FROM public.institute_admins ia
        WHERE ia.institute_id = institute_id_param
        AND ia.admin_id = auth.uid()
    ) AND NOT EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.id = auth.uid()
        AND up.user_type = 'institute'
        AND up.institute_id = institute_id_param
    ) THEN
        RAISE EXCEPTION 'Non autorizzato';
    END IF;

    -- Restituisce solo i dati necessari
    RETURN QUERY
    SELECT 
        ia.admin_id,
        au.email::TEXT as admin_email,
        ia.role::TEXT as admin_role,
        ia.is_primary,
        ia.created_at
    FROM public.institute_admins ia
    JOIN auth.users au ON au.id = ia.admin_id
    WHERE ia.institute_id = institute_id_param
    ORDER BY ia.is_primary DESC, ia.created_at ASC;
END;
$$;

-- STEP 3: Garantisce i permessi corretti
GRANT EXECUTE ON FUNCTION public.get_institute_admins(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_institute_admins(UUID) FROM anon;

-- STEP 4: Commento per documentazione
COMMENT ON FUNCTION public.get_institute_admins IS 
'Restituisce la lista degli admin di un istituto in modo sicuro. 
Accessibile solo agli admin dell''istituto stesso.';
