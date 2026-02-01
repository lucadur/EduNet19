// Validation.js - Sistema di validazione avanzato per EduNet19

class EduNetValidation {
    constructor() {
        this.validators = {
            email: this.validateEmail.bind(this),
            password: this.validatePassword.bind(this),
            instituteName: this.validateInstituteName.bind(this),
            instituteType: this.validateInstituteType.bind(this),
            firstName: this.validateFirstName.bind(this),
            lastName: this.validateLastName.bind(this),
            confirmPassword: this.validateConfirmPassword.bind(this),
            phone: this.validatePhone.bind(this),
            website: this.validateWebsite.bind(this),
            pecEmail: this.validatePecEmail.bind(this)
        };
    }
    
    // Metodo per sanitizzare input contro XSS
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '');
    }
    
    // Metodo per validare un form generico
    validateForm(form) {
        const inputs = form.querySelectorAll('[data-validate]');
        let isValid = true;
        
        inputs.forEach(input => {
            const validationType = input.getAttribute('data-validate');
            const value = input.value;
            
            if (this.validators[validationType]) {
                const fieldValid = this.validators[validationType](value);
                if (!fieldValid) {
                    isValid = false;
                    this.showFieldError(input, `${validationType} non valido`);
                } else {
                    this.clearFieldError(input);
                }
            }
        });
        
        return isValid;
    }

    init() {
        // Inizializza la validazione in tempo reale sui form
        this.setupRealTimeValidation();
    }

    // Metodo pubblico per inizializzazione
    initializeValidation() {
        return this.init();
    }

    // =====================================================
    // VALIDATORI SPECIFICI
    // =====================================================

    validateEmail(email) {
        const errors = [];
        
        if (!email || email.trim() === '') {
            errors.push('Email è obbligatoria');
            return { isValid: false, errors };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push('Formato email non valido');
        }

        // Controllo domini comuni per errori di battitura
        const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'libero.it', 'alice.it', 'tin.it'];
        const domain = email.split('@')[1];
        if (domain && !commonDomains.includes(domain.toLowerCase())) {
            // Suggerisci correzioni per errori comuni
            const suggestions = this.suggestEmailCorrection(domain);
            if (suggestions.length > 0) {
                errors.push(`Forse intendevi: ${suggestions.join(', ')}`);
            }
        }

        return { isValid: errors.length === 0, errors };
    }

    validatePassword(password) {
        const errors = [];
        
        if (!password) {
            errors.push('Password è obbligatoria');
            return { isValid: false, errors };
        }

        if (password.length < 8) {
            errors.push('Password deve essere di almeno 8 caratteri');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Password deve contenere almeno una lettera maiuscola');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Password deve contenere almeno una lettera minuscola');
        }

        if (!/\d/.test(password)) {
            errors.push('Password deve contenere almeno un numero');
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password deve contenere almeno un carattere speciale');
        }

        // Controllo password comuni
        const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123'];
        if (commonPasswords.includes(password.toLowerCase())) {
            errors.push('Password troppo comune, scegline una più sicura');
        }

        return { isValid: errors.length === 0, errors };
    }

    validateConfirmPassword(password, confirmPassword) {
        const errors = [];
        
        if (!confirmPassword) {
            errors.push('Conferma password è obbligatoria');
            return { isValid: false, errors };
        }

        if (password !== confirmPassword) {
            errors.push('Le password non coincidono');
        }

        return { isValid: errors.length === 0, errors };
    }

    validateInstituteName(name) {
        const errors = [];
        
        if (!name || name.trim() === '') {
            errors.push('Nome istituto è obbligatorio');
            return { isValid: false, errors };
        }

        if (name.length < 3) {
            errors.push('Nome istituto deve essere di almeno 3 caratteri');
        }

        if (name.length > 255) {
            errors.push('Nome istituto troppo lungo (massimo 255 caratteri)');
        }

        // Controllo caratteri speciali non consentiti
        // Regex aggiornata per accettare caratteri comuni nei nomi MIUR:
        // - Lettere (incluse accentate)
        // - Numeri
        // - Spazi
        // - Punteggiatura comune: . , - ' " ( ) / & : ; « »
        // - Caratteri speciali italiani: °
        if (!/^[a-zA-ZÀ-ÿ0-9\s\-\.\,\'\"\(\)\/\&\:\;\«\»\°\*]+$/.test(name)) {
            errors.push('Nome istituto contiene caratteri non validi');
        }

        return { isValid: errors.length === 0, errors };
    }

    validateInstituteType(type) {
        const errors = [];
        
        if (!type || type.trim() === '') {
            errors.push('Tipo istituto è obbligatorio');
            return { isValid: false, errors };
        }

        const validTypes = [
            'Scuola Secondaria di I Grado',
            'Scuola Secondaria di II Grado',
            'Liceo',
            'Istituto Tecnico',
            'Istituto Professionale',
            'ITS',
            'Università'
        ];

        if (!validTypes.includes(type)) {
            errors.push('Tipo istituto non valido');
        }

        return { isValid: errors.length === 0, errors };
    }

    validateFirstName(firstName) {
        const errors = [];
        
        if (!firstName || firstName.trim() === '') {
            errors.push('Nome è obbligatorio');
            return { isValid: false, errors };
        }

        if (firstName.length < 2) {
            errors.push('Nome deve essere di almeno 2 caratteri');
        }

        if (firstName.length > 100) {
            errors.push('Nome troppo lungo (massimo 100 caratteri)');
        }

        if (!/^[a-zA-ZÀ-ÿ\s\-\']+$/.test(firstName)) {
            errors.push('Nome contiene caratteri non validi');
        }

        return { isValid: errors.length === 0, errors };
    }

    validateLastName(lastName) {
        const errors = [];
        
        if (!lastName || lastName.trim() === '') {
            errors.push('Cognome è obbligatorio');
            return { isValid: false, errors };
        }

        if (lastName.length < 2) {
            errors.push('Cognome deve essere di almeno 2 caratteri');
        }

        if (lastName.length > 100) {
            errors.push('Cognome troppo lungo (massimo 100 caratteri)');
        }

        if (!/^[a-zA-ZÀ-ÿ\s\-\']+$/.test(lastName)) {
            errors.push('Cognome contiene caratteri non validi');
        }

        return { isValid: errors.length === 0, errors };
    }

    validatePhone(phone) {
        const errors = [];
        
        if (!phone) {
            return { isValid: true, errors }; // Telefono opzionale
        }

        // Rimuovi spazi e caratteri speciali per la validazione
        const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
        
        if (!/^\+?[0-9]{8,15}$/.test(cleanPhone)) {
            errors.push('Numero di telefono non valido');
        }

        return { isValid: errors.length === 0, errors };
    }

    validateWebsite(website) {
        const errors = [];
        
        if (!website) {
            return { isValid: true, errors }; // Website opzionale
        }

        try {
            const url = new URL(website.startsWith('http') ? website : `https://${website}`);
            if (!['http:', 'https:'].includes(url.protocol)) {
                errors.push('URL non valido');
            }
        } catch {
            errors.push('URL non valido');
        }

        return { isValid: errors.length === 0, errors };
    }

    validatePecEmail(pecEmail) {
        const errors = [];
        
        if (!pecEmail) {
            return { isValid: true, errors }; // PEC opzionale
        }

        const emailValidation = this.validateEmail(pecEmail);
        if (!emailValidation.isValid) {
            errors.push(...emailValidation.errors);
        }

        // Controllo specifico per PEC
        if (!pecEmail.includes('.pec.') && !pecEmail.endsWith('.pec.it')) {
            errors.push('Email PEC deve avere un dominio PEC valido');
        }

        return { isValid: errors.length === 0, errors };
    }

    // =====================================================
    // VALIDAZIONE FORM COMPLETI
    // =====================================================

    validateLoginForm(formData) {
        const results = {
            email: this.validateEmail(formData.email),
            password: { isValid: !!formData.password, errors: formData.password ? [] : ['Password è obbligatoria'] }
        };

        const isValid = Object.values(results).every(result => result.isValid);
        return { isValid, results };
    }

    validateInstituteRegistrationForm(formData) {
        const results = {
            instituteName: this.validateInstituteName(formData.instituteName),
            instituteType: this.validateInstituteType(formData.instituteType),
            email: this.validateEmail(formData.email),
            password: this.validatePassword(formData.password),
            confirmPassword: this.validateConfirmPassword(formData.password, formData.confirmPassword)
        };

        const isValid = Object.values(results).every(result => result.isValid);
        return { isValid, results };
    }

    validatePrivateUserRegistrationForm(formData) {
        const results = {
            firstName: this.validateFirstName(formData.firstName),
            lastName: this.validateLastName(formData.lastName),
            email: this.validateEmail(formData.email),
            password: this.validatePassword(formData.password),
            confirmPassword: this.validateConfirmPassword(formData.password, formData.confirmPassword)
        };

        const isValid = Object.values(results).every(result => result.isValid);
        return { isValid, results };
    }

    // =====================================================
    // VALIDAZIONE IN TEMPO REALE
    // =====================================================

    setupRealTimeValidation() {
        document.addEventListener('DOMContentLoaded', () => {
            // Trova tutti gli input con attributo data-validate
            const inputs = document.querySelectorAll('input[data-validate]');
            
            inputs.forEach(input => {
                input.addEventListener('blur', (e) => this.validateField(e.target));
                input.addEventListener('input', (e) => this.clearFieldErrors(e.target));
            });
        });
    }

    validateField(field) {
        const validationType = field.getAttribute('data-validate');
        const value = field.value;
        
        if (!this.validators[validationType]) {
            return;
        }

        let result;
        
        // Gestione speciale per conferma password
        if (validationType === 'confirmPassword') {
            const passwordField = field.form.querySelector('input[data-validate="password"]');
            result = this.validators[validationType](passwordField?.value, value);
        } else {
            result = this.validators[validationType](value);
        }

        this.displayFieldValidation(field, result);
        return result;
    }

    displayFieldValidation(field, result) {
        // Rimuovi messaggi di errore esistenti
        this.clearFieldErrors(field);

        if (!result.isValid && result.errors.length > 0) {
            field.classList.add('is-invalid');
            field.classList.remove('is-valid');

            // Trova il div .form-error associato al campo (usa aria-describedby)
            const errorId = field.getAttribute('aria-describedby');
            const errorDiv = errorId ? document.getElementById(errorId) : null;
            
            if (errorDiv) {
                // Usa il div esistente sotto il campo
                errorDiv.textContent = result.errors.join(', ');
                errorDiv.style.display = 'block';
            }
        } else if (field.value.trim() !== '') {
            field.classList.add('is-valid');
            field.classList.remove('is-invalid');
        }
    }

    clearFieldErrors(field) {
        field.classList.remove('is-invalid', 'is-valid');
        
        // Pulisci il div .form-error associato
        const errorId = field.getAttribute('aria-describedby');
        const errorDiv = errorId ? document.getElementById(errorId) : null;
        
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
        }
    }

    // =====================================================
    // UTILITY
    // =====================================================

    suggestEmailCorrection(domain) {
        const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
        const suggestions = [];
        
        commonDomains.forEach(commonDomain => {
            if (this.levenshteinDistance(domain.toLowerCase(), commonDomain) <= 2) {
                suggestions.push(commonDomain);
            }
        });
        
        return suggestions;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // Metodo pubblico per validare un form completo
    validateForm(formType, formData) {
        switch (formType) {
            case 'login':
                return this.validateLoginForm(formData);
            case 'instituteRegistration':
                return this.validateInstituteRegistrationForm(formData);
            case 'privateUserRegistration':
                return this.validatePrivateUserRegistrationForm(formData);
            default:
                return { isValid: false, results: {} };
        }
    }
    
    // Metodo per validare il form di registrazione istituto (compatibilità)
    validateInstituteForm() {
        const form = document.getElementById('instituteForm');
        if (!form) return false;
        
        const formData = new FormData(form);
        const data = {
            instituteName: formData.get('instituteName'),
            instituteType: formData.get('instituteType'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };
        
        const result = this.validateInstituteRegistrationForm(data);
        return result.isValid;
    }
    
    // Validazione specifica per reset password
    validatePasswordReset(data) {
        const errors = [];
        
        if (!data.newPassword) {
            errors.push('La nuova password è obbligatoria');
        } else if (!this.validators.password(data.newPassword)) {
            errors.push('La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale');
        }
        
        if (!data.confirmPassword) {
            errors.push('La conferma password è obbligatoria');
        } else if (data.newPassword !== data.confirmPassword) {
            errors.push('Le password non coincidono');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Inizializza il sistema di validazione
window.eduNetValidation = new EduNetValidation();