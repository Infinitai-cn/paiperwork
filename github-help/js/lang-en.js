if (typeof window.englishTranslationsLoaded === 'undefined') {
    window.englishTranslationsLoaded = true;


    const englishTranslations = {

        // ===== HELP.HTML =====
        helpPageTitle: 'Paiperwork - Help',
        helpMainTitle: 'Help & Documentation',
        loadingHelpContent: 'Loading help content...',
        returnButton: 'Return',
        loadingContent: 'Loading content, please wait...',
        contentComingSoon: 'Content for this section coming soon.',
        inThisSection: 'In This Section:',
        noArticlesAvailable: 'No articles available for this section.',

    };

    if (typeof window.Lang !== 'undefined') {
        window.Lang.registerLanguage('en', englishTranslations);
    } else {
        // If Lang isn't available yet, wait for it
        document.addEventListener('DOMContentLoaded', function () {
            if (window.Lang) {
                window.Lang.registerLanguage('en', englishTranslations);
            }
        });
    }
}