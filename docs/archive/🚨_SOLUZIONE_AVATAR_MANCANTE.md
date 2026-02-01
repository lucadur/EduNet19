# 🚨 SOLUZIONE AVATAR MANCANTE

## 🎯 Problema Identificato

Il log dice: **"No avatar found for institute"**

Questo significa che `logo_url` è **NULL** nel database per il tuo istituto.

## ✅ Soluzione Rapida (2 opzioni)

### Opzione 1: Avatar Placeholder (30 secondi) ⚡

**Usa questa per testare subito il sistema!**

1. Apri **Supabase SQL Editor**
2. Copia e incolla il contenuto di **`⚡_CARICA_AVATAR_PLACEHOLDER.sql`**
3. **Run**
4. Ricarica la pagina con **Ctrl+Shift+R**
5. ✅ Avatar visibile ovunque!

Questo imposta un avatar temporaneo generato automaticamente con le iniziali del tuo istituto.

### Opzione 2: Carica Avatar Reale (2 minuti) 🎨

**Usa questa per il tuo avatar definitivo!**

1. Vai su **"Modifica Profilo"** (edit-profile.html)
2. Clicca su **"Carica Avatar"** o **"Cambia Immagine"**
3. Seleziona un'immagine dal tuo computer
4. Clicca **"Salva"**
5. Ricarica la pagina con **Ctrl+Shift+R**
6. ✅ Il tuo avatar reale è visibile ovunque!

## 🔍 Debug (se serve)

### Verifica Stato Attuale

Esegui questo in SQL Editor:

```sql
-- Sostituisci con il tuo ID
SELECT 
  id,
  institute_name,
  logo_url,
  CASE 
    WHEN logo_url IS NULL THEN '❌ Avatar mancante'
    ELSE '✅ Avatar presente'
  END as status
FROM school_institutes
WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8';
```

### Risultati Possibili

#### ❌ logo_url = NULL
```
Causa: Avatar non caricato
Soluzione: Usa Opzione 1 o Opzione 2
```

#### ✅ logo_url = 'https://...'
```
Causa: Avatar presente ma non visibile
Soluzione: Verifica bucket pubblico
```

## 🔧 Fix Bucket Pubblico

Se l'avatar è presente ma non visibile:

```sql
-- Rendi il bucket pubblico
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';

-- Verifica policy RLS
DROP POLICY IF EXISTS "Avatar pubblici leggibili da tutti" ON storage.objects;
CREATE POLICY "Avatar pubblici leggibili da tutti"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

## 📊 Verifica Completa

Dopo aver caricato l'avatar, verifica con:

```sql
-- Verifica view
SELECT * FROM user_avatars_view 
WHERE user_id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8';

-- Dovresti vedere:
-- user_id: 813ebb9e-93f0-4f40-90ae-6204e3935fe8
-- user_type: istituto
-- avatar_url: https://... (non NULL!)
-- display_name: Nome del tuo istituto
```

## 🎯 Raccomandazione

**Per testare subito:**
1. Esegui `⚡_CARICA_AVATAR_PLACEHOLDER.sql` (30 secondi)
2. Ricarica la pagina
3. Verifica che gli avatar appaiano ovunque

**Poi, quando hai tempo:**
1. Vai su "Modifica Profilo"
2. Carica il tuo avatar reale
3. Il placeholder verrà sostituito automaticamente

## ✅ Dopo il Fix

Una volta caricato l'avatar (placeholder o reale), dovresti vedere:

```
✅ Avatar nel menu dropdown
✅ Avatar nei tuoi post
✅ Avatar nei tuoi commenti
✅ Avatar nei risultati di ricerca
✅ Avatar nel tuo profilo
```

## 🚀 Quick Fix

**Esegui questo ADESSO per testare:**

```sql
UPDATE school_institutes
SET logo_url = 'https://ui-avatars.com/api/?name=Istituto&size=200&background=6366f1&color=fff&bold=true'
WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8';
```

Poi **Ctrl+Shift+R** e gli avatar appariranno! 🎨✨

---

**Il sistema funziona, serve solo caricare l'avatar! 🚀**
