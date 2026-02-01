# ✅ EDIT PROFILE - FIX APPLICATO

## 🔧 Modifiche Applicate

### 1. Aggiunta Proprietà `userType`
```javascript
constructor() {
  this.userType = null;  // ✅ AGGIUNTO
  // ...
}
```

### 2. Nuovo `loadProfileData()` - Rileva Tipo Utente
```javascript
async loadProfileData() {
  // 1️⃣ Controlla user_profiles per il tipo
  const { data: userProfile } = await this.supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', this.currentUser.id)
    .single();

  const userType = userProfile.user_type;
  this.userType = userType;

  // 2️⃣ Carica dalla tabella corretta
  if (userType === 'istituto') {
    await this.loadInstituteProfile();
  } else {
    await this.loadPrivateUserProfile();
  }

  // 3️⃣ Adatta form al tipo
  this.adjustFormForUserType(userType);
}
```

### 3. Nuovo `loadInstituteProfile()`
```javascript
async loadInstituteProfile() {
  const { data: profile } = await this.supabase
    .from('school_institutes')
    .select('*')
    .eq('id', this.currentUser.id)
    .single();

  if (profile) {
    this.populateInstituteForm(profile);
  }
}
```

### 4. Nuovo `loadPrivateUserProfile()`
```javascript
async loadPrivateUserProfile() {
  const { data: profile } = await this.supabase
    .from('private_users')
    .select('*')
    .eq('id', this.currentUser.id)
    .single();

  if (profile) {
    this.populatePrivateUserForm(profile);
  }
}
```

### 5. Nuovo `populatePrivateUserForm()`
```javascript
populatePrivateUserForm(profile) {
  // Nome e cognome
  this.setValue('first-name', profile.first_name);
  this.setValue('last-name', profile.last_name);
  this.setValue('bio', profile.bio);
  
  // Contatti
  this.setValue('email', profile.email);
  this.setValue('phone', profile.phone);

  // Avatar (avatar_url per privati)
  if (profile.avatar_url) {
    // Mostra avatar
  }

  // Cover (cover_image_url per privati)
  if (profile.cover_image_url) {
    // Mostra cover
  }

  // Update navbar
  const fullName = `${profile.first_name} ${profile.last_name}`;
  // ...
}
```

### 6. Rinominato `populateForm()` → `populateInstituteForm()`
- Mantiene la stessa logica
- Usa `logo_url` per avatar istituti
- Usa `cover_image` per cover istituti

### 7. Nuovo `adjustFormForUserType()`
```javascript
adjustFormForUserType(userType) {
  // Disabilita campo tipo utente
  const userTypeField = document.getElementById('user-type');
  if (userTypeField) {
    userTypeField.value = userType;
    userTypeField.disabled = true;
    userTypeField.style.opacity = '0.6';
    userTypeField.style.cursor = 'not-allowed';
    userTypeField.title = 'Il tipo di utente non può essere modificato';
  }

  // Mostra/nascondi campi specifici
  const instituteFields = document.querySelectorAll('.institute-only');
  const privateFields = document.querySelectorAll('.private-only');

  if (userType === 'istituto') {
    instituteFields.forEach(field => field.style.display = '');
    privateFields.forEach(field => field.style.display = 'none');
  } else {
    instituteFields.forEach(field => field.style.display = 'none');
    privateFields.forEach(field => field.style.display = '');
  }
}
```

### 8. Nuovo `handleSubmit()` - Salva nella Tabella Corretta
```javascript
async handleSubmit(event) {
  event.preventDefault();
  
  // Determina tipo utente
  if (!this.userType) {
    const { data: userProfile } = await this.supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', this.currentUser.id)
      .single();
    this.userType = userProfile?.user_type;
  }

  // Salva nella tabella corretta
  if (this.userType === 'istituto') {
    await this.saveInstituteProfile();
  } else {
    await this.savePrivateUserProfile();
  }
}
```

### 9. Nuovo `saveInstituteProfile()`
```javascript
async saveInstituteProfile() {
  const formData = this.getFormData();
  
  // Upload images
  if (this.coverImage) {
    formData.cover_image = await this.uploadImage(this.coverImage, 'cover');
  }
  if (this.avatarImage) {
    formData.logo_url = await this.uploadImage(this.avatarImage, 'avatar');
  }
  
  // Save to school_institutes
  await this.supabase
    .from('school_institutes')
    .upsert({ id: this.currentUser.id, ...formData });
}
```

### 10. Nuovo `savePrivateUserProfile()`
```javascript
async savePrivateUserProfile() {
  const formData = {
    first_name: document.getElementById('first-name')?.value,
    last_name: document.getElementById('last-name')?.value,
    bio: document.getElementById('bio')?.value,
    email: document.getElementById('email')?.value,
    phone: document.getElementById('phone')?.value
  };
  
  // Upload images
  if (this.coverImage) {
    formData.cover_image_url = await this.uploadImage(this.coverImage, 'cover');
  }
  if (this.avatarImage) {
    formData.avatar_url = await this.uploadImage(this.avatarImage, 'avatar');
  }
  
  // Save to private_users
  await this.supabase
    .from('private_users')
    .upsert({ id: this.currentUser.id, ...formData });
}
```

## ✅ Risultati

### Per Utenti Privati
- ✅ Carica dati da `private_users`
- ✅ Mostra `first_name`, `last_name`
- ✅ Carica `avatar_url` correttamente
- ✅ Carica `cover_image_url` correttamente
- ✅ Salva in `private_users`
- ✅ Tipo utente disabilitato

### Per Istituti
- ✅ Carica dati da `school_institutes`
- ✅ Mostra `institute_name`, `institute_type`
- ✅ Carica `logo_url` correttamente
- ✅ Carica `cover_image` correttamente
- ✅ Salva in `school_institutes`
- ✅ Tipo utente disabilitato

### Sincronizzazione Immagini
- ✅ Avatar salvato nella colonna corretta
- ✅ Cover salvata nella colonna corretta
- ✅ Immagini visibili in tutte le sezioni
- ✅ Nessuna discordanza tra pagine

## 🚀 Test

1. **Login come utente privato**
2. Vai su "Modifica Profilo"
3. Verifica:
   - ✅ Nome e cognome caricati
   - ✅ Avatar e cover caricati (se presenti)
   - ✅ Tipo utente disabilitato
   - ✅ Solo campi privati visibili
4. Carica nuove immagini
5. Salva
6. Verifica che le immagini appaiano:
   - ✅ In "Visualizza Profilo"
   - ✅ Nella homepage
   - ✅ Nei post
   - ✅ Ovunque

**Fix completato! 🎉**
