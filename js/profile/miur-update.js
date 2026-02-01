/* ===================================================================
   MIUR UPDATE - Sistema aggiornamento dati da MIUR in edit-profile
   =================================================================== */

(function() {
  'use strict';

  let currentProfile = null;
  let miurData = null;

  // Inizializza quando il DOM è pronto
  document.addEventListener('DOMContentLoaded', function() {
    initMiurUpdate();
  });

  async function initMiurUpdate() {
    console.log('🔄 MIUR Update - Initializing...');

    // Aspetta che il profilo sia caricato
    await waitForProfile();
    
    // Mostra sezione MIUR se l'istituto ha un codice
    if (currentProfile && currentProfile.institute_code) {
      showMiurSection();
      setupEventListeners();
    }

    console.log('✅ MIUR Update - Initialized');
  }

  async function waitForProfile() {
    // Aspetta che EditProfilePage sia inizializzato e abbia caricato il profilo
    let attempts = 0;
    const maxAttempts = 50; // 5 secondi

    while (attempts < maxAttempts) {
      if (window.editProfilePage && window.editProfilePage.currentProfile) {
        currentProfile = window.editProfilePage.currentProfile;
        console.log('✅ Profilo caricato per MIUR update:', currentProfile.institute_name);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    console.warn('⚠️ Timeout waiting for profile data');
  }

  function showMiurSection() {
    const section = document.getElementById('miurUpdateSection');
    const codeSpan = document.getElementById('currentMiurCode');
    const updateSpan = document.getElementById('lastMiurUpdate');

    if (!section) return;

    // Mostra codice MIUR
    if (codeSpan) {
      codeSpan.textContent = currentProfile.institute_code;
    }

    // Mostra data ultimo aggiornamento
    if (updateSpan && currentProfile.miur_data && currentProfile.miur_data.data_import) {
      const date = new Date(currentProfile.miur_data.data_import);
      updateSpan.textContent = date.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (updateSpan) {
      updateSpan.textContent = 'Mai aggiornato';
    }

    // Mostra sezione
    section.style.display = 'block';
  }

  function setupEventListeners() {
    const updateBtn = document.getElementById('updateFromMiurBtn');
    if (updateBtn) {
      updateBtn.addEventListener('click', handleMiurUpdate);
    }
  }

  async function handleMiurUpdate() {
    const updateBtn = document.getElementById('updateFromMiurBtn');
    
    if (!currentProfile || !currentProfile.institute_code) {
      alert('Codice MIUR non trovato nel profilo');
      return;
    }

    // Disabilita bottone e mostra loading
    updateBtn.disabled = true;
    updateBtn.classList.add('loading');
    updateBtn.querySelector('span').textContent = 'Caricamento...';

    try {
      console.log('🔍 Aggiornamento dati MIUR per codice:', currentProfile.institute_code);

      // Carica dati aggiornati da MIUR
      miurData = await window.miurAutocomplete.findSchoolByCode(currentProfile.institute_code);

      if (!miurData) {
        alert('Codice non trovato nel database MIUR. Potrebbe essere stato modificato.');
        return;
      }

      // Valida dati
      const validation = window.miurAutocomplete.validateData(miurData);
      if (!validation.isValid) {
        alert('Dati MIUR non validi: ' + validation.errors.join(', '));
        return;
      }

      // Confronta con dati attuali e mostra modal di conferma
      const changes = compareData(currentProfile, miurData);
      
      if (changes.length === 0) {
        alert('I dati sono già aggiornati. Nessuna modifica necessaria.');
        return;
      }

      // Mostra modal di conferma
      showConfirmationModal(changes);

    } catch (error) {
      console.error('❌ Errore aggiornamento MIUR:', error);
      alert('Errore durante l\'aggiornamento. Riprova più tardi.');
    } finally {
      // Riabilita bottone
      updateBtn.disabled = false;
      updateBtn.classList.remove('loading');
      updateBtn.querySelector('span').textContent = 'Aggiorna da MIUR';
    }
  }

  function compareData(current, miur) {
    const changes = [];
    
    // Campi da confrontare
    const fieldsToCompare = [
      { key: 'institute_name', label: 'Nome Istituto', currentKey: 'institute_name', miurKey: 'institute_name' },
      { key: 'institute_type', label: 'Tipo Istituto', currentKey: 'institute_type', miurKey: 'institute_type' },
      { key: 'email', label: 'Email', currentKey: 'email', miurKey: 'email' },
      { key: 'website', label: 'Sito Web', currentKey: 'website', miurKey: 'website' },
      { key: 'address', label: 'Indirizzo', currentKey: 'address', miurKey: 'address' },
      { key: 'city', label: 'Città', currentKey: 'city', miurKey: 'city' },
      { key: 'province', label: 'Provincia', currentKey: 'province', miurKey: 'province' },
      { key: 'cap', label: 'CAP', currentKey: 'cap', miurKey: 'cap' }
    ];

    fieldsToCompare.forEach(field => {
      const currentValue = current[field.currentKey] || '';
      const miurValue = miur[field.miurKey] || '';
      
      if (currentValue !== miurValue) {
        changes.push({
          key: field.key,
          label: field.label,
          oldValue: currentValue,
          newValue: miurValue
        });
      }
    });

    return changes;
  }

  function showConfirmationModal(changes) {
    // Crea modal
    const modal = document.createElement('div');
    modal.className = 'miur-update-modal';
    modal.innerHTML = `
      <div class="miur-update-modal-content">
        <div class="miur-update-modal-header">
          <i class="fas fa-sync-alt"></i>
          <h3>Aggiorna Dati da MIUR</h3>
        </div>
        
        <p>Sono stati trovati <strong>${changes.length} aggiornamenti</strong> dal database MIUR:</p>
        
        <div class="miur-changes-preview">
          ${changes.map(change => `
            <div class="miur-change-item">
              <span class="miur-change-label">${change.label}:</span>
              <div class="miur-change-values">
                ${change.oldValue ? `<span class="miur-old-value">${change.oldValue}</span>` : ''}
                <span class="miur-new-value">${change.newValue || 'Non disponibile'}</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <p><strong>Vuoi applicare questi aggiornamenti?</strong></p>
        <p class="text-muted">I dati verranno sovrascritti con quelli del database MIUR.</p>
        
        <div class="miur-update-modal-actions">
          <button type="button" class="btn-cancel" onclick="closeMiurModal()">Annulla</button>
          <button type="button" class="btn-confirm" onclick="applyMiurUpdates()">Applica Aggiornamenti</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // Mostra modal
    setTimeout(() => modal.classList.add('show'), 10);

    // Chiudi con ESC
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeMiurModal();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  // Funzioni globali per il modal
  window.closeMiurModal = function() {
    const modal = document.querySelector('.miur-update-modal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    }
  };

  window.applyMiurUpdates = function() {
    if (!miurData) return;

    // Aggiorna i campi del form
    updateFormFields(miurData);
    
    // Chiudi modal
    window.closeMiurModal();
    
    // Mostra messaggio di successo
    showSuccessMessage();
  };

  function updateFormFields(data) {
    // Aggiorna campi form
    const fields = {
      'institute-name': data.institute_name,
      'institute-type': data.institute_type,
      'email': data.email,
      'website': data.website,
      'address': data.address,
      'city': data.city,
      'province': data.province
    };

    Object.entries(fields).forEach(([fieldId, value]) => {
      const field = document.getElementById(fieldId);
      if (field && value) {
        field.value = value;
        
        // Trigger change event per validazione
        field.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    console.log('✅ Campi form aggiornati con dati MIUR');
  }

  function showSuccessMessage() {
    // Crea notifica di successo
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
      z-index: 1001;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      animation: slideInRight 0.3s ease;
    `;
    
    notification.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>Dati aggiornati da MIUR!</span>
    `;

    document.body.appendChild(notification);

    // Rimuovi dopo 3 secondi
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  console.log('✅ MIUR Update - Script loaded');
})();

// Aggiungi stili per animazioni notifica
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100px);
    }
  }
  
  .text-muted {
    color: #6c757d;
    font-size: 0.9rem;
  }
`;
document.head.appendChild(style);
