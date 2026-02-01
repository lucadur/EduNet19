
-- ===================================================================
-- SISTEMA DI GESTIONE SESSIONI SICURE
-- ===================================================================

-- 1. Tabella per metadati sessione (User Agent, IP, ecc. che auth.sessions non ha)
CREATE TABLE IF NOT EXISTS public.session_metadata (
    session_id UUID PRIMARY KEY, -- Corrisponde a auth.sessions.id
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    os_name VARCHAR(50),
    browser_name VARCHAR(50),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Abilita RLS
ALTER TABLE public.session_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Utente può vedere solo le sue sessioni
CREATE POLICY "Users can view own session metadata" 
ON public.session_metadata FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy: Utente può inserire/aggiornare i propri metadati
CREATE POLICY "Users can upsert own session metadata" 
ON public.session_metadata FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session metadata" 
ON public.session_metadata FOR UPDATE
TO authenticated 
USING (auth.uid() = user_id);

-- Policy: Utente può cancellare i propri metadati
CREATE POLICY "Users can delete own session metadata" 
ON public.session_metadata FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);


-- 2. Funzione Sicura per Terminare una Sessione
-- Questa funzione permette all'utente di cancellare una sessione specifica da auth.sessions
DROP FUNCTION IF EXISTS public.terminate_session(UUID);

CREATE OR REPLACE FUNCTION public.terminate_session(target_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Necessario per accedere a auth.sessions
SET search_path = auth, public, pg_temp
AS $$
DECLARE
    requesting_user_id UUID;
BEGIN
    -- Ottieni ID utente corrente
    requesting_user_id := auth.uid();
    
    IF requesting_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Cancella da auth.sessions SOLO se appartiene all'utente
    DELETE FROM auth.sessions 
    WHERE id = target_session_id AND user_id = requesting_user_id;

    -- Cancella anche i metadati (anche se il cascade dovrebbe gestirlo se usassimo FK su auth.sessions, ma auth schema è protetto)
    DELETE FROM public.session_metadata 
    WHERE session_id = target_session_id;

    RETURN FOUND; -- Ritorna TRUE se è stata cancellata una riga
END;
$$;

-- Permessi funzione
GRANT EXECUTE ON FUNCTION public.terminate_session(UUID) TO authenticated;


-- 3. Funzione per ottenere tutte le sessioni attive con metadati
DROP FUNCTION IF EXISTS public.get_my_sessions();

CREATE OR REPLACE FUNCTION public.get_my_sessions()
RETURNS TABLE (
    session_id UUID,
    created_at TIMESTAMPTZ,
    last_active TIMESTAMPTZ,
    user_agent TEXT,
    ip_address TEXT,
    device_type TEXT,
    os_name TEXT,
    browser_name TEXT,
    is_current BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, pg_temp
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();

    RETURN QUERY
    SELECT 
        s.id AS session_id,
        s.created_at,
        COALESCE(m.last_active, s.updated_at) as last_active,
        m.user_agent,
        m.ip_address,
        m.device_type,
        m.os_name,
        m.browser_name,
        FALSE as is_current -- Il frontend determinerà quale è la corrente basandosi sul token
    FROM auth.sessions s
    LEFT JOIN public.session_metadata m ON s.id = m.session_id
    WHERE s.user_id = current_user_id
    ORDER BY s.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_sessions() TO authenticated;

