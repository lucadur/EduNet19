/**
 * ===================================================================
 * EDUNET19 - EVENT MANAGER
 * Centralized event listener management to prevent memory leaks
 * ===================================================================
 */

'use strict';

/**
 * Event Manager Class
 * Tracks and manages event listeners to prevent memory leaks
 */
class EventManager {
  constructor() {
    this.listeners = new Map();
    this.componentListeners = new Map();
    this.listenerCount = 0;
  }

  /**
   * Add an event listener with tracking
   * @param {Element} element - DOM element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {Object} options - Event options
   * @param {string} componentId - Optional component identifier for grouped cleanup
   * @returns {string} - Listener ID for manual removal
   */
  on(element, event, handler, options = {}, componentId = null) {
    if (!element || !event || !handler) {
      console.warn('EventManager: Invalid parameters for on()');
      return null;
    }

    const listenerId = `listener_${++this.listenerCount}`;
    
    // Store listener info
    const listenerInfo = {
      element,
      event,
      handler,
      options,
      componentId
    };

    this.listeners.set(listenerId, listenerInfo);

    // Track by component if provided
    if (componentId) {
      if (!this.componentListeners.has(componentId)) {
        this.componentListeners.set(componentId, new Set());
      }
      this.componentListeners.get(componentId).add(listenerId);
    }

    // Add the actual listener
    element.addEventListener(event, handler, options);

    return listenerId;
  }

  /**
   * Add event listener that fires only once
   * @param {Element} element - DOM element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {string} componentId - Optional component identifier
   */
  once(element, event, handler, componentId = null) {
    const wrappedHandler = (e) => {
      handler(e);
      this.off(listenerId);
    };
    
    const listenerId = this.on(element, event, wrappedHandler, { once: true }, componentId);
    return listenerId;
  }

  /**
   * Remove a specific event listener
   * @param {string} listenerId - Listener ID returned from on()
   */
  off(listenerId) {
    const listenerInfo = this.listeners.get(listenerId);
    
    if (!listenerInfo) {
      return false;
    }

    const { element, event, handler, options, componentId } = listenerInfo;

    // Remove the actual listener
    try {
      element.removeEventListener(event, handler, options);
    } catch (e) {
      // Element may have been removed from DOM
    }

    // Clean up tracking
    this.listeners.delete(listenerId);

    if (componentId && this.componentListeners.has(componentId)) {
      this.componentListeners.get(componentId).delete(listenerId);
    }

    return true;
  }

  /**
   * Remove all listeners for a specific component
   * @param {string} componentId - Component identifier
   */
  offComponent(componentId) {
    const listenerIds = this.componentListeners.get(componentId);
    
    if (!listenerIds) {
      return 0;
    }

    let removed = 0;
    listenerIds.forEach(listenerId => {
      if (this.off(listenerId)) {
        removed++;
      }
    });

    this.componentListeners.delete(componentId);
    
    return removed;
  }

  /**
   * Remove all listeners for a specific element
   * @param {Element} element - DOM element
   */
  offElement(element) {
    let removed = 0;
    
    this.listeners.forEach((info, listenerId) => {
      if (info.element === element) {
        this.off(listenerId);
        removed++;
      }
    });

    return removed;
  }

  /**
   * Remove all tracked listeners
   */
  offAll() {
    let removed = 0;
    
    this.listeners.forEach((info, listenerId) => {
      this.off(listenerId);
      removed++;
    });

    this.componentListeners.clear();
    
    return removed;
  }

  /**
   * Get count of active listeners
   * @param {string} componentId - Optional component filter
   */
  getListenerCount(componentId = null) {
    if (componentId) {
      return this.componentListeners.get(componentId)?.size || 0;
    }
    return this.listeners.size;
  }

  /**
   * Delegate event handling for dynamic elements
   * @param {Element} parent - Parent element to attach listener
   * @param {string} event - Event type
   * @param {string} selector - CSS selector for target elements
   * @param {Function} handler - Event handler
   * @param {string} componentId - Optional component identifier
   */
  delegate(parent, event, selector, handler, componentId = null) {
    const delegatedHandler = (e) => {
      const target = e.target.closest(selector);
      if (target && parent.contains(target)) {
        handler.call(target, e, target);
      }
    };

    return this.on(parent, event, delegatedHandler, {}, componentId);
  }

  /**
   * Add debounced event listener
   * @param {Element} element - DOM element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {number} delay - Debounce delay in ms
   * @param {string} componentId - Optional component identifier
   */
  debounced(element, event, handler, delay = 300, componentId = null) {
    let timeoutId = null;
    
    const debouncedHandler = (e) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handler(e), delay);
    };

    return this.on(element, event, debouncedHandler, {}, componentId);
  }

  /**
   * Add throttled event listener
   * @param {Element} element - DOM element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {number} limit - Throttle limit in ms
   * @param {string} componentId - Optional component identifier
   */
  throttled(element, event, handler, limit = 100, componentId = null) {
    let lastCall = 0;
    
    const throttledHandler = (e) => {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        handler(e);
      }
    };

    return this.on(element, event, throttledHandler, {}, componentId);
  }
}

// Create singleton instance
window.eventManager = new EventManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.eventManager) {
    const removed = window.eventManager.offAll();
    if (removed > 0) {
      console.log(`🧹 EventManager: Cleaned up ${removed} listeners on unload`);
    }
  }
});

console.log('✅ Event Manager - Loaded');
