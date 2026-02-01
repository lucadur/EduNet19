/**
 * ===================================================================
 * EDUNET19 - RATE LIMITER
 * Protezione client-side contro brute force e spam
 * ===================================================================
 */

'use strict';

class EduNetRateLimiter {
  constructor() {
    // Storage per i tentativi
    this.attempts = new Map();
    
    // Configurazioni di default per diverse azioni
    this.configs = {
      login: { maxAttempts: 5, windowMs: 60000, blockMs: 300000 },      // 5 tentativi/min, blocco 5 min
      register: { maxAttempts: 3, windowMs: 60000, blockMs: 600000 },   // 3 tentativi/min, blocco 10 min
      passwordReset: { maxAttempts: 3, windowMs: 300000, blockMs: 900000 }, // 3 tentativi/5min, blocco 15 min
      comment: { maxAttempts: 10, windowMs: 60000, blockMs: 120000 },   // 10 commenti/min, blocco 2 min
      post: { maxAttempts: 5, windowMs: 300000, blockMs: 600000 },      // 5 post/5min, blocco 10 min
      like: { maxAttempts: 30, windowMs: 60000, blockMs: 60000 },       // 30 like/min, blocco 1 min
      search: { maxAttempts: 20, windowMs: 60000, blockMs: 60000 },     // 20 ricerche/min, blocco 1 min
      api: { maxAttempts: 100, windowMs: 60000, blockMs: 120000 }       // 100 chiamate/min, blocco 2 min
    };
    
    // Blocchi attivi
    this.blocks = new Map();
    
    // Carica blocchi persistenti da localStorage
    this.loadPersistedBlocks();
    
    console.log('🛡️ EduNetRateLimiter initialized');
  }
  
  /**
   * Carica blocchi persistenti da localStorage
   */
  loadPersistedBlocks() {
    try {
      const stored = localStorage.getItem('edunet_rate_blocks');
      if (stored) {
        const blocks = JSON.parse(stored);
        const now = Date.now();
        
        // Ripristina solo blocchi ancora attivi
        for (const [key, expiry] of Object.entries(blocks)) {
          if (expiry > now) {
            this.blocks.set(key, expiry);
          }
        }
      }
    } catch (e) {
      // Ignora errori di parsing
    }
  }
  
  /**
   * Salva blocchi in localStorage
   */
  persistBlocks() {
    try {
      const blocksObj = {};
      this.blocks.forEach((expiry, key) => {
        blocksObj[key] = expiry;
      });
      localStorage.setItem('edunet_rate_blocks', JSON.stringify(blocksObj));
    } catch (e) {
      // Ignora errori di storage
    }
  }
  
  /**
   * Verifica se un'azione è permessa
   * @param {string} action - Tipo di azione (login, register, comment, etc.)
   * @param {string} identifier - Identificatore univoco (email, IP, userId)
   * @returns {object} { allowed: boolean, retryAfter?: number, remaining?: number }
   */
  check(action, identifier = 'default') {
    const config = this.configs[action] || this.configs.api;
    const key = `${action}:${identifier}`;
    const now = Date.now();
    
    // Controlla se c'è un blocco attivo
    const blockExpiry = this.blocks.get(key);
    if (blockExpiry && blockExpiry > now) {
      const retryAfter = Math.ceil((blockExpiry - now) / 1000);
      return {
        allowed: false,
        blocked: true,
        retryAfter,
        message: this.getBlockMessage(action, retryAfter)
      };
    }
    
    // Rimuovi blocco scaduto
    if (blockExpiry) {
      this.blocks.delete(key);
      this.persistBlocks();
    }
    
    // Ottieni o crea array di tentativi
    let attemptTimes = this.attempts.get(key) || [];
    
    // Filtra tentativi nella finestra temporale
    attemptTimes = attemptTimes.filter(t => now - t < config.windowMs);
    
    // Controlla se abbiamo superato il limite
    if (attemptTimes.length >= config.maxAttempts) {
      // Applica blocco
      const blockExpiry = now + config.blockMs;
      this.blocks.set(key, blockExpiry);
      this.persistBlocks();
      
      const retryAfter = Math.ceil(config.blockMs / 1000);
      return {
        allowed: false,
        blocked: true,
        retryAfter,
        message: this.getBlockMessage(action, retryAfter)
      };
    }
    
    // Registra il tentativo
    attemptTimes.push(now);
    this.attempts.set(key, attemptTimes);
    
    return {
      allowed: true,
      remaining: config.maxAttempts - attemptTimes.length,
      resetIn: Math.ceil(config.windowMs / 1000)
    };
  }
  
  /**
   * Registra un tentativo senza verificare (per tracking)
   */
  record(action, identifier = 'default') {
    const key = `${action}:${identifier}`;
    const now = Date.now();
    
    let attemptTimes = this.attempts.get(key) || [];
    attemptTimes.push(now);
    this.attempts.set(key, attemptTimes);
  }
  
  /**
   * Resetta i tentativi per un'azione (es. dopo login riuscito)
   */
  reset(action, identifier = 'default') {
    const key = `${action}:${identifier}`;
    this.attempts.delete(key);
    this.blocks.delete(key);
    this.persistBlocks();
  }
  
  /**
   * Ottiene messaggio di blocco user-friendly
   */
  getBlockMessage(action, retryAfter) {
    const minutes = Math.ceil(retryAfter / 60);
    const seconds = retryAfter % 60;
    
    const timeStr = minutes > 0 
      ? `${minutes} minut${minutes === 1 ? 'o' : 'i'}${seconds > 0 ? ` e ${seconds} secondi` : ''}`
      : `${seconds} secondi`;
    
    const messages = {
      login: `Troppi tentativi di accesso. Riprova tra ${timeStr}.`,
      register: `Troppe registrazioni. Riprova tra ${timeStr}.`,
      passwordReset: `Troppe richieste di reset password. Riprova tra ${timeStr}.`,
      comment: `Stai commentando troppo velocemente. Riprova tra ${timeStr}.`,
      post: `Stai pubblicando troppo velocemente. Riprova tra ${timeStr}.`,
      like: `Troppi like in poco tempo. Riprova tra ${timeStr}.`,
      search: `Troppe ricerche. Riprova tra ${timeStr}.`,
      api: `Troppe richieste. Riprova tra ${timeStr}.`
    };
    
    return messages[action] || `Riprova tra ${timeStr}.`;
  }
  
  /**
   * Verifica e mostra notifica se bloccato
   * @returns {boolean} true se l'azione è permessa
   */
  checkAndNotify(action, identifier = 'default') {
    const result = this.check(action, identifier);
    
    if (!result.allowed) {
      // Mostra notifica all'utente
      if (window.eduNetAuth && window.eduNetAuth.showNotification) {
        window.eduNetAuth.showNotification(result.message, 'warning');
      } else if (window.eduNetErrorHandler) {
        window.eduNetErrorHandler.showErrorNotification({ message: result.message });
      }
      return false;
    }
    
    return true;
  }
  
  /**
   * Wrapper per proteggere una funzione async
   */
  protect(action, identifier = 'default') {
    return (fn) => {
      return async (...args) => {
        if (!this.checkAndNotify(action, identifier)) {
          return { success: false, rateLimited: true };
        }
        return fn(...args);
      };
    };
  }
  
  /**
   * Pulisce tentativi e blocchi scaduti
   */
  cleanup() {
    const now = Date.now();
    
    // Pulisci tentativi vecchi
    this.attempts.forEach((times, key) => {
      const config = this.configs[key.split(':')[0]] || this.configs.api;
      const filtered = times.filter(t => now - t < config.windowMs);
      if (filtered.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, filtered);
      }
    });
    
    // Pulisci blocchi scaduti
    this.blocks.forEach((expiry, key) => {
      if (expiry <= now) {
        this.blocks.delete(key);
      }
    });
    
    this.persistBlocks();
  }
}

// Crea istanza globale
window.rateLimiter = new EduNetRateLimiter();

// Cleanup periodico ogni 5 minuti
setInterval(() => {
  if (window.rateLimiter) {
    window.rateLimiter.cleanup();
  }
}, 300000);
