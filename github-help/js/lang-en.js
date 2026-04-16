if (typeof window !== 'undefined'
    && (window.location.pathname.includes('/github-help/')
        || String(document.currentScript && document.currentScript.src || '').includes('/github-help/js/'))
    && typeof window.githubHelpEnglishTranslationsLoaded === 'undefined') {
    window.githubHelpEnglishTranslationsLoaded = true;


    const englishTranslations = {

        // ===== HELP.HTML =====
        helpPageTitle: 'Paiperwork - Help',
        helpMainTitle: 'Help & Documentation',
        loadingHelpContent: 'Loading help content...',
        returnButton: 'Return',
        loadingContent: 'Loading content, please wait...',
        helpTabsScrollableLegend: 'Tab buttons can be scrolled sideways',
        contentComingSoon: 'Content for this section coming soon.',
        inThisSection: 'In This Section:',
        noArticlesAvailable: 'No articles available for this section.',
        adminKeyNoticeTitle: 'Admin key required',
        adminKeyNoticeBody: 'To perform administrative actions this session needs an admin key. It will be stored in your browser session.',
        adminKeyNoticeHint: 'Click OK to generate and save the key for this session.',
        adminKeySavedToast: 'Admin key saved to session.',
        whatsappPersonalModeButton: 'Personal',
        whatsappPersonalModeButtonTitle: 'Personal mode',
        whatsappBotModeButton: 'Bot',
        whatsappBotModeButtonTitle: 'Bot mode',

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