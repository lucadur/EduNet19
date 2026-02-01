# 🔬 Analisi Completa Errore 500 - "Database error saving new user"

## 🎯 PROBLEMA IDENTIFICATO

### Causa Root
**Trigger `init_match_weights_on_user_create` su `auth.users`**

```sql
CREATE TRIGGER init_match_weights_on_user_create
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION init_user_match_weights();
```

### Cosa Succede
1. Utente compila form di registrazione
2. Frontend chiama `supabase.auth.signUp()`
3. Supabase crea utente in `auth.users` ✅
4. **Trigger `init_match_weights_on_user_create` viene eseguito automaticamente**
5. Trigger cerca di inserire record in `match_weights`
6. **Inserimento fallisce** (tabella non esiste o policy RLS blocca)
7. Supabase restituisce errore 500 ❌
8. Utente NON viene creato (rollback della transazione)

### Perché Fallisce

#### Possibilità 1: Tabella `match_weights` Non Esiste
```sql
-- Il trigger cerca di inserire qui:
INSERT INTO match_weights (user_id) VALUES (NEW.id);

-- Ma la tabella potrebbe non esistere se EduMatch non è stato installato
```

#### Possibilità 2: Policy RLS Blocca l'Inserimento
```sql
-- La policy potrebbe richiedere che l'utente sia autenticato
-- Ma durante la registrazione, l'utente NON è ancora autenticato
-- Quindi l'inserimento viene bloccato
```

#### Possibilità 3: Vincoli di Foreign Key
```sql
-- match_weights potrebbe avere FK su user_profiles
-- Ma user_profiles non esiste ancora durante la registrazione
-- Quindi l'inserimento fallisce
```

## ✅ SOLUZIONE DEFINITIVA

### Step 1: Rimuovi il Trigger Problematico

**Esegui questo nel SQL Editor di Supabase:**

```sql
DROP TRIGGER IF EXISTS init_match_weights_on_user_create ON auth.users CASCADE;
```

### Step 2: Verifica Rimozione

```sql
SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 
            FROM information_schema.triggers 
            WHERE trigger_name = 'init_match_weights_on_user_create'
        ) THEN '✅ Trigger rimosso!'
        ELSE '❌ Trigger ancora presente'
    END as status;
```

### Step 3: Crea Trigger Alternativo (Opzionale)

Se vuoi mantenere la funzionalità EduMatch, crea il trigger su `user_profiles` invece che su `auth.users`:

```sql
CREATE OR REPLACE FUNCTION public.create_match_weights_on_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'match_weights'
  ) THEN
    INSERT INTO public.match_weights (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER init_match_weights_on_profile_create
    AFTER INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_match_weights_on_profile();
```

### Perché Questa Soluzione Funziona

1. **Trigger su `user_profiles` invece di `auth.users`**
   - Viene eseguito DOPO che l'utente è completamente creato
   - L'utente è già autenticato
   - Le policy RLS non bloccano

2. **Controllo Esistenza Tabella**
   - `IF EXISTS` previene errori se `match_weights` non esiste
   - Non blocca la registrazione

3. **ON CONFLICT DO NOTHING**
   - Previene errori se il record esiste già
   - Idempotente e sicuro

4. **SECURITY DEFINER**
   - La funzione viene eseguita con i permessi del creatore
   - Bypassa le policy RLS se necessario

## 📊 Confronto Approcci

### ❌ Approccio Problematico (Attuale)
```
Registrazione → auth.users INSERT → Trigger → match_weights INSERT → ERRORE 500
```

### ✅ Approccio Corretto (Dopo Fix)
```
Registrazione → auth.users INSERT → Successo ✅
                ↓
Login → user_profiles INSERT → Trigger → match_weights INSERT → Successo ✅
```

## 🧪 Test della Soluzione

### 1. Esegui lo Script
```sql
-- Copia e incolla FIX_TRIGGER_DEFINITIVO.sql nel SQL Editor
-- Esegui tutto lo script
```

### 2. Verifica Risultato
```sql
-- Dovrebbe restituire "✅ Nessun trigger su auth.users"
SELECT COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';
```

### 3. Testa Registrazione
1. Vai su `index.html`
2. Click "Registrati Gratis"
3. Compila form
4. Click "Registrati"
5. **Dovrebbe funzionare senza errore 500!** ✅

### 4. Verifica Database
```sql
-- Verifica che l'utente sia stato creato
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 1;

-- Verifica che il profilo sia stato creato
SELECT id, user_type, created_at 
FROM public.user_profiles 
ORDER BY created_at DESC 
LIMIT 1;
```

## 🔍 Analisi Dettagliata del Codice

### File Coinvolti

#### 1. `edumatch-database-schema.sql` (Linea 525)
```sql
-- QUESTO È IL PROBLEMA
CREATE TRIGGER init_match_weights_on_user_create
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION init_user_match_weights();
```

#### 2. `auth.js` (Linea 232)
```javascript
// Questa chiamata triggera il problema
const { data: authData, error: authError } = await this.supabase.auth.signUp({
    email: formData.email,
    password: formData.password
});
// ↑ Quando Supabase inserisce in auth.users, il trigger viene eseguito
```

### Flusso Completo dell'Errore

```
1. Frontend: auth.js:232
   ↓ signUp()
   
2. Supabase Auth API: /auth/v1/signup
   ↓ INSERT INTO auth.users
   
3. PostgreSQL: auth.users
   ↓ AFTER INSERT trigger
   
4. Trigger: init_match_weights_on_user_create
   ↓ EXECUTE FUNCTION init_user_match_weights()
   
5. Function: init_user_match_weights()
   ↓ INSERT INTO match_weights
   
6. PostgreSQL: match_weights
   ❌ ERRORE: Tabella non esiste / Policy blocca / FK fallisce
   
7. PostgreSQL: ROLLBACK
   ↓ Annulla tutto (anche l'INSERT in auth.users)
   
8. Supabase Auth API: 500 Internal Server Error
   ↓ "Database error saving new user"
   
9. Frontend: auth.js:232
   ❌ AuthApiError catturato
```

## 📝 Checklist Post-Fix

- [ ] Eseguito `FIX_TRIGGER_DEFINITIVO.sql`
- [ ] Verificato rimozione trigger con query
- [ ] Testato registrazione nuovo utente
- [ ] Verificato creazione utente in `auth.users`
- [ ] Verificato creazione profilo in `user_profiles`
- [ ] Verificato che non ci siano errori 500
- [ ] (Opzionale) Verificato creazione `match_weights` al login

## 🎯 Risultato Atteso

### Prima del Fix ❌
```
POST /auth/v1/signup → 500 Internal Server Error
Console: "Database error saving new user"
Utente: NON creato
```

### Dopo il Fix ✅
```
POST /auth/v1/signup → 200 OK
Console: "Registrazione completata"
Utente: Creato con successo
Profilo: Creato al primo login
match_weights: Creato quando viene creato il profilo
```

## 🚀 Prossimi Passi

1. **Esegui `FIX_TRIGGER_DEFINITIVO.sql`** nel SQL Editor di Supabase
2. **Testa la registrazione** - dovrebbe funzionare immediatamente
3. **Verifica i log** - non dovrebbero esserci più errori 500
4. **Monitora** - assicurati che tutto funzioni correttamente

## 📞 Se il Problema Persiste

Se dopo aver eseguito lo script il problema persiste:

1. **Verifica altri trigger**:
```sql
SELECT trigger_name, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';
```

2. **Controlla i log Supabase**:
   - Dashboard → Logs → Postgres Logs
   - Cerca errori durante la registrazione

3. **Verifica policy RLS**:
```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'match_weights');
```

## 🎉 Conclusione

Il problema era causato da un **trigger automatico su `auth.users`** che cercava di inserire dati in `match_weights` durante la registrazione, ma falliva per vari motivi.

La soluzione è **rimuovere il trigger problematico** e, se necessario, spostarlo su `user_profiles` dove è più sicuro.

**Esegui `FIX_TRIGGER_DEFINITIVO.sql` e il problema sarà risolto!** 🚀
