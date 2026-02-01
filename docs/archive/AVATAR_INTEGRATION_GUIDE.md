# 🎨 Guida Integrazione Avatar Manager

## ✅ Cosa è Stato Fatto

Ho creato un sistema centralizzato per gestire gli avatar utente in tutta l'applicazione.

### File Creati
- `avatar-manager.js` - Classe che gestisce il caricamento e l'aggiornamento degli avatar

### File Aggiornati
- `homepage-script.js` - Integrato il caricamento avatar
- `homepage.html` - Aggiunto script avatar-manager.js

## 🚀 Come Completare l'Integrazione

### 1. Aggiungi lo Script agli Altri File HTML

Aggiungi questa riga **prima** dello script principale in ogni file:

```html
<script src="avatar-manager.js" defer></script>
```

**File da aggiornare:**
- `profile.html` - Prima di `profile-page.js`
- `edit-profile.html` - Prima di `edit-profile.js`
- `settings.html` - Prima di `settings-page.js`

### 2. Aggiorna profile-page.js

Nel metodo `loadUserProfile()`, dopo aver caricato il profilo, aggiungi:

```javascript
if (window.avatarManager && instituteProfile) {
  window.avatarManager.updateAllAvatars(instituteProfile.avatar_image);
}
```

### 3. Aggiorna edit-profile.js

Nel metodo `populateForm()`, l'avatar è già gestito. Nessuna modifica necessaria.

### 4. Aggiorna social-features.js

Per mostrare gli avatar nei commenti, nel metodo che crea i commenti, sostituisci:

```javascript
// PRIMA:
<div class="comment-avatar">
  <i class="fas fa-user-circle"></i>
</div>

// DOPO:
<div class="comment-avatar" id="comment-avatar-${comment.id}">
  <i class="fas fa-user-circle"></i>
</div>
```

Poi dopo aver creato il commento:

```javascript
if (window.avatarManager && comment.user_id) {
  window.avatarManager.loadUserAvatar(comment.user_id).then(avatarUrl => {
    if (avatarUrl) {
      const avatarEl = document.getElementById(`comment-avatar-${comment.id}`);
      window.avatarManager.setAvatarByUrl(avatarEl, avatarUrl);
    }
  });
}
```

## 📋 Funzionalità dell'Avatar Manager

### Metodi Principali

1. **`loadCurrentUserAvatar()`**
   - Carica l'avatar dell'utente corrente
   - Aggiorna automaticamente tutti gli avatar nella pagina

2. **`updateAllAvatars(avatarUrl)`**
   - Aggiorna tutti gli avatar dell'utente corrente
   - Navbar, dropdown, mobile menu, profilo

3. **`loadUserAvatar(userId)`**
   - Carica l'avatar di un utente specifico
   - Utile per post/commenti di altri utenti

4. **`setAvatar(elementId, avatarUrl)`**
   - Imposta l'avatar per un elemento specifico
   - Supporta sia `<img>` che `<div>` con background

5. **`createAvatarElement(avatarUrl, className)`**
   - Crea un nuovo elemento avatar
   - Utile per contenuti dinamici

### Dove Vengono Aggiornati gli Avatar

✅ **Navbar** - Menu utente in alto
✅ **Dropdown Menu** - Avatar grande nel menu utente
✅ **Mobile Menu** - Avatar nel menu mobile
✅ **Pagina Profilo** - Avatar principale del profilo
✅ **Post/Commenti** - Avatar nei contenuti (da implementare)

## 🎯 Vantaggi

1. **Centralizzato** - Un solo punto per gestire tutti gli avatar
2. **Automatico** - Si aggiorna automaticamente al caricamento
3. **Efficiente** - Carica l'avatar una volta e lo applica ovunque
4. **Flessibile** - Supporta diversi tipi di elementi HTML
5. **Fallback** - Mostra icona di default se l'avatar non è disponibile

## 🔧 Personalizzazione

### Aggiungere Nuovi Elementi Avatar

Per aggiungere un nuovo elemento che deve mostrare l'avatar:

1. Aggiungi un ID univoco all'elemento HTML
2. Chiama `window.avatarManager.setAvatar(elementId, avatarUrl)`

### Esempio:

```html
<div id="my-custom-avatar">
  <i class="fas fa-user-circle"></i>
</div>
```

```javascript
if (window.avatarManager) {
  window.avatarManager.setAvatar('my-custom-avatar', userAvatarUrl);
}
```

## 📝 Note Importanti

- L'avatar manager si inizializza automaticamente al caricamento della pagina
- Aspetta che Supabase sia pronto prima di caricare gli avatar
- Gli avatar vengono caricati da `school_institutes.avatar_image` o `private_users.avatar_image`
- Se l'avatar non esiste, viene mostrata l'icona di default

## 🐛 Troubleshooting

### Avatar non si carica
1. Verifica che lo script `avatar-manager.js` sia caricato
2. Controlla la console per errori
3. Verifica che l'utente abbia un avatar salvato nel database
4. Controlla che le policy di Storage permettano la lettura

### Avatar non si aggiorna
1. Ricarica la pagina
2. Verifica che `window.avatarManager` sia definito
3. Chiama manualmente `window.avatarManager.loadCurrentUserAvatar()`

## ✨ Prossimi Passi

1. Completare l'integrazione in tutti i file HTML
2. Aggiornare social-features.js per gli avatar nei commenti
3. Aggiungere avatar nei post del feed
4. Testare su tutti i dispositivi
