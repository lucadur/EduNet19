# 🚀 Guida Rapida - Fix Upload Immagini Profilo

## Problemi Attuali
1. ❌ `new row violates row-level security policy` - Policy storage non configurate
2. ❌ `null value in column "institute_type"` - Campo obbligatorio vuoto

## ✅ Soluzione Rapida (5 minuti)

### STEP 1: Verifica Bucket
1. Vai su **Supabase Dashboard** → **Storage**
2. Verifica che esista il bucket `profile-images`
3. Se non esiste:
   - Clicca "New Bucket"
   - Nome: `profile-images`
   - Public bucket: ✅ **SPUNTA QUESTA CASELLA**
   - Clicca "Create bucket"

### STEP 2: Configura Policies
1. Vai su **SQL Editor**
2. Copia e incolla questo script:

```sql
-- Rimuovi policy esistenti
DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete profile images" ON storage.objects;

-- Crea policy per upload
CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-images');

-- Crea policy per lettura pubblica
CREATE POLICY "Public can read profile images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'profile-images');

-- Crea policy per update
CREATE POLICY "Authenticated users can update profile images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

-- Crea policy per delete
CREATE POLICY "Authenticated users can delete profile images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-images');
```

3. Clicca "Run" o premi `Ctrl+Enter`

### STEP 3: Aggiungi Colonne Mancanti
Sempre nel SQL Editor, esegui:

```sql
-- Aggiungi colonne per immagini profilo
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS cover_image TEXT,
ADD COLUMN IF NOT EXISTS avatar_image TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Rendi institute_type nullable (per evitare errori)
ALTER TABLE school_institutes 
ALTER COLUMN institute_type DROP NOT NULL;
```

### STEP 4: Test
1. Vai su `edit-profile.html`
2. Carica un'immagine profilo
3. Compila almeno il campo "Nome Istituto"
4. Clicca "Salva Modifiche"
5. ✅ Dovrebbe funzionare!

## 🔍 Verifica che Funzioni

Dopo aver eseguito gli script, verifica:

1. **Bucket esiste e è pubblico**:
   - Storage → `profile-images` → Dovrebbe dire "Public"

2. **Policy create**:
```sql
SELECT policyname FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```
Dovresti vedere 4 policy.

3. **Colonne esistono**:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'school_institutes' 
AND column_name IN ('cover_image', 'avatar_image', 'bio');
```
Dovresti vedere 3 righe.

## ⚠️ Se Ancora Non Funziona

### Problema: "Bucket not found"
- Il bucket non esiste o ha un nome diverso
- **Soluzione**: Crea il bucket dalla UI (vedi STEP 1)

### Problema: "RLS policy violation"
- Le policy non sono state create correttamente
- **Soluzione**: Riesegui lo script dello STEP 2

### Problema: "Column not found"
- Le colonne non esistono nella tabella
- **Soluzione**: Riesegui lo script dello STEP 3

### Problema: "institute_type cannot be null"
- Il campo è obbligatorio ma vuoto nel form
- **Soluzione**: 
  - Compila il campo "Tipo Istituto" nel form
  - OPPURE esegui: `ALTER TABLE school_institutes ALTER COLUMN institute_type DROP NOT NULL;`

## 📝 Note

- Il codice JavaScript è già stato aggiornato per gestire meglio i campi vuoti
- Le immagini vengono salvate su Supabase Storage (non nel database)
- Gli URL delle immagini vengono salvati nel database
- Le immagini sono pubblicamente accessibili (necessario per mostrarle)

## 🎉 Fatto!

Dopo questi 3 step, l'upload delle immagini profilo dovrebbe funzionare perfettamente!
