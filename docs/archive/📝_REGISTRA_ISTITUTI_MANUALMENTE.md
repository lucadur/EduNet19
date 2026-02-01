# 📝 REGISTRA ISTITUTI MANUALMENTE - Guida Rapida

## 🎯 Soluzione Più Semplice

Invece di creare dati di test via SQL (che richiede gestione complessa di auth.users), **registra manualmente 2-3 istituti** dall'interfaccia web.

## 🚀 PROCEDURA RAPIDA (5 minuti)

### STEP 1: Registra Primo Istituto

1. **Apri** la pagina di registrazione
2. **Seleziona** "Istituto Scolastico"
3. **Compila**:
   - Email: `test.liceo1@example.com`
   - Password: `Test123456!`
   - Nome istituto: `Liceo Scientifico Galilei`
4. **Registrati**

### STEP 2: Completa il Profilo

1. **Vai** su "Modifica Profilo"
2. **Compila**:
   - Tipo istituto: `Liceo Scientifico`
   - Bio: `Eccellenza nella formazione scientifica`
   - Città: `Milano`
   - Provincia: `MI`
3. **Salva**

### STEP 3: Ripeti per Altri 2 Istituti

**Istituto 2:**
- Email: `test.tecnico@example.com`
- Nome: `Istituto Tecnico Da Vinci`
- Tipo: `Istituto Tecnico`
- Città: `Roma`

**Istituto 3:**
- Email: `test.classico@example.com`
- Nome: `Liceo Classico Manzoni`
- Tipo: `Liceo Classico`
- Città: `Torino`

### STEP 4: Testa le Raccomandazioni

1. **Logout** dagli account istituto
2. **Login** con un account studente
3. **Vai** sulla homepage
4. **Verifica** la sezione "Scopri"
5. **Dovresti vedere** i 3 istituti! ✨

## ⚡ ALTERNATIVA: Usa Dati Esistenti

Se hai già istituti registrati ma senza dati completi:

```sql
-- Esegui: 🚀_AGGIUNGI_ISTITUTI_FUNZIONANTE.sql
-- Questo completa automaticamente i dati mancanti
```

## 🧪 VERIFICA

Dopo la registrazione, verifica nel database:

```sql
SELECT 
  institute_name,
  city,
  description
FROM school_institutes
ORDER BY created_at DESC;
```

## 🎉 Sistema Automatico Attivo

Una volta che hai almeno 1 istituto:

✅ **Ogni nuovo istituto** registrato appare automaticamente
✅ **Ogni nuovo studente** registrato appare automaticamente
✅ **Tempo reale** - nessun ritardo
✅ **Nessuna configurazione** aggiuntiva

## 💡 Perché Manualmente?

La registrazione manuale è più semplice perché:

1. **Gestisce automaticamente** `auth.users`
2. **Crea automaticamente** `user_profiles`
3. **Crea automaticamente** `school_institutes`
4. **Trigger automatici** gestiscono tutto
5. **Nessun errore** di foreign key

## 🔮 Prossimi Passi

Dopo aver registrato gli istituti:

1. **Testa** le raccomandazioni
2. **Verifica** che appaiano nella homepage
3. **Registra** un nuovo istituto per testare l'automatismo
4. **Conferma** che appare subito nelle raccomandazioni

## 📊 Vantaggi

- ✅ Veloce (5 minuti)
- ✅ Nessun errore SQL
- ✅ Dati realistici
- ✅ Testa anche il flusso di registrazione
- ✅ Verifica che i trigger funzionino

## 🎯 Conclusione

**La registrazione manuale è il modo più semplice e sicuro** per avere dati di test nel database.

Dopo aver registrato 2-3 istituti, il sistema di raccomandazioni funzionerà perfettamente! 🚀
