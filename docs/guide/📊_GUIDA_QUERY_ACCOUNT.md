# 📊 Guida Query Account - Supabase

## 🎯 Come Usare

1. Apri Supabase Dashboard
2. Vai su **SQL Editor**
3. Copia una delle query da `database/queries/lista-tutti-account.sql`
4. Incolla ed esegui

## 📋 Query Disponibili

### 1️⃣ Lista Completa (Consigliata)
```sql
-- Mostra tutti gli account con tutti i dettagli
-- Include: email, tipo, nome, città, date
```
**Usa quando:** Vuoi vedere tutto

### 2️⃣ Lista Semplice
```sql
-- Solo info base: email, tipo, date
```
**Usa quando:** Vuoi una vista veloce

### 3️⃣ Solo Istituti
```sql
-- Filtra solo gli istituti scolastici
-- Include: nome istituto, tipo, città, sito web
```
**Usa quando:** Vuoi vedere solo le scuole

### 4️⃣ Solo Utenti Privati
```sql
-- Filtra solo gli utenti privati
-- Include: nome, cognome, bio
```
**Usa quando:** Vuoi vedere solo gli utenti privati

### 5️⃣ Statistiche
```sql
-- Mostra numeri aggregati:
-- - Totale account
-- - Numero istituti
-- - Numero utenti privati
-- - Email verificate
-- - Profili completati
-- - Accessi ultimi 7 giorni
```
**Usa quando:** Vuoi vedere i numeri totali

### 6️⃣ Account con Attività
```sql
-- Mostra stato attività di ogni account:
-- 🟢 Attivo (ultimi 7 giorni)
-- 🟡 Recente (ultimi 30 giorni)
-- 🔴 Inattivo
-- ⚪ Mai loggato
```
**Usa quando:** Vuoi vedere chi è attivo

### 7️⃣ Cerca Account Specifico
```sql
-- Cerca per email o nome istituto
```
**Usa quando:** Cerchi un account specifico

### 8️⃣ Registrati Oggi
```sql
-- Mostra solo account creati oggi
```
**Usa quando:** Vuoi vedere le nuove registrazioni

### 9️⃣ Export CSV
```sql
-- Formato ottimizzato per export CSV
-- Colonne con nomi leggibili
-- Date formattate
```
**Usa quando:** Vuoi esportare i dati

## 🔍 Esempi Pratici

### Trovare un Account per Email
```sql
SELECT 
  au.email,
  up.user_type,
  au.created_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'utente@example.com';
```

### Trovare un Istituto per Nome
```sql
SELECT 
  au.email,
  si.institute_name,
  si.city
FROM auth.users au
INNER JOIN school_institutes si ON au.id = si.id
WHERE si.institute_name ILIKE '%liceo%';
```

### Contare Account per Tipo
```sql
SELECT 
  user_type,
  COUNT(*) as totale
FROM user_profiles
GROUP BY user_type;
```

### Account Attivi Ultima Settimana
```sql
SELECT 
  au.email,
  au.last_sign_in_at
FROM auth.users au
WHERE au.last_sign_in_at > NOW() - INTERVAL '7 days'
ORDER BY au.last_sign_in_at DESC;
```

## 📊 Colonne Disponibili

### auth.users
- `id` - UUID utente
- `email` - Email account
- `created_at` - Data registrazione
- `email_confirmed_at` - Data verifica email
- `last_sign_in_at` - Ultimo accesso

### user_profiles
- `id` - UUID (FK a auth.users)
- `user_type` - 'istituto' o 'privato'
- `profile_completed` - Boolean
- `email_verified` - Boolean

### school_institutes
- `id` - UUID (FK a auth.users)
- `institute_name` - Nome istituto
- `institute_type` - Tipo istituto
- `city` - Città
- `website` - Sito web
- `logo_url` - Avatar
- `cover_image` - Copertina

### private_users
- `id` - UUID (FK a auth.users)
- `first_name` - Nome
- `last_name` - Cognome
- `bio` - Biografia

## 💡 Tips

### Filtrare per Data
```sql
-- Ultimi 7 giorni
WHERE created_at > NOW() - INTERVAL '7 days'

-- Ultimo mese
WHERE created_at > NOW() - INTERVAL '30 days'

-- Oggi
WHERE DATE(created_at) = CURRENT_DATE

-- Range specifico
WHERE created_at BETWEEN '2025-01-01' AND '2025-12-31'
```

### Ordinare Risultati
```sql
-- Più recenti prima
ORDER BY created_at DESC

-- Più vecchi prima
ORDER BY created_at ASC

-- Per nome
ORDER BY institute_name ASC

-- Per ultimo accesso (NULL alla fine)
ORDER BY last_sign_in_at DESC NULLS LAST
```

### Limitare Risultati
```sql
-- Primi 10
LIMIT 10

-- Primi 10 dopo i primi 20 (paginazione)
LIMIT 10 OFFSET 20
```

## 🔒 Sicurezza

**⚠️ IMPORTANTE:**
- Queste query accedono alla tabella `auth.users`
- Contiene dati sensibili (email, password hash)
- Usa solo su Supabase Dashboard (non nel codice frontend!)
- Non esporre mai questi dati pubblicamente

## 📥 Export Dati

### Da Supabase Dashboard
1. Esegui query
2. Click su "Download CSV" in alto a destra
3. Salva il file

### Formato CSV
Usa la **Query 9** per un formato ottimizzato per CSV con:
- Colonne con nomi leggibili
- Date formattate DD/MM/YYYY
- Valori Si/No invece di true/false

## 🎯 Query Più Utili

**Per amministrazione quotidiana:**
- Query 1 (Lista Completa)
- Query 5 (Statistiche)
- Query 6 (Account con Attività)

**Per supporto utenti:**
- Query 7 (Cerca Account Specifico)

**Per report:**
- Query 9 (Export CSV)

---

**File**: database/queries/lista-tutti-account.sql  
**Aggiornato**: 12 Novembre 2025
