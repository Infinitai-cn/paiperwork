if (typeof window.germanTranslationsLoaded === 'undefined') {
    window.germanTranslationsLoaded = true;


    const germanTranslations = {


        // ===== HELP.HTML =====
        helpPageTitle: 'Paiperwork - Hilfe',
        helpMainTitle: 'Hilfe & Dokumentation',
        loadingHelpContent: 'Lade Hilfeinhalte...',
        returnButton: 'Zurück',
        loadingContent: 'Lade Inhalt, bitte warten...',
        contentComingSoon: 'Inhalt für diesen Bereich kommt bald.',
        inThisSection: 'In Diesem Bereich:',
        noArticlesAvailable: 'Keine Artikel für diesen Bereich verfügbar.',


    };
    if (typeof window.Lang !== 'undefined') {
        window.Lang.registerLanguage('de', germanTranslations);
    } else {
        // If Lang isn't available yet, wait for it
        document.addEventListener('DOMContentLoaded', function () {
            if (window.Lang) {
                window.Lang.registerLanguage('de', germanTranslations);
            }
        });
    }
}