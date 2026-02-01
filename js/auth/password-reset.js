/**
 * Sistema di Reset Password e Verifica Email per EduNet19
 * Gestisce il recupero password e la verifica dell'indirizzo email
 */

class EduNetPasswordReset {
    constructor() {
        this.supabase = null;
        this.init();
    }

    async init() {
        // Usa il client Supabase centralizzato
        this.supabase = await window.supabaseClientManager.getClient();

        if (!this.supabase) {
            console.warn('⚠️ Client Supabase non disponibile per PasswordReset');
        }

        // Gestisce i parametri URL per reset password
        this.handleUrlParams();
    }

    // Gestisce parametri URL per reset password e verifica email
    handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        const token = urlParams.get('token');

        if (type === 'recovery' && token) {
            this.handlePasswordReset(token);
        } else if (type === 'email_confirmation' && token) {
            this.handleEmailConfirmation(token);
        }
    }

    // Invia email di reset password
    async sendPasswordResetEmail(email) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase non inizializzato');
            }

            if (!email || !this.isValidEmail(email)) {
                throw new Error('Inserisci un indirizzo email valido');
            }

            this.showLoading('Invio email di reset...');

            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.AppConfig.getPageUrl('reset-password.html')
            });

            if (error) throw error;

            this.showNotification(
                'Email di reset inviata! Controlla la tua casella di posta e segui le istruzioni.',
                'success'
            );

            return { success: true };

        } catch (error) {
            console.error('Errore invio email reset:', error);

            if (window.eduNetErrorHandler) {
                window.eduNetErrorHandler.handle(error, 'Password Reset Email');
            } else {
                this.showNotification(
                    'Errore nell\'invio dell\'email. Riprova più tardi.',
                    'error'
                );
            }

            return { success: false, error: error.message };
        } finally {
            this.hideLoading();
        }
    }

    // Gestisce il reset della password
    async handlePasswordReset(token) {
        try {
            // Verifica il token
            const { error } = await this.supabase.auth.verifyOtp({
                token_hash: token,
                type: 'recovery'
            });

            if (error) throw error;

            // Mostra form per nuova password
            this.showPasswordResetForm();

        } catch (error) {
            console.error('Errore verifica token reset:', error);
            this.showNotification(
                'Link di reset non valido o scaduto. Richiedi un nuovo reset.',
                'error'
            );
        }
    }

    // Aggiorna la password
    async updatePassword(newPassword, confirmPassword) {
        try {
            if (!newPassword || !confirmPassword) {
                throw new Error('Inserisci entrambe le password');
            }

            if (newPassword !== confirmPassword) {
                throw new Error('Le password non coincidono');
            }

            if (!this.isValidPassword(newPassword)) {
                throw new Error('La password deve contenere almeno 8 caratteri, una maiuscola, una minuscola, un numero e un carattere speciale');
            }

            this.showLoading('Aggiornamento password...');

            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            this.showNotification(
                'Password aggiornata con successo! Ora puoi accedere con la nuova password.',
                'success'
            );

            // Reindirizza alla pagina di login dopo 3 secondi
            setTimeout(() => {
                window.location.href = window.AppConfig.getPageUrl('index.html');
            }, 3000);

            return { success: true };

        } catch (error) {
            console.error('Errore aggiornamento password:', error);

            if (window.eduNetErrorHandler) {
                window.eduNetErrorHandler.handle(error, 'Password Update');
            } else {
                this.showNotification(error.message, 'error');
            }

            return { success: false, error: error.message };
        } finally {
            this.hideLoading();
        }
    }

    // Gestisce la conferma email
    async handleEmailConfirmation(token) {
        try {
            const { error } = await this.supabase.auth.verifyOtp({
                token_hash: token,
                type: 'email'
            });

            if (error) throw error;

            this.showNotification(
                'Email confermata con successo! Ora puoi accedere al tuo account.',
                'success'
            );

            // Reindirizza alla pagina principale dopo 3 secondi
            setTimeout(() => {
                window.location.href = window.AppConfig.getPageUrl('index.html');
            }, 3000);

        } catch (error) {
            console.error('Errore conferma email:', error);
            this.showNotification(
                'Link di conferma non valido o scaduto. Contatta il supporto.',
                'error'
            );
        }
    }

    // Reinvia email di conferma
    async resendConfirmationEmail(email) {
        try {
            if (!this.supabase) {
                throw new Error('Supabase non inizializzato');
            }

            if (!email || !this.isValidEmail(email)) {
                throw new Error('Inserisci un indirizzo email valido');
            }

            this.showLoading('Invio email di conferma...');

            const { error } = await this.supabase.auth.resend({
                type: 'signup',
                email: email
            });

            if (error) throw error;

            this.showNotification(
                'Email di conferma inviata! Controlla la tua casella di posta.',
                'success'
            );

            return { success: true };

        } catch (error) {
            console.error('Errore invio conferma email:', error);

            if (window.eduNetErrorHandler) {
                window.eduNetErrorHandler.handle(error, 'Email Confirmation Resend');
            } else {
                this.showNotification(
                    'Errore nell\'invio dell\'email. Riprova più tardi.',
                    'error'
                );
            }

            return { success: false, error: error.message };
        } finally {
            this.hideLoading();
        }
    }

    // Mostra form per reset password
    showPasswordResetForm() {
        const formHtml = `
            <div class="password-reset-form">
                <h2>Imposta Nuova Password</h2>
                <form id="newPasswordForm">
                    <div class="form-group">
                        <label for="newPassword">Nuova Password</label>
                        <input type="password" id="newPassword" name="newPassword" 
                               data-validate="password" required>
                    </div>
                    <div class="form-group">
                        <label for="confirmNewPassword">Conferma Nuova Password</label>
                        <input type="password" id="confirmNewPassword" name="confirmNewPassword" 
                               data-validate="confirmPassword" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Aggiorna Password</button>
                </form>
            </div>
        `;

        // Sostituisce il contenuto della pagina
        document.body.innerHTML = formHtml;

        // Aggiunge event listener
        document.getElementById('newPasswordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            await this.updatePassword(
                formData.get('newPassword'),
                formData.get('confirmNewPassword')
            );
        });
    }

    // Validazione email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validazione password
    isValidPassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    }

    // Utility per notifiche
    showNotification(message, type = 'info', duration = 5000) {
        if (window.eduNetAuth && window.eduNetAuth.showNotification) {
            window.eduNetAuth.showNotification(message, type, duration);
        } else {
            // Fallback
            alert(message);
        }
    }

    // Utility per loading
    showLoading(message = 'Caricamento...') {
        if (window.eduNetAuth && window.eduNetAuth.showLoading) {
            window.eduNetAuth.showLoading(message);
        }
    }

    hideLoading() {
        if (window.eduNetAuth && window.eduNetAuth.hideLoading) {
            window.eduNetAuth.hideLoading();
        }
    }
}

// Inizializzazione globale
window.eduNetPasswordReset = new EduNetPasswordReset();

// Export per moduli ES6 se supportati
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EduNetPasswordReset;
}