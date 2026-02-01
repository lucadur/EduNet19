# 📖 GUIDA COMPLETA AL SISTEMA RECENSIONI

## ✅ INTEGRAZIONE COMPLETATA

Il sistema di recensioni è stato **integrato con successo** nella pagina profilo degli istituti!

---

## 🎯 DOVE TROVARE LE RECENSIONI

### Nel Profilo Istituto

1. Vai sulla pagina **profilo di un istituto**:
   - URL: `profile.html?id=UUID_ISTITUTO`
   - Oppure clicca su un istituto dalla homepage

2. Nella pagina profilo vedrai un **nuovo tab "⭐ Recensioni"**

3. Clicca sul tab per visualizzare:
   - 📊 **Rating Summary** - Media stelle e distribuzione voti
   - ✍️ **Form per lasciare recensione** (se hai i permessi)
   - 👥 **Lista recensioni pubblicate**
   - 🔐 **Pannello Moderazione** (solo se sei admin dell'istituto)

---

## 👤 COME LASCIARE UNA RECENSIONE

### Recensione da Istituto a Istituto

Un istituto può recensire un altro istituto:

1. Vai sul profilo dell'istituto da recensire
2. Clicca tab "Recensioni"
3. Vedrai il form con:
   - ⭐ Stelle (1-5)
   - 💬 Testo recensione
   - 🏷️ Tag (collaborazione, progetto, ecc.)

4. Compila e clicca **"Pubblica Recensione"**
5. ✅ La recensione sarà **subito visibile** (approvata automaticamente)

### Recensione da Privato a Istituto

Un utente privato può recensire un istituto, ma richiede approvazione:

1. Vai sul profilo dell'istituto da recensire
2. Clicca tab "Recensioni"
3. Compila il form recensione
4. Clicca **"Invia Recensione"**
5. ⏳ La recensione va in **stato "in attesa"**
6. ✅ L'admin dell'istituto dovrà approvarla

---

## 🔐 PANNELLO MODERAZIONE (Solo Admin Istituto)

Se sei l'admin di un istituto e vai sul TUO profilo:

1. Vai su `profile.html` (senza parametri, il tuo profilo)
2. Clicca tab "Recensioni"
3. Vedrai il **"Pannello Moderazione"** in alto

### Funzioni Pannello Moderazione

- 📋 Visualizza recensioni **in attesa di approvazione** (solo da privati)
- ✅ **Approva** recensione → diventa pubblica
- ❌ **Rifiuta** recensione → viene rimossa

**Importante**: Le recensioni tra istituti NON richiedono moderazione e sono subito pubbliche.

---

## 📊 RATING SUMMARY

Nella sezione rating summary vedrai:

### 1. Media Generale
```
⭐ 4.5 su 5
(basata su 24 recensioni)
```

### 2. Distribuzione Voti
```
⭐⭐⭐⭐⭐  (15) ████████████████████ 62%
⭐⭐⭐⭐    (6)  ████████░░░░░░░░░░░░ 25%
⭐⭐⭐      (2)  ███░░░░░░░░░░░░░░░░░  8%
⭐⭐        (1)  ██░░░░░░░░░░░░░░░░░░  4%
⭐          (0)  ░░░░░░░░░░░░░░░░░░░░  0%
```

### 3. Statistiche
- **Rating medio:** 4.5/5
- **Totale recensioni:** 24
- **Tasso raccomandazione:** 95%

---

## 🎨 CARATTERISTICHE RECENSIONI

### Cosa Include una Recensione

- **Autore**: Nome e avatar dell'istituto/privato
- **Tipo**: Badge che indica se è istituto o privato
- **Rating**: Stelle da 1 a 5
- **Testo**: Descrizione dell'esperienza
- **Tag**: Categoria (collaborazione, progetto, ecc.)
- **Data**: Quando è stata pubblicata
- **Risposta**: L'istituto può rispondere

### Azioni su Recensioni

**Se sei l'autore della recensione:**
- ✏️ Modifica
- 🗑️ Elimina

**Se sei l'istituto recensito:**
- 💬 Rispondi alla recensione

---

## 🔒 REGOLE E PERMESSI

### Chi Può Recensire

| Tipo Utente | Può Recensire Istituti | Richiede Approvazione |
|-------------|------------------------|----------------------|
| **Istituto** | ✅ Sì | ❌ No (pubblico subito) |
| **Privato** | ✅ Sì | ✅ Sì (admin deve approvare) |

### Chi Può Approvare

- Solo l'**admin dell'istituto recensito** può approvare/rifiutare recensioni da privati
- Le recensioni da istituto a istituto sono **sempre pubbliche**

### Limitazioni

- ❌ Non puoi recensire te stesso
- ❌ Non puoi lasciare più di una recensione per istituto
- ✏️ Puoi modificare la tua recensione esistente

---

## 🎯 CASI D'USO PRATICI

### Scenario 1: Istituto A recensisce Istituto B

1. **Istituto A** visita profilo di **Istituto B**
2. Clicca tab "Recensioni"
3. Compila form con 5 stelle e testo: *"Ottima collaborazione sul progetto STEM!"*
4. Clicca "Pubblica"
5. ✅ Recensione appare subito nella lista

### Scenario 2: Utente Privato recensisce Istituto

1. **Mario Rossi** (privato) visita profilo **Liceo Scientifico**
2. Clicca tab "Recensioni"
3. Compila form con 4 stelle e testo
4. Clicca "Invia Recensione"
5. ⏳ Appare messaggio: *"Recensione inviata! In attesa di approvazione."*
6. **Admin Liceo** apre il suo profilo → Tab Recensioni → Pannello Moderazione
7. Vede recensione di Mario in lista "In attesa"
8. Clicca ✅ **"Approva"**
9. ✅ La recensione diventa pubblica

### Scenario 3: Admin Modera Recensioni

1. **Admin Istituto** apre `profile.html` (suo profilo)
2. Clicca tab "Recensioni"
3. Vede pannello "Recensioni in Attesa di Approvazione"
4. 3 recensioni da privati in sospeso:
   - Recensione 1: ✅ Approva
   - Recensione 2: ❌ Rifiuta (spam)
   - Recensione 3: ✅ Approva

---

## 🗄️ STRUTTURA DATABASE

Il sistema utilizza queste tabelle:

### `institute_reviews`
- `id` - UUID univoco
- `reviewer_id` - Chi ha scritto la recensione
- `reviewed_institute_id` - Istituto recensito
- `reviewer_type` - 'institute' o 'private'
- `rating` - Stelle (1-5)
- `review_text` - Testo recensione
- `review_type` - Tag/categoria
- `is_verified` - true/false (approvata o no)
- `response_text` - Risposta dell'istituto
- `created_at` - Data creazione

### `user_profiles`
- `rating_avg` - Media rating
- `rating_count` - Numero recensioni
- `rating_distribution` - Distribuzione stelle (JSONB)

---

## 🚀 FUNZIONI SQL DISPONIBILI

### 1. `get_institute_rating(institute_id)`
Ottiene statistiche complete rating:
```sql
SELECT * FROM get_institute_rating('uuid-istituto');
```

Ritorna:
- `avg_rating` - Media
- `total_reviews` - Totale recensioni
- `star_1` - Conteggio 1 stella
- `star_2` - Conteggio 2 stelle
- ... fino a 5 stelle

### 2. `submit_institute_review(...)`
Invia una nuova recensione:
```sql
SELECT * FROM submit_institute_review(
  reviewer_id := 'uuid-reviewer',
  reviewed_institute_id := 'uuid-istituto',
  reviewer_type := 'institute', -- o 'private'
  rating := 5,
  review_text := 'Ottima esperienza!',
  review_type := 'collaboration'
);
```

### 3. `approve_review(review_id, admin_id)`
Approva una recensione (solo admin):
```sql
SELECT * FROM approve_review('uuid-review', 'uuid-admin');
```

### 4. `reject_review(review_id, admin_id)`
Rifiuta una recensione (solo admin):
```sql
SELECT * FROM reject_review('uuid-review', 'uuid-admin');
```

---

## 🎨 FILE CSS INCLUSI

### `institute-reviews.css`
- Stili per rating summary
- Stili per form recensione
- Stili per lista recensioni
- Stili per stelle e badge

### `review-moderation.css`
- Stili per pannello moderazione
- Stili per pulsanti approva/rifiuta
- Stili per stati (pending, approved, rejected)

---

## 📱 RESPONSIVE

Il sistema recensioni è completamente **responsive**:

- 📱 **Mobile**: Layout verticale, font più grandi
- 💻 **Tablet**: Layout adattivo
- 🖥️ **Desktop**: Layout completo con sidebar

---

## ✅ CHECKLIST VERIFICA

Verifica che tutto funzioni:

- [ ] Il tab "Recensioni" appare nel profilo istituto
- [ ] Il badge contatore mostra il numero recensioni (se > 0)
- [ ] Il rating summary mostra media e distribuzione
- [ ] Il form recensione appare (se hai permessi)
- [ ] Puoi inviare una recensione
- [ ] Le recensioni appaiono nella lista
- [ ] Il pannello moderazione appare (se sei admin)
- [ ] Puoi approvare/rifiutare recensioni (se admin)

---

## 🐛 TROUBLESHOOTING

### Non vedo il tab Recensioni
- ✅ Verifica di essere su un profilo **istituto** (non privato)
- ✅ Controlla che `profile.html` sia aggiornato
- ✅ Pulisci cache browser (Ctrl+F5)

### Non vedo il form recensione
- ✅ Verifica di essere loggato
- ✅ Non puoi recensire te stesso
- ✅ Puoi lasciare solo 1 recensione per istituto

### Pannello moderazione non appare
- ✅ Devi essere l'admin dell'istituto
- ✅ Devi essere sul TUO profilo (non quello altrui)
- ✅ Ci devono essere recensioni da privati in attesa

### Recensione non appare subito
- ✅ Se sei **privato**: serve approvazione admin
- ✅ Se sei **istituto**: dovrebbe apparire subito
- ✅ Ricarica la pagina (F5)

---

## 🎓 ESEMPI CODICE

### Inizializzare il Sistema Recensioni (già fatto in profile-page.js)

```javascript
// Nel metodo loadReviews() di profile-page.js
await window.reviewsManager.init(profileId);
```

### Ascoltare Eventi Recensioni

```javascript
// Dopo approvazione/rifiuto recensione
document.addEventListener('review-approved', (e) => {
  console.log('Recensione approvata:', e.detail);
});

document.addEventListener('review-rejected', (e) => {
  console.log('Recensione rifiutata:', e.detail);
});
```

---

## 🌟 PROSSIMI MIGLIORAMENTI

Funzionalità future da considerare:

- 📧 **Notifiche email** quando ricevi una recensione
- 🔔 **Notifiche in-app** per nuove recensioni
- 📊 **Dashboard analytics** con grafici rating
- 🏆 **Badge "Top Rated"** per istituti con rating alto
- 🔍 **Filtri recensioni** (per rating, data, tipo)
- 📄 **Paginazione** per tante recensioni
- 💬 **Thread risposte** per conversazioni
- 👍 **Like alle recensioni** utili

---

## 📞 SUPPORTO

Per problemi o domande sul sistema recensioni:

1. Controlla questa guida
2. Verifica la console browser (F12) per errori
3. Controlla i log Supabase

---

## 🎉 CONCLUSIONE

Il **sistema di recensioni è ora completamente funzionale**!

Gli istituti possono:
- ⭐ Recensirsi reciprocamente
- 💬 Ricevere recensioni da privati
- 🔐 Moderare recensioni in entrata
- 📊 Vedere statistiche rating

Buon utilizzo! 🚀

