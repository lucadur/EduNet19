/* ===================================================================
   PROFILE PAGE SCRIPT - EduNet19_2
   JavaScript for profile.html
   =================================================================== */

class ProfilePage {
  constructor() {
    this.currentUser = null;
    this.currentTab = 'about'; // Default tab è "about" per prevenire FOUC
    this.supabase = null;
    this.profileUserType = null; // Tipo utente del profilo visualizzato

    this.init();
  }

  async init() {
    console.log('🔵 ProfilePage initializing...');
    console.log('📍 Current URL:', window.location.href);
    console.log('📍 Search params:', window.location.search);

    // Wait for Supabase client
    await this.initSupabase();

    // ✅ Carica info utente nella navbar (sempre utente loggato)
    await this.loadCurrentUserNavbar();

    // ✅ Leggi ID profilo dall'URL
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get('id');
    console.log('📍 Profile ID from URL:', profileId);

    // Load user data (profilo specifico o utente corrente)
    // NOTA: loadUserProfile determina il tipo utente e chiama updateTabsVisibility
    await this.loadUserProfile(profileId);

    // Load avatar in navbar SOLO se stiamo visualizzando il nostro profilo
    // NOTA: AvatarManager gestisce già il caricamento dell'avatar utente in navbar
    // Qui forziamo solo se necessario o se AvatarManager non lo fa
    if (window.avatarManager) {
      // AvatarManager loads current user avatar automatically
    }

    // Setup event listeners
    this.setupEventListeners();

    // ✅ NON caricare automaticamente il tab "posts" - il tab corretto viene
    // attivato da updateTabsVisibility dopo aver determinato il tipo utente
    // Il tab "about" è già attivo di default nell'HTML

    console.log('✅ ProfilePage initialized');
  }

  async initSupabase() {
    if (window.supabaseClientManager) {
      this.supabase = await window.supabaseClientManager.getClient();
      const { data: { user } } = await this.supabase.auth.getUser();
      this.currentUser = user;
    }
  }

  setupEventListeners() {
    // Tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tabId = button.getAttribute('aria-controls').replace('-tab', '');
        this.switchTab(tabId);
      });
    });

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

  async loadCurrentUserNavbar() {
    try {
      if (!this.currentUser || !this.supabase) return;

      const userId = this.currentUser.id;

      // 1. Fetch basic profile info
      const { data: userProfile } = await this.supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', userId)
        .maybeSingle();

      if (!userProfile) return;

      let displayName = 'Utente';
      let userTypeDisplay = 'Utente';

      // 2. Prima controlla se è un collaboratore
      const { data: collabData } = await this.supabase.rpc('get_collaborator_profile');

      if (collabData?.is_collaborator) {
        // È un collaboratore - mostra il suo nome e ruolo
        const roleLabels = {
          'admin': 'Amministratore',
          'editor': 'Editor',
          'viewer': 'Visualizzatore'
        };
        displayName = `${collabData.first_name || ''} ${collabData.last_name || ''}`.trim() || 'Collaboratore';
        userTypeDisplay = `${roleLabels[collabData.role] || 'Collaboratore'} - ${collabData.institute_name}`;
        this.collaboratorData = collabData;
        console.log('👥 Navbar: Collaboratore rilevato:', displayName);
      }
      // 3. Fetch specific info based on type
      else if (userProfile.user_type === 'istituto') {
        const { data: institute } = await this.supabase
          .from('school_institutes')
          .select('institute_name, institute_type')
          .eq('id', userId)
          .maybeSingle();

        if (institute) {
          displayName = institute.institute_name || 'Istituto';
          userTypeDisplay = institute.institute_type || 'Istituto Scolastico';
        }
      } else {
        const { data: privateUser } = await this.supabase
          .from('private_users')
          .select('first_name, last_name, profession')
          .eq('id', userId)
          .maybeSingle();

        if (privateUser) {
          const fullName = `${privateUser.first_name || ''} ${privateUser.last_name || ''}`.trim();
          // Usa "Utente" come fallback invece dell'email
          displayName = fullName || 'Utente';
          userTypeDisplay = privateUser.profession || 'Utente Privato';
        } else {
          // Nessun dato in private_users, usa "Utente" come fallback
          displayName = 'Utente';
        }
      }

      // 3. Update Navbar Elements
      const userNameEl = document.getElementById('user-name');
      const userFullNameEl = document.getElementById('user-full-name');
      const userTypeEl = document.getElementById('user-type-display');

      // Mobile menu elements
      const mobileUserNameEl = document.getElementById('mobile-user-name');
      const mobileUserTypeEl = document.getElementById('mobile-user-type');

      // ✅ Aggiorna contenuto e rimuovi skeleton
      if (userNameEl) {
        userNameEl.textContent = displayName;
        userNameEl.classList.add('loaded');
      }
      if (userFullNameEl) {
        userFullNameEl.textContent = displayName;
        userFullNameEl.classList.add('loaded');
      }
      if (userTypeEl) {
        userTypeEl.textContent = userTypeDisplay;
        userTypeEl.classList.add('loaded');
      }

      if (mobileUserNameEl) {
        mobileUserNameEl.textContent = displayName;
        mobileUserNameEl.classList.add('loaded');
      }
      if (mobileUserTypeEl) {
        mobileUserTypeEl.textContent = userTypeDisplay;
        mobileUserTypeEl.classList.add('loaded');
      }

      console.log('✅ Navbar updated for current user:', displayName);

    } catch (error) {
      console.error('Error updating navbar:', error);
    }
  }

  async loadUserProfile(profileId = null) {
    try {
      if (!this.supabase) {
        console.error('❌ Supabase not available');
        this.showEmptyProfile();
        return;
      }

      // ✅ Determina quale profilo caricare
      const targetUserId = profileId || this.currentUser?.id;

      if (!targetUserId) {
        console.error('❌ No user ID available');
        this.showEmptyProfile();
        return;
      }

      // 💾 SALVA profileUserId per usarlo in loadPosts/loadProjects
      this.profileUserId = targetUserId;

      console.log('🔍 Loading profile for user:', targetUserId);

      // ✅ Determina se è il proprio profilo
      const isOwnProfile = this.currentUser && targetUserId === this.currentUser.id;
      console.log('👤 Is own profile:', isOwnProfile);

      // 🔒 PRIVACY CHECK START
      // Scarica impostazioni privacy PRIMA di mostrare qualsiasi dato
      const { data: privacySettings } = await this.supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      // Salva per uso futuro (es. posts)
      this.currentProfilePrivacy = privacySettings || {};

      if (!isOwnProfile && privacySettings) {
        // 1. Controllo Profilo Privato
        if (privacySettings.profile_visibility === 'private') {
          console.log('🔒 Profilo privato, accesso negato');
          this.showPrivateProfile();
          return;
        }
      }
      // 🔒 PRIVACY CHECK END

      // ✅ Prima determina il tipo di utente
      const { data: userProfile } = await this.supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', targetUserId)
        .maybeSingle();

      if (!userProfile) {
        console.error('❌ User profile not found in user_profiles');
        this.showEmptyProfile();
        return;
      }

      console.log('✅ User type:', userProfile.user_type);

      // ✅ Carica profilo in base al tipo
      if (userProfile.user_type === 'istituto') {
        const { data: instituteProfile, error } = await this.supabase
          .from('school_institutes')
          .select('*')
          .eq('id', targetUserId)
          .maybeSingle();

        if (error) {
          console.error('❌ Error loading institute profile:', error);
          throw error;
        }

        // STRICT VALIDATION: Un istituto deve avere nome e tipo.
        // PRIORITÀ: Se ha codice MIUR valido, è SEMPRE un istituto valido
        let isValidInstitute = instituteProfile && instituteProfile.institute_name && instituteProfile.institute_type;

        // Se ha un codice meccanografico MIUR, è sicuramente un istituto valido
        // Formato codice MIUR: 4 lettere + 5-6 cifre + eventuale lettera finale (es: TNEE820034, RMPS12000T)
        const hasValidMiurCode = instituteProfile?.institute_code &&
          instituteProfile.institute_code.length >= 8 &&
          /^[A-Z]{4}\d{5,6}[A-Z0-9]?$/i.test(instituteProfile.institute_code);

        if (hasValidMiurCode) {
          console.log('✅ Istituto con codice MIUR valido:', instituteProfile.institute_code);
          isValidInstitute = true;
          // NON fare altre verifiche - il codice MIUR è la prova definitiva
        } else if (isValidInstitute && instituteProfile.institute_name) {
          // Solo se NON ha codice MIUR, verifica il nome
          // Ma se user_profiles dice "istituto", fidati di quello
          console.log('ℹ️ Nessun codice MIUR, verifico nome istituto...');

          // Lista estesa di keyword per riconoscere nomi di scuole
          const schoolKeywords = [
            'liceo', 'istituto', 'scuola', 'comprensivo', 'tecnico', 'professionale',
            'università', 'politecnico', 'accademia', 'conservatorio', 'elementare',
            'media', 'superiore', 'infanzia', 'primaria', 'secondaria', 'convitto',
            'educandato', 'seminario', 'collegio', 'cfp', 'itis', 'ipsia', 'ipssar'
          ];
          const nameLower = instituteProfile.institute_name.toLowerCase();
          const looksLikeSchool = schoolKeywords.some(keyword => nameLower.includes(keyword));

          // Se non sembra un nome di scuola E non ha codice meccanografico
          // MA il tipo è valido (es: "Scuola Primaria"), è comunque un istituto
          if (!looksLikeSchool && !instituteProfile.institute_code) {
            // Verifica se il tipo è un tipo di scuola valido (lista completa)
            const validTypes = [
              'Scuola dell\'Infanzia', 'Scuola Primaria', 'Scuola Secondaria',
              'Scuola Secondaria di I Grado', 'Scuola Secondaria di II Grado',
              'Liceo', 'Liceo Scientifico', 'Liceo Classico', 'Liceo Linguistico', 'Liceo Artistico',
              'Istituto Tecnico', 'Istituto Professionale', 'Istituto Comprensivo', 'Istituto Superiore',
              'ITS', 'Università', 'Politecnico', 'Accademia', 'Conservatorio', 'Ente di Formazione', 'Altro'
            ];
            const hasValidType = validTypes.some(t =>
              instituteProfile.institute_type?.toLowerCase().includes(t.toLowerCase()) ||
              t.toLowerCase().includes(instituteProfile.institute_type?.toLowerCase())
            );

            if (hasValidType) {
              console.log('✅ Tipo istituto valido, accetto come scuola:', instituteProfile.institute_type);
              isValidInstitute = true;
            } else {
              // ULTIMA CHANCE: se user_profiles dice "istituto", fidati
              console.log('ℹ️ Tipo non in lista ma user_profiles dice istituto, accetto');
              isValidInstitute = true;
            }
          }
        }

        if (isValidInstitute) {
          console.log('✅ Institute profile loaded:', instituteProfile);
          // Passiamo privacySettings a updateProfileUI
          this.updateProfileUI(instituteProfile, 'istituto', privacySettings, isOwnProfile);
          await this.loadProfileStats(instituteProfile.id);

          // ⭐ Carica rating stelle (solo per istituti)
          await this.loadProfileRating(instituteProfile.id);

          // 📧 Inizializza form di contatto (solo per utenti privati)
          if (window.instituteContactManager) {
            await window.instituteContactManager.init(instituteProfile.id, instituteProfile);
          }

          // 🔐 Gestisci visibilità pulsanti modifica
          this.updateProfileActions(isOwnProfile);

          // Carica avatar - forza dopo delay per sovrascrivere avatar-manager
          const forceAvatar = () => {
            const profileAvatar = document.getElementById('profile-avatar');
            if (profileAvatar) {
              if (instituteProfile.logo_url) {
                // Ha logo - mostralo
                profileAvatar.style.backgroundImage = `url(${instituteProfile.logo_url})`;
                profileAvatar.style.backgroundSize = 'cover';
                profileAvatar.style.backgroundPosition = 'center';
                const icon = profileAvatar.querySelector('i');
                if (icon) icon.style.display = 'none';
                console.log('🎨 Forced institute avatar:', instituteProfile.logo_url);
              } else {
                // Nessun logo - mostra placeholder
                profileAvatar.style.backgroundImage = 'none';
                const icon = profileAvatar.querySelector('i');
                if (icon) icon.style.display = 'block';
                console.log('🎨 No institute logo, showing placeholder');
              }
            }
          };

          // Carica immediatamente
          forceAvatar();

          // E dopo un delay per sovrascrivere avatar-manager
          setTimeout(forceAvatar, 500);
        } else {
          // SELF-HEALING: Se non trovato come istituto (o non valido), controlla se è un privato
          console.warn('⚠️ No valid institute profile found (missing name/type). Checking if private user...');

          let privateProfileCheck = null;

          // 1. Prova query DB
          const { data: privateDataDB } = await this.supabase
            .from('private_users')
            .select('*')
            .eq('id', targetUserId)
            .maybeSingle();

          if (privateDataDB) {
            privateProfileCheck = privateDataDB;
          } else if (isOwnProfile) {
            // 2. Fallback: Metadata (Deadlock Breaker)
            // Se è il mio profilo e non riesco a leggere private_users (RLS), controllo i metadata
            const currentUser = await this.supabase.auth.getUser();
            const metadata = currentUser.data.user?.user_metadata;

            if (metadata && (metadata.user_type === 'privato' || metadata.type === 'privato')) {
              console.log('✅ Metadata confirm private user (Deadlock Breaker)');
              // Usa "Utente" come fallback invece dell'email
              privateProfileCheck = {
                id: targetUserId,
                first_name: metadata.first_name || metadata.name || 'Utente',
                last_name: metadata.last_name || metadata.surname || ''
              };
            }
          }

          // 3. FORZA TIPO PRIVATO: Se i dati istituto sono invalidi (nome non sembra una scuola),
          // forza il tipo a privato indipendentemente dai metadata
          if (!privateProfileCheck && !isValidInstitute) {
            console.warn('🔥 FORZA TIPO PRIVATO: Dati istituto invalidi, assumo utente privato');

            // Usa il nome dall'istituto se disponibile, altrimenti "Utente"
            let firstName = 'Utente';
            let lastName = '';

            if (instituteProfile && instituteProfile.institute_name) {
              const nameParts = instituteProfile.institute_name.split(' ');
              firstName = nameParts[0] || 'Utente';
              lastName = nameParts.slice(1).join(' ') || '';
            }

            privateProfileCheck = {
              id: targetUserId,
              first_name: firstName,
              last_name: lastName
            };
          }

          if (privateProfileCheck) {
            console.log('✅ Found as private user! Correcting type...');
            // Aggiorna DB se è il proprio profilo
            if (isOwnProfile) {
              // Aggiorna user_type
              this.supabase.from('user_profiles').update({ user_type: 'privato' }).eq('id', targetUserId)
                .then(({ error }) => {
                  if (error) console.error('❌ Errore aggiornamento user_type:', error);
                  else console.log('✅ user_type aggiornato a privato nel DB');
                });

              // Crea record in private_users se non esiste
              if (!privateDataDB) {
                this.supabase.from('private_users').upsert([{
                  id: targetUserId,
                  first_name: privateProfileCheck.first_name,
                  last_name: privateProfileCheck.last_name,
                  privacy_level: 'pubblico'
                }], { onConflict: 'id' }).then(({ error }) => {
                  if (error) console.error('❌ Errore creazione private_users:', error);
                  else console.log('✅ Record private_users creato/aggiornato');
                });
              }

              // Rimuovi record zombie da school_institutes SOLO se NON ha codice MIUR
              // IMPORTANTE: Non eliminare MAI istituti con codice MIUR valido!
              if (instituteProfile && !instituteProfile.institute_code) {
                console.log('🗑️ Rimozione record zombie (senza codice MIUR)');
                this.supabase.from('school_institutes').delete().eq('id', targetUserId)
                  .then(({ error }) => {
                    if (error) console.error('❌ Errore rimozione school_institutes zombie:', error);
                    else console.log('✅ Record school_institutes zombie rimosso');
                  });
              } else if (instituteProfile?.institute_code) {
                console.log('⚠️ NON rimuovo school_institutes - ha codice MIUR:', instituteProfile.institute_code);
              }
            }

            // Ricarica come privato
            this.updateProfileUI(privateProfileCheck, 'privato', privacySettings, isOwnProfile);
            await this.loadProfileStats(privateProfileCheck.id);
            this.updateProfileActions(isOwnProfile);
            return;
          }

          console.warn('⚠️ No profile found in either table, showing empty profile');
          this.showEmptyProfile('istituto');
        }
      } else if (userProfile.user_type === 'privato') {
        const { data: privateProfile, error } = await this.supabase
          .from('private_users')
          .select('*')
          .eq('id', targetUserId)
          .maybeSingle();

        if (error) {
          console.error('❌ Error loading private profile:', error);
          throw error;
        }

        if (privateProfile) {
          console.log('✅ Private profile loaded:', privateProfile);

          // Aggiungi email al profilo se è il proprio profilo
          if (isOwnProfile && this.currentUser?.email) {
            privateProfile.email = this.currentUser.email;
          }

          // Passiamo privacySettings a updateProfileUI
          this.updateProfileUI(privateProfile, 'privato', privacySettings, isOwnProfile);
          await this.loadProfileStats(privateProfile.id);

          // 🔐 Gestisci visibilità pulsanti modifica
          this.updateProfileActions(isOwnProfile);

          // Carica avatar - forza dopo delay per sovrascrivere avatar-manager
          const forceAvatar = () => {
            const profileAvatar = document.getElementById('profile-avatar');
            if (profileAvatar) {
              if (privateProfile.avatar_url) {
                // Ha avatar - mostralo
                profileAvatar.style.backgroundImage = `url(${privateProfile.avatar_url})`;
                profileAvatar.style.backgroundSize = 'cover';
                profileAvatar.style.backgroundPosition = 'center';
                const icon = profileAvatar.querySelector('i');
                if (icon) icon.style.display = 'none';
                console.log('🎨 Forced private avatar:', privateProfile.avatar_url);
              } else {
                // Nessun avatar - mostra placeholder
                profileAvatar.style.backgroundImage = 'none';
                const icon = profileAvatar.querySelector('i');
                if (icon) icon.style.display = 'block';
                console.log('🎨 No private avatar, showing placeholder');
              }
            }
          };

          // Carica immediatamente
          forceAvatar();

          // E dopo un delay per sovrascrivere avatar-manager
          setTimeout(forceAvatar, 500);
        } else {
          console.warn('⚠️ No private profile found, showing empty profile');
          this.showEmptyProfile('privato');
        }
      }

    } catch (error) {
      console.error('❌ Error loading profile:', error);
      this.showEmptyProfile();
    }
  }

  showPrivateProfile() {
    const container = document.querySelector('main.profile-main'); // Assumiamo che il main abbia questa classe o sia individuabile
    if (!container) return;

    container.innerHTML = `
      <div class="private-profile-container" style="text-align: center; padding: 4rem 1rem; max-width: 600px; margin: 0 auto;">
        <div class="lock-icon" style="font-size: 4rem; color: #6b7280; margin-bottom: 1.5rem;">
          <i class="fas fa-lock"></i>
        </div>
        <h2 style="font-size: 2rem; margin-bottom: 1rem; color: #111827;">Questo profilo è privato</h2>
        <p style="font-size: 1.1rem; color: #4b5563; margin-bottom: 2rem;">
          L'utente ha scelto di limitare la visibilità del proprio profilo.
        </p>
        <a href="../../homepage.html" class="btn-primary">
          <i class="fas fa-arrow-left"></i> Torna alla Home
        </a>
      </div>
    `;
  }


  showEmptyProfile(userType = 'privato') {
    console.log('📝 Showing empty profile for type:', userType);

    // Usa "Utente" come nome di default per utenti privati
    const defaultFirstName = 'Utente';

    const emptyProfile = {
      first_name: userType === 'privato' ? defaultFirstName : null,
      last_name: userType === 'privato' ? '' : null,
      institute_name: userType === 'istituto' ? 'Istituto' : null,
      institute_type: userType === 'istituto' ? 'Istituto Scolastico' : null,
      bio: null,
      location: null,
      website: null,
      email: null,
      phone: null,
      address: null
    };

    this.updateProfileUI(emptyProfile, userType);
    this.loadDemoStats();
  }

  updateProfileUI(profile, userType = 'istituto', privacySettings = null, isOwnProfile = false) {
    console.log('🎨 Updating profile UI with:', profile, 'Type:', userType);

    // ✅ SKELETON REMOVAL: Rimuovi le classi skeleton quando i dati sono pronti
    this.removeSkeletonStates();

    // Update profile name
    const profileTitle = document.getElementById('profile-title');
    const userFullName = document.getElementById('user-full-name');

    let displayName;
    let displayType;

    if (userType === 'istituto') {
      displayName = profile.institute_name || 'Nome Istituto';
      displayType = profile.institute_type || 'Istituto Scolastico';

      // Mostra badge di verifica per istituti
      this.updateVerificationBadge(profile.verification_status, profile.verified);
    } else {
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      // Usa "Utente" come fallback invece dell'email
      displayName = fullName || 'Utente';
      displayType = profile.profession || 'Utente Privato';

      // Se è un collaboratore, mostra il ruolo invece di "Utente Privato"
      if (this.collaboratorData?.is_collaborator && isOwnProfile) {
        const roleLabels = {
          'admin': 'Amministratore',
          'editor': 'Editor',
          'viewer': 'Visualizzatore'
        };
        displayType = `${roleLabels[this.collaboratorData.role] || 'Collaboratore'} - ${this.collaboratorData.institute_name}`;
        console.log('👥 Profilo collaboratore - tipo:', displayType);
      }
    }

    if (profileTitle) profileTitle.textContent = displayName;

    // NON aggiornare user-name/user-full-name qui - gestito da loadCurrentUserNavbar
    // if (userFullName) userFullName.textContent = displayName;

    // Update profile type
    const profileType = document.getElementById('profile-type');
    // const userTypeDisplay = document.getElementById('user-type-display');

    if (profileType) profileType.textContent = displayType;
    // if (userTypeDisplay) userTypeDisplay.textContent = displayType;

    // Update bio - supporta sia 'bio' che 'description'
    const profileBio = document.getElementById('profile-bio');
    if (profileBio) {
      const bioText = profile.bio || profile.description;
      if (bioText) {
        profileBio.textContent = bioText;
        profileBio.parentElement?.classList.remove('hidden');
      } else {
        profileBio.textContent = 'Nessuna descrizione';
      }
    }

    // Update location - mostra solo se presente
    const profileLocation = document.getElementById('profile-location');
    if (profileLocation) {
      const location = profile.location || profile.city;
      if (location) {
        profileLocation.textContent = location;
        profileLocation.parentElement?.classList.remove('hidden');
      } else {
        profileLocation.textContent = 'Posizione non specificata';
      }
    }

    // Update website - mostra solo se presente
    const profileWebsite = document.getElementById('profile-website');
    if (profileWebsite) {
      if (profile.website) {
        // Assicurati che l'URL abbia il protocollo
        const websiteUrl = profile.website.startsWith('http')
          ? profile.website
          : `https://${profile.website}`;
        profileWebsite.href = websiteUrl;
        profileWebsite.textContent = profile.website.replace(/^https?:\/\//, '');
        profileWebsite.target = '_blank';
        profileWebsite.rel = 'noopener noreferrer';
        profileWebsite.parentElement?.classList.remove('hidden');
      } else {
        profileWebsite.parentElement?.classList.add('hidden');
      }
    }

    // Update join date
    const joinDate = document.getElementById('profile-join-date');
    if (joinDate && profile.created_at) {
      const date = new Date(profile.created_at);
      joinDate.textContent = date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    }

    // Update cover image
    const coverImage = document.getElementById('cover-image');
    if (coverImage) {
      // Supporta sia cover_image (istituti) che cover_image_url (privati)
      const coverUrl = profile.cover_image || profile.cover_image_url;
      if (coverUrl) {
        console.log('Loading cover image:', coverUrl);
        coverImage.style.backgroundImage = `url(${coverUrl})`;
        coverImage.style.backgroundSize = 'cover';
        coverImage.style.backgroundPosition = 'center top';
        coverImage.style.backgroundRepeat = 'no-repeat';

        // Rimuovi COMPLETAMENTE l'icona placeholder per evitare interferenze
        const placeholder = coverImage.querySelector('.cover-placeholder');
        if (placeholder) {
          placeholder.style.display = 'none';
          placeholder.style.visibility = 'hidden';
          placeholder.style.opacity = '0';
          placeholder.style.width = '0';
          placeholder.style.height = '0';
          placeholder.style.position = 'absolute';
          // Opzionale: rimuovi completamente dal DOM
          // placeholder.remove();
        }
      } else {
        console.log('No cover image found in profile');
        // Mostra il placeholder se non c'è immagine
        const placeholder = coverImage.querySelector('.cover-placeholder');
        if (placeholder) {
          placeholder.style.display = 'block';
          placeholder.style.visibility = 'visible';
          placeholder.style.opacity = '1';
        }
      }
    }

    // Update avatar image
    const profileAvatar = document.getElementById('profile-avatar');
    if (profileAvatar) {
      // Supporta sia avatar_image, logo_url (istituti) che avatar_url (privati)
      const avatarUrl = profile.avatar_image || profile.logo_url || profile.avatar_url;
      if (avatarUrl) {
        console.log('Loading avatar image:', avatarUrl);
        profileAvatar.style.backgroundImage = `url(${avatarUrl})`;
        profileAvatar.style.backgroundSize = 'cover';
        profileAvatar.style.backgroundPosition = 'center';
        profileAvatar.style.backgroundRepeat = 'no-repeat';
        // Rimuovi l'icona placeholder
        const avatarIcon = profileAvatar.querySelector('i');
        if (avatarIcon) avatarIcon.style.display = 'none';
      } else {
        console.log('No avatar image found in profile');
      }
    }

    // Update About tab with privacy checks - passa anche userType
    this.updateAboutTab(profile, privacySettings, isOwnProfile, userType);

    // 🔒 PRIVACY: Gestisci visibilità tab in base al tipo utente
    this.updateTabsVisibility(userType);
  }

  /**
   * 🔒 Gestisce la visibilità dei tab in base al tipo utente
   * Gli utenti privati vedono solo il tab Info
   * Gli istituti vedono tutti i tab (Post, Progetti, Info, Galleria, Recensioni)
   * 
   * NOTA: Le tab degli istituti sono nascoste di default nell'HTML per prevenire FOUC
   */
  updateTabsVisibility(userType) {
    // Salva il tipo utente per uso futuro
    this.profileUserType = userType;

    const postsTabBtn = document.getElementById('posts-tab-btn');
    const projectsTabBtn = document.getElementById('projects-tab-btn');
    const postsTab = document.getElementById('posts-tab');
    const projectsTab = document.getElementById('projects-tab');
    const aboutTabBtn = document.getElementById('about-tab-btn');
    const aboutTab = document.getElementById('about-tab');
    const galleryTabBtn = document.getElementById('gallery-tab-btn');
    const galleryTab = document.getElementById('gallery-tab');
    const reviewsTabBtn = document.getElementById('reviews-tab-btn');
    const reviewsTab = document.getElementById('reviews-tab');

    // Stat cards
    const postsStatCard = document.getElementById('posts-stat-card');
    const projectsStatCard = document.getElementById('projects-stat-card');
    const followersStatCard = document.getElementById('followers-stat-card');
    const followingStatCard = document.getElementById('following-stat-card');
    const profileStatsSection = document.getElementById('profile-stats-section');

    // Meta items (posizione e sito web)
    const locationMetaItem = document.getElementById('location-meta-item');
    const websiteMetaItem = document.getElementById('website-meta-item');

    if (userType === 'privato') {
      // === UTENTE PRIVATO: Solo tab Info ===
      // Le tab istituto sono già nascoste nell'HTML, confermiamo
      if (postsTabBtn) postsTabBtn.style.display = 'none';
      if (projectsTabBtn) projectsTabBtn.style.display = 'none';
      if (postsTab) postsTab.style.display = 'none';
      if (projectsTab) projectsTab.style.display = 'none';
      if (galleryTabBtn) galleryTabBtn.style.display = 'none';
      if (galleryTab) galleryTab.style.display = 'none';
      if (reviewsTabBtn) reviewsTabBtn.style.display = 'none';
      if (reviewsTab) reviewsTab.style.display = 'none';

      // === NASCONDI STAT CARDS per utenti privati ===
      // Mostra solo "Seguiti"
      if (postsStatCard) postsStatCard.style.display = 'none';
      if (projectsStatCard) projectsStatCard.style.display = 'none';
      if (followersStatCard) followersStatCard.style.display = 'none';

      // Centra la card "Seguiti" rimanente
      if (profileStatsSection) {
        profileStatsSection.style.justifyContent = 'center';
      }
      if (followingStatCard) {
        followingStatCard.style.minWidth = '200px';
      }

      // === NASCONDI META ITEMS per utenti privati ===
      if (locationMetaItem) locationMetaItem.style.display = 'none';
      if (websiteMetaItem) websiteMetaItem.style.display = 'none';

      // Il tab Info è già attivo di default nell'HTML
      // Assicuriamoci che sia visibile e attivo
      if (aboutTabBtn) {
        aboutTabBtn.classList.add('active');
        aboutTabBtn.setAttribute('aria-selected', 'true');
      }
      if (aboutTab) {
        aboutTab.classList.add('active');
        aboutTab.style.display = '';
      }

      this.currentTab = 'about';
      console.log('🔒 Profilo privato: solo tab Info visibile');

    } else {
      // === ISTITUTO: Mostra tutti i tab ===
      // Mostra le tab nascoste di default
      if (postsTabBtn) postsTabBtn.style.display = '';
      if (projectsTabBtn) projectsTabBtn.style.display = '';
      if (postsTab) postsTab.style.display = '';
      if (projectsTab) projectsTab.style.display = '';
      if (galleryTabBtn) galleryTabBtn.style.display = '';
      if (galleryTab) galleryTab.style.display = '';
      if (reviewsTabBtn) reviewsTabBtn.style.display = '';
      if (reviewsTab) reviewsTab.style.display = '';

      // Mostra tutte le stat cards
      if (postsStatCard) postsStatCard.style.display = '';
      if (projectsStatCard) projectsStatCard.style.display = '';
      if (followersStatCard) followersStatCard.style.display = '';

      // Reset stili
      if (profileStatsSection) {
        profileStatsSection.style.justifyContent = '';
      }
      if (followingStatCard) {
        followingStatCard.style.minWidth = '';
      }

      // Mostra meta items per istituti
      if (locationMetaItem) locationMetaItem.style.display = '';
      if (websiteMetaItem) websiteMetaItem.style.display = '';

      // Per gli istituti, attiva il tab Posts come default
      // Prima rimuovi active da about
      if (aboutTabBtn) {
        aboutTabBtn.classList.remove('active');
        aboutTabBtn.setAttribute('aria-selected', 'false');
      }
      if (aboutTab) {
        aboutTab.classList.remove('active');
      }

      // Attiva Posts
      if (postsTabBtn) {
        postsTabBtn.classList.add('active');
        postsTabBtn.setAttribute('aria-selected', 'true');
      }
      if (postsTab) {
        postsTab.classList.add('active');
      }

      this.currentTab = 'posts';

      // Carica i contenuti del tab Posts
      this.loadTabContent('posts');

      console.log('✅ Profilo istituto: tutti i tab visibili, Posts attivo');
    }
  }

  updateAboutTab(profile, privacySettings, isOwnProfile, userType = null) {
    console.log('📋 Updating About tab with privacy checks:', profile, 'userType:', userType);

    // Determina il tipo utente dal profilo se non passato
    const profileUserType = userType || (profile.institute_type ? 'istituto' : 'privato');

    // Calcola se mostrare email (vale per entrambi i tipi)
    const shouldShowEmail = isOwnProfile || (privacySettings ? privacySettings.show_email : false);

    // Gestisci visibilità sezioni in base al tipo utente
    const instituteSections = document.querySelectorAll('.institute-about-section');
    const privateSections = document.querySelectorAll('.private-about-section');

    if (profileUserType === 'privato') {
      // Nascondi sezioni istituto, mostra sezioni private
      instituteSections.forEach(section => section.style.display = 'none');
      privateSections.forEach(section => section.style.display = '');

      // Popola bio utente privato
      const privateBio = document.getElementById('about-private-bio');
      if (privateBio) {
        privateBio.textContent = profile.bio || profile.description || 'Nessuna presentazione';
      }

      // Email per utente privato - mostra se permesso
      const privateEmailContainer = document.getElementById('private-email-container');
      const privateEmail = document.getElementById('about-private-email');
      if (privateEmail && privateEmailContainer) {
        if (profile.email && shouldShowEmail) {
          privateEmail.textContent = profile.email;
          privateEmailContainer.style.display = '';
          // Inizializza pulsanti azioni email per utente privato
          this.initEmailActions(profile.email, 'private');
        } else {
          privateEmailContainer.style.display = 'none';
          // Nascondi pulsanti azioni email
          const privateEmailActions = document.getElementById('private-email-actions');
          if (privateEmailActions) privateEmailActions.style.display = 'none';
        }
      }

      console.log('📋 About tab configurato per UTENTE PRIVATO');
      return; // Non processare campi istituto
    }

    // Mostra sezioni istituto, nascondi sezioni private
    instituteSections.forEach(section => section.style.display = '');
    privateSections.forEach(section => section.style.display = 'none');

    // shouldShowEmail già calcolato sopra

    // Institute type - mostra solo per istituti
    const aboutType = document.getElementById('about-institute-type');
    if (aboutType) {
      if (profile.institute_type) {
        aboutType.textContent = profile.institute_type;
        aboutType.parentElement?.classList.remove('hidden');
      } else {
        aboutType.parentElement?.classList.add('hidden');
      }
    }

    // Email - mostra solo se presente E se la privacy lo consente
    const aboutEmail = document.getElementById('about-email');
    if (aboutEmail) {
      if (profile.email && shouldShowEmail) {
        aboutEmail.textContent = profile.email;
        aboutEmail.parentElement?.classList.remove('hidden');
        // Inizializza pulsanti azioni email per istituto
        this.initEmailActions(profile.email, 'institute');
      } else {
        // Nascondi il campo se non permesso o non presente
        if (!shouldShowEmail) {
          aboutEmail.textContent = 'Non visibile (Privacy)';
          // Opzionale: nascondere l'intera riga
          aboutEmail.parentElement?.classList.add('hidden');
        } else {
          aboutEmail.textContent = '-';
        }
        // Nascondi pulsanti azioni email
        const emailActions = document.getElementById('email-actions');
        if (emailActions) emailActions.style.display = 'none';
      }
    }

    // Phone - mostra solo se presente
    const aboutPhone = document.getElementById('about-phone');
    if (aboutPhone) {
      if (profile.phone) {
        aboutPhone.textContent = profile.phone;
        aboutPhone.parentElement?.classList.remove('hidden');
      } else {
        aboutPhone.textContent = '-';
      }
    }

    // Address - componi indirizzo completo
    const aboutAddress = document.getElementById('about-address');
    if (aboutAddress) {
      const addressParts = [];
      if (profile.address) addressParts.push(profile.address);
      if (profile.city) addressParts.push(profile.city);
      if (profile.province) addressParts.push(`(${profile.province})`);

      const fullAddress = addressParts.join(', ');
      aboutAddress.textContent = fullAddress || '-';

      if (fullAddress) {
        aboutAddress.parentElement?.classList.remove('hidden');
      }
    }


    // Website - rendi cliccabile se presente
    const aboutWebsite = document.getElementById('about-website');
    if (aboutWebsite && profile.website) {
      const websiteUrl = profile.website.startsWith('http')
        ? profile.website
        : `https://${profile.website}`;
      aboutWebsite.href = websiteUrl;
      aboutWebsite.textContent = profile.website;
      aboutWebsite.target = '_blank';
      aboutWebsite.rel = 'noopener noreferrer';
      aboutWebsite.parentElement?.classList.remove('hidden');
    } else if (aboutWebsite) {
      aboutWebsite.textContent = '-';
      aboutWebsite.removeAttribute('href');
    }

    // Methodologies (if available)
    const methodologiesContainer = document.getElementById('about-methodologies');
    if (methodologiesContainer && profile.methodologies && profile.methodologies.length > 0) {
      methodologiesContainer.innerHTML = profile.methodologies
        .map(method => `<span class="tag">${method}</span>`)
        .join('');
    }

    // Interests (if available)
    const interestsContainer = document.getElementById('about-interests');
    if (interestsContainer && profile.interests && profile.interests.length > 0) {
      interestsContainer.innerHTML = profile.interests
        .map(interest => `<span class="tag">${interest}</span>`)
        .join('');
    }

    // ========== NUOVI CAMPI STRUTTURA E SPAZI ==========

    // Numero aule
    const classroomCount = document.getElementById('about-classroom-count');
    if (classroomCount) {
      classroomCount.textContent = profile.classroom_count ? `${profile.classroom_count} aule` : '-';
    }

    // Superficie interna
    const internalArea = document.getElementById('about-internal-area');
    if (internalArea) {
      internalArea.textContent = profile.internal_area_sqm ? `${profile.internal_area_sqm} mq` : '-';
    }

    // Spazi esterni
    const externalSpaces = document.getElementById('about-external-spaces');
    if (externalSpaces) {
      externalSpaces.textContent = profile.external_spaces || '-';
    }

    // Nascondi sezione struttura se tutti i campi sono vuoti
    const structureSection = document.getElementById('structure-section');
    if (structureSection) {
      const hasStructureData = profile.classroom_count || profile.internal_area_sqm || profile.external_spaces;
      structureSection.style.display = hasStructureData ? '' : 'none';
    }

    // Orari di apertura
    const openingHoursContainer = document.getElementById('about-opening-hours');
    if (openingHoursContainer && profile.opening_hours && typeof profile.opening_hours === 'object') {
      const dayLabels = {
        'lunedi': 'Lunedì',
        'martedi': 'Martedì',
        'mercoledi': 'Mercoledì',
        'giovedi': 'Giovedì',
        'venerdi': 'Venerdì',
        'sabato': 'Sabato',
        'domenica': 'Domenica'
      };

      const hoursEntries = Object.entries(profile.opening_hours);
      if (hoursEntries.length > 0) {
        openingHoursContainer.innerHTML = `
          <div class="hours-grid">
            ${hoursEntries.map(([day, hours]) => `
              <div class="hours-item">
                <span class="day-name">${dayLabels[day] || day}</span>
                <span class="day-hours">${hours}</span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        openingHoursContainer.innerHTML = '<p class="no-hours">Orari non specificati</p>';
      }
    }

    // Nascondi sezione orari se vuota
    const hoursSection = document.getElementById('hours-section');
    if (hoursSection) {
      const hasHours = profile.opening_hours && Object.keys(profile.opening_hours).length > 0;
      hoursSection.style.display = hasHours ? '' : 'none';
    }

    // Regolamento interno
    const regulationsContainer = document.getElementById('about-regulations');
    if (regulationsContainer) {
      if (profile.internal_regulations_url) {
        regulationsContainer.innerHTML = `
          <a href="${profile.internal_regulations_url}" target="_blank" rel="noopener noreferrer" class="regulations-link">
            <i class="fas fa-file-pdf"></i>
            Visualizza Regolamento Interno
            <i class="fas fa-external-link-alt"></i>
          </a>
        `;
      } else if (profile.internal_regulations_text) {
        regulationsContainer.innerHTML = `
          <div class="regulations-text">
            <p>${profile.internal_regulations_text.substring(0, 500)}${profile.internal_regulations_text.length > 500 ? '...' : ''}</p>
            ${profile.internal_regulations_text.length > 500 ? `
              <button class="btn-link show-more-regulations" onclick="this.parentElement.querySelector('p').textContent = '${profile.internal_regulations_text.replace(/'/g, "\\'")}'; this.style.display='none';">
                Mostra tutto
              </button>
            ` : ''}
          </div>
        `;
      } else {
        regulationsContainer.innerHTML = '<p class="no-regulations">Regolamento non disponibile</p>';
      }
    }

    // Nascondi sezione regolamento se vuota
    const regulationsSection = document.getElementById('regulations-section');
    if (regulationsSection) {
      const hasRegulations = profile.internal_regulations_url || profile.internal_regulations_text;
      regulationsSection.style.display = hasRegulations ? '' : 'none';
    }

    // ========== FINE NUOVI CAMPI ==========
  }

  /**
   * Inizializza i pulsanti per copiare e inviare email
   * @param {string} email - L'indirizzo email
   * @param {string} type - 'institute' o 'private'
   */
  initEmailActions(email, type = 'institute') {
    // Gli ID nel HTML sono: email-actions, copy-email-btn, mailto-btn per istituti
    // e: private-email-actions, copy-private-email-btn, private-mailto-btn per privati
    const actionsId = type === 'private' ? 'private-email-actions' : 'email-actions';
    const copyBtnId = type === 'private' ? 'copy-private-email-btn' : 'copy-email-btn';
    const mailtoBtnId = type === 'private' ? 'private-mailto-btn' : 'mailto-btn';

    const actionsContainer = document.getElementById(actionsId);
    const copyBtn = document.getElementById(copyBtnId);
    const mailtoBtn = document.getElementById(mailtoBtnId);

    if (!actionsContainer || !email) {
      if (actionsContainer) actionsContainer.style.display = 'none';
      return;
    }

    // Mostra il container delle azioni
    actionsContainer.style.display = 'flex';

    // Configura il pulsante mailto
    if (mailtoBtn) {
      mailtoBtn.href = `mailto:${email}`;
      mailtoBtn.title = `Invia email a ${email}`;
    }

    // Configura il pulsante copia
    if (copyBtn) {
      // Rimuovi eventuali listener precedenti clonando il pulsante
      const newCopyBtn = copyBtn.cloneNode(true);
      copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);

      newCopyBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
          await navigator.clipboard.writeText(email);

          // Feedback visivo: mostra checkmark
          const icon = newCopyBtn.querySelector('i');
          const originalClass = icon?.className || 'fas fa-copy';

          if (icon) {
            icon.className = 'fas fa-check';
            newCopyBtn.classList.add('copied');
            newCopyBtn.title = 'Copiato!';
          }

          console.log('✅ Email copiata:', email);

          // Ripristina dopo 2 secondi
          setTimeout(() => {
            if (icon) {
              icon.className = originalClass;
              newCopyBtn.classList.remove('copied');
              newCopyBtn.title = 'Copia email';
            }
          }, 2000);

        } catch (err) {
          console.error('❌ Errore copia email:', err);

          // Fallback per browser che non supportano clipboard API
          const textArea = document.createElement('textarea');
          textArea.value = email;
          textArea.style.position = 'fixed';
          textArea.style.left = '-9999px';
          document.body.appendChild(textArea);
          textArea.select();

          try {
            document.execCommand('copy');
            console.log('✅ Email copiata (fallback):', email);

            // Feedback visivo anche per fallback
            const icon = newCopyBtn.querySelector('i');
            if (icon) {
              const originalClass = icon.className;
              icon.className = 'fas fa-check';
              newCopyBtn.classList.add('copied');
              setTimeout(() => {
                icon.className = originalClass;
                newCopyBtn.classList.remove('copied');
              }, 2000);
            }
          } catch (fallbackErr) {
            console.error('❌ Fallback copia fallito:', fallbackErr);
          }

          document.body.removeChild(textArea);
        }
      });
    }

    console.log(`📧 Email actions inizializzate per ${type}:`, email);
  }

  async loadProfileStats(userId) {
    try {
      // Load posts count
      const { count: postsCount } = await this.supabase
        .from('institute_posts')
        .select('*', { count: 'exact', head: true })
        .eq('institute_id', userId);

      // Load projects count (posts with type 'progetto')
      const { count: projectsCount } = await this.supabase
        .from('institute_posts')
        .select('*', { count: 'exact', head: true })
        .eq('institute_id', userId)
        .eq('post_type', 'progetto');

      // Update UI
      const postsCountEl = document.getElementById('posts-count');
      const projectsCountEl = document.getElementById('projects-count');

      if (postsCountEl) postsCountEl.textContent = postsCount || 0;
      if (projectsCountEl) projectsCountEl.textContent = projectsCount || 0;

      // Followers and following would come from user_follows table
      // For now, using placeholder values
      const followersEl = document.getElementById('followers-count');
      const followingEl = document.getElementById('following-count');

      if (followersEl) followersEl.textContent = '0';
      if (followingEl) followingEl.textContent = '0';

    } catch (error) {
      console.error('Error loading stats:', error);
      this.loadDemoStats();
    }
  }

  loadDemoStats() {
    // Mostra 0 invece di dati mock - i dati reali verranno caricati da loadProfileStats
    const postsCountEl = document.getElementById('posts-count');
    const projectsCountEl = document.getElementById('projects-count');
    const followersEl = document.getElementById('followers-count');
    const followingEl = document.getElementById('following-count');

    if (postsCountEl) postsCountEl.textContent = '0';
    if (projectsCountEl) projectsCountEl.textContent = '0';
    if (followersEl) followersEl.textContent = '0';
    if (followingEl) followingEl.textContent = '0';
  }

  switchTab(tabId) {
    // Update buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });

    const activeButton = document.getElementById(`${tabId}-tab-btn`);
    if (activeButton) {
      activeButton.classList.add('active');
      activeButton.setAttribute('aria-selected', 'true');
    }

    // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const activePanel = document.getElementById(`${tabId}-tab`);
    if (activePanel) {
      activePanel.classList.add('active');
    }

    // Load content
    this.currentTab = tabId;
    this.loadTabContent(tabId);
  }

  async loadTabContent(tabId) {
    console.log('Loading tab content:', tabId);

    switch (tabId) {
      case 'posts':
        await this.loadPosts();
        break;
      case 'projects':
        await this.loadProjects();
        break;
      case 'about':
        // About tab is already populated
        break;
      case 'gallery':
        // Gallery tab is handled by profile-gallery.js
        break;
      case 'reviews':
        await this.loadReviews();
        break;
    }
  }

  async loadPosts() {
    const postsContainer = document.getElementById('profile-posts');
    if (!postsContainer) {
      console.error('❌ Posts container not found!');
      return;
    }

    try {
      console.log('📝 Loading posts for profile:', this.profileUserId);

      if (!this.supabase || !this.profileUserId) {
        console.warn('⚠️ Missing supabase or profileUserId');
        postsContainer.innerHTML = this.getEmptyState('posts');
        return;
      }

      // USA profileUserId (profilo visitato)
      // 🔒 FILTER POSTS BASED ON PRIVACY
      let postsVisibility = 'public';
      if (this.currentProfilePrivacy && this.currentProfilePrivacy.posts_visibility) {
        postsVisibility = this.currentProfilePrivacy.posts_visibility;
      }

      // Se non sono il proprietario e la visibilità non è public
      if (this.currentUser && this.profileUserId !== this.currentUser.id) {
        if (postsVisibility === 'private') {
          console.log('🔒 Posts are private');
          postsContainer.innerHTML = `
                 <div class="empty-state">
                   <i class="fas fa-lock" aria-hidden="true"></i>
                   <h3>Post Privati</h3>
                   <p>I post di questo utente non sono visibili pubblicamente.</p>
                 </div>`;
          return;
        }
        // TODO: Gestire 'followers' e 'network' controllando le relazioni
      }

      const { data: posts, error } = await this.supabase
        .from('institute_posts')
        .select('*')
        .eq('institute_id', this.profileUserId)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ Error loading posts:', error);
        throw error;
      }

      console.log('📊 Posts loaded:', posts?.length || 0, 'posts');
      console.log('📊 Posts data:', posts);

      if (!posts || posts.length === 0) {
        console.log('ℹ️ No posts found, showing empty state');
        postsContainer.innerHTML = this.getEmptyState('posts');
        return;
      }

      console.log('🎨 Rendering', posts.length, 'posts...');
      const cardsHTML = posts.map(post => this.createPostCard(post)).join('');
      console.log('✅ Cards HTML generated, length:', cardsHTML.length);
      postsContainer.innerHTML = cardsHTML;
      console.log('✅ Posts rendered successfully');

    } catch (error) {
      console.error('💥 Error loading posts:', error);
      postsContainer.innerHTML = this.getEmptyState('posts');
    }
  }

  async loadProjects() {
    const projectsContainer = document.getElementById('profile-projects');
    if (!projectsContainer) return;

    try {
      if (!this.supabase || !this.profileUserId) {
        projectsContainer.innerHTML = this.getEmptyState('projects');
        return;
      }

      // USA profileUserId (profilo visitato) invece di currentUser.id (utente loggato)
      const { data: projects, error } = await this.supabase
        .from('institute_posts')
        .select('*')
        .eq('institute_id', this.profileUserId)
        .eq('post_type', 'progetto')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (!projects || projects.length === 0) {
        projectsContainer.innerHTML = this.getEmptyState('projects');
        return;
      }

      projectsContainer.innerHTML = projects.map(project => this.createPostCard(project)).join('');

    } catch (error) {
      console.error('Error loading projects:', error);
      projectsContainer.innerHTML = this.getEmptyState('projects');
    }
  }

  async loadReviews() {
    console.log('Loading reviews...');

    // Ottieni ID profilo dall'URL
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get('id') || this.currentUser?.id;

    if (!profileId) {
      console.error('No profile ID');
      return;
    }

    try {
      // Verifica se è un istituto
      const { data: profile } = await this.supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', profileId)
        .single();

      if (profile?.user_type !== 'istituto') {
        document.getElementById('reviews-tab').innerHTML = `
          <div class="reviews-container">
            <div class="empty-state">
              <i class="fas fa-star" aria-hidden="true"></i>
              <h3>Recensioni non disponibili</h3>
              <p>Le recensioni sono disponibili solo per gli istituti</p>
            </div>
          </div>
        `;
        return;
      }

      // Inizializza sistema recensioni
      console.log('🔵 Initializing reviews for institute:', profileId);

      if (window.eduNetReviewManager) {
        await window.eduNetReviewManager.init(profileId);
        console.log('✅ Reviews system initialized via EduNetReviewManager');
      } else if (window.reviewsManager) {
        await window.reviewsManager.init(profileId);
      } else if (typeof InstituteReviewsManager !== 'undefined') {
        window.reviewsManager = new InstituteReviewsManager();
        await window.reviewsManager.init(profileId);
      } else {
        console.error('❌ No review manager available, creating new EduNetReviewManager');
        if (typeof EduNetReviewManager !== 'undefined') {
          window.eduNetReviewManager = new EduNetReviewManager();
          await window.eduNetReviewManager.init(profileId);
          console.log('✅ Created and initialized fallback EduNetReviewManager');
        } else {
          console.error('❌ EduNetReviewManager class not found');
        }
      }

      // Se l'utente corrente è admin di questo istituto, mostra pannello moderazione
      if (this.currentUser && this.currentUser.id === profileId) {
        console.log('👤 Own profile detected - initializing moderation panel');
        const moderationPanelEl = document.getElementById('review-moderation-panel');
        console.log('📋 Moderation panel element:', moderationPanelEl);

        if (moderationPanelEl) {
          moderationPanelEl.style.display = 'block';
          console.log('✅ Moderation panel visible');

          try {
            if (window.moderationPanel) {
              console.log('✅ Using existing moderationPanel');
              await window.moderationPanel.init(profileId);
            } else if (typeof ReviewModerationPanel !== 'undefined') {
              console.log('✅ Creating new ReviewModerationPanel');
              window.moderationPanel = new ReviewModerationPanel();
              console.log('🔧 Calling init on moderationPanel...');
              await window.moderationPanel.init(profileId);
              console.log('✅ Moderation panel init completed');
            } else {
              console.error('❌ ReviewModerationPanel class not found');
            }
          } catch (error) {
            console.error('❌ Error initializing moderation panel:', error);
            console.error('Stack trace:', error.stack);
          }
        } else {
          console.error('❌ review-moderation-panel element not found in DOM');
        }
      } else {
        console.log('ℹ️ Not own profile - skipping moderation panel');
      }

      // Aggiorna badge contatore
      await this.updateReviewsCount(profileId);

    } catch (error) {
      console.error('Error loading reviews:', error);
      document.getElementById('reviews-tab').innerHTML = `
        <div class="reviews-container">
          <div class="empty-state">
            <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
            <h3>Errore caricamento recensioni</h3>
            <p>Si è verificato un errore. Riprova più tardi.</p>
          </div>
        </div>
      `;
    }
  }

  async updateReviewsCount(profileId) {
    try {
      // ✅ FIX: Conta direttamente dalla tabella institute_reviews solo quelle approvate
      const { count, error } = await this.supabase
        .from('institute_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('reviewed_institute_id', profileId)
        .eq('status', 'approved'); // Solo approvate!

      if (error) throw error;

      const badge = document.getElementById('reviews-count-badge');
      if (badge) {
        badge.textContent = count || 0;
        // Mostra badge solo se > 0
        badge.style.display = (count && count > 0) ? 'inline-block' : 'none';
      }
    } catch (error) {
      console.error('Error updating reviews count:', error);
    }
  }

  async loadProfileRating(profileId) {
    try {
      // ✅ FIX: Calcola rating e conteggio REAL-TIME dalle recensioni approvate
      // Ignora i dati cached in user_profiles che potrebbero essere disallineati
      const { data: reviews, error } = await this.supabase
        .from('institute_reviews')
        .select('rating')
        .eq('reviewed_institute_id', profileId)
        .eq('status', 'approved'); // Solo approvate!

      if (error) {
        console.error('Error loading profile rating:', error);
        return;
      }

      const ratingContainer = document.getElementById('profile-rating');
      const ratingStars = document.getElementById('profile-rating-stars');
      const ratingValue = document.getElementById('profile-rating-value');
      const ratingCount = document.getElementById('profile-rating-count');

      if (!ratingContainer) return;

      const totalReviews = reviews ? reviews.length : 0;

      // Calcola media
      let avgRating = 0;
      if (totalReviews > 0) {
        const sum = reviews.reduce((acc, curr) => acc + (curr.rating || 0), 0);
        avgRating = sum / totalReviews;
      }

      // Mostra rating solo se ci sono recensioni
      if (totalReviews > 0) {
        // Genera stelle (★ per pieno, ☆ per vuoto)
        const fullStars = Math.floor(avgRating);
        const hasHalfStar = avgRating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let starsHtml = '★'.repeat(fullStars);
        if (hasHalfStar) starsHtml += '⯨'; // Mezza stella
        starsHtml += '☆'.repeat(Math.max(0, emptyStars)); // Ensure non-negative

        if (ratingStars) ratingStars.textContent = starsHtml;
        if (ratingValue) ratingValue.textContent = avgRating.toFixed(1);
        if (ratingCount) ratingCount.textContent = `(${totalReviews} ${totalReviews === 1 ? 'recensione' : 'recensioni'})`;

        ratingContainer.style.display = 'flex';
        console.log('⭐ Rating loaded (real-time):', avgRating, 'from', totalReviews, 'approved reviews');
      } else {
        ratingContainer.style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading profile rating:', error);
    }
  }

  updateProfileActions(isOwnProfile) {
    const editBtn = document.getElementById('edit-profile-btn');
    const settingsBtn = document.getElementById('settings-btn');

    if (isOwnProfile) {
      // È il proprio profilo - mostra pulsanti
      if (editBtn) editBtn.style.display = 'inline-flex';
      if (settingsBtn) settingsBtn.style.display = 'inline-flex';
      console.log('🔓 Showing edit buttons - own profile');
    } else {
      // Profilo di qualcun altro - nascondi pulsanti
      if (editBtn) editBtn.style.display = 'none';
      if (settingsBtn) settingsBtn.style.display = 'none';
      console.log('🔒 Hiding edit buttons - viewing other profile');
    }
  }

  createPostCard(post) {
    const date = new Date(post.created_at);
    const formattedDate = date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Estrai preview immagine se disponibile
    const imageUrl = post.image_urls && post.image_urls.length > 0
      ? post.image_urls[0]
      : null;

    // Crea URL del post — usa AppConfig per risolvere il path corretto dalla root
    const postUrl = window.AppConfig && typeof window.AppConfig.getPageUrl === 'function'
      ? window.AppConfig.getPageUrl(`homepage.html#post-${post.id}`)
      : `../../homepage.html#post-${post.id}`;

    return `
      <article class="profile-post-card" onclick="window.location.href='${postUrl}'" style="cursor: pointer;">
        ${imageUrl ? `
          <div class="profile-post-image">
            <img src="${imageUrl}" alt="${post.title || 'Post image'}" loading="lazy">
            <div class="profile-post-overlay"></div>
          </div>
        ` : ''}
        <div class="profile-post-content">
          <div class="profile-post-header">
            <span class="profile-post-type">${this.getPostTypeInfo(post.post_type).icon} ${this.getPostTypeInfo(post.post_type).label}</span>
            <time class="profile-post-date">
              <i class="fas fa-clock"></i>
              ${formattedDate}
            </time>
          </div>
          <h3 class="profile-post-title">${post.title || 'Senza titolo'}</h3>
          <p class="profile-post-excerpt">${post.content ? this.stripHtml(post.content).substring(0, 120) + '...' : 'Nessuna descrizione disponibile'}</p>
          <div class="profile-post-footer">
            <div class="profile-post-stats">
              ${post.likes_count ? `<span><i class="fas fa-heart"></i> ${post.likes_count}</span>` : ''}
              ${post.comments_count ? `<span><i class="fas fa-comment"></i> ${post.comments_count}</span>` : ''}
            </div>
            <span class="profile-post-link">
              Visualizza <i class="fas fa-arrow-right"></i>
            </span>
          </div>
        </div>
      </article>
    `;
  }

  getPostTypeInfo(type) {
    const types = {
      'project': { label: 'Progetto', icon: '📊', color: '#0f62fe' },
      'methodology': { label: 'Metodologia', icon: '🎓', color: '#4589ff' },
      'event': { label: 'Evento', icon: '📅', color: '#78a9ff' },
      'news': { label: 'Notizia', icon: '📰', color: '#0f62fe' },
      'gallery': { label: 'Galleria', icon: '🖼️', color: '#4589ff' },
      'collaboration': { label: 'Collaborazione', icon: '🤝', color: '#78a9ff' },
      'educational_experience': { label: 'Esperienza Educativa', icon: '✨', color: '#0f62fe' },
      // Legacy support
      'progetto': { label: 'Progetto', icon: '📊', color: '#0f62fe' },
      'metodologia': { label: 'Metodologia', icon: '🎓', color: '#4589ff' },
      'evento': { label: 'Evento', icon: '📅', color: '#78a9ff' },
      'notizia': { label: 'Notizia', icon: '📰', color: '#0f62fe' }
    };
    return types[type] || { label: 'Post', icon: '📝', color: '#0f62fe' };
  }

  stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  static navigateToPost(postId) {
    // Salva l'ID del post in sessionStorage
    sessionStorage.setItem('scrollToPost', postId);
    // Naviga alla homepage
    window.location.href = window.AppConfig.getPageUrl('homepage.html');
  }

  getEmptyState(type) {
    const states = {
      'posts': {
        icon: 'fa-file-alt',
        title: 'Nessun post',
        text: 'Non hai ancora pubblicato contenuti',
        btnText: 'Crea il tuo primo post'
      },
      'projects': {
        icon: 'fa-project-diagram',
        title: 'Nessun progetto',
        text: 'Non hai ancora condiviso progetti didattici',
        btnText: 'Condividi un progetto'
      }
    };

    const state = states[type];
    return `
      <div class="empty-state">
        <i class="fas ${state.icon}" aria-hidden="true"></i>
        <h3>${state.title}</h3>
        <p>${state.text}</p>
        <a href="homepage.html" class="btn-primary">${state.btnText}</a>
      </div>
    `;
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

  /**
   * ✅ Rimuove le classi skeleton da tutti gli elementi dopo il caricamento dei dati
   * Previene il "flash" di contenuti placeholder errati (FOUC)
   */
  removeSkeletonStates() {
    console.log('🔄 Removing skeleton states...');

    // Elementi con classe skeleton-text
    const skeletonTexts = document.querySelectorAll('.skeleton-text, .skeleton-text-sm, .skeleton-text-inline');
    skeletonTexts.forEach(el => {
      el.classList.add('loaded');
    });

    // Elementi nascosti che devono apparire
    const skeletonHidden = document.querySelectorAll('.skeleton-hidden');
    skeletonHidden.forEach(el => {
      el.classList.add('loaded');
    });

    // Avatar skeleton
    const profileAvatar = document.getElementById('profile-avatar');
    if (profileAvatar) {
      profileAvatar.classList.remove('skeleton-loading');
    }

    console.log('✅ Skeleton states removed');
  }

  /**
   * Aggiorna il badge di verifica per gli istituti
   * @param {string} verificationStatus - Stato verifica: pending_verification, verification_sent, verified, rejected
   * @param {boolean} verified - Flag legacy di verifica
   */
  updateVerificationBadge(verificationStatus, verified) {
    const badgeContainer = document.getElementById('verification-badge');
    const badgeVerified = document.getElementById('badge-verified');
    const badgePending = document.getElementById('badge-pending');
    const badgeUnverified = document.getElementById('badge-unverified');

    if (!badgeContainer) return;

    // Nascondi tutti i badge
    if (badgeVerified) badgeVerified.style.display = 'none';
    if (badgePending) badgePending.style.display = 'none';
    if (badgeUnverified) badgeUnverified.style.display = 'none';

    // Determina quale badge mostrare
    const status = verificationStatus || (verified ? 'verified' : 'pending_verification');

    switch (status) {
      case 'verified':
        if (badgeVerified) badgeVerified.style.display = 'inline-flex';
        console.log('✅ Istituto verificato');
        break;
      case 'verification_sent':
      case 'pending_verification':
        if (badgePending) badgePending.style.display = 'inline-flex';
        console.log('⏳ Istituto in attesa di verifica');
        break;
      case 'rejected':
        if (badgeUnverified) badgeUnverified.style.display = 'inline-flex';
        console.log('❌ Verifica istituto rifiutata');
        break;
      default:
        if (badgeUnverified) badgeUnverified.style.display = 'inline-flex';
        console.log('⚠️ Stato verifica sconosciuto:', status);
    }

    // Mostra il container
    badgeContainer.style.display = 'flex';
  }
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.profilePage = new ProfilePage();
    setupMobileMenu();
  });
} else {
  window.profilePage = new ProfilePage();
  setupMobileMenu();
}
