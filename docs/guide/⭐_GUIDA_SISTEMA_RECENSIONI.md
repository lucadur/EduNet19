# ⭐ GUIDA COMPLETA - SISTEMA RECENSIONI ISTITUTI

## Panoramica Sistema

Il sistema di recensioni permette:

### 1. Istituti → Istituti
- ✅ Valutazione da 1 a 5 stelle
- ✅ Commento obbligatorio (min 10 caratteri)
- ✅ Pubblicazione immediata (auto-verificata)
- ✅ Modifica ed eliminazione proprie recensioni

### 2. Privati → Istituti
- ✅ Valutazione da 1 a 5 stelle
- ✅ Nessun commento (solo stelle)
- ⚠️ Pubblicazione dopo verifica admin istituto
- ✅ Modifica ed eliminazione proprie recensioni

---

## 📋 STEP 1: Esegui Script Database

Vai su **Supabase → SQL Editor** ed esegui:

```sql
⭐_CREA_SISTEMA_VALUTAZIONI.sql
```

Questo script crea:
- Tabella `institute_reviews`
- Funzioni per calcolo rating
- Funzione per verifica recensioni
- RLS policies complete
- Trigger per cache automatica

---

## 📋 STEP 2: Integra nel Profilo Istituto

### A. Aggiungi file CSS e JS

In `profile-page.html` (o dove mostri il profilo istituto), aggiungi:

```html
<head>
    <!-- Altri CSS -->
    <link rel="stylesheet" href="institute-reviews.css">
    <link rel="stylesheet" href="review-moderation.css">
</head>

<body>
    <!-- Contenuto profilo -->
    
    <!-- SEZIONE RECENSIONI -->
    <div class="profile-section">
        <!-- Rating Summary -->
        <div id="rating-summary"></div>
        
        <!-- Form Recensione (se utente può recensire) -->
        <div id="review-form-container"></div>
        
        <!-- Lista Recensioni -->
        <div id="reviews-list"></div>
    </div>
    
    <!-- Script -->
    <script src="institute-reviews.js"></script>
    <script src="review-moderation.js"></script>
    
    <script>
        // Inizializza sistema recensioni
        const instituteId = 'UUID_ISTITUTO'; // Ottieni dall'URL o contesto
        reviewsManager.init(instituteId);
    </script>
</body>
```

### B. Esempio Integrazione in profile-page.js

```javascript
// Dopo aver caricato i dati del profilo
async function loadProfileData(profileId) {
    // ... carica dati profilo esistenti ...
    
    // Inizializza sistema recensioni
    await reviewsManager.init(profileId);
}
```

---

## 📋 STEP 3: Pannello Moderazione per Admin

### A. Crea pagina moderazione (opzionale)

Puoi creare una pagina dedicata o integrare nel profilo:

```html
<!-- In manage-admins.html o settings -->
<div class="admin-section">
    <h2>Gestione Recensioni</h2>
    <div id="review-moderation-panel"></div>
</div>

<script>
    // Inizializza pannello moderazione
    const myInstituteId = 'UUID_MIO_ISTITUTO';
    moderationPanel.init(myInstituteId);
</script>
```

### B. Badge notifica in navbar

Aggiungi badge per recensioni in sospeso:

```html
<!-- In navbar -->
<a href="/manage-reviews.html">
    Recensioni
    <span id="pending-reviews-badge">0</span>
</a>

<script>
    // Carica contatore
    loadPendingReviewsCount(myInstituteId);
</script>
```

---

## 🎨 PERSONALIZZAZIONE CSS

### Colori Principali

```css
/* Modifica in institute-reviews.css */
.rating-number {
    color: #1976d2; /* Blu principale */
}

.star.filled {
    color: #ffc107; /* Giallo stelle */
}

.btn-primary {
    background: #1976d2; /* Bottone principale */
}
```

---

## 🔧 FUNZIONI DISPONIBILI

### JavaScript API

```javascript
// Inizializza sistema recensioni
await reviewsManager.init(instituteId);

// Carica riepilogo rating
await reviewsManager.loadRatingSummary();

// Carica recensioni
await reviewsManager.loadReviews(limit, offset);

// Elimina recensione
await reviewsManager.deleteReview(reviewId);

// Pannello moderazione
await moderationPanel.init(instituteId);
await moderationPanel.approveReview(reviewId);
await moderationPanel.rejectReview(reviewId);
```

### Database Functions

```sql
-- Ottieni rating medio e distribuzione
SELECT * FROM get_institute_rating('institute_uuid');

-- Ottieni recensioni con dettagli
SELECT * FROM get_institute_reviews('institute_uuid', 10, 0);

-- Verifica recensione (solo admin)
SELECT verify_review('review_uuid');
```

---

## 📊 QUERY UTILI

### Recensioni in attesa per un istituto

```sql
SELECT 
    ir.*,
    up.full_name as reviewer_name
FROM institute_reviews ir
JOIN user_profiles up ON up.id = ir.reviewer_id
WHERE ir.reviewed_institute_id = 'INSTITUTE_UUID'
AND ir.is_verified = false
ORDER BY ir.created_at DESC;
```

### Top istituti per rating

```sql
SELECT 
    up.full_name,
    up.rating_average,
    up.rating_count
FROM user_profiles up
WHERE up.user_type = 'institute'
AND up.rating_count > 0
ORDER BY up.rating_average DESC, up.rating_count DESC
LIMIT 10;
```

### Statistiche recensioni

```sql
SELECT 
    COUNT(*) as total_reviews,
    COUNT(*) FILTER (WHERE is_verified = true) as verified,
    COUNT(*) FILTER (WHERE is_verified = false) as pending,
    COUNT(*) FILTER (WHERE reviewer_type = 'institute') as from_institutes,
    COUNT(*) FILTER (WHERE reviewer_type = 'private') as from_privates,
    ROUND(AVG(rating), 2) as avg_rating
FROM institute_reviews;
```

---

## 🔒 SICUREZZA

### RLS Policies Implementate

1. **Lettura**: Tutti vedono recensioni verificate
2. **Inserimento Istituti**: Solo istituti con commento obbligatorio
3. **Inserimento Privati**: Solo privati, recensione va in verifica
4. **Modifica**: Solo proprie recensioni
5. **Eliminazione**: Solo proprie recensioni
6. **Verifica**: Solo admin dell'istituto recensito

### Validazioni

- Rating: 1-5 stelle obbligatorio
- Commento istituti: minimo 10 caratteri
- Una recensione per utente per istituto
- Privati non possono commentare
- Auto-verifica per istituti

---

## 🎯 WORKFLOW COMPLETO

### Scenario 1: Istituto recensisce altro istituto

1. Istituto A visita profilo Istituto B
2. Clicca stelle (1-5)
3. Scrive commento (min 10 caratteri)
4. Clicca "Pubblica recensione"
5. ✅ Recensione pubblicata immediatamente
6. Rating medio Istituto B aggiornato automaticamente

### Scenario 2: Privato recensisce istituto

1. Utente privato visita profilo istituto
2. Clicca stelle (1-5)
3. Clicca "Pubblica recensione"
4. ⏳ Recensione in attesa di verifica
5. Admin istituto riceve notifica (badge)
6. Admin approva o rifiuta
7. ✅ Se approvata, recensione pubblicata e rating aggiornato

---

## 🐛 TROUBLESHOOTING

### Recensione non appare

- Verifica che `is_verified = true`
- Controlla RLS policies
- Verifica che l'utente non stia guardando il proprio profilo

### Errore "Non autorizzato" in verifica

- Verifica che l'utente sia admin dell'istituto
- Controlla tabella `institute_admins`

### Rating non si aggiorna

- Verifica che il trigger sia attivo
- Esegui manualmente: `SELECT update_institute_rating_cache()`
- Controlla colonne `rating_average` e `rating_count` in `user_profiles`

### Form non appare

- Verifica che l'utente sia loggato
- Controlla che non stia guardando il proprio profilo
- Verifica `user_type` in `user_profiles`

---

## 📈 METRICHE E ANALYTICS

### Dashboard Admin

Puoi creare una dashboard con:

```javascript
// Statistiche recensioni ricevute
const stats = await supabase
    .from('institute_reviews')
    .select('rating')
    .eq('reviewed_institute_id', myInstituteId)
    .eq('is_verified', true);

const avgRating = stats.data.reduce((a, b) => a + b.rating, 0) / stats.data.length;
const totalReviews = stats.data.length;
```

---

## 🚀 FUNZIONALITÀ FUTURE (Opzionali)

- [ ] Risposta istituto a recensioni
- [ ] Segnalazione recensioni inappropriate
- [ ] Filtri recensioni (per rating, data)
- [ ] Paginazione recensioni
- [ ] Export recensioni CSV
- [ ] Email notifica nuova recensione
- [ ] Statistiche avanzate dashboard

---

## ✅ CHECKLIST IMPLEMENTAZIONE

- [ ] Eseguito script SQL
- [ ] Aggiunti file CSS
- [ ] Aggiunti file JS
- [ ] Integrato in profile-page
- [ ] Testato recensione istituto → istituto
- [ ] Testato recensione privato → istituto
- [ ] Testato pannello moderazione
- [ ] Verificato aggiornamento rating automatico
- [ ] Testato modifica/eliminazione recensioni
- [ ] Aggiunto badge notifiche (opzionale)

---

## 📞 SUPPORTO

Per problemi o domande:
1. Verifica console browser per errori JavaScript
2. Controlla log Supabase per errori database
3. Verifica RLS policies attive
4. Testa query SQL manualmente

---

**Sistema Recensioni v1.0**  
Implementato: 3 Novembre 2025  
Compatibile con: EduNet19 v1.0
