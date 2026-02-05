/**
 * ===================================================================
 * EDUNET19 - RECOMMENDATION SYSTEM INTEGRATION
 * Integrates recommendation engine with homepage UI
 * ===================================================================
 */

'use strict';

/**
 * Recommendation UI Manager
 * Handles display and interaction with recommendations
 */
class RecommendationUI {
  constructor(homepage) {
    this.homepage = homepage;
    this.engine = null;
    this.recommendations = [];
    this.isLoading = false;

    this.init();
  }

  /**
   * Initialize recommendation system
   */
  async init() {
    try {
      // Wait for auth and supabase
      if (!window.eduNetAuth || !window.eduNetAuth.supabase) {
        console.warn('Auth system not ready for recommendations');
        return;
      }

      const currentUser = window.eduNetAuth.getCurrentUser();
      if (!currentUser) {
        console.warn('No user logged in for recommendations');
        return;
      }

      // Initialize recommendation engine
      this.engine = new RecommendationEngine(
        currentUser.id,
        window.eduNetAuth.supabase
      );

      console.log('✅ Recommendation system initialized');

      // Load recommendations
      await this.loadRecommendations();

      // Load connection counts
      await this.loadConnectionCounts();

    } catch (error) {
      console.error('Error initializing recommendation system:', error);
    }
  }

  /**
   * Load recommendations from engine
   */
  async loadRecommendations(limit = 5) {
    if (this.isLoading || !this.engine) return;

    this.isLoading = true;
    this.showLoadingState();

    try {
      console.log('📊 Loading recommendations...');

      this.recommendations = await this.engine.getRecommendations(limit);

      // Fallback: if engine returned nothing, try a direct fetch with scoring
      if (this.recommendations.length === 0 && window.eduNetAuth?.supabase) {
        console.log('📊 Engine returned empty, trying direct fallback...');
        try {
          const supabase = window.eduNetAuth.supabase;
          const currentUser = window.eduNetAuth.getCurrentUser();
          const followedIds = await this.engine.getFollowedInstituteIds();
          const excludeIds = [...followedIds, currentUser?.id];

          const { data } = await supabase
            .from('school_institutes')
            .select('id, institute_name, institute_type, city, province, region, description, specializations, logo_url')
            .limit(20);

          if (data && data.length > 0) {
            // Build minimal user context
            let userCtx = { id: currentUser?.id, userType: 'studente', instituteType: null, city: null, province: null, region: null, specializations: [], interests: [] };
            try {
              const { data: prof } = await supabase.from('user_profiles').select('user_type').eq('id', currentUser?.id).maybeSingle();
              if (prof) userCtx.userType = prof.user_type || 'studente';
              const { data: inst } = await supabase.from('school_institutes').select('institute_type, city, province, region, specializations').eq('id', currentUser?.id).maybeSingle();
              if (inst) {
                userCtx.instituteType = inst.institute_type || null;
                userCtx.city = inst.city || null;
                userCtx.province = inst.province || null;
                userCtx.region = inst.region || null;
                userCtx.specializations = inst.specializations || [];
              }
            } catch (_) { /* use defaults */ }

            this.recommendations = data
              .filter(inst => !excludeIds.includes(inst.id))
              .map(inst => this.engine.scoreInstitute(inst, userCtx))
              .sort((a, b) => b.score - a.score)
              .slice(0, limit);
          }
        } catch (fallbackErr) {
          console.warn('⚠️ Sidebar fallback also failed:', fallbackErr);
        }
      }

      console.log(`✅ Loaded ${this.recommendations.length} recommendations`);

      await this.renderRecommendations();

    } catch (error) {
      console.error('Error loading recommendations:', error);
      this.showErrorState();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Render recommendations in sidebar
   */
  async renderRecommendations() {
    const container = document.getElementById('suggested-institutes');
    if (!container) return;

    if (this.recommendations.length === 0) {
      this.showEmptyState();
      return;
    }

    // Check which institutes are already followed
    const followedIds = await this.getFollowedInstitutes();

    container.innerHTML = this.recommendations.map(institute => {
      const isFollowing = followedIds.includes(institute.id);
      return `
        <div class="institute-suggestion premium-card" data-institute-id="${institute.id}">
          <div class="suggestion-header">
            <div class="institute-avatar">
              ${this.getInstituteInitials(institute.institute_name)}
            </div>
            <div class="institute-title-group">
              <div class="institute-name">${this.escapeHtml(institute.institute_name)}</div>
              <div class="institute-meta">
                <span class="institute-type">${this.escapeHtml(institute.institute_type || 'Istituto')}</span>
                ${institute.city ? `
                  <span class="institute-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${this.escapeHtml(institute.city)}${institute.province ? `, ${this.escapeHtml(institute.province)}` : ''}
                  </span>
                ` : ''}
              </div>
            </div>
          </div>
          
          <div class="suggestion-body">
            <div class="recommendation-reason">
                <i class="fas fa-magic"></i> ${this.getMatchReason(institute.breakdown)}
            </div>
          </div>

          <div class="suggestion-footer">
            <div class="recommendation-score">
              <span class="score-badge">${institute.score}%</span>
              <span class="score-label">Affinità</span>
            </div>
            <button class="follow-btn ${isFollowing ? 'following' : ''}" 
                    data-action="${isFollowing ? 'unfollow' : 'follow'}" 
                    data-institute-id="${institute.id}">
              <i class="fas fa-${isFollowing ? 'check' : 'plus'}"></i> 
              ${isFollowing ? 'Segui' : 'Segui'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach event listeners
    this.attachFollowListeners();
  }

  /**
   * Get main reason for match based on the highest-scoring dimension.
   * Breakdown keys: type, geographic, completeness, interests, engagement
   */
  getMatchReason(breakdown) {
    if (!breakdown) return 'Consigliato per te';

    // Build candidates: [score, threshold, label]
    const candidates = [
      { score: breakdown.type || 0,         threshold: 60, label: 'Affinità Didattica' },
      { score: breakdown.geographic || 0,   threshold: 60, label: 'Vicino a te' },
      { score: breakdown.interests || 0,    threshold: 40, label: 'Interessi Comuni' },
      { score: breakdown.engagement || 0,   threshold: 50, label: 'Molto Attivo' },
      { score: breakdown.completeness || 0, threshold: 70, label: 'Profilo Completo' }
    ];

    // Pick the candidate with the highest score that exceeds its threshold
    let best = null;
    for (const c of candidates) {
      if (c.score >= c.threshold && (!best || c.score > best.score)) {
        best = c;
      }
    }

    // Composite reasons for very high combined scores
    if (best) {
      if (best.label === 'Affinità Didattica' && (breakdown.geographic || 0) >= 60) {
        return 'Stesso ambito e vicino a te';
      }
      if (best.label === 'Vicino a te' && (breakdown.type || 0) >= 60) {
        return 'Stesso ambito e vicino a te';
      }
      if (best.label === 'Interessi Comuni' && (breakdown.type || 0) >= 60) {
        return 'Affinità Didattica';
      }
      return best.label;
    }

    return 'Consigliato per te';
  }

  /**
   * Get list of followed institutes
   */
  async getFollowedInstitutes() {
    if (!this.engine) return [];

    try {
      const { data, error } = await window.eduNetAuth.supabase
        .from('user_connections')
        .select('followed_id')
        .eq('follower_id', this.engine.userId)
        .eq('status', 'accepted');

      if (error) throw error;
      return data ? data.map(f => f.followed_id) : [];
    } catch (error) {
      console.error('Error fetching followed institutes:', error);
      return [];
    }
  }

  /**
   * Get institute initials for avatar
   */
  getInstituteInitials(name) {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Attach follow button listeners
   */
  attachFollowListeners() {
    const followBtns = document.querySelectorAll('.follow-btn');

    followBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const instituteId = btn.dataset.instituteId;
        const action = btn.dataset.action;

        if (action === 'follow') {
          await this.handleFollow(instituteId, btn);
        } else if (action === 'unfollow') {
          await this.handleUnfollow(instituteId, btn);
        }
      });
    });

    // Click on institute card to view profile
    const cards = document.querySelectorAll('.institute-suggestion');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.follow-btn')) return;
        const instituteId = card.dataset.instituteId;
        this.viewInstituteProfile(instituteId);
      });
    });
  }

  /**
   * Handle follow action
   */
  async handleFollow(instituteId, button) {
    if (!this.engine) return;

    try {
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

      const success = await this.engine.followInstitute(instituteId);

      if (success) {
        button.innerHTML = '<i class="fas fa-check"></i> Seguito';
        button.classList.add('following');
        button.dataset.action = 'unfollow';

        // Show success notification
        if (this.homepage && this.homepage.showNotification) {
          this.homepage.showNotification('Istituto seguito con successo!', 'success');
        }

        // Update connection counts
        await this.loadConnectionCounts();

        // Add to recent activity in sidebar
        await this.addToRecentActivity('follow', instituteId);

      } else {
        throw new Error('Follow failed');
      }

    } catch (error) {
      console.error('Error following institute:', error);
      button.innerHTML = '<i class="fas fa-plus"></i> Segui';

      if (this.homepage && this.homepage.showNotification) {
        this.homepage.showNotification('Errore nel seguire l\'istituto', 'error');
      }
    } finally {
      button.disabled = false;
    }
  }

  /**
   * Handle unfollow action
   */
  async handleUnfollow(instituteId, button) {
    if (!this.engine) return;

    try {
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

      const success = await this.engine.unfollowInstitute(instituteId);

      if (success) {
        button.innerHTML = '<i class="fas fa-plus"></i> Segui';
        button.classList.remove('following');
        button.dataset.action = 'follow';

        // Show success notification
        if (this.homepage && this.homepage.showNotification) {
          this.homepage.showNotification('Non segui più questo istituto', 'info');
        }

        // Update connection counts
        await this.loadConnectionCounts();

        // Add to recent activity in sidebar
        await this.addToRecentActivity('unfollow', instituteId);

      } else {
        throw new Error('Unfollow failed');
      }

    } catch (error) {
      console.error('Error unfollowing institute:', error);
      button.innerHTML = '<i class="fas fa-check"></i> Seguito';

      if (this.homepage && this.homepage.showNotification) {
        this.homepage.showNotification('Errore nell\'annullare il follow', 'error');
      }
    } finally {
      button.disabled = false;
    }
  }

  /**
   * Add activity to sidebar recent activity
   */
  async addToRecentActivity(activityType, instituteId) {
    try {
      // Get institute info
      const { data: institute } = await window.eduNetAuth.supabase
        .from('school_institutes')
        .select('institute_name')
        .eq('id', instituteId)
        .single();

      if (!institute) return;

      const activityContainer = document.getElementById('recent-activity');
      if (!activityContainer) return;

      // Remove "no activity" message if present
      const noActivity = activityContainer.querySelector('.no-activity');
      if (noActivity) {
        noActivity.remove();
      }

      // Create activity item
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      activityItem.innerHTML = `
        <div class="activity-icon ${activityType === 'follow' ? 'success' : 'info'}">
          <i class="fas fa-${activityType === 'follow' ? 'user-plus' : 'user-minus'}"></i>
        </div>
        <div class="activity-content">
          <p class="activity-text">
            ${activityType === 'follow' ? 'Hai iniziato a seguire' : 'Non segui più'} 
            <strong>${this.escapeHtml(institute.institute_name)}</strong>
          </p>
          <span class="activity-time">Adesso</span>
        </div>
      `;

      // Add to top of activity list
      activityContainer.insertBefore(activityItem, activityContainer.firstChild);

      // Keep only last 5 activities
      const activities = activityContainer.querySelectorAll('.activity-item');
      if (activities.length > 5) {
        activities[activities.length - 1].remove();
      }

    } catch (error) {
      console.error('Error adding to recent activity:', error);
    }
  }

  /**
   * View institute profile
   */
  viewInstituteProfile(instituteId) {
    // Navigate to institute profile page
    window.location.href = window.AppConfig.getPageUrl(`pages/profile/profile.html?id=${instituteId}`);
  }

  /**
   * Load and display connection counts
   */
  async loadConnectionCounts() {
    if (!this.engine) return;

    try {
      const counts = await this.engine.getConnectionCounts();

      const followingEl = document.getElementById('following-count');
      const followersEl = document.getElementById('followers-count');

      if (followingEl) {
        const countEl = followingEl.querySelector('.count');
        if (countEl) {
          countEl.textContent = counts.following;
        }
      }

      if (followersEl) {
        const countEl = followersEl.querySelector('.count');
        if (countEl) {
          countEl.textContent = counts.followers;
        }
      }

    } catch (error) {
      console.error('Error loading connection counts:', error);
    }
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    const container = document.getElementById('suggested-institutes');
    if (!container) return;

    container.innerHTML = `
      <div class="suggestions-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Caricamento suggerimenti...</p>
      </div>
    `;
  }

  /**
   * Show empty state
   */
  showEmptyState() {
    const container = document.getElementById('suggested-institutes');
    if (!container) return;

    container.innerHTML = `
      <div class="suggestions-empty">
        <i class="fas fa-search"></i>
        <p>Nessun suggerimento disponibile al momento</p>
      </div>
    `;
  }

  /**
   * Show error state
   */
  showErrorState() {
    const container = document.getElementById('suggested-institutes');
    if (!container) return;

    container.innerHTML = `
      <div class="suggestions-empty">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Errore nel caricamento dei suggerimenti</p>
      </div>
    `;
  }

  /**
   * Track activity (wrapper for engine method)
   */
  async trackActivity(activityType, targetId = null, targetType = null, data = null) {
    if (!this.engine) return;

    try {
      await this.engine.trackActivity(activityType, targetId, targetType, data);
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }

  /**
   * Refresh recommendations (force reload)
   */
  async refreshRecommendations() {
    // Clear cache first
    if (this.engine) {
      try {
        await window.eduNetAuth.supabase
          .from('recommendation_cache')
          .delete()
          .eq('user_id', this.engine.userId);
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
    }

    // Reload
    await this.loadRecommendations();
  }
}

/**
 * Discover Tab Manager
 * Handles the discover section with trending topics and suggestions
 * NOTE: Renamed to DiscoverTabManager to avoid conflict with DiscoverManager in recommendation-engine.js
 */
class DiscoverTabManager {
  constructor(homepage) {
    this.homepage = homepage;
    this.recommendationUI = null;
  }

  /**
   * Initialize discover section
   */
  init(recommendationUI) {
    this.recommendationUI = recommendationUI;
  }

  /**
   * Render discover section
   */
  async renderDiscoverSection() {
    const feedContent = document.getElementById('feed-content');
    if (!feedContent) return;

    // Nascondi elementi esistenti (feed principale, EduMatch, ecc.)
    const existingElements = feedContent.children;
    for (let el of existingElements) {
      if (!el.classList.contains('discover-section')) {
        el.style.display = 'none';
      }
    }

    // Mostra o crea sezione discover
    let discoverSection = feedContent.querySelector('.discover-section');
    if (!discoverSection) {
      discoverSection = document.createElement('div');
      discoverSection.className = 'discover-section';
      discoverSection.innerHTML = `
        <div class="discover-header">
          <h2>Scopri</h2>
          <p>Trova nuovi istituti e contenuti interessanti</p>
        </div>
        
        <!-- Trending Topics -->
        <div class="trending-topics">
          <h3><i class="fas fa-fire"></i> Argomenti di Tendenza</h3>
          <div id="trending-topics-list">
            <div class="suggestions-loading">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
          </div>
        </div>
        
        <!-- Suggested Institutes (Expanded) -->
        <div class="suggested-institutes">
          <div class="section-header">
            <h3><i class="fas fa-school"></i> Istituti Consigliati</h3>
          </div>
          <div id="discover-institutes-list">
            <div class="suggestions-loading">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
          </div>
        </div>
      `;
      feedContent.appendChild(discoverSection);
    }
    discoverSection.style.display = 'block';

    // Load content
    await this.loadTrendingTopics();
    await this.loadDiscoverInstitutes();
  }

  /**
   * Hide discover section and restore main feed
   */
  hideDiscoverSection() {
    const feedContent = document.getElementById('feed-content');
    if (!feedContent) return;

    // Nascondi discover
    const discoverSection = feedContent.querySelector('.discover-section');
    if (discoverSection) {
      discoverSection.style.display = 'none';
    }

    // Mostra elementi originali rimuovendo lo style inline
    const existingElements = feedContent.children;
    for (let el of existingElements) {
      if (!el.classList.contains('discover-section')) {
        el.style.removeProperty('display');  // Ripristina CSS originale
      }
    }

    // Assicurati che EduMatch sia visibile (con priorità)
    setTimeout(() => {
      const eduMatch = document.querySelector('.edumatch-section');
      const eduMatchById = document.getElementById('eduMatchSection');

      if (eduMatch) {
        eduMatch.style.removeProperty('display');
        console.log('✅ EduMatch ripristinato (class selector)');
      }
      if (eduMatchById) {
        eduMatchById.style.removeProperty('display');
        console.log('✅ EduMatch ripristinato (id selector)');
      }
    }, 50);
  }

  /**
   * Load trending topics
   */
  async loadTrendingTopics() {
    const container = document.getElementById('trending-topics-list');
    if (!container) return;

    try {
      // Get trending tags from recent posts
      const { data: posts } = await window.eduNetAuth.supabase
        .from('institute_posts')
        .select('tags')
        .eq('published', true)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      if (!posts || posts.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center;">Nessun argomento di tendenza</p>';
        return;
      }

      // Count tag occurrences
      const tagCounts = {};
      posts.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      // Sort by count and take top 10
      const trending = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      if (trending.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center;">Nessun argomento di tendenza</p>';
        return;
      }

      container.innerHTML = trending.map(([tag, count]) => `
        <span class="topic-tag" data-tag="${tag}">
          #${tag}
          <span class="topic-count">${count}</span>
        </span>
      `).join('');

      // Add click listeners
      container.querySelectorAll('.topic-tag').forEach(tagEl => {
        tagEl.addEventListener('click', () => {
          const tag = tagEl.dataset.tag;
          this.searchByTag(tag);
        });
      });

    } catch (error) {
      console.error('Error loading trending topics:', error);
      container.innerHTML = '<p style="color: #999; text-align: center;">Errore nel caricamento</p>';
    }
  }

  /**
   * Load institutes for discover section
   */
  async loadDiscoverInstitutes() {
    const container = document.getElementById('discover-institutes-list');
    if (!container || !this.recommendationUI || !this.recommendationUI.engine) return;

    try {
      const recommendations = await this.recommendationUI.engine.getRecommendations(10);

      if (recommendations.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center;">Nessun istituto da suggerire</p>';
        return;
      }

      // Check which institutes are already followed
      const followedIds = await this.recommendationUI.getFollowedInstitutes();

      // Use same rendering as sidebar but with more details
      container.innerHTML = recommendations.map(institute => {
        const isFollowing = followedIds.includes(institute.id);
        return `
          <div class="institute-suggestion" data-institute-id="${institute.id}">
            <div class="institute-avatar">
              ${this.recommendationUI.getInstituteInitials(institute.institute_name)}
            </div>
            <div class="institute-info">
              <div class="institute-name">${this.recommendationUI.escapeHtml(institute.institute_name)}</div>
              <div class="institute-type">${this.recommendationUI.escapeHtml(institute.institute_type || 'Istituto')}</div>
              ${institute.city ? `
                <div class="institute-location">
                  <i class="fas fa-map-marker-alt"></i>
                  ${this.recommendationUI.escapeHtml(institute.city)}
                </div>
              ` : ''}
              <div class="recommendation-score">
                <span class="score-badge">${institute.score}%</span>
                <span>Match</span>
              </div>
            </div>
            <button class="follow-btn ${isFollowing ? 'following' : ''}" 
                    data-action="${isFollowing ? 'unfollow' : 'follow'}" 
                    data-institute-id="${institute.id}">
              <i class="fas fa-${isFollowing ? 'check' : 'plus'}"></i> 
              ${isFollowing ? 'Seguito' : 'Segui'}
            </button>
          </div>
        `;
      }).join('');

      // Attach listeners
      this.recommendationUI.attachFollowListeners();

    } catch (error) {
      console.error('Error loading discover institutes:', error);
      container.innerHTML = '<p style="color: #999; text-align: center;">Errore nel caricamento</p>';
    }
  }

  /**
   * Search by tag
   */
  searchByTag(tag) {
    // Switch to All tab and apply tag filter
    if (this.homepage) {
      this.homepage.switchFeedTab('all');

      // Trigger search with tag
      const searchInput = document.getElementById('global-search');
      if (searchInput) {
        searchInput.value = `#${tag}`;
        searchInput.dispatchEvent(new Event('input'));
      }
    }
  }
}

// Export for use in homepage
if (typeof window !== 'undefined') {
  window.RecommendationUI = RecommendationUI;
  window.DiscoverTabManager = DiscoverTabManager;
  // Alias for backward compatibility
  window.DiscoverManagerIntegration = DiscoverTabManager;
}
