# 🔒 ABILITA LEAKED PASSWORD PROTECTION

## 🎯 Warning

```
Leaked Password Protection Disabled
```

Supabase può verificare se le password sono state compromesse usando HaveIBeenPwned.org.

## ✅ Soluzione (1 minuto)

### Via Dashboard (Consigliato)

1. **Apri Supabase Dashboard**
2. **Vai su Authentication** → **Policies**
3. **Trova "Password Security"**
4. **Abilita "Leaked Password Protection"** ✅
5. **Salva**

### Cosa Fa

Quando un utente si registra o cambia password, Supabase verifica se quella password è stata compromessa in data breach noti. Se sì, blocca la registrazione e chiede una password diversa.

## 📊 Benefici

- ✅ Previene uso di password compromesse
- ✅ Migliora sicurezza account utenti
- ✅ Nessun impatto sulle performance
- ✅ Privacy preservata (usa k-anonymity)

## 🔍 Come Funziona

1. Utente inserisce password
2. Supabase calcola hash SHA-1
3. Invia primi 5 caratteri dell'hash a HaveIBeenPwned
4. Riceve lista di hash compromessi che iniziano con quei 5 caratteri
5. Verifica localmente se l'hash completo è nella lista
6. Se compromessa → Blocca e chiede password diversa

**Privacy**: La password completa non viene mai inviata!

## 📋 Checklist

- [ ] Aperto Supabase Dashboard
- [ ] Andato su Authentication → Policies
- [ ] Trovato "Password Security"
- [ ] Abilitato "Leaked Password Protection"
- [ ] Salvato
- [ ] ✅ Warning risolto!

---

**Abilita questa feature per maggiore sicurezza! 🔒**
