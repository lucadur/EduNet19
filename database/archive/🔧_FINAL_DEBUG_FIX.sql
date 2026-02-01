-- ===================================================================
-- DEBUG E FIX FINALE - Sistema Raccomandazioni
-- ===================================================================

-- 1. Verifica istituti esistenti
SELECT 
  '📊 ISTITUTI NEL DATABASE' as info,
  COUNT(*) as totale
FROM school_institutes;

SELECT 
  id,
  institute_name,
  institute_type,
  city
FROM school_institutes
LIMIT 10;

-- 2. Verifica follow esistenti
SELECT 
  '👥 FOLLOW ESISTENTI' as info,
  COUNT(*) as totale
FROM user_follows;

SELECT 
  follower_id,
  following_id,
  following_type,
  created_at
FROM user_follows
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verifica cache raccomandazioni
SELECT 
  '💾 CACHE RACCOMANDAZIONI' as info,
  COUNT(*) as totale
FROM recommendation_cache;

SELECT 
  user_id,
  recommendations,
  updated_at
FROM recommendation_cache
LIMIT 5;

-- 4. PULISCI CACHE VUOTA (forza rigenerazione)
DELETE FROM recommendation_cache 
WHERE recommendations = '[]'::jsonb 
   OR jsonb_array_length(recommendations) = 0;

-- 5. PULISCI TUTTA LA CACHE (per sicurezza)
DELETE FROM recommendation_cache;

-- 6. Verifica engagement stats
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_matviews WHERE matviewname = 'institute_engagement_stats'
  ) THEN
    PERFORM refresh_engagement_stats();
    RAISE NOTICE '✅ Engagement stats refreshed';
  ELSE
    RAISE NOTICE '⚠️  Materialized view institute_engagement_stats non esiste';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Errore refresh stats: %', SQLERRM;
END $$;

-- 7. Mostra statistiche finali
DO $$
DECLARE
  inst_count INTEGER;
  follow_count INTEGER;
  cache_count INTEGER;
  post_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inst_count FROM school_institutes;
  SELECT COUNT(*) INTO follow_count FROM user_follows;
  SELECT COUNT(*) INTO cache_count FROM recommendation_cache;
  SELECT COUNT(*) INTO post_count FROM institute_posts WHERE published = true;
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║  📊 STATO SISTEMA RACCOMANDAZIONI     ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '  Istituti:        %', inst_count;
  RAISE NOTICE '  Post pubblicati: %', post_count;
  RAISE NOTICE '  Follow attivi:   %', follow_count;
  RAISE NOTICE '  Cache entries:   %', cache_count;
  RAISE NOTICE '';
  
  IF inst_count = 0 THEN
    RAISE NOTICE '❌ PROBLEMA: Nessun istituto nel database!';
    RAISE NOTICE '   Soluzione: Registra almeno 3-4 istituti';
  ELSIF inst_count < 3 THEN
    RAISE NOTICE '⚠️  ATTENZIONE: Solo % istituti trovati', inst_count;
    RAISE NOTICE '   Consiglio: Registra altri istituti per migliori raccomandazioni';
  ELSE
    RAISE NOTICE '✅ Database OK: % istituti disponibili', inst_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Prossimi passi:';
  RAISE NOTICE '   1. Ricarica homepage (Ctrl+F5)';
  RAISE NOTICE '   2. Controlla console per "Generated X recommendations"';
  RAISE NOTICE '   3. Se ancora 0, verifica che tu NON sia un istituto';
  RAISE NOTICE '      (il sistema suggerisce istituti agli utenti privati)';
  RAISE NOTICE '';
END $$;
