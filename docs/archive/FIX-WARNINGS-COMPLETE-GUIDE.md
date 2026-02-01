# 🔧 GUIDA COMPLETA: Risolvere Warning Database Supabase

## 📋 Warning Identificati

Hai **19 warning totali**:
- ✅ **18 warning** `function_search_path_mutable` → **Risolvibili con SQL**
- ⚠️ **1 warning** `auth_leaked_password_protection` → **Risolvibile da Dashboard**

---

## 🚀 SOLUZIONE RAPIDA (5 minuti)

### Step 1: Correggi Funzioni (2 minuti)

**Esegui questo script nel SQL Editor di Supabase:**

```sql
-- Copia e incolla il contenuto di:
fix-all-functions-automatic.sql
```

Questo script usa `ALTER FUNCTION` per aggiungere `SET search_path = public, pg_temp` a tutte le 18 funzioni **senza doverle riscrivere**.

### Step 2: Abilita Protezione Password (3 minuti)

1. **Vai su Supabase Dashboard**
2. **Clicca su "Authentication"** nel menu laterale
3. **Vai su "Policies"** o "Password Settings"
4. **Cerca "Leaked Password Protection"**
5. **Attiva l'opzione** (toggle ON)
6. **Salva**

---

## 📝 DETTAGLIO: Warning function_search_path_mutable

### Cos'è?

Quando una funzione PostgreSQL non ha `search_path` esplicitamente impostato, può essere vulnerabile a **"search path injection attacks"**.

**Esempio problema:**
```sql
-- ❌ VULNERABILE
CREATE FUNCTION my_function() 
RETURNS void AS $$
BEGIN
  -- Se un utente crea una tabella "users" nel loro schema,
  -- questa funzione potrebbe usare quella invece della public.users
  SELECT * FROM users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Soluzione:**
```sql
-- ✅ SICURO
CREATE FUNCTION my_function() 
RETURNS void AS $$
BEGIN
  SELECT * FROM users;  -- Usa sempre public.users
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp;  -- ← FIX
```

### Perché è importante?

Le funzioni con `SECURITY DEFINER` (come le nostre) vengono eseguite con i **permessi del creatore**, non dell'utente. Senza `search_path` esplicito, un attaccante potrebbe:

1. Creare uno schema personale
2. Creare tabelle/funzioni con nomi comuni
3. Quando la funzione vulnerabile viene eseguita, usa le sue tabelle fake
4. **Bypass delle security policies**

### Funzioni da Correggere

**Privacy Functions (create nel mio schema):**
- ✅ `update_updated_at_column`
- ✅ `get_user_privacy_settings`
- ✅ `is_profile_visible`
- ✅ `is_post_visible`
- ✅ `can_comment_on_post`
- ✅ `create_default_privacy_settings`
- ✅ `cleanup_deleted_accounts`
- ✅ `cleanup_old_sessions`
- ✅ `cleanup_expired_exports`

**Existing Functions (già presenti):**
- ✅ `update_engagement_pattern`
- ✅ `update_interaction_style`
- ✅ `get_recommended_profiles`
- ✅ `save_match_prediction`
- ✅ `init_user_match_weights`
- ✅ `count_saved_posts`
- ✅ `is_post_saved`
- ✅ `is_user_muted`
- ✅ `is_post_hidden`

---

## 🔐 DETTAGLIO: Warning auth_leaked_password_protection

### Cos'è?

Supabase può verificare se una password è stata **compromessa** (leaked) controllando contro il database **HaveIBeenPwned.org** che contiene **oltre 600 milioni di password compromesse**.

### Perché è disabilitato?

Di default è disabilitato perché:
- Richiede una chiamata API esterna
- Può rallentare leggermente la registrazione
- Alcuni utenti potrebbero avere privacy concerns

### Come Abilitarlo?

#### Opzione 1: Via Dashboard (Consigliato)

1. **Apri Supabase Dashboard**
2. **Vai su "Authentication"**
3. **Clicca "Settings"** o "Policies"
4. **Cerca sezione "Password Requirements"** o "Security"
5. **Trova "Leaked Password Protection"**
6. **Attiva il toggle** ✅
7. **Salva modifiche**

#### Opzione 2: Via API (Per automazione)

```bash
# Usando Supabase Management API
curl -X PATCH \
  'https://api.supabase.com/v1/projects/{project-ref}/config/auth' \
  -H "Authorization: Bearer {service-role-key}" \
  -H "Content-Type: application/json" \
  -d '{
    "password_required_characters": ["lower", "upper", "number"],
    "leaked_password_protection": true
  }'
```

#### Opzione 3: Ignora (Se non necessario)

Se decidi di NON abilitarlo:
- Il warning rimarrà
- Non è critico per la sicurezza (solo raccomandato)
- Dipende dai tuoi requisiti di sicurezza

---

## ✅ VERIFICA CORREZIONI

### Verifica Funzioni Corrette

Esegui nel SQL Editor:

```sql
-- Lista funzioni con status search_path
SELECT 
    p.proname AS "Funzione",
    CASE 
        WHEN p.proconfig IS NOT NULL THEN '✅ Corretto'
        ELSE '❌ Manca search_path'
    END AS "Status",
    COALESCE(
        (SELECT setting FROM unnest(p.proconfig) AS setting 
         WHERE setting LIKE 'search_path=%'),
        '❌ Not set'
    ) AS "search_path Config"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'update_updated_at_column',
    'get_user_privacy_settings',
    'is_profile_visible',
    'is_post_visible',
    'can_comment_on_post',
    'create_default_privacy_settings',
    'cleanup_deleted_accounts',
    'cleanup_old_sessions',
    'cleanup_expired_exports',
    'update_engagement_pattern',
    'update_interaction_style',
    'get_recommended_profiles',
    'save_match_prediction',
    'init_user_match_weights',
    'count_saved_posts',
    'is_post_saved',
    'is_user_muted',
    'is_post_hidden'
)
ORDER BY 
    CASE WHEN p.proconfig IS NOT NULL THEN 1 ELSE 0 END DESC,
    p.proname;
```

**Output atteso:**
```
Funzione                          | Status      | search_path Config
----------------------------------|-------------|--------------------
can_comment_on_post               | ✅ Corretto | search_path=public, pg_temp
cleanup_deleted_accounts          | ✅ Corretto | search_path=public, pg_temp
cleanup_expired_exports           | ✅ Corretto | search_path=public, pg_temp
...
(18 righe totali, tutte con ✅)
```

### Verifica nel Database Linter

1. **Vai su Dashboard Supabase**
2. **Clicca "Database"**
3. **Clicca "Linter"** (o "Advisors")
4. **Clicca "Refresh"** o "Run Linter Again"
5. **Verifica che i warning siano spariti**

**Prima:**
```
⚠️ 18 warnings function_search_path_mutable
⚠️ 1 warning auth_leaked_password_protection
───────────────────────────────────────────
Total: 19 warnings
```

**Dopo (con password protection abilitata):**
```
✅ No warnings found
───────────────────────────────────────────
Database is secure and optimized!
```

**Dopo (senza password protection):**
```
⚠️ 1 warning auth_leaked_password_protection
───────────────────────────────────────────
Total: 1 warning (opzionale)
```

---

## 📊 FILE FORNITI

### 1. `fix-all-functions-automatic.sql` ⭐ **CONSIGLIATO**

**Usa questo!** Script automatico che corregge tutte le funzioni con `ALTER FUNCTION`.

**Vantaggi:**
- ✅ Non devi riscrivere le funzioni
- ✅ Mantiene la logica esistente
- ✅ Veloce (1 minuto)
- ✅ Sicuro

**Uso:**
```bash
1. Apri SQL Editor Supabase
2. Copia contenuto fix-all-functions-automatic.sql
3. Incolla e Run
4. Verifica output
```

### 2. `fix-privacy-functions-warnings.sql`

Corregge **solo** le 9 funzioni privacy (create nel mio schema). Usa `CREATE OR REPLACE`.

**Quando usarlo:**
- Se vuoi correggere solo le funzioni privacy
- Se vuoi vedere il codice completo delle funzioni

### 3. `fix-all-functions-search-path.sql`

Template per riscrivere TUTTE le funzioni. **NON consigliato** perché richiede recuperare la logica originale.

**Quando usarlo:**
- Solo se `ALTER FUNCTION` non funziona (raro)
- Come riferimento

---

## 🎯 PIANO D'AZIONE CONSIGLIATO

### Step-by-Step (10 minuti totali)

#### 1. Correggi Funzioni (2 min) ⚡

```bash
# Nel SQL Editor Supabase:
1. Apri fix-all-functions-automatic.sql
2. Copia tutto
3. Incolla nel SQL Editor
4. Clicca "Run"
5. Verifica messaggio: "✅ TUTTE LE FUNZIONI CORRETTE"
```

#### 2. Verifica Correzione (2 min) 🔍

```sql
-- Esegui query verifica (fornita nel file)
SELECT proname, proconfig FROM pg_proc ...

-- Dovresti vedere search_path per tutte le 18 funzioni
```

#### 3. Refresh Linter (1 min) 🔄

```bash
1. Dashboard > Database > Linter
2. Clicca "Refresh" o "Run Again"
3. Verifica: 18 warning spariti ✅
```

#### 4. Abilita Password Protection (3 min) 🔐

```bash
1. Dashboard > Authentication > Settings
2. Trova "Leaked Password Protection"
3. Attiva (toggle ON)
4. Salva
5. Refresh Linter
6. Verifica: 0 warnings ✅
```

#### 5. Verifica Finale (2 min) ✅

```bash
1. Dashboard > Database > Linter
2. Dovresti vedere: "✅ No issues found"
3. Se ci sono altri warning, segnalali
```

---

## 🐛 TROUBLESHOOTING

### Errore: "function does not exist"

**Problema:** Una funzione non esiste nel tuo database.

**Soluzione:**
```sql
-- Commenta la riga corrispondente in fix-all-functions-automatic.sql
-- Oppure verifica il nome esatto:
SELECT proname FROM pg_proc WHERE proname LIKE '%nome_funzione%';
```

### Errore: "function ... ambiguous"

**Problema:** Esistono più versioni della stessa funzione con parametri diversi.

**Soluzione:**
```sql
-- Specifica i parametri esatti:
ALTER FUNCTION public.my_function(UUID, TEXT) 
  SET search_path = public, pg_temp;
```

### Warning non spariscono dopo fix

**Possibili cause:**

1. **Linter cache**
   ```bash
   Soluzione: Aspetta 5 minuti o ricarica pagina
   ```

2. **Funzione non corretta**
   ```sql
   -- Verifica con query
   SELECT proname, proconfig FROM pg_proc 
   WHERE proname = 'nome_funzione';
   ```

3. **Permessi insufficienti**
   ```sql
   -- Esegui come superuser o owner del database
   ```

### Password Protection non appare

**Possibili cause:**

1. **Versione Supabase vecchia**
   - Aggiorna progetto Supabase
   
2. **Self-hosted**
   - Potrebbe non essere disponibile
   - Configura manualmente in auth config

3. **Percorso menu diverso**
   - Cerca in: Authentication > Policies
   - O: Authentication > Password Requirements
   - O: Settings > Auth > Password

---

## 📚 RISORSE UTILI

### Documentazione Ufficiale

- **Supabase Linter:** https://supabase.com/docs/guides/database/database-linter
- **Function Search Path:** https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
- **Password Security:** https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- **PostgreSQL search_path:** https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH

### Sicurezza PostgreSQL

- **OWASP SQL Injection:** https://owasp.org/www-community/attacks/SQL_Injection
- **PostgreSQL Security:** https://www.postgresql.org/docs/current/sql-security.html
- **HaveIBeenPwned API:** https://haveibeenpwned.com/API/v3

---

## ✅ CHECKLIST FINALE

Prima di considerare completato:

- [ ] Eseguito `fix-all-functions-automatic.sql`
- [ ] Verificato 18/18 funzioni corrette (query verifica)
- [ ] Refreshato Database Linter
- [ ] Verificato warning `function_search_path_mutable` spariti
- [ ] Abilitato "Leaked Password Protection" (opzionale)
- [ ] Refreshato Linter dopo password protection
- [ ] Verificato 0 warning totali (o 1 se password protection non abilitata)
- [ ] Testato funzioni privacy (profilo, post, commenti)
- [ ] Documentato modifiche

---

## 💡 NOTE FINALI

### Importante

- ✅ I fix **NON** cambiano il comportamento delle funzioni
- ✅ Aggiungono solo **sicurezza extra**
- ✅ Non influenzano le performance
- ✅ Sono **best practices** PostgreSQL

### Best Practices

Per **nuove funzioni** in futuro, sempre includere:

```sql
CREATE OR REPLACE FUNCTION my_new_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- ← Sempre aggiungere
AS $$
BEGIN
  -- Il tuo codice
END;
$$;
```

### Monitoraggio

Esegui periodicamente il Linter:
```bash
1. Dashboard > Database > Linter
2. Schedule: Settimanale
3. Review warnings e fix
```

---

**🎯 STATO: PRONTO PER ESECUZIONE**

**⏱️ Tempo Totale: 10 minuti**

**📅 Data Creazione:** 1 Ottobre 2025  
**✍️ Autore:** AI Assistant  
**📌 Versione:** 1.0 - Guida Completa

