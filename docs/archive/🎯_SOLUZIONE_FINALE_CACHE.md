# 🎯 SOLUZIONE FINALE - Refresh Cache Supabase

## ✅ Situazione Attuale

Le colonne nel database sono **TUTTE PRESENTI**:
- ✅ target_audience
- ✅ subject_areas
- ✅ Tutte le altre colonne

**Problema**: La cache di PostgREST (API Supabase) non si è aggiornata.

---

## 🚀 SOLUZIONE RAPIDA (3 Metodi)

### Metodo 1: Esegui lo Script SQL ⚡ (CONSIGLIATO)

1. Apri **Supabase SQL Editor**
2. Copia il contenuto di **⚡_REFRESH_CACHE_SUPABASE.sql**
3. Esegui lo script
4. Lo script farà:
   - ✅ Verifica colonne
   - ✅ Ricrea le policy RLS (forza refresh)
   - ✅ Invia comando `NOTIFY pgrst, 'reload schema'`
   - ✅ Testa un INSERT

---

### Metodo 2: Restart API Manuale 🔄

1. Vai su **Supabase Dashboard**
2. Clicca su **Settings** (ingranaggio in basso a sinistra)
3. Vai su **API**
4. Clicca su **Restart API** (o **Restart Server**)
5. Aspetta 30 secondi

---

### Metodo 3: Aspetta 5 Minuti ⏰

La cache di PostgREST si aggiorna automaticamente ogni 5-10 minuti.

---

## 🧪 TESTA SUBITO

Dopo aver applicato uno dei metodi:

1. **Aspetta 10 secondi**
2. **Ricarica create.html** con Ctrl+Shift+R
3. **Compila il form** della metodologia
4. **Clicca "Pubblica"**
5. ✅ Dovrebbe funzionare!

---

## 🔍 Se Persiste l'Errore

### Verifica nella Console del Browser

Apri DevTools (F12) e cerca:
```
Error publishing content: {code: 'PGRST204', ...}
```

Se vedi ancora `PGRST204`, significa che la cache non si è aggiornata.

### Soluzione Alternativa: Modifica il Codice JS

Se la cache non si aggiorna, possiamo modificare temporaneamente il codice per non specificare le colonne.

Apri **create-page.js** e cerca questa riga (circa riga 400-450):

```javascript
const { data, error } = await window.supabaseClient
  .from('institute_posts')
  .insert({
    institute_id: userId,
    title: formData.title,
    content: JSON.stringify(formData),
    post_type: 'methodology',
    category: formData.type,
    tags: formData.tags || [],
    published: true,
    published_at: new Date().toISOString(),
    target_audience: [formData.level],
    subject_areas: formData.subjects || []
  })
  .select();
```

**Cambia in:**

```javascript
const { data, error } = await window.supabaseClient
  .from('institute_posts')
  .insert({
    institute_id: userId,
    title: formData.title,
    content: JSON.stringify(formData),
    post_type: 'methodology',
    category: formData.type,
    tags: formData.tags || [],
    published: true,
    target_audience: [formData.level],
    subject_areas: formData.subjects || []
  })
  .select();
```

Rimuovi la riga `published_at` perché viene gestita automaticamente dal trigger.

---

## 📊 Verifica Database

Esegui questa query su Supabase SQL Editor:

```sql
-- Verifica che la tabella sia accessibile via API
SELECT * FROM institute_posts LIMIT 1;

-- Verifica le policy RLS
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'institute_posts';
```

---

## 🎉 Dopo il Fix

Una volta risolto, potrai:
- ✅ Pubblicare metodologie
- ✅ Creare progetti
- ✅ Pubblicare eventi
- ✅ Condividere news
- ✅ Vedere i contenuti nella homepage

---

## 💡 Perché Succede Questo?

PostgREST (l'API REST di Supabase) mantiene una cache dello schema del database per performance. Quando aggiungi nuove colonne, la cache potrebbe non aggiornarsi immediatamente.

**Soluzioni permanenti:**
1. Restart API dopo modifiche allo schema
2. Usare `NOTIFY pgrst, 'reload schema'` negli script SQL
3. Aspettare l'aggiornamento automatico (5-10 min)
