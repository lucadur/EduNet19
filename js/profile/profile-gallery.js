/* ===================================================================
   PROFILE GALLERY - Gestione Bacheca Fotografica
   =================================================================== */

class ProfileGallery {
  constructor() {
    this.maxPhotos = 20;
    this.photos = [];
    this.currentLightboxIndex = 0;
    this.init();
  }

  init() {
    this.setupEventListeners();
    // Don't load gallery on init, only when tab is clicked
    // This avoids race condition with Supabase initialization
  }

  setupEventListeners() {
    // Upload button
    const uploadBtn = document.getElementById('gallery-upload-btn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => this.openUploadModal());
    }

    // Tab switch
    const galleryTabBtn = document.getElementById('gallery-tab-btn');
    if (galleryTabBtn) {
      galleryTabBtn.addEventListener('click', async () => {
        // Load gallery
        await this.loadGallery();
      });
    }
  }

  async loadGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;

    try {
      // Get Supabase client
      const supabase = await window.supabaseClientManager.getClient();
      if (!supabase) {
        console.error('❌ Supabase client not available');
        this.showError('Errore di connessione. Ricarica la pagina.');
        return;
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load photos from database
      const { data: photos, error } = await supabase
        .from('profile_gallery')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(this.maxPhotos);

      if (error) throw error;

      this.photos = photos || [];
      this.renderGallery();
    } catch (error) {
      console.error('Error loading gallery:', error);
      this.showError('Errore nel caricamento della galleria');
    }
  }

  renderGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    const emptyState = document.getElementById('gallery-empty');
    const galleryContent = document.querySelector('.gallery-content');
    const headerUploadBtn = document.getElementById('gallery-upload-btn');

    // SEMPRE rimuovi le foto esistenti dal DOM prima di tutto
    const existingPhotos = galleryGrid.querySelectorAll('.gallery-item');
    existingPhotos.forEach(item => item.remove());

    if (this.photos.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      // Nascondi il bottone header quando c'è l'empty state (UX: evita ridondanza)
      if (headerUploadBtn) headerUploadBtn.style.display = 'none';
      if (galleryContent) galleryContent.classList.add('has-empty-state');
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    // Mostra il bottone header quando ci sono foto
    if (headerUploadBtn) headerUploadBtn.style.display = '';
    if (galleryContent) galleryContent.classList.remove('has-empty-state');

    // Render photos
    this.photos.forEach((photo, index) => {
      const photoElement = this.createPhotoElement(photo, index);
      galleryGrid.appendChild(photoElement);
    });

    // Update counter
    this.updateCounter();
  }

  createPhotoElement(photo, index) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.setAttribute('data-photo-id', photo.id);

    const imageUrl = this.getPhotoUrl(photo.photo_url);
    const uploadDate = new Date(photo.created_at).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    item.innerHTML = `
      <div class="gallery-image-container">
        <img src="${imageUrl}" alt="${photo.caption || 'Foto istituto'}" class="gallery-image" loading="lazy">
      </div>
      <div class="gallery-item-overlay">
        <div class="gallery-item-info">
          <p class="gallery-item-date">${uploadDate}</p>
          ${photo.caption ? `<p class="gallery-item-caption">${this.escapeHtml(photo.caption)}</p>` : ''}
        </div>
      </div>
      <div class="gallery-item-actions">
        <button class="gallery-action-btn delete" onclick="profileGallery.deletePhoto('${photo.id}')" aria-label="Elimina foto">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    // Click to open lightbox
    item.addEventListener('click', (e) => {
      if (!e.target.closest('.gallery-action-btn')) {
        this.openLightbox(index);
      }
    });

    return item;
  }

  getPhotoUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    
    // Get Supabase client (synchronous access to already initialized client)
    const supabase = window.supabaseClientManager?.client;
    if (!supabase) {
      console.warn('Supabase not ready, returning placeholder');
      return '';
    }
    
    const { data } = supabase.storage
      .from('profile-gallery')
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  openUploadModal() {
    if (this.photos.length >= this.maxPhotos) {
      this.showError(`Hai raggiunto il limite massimo di ${this.maxPhotos} foto`);
      return;
    }

    // Create modal if it doesn't exist
    let modal = document.getElementById('gallery-upload-modal');
    if (!modal) {
      modal = this.createUploadModal();
      document.body.appendChild(modal);
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  createUploadModal() {
    const modal = document.createElement('div');
    modal.id = 'gallery-upload-modal';
    modal.className = 'gallery-upload-modal';

    modal.innerHTML = `
      <div class="gallery-upload-content">
        <div class="gallery-upload-header">
          <h3><i class="fas fa-upload"></i> Carica Foto</h3>
          <button class="gallery-upload-close" onclick="profileGallery.closeUploadModal()" aria-label="Chiudi">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="gallery-dropzone" id="gallery-dropzone">
          <i class="fas fa-cloud-upload-alt"></i>
          <p>Trascina foto qui o clicca per selezionare</p>
          <small>JPG, PNG o GIF - Max 5MB per foto - Fino a 20 foto</small>
          <input type="file" id="gallery-file-input" accept="image/*" multiple style="display: none;">
        </div>

        <form class="gallery-upload-form" id="gallery-upload-form" style="display: none;">
          <div class="gallery-form-group">
            <label for="gallery-caption">Didascalia (opzionale)</label>
            <textarea id="gallery-caption" placeholder="Descrivi questa foto..." maxlength="200"></textarea>
          </div>

          <div class="gallery-upload-actions">
            <button type="button" class="btn-secondary" onclick="profileGallery.closeUploadModal()">
              Annulla
            </button>
            <button type="submit" class="btn-primary">
              <i class="fas fa-upload"></i>
              Carica Foto
            </button>
          </div>
        </form>
      </div>
    `;

    // Setup dropzone
    const dropzone = modal.querySelector('#gallery-dropzone');
    const fileInput = modal.querySelector('#gallery-file-input');
    const form = modal.querySelector('#gallery-upload-form');

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (files.length > 0) {
        this.handleMultipleFiles(files);
      }
    });

    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        this.handleMultipleFiles(files);
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.uploadPhoto();
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeUploadModal();
      }
    });

    return modal;
  }

  handleMultipleFiles(files) {
    // Check total limit
    const remainingSlots = this.maxPhotos - this.photos.length;
    if (files.length > remainingSlots) {
      this.showError(`Puoi caricare massimo ${remainingSlots} foto (limite ${this.maxPhotos} raggiunto)`);
      return;
    }

    // Validate all files
    const validFiles = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        this.showError(`${file.name} non è un'immagine valida`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.showError(`${file.name} è troppo grande (max 5MB)`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return;
    }

    this.selectedFiles = validFiles;
    this.showFilesPreviews(validFiles);
  }

  showFilesPreviews(files) {
    const dropzone = document.getElementById('gallery-dropzone');
    const form = document.getElementById('gallery-upload-form');
    
    dropzone.style.display = 'none';
    form.style.display = 'flex';

    // Create previews container
    const previewsHtml = files.map((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.querySelector(`#preview-${index}`);
        if (img) img.src = e.target.result;
      };
      reader.readAsDataURL(file);

      return `
        <div class="gallery-preview-item" id="preview-container-${index}">
          <img id="preview-${index}" class="gallery-preview-img" alt="Preview ${index + 1}">
          <div class="gallery-preview-name">${file.name}</div>
        </div>
      `;
    }).join('');

    dropzone.innerHTML = `
      <div class="gallery-previews-grid">
        ${previewsHtml}
      </div>
      <p class="gallery-upload-count">${files.length} foto selezionate</p>
    `;
    dropzone.style.display = 'block';
    dropzone.style.border = 'none';
    dropzone.style.padding = 'var(--space-4)';
  }

  handleFileSelect(file) {
    // Backward compatibility - convert single file to array
    this.handleMultipleFiles([file]);
  }

  async uploadPhoto() {
    if (!this.selectedFiles || this.selectedFiles.length === 0) return;

    const submitBtn = document.querySelector('#gallery-upload-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Caricamento...';

    try {
      // Get Supabase client
      const supabase = await window.supabaseClientManager.getClient();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      const caption = document.getElementById('gallery-caption').value.trim();
      const uploadedPhotos = [];
      let successCount = 0;
      let errorCount = 0;

      // Update progress
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Caricamento 0/${this.selectedFiles.length}...`;

      // Upload each file
      for (let i = 0; i < this.selectedFiles.length; i++) {
        const file = this.selectedFiles[i];
        
        try {
          // Upload to storage
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}_${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('profile-gallery')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Save to database
          const { data, error } = await supabase
            .from('profile_gallery')
            .insert({
              user_id: user.id,
              photo_url: fileName,
              caption: this.selectedFiles.length === 1 ? (caption || null) : null
            })
            .select()
            .single();

          if (error) throw error;

          uploadedPhotos.push(data);
          successCount++;
          
          // Update progress
          submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Caricamento ${successCount}/${this.selectedFiles.length}...`;
          
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          errorCount++;
        }
      }

      // Add to photos array
      this.photos.unshift(...uploadedPhotos);
      this.renderGallery();

      // Close modal
      this.closeUploadModal();
      
      // Show result
      if (errorCount === 0) {
        this.showSuccess(`${successCount} foto caricate con successo!`);
      } else {
        this.showError(`${successCount} foto caricate, ${errorCount} errori`);
      }

    } catch (error) {
      console.error('Error uploading photo:', error);
      this.showError('Errore nel caricamento della foto');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  closeUploadModal() {
    const modal = document.getElementById('gallery-upload-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      
      // Reset form
      setTimeout(() => {
        const dropzone = document.getElementById('gallery-dropzone');
        const form = document.getElementById('gallery-upload-form');
        const fileInput = document.getElementById('gallery-file-input');
        
        if (dropzone) {
          dropzone.style.display = 'block';
          dropzone.style.border = '';
          dropzone.style.padding = '';
          dropzone.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Trascina una foto qui o clicca per selezionare</p>
            <small>JPG, PNG o GIF - Max 5MB</small>
          `;
        }
        if (form) form.style.display = 'none';
        if (fileInput) fileInput.value = '';
        
        this.selectedFile = null;
      }, 300);
    }
  }

  async deletePhoto(photoId) {
    if (!confirm('Sei sicuro di voler eliminare questa foto?')) return;

    try {
      // Get Supabase client
      const supabase = await window.supabaseClientManager.getClient();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      
      const photo = this.photos.find(p => p.id === photoId);
      if (!photo) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('profile-gallery')
        .remove([photo.photo_url]);

      if (storageError) console.error('Storage delete error:', storageError);

      // Delete from database
      const { error } = await supabase
        .from('profile_gallery')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      // Remove from array
      this.photos = this.photos.filter(p => p.id !== photoId);
      this.renderGallery();

      this.showSuccess('Foto eliminata');

    } catch (error) {
      console.error('Error deleting photo:', error);
      this.showError('Errore nell\'eliminazione della foto');
    }
  }

  openLightbox(index) {
    this.currentLightboxIndex = index;
    
    let lightbox = document.getElementById('gallery-lightbox');
    if (!lightbox) {
      lightbox = this.createLightbox();
      document.body.appendChild(lightbox);
    }

    this.updateLightbox();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  createLightbox() {
    const lightbox = document.createElement('div');
    lightbox.id = 'gallery-lightbox';
    lightbox.className = 'gallery-lightbox';

    lightbox.innerHTML = `
      <div class="gallery-lightbox-content">
        <button class="gallery-lightbox-close" onclick="profileGallery.closeLightbox()" aria-label="Chiudi">
          <i class="fas fa-times"></i>
        </button>
        <button class="gallery-lightbox-nav prev" onclick="profileGallery.prevPhoto()" aria-label="Foto precedente">
          <i class="fas fa-chevron-left"></i>
        </button>
        <img src="" alt="" class="gallery-lightbox-image" id="lightbox-image">
        <button class="gallery-lightbox-nav next" onclick="profileGallery.nextPhoto()" aria-label="Foto successiva">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;

    // Close on backdrop click
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        this.closeLightbox();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      
      if (e.key === 'Escape') this.closeLightbox();
      if (e.key === 'ArrowLeft') this.prevPhoto();
      if (e.key === 'ArrowRight') this.nextPhoto();
    });

    return lightbox;
  }

  updateLightbox() {
    const photo = this.photos[this.currentLightboxIndex];
    if (!photo) return;

    const image = document.getElementById('lightbox-image');
    if (image) {
      image.src = this.getPhotoUrl(photo.photo_url);
      image.alt = photo.caption || 'Foto istituto';
    }
  }

  prevPhoto() {
    this.currentLightboxIndex = (this.currentLightboxIndex - 1 + this.photos.length) % this.photos.length;
    this.updateLightbox();
  }

  nextPhoto() {
    this.currentLightboxIndex = (this.currentLightboxIndex + 1) % this.photos.length;
    this.updateLightbox();
  }

  closeLightbox() {
    const lightbox = document.getElementById('gallery-lightbox');
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  updateCounter() {
    const uploadBtn = document.getElementById('gallery-upload-btn');
    if (!uploadBtn) return;

    // Remove existing counter
    const existingCounter = uploadBtn.querySelector('.gallery-counter');
    if (existingCounter) existingCounter.remove();

    // Add counter
    const counter = document.createElement('span');
    counter.className = 'gallery-counter';
    
    if (this.photos.length >= this.maxPhotos) {
      counter.classList.add('full');
    } else if (this.photos.length >= this.maxPhotos - 3) {
      counter.classList.add('warning');
    }

    counter.textContent = `${this.photos.length}/${this.maxPhotos}`;
    uploadBtn.appendChild(counter);

    // Disable button if full
    if (this.photos.length >= this.maxPhotos) {
      uploadBtn.disabled = true;
      uploadBtn.style.opacity = '0.6';
      uploadBtn.style.cursor = 'not-allowed';
    } else {
      uploadBtn.disabled = false;
      uploadBtn.style.opacity = '1';
      uploadBtn.style.cursor = 'pointer';
    }
  }

  showSuccess(message) {
    // Use existing notification system if available
    if (window.showNotification) {
      window.showNotification(message, 'success');
    } else {
      alert(message);
    }
  }

  showError(message) {
    // Use existing notification system if available
    if (window.showNotification) {
      window.showNotification(message, 'error');
    } else {
      alert(message);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize gallery
let profileGallery;
document.addEventListener('DOMContentLoaded', () => {
  profileGallery = new ProfileGallery();
});

// Export for use in other scripts
window.profileGallery = profileGallery;
