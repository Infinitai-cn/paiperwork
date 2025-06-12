if (typeof window.russianTranslationsLoaded === 'undefined') {
    window.russianTranslationsLoaded = true;


    const russianTranslations = {



        // ===== HELP.HTML =====
        helpPageTitle: 'Paiperwork - Справка',
        helpMainTitle: 'Справка и Документация',
        loadingHelpContent: 'Загрузка справочного контента...',
        returnButton: 'Вернуться',
        loadingContent: 'Загрузка контента, пожалуйста подождите...',
        contentComingSoon: 'Контент для этого раздела скоро появится.',
        inThisSection: 'В Этом Разделе:',
        noArticlesAvailable: 'Нет доступных статей для этого раздела.',

        // ===== INDEX.HTML (RU) =====
        indexPageTitle: "Paiperwork - Локальный Javascript AI интерфейс",
        mainHeading: "Безопасный Javascript WebUi интерфейс для Ollama",
        requirementsHeading: "Требования:",
        requirementsText: "должен быть установлен и запущен локально на (стандартном) порту 11434, убедитесь, что вы обновились до последней версии.",
        ollamaLinkText: "Ollama",
        startButtonIndex: "Запуск",
        languageSelectorLabel: "Язык:",

        // ===== WELCOME.HTML =====
        welcomePageTitle: "Paiperwork - Добро пожаловать",
        masterkeyInputLabel: "Мастер-ключ",
        masterkeyInput: "Введите мастер-ключ...",
        startButton: "Запуск",
        helpButton: "Помощь",
        backButton: "← Назад",
        checkUpdatesButton: "Проверить обновления",
        deleteAllButton: "Удалить всю информацию",
        logoAltText: "Логотип Paiperwork",
        showMasterKey: "Показать мастер-ключ",
        hideMasterKey: "Скрыть мастер-ключ",
        securityPasswordUpdatedSuccess: "Пароль успешно обновлен",

        // ===== GENERATION.HTML =====
        // Generation page UI elements
        backButton: "Назад",
        newChatButton: "Новый Чат",
        sendButton: "Отправить",
        webButton: "Веб",
        enterMessage: "Введите ваше сообщение...",
        masterkeyLabel: "Мастер-ключ",
        activateThinking: "Активировать Размышление",
        deactivateThinking: "Деактивировать Размышление",
        // Tab buttons
        chatTab: "Чат",
        documentsTab: "Документы",
        datavizTab: "Визуализация Данных",
        paperworkTab: "Документооборот",
        researchTab: "Исследования",
        artworkTab: "Дизайн",
        modelsTab: "Модели",
        databaseTab: "База Данных",

        // Toggle switches
        toggleOn: "ВКЛ",
        toggleOff: "ВЫКЛ",

        // Chat tab elements
        insightsLabel: "Инсайты",
        contextSizeLabel: "Размер контекста:",
        contextRemainingLabel: "Остаток контекста: ",
        systemPromptLabel: "Системный промпт",
        saveButton: "Сохранить",
        clearCurrentSession: "Очистить Текущую Сессию",
        loadingCalculator: 'Загрузка калькулятора...',
        errorLoadingCalculator: 'Не удалось загрузить калькулятор. Пожалуйста, попробуйте снова.',
        checkingLoadedModels: 'Проверка загруженных моделей...',
        unloadingModels: 'Выгрузка моделей...',
        measuringAvailableMemory: 'Измерение доступной памяти...',
        restoringLoadedModels: 'Восстановление загруженных моделей...',
        loadingModel: "Загрузка модели...",
        checkingOllama: "Проверка Ollama...",
        loadingConversations: "Загрузка диалогов...",
        conversationsFound: "диалогов найдено",


        // Page title
        generationPageTitle: "Paiperwork - Генерация",

        // Loading messages
        loadingPreviousChats: "Загрузка предыдущих чатов...",
        loadingResearchTools: "Загрузка инструментов исследования...",
        loadingDesignTools: "Загрузка инструментов дизайна...",
        loadingDatabaseStats: "Загрузка статистики базы данных...",


        // ===== APP.JS =====
        // Tab Loading Messages
        loadingDocumentTools: "Загрузка инструментов документов...",
        loadingResearchTools: "Загрузка инструментов исследования...",
        loadingDesignTools: "Загрузка инструментов дизайна...",
        loadingDatabaseStats: "Загрузка статистики базы данных...",

        // Tab Error Messages
        failedLoadDocumentTools: "Ошибка загрузки инструментов документов",
        failedLoadResearchTools: "Ошибка загрузки инструментов исследования",
        failedLoadDatabaseManagement: "Ошибка загрузки Управления Базой Данных",
        failedLoadDataViz: "Ошибка Загрузки Визуализации Данных",
        failedLoadArtwork: "Ошибка Загрузки Визуальных Моделей",
        errorLoadingVisualModels: "Ошибка Загрузки Визуальных Моделей",

        // Generic Messages
        retryButton: "Повторить",
        errorOccurred: "Ошибка: {error}. Пожалуйста, попробуйте снова.",
        errorTryAgain: "Пожалуйста, попробуйте снова.",

        // Model Management
        selectModel: "Выберите модель...",
        modelDeleted: "Уведомление: Ранее выбранная модель \"{model}\" была удалена. Пожалуйста, выберите новую модель.",
        selectModelPrompt: "Пожалуйста, выберите модель перед отправкой сообщения.",
        noModelsFound: "Модели не найдены в Ollama. Переход к вкладке Модели для загрузки.",

        // Context and Memory Management
        contextChangeWarning: "Изменение контекста сбросит текущую краткосрочную память. Долгосрочная память в базе данных будет сохранена.",
        systemPromptChangeWarning: "Изменение системного промпта сбросит текущую краткосрочную память. Долгосрочная память в базе данных будет сохранена.",
        systemPromptChangeWarningWithContinue: "Изменение системного промпта сбросит контекст разговора. Будет добавлена кнопка 'Продолжить Разговор', чтобы вы могли продолжить с новым системным промптом. Продолжить?",
        contextSizeChangeWarningWithContinue: "Изменение размера контекста сбросит контекст разговора. Будет добавлена кнопка \"Продолжить Разговор\", чтобы вы могли продолжить с новым размером контекста. Продолжить?",
        systemPromptPlaceholder: 'Добавьте здесь инструкции для модели, как вы хотите, чтобы она себя вела...',

        // Conversation Management  
        deleteConversationConfirm: "Вы уверены, что хотите удалить данные, связанные с этим Мастер-ключом?",
        conversationDeleted: "Данные успешно удалены",
        deleteAllConversationsConfirm: "Вы уверены, что хотите удалить ВСЕ разговоры? Это нельзя отменить.",
        allConversationsDeleted: "Все разговоры были удалены",
        loadingPreviousMessages: "Загрузка предыдущих сообщений...",
        chooseModelStart: "Выберите модель и введите сообщение ниже для начала.",
        errorLoadingMessages: "Ошибка загрузки предыдущих сообщений.",

        // Ollama Connection
        ollamaLoadError: "Ошибка загрузки моделей из Ollama.",
        ollamaRetryPrompt: "Хотите повторить попытку?",
        ollamaContextSizeError: "Ошибка связи, попробуйте снова или перезапустите Ollama.",
        Ollamaerror500: "Ошибка 500 в ответе Ollama.",
        ollamaSelectModelPrompt: "Пожалуйста, выберите модель перед отправкой сообщения.",
        ollamaConnectionError: "Подключение к Ollama не удалось. Убедитесь, что Ollama запущена и попробуйте снова.",
        ollamaConversationStart: "Этот разговор продолжается с {count} предыдущих сообщений. Самые последние обмены показаны ниже.",

        // Copy Functionality
        copied: "Скопировано!",
        copyError: "Ошибка",
        copy: "Копировать",
        copyFullResponse: "Копировать полный ответ",

        // Document System
        documentSystemUnavailable: "Система документов недоступна.",
        refreshPage: "Пожалуйста, обновите страницу и попробуйте снова.",

        // Generation Control
        generationCancelled: "[Генерация отменена]",
        continueConversation: "Продолжить Разговор",
        ollamaContinueButton: "Продолжить Разговор",
        ollamaContinueProcessing: "Обработка...",
        ollamaContinuationError: "Не удалось продолжить разговор. Пожалуйста, попробуйте снова.",
        ollamaContinuingMessage: "Продолжение разговора...",

        // Context Limit
        contextLimitReachedTitle: "Лимит Контекста Разговора",
        contextLimitReachedMessage: "Ваш разговор достиг лимита контекста. Я добавил кнопку Продолжить Разговор ниже, чтобы вы могли продолжить общение без потери потока, а также сбросил ваш контекст обратно на 100%, просто нажмите на неё, чтобы продолжить с того места, где мы остановились.",
        ollamaContextRemaining: "Остаток контекста: {percent}%",
        ollamaContextReset: "Остаток контекста: 100%",

        // Message Management
        deleteMessagePair: "Удалить эту пару сообщений",
        deleteMessagePairConfirm: "Удалить эту пару сообщений? Это нельзя отменить.",
        regenerateMessage: "Регенерировать",
        regenerateMessageError: "Ошибка регенерации сообщения. Пожалуйста, попробуйте снова.",

        // Chat Initialization
        errorSendingMessage: "Ошибка отправки сообщения. Пожалуйста, попробуйте снова.",
        errorChatNotInitialized: "Система чата не инициализирована правильно. Пожалуйста, обновите страницу.",
        clickContinueFirst: "Нажмите \"Продолжить Разговор\" или введите новое сообщение.",

        // Export Functionality
        exportConversation: "Экспорт Разговора",
        exportDescription: "Выберите предпочитаемый формат экспорта:",
        exportError: "Ошибка Экспорта",
        exportSummary: "Сводка Экспорта",
        chooseExportFormat: "Выберите предпочитаемый формат экспорта:",
        errorExportingConversation: "Ошибка экспорта разговора: функциональность недоступна",
        exportFunctionNotAvailable: "Функциональность экспорта недоступна",
        exportSuccess: "Экспорт Успешен",
        conversationDownloaded: "Разговор загружен как",
        plainTextFormat: "Простой Текст (.txt)",
        plainTextDescription: "Простой, совместимый со всеми текстовыми редакторами",
        markdownFormat: "Markdown (.md)",
        markdownDescription: "Сохраняет форматирование, блоки кода и ссылки",
        htmlFormat: "HTML (.html)",
        htmlDescription: "Полное форматирование с правильным стилем",
        cancel: "Отмена",
        close: "Закрыть",
        save: "Сохранить",

        // ===== CHATTAB.JS =====
        // Context Management
        kvcacheLabel: "Мой KV кеш Q8_0 (использует меньше ОЗУ)",
        calculateOptimalButton: "Вычислить оптимальное",
        resetToDefaultButton: "Сбросить к умолчанию",
        calculatingContext: "Вычисляю...",
        gettingSystemInfo: "Получение информации о системе...",
        unloadingModel: "Выгружаю модель...",
        reloadingModel: "Перезагружаю модель...",
        resetting: "Сбрасываю...",
        clickToShowMasterKey: "Нажмите, чтобы показать/скрыть мастер-ключ",

        // Insights Management  
        editInsightsButton: "Редактировать инсайты",
        saving: "Сохраняю...",
        errorSaving: "Ошибка сохранения",

        // Session Management
        loadingConversations: "Загружаю беседы...",
        loadingConversationsProgress: "Загружаю {current}/{total} бесед...",
        noPreviousConversations: "Нет предыдущих бесед",
        errorLoadingConversations: "Ошибка загрузки бесед",
        noMessagesFound: "Сообщения для этой беседы не найдены",
        deleteSession: "Удалить эту беседу",
        newChat: "Новый чат",
        confirmDeleteGroup: "Вы уверены, что хотите удалить эту беседу?",
        deletingMessagePair: 'Удаление пары сообщений',
        preparingDeletion: 'Подготовка к удалению...',
        deletingFromDatabase: 'Удаление из базы данных...',
        removingFromInterface: 'Удаление из интерфейса...',
        refreshingConversationList: 'Обновление списка бесед...',
        deletionCompleted: 'Удаление успешно завершено!',
        deletionSuccessful: 'Удаление успешно',
        deletionFailed: 'Удаление не удалось',
        deletionError: 'Ошибка удаления',

        // Session Display
        sessionToday: "Сегодня в {time}",
        sessionYesterday: "Вчера в {time}",
        sessionDate: "{date} в {time}",

        // Welcome Messages
        welcomeNewConversation: "Добро пожаловать в новую беседу!",
        selectModelAndStart: "Выберите модель и начните печатать",

        // Image Upload (Visual Models)
        addImage: "Добавить изображение",
        dragMultipleImages: "Вы можете добавить несколько изображений",
        clickOrDragImage: "Нажмите для загрузки или перетащите изображения сюда",
        multipleImagesSupported: "Поддерживается несколько изображений",
        imagesSelected: "изображений выбрано",
        clearAllImages: "Очистить все",
        insertImage: "Вставить изображение",
        noImagesSelected: "Пожалуйста, выберите хотя бы одно изображение",
        imageDataInvalid: "Данные изображения недействительны. Пожалуйста, попробуйте загрузить снова.",
        onlyImagesAllowed: "Разрешены только файлы изображений",
        imageTooLarge: "Изображение слишком большое (макс. 5МБ)",
        clickOrDragMultipleImages: "Нажмите для загрузки или перетащите изображения сюда",
        clickOrDragSingleImage: "Нажмите для загрузки или перетащите изображение сюда",
        singleImageOnly: "Эта модель поддерживает только одно изображение за раз",
        gemma3MultiImageHint: "Gemma3: Вы можете добавить несколько изображений",

        // Document Questioning Mode
        documentQuestioningMode: "Режим вопросов по документу",
        exitDocumentMode: "Выйти из режима документа",
        ragDocumentModeLabel: "Режим документа",
        ragPromptDefault: "Введите ваше сообщение...",

        // Extras
        selectModelFirst: "Пожалуйста, сначала выберите модель",
        calculating: "Вычисляю...",
        gettingSystemInfo: "Получение информации о системе...",
        calculated: "(Вычислено)",
        unloadingModel: "Выгружаю модель...",
        reloadingModel: "Перезагружаю модель...",
        contextCalculationComplete: "Вычисление контекста завершено!\n\nДоступная оперативная память: {availableRAM} ГБ\nТип KV кеша: {kvCacheType}\nРекомендуемый макс. контекст: {maxContext}",
        errorCalculatingContext: "Ошибка вычисления контекста: {error}",
        calculateOptimal: "Вычислить оптимальное",
        gettingModelInfo: "Получение информации о модели...",
        resetToDefault: "Сбросить к умолчанию",
        confirmResetContext: "Сбросить размер контекста для \"{model}\" к умолчанию модели ({contextSize})?\n\nЭто:\n• Удалит специфичный для модели оптимизированный размер контекста\n• Установит контекст в {tokens} токенов (родной размер модели)\n• Сбросит селектор KV кеша к FP16 (это не ваша текущая настройка kvcache в Ollama, только селектор для вычисления)\n\nВы можете пересчитать или настроить вручную после.",
        resetting: "Сбрасываю...",
        noMasterKeyFound: "Мастер-ключ не найден",
        contextResetSuccess: "Размер контекста успешно сброшен!\n\nМодель: {model}\nРазмер контекста: {contextSize} токенов (родной размер модели)\nKV кеш: FP16 (по умолчанию)\n\nМодель теперь будет использовать свой родной размер контекста. Вы можете:\n• Нажать \"Вычислить оптимальное\" для получения размера, оптимизированного под ОЗУ\n• Вручную выбрать другой размер из выпадающего списка",
        errorResettingContext: "Ошибка сброса контекста: {error}",
        editUserInsights: "Редактировать пользовательские инсайты",
        noInsightsStored: "Инсайты пока не сохранены.",
        addNewInsight: "Добавить новый инсайт",
        enterNewInsight: "Введите новый инсайт...",
        saveChanges: "Сохранить изменения",
        saving: "Сохраняю...",
        errorSaving: "Ошибка сохранения",
        noMessagesFound: "Сообщения не найдены",
        regenerationError: "Ошибка регенерации сообщения. Пожалуйста, попробуйте снова.",

        // ===== CHAT.JS =====
        // System Prompt Management
        systemPromptSaved: "Системный промпт сохранён",
        errorSavingSystemPrompt: "Ошибка сохранения системного промпта",
        contextResetNote: "Контекст был сброшен из-за изменения системного промпта",

        // Button States
        cancelButton: "Отменить",
        sendButton: "Отправить",

        // Visual Model Errors
        visualModelError: "Ошибка визуальной модели",
        visualModelMissingComponents: "Этой модели, по-видимому, не хватает необходимых компонентов для обработки изображений.",
        visualModelTryDifferent: "Попробуйте использовать другую визуальную модель из селектора моделей",
        visualModelEnsureConverted: "Если используется пользовательская модель, убедитесь, что она правильно конвертирована с визуальными возможностями",
        visualModelNotSupported: "Эта модель не поддерживает корректную обработку изображений.",
        visualModelSelectDifferent: "Попробуйте выбрать другую визуальную модель",
        visualModelImproperlyQuantized: "Модель может быть неправильно квантизирована",
        visualModelProperlyBuilt: "Проверьте, что используете правильно построенную версию визуальной модели",

        // DataViz Error Messages 
        datavizSelectChartPrompt: "Пожалуйста, выберите тип визуализации (Круговая диаграмма, Столбчатая диаграмма или Линейная диаграмма) перед продолжением.",
        datavizOkSelect: "Хорошо, я выберу один",
        datavizError: "Ошибка создания визуализации",
        datavizNoData: "Нет описания данных",
        datavizOk: "ОК",

        // Web Search Enhancement
        webSearchTitle: "Улучшение веб-поиска",
        searchQueryTitle: "Поисковый запрос",
        webSearchPerformed: "Веб-поиск выполнен",
        searchQuery: "Поисковый запрос",
        searchQueryOptimizerPrompt: "Сгенерируйте краткий поисковый запрос для веб-поиска на основе предоставленного контекста",

        // Generation Control
        cancelled: "отменено",
        generationCancelled: "[Генерация отменена]",
        continuationFromPrevious: "Продолжение предыдущего разговора...",

        // RAG Integration
        ragNoRelevantContent: "Я не смог найти релевантную информацию в выбранном документе для вашего вопроса. Пожалуйста, попробуйте переформулировать вопрос или выберите другой документ.",

        // Message Management
        deleteMessagePairError: "Ошибка удаления пары сообщений. Пожалуйста, попробуйте снова.",

        // Web Search Enhancement
        webSearchInfo: "🌐 Улучшение веб-поиска",
        webSearchTransition: "🔍 Расширение информацией веб-поиска...",
        webSearchError: "Ошибка использования веб-поиска: {error}. Пожалуйста, попробуйте снова.",
        documentInfo: "📄 Информация о документе",

        // Extras
        visualModelError: "Ошибка визуальной модели:",
        visualModelErrorDetails: "Эта модель не поддерживает корректную обработку изображений.",
        tryDifferentVisualModel: "Попробуйте выбрать другую визуальную модель",
        modelImproperlyQuantized: "Модель может быть неправильно квантизирована",
        checkProperVisualModel: "Проверьте, что используете правильно построенную версию визуальной модели",
        generationCancelledBeforeStart: "Генерация отменена до начала. Пожалуйста, попробуйте снова.",

        // ===== DATABASETAB.JS ===== 

        // Main UI Elements
        databaseManagementTitle: "Управление базой данных",
        databaseManagementDesc: "Отслеживайте и управляйте своей локальной базой данных для обеспечения оптимальной производительности.",
        loadingDatabaseStats: "Загрузка статистики базы данных...",

        // Action Buttons
        refreshStats: "Обновить статистику",
        cleanupOrphaned: "Очистить потерянные данные",
        optimizeDatabase: "Очистить базу данных",

        // Information Section
        aboutDatabaseTitle: "О вашей базе данных",
        aboutDatabaseDesc: "Paiperwork хранит все ваши данные локально в защищенной базе данных SQLite в вашем браузере. Ваши данные никогда не покидают ваше устройство, если вы явно их не экспортируете.",
        storageMethod: "Метод хранения",
        encryptionStatus: "Шифрование",
        enabled: "Включено",

        // Statistics Display
        databaseStats: "Статистика базы данных",
        databaseSize: "Размер базы данных",
        documents: "Документы",
        totalChunks: "Всего фрагментов",
        orphanedChunks: "Потерянные фрагменты",
        databaseHealth: "Состояние базы данных",

        // Health Messages
        orphanedChunksFound: "Найдено {count} потерянных фрагментов, которые не связаны ни с одним документом. Это могут быть остатки от удаленных документов, занимающие ненужное место.",

        // Success Messages
        orphanedChunksRemoved: "Успешно удалено {count} потерянных фрагментов.",
        databaseSizeReduced: "Размер базы данных уменьшен на {size}.",
        databaseOptimized: "База данных успешно оптимизирована. Сэкономлено {size}.",

        // Error Messages
        databaseOptimizeFailed: "Оптимизация базы данных не удалась.",
        cleanupFailed: "Очистка не удалась",
        tryAgain: "Попробовать снова",
        databaseError: "Произошла ошибка при оптимизации базы данных.",
        databaseNotAvailable: "База данных недоступна",

        // ===== DOCUMENTS_TAB.JS =====

        // Document Search Info Banner
        documentSearchEnabled: "Поиск по документам включен",
        documentSearchInfo: "В этой вкладке основная строка будет искать по всем вашим документам и предоставлять информацию.",
        documentSpecificInfo: "Если вы выберете конкретный документ для вопросов, он будет иметь приоритет.",

        // File Processing & Validation
        ragPreprocessingFiles: "Проверка файлов на наличие текстового содержимого...",
        ragCheckingFile: "Проверка {filename} на наличие текстового содержимого...",
        ragEmptyPdfSingle: "Файл \"{filename}\" не содержит извлекаемого текста (возможно, только изображения). Он не может быть обработан.",
        ragEmptyPdfMultiple: "{count} файлов не содержат извлекаемого текста (возможно, только изображения) и не могут быть обработаны.",
        ragPdfCheckError: "Ошибка при проверке содержимого PDF",

        // Processing States
        ragProcessingStatus: "Обработка...",
        ragProcessingPaused: "Обработка документов приостановлена до завершения текущего разговора с ИИ",

        // Search Functionality
        searchingDocuments: "Поиск по всем вашим документам...",
        noDocumentResults: "Релевантная информация в ваших документах не найдена.",
        aiAnalysis: "Анализ ИИ",
        documentSearchError: "Ошибка поиска документов:",

        // Document Global Search
        documentGlobalSearch: "Глобальный поиск документов",
        documentGlobalSearchDescription: "Поиск по всем вашим документам одновременно",
        documentSpecificMode: "Режим конкретного документа",
        documentSpecificDescription: "Задавать вопросы о конкретном документе",
        documentSearchProcessing: "Обработка вашего поиска документов...",
        documentNoDocumentsFound: "У вас еще нет загруженных документов. Сначала загрузите документы, чтобы использовать эту функцию.",

        // Document Mode UI
        ragDocumentModePriority: "Это будет иметь приоритет даже в вкладке Документы.",
        ragReturnToChat: "Возврат к обычному режиму чата",
        ragEnableError: "Ошибка при включении режима опроса документов",
        ragDocumentModeAsking: "Вопрос: \"{document}\"",

        // Summary Management
        resetSummary: "Сбросить сводку",
        restorePartialSummaries: "Восстановить частичные сводки",
        partialSummariesNotice: "Расширенная сводка.",
        editableContent: "Эта сводка полностью редактируема. Внесите необходимые изменения перед экспортом или сохранением.",

        // Document Metadata Display
        ragDocumentSectionAuthor: "Автор: {author}",
        ragDocumentSectionAdded: "Добавлено: {date}",
        ragDocumentSectionPages: "Страниц: {count}",
        ragDocumentSectionChunks: "Блоков: {count}",
        ragDocumentSectionDelete: "Удалить",
        ragDocumentSectionProcessing: "Обработка",
        ragDocumentSectionIndexed: "Индексировано",
        ragDocumentSectionUntitled: "Без названия",

        // Error Handling
        ragDisplayError: "Ошибка отображения документов: {error}",
        ragLoadingError: "Ошибка загрузки документов: {error}",
        ragDeleteFailed: "Не удалось удалить документ. Попробуйте еще раз.",

        // Search Results
        ragQuickSearch: "Быстрый поиск",
        ragQuickSearchPlaceholder: "Найти документы, содержащие...",
        ragAskAboutThis: "Спросить об этом",
        ragTopResults: "Лучшие результаты для \"{query}\"",
        ragNoResults: "Подходящие документы не найдены",
        ragSearchPlaceholder: "Быстрый поиск...",
        ragSearchButton: "Найти",
        ragSearchClearButton: "Очистить поиск",
        ragSearching: "Поиск документов...",
        ragSearchError: "Ошибка поиска: {error}",
        ragSearchNoResults: "Документов, соответствующих \"{query}\", не найдено",
        ragSearchResults: "Найдено {count} результатов для \"{query}\"",

        // RAG Utils messages
        ragModelSelect: "Пожалуйста, выберите модель перед загрузкой документов.",
        ragFileType: "Пожалуйста, загружайте только PDF или TXT файлы.",
        ragProcessing: "Обработка...",
        ragDocumentsProcessed: "Документы успешно обработаны!",
        ragProcessingError: "Ошибка обработки документов. Попробуйте еще раз.",
        ragLoadingDocuments: "Загрузка списка документов...",
        ragErrorStorage: "Ошибка доступа к хранилищу документов",
        ragNoDocuments: "Документы не найдены",
        ragUploadPrompt: "Загрузите документы, используя область выше",
        ragLoadingError: "Ошибка загрузки документов: {error}",
        ragDisplayError: "Ошибка отображения документов: {error}",
        ragDeleteConfirm: "Вы уверены, что хотите удалить этот документ? Это действие нельзя отменить.",
        ragDeleting: "Удаление...",
        ragDeleteSuccess: "Документ успешно удален",
        ragDeleteError: "Не удалось удалить документ. Попробуйте еще раз.",
        ragSearchingDocuments: "Поиск документов...",
        ragDragDropText: "Перетащите PDF или текстовые файлы",
        ragBrowseText: "или выберите файлы",
        ragDocumentSelected: "📄 Документ выбран",
        ragDeselectButton: "Отменить выбор",
        ragGenerateSummary: "Создать сводку",
        ragAskQuestions: "Задать вопросы",
        ragDocumentModeEnabled: "Режим документа включен",
        ragSearchClearButton: "Очистить поиск",
        ragSearching: "Поиск документов...",
        ragCopyResult: "Копировать",
        ragCopied: "Скопировано!",
        ragCopyError: "Ошибка",
        ragClearSearch: "Очистить поиск",

        // Document Summary translations
        ragSummaryGenerating: "Сводка уже создается. Пожалуйста, дождитесь завершения.",
        ragSummaryTitle: "Сводка \"{title}\"",
        ragSummaryPreparing: "Подготовка документа для создания сводки...",
        ragSummaryCancelConfirm: "Вы уверены, что хотите отменить создание сводки?",
        ragSummaryContinuing: "Создание сводки продолжается.",
        ragSummaryNoContent: "Содержимое документа для создания сводки не найдено.",
        ragSummarySections: "Найдено {count} разделов документа",
        ragSummaryProcessing: "Обработка документа ({size}КБ)",
        ragSummaryGenerating: "Создание сводки документа...",
        ragSummaryProcessingParts: "Последовательная обработка документа в {total} частях...",
        ragSummaryPart: "Создание сводки части {current} из {total}...",
        ragSummaryFinalizing: "Завершение создания сводки...",
        ragSummaryComplete: "Сводка завершена",
        ragSummaryTokens: "Сводка завершена. Использует примерно {tokens} токенов ({percent}% контекста).",
        ragSummaryCancelledByUser: "Создание сводки было отменено пользователем.",
        ragSummaryError: "Ошибка при создании сводки: {error}",
        ragSummaryCopy: "Копировать сводку",
        ragSummaryCopied: "Скопировано!",
        ragSummaryCancel: "Отменить создание",

        // Document Mode translations
        ragDocumentModeError: "Ошибка при включении режима опроса документов",
        ragDocumentModeExit: "Выйти из режима документа",
        ragDocumentModeAsking: "Вопрос: \"{document}\"",

        // Document Sections translations
        ragDocumentSectionAuthor: "Автор: {author}",
        ragDocumentSectionAdded: "Добавлено: {date}",
        ragDocumentSectionPages: "Страниц: {count}",
        ragDocumentSectionChunks: "Блоков: {count}",
        ragDocumentSectionDelete: "Удалить",
        ragDocumentSectionProcessing: "Обработка",
        ragDocumentSectionIndexed: "Индексировано",
        ragDocumentSectionUntitled: "Без названия",

        // Document UI translations
        ragDragDropText: "Перетащите PDF или текстовые файлы",
        ragBrowseFiles: "или выберите файлы",
        ragProcessingStatus: "Обработка...",
        ragSearchPlaceholder: "Быстрый поиск...",
        ragSearchButton: "Найти",
        ragDeleteFailed: "Не удалось удалить документ. Попробуйте еще раз.",
        ragDeleteError: "Ошибка удаления документа: {error}",
        ragDocumentSectionDelete: "Удалить",
        ragDisplayError: "Ошибка отображения документов: {error}",
        ragLoadingError: "Ошибка загрузки документов: {error}",
        ragDocumentSelected: "📄 Документ выбран",
        ragDocumentDeselect: "Отменить выбор",
        ragDocumentGenerateSummary: "Создать сводку",
        ragDocumentAskQuestions: "Задать вопросы",
        ragDocumentModePlaceholder: "Спросить о \"{document}\"...",
        ragDocumentAskQuestions: "Задать вопросы",
        ragSummaryCancelled: "Создание отменено",
        ragSummaryPartialWarning: "Создание сводки было отменено. Частичная сводка выше может быть неполной.",
        ragSummaryCancelledByUser: "Создание сводки было отменено пользователем.",
        ragSummaryCancelConfirm: "Отменить создание сводки?",
        ragSummaryContinuing: "Создание сводки продолжается.",
        ragSummaryNoContent: "Содержимое документа для создания сводки не найдено.",
        ragSummaryProcessing: "Обработка...",
        ragSummaryGenerating: "Создание сводки документа...",
        ragSummaryBatches: "Последовательная обработка документа в {total} частях...",
        ragSummaryPart: "Создание сводки части {current} из {total}...",
        ragSummaryFinalizing: "Завершение создания сводки...",
        ragSummaryCreatingFinal: "Создание итоговой сводки...",
        ragSectionBreak: "--- Разделитель секций ---",
        ragSummaryFinalTitle: "Полная сводка \"{title}\"",
        ragSummaryTokenCount: "Сводка завершена. Использует примерно {tokens} токенов ({percent}% контекста).",
        ragSummaryError: "Ошибка при создании сводки: {error}",

        //TOC
        tocTitle: "Содержание",

        // ===== DATAVIZTAB.JS ===== (Элементы пользовательского интерфейса для вкладки)
        // Основные элементы интерфейса
        datavizTitle: "Визуализация Данных",
        datavizDescription: "Выберите тип диаграммы или графика для визуализации ваших данных",

        // Названия типов диаграмм
        datavizPieChart: "Круговая Диаграмма",
        datavizBarChart: "Столбчатая Диаграмма",
        datavizLineChart: "Линейная Диаграмма",
        datavizScatterPlot: "Точечная Диаграмма",
        datavizAreaChart: "Диаграмма с Областями",
        datavizRadarChart: "Радарная Диаграмма",
        datavizHeatMap: "Тепловая Карта",
        datavizBubbleChart: "Пузырьковая Диаграмма",

        // Сообщения об ошибках
        datavizNotInitialized: "Ошибка: Функция визуализации не инициализирована должным образом",
        datavizNoChartType: "Тип Диаграммы Не Выбран",

        // Сообщения о статусе
        datavizModeActive: "Режим DataViz активен",
        datavizModeDeactivated: "Режим DataViz деактивирован",
        datavizSelectionDeselected: "Визуализация отменена",
        datavizConfigurationOptions: "Параметры конфигурации для {chartType} будут добавлены здесь.",

        // Заполнители подсказок
        datavizPromptPlaceholder: "Спросите о создании {chartType}...",
        datavizDefaultPrompt: "Введите ваше сообщение здесь...",
        datavizEnterData: "Пожалуйста, введите описание данных, которые вы хотите визуализировать.",

        // ===== DATAVIZ.JS ===== 
        // Состояния генерации
        datavizGenerating: "Генерация {chartType}...",
        datavizCancel: "Отменить",
        datavizGenerationCancelled: "Генерация Отменена",
        datavizCancelledMessage: "Генерация диаграммы была отменена.",
        datavizCancelledByUser: "Генерация диаграммы была отменена пользователем.",

        // Сообщения об ошибках
        datavizErrorCreating: "Ошибка Создания Визуализации",
        datavizErrorMessage: "Это может произойти, когда ответ ИИ неправильно отформатирован.",
        datavizErrorSuggestion: "Пожалуйста, попробуйте переформулировать запрос или выбрать другой тип диаграммы.",

        // Ошибки, специфичные для диаграмм
        datavizErrorBarChart: "Ошибка Создания Столбчатой Диаграммы",
        datavizErrorLineChart: "Ошибка Создания Линейной Диаграммы",
        datavizErrorScatterPlot: "Ошибка Создания Точечной Диаграммы",
        datavizErrorAreaChart: "Ошибка Создания Диаграммы с Областями",
        datavizErrorRadarChart: "Ошибка Создания Радарной Диаграммы",
        datavizErrorHeatMap: "Ошибка Создания Тепловой Карты",
        datavizErrorBubbleChart: "Ошибка Создания Пузырьковой Диаграммы",

        // Ошибки валидации данных
        datavizErrorInvalidData: "Недопустимая структура данных: {errorType}",
        datavizErrorMissingData: "массив данных или серий отсутствует.",
        datavizErrorEmptyData: "массив серий отсутствует или пуст.",
        datavizErrorMinimumCategories: "Радарные диаграммы требуют как минимум 3 категории и 1 серию данных.",
        datavizErrorDimensionMismatch: "Размерности массива данных должны соответствовать массивам xLabels и yLabels.",

        // Элементы интерфейса и метки диаграмм
        datavizValueScale: "Шкала Значений",
        datavizPercentageAreaChart: "Процентная Диаграмма с Областями",
        datavizStackedAreaChart: "Накопительная Диаграмма с Областями",
        datavizRefreshTooltip: "Обновить Предпросмотр",
        datavizMaximize: "Развернуть",
        datavizRestore: "Восстановить",
        datavizClose: "Закрыть",

        // Взаимодействие с диаграммой
        datavizHoverTooltip: "Наведите для подробностей",
        datavizClickForDetails: "Нажмите для подробностей",

        // Дополнительные элементы
        datavizFloatingWindowTitle: "Визуализация Данных",
        datavizMaximizeTooltip: "Развернуть",
        datavizRestoreTooltip: "Восстановить",
        datavizCloseTooltip: "Закрыть",
        datavizLoadingMessage: "Загрузка...",
        datavizChartGeneration: "Генерация диаграммы",
        datavizWasCancelled: "была отменена",
        datavizChartGenerationCancelled: "Генерация Диаграммы Отменена",
        datavizGeneratingChart: "Генерация Диаграммы",
        datavizAnalyzingData: "Анализ ваших данных и создание визуализации...",
        datavizExportPNG: "Экспорт PNG",
        datavizChartView: "Просмотр Диаграммы",
        datavizExportChartImage: "Экспорт Диаграммы как Изображения",
        datavizExportRestriction: "Из-за ограничений безопасности браузера мы не можем автоматически скачать эту диаграмму как изображение.",
        datavizExportMethods: "Пожалуйста, используйте один из этих методов вместо этого:",
        datavizExportScreenshot: "Сделайте скриншот диаграммы (рекомендуется)",
        datavizExportMac: "Mac: Command + Shift + 4, затем выберите область",
        datavizExportWindows: "Windows: Windows + Shift + S, затем выберите область",
        datavizExportRightClick: "Щелкните правой кнопкой по диаграмме и выберите \"Сохранить изображение как...\" (браузеры, которые это поддерживают)",
        datavizExportUnderstand: "Я понимаю",
        datavizGeneratingImage: "Генерация изображения...",
        datavizChart: "Диаграмма",
        datavizErrorRequiredRadar: "Радарные диаграммы требуют как минимум 3 категории и 1 серию данных.",
        datavizErrorRequiredHeatMap: "Тепловые карты требуют массивы xLabels, yLabels и data.",
        datavizErrorRequiredBubble: "массив серий отсутствует или пуст.",
        datavizXValues: "Значения X",
        datavizYValues: "Значения Y",
        datavizSeries: "Серии",
        datavizDataSeries: "Серии Данных",
        datavizDataPoints: "Точки Данных",
        datavizCombinedData: "Объединенные Данные",
        datavizValue: "Значение",

        // ===== PAPERWORKTAB.JS ===== 
        // Main tab content
        paperworkTabTitle: "Создание Документов",
        paperworkTabDescription: "Создавайте профессиональные отчеты и документы на основе данных ваших разговоров.",

        // Template grid items
        paperworkTemplateMeetingMinutes: "Протокол Собрания",
        paperworkTemplateMeetingMinutesDesc: "Создать структурированный, профессиональный протокол собрания",
        paperworkTemplateBusinessLetter: "Деловое Письмо",
        paperworkTemplateBusinessLetterDesc: "Создать профессиональное деловое письмо",
        paperworkTemplateTechnicalReport: "Технический Отчет",
        paperworkTemplateTechnicalReportDesc: "Создать подробный технический отчет с разделами и изображениями",
        paperworkTemplateContract: "Договор",
        paperworkTemplateContractDesc: "Создать юридический договорный документ",
        paperworkTemplateProposal: "Предложение",
        paperworkTemplateProposalDesc: "Создать убедительное предложение",
        paperworkTemplateMemo: "Служебная Записка",
        paperworkTemplateMemoDesc: "Создать профессиональную служебную записку компании",

        // Error messages
        paperworkManagerNotInitialized: "PaperworkTab: paperworkManager не инициализирован",
        paperworkUIHelpersNotAvailable: "PaperworkTab: uiHelpers недоступны через paperworkManager",
        paperworkElementNotFound: "PaperworkTab: Невозможно найти элемент вкладки paperwork",

        // Console messages
        paperworkInitializing: "PaperworkTab: Инициализация интерфейса вкладки paperwork",
        paperworkTemplateSelected: "PaperworkTab: Выбран тип шаблона: {templateType}",

        // Dashboard section (from CSS comments)
        paperworkDashboardTitle: "Панель Управления Документами",
        paperworkToolGroupTitle: "Группа Инструментов",

        // Document template types (for UI display)
        paperworkBusinessLetter: "Деловое Письмо",
        paperworkContract: "Договор",
        paperworkProposal: "Предложение",
        paperworkMemo: "Служебная Записка",
        paperworkMeetingMinutes: "Протокол Собрания",
        paperworkTechnicalReport: "Технический Отчет",

        // Form field labels (these would appear in document generation forms)
        paperworkRecipientName: "Имя Получателя",
        paperworkRecipientAddress: "Адрес Получателя",
        paperworkSenderName: "Имя Отправителя",
        paperworkSenderAddress: "Адрес Отправителя",
        paperworkDate: "Дата",
        paperworkSubject: "Тема",
        paperworkMessage: "Сообщение",
        paperworkSignature: "Подпись",

        // Contract fields
        paperworkPartyOne: "Сторона Первая",
        paperworkPartyTwo: "Сторона Вторая",
        paperworkContractTerms: "Условия Договора",
        paperworkEffectiveDate: "Дата Вступления в Силу",
        paperworkExpirationDate: "Дата Истечения",

        // Proposal fields
        paperworkProjectTitle: "Название Проекта",
        paperworkClientName: "Имя Клиента",
        paperworkProposalSummary: "Краткое Изложение Предложения",
        paperworkDeliverables: "Результаты Поставки",
        paperworkTimeline: "График",
        paperworkBudget: "Бюджет",

        // Memo fields
        paperworkMemoTo: "Кому",
        paperworkMemoFrom: "От",
        paperworkMemoDate: "Дата",
        paperworkMemoRe: "Касательно",
        paperworkMemoBody: "Текст Записки",

        // Meeting minutes fields
        paperworkMeetingDate: "Дата Собрания",
        paperworkMeetingTime: "Время Собрания",
        paperworkAttendees: "Участники",
        paperworkAgenda: "Повестка Дня",
        paperworkDiscussion: "Пункты Обсуждения",
        paperworkActionItems: "Пункты Действий",
        paperworkNextSteps: "Следующие Шаги",

        // Button labels
        paperworkGenerate: "Создать Документ",
        paperworkPreview: "Предварительный Просмотр",
        paperworkDownload: "Скачать",
        paperworkEdit: "Редактировать",
        paperworkSave: "Сохранить",
        paperworkCancel: "Отменить",
        paperworkClose: "Закрыть",

        // Status messages
        paperworkGenerating: "Создание документа...",
        paperworkGenerationComplete: "Документ успешно создан",
        paperworkGenerationError: "Ошибка при создании документа",
        paperworkSaved: "Документ сохранен",
        paperworkSaveError: "Ошибка при сохранении документа",

        // Template designer
        paperworkTemplateDesigner: "Конструктор Шаблонов",
        paperworkAddSection: "Добавить Раздел",
        paperworkDeleteSection: "Удалить Раздел",
        paperworkMoveUp: "Переместить Вверх",
        paperworkMoveDown: "Переместить Вниз",
        paperworkSectionTitle: "Заголовок Раздела",
        paperworkSectionContent: "Содержание Раздела",

        // Document preview
        paperworkDocumentPreview: "Предварительный Просмотр Документа",
        paperworkPrintView: "Вид для Печати",
        paperworkFullscreen: "Полноэкранный Режим",
        paperworkExitFullscreen: "Выйти из Полноэкранного Режима",

        // ===== PAPERWORK.JS - Paperwork Class =====
        // Console/Debug Messages
        paperworkInitializing: "Paperwork: Инициализация менеджера документов",
        paperworkShowingTemplates: "Paperwork: Отображение шаблонов документов",
        paperworkTabNotAvailable: "Paperwork: Экземпляр PaperworkTab недоступен",

        // UI Component Labels
        paperworkFloatingWindowHeader: "Заголовок Всплывающего Окна",
        paperworkFloatingWindowTitle: "Заголовок Окна",
        paperworkFloatingWindowClose: "Закрыть Окно",
        paperworkFloatingWindow: "Всплывающее Окно",
        paperworkFloatingWindowFooter: "Нижний Колонтитул Окна",
        paperworkFloatingWindowContent: "Содержимое Окна",
        paperworkBackdrop: "Фон",

        // Form Elements
        paperworkFormGroup: "Группа Формы",
        paperworkLabel: "Метка",
        paperworkInput: "Поле Ввода",
        paperworkTextarea: "Текстовая Область",
        paperworkSelect: "Поле Выбора",

        // Buttons
        paperworkBtn: "Кнопка",
        paperworkBtnPrimary: "Основная Кнопка",
        paperworkBtnSecondary: "Вторичная Кнопка",

        // Document Preview and Editor (keep existing)
        paperworkDocumentPreview: "Предварительный Просмотр Документа",
        paperworkDocumentEditor: "Редактор Документов",
        paperworkForm: "Форма",

        // Template Grid (keep existing)
        paperworkTemplateGrid: "Сетка Шаблонов",
        paperworkTemplateItem: "Элемент Шаблона",
        paperworkTemplateIcon: "Иконка Шаблона",
        paperworkTemplateTitle: "Заголовок Шаблона",

        // ===== PAPERWORK.JS - UIHelpers Class =====
        // Document Editor Titles
        paperworkBusinessLetterTitle: "Деловое письмо",
        paperworkContractTitle: "Контракт",
        paperworkProposalTitle: "Деловое предложение",
        paperworkMemoTitle: "Служебная записка",
        paperworkMeetingMinutesTitle: "Протокол собрания",
        paperworkDocumentEditorTitle: "Редактор документов",

        // Button Labels
        paperworkNewButton: "Создать",
        paperworkGenerateDocumentButton: "Создать документ",
        paperworkCancelButton: "Отмена",

        // AI Service Messages
        paperworkAIModelNotSelected: "Пожалуйста, выберите модель ИИ во вкладке Чат перед использованием функций улучшения документов.",
        paperworkAIServiceFailed: "Не удалось подключиться к службе ИИ. Пожалуйста, убедитесь, что Ollama запущена и попробуйте снова.",
        paperworkAINoReply: "ИИ не смог ответить",

        // Template Designer
        paperworkCreateTechnicalReportTitle: "Создать технический отчет",
        paperworkReportNameLabel: "Название отчета",
        paperworkReportNamePlaceholder: "Отчет о состоянии разработки, Отчет об ошибках и т.д.",
        paperworkA4DocumentLabel: "Документ A4 {percent}% {scaleNote}",
        paperworkScaledToFit: "(масштабирован по размеру)",
        paperworkActualSize: "(фактический размер)",
        paperworkCanvasPlaceholder: "Нажмите на шаблон дизайна, чтобы добавить его в ваш шаблон",
        paperworkDesignPresetsTitle: "Шаблоны дизайна",

        // Preset Types
        paperworkDocumentHeaderPreset: "Заголовок документа",
        paperworkSectionHeaderPreset: "Заголовок раздела",
        paperworkTextAreaPreset: "Текстовая область",
        paperworkTextImageRightPreset: "Текст + Изображение (Справа)",
        paperworkImageTextRightPreset: "Изображение + Текст (Справа)",
        paperworkPictureGalleryPreset: "Галерея изображений",
        paperworkPictureRowPreset: "Ряд изображений",
        paperworkDividerPreset: "Разделитель",
        paperworkEmptySpacePreset: "Пустое место",

        // Template Designer Buttons
        paperworkFontSelectorButton: "Выбор шрифта",
        paperworkSaveTemplateButton: "Сохранить шаблон",
        paperworkLoadTemplateButton: "Загрузить шаблон",
        paperworkManageTemplatesButton: "Управление шаблонами",
        paperworkSavePDFButton: "Сохранить PDF",

        // Floating Window Controls
        paperworkMaximizeTooltip: "Развернуть",
        paperworkRestoreTooltip: "Восстановить",
        paperworkCloseTooltip: "Закрыть",

        // Loading States
        paperworkLoadingMessage: "Загрузка...",
        paperworkProcessingMessage: "Обработка...",

        // Edit Controls
        paperworkClickToEdit: "Нажмите для редактирования",
        paperworkAIEnhanceButton: "Улучшение ИИ",
        paperworkUndoEditButton: "Отменить",

        // Page Controls
        paperworkExpandToPageButton: "Расширить до страницы",
        paperworkPageBreakIndicator: "Разрыв страницы",
        paperworkPageNumber: "Страница {number}",

        // Error Messages
        paperworkTemplateDesignNotInitialized: "Дизайн шаблона не инициализирован",
        paperworkErrorOccurred: "Произошла ошибка при загрузке редактора документов. Пожалуйста, попробуйте снова.",

        // Field labels for edit dialog
        paperworkLabel: "Метка",
        paperworkPlaceholder: "Заполнитель",
        paperworkRows: "Строки",

        // Image count options
        paperworkTwoImages: "2 изображения",
        paperworkFourImages: "4 изображения",
        paperworkSixImages: "6 изображений",
        paperworkNumberOfImages: "Количество изображений",

        // Text placeholder field
        paperworkTextPlaceholder: "Заполнитель текста",

        // Empty space behavior options (if not already added)
        paperworkFixedHeight: "Фиксированная высота",
        paperworkExpandToEndOfPage: "Расширить до конца страницы",

        // Height label 
        paperworkHeightPixels: "Высота (пиксели)",
        paperworkBehavior: "Поведение",

        //Extras
        paperworkDividerPreset: "Разделитель",
        paperworkEmptySpacePreset: "Пустое место",
        paperworkSectionAddedToDocument: "{sectionType} добавлен в документ",
        paperworkEnhanceWithAI: "Улучшить с помощью ИИ",
        paperworkUndoChanges: "Отменить изменения",
        paperworkClickOrDragImage: "Нажмите или перетащите изображение",
        paperworkEnhanceCaption: "Улучшить подпись",
        paperworkPageBreakSpace: "Место разрыва страницы",
        paperworkEmptySpace: "Пустое место",
        paperworkDragToResize: "Перетащите для изменения размера",
        paperworkLikelyCausesPageBreak: "Вероятно, вызовет разрыв страницы в PDF",
        paperworkAdjustHeight: "Настроить высоту",
        paperworkInsertPageBreak: "Вставить разрыв страницы",
        paperworkDeleteSectionConfirm: "Вы уверены, что хотите удалить этот раздел?",
        paperworkEditSectionTitle: "Редактировать {sectionType}",
        paperworkHeightPixels: "Высота (пиксели)",
        paperworkBehavior: "Поведение",
        paperworkFixedHeight: "Фиксированная высота",
        paperworkExpandToEndOfPage: "Расширить до конца страницы",
        paperworkTitle: "Заголовок",
        paperworkSubtitle: "Подзаголовок",
        paperworkRequired: "Обязательно",
        paperworkRows: "Строки",
        paperworkNumberOfImages: "Количество изображений",
        paperworkTextPlaceholder: "Заполнитель текста",
        paperworkCancel: "Отмена",
        paperworkSave: "Сохранить",
        paperworkPleaseEnterReportName: "Пожалуйста, введите название отчета.",
        paperworkPleaseAddAtLeastOneSection: "Пожалуйста, добавьте хотя бы один раздел в ваш отчет.",
        paperworkPrint: "Печать",
        paperworkNewReport: "Новый отчет",
        paperworkClose: "Закрыть",
        paperworkNoTextToEnhance: "Нет текстового содержимого для улучшения.",
        paperworkAIResponseProcessError: "Ответ ИИ не удалось корректно обработать. Пожалуйста, попробуйте снова.",
        paperworkSelectAIModelFirst: "Пожалуйста, сначала выберите модель ИИ во вкладке Чат перед использованием функции улучшения ИИ.",
        paperworkAIServiceUnableToEnhance: "Служба ИИ не смогла улучшить текст. Пожалуйста, попробуйте снова.",
        paperworkErrorEnhancingWithAI: "Произошла ошибка при улучшении текста с помощью ИИ. Пожалуйста, попробуйте снова.",
        paperworkEnterReportNameToSave: "Пожалуйста, введите название отчета для сохранения как шаблон.",
        paperworkErrorParsingTemplateSections: "Ошибка при анализе разделов шаблона.",
        paperworkAddAtLeastOneSectionToTemplate: "Пожалуйста, добавьте хотя бы один раздел в ваш шаблон.",
        paperworkTemplateExistsReplace: "Шаблон с именем \"{templateName}\" уже существует. Хотите ли вы заменить его?",
        paperworkTemplateSavedSuccessfully: "Шаблон \"{templateName}\" успешно сохранен",
        paperworkErrorSavingTemplate: "Произошла ошибка при сохранении шаблона. Пожалуйста, попробуйте снова.",
        paperworkNoSavedTemplatesFound: "Сохраненные шаблоны не найдены.",
        paperworkLoadTemplate: "Загрузить шаблон",
        paperworkSelectTemplateToLoad: "Выберите шаблон для загрузки:",
        paperworkCreated: "Создан",
        paperworkSectionsCount: "{count} разделов",
        paperworkDelete: "Удалить",
        paperworkDeleteTemplateConfirm: "Вы уверены, что хотите удалить шаблон \"{templateName}\"?",
        paperworkTemplateLoadedSuccessfully: "Шаблон \"{templateName}\" успешно загружен",
        paperworkTemplateNameChangeTip: "Совет: Чтобы создать новый шаблон на основе этого, измените имя перед сохранением.",
        paperworkManageTemplates: "Управление шаблонами",
        paperworkTemplateManagementDescription: "Ваши сохраненные шаблоны перечислены ниже. Вы можете загружать или удалять их.",
        paperworkNoTemplatesFound: "Шаблоны не найдены",
        paperworkLoad: "Загрузить",
        paperworkTemplateDeleted: "Шаблон \"{templateName}\" удален",
        paperworkPDFFont: "Шрифт PDF",
        paperworkFontSetForPDF: "Шрифт установлен на {font} для экспорта PDF",
        paperworkPreview: "Предварительный просмотр",
        paperworkAddSectionBeforePreview: "Пожалуйста, добавьте хотя бы один раздел перед предварительным просмотром.",
        paperworkErrorPreparingSections: "Ошибка при подготовке разделов для предварительного просмотра.",
        paperworkAddSectionBeforeSavingPDF: "Пожалуйста, добавьте хотя бы один раздел в ваш отчет перед сохранением в PDF.",
        paperworkPDFGeneratedSuccessfully: "PDF успешно создан",
        paperworkErrorGeneratingPDF: "Произошла ошибка при создании PDF. Пожалуйста, попробуйте снова.",
        paperworkPleaseSelectImageFile: "Пожалуйста, выберите файл изображения",
        paperworkProcessingImage: "Обработка изображения...",
        paperworkImageAddedOptimized: "Изображение добавлено ({size}КБ, оптимизировано для отчетов)",
        paperworkImageAdded: "Изображение добавлено ({size}КБ)",
        paperworkErrorProcessingImage: "Ошибка при обработке изображения",
        paperworkImageProcessingError: "Произошла ошибка при обработке изображения. Пожалуйста, попробуйте с другим изображением.",
        paperworkPageBreakSpaceInserted: "Место разрыва страницы вставлено",
        paperworkSectionExpandedToEndOfPage: "Раздел расширен до конца страницы",
        paperworkTemplateDeletedSuccessfully: "Шаблон \"{templateName}\" успешно удален",
        paperworkErrorDeletingTemplate: "Ошибка при удалении шаблона: {error}",
        paperworkTryAgain: "Попробовать снова",
        paperworkTemplateDeletionConfirm: "Вы уверены, что хотите удалить шаблон \"{templateName}\"? Это действие нельзя отменить.",
        paperworkPageBreakHelp: '<strong>Примечание:</strong> Для управления разрывами страниц в вашем PDF используйте компонент "Пустое место" с высотой 500px или больше.',
        paperworkPDFPreviewTitle: "Предварительный просмотр PDF ({font})",
        paperworkPageIndicator: "--- Страница {number} ---",
        paperworkPageBreakIndicator: "РАЗРЫВ СТРАНИЦЫ",
        paperworkErrorGeneratingPreview: "Ошибка при создании предварительного просмотра. Пожалуйста, попробуйте снова.",
        paperworkErrorLoadingTemplates: "Произошла ошибка при загрузке шаблонов. Пожалуйста, попробуйте снова.",
        paperworkRecipientCompany: "Компания-получатель",
        paperworkSenderCompany: "Компания-отправитель",
        paperworkContractType: "Тип контракта",
        paperworkContractValue: "Стоимость контракта",
        paperworkProposalType: "Тип предложения",
        paperworkMemoSubject: "Тема",
        paperworkMeetingLocation: "Место собрания",
        paperworkMeetingPurpose: "Цель собрания",
        paperworkFormValidationError: "Пожалуйста, заполните все обязательные поля.",
        paperworkDocumentGenerated: "Документ успешно создан!",
        paperworkDocumentGenerationFailed: "Не удалось создать документ. Пожалуйста, попробуйте снова.",
        paperworkAddCaptionHere: "Добавьте подпись здесь",
        paperworkDesignCanvas: "Холст дизайна",
        paperworkSaving: "Сохранение...",
        paperworkLoadingTemplates: "Загрузка шаблонов...",
        paperworkGeneratingPreview: "Создание предварительного просмотра...",
        paperworkGeneratingPDF: "Создание PDF...",
        paperworkEnhancingWithAI: "Улучшение содержимого с помощью ИИ...",

        // ===== DOCUMENTGENERATORS.JS =====

        // Business letter
        documentGeneratorBusinessLetterFields: "Поля делового письма",
        documentGeneratorLocationLabel: "Местоположение",
        documentGeneratorLocationPlaceholder: "Город, Страна",
        documentGeneratorDateLabel: "Дата",
        documentGeneratorRecipientLabel: "Информация о получателе",
        documentGeneratorRecipientPlaceholder: "Имя получателя",
        documentGeneratorSubjectLabel: "Тема",
        documentGeneratorSubjectPlaceholder: "Тема письма",
        documentGeneratorGreetingLabel: "Приветствие",
        documentGeneratorGreetingPlaceholder: "Уважаемый/ая г-н/г-жа Фамилия,",
        documentGeneratorBodyLabel: "Основной текст",
        documentGeneratorBodyPlaceholder: "Напишите основное содержание вашего письма здесь...",
        documentGeneratorToneLabel: "Тон письма",
        documentGeneratorToneProfessional: "Профессиональный (Стандартный деловой тон)",
        documentGeneratorToneFriendly: "Дружелюбный (Теплый, личный)",
        documentGeneratorToneFormal: "Формальный (Высокопрофессиональный, традиционный)",
        documentGeneratorToneUrgent: "Срочный (Срочное дело)",
        documentGeneratorTonePersuasive: "Убедительный (Убеждающий, ориентированный на продажи)",
        documentGeneratorToneApologetic: "Извиняющийся (Устранение проблем)",
        documentGeneratorToneAppreciative: "Благодарный (Выражение благодарности)",
        documentGeneratorToneDirect: "Прямой (Ясный, краткий, по существу)",
        documentGeneratorClosingLabel: "Заключительная формула",
        documentGeneratorClosingPlaceholder: "С уважением,",
        documentGeneratorSignatureLabel: "Подпись",
        documentGeneratorSignaturePlaceholder: "Ваше имя",
        documentGeneratorClosingDefault: "С уважением,",

        // Contract fields
        documentGeneratorContractTypeLabel: "Тип контракта",
        documentGeneratorContractTypeService: "Договор на оказание услуг",
        documentGeneratorContractTypeEmployment: "Трудовой договор",
        documentGeneratorContractTypeNDA: "Соглашение о неразглашении (NDA)",
        documentGeneratorContractTypeSale: "Договор купли-продажи",
        documentGeneratorContractTypeLease: "Договор аренды",
        documentGeneratorContractTypeConsulting: "Консультационный договор",
        documentGeneratorContractTypePartnership: "Партнерское соглашение",
        documentGeneratorContractTypeCustom: "Индивидуальный/Другой",
        documentGeneratorContractTitleLabel: "Название контракта",
        documentGeneratorContractTitlePlaceholder: "Договор на оказание услуг, Трудовой договор и т.д.",
        documentGeneratorParty1Label: "Информация о стороне 1",
        documentGeneratorParty1Placeholder: "Полное юридическое наименование\nАдрес\nКонтактная информация",
        documentGeneratorParty2Label: "Информация о стороне 2",
        documentGeneratorParty2Placeholder: "Полное юридическое наименование\nАдрес\nКонтактная информация",
        documentGeneratorEffectiveDateLabel: "Дата вступления в силу",
        documentGeneratorTermLabel: "Срок/Продолжительность",
        documentGeneratorTermPlaceholder: "1 год, 6 месяцев, до завершения проекта и т.д.",
        documentGeneratorScopeLabel: "Объем работ/услуг",
        documentGeneratorScopePlaceholder: "Подробное описание работ, которые должны быть выполнены, услуг, которые должны быть предоставлены, или товаров, которые должны быть поставлены.",
        documentGeneratorPaymentLabel: "Условия оплаты",
        documentGeneratorPaymentPlaceholder: "Сумма, способ и график платежей.",
        documentGeneratorConfidentialityLabel: "Положения о конфиденциальности",
        documentGeneratorConfidentialityPlaceholder: "Опишите требования к конфиденциальности, какая информация считается конфиденциальной и как она должна быть защищена.",
        documentGeneratorIPLabel: "Права интеллектуальной собственности",
        documentGeneratorIPPlaceholder: "Укажите права собственности на интеллектуальную собственность, созданную в период действия соглашения.",
        documentGeneratorTerminationLabel: "Условия расторжения",
        documentGeneratorTerminationPlaceholder: "Обстоятельства, при которых любая из сторон может расторгнуть контракт, сроки уведомления и последствия расторжения.",
        documentGeneratorDisputeLabel: "Разрешение споров",
        documentGeneratorDisputePlaceholder: "Как будут рассматриваться споры (медиация, арбитраж, судебное разбирательство), применимая юрисдикция.",
        documentGeneratorAdditionalTermsLabel: "Дополнительные условия",
        documentGeneratorAdditionalTermsPlaceholder: "Любые другие условия, положения или пункты, относящиеся к данному соглашению.",

        // Memo fields
        documentGeneratorMemoCompanyLabel: "Информация о компании",
        documentGeneratorMemoCompanyPlaceholder: "Название компании\nАдрес\nКонтактная информация",
        documentGeneratorMemoToLabel: "Кому",
        documentGeneratorMemoToPlaceholder: "Имя(имена) получателя\nОтдел/Должность\nМожно указать несколько получателей",
        documentGeneratorMemoFromLabel: "От",
        documentGeneratorMemoFromPlaceholder: "Ваше имя и должность",
        documentGeneratorMemoSubjectLabel: "Тема",
        documentGeneratorMemoSubjectPlaceholder: "Четкая и краткая тема служебной записки",
        documentGeneratorMemoBodyLabel: "Текст служебной записки",
        documentGeneratorMemoBodyPlaceholder: "Напишите основное содержание вашей служебной записки здесь...",
        documentGeneratorMemoToneLabel: "Тон служебной записки",
        documentGeneratorMemoToneInformative: "Информативный (Акцент на фактах и деталях)",
        documentGeneratorMemoToneCollaborative: "Совместный (Ориентированный на команду)",
        documentGeneratorMemoToneInstructional: "Инструкционный (Инструкции или руководство)",
        documentGeneratorMemoAttachmentsLabel: "Приложения",
        documentGeneratorMemoAttachmentsPlaceholder: "Перечислите любые прикрепленные документы (необязательно)",

        // Meeting Minutes fields
        documentGeneratorMinutesOrgLabel: "Название организации/компании",
        documentGeneratorMinutesOrgPlaceholder: "Название организации или компании",
        documentGeneratorMinutesTitleLabel: "Название собрания",
        documentGeneratorMinutesTitlePlaceholder: "Заседание правления, Обзор проекта, Синхронизация команды и т.д.",
        documentGeneratorMinutesDateTimeLabel: "Дата и время",
        documentGeneratorMinutesLocationLabel: "Место проведения",
        documentGeneratorMinutesLocationPlaceholder: "Конференц-зал А, Звонок в Zoom и т.д.",
        documentGeneratorMinutesFacilitatorLabel: "Ведущий собрания",
        documentGeneratorMinutesFacilitatorPlaceholder: "Имя и роль руководителя собрания",
        documentGeneratorMinutesAttendeesLabel: "Участники",
        documentGeneratorMinutesAttendeesPlaceholder: "Список всех участников (по одному в строке)",
        documentGeneratorMinutesAbsentLabel: "Отсутствующие",
        documentGeneratorMinutesAbsentPlaceholder: "Список приглашенных людей, которые не смогли присутствовать (необязательно)",
        documentGeneratorMinutesAgendaLabel: "Пункты повестки дня",
        documentGeneratorMinutesAgendaPlaceholder: "Перечислите основные пункты повестки дня, обсуждавшиеся во время собрания",
        documentGeneratorMinutesDiscussionLabel: "Пункты обсуждения",
        documentGeneratorMinutesDiscussionPlaceholder: "Ключевые пункты, обсуждавшиеся во время собрания",
        documentGeneratorMinutesDecisionsLabel: "Принятые решения",
        documentGeneratorMinutesDecisionsPlaceholder: "Перечислите все решения и соглашения, принятые во время собрания",
        documentGeneratorMinutesActionsLabel: "Пункты действий",
        documentGeneratorMinutesActionsPlaceholder: "Список задач, назначенных исполнителей и сроков выполнения (например, 'Завершить предложение по проекту - Иван Иванов - 30 марта')",
        documentGeneratorMinutesNextMeetingLabel: "Следующее собрание",
        documentGeneratorMinutesNotesLabel: "Дополнительные заметки",
        documentGeneratorMinutesNotesPlaceholder: "Любая дополнительная информация или заметки",
        documentGeneratorMinutesPreparerLabel: "Протокол подготовлен",
        documentGeneratorMinutesPreparerPlaceholder: "Имя человека, который подготовил этот протокол",
        documentGeneratorMinutesStyleLabel: "Стиль",
        documentGeneratorMinutesStyleFormal: "Формальный (Традиционный деловой стиль)",
        documentGeneratorMinutesStyleConcise: "Краткий (Краткий и по существу)",
        documentGeneratorMinutesStyleDetailed: "Подробный (Всеобъемлющая документация)",
        documentGeneratorMinutesStyleActionFocused: "Ориентированный на действия (Акцент на следующих шагах)",
        documentGeneratorMinutesStyleFormal: "Формальный (Традиционный деловой стиль)",
        documentGeneratorMinutesStyleConcise: "Краткий (Краткий и по существу)",
        documentGeneratorMinutesStyleDetailed: "Подробный (Всеобъемлющая документация)",
        documentGeneratorMinutesStyleActionFocused: "Ориентированный на действия (Акцент на следующих шагах)",
        documentGeneratorMinutesNextLabel: "Следующее собрание",
        documentGeneratorMinutesNextDatePlaceholder: "Дата следующего собрания",
        documentGeneratorMinutesNextTimePlaceholder: "Время следующего собрания",

        // Proposal fields
        documentGeneratorProposalCompanyLabel: "Информация о вашей компании",
        documentGeneratorProposalCompanyPlaceholder: "Название компании\nАдрес\nКонтактная информация\nВеб-сайт",
        documentGeneratorProposalClientLabel: "Информация о клиенте/получателе",
        documentGeneratorProposalClientPlaceholder: "Имя клиента\nКомпания\nДолжность\nАдрес\nКонтактная информация",
        documentGeneratorProposalTitleLabel: "Название предложения",
        documentGeneratorProposalTitlePlaceholder: "Например: Предложение по редизайну веб-сайта, Предложение маркетинговых услуг",
        documentGeneratorProposalTypeLabel: "Тип предложения",
        documentGeneratorProposalTypeServices: "Предложение услуг",
        documentGeneratorProposalTypeProduct: "Предложение продукта",
        documentGeneratorProposalTypeProject: "Предложение проекта",
        documentGeneratorProposalTypeInvestment: "Инвестиционное предложение",
        documentGeneratorProposalTypePartnership: "Предложение партнерства",
        documentGeneratorProposalTypeMarketing: "Маркетинговое предложение",
        documentGeneratorProposalTypeConsulting: "Консультационное предложение",
        documentGeneratorProposalTypeCustom: "Индивидуальное предложение",
        documentGeneratorProposalSummaryLabel: "Краткое изложение",
        documentGeneratorProposalSummaryPlaceholder: "Предоставьте краткий обзор вашего предложения. Кратко объясните цель, основные задачи и наиболее важные преимущества для клиента. Этот раздел должен привлечь внимание и стимулировать дальнейшее чтение.",
        documentGeneratorProposalProblemLabel: "Постановка проблемы / Потребности клиента",
        documentGeneratorProposalProblemPlaceholder: "Опишите текущие проблемы, вызовы или потребности клиента, которые решает ваше предложение. Продемонстрируйте ваше понимание их ситуации.",
        documentGeneratorProposalSolutionLabel: "Предлагаемое решение",
        deliverablesLabel: "Результаты поставки",
        timelineLabel: "График / Расписание",
        pricingLabel: "Ценообразование / Инвестиции",
        teamLabel: "Команда / Квалификация",
        caseStudiesLabel: "Кейсы / Примеры",
        callToActionLabel: "Призыв к действию",
        termsConditionsLabel: "Условия и положения",
        proposalStyleLabel: "Стиль предложения",

        // Messages and alerts
        documentGeneratorRequiredFieldsError: "Пожалуйста, заполните следующие обязательные поля: {fields}",
        documentGeneratorEnhanceFieldError: "Пожалуйста, введите содержимое в поле перед улучшением, или произошла ошибка во время улучшения.",
        documentGeneratorEnhanceAllFieldsError: "Пожалуйста, добавьте содержимое хотя бы в одно текстовое поле перед улучшением всех полей.",
        documentGeneratorEnhanceAllComplete: "Все поля были улучшены!",
        documentGeneratorEnhanceError: "Произошла ошибка при улучшении некоторых полей. Пожалуйста, проверьте результаты.",
        documentGeneratorEnhanceFailure: "Не удалось улучшить содержимое. Попробуйте еще раз или продолжите с оригинальным содержимым.",
        documentGeneratorGenerateError: "Произошла ошибка при генерации вашего документа. Пожалуйста, попробуйте еще раз.",
        documentGeneratorFormCleared: "Форма очищена",
        documentGeneratorEmailError: "Не удалось автоматически открыть ваш почтовый клиент.\n\nСодержимое документа скопировано в буфер обмена.\nПожалуйста, откройте ваш почтовый клиент и вставьте содержимое.",
        documentGeneratorNoContentError: "Нет содержимого для отправки по электронной почте. Пожалуйста, попробуйте еще раз.",
        documentGeneratorCopyError: "Нет текста для копирования",
        documentGeneratorCopySuccess: "Скопировано!",
        documentGeneratorCopyFailed: "Не удалось скопировать текст. Пожалуйста, попробуйте еще раз.",

        // Document preview
        documentGeneratorPreviewBusinessLetter: "Предварительный просмотр делового письма",
        documentGeneratorPreviewInvoice: "Предварительный просмотр счета",
        documentGeneratorPreviewContract: "Предварительный просмотр договора",
        documentGeneratorPreviewMemo: "Предварительный просмотр служебной записки",
        documentGeneratorPreviewMeetingMinutes: "Предварительный просмотр протокола собрания",
        documentGeneratorPreviewDefault: "Предварительный просмотр документа",
        documentGeneratorEditText: "Редактировать текст",
        documentGeneratorShowFormatted: "Показать форматированный текст",
        documentGeneratorCopyText: "Копировать текст",
        documentGeneratorEmailIt: "Отправить по электронной почте",
        documentGeneratorGoBack: "Назад",
        documentGeneratorClose: "Закрыть",

        // Loading states
        documentGeneratorEnhancing: "Улучшение вашего письма...",
        documentGeneratorGeneratingContract: "Генерация вашего договора...",
        documentGeneratorGeneratingProposal: "Генерация вашего бизнес-предложения...",
        documentGeneratorGeneratingMemo: "Генерация вашей служебной записки...",
        documentGeneratorGeneratingMinutes: "Генерация вашего протокола собрания...",
        documentGeneratorEnhancingField: "Улучшение {field}...",
        documentGeneratorEnhancingAll: "Улучшение всех текстовых полей...",

        // Contract fallback headers
        documentGeneratorContractPartiesHeader: "СТОРОНЫ",
        documentGeneratorContractAgreementText: "Настоящий {title} (\"Соглашение\") заключается между:",
        documentGeneratorContractTermHeader: "СРОК",
        documentGeneratorContractScopeHeader: "ОБЪЕМ РАБОТ",
        documentGeneratorContractPaymentHeader: "УСЛОВИЯ ОПЛАТЫ",
        documentGeneratorContractConfidentialityHeader: "КОНФИДЕНЦИАЛЬНОСТЬ",
        documentGeneratorContractIPHeader: "ИНТЕЛЛЕКТУАЛЬНАЯ СОБСТВЕННОСТЬ",
        documentGeneratorContractTerminationHeader: "РАСТОРЖЕНИЕ",
        documentGeneratorContractDisputeHeader: "РАЗРЕШЕНИЕ СПОРОВ",
        documentGeneratorContractAdditionalHeader: "ДОПОЛНИТЕЛЬНЫЕ УСЛОВИЯ",
        documentGeneratorContractSignaturesHeader: "ПОДПИСИ",
        documentGeneratorContractWitnessText: "В УДОСТОВЕРЕНИЕ ЧЕГО стороны исполнили настоящее Соглашение в дату, указанную выше.",
        documentGeneratorContractParty1Signature: "Сторона 1: _______________________________",
        documentGeneratorContractParty2Signature: "Сторона 2: _______________________________",

        // Proposals
        documentGeneratorProposalStyleProfessional: "Профессиональный (деловой формальный тон)",
        documentGeneratorProposalStylePersuasive: "Убедительный (подход, ориентированный на продажи)",
        documentGeneratorProposalStyleTechnical: "Технический (сосредоточен на деталях и спецификациях)",
        documentGeneratorProposalStyleCreative: "Креативный (инновационный, визуально-ориентированный)",
        documentGeneratorProposalStyleConsultative: "Консультативный (консультационный, сосредоточен на решении проблем)",
        documentGeneratorProposalSolutionPlaceholder: "Подробно опишите ваше решение проблем клиента. Объясните ваш подход, методологию, продукты или услуги, которые удовлетворят их потребности.",
        documentGeneratorDeliverablesLabel: "Результаты поставки",
        documentGeneratorDeliverablesPlaceholder: "Опишите, что вы поставите клиенту...",
        documentGeneratorTimelineLabel: "График / Расписание",
        documentGeneratorTimelinePlaceholder: "Предоставьте детали графика...",
        documentGeneratorPricingLabel: "Ценообразование / Инвестиции",
        documentGeneratorPricingPlaceholder: "Изложите вашу структуру ценообразования...",
        documentGeneratorTeamLabel: "Команда / Квалификации",
        documentGeneratorTeamPlaceholder: "Опишите квалификации вашей команды...",
        documentGeneratorCaseStudiesLabel: "Кейс-стади / Примеры",
        documentGeneratorCaseStudiesPlaceholder: "Предоставьте соответствующие кейс-стади...",
        documentGeneratorCallToActionLabel: "Призыв к действию",
        documentGeneratorCallToActionPlaceholder: "Что вы хотите, чтобы клиент сделал дальше?",
        documentGeneratorTermsConditionsLabel: "Условия и положения",
        documentGeneratorTermsConditionsPlaceholder: "Включите любые условия и положения...",
        documentGeneratorProposalStyleLabel: "Стиль предложения",

        //Extras 
        documentGeneratorTemplateEmptyState: "Поля еще не добавлены. Используйте кнопки выше для добавления полей.",
        documentGeneratorTextFieldDefault: "Текстовое поле",
        documentGeneratorTextFieldBadge: "Текст",
        documentGeneratorTextAreaDefault: "Текстовая область",
        documentGeneratorTextAreaBadge: "Текстовая область",
        documentGeneratorImageDefault: "Изображение",
        documentGeneratorImageBadge: "Изображение",
        documentGeneratorEditButton: "Редактировать",
        documentGeneratorDeleteButton: "Удалить",
        documentGeneratorEnhanceFailure: "Не удалось улучшить содержимое. Пожалуйста, попробуйте еще раз или продолжите с оригинальным содержимым.",
        documentGeneratorEnhancingField: "Улучшение {field}...",
        documentGeneratorBusinessLetterPreview: 'Предварительный просмотр делового письма',
        documentGeneratorInvoicePreview: 'Предварительный просмотр счета',
        documentGeneratorContractPreview: 'Предварительный просмотр контракта',
        documentGeneratorMemoPreview: 'Предварительный просмотр служебной записки',
        documentGeneratorMeetingMinutesPreview: 'Предварительный просмотр протокола собрания',
        documentGeneratorDocumentPreview: 'Предварительный просмотр документа',

        // Template name placeholder
        paperworkTemplateNamePlaceholder: "Отчет о состоянии инженерии, Отчет об ошибке и т.д.",
        paperworkDocumentTitle: "Заголовок Документа",
        paperworkDocumentSubtitle: "Подзаголовок или описание документа",
        paperworkSectionHeader: "Заголовок Раздела",
        paperworkTextAreaField: "Поле Текстовой Области",
        paperworkEnterLongerTextHere: "Введите длинный текст здесь...",
        paperworkImageGallery: "Галерея Изображений",
        paperworkTextWithImage: "Текст с Изображением",
        paperworkEnterTextHere: "Введите текст здесь...",
        paperworkImageWithText: "Изображение с Текстом",
        paperworkImageRow: "Ряд Изображений",
        paperworkAddCaptionHere: "Добавьте подпись здесь",
        paperworkAddACaptionHere: "Добавьте подпись здесь",
        paperworkClickOrDragImage: "Нажмите или перетащите изображение",
        paperworkClickToEdit: "Нажмите для редактирования",
        paperworkEmptySpace: "Пустое Пространство",
        paperworkDragToResize: "Перетащите для изменения размера",
        paperworkPageBreakSpace: "Пространство разрыва страницы",
        paperworkProcessingImage: "Обработка изображения...",
        paperworkImageAdded: "Изображение добавлено ({size}КБ)",
        paperworkImageAddedOptimized: "Изображение добавлено и оптимизировано ({size}КБ)",
        paperworkErrorProcessingImage: "Ошибка обработки изображения",
        paperworkImageProcessingError: "Ошибка обработки изображения. Пожалуйста, попробуйте снова.",
        paperworkPleaseSelectImageFile: "Пожалуйста, выберите файл изображения",
        paperworkResize: "Изменить размер", 

        // Placeholders
        documentGeneratorLocationPlaceholder1: '[Информация о местоположении]',
        documentGeneratorRecipientPlaceholder1: '[Информация о получателе]',
        documentGeneratorSubjectPlaceholder1: '[Тема]',
        documentGeneratorGreetingDefault1: 'Уважаемые господа,',
        documentGeneratorBodyPlaceholder1: '[Текст письма]',
        documentGeneratorClosingDefault1: 'С уважением,',
        documentGeneratorSignaturePlaceholder1: '[Ваше имя]',
        documentGeneratorContractTitlePlaceholder1: '[Название контракта]',
        documentGeneratorParty1Placeholder1: '[Информация о стороне 1]',
        documentGeneratorParty2Placeholder1: '[Информация о стороне 2]',
        documentGeneratorTermPlaceholder1: '[Срок контракта]',
        documentGeneratorScopePlaceholder1: '[Объем работ]',
        documentGeneratorPaymentPlaceholder1: '[Условия оплаты]',
        documentGeneratorProposalCompanyPlaceholder1: '[Информация о компании]',
        documentGeneratorProposalClientPlaceholder1: '[Информация о клиенте]',
        documentGeneratorProposalTitlePlaceholder1: '[Название предложения]',
        documentGeneratorMemoToPlaceholder1: '[Получатель]',
        documentGeneratorMemoFromPlaceholder1: '[Отправитель]',
        documentGeneratorMemoSubjectPlaceholder1: '[Тема]',
        documentGeneratorMemoBodyPlaceholder1: '[Текст служебной записки]',
        documentGeneratorMinutesTitlePlaceholder1: 'Протокол собрания',

        // Extras
        documentGeneratorProposalPreview: 'Предложение',
        documentGeneratorClosingDefault2: 'С наилучшими пожеланиями,',
        documentGeneratorCopied: 'Скопировано!',
        documentGeneratorCopiedPlainText: 'Скопировано (обычный текст)',
        documentGeneratorShowFormattedText: 'Показать форматированный текст',

        // ===== ARTWORKSTAB.JS =====

        //UI
        artworkSelectVisualModel: "Выберите визуальную модель:",
        artworkSelectMode: "Выберите режим:",
        artworkHtmlStyleTransfer: "Перенос HTML стиля",
        artworkTextOverlay: "Наложение текста",
        artworkDesignRationale: "Обоснование дизайна",
        artworkUploadReferenceImage: "Загрузите референсное изображение:",
        artworkDragImageOrClick: "Перетащите изображение сюда или нажмите для загрузки",
        artworkUseAsBackground: "Использовать как фоновое изображение",
        artworkDesignInstructions: "Инструкции по дизайну:",
        artworkDesignInstructionsPlaceholder: "Опишите желаемый стиль (например, 'Создать брутальный веб-сайт', 'Дизайн в минималистском стиле'), название веб-сайта, кнопки и т.д...",
        artworkGenerateDesign: "Создать дизайн",
        artworkGeneratedDesign: "Созданный дизайн:",
        artworkSelectVisualModelOption: "Выберите визуальную модель",
        artworkVisualDesignStudio: "Студия визуального дизайна",
        artworkCreateDesignsDescription: "Создавайте дизайны, веб-сайты или произведения искусства, используя визуальные модели ИИ.",

        //Models
        artworkNoVisualModelsAvailable: "Визуальные модели недоступны",
        artworkFeatureRequiresVisualModels: "Эта функция требует установленных визуальных моделей в Ollama.",
        artworkNoCompatibleModelsInstalled: "У вас в настоящее время не установлено ни одной совместимой визуальной модели.",
        artworkInstallModelsLike: "Установите модели, такие как LLaVA, Bakllava, Gemma3, Phi3-Vision или другие модели с визуальными возможностями",
        artworkToUseThisFeature: "для использования этой функции.",
        artworkGoToModelsTab: "Перейти к вкладке Модели",

        //Info
        artworkPleaseSelectVisualModel: "Пожалуйста, выберите визуальную модель",
        artworkPleaseUploadReferenceImage: "Пожалуйста, загрузите референсное изображение",
        artworkPleaseProvideDesignInstructions: "Пожалуйста, предоставьте инструкции по дизайну",
        artworkPleaseSelectImageFile: "Пожалуйста, выберите файл изображения",
        artworkImageTooLarge: "Изображение слишком большое. Максимальный размер 5МБ",

        //Overlays
        artworkStyleModePlaceholder: "Опишите желаемое преобразование стиля (например, 'Преобразовать это в брутальный дизайн с жирной типографикой')",
        artworkOverlayModePlaceholder: "Введите текст для наложения (например, 'Заголовок: Название продукта, Основная часть: Ключевые особенности..., Подвал: Призыв к действию')",
        artworkRationaleModePlaceholder: "Спросите о конкретных аспектах дизайна для объяснения (например, 'Объясните выбор макета и как они влияют на пользовательский поток')",

        //Generate artworks
        artworkGenerating: "Создание...",
        artworkGenerationCancelled: "Генерация была отменена.",
        artworkImageAnalysisFailed: "Ошибка: Анализ изображения не удался. Пожалуйста, попробуйте снова.",
        artworkErrorOccurred: "Ошибка: {error}",
        analyzingImage: 'Анализ изображения',
        analyzingImageAndGenerating: 'Анализ изображения и создание дизайна...',
        artworkGenerationTiming: 'Это может занять 30-60 секунд в зависимости от модели',

        // ===== ARTWORKPREVIEWWINDOW.JS =====
        artworkCopyText: "Копировать текст",
        artworkCopyCode: "Копировать код",

        // Create window
        artworkCode: "Код",
        artworkPreview: "Предварительный просмотр",
        artworkExportPNG: "Экспорт PNG",
        artworkClose: "Закрыть",

        // Background image
        artworkBackgroundImageWarning: "ВАЖНО: Используется временный URL изображения.",
        artworkBackgroundImageInstructions: "При развертывании вашего сайта замените это на фактический путь к изображению, например:",
        artworkBackgroundImageReplace: "Заменить на фактический путь к изображению при развертывании",

        // Copy code
        artworkCopied: "Скопировано!",
        artworkCopyFailed: "Не удалось скопировать код. Пожалуйста, попробуйте снова.",

        // Download image
        artworkExportingPNG: "Экспорт PNG...",
        artworkExportWait: "Пожалуйста, подождите, пока мы создадим ваше изображение.",
        artworkExportSuccess: "PNG успешно экспортировано!",
        artworkExportDownloaded: "Ваше изображение было загружено.",

        // Export instructions
        artworkExportInstructions: "Чтобы сохранить как высококачественный PNG:",
        artworkExportScreenshot: "Сделайте скриншот области предварительного просмотра:",
        artworkExportMac: "Cmd+Shift+4, затем выберите область",
        artworkExportWindows: "Win+Shift+S, затем выберите область",
        artworkExportPasteSave: "Вставьте и сохраните в предпочитаемом редакторе изображений",
        artworkExportGotIt: "Понятно",

        // Extras
        artworkGenerationCanceled: 'Генерация отменена',
        artworkGenerationWasCanceled: 'Генерация была отменена.',
        artworkTryAgainDifferentPrompt: 'Вы можете попробовать снова с другим запросом или моделью.',
        artworkGenerationFailed: 'Генерация не удалась',
        artworkImageAnalysisFailed: 'Анализ изображения не удался',
        artworkTryAgainDifferentPromptOrModel: 'Пожалуйста, попробуйте снова с другим запросом или моделью',

        // ===== MODELSTAB.JS =====

        // Models tab
        modelRestartOllamaAdvice: "Пожалуйста, перезапустите Ollama для полной очистки частичных файлов.",
        modelFetchButton: "Получить Модели Ollama",
        modelSelectPlaceholder: "Модели еще не получены",
        modelFetching: "Получение моделей...",
        modelPleaseWait: "Пожалуйста, подождите, подключение к Ollama...",
        modelFetchSuccess: "Найдено {count} доступных моделей",
        modelFetchError: "Ошибка подключения к Библиотеке Ollama",
        modelFetchRetry: "Повторить",
        modelSelectLabel: "Выбрать Модель",
        modelSizeLabel: "Выбрать Размер",
        modelDeleteSelectOption: "Выбрать модель...",
        modelDownloadButton: "Скачать Модель",
        modelDeleteButton: "Удалить Выбранную Модель",
        modelLocalLabel: "Текущие Локальные Модели",
        modelDownloadStarting: "Начало загрузки...",
        modelDownloading: "Загрузка: {downloaded} / {total}",
        modelDownloadComplete: "Загрузка Завершена",
        modelDownloadError: "Ошибка - Попробуйте Снова",
        modelDeleteConfirm: "Вы уверены, что хотите удалить {model}?",
        modelDeleting: "Удаление...",
        modelDeleted2: "Модель Удалена",
        modelDeleteError: "Ошибка Удаления",
        modelDeleteSuccess: "Успешно удалена {model}",
        modelNoTags: "Нет доступных тегов для этой модели",
        modelDownloadSuccess: "Успешно загружена {model}",
        modelErrorMessage: "Ошибка: {message}",
        modelConfigureButton: "Настроить модель (опционально)",
        modelConfigureSuccess: "Успешно создана пользовательская модель '{model}' на основе {baseModel}!",
        modelConfigureError: "Ошибка создания пользовательской модели: {error}",
        modelChooseOption: "Выберите модель...",
        modelFetchingMessage: "Получение моделей...",
        modelResumeDownload: "Возобновить Загрузку",
        modelDownloadResuming: "Возобновление загрузки...",
        modelRefreshingStats: "Обновление статистики загрузки...",
        modelFetchDisabledDuringDownload: "Получение моделей отключено во время загрузки модели.",
        close: "Закрыть",
        save: "Сохранить",
        modelName: "Имя Модели",
        baseModel: "Базовая Модель",
        creating: "Создание...",
        modelLoadingOption: "Загрузка локальных моделей...",
        modelFetchError: "Ошибка загрузки онлайн моделей",
        modelFetchingSizes: "Получение размеров...",
        modelNoSizesFound: "Размеры для этой модели не найдены",
        modelSizesFetchError: "Ошибка загрузки размеров модели",
        modelSelectBothRequired: "Пожалуйста, выберите модель и размер перед загрузкой.",
        modelCancelButton: "Отменить Загрузку",
        modelCancelDownloadConfirm: "Вы уверены, что хотите отменить эту загрузку? Частичные загрузки будут удалены.",
        modelCancellingDownload: "Отмена загрузки и очистка...",
        modelDownloadCancelled: "Загрузка успешно отменена, пожалуйста, перезапустите Ollama для удаления частично загруженных файлов.",
        modelCancellationError: "Ошибка в процессе отмены.",
        modelDownloadInterrupted: "Загрузка прервана. Пожалуйста, попробуйте снова.",
        modelSettingsTitle: "Настройки Модели",
        modelSettingsDescription: "Просмотр и настройка параметров этой модели.",
        modelConfigTemp: "Температура",
        modelConfigTopP: "Top P",
        modelConfigTopK: "Top K",
        modelConfigRepeatPenalty: "Штраф за Повторение",
        restoreSettings: "Восстановить Заводские Настройки",
        saveSettings: "Сохранить Настройки",
        modelSettingsSaved: "Настройки сохранены для {model}.",
        modelSettingsError: "Ошибка сохранения настроек: {error}",
        savingSettings: "Сохранение настроек...",
        restoringSettings: "Восстановление заводских настроек...",
        settingsRestored: "Заводские настройки восстановлены",
        modelConfigStatus: "Статус Настроек",
        modelConfigHelp: "Настройте параметры для контроля генерации текста моделью.",
        modelConfigTempHelp: "Более высокие значения (ближе к 1) делают вывод более случайным, более низкие значения более детерминированными.",
        modelConfigTopPHelp: "Ограничивает выбор токенов процентом от массы вероятности. Более низкие значения увеличивают фокус.",
        modelConfigTopKHelp: "Ограничивает выбор токенов топ-K токенами. Более низкие значения увеличивают фокус.",
        modelConfigRepeatPenaltyHelp: "Более высокие значения уменьшают повторения, штрафуя повторяющиеся токены.",
        modelConfigResetButton: "Сбросить",
        modelConfigSaveButton: "Сохранить Изменения",
        viewModelsConfirm: "Хотели бы вы посмотреть доступные модели Ollama онлайн?",
        fetchingModels: "Получение моделей Ollama...",
        loadingModelDownloader: "Загрузка загрузчика моделей...",
        errorLoadingModels: "Ошибка Загрузки Моделей",





        // ===== RESEARCHTAB.JS =====

        //Research
        researchInitializationFailed: "Не удалось инициализировать инструменты Исследования",
        researchErrorMessage: "Ошибка: {message}",
        researchSubTab: "Исследование",
        knowledgeBaseSubTab: "База Знаний",
        researchAssistantTitle: "Помощник по Исследованиям",
        researchAssistantDescription: "Исследуйте любую тему с помощью поиска и суммирования на основе ИИ, модели рассуждения значительно увеличат время исследования, но обеспечат лучшие результаты (deepSeek, Qwen3, QwQ и т.д.).",
        researchQueryPlaceholder: "Введите ваш исследовательский вопрос...",
        researchButton: "Исследовать",
        knowledgeBaseTitle: "База Знаний",
        knowledgeBaseDescription: "Храните и извлекайте информацию в вашей персональной базе знаний.",
        knowledgeBaseCollectionPlaceholder: "Название новой коллекции...",
        knowledgeBaseCreateButton: "Создать Коллекцию",
        knowledgeBaseCollectionsTitle: "Ваши Коллекции Знаний",
        researchSizeLabel: "Выберите приблизительный размер отчета:",
        researchSizeTooltip: "Выберите желаемый размер вашего исследовательского отчета. Большие отчеты будут включать больше деталей и более глубокий анализ, но могут занять больше времени для генерации.",
        researchSizeConcise: "Краткий (500-800 слов)",
        researchSizeStandard: "Стандартный (1000-1500 слов)",
        researchSizeDetailed: "Подробный (2000-3000 слов)",
        researchSizeComprehensive: "Всеобъемлющий (4000-5000 слов)",
        researchSizeExtensive: "Обширный (6000+ слов)",
        modelSelectionRequired: "Требуется Выбор Модели",

        // Knowledge Base search related translations
        knowledgeBaseSearchMode: "Режим Поиска по Базе Знаний",
        knowledgeBaseSearchInfo: "В этой вкладке основной запрос будет искать по вашим коллекциям знаний.",
        knowledgeBaseSearchPlaceholder: "Поиск в вашей базе знаний...",
        knowledgeBaseSearching: "Поиск в базе знаний...",
        knowledgeBaseNoResults: "Соответствующие записи в вашей базе знаний не найдены для: \"{query}\"",
        knowledgeBaseSearchTryDifferent: "Попробуйте другой поисковый термин или добавьте больше контента в вашу базу знаний.",
        knowledgeBaseSearchResults: "Найдено {count} записей в вашей базе знаний для: \"{query}\"",
        knowledgeBaseEntryCollection: "Коллекция: {name}",
        knowledgeBaseViewEntry: "Просмотреть Запись",
        knowledgeBaseViewCollection: "Перейти к Коллекции",
        knowledgeBaseSearchError: "Ошибка поиска в базе знаний: {error}",
        knowledgeBaseTryAgain: "Пожалуйста, попробуйте снова или проверьте консоль браузера для более подробной информации.",
        knowledgeBaseSearchLabel: "Поиск:",

        // ===== RESEARCH.JS =====
        researchEnableDeepSearch: "Включить глубокий поиск",
        researchDeepSearchTooltip: "Глубокий поиск переходит по ссылкам в результатах поиска для обнаружения дополнительного релевантного контента. Это обеспечивает более всестороннее исследование, но может занять больше времени.",
        researchDeepSearchDepth: "Глубина:",
        researchDeepSearchLevel1: "1 уровень",
        researchDeepSearchLevel2: "2 уровня",
        researchDeepSearchLevel3: "3 уровня",
        researchDeepSearchLinksPerPage: "Ссылок на страницу:",
        researchDeepSearchLink1: "1 ссылка",
        researchDeepSearchLink2: "2 ссылки",
        researchDeepSearchLink3: "3 ссылки",
        researchDeepSearchLink5: "5 ссылок",

        // Perform research
        researchInProgress: "Исследование выполняется",
        researchProcessAlreadyRunning: "Процесс исследования уже запущен. Пожалуйста, подождите.",
        researchMissingTopic: "Отсутствует тема исследования",
        researchEnterTopicPrompt: "Пожалуйста, введите тему исследования в поле ввода выше.",
        researchModelRequired: "Пожалуйста, сначала выберите модель на вкладке Чат. Модель необходима для функции исследования.",
        switchToChatTab: "Переключиться на вкладку Чат",
        researchProcess: "Процесс исследования",
        researchStarting: "Начало исследования...",
        researchGeneratingQueries: "Генерация поисковых запросов...",
        researchSearchingInfo: "Поиск информации...",
        researchProcessingSources: "Обработка источников...",
        researchFinalizingData: "Завершение данных исследования...",
        researchGeneratingReport: "Создание отчета исследования...",
        researchComplete: "Исследование завершено!",
        researchError: "Ошибка исследования",

        // Generate title
        researchInsufficientContent: "Недостаточно контента для обобщения.",
        researchSummaryProcessingCompleted: "Обработка сводки завершена.",
        researchPdfDocumentLabel: "[PDF документ]",
        researchUntitledPage: "Страница без названия",

        //Create results
        researchInsufficientContent: "Недостаточно контента для обобщения.",
        researchResultsTitle: "Результаты исследования",
        researchResults: "Результаты исследования",
        researchReportEditable: "Этот отчет исследования полностью редактируемый. Внесите изменения по необходимости перед экспортом или сохранением.",
        researchSourcesCount: "Источники ({count})",
        researchDeepSourcesIncluded: "Включает {count} вторичных источников из глубокого поиска",
        researchViewPDF: "Просмотреть PDF",
        researchExportReport: "Экспортировать отчет",
        esearchSaveToKnowledgeBase: "Сохранить в базу знаний",
        researchExportPlainText: "Обычный текст (.txt)",
        researchExportMarkdown: "Markdown (.md)",
        researchExportHTML: "HTML (.html)",
        // Show save
        researchConfirmRemoveSource: "Удалить этот источник?",
        researchResults: "Результаты исследования",
        researchReportEditable: "Этот отчет исследования полностью редактируемый. Внесите изменения по необходимости перед экспортом или сохранением.",
        researchReopenPrompt: "Если вы закрыли его, вы можете нажать здесь, чтобы открыть снова.",
        exportButton: "Экспорт",
        knowledgeBaseNotAvailable: "База знаний недоступна. Пожалуйста, попробуйте позже.",
        researchModelRequiredForKB: "Пожалуйста, сначала выберите модель исследования перед сохранением в базу знаний.",
        saveToKnowledgeBase: "Сохранить в базу знаний",
        researchSaveDescription: "Сохранить этот отчет исследования в вашу базу знаний для будущего использования.",
        reportTitle: "Название отчета",
        sourceOptions: "Опции источников",
        saveSeparateEntries: "Сохранить источники как отдельные записи",
        includeSourcesInReport: "Включить источники только в основной отчет",
        saveToCollection: "Сохранить в коллекцию",
        cancelButton: "Отмена",

        // Show add entry
        addNewKnowledgeEntry: "Добавить новую запись знаний",
        entryTitle: "Название записи",
        content: "Содержимое",
        markdownFormattingNote: "Вы можете использовать форматирование Markdown.",
        cancelButton: "Отмена",
        saveEntry: "Сохранить запись",

        // Alerts
        researchProcessAlreadyRunning: "Процесс исследования уже запущен. Пожалуйста, подождите.",
        pleaseEnterTitle: "Пожалуйста, введите название для этой записи.",
        pleaseEnterContent: "Пожалуйста, введите содержимое для этой записи.",
        collectionNotFound: "Коллекция не найдена",
        failedToUpdateCollection: "Не удалось обновить коллекцию",
        failedToDeleteCollection: "Не удалось удалить коллекцию",
        pleaseEnterReportTitle: "Пожалуйста, введите название отчета",
        pleaseSelectCollection: "Пожалуйста, выберите коллекцию",
        researchSavedSuccessfully: "Исследование успешно сохранено в базу знаний",
        failedToUpdateEntry: "Не удалось обновить запись",

        // Confirmations
        confirmDeleteEntry: "Удалить запись \"{title}\"? Это действие нельзя отменить.",
        confirmDeleteCollection: "Удалить коллекцию \"{name}\" с {count} записями? Это действие нельзя отменить.",

        // Buttons
        backToKnowledgeBase: "← Назад к базе знаний",
        newEntry: "+ Новая запись",
        backToEntries: "← Назад к записям",
        editEntry: "Редактировать запись",
        deleteEntry: "Удалить запись",
        enterNewCollectionName: "Введите новое имя для коллекции:",

        // Status messages
        saving: "Сохранение...",
        savingSourceProgress: "Сохранение источника {current} из {total}...",
        researchProcessCancelled: "Процесс исследования отменен",

        // Empty states
        noKnowledgeCollections: "Пока нет коллекций знаний. Создайте свою первую коллекцию для начала.",
        noEntriesInCollection: "Пока нет записей в этой коллекции. Нажмите \"Новая запись\" для добавления содержимого.",
        savingSourcesTitle: "Сохранение источников в базу знаний",

        // Extras 
        editKnowledgeEntry: "Редактировать запись знаний",
        saveChanges: "Сохранить изменения",
        created: "Создано",
        noContentForExport: "Нет контента для экспорта",
        exportedOn: "Экспортировано",
        totalEntries: "Всего записей",
        source: "Источник",
        saving: "Сохранение...",
        saveChanges: "Сохранить изменения",
        deleteEntry: "Удалить запись",
        loadingCollections: "Загрузка коллекций...",
        errorLoadingCollections: "Ошибка загрузки коллекций",
        createNewCollectionOption: "➕ Создать новую коллекцию...",
        researchReopenPrompt: "Если вы закрыли его, вы можете нажать здесь, чтобы открыть снова.",
        knowledgeBaseModelRequired: "Пожалуйста, сначала выберите модель на вкладке Чат. Модель необходима для генерации эмбеддингов и отображения содержимого коллекции.",
        selectModel: "Выбрать модель",
        warning: "⚠️ Предупреждение:",
        info: "ℹ️ Информация:",
        collectionWithEntries: "{name} ({count} записей)",
        sourcePrefix: "Источник",
        untitledSource: "Источник без названия",
        failedToExtractContent: "Не удалось извлечь содержимое из {url}: {error}",
        errorLoadingCollections: "Ошибка загрузки коллекций",
        savingSourceInitial: "Сохранение источника 0 из {total}...",
        researchComplete: "Исследование завершено!",
        researchResultsDisplayed: "Результаты вашего исследования отображаются в плавающем окне. Если вы закрыли его, вы можете",
        researchReopenLink: "нажать здесь, чтобы открыть снова",
        failedToDeleteEntry: "Не удалось удалить запись",
        factsAndStatistics: "факты и статистика",
        latestResearchOn: "последние исследования по",
        analysis: "анализ",
        summaryFailedSuffix: "... (Сводка не удалась)",
        failedToGeneratePartialReport: "Не удалось создать частичный отчет для источников {start}-{end}: {error}.",
        noReportPartsGenerated: "Части отчета не были созданы.",
        researchReportTitle: "Отчет исследования",
        failedToExtractPDF: "Не удалось извлечь содержимое PDF",
        pdfCouldNotBeProcessed: "PDF документ не может быть обработан. Нажмите 'Просмотреть PDF' для прямого открытия.",
        pdfCouldNotBeFullyProcessed: "PDF документ не может быть полностью обработан. Нажмите 'Просмотреть PDF' для прямого открытия.",
        summaryProcessingCompleted: "Обработка сводки завершена.",
        failedToCreateNewCollection: 'Не удалось создать новую коллекцию: {error}',
        failedToSaveToKnowledgeBase: 'Не удалось сохранить в базу знаний: {error}',
        failedToExtractContentFrom: 'Не удалось извлечь содержимое из {url}',
        failedToExtractContent: 'Не удалось извлечь содержимое',
        never: 'Никогда',
        entries: 'Записи',
        lastUpdated: 'Последнее обновление',
        view: 'Просмотр',
        edit: 'Редактировать',
        export: 'Экспорт',
        delete: 'Удалить',
        exportUtilityNotAvailable: 'Утилита экспорта недоступна. Пожалуйста, попробуйте позже.',
        saveEntry: 'Сохранить запись',
        saving: 'Сохранение',
        generatingEmbeddings: 'Генерация эмбеддингов...',
        entrySavedSuccessfully: 'Запись успешно сохранена',
        error: 'Ошибка',
        researchSaveToKnowledgeBase: 'Сохранить в базу знаний',
        sourcePrefix: "Источник",
        untitledSource: "Источник без названия",
        sourceFromResearch: "Источник из исследования",
        summary: "Сводка",
        sourceURL: "URL источника",
        noSummaryAvailable: "Сводка недоступна",
        entryCreatedAsSourceReference: "Эта запись была создана как ссылка на источник для отчета исследования",

        // ===== CODEPREVIEW.JS =====

        previewModalCreateError: "Не удалось создать модальное окно предварительного просмотра HTML",
        previewErrorOnLine: "Ошибка в строке",
        previewColumn: "столбец",
        previewRefreshTooltip: "Обновить предварительный просмотр",
        previewMaximize: "Развернуть",
        previewRestore: "Восстановить",
        previewClose: "Закрыть",




        // ===== EXPORT.JS =====
        conversationPrefix: "Беседа",
        exportFilename: "Имя файла",
        filenameRequired: "Пожалуйста, введите имя файла",

        // ===== STREAMPROCESSOR.JS =====

        modelThinking: 'Модель размышляет: ',
        modelThoughtComplete: 'Размышление завершено: ',
        toggleThinkingVisibility: 'Переключить видимость процесса размышления',
        thinkingTime: 'Время размышления',
        thinkingCollapsed: 'Показать процесс размышления',
        thinkingExpanded: 'Скрыть процесс размышления',
        modelThinkingCancelled: 'Размышление отменено: ',
        // Code Preview messages
        previewLoadingMessage: "Загрузка предварительного просмотра...",
        previewJsError: "Ошибка JavaScript:",
        previewHtmlError: "Предварительный просмотр HTML с ошибками",
        previewErrorInCode: "Ошибка в HTML коде",
        previewYourCode: "Ваш код показан ниже с ошибками:",
        previewTitle: "Предварительный просмотр HTML",
        previewViewAsDesktop: "Рабочий стол",
        previewViewAsTablet: "Планшет",
        previewViewAsMobile: "Мобильный",
        previewRefreshTooltip: "Обновить предварительный просмотр",
        previewMaximize: "Развернуть",
        previewRestore: "Восстановить",
        previewClose: "Закрыть",
        // Code Styling messages
        codeCopyButton: "Копировать",
        codeCopied: "Скопировано!",
        codeRunButton: "Запустить",
        codeCopyError: "Ошибка",
        codeToggleLineNumbersTitle: "Переключить номера строк",
        codeToggleLineNumbers: "Номера строк",
        thinkingContentNotRestored: 'Содержимое размышлений не удалось восстановить. Это может произойти, если ИИ кратко размышлял перед ответом.',
        codeCopyWithLinesButton: 'Копировать с #',


        // ===== RAG.JS =====

        // Notices
        ragModelNotCompatibleTitle: "Модель несовместима с поиском документов",
        ragModelNotCompatibleMessage: "Модель <strong>{model}</strong> не поддерживает встраивания, которые требуются для поиска документов и функциональности RAG.",
        ragModelSelectCompatible: "Пожалуйста, выберите модель, которая поддерживает встраивания (такие как nomic-embed-text, llama3, mistral или модели mixtral).",
        ragFindEmbeddingModels: "Найти модели с поддержкой встраиваний",
        ragIUnderstand: "Я понимаю",
        ragProcessingDocuments: "Обработка документов...",
        ragProcessingFile: "Обработка файла: {filename}",

        // ===== SECURITYUTILS.JS =====

        securityFinalDeleteWarning: 'ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ: Это навсегда удалит ВСЕ данные из ВСЕХ профилей.\n\n' +
            'Это включает:\n' +
            '• Все беседы и историю чатов\n' +
            '• Все загруженные документы\n' +
            '• Все пользовательские аналитические данные и настройки\n' +
            '• Все настройки и конфигурации моделей\n\n' +
            'Это действие нельзя отменить. Вы абсолютно уверены?',
        securityDeleting: 'Удаление...',
        securityDataDeletedSuccess: 'Все данные были навсегда удалены. Приложение сейчас перезагрузится.',
        securityDeleteError: 'Ошибка при удалении данных. Пожалуйста, попробуйте снова.',
        securityDeletionError: 'Произошла ошибка во время удаления. Пожалуйста, попробуйте снова.',
        securitySetupPasswordTitle: 'Установить защитный пароль',
        securitySetupPasswordMessage: 'Для защиты от случайного удаления, пожалуйста, установите защитный пароль:',
        securityPasswordsNoMatch: 'Пароли не совпадают. Пожалуйста, попробуйте снова.',
        securityPasswordTooShort: 'Пароль должен содержать не менее 6 символов.',
        securityPasswordSetSuccess: 'Защитный пароль был успешно установлен.',
        securityPasswordSetupError: 'Ошибка при установке защитного пароля. Пожалуйста, попробуйте снова.',
        securityVerifyPasswordTitle: 'Введите защитный пароль',
        securityVerifyPasswordMessage: 'Пожалуйста, введите ваш защитный пароль для продолжения удаления:',
        securityIncorrectPassword: 'Неверный пароль. Доступ запрещен.',
        securityVerifyPasswordError: 'Ошибка при проверке пароля. Пожалуйста, попробуйте снова.',
        securitySetPassword: 'Установить пароль',
        securityVerify: 'Проверить',
        securityResetPassword: 'Сбросить пароль',
        cancel: 'Отмена',
        securityEnterCurrentPasswordFirst: 'Пожалуйста, сначала введите ваш текущий пароль',
        securityIncorrectCurrentPassword: 'Неверный текущий пароль. Невозможно сбросить.',
        securityEnterPasswordPlaceholder: "Введите пароль защиты",
        securityConfirmPasswordPlaceholder: "Подтвердите пароль защиты",
        securityShowPassword: "Показать пароль",
        securityHidePassword: "Скрыть пароль",

        // ===== SELECTION.JS =====

        masterkeyRequired: 'Пожалуйста, введите предыдущий или новый мастер-ключ',
        initializing: 'Инициализация...',
        errorStartingConversation: 'Произошла ошибка при запуске беседы. Пожалуйста, попробуйте снова.',

        // ===== VERSION.JS =====
        checkingForUpdates: "Проверка обновлений...",
        updateAvailable: "Доступно обновление",
        newVersionAvailable: "Доступна новая версия Paiperwork!",
        currentVersion: "Текущая версия",
        newVersion: "Новая версия",
        released: "Выпущена",
        whatsNew: "Что нового",
        later: "Позже",
        downloadUpdate: "Скачать обновление",
        upToDate: "У вас актуальная версия",
        runningLatestVersion: "Вы используете последнюю версию Paiperwork",
        ok: "ОК",
        updateCheckFailed: "Проверка обновлений не удалась",
        unableToCheckUpdates: "Не удается проверить обновления.",
        tryAgainLater: "Пожалуйста, попробуйте позже или проверьте вручную на нашем сайте.",


        // ===== SUBJECTIVEINTERACTIONS.JS =====
        generatingInsight: 'Генерация аналитики...',

        // ===== WEBSEARCH.JS =====
        webSearchEmptyQuery: "Пустой поисковый запрос",
        webSearchCancelled: "Операция поиска была отменена",
        webSearchErrorDetails: "Ошибка: {error}. Проверьте консоль для подробностей.",
        webSearchFailed: "Поиск не удался: {error}",

        // Web Search Error Messages (additional keys)
        webSearchErrorOccurred: "Произошла ошибка поиска",
        webSearchErrorSource: "Ошибка",
        webSearchDefaultTitle: "Результат поиска",
        webSearchUnknownSource: "Неизвестный источник",
        webSearchProxyMessage: "Нажмите здесь, чтобы увидеть результаты поиска через наш поисковый прокси.",
        webSearchProxySource: "Поисковый прокси",

        // Web Search
        webSearchEmptyQuery: "Пустой поисковый запрос",
        webSearchCancelled: "Операция поиска была отменена",
        webSearchErrorOccurred: "Произошла ошибка поиска",
        webSearchErrorDetails: "Ошибка: {error}. Проверьте консоль для подробностей.",
        webSearchErrorSource: "Ошибка",
        webSearchFailed: "Поиск не удался: {error}",
        webSearchDefaultTitle: "Результат поиска",
        webSearchUnknownSource: "Неизвестный источник",
        webSearchResultsForQuery: "Результаты поиска для \"{query}\"",
        webSearchProxyMessage: "Нажмите здесь, чтобы увидеть результаты поиска через наш поисковый прокси.",
        webSearchProxySource: "Поисковый прокси",
        webSearchPerformed: "Поиск выполнен",
        webSearchStrategy: "Стратегия поиска",
        webSearchEncounteredIssue: "Поиск столкнулся с проблемой",
        webSearchExtractedContent: "Извлеченное содержимое из лучших результатов",
        webSearchFromRef: "Из [{refId}] {title}",
        webSearchWeatherInfo: "Информация о погоде",
        webSearchResults: "Результаты веб-поиска",
        webSearchSource: "Источник",
        webSearchNoResultsFound: "Результаты не найдены",

    };
    if (typeof window.Lang !== 'undefined') {
        window.Lang.registerLanguage('ru', russianTranslations);
    } else {
        // If Lang isn't available yet, wait for it
        document.addEventListener('DOMContentLoaded', function () {
            if (window.Lang) {
                window.Lang.registerLanguage('ru', russianTranslations);
            }
        });
    }
}