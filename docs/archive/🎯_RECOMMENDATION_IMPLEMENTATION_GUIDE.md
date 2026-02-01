# 🎯 Guida Implementazione Sistema di Raccomandazione

## ✅ File Creati

### 1. **recommendation-engine.js**
Classe principale del motore di raccomandazione con algoritmo di scoring avanzato.

### 2. **recommendation-system-setup.sql**
Script SQL completo per creare tutte le tabelle necessarie:
- `user_follows` - Traccia chi segue chi
- `user_activities` - Log delle attività utente
- `recommendation_cache` - Cache delle raccomandazioni
- `institute_engagement_stats` - Vista materializzata per performance

### 3. **recommendation-ui.css**
Stili per i componenti UI delle raccomandazioni.

### 4. **recommendation-integration.js**
Integrazione del sistema con la homepage:
- `RecommendationUI` - Gestisce la visualizzazione
- `DiscoverManager` - Gestisce la sezione Discover

---

## 🚀 Passi per l'Implementazione

### Step 1: Setup Database

1. Apri Supabase SQL Editor
2. Esegui `recommendation-system-setup.sql`
3. Verifica che tutte le tabelle siano create:
   ```sql
   SELECT * FROM user_follows LIMIT 1;
   SELECT * FROM user_activities LIMIT 1;
   SELECT * FROM recommendation_cache LIMIT 1;
   ```

4. Refresh della vista materializzata:
   ```sql
   SELECT refresh_engagement_stats();
   ```

### Step 2: Aggiungi File alla Homepage

Aggiungi questi tag nel `<head>` di `homepage.html`:

```html
<!-- Recommendation System CSS -->
<link rel="stylesheet" href="recommendation-ui.css">
```

Aggiungi questi script prima della chiusura del `</body>`:

```html
<!-- Recommendation System Scripts -->
<script src="recommendation-engine.js"></script>
<script src="recommendation-integration.js"></script>
```

### Step 3: Aggiorna HTML Sidebar

Trova la sezione sidebar e aggiungi:

```html
<!-- Connections Summary -->
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
</div>

<!-- Suggested Institutes -->
<div class="sidebar-section suggested-institutes">
  <div class="section-header">
    <h3><i class="fas fa-school"></i> Istituti Consigliati</h3>
    <a href="#" class="see-all" onclick="homepage.switchFeedTab('discover'); return false;">Vedi tutto</a>
  </div>
  <div id="suggested-institutes">
    <!-- Populated by JS -->
  </div>
</div>
```

### Step 4: Inizializza nella Homepage

Nel file `homepage-script.js`, aggiungi nell'inizializzazione:

```javascript
// Nella classe EduNetHomepage, aggiungi:
constructor() {
  // ... existing code ...
  this.recommendationUI = null;
  this.discoverManager = null;
}

async handleDOMReady() {
  // ... existing code ...
  
  // Initialize recommendation system
  this.initializeRecommendations();
}

initializeRecommendations() {
  if (window.RecommendationUI) {
    this.recommendationUI = new RecommendationUI(this);
    this.discoverManager = new DiscoverManager(this);
    this.discoverManager.init(this.recommendationUI);
  }
}

// Aggiorna switchFeedTab per gestire discover
switchFeedTab(feedType) {
  // ... existing code ...
  
  if (feedType === 'discover') {
    if (this.discoverManager) {
      this.discoverManager.renderDiscoverSection();
    }
  } else {
    // ... existing feed loading code ...
  }
}
```

### Step 5: Aggiungi Tab Discover

Nel HTML dei tab, aggiungi:

```html
<button class="feed-tab" data-feed="discover">
  <i class="fas fa-compass"></i>
  <span>Scopri</span>
</button>
```

---

## 🎯 Funzionalità Implementate

### 1. **Algoritmo di Scoring (100 punti)**
- ✅ Similarità Geografica (25 punti)
- ✅ Similarità Tipo Istituto (20 punti)
- ✅ Interessi Comuni (20 punti)
- ✅ Engagement Rate (15 punti)
- ✅ Attività Recente (10 punti)
- ✅ Connessioni Comuni (10 punti)

### 2. **Sistema di Follow/Unfollow**
- ✅ Segui istituti con un click
- ✅ Tracking automatico delle attività
- ✅ Invalidazione cache automatica
- ✅ Aggiornamento contatori in tempo reale

### 3. **Cache Intelligente**
- ✅ Cache valida per 6 ore
- ✅ Invalidazione automatica su follow/unfollow
- ✅ Refresh manuale disponibile

### 4. **UI Components**
- ✅ Sidebar con istituti suggeriti
- ✅ Contatori Following/Followers
- ✅ Sezione Discover completa
- ✅ Trending topics
- ✅ Score badge per ogni suggerimento

### 5. **Performance Optimization**
- ✅ Vista materializzata per engagement
- ✅ Indici database ottimizzati
- ✅ Batch processing con Promise.all
- ✅ Limit su query candidate (50)

---

## 📊 Tracking Attività

Il sistema traccia automaticamente:

- `post_view` - Visualizzazione post
- `post_like` - Like su post
- `post_save` - Salvataggio post
- `post_share` - Condivisione post
- `post_comment` - Commento su post
- `profile_view` - Visualizzazione profilo
- `search` - Ricerche effettuate
- `follow` - Nuovi follow
- `unfollow` - Unfollow

### Come Tracciare Attività

```javascript
// Nel codice dove avviene un'azione:
if (homepage.recommendationUI) {
  await homepage.recommendationUI.trackActivity(
    'post_like',
    postId,
    'post',
    { additional: 'data' }
  );
}
```

---

## 🔧 Manutenzione

### Refresh Vista Materializzata

Esegui periodicamente (es. ogni notte via cron):

```sql
SELECT refresh_engagement_stats();
```

### Clear Cache Manualmente

```sql
DELETE FROM recommendation_cache WHERE updated_at < NOW() - INTERVAL '24 hours';
```

### Monitoraggio Performance

```sql
-- Check cache hit rate
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN updated_at > NOW() - INTERVAL '6 hours' THEN 1 END) as cached_users,
  ROUND(100.0 * COUNT(CASE WHEN updated_at > NOW() - INTERVAL '6 hours' THEN 1 END) / COUNT(*), 2) as cache_hit_rate
FROM recommendation_cache;

-- Check most active users
SELECT user_id, COUNT(*) as activity_count
FROM user_activities
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY activity_count DESC
LIMIT 10;

-- Check most followed institutes
SELECT following_id, COUNT(*) as follower_count
FROM user_follows
WHERE following_type = 'institute'
GROUP BY following_id
ORDER BY follower_count DESC
LIMIT 10;
```

---

## 🎨 Personalizzazione

### Modificare Pesi Scoring

In `recommendation-engine.js`, modifica:

```javascript
this.weights = {
  geographic: 25,  // Cambia questi valori
  type: 20,
  interests: 20,
  engagement: 15,
  activity: 10,
  mutual: 10
};
```

### Modificare Soglia Minima

```javascript
.filter(r => r.score > 30) // Cambia 30 con la tua soglia
```

### Modificare Validità Cache

```javascript
this.cacheValidityMs = 6 * 60 * 60 * 1000; // 6 ore in millisecondi
```

---

## 🐛 Troubleshooting

### Problema: Nessun suggerimento mostrato

**Soluzione:**
1. Verifica che le tabelle esistano
2. Controlla console per errori
3. Verifica che ci siano istituti nel database
4. Controlla RLS policies

### Problema: Score sempre 0

**Soluzione:**
1. Verifica che i post abbiano tags
2. Controlla che ci siano attività utente
3. Verifica engagement stats: `SELECT * FROM institute_engagement_stats;`

### Problema: Cache non si aggiorna

**Soluzione:**
1. Verifica trigger: `SELECT * FROM pg_trigger WHERE tgname LIKE '%recommendation%';`
2. Clear manuale: `DELETE FROM recommendation_cache WHERE user_id = 'USER_ID';`

---

## 📈 Metriche di Successo

Monitora questi KPI:

1. **Click-Through Rate (CTR)**
   ```sql
   SELECT 
     COUNT(DISTINCT CASE WHEN activity_type = 'profile_view' THEN user_id END) as clicks,
     COUNT(DISTINCT user_id) as total_users,
     ROUND(100.0 * COUNT(DISTINCT CASE WHEN activity_type = 'profile_view' THEN user_id END) / COUNT(DISTINCT user_id), 2) as ctr
   FROM user_activities
   WHERE created_at > NOW() - INTERVAL '7 days';
   ```

2. **Follow Rate**
   ```sql
   SELECT 
     COUNT(*) as new_follows,
     DATE(created_at) as date
   FROM user_follows
   WHERE created_at > NOW() - INTERVAL '30 days'
   GROUP BY DATE(created_at)
   ORDER BY date DESC;
   ```

3. **Engagement Rate**
   ```sql
   SELECT 
     AVG(likes_count + comments_count + shares_count) as avg_engagement
   FROM institute_posts
   WHERE created_at > NOW() - INTERVAL '7 days';
   ```

---

## 🚀 Roadmap Futura

### Phase 2 (Prossimi Sviluppi)
- [ ] Machine Learning per ottimizzare pesi automaticamente
- [ ] Collaborative filtering (utenti simili)
- [ ] Content-based filtering avanzato
- [ ] A/B testing framework

### Phase 3 (Long Term)
- [ ] Real-time recommendations con WebSocket
- [ ] Personalized feed ordering
- [ ] Notification intelligenti
- [ ] Recommendation explanation (perché suggerito)

---

**Status**: ✅ Ready for Implementation
**Priority**: 🔥 High
**Estimated Time**: 2-3 ore per implementazione completa

Il sistema è pronto per essere integrato! Segui gli step in ordine e testa ogni fase. 🚀
