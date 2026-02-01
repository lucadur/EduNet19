# Sistema Password Condivisa - Guida Implementazione

## Problema
Supabase non permette di creare utenti direttamente dal database SQL. Serve usare l'Admin API.

## Soluzione Semplice (Manuale)

### Passo 1: Esegui SQL per aggiungere colonna password
```sql
ALTER TABLE school_institutes 
ADD COLUMN IF NOT EXISTS shared_password TEXT;

-- Genera password per il tuo istituto
UPDATE school_institutes
SET shared_password = 'Password123!'  -- Cambia con la tua password
WHERE id = (SELECT institute_id FROM institute_admins WHERE user_id = auth.uid() LIMIT 1);
```

### Passo 2: Quando inviti un collaboratore

1. **Vai su Supabase Dashboard** → Authentication → Users
2. **Clicca "Add User"**
3. **Inserisci**:
   - Email: quella del collaboratore
   - Password: la password condivisa (es: `Password123!`)
4. **Salva**

### Passo 3: Aggiungi il collaboratore come admin

Esegui questo SQL sostituendo i valori:
```sql
-- Trova l'ID del nuovo utente
SELECT id, email FROM auth.users WHERE email = 'collaboratore@email.com';

-- Aggiungilo come admin (sostituisci gli UUID)
INSERT INTO institute_admins (institute_id, user_id, role, status)
VALUES (
  'TUO_INSTITUTE_ID',  -- ID del tuo istituto
  'USER_ID_APPENA_CREATO',  -- ID dell'utente appena creato
  'admin',
  'active'
);
```

### Passo 4: Comunica le credenziali

Invia al collaboratore:
- **Email**: collaboratore@email.com
- **Password**: Password123!
- **Link**: https://tuosito.com/login

## Soluzione Automatica (Avanzata)

Richiede la creazione di una Supabase Edge Function. Te la posso implementare se vuoi.

## Come Funziona

1. Tutti gli admin dello stesso istituto usano la stessa password
2. Ogni admin ha la sua email personale
3. Login: `email_personale` + `password_condivisa`

## Vantaggi
- Facile da gestire
- Non serve registrazione per i collaboratori
- Accesso immediato

## Svantaggi
- Se qualcuno lascia il team, devi cambiare la password per tutti
- Meno sicuro di password individuali
