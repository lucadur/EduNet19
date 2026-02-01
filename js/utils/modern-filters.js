/**
 * ===================================================================
 * MODERN FILTERS SYSTEM - Interactive Logic
 * ===================================================================
 */

class ModernFilters {
  constructor() {
    this.filterState = {
      tab: 'all',
      contentTypes: ['post', 'news', 'project', 'methodology', 'event', 'educational_experience', 'collaboration'],
      period: 'all',
      instituteTypes: [],
      sort: 'recent',
      view: 'grid'
    };

    this.init();
  }

  init() {
    console.log('🎛️ Inizializzazione Modern Filters...');
    
    // Sposta il menu nel body per evitare problemi di z-index
    this.moveMenuToBody();
    
    this.setupPrimaryTabs();
    this.setupQuickFilterDropdown();
    this.setupSortDropdown();
    this.setupViewMode();
    this.setupFilterPills();
    this.setupActionButtons();
    this.updateActiveFiltersDisplay();
  }

  // === PRIMARY TABS ===
  setupPrimaryTabs() {
    const tabs = document.querySelectorAll('.primary-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active from all
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });

        // Add active to clicked
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        // Update state
        this.filterState.tab = tab.dataset.feed;

        // Switch sections based on tab
        this.switchSection(this.filterState.tab);

        // Apply filter
        this.applyFilters();
      });
    });
  }

  // === SWITCH SECTIONS ===
  switchSection(tabName) {
    const feedContent = document.getElementById('feed-content');
    const eduMatchSection = document.getElementById('eduMatchSection');
    const discoverSection = document.getElementById('discoverSection');
    const savedPostsSection = document.getElementById('saved-posts-section');

    // Hide discover section
    if (discoverSection) discoverSection.style.display = 'none';
    
    // Hide saved posts section
    if (savedPostsSection) {
      savedPostsSection.classList.add('hidden');
      savedPostsSection.style.display = 'none';
    }

    // Show appropriate section based on tab
    if (tabName === 'discover') {
      // Show Discover section, hide feed and EduMatch
      if (feedContent) feedContent.style.display = 'none';
      if (eduMatchSection) eduMatchSection.style.display = 'none';
      if (discoverSection) {
        discoverSection.style.display = 'block';
      }
      this.hidePostCreationBox();
    } else if (tabName === 'saved') {
      // Show saved posts section at top
      if (savedPostsSection) {
        savedPostsSection.classList.remove('hidden');
        savedPostsSection.style.display = 'block';
        savedPostsSection.style.order = '-1';
      }
      if (feedContent) {
        feedContent.style.order = '1';
        feedContent.style.display = 'block';
      }
      // Nascondi EduMatch nella sezione salvati
      if (eduMatchSection) eduMatchSection.style.display = 'none';
      this.addSavedFeedSeparator();
      this.hidePostCreationBox();
    } else {
      // Show feed for all other tabs (all, following, projects, methodologies)
      if (feedContent) {
        feedContent.style.display = 'block';
        feedContent.style.order = '';
      }
      // Mostra EduMatch per i tab normali
      if (eduMatchSection) {
        eduMatchSection.style.removeProperty('display');
      }
      this.showPostCreationBox();
    }
  }

  // === HIDE POST CREATION BOX ===
  hidePostCreationBox() {
    const postCreationBox = document.querySelector('.post-creation-box');
    if (postCreationBox) {
      postCreationBox.style.display = 'none';
    }
  }

  // === SHOW POST CREATION BOX ===
  showPostCreationBox() {
    const postCreationBox = document.querySelector('.post-creation-box');
    if (postCreationBox) {
      postCreationBox.style.display = '';
    }
  }

  // === ADD SEPARATOR BETWEEN SAVED AND FEED ===
  addSavedFeedSeparator() {
    const feedContent = document.getElementById('feed-content');
    if (!feedContent) return;

    // Remove existing separator if any
    const existingSeparator = document.getElementById('saved-feed-separator');
    if (existingSeparator) {
      existingSeparator.remove();
    }

    // Create separator
    const separator = document.createElement('div');
    separator.id = 'saved-feed-separator';
    separator.className = 'saved-feed-separator';
    separator.innerHTML = `
      <div class="separator-line"></div>
      <div class="separator-content">
        <i class="fas fa-stream"></i>
        <span>Feed Generale</span>
      </div>
      <div class="separator-line"></div>
    `;

    // Insert before feed content
    feedContent.parentElement.insertBefore(separator, feedContent);
  }

  // === QUICK FILTER DROPDOWN ===
  setupQuickFilterDropdown() {
    const toggle = document.getElementById('quickFilterToggle');
    const menu = document.getElementById('quickFilterMenu');
    const overlay = this.createOverlay();

    if (!toggle || !menu) return;

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');

      if (isOpen) {
        this.closeFilterDropdown();
      } else {
        this.openFilterDropdown();
      }
    });

    // Close on overlay click
    overlay.addEventListener('click', () => {
      this.closeFilterDropdown();
      this.closeSortDropdown();
    });

    // Prevent menu close when clicking inside
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  openFilterDropdown() {
    const toggle = document.getElementById('quickFilterToggle');
    const menu = document.getElementById('quickFilterMenu');
    const overlay = document.querySelector('.filters-overlay');

    console.log('🎛️ Opening filter dropdown...');
    
    if (!menu) {
      console.error('❌ Filter menu not found!');
      return;
    }

    // Blocca scroll del body
    document.body.style.overflow = 'hidden';

    // Forza stili inline per garantire visibilità
    menu.style.cssText = `
      display: block !important;
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      z-index: 999999 !important;
      opacity: 1 !important;
      visibility: visible !important;
    `;
    
    // Su mobile, usa stile bottom sheet
    if (window.innerWidth <= 480) {
      menu.style.cssText = `
        display: block !important;
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        top: auto !important;
        transform: none !important;
        z-index: 999999 !important;
        opacity: 1 !important;
        visibility: visible !important;
        max-height: 90vh !important;
        border-radius: 16px 16px 0 0 !important;
        padding-bottom: 100px !important;
      `;
    }
    
    menu.classList.add('open');
    toggle?.classList.add('open', 'active');
    overlay?.classList.add('active');
    
    console.log('✅ Filter dropdown opened');
    // Update live counter when opening
    this.updateLiveCounter();
  }

  closeFilterDropdown() {
    const toggle = document.getElementById('quickFilterToggle');
    const menu = document.getElementById('quickFilterMenu');
    const overlay = document.querySelector('.filters-overlay');

    // Ripristina scroll del body
    document.body.style.overflow = '';

    // Rimuovi stili inline
    if (menu) {
      menu.style.cssText = '';
      menu.classList.remove('open');
    }
    toggle?.classList.remove('open', 'active');
    overlay?.classList.remove('active');
  }

  // === SORT DROPDOWN ===
  setupSortDropdown() {
    const toggle = document.getElementById('sortToggle');
    const menu = document.getElementById('sortMenu');
    const options = menu?.querySelectorAll('.sort-option');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');

      // Chiudi prima il filter dropdown se aperto
      this.closeFilterDropdown();

      if (isOpen) {
        this.closeSortDropdown();
      } else {
        this.openSortDropdown();
      }
    });

    options?.forEach(option => {
      option.addEventListener('click', () => {
        // Update active state
        options.forEach(o => o.classList.remove('active'));
        option.classList.add('active');

        // Update label
        const label = toggle.querySelector('.sort-label');
        const sortName = option.querySelector('span').textContent;
        label.textContent = sortName;

        // Update state
        this.filterState.sort = option.dataset.sort;

        // Close dropdown
        this.closeSortDropdown();

        // Apply filter
        this.applyFilters();
      });
    });
  }

  openSortDropdown() {
    const toggle = document.getElementById('sortToggle');
    const menu = document.getElementById('sortMenu');
    
    // NON usare overlay per sort dropdown - è un dropdown semplice
    // L'overlay con blur è solo per il filter dropdown principale
    
    if (menu) {
      menu.style.cssText = `
        display: block !important;
        z-index: 999999 !important;
      `;
      menu.classList.add('open');
    }
    toggle?.classList.add('open');
    
    // Chiudi cliccando fuori
    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick);
    }, 10);
  }

  handleOutsideClick = (e) => {
    const menu = document.getElementById('sortMenu');
    const toggle = document.getElementById('sortToggle');
    
    if (menu && !menu.contains(e.target) && !toggle?.contains(e.target)) {
      this.closeSortDropdown();
    }
  }

  closeSortDropdown() {
    const toggle = document.getElementById('sortToggle');
    const menu = document.getElementById('sortMenu');

    if (menu) {
      menu.style.cssText = '';
      menu.classList.remove('open');
    }
    toggle?.classList.remove('open');
    
    document.removeEventListener('click', this.handleOutsideClick);
  }

  // === VIEW MODE ===
  setupViewMode() {
    const buttons = document.querySelectorAll('.view-mode-btn');
    buttons?.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.filterState.view = btn.dataset.view;
        this.applyViewMode();
      });
    });
  }

  applyViewMode() {
    const feedContent = document.getElementById('feed-content');
    if (this.filterState.view === 'list') {
      feedContent?.classList.add('list-view');
      feedContent?.classList.remove('grid-view');
    } else {
      feedContent?.classList.add('grid-view');
      feedContent?.classList.remove('list-view');
    }
  }

  // === FILTER PILLS ===
  setupFilterPills() {
    // Content Type checkboxes
    const contentCheckboxes = document.querySelectorAll('input[name="content-type"]');
    contentCheckboxes?.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateContentTypeFilters();
        this.updateLiveCounter(); // Update counter on change
      });
    });

    // Period radio buttons
    const periodRadios = document.querySelectorAll('input[name="period"]');
    periodRadios?.forEach(radio => {
      radio.addEventListener('change', () => {
        this.filterState.period = radio.value;
        this.updateLiveCounter(); // Update counter on change
      });
    });

    // Institute Type checkboxes
    const instituteCheckboxes = document.querySelectorAll('input[name="institute-type"]');
    instituteCheckboxes?.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateInstituteTypeFilters();
        this.updateLiveCounter(); // Update counter on change
      });
    });
  }

  updateContentTypeFilters() {
    const checkboxes = document.querySelectorAll('input[name="content-type"]:checked');
    this.filterState.contentTypes = Array.from(checkboxes).map(cb => cb.value);
  }

  updateInstituteTypeFilters() {
    const checkboxes = document.querySelectorAll('input[name="institute-type"]:checked');
    this.filterState.instituteTypes = Array.from(checkboxes).map(cb => cb.value);
  }
  
  // === LIVE COUNTER ===
  updateLiveCounter() {
    // Get count from homepage
    if (window.eduNetHomepage && typeof window.eduNetHomepage.countMatchingPosts === 'function') {
      const count = window.eduNetHomepage.countMatchingPosts(this.filterState);
      
      // Update apply button text with count
      const applyBtn = document.getElementById('applyFiltersBtn');
      if (applyBtn) {
        const btnText = count === 1 
          ? `Mostra 1 contenuto` 
          : `Mostra ${count} contenuti`;
        
        // Update button content
        applyBtn.innerHTML = `
          <i class="fas fa-check"></i>
          <span>${btnText}</span>
        `;
        
        // Disable if no results
        if (count === 0) {
          applyBtn.classList.add('disabled');
          applyBtn.disabled = true;
        } else {
          applyBtn.classList.remove('disabled');
          applyBtn.disabled = false;
        }
      }
    }
  }

  // === ACTION BUTTONS ===
  setupActionButtons() {
    const applyBtn = document.getElementById('applyFiltersBtn');
    const resetBtn = document.getElementById('resetFiltersBtn');
    const clearAllBtn = document.getElementById('clearAllFilters');
    const closeBtn = document.getElementById('closeFiltersBtn');

    applyBtn?.addEventListener('click', () => {
      this.applyFilters();
      this.closeFilterDropdown();
    });

    resetBtn?.addEventListener('click', () => {
      this.resetFilters();
    });

    clearAllBtn?.addEventListener('click', () => {
      this.clearAllFilters();
    });
    
    closeBtn?.addEventListener('click', () => {
      this.closeFilterDropdown();
    });
  }

  // === APPLY FILTERS ===
  async applyFilters() {
    console.log('🔍 Applicazione filtri:', this.filterState);

    // Update active filters display
    this.updateActiveFiltersDisplay();

    // Update filter count badge
    this.updateFilterCount();

    // Don't filter if on discover tab
    if (this.filterState.tab === 'discover') {
      return;
    }

    // Check if homepage is available
    if (window.eduNetHomepage && typeof window.eduNetHomepage.applyFilters === 'function') {
      // Delegate to homepage for proper rendering
      window.eduNetHomepage.applyFilters(this.filterState);
    } else {
      console.warn('Homepage not available, filters cannot be applied');
    }
  }





  resetFilters() {
    // Reset to defaults
    this.filterState = {
      tab: this.filterState.tab, // Keep current tab
      contentTypes: ['post', 'news', 'project', 'methodology', 'event', 'educational_experience', 'collaboration'],
      period: 'all',
      instituteTypes: [],
      sort: 'recent',
      view: this.filterState.view // Keep current view
    };

    // Reset UI
    document.querySelectorAll('input[name="content-type"]').forEach(cb => {
      cb.checked = true;
    });

    const periodAll = document.querySelector('input[name="period"][value="all"]');
    if (periodAll) periodAll.checked = true;

    document.querySelectorAll('input[name="institute-type"]').forEach(cb => {
      cb.checked = false;
    });

    // Update live counter after reset
    this.updateLiveCounter();

    this.applyFilters();
  }

  clearAllFilters() {
    // Clear all selections
    this.filterState.contentTypes = [];
    this.filterState.instituteTypes = [];

    document.querySelectorAll('input[name="content-type"]').forEach(cb => {
      cb.checked = false;
    });

    document.querySelectorAll('input[name="institute-type"]').forEach(cb => {
      cb.checked = false;
    });

    // Update live counter after clearing
    this.updateLiveCounter();

    this.updateActiveFiltersDisplay();
    this.updateFilterCount();
  }

  // === ACTIVE FILTERS DISPLAY ===
  updateActiveFiltersDisplay() {
    const summary = document.getElementById('activeFiltersSummary');
    const tagsContainer = document.getElementById('activeFilterTags');

    if (!summary || !tagsContainer) return;

    const tags = [];

    // Content types
    if (this.filterState.contentTypes.length > 0 &&
      this.filterState.contentTypes.length < 6) {
      this.filterState.contentTypes.forEach(type => {
        tags.push({ label: this.getContentTypeLabel(type), value: type, category: 'content' });
      });
    }

    // Period
    if (this.filterState.period !== 'all') {
      tags.push({
        label: this.getPeriodLabel(this.filterState.period),
        value: this.filterState.period,
        category: 'period'
      });
    }

    // Institute types
    this.filterState.instituteTypes.forEach(type => {
      tags.push({
        label: this.getInstituteTypeLabel(type),
        value: type,
        category: 'institute'
      });
    });

    // Render tags
    if (tags.length > 0) {
      tagsContainer.innerHTML = tags.map(tag => `
        <span class="filter-tag">
          ${tag.label}
          <button class="filter-tag-remove" data-category="${tag.category}" data-value="${tag.value}">
            <i class="fas fa-times"></i>
          </button>
        </span>
      `).join('');

      summary.style.display = 'flex';

      // Add remove listeners
      tagsContainer.querySelectorAll('.filter-tag-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          this.removeFilter(btn.dataset.category, btn.dataset.value);
        });
      });
    } else {
      summary.style.display = 'none';
    }
  }

  removeFilter(category, value) {
    if (category === 'content') {
      this.filterState.contentTypes = this.filterState.contentTypes.filter(t => t !== value);
      document.querySelector(`input[name="content-type"][value="${value}"]`).checked = false;
    } else if (category === 'period') {
      this.filterState.period = 'all';
      document.querySelector('input[name="period"][value="all"]').checked = true;
    } else if (category === 'institute') {
      this.filterState.instituteTypes = this.filterState.instituteTypes.filter(t => t !== value);
      document.querySelector(`input[name="institute-type"][value="${value}"]`).checked = false;
    }

    this.applyFilters();
  }

  updateFilterCount() {
    const badge = document.querySelector('.active-filters-count');
    const toggle = document.getElementById('quickFilterToggle');

    let count = 0;

    if (this.filterState.contentTypes.length < 6) count++;
    if (this.filterState.period !== 'all') count++;
    count += this.filterState.instituteTypes.length;

    if (count > 0) {
      badge.textContent = count;
      badge.classList.add('has-filters');
      toggle.classList.add('active');
    } else {
      badge.classList.remove('has-filters');
      toggle.classList.remove('active');
    }
  }

  // === HELPERS ===
  createOverlay() {
    let overlay = document.querySelector('.filters-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'filters-overlay';
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  // Sposta il menu fuori dal container per evitare problemi di z-index
  moveMenuToBody() {
    const menu = document.getElementById('quickFilterMenu');
    console.log('🎛️ moveMenuToBody - Menu found:', !!menu);
    
    if (menu && menu.parentElement !== document.body) {
      // Salva riferimento originale
      this.originalMenuParent = menu.parentElement;
      this.originalMenuNextSibling = menu.nextSibling;
      // Sposta nel body
      document.body.appendChild(menu);
      console.log('✅ Filter menu moved to body for proper z-index');
      console.log('📋 Menu now in body:', menu.parentElement === document.body);
    } else if (menu) {
      console.log('📋 Menu already in body');
    } else {
      console.warn('⚠️ Filter menu not found in DOM');
    }
  }

  getContentTypeLabel(type) {
    const labels = {
      'post': '📝 Post',
      'news': '📰 News',
      'project': '💡 Progetti',
      'methodology': '📚 Metodologie',
      'event': '🖼️ Gallerie',
      'educational_experience': '🎓 Esperienze',
      'collaboration': '🤝 Collaborazioni'
    };
    return labels[type] || type;
  }

  getPeriodLabel(period) {
    const labels = {
      'today': '📅 Oggi',
      'week': '📅 Settimana',
      'month': '📅 Mese',
      'year': '📅 Anno'
    };
    return labels[period] || period;
  }

  getInstituteTypeLabel(type) {
    const labels = {
      'primaria': '🎒 Primaria',
      'media': '📖 Media',
      'liceo': '🎓 Liceo',
      'tecnico': '⚙️ Tecnico',
      'professionale': '🔧 Professionale',
      'universita': '🏛️ Università'
    };
    return labels[type] || type;
  }

  showNotification(message) {
    // Temporary simple notification
    console.log('✅', message);
    // TODO: Implement proper notification system
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.modern-filters-container')) {
    window.modernFilters = new ModernFilters();
  }
});
