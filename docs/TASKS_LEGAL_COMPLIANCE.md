# 📋 TASKS - Funzionalità Legali da Implementare

Questo documento elenca le funzionalità menzionate nella Privacy Policy e nei Termini di Servizio che devono ancora essere implementate nel codice.

---

## 🔴 PRIORITÀ CRITICA (Conformità Legale Obbligatoria)

### 1. Sistema Verifica Età e Consenso Parentale
**Riferimento:** Privacy Policy §4.2, Terms §3.1, §6.1

- [x] **Campo data di nascita obbligatorio** nella registrazione ✅ (index.html)
- [x] **Calcolo automatico età** e blocco registrazione < 14 anni ✅ (js/auth/age-verification.js)
- [x] **Flusso consenso parentale 14-16 anni:**
  - [x] Campo email genitore durante registrazione ✅ (index.html)
  - [x] Invio email automatica al genitore con link di conferma ✅ (js/auth/auth.js - TODO: integrazione email service)
  - [x] Link con scadenza 48 ore ✅ (auth.js)
  - [x] Account in stato "pending" fino a conferma ✅ (auth.js)
  - [x] Pagina di conferma consenso per genitore ✅ (pages/legal/parental-consent.html)
- [x] **Dichiarazione consenso 16-18 anni:**
  - [x] Checkbox dichiarazione consenso parentale ✅ (index.html)
  - [x] Testo legale da accettare ✅ (index.html)

### 2. Sistema Segnalazione Contenuti
**Riferimento:** Privacy Policy §4.5, Terms §5.3, §6.3

- [x] **Pulsante "Segnala"** su ogni post/commento/messaggio ✅ (già presente in homepage-script.js)
- [x] **Modal segnalazione** con categorie: ✅ (js/moderation/content-report.js)
  - Cyberbullismo ✅
  - Contenuto inappropriato ✅
  - Spam ✅
  - Violazione privacy ✅
  - Molestie/minacce ✅
  - Informazioni false ✅
  - Altro ✅
- [x] **Tabella database `content_reports`** per tracciare segnalazioni ✅ (già esistente)
- [ ] **Email automatica conferma** ricezione segnalazione (entro 2h) - TODO: integrazione email service
- [x] **Dashboard moderazione** per gestire segnalazioni ✅ (pages/admin/moderation.html)

### 3. Impostazioni Privacy per Minori
**Riferimento:** Privacy Policy §4.4

- [x] **Profilo privato di default** per utenti < 18 anni ✅ (auth.js - privacy_level: 'privato' per minori)
- [ ] **Limitazione messaggi** solo da utenti verificati/istituti per minori - TODO
- [ ] **Filtro contenuti** automatico per linguaggio inappropriato - TODO
- [x] **Flag `is_minor`** nel database utenti ✅ (colonna già presente in private_users)

---

## 🟡 PRIORITÀ ALTA (Raccomandato per Compliance)

### 4. Sezione "Privacy e Dati" nelle Impostazioni
**Riferimento:** Privacy Policy §10.1

- [ ] **Pagina impostazioni privacy** (`/pages/settings/privacy.html`)
- [ ] **Funzione "Scarica i miei dati"** (export JSON/CSV)
- [ ] **Funzione "Elimina Account"** con:
  - [ ] Conferma password
  - [ ] Periodo di ripensamento 30 giorni
  - [ ] Email conferma cancellazione
- [ ] **Gestione consensi** (marketing, analytics)
- [ ] **Storico accessi** all'account

### 5. Sistema Eliminazione Account
**Riferimento:** Privacy Policy §9.3, Terms §11.1

- [ ] **Soft delete** con flag `deleted_at` e `deletion_scheduled_at`
- [ ] **Job schedulato** per cancellazione definitiva dopo 30 giorni
- [ ] **Funzione recupero account** entro 30 giorni
- [ ] **Anonimizzazione contenuti** invece di cancellazione (opzionale)

### 6. Autenticazione a Due Fattori (MFA)
**Riferimento:** Privacy Policy §5.1

- [ ] **Opzione MFA** nelle impostazioni sicurezza
- [ ] **Supporto TOTP** (Google Authenticator, Authy)
- [ ] **Codici di backup** per recupero

### 7. Session Timeout
**Riferimento:** Privacy Policy §5.1

- [ ] **Logout automatico** dopo 30 minuti di inattività
- [ ] **Warning** prima del logout (5 minuti)
- [ ] **Estensione sessione** su attività utente

---

## 🟢 PRIORITÀ MEDIA (Best Practice)

### 8. Sistema Moderazione Completo
**Riferimento:** Terms §5.3

- [x] **Dashboard admin moderazione** (`/pages/admin/moderation.html`) ✅
- [x] **Stati segnalazione:** pending, reviewing, resolved, dismissed ✅
- [x] **Azioni moderatore:**
  - [x] Avviso utente ✅
  - [x] Rimozione contenuto (delete) ✅
  - [x] Shadowban contenuto ✅
  - [x] Sospensione temporanea (24h, 7gg, 30gg) ✅
  - [x] Ban permanente ✅
- [x] **Sistema appello** per utenti sospesi ✅
- [x] **Log azioni moderazione** per audit ✅
- [x] **Notifiche utente** per azioni di moderazione ✅ (js/moderation/user-notifications.js)
- [x] **Modal ricorso** integrato nelle notifiche ✅
- [x] **Sync automatico silenzioso** ogni 30 secondi ✅
- [x] **Form login admin dedicato** per Centro Moderazione ✅

### 9. Notifiche Email Automatiche
**Riferimento:** Privacy Policy §12, Terms §10

- [ ] **Email modifica Privacy Policy** (15 giorni prima)
- [ ] **Email modifica Termini** (15 giorni prima)
- [ ] **Email conferma registrazione**
- [ ] **Email reset password**
- [ ] **Email segnalazione ricevuta**
- [ ] **Email azione moderazione**

### 10. Banner Cookie Consent
**Riferimento:** Cookie Policy

- [ ] **Banner cookie** al primo accesso
- [ ] **Gestione preferenze cookie** (tecnici vs analytics)
- [ ] **Salvataggio preferenze** in localStorage/cookie

### 11. Pagina Richiesta GDPR
**Riferimento:** Privacy Policy §10.1

- [ ] **Form richiesta GDPR** (`/pages/gdpr-request.html`)
- [ ] **Selezione tipo richiesta:**
  - Accesso dati
  - Rettifica
  - Cancellazione
  - Portabilità
  - Opposizione
- [ ] **Verifica identità** prima di processare
- [ ] **Tracking richieste** con tempistiche

---

## 🔵 PRIORITÀ BASSA (Nice to Have)

### 12. Report Trasparenza Moderazione
**Riferimento:** Terms §5.3

- [ ] **Pagina report pubblico** semestrale
- [ ] **Statistiche aggregate:**
  - Segnalazioni ricevute
  - Contenuti rimossi
  - Account sospesi
  - Tempo medio risposta

### 13. Centro Assistenza Genitori
**Riferimento:** Privacy Policy §4.3

- [ ] **Sezione dedicata genitori** (`/pages/parents/`)
- [ ] **Guida controllo parentale**
- [ ] **Form contatto genitori** (genitori@edunet19.it)

### 14. Integrazione Telefono Azzurro
**Riferimento:** Privacy Policy §4.5

- [ ] **Link/banner Telefono Azzurro** (19696) in caso di cyberbullismo
- [ ] **Risorse supporto psicologico** nella pagina segnalazione

---

## 📊 Tabelle Database - STATO

✅ **TUTTE LE TABELLE SONO STATE CREATE:**

- ✅ `parental_consents` - Consenso parentale per minori
- ✅ `content_reports` - Segnalazioni contenuti (con colonne category, priority)
- ✅ `moderation_actions` - Azioni di moderazione
- ✅ `gdpr_requests` - Richieste GDPR
- ✅ `private_users` - Colonne aggiunte: `is_minor`, `parental_consent_required`, `parental_consent_verified`, `account_status`, `deletion_scheduled_at`, `privacy_settings`, `birth_date`

---

## ✅ Funzionalità Già Implementate

- [x] Verifica istituti tramite codice MIUR
- [x] Sistema di autenticazione base (Supabase Auth)
- [x] Profili istituto e privati
- [x] Sistema post e commenti
- [x] EduMatch per networking istituti
- [x] Tema chiaro/scuro
- [x] Privacy Policy completa (v2.0)
- [x] Termini di Servizio completi
- [x] Cookie Policy
- [x] **Sistema verifica età** (js/auth/age-verification.js)
- [x] **Consenso parentale 14-16 anni** (form + pagina conferma)
- [x] **Dichiarazione consenso 16-18 anni** (checkbox)
- [x] **Sistema segnalazione contenuti** con categorie (js/moderation/content-report.js)
- [x] **Tabelle database compliance** (parental_consents, gdpr_requests, moderation_actions)

---

## 📅 Timeline Suggerita

| Fase | Tasks | Stato |
|------|-------|-------|
| **Fase 1** | Verifica età, consenso parentale, segnalazioni | ✅ COMPLETATA |
| **Fase 2** | Impostazioni privacy, eliminazione account | 🔄 In corso |
| **Fase 3** | MFA, session timeout, moderazione | ⏳ Da fare |
| **Fase 4** | Email automatiche, cookie banner, GDPR form | ⏳ Da fare |
| **Fase 5** | Report trasparenza, centro genitori | ⏳ Da fare |

---

## 📁 File Creati/Modificati in questa sessione

### Nuovi file:
- `js/auth/age-verification.js` - Gestione verifica età e consenso
- `js/moderation/content-report.js` - Modal segnalazione contenuti con categorie
- `pages/legal/parental-consent.html` - Pagina conferma consenso parentale

### File modificati:
- `index.html` - Aggiunto campo data nascita, sezione consenso parentale, checkbox 16-18
- `js/auth/auth.js` - Logica verifica età e creazione richiesta consenso parentale
- `css/components/auth-modal-dark-theme.css` - Stili per nuovi elementi form
- `homepage.html` - Aggiunto script content-report.js
- `js/utils/homepage-script.js` - Integrazione modal segnalazione

### Centro Moderazione (nuova sessione):
- `pages/admin/moderation.html` - Dashboard completa moderazione
- `css/admin/moderation.css` - Stili dashboard moderazione
- `js/admin/moderation-center.js` - Logica gestione segnalazioni, azioni, appelli, GDPR
- `js/moderation/user-notifications.js` - Sistema notifiche utente per azioni moderazione con ricorso

---

*Ultimo aggiornamento: 4 Dicembre 2024*
