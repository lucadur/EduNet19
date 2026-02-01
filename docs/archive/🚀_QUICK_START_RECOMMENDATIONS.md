# 🚀 Quick Start - Sistema di Raccomandazione

## ⚡ Setup in 5 Minuti

### Step 1: Database Setup (2 minuti)

1. Apri **Supabase SQL Editor**
2. Copia tutto il contenuto di `recommendation-system-setup.sql`
3. Incolla e clicca **RUN**
4. Attendi conferma: "Success. No rows returned"

### Step 2: Verifica Setup (1 minuto)

Esegui questa query per verificare:

```sql
-- Verifica tabelle create
SELECT 
  'user_follows' as table_name, COUNT(*) as count FROM user_follows
UNION ALL
SELECT 'user_activities', COUNT(*) FROM user_activities
UNION ALL
SELECT 'recommendation_cache', COUNT(*) FROM recommendation_cache;

-- Refresh engagement stats
SELECT refresh_engagement_stats();
```

### Step 3: Test Homepage (2 minuti)

1. Apri `homepage.html` nel browser
2. Fai login
3. Controlla la **console** per:
   ```
   ✅ Recommendation system initialized successfully
   ```
4. Verifica nella **sidebar**:
   - Sezione "Connessioni" con contatori
   - Sezione "Istituti Consigliati"

5. Clicca sul tab **"Scopri"**:
   - Trending topics
   - Lista istituti espansa

### Step 4: Test Follow (30 secondi)

1. Clicca su un pulsante **"Segui"**
2. Verifica:
   - Loading spinner
   - Cambio a "Seguito"
   - Notifica successo
   - Contatori aggiornati

---

## ✅ Checklist Rapida

- [ ] SQL script eseguito senza errori
- [ ] Console mostra "Recommendation system initialized"
- [ ] Sidebar mostra "Connessioni" e "Istituti Consigliati"
- [ ] Tab "Scopri" funziona
- [ ] Pulsante "Segui" funziona
- [ ] Contatori si aggiornano

---

## 🐛 Problemi Comuni

### "No recommendations found"
**Causa**: Database vuoto
**Fix**: Aggiungi alcuni istituti di test:

```sql
INSERT INTO school_institutes (institute_name, institute_type, city, region, country)
VALUES 
  ('Liceo Scientifico Roma', 'Liceo', 'Roma', 'Lazio', 'Italia'),
  ('Istituto Tecnico Milano', 'Istituto Tecnico', 'Milano', 'Lombardia', 'Italia'),
  ('Scuola Media Firenze', 'Scuola Media', 'Firenze', 'Toscana', 'Italia');
```

### "Recommendation system dependencies not loaded"
**Causa**: Script non caricati in ordine
**Fix**: Verifica in `homepage.html`:

```html
<script src="recommendation-engine.js" defer></script>
<script src="recommendation-integration.js" defer></script>
<script src="homepage-script.js" defer></script>
<script src="homepage-recommendation-init.js" defer></script>
```

### "Permission denied" su follow
**Causa**: RLS policies non attive
**Fix**:

```sql
-- Verifica policies
SELECT * FROM pg_policies WHERE tablename = 'user_follows';

-- Se mancano, ri-esegui recommendation-system-setup.sql
```

---

## 🎯 Test Completo

### Test 1: Visualizza Suggerimenti
```javascript
// Console browser
window.recommendationUI.loadRecommendations(5);
```

### Test 2: Segui Istituto
```javascript
// Console browser
const instituteId = 'INSTITUTE_UUID_HERE';
await window.recommendationUI.engine.followInstitute(instituteId);
```

### Test 3: Verifica Cache
```sql
-- SQL Editor
SELECT * FROM recommendation_cache WHERE user_id = auth.uid();
```

### Test 4: Verifica Attività
```sql
-- SQL Editor
SELECT * FROM user_activities 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 📊 Monitoring Dashboard

### Query Utili

**Utenti più attivi:**
```sql
SELECT user_id, COUNT(*) as activities
FROM user_activities
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY activities DESC
LIMIT 10;
```

**Istituti più seguiti:**
```sql
SELECT following_id, COUNT(*) as followers
FROM user_follows
WHERE following_type = 'institute'
GROUP BY following_id
ORDER BY followers DESC
LIMIT 10;
```

**Cache hit rate:**
```sql
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN updated_at > NOW() - INTERVAL '6 hours' THEN 1 END) as cached,
  ROUND(100.0 * COUNT(CASE WHEN updated_at > NOW() - INTERVAL '6 hours' THEN 1 END) / COUNT(*), 2) as hit_rate
FROM recommendation_cache;
```

**Trending tags:**
```sql
SELECT tag, COUNT(*) as count
FROM (
  SELECT unnest(tags) as tag
  FROM institute_posts
  WHERE created_at > NOW() - INTERVAL '7 days'
) subquery
GROUP BY tag
ORDER BY count DESC
LIMIT 10;
```

---

## 🎨 Personalizzazione Rapida

### Cambia Colori

In `recommendation-ui.css`:

```css
/* Cambia colore primario */
.follow-btn {
  background: #YOUR_COLOR; /* Default: #0066cc */
}

.connections-summary {
  background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
}
```

### Cambia Pesi Scoring

In `recommendation-engine.js`:

```javascript
this.weights = {
  geographic: 25,  // Aumenta per dare più peso alla posizione
  type: 20,        // Aumenta per tipo istituto
  interests: 20,   // Aumenta per interessi comuni
  engagement: 15,  // Aumenta per engagement
  activity: 10,    // Aumenta per attività recente
  mutual: 10       // Aumenta per connessioni comuni
};
```

### Cambia Numero Suggerimenti

In `recommendation-integration.js`:

```javascript
// Sidebar (default: 5)
await this.loadRecommendations(5);

// Discover (default: 10)
const recommendations = await this.engine.getRecommendations(10);
```

---

## 🚀 Performance Tips

### 1. Refresh Engagement Stats Periodicamente

Crea un cron job (es. ogni notte):

```sql
SELECT refresh_engagement_stats();
```

### 2. Pulisci Cache Vecchia

```sql
-- Ogni settimana
DELETE FROM recommendation_cache 
WHERE updated_at < NOW() - INTERVAL '7 days';
```

### 3. Archivia Attività Vecchie

```sql
-- Ogni mese
DELETE FROM user_activities 
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## 📱 Mobile Testing

1. Apri Chrome DevTools
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Seleziona iPhone/Android
4. Verifica:
   - Sidebar responsive
   - Follow buttons accessibili
   - Tab Discover funziona
   - Trending topics scrollabili

---

## 🎓 Esempi di Utilizzo

### Traccia Visualizzazione Post

```javascript
if (homepage.recommendationUI) {
  await homepage.recommendationUI.trackActivity(
    'post_view',
    postId,
    'post'
  );
}
```

### Traccia Like

```javascript
if (homepage.recommendationUI) {
  await homepage.recommendationUI.trackActivity(
    'post_like',
    postId,
    'post'
  );
}
```

### Refresh Manuale Raccomandazioni

```javascript
if (homepage.recommendationUI) {
  await homepage.recommendationUI.refreshRecommendations();
}
```

### Get Connection Counts

```javascript
if (homepage.recommendationUI && homepage.recommendationUI.engine) {
  const counts = await homepage.recommendationUI.engine.getConnectionCounts();
  console.log('Following:', counts.following);
  console.log('Followers:', counts.followers);
}
```

---

## 🎉 Fatto!

Il sistema è pronto! Se tutto funziona:

✅ Sidebar mostra suggerimenti personalizzati
✅ Tab Discover mostra trending topics
✅ Follow/Unfollow funziona
✅ Contatori si aggiornano
✅ Cache ottimizza performance

### Prossimi Passi

1. Monitora metriche per 1 settimana
2. Raccogli feedback utenti
3. Ottimizza pesi scoring se necessario
4. Considera Phase 2 features

---

**Hai domande?** Controlla:
- 🎯 `RECOMMENDATION_IMPLEMENTATION_GUIDE.md` per dettagli
- ✅ `RECOMMENDATION_SYSTEM_COMPLETE.md` per overview
- 🚀 `ADVANCED_RECOMMENDATION_SYSTEM.md` per architettura

**Buon lavoro! 🚀**
