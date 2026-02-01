# 🚀 Guida Accesso Pagine EduNet19

## 📍 URL Aggiornati

Dopo la riorganizzazione, le pagine sono state spostate in sottocartelle logiche.

### 🏠 Pagine Principali (Root)

```
http://localhost:8000/index.html          # Landing page
http://localhost:8000/homepage.html       # Homepage autenticati
```

### 👤 Pagine Profilo

```
http://localhost:8000/pages/profile/profile.html       # Visualizza profilo
http://localhost:8000/pages/profile/edit-profile.html  # Modifica profilo
http://localhost:8000/pages/profile/connections.html   # Connessioni
http://localhost:8000/pages/profile/settings.html      # Impostazioni
```

### 🔐 Pagine Autenticazione

```
http://localhost:8000/pages/auth/reset-password.html   # Reset password
```

### 👥 Pagine Admin

```
http://localhost:8000/pages/admin/manage-admins.html   # Gestione admin
http://localhost:8000/pages/admin/accept-invite.html   # Accetta invito
```

### ✨ Altre Pagine

```
http://localhost:8000/pages/main/create.html           # Crea contenuto
```

## 🔗 Link Interni

### Da Homepage a Profilo
```javascript
// Vecchio (non funziona più)
window.location.href = 'profile.html';

// Nuovo (corretto)
window.location.href = 'pages/profile/profile.html';
```

### Da Profilo a Edit
```javascript
// Vecchio
window.location.href = 'edit-profile.html';

// Nuovo (corretto - stesso livello)
window.location.href = 'edit-profile.html';
```

### Da Profilo a Homepage
```javascript
// Vecchio
window.location.href = 'homepage.html';

// Nuovo (corretto - torna alla root)
window.location.href = '../../homepage.html';
```

## 📂 Struttura Path

```
Root Level (/)
├── index.html
├── homepage.html
└── pages/
    ├── auth/
    │   └── reset-password.html
    ├── profile/
    │   ├── profile.html
    │   ├── edit-profile.html
    │   ├── connections.html
    │   └── settings.html
    ├── admin/
    │   ├── manage-admins.html
    │   └── accept-invite.html
    └── main/
        └── create.html
```

## 🎯 Path Relativi

### Da pages/profile/ (2 livelli)
```html
<!-- CSS e JS dalla root -->
<link rel="stylesheet" href="../../styles.css">
<script src="../../config.js"></script>

<!-- CSS da css/components/ -->
<link rel="stylesheet" href="../../css/components/profile-page.css">

<!-- JS da js/profile/ -->
<script src="../../js/profile/profile-page.js"></script>
```

### Da pages/admin/ (2 livelli)
```html
<!-- Stesso pattern -->
<link rel="stylesheet" href="../../styles.css">
<script src="../../js/admin/admin-manager.js"></script>
```

### Da pages/main/ (2 livelli)
```html
<!-- Stesso pattern -->
<link rel="stylesheet" href="../../styles.css">
<script src="../../js/utils/create-page.js"></script>
```

## ⚠️ Errori Comuni

### ❌ Path Assoluti (Non Funzionano)
```html
<link rel="stylesheet" href="/styles.css">
<script src="/js/profile/profile-page.js"></script>
```

### ✅ Path Relativi (Corretti)
```html
<link rel="stylesheet" href="../../styles.css">
<script src="../../js/profile/profile-page.js"></script>
```

## 🔧 Debugging

### CSS Non Caricato?
1. Apri DevTools (F12)
2. Vai su Network
3. Filtra per CSS
4. Verifica path 404

**Fix:** Conta i livelli di profondità e usa `../` correttamente

### JS Non Funziona?
1. Apri Console (F12)
2. Cerca errori di import
3. Verifica path moduli

**Fix:** Aggiorna path relativi in base alla posizione del file

## 📱 Navigazione App

### Menu Principale
```javascript
// Homepage
window.location.href = '/homepage.html';

// Profilo
window.location.href = '/pages/profile/profile.html';

// Crea
window.location.href = '/pages/main/create.html';

// Settings
window.location.href = '/pages/profile/settings.html';
```

### Logout
```javascript
// Torna sempre alla landing
window.location.href = '/index.html';
```

## 🎨 Asset Path

### Immagini
```html
<!-- Da pages/profile/ -->
<img src="../../favicon.svg" alt="Logo">
<img src="../../assets/logo.png" alt="Logo">
```

### Favicon
```html
<!-- Da pages/profile/ -->
<link rel="icon" href="../../favicon.svg">
<link rel="alternate icon" href="../../favicon.ico">
```

## ✅ Checklist Nuova Pagina

Quando crei una nuova pagina in `pages/`:

- [ ] Usa path relativi `../../` per root files
- [ ] Usa path relativi `../../css/` per CSS
- [ ] Usa path relativi `../../js/` per JS
- [ ] Testa il caricamento in DevTools
- [ ] Verifica tutti i link interni
- [ ] Testa la navigazione

## 🚀 Quick Start

### Sviluppo Locale
```bash
# Avvia server
python -m http.server 8000

# Apri browser
http://localhost:8000/index.html
```

### Test Pagine
```bash
# Landing
http://localhost:8000/index.html

# Homepage (richiede login)
http://localhost:8000/homepage.html

# Profilo (richiede login)
http://localhost:8000/pages/profile/profile.html
```

---

**Aggiornato**: 12 Novembre 2025  
**Versione**: 2.0 (Post-riorganizzazione)
