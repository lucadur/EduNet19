# 🚨 DIAGNOSI AVATAR MANCANTE

## 🎯 Problema

L'avatar appare nella pagina "Visualizza Profilo" ma **NON** in:
- ❌ Menu dropdown navbar
- ❌ Commenti
- ❌ Post
- ❌ Risultati di ricerca

## 🔍 Diagnosi

Il log dice: **"No avatar found for institute"**

Questo significa che `logo_url` è **NULL** nel database.

## 📋 Possibili Cause

### Causa 1: Avatar Non Caricato
Non hai mai caricato un avatar tramite "Modifica Profilo"

### Causa 2: Upload Fallito
Hai provato a caricare ma l'upload è fallito silenziosamente

### Causa 3: logo_url Non Aggiornato
Il file è stato caricato nello storage ma `logo_url` non è stato aggiornato nel database

## 🔧 Soluzione Step-by-Step

### Step 1: Verifica Situazione

Esegui in Supabase SQL Editor:

```sql
-- Copia e incolla il contenuto di 🔍_VERIFICA_AVATAR_DATABASE.sql
```

Questo ti dirà:
- ✅ Se logo_url ha un valore
- ✅ Se ci sono file nello storage
- ✅ Se il bucket è configurato correttamente

### Step 2: Interpreta Risultati

#### Scenario A: logo_url = NULL, storage vuoto
**Causa**: Avatar non caricato
**Soluzione**: Vai su "Modifica Profilo" e carica l'avatar

#### Scenario B: logo_url = NULL, storage ha file
**Causa**: File caricato ma logo_url non aggiornato
**Soluzione**: Esegui `🔧_FIX_LOGO_URL_MANCANTE.sql`

#### Scenario C: logo_url ha valore, storage vuoto
**Causa**: File eliminato
**Soluzione**: Ricarica l'avatar

#### Scenario D: Entrambi presenti
**Causa**: Problema di permessi o URL errato
**Soluzione**: Verifica bucket pubblico e policy RLS

### Step 3: Applica Fix

#### Se Scenario A (avatar non caricato):
1. Vai su "Modifica Profilo"
2. Carica un'immagine
3. Salva
4. Ricarica pagina (Ctrl+Shift+R)

#### Se Scenario B (logo_url non aggiornato):
1. Esegui `🔧_FIX_LOGO_URL_MANCANTE.sql`
2. Verifica che logo_url sia stato aggiornato
3. Ricarica pagina (Ctrl+Shift+R)

#### Se Scenario C (file eliminato):
1. Vai su "Modifica Profilo"
2. Ricarica l'avatar
3. Salva
4. Ricarica pagina (Ctrl+Shift+R)

#### Se Scenario D (permessi):
1. Verifica bucket pubblico:
```sql
UPDATE storage.buckets SET public = true WHERE id = 'avatars';
```
2. Verifica policy RLS (esegui `🔧_FIX_AVATAR_UNIVERSALE.sql`)
3. Ricarica pagina (Ctrl+Shift+R)

## 🎯 Quick Fix

**Se vuoi testare subito**, esegui questo per un avatar placeholder:

```sql
UPDATE school_institutes
SET logo_url = 'https://ui-avatars.com/api/?name=Istituto&size=200&background=6366f1&color=fff&bold=true'
WHERE id = '813ebb9e-93f0-4f40-90ae-6204e3935fe8';
```

Poi ricarica la pagina. L'avatar dovrebbe apparire ovunque.

## 🔍 Debug Avanzato

### Verifica Console Browser

Apri F12 → Console e cerca:

```
Loading avatar for user: 813ebb9e-93f0-4f40-90ae-6204e3935fe8
No avatar found for institute
```

Questo conferma che `logo_url` è NULL.

### Verifica Network Tab

F12 → Network → Filtra per "school_institutes"

Guarda la risposta della query. Dovrebbe mostrare `logo_url: null`.

### Verifica Storage Supabase

1. Supabase Dashboard
2. Storage → `avatars` bucket
3. Cerca file con il tuo user ID nel nome
4. Se presente → Scenario B (logo_url non aggiornato)
5. Se assente → Scenario A (avatar non caricato)

## ✅ Checklist Risoluzione

- [ ] Eseguito `🔍_VERIFICA_AVATAR_DATABASE.sql`
- [ ] Identificato scenario (A, B, C, o D)
- [ ] Applicato fix appropriato
- [ ] Verificato logo_url non è più NULL
- [ ] Ricaricato pagina con Ctrl+Shift+R
- [ ] Avatar visibile in menu dropdown
- [ ] Avatar visibile nei post
- [ ] Avatar visibile nei commenti
- [ ] Avatar visibile nella ricerca

## 🎯 Risultato Atteso

Dopo il fix, dovresti vedere nel log:

```
Loading avatar for user: 813ebb9e-93f0-4f40-90ae-6204e3935fe8
Found institute avatar: https://...
Updating all avatars with URL: https://...
```

E l'avatar dovrebbe apparire ovunque! ✅

---

**Esegui `🔍_VERIFICA_AVATAR_DATABASE.sql` per iniziare la diagnosi! 🔍**
