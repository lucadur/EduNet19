# 🔧 Fix Saved Posts - Schema Corretto

## ❌ Problema

Quando si clicca su "Salvati" nella sidebar, viene visualizzato un errore:

```
Error loading saved posts: {code: '42703', details: null, hint: null, message: 'column posts_1.category does not exist'}
```

## 🔍 Causa

1. **Tabella errata**: Lo schema SQL faceva riferimento a `public.posts` che non esiste
2. **Colonne errate**: La query cercava colonne come `category`, `likes`, `comments` che non esistono o hanno nomi diversi
3. **Tabella reale**: La tabella corretta è `public.institute_posts` con colonne come `likes_count`, `comments_count`, `shares_count`

## ✅ Soluzione Applicata

### 1. SQL Schema Corretto (`post-menu-actions-schema-FIXED.sql`)

**Prima:**
```sql
CREATE TABLE IF NOT EXISTS public.saved_posts (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  ...
);
```

**Dopo:**
```sql
CREATE TABLE IF NOT EXISTS public.saved_posts (
  post_id UUID NOT NULL REFERENCES public.institute_posts(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT now(),  -- ✅ Rinominato da created_at
  ...
);
```

### 2. Query JavaScript Corretta (`saved-posts.js`)

**Prima:**
```javascript
.select(`
  id, created_at, post_id,
  posts (
    id, title, content, author_id, category,
    created_at, likes, comments, shares
  )
`)
```

**Dopo:**
```javascript
.select(`
  id, saved_at, post_id,
  institute_posts:post_id (
    id, title, content, institute_id, post_type,
    images_urls, created_at,
    likes_count, comments_count, shares_count
  )
`)
.order('saved_at', { ascending: false });  // ✅ Usa saved_at
```

### 3. Normalizzazione Dati

Mapping dei dati ricevuti per compatibilità:

```javascript
this.savedPosts = (savedData || [])
  .filter(item => item.institute_posts !== null)
  .map(item => ({
    saved_id: item.id,
    saved_at: item.saved_at,  // ✅ Usa saved_at invece di created_at
    post: {
      ...item.institute_posts,
      // Normalizza i nomi
      author_id: item.institute_posts.institute_id,
      likes: item.institute_posts.likes_count,
      comments: item.institute_posts.comments_count,
      shares: item.institute_posts.shares_count,
      image_url: item.institute_posts.images_urls?.[0] || null
    }
  }));
```

## 📝 Applicare le Correzioni

### Step 1: Aggiorna il Database Supabase

Esegui questo SQL nel SQL Editor di Supabase:

```sql
-- Drop tabella esistente se presente (perderà i dati salvati esistenti!)
DROP TABLE IF EXISTS public.saved_posts CASCADE;
DROP TABLE IF EXISTS public.hidden_posts CASCADE;

-- Poi esegui tutto il contenuto di post-menu-actions-schema-FIXED.sql
```

**⚠️ ATTENZIONE:** Questo eliminerà tutti i post salvati esistenti!

### Step 2: Verifica

1. Ricarica la pagina
2. Salva un post (click sui 3 pallini → "Salva")
3. Click su "Salvati" nella sidebar
4. Dovrebbe mostrare i post salvati correttamente

## 🎯 File Modificati

| File | Modifiche |
|------|-----------|
| `post-menu-actions-schema-FIXED.sql` | ✅ Reference a `institute_posts`, colonna `saved_at` |
| `saved-posts.js` | ✅ Query corretta con `institute_posts:post_id` |
| `saved-posts.js` | ✅ Normalizzazione dati ricevuti |

## 🔗 Schema Corretto Completo

### Saved Posts
```sql
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.institute_posts(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT saved_posts_unique_user_post UNIQUE (user_id, post_id)
);
```

### Hidden Posts
```sql
CREATE TABLE IF NOT EXISTS public.hidden_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.institute_posts(id) ON DELETE CASCADE,
  hidden_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT hidden_posts_unique_user_post UNIQUE (user_id, post_id)
);
```

## ✅ Risultato

Ora la sezione "Salvati":
- ✅ Carica correttamente i post salvati
- ✅ Mostra le statistiche (totale, questa settimana, categoria)
- ✅ Permette di filtrare (Tutti, Recenti, Meno Recenti, Più Apprezzati)
- ✅ Visualizza i post con tutte le info (titolo, contenuto, likes, commenti, shares)

---

**Data Fix:** 30 settembre 2025  
**Status:** ✅ RISOLTO  
**Azione Richiesta:** Eseguire lo script SQL aggiornato su Supabase
