-- Aggiunta esplicita della foreign key tra institute_reviews e user_profiles
-- Questo risolve l'errore "Could not find a relationship"

ALTER TABLE institute_reviews
DROP CONSTRAINT IF EXISTS institute_reviews_reviewer_id_fkey;

ALTER TABLE institute_reviews
ADD CONSTRAINT institute_reviews_reviewer_id_fkey
FOREIGN KEY (reviewer_id)
REFERENCES user_profiles(id)
ON DELETE CASCADE;

-- Ricreiamo anche la cache delle relazioni su Supabase forzando un ricaricamento dello schema
NOTIFY pgrst, 'reload schema';

