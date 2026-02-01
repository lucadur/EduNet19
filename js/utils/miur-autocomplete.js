/* ===================================================================
   MIUR AUTOCOMPLETE - Sistema Autocompilazione Profilo Istituto
   Recupera automaticamente i dati dal database MIUR
   =================================================================== */

class MIURAutocomplete {
  constructor() {
    this.miurDatabase = null;
    this.isLoading = false;
    this.isLoaded = false;
  }

  /**
   * Carica il database MIUR (tutti i file JSON)
   */
  async loadDatabase() {
    if (this.isLoaded) return this.miurDatabase;
    if (this.isLoading) {
      // Aspetta che il caricamento in corso finisca
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (this.isLoaded) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
      return this.miurDatabase;
    }

    this.isLoading = true;
    console.log('📥 Caricamento database MIUR...');

    try {
      // Carica tutti i file JSON in parallelo
      const [statali, paritarie, provinceStatali, provinceParitarie] = await Promise.all([
        fetch('../../db scuole/scuole-statali.json').then(r => r.json()),
        fetch('../../db scuole/scuole-paritarie.json').then(r => r.json()),
        fetch('../../db scuole/scuole-statali-province-autonome.json').then(r => r.json()),
        fetch('../../db scuole/scuole-paritarie-province-autonome.json').then(r => r.json())
      ]);

      // Combina tutti i dati
      this.miurDatabase = [
        ...statali['@graph'],
        ...paritarie['@graph'],
        ...provinceStatali['@graph'],
        ...provinceParitarie['@graph']
      ];

      this.isLoaded = true;
      this.isLoading = false;
      console.log(`✅ Database MIUR caricato: ${this.miurDatabase.length} scuole`);
      return this.miurDatabase;
    } catch (error) {
      console.error('❌ Errore caricamento database MIUR:', error);
      this.isLoading = false;
      throw error;
    }
  }

  /**
   * Cerca una scuola per codice meccanografico
   * Verifica che il tipo di scuola sia ammesso (medie, superiori, università)
   */
  async findSchoolByCode(codiceScuola) {
    if (!this.isLoaded) {
      await this.loadDatabase();
    }

    const school = this.miurDatabase.find(s => 
      s['miur:CODICESCUOLA'] === codiceScuola ||
      s['miur:CODICEISTITUTORIFERIMENTO'] === codiceScuola
    );

    if (!school) {
      console.warn(`⚠️ Scuola non trovata: ${codiceScuola}`);
      return null;
    }

    // Verifica che il tipo di scuola sia ammesso
    const tipo = school['miur:DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA'] || '';
    if (!this.isSchoolTypeAllowed(tipo)) {
      console.warn(`⚠️ Tipo di scuola non ammesso: ${tipo}`);
      return { 
        error: true, 
        message: 'Al momento sono supportate solo scuole medie, superiori e università.',
        schoolType: tipo
      };
    }

    return this.extractSchoolData(school);
  }

  /**
   * Cerca scuole per nome (per autocomplete)
   * Filtra solo scuole medie, superiori e università
   */
  async searchSchools(query, limit = 10) {
    if (!this.isLoaded) {
      await this.loadDatabase();
    }

    const queryLower = query.toLowerCase();
    const results = this.miurDatabase
      .filter(s => {
        const nome = (s['miur:DENOMINAZIONESCUOLA'] || '').toLowerCase();
        const comune = (s['miur:DESCRIZIONECOMUNE'] || '').toLowerCase();
        const tipo = s['miur:DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA'] || '';
        
        // Prima verifica se il tipo di scuola è ammesso
        if (!this.isSchoolTypeAllowed(tipo)) {
          return false;
        }
        
        // Poi verifica la corrispondenza con la query
        return nome.includes(queryLower) || comune.includes(queryLower);
      })
      .slice(0, limit)
      .map(s => this.extractSchoolData(s));

    return results;
  }

  /**
   * Estrae e normalizza i dati della scuola
   */
  extractSchoolData(school) {
    // Filtra tipologie valide (solo quelle standard)
    const tipoIstituto = this.normalizeSchoolType(
      school['miur:DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA']
    );

    // Estrai dati
    const data = {
      // Identificatori
      codice_scuola: school['miur:CODICESCUOLA'] || null,
      codice_istituto_riferimento: school['miur:CODICEISTITUTORIFERIMENTO'] || null,
      
      // Dati principali
      institute_name: this.cleanValue(school['miur:DENOMINAZIONESCUOLA']),
      institute_type: tipoIstituto,
      
      // Contatti
      email: this.cleanValue(school['miur:INDIRIZZOEMAILSCUOLA']),
      pec: this.cleanValue(school['miur:INDIRIZZOPECSCUOLA']),
      website: this.cleanValue(school['miur:SITOWEBSCUOLA']),
      
      // Indirizzo
      address: this.cleanValue(school['miur:INDIRIZZOSCUOLA']),
      city: this.cleanValue(school['miur:DESCRIZIONECOMUNE']),
      province: this.cleanValue(school['miur:PROVINCIA']),
      cap: school['miur:CAPSCUOLA'] ? String(school['miur:CAPSCUOLA']).replace('.0', '') : null,
      
      // Dati aggiuntivi
      regione: this.cleanValue(school['miur:REGIONE']),
      area_geografica: this.cleanValue(school['miur:AREAGEOGRAFICA']),
      
      // Metadata
      anno_scolastico: school['miur:ANNOSCOLASTICO'],
      fonte: 'MIUR',
      data_import: new Date().toISOString()
    };

    return data;
  }

  /**
   * Tipi di scuole ammessi per la registrazione
   * Mappatura dai valori MIUR reali alle categorie del frontend
   * 
   * CATEGORIE FRONTEND:
   * - "Scuola Secondaria di I Grado" (medie)
   * - "Scuola Secondaria di II Grado" (superiori generiche)
   * - "Liceo" (licei)
   * - "Istituto Tecnico" (tecnici)
   * - "Istituto Professionale" (professionali)
   * - "ITS" (istituti tecnici superiori)
   * - "Università" (università e alta formazione)
   */
  
  /**
   * Mappatura COMPLETA dei tipi MIUR ai tipi frontend
   * Basata sui valori reali trovati nei database MIUR
   */
  static MIUR_TYPE_MAPPINGS = {
    // === SCUOLE MEDIE (Secondaria di I Grado) ===
    'SCUOLA PRIMO GRADO': 'Scuola Secondaria di I Grado',
    'SCUOLA SEC. PRIMO GRADO NON STATALE': 'Scuola Secondaria di I Grado',
    'SCUOLA SEC. PRIMO GRADO STATALE': 'Scuola Secondaria di I Grado',
    
    // === LICEI ===
    'LICEO SCIENTIFICO': 'Liceo',
    'LICEO CLASSICO': 'Liceo',
    'LICEO ARTISTICO': 'Liceo',
    'LICEO LINGUISTICO': 'Liceo',
    
    // === ISTITUTI TECNICI ===
    'ISTITUTO TECNICO INDUSTRIALE': 'Istituto Tecnico',
    'ISTITUTO TECNICO COMMERCIALE': 'Istituto Tecnico',
    'ISTITUTO TECNICO PER GEOMETRI': 'Istituto Tecnico',
    'ISTITUTO TECNICO AGRARIO': 'Istituto Tecnico',
    'ISTITUTO TECNICO NAUTICO': 'Istituto Tecnico',
    'ISTITUTO TECNICO AERONAUTICO': 'Istituto Tecnico',
    'ISTITUTO TECNICO PER IL TURISMO': 'Istituto Tecnico',
    'IST TEC COMMERCIALE E PER GEOMETRI': 'Istituto Tecnico',
    'IST TECNICO ECONOMICO E TECNOLOGICO': 'Istituto Tecnico',
    'ISTITUTO TECNICO PER ATTIVITA\' SOCIALI (GIA\' ITF)': 'Istituto Tecnico',
    
    // === ISTITUTI PROFESSIONALI ===
    'IST PROF INDUSTRIA E ARTIGIANATO': 'Istituto Professionale',
    'IST PROF ALBERGHIERO': 'Istituto Professionale',
    'IST PROF PER I SERVIZI ALBERGHIERI E RISTORAZIONE': 'Istituto Professionale',
    'IST PROF PER I SERVIZI COMMERCIALI E TURISTICI': 'Istituto Professionale',
    'IST PROF PER I SERVIZI COMMERCIALI': 'Istituto Professionale',
    'IST PROF PER I SERVIZI SOCIALI': 'Istituto Professionale',
    'IST PROF PER I SERVIZI TURISTICI': 'Istituto Professionale',
    'IST PROF PER I SERVIZI PUBBLICITARI': 'Istituto Professionale',
    'IST PROF PER I SERVIZI COMM TUR E DELLA PUBB': 'Istituto Professionale',
    'IST PROF PER L\'AGRICOLTURA E L\'AMBIENTE': 'Istituto Professionale',
    'IST PROF PER L\'AGRICOLTURA': 'Istituto Professionale',
    'IST PROF INDUSTRIA E ARTIGIANATO PER CIECHI': 'Istituto Professionale',
    'IST PROF INDUSTRIA E ARTIGIANATO PER SORDOMUTI': 'Istituto Professionale',
    'IST PROF INDUSTRIA E ATTIVITA\' MARINARE': 'Istituto Professionale',
    'IST PROF CINEMATOGRAFIA E TELEVISIONE': 'Istituto Professionale',
    
    // === SCUOLE SUPERIORI GENERICHE ===
    'SCUOLA SEC. SECONDO GRADO NON STATALE': 'Scuola Secondaria di II Grado',
    'SCUOLA SEC. SECONDO GRADO STATALE': 'Scuola Secondaria di II Grado',
    'ISTITUTO SUPERIORE': 'Scuola Secondaria di II Grado',
    'ISTITUTO MAGISTRALE': 'Liceo', // Ex magistrali ora sono licei
    'SCUOLA MAGISTRALE': 'Liceo',
    'ISTITUTO D\'ARTE': 'Liceo', // Ora sono licei artistici
    
    // === CONVITTI E EDUCANDATI (superiori) ===
    'CONVITTO NAZIONALE': 'Scuola Secondaria di II Grado',
    'CONVITTO ANNESSO': 'Scuola Secondaria di II Grado',
    'EDUCANDATO': 'Scuola Secondaria di II Grado',
    
    // === ISTITUTI COMPRENSIVI (possono avere medie) ===
    'ISTITUTO COMPRENSIVO': 'Scuola Secondaria di I Grado'
  };

  /**
   * Tipi di scuole NON ammessi (infanzia, primaria, centri territoriali)
   */
  static EXCLUDED_SCHOOL_TYPES = [
    'SCUOLA INFANZIA',
    'SCUOLA PRIMARIA',
    'CENTRO TERRITORIALE'
  ];

  /**
   * Verifica se un tipo di scuola è ammesso per la registrazione
   */
  isSchoolTypeAllowed(tipo) {
    if (!tipo || tipo === 'Non Disponibile') return false;
    
    const tipoUpper = tipo.toUpperCase().trim();
    
    // Prima verifica se è esplicitamente escluso
    for (const excluded of MIURAutocomplete.EXCLUDED_SCHOOL_TYPES) {
      if (tipoUpper.includes(excluded)) {
        return false;
      }
    }
    
    // Verifica se esiste una mappatura diretta
    if (MIURAutocomplete.MIUR_TYPE_MAPPINGS[tipoUpper]) {
      return true;
    }
    
    // Verifica varianti abbreviate MIUR
    if (tipoUpper.includes('SEC.') && tipoUpper.includes('SECONDO GRADO')) {
      return true;
    }
    if (tipoUpper.includes('SEC.') && tipoUpper.includes('PRIMO GRADO')) {
      return true;
    }
    
    // Verifica keywords per superiori
    const superiorKeywords = ['LICEO', 'TECNICO', 'PROFESSIONALE', 'SUPERIORE', 'MAGISTRALE', 'IST PROF', 'IST TEC'];
    if (superiorKeywords.some(kw => tipoUpper.includes(kw))) {
      return true;
    }
    
    // Default: non ammesso
    console.warn(`⚠️ Tipo scuola non riconosciuto: "${tipo}"`);
    return false;
  }

  /**
   * Normalizza il tipo di istituto MIUR al tipo frontend
   */
  normalizeSchoolType(tipo) {
    if (!tipo || tipo === 'Non Disponibile') return null;

    const tipoUpper = tipo.toUpperCase().trim();
    
    // Cerca mappatura diretta
    if (MIURAutocomplete.MIUR_TYPE_MAPPINGS[tipoUpper]) {
      return MIURAutocomplete.MIUR_TYPE_MAPPINGS[tipoUpper];
    }
    
    // Gestisci varianti abbreviate MIUR
    if (tipoUpper.includes('SEC.') && tipoUpper.includes('SECONDO GRADO')) {
      return 'Scuola Secondaria di II Grado';
    }
    if (tipoUpper.includes('SEC.') && tipoUpper.includes('PRIMO GRADO')) {
      return 'Scuola Secondaria di I Grado';
    }
    
    // Cerca corrispondenza parziale per keywords
    if (tipoUpper.includes('LICEO')) return 'Liceo';
    if (tipoUpper.includes('IST PROF') || tipoUpper.includes('PROFESSIONALE')) return 'Istituto Professionale';
    if (tipoUpper.includes('IST TEC') || tipoUpper.includes('TECNICO')) return 'Istituto Tecnico';
    if (tipoUpper.includes('SUPERIORE')) return 'Scuola Secondaria di II Grado';
    if (tipoUpper.includes('MAGISTRALE')) return 'Liceo';
    if (tipoUpper.includes('COMPRENSIVO')) return 'Scuola Secondaria di I Grado';
    
    // Se arriviamo qui, il tipo non è mappato - log warning
    console.warn(`⚠️ Tipo MIUR non mappato: "${tipo}"`);
    return null;
  }

  /**
   * Pulisce i valori "Non Disponibile" e stringhe vuote
   */
  cleanValue(value) {
    if (!value || 
        value === 'Non Disponibile' || 
        value === 'NON DISPONIBILE' ||
        value.trim() === '') {
      return null;
    }
    return value.trim();
  }

  /**
   * Valida i dati estratti
   */
  validateData(data) {
    const errors = [];
    const warnings = [];

    // Campi obbligatori
    if (!data.institute_name) {
      errors.push('Nome istituto mancante');
    }

    if (!data.codice_scuola) {
      errors.push('Codice scuola mancante');
    }

    // Campi consigliati
    if (!data.email) {
      warnings.push('Email non disponibile - Inseriscila manualmente nel campo "Email Amministratore"');
    }

    if (!data.website) {
      warnings.push('Sito web non disponibile nel database MIUR');
    }

    if (!data.address) {
      warnings.push('Indirizzo non disponibile nel database MIUR');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Formatta i dati per il salvataggio su Supabase
   */
  formatForDatabase(data) {
    return {
      // Campi tabella school_institutes
      institute_name: data.institute_name,
      institute_type: data.institute_type || 'Altro',
      institute_code: data.codice_scuola,
      
      email: data.email,
      website: data.website,
      
      address: data.address,
      city: data.city,
      province: data.province,
      
      // Metadata MIUR
      miur_data: {
        codice_scuola: data.codice_scuola,
        codice_istituto_riferimento: data.codice_istituto_riferimento,
        pec: data.pec,
        cap: data.cap,
        regione: data.regione,
        area_geografica: data.area_geografica,
        anno_scolastico: data.anno_scolastico,
        fonte: data.fonte,
        data_import: data.data_import
      }
    };
  }
}

// Istanza globale
window.miurAutocomplete = new MIURAutocomplete();

console.log('✅ MIUR Autocomplete - Loaded');
