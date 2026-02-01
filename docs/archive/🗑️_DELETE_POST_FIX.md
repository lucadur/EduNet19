# 🗑️ Fix Eliminazione Post

## Problema Risolto
I post eliminati dal feed ricomparivano dopo il refresh della pagina perché non venivano effettivamente cancellati dal database.

## Causa
La funzione `deletePost` in `homepage-script.js` cercava di eliminare i post dalla tabella `posts`, ma i post sono memorizzati nella tabella `institute_posts`.

## Soluzione
**File modificato**: `homepage-script.js`

### Prima (NON funzionante):
```javascript
const { error} = await supabase
  .from('posts')  // ❌ Tabella sbagliata!
  .delete()
  .eq('id', postId)
  .eq('author_id', user.id);
```

### Dopo (funzionante):
```javascript
const { error } = await supabase
  .from('institute_posts')  // ✅ Tabella corretta!
  .delete()
  .eq('id', postId)
  .eq('institute_id', user.id);  // ✅ Campo corretto!
```

## Modifiche
1. ✅ Cambiata tabella da `posts` a `institute_posts`
2. ✅ Cambiato campo da `author_id` a `institute_id`
3. ✅ Aggiunto log di successo per debugging

## Test
1. Vai sulla homepage
2. Trova un tuo post
3. Clicca sui tre puntini (⋮)
4. Seleziona "Elimina post"
5. Conferma l'eliminazione
6. Ricarica la pagina
7. ✅ Il post NON deve ricomparire

## Note
- Solo l'autore del post può eliminarlo (controllo con `institute_id`)
- L'eliminazione è permanente e non può essere annullata
- Viene tracciata l'attività di eliminazione
