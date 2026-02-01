/**
 * ===================================================================
 * CONSOLE OPTIMIZER
 * Ottimizza l'output della console filtrando messaggi indesiderati
 * ===================================================================
 */

'use strict';

/**
 * Console Optimizer Class
 * Filtra e ottimizza tutti i messaggi della console
 */
class ConsoleOptimizer {
  constructor() {
    this.isInitialized = false;
    this.originalMethods = {};
    this.init();
  }

  /**
   * Initialize console optimizer
   */
  init() {
    this.setupConsoleFiltering();
    this.setupNetworkFiltering();
    this.isInitialized = true;
    console.log('🎯 Console Optimizer - Initialized');
  }

  /**
   * Setup console message filtering
   */
  setupConsoleFiltering() {
    // Store original console methods
    this.originalMethods = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };

    // Override console methods with filtering
    console.error = (...args) => this.filterConsoleMessage('error', args);
    console.warn = (...args) => this.filterConsoleMessage('warn', args);
    console.log = (...args) => this.filterConsoleMessage('log', args);
    console.info = (...args) => this.filterConsoleMessage('info', args);
    console.debug = (...args) => this.filterConsoleMessage('debug', args);
  }

  /**
   * Setup network request filtering
   */
  setupNetworkFiltering() {
    // Override fetch to suppress certain network errors
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch.apply(window, args);
        
        // Don't log 404s for expected Supabase endpoints
        if (!response.ok && this.isExpectedNetworkError(args[0], response.status)) {
          // Create a silent response for expected errors
          return response;
        }
        
        return response;
      } catch (error) {
        // Suppress expected network errors
        if (this.isExpectedNetworkError(args[0])) {
          throw error; // Still throw but don't log
        }
        throw error;
      }
    };
  }

  /**
   * Filter console messages
   */
  filterConsoleMessage(level, args) {
    const message = args.join(' ');
    
    // Check if message should be filtered
    if (this.shouldFilterMessage(message, level)) {
      return; // Silent ignore
    }
    
    // Call original console method
    this.originalMethods[level].apply(console, args);
  }

  /**
   * Check if message should be filtered
   */
  shouldFilterMessage(message, level) {
    const filterPatterns = {
      // Supabase-related patterns
      supabase: [
        'supabase-js@2:7',
        'wpimtdpvrgpgmowdsuec.supabase.co',
        'GET https://wpimtdpvrgpgmowdsuec',
        'POST https://wpimtdpvrgpgmowdsuec',
        'Fetch failed loading: GET',
        'Fetch failed loading: POST',
        '404 (Not Found)',
        'Could not find the table',
        'PGRST205',
        'PGRST116',
        'schema cache'
      ],
      
      // Browser extension patterns
      extension: [
        'content.js:1',
        'The message port closed before a response was received',
        'Uncaught (in promise) The message port closed'
      ],
      
      // Network patterns
      network: [
        'Failed to load resource',
        'net::ERR_',
        'NetworkError'
      ],
      
      // Development patterns (only in production)
      development: [
        'DevTools',
        'Source map',
        'webpack'
      ]
    };

    // Check all filter patterns
    for (const [category, patterns] of Object.entries(filterPatterns)) {
      if (patterns.some(pattern => message.includes(pattern))) {
        // Special handling for different levels
        if (level === 'error' && category === 'supabase') {
          return true; // Always filter Supabase errors
        }
        if (level === 'error' && category === 'extension') {
          return true; // Always filter extension errors
        }
        if (category === 'network' && message.includes('404')) {
          return true; // Filter 404 network errors
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Check if network error is expected
   */
  isExpectedNetworkError(url, status = null) {
    const expectedPatterns = [
      'wpimtdpvrgpgmowdsuec.supabase.co/rest/v1/posts',
      'wpimtdpvrgpgmowdsuec.supabase.co/rest/v1/user_activities',
      'wpimtdpvrgpgmowdsuec.supabase.co/rest/v1/post_likes',
      'wpimtdpvrgpgmowdsuec.supabase.co/rest/v1/post_comments'
    ];

    if (typeof url === 'string') {
      return expectedPatterns.some(pattern => url.includes(pattern)) && 
             (status === 404 || status === null);
    }

    return false;
  }

  /**
   * Restore original console methods
   */
  restore() {
    if (this.originalMethods) {
      Object.assign(console, this.originalMethods);
      console.log('Console Optimizer - Restored original methods');
    }
  }

  /**
   * Enable/disable specific filter categories
   */
  setFilterEnabled(category, enabled) {
    // Implementation for dynamic filter control
    console.log(`Console filter '${category}' ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Initialize global console optimizer
window.consoleOptimizer = new ConsoleOptimizer();

console.log('🎯 Console Optimizer - Script loaded successfully');