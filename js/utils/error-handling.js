/**
 * Sistema Avanzato di Gestione Errori per EduNet19
 * Fornisce messaggi user-friendly e logging dettagliato
 */

class EduNetErrorHandler {
    constructor() {
        this.errorMessages = {
            // Errori di autenticazione
            'Invalid login credentials': 'Email o password non corretti. Riprova.',
            'Email not confirmed': 'Devi confermare la tua email prima di accedere. Controlla la tua casella di posta.',
            'User already registered': 'Un utente con questa email è già registrato. Prova ad accedere o usa un\'altra email.',
            'Signup not allowed for this instance': 'La registrazione non è attualmente consentita. Contatta l\'amministratore.',
            'Password should be at least 6 characters': 'La password deve contenere almeno 6 caratteri.',
            'Unable to validate email address': 'Indirizzo email non valido. Controlla e riprova.',
            'Email rate limit exceeded': 'Troppe richieste. Attendi qualche minuto prima di riprovare.',
            
            // Errori di database
            'duplicate key value violates unique constraint': 'Questi dati sono già presenti nel sistema.',
            'violates foreign key constraint': 'Errore nei dati collegati. Riprova.',
            'violates check constraint': 'I dati inseriti non rispettano i requisiti del sistema.',
            'permission denied': 'Non hai i permessi necessari per questa operazione.',
            'row level security': 'Accesso negato. Verifica i tuoi permessi.',
            
            // Errori di rete
            'NetworkError': 'Errore di connessione. Controlla la tua connessione internet.',
            'Failed to fetch': 'Impossibile connettersi al server. Riprova più tardi.',
            'timeout': 'La richiesta ha impiegato troppo tempo. Riprova.',
            
            // Errori di validazione
            'validation_error': 'I dati inseriti non sono validi. Controlla i campi evidenziati.',
            'required_field': 'Questo campo è obbligatorio.',
            'invalid_email': 'Inserisci un indirizzo email valido.',
            'password_mismatch': 'Le password non coincidono.',
            'weak_password': 'La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale.',
            
            // Errori generici
            'unknown_error': 'Si è verificato un errore imprevisto. Riprova più tardi.',
            'server_error': 'Errore del server. Il nostro team è stato notificato.',
            'maintenance': 'Il sistema è temporaneamente in manutenzione. Riprova più tardi.'
        };
        
        this.init();
    }
    
    init() {
        // Gestione errori globali
        window.addEventListener('error', (event) => {
            this.logError('JavaScript Error', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', event.reason);
            event.preventDefault(); // Previene il log in console
        });
    }
    
    // Gestisce errori di Supabase
    handleSupabaseError(error, context = '') {
        console.error(`Supabase Error [${context}]:`, error);
        
        let userMessage = this.getUserFriendlyMessage(error);
        let errorCode = this.getErrorCode(error);
        
        // Log dettagliato per debugging
        this.logError('Supabase Error', error, {
            context,
            errorCode,
            userMessage
        });
        
        return {
            message: userMessage,
            code: errorCode,
            originalError: error
        };
    }
    
    // Gestisce errori di validazione
    handleValidationError(field, value, validationType) {
        const errorMessage = this.getValidationMessage(validationType, field);
        
        this.logError('Validation Error', new Error(errorMessage), {
            field,
            value: typeof value === 'string' ? value.substring(0, 50) : value,
            validationType
        });
        
        return {
            message: errorMessage,
            code: 'validation_error',
            field
        };
    }
    
    // Gestisce errori di rete
    handleNetworkError(error, url = '', method = '') {
        console.error('Network Error:', error);
        
        let userMessage = 'Errore di connessione. Controlla la tua connessione internet.';
        
        if (error.name === 'AbortError') {
            userMessage = 'Richiesta annullata.';
        } else if (error.message.includes('timeout')) {
            userMessage = 'La richiesta ha impiegato troppo tempo. Riprova.';
        }
        
        this.logError('Network Error', error, {
            url,
            method,
            userMessage
        });
        
        return {
            message: userMessage,
            code: 'network_error',
            originalError: error
        };
    }
    
    // Ottiene messaggio user-friendly
    getUserFriendlyMessage(error) {
        if (!error) return this.errorMessages.unknown_error;
        
        const errorMessage = error.message || error.toString();
        
        // Cerca corrispondenze esatte
        for (const [key, message] of Object.entries(this.errorMessages)) {
            if (errorMessage.includes(key)) {
                return message;
            }
        }
        
        // Gestione errori specifici di Supabase
        if (error.code) {
            switch (error.code) {
                case 'PGRST116':
                    return 'Nessun dato trovato.';
                case 'PGRST301':
                    return 'Troppi risultati trovati. Affina la ricerca.';
                case '23505':
                    return 'Questi dati sono già presenti nel sistema.';
                case '23503':
                    return 'Errore nei dati collegati.';
                case '42501':
                    return 'Non hai i permessi necessari per questa operazione.';
                default:
                    return this.errorMessages.unknown_error;
            }
        }
        
        return this.errorMessages.unknown_error;
    }
    
    // Ottiene codice errore
    getErrorCode(error) {
        if (error.code) return error.code;
        if (error.status) return error.status.toString();
        if (error.name) return error.name;
        return 'unknown';
    }
    
    // Ottiene messaggio di validazione specifico
    getValidationMessage(validationType, field) {
        const fieldName = this.getFieldDisplayName(field);
        
        switch (validationType) {
            case 'email':
                return `Inserisci un indirizzo email valido per ${fieldName}.`;
            case 'password':
                return 'La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale.';
            case 'confirmPassword':
                return 'Le password non coincidono.';
            case 'instituteName':
                return 'Il nome dell\'istituto deve contenere almeno 2 caratteri.';
            case 'firstName':
                return 'Il nome deve contenere almeno 2 caratteri e solo lettere.';
            case 'lastName':
                return 'Il cognome deve contenere almeno 2 caratteri e solo lettere.';
            case 'phone':
                return 'Inserisci un numero di telefono valido.';
            case 'website':
                return 'Inserisci un URL valido (es. https://example.com).';
            case 'required':
                return `${fieldName} è obbligatorio.`;
            default:
                return `${fieldName} non è valido.`;
        }
    }
    
    // Ottiene nome visualizzabile del campo
    getFieldDisplayName(field) {
        const fieldNames = {
            'email': 'Email',
            'password': 'Password',
            'confirmPassword': 'Conferma Password',
            'instituteName': 'Nome Istituto',
            'instituteType': 'Tipo Istituto',
            'firstName': 'Nome',
            'lastName': 'Cognome',
            'phone': 'Telefono',
            'website': 'Sito Web',
            'pecEmail': 'Email PEC'
        };
        
        return fieldNames[field] || field;
    }
    
    // Log dettagliato degli errori
    logError(type, error, context = {}) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            type,
            message: error?.message || error,
            stack: error?.stack,
            context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Log in console per sviluppo
        console.group(`🚨 ${type}`);
        console.error('Error:', error);
        console.log('Context:', context);
        console.log('Full Log:', errorLog);
        console.groupEnd();
        
        // In produzione, invia al servizio di logging
        if (this.isProduction()) {
            this.sendToLoggingService(errorLog);
        }
        
        // Salva in localStorage per debugging
        this.saveErrorToLocalStorage(errorLog);
    }
    
    // Verifica se siamo in produzione
    isProduction() {
        return window.location.hostname !== 'localhost' && 
               window.location.hostname !== '127.0.0.1';
    }
    
    // Invia errore al servizio di logging (da implementare)
    async sendToLoggingService(errorLog) {
        try {
            // Implementa l'invio al tuo servizio di logging preferito
            // Es. Sentry, LogRocket, o un endpoint personalizzato
            console.log('Sending error to logging service:', errorLog);
        } catch (err) {
            console.error('Failed to send error to logging service:', err);
        }
    }
    
    // Salva errore in localStorage per debugging
    saveErrorToLocalStorage(errorLog) {
        try {
            const errors = JSON.parse(localStorage.getItem('edunet_errors') || '[]');
            errors.push(errorLog);
            
            // Mantieni solo gli ultimi 50 errori
            if (errors.length > 50) {
                errors.splice(0, errors.length - 50);
            }
            
            localStorage.setItem('edunet_errors', JSON.stringify(errors));
        } catch (err) {
            console.error('Failed to save error to localStorage:', err);
        }
    }
    
    // Ottiene errori salvati
    getSavedErrors() {
        try {
            return JSON.parse(localStorage.getItem('edunet_errors') || '[]');
        } catch (err) {
            return [];
        }
    }
    
    // Pulisce errori salvati
    clearSavedErrors() {
        localStorage.removeItem('edunet_errors');
    }
    
    // Mostra notifica di errore all'utente
    showErrorNotification(error, duration = 5000) {
        const errorData = this.handleSupabaseError(error);
        
        if (window.eduNetAuth && window.eduNetAuth.showNotification) {
            window.eduNetAuth.showNotification(errorData.message, 'error', duration);
        } else {
            // Fallback se il sistema di notifiche non è disponibile
            alert(errorData.message);
        }
        
        return errorData;
    }
    
    // Gestisce errori in modo centralizzato
    handle(error, context = '', showToUser = true) {
        let errorData;
        
        if (error.name === 'ValidationError') {
            errorData = this.handleValidationError(error.field, error.value, error.type);
        } else if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
            errorData = this.handleNetworkError(error);
        } else {
            errorData = this.handleSupabaseError(error, context);
        }
        
        if (showToUser) {
            this.showErrorNotification(error);
        }
        
        return errorData;
    }
}

// Inizializzazione globale
window.eduNetErrorHandler = new EduNetErrorHandler();

// Export per moduli ES6 se supportati
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EduNetErrorHandler;
}