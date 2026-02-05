/**
 * ===================================================================
 * EDUNET19 - ADVANCED MATCHING ALGORITHM
 * Sistema AI-Powered per matching intelligente tra profili
 * 
 * Features:
 * - Analisi multi-dimensionale dei profili
 * - Apprendimento continuo basato su comportamento utente
 * - Scoring dinamico che si aggiorna nel tempo
 * - Tracciamento completo di tutte le attività
 * ===================================================================
 */

class EduMatchAI {
  constructor() {
    // Pesi dinamici che si aggiornano nel tempo
    this.weights = {
      // Dimensioni primarie (totale 100%)
      contentSimilarity: 30,      // Similarità contenuti (post, progetti)
      behaviorAlignment: 25,       // Allineamento comportamentale
      interestMatch: 20,           // Match interessi e tag
      geographicProximity: 10,     // Vicinanza geografica
      networkOverlap: 10,          // Sovrapposizione network
      searchIntent: 5              // Intent dalle ricerche
    };

    // Decay factors per attività nel tempo
    this.timeDecay = {
      recent: 1.0,        // < 1 settimana
      week: 0.9,          // 1-4 settimane
      month: 0.7,         // 1-3 mesi
      quarter: 0.5,       // 3-6 mesi
      old: 0.3            // > 6 mesi
    };

    // Parametri di apprendimento
    this.learningRate = 0.1;
    this.minDataPoints = 5; // Minimo interazioni per learning
  }

  /**
   * FUNZIONE PRINCIPALE: Calcola affinity score tra due profili
   * @param {Object} profileA - Profilo corrente (quello che fa swipe)
   * @param {Object} profileB - Profilo target
   * @param {Object} activityData - Dati storici attività di A
   * @returns {Object} { score, breakdown, reasons }
   */
  async calculateAffinity(profileA, profileB, activityData) {
    try {
      // 1. Analisi contenuti (post, progetti, metodologie)
      const contentScore = await this.analyzeContentSimilarity(
        profileA, 
        profileB, 
        activityData.posts,
        activityData.projects
      );

      // 2. Analisi comportamento (like, view, share patterns)
      const behaviorScore = await this.analyzeBehaviorAlignment(
        profileA,
        profileB,
        activityData.interactions
      );

      // 3. Match interessi e tag
      const interestScore = this.analyzeInterestMatch(
        profileA,
        profileB,
        activityData.tags
      );

      // 4. Proximity geografica
      const geoScore = this.analyzeGeographicProximity(
        profileA.location,
        profileB.location
      );

      // 5. Network overlap (connessioni comuni)
      const networkScore = await this.analyzeNetworkOverlap(
        profileA,
        profileB
      );

      // 6. Search intent matching
      const searchScore = await this.analyzeSearchIntent(
        activityData.searches,
        profileB
      );

      // Calcolo score finale pesato
      const totalScore = Math.round(
        (contentScore * this.weights.contentSimilarity +
         behaviorScore * this.weights.behaviorAlignment +
         interestScore * this.weights.interestMatch +
         geoScore * this.weights.geographicProximity +
         networkScore * this.weights.networkOverlap +
         searchScore * this.weights.searchIntent) / 100
      );

      // Genera spiegazione dettagliata
      const breakdown = {
        content: contentScore,
        behavior: behaviorScore,
        interests: interestScore,
        geography: geoScore,
        network: networkScore,
        searchIntent: searchScore
      };

      const reasons = this.generateReasons(breakdown, profileA, profileB);

      return {
        score: Math.min(100, Math.max(0, totalScore)),
        breakdown,
        reasons,
        confidence: this.calculateConfidence(activityData)
      };

    } catch (error) {
      console.error('Errore calcolo affinity:', error);
      return { score: 50, breakdown: {}, reasons: [], confidence: 0 };
    }
  }

  /**
   * ANALISI 1: Similarità contenuti (30% peso)
   * Analizza post, progetti, metodologie create
   */
  async analyzeContentSimilarity(profileA, profileB, posts, projects) {
    let score = 0;
    const factors = [];

    // Analizza tematiche post
    if (posts && posts.length > 0) {
      const themeSimilarity = this.compareThemes(
        this.extractThemes(posts.filter(p => p.author_id === profileA.id)),
        profileB.themes || []
      );
      score += themeSimilarity * 40;
      if (themeSimilarity > 0.6) {
        factors.push('Tematiche post molto simili');
      }
    }

    // Analizza tipologia progetti
    if (projects && projects.length > 0) {
      const projectSimilarity = this.compareProjects(
        projects.filter(p => p.creator_id === profileA.id),
        profileB.projects || []
      );
      score += projectSimilarity * 40;
      if (projectSimilarity > 0.7) {
        factors.push('Tipologie di progetto allineate');
      }
    }

    // Analizza metodologie utilizzate
    const methodologySimilarity = this.compareArrays(
      profileA.methodologies || [],
      profileB.methodologies || []
    );
    score += methodologySimilarity * 20;

    return Math.min(100, score);
  }

  /**
   * ANALISI 2: Allineamento comportamentale (25% peso)
   * Analizza pattern di interazione e engagement
   */
  async analyzeBehaviorAlignment(profileA, profileB, interactions) {
    let score = 0;

    if (!interactions || interactions.length < this.minDataPoints) {
      return 50; // Score neutro se dati insufficienti
    }

    // 1. Analizza cosa piace a profileA
    const likedContent = interactions
      .filter(i => i.type === 'like' && i.user_id === profileA.id)
      .map(i => i.target_content);

    // 2. Trova pattern comuni con profileB
    const profileBContent = await this.getProfileContent(profileB.id);
    
    // Similarità contenuti piaciuti vs contenuti di B
    const contentAlignment = this.compareContent(likedContent, profileBContent);
    score += contentAlignment * 50;

    // 3. Analizza timing e frequenza interazioni
    const engagementPattern = this.analyzeEngagementPattern(
      interactions.filter(i => i.user_id === profileA.id)
    );
    const profileBPattern = profileB.engagement_pattern || {};

    const patternSimilarity = this.comparePatterns(engagementPattern, profileBPattern);
    score += patternSimilarity * 30;

    // 4. Analizza tipo di interazioni preferite
    const interactionPreference = this.getInteractionPreference(interactions, profileA.id);
    const profileBInteractions = profileB.interaction_style || {};
    
    const styleSimilarity = this.compareInteractionStyles(
      interactionPreference,
      profileBInteractions
    );
    score += styleSimilarity * 20;

    return Math.min(100, score);
  }

  /**
   * ANALISI 3: Match interessi e tag (20% peso)
   */
  analyzeInterestMatch(profileA, profileB, recentTags) {
    let score = 0;

    // Tag fissi del profilo
    const staticTagScore = this.compareArrays(
      profileA.tags || [],
      profileB.tags || []
    );
    score += staticTagScore * 50;

    // Tag usati di recente (evoluzione interessi)
    if (recentTags && recentTags.length > 0) {
      const recentTagScore = this.compareArrays(
        recentTags.map(t => t.tag),
        profileB.tags || []
      );
      score += recentTagScore * 30;
    }

    // Interessi dichiarati
    const interestScore = this.compareArrays(
      profileA.interests || [],
      profileB.interests || []
    );
    score += interestScore * 20;

    return Math.min(100, score);
  }

  /**
   * ANALISI 4: Prossimità geografica (10% peso)
   */
  analyzeGeographicProximity(locationA, locationB) {
    if (!locationA || !locationB) return 30;

    const { city: cityA, region: regionA, province: provinceA } = this.parseLocation(locationA);
    const { city: cityB, region: regionB, province: provinceB } = this.parseLocation(locationB);

    // Stessa città
    if (cityA && cityB && cityA === cityB) {
      return 100;
    }

    // Stessa provincia
    if (provinceA && provinceB && provinceA === provinceB) {
      return 80;
    }

    // Stessa regione
    if (regionA && regionB && regionA === regionB) {
      return 60;
    }

    // Regioni confinanti
    if (this.areNeighborRegions(regionA, regionB)) {
      return 40;
    }

    // Stessa macro-area (Nord/Centro/Sud)
    if (this.sameMacroArea(regionA, regionB)) {
      return 25;
    }

    return 10; // Italia ma distanti
  }

  /**
   * ANALISI 5: Network overlap (10% peso)
   */
  async analyzeNetworkOverlap(profileA, profileB) {
    try {
      // Ottieni followers/following comuni
      const commonFollowers = await this.getCommonConnections(
        profileA.id,
        profileB.id,
        'followers'
      );

      const commonFollowing = await this.getCommonConnections(
        profileA.id,
        profileB.id,
        'following'
      );

      // Collaboratori comuni
      const commonCollaborators = await this.getCommonCollaborators(
        profileA.id,
        profileB.id
      );

      let score = 0;

      // Più connessioni comuni = più compatibili
      if (commonFollowers.length > 0) {
        score += Math.min(40, commonFollowers.length * 5);
      }

      if (commonFollowing.length > 0) {
        score += Math.min(30, commonFollowing.length * 4);
      }

      if (commonCollaborators.length > 0) {
        score += Math.min(30, commonCollaborators.length * 10);
      }

      return Math.min(100, score);

    } catch (error) {
      console.error('Errore network analysis:', error);
      return 20;
    }
  }

  /**
   * ANALISI 6: Search Intent (5% peso)
   * Analizza cosa cerca l'utente vs cosa offre il profilo target
   */
  async analyzeSearchIntent(searches, profileB) {
    if (!searches || searches.length === 0) return 50;

    let score = 0;
    let matchCount = 0;

    // Estrai keywords dalle ricerche recenti
    const searchKeywords = searches
      .filter(s => this.isRecent(s.created_at, 30)) // Ultime 30 giorni
      .map(s => s.query.toLowerCase().split(' '))
      .flat();

    // Keywords del profilo B
    const profileKeywords = [
      ...(profileB.tags || []),
      ...(profileB.keywords || []),
      profileB.name,
      profileB.description
    ].join(' ').toLowerCase().split(' ');

    // Match keywords
    for (const keyword of searchKeywords) {
      if (keyword.length < 3) continue; // Skip parole troppo corte
      
      if (profileKeywords.some(pk => pk.includes(keyword) || keyword.includes(pk))) {
        matchCount++;
      }
    }

    // Calcola score basato su % di match
    const matchPercentage = matchCount / Math.max(1, searchKeywords.length);
    score = matchPercentage * 100;

    return Math.min(100, score);
  }

  /**
   * UTILITY: Genera spiegazioni human-readable
   */
  generateReasons(breakdown, profileA, profileB) {
    const reasons = [];

    if (breakdown.content >= 70) {
      reasons.push('Contenuti e progetti molto simili ai tuoi');
    }

    if (breakdown.behavior >= 70) {
      reasons.push('Pattern di engagement perfettamente allineati');
    }

    if (breakdown.interests >= 80) {
      reasons.push('Interessi e tag quasi identici');
    }

    if (breakdown.geography >= 80) {
      reasons.push(`Stessa zona: ${profileB.location}`);
    } else if (breakdown.geography >= 60) {
      reasons.push('Vicinanza geografica favorevole');
    }

    if (breakdown.network >= 60) {
      reasons.push('Molte connessioni in comune nella rete');
    }

    if (breakdown.searchIntent >= 70) {
      reasons.push('Corrisponde esattamente alle tue ricerche recenti');
    }

    // Aggiungi almeno 3 ragioni
    if (reasons.length < 3) {
      if (breakdown.content >= 50) {
        reasons.push('Tematiche e approcci educativi compatibili');
      }
      if (breakdown.interests >= 50) {
        reasons.push('Interessi parzialmente sovrapponibili');
      }
      if (reasons.length < 3) {
        reasons.push('Profilo interessante per il tuo network');
      }
    }

    return reasons.slice(0, 4); // Max 4 ragioni
  }

  /**
   * LEARNING: Aggiorna pesi basandosi su feedback utente
   */
  async updateWeightsFromFeedback(userId, targetProfileId, action, actualMatch) {
    try {
      // Recupera predizione originale
      const prediction = await this.getPrediction(userId, targetProfileId);
      if (!prediction) return;

      // Calcola errore
      const expectedMatch = action === 'like' || action === 'super_like';
      const error = expectedMatch !== actualMatch;

      if (error) {
        // Aggiorna pesi usando gradient descent
        const adjustments = this.calculateWeightAdjustments(
          prediction.breakdown,
          expectedMatch,
          actualMatch
        );

        // Applica aggiustamenti graduali
        for (const [dimension, adjustment] of Object.entries(adjustments)) {
          if (this.weights[dimension]) {
            this.weights[dimension] += adjustment * this.learningRate;
          }
        }

        // Normalizza pesi (devono sommare a 100)
        this.normalizeWeights();

        // Salva nuovi pesi nel database
        await this.saveWeights(userId, this.weights);

        console.log('🧠 Pesi aggiornati:', this.weights);
      }

    } catch (error) {
      console.error('Errore learning:', error);
    }
  }

  /**
   * UTILITY FUNCTIONS
   */

  compareArrays(arr1, arr2) {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
    
    const set1 = new Set(arr1.map(i => i.toLowerCase()));
    const set2 = new Set(arr2.map(i => i.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return (intersection.size / union.size) * 100;
  }

  compareThemes(themes1, themes2) {
    // Usa TF-IDF o embeddings per confronto semantico
    // Per ora: confronto semplice
    return this.compareArrays(themes1, themes2) / 100;
  }

  compareProjects(projects1, projects2) {
    if (!projects1 || !projects2) return 0;

    // Confronta tipologie
    const types1 = projects1.map(p => p.type || p.category);
    const types2 = projects2.map(p => p.type || p.category);
    
    return this.compareArrays(types1, types2) / 100;
  }

  comparePatterns(pattern1, pattern2) {
    // Confronta pattern temporali e di frequenza
    if (!pattern1 || !pattern2) return 50;

    let similarity = 0;
    const keys = ['daily_avg', 'peak_hours', 'preferred_days'];

    for (const key of keys) {
      if (pattern1[key] && pattern2[key]) {
        const diff = Math.abs(pattern1[key] - pattern2[key]);
        similarity += (1 - diff / Math.max(pattern1[key], pattern2[key])) * 33.33;
      }
    }

    return similarity;
  }

  compareInteractionStyles(style1, style2) {
    // Confronta preferenze di interazione (like vs comment vs share)
    if (!style1 || !style2) return 50;

    const types = ['like', 'comment', 'share', 'save'];
    let totalDiff = 0;

    for (const type of types) {
      const val1 = style1[type] || 0;
      const val2 = style2[type] || 0;
      const maxVal = Math.max(val1, val2, 1);
      totalDiff += Math.abs(val1 - val2) / maxVal;
    }

    return (1 - totalDiff / types.length) * 100;
  }

  parseLocation(location) {
    // Parse "Milano, Lombardia" -> {city, region, province}
    if (!location) return {};
    
    const parts = location.split(',').map(p => p.trim());
    return {
      city: parts[0] || null,
      region: parts[1] || null,
      province: parts[0] || null // Semplificato
    };
  }

  areNeighborRegions(region1, region2) {
    const neighbors = {
      'Lombardia': ['Piemonte', 'Emilia-Romagna', 'Veneto', 'Trentino-Alto Adige', 'Liguria'],
      'Piemonte': ['Lombardia', 'Liguria', 'Emilia-Romagna', 'Valle d\'Aosta'],
      'Veneto': ['Lombardia', 'Trentino-Alto Adige', 'Friuli-Venezia Giulia', 'Emilia-Romagna'],
      'Emilia-Romagna': ['Lombardia', 'Piemonte', 'Veneto', 'Liguria', 'Toscana', 'Marche'],
      'Liguria': ['Piemonte', 'Lombardia', 'Emilia-Romagna', 'Toscana'],
      'Trentino-Alto Adige': ['Lombardia', 'Veneto'],
      'Friuli-Venezia Giulia': ['Veneto'],
      'Valle d\'Aosta': ['Piemonte'],
      'Toscana': ['Liguria', 'Emilia-Romagna', 'Marche', 'Umbria', 'Lazio'],
      'Lazio': ['Toscana', 'Umbria', 'Marche', 'Abruzzo', 'Molise', 'Campania'],
      'Umbria': ['Toscana', 'Marche', 'Lazio'],
      'Marche': ['Emilia-Romagna', 'Toscana', 'Umbria', 'Lazio', 'Abruzzo'],
      'Abruzzo': ['Marche', 'Lazio', 'Molise'],
      'Molise': ['Abruzzo', 'Lazio', 'Campania', 'Puglia'],
      'Campania': ['Lazio', 'Molise', 'Puglia', 'Basilicata', 'Calabria'],
      'Puglia': ['Molise', 'Campania', 'Basilicata'],
      'Basilicata': ['Campania', 'Puglia', 'Calabria'],
      'Calabria': ['Basilicata', 'Campania'],
      'Sicilia': [],
      'Sardegna': []
    };

    return neighbors[region1]?.includes(region2) || 
           neighbors[region2]?.includes(region1);
  }

  sameMacroArea(region1, region2) {
    const nord = ['Lombardia', 'Piemonte', 'Veneto', 'Liguria', 'Emilia-Romagna', 'Trentino-Alto Adige', 'Friuli-Venezia Giulia', 'Valle d\'Aosta'];
    const centro = ['Toscana', 'Lazio', 'Umbria', 'Marche', 'Abruzzo'];
    const sud = ['Campania', 'Puglia', 'Basilicata', 'Calabria', 'Sicilia', 'Sardegna', 'Molise'];

    return (nord.includes(region1) && nord.includes(region2)) ||
           (centro.includes(region1) && centro.includes(region2)) ||
           (sud.includes(region1) && sud.includes(region2));
  }

  isRecent(timestamp, days) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffDays = (now - date) / (1000 * 60 * 60 * 24);
    return diffDays <= days;
  }

  getTimeDecayFactor(timestamp) {
    const days = (new Date() - new Date(timestamp)) / (1000 * 60 * 60 * 24);
    
    if (days <= 7) return this.timeDecay.recent;
    if (days <= 30) return this.timeDecay.week;
    if (days <= 90) return this.timeDecay.month;
    if (days <= 180) return this.timeDecay.quarter;
    return this.timeDecay.old;
  }

  calculateConfidence(activityData) {
    // Fiducia nella predizione basata su quantità dati
    let dataPoints = 0;
    
    dataPoints += (activityData.posts?.length || 0);
    dataPoints += (activityData.projects?.length || 0);
    dataPoints += (activityData.interactions?.length || 0) / 10;
    dataPoints += (activityData.searches?.length || 0) / 5;

    // Confidence tra 0-100%
    return Math.min(100, (dataPoints / 50) * 100);
  }

  normalizeWeights() {
    const total = Object.values(this.weights).reduce((sum, w) => sum + w, 0);
    for (const key in this.weights) {
      this.weights[key] = (this.weights[key] / total) * 100;
    }
  }

  extractThemes(posts) {
    // Estrae temi principali da post usando NLP
    // Implementazione semplificata
    const allWords = posts
      .map(p => p.content || p.title || '')
      .join(' ')
      .toLowerCase()
      .split(/\s+/);

    const wordFreq = {};
    for (const word of allWords) {
      if (word.length > 4) { // Solo parole significative
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    }

    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  compareContent(content1, content2) {
    // Confronto semantico tra contenuti
    // TODO: Implementare con embeddings o BERT
    if (!content1 || !content2) return 0;

    const keywords1 = this.extractKeywords(content1);
    const keywords2 = this.extractKeywords(content2);

    return this.compareArrays(keywords1, keywords2);
  }

  extractKeywords(content) {
    // Estrazione keywords base
    if (Array.isArray(content)) {
      content = content.map(c => c.content || c.title || '').join(' ');
    }

    return content
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 4)
      .slice(0, 50);
  }

  analyzeEngagementPattern(interactions) {
    // Analizza quando e come l'utente interagisce
    const hours = interactions.map(i => new Date(i.created_at).getHours());
    const days = interactions.map(i => new Date(i.created_at).getDay());

    return {
      daily_avg: interactions.length / 30, // Assumiamo 30 giorni
      peak_hours: this.mode(hours),
      preferred_days: this.mode(days),
      total_interactions: interactions.length
    };
  }

  getInteractionPreference(interactions, userId) {
    const userInteractions = interactions.filter(i => i.user_id === userId);
    const types = userInteractions.reduce((acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {});

    return types;
  }

  mode(arr) {
    // Calcola moda (valore più frequente)
    if (!arr || arr.length === 0) return null;
    
    const freq = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  calculateWeightAdjustments(breakdown, expected, actual) {
    // Calcola quanto aggiustare ogni peso
    const adjustments = {};
    
    for (const [dimension, score] of Object.entries(breakdown)) {
      if (expected && !actual) {
        // False positive - riduci peso dimensione
        adjustments[dimension] = -Math.abs(score - 50) / 10;
      } else if (!expected && actual) {
        // False negative - aumenta peso dimensione
        adjustments[dimension] = Math.abs(score - 50) / 10;
      }
    }

    return adjustments;
  }

  // MOCK FUNCTIONS - Da implementare con chiamate Supabase reali

  async getProfileContent(profileId) {
    // TODO: Query Supabase per ottenere post/progetti del profilo
    return [];
  }

  async getCommonConnections(profileId1, profileId2, type) {
    // TODO: Query per followers/following comuni
    return [];
  }

  async getCommonCollaborators(profileId1, profileId2) {
    // TODO: Query per collaborazioni comuni
    return [];
  }

  async getPrediction(userId, targetProfileId) {
    // TODO: Recupera predizione salvata
    return null;
  }

  async saveWeights(userId, weights) {
    // TODO: Salva pesi personalizzati su Supabase
    console.log('Saving weights for user', userId, weights);
  }
}

// Export per uso globale
if (typeof window !== 'undefined') {
  window.EduMatchAI = EduMatchAI;
}
