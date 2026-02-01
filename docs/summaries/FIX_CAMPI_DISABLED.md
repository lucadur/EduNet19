# ✅ Fix Campi Disabled - Registrazione Istituto

## ❌ Problema Critico

**Errore**: "Tutti i campi obbligatori devono essere compilati"

**Causa Root**: Il campo `instituteType` viene reso `disabled = true` quando compilato dal database MIUR. I campi disabled NON vengono inviati nel FormData!

## 🔍 Analisi Tecnica

### Comportamento FormData

```javascript
// Form con campo disabled
<select name="instituteType" disabled>
  <option value="scuola-primaria">Scuola Primaria</option>
</select>

// FormData
const formData = new FormData(form);
console.log(formData.get('instituteType')); // null ❌
```

**Regola HTML**: Campi `disabled` non vengono inviati nel submit del form.

### Codice Problematico

**js/auth/registration-miur.js** (riga 161-165):
```javascript
// PRIMA (SBAGLIATO)
const typeSelect = document.getElementById('instituteType');
if (typeSelect && data.institute_type) {
  typeSelect.value = data.institute_type;
  typeSelect.disabled = true; // ❌ Campo non inviato!
}
```

### Flusso Problematico

```
1. Utente cerca codice MIUR
2. Sistema compila nome e tipo
3. Campo tipo → disabled = true
4. Utente compila email e password
5. Click "Registrati"
6. FormData raccoglie dati:
   - instituteName: ✅ "TRENTO-MARTIGNANO..."
   - instituteType: ❌ undefined (disabled!)
   - email: ✅ "admin@scuola.it"
   - password: ✅ "********"
7. Validazione fallisce: instituteType mancante
8. Errore: "Tutti i campi obbligatori..."
```

## ✅ Soluzione Implementata

### 1. Campo Hidden per instituteType

Quando il select viene disabilitato, creo un campo hidden con lo stesso nome che contiene il valore:

```javascript
// DOPO (CORRETTO)
const typeSelect = document.getElementById('instituteType');
if (typeSelect && data.institute_type) {
  typeSelect.value = data.institute_type;
  
  // Crea campo hidden per inviare il valore
  let hiddenType = document.getElementById('institute-type-hidden');
  if (!hiddenType) {
    hiddenType = document.createElement('input');
    hiddenType.type = 'hidden';
    hiddenType.id = 'institute-type-hidden';
    hiddenType.name = 'instituteType'; // Stesso nome del select
    typeSelect.parentNode.appendChild(hiddenType);
  }
  hiddenType.value = data.institute_type;
  
  // Disabilita visivamente il select
  typeSelect.disabled = true;
  typeSelect.style.backgroundColor = '#f5f5f5';
}
```

### 2. Fix Conflitto Nome Campi

**Problema**: Campo hidden `instituteCode` duplicato

**index.html** (riga 581):
```html
<!-- PRIMA -->
<input type="hidden" name="instituteCode"> <!-- Conflitto! -->

<!-- DOPO -->
<input type="hidden" name="instituteCodeMiur"> <!-- Nome univoco -->
```

### 3. Debug Logging

Aggiunto logging in `auth.js` per debug futuro:

```javascript
console.log('📋 Dati form ricevuti:', formData);
console.log('📋 Campi obbligatori:', {
  instituteName: formData.instituteName,
  instituteType: formData.instituteType,
  email: formData.email,
  password: formData.password ? '***' : undefined
});
```

## 🎯 Flusso Corretto

### Con Dati MIUR

```
1. Utente cerca codice MIUR
2. Sistema compila nome e tipo
3. Campo tipo → disabled = true
4. Campo hidden → instituteType = "scuola-primaria"
5. Utente compila email e password
6. Click "Registrati"
7. FormData raccoglie dati:
   - instituteName: ✅ "TRENTO-MARTIGNANO..."
   - instituteType: ✅ "scuola-primaria" (da hidden!)
   - email: ✅ "admin@scuola.it"
   - password: ✅ "********"
8. Validazione passa ✅
9. Registrazione completata ✅
```

## 📊 File Modificati

### 1. js/auth/registration-miur.js

**Riga 161-177**:
- Aggiunto creazione campo hidden per `instituteType`
- Mantenuto `disabled` sul select per UX
- Campo hidden invia il valore nel FormData

### 2. index.html

**Riga 575-581**:
- Rinominato `name="instituteCode"` → `name="instituteCodeMiur"`
- Rinominato `name="instituteEmail"` → `name="instituteEmailMiur"`
- Evitati conflitti con campi visibili

### 3. js/auth/auth.js

**Riga 217-235**:
- Aggiunto logging debug per troubleshooting
- Log dati ricevuti
- Log campi mancanti se validazione fallisce

## 🧪 Test

### Test Case 1: Con MIUR

**Input**: Codice MIUR valido
**Azione**: 
1. Inserisci codice
2. Click cerca
3. Compila email e password
4. Click registrati

**Risultato Atteso**:
- ✅ Nome compilato e readonly
- ✅ Tipo compilato e disabled (visivamente)
- ✅ Campo hidden con tipo creato
- ✅ FormData contiene tutti i campi
- ✅ Validazione passa
- ✅ Registrazione completata

### Test Case 2: Senza MIUR

**Input**: Nessun codice MIUR
**Azione**:
1. Compila manualmente tutti i campi
2. Click registrati

**Risultato Atteso**:
- ✅ Tutti i campi editabili
- ✅ Nessun campo hidden creato
- ✅ FormData contiene tutti i campi
- ✅ Validazione passa
- ✅ Registrazione completata

## 💡 Perché Questa Soluzione

### Alternative Considerate

**1. Readonly sul Select**
```javascript
typeSelect.readOnly = true; // ❌ Non esiste per <select>
```
Problema: `readonly` non è supportato su `<select>`.

**2. Rimuovere Disabled**
```javascript
typeSelect.disabled = false;
typeSelect.style.pointerEvents = 'none';
```
Problema: Utente può ancora modificare con tastiera (Tab + Arrow keys).

**3. Campo Hidden (SCELTA)**
```javascript
// Select disabled per UX
typeSelect.disabled = true;

// Hidden field per FormData
<input type="hidden" name="instituteType" value="...">
```
Vantaggi:
- ✅ Select visivamente disabled
- ✅ Valore inviato nel FormData
- ✅ Utente non può modificare
- ✅ Compatibile con tutti i browser

## 📝 Note Tecniche

### FormData e Campi Disabled

**Specifica HTML**:
> "Form controls that are disabled are not submitted."

**Campi NON inviati**:
- `<input disabled>`
- `<select disabled>`
- `<textarea disabled>`
- `<button disabled>`

**Campi inviati**:
- `<input readonly>` (solo input/textarea)
- `<input type="hidden">`

### Creazione Dinamica Campo Hidden

```javascript
// Verifica se esiste già
let hiddenType = document.getElementById('institute-type-hidden');

// Crea solo se non esiste
if (!hiddenType) {
  hiddenType = document.createElement('input');
  hiddenType.type = 'hidden';
  hiddenType.id = 'institute-type-hidden';
  hiddenType.name = 'instituteType';
  typeSelect.parentNode.appendChild(hiddenType);
}

// Aggiorna valore
hiddenType.value = data.institute_type;
```

Questo previene duplicati se l'utente cerca più volte.

### Stile Visivo Disabled

```javascript
typeSelect.disabled = true;
typeSelect.style.backgroundColor = '#f5f5f5';
```

Il select appare disabilitato ma il valore viene inviato tramite hidden field.

## 🚀 Deployment

### Checklist

- [x] Aggiunto campo hidden per instituteType
- [x] Rinominati campi hidden duplicati
- [x] Aggiunto logging debug
- [x] Testato con MIUR
- [x] Testato senza MIUR
- [x] Verificato FormData contiene tutti i campi
- [x] Documentato fix

### Hard Refresh

```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

## ✅ Risultato Finale

**Prima**: 
- ❌ Campo tipo disabled
- ❌ Valore non inviato
- ❌ Validazione fallisce
- ❌ Registrazione impossibile

**Dopo**:
- ✅ Campo tipo disabled (visivamente)
- ✅ Valore inviato tramite hidden
- ✅ Validazione passa
- ✅ Registrazione funziona

---

**Problema**: Campo disabled non inviato  
**Fix**: Campo hidden con stesso nome  
**Status**: ✅ Risolto  
**Beneficio**: Registrazione funzionante
