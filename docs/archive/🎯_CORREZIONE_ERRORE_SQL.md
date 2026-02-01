# 🎯 CORREZIONE ERRORE SQL - Avatar Universale

## ❌ Errore Originale

```
ERROR: 42703: column up.avatar_url does not exist
LINE 82:   up.avatar_url,
           ^
HINT: Perhaps you meant to reference the column "pu.avatar_url".
```

## 🔍 Causa del Problema

La tabella `user_profiles` **NON** ha una colonna `avatar_url`.

### Struttura Reale del Database

```
user_profiles
├── id (UUID)
├── user_type (TEXT) → 'istituto' o 'privato'
└── ... (altre colonne)

school_institutes
├── id (UUID) → FK a user_profiles.id
├── logo_url (TEXT) → ✅ Avatar istituto
└── ...

private_users
├── id (UUID) → FK a user_profiles.id
├── avatar_url (TEXT) → ✅ Avatar utente privato
└── ...
```

## ✅ Soluzione Applicata

### Prima (ERRATO)
```sql
SELECT 
  up.id as user_id,
  up.user_type,
  up.avatar_url,  -- ❌ Questa colonna non esiste!
  ...
FROM user_profiles up
```

### Dopo (CORRETTO)
```sql
SELECT 
  up.id as user_id,
  up.user_type,
  CASE 
    WHEN up.user_type = 'istituto' THEN si.logo_url
    WHEN up.user_type = 'privato' THEN pu.avatar_url
    ELSE NULL
  END as avatar_url,  -- ✅ Recupera da tabella corretta
  ...
FROM user_profiles up
LEFT JOIN school_institutes si ON up.id = si.id AND up.user_type = 'istituto'
LEFT JOIN private_users pu ON up.id = pu.id AND up.user_type = 'privato'
```

## 🔧 File Corretto

Il file `🔧_FIX_AVATAR_UNIVERSALE.sql` è stato aggiornato con:

### 1. Funzione Helper Corretta
```sql
CREATE OR REPLACE FUNCTION get_user_avatar_url(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_type_val TEXT;
  avatar_path TEXT;
BEGIN
  -- Determina il tipo di utente
  SELECT user_type INTO user_type_val
  FROM user_profiles
  WHERE id = user_uuid;
  
  -- Cerca l'avatar in base al tipo di utente
  IF user_type_val = 'istituto' THEN
    SELECT logo_url INTO avatar_path
    FROM school_institutes
    WHERE id = user_uuid;
  ELSIF user_type_val = 'privato' THEN
    SELECT avatar_url INTO avatar_path
    FROM private_users
    WHERE id = user_uuid;
  END IF;
  
  RETURN avatar_path;
END;
$$;
```

### 2. View Corretta
```sql
CREATE VIEW user_avatars_view AS
SELECT 
  up.id as user_id,
  up.user_type,
  CASE 
    WHEN up.user_type = 'istituto' THEN si.logo_url
    WHEN up.user_type = 'privato' THEN pu.avatar_url
    ELSE NULL
  END as avatar_url,
  CASE 
    WHEN up.user_type = 'istituto' THEN si.institute_name
    WHEN up.user_type = 'privato' THEN CONCAT(pu.first_name, ' ', pu.last_name)
    ELSE 'Utente'
  END as display_name,
  CASE 
    WHEN up.user_type = 'istituto' THEN si.city
    ELSE NULL
  END as location
FROM user_profiles up
LEFT JOIN school_institutes si ON up.id = si.id AND up.user_type = 'istituto'
LEFT JOIN private_users pu ON up.id = pu.id AND up.user_type = 'privato';
```

## 📋 Cosa Fare Ora

1. ✅ Il file `🔧_FIX_AVATAR_UNIVERSALE.sql` è già stato corretto
2. ✅ Apri Supabase SQL Editor
3. ✅ Copia e incolla il contenuto del file corretto
4. ✅ Esegui lo script
5. ✅ Dovresti vedere "Success" senza errori

## 🧪 Test Dopo l'Esecuzione

```sql
-- Test 1: Verifica che la view funzioni
SELECT * FROM user_avatars_view LIMIT 5;

-- Test 2: Verifica la funzione
SELECT 
  id,
  user_type,
  get_user_avatar_url(id) as avatar_url
FROM user_profiles
LIMIT 5;

-- Test 3: Verifica avatar istituti
SELECT 
  id,
  institute_name,
  logo_url
FROM school_institutes
WHERE logo_url IS NOT NULL
LIMIT 3;

-- Test 4: Verifica avatar utenti privati
SELECT 
  id,
  first_name,
  last_name,
  avatar_url
FROM private_users
WHERE avatar_url IS NOT NULL
LIMIT 3;
```

## ✅ Risultato Atteso

Dopo l'esecuzione corretta, dovresti vedere:

```
Success. No rows returned
```

Seguito da una tabella con i dati degli utenti:

```
user_id                              | user_type | display_name        | avatar_url                    | location
-------------------------------------|-----------|---------------------|-------------------------------|----------
550e8400-e29b-41d4-a716-446655440000 | istituto  | Liceo Scientifico   | https://...storage.../logo.jpg| Roma
6ba7b810-9dad-11d1-80b4-00c04fd430c8 | privato   | Mario Rossi         | https://...storage.../pic.jpg | NULL
```

## 🎉 Completato!

L'errore è stato corretto. Ora puoi eseguire lo script senza problemi! 🚀

---

**Prossimo Step**: Segui `⚡_ESEGUI_QUESTO_SQL.md` per le istruzioni complete
