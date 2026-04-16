const isGithubHelpLanguageRuntime = typeof window !== 'undefined'
    && (window.location.pathname.includes('/github-help/')
        || String(document.currentScript && document.currentScript.src || '').includes('/github-help/js/'));

if (isGithubHelpLanguageRuntime && typeof window.githubHelpChineseTranslationsLoaded === 'undefined') {
        window.githubHelpChineseTranslationsLoaded = true;


        const chineseTranslations = {

                // ===== HELP.HTML =====
                helpPageTitle: 'Paiperwork - 帮助',
                helpMainTitle: '帮助与文档',
                loadingHelpContent: '正在加载帮助内容...',
                returnButton: '返回',
                loadingContent: '正在加载内容，请稍候...',
                helpTabsScrollableLegend: '标签按钮可左右滑动',
                contentComingSoon: '本节内容即将推出。',
                inThisSection: '本节内容：',
                noArticlesAvailable: '本节暂无可用文章。',
                adminKeyNoticeTitle: '需要管理员密钥',
                adminKeyNoticeBody: '要执行管理操作，本次会话需要管理员密钥。它将保存在浏览器会话中。',
                adminKeyNoticeHint: '点击确定以为此会话生成并保存密钥。',
                adminKeySavedToast: '管理员密钥已保存到会话。',

        };
        if (typeof window.Lang !== 'undefined') {
                window.Lang.registerLanguage('zh', chineseTranslations);
        } else {
                // If Lang isn't available yet, wait for it
                document.addEventListener('DOMContentLoaded', function () {
                        if (window.Lang) {
                                window.Lang.registerLanguage('zh', chineseTranslations);
                        }
                });
        }
}


