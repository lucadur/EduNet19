/**
 * ===================================================================
 * EDUNET19 - RECOMMENDATION ENGINE
 * Simple recommendation engine for suggesting institutes
 * ===================================================================
 */

'use strict';

/**
 * Recommendation Engine
 * Fetches and scores institutes for recommendations
 */
class RecommendationEngine {
  constructor(userId, supabase) {
    this.userId = userId;
    this.supabase = supabase;
    this.cache = null;
    this.cacheExpiry = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get recommended institutes
   */
  async getRecommendations(limit = 5) {
    try {
      // Check cache first
      if (this.cache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
        console.log('📋 Using cached recommendations');
        return this.cache.slice(0, limit);
      }

      console.log('🔄 Fetching fresh recommendations...');

      // Get current user's profile to exclude self
      const { data: userProfile } = await this.supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', this.userId)
        .maybeSingle();

      // Get institutes the user already follows
      const followedIds = await this.getFollowedInstituteIds();
      
      // Add self to exclusion list
      const excludeIds = [...followedIds, this.userId];

      // Fetch all institutes (excluding self and already followed)
      let query = this.supabase
        .from('school_institutes')
        .select(`
          id,
          institute_name,
          institute_type,
          city,
          province,
          region,
          description,
          specializations,
          logo_url
        `)
        .limit(50);

      const { data: institutes, error } = await query;

      if (error) {
        console.error('❌ Error fetching institutes:', error);
        return [];
      }

      if (!institutes || institutes.length === 0) {
        console.log('📋 No institutes found');
        return [];
      }

      // Filter out self and already followed institutes, then score the rest
      const recommendations = institutes
        .filter(inst => !excludeIds.includes(inst.id))
        .map(institute => this.scoreInstitute(institute))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit * 2); // Get more than needed for variety

      // Cache results
      this.cache = recommendations;
      this.cacheExpiry = Date.now() + this.cacheDuration;

      console.log(`✅ Found ${recommendations.length} recommendations`);
      return recommendations.slice(0, limit);

    } catch (error) {
      console.error('❌ Error in getRecommendations:', error);
      return [];
    }
  }

  /**
   * Get IDs of institutes the user follows
   */
  async getFollowedInstituteIds() {
    try {
      // Try user_connections first (main follow system)
      const { data: connections, error: connError } = await this.supabase
        .from('user_connections')
        .select('followed_id')
        .eq('follower_id', this.userId)
        .eq('status', 'accepted');

      if (!connError && connections) {
        return connections.map(c => c.followed_id);
      }

      // Fallback to user_follows if user_connections doesn't exist
      const { data: follows, error: followError } = await this.supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', this.userId);

      if (!followError && follows) {
        return follows.map(f => f.following_id);
      }

      return [];
    } catch (error) {
      console.warn('⚠️ Could not fetch followed institutes:', error.message);
      return [];
    }
  }

  /**
   * Score an institute for recommendation
   */
  scoreInstitute(institute) {
    let score = 50; // Base score
    const breakdown = {};

    // Bonus for having a description
    if (institute.description && institute.description.length > 50) {
      score += 10;
      breakdown.hasDescription = true;
    }

    // Bonus for having specializations
    if (institute.specializations && institute.specializations.length > 0) {
      score += 15;
      breakdown.hasSpecializations = true;
    }

    // Bonus for having location info
    if (institute.city) {
      score += 5;
      breakdown.hasLocation = true;
    }

    // Bonus for having avatar
    if (institute.avatar_url) {
      score += 10;
      breakdown.hasAvatar = true;
    }

    // Add some randomness for variety (±10 points)
    const randomBonus = Math.floor(Math.random() * 21) - 10;
    score += randomBonus;

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    return {
      ...institute,
      score,
      breakdown
    };
  }

  /**
   * Track user activity for future recommendations
   */
  async trackActivity(activityType, targetId = null, targetType = null, data = null) {
    try {
      // Check if user_activities table exists
      const { error } = await this.supabase
        .from('user_activities')
        .insert({
          user_id: this.userId,
          activity_type: activityType,
          target_id: targetId,
          target_type: targetType,
          activity_data: data
        });

      if (error && !error.message.includes('does not exist')) {
        console.warn('⚠️ Could not track activity:', error.message);
      }
    } catch (error) {
      // Silently fail - activity tracking is optional
    }
  }

  /**
   * Get connection counts (following/followers)
   */
  async getConnectionCounts() {
    try {
      // Count following (users this user follows)
      const { count: followingCount, error: followingError } = await this.supabase
        .from('user_connections')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', this.userId)
        .eq('status', 'accepted');

      // Count followers (users following this user)
      const { count: followersCount, error: followersError } = await this.supabase
        .from('user_connections')
        .select('*', { count: 'exact', head: true })
        .eq('followed_id', this.userId)
        .eq('status', 'accepted');

      return {
        following: followingError ? 0 : (followingCount || 0),
        followers: followersError ? 0 : (followersCount || 0)
      };
    } catch (error) {
      console.error('Error getting connection counts:', error);
      return { following: 0, followers: 0 };
    }
  }

  /**
   * Clear recommendation cache
   */
  clearCache() {
    this.cache = null;
    this.cacheExpiry = null;
  }

  /**
   * Follow an institute
   * @param {string} instituteId - ID of the institute to follow
   * @returns {boolean} - Success status
   */
  async followInstitute(instituteId) {
    try {
      // Check if already following
      const { data: existing } = await this.supabase
        .from('user_connections')
        .select('id')
        .eq('follower_id', this.userId)
        .eq('followed_id', instituteId)
        .maybeSingle();

      if (existing) {
        console.log('📋 Already following this institute');
        return true;
      }

      // Create follow connection
      const { error } = await this.supabase
        .from('user_connections')
        .insert({
          follower_id: this.userId,
          followed_id: instituteId,
          status: 'accepted',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error following institute:', error);
        return false;
      }

      // Clear cache to refresh recommendations
      this.clearCache();

      // Track activity
      await this.trackActivity('follow', instituteId, 'institute');

      console.log('✅ Successfully followed institute:', instituteId);
      return true;

    } catch (error) {
      console.error('❌ Error in followInstitute:', error);
      return false;
    }
  }

  /**
   * Unfollow an institute
   * @param {string} instituteId - ID of the institute to unfollow
   * @returns {boolean} - Success status
   */
  async unfollowInstitute(instituteId) {
    try {
      const { error } = await this.supabase
        .from('user_connections')
        .delete()
        .eq('follower_id', this.userId)
        .eq('followed_id', instituteId);

      if (error) {
        console.error('❌ Error unfollowing institute:', error);
        return false;
      }

      // Clear cache to refresh recommendations
      this.clearCache();

      // Track activity
      await this.trackActivity('unfollow', instituteId, 'institute');

      console.log('✅ Successfully unfollowed institute:', instituteId);
      return true;

    } catch (error) {
      console.error('❌ Error in unfollowInstitute:', error);
      return false;
    }
  }
}

/**
 * Discover Manager
 * Handles the "Scopri" tab functionality
 */
class DiscoverManager {
  constructor(homepage) {
    this.homepage = homepage;
    this.recommendationUI = null;
    this.isVisible = false;
  }

  /**
   * Initialize discover manager
   */
  init(recommendationUI) {
    this.recommendationUI = recommendationUI;
    console.log('✅ DiscoverManager initialized');
  }

  /**
   * Render discover section in main feed area
   */
  async renderDiscoverSection() {
    const feedContent = document.getElementById('feed-content');
    if (!feedContent) return;

    this.isVisible = true;

    // Show loading state
    feedContent.innerHTML = `
      <div class="discover-section">
        <div class="discover-loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Caricamento suggerimenti...</p>
        </div>
      </div>
    `;

    try {
      const supabase = window.eduNetAuth?.supabase || await window.supabaseClientManager?.getClient();
      if (!supabase) {
        throw new Error('Supabase not available');
      }

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      // Get list of already followed institutes
      let followedIds = [];
      if (currentUserId) {
        const { data: connections } = await supabase
          .from('user_connections')
          .select('followed_id')
          .eq('follower_id', currentUserId)
          .eq('status', 'accepted');
        
        if (connections) {
          followedIds = connections.map(c => c.followed_id);
        }
      }

      // Get recommendations
      let institutes = [];
      if (this.recommendationUI && this.recommendationUI.engine) {
        institutes = await this.recommendationUI.engine.getRecommendations(10);
      }

      if (institutes.length === 0) {
        // Try to fetch institutes directly
        if (supabase) {
          const { data } = await supabase
            .from('school_institutes')
            .select('id, institute_name, institute_type, city, province, description')
            .limit(15);
          
          if (data) {
            institutes = data.map(inst => ({ ...inst, score: Math.floor(Math.random() * 30) + 70 }));
          }
        }
      }

      // Filter out: 1) current user (no self-follow), 2) already followed institutes
      institutes = institutes.filter(inst => {
        // Exclude self
        if (inst.id === currentUserId) {
          console.log('📋 Excluding self from discover:', inst.institute_name);
          return false;
        }
        // Exclude already followed
        if (followedIds.includes(inst.id)) {
          console.log('📋 Excluding already followed:', inst.institute_name);
          return false;
        }
        return true;
      });

      // Get trending topics
      let trendingTopics = [];
      try {
        const { data: posts } = await supabase
          .from('institute_posts')
          .select('tags')
          .eq('published', true)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(100);

        if (posts && posts.length > 0) {
          const tagCounts = {};
          posts.forEach(post => {
            if (post.tags && Array.isArray(post.tags)) {
              post.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
              });
            }
          });
          trendingTopics = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        }
      } catch (e) {
        console.warn('⚠️ Could not load trending topics:', e);
      }

      // Render unified discover content
      feedContent.innerHTML = `
        <div class="discover-section">
          <div class="discover-header">
            <h2><i class="fas fa-compass"></i> Scopri</h2>
            <p>Trova istituti interessanti e contenuti di tendenza</p>
          </div>
          
          <!-- Istituti Consigliati -->
          <div class="discover-institutes-section">
            <h3><i class="fas fa-school"></i> Istituti Consigliati</h3>
            ${institutes.length > 0 ? `
              <div class="discover-grid">
                ${institutes.map(inst => this.renderInstituteCard(inst, false)).join('')}
              </div>
            ` : `
              <div class="discover-empty-small">
                <i class="fas fa-check-circle"></i>
                <p>Stai già seguendo tutti gli istituti disponibili!</p>
              </div>
            `}
          </div>
          
          <!-- Trending Topics -->
          ${trendingTopics.length > 0 ? `
            <div class="discover-trending-section">
              <h3><i class="fas fa-fire"></i> Argomenti di Tendenza</h3>
              <div class="trending-tags">
                ${trendingTopics.map(([tag, count]) => `
                  <span class="trending-tag" data-tag="${this.escapeHtml(tag)}">
                    #${this.escapeHtml(tag)}
                    <span class="tag-count">${count}</span>
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <!-- Link Rapidi -->
          <div class="discover-links-section">
            <h3><i class="fas fa-link"></i> Link Utili</h3>
            <div class="quick-links-grid">
              <a href="pages/legal/terms-of-service.html" class="quick-link-card">
                <i class="fas fa-file-contract"></i>
                <span>Termini di Servizio</span>
              </a>
              <a href="pages/legal/privacy-policy.html" class="quick-link-card">
                <i class="fas fa-shield-alt"></i>
                <span>Privacy Policy</span>
              </a>
              <a href="pages/legal/cookie-policy.html" class="quick-link-card">
                <i class="fas fa-cookie-bite"></i>
                <span>Cookie Policy</span>
              </a>
            </div>
          </div>
        </div>
      `;

      // Attach event listeners
      this.attachDiscoverListeners();
      
      // Attach trending tag click listeners
      document.querySelectorAll('.trending-tag').forEach(tag => {
        tag.addEventListener('click', () => {
          const tagName = tag.dataset.tag;
          if (this.homepage) {
            // Switch to All tab and search for tag
            this.homepage.switchFeedTab('all');
            const searchInput = document.getElementById('global-search');
            if (searchInput) {
              searchInput.value = `#${tagName}`;
              searchInput.dispatchEvent(new Event('input'));
            }
          }
        });
      });

    } catch (error) {
      console.error('❌ Error rendering discover section:', error);
      feedContent.innerHTML = `
        <div class="discover-section">
          <div class="discover-empty">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Errore di caricamento</h3>
            <p>Non è stato possibile caricare i suggerimenti.</p>
          </div>
        </div>
      `;
    }
  }

  /**
   * Render a single institute card
   * @param {Object} institute - Institute data
   * @param {boolean} isFollowing - Whether user is already following this institute
   */
  renderInstituteCard(institute, isFollowing = false) {
    const initials = this.getInitials(institute.institute_name);
    
    return `
      <div class="discover-card" data-institute-id="${institute.id}">
        <div class="discover-card-header">
          <div class="institute-avatar-large">${initials}</div>
          <div class="institute-info">
            <h3 class="institute-name">${this.escapeHtml(institute.institute_name)}</h3>
            <span class="institute-type">${this.escapeHtml(institute.institute_type || 'Istituto')}</span>
            ${institute.city ? `
              <span class="institute-location">
                <i class="fas fa-map-marker-alt"></i>
                ${this.escapeHtml(institute.city)}${institute.province ? `, ${institute.province}` : ''}
              </span>
            ` : ''}
          </div>
          ${institute.score ? `<span class="match-score">${institute.score}%</span>` : ''}
        </div>
        ${institute.description ? `
          <p class="institute-description">${this.escapeHtml(institute.description.substring(0, 150))}${institute.description.length > 150 ? '...' : ''}</p>
        ` : ''}
        <div class="discover-card-actions">
          <a href="pages/profile/profile.html?id=${institute.id}" class="btn-view-profile">
            <i class="fas fa-user"></i> Vedi Profilo
          </a>
          <button class="btn-follow" data-institute-id="${institute.id}">
            <i class="fas fa-plus"></i> Segui
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners for discover section
   */
  attachDiscoverListeners() {
    document.querySelectorAll('.discover-card .btn-follow').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const instituteId = btn.dataset.instituteId;
        await this.handleFollow(instituteId, btn);
      });
    });
  }

  /**
   * Handle follow action
   */
  async handleFollow(instituteId, button) {
    try {
      const supabase = window.eduNetAuth?.supabase || await window.supabaseClientManager?.getClient();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already following
      const { data: existing } = await supabase
        .from('user_connections')
        .select('id')
        .eq('follower_id', user.id)
        .eq('followed_id', instituteId)
        .maybeSingle();

      if (existing) {
        // Unfollow
        await supabase
          .from('user_connections')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_id', instituteId);

        button.innerHTML = '<i class="fas fa-plus"></i> Segui';
        button.classList.remove('following');
      } else {
        // Follow
        await supabase
          .from('user_connections')
          .insert({
            follower_id: user.id,
            followed_id: instituteId,
            status: 'accepted'
          });

        button.innerHTML = '<i class="fas fa-check"></i> Seguito';
        button.classList.add('following');
        
        // Hide the card after following (since they shouldn't see followed institutes)
        const card = button.closest('.discover-card');
        if (card) {
          card.style.transition = 'opacity 0.3s, transform 0.3s';
          card.style.opacity = '0';
          card.style.transform = 'scale(0.9)';
          setTimeout(() => {
            card.remove();
            // Check if there are no more cards
            const remainingCards = document.querySelectorAll('.discover-card');
            if (remainingCards.length === 0) {
              const grid = document.querySelector('.discover-grid');
              if (grid) {
                grid.innerHTML = `
                  <div class="discover-empty" style="grid-column: 1 / -1;">
                    <i class="fas fa-check-circle"></i>
                    <h3>Ottimo lavoro!</h3>
                    <p>Stai già seguendo tutti gli istituti disponibili.</p>
                  </div>
                `;
              }
            }
          }, 300);
        }
      }

      // Clear recommendation cache
      if (this.recommendationUI && this.recommendationUI.engine) {
        this.recommendationUI.engine.clearCache();
      }

      // Refresh tab counts
      if (this.homepage && this.homepage.loadTabCounts) {
        await this.homepage.loadTabCounts();
      }

    } catch (error) {
      console.error('❌ Error handling follow:', error);
    }
  }

  /**
   * Hide discover section
   */
  hideDiscoverSection() {
    this.isVisible = false;
  }

  /**
   * Get initials from institute name
   */
  getInitials(name) {
    if (!name) return '?';
    return name
      .split(' ')
      .filter(word => word.length > 0)
      .slice(0, 2)
      .map(word => word[0].toUpperCase())
      .join('');
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use
window.RecommendationEngine = RecommendationEngine;
window.DiscoverManager = DiscoverManager;
