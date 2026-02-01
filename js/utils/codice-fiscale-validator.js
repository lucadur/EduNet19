/**
 * Codice Fiscale Italiano - Validatore e Estrattore Dati
 * Implementa l'algoritmo ufficiale del Ministero delle Finanze
 * 
 * Verifica che nome, cognome, data di nascita corrispondano al CF inserito
 */

class CodiceFiscaleValidator {
    constructor() {
        // Tabella mesi per codice fiscale
        this.monthCodes = {
            'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'H': 6,
            'L': 7, 'M': 8, 'P': 9, 'R': 10, 'S': 11, 'T': 12
        };
        
        this.monthLetters = ['A', 'B', 'C', 'D', 'E', 'H', 'L', 'M', 'P', 'R', 'S', 'T'];
        
        // Consonanti e vocali per estrazione
        this.consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
        this.vowels = 'AEIOU';
        
        // Tabella caratteri di controllo (posizioni dispari)
        this.oddValues = {
            '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
            'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
            'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
            'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
        };
        
        // Tabella caratteri di controllo (posizioni pari)
        this.evenValues = {
            '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
            'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
            'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
            'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
        };
        
        // Caratteri omocodia (sostituzione numeri con lettere)
        this.omocodiaChars = {
            '0': 'L', '1': 'M', '2': 'N', '3': 'P', '4': 'Q',
            '5': 'R', '6': 'S', '7': 'T', '8': 'U', '9': 'V'
        };
        
        this.omocodiaReverse = {
            'L': '0', 'M': '1', 'N': '2', 'P': '3', 'Q': '4',
            'R': '5', 'S': '6', 'T': '7', 'U': '8', 'V': '9'
        };
        
        // Posizioni che possono essere sostituite per omocodia
        this.omocodiaPositions = [6, 7, 9, 10, 12, 13, 14];
    }

    /**
     * Normalizza una stringa rimuovendo accenti e caratteri speciali
     */
    normalizeString(str) {
        if (!str) return '';
        return str.toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
            .replace(/[^A-Z]/g, ''); // Mantiene solo lettere
    }

    /**
     * Estrae consonanti da una stringa
     */
    getConsonants(str) {
        return str.split('').filter(c => this.consonants.includes(c)).join('');
    }

    /**
     * Estrae vocali da una stringa
     */
    getVowels(str) {
        return str.split('').filter(c => this.vowels.includes(c)).join('');
    }

    /**
     * Genera il codice per il cognome (3 caratteri)
     */
    generateSurnameCode(surname) {
        const normalized = this.normalizeString(surname);
        const consonants = this.getConsonants(normalized);
        const vowels = this.getVowels(normalized);
        
        let code = consonants + vowels + 'XXX';
        return code.substring(0, 3);
    }

    /**
     * Genera il codice per il nome (3 caratteri)
     * Regola speciale: se ci sono 4+ consonanti, usa 1a, 3a e 4a
     */
    generateNameCode(name) {
        const normalized = this.normalizeString(name);
        const consonants = this.getConsonants(normalized);
        const vowels = this.getVowels(normalized);
        
        let code;
        if (consonants.length >= 4) {
            // Usa 1a, 3a e 4a consonante
            code = consonants[0] + consonants[2] + consonants[3];
        } else {
            code = consonants + vowels + 'XXX';
            code = code.substring(0, 3);
        }
        
        return code;
    }

    /**
     * Genera il codice per la data di nascita e sesso (5 caratteri)
     */
    generateBirthDateCode(birthDate, gender) {
        const date = new Date(birthDate);
        const year = date.getFullYear().toString().slice(-2);
        const month = this.monthLetters[date.getMonth()];
        let day = date.getDate();
        
        // Per le donne, aggiungi 40 al giorno
        if (gender === 'F') {
            day += 40;
        }
        
        return year + month + day.toString().padStart(2, '0');
    }

    /**
     * Calcola il carattere di controllo
     */
    calculateCheckChar(partialCF) {
        let sum = 0;
        
        for (let i = 0; i < 15; i++) {
            const char = partialCF[i];
            if (i % 2 === 0) {
                // Posizione dispari (1-based)
                sum += this.oddValues[char];
            } else {
                // Posizione pari (1-based)
                sum += this.evenValues[char];
            }
        }
        
        const remainder = sum % 26;
        return String.fromCharCode(65 + remainder); // A=0, B=1, etc.
    }

    /**
     * Normalizza un CF con omocodia al formato standard
     */
    normalizeOmocodia(cf) {
        let normalized = cf.toUpperCase();
        
        // Sostituisci i caratteri omocodia con i numeri originali
        for (const pos of this.omocodiaPositions) {
            const char = normalized[pos];
            if (this.omocodiaReverse[char]) {
                normalized = normalized.substring(0, pos) + this.omocodiaReverse[char] + normalized.substring(pos + 1);
            }
        }
        
        return normalized;
    }

    /**
     * Estrae la data di nascita dal codice fiscale
     */
    extractBirthDate(cf) {
        const normalized = this.normalizeOmocodia(cf);
        
        let year = parseInt(normalized.substring(6, 8));
        const monthChar = normalized[8];
        let day = parseInt(normalized.substring(9, 11));
        
        // Determina il secolo (assumiamo che chi ha più di 100 anni sia raro)
        const currentYear = new Date().getFullYear() % 100;
        const fullYear = year <= currentYear ? 2000 + year : 1900 + year;
        
        // Determina il sesso e correggi il giorno
        const gender = day > 40 ? 'F' : 'M';
        if (day > 40) day -= 40;
        
        const month = this.monthCodes[monthChar];
        
        if (!month || day < 1 || day > 31) {
            return null;
        }
        
        return {
            date: new Date(fullYear, month - 1, day),
            gender: gender,
            year: fullYear,
            month: month,
            day: day
        };
    }

    /**
     * Calcola l'età da una data di nascita
     */
    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    /**
     * Valida il formato del codice fiscale
     */
    validateFormat(cf) {
        if (!cf || typeof cf !== 'string') {
            return { valid: false, error: 'Codice fiscale mancante' };
        }
        
        const normalized = cf.toUpperCase().trim();
        
        if (normalized.length !== 16) {
            return { valid: false, error: 'Il codice fiscale deve essere di 16 caratteri' };
        }
        
        // Pattern base (considerando omocodia)
        const pattern = /^[A-Z]{6}[A-Z0-9]{2}[A-Z][A-Z0-9]{2}[A-Z][A-Z0-9]{3}[A-Z]$/;
        if (!pattern.test(normalized)) {
            return { valid: false, error: 'Formato codice fiscale non valido' };
        }
        
        return { valid: true, normalized };
    }

    /**
     * Verifica il carattere di controllo
     */
    validateCheckChar(cf) {
        const normalized = cf.toUpperCase();
        const calculatedCheck = this.calculateCheckChar(normalized.substring(0, 15));
        return normalized[15] === calculatedCheck;
    }

    /**
     * Confronta il codice cognome
     */
    compareSurnameCode(cf, surname) {
        const cfSurname = cf.substring(0, 3);
        const expectedSurname = this.generateSurnameCode(surname);
        return cfSurname === expectedSurname;
    }

    /**
     * Confronta il codice nome
     */
    compareNameCode(cf, name) {
        const cfName = cf.substring(3, 6);
        const expectedName = this.generateNameCode(name);
        return cfName === expectedName;
    }

    /**
     * Confronta la data di nascita
     */
    compareBirthDate(cf, birthDate) {
        const extracted = this.extractBirthDate(cf);
        if (!extracted) return false;
        
        const inputDate = new Date(birthDate);
        
        return extracted.year === inputDate.getFullYear() &&
               extracted.month === (inputDate.getMonth() + 1) &&
               extracted.day === inputDate.getDate();
    }

    /**
     * Validazione completa del codice fiscale con dati anagrafici
     */
    validate(cf, firstName, lastName, birthDate) {
        const errors = [];
        
        // 1. Valida formato
        const formatResult = this.validateFormat(cf);
        if (!formatResult.valid) {
            return { valid: false, errors: [formatResult.error] };
        }
        
        const normalized = this.normalizeOmocodia(formatResult.normalized);
        
        // 2. Verifica carattere di controllo
        if (!this.validateCheckChar(normalized)) {
            errors.push('Carattere di controllo non valido');
        }
        
        // 3. Verifica cognome
        if (!this.compareSurnameCode(normalized, lastName)) {
            errors.push('Il cognome non corrisponde al codice fiscale');
        }
        
        // 4. Verifica nome
        if (!this.compareNameCode(normalized, firstName)) {
            errors.push('Il nome non corrisponde al codice fiscale');
        }
        
        // 5. Verifica data di nascita
        if (!this.compareBirthDate(normalized, birthDate)) {
            errors.push('La data di nascita non corrisponde al codice fiscale');
        }
        
        // 6. Estrai e verifica età
        const birthInfo = this.extractBirthDate(normalized);
        const age = birthInfo ? this.calculateAge(birthInfo.date) : null;
        
        return {
            valid: errors.length === 0,
            errors,
            birthInfo,
            age,
            normalized
        };
    }

    /**
     * Validazione per registrazione con controlli età
     */
    validateForRegistration(cf, firstName, lastName, birthDate) {
        const result = this.validate(cf, firstName, lastName, birthDate);
        
        if (!result.valid) {
            return {
                canRegister: false,
                errors: result.errors,
                ageCategory: null
            };
        }
        
        const age = result.age;
        
        // Sotto i 14 anni: registrazione non permessa
        if (age < 14) {
            return {
                canRegister: false,
                errors: ['Devi avere almeno 14 anni per registrarti su EduNet19'],
                ageCategory: 'under_14',
                age
            };
        }
        
        // 14-15 anni: richiede consenso parentale verificato
        if (age < 16) {
            return {
                canRegister: true,
                requiresParentalConsent: true,
                errors: [],
                ageCategory: '14_15',
                age,
                message: 'Per completare la registrazione è necessario il consenso di un genitore o tutore.'
            };
        }
        
        // 16-17 anni: richiede dichiarazione di consenso
        if (age < 18) {
            return {
                canRegister: true,
                requiresMinorDeclaration: true,
                errors: [],
                ageCategory: '16_17',
                age,
                message: 'Dichiara di avere il consenso dei tuoi genitori per procedere.'
            };
        }
        
        // 18+ anni: maggiorenne
        return {
            canRegister: true,
            errors: [],
            ageCategory: 'adult',
            age
        };
    }
}

// Esporta istanza globale
window.codiceFiscaleValidator = new CodiceFiscaleValidator();
