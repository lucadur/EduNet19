# 📱 Menu Mobile Globale - Guida Implementazione

## Problema
Il menu mobile (bottom nav + hamburger) è presente solo nella homepage, ma manca in altre pagine come profile.html, create.html, edit-profile.html, ecc.

## Soluzione
Copiare il menu mobile dalla homepage in tutte le altre pagine.

## File da Modificare

### Pagine da Aggiornare
1. `profile.html`
2. `edit-profile.html`
3. `create.html`
4. `settings.html` (se esiste)

## Componenti da Copiare

### 1. Bottom Navigation (da homepage.html linee 1105-1128)
```html
<!-- Mobile Bottom Navigation -->
<nav class="mobile-bottom-nav" role="navigation" aria-label="Navigazione mobile">
    <a href="homepage.html" class="mobile-nav-item" data-section="feed">
        <i class="fas fa-home" aria-hidden="true"></i>
        <span>Home</span>
    </a>
    <a href="#" class="mobile-nav-item" data-section="saved">
        <i class="fas fa-bookmark" aria-hidden="true"></i>
        <span>Salvati</span>
    </a>
    <a href="create.html" class="mobile-nav-item create-btn">
        <i class="fas fa-plus" aria-hidden="true"></i>
        <span>Crea</span>
    </a>
    <a href="#" class="mobile-nav-item" data-section="notifications">
        <i class="fas fa-bell" aria-hidden="true"></i>
        <span>Notifiche</span>
    </a>
    <a href="profile.html" class="mobile-nav-item" data-section="profile">
        <i class="fas fa-user" aria-hidden="true"></i>
        <span>Profilo</span>
    </a>
</nav>
```

### 2. Hamburger Menu (da homepage.html linee 205-297)
```html
<!-- Mobile Menu Toggle -->
<button class="mobile-menu-toggle" aria-label="Menu mobile" id="mobile-menu-toggle">
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
</button>

<!-- Mobile Menu Overlay -->
<div class="mobile-menu-overlay" id="mobile-menu-overlay">
    <div class="mobile-menu-content">
        <!-- Close Button -->
        <button class="mobile-menu-close" aria-label="Chiudi menu mobile" id="mobile-menu-close">
            <i class="fas fa-times" aria-hidden="true"></i>
        </button>
        
        <!-- User Info -->
        <div class="mobile-menu-user">
            <div class="mobile-user-avatar" id="mobile-user-avatar">
                <i class="fas fa-user-circle" aria-hidden="true"></i>
            </div>
            <div class="mobile-user-info">
                <h3 id="mobile-user-name">Nome Utente</h3>
                <p id="mobile-user-type">Tipo Account</p>
            </div>
        </div>
        
        <!-- Mobile Menu Items -->
        <nav class="mobile-menu-nav">
            <a href="homepage.html" class="mobile-menu-item">
                <i class="fas fa-home" aria-hidden="true"></i>
                <span>Home</span>
            </a>
            <a href="profile.html" class="mobile-menu-item" id="mobile-profile">
                <i class="fas fa-user" aria-hidden="true"></i>
                <span>Il Mio Profilo</span>
            </a>
            <a href="settings.html" class="mobile-menu-item" id="mobile-settings">
                <i class="fas fa-cog" aria-hidden="true"></i>
                <span>Impostazioni</span>
            </a>
            
            <div class="mobile-menu-divider"></div>
            
            <button class="mobile-menu-item logout" id="mobile-logout">
                <i class="fas fa-sign-out-alt" aria-hidden="true"></i>
                <span>Esci</span>
            </button>
        </nav>
    </div>
</div>
```

## CSS Necessari

Assicurati che ogni pagina includa:
```html
<link rel="stylesheet" href="homepage-styles.css">
<link rel="stylesheet" href="mobile-search.css">
```

## JavaScript Necessario

Ogni pagina deve inizializzare il menu mobile. Aggiungi questo codice:

```javascript
// Setup mobile menu
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
const mobileMenuClose = document.getElementById('mobile-menu-close');
const mobileLogout = document.getElementById('mobile-logout');

if (mobileMenuToggle && mobileMenuOverlay) {
  mobileMenuToggle.addEventListener('click', () => {
    mobileMenuOverlay.classList.toggle('show');
    document.body.style.overflow = mobileMenuOverlay.classList.contains('show') ? 'hidden' : '';
  });
}

if (mobileMenuClose) {
  mobileMenuClose.addEventListener('click', () => {
    mobileMenuOverlay.classList.remove('show');
    document.body.style.overflow = '';
  });
}

if (mobileLogout) {
  mobileLogout.addEventListener('click', async () => {
    if (confirm('Sei sicuro di voler uscire?')) {
      if (window.supabaseClientManager) {
        const supabase = await window.supabaseClientManager.getClient();
        await supabase.auth.signOut();
      }
      window.location.href = 'index.html';
    }
  });
}
```

## Posizionamento

### Bottom Nav
Inserire **prima del tag `</body>`** in ogni pagina

### Hamburger Menu
Inserire **dentro il `<header class="top-nav">`** dopo il logo

## Active State

Per evidenziare la pagina corrente nel menu:

```javascript
// Evidenzia pagina corrente
const currentPage = window.location.pathname.split('/').pop();
document.querySelectorAll('.mobile-nav-item').forEach(item => {
  const href = item.getAttribute('href');
  if (href && href.includes(currentPage)) {
    item.classList.add('active');
  }
});
```

## Test

Dopo l'implementazione, testa su mobile (o DevTools mobile view):
1. ✅ Bottom nav visibile in tutte le pagine
2. ✅ Hamburger menu funzionante
3. ✅ Navigazione tra pagine
4. ✅ Logout funzionante
5. ✅ Active state corretto

## Note
- Il menu è già responsive (CSS esistente)
- Gli stili sono in `homepage-styles.css`
- Avatar manager gestisce automaticamente le immagini profilo
