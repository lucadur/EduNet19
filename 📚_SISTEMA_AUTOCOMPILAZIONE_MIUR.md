# 📚 Sistema Autocompilazione Profilo da Database MIUR

## 🎯 Obiettivo

Implementare un sistema che recupera automaticamente i dati degli istituti scolastici dal database MIUR e li usa per precompilare il profilo durante la registrazione e nella pagina di modifica.

## 📊 Mappatura Campi

### Da JSON MIUR → Profilo EduNet19

| Campo Profilo | Campo MIUR | Note |
|---------------|------------|------|
| `institute_name` | `DENOMINAZIONESCUOLA` | Nome completo istituto |
| `institute_type` | `DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA` | Normalizzato (vedi sotto) |
| `institute_code` | `CODICESCUOLA` | **Nuovo** - Codice meccanografico univoco |
| `email` | `INDIRIZZOEMAILSCUOLA` | Può essere "Non Disponibile" |
| `website` | `SITOWEBSCUOLA` | Può essere "Non Disponibile" |
| `address` | `INDIRIZZOSCUOLA` | Indirizzo completo |
| `city` | `DESCRIZIONECOMUNE` | Città |
| `province` | `PROVINCIA` | Provincia |
| `cap` | `CAPSCUOLA` | **Nuovo** - CAP |
| `phone` | - | **Manuale** - Non presente in MIUR |
| `miur_data` | Tutti i campi | **Nuovo** - JSON con metadata completi |

## 🔧 Componenti Implementati

### 1. JavaScript: `js/utils/miur-autocomplete.js`

Classe `MIURAutocomplete` con metodi:

#### `loadDatabase()`
Carica tutti i 4 file JSON MIUR in memoria (con cache).

#### `findSchoolByCode(codiceScuola)`
Cerca una scuola specifica per codice meccanografico.

```javascript
const data = await window.miurAutocomplete.findSchoolByCode('TNIC82000X');
// Ritorna: { institute_name, institute_type, email, website, ... }
```

#### `searchSchools(query, limit)`
Cerca scuole per nome o città (per autocomplete).

```javascript
const results = await window.miurAutocomplete.searchSchools('liceo', 10);
// Ritorna: array di max 10 scuole
```

#### `extractSchoolData(school)`
Estrae e normalizza i dati da un record MIUR.

#### `normalizeSchoolType(tipo)`
Normalizza il tipo di istituto filtrando solo tipologie standard.

**Tipologie Riconosciute:**
- Scuola dell'Infanzia
- Scuola Primaria
- Scuola Secondaria di I Grado
- Scuola Secondaria di II Grado
- Liceo
- Istituto Tecnico
- Istituto Professionale
- ITS
- Università

**Tipologie Filtrate (→ "Altro"):**
- PERCORSO II LIVELLO
- SEDE ASSOCIATA
- SEZIONE STACCATA
- CORSO SERALE
- Qualsiasi descrizione non standard

#### `cleanValue(value)`
Pulisce valori "Non Disponibile" → `null`.

#### `validateData(data)`
Valida i dati estratti e ritorna errori/warning.

#### `formatForDatabase(data)`
Formatta i dati per Supabase.

### 2. Database: `database/fixes/add-miur-fields.sql`

Aggiunge 3 nuove colonne a `school_institutes`:

1. **`institute_code`** (TEXT, UNIQUE)
   - Codice meccanografico MIUR
   - Chiave univoca per identificare l'istituto
   - Indice per ricerche veloci

2. **`miur_data`** (JSONB)
   - Tutti i metadata MIUR
   - Permette query JSON avanzate
   - Indice GIN per performance

3. **`cap`** (TEXT)
   - Codice avviamento postale

## 🚀 Flusso di Utilizzo

### Durante la Registrazione

```javascript
// 1. Utente inserisce codice scuola
const codiceScuola = 'TNIC82000X';

// 2. Recupera dati MIUR
const miurData = await window.miurAutocomplete.findSchoolByCode(codiceScuola);

if (miurData) {
  // 3. Valida dati
  const validation = window.miurAutocomplete.validateData(miurData);
  
  if (validation.isValid) {
    // 4. Mostra anteprima all'utente
    showPreview(miurData);
    
    // 5. Utente conferma o modifica
    // ...
    
    // 6. Salva su Supabase
    const dbData = window.miurAutocomplete.formatForDatabase(miurData);
    await supabase.from('school_institutes').insert(dbData);
  }
}
```

### Nella Pagina Edit Profile

```javascript
// 1. Carica profilo esistente
const profile = await loadProfile();

// 2. Se ha institute_code, può ricaricare dati MIUR aggiornati
if (profile.institute_code) {
  const button = document.createElement('button');
  button.textContent = '🔄 Aggiorna da MIUR';
  button.onclick = async () => {
    const freshData = await window.miurAutocomplete.findSchoolByCode(
      profile.institute_code
    );
    // Precompila form con dati aggiornati
    fillForm(freshData);
  };
}
```

## 📋 Struttura Dati

### Oggetto Ritornato da `findSchoolByCode()`

```javascript
{
  // Identificatori
  codice_scuola: "TNIC82000X",
  codice_istituto_riferimento: "TNIC82000X",
  
  // Dati principali
  institute_name: "ISTITUTO COMPRENSIVO TRENTO 2",
  institute_type: "Scuola Secondaria di I Grado",
  
  // Contatti
  email: "segr.ic.tn2@scuole.provincia.tn.it",
  pec: "ic.tn2@pec.provincia.tn.it",
  website: "www.icomenius.it",
  
  // Indirizzo
  address: "VIA MACCANI, 80",
  city: "TRENTO",
  province: "TRENTO",
  cap: "38121",
  
  // Dati aggiuntivi
  regione: "TRENTINO-ALTO ADIGE",
  area_geografica: "NORD EST",
  
  // Metadata
  anno_scolastico: 202526,
  fonte: "MIUR",
  data_import: "2025-11-12T10:30:00.000Z"
}
```

### Salvato su Supabase

```javascript
{
  // Campi diretti
  institute_name: "ISTITUTO COMPRENSIVO TRENTO 2",
  institute_type: "Scuola Secondaria di I Grado",
  institute_code: "TNIC82000X",
  email: "segr.ic.tn2@scuole.provincia.tn.it",
  website: "www.icomenius.it",
  address: "VIA MACCANI, 80",
  city: "TRENTO",
  province: "TRENTO",
  cap: "38121",
  
  // JSON con tutti i metadata
  miur_data: {
    codice_scuola: "TNIC82000X",
    codice_istituto_riferimento: "TNIC82000X",
    pec: "ic.tn2@pec.provincia.tn.it",
    regione: "TRENTINO-ALTO ADIGE",
    area_geografica: "NORD EST",
    anno_scolastico: 202526,
    fonte: "MIUR",
    data_import: "2025-11-12T10:30:00.000Z"
  }
}
```

## ⚡ Performance e Ottimizzazioni

### Cache del Database

Il database MIUR viene caricato **una sola volta** e tenuto in memoria:

```javascript
// Prima chiamata: carica da file (~2-3 secondi)
await window.miurAutocomplete.findSchoolByCode('CODE1');

// Chiamate successive: istantanee (da cache)
await window.miurAutocomplete.findSchoolByCode('CODE2'); // <1ms
```

### Indici Database

```sql
-- Ricerca veloce per codice
CREATE INDEX idx_school_institutes_code 
ON school_institutes(institute_code);

-- Query JSON veloci
CREATE INDEX idx_school_institutes_miur_data 
ON school_institutes USING GIN (miur_data);
```

### Prefetch Opzionale

Per eliminare il delay iniziale, puoi precaricare il database:

```javascript
// All'avvio dell'app
window.addEventListener('DOMContentLoaded', () => {
  // Carica in background
  window.miurAutocomplete.loadDatabase();
});
```

## 🎨 UI/UX Consigliata

### 1. Durante Registrazione

```
┌─────────────────────────────────────┐
│ Codice Meccanografico Scuola        │
│ ┌─────────────────────────────────┐ │
│ │ TNIC82000X              [Cerca] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ✅ Scuola trovata nel database MIUR │
│                                     │
│ 📋 Anteprima Dati:                  │
│ ┌─────────────────────────────────┐ │
│ │ Nome: IC TRENTO 2               │ │
│ │ Tipo: Scuola Sec. I Grado       │ │
│ │ Città: TRENTO (TN)              │ │
│ │ Email: segr.ic.tn2@...          │ │
│ │ Sito: www.icomenius.it          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⚠️ Questi dati provengono dal       │
│    database MIUR e possono essere   │
│    modificati dopo la registrazione │
│                                     │
│ [Conferma e Continua]               │
└─────────────────────────────────────┘
```

### 2. Nella Pagina Edit Profile

```
┌─────────────────────────────────────┐
│ Modifica Profilo                    │
│                                     │
│ 🔄 Dati da MIUR (Codice: TNIC...)  │
│ [Aggiorna da Database MIUR]         │
│                                     │
│ Nome Istituto *                     │
│ ┌─────────────────────────────────┐ │
│ │ IC TRENTO 2                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Tipo Istituto *                     │
│ ┌─────────────────────────────────┐ │
│ │ Scuola Sec. I Grado       [▼]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ... altri campi ...                 │
└─────────────────────────────────────┘
```

## ✅ Checklist Implementazione

### Backend/Database
- [ ] Esegui `database/fixes/add-miur-fields.sql`
- [ ] Verifica colonne: `institute_code`, `miur_data`, `cap`
- [ ] Verifica indici creati

### Frontend
- [ ] Aggiungi `<script src="js/utils/miur-autocomplete.js">` alle pagine
- [ ] Implementa campo "Codice Scuola" in registrazione
- [ ] Implementa bottone "Cerca" che chiama `findSchoolByCode()`
- [ ] Mostra anteprima dati trovati
- [ ] Permetti conferma/modifica prima del salvataggio
- [ ] Aggiungi bottone "Aggiorna da MIUR" in edit-profile
- [ ] Gestisci caso "Scuola non trovata"
- [ ] Gestisci caso "Dati incompleti" (warning)

### Testing
- [ ] Test con codice valido
- [ ] Test con codice non esistente
- [ ] Test con dati "Non Disponibile"
- [ ] Test con tipologie strane (devono diventare "Altro")
- [ ] Test performance caricamento database
- [ ] Test cache (seconda chiamata deve essere istantanea)

## 🔒 Sicurezza e Validazione

### Lato Client
```javascript
// Valida sempre i dati
const validation = window.miurAutocomplete.validateData(data);

if (!validation.isValid) {
  alert('Errori: ' + validation.errors.join(', '));
  return;
}

if (validation.warnings.length > 0) {
  console.warn('Warning:', validation.warnings);
  // Mostra warning ma permetti di continuare
}
```

### Lato Server (RLS Supabase)
```sql
-- Solo l'utente può modificare il proprio profilo
CREATE POLICY "Users can update own institute"
ON school_institutes
FOR UPDATE
USING (auth.uid() = id);
```

## 📊 Vantaggi del Sistema

1. ✅ **Dati Affidabili**: Fonte ufficiale MIUR
2. ✅ **Identificazione Univoca**: Codice meccanografico
3. ✅ **Aggiornamenti Futuri**: Può ricaricare dati aggiornati
4. ✅ **Performance**: Cache in memoria
5. ✅ **Flessibilità**: Utente può sempre modificare
6. ✅ **Metadata Completi**: JSON con tutti i dati MIUR
7. ✅ **Tipologie Normalizzate**: Filtra descrizioni strane

## 🎯 Prossimi Passi

1. Esegui script SQL per aggiungere colonne
2. Includi `miur-autocomplete.js` nelle pagine
3. Implementa UI di ricerca in registrazione
4. Implementa bottone aggiornamento in edit-profile
5. Testa con vari codici scuola
6. Documenta per gli utenti come trovare il codice scuola

---

**Creato**: 12 Novembre 2025  
**Status**: Pronto per implementazione  
**Priorità**: Alta (migliora UX registrazione)
