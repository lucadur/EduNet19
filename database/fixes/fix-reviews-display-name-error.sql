-- ===================================================================
-- FIX: ERRORE RECENSIONI "column user_profiles.display_name does not exist"
-- ===================================================================
-- Il client JS richiede 'display_name' e 'avatar_url' sulla tabella user_profiles
-- ma questi campi sono distribuiti su school_institutes e private_users.
--
-- Questo script crea delle colonne calcolate (computed columns) su user_profiles
-- che permettono a Supabase di esporre questi campi come se fossero reali.
-- ===================================================================

-- 1. Funzione per display_name (Nome Visualizzato)
CREATE OR REPLACE FUNCTION public.display_name(profile public.user_profiles)
RETURNS text AS $$
  SELECT COALESCE(
    -- Se è un istituto, prendi il nome dell'istituto
    (SELECT institute_name FROM public.school_institutes WHERE id = profile.id),
    -- Se è un privato, prendi nome + cognome
    (SELECT first_name || ' ' || last_name FROM public.private_users WHERE id = profile.id),
    -- Fallback
    'Utente EduNet'
  );
$$ LANGUAGE sql STABLE;

-- 2. Funzione per avatar_url (Immagine Profilo)
CREATE OR REPLACE FUNCTION public.avatar_url(profile public.user_profiles)
RETURNS text AS $$
  SELECT COALESCE(
    -- Se è un istituto, prendi il logo_url
    (SELECT logo_url FROM public.school_institutes WHERE id = profile.id),
    -- Se è un privato, prendi avatar_url
    (SELECT avatar_url FROM public.private_users WHERE id = profile.id)
  );
$$ LANGUAGE sql STABLE;

-- 3. Ricarica lo schema per rendere visibili le modifiche a Supabase
NOTIFY pgrst, 'reload schema';

