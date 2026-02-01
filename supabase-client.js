/**
 * Client Supabase Centralizzato per EduNet19
 * Gestisce una singola istanza condivisa del client Supabase
 */

class SupabaseClientManager {
    constructor() {
        this.client = null;
        this.initialized = false;
    }

    // Inizializza il client Supabase (chiamato una sola volta)
    async initialize() {
        if (this.initialized) {
            return this.client;
        }

        try {
            if (!window.SUPABASE_CONFIG) {
                throw new Error('Configurazione Supabase non trovata. Verifica config.js');
            }

            const { url, anonKey, options } = window.SUPABASE_CONFIG;
            
            if (url === 'YOUR_SUPABASE_URL' || anonKey === 'YOUR_SUPABASE_ANON_KEY') {
                console.warn('⚠️ Configurazione Supabase non impostata. Aggiorna config.js con le tue credenziali reali.');
                return null;
            }

            this.client = window.supabase.createClient(url, anonKey, options);
            this.initialized = true;
            
            console.log('✅ Client Supabase centralizzato inizializzato');
            return this.client;

        } catch (error) {
            console.error('❌ Errore inizializzazione client Supabase:', error);
            throw error;
        }
    }

    // Ottiene l'istanza del client (la crea se non esiste)
    async getClient() {
        if (!this.initialized) {
            await this.initialize();
        }
        return this.client;
    }

    // Verifica se il client è inizializzato
    isInitialized() {
        return this.initialized && this.client !== null;
    }

    // Reset del client (per testing o reinizializzazione)
    reset() {
        this.client = null;
        this.initialized = false;
    }
}

// Crea l'istanza globale
window.supabaseClientManager = new SupabaseClientManager();

// Esporta per moduli
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseClientManager;
}