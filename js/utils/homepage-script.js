/**
 * ===================================================================
 * EDUNET19 - HOMEPAGE SCRIPT
 * JavaScript for Homepage Functionality and Interactions
 * ===================================================================
 */

'use strict';

/**
 * Homepage Application Class
 * Manages all homepage functionality and user interactions
 */
class EduNetHomepage {
  constructor() {
    this.isInitialized = false;
    this.currentUser = null;
    this.userProfile = null;
    this.feedData = [];
    this.currentFeedType = 'all';
    this.currentPage = 1;
    this.isLoading = false;
    this.hasMoreContent = true;

    // Filter state
    this.activeFilters = null;

    // DOM elements cache
    this.elements = {};

    // Event listeners cache
    this.eventListeners = new Map();

    // Intersection observer for infinite scroll
    this.intersectionObserver = null;

    // Search debounce timer
    this.searchTimer = null;

    // Bind methods
    this.handleResize = this.handleResize.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleClick = this.handleClick.bind(this);

    this.init();
  }

  /**
   * Initialize the homepage application
   */
  async init() {
    try {
      console.log('🏠 EduNet19 Homepage - Initializing...');

      // Wait for DOM and auth system
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.handleDOMReady());
      } else {
        await this.handleDOMReady();
      }

    } catch (error) {
      console.error('❌ Failed to initialize homepage:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Handle DOM ready event
   */
  async handleDOMReady() {
    try {
      console.log('🏠 EduNet19 Homepage - DOM Ready, starting initialization...');

      // Cache DOM elements
      this.cacheElements();

      // Setup event listeners
      this.setupEventListeners();

      // Wait for auth system with better error handling
      try {
        await this.waitForAuthSystem();
      } catch (error) {
        console.error('Auth system failed to initialize:', error);
        return; // Stop initialization if auth system fails
      }

      // Check authentication
      await this.checkAuthentication();

      // Initialize UI components
      this.initializeUI();

      // Load initial data
      await this.loadInitialData();

      // Check if we need to scroll to a specific post
      this.checkScrollToPost();

      // Hide loading screen
      this.hideLoadingScreen();

      this.isInitialized = true;
      console.log('✅ EduNet19 Homepage - Initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize homepage DOM:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * Cache frequently used DOM elements
   */
  cacheElements() {
    this.elements = {
      // Loading
      loadingScreen: document.getElementById('loading-screen'),

      // Navigation
      searchInput: document.getElementById('global-search'),
      searchResults: document.getElementById('search-results'),
      searchClear: document.querySelector('.search-clear'),
      notificationsBtn: document.getElementById('notifications-btn'),
      messagesBtn: document.getElementById('messages-btn'),
      userMenuBtn: document.getElementById('user-menu-btn'),
      mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
      mobileMenuOverlay: document.getElementById('mobile-menu-overlay'),
      mobileMenuClose: document.getElementById('mobile-menu-close'),
      logoutBtn: document.getElementById('logout-btn'),

      // User info
      userAvatar: document.getElementById('user-avatar'),
      userName: document.getElementById('user-name'),
      userFullName: document.getElementById('user-full-name'),
      userTypeDisplay: document.getElementById('user-type-display'),

      // Mobile user info
      mobileUserName: document.getElementById('mobile-user-name'),
      mobileUserType: document.getElementById('mobile-user-type'),
      mobileUserAvatar: document.getElementById('mobile-user-avatar'),

      // Feed
      feedTabs: document.querySelectorAll('.feed-tab'),
      contentFilter: document.getElementById('content-filter'),
      instituteTypeFilter: document.getElementById('institute-type-filter'),
      dateFilter: document.getElementById('date-filter'),
      sortFilter: document.getElementById('sort-filter'),
      engagementFilter: document.getElementById('engagement-filter'),
      createPostSection: document.getElementById('create-post-section'),
      createPostTrigger: document.getElementById('create-post-trigger'),
      feedContent: document.getElementById('feed-content'),
      feedLoading: document.getElementById('feed-loading'),
      feedEmpty: document.getElementById('feed-empty'),
      loadMoreBtn: document.getElementById('load-more-btn'),

      // Smart Filters
      filterChips: document.querySelectorAll('.filter-chip'),
      advancedFiltersToggle: document.getElementById('advanced-filters-toggle'),
      advancedFiltersPanel: document.getElementById('advanced-filters-panel'),
      resetFiltersBtn: document.getElementById('reset-filters'),
      applyFiltersBtn: document.getElementById('apply-filters'),

      // Sidebar
      favoritesList: document.getElementById('favorites-list'),
      recentActivity: document.getElementById('recent-activity'),
      trendingTopics: document.getElementById('trending-topics'),
      suggestedInstitutes: document.getElementById('suggested-institutes'),

      // Statistics (for institutes)
      instituteStats: document.getElementById('institute-stats'),
      postsCount: document.getElementById('posts-count'),
      followersCount: document.getElementById('followers-count'),
      viewsCount: document.getElementById('views-count'),
      ratingAverage: document.getElementById('rating-average'),

      // Mobile navigation
      mobileNavItems: document.querySelectorAll('.mobile-nav-item'),

      // Mobile menu items
      mobileMenuItems: document.querySelectorAll('.mobile-menu-item'),
      mobileCreatePost: document.getElementById('mobile-create-post'),
      mobileCreateProject: document.getElementById('mobile-create-project'),
      mobileLogout: document.getElementById('mobile-logout'),

      // Dropdowns
      dropdowns: document.querySelectorAll('.dropdown'),

      // Modals
      createPostModal: document.getElementById('createPostModal')
    };
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Global events
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('scroll', this.handleScroll);
    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('click', this.handleClick);

    // Search functionality
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });

      this.elements.searchInput.addEventListener('focus', () => {
        this.showSearchResults();
      });
    }

    if (this.elements.searchClear) {
      this.elements.searchClear.addEventListener('click', () => {
        this.clearSearch();
      });
    }

    // Navigation dropdowns
    this.setupDropdowns();

    // Feed tabs
    this.elements.feedTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchFeedTab(tab.dataset.feed);
      });
    });

    // Feed filters
    if (this.elements.contentFilter) {
      this.elements.contentFilter.addEventListener('change', () => {
        this.applyFilters();
      });
    }

    if (this.elements.instituteTypeFilter) {
      this.elements.instituteTypeFilter.addEventListener('change', () => {
        this.applyFilters();
      });
    }

    if (this.elements.dateFilter) {
      this.elements.dateFilter.addEventListener('change', () => {
        this.applyFilters();
      });
    }

    if (this.elements.sortFilter) {
      this.elements.sortFilter.addEventListener('change', () => {
        this.applyFilters();
      });
    }

    if (this.elements.engagementFilter) {
      this.elements.engagementFilter.addEventListener('change', () => {
        this.applyFilters();
      });
    }

    // Smart filter chips
    this.elements.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.handleFilterChipClick(chip);
      });
    });

    // Advanced filters toggle
    if (this.elements.advancedFiltersToggle) {
      this.elements.advancedFiltersToggle.addEventListener('click', () => {
        this.toggleAdvancedFilters();
      });
    }

    // Filter action buttons
    if (this.elements.resetFiltersBtn) {
      this.elements.resetFiltersBtn.addEventListener('click', () => {
        this.resetFilters();
      });
    }

    if (this.elements.applyFiltersBtn) {
      this.elements.applyFiltersBtn.addEventListener('click', () => {
        this.applyFilters();
      });
    }

    // Create post trigger
    if (this.elements.createPostTrigger) {
      this.elements.createPostTrigger.addEventListener('click', () => {
        console.log('📝 Create post trigger clicked');
        this.handlePostActionClick('text');
      });
    }

    // Mobile create button - ora è un link a create.html, non serve listener
    // Il pulsante naviga direttamente alla pagina create.html

    // Load more
    if (this.elements.loadMoreBtn) {
      this.elements.loadMoreBtn.addEventListener('click', () => {
        this.loadMoreContent();
      });
    }

    // Mobile menu
    if (this.elements.mobileMenuToggle) {
      this.elements.mobileMenuToggle.addEventListener('click', () => {
        this.toggleMobileMenu();
      });
    }

    // Mobile menu close button
    if (this.elements.mobileMenuClose) {
      this.elements.mobileMenuClose.addEventListener('click', () => {
        this.toggleMobileMenu();
      });
    }

    // Mobile menu overlay close
    if (this.elements.mobileMenuOverlay) {
      this.elements.mobileMenuOverlay.addEventListener('click', (e) => {
        if (e.target === this.elements.mobileMenuOverlay) {
          this.toggleMobileMenu();
        }
      });
    }

    // Mobile menu items
    if (this.elements.mobileMenuItems) {
      this.elements.mobileMenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
          const section = item.dataset.section;
          if (section) {
            this.switchSection(section);
            this.toggleMobileMenu(); // Close menu after selection
          }
        });
      });
    }

    // Mobile bottom nav items
    if (this.elements.mobileNavItems) {
      this.elements.mobileNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
          // Non intercettare il click sui link esterni (Crea, Profilo)
          if (item.classList.contains('create-btn') || item.dataset.section === 'profile') {
            return; // Lascia che il link funzioni normalmente
          }

          e.preventDefault();
          const section = item.dataset.section;
          if (section) {
            this.switchSection(section);
          }
        });
      });
    }

    // Sidebar nav items
    const sidebarNavLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    sidebarNavLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        if (section) {
          this.switchSection(section);
        }
      });
    });

    // Mobile create buttons
    if (this.elements.mobileCreatePost) {
      this.elements.mobileCreatePost.addEventListener('click', () => {
        this.openCreatePostModal('post');
        this.toggleMobileMenu();
      });
    }

    if (this.elements.mobileCreateProject) {
      this.elements.mobileCreateProject.addEventListener('click', () => {
        this.openCreatePostModal('project');
        this.toggleMobileMenu();
      });
    }

    // Mobile logout
    if (this.elements.mobileLogout) {
      this.elements.mobileLogout.addEventListener('click', () => {
        this.handleLogout();
      });
    }

    // Logout
    if (this.elements.logoutBtn) {
      this.elements.logoutBtn.addEventListener('click', () => {
        this.handleLogout();
      });
    }

    // Setup infinite scroll
    this.setupInfiniteScroll();
  }

  /**
   * Setup dropdown functionality
   */
  setupDropdowns() {
    const dropdownTriggers = document.querySelectorAll('.nav-item');

    dropdownTriggers.forEach(trigger => {
      const button = trigger.querySelector('.nav-button');
      if (button) {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleDropdown(trigger);
        });
      }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
      this.closeAllDropdowns();
    });
  }

  /**
   * Setup infinite scroll
   */
  setupInfiniteScroll() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && this.hasMoreContent && !this.isLoading) {
            this.loadMoreContent();
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '100px'
      });
    }
  }

  /**
   * Wait for authentication system to be available
   */
  async waitForAuthSystem() {
    const maxWaitTime = 10000; // 10 seconds
    const checkInterval = 100; // 100ms
    let waitTime = 0;

    return new Promise((resolve, reject) => {
      const checkAuth = () => {
        if (window.eduNetAuth && window.eduNetAuth.isInitialized) {
          console.log('Auth system available and initialized');
          resolve();
        } else if (waitTime >= maxWaitTime) {
          console.error('Auth system not available after waiting, redirecting to login');
          reject(new Error('Auth system timeout'));
          window.location.href = window.AppConfig.getPageUrl('index.html');
        } else {
          console.log(`Waiting for auth system... (${waitTime}ms/${maxWaitTime}ms)`);
          waitTime += checkInterval;
          setTimeout(checkAuth, checkInterval);
        }
      };

      checkAuth();
    });
  }

  /**
   * Check user authentication
   */
  async checkAuthentication() {
    console.log('🔐 Controllo autenticazione...');

    if (!window.eduNetAuth || !window.eduNetAuth.isAuthenticated()) {
      console.log('❌ Utente non autenticato, reindirizzamento al login');
      // Assicurati che non ci siano sessioni fantasma
      if (window.eduNetAuth && window.eduNetAuth.supabase) {
        await window.eduNetAuth.supabase.auth.signOut();
      }
      window.location.href = window.AppConfig.getPageUrl('index.html');
      return;
    }

    this.currentUser = window.eduNetAuth.getCurrentUser();
    this.userProfile = window.eduNetAuth.getUserProfile();

    console.log('👤 Utente corrente:', this.currentUser);
    console.log('📋 Profilo utente:', this.userProfile);

    // Se il profilo non è ancora disponibile, aspetta un po' e riprova
    if (!this.currentUser || !this.userProfile) {
      console.log('⏳ Profilo utente non ancora disponibile, attesa in corso...');

      // Aspetta fino a 3 secondi per il caricamento del profilo (ridotto da 5)
      let attempts = 0;
      const maxAttempts = 30; // 3 secondi con intervalli di 100ms

      while ((!this.currentUser || !this.userProfile) && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        this.currentUser = window.eduNetAuth.getCurrentUser();
        this.userProfile = window.eduNetAuth.getUserProfile();
        attempts++;

        if (attempts % 10 === 0) {
          console.log(`⏳ Tentativo ${attempts}/${maxAttempts} - Utente: ${!!this.currentUser}, Profilo: ${!!this.userProfile}`);
        }
      }

      // Se ancora non disponibile dopo l'attesa, logout e reindirizza
      if (!this.currentUser || !this.userProfile) {
        console.error('❌ Profilo utente non disponibile dopo l\'attesa. Possibile account incompleto.');

        // Mostra messaggio di errore chiaro
        this.showNotification(
          'Impossibile caricare il profilo utente. Effettua nuovamente l\'accesso o contatta l\'assistenza.',
          'error'
        );

        // Logout completo per evitare loop
        if (window.eduNetAuth && window.eduNetAuth.supabase) {
          await window.eduNetAuth.supabase.auth.signOut();
        }

        // Attendi un momento per mostrare il messaggio, poi reindirizza
        setTimeout(() => {
          window.location.href = window.AppConfig.getPageUrl('index.html');
        }, 2000);
        return;
      }
    }

    console.log('✅ Utente autenticato:', this.currentUser.email);
    console.log('✅ Profilo caricato:', this.userProfile);

    // Mostra avviso per istituti non verificati
    this.checkInstituteVerification();
  }

  /**
   * Controlla lo stato di verifica dell'istituto e mostra avviso se necessario
   */
  checkInstituteVerification() {
    const userType = this.userProfile?.user_type;

    if (userType !== 'istituto') return;

    const verificationStatus = this.userProfile?.verification_status;
    const isVerified = verificationStatus === 'verified' || this.userProfile?.verified === true;

    if (!isVerified) {
      console.log('⚠️ Istituto non verificato, mostro banner avviso');
      this.showVerificationWarningBanner(verificationStatus);
    }
  }

  /**
   * Mostra banner di avviso per istituti non verificati
   */
  showVerificationWarningBanner(status) {
    // Rimuovi banner esistente se presente
    const existingBanner = document.getElementById('verification-warning-banner');
    if (existingBanner) existingBanner.remove();

    const isPending = status === 'pending_verification' || status === 'verification_sent';

    const banner = document.createElement('div');
    banner.id = 'verification-warning-banner';
    banner.className = 'verification-warning-banner';
    banner.innerHTML = `
      <div class="banner-content">
        <i class="fas ${isPending ? 'fa-clock' : 'fa-exclamation-triangle'}"></i>
        <div class="banner-text">
          <strong>${isPending ? 'Verifica in corso' : 'Istituto non verificato'}</strong>
          <p>${isPending
        ? 'Abbiamo inviato una richiesta di verifica all\'email ufficiale MIUR. Controlla la casella di posta dell\'istituto.'
        : 'Il tuo istituto non è ancora verificato. Alcune funzionalità potrebbero essere limitate.'
      }</p>
        </div>
        <button class="banner-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Inserisci dopo la navbar
    const mainContent = document.querySelector('.main-content') || document.querySelector('main');
    if (mainContent) {
      mainContent.insertBefore(banner, mainContent.firstChild);
    }
  }

  /**
   * Initialize UI components
   */
  initializeUI() {
    // Update user info in navigation
    this.updateUserInfo();

    // Show/hide elements based on user type
    this.setupUserTypeSpecificUI();

    // Initialize sidebar content
    this.initializeSidebar();

    // Setup responsive behavior
    this.handleResize();
  }

  /**
   * Update user information in the UI
   */
  updateUserInfo() {
    if (!this.currentUser || !this.userProfile) return;

    console.log('🔍 [updateUserInfo] userProfile:', this.userProfile);
    console.log('🔍 [updateUserInfo] institute_name:', this.userProfile.institute_name);
    console.log('🔍 [updateUserInfo] instituteData:', this.userProfile.instituteData);

    const displayName = this.getDisplayName();
    const userType = this.getUserTypeDisplay();

    console.log('🔍 [updateUserInfo] displayName:', displayName);
    console.log('🔍 [updateUserInfo] userType:', userType);

    // Update navigation elements
    if (this.elements.userName) {
      this.elements.userName.textContent = displayName;
    }

    if (this.elements.userFullName) {
      this.elements.userFullName.textContent = displayName;
    }

    if (this.elements.userTypeDisplay) {
      this.elements.userTypeDisplay.textContent = userType;
    }

    // Update avatar if available
    if (window.avatarManager) {
      window.avatarManager.loadCurrentUserAvatar();
    }

    // Show/hide manage admins link for institutes
    const manageAdminsLink = document.getElementById('manage-admins');
    if (manageAdminsLink && this.userProfile?.user_type === 'istituto') {
      manageAdminsLink.style.display = 'flex';
    }

    // Check if user is platform admin/moderator and show moderation center link
    this.checkAdminRole();
  }

  /**
   * Check if current user has admin/moderator role
   */
  async checkAdminRole() {
    try {
      const supabase = await window.supabaseClientManager?.getClient();
      if (!supabase || !this.currentUser) return;

      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', this.currentUser.id)
        .maybeSingle();

      // Ignora errori (tabella potrebbe non esistere o RLS)
      if (error) {
        // Silently ignore - user is not admin or table doesn't exist
        return;
      }

      if (adminData) {
        const moderationLink = document.getElementById('moderation-center');
        if (moderationLink) {
          moderationLink.style.display = 'flex';
        }
        console.log('✅ User is admin/moderator:', adminData.role);
      }
    } catch (error) {
      // User is not an admin, that's fine - silently ignore
    }
  }

  /**
   * Get display name for current user
   */
  getDisplayName() {
    if (!this.userProfile) return 'Utente';

    // Se è un collaboratore, mostra il suo nome
    if (this.userProfile.is_collaborator && this.userProfile.collaborator_data) {
      const firstName = this.userProfile.first_name || this.userProfile.collaborator_data.first_name || '';
      const lastName = this.userProfile.last_name || this.userProfile.collaborator_data.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || 'Collaboratore';
    }

    if (this.userProfile.user_type === 'istituto') {
      // Prova prima institute_name diretto, poi da instituteData
      return this.userProfile.institute_name ||
        this.userProfile.instituteData?.institute_name ||
        'Istituto';
    } else {
      const firstName = this.userProfile.first_name || '';
      const lastName = this.userProfile.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();

      // Usa "Utente" come fallback invece dell'email
      return fullName || 'Utente';
    }
  }

  /**
   * Get user type display text
   */
  getUserTypeDisplay() {
    if (!this.userProfile) return 'Utente';

    // Se è un collaboratore, mostra il ruolo e l'istituto
    if (this.userProfile.is_collaborator && this.userProfile.collaborator_data) {
      const roleLabels = {
        'admin': 'Amministratore',
        'editor': 'Editor',
        'viewer': 'Visualizzatore'
      };
      const role = roleLabels[this.userProfile.collaborator_role] || 'Collaboratore';
      const instituteName = this.userProfile.collaborator_data.institute_name || '';
      return instituteName ? `${role} - ${instituteName}` : role;
    }

    if (this.userProfile.user_type === 'istituto') {
      const type = this.userProfile.institute_type || this.userProfile.instituteData?.institute_type;
      return (type && type !== 'Altro') ? type : 'Istituto Scolastico';
    } else {
      return 'Utente Privato';
    }
  }

  /**
   * Setup UI elements specific to user type
   */
  setupUserTypeSpecificUI() {
    const isInstitute = this.userProfile?.user_type === 'istituto';

    // I collaboratori admin/editor possono gestire l'istituto
    const canManageInstitute = isInstitute || this.userProfile?.can_manage_institute;

    // Show/hide create post section for institutes and collaborators with edit rights
    if (this.elements.createPostSection) {
      this.elements.createPostSection.style.display = canManageInstitute ? 'block' : 'none';
    }

    // Show/hide statistics for institutes
    if (this.elements.instituteStats) {
      this.elements.instituteStats.style.display = canManageInstitute ? 'block' : 'none';
    }

    // Update quick actions based on user type
    this.updateQuickActions(canManageInstitute);
  }

  /**
   * Update quick actions based on user type
   */
  updateQuickActions(isInstitute) {
    const quickActions = document.querySelector('.quick-actions');
    if (!quickActions) return;

    if (isInstitute) {
      // Institute users can create posts and projects
      quickActions.innerHTML = `
        <button class="quick-action-btn" id="create-post-btn">
          <i class="fas fa-plus" aria-hidden="true"></i>
          <span>Nuovo Post</span>
        </button>
        <button class="quick-action-btn" id="create-project-btn">
          <i class="fas fa-lightbulb" aria-hidden="true"></i>
          <span>Nuovo Progetto</span>
        </button>
      `;
    } else {
      // Private users have limited actions
      quickActions.innerHTML = `
        <button class="quick-action-btn" id="discover-institutes">
          <i class="fas fa-compass" aria-hidden="true"></i>
          <span>Scopri Istituti</span>
        </button>
      `;
    }

    // Re-attach event listeners
    this.attachQuickActionListeners();
  }

  /**
   * Attach event listeners to quick action buttons
   */
  attachQuickActionListeners() {
    const createPostBtn = document.getElementById('create-post-btn');
    const createProjectBtn = document.getElementById('create-project-btn');
    const discoverBtn = document.getElementById('discover-institutes');

    if (createPostBtn) {
      createPostBtn.addEventListener('click', () => {
        if (window.eduNetSocial) {
          window.eduNetSocial.showCreatePostModal('post');
        }
      });
    }

    if (createProjectBtn) {
      createProjectBtn.addEventListener('click', () => {
        if (window.eduNetSocial) {
          window.eduNetSocial.showCreatePostModal('project');
        }
      });
    }

    if (discoverBtn) {
      discoverBtn.addEventListener('click', () => this.switchSection('explore'));
    }

    // Attach listeners to post action buttons (Testo, Foto, Progetto, Metodologia)
    const postActionBtns = document.querySelectorAll('.post-action-btn');
    postActionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        this.handlePostActionClick(type);
      });
    });

    // Aggiungi event listeners per i link della sidebar
    this.attachSidebarListeners();
  }

  /**
   * Handle post action button clicks
   */
  handlePostActionClick(type) {
    console.log('📝 handlePostActionClick called with type:', type);

    // Verifica che l'utente possa creare contenuti (istituto o collaboratore)
    const canCreate = this.userProfile?.user_type === 'istituto' || this.userProfile?.can_manage_institute;

    if (!canCreate) {
      this.showNotification('Solo gli istituti e i loro collaboratori possono creare contenuti', 'warning');
      return;
    }

    if (!window.eduNetSocial) {
      console.warn('⚠️ eduNetSocial non disponibile, attendo...');
      // Prova ad aspettare un po' e riprova
      setTimeout(() => {
        if (window.eduNetSocial) {
          this.openCreateModal(type);
        } else {
          // Fallback: reindirizza alla pagina crea
          const createPage = `pages/main/create.html?type=${encodeURIComponent(type)}`;
          const createUrl = window.AppConfig && typeof window.AppConfig.getPageUrl === 'function'
            ? window.AppConfig.getPageUrl(createPage)
            : createPage;
          window.location.href = createUrl;
        }
      }, 500);
      return;
    }

    this.openCreateModal(type);
  }

  /**
   * Open create modal for specific type
   */
  openCreateModal(type) {
    console.log('📝 Opening create modal for type:', type);

    // Verifica che eduNetSocial sia disponibile
    if (!window.eduNetSocial) {
      console.error('❌ eduNetSocial non disponibile');
      this.showNotification('Sistema di pubblicazione non disponibile. Ricarica la pagina.', 'error');
      return;
    }

    switch (type) {
      case 'text':
        // Apri modal per creare un post di testo
        console.log('📝 Calling showCreatePostModal for post');
        window.eduNetSocial.showCreatePostModal('post');
        break;
      case 'image':
        // Apri modal per creare un post con immagine
        this.showNotification('Funzionalità foto in arrivo!', 'info');
        // TODO: Implementare upload immagini
        break;
      case 'project':
        // Apri modal per creare un progetto
        console.log('📝 Calling showCreatePostModal for project');
        window.eduNetSocial.showCreatePostModal('project');
        break;
      case 'methodology':
        // Apri modal per creare una metodologia
        console.log('📝 Calling showCreatePostModal for methodology');
        window.eduNetSocial.showCreatePostModal('methodology');
        break;
      default:
        console.warn('Tipo di post non riconosciuto:', type);
    }
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${this.getNotificationIcon(type)}" aria-hidden="true"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close">
        <i class="fas fa-times" aria-hidden="true"></i>
      </button>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.remove();
    });

    // Animate in
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type) {
    const icons = {
      info: 'info-circle',
      success: 'check-circle',
      warning: 'exclamation-triangle',
      error: 'times-circle'
    };
    return icons[type] || 'info-circle';
  }

  /**
   * Attach event listeners to sidebar elements
   */
  attachSidebarListeners() {
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        if (section) {
          this.switchSection(section);
          this.updateActiveNavLink(link);
        }
      });
    });

    // Quick links
    const quickLinks = document.querySelectorAll('.quick-link');
    quickLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href && href !== '#') {
          window.open(href, '_blank');
        }
      });
    });

    // Discover institutes button
    const discoverInstitutesBtns = document.querySelectorAll('#discover-institutes');
    discoverInstitutesBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchSection('explore');
      });
    });
  }

  /**
   * Update active navigation link
   */
  updateActiveNavLink(activeLink) {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    // Add active class to clicked link
    activeLink.classList.add('active');

    // Update mobile nav as well
    const section = activeLink.dataset.section;
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });
  }

  /**
   * Initialize sidebar content
   */
  initializeSidebar() {
    // Load favorites
    this.loadFavorites();

    // Load recent activity
    this.loadRecentActivity();

    // Load trending topics
    this.loadTrendingTopics();

    // Load suggested institutes
    this.loadSuggestedInstitutes();

    // Load statistics for institutes
    if (this.userProfile?.user_type === 'istituto') {
      this.loadInstituteStatistics();
    }
  }

  /**
   * Load initial data for the homepage
   */
  async loadInitialData() {
    try {
      // Reset pagination
      this.currentPage = 1;
      this.hasMoreContent = true;
      this.feedData = [];

      // Show loading state
      this.showFeedLoading();

      // Load tab counts from database
      await this.loadTabCounts();

      // Load feed content
      await this.loadFeedContent();

    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showFeedError('Errore nel caricamento dei contenuti');
    }
  }

  /**
   * Load dynamic counts for feed tabs from database
   */
  async loadTabCounts() {
    try {
      const supabase = window.eduNetSocial?.supabase || await window.supabaseClientManager?.getClient();
      if (!supabase) {
        console.warn('⚠️ Supabase client not available for tab counts');
        return;
      }

      // Get current user for following count
      const { data: { user } } = await supabase.auth.getUser();

      // Parallel queries for all counts
      const [allPostsResult, projectsResult, methodologiesResult, followingResult] = await Promise.all([
        // Total published posts
        supabase
          .from('institute_posts')
          .select('id', { count: 'exact', head: true })
          .eq('published', true),

        // Projects count
        supabase
          .from('institute_posts')
          .select('id', { count: 'exact', head: true })
          .eq('published', true)
          .eq('post_type', 'project'),

        // Methodologies count
        supabase
          .from('institute_posts')
          .select('id', { count: 'exact', head: true })
          .eq('published', true)
          .eq('post_type', 'methodology'),

        // Following count (profiles the user follows)
        user ? supabase
          .from('user_connections')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', user.id)
          .eq('status', 'accepted') : Promise.resolve({ count: 0 })
      ]);

      // Update tab badges
      this.updateTabBadge('all', allPostsResult.count || 0);
      this.updateTabBadge('following', followingResult.count || 0);
      this.updateTabBadge('projects', projectsResult.count || 0);
      this.updateTabBadge('methodologies', methodologiesResult.count || 0);

      console.log('✅ Tab counts loaded:', {
        all: allPostsResult.count,
        following: followingResult.count,
        projects: projectsResult.count,
        methodologies: methodologiesResult.count
      });

    } catch (error) {
      console.error('❌ Error loading tab counts:', error);
      // Hide badges on error
      this.updateTabBadge('all', 0);
      this.updateTabBadge('following', 0);
      this.updateTabBadge('projects', 0);
      this.updateTabBadge('methodologies', 0);
    }
  }

  /**
   * Update a specific tab badge with count
   */
  updateTabBadge(tabId, count) {
    const badge = document.getElementById(`tab-count-${tabId}`);
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 999 ? '999+' : count;
        badge.style.display = '';
      } else {
        badge.textContent = '';
        badge.style.display = 'none';
      }
    }
  }

  /**
   * Load feed content
   */
  async loadFeedContent() {
    if (this.isLoading) return;

    this.isLoading = true;

    try {
      // Simulate API call - replace with actual Supabase queries
      const mockData = await this.fetchFeedData();

      if (this.currentPage === 1) {
        this.feedData = mockData;
        this.renderFeed();
      } else {
        this.feedData.push(...mockData);
        this.appendToFeed(mockData);
      }

      // Update pagination
      this.hasMoreContent = mockData.length === 10; // Assuming 10 items per page
      this.updateLoadMoreButton();

    } catch (error) {
      console.error('Error loading feed content:', error);
      this.showFeedError('Errore nel caricamento del feed');
    } finally {
      this.isLoading = false;
      this.hideFeedLoading();
    }
  }

  /**
   * Fetch feed data (mock implementation)
   */
  async fetchFeedData() {
    try {
      // First try to fetch real posts from database
      if (window.eduNetSocial && window.eduNetSocial.supabase) {
        console.log('Attempting to fetch posts from database...');

        try {
          // Se siamo nella tab "following", ottieni prima la lista dei seguiti
          let followedIds = [];
          if (this.currentFeedType === 'following') {
            const currentUser = window.eduNetAuth?.getCurrentUser();
            if (currentUser) {
              const { data: connections, error: connError } = await window.eduNetSocial.supabase
                .from('user_connections')
                .select('followed_id')
                .eq('follower_id', currentUser.id)
                .eq('status', 'accepted');

              if (connError) {
                console.warn('Error fetching connections:', connError);
              } else if (connections && connections.length > 0) {
                followedIds = connections.map(c => c.followed_id);
                console.log(`User follows ${followedIds.length} profiles`);
              } else {
                // Nessun seguito - ritorna array vuoto per mostrare empty state
                console.log('User is not following anyone');
                return [];
              }
            }
          }

          // Query from institute_posts (tabella principale)
          // Include tutti i campi necessari per il rendering completo dei post
          let query = window.eduNetSocial.supabase
            .from('institute_posts')
            .select('id, institute_id, title, content, post_type, category, tags, target_audience, subject_areas, attachments, image_url, image_urls, published, created_at, updated_at, likes_count, comments_count, views_count')
            .eq('published', true);

          // Se siamo nella tab "following", filtra solo i post dei seguiti
          if (this.currentFeedType === 'following' && followedIds.length > 0) {
            query = query.in('institute_id', followedIds);
          }

          // Se siamo nella tab "projects", filtra solo i progetti
          if (this.currentFeedType === 'projects') {
            query = query.eq('post_type', 'project');
          }

          // Se siamo nella tab "methodologies", filtra solo le metodologie
          if (this.currentFeedType === 'methodologies') {
            query = query.eq('post_type', 'methodology');
          }

          const { data: posts, error } = await query
            .order('created_at', { ascending: false })
            .range((this.currentPage - 1) * 10, this.currentPage * 10 - 1);

          if (error) {
            // Handle table not found error gracefully without stack trace
            if (error.code === 'PGRST205' || error.code === 'PGRST116' || error.message.includes('404') || error.message.includes('Could not find the table')) {
              console.log('Posts table not found, using mock data');
              throw new Error('TABLE_NOT_FOUND'); // Custom error to avoid stack trace
            } else {
              throw error;
            }
          } else if (posts && posts.length > 0) {
            console.log(`Fetched ${posts.length} real posts from database`);

            // Mappa i campi di institute_posts per compatibilità frontend
            const normalizedPosts = posts.map(post => ({
              ...post,
              author_id: post.institute_id, // Mappa institute_id -> author_id
              is_published: post.published  // Mappa published -> is_published
            }));

            // Get current user ID for likes check
            const currentUser = window.eduNetAuth?.getCurrentUser();
            const currentUserId = currentUser?.id;

            // Get user's likes if logged in
            let userLikes = new Set();
            if (currentUserId) {
              try {
                const { data: likes } = await window.eduNetSocial.supabase
                  .from('post_likes')
                  .select('post_id')
                  .eq('user_id', currentUserId);

                if (likes) {
                  userLikes = new Set(likes.map(l => l.post_id));
                }
              } catch (error) {
                console.warn('Could not fetch user likes:', error);
              }
            }

            // Get real-time like counts for all posts
            const postIds = normalizedPosts.map(p => p.id);
            let likeCounts = {};
            try {
              const { data: allLikes } = await window.eduNetSocial.supabase
                .from('post_likes')
                .select('post_id')
                .in('post_id', postIds);

              if (allLikes) {
                // Count likes per post
                allLikes.forEach(like => {
                  likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1;
                });
              }
            } catch (error) {
              console.warn('Could not fetch like counts:', error);
            }

            // Get author information separately to avoid complex joins
            const postsWithAuthors = await Promise.all(normalizedPosts.map(async (post) => {
              let authorName = 'Utente';

              try {
                // Try both tables in parallel and handle 406 errors gracefully
                const [instituteResult, userResult] = await Promise.allSettled([
                  window.eduNetSocial.supabase
                    .from('school_institutes')
                    .select('institute_name')
                    .eq('id', post.institute_id) // Usa institute_id direttamente
                    .maybeSingle(), // Use maybeSingle instead of single to avoid 406 errors
                  window.eduNetSocial.supabase
                    .from('private_users')
                    .select('first_name, last_name')
                    .eq('id', post.institute_id) // Usa institute_id direttamente
                    .maybeSingle() // Use maybeSingle instead of single to avoid 406 errors
                ]);

                if (instituteResult.status === 'fulfilled' && instituteResult.value.data) {
                  authorName = instituteResult.value.data.institute_name;
                } else if (userResult.status === 'fulfilled' && userResult.value.data) {
                  const user = userResult.value.data;
                  authorName = `${user.first_name} ${user.last_name}`;
                }
              } catch (error) {
                // Silently handle errors - authorName stays as 'Utente'
                console.warn('Could not fetch author for post:', post.id);
              }

              return {
                id: post.id,
                title: post.title,
                content: post.content,
                author: authorName,
                author_id: post.institute_id,
                created_at: new Date(post.created_at),
                likes: likeCounts[post.id] || 0, // ✅ Usa conteggio reale da post_likes
                comments: post.comments_count || 0,
                post_type: post.post_type,
                category: post.category,
                tags: post.tags || [],
                target_audience: post.target_audience,
                subject_areas: post.subject_areas || [],
                image_urls: post.image_urls || [], // ✅ FIX: Corretto da images_urls a image_urls
                image_url: post.image_url,
                isLikedByUser: userLikes.has(post.id) // ✅ Aggiungi flag per like utente
              };
            }));

            return postsWithAuthors;
          } else {
            console.log('No posts found in database');
            return []; // ❌ NO MORE MOCK DATA
          }
        } catch (dbError) {
          if (dbError.message === 'TABLE_NOT_FOUND') {
            console.log('Posts table not found');
            return []; // ❌ NO MORE MOCK DATA
          } else {
            console.log('Database connection issue');
            return []; // ❌ NO MORE MOCK DATA
          }
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      return []; // ❌ NO MORE MOCK DATA
    }

    // ❌ RIMOSSO: Niente più mock data, sempre post reali o empty state
    return [];
  }

  /**
   * Render the complete feed
   */
  renderFeed() {
    if (!this.elements.feedContent) return;

    if (this.feedData.length === 0) {
      this.showEmptyFeed();
      return;
    }

    this.elements.feedContent.innerHTML = '';

    // Check if we're using mock data
    const usingMockData = this.feedData.some(post =>
      typeof post.id === 'string' && post.id.startsWith('post_')
    );

    this.feedData.forEach(post => {
      const postElement = this.createPostElement(post, usingMockData);
      this.elements.feedContent.appendChild(postElement);
    });

    // Show info banner if using mock data
    if (usingMockData) {
      this.showMockDataBanner();
    }

    this.hideEmptyFeed();
    this.setupInfiniteScrollObserver();

    // Load real comment counts for all posts
    if (!usingMockData) {
      this.loadCommentCounts();
    }

    // ✅ Update saved posts indicators
    this.updateSavedPostsIndicators();
  }

  /**
   * Load real comment counts from database
   */
  async loadCommentCounts() {
    if (!window.supabaseClientManager) return;

    try {
      const supabase = await window.supabaseClientManager.getClient();
      if (!supabase) return;

      // Get all post IDs currently in feed
      const postIds = this.feedData.map(post => post.id);
      if (postIds.length === 0) return;

      // Query comment counts for all posts
      const { data: counts, error } = await supabase
        .from('post_comments')
        .select('post_id')
        .in('post_id', postIds)
        .is('parent_comment_id', null);

      if (error) {
        console.error('Error loading comment counts:', error);
        return;
      }

      // Count comments per post
      const commentCounts = {};
      counts.forEach(comment => {
        commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1;
      });

      // Update UI for each post
      Object.keys(commentCounts).forEach(postId => {
        const count = commentCounts[postId];
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
          const commentBtn = postElement.querySelector('.comment-btn span');
          if (commentBtn) {
            commentBtn.textContent = count;
          }
        }
      });

      console.log('Comment counts loaded:', commentCounts);

    } catch (error) {
      console.error('Error in loadCommentCounts:', error);
    }
  }

  /**
   * Append new posts to the feed
   */
  appendToFeed(posts) {
    if (!this.elements.feedContent) return;

    // Check if we're using mock data
    const usingMockData = posts.some(post =>
      typeof post.id === 'string' && post.id.startsWith('post_')
    );

    posts.forEach(post => {
      const postElement = this.createPostElement(post, usingMockData);
      this.elements.feedContent.appendChild(postElement);
    });

    // ✅ Controlla quali post sono salvati e mostra l'icona
    this.updateSavedPostsIndicators();
  }

  /**
   * Create a post element
   */
  createPostElement(post, isMock = false) {
    const article = document.createElement('article');
    article.className = 'post-card feed-post';
    article.dataset.postId = post.id;
    article.dataset.postType = post.post_type || 'notizia';
    article.dataset.createdAt = post.created_at || new Date().toISOString();
    article.dataset.isMock = isMock;

    const mockIndicator = isMock ? '<span class="mock-indicator">Demo</span>' : '';

    // ✅ Bookmark sempre visibile - Toggle save/unsave
    const bookmarkBtn = isMock
      ? ''
      : `<button class="bookmark-btn" 
                 data-post-id="${post.id}" 
                 aria-label="Salva post" 
                 title="Salva post">
           <i class="far fa-bookmark" aria-hidden="true"></i>
         </button>`;

    // Get type badge info
    const typeInfo = this.getPostTypeInfo(post.post_type);

    // Get specific content based on type
    const contentHtml = this.getPostContentByType(post);

    article.innerHTML = `
      <div class="post-header">
        <div class="post-author">
          <div class="author-avatar" data-user-id="${post.author_id || ''}">
            <i class="fas fa-school" aria-hidden="true"></i>
          </div>
          <div class="author-info">
            <h3 class="author-name">${post.author}</h3>
            <time class="post-time" datetime="${post.created_at.toISOString()}">
              ${this.formatTimeAgo(post.created_at)}
            </time>
          </div>
        </div>
        <span class="post-type-badge ${typeInfo.class}">
          <i class="${typeInfo.icon}"></i>
          ${typeInfo.label}
        </span>
        <div class="post-actions">
          ${mockIndicator}
          ${bookmarkBtn}
          <button class="post-menu-btn" aria-label="Menu post" data-post-id="${post.id}">
            <i class="fas fa-ellipsis-h" aria-hidden="true"></i>
          </button>
          ${this.createPostDropdownMenu(post, isMock)}
        </div>
      </div>
      
      ${contentHtml}
      
      <div class="post-footer">
        <div class="post-stats">
          <button class="stat-btn like-btn ${isMock ? 'disabled' : ''} ${post.isLikedByUser ? 'liked' : ''}" 
                  data-post-id="${post.id}" 
                  ${isMock ? 'disabled title="Funzionalità non disponibile in modalità demo"' : ''}>
            <i class="${post.isLikedByUser ? 'fas' : 'far'} fa-heart" aria-hidden="true" style="${post.isLikedByUser ? 'color: #e53e3e;' : ''}"></i>
            <span>${post.likes || 0}</span>
          </button>
          <button class="stat-btn comment-btn ${isMock ? 'disabled' : ''}" 
                  data-post-id="${post.id}"
                  ${isMock ? 'disabled title="Funzionalità non disponibile in modalità demo"' : ''}>
            <i class="far fa-comment" aria-hidden="true"></i>
            <span>${post.comments || 0}</span>
          </button>
          <button class="stat-btn share-btn ${isMock ? 'disabled' : ''}" 
                  data-post-id="${post.id}"
                  ${isMock ? 'disabled title="Funzionalità non disponibile in modalità demo"' : ''}>
            <i class="fas fa-share" aria-hidden="true"></i>
            <span>Condividi</span>
          </button>
        </div>
      </div>
      
      <div class="comments-section">
        <button class="comments-toggle ${isMock ? 'disabled' : ''}" 
                data-post-id="${post.id}"
                ${isMock ? 'disabled title="Funzionalità non disponibile in modalità demo"' : ''}>
          <i class="fas fa-chevron-down" aria-hidden="true"></i>
          ${isMock ? 'Commenti non disponibili in demo' : 'Mostra commenti'}
        </button>
        <div class="comments-container" id="comments-${post.id}">
          ${this.renderCommentForm(post.id, isMock)}
          <div class="comments-list-container"></div>
        </div>
      </div>
    `;

    // ✅ Carica avatar dell'autore immediatamente (senza setTimeout)
    if (window.avatarManager && post.author_id) {
      window.avatarManager.loadUserAvatar(post.author_id).then(avatarUrl => {
        if (avatarUrl) {
          const avatarEl = article.querySelector('.author-avatar');
          if (avatarEl) {
            avatarEl.style.backgroundImage = `url(${avatarUrl})`;
            avatarEl.style.backgroundSize = 'cover';
            avatarEl.style.backgroundPosition = 'center';
            const icon = avatarEl.querySelector('i');
            if (icon) icon.style.display = 'none';
          }
        }
      }).catch(err => {
        console.warn(`Could not load avatar for post ${post.id}:`, err);
      });
    }

    // Add event listeners only for real posts
    if (!isMock) {
      this.attachPostEventListeners(article, post);
    }

    // Initialize carousel if present
    const carousel = article.querySelector('.post-image-carousel');
    if (carousel) {
      this.initializeCarousel(carousel);
    }

    return article;
  }

  /**
   * Render comment form based on user type
   * 🔒 PRIVACY: Solo gli istituti possono commentare
   */
  renderCommentForm(postId, isMock = false) {
    // Verifica se l'utente è un istituto
    const isInstitute = this.userProfile?.user_type === 'istituto';

    if (isMock) {
      return `
        <div class="comment-form">
          <textarea class="comment-input" 
                    placeholder="Commenti non disponibili in modalità demo" 
                    rows="3" 
                    disabled></textarea>
          <button class="comment-submit disabled" 
                  data-post-id="${postId}"
                  disabled>
            <i class="fas fa-paper-plane" aria-hidden="true"></i>
            Commenta
          </button>
        </div>
      `;
    }

    if (!isInstitute) {
      // 🔒 Utenti privati: nasconde completamente il form commenti
      // Possono solo leggere i commenti, non scriverne
      return '';
    }

    // Istituti: mostra il form normale
    return `
      <div class="comment-form">
        <textarea class="comment-input" 
                  placeholder="Scrivi un commento..." 
                  rows="3"></textarea>
        <button class="comment-submit" 
                data-post-id="${postId}">
          <i class="fas fa-paper-plane" aria-hidden="true"></i>
          Commenta
        </button>
      </div>
    `;
  }

  /**
   * Initialize image carousel
   */
  initializeCarousel(carouselElement) {
    const track = carouselElement.querySelector('.carousel-track');
    const slides = Array.from(carouselElement.querySelectorAll('.carousel-slide'));
    const prevBtn = carouselElement.querySelector('.carousel-btn.prev');
    const nextBtn = carouselElement.querySelector('.carousel-btn.next');
    const dots = Array.from(carouselElement.querySelectorAll('.carousel-dot'));
    const counter = carouselElement.querySelector('.current-slide');

    let currentIndex = 0;
    const totalSlides = slides.length;

    const updateCarousel = () => {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      // Update counter
      if (counter) {
        counter.textContent = currentIndex + 1;
      }

      // Update dots
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
      });

      // Buttons are always enabled for infinite loop
      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;
    };

    // Previous button - Loop to last slide
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentIndex > 0) {
          currentIndex--;
        } else {
          currentIndex = totalSlides - 1; // Loop to last
        }
        updateCarousel();
      });
    }

    // Next button - Loop to first slide
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentIndex < totalSlides - 1) {
          currentIndex++;
        } else {
          currentIndex = 0; // Loop to first
        }
        updateCarousel();
      });
    }

    // Dots navigation
    dots.forEach((dot, index) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = index;
        updateCarousel();
      });
    });

    // Touch/swipe support
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
      track.classList.add('dragging');
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
      const diff = currentX - startX;
      track.style.transform = `translateX(calc(-${currentIndex * 100}% + ${diff}px))`;
    }, { passive: true });

    track.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove('dragging');

      const diff = currentX - startX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          currentIndex = currentIndex > 0 ? currentIndex - 1 : totalSlides - 1;
        } else {
          currentIndex = currentIndex < totalSlides - 1 ? currentIndex + 1 : 0;
        }
      }
      updateCarousel();
    }, { passive: true });

    // Keyboard navigation
    carouselElement.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      } else if (e.key === 'ArrowRight' && currentIndex < totalSlides - 1) {
        currentIndex++;
        updateCarousel();
      }
    });

    // Initial update
    updateCarousel();
  }

  /**
   * Create post dropdown menu HTML
   */
  createPostDropdownMenu(post, isMock) {
    const isOwner = post.author_id === this.currentUser?.id;

    return `
      <div class="post-dropdown-menu" data-post-id="${post.id}">
        <button class="post-dropdown-item" data-action="copy-link">
          <i class="fas fa-link"></i>
          <span>Copia link</span>
        </button>
        <button class="post-dropdown-item" data-action="share">
          <i class="fas fa-share-alt"></i>
          <span>Condividi</span>
        </button>
        <div class="post-dropdown-divider"></div>
        <button class="post-dropdown-item" data-action="mute-author">
          <i class="fas fa-volume-mute"></i>
          <span>Non seguire ${post.author}</span>
        </button>
        <button class="post-dropdown-item" data-action="hide-post">
          <i class="far fa-eye-slash"></i>
          <span>Nascondi post</span>
        </button>
        <button class="post-dropdown-item" data-action="report">
          <i class="fas fa-flag"></i>
          <span>Segnala contenuto</span>
        </button>
        ${isOwner && !isMock ? `
          <div class="post-dropdown-divider"></div>
          <button class="post-dropdown-item owner-only" data-action="edit">
            <i class="fas fa-edit"></i>
            <span>Modifica post</span>
          </button>
          <button class="post-dropdown-item owner-only danger" data-action="delete">
            <i class="fas fa-trash-alt"></i>
            <span>Elimina post</span>
          </button>
        ` : ''}
      </div>
    `;
  }

  /**
   * Get post type badge info
   */
  getPostTypeInfo(postType) {
    const types = {
      'post': {
        label: 'Post',
        icon: 'fas fa-align-left',
        class: 'badge-post'
      },
      'news': {
        label: 'News',
        icon: 'fas fa-newspaper',
        class: 'badge-news'
      },
      'project': {
        label: 'Progetto',
        icon: 'fas fa-lightbulb',
        class: 'badge-project'
      },
      'methodology': {
        label: 'Metodologia',
        icon: 'fas fa-book-open',
        class: 'badge-methodology'
      },
      'event': {
        label: 'Galleria',
        icon: 'fas fa-images',
        class: 'badge-gallery'
      },
      'collaboration': {
        label: 'Collaborazione',
        icon: 'fas fa-handshake',
        class: 'badge-collaboration'
      },
      'educational_experience': {
        label: 'Esperienza Educativa',
        icon: 'fas fa-graduation-cap',
        class: 'badge-educational'
      },
      // Legacy support (old Italian values)
      'notizia': {
        label: 'Post',
        icon: 'fas fa-align-left',
        class: 'badge-post'
      },
      'progetto': {
        label: 'Progetto',
        icon: 'fas fa-lightbulb',
        class: 'badge-project'
      },
      'metodologia': {
        label: 'Metodologia',
        icon: 'fas fa-book-open',
        class: 'badge-methodology'
      },
      'evento': {
        label: 'Galleria',
        icon: 'fas fa-images',
        class: 'badge-gallery'
      }
    };

    return types[postType] || types['post'];
  }

  /**
   * Get post content HTML by type
   */
  getPostContentByType(post) {
    const postType = post.post_type || 'post';

    switch (postType) {
      // New English values
      case 'project':
      case 'progetto': // Legacy support
        return this.renderProjectContent(post);
      case 'methodology':
      case 'metodologia': // Legacy support
        return this.renderMethodologyContent(post);
      case 'event':
      case 'evento': // Legacy support
        return this.renderGalleryContent(post);
      case 'collaboration':
        return this.renderCollaborationContent(post);
      case 'educational_experience':
        return this.renderEducationalExperienceContent(post);
      case 'post':
      case 'news':
      case 'notizia': // Legacy support
      default:
        return this.renderPostContent(post);
    }
  }

  /**
   * Render post content (Notizia/Esperienza)
   */
  renderPostContent(post) {
    return `
      <div class="post-content">
        <h2 class="post-title">${post.title}</h2>
        <p class="post-text">${post.content || ''}</p>
        
        ${post.tags && post.tags.length > 0 ? `
          <div class="post-tags">
            ${post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('')}
          </div>
        ` : ''}
        
        ${post.image_url ? `
          <div class="post-image-container">
            <img src="${post.image_url}" alt="${post.title || 'Post image'}">
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render project content
   */
  renderProjectContent(post) {
    // Get data from attachments (new format) or legacy fields
    const attachments = post.attachments || {};
    const category = attachments.category || post.category || '';
    const duration = attachments.duration || (post.target_audience && post.target_audience[0]) || '';
    const objectives = attachments.objectives || (post.subject_areas && post.subject_areas[0]) || '';
    const resources = attachments.resources || '';

    return `
      <div class="post-content post-project">
        <h2 class="post-title">${post.title}</h2>
        
        ${category ? `
          <div class="project-meta-item">
            <i class="fas fa-folder"></i>
            <strong>Categoria:</strong> <span>${category}</span>
          </div>
        ` : ''}
        
        ${duration ? `
          <div class="project-meta-item">
            <i class="fas fa-clock"></i>
            <strong>Durata:</strong> <span>${duration}</span>
          </div>
        ` : ''}
        
        <div class="post-description">
          <p class="post-text">${post.content || ''}</p>
        </div>
        
        ${objectives ? `
          <div class="project-section">
            <div class="section-header">
              <i class="fas fa-bullseye"></i>
              <strong>Obiettivi Didattici</strong>
            </div>
            <p class="section-content">${objectives}</p>
          </div>
        ` : ''}
        
        ${resources ? `
          <div class="project-section">
            <div class="section-header">
              <i class="fas fa-tools"></i>
              <strong>Risorse Necessarie</strong>
            </div>
            <p class="section-content">${resources}</p>
          </div>
        ` : ''}
        
        ${post.tags && post.tags.length > 0 ? `
          <div class="post-tags">
            ${post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render methodology content
   */
  renderMethodologyContent(post) {
    // Get data from attachments (new format) or legacy fields
    const attachments = post.attachments || {};
    const methodologyType = attachments.methodology_type || post.category || '';
    const level = attachments.level || (post.target_audience && post.target_audience[0]) || '';
    const application = attachments.application || (post.subject_areas && post.subject_areas[0]) || '';
    const benefits = attachments.benefits || '';

    return `
      <div class="post-content post-methodology">
        <h2 class="post-title">${post.title}</h2>
        
        ${methodologyType ? `
          <div class="methodology-meta-item">
            <i class="fas fa-tag"></i>
            <strong>Tipo:</strong> <span>${methodologyType}</span>
          </div>
        ` : ''}
        
        ${level ? `
          <div class="methodology-meta-item">
            <i class="fas fa-graduation-cap"></i>
            <strong>Livello Scolastico:</strong> <span>${level}</span>
          </div>
        ` : ''}
        
        <div class="post-description">
          <p class="post-text">${post.content || ''}</p>
        </div>
        
        ${application ? `
          <div class="methodology-section">
            <div class="section-header">
              <i class="fas fa-chalkboard-teacher"></i>
              <strong>Modalità di Applicazione</strong>
            </div>
            <p class="section-content">${application}</p>
          </div>
        ` : ''}
        
        ${benefits ? `
          <div class="methodology-section">
            <div class="section-header">
              <i class="fas fa-star"></i>
              <strong>Benefici e Risultati</strong>
            </div>
            <p class="section-content">${benefits}</p>
          </div>
        ` : ''}
        
        ${post.tags && post.tags.length > 0 ? `
          <div class="post-tags">
            ${post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render gallery content
   */
  renderGalleryContent(post) {
    // Debug: verifica tipo di image_urls
    console.log('🖼️ Gallery Debug:', {
      title: post.title,
      image_urls: post.image_urls,
      type: typeof post.image_urls,
      isArray: Array.isArray(post.image_urls),
      length: post.image_urls?.length
    });

    return `
      <div class="post-content post-gallery">
        <h2 class="post-title">${post.title}</h2>
        <p class="post-text">${post.content || ''}</p>
        
        ${post.image_urls && post.image_urls.length > 1 ? `
          <div class="post-image-carousel" data-post-id="${post.id}">
            <div class="carousel-container">
              <div class="carousel-track">
                ${post.image_urls.map((img, index) => `
                  <div class="carousel-slide">
                    <img src="${img}" alt="Foto ${index + 1}" loading="lazy">
                  </div>
                `).join('')}
              </div>
              <button class="carousel-btn prev" aria-label="Immagine precedente">
                <i class="fas fa-chevron-left"></i>
              </button>
              <button class="carousel-btn next" aria-label="Immagine successiva">
                <i class="fas fa-chevron-right"></i>
              </button>
              <div class="carousel-counter">
                <span class="current-slide">1</span> / ${post.image_urls.length}
              </div>
              <div class="carousel-dots">
                ${post.image_urls.map((_, index) => `
                  <button class="carousel-dot ${index === 0 ? 'active' : ''}" data-slide="${index}" aria-label="Vai a foto ${index + 1}"></button>
                `).join('')}
              </div>
            </div>
          </div>
        ` : (post.image_urls && post.image_urls.length === 1) || post.image_url ? `
          <div class="post-single-image">
            <img src="${post.image_urls ? post.image_urls[0] : post.image_url}" alt="${post.title || 'Immagine'}" loading="lazy">
          </div>
        ` : ''}
        
        ${post.tags && post.tags.length > 0 ? `
          <div class="post-tags">
            ${post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render collaboration content
   */
  renderCollaborationContent(post) {
    // Get data from attachments (new format) or legacy fields
    const attachments = post.attachments || {};
    const collaborationType = attachments.collaboration_type || post.category || '';
    const duration = attachments.duration || '';
    const lookingFor = attachments.looking_for || (post.target_audience && post.target_audience[0]) || '';
    const benefits = attachments.benefits || (post.subject_areas && post.subject_areas[0]) || '';

    return `
      <div class="post-content post-collaboration">
        <h2 class="post-title">${post.title}</h2>
        
        ${collaborationType ? `
          <div class="collaboration-meta-item">
            <i class="fas fa-handshake"></i>
            <strong>Tipo:</strong> <span>${collaborationType}</span>
          </div>
        ` : ''}
        
        ${duration ? `
          <div class="collaboration-meta-item">
            <i class="fas fa-clock"></i>
            <strong>Durata Prevista:</strong> <span>${duration}</span>
          </div>
        ` : ''}
        
        <div class="post-description">
          <p class="post-text">${post.content || ''}</p>
        </div>
        
        ${lookingFor ? `
          <div class="collaboration-section">
            <div class="section-header">
              <i class="fas fa-search"></i>
              <strong>Cerchiamo</strong>
            </div>
            <p class="section-content">${lookingFor}</p>
          </div>
        ` : ''}
        
        ${benefits ? `
          <div class="collaboration-section">
            <div class="section-header">
              <i class="fas fa-gift"></i>
              <strong>Benefici Attesi</strong>
            </div>
            <p class="section-content">${benefits}</p>
          </div>
        ` : ''}
        
        ${post.image_url ? `
          <div class="post-image-container">
            <img src="${post.image_url}" alt="${post.title || 'Collaborazione'}">
          </div>
        ` : ''}
        
        ${post.tags && post.tags.length > 0 ? `
          <div class="post-tags">
            ${post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render educational experience content
   */
  renderEducationalExperienceContent(post) {
    // Get data from attachments (new format) or legacy fields
    const attachments = post.attachments || {};
    const experienceType = attachments.experience_type || post.category || '';
    const date = attachments.date || (post.target_audience && post.target_audience[0]) || '';
    const context = attachments.context || '';
    const learnings = attachments.learnings || (post.subject_areas && post.subject_areas[0]) || '';

    return `
      <div class="post-content post-educational">
        <h2 class="post-title">${post.title}</h2>
        
        ${experienceType ? `
          <div class="experience-meta-item">
            <i class="fas fa-bookmark"></i>
            <strong>Tipo:</strong> <span>${experienceType}</span>
          </div>
        ` : ''}
        
        ${date ? `
          <div class="experience-meta-item">
            <i class="fas fa-calendar-alt"></i>
            <strong>Data:</strong> <span>${date}</span>
          </div>
        ` : ''}
        
        ${context ? `
          <div class="experience-section">
            <div class="section-header">
              <i class="fas fa-info-circle"></i>
              <strong>Contesto</strong>
            </div>
            <p class="section-content">${context}</p>
          </div>
        ` : ''}
        
        <div class="post-description">
          <p class="post-text">${post.content || ''}</p>
        </div>
        
        ${learnings ? `
          <div class="experience-section">
            <div class="section-header">
              <i class="fas fa-lightbulb"></i>
              <strong>Lezioni Apprese</strong>
            </div>
            <p class="section-content">${learnings}</p>
          </div>
        ` : ''}
        
        ${post.image_url ? `
          <div class="post-image-container">
            <img src="${post.image_url}" alt="${post.title || 'Esperienza Educativa'}">
          </div>
        ` : ''}
        
        ${post.tags && post.tags.length > 0 ? `
          <div class="post-tags">
            ${post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Attach event listeners to post elements
   */
  attachPostEventListeners(postElement, postData) {
    const postId = postData.id;

    // ✅ Click su nome autore per vedere profilo
    const authorName = postElement.querySelector('.author-name');
    if (authorName && postData.author_id) {
      authorName.style.cursor = 'pointer';
      authorName.title = 'Visualizza profilo';
      authorName.addEventListener('click', (e) => {
        e.stopPropagation();
        this.navigateToProfile(postData.author_id);
      });
    }

    // Badge click - Filter by post type
    const badge = postElement.querySelector('.post-type-badge');
    if (badge) {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const postType = postData.post_type;
        if (postType) {
          this.filterByPostType(postType);
        }
      });
      // Add cursor pointer style
      badge.style.cursor = 'pointer';
      badge.title = 'Clicca per filtrare per questo tipo';
    }

    // Tag clicks - Search by tag
    const tags = postElement.querySelectorAll('.post-tag');
    tags.forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.stopPropagation();
        const tagText = tag.textContent.replace('#', '').trim();
        if (tagText) {
          this.searchByTag(tagText);
        }
      });
      tag.style.cursor = 'pointer';
      tag.title = 'Clicca per cercare questo tag';
    });

    // Bookmark button - Toggle save/unsave
    const bookmarkBtn = postElement.querySelector('.bookmark-btn');
    if (bookmarkBtn) {
      bookmarkBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.toggleBookmark(postId, bookmarkBtn);
      });
    }

    // Post menu button
    const menuBtn = postElement.querySelector('.post-menu-btn');
    const dropdown = postElement.querySelector('.post-dropdown-menu');

    if (menuBtn && dropdown) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePostMenu(dropdown);
      });

      // Menu items
      const menuItems = dropdown.querySelectorAll('.post-dropdown-item');
      menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = item.dataset.action;
          this.handlePostMenuAction(action, postData, postElement);
          this.closeAllPostMenus();
        });
      });
    }

    // Like button
    const likeBtn = postElement.querySelector('.like-btn');
    if (likeBtn) {
      likeBtn.addEventListener('click', () => {
        if (window.eduNetSocial) {
          window.eduNetSocial.toggleLike(postId, likeBtn);
        }
      });
    }

    // Comment button and toggle
    const commentBtn = postElement.querySelector('.comment-btn');
    const commentsToggle = postElement.querySelector('.comments-toggle');

    [commentBtn, commentsToggle].forEach(btn => {
      if (btn) {
        btn.addEventListener('click', () => {
          this.toggleComments(postId, postElement);
        });
      }
    });

    // Share button
    const shareBtn = postElement.querySelector('.share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const postTitle = postData.title;
        const postUrl = window.AppConfig.getPageUrl(`post/${postId}`);

        if (window.eduNetSocial) {
          window.eduNetSocial.showShareModal(postId, postTitle, postUrl);
        }
      });
    }

    // Comment submit button
    const commentSubmit = postElement.querySelector('.comment-submit');
    const commentInput = postElement.querySelector('.comment-input');

    if (commentSubmit && commentInput) {
      commentSubmit.addEventListener('click', () => {
        const content = commentInput.value.trim();
        if (content && window.eduNetSocial) {
          const commentsContainer = postElement.querySelector('.comments-list-container');
          window.eduNetSocial.addComment(postId, content, commentsContainer).then(() => {
            commentInput.value = '';
          });
        }
      });

      // Submit on Ctrl+Enter
      commentInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          commentSubmit.click();
        }
      });
    }
  }

  /**
   * Toggle comments visibility
   */
  toggleComments(postId, postElement) {
    const commentsContainer = postElement.querySelector('.comments-container');
    const commentsToggle = postElement.querySelector('.comments-toggle');
    const toggleIcon = commentsToggle.querySelector('i');
    const commentsListContainer = postElement.querySelector('.comments-list-container');

    if (commentsContainer.classList.contains('show')) {
      // Hide comments
      commentsContainer.classList.remove('show');
      toggleIcon.className = 'fas fa-chevron-down';
      commentsToggle.innerHTML = '<i class="fas fa-chevron-down" aria-hidden="true"></i> Mostra commenti';
    } else {
      // Show comments
      commentsContainer.classList.add('show');
      toggleIcon.className = 'fas fa-chevron-up';
      commentsToggle.innerHTML = '<i class="fas fa-chevron-up" aria-hidden="true"></i> Nascondi commenti';

      // Load comments if not already loaded
      if (commentsListContainer.innerHTML === '' && window.eduNetSocial) {
        window.eduNetSocial.showComments(postId, commentsListContainer);
      }
    }
  }

  /**
   * Format time ago
   */
  formatTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ora';
    if (minutes < 60) return `${minutes}m fa`;
    if (hours < 24) return `${hours}h fa`;
    if (days < 7) return `${days}g fa`;

    return date.toLocaleDateString('it-IT');
  }

  /**
   * Show feed loading state
   */
  showFeedLoading() {
    if (this.elements.feedLoading) {
      this.elements.feedLoading.style.display = 'block';
    }
  }

  /**
   * Hide feed loading state
   */
  hideFeedLoading() {
    if (this.elements.feedLoading) {
      this.elements.feedLoading.style.display = 'none';
    }
  }

  /**
   * Show empty feed state
   */
  showEmptyFeed() {
    if (!this.elements.feedContent) return;

    // Get empty state content based on current tab
    const emptyContent = this.getEmptyStateContent(this.currentFeedType);

    this.elements.feedContent.innerHTML = `
      <div class="feed-empty">
        <div class="empty-state-icon">
          <i class="${emptyContent.icon}" aria-hidden="true"></i>
        </div>
        <h3>${emptyContent.title}</h3>
        <p>${emptyContent.message}</p>
        ${emptyContent.action ? `
          <button class="btn btn-primary" onclick="${emptyContent.action.onclick}">
            <i class="${emptyContent.action.icon}" aria-hidden="true"></i>
            ${emptyContent.action.label}
          </button>
        ` : ''}
      </div>
    `;
  }

  /**
   * Get empty state content based on feed type
   */
  getEmptyStateContent(feedType) {
    const emptyStates = {
      'all': {
        icon: 'fas fa-newspaper',
        title: 'Nessun contenuto disponibile',
        message: 'Non ci sono ancora pubblicazioni sulla piattaforma. Torna più tardi per scoprire nuovi contenuti!',
        action: {
          icon: 'fas fa-compass',
          label: 'Scopri Istituti',
          onclick: "if(window.eduNetHomepage) window.eduNetHomepage.switchFeedTab('discover')"
        }
      },
      'following': {
        icon: 'fas fa-user-friends',
        title: 'Inizia a seguire qualcuno',
        message: 'Non stai ancora seguendo nessun profilo. Scopri istituti interessanti e inizia a seguirli per vedere i loro contenuti qui.',
        action: {
          icon: 'fas fa-compass',
          label: 'Scopri Istituti',
          onclick: "if(window.eduNetHomepage) window.eduNetHomepage.switchFeedTab('discover')"
        }
      },
      'projects': {
        icon: 'fas fa-rocket',
        title: 'Nessun progetto disponibile',
        message: 'Non ci sono ancora progetti didattici pubblicati. Gli istituti possono condividere i loro progetti qui.',
        action: null
      },
      'methodologies': {
        icon: 'fas fa-graduation-cap',
        title: 'Nessuna metodologia disponibile',
        message: 'Non ci sono ancora metodologie didattiche pubblicate. Gli istituti possono condividere le loro metodologie qui.',
        action: null
      },
      'discover': {
        icon: 'fas fa-compass',
        title: 'Esplora la piattaforma',
        message: 'Usa la sezione EduMatch qui sopra per trovare istituti con cui collaborare.',
        action: null
      }
    };

    return emptyStates[feedType] || emptyStates['all'];
  }

  /**
   * Hide empty feed state
   */
  hideEmptyFeed() {
    if (this.elements.feedEmpty) {
      this.elements.feedEmpty.style.display = 'none';
    }
  }

  /**
   * Show feed error
   */
  showFeedError(message) {
    if (this.elements.feedContent) {
      this.elements.feedContent.innerHTML = `
        <div class="feed-error">
          <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
          <h3>Errore di caricamento</h3>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="window.location.reload()">
            <i class="fas fa-refresh" aria-hidden="true"></i>
            Ricarica pagina
          </button>
        </div>
      `;
    }
  }

  /**
   * Show mock data banner
   */
  showMockDataBanner() {
    // Check if banner already exists
    if (document.getElementById('mock-data-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'mock-data-banner';
    banner.className = 'mock-data-banner';
    banner.innerHTML = `
      <div class="banner-content">
        <i class="fas fa-info-circle" aria-hidden="true"></i>
        <div class="banner-text">
          <strong>Modalità Demo - Database Non Configurato</strong>
          <p>Stai visualizzando dati di esempio. Per abilitare tutte le funzionalità, configura il database seguendo la guida in <code>setup-database.md</code></p>
        </div>
        <button class="banner-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>
    `;

    // Insert banner at the top of feed content
    if (this.elements.feedContent) {
      this.elements.feedContent.insertBefore(banner, this.elements.feedContent.firstChild);
    }
  }

  /**
   * Setup infinite scroll observer
   */
  setupInfiniteScrollObserver() {
    if (this.intersectionObserver && this.elements.loadMoreBtn) {
      this.intersectionObserver.observe(this.elements.loadMoreBtn);
    }
  }

  /**
   * Update load more button visibility
   */
  updateLoadMoreButton() {
    const loadMoreSection = document.getElementById('load-more-section');
    if (loadMoreSection) {
      loadMoreSection.style.display = this.hasMoreContent ? 'block' : 'none';
    }
  }

  /**
   * Load more content
   */
  async loadMoreContent() {
    if (this.isLoading || !this.hasMoreContent) return;

    this.currentPage++;
    await this.loadFeedContent();
  }

  /**
   * Switch feed tab
   */
  async switchFeedTab(feedType) {
    // Previeni switch multipli durante il caricamento
    if (this.isLoading && this.currentFeedType === feedType) return;

    this.currentFeedType = feedType;

    // Aggiungi classe loading al container per stabilità
    if (this.elements.feedContent) {
      this.elements.feedContent.classList.add('loading');
    }

    // Update active tab con transizione fluida
    this.elements.feedTabs.forEach(tab => {
      const isActive = tab.dataset.feed === feedType;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Sincronizza filter chips con la tab selezionata
    // projects e methodologies hanno chip corrispondenti, altri vanno su "all"
    const chipFilter = (feedType === 'projects' || feedType === 'methodologies') ? feedType : 'all';
    this.elements.filterChips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.filter === chipFilter);
    });

    // Reset advanced filters
    this.resetAdvancedFilters(false);

    // Reload content
    await this.loadInitialData();

    // Rimuovi classe loading dopo il caricamento
    if (this.elements.feedContent) {
      this.elements.feedContent.classList.remove('loading');
    }
  }

  /**
   * Apply filters
   */
  applyFilters() {
    const filters = this.getActiveFilters();

    // Show loading state
    this.showFeedLoading();

    // Apply filters with a small delay for better UX
    setTimeout(() => {
      this.filterFeedContent(filters);
      this.hideFeedLoading();

      // Update filter chip indicators
      this.updateFilterIndicators(filters);

      // Show notification about applied filters
      const activeFiltersCount = this.countActiveFilters(filters);
      if (activeFiltersCount > 0) {
        this.showNotification(`Filtri applicati: ${activeFiltersCount} attivi`, 'success');
      }
    }, 300);
  }

  /**
   * Get all active filter values
   */
  getActiveFilters() {
    return {
      content: this.elements.contentFilter?.value || 'all',
      instituteType: this.elements.instituteTypeFilter?.value || 'all',
      date: this.elements.dateFilter?.value || 'all',
      sort: this.elements.sortFilter?.value || 'recent',
      engagement: this.elements.engagementFilter?.value || 'all',
      quickFilter: document.querySelector('.filter-chip.active')?.dataset.filter || 'all'
    };
  }

  /**
   * Filter feed content based on active filters
   */
  filterFeedContent(filters) {
    // For now, reload data with filters
    // In a real implementation, this would filter existing posts or make API calls
    this.loadFeedContent(filters);
  }

  /**
   * Count active filters (excluding defaults)
   */
  countActiveFilters(filters) {
    let count = 0;
    if (filters.content !== 'all') count++;
    if (filters.instituteType !== 'all') count++;
    if (filters.date !== 'all') count++;
    if (filters.sort !== 'recent') count++;
    if (filters.engagement !== 'all') count++;
    if (filters.quickFilter !== 'all') count++;
    return count;
  }

  /**
   * Update filter indicators
   */
  updateFilterIndicators(filters) {
    const activeCount = this.countActiveFilters(filters);
    const toggle = this.elements.advancedFiltersToggle;

    if (toggle) {
      if (activeCount > 0) {
        toggle.classList.add('has-active-filters');
        toggle.querySelector('span').textContent = `Filtri Avanzati (${activeCount})`;
      } else {
        toggle.classList.remove('has-active-filters');
        toggle.querySelector('span').textContent = 'Filtri Avanzati';
      }
    }
  }

  /**
   * Handle filter chip clicks
   */
  handleFilterChipClick(clickedChip) {
    // Remove active class from all chips
    this.elements.filterChips.forEach(chip => {
      chip.classList.remove('active');
    });

    // Add active class to clicked chip
    clickedChip.classList.add('active');

    // Apply quick filter
    const filterType = clickedChip.dataset.filter;

    // Sincronizza con le feed tabs per projects e methodologies
    if (filterType === 'projects' || filterType === 'methodologies') {
      // Usa switchFeedTab per mantenere la coerenza
      this.switchFeedTab(filterType);
    } else if (filterType === 'all') {
      // Torna alla tab "all"
      this.switchFeedTab('all');
    } else {
      // Per altri filtri (recent, popular), applica il filtro avanzato
      this.applyQuickFilter(filterType);
    }
  }

  /**
   * Apply quick filter based on chip selection
   */
  applyQuickFilter(filterType) {
    // Reset advanced filters when using quick filters
    this.resetAdvancedFilters(false);

    switch (filterType) {
      case 'all':
        // Show all content
        break;
      case 'projects':
        if (this.elements.contentFilter) {
          this.elements.contentFilter.value = 'project';
        }
        break;
      case 'methodologies':
        if (this.elements.contentFilter) {
          this.elements.contentFilter.value = 'methodology';
        }
        break;
      case 'recent':
        if (this.elements.sortFilter) {
          this.elements.sortFilter.value = 'recent';
        }
        if (this.elements.dateFilter) {
          this.elements.dateFilter.value = 'week';
        }
        break;
      case 'popular':
        if (this.elements.sortFilter) {
          this.elements.sortFilter.value = 'popular';
        }
        if (this.elements.engagementFilter) {
          this.elements.engagementFilter.value = 'high';
        }
        break;
    }

    // Apply the filters
    this.applyFilters();
  }

  /**
   * Toggle advanced filters panel
   */
  toggleAdvancedFilters() {
    const toggle = this.elements.advancedFiltersToggle;
    const panel = this.elements.advancedFiltersPanel;

    if (!toggle || !panel) return;

    const isActive = toggle.classList.contains('active');

    if (isActive) {
      toggle.classList.remove('active');
      panel.classList.remove('show');
    } else {
      toggle.classList.add('active');
      panel.classList.add('show');
    }
  }

  /**
   * Reset all filters to default values
   */
  resetFilters() {
    // Reset all select elements
    if (this.elements.contentFilter) this.elements.contentFilter.value = 'all';
    if (this.elements.instituteTypeFilter) this.elements.instituteTypeFilter.value = 'all';
    if (this.elements.dateFilter) this.elements.dateFilter.value = 'all';
    if (this.elements.sortFilter) this.elements.sortFilter.value = 'recent';
    if (this.elements.engagementFilter) this.elements.engagementFilter.value = 'all';

    // Reset filter chips
    this.elements.filterChips.forEach(chip => {
      chip.classList.remove('active');
      if (chip.dataset.filter === 'all') {
        chip.classList.add('active');
      }
    });

    // Apply filters
    this.applyFilters();

    // Show notification
    this.showNotification('Filtri ripristinati', 'info');
  }

  /**
   * Reset advanced filters only
   */
  resetAdvancedFilters(showNotification = true) {
    if (this.elements.contentFilter) this.elements.contentFilter.value = 'all';
    if (this.elements.instituteTypeFilter) this.elements.instituteTypeFilter.value = 'all';
    if (this.elements.dateFilter) this.elements.dateFilter.value = 'all';
    if (this.elements.sortFilter) this.elements.sortFilter.value = 'recent';
    if (this.elements.engagementFilter) this.elements.engagementFilter.value = 'all';

    if (showNotification) {
      this.showNotification('Filtri avanzati ripristinati', 'info');
    }
  }

  /**
   * Handle search
   */
  handleSearch(query) {
    clearTimeout(this.searchTimer);

    if (query.trim() === '') {
      this.hideSearchResults();
      this.hideSearchClear();
      return;
    }

    this.showSearchClear();

    this.searchTimer = setTimeout(() => {
      this.performSearch(query);
    }, 300);
  }

  /**
   * Perform search
   */
  async performSearch(query) {
    try {
      console.log('Searching for:', query);

      const results = [];

      // Search profiles (institutes and users)
      if (window.eduNetProfileManager) {
        try {
          console.log('Searching profiles with ProfileManager...');
          const profiles = await window.eduNetProfileManager.searchProfiles(query);
          console.log('Profile search results:', profiles);

          if (profiles && profiles.length > 0) {
            // Get avatars for all profiles
            for (const profile of profiles) {
              // 🔒 Check Privacy
              let isPrivate = false;
              let isEmailHidden = false;

              if (window.supabaseClientManager) {
                const sb = await window.supabaseClientManager.getClient();
                const { data: privacy } = await sb
                  .from('user_privacy_settings')
                  .select('profile_visibility, searchable_by_email')
                  .eq('user_id', profile.id)
                  .single();

                if (privacy) {
                  if (privacy.profile_visibility === 'private') isPrivate = true;
                  if (privacy.searchable_by_email === false && query.includes('@')) isEmailHidden = true;
                }
              }

              if (isPrivate || isEmailHidden) continue;

              let avatarUrl = null;

              // Get avatar using avatarManager
              if (window.avatarManager) {
                avatarUrl = await window.avatarManager.loadUserAvatar(profile.id);
              }

              if (profile.user_type === 'istituto' && profile.school_institutes) {
                // 🔍 Filtra istituti falsi usando il validatore MIUR
                let isValidInstitute = true;
                if (window.miurValidator) {
                  const validation = await window.miurValidator.validateInstitute({
                    instituteName: profile.school_institutes.institute_name,
                    instituteCode: profile.school_institutes.institute_code
                  });
                  // Mostra solo istituti con confidence >= 0.3 (hanno almeno keywords scolastiche)
                  if (!validation.isValid && validation.confidence < 0.3) {
                    console.log('🚫 Istituto filtrato (non valido MIUR):', profile.school_institutes.institute_name);
                    isValidInstitute = false;
                  }
                }

                if (isValidInstitute) {
                  results.push({
                    type: 'institute',
                    name: profile.school_institutes.institute_name,
                    location: profile.school_institutes.city || 'Posizione non specificata',
                    id: profile.id,
                    avatarUrl: avatarUrl
                  });
                }
              } else if (profile.user_type === 'privato' && profile.private_users) {
                // 🔒 PRIVACY: Ricerca utenti privati disabilitata per proteggere dati sensibili
                // Gli utenti privati non sono ricercabili
                console.log('🔒 Utente privato escluso dalla ricerca per privacy');
              }
            }
          }
        } catch (profileError) {
          console.error('Error searching profiles:', profileError);
        }
      } else {
        console.warn('ProfileManager not available');
      }

      // Search posts with tags support
      if (window.supabaseClientManager) {
        try {
          console.log('Searching posts with Supabase...');
          const supabase = await window.supabaseClientManager.getClient();

          if (supabase) {
            // Search in institute_posts with title, content, and tags
            const { data: posts, error } = await supabase
              .from('institute_posts')
              .select('id, title, content, post_type, institute_id, tags')
              .or(`title.ilike.%${query}%, content.ilike.%${query}%`)
              .eq('published', true)
              .order('created_at', { ascending: false })
              .limit(10);

            console.log('Post search results:', posts, 'Error:', error);

            // Also search by tags if query doesn't match title/content
            let tagPosts = [];
            if (!error) {
              const { data: tagResults, error: tagError } = await supabase
                .from('institute_posts')
                .select('id, title, content, post_type, institute_id, tags')
                .contains('tags', [query.toLowerCase()])
                .eq('published', true)
                .order('created_at', { ascending: false })
                .limit(10);

              if (!tagError && tagResults) {
                tagPosts = tagResults;
              }
            }

            // Merge results and remove duplicates
            const allPosts = [...(posts || []), ...tagPosts];
            const uniquePosts = Array.from(new Map(allPosts.map(p => [p.id, p])).values());

            if (uniquePosts.length > 0) {
              // For each post, get author info and avatar separately
              for (const post of uniquePosts) {
                let authorName = 'Autore sconosciuto';
                let avatarUrl = null;

                try {
                  const { data: institute, error: instError } = await supabase
                    .from('school_institutes')
                    .select('institute_name')
                    .eq('id', post.institute_id)
                    .maybeSingle();

                  if (!instError && institute) {
                    authorName = institute.institute_name;
                  }

                  // Get avatar using avatarManager
                  if (window.avatarManager) {
                    avatarUrl = await window.avatarManager.loadUserAvatar(post.institute_id);
                  }
                } catch (authorError) {
                  console.warn('Could not fetch author for post:', post.id);
                }

                // Get post type badge info
                const typeInfo = this.getPostTypeInfo(post.post_type);

                results.push({
                  type: 'post',
                  post_type: post.post_type,
                  author_id: post.institute_id, // Keep this for compatibility
                  authorId: post.institute_id,  // Add this for avatar consistency
                  avatarUrl: avatarUrl,
                  badge: typeInfo.label,
                  badgeIcon: typeInfo.icon,
                  badgeClass: typeInfo.class,
                  title: post.title,
                  author: authorName,
                  tags: post.tags || [],
                  id: post.id
                });
              }
            } else if (error) {
              console.error('Supabase posts query error:', error);
            }
          }
        } catch (postError) {
          console.error('Error searching posts:', postError);
        }
      } else {
        console.warn('SupabaseClientManager not available');
      }

      console.log('Final search results:', results);

      // Show results or empty state
      this.displaySearchResults(results);

    } catch (error) {
      console.error('Search error:', error);
      this.displaySearchResults([]);
    }
  }

  /**
   * Display search results
   */
  displaySearchResults(results) {
    if (!this.elements.searchResults) return;

    if (results.length === 0) {
      this.elements.searchResults.innerHTML = `
        <div class="search-no-results">
          <i class="fas fa-database" aria-hidden="true"></i>
          <p>Nessun risultato trovato nel database</p>
          <small>Assicurati che il database Supabase sia configurato correttamente</small>
        </div>
      `;
    } else {
      this.elements.searchResults.innerHTML = results.map(result => {
        // Determine the correct User ID for the avatar
        const avatarUserId = (result.type === 'post') ? result.authorId : result.id;

        // Avatar HTML
        const avatarHtml = result.avatarUrl
          ? `<img src="${result.avatarUrl}" alt="Avatar" class="search-result-avatar" data-user-id="${avatarUserId}">`
          : `<div class="search-result-avatar search-result-avatar-default" data-user-id="${avatarUserId}">
               <i class="fas fa-${result.type === 'institute' ? 'school' : result.type === 'user' ? 'user' : 'school'}"></i>
             </div>`;

        // For posts, show badge and tags
        if (result.type === 'post') {
          return `
            <div class="search-result-item" data-id="${result.id || ''}" data-type="${result.type}" data-post-type="${result.post_type || ''}">
              ${avatarHtml}
              <div class="search-result-main">
                <div class="search-result-header" style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="result-author" style="margin: 0; font-weight: 600; color: var(--color-gray-700); font-size: 0.85rem;">${result.author}</span>
                  <span class="search-badge ${result.badgeClass || ''}" style="font-size: 0.7rem; padding: 0.25rem 0.6rem;">
                    <i class="${result.badgeIcon || 'fas fa-file-alt'}"></i>
                    ${result.badge || 'Post'}
                  </span>
                </div>
                <div class="result-content" style="margin-top: 0.25rem;">
                  <h4 style="margin-bottom: 0.25rem;">${result.title}</h4>
                  ${result.tags && result.tags.length > 0 ? `
                    <div class="result-tags">
                      ${result.tags.slice(0, 3).map(tag => `<span class="result-tag">#${tag}</span>`).join('')}
                      ${result.tags.length > 3 ? `<span class="result-tag-more">+${result.tags.length - 3}</span>` : ''}
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        } else {
          // For profiles
          return `
            <div class="search-result-item" data-id="${result.id || ''}" data-type="${result.type}">
              ${avatarHtml}
              <div class="result-content">
                <h4>${result.name || result.title}</h4>
                <p>${result.location || result.author || result.category}</p>
              </div>
            </div>
          `;
        }
      }).join('');

      // Add click handlers for search results
      this.elements.searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const resultType = item.dataset.type;
          const resultId = item.dataset.id;
          const postType = item.dataset.postType;
          console.log('Clicked search result:', resultType, resultId, postType);

          // Handle different result types with actual navigation
          if (resultType === 'institute') {
            // ✅ Naviga al profilo istituto
            console.log('Navigating to institute profile:', resultId);
            this.navigateToProfile(resultId);
          } else if (resultType === 'user') {
            // ✅ Naviga al profilo utente
            console.log('Navigating to user profile:', resultId);
            this.navigateToProfile(resultId);
          } else if (resultType === 'post') {
            // Navigate to post and scroll to it
            this.navigateToPost(resultId);
          }

          // Hide search results after click
          this.hideSearchResults();
          this.clearSearch();
        });

        // Add click handler for badge to filter by type
        const badge = item.querySelector('.search-badge');
        if (badge) {
          badge.addEventListener('click', (e) => {
            e.stopPropagation();
            const postType = item.dataset.postType;
            if (postType) {
              this.filterByPostType(postType);
              this.hideSearchResults();
              this.clearSearch();
            }
          });
        }
      });
    }

    this.showSearchResults();
  }

  /**
   * Search by tag
   */
  async searchByTag(tag) {
    console.log('Searching by tag:', tag);

    // Set search input value
    if (this.elements.searchInput) {
      this.elements.searchInput.value = tag;
    }

    // Perform search
    await this.performSearch(tag);

    // Show search results
    this.showSearchResults();
  }

  /**
   * Filter feed by post type
   */
  async filterByPostType(postType) {
    console.log('Filtering by post type:', postType);

    try {
      if (!window.supabaseClientManager) return;

      const supabase = await window.supabaseClientManager.getClient();
      if (!supabase) return;

      // Show loading
      this.showLoadingState();

      // Fetch posts of specific type
      const { data: posts, error } = await supabase
        .from('institute_posts')
        .select('*')
        .eq('published', true)
        .eq('post_type', postType)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error filtering posts:', error);
        this.showNotification('Errore durante il filtro', 'error');
        return;
      }

      if (!posts || posts.length === 0) {
        this.showEmptyFeed();
        const typeLabels = {
          'notizia': 'Post',
          'progetto': 'Progetti',
          'metodologia': 'Metodologie',
          'evento': 'Gallerie'
        };
        this.showNotification(`Nessun ${typeLabels[postType] || 'contenuto'} trovato`, 'info');
        return;
      }

      // Normalize posts
      const normalizedPosts = posts.map(post => ({
        ...post,
        author_id: post.institute_id,
        is_published: post.published
      }));

      // Get author information
      const postsWithAuthors = await Promise.all(normalizedPosts.map(async (post) => {
        let authorName = 'Utente';

        try {
          const { data: institute } = await supabase
            .from('school_institutes')
            .select('institute_name')
            .eq('id', post.institute_id)
            .maybeSingle();

          if (institute) {
            authorName = institute.institute_name;
          }
        } catch (error) {
          console.warn('Could not fetch author for post:', post.id);
        }

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          author: authorName,
          author_id: post.institute_id,
          created_at: new Date(post.created_at),
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          post_type: post.post_type,
          category: post.category,
          tags: post.tags || [],
          target_audience: post.target_audience,
          subject_areas: post.subject_areas || [],
          image_urls: post.image_urls || [], // ✅ FIX: Corretto da images_urls a image_urls
          image_url: post.image_url
        };
      }));

      // Update feed
      this.feedData = postsWithAuthors;
      this.renderFeed();

      // Show notification
      const typeLabels = {
        'notizia': 'Post',
        'progetto': 'Progetti',
        'metodologia': 'Metodologie',
        'evento': 'Gallerie'
      };
      this.showNotification(`Filtro applicato: ${typeLabels[postType] || postType}`, 'success');

    } catch (error) {
      console.error('Error in filterByPostType:', error);
      this.showNotification('Errore durante il filtro', 'error');
    }
  }

  /**
   * Get search icon based on result type
   */
  getSearchIcon(type) {
    const icons = {
      institute: 'school',
      user: 'user',
      post: 'file-alt',
      methodology: 'book-open',
      project: 'lightbulb'
    };
    return icons[type] || 'search';
  }

  /**
   * Show search results
   */
  showSearchResults() {
    if (this.elements.searchResults) {
      this.elements.searchResults.style.display = 'block';
    }
  }

  /**
   * Hide search results
   */
  hideSearchResults() {
    if (this.elements.searchResults) {
      this.elements.searchResults.style.display = 'none';
    }
  }

  /**
   * Show search clear button
   */
  showSearchClear() {
    if (this.elements.searchClear) {
      this.elements.searchClear.style.display = 'block';
    }
  }

  /**
   * Hide search clear button
   */
  hideSearchClear() {
    if (this.elements.searchClear) {
      this.elements.searchClear.style.display = 'none';
    }
  }

  /**
   * Navigate to a specific post
   */
  navigateToPost(postId) {
    try {
      // First try to find the post in the current feed
      const postElement = document.querySelector(`[data-post-id="${postId}"]`);

      if (postElement) {
        // Scroll to the post and highlight it
        postElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        // Add highlight effect
        postElement.classList.add('post-highlighted');
        setTimeout(() => {
          postElement.classList.remove('post-highlighted');
        }, 3000);

        this.showNotification('Post trovato nel feed', 'success');
      } else {
        // Post not in current feed, show notification and switch to all posts
        this.switchFeedTab('all');
        this.showNotification('Caricamento post...', 'info');

        // Try to load and find the post after a delay
        setTimeout(() => {
          const foundPost = document.querySelector(`[data-post-id="${postId}"]`);
          if (foundPost) {
            foundPost.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
            foundPost.classList.add('post-highlighted');
            setTimeout(() => {
              foundPost.classList.remove('post-highlighted');
            }, 3000);
          } else {
            this.showNotification('Post non trovato nel feed corrente', 'warning');
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error navigating to post:', error);
      this.showNotification('Errore nella navigazione al post', 'error');
    }
  }

  /**
   * Clear search
   */
  clearSearch() {
    if (this.elements.searchInput) {
      this.elements.searchInput.value = '';
    }
    this.hideSearchResults();
    this.hideSearchClear();
  }

  /**
   * Toggle dropdown
   */
  toggleDropdown(trigger) {
    const isOpen = trigger.classList.contains('open');

    // Close all dropdowns first
    this.closeAllDropdowns();

    // Open this dropdown if it wasn't open
    if (!isOpen) {
      trigger.classList.add('open');
    }
  }

  /**
   * Close all dropdowns
   */
  closeAllDropdowns() {
    document.querySelectorAll('.nav-item.open').forEach(item => {
      item.classList.remove('open');
    });
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    if (this.elements.mobileMenuToggle && this.elements.mobileMenuOverlay) {
      this.elements.mobileMenuToggle.classList.toggle('active');
      this.elements.mobileMenuOverlay.classList.toggle('show');

      // Prevent body scroll when menu is open
      if (this.elements.mobileMenuOverlay.classList.contains('show')) {
        document.body.style.overflow = 'hidden';
        this.updateMobileUserInfo();
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  /**
   * Update mobile user info
   */
  updateMobileUserInfo() {
    if (this.currentUser) {
      // Update mobile user name
      if (this.elements.mobileUserName) {
        this.elements.mobileUserName.textContent = this.getDisplayName();
      }

      // Update mobile user type
      if (this.elements.mobileUserType) {
        this.elements.mobileUserType.textContent = this.getUserTypeDisplay();
      }

      // Update mobile avatar (placeholder for now)
      if (this.elements.mobileUserAvatar) {
        // TODO: Implement avatar display when available
      }
    }
  }

  /**
   * Switch section (for mobile navigation)
   */
  switchSection(section) {
    console.log('Switching to section:', section);

    // Update active mobile nav item
    this.elements.mobileNavItems.forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });

    // Update active sidebar nav links
    const sidebarLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    sidebarLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === section);
    });

    // Handle section-specific logic
    switch (section) {
      case 'saved':
        // Show saved posts section
        if (window.savedPostsManager) {
          window.savedPostsManager.showSavedPosts();
        }
        break;

      case 'feed':
        // Hide saved posts section, show normal feed
        if (window.savedPostsManager) {
          window.savedPostsManager.hideSavedPosts();
        }
        break;

      default:
        // Hide saved posts for other sections
        if (window.savedPostsManager) {
          window.savedPostsManager.hideSavedPosts();
        }
        // TODO: Implement other section logic
        break;
    }
  }

  /**
   * Open create post modal (legacy method - redirects to handlePostActionClick)
   */
  openCreatePostModal(type = 'post') {
    console.log('Opening create post modal for type:', type);
    this.handlePostActionClick(type === 'post' ? 'text' : type);
  }

  /**
   * Handle post interactions
   */
  handleLike(postId) {
    console.log('Liking post:', postId);
    // TODO: Implement like functionality
  }

  handleComment(postId) {
    console.log('Commenting on post:', postId);
    // TODO: Implement comment functionality
  }

  handleShare(postId) {
    console.log('Sharing post:', postId);
    // TODO: Implement share functionality
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    try {
      if (window.eduNetAuth) {
        await window.eduNetAuth.logout();
      }
      window.location.href = window.AppConfig.getPageUrl('index.html');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Load sidebar data (mock implementations)
   */
  async loadFavorites() {
    // TODO: Implement with Supabase
    console.log('Loading favorites...');
  }

  async loadRecentActivity() {
    try {
      if (!window.eduNetSocial || !window.eduNetSocial.supabase) {
        console.log('Social features not available yet');
        return;
      }

      const activityContainer = document.getElementById('recent-activity');
      if (!activityContainer) return;

      // Show loading
      activityContainer.innerHTML = `
        <div class="activity-loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Caricamento attività...</p>
        </div>
      `;

      console.log('Attempting to fetch user activities...');

      try {
        // Simplified query without complex joins
        const { data: activities, error } = await window.eduNetSocial.supabase
          .from('user_activities')
          .select('*')
          .eq('user_id', this.currentUser?.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          // Handle table not found error gracefully without stack trace
          if (error.code === 'PGRST205' || error.code === 'PGRST116' || error.message.includes('404') || error.message.includes('Could not find the table')) {
            console.log('User activities table not found, showing empty state');
            activityContainer.innerHTML = `
              <div class="no-activity">
                <i class="fas fa-clock"></i>
                <p>Nessuna attività recente</p>
                <small>Le attività appariranno qui quando interagirai con i post</small>
              </div>
            `;
            return;
          }
          throw new Error('DATABASE_ERROR'); // Custom error to avoid stack trace
        }

        console.log(`Fetched ${activities?.length || 0} activities`);

        // Get additional data for activities if needed
        const activitiesWithData = await Promise.all((activities || []).map(async (activity) => {
          try {
            // Get post title if activity is related to a post
            if (activity.target_type === 'post' && activity.target_id) {
              const { data: post } = await window.eduNetSocial.supabase
                .from('institute_posts')
                .select('title')
                .eq('id', activity.target_id)
                .maybeSingle(); // ✅ Usa maybeSingle per evitare errore 406

              return {
                ...activity,
                post_title: post?.title || 'Post eliminato'
              };
            }
            return activity;
          } catch (err) {
            return activity;
          }
        }));

        this.renderRecentActivity(activitiesWithData, activityContainer);

      } catch (dbError) {
        if (dbError.message === 'DATABASE_ERROR') {
          // Silent handling of database errors
        }
        // Show empty state for any database issues
        activityContainer.innerHTML = `
          <div class="no-activity">
            <i class="fas fa-clock"></i>
            <p>Nessuna attività recente</p>
            <small>Le attività appariranno qui quando interagirai con i post</small>
          </div>
        `;
      }

    } catch (error) {
      // Silent handling of any other errors
      const activityContainer = document.getElementById('recent-activity');
      if (activityContainer) {
        activityContainer.innerHTML = `
          <div class="no-activity">
            <i class="fas fa-clock"></i>
            <p>Nessuna attività recente</p>
            <small>Le attività appariranno qui quando interagirai con i post</small>
          </div>
        `;
      }
    }
  }

  /**
   * Render recent activity
   */
  renderRecentActivity(activities, container) {
    if (!activities || activities.length === 0) {
      container.innerHTML = `
        <div class="no-activity">
          <i class="fas fa-clock"></i>
          <p>Nessuna attività recente</p>
          <small>Le attività appariranno qui quando interagirai con i post</small>
        </div>
      `;
      return;
    }

    const MAX_VISIBLE = 5;
    const totalActivities = activities.length;
    const visibleActivities = activities.slice(0, MAX_VISIBLE);
    const hiddenCount = Math.max(0, totalActivities - MAX_VISIBLE);

    const activitiesHTML = visibleActivities.map(activity => {
      const icon = this.getActivityIcon(activity.activity_type);
      const text = this.getActivityText(activity);
      const timeAgo = this.formatTimeAgo(new Date(activity.created_at));

      return `
        <div class="activity-item">
          <div class="activity-icon">
            <i class="${icon}"></i>
          </div>
          <div class="activity-content">
            <p class="activity-text">${text}</p>
            <span class="activity-time">${timeAgo}</span>
          </div>
        </div>
      `;
    }).join('');

    // Hidden activities HTML (initially hidden)
    const hiddenActivitiesHTML = activities.slice(MAX_VISIBLE).map(activity => {
      const icon = this.getActivityIcon(activity.activity_type);
      const text = this.getActivityText(activity);
      const timeAgo = this.formatTimeAgo(new Date(activity.created_at));

      return `
        <div class="activity-item">
          <div class="activity-icon">
            <i class="${icon}"></i>
          </div>
          <div class="activity-content">
            <p class="activity-text">${text}</p>
            <span class="activity-time">${timeAgo}</span>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="activity-list">
        ${activitiesHTML}
        ${hiddenCount > 0 ? `
          <div class="activity-hidden" id="activity-hidden" style="display: none;">
            ${hiddenActivitiesHTML}
          </div>
          <button class="activity-show-all" id="activity-show-all-btn" aria-label="Mostra tutte le attività">
            <span>Vedi tutte</span>
            <span class="activity-count-badge">${totalActivities}</span>
            <i class="fas fa-chevron-down"></i>
          </button>
        ` : ''}
      </div>
    `;

    // Setup event listener for "Vedi tutte" button
    if (hiddenCount > 0) {
      const showAllBtn = container.querySelector('#activity-show-all-btn');
      const hiddenSection = container.querySelector('#activity-hidden');

      if (showAllBtn && hiddenSection) {
        showAllBtn.addEventListener('click', () => {
          const isExpanded = hiddenSection.style.display !== 'none';

          if (isExpanded) {
            // Collapse
            hiddenSection.style.display = 'none';
            showAllBtn.innerHTML = `
              <span>Vedi tutte</span>
              <span class="activity-count-badge">${totalActivities}</span>
              <i class="fas fa-chevron-down"></i>
            `;
          } else {
            // Expand
            hiddenSection.style.display = 'block';
            showAllBtn.innerHTML = `
              <span>Mostra meno</span>
              <span class="activity-count-badge">${totalActivities}</span>
              <i class="fas fa-chevron-up"></i>
            `;
          }
        });
      }
    }
  }

  /**
   * Get activity icon based on type
   */
  getActivityIcon(activityType) {
    const icons = {
      like: 'fas fa-heart',
      unlike: 'far fa-heart',
      comment: 'fas fa-comment',
      share: 'fas fa-share',
      share_post: 'fas fa-share-alt',
      post_created: 'fas fa-plus-circle',
      post_updated: 'fas fa-edit',
      save_post: 'fas fa-bookmark',
      unsave_post: 'far fa-bookmark',
      mute_user: 'fas fa-volume-mute',
      hide_post: 'far fa-eye-slash',
      report_post: 'fas fa-flag',
      delete_post: 'fas fa-trash-alt'
    };
    return icons[activityType] || 'fas fa-circle';
  }

  /**
   * Get activity text description
   */
  getActivityText(activity) {
    const postTitle = activity.post_title || 'un post';

    switch (activity.activity_type) {
      case 'like':
        return `Hai messo like a "${postTitle}"`;
      case 'unlike':
        return `Hai rimosso il like da "${postTitle}"`;
      case 'comment':
        return `Hai commentato "${postTitle}"`;
      case 'share':
        const platform = activity.metadata?.platform || 'una piattaforma';
        return `Hai condiviso "${postTitle}" su ${platform}`;
      case 'share_post':
        return `Hai condiviso "${postTitle}"`;
      case 'post_created':
        return `Hai creato il post "${postTitle}"`;
      case 'post_updated':
        return `Hai aggiornato il post "${postTitle}"`;
      case 'save_post':
        return `Hai salvato "${postTitle}" nei preferiti`;
      case 'unsave_post':
        return `Hai rimosso "${postTitle}" dai salvati`;
      case 'mute_user':
        return `Hai silenziato un autore`;
      case 'hide_post':
        return `Hai nascosto "${postTitle}"`;
      case 'report_post':
        return `Hai segnalato "${postTitle}"`;
      case 'delete_post':
        return `Hai eliminato "${postTitle}"`;
      default:
        return `Attività su "${postTitle}"`;
    }
  }

  async loadTrendingTopics() {
    console.log('Loading trending topics...');

    const container = document.getElementById('trending-topics-discover');
    if (!container) return;

    try {
      const supabase = window.eduNetSocial?.supabase;
      if (!supabase) {
        console.warn('Supabase not available for trending topics');
        return;
      }

      // Get all posts with tags
      const { data: posts, error } = await supabase
        .from('institute_posts')
        .select('tags')
        .eq('published', true)
        .not('tags', 'is', null)
        .limit(100);

      if (error) throw error;

      // Count tag occurrences
      const tagCounts = {};
      posts?.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      // Sort by count and get top 8
      const trendingTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag, count]) => ({ tag, count }));

      // Render trending topics
      if (trendingTags.length > 0) {
        container.innerHTML = trendingTags.map(({ tag, count }) => `
          <div class="trending-topic" data-tag="${tag}">
            <span class="topic-name">#${tag}</span>
            <span class="topic-count">${count} post</span>
          </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.trending-topic').forEach(topic => {
          topic.addEventListener('click', () => {
            const tag = topic.dataset.tag;
            // Search by tag
            if (this.elements.searchInput) {
              this.elements.searchInput.value = tag;
              this.performSearch(tag);
            }
          });
        });
      } else {
        container.innerHTML = `
          <div class="no-trends">
            <i class="fas fa-chart-line"></i>
            <p>Nessun trend disponibile</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading trending topics:', error);
      container.innerHTML = `
        <div class="no-trends">
          <i class="fas fa-exclamation-circle"></i>
          <p>Errore nel caricamento</p>
        </div>
      `;
    }
  }

  async loadSuggestedInstitutes() {
    console.log('Loading suggested institutes...');

    const container = document.getElementById('suggested-institutes-discover');
    if (!container) return;

    try {
      const supabase = window.eduNetSocial?.supabase;
      if (!supabase) {
        console.warn('Supabase not available for suggested institutes');
        return;
      }

      // Get random institutes (excluding current user if institute)
      const { data: institutes, error } = await supabase
        .from('school_institutes')
        .select('id, institute_name, institute_type, city')
        .limit(5);

      if (error) throw error;

      // Render suggested institutes
      if (institutes && institutes.length > 0) {
        const institutesHtml = await Promise.all(institutes.map(async (inst) => {
          // Get avatar
          let avatarUrl = null;
          if (window.avatarManager) {
            try {
              avatarUrl = await window.avatarManager.loadUserAvatar(inst.id);
            } catch (e) {
              console.warn('Could not load avatar for:', inst.id);
            }
          }

          const avatarHtml = avatarUrl
            ? `<img src="${avatarUrl}" alt="${inst.institute_name}">`
            : `<div class="institute-avatar-default"><i class="fas fa-school"></i></div>`;

          return `
            <div class="suggested-institute" data-id="${inst.id}">
              <div class="institute-avatar">${avatarHtml}</div>
              <div class="institute-info">
                <h4>${inst.institute_name}</h4>
                <p>${inst.institute_type || 'Istituto'} • ${inst.city || 'Italia'}</p>
              </div>
              <button class="btn-follow" data-id="${inst.id}">
                <i class="fas fa-plus"></i>
                Segui
              </button>
            </div>
          `;
        }));

        container.innerHTML = institutesHtml.join('');

        // Add click handlers for institutes
        container.querySelectorAll('.suggested-institute').forEach(item => {
          item.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-follow')) {
              const id = item.dataset.id;
              window.location.href = window.AppConfig.getPageUrl(`pages/profile/profile.html?id=${id}`);
            }
          });
        });

        // Add click handlers for follow buttons
        container.querySelectorAll('.btn-follow').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            // TODO: Implement follow functionality
            btn.innerHTML = '<i class="fas fa-check"></i> Seguito';
            btn.classList.add('following');
            btn.disabled = true;
          });
        });
      } else {
        container.innerHTML = `
          <div class="no-suggestions">
            <i class="fas fa-lightbulb"></i>
            <p>Nessun suggerimento disponibile</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading suggested institutes:', error);
      container.innerHTML = `
        <div class="no-suggestions">
          <i class="fas fa-exclamation-circle"></i>
          <p>Errore nel caricamento</p>
        </div>
      `;
    }
  }

  async loadInstituteStatistics() {
    try {
      if (!window.eduNetSocial || !window.eduNetSocial.supabase) {
        console.log('Social features not available for statistics');
        return;
      }

      console.log('Loading institute statistics...');

      // Get dynamic statistics from database
      let stats = {
        posts: 0,
        likes: 0,
        comments: 0,
        shares: 0
      };

      try {
        // Get posts count
        const { count: postsCount, error: postsError } = await window.eduNetSocial.supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('is_published', true);

        if (!postsError) {
          stats.posts = postsCount || 0;
        }

        // Get likes count
        const { count: likesCount, error: likesError } = await window.eduNetSocial.supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true });

        if (!likesError) {
          stats.likes = likesCount || 0;
        }

        // Get comments count
        const { count: commentsCount, error: commentsError } = await window.eduNetSocial.supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true });

        if (!commentsError) {
          stats.comments = commentsCount || 0;
        }

        // Get shares count
        const { count: sharesCount, error: sharesError } = await window.eduNetSocial.supabase
          .from('post_shares')
          .select('*', { count: 'exact', head: true });

        if (!sharesError) {
          stats.shares = sharesCount || 0;
        }

        console.log('Dynamic statistics loaded:', stats);

      } catch (error) {
        console.log('Error fetching dynamic statistics, using fallback values');
        // Fallback to known values if database queries fail
        stats = {
          posts: 9,
          likes: 5,
          comments: 0,
          shares: 0
        };
      }

      console.log('Statistics updated:', stats);

      // Update statistics in the UI
      this.updateStatisticsDisplay(stats);

    } catch (error) {
      console.log('Error loading statistics:', error.message);
      // Show default statistics if database is not available
      this.updateStatisticsDisplay({
        posts: 0,
        likes: 0,
        comments: 0,
        shares: 0
      });
    }
  }

  /**
   * Update statistics display in the sidebar
   */
  updateStatisticsDisplay(stats) {
    // Update posts count
    const postsCountElement = document.getElementById('posts-count');
    if (postsCountElement) {
      postsCountElement.textContent = this.formatNumber(stats.posts);
    }

    // NOTE: followers-count e following-count sono gestiti da recommendation-integration.js
    // Non sovrascrivere qui per evitare conflitti

    // Update views count (using total interactions)
    const viewsCountElement = document.getElementById('views-count');
    if (viewsCountElement) {
      const totalViews = stats.likes + stats.comments + stats.shares;
      viewsCountElement.textContent = this.formatNumber(totalViews);
    }

    // Update rating average (placeholder calculation)
    const ratingElement = document.getElementById('rating-average');
    if (ratingElement) {
      // Simple rating calculation based on engagement
      const engagement = stats.posts > 0 ? (stats.likes + stats.comments) / stats.posts : 0;
      const rating = Math.min(5.0, Math.max(0.0, engagement / 10)); // Scale to 0-5
      ratingElement.textContent = rating.toFixed(1);
    }

    console.log('📊 Statistics updated:', stats);
  }

  /**
   * Format number for display (e.g., 1000 -> 1K)
   */
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Event handlers
   */
  handleResize() {
    // Handle responsive behavior
    const isMobile = window.innerWidth < 1024;

    if (isMobile) {
      this.closeAllDropdowns();
    }
  }

  handleScroll() {
    // Handle scroll-based interactions
    const scrollY = window.scrollY;

    // Add scroll effect to navigation
    const topNav = document.querySelector('.top-nav');
    if (topNav) {
      topNav.classList.toggle('scrolled', scrollY > 10);
    }
  }

  handleKeydown(e) {
    // Handle keyboard shortcuts
    if (e.key === 'Escape') {
      this.closeAllDropdowns();
      this.hideSearchResults();
    }

    // Search shortcut (Ctrl/Cmd + K)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (this.elements.searchInput) {
        this.elements.searchInput.focus();
      }
    }
  }

  /**
   * Toggle post menu dropdown
   */
  togglePostMenu(dropdown) {
    const isOpen = dropdown.classList.contains('show');

    // Close all other menus first
    this.closeAllPostMenus();

    // Toggle this menu
    if (!isOpen) {
      dropdown.classList.add('show');
      // Eleva il post-card sopra gli altri (fallback per browser senza :has())
      const postCard = dropdown.closest('.post-card');
      if (postCard) {
        postCard.classList.add('menu-open');
      }
      // Show overlay on mobile
      if (window.innerWidth <= 768) {
        this.showPostMenuOverlay();
      }
    }
  }

  /**
   * Show overlay for mobile post menu
   */
  showPostMenuOverlay() {
    let overlay = document.querySelector('.post-dropdown-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'post-dropdown-overlay';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', () => this.closeAllPostMenus());
    }
    // Force reflow for animation
    overlay.offsetHeight;
    overlay.classList.add('show');
  }

  /**
   * Hide overlay for mobile post menu
   */
  hidePostMenuOverlay() {
    const overlay = document.querySelector('.post-dropdown-overlay');
    if (overlay) {
      overlay.classList.remove('show');
    }
  }

  /**
   * Close all post menus
   */
  closeAllPostMenus() {
    document.querySelectorAll('.post-dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
      // Rimuovi classe dal post-card
      const postCard = menu.closest('.post-card');
      if (postCard) {
        postCard.classList.remove('menu-open');
      }
    });
    this.hidePostMenuOverlay();
  }

  /**
   * Handle post menu actions
   */
  async handlePostMenuAction(action, postData, postElement) {
    console.log('Post menu action:', action, postData);

    switch (action) {
      case 'copy-link':
        const postUrl = window.AppConfig.getPageUrl(`post/${postData.id}`);
        await navigator.clipboard.writeText(postUrl);
        this.showNotification('🔗 Link copiato negli appunti', 'success');
        break;

      case 'share':
        const shareUrl = window.AppConfig.getPageUrl(`post/${postData.id}`);
        if (navigator.share) {
          try {
            await navigator.share({
              title: postData.title,
              text: postData.content.substring(0, 100) + '...',
              url: shareUrl
            });
            this.showNotification('✅ Contenuto condiviso', 'success');
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.error('Share error:', err);
            }
          }
        } else {
          await navigator.clipboard.writeText(shareUrl);
          this.showNotification('🔗 Link copiato per condividere', 'success');
        }
        break;

      case 'mute-author':
        await this.muteAuthor(postData.author_id);
        this.showNotification(`🔕 Non vedrai più post di ${postData.author}`, 'info');
        break;

      case 'hide-post':
        postElement.style.display = 'none';
        await this.hidePost(postData.id);
        this.showNotification('✅ Post nascosto', 'success');
        break;

      case 'report':
        // Use the new report modal with categories
        if (window.contentReportManager) {
          window.contentReportManager.open('post', postData.id, postData.author_id);
        } else {
          // Fallback to simple report
          await this.reportPost(postData.id);
          this.showNotification('📢 Segnalazione inviata. Grazie per aiutarci a mantenere la community sicura', 'success');
        }
        break;

      case 'edit':
        this.showNotification('✏️ Modifica post - Funzionalità in sviluppo', 'info');
        // TODO: Implementare modal di modifica
        break;

      case 'delete':
        if (confirm('Sei sicuro di voler eliminare questo post? L\'azione non può essere annullata.')) {
          await this.deletePost(postData.id);
          postElement.remove();
          this.showNotification('🗑️ Post eliminato', 'success');
        }
        break;

      default:
        console.warn('Unknown action:', action);
    }
  }

  /**
   * Toggle bookmark - Save/Unsave post
   */
  async toggleBookmark(postId, bookmarkBtn) {
    try {
      const icon = bookmarkBtn.querySelector('i');
      const isSaved = icon.classList.contains('fas');

      // Animazione di feedback immediata
      bookmarkBtn.style.transform = 'scale(0.8)';
      setTimeout(() => {
        bookmarkBtn.style.transform = '';
      }, 200);

      if (isSaved) {
        // Rimuovi dai salvati
        await this.unsavePost(postId);

        // Aggiorna UI
        icon.classList.remove('fas');
        icon.classList.add('far');
        bookmarkBtn.classList.remove('saved');
        bookmarkBtn.setAttribute('aria-label', 'Salva post');
        bookmarkBtn.setAttribute('title', 'Salva post');

        this.showNotification('📑 Post rimosso dai salvati', 'info');

        // Aggiorna contatore
        if (window.savedPostsManager) {
          await window.savedPostsManager.updateSavedCount();
        }
      } else {
        // Salva post
        await this.savePost(postId);

        // Aggiorna UI
        icon.classList.remove('far');
        icon.classList.add('fas');
        bookmarkBtn.classList.add('saved');
        bookmarkBtn.setAttribute('aria-label', 'Rimuovi dai salvati');
        bookmarkBtn.setAttribute('title', 'Rimuovi dai salvati');

        this.showNotification('💾 Post salvato nei preferiti', 'success');

        // Aggiorna contatore
        if (window.savedPostsManager) {
          await window.savedPostsManager.updateSavedCount();
        }
      }

    } catch (error) {
      console.error('Error toggling bookmark:', error);
      this.showNotification('❌ Errore durante il salvataggio', 'error');
    }
  }

  /**
   * Aggiorna gli indicatori di post salvati per tutti i post visibili
   */
  async updateSavedPostsIndicators() {
    try {
      if (!window.supabaseClientManager?.client) return;

      const supabase = await window.supabaseClientManager.getClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Ottieni tutti i post salvati dall'utente
      const { data: savedPosts, error } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching saved posts:', error);
        return;
      }

      // Crea un Set degli ID salvati per lookup veloce
      const savedPostIds = new Set(savedPosts.map(sp => sp.post_id));

      // Aggiorna gli indicatori per ogni post visibile
      const allPosts = document.querySelectorAll('.post-card');
      allPosts.forEach(postCard => {
        const postId = postCard.dataset.postId;
        const bookmarkBtn = postCard.querySelector('.bookmark-btn');
        const bookmarkIcon = bookmarkBtn?.querySelector('i');

        if (bookmarkBtn && bookmarkIcon) {
          if (savedPostIds.has(postId)) {
            // Post salvato: icona piena + colore dorato
            bookmarkIcon.classList.remove('far');
            bookmarkIcon.classList.add('fas');
            bookmarkBtn.classList.add('saved');
            bookmarkBtn.setAttribute('aria-label', 'Rimuovi dai salvati');
            bookmarkBtn.setAttribute('title', 'Rimuovi dai salvati');
          } else {
            // Post non salvato: icona vuota + colore grigio
            bookmarkIcon.classList.remove('fas');
            bookmarkIcon.classList.add('far');
            bookmarkBtn.classList.remove('saved');
            bookmarkBtn.setAttribute('aria-label', 'Salva post');
            bookmarkBtn.setAttribute('title', 'Salva post');
          }
        }
      });

    } catch (error) {
      console.error('Error updating saved posts indicators:', error);
    }
  }

  /**
   * Save post to favorites
   */
  async savePost(postId) {
    try {
      if (!window.supabaseClientManager?.client) {
        console.log('Demo mode: savePost', postId);
        return;
      }

      if (!postId) {
        console.warn('⚠️ ID post mancante');
        this.showNotification('⚠️ Errore: ID post non valido', 'warning');
        return;
      }

      const supabase = await window.supabaseClientManager.getClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      console.log('💾 Attempting to save post:', postId);

      // ✅ VERIFICA: Il post esiste davvero in institute_posts
      const { data: postExists, error: checkError } = await supabase
        .from('institute_posts')
        .select('id')
        .eq('id', postId)
        .maybeSingle(); // ✅ Usa maybeSingle invece di single per evitare errore 406

      if (checkError) {
        console.error('❌ Error checking post existence:', checkError);
        this.showNotification('Errore nella verifica del post', 'error');
        return;
      }

      if (!postExists) {
        console.warn('❌ Post not found in institute_posts:', postId);
        this.showNotification('⚠️ Post non trovato nel database', 'warning');
        return;
      }

      console.log('✅ Post exists in database, proceeding to save');

      // Verifica se già salvato
      const { data: existing } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle(); // ✅ Usa maybeSingle per evitare errore 406

      if (existing) {
        console.log('Post already saved');
        this.showNotification('📌 Post già salvato', 'info');
        return; // Già salvato, skip
      }

      const { error } = await supabase
        .from('saved_posts')
        .insert({
          user_id: user.id,
          post_id: postId
        });

      if (error && error.code !== '23505') throw error; // Ignora duplicati

      // Track activity
      await this.trackActivity('save_post', postId);

    } catch (error) {
      console.error('Error saving post:', error);
      throw error;
    }
  }

  /**
   * Remove post from saved
   */
  async unsavePost(postId) {
    try {
      if (!window.supabaseClientManager?.client) {
        console.log('Demo mode: unsavePost', postId);
        return;
      }

      if (!postId) {
        console.warn('⚠️ ID post mancante');
        return;
      }

      const supabase = await window.supabaseClientManager.getClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      console.log('🗑️ Removing post from saved:', postId);

      // Rimuovi da saved_posts
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

      if (error) throw error;

      console.log('✅ Post removed from saved');

      // Track activity
      await this.trackActivity('unsave_post', postId);

    } catch (error) {
      console.error('Error removing saved post:', error);
      throw error;
    }
  }

  /**
   * Mute author
   */
  async muteAuthor(authorId) {
    try {
      if (!window.supabaseClientManager?.client) {
        console.log('Demo mode: muteAuthor', authorId);
        return;
      }

      const supabase = await window.supabaseClientManager.getClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('muted_users')
        .insert({
          user_id: user.id,
          muted_user_id: authorId
        });

      if (error && error.code !== '23505') throw error;

      // Track activity
      await this.trackActivity('mute_user', authorId);

    } catch (error) {
      console.error('Error muting author:', error);
      throw error;
    }
  }

  /**
   * Hide post
   */
  async hidePost(postId) {
    try {
      if (!window.supabaseClientManager?.client) {
        console.log('Demo mode: hidePost', postId);
        return;
      }

      const supabase = await window.supabaseClientManager.getClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('hidden_posts')
        .insert({
          user_id: user.id,
          post_id: postId
        });

      if (error && error.code !== '23505') throw error;

      // Track activity
      await this.trackActivity('hide_post', postId);

    } catch (error) {
      console.error('Error hiding post:', error);
      throw error;
    }
  }

  /**
   * Report post
   */
  async reportPost(postId) {
    try {
      if (!window.supabaseClientManager?.client) {
        console.log('Demo mode: reportPost', postId);
        return;
      }

      const supabase = await window.supabaseClientManager.getClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('content_reports')
        .insert({
          reporter_id: user.id,
          reported_content_type: 'post', // ← FIXED: nome corretto colonna
          reported_content_id: postId,   // ← FIXED: nome corretto colonna
          reason: 'user_report',
          status: 'pending'
        });

      if (error) throw error;

      // Track activity
      await this.trackActivity('report_post', postId);

    } catch (error) {
      console.error('Error reporting post:', error);
      throw error;
    }
  }

  /**
   * Delete post
   */
  async deletePost(postId) {
    try {
      if (!window.supabaseClientManager?.client) {
        console.log('Demo mode: deletePost', postId);
        return;
      }

      const supabase = await window.supabaseClientManager.getClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('User not authenticated');

      // Delete from institute_posts table
      const { error } = await supabase
        .from('institute_posts')
        .delete()
        .eq('id', postId)
        .eq('institute_id', user.id); // Solo l'autore può eliminare

      if (error) {
        console.error('Error deleting post:', error);
        throw error;
      }

      console.log(`Post ${postId} deleted successfully`);

      // Track activity
      await this.trackActivity('delete_post', postId);

    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  /**
   * Track user activity
   */
  async trackActivity(activityType, targetId) {
    try {
      if (!window.supabaseClientManager?.client) return;

      const supabase = await window.supabaseClientManager.getClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          target_type: 'post',
          target_id: targetId
        });

      if (error && error.code !== 'PGRST116') {
        console.log('Activity tracking error:', error.message);
      }
    } catch (error) {
      // Silent fail for activity tracking
      console.log('Activity tracking failed:', error.message);
    }
  }

  /**
   * Navigate to user profile
   */
  navigateToProfile(userId) {
    if (!userId) {
      console.warn('No user ID provided for profile navigation');
      return;
    }

    console.log('Navigating to profile:', userId);
    window.location.href = window.AppConfig.getPageUrl(`pages/profile/profile.html?id=${userId}`);
  }

  handleClick(e) {
    // Handle global click events
    const target = e.target;

    // Close search results when clicking outside
    if (!target.closest('.nav-search')) {
      this.hideSearchResults();
    }

    // Close post menus when clicking outside
    if (!target.closest('.post-actions')) {
      this.closeAllPostMenus();
    }
  }

  /**
   * Check if we need to scroll to a specific post (from profile page)
   */
  checkScrollToPost() {
    const postId = sessionStorage.getItem('scrollToPost');
    if (postId) {
      sessionStorage.removeItem('scrollToPost');
      setTimeout(() => {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight animation
          postElement.style.animation = 'highlightPost 2s ease-out';
          setTimeout(() => {
            postElement.style.animation = '';
          }, 2000);
        }
      }, 800);
    }
  }

  /**
   * Hide loading screen
   */
  hideLoadingScreen() {
    if (this.elements.loadingScreen) {
      this.elements.loadingScreen.classList.add('hidden');
      setTimeout(() => {
        this.elements.loadingScreen.style.display = 'none';
      }, 350);
    }
  }

  /**
   * Handle initialization errors
   */
  handleInitializationError(error) {
    console.error('Homepage initialization error:', error);

    // Hide loading screen
    this.hideLoadingScreen();

    // Show error message
    document.body.innerHTML = `
      <div class="initialization-error">
        <div class="error-content">
          <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
          <h1>Errore di Caricamento</h1>
          <p>Si è verificato un errore durante il caricamento della homepage.</p>
          <button class="btn btn-primary" onclick="window.location.reload()">
            <i class="fas fa-refresh" aria-hidden="true"></i>
            Ricarica Pagina
          </button>
          <a href="index.html" class="btn btn-outline">
            <i class="fas fa-home" aria-hidden="true"></i>
            Torna alla Home
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Cleanup method
   */
  destroy() {
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('click', this.handleClick);

    // Disconnect observers
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    // Clear timers
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    console.log('EduNet19 Homepage destroyed');
  }

  /**
   * Apply filters from modern-filters system
   */
  applyFilters(filterState) {
    console.log('📊 Homepage applying filters:', filterState);
    console.log('📊 Filter state:', JSON.stringify(filterState, null, 2));

    // Store active filters
    this.activeFilters = filterState;

    // Get all posts in feed
    const feedContent = document.getElementById('feed-content');
    if (!feedContent) {
      console.warn('Feed content not found');
      return;
    }

    const allPosts = feedContent.querySelectorAll('.feed-post');
    console.log(`📊 Total posts in feed: ${allPosts.length}`);

    // Log post types for debugging
    allPosts.forEach((post, index) => {
      const postType = post.getAttribute('data-post-type');
      console.log(`Post ${index}: type="${postType}"`);
    });

    // Handle tab filtering first
    const tab = filterState.tab || 'all';
    let tabContentTypes = [];

    switch (tab) {
      case 'projects':
        tabContentTypes = ['project', 'progetto'];
        break;
      case 'methodologies':
        tabContentTypes = ['methodology', 'metodologia'];
        break;
      case 'following':
        tabContentTypes = filterState.contentTypes;
        break;
      case 'discover':
        // Discover tab - handled separately
        return;
      case 'saved':
        // Saved tab - show all saved posts
        tabContentTypes = filterState.contentTypes;
        break;
      case 'all':
      default:
        tabContentTypes = filterState.contentTypes;
        break;
    }

    console.log(`📊 Tab: ${tab}, Tab content types:`, tabContentTypes);

    // Check if additional filters are active
    const hasContentFilter = filterState.contentTypes.length > 0 && filterState.contentTypes.length < 7;
    const hasPeriodFilter = filterState.period !== 'all';
    const hasInstituteFilter = filterState.instituteTypes.length > 0;
    const hasTabFilter = tab !== 'all' && tab !== 'saved';

    console.log(`📊 Filters active - Content: ${hasContentFilter}, Period: ${hasPeriodFilter}, Institute: ${hasInstituteFilter}, Tab: ${hasTabFilter}`);

    // If no filters at all, show all posts
    if (!hasContentFilter && !hasPeriodFilter && !hasInstituteFilter && !hasTabFilter) {
      console.log('📊 No filters active, showing all posts');
      allPosts.forEach(post => {
        post.style.display = '';
      });

      // Hide empty state if exists
      const emptyState = feedContent.querySelector('.feed-empty');
      if (emptyState) {
        emptyState.style.display = 'none';
      }
      return;
    }

    // Apply filters to each post
    let visibleCount = 0;
    allPosts.forEach(post => {
      let shouldShow = true;
      const postType = post.getAttribute('data-post-type');

      // Filter by tab first
      if (hasTabFilter) {
        if (!tabContentTypes.includes(postType)) {
          shouldShow = false;
        }
      }

      // Filter by content type (if additional filters applied)
      if (hasContentFilter && shouldShow) {
        if (!filterState.contentTypes.includes(postType)) {
          shouldShow = false;
        }
      }

      // Filter by period
      if (hasPeriodFilter && shouldShow) {
        const postDate = post.getAttribute('data-created-at');
        if (postDate) {
          const createdAt = new Date(postDate);
          const now = new Date();

          switch (filterState.period) {
            case 'today':
              const today = new Date(now.setHours(0, 0, 0, 0));
              if (createdAt < today) shouldShow = false;
              break;
            case 'week':
              const weekAgo = new Date(now.setDate(now.getDate() - 7));
              if (createdAt < weekAgo) shouldShow = false;
              break;
            case 'month':
              const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
              if (createdAt < monthAgo) shouldShow = false;
              break;
          }
        }
      }

      // Show or hide post
      post.style.display = shouldShow ? '' : 'none';
      if (shouldShow) visibleCount++;
    });

    console.log(`📊 Visible posts after filtering: ${visibleCount}`);

    // Check if any posts are visible
    let emptyState = feedContent.querySelector('.feed-empty');

    if (visibleCount === 0) {
      // Create or update empty state for filters
      if (!emptyState) {
        emptyState = document.createElement('div');
        emptyState.className = 'feed-empty';
        feedContent.appendChild(emptyState);
      }

      // Custom message for filtered results
      emptyState.innerHTML = `
        <div class="empty-state-icon">
          <i class="fas fa-filter"></i>
        </div>
        <h3>Nessun contenuto trovato</h3>
        <p>Non ci sono post che corrispondono ai filtri selezionati.</p>
        <p class="empty-state-hint">Prova a modificare i filtri o a rimuoverli per vedere più contenuti.</p>
      `;
      emptyState.style.display = 'flex';
    } else if (emptyState) {
      emptyState.style.display = 'none';
    }
  }

  /**
   * Count posts matching filters (for live preview)
   */
  countMatchingPosts(filterState) {
    const feedContent = document.getElementById('feed-content');
    if (!feedContent) return 0;

    const allPosts = feedContent.querySelectorAll('.feed-post');

    // If no filters, return all posts
    const hasContentFilter = filterState.contentTypes.length > 0 && filterState.contentTypes.length < 7;
    const hasPeriodFilter = filterState.period !== 'all';
    const hasInstituteFilter = filterState.instituteTypes.length > 0;

    if (!hasContentFilter && !hasPeriodFilter && !hasInstituteFilter) {
      return allPosts.length;
    }

    // Count matching posts
    let count = 0;
    allPosts.forEach(post => {
      let matches = true;

      // Check content type
      if (hasContentFilter) {
        const postType = post.getAttribute('data-post-type');
        if (!filterState.contentTypes.includes(postType)) {
          matches = false;
        }
      }

      // Check period
      if (hasPeriodFilter && matches) {
        const postDate = post.getAttribute('data-created-at');
        if (postDate) {
          const createdAt = new Date(postDate);
          const now = new Date();

          switch (filterState.period) {
            case 'today':
              const today = new Date(now.setHours(0, 0, 0, 0));
              if (createdAt < today) matches = false;
              break;
            case 'week':
              const weekAgo = new Date(now.setDate(now.getDate() - 7));
              if (createdAt < weekAgo) matches = false;
              break;
            case 'month':
              const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
              if (createdAt < monthAgo) matches = false;
              break;
          }
        }
      }

      if (matches) count++;
    });

    return count;
  }
}

/**
 * Initialize homepage when script loads
 */
(() => {
  // Initialize the homepage application
  window.eduNetHomepage = new EduNetHomepage();

  console.log('🏠 EduNet19 Homepage - Script loaded successfully');
})();