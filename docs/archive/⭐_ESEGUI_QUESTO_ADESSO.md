# ⭐ ISTRUZIONI RAPIDE - Sistema Recensioni

## Situazione Attuale

Hai già eseguito lo script principale ma ci sono stati errori. Ecco come procedere:

---

## OPZIONE 1: Ricomincia da Zero (CONSIGLIATO)

### Step 1: Cleanup
Esegui su Supabase SQL Editor:
```sql
⭐_CLEANUP_E_RICREA_RECENSIONI.sql
```

### Step 2: Crea Sistema
Esegui su Supabase SQL Editor:
```sql
⭐_CREA_SISTEMA_VALUTAZIONI.sql
```

---

## OPZIONE 2: Continua con quello che hai

Se la tabella `institute_reviews` esiste già, esegui solo questo:

```sql
-- Aggiungi colonne mancanti a user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS rating_average NUMERIC(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Ricrea funzioni corrette
-- Copia e incolla dalla riga 119 alla riga 260 di ⭐_CREA_SISTEMA_VALUTAZIONI.sql
```

---

## Verifica Installazione

Dopo aver eseguito gli script, verifica con:

```sql
-- 1. Verifica tabella
SELECT COUNT(*) FROM institute_reviews;

-- 2. Verifica colonne user_profiles
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('rating_average', 'rating_count');

-- 3. Verifica funzioni
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%review%' 
OR routine_name LIKE '%rating%';
```

Se tutte e 3 le query restituiscono risultati, sei pronto! ✅

---

## Prossimo Passo

Dopo l'installazione, integra nel frontend seguendo:
```
⭐_GUIDA_SISTEMA_RECENSIONI.md
```

---

**Consiglio**: Usa OPZIONE 1 per evitare conflitti.
