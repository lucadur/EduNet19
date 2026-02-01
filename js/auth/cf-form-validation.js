/**
 * Codice Fiscale Form Validation
 * Validazione in tempo reale del CF nel form di registrazione
 * Mostra errori specifici quando i dati non corrispondono
 */

class CFFormValidation {
    constructor() {
        this.debounceTimer = null;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupListeners());
        } else {
            this.setupListeners();
        }
    }

    setupListeners() {
        const cfInput = document.getElementById('codiceFiscale');
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        const birthDateInput = document.getElementById('birthDate');

        if (!cfInput) return;

        // Validazione quando cambia il CF
        cfInput.addEventListener('input', (e) => {
            // Converti in maiuscolo
            e.target.value = e.target.value.toUpperCase();
            this.debounceValidation();
        });

        cfInput.addEventListener('blur', () => this.validateCF());

        // Rivalidazione quando cambiano gli altri campi
        [firstNameInput, lastNameInput, birthDateInput].forEach(input => {
            if (input) {
                input.addEventListener('change', () => this.debounceValidation());
                input.addEventListener('blur', () => this.debounceValidation());
            }
        });
    }

    debounceValidation() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.validateCF(), 500);
    }

    validateCF() {
        const cfInput = document.getElementById('codiceFiscale');
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        const birthDateInput = document.getElementById('birthDate');
        const errorDiv = document.getElementById('codiceFiscale-error');
        const infoDiv = document.getElementById('codiceFiscale-info');

        if (!cfInput || !errorDiv) return;

        const cf = cfInput.value.trim().toUpperCase();
        const firstName = firstNameInput?.value.trim() || '';
        const lastName = lastNameInput?.value.trim() || '';
        const birthDate = birthDateInput?.value || '';

        // Reset stato
        cfInput.classList.remove('is-valid', 'is-invalid');
        errorDiv.innerHTML = '';
        errorDiv.style.display = 'none';

        // Se il CF è vuoto, non validare ancora
        if (!cf) {
            if (infoDiv) {
                infoDiv.innerHTML = `
                    <i class="fas fa-shield-alt"></i>
                    Il codice fiscale viene utilizzato per verificare la tua identità e la tua età reale.
                `;
                infoDiv.style.display = 'block';
            }
            return;
        }

        // Verifica che il validatore sia disponibile
        if (!window.codiceFiscaleValidator) {
            console.warn('CF Validator not loaded');
            return;
        }

        // Validazione formato base
        const formatResult = window.codiceFiscaleValidator.validateFormat(cf);
        if (!formatResult.valid) {
            this.showError(cfInput, errorDiv, formatResult.error, 'format');
            return;
        }

        // Se non abbiamo tutti i dati, mostra solo validazione formato
        if (!firstName || !lastName || !birthDate) {
            // Verifica almeno il carattere di controllo
            if (!window.codiceFiscaleValidator.validateCheckChar(cf)) {
                this.showError(cfInput, errorDiv, 'Il codice fiscale contiene un errore. Verifica di averlo inserito correttamente.', 'checksum');
                return;
            }
            
            // Formato OK ma dati incompleti
            cfInput.classList.add('is-valid');
            if (infoDiv) {
                infoDiv.innerHTML = `
                    <i class="fas fa-check-circle" style="color: #10b981;"></i>
                    Formato codice fiscale valido. Completa gli altri campi per la verifica completa.
                `;
                infoDiv.style.display = 'block';
            }
            return;
        }

        // Validazione completa con dati anagrafici
        const validation = window.codiceFiscaleValidator.validate(cf, firstName, lastName, birthDate);

        if (!validation.valid) {
            this.showDetailedErrors(cfInput, errorDiv, validation.errors, firstName, lastName, birthDate);
            return;
        }

        // Tutto OK - mostra successo
        cfInput.classList.add('is-valid');
        cfInput.classList.remove('is-invalid');
        errorDiv.style.display = 'none';

        if (infoDiv) {
            const ageInfo = validation.age ? ` (${validation.age} anni)` : '';
            infoDiv.innerHTML = `
                <i class="fas fa-check-circle" style="color: #10b981;"></i>
                <strong style="color: #10b981;">Codice fiscale verificato!</strong> I dati corrispondono${ageInfo}.
            `;
            infoDiv.style.display = 'block';
        }
    }

    showError(input, errorDiv, message) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            ${message}
        `;
        errorDiv.style.display = 'block';
    }

    showDetailedErrors(input, errorDiv, errors, firstName, lastName, birthDate) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');

        // Crea messaggi di errore dettagliati e user-friendly
        const errorMessages = errors.map(error => {
            if (error.includes('cognome')) {
                return `<li><i class="fas fa-user"></i> <strong>Cognome non corrispondente:</strong> Il cognome "${lastName}" non corrisponde a quello codificato nel CF. Verifica di aver scritto correttamente sia il cognome che il codice fiscale.</li>`;
            }
            if (error.includes('nome')) {
                return `<li><i class="fas fa-user"></i> <strong>Nome non corrispondente:</strong> Il nome "${firstName}" non corrisponde a quello codificato nel CF. Verifica di aver scritto correttamente sia il nome che il codice fiscale.</li>`;
            }
            if (error.includes('data di nascita')) {
                const formattedDate = birthDate ? new Date(birthDate).toLocaleDateString('it-IT') : 'N/A';
                return `<li><i class="fas fa-calendar-alt"></i> <strong>Data di nascita non corrispondente:</strong> La data ${formattedDate} non corrisponde a quella codificata nel CF. Verifica la data di nascita inserita.</li>`;
            }
            if (error.includes('controllo')) {
                return `<li><i class="fas fa-exclamation-triangle"></i> <strong>Codice fiscale non valido:</strong> Il carattere di controllo non è corretto. Verifica di aver copiato correttamente il codice fiscale.</li>`;
            }
            return `<li><i class="fas fa-times-circle"></i> ${error}</li>`;
        });

        errorDiv.innerHTML = `
            <div class="cf-validation-errors">
                <div class="cf-error-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>⚠️ ATTENZIONE: I dati inseriti NON corrispondono al Codice Fiscale</span>
                </div>
                <div class="cf-error-description">
                    Il codice fiscale contiene informazioni su nome, cognome e data di nascita. 
                    I dati che hai inserito non coincidono con quelli codificati nel CF.
                </div>
                <ul class="cf-error-list">
                    ${errorMessages.join('')}
                </ul>
                <div class="cf-error-suggestion">
                    <i class="fas fa-lightbulb"></i>
                    <div>
                        <strong>Come risolvere:</strong>
                        <ul>
                            <li>Verifica che nome e cognome siano scritti esattamente come sul documento d'identità</li>
                            <li>Controlla che la data di nascita sia corretta</li>
                            <li>Assicurati di aver copiato il codice fiscale senza errori</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        errorDiv.style.display = 'block';
        
        // Scroll all'errore per assicurarsi che sia visibile
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Inizializza
window.cfFormValidation = new CFFormValidation();
