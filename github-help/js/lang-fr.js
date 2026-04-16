if (typeof window.frenchTranslationsLoaded === 'undefined') {
    window.frenchTranslationsLoaded = true;


    const frenchTranslations = {


        // ===== HELP.HTML =====
        helpPageTitle: 'Paiperwork - Aide',
        helpMainTitle: 'Aide et Documentation',
        loadingHelpContent: 'Chargement du contenu d\'aide...',
        returnButton: 'Retour',
        loadingContent: 'Chargement du contenu, veuillez patienter...',
        helpTabsScrollableLegend: 'Les boutons d\'onglet peuvent se faire défiler horizontalement',
        contentComingSoon: 'Le contenu de cette section arrive bientôt.',
        inThisSection: 'Dans Cette Section :',
        noArticlesAvailable: 'Aucun article disponible pour cette section.',
        adminKeyNoticeTitle: "Clé d'administration requise",
        adminKeyNoticeBody: "Pour effectuer des actions administratives, cette session a besoin d'une clé d'administration. Elle sera stockée dans la session du navigateur.",
        adminKeyNoticeHint: "Cliquez sur OK pour générer et enregistrer la clé pour cette session.",
        adminKeySavedToast: "Clé d'administration enregistrée dans la session.",


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