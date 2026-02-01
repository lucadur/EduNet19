# 🔧 Fix: Content Reports - Nomi Colonne Corretti

## ❌ Problema

**Errore:**
```
ERROR: 42703: column "content_type" does not exist
ERROR: 42703: column "content_id" does not exist
```

**Causa:** La tabella `content_reports` esiste già nel database con nomi di colonne diversi da quelli che avevo usato nel codice.

---

## 🔍 Colonne Esistenti vs Usate

### Tabella `content_reports` (esistente in database)

```sql
CREATE TABLE public.content_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  reported_content_type VARCHAR(50) NOT NULL,  ← ESISTENTE
  reported_content_id UUID NOT NULL,           ← ESISTENTE
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  moderator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);
```

### Codice JavaScript (errato)

```javascript
// ❌ PRIMA (ERRATO)
await supabase
  .from('content_reports')
  .insert({
    reporter_id: user.id,
    content_type: 'post',    // ← ERRATO
    content_id: postId,      // ← ERRATO
    reason: 'user_report',
    status: 'pending'
  });
```

---

## ✅ Soluzione

### 1. Schema SQL Corretto

Creato `post-menu-actions-schema-FIXED.sql` che:
- ✅ NON crea `content_reports` (già esiste)
- ✅ Crea solo `saved_posts`, `muted_users`, `hidden_posts`
- ✅ Aggiunge indici mancanti a `content_reports`
- ✅ Usa i nomi corretti delle colonne

### 2. Codice JavaScript Corretto

**File:** `homepage-script.js`

```javascript
// ✅ DOPO (CORRETTO)
async reportPost(postId) {
  try {
    if (!window.supabaseClientManager?.client) {
      console.log('Demo mode: reportPost', postId);
      return;
    }
    
    const supabase = await window.supabaseClientManager.getClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');
    
    const { error } = await supabase
      .from('content_reports')
      .insert({
        reporter_id: user.id,
        reported_content_type: 'post',  // ← CORRETTO
        reported_content_id: postId,    // ← CORRETTO
        reason: 'user_report',
        status: 'pending'
      });
      
    if (error) throw error;
    
  } catch (error) {
    console.error('Error reporting post:', error);
    throw error;
  }
}
```

---

## 📊 Mapping Colonne

| Codice Originale | Database Reale | Fix Applicato |
|------------------|----------------|---------------|
| `content_type` | `reported_content_type` | ✅ Corretto |
| `content_id` | `reported_content_id` | ✅ Corretto |
| `resolution_notes` | `moderator_notes` | ⚠️ Nota |
| `reviewed_by` | *non esiste* | ⚠️ Non usato |
| `reviewed_at` | *non esiste* | ⚠️ Non usato |
| `updated_at` | *non esiste* | ⚠️ Non usato |

---

## 🚀 Come Applicare il Fix

### Step 1: Esegui lo Schema Corretto

```bash
1. Apri Supabase Dashboard → SQL Editor
2. Copia il contenuto di: post-menu-actions-schema-FIXED.sql
3. Incolla nell'editor
4. Run (Ctrl+Enter)
```

**Risultato atteso:**
```
✅ Schema post-menu-actions creato con successo!

Tabelle create:
  - saved_posts (post salvati)
  - muted_users (utenti silenziati)
  - hidden_posts (post nascosti)
  - content_reports (già esistente, indici aggiunti)
```

### Step 2: Il Codice JS è Già Corretto

✅ Il fix è già stato applicato a `homepage-script.js`

**Modifiche:**
- Riga 2648: `content_type` → `reported_content_type`
- Riga 2649: `content_id` → `reported_content_id`

### Step 3: Testa

1. Ricarica homepage (Ctrl+F5)
2. Click 3 pallini → "Segnala contenuto"
3. Verifica:
   - ✅ Nessun errore in console
   - ✅ Notifica: "📢 Segnalazione inviata..."

---

## 🧪 Test SQL

### Verifica Segnalazione Creata

```sql
-- Verifica che la segnalazione sia stata inserita
SELECT * FROM content_reports 
WHERE reported_content_type = 'post'
ORDER BY created_at DESC 
LIMIT 5;
```

### Verifica Struttura Tabella

```sql
-- Verifica i nomi delle colonne
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'content_reports'
ORDER BY ordinal_position;
```

Risultato atteso deve includere:
- `reported_content_type` (not `content_type`)
- `reported_content_id` (not `content_id`)

---

## 📝 Differenze Database Originale

### Altre Tabelle (già nel database)

Queste tabelle erano già presenti e **NON** sono state modificate:
- `user_profiles` (riferito da `reporter_id`)
- `posts` (riferito da `hidden_posts.post_id` e `saved_posts.post_id`)

### Nuove Tabelle Create

Queste sono le **uniche 3 nuove tabelle**:
1. ✅ `saved_posts`
2. ✅ `muted_users`
3. ✅ `hidden_posts`

### Tabella Esistente Aggiornata

1. ✅ `content_reports` (indici aggiunti, nessuna modifica struttura)

---

## ✅ Checklist Finale

### Database
- [x] Schema FIXED creato
- [ ] Schema FIXED eseguito su Supabase ⚠️ DA FARE
- [x] Colonne corrette: `reported_content_type`, `reported_content_id`

### Codice
- [x] `homepage-script.js` corretto
- [x] `reportPost()` usa nomi corretti
- [x] Altre funzioni non modificate (OK)

### Test
- [ ] Test "Segnala contenuto" ⚠️ DA FARE
- [ ] Verifica nessun errore 42703
- [ ] Verifica segnalazione inserita in DB

---

## 🎯 Prossimo Step

### ⚠️ AZIONE RICHIESTA

1. **Esegui lo schema corretto:**
   ```
   post-menu-actions-schema-FIXED.sql
   ```

2. **Ricarica homepage:**
   ```
   Ctrl + F5
   ```

3. **Testa segnalazione:**
   - Click 3 pallini
   - Click "Segnala contenuto"
   - Verifica: ✅ Nessun errore

**Tempo stimato:** 2 minuti

---

## 🐛 Se Continua a Non Funzionare

### Errore: "reporter_id violates foreign key constraint"

**Causa:** `reporter_id` riferisce `user_profiles(id)` ma stiamo passando `auth.users.id`

**Soluzione:**
```javascript
// Opzione 1: Usare user_profiles.id
const { data: profile } = await supabase
  .from('user_profiles')
  .select('id')
  .eq('user_id', user.id)
  .single();

await supabase.from('content_reports').insert({
  reporter_id: profile.id, // ← ID del profilo, non dell'utente auth
  // ...
});

// Opzione 2: Modificare la foreign key nel database
ALTER TABLE content_reports 
  DROP CONSTRAINT content_reports_reporter_id_fkey;
  
ALTER TABLE content_reports 
  ADD CONSTRAINT content_reports_reporter_id_fkey 
  FOREIGN KEY (reporter_id) 
  REFERENCES auth.users(id) ON DELETE CASCADE;
```

---

**Creato:** 30 settembre 2025  
**Fix per:** Errore "column content_type does not exist"  
**File corretti:**
- `post-menu-actions-schema-FIXED.sql` (nuovo)
- `homepage-script.js` (aggiornato)

**Status:** ✅ Fix applicato, pronto per il test
