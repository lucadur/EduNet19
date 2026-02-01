# 📸 Galleria Profilo - Guida Rapida

## 🎯 Cos'è

Una bacheca fotografica stile Google per mostrare foto del tuo istituto nel profilo.

---

## ⚡ Setup Veloce

### 1. Database (1 minuto)

Vai su Supabase Dashboard → SQL Editor:

```sql
-- Copia e incolla tutto il contenuto di profile-gallery-setup.sql
-- Poi clicca "Run"
```

✅ Fatto! Tabella e storage creati.

---

## 🚀 Come Usare

### Caricare Foto:

1. Vai al tuo profilo
2. Click tab **"Galleria"**
3. Click **"Aggiungi Foto"**
4. Trascina foto o click per selezionare
5. (Opzionale) Aggiungi didascalia
6. Click **"Carica Foto"**

### Visualizzare:

- Click su una foto → Si apre a schermo intero
- Usa frecce o tastiera per navigare
- ESC per chiudere

### Eliminare:

- Hover su foto
- Click icona cestino
- Conferma eliminazione

---

## 📏 Limiti

- **Max 20 foto** per profilo
- **Max 5MB** per foto
- **Formati:** JPG, PNG, GIF

---

## 🎨 Design

Stile **bacheca/polaroid**:
- Foto con rotazioni casuali
- Effetto 3D al hover
- Overlay con info
- Grid responsive

---

## 📱 Responsive

- **Desktop:** 3-4 colonne
- **Tablet:** 2-3 colonne
- **Mobile:** 2 colonne

---

## ✅ Checklist

- [ ] Esegui `profile-gallery-setup.sql`
- [ ] Ricarica pagina profilo
- [ ] Vai su tab "Galleria"
- [ ] Carica prima foto
- [ ] Testa lightbox
- [ ] Testa eliminazione

---

## 🐛 Problemi?

### Foto non si carica:
- Controlla dimensione < 5MB
- Verifica formato immagine
- Controlla console browser

### Non vedo tab Galleria:
- Ricarica pagina
- Controlla `profile-gallery.css` e `.js` caricati

### Errore 20 foto:
- Hai raggiunto il limite
- Elimina foto vecchie per aggiungerne nuove

---

## 🎉 Pronto!

La tua bacheca fotografica è attiva!

**Inizia a caricare foto del tuo istituto** 📸

---

**File da eseguire:** `profile-gallery-setup.sql`  
**Documentazione completa:** `PROFILE_GALLERY_IMPLEMENTATION.md`
