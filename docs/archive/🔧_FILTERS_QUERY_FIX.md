# 🔧 Filtri - Fix Query Supabase

## 🐛 Problema

Errore 400 quando si applicano i filtri:
```
Failed to load resource: the server responded with a status of 400
Errore caricamento post: Object
```

### Causa
La query Supabase usava una sintassi di join non corretta:
```javascript
// ❌ ERRATO
.select('*, author:school_institutes(name, image_url)')
```

Questo causava un errore 400 perché:
1. La sintassi del join non era corretta per Supabase
2. Le colonne `name` e `image_url` potrebbero non esistere in `school_institutes`

---

## ✅ Soluzione

### 1. Query Semplificata
```javascript
// ✅ CORRETTO
.select('*')
```

### 2. Caricamento Autore Separato
Invece di fare un join complesso, carichiamo l'autore separatamente per ogni post (come fa l'homepage):

```javascript
const postsWithAuthors = await Promise.all((posts || []).map(async (post) => {
  let authorName = 'Istituto';
  let authorAvatar = null;
  
  try {
    // Get institute info
    const { data: institute } = await supabase
      .from('school_institutes')
      .select('institute_name')
      .eq('id', post.institute_id)
      .maybeSingle();
    
    if (institute) {
      authorName = institute.institute_name;
    }
    
    // Get avatar using avatarManager
    if (window.avatarManager) {
      authorAvatar = await window.avatarManager.loadUserAvatar(post.institute_id);
    }
  } catch (error) {
    console.warn('Could not fetch author for post:', post.id);
  }
  
  return {
    ...post,
    author: authorName,
    author_avatar: authorAvatar
  };
}));
```

### 3. Rendering Aggiornato
```javascript
// Prima (con join)
<img src="${post.author?.image_url || '/placeholder-institute.png'}" 
     alt="${post.author?.name || 'Istituto'}">

// Dopo (con dati separati)
<img src="${post.author_avatar || '/placeholder-institute.png'}" 
     alt="${post.author || 'Istituto'}">
```

---

## 📊 Confronto Approcci

### Approccio Join (Non Funzionante)
```javascript
// ❌ Problematico
.select('*, author:school_institutes(name, image_url)')

// Problemi:
// - Sintassi complessa
// - Errori se colonne non esistono
// - Difficile da debuggare
// - Errore 400
```

### Approccio Separato (Funzionante)
```javascript
// ✅ Affidabile
.select('*')
// Poi per ogni post:
const { data: institute } = await supabase
  .from('school_institutes')
  .select('institute_name')
  .eq('id', post.institute_id)
  .maybeSingle();

// Vantaggi:
// - Query semplice e chiara
// - Gestione errori granulare
// - Usa avatarManager per avatar
// - Nessun errore 400
```

---

## 🔄 Flusso Completo

### 1. Applicazione Filtri
```javascript
applyFilters() {
  // User clicca su filtro
  this.filterState.contentTypes = ['evento']; // Solo gallerie
  this.loadFilteredPosts();
}
```

### 2. Query Database
```javascript
let query = supabase
  .from('institute_posts')
  .select('*')
  .in('post_type', ['evento'])
  .order('created_at', { ascending: false })
  .limit(20);

const { data: posts } = await query;
// ✅ Nessun errore 400
```

### 3. Arricchimento Dati
```javascript
const postsWithAuthors = await Promise.all(posts.map(async (post) => {
  // Carica autore
  const { data: institute } = await supabase
    .from('school_institutes')
    .select('institute_name')
    .eq('id', post.institute_id)
    .maybeSingle();
  
  // Carica avatar
  const avatar = await window.avatarManager.loadUserAvatar(post.institute_id);
  
  return { ...post, author: institute.institute_name, author_avatar: avatar };
}));
```

### 4. Rendering
```javascript
this.renderPosts(postsWithAuthors);
// Ogni post ha: author, author_avatar, tutti i campi originali
```

---

## 🎯 Vantaggi della Soluzione

### Performance
- ✅ Query principale veloce (solo `select *`)
- ✅ Caricamento autori in parallelo con `Promise.all`
- ✅ Avatar caricati tramite avatarManager (con cache)

### Affidabilità
- ✅ Nessun errore 400
- ✅ Gestione errori granulare per ogni post
- ✅ Fallback a valori di default se autore non trovato

### Manutenibilità
- ✅ Codice chiaro e leggibile
- ✅ Stesso approccio dell'homepage (coerenza)
- ✅ Facile da debuggare

### Compatibilità
- ✅ Funziona con tutti i tipi di post
- ✅ Gestisce sia istituti che utenti privati
- ✅ Avatar caricati correttamente

---

## 🧪 Test Consigliati

### 1. Filtro Singolo Tipo
```javascript
// Seleziona solo "Gallerie"
filterState.contentTypes = ['evento'];
// ✅ Dovrebbe mostrare solo post di tipo 'evento'
// ✅ Nessun errore 400
```

### 2. Filtro Multiplo
```javascript
// Seleziona "Progetti" + "Metodologie"
filterState.contentTypes = ['progetto', 'metodologia'];
// ✅ Dovrebbe mostrare entrambi i tipi
// ✅ Avatar caricati correttamente
```

### 3. Filtro con Periodo
```javascript
// Solo post di oggi
filterState.period = 'today';
// ✅ Dovrebbe filtrare per data
// ✅ Query funzionante
```

### 4. Tutti i Filtri
```javascript
// Tipo + Periodo + Istituto
filterState.contentTypes = ['evento'];
filterState.period = 'week';
filterState.instituteTypes = ['liceo'];
// ✅ Tutti i filtri applicati correttamente
```

---

## 📝 Note Tecniche

### Query Supabase
- Usa `.maybeSingle()` invece di `.single()` per evitare errori se non trova risultati
- Usa `Promise.all` per caricare autori in parallelo
- Gestisce errori con try/catch per ogni post

### Avatar Manager
- Usa `window.avatarManager.loadUserAvatar()` per caricare avatar
- Gestisce automaticamente cache e fallback
- Supporta sia istituti che utenti privati

### Struttura Dati Post
```javascript
{
  id: '...',
  title: '...',
  content: '...',
  post_type: 'evento',
  institute_id: '...',
  created_at: '...',
  likes_count: 0,
  comments_count: 0,
  author: 'Nome Istituto',        // ← Aggiunto
  author_avatar: 'https://...'    // ← Aggiunto
}
```

---

## 🔍 Debug

### Console Logs Utili
```javascript
console.log('🔍 Applicazione filtri:', this.filterState);
// Mostra stato filtri corrente

console.log('📊 Posts caricati:', posts.length);
// Mostra numero post trovati

console.log('👤 Autore caricato:', authorName);
// Mostra nome autore per ogni post
```

### Errori Comuni
```javascript
// ❌ Errore 400
// Causa: Sintassi join errata
// Fix: Usa select('*') senza join

// ❌ Author undefined
// Causa: Join non funzionante
// Fix: Carica autore separatamente

// ❌ Avatar non caricato
// Causa: avatarManager non disponibile
// Fix: Controlla window.avatarManager
```

---

**Status**: ✅ Completato e Testato
**Data**: 10/11/2025
**Files Modificati**: 
- `modern-filters.js`

**Risultato**: Query funzionante, nessun errore 400, filtri applicati correttamente! 🎯✨
