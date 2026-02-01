/**
 * ===================================================================
 * EDUNET19 - SECURE LOGGER
 * Logger condizionale che disabilita i log sensibili in produzione
 * ===================================================================
 */

'use strict';

class EduNetLogger {
  constructor() {
    // Determina se siamo in ambiente di sviluppo
    this.isDev = this.checkIsDevelopment();
    
    // Livelli di log
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      NONE: 4
    };
    
    // Livello corrente (in produzione solo ERROR e superiori)
    this.currentLevel = this.isDev ? this.levels.DEBUG : this.levels.ERROR;
    
    // Pattern di dati sensibili da mascherare
    this.sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /codice.?fiscale/i,
      /email/i,
      /session/i,
      /jwt/i,
      /api.?key/i
    ];
    
    console.log(`📋 EduNetLogger initialized - Mode: ${this.isDev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
  }
  
  /**
   * Verifica se siamo in ambiente di sviluppo
   */
  checkIsDevelopment() {
    const devHosts = ['localhost', '127.0.0.1', '0.0.0.0'];
    const hostname = window.location.hostname;
    
    // Controlla anche se c'è un flag esplicito
    if (window.EDUNET_DEBUG === true) return true;
    if (window.EDUNET_DEBUG === false) return false;
    
    return devHosts.includes(hostname) || hostname.includes('.local');
  }
  
  /**
   * Maschera dati sensibili in un oggetto
   */
  maskSensitiveData(data, depth = 0) {
    if (depth > 5) return '[MAX_DEPTH]';
    
    if (data === null || data === undefined) return data;
    
    if (typeof data === 'string') {
      // Maschera email
      if (data.includes('@')) {
        return data.replace(/(.{2})(.*)(@.*)/, '$1***$3');
      }
      // Maschera token/jwt lunghi
      if (data.length > 50 && /^[A-Za-z0-9._-]+$/.test(data)) {
        return data.substring(0, 10) + '...[MASKED]';
      }
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.maskSensitiveData(item, depth + 1));
    }
    
    if (typeof data === 'object') {
      const masked = {};
      for (const [key, value] of Object.entries(data)) {
        // Controlla se la chiave è sensibile
        const isSensitive = this.sensitivePatterns.some(pattern => pattern.test(key));
        
        if (isSensitive) {
          masked[key] = '[REDACTED]';
        } else {
          masked[key] = this.maskSensitiveData(value, depth + 1);
        }
      }
      return masked;
    }
    
    return data;
  }
  
  /**
   * Formatta il messaggio con timestamp e prefisso
   */
  formatMessage(level, ...args) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[${timestamp}]`;
    
    // In produzione, maschera i dati sensibili
    if (!this.isDev) {
      args = args.map(arg => this.maskSensitiveData(arg));
    }
    
    return [prefix, ...args];
  }
  
  /**
   * Log di debug (solo in sviluppo)
   */
  debug(...args) {
    if (this.currentLevel <= this.levels.DEBUG) {
      console.log(...this.formatMessage('DEBUG', '🔍', ...args));
    }
  }
  
  /**
   * Log informativo (solo in sviluppo)
   */
  info(...args) {
    if (this.currentLevel <= this.levels.INFO) {
      console.log(...this.formatMessage('INFO', '📋', ...args));
    }
  }
  
  /**
   * Log di successo (solo in sviluppo)
   */
  success(...args) {
    if (this.currentLevel <= this.levels.INFO) {
      console.log(...this.formatMessage('SUCCESS', '✅', ...args));
    }
  }
  
  /**
   * Log di caricamento (solo in sviluppo)
   */
  loading(...args) {
    if (this.currentLevel <= this.levels.INFO) {
      console.log(...this.formatMessage('LOADING', '🔄', ...args));
    }
  }
  
  /**
   * Log di warning (sempre visibile in sviluppo)
   */
  warn(...args) {
    if (this.currentLevel <= this.levels.WARN) {
      console.warn(...this.formatMessage('WARN', '⚠️', ...args));
    }
  }
  
  /**
   * Log di errore (sempre visibile)
   */
  error(...args) {
    if (this.currentLevel <= this.levels.ERROR) {
      console.error(...this.formatMessage('ERROR', '❌', ...args));
    }
  }
  
  /**
   * Log di gruppo (solo in sviluppo)
   */
  group(label) {
    if (this.isDev) {
      console.group(label);
    }
  }
  
  groupEnd() {
    if (this.isDev) {
      console.groupEnd();
    }
  }
  
  /**
   * Log con tabella (solo in sviluppo)
   */
  table(data) {
    if (this.isDev) {
      console.table(this.maskSensitiveData(data));
    }
  }
  
  /**
   * Imposta il livello di log
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.currentLevel = this.levels[level];
    }
  }
  
  /**
   * Abilita/disabilita modalità debug
   */
  setDebugMode(enabled) {
    this.isDev = enabled;
    this.currentLevel = enabled ? this.levels.DEBUG : this.levels.ERROR;
  }
}

// Crea istanza globale
window.Logger = new EduNetLogger();

// Alias per compatibilità
window.log = {
  debug: (...args) => window.Logger.debug(...args),
  info: (...args) => window.Logger.info(...args),
  success: (...args) => window.Logger.success(...args),
  loading: (...args) => window.Logger.loading(...args),
  warn: (...args) => window.Logger.warn(...args),
  error: (...args) => window.Logger.error(...args)
};
