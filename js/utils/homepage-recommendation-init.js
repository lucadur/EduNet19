/**
 * ===================================================================
 * EDUNET19 - HOMEPAGE RECOMMENDATION INITIALIZATION
 * Initializes recommendation system in homepage
 * ===================================================================
 */

'use strict';

// Wait for homepage to be ready
(function initRecommendationSystem() {
  
  // Check if dependencies are loaded
  if (typeof RecommendationEngine === 'undefined' || 
      typeof RecommendationUI === 'undefined' || 
      typeof DiscoverManager === 'undefined') {
    console.warn('⚠️ Recommendation system dependencies not loaded');
    return;
  }
  
  console.log('🎯 Initializing recommendation system...');
  
  // Wait for homepage to be initialized
  const checkHomepage = setInterval(() => {
    if (window.eduNetHomepage && window.eduNetHomepage.isInitialized) {
      clearInterval(checkHomepage);
      setupRecommendationSystem();
    }
  }, 100);
  
  // Timeout after 10 seconds
  setTimeout(() => {
    clearInterval(checkHomepage);
  }, 10000);
  
  /**
   * Setup recommendation system
   */
  function setupRecommendationSystem() {
    try {
      const homepage = window.eduNetHomepage;
      
      // Initialize recommendation UI
      homepage.recommendationUI = new RecommendationUI(homepage);
      
      // Initialize discover manager
      homepage.discoverManager = new DiscoverManager(homepage);
      homepage.discoverManager.init(homepage.recommendationUI);
      
      // Override switchFeedTab to handle discover
      const originalSwitchFeedTab = homepage.switchFeedTab.bind(homepage);
      homepage.switchFeedTab = function(feedType) {
        console.log('🔄 Switching to feed:', feedType);
        
        if (feedType === 'discover') {
          // Update active tab
          const tabs = document.querySelectorAll('.primary-tab');
          tabs.forEach(tab => {
            const isActive = tab.dataset.feed === feedType;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive);
          });
          
          // Render discover section
          if (this.discoverManager) {
            this.discoverManager.renderDiscoverSection();
          }
          
          // Update current feed type
          this.currentFeedType = feedType;
          
        } else {
          // Hide discover and restore main feed
          if (this.discoverManager) {
            this.discoverManager.hideDiscoverSection();
          }
          
          // Use original function for other tabs
          originalSwitchFeedTab(feedType);
          
          // Assicurati che EduMatch sia visibile dopo il cambio tab
          setTimeout(() => {
            const eduMatchSection = document.getElementById('eduMatchSection');
            if (eduMatchSection) {
              eduMatchSection.style.removeProperty('display');
              console.log('✅ EduMatch ripristinato dopo cambio tab');
            }
          }, 100);
        }
      };
      
      // Assicurati che EduMatch sia visibile all'avvio
      setTimeout(() => {
        const eduMatchSection = document.getElementById('eduMatchSection');
        if (eduMatchSection) {
          eduMatchSection.style.removeProperty('display');
          console.log('✅ EduMatch visibile all\'avvio');
        }
      }, 500);
      
      // Track post views for recommendations
      const originalRenderFeed = homepage.renderFeed.bind(homepage);
      homepage.renderFeed = function() {
        originalRenderFeed();
        
        // Track post views
        if (this.recommendationUI && this.feedData) {
          this.feedData.forEach(post => {
            if (post.id) {
              this.recommendationUI.trackActivity('post_view', post.id, 'post');
            }
          });
        }
      };
      
      // Track post likes
      if (window.eduNetSocial && window.eduNetSocial.toggleLike) {
        const originalToggleLike = window.eduNetSocial.toggleLike.bind(window.eduNetSocial);
        window.eduNetSocial.toggleLike = async function(postId, likeButton) {
          const result = await originalToggleLike(postId, likeButton);
          
          // Track like activity
          if (result && homepage.recommendationUI) {
            homepage.recommendationUI.trackActivity('post_like', postId, 'post');
          }
          
          return result;
        };
      }
      
      // Track post saves
      if (window.savedPostsManager && window.savedPostsManager.toggleSave) {
        const originalToggleSave = window.savedPostsManager.toggleSave.bind(window.savedPostsManager);
        window.savedPostsManager.toggleSave = async function(postId) {
          const result = await originalToggleSave(postId);
          
          // Track save activity
          if (result && homepage.recommendationUI) {
            homepage.recommendationUI.trackActivity('post_save', postId, 'post');
          }
          
          return result;
        };
      }
      
      console.log('✅ Recommendation system initialized successfully');
      
      // Expose for debugging
      window.recommendationUI = homepage.recommendationUI;
      window.discoverManager = homepage.discoverManager;
      
    } catch (error) {
      console.error('❌ Error setting up recommendation system:', error);
    }
  }
  
})();
