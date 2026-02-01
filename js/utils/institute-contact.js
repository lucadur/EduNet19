// ============================================
// SISTEMA CONTATTO ISTITUTO
// ============================================

class InstituteContactManager {
    constructor() {
        this.instituteEmail = null;
        this.instituteName = null;
        this.userEmail = null;
        this.userName = null;
        this.templates = {
            info: {
                subject: 'Richiesta informazioni',
                body: 'Buongiorno,\n\nvorrei ricevere maggiori informazioni riguardo...\n\nGrazie per la disponibilità.\n\nCordiali saluti'
            },
            collaboration: {
                subject: 'Proposta di collaborazione',
                body: 'Buongiorno,\n\nvi scrivo per proporre una collaborazione riguardante...\n\nRimango a disposizione per ulteriori dettagli.\n\nCordiali saluti'
            },
            visit: {
                subject: 'Richiesta visita istituto',
                body: 'Buongiorno,\n\nvorrei richiedere la possibilità di visitare il vostro istituto per...\n\nGrazie per la disponibilità.\n\nCordiali saluti'
            },
            other: {
                subject: 'Contatto',
                body: 'Buongiorno,\n\n'
            }
        };
    }

    async init(instituteId, instituteData) {
        console.log('📧 Initializing contact system for institute:', instituteId);
        
        this.instituteEmail = instituteData?.email || instituteData?.contact_email;
        this.instituteName = instituteData?.institute_name || instituteData?.name;
        
        // Carica info utente corrente
        await this.loadUserInfo();
        
        // Renderizza il form solo se l'utente è privato e non è il proprio profilo
        if (this.shouldShowContactForm(instituteId)) {
            this.renderContactForm();
            this.setupEventListeners();
        }
        
        console.log('✅ Contact system initialized');
    }

    async loadUserInfo() {
        try {
            const supabase = window.supabaseClientManager 
                ? await window.supabaseClientManager.getClient() 
                : window.supabase;
            
            if (!supabase) return;
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('user_type, full_name, email')
                .eq('id', user.id)
                .single();
            
            if (profile) {
                this.userType = profile.user_type;
                this.userName = profile.full_name;
                this.userEmail = profile.email || user.email;
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }

    shouldShowContactForm(instituteId) {
        // Mostra solo per utenti privati che visitano profili altrui
        const currentUserId = window.profilePage?.currentUserId;
        const isOwnProfile = currentUserId === instituteId;
        const isPrivateUser = this.userType === 'privato';
        
        return isPrivateUser && !isOwnProfile && this.instituteEmail;
    }

    renderContactForm() {
        const container = document.getElementById('contact-institute-container');
        if (!container) {
            console.warn('Contact container not found');
            return;
        }

        container.innerHTML = `
            <div class="contact-institute-section">
                <div class="contact-header">
                    <span class="contact-icon">✉️</span>
                    <h3>Contatta ${this.instituteName || 'l\'istituto'}</h3>
                </div>
                
                <p class="contact-description">
                    Compila il form per inviare un'email all'istituto. 
                    Si aprirà il tuo client email predefinito con il messaggio precompilato.
                </p>

                <form id="contact-form" class="contact-form">
                    <div class="form-group">
                        <label>Tipo di richiesta</label>
                        <div class="contact-template-selector">
                            <div class="template-chip active" data-template="info">
                                📋 Informazioni
                            </div>
                            <div class="template-chip" data-template="collaboration">
                                🤝 Collaborazione
                            </div>
                            <div class="template-chip" data-template="visit">
                                🏫 Visita
                            </div>
                            <div class="template-chip" data-template="other">
                                💬 Altro
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="contact-subject">Oggetto *</label>
                        <input 
                            type="text" 
                            id="contact-subject" 
                            name="subject"
                            placeholder="Oggetto dell'email"
                            required
                            maxlength="100">
                    </div>

                    <div class="form-group">
                        <label for="contact-message">Messaggio *</label>
                        <textarea 
                            id="contact-message" 
                            name="message"
                            placeholder="Scrivi qui il tuo messaggio..."
                            required
                            minlength="20"
                            maxlength="1000"></textarea>
                        <small class="char-counter">0 / 1000 caratteri</small>
                    </div>

                    <div class="contact-info-box">
                        <div class="contact-info-item">
                            <svg fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                            </svg>
                            <span>Email: <strong>${this.instituteEmail}</strong></span>
                        </div>
                    </div>

                    <div class="contact-actions">
                        <button type="button" class="btn-contact btn-contact-secondary" id="reset-form-btn">
                            🔄 Reimposta
                        </button>
                        <button type="submit" class="btn-contact btn-contact-primary">
                            📧 Apri Email
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Imposta template iniziale
        this.applyTemplate('info');
    }

    setupEventListeners() {
        const form = document.getElementById('contact-form');
        const subjectInput = document.getElementById('contact-subject');
        const messageTextarea = document.getElementById('contact-message');
        const charCounter = document.querySelector('.char-counter');
        const resetBtn = document.getElementById('reset-form-btn');
        const templateChips = document.querySelectorAll('.template-chip');

        // Template selector
        templateChips.forEach(chip => {
            chip.addEventListener('click', () => {
                templateChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const template = chip.dataset.template;
                this.applyTemplate(template);
            });
        });

        // Character counter
        if (messageTextarea && charCounter) {
            messageTextarea.addEventListener('input', () => {
                const length = messageTextarea.value.length;
                charCounter.textContent = `${length} / 1000 caratteri`;
                
                if (length > 900) {
                    charCounter.style.color = '#f44336';
                } else if (length > 700) {
                    charCounter.style.color = '#ff9800';
                } else {
                    charCounter.style.color = '#999';
                }
            });
        }

        // Reset button
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const activeChip = document.querySelector('.template-chip.active');
                const template = activeChip?.dataset.template || 'info';
                this.applyTemplate(template);
            });
        }

        // Form submit
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.openEmailClient();
            });
        }
    }

    applyTemplate(templateKey) {
        const template = this.templates[templateKey];
        if (!template) return;

        const subjectInput = document.getElementById('contact-subject');
        const messageTextarea = document.getElementById('contact-message');

        if (subjectInput) subjectInput.value = template.subject;
        if (messageTextarea) {
            messageTextarea.value = template.body;
            // Trigger input event per aggiornare il counter
            messageTextarea.dispatchEvent(new Event('input'));
        }
    }

    openEmailClient() {
        const subject = document.getElementById('contact-subject')?.value || '';
        const message = document.getElementById('contact-message')?.value || '';

        if (!subject || !message) {
            alert('Compila tutti i campi obbligatori');
            return;
        }

        if (message.length < 20) {
            alert('Il messaggio deve contenere almeno 20 caratteri');
            return;
        }

        // Aggiungi firma automatica
        const signature = `\n\n---\n${this.userName || 'Utente'}\n${this.userEmail || ''}`;
        const fullMessage = message + signature;

        // Costruisci mailto URL
        const mailtoUrl = this.buildMailtoUrl(
            this.instituteEmail,
            subject,
            fullMessage
        );

        console.log('📧 Opening email client...');
        
        // Apri client email
        window.location.href = mailtoUrl;

        // Mostra messaggio di conferma
        this.showSuccessMessage();
    }

    buildMailtoUrl(to, subject, body) {
        // Encode dei parametri per URL
        const params = new URLSearchParams({
            subject: subject,
            body: body
        });

        return `mailto:${encodeURIComponent(to)}?${params.toString()}`;
    }

    showSuccessMessage() {
        const form = document.getElementById('contact-form');
        if (!form) return;

        const successMsg = document.createElement('div');
        successMsg.className = 'contact-success-message';
        successMsg.innerHTML = `
            <span>✅</span>
            <span>Client email aperto! Controlla la tua applicazione email.</span>
        `;

        form.parentElement.insertBefore(successMsg, form);

        // Rimuovi dopo 5 secondi
        setTimeout(() => {
            successMsg.remove();
        }, 5000);
    }
}

// Inizializza manager globale
const instituteContactManager = new InstituteContactManager();
