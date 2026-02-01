-- ===================================================================
-- FIX: Pubblica tutti i post esistenti
-- ===================================================================

-- Aggiorna tutti i post in institute_posts per renderli visibili
UPDATE public.institute_posts
SET 
  published = true,
  published_at = COALESCE(published_at, created_at) -- Usa created_at se published_at è NULL
WHERE published IS NULL OR published = false;

-- ===================================================================
-- VERIFICA
-- ===================================================================

DO $$
DECLARE
  total_posts INT;
  published_posts INT;
BEGIN
  SELECT COUNT(*) INTO total_posts FROM public.institute_posts;
  SELECT COUNT(*) INTO published_posts FROM public.institute_posts WHERE published = true;
  
  RAISE NOTICE '✅ Post pubblicati con successo!';
  RAISE NOTICE '';
  RAISE NOTICE 'Totale post: %', total_posts;
  RAISE NOTICE 'Post pubblicati: %', published_posts;
  RAISE NOTICE '';
  
  IF total_posts = published_posts THEN
    RAISE NOTICE '🎉 Tutti i post sono ora visibili nel feed!';
  ELSE
    RAISE NOTICE '⚠️  Alcuni post non sono pubblicati: %', (total_posts - published_posts);
  END IF;
END $$;
