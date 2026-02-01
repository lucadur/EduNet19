/* ===================================================================
   MIUR VALIDATOR - Validazione Istituti contro Database MIUR
   Verifica se un istituto è reale confrontandolo con i dati MIUR
   =================================================================== */

class MIURValidator {
  constructor() {
    this.miurDatabase = null;
    this.isLoaded = false;
    this.schoolNames = new Set();
    this.schoolCodes = new Set();
  }

  /**
   * Carica il database MIUR per la validazione
   */
  async loadDatabase() {
    if (this.isLoaded) return;

    console.log('🔍 MIUR Validator - Caricamento database...');

    try {
      // Determina il path base in base alla pagina corrente
      const basePath = this.getBasePath();
      
      const [statali, paritarie, provinceStatali, provinceParitarie] = await Promise.all([
        fetch(`${basePath}db scuole/scuole-statali.json`).then(r => r.json()).catch(() => ({ '@graph': [] })),
        fetch(`${basePath}db scuole/scuole-paritarie.json`).then(r => r.json()).catch(() => ({ '@graph': [] })),
        fetch(`${basePath}db scuole/scuole-statali-province-autonome.json`).then(r => r.json()).catch(() => ({ '@graph': [] })),
        fetch(`${basePath}db scuole/scuole-paritarie-province-autonome.json`).then(r => r.json()).catch(() => ({ '@graph': [] }))
      ]);

      this.miurDatabase = [
        ...(statali['@graph'] || []),
        ...(paritarie['@graph'] || []),
        ...(provinceStatali['@graph'] || []),
        ...(provinceParitarie['@graph'] || [])
      ];

      // Crea set per ricerca veloce
      this.miurDatabase.forEach(school => {
        const nome = (school['miur:DENOMINAZIONESCUOLA'] || '').toUpperCase().trim();
        const codice = school['miur:CODICESCUOLA'] || '';
        
        if (nome) this.schoolNames.add(nome);
        if (codice) this.schoolCodes.add(codice);
      });

      this.isLoaded = true;
      console.log(`✅ MIUR Validator - Database caricato: ${this.schoolNames.size} nomi, ${this.schoolCodes.size} codici`);
    } catch (error) {
      console.error('❌ MIUR Validator - Errore caricamento:', error);
    }
  }

  /**
   * Determina il path base per i file JSON
   */
  getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/pages/')) {
      return '../../';
    }
    return '';
  }

  /**
   * Verifica se un nome istituto è valido (esiste nel database MIUR)
   */
  async isValidInstituteName(instituteName) {
    if (!instituteName) return { valid: false, reason: 'Nome vuoto' };
    
    await this.loadDatabase();
    
    const nameUpper = instituteName.toUpperCase().trim();
    
    // 1. Verifica corrispondenza esatta
    if (this.schoolNames.has(nameUpper)) {
      return { valid: true, matchType: 'exact', confidence: 1.0 };
    }

    // 2. Verifica corrispondenza parziale (almeno 80% di match)
    const partialMatch = this.findPartialMatch(nameUpper);
    if (partialMatch) {
      return { valid: true, matchType: 'partial', confidence: partialMatch.confidence, matchedName: partialMatch.name };
    }

    // 3. Verifica se contiene parole chiave tipiche di scuole
    const hasSchoolKeywords = this.hasSchoolKeywords(nameUpper);
    if (hasSchoolKeywords.found) {
      // Potrebbe essere una scuola non nel database, ma ha keywords valide
      return { valid: false, reason: 'Non trovato nel database MIUR', hasKeywords: true, keywords: hasSchoolKeywords.keywords };
    }

    // 4. Non è una scuola valida
    return { valid: false, reason: 'Nome non corrisponde a nessuna scuola MIUR' };
  }

  /**
   * Verifica se un codice meccanografico è valido
   */
  async isValidSchoolCode(code) {
    if (!code) return { valid: false, reason: 'Codice vuoto' };
    
    await this.loadDatabase();
    
    const codeUpper = code.toUpperCase().trim();
    
    if (this.schoolCodes.has(codeUpper)) {
      return { valid: true };
    }
    
    return { valid: false, reason: 'Codice meccanografico non trovato' };
  }

  /**
   * Cerca corrispondenza parziale nel database
   */
  findPartialMatch(searchName) {
    let bestMatch = null;
    let bestScore = 0;

    for (const dbName of this.schoolNames) {
      const score = this.calculateSimilarity(searchName, dbName);
      if (score > bestScore && score >= 0.7) {
        bestScore = score;
        bestMatch = dbName;
      }
    }

    if (bestMatch) {
      return { name: bestMatch, confidence: bestScore };
    }
    return null;
  }

  /**
   * Calcola similarità tra due stringhe (Jaccard + contenimento)
   */
  calculateSimilarity(str1, str2) {
    // Rimuovi caratteri speciali e dividi in parole
    const words1 = new Set(str1.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(str2.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));

    if (words1.size === 0 || words2.size === 0) return 0;

    // Intersezione
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    
    // Jaccard similarity
    const union = new Set([...words1, ...words2]);
    const jaccard = intersection.size / union.size;

    // Contenimento (se una stringa contiene l'altra)
    const containment = Math.max(
      intersection.size / words1.size,
      intersection.size / words2.size
    );

    // Media pesata
    return (jaccard * 0.4) + (containment * 0.6);
  }

  /**
   * Tipi di scuole NON ammessi per la registrazione
   */
  static EXCLUDED_SCHOOL_TYPES = [
    'SCUOLA INFANZIA',
    'SCUOLA DELL\'INFANZIA',
    'SCUOLA PRIMARIA',
    'SCUOLA ELEMENTARE'
  ];

  /**
   * Verifica se un tipo di scuola è ammesso per la registrazione
   * Solo scuole medie, superiori e università
   */
  isSchoolTypeAllowed(tipo) {
    if (!tipo || tipo === 'Non Disponibile') return false;
    
    const tipoUpper = tipo.toUpperCase().trim();
    
    // Verifica se è esplicitamente escluso (infanzia, primaria)
    for (const excluded of MIURValidator.EXCLUDED_SCHOOL_TYPES) {
      if (tipoUpper.includes(excluded)) {
        return false;
      }
    }
    
    // Tipi ammessi: medie, superiori, università
    const allowedKeywords = [
      'PRIMO GRADO', 'SECONDARIA', 'LICEO', 'TECNICO', 'PROFESSIONALE',
      'SUPERIORE', 'MAGISTRALE', 'UNIVERSITÀ', 'UNIVERSITA', 'POLITECNICO',
      'ACCADEMIA', 'CONSERVATORIO', 'ITS', 'COMPRENSIVO'
    ];
    
    return allowedKeywords.some(kw => tipoUpper.includes(kw));
  }

  /**
   * Verifica se il nome contiene parole chiave tipiche di scuole
   */
  hasSchoolKeywords(name) {
    // Solo keywords per scuole medie, superiori e università
    const keywords = [
      'ISTITUTO', 'LICEO', 'COMPRENSIVO', 'TECNICO', 
      'PROFESSIONALE', 'SECONDARIA', 'SUPERIORE',
      'CONVITTO', 'CONSERVATORIO', 'ACCADEMIA', 'ITS', 'ITIS',
      'IPSIA', 'IPSSAR', 'IPSEOA', 'ITCG', 'ITCS', 'ITC',
      'UNIVERSITÀ', 'POLITECNICO'
    ];

    const foundKeywords = keywords.filter(kw => name.includes(kw));
    
    return {
      found: foundKeywords.length > 0,
      keywords: foundKeywords
    };
  }

  /**
   * Verifica se un account sembra essere un istituto reale
   * Usa multiple euristiche per determinare la validità
   */
  async validateInstitute(data) {
    const result = {
      isValid: false,
      confidence: 0,
      reasons: [],
      suggestions: []
    };

    const { instituteName, instituteCode, email } = data;

    // 1. Verifica codice meccanografico (più affidabile)
    if (instituteCode) {
      const codeCheck = await this.isValidSchoolCode(instituteCode);
      if (codeCheck.valid) {
        result.isValid = true;
        result.confidence = 1.0;
        result.reasons.push('Codice meccanografico valido');
        return result;
      }
    }

    // 2. Verifica nome istituto
    if (instituteName) {
      const nameCheck = await this.isValidInstituteName(instituteName);
      
      if (nameCheck.valid) {
        result.isValid = true;
        result.confidence = nameCheck.confidence;
        result.reasons.push(`Nome trovato nel database MIUR (${nameCheck.matchType})`);
        if (nameCheck.matchedName) {
          result.suggestions.push(`Nome suggerito: ${nameCheck.matchedName}`);
        }
        return result;
      }

      // Ha keywords ma non trovato
      if (nameCheck.hasKeywords) {
        result.confidence = 0.3;
        result.reasons.push('Contiene parole chiave scolastiche ma non trovato nel database');
        result.suggestions.push('Verifica il nome esatto della scuola nel database MIUR');
      }
    }

    // 3. Verifica email istituzionale
    if (email) {
      const emailLower = email.toLowerCase();
      if (emailLower.endsWith('@istruzione.it') || 
          emailLower.endsWith('@pec.istruzione.it') ||
          emailLower.includes('.edu.it')) {
        result.confidence = Math.max(result.confidence, 0.7);
        result.reasons.push('Email istituzionale riconosciuta');
      }
    }

    // 4. Verifica pattern nome sospetto (account fake)
    if (instituteName) {
      const suspiciousPatterns = [
        /^[a-z0-9]{3,8}$/i,           // Solo lettere/numeri brevi (es. "Jssd9")
        /^[A-Z][a-z]+ [A-Z][a-z]+$/,  // Nome e cognome persona
        /test/i,                       // Contiene "test"
        /prova/i,                      // Contiene "prova"
        /^Istituto Scolastico$/i,     // Nome generico
        /^Scuola$/i                    // Nome troppo generico
      ];

      const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(instituteName));
      
      if (isSuspicious && result.confidence < 0.5) {
        result.reasons.push('Nome sospetto - potrebbe non essere un istituto reale');
        result.suggestions.push('Usa il sistema di autocompilazione MIUR per selezionare la scuola corretta');
      }
    }

    result.isValid = result.confidence >= 0.5;
    return result;
  }

  /**
   * Filtra una lista di istituti, rimuovendo quelli non validi
   */
  async filterValidInstitutes(institutes) {
    await this.loadDatabase();
    
    const results = [];
    
    for (const inst of institutes) {
      const validation = await this.validateInstitute({
        instituteName: inst.institute_name,
        instituteCode: inst.institute_code,
        email: inst.email
      });

      if (validation.isValid) {
        results.push({
          ...inst,
          miur_validation: validation
        });
      }
    }

    return results;
  }
}

// Istanza globale
window.miurValidator = new MIURValidator();

console.log('✅ MIUR Validator - Loaded');
