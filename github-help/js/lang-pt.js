if (typeof window.portugueseTranslationsLoaded === 'undefined') {
    window.portugueseTranslationsLoaded = true;


    const portugueseTranslations = {

        // ===== HELP.HTML =====
        helpPageTitle: 'Paiperwork - Ajuda',
        helpMainTitle: 'Ajuda e Documentação',
        loadingHelpContent: 'Carregando conteúdo de ajuda...',
        returnButton: 'Voltar',
        loadingContent: 'Carregando conteúdo, por favor aguarde...',
        helpTabsScrollableLegend: 'Os botões das abas podem ser deslocados lateralmente',
        contentComingSoon: 'Conteúdo para esta seção em breve.',
        inThisSection: 'Nesta Seção:',
        noArticlesAvailable: 'Nenhum artigo disponível para esta seção.',
        adminKeyNoticeTitle: 'Chave de administrador necessária',
        adminKeyNoticeBody: 'Para executar ações administrativas, esta sessão precisa de uma chave de administrador. Ela será armazenada na sessão do navegador.',
        adminKeyNoticeHint: 'Clique em OK para gerar e salvar a chave para esta sessão.',
        adminKeySavedToast: 'Chave de administrador salva na sessão.',


      
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