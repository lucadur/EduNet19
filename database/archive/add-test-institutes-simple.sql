-- ===================================================================
-- AGGIUNGI ISTITUTI DI TEST (VERSIONE SEMPLICE)
-- Usa gli istituti già esistenti nel database
-- ===================================================================

-- Verifica quanti istituti esistono già
DO $$
DECLARE
  institute_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO institute_count FROM school_institutes;
  RAISE NOTICE 'Istituti esistenti nel database: %', institute_count;
END $$;

-- Se ci sono già istituti, aggiungi solo post per engagement
-- Altrimenti mostra messaggio
DO $$
DECLARE
  institute_count INTEGER;
  institute_record RECORD;
BEGIN
  SELECT COUNT(*) INTO institute_count FROM school_institutes;
  
  IF institute_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  NESSUN ISTITUTO TROVATO!';
    RAISE NOTICE '';
    RAISE NOTICE 'Per vedere le raccomandazioni, devi prima:';
    RAISE NOTICE '1. Registrare alcuni istituti tramite la pagina di registrazione';
    RAISE NOTICE '2. Oppure usare gli istituti già registrati';
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ Trovati % istituti nel database', institute_count;
    RAISE NOTICE '';
    
    -- Aggiungi post per i primi 6 istituti per aumentare engagement
    FOR institute_record IN 
      SELECT id, institute_name FROM school_institutes LIMIT 6
    LOOP
      -- Inserisci un post per questo istituto
      INSERT INTO institute_posts (
        institute_id,
        post_type,
        title,
        content,
        tags,
        published,
        likes_count,
        comments_count,
        shares_count,
        created_at
      ) VALUES (
        institute_record.id,
        'notizia',
        'Benvenuti al ' || institute_record.institute_name,
        'Siamo lieti di presentarvi la nostra scuola!',
        ARRAY['benvenuto', 'presentazione', 'scuola'],
        true,
        FLOOR(RANDOM() * 30 + 10)::INTEGER,
        FLOOR(RANDOM() * 10 + 2)::INTEGER,
        FLOOR(RANDOM() * 5 + 1)::INTEGER,
        NOW() - (RANDOM() * INTERVAL '7 days')
      )
      ON CONFLICT DO NOTHING;
      
      RAISE NOTICE '  ✓ Post aggiunto per: %', institute_record.institute_name;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Post aggiunti con successo!';
  END IF;
END $$;

-- Clear cache per rigenerare raccomandazioni
DELETE FROM recommendation_cache;

-- Refresh engagement stats se la vista esiste
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_matviews WHERE matviewname = 'institute_engagement_stats'
  ) THEN
    PERFORM refresh_engagement_stats();
    RAISE NOTICE '✅ Engagement stats aggiornate';
  END IF;
END $$;

-- Mostra statistiche finali
DO $$
DECLARE
  institute_count INTEGER;
  post_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO institute_count FROM school_institutes;
  SELECT COUNT(*) INTO post_count FROM institute_posts WHERE published = true;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║  📊 STATISTICHE DATABASE              ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '  Istituti totali: %', institute_count;
  RAISE NOTICE '  Post pubblicati: %', post_count;
  RAISE NOTICE '';
  
  IF institute_count > 0 THEN
    RAISE NOTICE '🚀 Ora ricarica la homepage!';
    RAISE NOTICE '   Dovresti vedere suggerimenti nella sidebar';
    RAISE NOTICE '   e nella sezione "Scopri"';
  ELSE
    RAISE NOTICE '⚠️  Registra alcuni istituti per vedere le raccomandazioni';
  END IF;
  RAISE NOTICE '';
END $$;
