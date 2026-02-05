// Configurazione Supabase per EduNet19
// IMPORTANTE: Sostituisci questi valori con le tue credenziali reali da Supabase

const SUPABASE_CONFIG = {
    // URL del tuo progetto Supabase (da Settings > API) - USA L'URL HTTPS, NON LA CONNECTION STRING
    url: 'https://skuohmocimslevtkqilx.supabase.co',

    // Chiave pubblica anonima (da Settings > API)
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdW9obW9jaW1zbGV2dGtxaWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzMyMDAsImV4cCI6MjA3NzE0OTIwMH0.QobzBcexlGV-bkstuv6v__EeIz3HswzvBvPM8uzYYpY',

    // NOTA: La Service Role Key NON deve MAI essere inclusa nel codice frontend!
    // Usala solo in Edge Functions o backend sicuri.

    // Configurazioni aggiuntive
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
};

// Esporta la configurazione
window.SUPABASE_CONFIG = SUPABASE_CONFIG;

// Esporta anche come variabili globali per compatibilità con Edge Functions
window.SUPABASE_URL = SUPABASE_CONFIG.url;
window.SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;

// === APP CONFIG: Dynamic Base Path for Deployment ===
// Handles navigation for localhost, Cloudflare Pages, and GitHub Pages (subdirectories)
const AppConfig = {
    /**
     * Gets the base path of the application.
     * Works on localhost (e.g., http://localhost:8000/) and subdirectory deploys (e.g., https://user.github.io/repo/).
     * @returns {string} The base path ending with a slash.
     */
    getBasePath() {
        // If we're in a pages/ subdirectory, calculate the root
        const path = window.location.pathname;

        // Check if we're in /pages/ subdirectory
        if (path.includes('/pages/')) {
            // Count how many levels deep we are and go back to root
            const pagesIndex = path.indexOf('/pages/');
            return path.substring(0, pagesIndex + 1);
        }

        // For root-level files (index.html, homepage.html), use the current directory
        const lastSlash = path.lastIndexOf('/');
        if (lastSlash > 0) {
            return path.substring(0, lastSlash + 1);
        }

        return '/';
    },

    /**
     * Gets the full URL for a page relative to the app root.
     * @param {string} page - The page path (e.g., 'homepage.html' or 'pages/profile/profile.html')
     * @returns {string} The full URL to the page.
     */
    getPageUrl(page) {
        // Remove leading slash if present
        const cleanPage = page.startsWith('/') ? page.substring(1) : page;
        return window.location.origin + this.getBasePath() + cleanPage;
    },

    /**
     * Navigates to a page relative to the app root.
     * @param {string} page - The page path (e.g., 'homepage.html')
     */
    navigateTo(page) {
        window.location.href = this.getPageUrl(page);
    },

    /**
     * Checks if the app is running in development mode.
     * @returns {boolean} True if on localhost or 127.0.0.1
     */
    isDev() {
        const devHosts = ['localhost', '127.0.0.1', '0.0.0.0'];
        return devHosts.includes(window.location.hostname);
    }
};

// Make AppConfig globally available
window.AppConfig = AppConfig;

// === GLOBAL PREFERENCES ===
// Theme, font size, and other preferences are now handled exclusively by
// js/utils/preference-loader.js (loaded synchronously in <head> of every page).
// Do NOT duplicate that logic here to avoid inconsistencies.