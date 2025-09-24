if (typeof window.frenchTranslationsLoaded === 'undefined') {
    window.frenchTranslationsLoaded = true;


    const frenchTranslations = {


        // ===== HELP.HTML =====
        helpPageTitle: 'Paiperwork - Aide',
        helpMainTitle: 'Aide et Documentation',
        loadingHelpContent: 'Chargement du contenu d\'aide...',
        returnButton: 'Retour',
        loadingContent: 'Chargement du contenu, veuillez patienter...',
        contentComingSoon: 'Le contenu de cette section arrive bientôt.',
        inThisSection: 'Dans Cette Section :',
        noArticlesAvailable: 'Aucun article disponible pour cette section.',


    };
    if (typeof window.Lang !== 'undefined') {
        window.Lang.registerLanguage('fr', frenchTranslations);
    } else {
        // If Lang isn't available yet, wait for it
        document.addEventListener('DOMContentLoaded', function () {
            if (window.Lang) {
                window.Lang.registerLanguage('fr', frenchTranslations);
            }
        });
    }
}