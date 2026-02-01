# ⚠️ ERRORI COMUNI DURANTE L'IMPORT

## 🔧 SOLUZIONI RAPIDE

### ❌ Errore: "relation storage.policies does not exist"

**File:** 04_STORAGE_BUCKETS_PRODUCTION.sql

**Causa:** `storage.policies` non esiste in Supabase

**Soluzione:** ✅ GIÀ FIXATO! Ricarica il file aggiornato.

---

### ❌ Errore: "duplicate key value violates unique constraint"

**Causa:** Stai cercando di creare qualcosa che esiste già

**Soluzione:**
```sql
-- Usa ON CONFLICT DO NOTHING
INSERT INTO ... ON CONFLICT (id) DO NOTHING;

-- Oppure DROP prima di CREATE
DROP TABLE IF EXISTS nome_tabella CASCADE;
CREATE TABLE ...
```

---

### ❌ Errore: "permission denied for schema public"

**Causa:** Permessi insufficienti

**Soluzione:**
1. Usa il ruolo `postgres` (non `anon`)
2. Oppure esegui come service_role
3. Verifica di essere owner del progetto

---

### ❌ Errore: "function does not exist"

**Causa:** Funzione non ancora creata

**Soluzione:**
```sql
-- Crea la funzione prima
CREATE OR REPLACE FUNCTION nome_funzione() ...

-- Poi crea il trigger
CREATE TRIGGER ...
```

**Ordine corretto:**
1. Esegui 03_FUNCTIONS_TRIGGERS_PRODUCTION.sql
2. Poi esegui altri script che usano quelle funzioni

---

### ❌ Errore: "relation does not exist"

**Causa:** Tabella non ancora creata

**Soluzione:**
Rispetta l'ordine di esecuzione:
1. 01_CORE_TABLES
2. 02_SOCIAL_FEATURES
3. 03_FUNCTIONS_TRIGGERS
4. 04_STORAGE_BUCKETS
5. 05_RLS_POLICIES

---

### ❌ Errore: "violates foreign key constraint"

**Causa:** Stai cercando di creare una tabella child prima della parent

**Soluzione:**
```sql
-- Prima crea la parent
CREATE TABLE user_profiles ...

-- Poi crea la child
CREATE TABLE school_institutes (
  id UUID REFERENCES user_profiles(id) ...
)
```

---

### ❌ Errore: "syntax error at or near"

**Causa:** Errore di sintassi SQL

**Soluzione:**
1. Verifica virgole e parentesi
2. Controlla che non ci siano caratteri strani
3. Copia-incolla attentamente

---

### ❌ Errore: "column does not exist"

**Causa:** Colonna non presente nella tabella

**Soluzione:**
```sql
-- Verifica struttura tabella
\d nome_tabella

-- Oppure
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'nome_tabella';
```

---

### ❌ Errore: "policy already exists"

**Causa:** Policy già creata

**Soluzione:**
```sql
-- Drop prima di creare
DROP POLICY IF EXISTS "nome_policy" ON nome_tabella;
CREATE POLICY "nome_policy" ...
```

---

### ❌ Errore: "trigger already exists"

**Causa:** Trigger già creato

**Soluzione:**
```sql
-- Drop prima di creare
DROP TRIGGER IF EXISTS nome_trigger ON nome_tabella;
CREATE TRIGGER nome_trigger ...
```

---

### ❌ Errore: "bucket already exists"

**Causa:** Bucket storage già creato

**Soluzione:**
1. Vai su Storage → Dashboard
2. Elimina bucket esistente
3. Oppure salta la creazione

---

### ❌ Errore: "extension does not exist"

**Causa:** Estensione PostgreSQL non abilitata

**Soluzione:**
```sql
-- Abilita estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

## 🔄 RESET COMPLETO (Se Tutto Va Male)

Se hai troppi errori e vuoi ricominciare:

```sql
-- ⚠️ ATTENZIONE: Questo elimina TUTTO!

-- Drop tutte le tabelle
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Drop storage buckets (vai su Dashboard)
-- Elimina manualmente: avatars, covers, post-images, gallery

-- Poi ricomincia da 01_CORE_TABLES_PRODUCTION.sql
```

---

## ✅ VERIFICA DOPO OGNI SCRIPT

Dopo ogni script, esegui:

```sql
-- Verifica tabelle create
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verifica funzioni create
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Verifica trigger creati
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

---

## 📝 CHECKLIST TROUBLESHOOTING

- [ ] Ho eseguito gli script nell'ordine corretto?
- [ ] Ho verificato dopo ogni script?
- [ ] Ho le estensioni abilitate?
- [ ] Sto usando il ruolo corretto (postgres)?
- [ ] Ho controllato la console per errori?
- [ ] Ho letto il messaggio di errore completo?
- [ ] Ho cercato l'errore in questa guida?

---

## 🆘 SE HAI ANCORA PROBLEMI

1. **Copia l'errore completo**
2. **Indica quale script stavi eseguendo**
3. **Indica quale riga causa l'errore**
4. **Fammi sapere e ti aiuto!**

---

## 💡 TIPS

- ✅ Esegui uno script alla volta
- ✅ Verifica dopo ogni script
- ✅ Leggi gli errori con attenzione
- ✅ Usa `IF NOT EXISTS` per evitare duplicati
- ✅ Usa `DROP IF EXISTS` per pulire prima
- ✅ Fai backup prima di modifiche importanti
