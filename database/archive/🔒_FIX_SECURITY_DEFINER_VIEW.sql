-- ===================================================================
-- FIX SECURITY DEFINER VIEW
-- Risolve il warning sulla view institute_admins_view
-- ===================================================================

-- Drop e ricrea la view senza SECURITY DEFINER
DROP VIEW IF EXISTS institute_admins_view CASCADE;

CREATE VIEW institute_admins_view AS
SELECT 
  ia.id,
  ia.institute_id,
  ia.user_id,
  ia.role,
  ia.invited_by,
  ia.invited_at,
  ia.accepted_at,
  ia.status,
  ia.created_at,
  ia.updated_at,
  -- Informazioni utente
  au.email as user_email,
  COALESCE(pu.first_name || ' ' || pu.last_name, 'Unknown') as user_name,
  -- Informazioni istituto
  si.institute_name,
  si.institute_type
FROM institute_admins ia
LEFT JOIN auth.users au ON au.id = ia.user_id
LEFT JOIN private_users pu ON pu.id = ia.user_id
LEFT JOIN school_institutes si ON si.id = ia.institute_id;

-- Aggiungi commento
COMMENT ON VIEW institute_admins_view IS 'View per visualizzare gli amministratori degli istituti con informazioni correlate';

-- ===================================================================
-- VERIFICA
-- ===================================================================

-- Verifica che la view sia stata creata
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'institute_admins_view';

-- Test query
SELECT * FROM institute_admins_view LIMIT 5;

-- ===================================================================
-- NOTA
-- ===================================================================
-- La view ora usa SECURITY INVOKER (default) invece di SECURITY DEFINER
-- Questo significa che le permissions RLS vengono applicate in base
-- all'utente che esegue la query, non al creatore della view
-- ===================================================================
