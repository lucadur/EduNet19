# 🚀 QUICK START: Implementazione Privacy Settings - EduNet19

## 📋 Guida Rapida di Implementazione

### ⚡ FASE 1: Database (15 minuti)

#### Step 1.1: Esegui Schema SQL
```bash
# Nel SQL Editor di Supabase, esegui:
database-privacy-schema.sql
```

**Verifica:**
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'user_privacy_settings',
    'user_sessions',
    'data_export_requests',
    'audit_log'
);
```

Dovresti vedere 4 tabelle.

---

### 🔥 FASE 2: Settings Page (30 minuti)

#### Step 2.1: Aggiorna `settings-page.js`

**Trova la funzione `loadSettings()` (linea ~200) e sostituisci con:**

```javascript
async loadSettings() {
  try {
    if (!this.supabase || !this.currentUser) {
      console.log('No user logged in, using default settings');
      this.loadDefaultSettings();
      return;
    }

    // ✅ NUOVO: Carica da database
    const { data: settings, error } = await this.supabase
      .from('user_privacy_settings')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading settings:', error);
      this.loadDefaultSettings();
      return;
    }

    if (settings) {
      // Converti da snake_case a camelCase
      this.settings = {
        publicProfile: settings.profile_visibility === 'public',
        showEmail: settings.show_email,
        searchableEmail: settings.searchable_by_email,
        postsVisibility: settings.posts_visibility,
        commentsPermission: settings.comments_permission,
        emailNewPosts: settings.email_new_posts,
        emailFollowers: settings.email_new_followers,
        emailComments: settings.email_comments,
        emailMatches: settings.email_matches,
        pushEnabled: settings.push_enabled,
        notificationSounds: settings.notification_sounds,
        twoFactorAuth: settings.two_factor_enabled,
        socialLogin: settings.social_login_enabled,
        theme: settings.theme,
        fontSize: settings.font_size,
        autoplayVideos: settings.autoplay_videos,
        dataSaver: settings.data_saver_mode,
        language: settings.language
      };
      
      this.applySettings();
      
      // Backup in localStorage per uso offline
      localStorage.setItem('edunet_settings_cache', JSON.stringify(this.settings));
    } else {
      // Prima volta: crea settings con defaults
      await this.createDefaultSettings();
    }

    // Update email display
    const emailDisplay = document.getElementById('current-email');
    if (emailDisplay && this.currentUser.email) {
      emailDisplay.textContent = this.currentUser.email;
    }

    await this.loadUserProfile();

  } catch (error) {
    console.error('Error loading settings:', error);
    this.loadDefaultSettings();
  }
}
```

**Aggiungi nuova funzione `createDefaultSettings()` dopo `loadSettings()`:**

```javascript
async createDefaultSettings() {
  try {
    const defaultSettings = {
      user_id: this.currentUser.id,
      profile_visibility: 'public',
      show_email: false,
      searchable_by_email: true,
      posts_visibility: 'public',
      comments_permission: 'everyone',
      email_new_posts: true,
      email_new_followers: true,
      email_comments: true,
      email_matches: true,
      push_enabled: false,
      notification_sounds: true,
      two_factor_enabled: false,
      social_login_enabled: false,
      theme: 'light',
      font_size: 'medium',
      autoplay_videos: true,
      data_saver_mode: false,
      language: 'it'
    };

    const { error } = await this.supabase
      .from('user_privacy_settings')
      .insert(defaultSettings);

    if (error) {
      console.error('Error creating default settings:', error);
    } else {
      console.log('Default settings created');
      await this.loadSettings(); // Ricarica
    }
  } catch (error) {
    console.error('Error in createDefaultSettings:', error);
  }
}
```

**Trova la funzione `saveSettings()` e sostituisci con:**

```javascript
async saveSettings() {
  try {
    if (!this.supabase || !this.currentUser) {
      // Fallback a localStorage
      localStorage.setItem('edunet_settings', JSON.stringify(this.settings));
      console.log('Settings saved to localStorage');
      return;
    }

    // Converti da camelCase a snake_case per database
    const dbSettings = {
      user_id: this.currentUser.id,
      profile_visibility: this.settings.publicProfile ? 'public' : 'private',
      show_email: this.settings.showEmail,
      searchable_by_email: this.settings.searchableEmail,
      posts_visibility: this.settings.postsVisibility,
      comments_permission: this.settings.commentsPermission,
      email_new_posts: this.settings.emailNewPosts,
      email_new_followers: this.settings.emailFollowers,
      email_comments: this.settings.emailComments,
      email_matches: this.settings.emailMatches,
      push_enabled: this.settings.pushEnabled,
      notification_sounds: this.settings.notificationSounds,
      two_factor_enabled: this.settings.twoFactorAuth,
      social_login_enabled: this.settings.socialLogin,
      theme: this.settings.theme,
      font_size: this.settings.fontSize,
      autoplay_videos: this.settings.autoplayVideos,
      data_saver_mode: this.settings.dataSaver,
      language: this.settings.language,
      updated_at: new Date().toISOString()
    };

    // ✅ NUOVO: Salva nel database con upsert
    const { error } = await this.supabase
      .from('user_privacy_settings')
      .upsert(dbSettings, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving settings to database:', error);
      this.showNotification('Errore salvataggio impostazioni', 'error');
    } else {
      console.log('Settings saved to database');
      
      // Backup in localStorage
      localStorage.setItem('edunet_settings_cache', JSON.stringify(this.settings));
    }

  } catch (error) {
    console.error('Error saving settings:', error);
    this.showNotification('Errore salvataggio impostazioni', 'error');
  }
}
```

---

### 🔍 FASE 3: Ricerca con Privacy (30 minuti)

#### Step 3.1: Aggiorna `homepage-script.js`

**Trova la funzione `performSearch()` (circa linea 1690) e sostituisci la sezione instituti con:**

```javascript
// Search institutes with privacy filter
if (window.supabaseClientManager) {
  try {
    const supabase = await window.supabaseClientManager.getClient();
    
    if (supabase) {
      console.log('Searching institutes with privacy filters...');
      
      // ✅ NUOVO: Solo profili pubblici
      const { data: institutes, error } = await supabase
        .from('school_institutes')
        .select(`
          id, 
          institute_name, 
          city,
          user_privacy_settings!inner(profile_visibility)
        `)
        .ilike('institute_name', `%${query}%`)
        .eq('user_privacy_settings.profile_visibility', 'public')
        .limit(5);
        
      console.log('Institute search results:', institutes, 'Error:', error);
        
      if (!error && institutes && institutes.length > 0) {
        institutes.forEach(institute => {
          results.push({
            type: 'institute',
            id: institute.id,
            title: institute.institute_name,
            subtitle: institute.city || 'Città non specificata',
            icon: 'fa-school',
            url: `profile.html?id=${institute.id}`
          });
        });
      }
    }
  } catch (error) {
    console.warn('Could not search institutes:', error);
  }
}
```

**Sostituisci la sezione post con:**

```javascript
// Search posts with privacy filter
if (window.supabaseClientManager) {
  try {
    console.log('Searching posts with privacy filters...');
    const supabase = await window.supabaseClientManager.getClient();
    
    if (supabase) {
      const currentUserId = (await supabase.auth.getUser()).data.user?.id;
      
      // Build query with privacy
      let postsQuery = supabase
        .from('posts')
        .select(`
          id, 
          title, 
          content, 
          post_type, 
          author_id,
          author:user_privacy_settings!inner(posts_visibility)
        `)
        .or(`title.ilike.%${query}%, content.ilike.%${query}%`)
        .eq('is_published', true);
      
      // ✅ NUOVO: Filtra per visibilità
      if (currentUserId) {
        // Utente loggato: public + network + following + own
        postsQuery = postsQuery.or(
          `author.posts_visibility.eq.public,` +
          `author.posts_visibility.eq.network,` +
          `author_id.eq.${currentUserId}`
        );
      } else {
        // Utente non loggato: solo public
        postsQuery = postsQuery.eq('author.posts_visibility', 'public');
      }
        
      const { data: posts, error } = await postsQuery.limit(10);
        
      console.log('Post search results:', posts, 'Error:', error);
        
      if (!error && posts && posts.length > 0) {
        for (const post of posts) {
          let authorName = 'Autore sconosciuto';
          
          // Fetch author info...
          // (mantieni il codice esistente per fetchare l'autore)
          
          results.push({
            type: 'post',
            id: post.id,
            title: post.title,
            subtitle: `di ${authorName}`,
            icon: 'fa-file-alt',
            url: `homepage.html#post-${post.id}`
          });
        }
      }
    }
  } catch (error) {
    console.warn('Could not search posts:', error);
  }
}
```

#### Step 3.2: Aggiorna `mobile-search.js`

**Trova la funzione `performMobileSearch()` (circa linea 125) e applica le stesse modifiche di homepage-script.js**

---

### 💬 FASE 4: Controllo Commenti (20 minuti)

#### Step 4.1: Aggiorna `social-features.js`

**Trova la funzione `submitComment()` e aggiungi controllo permessi PRIMA dell'insert:**

```javascript
async submitComment(postId, content, commentsContainer) {
  if (!this.currentUser) {
    this.showNotification('Devi essere loggato per commentare', 'warning');
    return;
  }

  if (!content || content.trim().length === 0) {
    this.showNotification('Il commento non può essere vuoto', 'warning');
    return;
  }

  try {
    // ✅ NUOVO: Verifica permessi commenti
    console.log('Checking comment permissions for post:', postId);
    
    // 1. Ottieni autore del post e sue privacy settings
    const { data: post, error: postError } = await this.supabase
      .from('posts')
      .select(`
        author_id,
        author:user_privacy_settings!inner(comments_permission)
      `)
      .eq('id', postId)
      .maybeSingle();
    
    if (postError || !post) {
      console.error('Error fetching post:', postError);
      this.showNotification('Post non trovato', 'error');
      return;
    }
    
    const commentsPermission = post.author?.comments_permission || 'everyone';
    console.log('Comments permission:', commentsPermission);
    
    // 2. Se è l'autore, può sempre commentare
    if (post.author_id === this.currentUser.id) {
      // Procedi con insert
    }
    // 3. Se commenti disabilitati
    else if (commentsPermission === 'none') {
      this.showNotification('I commenti sono disabilitati per questo post', 'warning');
      return;
    }
    // 4. Se solo follower
    else if (commentsPermission === 'followers') {
      // Verifica se segue l'autore
      const { data: isFollowing, error: followError } = await this.supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', this.currentUser.id)
        .eq('following_institute_id', post.author_id)
        .maybeSingle();
      
      if (followError || !isFollowing) {
        this.showNotification(
          'Solo i follower possono commentare questo post', 
          'warning'
        );
        return;
      }
    }
    
    // ✅ PERMESSI OK: Procedi con insert commento
    const { error: insertError } = await this.supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: this.currentUser.id,
        content: content.trim(),
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error inserting comment:', insertError);
      this.showNotification('Errore durante la pubblicazione del commento', 'error');
      return;
    }

    this.showNotification('Commento pubblicato', 'success');
    
    // Reload comments
    await this.showComments(postId, commentsContainer);
    
    // Clear textarea
    const textarea = commentsContainer.querySelector('.comment-input');
    if (textarea) {
      textarea.value = '';
    }

  } catch (error) {
    console.error('Error submitting comment:', error);
    this.showNotification('Errore durante la pubblicazione del commento', 'error');
  }
}
```

---

### ✅ FASE 5: Testing (30 minuti)

#### Test Checklist:

**1. Settings Page**
- [ ] Caricamento settings da database
- [ ] Salvataggio settings in database
- [ ] Toggle profilo pubblico/privato
- [ ] Cambio visibilità post
- [ ] Cambio permessi commenti
- [ ] Sincronizzazione multi-tab

**2. Privacy Profilo**
- [ ] Profilo privato non appare nella ricerca
- [ ] Profilo privato non accessibile da URL diretto
- [ ] Profilo pubblico appare normalmente
- [ ] Email nascosta/visibile secondo impostazioni

**3. Privacy Post**
- [ ] Post "public" visibili a tutti
- [ ] Post "network" visibili solo a loggati
- [ ] Post "followers" visibili solo a follower
- [ ] Post "private" visibili solo all'autore
- [ ] Feed filtra correttamente

**4. Permessi Commenti**
- [ ] "everyone": tutti possono commentare
- [ ] "followers": solo follower possono
- [ ] "none": nessuno può (form disabilitato)
- [ ] Messaggio appropriato quando non autorizzato

**5. Ricerca**
- [ ] Ricerca profili mostra solo pubblici
- [ ] Ricerca post rispetta visibilità
- [ ] Mobile search funziona uguale
- [ ] Utenti non loggati vedono solo public

---

### 🐛 Troubleshooting Comune

#### Errore: "relation user_privacy_settings does not exist"
```sql
-- Esegui di nuovo lo schema:
\i database-privacy-schema.sql
```

#### Errore: "RLS policy prevents access"
```sql
-- Verifica policies:
SELECT * FROM pg_policies WHERE tablename = 'user_privacy_settings';
```

#### Impostazioni non si salvano
```javascript
// Verifica in console browser:
console.log('Current user:', this.currentUser);
console.log('Supabase client:', this.supabase);
```

#### Ricerca mostra profili privati
```javascript
// Verifica query in console:
console.log('Search query:', query);
console.log('Results:', results);
```

---

### 📝 Note Finali

**Priorità Implementazione:**
1. ✅ Database schema (OBBLIGATORIO)
2. ✅ Settings page (CRITICO)
3. ✅ Ricerca privacy (CRITICO)
4. ✅ Commenti permission (IMPORTANTE)
5. ⏳ Profile visibility (IMPORTANTE)
6. ⏳ Notifications (OPZIONALE)
7. ⏳ 2FA (OPZIONALE)

**Tempo Stimato Totale:** 2-3 ore

**Prossimi Passi:**
- Implementare filtri nei feed
- Aggiornare profile-page.js
- Implementare notifiche email
- Testing completo multi-browser

---

📅 **Ultimo Aggiornamento:** 1 Ottobre 2025  
🎯 **Versione:** 1.0 - Quick Start Guide

