# 📊 Architettura Sistema di Raccomandazione

## 🏗️ Panoramica Architetturale

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Sidebar    │  │  Discover    │  │   Follow     │        │
│  │  Component   │  │     Tab      │  │   Buttons    │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                 │
│                            │                                    │
│                  ┌─────────▼─────────┐                         │
│                  │ RecommendationUI  │                         │
│                  │   (Integration)   │                         │
│                  └─────────┬─────────┘                         │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              ┌──────────────────────────────┐                  │
│              │   RecommendationEngine       │                  │
│              │                              │                  │
│              │  ┌────────────────────────┐  │                  │
│              │  │  Scoring Algorithm     │  │                  │
│              │  │  • Geographic (25pts)  │  │                  │
│              │  │  • Type (20pts)        │  │                  │
│              │  │  • Interests (20pts)   │  │                  │
│              │  │  • Engagement (15pts)  │  │                  │
│              │  │  • Activity (10pts)    │  │                  │
│              │  │  • Mutual (10pts)      │  │                  │
│              │  └────────────────────────┘  │                  │
│              │                              │                  │
│              │  ┌────────────────────────┐  │                  │
│              │  │   Cache Manager        │  │                  │
│              │  │   • 6 hour validity    │  │                  │
│              │  │   • Auto invalidation  │  │                  │
│              │  └────────────────────────┘  │                  │
│              │                              │                  │
│              │  ┌────────────────────────┐  │                  │
│              │  │  Activity Tracker      │  │                  │
│              │  │  • Views, Likes, Saves │  │                  │
│              │  │  • Follows, Searches   │  │                  │
│              │  └────────────────────────┘  │                  │
│              └──────────────┬───────────────┘                  │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                        DATABASE LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │user_follows  │  │user_activities│ │recommendation│        │
│  │              │  │               │  │   _cache     │        │
│  │• follower_id │  │• user_id      │  │• user_id     │        │
│  │• following_id│  │• activity_type│  │• recommendations│     │
│  │• type        │  │• target_id    │  │• updated_at  │        │
│  │• created_at  │  │• created_at   │  └──────────────┘        │
│  └──────────────┘  └──────────────┘                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │    institute_engagement_stats (Materialized)     │          │
│  │                                                  │          │
│  │  • total_posts, total_likes, total_comments     │          │
│  │  • avg_engagement, recent_posts_count           │          │
│  │  • Refreshed periodically for performance       │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. Caricamento Raccomandazioni

```
User Opens Homepage
       │
       ▼
RecommendationUI.init()
       │
       ▼
Check Cache (6h validity)
       │
       ├─── Cache Valid ──────► Return Cached Results
       │
       └─── Cache Invalid
              │
              ▼
       Get User Profile
              │
              ▼
       Get Candidates (50 institutes)
              │
              ▼
       Score Each Candidate
       (Parallel Processing)
              │
              ▼
       Filter (score > 30)
              │
              ▼
       Sort by Score
              │
              ▼
       Cache Results
              │
              ▼
       Render UI
```

### 2. Follow Action

```
User Clicks "Segui"
       │
       ▼
Show Loading State
       │
       ▼
Insert into user_follows
       │
       ▼
Track Activity (follow)
       │
       ▼
Trigger: Invalidate Cache
       │
       ▼
Update UI (Seguito)
       │
       ▼
Update Counters
       │
       ▼
Reload Recommendations
```

### 3. Activity Tracking

```
User Action (like, save, view)
       │
       ▼
trackActivity()
       │
       ▼
Insert into user_activities
       │
       ▼
Used for Interest Scoring
       │
       ▼
Better Recommendations
```

---

## 🎯 Scoring Algorithm Flow

```
For Each Candidate Institute:

1. Geographic Score (25 pts)
   ├─ Same City? ──────────► +25
   ├─ Same Region? ────────► +15
   └─ Same Country? ───────► +5

2. Type Score (20 pts)
   ├─ Same Type? ──────────► +20
   └─ Compatible Type? ────► +10

3. Interest Score (20 pts)
   ├─ Get User Tags (from liked posts)
   ├─ Get Institute Tags (from posts)
   ├─ Calculate Overlap
   └─ 4 pts per common tag ► Max 20

4. Engagement Score (15 pts)
   ├─ Get Last 10 Posts
   ├─ Calculate Avg Engagement
   └─ 2 engagement = 1 pt ► Max 15

5. Activity Score (10 pts)
   ├─ Count Posts Last 7 Days
   └─ 2 pts per post ──────► Max 10

6. Mutual Score (10 pts)
   ├─ Get User Following
   ├─ Get Institute Followers
   ├─ Calculate Intersection
   └─ 2 pts per mutual ────► Max 10

Total Score = Sum of All Factors (0-100)

Filter: Keep only score > 30
Sort: Highest score first
Return: Top N results
```

---

## 🗄️ Database Schema Relationships

```
┌─────────────────┐
│   auth.users    │
│                 │
│  • id (PK)      │
│  • email        │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────┴─────────────────────────────────┐
    │                                      │
    ▼                                      ▼
┌─────────────────┐              ┌─────────────────┐
│  user_follows   │              │user_activities  │
│                 │              │                 │
│  • follower_id  │              │  • user_id      │
│  • following_id │              │  • activity_type│
│  • type         │              │  • target_id    │
└─────────────────┘              └─────────────────┘
         │                                │
         │                                │
         │ N:1                            │ N:1
         │                                │
         ▼                                ▼
┌─────────────────┐              ┌─────────────────┐
│school_institutes│              │institute_posts  │
│                 │              │                 │
│  • id (PK)      │◄─────────────│  • institute_id │
│  • name         │      1:N     │  • tags         │
│  • type         │              │  • likes_count  │
│  • city         │              └─────────────────┘
└─────────────────┘                       │
         │                                │
         │                                │
         │                                ▼
         │                       ┌─────────────────┐
         │                       │   engagement    │
         │                       │     _stats      │
         │                       │  (Materialized) │
         │                       └─────────────────┘
         │
         ▼
┌─────────────────┐
│recommendation   │
│    _cache       │
│                 │
│  • user_id (PK) │
│  • recommendations│
└─────────────────┘
```

---

## 🔐 Security Architecture

### Row Level Security (RLS)

```
┌─────────────────────────────────────────────────┐
│              RLS POLICIES                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  user_follows:                                  │
│  ├─ SELECT: Public (anyone can see)            │
│  ├─ INSERT: auth.uid() = follower_id           │
│  └─ DELETE: auth.uid() = follower_id           │
│                                                 │
│  user_activities:                               │
│  ├─ SELECT: auth.uid() = user_id               │
│  └─ INSERT: auth.uid() = user_id               │
│                                                 │
│  recommendation_cache:                          │
│  ├─ SELECT: auth.uid() = user_id               │
│  ├─ INSERT: auth.uid() = user_id               │
│  └─ UPDATE: auth.uid() = user_id               │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ⚡ Performance Optimizations

### 1. Database Level

```
Indexes:
├─ user_follows(follower_id)
├─ user_follows(following_id)
├─ user_follows(follower_id, following_id) [Composite]
├─ user_activities(user_id, activity_type, created_at)
├─ institute_posts(institute_id, created_at)
└─ institute_posts(tags) [GIN Index]

Materialized View:
└─ institute_engagement_stats
   └─ Refreshed periodically (cron)
```

### 2. Application Level

```
Caching:
├─ Recommendation Cache (6 hours)
├─ In-Memory Cache (Map)
└─ Browser LocalStorage (future)

Batch Processing:
├─ Promise.all() for parallel scoring
├─ Limit candidate pool (50)
└─ Pagination for large results

Lazy Loading:
├─ Load recommendations on demand
├─ Infinite scroll for discover
└─ Progressive enhancement
```

### 3. Network Level

```
Optimization:
├─ Defer script loading
├─ Preconnect to Supabase
├─ Minimize API calls
└─ Compress responses
```

---

## 🔄 Cache Strategy

```
┌─────────────────────────────────────────────────┐
│              CACHE LIFECYCLE                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Request Recommendations                     │
│     │                                           │
│     ▼                                           │
│  2. Check Cache                                 │
│     ├─ Exists & Valid (< 6h) ──► Return Cache  │
│     └─ Missing or Expired                       │
│         │                                       │
│         ▼                                       │
│  3. Compute Recommendations                     │
│     │                                           │
│     ▼                                           │
│  4. Store in Cache                              │
│     │                                           │
│     ▼                                           │
│  5. Return Results                              │
│                                                 │
│  Invalidation Triggers:                         │
│  • User follows/unfollows                       │
│  • Manual refresh                               │
│  • 6 hour expiry                                │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📊 Monitoring & Analytics

### Key Metrics

```
User Engagement:
├─ Click-Through Rate (CTR)
│  └─ % users clicking recommendations
├─ Follow Rate
│  └─ % recommendations leading to follows
├─ Engagement Rate
│  └─ Interactions with recommended content
└─ Retention
   └─ Users returning after following

System Performance:
├─ Cache Hit Rate
│  └─ % requests served from cache
├─ Average Response Time
│  └─ Time to generate recommendations
├─ Database Query Time
│  └─ Time for scoring queries
└─ Error Rate
   └─ Failed recommendation requests
```

### Monitoring Queries

```sql
-- Daily Active Users
SELECT DATE(created_at), COUNT(DISTINCT user_id)
FROM user_activities
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at);

-- Popular Institutes
SELECT following_id, COUNT(*) as followers
FROM user_follows
WHERE following_type = 'institute'
GROUP BY following_id
ORDER BY followers DESC
LIMIT 20;

-- Activity Breakdown
SELECT activity_type, COUNT(*) as count
FROM user_activities
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY activity_type
ORDER BY count DESC;
```

---

## 🚀 Scalability Considerations

### Current Capacity

```
Users: Up to 100,000
Institutes: Up to 10,000
Posts: Up to 1,000,000
Activities: Up to 10,000,000
```

### Scaling Strategies

```
Horizontal Scaling:
├─ Read Replicas for queries
├─ Connection pooling
└─ Load balancing

Vertical Scaling:
├─ Increase database resources
├─ Optimize indexes
└─ Partition large tables

Caching:
├─ Redis for distributed cache
├─ CDN for static assets
└─ Edge caching
```

---

## 🔮 Future Enhancements

### Phase 2: Machine Learning

```
┌─────────────────────────────────────┐
│     ML-Enhanced Recommendations     │
├─────────────────────────────────────┤
│                                     │
│  • Collaborative Filtering          │
│  • Neural Network Scoring           │
│  • A/B Testing Framework            │
│  • Personalized Weight Optimization │
│                                     │
└─────────────────────────────────────┘
```

### Phase 3: Real-Time

```
┌─────────────────────────────────────┐
│      Real-Time Recommendations      │
├─────────────────────────────────────┤
│                                     │
│  • WebSocket Integration            │
│  • Live Updates                     │
│  • Push Notifications               │
│  • Event-Driven Architecture        │
│                                     │
└─────────────────────────────────────┘
```

---

**Architettura Versione**: 1.0.0
**Last Updated**: 14 Ottobre 2025
**Status**: Production Ready ✅
