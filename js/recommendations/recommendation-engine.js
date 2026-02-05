/**
 * ===================================================================
 * EDUNET19 - RECOMMENDATION ENGINE
 * Multi-dimensional recommendation engine for suggesting institutes
 * Scores on: type affinity, geographic proximity, profile quality,
 *            specialization overlap, and engagement signals.
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

    // === SCORING WEIGHTS (total = 100) ===
    this.weights = {
      type: 30,           // Institute type affinity
      geographic: 25,     // Geographic proximity
      completeness: 15,   // Profile completeness
      interests: 20,      // Specialization / interest overlap
      engagement: 10      // Content activity & popularity
    };

    // === INSTITUTE TYPE AFFINITY MAP ===
    // Groups of institute types that are educationally related.
    // same_exact = 1.0, same_category = 0.8, educational_chain = 0.6,
    // related_area = 0.4, different = 0.15
    this.typeCategories = {
      'liceo': ['Liceo Classico', 'Liceo Scientifico', 'Liceo Linguistico',
                'Liceo Artistico', 'Liceo delle Scienze Umane',
                'Liceo Musicale e Coreutico', 'Liceo Scientifico - Scienze Applicate',
                'Liceo Europeo', 'Liceo Internazionale', 'Liceo'],
      'tecnico': ['Istituto Tecnico', 'Istituto Tecnico Industriale',
                  'Istituto Tecnico Commerciale', 'Istituto Tecnico Agrario',
                  'Istituto Tecnico Nautico', 'Istituto Tecnico per il Turismo',
                  'Istituto Tecnico Tecnologico', 'Istituto Tecnico Economico'],
      'professionale': ['Istituto Professionale', 'Istituto Professionale Alberghiero',
                        'Istituto Professionale Industria e Artigianato',
                        'Istituto Professionale per i Servizi Sociali'],
      'primo_ciclo': ['Scuola Primaria', 'Scuola Secondaria di I Grado',
                      'Scuola dell\'Infanzia', 'Istituto Comprensivo'],
      'universita': ['Università', 'Politecnico', 'Accademia', 'Conservatorio'],
      'formazione': ['Centro di Formazione Professionale', 'ITS',
                     'Istituto Tecnico Superiore', 'AFAM']
    };

    // Educational chain: natural progression paths
    this.educationalChains = [
      ['primo_ciclo', 'liceo'],
      ['primo_ciclo', 'tecnico'],
      ['primo_ciclo', 'professionale'],
      ['liceo', 'universita'],
      ['tecnico', 'universita'],
      ['tecnico', 'formazione'],
      ['professionale', 'formazione']
    ];

    // Related areas (STEM, humanities, arts, etc.)
    this.relatedTypes = {
      'liceo': ['tecnico', 'universita'],
      'tecnico': ['liceo', 'professionale', 'formazione'],
      'professionale': ['tecnico', 'formazione'],
      'universita': ['liceo', 'tecnico', 'formazione'],
      'formazione': ['tecnico', 'professionale', 'universita']
    };

    // Italian geographic macro-areas
    this.macroAreas = {
      nord: ['Lombardia', 'Piemonte', 'Veneto', 'Liguria', 'Emilia-Romagna',
             'Trentino-Alto Adige', 'Friuli-Venezia Giulia', 'Valle d\'Aosta'],
      centro: ['Toscana', 'Lazio', 'Umbria', 'Marche', 'Abruzzo'],
      sud: ['Campania', 'Puglia', 'Basilicata', 'Calabria', 'Molise'],
      isole: ['Sicilia', 'Sardegna']
    };
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

      // Get current user's type from user_profiles (only columns that exist)
      let userProfile = null;
      const { data: profileData } = await this.supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', this.userId)
        .maybeSingle();
      userProfile = profileData;

      // Always try school_institutes for geographic/type context
      // (works for institute accounts; returns null for private users)
      let userInstituteData = null;
      const { data: instData } = await this.supabase
        .from('school_institutes')
        .select('institute_type, city, province, region, specializations')
        .eq('id', this.userId)
        .maybeSingle();
      if (instData) userInstituteData = instData;

      // Build unified user context for scoring
      const userContext = {
        id: this.userId,
        userType: userProfile?.user_type || 'studente',
        instituteType: userInstituteData?.institute_type || null,
        city: userInstituteData?.city || null,
        province: userInstituteData?.province || null,
        region: userInstituteData?.region || null,
        specializations: userInstituteData?.specializations || [],
        interests: []
      };

      // Get institutes the user already follows
      const followedIds = await this.getFollowedInstituteIds();

      // Add self to exclusion list
      const excludeIds = [...followedIds, this.userId];

      // Fetch candidate institutes (only columns that exist in the table)
      const { data: institutes, error: fetchError } = await this.supabase
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
        .limit(80);

      if (fetchError) {
        console.error('❌ Error fetching institutes:', fetchError);
      }

      if (fetchError || !institutes || institutes.length === 0) {
        console.log('📋 No institutes found');
        return [];
      }

      // Filter out self and already followed, then score with full context
      const recommendations = institutes
        .filter(inst => !excludeIds.includes(inst.id))
        .map(institute => this.scoreInstitute(institute, userContext))
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

  // =====================================================================
  //  SCORING ENGINE — Multi-dimensional institute scoring
  // =====================================================================

  /**
   * Score an institute for recommendation against the current user context.
   * Returns the institute object enriched with score + breakdown.
   */
  scoreInstitute(institute, userContext) {
    const breakdown = {
      type: 0,
      geographic: 0,
      completeness: 0,
      interests: 0,
      engagement: 0
    };

    // --- 1. TYPE AFFINITY (0–100) ---
    breakdown.type = this.calcTypeAffinity(userContext, institute);

    // --- 2. GEOGRAPHIC PROXIMITY (0–100) ---
    breakdown.geographic = this.calcGeographicScore(userContext, institute);

    // --- 3. PROFILE COMPLETENESS (0–100) ---
    breakdown.completeness = this.calcCompletenessScore(institute);

    // --- 4. SPECIALIZATION / INTEREST OVERLAP (0–100) ---
    breakdown.interests = this.calcInterestOverlap(userContext, institute);

    // --- 5. ENGAGEMENT / POPULARITY (0–100) ---
    breakdown.engagement = this.calcEngagementScore(institute);

    // --- WEIGHTED TOTAL ---
    const weightedScore =
      (breakdown.type        * this.weights.type +
       breakdown.geographic   * this.weights.geographic +
       breakdown.completeness * this.weights.completeness +
       breakdown.interests    * this.weights.interests +
       breakdown.engagement   * this.weights.engagement) / 100;

    // Deterministic tiebreaker (±3) — same user+institute pair always gets the same value
    const tiebreaker = this.deterministicTiebreaker(userContext.id, institute.id);
    const finalScore = Math.max(5, Math.min(99, Math.round(weightedScore + tiebreaker)));

    return {
      ...institute,
      score: finalScore,
      breakdown
    };
  }

  // --- Dimension 1: Type Affinity ---
  calcTypeAffinity(userCtx, institute) {
    const userType = (userCtx.instituteType || '').trim();
    const instType = (institute.institute_type || '').trim();

    // If we don't know user's type, give a neutral mid-score
    if (!userType || !instType) return 40;

    // Exact same type
    if (userType.toLowerCase() === instType.toLowerCase()) return 100;

    // Determine categories
    const userCat = this.getCategoryForType(userType);
    const instCat = this.getCategoryForType(instType);

    if (!userCat || !instCat) {
      // Unknown type — fuzzy string match as last resort
      return this.fuzzyTypeMatch(userType, instType);
    }

    // Same category (e.g. both Licei)
    if (userCat === instCat) return 85;

    // Educational chain (e.g. primo_ciclo → liceo)
    const isChain = this.educationalChains.some(
      ([a, b]) => (userCat === a && instCat === b) || (userCat === b && instCat === a)
    );
    if (isChain) return 65;

    // Related area
    if (this.relatedTypes[userCat]?.includes(instCat)) return 45;

    // Unrelated
    return 15;
  }

  getCategoryForType(typeName) {
    const lower = typeName.toLowerCase();
    for (const [category, types] of Object.entries(this.typeCategories)) {
      if (types.some(t => lower.includes(t.toLowerCase()) || t.toLowerCase().includes(lower))) {
        return category;
      }
    }
    return null;
  }

  fuzzyTypeMatch(typeA, typeB) {
    const wordsA = typeA.toLowerCase().split(/\s+/);
    const wordsB = typeB.toLowerCase().split(/\s+/);
    const common = wordsA.filter(w => w.length > 3 && wordsB.includes(w));
    if (common.length >= 2) return 70;
    if (common.length === 1) return 45;
    return 20;
  }

  // --- Dimension 2: Geographic Proximity ---
  calcGeographicScore(userCtx, institute) {
    // If user has no location, give neutral score
    if (!userCtx.city && !userCtx.province && !userCtx.region) return 35;

    const uCity = (userCtx.city || '').toLowerCase().trim();
    const uProv = (userCtx.province || '').toLowerCase().trim();
    const uReg  = (userCtx.region || '').toLowerCase().trim();
    const iCity = (institute.city || '').toLowerCase().trim();
    const iProv = (institute.province || '').toLowerCase().trim();
    const iReg  = (institute.region || '').toLowerCase().trim();

    // Same city
    if (uCity && iCity && uCity === iCity) return 100;

    // Same province
    if (uProv && iProv && uProv === iProv) return 80;

    // Same region
    if (uReg && iReg && uReg === iReg) return 60;

    // Same macro-area (Nord / Centro / Sud / Isole)
    if (uReg && iReg && this.sameMacroArea(uReg, iReg)) return 35;

    // Italy but distant
    if (iCity || iProv || iReg) return 15;

    // No location data for institute
    return 10;
  }

  sameMacroArea(regionA, regionB) {
    const a = regionA.toLowerCase();
    const b = regionB.toLowerCase();
    for (const regions of Object.values(this.macroAreas)) {
      const lower = regions.map(r => r.toLowerCase());
      if (lower.includes(a) && lower.includes(b)) return true;
    }
    return false;
  }

  // --- Dimension 3: Profile Completeness ---
  calcCompletenessScore(institute) {
    let score = 0;
    const checks = [
      [!!institute.description && institute.description.length > 30, 25],
      [!!institute.description && institute.description.length > 150, 10],
      [!!institute.specializations && institute.specializations.length > 0, 20],
      [!!institute.city, 15],
      [!!institute.province, 5],
      [!!institute.region, 5],
      [!!institute.logo_url, 10],
      [!!institute.institute_type, 10]
    ];
    for (const [condition, points] of checks) {
      if (condition) score += points;
    }
    return Math.min(100, score);
  }

  // --- Dimension 4: Specialization / Interest Overlap ---
  calcInterestOverlap(userCtx, institute) {
    const userSpecs = this.normalizeArray(userCtx.specializations);
    const userInterests = this.normalizeArray(userCtx.interests);
    const instSpecs = this.normalizeArray(institute.specializations);

    // Combine user signals
    const userSignals = new Set([...userSpecs, ...userInterests]);
    const instSignals = new Set(instSpecs);

    if (userSignals.size === 0 || instSignals.size === 0) return 30; // Neutral when no data

    // Jaccard similarity
    const intersection = [...userSignals].filter(s => instSignals.has(s));
    const union = new Set([...userSignals, ...instSignals]);
    const jaccard = intersection.length / union.size;

    // Also check partial / fuzzy matches
    let fuzzyMatches = 0;
    for (const us of userSignals) {
      for (const is of instSignals) {
        if (us !== is && (us.includes(is) || is.includes(us))) {
          fuzzyMatches++;
        }
      }
    }
    const fuzzyBonus = Math.min(20, fuzzyMatches * 5);

    return Math.min(100, Math.round(jaccard * 80 + fuzzyBonus));
  }

  normalizeArray(arr) {
    if (!arr || !Array.isArray(arr)) return [];
    return arr.map(s => String(s).toLowerCase().trim()).filter(s => s.length > 0);
  }

  // --- Deterministic tiebreaker: same inputs → same output ---
  deterministicTiebreaker(userId, instituteId) {
    // Simple string hash of the concatenated IDs → stable ±3 value
    const str = (userId || '') + ':' + (instituteId || '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    // Map to range -3 to +3
    return (Math.abs(hash) % 7) - 3;
  }

  // --- Dimension 5: Engagement / Popularity ---
  calcEngagementScore(institute) {
    let score = 20; // Base — even quiet institutes get some score

    // Followers signal (logarithmic scale to avoid huge institutes dominating)
    const followers = institute.followers_count || 0;
    if (followers > 0) {
      score += Math.min(40, Math.round(Math.log2(followers + 1) * 8));
    }

    // Posts signal (has the institute published content?)
    const posts = institute.posts_count || 0;
    if (posts > 0) {
      score += Math.min(40, Math.round(Math.log2(posts + 1) * 7));
    }

    return Math.min(100, score);
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
        // Fallback: fetch institutes directly and score them with the engine
        if (supabase) {
          const { data } = await supabase
            .from('school_institutes')
            .select('id, institute_name, institute_type, city, province, region, description, specializations, logo_url')
            .limit(15);
          
          if (data && data.length > 0) {
            // Use engine scoring if available, otherwise neutral scores
            if (this.recommendationUI && this.recommendationUI.engine) {
              const engine = this.recommendationUI.engine;
              // Build a minimal user context
              let userCtx = { id: currentUserId, userType: 'studente', instituteType: null, city: null, province: null, region: null, specializations: [], interests: [] };
              try {
                const { data: prof } = await supabase.from('user_profiles').select('user_type').eq('id', currentUserId).maybeSingle();
                if (prof) userCtx.userType = prof.user_type || 'studente';
                const { data: inst } = await supabase.from('school_institutes').select('institute_type, city, province, region, specializations').eq('id', currentUserId).maybeSingle();
                if (inst) {
                  userCtx.instituteType = inst.institute_type || null;
                  userCtx.city = inst.city || null;
                  userCtx.province = inst.province || null;
                  userCtx.region = inst.region || null;
                  userCtx.specializations = inst.specializations || [];
                }
              } catch (_) { /* use defaults */ }
              institutes = data.map(inst => engine.scoreInstitute(inst, userCtx));
              institutes.sort((a, b) => b.score - a.score);
            } else {
              institutes = data.map(inst => ({ ...inst, score: Math.floor(Math.random() * 20) + 40, breakdown: {} }));
            }
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
