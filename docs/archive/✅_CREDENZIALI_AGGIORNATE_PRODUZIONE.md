# ✅ CREDENZIALI SUPABASE AGGIORNATE

## 🎯 COMPLETATO!

Ho aggiornato le credenziali Supabase nel file `config.js` con il nuovo progetto di produzione.

## 📝 MODIFICHE APPLICATE

### File: `config.js`

**Prima (Progetto Vecchio):**
```javascript
url: 'https://wpimtdpvrgpgmowdsuec.supabase.co'
anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' (vecchia)
```

**Dopo (Progetto Nuovo - Produzione):**
```javascript
url: 'https://skuohmocimslevtkqilx.supabase.co'
anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdW9obW9jaW1zbGV2dGtxaWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzMyMDAsImV4cCI6MjA3NzE0OTIwMH0.QobzBcexlGV-bkstuv6v__EeIz3HswzvBvPM8uzYYpY'
```

## 🔑 CREDENZIALI SALVATE

### Anon Key (Pubblica - Usata nel Frontend)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdW9obW9jaW1zbGV2dGtxaWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzMyMDAsImV4cCI6MjA3NzE0OTIwMH0.QobzBcexlGV-bkstuv6v__EeIz3HswzvBvPM8uzYYpY
```

### Service Role Key (Privata - NON usare nel frontend!)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdW9obW9jaW1zbGV2dGtxaWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU3MzIwMCwiZXhwIjoyMDc3MTQ5MjAwfQ.hb0C8QH-AQ4NJBcU6kVAUpEatCdrxg2vVahVoW_iFUQ
```

⚠️ **IMPORTANTE:** La Service Role Key è commentata nel codice perché NON deve essere usata nel frontend. È solo per operazioni admin lato server.

### Project URL
```
https://skuohmocimslevtkqilx.supabase.co
```

## 🚀 COSA FARE ORA

### 1. Ricarica l'Applicazione
```
Ctrl + F5 (hard refresh)
```

### 2. Verifica Connessione
Apri la console del browser (F12) e cerca:
```
✅ Client Supabase centralizzato inizializzato
```

### 3. Testa Funzionalità
- [ ] Registrazione nuovo utente
- [ ] Login
- [ ] Modifica profilo
- [ ] Upload avatar
- [ ] Crea post
- [ ] Like/commenti

## 🔒 SICUREZZA

### ✅ Anon Key (Sicura per Frontend)
- Può essere esposta pubblicamente
- Ha permessi limitati tramite RLS
- Usata per tutte le operazioni utente

### ⚠️ Service Role Key (PRIVATA!)
- **NON** deve essere nel frontend
- **NON** deve essere committata in Git
- Solo per operazioni admin lato server
- Bypassa tutte le RLS policies

## 📁 FILE MODIFICATO

- `config.js` - Credenziali Supabase aggiornate

## 🧪 TEST RAPIDO

Apri la console del browser e esegui:

```javascript
// Test connessione
const client = await window.supabaseClientManager.getClient();
console.log('Client:', client ? '✅ Connesso' : '❌ Non connesso');

// Test query
const { data, error } = await client
  .from('user_profiles')
  .select('count');
console.log('Query test:', error ? '❌ Errore' : '✅ OK');
```

## ⚠️ IMPORTANTE

### Prima di Committare in Git:

1. **NON committare la Service Role Key**
2. **Usa variabili d'ambiente** per produzione
3. **Aggiungi config.js a .gitignore** se contiene chiavi sensibili

### File .gitignore
```
# Supabase config (se contiene service role key)
config.js

# Environment variables
.env
.env.local
.env.production
```

### Usa Environment Variables (Raccomandato)
```javascript
// config.js (versione sicura)
const SUPABASE_CONFIG = {
    url: process.env.SUPABASE_URL || 'https://skuohmocimslevtkqilx.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
    // Service role key SOLO in .env, MAI nel codice
};
```

## ✅ CHECKLIST

- [x] URL aggiornato
- [x] Anon Key aggiornata
- [x] Service Role Key documentata (ma non usata nel frontend)
- [ ] Ricarica applicazione
- [ ] Testa connessione
- [ ] Testa registrazione
- [ ] Testa login
- [ ] Verifica che tutto funzioni

## 🎉 COMPLETATO!

Le credenziali sono state aggiornate con successo. L'applicazione ora punta al nuovo progetto Supabase di produzione!

**Ricarica la pagina e testa!** 🚀
