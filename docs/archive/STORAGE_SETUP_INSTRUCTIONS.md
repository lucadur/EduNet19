# Configurazione Supabase Storage per Immagini Profilo

## Problema Attuale
Gli errori nel log indicano:
1. **"Bucket not found"** o **"new row violates row-level security policy"** - Il bucket non è configurato correttamente
2. **"Could not find the 'bio' column"** - Mancano colonne nella tabella `school_institutes`

## Soluzione - Passo per Passo

### PARTE 1: Configurare Storage Bucket

#### Opzione A: Dalla UI di Supabase (Consigliato)

1. **Vai su Supabase Dashboard** → Storage
2. **Crea nuovo bucket**:
   - Nome: `profile-images`
   - Public bucket: ✅ **SI** (spunta questa opzione)
   - Clicca "Create bucket"

3. **Configura le Policies** (IMPORTANTE):
   
   **METODO SEMPLICE - Usa il Template "Allow public read access"**:
   - Vai su Storage → `profile-images` → Configuration
   - Clicca su "Policies" tab
   - Clicca "New Policy"
   - Seleziona il template: **"Allow public read access"**
   - Questo crea automaticamente la policy di lettura pubblica
   
   **Poi aggiungi policy per upload**:
   - Clicca "New Policy" → "Create a custom policy"
   - Policy name: `Authenticated users can upload`
   - Allowed operation: `INSERT`
   - Target roles: `authenticated`
   - Policy definition: Lascia vuoto o scrivi `true`
   - Clicca "Review" → "Save policy"
   
   **OPPURE usa SQL** (più veloce):
   - Vai su SQL Editor
   - Esegui lo script `supabase-storage-setup.sql` (dalla riga 8 in poi)

#### Opzione B: Con SQL

1. Vai su SQL Editor nel dashboard Supabase
2. Copia e incolla il contenuto del file `supabase-storage-setup.sql`
3. Esegui lo script

### PARTE 2: Aggiungere Colonne Mancanti

1. **Vai su SQL Editor** nel dashboard Supabase
2. **Esegui questo script**:

```sql
-- Aggiungi tutte le colonne mancanti
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS cover_image TEXT,
ADD COLUMN IF NOT EXISTS avatar_image TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS specializations TEXT,
ADD COLUMN IF NOT EXISTS methodologies TEXT[],
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS twitter TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS linkedin TEXT;
```

3. **Verifica che le colonne siano state create**:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'school_institutes' 
ORDER BY column_name;
```

### PARTE 3: Verifica Configurazione

1. **Verifica bucket**:
   - Vai su Storage → Dovresti vedere `profile-images`
   - Clicca sul bucket → Dovresti vedere "Public bucket" = Yes

2. **Verifica policies**:
   - Vai su Storage → `profile-images` → Policies
   - Dovresti vedere almeno 4 policies (INSERT, SELECT, UPDATE, DELETE)

3. **Verifica colonne**:
   - Esegui la query di verifica sopra
   - Dovresti vedere tutte le colonne elencate

### PARTE 4: Test

1. Vai su `edit-profile.html`
2. Prova a caricare un'immagine profilo
3. Compila i campi e clicca "Salva Modifiche"
4. Non dovrebbero più esserci errori 400 nel console

## Troubleshooting

### Se vedi ancora "Bucket not found"
- Assicurati che il bucket si chiami esattamente `profile-images` (con il trattino)
- Verifica che sia pubblico

### Se vedi ancora "row-level security policy"
- Controlla che le policies siano state create correttamente
- Verifica che l'utente sia autenticato (logged in)

### Se vedi ancora "Could not find column"
- Esegui di nuovo lo script SQL per aggiungere le colonne
- Aspetta qualche secondo per il refresh della cache di Supabase
- Ricarica la pagina

## Note Importanti

- Le immagini vengono salvate in `profile-images/avatars/` e `profile-images/covers/`
- Gli URL delle immagini vengono salvati nel database (colonne `avatar_image` e `cover_image`)
- Le immagini sono pubblicamente accessibili (necessario per mostrarle nel profilo)
- Gli utenti possono caricare/modificare/eliminare solo le proprie immagini
