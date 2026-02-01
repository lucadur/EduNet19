/**
 * ===================================================================
 * EDUNET19 - NETWORK UTILITIES
 * Retry logic, request optimization, and network helpers
 * ===================================================================
 */

'use strict';

/**
 * Network Utilities Class
 * Provides retry logic, request deduplication, and optimization helpers
 */
class NetworkUtils {
  constructor() {
    this.pendingRequests = new Map();
    this.requestCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds default cache
  }

  /**
   * Execute a function with retry logic
   * @param {Function} fn - Async function to execute
   * @param {Object} options - Retry options
   * @returns {Promise} - Result of the function
   */
  async withRetry(fn, options = {}) {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      retryOn = (error) => true, // Retry on all errors by default
      onRetry = null // Callback on retry
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Check if we should retry this error
        if (attempt === maxRetries || !retryOn(error)) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitter = delay * 0.1 * Math.random();
        const totalDelay = delay + jitter;

        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt + 1, totalDelay, error);
        }

        // Wait before retrying
        await this.sleep(totalDelay);
      }
    }

    throw lastError;
  }

  /**
   * Deduplicate concurrent identical requests
   * @param {string} key - Unique key for the request
   * @param {Function} fn - Async function to execute
   * @returns {Promise} - Result of the function
   */
  async dedupe(key, fn) {
    // If request is already pending, return the same promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request promise
    const promise = fn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Cache request results
   * @param {string} key - Cache key
   * @param {Function} fn - Async function to execute
   * @param {number} ttl - Time to live in ms
   * @returns {Promise} - Cached or fresh result
   */
  async cached(key, fn, ttl = this.cacheTimeout) {
    const cached = this.requestCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    const data = await fn();
    
    this.requestCache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  /**
   * Clear cache entry or all cache
   * @param {string} key - Optional specific key to clear
   */
  clearCache(key = null) {
    if (key) {
      this.requestCache.delete(key);
    } else {
      this.requestCache.clear();
    }
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable (network errors, 5xx, rate limits)
   * @param {Error} error - Error to check
   * @returns {boolean} - Whether to retry
   */
  isRetryableError(error) {
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true;
    }

    // Supabase/HTTP errors
    if (error.status) {
      // Retry on 5xx server errors
      if (error.status >= 500 && error.status < 600) {
        return true;
      }
      // Retry on rate limit (429)
      if (error.status === 429) {
        return true;
      }
      // Retry on timeout (408)
      if (error.status === 408) {
        return true;
      }
    }

    // Supabase specific errors
    if (error.code) {
      const retryableCodes = [
        'PGRST301', // Connection error
        '57P01',    // Admin shutdown
        '57P02',    // Crash shutdown
        '57P03',    // Cannot connect now
        '08000',    // Connection exception
        '08003',    // Connection does not exist
        '08006',    // Connection failure
      ];
      return retryableCodes.includes(error.code);
    }

    return false;
  }

  /**
   * Wrap Supabase query with retry logic
   * @param {Function} queryFn - Function that returns Supabase query promise
   * @param {Object} options - Retry options
   * @returns {Promise} - Query result
   */
  async supabaseWithRetry(queryFn, options = {}) {
    return this.withRetry(queryFn, {
      maxRetries: 2,
      baseDelay: 500,
      retryOn: this.isRetryableError.bind(this),
      ...options
    });
  }
}

// Create singleton instance
window.networkUtils = new NetworkUtils();

console.log('✅ Network Utils - Loaded');
