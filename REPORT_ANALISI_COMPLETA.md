# Report Analisi Completa Codebase - EduNet19

**Data:** 5 Febbraio 2026  
**Analisi eseguita su:** Struttura completa del progetto

---

## 1. Panoramica Progetto

EduNet19 è una piattaforma social network educativa per scuole italiane, composta da:
- **2 pagine principali**: `index.html` (landing page) e `homepage.html` (dashboard)
- **15 sotto-pagine**: profilo, impostazioni, admin, moderazione, legal, ecc.
- **53 file JavaScript** organizzati in moduli (auth, profile, social, utils, admin, recommendations)
- **34 file CSS** componente-based
- **Backend**: Supabase (autenticazione, database, storage)
- **Tema**: Sistema chiaro/scuro con preferenze salvate in localStorage

---

## 2. BUG CRITICI TROVATI E CORRETTI

### BUG 1 — Default tema "light" invece di "dark" ✅ CORRETTO
**Gravità: ALTA**

Il tema di default era impostato su `'light'` in 4 posti diversi. Tutti sono stati corretti a `'dark'`:

| File | Riga | Prima | Dopo |
|------|------|-------|------|
| `js/utils/preference-loader.js` | 12 | `theme: 'light'` | `theme: 'dark'` |
| `js/profile/settings-page.js` | 489 | `theme: 'light'` | `theme: 'dark'` |
| `pages/profile/settings.html` | 537 | `<option value="light" selected>` | `<option value="dark" selected>` |
| `config.js` | 100 | Nessun default (no-op se nessun setting salvato) | `{ theme: 'dark' }` come fallback |

### BUG 2 — `index.html` mancava `preference-loader.js` ✅ CORRETTO
**Gravità: ALTA**

La landing page (`index.html`) non includeva `preference-loader.js` nel `<head>`. Questo significava che:
- Nessuna preferenza veniva applicata prima del rendering
- Flash di contenuto non stilizzato (FOUC) garantito
- L'utente vedeva sempre il tema chiaro sulla landing page

**Fix:** Aggiunto `<script src="js/utils/preference-loader.js"></script>` prima degli altri script.

### BUG 3 — `moderation-center.js` usava chiave localStorage sbagliata ✅ CORRETTO
**Gravità: MEDIA**

Il centro moderazione usava `localStorage.getItem('theme')` invece della chiave unificata `'edunet_settings'`. Questo causava:
- Il tema scelto nelle impostazioni NON si applicava alla pagina moderazione
- Il tema scelto in moderazione NON si sincronizzava con le altre pagine
- Due fonti di verità separate per la stessa preferenza

**Fix:** Riscritto `setupTheme()` per usare `'edunet_settings'` con default `'dark'`.

---

## 3. BUG E PROBLEMI ANCORA PRESENTI (da valutare)

### BUG 4 — `preference-loader.js` mancante in 10 pagine
**Gravità: MEDIA**

Queste pagine NON includono `preference-loader.js` e avranno un flash di tema chiaro prima che `config.js` (con defer) applichi il tema scuro:

| Pagina | Ha `config.js`? | Ha `dark-theme-fixes.css`? |
|--------|----------------|---------------------------|
| `pages/profile/edit-profile.html` | ✅ Sì (defer) | ✅ Sì |
| `pages/admin/moderation.html` | ✅ Sì (sync) | ✅ Sì |
| `pages/admin/manage-admins.html` | ✅ Sì (sync) | ❌ No |
| `pages/admin/accept-invite.html` | ✅ Sì (sync) | ❌ No |
| `pages/auth/reset-password.html` | ✅ Sì (defer) | ❌ No |
| `pages/auth/verify-institute.html` | ✅ Sì (defer) | ❌ No |
| `pages/profile/accept-invite.html` | ❌ No | ❌ No |
| `pages/legal/cookie-policy.html` | ❌ No | ✅ Sì |
| `pages/legal/privacy-policy.html` | ❌ No | ✅ Sì |
| `pages/legal/terms-of-service.html` | ❌ No | ✅ Sì |

**Le 3 pagine legal** (cookie, privacy, terms) non hanno NÉ `config.js` NÉ `preference-loader.js`, quindi il tema scuro **non verrà mai attivato** su di esse, anche se il CSS per il dark theme è caricato.

**Raccomandazione:** Aggiungere `<script src="../../js/utils/preference-loader.js"></script>` nel `<head>` di tutte queste pagine.

### BUG 5 — File CSS referenziato inesistente
**Gravità: BASSA**

`pages/legal/parental-consent.html` referenzia `../../css/pages/legal-pages.css` ma la directory `css/pages/` è **completamente vuota**. Il file non esiste → errore 404 silenzioso nel browser.

### BUG 6 — Versioni Font Awesome inconsistenti
**Gravità: BASSA**

7 pagine usano Font Awesome **6.4.0** mentre 9 pagine usano **6.5.1**:
- **6.4.0**: `accept-invite.html` (admin), `manage-admins.html`, `verify-institute.html`, `cookie-policy.html`, `privacy-policy.html`, `terms-of-service.html`, `connections.html`
- **6.5.1**: tutte le altre pagine principali

Questo potrebbe causare icone mancanti o differenze visive tra pagine.

### BUG 7 — Logica duplicata per applicazione preferenze
**Gravità: MEDIA (manutenibilità)**

Esistono **3 implementazioni separate** della stessa logica di applicazione tema:

1. `js/utils/preference-loader.js` — Loader nel `<head>`, applica su `<html>` e `<body>`
2. `config.js` (righe 91-137) — Loader duplicato, applica solo su `<body>`
3. `js/profile/settings-page.js` `applyTheme()` — Metodo della classe, applica solo su `<body>`

Se in futuro si deve modificare la logica del tema, bisogna farlo in 3 posti diversi.

### BUG 8 — `favicon.ico` è un file vuoto (0 bytes)
**Gravità: BASSA**

Il file `favicon.ico` esiste ma ha dimensione 0 bytes. I browser che non supportano SVG favicon mostreranno un'icona vuota/rotta.

---

## 4. PROBLEMI DI ARCHITETTURA E MANUTENIBILITÀ

### 4.1 — File JS molto grandi
Alcuni file JavaScript sono estremamente grandi e difficili da mantenere:

| File | Dimensione | Note |
|------|-----------|------|
| `js/utils/homepage-script.js` | **160 KB** | Troppo grande per un singolo file |
| `js/auth/auth.js` | **80 KB** | Gestisce registrazione, login, 2FA, tutto insieme |
| `js/profile/profile-page.js` | **76 KB** | Un singolo file per tutta la pagina profilo |
| `js/profile/settings-page.js` | **61 KB** | Include tutta la logica impostazioni |
| `js/profile/collaborators.js` | **46 KB** | Gestione collaboratori completa |

**Raccomandazione:** Considerare il refactoring dei file più grandi in moduli più piccoli e specifici.

### 4.2 — Nessun bundler o minificazione
Il progetto carica tutti i file JS/CSS singolarmente con `<script>` tags. In produzione:
- **homepage.html** carica ~20 script separati
- **index.html** carica ~15 script separati
- Nessuna minificazione, nessun tree-shaking
- Le dimensioni totali CSS sono ~500 KB+

### 4.3 — CSS component files molto grandi
| File | Dimensione |
|------|-----------|
| `css/components/homepage-styles.css` | **118 KB** |
| `css/components/profile-page.css` | **62 KB** |
| `styles.css` (principale) | **41 KB** |
| `css/components/recommendation-ui.css` | **27 KB** |
| `css/components/auth-modal-dark-theme.css` | **26 KB** |

### 4.4 — Colori hardcoded in stili inline HTML
Diverse pagine hanno colori hardcoded negli stili inline (es. `background: white`, `color: #2c3e50`) che non rispettano il tema scuro:
- `pages/auth/reset-password.html` — `.reset-container { background: white }`, `.reset-header h1 { color: #2c3e50 }`
- `pages/auth/verify-institute.html` — `.verify-card { background: white }`
- `pages/profile/accept-invite.html` — `.invite-container { background: white }`

Questi elementi rimarranno bianchi anche in dark mode.

### 4.5 — Directory vuote
- `css/mobile/` — directory vuota, non utilizzata
- `css/pages/` — directory vuota, file referenziato mancante (vedi BUG 5)

---

## 5. SICUREZZA

### 5.1 — CSP (Content Security Policy)
`index.html` e `homepage.html` includono CSP via meta tag, ma:
- Usano `'unsafe-inline'` e `'unsafe-eval'` per gli script — questo riduce significativamente l'efficacia della CSP
- Le altre pagine (admin, legal, ecc.) **non hanno CSP**

### 5.2 — Chiave Supabase nel codice
La `anonKey` di Supabase è nel file `config.js` che è pubblico. Questo è **normale e previsto** per la chiave anonima (pubblica), ma è importante che le Row Level Security (RLS) policies siano ben configurate in Supabase.

---

## 6. PERFORMANCE

### 6.1 — Caricamento script
- `preference-loader.js` è correttamente senza `defer` (deve eseguire subito)
- `config.js` usa `defer` in `index.html` e `homepage.html`, ma è caricato **sincrono** in `moderation.html`, `manage-admins.html`, `accept-invite.html` — inconsistenza
- Supabase JS è caricato senza `defer` in diverse pagine admin

### 6.2 — Preconnect
Solo `index.html` e `homepage.html` hanno i tag `<link rel="preconnect">` per fonts e CDN. Le altre pagine no.

---

## 7. RIEPILOGO COMPLETO MODIFICHE EFFETTUATE

### Fase 1 — Default Dark Mode (6 file)

| # | File Modificato | Modifica |
|---|----------------|----------|
| 1 | `js/utils/preference-loader.js` | Default tema → `'dark'` |
| 2 | `js/profile/settings-page.js` | Default tema in `loadDefaultSettings()` → `'dark'` |
| 3 | `pages/profile/settings.html` | `selected` spostato da "Chiaro" a "Scuro" nel dropdown |
| 4 | `config.js` | Loader globale ora default a `'dark'` anche senza settings salvati |
| 5 | `index.html` | Aggiunto `preference-loader.js` nel `<head>` (era assente) |
| 6 | `js/admin/moderation-center.js` | Migrato da `localStorage('theme')` a `localStorage('edunet_settings')` con default `'dark'` |

### Fase 2 — Preference Loader su tutte le pagine (11 file)

| # | File Modificato | Modifica |
|---|----------------|----------|
| 7 | `pages/profile/edit-profile.html` | Aggiunto `preference-loader.js` nel `<head>` |
| 8 | `pages/admin/moderation.html` | Aggiunto `preference-loader.js` nel `<head>` |
| 9 | `pages/admin/manage-admins.html` | Aggiunto `preference-loader.js` nel `<head>` |
| 10 | `pages/admin/accept-invite.html` | Aggiunto `preference-loader.js` nel `<head>` |
| 11 | `pages/auth/reset-password.html` | Aggiunto `preference-loader.js` nel `<head>` |
| 12 | `pages/auth/verify-institute.html` | Aggiunto `preference-loader.js` nel `<head>` |
| 13 | `pages/profile/accept-invite.html` | Aggiunto `preference-loader.js` nel `<head>` |
| 14 | `pages/legal/cookie-policy.html` | Aggiunto `preference-loader.js` nel `<head>` |
| 15 | `pages/legal/privacy-policy.html` | Aggiunto `preference-loader.js` nel `<head>` |
| 16 | `pages/legal/terms-of-service.html` | Aggiunto `preference-loader.js` nel `<head>` |
| 17 | `pages/legal/parental-consent.html` | Aggiunto `preference-loader.js` nel `<head>` |

### Fase 3 — Dark Mode per stili inline hardcoded (5 file)

| # | File Modificato | Modifica |
|---|----------------|----------|
| 18 | `pages/auth/reset-password.html` | Aggiunti override `.dark-theme` per tutti i colori hardcoded (container, input, labels, requirements) |
| 19 | `pages/profile/accept-invite.html` | Aggiunti override `.dark-theme` per container, form, tabs, info-box, labels, input |
| 20 | `css/components/accept-invite.css` | Aggiunti override `.dark-theme` per `.invite-card`, `.role-info`, `.invite-note` |
| 21 | `pages/auth/verify-institute.html` | Rimosso codice inline broken (`settings.darkTheme` → proprietà inesistente), ora gestito da preference-loader |

### Fase 4 — Riferimento CSS rotto (1 file)

| # | File Modificato | Modifica |
|---|----------------|----------|
| 22 | `pages/legal/parental-consent.html` | Sostituito riferimento a `css/pages/legal-pages.css` (inesistente) con `css/components/dark-theme-fixes.css` |

### Fase 5 — Unificazione Font Awesome 6.5.1 (7 file)

| # | File Modificato | Modifica |
|---|----------------|----------|
| 23 | `pages/admin/accept-invite.html` | FA 6.4.0 → 6.5.1 + SRI hash |
| 24 | `pages/admin/manage-admins.html` | FA 6.4.0 → 6.5.1 + SRI hash |
| 25 | `pages/auth/verify-institute.html` | FA 6.4.0 → 6.5.1 + SRI hash |
| 26 | `pages/profile/connections.html` | FA 6.4.0 → 6.5.1 + SRI hash |
| 27 | `pages/legal/cookie-policy.html` | FA 6.4.0 → 6.5.1 + SRI hash |
| 28 | `pages/legal/privacy-policy.html` | FA 6.4.0 → 6.5.1 + SRI hash |
| 29 | `pages/legal/terms-of-service.html` | FA 6.4.0 → 6.5.1 + SRI hash |

### Fase 6 — Rimozione logica duplicata (1 file)

| # | File Modificato | Modifica |
|---|----------------|----------|
| 30 | `config.js` | Rimossa IIFE duplicata per applicazione preferenze (ora gestita esclusivamente da `preference-loader.js`) |

### Fase 7 — Preconnect tags per performance (7 file)

| # | File Modificato | Modifica |
|---|----------------|----------|
| 31 | `pages/main/create.html` | Aggiunti preconnect per Google Fonts e cdnjs |
| 32 | `pages/auth/reset-password.html` | Aggiunto preconnect per cdnjs |
| 33 | `pages/admin/manage-admins.html` | Aggiunto preconnect per cdnjs |
| 34 | `pages/admin/accept-invite.html` | Aggiunto preconnect per cdnjs |
| 35 | `pages/auth/verify-institute.html` | Aggiunto preconnect per cdnjs |
| 36 | `pages/profile/connections.html` | Aggiunto preconnect per cdnjs |

**Totale: 36 modifiche su 22 file unici**

---

## 8. AZIONI RACCOMANDATE RESIDUE

### Implementate ✅
1. ✅ Aggiunto `preference-loader.js` a tutte le pagine
2. ✅ Sostituiti colori hardcoded inline con override `.dark-theme`
3. ✅ Rimosso riferimento CSS rotto (`css/pages/legal-pages.css`)
4. ✅ Unificata versione Font Awesome a 6.5.1
5. ✅ Rimossa logica duplicata del tema da `config.js`
6. ✅ Aggiunti preconnect tags alle pagine che ne erano prive
7. ✅ Fix chiave localStorage sbagliata in `moderation-center.js`
8. ✅ Fix proprietà inesistente `settings.darkTheme` in `verify-institute.html`

### Da fare manualmente
9. ⬜ Generare un `favicon.ico` valido (attualmente 0 bytes) — richiede strumento esterno
10. ⬜ Rimuovere le directory vuote `css/mobile/` e `css/pages/` — operazione manuale
11. ⬜ Valutare rimozione di `'unsafe-eval'` dalla CSP (richiede test approfonditi con Supabase SDK)

### Miglioramenti futuri (non urgenti)
12. ⬜ Introdurre un bundler (Vite, esbuild) per minificazione e ottimizzazione
13. ⬜ Refactoring dei file JS grandi (>50KB) in moduli più piccoli
