# Guida Setup Supabase per EduNet19

## 1. Creazione Progetto Supabase

### Passo 1: Registrazione
1. Vai su [supabase.com](https://supabase.com)
2. Clicca su "Start your project"
3. Registrati con GitHub, Google o email

### Passo 2: Nuovo Progetto
1. Clicca su "New Project"
2. Seleziona la tua organizzazione
3. Compila i dettagli:
   - **Name**: `edunet19`
   - **Database Password**: Genera una password sicura (salvala!)
   - **Region**: Europe (West) - per l'Italia
4. Clicca "Create new project"

## 2. Configurazione Database

### Schema Tabelle Necessarie

```sql
-- Tabella per profili utente estesi
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('istituto', 'privato')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per istituti scolastici
CREATE TABLE public.school_institutes (
    id UUID REFERENCES public.user_profiles(id) PRIMARY KEY,
    institute_name VARCHAR(255) NOT NULL,
    institute_type VARCHAR(100) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(50),
    postal_code VARCHAR(10),
    phone VARCHAR(20),
    website VARCHAR(255),
    description TEXT,
    logo_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per utenti privati
CREATE TABLE public.private_users (
    id UUID REFERENCES public.user_profiles(id) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per seguire istituti
CREATE TABLE public.user_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES public.user_profiles(id),
    following_institute_id UUID REFERENCES public.school_institutes(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_institute_id)
);
```

### Row Level Security (RLS)

```sql
-- Abilita RLS su tutte le tabelle
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Policy per user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy per school_institutes
CREATE POLICY "Anyone can view institutes" ON public.school_institutes
    FOR SELECT USING (true);

CREATE POLICY "Institutes can update own data" ON public.school_institutes
    FOR UPDATE USING (auth.uid() = id);

-- Policy per private_users
CREATE POLICY "Users can view own private data" ON public.private_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own private data" ON public.private_users
    FOR UPDATE USING (auth.uid() = id);

-- Policy per user_follows
CREATE POLICY "Users can view own follows" ON public.user_follows
    FOR SELECT USING (auth.uid() = follower_id);

CREATE POLICY "Users can manage own follows" ON public.user_follows
    FOR ALL USING (auth.uid() = follower_id);
```

## 3. Configurazione Autenticazione

### Impostazioni Auth
1. Vai su Authentication > Settings
2. Configura:
   - **Site URL**: `http://localhost:8000` (per sviluppo)
   - **Redirect URLs**: `http://localhost:8000/dashboard`
   - **Email Templates**: Personalizza i template in italiano

### Provider Email
- Abilita "Email" provider
- Configura "Confirm email" se necessario
- Personalizza i template email in italiano

## 4. Ottenere le Credenziali

### API Keys
1. Vai su Settings > API
2. Copia:
   - **Project URL**: `https://[your-project].supabase.co`
   - **anon public key**: La chiave pubblica per il client

### Aggiornare config.js
Sostituisci i valori in `config.js`:
```javascript
const SUPABASE_CONFIG = {
    url: 'https://[your-project].supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    // ...
};
```

## 5. Test Connessione

Dopo aver configurato tutto, testa la connessione aprendo la console del browser e verificando che non ci siano errori di autenticazione.

## Note Importanti

- ⚠️ **Mai committare le chiavi reali nel codice**
- 🔒 **Usa variabili d'ambiente in produzione**
- 📧 **Configura un provider email per produzione**
- 🌍 **Aggiorna Site URL per il dominio di produzione**
- 🔐 **Testa sempre le RLS policies**