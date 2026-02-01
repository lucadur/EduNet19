/* ===================================================================
   REGISTRATION MIUR - Autocompilazione Form Registrazione
   Integra il sistema MIUR nel form di registrazione istituto
   =================================================================== */

(function() {
  'use strict';

  let miurData = null;

  // Inizializza quando il DOM è pronto
  document.addEventListener('DOMContentLoaded', function() {
    initMiurRegistration();
  });

  function initMiurRegistration() {
    const searchBtn = document.getElementById('searchMiurBtn');
    const codeInput = document.getElementById('instituteCode');

    if (!searchBtn || !codeInput) {
      console.log('⚠️ Form registrazione istituto non trovato');
      return;
    }

    console.log('✅ MIUR Registration - Initialized');

    // Cerca quando si clicca il bottone
    searchBtn.addEventListener('click', handleSearch);

    // Cerca anche quando si preme Enter nel campo codice
    codeInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    });

    // Uppercase automatico
    codeInput.addEventListener('input', function(e) {
      e.target.value = e.target.value.toUpperCase();
    });
  }

  async function handleSearch() {
    const codeInput = document.getElementById('instituteCode');
    const searchBtn = document.getElementById('searchMiurBtn');
    const errorDiv = document.getElementById('instituteCode-error');
    const successDiv = document.getElementById('instituteCode-success');

    const code = codeInput.value.trim();

    if (!code) {
      showError(errorDiv, 'Inserisci un codice meccanografico');
      return;
    }

    // Disabilita bottone durante la ricerca
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
      // Cerca nel database MIUR
      console.log('🔍 Ricerca codice:', code);
      miurData = await window.miurAutocomplete.findSchoolByCode(code);

      // Verifica se il tipo di scuola non è ammesso
      if (miurData && miurData.error) {
        const schoolType = miurData.schoolType || 'Non specificato';
        showError(errorDiv, miurData.message || 'Tipo di scuola non supportato');
        hideSuccess(successDiv);
        
        // Mostra messaggio più dettagliato PRIMA di clearForm
        showSchoolTypeError(schoolType);
        
        // Pulisci form ma mantieni l'anteprima errore
        clearFormFields();
        return;
      }

      // Se miurData è null, la scuola non è stata trovata
      if (!miurData) {
        showError(errorDiv, 'Codice non trovato nel database MIUR');
        hideSuccess(successDiv);
        clearForm();
        return;
      }

      // Valida dati
      const validation = window.miurAutocomplete.validateData(miurData);

      if (!validation.isValid) {
        showError(errorDiv, 'Dati non validi: ' + validation.errors.join(', '));
        hideSuccess(successDiv);
        return;
      }

      // Mostra successo
      hideError(errorDiv);
      showSuccess(successDiv, 'Istituto trovato nel database MIUR!');

      // Mostra anteprima
      showPreview(miurData);

      // Compila form
      fillForm(miurData);

      // Mostra warning se ci sono
      if (validation.warnings.length > 0) {
        console.warn('⚠️ Warning:', validation.warnings);
        showWarnings(validation.warnings);
      }

    } catch (error) {
      console.error('❌ Errore ricerca MIUR:', error);
      showError(errorDiv, 'Errore durante la ricerca. Riprova.');
      hideSuccess(successDiv);
    } finally {
      // Riabilita bottone
      searchBtn.disabled = false;
      searchBtn.innerHTML = '<i class="fas fa-search"></i>';
    }
  }

  function showPreview(data) {
    const preview = document.getElementById('miurPreview');
    const content = document.getElementById('miurPreviewContent');

    if (!preview || !content) return;

    const html = `
      <div class="miur-data-row">
        <span class="miur-label">Nome:</span>
        <span class="miur-value">${data.institute_name || '-'}</span>
      </div>
      <div class="miur-data-row">
        <span class="miur-label">Tipo:</span>
        <span class="miur-value">${data.institute_type || '-'}</span>
      </div>
      <div class="miur-data-row">
        <span class="miur-label">Città:</span>
        <span class="miur-value">${data.city || '-'} (${data.province || '-'})</span>
      </div>
      ${data.email ? `
      <div class="miur-data-row">
        <span class="miur-label">Email:</span>
        <span class="miur-value">${data.email}</span>
      </div>
      ` : ''}
      ${data.website ? `
      <div class="miur-data-row">
        <span class="miur-label">Sito:</span>
        <span class="miur-value">${data.website}</span>
      </div>
      ` : ''}
      ${data.address ? `
      <div class="miur-data-row">
        <span class="miur-label">Indirizzo:</span>
        <span class="miur-value">${data.address}</span>
      </div>
      ` : ''}
    `;

    content.innerHTML = html;
    preview.style.display = 'block';
  }

  function fillForm(data) {
    // Nome istituto
    const nameInput = document.getElementById('instituteName');
    if (nameInput && data.institute_name) {
      nameInput.value = data.institute_name;
      nameInput.readOnly = true;
    }

    // Tipo istituto
    const typeSelect = document.getElementById('instituteType');
    if (typeSelect && data.institute_type) {
      const tipoNormalizzato = data.institute_type;
      
      // Verifica se il valore esiste nelle opzioni del select
      let optionExists = Array.from(typeSelect.options).some(opt => opt.value === tipoNormalizzato);
      
      if (optionExists) {
        typeSelect.value = tipoNormalizzato;
      } else {
        // Se non esiste, cerca una corrispondenza parziale
        const matchingOption = Array.from(typeSelect.options).find(opt => 
          opt.value.toLowerCase().includes(tipoNormalizzato.toLowerCase()) ||
          tipoNormalizzato.toLowerCase().includes(opt.value.toLowerCase())
        );
        
        if (matchingOption) {
          typeSelect.value = matchingOption.value;
        } else {
          console.warn(`⚠️ Tipo istituto "${tipoNormalizzato}" non trovato nelle opzioni`);
          // Non impostare nulla, lascia il placeholder
        }
      }
      
      // Crea campo hidden per inviare il valore (select disabled non invia dati)
      let hiddenType = document.getElementById('institute-type-hidden');
      if (!hiddenType) {
        hiddenType = document.createElement('input');
        hiddenType.type = 'hidden';
        hiddenType.id = 'institute-type-hidden';
        hiddenType.name = 'instituteType';
        typeSelect.parentNode.appendChild(hiddenType);
      }
      hiddenType.value = typeSelect.value || tipoNormalizzato;
      
      // Disabilita visivamente il select (NO stili inline - usa CSS)
      typeSelect.disabled = true;
    }

    // NON compilare più l'email di login con quella MIUR
    // L'utente deve inserire la propria email personale
    const emailInput = document.getElementById('instituteEmail');
    if (emailInput && !emailInput.value) {
      // Metti focus sul campo email per indicare che va compilato
      setTimeout(() => {
        emailInput.focus();
        emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }

    // Mostra email MIUR in campo separato (readonly, per verifica)
    const miurEmailGroup = document.getElementById('miurEmailGroup');
    const miurEmailDisplay = document.getElementById('miurEmailDisplay');
    
    if (data.email && miurEmailGroup && miurEmailDisplay) {
      miurEmailDisplay.value = data.email;
      miurEmailGroup.style.display = 'block';
      console.log('📧 Email MIUR mostrata:', data.email);
    } else if (miurEmailGroup) {
      // Nascondi se non c'è email MIUR
      miurEmailGroup.style.display = 'none';
    }

    // Campi hidden per dati aggiuntivi
    setHiddenField('institute-email-hidden', data.email); // Email MIUR per verifica
    setHiddenField('institute-address-hidden', data.address);
    setHiddenField('institute-city-hidden', data.city);
    setHiddenField('institute-province-hidden', data.province);
    setHiddenField('institute-website-hidden', data.website);
    setHiddenField('institute-code-hidden', data.codice_scuola);

    console.log('✅ Form compilato con dati MIUR');
  }

  function clearForm() {
    clearFormFields();
    
    // Nascondi anteprima
    const preview = document.getElementById('miurPreview');
    if (preview) {
      preview.style.display = 'none';
      preview.classList.remove('error-state');
    }
    
    // Nascondi email MIUR
    const miurEmailGroup = document.getElementById('miurEmailGroup');
    if (miurEmailGroup) {
      miurEmailGroup.style.display = 'none';
    }

    miurData = null;
  }

  function clearFormFields() {
    const nameInput = document.getElementById('instituteName');
    const typeSelect = document.getElementById('instituteType');
    const miurEmailDisplay = document.getElementById('miurEmailDisplay');

    if (nameInput) {
      nameInput.value = '';
      nameInput.readOnly = false;
    }

    if (typeSelect) {
      typeSelect.value = '';
      typeSelect.disabled = false;
      typeSelect.style.backgroundColor = '';
    }

    if (miurEmailDisplay) {
      miurEmailDisplay.value = '';
    }

    // NON pulire l'email di login - l'utente potrebbe averla già inserita
    
    miurData = null;
  }

  function setHiddenField(id, value) {
    const field = document.getElementById(id);
    if (field) {
      field.value = value || '';
    }
  }

  function showError(element, message) {
    if (element) {
      element.textContent = message;
      element.style.display = 'block';
    }
  }

  function hideError(element) {
    if (element) {
      element.style.display = 'none';
    }
  }

  function showSuccess(element, message) {
    if (element) {
      element.querySelector('span').textContent = message;
      element.style.display = 'flex';
    }
  }

  function hideSuccess(element) {
    if (element) {
      element.style.display = 'none';
    }
  }

  function showWarnings(warnings) {
    const preview = document.getElementById('miurPreview');
    if (!preview) return;

    const warningHtml = `
      <div class="miur-warnings">
        <i class="fas fa-exclamation-triangle"></i>
        <div>
          <strong>Attenzione:</strong>
          <ul>
            ${warnings.map(w => `<li>${w}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;

    preview.insertAdjacentHTML('beforeend', warningHtml);
  }

  function showSchoolTypeError(schoolType) {
    const preview = document.getElementById('miurPreview');
    const content = document.getElementById('miurPreviewContent');

    if (!preview || !content) return;

    const html = `
      <div class="miur-school-type-error">
        <div class="error-icon">
          <i class="fas fa-school"></i>
          <i class="fas fa-times-circle error-badge"></i>
        </div>
        <h4>Tipo di scuola non supportato</h4>
        <p class="school-type-detected">Tipo rilevato: <strong>${schoolType || 'Non specificato'}</strong></p>
        <p class="school-type-message">
          Al momento EduNet19 supporta solo la registrazione di:
        </p>
        <ul class="supported-types">
          <li><i class="fas fa-check"></i> Scuole Medie (Secondaria di I Grado)</li>
          <li><i class="fas fa-check"></i> Scuole Superiori (Licei, Istituti Tecnici, Professionali)</li>
          <li><i class="fas fa-check"></i> Università e Politecnici</li>
        </ul>
        <p class="school-type-hint">
          <i class="fas fa-info-circle"></i>
          Se ritieni che questo sia un errore, contattaci all'indirizzo supporto@edunet19.it
        </p>
      </div>
    `;

    content.innerHTML = html;
    preview.style.display = 'block';
    preview.classList.add('error-state');
  }

  // Esponi funzione per ottenere i dati MIUR (usata da auth.js)
  window.getMiurRegistrationData = function() {
    return miurData;
  };

  console.log('✅ Registration MIUR - Script loaded');
})();
