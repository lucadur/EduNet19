# 📋 SISTEMA DI VERIFICA ISTITUTI - PIANO IMPLEMENTAZIONE

## 🎯 OBIETTIVO
Creare un sistema di autocomplete live che verifica gli istituti contro database JSON ufficiali durante la registrazione.

## 📁 STRUTTURA FILE

```
/data/
  ├── scuole-infanzia.json
  ├── scuole-primarie.json
  ├── scuole-secondarie.json
  └── universita.json

/js/
  └── institute-verification.js  (nuovo)
```

## 🔧 FUNZIONALITÀ

### 1. Autocomplete Live
- Ricerca fuzzy mentre l'utente digita
- Mostra max 10 risultati più pertinenti
- Evidenzia il testo che corrisponde
- Dropdown con risultati formattati

### 2. Verifica Istituto
- Controlla se l'istituto esiste nei JSON ufficiali
- Badge "✓ Verificato" per istituti ufficiali
- Possibilità di registrare istituti non verificati

### 3. Auto-compilazione
- Quando seleziona un istituto, compila automaticamente:
  - Nome completo
  - Tipo istituto
  - Indirizzo
  - Città
  - Provincia
  - Codice meccanografico

### 4. UX
- Dropdown elegante con scroll
- Icone per tipo istituto
- Colori diversi per stato verifica
- Animazioni smooth

## 📊 FORMATO JSON ATTESO

```json
[
  {
    "nome": "Liceo Scientifico Galileo Galilei",
    "tipo": "Liceo",
    "indirizzo": "Via Roma 123",
    "citta": "Milano",
    "provincia": "MI",
    "cap": "20100",
    "codice_meccanografico": "MIPC01000A",
    "email": "liceo.galilei@istruzione.it"
  }
]
```

## 🚀 IMPLEMENTAZIONE

### STEP 1: Crea cartella data e aggiungi i JSON
### STEP 2: Crea institute-verification.js
### STEP 3: Modifica index.html per integrare l'autocomplete
### STEP 4: Aggiungi stili CSS per il dropdown
### STEP 5: Testa con dati reali

## ✅ VANTAGGI

- ✅ Riduce errori di digitazione
- ✅ Dati più accurati
- ✅ UX migliore
- ✅ Badge di verifica aumenta credibilità
- ✅ Auto-compilazione risparmia tempo
