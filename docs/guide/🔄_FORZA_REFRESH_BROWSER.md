# 🔄 Forza Refresh Browser - Istruzioni

## ⚠️ Problema Cache Browser

Il browser potrebbe aver memorizzato nella cache la vecchia versione dei file JavaScript con i path errati.

## ✅ Soluzione: Hard Refresh

### Windows/Linux
```
Ctrl + Shift + R
oppure
Ctrl + F5
```

### Mac
```
Cmd + Shift + R
oppure
Cmd + Option + R
```

### Alternativa: Cancella Cache

1. Apri DevTools (F12)
2. Click destro sul pulsante Refresh
3. Seleziona "Empty Cache and Hard Reload"

## 🎯 Verifica Fix

Dopo il refresh, verifica che:

### 1. Pubblicazione Contenuti
```
1. Vai a http://localhost:8000/pages/main/create.html
2. Compila form e pubblica
3. ✅ Dovresti essere reindirizzato a: http://localhost:8000/homepage.html
4. ❌ NON a: http://localhost:8000/pages/main/homepage.html
```

### 2. Condividi Progetto
```
1. Vai a http://localhost:8000/pages/profile/profile.html
2. Tab "Progetti"
3. Click "Condividi un progetto"
4. ✅ Dovresti andare a: http://localhost:8000/pages/main/create.html
5. ❌ NON a: http://localhost:8000/pages/profile/homepage.html
```

### 3. Scopri Istituti
```
1. Vai a http://localhost:8000/pages/profile/connections.html
2. Click "Scopri Istituti"
3. ✅ Dovresti andare a: http://localhost:8000/homepage.html
4. ❌ NON a: http://localhost:8000/pages/profile/homepage.html
```

## 🔍 Debug

Se il problema persiste dopo il refresh:

### 1. Verifica Console
```
1. Apri DevTools (F12)
2. Tab Console
3. Cerca errori 404
4. Verifica il path richiesto
```

### 2. Verifica Network
```
1. Apri DevTools (F12)
2. Tab Network
3. Filtra per JS
4. Verifica che create-page.js?v=5.0 sia caricato
5. Se vedi v=4.1, la cache non è stata pulita
```

### 3. Verifica Codice
```
1. Apri DevTools (F12)
2. Tab Sources
3. Cerca create-page.js
4. Verifica riga 621:
   ✅ window.location.href = window.location.origin + '/homepage.html';
   ❌ window.location.href = '/homepage.html';
```

## 🚀 Versioning Aggiornato

Ho aggiornato il versioning per forzare il reload:

**pages/main/create.html:**
```html
<!-- Prima -->
<script src="../../js/utils/create-page.js?v=4.1" defer></script>

<!-- Dopo -->
<script src="../../js/utils/create-page.js?v=5.0" defer></script>
```

## 💡 Perché Succede

Il browser memorizza i file JavaScript nella cache per velocizzare il caricamento. Quando modifichi il codice, il browser potrebbe continuare a usare la vecchia versione.

### Soluzioni Permanenti

1. **Versioning**: Cambia `?v=X.X` ogni volta che modifichi il file
2. **Cache-Control**: Configura header HTTP per disabilitare cache in sviluppo
3. **DevTools**: Tieni aperto DevTools con "Disable cache" attivo

## ✅ Codice Corretto

Il codice nei file è già corretto:

### js/utils/create-page.js (riga 621)
```javascript
window.location.href = window.location.origin + '/homepage.html';
```

### pages/profile/profile.html (riga 402)
```html
<a href="../../pages/main/create.html" class="btn-primary">
    Condividi un progetto
</a>
```

### js/social/connections.js (riga 133)
```javascript
<a href="../../homepage.html" class="btn btn-primary">
    Scopri Istituti
</a>
```

## 🎯 Prossimi Passi

1. ✅ Fai Hard Refresh (Ctrl+Shift+R)
2. ✅ Verifica che funzioni
3. ✅ Se persiste, cancella cache browser
4. ✅ Se ancora persiste, riavvia browser
5. ✅ Se ancora persiste, riavvia server

---

**Aggiornato**: 12 Novembre 2025  
**Versione**: 5.0  
**Status**: Codice corretto, cache da pulire
