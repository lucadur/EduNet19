
-- ===================================================================
-- SESSION TRACKING SYSTEM
-- Tabella per tracciare i dispositivi/sessioni attive degli utenti
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.user_active_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    device_id VARCHAR(100) NOT NULL, -- ID univoco generato dal client (localStorage)
    device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
    device_name VARCHAR(255), -- es. 'Chrome su Windows 10'
    browser VARCHAR(100),
    os VARCHAR(100),
    ip_address VARCHAR(45),
    location VARCHAR(255), -- Opzionale: Città, Paese
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_current BOOLEAN DEFAULT FALSE, -- Campo calcolato/aggiornato lato client solo per visualizzazione
    UNIQUE(user_id, device_id)
);

-- Abilita RLS
ALTER TABLE public.user_active_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Utenti vedono solo le proprie sessioni
CREATE POLICY "Users can view own sessions"
    ON public.user_active_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Utenti possono inserire le proprie sessioni
CREATE POLICY "Users can insert own sessions"
    ON public.user_active_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Utenti possono aggiornare le proprie sessioni
CREATE POLICY "Users can update own sessions"
    ON public.user_active_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Utenti possono cancellare le proprie sessioni
CREATE POLICY "Users can delete own sessions"
    ON public.user_active_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.user_active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON public.user_active_sessions(last_active DESC);

