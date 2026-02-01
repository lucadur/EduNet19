/* ===================================================================
   2FA TOTP LIBRARY - EduNet19
   Time-based One-Time Password Authentication
   =================================================================== */

class TwoFactorAuth {
  constructor() {
    this.supabase = null;
    this.init();
  }

  async init() {
    if (window.supabaseClientManager) {
      this.supabase = await window.supabaseClientManager.getClient();
    }
  }

  // Genera un nuovo secret TOTP per l'utente
  async generateSecret() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      // Chiama la funzione server per generare il secret
      // Nota: Supabase RPC passa automaticamente i parametri
      const { data, error } = await this.supabase.rpc('generate_2fa_secret', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Errore RPC generate_2fa_secret:', error);
        throw error;
      }

      // La funzione ritorna un JSON, quindi data è già l'oggetto
      return {
        secret: data.secret,
        qrCodeUrl: data.qr_code_url,
        backupCodes: data.backup_codes
      };
    } catch (error) {
      console.error('Errore generazione secret 2FA:', error);
      throw error;
    }
  }

  // Verifica un codice TOTP
  async verifyCode(code) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      // Chiama la funzione server per verificare il codice
      const { data, error } = await this.supabase.rpc('verify_2fa_code', {
        p_user_id: user.id,
        p_code: code
      });

      if (error) throw error;

      return data; // true se valido, false altrimenti
    } catch (error) {
      console.error('Errore verifica codice 2FA:', error);
      throw error;
    }
  }

  // Attiva il 2FA per l'utente
  async enable2FA(verificationCode) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      // Prima verifica il codice
      const isValid = await this.verifyCode(verificationCode);
      if (!isValid) {
        throw new Error('Codice di verifica non valido');
      }

      // Attiva il 2FA
      const { error } = await this.supabase
        .from('user_2fa')
        .update({ is_enabled: true })
        .eq('user_id', user.id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Errore attivazione 2FA:', error);
      throw error;
    }
  }

  // Disattiva il 2FA per l'utente
  async disable2FA(password) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      // Verifica la password prima di disattivare
      const { error: signInError } = await this.supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      });

      if (signInError) throw new Error('Password errata');

      // Disattiva il 2FA
      const { error } = await this.supabase
        .from('user_2fa')
        .update({ is_enabled: false })
        .eq('user_id', user.id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Errore disattivazione 2FA:', error);
      throw error;
    }
  }

  // Verifica se il 2FA è attivo per l'utente
  async is2FAEnabled() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await this.supabase
        .from('user_2fa')
        .select('is_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      return data?.is_enabled || false;
    } catch (error) {
      console.error('Errore verifica stato 2FA:', error);
      return false;
    }
  }

  // Verifica un backup code
  async verifyBackupCode(code) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      const { data, error } = await this.supabase.rpc('verify_backup_code', {
        p_user_id: user.id,
        p_code: code
      });

      if (error) throw error;

      return data; // true se valido, false altrimenti
    } catch (error) {
      console.error('Errore verifica backup code:', error);
      throw error;
    }
  }

  // Genera QR code come immagine
  generateQRCodeImage(qrCodeUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = qrCodeUrl;
    });
  }

  // Formatta il secret per visualizzazione
  formatSecret(secret) {
    // Divide il secret in gruppi di 4 caratteri
    return secret.match(/.{1,4}/g).join(' ');
  }

  // Scarica i backup codes come file di testo
  downloadBackupCodes(backupCodes) {
    const text = `EduNet19 - Codici di Backup 2FA
    
⚠️ IMPORTANTE: Conserva questi codici in un luogo sicuro!

Ogni codice può essere utilizzato una sola volta per accedere al tuo account se non hai accesso all'app di autenticazione.

Codici di Backup:
${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

Data generazione: ${new Date().toLocaleString('it-IT')}
`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edunet19-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Inizializza globalmente
window.twoFactorAuth = new TwoFactorAuth();
