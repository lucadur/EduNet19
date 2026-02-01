# 🔍 ANALISI APPROFONDITA: Sistema Impostazioni e Privacy - EduNet19

## 📋 Indice
1. [Stato Attuale del Sistema](#stato-attuale)
2. [Problemi Identificati](#problemi-identificati)
3. [Impostazioni da Implementare](#impostazioni-da-implementare)
4. [Piano di Implementazione](#piano-implementazione)
5. [Integrazioni Necessarie](#integrazioni-necessarie)
6. [Schema Database](#schema-database)
7. [Modifiche ai File Esistenti](#modifiche-file)

---

## 🎯 STATO ATTUALE DEL SISTEMA {#stato-attuale}

### ✅ File Analizzati
- **settings.html** - Interfaccia utente completa
- **settings-page.js** - Logica JavaScript (solo localStorage)
- **settings-page.css** - Stili completi
- **database-schema.sql** - Schema database principale
- **homepage-script.js** - Ricerca e feed post
- **mobile-search.js** - Ricerca mobile
- **social-features.js** - Like e commenti
- **profile-management.js** - Gestione profili
- **modern-filters.js** - Filtri post

### ⚠️ PROBLEMI IDENTIFICATI {#problemi-identificati}

#### 1. **IMPOSTAZIONI PRIVACY - NON FUNZIONANTI**
```javascript
// settings-page.js (PROBLEMA)
saveSettings() {
  localStorage.setItem('edunet_settings', JSON.stringify(this.settings));
  // ❌ Salva SOLO in localStorage
  // ❌ NON salva nel database
  // ❌ NON applica filtri reali
}
```

**Impatto:**
- ✅ L'interfaccia UI funziona (toggle, select)
- ❌ Le impostazioni NON sono persistenti nel database
- ❌ Nascondere profilo NON funziona
- ❌ Visibilità post NON è controllata
- ❌ Chi può commentare NON è verificato

#### 2. **RICERCA - NESSUN FILTRO PRIVACY**

**homepage-script.js (linee 1690-1805)**
```javascript
async performSearch(query) {
  // Cerca nei post
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, content, post_type, author_id')
    .or(`title.ilike.%${query}%, content.ilike.%${query}%`)
    .eq('is_published', true)
    .limit(10);
  // ❌ NON controlla se l'autore ha nascosto il profilo
  // ❌ NON controlla la visibilità dei post
}
```

**mobile-search.js (linee 125-234)**
```javascript
async function performMobileSearch(query) {
  // Cerca istituti
  const { data: institutes } = await supabase
    .from('school_institutes')
    .select('id, institute_name, city')
    .ilike('institute_name', `%${query}%`)
    .limit(5);
  // ❌ Mostra TUTTI gli istituti
  // ❌ NON controlla se il profilo è pubblico
}
```

**profile-management.js (linee 361-422)**
```javascript
async searchProfiles(query, type = null) {
  const { data: institutes } = await this.supabase
    .from('school_institutes')
    .select('id, institute_name, city, province')
    .ilike('institute_name', `%${query}%`)
    .limit(10);
  // ❌ Mostra tutti i profili
  // ❌ Ignora impostazioni privacy
}
```

#### 3. **DATABASE - TABELLA PRIVACY MANCANTE**

```sql
-- database-schema.sql (MANCA)
-- ❌ NON esiste la tabella user_privacy_settings
-- ❌ NON ci sono colonne per privacy in user_profiles
-- ❌ NON ci sono colonne per visibilità in posts
```

**Impatto:**
- Nessuna persistenza delle impostazioni privacy
- Impossibile filtrare in base alle preferenze utente
- Le RLS policies non possono applicare privacy

#### 4. **RLS POLICIES - NON CONSIDERANO PRIVACY**

```sql
-- Policies attuali (PROBLEMA)
CREATE POLICY "Anyone can view verified institutes" 
  ON public.school_institutes
  FOR SELECT USING (verified = true OR auth.uid() = id);
-- ❌ Mostra TUTTI gli istituti verificati
-- ❌ NON controlla se il profilo è pubblico

CREATE POLICY "Anyone can view published posts" 
  ON public.institute_posts
  FOR SELECT USING (published = true OR auth.uid() = institute_id);
-- ❌ Mostra TUTTI i post pubblicati
-- ❌ NON controlla la visibilità impostata dall'autore

CREATE POLICY "Anyone can view approved comments" 
  ON public.post_comments
  FOR SELECT USING (approved = true OR auth.uid() = user_id);
-- ❌ Mostra TUTTI i commenti approvati
-- ❌ NON controlla se l'autore ha disabilitato i commenti pubblici
```

---

## 🎯 IMPOSTAZIONI DA IMPLEMENTARE {#impostazioni-da-implementare}

### 1. **PRIVACY E VISIBILITÀ** (CRITICHE)

#### A. Profilo Pubblico
```html
<input type="checkbox" id="public-profile" checked>
```

**Implementazione Richiesta:**
```javascript
// Quando disattivato:
✅ Il profilo NON appare nella ricerca
✅ Il profilo NON è accessibile da URL diretto (redirect 404)
✅ I post dell'utente NON appaiono nel feed pubblico
✅ L'utente non appare nelle liste "utenti suggeriti"
```

**File da Modificare:**
- `profile-management.js` - searchProfiles()
- `homepage-script.js` - performSearch()
- `mobile-search.js` - performMobileSearch()
- `profile-page.js` - loadProfile()

#### B. Mostra Email
```html
<input type="checkbox" id="show-email">
```

**Implementazione:**
```javascript
✅ Se disattivato: email NON visibile sul profilo pubblico
✅ Se attivato: email visibile nella pagina profilo
```

**File da Modificare:**
- `profile-page.js` - renderProfileInfo()

#### C. Ricerca per Email
```html
<input type="checkbox" id="searchable-email" checked>
```

**Implementazione:**
```javascript
✅ Se disattivato: impossibile cercare l'utente tramite email
✅ Se attivato: ricerca email funziona
```

**File da Modificare:**
- `profile-management.js` - searchProfiles()

#### D. Chi può vedere i tuoi post
```html
<select id="posts-visibility">
  <option value="public">Tutti</option>
  <option value="followers">Solo Follower</option>
  <option value="network">Solo Rete Educativa</option>
  <option value="private">Solo io</option>
</select>
```

**Implementazione:**
```javascript
// public: Tutti possono vedere
// followers: Solo chi segue l'utente
// network: Solo utenti registrati EduNet
// private: Solo l'autore
```

**Filtri da Applicare:**
- Feed homepage
- Ricerca post
- Profilo pubblico
- Feed "Esplora"

**File da Modificare:**
- `homepage-script.js` - loadFeed(), performSearch()
- `profile-page.js` - loadUserPosts()
- `modern-filters.js` - loadFilteredPosts()

#### E. Chi può commentare
```html
<select id="comments-permission">
  <option value="everyone">Tutti</option>
  <option value="followers">Solo Follower</option>
  <option value="none">Nessuno</option>
</select>
```

**Implementazione:**
```javascript
✅ everyone: Tutti possono commentare
✅ followers: Solo follower possono commentare
✅ none: Nessuno può commentare (form disabilitato)
```

**File da Modificare:**
- `social-features.js` - submitComment()
- `homepage-script.js` - createPostElement() (disabilita form se none)

---

### 2. **NOTIFICHE** (FUNZIONALI)

#### Email Notifiche
```javascript
✅ email-new-posts: Notifiche per nuovi post
✅ email-followers: Notifiche nuovi follower
✅ email-comments: Notifiche commenti
✅ email-matches: Notifiche match EduNet
```

**Implementazione:**
- Salvare preferenze in database
- Backend deve controllare preferenze prima di inviare email
- Webhook per notifiche real-time

#### Push Notifiche
```javascript
✅ push-enabled: Abilita notifiche browser
✅ notification-sounds: Suoni notifiche
```

**Implementazione:**
- Service Worker per push notifications
- Web Notifications API
- Controllare permessi browser

**File da Creare:**
- `notifications-manager.js`
- `service-worker.js`

---

### 3. **SICUREZZA** (PARZIALMENTE IMPLEMENTATE)

#### A. Cambio Email
```javascript
// Attualmente usa prompt() - DA MIGLIORARE
changeEmail() {
  const newEmail = prompt('Inserisci il nuovo indirizzo email:');
  // ⚠️ Implementazione base
}
```

**Implementazione Richiesta:**
```javascript
✅ Modal professionale per cambio email
✅ Verifica password corrente
✅ Invio email di conferma al nuovo indirizzo
✅ Link di conferma con token
✅ Aggiornamento database dopo conferma
```

#### B. Cambio Password
```javascript
// Implementazione parziale
changePassword() {
  this.supabase.auth.resetPasswordForEmail(email);
  // ✅ Funziona ma limitato
}
```

**Miglioramenti:**
```javascript
✅ Modal con form strutturato
✅ Verifica password corrente
✅ Validazione nuova password (forza)
✅ Conferma nuova password
✅ Cambio diretto senza email se password corrente è nota
```

#### C. 2FA (NON IMPLEMENTATO)
```html
<input type="checkbox" id="two-factor-auth">
```

**Implementazione Completa:**
```javascript
✅ Generazione QR code per authenticator app
✅ Verifica codice 2FA al login
✅ Backup codes di emergenza
✅ SMS fallback (opzionale)
```

**File da Creare:**
- `two-factor-auth.js`
- Modal 2FA setup

#### D. Gestione Sessioni
```javascript
manageSessions() {
  alert('Funzionalità completa in arrivo.');
  // ❌ NON implementato
}
```

**Implementazione:**
```javascript
✅ Lista dispositivi/browser con sessioni attive
✅ Data ultimo accesso per sessione
✅ Posizione geografica (IP)
✅ Pulsante "Termina sessione" per ogni dispositivo
✅ "Termina tutte le altre sessioni"
```

**Query Database:**
```sql
-- Serve tabella user_sessions
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID,
  device_info TEXT,
  ip_address TEXT,
  location TEXT,
  last_active TIMESTAMP,
  created_at TIMESTAMP
);
```

---

### 4. **PREFERENZE** (PARZIALMENTE FUNZIONANTI)

#### A. Tema Interfaccia
```javascript
✅ Implementato: light, dark, auto
✅ Funziona con localStorage
⚠️ Non persistito in database
```

**Miglioramenti:**
- Sincronizzare con database per multi-device
- Animazione smooth transition tra temi

#### B. Dimensione Testo
```javascript
⚠️ Implementato ma NON applicato
```

**Implementazione:**
```javascript
// Applicare CSS variables
applyFontSize(size) {
  const root = document.documentElement;
  switch(size) {
    case 'small':
      root.style.setProperty('--font-size-base', '14px');
      break;
    case 'medium':
      root.style.setProperty('--font-size-base', '16px');
      break;
    case 'large':
      root.style.setProperty('--font-size-base', '18px');
      break;
  }
}
```

#### C. Autoplay Video & Data Saver
```javascript
✅ autoplay-videos: Implementato localStorage
✅ data-saver: Implementato localStorage

⚠️ NON applicato durante caricamento media
```

**Implementazione:**
- Controllare settings prima di caricare video
- Se data-saver: caricare immagini compresse
- Se no-autoplay: video con controls senza autoplay

---

### 5. **DATI E BACKUP** (DA IMPLEMENTARE)

#### A. Scarica Dati (GDPR Compliance)
```javascript
downloadData() {
  alert('Riceverai email entro 48 ore');
  // ❌ NON implementato
}
```

**Implementazione Completa:**
```javascript
✅ Crea job asincrono per export dati
✅ Genera ZIP con:
   - Profilo (JSON)
   - Post pubblicati (JSON + immagini)
   - Commenti (JSON)
   - Like/Save (JSON)
   - Follower/Following (JSON)
✅ Invia email con link temporaneo (24h)
✅ Storage sicuro file export
```

**File da Creare:**
- `data-export-manager.js`
- Backend API per export
- Cron job per pulizia export vecchi

#### B. Cancella Cache
```javascript
✅ Implementato - funziona
⚠️ Potrebbe cancellare dati importanti
```

**Miglioramenti:**
```javascript
// Specificare cosa cancellare
✅ Cache immagini
✅ Dati temporanei
✅ Cronologia ricerche
⚠️ Preservare: settings, auth token
```

#### C. Disattiva Account
```javascript
deactivateAccount() {
  alert('Funzionalità in fase di sviluppo');
  // ❌ NON implementato
}
```

**Implementazione:**
```javascript
✅ Conferma con password
✅ Aggiorna database: account_status = 'deactivated'
✅ Nasconde tutti i contenuti
✅ Disabilita login
✅ Messaggio "Account disattivato, contatta supporto per riattivare"
✅ Possibilità riattivazione entro 30 giorni
```

#### D. Elimina Account
```javascript
deleteAccount() {
  alert('Funzionalità in fase di sviluppo');
  // ❌ NON implementato
}
```

**Implementazione GDPR-Compliant:**
```javascript
✅ Conferma password
✅ Conferma con email (link sicuro)
✅ Grace period 14 giorni (cancellazione reversibile)
✅ Dopo 14 giorni:
   - Elimina dati personali
   - Anonimizza post (autore: "Utente eliminato")
   - Elimina avatar/media
   - Elimina account auth
✅ Log eliminazione per compliance
```

---

## 📊 SCHEMA DATABASE COMPLETO {#schema-database}

### Nuova Tabella: `user_privacy_settings`

```sql
-- ===================================================================
-- TABELLA PRIVACY SETTINGS
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- PRIVACY
    profile_visibility VARCHAR(20) DEFAULT 'public' 
        CHECK (profile_visibility IN ('public', 'private')),
    show_email BOOLEAN DEFAULT FALSE,
    searchable_by_email BOOLEAN DEFAULT TRUE,
    
    posts_visibility VARCHAR(20) DEFAULT 'public' 
        CHECK (posts_visibility IN ('public', 'followers', 'network', 'private')),
    comments_permission VARCHAR(20) DEFAULT 'everyone' 
        CHECK (comments_permission IN ('everyone', 'followers', 'none')),
    
    -- NOTIFICHE EMAIL
    email_new_posts BOOLEAN DEFAULT TRUE,
    email_new_followers BOOLEAN DEFAULT TRUE,
    email_comments BOOLEAN DEFAULT TRUE,
    email_matches BOOLEAN DEFAULT TRUE,
    
    -- NOTIFICHE PUSH
    push_enabled BOOLEAN DEFAULT FALSE,
    notification_sounds BOOLEAN DEFAULT TRUE,
    
    -- SICUREZZA
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    social_login_enabled BOOLEAN DEFAULT FALSE,
    
    -- PREFERENZE
    theme VARCHAR(20) DEFAULT 'light' 
        CHECK (theme IN ('light', 'dark', 'auto')),
    font_size VARCHAR(20) DEFAULT 'medium' 
        CHECK (font_size IN ('small', 'medium', 'large')),
    autoplay_videos BOOLEAN DEFAULT TRUE,
    data_saver_mode BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'it',
    
    -- TIMESTAMPS
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice per performance
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user 
    ON public.user_privacy_settings(user_id);

-- RLS
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own settings" 
    ON public.user_privacy_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
    ON public.user_privacy_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" 
    ON public.user_privacy_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger per updated_at
CREATE TRIGGER update_privacy_settings_updated_at 
    BEFORE UPDATE ON public.user_privacy_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Funzione helper per ottenere impostazioni utente
CREATE OR REPLACE FUNCTION get_user_privacy_settings(target_user_id UUID)
RETURNS TABLE (
    profile_visibility VARCHAR,
    posts_visibility VARCHAR,
    comments_permission VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ups.profile_visibility,
        ups.posts_visibility,
        ups.comments_permission
    FROM public.user_privacy_settings ups
    WHERE ups.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Aggiornare Tabelle Esistenti

```sql
-- ===================================================================
-- AGGIUNTE ALLE TABELLE ESISTENTI
-- ===================================================================

-- Aggiungi colonna account_status a user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active' 
    CHECK (account_status IN ('active', 'deactivated', 'deleted', 'pending_deletion'));

-- Aggiungi colonna per data eliminazione programmata
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMP WITH TIME ZONE;

-- Tabella per sessioni utente
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_info TEXT,
    browser_info TEXT,
    ip_address INET,
    location TEXT,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id 
    ON public.user_sessions(user_id, last_active DESC);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" 
    ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);
```

---

## 🛠️ MODIFICHE AI FILE ESISTENTI {#modifiche-file}

### 1. **settings-page.js** - REFACTOR COMPLETO

#### Modifiche Principali:
```javascript
class SettingsPage {
  async loadSettings() {
    // ✅ NUOVO: Carica da database invece di localStorage
    const { data, error } = await this.supabase
      .from('user_privacy_settings')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .maybeSingle();
    
    if (data) {
      this.settings = data;
      this.applySettings();
    } else {
      // Prima volta: crea record con defaults
      await this.createDefaultSettings();
    }
  }
  
  async saveSettings() {
    // ✅ NUOVO: Salva nel database
    const { error } = await this.supabase
      .from('user_privacy_settings')
      .upsert({
        user_id: this.currentUser.id,
        ...this.settings,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      this.showNotification('Errore salvataggio impostazioni', 'error');
    } else {
      this.showNotification('Impostazioni salvate', 'success');
      // Aggiorna anche localStorage per uso offline
      localStorage.setItem('edunet_settings_cache', JSON.stringify(this.settings));
    }
  }
}
```

### 2. **homepage-script.js** - Filtri Privacy

```javascript
async performSearch(query) {
  // ✅ NUOVO: Filtra in base a privacy settings
  const supabase = await window.supabaseClientManager.getClient();
  
  // Cerca istituti con profilo pubblico
  const { data: institutes } = await supabase
    .from('school_institutes')
    .select(`
      id, institute_name, city,
      user_profiles!inner(
        user_privacy_settings(profile_visibility)
      )
    `)
    .ilike('institute_name', `%${query}%`)
    .eq('user_profiles.user_privacy_settings.profile_visibility', 'public')
    .limit(5);
  
  // Cerca post con visibilità appropriata
  const currentUserId = (await supabase.auth.getUser()).data.user?.id;
  
  let postsQuery = supabase
    .from('posts')
    .select(`
      *,
      author:user_profiles!inner(
        user_privacy_settings(posts_visibility)
      )
    `)
    .or(`title.ilike.%${query}%, content.ilike.%${query}%`)
    .eq('is_published', true);
  
  // Filtra per visibilità
  if (currentUserId) {
    // Utente loggato: mostra public + network + following
    postsQuery = postsQuery.or(
      `author.user_privacy_settings.posts_visibility.eq.public,` +
      `author.user_privacy_settings.posts_visibility.eq.network,` +
      `author_id.eq.${currentUserId}`
    );
  } else {
    // Utente non loggato: solo public
    postsQuery = postsQuery.eq(
      'author.user_privacy_settings.posts_visibility', 'public'
    );
  }
  
  const { data: posts } = await postsQuery.limit(10);
  
  return [...institutes, ...posts];
}
```

### 3. **mobile-search.js** - Stessa Logica

```javascript
async function performMobileSearch(query) {
  const supabase = await window.supabaseClientManager.getClient();
  
  // ✅ NUOVO: Solo profili pubblici
  const { data: institutes } = await supabase
    .from('school_institutes')
    .select(`
      id, institute_name, city,
      user_profiles!inner(
        user_privacy_settings!inner(profile_visibility)
      )
    `)
    .ilike('institute_name', `%${query}%`)
    .eq('user_profiles.user_privacy_settings.profile_visibility', 'public')
    .limit(5);
  
  // ... stesso filtro per posts
}
```

### 4. **social-features.js** - Controllo Commenti

```javascript
async submitComment(postId, content) {
  // ✅ NUOVO: Verifica permessi commenti
  
  // 1. Ottieni privacy settings dell'autore del post
  const { data: post } = await this.supabase
    .from('posts')
    .select(`
      author_id,
      author:user_profiles!inner(
        user_privacy_settings!inner(comments_permission)
      )
    `)
    .eq('id', postId)
    .single();
  
  if (!post) {
    this.showNotification('Post non trovato', 'error');
    return;
  }
  
  const commentsPermission = post.author.user_privacy_settings.comments_permission;
  
  // 2. Verifica permessi
  if (commentsPermission === 'none') {
    this.showNotification('I commenti sono disabilitati per questo post', 'warning');
    return;
  }
  
  if (commentsPermission === 'followers') {
    // Verifica se segue l'autore
    const { data: isFollowing } = await this.supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', this.currentUser.id)
      .eq('following_institute_id', post.author_id)
      .maybeSingle();
    
    if (!isFollowing) {
      this.showNotification(
        'Solo i follower possono commentare questo post', 
        'warning'
      );
      return;
    }
  }
  
  // 3. Se tutto ok, crea commento
  const { error } = await this.supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: this.currentUser.id,
      content: content
    });
  
  if (!error) {
    this.showNotification('Commento pubblicato', 'success');
    await this.showComments(postId, commentsContainer);
  }
}
```

### 5. **profile-page.js** - Privacy Profilo

```javascript
async loadProfile(userId) {
  const currentUserId = (await this.supabase.auth.getUser()).data.user?.id;
  
  // ✅ NUOVO: Controlla privacy
  const { data: privacySettings } = await this.supabase
    .from('user_privacy_settings')
    .select('profile_visibility, show_email')
    .eq('user_id', userId)
    .maybeSingle();
  
  // Se profilo privato e non è il proprio profilo
  if (privacySettings?.profile_visibility === 'private' && 
      userId !== currentUserId) {
    this.showPrivateProfileMessage();
    return;
  }
  
  // Carica profilo normalmente
  const { data: profile } = await this.supabase
    .from('school_institutes')
    .select('*')
    .eq('id', userId)
    .single();
  
  // ✅ NUOVO: Nascondi email se impostazione dice così
  if (!privacySettings?.show_email) {
    delete profile.pec_email;
  }
  
  this.renderProfile(profile);
}

showPrivateProfileMessage() {
  document.getElementById('profile-content').innerHTML = `
    <div class="private-profile-message">
      <i class="fas fa-lock" style="font-size: 48px; color: var(--color-gray-400);"></i>
      <h2>Profilo Privato</h2>
      <p>Questo profilo non è visibile pubblicamente.</p>
    </div>
  `;
}
```

### 6. **Nuove RLS Policies**

```sql
-- ===================================================================
-- POLICIES AGGIORNATE CON PRIVACY SETTINGS
-- ===================================================================

-- School Institutes: Solo profili pubblici o propri
DROP POLICY IF EXISTS "Anyone can view verified institutes" 
  ON public.school_institutes;

CREATE POLICY "View public profiles or own" 
  ON public.school_institutes
  FOR SELECT
  USING (
    -- Proprio profilo
    auth.uid() = id 
    OR
    -- Profilo pubblico
    EXISTS (
      SELECT 1 FROM public.user_privacy_settings ups
      WHERE ups.user_id = id 
      AND ups.profile_visibility = 'public'
    )
  );

-- Posts: Filtra per visibilità
DROP POLICY IF EXISTS "Anyone can view published posts" 
  ON public.institute_posts;

CREATE POLICY "View posts based on privacy" 
  ON public.institute_posts
  FOR SELECT
  USING (
    -- Proprio post
    auth.uid() = institute_id
    OR
    -- Post pubblico
    (
      published = true
      AND EXISTS (
        SELECT 1 FROM public.user_privacy_settings ups
        WHERE ups.user_id = institute_id 
        AND ups.posts_visibility = 'public'
      )
    )
    OR
    -- Post network (se loggato)
    (
      published = true
      AND auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM public.user_privacy_settings ups
        WHERE ups.user_id = institute_id 
        AND ups.posts_visibility = 'network'
      )
    )
    OR
    -- Post solo follower (se segue)
    (
      published = true
      AND EXISTS (
        SELECT 1 FROM public.user_privacy_settings ups
        WHERE ups.user_id = institute_id 
        AND ups.posts_visibility = 'followers'
      )
      AND EXISTS (
        SELECT 1 FROM public.user_follows uf
        WHERE uf.follower_id = auth.uid()
        AND uf.following_institute_id = institute_id
      )
    )
  );

-- Comments: Controlla permessi autore post
CREATE POLICY "Insert comments with permission check" 
  ON public.post_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- Autore può sempre commentare i propri post
      EXISTS (
        SELECT 1 FROM public.institute_posts p
        WHERE p.id = post_id AND p.institute_id = auth.uid()
      )
      OR
      -- everyone: tutti possono
      EXISTS (
        SELECT 1 FROM public.institute_posts p
        JOIN public.user_privacy_settings ups ON ups.user_id = p.institute_id
        WHERE p.id = post_id 
        AND ups.comments_permission = 'everyone'
      )
      OR
      -- followers: solo chi segue
      EXISTS (
        SELECT 1 FROM public.institute_posts p
        JOIN public.user_privacy_settings ups ON ups.user_id = p.institute_id
        JOIN public.user_follows uf ON uf.following_institute_id = p.institute_id
        WHERE p.id = post_id 
        AND ups.comments_permission = 'followers'
        AND uf.follower_id = auth.uid()
      )
    )
  );
```

---

## 📝 PIANO DI IMPLEMENTAZIONE {#piano-implementazione}

### FASE 1: Database (Priorità MASSIMA) ⚡
1. ✅ Creare tabella `user_privacy_settings`
2. ✅ Aggiungere colonna `account_status` a `user_profiles`
3. ✅ Creare tabella `user_sessions`
4. ✅ Aggiornare tutte le RLS policies
5. ✅ Creare funzioni helper per privacy checks

### FASE 2: Settings Page (Priorità ALTA) 🔥
1. ✅ Refactor `settings-page.js` per usare database
2. ✅ Implementare sync bidirezionale (DB ↔️ localStorage)
3. ✅ Aggiungere loading states
4. ✅ Migliorare UI cambio email/password
5. ✅ Implementare gestione sessioni

### FASE 3: Ricerca e Privacy (Priorità ALTA) 🔥
1. ✅ Aggiornare `homepage-script.js` - performSearch()
2. ✅ Aggiornare `mobile-search.js` - performMobileSearch()
3. ✅ Aggiornare `profile-management.js` - searchProfiles()
4. ✅ Implementare filtri visibilità post
5. ✅ Testare tutti i scenari privacy

### FASE 4: Post e Commenti (Priorità MEDIA) 🟡
1. ✅ Aggiornare `social-features.js` - controllo permessi
2. ✅ Modificare `homepage-script.js` - feed filtering
3. ✅ Aggiornare `modern-filters.js` - rispettare privacy
4. ✅ Disabilitare UI commenti se none

### FASE 5: Profili (Priorità MEDIA) 🟡
1. ✅ Aggiornare `profile-page.js` - privacy checks
2. ✅ Implementare pagina "Profilo Privato"
3. ✅ Nascondere email se impostato
4. ✅ Filtrare post in base a visibilità

### FASE 6: Notifiche (Priorità BASSA) 🟢
1. ⏳ Creare `notifications-manager.js`
2. ⏳ Implementare Web Push Notifications
3. ⏳ Creare preferenze notifiche email backend
4. ⏳ Webhook per notifiche real-time

### FASE 7: Sicurezza Avanzata (Priorità BASSA) 🟢
1. ⏳ Implementare 2FA completo
2. ⏳ Migliorare gestione sessioni
3. ⏳ Audit log per azioni sensibili
4. ⏳ Rate limiting per cambio password

### FASE 8: GDPR e Dati (Priorità MEDIA) 🟡
1. ✅ Implementare export dati
2. ✅ Implementare disattivazione account
3. ✅ Implementare eliminazione account (grace period)
4. ✅ Creare job di pulizia dati eliminati

---

## 🔗 INTEGRAZIONI NECESSARIE {#integrazioni-necessarie}

### Con Sistema di Ricerca
- ✅ `homepage-script.js` → Filtrare per `profile_visibility`
- ✅ `mobile-search.js` → Stessi filtri
- ✅ `profile-management.js` → Rispettare `searchable_by_email`

### Con Feed Post
- ✅ `homepage-script.js` → Filtrare per `posts_visibility`
- ✅ `modern-filters.js` → Applicare privacy ai filtri
- ✅ Verificare relazione follower per visibilità "followers"

### Con Sistema Commenti
- ✅ `social-features.js` → Controllare `comments_permission`
- ✅ Disabilitare form commenti se `none`
- ✅ Mostrare messaggio appropriato

### Con Profili
- ✅ `profile-page.js` → Controllare `profile_visibility`
- ✅ Nascondere email se `show_email = false`
- ✅ Pagina "Profilo Privato" per utenti non autorizzati

### Con Notifiche
- ⏳ Backend email → Controllare `email_*` preferences
- ⏳ Push notifications → Controllare `push_enabled`
- ⏳ Suoni → Controllare `notification_sounds`

---

## ✅ CHECKLIST FINALE

### Database
- [ ] Tabella `user_privacy_settings` creata
- [ ] Policies RLS aggiornate
- [ ] Funzioni helper create
- [ ] Indici per performance
- [ ] Trigger updated_at

### Settings Page
- [ ] Caricamento da database
- [ ] Salvataggio in database
- [ ] Sync con localStorage
- [ ] UI professionale
- [ ] Error handling

### Privacy Filters
- [ ] Ricerca profili filtra per visibility
- [ ] Ricerca post rispetta posts_visibility
- [ ] Feed homepage applica filtri
- [ ] Profili privati non accessibili
- [ ] Email nascosta se impostato

### Commenti
- [ ] Verifica comments_permission
- [ ] Disabilita form se none
- [ ] Solo follower se followers
- [ ] Messaggio appropriato

### Account Management
- [ ] Disattivazione account
- [ ] Eliminazione account (grace period)
- [ ] Export dati GDPR
- [ ] Gestione sessioni

### Testing
- [ ] Test profilo pubblico/privato
- [ ] Test visibilità post (public/followers/network/private)
- [ ] Test permessi commenti
- [ ] Test ricerca con varie privacy
- [ ] Test multi-device sync

---

## 📚 FILE DA CREARE

1. **database-privacy-schema.sql** - Schema privacy settings
2. **privacy-manager.js** - Classe per gestire privacy checks
3. **notifications-manager.js** - Sistema notifiche
4. **data-export-manager.js** - Export dati GDPR
5. **session-manager.js** - Gestione sessioni
6. **PRIVACY-IMPLEMENTATION-GUIDE.md** - Guida implementazione

---

**🎯 PRIORITÀ IMMEDIATA: Database + Settings Page + Ricerca**
**⏱️ TEMPO STIMATO: 4-6 ore sviluppo + 2 ore testing**

---

📅 **Data Analisi:** 1 Ottobre 2025  
🔍 **Analista:** AI Assistant  
📌 **Versione:** 1.0 - Analisi Completa

