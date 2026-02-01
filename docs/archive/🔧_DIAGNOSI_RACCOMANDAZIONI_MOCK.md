# 🔧 DIAGNOSI: Raccomandazioni Mock vs Reali

## 🎯 Problema Segnalato

> "Il sistema di match EduMatch raccomanda solo istituti e profili studente di tipo mock, e non quelli che sono realmente esistenti e creati."

## 🔍 DIAGNOSI RAPIDA

### STEP 1: Verifica Database

Apri Supabase SQL Editor ed esegui:

```sql
-- Conta istituti reali
SELECT COUNT(*) as istituti_totali FROM school_institutes;

-- Mostra istituti
SELECT 
  institute_name,
  institute_type,
  city,
  CASE WHEN description IS NOT NULL THEN '✅' ELSE '❌' END as ha_bio
FROM school_institutes
ORDER BY created_at DESC
LIMIT 10;
```

**Risultato atteso:**
- Se vedi `istituti_totali: 0` → **Non ci sono istituti reali**
- Se vedi istituti ma con `ha_bio: ❌` → **Istituti incompleti**

### STEP 2: Debug nel Browser

1. **Apri la homepage**
2. **Apri console** (F12)
3. **Incolla questo codice:**

```javascript
// Copia tutto il contenuto di: 🔍_DEBUG_RACCOMANDAZIONI.js
```

4. **Premi Invio**

**Cosa cercare:**
```
✅ Trovati X istituti
📊 RISULTATO: Y raccomandazioni
```

Se `X = 0` → Non ci sono istituti nel database
Se `Y = 0` ma `X > 0` → Gli istituti esistono ma non generano raccomandazioni

## 🎯 CAUSE POSSIBILI

### Causa 1: Nessun Istituto nel Database ⭐ (Più Probabile)

**Sintomo:**
```
⚠️ NESSUN ISTITUTO NEL DATABASE!
```

**Soluzione:**
Registra 2-3 istituti manualmente:

1. Vai su pagina registrazione
2. Seleziona "Istituto Scolastico"
3. Compila tutti i campi
4. Registrati
5. Completa il profilo

**Guida:** `📝_REGISTRA_ISTITUTI_MANUALMENTE.md`

### Causa 2: Istituti Incompleti

**Sintomo:**
```
✅ Trovati 3 istituti
📊 RISULTATO: 0 raccomandazioni
```

**Soluzione:**
Completa i dati mancanti:

```sql
-- Esegui: 🔍_VERIFICA_E_USA_DATI_ESISTENTI.sql
```

### Causa 3: Tutti gli Istituti Già Seguiti

**Sintomo:**
```
✅ Trovati 5 istituti
📌 Stai seguendo 5 istituti
📊 RISULTATO: 0 raccomandazioni
```

**Soluzione:**
Il sistema esclude gli istituti già seguiti. Registra altri istituti o smetti di seguirne alcuni.

### Causa 4: Dati Mock Hardcoded (Improbabile)

**Sintomo:**
Vedi sempre gli stessi istituti con nomi generici tipo "Istituto Test 1"

**Verifica:**
```javascript
// Nella console
console.log(window.recommendationUI.recommendations);
```

Se vedi `id` che iniziano con "mock-" → Ci sono dati mock

**Soluzione:**
Cerca nel codice "mock" o dati hardcoded:

```bash
# Cerca file con dati mock
grep -r "mock" *.js
grep -r "Istituto Test" *.js
```

## 🔧 SOLUZIONI IMMEDIATE

### Soluzione A: Registra Istituti Reali (5 minuti)

**La più semplice e sicura:**

1. Registra 3 istituti con dati reali
2. Compila profili completi
3. Ricarica homepage
4. Verifica raccomandazioni

### Soluzione B: Usa Script SQL (30 secondi)

**Se hai già istituti registrati:**

```sql
-- Esegui: 🔍_VERIFICA_E_USA_DATI_ESISTENTI.sql
```

Questo completa automaticamente i dati mancanti.

### Soluzione C: Debug Approfondito

**Se le soluzioni A e B non funzionano:**

1. Esegui script debug nel browser
2. Copia l'output completo
3. Inviamelo per analisi

## 📊 VERIFICA FINALE

Dopo aver applicato la soluzione:

### 1. Verifica Database
```sql
SELECT COUNT(*) FROM school_institutes;
-- Dovrebbe essere > 0
```

### 2. Verifica Console Browser
```
🎯 Getting recommendations for user: xxx
✅ Found X institutes
```

### 3. Verifica UI
Dovresti vedere card con:
- Nome istituto reale
- Città reale
- Pulsante "Segui"

## 🎯 CHECKLIST DIAGNOSTICA

- [ ] Ho verificato il database (SQL)
- [ ] Ho eseguito lo script debug (browser)
- [ ] Ho controllato quanti istituti esistono
- [ ] Ho verificato se gli istituti hanno dati completi
- [ ] Ho controllato se sto già seguendo tutti gli istituti
- [ ] Ho cercato dati "mock" nel codice
- [ ] Ho provato a registrare un nuovo istituto
- [ ] Ho ricaricato la homepage (Ctrl+F5)

## 🚨 SE NULLA FUNZIONA

Inviami:

1. **Output SQL:**
```sql
SELECT COUNT(*) FROM school_institutes;
SELECT * FROM school_institutes LIMIT 3;
```

2. **Output Debug Browser:**
```
Copia tutto l'output dello script debug
```

3. **Screenshot:**
- Sezione raccomandazioni homepage
- Console browser con errori

## 💡 NOTA IMPORTANTE

Il codice **NON contiene dati mock hardcoded**. Fa query dirette al database:

```javascript
// recommendation-engine.js - linea ~400
async getCandidates() {
  const { data: candidates } = await this.supabase
    .from('school_institutes')  // ← Query reale al DB
    .select('*')
    .limit(50);
  
  return candidates || [];
}
```

Se vedi dati "mock", significa che:
1. Non ci sono dati reali nel database
2. C'è un altro script che inserisce dati mock
3. Stai guardando una versione vecchia del codice

## 🎉 CONCLUSIONE

Nella maggior parte dei casi, il problema è semplicemente che **non ci sono istituti nel database**.

**Soluzione rapida:**
1. Registra 2-3 istituti manualmente
2. Ricarica homepage
3. Funziona! ✨
