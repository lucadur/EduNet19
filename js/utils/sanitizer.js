/**
 * ===================================================================
 * EDUNET19 - HTML SANITIZER
 * Protezione XSS per contenuti utente
 * Fallback leggero se DOMPurify non è disponibile
 * ===================================================================
 */

'use strict';

class EduNetSanitizer {
  constructor() {
    // Controlla se DOMPurify è disponibile
    this.hasDOMPurify = typeof DOMPurify !== 'undefined';
    
    // Tag HTML permessi (whitelist)
    this.allowedTags = [
      'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'span',
      'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'
    ];
    
    // Attributi permessi per tag
    this.allowedAttributes = {
      'a': ['href', 'title', 'target', 'rel'],
      'span': ['class'],
      'code': ['class'],
      'pre': ['class']
    };
    
    // Pattern pericolosi da rimuovere
    this.dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:/gi,
      /vbscript:/gi,
      /expression\s*\(/gi
    ];
    
    console.log(`🛡️ EduNetSanitizer initialized - DOMPurify: ${this.hasDOMPurify ? 'available' : 'fallback mode'}`);
  }
  
  /**
   * Sanitizza HTML - metodo principale
   * @param {string} dirty - HTML potenzialmente pericoloso
   * @param {object} options - Opzioni di sanitizzazione
   * @returns {string} HTML sicuro
   */
  sanitize(dirty, options = {}) {
    if (!dirty || typeof dirty !== 'string') {
      return '';
    }
    
    // Usa DOMPurify se disponibile
    if (this.hasDOMPurify) {
      return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: options.allowedTags || this.allowedTags,
        ALLOWED_ATTR: options.allowedAttr || ['href', 'title', 'target', 'rel', 'class'],
        ALLOW_DATA_ATTR: false,
        ...options
      });
    }
    
    // Fallback: sanitizzazione manuale
    return this.manualSanitize(dirty, options);
  }
  
  /**
   * Sanitizzazione manuale (fallback)
   */
  manualSanitize(dirty, options = {}) {
    let clean = dirty;
    
    // Rimuovi pattern pericolosi
    for (const pattern of this.dangerousPatterns) {
      clean = clean.replace(pattern, '');
    }
    
    // Escape caratteri HTML base
    clean = this.escapeHtml(clean);
    
    // Se richiesto, ripristina alcuni tag sicuri
    if (options.allowBasicFormatting) {
      clean = this.restoreSafeTags(clean);
    }
    
    return clean;
  }
  
  /**
   * Escape HTML completo
   */
  escapeHtml(text) {
    if (!text || typeof text !== 'string') return '';
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    
    return text.replace(/[&<>"'`=/]/g, char => map[char]);
  }
  
  /**
   * Ripristina tag sicuri dopo escape
   */
  restoreSafeTags(escaped) {
    // Ripristina solo tag di formattazione base
    const safeTagPatterns = [
      { escaped: '&lt;b&gt;', tag: '<b>' },
      { escaped: '&lt;/b&gt;', tag: '</b>' },
      { escaped: '&lt;i&gt;', tag: '<i>' },
      { escaped: '&lt;/i&gt;', tag: '</i>' },
      { escaped: '&lt;u&gt;', tag: '<u>' },
      { escaped: '&lt;/u&gt;', tag: '</u>' },
      { escaped: '&lt;strong&gt;', tag: '<strong>' },
      { escaped: '&lt;/strong&gt;', tag: '</strong>' },
      { escaped: '&lt;em&gt;', tag: '<em>' },
      { escaped: '&lt;/em&gt;', tag: '</em>' },
      { escaped: '&lt;br&gt;', tag: '<br>' },
      { escaped: '&lt;br/&gt;', tag: '<br>' },
      { escaped: '&lt;br /&gt;', tag: '<br>' },
      { escaped: '&lt;p&gt;', tag: '<p>' },
      { escaped: '&lt;/p&gt;', tag: '</p>' }
    ];
    
    let result = escaped;
    for (const { escaped: esc, tag } of safeTagPatterns) {
      result = result.split(esc).join(tag);
    }
    
    return result;
  }
  
  /**
   * Sanitizza per uso in attributi HTML
   */
  sanitizeAttribute(value) {
    if (!value || typeof value !== 'string') return '';
    
    return value
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }
  
  /**
   * Sanitizza URL
   */
  sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    
    // Rimuovi spazi
    url = url.trim();
    
    // Blocca protocolli pericolosi
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = url.toLowerCase();
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        return '';
      }
    }
    
    // Permetti solo http, https, mailto, tel
    const allowedProtocols = ['http://', 'https://', 'mailto:', 'tel:', '//', '/'];
    const hasAllowedProtocol = allowedProtocols.some(p => lowerUrl.startsWith(p));
    
    // Se non ha protocollo, assumiamo sia un path relativo
    if (!hasAllowedProtocol && !url.includes(':')) {
      return url;
    }
    
    if (!hasAllowedProtocol) {
      return '';
    }
    
    return url;
  }
  
  /**
   * Sanitizza per inserimento in JSON
   */
  sanitizeForJson(value) {
    if (!value || typeof value !== 'string') return '';
    
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }
  
  /**
   * Crea elemento HTML sicuro
   */
  createElement(tag, attributes = {}, content = '') {
    // Verifica che il tag sia permesso
    if (!this.allowedTags.includes(tag.toLowerCase())) {
      tag = 'span';
    }
    
    const element = document.createElement(tag);
    
    // Aggiungi attributi sicuri
    const allowedAttrs = this.allowedAttributes[tag] || [];
    for (const [key, value] of Object.entries(attributes)) {
      if (allowedAttrs.includes(key) || key === 'class' || key === 'id') {
        element.setAttribute(key, this.sanitizeAttribute(value));
      }
    }
    
    // Aggiungi contenuto come testo (non HTML)
    if (content) {
      element.textContent = content;
    }
    
    return element;
  }
  
  /**
   * Imposta innerHTML in modo sicuro
   */
  setInnerHTML(element, html, options = {}) {
    if (!element) return;
    element.innerHTML = this.sanitize(html, options);
  }
  
  /**
   * Imposta textContent (sempre sicuro)
   */
  setTextContent(element, text) {
    if (!element) return;
    element.textContent = text || '';
  }
}

// Crea istanza globale
window.sanitizer = new EduNetSanitizer();

// Alias per compatibilità
window.escapeHtml = (text) => window.sanitizer.escapeHtml(text);
window.sanitizeHtml = (html, options) => window.sanitizer.sanitize(html, options);
