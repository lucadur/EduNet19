/**
 * ===================================================================
 * EDUNET19 - EDUMATCH SYSTEM
 * Sistema di Match tra Istituti e Studenti - Swipeable Cards Logic
 * ===================================================================
 */

class EduMatch {
  constructor() {
    this.currentCardIndex = 0;
    this.cards = [];
    this.matches = [];
    this.likedProfiles = new Set();
    this.passedProfiles = new Set();
    this.superLikedProfiles = new Set();
    
    // Touch/Mouse tracking
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.currentCard = null;
    
    // AI Algorithm instance
    this.aiEngine = new EduMatchAI();
    
    // User activity data cache
    this.userActivityData = null;
    
    this.init();
  }

  init() {
    console.log('🎯 EduMatch: Inizializzazione sistema match...');
    this.setupEventListeners();
    this.loadCards();
  }

  setupEventListeners() {
    // Action buttons
    const nopeBtn = document.querySelector('.match-action-btn.nope');
    const superBtn = document.querySelector('.match-action-btn.super');
    const likeBtn = document.querySelector('.match-action-btn.like');
    const infoBtn = document.querySelector('.match-action-btn.info');

    if (nopeBtn) nopeBtn.addEventListener('click', () => this.pass());
    if (superBtn) superBtn.addEventListener('click', () => this.superLike());
    if (likeBtn) likeBtn.addEventListener('click', () => this.like());
    if (infoBtn) infoBtn.addEventListener('click', () => this.showInfo());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  async loadCards() {
    const container = document.querySelector('.edumatch-cards-container');
    const loading = document.querySelector('.edumatch-loading');
    const empty = document.querySelector('.edumatch-empty');
    
    // ✅ RESET dell'indice quando si ricaricano le card
    this.currentCardIndex = 0;
    this.cards = [];
    
    if (loading) loading.classList.add('visible');
    if (container) container.innerHTML = '';
    if (empty) empty.classList.remove('visible');

    try {
      // Attendi che l'autenticazione sia pronta
      await this.waitForAuth();
      
      // Carica attività utente per algoritmo AI
      await this.loadUserActivityData();
      
      // ✅ CARICA SEMPRE PROFILI REALI DAL DATABASE
      let profiles = await this.loadProfilesFromDatabase();
      
      // Se non ci sono profili reali, usa profili demo
      if (!profiles || profiles.length === 0) {
        console.warn('⚠️ Nessun profilo trovato nel database, uso profili demo');
        profiles = this.getMockInstituteCards();
      }

      console.log(`✅ Caricati ${profiles.length} profili`);

      // Calcola affinity score con AI per ogni profilo
      this.cards = await this.enrichProfilesWithAI(profiles);

      // Ordina per affinity score decrescente
      this.cards.sort((a, b) => b.affinity - a.affinity);

      this.renderCards();
      
    } catch (error) {
      console.error('❌ Errore caricamento card:', error);
      // In caso di errore, mostra comunque profili demo
      this.cards = this.getMockInstituteCards();
      this.renderCards();
    } finally {
      if (loading) loading.classList.remove('visible');
    }
  }
  
  /**
   * Attende che l'autenticazione sia pronta
   */
  async waitForAuth() {
    // Attendi max 3 secondi per l'autenticazione
    const maxWait = 3000;
    const checkInterval = 100;
    let waited = 0;
    
    while (waited < maxWait) {
      if (window.eduNetAuth && window.eduNetAuth.getCurrentUser()) {
        console.log('✅ EduMatch: Autenticazione pronta');
        return true;
      }
      await this.delay(checkInterval);
      waited += checkInterval;
    }
    
    console.warn('⚠️ EduMatch: Timeout autenticazione, procedo comunque');
    return false;
  }

  async loadUserActivityData() {
    try {
      if (!window.supabase || !window.currentUser) {
        // Mock data per demo
        this.userActivityData = {
          posts: [],
          projects: [],
          interactions: [],
          tags: [],
          searches: []
        };
        return;
      }

      const userId = window.currentUser.id;

      // Carica tutte le attività dell'utente in parallelo
      const [posts, projects, interactions, searches] = await Promise.all([
        this.getUserPosts(userId),
        this.getUserProjects(userId),
        this.getUserInteractions(userId),
        this.getUserSearches(userId)
      ]);

      this.userActivityData = {
        posts,
        projects,
        interactions,
        tags: this.extractRecentTags(interactions),
        searches
      };

      console.log('📊 User activity data loaded:', this.userActivityData);

    } catch (error) {
      console.error('Errore caricamento activity data:', error);
      this.userActivityData = { posts: [], projects: [], interactions: [], tags: [], searches: [] };
    }
  }

  async enrichProfilesWithAI(profiles) {
    const enriched = [];

    for (const profile of profiles) {
      try {
        // Usa algoritmo AI per calcolare affinity
        const currentProfile = await this.getCurrentUserProfile();
        const result = await this.aiEngine.calculateAffinity(
          currentProfile,
          profile,
          this.userActivityData
        );

        enriched.push({
          ...profile,
          affinity: result.score,
          affinityReasons: result.reasons,
          affinityBreakdown: result.breakdown,
          confidence: result.confidence
        });

      } catch (error) {
        console.error('Errore AI affinity per profilo:', profile.id, error);
        // Fallback a score base
        enriched.push({
          ...profile,
          affinity: 50,
          affinityReasons: ['Profilo interessante per il tuo network'],
          affinityBreakdown: {},
          confidence: 0
        });
      }
    }

    return enriched;
  }

  async loadProfilesFromDatabase() {
    try {
      // Verifica che Supabase sia disponibile
      if (!window.eduNetAuth || !window.eduNetAuth.supabase) {
        console.error('❌ Supabase non disponibile');
        return [];
      }

      const supabase = window.eduNetAuth.supabase;
      const currentUser = window.eduNetAuth.getCurrentUser();
      
      if (!currentUser) {
        console.error('❌ Nessun utente loggato');
        return [];
      }

      console.log('🔍 Caricamento istituti dal database...');

      let profiles = [];

      // ✅ SOLO ISTITUTI - Carica tutti gli istituti
      // Nota: per ora mostriamo anche il proprio profilo per test
      // In produzione con più istituti, riattivare il filtro .neq('id', currentUser.id)
      const { data: institutes, error } = await supabase
        .from('school_institutes')
        .select('*')
        .limit(50);

      if (error) throw error;

      console.log('📊 Istituti dal database:', institutes);

      // Trasforma in formato compatibile con EduMatch
      profiles = (institutes || []).map(inst => {
        // ✅ Usa cover_image come immagine principale (campo corretto nel DB)
        const coverImage = inst.cover_image || inst.cover_image_url || null;
        const avatarImage = inst.logo_url || null;
        
        console.log(`📸 Istituto ${inst.institute_name}: cover=${coverImage}, avatar=${avatarImage}`);
        
        return {
          id: inst.id,
          type: 'institute',
          name: inst.institute_name || 'Istituto Sconosciuto',
          location: inst.city && inst.province 
            ? `${inst.city}, ${inst.province}` 
            : inst.city || inst.region || 'Italia',
          instituteType: inst.institute_type || 'Istituto',
          // ✅ CORRETTO: usa cover_image (non cover_image_url)
          image: coverImage,
          avatar: avatarImage,
          description: inst.description || inst.bio || 'Istituto di formazione di qualità',
          tags: this.extractTags(inst),
          stats: {
            projects: 0,
            collaborations: 0,
            followers: 0
          }
        };
      });

      console.log(`✅ Caricati ${profiles.length} profili reali`);
      return profiles;

    } catch (error) {
      console.error('❌ Errore caricamento profili da DB:', error);
      return [];
    }
  }

  // Helper: Estrai tags da istituto
  extractTags(institute) {
    const tags = [];
    
    if (institute.specializations && Array.isArray(institute.specializations)) {
      tags.push(...institute.specializations.slice(0, 3));
    }
    
    if (institute.methodologies && Array.isArray(institute.methodologies)) {
      tags.push(...institute.methodologies.slice(0, 2));
    }
    
    if (institute.interests && Array.isArray(institute.interests)) {
      tags.push(...institute.interests.slice(0, 2));
    }
    
    // Se non ci sono tags, usa defaults
    if (tags.length === 0) {
      tags.push(institute.institute_type || 'Istituto', 'Formazione');
    }
    
    return tags.slice(0, 5); // Max 5 tags
  }

  getMockInstituteCards() {
    return [
      {
        id: 'inst_001',
        type: 'institute',
        name: 'Liceo Scientifico Leonardo da Vinci',
        location: 'Milano, Lombardia',
        instituteType: 'Liceo',
        image: null,
        description: 'Eccellenza nella didattica scientifica e tecnologica. Laboratori all\'avanguardia e progetti innovativi nel campo STEM.',
        affinity: 95,
        affinityReasons: [
          'Entrambi focalizzati su metodologie STEM',
          'Progetti simili su sostenibilità ambientale',
          'Vicinanza geografica (50km)',
          'Storia di collaborazioni con licei scientifici'
        ],
        tags: ['STEM', 'Robotica', 'Sostenibilità', 'Coding'],
        stats: {
          projects: 24,
          collaborations: 15,
          followers: 892
        }
      },
      {
        id: 'inst_002',
        type: 'institute',
        name: 'Istituto Tecnico Enrico Fermi',
        location: 'Roma, Lazio',
        instituteType: 'Istituto Tecnico',
        image: null,
        description: 'Formazione tecnica di eccellenza con focus su Industria 4.0, IoT e Automazione. Partnership con aziende leader del settore.',
        affinity: 88,
        affinityReasons: [
          'Interesse comune per tecnologie digitali',
          'Metodologie didattiche innovative condivise',
          'Progetti di alternanza scuola-lavoro affini',
          'Scambio di best practices già avvenuto'
        ],
        tags: ['Industria 4.0', 'IoT', 'Automazione', 'AI'],
        stats: {
          projects: 31,
          collaborations: 22,
          followers: 1245
        }
      },
      {
        id: 'inst_003',
        type: 'institute',
        name: 'Liceo Classico Dante Alighieri',
        location: 'Firenze, Toscana',
        instituteType: 'Liceo',
        image: null,
        description: 'Tradizione umanistica unita all\'innovazione digitale. Progetti di digitalizzazione del patrimonio culturale.',
        affinity: 76,
        affinityReasons: [
          'Approccio interdisciplinare comune',
          'Progetti di digitalizzazione culturale',
          'Interesse per metodologie didattiche ibride',
          'Rete di istituti partner complementari'
        ],
        tags: ['Umanistica', 'Digital Humanities', 'Cultura', 'Arte'],
        stats: {
          projects: 18,
          collaborations: 12,
          followers: 654
        }
      },
      {
        id: 'inst_004',
        type: 'institute',
        name: 'Istituto Professionale Olivetti',
        location: 'Torino, Piemonte',
        instituteType: 'Istituto Professionale',
        image: null,
        description: 'Formazione professionale di qualità con focus su competenze digitali, design thinking e imprenditorialità.',
        affinity: 82,
        affinityReasons: [
          'Programmi di formazione professionale innovativi',
          'Collaborazioni con il territorio simili',
          'Focus su competenze del futuro',
          'Metodologie project-based learning'
        ],
        tags: ['Design Thinking', 'Imprenditorialità', 'Digitale', 'Startup'],
        stats: {
          projects: 27,
          collaborations: 19,
          followers: 987
        }
      },
      {
        id: 'inst_005',
        type: 'institute',
        name: 'Scuola Secondaria di I Grado Manzoni',
        location: 'Bologna, Emilia-Romagna',
        instituteType: 'Scuola Secondaria di I Grado',
        image: null,
        description: 'Innovazione didattica nella scuola media: flipped classroom, gamification e progetti europei Erasmus+.',
        affinity: 91,
        affinityReasons: [
          'Metodologie didattiche innovative condivise',
          'Partecipazione a progetti Erasmus+',
          'Focus su inclusività e personalizzazione',
          'Esperienza in collaborazioni inter-grado'
        ],
        tags: ['Flipped Classroom', 'Gamification', 'Erasmus+', 'Inclusione'],
        stats: {
          projects: 16,
          collaborations: 10,
          followers: 543
        }
      }
    ];
  }

  renderCards() {
    const container = document.querySelector('.edumatch-cards-container');
    if (!container) return;

    container.innerHTML = '';

    if (this.cards.length === 0) {
      this.showEmpty();
      return;
    }

    // Render fino a 4 card alla volta per l'effetto stack
    const cardsToShow = this.cards.slice(this.currentCardIndex, this.currentCardIndex + 4);
    
    cardsToShow.forEach((cardData, index) => {
      const cardElement = this.createCardElement(cardData, index);
      container.appendChild(cardElement);
      
      // Attach swipe listeners solo alla prima card
      if (index === 0) {
        this.attachSwipeListeners(cardElement);
      }
    });
  }

  createCardElement(data, stackIndex) {
    const wrapper = document.createElement('div');
    wrapper.className = 'edumatch-card-wrapper';
    wrapper.dataset.id = data.id;

    const affinityColor = data.affinity >= 90 ? 'success' : data.affinity >= 80 ? 'primary' : 'warning';
    
    // Genera placeholder colorato basato sul nome
    const placeholderColor = this.getPlaceholderColor(data.name);
    const initials = this.getInitials(data.name);
    
    // Determina se mostrare immagine o placeholder
    const hasImage = data.image && data.image.trim() !== '';
    const hasAvatar = data.avatar && data.avatar.trim() !== '';
    
    wrapper.innerHTML = `
      <div class="match-card">
        <!-- Swipe Indicators -->
        <div class="swipe-indicator nope">
          <i class="fas fa-times"></i>
        </div>
        <div class="swipe-indicator like">
          <i class="fas fa-heart"></i>
        </div>
        <div class="swipe-indicator super">
          <i class="fas fa-star"></i>
        </div>

        <!-- Card Image/Cover -->
        <div class="match-card-image ${hasImage ? 'has-image' : 'no-image'}" style="${!hasImage ? `background: ${placeholderColor};` : ''}">
          ${hasImage ? `<img src="${data.image}" alt="${data.name}" onerror="this.style.display='none'; this.parentElement.classList.add('no-image'); this.parentElement.style.background='${placeholderColor}';">` : ''}
          
          <!-- Avatar overlay (se disponibile) -->
          ${hasAvatar ? `
            <div class="match-card-avatar">
              <img src="${data.avatar}" alt="${data.name}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-school\\'></i>';">
            </div>
          ` : `
            <div class="match-card-avatar placeholder" style="background: ${placeholderColor};">
              <i class="fas fa-school"></i>
            </div>
          `}
          
          <!-- Placeholder content quando non c'è immagine -->
          ${!hasImage ? `
            <div class="match-card-placeholder">
              <i class="fas fa-school"></i>
              <span>${initials}</span>
            </div>
          ` : ''}
          
          <div class="match-card-badge">
            <i class="fas fa-school"></i>
            ${data.instituteType || 'Istituto'}
          </div>
          <div class="match-affinity-score">
            <i class="fas fa-fire"></i>
            ${data.affinity}%
          </div>
        </div>

        <!-- Card Content -->
        <div class="match-card-content">
          <div class="match-card-header">
            <div>
              <h3 class="match-card-title">${data.name}</h3>
              <div class="match-card-subtitle">
                <i class="fas fa-map-marker-alt"></i>
                ${data.location}
              </div>
              <div class="match-card-stats">
                ${this.renderStats(data)}
              </div>
            </div>
          </div>

          <p class="match-card-description">${data.description}</p>

          <div class="match-tags">
            ${data.tags.map(tag => `<span class="match-tag"><i class="fas fa-tag"></i> ${tag}</span>`).join('')}
          </div>

          <div class="match-affinity-reasons">
            <h4>
              <i class="fas fa-bolt"></i>
              Perché ti suggeriamo questo match
            </h4>
            <ul>
              ${data.affinityReasons.map(reason => `<li>${reason}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;

    return wrapper;
  }
  
  // Helper: Genera colore placeholder basato sul nome
  getPlaceholderColor(name) {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    ];
    
    // Usa hash del nome per selezionare colore consistente
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }
  
  // Helper: Estrai iniziali dal nome
  getInitials(name) {
    if (!name) return '?';
    
    const words = name.split(' ').filter(w => w.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  renderStats(data) {
    // Solo istituti
    return `
      <div class="match-stat">
        <i class="fas fa-project-diagram"></i>
        <strong>${data.stats?.projects || 0}</strong> progetti
      </div>
      <div class="match-stat">
        <i class="fas fa-handshake"></i>
        <strong>${data.stats?.collaborations || 0}</strong> collab.
      </div>
    `;
  }

  attachSwipeListeners(cardElement) {
    const card = cardElement.querySelector('.match-card');
    if (!card) return;

    // Mouse events
    card.addEventListener('mousedown', (e) => this.startDrag(e, card));
    document.addEventListener('mousemove', (e) => this.drag(e, card));
    document.addEventListener('mouseup', (e) => this.endDrag(e, card));

    // Touch events
    card.addEventListener('touchstart', (e) => this.startDrag(e, card), { passive: true });
    document.addEventListener('touchmove', (e) => this.drag(e, card), { passive: false });
    document.addEventListener('touchend', (e) => this.endDrag(e, card));
  }

  startDrag(e, card) {
    this.isDragging = true;
    this.currentCard = card;
    card.classList.add('dragging');

    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

    this.startX = clientX;
    this.startY = clientY;
  }

  drag(e, card) {
    if (!this.isDragging || !this.currentCard) return;

    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

    this.currentX = clientX - this.startX;
    this.currentY = clientY - this.startY;

    // Apply transform
    const rotate = this.currentX / 20;
    card.style.transform = `translate(${this.currentX}px, ${this.currentY}px) rotate(${rotate}deg)`;

    // Show indicators
    this.updateIndicators(card);
  }

  updateIndicators(card) {
    const likeIndicator = card.querySelector('.swipe-indicator.like');
    const nopeIndicator = card.querySelector('.swipe-indicator.nope');
    const superIndicator = card.querySelector('.swipe-indicator.super');

    // Reset
    likeIndicator.classList.remove('visible');
    nopeIndicator.classList.remove('visible');
    superIndicator.classList.remove('visible');

    // Show based on direction
    if (this.currentX > 100) {
      likeIndicator.classList.add('visible');
    } else if (this.currentX < -100) {
      nopeIndicator.classList.add('visible');
    } else if (this.currentY < -100) {
      superIndicator.classList.add('visible');
    }
  }

  endDrag(e, card) {
    if (!this.isDragging || !this.currentCard) return;

    this.isDragging = false;
    card.classList.remove('dragging');

    const threshold = 150;
    const superThreshold = 100;

    // Determine action
    if (Math.abs(this.currentX) > threshold) {
      if (this.currentX > 0) {
        this.like(true);
      } else {
        this.pass(true);
      }
    } else if (this.currentY < -superThreshold) {
      this.superLike(true);
    } else {
      // Reset position
      card.style.transform = '';
      this.updateIndicators(card);
    }

    this.currentCard = null;
    this.currentX = 0;
    this.currentY = 0;
  }

  async like(fromSwipe = false) {
    const currentCard = this.cards[this.currentCardIndex];
    if (!currentCard) return;

    this.likedProfiles.add(currentCard.id);
    
    // Salva azione e predizione per learning
    await this.saveLikeAction(currentCard, 'like');
    
    this.animateCardExit('right');
    this.nextCard();

    // Controlla match reale da database
    const hasMatch = await this.checkForMatch(currentCard.id);
    if (hasMatch) {
      setTimeout(() => this.showMatchNotification(currentCard), 400);
    }

    console.log(`💚 Like: ${currentCard.name} (Score: ${currentCard.affinity}%)`);
  }

  async pass(fromSwipe = false) {
    const currentCard = this.cards[this.currentCardIndex];
    if (!currentCard) return;

    this.passedProfiles.add(currentCard.id);
    
    // Salva azione per learning (algoritmo impara dai "no")
    await this.saveLikeAction(currentCard, 'pass');
    
    this.animateCardExit('left');
    this.nextCard();

    console.log(`❌ Pass: ${currentCard.name} (Score era: ${currentCard.affinity}%)`);
  }

  async superLike(fromSwipe = false) {
    const currentCard = this.cards[this.currentCardIndex];
    if (!currentCard) return;

    this.superLikedProfiles.add(currentCard.id);
    
    // Salva super like (peso maggiore per learning)
    await this.saveLikeAction(currentCard, 'super_like');
    
    this.animateCardExit('up');
    this.nextCard();

    // Super like: controlla match + notifica target
    const hasMatch = await this.checkForMatch(currentCard.id, true);
    if (hasMatch) {
      setTimeout(() => this.showMatchNotification(currentCard, true), 400);
    }

    console.log(`⭐ Super Like: ${currentCard.name} (Score: ${currentCard.affinity}%)`);
  }

  animateCardExit(direction) {
    const cardWrapper = document.querySelector('.edumatch-card-wrapper:first-child');
    if (!cardWrapper) return;

    const distance = window.innerWidth;
    let transform;

    switch (direction) {
      case 'left':
        transform = `translateX(-${distance}px) rotate(-30deg)`;
        break;
      case 'right':
        transform = `translateX(${distance}px) rotate(30deg)`;
        break;
      case 'up':
        transform = `translateY(-${distance}px) scale(1.2)`;
        break;
    }

    cardWrapper.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    cardWrapper.style.transform = transform;
    cardWrapper.style.opacity = '0';

    setTimeout(() => {
      if (cardWrapper.parentNode) {
        cardWrapper.remove();
      }
    }, 400);
  }

  nextCard() {
    this.currentCardIndex++;

    if (this.currentCardIndex >= this.cards.length) {
      this.showEmpty();
    } else {
      // Render next card in stack
      setTimeout(() => this.renderCards(), 400);
    }
  }

  showInfo() {
    const currentCard = this.cards[this.currentCardIndex];
    if (!currentCard) return;

    // ❌ DISABILITATO: Non mostrare info card
    // console.log('ℹ️ Info richiesta per:', currentCard.name);
    // TODO: Implementare modal con dettagli completi
  }

  showMatchNotification(profile, isSuperLike = false) {
    const modal = document.getElementById('matchNotificationModal');
    if (!modal) return;

    // Update modal content
    const modalContent = modal.querySelector('.match-notification-content p');
    if (modalContent) {
      modalContent.textContent = isSuperLike 
        ? `${profile.name} ha notato il tuo Super Like! Avete un match eccezionale!`
        : `Hai un nuovo match con ${profile.name}! Iniziate a collaborare!`;
    }

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');

    // Play match sound (opzionale)
    this.playMatchSound();

    // Auto close after 5 seconds
    setTimeout(() => this.closeMatchNotification(), 5000);
  }

  closeMatchNotification() {
    const modal = document.getElementById('matchNotificationModal');
    if (!modal) return;

    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  playMatchSound() {
    // Implementare audio notification (opzionale)
    // const audio = new Audio('/sounds/match.mp3');
    // audio.play().catch(e => console.log('Audio playback failed:', e));
  }

  showEmpty() {
    const empty = document.querySelector('.edumatch-empty');
    const container = document.querySelector('.edumatch-cards-container');
    
    if (empty) empty.classList.add('visible');
    if (container) container.innerHTML = '';

    console.log('✅ Tutte le card visualizzate!');
  }

  showError(message) {
    // Implementare toast notification
    console.error('❌', message);
    
    // Mostra notifica invece di alert
    if (window.eduNetHomepage && typeof window.eduNetHomepage.showNotification === 'function') {
      window.eduNetHomepage.showNotification(message, 'error');
    }
  }

  handleKeyboard(e) {
    if (!this.cards[this.currentCardIndex]) return;

    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.pass();
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.like();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.superLike();
        break;
      case 'i':
      case 'I':
        this.showInfo();
        break;
    }
  }

  // === AI & DATABASE INTEGRATION ===

  async saveLikeAction(profile, actionType) {
    try {
      if (!window.supabase || !window.currentUser) {
        console.log('💾 Mock save:', actionType, profile.name);
        return;
      }

      const { error } = await supabase
        .from('match_actions')
        .insert({
          actor_id: window.currentUser.id,
          target_profile_id: profile.id,
          action_type: actionType,
          predicted_score: profile.affinity,
          prediction_breakdown: profile.affinityBreakdown
        });

      if (error) throw error;

      // Aggiorna pesi algoritmo basandosi sul feedback
      await this.aiEngine.updateWeightsFromFeedback(
        window.currentUser.id,
        profile.id,
        actionType,
        false // Sarà true solo se c'è match confermato
      );

    } catch (error) {
      console.error('Errore salvataggio azione:', error);
    }
  }

  async checkForMatch(targetProfileId, isSuperLike = false) {
    try {
      if (!window.supabase || !window.currentUser) {
        // Mock: simula match probabilistico
        return Math.random() > (isSuperLike ? 0.5 : 0.7);
      }

      // Controlla se target ha già fatto like verso di noi
      const { data: reciprocalLike, error } = await supabase
        .from('match_actions')
        .select('*')
        .eq('actor_id', targetProfileId)
        .eq('target_profile_id', window.currentUser.id)
        .in('action_type', ['like', 'super_like'])
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (reciprocalLike) {
        // È un match! Crea record match
        await this.createMatch(window.currentUser.id, targetProfileId, isSuperLike);
        return true;
      }

      return false;

    } catch (error) {
      console.error('Errore check match:', error);
      return false;
    }
  }

  async createMatch(userId1, userId2, isSuperMatch = false) {
    try {
      if (!window.supabase) return;

      const { error } = await supabase
        .from('matches')
        .insert({
          profile_1_id: Math.min(userId1, userId2),
          profile_2_id: Math.max(userId1, userId2),
          is_super_match: isSuperMatch
        });

      if (error) throw error;

      console.log('🎉 Match creato!');

    } catch (error) {
      console.error('Errore creazione match:', error);
    }
  }

  async getCurrentUserProfile() {
    try {
      if (!window.supabase || !window.currentUser) {
        return {
          id: 'mock-user',
          tags: ['STEM', 'Innovazione', 'Digitale'],
          interests: ['Robotica', 'AI', 'Sostenibilità'],
          location: 'Milano, Lombardia',
          methodologies: ['PBL', 'Flipped Classroom']
        };
      }

      const { data, error } = await supabase
        .from('match_profiles')
        .select('*')
        .eq('user_id', window.currentUser.id)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Errore get current profile:', error);
      return {};
    }
  }

  async getUserPosts(userId) {
    if (!window.supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Errore get posts:', error);
      return [];
    }
  }

  async getUserProjects(userId) {
    if (!window.supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Errore get projects:', error);
      return [];
    }
  }

  async getUserInteractions(userId) {
    if (!window.supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Errore get interactions:', error);
      return [];
    }
  }

  async getUserSearches(userId) {
    if (!window.supabase) return [];
    
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Errore get searches:', error);
      return [];
    }
  }

  extractRecentTags(interactions) {
    // Estrae tag dai contenuti con cui ha interagito
    return interactions
      .filter(i => i.created_at > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .map(i => i.context?.tags || [])
      .flat()
      .filter((tag, index, self) => self.indexOf(tag) === index)
      .slice(0, 20);
  }

  // Utility
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
  // Verifica se siamo nella pagina homepage
  const eduMatchSection = document.querySelector('.edumatch-section');
  if (eduMatchSection) {
    // Inizializza EduMatch con un piccolo delay per assicurarsi che tutto sia pronto
    setTimeout(() => {
      window.eduMatch = new EduMatch();
      
      // Assicurati che EduMatch sia visibile all'avvio
      eduMatchSection.style.removeProperty('display');
      console.log('✅ EduMatch: Sezione visibile e inizializzata');
    }, 300);
  }
});
