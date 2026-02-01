# ⚡ Quick Start: Abilita Menu Post

## 🎯 Obiettivo
Risolvere l'errore `404 on saved_posts` e rendere tutte le azioni del menu funzionanti.

---

## 📋 Step 1: Applica Schema Database (2 minuti)

### 1. Apri Supabase Dashboard
```
https://supabase.com/dashboard/project/[TUO_PROJECT_ID]
```

### 2. Vai su SQL Editor
- Click su "SQL Editor" nella sidebar sinistra
- Click su "New query"

### 3. Copia lo Schema
- Apri il file: `post-menu-actions-schema.sql`
- Seleziona tutto (Ctrl+A)
- Copia (Ctrl+C)

### 4. Incolla ed Esegui
- Incolla nell'editor SQL di Supabase (Ctrl+V)
- Click su "Run" (o Ctrl+Enter)

### 5. Verifica Successo
Dovresti vedere:
```
✅ Schema post-menu-actions creato con successo!

Tabelle create:
  - saved_posts (post salvati)
  - muted_users (utenti silenziati)
  - hidden_posts (post nascosti)
  - content_reports (segnalazioni)
```

---

## 🧪 Step 2: Testa Funzionalità (3 minuti)

### 1. Ricarica Homepage
```
Ctrl + F5 (hard reload)
```

### 2. Apri Console (F12)
Verifica che **NON** ci siano questi errori:
```
❌ 404 on saved_posts
❌ table does not exist
```

### 3. Testa "Salva Post"
1. Click sui 3 pallini di un post
2. Click su "💾 Salva post"
3. Verifica notifica: "Post salvato nei preferiti"
4. **Console deve essere pulita (nessun errore)** ✅

### 4. Testa Altre Azioni
- 🔗 Copia link → ✅ Link copiato
- 📤 Condividi → ✅ Dialog condivisione
- 🔕 Non seguire autore → ✅ "Non vedrai più post di..."
- 👁️ Nascondi post → ✅ Post scompare
- 🚩 Segnala → ✅ "Segnalazione inviata"

### 5. Testa Elimina (solo su tuoi post)
1. Vai su un tuo post
2. Click 3 pallini
3. Dovresti vedere "✏️ Modifica" e "🗑️ Elimina"
4. Click "Elimina"
5. Conferma
6. Post scompare ✅

---

## 🎉 Fatto!

Se tutti i test passano:
- ✅ Database configurato correttamente
- ✅ Tutte le azioni funzionano
- ✅ Nessun errore in console

---

## 🐛 Problemi?

### Errore: "saved_posts already exists"
**Soluzione:** La tabella esiste già. Esegui solo le parti mancanti o salta questo errore.

### Errore: "permission denied"
**Soluzione:** Verifica di essere connesso come owner del progetto Supabase.

### Errore persiste in console
**Soluzione:**
1. Verifica tabelle create:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('saved_posts', 'muted_users', 'hidden_posts');
   ```
2. Risultato atteso: 3 righe

### Menu non si apre
**Soluzione:** Ricarica con Ctrl+F5 (hard reload)

---

## 📚 Documentazione Completa

Per dettagli completi:
- `POST-MENU-ACTIONS-GUIDE.md` - Guida completa
- `POST-MENU-IMPLEMENTATION-SUMMARY.md` - Riepilogo
- `FIX-POST-MENU-POSITIONING.md` - Fix UI/UX

---

**Tempo totale: ~5 minuti**  
**Difficoltà: ⭐ Facile**  
**Risultato: Menu post completamente funzionante! 🎉**
