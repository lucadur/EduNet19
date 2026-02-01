// Modulo di Autenticazione EduNet19 con Supabase
class EduNetAuth {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.userProfile = null;
        this.isInitialized = false; // Aggiungo flag di inizializzazione
        this.init();
    }

    // Metodo di inizializzazione pubblico
    initialize() {
        return this.init();
    }

    // Metodo di inizializzazione interno
    // Inizializza Supabase
    async init() {
        try {
            // Usa il client Supabase centralizzato
            this.supabase = await window.supabaseClientManager.getClient();

            if (!this.supabase) {
                console.warn('⚠️ Client Supabase non disponibile');
                return;
            }

            // Ascolta i cambiamenti di autenticazione
            this.supabase.auth.onAuthStateChange((event, session) => {
                this.handleAuthStateChange(event, session);
            });

            // Verifica se c'è già una sessione attiva
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.currentUser = session.user;
                await this.loadUserProfile(session.user);
            }

            // Imposta il flag di inizializzazione
            this.isInitialized = true;
            console.log('✅ Supabase inizializzato correttamente');
        } catch (error) {
            console.error('❌ Errore inizializzazione Supabase:', error);
            this.showNotification('Errore di connessione al servizio', 'error');
        }
    }

    // Gestisce i cambiamenti di stato dell'autenticazione
    async handleAuthStateChange(event, session) {
        console.log('Auth state changed:', event, session);

        // Gestisci solo eventi specifici per evitare loop
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
            // Se il profilo è già caricato per questo utente, skip
            if (this.currentUser?.id === session.user.id && this.userProfile) {
                console.log('✅ Profilo già caricato per questo utente, skip');
                return;
            }

            // Previeni chiamate concorrenti con un lock
            if (this.isLoadingProfile) {
                console.log('⏳ Caricamento profilo già in corso, skip');
                return;
            }

            this.isLoadingProfile = true;
            this.currentUser = session.user;

            // Controlla se ci sono dati di profilo pendenti da creare (solo per SIGNED_IN)
            if (event === 'SIGNED_IN') {
                await this.handlePendingProfile(session.user);
            }

            // Verifica che il profilo esista prima di procedere
            try {
                console.log('🔄 [handleAuthStateChange] Chiamo loadUserProfile per:', session.user.id);
                await this.loadUserProfile(session.user);

                // SYNC PREFERENCES: Load from DB to localStorage
                await this.syncUserPreferences(session.user.id);

                console.log('✅ [handleAuthStateChange] loadUserProfile completata, userProfile:', !!this.userProfile);

                // Se il profilo non è stato caricato, c'è un problema
                if (!this.userProfile) {
                    console.error('❌ [handleAuthStateChange] Profilo utente non caricato, logout in corso');
                    await this.supabase.auth.signOut();
                    this.showNotification('Errore nel caricamento del profilo. Riprova ad accedere.', 'error');
                    this.isLoadingProfile = false;
                    return;
                }
            } catch (error) {
                console.error('❌ [handleAuthStateChange] Errore nel caricamento del profilo:', error);
                await this.supabase.auth.signOut();
                this.showNotification('Errore nel caricamento del profilo. Riprova ad accedere.', 'error');
                this.isLoadingProfile = false;
                return;
            }

            this.isLoadingProfile = false;

            // Mostra notifica solo per login esplicito, non per sessioni esistenti
            // Usa sessionStorage per evitare di mostrare la notifica più volte nella stessa sessione
            if (event === 'SIGNED_IN') {
                const loginNotificationShown = sessionStorage.getItem('edunet_login_notification_shown');
                if (!loginNotificationShown) {
                    this.showNotification('Accesso effettuato con successo!', 'success');
                    sessionStorage.setItem('edunet_login_notification_shown', 'true');
                }

                // Reindirizza alla homepage SOLO per login esplicito dalla landing page
                const basePath = window.AppConfig && typeof window.AppConfig.getBasePath === 'function'
                    ? window.AppConfig.getBasePath()
                    : '/';
                const normalizedPath = window.location.pathname.endsWith('/')
                    ? window.location.pathname
                    : `${window.location.pathname}/`;
                const isLandingPage = window.location.pathname.includes('index.html') || normalizedPath === basePath;

                if (isLandingPage) {
                    setTimeout(() => {
                        window.location.href = window.AppConfig.getPageUrl('homepage.html');
                    }, 1000);
                }
            }

            // Per INITIAL_SESSION, non fare reindirizzamenti automatici
            // L'utente rimane dove si trova (landing page o homepage)

            // Chiudi i modal di login/registrazione
            this.closeAllModals();

        } else if (event === 'SIGNED_OUT') {
            this.currentUser = null;
            this.userProfile = null;
            this.isLoadingProfile = false;

            // Reset del flag notifica login per permettere la notifica al prossimo login
            sessionStorage.removeItem('edunet_login_notification_shown');

            this.showNotification('Disconnessione effettuata', 'info');

            // Reindirizza alla landing page se siamo nella homepage
            if (window.location.pathname.includes('homepage.html')) {
                setTimeout(() => {
                    window.location.href = window.AppConfig.getPageUrl('index.html');
                }, 1000);
            }
        }
    }

    // Gestisce la creazione di profili pendenti
    async handlePendingProfile(user) {
        try {
            const pendingProfileData = localStorage.getItem('pendingProfile');
            if (pendingProfileData) {
                const profileData = JSON.parse(pendingProfileData);

                // Verifica che sia per l'utente corrente
                if (profileData.userId === user.id) {
                    console.log('📝 Creazione profilo pendente per utente:', user.id, 'tipo:', profileData.userType);

                    // Verifica se il profilo esiste già
                    const { data: existingProfile } = await this.supabase
                        .from('user_profiles')
                        .select('id, user_type')
                        .eq('id', user.id)
                        .single();

                    // Crea il profilo utente solo se non esiste
                    if (!existingProfile) {
                        await this.createUserProfile(user, profileData.userType);
                    } else {
                        console.log('📋 Profilo utente già esistente, tipo attuale:', existingProfile.user_type);

                        // Se il tipo è diverso da quello pendente, aggiornalo
                        if (existingProfile.user_type !== profileData.userType) {
                            console.log('🔄 Aggiornamento user_type da', existingProfile.user_type, 'a', profileData.userType);
                            const { error: updateError } = await this.supabase
                                .from('user_profiles')
                                .update({ user_type: profileData.userType })
                                .eq('id', user.id);

                            if (updateError) {
                                console.error('❌ Errore aggiornamento user_type:', updateError);
                            } else {
                                console.log('✅ user_type aggiornato con successo');
                            }
                        }
                    }

                    // Crea i dati specifici in base al tipo
                    if (profileData.userType === 'istituto' && profileData.instituteData) {
                        // Verifica se i dati istituto esistono già
                        const { data: existingInstitute } = await this.supabase
                            .from('school_institutes')
                            .select('id')
                            .eq('id', user.id)
                            .single();

                        if (!existingInstitute) {
                            const { error: instituteError } = await this.supabase
                                .from('school_institutes')
                                .insert([{
                                    id: user.id,
                                    ...profileData.instituteData
                                }]);

                            if (instituteError) {
                                console.error('Errore creazione dati istituto pendenti:', instituteError);
                            }
                        } else {
                            console.log('Dati istituto già esistenti, skip creazione');
                        }
                    } else if (profileData.userType === 'privato' && profileData.privateData) {
                        // Verifica se i dati utente privato esistono già
                        const { data: existingPrivate } = await this.supabase
                            .from('private_users')
                            .select('id')
                            .eq('id', user.id)
                            .single();

                        if (!existingPrivate) {
                            const { error: privateError } = await this.supabase
                                .from('private_users')
                                .insert([{
                                    id: user.id,
                                    ...profileData.privateData
                                }]);

                            if (privateError) {
                                console.error('Errore creazione dati utente privato pendenti:', privateError);
                            }
                        } else {
                            console.log('Dati utente privato già esistenti, skip creazione');
                        }
                    }

                    // Rimuovi i dati pendenti
                    localStorage.removeItem('pendingProfile');
                    console.log('Profilo pendente gestito con successo');
                }
            }
        } catch (error) {
            console.error('Errore nella gestione del profilo pendente:', error);
            // Rimuovi i dati pendenti anche in caso di errore per evitare loop
            localStorage.removeItem('pendingProfile');
        }
    }

    // Registrazione istituto scolastico
    async registerInstitute(formData) {
        try {
            // Rate limiting check
            if (window.rateLimiter && !window.rateLimiter.checkAndNotify('register', formData.email)) {
                return { success: false, error: 'Troppi tentativi di registrazione. Riprova tra qualche minuto.' };
            }

            this.showLoading('Registrazione in corso...');

            // Debug: log dei dati ricevuti
            console.log('📋 Dati form ricevuti:', formData);
            console.log('📋 Campi obbligatori:', {
                instituteName: formData.instituteName,
                instituteType: formData.instituteType,
                email: formData.email,
                password: formData.password ? '***' : undefined,
                instituteCodeMiur: formData.instituteCodeMiur || formData.instituteCode,
                registrantName: formData.registrantName,
                registrantRole: formData.registrantRole
            });

            // Validazione dati base
            if (!formData.instituteName || !formData.instituteType || !formData.email || !formData.password) {
                console.error('❌ Validazione fallita. Campi mancanti:', {
                    instituteName: !formData.instituteName,
                    instituteType: !formData.instituteType,
                    email: !formData.email,
                    password: !formData.password
                });
                throw new Error('Tutti i campi obbligatori devono essere compilati');
            }

            // Validazione dati registrante
            if (!formData.registrantName || !formData.registrantRole) {
                throw new Error('Inserisci il tuo nome e ruolo nell\'istituto');
            }

            if (formData.password !== formData.confirmPassword) {
                throw new Error('Le password non coincidono');
            }

            if (formData.password.length < 8) {
                throw new Error('La password deve essere di almeno 8 caratteri');
            }

            // Estrai codice meccanografico MIUR (può venire da diversi campi)
            const codiceMeccanografico = formData.instituteCodeMiur || formData.instituteCode || null;

            // Email MIUR (per verifica istituto) - diversa dall'email di login
            const emailMiur = formData.instituteEmailMiur || null;
            const emailAccount = formData.email; // Email per login

            // Determina stato verifica iniziale
            // Se abbiamo email MIUR, possiamo inviare verifica
            const verificationStatus = emailMiur ? 'pending_verification' : 'pending_verification';

            // Prepara dati MIUR completi per salvataggio
            const miurData = codiceMeccanografico ? {
                codice_meccanografico: codiceMeccanografico,
                institute_name: formData.instituteName,
                institute_type: formData.instituteType,
                email: emailMiur,
                address: formData.instituteAddress || null,
                city: formData.instituteCity || null,
                province: formData.instituteProvince || null,
                website: formData.instituteWebsite || null,
                verified_from_miur: true,
                registration_date: new Date().toISOString()
            } : null;

            console.log('📋 Codice Meccanografico MIUR:', codiceMeccanografico);
            console.log('📋 Email Account (login):', emailAccount);
            console.log('📋 Email MIUR (verifica):', emailMiur);
            console.log('📋 Registrante:', formData.registrantName, '-', formData.registrantRole);

            // Registra l'utente in Supabase Auth con metadata per trigger
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: emailAccount, // Email per login
                password: formData.password,
                options: {
                    data: {
                        user_type: 'istituto',
                        institute_name: formData.instituteName,
                        institute_type: formData.instituteType,
                        institute_code: codiceMeccanografico,
                        registrant_name: formData.registrantName,
                        registrant_role: formData.registrantRole
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // Prepara dati istituto con nuovi campi verifica
                const instituteDataToSave = {
                    institute_name: formData.instituteName,
                    institute_type: formData.instituteType,
                    institute_code: codiceMeccanografico,
                    email: emailMiur || emailAccount, // Fallback a email account se MIUR non disponibile
                    email_miur: emailMiur,
                    email_account: emailAccount,
                    address: formData.instituteAddress || null,
                    city: formData.instituteCity || null,
                    province: formData.instituteProvince || null,
                    website: formData.instituteWebsite || null,
                    phone: formData.institutePhone || null,
                    miur_data: miurData,
                    verification_status: verificationStatus,
                    registrant_name: formData.registrantName,
                    registrant_role: formData.registrantRole,
                    verified: false // Non verificato fino a conferma via email MIUR
                };

                // Salva i dati per crearli al primo login o dopo conferma email
                localStorage.setItem('pendingProfile', JSON.stringify({
                    userId: authData.user.id,
                    userType: 'istituto',
                    instituteData: instituteDataToSave
                }));

                // Se l'utente è confermato immediatamente, prova a creare il profilo
                if (authData.user.email_confirmed_at) {
                    try {
                        console.log('📝 Creazione profilo istituto...');

                        // Crea i dati specifici dell'istituto
                        const { data: instituteData, error: instituteError } = await this.supabase
                            .from('school_institutes')
                            .insert([{
                                id: authData.user.id,
                                ...instituteDataToSave
                            }])
                            .select()
                            .single();

                        if (instituteError) {
                            console.error('❌ Errore creazione istituto:', instituteError);
                            throw instituteError;
                        }

                        console.log('✅ Istituto creato:', instituteData);

                        // Crea owner admin
                        const { data: ownerData, error: ownerError } = await this.supabase
                            .rpc('create_institute_owner', {
                                p_institute_id: authData.user.id,
                                p_user_id: authData.user.id
                            });

                        if (ownerError) {
                            console.error('❌ Errore creazione owner:', ownerError);
                            // Non bloccare per questo, può essere creato dopo
                        } else {
                            console.log('✅ Owner creato con successo');
                        }

                        // Invia inviti admin aggiuntivi se forniti
                        await this.sendAdminInvites(authData.user.id, formData);

                        // Se abbiamo email MIUR, invia richiesta di verifica
                        if (emailMiur) {
                            await this.sendInstituteVerificationEmail(authData.user.id, instituteDataToSave);
                        }

                        // Profilo creato con successo, rimuovi i dati pending
                        localStorage.removeItem('pendingProfile');

                    } catch (profileError) {
                        console.error('❌ Errore creazione profilo:', profileError);
                        // Mantieni i dati in localStorage per crearli al login
                        console.warn('⚠️ Profilo verrà creato al primo login');
                    }
                } else {
                    // Email confirmation richiesta - i dati verranno creati dopo la conferma
                    localStorage.setItem('pendingProfile', JSON.stringify({
                        userId: authData.user.id,
                        userType: 'istituto',
                        instituteData: instituteDataToSave
                    }));
                }

                // Messaggio appropriato
                let successMessage = 'Registrazione completata! Controlla la tua email per confermare l\'account.';
                if (emailMiur) {
                    successMessage = 'Registrazione completata! Controlla la tua email per confermare l\'account. Invieremo anche una richiesta di verifica all\'email ufficiale dell\'istituto.';
                }

                this.showNotification(successMessage, 'success');

                return { success: true, user: authData.user };
            }

        } catch (error) {
            console.error('Errore registrazione istituto:', error);

            // Usa il sistema di gestione errori se disponibile
            if (window.eduNetErrorHandler) {
                window.eduNetErrorHandler.handle(error, 'Institute Registration');
            } else {
                this.showNotification(error.message || 'Errore durante la registrazione', 'error');
            }

            return { success: false, error: error.message };
        } finally {
            this.hideLoading();
        }
    }

    // Registrazione utente privato
    async registerPrivateUser(formData) {
        try {
            // Rate limiting check
            if (window.rateLimiter && !window.rateLimiter.checkAndNotify('register', formData.email)) {
                return { success: false, error: 'Troppi tentativi di registrazione. Riprova tra qualche minuto.' };
            }

            this.showLoading('Registrazione in corso...');

            // Validazione dati base
            if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
                throw new Error('Tutti i campi obbligatori devono essere compilati');
            }

            if (formData.password !== formData.confirmPassword) {
                throw new Error('Le password non coincidono');
            }

            if (formData.password.length < 8) {
                throw new Error('La password deve essere di almeno 8 caratteri');
            }

            // Validazione data di nascita
            if (!formData.birthDate) {
                throw new Error('La data di nascita è obbligatoria');
            }

            // ========== VALIDAZIONE CODICE FISCALE ==========
            if (!formData.codiceFiscale) {
                throw new Error('Il Codice Fiscale è obbligatorio per verificare la tua identità');
            }

            // Normalizza il CF
            const codiceFiscale = formData.codiceFiscale.toUpperCase().trim();

            // Verifica che il validatore CF sia disponibile
            if (!window.codiceFiscaleValidator) {
                console.error('Codice Fiscale validator not loaded');
                throw new Error('Errore di sistema: validatore CF non disponibile. Ricarica la pagina.');
            }

            // Valida il CF con i dati anagrafici
            const cfValidation = window.codiceFiscaleValidator.validateForRegistration(
                codiceFiscale,
                formData.firstName,
                formData.lastName,
                formData.birthDate
            );

            console.log('📋 Validazione CF:', cfValidation);

            // Se il CF non è valido o non corrisponde ai dati
            if (!cfValidation.canRegister) {
                const errorMsg = cfValidation.errors.length > 0
                    ? cfValidation.errors.join('. ')
                    : 'Codice Fiscale non valido';
                throw new Error(errorMsg);
            }

            // Usa l'età estratta dal CF (più affidabile)
            const ageFromCF = cfValidation.age;
            console.log(`📋 Età estratta dal CF: ${ageFromCF} anni, categoria: ${cfValidation.ageCategory}`);

            // Determina i requisiti in base all'età dal CF
            const isMinor = ageFromCF < 18;
            const requiresParentalConsent = cfValidation.requiresParentalConsent || false;
            const requiresMinorDeclaration = cfValidation.requiresMinorDeclaration || false;

            // Validazione consenso parentale per 14-15 anni
            if (requiresParentalConsent) {
                if (!formData.parentEmail || !formData.parentName) {
                    throw new Error('Per utenti tra 14 e 16 anni è richiesto il consenso parentale. Inserisci i dati del genitore/tutore.');
                }
                // Validate parent email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.parentEmail)) {
                    throw new Error('Inserisci un\'email valida per il genitore/tutore');
                }
                // L'email del genitore non può essere uguale a quella del minore
                if (formData.parentEmail.toLowerCase() === formData.email.toLowerCase()) {
                    throw new Error('L\'email del genitore deve essere diversa dalla tua email');
                }
            }

            // Validazione dichiarazione consenso per 16-17 anni
            if (requiresMinorDeclaration && !formData.minorConsent) {
                throw new Error('Devi dichiarare di avere il consenso dei tuoi genitori per procedere');
            }

            // Registra l'utente in Supabase Auth con metadata per identificare il tipo utente
            const { data: authData, error: authError } = await this.supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        user_type: 'privato',
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        birth_date: formData.birthDate,
                        codice_fiscale: codiceFiscale,
                        is_minor: isMinor
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // Prepara i dati per private_users
                const privateUserData = {
                    id: authData.user.id,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    birth_date: formData.birthDate,
                    codice_fiscale: codiceFiscale,
                    codice_fiscale_verified: true,
                    codice_fiscale_verified_at: new Date().toISOString(),
                    privacy_level: isMinor ? 'privato' : 'pubblico', // Minori hanno profilo privato di default
                    is_minor: isMinor,
                    parental_consent_required: requiresParentalConsent,
                    parental_consent_verified: false,
                    account_status: requiresParentalConsent ? 'pending_parental_consent' : 'active'
                };

                // Se l'utente è confermato immediatamente (email confirmation disabilitata)
                if (authData.user.email_confirmed_at) {
                    try {
                        // Crea il profilo utente
                        await this.createUserProfile(authData.user, 'privato');

                        // Crea i dati specifici dell'utente privato
                        const { error: privateError } = await this.supabase
                            .from('private_users')
                            .insert([privateUserData]);

                        if (privateError) {
                            console.error('Errore creazione dati utente privato:', privateError);
                        }

                        // Se richiede consenso parentale, invia email tramite Edge Function
                        if (requiresParentalConsent) {
                            await this.sendParentalConsentEmail(
                                authData.user.id,
                                formData.parentEmail,
                                formData.parentName,
                                formData.firstName,
                                formData.lastName,
                                formData.email,
                                formData.birthDate,
                                codiceFiscale
                            );
                        }
                    } catch (profileError) {
                        console.warn('Profilo utente verrà creato al primo login:', profileError);
                        localStorage.setItem('pendingProfile', JSON.stringify({
                            userId: authData.user.id,
                            userType: 'privato',
                            privateData: privateUserData,
                            parentalConsent: requiresParentalConsent ? {
                                parentEmail: formData.parentEmail,
                                parentName: formData.parentName,
                                minorFirstName: formData.firstName,
                                minorLastName: formData.lastName,
                                minorEmail: formData.email,
                                minorBirthDate: formData.birthDate,
                                minorCodiceFiscale: codiceFiscale
                            } : null
                        }));
                    }
                } else {
                    // Salva i dati per crearli dopo la conferma email
                    localStorage.setItem('pendingProfile', JSON.stringify({
                        userId: authData.user.id,
                        userType: 'privato',
                        privateData: privateUserData,
                        parentalConsent: requiresParentalConsent ? {
                            parentEmail: formData.parentEmail,
                            parentName: formData.parentName,
                            minorFirstName: formData.firstName,
                            minorLastName: formData.lastName,
                            minorEmail: formData.email,
                            minorBirthDate: formData.birthDate,
                            minorCodiceFiscale: codiceFiscale
                        } : null
                    }));
                }

                // Messaggio appropriato in base allo stato
                let successMessage = 'Registrazione completata! Controlla la tua email per confermare l\'account.';
                if (requiresParentalConsent) {
                    successMessage = 'Registrazione completata! Abbiamo inviato un\'email al tuo genitore/tutore per confermare il consenso. Il tuo account sarà attivo dopo la conferma.';
                }

                this.showNotification(successMessage, 'success');

                return { success: true, user: authData.user, requiresParentalConsent };
            }

        } catch (error) {
            console.error('Errore registrazione utente privato:', error);

            if (window.eduNetErrorHandler) {
                window.eduNetErrorHandler.handle(error, 'Private User Registration');
            } else {
                this.showNotification(error.message || 'Errore durante la registrazione', 'error');
            }

            return { success: false, error: error.message };
        } finally {
            this.hideLoading();
        }
    }

    // Invia email di consenso parentale tramite Edge Function
    async sendParentalConsentEmail(minorUserId, parentEmail, parentName, minorFirstName, minorLastName, minorEmail, minorBirthDate, minorCodiceFiscale) {
        try {
            const response = await fetch(`${window.SUPABASE_URL}/functions/v1/send-parental-consent-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    minorUserId,
                    parentEmail,
                    parentName,
                    minorFirstName,
                    minorLastName,
                    minorEmail,
                    minorBirthDate,
                    minorCodiceFiscale
                })
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Errore invio email consenso parentale:', result);
                // Non bloccare la registrazione, logga solo l'errore
            } else {
                console.log('✅ Email consenso parentale inviata:', result);
            }

            return result;
        } catch (error) {
            console.error('Errore chiamata Edge Function:', error);
            // Non bloccare la registrazione
            return { success: false, error: error.message };
        }
    }

    // Invia email di verifica istituto all'indirizzo MIUR
    async sendInstituteVerificationEmail(instituteId, instituteData) {
        try {
            // Prima genera un nuovo token di verifica
            const { data: tokenData, error: tokenError } = await this.supabase
                .rpc('generate_verification_token', {
                    p_institute_id: instituteId
                });

            if (tokenError) {
                console.error('❌ Errore generazione token verifica:', tokenError);
                return { success: false, error: tokenError.message };
            }

            console.log('📋 Token verifica generato:', tokenData);

            // Se non c'è email MIUR, non possiamo inviare
            if (!instituteData.email_miur) {
                console.warn('⚠️ Nessuna email MIUR disponibile per verifica');
                return { success: false, error: 'Email MIUR non disponibile' };
            }

            // Invia email tramite Edge Function (da creare)
            const response = await fetch(`${window.SUPABASE_URL}/functions/v1/send-institute-verification-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    instituteId,
                    instituteName: instituteData.institute_name,
                    instituteCode: instituteData.institute_code,
                    emailMiur: instituteData.email_miur,
                    registrantName: instituteData.registrant_name,
                    registrantRole: instituteData.registrant_role,
                    emailAccount: instituteData.email_account,
                    verificationToken: tokenData?.token
                })
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('❌ Errore invio email verifica istituto:', result);
                // Non bloccare la registrazione
            } else {
                console.log('✅ Email verifica istituto inviata:', result);
            }

            return result;
        } catch (error) {
            console.error('❌ Errore chiamata Edge Function verifica istituto:', error);
            // Non bloccare la registrazione
            return { success: false, error: error.message };
        }
    }

    // Validazione età semplice (fallback se age-verification.js non è caricato)
    validateAgeSimple(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        if (age < 14) {
            return { valid: false, error: 'Devi avere almeno 14 anni per registrarti' };
        }

        return {
            valid: true,
            age,
            isMinor: age < 18,
            requiresParentalConsent: age < 16,
            requiresMinorConsent: age >= 16 && age < 18
        };
    }

    // Crea richiesta di consenso parentale
    async createParentalConsentRequest(userId, parentEmail, parentName, childFirstName) {
        try {
            // Genera token univoco
            const consentToken = this.generateConsentToken();
            const tokenExpires = new Date();
            tokenExpires.setHours(tokenExpires.getHours() + 48); // Scade in 48 ore

            // Salva nel database
            const { error } = await this.supabase
                .from('parental_consents')
                .insert([{
                    minor_user_id: userId,
                    parent_email: parentEmail,
                    parent_name: parentName,
                    consent_token: consentToken,
                    token_expires_at: tokenExpires.toISOString()
                }]);

            if (error) {
                console.error('Errore creazione richiesta consenso parentale:', error);
                return;
            }

            // TODO: Inviare email al genitore con link di conferma
            // Per ora logghiamo il link che dovrebbe essere inviato
            const confirmUrl = window.AppConfig.getPageUrl(`pages/legal/parental-consent.html?token=${consentToken}`);
            console.log('Link conferma consenso parentale:', confirmUrl);
            console.log('Da inviare a:', parentEmail);

        } catch (error) {
            console.error('Errore nel processo di consenso parentale:', error);
        }
    }

    // Genera token per consenso parentale
    generateConsentToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Login utente
    async login(email, password) {
        try {
            // Rate limiting check
            if (window.rateLimiter && !window.rateLimiter.checkAndNotify('login', email)) {
                return { success: false, error: 'Troppi tentativi di accesso. Riprova tra qualche minuto.' };
            }

            this.showLoading('Accesso in corso...');

            // Validazione dati
            if (!email || !password) {
                throw new Error('Email e password sono obbligatori');
            }

            // Effettua il login con retry logic per errori di rete
            const loginFn = async () => {
                return await this.supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
            };

            let data, error;
            if (window.networkUtils) {
                const result = await window.networkUtils.withRetry(loginFn, {
                    maxRetries: 2,
                    baseDelay: 1000,
                    retryOn: (err) => window.networkUtils.isRetryableError(err)
                });
                data = result.data;
                error = result.error;
            } else {
                const result = await loginFn();
                data = result.data;
                error = result.error;
            }

            if (error) throw error;

            if (data.user) {
                // Verifica che il profilo utente esista in user_profiles o school_institutes
                let { data: profile, error: profileError } = await this.supabase
                    .from('user_profiles')
                    .select('id')
                    .eq('id', data.user.id)
                    .maybeSingle();

                // Se non trovato in user_profiles, prova school_institutes
                if (!profile) {
                    console.log('🔍 Profilo non in user_profiles, verifico school_institutes...');
                    const { data: instituteProfile, error: instituteError } = await this.supabase
                        .from('school_institutes')
                        .select('id')
                        .eq('id', data.user.id)
                        .maybeSingle();

                    if (instituteProfile) {
                        console.log('✅ Profilo istituto trovato:', instituteProfile.id);
                        profile = instituteProfile;
                    } else if (instituteError && instituteError.code !== 'PGRST116') {
                        console.error('Errore verifica istituto:', instituteError);
                    }
                }

                if (profileError && profileError.code !== 'PGRST116') {
                    console.error('Errore verifica profilo:', profileError);
                }

                if (!profile) {
                    console.warn('Profilo non trovato in nessuna tabella per:', data.user.id);
                    // Logout per evitare sessioni incomplete
                    await this.supabase.auth.signOut();
                    throw new Error('Account non completamente configurato. Contatta l\'assistenza.');
                }

                console.log('✅ Profilo verificato, procedo con login');
                // Il profilo verrà caricato automaticamente tramite onAuthStateChange
                return { success: true, user: data.user };
            }

        } catch (error) {
            console.error('Errore login:', error);
            let errorMessage = 'Errore durante l\'accesso';

            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Email o password non corretti';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Devi confermare la tua email prima di accedere';
            } else if (error.message.includes('Too many requests')) {
                errorMessage = 'Troppi tentativi di accesso. Riprova più tardi';
            } else if (error.message.includes('Profilo utente non trovato') || error.message.includes('Account non completamente configurato')) {
                errorMessage = error.message;
            }

            // Usa il sistema di gestione errori se disponibile
            if (window.eduNetErrorHandler) {
                window.eduNetErrorHandler.handle(error, 'User Login');
            } else {
                this.showNotification(errorMessage, 'error');
            }

            return { success: false, error: errorMessage };
        } finally {
            this.hideLoading();
        }
    }

    // Logout utente
    async logout() {
        try {
            this.showLoading('Disconnessione in corso...');

            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;

            // La pulizia dei dati avviene automaticamente tramite onAuthStateChange
            return { success: true };

        } catch (error) {
            console.error('Errore logout:', error);
            this.showNotification('Errore durante la disconnessione', 'error');
            return { success: false, error: error.message };
        } finally {
            this.hideLoading();
        }
    }

    async loadUserProfile(user) {
        try {
            console.log('🔄 Caricamento profilo per utente:', user.id);

            // Controlla i metadata dell'utente per determinare il tipo corretto
            const userMetadata = user.user_metadata || {};
            const expectedUserType = userMetadata.user_type || null;
            console.log('📋 Metadata utente:', userMetadata);
            console.log('📋 Tipo utente atteso dai metadata:', expectedUserType);

            // Prima prova a caricare da user_profiles (utenti privati)
            let { data: profile, error: profileError } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Errore nel caricamento profilo base:', profileError);
            }

            // Se non trovato in user_profiles, prova school_institutes
            if (!profile) {

                const { data: instituteProfile, error: instituteError } = await this.supabase
                    .from('school_institutes')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                if (instituteError && instituteError.code !== 'PGRST116') {
                    console.error('Errore caricamento istituto:', instituteError);
                }

                if (instituteProfile) {
                    // Trasforma il profilo istituto in formato compatibile
                    profile = {
                        id: instituteProfile.id,
                        user_type: 'istituto',
                        first_name: instituteProfile.institute_name,
                        last_name: '',
                        email: instituteProfile.email,
                        avatar_url: instituteProfile.logo_url,
                        institute_name: instituteProfile.institute_name,
                        institute_type: instituteProfile.institute_type,
                        verified: instituteProfile.verified,
                        instituteData: instituteProfile
                    };
                    console.log('✅ Profilo istituto caricato:', profile.institute_name);
                }
            } else {
                console.log('✅ Profilo base caricato, user_type nel DB:', profile.user_type);

                // IMPORTANTE: Se i metadata dicono che è un utente privato ma il DB dice istituto, correggi
                if (expectedUserType === 'privato' && profile.user_type === 'istituto') {
                    console.log('⚠️ CORREZIONE: Metadata dicono privato, DB dice istituto. Correggo...');
                    profile.user_type = 'privato';

                    // Aggiorna il DB in background
                    this.supabase.from('user_profiles').update({ user_type: 'privato' }).eq('id', user.id)
                        .then(({ error }) => {
                            if (error) {
                                console.error('❌ Errore aggiornamento user_type:', error);
                            } else {
                                console.log('✅ user_type corretto nel DB');
                            }
                        });
                }

                // Carica i dati specifici in base al tipo utente
                if (profile.user_type === 'istituto') {
                    console.log('🏫 Caricamento dati istituto aggiuntivi...');
                    const { data: instituteData, error: instituteError } = await this.supabase
                        .from('school_institutes')
                        .select('*')
                        .eq('id', user.id)
                        .maybeSingle();

                    // LOGGING CRITICO PER DEBUG
                    console.log('🔍 DEBUG ISTITUTO:', instituteData);

                    // Controlla anche se esiste in private_users
                    const { data: privateDataCheck } = await this.supabase
                        .from('private_users')
                        .select('*')
                        .eq('id', user.id)
                        .maybeSingle();

                    console.log('🔍 DEBUG PRIVATE_USERS:', privateDataCheck);

                    // ALWAYS attach institute data if found, even if incomplete, to avoid regression for valid institutes
                    if (instituteData) {
                        profile.instituteData = instituteData;
                    }

                    // Check if institute data is valid:
                    // 1. Must have type AND name
                    // 2. Name should look like a real school name (contains keywords like Liceo, Istituto, Scuola, etc.)
                    // 3. Should NOT exist in private_users (if exists there, it's a private user)
                    let isValidInstitute = instituteData && instituteData.institute_type && instituteData.institute_name;

                    // Se esiste in private_users, è sicuramente un utente privato
                    if (privateDataCheck) {
                        console.log('✅ Utente trovato in private_users - è un utente privato!');
                        isValidInstitute = false;
                    }

                    // Verifica se il nome sembra un nome di scuola reale
                    // MA se ha un tipo valido, accetta comunque (nomi MIUR possono essere località)
                    if (isValidInstitute && instituteData.institute_name) {
                        const schoolKeywords = ['liceo', 'istituto', 'scuola', 'comprensivo', 'tecnico', 'professionale', 'università', 'politecnico', 'accademia', 'conservatorio'];
                        const nameLower = instituteData.institute_name.toLowerCase();
                        const looksLikeSchool = schoolKeywords.some(keyword => nameLower.includes(keyword));

                        // Se non sembra un nome di scuola E non ha codice meccanografico
                        // Verifica se almeno il tipo è valido
                        if (!looksLikeSchool && !instituteData.codice_meccanografico && !instituteData.institute_code) {
                            const validTypes = [
                                'Scuola dell\'Infanzia', 'Scuola Primaria', 'Scuola Secondaria',
                                'Liceo', 'Istituto Tecnico', 'Istituto Professionale', 'ITS', 'Università'
                            ];
                            const hasValidType = validTypes.some(t =>
                                instituteData.institute_type?.toLowerCase().includes(t.toLowerCase())
                            );

                            if (hasValidType) {
                                console.log('✅ Tipo istituto valido, accetto:', instituteData.institute_type);
                                // Mantieni isValidInstitute = true
                            } else {
                                console.warn('⚠️ Nome istituto non sembra una scuola reale:', instituteData.institute_name);
                                isValidInstitute = false;
                            }
                        }
                    }

                    // Se i dati istituto sembrano incompleti o invalidi, controlliamo se è un utente privato
                    if (!isValidInstitute) {
                        console.warn('⚠️ Dati istituto incompleti o invalidi. Verifico se è un utente privato...');

                        let isPrivateUser = false;
                        let privateData = null;

                        // 1. Usa i dati già recuperati da private_users
                        if (privateDataCheck) {
                            isPrivateUser = true;
                            privateData = privateDataCheck;
                            console.log('✅ Dati utente privato trovati:', privateData);
                        } else {
                            // 2. Fallback: Controlla metadata auth
                            console.log('🔍 Controllo metadata utente per conferma tipo...');
                            const metadata = this.currentUser?.user_metadata;

                            // PRIORITÀ AI METADATA: Se dicono istituto, CREA i dati mancanti
                            if (metadata && (metadata.user_type === 'istituto' || metadata.type === 'istituto')) {
                                console.log('✅ Metadata confermano ISTITUTO - creo dati mancanti in school_institutes');

                                // Crea i dati istituto dai metadata
                                const newInstituteData = {
                                    id: user.id,
                                    institute_name: metadata.institute_name || metadata.instituteName || 'Istituto',
                                    institute_type: metadata.institute_type || metadata.instituteType || 'Istituto Scolastico',
                                    institute_code: metadata.institute_code || metadata.instituteCode || null,
                                    verified: !!(metadata.institute_code || metadata.instituteCode)
                                };

                                console.log('📝 Creazione dati istituto:', newInstituteData);

                                // Crea record in school_institutes
                                this.supabase.from('school_institutes').upsert([newInstituteData], { onConflict: 'id' })
                                    .then(({ error }) => {
                                        if (error) console.error('❌ Errore creazione school_institutes:', error);
                                        else console.log('✅ Record school_institutes creato dai metadata');
                                    });

                                // Aggiorna il profilo locale
                                profile.instituteData = newInstituteData;
                                profile.institute_name = newInstituteData.institute_name;
                                profile.institute_type = newInstituteData.institute_type;
                                isPrivateUser = false; // NON è un utente privato!

                            } else if (metadata && (metadata.user_type === 'privato' || metadata.type === 'privato')) {
                                console.log('✅ Metadata conferma utente privato:', metadata);
                                isPrivateUser = true;
                                // Costruisci dati temporanei dai metadata se disponibili
                                privateData = {
                                    id: user.id,
                                    first_name: metadata.first_name || metadata.name || 'Utente',
                                    last_name: metadata.last_name || metadata.surname || ''
                                };
                            } else {
                                // 3. NESSUN METADATA CHIARO: Solo in questo caso forza a privato
                                console.warn('⚠️ Nessun metadata chiaro sul tipo utente. Assumo privato.');
                                isPrivateUser = true;

                                privateData = {
                                    id: user.id,
                                    first_name: 'Utente',
                                    last_name: ''
                                };
                            }
                        }

                        if (isPrivateUser) {
                            console.log('✅ Identificato come utente privato. Correggo tipo.');
                            profile.user_type = 'privato';
                            profile.privateData = privateData;
                            profile.first_name = privateData.first_name;
                            profile.last_name = privateData.last_name;

                            // Aggiorna DB in background
                            this.supabase.from('user_profiles').update({ user_type: 'privato' }).eq('id', user.id)
                                .then(({ error }) => {
                                    if (error) console.error('❌ Errore aggiornamento user_type:', error);
                                    else console.log('✅ user_type aggiornato a privato nel DB');
                                });

                            // Se non esistono dati in private_users, creali con upsert
                            if (!privateDataCheck && privateData) {
                                this.supabase.from('private_users').upsert([{
                                    id: user.id,
                                    first_name: privateData.first_name,
                                    last_name: privateData.last_name,
                                    privacy_level: 'pubblico'
                                }], { onConflict: 'id' }).then(({ error }) => {
                                    if (error) console.error('❌ Errore creazione private_users:', error);
                                    else console.log('✅ Record private_users creato');
                                });
                            }

                            // Rimuovi il record zombie da school_institutes se esiste
                            if (instituteData && !instituteData.codice_meccanografico) {
                                this.supabase.from('school_institutes').delete().eq('id', user.id)
                                    .then(({ error }) => {
                                        if (error) console.error('❌ Errore rimozione school_institutes zombie:', error);
                                        else console.log('✅ Record school_institutes zombie rimosso');
                                    });
                            }
                        } else {
                            console.warn('⚠️ Utente non trovato in private_users e metadata non conclusivi. ID:', user.id);
                        }
                    }
                } else if (profile.user_type === 'privato') {
                    // PRIMA DI TUTTO: Controlla se i metadata dicono che è un ISTITUTO
                    // Questo ha la priorità assoluta perché i metadata sono la fonte di verità
                    const metadata = user.user_metadata || {};

                    if (metadata.user_type === 'istituto') {
                        console.log('🏫 CORREZIONE: DB dice privato ma metadata dicono ISTITUTO!');
                        console.log('📋 Metadata istituto:', metadata);

                        // Correggi il tipo nel profilo
                        profile.user_type = 'istituto';

                        // Aggiorna user_profiles
                        this.supabase.from('user_profiles').update({ user_type: 'istituto' }).eq('id', user.id)
                            .then(({ error }) => {
                                if (error) console.error('❌ Errore aggiornamento user_type:', error);
                                else console.log('✅ user_type corretto a istituto nel DB');
                            });

                        // Verifica/Crea dati in school_institutes
                        const { data: existingInstitute } = await this.supabase
                            .from('school_institutes')
                            .select('*')
                            .eq('id', user.id)
                            .maybeSingle();

                        if (existingInstitute) {
                            console.log('✅ Dati istituto già esistenti:', existingInstitute.institute_name);
                            profile.instituteData = existingInstitute;
                            profile.institute_name = existingInstitute.institute_name;
                        } else {
                            // Crea dati istituto dai metadata
                            console.log('📝 Creo dati istituto dai metadata...');
                            const newInstituteData = {
                                id: user.id,
                                institute_name: metadata.institute_name || 'Istituto',
                                institute_type: metadata.institute_type || 'Istituto Scolastico',
                                institute_code: metadata.institute_code || null,
                                verified: !!metadata.institute_code
                            };

                            const { data: createdInstitute, error: createError } = await this.supabase
                                .from('school_institutes')
                                .insert([newInstituteData])
                                .select()
                                .single();

                            if (createError) {
                                console.error('❌ Errore creazione school_institutes:', createError);
                                profile.instituteData = newInstituteData;
                                profile.institute_name = newInstituteData.institute_name;
                            } else {
                                console.log('✅ Dati istituto creati:', createdInstitute);
                                profile.instituteData = createdInstitute;
                                profile.institute_name = createdInstitute.institute_name;
                            }
                        }

                        // Elimina eventuali dati errati in private_users
                        this.supabase.from('private_users').delete().eq('id', user.id)
                            .then(({ error }) => {
                                if (!error) console.log('🗑️ Dati private_users errati rimossi');
                            });

                    } else {
                        // È veramente un utente privato
                        console.log('👤 Caricamento dati utente privato...');
                        const { data: privateData, error: privateError } = await this.supabase
                            .from('private_users')
                            .select('*')
                            .eq('id', user.id)
                            .maybeSingle();

                        if (privateData) {
                            console.log('👤 Dati utente privato caricati:', privateData);
                            profile.privateData = privateData;
                            profile.first_name = privateData.first_name;
                            profile.last_name = privateData.last_name;
                        } else {
                            // Dati non trovati in private_users
                            console.warn('⚠️ Dati privato non trovati in private_users.');

                            if (metadata.first_name || metadata.last_name) {
                                console.log('📋 Recupero dati dai metadata:', metadata);

                                const newPrivateData = {
                                    id: user.id,
                                    first_name: metadata.first_name || 'Utente',
                                    last_name: metadata.last_name || '',
                                    privacy_level: 'pubblico'
                                };

                                const { data: createdData, error: createError } = await this.supabase
                                    .from('private_users')
                                    .insert([newPrivateData])
                                    .select()
                                    .single();

                                if (createError) {
                                    console.error('❌ Errore creazione dati utente privato:', createError);
                                    profile.privateData = newPrivateData;
                                    profile.first_name = newPrivateData.first_name;
                                    profile.last_name = newPrivateData.last_name;
                                } else {
                                    console.log('✅ Dati utente privato creati:', createdData);
                                    profile.privateData = createdData;
                                    profile.first_name = createdData.first_name;
                                    profile.last_name = createdData.last_name;
                                }
                            } else {
                                // Nessun metadata utile, usa default
                                console.log('📧 Creo dati utente privato con default...');

                                // Usa "Utente" come default invece dell'email
                                const newPrivateData = {
                                    id: user.id,
                                    first_name: 'Utente',
                                    last_name: '',
                                    privacy_level: 'pubblico'
                                };

                                // Prova a creare i dati in private_users
                                const { data: createdData, error: createError } = await this.supabase
                                    .from('private_users')
                                    .insert([newPrivateData])
                                    .select()
                                    .single();

                                if (createError) {
                                    console.warn('⚠️ Impossibile creare dati in private_users:', createError.message);
                                    // Usa comunque i dati estratti dall'email
                                    profile.privateData = newPrivateData;
                                    profile.first_name = newPrivateData.first_name;
                                    profile.last_name = newPrivateData.last_name;
                                } else {
                                    console.log('✅ Dati utente privato creati dall\'email:', createdData);
                                    profile.privateData = createdData;
                                    profile.first_name = createdData.first_name;
                                    profile.last_name = createdData.last_name;
                                }
                            }
                        }
                    }
                }
            }

            // Se ancora non c'è profilo, crealo
            if (!profile) {
                console.log('⚠️ Profilo non trovato, creazione in corso...');
                await this.createUserProfile(user);
                return;
            }

            // =====================================================
            // CONTROLLO COLLABORATORE
            // Verifica se l'utente è un collaboratore di un istituto
            // =====================================================
            try {
                const { data: collabData, error: collabError } = await this.supabase.rpc('get_collaborator_profile');

                if (!collabError && collabData && collabData.is_collaborator) {
                    console.log('👥 Utente è un COLLABORATORE!', collabData);

                    // Aggiungi i dati collaboratore al profilo
                    profile.is_collaborator = true;
                    profile.collaborator_data = collabData;
                    profile.collaborator_role = collabData.role;
                    profile.collaborator_institute_id = collabData.institute_id;

                    // Aggiorna nome dal profilo collaboratore
                    if (collabData.first_name && collabData.first_name !== 'Collaboratore') {
                        profile.first_name = collabData.first_name;
                        profile.last_name = collabData.last_name || '';
                    }

                    // Per i collaboratori admin/editor, permetti accesso alle funzionalità istituto
                    if (collabData.role === 'admin' || collabData.role === 'editor') {
                        profile.can_manage_institute = true;
                        profile.managed_institute_id = collabData.institute_id;
                        profile.managed_institute_name = collabData.institute_name;
                        profile.managed_institute_type = collabData.institute_type;
                    }

                    console.log('✅ Profilo collaboratore configurato:', {
                        name: `${profile.first_name} ${profile.last_name}`,
                        role: collabData.role,
                        institute: collabData.institute_name
                    });
                }
            } catch (collabCheckError) {
                console.warn('⚠️ Errore controllo collaboratore (non bloccante):', collabCheckError);
            }

            this.userProfile = profile;
            console.log('✅ Profilo caricato:', profile.user_type, profile.is_collaborator ? '(collaboratore)' : '');

        } catch (error) {
            console.error('Errore caricamento profilo:', error);
            this.showNotification('Errore nel caricamento del profilo', 'error');
        }
    }

    // Sincronizza le preferenze utente dal database al local storage
    async syncUserPreferences(userId) {
        try {
            console.log('🔄 Syncing user preferences for:', userId);

            // 1. Fetch preferences from DB
            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('preferences')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.warn('⚠️ Error fetching user preferences:', error);
                return;
            }

            // 2. If preferences exist in DB, apply them locally
            if (data && data.preferences) {
                console.log('🎨 Found preferences in DB:', data.preferences);

                // Use the global preference manager if available
                if (window.EduNetPrefs && typeof window.EduNetPrefs.save === 'function') {
                    window.EduNetPrefs.save(data.preferences);
                    console.log('✅ Global preferences updated from DB');
                } else {
                    // Fallback: update localStorage directly
                    const current = JSON.parse(localStorage.getItem('edunet_settings') || '{}');
                    const updated = { ...current, ...data.preferences };
                    localStorage.setItem('edunet_settings', JSON.stringify(updated));
                    console.log('✅ LocalStorage preferences updated from DB (fallback)');
                }
            } else {
                console.log('ℹ️ No preferences found in DB for this user');
            }
        } catch (e) {
            console.error('❌ Unexpected error syncing preferences:', e);
        }
    }

    async createUserProfile(user, userType = null) {
        try {
            console.log('🆕 Creazione nuovo profilo per utente:', user.id, 'tipo:', userType);

            // Se non specificato, determina il tipo dal processo di registrazione
            if (!userType) {
                // Questo dovrebbe essere passato durante la registrazione
                userType = 'privato'; // Default
            }

            const { data, error } = await this.supabase
                .from('user_profiles')
                .insert([{
                    id: user.id,
                    user_type: userType,
                    email_verified: user.email_confirmed_at ? true : false
                }])
                .select()
                .single();

            if (error) {
                console.error('❌ Errore creazione profilo base:', error);
                throw error;
            }

            console.log('✅ Profilo base creato:', data);
            this.userProfile = data;

            return data;

        } catch (error) {
            console.error('❌ Errore creazione profilo:', error);
            this.showNotification('Errore nella creazione del profilo', 'error');
            throw error;
        }
    }



    // Reset password
    async resetPassword(email) {
        try {
            this.showLoading('Invio email di reset...');

            if (!email) {
                throw new Error('Email è obbligatoria');
            }

            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.AppConfig.getPageUrl('reset-password.html')
            });

            if (error) throw error;

            this.showNotification(
                'Email di reset inviata! Controlla la tua casella di posta.',
                'success'
            );

            return { success: true };

        } catch (error) {
            console.error('Errore reset password:', error);
            this.showNotification(error.message || 'Errore durante il reset della password', 'error');
            return { success: false, error: error.message };
        } finally {
            this.hideLoading();
        }
    }

    // Aggiorna profilo utente
    async updateProfile(profileData) {
        try {
            this.showLoading('Aggiornamento profilo...');

            if (!this.currentUser) {
                throw new Error('Utente non autenticato');
            }

            // Aggiorna i dati base del profilo
            const { error: profileError } = await this.supabase
                .from('user_profiles')
                .update({
                    profile_completed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', this.currentUser.id);

            if (profileError) throw profileError;

            // Aggiorna i dati specifici in base al tipo utente
            if (this.userProfile?.user_type === 'istituto') {
                const { error: instituteError } = await this.supabase
                    .from('school_institutes')
                    .update({
                        ...profileData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', this.currentUser.id);

                if (instituteError) throw instituteError;

            } else if (this.userProfile?.user_type === 'privato') {
                const { error: privateError } = await this.supabase
                    .from('private_users')
                    .update({
                        ...profileData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', this.currentUser.id);

                if (privateError) throw privateError;
            }

            // Ricarica il profilo aggiornato
            await this.loadUserProfile(this.currentUser);

            this.showNotification('Profilo aggiornato con successo!', 'success');
            return { success: true };

        } catch (error) {
            console.error('Errore aggiornamento profilo:', error);
            this.showNotification(error.message || 'Errore durante l\'aggiornamento', 'error');
            return { success: false, error: error.message };
        } finally {
            this.hideLoading();
        }
    }

    // Utility functions
    showNotification(message, type = 'info') {
        // Rimuovi notifiche esistenti
        const existingNotifications = document.querySelectorAll('.auth-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Crea nuova notifica
        const notification = document.createElement('div');
        notification.className = `auth-notification auth-notification-${type}`;
        notification.innerHTML = `
            <div class="auth-notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="auth-notification-close" aria-label="Chiudi notifica">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Aggiungi al DOM
        document.body.appendChild(notification);

        // Funzione per rimuovere con animazione
        const removeNotification = () => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        };

        // Event listener per il pulsante di chiusura
        const closeBtn = notification.querySelector('.auth-notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', removeNotification);
        }

        // Auto-rimozione dopo 4 secondi (sincronizzato con la progress bar CSS)
        setTimeout(removeNotification, 4000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    showLoading(message = 'Caricamento...') {
        // Rimuovi loader esistenti
        const existingLoader = document.querySelector('.auth-loader');
        if (existingLoader) {
            existingLoader.remove();
        }

        // Crea nuovo loader
        const loader = document.createElement('div');
        loader.className = 'auth-loader';
        loader.innerHTML = `
            <div class="auth-loader-content">
                <div class="auth-loader-spinner"></div>
                <p>${message}</p>
            </div>
        `;

        document.body.appendChild(loader);
    }

    hideLoading() {
        const loader = document.querySelector('.auth-loader');
        if (loader) {
            loader.remove();
        }
    }

    // Chiudi tutti i modal aperti
    closeAllModals() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
        });
    }

    // Getter per informazioni utente
    getCurrentUser() {
        return this.currentUser;
    }

    getUserProfile() {
        return this.userProfile;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    getUserType() {
        return this.userProfile?.user_type || null;
    }

    isInstitute() {
        return this.getUserType() === 'istituto';
    }

    isPrivateUser() {
        return this.getUserType() === 'privato';
    }

    // Verifica se l'utente ha completato il profilo
    isProfileCompleted() {
        return this.userProfile?.profile_completed || false;
    }

    // Verifica se l'email è stata confermata
    isEmailVerified() {
        return this.currentUser?.email_confirmed_at ? true : false;
    }

    /**
     * Invia inviti admin durante la registrazione
     */
    async sendAdminInvites(instituteId, formData) {
        const adminEmails = [];

        // Raccogli email admin se fornite
        if (formData.admin1Email && formData.admin1Email.trim()) {
            adminEmails.push(formData.admin1Email.trim().toLowerCase());
        }
        if (formData.admin2Email && formData.admin2Email.trim()) {
            adminEmails.push(formData.admin2Email.trim().toLowerCase());
        }

        if (adminEmails.length === 0) {
            return; // Nessun admin da invitare
        }

        console.log(`📨 Invio ${adminEmails.length} inviti admin...`);

        // Invia inviti
        for (const email of adminEmails) {
            try {
                const { error } = await this.supabase
                    .rpc('invite_institute_admin', {
                        p_institute_id: instituteId,
                        p_email: email,
                        p_invited_by: instituteId,
                        p_role: 'admin'
                    });

                if (error) {
                    console.error(`Errore invio invito a ${email}:`, error);
                } else {
                    console.log(`✅ Invito inviato a ${email}`);
                }
            } catch (error) {
                console.error(`Errore invio invito a ${email}:`, error);
            }
        }
    }
}

// Inizializza l'autenticazione globalmente
window.eduNetAuth = new EduNetAuth();