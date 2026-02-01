# 📁 Struttura Progetto EduNet19

## Organizzazione File

Il progetto è stato riorganizzato per una migliore manutenibilità e chiarezza.

### 📂 Struttura Cartelle

```
EduNet19_2/
│
├── 📄 Root Files (File Principali)
│   ├── index.html              # Landing page
│   ├── homepage.html           # Homepage utenti autenticati
│   ├── config.js               # Configurazione Supabase
│   ├── supabase-client.js      # Client Supabase
│   ├── script.js               # Script principale
│   ├── styles.css              # Stili globali
│   ├── README.md               # Documentazione principale
│   └── favicon.ico/svg         # Icone
│
├── 📚 docs/                    # Documentazione
│   ├── guide/                  # Guide utente e implementazione
│   │   ├── 🔐_RIEPILOGO_2FA_DA_COMPLETARE.md
│   │   ├── ⭐_GUIDA_SISTEMA_RECENSIONI.md
│   │   ├── 📚_SISTEMA_MULTI_ADMIN_GUIDA_COMPLETA.md
│   │   ├── 📚_GUIDA_VERIFICA_ISTITUTI.md
│   │   ├── 📊_ANALISI_STATO_PROGETTO_EDUNET19.md
│   │   ├── STATO_FINALE_COMPLETO.md
│   │   ├── README_CREAZIONE_CONTENUTI.md
│   │   ├── GUIDA_UTENTE_CREAZIONE.md
│   │   ├── 📱_GUIDA_UTENTE_2FA.md
│   │   └── 📧_SISTEMA_CONTATTO_ISTITUTI.md
│   │
│   ├── summaries/              # Riepiloghi sessioni
│   │   ├── 📋_RIEPILOGO_FINALE_2FA.md
│   │   ├── ✅_SISTEMA_2FA_IMPLEMENTATO.md
│   │   ├── 🎉_SISTEMA_RECENSIONI_IMPLEMENTATO.md
│   │   ├── ✅_SISTEMA_RECENSIONI_COMPLETO.md
│   │   ├── 🎉_PROFILO_COMPLETO_FINALE.md
│   │   └── 🎉_SISTEMA_PUBBLICAZIONE_COMPLETO.md
│   │
│   └── archive/                # Documentazione obsoleta
│
├── 💾 database/                # Script SQL
│   ├── setup/                  # Setup iniziale
│   │   ├── database-schema.sql
│   │   ├── social-features-schema.sql
│   │   ├── edumatch-database-schema.sql
│   │   ├── multi-admin-system-setup.sql
│   │   ├── recommendation-system-FINAL.sql
│   │   ├── 🚀_CREA_SOLO_FUNZIONI_2FA.sql
│   │   ├── database-privacy-schema.sql
│   │   └── setup-statistics-tables.sql
│   │
│   ├── production/             # Export produzione
│   │   ├── 01_CORE_TABLES_PRODUCTION.sql
│   │   ├── 02_SOCIAL_FEATURES_PRODUCTION.sql
│   │   ├── 03_FUNCTIONS_TRIGGERS_PRODUCTION.sql
│   │   ├── 04_STORAGE_BUCKETS_PRODUCTION.sql
│   │   ├── 05_RLS_POLICIES_PRODUCTION.sql
│   │   ├── 06_EDUMATCH_TABLES_PRODUCTION.sql
│   │   ├── 07_PRIVACY_AUDIT_PRODUCTION.sql
│   │   └── 08_TABELLE_MANCANTI_PRODUCTION.sql
│   │
│   ├── fixes/                  # Fix e migrazioni
│   └── archive/                # SQL obsoleti
│
├── 💻 js/                      # JavaScript
│   ├── auth/                   # Autenticazione
│   │   ├── auth.js
│   │   ├── 2fa-totp.js
│   │   ├── password-reset.js
│   │   └── validation.js
│   │
│   ├── profile/                # Gestione profilo
│   │   ├── profile-page.js
│   │   ├── profile-gallery.js
│   │   ├── avatar-manager.js
│   │   ├── edit-profile.js
│   │   └── profile-management.js
│   │
│   ├── social/                 # Features sociali
│   │   ├── social-features.js
│   │   ├── saved-posts.js
│   │   ├── connections.js
│   │   ├── institute-reviews.js
│   │   └── review-moderation.js
│   │
│   ├── admin/                  # Sistema multi-admin
│   │   ├── admin-manager.js
│   │   ├── manage-admins-page.js
│   │   └── accept-invite.js
│   │
│   ├── recommendations/        # Sistema raccomandazioni
│   │   ├── recommendation-engine.js
│   │   ├── recommendation-integration.js
│   │   ├── edumatch.js
│   │   ├── edumatch-ai-algorithm.js
│   │   ├── edumatch-visibility-guard.js
│   │   └── edumatch-collapse.js
│   │
│   └── utils/                  # Utility
│       ├── supabase-error-handler.js
│       ├── error-handling.js
│       ├── console-optimizer.js
│       ├── institute-autocomplete.js
│       ├── institute-contact.js
│       ├── mobile-search.js
│       ├── create-page.js
│       ├── homepage-script.js
│       ├── homepage-recommendation-init.js
│       ├── modern-filters.js
│       └── avatar-loader-fix.js
│
├── 🎨 css/                     # Stili
│   ├── components/             # Componenti riutilizzabili
│   │   ├── 2fa-modal.css
│   │   ├── profile-page.css
│   │   ├── profile-gallery.css
│   │   ├── connections.css
│   │   ├── institute-reviews.css
│   │   ├── review-moderation.css
│   │   ├── accept-invite.css
│   │   ├── manage-admins.css
│   │   ├── settings-page.css
│   │   ├── create-page.css
│   │   ├── homepage-styles.css
│   │   ├── image-carousel.css
│   │   ├── upload-progress.css
│   │   ├── saved-posts-styles.css
│   │   ├── institute-autocomplete.css
│   │   ├── institute-contact.css
│   │   ├── mobile-search.css
│   │   ├── modern-filters.css
│   │   ├── recommendation-ui.css
│   │   ├── edumatch-styles.css
│   │   ├── edumatch-collapse.css
│   │   └── mobile-menu-fix.css
│   │
│   ├── pages/                  # Stili pagine (vuota)
│   └── mobile/                 # Responsive mobile (vuota)
│
├── 📄 pages/                   # HTML Pages
│   ├── auth/                   # Autenticazione
│   │   ├── reset-password.html
│   │   └── verify-institute.html
│   │
│   ├── profile/                # Profilo
│   │   ├── profile.html
│   │   ├── edit-profile.html
│   │   ├── connections.html
│   │   ├── settings.html
│   │   └── accept-invite.html
│   │
│   ├── admin/                  # Amministrazione
│   │   ├── manage-admins.html
│   │   ├── accept-invite.html
│   │   └── moderation.html
│   │
│   ├── legal/                  # Legal
│   │   ├── privacy-policy.html
│   │   ├── terms-of-service.html
│   │   ├── cookie-policy.html
│   │   └── parental-consent.html
│   │
│   └── main/                   # Pagine principali
│       └── create.html
│
└── 🗂️ db scuole/              # Database scuole italiane
    └── scuole-statali.json
```

## 🎯 Vantaggi della Nuova Struttura

### Organizzazione Logica
- File raggruppati per funzionalità
- Facile trovare e modificare componenti
- Separazione chiara tra codice, stili e documentazione

### Manutenibilità
- Pulizia di file temporanei e fix completati
- Documentazione centralizzata
- Path chiari e consistenti

### Scalabilità
- Facile aggiungere nuove features
- Struttura modulare
- Cartelle pronte per espansione futura

## 📝 Note Importanti

### Path Aggiornati
I path principali sono allineati alla struttura attuale:
- ✅ Percorsi coerenti tra `pages/`, `js/` e `css/`
- ✅ Navigazione compatibile con deploy in sottocartelle
- ✅ Verifica consigliata dopo spostamenti o rinomini

### File Eliminati
Rimossi file obsoleti:
- Fix temporanei già applicati
- Istruzioni già eseguite
- Riepiloghi sessione vecchi

### File Archiviati
Spostati in `docs/archive/` e `database/archive/`:
- Documentazione obsoleta ma potenzialmente utile
- Script SQL di fix già applicati
- Riepiloghi sessioni precedenti

## 🚀 Come Navigare il Progetto

### Per Sviluppatori
1. **Codice sorgente**: Cerca in `js/` e `css/`
2. **Pagine HTML**: Cerca in `pages/`
3. **Database**: Cerca in `database/setup/` o `database/production/`

### Per Documentazione
1. **Guide utente**: `docs/guide/`
2. **Riepiloghi tecnici**: `docs/summaries/`
3. **Storia progetto**: `docs/archive/`

### Per Database
1. **Setup nuovo progetto**: `database/setup/`
2. **Export produzione**: `database/production/`
3. **Fix storici**: `database/archive/`

## ⚠️ Attenzione

### Non Modificare
- `database/production/` - Export ufficiali
- `docs/archive/` - Storia del progetto
- `database/archive/` - Fix storici

### Path Relativi
Tutti i path nei file sono relativi alla root del progetto.
Per la navigazione tra pagine usa `AppConfig.getPageUrl()` e aggiorna i riferimenti quando sposti file.

## 📊 Statistiche

- **File totali**: ~100 file attivi
- **File eliminati**: 242 file obsoleti
- **Cartelle create**: 20 cartelle
- **Path aggiornati**: 119 riferimenti
- **Spazio risparmiato**: ~5MB di file duplicati

---

**Ultima organizzazione**: 12 Novembre 2025
**Versione struttura**: 2.0
