-- =====================================================
-- RESTRIZIONI PERMESSI UTENTI PRIVATI
-- =====================================================
-- Questo script implementa le restrizioni per gli utenti privati:
-- 1. Blocca inserimento commenti da utenti privati
-- 2. Blocca creazione post da utenti privati
-- 3. Mantiene la possibilità di salvare post
-- =====================================================

-- =====================================================
-- 1. FUNZIONE HELPER: Verifica se l'utente è un istituto
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_institute_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_type_val TEXT;
BEGIN
    SELECT user_type INTO user_type_val
    FROM public.user_profiles
    WHERE id = user_id;
    
    RETURN user_type_val = 'istituto';
END;
$$;

-- =====================================================
-- 2. RLS POLICY: Blocca commenti da utenti privati
-- =====================================================

-- Prima rimuovi policy esistenti se presenti
DROP POLICY IF EXISTS "Only institutes can insert comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON public.post_comments;

-- Crea nuova policy che permette solo agli istituti di commentare
CREATE POLICY "Only institutes can insert comments"
ON public.post_comments
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() 
    AND public.is_institute_user(auth.uid())
);

-- Policy per SELECT (tutti possono leggere i commenti)
DROP POLICY IF EXISTS "Anyone can read comments" ON public.post_comments;
CREATE POLICY "Anyone can read comments"
ON public.post_comments
FOR SELECT
TO authenticated
USING (true);

-- Policy per UPDATE (solo il proprietario può modificare)
DROP POLICY IF EXISTS "Users can update own comments" ON public.post_comments;
CREATE POLICY "Users can update own comments"
ON public.post_comments
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy per DELETE (solo il proprietario può eliminare)
DROP POLICY IF EXISTS "Users can delete own comments" ON public.post_comments;
CREATE POLICY "Users can delete own comments"
ON public.post_comments
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- 3. RLS POLICY: Blocca creazione post da utenti privati
-- =====================================================

-- Prima rimuovi policy esistenti se presenti
DROP POLICY IF EXISTS "Only institutes can insert posts" ON public.institute_posts;
DROP POLICY IF EXISTS "Institutes can insert own posts" ON public.institute_posts;

-- Crea nuova policy che permette solo agli istituti di creare post
CREATE POLICY "Only institutes can insert posts"
ON public.institute_posts
FOR INSERT
TO authenticated
WITH CHECK (
    institute_id = auth.uid() 
    AND public.is_institute_user(auth.uid())
);

-- Policy per SELECT (tutti possono leggere i post pubblicati)
DROP POLICY IF EXISTS "Anyone can read published posts" ON public.institute_posts;
CREATE POLICY "Anyone can read published posts"
ON public.institute_posts
FOR SELECT
TO authenticated
USING (published = true OR institute_id = auth.uid());

-- Policy per UPDATE (solo il proprietario può modificare)
DROP POLICY IF EXISTS "Institutes can update own posts" ON public.institute_posts;
CREATE POLICY "Institutes can update own posts"
ON public.institute_posts
FOR UPDATE
TO authenticated
USING (institute_id = auth.uid())
WITH CHECK (institute_id = auth.uid());

-- Policy per DELETE (solo il proprietario può eliminare)
DROP POLICY IF EXISTS "Institutes can delete own posts" ON public.institute_posts;
CREATE POLICY "Institutes can delete own posts"
ON public.institute_posts
FOR DELETE
TO authenticated
USING (institute_id = auth.uid());

-- =====================================================
-- 4. VERIFICA: Mantieni policy per saved_posts (utenti privati possono salvare)
-- =====================================================

-- Gli utenti privati POSSONO salvare post
DROP POLICY IF EXISTS "Users can manage own saved posts" ON public.saved_posts;
CREATE POLICY "Users can manage own saved posts"
ON public.saved_posts
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 5. ABILITA RLS sulle tabelle (se non già abilitato)
-- =====================================================
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RIEPILOGO PERMESSI
-- =====================================================
-- 
-- UTENTI PRIVATI:
-- ✅ Possono leggere post e commenti
-- ✅ Possono salvare post (saved_posts)
-- ✅ Possono mettere like ai post
-- ❌ NON possono creare post
-- ❌ NON possono commentare
--
-- ISTITUTI:
-- ✅ Possono fare tutto (leggere, creare, commentare, salvare)
-- =====================================================

COMMENT ON FUNCTION public.is_institute_user IS 'Verifica se un utente è di tipo istituto';
