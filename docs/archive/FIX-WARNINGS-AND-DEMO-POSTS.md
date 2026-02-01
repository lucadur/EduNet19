# 🔧 FIX: Supabase Warnings & Post Demo

## ✅ Problemi Risolti

### 1. **Post Demo Eliminati**
- ❌ **PRIMA:** La homepage mostrava 10 post di demo quando non c'erano post reali
- ✅ **DOPO:** Mostra solo post reali o empty state

### 2. **Warnings Supabase Risolti**
- ✅ **auth_rls_initplan** - Policy ottimizzate con `(select auth.uid())`
- ✅ **multiple_permissive_policies** - Policy duplicate rimosse
- ✅ **duplicate_index** - Indice duplicato eliminato

---

## 📋 Esegui lo Script SQL

### **STEP 1: Apri Supabase Dashboard**
1. Vai su: https://supabase.com/dashboard
2. Seleziona il tuo progetto
3. Vai su **SQL Editor**

### **STEP 2: Esegui lo script**
1. Copia il contenuto di `fix-posts-table-warnings.sql`
2. Incolla nell'editor SQL
3. Clicca **RUN** o premi `Ctrl+Enter`

### **STEP 3: Verifica**
1. Vai su **Database** → **Linter**
2. Verifica che i warning siano scomparsi

---

## 🗑️ OPZIONALE: Elimina tabella `posts`

La tabella `posts` **NON È USATA** dal frontend. Il sistema usa `institute_posts`.

Se vuoi eliminarla per pulire il database:

```sql
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.post_comments CASCADE;
DROP TABLE IF EXISTS public.post_shares CASCADE;
DROP TABLE IF EXISTS public.user_activities CASCADE;
```

⚠️ **ATTENZIONE:** Questo eliminerà anche:
- Tutti i likes
- Tutti i commenti
- Tutte le condivisioni
- Tutte le attività utente

Se hai dati in queste tabelle che vuoi mantenere, **NON** eseguire questo comando.

---

## 📝 Modifiche al Codice

### **homepage-script.js**
- ❌ Rimossa generazione di post mock
- ✅ Mostra solo post reali da `institute_posts`
- ✅ Empty state quando non ci sono post

---

## 🚀 Come Testare

1. **Ricarica la pagina** (`Ctrl+F5`)
2. **Verifica feed:**
   - Se ci sono post reali → Vedi solo quelli
   - Se non ci sono post → Vedi empty state (non più post demo!)
3. **Crea un nuovo post** → Appare nel feed
4. **Salvalo** → Appare in "Salvati"
5. **Torna al feed** → Vedi solo post reali (non più demo!)

---

## 🎯 Risultato Finale

- ✅ **0 Post Demo** - Solo contenuti reali
- ✅ **0 Warnings Supabase** - Database ottimizzato
- ✅ **Sezione Salvati** - Funziona correttamente
- ✅ **Performance** - Policy RLS ottimizzate

---

## ⚠️ Note Importanti

1. **Tabella `posts`**: È stata creata per errore da `supabase-setup-corrected.sql`. Non è usata dal frontend.
2. **Tabella `institute_posts`**: È la tabella principale usata per tutti i post.
3. **Foreign Keys**: `saved_posts`, `hidden_posts` puntano a `institute_posts` (non a `posts`).

---

## 📞 Supporto

Se hai problemi dopo aver eseguito lo script:
1. Controlla i log nell'SQL Editor di Supabase
2. Verifica che le policy siano state create correttamente
3. Controlla che i nuovi post vengano salvati in `institute_posts`
