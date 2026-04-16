if (typeof window.germanTranslationsLoaded === 'undefined') {
    window.germanTranslationsLoaded = true;


    const germanTranslations = {


        // ===== HELP.HTML =====
        helpPageTitle: 'Paiperwork - Hilfe',
        helpMainTitle: 'Hilfe & Dokumentation',
        loadingHelpContent: 'Lade Hilfeinhalte...',
        returnButton: 'Zurück',
        loadingContent: 'Lade Inhalt, bitte warten...',
        helpTabsScrollableLegend: 'Die Tab-Schaltflächen können seitlich gescrollt werden',
        contentComingSoon: 'Inhalt für diesen Bereich kommt bald.',
        inThisSection: 'In Diesem Bereich:',
        noArticlesAvailable: 'Keine Artikel für diesen Bereich verfügbar.',
        adminKeyNoticeTitle: 'Administrator-Schlüssel erforderlich',
        adminKeyNoticeBody: 'Um administrative Aktionen auszuführen, benötigt diese Sitzung einen Administrator-Schlüssel. Er wird in Ihrer Browsersitzung gespeichert.',
        adminKeyNoticeHint: 'Klicken Sie auf OK, um den Schlüssel für diese Sitzung zu generieren und zu speichern.',
        adminKeySavedToast: 'Administrator-Schlüssel in der Sitzung gespeichert.',


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