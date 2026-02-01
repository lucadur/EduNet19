/**
 * Age Verification and Parental Consent Module
 * Handles age calculation, validation, and parental consent flow
 * Per GDPR Art. 8 e normativa italiana sulla protezione dei minori
 */

class AgeVerification {
    constructor() {
        this.minAge = 14; // Età minima per registrazione
        this.parentalConsentAge = 16; // Sotto questa età serve consenso parentale
        this.adultAge = 18; // Maggiore età
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        const birthDateInput = document.getElementById('birthDate');
        if (birthDateInput) {
            // Set max date to today
            const today = new Date().toISOString().split('T')[0];
            birthDateInput.setAttribute('max', today);
            
            // Set min date (100 years ago)
            const minDate = new Date();
            minDate.setFullYear(minDate.getFullYear() - 100);
            birthDateInput.setAttribute('min', minDate.toISOString().split('T')[0]);
            
            // Add change listener
            birthDateInput.addEventListener('change', (e) => this.handleBirthDateChange(e));
        }
    }

    /**
     * Calculate age from birth date
     */
    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    /**
     * Handle birth date change
     */
    handleBirthDateChange(event) {
        const birthDate = event.target.value;
        if (!birthDate) return;

        const age = this.calculateAge(birthDate);
        const errorElement = document.getElementById('birthDate-error');
        const parentalSection = document.getElementById('parentalConsentSection');
        const minorSection = document.getElementById('minorConsentSection');
        const parentEmailInput = document.getElementById('parentEmail');
        const parentNameInput = document.getElementById('parentName');
        const minorConsentCheckbox = document.getElementById('minorConsent');

        // Reset all sections
        if (parentalSection) parentalSection.style.display = 'none';
        if (minorSection) minorSection.style.display = 'none';
        if (errorElement) errorElement.textContent = '';
        
        // Reset required attributes
        if (parentEmailInput) parentEmailInput.removeAttribute('required');
        if (parentNameInput) parentNameInput.removeAttribute('required');
        if (minorConsentCheckbox) minorConsentCheckbox.removeAttribute('required');

        // Validate age
        if (age < this.minAge) {
            // Under 14: cannot register
            if (errorElement) {
                errorElement.textContent = `Devi avere almeno ${this.minAge} anni per registrarti su EduNet19. Se hai meno di ${this.minAge} anni, chiedi a un genitore o tutore di creare un account per te.`;
            }
            event.target.classList.add('is-invalid');
            event.target.classList.remove('is-valid');
            return { valid: false, reason: 'under_minimum_age', age };
        } 
        else if (age < this.parentalConsentAge) {
            // 14-15: requires parental consent
            if (parentalSection) {
                parentalSection.style.display = 'block';
                if (parentEmailInput) parentEmailInput.setAttribute('required', 'required');
                if (parentNameInput) parentNameInput.setAttribute('required', 'required');
            }
            event.target.classList.remove('is-invalid');
            event.target.classList.add('is-valid');
            return { valid: true, requiresParentalConsent: true, age };
        }
        else if (age < this.adultAge) {
            // 16-17: requires consent declaration
            if (minorSection) {
                minorSection.style.display = 'block';
                if (minorConsentCheckbox) minorConsentCheckbox.setAttribute('required', 'required');
            }
            event.target.classList.remove('is-invalid');
            event.target.classList.add('is-valid');
            return { valid: true, requiresMinorConsent: true, age };
        }
        else {
            // 18+: adult, no special requirements
            event.target.classList.remove('is-invalid');
            event.target.classList.add('is-valid');
            return { valid: true, isAdult: true, age };
        }
    }

    /**
     * Validate age before form submission
     */
    validateAge(birthDate) {
        if (!birthDate) {
            return { valid: false, error: 'La data di nascita è obbligatoria' };
        }

        const age = this.calculateAge(birthDate);

        if (age < this.minAge) {
            return { 
                valid: false, 
                error: `Devi avere almeno ${this.minAge} anni per registrarti`,
                age 
            };
        }

        return {
            valid: true,
            age,
            isMinor: age < this.adultAge,
            requiresParentalConsent: age < this.parentalConsentAge,
            requiresMinorConsent: age >= this.parentalConsentAge && age < this.adultAge
        };
    }

    /**
     * Validate parental consent fields
     */
    validateParentalConsent(parentEmail, parentName) {
        const errors = [];

        if (!parentEmail || !parentEmail.trim()) {
            errors.push('L\'email del genitore/tutore è obbligatoria');
        } else if (!this.isValidEmail(parentEmail)) {
            errors.push('Inserisci un\'email valida per il genitore/tutore');
        }

        if (!parentName || !parentName.trim()) {
            errors.push('Il nome del genitore/tutore è obbligatorio');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate minor consent checkbox
     */
    validateMinorConsent(isChecked) {
        if (!isChecked) {
            return {
                valid: false,
                error: 'Devi dichiarare di avere il consenso dei tuoi genitori per procedere'
            };
        }
        return { valid: true };
    }

    /**
     * Simple email validation
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Generate consent token
     */
    generateConsentToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Get token expiration (48 hours from now)
     */
    getTokenExpiration() {
        const expiration = new Date();
        expiration.setHours(expiration.getHours() + 48);
        return expiration.toISOString();
    }
}

// Initialize and export
window.ageVerification = new AgeVerification();
