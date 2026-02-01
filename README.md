# EduNet19 - Piattaforma Educativa Sociale

EduNet19 è una piattaforma web moderna che connette istituti scolastici e utenti privati in un ambiente educativo sociale sicuro e interattivo.

## 🚀 Caratteristiche Principali

### 🔐 Sistema di Autenticazione Completo
- **Registrazione Dual-Type**: Supporto per istituti scolastici e utenti privati
- **Autenticazione Sicura**: Integrazione con Supabase per gestione utenti
- **Reset Password**: Sistema completo di recupero password via email
- **Verifica Email**: Conferma automatica dell'indirizzo email
- **Gestione Sessioni**: Persistenza sicura delle sessioni utente

### 🛡️ Sicurezza Avanzata
- **Row Level Security (RLS)**: Politiche di sicurezza a livello database
- **Validazione Input**: Protezione contro XSS e SQL injection
- **Gestione Errori**: Sistema avanzato di error handling
- **Crittografia Password**: Hash sicuro delle password utente

### 👥 Gestione Profili
- **Profili Istituto**: Gestione completa per scuole e istituti
- **Profili Privati**: Account personali per studenti e educatori
- **Sistema Follow**: Possibilità di seguire altri utenti
- **Statistiche Profilo**: Metriche e analytics per ogni profilo

### ✅ Validazione Avanzata
- **Validazione Real-time**: Controllo immediato dei dati inseriti
- **Correzione Email**: Suggerimenti automatici per domini email
- **Validazione Password**: Controllo robustezza password
- **Sanitizzazione Input**: Pulizia automatica dei dati

## 🏗️ Architettura Tecnica

### Frontend
- **HTML5 Semantico**: Struttura accessibile e SEO-friendly
- **CSS3 Moderno**: Design responsive con animazioni fluide
- **JavaScript ES6+**: Codice modulare e performante
- **Progressive Enhancement**: Funzionalità base senza JavaScript

### Backend & Database
- **Supabase**: Backend-as-a-Service per autenticazione e database
- **PostgreSQL**: Database relazionale con RLS
- **Real-time**: Aggiornamenti in tempo reale
- **API RESTful**: Interfacce standardizzate

### Sicurezza
- **HTTPS**: Comunicazioni crittografate
- **JWT Tokens**: Autenticazione stateless sicura
- **Input Sanitization**: Protezione contro attacchi comuni
- **Rate Limiting**: Protezione contro abusi

## 📁 Struttura del Progetto

```
EduNet19_2/
├── index.html                         # Landing page (auth)
├── homepage.html                      # Homepage autenticata
├── pages/                             # HTML secondari
│   ├── auth/reset-password.html       # Reset password
│   ├── auth/verify-institute.html     # Verifica istituto
│   ├── profile/profile.html           # Profilo
│   ├── profile/edit-profile.html      # Modifica profilo
│   ├── profile/settings.html          # Impostazioni
│   ├── profile/connections.html       # Connessioni
│   ├── admin/manage-admins.html       # Gestione admin
│   ├── admin/accept-invite.html       # Accetta invito
│   └── admin/moderation.html          # Moderazione contenuti
├── css/components/                    # Componenti CSS
├── js/                                # Logica applicazione
│   ├── auth/                          # Autenticazione
│   ├── profile/                       # Profilo
│   ├── social/                        # Social
│   ├── recommendations/               # EduMatch
│   └── utils/                         # Utility
├── config.js                          # Configurazione Supabase
├── supabase-client.js                 # Client Supabase centralizzato
├── styles.css                         # Stili principali
└── database/setup/database-schema.sql # Schema database
```

## 🗄️ Schema Database

### Tabelle Principali
- **user_profiles**: Profili base utenti
- **school_institutes**: Dati specifici istituti
- **private_users**: Dati specifici utenti privati
- **user_follows**: Sistema di following
- **institute_posts**: Post degli istituti
- **post_comments**: Commenti ai post
- **institute_ratings**: Valutazioni istituti
- **user_notifications**: Sistema notifiche
- **content_reports**: Segnalazioni contenuti

### Funzionalità Database
- **Trigger automatici**: Aggiornamento timestamp
- **Funzioni personalizzate**: Contatori e statistiche
- **Indici ottimizzati**: Performance query
- **Politiche RLS**: Sicurezza granulare

## 🚀 Installazione e Setup

### Prerequisiti
- Browser moderno (Chrome, Firefox, Safari, Edge)
- Server web locale (Python, Node.js, o simili)
- Account Supabase (per produzione)

### Setup Locale
1. **Clona il repository**
   ```bash
   git clone <repository-url>
   cd EduNet19_2
   ```

2. **Configura Supabase**
   - Crea un progetto su [Supabase](https://supabase.com)
   - Copia URL e chiave anonima
   - Aggiorna `config.js` con le tue credenziali

3. **Importa schema database**
   ```sql
   -- Esegui il contenuto di database/setup/database-schema.sql nel tuo progetto Supabase
   ```

4. **Avvia server locale**
   ```bash
   # Con Python
   python -m http.server 8000
   
   # Con Node.js
   npx serve .
   
   # Con PHP
   php -S localhost:8000
   ```

5. **Accedi all'applicazione**
   - Apri `http://localhost:8000` nel browser
   - Usa `index.html` per autenticazione e `homepage.html` per l'app

## 🧪 Testing

### Test Automatici
Al momento non è presente una pagina di test automatici dedicata.
Per il collaudo, usa la checklist in `🚀_LAUNCH_CHECKLIST.md`.

### Test Manuali
1. **Registrazione Istituto**
   - Compila form con dati validi
   - Verifica email di conferma
   - Controlla creazione profilo

2. **Registrazione Utente Privato**
   - Compila form con dati personali
   - Verifica validazione real-time
   - Controlla accesso post-registrazione

3. **Reset Password**
   - Richiedi reset via email
   - Segui link ricevuto
   - Imposta nuova password

## 🔧 Configurazione

### Variabili Ambiente
```javascript
// config.js
window.SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

### Personalizzazione
- **Stili**: Modifica `styles.css` per personalizzare l'aspetto
- **Validazione**: Aggiorna regole in `validation.js`
- **Messaggi**: Personalizza notifiche in `error-handling.js`

## 📱 Responsive Design

L'applicazione è completamente responsive e ottimizzata per:
- 📱 **Mobile**: iPhone, Android (320px+)
- 📱 **Tablet**: iPad, Android tablet (768px+)
- 💻 **Desktop**: Laptop e desktop (1024px+)
- 🖥️ **Large Screen**: Monitor grandi (1440px+)

## 🔒 Sicurezza

### Misure Implementate
- **Autenticazione Multi-fattore**: Supporto per 2FA
- **Validazione Server-side**: Controlli lato database
- **Rate Limiting**: Protezione contro brute force
- **Content Security Policy**: Prevenzione XSS
- **Secure Headers**: Configurazione sicurezza HTTP

### Best Practices
- Password complesse obbligatorie
- Sessioni con timeout automatico
- Logging delle attività sensibili
- Backup automatici database
- Monitoraggio sicurezza continuo

## 🚀 Deployment

### Hosting Statico
- **Netlify**: Deploy automatico da Git
- **Vercel**: Integrazione CI/CD
- **GitHub Pages**: Hosting gratuito
- **Firebase Hosting**: Integrazione Google

### Configurazione Produzione
1. **Aggiorna config.js** con URL produzione
2. **Configura domini** in Supabase
3. **Abilita HTTPS** obbligatorio
4. **Configura backup** database
5. **Monitora performance** e errori

## 🤝 Contribuire

### Linee Guida
1. **Fork** il repository
2. **Crea branch** per nuove feature
3. **Scrivi test** per nuove funzionalità
4. **Documenta** modifiche nel README
5. **Invia Pull Request** con descrizione dettagliata

### Coding Standards
- **ES6+**: Usa sintassi moderna JavaScript
- **Semantic HTML**: Struttura accessibile
- **BEM CSS**: Nomenclatura consistente
- **JSDoc**: Documenta funzioni complesse
- **Git Conventional**: Commit message standardizzati

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file `LICENSE` per dettagli completi.

## 📞 Supporto

Per supporto tecnico o domande:
- 📧 **Email**: support@edunet19.com
- 💬 **Discord**: [Server Community](https://discord.gg/edunet19)
- 📖 **Documentazione**: [Wiki del progetto](https://github.com/edunet19/wiki)
- 🐛 **Bug Report**: [GitHub Issues](https://github.com/edunet19/issues)

## 🎯 Roadmap

### Versione 2.0
- [ ] Chat in tempo reale
- [ ] Sistema di notifiche push
- [ ] App mobile nativa
- [ ] Integrazione calendario
- [ ] Sistema di valutazioni

### Versione 2.1
- [ ] Marketplace corsi
- [ ] Certificazioni digitali
- [ ] Analytics avanzate
- [ ] API pubblica
- [ ] Plugin WordPress

---

**EduNet19** - Connettendo il futuro dell'educazione 🎓✨