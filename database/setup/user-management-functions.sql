
-- ===================================================================
-- FUNZIONI DI GESTIONE UTENTE (SELF-SERVICE)
-- ===================================================================

-- 1. Funzione per eliminare il proprio account (Auth + Dati)
-- Questa funzione permette a un utente autenticato di eliminare il proprio account
-- Viene eseguita con privilegi elevati (SECURITY DEFINER) per accedere ad auth.users
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Ottieni ID utente corrente
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Utente non autenticato';
  END IF;

  -- L'eliminazione da auth.users attiverà ON DELETE CASCADE su:
  -- 1. public.user_profiles (e tutte le tabelle collegate come school_institutes, posts, ecc.)
  -- 2. storage.objects (se configurato, altrimenti rimangono orfani, ma il client JS li pulisce prima)
  
  DELETE FROM auth.users WHERE id = current_user_id;
  
  -- Se arriviamo qui, l'utente è stato eliminato
END;
$$;

-- Permessi
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- Commento: Assicurarsi che la foreign key in user_profiles sia ON DELETE CASCADE
-- ALTER TABLE public.user_profiles DROP CONSTRAINT user_profiles_id_fkey;
-- ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

