-- ===================================================================
-- FIX: ERRORE CARICAMENTO "RECENSIONI INVIATE" (Error 400)
-- ===================================================================
-- Il client JS cerca di fare una join tra 'institute_reviews' e 'school_institutes'
-- usando la foreign key esplicita 'institute_reviews_reviewed_institute_id_fkey'.
-- 
-- Attualmente, questa foreign key probabilmente punta a 'user_profiles' (o non esiste con questo nome),
-- impedendo a PostgREST di risolvere la relazione con 'school_institutes'.
--
-- Questo script:
-- 1. Rimuove la vecchia FK (se esiste)
-- 2. Crea la FK corretta che punta esplicitamente a 'school_institutes'
-- ===================================================================

-- 1. Rimuovi la vecchia constraint se esiste
ALTER TABLE public.institute_reviews
DROP CONSTRAINT IF EXISTS institute_reviews_reviewed_institute_id_fkey;

-- 2. Aggiungi la nuova constraint che punta a school_institutes
ALTER TABLE public.institute_reviews
ADD CONSTRAINT institute_reviews_reviewed_institute_id_fkey
FOREIGN KEY (reviewed_institute_id)
REFERENCES public.school_institutes(id)
ON DELETE CASCADE;

-- 3. Ricarica lo schema per rendere effettive le modifiche su Supabase API
NOTIFY pgrst, 'reload schema';

