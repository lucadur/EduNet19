-- ============================================
-- QUERY SEMPLICE: Solo email e tipo utente
-- ============================================
SELECT 
    au.id as user_id,
    au.email,
    au.created_at as data_registrazione,
    up.user_type as tipo_utente
FROM 
    auth.users au
LEFT JOIN 
    public.user_profiles up ON au.id = up.id
ORDER BY 
    au.created_at DESC;

-- ============================================
-- QUERY CON NOMI: Email + Nome + Cognome
-- ============================================
SELECT 
    au.email,
    pu.first_name as nome,
    pu.last_name as cognome,
    up.user_type as tipo,
    au.created_at as registrato_il
FROM 
    auth.users au
LEFT JOIN 
    public.user_profiles up ON au.id = up.id
LEFT JOIN 
    public.private_users pu ON au.id = pu.id
ORDER BY 
    au.created_at DESC;

-- ============================================
-- CONTEGGIO UTENTI PER TIPO
-- ============================================
SELECT 
    COALESCE(up.user_type, 'non_specificato') as tipo,
    COUNT(*) as numero_utenti
FROM 
    auth.users au
LEFT JOIN 
    public.user_profiles up ON au.id = up.id
GROUP BY 
    up.user_type
ORDER BY 
    numero_utenti DESC;
