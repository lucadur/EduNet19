# ✅ TUTTO PRONTO - ESEGUI QUESTO SQL

## 🎯 Copia e Incolla nell'SQL Editor di Supabase

```sql
-- ===================================================================
-- CREA RECORD PRIVATE USER - Esegui tutto insieme
-- ===================================================================

-- 1. Crea il record (SENZA email che non esiste)
INSERT INTO private_users (
  id,
  first_name,
  last_name,
  created_at,
  updated_at
)
VALUES (
  '6713ef77-ea20-44ce-b58b-80951af7740a',
  'Nome',      -- ⚠️ CAMBIA CON IL TUO NOME
  'Cognome',   -- ⚠️ CAMBIA CON IL TUO COGNOME
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Crea policy UPDATE
DROP POLICY IF EXISTS "Users can update own profile" ON private_users;
CREATE POLICY "Users can update own profile"
ON private_users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Crea policy SELECT
DROP POLICY IF EXISTS "Users can view own profile" ON private_users;
CREATE POLICY "Users can view own profile"
ON private_users FOR SELECT
USING (auth.uid() = id);

-- 4. Abilita RLS
ALTER TABLE private_users ENABLE ROW LEVEL SECURITY;

-- 5. Verifica tutto OK
SELECT 
  'Record exists' as check_name,
  CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '❌ MANCA' END as status
FROM private_users
WHERE id = '6713ef77-ea20-44ce-b58b-80951af7740a'
UNION ALL
SELECT 
  'UPDATE policy',
  CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '❌ MANCA' END
FROM pg_policies
WHERE tablename = 'private_users' AND cmd = 'UPDATE'
UNION ALL
SELECT 
  'SELECT policy',
  CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '❌ MANCA' END
FROM pg_policies
WHERE tablename = 'private_users' AND cmd = 'SELECT';
```

## ⚠️ IMPORTANTE

**Sostituisci:**
- `'Nome'` con il tuo nome reale
- `'Cognome'` con il tuo cognome reale

## ✅ Dopo l'SQL

1. Ricarica edit-profile.html
2. Carica avatar e cover
3. Salva
4. Funziona! 🎉

## 🔍 Verifica Risultato

Dovresti vedere 3 righe con `✅ OK`:
- ✅ Record exists
- ✅ UPDATE policy
- ✅ SELECT policy

**Se vedi tutti ✅ OK, sei pronto! 🚀**
