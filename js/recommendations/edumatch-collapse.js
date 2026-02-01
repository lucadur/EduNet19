/**
 * ===================================================================
 * EDUMATCH COLLAPSE MANAGER
 * Gestisce l'animazione iOS-style per espandere/collassare EduMatch
 * ===================================================================
 */

'use strict';

class EduMatchCollapseManager {
  constructor() {
    this.section = document.getElementById('eduMatchSection');
    this.toggleBtn = document.getElementById('eduMatchToggle');
    this.isCollapsed = false;
    
    // Salva stato nel localStorage
    this.storageKey = 'eduMatchCollapsed';
    
    this.init();
  }

  /**
   * Inizializza il manager
   */
  init() {
    if (!this.section || !this.toggleBtn) {
      console.warn('EduMatch collapse elements not found');
      return;
    }

    // Ripristina stato salvato
    this.restoreState();
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('🔽 EduMatch Collapse Manager - Initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Click sul bottone toggle (nell'header compatto quando collapsed)
    this.toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Click sull'intero header compatto (quando collapsed)
    const header = document.getElementById('eduMatchCollapseHeader');
    if (header) {
      header.addEventListener('click', () => {
        this.toggle();
      });
    }

    // Click sul bottone minimize (nell'header completo quando espanso)
    const minimizeBtn = document.getElementById('eduMatchMinimize');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.collapse();
      });
    }

    // Keyboard accessibility per toggle button
    this.toggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      }
    });

    // Keyboard accessibility per minimize button
    const minimizeBtn2 = document.getElementById('eduMatchMinimize');
    if (minimizeBtn2) {
      minimizeBtn2.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.collapse();
        }
      });
    }
  }

  /**
   * Toggle espansione/collasso
   */
  toggle() {
    if (this.isCollapsed) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  /**
   * Collassa la sezione
   */
  collapse() {
    if (!this.section) return;

    // Aggiungi classe collapsed con animazione iOS-style
    this.section.classList.add('collapsed');
    this.isCollapsed = true;

    // Update ARIA
    this.toggleBtn.setAttribute('aria-expanded', 'false');

    // Salva stato
    this.saveState();

    // Smooth scroll al top della sezione (opzionale)
    setTimeout(() => {
      this.section.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }, 100);
  }

  /**
   * Espandi la sezione
   */
  expand() {
    if (!this.section) return;

    // Rimuovi classe collapsed
    this.section.classList.remove('collapsed');
    this.isCollapsed = false;

    // Update ARIA
    this.toggleBtn.setAttribute('aria-expanded', 'true');

    // Salva stato
    this.saveState();
  }

  /**
   * Salva stato nel localStorage
   */
  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.isCollapsed));
    } catch (error) {
      console.warn('Unable to save EduMatch collapse state:', error);
    }
  }

  /**
   * Ripristina stato dal localStorage
   */
  restoreState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved !== null) {
        const wasCollapsed = JSON.parse(saved);
        if (wasCollapsed) {
          // Applica stato senza animazione
          this.section.classList.add('collapsed');
          this.toggleBtn.setAttribute('aria-expanded', 'false');
          this.isCollapsed = true;
        }
      }
    } catch (error) {
      console.warn('Unable to restore EduMatch collapse state:', error);
    }
  }

  /**
   * API pubblica per forzare stato
   */
  forceCollapse() {
    if (!this.isCollapsed) {
      this.collapse();
    }
  }

  forceExpand() {
    if (this.isCollapsed) {
      this.expand();
    }
  }
}

// Inizializza quando DOM è pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.eduMatchCollapseManager = new EduMatchCollapseManager();
  });
} else {
  window.eduMatchCollapseManager = new EduMatchCollapseManager();
}

console.log('🔽 EduMatch Collapse - Script loaded successfully');
