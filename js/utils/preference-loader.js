/**
 * EduNet19 Preference Loader
 * Questo script deve essere incluso nell'<HEAD> di tutte le pagine.
 * Carica e applica le preferenze (Tema, Font) immediatamente per evitare "flash" di contenuto non stilizzato.
 */

(function() {
    const PREF_KEY = 'edunet_settings';
    
    // Valori di default
    const defaults = {
        theme: 'dark',
        fontSize: 'medium',
        autoplayVideos: true,
        dataSaver: false
    };

    function loadPreferences() {
        try {
            const saved = localStorage.getItem(PREF_KEY);
            if (saved) {
                return { ...defaults, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Errore lettura preferenze:', e);
        }
        return defaults;
    }

    const prefs = loadPreferences();

    // 1. Applica Tema - IMMEDIATAMENTE su <html> per evitare flash
    function applyTheme(theme) {
        const root = document.documentElement;
        
        // Applica su <html> immediatamente (funziona anche prima che body esista)
        if (theme === 'dark') {
            root.classList.add('dark-theme');
            root.style.setProperty('color-scheme', 'dark');
        } else if (theme === 'light') {
            root.classList.remove('dark-theme');
            root.style.setProperty('color-scheme', 'light');
        } else if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                root.classList.add('dark-theme');
                root.style.setProperty('color-scheme', 'dark');
            } else {
                root.classList.remove('dark-theme');
                root.style.setProperty('color-scheme', 'light');
            }
        }
        
        // Applica anche su body quando disponibile
        if (document.body) {
            if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
        }
    }

    // 2. Applica Dimensione Font
    function applyFontSize(size) {
        document.documentElement.setAttribute('data-font-size', size);
    }

    // 3. Applica Data Saver
    function applyDataSaver(enabled) {
        if (enabled) {
            document.documentElement.setAttribute('data-saver', 'true');
        } else {
            document.documentElement.removeAttribute('data-saver');
        }
    }

    // Esegui applicazione immediata su <html>
    applyTheme(prefs.theme);
    applyFontSize(prefs.fontSize);
    applyDataSaver(prefs.dataSaver);
    
    // Riapplica su body quando DOM è pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => applyTheme(prefs.theme));
    }

    // Esponi funzioni globali per aggiornamenti live senza ricaricare
    window.EduNetPrefs = {
        applyTheme,
        applyFontSize,
        applyDataSaver,
        get: () => loadPreferences(),
        save: (newPrefs) => {
            const current = loadPreferences();
            const updated = { ...current, ...newPrefs };
            localStorage.setItem(PREF_KEY, JSON.stringify(updated));
            
            // Riapplica subito
            if (newPrefs.theme) applyTheme(newPrefs.theme);
            if (newPrefs.fontSize) applyFontSize(newPrefs.fontSize);
            if (newPrefs.dataSaver !== undefined) applyDataSaver(newPrefs.dataSaver);
        }
    };

    // Ascolta cambiamenti di sistema per il tema automatico
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const current = loadPreferences();
        if (current.theme === 'auto') {
            applyTheme('auto');
        }
    });

})();

