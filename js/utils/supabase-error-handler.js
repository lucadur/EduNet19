/**
 * ===================================================================
 * SUPABASE ERROR HANDLER
 * Centralizzato per gestire tutti gli errori Supabase senza stack trace
 * ===================================================================
 */

'use strict';

/**
 * Supabase Error Handler Class
 * Gestisce tutti gli errori Supabase in modo centralizzato e silenzioso
 */
class SupabaseErrorHandler {
  constructor() {
    this.isInitialized = false;
    this.init();
  }

  /**
   * Initialize error handler
   */
  init() {
    // Override console methods to filter Supabase errors
    this.setupErrorFiltering();
    this.isInitialized = true;
    console.log('🛡️ Supabase Error Handler - Initialized');
  }

  /**
   * Setup error filtering for Supabase
   */
  setupErrorFiltering() {
    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    // Override console.error to filter Supabase stack traces
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Filter out Supabase-related errors that are expected
      if (this.shouldFilterError(message)) {
        return; // Silent ignore
      }
      
      // Call original console.error for other errors
      originalError.apply(console, args);
    };

    // Override console.warn for Supabase warnings
    console.warn = (...args) => {
      const message = args.join(' ');
      
      if (this.shouldFilterWarning(message)) {
        return; // Silent ignore
      }
      
      originalWarn.apply(console, args);
    };
  }

  /**
   * Check if error should be filtered
   */
  shouldFilterError(message) {
    const supabaseErrorPatterns = [
      'supabase-js@2:7',
      'GET https://wpimtdpvrgpgmowdsuec.supabase.co',
      'POST https://wpimtdpvrgpgmowdsuec.supabase.co',
      'Fetch failed loading: GET',
      'Fetch failed loading: POST',
      '404 (Not Found)',
      'Could not find the table',
      'PGRST205',
      'PGRST116',
      'schema cache'
    ];

    return supabaseErrorPatterns.some(pattern => 
      message.includes(pattern)
    );
  }

  /**
   * Check if warning should be filtered
   */
  shouldFilterWarning(message) {
    const supabaseWarningPatterns = [
      'supabase-js@2:7',
      'wpimtdpvrgpgmowdsuec.supabase.co'
    ];

    return supabaseWarningPatterns.some(pattern => 
      message.includes(pattern)
    );
  }

  /**
   * Handle Supabase operation with error suppression
   */
  async handleSupabaseOperation(operation, fallback = null) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      // Check if it's an expected Supabase error
      if (this.isExpectedSupabaseError(error)) {
        console.log(`Database operation failed gracefully: ${error.message}`);
        return fallback;
      }
      
      // Re-throw unexpected errors
      throw error;
    }
  }

  /**
   * Check if error is expected Supabase error
   */
  isExpectedSupabaseError(error) {
    const expectedErrors = [
      'PGRST205',
      'PGRST116',
      'Could not find the table',
      'schema cache',
      '404'
    ];

    return expectedErrors.some(pattern => 
      error.message?.includes(pattern) || 
      error.code?.includes(pattern)
    );
  }

  /**
   * Create safe Supabase query wrapper
   */
  createSafeQuery(supabaseClient) {
    return {
      from: (table) => {
        const query = supabaseClient.from(table);
        
        // Wrap all query methods
        const originalSelect = query.select;
        const originalInsert = query.insert;
        const originalUpdate = query.update;
        const originalDelete = query.delete;

        query.select = (...args) => {
          const selectQuery = originalSelect.apply(query, args);
          return this.wrapQueryExecution(selectQuery);
        };

        query.insert = (...args) => {
          const insertQuery = originalInsert.apply(query, args);
          return this.wrapQueryExecution(insertQuery);
        };

        query.update = (...args) => {
          const updateQuery = originalUpdate.apply(query, args);
          return this.wrapQueryExecution(updateQuery);
        };

        query.delete = (...args) => {
          const deleteQuery = originalDelete.apply(query, args);
          return this.wrapQueryExecution(deleteQuery);
        };

        return query;
      }
    };
  }

  /**
   * Wrap query execution to handle errors silently
   */
  wrapQueryExecution(query) {
    const originalThen = query.then;
    
    query.then = (onResolve, onReject) => {
      return originalThen.call(query, onResolve, (error) => {
        if (this.isExpectedSupabaseError(error)) {
          // Handle expected errors gracefully
          onResolve({ data: null, error: error });
        } else if (onReject) {
          onReject(error);
        }
      });
    };

    return query;
  }
}

// Initialize global error handler
window.supabaseErrorHandler = new SupabaseErrorHandler();

console.log('🛡️ Supabase Error Handler - Script loaded successfully');