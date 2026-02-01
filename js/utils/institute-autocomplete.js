/**
 * SISTEMA DI AUTOCOMPLETE E VERIFICA ISTITUTI
 * Carica i database JSON MIUR e fornisce autocomplete live
 * FALLBACK SICURO: Se fallisce, la registrazione funziona normalmente
 */

class InstituteAutocomplete {
  constructor() {
    this.schools = [];
    this.isLoading = false;
    this.isLoaded = false;
    this.loadError = false;
    this.selectedSchool = null;
    
    // Elementi DOM
    this.input = null;
    this.dropdown = null;
    this.verificationBadge = null;
    
    // Configurazione
    this.maxResults = 10;
    this.minChars = 3;
    this.debounceTimer = null;
    this.debounceDelay = 300;
  }

  /**
   * Inizializza il sistema
   */
  async init() {
    try {
      console.log('🏫 Inizializzazione sistema verifica istituti...');
      
      // Trova l'input del nome istituto
      this.input = document.getElementById('instituteName');
      if (!this.input) {
        console.warn('⚠️ Campo instituteName non trovato, skip autocomplete');
        return;
      }

      // Crea elementi UI
      this.createUI();
      
      // Aggiungi event listeners
      this.attachEventListeners();
      
      // Carica i dati in background (non blocca la UI)
      this.loadSchoolData();
      
      console.log('✅ Sistema verifica istituti inizializzato');
    } catch (error) {
      console.error('❌ Errore inizializzazione autocomplete:', error);
      this.loadError = true;
      // NON blocca la registrazione
    }
  }

  /**
   * Crea gli elementi UI per l'autocomplete
   */
  createUI() {
    // Trova il container input-group
    const inputGroup = this.input.parentNode;
    if (!inputGroup || !inputGroup.classList.contains('input-group')) {
      console.warn('⚠️ input-group non trovato, skip UI creation');
      return;
    }
    
    // Wrapper per posizionamento relativo
    const wrapper = document.createElement('div');
    wrapper.className = 'autocomplete-wrapper';
    
    // Inserisci wrapper prima dell'input-group
    inputGroup.parentNode.insertBefore(wrapper, inputGroup);
    
    // Sposta l'intero input-group nel wrapper (include icona + input)
    wrapper.appendChild(inputGroup);
    
    // Dropdown risultati
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'autocomplete-dropdown';
    this.dropdown.style.display = 'none';
    wrapper.appendChild(this.dropdown);
    
    // Badge verifica (dopo il wrapper)
    this.verificationBadge = document.createElement('span');
    this.verificationBadge.className = 'verification-badge';
    this.verificationBadge.style.display = 'none';
    wrapper.parentNode.insertBefore(this.verificationBadge, wrapper.nextSibling);
    
    // Loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'autocomplete-loading';
    loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Caricamento database scuole...';
    loadingIndicator.style.display = 'none';
    loadingIndicator.id = 'autocomplete-loading';
    wrapper.parentNode.insertBefore(loadingIndicator, wrapper.nextSibling);
  }

  /**
   * Aggiungi event listeners
   */
  attachEventListeners() {
    // Input con debounce
    this.input.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.handleInput(e.target.value);
      }, this.debounceDelay);
    });
    
    // Focus
    this.input.addEventListener('focus', () => {
      if (this.input.value.length >= this.minChars) {
        this.handleInput(this.input.value);
      }
    });
    
    // Click fuori per chiudere
    document.addEventListener('click', (e) => {
      if (!this.input.contains(e.target) && !this.dropdown.contains(e.target)) {
        this.hideDropdown();
      }
    });
    
    // Keyboard navigation
    this.input.addEventListener('keydown', (e) => {
      this.handleKeyboard(e);
    });
  }

  /**
   * Carica i dati delle scuole dai JSON
   */
  async loadSchoolData() {
    if (this.isLoading || this.isLoaded) return;
    
    this.isLoading = true;
    const loadingEl = document.getElementById('autocomplete-loading');
    if (loadingEl) loadingEl.style.display = 'block';
    
    try {
      console.log('📥 Caricamento database scuole MIUR...');
      
      // Carica i 4 file JSON in parallelo
      const files = [
        'db scuole/scuole-statali.json',
        'db scuole/scuole-paritarie.json',
        'db scuole/scuole-statali-province-autonome.json',
        'db scuole/scuole-paritarie-province-autonome.json'
      ];
      
      const promises = files.map(file => 
        fetch(file)
          .then(res => res.json())
          .catch(err => {
            console.warn(`⚠️ Errore caricamento ${file}:`, err);
            return null;
          })
      );
      
      const results = await Promise.all(promises);
      
      // Processa i dati
      results.forEach((data, index) => {
        if (data && data['@graph']) {
          console.log(`✅ Caricato ${files[index]}: ${data['@graph'].length} scuole`);
          this.processSchoolData(data['@graph']);
        }
      });
      
      this.isLoaded = true;
      console.log(`✅ Database completo: ${this.schools.length} scuole caricate`);
      
      if (loadingEl) {
        loadingEl.innerHTML = '<i class="fas fa-check"></i> Database caricato';
        setTimeout(() => loadingEl.style.display = 'none', 2000);
      }
      
    } catch (error) {
      console.error('❌ Errore caricamento database:', error);
      this.loadError = true;
      if (loadingEl) {
        loadingEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Database non disponibile';
        loadingEl.style.color = '#f59e0b';
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Processa i dati delle scuole dal formato MIUR
   */
  processSchoolData(graph) {
    graph.forEach(item => {
      if (item['miur:DENOMINAZIONESCUOLA']) {
        this.schools.push({
          name: item['miur:DENOMINAZIONESCUOLA'].trim(),
          code: item['miur:CODICESCUOLA'] || '',
          type: item['miur:DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA'] || '',
          address: item['miur:INDIRIZZOSCUOLA'] || '',
          city: item['miur:DESCRIZIONECOMUNE'] || '',
          province: item['miur:PROVINCIA'] || '',
          region: item['miur:REGIONE'] || '',
          email: item['miur:INDIRIZZOEMAILSCUOLA'] || '',
          pec: item['miur:INDIRIZZOPECSCUOLA'] || '',
          website: item['miur:SITOWEBSCUOLA'] || '',
          cap: item['miur:CAPSCUOLA'] ? item['miur:CAPSCUOLA'].toString() : '',
          phone: '', // Non disponibile nel database MIUR
          verified: true
        });
      }
    });
  }

  /**
   * Gestisce l'input dell'utente
   */
  handleInput(value) {
    if (!value || value.length < this.minChars) {
      this.hideDropdown();
      this.hideVerificationBadge();
      this.selectedSchool = null;
      return;
    }
    
    if (!this.isLoaded) {
      // Database non ancora caricato
      this.showDropdown([{
        isMessage: true,
        text: this.isLoading ? 
          '⏳ Caricamento database in corso...' : 
          '⚠️ Database non disponibile - puoi comunque registrarti'
      }]);
      return;
    }
    
    // Cerca scuole
    const results = this.searchSchools(value);
    
    if (results.length === 0) {
      this.showDropdown([{
        isMessage: true,
        text: '🔍 Nessuna scuola trovata - puoi comunque registrarti manualmente'
      }]);
      this.hideVerificationBadge();
    } else {
      this.showDropdown(results);
    }
  }

  /**
   * Cerca scuole nel database
   */
  searchSchools(query) {
    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(' ').filter(w => w.length > 0);
    
    return this.schools
      .map(school => {
        // Calcola score di rilevanza
        let score = 0;
        const lowerName = school.name.toLowerCase();
        
        // Match esatto
        if (lowerName === lowerQuery) score += 1000;
        
        // Inizia con query
        if (lowerName.startsWith(lowerQuery)) score += 500;
        
        // Contiene query
        if (lowerName.includes(lowerQuery)) score += 100;
        
        // Tutte le parole presenti
        const allWordsMatch = words.every(word => lowerName.includes(word));
        if (allWordsMatch) score += 50 * words.length;
        
        // Bonus per provincia/città match
        if (school.city && school.city.toLowerCase().includes(lowerQuery)) score += 25;
        if (school.province && school.province.toLowerCase().includes(lowerQuery)) score += 25;
        
        return { school, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.maxResults)
      .map(item => item.school);
  }

  /**
   * Mostra il dropdown con i risultati
   */
  showDropdown(results) {
    this.dropdown.innerHTML = '';
    
    results.forEach((result, index) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.dataset.index = index;
      
      if (result.isMessage) {
        item.className += ' autocomplete-message';
        item.innerHTML = result.text;
      } else {
        item.innerHTML = `
          <div class="autocomplete-item-main">
            <i class="fas fa-school"></i>
            <span class="autocomplete-item-name">${this.highlightMatch(result.name, this.input.value)}</span>
            ${result.verified ? '<i class="fas fa-check-circle verified-icon" title="Scuola verificata"></i>' : ''}
          </div>
          <div class="autocomplete-item-details">
            ${result.type ? `<span class="detail-type">${result.type}</span>` : ''}
            ${result.city ? `<span class="detail-location"><i class="fas fa-map-marker-alt"></i> ${result.city}${result.province ? ` (${result.province})` : ''}</span>` : ''}
          </div>
        `;
        
        if (!result.isMessage) {
          item.addEventListener('click', () => this.selectSchool(result));
        }
      }
      
      this.dropdown.appendChild(item);
    });
    
    this.dropdown.style.display = 'block';
  }

  /**
   * Nascondi dropdown
   */
  hideDropdown() {
    this.dropdown.style.display = 'none';
  }

  /**
   * Evidenzia il testo che corrisponde alla query
   */
  highlightMatch(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Seleziona una scuola
   */
  selectSchool(school) {
    this.selectedSchool = school;
    this.input.value = school.name;
    this.hideDropdown();
    
    // Mostra badge verifica
    this.showVerificationBadge(school);
    
    // Auto-compila altri campi se esistono
    this.autofillFields(school);
    
    console.log('✅ Scuola selezionata:', school.name);
  }

  /**
   * Mostra badge di verifica
   */
  showVerificationBadge(school) {
    if (school.verified) {
      this.verificationBadge.innerHTML = '<i class="fas fa-check-circle"></i> Scuola Verificata';
      this.verificationBadge.className = 'verification-badge verified';
      this.verificationBadge.style.display = 'inline-block';
    }
  }

  /**
   * Nascondi badge verifica
   */
  hideVerificationBadge() {
    this.verificationBadge.style.display = 'none';
  }

  /**
   * Auto-compila campi del form
   */
  autofillFields(school) {
    // Tipo istituto
    const typeSelect = document.getElementById('instituteType');
    if (typeSelect && school.type) {
      // Mappa tipo MIUR a opzioni del form
      const typeMapping = {
        'SCUOLA INFANZIA': "Scuola dell'Infanzia",
        'SCUOLA PRIMARIA': 'Scuola Primaria',
        'SCUOLA SECONDARIA I GRADO': 'Scuola Secondaria di I Grado',
        'LICEO': 'Liceo',
        'ISTITUTO TECNICO': 'Istituto Tecnico',
        'ISTITUTO PROFESSIONALE': 'Istituto Professionale',
        'ISTITUTO SUPERIORE': 'Liceo', // Default
        'UNIVERSITA': 'Università'
      };
      
      const mappedType = typeMapping[school.type.toUpperCase()] || school.type;
      
      // Cerca l'opzione corrispondente
      Array.from(typeSelect.options).forEach(option => {
        if (option.value.includes(mappedType) || option.text.includes(mappedType)) {
          typeSelect.value = option.value;
        }
      });
    }
    
    // ✨ NUOVO: Popola campi hidden con TUTTI i dati dell'istituto
    this.setHiddenField('institute-email-hidden', school.email);
    this.setHiddenField('institute-address-hidden', school.address);
    this.setHiddenField('institute-city-hidden', school.city);
    this.setHiddenField('institute-province-hidden', school.province);
    this.setHiddenField('institute-website-hidden', school.website);
    this.setHiddenField('institute-phone-hidden', ''); // Non disponibile in database MIUR
    this.setHiddenField('institute-code-hidden', school.code);
    
    console.log('✅ Campi auto-compilati:', {
      name: school.name,
      code: school.code,
      email: school.email,
      address: school.address,
      city: school.city,
      province: school.province,
      website: school.website
    });
    
    // Debug: verifica che i campi hidden esistano
    console.log('🔍 Verifica campi hidden:', {
      emailField: !!document.getElementById('institute-email-hidden'),
      addressField: !!document.getElementById('institute-address-hidden'),
      cityField: !!document.getElementById('institute-city-hidden'),
      provinceField: !!document.getElementById('institute-province-hidden'),
      websiteField: !!document.getElementById('institute-website-hidden')
    });
  }

  /**
   * Helper per impostare campi hidden
   */
  setHiddenField(id, value) {
    const field = document.getElementById(id);
    if (field && value) {
      field.value = value;
    }
  }

  /**
   * Gestisce navigazione da tastiera
   */
  handleKeyboard(e) {
    const items = this.dropdown.querySelectorAll('.autocomplete-item:not(.autocomplete-message)');
    if (items.length === 0) return;
    
    const current = this.dropdown.querySelector('.autocomplete-item.active');
    let index = current ? parseInt(current.dataset.index) : -1;
    
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        index = Math.min(index + 1, items.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        index = Math.max(index - 1, 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (current) {
          current.click();
        }
        return;
      case 'Escape':
        this.hideDropdown();
        return;
      default:
        return;
    }
    
    // Rimuovi active da tutti
    items.forEach(item => item.classList.remove('active'));
    
    // Aggiungi active al corrente
    if (items[index]) {
      items[index].classList.add('active');
      items[index].scrollIntoView({ block: 'nearest' });
    }
  }
}

// Inizializza quando il DOM è pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.instituteAutocomplete = new InstituteAutocomplete();
    window.instituteAutocomplete.init();
  });
} else {
  window.instituteAutocomplete = new InstituteAutocomplete();
  window.instituteAutocomplete.init();
}
