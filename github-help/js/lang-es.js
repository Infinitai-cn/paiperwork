if (typeof window.spanishTranslationsLoaded === 'undefined') {
    window.spanishTranslationsLoaded = true;


    const spanishTranslations = {


        // ===== HELP.HTML =====
        helpPageTitle: 'Paiperwork - Ayuda',
        helpMainTitle: 'Ayuda y Documentación',
        loadingHelpContent: 'Cargando contenido de ayuda...',
        returnButton: 'Volver',
        loadingContent: 'Cargando contenido, por favor espera...',
        contentComingSoon: 'El contenido para esta sección estará disponible pronto.',
        inThisSection: 'En Esta Sección:',
        noArticlesAvailable: 'No hay artículos disponibles para esta sección.',
        adminKeyNoticeTitle: 'Se requiere clave de administrador',
        adminKeyNoticeBody: 'Para realizar acciones administrativas esta sesión necesita una clave de administrador. Se almacenará en la sesión del navegador.',
        adminKeyNoticeHint: 'Haga clic en OK para generar y guardar la clave para esta sesión.',
        adminKeySavedToast: 'Clave de administrador guardada en la sesión.',
      

    };

    // Register the language immediately when this script loads
    if (typeof window.Lang !== 'undefined') {
        window.Lang.registerLanguage('es', spanishTranslations);
    } else {
        // If Lang isn't available yet, wait for it
        document.addEventListener('DOMContentLoaded', function () {
            if (window.Lang) {
                window.Lang.registerLanguage('es', spanishTranslations);
            }
        });
    }
}