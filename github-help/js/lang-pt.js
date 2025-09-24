if (typeof window.portugueseTranslationsLoaded === 'undefined') {
    window.portugueseTranslationsLoaded = true;


    const portugueseTranslations = {

        // ===== HELP.HTML =====
        helpPageTitle: 'Paiperwork - Ajuda',
        helpMainTitle: 'Ajuda e Documentação',
        loadingHelpContent: 'Carregando conteúdo de ajuda...',
        returnButton: 'Voltar',
        loadingContent: 'Carregando conteúdo, por favor aguarde...',
        contentComingSoon: 'Conteúdo para esta seção em breve.',
        inThisSection: 'Nesta Seção:',
        noArticlesAvailable: 'Nenhum artigo disponível para esta seção.',


      
    };
    if (typeof window.Lang !== 'undefined') {
        window.Lang.registerLanguage('pt', portugueseTranslations);
    } else {
        // If Lang isn't available yet, wait for it
        document.addEventListener('DOMContentLoaded', function () {
            if (window.Lang) {
                window.Lang.registerLanguage('pt', portugueseTranslations);
            }
        });
    }
}