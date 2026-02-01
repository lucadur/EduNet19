/**
 * ===================================================================
 * AVATAR LOADER FIX - Caricamento Robusto Avatar
 * ===================================================================
 * Questo modulo migliora il caricamento degli avatar in tutta l'app
 * eliminando i setTimeout e usando un sistema più affidabile
 * ===================================================================
 */

(function() {
  'use strict';

  /**
   * Avatar Loader Enhancement
   * Migliora il sistema di caricamento avatar esistente
   */
  class AvatarLoaderFix {
    constructor() {
      this.avatarCache = new Map();
      this.pendingRequests = new Map();
      this.init();
    }

    async init() {
      console.log('🎨 Avatar Loader Fix - Initializing...');
      
      // Wait for avatar manager to be ready
      await this.waitForAvatarManager();
      
      // Enhance existing avatar manager
      this.enhanceAvatarManager();
      
      // Setup mutation observer to catch dynamically added avatars
      this.setupMutationObserver();
      
      // Load all visible avatars immediately
      this.loadAllVisibleAvatars();
      
      console.log('✅ Avatar Loader Fix - Ready');
    }

    /**
     * Wait for avatar manager to be available
     */
    async waitForAvatarManager() {
      return new Promise((resolve) => {
        const check = () => {
          if (window.avatarManager) {
            resolve();
          } else {
            setTimeout(check, 50);
          }
        };
        check();
      });
    }

    /**
     * Enhance existing avatar manager with better loading
     */
    enhanceAvatarManager() {
      if (!window.avatarManager) return;

      // Store original method
      const originalLoadUserAvatar = window.avatarManager.loadUserAvatar.bind(window.avatarManager);

      // Override with enhanced version
      window.avatarManager.loadUserAvatar = async (userId) => {
        // Check cache first
        if (this.avatarCache.has(userId)) {
          return this.avatarCache.get(userId);
        }

        // Check if request is already pending
        if (this.pendingRequests.has(userId)) {
          return this.pendingRequests.get(userId);
        }

        // Create new request
        const request = originalLoadUserAvatar(userId)
          .then(avatarUrl => {
            this.avatarCache.set(userId, avatarUrl);
            this.pendingRequests.delete(userId);
            return avatarUrl;
          })
          .catch(error => {
            console.warn(`Failed to load avatar for user ${userId}:`, error);
            this.pendingRequests.delete(userId);
            return null;
          });

        this.pendingRequests.set(userId, request);
        return request;
      };

      console.log('✅ Avatar Manager enhanced with caching');
    }

    /**
     * Setup mutation observer to detect new avatars
     */
    setupMutationObserver() {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.loadAvatarsInElement(node);
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      console.log('✅ Mutation observer active for dynamic avatars');
    }

    /**
     * Load all visible avatars immediately
     */
    loadAllVisibleAvatars() {
      this.loadAvatarsInElement(document.body);
    }

    /**
     * Load avatars in a specific element
     */
    loadAvatarsInElement(element) {
      // Find all avatar elements
      const avatarSelectors = [
        '.author-avatar',
        '.comment-avatar',
        '.search-result-avatar',
        '.saved-post-author-avatar',
        '.user-avatar-small',
        '[id^="comment-avatar-"]',
        '[data-user-id]'
      ];

      avatarSelectors.forEach(selector => {
        const avatars = element.querySelectorAll ? element.querySelectorAll(selector) : [];
        avatars.forEach(avatar => this.loadAvatarForElement(avatar));
      });
    }

    /**
     * Load avatar for a specific element
     */
    async loadAvatarForElement(element) {
      // Skip if already loaded
      if (element.dataset.avatarLoaded === 'true') {
        return;
      }

      // Get user ID from various sources
      let userId = element.dataset.userId;
      
      // Try to get from parent post/comment
      if (!userId) {
        const post = element.closest('[data-post-id]');
        if (post) {
          userId = post.dataset.authorId;
        }
      }

      // Try to get from comment
      if (!userId) {
        const comment = element.closest('[data-comment-id]');
        if (comment) {
          userId = comment.dataset.userId;
        }
      }

      // Try to get from ID attribute (e.g., comment-avatar-123)
      if (!userId && element.id) {
        const match = element.id.match(/comment-avatar-(.+)/);
        if (match) {
          // Need to fetch comment data to get user ID
          const commentId = match[1];
          userId = await this.getUserIdFromComment(commentId);
        }
      }

      if (!userId) {
        console.warn('Could not determine user ID for avatar element:', element);
        return;
      }

      // Mark as loading
      element.dataset.avatarLoaded = 'loading';

      try {
        // Load avatar
        const avatarUrl = await window.avatarManager.loadUserAvatar(userId);
        
        if (avatarUrl) {
          // Apply avatar based on element type
          if (element.tagName === 'IMG') {
            element.src = avatarUrl;
            element.alt = 'Avatar';
          } else if (element.classList.contains('author-avatar') || 
                     element.classList.contains('comment-avatar')) {
            element.style.backgroundImage = `url(${avatarUrl})`;
            element.style.backgroundSize = 'cover';
            element.style.backgroundPosition = 'center';
            // Remove placeholder icon
            const icon = element.querySelector('i');
            if (icon) icon.remove();
          } else {
            // Generic fallback
            element.style.backgroundImage = `url(${avatarUrl})`;
          }

          element.dataset.avatarLoaded = 'true';
        } else {
          element.dataset.avatarLoaded = 'failed';
        }
      } catch (error) {
        console.error('Error loading avatar:', error);
        element.dataset.avatarLoaded = 'failed';
      }
    }

    /**
     * Get user ID from comment ID
     */
    async getUserIdFromComment(commentId) {
      try {
        if (!window.supabaseClientManager) return null;
        
        const supabase = await window.supabaseClientManager.getClient();
        const { data, error } = await supabase
          .from('post_comments')
          .select('user_id')
          .eq('id', commentId)
          .single();

        if (error) throw error;
        return data?.user_id;
      } catch (error) {
        console.error('Error fetching user ID from comment:', error);
        return null;
      }
    }

    /**
     * Preload avatars for a list of user IDs
     */
    async preloadAvatars(userIds) {
      const promises = userIds.map(userId => 
        window.avatarManager.loadUserAvatar(userId)
      );
      
      try {
        await Promise.all(promises);
        console.log(`✅ Preloaded ${userIds.length} avatars`);
      } catch (error) {
        console.warn('Some avatars failed to preload:', error);
      }
    }

    /**
     * Clear avatar cache
     */
    clearCache() {
      this.avatarCache.clear();
      this.pendingRequests.clear();
      console.log('🗑️ Avatar cache cleared');
    }

    /**
     * Reload all avatars
     */
    reloadAllAvatars() {
      this.clearCache();
      
      // Reset all loaded flags
      document.querySelectorAll('[data-avatar-loaded]').forEach(el => {
        el.dataset.avatarLoaded = 'false';
      });
      
      // Reload
      this.loadAllVisibleAvatars();
      console.log('🔄 All avatars reloaded');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.avatarLoaderFix = new AvatarLoaderFix();
    });
  } else {
    window.avatarLoaderFix = new AvatarLoaderFix();
  }

})();
