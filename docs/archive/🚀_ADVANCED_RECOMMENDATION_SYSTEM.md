# 🚀 Sistema di Raccomandazione Avanzato - EduNet19

## 🎯 Obiettivo
Creare un algoritmo di raccomandazione intelligente degno di Instagram/Facebook che suggerisca istituti e utenti in modo personalizzato e performante.

---

## 🧠 Algoritmo di Raccomandazione

### Fattori di Scoring (Peso Totale: 100 punti)

#### 1. **Similarità Geografica** (25 punti)
```javascript
// Stessa città: +25 punti
// Stessa regione: +15 punti
// Stessa nazione: +5 punti
if (user.city === institute.city) score += 25;
else if (user.region === institute.region) score += 15;
else if (user.country === institute.country) score += 5;
```

#### 2. **Similarità Tipo Istituto** (20 punti)
```javascript
// Stesso tipo (es. Liceo): +20 punti
// Tipo compatibile (es. Media → Liceo): +10 punti
if (user.institute_type === institute.institute_type) score += 20;
else if (isCompatibleType(user.type, institute.type)) score += 10;
```

#### 3. **Interessi Comuni** (20 punti)
```javascript
// Basato su tags dei post
const commonTags = intersection(user.interests, institute.tags);
score += Math.min(20, commonTags.length * 4);
```

#### 4. **Engagement Rate** (15 punti)
```javascript
// Istituti con alto engagement
const engagementRate = (likes + comments + shares) / posts;
score += Math.min(15, engagementRate * 3);
```

#### 5. **Attività Recente** (10 punti)
```javascript
// Post negli ultimi 7 giorni
const recentPosts = posts.filter(p => isLastWeek(p.created_at));
score += Math.min(10, recentPosts.length * 2);
```

#### 6. **Connessioni Comuni** (10 punti)
```javascript
// Amici in comune / Istituti seguiti in comune
const mutualConnections = intersection(user.following, institute.followers);
score += Math.min(10, mutualConnections.length * 2);
```

---

## 📊 Implementazione Database

### Tabella: user_follows
```sql
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES auth.users(id),
  following_id UUID NOT NULL,
  following_type TEXT NOT NULL CHECK (following_type IN ('institute', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id, following_type)
);

CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
CREATE INDEX idx_user_follows_created ON user_follows(created_at DESC);
```

### Tabella: user_activities
```sql
CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_activities_user ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_created ON user_activities(created_at DESC);
```

### Tabella: recommendation_cache
```sql
CREATE TABLE recommendation_cache (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  recommendations JSONB NOT NULL,
  score_breakdown JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refresh cache ogni 6 ore
CREATE INDEX idx_recommendation_cache_updated ON recommendation_cache(updated_at);
```

---

## 🔥 Algoritmo Completo

### Classe RecommendationEngine

```javascript
class RecommendationEngine {
  constructor(userId, supabase) {
    this.userId = userId;
    this.supabase = supabase;
    this.cache = new Map();
  }

  /**
   * Main recommendation function
   */
  async getRecommendations(limit = 10) {
    // 1. Check cache first
    const cached = await this.getCachedRecommendations();
    if (cached && this.isCacheValid(cached.updated_at)) {
      return cached.recommendations.slice(0, limit);
    }

    // 2. Get user profile and preferences
    const userProfile = await this.getUserProfile();
    
    // 3. Get candidate institutes
    const candidates = await this.getCandidates();
    
    // 4. Score each candidate
    const scored = await Promise.all(
      candidates.map(c => this.scoreCandidate(c, userProfile))
    );
    
    // 5. Sort by score and filter
    const recommendations = scored
      .sort((a, b) => b.score - a.score)
      .filter(r => r.score > 30) // Minimum threshold
      .slice(0, limit);
    
    // 6. Cache results
    await this.cacheRecommendations(recommendations);
    
    return recommendations;
  }

  /**
   * Score a single candidate
   */
  async scoreCandidate(candidate, userProfile) {
    let score = 0;
    const breakdown = {};

    // 1. Geographic similarity
    const geoScore = this.calculateGeoScore(candidate, userProfile);
    score += geoScore;
    breakdown.geographic = geoScore;

    // 2. Type similarity
    const typeScore = this.calculateTypeScore(candidate, userProfile);
    score += typeScore;
    breakdown.type = typeScore;

    // 3. Interest overlap
    const interestScore = await this.calculateInterestScore(candidate, userProfile);
    score += interestScore;
    breakdown.interests = interestScore;

    // 4. Engagement rate
    const engagementScore = await this.calculateEngagementScore(candidate);
    score += engagementScore;
    breakdown.engagement = engagementScore;

    // 5. Recent activity
    const activityScore = await this.calculateActivityScore(candidate);
    score += activityScore;
    breakdown.activity = activityScore;

    // 6. Mutual connections
    const mutualScore = await this.calculateMutualScore(candidate, userProfile);
    score += mutualScore;
    breakdown.mutual = mutualScore;

    return {
      ...candidate,
      score,
      breakdown
    };
  }

  /**
   * Geographic scoring
   */
  calculateGeoScore(candidate, user) {
    if (candidate.city === user.city) return 25;
    if (candidate.region === user.region) return 15;
    if (candidate.country === user.country) return 5;
    return 0;
  }

  /**
   * Type similarity scoring
   */
  calculateTypeScore(candidate, user) {
    if (candidate.institute_type === user.institute_type) return 20;
    
    // Compatible types (es. Media → Liceo)
    const compatible = {
      'Scuola Media': ['Liceo', 'Istituto Tecnico'],
      'Liceo': ['Università'],
      'Istituto Tecnico': ['Università']
    };
    
    if (compatible[user.institute_type]?.includes(candidate.institute_type)) {
      return 10;
    }
    
    return 0;
  }

  /**
   * Interest overlap scoring
   */
  async calculateInterestScore(candidate, user) {
    // Get user's interested tags from liked/saved posts
    const userTags = await this.getUserInterestTags(user.id);
    
    // Get candidate's tags from posts
    const candidateTags = await this.getInstituteTags(candidate.id);
    
    // Calculate overlap
    const common = userTags.filter(t => candidateTags.includes(t));
    
    return Math.min(20, common.length * 4);
  }

  /**
   * Engagement rate scoring
   */
  async calculateEngagementScore(candidate) {
    const { data: stats } = await this.supabase
      .from('institute_posts')
      .select('likes_count, comments_count, shares_count')
      .eq('institute_id', candidate.id)
      .limit(10);
    
    if (!stats || stats.length === 0) return 0;
    
    const totalEngagement = stats.reduce((sum, post) => 
      sum + (post.likes_count || 0) + (post.comments_count || 0) + (post.shares_count || 0), 0
    );
    
    const avgEngagement = totalEngagement / stats.length;
    
    return Math.min(15, avgEngagement / 2);
  }

  /**
   * Recent activity scoring
   */
  async calculateActivityScore(candidate) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { count } = await this.supabase
      .from('institute_posts')
      .select('*', { count: 'exact', head: true })
      .eq('institute_id', candidate.id)
      .gte('created_at', weekAgo.toISOString());
    
    return Math.min(10, (count || 0) * 2);
  }

  /**
   * Mutual connections scoring
   */
  async calculateMutualScore(candidate, user) {
    // Get user's following
    const { data: userFollowing } = await this.supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);
    
    // Get candidate's followers
    const { data: candidateFollowers } = await this.supabase
      .from('user_follows')
      .select('follower_id')
      .eq('following_id', candidate.id);
    
    if (!userFollowing || !candidateFollowers) return 0;
    
    const userFollowingIds = userFollowing.map(f => f.following_id);
    const candidateFollowerIds = candidateFollowers.map(f => f.follower_id);
    
    const mutual = userFollowingIds.filter(id => 
      candidateFollowerIds.includes(id)
    );
    
    return Math.min(10, mutual.length * 2);
  }

  /**
   * Get candidates (exclude already following)
   */
  async getCandidates() {
    // Get already following
    const { data: following } = await this.supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', this.userId);
    
    const followingIds = following?.map(f => f.following_id) || [];
    
    // Get candidates
    const { data: candidates } = await this.supabase
      .from('school_institutes')
      .select('*')
      .not('id', 'in', `(${followingIds.join(',') || 'null'})`)
      .limit(50); // Get more candidates for better scoring
    
    return candidates || [];
  }

  /**
   * Cache management
   */
  async getCachedRecommendations() {
    const { data } = await this.supabase
      .from('recommendation_cache')
      .select('*')
      .eq('user_id', this.userId)
      .single();
    
    return data;
  }

  isCacheValid(updatedAt) {
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);
    return new Date(updatedAt) > sixHoursAgo;
  }

  async cacheRecommendations(recommendations) {
    await this.supabase
      .from('recommendation_cache')
      .upsert({
        user_id: this.userId,
        recommendations,
        updated_at: new Date().toISOString()
      });
  }
}
```

---

## 📱 UI Components

### Sidebar - Sezione Following/Followers

```html
<div class="sidebar-section">
  <div class="section-header">
    <h3><i class="fas fa-users"></i> Connessioni</h3>
    <a href="connections.html" class="see-all">Vedi tutto</a>
  </div>
  <div class="connections-summary">
    <div class="connection-stat" id="following-count">
      <span class="count">0</span>
      <span class="label">Seguiti</span>
    </div>
    <div class="connection-stat" id="followers-count">
      <span class="count">0</span>
      <span class="label">Follower</span>
    </div>
  </div>
  <div class="recent-followers" id="recent-followers">
    <!-- Populated by JS -->
  </div>
</div>
```

### Activity Feed - Follow Events

```javascript
{
  type: 'follow_received',
  user: 'Liceo Scientifico Roma',
  timestamp: '2 ore fa',
  icon: 'fa-user-plus',
  color: 'success'
}

{
  type: 'follow_given',
  user: 'Istituto Tecnico Milano',
  timestamp: '5 ore fa',
  icon: 'fa-heart',
  color: 'primary'
}
```

---

## 🎯 Performance Optimization

### 1. **Caching Strategy**
- Cache recommendations per 6 ore
- Invalidate cache on user action (follow/unfollow)
- Use Redis/Memcached per production

### 2. **Batch Processing**
- Score candidates in parallel con Promise.all
- Limit candidate pool a 50 per query
- Pre-compute engagement metrics

### 3. **Database Indexes**
```sql
-- Critical indexes
CREATE INDEX idx_posts_institute_created ON institute_posts(institute_id, created_at DESC);
CREATE INDEX idx_posts_tags ON institute_posts USING GIN(tags);
CREATE INDEX idx_follows_composite ON user_follows(follower_id, following_id);
```

### 4. **Query Optimization**
- Use .select() con campi specifici
- Limit results appropriately
- Use .maybeSingle() invece di .single()

---

## 📊 Metriche di Successo

### KPIs da Monitorare
1. **Click-Through Rate (CTR)**: % utenti che cliccano su raccomandazioni
2. **Follow Rate**: % raccomandazioni che portano a follow
3. **Engagement Rate**: Interazioni con contenuti raccomandati
4. **Retention**: Utenti che tornano dopo follow raccomandati

### A/B Testing
- Test diversi pesi per fattori di scoring
- Test diversi threshold minimi
- Test diversi refresh rate della cache

---

## 🚀 Roadmap Futura

### Phase 1 (Corrente)
- ✅ Algoritmo base con 6 fattori
- ✅ Cache recommendations
- ✅ UI sidebar e discover

### Phase 2
- 🔄 Machine Learning per ottimizzare pesi
- 🔄 Collaborative filtering
- 🔄 Content-based filtering avanzato

### Phase 3
- 📅 Real-time recommendations
- 📅 Personalized feed ordering
- 📅 Notification intelligenti

---

**Status**: 🚧 In Development
**Priority**: 🔥 High
**Complexity**: ⭐⭐⭐⭐⭐

Questo sistema è progettato per scalare e migliorare nel tempo, proprio come i grandi social network! 🚀
