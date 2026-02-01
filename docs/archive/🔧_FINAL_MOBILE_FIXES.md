# 🔧 Fix Finali Mobile - Guida Completa

## Problemi da Risolvere

### 1. Menu Hamburger Mancante
Profile.html e altre pagine non hanno il menu hamburger mobile in alto a destra.

### 2. Ricerca Mobile Diversa
La ricerca mobile usa un sistema diverso da desktop e non indicizza correttamente.

---

## Fix 1: Aggiungere Menu Hamburger

### File da Modificare
- `profile.html`
- `edit-profile.html`
- Altre pagine senza hamburger

### Codice da Aggiungere

**Posizione**: Dentro `<div class="nav-actions">` nel `<header class="top-nav">`

```html
<!-- Mobile Menu Toggle (PRIMA degli altri nav-actions) -->
<button class="mobile-menu-toggle" aria-label="Menu mobile" id="mobile-menu-toggle">
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
    <span class="hamburger-line"></span>
</button>
```

**Posizione**: Prima del tag `</header>` (dopo il nav-container)

```html
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
            <a href="profile.html" class="mobile-menu-item">
                <i class="fas fa-user" aria-hidden="true"></i>
                <span>Il Mio Profilo</span>
            </a>
            <a href="edit-profile.html" class="mobile-menu-item">
                <i class="fas fa-edit" aria-hidden="true"></i>
                <span>Modifica Profilo</span>
            </a>
            <a href="settings.html" class="mobile-menu-item">
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

### JavaScript da Aggiungere

Aggiungere alla fine del file JavaScript della pagina (es. `profile-page.js`):

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

  // Close on overlay click
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
setupMobileMenu();
```

---

## Fix 2: Unificare Ricerca Mobile e Desktop

### Problema
La ricerca mobile usa `mobile-search.js` che ha logica diversa da quella desktop.

### Soluzione
Usare la stessa funzione `performSearch` della homepage in entrambi i casi.

### File da Modificare
`mobile-search.js`

### Codice da Sostituire

**TROVA** la funzione `performSearch` in `mobile-search.js`

**SOSTITUISCI CON** la funzione dalla homepage (homepage-script.js linee ~230-350):

```javascript
async performSearch(query) {
  const resultsContainer = document.getElementById('mobileSearchResults');
  if (!resultsContainer) return;
  
  // Show loading
  resultsContainer.innerHTML = '<div class="mobile-search-loading">Ricerca in corso...</div>';
  
  try {
    const supabase = await window.supabaseClientManager.getClient();
    
    // Search in institutes
    const { data: institutes } = await supabase
      .from('school_institutes')
      .select('id, institute_name, institute_type, city')
      .ilike('institute_name', `%${query}%`)
      .limit(5);
    
    // Search in private users
    const { data: privateUsers } = await supabase
      .from('private_users')
      .select('id, first_name, last_name')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .limit(3);
    
    // Search in posts
    const { data: posts } = await supabase
      .from('institute_posts')
      .select('id, title, post_type, tags')
      .or(`title.ilike.%${query}%,tags.cs.{${query}}`)
      .eq('published', true)
      .limit(5);
    
    // Combine results
    const profiles = [];
    if (institutes) {
      profiles.push(...institutes.map(inst => ({
        ...inst,
        user_type: 'istituto'
      })));
    }
    if (privateUsers) {
      profiles.push(...privateUsers.map(user => ({
        ...user,
        user_type: 'privato'
      })));
    }
    
    // Render results
    let html = '';
    
    if (profiles && profiles.length > 0) {
      html += '<div class="mobile-search-section"><h4>Profili</h4>';
      profiles.forEach(profile => {
        let displayName = '';
        let subtitle = '';
        let icon = 'fa-user';
        
        if (profile.user_type === 'istituto') {
          displayName = profile.institute_name || 'Istituto';
          subtitle = `${profile.institute_type || 'Istituto'} - ${profile.city || ''}`;
          icon = 'fa-school';
        } else {
          displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Utente';
          subtitle = 'Utente Privato';
          icon = 'fa-user';
        }
        
        html += `
          <a href="profile.html?id=${profile.id}" class="mobile-search-result">
            <i class="fas ${icon}"></i>
            <div class="result-content">
              <h4>${displayName}</h4>
              <p>${subtitle}</p>
            </div>
          </a>
        `;
      });
      html += '</div>';
    }
    
    if (posts && posts.length > 0) {
      html += '<div class="mobile-search-section"><h4>Contenuti</h4>';
      posts.forEach(post => {
        html += `
          <a href="homepage.html?post=${post.id}" class="mobile-search-result">
            <i class="fas fa-file-alt"></i>
            <div class="result-content">
              <h4>${post.title}</h4>
              <p>${post.post_type || 'Post'}</p>
            </div>
          </a>
        `;
      });
      html += '</div>';
    }
    
    if (!html) {
      html = `
        <div class="mobile-search-empty">
          <i class="fas fa-search"></i>
          <p>Nessun risultato trovato</p>
          <small>Prova con un altro termine</small>
        </div>
      `;
    }
    
    resultsContainer.innerHTML = html;
    
  } catch (error) {
    console.error('Search error:', error);
    resultsContainer.innerHTML = '<div class="mobile-search-error">Errore durante la ricerca</div>';
  }
}
```

---

## Checklist Implementazione

### Menu Hamburger
- [ ] Aggiunto HTML in profile.html
- [ ] Aggiunto HTML in edit-profile.html
- [ ] Aggiunto JavaScript setup
- [ ] Testato apertura/chiusura
- [ ] Testato logout

### Ricerca Unificata
- [ ] Sostituita funzione in mobile-search.js
- [ ] Testata ricerca profili
- [ ] Testata ricerca post
- [ ] Testata ricerca tag
- [ ] Verificato stesso comportamento desktop/mobile

---

## Test Finali

### Mobile Menu
1. Apri profile.html su mobile
2. Clicca hamburger (☰) in alto a destra
3. Verifica menu si apre
4. Verifica navigazione funziona
5. Verifica logout funziona

### Ricerca
1. Apri ricerca mobile
2. Cerca un istituto → Deve apparire
3. Cerca un tag → Deve trovare post
4. Cerca un post → Deve apparire
5. Confronta con ricerca desktop → Stesso risultato

---

## Note Importanti

- Gli stili CSS sono già presenti in `homepage-styles.css`
- Avatar manager gestisce automaticamente le foto profilo nel menu
- La ricerca usa le stesse query Supabase di desktop
- Il menu hamburger è visibile solo su mobile (<768px)

