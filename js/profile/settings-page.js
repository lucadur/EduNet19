/* ===================================================================
   SETTINGS PAGE SCRIPT - EduNet19_2
   JavaScript for settings.html
   =================================================================== */

class SettingsPage {
  constructor() {
    this.currentUser = null;
    this.supabase = null;
    this.currentSection = 'account';
    this.settings = {};

    this.init();
  }

  async init() {
    console.log('⚙️ SettingsPage initializing...');

    // Wait for Supabase client
    await this.initSupabase();

    // Load current settings
    await this.loadSettings();

    // Load avatar in navbar
    if (window.avatarManager) {
      await window.avatarManager.loadCurrentUserAvatar();
    }

    // Update storage usage
    await this.updateStorageUsage();

    // Register current session
    this.registerCurrentSession();

    // Setup event listeners
    this.setupEventListeners();

    // Check 2FA status
    await this.check2FAStatus();

    console.log('✅ SettingsPage initialized');
  }

  async initSupabase() {
    if (window.supabaseClientManager) {
      this.supabase = await window.supabaseClientManager.getClient();
      const { data: { user } } = await this.supabase.auth.getUser();
      this.currentUser = user;
    }
  }

  setupEventListeners() {
    // Mobile settings menu toggle
    const mobileToggle = document.getElementById('mobileSettingsToggle');
    const mobileMenu = document.getElementById('mobileSettingsMenu');

    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener('click', () => {
        mobileToggle.classList.toggle('open');
        mobileMenu.classList.toggle('open');
      });
    }

    // Section navigation (for both desktop sidebar and mobile grid)
    const navItems = document.querySelectorAll('.settings-nav-item, .settings-grid-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const section = item.dataset.section;
        this.switchSection(section);

        // Close mobile menu after selection
        if (mobileMenu && mobileToggle) {
          mobileMenu.classList.remove('open');
          mobileToggle.classList.remove('open');
        }

        // Update mobile toggle label and icon
        const sectionName = item.querySelector('.settings-label, span')?.textContent;
        const sectionIcon = item.querySelector('.settings-icon i, i')?.className;

        const currentSectionName = document.getElementById('currentSectionName');
        if (currentSectionName && sectionName) {
          currentSectionName.textContent = sectionName;
        }

        const toggleIcon = mobileToggle?.querySelector('i:first-child');
        if (toggleIcon && sectionIcon) {
          toggleIcon.className = sectionIcon;
        }

        // Update active states for both desktop and mobile
        document.querySelectorAll('.settings-nav-item, .settings-grid-item').forEach(navItem => {
          navItem.classList.remove('active');
        });

        // Set active state for all items with the same section
        document.querySelectorAll(`[data-section="${section}"]`).forEach(navItem => {
          navItem.classList.add('active');
        });
      });
    });

    // Toggle switches
    const toggles = document.querySelectorAll('.toggle-switch input');
    toggles.forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        this.handleToggleChange(e.target.id, e.target.checked);
      });
    });

    // Select changes
    const selects = document.querySelectorAll('.setting-select');
    selects.forEach(select => {
      select.addEventListener('change', (e) => {
        this.handleSelectChange(e.target.id, e.target.value);
      });
    });

    // Action buttons
    this.setupActionButtons();

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // User menu toggle - using 'open' class for consistency with homepage
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdownParent = userMenuBtn?.closest('.nav-item.dropdown');

    if (userMenuBtn && userDropdownParent) {
      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        // Close all other dropdowns
        document.querySelectorAll('.nav-item.dropdown.open').forEach(item => {
          if (item !== userDropdownParent) {
            item.classList.remove('open');
          }
        });

        // Toggle this dropdown
        userDropdownParent.classList.toggle('open');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        userDropdownParent.classList.remove('open');
      });
    }

    // Also handle notifications and messages dropdowns
    const notificationsBtn = document.getElementById('notifications-btn');
    const messagesBtn = document.getElementById('messages-btn');

    [notificationsBtn, messagesBtn].forEach(btn => {
      if (btn) {
        const dropdownParent = btn.closest('.nav-item.dropdown');
        if (dropdownParent) {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();

            // Close all other dropdowns
            document.querySelectorAll('.nav-item.dropdown.open').forEach(item => {
              if (item !== dropdownParent) {
                item.classList.remove('open');
              }
            });

            // Toggle this dropdown
            dropdownParent.classList.toggle('open');
          });
        }
      }
    });
  }

  setupActionButtons() {
    // Change email
    const changeEmailBtn = document.getElementById('change-email-btn');
    if (changeEmailBtn) {
      changeEmailBtn.addEventListener('click', () => this.changeEmail());
    }

    // Change password
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', () => this.changePassword());
    }

    // Manage sessions
    const manageSessionsBtn = document.getElementById('manage-sessions-btn');
    if (manageSessionsBtn) {
      manageSessionsBtn.addEventListener('click', () => this.manageSessions());
    }

    // Download data
    const downloadDataBtn = document.getElementById('download-data-btn');
    if (downloadDataBtn) {
      downloadDataBtn.addEventListener('click', () => this.downloadData());
    }

    // Clear cache
    const clearCacheBtn = document.getElementById('clear-cache-btn');
    if (clearCacheBtn) {
      clearCacheBtn.addEventListener('click', () => this.clearCache());
    }

    // Deactivate account
    const deactivateBtn = document.getElementById('deactivate-account-btn');
    if (deactivateBtn) {
      deactivateBtn.addEventListener('click', () => this.deactivateAccount());
    }

    // Delete account
    const deleteBtn = document.getElementById('delete-account-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.deleteAccount());
    }

    // 2FA Setup
    const setup2FABtn = document.getElementById('setup-2fa-btn');
    if (setup2FABtn) {
      setup2FABtn.addEventListener('click', () => this.setup2FA());
    }

    // 2FA Disable
    const disable2FABtn = document.getElementById('disable-2fa-btn');
    if (disable2FABtn) {
      disable2FABtn.addEventListener('click', () => this.showDisable2FAModal());
    }

    // 2FA Modal close buttons
    const close2FAModal = document.getElementById('close-2fa-modal');
    if (close2FAModal) {
      close2FAModal.addEventListener('click', () => this.close2FAModal());
    }

    const closeDisable2FAModal = document.getElementById('close-disable-2fa-modal');
    if (closeDisable2FAModal) {
      closeDisable2FAModal.addEventListener('click', () => this.closeDisable2FAModal());
    }

    // Sessions Modal close
    const closeSessionsModal = document.getElementById('close-sessions-modal');
    if (closeSessionsModal) {
      closeSessionsModal.addEventListener('click', () => this.closeSessionsModal());
    }

    // Sign out all other sessions
    const signOutAllBtn = document.getElementById('sign-out-all-btn');
    if (signOutAllBtn) {
      signOutAllBtn.addEventListener('click', () => this.signOutAllOtherSessions());
    }

    // Close sessions modal on outside click
    const sessionsModal = document.getElementById('sessions-modal');
    if (sessionsModal) {
      sessionsModal.addEventListener('click', (e) => {
        if (e.target === sessionsModal) {
          this.closeSessionsModal();
        }
      });
    }

    // 2FA Verification
    const verify2FABtn = document.getElementById('verify-2fa-code-btn');
    if (verify2FABtn) {
      verify2FABtn.addEventListener('click', () => this.verify2FACode());
    }

    // 2FA verification input - verify on Enter
    const verificationInput = document.getElementById('verification-code-input');
    if (verificationInput) {
      verificationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.verify2FACode();
        }
      });
      // Only allow numbers
      verificationInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
      });
    }

    // Download backup codes
    const downloadBackupBtn = document.getElementById('download-backup-codes-btn');
    if (downloadBackupBtn) {
      downloadBackupBtn.addEventListener('click', () => this.downloadBackupCodes());
    }

    // Finish 2FA setup
    const finish2FABtn = document.getElementById('finish-2fa-setup-btn');
    if (finish2FABtn) {
      finish2FABtn.addEventListener('click', () => this.finish2FASetup());
    }

    // Cancel disable 2FA
    const cancelDisable2FABtn = document.getElementById('cancel-disable-2fa-btn');
    if (cancelDisable2FABtn) {
      cancelDisable2FABtn.addEventListener('click', () => this.closeDisable2FAModal());
    }

    // Confirm disable 2FA
    const confirmDisable2FABtn = document.getElementById('confirm-disable-2fa-btn');
    if (confirmDisable2FABtn) {
      confirmDisable2FABtn.addEventListener('click', () => this.disable2FA());
    }
  }

  async loadSettings() {
    try {
      // 1. Prima carica da LocalStorage (veloce)
      this.loadSettingsFromStorage();

      // 2. Se l'utente è loggato, sincronizza con il DB (persistenza account)
      if (this.supabase && this.currentUser) {
        await this.syncSettingsWithDatabase();
      }

      // 3. Aggiorna UI
      this.updateUIWithSettings();

      // Update email display
      const emailDisplay = document.getElementById('current-email');
      if (emailDisplay && this.currentUser && this.currentUser.email) {
        emailDisplay.textContent = this.currentUser.email;
      }

      // Update user name - load from profile
      await this.loadUserProfile();

    } catch (error) {
      console.error('Error loading settings:', error);
      this.loadDefaultSettings();
    }
  }

  async syncSettingsWithDatabase() {
    try {
      // Recupera settings dalla tabella dedicata user_privacy_settings
      const { data, error } = await this.supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore not found error
        console.warn('Error fetching privacy settings:', error);
      }

      if (data) {
        console.log('📥 Impostazioni scaricate dal cloud:', data);

        // Mappa da snake_case (DB) a camelCase (JS)
        const dbSettings = this.mapDbToSettings(data);

        // Merge: DB vince su LocalStorage
        this.settings = { ...this.settings, ...dbSettings };

        // Aggiorna LocalStorage
        localStorage.setItem('edunet_settings', JSON.stringify(this.settings));

        // Applica le nuove impostazioni
        this.applySettings();
      } else {
        // Se non esistono settings sul DB, li creiamo dai default/locali
        console.log('📤 Creazione impostazioni default sul cloud');
        await this.saveSettingsToDatabase();
      }

    } catch (error) {
      console.warn('Sync settings warning:', error);
    }
  }

  async saveSettingsToDatabase() {
    if (!this.supabase || !this.currentUser) return;

    try {
      // Mappa da camelCase (JS) a snake_case (DB)
      const dbPayload = this.mapSettingsToDb(this.settings);
      dbPayload.user_id = this.currentUser.id; // Ensure ID is present
      dbPayload.updated_at = new Date().toISOString();

      const { error } = await this.supabase
        .from('user_privacy_settings')
        .upsert(dbPayload)
        .select();

      if (error) throw error;
      console.log('✅ Impostazioni salvate nel cloud');
    } catch (error) {
      console.error('Errore salvataggio impostazioni cloud:', error);
    }
  }

  // Helper: Mappa DB (snake_case) -> JS (camelCase)
  mapDbToSettings(dbData) {
    const mapping = {
      profile_visibility: 'publicProfile', // Special mapping: value conversion needed
      show_email: 'showEmail',
      searchable_by_email: 'searchableEmail',
      posts_visibility: 'postsVisibility',
      comments_permission: 'commentsPermission',
      email_new_posts: 'emailNewPosts',
      email_followers: 'emailFollowers',
      email_comments: 'emailComments',
      email_matches: 'emailMatches',
      push_enabled: 'pushEnabled',
      notification_sounds: 'notificationSounds',
      theme: 'theme',
      font_size: 'fontSize',
      autoplay_videos: 'autoplayVideos',
      data_saver_mode: 'dataSaver',
      language: 'language',
      social_login_enabled: 'socialLogin'
    };

    const settings = {};
    Object.keys(mapping).forEach(dbKey => {
      if (dbData[dbKey] !== undefined) {
        const jsKey = mapping[dbKey];
        // Special conversion for profile_visibility (DB: 'public'/'private' -> JS: boolean true/false for toggle)
        if (dbKey === 'profile_visibility') {
          settings[jsKey] = dbData[dbKey] === 'public';
        } else {
          settings[jsKey] = dbData[dbKey];
        }
      }
    });
    return settings;
  }

  // Helper: Mappa JS (camelCase) -> DB (snake_case)
  mapSettingsToDb(jsData) {
    const mapping = {
      publicProfile: 'profile_visibility',
      showEmail: 'show_email',
      searchableEmail: 'searchable_by_email',
      postsVisibility: 'posts_visibility',
      commentsPermission: 'comments_permission',
      emailNewPosts: 'email_new_posts',
      emailFollowers: 'email_followers',
      emailComments: 'email_comments',
      emailMatches: 'email_matches',
      pushEnabled: 'push_enabled',
      notificationSounds: 'notification_sounds',
      theme: 'theme',
      fontSize: 'font_size',
      autoplayVideos: 'autoplay_videos',
      dataSaver: 'data_saver_mode',
      language: 'language',
      socialLogin: 'social_login_enabled'
    };

    const dbData = {};
    Object.keys(mapping).forEach(jsKey => {
      if (jsData[jsKey] !== undefined) {
        const dbKey = mapping[jsKey];
        // Special conversion for profile_visibility
        if (jsKey === 'publicProfile') {
          dbData[dbKey] = jsData[jsKey] ? 'public' : 'private';
        } else {
          dbData[dbKey] = jsData[jsKey];
        }
      }
    });
    return dbData;
  }

  loadDefaultSettings() {
    this.settings = {
      publicProfile: true,
      showEmail: false,
      searchableEmail: true,
      postsVisibility: 'public',
      commentsPermission: 'everyone',
      emailNewPosts: true,
      emailFollowers: true,
      emailComments: true,
      emailMatches: true,
      pushEnabled: false,
      notificationSounds: true,
      twoFactorAuth: false,
      socialLogin: false,
      theme: 'light',
      fontSize: 'medium',
      autoplayVideos: true,
      dataSaver: false,
      language: 'it'
    };

    this.applySettings();
  }

  loadSettingsFromStorage() {
    const saved = localStorage.getItem('edunet_settings');
    if (saved) {
      try {
        this.settings = JSON.parse(saved);
        this.applySettings();
      } catch (error) {
        console.error('Error parsing saved settings:', error);
        this.loadDefaultSettings();
      }
    } else {
      this.loadDefaultSettings();
    }
  }

  updateUIWithSettings() {
    // Aggiorna lo stato dei controlli nell'interfaccia
    Object.keys(this.settings).forEach(key => {
      let elementId = this.kebabCase(key);
      let element = document.getElementById(elementId);

      // Se non trovato, prova con suffisso -select (per theme, fontSize, language)
      if (!element) {
        element = document.getElementById(`${elementId}-select`);
      }

      if (element) {
        if (element.type === 'checkbox') {
          element.checked = this.settings[key];
        } else if (element.tagName === 'SELECT') {
          element.value = this.settings[key];
        }
      }
    });
  }

  applySettings() {
    // Applica global preferences usando il loader globale se disponibile
    if (window.EduNetPrefs) {
      if (this.settings.theme) window.EduNetPrefs.applyTheme(this.settings.theme);
      if (this.settings.fontSize) window.EduNetPrefs.applyFontSize(this.settings.fontSize);
      if (this.settings.dataSaver !== undefined) window.EduNetPrefs.applyDataSaver(this.settings.dataSaver);
    } else {
      // Fallback logica legacy
      if (this.settings.theme) this.applyTheme(this.settings.theme);
      if (this.settings.fontSize) this.applyFontSize(this.settings.fontSize);
      if (this.settings.dataSaver !== undefined) this.applyDataSaver(this.settings.dataSaver);
    }

    // Autoplay logic (specifica di questa pagina/sessione)
    if (this.settings.autoplayVideos !== undefined) this.applyAutoplay(this.settings.autoplayVideos);

    // Aggiorna anche i controlli UI
    this.updateUIWithSettings();
  }

  kebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  switchSection(sectionId) {
    // Update navigation
    document.querySelectorAll('.settings-nav-item').forEach(item => {
      item.classList.remove('active');
    });

    const activeNav = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeNav) {
      activeNav.classList.add('active');
    }

    // Update sections
    document.querySelectorAll('.settings-section').forEach(section => {
      section.classList.remove('active');
    });

    const activeSection = document.getElementById(`${sectionId}-section`);
    if (activeSection) {
      activeSection.classList.add('active');
    }

    this.currentSection = sectionId;
  }

  handleToggleChange(settingId, value) {
    console.log(`Setting ${settingId} changed to:`, value);

    // Convert kebab-case to camelCase
    const camelId = settingId.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    this.settings[camelId] = value;

    this.saveSettings();
    this.showNotification(`Impostazione aggiornata`, 'success');

    // Apply immediate effects
    if (settingId === 'autoplay-videos') {
      this.applyAutoplay(value);
    } else if (settingId === 'data-saver') {
      this.applyDataSaver(value);
    }
  }

  handleSelectChange(settingId, value) {
    console.log(`Setting ${settingId} changed to:`, value);

    // Convert kebab-case to camelCase
    const camelId = settingId.replace(/-select$/, '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    this.settings[camelId] = value;

    this.saveSettings();
    this.showNotification(`Impostazione aggiornata`, 'success');

    // Apply theme immediately
    if (settingId === 'theme-select') {
      this.applyTheme(value);
    } else if (settingId === 'font-size-select') {
      this.applyFontSize(value);
    }
  }

  async saveSettings() {
    try {
      // 1. Save to LocalStorage (fast)
      localStorage.setItem('edunet_settings', JSON.stringify(this.settings));
      console.log('Settings saved to LocalStorage');

      // 2. Save to Supabase (if logged in)
      if (this.supabase && this.currentUser) {
        await this.saveSettingsToDatabase();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      this.showNotification('🌙 Tema scuro attivato', 'info');
    } else if (theme === 'light') {
      document.body.classList.remove('dark-theme');
      this.showNotification('☀️ Tema chiaro attivato', 'info');
    } else if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.toggle('dark-theme', prefersDark);
      this.showNotification('🔄 Tema automatico attivato', 'info');
    }
  }

  applyFontSize(size) {
    document.documentElement.setAttribute('data-font-size', size);
    console.log(`Font size set to: ${size}`);
  }

  applyAutoplay(enabled) {
    document.documentElement.setAttribute('data-autoplay', enabled);
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.autoplay = enabled;
      if (!enabled && !video.paused) {
        video.pause();
      } else if (enabled && video.paused && video.checkVisibility && video.checkVisibility()) {
        // Only play if visible and allowed
        video.play().catch(e => console.warn('Autoplay blocked:', e));
      }
    });
    console.log(`Autoplay set to: ${enabled}`);
  }

  applyDataSaver(enabled) {
    document.documentElement.setAttribute('data-saver', enabled);
    if (enabled) {
      document.body.classList.add('data-saver-mode');
    } else {
      document.body.classList.remove('data-saver-mode');
    }
    console.log(`Data saver set to: ${enabled}`);
  }

  async changeEmail() {
    const newEmail = prompt('Inserisci il nuovo indirizzo email:');
    if (!newEmail) return;

    if (!this.validateEmail(newEmail)) {
      alert('Indirizzo email non valido.');
      return;
    }

    if (newEmail === this.currentUser.email) {
      alert('La nuova email deve essere diversa da quella attuale.');
      return;
    }

    try {
      this.showLoading('Aggiornamento email...');

      // Supabase handle email change
      const { error } = await this.supabase.auth.updateUser({
        email: newEmail
      });

      this.hideLoading();

      if (error) throw error;

      alert('✅ Richiesta inviata! Controlla ORA entrambe le caselle email:\n\n1. La tua vecchia email (' + this.currentUser.email + ')\n2. La tua nuova email (' + newEmail + ')\n\nDevi cliccare sui link di conferma in ENTRAMBE le email per completare il cambio.');

    } catch (error) {
      this.hideLoading();
      console.error('Error changing email:', error);
      alert('Errore durante il cambio email: ' + (error.message || 'Errore sconosciuto'));
    }
  }

  async changePassword() {
    const confirmed = confirm('Vuoi cambiare la password? Riceverai un\'email con un link sicuro per impostare la nuova password.');
    if (!confirmed) return;

    try {
      this.showLoading('Invio email reset...');

      if (this.supabase && this.currentUser) {
        const { error } = await this.supabase.auth.resetPasswordForEmail(this.currentUser.email, {
          redirectTo: window.AppConfig.getPageUrl('pages/auth/reset-password.html')
        });

        this.hideLoading();

        if (error) throw error;

        alert('✅ Email inviata con successo!\n\nControlla la tua casella di posta (anche nello spam) e clicca sul link per creare una nuova password.');
      }
    } catch (error) {
      this.hideLoading();
      console.error('Error sending reset email:', error);
      alert('❌ Errore durante l\'invio dell\'email: ' + error.message);
    }
  }

  manageSessions() {
    const modal = document.getElementById('sessions-modal');
    if (modal) {
      modal.classList.add('active');
      this.loadActiveSessions();
    }
  }

  closeSessionsModal() {
    const modal = document.getElementById('sessions-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  }

  async registerCurrentSession() {
    if (!this.currentUser || !this.supabase) return;

    try {
      // Get or create device ID
      let deviceId = localStorage.getItem('edunet_device_id');
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('edunet_device_id', deviceId);
      }

      // Parse User Agent
      const ua = navigator.userAgent;
      let browser = 'Sconosciuto';
      let os = 'Sconosciuto';
      let deviceType = 'desktop';

      // Simple UA parsing
      if (ua.includes('Firefox') && !ua.includes('Seamonkey')) browser = 'Firefox';
      else if (ua.includes('Seamonkey')) browser = 'Seamonkey';
      else if (ua.includes('Chrome') && !ua.includes('Chromium')) browser = 'Chrome';
      else if (ua.includes('Chromium')) browser = 'Chromium';
      else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
      else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';
      else if (ua.includes('Edg')) browser = 'Edge';

      if (ua.includes('Win')) os = 'Windows';
      else if (ua.includes('Mac')) os = 'MacOS';
      else if (ua.includes('Linux')) os = 'Linux';
      else if (ua.includes('Android')) { os = 'Android'; deviceType = 'mobile'; }
      else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; deviceType = 'mobile'; }

      const deviceName = `${browser} su ${os}`;

      // Get IP (optional, simplified)
      let ip = 'N/A';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ip = ipData.ip;
      } catch (e) {
        console.warn('Could not fetch IP:', e);
      }

      // Upsert session info
      try {
        // Check if table exists first (to avoid 404 if migration failed)
        // We use a simple select to check
        const { error: checkError } = await this.supabase
          .from('user_active_sessions')
          .select('id')
          .limit(1);

        if (checkError && checkError.code === '42P01') {
          console.warn('Table user_active_sessions does not exist yet.');
          return;
        }

        const { error } = await this.supabase
          .from('user_active_sessions')
          .upsert({
            user_id: this.currentUser.id,
            device_id: deviceId,
            device_type: deviceType,
            device_name: deviceName,
            browser: browser,
            os: os,
            ip_address: ip,
            last_active: new Date().toISOString()
          }, { onConflict: 'user_id, device_id' });

        if (error) {
          // If conflict or RLS error, log it but don't crash app
          console.warn('Session registration warning:', error.message);
        } else {
          console.log('✅ Session registered successfully');
        }
      } catch (upsertError) {
        console.warn('Session upsert exception:', upsertError);
      }

    } catch (error) {
      console.error('Session registration error:', error);
    }
  }

  async loadActiveSessions() {
    try {
      const listContainer = document.getElementById('sessions-list');
      if (!listContainer) return;

      listContainer.innerHTML = '<div class="empty-sessions"><i class="fas fa-spinner fa-spin"></i> Caricamento sessioni...</div>';

      const currentDeviceId = localStorage.getItem('edunet_device_id');

      // Fetch sessions
      const { data: sessions, error } = await this.supabase
        .from('user_active_sessions')
        .select('*')
        .order('last_active', { ascending: false });

      if (error) {
        console.warn('Error loading sessions table:', error);
        listContainer.innerHTML = '<div class="empty-sessions">Funzionalità sessioni non ancora disponibile.</div>';
        return;
      }

      if (!sessions || sessions.length === 0) {
        listContainer.innerHTML = '<div class="empty-sessions">Nessuna sessione attiva trovata.</div>';
        return;
      }

      console.log(' Rendering', sessions.length, 'sessions to DOM');
      listContainer.innerHTML = '';

      sessions.forEach(session => {
        const isCurrent = session.device_id === currentDeviceId;
        console.log(' Rendering session:', session.device_name, 'Current:', isCurrent);

        const lastActive = new Date(session.last_active).toLocaleString('it-IT', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });

        // Icons
        let iconClass = 'fa-desktop';
        if (session.device_type === 'mobile') iconClass = 'fa-mobile-alt';
        if (session.device_type === 'tablet') iconClass = 'fa-tablet-alt';

        const sessionHtml = `
          <div class="session-card ${isCurrent ? 'current' : ''}" style="display: flex; align-items: center; padding: 1rem; background: #f8f9fa; border-radius: 0.5rem; margin-bottom: 0.5rem; border: 1px solid #e5e7eb;">
            <div class="session-icon" style="font-size: 1.5rem; color: #6b7280; margin-right: 1rem; width: 40px; text-align: center;">
              <i class="fas ${iconClass}"></i>
            </div>
            <div class="session-info" style="flex: 1;">
              <div class="session-name" style="font-weight: 600; color: #111827; margin-bottom: 0.25rem;">
                ${session.device_name}
                ${isCurrent ? '<span class="current-badge" style="display: inline-block; background: #dbeafe; color: #2563eb; font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 9999px; margin-left: 0.5rem;">Attuale</span>' : ''}
              </div>
              <div class="session-details" style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;">
                ${session.ip_address !== 'N/A' ? session.ip_address + ' • ' : ''} ${session.location || 'Posizione sconosciuta'}
              </div>
              <div class="session-meta" style="font-size: 0.75rem; color: #9ca3af;">
                <i class="far fa-clock"></i> Attivo: ${lastActive}
              </div>
            </div>
            ${!isCurrent ? `
              <div class="session-actions">
                <button class="revoke-btn" onclick="window.settingsPage.revokeSession('${session.device_id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0.5rem; font-size: 0.875rem;">
                  <i class="fas fa-times-circle"></i> Termina
                </button>
              </div>
            ` : ''}
          </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', sessionHtml);
      });

      // Force redraw check
      console.log(' Session list innerHTML length:', listContainer.innerHTML.length);

    } catch (error) {
      console.error('Error loading sessions:', error);
      const listContainer = document.getElementById('sessions-list');
      if (listContainer) listContainer.innerHTML = '<div class="empty-sessions" style="color: #ef4444;">Errore caricamento sessioni.</div>';
    }
  }

  async revokeSession(deviceId) {
    if (!confirm('Vuoi terminare questa sessione? Il dispositivo verrà disconnesso.')) return;

    try {
      this.showLoading('Terminazione sessione...');

      // Delete from DB
      const { error } = await this.supabase
        .from('user_active_sessions')
        .delete()
        .match({ user_id: this.currentUser.id, device_id: deviceId });

      if (error) throw error;

      this.hideLoading();
      this.showNotification('Sessione terminata con successo', 'success');
      this.loadActiveSessions(); // Refresh list

    } catch (error) {
      this.hideLoading();
      console.error('Error revoking session:', error);
      this.showNotification('Errore durante la terminazione', 'error');
    }
  }

  async signOutAllOtherSessions() {
    if (!confirm('Sei sicuro? Tutti gli altri dispositivi verranno disconnessi immediatamente.')) return;

    try {
      this.showLoading('Disconnessione dispositivi...');

      // 1. Supabase global sign out (kills other refresh tokens)
      const { error } = await this.supabase.auth.signOut({ scope: 'others' });
      if (error) throw error;

      // 2. Clean up DB (remove all except current)
      const currentDeviceId = localStorage.getItem('edunet_device_id');
      if (currentDeviceId) {
        await this.supabase
          .from('user_active_sessions')
          .delete()
          .neq('device_id', currentDeviceId)
          .eq('user_id', this.currentUser.id);
      }

      this.hideLoading();
      this.showNotification('Tutti gli altri dispositivi sono stati disconnessi', 'success');
      this.loadActiveSessions();

    } catch (error) {
      this.hideLoading();
      console.error('Error signing out others:', error);
      this.showNotification('Errore durante la disconnessione globale', 'error');
    }
  }

  async downloadData() {
    const confirmed = confirm('Vuoi scaricare tutti i tuoi dati? Riceverai un file JSON con tutte le informazioni del tuo account.');
    if (!confirmed) return;

    try {
      this.showLoading('Preparazione archivio dati...');

      if (!this.currentUser || !this.supabase) {
        throw new Error('Utente non autenticato');
      }

      const userId = this.currentUser.id;
      const exportData = {
        export_date: new Date().toISOString(),
        user_id: userId,
        email: this.currentUser.email,
        metadata: {
          version: '1.0',
          platform: 'EduNet19'
        }
      };

      console.log('📦 Inizio export dati per:', userId);

      // 1. Base Profile
      const { data: userProfile, error: profileError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      exportData.profile = userProfile;

      // 2. Detailed Profile (School or Private)
      const detailsTable = userProfile.user_type === 'istituto' ? 'school_institutes' : 'private_users';
      const { data: userDetails, error: detailsError } = await this.supabase
        .from(detailsTable)
        .select('*')
        .eq('id', userId)
        .single();

      if (!detailsError) {
        exportData.details = userDetails;
      } else {
        console.warn('Dettagli profilo non trovati o errore:', detailsError);
        exportData.details = null;
      }

      // 3. Fetch Content & Social Data in parallel
      console.log('🔄 Recupero dati correlati...');

      const [
        posts,
        comments,
        gallery,
        followers,
        following,
        likes,
        savedPosts,
        notifications
      ] = await Promise.all([
        // Posts (only if institute)
        userProfile.user_type === 'istituto'
          ? this.supabase.from('institute_posts').select('*').eq('institute_id', userId)
          : { data: [], error: null },

        // Comments made by user
        this.supabase.from('post_comments').select('*').eq('user_id', userId),

        // Gallery
        this.supabase.from('profile_gallery').select('*').eq('user_id', userId),

        // Followers (who follows me)
        this.supabase.from('user_follows').select('*').eq('following_id', userId),

        // Following (who I follow)
        this.supabase.from('user_follows').select('*').eq('follower_id', userId),

        // Likes given
        this.supabase.from('post_likes').select('*').eq('user_id', userId),

        // Saved posts
        this.supabase.from('saved_posts').select('*').eq('user_id', userId),

        // Notifications
        this.supabase.from('user_notifications').select('*').eq('user_id', userId)
      ]);

      // Check for errors in parallel requests (optional but good practice)
      if (posts.error) console.warn('Errore export posts:', posts.error);

      exportData.content = {
        posts: posts.data || [],
        comments: comments.data || [],
        gallery: gallery.data || []
      };

      exportData.social = {
        followers: followers.data || [],
        following: following.data || [],
        likes: likes.data || [],
        saved_posts: savedPosts.data || []
      };

      exportData.notifications = notifications.data || [];

      console.log('✅ Dati recuperati, generazione file...');

      // Generate and download file
      const fileName = `edunet_data_${this.currentUser.email.split('@')[0]}_${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;

      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      setTimeout(() => document.body.removeChild(a), 100);

      this.hideLoading();
      this.showNotification('✅ Dati scaricati con successo!', 'success');

    } catch (error) {
      console.error('Export error:', error);
      this.hideLoading();
      alert('Errore durante il download dei dati: ' + (error.message || 'Errore sconosciuto'));
    }
  }

  async clearCache() {
    const confirmed = confirm('Vuoi cancellare la cache? Questo eliminerà i dati temporanei salvati nel browser per migliorare le prestazioni.\n\nNon perderai nessun dato salvato sul server.');
    if (!confirmed) return;

    try {
      this.showLoading('Pulizia cache in corso...');

      // 1. Clear LocalStorage (preserving critical keys)
      const keysToKeep = ['edunet_settings', 'supabase.auth.token', 'sb-access-token', 'sb-refresh-token'];
      const keysToRemove = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🧹 Rimossi ${keysToRemove.length} elementi da LocalStorage`);

      // 2. Clear SessionStorage
      sessionStorage.clear();
      console.log('🧹 SessionStorage svuotato');

      // 3. Clear Cache Storage (Service Workers cache)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log(`🧹 Rimossi ${cacheNames.length} cache service worker`);
      }

      // 4. Reload 2FA status to be safe
      await this.check2FAStatus();

      // 5. Recalculate storage usage
      await this.updateStorageUsage();

      this.hideLoading();

      // Show success and reload to apply changes cleanly
      alert('✅ Cache cancellata con successo! La pagina verrà ricaricata.');
      window.location.reload();

    } catch (error) {
      console.error('Cache clear error:', error);
      this.hideLoading();
      this.showNotification('Errore durante la pulizia della cache', 'error');
    }
  }

  async updateStorageUsage() {
    try {
      if (!this.currentUser) {
        console.log('Storage usage: no user logged in');
        return;
      }

      // Set loading state
      const storageText = document.querySelector('.storage-text');
      if (storageText) storageText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calcolo spazio utilizzato...';

      console.log('📊 Calcolo spazio utilizzato per:', this.currentUser.id);

      // Try RPC function with correct parameter name (user_uuid)
      let usage = null;
      let rpcError = null;

      // First try with user_uuid parameter
      const { data: data1, error: error1 } = await this.supabase
        .rpc('get_user_storage_usage', { user_uuid: this.currentUser.id });

      if (!error1) {
        usage = data1;
      } else {
        // Fallback: try with target_user_id parameter (legacy)
        const { data: data2, error: error2 } = await this.supabase
          .rpc('get_user_storage_usage', { target_user_id: this.currentUser.id });

        if (!error2) {
          usage = data2;
        } else {
          rpcError = error2;
        }
      }

      if (rpcError || !usage) {
        // Silently fallback without spamming console
        await this.estimateStorageLocally();
        return;
      }

      console.log('✅ Storage usage received:', usage);
      this.renderStorageUsage(usage);

    } catch (error) {
      console.error('❌ Error updating storage usage:', error);
      // Try fallback even on critical error
      await this.estimateStorageLocally();
    }
  }

  // Fallback estimation if RPC missing
  async estimateStorageLocally() {
    console.log('⚠️ Using local storage estimation (fallback)');
    // Default estimation logic - visualizza 0 se non possiamo calcolare
    const usage = {
      total_bytes: 0,
      limit_bytes: 1073741824 // 1GB
    };
    this.renderStorageUsage(usage);
  }

  renderStorageUsage(usage) {
    const totalBytes = usage.total_bytes || 0;
    const limitBytes = usage.limit_bytes || 1073741824; // Default 1GB

    const percentage = Math.min((totalBytes / limitBytes) * 100, 100).toFixed(1);
    const usedFormatted = this.formatBytes(totalBytes);
    const limitFormatted = this.formatBytes(limitBytes);

    // Update DOM
    const storageBar = document.querySelector('.storage-used');
    const storageText = document.querySelector('.storage-text');

    if (storageBar) {
      storageBar.style.width = `${percentage}%`;
      // Change color based on usage
      if (percentage > 90) storageBar.style.backgroundColor = '#ef4444'; // Red
      else if (percentage > 70) storageBar.style.backgroundColor = '#f59e0b'; // Orange
      else storageBar.style.backgroundColor = '#2563eb'; // Blue
    }

    if (storageText) {
      storageText.innerHTML = `<strong>${usedFormatted}</strong> di ${limitFormatted} utilizzati (${percentage}%)`;
    }
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  async deactivateAccount() {
    const confirmed = confirm('⚠️ ATTENZIONE\n\nSei sicuro di voler disattivare il tuo account?\n\nIl tuo profilo non sarà più visibile agli altri utenti, ma i tuoi dati non verranno eliminati. Potrai riattivare l\'account effettuando nuovamente il login.');

    if (!confirmed) return;

    const doubleCheck = confirm('Confermi la disattivazione dell\'account?');
    if (!doubleCheck) return;

    try {
      this.showLoading('Disattivazione account in corso...');

      // Aggiorna stato utente nel DB (Soft Delete logic)
      // Nota: Assumiamo che esista una colonna 'active' o 'status'. 
      // Se non esiste, la creiamo o usiamo un flag nei metadata.
      // Per ora usiamo user_metadata di Supabase Auth

      const { error } = await this.supabase.auth.updateUser({
        data: { status: 'deactivated', deactivated_at: new Date().toISOString() }
      });

      if (error) throw error;

      // Opzionale: Nascondi profilo pubblico
      await this.supabase
        .from('user_profiles')
        .update({ profile_completed: false }) // Usiamo un flag esistente per nascondere
        .eq('id', this.currentUser.id);

      this.hideLoading();

      alert('Account disattivato con successo. Verrai disconnesso.');

      // Logout
      await this.supabase.auth.signOut();
      window.location.href = window.AppConfig.getPageUrl('index.html');

    } catch (error) {
      this.hideLoading();
      console.error('Error deactivating account:', error);
      alert('Errore durante la disattivazione: ' + error.message);
    }
  }

  async deleteAccount() {
    const confirmed = confirm('🚨 PERICOLO\n\nSei sicuro di voler ELIMINARE PERMANENTEMENTE il tuo account?\n\nQuesta azione è IRREVERSIBILE!\n\n• Tutti i tuoi post verranno eliminati\n• Tutti i tuoi progetti verranno eliminati\n• Tutti i tuoi dati verranno cancellati\n• Tutte le tue immagini verranno eliminate\n\nNon sarà possibile recuperare l\'account.');

    if (!confirmed) return;

    const password = prompt('Per confermare, inserisci la tua password:');
    if (!password) return;

    const finalConfirm = confirm('ULTIMA CONFERMA: Eliminare definitivamente l\'account?\n\nDigita OK per procedere.');
    if (!finalConfirm) return;

    try {
      this.showLoading('Eliminazione account in corso...');

      // 1. Verifica password
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      if (authError || !user) throw new Error('Utente non autenticato');

      const email = user.email;

      // Tenta re-autenticazione per verificare password
      const { error: signInError } = await this.supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (signInError) {
        throw new Error('Password errata');
      }

      console.log('✅ Password verificata');

      // 2. Elimina dati utente dal database
      console.log('🗑️ Eliminazione dati database...');

      // Elimina post
      const { error: postsError } = await this.supabase
        .from('institute_posts')
        .delete()
        .eq('institute_id', user.id);

      if (postsError) console.warn('Errore eliminazione post:', postsError);

      // Elimina profilo (school_institutes o private_users)
      const { data: userProfile } = await this.supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (userProfile) {
        if (userProfile.user_type === 'istituto') {
          await this.supabase.from('school_institutes').delete().eq('id', user.id);
        } else {
          await this.supabase.from('private_users').delete().eq('id', user.id);
        }
      }

      // Elimina user_profiles
      await this.supabase.from('user_profiles').delete().eq('id', user.id);

      console.log('✅ Dati database eliminati');

      // 3. Elimina immagini storage
      console.log('🗑️ Eliminazione immagini...');

      try {
        // Elimina avatar
        await this.supabase.storage.from('avatars').remove([`${user.id}/`]);
        // Elimina cover
        await this.supabase.storage.from('profile-images').remove([`${user.id}/`]);
        // Elimina gallery
        await this.supabase.storage.from('profile-gallery').remove([`${user.id}/`]);
      } catch (storageError) {
        console.warn('Errore eliminazione storage:', storageError);
      }

      console.log('✅ Immagini eliminate');

      // 4. Elimina account Auth
      console.log('🗑️ Eliminazione account Auth...');

      // NOTA: Supabase non permette agli utenti di eliminare il proprio account Auth direttamente
      // Dobbiamo usare una funzione RPC o Admin API
      // Per ora, facciamo logout e mostriamo messaggio

      await this.supabase.auth.signOut();

      this.hideLoading();

      alert('✅ Account eliminato con successo!\n\nTutti i tuoi dati sono stati cancellati.\n\nSarai reindirizzato alla pagina di login.');

      // Redirect a homepage
      window.location.href = window.AppConfig.getPageUrl('index.html');

    } catch (error) {
      this.hideLoading();
      console.error('❌ Errore eliminazione account:', error);
      alert(`Errore durante l'eliminazione dell'account:\n\n${error.message}\n\nRiprova o contatta il supporto.`);
    }
  }

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  showLoading(message = 'Caricamento...') {
    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    `;

    const loadingBox = document.createElement('div');
    loadingBox.style.cssText = `
      background: white;
      padding: 2rem 3rem;
      border-radius: 1rem;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #2563eb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    `;

    const text = document.createElement('p');
    text.textContent = message;
    text.style.cssText = `
      margin: 0;
      color: #333;
      font-size: 1rem;
      font-weight: 500;
    `;

    loadingBox.appendChild(spinner);
    loadingBox.appendChild(text);
    overlay.appendChild(loadingBox);
    document.body.appendChild(overlay);

    // Add spinner animation if not exists
    if (!document.getElementById('spinner-style')) {
      const style = document.createElement('style');
      style.id = 'spinner-style';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: calc(var(--top-nav-height) + 1rem);
      right: 1rem;
      background: var(--color-white);
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  async handleLogout() {
    if (confirm('Sei sicuro di voler uscire?')) {
      try {
        if (this.supabase) {
          await this.supabase.auth.signOut();
        }
        window.location.href = window.AppConfig.getPageUrl('index.html');
      } catch (error) {
        console.error('Error during logout:', error);
        window.location.href = window.AppConfig.getPageUrl('index.html');
      }
    }
  }

  async loadUserProfile() {
    try {
      if (!this.supabase || !this.currentUser) return;

      const { data: profile, error } = await this.supabase
        .from('school_institutes')
        .select('institute_name, institute_type')
        .eq('id', this.currentUser.id)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        // Update user name in navbar
        const userName = document.getElementById('user-name');
        const userFullName = document.getElementById('user-full-name');
        const userTypeDisplay = document.getElementById('user-type-display');

        if (userName) userName.textContent = profile.institute_name || 'Utente';
        if (userFullName) userFullName.textContent = profile.institute_name || 'Utente';
        if (userTypeDisplay) userTypeDisplay.textContent = profile.institute_type || 'Istituto Scolastico';
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  // ===== 2FA METHODS =====

  async check2FAStatus() {
    try {
      if (!window.twoFactorAuth) {
        console.warn('2FA library not loaded');
        return;
      }

      const isEnabled = await window.twoFactorAuth.is2FAEnabled();

      const setup2FABtn = document.getElementById('setup-2fa-btn');
      const disable2FABtn = document.getElementById('disable-2fa-btn');
      const statusText = document.getElementById('2fa-status-text');

      if (isEnabled) {
        if (setup2FABtn) setup2FABtn.style.display = 'none';
        if (disable2FABtn) disable2FABtn.style.display = 'inline-flex';
        if (statusText) statusText.textContent = '✅ Autenticazione a due fattori attiva';
      } else {
        if (setup2FABtn) setup2FABtn.style.display = 'inline-flex';
        if (disable2FABtn) disable2FABtn.style.display = 'none';
        if (statusText) statusText.textContent = 'Aggiungi un livello extra di sicurezza al tuo account';
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  }

  async setup2FA() {
    try {
      this.showLoading('Generazione codice 2FA...');

      if (!window.twoFactorAuth) {
        throw new Error('Libreria 2FA non disponibile');
      }

      // Generate secret and QR code
      const { secret, qrCodeUrl, backupCodes } = await window.twoFactorAuth.generateSecret();

      this.hideLoading();

      // Store backup codes temporarily
      this.tempBackupCodes = backupCodes;

      // Show modal
      const modal = document.getElementById('2fa-setup-modal');
      if (modal) {
        modal.style.display = 'flex';

        // Show step 1
        document.getElementById('2fa-step-1').style.display = 'block';
        document.getElementById('2fa-step-2').style.display = 'none';
        document.getElementById('2fa-step-3').style.display = 'none';

        // Hide loading, show QR code
        document.getElementById('qr-code-loading').style.display = 'none';
        const qrImage = document.getElementById('qr-code-image');
        // Usa QR Server API per generare l'immagine QR code dall'URL otpauth
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`;
        qrImage.src = qrApiUrl;
        qrImage.style.display = 'block';

        // Show secret code
        const secretCode = document.getElementById('secret-code');
        if (secretCode && window.twoFactorAuth.formatSecret) {
          secretCode.textContent = window.twoFactorAuth.formatSecret(secret);
        } else {
          secretCode.textContent = secret;
        }

        // Add button to go to step 2
        setTimeout(() => {
          const nextBtn = document.createElement('button');
          nextBtn.className = 'btn-primary';
          nextBtn.style.width = '100%';
          nextBtn.style.marginTop = '1rem';
          nextBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Continua';
          nextBtn.onclick = () => this.goTo2FAStep(2);

          const step1 = document.getElementById('2fa-step-1');
          if (step1 && !step1.querySelector('.btn-primary')) {
            step1.appendChild(nextBtn);
          }
        }, 100);
      }
    } catch (error) {
      this.hideLoading();
      console.error('Error setting up 2FA:', error);
      this.showNotification('Errore durante la configurazione del 2FA', 'error');
    }
  }

  goTo2FAStep(step) {
    document.getElementById('2fa-step-1').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('2fa-step-2').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('2fa-step-3').style.display = step === 3 ? 'block' : 'none';

    // Clear verification input when going to step 2
    if (step === 2) {
      const input = document.getElementById('verification-code-input');
      if (input) {
        input.value = '';
        input.focus();
      }
      const error = document.getElementById('verification-error');
      if (error) error.style.display = 'none';
    }
  }

  async verify2FACode() {
    try {
      const input = document.getElementById('verification-code-input');
      const code = input?.value;

      if (!code || code.length !== 6) {
        this.show2FAError('Inserisci un codice a 6 cifre');
        return;
      }

      this.showLoading('Verifica in corso...');

      // Verify code
      const isValid = await window.twoFactorAuth.verifyCode(code);

      if (!isValid) {
        this.hideLoading();
        this.show2FAError('Codice non valido. Riprova.');
        return;
      }

      // Enable 2FA
      await window.twoFactorAuth.enable2FA(code);

      this.hideLoading();

      // Show backup codes
      this.goTo2FAStep(3);
      this.displayBackupCodes();

    } catch (error) {
      this.hideLoading();
      console.error('Error verifying 2FA code:', error);
      this.show2FAError('Errore durante la verifica. Riprova.');
    }
  }

  show2FAError(message) {
    const error = document.getElementById('verification-error');
    if (error) {
      error.textContent = message;
      error.style.display = 'block';
    }
  }

  displayBackupCodes() {
    const container = document.getElementById('backup-codes-container');
    if (!container || !this.tempBackupCodes) return;

    container.innerHTML = this.tempBackupCodes
      .map((code, i) => `<div style="padding: 0.5rem 0;">${i + 1}. <strong>${code}</strong></div>`)
      .join('');
  }

  downloadBackupCodes() {
    if (!this.tempBackupCodes || !window.twoFactorAuth) return;
    window.twoFactorAuth.downloadBackupCodes(this.tempBackupCodes);
    this.showNotification('Codici di backup scaricati', 'success');
  }

  finish2FASetup() {
    this.close2FAModal();
    this.tempBackupCodes = null;
    this.showNotification('✅ Autenticazione a due fattori attivata con successo!', 'success');
    this.check2FAStatus();
  }

  close2FAModal() {
    const modal = document.getElementById('2fa-setup-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    // Reset steps
    this.goTo2FAStep(1);
    // Clear temp data
    this.tempBackupCodes = null;
  }

  showDisable2FAModal() {
    const modal = document.getElementById('2fa-disable-modal');
    if (modal) {
      modal.style.display = 'flex';
      const input = document.getElementById('disable-2fa-password');
      if (input) {
        input.value = '';
        input.focus();
      }
      const error = document.getElementById('disable-2fa-error');
      if (error) error.style.display = 'none';
    }
  }

  closeDisable2FAModal() {
    const modal = document.getElementById('2fa-disable-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  async disable2FA() {
    try {
      const input = document.getElementById('disable-2fa-password');
      const password = input?.value;

      if (!password) {
        this.showDisable2FAError('Inserisci la tua password');
        return;
      }

      this.showLoading('Disattivazione 2FA...');

      await window.twoFactorAuth.disable2FA(password);

      this.hideLoading();
      this.closeDisable2FAModal();
      this.showNotification('Autenticazione a due fattori disattivata', 'info');
      this.check2FAStatus();

    } catch (error) {
      this.hideLoading();
      console.error('Error disabling 2FA:', error);
      this.showDisable2FAError(error.message || 'Errore durante la disattivazione');
    }
  }

  showDisable2FAError(message) {
    const error = document.getElementById('disable-2fa-error');
    if (error) {
      error.textContent = message;
      error.style.display = 'block';
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.settingsPage = new SettingsPage();
  });
} else {
  window.settingsPage = new SettingsPage();
}
