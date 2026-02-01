# Fix Validazione MIUR e Nomi Utenti

## Data: 27/11/2025

## Problemi Risolti

### 1. Nomi utenti privati mostravano l'email
- **Problema**: Gli utenti privati senza metadata mostravano la parte dell'email come nome (es. "Bizarre.ermine.qyob")
- **Soluzione**: Modificato il fallback per usare "Utente" invece dell'email
- **File modificati**:
  - `js/auth/auth.js`
  - `js/utils/homepage-script.js`
  - `js/profile/profile-page.js`
- **Database**: Eseguito script `fix-private-users-names.sql` per correggere dati esistenti

### 2. Istituti falsi visibili nella ricerca
- **Problema**: Account test come "Jssd9" apparivano nei risultati di ricerca
- **Soluzione**: Creato validatore MIUR che verifica se un istituto esiste nel database MIUR
- **File creato**: `js/utils/miur-validator.js`
- **Integrazione**: Aggiunto filtro in `homepage-script.js` e `global-search.js`

### 3. Contrasto tema scuro per upload immagini
- **Problema**: L'overlay di caricamento immagini non era visibile in tema scuro
- **Soluzione**: Aggiunto supporto per classe `.dark-theme` oltre a `[data-theme="dark"]`
- **File modificato**: `css/components/upload-progress.css`

## Validatore MIUR

Il nuovo validatore (`js/utils/miur-validator.js`) offre:

1. **Validazione per codice meccanografico** - Verifica esatta nel database MIUR
2. **Validazione per nome** - Ricerca fuzzy con confidence score
3. **Rilevamento pattern sospetti** - Identifica nomi che sembrano account fake
4. **Verifica email istituzionale** - Bonus per email @istruzione.it

### Criteri di filtraggio
- `confidence >= 0.5`: Istituto valido
- `confidence >= 0.3`: Ha keywords scolastiche, mostrato con cautela
- `confidence < 0.3`: Filtrato dalla ricerca

## File Modificati

```
js/auth/auth.js
js/utils/homepage-script.js
js/profile/profile-page.js
js/utils/global-search.js
js/utils/miur-validator.js (nuovo)
css/components/upload-progress.css
homepage.html
pages/main/create.html
pages/profile/profile.html
pages/profile/settings.html
database/fixes/fix-private-users-names.sql (nuovo)
```
