-- Aggiunge la colonna preferenze alla tabella user_profiles se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'preferences') THEN
        ALTER TABLE public.user_profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Aggiorna i permessi per assicurarsi che l'utente possa modificare le proprie preferenze
-- Nota: Solitamente le policy RLS già esistenti coprono UPDATE su own rows, ma verifichiamo
-- Questo è un controllo di sicurezza generico
GRANT UPDATE (preferences) ON public.user_profiles TO authenticated;
