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

        // ===== INDEX.HTML (PT) =====
        indexPageTitle: "Paiperwork - Interface IA Javascript Local",
        mainHeading: "Interface WebUi Javascript Segura para Ollama",
        requirementsHeading: "Requisitos:",
        requirementsText: "deve estar instalado e rodando localmente na porta (padrão) 11434, certifique-se de ter atualizado para a versão mais recente.",
        ollamaLinkText: "Ollama",
        startButtonIndex: "Iniciar",
        languageSelectorLabel: "Idioma:",

        // ===== WELCOME.HTML =====
        welcomePageTitle: "Paiperwork - Bem-vindo",
        masterkeyInputLabel: "Chave Mestre",
        masterkeyInput: "Digite a Chave Mestre...",
        startButton: "Iniciar",
        helpButton: "Ajuda",
        backButton: "← Voltar",
        checkUpdatesButton: "Verificar Atualizações",
        deleteAllButton: "Excluir Todas as Informações",
        logoAltText: "Logo Paiperwork",
        showMasterKey: "Mostrar Chave Mestre",
        hideMasterKey: "Ocultar Chave Mestre",
        securityPasswordUpdatedSuccess: "Senha atualizada com sucesso",

        // ===== GENERATION.HTML =====
        // Generation page UI elements
        backButton: "Voltar",
        newChatButton: "Novo Chat",
        sendButton: "Enviar",
        webButton: "Web",
        enterMessage: "Digite sua mensagem...",
        masterkeyLabel: "Chave Mestre",
        activateThinking: "Ativar Pensamento",
        deactivateThinking: "Desativar Pensamento",
        // Tab buttons
        chatTab: "Chat",
        documentsTab: "Documentos",
        datavizTab: "Visualização de Dados",
        paperworkTab: "Papelada",
        researchTab: "Pesquisa",
        artworkTab: "Design",
        modelsTab: "Modelos",
        databaseTab: "Banco de Dados",

        // Toggle switches
        toggleOn: "LIGADO",
        toggleOff: "DESLIGADO",

        // Chat tab elements
        insightsLabel: "Insights",
        contextSizeLabel: "Tamanho do contexto:",
        contextRemainingLabel: "Contexto restante: ",
        systemPromptLabel: "Prompt do sistema",
        saveButton: "Salvar",
        clearCurrentSession: "Limpar Sessão Atual",
        loadingCalculator: 'Carregando Calculadora...',
        errorLoadingCalculator: 'Falha ao carregar a calculadora. Por favor, tente novamente.',
        checkingLoadedModels: 'Verificando modelos carregados...',
        unloadingModels: 'Descarregando modelos...',
        measuringAvailableMemory: 'Medindo memória disponível...',
        restoringLoadedModels: 'Restaurando modelos carregados...',
        loadingModel: "Carregando modelo...",
        checkingOllama: "Verificando Ollama...",
        loadingConversations: "Carregando conversas...",
        conversationsFound: "conversas encontradas",

        // Page title
        generationPageTitle: "Paiperwork - Geração",

        // Loading messages
        loadingPreviousChats: "Carregando chats anteriores...",
        loadingResearchTools: "Carregando ferramentas de pesquisa...",
        loadingDesignTools: "Carregando ferramentas de design...",
        loadingDatabaseStats: "Carregando estatísticas do banco de dados...",


        // ===== APP.JS =====
        // Tab Loading Messages
        loadingDocumentTools: "Carregando ferramentas de documento...",
        loadingResearchTools: "Carregando ferramentas de pesquisa...",
        loadingDesignTools: "Carregando ferramentas de design...",
        loadingDatabaseStats: "Carregando estatísticas do banco de dados...",

        // Tab Error Messages
        failedLoadDocumentTools: "Falha ao carregar ferramentas de documento",
        failedLoadResearchTools: "Falha ao carregar ferramentas de pesquisa",
        failedLoadDatabaseManagement: "Falha ao carregar Gerenciamento de Banco de Dados",
        failedLoadDataViz: "Erro ao Carregar Visualização de Dados",
        failedLoadArtwork: "Erro ao Carregar Modelos Visuais",
        errorLoadingVisualModels: "Erro ao Carregar Modelos Visuais",

        // Generic Messages
        retryButton: "Tentar Novamente",
        errorOccurred: "Erro: {error}. Por favor, tente novamente.",
        errorTryAgain: "Por favor, tente novamente.",

        // Model Management
        selectModel: "Selecionar um modelo...",
        modelDeleted: "Aviso: O modelo previamente selecionado \"{model}\" foi deletado. Por favor, selecione um novo modelo.",
        selectModelPrompt: "Por favor, selecione um modelo antes de enviar uma mensagem.",
        noModelsFound: "Nenhum modelo encontrado no Ollama. Redirecionando para a aba Modelos para baixar um.",

        // Context and Memory Management
        contextChangeWarning: "Alterar o contexto irá resetar a memória de curto prazo atual. A memória de longo prazo no banco de dados será preservada.",
        systemPromptChangeWarning: "Alterar o prompt do sistema irá resetar a memória de curto prazo atual. A memória de longo prazo no banco de dados será preservada.",
        systemPromptChangeWarningWithContinue: "Alterar o prompt do sistema irá resetar o contexto da conversa. Um botão 'Continuar Conversa' será adicionado para permitir que você continue com o novo prompt do sistema. Prosseguir?",
        contextSizeChangeWarningWithContinue: "Alterar o tamanho do contexto irá resetar o contexto da conversa. Um botão \"Continuar Conversa\" será adicionado para que você possa continuar com o novo tamanho de contexto. Prosseguir?",
        systemPromptPlaceholder: 'Adicione aqui instruções para o modelo se comportar como você gostaria...',

        // Conversation Management  
        deleteConversationConfirm: "Tem certeza de que deseja excluir os dados relacionados a esta Chave Mestre?",
        conversationDeleted: "Dados excluídos com sucesso",
        deleteAllConversationsConfirm: "Tem certeza de que deseja excluir TODAS as conversas? Isso não pode ser desfeito.",
        allConversationsDeleted: "Todas las conversas foram excluídas",
        loadingPreviousMessages: "Carregando mensagens anteriores...",
        chooseModelStart: "Escolha um modelo e digite uma mensagem abaixo para começar.",
        errorLoadingMessages: "Erro ao carregar mensagens anteriores.",

        // Ollama Connection
        ollamaLoadError: "Erro ao carregar modelos do Ollama.",
        ollamaRetryPrompt: "Gostaria de tentar novamente?",
        ollamaContextSizeError: "Erro de comunicação, por favor tente novamente ou reinicie o Ollama.",
        Ollamaerror500: "Erro 500 na resposta do Ollama.",
        ollamaSelectModelPrompt: "Por favor, selecione um modelo antes de enviar uma mensagem.",
        ollamaConnectionError: "Conexão com Ollama falhou. Verifique se o Ollama está rodando e tente novamente.",
        ollamaConversationStart: "Esta conversa continua de {count} mensagens anteriores. As trocas mais recentes são mostradas abaixo.",

        // Copy Functionality
        copied: "Copiado!",
        copyError: "Erro",
        copy: "Copiar",
        copyFullResponse: "Copiar resposta completa",

        // Document System
        documentSystemUnavailable: "Sistema de documentos não disponível.",
        refreshPage: "Por favor, atualize a página e tente novamente.",

        // Generation Control
        generationCancelled: "[Geração cancelada]",
        continueConversation: "Continuar Conversa",
        ollamaContinueButton: "Continuar Conversa",
        ollamaContinueProcessing: "Processando...",
        ollamaContinuationError: "Falha ao continuar conversa. Por favor, tente novamente.",
        ollamaContinuingMessage: "Continuando conversa...",

        // Context Limit
        contextLimitReachedTitle: "Limite de Contexto da Conversa",
        contextLimitReachedMessage: "Sua conversa atingiu o limite de contexto. Adicionei um botão Continuar Conversa abaixo para que você possa continuar conversando sem perder o fluxo, e também resetei seu contexto para 100% novamente, apenas clique nele para continuar de onde paramos.",
        ollamaContextRemaining: "Contexto restante: {percent}%",
        ollamaContextReset: "Contexto restante: 100%",

        // Message Management
        deleteMessagePair: "Excluir este par de mensagens",
        deleteMessagePairConfirm: "Excluir este par de mensagens? Isso não pode ser desfeito.",
        regenerateMessage: "Regenerar",
        regenerateMessageError: "Erro ao regenerar mensagem. Por favor, tente novamente.",

        // Chat Initialization
        errorSendingMessage: "Erro ao enviar mensagem. Por favor, tente novamente.",
        errorChatNotInitialized: "Sistema de chat não inicializado corretamente. Por favor, atualize a página.",
        clickContinueFirst: "Clique em \"Continuar Conversa\" ou digite uma nova mensagem.",

        // Export Functionality
        exportConversation: "Exportar Conversa",
        exportDescription: "Escolha seu formato de exportação preferido:",
        exportError: "Exportação Falhou",
        exportSummary: "Resumo da Exportação",
        chooseExportFormat: "Escolha seu formato de exportação preferido:",
        errorExportingConversation: "Erro ao exportar conversa: funcionalidade não disponível",
        exportFunctionNotAvailable: "Funcionalidade de exportação não disponível",
        exportSuccess: "Exportação Bem-sucedida",
        conversationDownloaded: "Conversa baixada como",
        plainTextFormat: "Texto Simples (.txt)",
        plainTextDescription: "Simples, compatível com todos os editores de texto",
        markdownFormat: "Markdown (.md)",
        markdownDescription: "Preserva formatação, blocos de código e links",
        htmlFormat: "HTML (.html)",
        htmlDescription: "Formatação completa com estilo apropriado",
        cancel: "Cancelar",
        close: "Fechar",
        save: "Salvar",
        // ===== CHATTAB.JS =====
        // Context Management
        kvcacheLabel: "Meu cache KV é Q8_0 (usa menos RAM)",
        calculateOptimalButton: "Calcular Ótimo",
        resetToDefaultButton: "Redefinir para Padrão",
        calculatingContext: "Calculando...",
        gettingSystemInfo: "Obtendo informações do sistema...",
        unloadingModel: "Descarregando modelo...",
        reloadingModel: "Recarregando modelo...",
        resetting: "Redefinindo...",
        clickToShowMasterKey: "Clique para mostrar/ocultar chave mestre",

        // Insights Management  
        editInsightsButton: "Editar insights",
        saving: "Salvando...",
        errorSaving: "Erro ao Salvar",

        // Session Management
        loadingConversations: "Carregando conversas...",
        loadingConversationsProgress: "Carregando {current}/{total} conversas...",
        noPreviousConversations: "Nenhuma conversa anterior",
        errorLoadingConversations: "Erro ao carregar conversas",
        noMessagesFound: "Nenhuma mensagem encontrada para esta conversa",
        deleteSession: "Excluir esta conversa",
        newChat: "Nova Conversa",
        confirmDeleteGroup: "Tem certeza de que deseja excluir esta conversa?",
        deletingMessagePair: 'Excluindo Par de Mensagens',
        preparingDeletion: 'Preparando exclusão...',
        deletingFromDatabase: 'Excluindo do banco de dados...',
        removingFromInterface: 'Removendo da interface...',
        refreshingConversationList: 'Atualizando lista de conversas...',
        deletionCompleted: 'Exclusão concluída com sucesso!',
        deletionSuccessful: 'Exclusão Bem-sucedida',
        deletionFailed: 'Falha na exclusão',
        deletionError: 'Erro de Exclusão',

        // Session Display
        sessionToday: "Hoje às {time}",
        sessionYesterday: "Ontem às {time}",
        sessionDate: "{date} às {time}",

        // Welcome Messages
        welcomeNewConversation: "Bem-vindo à sua nova conversa!",
        selectModelAndStart: "Selecione um modelo e comece a digitar",

        // Image Upload (Visual Models)
        addImage: "Adicionar Imagem",
        dragMultipleImages: "Você pode adicionar múltiplas imagens",
        clickOrDragImage: "Clique para carregar ou arraste imagens aqui",
        multipleImagesSupported: "Múltiplas imagens suportadas",
        imagesSelected: "imagens selecionadas",
        clearAllImages: "Limpar Tudo",
        insertImage: "Inserir Imagem",
        noImagesSelected: "Por favor, selecione pelo menos uma imagem",
        imageDataInvalid: "Dados da imagem são inválidos. Por favor, tente carregar novamente.",
        onlyImagesAllowed: "Apenas arquivos de imagem são permitidos",
        imageTooLarge: "Imagem muito grande (máx. 5MB)",
        clickOrDragMultipleImages: "Clique para carregar ou arraste imagens aqui",
        clickOrDragSingleImage: "Clique para carregar ou arraste uma imagem aqui",
        singleImageOnly: "Este modelo suporta apenas uma imagem por vez",
        gemma3MultiImageHint: "Gemma3: Você pode adicionar múltiplas imagens",

        // Document Questioning Mode
        documentQuestioningMode: "Modo de Questionamento de Documento",
        exitDocumentMode: "Sair do Modo Documento",
        ragDocumentModeLabel: "Modo Documento",
        ragPromptDefault: "Digite sua mensagem...",

        // Extras
        selectModelFirst: "Por favor, selecione um modelo primeiro",
        calculating: "Calculando...",
        gettingSystemInfo: "Obtendo informações do sistema...",
        calculated: "(Calculado)",
        unloadingModel: "Descarregando modelo...",
        reloadingModel: "Recarregando modelo...",
        contextCalculationComplete: "Cálculo de contexto concluído!\n\nRAM disponível: {availableRAM} GB\nTipo de cache KV: {kvCacheType}\nContexto máximo recomendado: {maxContext}",
        errorCalculatingContext: "Erro ao calcular contexto: {error}",
        calculateOptimal: "Calcular Ótimo",
        gettingModelInfo: "Obtendo informações do modelo...",
        resetToDefault: "Redefinir para Padrão",
        confirmResetContext: "Redefinir tamanho do contexto para \"{model}\" para o padrão do modelo ({contextSize})?\n\nIsto irá:\n• Excluir o tamanho de contexto otimizado específico do modelo\n• Definir contexto para {tokens} tokens (tamanho nativo do modelo)\n• Redefinir seletor de cache KV para FP16 (não é sua configuração kvcache atual no Ollama, apenas o seletor para o cálculo)\n\nVocê pode recalcular ou ajustar manualmente depois.",
        resetting: "Redefinindo...",
        noMasterKeyFound: "Nenhuma chave mestre encontrada",
        contextResetSuccess: "Tamanho do contexto redefinido com sucesso!\n\nModelo: {model}\nTamanho do contexto: {contextSize} tokens (tamanho nativo do modelo)\nCache KV: FP16 (padrão)\n\nO modelo agora usará seu tamanho de contexto nativo. Você pode:\n• Clicar em \"Calcular Ótimo\" para obter um tamanho otimizado para RAM\n• Selecionar manualmente um tamanho diferente no menu suspenso",
        errorResettingContext: "Erro ao redefinir contexto: {error}",
        editUserInsights: "Editar Insights do Usuário",
        noInsightsStored: "Nenhum insight armazenado ainda.",
        addNewInsight: "Adicionar Novo Insight",
        enterNewInsight: "Digite novo insight...",
        saveChanges: "Salvar Alterações",
        saving: "Salvando...",
        errorSaving: "Erro ao Salvar",
        noMessagesFound: "Nenhuma mensagem encontrada",
        regenerationError: "Erro ao regenerar mensagem. Por favor, tente novamente.",

        // ===== CHAT.JS =====
        // System Prompt Management
        systemPromptSaved: "Prompt do sistema salvo",
        errorSavingSystemPrompt: "Erro ao salvar prompt do sistema",
        contextResetNote: "O contexto foi redefinido devido à mudança do prompt do sistema",

        // Button States
        cancelButton: "Cancelar",
        sendButton: "Enviar",

        // Visual Model Errors
        visualModelError: "Erro do Modelo Visual",
        visualModelMissingComponents: "Este modelo parece estar faltando os componentes necessários para processar imagens.",
        visualModelTryDifferent: "Tente usar um modelo visual diferente do seletor de modelos",
        visualModelEnsureConverted: "Se estiver usando um modelo personalizado, certifique-se de que foi convertido adequadamente com capacidades visuais",
        visualModelNotSupported: "Este modelo não suporta processamento de imagens corretamente.",
        visualModelSelectDifferent: "Tente selecionar um modelo visual diferente",
        visualModelImproperlyQuantized: "O modelo pode ter sido quantizado inadequadamente",
        visualModelProperlyBuilt: "Verifique se está usando uma versão adequadamente construída do modelo visual",

        // DataViz Error Messages 
        datavizSelectChartPrompt: "Por favor, selecione um tipo de visualização (Gráfico de Pizza, Gráfico de Barras ou Gráfico de Linha) antes de prosseguir.",
        datavizOkSelect: "OK, vou selecionar um",
        datavizError: "Erro ao criar visualização",
        datavizNoData: "Nenhuma descrição de dados",
        datavizOk: "OK",

        // Web Search Enhancement
        webSearchTitle: "Aprimoramento de Busca Web",
        searchQueryTitle: "Consulta de busca",
        webSearchPerformed: "Busca web realizada",
        searchQuery: "Consulta de busca",
        searchQueryOptimizerPrompt: "Gere uma consulta de busca concisa para busca web baseada no contexto fornecido",

        // Generation Control
        cancelled: "cancelado",
        generationCancelled: "[Geração cancelada]",
        continuationFromPrevious: "Continuação da conversa anterior...",

        // RAG Integration
        ragNoRelevantContent: "Não consegui encontrar informações relevantes no documento selecionado para sua pergunta. Por favor, tente reformular sua pergunta ou selecione um documento diferente.",

        // Message Management
        deleteMessagePairError: "Erro ao excluir par de mensagens. Por favor, tente novamente.",

        // Web Search Enhancement
        webSearchInfo: "🌐 Aprimoramento de Busca Web",
        webSearchTransition: "🔍 Expandindo com informações de busca web...",
        webSearchError: "Erro ao usar busca web: {error}. Por favor, tente novamente.",
        documentInfo: "📄 Informações do documento",

        // Extras
        visualModelError: "Erro do Modelo Visual:",
        visualModelErrorDetails: "Este modelo não suporta processamento de imagens corretamente.",
        tryDifferentVisualModel: "Tente selecionar um modelo visual diferente",
        modelImproperlyQuantized: "O modelo pode ter sido quantizado inadequadamente",
        checkProperVisualModel: "Verifique se está usando uma versão adequadamente construída do modelo visual",
        generationCancelledBeforeStart: "Geração cancelada antes de começar. Por favor, tente novamente.",

        // ===== DATABASETAB.JS ===== 

        // Main UI Elements
        databaseManagementTitle: "Gestão da Base de Dados",
        databaseManagementDesc: "Monitore e gerencie sua base de dados local para garantir desempenho ideal.",
        loadingDatabaseStats: "Carregando estatísticas da base de dados...",

        // Action Buttons
        refreshStats: "Atualizar Estatísticas",
        cleanupOrphaned: "Limpar Dados Órfãos",
        optimizeDatabase: "Limpar Base de Dados",

        // Information Section
        aboutDatabaseTitle: "Sobre a Sua Base de Dados",
        aboutDatabaseDesc: "O Paiperwork armazena todos os seus dados localmente numa base de dados SQLite segura no seu navegador. Os seus dados nunca saem do seu dispositivo a menos que os exporte explicitamente.",
        storageMethod: "Método de Armazenamento",
        encryptionStatus: "Encriptação",
        enabled: "Ativada",

        // Statistics Display
        databaseStats: "Estatísticas da Base de Dados",
        databaseSize: "Tamanho da Base de Dados",
        documents: "Documentos",
        totalChunks: "Total de Fragmentos",
        orphanedChunks: "Fragmentos Órfãos",
        databaseHealth: "Saúde da Base de Dados",

        // Health Messages
        orphanedChunksFound: "Encontrados {count} fragmentos órfãos que não estão associados a nenhum documento. Estes podem ser restos de documentos eliminados e estão a ocupar espaço desnecessário.",

        // Success Messages
        orphanedChunksRemoved: "Removidos com sucesso {count} fragmentos órfãos.",
        databaseSizeReduced: "Tamanho da base de dados reduzido em {size}.",
        databaseOptimized: "Base de dados otimizada com sucesso. Poupou {size}.",

        // Error Messages
        databaseOptimizeFailed: "A otimização da base de dados falhou.",
        cleanupFailed: "Limpeza Falhada",
        tryAgain: "Tentar Novamente",
        databaseError: "Ocorreu um erro ao otimizar a base de dados.",
        databaseNotAvailable: "Base de dados não disponível",

        // ===== DOCUMENTS_TAB.JS =====

        // Document Search Info Banner
        documentSearchEnabled: "Pesquisa de Documentos Ativada",
        documentSearchInfo: "Nesta aba, o prompt principal irá pesquisar em todos os seus documentos e fornecer informações.",
        documentSpecificInfo: "Se você selecionar um documento específico para questionamento, ele terá prioridade.",

        // File Processing & Validation
        ragPreprocessingFiles: "Verificando arquivos quanto ao conteúdo de texto...",
        ragCheckingFile: "Verificando {filename} quanto ao conteúdo de texto...",
        ragEmptyPdfSingle: "O arquivo \"{filename}\" parece não conter texto extraível (possivelmente apenas imagens). Não pode ser processado.",
        ragEmptyPdfMultiple: "{count} arquivos não contêm texto extraível (possivelmente apenas imagens) e não podem ser processados.",
        ragPdfCheckError: "Erro ao verificar conteúdo do PDF",

        // Processing States
        ragProcessingStatus: "Processando...",
        ragProcessingPaused: "Processamento de documentos pausado até que a IA termine a conversa atual",

        // Search Functionality
        searchingDocuments: "Pesquisando em todos os seus documentos...",
        noDocumentResults: "Nenhuma informação relevante encontrada em seus documentos.",
        aiAnalysis: "Análise de IA",
        documentSearchError: "Erro ao pesquisar documentos:",

        // Document Global Search
        documentGlobalSearch: "Pesquisa Global de Documentos",
        documentGlobalSearchDescription: "Pesquisar em todos os seus documentos de uma vez",
        documentSpecificMode: "Modo Documento Específico",
        documentSpecificDescription: "Fazendo perguntas sobre um documento específico",
        documentSearchProcessing: "Processando sua pesquisa de documentos...",
        documentNoDocumentsFound: "Você ainda não tem documentos carregados. Carregue documentos primeiro para usar este recurso.",

        // Document Mode UI
        ragDocumentModePriority: "Isto terá prioridade mesmo quando na aba Documentos.",
        ragReturnToChat: "Retornado ao modo de chat regular",
        ragEnableError: "Erro ao ativar modo de questionamento de documentos",
        ragDocumentModeAsking: "Perguntando: \"{document}\"",

        // Summary Management
        resetSummary: "Redefinir resumo",
        restorePartialSummaries: "Restaurar resumos parciais",
        partialSummariesNotice: "Resumo estendido.",
        editableContent: "Este resumo é totalmente editável. Faça alterações conforme necessário antes de exportar ou salvar.",

        // Document Metadata Display
        ragDocumentSectionAuthor: "Autor: {author}",
        ragDocumentSectionAdded: "Adicionado: {date}",
        ragDocumentSectionPages: "Páginas: {count}",
        ragDocumentSectionChunks: "Blocos: {count}",
        ragDocumentSectionDelete: "Excluir",
        ragDocumentSectionProcessing: "Processando",
        ragDocumentSectionIndexed: "Indexado",
        ragDocumentSectionUntitled: "Sem título",

        // Error Handling
        ragDisplayError: "Erro ao exibir documentos: {error}",
        ragLoadingError: "Erro ao carregar documentos: {error}",
        ragDeleteFailed: "Falha ao excluir documento. Tente novamente.",

        // Search Results
        ragQuickSearch: "Pesquisa Rápida",
        ragQuickSearchPlaceholder: "Encontrar documentos contendo...",
        ragAskAboutThis: "Perguntar sobre isto",
        ragTopResults: "Melhores resultados para \"{query}\"",
        ragNoResults: "Nenhum documento correspondente encontrado",
        ragSearchPlaceholder: "Pesquisa rápida...",
        ragSearchButton: "Pesquisar",
        ragSearchClearButton: "Limpar Pesquisa",
        ragSearching: "Pesquisando documentos...",
        ragSearchError: "Erro de pesquisa: {error}",
        ragSearchNoResults: "Nenhum documento encontrado correspondendo a \"{query}\"",
        ragSearchResults: "Encontrados {count} resultados para \"{query}\"",

        // RAG Utils messages
        ragModelSelect: "Por favor, selecione um modelo antes de carregar documentos.",
        ragFileType: "Por favor, carregue apenas arquivos PDF ou TXT.",
        ragProcessing: "Processando...",
        ragDocumentsProcessed: "Documentos processados com sucesso!",
        ragProcessingError: "Erro ao processar documentos. Tente novamente.",
        ragLoadingDocuments: "Carregando lista de documentos...",
        ragErrorStorage: "Erro ao acessar armazenamento de documentos",
        ragNoDocuments: "Nenhum documento encontrado",
        ragUploadPrompt: "Carregue documentos usando a área acima",
        ragLoadingError: "Erro ao carregar documentos: {error}",
        ragDisplayError: "Erro ao exibir documentos: {error}",
        ragDeleteConfirm: "Tem certeza de que deseja excluir este documento? Isto não pode ser desfeito.",
        ragDeleting: "Excluindo...",
        ragDeleteSuccess: "Documento excluído com sucesso",
        ragDeleteError: "Falha ao excluir documento. Tente novamente.",
        ragSearchingDocuments: "Pesquisando documentos...",
        ragDragDropText: "Arraste e Solte arquivos PDF ou de Texto",
        ragBrowseText: "ou procurar arquivos",
        ragDocumentSelected: "📄 Documento selecionado",
        ragDeselectButton: "Desselecionar",
        ragGenerateSummary: "Gerar Resumo",
        ragAskQuestions: "Fazer Perguntas",
        ragDocumentModeEnabled: "Modo Documento Ativado",
        ragSearchClearButton: "Limpar Pesquisa",
        ragSearching: "Pesquisando documentos...",
        ragCopyResult: "Copiar",
        ragCopied: "Copiado!",
        ragCopyError: "Erro",
        ragClearSearch: "Limpar Pesquisa",

        // Document Summary translations
        ragSummaryGenerating: "Um resumo já está sendo gerado. Aguarde até que seja concluído.",
        ragSummaryTitle: "Resumo de \"{title}\"",
        ragSummaryPreparing: "Preparando documento para resumo...",
        ragSummaryCancelConfirm: "Tem certeza de que deseja cancelar a geração do resumo?",
        ragSummaryContinuing: "A geração do resumo está continuando.",
        ragSummaryNoContent: "Nenhum conteúdo de documento encontrado para resumir.",
        ragSummarySections: "Encontradas {count} seções do documento",
        ragSummaryProcessing: "Processando documento ({size}KB)",
        ragSummaryGenerating: "Gerando resumo do documento...",
        ragSummaryProcessingParts: "Processando documento em {total} partes sequencialmente...",
        ragSummaryPart: "Resumindo parte {current} de {total}...",
        ragSummaryFinalizing: "Finalizando resumo...",
        ragSummaryComplete: "Resumo concluído",
        ragSummaryTokens: "Resumo concluído. Usa aproximadamente {tokens} tokens ({percent}% do contexto).",
        ragSummaryCancelledByUser: "A geração do resumo foi cancelada pelo usuário.",
        ragSummaryError: "Erro ao gerar resumo: {error}",
        ragSummaryCopy: "Copiar Resumo",
        ragSummaryCopied: "Copiado!",
        ragSummaryCancel: "Cancelar Geração",

        // Document Mode translations
        ragDocumentModeError: "Erro ao ativar modo de questionamento de documentos",
        ragDocumentModeExit: "Sair do Modo Documento",
        ragDocumentModeAsking: "Perguntando: \"{document}\"",

        // Document Sections translations
        ragDocumentSectionAuthor: "Autor: {author}",
        ragDocumentSectionAdded: "Adicionado: {date}",
        ragDocumentSectionPages: "Páginas: {count}",
        ragDocumentSectionChunks: "Blocos: {count}",
        ragDocumentSectionDelete: "Excluir",
        ragDocumentSectionProcessing: "Processando",
        ragDocumentSectionIndexed: "Indexado",
        ragDocumentSectionUntitled: "Sem título",

        // Document UI translations
        ragDragDropText: "Arraste e Solte arquivos PDF ou de Texto",
        ragBrowseFiles: "ou procurar arquivos",
        ragProcessingStatus: "Processando...",
        ragSearchPlaceholder: "Pesquisa rápida...",
        ragSearchButton: "Pesquisar",
        ragDeleteFailed: "Falha ao excluir documento. Tente novamente.",
        ragDeleteError: "Erro ao excluir documento: {error}",
        ragDocumentSectionDelete: "Excluir",
        ragDisplayError: "Erro ao exibir documentos: {error}",
        ragLoadingError: "Erro ao carregar documentos: {error}",
        ragDocumentSelected: "📄 Documento selecionado",
        ragDocumentDeselect: "Desselecionar",
        ragDocumentGenerateSummary: "Gerar Resumo",
        ragDocumentAskQuestions: "Fazer Perguntas",
        ragDocumentModePlaceholder: "Perguntar sobre \"{document}\"...",
        ragDocumentAskQuestions: "Fazer Perguntas",
        ragSummaryCancelled: "Geração cancelada",
        ragSummaryPartialWarning: "A geração do resumo foi cancelada. O resumo parcial acima pode estar incompleto.",
        ragSummaryCancelledByUser: "A geração do resumo foi cancelada pelo usuário.",
        ragSummaryCancelConfirm: "Cancelar geração do resumo?",
        ragSummaryContinuing: "A geração do resumo está continuando.",
        ragSummaryNoContent: "Nenhum conteúdo de documento encontrado para resumir.",
        ragSummaryProcessing: "Processando...",
        ragSummaryGenerating: "Gerando resumo do documento...",
        ragSummaryBatches: "Processando documento em {total} partes sequencialmente...",
        ragSummaryPart: "Resumindo parte {current} de {total}...",
        ragSummaryFinalizing: "Finalizando resumo...",
        ragSummaryCreatingFinal: "Criando resumo final...",
        ragSectionBreak: "--- Quebra de Seção ---",
        ragSummaryFinalTitle: "Resumo completo de \"{title}\"",
        ragSummaryTokenCount: "Resumo concluído. Usa aproximadamente {tokens} tokens ({percent}% do contexto).",
        ragSummaryError: "Erro ao gerar resumo: {error}",

        //TOC
        tocTitle: "Índice",

        // ===== DATAVIZTAB.JS ===== (Elementos de interface para a aba)
        // Elementos principais da interface
        datavizTitle: "Visualização de Dados",
        datavizDescription: "Selecione um tipo de gráfico ou diagrama para visualizar seus dados",

        // Rótulos dos tipos de gráfico
        datavizPieChart: "Gráfico de Pizza",
        datavizBarChart: "Gráfico de Barras",
        datavizLineChart: "Gráfico de Linhas",
        datavizScatterPlot: "Gráfico de Dispersão",
        datavizAreaChart: "Gráfico de Área",
        datavizRadarChart: "Gráfico Radar",
        datavizHeatMap: "Mapa de Calor",
        datavizBubbleChart: "Gráfico de Bolhas",

        // Mensagens de erro
        datavizNotInitialized: "Erro: Recurso de visualização não está inicializado adequadamente",
        datavizNoChartType: "Tipo de Gráfico Não Selecionado",

        // Mensagens de status
        datavizModeActive: "Modo DataViz ativo",
        datavizModeDeactivated: "Modo DataViz desativado",
        datavizSelectionDeselected: "Visualização desmarcada",
        datavizConfigurationOptions: "Opções de configuração para {chartType} serão adicionadas aqui.",

        // Marcadores de prompt
        datavizPromptPlaceholder: "Pergunte sobre criar um {chartType}...",
        datavizDefaultPrompt: "Digite sua mensagem aqui...",
        datavizEnterData: "Por favor, insira uma descrição dos dados que você deseja visualizar.",

        // ===== DATAVIZ.JS ===== 
        // Estados de geração
        datavizGenerating: "Gerando {chartType}...",
        datavizCancel: "Cancelar",
        datavizGenerationCancelled: "Geração Cancelada",
        datavizCancelledMessage: "A geração do gráfico foi cancelada.",
        datavizCancelledByUser: "A geração do gráfico foi cancelada pelo usuário.",

        // Mensagens de erro
        datavizErrorCreating: "Erro ao Criar Visualização",
        datavizErrorMessage: "Isso pode acontecer quando a resposta da IA não está formatada adequadamente.",
        datavizErrorSuggestion: "Por favor, tente reformular sua solicitação ou tente um tipo de gráfico diferente.",

        // Erros específicos de gráficos
        datavizErrorBarChart: "Erro ao Criar Gráfico de Barras",
        datavizErrorLineChart: "Erro ao Criar Gráfico de Linhas",
        datavizErrorScatterPlot: "Erro ao Criar Gráfico de Dispersão",
        datavizErrorAreaChart: "Erro ao Criar Gráfico de Área",
        datavizErrorRadarChart: "Erro ao Criar Gráfico Radar",
        datavizErrorHeatMap: "Erro ao Criar Mapa de Calor",
        datavizErrorBubbleChart: "Erro ao Criar Gráfico de Bolhas",

        // Erros de validação de dados
        datavizErrorInvalidData: "Estrutura de dados inválida: {errorType}",
        datavizErrorMissingData: "array de dados ou séries está ausente.",
        datavizErrorEmptyData: "array de séries está ausente ou vazio.",
        datavizErrorMinimumCategories: "Gráficos radar requerem pelo menos 3 categorias e 1 série de dados.",
        datavizErrorDimensionMismatch: "As dimensões do array de dados devem corresponder aos arrays xLabels e yLabels.",

        // Elementos de interface e rótulos dos gráficos
        datavizValueScale: "Escala de Valores",
        datavizPercentageAreaChart: "Gráfico de Área Percentual",
        datavizStackedAreaChart: "Gráfico de Área Empilhada",
        datavizRefreshTooltip: "Atualizar Pré-visualização",
        datavizMaximize: "Maximizar",
        datavizRestore: "Restaurar",
        datavizClose: "Fechar",

        // Interação com gráficos
        datavizHoverTooltip: "Passe o mouse para detalhes",
        datavizClickForDetails: "Clique para detalhes",

        // Extras
        datavizFloatingWindowTitle: "Visualização de Dados",
        datavizMaximizeTooltip: "Maximizar",
        datavizRestoreTooltip: "Restaurar",
        datavizCloseTooltip: "Fechar",
        datavizLoadingMessage: "Carregando...",
        datavizChartGeneration: "Geração de gráfico",
        datavizWasCancelled: "foi cancelada",
        datavizChartGenerationCancelled: "Geração de Gráfico Cancelada",
        datavizGeneratingChart: "Gerando Gráfico",
        datavizAnalyzingData: "Analisando seus dados e criando visualização...",
        datavizExportPNG: "Exportar PNG",
        datavizChartView: "Visualização do Gráfico",
        datavizExportChartImage: "Exportar Gráfico como Imagem",
        datavizExportRestriction: "Devido às restrições de segurança do navegador, não podemos baixar automaticamente este gráfico como imagem.",
        datavizExportMethods: "Por favor, use um destes métodos em vez disso:",
        datavizExportScreenshot: "Tire uma captura de tela do gráfico (recomendado)",
        datavizExportMac: "Mac: Command + Shift + 4, depois selecione a área",
        datavizExportWindows: "Windows: Windows + Shift + S, depois selecione a área",
        datavizExportRightClick: "Clique com o botão direito no gráfico e selecione \"Salvar imagem como...\" (navegadores que suportam)",
        datavizExportUnderstand: "Eu entendo",
        datavizGeneratingImage: "Gerando imagem...",
        datavizChart: "Gráfico",
        datavizErrorRequiredRadar: "Gráficos radar requerem pelo menos 3 categorias e 1 série de dados.",
        datavizErrorRequiredHeatMap: "Mapas de calor requerem arrays xLabels, yLabels e data.",
        datavizErrorRequiredBubble: "array de séries está ausente ou vazio.",
        datavizXValues: "Valores X",
        datavizYValues: "Valores Y",
        datavizSeries: "Séries",
        datavizDataSeries: "Séries de Dados",
        datavizDataPoints: "Pontos de Dados",
        datavizCombinedData: "Dados Combinados",
        datavizValue: "Valor",

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

        // ===== PAPERWORKTAB.JS ===== 
        // Main tab content
        paperworkTabTitle: "Criação de Documentos",
        paperworkTabDescription: "Crie relatórios e documentos profissionais baseados nos dados das suas conversas.",

        // Template grid items
        paperworkTemplateMeetingMinutes: "Ata de Reunião",
        paperworkTemplateMeetingMinutesDesc: "Criar atas de reunião estruturadas e profissionais",
        paperworkTemplateBusinessLetter: "Carta Comercial",
        paperworkTemplateBusinessLetterDesc: "Gerar uma carta comercial profissional",
        paperworkTemplateTechnicalReport: "Relatório Técnico",
        paperworkTemplateTechnicalReportDesc: "Criar um relatório técnico detalhado com seções e imagens",
        paperworkTemplateContract: "Contrato",
        paperworkTemplateContractDesc: "Criar um documento de contrato legal",
        paperworkTemplateProposal: "Proposta",
        paperworkTemplateProposalDesc: "Gerar uma proposta convincente",
        paperworkTemplateMemo: "Memorando",
        paperworkTemplateMemoDesc: "Criar um memorando empresarial profissional",

        // Error messages
        paperworkManagerNotInitialized: "PaperworkTab: paperworkManager não inicializado",
        paperworkUIHelpersNotAvailable: "PaperworkTab: uiHelpers não disponível através do paperworkManager",
        paperworkElementNotFound: "PaperworkTab: Não foi possível encontrar o elemento da aba paperwork",

        // Console messages
        paperworkInitializing: "PaperworkTab: Inicializando interface da aba paperwork",
        paperworkTemplateSelected: "PaperworkTab: Tipo de modelo selecionado: {templateType}",

        // Dashboard section (from CSS comments)
        paperworkDashboardTitle: "Painel de Documentos",
        paperworkToolGroupTitle: "Grupo de Ferramentas",

        // Document template types (for UI display)
        paperworkBusinessLetter: "Carta Comercial",
        paperworkContract: "Contrato",
        paperworkProposal: "Proposta",
        paperworkMemo: "Memorando",
        paperworkMeetingMinutes: "Ata de Reunião",
        paperworkTechnicalReport: "Relatório Técnico",

        // Form field labels (these would appear in document generation forms)
        paperworkRecipientName: "Nome do Destinatário",
        paperworkRecipientAddress: "Endereço do Destinatário",
        paperworkSenderName: "Nome do Remetente",
        paperworkSenderAddress: "Endereço do Remetente",
        paperworkDate: "Data",
        paperworkSubject: "Assunto",
        paperworkMessage: "Mensagem",
        paperworkSignature: "Assinatura",

        // Contract fields
        paperworkPartyOne: "Primeira Parte",
        paperworkPartyTwo: "Segunda Parte",
        paperworkContractTerms: "Termos do Contrato",
        paperworkEffectiveDate: "Data de Vigência",
        paperworkExpirationDate: "Data de Expiração",

        // Proposal fields
        paperworkProjectTitle: "Título do Projeto",
        paperworkClientName: "Nome do Cliente",
        paperworkProposalSummary: "Resumo da Proposta",
        paperworkDeliverables: "Entregáveis",
        paperworkTimeline: "Cronograma",
        paperworkBudget: "Orçamento",

        // Memo fields
        paperworkMemoTo: "Para",
        paperworkMemoFrom: "De",
        paperworkMemoDate: "Data",
        paperworkMemoRe: "Ref.",
        paperworkMemoBody: "Corpo do Memorando",

        // Meeting minutes fields
        paperworkMeetingDate: "Data da Reunião",
        paperworkMeetingTime: "Hora da Reunião",
        paperworkAttendees: "Participantes",
        paperworkAgenda: "Agenda",
        paperworkDiscussion: "Pontos de Discussão",
        paperworkActionItems: "Itens de Ação",
        paperworkNextSteps: "Próximos Passos",

        // Button labels
        paperworkGenerate: "Gerar Documento",
        paperworkPreview: "Visualizar",
        paperworkDownload: "Baixar",
        paperworkEdit: "Editar",
        paperworkSave: "Salvar",
        paperworkCancel: "Cancelar",
        paperworkClose: "Fechar",

        // Status messages
        paperworkGenerating: "Gerando documento...",
        paperworkGenerationComplete: "Documento gerado com sucesso",
        paperworkGenerationError: "Erro ao gerar documento",
        paperworkSaved: "Documento salvo",
        paperworkSaveError: "Erro ao salvar documento",

        // Template designer
        paperworkTemplateDesigner: "Designer de Modelos",
        paperworkAddSection: "Adicionar Seção",
        paperworkDeleteSection: "Excluir Seção",
        paperworkMoveUp: "Mover para Cima",
        paperworkMoveDown: "Mover para Baixo",
        paperworkSectionTitle: "Título da Seção",
        paperworkSectionContent: "Conteúdo da Seção",

        // Document preview
        paperworkDocumentPreview: "Visualização do Documento",
        paperworkPrintView: "Visualização de Impressão",
        paperworkFullscreen: "Tela Cheia",
        paperworkExitFullscreen: "Sair da Tela Cheia",

        // ===== PAPERWORK.JS - Paperwork Class =====
        // Console/Debug Messages
        paperworkInitializing: "Paperwork: Inicializando gerenciador de documentos",
        paperworkShowingTemplates: "Paperwork: Mostrando modelos de documentos",
        paperworkTabNotAvailable: "Paperwork: Instância PaperworkTab não disponível",

        // UI Component Labels
        paperworkFloatingWindowHeader: "Cabeçalho da Janela Flutuante",
        paperworkFloatingWindowTitle: "Título da Janela",
        paperworkFloatingWindowClose: "Fechar Janela",
        paperworkFloatingWindow: "Janela Flutuante",
        paperworkFloatingWindowFooter: "Rodapé da Janela",
        paperworkFloatingWindowContent: "Conteúdo da Janela",
        paperworkBackdrop: "Fundo",

        // Form Elements
        paperworkFormGroup: "Grupo de Formulário",
        paperworkLabel: "Rótulo",
        paperworkInput: "Campo de Entrada",
        paperworkTextarea: "Área de Texto",
        paperworkSelect: "Campo de Seleção",

        // Buttons
        paperworkBtn: "Botão",
        paperworkBtnPrimary: "Botão Primário",
        paperworkBtnSecondary: "Botão Secundário",

        // Document Preview and Editor (keep existing)
        paperworkDocumentPreview: "Visualização do Documento",
        paperworkDocumentEditor: "Editor de Documentos",
        paperworkForm: "Formulário",

        // Template Grid (keep existing)
        paperworkTemplateGrid: "Grade de Modelos",
        paperworkTemplateItem: "Item de Modelo",
        paperworkTemplateIcon: "Ícone do Modelo",
        paperworkTemplateTitle: "Título do Modelo",

        // ===== PAPERWORK.JS - UIHelpers Class =====
        // Document Editor Titles
        paperworkBusinessLetterTitle: "Carta Comercial",
        paperworkContractTitle: "Contrato",
        paperworkProposalTitle: "Proposta Comercial",
        paperworkMemoTitle: "Memorando",
        paperworkMeetingMinutesTitle: "Ata de Reunião",
        paperworkDocumentEditorTitle: "Editor de Documentos",

        // Button Labels
        paperworkNewButton: "Novo",
        paperworkGenerateDocumentButton: "Gerar Documento",
        paperworkCancelButton: "Cancelar",

        // AI Service Messages
        paperworkAIModelNotSelected: "Por favor, selecione um modelo de IA na aba Chat antes de usar os recursos de aprimoramento de documentos.",
        paperworkAIServiceFailed: "Falha ao conectar ao serviço de IA. Por favor, verifique se o Ollama está executando e tente novamente.",
        paperworkAINoReply: "IA falhou ao responder",

        // Template Designer
        paperworkCreateTechnicalReportTitle: "Criar Relatório Técnico",
        paperworkReportNameLabel: "Nome do Relatório",
        paperworkReportNamePlaceholder: "Relatório de Status de Engenharia, Relatório de Bug, etc.",
        paperworkA4DocumentLabel: "Documento A4 {percent}% {scaleNote}",
        paperworkScaledToFit: "(dimensionado para caber)",
        paperworkActualSize: "(tamanho real)",
        paperworkCanvasPlaceholder: "Clique em um modelo de design para adicioná-lo ao seu modelo",
        paperworkDesignPresetsTitle: "Modelos de Design",

        // Preset Types
        paperworkDocumentHeaderPreset: "Cabeçalho do Documento",
        paperworkSectionHeaderPreset: "Cabeçalho da Seção",
        paperworkTextAreaPreset: "Área de Texto",
        paperworkTextImageRightPreset: "Texto + Imagem (Direita)",
        paperworkImageTextRightPreset: "Imagem + Texto (Direita)",
        paperworkPictureGalleryPreset: "Galeria de Imagens",
        paperworkPictureRowPreset: "Linha de Imagens",
        paperworkDividerPreset: "Divisor",
        paperworkEmptySpacePreset: "Espaço Vazio",

        // Template Designer Buttons
        paperworkFontSelectorButton: "Seletor de Fonte",
        paperworkSaveTemplateButton: "Salvar Modelo",
        paperworkLoadTemplateButton: "Carregar Modelo",
        paperworkManageTemplatesButton: "Gerenciar Modelos",
        paperworkSavePDFButton: "Salvar PDF",

        // Floating Window Controls
        paperworkMaximizeTooltip: "Maximizar",
        paperworkRestoreTooltip: "Restaurar",
        paperworkCloseTooltip: "Fechar",

        // Loading States
        paperworkLoadingMessage: "Carregando...",
        paperworkProcessingMessage: "Processando...",

        // Edit Controls
        paperworkClickToEdit: "Clique para editar",
        paperworkAIEnhanceButton: "Aprimoramento IA",
        paperworkUndoEditButton: "Desfazer",

        // Page Controls
        paperworkExpandToPageButton: "Expandir para Página",
        paperworkPageBreakIndicator: "Quebra de Página",
        paperworkPageNumber: "Página {number}",

        // Error Messages
        paperworkTemplateDesignNotInitialized: "Design do modelo não inicializado",
        paperworkErrorOccurred: "Houve um erro ao carregar o editor de documentos. Por favor, tente novamente.",

        // Field labels for edit dialog
        paperworkLabel: "Rótulo",
        paperworkPlaceholder: "Placeholder",
        paperworkRows: "Linhas",

        // Image count options
        paperworkTwoImages: "2 Imagens",
        paperworkFourImages: "4 Imagens",
        paperworkSixImages: "6 Imagens",
        paperworkNumberOfImages: "Número de Imagens",

        // Text placeholder field
        paperworkTextPlaceholder: "Placeholder de Texto",

        // Empty space behavior options (if not already added)
        paperworkFixedHeight: "Altura fixa",
        paperworkExpandToEndOfPage: "Expandir até o fim da página",

        // Height label 
        paperworkHeightPixels: "Altura (pixels)",
        paperworkBehavior: "Comportamento",

        //Extras
        paperworkDividerPreset: "Divisor",
        paperworkEmptySpacePreset: "Espaço Vazio",
        paperworkSectionAddedToDocument: "{sectionType} adicionado ao documento",
        paperworkEnhanceWithAI: "Aprimorar com IA",
        paperworkUndoChanges: "Desfazer Alterações",
        paperworkClickOrDragImage: "Clique ou arraste a imagem",
        paperworkEnhanceCaption: "Aprimorar Legenda",
        paperworkPageBreakSpace: "Espaço de Quebra de Página",
        paperworkEmptySpace: "Espaço Vazio",
        paperworkDragToResize: "Arraste para redimensionar",
        paperworkLikelyCausesPageBreak: "Provavelmente causa quebra de página no PDF",
        paperworkAdjustHeight: "Ajustar Altura",
        paperworkInsertPageBreak: "Inserir Quebra de Página",
        paperworkDeleteSectionConfirm: "Tem certeza de que deseja excluir esta seção?",
        paperworkEditSectionTitle: "Editar {sectionType}",
        paperworkHeightPixels: "Altura (pixels)",
        paperworkBehavior: "Comportamento",
        paperworkFixedHeight: "Altura fixa",
        paperworkExpandToEndOfPage: "Expandir até o fim da página",
        paperworkTitle: "Título",
        paperworkSubtitle: "Subtítulo",
        paperworkRequired: "Obrigatório",
        paperworkRows: "Linhas",
        paperworkNumberOfImages: "Número de Imagens",
        paperworkTextPlaceholder: "Placeholder de Texto",
        paperworkCancel: "Cancelar",
        paperworkSave: "Salvar",
        paperworkPleaseEnterReportName: "Por favor, insira um nome para o relatório.",
        paperworkPleaseAddAtLeastOneSection: "Por favor, adicione pelo menos uma seção ao seu relatório.",
        paperworkPrint: "Imprimir",
        paperworkNewReport: "Novo Relatório",
        paperworkClose: "Fechar",
        paperworkNoTextToEnhance: "Nenhum conteúdo de texto para aprimorar.",
        paperworkAIResponseProcessError: "A resposta da IA não pôde ser processada adequadamente. Por favor, tente novamente.",
        paperworkSelectAIModelFirst: "Por favor, selecione um modelo de IA na aba Chat antes de usar o recurso de aprimoramento de IA.",
        paperworkAIServiceUnableToEnhance: "O serviço de IA não conseguiu aprimorar o texto. Por favor, tente novamente.",
        paperworkErrorEnhancingWithAI: "Houve um erro ao aprimorar o texto com IA. Por favor, tente novamente.",
        paperworkEnterReportNameToSave: "Por favor, insira um nome para o relatório para salvar como modelo.",
        paperworkErrorParsingTemplateSections: "Erro ao analisar seções do modelo.",
        paperworkAddAtLeastOneSectionToTemplate: "Por favor, adicione pelo menos uma seção ao seu modelo.",
        paperworkTemplateExistsReplace: "Um modelo chamado \"{templateName}\" já existe. Deseja substituí-lo?",
        paperworkTemplateSavedSuccessfully: "Modelo \"{templateName}\" salvo com sucesso",
        paperworkErrorSavingTemplate: "Ocorreu um erro ao salvar o modelo. Por favor, tente novamente.",
        paperworkNoSavedTemplatesFound: "Nenhum modelo salvo encontrado.",
        paperworkLoadTemplate: "Carregar Modelo",
        paperworkSelectTemplateToLoad: "Selecione um modelo para carregar:",
        paperworkCreated: "Criado",
        paperworkSectionsCount: "{count} seções",
        paperworkDelete: "Excluir",
        paperworkDeleteTemplateConfirm: "Tem certeza de que deseja excluir o modelo \"{templateName}\"?",
        paperworkTemplateLoadedSuccessfully: "Modelo \"{templateName}\" carregado com sucesso",
        paperworkTemplateNameChangeTip: "Dica: Para criar um novo modelo baseado neste, altere o nome antes de salvar.",
        paperworkManageTemplates: "Gerenciar Modelos",
        paperworkTemplateManagementDescription: "Seus modelos salvos estão listados abaixo. Você pode carregá-los ou excluí-los.",
        paperworkNoTemplatesFound: "Nenhum modelo encontrado",
        paperworkLoad: "Carregar",
        paperworkTemplateDeleted: "Modelo \"{templateName}\" excluído",
        paperworkPDFFont: "Fonte do PDF",
        paperworkFontSetForPDF: "Fonte configurada para {font} para exportação PDF",
        paperworkPreview: "Visualizar",
        paperworkAddSectionBeforePreview: "Por favor, adicione pelo menos uma seção antes de visualizar.",
        paperworkErrorPreparingSections: "Erro ao preparar seções para visualização.",
        paperworkAddSectionBeforeSavingPDF: "Por favor, adicione pelo menos uma seção ao seu relatório antes de salvar como PDF.",
        paperworkPDFGeneratedSuccessfully: "PDF gerado com sucesso",
        paperworkErrorGeneratingPDF: "Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.",
        paperworkPleaseSelectImageFile: "Por favor, selecione um arquivo de imagem",
        paperworkProcessingImage: "Processando imagem...",
        paperworkImageAddedOptimized: "Imagem adicionada ({size}KB, otimizada para relatórios)",
        paperworkImageAdded: "Imagem adicionada ({size}KB)",
        paperworkErrorProcessingImage: "Erro ao processar imagem",
        paperworkImageProcessingError: "Houve um erro ao processar a imagem. Por favor, tente novamente com uma imagem diferente.",
        paperworkPageBreakSpaceInserted: "Espaço de quebra de página inserido",
        paperworkSectionExpandedToEndOfPage: "Seção expandida até o fim da página",
        paperworkTemplateDeletedSuccessfully: "Modelo \"{templateName}\" excluído com sucesso",
        paperworkErrorDeletingTemplate: "Erro ao excluir modelo: {error}",
        paperworkTryAgain: "Tentar novamente",
        paperworkTemplateDeletionConfirm: "Tem certeza de que deseja excluir o modelo \"{templateName}\"? Isso não pode ser desfeito.",
        paperworkPageBreakHelp: '<strong>Nota:</strong> Para controlar quebras de página no seu PDF, use o componente "Espaço Vazio" com altura definida para 500px ou mais.',
        paperworkPDFPreviewTitle: "Visualização PDF ({font})",
        paperworkPageIndicator: "--- Página {number} ---",
        paperworkPageBreakIndicator: "QUEBRA DE PÁGINA",
        paperworkErrorGeneratingPreview: "Erro ao gerar visualização. Por favor, tente novamente.",
        paperworkErrorLoadingTemplates: "Ocorreu um erro ao carregar os modelos. Por favor, tente novamente.",
        paperworkRecipientCompany: "Empresa Destinatária",
        paperworkSenderCompany: "Empresa Remetente",
        paperworkContractType: "Tipo de Contrato",
        paperworkContractValue: "Valor do Contrato",
        paperworkProposalType: "Tipo de Proposta",
        paperworkMemoSubject: "Assunto",
        paperworkMeetingLocation: "Local da Reunião",
        paperworkMeetingPurpose: "Propósito da Reunião",
        paperworkFormValidationError: "Por favor, preencha todos os campos obrigatórios.",
        paperworkDocumentGenerated: "Documento gerado com sucesso!",
        paperworkDocumentGenerationFailed: "Falha ao gerar documento. Por favor, tente novamente.",
        paperworkAddCaptionHere: "Adicione uma legenda aqui",
        paperworkDesignCanvas: "Tela de Design",
        paperworkSaving: "Salvando...",
        paperworkLoadingTemplates: "Carregando modelos...",
        paperworkGeneratingPreview: "Gerando visualização...",
        paperworkGeneratingPDF: "Gerando PDF...",
        paperworkEnhancingWithAI: "Aprimorando conteúdo com IA...",

        // ===== DOCUMENTGENERATORS.JS =====

        // Business letter
        documentGeneratorBusinessLetterFields: "Campos da Carta Comercial",
        documentGeneratorLocationLabel: "Localização",
        documentGeneratorLocationPlaceholder: "Cidade, País",
        documentGeneratorDateLabel: "Data",
        documentGeneratorRecipientLabel: "Informações do Destinatário",
        documentGeneratorRecipientPlaceholder: "Nome do Destinatário",
        documentGeneratorSubjectLabel: "Assunto",
        documentGeneratorSubjectPlaceholder: "Assunto da carta",
        documentGeneratorGreetingLabel: "Saudação",
        documentGeneratorGreetingPlaceholder: "Caro/Cara Sr./Sra. Sobrenome,",
        documentGeneratorBodyLabel: "Corpo",
        documentGeneratorBodyPlaceholder: "Escreva o conteúdo principal da sua carta aqui...",
        documentGeneratorToneLabel: "Tom da Carta",
        documentGeneratorToneProfessional: "Profissional (Tom comercial padrão)",
        documentGeneratorToneFriendly: "Amigável (Caloroso, pessoal)",
        documentGeneratorToneFormal: "Formal (Altamente profissional, tradicional)",
        documentGeneratorToneUrgent: "Urgente (Assunto sensível ao tempo)",
        documentGeneratorTonePersuasive: "Persuasivo (Convincente, orientado para vendas)",
        documentGeneratorToneApologetic: "Desculpas (Abordando preocupações)",
        documentGeneratorToneAppreciative: "Apreciativo (Expressando gratidão)",
        documentGeneratorToneDirect: "Direto (Claro, conciso, direto ao ponto)",
        documentGeneratorClosingLabel: "Encerramento",
        documentGeneratorClosingPlaceholder: "Atenciosamente,",
        documentGeneratorSignatureLabel: "Assinatura",
        documentGeneratorSignaturePlaceholder: "Seu Nome",
        documentGeneratorClosingDefault: "Atenciosamente,",

        // Contract fields
        documentGeneratorContractTypeLabel: "Tipo de Contrato",
        documentGeneratorContractTypeService: "Acordo de Serviços",
        documentGeneratorContractTypeEmployment: "Contrato de Trabalho",
        documentGeneratorContractTypeNDA: "Acordo de Confidencialidade (NDA)",
        documentGeneratorContractTypeSale: "Contrato de Vendas",
        documentGeneratorContractTypeLease: "Contrato de Locação",
        documentGeneratorContractTypeConsulting: "Acordo de Consultoria",
        documentGeneratorContractTypePartnership: "Acordo de Parceria",
        documentGeneratorContractTypeCustom: "Personalizado/Outro",
        documentGeneratorContractTitleLabel: "Título do Contrato",
        documentGeneratorContractTitlePlaceholder: "Acordo de Serviços, Contrato de Trabalho, etc.",
        documentGeneratorParty1Label: "Informações da Parte 1",
        documentGeneratorParty1Placeholder: "Nome legal completo\nEndereço\nInformações de contato",
        documentGeneratorParty2Label: "Informações da Parte 2",
        documentGeneratorParty2Placeholder: "Nome legal completo\nEndereço\nInformações de contato",
        documentGeneratorEffectiveDateLabel: "Data de Vigência",
        documentGeneratorTermLabel: "Prazo/Duração",
        documentGeneratorTermPlaceholder: "1 ano, 6 meses, até conclusão do projeto, etc.",
        documentGeneratorScopeLabel: "Escopo do Trabalho/Serviços",
        documentGeneratorScopePlaceholder: "Descrição detalhada do trabalho a ser executado, serviços a serem fornecidos ou itens a serem entregues.",
        documentGeneratorPaymentLabel: "Termos de Pagamento",
        documentGeneratorPaymentPlaceholder: "Valor, método e cronograma de pagamentos.",
        documentGeneratorConfidentialityLabel: "Disposições de Confidencialidade",
        documentGeneratorConfidentialityPlaceholder: "Descrever requisitos de confidencialidade, que informações são consideradas confidenciais e como devem ser protegidas.",
        documentGeneratorIPLabel: "Direitos de Propriedade Intelectual",
        documentGeneratorIPPlaceholder: "Especificar propriedade da propriedade intelectual criada durante o período do acordo.",
        documentGeneratorTerminationLabel: "Condições de Rescisão",
        documentGeneratorTerminationPlaceholder: "Circunstâncias sob as quais qualquer parte pode rescindir o contrato, períodos de aviso e consequências da rescisão.",
        documentGeneratorDisputeLabel: "Resolução de Disputas",
        documentGeneratorDisputePlaceholder: "Como as disputas serão tratadas (mediação, arbitragem, litígio), jurisdição aplicável.",
        documentGeneratorAdditionalTermsLabel: "Termos Adicionais",
        documentGeneratorAdditionalTermsPlaceholder: "Quaisquer outros termos, condições ou cláusulas relevantes para este acordo.",

        // Memo fields
        documentGeneratorMemoCompanyLabel: "Informações da Empresa",
        documentGeneratorMemoCompanyPlaceholder: "Nome da Empresa\nEndereço\nInformações de Contato",
        documentGeneratorMemoToLabel: "Para",
        documentGeneratorMemoToPlaceholder: "Nome(s) do Destinatário\nDepartamento/Cargo\nPode listar múltiplos destinatários",
        documentGeneratorMemoFromLabel: "De",
        documentGeneratorMemoFromPlaceholder: "Seu Nome e Cargo",
        documentGeneratorMemoSubjectLabel: "Assunto",
        documentGeneratorMemoSubjectPlaceholder: "Assunto claro e conciso do memorando",
        documentGeneratorMemoBodyLabel: "Corpo do Memorando",
        documentGeneratorMemoBodyPlaceholder: "Escreva o conteúdo principal do seu memorando aqui...",
        documentGeneratorMemoToneLabel: "Tom do Memorando",
        documentGeneratorMemoToneInformative: "Informativo (Foco em fatos e detalhes)",
        documentGeneratorMemoToneCollaborative: "Colaborativo (Orientado para equipe)",
        documentGeneratorMemoToneInstructional: "Instrucional (Como fazer ou orientação)",
        documentGeneratorMemoAttachmentsLabel: "Anexos",
        documentGeneratorMemoAttachmentsPlaceholder: "Liste quaisquer documentos anexados (opcional)",

        // Meeting Minutes fields
        documentGeneratorMinutesOrgLabel: "Nome da Organização/Empresa",
        documentGeneratorMinutesOrgPlaceholder: "Nome da Organização ou Empresa",
        documentGeneratorMinutesTitleLabel: "Título da Reunião",
        documentGeneratorMinutesTitlePlaceholder: "Reunião do Conselho, Revisão de Projeto, Sincronização da Equipe, etc.",
        documentGeneratorMinutesDateTimeLabel: "Data e Hora",
        documentGeneratorMinutesLocationLabel: "Local",
        documentGeneratorMinutesLocationPlaceholder: "Sala de Conferências A, Chamada do Zoom, etc.",
        documentGeneratorMinutesFacilitatorLabel: "Facilitador da Reunião",
        documentGeneratorMinutesFacilitatorPlaceholder: "Nome e função do líder da reunião",
        documentGeneratorMinutesAttendeesLabel: "Participantes",
        documentGeneratorMinutesAttendeesPlaceholder: "Lista de todos os participantes (um por linha)",
        documentGeneratorMinutesAbsentLabel: "Ausentes",
        documentGeneratorMinutesAbsentPlaceholder: "Lista de pessoas convidadas que não puderam comparecer (opcional)",
        documentGeneratorMinutesAgendaLabel: "Itens da Agenda",
        documentGeneratorMinutesAgendaPlaceholder: "Liste os principais itens da agenda discutidos durante a reunião",
        documentGeneratorMinutesDiscussionLabel: "Pontos de Discussão",
        documentGeneratorMinutesDiscussionPlaceholder: "Pontos-chave discutidos durante a reunião",
        documentGeneratorMinutesDecisionsLabel: "Decisões Tomadas",
        documentGeneratorMinutesDecisionsPlaceholder: "Liste todas as decisões e acordos feitos durante a reunião",
        documentGeneratorMinutesActionsLabel: "Itens de Ação",
        documentGeneratorMinutesActionsPlaceholder: "Lista de tarefas, responsáveis designados e prazos (ex: 'Completar proposta do projeto - João Silva - 30 de março')",
        documentGeneratorMinutesNextMeetingLabel: "Próxima Reunião",
        documentGeneratorMinutesNotesLabel: "Notas Adicionais",
        documentGeneratorMinutesNotesPlaceholder: "Qualquer informação ou nota adicional",
        documentGeneratorMinutesPreparerLabel: "Ata Preparada Por",
        documentGeneratorMinutesPreparerPlaceholder: "Nome da pessoa que preparou esta ata",
        documentGeneratorMinutesStyleLabel: "Estilo",
        documentGeneratorMinutesStyleFormal: "Formal (Estilo comercial tradicional)",
        documentGeneratorMinutesStyleConcise: "Conciso (Breve e direto ao ponto)",
        documentGeneratorMinutesStyleDetailed: "Detalhado (Documentação abrangente)",
        documentGeneratorMinutesStyleActionFocused: "Focado em Ações (Ênfase nos próximos passos)",
        documentGeneratorMinutesStyleFormal: "Formal (Estilo comercial tradicional)",
        documentGeneratorMinutesStyleConcise: "Conciso (Breve e direto ao ponto)",
        documentGeneratorMinutesStyleDetailed: "Detalhado (Documentação abrangente)",
        documentGeneratorMinutesStyleActionFocused: "Focado em Ações (Ênfase nos próximos passos)",
        documentGeneratorMinutesNextLabel: "Próxima Reunião",
        documentGeneratorMinutesNextDatePlaceholder: "Data da próxima reunião",
        documentGeneratorMinutesNextTimePlaceholder: "Hora da próxima reunião",

        // Proposal fields
        documentGeneratorProposalCompanyLabel: "Informações da Sua Empresa",
        documentGeneratorProposalCompanyPlaceholder: "Nome da Empresa\nEndereço\nInformações de Contato\nWebsite",
        documentGeneratorProposalClientLabel: "Informações do Cliente/Destinatário",
        documentGeneratorProposalClientPlaceholder: "Nome do Cliente\nEmpresa\nCargo\nEndereço\nInformações de Contato",
        documentGeneratorProposalTitleLabel: "Título da Proposta",
        documentGeneratorProposalTitlePlaceholder: "Ex.: Proposta de Redesign de Website, Proposta de Serviços de Marketing",
        documentGeneratorProposalTypeLabel: "Tipo de Proposta",
        documentGeneratorProposalTypeServices: "Proposta de Serviços",
        documentGeneratorProposalTypeProduct: "Proposta de Produto",
        documentGeneratorProposalTypeProject: "Proposta de Projeto",
        documentGeneratorProposalTypeInvestment: "Proposta de Investimento",
        documentGeneratorProposalTypePartnership: "Proposta de Parceria",
        documentGeneratorProposalTypeMarketing: "Proposta de Marketing",
        documentGeneratorProposalTypeConsulting: "Proposta de Consultoria",
        documentGeneratorProposalTypeCustom: "Proposta Personalizada",
        documentGeneratorProposalSummaryLabel: "Resumo Executivo",
        documentGeneratorProposalSummaryPlaceholder: "Forneça uma visão geral concisa da sua proposta. Explique de forma clara o propósito, objetivos principais e os benefícios mais importantes para o cliente. Esta seção deve chamar a atenção e encorajar a leitura.",
        documentGeneratorProposalProblemLabel: "Declaração do Problema / Necessidades do Cliente",
        documentGeneratorProposalProblemPlaceholder: "Descreva os problemas atuais, desafios ou necessidades do cliente que sua proposta aborda. Demonstre sua compreensão da situação deles.",
        documentGeneratorProposalSolutionLabel: "Solução Proposta",
        deliverablesLabel: "Entregáveis",
        timelineLabel: "Cronograma / Agenda",
        pricingLabel: "Preços / Investimento",
        teamLabel: "Equipe / Qualificações",
        caseStudiesLabel: "Estudos de Caso / Exemplos",
        callToActionLabel: "Chamada para Ação",
        termsConditionsLabel: "Termos e Condições",
        proposalStyleLabel: "Estilo da Proposta",

        // Messages and alerts
        documentGeneratorRequiredFieldsError: "Por favor, preencha os seguintes campos obrigatórios: {fields}",
        documentGeneratorEnhanceFieldError: "Por favor, insira conteúdo no campo antes de aprimorar, ou houve um erro durante o aprimoramento.",
        documentGeneratorEnhanceAllFieldsError: "Por favor, adicione conteúdo a pelo menos um campo de texto antes de aprimorar todos.",
        documentGeneratorEnhanceAllComplete: "Todos os campos foram aprimorados!",
        documentGeneratorEnhanceError: "Houve um erro ao aprimorar alguns campos. Por favor, verifique os resultados.",
        documentGeneratorEnhanceFailure: "Falha ao aprimorar o conteúdo. Tente novamente ou prossiga com o conteúdo original.",
        documentGeneratorGenerateError: "Houve um erro ao gerar seu documento. Por favor, tente novamente.",
        documentGeneratorFormCleared: "Formulário limpo",
        documentGeneratorEmailError: "Não foi possível abrir seu cliente de email automaticamente.\n\nO conteúdo do documento foi copiado para a área de transferência.\nPor favor, abra seu cliente de email e cole o conteúdo.",
        documentGeneratorNoContentError: "Nenhum conteúdo disponível para envio por email. Por favor, tente novamente.",
        documentGeneratorCopyError: "Nenhum texto disponível para copiar",
        documentGeneratorCopySuccess: "Copiado!",
        documentGeneratorCopyFailed: "Falha ao copiar texto. Por favor, tente novamente.",

        // Document preview
        documentGeneratorPreviewBusinessLetter: "Visualização da Carta Comercial",
        documentGeneratorPreviewInvoice: "Visualização da Fatura",
        documentGeneratorPreviewContract: "Visualização do Contrato",
        documentGeneratorPreviewMemo: "Visualização do Memorando",
        documentGeneratorPreviewMeetingMinutes: "Visualização da Ata de Reunião",
        documentGeneratorPreviewDefault: "Visualização do Documento",
        documentGeneratorEditText: "Editar Texto",
        documentGeneratorShowFormatted: "Mostrar Texto Formatado",
        documentGeneratorCopyText: "Copiar Texto",
        documentGeneratorEmailIt: "Enviar por email",
        documentGeneratorGoBack: "Voltar",
        documentGeneratorClose: "Fechar",

        // Loading states
        documentGeneratorEnhancing: "Aprimorando sua carta...",
        documentGeneratorGeneratingContract: "Gerando seu contrato...",
        documentGeneratorGeneratingProposal: "Gerando sua proposta comercial...",
        documentGeneratorGeneratingMemo: "Gerando seu memorando...",
        documentGeneratorGeneratingMinutes: "Gerando sua ata de reunião...",
        documentGeneratorEnhancingField: "Aprimorando {field}...",
        documentGeneratorEnhancingAll: "Aprimorando todos os campos de texto...",

        // Contract fallback headers
        documentGeneratorContractPartiesHeader: "PARTES",
        documentGeneratorContractAgreementText: "Este {title} (o \"Acordo\") é celebrado entre:",
        documentGeneratorContractTermHeader: "PRAZO",
        documentGeneratorContractScopeHeader: "ESCOPO DO TRABALHO",
        documentGeneratorContractPaymentHeader: "TERMOS DE PAGAMENTO",
        documentGeneratorContractConfidentialityHeader: "CONFIDENCIALIDADE",
        documentGeneratorContractIPHeader: "PROPRIEDADE INTELECTUAL",
        documentGeneratorContractTerminationHeader: "RESCISÃO",
        documentGeneratorContractDisputeHeader: "RESOLUÇÃO DE DISPUTAS",
        documentGeneratorContractAdditionalHeader: "TERMOS ADICIONAIS",
        documentGeneratorContractSignaturesHeader: "ASSINATURAS",
        documentGeneratorContractWitnessText: "EM TESTEMUNHO DO QUE, as partes aqui presentes executaram este Acordo na data acima mencionada.",
        documentGeneratorContractParty1Signature: "Parte 1: _______________________________",
        documentGeneratorContractParty2Signature: "Parte 2: _______________________________",

        // Proposals
        documentGeneratorProposalStyleProfessional: "Profissional (Tom empresarial formal)",
        documentGeneratorProposalStylePersuasive: "Persuasivo (Abordagem orientada para vendas)",
        documentGeneratorProposalStyleTechnical: "Técnico (Focado em detalhes e especificações)",
        documentGeneratorProposalStyleCreative: "Criativo (Inovador, orientado visualmente)",
        documentGeneratorProposalStyleConsultative: "Consultivo (Consultoria, foco na resolução de problemas)",
        documentGeneratorProposalSolutionPlaceholder: "Detalhe sua solução para os problemas do cliente. Explique sua abordagem, metodologia, produtos ou serviços que atenderão às suas necessidades.",
        documentGeneratorDeliverablesLabel: "Entregáveis",
        documentGeneratorDeliverablesPlaceholder: "Descreva o que você entregará ao cliente...",
        documentGeneratorTimelineLabel: "Cronograma / Agenda",
        documentGeneratorTimelinePlaceholder: "Forneça detalhes do cronograma...",
        documentGeneratorPricingLabel: "Preços / Investimento",
        documentGeneratorPricingPlaceholder: "Descreva sua estrutura de preços...",
        documentGeneratorTeamLabel: "Equipe / Qualificações",
        documentGeneratorTeamPlaceholder: "Descreva as qualificações da sua equipe...",
        documentGeneratorCaseStudiesLabel: "Estudos de Caso / Exemplos",
        documentGeneratorCaseStudiesPlaceholder: "Forneça estudos de caso relevantes...",
        documentGeneratorCallToActionLabel: "Chamada para Ação",
        documentGeneratorCallToActionPlaceholder: "O que você quer que o cliente faça a seguir?",
        documentGeneratorTermsConditionsLabel: "Termos e Condições",
        documentGeneratorTermsConditionsPlaceholder: "Inclua quaisquer termos e condições...",
        documentGeneratorProposalStyleLabel: "Estilo da Proposta",

        //Extras 
        documentGeneratorTemplateEmptyState: "Nenhum campo adicionado ainda. Use os botões acima para adicionar campos.",
        documentGeneratorTextFieldDefault: "Campo de Texto",
        documentGeneratorTextFieldBadge: "Texto",
        documentGeneratorTextAreaDefault: "Área de Texto",
        documentGeneratorTextAreaBadge: "Área de Texto",
        documentGeneratorImageDefault: "Imagem",
        documentGeneratorImageBadge: "Imagem",
        documentGeneratorEditButton: "Editar",
        documentGeneratorDeleteButton: "Excluir",
        documentGeneratorEnhanceFailure: "Falha ao melhorar o conteúdo. Tente novamente ou prossiga com o conteúdo original.",
        documentGeneratorEnhancingField: "Aprimorando {field}...",
        documentGeneratorBusinessLetterPreview: 'Pré-visualização da Carta Comercial',
        documentGeneratorInvoicePreview: 'Pré-visualização da Fatura',
        documentGeneratorContractPreview: 'Pré-visualização do Contrato',
        documentGeneratorMemoPreview: 'Pré-visualização do Memorando',
        documentGeneratorMeetingMinutesPreview: 'Pré-visualização da Ata de Reunião',
        documentGeneratorDocumentPreview: 'Pré-visualização do Documento',

        // Template name placeholder
        paperworkTemplateNamePlaceholder: "Relatório de Status de Engenharia, Relatório de Bug, etc.",
        paperworkDocumentTitle: "Título do Documento",
        paperworkDocumentSubtitle: "Subtítulo ou descrição do documento",
        paperworkSectionHeader: "Cabeçalho da Seção",
        paperworkTextAreaField: "Campo de Área de Texto",
        paperworkEnterLongerTextHere: "Digite texto mais longo aqui...",
        paperworkImageGallery: "Galeria de Imagens",
        paperworkTextWithImage: "Texto com Imagem",
        paperworkEnterTextHere: "Digite o texto aqui...",
        paperworkImageWithText: "Imagem com Texto",
        paperworkImageRow: "Linha de Imagens",
        paperworkAddCaptionHere: "Adicione uma legenda aqui",
        paperworkAddACaptionHere: "Adicione uma legenda aqui",
        paperworkClickOrDragImage: "Clique ou arraste imagem",
        paperworkClickToEdit: "Clique para editar",
        paperworkEmptySpace: "Espaço Vazio",
        paperworkDragToResize: "Arraste para redimensionar",
        paperworkPageBreakSpace: "Espaço de quebra de página",
        paperworkProcessingImage: "Processando imagem...",
        paperworkImageAdded: "Imagem adicionada ({size}KB)",
        paperworkImageAddedOptimized: "Imagem adicionada e otimizada ({size}KB)",
        paperworkErrorProcessingImage: "Erro processando imagem",
        paperworkImageProcessingError: "Erro ao processar imagem. Tente novamente.",
        paperworkPleaseSelectImageFile: "Por favor selecione um arquivo de imagem",
        paperworkResize: "Redimensionar",

        // Placeholders
        documentGeneratorLocationPlaceholder1: '[Informações de Localização]',
        documentGeneratorRecipientPlaceholder1: '[Informações do Destinatário]',
        documentGeneratorSubjectPlaceholder1: '[Assunto]',
        documentGeneratorGreetingDefault1: 'Prezado(a) Senhor(a),',
        documentGeneratorBodyPlaceholder1: '[Corpo da Carta]',
        documentGeneratorClosingDefault1: 'Atenciosamente,',
        documentGeneratorSignaturePlaceholder1: '[Seu Nome]',
        documentGeneratorContractTitlePlaceholder1: '[Título do Contrato]',
        documentGeneratorParty1Placeholder1: '[Informações da Parte 1]',
        documentGeneratorParty2Placeholder1: '[Informações da Parte 2]',
        documentGeneratorTermPlaceholder1: '[Prazo do Contrato]',
        documentGeneratorScopePlaceholder1: '[Escopo do Trabalho]',
        documentGeneratorPaymentPlaceholder1: '[Termos de Pagamento]',
        documentGeneratorProposalCompanyPlaceholder1: '[Informações da Empresa]',
        documentGeneratorProposalClientPlaceholder1: '[Informações do Cliente]',
        documentGeneratorProposalTitlePlaceholder1: '[Título da Proposta]',
        documentGeneratorMemoToPlaceholder1: '[Destinatário]',
        documentGeneratorMemoFromPlaceholder1: '[Remetente]',
        documentGeneratorMemoSubjectPlaceholder1: '[Assunto]',
        documentGeneratorMemoBodyPlaceholder1: '[Corpo do Memorando]',
        documentGeneratorMinutesTitlePlaceholder1: 'Ata de Reunião',

        // Extras
        documentGeneratorProposalPreview: 'Proposta',
        documentGeneratorClosingDefault2: 'Melhores cumprimentos,',
        documentGeneratorCopied: 'Copiado!',
        documentGeneratorCopiedPlainText: 'Copiado (texto simples)',
        documentGeneratorShowFormattedText: 'Mostrar Texto Formatado',

        // ===== ARTWORKSTAB.JS =====

        //UI
        artworkSelectVisualModel: "Selecionar Modelo Visual:",
        artworkSelectMode: "Selecionar Modo:",
        artworkHtmlStyleTransfer: "Transferência de Estilo HTML",
        artworkTextOverlay: "Sobreposição de Texto",
        artworkDesignRationale: "Fundamentação do Design",
        artworkUploadReferenceImage: "Carregar Imagem de Referência:",
        artworkDragImageOrClick: "Arraste uma imagem aqui ou clique para carregar",
        artworkUseAsBackground: "Usar como imagem de fundo",
        artworkDesignInstructions: "Instruções de Design:",
        artworkDesignInstructionsPlaceholder: "Descreva o estilo que deseja (ex., 'Criar um site brutalista', 'Design em estilo minimalista'), Nome do site, botões, etc...",
        artworkGenerateDesign: "Gerar Design",
        artworkGeneratedDesign: "Design Gerado:",
        artworkSelectVisualModelOption: "Selecionar um modelo visual",
        artworkVisualDesignStudio: "Estúdio de Design Visual",
        artworkCreateDesignsDescription: "Criar designs, sites ou obras de arte usando modelos de IA visual.",

        //Models
        artworkNoVisualModelsAvailable: "Nenhum Modelo Visual Disponível",
        artworkFeatureRequiresVisualModels: "Esta funcionalidade requer modelos visuais instalados no Ollama.",
        artworkNoCompatibleModelsInstalled: "Você atualmente não tem nenhum modelo visual compatível instalado.",
        artworkInstallModelsLike: "Instale modelos como LLaVA, Bakllava, Gemma3, Phi3-Vision, ou outros modelos com capacidade visual",
        artworkToUseThisFeature: "para usar esta funcionalidade.",
        artworkGoToModelsTab: "Ir para a Aba de Modelos",

        //Info
        artworkPleaseSelectVisualModel: "Por favor, selecione um modelo visual",
        artworkPleaseUploadReferenceImage: "Por favor, carregue uma imagem de referência",
        artworkPleaseProvideDesignInstructions: "Por favor, forneça instruções de design",
        artworkPleaseSelectImageFile: "Por favor, selecione um arquivo de imagem",
        artworkImageTooLarge: "A imagem é muito grande. Tamanho máximo é 5MB",

        //Overlays
        artworkStyleModePlaceholder: "Descreva a transformação de estilo que deseja (ex., 'Transformar isto num design Brutalista com tipografia marcante')",
        artworkOverlayModePlaceholder: "Digite o texto para sobrepor (ex., 'Cabeçalho: Nome do Produto, Corpo: Características principais..., Rodapé: Chamada para ação')",
        artworkRationaleModePlaceholder: "Pergunte sobre aspectos específicos do design para explicar (ex., 'Explique as escolhas de layout e como impactam o fluxo do usuário')",

        //Generate artworks
        artworkGenerating: "Gerando...",
        artworkGenerationCancelled: "A geração foi cancelada.",
        artworkImageAnalysisFailed: "Erro: A análise da imagem falhou. Por favor, tente novamente.",
        artworkErrorOccurred: "Erro: {error}",
        analyzingImage: 'Analisando Imagem',
        analyzingImageAndGenerating: 'Analisando imagem e gerando design...',
        artworkGenerationTiming: 'Isso pode levar 30-60 segundos dependendo do modelo',

        // ===== ARTWORKPREVIEWWINDOW.JS =====
        artworkCopyText: "Copiar Texto",
        artworkCopyCode: "Copiar Código",

        // Create window
        artworkCode: "Código",
        artworkPreview: "Visualização",
        artworkExportPNG: "Exportar PNG",
        artworkClose: "Fechar",

        // Background image
        artworkBackgroundImageWarning: "IMPORTANTE: Isto está usando uma URL de imagem temporária.",
        artworkBackgroundImageInstructions: "Ao implantar seu site, substitua isto por um caminho de imagem real como:",
        artworkBackgroundImageReplace: "Substituir por caminho de imagem real ao implantar",

        // Copy code
        artworkCopied: "Copiado!",
        artworkCopyFailed: "Falha ao copiar código. Por favor, tente novamente.",

        // Download image
        artworkExportingPNG: "Exportando PNG...",
        artworkExportWait: "Por favor, aguarde enquanto geramos sua imagem.",
        artworkExportSuccess: "PNG Exportado com Sucesso!",
        artworkExportDownloaded: "Sua imagem foi baixada.",

        // Export instructions
        artworkExportInstructions: "Para salvar como PNG de alta qualidade:",
        artworkExportScreenshot: "Tire uma captura de tela da área de visualização:",
        artworkExportMac: "Cmd+Shift+4, depois selecione a área",
        artworkExportWindows: "Win+Shift+S, depois selecione a área",
        artworkExportPasteSave: "Cole e salve no seu editor de imagem preferido",
        artworkExportGotIt: "Entendi",

        // Extras
        artworkGenerationCanceled: 'Geração Cancelada',
        artworkGenerationWasCanceled: 'A geração foi cancelada.',
        artworkTryAgainDifferentPrompt: 'Você pode tentar novamente com um prompt ou modelo diferente.',
        artworkGenerationFailed: 'Geração Falhou',
        artworkImageAnalysisFailed: 'A análise da imagem falhou',
        artworkTryAgainDifferentPromptOrModel: 'Por favor, tente novamente com um prompt ou modelo diferente',

        // ===== MODELSTAB.JS =====

        // Models tab
        modelRestartOllamaAdvice: "Por favor, reinicie o Ollama para limpar completamente os arquivos parciais.",
        modelFetchButton: "Buscar Modelos Ollama",
        modelSelectPlaceholder: "Nenhum modelo buscado ainda",
        modelFetching: "Buscando modelos...",
        modelPleaseWait: "Por favor aguarde, conectando ao Ollama...",
        modelFetchSuccess: "Encontrados {count} modelos disponíveis",
        modelFetchError: "Erro ao conectar à Biblioteca Ollama",
        modelFetchRetry: "Tentar Novamente",
        modelSelectLabel: "Selecionar Modelo",
        modelSizeLabel: "Selecionar Tamanho",
        modelDeleteSelectOption: "Selecionar modelo...",
        modelDownloadButton: "Baixar Modelo",
        modelDeleteButton: "Excluir Modelo Selecionado",
        modelLocalLabel: "Modelos Locais Atuais",
        modelDownloadStarting: "Iniciando download...",
        modelDownloading: "Baixando: {downloaded} / {total}",
        modelDownloadComplete: "Download Completo",
        modelDownloadError: "Erro - Tente Novamente",
        modelDeleteConfirm: "Tem certeza de que deseja excluir {model}?",
        modelDeleting: "Excluindo...",
        modelDeleted2: "Modelo Excluído",
        modelDeleteError: "Erro ao Excluir",
        modelDeleteSuccess: "Removido com sucesso {model}",
        modelNoTags: "Nenhuma tag disponível para este modelo",
        modelDownloadSuccess: "Baixado com sucesso {model}",
        modelErrorMessage: "Erro: {message}",
        modelConfigureButton: "Configurar modelo (opcional)",
        modelConfigureSuccess: "Modelo personalizado '{model}' criado com sucesso baseado em {baseModel}!",
        modelConfigureError: "Erro ao criar modelo personalizado: {error}",
        modelChooseOption: "Escolher um modelo...",
        modelFetchingMessage: "Buscando modelos...",
        modelResumeDownload: "Retomar Download",
        modelDownloadResuming: "Retomando download...",
        modelRefreshingStats: "Atualizando estatísticas de download...",
        modelFetchDisabledDuringDownload: "A busca de modelos está desabilitada enquanto um modelo está sendo baixado.",
        close: "Fechar",
        save: "Salvar",
        modelName: "Nome do Modelo",
        baseModel: "Modelo Base",
        creating: "Criando...",
        modelLoadingOption: "Carregando modelos locais...",
        modelFetchError: "Erro ao carregar modelos online",
        modelFetchingSizes: "Buscando tamanhos...",
        modelNoSizesFound: "Nenhum tamanho encontrado para este modelo",
        modelSizesFetchError: "Erro ao carregar tamanhos do modelo",
        modelSelectBothRequired: "Por favor, selecione tanto um modelo quanto um tamanho antes de baixar.",
        modelCancelButton: "Cancelar Download",
        modelCancelDownloadConfirm: "Tem certeza de que deseja cancelar este download? Downloads parciais serão excluídos.",
        modelCancellingDownload: "Cancelando download e limpando...",
        modelDownloadCancelled: "Download cancelado com sucesso, por favor reinicie o Ollama para excluir arquivos parcialmente baixados.",
        modelCancellationError: "Erro durante o processo de cancelamento.",
        modelDownloadInterrupted: "Download interrompido. Por favor, tente novamente.",
        modelSettingsTitle: "Configurações do Modelo",
        modelSettingsDescription: "Visualizar e ajustar configurações para este modelo.",
        modelConfigTemp: "Temperatura",
        modelConfigTopP: "Top P",
        modelConfigTopK: "Top K",
        modelConfigRepeatPenalty: "Penalidade de Repetição",
        restoreSettings: "Restaurar Configurações de Fábrica",
        saveSettings: "Salvar Configurações",
        modelSettingsSaved: "Configurações salvas para {model}.",
        modelSettingsError: "Erro ao salvar configurações: {error}",
        savingSettings: "Salvando configurações...",
        restoringSettings: "Restaurando configurações de fábrica...",
        settingsRestored: "Configurações de fábrica restauradas",
        modelConfigStatus: "Status das Configurações",
        modelConfigHelp: "Ajuste as configurações para controlar como o modelo gera texto.",
        modelConfigTempHelp: "Valores mais altos (mais próximos de 1) tornam a saída mais aleatória, valores mais baixos mais determinísticos.",
        modelConfigTopPHelp: "Limita a seleção de tokens a uma porcentagem da massa de probabilidade. Valores mais baixos aumentam o foco.",
        modelConfigTopKHelp: "Limita a seleção de tokens aos top K tokens. Valores mais baixos aumentam o foco.",
        modelConfigRepeatPenaltyHelp: "Valores mais altos reduzem a repetição penalizando tokens repetidos.",
        modelConfigResetButton: "Redefinir",
        modelConfigSaveButton: "Salvar Alterações",
        viewModelsConfirm: "Gostaria de visualizar modelos Ollama disponíveis online?",
        fetchingModels: "Buscando modelos Ollama...",
        loadingModelDownloader: "Carregando baixador de modelos...",
        errorLoadingModels: "Erro ao Carregar Modelos",





        // ===== RESEARCHTAB.JS =====

        //Research
        researchInitializationFailed: "Falha ao inicializar ferramentas de Pesquisa",
        researchErrorMessage: "Erro: {message}",
        researchSubTab: "Pesquisa",
        knowledgeBaseSubTab: "Base de Conhecimento",
        researchAssistantTitle: "Assistente de Pesquisa",
        researchAssistantDescription: "Pesquise qualquer tópico com busca e resumo baseados em IA, modelos de raciocínio aumentarão dramaticamente o tempo de pesquisa mas fornecerão melhores resultados (deepSeek, Qwen3, QwQ, etc).",
        researchQueryPlaceholder: "Digite sua pergunta de pesquisa...",
        researchButton: "Pesquisar",
        knowledgeBaseTitle: "Base de Conhecimento",
        knowledgeBaseDescription: "Armazene e recupere informações em sua base de dados de conhecimento pessoal.",
        knowledgeBaseCollectionPlaceholder: "Nome da nova coleção...",
        knowledgeBaseCreateButton: "Criar Coleção",
        knowledgeBaseCollectionsTitle: "Suas Coleções de Conhecimento",
        researchSizeLabel: "Escolha o tamanho aproximado do relatório:",
        researchSizeTooltip: "Selecione o tamanho desejado do seu relatório de pesquisa. Relatórios maiores incluirão mais detalhes e análise mais profunda, mas podem demorar mais para gerar.",
        researchSizeConcise: "Conciso (500-800 palavras)",
        researchSizeStandard: "Padrão (1000-1500 palavras)",
        researchSizeDetailed: "Detalhado (2000-3000 palavras)",
        researchSizeComprehensive: "Abrangente (4000-5000 palavras)",
        researchSizeExtensive: "Extenso (6000+ palavras)",
        modelSelectionRequired: "Seleção de Modelo Obrigatória",

        // Knowledge Base search related translations
        knowledgeBaseSearchMode: "Modo de Busca na Base de Conhecimento",
        knowledgeBaseSearchInfo: "Nesta aba, o prompt principal buscará em suas coleções de conhecimento.",
        knowledgeBaseSearchPlaceholder: "Buscar em sua base de conhecimento...",
        knowledgeBaseSearching: "Buscando na base de conhecimento...",
        knowledgeBaseNoResults: "Nenhuma entrada correspondente encontrada em sua base de conhecimento para: \"{query}\"",
        knowledgeBaseSearchTryDifferent: "Tente um termo de busca diferente ou adicione mais conteúdo à sua base de conhecimento.",
        knowledgeBaseSearchResults: "Encontradas {count} entradas em sua base de conhecimento para: \"{query}\"",
        knowledgeBaseEntryCollection: "Coleção: {name}",
        knowledgeBaseViewEntry: "Ver Entrada",
        knowledgeBaseViewCollection: "Ir para Coleção",
        knowledgeBaseSearchError: "Erro ao buscar na base de conhecimento: {error}",
        knowledgeBaseTryAgain: "Por favor, tente novamente ou verifique o console do navegador para mais detalhes.",
        knowledgeBaseSearchLabel: "Buscar:",

        // ===== RESEARCH.JS =====
        researchEnableDeepSearch: "Ativar Pesquisa Profunda",
        researchDeepSearchTooltip: "A Pesquisa Profunda segue links nos resultados de pesquisa para descobrir conteúdo adicional relevante. Isso fornece pesquisa mais abrangente, mas pode demorar mais para ser concluída.",
        researchDeepSearchDepth: "Profundidade:",
        researchDeepSearchLevel1: "1 nível",
        researchDeepSearchLevel2: "2 níveis",
        researchDeepSearchLevel3: "3 níveis",
        researchDeepSearchLinksPerPage: "Links por página:",
        researchDeepSearchLink1: "1 link",
        researchDeepSearchLink2: "2 links",
        researchDeepSearchLink3: "3 links",
        researchDeepSearchLink5: "5 links",

        // Perform research
        researchInProgress: "Pesquisa em Andamento",
        researchProcessAlreadyRunning: "Um processo de pesquisa já está em execução. Por favor, aguarde.",
        researchMissingTopic: "Tópico de Pesquisa Ausente",
        researchEnterTopicPrompt: "Por favor, insira um tópico de pesquisa no campo de entrada acima.",
        researchModelRequired: "Por favor, selecione um modelo da aba Chat primeiro. Um modelo é necessário para a funcionalidade de pesquisa.",
        switchToChatTab: "Alternar para a Aba Chat",
        researchProcess: "Processo de Pesquisa",
        researchStarting: "Iniciando pesquisa...",
        researchGeneratingQueries: "Gerando consultas de pesquisa...",
        researchSearchingInfo: "Procurando por informações...",
        researchProcessingSources: "Processando fontes...",
        researchFinalizingData: "Finalizando dados da pesquisa...",
        researchGeneratingReport: "Gerando relatório de pesquisa...",
        researchComplete: "Pesquisa concluída!",
        researchError: "Erro na Pesquisa",

        // Generate title
        researchInsufficientContent: "Conteúdo insuficiente disponível para resumo.",
        researchSummaryProcessingCompleted: "Processamento de resumo concluído.",
        researchPdfDocumentLabel: "[Documento PDF]",
        researchUntitledPage: "Página Sem Título",

        //Create results
        researchInsufficientContent: "Conteúdo insuficiente disponível para resumo.",
        researchResultsTitle: "Resultados da Pesquisa",
        researchResults: "Resultados da Pesquisa",
        researchReportEditable: "Este relatório de pesquisa é totalmente editável. Faça alterações conforme necessário antes de exportar ou salvar.",
        researchSourcesCount: "Fontes ({count})",
        researchDeepSourcesIncluded: "Inclui {count} fontes secundárias da pesquisa profunda",
        researchViewPDF: "Ver PDF",
        researchExportReport: "Exportar Relatório",
        esearchSaveToKnowledgeBase: "Salvar na Base de Conhecimento",
        researchExportPlainText: "Texto Simples (.txt)",
        researchExportMarkdown: "Markdown (.md)",
        researchExportHTML: "HTML (.html)",
        // Show save
        researchConfirmRemoveSource: "Remover esta fonte?",
        researchResults: "Resultados da Pesquisa",
        researchReportEditable: "Este relatório de pesquisa é totalmente editável. Faça alterações conforme necessário antes de exportar ou salvar.",
        researchReopenPrompt: "Se você fechou, pode clicar aqui para reabrir.",
        exportButton: "Exportar",
        knowledgeBaseNotAvailable: "Base de conhecimento não disponível. Por favor, tente novamente mais tarde.",
        researchModelRequiredForKB: "Por favor, selecione um modelo de pesquisa primeiro antes de salvar na base de conhecimento.",
        saveToKnowledgeBase: "Salvar na Base de Conhecimento",
        researchSaveDescription: "Salvar este relatório de pesquisa na sua base de conhecimento para referência futura.",
        reportTitle: "Título do Relatório",
        sourceOptions: "Opções de Fonte",
        saveSeparateEntries: "Salvar fontes como entradas separadas",
        includeSourcesInReport: "Incluir fontes apenas no relatório principal",
        saveToCollection: "Salvar na Coleção",
        cancelButton: "Cancelar",

        // Show add entry
        addNewKnowledgeEntry: "Adicionar Nova Entrada de Conhecimento",
        entryTitle: "Título da Entrada",
        content: "Conteúdo",
        markdownFormattingNote: "Você pode usar formatação Markdown.",
        cancelButton: "Cancelar",
        saveEntry: "Salvar Entrada",

        // Alerts
        researchProcessAlreadyRunning: "Um processo de pesquisa já está em execução. Por favor, aguarde.",
        pleaseEnterTitle: "Por favor, insira um título para esta entrada.",
        pleaseEnterContent: "Por favor, insira algum conteúdo para esta entrada.",
        collectionNotFound: "Coleção não encontrada",
        failedToUpdateCollection: "Falha ao atualizar coleção",
        failedToDeleteCollection: "Falha ao excluir coleção",
        pleaseEnterReportTitle: "Por favor, insira um título para o relatório",
        pleaseSelectCollection: "Por favor, selecione uma coleção",
        researchSavedSuccessfully: "Pesquisa salva com sucesso na base de conhecimento",
        failedToUpdateEntry: "Falha ao atualizar entrada",

        // Confirmations
        confirmDeleteEntry: "Excluir entrada \"{title}\"? Isso não pode ser desfeito.",
        confirmDeleteCollection: "Excluir coleção \"{name}\" com {count} entradas? Isso não pode ser desfeito.",

        // Buttons
        backToKnowledgeBase: "← Voltar à Base de Conhecimento",
        newEntry: "+ Nova Entrada",
        backToEntries: "← Voltar às Entradas",
        editEntry: "Editar Entrada",
        deleteEntry: "Excluir Entrada",
        enterNewCollectionName: "Digite o novo nome para a coleção:",

        // Status messages
        saving: "Salvando...",
        savingSourceProgress: "Salvando fonte {current} de {total}...",
        researchProcessCancelled: "Processo de pesquisa cancelado",

        // Empty states
        noKnowledgeCollections: "Ainda não há coleções de conhecimento. Crie sua primeira coleção para começar.",
        noEntriesInCollection: "Ainda não há entradas nesta coleção. Clique em \"Nova Entrada\" para adicionar conteúdo.",
        savingSourcesTitle: "Salvando Fontes na Base de Conhecimento",

        // Extras 
        editKnowledgeEntry: "Editar Entrada de Conhecimento",
        saveChanges: "Salvar Alterações",
        created: "Criado",
        noContentForExport: "Nenhum conteúdo disponível para exportação",
        exportedOn: "Exportado em",
        totalEntries: "Total de entradas",
        source: "Fonte",
        saving: "Salvando...",
        saveChanges: "Salvar Alterações",
        deleteEntry: "Excluir Entrada",
        loadingCollections: "Carregando coleções...",
        errorLoadingCollections: "Erro ao carregar coleções",
        createNewCollectionOption: "➕ Criar Nova Coleção...",
        researchReopenPrompt: "Se você fechou, pode clicar aqui para reabrir.",
        knowledgeBaseModelRequired: "Por favor, selecione um modelo da aba Chat primeiro. Um modelo é necessário para gerar embeddings para exibir o conteúdo da coleção.",
        selectModel: "Selecionar Modelo",
        warning: "⚠️ Aviso:",
        info: "ℹ️ Informação:",
        collectionWithEntries: "{name} ({count} entradas)",
        sourcePrefix: "Fonte",
        untitledSource: "Fonte Sem Título",
        failedToExtractContent: "Falha ao extrair conteúdo de {url}: {error}",
        errorLoadingCollections: "Erro ao carregar coleções",
        savingSourceInitial: "Salvando fonte 0 de {total}...",
        researchComplete: "Pesquisa concluída!",
        researchResultsDisplayed: "Seus resultados de pesquisa são exibidos na janela flutuante. Se você a fechou, pode",
        researchReopenLink: "clicar aqui para reabri-la",
        failedToDeleteEntry: "Falha ao excluir entrada",
        factsAndStatistics: "fatos e estatísticas",
        latestResearchOn: "pesquisa mais recente sobre",
        analysis: "análise",
        summaryFailedSuffix: "... (Resumo falhou)",
        failedToGeneratePartialReport: "Falha ao gerar relatório parcial para fontes {start}-{end}: {error}.",
        noReportPartsGenerated: "Nenhuma parte do relatório foi gerada.",
        researchReportTitle: "Relatório de Pesquisa",
        failedToExtractPDF: "Falha ao extrair conteúdo do PDF",
        pdfCouldNotBeProcessed: "Documento PDF não pôde ser processado. Clique em 'Ver PDF' para abrir diretamente.",
        pdfCouldNotBeFullyProcessed: "Documento PDF não pôde ser totalmente processado. Clique em 'Ver PDF' para abrir diretamente.",
        summaryProcessingCompleted: "Processamento de resumo concluído.",
        failedToCreateNewCollection: 'Falha ao criar nova coleção: {error}',
        failedToSaveToKnowledgeBase: 'Falha ao salvar na base de conhecimento: {error}',
        failedToExtractContentFrom: 'Falha ao extrair conteúdo de {url}',
        failedToExtractContent: 'Falha ao extrair conteúdo',
        never: 'Nunca',
        entries: 'Entradas',
        lastUpdated: 'Última atualização',
        view: 'Ver',
        edit: 'Editar',
        export: 'Exportar',
        delete: 'Excluir',
        exportUtilityNotAvailable: 'Utilitário de exportação não disponível. Por favor, tente novamente mais tarde.',
        saveEntry: 'Salvar Entrada',
        saving: 'Salvando',
        generatingEmbeddings: 'Gerando embeddings...',
        entrySavedSuccessfully: 'Entrada salva com sucesso',
        error: 'Erro',
        researchSaveToKnowledgeBase: 'Salvar na Base de Conhecimento',
        sourcePrefix: "Fonte",
        untitledSource: "Fonte Sem Título",
        sourceFromResearch: "Fonte da pesquisa",
        summary: "Resumo",
        sourceURL: "URL da Fonte",
        noSummaryAvailable: "Nenhum resumo disponível",
        entryCreatedAsSourceReference: "Esta entrada foi criada como referência de fonte para o relatório de pesquisa",

        // ===== CODEPREVIEW.JS =====

        previewModalCreateError: "Não foi possível criar modal de pré-visualização HTML",
        previewErrorOnLine: "Erro na linha",
        previewColumn: "coluna",
        previewRefreshTooltip: "Atualizar Pré-visualização",
        previewMaximize: "Maximizar",
        previewRestore: "Restaurar",
        previewClose: "Fechar",




        // ===== EXPORT.JS =====
        conversationPrefix: "Conversa",
        exportFilename: "Nome do arquivo",
        filenameRequired: "Por favor, insira um nome de arquivo",

        // ===== STREAMPROCESSOR.JS =====

        modelThinking: 'Modelo pensando: ',
        modelThoughtComplete: 'Pensamento completo: ',
        toggleThinkingVisibility: 'Alternar visibilidade do processo de pensamento',
        thinkingTime: 'Tempo de pensamento',
        thinkingCollapsed: 'Mostrar processo de pensamento',
        thinkingExpanded: 'Ocultar processo de pensamento',
        modelThinkingCancelled: 'Pensamento cancelado: ',
        // Code Preview messages
        previewLoadingMessage: "Carregando pré-visualização...",
        previewJsError: "Erro JavaScript:",
        previewHtmlError: "Pré-visualização HTML com Erros",
        previewErrorInCode: "Erro no código HTML",
        previewYourCode: "Seu código é mostrado abaixo com erros:",
        previewTitle: "Pré-visualização HTML",
        previewViewAsDesktop: "Desktop",
        previewViewAsTablet: "Tablet",
        previewViewAsMobile: "Móvel",
        previewRefreshTooltip: "Atualizar Pré-visualização",
        previewMaximize: "Maximizar",
        previewRestore: "Restaurar",
        previewClose: "Fechar",
        // Code Styling messages
        codeCopyButton: "Copiar",
        codeCopied: "Copiado!",
        codeRunButton: "Executar",
        codeCopyError: "Erro",
        codeToggleLineNumbersTitle: "Alternar Números de Linha",
        codeToggleLineNumbers: "Números de Linha",
        thinkingContentNotRestored: 'O conteúdo do pensamento não pôde ser restaurado. Isso pode acontecer se a IA estivesse pensando brevemente antes de responder.',
        codeCopyWithLinesButton: 'Copiar com #',


        // ===== RAG.JS =====

        // Notices
        ragModelNotCompatibleTitle: "Modelo Não Compatível com Busca de Documentos",
        ragModelNotCompatibleMessage: "O modelo <strong>{model}</strong> não suporta embeddings, que são necessários para busca de documentos e funcionalidade RAG.",
        ragModelSelectCompatible: "Por favor, selecione um modelo que suporte embeddings (como nomic-embed-text, llama3, mistral ou modelos mixtral).",
        ragFindEmbeddingModels: "Encontrar modelos com capacidade de embedding",
        ragIUnderstand: "Eu Entendo",
        ragProcessingDocuments: "Processando documentos...",
        ragProcessingFile: "Processando arquivo: {filename}",

        // ===== SECURITYUTILS.JS =====

        securityFinalDeleteWarning: 'AVISO FINAL: Isso excluirá permanentemente TODOS os dados de TODOS os perfis.\n\n' +
            'Isso inclui:\n' +
            '• Todas as conversas e histórico de chat\n' +
            '• Todos os documentos enviados\n' +
            '• Todos os insights e preferências do usuário\n' +
            '• Todas as configurações e configurações de modelo\n\n' +
            'Esta ação não pode ser desfeita. Você tem certeza absoluta?',
        securityDeleting: 'Excluindo...',
        securityDataDeletedSuccess: 'Todos os dados foram permanentemente excluídos. O aplicativo irá recarregar agora.',
        securityDeleteError: 'Erro ao excluir dados. Por favor, tente novamente.',
        securityDeletionError: 'Ocorreu um erro durante a exclusão. Por favor, tente novamente.',
        securitySetupPasswordTitle: 'Configurar Senha de Proteção',
        securitySetupPasswordMessage: 'Para proteger contra exclusão acidental, por favor configure uma senha de proteção:',
        securityPasswordsNoMatch: 'As senhas não coincidem. Por favor, tente novamente.',
        securityPasswordTooShort: 'A senha deve ter pelo menos 6 caracteres.',
        securityPasswordSetSuccess: 'A senha de proteção foi configurada com sucesso.',
        securityPasswordSetupError: 'Erro ao configurar senha de proteção. Por favor, tente novamente.',
        securityVerifyPasswordTitle: 'Digite a Senha de Proteção',
        securityVerifyPasswordMessage: 'Por favor, digite sua senha de proteção para continuar com a exclusão:',
        securityIncorrectPassword: 'Senha incorreta. Acesso negado.',
        securityVerifyPasswordError: 'Erro ao verificar senha. Por favor, tente novamente.',
        securitySetPassword: 'Definir Senha',
        securityVerify: 'Verificar',
        securityResetPassword: 'Redefinir Senha',
        cancel: 'Cancelar',
        securityEnterCurrentPasswordFirst: 'Por favor, digite sua senha atual primeiro',
        securityIncorrectCurrentPassword: 'Senha atual incorreta. Não é possível redefinir.',
        securityEnterPasswordPlaceholder: "Digite a senha de proteção",
        securityConfirmPasswordPlaceholder: "Confirme a senha de proteção",
        securityShowPassword: "Mostrar senha",
        securityHidePassword: "Ocultar senha",

        // ===== SELECTION.JS =====

        masterkeyRequired: 'Por favor, digite uma Chave Mestre anterior ou nova',
        initializing: 'Inicializando...',
        errorStartingConversation: 'Houve um erro ao iniciar a conversa. Por favor, tente novamente.',

        // ===== VERSION.JS =====
        checkingForUpdates: "Verificando atualizações...",
        updateAvailable: "Atualização Disponível",
        newVersionAvailable: "Uma nova versão do Paiperwork está disponível!",
        currentVersion: "Versão atual",
        newVersion: "Nova versão",
        released: "Lançado",
        whatsNew: "O que há de novo",
        later: "Mais tarde",
        downloadUpdate: "Baixar Atualização",
        upToDate: "Você está atualizado",
        runningLatestVersion: "Você está executando a versão mais recente do Paiperwork",
        ok: "OK",
        updateCheckFailed: "Falha na Verificação de Atualização",
        unableToCheckUpdates: "Não foi possível verificar atualizações.",
        tryAgainLater: "Por favor, tente novamente mais tarde ou verifique manualmente em nosso site.",


        // ===== SUBJECTIVEINTERACTIONS.JS =====
        generatingInsight: 'Gerando insight...',

        // ===== WEBSEARCH.JS =====
        webSearchEmptyQuery: "Consulta de busca vazia",
        webSearchCancelled: "Operação de busca foi cancelada",
        webSearchErrorDetails: "Erro: {error}. Verifique o console para detalhes.",
        webSearchFailed: "Busca falhou: {error}",

        // Web Search Error Messages (additional keys)
        webSearchErrorOccurred: "Erro de busca ocorreu",
        webSearchErrorSource: "Erro",
        webSearchDefaultTitle: "Resultado da Busca",
        webSearchUnknownSource: "Fonte desconhecida",
        webSearchProxyMessage: "Clique aqui para ver os resultados da busca usando nosso proxy de busca.",
        webSearchProxySource: "Proxy de Busca",

        // Web Search
        webSearchEmptyQuery: "Consulta de busca vazia",
        webSearchCancelled: "Operação de busca foi cancelada",
        webSearchErrorOccurred: "Erro de busca ocorreu",
        webSearchErrorDetails: "Erro: {error}. Verifique o console para detalhes.",
        webSearchErrorSource: "Erro",
        webSearchFailed: "Busca falhou: {error}",
        webSearchDefaultTitle: "Resultado da Busca",
        webSearchUnknownSource: "Fonte desconhecida",
        webSearchResultsForQuery: "Resultados da busca para \"{query}\"",
        webSearchProxyMessage: "Clique aqui para ver os resultados da busca usando nosso proxy de busca.",
        webSearchProxySource: "Proxy de Busca",
        webSearchPerformed: "Busca realizada",
        webSearchStrategy: "Estratégia de busca",
        webSearchEncounteredIssue: "A busca encontrou um problema",
        webSearchExtractedContent: "Conteúdo Extraído dos Principais Resultados",
        webSearchFromRef: "De [{refId}] {title}",
        webSearchWeatherInfo: "Informações do Tempo",
        webSearchResults: "Resultados da Busca Web",
        webSearchSource: "Fonte",
        webSearchNoResultsFound: "Nenhum resultado encontrado",

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