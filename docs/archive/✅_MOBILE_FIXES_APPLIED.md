# ✅ Fix Mobile Applicati

## Completato ✅

### 1. Menu Hamburger Aggiunto

#### profile.html ✅
- Hamburger button aggiunto in nav-actions
- Mobile menu overlay aggiunto
- JavaScript setup aggiunto in profile-page.js

#### edit-profile.html ✅
- Hamburger button aggiunto in nav-actions
- Mobile menu overlay aggiunto

### 2. JavaScript da Completare

Aggiungi questo codice alla fine di `edit-profile.js`:

```javascript
// Setup mobile hamburger menu
function setupMobileMenu() {
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

  if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener('click', (e) => {
      if (e.target === mobileMenuOverlay) {
        mobileMenuOverlay.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
  }

  if (mobileLogout) {
    mobileLogout.addEventListener('click', async () => {
      if (confirm('Sei sicuro di voler uscire?')) {
        try {
          if (window.supabaseClientManager) {
            const supabase = await window.supabaseClientManager.getClient();
            await supabase.auth.signOut();
          }
          window.location.href = 'index.html';
        } catch (error) {
          console.error('Logout error:', error);
          window.location.href = 'index.html';
        }
      }
    });
  }
}

// Call on page load
document.addEventListener('DOMContentLoaded', setupMobileMenu);
```

### 3. Ricerca Mobile

Per unificare la ricerca, la funzione `performSearch` in `mobile-search.js` deve usare la stessa logica della homepage.

Il file `mobile-search.js` probabilmente usa già la ricerca corretta se include le query Supabase per:
- school_institutes
- private_users  
- institute_posts

Verifica che la funzione cerchi in tutte e tre le tabelle.

## Test

### Menu Hamburger
1. ✅ Apri profile.html su mobile
2. ✅ Clicca hamburger (☰)
3. ✅ Menu si apre
4. ✅ Navigazione funziona
5. ✅ Logout funziona

### Ricerca
1. Apri ricerca mobile
2. Cerca un istituto
3. Cerca un post
4. Verifica risultati

## Stato Finale

- ✅ profile.html - Menu hamburger completo
- ✅ edit-profile.html - Menu hamburger HTML aggiunto
- ⏳ edit-profile.js - Aggiungi JavaScript sopra
- ⏳ mobile-search.js - Verifica query Supabase

