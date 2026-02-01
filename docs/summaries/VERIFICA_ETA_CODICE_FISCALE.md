# Sistema di Verifica Età tramite Codice Fiscale

## Panoramica

Implementato un sistema completo di verifica dell'età reale degli utenti privati tramite validazione del Codice Fiscale italiano.

## Componenti Implementati

### 1. Validatore Codice Fiscale (`js/utils/codice-fiscale-validator.js`)

Implementa l'algoritmo ufficiale del Ministero delle Finanze per:
- Validare il formato del CF (16 caratteri)
- Verificare il carattere di controllo
- Estrarre e validare nome/cognome
- Estrarre data di nascita e sesso
- Gestire i casi di omocodia
- Confrontare i dati anagrafici inseriti con quelli codificati nel CF

### 2. Fasce d'Età e Requisiti

| Età | Categoria | Requisiti |
|-----|-----------|-----------|
| < 14 | Troppo giovane | ❌ Registrazione non permessa |
| 14-15 | Minore con consenso | ✅ Richiede email genitore per conferma |
| 16-17 | Minore autonomo | ✅ Richiede dichiarazione di consenso |
| 18+ | Maggiorenne | ✅ Nessun requisito aggiuntivo |

### 3. Flusso Consenso Parentale (14-15 anni)

1. Utente inserisce dati + CF + email genitore
2. Sistema valida CF e estrae età reale
3. Se 14-15 anni → crea record `parental_consents`
4. Edge Function invia email al genitore con link di conferma
5. Genitore clicca link → pagina `parental-consent.html`
6. Genitore conferma/rifiuta
7. Account attivato/bloccato di conseguenza

### 4. Database

#### Nuove colonne `private_users`:
- `codice_fiscale` (VARCHAR 16, univoco)
- `codice_fiscale_verified` (BOOLEAN)
- `codice_fiscale_verified_at` (TIMESTAMPTZ)

#### Nuove colonne `parental_consents`:
- `status` (pending/approved/denied/expired/cancelled)
- `status_history` (JSONB - storico cambiamenti)
- `denied_at`, `denial_reason`
- `reminder_sent_at`, `reminder_count`
- `minor_first_name`, `minor_last_name`, `minor_email`
- `minor_birth_date`, `minor_codice_fiscale`

### 5. Edge Function (`send-parental-consent-email`)

- Crea record consenso con token univoco
- Invia email HTML professionale al genitore
- Token valido 48 ore
- Supporta Resend API per invio email

### 6. Moderation Center

Sezione "Consensi Parentali" aggiornata con:
- Statistiche (pending/approved/denied/expired)
- Dettagli completi minore e genitore
- Storico cambiamenti stato
- Azioni: Reinvia email, Approva manualmente, Rifiuta

## File Modificati

- `index.html` - Aggiunto campo Codice Fiscale nel form
- `js/auth/auth.js` - Integrata validazione CF nella registrazione
- `js/admin/moderation-center.js` - Nuova gestione consensi parentali
- `pages/admin/moderation.html` - UI migliorata sezione parental
- `pages/legal/parental-consent.html` - Gestione nuovi stati

## File Creati

- `js/utils/codice-fiscale-validator.js` - Validatore CF
- Edge Function `send-parental-consent-email`

## Sicurezza

- CF univoco per utente (previene account duplicati)
- Validazione incrociata nome/cognome/data nascita
- Token consenso con scadenza 48h
- Storico persistente di tutti i cambiamenti stato
- RLS policies per accesso admin
