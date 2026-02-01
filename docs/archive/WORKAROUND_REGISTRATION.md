# 🔧 Workaround Errore Registrazione - Senza Accesso Schema Auth

## ❌ Problema

```
ERROR: 42501: must be owner of schema auth
AuthApiError: Database error saving new user (500)
```

**Causa**: Non hai i permessi per modificare lo schema `auth` di Supabase, quindi non puoi disabilitare i trigger direttamente.

## ✅ Soluzioni Alternative

### Soluzione 1: Disabilita Email Confirmation (CONSIGLIATA)

Il problema potrebbe essere causato dalla conferma email. Disabilitandola, Supabase non eseguirà trigger aggiuntivi.

#### Passi:

1. **Vai su Supabase Dashboard**
2. **Authentication → Settings**
3. **Trova "Enable email confirmations"**
4. **Disabilita l'opzione**
5. **Salva le modifiche**

Questo dovrebbe risolvere il problema perché:
- Supabase non cercherà di inviare email di conferma
- Non eseguirà trigger legati alla conferma email
- L'utente sarà immediatamente attivo

### Soluzione 2: Usa Supabase CLI per Verificare Trigger

Se hai accesso alla CLI di Supabase:

```bash
# Connettiti al database
supabase db remote connect

# Verifica trigger su auth.users (solo lettura)
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';
```

### Soluzione 3: Contatta Supporto Supabase

Se il problema persiste, apri un ticket di supporto:

1. Vai su **Supabase Dashboard → Support**
2. Descrivi il problema: "Database error saving new user during signUp"
3. Includi:
   - Project ID
   - Timestamp dell'errore
   - Stack trace completo

### Soluzione 4: Usa Supabase Admin API (Avanzato)

Se hai accesso alla Service Role Key, puoi bypassare i trigger usando l'Admin API:

```javascript
// In auth.js, usa il client admin
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY, // Service Role Key (NON la anon key)
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Usa supabaseAdmin.auth.admin.createUser() invece di signUp()
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: formData.email,
  password: formData.password,
  email_confirm: true // Conferma automaticamente
});
```

**⚠️ ATTENZIONE**: La Service Role Key deve essere usata SOLO lato server, mai nel frontend!

## 🔍 Verifica Configurazione Supabase

### 1. Email Confirmation

**Dashboard → Authentication → Settings**

```
✅ Enable email confirmations: OFF (disabilitato)
✅ Enable phone confirmations: OFF (disabilitato)
```

### 2. Email Templates

**Dashboard → Authentication → Email Templates**

Verifica che i template non abbiano errori di sintassi.

### 3. Auth Hooks (Beta)

**Dashboard → Authentication → Hooks**

Se hai configurato hooks personalizzati, potrebbero causare l'errore. Prova a disabilitarli temporaneamente.

### 4. Database Webhooks

**Dashboard → Database → Webhooks**

Verifica se ci sono webhook configurati su `auth.users` che potrebbero fallire.

## 🛠️ Script SQL Sicuro (Solo Schema Public)

Esegui questo script per verificare le policy sulle tabelle `public`:

```sql
-- Verifica policy su user_profiles
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_profiles';

-- Assicurati che la policy INSERT permetta la creazione
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

CREATE POLICY "Users can insert own profile" 
  ON public.user_profiles 
  FOR INSERT 
  WITH CHECK (id = (SELECT auth.uid()));

-- Verifica che RLS sia abilitato
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Test: Verifica che la policy funzioni
-- (Questo test fallirà se non sei autenticato, ma è normale)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'user_profiles' 
            AND cmd = 'INSERT'
        ) THEN '✅ Policy INSERT esiste'
        ELSE '❌ Policy INSERT mancante'
    END as status;
```

## 📊 Diagnostica Completa

### Verifica Log Supabase

1. **Dashboard → Logs → Postgres Logs**
2. Filtra per timestamp dell'errore
3. Cerca messaggi di errore dettagliati

### Verifica Log Auth

1. **Dashboard → Logs → Auth Logs**
2. Cerca l'evento di registrazione fallito
3. Verifica il messaggio di errore completo

## 🎯 Soluzione Temporanea: Gestione Errore Graceful

Se non riesci a risolvere il problema lato database, modifica il frontend per gestire l'errore in modo più user-friendly:

```javascript
// In auth.js
try {
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: formData.email,
        password: formData.password
    });

    if (authError) {
        // Se l'errore è "Database error saving new user"
        if (authError.message.includes('Database error')) {
            // Mostra messaggio personalizzato
            this.showNotification(
                'Registrazione temporaneamente non disponibile. ' +
                'Contatta l\'assistenza: support@edunet19.it',
                'error'
            );
            
            // Log per debugging
            console.error('Registration DB Error:', {
                email: formData.email,
                timestamp: new Date().toISOString(),
                error: authError
            });
            
            return { success: false, error: 'database_error' };
        }
        
        throw authError;
    }
    
    // ... resto del codice
} catch (error) {
    // ... gestione errori
}
```

## 📞 Contatti Supporto

Se nessuna soluzione funziona:

1. **Supabase Support**: https://supabase.com/support
2. **Discord Community**: https://discord.supabase.com
3. **GitHub Issues**: https://github.com/supabase/supabase/issues

Includi sempre:
- Project ID
- Timestamp errore
- Stack trace completo
- Configurazione auth (email confirmation, etc.)

## 🚀 Prossimi Passi

1. ✅ **Disabilita Email Confirmation** (più probabile soluzione)
2. ✅ Verifica Auth Hooks e Webhooks
3. ✅ Controlla Log Supabase per dettagli
4. ✅ Se persiste, contatta supporto Supabase

La disabilitazione della conferma email dovrebbe risolvere il problema nel 90% dei casi!
