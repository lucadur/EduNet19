# 🔒 Restrizioni Utenti Privati - Riepilogo Modifiche

## Data: 27 Novembre 2025

## Modifiche Implementate

### I. Gestione Utenti (Privati vs. Istituti)

#### 1. Commenti Privati ❌ BLOCCATI
- **File**: `js/social/social-features.js` (già presente)
- **File**: `js/utils/homepage-script.js` (funzione `renderCommentForm`)
- Il form dei commenti è **completamente nascosto** per gli utenti privati
- Gli utenti privati possono solo leggere i commenti, non scriverne

#### 2. Bacheca/Post Privati ❌ BLOCCATI
- **File**: `js/social/social-features.js` (già presente)
- **File**: `js/utils/homepage-script.js` (funzione `setupUserTypeSpecificUI`)
- **File**: `js/profile/profile-page.js` (aggiunta funzione `updateTabsVisibility`)
- Gli utenti privati non possono creare post
- I tab "Posts" e "Progetti" sono nascosti nel profilo degli utenti privati
- Il tab "Info" diventa il default per i profili privati

#### 3. RLS Policy Database
- **File**: `database/fixes/restrict-private-users-permissions.sql`
- Creata funzione `is_institute_user()` per verificare il tipo utente
- Policy RLS per `post_comments`: solo istituti possono inserire
- Policy RLS per `institute_posts`: solo istituti possono inserire
- Policy per `saved_posts`: tutti possono salvare (mantenuta)

### III. Funzionalità di Ricerca e Privacy

#### 1. Ricerca Studente ❌ DISABILITATA
- **File**: `js/utils/homepage-script.js` - funzione `performSearch`
- **File**: `js/utils/global-search.js` (già disabilitata)
- **File**: `js/utils/mobile-search.js` (già disabilitata)
- **File**: `js/utils/create-page.js` (corretta)
- **File**: `js/profile/profile-management.js` - funzione `searchProfiles` (CORRETTA)
- Gli utenti privati non appaiono più nei risultati di ricerca
- Istituti con nomi "sospetti" (senza codice meccanografico e senza parole chiave scuola) vengono filtrati
- Log: "🔒 Utente privato escluso dalla ricerca per privacy"
- Log: "🔒 Istituto escluso dalla ricerca (nome sospetto)"

#### 2. Ricerca Contenuti ✅ MANTENUTA
- Gli utenti privati possono ancora cercare:
  - Istituti
  - Post/Progetti/Metodologie
- Possono salvare i contenuti di interesse

### IV. Testi Onboarding
- **File**: `index.html`
- Il testo era già corretto: "Scuole dell'Infanzia, Primarie, Secondarie (Medie e Superiori), Università e ITS"

## File Modificati

1. `js/utils/homepage-script.js`
   - Aggiunta funzione `renderCommentForm()`
   - Modificata ricerca per escludere utenti privati

2. `js/profile/profile-page.js`
   - Aggiunta funzione `updateTabsVisibility()`
   - Nasconde tab Posts/Progetti per utenti privati

3. `css/components/homepage-styles.css`
   - Aggiunto stile `.comment-form-disabled`
   - Aggiunto stile `.comment-restriction-notice`

4. `database/fixes/restrict-private-users-permissions.sql` (NUOVO)
   - Script SQL per le policy RLS

## Azioni Richieste

### ⚠️ ESEGUIRE SU SUPABASE:
```sql
-- Esegui il contenuto di:
-- database/fixes/restrict-private-users-permissions.sql
```

## Riepilogo Permessi

| Funzionalità | Utente Privato | Istituto |
|--------------|----------------|----------|
| Leggere post | ✅ | ✅ |
| Creare post | ❌ | ✅ |
| Commentare | ❌ | ✅ |
| Mettere like | ✅ | ✅ |
| Salvare post | ✅ | ✅ |
| Essere cercato | ❌ | ✅ |
| Cercare contenuti | ✅ | ✅ |
| Tab Posts nel profilo | ❌ | ✅ |
| Tab Progetti nel profilo | ❌ | ✅ |
| Tab Galleria nel profilo | ❌ | ✅ |
| Tab Recensioni nel profilo | ❌ | ✅ |
| Stat Card Post | ❌ | ✅ |
| Stat Card Progetti | ❌ | ✅ |
| Stat Card Follower | ❌ | ✅ |
| Stat Card Seguiti | ✅ | ✅ |
| Lasciare recensioni (stelle) | ✅ | ❌ |

---

## Aggiornamento 27 Novembre 2025 - UI Profilo

### V. Modifiche Pagina Profilo (profile.html)

#### 1. Stat Cards
- **File**: `pages/profile/profile.html`
- Per utenti privati: visibile SOLO la card "Seguiti"
- Nascoste: Post, Progetti, Follower
- La card "Seguiti" viene centrata quando è l'unica visibile

#### 2. Tab del Profilo
- **File**: `js/profile/profile-page.js` - funzione `updateTabsVisibility()`
- Per utenti privati nascosti: Posts, Progetti, Galleria, Recensioni
- Visibile solo: Info
- Il tab Info diventa il default per utenti privati

#### 3. Sezione Info (About Tab)
- **File**: `pages/profile/profile.html`
- Sezioni separate per istituti e utenti privati
- Utenti privati vedono: Presentazione + Info Box esplicativa
- Istituti vedono: Tipo, Email, Telefono, Indirizzo, Metodologie, Interessi

### VI. Modifiche Pagina Modifica Profilo (edit-profile.html)

#### 1. Form Differenziato
- **File**: `pages/profile/edit-profile.html`
- **File**: `js/profile/edit-profile.js` - funzione `adjustFormForUserType()`
- Istituti: tutti i campi (Nome, Tipo, Bio, Contatti, Metodologie, Social)
- Utenti Privati: solo Nome, Cognome, Presentazione
- Info Box esplicativa per utenti privati

#### 2. Titolo Pagina Dinamico
- Istituti: "Modifica Profilo Istituto"
- Utenti Privati: "Modifica Profilo"

### VII. Stili CSS Tema Scuro
- **File**: `css/components/auth-modal-dark-theme.css`
- Aggiunti stili per info-box utenti privati
- Stili per sezioni About private
- Supporto tema scuro completo

## File Modificati (Aggiornamento)

5. `pages/profile/profile.html`
   - Stat cards con classi `institute-only-stat`
   - Sezioni About separate per istituti/privati
   - Info box per utenti privati

6. `pages/profile/edit-profile.html`
   - Form con sezioni `institute-only` e `private-only`
   - Campi semplificati per utenti privati
   - Info box esplicativa

7. `js/profile/profile-page.js`
   - Funzione `updateTabsVisibility()` estesa
   - Gestione stat cards per tipo utente
   - Funzione `updateAboutTab()` con supporto tipo utente

8. `js/profile/edit-profile.js`
   - Funzione `adjustFormForUserType()` migliorata
   - Titolo pagina dinamico

9. `css/components/auth-modal-dark-theme.css`
   - Stili info-box utenti privati
   - Stili sezioni About private
