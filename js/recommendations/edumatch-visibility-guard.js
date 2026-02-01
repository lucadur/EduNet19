/**
 * ===================================================================
 * EDUMATCH VISIBILITY GUARD
 * Assicura che EduMatch rimanga visibile quando necessario
 * ===================================================================
 */

'use strict';

(function() {
  
  // Attendi che la homepage sia pronta
  const waitForHomepage = setInterval(() => {
    if (window.eduNetHomepage && window.eduNetHomepage.isInitialized) {
      clearInterval(waitForHomepage);
      setupVisibilityGuard();
    }
  }, 100);
  
  // Timeout dopo 10 secondi
  setTimeout(() => clearInterval(waitForHomepage), 10000);
  
  function setupVisibilityGuard() {
    console.log('🛡️ EduMatch Visibility Guard: Attivato');
    
    // Funzione per assicurare la visibilità di EduMatch
    function ensureEduMatchVisible() {
      const homepage = window.eduNetHomepage;
      if (!homepage) return;
      
      const currentFeed = homepage.currentFeedType;
      const eduMatchSection = document.getElementById('eduMatchSection');
      
      if (!eduMatchSection) return;
      
      // EduMatch deve essere visibile in tutti i tab tranne "discover" e "saved"
      if (currentFeed !== 'discover' && currentFeed !== 'saved') {
        const currentDisplay = window.getComputedStyle(eduMatchSection).display;
        if (currentDisplay === 'none') {
          eduMatchSection.style.removeProperty('display');
          console.log('🛡️ EduMatch Visibility Guard: Ripristinato EduMatch');
        }
      }
    }
    
    // Controlla la visibilità ogni secondo
    setInterval(ensureEduMatchVisible, 1000);
    
    // Controlla anche quando cambia il feed type
    const originalSwitchFeedTab = window.eduNetHomepage.switchFeedTab;
    if (originalSwitchFeedTab) {
      window.eduNetHomepage.switchFeedTab = function(...args) {
        const result = originalSwitchFeedTab.apply(this, args);
        setTimeout(ensureEduMatchVisible, 200);
        return result;
      };
    }
    
    // Controlla immediatamente
    setTimeout(ensureEduMatchVisible, 500);
  }
  
})();
