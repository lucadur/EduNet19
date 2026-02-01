# ESEGUI SUBITO - FIX UPLOAD

## PROBLEMA

Il path nel log mostra ancora il formato vecchio:
```
path: d440004d-eced-46ec-a504-e47dcec0cb5f_cover_1761761490234.png  ❌
```

Invece di:
```
path: d440004d-eced-46ec-a504-e47dcec0cb5f/cover_1761761490234.png  ✅
```

## CAUSA

1. **Browser cache** - Il browser sta usando la versione vecchia di edit-profile.js
2. **Buckets non creati** - Lo script SQL non è stato eseguito

## SOLUZIONE

### STEP 1: Esegui Script SQL

**Apri SQL Editor in Supabase e esegui:**

```sql
-- Copia e incolla tutto il contenuto di FIX_STORAGE_BUCKETS_UPLOAD.sql
```

**Verifica che sia eseguito con successo:**
- Dovresti vedere 2 buckets creati
- Dovresti vedere 8 policies create

### STEP 2: Hard Refresh Browser

**Windows/Linux:**
```
Ctrl + Shift + R
oppure
Ctrl + F5
```

**Mac:**
```
Cmd + Shift + R
```

**Oppure:**
1. Apri DevTools (F12)
2. Click destro sul pulsante refresh
3. Seleziona "Empty Cache and Hard Reload"

### STEP 3: Verifica Path Corretto

Dopo il refresh, prova a caricare un'immagine e verifica nel log:

**Dovrebbe mostrare:**
```
📦 Uploading to bucket: avatars, path: d440004d-eced-46ec-a504-e47dcec0cb5f/avatar_TIMESTAMP.png
```

**NON:**
```
📦 Uploading to bucket: avatars, path: d440004d-eced-46ec-a504-e47dcec0cb5f_avatar_TIMESTAMP.png
```

### STEP 4: Testa Upload

1. Vai su "Modifica Profilo"
2. Carica avatar
3. Carica cover
4. Salva
5. ✅ Dovrebbe funzionare!

## VERIFICA RAPIDA

### Verifica Buckets Creati

```sql
SELECT id, name, public
FROM storage.buckets
WHERE id IN ('profile-images', 'avatars');
```

**Risultato atteso:** 2 righe

### Verifica Policies Create

```sql
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'objects'
  AND (policyname LIKE '%profile%' OR policyname LIKE '%avatar%');
```

**Risultato atteso:** 8 policies

## SE NON FUNZIONA ANCORA

### 1. Verifica che il codice sia aggiornato

Apri DevTools → Sources → edit-profile.js → Cerca "uploadImage"

Dovrebbe mostrare:
```javascript
const filePath = `${this.currentUser.id}/${fileName}`;  ✅
```

NON:
```javascript
const filePath = fileName;  ❌
```

### 2. Cancella completamente la cache

**Chrome:**
1. Settings → Privacy and security
2. Clear browsing data
3. Seleziona "Cached images and files"
4. Clear data

**Firefox:**
1. Options → Privacy & Security
2. Cookies and Site Data
3. Clear Data
4. Seleziona "Cached Web Content"
5. Clear

### 3. Prova in Incognito/Private Mode

Apri una finestra incognito e prova l'upload.
Se funziona, è sicuramente un problema di cache.

## CHECKLIST

- [ ] Script SQL eseguito
- [ ] Buckets creati (verifica con query)
- [ ] Policies create (verifica con query)
- [ ] Hard refresh fatto (Ctrl+Shift+R)
- [ ] Cache cancellata
- [ ] Path corretto nel log (con `/` non `_`)
- [ ] Upload funzionante

## DOPO IL FIX

Dovresti vedere nel log:
```
📤 Starting upload for avatar: Screenshot.png
📦 Uploading to bucket: avatars, path: d440004d.../avatar_1761761490565.png
✅ Upload successful: {...}
🔗 Public URL: https://...
```

**Nessun errore 400!** ✅

---

## RIEPILOGO

1. **Esegui** FIX_STORAGE_BUCKETS_UPLOAD.sql
2. **Hard refresh** (Ctrl+Shift+R)
3. **Testa** upload
4. **Verifica** che funzioni

**Fatto!** 🎉
