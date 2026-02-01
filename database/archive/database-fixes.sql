-- Database Fixes per EduNet19
-- Esegui questi comandi nel SQL Editor di Supabase per risolvere i warning di sicurezza

-- =====================================================
-- 1. CORREZIONE FUNZIONI CON SEARCH_PATH MUTABILE
-- =====================================================

-- Correggi la funzione update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Correggi la funzione update_post_counters
CREATE OR REPLACE FUNCTION public.update_post_counters()
RETURNS TRIGGER 
SET search_path = ''
AS $$
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

-- =====================================================
-- 2. SPOSTAMENTO ESTENSIONE PG_TRGM
-- =====================================================

-- Crea lo schema extensions se non esiste
CREATE SCHEMA IF NOT EXISTS extensions;

-- Sposta l'estensione pg_trgm dal public schema
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- =====================================================
-- 3. VERIFICA TABELLE E PERMESSI
-- =====================================================

-- Verifica che le tabelle esistano e abbiano i permessi corretti
DO $$
BEGIN
    -- Verifica user_profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        RAISE NOTICE 'Tabella user_profiles non trovata - creazione necessaria';
    END IF;
    
    -- Verifica school_institutes
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'school_institutes') THEN
        RAISE NOTICE 'Tabella school_institutes non trovata - creazione necessaria';
    END IF;
END $$;

-- =====================================================
-- 4. CORREZIONE POLICY RLS
-- =====================================================

-- Assicurati che RLS sia abilitato
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_institutes ENABLE ROW LEVEL SECURITY;

-- Policy per user_profiles - permetti inserimento durante registrazione
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy per school_institutes - permetti inserimento durante registrazione
DROP POLICY IF EXISTS "Institutes can insert own data" ON public.school_institutes;
CREATE POLICY "Institutes can insert own data" ON public.school_institutes
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy per lettura profili
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy per aggiornamento profili
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- 5. VERIFICA FINALE
-- =====================================================

-- Mostra lo stato delle tabelle
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'school_institutes')
ORDER BY tablename;

-- Mostra le policy attive
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'school_institutes')
ORDER BY tablename, policyname;