# 📊 Setup Statistiche Dinamiche - EduNet19

## 🎯 Obiettivo
Configurare il database Supabase per abilitare statistiche dinamiche in tempo reale per likes, commenti e condivisioni.

## 📋 Prerequisiti
- Accesso al dashboard Supabase del progetto
- Permessi di amministratore per eseguire query SQL

## 🚀 Procedura di Setup

### Passo 1: Accedi a Supabase
1. Vai su [supabase.com](https://supabase.com)
2. Accedi al tuo progetto EduNet19
3. Naviga nella sezione **SQL Editor**

### Passo 2: Esegui lo Script di Setup
1. Apri il file `setup-statistics-tables.sql` che ho creato
2. Copia tutto il contenuto del file
3. Incollalo nel SQL Editor di Supabase
4. Clicca su **Run** per eseguire lo script

### Passo 3: Verifica la Creazione delle Tabelle
Dopo l'esecuzione, dovresti vedere nel database le seguenti nuove tabelle:
- ✅ `post_likes` - Per gestire i "mi piace"
- ✅ `post_comments` - Per gestire i commenti
- ✅ `post_shares` - Per gestire le condivisioni

### Passo 4: Verifica le Colonne nella Tabella Posts
Lo script aggiunge automaticamente queste colonne alla tabella `posts`:
- ✅ `likes_count` - Contatore automatico dei likes
- ✅ `comments_count` - Contatore automatico dei commenti  
- ✅ `shares_count` - Contatore automatico delle condivisioni

## 🔧 Cosa Fa lo Script

### 1. **Creazione Tabelle**
```sql
-- Tabelle per interazioni sociali
CREATE TABLE post_likes (...)
CREATE TABLE post_comments (...)
CREATE TABLE post_shares (...)
```

### 2. **Indici per Performance**
```sql
-- Indici ottimizzati per query veloci
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
-- ... altri indici
```

### 3. **Sicurezza (RLS)**
```sql
-- Row Level Security abilitata
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
-- Policies per controllare accesso ai dati
```

### 4. **Triggers Automatici**
```sql
-- Aggiornamento automatico dei contatori
CREATE TRIGGER trigger_update_post_likes_count
-- Quando si aggiunge/rimuove un like, il contatore si aggiorna automaticamente
```

### 5. **Dati di Test**
Lo script inserisce alcuni dati di esempio per testare subito le funzionalità.

## 📊 Risultato Atteso

Dopo il setup, le statistiche nella homepage saranno:
- **Dinamiche**: Si aggiornano in tempo reale
- **Accurate**: Contano i dati reali dal database
- **Performanti**: Query ottimizzate con indici
- **Sicure**: Policies RLS configurate

## 🧪 Test delle Funzionalità

### Test 1: Verifica Contatori
```sql
-- Controlla i contatori nella tabella posts
SELECT id, title, likes_count, comments_count, shares_count 
FROM posts 
WHERE is_published = true;
```

### Test 2: Aggiungi un Like
```sql
-- Aggiungi un like e verifica che il contatore si aggiorna
INSERT INTO post_likes (post_id, user_id) 
VALUES ('POST_ID_QUI', 'USER_ID_QUI');
```

### Test 3: Verifica Statistiche Homepage
1. Ricarica la homepage
2. Le statistiche dovrebbero mostrare i valori reali dal database
3. Nessun errore nella console

## 🔍 Troubleshooting

### Errore: "relation does not exist"
- **Causa**: La tabella `posts` non esiste
- **Soluzione**: Esegui prima `database-schema.sql` per creare tutte le tabelle base

### Errore: "permission denied"
- **Causa**: L'utente non ha permessi per creare tabelle
- **Soluzione**: Usa un account amministratore o richiedi i permessi

### Statistiche sempre a 0
- **Causa**: Non ci sono dati nelle tabelle di interazione
- **Soluzione**: Lo script inserisce dati di test automaticamente

## 📈 Vantaggi delle Statistiche Dinamiche

1. **Tempo Reale**: I contatori si aggiornano istantaneamente
2. **Accuratezza**: Dati sempre sincronizzati
3. **Performance**: Query ottimizzate per velocità
4. **Scalabilità**: Gestisce migliaia di interazioni
5. **Manutenzione**: Aggiornamenti automatici via triggers

## 🎉 Completamento

Una volta eseguito lo script, le statistiche nella homepage EduNet19 saranno completamente dinamiche e funzionali!

---

**Nota**: Se incontri problemi durante il setup, controlla i log di Supabase per messaggi di errore dettagliati.