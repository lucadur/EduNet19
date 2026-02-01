# 🎯 GUIDA RAPIDA - FIX UTENTE PRIVATO

## ⚡ Fix Applicati (già nel codice)

### ✅ 1. Like Button Error
- **File**: `social-features.js`
- **Fix**: Validazione bottone prima dell'uso
- **Status**: ✅ Completato

### ✅ 2. Avatar 400 Error  
- **File**: `avatar-manager.js`
- **Fix**: Query corretta con verifica tipo utente
- **Status**: ✅ Completato

### ✅ 3. Zero Recommendations
- **File**: `recommendation-engine.js`
- **Fix**: Soglia abbassata + punteggi base per nuovi utenti
- **Status**: ✅ Completato

---

## 🔧 Cosa Devi Fare Ora

### Step 1: Esegui lo Script SQL
```
1. Apri Supabase Dashboard
2. Vai su SQL Editor
3. Apri il file: 🔧_FIX_PRIVATE_USER_COMPLETE.sql
4. Sostituisci 'c30ebcb7-e3ae-4d90-b513-f673d4096fcc' con il TUO user_id
5. Clicca "Run"
```

**Come trovare il tuo user_id:**
```sql
-- Esegui questo nel SQL Editor mentre sei loggato
SELECT auth.uid();
```

### Step 2: Ricarica la Pagina
```
1. Vai su homepage.html
2. Premi Ctrl+Shift+R (hard refresh)
3. Apri la console (F12)
```

### Step 3: Testa
```
✅ Clicca su un bottone like → Dovrebbe funzionare
✅ Controlla console → Nessun errore 400
✅ Vai su tab "Discover" → Dovresti vedere raccomandazioni
```

---

## 🐛 Se Qualcosa Non Funziona

### Like non funziona?
```sql
-- Verifica policy RLS
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'post_likes';

-- Dovrebbero esserci 3 policy:
-- 1. "Users can like posts" (INSERT)
-- 2. "Users can unlike their likes" (DELETE)  
-- 3. "Anyone can view likes" (SELECT)
```

### Avatar errore 400?
```sql
-- Verifica profilo
SELECT 
  up.user_type,
  CASE 
    WHEN up.user_type = 'privato' THEN pu.avatar_image
    WHEN up.user_type = 'istituto' THEN si.avatar_image
  END as avatar
FROM user_profiles up
LEFT JOIN private_users pu ON pu.id = up.id
LEFT JOIN school_institutes si ON si.id = up.id
WHERE up.id = auth.uid();
```

### Zero raccomandazioni?
```sql
-- Verifica istituti disponibili
SELECT COUNT(*) FROM school_institutes;

-- Se 0, aggiungi istituti di test:
-- Usa il file: add-test-institutes-simple.sql
```

---

## 📊 Verifica Rapida

Esegui questo nel SQL Editor:
```sql
SELECT 
  'Profilo OK' as check,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM user_profiles WHERE id = auth.uid()

UNION ALL

SELECT 
  'Policy Likes OK',
  CASE WHEN COUNT(*) >= 3 THEN '✅' ELSE '❌' END
FROM pg_policies WHERE tablename = 'post_likes'

UNION ALL

SELECT 
  'Istituti Disponibili',
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM school_institutes

UNION ALL

SELECT 
  'Tabella Activities OK',
  CASE WHEN COUNT(*) >= 0 THEN '✅' ELSE '❌' END
FROM user_activities WHERE user_id = auth.uid();
```

**Risultato atteso**: Tutti ✅

---

## 🎉 Tutto Funziona?

Se tutti i test passano:
1. ✅ Puoi mettere like ai post
2. ✅ Gli avatar si caricano senza errori
3. ✅ Vedi raccomandazioni nella sezione Discover
4. ✅ Console senza errori

**Prossimi passi:**
- Interagisci con i post (like, commenti)
- Segui alcuni istituti
- Il sistema di raccomandazioni migliorerà automaticamente!

---

## 📞 Hai Bisogno di Aiuto?

Controlla i file di documentazione:
- `✅_FIX_UTENTE_PRIVATO_COMPLETO.md` - Dettagli tecnici completi
- `🔧_FIX_PRIVATE_USER_COMPLETE.sql` - Script SQL da eseguire

Oppure dimmi quale errore vedi nella console!
