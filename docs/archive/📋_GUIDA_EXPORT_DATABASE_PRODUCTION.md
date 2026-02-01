# 📋 GUIDA EXPORT DATABASE PER PRODUZIONE

## 🎯 Obiettivo

Esportare la struttura completa del database Supabase (senza dati) per importarla in un nuovo progetto di produzione senza errori.

## 📦 METODO 1: Export Automatico da Supabase (Raccomandato)

### STEP 1: Export via Supabase CLI

```bash
# Installa Supabase CLI (se non l'hai già)
npm install -g supabase

# Login
supabase login

# Link al progetto corrente
supabase link --project-ref [TUO_PROJECT_REF]

# Export schema completo
supabase db dump --schema public --schema auth --schema storage > database_structure.sql
```

### STEP 2: Import nel Nuovo Progetto

```bash
# Link al nuovo progetto
supabase link --project-ref [NUOVO_PROJECT_REF]

# Import schema
supabase db push
```

## 📦 METODO 2: Export Manuale (Alternativa)

### STEP 1: Export da Dashboard Supabase

1. Vai su **Database** → **Backups**
2. Clicca **Create Backup**
3. Scarica il backup
4. Estrai solo lo schema (rimuovi INSERT statements)

### STEP 2: Oppure usa pg_dump

```bash
# Connettiti al database
pg_dump -h [HOST] -U postgres -d postgres --schema-only --no-owner --no-acl > schema.sql
```

## 📦 METODO 3: Script SQL Manuale (Più Controllo)

Ho preparato script SQL divisi per categoria che puoi eseguire in ordine.

### File da Eseguire in Ordine:

1. `01_CORE_TABLES_PRODUCTION.sql` - Tabelle principali
2. `02_SOCIAL_FEATURES_PRODUCTION.sql` - Sistema social
3. `03_FUNCTIONS_TRIGGERS_PRODUCTION.sql` - Funzioni e trigger
4. `04_STORAGE_BUCKETS_PRODUCTION.sql` - Storage e file
5. `05_RLS_POLICIES_PRODUCTION.sql` - Row Level Security base
6. `06_EDUMATCH_TABLES_PRODUCTION.sql` - Sistema match e AI
7. `07_PRIVACY_AUDIT_PRODUCTION.sql` - Privacy, audit, ratings

## ⚠️ IMPORTANTE: Ordine di Esecuzione

### 1. Estensioni PostgreSQL
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 2. Schema e Tabelle Base
- user_profiles
- school_institutes
- private_users

### 3. Tabelle Dipendenti
- user_follows
- institute_posts
- post_comments

### 4. Funzioni
- update_updated_at_column()
- update_post_counters()

### 5. Trigger
- update_*_updated_at
- init_match_weights_on_profile_create

### 6. Storage Buckets
- avatars
- covers
- post-images
- gallery

### 7. RLS Policies
- Policies per ogni tabella

## 🔧 Script Preparati

Esegui questi file nell'ordine indicato:

```
01_CORE_TABLES.sql
02_SOCIAL_FEATURES.sql
03_EDUMATCH.sql
04_STORAGE_BUCKETS.sql
05_FUNCTIONS_TRIGGERS.sql
06_RLS_POLICIES.sql
07_INDEXES.sql
```

## ✅ Checklist Pre-Import

- [ ] Nuovo progetto Supabase creato
- [ ] Estensioni PostgreSQL abilitate
- [ ] Backup del database corrente fatto
- [ ] Script SQL pronti
- [ ] Ordine di esecuzione verificato

## ✅ Checklist Post-Import

- [ ] Tutte le tabelle create
- [ ] Tutte le foreign key funzionanti
- [ ] Tutti i trigger attivi
- [ ] Tutte le funzioni create
- [ ] Storage buckets creati
- [ ] RLS policies attive
- [ ] Indici creati

## 🧪 Test Post-Import

```sql
-- Verifica tabelle
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verifica trigger
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Verifica funzioni
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Verifica storage buckets
SELECT * FROM storage.buckets;

-- Verifica RLS policies
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';
```

## 🚨 Problemi Comuni

### Errore: "relation already exists"
**Soluzione:** Aggiungi `IF NOT EXISTS` a tutti i CREATE TABLE

### Errore: "function does not exist"
**Soluzione:** Crea le funzioni prima dei trigger

### Errore: "foreign key constraint"
**Soluzione:** Crea le tabelle nell'ordine corretto (parent prima di child)

### Errore: "permission denied"
**Soluzione:** Verifica che l'utente abbia permessi di CREATE

## 📝 Note Importanti

1. **Non includere dati sensibili** negli script
2. **Testa prima in staging** prima di andare in produzione
3. **Fai backup** prima di ogni import
4. **Verifica le variabili d'ambiente** nel nuovo progetto
5. **Aggiorna le chiavi API** nel codice frontend

## 🔗 Prossimi Passi

Dopo l'import:
1. Aggiorna `SUPABASE_URL` nel codice
2. Aggiorna `SUPABASE_ANON_KEY` nel codice
3. Configura autenticazione (providers, redirect URLs)
4. Configura storage (CORS, size limits)
5. Testa registrazione e login
6. Testa upload file
7. Testa tutte le funzionalità

## 📚 Risorse

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Database Migrations](https://supabase.com/docs/guides/database/migrations)
- [pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
