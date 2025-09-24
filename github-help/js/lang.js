// Language helper class
class Lang {
    static currentLang = null;
    static loadedLanguages = {};

    static async initialize() {
        // Get stored language preference or system language
        const storedLang = localStorage.getItem('preferredLanguage');
        const browserLang = navigator.language.split('-')[0];

        this.currentLang = storedLang || browserLang;

        // Load the language file
        await this.loadLanguage(this.currentLang);

        /*console.log('Language initialized:', {
            stored: storedLang,
            browser: browserLang,
            selected: this.currentLang
        });*/
    }

static async loadLanguage(lang) {
    // Return early if already loaded
    if (this.loadedLanguages[lang]) {
        //console.log(`Language ${lang} already loaded`);
        return true;
    }

    try {
        // Try to load the language file
        const script = document.createElement('script');
        
        // Auto-detect correct path based on current location and hosting environment
        const currentPath = window.location.pathname;
        const isGitHubPages = window.location.hostname.includes('github.io') || window.location.hostname.includes('githubusercontent.com');
        let langPath;
        
        console.log('Current path for language loading:', currentPath); // Debug log
        console.log('Is GitHub Pages:', isGitHubPages); // Debug log
        console.log('Current hostname:', window.location.hostname); // Debug log
        console.log('Full URL:', window.location.href); // Debug log
        
        if (isGitHubPages) {
            // When hosted on GitHub Pages, construct full path relative to github-help directory
            if (currentPath.includes('/github-help/')) {
                // Already in github-help directory, use relative path
                langPath = `js/lang-${lang}.js`;
            } else {
                // Need to navigate to github-help first
                langPath = `github-help/js/lang-${lang}.js`;
            }
        } else if (currentPath.includes('/core/js/help/')) {
            // help.html at /dev/app/core/js/help/help.html
            langPath = `../translations/lang-${lang}.js`;
        } else if (currentPath.endsWith('/generation.html') || currentPath.includes('/core/generation.html')) {
            // generation.html at /dev/app/core/generation.html
            langPath = `js/translations/lang-${lang}.js`;
        } else if (currentPath.includes('/core/')) {
            // Other files in core directory
            langPath = `js/translations/lang-${lang}.js`;
        } else {
            // index.html, welcome.html at /dev/app/
            langPath = `core/js/translations/lang-${lang}.js`;
        }
        
        console.log('Using language path:', langPath); // Debug log
        script.src = langPath;
        
        return new Promise((resolve, reject) => {
            script.onload = () => {
                // Wait a brief moment to ensure registration completes
                setTimeout(() => {
                    if (this.loadedLanguages[lang]) {
                        //console.log(`Language file lang-${lang}.js loaded successfully from ${langPath}`);
                        resolve(true);
                    } else {
                        console.warn(`Language file loaded but registration failed for ${lang}`);
                        reject(new Error(`Registration failed for ${lang}`));
                    }
                }, 10);
            };
            
            script.onerror = () => {
                console.warn(`Language file lang-${lang}.js not found at ${langPath}, falling back to English`);
                if (lang !== 'en') {
                    // Load English as fallback
                    this.loadLanguage('en').then(resolve).catch(reject);
                    this.currentLang = 'en';
                } else {
                    reject(new Error('English language file not found'));
                }
            };
            
            document.head.appendChild(script);
        });
    } catch (error) {
        console.error(`Error loading language ${lang}:`, error);
        if (lang !== 'en') {
            // Fallback to English
            this.currentLang = 'en';
            return this.loadLanguage('en');
        }
        return false;
    }
}
    static async setLanguage(lang) {
        const loaded = await this.loadLanguage(lang);
        if (loaded && this.loadedLanguages[lang]) {
            this.currentLang = lang;
            localStorage.setItem('preferredLanguage', lang);
            return true;
        }
        return false;
    }

    static getCurrentLanguage() {
        return this.currentLang || 'en';
    }

    static getTranslation(key) {
        const currentLangData = this.loadedLanguages[this.currentLang];
        const fallbackLangData = this.loadedLanguages['en'];
        
        return (currentLangData && currentLangData[key]) || 
               (fallbackLangData && fallbackLangData[key]) || 
               key;
    }

    static get(key, ...args) {
        const translation = this.getTranslation(key);

        if (!translation || translation === key) {
            console.warn(`Missing translation for key: ${key} in language: ${this.currentLang}`);
            return key;
        }

        // If the translation is a function (template), call it with the provided arguments
        if (typeof translation === 'function') {
            return translation(...args);
        }

        // Handle string replacements for both numbered and named parameters
        if (typeof translation === 'string') {
            let result = translation;

            // Handle numbered parameters {0}, {1}, etc.
            result = result.replace(/\{(\d+)\}/g, (match, index) => args[index] || match);

            // Handle named parameters {error}, {model}, etc.
            // Check if first argument is an object (for named variables)
            if (args[0] && typeof args[0] === 'object') {
                result = result.replace(/\{(\w+)\}/g, (match, key) => args[0][key] || match);
            }

            return result;
        }

        return translation;
    }

    // Register a language when its file is loaded
    static registerLanguage(langCode, translations) {
        this.loadedLanguages[langCode] = translations;
        //console.log(`Language ${langCode} registered with ${Object.keys(translations).length} translations`);
    }
}

window.Lang = Lang;