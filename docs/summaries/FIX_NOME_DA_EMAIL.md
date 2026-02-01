# ✅ Fix Nome Istituto da Email - Metadata Mancanti

## ❌ Problema Riscontrato

**Sintomo**: Il nome dell'istituto nel profilo viene estratto dall'email invece di usare il nome dal database MIUR.

**Esempio**:
- Codice MIUR: `TNIC82000X`
- Nome corretto: `TRENTO-MARTIGNANO "R.ZANDONAI"`
- Email inserita: `amilcare.ciconte@gmail.com`
- Nome mostrato: `Amilcare Ciconte` ❌

## 🔍 Causa Root

### Trigger Database

Il database ha un trigger `auto_create_user_profile` che crea automaticamente il profilo quando un utente si registra.

**File**: `database/archive/🔥_SOLUZIONE_DEFINITIVA_NOMI_ISTITUTI.sql` (riga 98-100)

```sql
v_institute_name := COALESCE(
  NEW.raw_user_meta_data->>'institute_name',      -- 1. Cerca nei metadata
  NEW.raw_user_meta_data->>'instituteName',       -- 2. Cerca nei metadata (alt)
  INITCAP(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', ' ')),  -- 3. ❌ ESTRAE DA EMAIL!
  'Istituto Scolastico'                           -- 4. Fallback
);
```

### Codice JavaScript

Il codice di registrazione NON passava i metadata:

**File**: `js/auth/auth.js` (riga 251-254)

```javascript
// PRIMA (SBAGLIATO)
const { data: authData, error: authError } = await this.supabase.auth.signUp({
    email: formData.email,
    password: formData.password
    // ❌ Nessun metadata!
});
```

### Flusso Problematico

```
1. Utente registra istituto:
   - Nome: "TRENTO-MARTIGNANO R.ZANDONAI"
   - Email: "amilcare.ciconte@gmail.com"

2. JavaScript chiama signUp SENZA metadata

3. Trigger database cerca metadata:
   - raw_user_meta_data->>'institute_name' = NULL ❌
   - raw_user_meta_data->>'instituteName' = NULL ❌

4. Trigger usa fallback email:
   - SPLIT_PART('amilcare.ciconte@gmail.com', '@', 1) = 'amilcare.ciconte'
   - REPLACE('amilcare.ciconte', '.', ' ') = 'amilcare ciconte'
   - INITCAP('amilcare ciconte') = 'Amilcare Ciconte'

5. Profilo creato con nome sbagliato: "Amilcare Ciconte" ❌
```

## ✅ Soluzione Implementata

### Aggiunto Metadata in signUp

**File**: `js/auth/auth.js` (riga 251-262)

```javascript
// DOPO (CORRETTO)
const { data: authData, error: authError } = await this.supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
        data: {
            user_type: 'istituto',
            institute_name: formData.instituteName,  // ✅ Nome MIUR!
            institute_type: formData.instituteType
        }
    }
});
```

### Flusso Corretto

```
1. Utente registra istituto:
   - Nome: "TRENTO-MARTIGNANO R.ZANDONAI"
   - Email: "amilcare.ciconte@gmail.com"

2. JavaScript chiama signUp CON metadata:
   - user_type: 'istituto'
   - institute_name: 'TRENTO-MARTIGNANO "R.ZANDONAI"'
   - institute_type: 'Scuola Primaria'

3. Trigger database cerca metadata:
   - raw_user_meta_data->>'institute_name' = 'TRENTO-MARTIGNANO "R.ZANDONAI"' ✅

4. Trigger usa il nome dai metadata

5. Profilo creato con nome corretto: "TRENTO-MARTIGNANO R.ZANDONAI" ✅
```

## 📊 File Modificati

### js/auth/auth.js

**Riga 251-262**:
- Aggiunto `options.data` con metadata
- Incluso `user_type`, `institute_name`, `institute_type`
- Trigger database ora trova i dati corretti

## 🎯 Risultato

### Prima
```
Registrazione:
- Nome form: "TRENTO-MARTIGNANO R.ZANDONAI"
- Email: "amilcare.ciconte@gmail.com"

Profilo creato:
- Nome: "Amilcare Ciconte" ❌ (da email)
```

### Dopo
```
Registrazione:
- Nome form: "TRENTO-MARTIGNANO R.ZANDONAI"
- Email: "amilcare.ciconte@gmail.com"

Profilo creato:
- Nome: "TRENTO-MARTIGNANO R.ZANDONAI" ✅ (da metadata)
```

## 🧪 Test

### Test Case 1: Con MIUR

**Input**:
- Codice: TNIC82000X
- Nome auto-compilato: "TRENTO-MARTIGNANO R.ZANDONAI"
- Email: "test@example.com"

**Risultato Atteso**:
- ✅ Profilo con nome: "TRENTO-MARTIGNANO R.ZANDONAI"
- ❌ NON: "Test" (da email)

### Test Case 2: Senza MIUR

**Input**:
- Nome manuale: "Liceo Scientifico Galilei"
- Email: "admin@galilei.edu.it"

**Risultato Atteso**:
- ✅ Profilo con nome: "Liceo Scientifico Galilei"
- ❌ NON: "Admin" (da email)

## 💡 Perché Succedeva

### Design Originale

Il trigger era stato creato come "safety net" per garantire che il nome non fosse mai NULL, anche se la registrazione falliva parzialmente.

**Logica**:
1. Prova a usare metadata (se presenti)
2. Se mancano, estrai da email (meglio di NULL)
3. Ultimo fallback: "Istituto Scolastico"

### Problema

Il codice JavaScript non passava i metadata, quindi il trigger usava sempre il fallback email.

### Soluzione

Passare i metadata corretti → trigger usa i dati giusti.

## 📝 Note Tecniche

### Metadata Supabase Auth

```javascript
options: {
    data: {
        // Questi dati vengono salvati in auth.users.raw_user_meta_data
        user_type: 'istituto',
        institute_name: 'Nome Istituto',
        institute_type: 'Tipo Istituto'
    }
}
```

### Accesso nel Trigger

```sql
NEW.raw_user_meta_data->>'institute_name'  -- Accesso JSON
```

### Ordine COALESCE

```sql
COALESCE(
  metadata_value,    -- 1. Priorità: metadata
  email_extract,     -- 2. Fallback: email
  'Default'          -- 3. Ultimo: default
)
```

## 🚀 Deployment

### Checklist

- [x] Aggiunto metadata in signUp
- [x] Testato con MIUR
- [x] Testato senza MIUR
- [x] Verificato nome corretto nel profilo
- [x] Documentato fix

### Per Utenti Esistenti

Gli utenti già registrati con nome sbagliato possono:

1. **Modificare manualmente**: Pagina "Modifica Profilo"
2. **Aggiornare da MIUR**: Bottone "Aggiorna da MIUR" (se hanno codice)

### Script Fix Database

Se necessario, puoi correggere i nomi esistenti:

```sql
-- Trova istituti con nome da email
SELECT id, institute_name, email
FROM school_institutes
WHERE institute_name ILIKE SPLIT_PART(email, '@', 1) || '%';

-- Correggi manualmente o con script
UPDATE school_institutes
SET institute_name = 'Nome Corretto'
WHERE id = 'user-id';
```

## ✅ Risultato Finale

**Prima**:
- ❌ Nome estratto da email
- ❌ "Amilcare Ciconte" invece di "TRENTO-MARTIGNANO..."
- ❌ Dati MIUR ignorati

**Dopo**:
- ✅ Nome dai metadata
- ✅ "TRENTO-MARTIGNANO R.ZANDONAI" corretto
- ✅ Dati MIUR rispettati

---

**Problema**: Nome estratto da email  
**Causa**: Metadata mancanti in signUp  
**Fix**: Aggiunto metadata con nome corretto  
**Status**: ✅ Risolto  
**Beneficio**: Nome istituto sempre corretto
