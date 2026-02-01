# ✅ Problema Cover Image RLS - Soluzione

## 🎯 Problema Identificato

L'upload dell'immagine di copertina fallisce con:
```
StorageApiError: new row violates row-level security policy
```

### 📊 Situazione

- ✅ **Avatar**: Upload funziona (bucket `avatars` ha policy RLS)
- ❌ **Cover**: Upload fallisce (bucket `profile-images` senza policy RLS)

## 🔍 Analisi Log

Dal log della console:
```javascript
// Cover - FALLISCE ❌
📤 Starting upload for cover: Screenshot 2025-10-21 224344.png
📦 Uploading to bucket: profile-images
❌ Error uploading image: StorageApiError: new row violates row-level security policy

// Avatar - FUNZIONA ✅
📤 Starting upload for avatar: Screenshot 2025-10-22 151635.png
📦 Uploading to bucket: avatars
✅ Upload successful
🔗 Public URL: https://...avatars/.../avatar_1763293739187.png
```

## 🔧 Causa Tecnica

### Bucket `avatars` (Funziona)
```sql
✅ Policy INSERT: Users can upload their own avatars
✅ Policy UPDATE: Users can update their own avatars
✅ Policy DELETE: Users can delete their own avatars
✅ Policy SELECT: Avatars are publicly accessible
```

### Bucket `profile-images` (Non Funziona)
```sql
❌ Nessuna policy INSERT
❌ Nessuna policy UPDATE
❌ Nessuna policy DELETE
❌ Nessuna policy SELECT
```

**Risultato:** Supabase blocca l'upload per sicurezza (RLS attivo ma nessuna policy).

## ✅ Soluzione Fornita

### File Creati

1. **database/fixes/fix-cover-image-rls.sql**
   - Script SQL completo per creare tutte le policy
   - Verifica/crea bucket se non esiste
   - Elimina policy vecchie
   - Crea 4 policy nuove

## 📋 Policy da Creare

### 1. INSERT (Upload)
```sql
CREATE POLICY "Users can upload their own cover images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 2. UPDATE (Modifica)
```sql
CREATE POLICY "Users can update their own cover images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 3. DELETE (Elimina)
```sql
CREATE POLICY "Users can delete their own cover images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 4. SELECT (Lettura Pubblica)
```sql
CREATE POLICY "Cover images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-images');
```

## 🎯 Come Applicare il Fix

### Passo 1: Apri Supabase Dashboard
```
https://supabase.com/dashboard/project/[your-project-id]
```

### Passo 2: SQL Editor
1. Click su "SQL Editor" nel menu laterale
2. Click "New query"

### Passo 3: Esegui Script
1. Apri `database/fixes/fix-cover-image-rls.sql`
2. Copia tutto il contenuto
3. Incolla nell'editor SQL
4. Click "Run"

### Passo 4: Verifica
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%cover%';
```

Dovresti vedere 4 policy.

## ✅ Test Dopo il Fix

1. Vai a http://localhost:8000/pages/profile/edit-profile.html
2. Carica immagine avatar → ✅ Funziona
3. Carica immagine cover → ✅ Ora funziona!
4. Salva profilo
5. Vai al profilo → ✅ Entrambe le immagini visibili

## 📊 Risultato Atteso

### Prima del Fix
```
Avatar:  ✅ Upload OK
Cover:   ❌ RLS policy error
```

### Dopo il Fix
```
Avatar:  ✅ Upload OK
Cover:   ✅ Upload OK
```

## 💡 Prevenzione Futura

Quando crei un nuovo bucket Storage su Supabase:

1. ✅ Crea il bucket
2. ✅ Imposta come pubblico (se necessario)
3. ✅ **Crea subito le policy RLS**
4. ✅ Testa upload/download

**Non dimenticare le policy RLS!** Altrimenti avrai lo stesso errore.

## 🔒 Sicurezza

Le policy create garantiscono:

- ✅ Solo utenti autenticati possono uploadare
- ✅ Ogni utente può uploadare solo nella sua cartella
- ✅ Ogni utente può modificare/eliminare solo i suoi file
- ✅ Tutti possono vedere le immagini (pubbliche)

## 📈 Impatto

- **Utenti interessati**: Tutti gli istituti
- **Funzionalità bloccata**: Upload cover image
- **Priorità**: Alta
- **Tempo fix**: 2 minuti
- **Difficoltà**: Bassa

---

**Problema**: Cover image upload fallisce  
**Causa**: Mancano policy RLS su bucket profile-images  
**Soluzione**: Esegui fix-cover-image-rls.sql  
**Status**: Script pronto, da eseguire su Supabase
