# 🚀 Guida Setup Database EduNet19

## 📋 Problema Identificato

Il messaggio di errore indica che la tabella `posts` non esiste nel database Supabase:
```
POST https://wpimtdpvrgpgmowdsuec.supabase.co/rest/v1/posts 404 (Not Found)
Posts table not available yet
```

## ⚠️ IMPORTANTE: Errore SQL Risolto

Se hai ricevuto l'errore:
```
ERROR: 42601: syntax error at or near "'use strict'"
```

Usa il file **`supabase-setup-corrected.sql`** invece di `social-features-schema.sql`. Il file corretto è stato pulito da tutto il codice JavaScript.

## 🔧 Soluzione: Configurazione Database

### Passo 1: Accedi a Supabase Dashboard

1. Vai su [https://supabase.com](https://supabase.com)
2. Accedi al tuo account
3. Seleziona il progetto `wpimtdpvrgpgmowdsuec`

### Passo 2: Esegui lo Schema SQL Corretto

1. Nel dashboard Supabase, vai su **SQL Editor** (nel menu laterale)
2. Clicca su **New Query**
3. **IMPORTANTE**: Copia e incolla il contenuto del file **`supabase-setup-corrected.sql`** (NON social-features-schema.sql)
4. Clicca su **Run** per eseguire lo script

### Passo 3: Verifica Tabelle Create

Dopo aver eseguito lo script, dovresti vedere queste tabelle in **Table Editor**:
- ✅ `posts` - Per i contenuti/post
- ✅ `post_likes` - Per i "mi piace"
- ✅ `post_comments` - Per i commenti
- ✅ `post_shares` - Per le condivisioni
- ✅ `user_activities` - Per il tracking attività

### Passo 4: Verifica Row Level Security (RLS)

Le policy RLS sono già incluse e configurate automaticamente nello script. Verifica in **Authentication > Policies** che siano attive:

#### Per tabella `posts`:
- ✅ **Select**: Tutti gli utenti autenticati possono leggere post pubblicati
- ✅ **Insert**: Solo l'autore può creare post
- ✅ **Update**: Solo l'autore può modificare i propri post
- ✅ **Delete**: Solo l'autore può eliminare i propri post

#### Per tabella `post_likes`:
- ✅ **Select**: Tutti possono vedere i like
- ✅ **Insert/Delete**: Solo il proprietario può gestire i propri like

#### Per tabella `post_comments`:
- ✅ **Select**: Tutti possono vedere i commenti
- ✅ **Insert**: Utenti autenticati possono commentare
- ✅ **Update/Delete**: Solo il proprietario può modificare/eliminare

#### Per tabella `user_activities`:
- ✅ **Select**: Gli utenti vedono solo le proprie attività
- ✅ **Insert**: Il sistema può registrare attività

### Passo 5: Testa la Configurazione

1. Ricarica la pagina dell'applicazione (`http://localhost:8000/homepage.html`)
2. Prova a creare un nuovo post
3. Verifica che non ci siano più errori 404 in console
4. Il banner "Modalità Demo" dovrebbe scomparire

## 🎯 Risultato Atteso

Dopo la configurazione:
- ✅ **Creazione post**: Funzionante al 100%
- ✅ **Like/Unlike**: Operativo con animazioni
- ✅ **Commenti**: Attivi e persistenti
- ✅ **Condivisioni**: Disponibili su tutte le piattaforme
- ✅ **Console pulita**: Nessun errore 404
- ✅ **Contatori automatici**: Like, commenti e condivisioni aggiornati automaticamente

## 🔍 Troubleshooting

### Se continui a vedere errori 404:

1. **Verifica Esecuzione SQL**: Assicurati che lo script sia stato eseguito senza errori
2. **Controlla Tabelle**: Vai su **Table Editor** e verifica che tutte le tabelle esistano
3. **Verifica API Key**: Controlla che la `anonKey` in `config.js` sia corretta
4. **Controlla URL**: Assicurati che l'URL Supabase sia giusto
5. **Refresh Cache**: Ricarica la pagina con Ctrl+F5

### Se vedi errori di permessi:

1. Vai su **Authentication > Policies**
2. Assicurati che le policy siano abilitate per tutte le tabelle
3. Controlla che l'utente sia autenticato
4. Verifica che RLS sia abilitato per ogni tabella

### Se lo script SQL da errori:

1. **Usa il file corretto**: `supabase-setup-corrected.sql` (NON social-features-schema.sql)
2. **Esegui sezione per sezione**: Se ci sono errori, esegui il codice in blocchi più piccoli
3. **Controlla i log**: Guarda i dettagli dell'errore nel SQL Editor

## 📞 Supporto

Se hai problemi:
1. Controlla i log in **Logs > API** nel dashboard Supabase
2. Verifica lo stato delle tabelle in **Table Editor**
3. Testa le query direttamente in **SQL Editor**
4. Controlla che l'utente sia autenticato in **Authentication > Users**

## 🎉 Funzionalità Incluse

Una volta configurato, avrai:
- **📝 Creazione post** con validazione
- **❤️ Sistema like** con animazioni
- **💬 Commenti** annidati e modificabili
- **📤 Condivisioni** multi-piattaforma
- **📊 Contatori automatici** per tutte le interazioni
- **🔒 Sicurezza RLS** completa
- **⚡ Performance ottimizzate** con indici

---

**Nota**: Una volta configurato il database, l'applicazione passerà automaticamente dalla modalità demo (dati mock) alla modalità completa con tutte le funzionalità attive!