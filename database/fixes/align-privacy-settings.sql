-- ===================================================================
-- FIX: ALLINEAMENTO SCHEMA PRIVACY SETTINGS
-- Aggiunge le colonne mancanti alla tabella user_privacy_settings
-- per supportare tutte le funzionalità della UI Impostazioni
-- ===================================================================

-- 1. Aggiunta colonne per Visibilità e Interazione
ALTER TABLE public.user_privacy_settings
ADD COLUMN IF NOT EXISTS posts_visibility VARCHAR(20) DEFAULT 'public' CHECK (posts_visibility IN ('public', 'followers', 'network', 'private')),
ADD COLUMN IF NOT EXISTS comments_permission VARCHAR(20) DEFAULT 'everyone' CHECK (comments_permission IN ('everyone', 'followers', 'none')),
ADD COLUMN IF NOT EXISTS searchable_by_email BOOLEAN DEFAULT TRUE;

-- 2. Aggiunta colonne per Notifiche Email
ALTER TABLE public.user_privacy_settings
ADD COLUMN IF NOT EXISTS email_new_posts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_followers BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_comments BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_matches BOOLEAN DEFAULT TRUE;

-- 3. Aggiunta colonne per Notifiche Push e Suoni
ALTER TABLE public.user_privacy_settings
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notification_sounds BOOLEAN DEFAULT TRUE;

-- 4. Aggiunta colonne per Preferenze UI (migrazione da JSONB)
ALTER TABLE public.user_privacy_settings
ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
ADD COLUMN IF NOT EXISTS font_size VARCHAR(20) DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
ADD COLUMN IF NOT EXISTS autoplay_videos BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS data_saver_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'it';

-- 5. Aggiunta colonne Sicurezza aggiuntive
ALTER TABLE public.user_privacy_settings
ADD COLUMN IF NOT EXISTS social_login_enabled BOOLEAN DEFAULT FALSE;

-- 6. Aggiornamento commenti colonne
COMMENT ON COLUMN public.user_privacy_settings.posts_visibility IS 'Chi può vedere i post: public, followers, network, private';
COMMENT ON COLUMN public.user_privacy_settings.comments_permission IS 'Chi può commentare: everyone, followers, none';

-- 7. Creazione indice per performance sui nuovi campi
CREATE INDEX IF NOT EXISTS idx_privacy_posts_visibility ON public.user_privacy_settings(user_id, posts_visibility);

