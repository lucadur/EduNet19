/* ===================================================================
   EDIT PROFILE SCRIPT - EduNet19_2
   JavaScript for edit-profile.html
   =================================================================== */

class EditProfilePage {
  constructor() {
    this.currentUser = null;
    this.supabase = null;
    this.userType = null;
    this.methodologies = [];
    this.interests = [];
    this.coverImage = null;
    this.avatarImage = null;

    this.init();
  }

  async init() {
    console.log('✏️ EditProfilePage initializing...');

    // Wait for Supabase client
    await this.initSupabase();

    // Load current profile data
    await this.loadProfileData();

    // Load avatar in navbar
    if (window.avatarManager) {
      await window.avatarManager.loadCurrentUserAvatar();
    }

    // Setup event listeners
    this.setupEventListeners();

    // Initialize Collaborators Manager (solo per istituti)
    await this.initCollaborators();

    console.log('✅ EditProfilePage initialized');
  }

  async initCollaborators() {
    console.log('👥 initCollaborators - userType:', this.userType, 'collaboratorData:', this.collaboratorData);

    // Determina se può gestire collaboratori
    // - Istituti: sempre
    // - Collaboratori admin: possono gestire altri collaboratori
    let canManageCollaborators = this.userType === 'istituto';
    let instituteIdToManage = this.currentUser?.id;

    if (!canManageCollaborators && this.collaboratorData?.is_collaborator && this.collaboratorData.role === 'admin') {
      canManageCollaborators = true;
      instituteIdToManage = this.collaboratorData.institute_id;
      console.log('👥 Collaboratore admin può gestire collaboratori per istituto:', this.collaboratorData.institute_name);
    }

    if (!canManageCollaborators) {
      const collabSection = document.getElementById('collaborators-section');
      if (collabSection) {
        collabSection.style.display = 'none';
        console.log('👥 Sezione collaboratori nascosta (non autorizzato)');
      }
      return;
    }

    // Mostra la sezione collaboratori
    const collabSection = document.getElementById('collaborators-section');
    if (collabSection) {
      collabSection.style.display = '';
      console.log('👥 Sezione collaboratori visibile');
    }

    // Inizializza il manager collaboratori
    if (window.CollaboratorsManager && instituteIdToManage) {
      console.log('👥 Inizializzazione CollaboratorsManager per istituto:', instituteIdToManage);
      this.collaboratorsManager = new window.CollaboratorsManager();
      await this.collaboratorsManager.init(instituteIdToManage);
    } else {
      console.warn('👥 CollaboratorsManager non disponibile:', {
        hasManager: !!window.CollaboratorsManager,
        hasInstituteId: !!instituteIdToManage
      });
    }
  }

  async initSupabase() {
    if (window.supabaseClientManager) {
      this.supabase = await window.supabaseClientManager.getClient();
      const { data: { user } } = await this.supabase.auth.getUser();
      this.currentUser = user;
    }
  }

  setupEventListeners() {
    // Form submission
    const form = document.getElementById('edit-profile-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Image uploads
    this.setupImageUploads();

    // Tags input
    this.setupTagsInput('methodologies');
    this.setupTagsInput('interests');

    // Character count - Bio istituto
    const bioField = document.getElementById('bio');
    if (bioField) {
      bioField.addEventListener('input', (e) => {
        const count = document.getElementById('bio-count');
        if (count) count.textContent = e.target.value.length;
      });
    }

    // Character count - Bio utente privato
    const privateBioField = document.getElementById('private-bio');
    if (privateBioField) {
      privateBioField.addEventListener('input', (e) => {
        const count = document.getElementById('private-bio-count');
        if (count) count.textContent = e.target.value.length;
      });
    }

    // Character count - Regolamento interno
    const regulationsField = document.getElementById('regulations-text');
    if (regulationsField) {
      regulationsField.addEventListener('input', (e) => {
        const count = document.getElementById('regulations-count');
        if (count) count.textContent = e.target.value.length;
      });
    }

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

  setupImageUploads() {
    // Cover image
    const coverUpload = document.getElementById('cover-upload');
    const coverPreview = document.getElementById('cover-preview');
    const removeCover = document.getElementById('remove-cover');

    if (coverPreview && coverUpload) {
      coverPreview.addEventListener('click', () => coverUpload.click());
      coverUpload.addEventListener('change', (e) => this.handleImageUpload(e, 'cover'));
    }

    if (removeCover) {
      removeCover.addEventListener('click', () => {
        this.coverImage = null;
        coverPreview.innerHTML = '<i class="fas fa-image" aria-hidden="true"></i><p>Clicca per caricare</p>';
        removeCover.style.display = 'none';
      });
    }

    // Avatar image
    const avatarUpload = document.getElementById('avatar-upload');
    const avatarPreview = document.getElementById('avatar-preview');
    const removeAvatar = document.getElementById('remove-avatar');

    if (avatarPreview && avatarUpload) {
      avatarPreview.addEventListener('click', () => avatarUpload.click());
      avatarUpload.addEventListener('change', (e) => this.handleImageUpload(e, 'avatar'));
    }

    if (removeAvatar) {
      removeAvatar.addEventListener('click', () => {
        this.avatarImage = null;
        avatarPreview.innerHTML = '<i class="fas fa-user" aria-hidden="true"></i>';
        removeAvatar.style.display = 'none';
      });
    }
  }

  handleImageUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Per favore seleziona un file immagine valido');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'immagine deve essere inferiore a 5MB');
      return;
    }

    // Store the file object for upload
    if (type === 'cover') {
      this.coverImage = file;
    } else if (type === 'avatar') {
      this.avatarImage = file;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'cover') {
        const preview = document.getElementById('cover-preview');
        preview.style.backgroundImage = `url(${e.target.result})`;
        preview.style.backgroundSize = 'cover';
        preview.style.backgroundPosition = 'center top';
        preview.innerHTML = '';
        document.getElementById('remove-cover').style.display = 'block';
      } else if (type === 'avatar') {
        const preview = document.getElementById('avatar-preview');
        preview.style.backgroundImage = `url(${e.target.result})`;
        preview.style.backgroundSize = 'cover';
        preview.style.backgroundPosition = 'center';
        preview.innerHTML = '';
        document.getElementById('remove-avatar').style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }

  setupTagsInput(type) {
    const input = document.getElementById(`${type}-input`);
    const display = document.getElementById(`${type}-display`);

    if (!input || !display) return;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = input.value.trim();
        if (value) {
          this.addTag(type, value);
          input.value = '';
        }
      }
    });
  }

  addTag(type, value) {
    const tags = type === 'methodologies' ? this.methodologies : this.interests;

    if (!tags.includes(value)) {
      tags.push(value);
      this.renderTags(type);
    }
  }

  removeTag(type, value) {
    if (type === 'methodologies') {
      this.methodologies = this.methodologies.filter(tag => tag !== value);
    } else {
      this.interests = this.interests.filter(tag => tag !== value);
    }
    this.renderTags(type);
  }

  renderTags(type) {
    const display = document.getElementById(`${type}-display`);
    const tags = type === 'methodologies' ? this.methodologies : this.interests;

    if (!display) return;

    display.innerHTML = tags.map(tag => `
      <span class="tag">
        ${tag}
        <button type="button" class="remove-tag" onclick="window.editProfilePage.removeTag('${type}', '${tag}')" aria-label="Rimuovi ${tag}">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </span>
    `).join('');
  }

  async loadProfileData() {
    try {
      if (!this.supabase || !this.currentUser) {
        console.log('No user logged in');
        return;
      }

      console.log('Loading profile data...');

      // 1️⃣ Prima controlla user_profiles per il tipo
      const { data: userProfile, error: profileError } = await this.supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', this.currentUser.id)
        .single();

      if (profileError) {
        console.error('Error loading user profile:', profileError);
        return;
      }

      if (!userProfile) {
        console.error('User profile not found');
        return;
      }

      let userType = userProfile.user_type;
      console.log('User type:', userType);

      // Store user type for later use
      this.userType = userType;

      // 2️⃣ Controlla se è un collaboratore
      const { data: collabData } = await this.supabase.rpc('get_collaborator_profile');

      if (collabData?.is_collaborator) {
        console.log('👥 Utente è un collaboratore:', collabData);
        this.collaboratorData = collabData;

        // Aggiorna la navbar con i dati del collaboratore
        this.updateNavbarForCollaborator(collabData);
      }

      // 3️⃣ Carica dati dalla tabella corretta
      if (userType === 'istituto') {
        await this.loadInstituteProfile();
      } else {
        await this.loadPrivateUserProfile();
      }

      // 4️⃣ Nascondi/Mostra campi in base al tipo
      this.adjustFormForUserType(userType);

    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  async loadInstituteProfile() {
    try {
      const { data: profile, error } = await this.supabase
        .from('school_institutes')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();

      if (error) throw error;

      if (profile) {
        this.populateInstituteForm(profile);
      }
    } catch (error) {
      console.error('Error loading institute profile:', error);
    }
  }

  async loadPrivateUserProfile() {
    try {
      const { data: profile, error } = await this.supabase
        .from('private_users')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();

      if (error) throw error;

      if (profile) {
        this.populatePrivateUserForm(profile);
      }
    } catch (error) {
      console.error('Error loading private user profile:', error);
    }
  }

  populateInstituteForm(profile) {
    // Basic info
    this.setValue('institute-name', profile.institute_name);
    this.setValue('institute-type', profile.institute_type);
    this.setValue('bio', profile.bio);

    if (profile.bio) {
      const bioCount = document.getElementById('bio-count');
      if (bioCount) bioCount.textContent = profile.bio.length;
    }

    // Contact info
    this.setValue('email', profile.email);
    this.setValue('phone', profile.phone);
    this.setValue('website', profile.website);
    this.setValue('address', profile.address);
    this.setValue('city', profile.city);
    this.setValue('province', profile.province);

    // ========== NUOVI CAMPI STRUTTURA E SPAZI ==========

    // Numero aule
    this.setValue('classroom-count', profile.classroom_count);

    // Superficie interna
    this.setValue('internal-area', profile.internal_area_sqm);

    // Spazi esterni
    this.setValue('external-spaces', profile.external_spaces);

    // Orari di apertura (JSON)
    if (profile.opening_hours && typeof profile.opening_hours === 'object') {
      const dayMapping = {
        'lunedi': 'monday',
        'martedi': 'tuesday',
        'mercoledi': 'wednesday',
        'giovedi': 'thursday',
        'venerdi': 'friday',
        'sabato': 'saturday'
      };

      Object.entries(profile.opening_hours).forEach(([dayIt, hours]) => {
        const dayEn = dayMapping[dayIt];
        if (dayEn) {
          this.setValue(`hours-${dayEn}`, hours);
        }
      });
    }

    // Regolamento interno
    this.setValue('regulations-url', profile.internal_regulations_url);
    this.setValue('regulations-text', profile.internal_regulations_text);

    if (profile.internal_regulations_text) {
      const regCount = document.getElementById('regulations-count');
      if (regCount) regCount.textContent = profile.internal_regulations_text.length;
    }

    // ========== FINE NUOVI CAMPI ==========

    // Educational info
    this.setValue('specializations', profile.specializations);

    // Social media
    this.setValue('facebook', profile.facebook);
    this.setValue('twitter', profile.twitter);
    this.setValue('instagram', profile.instagram);
    this.setValue('linkedin', profile.linkedin);

    // Cover image
    if (profile.cover_image) {
      const coverPreview = document.getElementById('cover-preview');
      if (coverPreview) {
        coverPreview.style.backgroundImage = `url(${profile.cover_image})`;
        coverPreview.style.backgroundSize = 'cover';
        coverPreview.style.backgroundPosition = 'center top';
        coverPreview.innerHTML = '';
        const removeCover = document.getElementById('remove-cover');
        if (removeCover) removeCover.style.display = 'block';
      }
    }

    // Avatar (logo_url per istituti)
    if (profile.logo_url && !profile.logo_url.includes('Glutatione') && !profile.logo_url.includes('cover')) {
      const avatarPreview = document.getElementById('avatar-preview');
      if (avatarPreview) {
        avatarPreview.style.backgroundImage = `url(${profile.logo_url})`;
        avatarPreview.style.backgroundSize = 'cover';
        avatarPreview.style.backgroundPosition = 'center';
        avatarPreview.innerHTML = '';
        const removeAvatar = document.getElementById('remove-avatar');
        if (removeAvatar) removeAvatar.style.display = 'block';
      }
    }

    // Tags
    if (profile.methodologies && Array.isArray(profile.methodologies)) {
      this.methodologies = profile.methodologies;
      this.renderTags('methodologies');
    }

    if (profile.interests && Array.isArray(profile.interests)) {
      this.interests = profile.interests;
      this.renderTags('interests');
    }

    // Update user name in navbar
    const userName = document.getElementById('user-name');
    const userFullName = document.getElementById('user-full-name');
    const userTypeDisplay = document.getElementById('user-type-display');

    if (userName) userName.textContent = profile.institute_name || 'Utente';
    if (userFullName) userFullName.textContent = profile.institute_name || 'Utente';
    if (userTypeDisplay) userTypeDisplay.textContent = profile.institute_type || 'Istituto Scolastico';
  }

  populatePrivateUserForm(profile) {
    // Nome e cognome
    this.setValue('first-name', profile.first_name);
    this.setValue('last-name', profile.last_name);

    // Bio per utenti privati usa ID diverso
    this.setValue('private-bio', profile.bio);

    if (profile.bio) {
      const bioCount = document.getElementById('private-bio-count');
      if (bioCount) bioCount.textContent = profile.bio.length;
    }

    // Contatti (commentati perché non nel form privati)
    // this.setValue('email', profile.email);
    // this.setValue('phone', profile.phone);

    // Avatar (avatar_url per utenti privati)
    if (profile.avatar_url) {
      const avatarPreview = document.getElementById('avatar-preview');
      if (avatarPreview) {
        avatarPreview.style.backgroundImage = `url(${profile.avatar_url})`;
        avatarPreview.style.backgroundSize = 'cover';
        avatarPreview.style.backgroundPosition = 'center';
        avatarPreview.innerHTML = '';
        const removeAvatar = document.getElementById('remove-avatar');
        if (removeAvatar) removeAvatar.style.display = 'block';
      }
    }

    // Cover image (cover_image_url per utenti privati)
    if (profile.cover_image_url) {
      const coverPreview = document.getElementById('cover-preview');
      if (coverPreview) {
        coverPreview.style.backgroundImage = `url(${profile.cover_image_url})`;
        coverPreview.style.backgroundSize = 'cover';
        coverPreview.style.backgroundPosition = 'center top';
        coverPreview.innerHTML = '';
        const removeCover = document.getElementById('remove-cover');
        if (removeCover) removeCover.style.display = 'block';
      }
    }

    // Update user name in navbar
    const userName = document.getElementById('user-name');
    const userFullName = document.getElementById('user-full-name');
    const userTypeDisplay = document.getElementById('user-type-display');

    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    if (userName) userName.textContent = profile.first_name || 'Utente';
    if (userFullName) userFullName.textContent = fullName || 'Utente';

    // Se è un collaboratore, mostra il ruolo invece di "Utente Privato"
    if (this.collaboratorData) {
      this.updateNavbarForCollaborator(this.collaboratorData);
    } else if (userTypeDisplay) {
      userTypeDisplay.textContent = 'Utente Privato';
    }
  }

  updateNavbarForCollaborator(collabData) {
    const roleLabels = {
      'admin': 'Amministratore',
      'editor': 'Editor',
      'viewer': 'Visualizzatore'
    };

    const displayName = `${collabData.first_name || ''} ${collabData.last_name || ''}`.trim() || 'Collaboratore';
    const userTypeText = `${roleLabels[collabData.role] || 'Collaboratore'} - ${collabData.institute_name}`;

    const userName = document.getElementById('user-name');
    const userFullName = document.getElementById('user-full-name');
    const userTypeDisplay = document.getElementById('user-type-display');

    if (userName) userName.textContent = displayName;
    if (userFullName) userFullName.textContent = displayName;
    if (userTypeDisplay) userTypeDisplay.textContent = userTypeText;

    // Mobile menu
    const mobileUserName = document.getElementById('mobile-user-name');
    const mobileUserType = document.getElementById('mobile-user-type');

    if (mobileUserName) mobileUserName.textContent = displayName;
    if (mobileUserType) mobileUserType.textContent = userTypeText;

    console.log('👥 Navbar aggiornata per collaboratore:', displayName);
  }

  adjustFormForUserType(userType) {
    console.log('🔧 Adjusting form for user type:', userType);

    // Nascondi o disabilita il campo tipo utente se esiste
    const userTypeField = document.getElementById('user-type');
    if (userTypeField) {
      userTypeField.value = userType;
      userTypeField.disabled = true;
      userTypeField.style.opacity = '0.6';
      userTypeField.style.cursor = 'not-allowed';

      // Aggiungi tooltip
      userTypeField.title = 'Il tipo di utente non può essere modificato';
    }

    // Mostra/nascondi campi specifici in base al tipo
    const instituteFields = document.querySelectorAll('.institute-only');
    const privateFields = document.querySelectorAll('.private-only');

    // Aggiorna anche il titolo della pagina
    const pageHeader = document.querySelector('.page-header .header-content h1');
    const pageSubtitle = document.querySelector('.page-header .header-content p');

    if (userType === 'istituto') {
      // Mostra sezioni istituto, nascondi sezioni private
      instituteFields.forEach(field => field.style.display = '');
      privateFields.forEach(field => field.style.display = 'none');

      if (pageHeader) pageHeader.innerHTML = '<i class="fas fa-edit" aria-hidden="true"></i> Modifica Profilo Istituto';
      if (pageSubtitle) pageSubtitle.textContent = 'Aggiorna le informazioni del tuo istituto scolastico';

      console.log('✅ Form configurato per ISTITUTO');
    } else {
      // Mostra sezioni private, nascondi sezioni istituto
      instituteFields.forEach(field => field.style.display = 'none');
      privateFields.forEach(field => field.style.display = '');

      if (pageHeader) pageHeader.innerHTML = '<i class="fas fa-user-edit" aria-hidden="true"></i> Modifica Profilo';
      if (pageSubtitle) pageSubtitle.textContent = 'Aggiorna le tue informazioni personali';

      console.log('✅ Form configurato per UTENTE PRIVATO');
    }
  }

  setValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field && value) {
      // Per i select, verifica se il valore esiste tra le opzioni
      if (field.tagName === 'SELECT') {
        const options = Array.from(field.options);
        const exactMatch = options.find(opt => opt.value === value);

        if (exactMatch) {
          field.value = value;
        } else {
          // Prova match case-insensitive o parziale
          const valueLower = value.toLowerCase();
          const partialMatch = options.find(opt =>
            opt.value.toLowerCase() === valueLower ||
            opt.value.toLowerCase().includes(valueLower) ||
            valueLower.includes(opt.value.toLowerCase())
          );

          if (partialMatch) {
            field.value = partialMatch.value;
            console.log(`📋 Select "${fieldId}": matched "${value}" → "${partialMatch.value}"`);
          } else {
            console.warn(`⚠️ Select "${fieldId}": no match for "${value}"`);
          }
        }
      } else {
        field.value = value;
      }
    }
  }

  async handleSubmit(event) {
    event.preventDefault();

    const saveBtn = document.getElementById('save-profile-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Salvataggio...';
    }

    try {
      if (!this.supabase || !this.currentUser) {
        throw new Error('User not authenticated');
      }

      // Determina tipo utente
      if (!this.userType) {
        const { data: userProfile } = await this.supabase
          .from('user_profiles')
          .select('user_type')
          .eq('id', this.currentUser.id)
          .single();
        this.userType = userProfile?.user_type;
      }

      // Salva nella tabella corretta
      if (this.userType === 'istituto') {
        await this.saveInstituteProfile();
      } else {
        await this.savePrivateUserProfile();
      }

      // Show success notification
      this.showNotification('Profilo aggiornato con successo!', 'success');

      // Redirect to profile page
      setTimeout(() => {
        window.location.href = window.AppConfig.getPageUrl('pages/profile/profile.html');
      }, 1500);

    } catch (error) {
      console.error('Error saving profile:', error);
      this.showNotification('Errore durante il salvataggio: ' + error.message, 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save" aria-hidden="true"></i> Salva Modifiche';
      }
    }
  }

  async saveInstituteProfile() {
    const formData = this.getFormData();

    // Upload images if they exist
    if (this.coverImage && this.coverImage instanceof File) {
      const coverUrl = await this.uploadImage(this.coverImage, 'cover');
      if (coverUrl) formData.cover_image = coverUrl;
    }

    if (this.avatarImage && this.avatarImage instanceof File) {
      console.log('📤 Uploading avatar...', this.avatarImage.name);
      const avatarUrl = await this.uploadImage(this.avatarImage, 'avatar');
      console.log('📥 Avatar upload result:', avatarUrl);
      if (avatarUrl) {
        formData.logo_url = avatarUrl;
        console.log('✅ Avatar URL set in formData:', avatarUrl);
      }
    }

    console.log('Saving institute profile data:', formData);

    const { error } = await this.supabase
      .from('school_institutes')
      .upsert({
        id: this.currentUser.id,
        ...formData,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  async savePrivateUserProfile() {
    const formData = {};

    // Campi utente privato - SOLO colonne che esistono sicuramente
    const firstName = document.getElementById('first-name')?.value?.trim();
    if (firstName) formData.first_name = firstName;

    const lastName = document.getElementById('last-name')?.value?.trim();
    if (lastName) formData.last_name = lastName;

    // Bio per utenti privati usa ID diverso
    const bio = document.getElementById('private-bio')?.value?.trim();
    if (bio !== undefined) formData.bio = bio || '';

    // ⚠️ NON inviare email e phone se le colonne non esistono
    // const email = document.getElementById('email')?.value?.trim();
    // if (email) formData.email = email;

    // const phone = document.getElementById('phone')?.value?.trim();
    // if (phone) formData.phone = phone;

    // Upload images if they exist
    if (this.coverImage && this.coverImage instanceof File) {
      const coverUrl = await this.uploadImage(this.coverImage, 'cover');
      if (coverUrl) formData.cover_image_url = coverUrl;
    }

    if (this.avatarImage && this.avatarImage instanceof File) {
      console.log('📤 Uploading avatar...', this.avatarImage.name);
      const avatarUrl = await this.uploadImage(this.avatarImage, 'avatar');
      console.log('📥 Avatar upload result:', avatarUrl);
      if (avatarUrl) {
        formData.avatar_url = avatarUrl;
        console.log('✅ Avatar URL set in formData:', avatarUrl);
      }
    }

    console.log('💾 Saving private user profile data:', JSON.stringify(formData, null, 2));
    console.log('🔑 User ID:', this.currentUser.id);

    // Prima verifica se il record esiste
    const { data: existingRecord, error: checkError } = await this.supabase
      .from('private_users')
      .select('id')
      .eq('id', this.currentUser.id)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking record:', checkError);
      throw checkError;
    }

    if (!existingRecord) {
      console.error('❌ Record not found in private_users!');
      console.error('⚠️ Esegui lo script SQL per creare il record');
      throw new Error('Record utente non trovato. Contatta l\'amministratore.');
    }

    console.log('✅ Record exists, proceeding with update...');

    // Usa update
    const { data, error } = await this.supabase
      .from('private_users')
      .update({
        ...formData,
        updated_at: new Date().toISOString()
      })
      .eq('id', this.currentUser.id)
      .select();

    if (error) {
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('✅ Profile saved successfully:', data);
  }

  async uploadImage(file, type) {
    try {
      console.log(`📤 Starting upload for ${type}:`, file.name);

      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;

      // ✅ Bucket e path corretti con cartella user ID
      const bucketName = type === 'avatar' ? 'avatars' : 'profile-images';
      const filePath = `${this.currentUser.id}/${fileName}`; // Cartella user ID per RLS

      console.log(`📦 Uploading to bucket: ${bucketName}, path: ${filePath}`);

      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('❌ Error uploading image:', error);
        this.showNotification(`Errore upload ${type}: ${error.message}`, 'error');
        return null;
      }

      console.log('✅ Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log('🔗 Public URL:', publicUrl);
      return publicUrl;

    } catch (error) {
      console.error('❌ Error in uploadImage:', error);
      this.showNotification(`Errore upload: ${error.message}`, 'error');
      return null;
    }
  }

  getFormData() {
    const data = {};

    // Campi obbligatori - devono sempre essere presenti
    const instituteName = document.getElementById('institute-name')?.value;
    data.institute_name = instituteName || '';

    const instituteType = document.getElementById('institute-type')?.value;
    data.institute_type = instituteType || 'Altro'; // Default se vuoto

    // Campi opzionali - aggiungi solo se il campo esiste nel form
    const bio = document.getElementById('bio')?.value;
    if (bio !== undefined && bio !== null) data.bio = bio;

    const email = document.getElementById('email')?.value;
    if (email) data.email = email;

    const phone = document.getElementById('phone')?.value;
    if (phone) data.phone = phone;

    const website = document.getElementById('website')?.value;
    if (website) data.website = website;

    const address = document.getElementById('address')?.value;
    if (address) data.address = address;

    const city = document.getElementById('city')?.value;
    if (city) data.city = city;

    const province = document.getElementById('province')?.value;
    if (province) data.province = province;

    const specializations = document.getElementById('specializations')?.value;
    if (specializations) data.specializations = specializations;

    // ========== NUOVI CAMPI STRUTTURA E SPAZI ==========

    // Numero aule
    const classroomCount = document.getElementById('classroom-count')?.value;
    if (classroomCount) data.classroom_count = parseInt(classroomCount);

    // Superficie interna
    const internalArea = document.getElementById('internal-area')?.value;
    if (internalArea) data.internal_area_sqm = parseFloat(internalArea);

    // Spazi esterni
    const externalSpaces = document.getElementById('external-spaces')?.value;
    if (externalSpaces) data.external_spaces = externalSpaces;

    // Orari di apertura (JSON)
    const openingHours = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayNames = ['lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];

    days.forEach((day, index) => {
      const hours = document.getElementById(`hours-${day}`)?.value;
      if (hours) openingHours[dayNames[index]] = hours;
    });

    if (Object.keys(openingHours).length > 0) {
      data.opening_hours = openingHours;
    }

    // Regolamento interno
    const regulationsUrl = document.getElementById('regulations-url')?.value;
    if (regulationsUrl) data.internal_regulations_url = regulationsUrl;

    const regulationsText = document.getElementById('regulations-text')?.value;
    if (regulationsText) data.internal_regulations_text = regulationsText;

    // ========== FINE NUOVI CAMPI ==========

    // Arrays - aggiungi solo se non vuoti
    if (this.methodologies && this.methodologies.length > 0) {
      data.methodologies = this.methodologies;
    }

    if (this.interests && this.interests.length > 0) {
      data.interests = this.interests;
    }

    // Social media
    const facebook = document.getElementById('facebook')?.value;
    if (facebook) data.facebook = facebook;

    const twitter = document.getElementById('twitter')?.value;
    if (twitter) data.twitter = twitter;

    const instagram = document.getElementById('instagram')?.value;
    if (instagram) data.instagram = instagram;

    const linkedin = document.getElementById('linkedin')?.value;
    if (linkedin) data.linkedin = linkedin;

    return data;
  }

  async handleLogout() {
    if (confirm('Sei sicuro di voler uscire? Le modifiche non salvate andranno perse.')) {
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

  showNotification(message, type = 'info') {
    // Create notification element
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
      display: flex;
      align-items: center;
      gap: var(--space-3);
      animation: slideInRight 0.3s ease-out;
      max-width: 400px;
    `;

    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.editProfilePage = new EditProfilePage();
  });
} else {
  window.editProfilePage = new EditProfilePage();
}

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
          window.location.href = window.AppConfig.getPageUrl('index.html');
        } catch (error) {
          console.error('Logout error:', error);
          window.location.href = window.AppConfig.getPageUrl('index.html');
        }
      }
    });
  }
}

// Call setup on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupMobileMenu);
} else {
  setupMobileMenu();
}
