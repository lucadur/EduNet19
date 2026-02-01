-- ===================================================================
-- EDUNET19 - TABELLE MANCANTI (PRODUCTION)
-- Script 8/8: Ultime 2 Tabelle
-- ===================================================================
-- Esegui DOPO 07_PRIVACY_AUDIT_PRODUCTION.sql
-- ===================================================================

-- ===================================================================
-- 1. POST SHARES (Condivisioni Post)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.post_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.institute_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram', 'email', 'copy_link')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- 2. CONVERSATIONS (Messaggi/Chat) - Opzionale
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participant_1_id, participant_2_id)
);

-- ===================================================================
-- INDICI PER PERFORMANCE
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_post_shares_post ON public.post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_user ON public.post_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_created ON public.post_shares(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON public.conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON public.conversations(participant_2_id);

-- ===================================================================
-- FUNZIONE: Aggiorna contatore shares
-- ===================================================================

CREATE OR REPLACE FUNCTION update_post_shares_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.institute_posts
        SET shares_count = shares_count + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.institute_posts
        SET shares_count = GREATEST(0, shares_count - 1)
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- TRIGGER: Aggiorna contatore shares
-- ===================================================================

DROP TRIGGER IF EXISTS update_post_shares_count_trigger ON public.post_shares;
CREATE TRIGGER update_post_shares_count_trigger
    AFTER INSERT OR DELETE ON public.post_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_post_shares_count();

-- ===================================================================
-- RLS POLICIES
-- ===================================================================

ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policies: post_shares
CREATE POLICY "Shares are viewable by everyone"
ON public.post_shares FOR SELECT USING (true);

CREATE POLICY "Users can create shares"
ON public.post_shares FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies: conversations
CREATE POLICY "Users can view own conversations"
ON public.conversations FOR SELECT 
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT 
WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- ===================================================================
-- VERIFICA FINALE
-- ===================================================================

-- Conta tutte le tabelle
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Dovrebbe essere 31

-- Lista completa
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ===================================================================
-- COMPLETATO!
-- ===================================================================
-- Ora hai tutte le 31 tabelle del progetto originale:
-- 
-- 01_CORE_TABLES: 3 tabelle
-- 02_SOCIAL_FEATURES: 10 tabelle
-- 03_FUNCTIONS_TRIGGERS: 5 funzioni, 13 trigger
-- 04_STORAGE_BUCKETS: 4 buckets
-- 05_RLS_POLICIES: 30+ policies
-- 06_EDUMATCH_TABLES: 9 tabelle
-- 07_PRIVACY_AUDIT: 7 tabelle
-- 08_TABELLE_MANCANTI: 2 tabelle
-- 
-- TOTALE: 31 TABELLE ✅
-- ===================================================================
