# 📚 SISTEMA MULTI-ADMIN - GUIDA COMPLETA

## 🎯 Panoramica

Sistema completo per gestire fino a 3 amministratori per ogni istituto scolastico su EduNet19.

---

## 📋 Caratteristiche Principali

### ✅ Funzionalità Implementate

1. **Limite 3 Admin per Istituto**
   - Massimo 3 amministratori attivi contemporaneamente
   - Controllo automatico tramite trigger database
   - Messaggi di errore chiari quando si raggiunge il limite

2. **Ruoli Amministratori**
   - **Owner (Proprietario)**: Creatore dell'istituto, controllo completo
   - **Admin (Amministratore)**: Può gestire profilo e contenuti
   - **Editor**: Può creare contenuti ma non gestire admin

3. **Sistema Inviti**
   - Inviti via email con token univoco
   - Scadenza automatica dopo 7 giorni
   - Link di invito copiabile
   - Gestione inviti in sospeso

4. **Permessi Granulari**
   - Modifica profilo istituto
   - Creazione post
   - Eliminazione post
   - Gestione amministratori

5. **Sicurezza**
   - Row Level Security (RLS) su tutte le tabelle
   - Validazione permessi lato database
   - Token invito sicuri e univoci

---

## 🗄️ Struttura Database

### Tabelle Create

#### 1. `institute_admins`
Gestisce gli amministratori attivi degli istituti.

```sql
- id: UUID (PK)
- institute_id: UUID (FK → school_institutes)
- user_id: UUID (FK → auth.users)
- role: TEXT (owner/admin/editor)
- permissions: JSONB
- status: TEXT (pending/active/suspended/removed)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Constraints:**
- Un utente può essere admin di un solo istituto
- Massimo 3 admin attivi per istituto (enforced by trigger)

#### 2. `institute_admin_invites`
Gestisce gli inviti in sospeso.

```sql
- id: UUID (PK)
- institute_id: UUID (FK → school_institutes)
- email: TEXT
- invited_by: UUID (FK → auth.users)
- role: TEXT (admin/editor)
- token: TEXT (UNIQUE)
- expires_at: TIMESTAMPTZ
- accepted: BOOLEAN
- created_at: TIMESTAMPTZ
```

**Constraints:**
- Email unica per istituto (no inviti duplicati)
- Token univoco per sicurezza

### Funzioni Database

#### `count_active_admins(p_institute_id UUID)`
Conta il numero di admin attivi per un istituto.

#### `is_institute_admin(p_user_id UUID, p_institute_id UUID)`
Verifica se un utente è admin di un istituto.

#### `can_manage_admins(p_user_id UUID, p_institute_id UUID)`
Verifica se un utente può gestire gli admin (owner o admin con permesso).

#### `create_institute_owner(p_institute_id UUID, p_user_id UUID)`
Crea il primo admin (owner) durante la registrazione.

#### `invite_institute_admin(p_institute_id UUID, p_email TEXT, p_invited_by UUID, p_role TEXT)`
Invia un invito per diventare admin.

#### `accept_admin_invite(p_token TEXT, p_user_id UUID)`
Accetta un invito admin.

#### `remove_institute_admin(p_admin_id UUID, p_removed_by UUID)`
Rimuove un admin dall'istituto.

---

## 💻 File Implementati

### Backend (SQL)
- `multi-admin-system-setup.sql` - Setup completo database

### Frontend (JavaScript)
- `admin-manager.js` - Classe per gestione admin
- `manage-admins-page.js` - Script pagina gestione
- `accept-invite.js` - Script accettazione inviti

### HTML
- `manage-admins.html` - Pagina gestione amministratori
- `accept-invite.html` - Pagina accettazione inviti

### CSS
- `manage-admins.css` - Stili pagina gestione
- `accept-invite.css` - Stili pagina inviti

---

## 🚀 Integrazione con Registrazione

### Durante la Registrazione Istituto

Quando un istituto si registra, il sistema deve:

1. Creare record in `school_institutes`
2. Creare il primo admin (owner) chiamando:

```javascript
// In auth.js, dopo creazione istituto
const { data: adminId, error: adminError } = await supabase
  .rpc('create_institute_owner', {
    p_institute_id: instituteId,
    p_user_id: userId
  });
```

### Modifica Necessaria in `auth.js`

Aggiungere dopo la creazione dell'istituto:

```javascript
// Crea owner admin
try {
  const { error: adminError } = await this.supabase
    .rpc('create_institute_owner', {
      p_institute_id: instituteData.id,
      p_user_id: user.id
    });
  
  if (adminError) {
    console.error('Errore creazione owner:', adminError);
  } else {
    console.log('✅ Owner creato con successo');
  }
} catch (error) {
  console.error('Errore setup admin:', error);
}
```

---

## 📱 Utilizzo del Sistema

### Per Amministratori

#### 1. Accedere alla Gestione Admin

```html
<!-- Aggiungere link nel menu profilo -->
<a href="manage-admins.html" class="menu-item">
  <i class="fas fa-users"></i>
  Gestisci Amministratori
</a>
```

#### 2. Invitare un Nuovo Admin

1. Cliccare su "Invita Admin"
2. Inserire email dell'utente (deve essere già registrato)
3. Selezionare ruolo (Admin o Editor)
4. Inviare invito

#### 3. Gestire Admin Esistenti

- Visualizzare lista admin attivi
- Rimuovere admin (solo owner)
- Vedere inviti in sospeso
- Cancellare inviti non accettati

### Per Invitati

#### 1. Ricevere Invito

L'invitato riceve un link tipo:
```
https://edunet19.com/accept-invite.html?token=abc123...
```

#### 2. Accettare Invito

1. Cliccare sul link
2. Effettuare login (se necessario)
3. Vedere dettagli istituto e ruolo
4. Accettare o rifiutare

#### 3. Dopo Accettazione

- Accesso immediato come admin
- Possibilità di gestire contenuti
- Visibilità nella lista admin

---

## 🔐 Permessi e Ruoli

### Owner (Proprietario)

```json
{
  "can_edit_profile": true,
  "can_create_posts": true,
  "can_delete_posts": true,
  "can_manage_admins": true
}
```

**Può:**
- ✅ Tutto quello che possono fare Admin ed Editor
- ✅ Invitare nuovi admin
- ✅ Rimuovere admin
- ✅ Modificare permessi admin
- ❌ Non può essere rimosso

### Admin (Amministratore)

```json
{
  "can_edit_profile": true,
  "can_create_posts": true,
  "can_delete_posts": true,
  "can_manage_admins": false
}
```

**Può:**
- ✅ Modificare profilo istituto
- ✅ Creare post, progetti, metodologie
- ✅ Eliminare post
- ✅ Gestire galleria foto
- ❌ Non può gestire altri admin

### Editor

```json
{
  "can_edit_profile": false,
  "can_create_posts": true,
  "can_delete_posts": false,
  "can_manage_admins": false
}
```

**Può:**
- ✅ Creare post, progetti, metodologie
- ❌ Non può modificare profilo
- ❌ Non può eliminare post
- ❌ Non può gestire admin

---

## 🎨 UI/UX

### Pagina Gestione Admin

**Sezioni:**
1. **Statistiche**: Admin attivi, inviti in sospeso, posti disponibili
2. **Admin Attivi**: Lista con avatar, nome, email, ruolo
3. **Inviti in Sospeso**: Lista inviti con scadenza
4. **Info Ruoli**: Spiegazione permessi

**Azioni:**
- Invita nuovo admin (pulsante principale)
- Rimuovi admin (icona cestino)
- Copia link invito (icona link)
- Cancella invito (icona X)

### Pagina Accettazione Invito

**Stati:**
1. **Loading**: Verifica invito in corso
2. **Invito Valido**: Mostra dettagli e pulsanti accetta/rifiuta
3. **Invito Non Valido**: Messaggio errore
4. **Successo**: Conferma accettazione

---

## 🧪 Testing

### Test da Eseguire

#### 1. Creazione Owner
```sql
-- Verifica che l'owner sia creato alla registrazione
SELECT * FROM institute_admins 
WHERE institute_id = 'YOUR_INSTITUTE_ID' 
AND role = 'owner';
```

#### 2. Limite 3 Admin
```javascript
// Prova ad invitare 4 admin
// Il 4° dovrebbe fallire con errore
```

#### 3. Invito e Accettazione
```javascript
// 1. Invita un admin
// 2. Copia link invito
// 3. Apri in incognito
// 4. Login con email invitata
// 5. Accetta invito
// 6. Verifica che appaia nella lista
```

#### 4. Rimozione Admin
```javascript
// 1. Rimuovi un admin
// 2. Verifica che scompaia dalla lista
// 3. Verifica che non possa più accedere
```

#### 5. Permessi
```javascript
// 1. Login come Editor
// 2. Prova ad accedere a manage-admins.html
// 3. Dovrebbe essere bloccato
```

---

## 🔧 Troubleshooting

### Problema: "Limite massimo raggiunto"

**Causa**: Ci sono già 3 admin attivi

**Soluzione**: 
1. Rimuovere un admin esistente
2. Oppure attendere che un invito scada

### Problema: "Invito non valido"

**Cause possibili:**
- Invito scaduto (>7 giorni)
- Invito già accettato
- Token errato
- Email non corrisponde

**Soluzione**:
1. Verificare che l'invito non sia scaduto
2. Richiedere nuovo invito
3. Verificare di usare l'email corretta

### Problema: "Non hai i permessi"

**Causa**: L'utente non è owner o admin con permessi

**Soluzione**:
1. Verificare il ruolo dell'utente
2. Contattare l'owner per ottenere permessi

---

## 📊 Statistiche e Monitoring

### Query Utili

#### Conta admin per istituto
```sql
SELECT 
  si.institute_name,
  COUNT(*) as admin_count
FROM institute_admins ia
JOIN school_institutes si ON ia.institute_id = si.id
WHERE ia.status = 'active'
GROUP BY si.id, si.institute_name;
```

#### Inviti in scadenza
```sql
SELECT 
  si.institute_name,
  iai.email,
  iai.expires_at
FROM institute_admin_invites iai
JOIN school_institutes si ON iai.institute_id = si.id
WHERE iai.accepted = false
AND iai.expires_at < NOW() + INTERVAL '1 day'
ORDER BY iai.expires_at;
```

#### Admin senza owner
```sql
SELECT 
  si.institute_name,
  COUNT(*) as admin_count
FROM school_institutes si
LEFT JOIN institute_admins ia ON si.id = ia.institute_id AND ia.role = 'owner'
WHERE ia.id IS NULL
GROUP BY si.id, si.institute_name;
```

---

## 🚀 Prossimi Passi

### Implementazioni Future

1. **Notifiche Email**
   - Email automatica quando si riceve un invito
   - Reminder prima della scadenza
   - Conferma accettazione

2. **Audit Log**
   - Tracciare tutte le azioni admin
   - Chi ha fatto cosa e quando
   - Storico modifiche

3. **Permessi Personalizzati**
   - Permettere all'owner di personalizzare permessi
   - Ruoli custom oltre ai 3 predefiniti

4. **Trasferimento Ownership**
   - Permettere all'owner di trasferire il ruolo
   - Processo di conferma sicuro

5. **Statistiche Admin**
   - Dashboard con attività admin
   - Contributi di ogni admin
   - Performance metrics

---

## ✅ Checklist Implementazione

### Database
- [x] Tabella `institute_admins`
- [x] Tabella `institute_admin_invites`
- [x] Funzioni CRUD
- [x] Trigger limite 3 admin
- [x] RLS Policies
- [x] View `institute_admins_view`

### Frontend
- [x] Classe `AdminManager`
- [x] Pagina gestione admin
- [x] Pagina accettazione inviti
- [x] Stili responsive
- [x] Gestione errori

### Integrazione
- [ ] Modifica `auth.js` per creare owner
- [ ] Link nel menu profilo
- [ ] Test completi
- [ ] Documentazione utente

---

## 📞 Supporto

Per problemi o domande sul sistema multi-admin:

1. Verificare questa documentazione
2. Controllare i log console
3. Verificare permessi database
4. Testare con dati di esempio

---

## 🎉 Conclusione

Il sistema multi-admin è completo e pronto per l'uso. Permette una gestione flessibile e sicura degli amministratori degli istituti, con un limite di 3 admin per garantire controllo e qualità.

**Prossimo step**: Integrare la creazione dell'owner durante la registrazione modificando `auth.js`.
