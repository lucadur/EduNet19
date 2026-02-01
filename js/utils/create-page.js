/**
 * ===================================================================
 * CREATE PAGE SCRIPT - EduNet19
 * JavaScript per la pagina di creazione contenuti
 * ===================================================================
 */

class CreatePage {
  constructor() {
    console.log('🚀🚀🚀 CREATE PAGE V2.0 - GALLERY FIX LOADED 🚀🚀🚀');
    this.currentUser = null;
    this.supabase = null;
    this.init();
  }

  async init() {
    console.log('📝 CreatePage initializing...');

    // Wait for Supabase client
    await this.initSupabase();

    // Check authentication
    await this.checkAuthentication();

    // Load avatar in navbar
    if (window.avatarManager) {
      await window.avatarManager.loadCurrentUserAvatar();
    }

    // Setup event listeners
    this.setupEventListeners();

    // Load drafts
    await this.loadDrafts();

    console.log('✅ CreatePage initialized');
  }

  async initSupabase() {
    if (window.supabaseClientManager) {
      this.supabase = await window.supabaseClientManager.getClient();
      const { data: { user } } = await this.supabase.auth.getUser();
      this.currentUser = user;
    }
  }

  async checkAuthentication() {
    if (!this.currentUser) {
      console.log('User not authenticated, redirecting to login');
      window.location.href = window.AppConfig.getPageUrl('index.html');
      return;
    }

    // Check if user is an institute OR a collaborator with edit rights
    const { data: profile } = await this.supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', this.currentUser.id)
      .single();

    let canCreate = profile?.user_type === 'istituto';

    // Se non è un istituto, controlla se è un collaboratore
    if (!canCreate) {
      const { data: collabData } = await this.supabase.rpc('get_collaborator_profile');
      if (collabData?.is_collaborator && (collabData.role === 'admin' || collabData.role === 'editor')) {
        canCreate = true;
        // Salva i dati del collaboratore per uso successivo
        this.collaboratorData = collabData;
        console.log('👥 Collaboratore autorizzato a creare contenuti:', collabData);
      }
    }

    if (!canCreate) {
      alert('Solo gli istituti scolastici e i loro collaboratori possono creare contenuti');
      window.location.href = window.AppConfig.getPageUrl('homepage.html');
      return;
    }

    // Load and display user profile info
    await this.loadUserProfile();
  }

  async loadUserProfile() {
    try {
      if (!this.supabase || !this.currentUser) return;

      // Get user profile first
      const { data: profile, error: profileError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        return;
      }

      let displayName = 'Utente';
      let userType = 'Utente';

      // Prima controlla se è un collaboratore
      if (this.collaboratorData) {
        // È un collaboratore - mostra il suo nome e ruolo
        const roleLabels = {
          'admin': 'Amministratore',
          'editor': 'Editor',
          'viewer': 'Visualizzatore'
        };
        displayName = `${this.collaboratorData.first_name || ''} ${this.collaboratorData.last_name || ''}`.trim() || 'Collaboratore';
        userType = `${roleLabels[this.collaboratorData.role] || 'Collaboratore'} - ${this.collaboratorData.institute_name}`;
        console.log('👥 Profilo collaboratore caricato:', displayName, userType);
      }
      // Load institute or private user data based on user_type
      else if (profile.user_type === 'istituto') {
        const { data: institute, error: instError } = await this.supabase
          .from('school_institutes')
          .select('institute_name, institute_type')
          .eq('id', this.currentUser.id)
          .maybeSingle();

        if (!instError && institute) {
          displayName = institute.institute_name || 'Istituto';
          userType = institute.institute_type || 'Istituto Scolastico';
        }
      } else if (profile.user_type === 'privato') {
        // Controlla se è un collaboratore (caso in cui collaboratorData non è stato impostato)
        const { data: collabData } = await this.supabase.rpc('get_collaborator_profile');

        if (collabData?.is_collaborator) {
          const roleLabels = {
            'admin': 'Amministratore',
            'editor': 'Editor',
            'viewer': 'Visualizzatore'
          };
          displayName = `${collabData.first_name || ''} ${collabData.last_name || ''}`.trim() || 'Collaboratore';
          userType = `${roleLabels[collabData.role] || 'Collaboratore'} - ${collabData.institute_name}`;
          this.collaboratorData = collabData;
        } else {
          const { data: privateUser, error: userError } = await this.supabase
            .from('private_users')
            .select('first_name, last_name')
            .eq('id', this.currentUser.id)
            .maybeSingle();

          if (!userError && privateUser) {
            const firstName = privateUser.first_name || '';
            const lastName = privateUser.last_name || '';
            displayName = `${firstName} ${lastName}`.trim() || 'Utente Privato';
            userType = 'Utente Privato';
          }
        }
      }

      // Update desktop navbar
      const userName = document.getElementById('user-name');
      const userFullName = document.getElementById('user-full-name');
      const userTypeDisplay = document.getElementById('user-type-display');

      if (userName) userName.textContent = displayName;
      if (userFullName) userFullName.textContent = displayName;
      if (userTypeDisplay) userTypeDisplay.textContent = userType;

      // Update mobile menu
      const mobileUserName = document.getElementById('mobile-user-name');
      const mobileUserType = document.getElementById('mobile-user-type');

      if (mobileUserName) mobileUserName.textContent = displayName;
      if (mobileUserType) mobileUserType.textContent = userType;

      console.log('✅ User profile loaded:', displayName);
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  }

  setupEventListeners() {
    // Logout buttons (desktop and mobile)
    const logoutBtn = document.getElementById('logout-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout');

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // Setup all dropdowns
    this.setupDropdowns();

    // Setup category filter links
    this.setupCategoryFilters();

    // Mobile menu toggle
    this.setupMobileMenu();

    // Search functionality
    this.setupSearch();

    // Mobile search
    if (window.mobileSearch) {
      window.mobileSearch.init();
    }
  }

  setupDropdowns() {
    const dropdownTriggers = document.querySelectorAll('.nav-item.dropdown');

    dropdownTriggers.forEach(trigger => {
      const button = trigger.querySelector('.nav-button');
      if (button) {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          // Close other dropdowns
          document.querySelectorAll('.nav-item.dropdown.open').forEach(item => {
            if (item !== trigger) item.classList.remove('open');
          });
          // Toggle current dropdown
          trigger.classList.toggle('open');
        });
      }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
      document.querySelectorAll('.nav-item.dropdown.open').forEach(item => {
        item.classList.remove('open');
      });
    });
  }

  setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileMenuClose = document.getElementById('mobile-menu-close');

    if (mobileMenuToggle && mobileMenuOverlay) {
      mobileMenuToggle.addEventListener('click', () => {
        mobileMenuOverlay.classList.toggle('show');
        mobileMenuToggle.classList.toggle('active');
        document.body.style.overflow = mobileMenuOverlay.classList.contains('show') ? 'hidden' : '';
      });
    }

    if (mobileMenuClose) {
      mobileMenuClose.addEventListener('click', () => {
        mobileMenuOverlay.classList.remove('show');
        mobileMenuToggle.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    // Close on overlay click
    if (mobileMenuOverlay) {
      mobileMenuOverlay.addEventListener('click', (e) => {
        if (e.target === mobileMenuOverlay) {
          mobileMenuOverlay.classList.remove('show');
          mobileMenuToggle.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    }
  }

  setupSearch() {
    const searchInput = document.getElementById('global-search');
    const searchClear = document.querySelector('.search-clear');
    const searchResults = document.getElementById('search-results');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        // Show/hide clear button
        if (searchClear) {
          searchClear.style.display = query ? 'block' : 'none';
        }

        // Show/hide results
        if (searchResults) {
          searchResults.style.display = query ? 'block' : 'none';
        }

        // Perform search (debounced)
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          if (query) {
            this.performSearch(query);
          }
        }, 300);
      });

      searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim() && searchResults) {
          searchResults.style.display = 'block';
        }
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchClear.style.display = 'none';
        }
        if (searchResults) {
          searchResults.style.display = 'none';
        }
      });
    }

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
      if (searchResults && !e.target.closest('.nav-search')) {
        searchResults.style.display = 'none';
      }
    });
  }

  async performSearch(query) {
    const searchResults = document.getElementById('search-results');
    if (!searchResults) return;

    // Show loading state
    searchResults.innerHTML = '<div class="search-loading">Ricerca in corso...</div>';

    try {
      console.log('Searching for:', query);

      const results = [];

      // Search profiles (institutes and users) - IDENTICO ALLA HOMEPAGE
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
                  .maybeSingle();

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
                results.push({
                  type: 'institute',
                  name: profile.school_institutes.institute_name,
                  location: profile.school_institutes.city || 'Posizione non specificata',
                  id: profile.id,
                  avatarUrl: avatarUrl
                });
              } else if (profile.user_type === 'privato' && profile.private_users) {
                // 🔒 PRIVACY: Ricerca utenti privati disabilitata
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

      // Search posts with tags support - IDENTICO ALLA HOMEPAGE
      if (this.supabase || window.supabaseClientManager) {
        try {
          console.log('Searching posts with Supabase...');
          const supabase = this.supabase || await window.supabaseClientManager.getClient();

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
                  author_id: post.institute_id,
                  authorId: post.institute_id, // Add this for avatar consistency
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

      // Display results - IDENTICO ALLA HOMEPAGE
      this.displaySearchResults(results);

    } catch (error) {
      console.error('Search error:', error);
      this.displaySearchResults([]);
    }
  }

  /**
   * Display search results - IDENTICO ALLA HOMEPAGE
   */
  displaySearchResults(results) {
    const searchResults = document.getElementById('search-results');
    if (!searchResults) return;

    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="search-no-results">
          <i class="fas fa-database" aria-hidden="true"></i>
          <p>Nessun risultato trovato nel database</p>
          <small>Assicurati che il database Supabase sia configurato correttamente</small>
        </div>
      `;
    } else {
      searchResults.innerHTML = results.map(result => {
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

      // Add click handlers
      searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const resultType = item.dataset.type;
          const resultId = item.dataset.id;

          console.log('Search - Clicked result:', resultType, resultId);

          // Handle navigation
          if (resultType === 'institute' || resultType === 'user') {
            window.location.href = window.AppConfig.getPageUrl(`pages/profile/profile.html?id=${resultId}`);
          } else if (resultType === 'post') {
            window.location.href = window.AppConfig.getPageUrl(`homepage.html#post/${resultId}`);
          }
        });
      });
    }
  }

  /**
   * Get post type info - IDENTICO ALLA HOMEPAGE
   */
  getPostTypeInfo(postType) {
    const typeMap = {
      'post': { label: 'Post', icon: 'fas fa-align-left', class: 'badge-post' },
      'project': { label: 'Progetto', icon: 'fas fa-lightbulb', class: 'badge-project' },
      'methodology': { label: 'Metodologia', icon: 'fas fa-book-open', class: 'badge-methodology' },
      'event': { label: 'Galleria', icon: 'fas fa-images', class: 'badge-gallery' },
      'collaboration': { label: 'Collaborazione', icon: 'fas fa-handshake', class: 'badge-collaboration' },
      'educational_experience': { label: 'Esperienza', icon: 'fas fa-graduation-cap', class: 'badge-educational' }
    };

    return typeMap[postType] || typeMap['post'];
  }

  openCreationModal(type) {
    console.log('Opening creation modal for type:', type);

    // Salva la posizione di scroll corrente
    this.scrollPosition = window.pageYOffset;

    // Open specific modal based on type
    const modal = document.getElementById(`modal-${type}`);
    if (modal) {
      modal.style.display = 'flex';

      // Blocca lo scroll del body
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      document.body.style.top = `-${this.scrollPosition}px`;

      // Setup form submission
      const form = document.getElementById(`form-${type}`);
      if (form) {
        form.onsubmit = (e) => {
          e.preventDefault();
          this.handleFormSubmit(type, form);
        };
      }
    } else {
      console.warn(`Modal for type "${type}" not found, using fallback`);
      // Fallback to social features modal for other types
      if (window.eduNetSocial) {
        window.eduNetSocial.showCreatePostModal(type);
      } else {
        console.error('Social features not available');
        this.showNotification('Sistema non disponibile, riprova più tardi', 'error');
      }
    }
  }

  async handleFormSubmit(type, form) {
    console.log(`Submitting ${type} form`);

    try {
      // Get form data
      const formData = new FormData(form);
      const data = {};

      // Get all form fields (excluding files)
      for (let [key, value] of formData.entries()) {
        if (!(value instanceof File)) {
          data[key] = value;
        }
      }

      console.log('Form data:', data);

      // Handle file uploads for gallery
      if (type === 'gallery') {
        const fileInput = form.querySelector('input[type="file"][name="images"]');
        if (fileInput && fileInput.files.length > 0) {
          data.imageFiles = Array.from(fileInput.files);
          console.log(`Found ${data.imageFiles.length} images to upload`);

          // Show upload progress overlay
          this.showUploadProgress(data.imageFiles.length);
        } else {
          throw new Error('Nessuna immagine selezionata');
        }
      }

      // Publish to Supabase
      const result = await this.publishContent(type, data);

      if (result.error) {
        throw result.error;
      }

      // Hide upload progress
      if (type === 'gallery') {
        this.hideUploadProgress();
      }

      // Show success message
      this.showNotification(`${this.getTypeLabel(type)} pubblicato con successo!`, 'success');

      // Close modal
      window.closeCreationModal(type);

      // Reset form
      form.reset();

      // Redirect to homepage to see the new content
      setTimeout(() => {
        window.location.href = window.AppConfig.getPageUrl('homepage.html');
      }, 1500);

    } catch (error) {
      console.error('Error publishing content:', error);
      this.hideUploadProgress();
      this.showNotification('Errore durante la pubblicazione. Riprova.', 'error');
    }
  }

  showUploadProgress(totalImages) {
    const overlay = document.getElementById('gallery-upload-progress');
    const submitBtn = document.getElementById('gallery-submit-btn');

    if (overlay) {
      overlay.style.display = 'flex';
      this.updateUploadProgress(0, totalImages);
    }

    if (submitBtn) {
      submitBtn.disabled = true;
    }
  }

  updateUploadProgress(current, total) {
    const progressFill = document.getElementById('upload-progress-fill');
    const progressCount = document.getElementById('upload-progress-count');
    const statusText = document.getElementById('upload-status-text');

    const percentage = (current / total) * 100;

    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }

    if (progressCount) {
      progressCount.textContent = `${current} / ${total} immagini`;
    }

    if (statusText && current < total) {
      statusText.textContent = 'Compressione e upload delle immagini...';
    } else if (statusText) {
      statusText.textContent = 'Finalizzazione...';
    }
  }

  hideUploadProgress() {
    const overlay = document.getElementById('gallery-upload-progress');
    const submitBtn = document.getElementById('gallery-submit-btn');

    if (overlay) {
      overlay.style.display = 'none';
    }

    if (submitBtn) {
      submitBtn.disabled = false;
    }
  }

  async publishContent(type, formData) {
    if (!this.supabase || !this.currentUser) {
      throw new Error('Non autenticato');
    }

    // Map content type to post_type (database expects English values)
    const typeMapping = {
      'post': 'post',
      'project': 'project',
      'methodology': 'methodology',
      'gallery': 'event',
      'experience': 'educational_experience', // ✅ FIX: Corretto da 'news' a 'educational_experience'
      'collaboration': 'collaboration' // ✅ FIX: Corretto da 'project' a 'collaboration'
    };

    const postType = typeMapping[type] || 'post';

    // Prepare post data
    const postData = {
      institute_id: this.currentUser.id,
      title: formData.title,
      content: formData.description || formData.content || formData.context || '',
      post_type: postType,
      category: formData.category || formData.type || type,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
      published: true,
      published_at: new Date().toISOString()
    };

    // Handle gallery images upload
    if (type === 'gallery' && formData.imageFiles && formData.imageFiles.length > 0) {
      console.log(`Uploading ${formData.imageFiles.length} images...`);
      const uploadedUrls = [];
      const totalImages = Math.min(formData.imageFiles.length, 20);

      for (let i = 0; i < totalImages; i++) {
        const file = formData.imageFiles[i];

        try {
          // Compress image if larger than 1MB
          let fileToUpload = file;
          if (file.size > 1024 * 1024) { // 1MB
            console.log(`📦 Compressing image ${i + 1} (${(file.size / 1024 / 1024).toFixed(2)}MB)...`);

            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              fileType: file.type,
              initialQuality: 0.8,  // Faster compression
              alwaysKeepResolution: false
            };

            fileToUpload = await imageCompression(file, options);
            console.log(`✅ Image ${i + 1} compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
          }

          const fileExt = fileToUpload.name.split('.').pop();
          const fileName = `${this.currentUser.id}/${Date.now()}_${i}.${fileExt}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await this.supabase.storage
            .from('post-images')
            .upload(fileName, fileToUpload, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error(`Error uploading image ${i}:`, uploadError);
            continue;
          }

          // Get public URL
          const { data: { publicUrl } } = this.supabase.storage
            .from('post-images')
            .getPublicUrl(fileName);

          uploadedUrls.push(publicUrl);
          console.log(`Image ${i + 1} uploaded successfully`);

          // Update progress
          this.updateUploadProgress(i + 1, totalImages);

        } catch (error) {
          console.error(`Error processing image ${i}:`, error);
        }
      }

      // Add images URLs to post data
      if (uploadedUrls.length > 0) {
        postData.image_urls = uploadedUrls;
        postData.image_url = uploadedUrls[0]; // First image as main image
        console.log(`Successfully uploaded ${uploadedUrls.length} images`);
      } else {
        throw new Error('Nessuna immagine caricata con successo');
      }
    }

    // Add type-specific fields - Store ALL form data in attachments JSONB
    // This ensures all fields are preserved and can be displayed in the feed
    if (type === 'project') {
      postData.attachments = {
        type: 'project',
        category: formData.category || '',
        duration: formData.duration || '',
        objectives: formData.objectives || '',
        resources: formData.resources || ''
      };
      // Legacy fields for backward compatibility
      postData.target_audience = formData.duration ? [formData.duration] : [];
      postData.subject_areas = formData.objectives ? [formData.objectives] : [];
    } else if (type === 'methodology') {
      postData.attachments = {
        type: 'methodology',
        methodology_type: formData.type || '',
        level: formData.level || '',
        application: formData.application || '',
        benefits: formData.benefits || ''
      };
      postData.target_audience = formData.level ? [formData.level] : [];
      postData.subject_areas = formData.application ? [formData.application] : [];
    } else if (type === 'collaboration') {
      postData.attachments = {
        type: 'collaboration',
        collaboration_type: formData.type || '',
        duration: formData.duration || '',
        looking_for: formData.looking_for || '',
        benefits: formData.benefits || ''
      };
      postData.target_audience = formData.looking_for ? [formData.looking_for] : [];
      postData.subject_areas = formData.benefits ? [formData.benefits] : [];
    } else if (type === 'experience') {
      postData.attachments = {
        type: 'experience',
        experience_type: formData.type || '',
        date: formData.date || '',
        context: formData.context || '',
        learnings: formData.learnings || ''
      };
      postData.target_audience = formData.date ? [formData.date] : [];
      postData.subject_areas = formData.learnings ? [formData.learnings] : [];
    } else if (type === 'gallery') {
      postData.attachments = {
        type: 'gallery'
      };
    } else if (type === 'post') {
      postData.attachments = {
        type: 'post'
      };
    }

    // Insert into database
    const { data, error } = await this.supabase
      .from('institute_posts')
      .insert([postData])
      .select()
      .single();

    return { data, error };
  }

  getTypeLabel(type) {
    const labels = {
      'post': 'Post',
      'project': 'Progetto',
      'methodology': 'Metodologia',
      'gallery': 'Galleria',
      'experience': 'Esperienza',
      'collaboration': 'Collaborazione'
    };
    return labels[type] || 'Contenuto';
  }

  showNotification(message, type = 'info') {
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  async loadDrafts() {
    try {
      if (!this.supabase || !this.currentUser) return;

      // Load drafts from database (if you have a drafts table)
      // For now, we'll hide the section if no drafts
      const draftsSection = document.getElementById('drafts-section');
      if (draftsSection) {
        draftsSection.style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  }

  viewAllDrafts() {
    // Navigate to drafts page or show drafts modal
    console.log('View all drafts');
    this.showNotification('Funzionalità bozze in arrivo!', 'info');
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

  setupCategoryFilters() {
    // Get all filter links (both desktop sidebar and mobile menu)
    const filterLinks = document.querySelectorAll('[data-filter]');

    filterLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const filterType = link.dataset.filter;

        console.log('Filtering by:', filterType);

        // Redirect to homepage with filter parameter
        window.location.href = window.AppConfig.getPageUrl(`homepage.html?filter=${filterType}`);
      });
    });
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: calc(var(--top-nav-height) + var(--space-4));
      right: var(--space-4);
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: var(--space-4) var(--space-6);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      z-index: 9999;
      animation: slideInRight 0.3s ease-out;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: var(--space-3);">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.createPage = new CreatePage();
  });
} else {
  window.createPage = new CreatePage();
}

console.log('📝 Create Page - Script loaded successfully');


// Global function to close creation modals
window.closeCreationModal = function (type) {
  const modal = document.getElementById(`modal-${type}`);
  if (modal) {
    modal.style.display = 'none';

    // Ripristina lo scroll del body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.top = '';

    // Ripristina la posizione di scroll
    if (window.createPage && window.createPage.scrollPosition !== undefined) {
      window.scrollTo(0, window.createPage.scrollPosition);
    }
  }
};

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const openModals = document.querySelectorAll('.creation-modal[style*="display: flex"]');
    openModals.forEach(modal => {
      modal.style.display = 'none';
    });

    // Ripristina lo scroll del body se c'erano modal aperti
    if (openModals.length > 0) {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.top = '';

      if (window.createPage && window.createPage.scrollPosition !== undefined) {
        window.scrollTo(0, window.createPage.scrollPosition);
      }
    }
  }
});
