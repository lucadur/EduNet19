# 🚀 GUIDA IMPLEMENTAZIONE SINCRONIZZAZIONE DATI ISTITUTO

## 📋 STEP DA SEGUIRE IN ORDINE

### **STEP 1: Database** ✅ PRONTO
Esegui questo SQL in Supabase:
```
⚡_AGGIUNGI_COLONNE_ISTITUTI.sql
```

Questo aggiunge le colonne:
- email
- address  
- city
- province
- website
- phone

---

### **STEP 2: Modificare Registrazione**

#### **A) HTML - Aggiungere campi hidden**

Nel form di registrazione (index.html o dove hai il form), aggiungi questi campi hidden:

```html
<!-- Campi hidden per dati istituto dall'autocomplete -->
<input type="hidden" id="institute-email-hidden" name="instituteEmail">
<input type="hidden" id="institute-address-hidden" name="instituteAddress">
<input type="hidden" id="institute-city-hidden" name="instituteCity">
<input type="hidden" id="institute-province-hidden" name="instituteProvince">
<input type="hidden" id="institute-website-hidden" name="instituteWebsite">
<input type="hidden" id="institute-phone-hidden" name="institutePhone">
```

#### **B) JavaScript Autocomplete**

Nel file `institute-autocomplete.js`, quando l'utente seleziona un istituto, popola i campi hidden:

```javascript
// Quando viene selezionato un istituto
function handleInstituteSelect(institute) {
    // Campi visibili (già esistenti)
    document.getElementById('institute-name').value = institute.DENOMINAZIONESCUOLA;
    document.getElementById('institute-type').value = institute.DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA;
    
    // NUOVO: Popola campi hidden
    document.getElementById('institute-email-hidden').value = institute.INDIRIZZOEMAILSCUOLA || '';
    document.getElementById('institute-address-hidden').value = institute.INDIRIZZOSCUOLA || '';
    document.getElementById('institute-city-hidden').value = institute.DENOMINAZIONECOMUNE || '';
    document.getElementById('institute-province-hidden').value = institute.SIGLAPROVINCIA || '';
    document.getElementById('institute-website-hidden').value = institute.SITOWEBSCUOLA || '';
    document.getElementById('institute-phone-hidden').value = institute.TELEFONO || '';
}
```

#### **C) auth.js - Salvare tutti i dati**

Nella funzione `registerInstitute()`, modifica l'insert per includere tutti i campi:

```javascript
// Crea i dati specifici dell'istituto
const { data: instituteData, error: instituteError } = await this.supabase
    .from('school_institutes')
    .insert([{
        id: authData.user.id,
        institute_name: formData.instituteName,
        institute_type: formData.instituteType,
        email: formData.instituteEmail || formData.email, // Email istituto o email registrazione
        address: formData.instituteAddress || null,
        city: formData.instituteCity || null,
        province: formData.instituteProvince || null,
        website: formData.instituteWebsite || null,
        phone: formData.institutePhone || null,
        verified: formData.instituteEmail ? true : false // Verificato se ha dati da autocomplete
    }])
    .select()
    .single();
```

---

### **STEP 3: Mostrare Dati in Tab Info**

#### **A) profile-page.js - Caricare dati**

Nella funzione che carica il profilo istituto, assicurati di selezionare tutti i campi:

```javascript
async loadInstituteProfile() {
    const { data: profile, error } = await this.supabase
        .from('school_institutes')
        .select('*') // Seleziona TUTTI i campi
        .eq('id', this.profileUserId || this.currentUser.id)
        .single();
        
    if (error) throw error;
    return profile;
}
```

#### **B) profile-page.js - Popolare tab Info**

Nella funzione `updateAboutTab()` o simile, popola i campi:

```javascript
updateAboutTab(profile) {
    // Tipo Istituto
    document.getElementById('about-institute-type').textContent = 
        profile.institute_type || '-';
    
    // Email
    document.getElementById('about-email').textContent = 
        profile.email || '-';
    
    // Telefono
    document.getElementById('about-phone').textContent = 
        profile.phone || '-';
    
    // Indirizzo completo
    const addressParts = [];
    if (profile.address) addressParts.push(profile.address);
    if (profile.city) addressParts.push(profile.city);
    if (profile.province) addressParts.push(`(${profile.province})`);
    
    document.getElementById('about-address').textContent = 
        addressParts.length > 0 ? addressParts.join(', ') : '-';
    
    // Sito web (se esiste, renderlo cliccabile)
    const websiteEl = document.getElementById('about-website');
    if (profile.website) {
        websiteEl.href = profile.website.startsWith('http') 
            ? profile.website 
            : `https://${profile.website}`;
        websiteEl.textContent = profile.website;
        websiteEl.target = '_blank';
        websiteEl.rel = 'noopener noreferrer';
    } else {
        websiteEl.textContent = '-';
        websiteEl.removeAttribute('href');
    }
}
```

---

### **STEP 4: Edit Profile (Opzionale)**

Se vuoi permettere la modifica di questi campi:

#### **A) edit-profile.html - Aggiungere campi**

```html
<div class="form-group">
    <label for="email">Email Istituto</label>
    <input type="email" id="email" name="email" placeholder="email@scuola.it">
</div>

<div class="form-group">
    <label for="phone">Telefono</label>
    <input type="tel" id="phone" name="phone" placeholder="06 1234567">
</div>

<div class="form-group">
    <label for="address">Indirizzo</label>
    <input type="text" id="address" name="address" placeholder="Via Roma 123">
</div>

<div class="form-group">
    <label for="city">Città</label>
    <input type="text" id="city" name="city" placeholder="Roma">
</div>

<div class="form-group">
    <label for="province">Provincia</label>
    <input type="text" id="province" name="province" placeholder="RM" maxlength="2">
</div>

<div class="form-group">
    <label for="website">Sito Web</label>
    <input type="url" id="website" name="website" placeholder="www.scuola.it">
</div>
```

#### **B) edit-profile.js - Caricare e salvare**

```javascript
populateInstituteForm(profile) {
    // Campi esistenti...
    this.setValue('institute-name', profile.institute_name);
    this.setValue('institute-type', profile.institute_type);
    this.setValue('bio', profile.bio);
    
    // NUOVO: Campi aggiuntivi
    this.setValue('email', profile.email);
    this.setValue('phone', profile.phone);
    this.setValue('address', profile.address);
    this.setValue('city', profile.city);
    this.setValue('province', profile.province);
    this.setValue('website', profile.website);
}

async saveInstituteProfile(formData) {
    const { data, error } = await this.supabase
        .from('school_institutes')
        .update({
            institute_name: formData.instituteName,
            institute_type: formData.instituteType,
            bio: formData.bio,
            // NUOVO: Campi aggiuntivi
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            province: formData.province,
            website: formData.website
        })
        .eq('id', this.currentUser.id)
        .select()
        .single();
        
    if (error) throw error;
    return data;
}
```

---

## ✅ CHECKLIST FINALE

### Database
- [ ] Eseguito SQL per aggiungere colonne
- [ ] Verificato che colonne esistano

### Registrazione
- [ ] Aggiunti campi hidden in HTML
- [ ] Modificato autocomplete per popolare campi
- [ ] Modificato auth.js per salvare tutti i dati
- [ ] Testato registrazione nuovo istituto

### Visualizzazione Profilo
- [ ] Modificato caricamento profilo per includere tutti i campi
- [ ] Aggiornato updateAboutTab() per mostrare dati
- [ ] Testato visualizzazione con dati completi
- [ ] Testato visualizzazione con dati parziali

### Edit Profile (Opzionale)
- [ ] Aggiunti campi in HTML
- [ ] Modificato caricamento dati
- [ ] Modificato salvataggio dati
- [ ] Testato modifica e salvataggio

---

## 🧪 TESTING

### Test 1: Registrazione Nuovo Istituto
1. Vai alla pagina registrazione
2. Seleziona istituto dall'autocomplete
3. Completa registrazione
4. Verifica che tutti i dati siano salvati nel database

### Test 2: Visualizzazione Profilo
1. Vai alla pagina profilo
2. Apri tab "Info"
3. Verifica che tutti i dati siano visibili:
   - Email
   - Telefono
   - Indirizzo completo
   - Sito web (cliccabile)

### Test 3: Modifica Profilo
1. Vai a "Modifica Profilo"
2. Verifica che campi siano popolati
3. Modifica alcuni dati
4. Salva
5. Verifica che modifiche siano persistenti

---

## 🐛 TROUBLESHOOTING

### Problema: Colonne non esistono
**Soluzione**: Esegui di nuovo lo SQL, verifica permessi Supabase

### Problema: Dati non vengono salvati
**Soluzione**: Controlla console browser per errori, verifica RLS policies

### Problema: Dati non appaiono in tab Info
**Soluzione**: Verifica che `updateAboutTab()` venga chiamata, controlla ID elementi HTML

### Problema: Autocomplete non popola campi hidden
**Soluzione**: Verifica che ID campi hidden corrispondano, controlla nomi campi JSON

---

**Inizia con STEP 1 (Database) e procedi in ordine!** 🚀
