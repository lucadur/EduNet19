# 🧪 SCRIPT DI TEST - Sistema Recensioni

## 📋 CHECKLIST COMPLETA PER TESTARE IL SISTEMA

Usa questo documento per verificare che tutto funzioni correttamente.

---

## ✅ TEST 1: Visualizzazione Tab Recensioni

### Obiettivo
Verificare che il tab "Recensioni" appaia correttamente nel profilo istituto.

### Passi
1. ✅ Apri il browser e vai su `profile.html?id=UUID_ISTITUTO`
   - Sostituisci `UUID_ISTITUTO` con l'ID di un istituto reale
   
2. ✅ Verifica che nella barra dei tab vedi:
   ```
   [Post] [Progetti] [Info] [Galleria] [⭐ Recensioni]
   ```

3. ✅ Se l'istituto ha recensioni, verifica che appaia il badge:
   ```
   [⭐ Recensioni (24)]
   ```

### Risultato Atteso
- ✅ Il tab "Recensioni" è visibile
- ✅ Ha l'icona stella (⭐)
- ✅ Il badge mostra il numero corretto (se > 0)

### Risultato Ottenuto
- [ ] PASS
- [ ] FAIL - Descrivi problema: _______________

---

## ✅ TEST 2: Apertura Tab Recensioni

### Obiettivo
Verificare che cliccando sul tab si carica il contenuto.

### Passi
1. ✅ Clicca sul tab "⭐ Recensioni"

2. ✅ Apri console browser (F12) e cerca:
   ```
   Loading tab content: reviews
   Loading reviews...
   ```

3. ✅ Verifica che appaia il contenuto:
   - Rating Summary (se ci sono recensioni)
   - Form recensione (se hai permessi)
   - Lista recensioni (se ce ne sono)

### Risultato Atteso
- ✅ Il contenuto carica senza errori
- ✅ Console mostra i log corretti
- ✅ Le sezioni appaiono correttamente

### Risultato Ottenuto
- [ ] PASS
- [ ] FAIL - Descrivi problema: _______________

---

## ✅ TEST 3: Rating Summary

### Obiettivo
Verificare che la sezione Rating Summary mostri i dati corretti.

### Requisiti
- L'istituto deve avere almeno 1 recensione

### Passi
1. ✅ Vai su profilo istituto con recensioni
2. ✅ Clicca tab "Recensioni"
3. ✅ Verifica che vedi:

```
┌─────────────────────────────────┐
│ ⭐ 4.5 su 5                     │
│ Basata su 24 recensioni         │
│                                  │
│ ⭐⭐⭐⭐⭐ (15) ████████████ 62%  │
│ ⭐⭐⭐⭐   (6)  ██████░░░░░ 25%  │
│ ⭐⭐⭐     (2)  ██░░░░░░░░  8%  │
│ ⭐⭐       (1)  █░░░░░░░░░  4%  │
│ ⭐         (0)  ░░░░░░░░░░  0%  │
└─────────────────────────────────┘
```

### Risultato Atteso
- ✅ Media stelle corretta
- ✅ Numero recensioni corretto
- ✅ Distribuzione stelle corretta
- ✅ Grafici a barre visualizzati
- ✅ Percentuali corrette

### Risultato Ottenuto
- [ ] PASS
- [ ] FAIL - Descrivi problema: _______________

---

## ✅ TEST 4: Form Recensione (Istituto → Istituto)

### Obiettivo
Verificare che un istituto possa recensire un altro istituto.

### Requisiti
- Devi essere loggato come **istituto**
- Vai sul profilo di un **altro istituto**

### Passi
1. ✅ Loggati come istituto A
2. ✅ Vai su profilo istituto B: `profile.html?id=UUID_ISTITUTO_B`
3. ✅ Clicca tab "Recensioni"
4. ✅ Verifica che vedi il form:

```
┌─ Lascia una recensione ──────────┐
│ Seleziona rating:                 │
│ ⭐⭐⭐⭐⭐                          │
│                                    │
│ [Scrivi la tua recensione...]      │
│                                    │
│ [Tag: Collaborazione ▼]           │
│                                    │
│         [Pubblica Recensione]     │
└───────────────────────────────────┘
```

5. ✅ Compila il form:
   - Clicca su 5 stelle
   - Scrivi testo: "Test recensione ottima collaborazione!"
   - Seleziona tag: "Collaborazione"
   - Clicca "Pubblica Recensione"

6. ✅ Verifica che:
   - Appare messaggio "✅ Recensione pubblicata!"
   - La recensione appare subito nella lista
   - Il rating summary si aggiorna

### Risultato Atteso
- ✅ Form visibile
- ✅ Invio funziona
- ✅ Recensione appare subito
- ✅ Nessun errore

### Risultato Ottenuto
- [ ] PASS
- [ ] FAIL - Descrivi problema: _______________

---

## ✅ TEST 5: Form Recensione (Privato → Istituto)

### Obiettivo
Verificare che un privato possa recensire un istituto (con moderazione).

### Requisiti
- Devi essere loggato come **privato**
- Vai sul profilo di un **istituto**

### Passi
1. ✅ Loggati come utente privato
2. ✅ Vai su profilo istituto: `profile.html?id=UUID_ISTITUTO`
3. ✅ Clicca tab "Recensioni"
4. ✅ Compila il form:
   - Clicca su 4 stelle
   - Scrivi testo: "Test recensione da privato"
   - Clicca "Invia Recensione"

5. ✅ Verifica che:
   - Appare messaggio "⏳ Recensione inviata! In attesa di approvazione."
   - La recensione NON appare subito nella lista
   - Nessun errore in console

### Risultato Atteso
- ✅ Form visibile
- ✅ Invio funziona
- ✅ Messaggio di attesa appare
- ✅ Recensione non appare (pending)

### Risultato Ottenuto
- [ ] PASS
- [ ] FAIL - Descrivi problema: _______________

---

## ✅ TEST 6: Pannello Moderazione (Admin)

### Obiettivo
Verificare che l'admin possa moderare recensioni da privati.

### Requisiti
- Devi essere loggato come **istituto**
- Vai sul **TUO profilo** (non di altri)
- Ci devono essere recensioni da privati in attesa

### Passi
1. ✅ Loggati come istituto (admin)
2. ✅ Vai sul TUO profilo: `profile.html` (senza parametri)
3. ✅ Clicca tab "Recensioni"
4. ✅ Verifica che in alto appaia:

```
┌─ Recensioni in Attesa di Approvazione ──┐
│                                           │
│ ┌───────────────────────────────────┐   │
│ │ 👤 Mario Rossi                     │   │
│ │ ⭐⭐⭐⭐                            │   │
│ │ "Ottimo istituto!"                 │   │
│ │ [✅ Approva] [❌ Rifiuta]          │   │
│ └───────────────────────────────────┘   │
└───────────────────────────────────────────┘
```

5. ✅ Clicca "✅ Approva" su una recensione
6. ✅ Verifica che:
   - La recensione sparisce dal pannello
   - Appare nella lista recensioni pubbliche
   - Il rating summary si aggiorna

7. ✅ Clicca "❌ Rifiuta" su un'altra recensione
8. ✅ Verifica che:
   - La recensione sparisce completamente
   - Non appare nella lista pubblica

### Risultato Atteso
- ✅ Pannello moderazione visibile (solo sul tuo profilo)
- ✅ Approvazione funziona
- ✅ Rifiuto funziona
- ✅ UI si aggiorna correttamente

### Risultato Ottenuto
- [ ] PASS
- [ ] FAIL - Descrivi problema: _______________

---

## ✅ TEST 7: Lista Recensioni

### Obiettivo
Verificare che la lista recensioni mostri correttamente tutte le recensioni pubbliche.

### Requisiti
- L'istituto deve avere almeno 2-3 recensioni approvate

### Passi
1. ✅ Vai su profilo istituto con recensioni
2. ✅ Clicca tab "Recensioni"
3. ✅ Scorri alla sezione "Recensioni della community"
4. ✅ Verifica che ogni recensione mostri:

```
┌───────────────────────────────────┐
│ 🏫 Nome Istituto Recensore         │
│ [BADGE: Istituto/Privato]          │
│ ⭐⭐⭐⭐⭐                          │
│ "Testo della recensione qui..."   │
│ 🏷️ Tag: Collaborazione            │
│ 📅 2 giorni fa                    │
│ [💬 Rispondi]                     │
└───────────────────────────────────┘
```

5. ✅ Verifica che le recensioni siano ordinate per data (più recenti in alto)

### Risultato Atteso
- ✅ Tutte le recensioni pubbliche sono visibili
- ✅ Ogni recensione ha tutti i dati
- ✅ Avatar e nome corretti
- ✅ Rating visualizzato correttamente
- ✅ Data formattata correttamente

### Risultato Ottenuto
- [ ] PASS
- [ ] FAIL - Descrivi problema: _______________

---

## ✅ TEST 8: Badge Contatore

### Obiettivo
Verificare che il badge contatore recensioni si aggiorni correttamente.

### Passi
1. ✅ Vai su profilo istituto CON recensioni
2. ✅ Verifica che il tab mostri: `[⭐ Recensioni (N)]`
3. ✅ Il numero N corrisponde al totale recensioni pubbliche

4. ✅ Lascia una nuova recensione
5. ✅ Ricarica la pagina (F5)
6. ✅ Verifica che il badge sia aumentato di 1

### Risultato Atteso
- ✅ Badge mostra numero corretto
- ✅ Si aggiorna dopo nuove recensioni
- ✅ Non appare se 0 recensioni

### Risultato Ottenuto
- [ ] PASS
- [ ] FAIL - Descrivi problema: _______________

---

## ✅ TEST 9: Responsive Mobile

### Obiettivo
Verificare che il sistema funzioni correttamente su mobile.

### Passi
1. ✅ Apri DevTools (F12)
2. ✅ Attiva modalità mobile (Ctrl+Shift+M)
3. ✅ Seleziona dispositivo: iPhone 12 Pro
4. ✅ Vai su profilo istituto
5. ✅ Clicca tab "Recensioni"

6. ✅ Verifica che:
   - Tab scorrono orizzontalmente se necessario
   - Form recensione si adatta alla larghezza
   - Liste recensioni sono leggibili
   - Pulsanti sono cliccabili
   - Grafici sono visibili

### Risultato Atteso
- ✅ Layout responsive
- ✅ Tutto cliccabile e leggibile
- ✅ Nessun overflow orizzontale
- ✅ Form utilizzabile

### Risultato Ottenuto
- [ ] PASS
- [ ] FAIL - Descrivi problema: _______________

---

## ✅ TEST 10: Gestione Errori

### Obiettivo
Verificare che gli errori vengano gestiti gracefully.

### Test 10.1: Profilo Non-Istituto
1. ✅ Vai su profilo di un **privato**: `profile.html?id=UUID_PRIVATO`
2. ✅ Clicca tab "Recensioni" (se visibile)
3. ✅ Verifica messaggio:
   ```
   ⭐ Recensioni non disponibili
   Le recensioni sono disponibili solo per gli istituti
   ```

### Test 10.2: Nessuna Connessione Supabase
1. ✅ Disabilita WiFi / Vai offline
2. ✅ Apri profilo istituto → Tab Recensioni
3. ✅ Verifica messaggio errore appropriato

### Test 10.3: Doppia Recensione
1. ✅ Loggato come istituto A
2. ✅ Recensisci istituto B (prima volta)
3. ✅ Prova a recensire di nuovo istituto B
4. ✅ Verifica che appaia: "Hai già recensito questo istituto"

### Risultato Atteso
- ✅ Errori gestiti con messaggi chiari
- ✅ Nessun crash dell'app
- ✅ Console mostra errori descrittivi

### Risultato Ottenuto
- [ ] PASS
- [ ] FAIL - Descrivi problema: _______________

---

## 📊 RIEPILOGO TEST

| Test | Risultato | Note |
|------|-----------|------|
| 1. Visualizzazione Tab | ⬜ | |
| 2. Apertura Tab | ⬜ | |
| 3. Rating Summary | ⬜ | |
| 4. Form Istituto | ⬜ | |
| 5. Form Privato | ⬜ | |
| 6. Moderazione | ⬜ | |
| 7. Lista Recensioni | ⬜ | |
| 8. Badge Contatore | ⬜ | |
| 9. Responsive | ⬜ | |
| 10. Gestione Errori | ⬜ | |

**Legenda:**
- ✅ PASS
- ❌ FAIL
- ⬜ NON TESTATO

---

## 🐛 BUG TROVATI

Documenta qui eventuali bug trovati:

### Bug #1
- **Test:** _______________
- **Descrizione:** _______________
- **Passi per riprodurre:** _______________
- **Risultato atteso:** _______________
- **Risultato ottenuto:** _______________
- **Gravità:** Alta / Media / Bassa

### Bug #2
- **Test:** _______________
- **Descrizione:** _______________
- ...

---

## ✅ CONCLUSIONE TEST

**Data test:** _______________  
**Tester:** _______________  
**Versione:** 1.0  

**Risultato complessivo:**
- [ ] ✅ Tutti i test PASS - Sistema pronto per produzione
- [ ] ⚠️ Alcuni test FAIL - Richiede correzioni minori
- [ ] ❌ Molti test FAIL - Richiede revisione completa

**Note finali:**
_______________________________________________
_______________________________________________
_______________________________________________

