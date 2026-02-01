# 👤 Profile Pages - Guida Completa

## ✅ Implementazione Completata e Corretta

Sono state create **tre pagine dedicate** per la gestione del profilo utente su EduNet:

**🔧 AGGIORNAMENTO:** Tutti gli errori iniziali sono stati risolti! Le pagine ora includono `config.js`, navbar globale completa, e tutti i CSS/JS necessari.

1. **`profile.html`** - Visualizzazione Profilo
2. **`edit-profile.html`** - Modifica Profilo
3. **`settings.html`** - Impostazioni Account

---

## 📄 **1. PROFILE.HTML - Visualizzazione Profilo**

### **Caratteristiche:**

#### **Header Profilo:**
- 🖼️ **Immagine di copertina** personalizzabile
- 👤 **Avatar profilo** circolare con bordo bianco
- 📝 **Nome istituto** (H1 principale)
- 🏫 **Tipo istituto** (Liceo, Università, ecc.)
- 💬 **Bio descrittiva** (max 500 caratteri)
- 📍 **Posizione, data iscrizione, sito web**
- 🔘 **Pulsanti azioni** (Modifica Profilo, Impostazioni)

#### **Statistiche Profilo:**
- 📊 **4 card statistiche** con icone:
  - Post pubblicati
  - Progetti condivisi
  - Follower
  - Seguiti

#### **Tab Contenuti:**
- **Post** - Tutti i post pubblicati
- **Progetti** - Solo i progetti didattici
- **Info** - Informazioni dettagliate:
  - Tipo istituto, email, telefono, indirizzo
  - Metodologie educative (tag)
  - Aree di interesse (tag)

### **SEO Ottimizzato:**
- **Primary Keyword:** "profilo educativo", "social network scuola"
- **Title:** "Il Mio Profilo - EduNet Social Network Educativo"
- **Meta Description:** Descrittiva e persuasiva con keyword
- **Open Graph:** Ottimizzato per condivisione social

### **Responsive:**
- ✅ Desktop: layout a colonne con sidebar
- ✅ Tablet: layout adattato
- ✅ Mobile: stack verticale, avatar centrato

---

## ✏️ **2. EDIT-PROFILE.HTML - Modifica Profilo**

### **Sezioni Form:**

#### **1. Immagini Profilo:**
- 🖼️ **Copertina:** Upload con preview (200px height)
- 👤 **Avatar:** Upload con preview (circolare)
- 🗑️ **Rimuovi immagine:** Pulsante per ogni immagine

#### **2. Informazioni di Base:**
- 📝 **Nome Istituto** (obbligatorio, max 100 caratteri)
- 🏫 **Tipo Istituto** (select con 8 opzioni)
- 💬 **Descrizione** (textarea, max 500 caratteri con contatore)

#### **3. Informazioni di Contatto:**
- ✉️ **Email istituzionale** (obbligatorio, validazione)
- ☎️ **Telefono**
- 🌐 **Sito web** (validazione URL)
- 📍 **Indirizzo, Città, Provincia**

#### **4. Informazioni Educative:**
- 🎓 **Metodologie Educative** (tags input)
- 📚 **Aree di Interesse** (tags input)
- 🎯 **Indirizzi/Specializzazioni** (textarea)

#### **5. Social Media:**
- 👥 Facebook, Twitter, Instagram, LinkedIn
- Validazione URL per ogni campo

### **Funzionalità Tags Input:**
- ➕ **Aggiungi tag:** Scrivi e premi Invio
- ❌ **Rimuovi tag:** Click sulla X
- 🎨 **Visualizzazione:** Pillole colorate con icona rimuovi

### **Upload Immagini:**
- 📁 **Formati accettati:** JPG, PNG, GIF, WebP
- 📏 **Dimensione max:** 5MB per immagine
- 👁️ **Preview istantanea:** Visualizzazione immediata
- ✅ **Validazione client-side**

### **Salvataggio:**
- 💾 **Pulsante primario:** "Salva Modifiche"
- 🔄 **Loading state:** Spinner durante salvataggio
- ✅ **Conferma:** Alert di successo
- 🔀 **Redirect:** Torna a `profile.html`

---

## ⚙️ **3. SETTINGS.HTML - Impostazioni Account**

### **Layout:**
- 📱 **Sidebar navigazione** (280px, sticky)
- 📄 **Contenuto principale** (grid responsive)
- 📱 **Mobile:** Sidebar diventa bottom tabs

### **Sezioni:**

#### **1. Account:**
- ✉️ **Email Account** (visualizza + modifica)
- 🔑 **Password** (cambio con reset email)
- 🌍 **Lingua Interfaccia** (IT, EN, ES, FR, DE)
- ⚠️ **Zona Pericolosa:**
  - Disattiva account (temporaneo)
  - Elimina account (permanente)

#### **2. Privacy e Visibilità:**
- 🔓 **Profilo Pubblico** (toggle)
- 📧 **Mostra Email** (toggle)
- 🔍 **Ricerca per Email** (toggle)
- 👁️ **Visibilità Post** (select: Tutti, Follower, Rete, Solo io)
- 💬 **Chi può commentare** (select: Tutti, Follower, Nessuno)

#### **3. Notifiche:**
- **Email:**
  - Nuovi Post (toggle)
  - Nuovi Follower (toggle)
  - Commenti (toggle)
  - Match EduNet (toggle)
- **Push:**
  - Attiva notifiche push (toggle)
  - Suoni notifiche (toggle)

#### **4. Sicurezza:**
- 🔐 **Autenticazione a Due Fattori (2FA)** (toggle)
- 📱 **Sessioni Attive** (gestione dispositivi)
- 🔗 **Login tramite Social** (Google/Facebook)

#### **5. Preferenze Visualizzazione:**
- 🎨 **Tema:** Chiaro, Scuro, Automatico
- 📏 **Dimensione Testo:** Piccolo, Medio, Grande
- ▶️ **Autoplay Video** (toggle)
- 📊 **Modalità Riduzione Dati** (toggle)

#### **6. Dati e Backup:**
- 💾 **Scarica i Tuoi Dati** (export completo)
- 🧹 **Cancella Cache**
- 📊 **Spazio Utilizzato** (barra progresso + stats)

### **Toggle Switch:**
- ✅ Design moderno iOS-style
- 🟢 Verde quando attivo
- ⚪ Grigio quando inattivo
- 🎯 Focus state per accessibilità

### **Persistenza Impostazioni:**
- 💾 **LocalStorage:** Salvataggio automatico
- 🔄 **Sincronizzazione:** Load al caricamento pagina
- ⚡ **Applicazione immediata:** Tema, lingua, ecc.

---

## 🎨 **CSS - Stili Condivisi**

### **`profile-page.css`** (condiviso per profile.html e edit-profile.html)

**Componenti principali:**
```css
.profile-header        // Header con copertina e avatar
.profile-avatar        // Avatar circolare 150x150px
.profile-stats         // Grid di 4 card statistiche
.profile-tabs          // Tabs per contenuti
.edit-form             // Form modifica profilo
.tags-input-container  // Input per tags
.image-upload-group    // Upload immagini
```

**Responsive breakpoints:**
- Desktop: > 1024px
- Tablet: 768px - 1024px
- Mobile: < 768px

### **`settings-page.css`**

**Componenti principali:**
```css
.settings-container    // Grid layout 280px + 1fr
.settings-nav          // Sidebar navigazione
.settings-section      // Sezioni contenuto
.toggle-switch         // Toggle iOS-style
.danger-zone           // Zona pericolosa (rosso)
```

---

## 🔧 **JavaScript - Funzionalità**

### **`profile-page.js`**

**Classe: `ProfilePage`**

**Metodi chiave:**
```javascript
loadUserProfile()      // Carica dati profilo da Supabase
updateProfileUI()      // Aggiorna interfaccia
loadProfileStats()     // Carica statistiche (post, progetti, follower)
switchTab()            // Cambia tab contenuti
loadPosts()            // Carica post dell'utente
loadProjects()         // Carica progetti dell'utente
```

**Flusso:**
1. Init Supabase client
2. Load user profile da `school_institutes`
3. Load stats (post count, projects count)
4. Render UI
5. Setup event listeners per tabs

### **`edit-profile.js`**

**Classe: `EditProfilePage`**

**Metodi chiave:**
```javascript
loadProfileData()      // Carica dati esistenti
populateForm()         // Riempie form con dati
handleImageUpload()    // Gestisce upload immagini
addTag()               // Aggiunge tag a metodologie/interessi
removeTag()            // Rimuove tag
handleSubmit()         // Salva modifiche su Supabase
```

**Validazioni:**
- Email: formato valido
- URL: formato valido per website e social
- Immagini: tipo (image/*) e dimensione (max 5MB)
- Caratteri: contatore live per bio (500 max)

### **`settings-page.js`**

**Classe: `SettingsPage`**

**Metodi chiave:**
```javascript
loadSettings()         // Carica impostazioni da localStorage
applySettings()        // Applica impostazioni caricate
switchSection()        // Cambia sezione impostazioni
handleToggleChange()   // Gestisce cambio toggle
handleSelectChange()   // Gestisce cambio select
saveSettings()         // Salva su localStorage
applyTheme()           // Applica tema immediato
```

**Funzionalità speciali:**
- 🔐 **Change Password:** Reset via email Supabase
- 💾 **Download Data:** Richiesta export dati
- 🧹 **Clear Cache:** Pulizia localStorage (eccetto auth)
- ⚠️ **Deactivate/Delete Account:** Conferme multiple

---

## 🔗 **Collegamenti Navbar**

### **Desktop Menu (homepage.html):**
```html
<!-- Aggiornato da "#" a pagine reali -->
<a href="profile.html">Visualizza Profilo</a>
<a href="edit-profile.html">Modifica Profilo</a>
<a href="settings.html">Impostazioni</a>
```

### **Mobile Menu:**
```html
<a href="profile.html" id="mobile-profile">Il Mio Profilo</a>
<a href="settings.html" id="mobile-settings">Impostazioni</a>
```

### **Mobile Bottom Nav:**
```html
<a href="profile.html" data-section="profile">Profilo</a>
```

---

## 📊 **Integrazione Supabase**

### **Tabelle utilizzate:**

#### **`school_institutes`:**
```javascript
// Campi letti/scritti
{
  id,                  // UUID utente
  name,                // Nome istituto
  institute_type,      // Tipo
  bio,                 // Descrizione
  email, phone,        // Contatti
  website,             // Sito web
  address, city, province, // Indirizzo
  methodologies,       // Array di stringhe
  interests,           // Array di stringhe
  specializations,     // Testo
  facebook, twitter, instagram, linkedin, // Social
  created_at, updated_at
}
```

#### **`institute_posts`:**
```javascript
// Query per stats e contenuti
.select('*', { count: 'exact' })
.eq('institute_id', userId)
.eq('published', true)
```

---

## 🎯 **Funzionalità Implementate:**

### ✅ **Profile Page:**
- [x] Header profilo completo
- [x] Statistiche dinamiche
- [x] Tabs per contenuti
- [x] Caricamento dati da Supabase
- [x] Empty states per contenuti vuoti
- [x] Responsive design
- [x] SEO ottimizzato

### ✅ **Edit Profile Page:**
- [x] Form completo con validazione
- [x] Upload immagini (cover + avatar)
- [x] Tags input interattivo
- [x] Salvataggio su Supabase
- [x] Feedback visivi (loading, conferme)
- [x] Responsive design
- [x] SEO ottimizzato

### ✅ **Settings Page:**
- [x] 6 sezioni impostazioni
- [x] Toggle switches funzionanti
- [x] Select dinamici
- [x] Persistenza localStorage
- [x] Tema dinamico (chiaro/scuro/auto)
- [x] Azioni account (password, dati, cache)
- [x] Responsive con mobile tabs
- [x] SEO ottimizzato

### ✅ **Navigazione:**
- [x] Link desktop menu
- [x] Link mobile menu
- [x] Link bottom navigation
- [x] Logout funzionante
- [x] User menu toggle

---

## 🚀 **Come Testare:**

### **1. Profile Page:**
```
1. Vai su homepage.html
2. Click menu utente (avatar in alto a destra)
3. Click "Visualizza Profilo"
4. Verifica: Header, stats, tabs funzionanti
5. Test: Switch tra tab Post/Progetti/Info
```

### **2. Edit Profile Page:**
```
1. Da profile.html, click "Modifica Profilo"
2. Oppure: menu utente → "Modifica Profilo"
3. Compila campi (nome, email, ecc.)
4. Aggiungi tags (metodologie, interessi)
5. Upload immagini (cover/avatar)
6. Click "Salva Modifiche"
7. Verifica redirect a profile.html
```

### **3. Settings Page:**
```
1. Menu utente → "Impostazioni"
2. Naviga tra sezioni (sidebar)
3. Test toggle switches (attiva/disattiva)
4. Test select (tema, lingua, ecc.)
5. Verifica: cambio tema istantaneo
6. Mobile: test bottom tabs
```

---

## 📱 **Responsive Design:**

### **Desktop (> 1024px):**
- Sidebar fissa 280px
- Grid layout ottimizzato
- Dropdown menu
- Hover states

### **Tablet (768px - 1024px):**
- Sidebar ridotta
- Grid adattato
- Touch-friendly

### **Mobile (< 768px):**
- Stack verticale
- Bottom navigation
- Mobile menu overlay
- Touch areas >= 44px

---

## 🎨 **Temi e Personalizzazione:**

### **Tema Chiaro (default):**
```css
--color-bg: #f5f5f5
--color-white: #ffffff
--color-text: #1a1a1a
```

### **Tema Scuro (implementabile):**
```css
.dark-theme {
  --color-bg: #1a1a1a
  --color-white: #2a2a2a
  --color-text: #ffffff
}
```

### **Tema Automatico:**
Segue preferenze sistema operativo

---

## ✅ **Conclusione:**

Tutte e tre le pagine sono:
- ✅ **Funzionanti** - Logica completa
- ✅ **Responsive** - Desktop, tablet, mobile
- ✅ **SEO Ottimizzate** - Keyword, meta tag, structured data
- ✅ **Accessibili** - ARIA labels, keyboard navigation
- ✅ **Integrate** - Collegamenti navbar funzionanti
- ✅ **Database Ready** - Query Supabase implementate
- ✅ **User-Friendly** - UX moderna e intuitiva

**Le pagine sono pronte per essere utilizzate!** 🎉
