-- Verifica colonne di tutte le tabelle problematiche

SELECT 'match_actions' as table_name, column_name 
FROM information_schema.columns 
WHERE table_name = 'match_actions' 
ORDER BY ordinal_position;

SELECT 'matches' as table_name, column_name 
FROM information_schema.columns 
WHERE table_name = 'matches' 
ORDER BY ordinal_position;

SELECT 'conversations' as table_name, column_name 
FROM information_schema.columns 
WHERE table_name = 'conversations' 
ORDER BY ordinal_position;
