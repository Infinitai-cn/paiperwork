const ORCHESTRATOR_SYSTEM_PROMPT = `You are an internal routing assistant for Paiperwork.
Your job is to decide whether an incoming user message should be handled by the normal chat flow ("chat"), by the chat+websearch flow ("chat+websearch"), by document-check ("document-check"), by the research workflow ("research"), or by the promptable SlideForge presentation workflow ("presentation").

Instructions:
- Do NOT produce natural chat replies. Under no circumstances generate conversational text as output.
- Always respond with valid JSON only, with fields: tool, document, confidence, reason, language, think (false).
- Do NOT include any extra text, analysis, or commentary outside the JSON object.
- If you cannot parse intent or format JSON, return exactly: { "tool": "chat", "document": "", "confidence": 0.9, "reason": "Unable to parse intent as JSON", "language": "English", "think": false }
- Always reply in the user language of the input message (English, Español, Français, Deutsch, Italiano, Português, 中文, 日本語, 한국어, Русский).
- Use explicit multilingual intent mapping for key actions:
  - Data-viz command examples:
    - English: "Create a demo pie chart", "Show me a bar graph" => dataviz
    - Español: "Crear un gráfico de pastel de demostración", "Haz un gráfico de barras" => dataviz
    - Français: "Créer un graphique camembert de démonstration", "Afficher un graphique à barres" => dataviz
    - Deutsch: "Erstelle ein Kreisdiagramm zur Demonstration", "Zeige ein Balkendiagramm" => dataviz
    - Italiano: "Crea un grafico a torta dimostrativo", "Mostra grafico a barre" => dataviz
    - Português: "Criar gráfico de pizza de demonstração", "Mostrar gráfico de barras" => dataviz
    - 中文: "创建演示饼图", "显示柱状图" => dataviz
    - 日本語: "デモの円グラフを作成", "棒グラフを表示" => dataviz
    - 한국어: "데모 파이 차트 작성", "막대 그래프 보여줘" => dataviz
  - Research command examples:
    - English: "Research the latest AI trends" → research
    - Español: "Investigar las últimas tendencias de IA" → research
    - Presentation command examples:
        - English: "Create a presentation with this text: ..." => presentation
        - Español: "Crea una presentación con este texto: ..." => presentation
        - Português: "Cria uma apresentação com este texto: ..." => presentation
        - English: "Show my saved presentations" => presentation
        - English: "Send my saved Mercedes presentation" => presentation
    - Model-management command examples:
        - English: "Show me my models" → chat
        - English: "What model is selected now?" → chat
        - English: "Use Gemma4 Local" → chat
        - Español: "Muéstrame mis modelos" → chat
        - Português: "Mostra meus modelos" → chat
  - Document intent examples:
    - English: "Summarize my invoice.pdf" → document-check
    - Español: "Resumen mi informe" → document-check
- If user asks for updated facts, citations, or current events in any supported language, prefer "chat+websearch".
- If user asks for explicit file/document interaction in any language, prefer "document-check".
- If user requests planning, comparative analysis, research reports, or deep investigation in any language, prefer "research".
- If user asks to create, generate, build, or prepare a presentation or slide deck from provided text/content, prefer "presentation".
- If user asks to list, browse, view, choose, or send an existing saved presentation, also prefer "presentation".
- For ambiguous conversational text in any language, default to "chat".
- Decide ONLY one tool per request; do not emit multiple tool values.
- Ignore any internal "thinking" markers or tags (for example: <think>...</think>, <thinking>...</thinking>, and text like "🤖 Thinking..."). Treat those as not part of the user's request.
- Handle multi-language requests robustly using these keyword signals.
- Prefer "chat+websearch" when the user explicitly requests web lookups, asks for current events, requests citations, or asks for verifiable/up-to-date facts.
- Prefer "research" when the user asks for a research-style workflow, comprehensive topic analysis, or actionable insights (examples: "research the latest AI trends", "prepare a report on market dynamics", "investigate competitor strategies", "what is the best approach for market research?").
- Requests about available AI models, the current selected model, installed models, switching models, choosing between local/cloud models, or commands like "show me my models" / "what model is selected now" / "use Gemma4 local" are NOT document requests. Route those to "chat" so the frontend can handle model management.
- Choose "document-check" whenever the user explicitly or implicitly asks to interact with saved documents or files. Use semantic intent matching (not just exact text matches) and fuzzy document-name matching (close titles, partial names, alternate case, punctuation variations) so varied forms like "I want to review my recent reports", "find the PDF about taxes", "can you open that contract", "browse my docs", and "show me my uploads" are all treated as document-check. Also treat forms like "ask a question to <document>", "question this document", "ask about <document>", "a question for <doc title>" as document-check intent (not general knowledge questions without explicit document reference). If the user asks to "summarize" or "ask about" a near-matching document name (e.g. "Summarize a call to action" vs "A_Call_to_Action_for_Generative_AI.pdf"), prefer document-check with the closest candidate. Do not set document-check for generic conversational queries like "What day is today?", "Who won the game?", or "How do I boil pasta?" unless there is explicit document context. Examples of document intent: "my documents", "check my documents", "list my documents", "summarize my file", "summarize invoice.pdf", "ask questions about my report", "open the contract named X", "review the uploaded files", or when the user mentions uploading content to be checked. In these cases:
    - If you can confidently identify a specific saved document, set the "document" field to that exact filename or id.
    - If you cannot confidently identify a specific document (user didn't supply a filename or the name is ambiguous), set the tool to "document-check" and set the "document" field to an empty string so the frontend can ask the user to choose from candidate documents.
    - Do not choose "chat" merely because a filename is missing; prefer "document-check" when document intent is clear.

- Use only already ingested documents from the app. Do not ask users to send or upload new files via WhatsApp; those are forbidden for security reasons.
- If document intent is ambiguous (e.g. "a document", "some doc" with no explicit existing filename), choose "document-check" and set "document" to ""; do not reroute to chat or ask for attachments.
- If user intent is still unclear after document-check, instruct them with "Please clarify your question".
- Detect the user language and include a "language" field in the JSON output (e.g. "de", "zh", "en", "es").

- Always include a sample JSON with language when returning tool selection, e.g.:
  { "tool": "chat", "document": "", "confidence": 0.9, "reason": "Casual conversational request.", "language": "Spanish", "think": false }

Examples of inputs and the exact JSON you must output (output must be valid JSON only, no text):
Input: "Summarize my invoice.pdf"
Output: { "tool": "document-check", "document": "invoice.pdf", "confidence": 0.95, "reason": "User explicitly requested a summary for a named saved file." }

Input: "I want to check my documents"
Output: { "tool": "document-check", "document": "", "confidence": 0.9, "reason": "User expressed intent to check saved documents but did not name one." }

Input: "What's the weather today?"
Output: { "tool": "chat+websearch", "document": "", "confidence": 0.95, "reason": "Explicit web-query requesting current information." }

Input: "Tell me a joke"
Output: { "tool": "chat", "document": "", "confidence": 0.9, "reason": "Casual conversational request with no document or web-intent." }

Input: "Research the latest trends in electric vehicle batteries and summarize opportunities for startups."
Output: { "tool": "research", "query": "latest trends in electric vehicle batteries and opportunities for startups", "confidence": 0.95, "reason": "Explicit research-style request with analytical intent." }

Input: "Create a presentation with this text: Our 2026 roadmap focuses on AI automation, cloud cost controls, and customer expansion across Europe."
Output: { "tool": "presentation", "document": "", "confidence": 0.95, "reason": "User explicitly requested a slide presentation from provided text.", "language": "English", "think": false }

Output ONLY valid JSON and nothing else. Do NOT include markdown fence markers (three backticks) or any additional explanation. Do NOT emit code blocks. If your response is not strictly valid JSON, return:
{"tool":"chat","document":"","confidence":0.9,"reason":"Unable to parse intent as JSON"}

If unsure, choose "chat".
`;

class ConnectorWhatsapp {
    constructor() {
        this.incomingPollInterval = null;
        this.incomingPollIntervalMs = 2500;
        this.whatsappIncomingRetryQueue = [];
        this._whatsappPresenceStarted = false;
        this._whatsappPresenceChatId = '';
        this._whatsappPresenceKeepAliveTimer = null;
        this._whatsappPresenceKeepAliveIntervalMs = 8000;
        this._orchestratorModalActiveCount = 0;
        this._whatsappPendingDocSelection = {}; // keyed by normalized phone
        this._whatsappPendingPresentationSelection = {}; // keyed by normalized phone
    }

    _ensureWhatsappOrchestratorModalStyles() {
        if (document.getElementById('whatsapp-orchestrator-modal-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'whatsapp-orchestrator-modal-styles';
        style.textContent = `
            @keyframes whatsapp-orchestrator-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    _showWhatsappOrchestratorModal() {
        if (typeof document === 'undefined' || !document.body) return;

        this._orchestratorModalActiveCount += 1;
        if (this._orchestratorModalActiveCount > 1) {
            return;
        }

        this._ensureWhatsappOrchestratorModalStyles();

        const existing = document.getElementById('whatsapp-orchestrator-modal');
        if (existing) {
            existing.style.display = 'flex';
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'whatsapp-orchestrator-modal';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '10030';
        overlay.style.background = 'var(--modal-overlay-bg, rgba(30, 30, 30, 0.7))';
        overlay.style.backdropFilter = 'blur(4px)';
        overlay.style.webkitBackdropFilter = 'blur(4px)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';

        const modal = document.createElement('div');
        modal.style.width = 'min(420px, calc(100vw - 32px))';
        modal.style.minHeight = '220px';
        modal.style.maxHeight = 'calc(100vh - 32px)';
        modal.style.background = 'var(--presentation-modal-bg, var(--panel-background, #222426))';
        modal.style.border = '1px solid var(--border-color, #404040)';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
        modal.style.padding = '22px';
        modal.style.boxSizing = 'border-box';
        modal.style.overflowY = 'auto';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.gap = '14px';
        modal.style.textAlign = 'center';

        const spinner = document.createElement('div');
        spinner.style.width = '28px';
        spinner.style.height = '28px';
        spinner.style.border = '3px solid var(--wa-modal-spinner-track, #c4c4c4)';
        spinner.style.borderTopColor = 'var(--wa-modal-spinner-accent, #0b74de)';
        spinner.style.borderRadius = '50%';
        spinner.style.animation = 'whatsapp-orchestrator-spin 0.9s linear infinite';

        const title = document.createElement('div');
        title.textContent = (window.Lang && typeof Lang.get === 'function' && Lang.get('orchestratorWorkingTitle')) || 'Orchestrator working';
        title.style.fontSize = '16px';
        title.style.fontWeight = '600';
        title.style.color = 'var(--text-color, #ffffff)';

        const description = document.createElement('div');
        description.textContent = (window.Lang && typeof Lang.get === 'function' && Lang.get('orchestratorWorkingMessage')) || 'Routing the incoming WhatsApp request. Please wait...';
        description.style.fontSize = '13px';
        description.style.lineHeight = '1.45';
        description.style.color = 'var(--wa-modal-status-color, #d1d5db)';

        const disconnectBtn = document.createElement('button');
        disconnectBtn.id = 'whatsapp-orchestrator-disconnect';
        disconnectBtn.textContent = (window.Lang && typeof Lang.get === 'function' && Lang.get('disconnectServer')) || 'Disconnect server';
        disconnectBtn.style.marginTop = '10px';
        disconnectBtn.style.minWidth = '190px';
        disconnectBtn.style.padding = '10px 18px';
        disconnectBtn.style.background = 'var(--wa-modal-disconnect-btn-bg, #d97706)';
        disconnectBtn.style.color = 'var(--wa-modal-disconnect-btn-text, #ffffff)';
        disconnectBtn.style.border = 'none';
        disconnectBtn.style.borderRadius = '6px';
        disconnectBtn.style.cursor = 'pointer';
        disconnectBtn.style.fontSize = '14px';
        disconnectBtn.style.fontWeight = '600';
        disconnectBtn.addEventListener('click', async () => {
            if (!window.connectorsTab || typeof window.connectorsTab.stopWhatsappServer !== 'function') {
                return;
            }

            disconnectBtn.disabled = true;
            disconnectBtn.style.opacity = '0.7';
            disconnectBtn.style.cursor = 'not-allowed';

            try {
                await window.connectorsTab.stopWhatsappServer();
            } catch (err) {
                console.warn('ConnectorWhatsapp: orchestrator modal disconnect server failed', err);
                disconnectBtn.disabled = false;
                disconnectBtn.style.opacity = '1';
                disconnectBtn.style.cursor = 'pointer';
            }
        });

        modal.appendChild(spinner);
        modal.appendChild(title);
        modal.appendChild(description);
        modal.appendChild(disconnectBtn);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    _hideWhatsappOrchestratorModal() {
        this._orchestratorModalActiveCount = Math.max(0, this._orchestratorModalActiveCount - 1);
        if (this._orchestratorModalActiveCount > 0) {
            return;
        }

        const overlay = document.getElementById('whatsapp-orchestrator-modal');
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }

    _normalizeWhatsappIdentity(value) {
        return String(value || '').replace(/@.*$/g, '').trim();
    }

    _isWhatsappBotMode() {
        return String(window.whatsappSelectedMode || 'personal').trim().toLowerCase() === 'bot';
    }

    _isWhatsappModelLocked() {
        if (window.connectorsTab && typeof window.connectorsTab.whatsappModelLocked !== 'undefined') {
            return window.connectorsTab.whatsappModelLocked === true;
        }

        return window.whatsappModelLocked === true || String(window.whatsappModelLocked || '').trim().toLowerCase() === 'true';
    }

    async _getWhatsappModelLockState() {
        if (this._isWhatsappModelLocked()) {
            return true;
        }

        const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
        const dbHandle = window.PaiperworkDB || (typeof PaiperworkDB !== 'undefined' ? PaiperworkDB : null);
        if (!hashedMasterKey || !dbHandle || typeof dbHandle.getWhatsappModelLock !== 'function') {
            return false;
        }

        try {
            const locked = await dbHandle.getWhatsappModelLock(hashedMasterKey);
            window.whatsappModelLocked = !!locked;
            if (window.connectorsTab) {
                window.connectorsTab.whatsappModelLocked = !!locked;
            }
            return !!locked;
        } catch (error) {
            console.warn('[ConnectorWhatsapp][models] Failed to read WhatsApp model lock state', error);
            return false;
        }
    }

    _isWhatsappGroupChatId(chatId) {
        return /@g\.us\s*$/i.test(String(chatId || '').trim());
    }

    _getWhatsappIncomingThreadKey(msg) {
        if (this._isWhatsappBotMode()) {
            const chatId = String(msg?.chat_id || '').trim();
            if (this._isWhatsappGroupChatId(chatId)) {
                return this._normalizeWhatsappIdentity(chatId);
            }
            return this._normalizeWhatsappIdentity(msg?.from || msg?.fromJid || msg?.chat_id || msg?.from_name);
        }
        return this._normalizeWhatsappIdentity(msg?.chat_id || msg?.from || msg?.from_name || msg?.fromJid);
    }

    _getWhatsappIncomingReplyTarget(msg) {
        return String(msg?.chat_id || msg?.from || msg?.fromJid || '').trim();
    }

    _formatWhatsappBotThreadLabel(msg) {
        const chatId = String(msg?.chat_id || '').trim();
        const isGroup = this._isWhatsappGroupChatId(chatId);
        const senderName = String(msg?.from_name || '').trim();
        const senderPhone = this._normalizeWhatsappIdentity(msg?.from || msg?.fromJid || msg?.chat_id);
        const identity = senderName && senderPhone
            ? `${senderName} (${senderPhone})`
            : (senderName || senderPhone || 'Unknown user');
        if (isGroup) {
            return `Group conversation ${this._normalizeWhatsappIdentity(chatId)} started by ${identity}`;
        }
        return `Conversation started by ${identity}`;
    }

    _getResolvedWhatsappOutgoingTarget(chatId) {
        const requestedTarget = String(chatId || '').trim();
        if (!requestedTarget) return '';

        const pendingReplyTarget = String(window.chatInstance?.whatsappPendingReplyChatId || window.chat?.whatsappPendingReplyChatId || '').trim();
        const pendingIdentityKey = this._normalizeWhatsappIdentity(
            window.chatInstance?.whatsappPendingReplyIdentityKey || window.chat?.whatsappPendingReplyIdentityKey || ''
        );
        const normalizedRequestedTarget = this._normalizeWhatsappIdentity(requestedTarget);

        if (pendingReplyTarget && pendingIdentityKey && normalizedRequestedTarget === pendingIdentityKey) {
            return pendingReplyTarget;
        }

        if (this._isWhatsappGroupChatId(requestedTarget)) {
            return requestedTarget;
        }

        return this._normalizeWhatsappIdentity(requestedTarget);
    }

    async _activateWhatsappConversationGroup(groupId, sessionPreview = 'Conversation') {
        if (!groupId || !window.chatTab || typeof window.chatTab.loadSessionConversation !== 'function') {
            return;
        }

        const timestamp = new Date().toISOString();
        await window.chatTab.loadSessionConversation({
            group_id: groupId,
            preview: sessionPreview,
            timestamp
        });

        try {
            document.querySelectorAll('.session-item').forEach(item => {
                const isActive = String(item.dataset.groupId || '') === String(groupId);
                item.classList.toggle('active', isActive);
                item.style.backgroundColor = isActive ? 'rgba(79, 70, 229, 0.08)' : '';
                item.style.borderLeft = isActive ? '3px solid #4f46e5' : '';
            });
        } catch (err) {
            console.warn('ConnectorWhatsapp: failed to update active conversation item', err);
        }
    }

    async _ensureWhatsappBotConversationThread(msg, threadKey, existingPhoneContext = null) {
        if (!this._isWhatsappBotMode()) {
            return existingPhoneContext || null;
        }

        const normalizedThreadKey = this._normalizeWhatsappIdentity(threadKey);
        if (!normalizedThreadKey) {
            return existingPhoneContext || null;
        }

        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!hashedMasterKey) {
            return existingPhoneContext || null;
        }

        const phoneContext = (existingPhoneContext && typeof existingPhoneContext === 'object')
            ? { ...existingPhoneContext }
            : ((await this._getWhatsappPhoneContext(normalizedThreadKey)) || {});

        const threadLabel = this._formatWhatsappBotThreadLabel(msg);
        let conversationGroup = Number(phoneContext.botConversationGroup || 0);
        let hasExistingGroup = false;

        if (conversationGroup > 0) {
            try {
                const existingGroup = await PaiperworkDB.loadConversationsByGroup(hashedMasterKey, conversationGroup);
                hasExistingGroup = !!(existingGroup && Array.isArray(existingGroup.conversations) && existingGroup.conversations.length > 0);
            } catch (err) {
                console.warn('ConnectorWhatsapp: failed to validate existing bot conversation group', err);
            }
        }

        if (!hasExistingGroup) {
            const bootstrapAssistantMessage = '<div class="ai-response-container whatsapp-thread-bootstrap" style="display:none" data-whatsapp-thread-bootstrap="true"></div>';
            const created = await PaiperworkDB.storeConversationOnly(
                hashedMasterKey,
                threadLabel,
                bootstrapAssistantMessage,
                true,
                null
            );

            if (!created || !window.currentConversationGroup) {
                console.warn('ConnectorWhatsapp: failed to create bot conversation group', { threadKey: normalizedThreadKey });
                return phoneContext;
            }

            conversationGroup = Number(window.currentConversationGroup || 0);
            phoneContext.botConversationStartedAt = phoneContext.botConversationStartedAt || new Date().toISOString();
        }

        phoneContext.botConversationGroup = conversationGroup;
        phoneContext.botThreadLabel = threadLabel;
        await this._setWhatsappPhoneContext(normalizedThreadKey, phoneContext);

        try {
            if (window.chatInstance && typeof window.chatInstance.refreshConversationListIfNeeded === 'function') {
                await window.chatInstance.refreshConversationListIfNeeded(hashedMasterKey, conversationGroup);
            }
        } catch (err) {
            console.warn('ConnectorWhatsapp: failed to refresh conversation list for bot thread', err);
        }

        await this._activateWhatsappConversationGroup(conversationGroup, threadLabel);
        return phoneContext;
    }

    _getPendingDocSelection(phone) {
        const key = String(phone || '').replace(/@.*$/g, '').trim();
        if (window.RAG_Utils && typeof window.RAG_Utils.getPendingDocumentConversationSelection === 'function') {
            return window.RAG_Utils.getPendingDocumentConversationSelection(`whatsapp:${key}`) || null;
        }
        return this._whatsappPendingDocSelection[key] || null;
    }

    _setPendingDocSelection(phone, documentInfo) {
        const key = String(phone || '').replace(/@.*$/g, '').trim();
        if (window.RAG_Utils && typeof window.RAG_Utils.setPendingDocumentConversationSelection === 'function') {
            window.RAG_Utils.setPendingDocumentConversationSelection(`whatsapp:${key}`, documentInfo || null);
        }
        if (!documentInfo) {
            delete this._whatsappPendingDocSelection[key];
            return;
        }
        this._whatsappPendingDocSelection[key] = documentInfo;
    }

    _clearPendingDocSelection(phone) {
        const key = String(phone || '').replace(/@.*$/g, '').trim();
        if (window.RAG_Utils && typeof window.RAG_Utils.clearPendingDocumentConversationSelection === 'function') {
            window.RAG_Utils.clearPendingDocumentConversationSelection(`whatsapp:${key}`);
        }
        delete this._whatsappPendingDocSelection[key];
    }

    _getPendingPresentationSelection(phone) {
        const key = String(phone || '').replace(/@.*$/g, '').trim();
        return this._whatsappPendingPresentationSelection[key] || null;
    }

    _setPendingPresentationSelection(phone, selectionInfo) {
        const key = String(phone || '').replace(/@.*$/g, '').trim();
        if (!selectionInfo) {
            delete this._whatsappPendingPresentationSelection[key];
            return;
        }
        this._whatsappPendingPresentationSelection[key] = selectionInfo;
    }

    _clearPendingPresentationSelection(phone) {
        const key = String(phone || '').replace(/@.*$/g, '').trim();
        delete this._whatsappPendingPresentationSelection[key];
    }

    _isActiveDocumentModeFor(documentId) {
        const activeDocumentId = String(localStorage.getItem('ragQuestioningDocumentId') || '').trim();
        return !!documentId && activeDocumentId === String(documentId).trim();
    }

    _getWhatsappDocumentScopeKey(phone) {
        return `whatsapp:${String(phone || '').replace(/@.*$/g, '').trim()}`;
    }

    _isWhatsappDocumentScopeActive(phone) {
        if (window.RAG_Utils && typeof window.RAG_Utils.getActiveDocumentConversation === 'function') {
            const active = window.RAG_Utils.getActiveDocumentConversation(this._getWhatsappDocumentScopeKey(phone));
            return !!(active && active.documentId);
        }
        return !!localStorage.getItem('ragQuestioningDocumentId');
    }

    async _activateWhatsappDocumentScope(phone, documentInfo) {
        const scopeKey = this._getWhatsappDocumentScopeKey(phone);
        if (window.RAG_Utils && typeof window.RAG_Utils.activateDocumentConversationScope === 'function') {
            return window.RAG_Utils.activateDocumentConversationScope(scopeKey, documentInfo, { force: true });
        }
        const questionFn = (typeof enableDocumentQuestioningMode === 'function' && enableDocumentQuestioningMode) || (window.RAG_Utils && window.RAG_Utils.enableDocumentQuestioningMode);
        if (typeof questionFn === 'function') {
            return questionFn(documentInfo.id, { force: true });
        }
        return false;
    }

    _exitWhatsappDocumentScope(phone) {
        const scopeKey = this._getWhatsappDocumentScopeKey(phone);
        if (window.RAG_Utils && typeof window.RAG_Utils.exitDocumentConversationScope === 'function') {
            window.RAG_Utils.exitDocumentConversationScope(scopeKey);
            return;
        }
        if (typeof exitDocumentQuestioningMode === 'function') {
            exitDocumentQuestioningMode();
        } else if (window.RAG_Utils && typeof window.RAG_Utils.exitDocumentQuestioningMode === 'function') {
            window.RAG_Utils.exitDocumentQuestioningMode();
        }
    }

    _getWhatsappOrchestratorContext(phone) {
        const key = String(phone || '').replace(/@.*$/g, '').trim();
        if (!window._whatsappOrchestratorContext) window._whatsappOrchestratorContext = {};
        return window._whatsappOrchestratorContext[key] || null;
    }

    _setWhatsappOrchestratorContext(phone, context) {
        const key = String(phone || '').replace(/@.*$/g, '').trim();
        if (!window._whatsappOrchestratorContext) window._whatsappOrchestratorContext = {};
        window._whatsappOrchestratorContext[key] = context;
    }

    async _getWhatsappPhoneContext(phone) {
        if (!phone) return null;
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey') || 'default';
        const normalizedPhone = this._normalizeWhatsappIdentity(phone);

        try {
            const context = await PaiperworkDB.getWhatsappPhoneContext(hashedMasterKey, normalizedPhone);
            return context || null;
        } catch (err) {
            console.warn('ConnectorWhatsapp: _getWhatsappPhoneContext failed', err);
            return null;
        }
    }

    async _setWhatsappPhoneContext(phone, context) {
        if (!phone || !context) return;
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey') || 'default';
        const normalizedPhone = this._normalizeWhatsappIdentity(phone);

        try {
            await PaiperworkDB.saveWhatsappPhoneContext(hashedMasterKey, normalizedPhone, context);
        } catch (err) {
            console.warn('ConnectorWhatsapp: _setWhatsappPhoneContext failed', err);
        }
    }

    _cloneOllamaContextPayload(payload) {
        return Array.isArray(payload) ? [...payload] : null;
    }

    _normalizeWhatsappConversationTurns(turns, maxTurns = 20) {
        if (!Array.isArray(turns)) return [];

        const normalized = turns
            .map(turn => ({
                role: String(turn && turn.role ? turn.role : '').trim().toLowerCase(),
                text: String(turn && (turn.text || turn.content || '') ? (turn.text || turn.content || '') : '').trim()
            }))
            .filter(turn => (turn.role === 'user' || turn.role === 'assistant') && turn.text);

        if (normalized.length <= maxTurns) {
            return normalized;
        }
        return normalized.slice(normalized.length - maxTurns);
    }

    _normalizeWhatsappOrchestratorTurns(turns, maxTurns = 6) {
        const normalized = this._normalizeWhatsappConversationTurns(turns, 50)
            .filter(turn => turn.role === 'user');

        if (normalized.length <= maxTurns) {
            return normalized;
        }
        return normalized.slice(normalized.length - maxTurns);
    }

    _buildWhatsappRoutingState(phoneContext = null, phone = '') {
        void phone;
        const persisted = phoneContext && typeof phoneContext === 'object' ? phoneContext : {};
        const persistedTurns = this._normalizeWhatsappConversationTurns(persisted.conversationTurns || []);
        return {
            localPreviousContext: this._cloneOllamaContextPayload(persisted.localPreviousContext),
            conversationTurns: persistedTurns
        };
    }

    _appendWhatsappOrchestratorContext(phone, entry) {
        const key = String(phone || '').replace(/@.*$/g, '').trim();
        if (!key || !entry) return;

        const current = this._getWhatsappOrchestratorContext(key) || [];
        const normalized = Array.isArray(current) ? [...current] : [];
        normalized.push({
            role: String(entry.role || '').trim().toLowerCase(),
            text: String(entry.text || entry.content || '').trim()
        });
        this._setWhatsappOrchestratorContext(key, this._normalizeWhatsappOrchestratorTurns(normalized));
    }

    async _appendWhatsappPhoneConversationTurn(phone, entry, existingPhoneContext = null) {
        const normalizedPhone = String(phone || '').replace(/@.*$/g, '').trim();
        if (!normalizedPhone || !entry) return existingPhoneContext || null;

        const phoneContext = (existingPhoneContext && typeof existingPhoneContext === 'object')
            ? { ...existingPhoneContext }
            : ((await this._getWhatsappPhoneContext(normalizedPhone)) || {});

        const existingTurns = this._normalizeWhatsappConversationTurns(phoneContext.conversationTurns || []);
        existingTurns.push({
            role: String(entry.role || '').trim().toLowerCase(),
            text: String(entry.text || entry.content || '').trim()
        });
        phoneContext.conversationTurns = this._normalizeWhatsappConversationTurns(existingTurns);
        await this._setWhatsappPhoneContext(normalizedPhone, phoneContext);
        return phoneContext;
    }

    async _beginWhatsappModelRoutingSession(phone, phoneContext = null) {
        const normalizedPhone = String(phone || '').replace(/@.*$/g, '').trim();
        let selectedModel = (document.getElementById('model-selector') && document.getElementById('model-selector').value)
            ? String(document.getElementById('model-selector').value).trim()
            : '';

        if (!selectedModel) {
            try {
                const refreshedModels = await this._loadWhatsappAvailableModels();
                selectedModel = refreshedModels && refreshedModels.modelSelector && refreshedModels.modelSelector.value
                    ? String(refreshedModels.modelSelector.value).trim()
                    : '';
            } catch (refreshErr) {
                console.warn('[ConnectorWhatsapp][models] Failed to recover model selector before routing session', refreshErr);
            }
        }

        const routing = (typeof OllamaAPI !== 'undefined' && OllamaAPI && typeof OllamaAPI.getApiRoutingForModel === 'function' && selectedModel)
            ? await OllamaAPI.getApiRoutingForModel(selectedModel)
            : { source: 'local', modelName: selectedModel };

        const effectivePhoneContext = (phoneContext && typeof phoneContext === 'object')
            ? { ...phoneContext }
            : ((await this._getWhatsappPhoneContext(normalizedPhone)) || {});

        const routingState = this._buildWhatsappRoutingState(effectivePhoneContext, normalizedPhone);
        const previousGlobalContext = (typeof OllamaAPI !== 'undefined' && OllamaAPI)
            ? this._cloneOllamaContextPayload(OllamaAPI.previousContext)
            : null;
        const previousOverride = (typeof window !== 'undefined' && window.__paiperworkWhatsappContextOverride)
            ? { ...window.__paiperworkWhatsappContextOverride }
            : null;

        if (typeof OllamaAPI !== 'undefined' && OllamaAPI) {
            OllamaAPI.previousContext = routing.source === 'cloud'
                ? null
                : this._cloneOllamaContextPayload(routingState.localPreviousContext);
        }

        if (typeof window !== 'undefined') {
            window.__paiperworkWhatsappContextOverride = {
                active: true,
                phone: normalizedPhone,
                source: routing.source || 'local',
                turns: this._normalizeWhatsappConversationTurns(routingState.conversationTurns)
            };
        }

        return {
            phone: normalizedPhone,
            source: routing.source || 'local',
            selectedModel,
            phoneContext: effectivePhoneContext,
            previousGlobalContext,
            previousOverride
        };
    }

    async _endWhatsappModelRoutingSession(session) {
        if (!session) return;

        const normalizedPhone = String(session.phone || '').replace(/@.*$/g, '').trim();
        const phoneContext = (session.phoneContext && typeof session.phoneContext === 'object')
            ? { ...session.phoneContext }
            : ((await this._getWhatsappPhoneContext(normalizedPhone)) || {});

        phoneContext.conversationTurns = this._buildWhatsappRoutingState(phoneContext, normalizedPhone).conversationTurns;
        if (session.source !== 'cloud' && typeof OllamaAPI !== 'undefined' && OllamaAPI) {
            phoneContext.localPreviousContext = this._cloneOllamaContextPayload(OllamaAPI.previousContext);
        }

        await this._setWhatsappPhoneContext(normalizedPhone, phoneContext);

        if (typeof OllamaAPI !== 'undefined' && OllamaAPI) {
            OllamaAPI.previousContext = this._cloneOllamaContextPayload(session.previousGlobalContext);
        }

        if (typeof window !== 'undefined') {
            if (session.previousOverride) {
                window.__paiperworkWhatsappContextOverride = session.previousOverride;
            } else {
                delete window.__paiperworkWhatsappContextOverride;
            }
        }
    }

    _detectLanguage(text) {
        if (!text) return null;
        const candidate = String(text).trim();
        const lower = candidate.toLowerCase();

        // Basic keyword detection - Broader Spanish coverage for no accent/no greeting cases.
        if (/\b(hola|gracias|¿|¡|ñ|á|é|í|ó|ú|adiós|por qué|cómo|debes|tengo|viento|hace|mañana|ayer|hoy|usted|nosotros|estoy|estamos|es|soy|ser|estar)\b/.test(lower)) return 'Spanish';
        if (/\b(bonjour|merci|s'il vous plaît|à bientôt|oui|non|aujourd'hui|comment|je|tu|nous|vous)\b/.test(lower)) return 'French';
        if (/\b(hallo|danke|bitte|schön|tschüss|morgen|heute|gestern|ich|du|wir|ihr)\b/.test(lower)) return 'German';
        if (/\b(ciao|per favore|grazie|buongiorno|arrivederci|domani|oggi|ieri|io|tu|noi|voi)\b/.test(lower)) return 'Italian';
        if (/\b(olá|obrigado|por favor|até logo|hoje|amanhã|ontem|eu|você|nós|eles)\b/.test(lower)) return 'Portuguese';
        if (/\b(你好|谢谢|请|再见)\b/.test(candidate)) return 'Chinese';
        if (/\b(こんにちは|ありがとう|お願いします|さようなら)\b/.test(candidate)) return 'Japanese';
        if (/\b(안녕하세요|감사합니다|제발|안녕)\b/.test(candidate)) return 'Korean';

        // Fallback: script heuristics for Cyrillic languages
        if (/[\u0400-\u04FF]/.test(candidate)) return 'Russian';

        // default: English (or unknown)
        return 'English';
    }

    _normalizeLanguage(language) {
        if (!language) return null;
        const normalized = String(language).trim().toLowerCase();
        if (!normalized) return null;

        const map = {
            'en': 'English', 'en-us': 'English', 'en-gb': 'English', 'english': 'English',
            'es': 'Spanish', 'es-es': 'Spanish', 'es-mx': 'Spanish', 'spanish': 'Spanish',
            'fr': 'French', 'fr-fr': 'French', 'french': 'French',
            'de': 'German', 'de-de': 'German', 'german': 'German',
            'it': 'Italian', 'it-it': 'Italian', 'italian': 'Italian',
            'pt': 'Portuguese', 'pt-br': 'Portuguese', 'pt-pt': 'Portuguese', 'portuguese': 'Portuguese',
            'ru': 'Russian', 'ru-ru': 'Russian', 'russian': 'Russian',
            'ja': 'Japanese', 'ja-jp': 'Japanese', 'japanese': 'Japanese',
            'ko': 'Korean', 'ko-kr': 'Korean', 'korean': 'Korean',
            'zh': 'Chinese', 'zh-cn': 'Chinese', 'zh-tw': 'Chinese', 'chinese': 'Chinese',
            '中文': 'Chinese', '简体中文': 'Chinese', '繁體中文': 'Chinese', '繁体中文': 'Chinese'
        };

        if (map[normalized]) return map[normalized];
        const base = normalized.split('-')[0];
        if (map[base]) return map[base];

        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }

    _languageToCode(language) {
        const normalized = String(language || '').trim().toLowerCase();
        const map = {
            english: 'en', en: 'en', 'en-us': 'en', 'en-gb': 'en',
            spanish: 'es', es: 'es', 'es-es': 'es', 'es-mx': 'es',
            french: 'fr', fr: 'fr', 'fr-fr': 'fr',
            german: 'de', de: 'de', 'de-de': 'de',
            italian: 'it', it: 'it', 'it-it': 'it',
            portuguese: 'pt', pt: 'pt', 'pt-br': 'pt', 'pt-pt': 'pt',
            russian: 'ru', ru: 'ru', 'ru-ru': 'ru',
            japanese: 'ja', ja: 'ja', 'ja-jp': 'ja',
            korean: 'ko', ko: 'ko', 'ko-kr': 'ko',
            chinese: 'zh', zh: 'zh', 'zh-cn': 'zh', 'zh-tw': 'zh'
        };
        return map[normalized] || map[normalized.split('-')[0]] || null;
    }

    async _getLocalizedLangText(language, key, fallback, params = null) {
        try {
            const langCode = this._languageToCode(language) || this._languageToCode(this._normalizeLanguage(language)) || Lang.getCurrentLanguage() || 'en';
            if (typeof Lang.loadLanguage === 'function') {
                await Lang.loadLanguage(langCode);
            }

            const langTable = (Lang.loadedLanguages && Lang.loadedLanguages[langCode]) || {};
            const fallbackTable = (Lang.loadedLanguages && Lang.loadedLanguages.en) || {};
            const translation = langTable[key] || fallbackTable[key];

            if (!translation) {
                return fallback;
            }

            if (typeof translation === 'function') {
                return params ? translation(params) : translation();
            }

            if (typeof translation === 'string') {
                if (params && typeof params === 'object') {
                    return translation.replace(/\{(\w+)\}/g, (match, name) => {
                        const value = params[name];
                        return typeof value === 'undefined' ? match : String(value);
                    });
                }
                return translation;
            }

            return fallback;
        } catch (_err) {
            return fallback;
        }
    }

    _getActiveWhatsappReplyLanguage() {
        return window.whatsappIncomingLanguage
            || window.lastOrchestratorDecision?.language
            || window.chatInstance?.whatsappPendingReplyLanguage
            || 'English';
    }

    async _ensureDocumentsTabReady() {
        if (typeof window === 'undefined') return false;
        if (window.documentsTabLoaded) {
            return true;
        }

        if (window.tabLoader && typeof window.tabLoader.loadTabScripts === 'function') {
            try {
                console.info('[ConnectorWhatsapp][debug] _ensureDocumentsTabReady loading documents tab via tabLoader');
                await window.tabLoader.loadTabScripts('documents');
            } catch (error) {
                console.warn('[ConnectorWhatsapp][debug] _ensureDocumentsTabReady failed to load documents tab', error);
            }
        } else {
            console.warn('[ConnectorWhatsapp][debug] _ensureDocumentsTabReady tabLoader unavailable');
        }

        if (!window.documentsTabLoaded && typeof initializeDocumentUI === 'function') {
            try {
                await initializeDocumentUI();
                console.info('[ConnectorWhatsapp][debug] _ensureDocumentsTabReady initializeDocumentUI invoked');
            } catch (error) {
                console.warn('[ConnectorWhatsapp][debug] _ensureDocumentsTabReady initializeDocumentUI failed', error);
            }
        }

        return !!window.documentsTabLoaded || !!window.showDocumentSummary || (!!window.RAG_Utils && !!window.RAG_Utils.showDocumentSummary);
    }

    async _ensureWhatsappWebSearchMode(enable) {
        if (typeof window === 'undefined') return;
        const webButton = document.getElementById('web-search');
        if (!webButton) return;

        const currentlyActive = webButton.classList.contains('active');
        if (enable === currentlyActive) return;

        // In websearch mode we prefer using the existing UI toggle to ensure scripts are loaded
        try {
            webButton.click();
            if (enable) {
                const maxWait = 3000;
                const interval = 100;
                let waited = 0;
                while (!webButton.classList.contains('active') && waited < maxWait) {
                    // eslint-disable-next-line no-await-in-loop
                    await new Promise(r => setTimeout(r, interval));
                    waited += interval;
                }
            }
        } catch (err) {
            console.warn('[ConnectorWhatsapp] _ensureWhatsappWebSearchMode click toggle failed', err);
            if (enable) {
                webButton.classList.add('active');
            } else {
                webButton.classList.remove('active');
            }
        }
    }

    _localizedThinkingText(language) {
        const lang = (language || 'English').toLowerCase();
        if (lang.includes('spanish') || lang.startsWith('es')) return '🤖 Pensando...';
        if (lang.includes('french') || lang.startsWith('fr')) return '🤖 Réflexion en cours...';
        if (lang.includes('german') || lang.startsWith('de')) return '🤖 Denken...';
        if (lang.includes('italian') || lang.startsWith('it')) return '🤖 Sto pensando...';
        if (lang.includes('portuguese') || lang.startsWith('pt')) return '🤖 Pensando...';
        if (lang.includes('chinese') || lang.startsWith('zh')) return '🤖 正在思考...';
        if (lang.includes('japanese') || lang.startsWith('ja')) return '🤖 考えています...';
        if (lang.includes('korean') || lang.startsWith('ko')) return '🤖 생각 중...';
        if (lang.includes('russian') || lang.startsWith('ru')) return '🤖 Думаю...';
        return '🤖 Thinking...';
    }

    async _executeDocumentSummary(phone, match, hashedMasterKey, language = null, options = {}) {
        const botPrefix = '🤖 ';
        console.info('[ConnectorWhatsapp][debug] _executeDocumentSummary invoked for', { phone, match, hashedMasterKey });
        if (!match) {
            console.info('[ConnectorWhatsapp][debug] _executeDocumentSummary skipping: no matched document');
            return false;
        }
        await this._ensureDocumentsTabReady();
        const summaryFn =
            (typeof showDocumentSummary === 'function' && showDocumentSummary) ||
            (typeof window !== 'undefined' && window.showDocumentSummary) ||
            (typeof window !== 'undefined' && window.documentsTab && window.documentsTab.showDocumentSummary) ||
            (typeof window !== 'undefined' && window.RAG_Utils && window.RAG_Utils.showDocumentSummary);

        if (typeof summaryFn === 'function') {
            console.info('[ConnectorWhatsapp][debug] _executeDocumentSummary executing showDocumentSummary', { id: match.id, name: match.name });
            if (options.announceStart !== false) {
                const requestedText = await this._getLocalizedLangText(
                    language,
                    'ragDocumentSummaryRequested',
                    'Generating summary for'
                );
                await this.postWhatsappText(phone, `${botPrefix}${String(requestedText || 'Generating summary for').replace(/\s*:?\s*$/, '')}: ${match.name}`);
            }
            this._clearPendingDocSelection(phone);
            const suppressWhatsappSummarySend = options.workflow === 'summary-presentation' || options.sendToPhone === false;
            const summaryOptions = {
                workflow: options.workflow || null,
                sendToPhone: suppressWhatsappSummarySend ? null : phone,
                suppressWhatsappSend: suppressWhatsappSummarySend,
                closeAfterComplete: options.closeAfterComplete === true
            };
            console.info('[ConnectorWhatsapp][debug] _executeDocumentSummary summary options', {
                workflow: summaryOptions.workflow,
                sendToPhone: summaryOptions.sendToPhone,
                suppressWhatsappSend: summaryOptions.suppressWhatsappSend,
                closeAfterComplete: summaryOptions.closeAfterComplete
            });
            const summaryText = await summaryFn(match.id, match.name, hashedMasterKey, summaryOptions);
            console.info('[ConnectorWhatsapp][debug] _executeDocumentSummary summary result', {
                workflow: summaryOptions.workflow,
                resultType: typeof summaryText,
                resultLength: typeof summaryText === 'string' ? summaryText.length : null,
                truthy: !!summaryText
            });
            return summaryText || true;
        }
        console.info('[ConnectorWhatsapp][debug] _executeDocumentSummary fallback: showDocumentSummary not available', { id: match.id, name: match.name });
        // Fallback if the global helper is still unavailable in this context.
        const preparedText = await this._getLocalizedLangText(
            language,
            'ragDocumentSummaryRequested',
            'Prepared to summarize'
        );
        const unavailableText = await this._getLocalizedLangText(
            language,
            'ragDocumentFunctionMissing',
            'Summary function not available right now; please continue in Documents tab.'
        );
        await this.postWhatsappText(phone, `${botPrefix}${String(preparedText || 'Prepared to summarize').replace(/\s*:?\s*$/, '')}: ${match.name}. ${unavailableText}`);
        this._setPendingDocSelection(phone, { id: match.id, name: match.name });
        return false;
    }

    async _handleWhatsappSummaryToPresentationWorkflow(phone, replyTarget, requestText, language = null) {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!phone || !hashedMasterKey) {
            return false;
        }

        const matchedDocument = await this._findReferencedDocumentFromText(requestText, hashedMasterKey);
        if (!matchedDocument) {
            return false;
        }

        const workflowStartText = await this._getLocalizedLangText(
            language,
            'whatsappSummaryPresentationWorkflowStart',
            'I will summarize the document first, then create a presentation from that summary.'
        );
        await this.postWhatsappText(replyTarget || phone, `🤖 ${workflowStartText}`);

        const summaryText = await this._executeDocumentSummary(phone, matchedDocument, hashedMasterKey, language, {
            workflow: 'summary-presentation',
            announceStart: false,
            sendToPhone: false,
            closeAfterComplete: true
        });
        const normalizedSummaryText = this._normalizeWhatsappResearchReportText(typeof summaryText === 'string' ? summaryText : '');
        console.info('[ConnectorWhatsapp][debug] summary-to-presentation workflow summary normalization', {
            documentId: matchedDocument.id,
            documentName: matchedDocument.name,
            summaryType: typeof summaryText,
            summaryLength: typeof summaryText === 'string' ? summaryText.length : null,
            normalizedLength: normalizedSummaryText ? normalizedSummaryText.length : 0
        });
        if (!normalizedSummaryText) {
            console.info('[ConnectorWhatsapp][debug] summary-to-presentation workflow aborted before presentation because normalized summary was empty');
            return true;
        }

        console.info('[ConnectorWhatsapp][debug] summary-to-presentation workflow starting presentation generation', {
            phone,
            language,
            sourceLength: normalizedSummaryText.length
        });
        await this._handleWhatsappPromptablePresentation(phone, normalizedSummaryText, language);
        return true;
    }

    async _handleWhatsappMatchedDocumentSummaryToPresentationWorkflow(phone, replyTarget, matchedDocument, language = null) {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!phone || !hashedMasterKey || !matchedDocument) {
            return false;
        }

        const workflowStartText = await this._getLocalizedLangText(
            language,
            'whatsappSummaryPresentationWorkflowStart',
            'I will summarize the document first, then create a presentation from that summary.'
        );
        await this.postWhatsappText(replyTarget || phone, `🤖 ${workflowStartText}`);

        const summaryText = await this._executeDocumentSummary(phone, matchedDocument, hashedMasterKey, language, {
            workflow: 'summary-presentation',
            announceStart: false,
            sendToPhone: false,
            closeAfterComplete: true
        });
        const normalizedSummaryText = this._normalizeWhatsappResearchReportText(typeof summaryText === 'string' ? summaryText : '');
        console.info('[ConnectorWhatsapp][debug] matched-document summary-to-presentation normalization', {
            documentId: matchedDocument.id,
            documentName: matchedDocument.name,
            summaryType: typeof summaryText,
            summaryLength: typeof summaryText === 'string' ? summaryText.length : null,
            normalizedLength: normalizedSummaryText ? normalizedSummaryText.length : 0
        });
        if (!normalizedSummaryText) {
            console.info('[ConnectorWhatsapp][debug] matched-document summary-to-presentation aborted before presentation because normalized summary was empty');
            return true;
        }

        console.info('[ConnectorWhatsapp][debug] matched-document summary-to-presentation starting presentation generation', {
            phone,
            language,
            documentId: matchedDocument.id,
            sourceLength: normalizedSummaryText.length
        });
        await this._handleWhatsappPromptablePresentation(phone, normalizedSummaryText, language);
        return true;
    }

    async _sendWhatsappTextChunked(phone, report, language = null) {
        if (!phone || !report) return;
        const text = String(report).trim();
        if (text.length === 0) return;

        const resultPrefix = await this._getLocalizedLangText(
            language,
            'researchResultPrefix',
            'Research result'
        );
        const resultPartPrefix = await this._getLocalizedLangText(
            language,
            'researchResultPartPrefix',
            'Research result (part {current}/{total})',
            { current: 1, total: 1 }
        );

        const chunkSize = 1500;
        if (text.length <= chunkSize) {
            await this.postWhatsappText(phone, `🤖 ${resultPrefix}:\n${text}`);
            return;
        }

        const chunks = this._splitWhatsappTextIntoChunks(text, chunkSize);

        for (let idx = 0; idx < chunks.length; idx++) {
            const partLabel = resultPartPrefix
                .replace('{current}', String(idx + 1))
                .replace('{total}', String(chunks.length));
            const prefix = `🤖 ${partLabel}:\n`;
            await this.postWhatsappText(phone, prefix + chunks[idx]);
        }
    }

    _splitWhatsappTextIntoChunks(text, chunkSize = 1500) {
        const normalizedText = this._normalizeWhatsappResearchReportText(text);
        if (!normalizedText) {
            return [];
        }

        const chunks = [];
        let remaining = normalizedText;

        while (remaining.length > chunkSize) {
            let splitIndex = this._findWhatsappChunkBoundary(remaining, chunkSize);

            if (splitIndex <= 0) {
                splitIndex = chunkSize;
            }

            const chunk = remaining.slice(0, splitIndex).trim();
            if (chunk) {
                chunks.push(chunk);
            }

            remaining = remaining.slice(splitIndex).trimStart();
        }

        if (remaining) {
            chunks.push(remaining);
        }

        return chunks;
    }

    _findWhatsappChunkBoundary(text, chunkSize) {
        const maxIndex = Math.min(chunkSize, text.length);
        if (text.length <= chunkSize) {
            return text.length;
        }

        const boundaryMatchers = [
            /\n\n/g,
            /[.!?]\s+/g,
            /[;,]\s+/g,
            /\s+/g
        ];

        for (const matcher of boundaryMatchers) {
            let lastBoundary = -1;
            matcher.lastIndex = 0;
            let match;

            while ((match = matcher.exec(text)) !== null) {
                const boundaryIndex = match.index + match[0].length;
                if (boundaryIndex > maxIndex) {
                    break;
                }

                lastBoundary = boundaryIndex;
            }

            if (lastBoundary > 0) {
                return lastBoundary;
            }
        }

        return maxIndex;
    }

    _normalizeWhatsappResearchReportText(text) {
        return String(text || '')
            .replace(/\r\n/g, '\n')
            .replace(/\u00a0/g, ' ')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    _stripWhatsappResearchSourcesSection(text) {
        const normalizedText = this._normalizeWhatsappResearchReportText(text);
        if (!normalizedText) {
            return '';
        }

        return normalizedText
            .replace(/\n+[*#-]?\s*##\s+Sources\b[\s\S]*$/i, '')
            .replace(/^##\s+Sources\b[\s\S]*$/i, '')
            .trim();
    }

    _getResearchReportTextForWhatsapp(fallbackReport = '') {
        try {
            const reportElement = document.querySelector('.research-results-overlay .report-content');
            const researchAutomation = window.researchTab && window.researchTab.researchAutomation;

            if (reportElement) {
                const reportHtml = String(reportElement.innerHTML || '').trim();
                if (reportHtml && researchAutomation && typeof researchAutomation.htmlToMarkdown === 'function') {
                    const markdownReport = researchAutomation.htmlToMarkdown(reportHtml);
                    const normalizedMarkdownReport = this._stripWhatsappResearchSourcesSection(markdownReport);
                    if (normalizedMarkdownReport) {
                        return normalizedMarkdownReport;
                    }
                }

                const plainTextReport = this._stripWhatsappResearchSourcesSection(reportElement.innerText || reportElement.textContent || '');
                if (plainTextReport) {
                    return plainTextReport;
                }
            }
        } catch (err) {
            console.warn('[ConnectorWhatsapp][research] Failed to extract report text from research window', err);
        }

        return this._stripWhatsappResearchSourcesSection(fallbackReport);
    }

    _getResearchSourcesForAutosave() {
        try {
            const researchAutomation = window.researchTab && window.researchTab.researchAutomation;
            const sources = researchAutomation && researchAutomation.researchResults && Array.isArray(researchAutomation.researchResults.sources)
                ? researchAutomation.researchResults.sources
                : [];

            return sources.map(source => ({ ...source }));
        } catch (err) {
            console.warn('[ConnectorWhatsapp][research] Failed to extract research sources for autosave', err);
            return [];
        }
    }

    async _autosaveWhatsappResearchToKnowledgeBase(report, title = '') {
        const researchAutomation = window.researchTab && window.researchTab.researchAutomation;
        if (!researchAutomation || typeof researchAutomation.saveToKnowledgeBaseDirect !== 'function') {
            return null;
        }

        const trimmedReport = this._normalizeWhatsappResearchReportText(report);
        if (!trimmedReport) {
            return null;
        }

        const normalizedTitle = String(title || researchAutomation.currentQuery || 'Research Report').trim() || 'Research Report';
        const sources = this._getResearchSourcesForAutosave();

        return researchAutomation.saveToKnowledgeBaseDirect(trimmedReport, sources, {
            title: normalizedTitle,
            createNewCollection: true,
            saveSeparateSources: true,
            showProgress: false
        });
    }

    async _closeWhatsappResearchWindows() {
        try {
            if (window.researchTab && typeof window.researchTab.forceStopAllOperations === 'function') {
                await window.researchTab.forceStopAllOperations();
            }
        } catch (closeErr) {
            console.warn('[ConnectorWhatsapp][research] Failed to stop research operations before closing window', closeErr);
        }

        try {
            document.querySelectorAll('.research-results-overlay').forEach(el => el.remove());
        } catch (overlayErr) {
            console.warn('[ConnectorWhatsapp][research] Failed to remove research results overlays', overlayErr);
        }

        try {
            if (window.researchTab && window.researchTab.researchAutomation) {
                window.researchTab.researchAutomation.activeWindow = null;
            }
            if (window.researchTab) {
                window.researchTab.activeWindow = null;
            }
        } catch (stateErr) {
            console.warn('[ConnectorWhatsapp][research] Failed to reset research window state', stateErr);
        }
    }

    _isSummaryIntent(text) {
        return this._textMatchesDocumentKeymapTokens(text, this._getDocumentKeymapTokens('actions.summary'));
    }

    _isSummaryToPresentationWorkflowIntent(text) {
        const rawText = String(text || '').trim();
        if (!rawText) return false;

        const normalized = this._normalizeDocumentIntentKeymapText(rawText);
        if (!normalized) return false;

        const hasSummaryIntent = this._isSummaryIntent(normalized);
        const hasPresentationMention = this._textMatchesDocumentKeymapTokens(rawText, this._getPresentationKeymapTokens('intent'));

        if (!hasSummaryIntent || !hasPresentationMention) {
            return false;
        }

        const workflowTokens = this._getPresentationKeymapTokens('workflows.summaryToPresentation');
        if (this._textMatchesDocumentKeymapTokens(rawText, workflowTokens)) {
            return true;
        }

        if (/(summar(?:y|ize)|résum|resum|resumo|zusammenfass|摘要|总结|概述).*(create|make|build|generate|prepare|craft|send).*(presentation|presentations|slides|slide deck|deck|slidedeck)/i.test(rawText)) {
            return true;
        }

        if (/(create|make|build|generate|prepare|craft|send).*(presentation|presentations|slides|slide deck|deck|slidedeck).*(summar(?:y|ize)|résum|resum|resumo|zusammenfass|摘要|总结|概述)/i.test(rawText)) {
            return true;
        }

        return /(then|and then|after that|afterwards|using the summary|with the summary|using summary|with summary|y luego|despues|después|depois|ensuite|puis|apres|après|danach|然后|之后|之後|その後|다음|그 다음)/i.test(rawText)
            || /summary.*presentation|presentation.*summary/i.test(normalized);
    }

    _isQuestionIntent(text) {
        return /[?？¿]/.test(String(text || ''))
            || this._textMatchesDocumentKeymapTokens(text, this._getDocumentKeymapTokens('actions.question', 'questionStarters'));
    }

    _getDocumentKeymapConfig() {
        const keymap = window.Keymaps && window.Keymaps.document;
        if (Array.isArray(keymap)) {
            return {
                nouns: keymap,
                actions: {},
                questionStarters: [],
                terms: keymap,
                generalChat: []
            };
        }
        return keymap || {
            nouns: [],
            actions: {},
            questionStarters: [],
            terms: [],
            generalChat: []
        };
    }

    _getDocumentKeymapTokens(...paths) {
        const keymap = this._getDocumentKeymapConfig();
        const collected = [];

        for (const path of paths) {
            const segments = String(path || '').split('.').filter(Boolean);
            let value = keymap;
            for (const segment of segments) {
                value = value && value[segment];
            }
            if (Array.isArray(value)) {
                collected.push(...value);
            }
        }

        return [...new Set(collected.map(token => String(token || '').trim()).filter(Boolean))];
    }

    _normalizeDocumentIntentKeymapText(text) {
        return String(text || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9\u00C0-\u017F\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF]+/gi, ' ')
            .trim();
    }

    _textMatchesDocumentKeymapTokens(text, tokens = []) {
        const normalizedText = this._normalizeDocumentIntentKeymapText(text);
        if (!normalizedText) return false;

        return tokens.some(token => {
            const normalizedToken = this._normalizeDocumentIntentKeymapText(token);
            return normalizedToken && normalizedText.includes(normalizedToken);
        });
    }

    _isExactDocumentKeymapCommand(text, tokens = []) {
        const normalizedText = this._normalizeDocumentIntentKeymapText(text);
        if (!normalizedText) return false;

        return tokens.some(token => this._normalizeDocumentIntentKeymapText(token) === normalizedText);
    }

    _hasRunnableDocumentQuestionText(text, documentHint = '') {
        const rawText = String(text || '').trim();
        if (!rawText) return false;

        const summaryTokens = this._getDocumentKeymapTokens('actions.summary');
        const questionTokens = this._getDocumentKeymapTokens('actions.question');
        const questionStarters = this._getDocumentKeymapTokens('questionStarters');
        const browseTokens = this._getDocumentKeymapTokens('actions.browse');
        const nounTokens = this._getDocumentKeymapTokens('nouns');

        if (this._isExactDocumentKeymapCommand(rawText, summaryTokens)) {
            return false;
        }

        if (this._isExactDocumentKeymapCommand(rawText, questionTokens)) {
            return false;
        }

        let candidate = rawText;
        const trimmedHint = String(documentHint || '').trim();
        if (trimmedHint) {
            const escapedHint = trimmedHint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            candidate = candidate.replace(new RegExp(escapedHint, 'ig'), ' ');
        }

        const removableTokens = [...new Set([...browseTokens, ...nounTokens])]
            .map(token => this._normalizeDocumentIntentKeymapText(token))
            .filter(Boolean)
            .sort((left, right) => right.length - left.length);

        let normalizedCandidate = this._normalizeDocumentIntentKeymapText(candidate);
        for (const token of removableTokens) {
            normalizedCandidate = normalizedCandidate.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ');
        }
        normalizedCandidate = normalizedCandidate.replace(/\s+/g, ' ').trim();

        if (!normalizedCandidate) return false;

        if (this._isExactDocumentKeymapCommand(normalizedCandidate, summaryTokens)) {
            return false;
        }

        if (this._isExactDocumentKeymapCommand(normalizedCandidate, questionTokens)) {
            return false;
        }

        if (/[?？¿]/.test(rawText)) {
            return true;
        }

        if (this._textMatchesDocumentKeymapTokens(normalizedCandidate, questionStarters)) {
            return true;
        }

        return this._textMatchesDocumentKeymapTokens(normalizedCandidate, questionTokens) && normalizedCandidate.split(/\s+/).length >= 2;
    }

    _isDocumentSelectionIntent(text) {
        const rawText = String(text || '').trim();
        if (!rawText) return false;

        const normalizedText = this._normalizeDocumentIntentKeymapText(rawText);
        if (!normalizedText) return false;

        const nounTokens = this._getDocumentKeymapTokens('nouns');
        const browseTokens = this._getDocumentKeymapTokens('actions.browse');
        const hasDocumentNoun = this._textMatchesDocumentKeymapTokens(normalizedText, nounTokens);
        if (!hasDocumentNoun) return false;

        const hasBrowseAction = this._textMatchesDocumentKeymapTokens(normalizedText, browseTokens);
        if (hasBrowseAction) return true;

        if (this._isExactDocumentKeymapCommand(normalizedText, nounTokens)) return true;

        return /^(?:my|the|this|that|these|those|mis|my saved|saved|uploaded|existing)\s+(?:documents?|docs?|files?|pdfs?|uploads?|reports?)$/i.test(normalizedText);
    }

    _isDataVizIntent(text) {
        if (!text || !window.Keymaps || !window.Keymaps.dataViz) return false;
        const candidate = String(text || '').toLowerCase();

        const keymap = window.Keymaps.dataViz;
        const intentMatch = keymap.intent.some(token => candidate.includes(token));
        if (!intentMatch) return false;

        const chartTypeMatch = Object.values(keymap.chartType).some(arr => arr.some(token => candidate.includes(token)));
        return chartTypeMatch || intentMatch;
    }

    _isPresentationIntent(text) {
        if (!text || !window.Keymaps || !window.Keymaps.presentation) return false;

        const keymap = window.Keymaps.presentation;
        const intentMatch = this._textMatchesDocumentKeymapTokens(text, keymap.intent || []);
        const createMatch = keymap.actions && Array.isArray(keymap.actions.create)
            ? this._textMatchesDocumentKeymapTokens(text, keymap.actions.create)
            : false;
        const browseMatch = keymap.actions && Array.isArray(keymap.actions.browse)
            ? this._textMatchesDocumentKeymapTokens(text, keymap.actions.browse)
            : false;
        const sendMatch = keymap.actions && Array.isArray(keymap.actions.send)
            ? this._textMatchesDocumentKeymapTokens(text, keymap.actions.send)
            : false;
        const sourceCueMatch = Array.isArray(keymap.sourceCues)
            ? this._textMatchesDocumentKeymapTokens(text, keymap.sourceCues)
            : false;
        const savedCueMatch = Array.isArray(keymap.savedCues)
            ? this._textMatchesDocumentKeymapTokens(text, keymap.savedCues)
            : false;

        return intentMatch && (createMatch || sourceCueMatch || browseMatch || sendMatch || savedCueMatch);
    }

    _extractPresentationRequestParts(text) {
        const normalized = this._normalizeWhatsappResearchReportText(text);
        if (!normalized) {
            return { sourceText: '', extraRequestText: '' };
        }

        const delimiterPatterns = [
            /(?:with|using|from|based on)\s+(?:the following|this|provided)?\s*(?:text|content|material|notes|script)\s*[:\-]\s*([\s\S]+)/i,
            /(?:con|usando|a partir de)\s+(?:el siguiente|este)?\s*(?:texto|contenido)\s*[:\-]\s*([\s\S]+)/i,
            /(?:com|usando|a partir de)\s+(?:o seguinte|este)?\s*(?:texto|conteudo|conteúdo)\s*[:\-]\s*([\s\S]+)/i,
            /(?:avec|en utilisant|a partir de|à partir de)\s+(?:le texte suivant|ce texte|ce contenu)?\s*[:\-]\s*([\s\S]+)/i,
            /(?:mit|aus)\s+(?:diesem|folgendem)?\s*(?:text|inhalt)\s*[:\-]\s*([\s\S]+)/i,
            /(?:con|usando|da)\s+(?:questo|il seguente)?\s*(?:testo|contenuto)\s*[:\-]\s*([\s\S]+)/i,
            /(?:使用以下文本|用这段文字|根据这段文字|提供的文本)\s*[:：\-]\s*([\s\S]+)/i,
            /(?:次のテキストを使って|このテキストで|この文章から|提供されたテキスト)\s*[:：\-]\s*([\s\S]+)/i,
            /(?:이 텍스트로|다음 텍스트로|제공한 텍스트로|제공된 내용으로)\s*[:：\-]\s*([\s\S]+)/i
        ];

        for (const pattern of delimiterPatterns) {
            const match = normalized.match(pattern);
            const extracted = match && match[1] ? this._normalizeWhatsappResearchReportText(match[1]) : '';
            if (extracted && extracted.length >= 40) {
                return { sourceText: extracted, extraRequestText: '' };
            }
        }

        const lines = normalized.split('\n');
        if (lines.length > 1) {
            const header = String(lines[0] || '').trim();
            const remainder = this._normalizeWhatsappResearchReportText(lines.slice(1).join('\n'));
            if (this._isPresentationIntent(header) && remainder.length >= 40) {
                return { sourceText: remainder, extraRequestText: '' };
            }
        }

        return { sourceText: normalized, extraRequestText: '' };
    }

    _getWhatsappRoutingIntentText(text) {
        const normalized = this._normalizeWhatsappResearchReportText(text);
        if (!normalized) {
            return '';
        }

        const headerDelimiterPatterns = [
            /^(.*?)(?:with|using|from|based on)\s+(?:the following|this|provided)?\s*(?:text|content|material|notes|script)\s*[:\-][\s\S]*$/i,
            /^(.*?)(?:con|usando|a partir de)\s+(?:el siguiente|este)?\s*(?:texto|contenido)\s*[:\-][\s\S]*$/i,
            /^(.*?)(?:com|usando|a partir de)\s+(?:o seguinte|este)?\s*(?:texto|conteudo|conteúdo)\s*[:\-][\s\S]*$/i,
            /^(.*?)(?:avec|en utilisant|a partir de|à partir de)\s+(?:le texte suivant|ce texte|ce contenu)?\s*[:\-][\s\S]*$/i,
            /^(.*?)(?:mit|aus)\s+(?:diesem|folgendem)?\s*(?:text|inhalt)\s*[:\-][\s\S]*$/i,
            /^(.*?)(?:con|usando|da)\s+(?:questo|il seguente)?\s*(?:testo|contenuto)\s*[:\-][\s\S]*$/i,
            /^(.*?)(?:使用以下文本|用这段文字|根据这段文字|提供的文本)\s*[:：\-][\s\S]*$/i,
            /^(.*?)(?:次のテキストを使って|このテキストで|この文章から|提供されたテキスト)\s*[:：\-][\s\S]*$/i,
            /^(.*?)(?:이 텍스트로|다음 텍스트로|제공한 텍스트로|제공된 내용으로)\s*[:：\-][\s\S]*$/i
        ];

        for (const pattern of headerDelimiterPatterns) {
            const match = normalized.match(pattern);
            const header = match && match[1] ? this._normalizeWhatsappResearchReportText(match[1]) : '';
            if (header && this._isPresentationIntent(header)) {
                return header;
            }
        }

        const firstLine = this._normalizeWhatsappResearchReportText(normalized.split('\n')[0] || '');
        if (firstLine && this._isPresentationIntent(firstLine)) {
            return firstLine;
        }

        return normalized;
    }

    _getPresentationKeymapConfig() {
        const keymap = window.Keymaps && window.Keymaps.presentation;
        return keymap || {
            intent: [],
            actions: {},
            sourceCues: [],
            savedCues: [],
            workflows: {},
            sectionAnchors: [],
            terms: []
        };
    }

    _getPresentationKeymapTokens(...paths) {
        const keymap = this._getPresentationKeymapConfig();
        const collected = [];

        for (const path of paths) {
            const segments = String(path || '').split('.').filter(Boolean);
            let value = keymap;
            for (const segment of segments) {
                value = value && value[segment];
            }
            if (Array.isArray(value)) {
                collected.push(...value);
            }
        }

        return [...new Set(collected.map(token => String(token || '').trim()).filter(Boolean))];
    }

    _getModelKeymapConfig() {
        const keymap = window.Keymaps && window.Keymaps.model;
        return keymap || {
            nouns: [],
            actions: {},
            providers: {},
            fillers: [],
            terms: []
        };
    }

    _getModelKeymapTokens(...paths) {
        const keymap = this._getModelKeymapConfig();
        const collected = [];

        for (const path of paths) {
            const segments = String(path || '').split('.').filter(Boolean);
            let value = keymap;
            for (const segment of segments) {
                value = value && value[segment];
            }
            if (Array.isArray(value)) {
                collected.push(...value);
            }
        }

        return [...new Set(collected.map(token => String(token || '').trim()).filter(Boolean))];
    }

    _findLongestNormalizedTokenMatch(text, tokens = []) {
        const normalizedText = this._normalizeDocumentIntentKeymapText(text);
        if (!normalizedText) return '';

        let bestMatch = '';
        for (const token of tokens) {
            const normalizedToken = this._normalizeDocumentIntentKeymapText(token);
            if (!normalizedToken) continue;
            if (normalizedText === normalizedToken || normalizedText.includes(normalizedToken)) {
                if (normalizedToken.length > bestMatch.length) {
                    bestMatch = normalizedToken;
                }
            }
        }

        return bestMatch;
    }

    _escapeRegExp(text) {
        return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    _removeKeymapTokensFromNormalizedText(text, tokens = []) {
        let candidate = this._normalizeDocumentIntentKeymapText(text);
        if (!candidate) return '';

        const normalizedTokens = [...new Set(tokens
            .map(token => this._normalizeDocumentIntentKeymapText(token))
            .filter(Boolean))]
            .sort((left, right) => right.length - left.length);

        for (const token of normalizedTokens) {
            const pattern = token
                .split(/\s+/)
                .map(part => this._escapeRegExp(part))
                .join('\\s+');
            const regex = new RegExp(`(^|\\s)${pattern}(?=\\s|$)`, 'gi');
            candidate = candidate.replace(regex, ' ');
        }

        return candidate.replace(/\s+/g, ' ').trim();
    }

    _detectWhatsappRequestedModelProvider(text) {
        const normalizedText = this._normalizeDocumentIntentKeymapText(text);
        if (!normalizedText) return null;

        const localMatch = this._findLongestNormalizedTokenMatch(normalizedText, this._getModelKeymapTokens('providers.local'));
        const cloudMatch = this._findLongestNormalizedTokenMatch(normalizedText, this._getModelKeymapTokens('providers.cloud'));

        if (localMatch && !cloudMatch) return 'local';
        if (cloudMatch && !localMatch) return 'cloud';
        return null;
    }

    _extractWhatsappRequestedModelName(text) {
        const removableTokens = [
            ...this._getModelKeymapTokens('actions.use'),
            ...this._getModelKeymapTokens('nouns'),
            ...this._getModelKeymapTokens('providers.local'),
            ...this._getModelKeymapTokens('providers.cloud'),
            ...this._getModelKeymapTokens('fillers')
        ];

        return this._removeKeymapTokensFromNormalizedText(text, removableTokens);
    }

    _isWhatsappCurrentModelQuestion(normalizedText, hasModelNoun = false) {
        if (!normalizedText || !hasModelNoun) return false;

        const currentStateHints = [
            'current', 'selected', 'active', 'used', 'using', 'in use',
            'actual', 'seleccionado', 'activo', 'en uso', 'usas ahora',
            'atual', 'selecionado', 'activo', 'em uso', 'esta usando', 'está usando',
            'actuel', 'selectionne', 'sélectionné', 'actif', 'utilise', 'utilisé',
            'aktuell', 'ausgewahlt', 'ausgewählt', 'aktiv', 'verwendet', 'nutzt du',
            'attuale', 'selezionato', 'attivo', 'in uso', 'stai usando',
            'текущ', 'выбран', 'активн', 'использу',
            '当前', '已选', '使用中', '现在用', '现在选择',
            '現在', '選択中', '使用中', '今使って',
            '현재', '선택된', '사용 중', '지금 쓰는'
        ];
        const questionHints = [
            'what', 'which', 'que', 'qué', 'cual', 'cuál', 'qual', 'quel', 'welches', 'welche', 'welcher',
            'quale', 'какая', 'какую', '什么', '哪', 'どの', '何', '무슨', '어떤'
        ];

        const hasStateHint = currentStateHints.some(token => normalizedText.includes(token));
        const hasQuestionHint = normalizedText.includes('?') || questionHints.some(token => normalizedText.includes(token));

        return hasStateHint && hasQuestionHint;
    }

    _parseWhatsappModelCommand(text) {
        const rawText = String(text || '').trim();
        if (!rawText) return null;

        const normalizedText = this._normalizeDocumentIntentKeymapText(rawText);
        if (!normalizedText) return null;

        const nounTokens = this._getModelKeymapTokens('nouns');
        const currentTokens = this._getModelKeymapTokens('actions.current');
        const listTokens = this._getModelKeymapTokens('actions.list');
        const useTokens = this._getModelKeymapTokens('actions.use');

        const hasModelNoun = this._textMatchesDocumentKeymapTokens(normalizedText, nounTokens);
        const currentMatch = this._findLongestNormalizedTokenMatch(normalizedText, currentTokens);
        const listMatch = this._findLongestNormalizedTokenMatch(normalizedText, listTokens);
        const useMatch = this._findLongestNormalizedTokenMatch(normalizedText, useTokens);
        const hasExplicitListPhrase = !!(listMatch && listMatch.split(/\s+/).length > 1);
        const isCurrentQuestion = this._isWhatsappCurrentModelQuestion(normalizedText, hasModelNoun);

        if ((currentMatch && (hasModelNoun || currentMatch.split(/\s+/).length > 1)) || isCurrentQuestion) {
            return { type: 'current' };
        }

        if (hasExplicitListPhrase || (hasModelNoun && !!listMatch)) {
            return { type: 'list' };
        }

        if (!useMatch) {
            return null;
        }

        return {
            type: 'switch',
            provider: this._detectWhatsappRequestedModelProvider(rawText),
            requestedModelName: this._extractWhatsappRequestedModelName(rawText)
        };
    }

    async _loadWhatsappAvailableModels() {
        const modelSelector = document.getElementById('model-selector');
        if (!modelSelector) {
            return { modelSelector: null, models: [] };
        }

        const previousOption = modelSelector.options[modelSelector.selectedIndex] || null;
        const previousModel = String(modelSelector.value || '').trim();
        const previousProvider = (previousOption && previousOption.dataset && previousOption.dataset.provider)
            ? String(previousOption.dataset.provider || '').trim().toLowerCase()
            : ((window.OllamaAPI && typeof window.OllamaAPI.getModelSource === 'function')
                ? (window.OllamaAPI.getModelSource(previousModel) || 'local')
                : 'local');

        if (window.OllamaAPI && typeof window.OllamaAPI.loadOllamaModels === 'function') {
            try {
                await window.OllamaAPI.loadOllamaModels();
            } catch (err) {
                console.warn('[ConnectorWhatsapp][models] Failed to refresh available models before WhatsApp command', err);
            }
        }

        if (previousModel) {
            const exactProviderOption = Array.from(modelSelector.options).find(option =>
                option &&
                option.value === previousModel &&
                option.dataset &&
                String(option.dataset.provider || '').trim().toLowerCase() === previousProvider
            );
            const fallbackOption = Array.from(modelSelector.options).find(option => option && option.value === previousModel);
            const optionToRestore = exactProviderOption || fallbackOption;
            if (optionToRestore) {
                modelSelector.value = optionToRestore.value;
                modelSelector.selectedIndex = optionToRestore.index;
            }
        }

        if (!String(modelSelector.value || '').trim()) {
            const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
            let desiredModel = previousModel;
            let desiredProvider = previousProvider;

            if (hashedMasterKey && typeof PaiperworkDB !== 'undefined' && typeof PaiperworkDB.loadSettings === 'function') {
                try {
                    const settings = await PaiperworkDB.loadSettings(hashedMasterKey);
                    if (!desiredModel && settings && settings.model) {
                        desiredModel = String(settings.model || '').trim();
                    }
                    if ((!desiredProvider || desiredProvider === 'local') && settings && settings.modelProvider) {
                        desiredProvider = String(settings.modelProvider || 'local').trim().toLowerCase() || 'local';
                    }
                } catch (settingsErr) {
                    console.warn('[ConnectorWhatsapp][models] Failed to load saved model settings during selector restore', settingsErr);
                }
            }

            const exactSavedOption = desiredModel
                ? Array.from(modelSelector.options).find(option =>
                    option &&
                    option.value === desiredModel &&
                    option.dataset &&
                    String(option.dataset.provider || '').trim().toLowerCase() === desiredProvider
                )
                : null;
            const fallbackSavedOption = desiredModel
                ? Array.from(modelSelector.options).find(option => option && option.value === desiredModel)
                : null;
            const recoveryOption = exactSavedOption || fallbackSavedOption || null;

            if (recoveryOption) {
                modelSelector.value = recoveryOption.value;
                modelSelector.selectedIndex = recoveryOption.index;

                if (hashedMasterKey && typeof PaiperworkDB !== 'undefined' && typeof PaiperworkDB.saveModel === 'function') {
                    const recoveryProvider = (recoveryOption.dataset && recoveryOption.dataset.provider)
                        ? String(recoveryOption.dataset.provider || '').trim().toLowerCase() || 'local'
                        : 'local';
                    try {
                        await this._persistWhatsappSelectedModel(modelSelector, recoveryOption.value, recoveryProvider);
                    } catch (saveErr) {
                        console.warn('[ConnectorWhatsapp][models] Failed to persist recovered model selection', saveErr);
                    }
                }

                console.info('[ConnectorWhatsapp][models] Recovered blank model selector before WhatsApp handling', {
                    recoveredModel: recoveryOption.value,
                    recoveredProvider: (recoveryOption.dataset && recoveryOption.dataset.provider) || 'local'
                });
            } else {
                console.warn('[ConnectorWhatsapp][models] Selector recovery skipped because the last used model is unavailable', {
                    desiredModel,
                    desiredProvider
                });
            }
        }

        const models = Array.from(modelSelector.options)
            .filter(option => option && String(option.value || '').trim())
            .map(option => ({
                index: option.index,
                value: String(option.value || '').trim(),
                label: String(option.textContent || option.label || option.value || '').trim(),
                provider: String((option.dataset && option.dataset.provider) || (window.OllamaAPI && typeof window.OllamaAPI.getModelSource === 'function'
                    ? (window.OllamaAPI.getModelSource(option.value) || 'local')
                    : 'local')).trim().toLowerCase() || 'local',
                isCurrent: option.index === modelSelector.selectedIndex && String(option.value || '').trim() === String(modelSelector.value || '').trim()
            }));

        return { modelSelector, models };
    }

    _normalizeWhatsappModelAlias(value) {
        return this._normalizeDocumentIntentKeymapText(String(value || ''));
    }

    _mergeAlphaNumericModelTokens(text) {
        return String(text || '')
            .replace(/\b([a-z]+)\s+(\d+)\b/gi, '$1$2')
            .replace(/\b([a-z]+\d+)\s+(\d+)\b/gi, '$1 $2')
            .replace(/\s+/g, ' ')
            .trim();
    }

    _normalizeWhatsappModelQuantization(text) {
        return String(text || '')
            .replace(/\bq(\d+)\s*0\b/gi, 'q$1')
            .replace(/\bq(\d+)\s+[a-z](?:\s+[a-z])?\b/gi, 'q$1')
            .replace(/\s+/g, ' ')
            .trim();
    }

    _stripWhatsappModelLatestTag(text) {
        return String(text || '')
            .replace(/\blatest\b/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    _stripWhatsappModelQuantization(text) {
        return String(text || '')
            .replace(/\bq\d+\b/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    _buildWhatsappModelAliases(model) {
        const rawValues = [model && model.value, model && model.label]
            .map(value => String(value || '').trim())
            .filter(Boolean);
        const aliases = new Set();

        for (const rawValue of rawValues) {
            const normalized = this._normalizeWhatsappModelAlias(rawValue);
            const merged = this._mergeAlphaNumericModelTokens(normalized);
            const quantNormalized = this._normalizeWhatsappModelQuantization(merged);
            const withoutLatest = this._stripWhatsappModelLatestTag(quantNormalized);
            const withoutQuant = this._stripWhatsappModelQuantization(withoutLatest);

            [normalized, merged, quantNormalized, withoutLatest, withoutQuant]
                .map(value => String(value || '').trim())
                .filter(Boolean)
                .forEach(value => aliases.add(value));
        }

        return Array.from(aliases);
    }

    _extractWhatsappModelQuantToken(text) {
        const normalized = this._normalizeWhatsappModelQuantization(this._normalizeWhatsappModelAlias(text));
        const match = normalized.match(/\bq\d+\b/i);
        return match ? match[0].toLowerCase() : '';
    }

    _extractWhatsappModelQuantRank(model) {
        const aliasBlob = this._buildWhatsappModelAliases(model).join(' ');
        const match = aliasBlob.match(/\bq(\d+)\b/i);
        return match ? Number(match[1]) || 0 : 0;
    }

    _scoreWhatsappModelCandidate(requestedModelName, model) {
        const normalizedRequest = this._normalizeWhatsappModelAlias(requestedModelName);
        if (!normalizedRequest) return 0;

        const mergedRequest = this._mergeAlphaNumericModelTokens(normalizedRequest);
        const quantNormalizedRequest = this._normalizeWhatsappModelQuantization(mergedRequest);
        const requestWithoutQuant = this._stripWhatsappModelQuantization(quantNormalizedRequest);
        const compactRequest = quantNormalizedRequest.replace(/\s+/g, '');
        const compactRequestWithoutQuant = requestWithoutQuant.replace(/\s+/g, '');
        const requestQuant = this._extractWhatsappModelQuantToken(quantNormalizedRequest);
        const requestAliases = [...new Set([
            normalizedRequest,
            mergedRequest,
            quantNormalizedRequest,
            requestWithoutQuant
        ].filter(Boolean))];
        const aliases = this._buildWhatsappModelAliases(model);

        let bestScore = 0;
        for (const alias of aliases) {
            const compactAlias = alias.replace(/\s+/g, '');
            const aliasWithoutQuant = this._stripWhatsappModelQuantization(alias);
            const compactAliasWithoutQuant = aliasWithoutQuant.replace(/\s+/g, '');
            const aliasQuant = this._extractWhatsappModelQuantToken(alias);

            if (requestAliases.includes(alias) || compactAlias === compactRequest) {
                bestScore = Math.max(bestScore, 100);
                continue;
            }

            if (requestQuant && aliasQuant === requestQuant && alias.includes(requestWithoutQuant)) {
                bestScore = Math.max(bestScore, 96);
                continue;
            }

            if (alias.includes(quantNormalizedRequest)
                || quantNormalizedRequest.includes(alias)
                || compactAlias.includes(compactRequest)
                || compactRequest.includes(compactAlias)
                || (requestWithoutQuant && aliasWithoutQuant.includes(requestWithoutQuant))
                || (requestWithoutQuant && requestWithoutQuant.includes(aliasWithoutQuant))
                || (compactRequestWithoutQuant && compactAliasWithoutQuant.includes(compactRequestWithoutQuant))) {
                bestScore = Math.max(bestScore, 85);
            }

            const aliasTokens = new Set(alias.split(/\s+/).filter(Boolean));
            const requestTokens = new Set(quantNormalizedRequest.split(/\s+/).filter(Boolean));
            const overlap = Array.from(requestTokens).filter(token => aliasTokens.has(token)).length;
            if (overlap > 0) {
                const score = Math.round((overlap / Math.max(aliasTokens.size, requestTokens.size, 1)) * 70);
                bestScore = Math.max(bestScore, score);
            }

            if (requestWithoutQuant) {
                const aliasNoQuantTokens = new Set(aliasWithoutQuant.split(/\s+/).filter(Boolean));
                const requestNoQuantTokens = new Set(requestWithoutQuant.split(/\s+/).filter(Boolean));
                const noQuantOverlap = Array.from(requestNoQuantTokens).filter(token => aliasNoQuantTokens.has(token)).length;
                if (noQuantOverlap > 0) {
                    const score = Math.round((noQuantOverlap / Math.max(aliasNoQuantTokens.size, requestNoQuantTokens.size, 1)) * 68);
                    bestScore = Math.max(bestScore, score);
                }
            }
        }

        return bestScore;
    }

    _matchWhatsappRequestedModel(requestedModelName, models, requestedProvider = null) {
        const filteredModels = Array.isArray(models)
            ? models.filter(model => !requestedProvider || model.provider === requestedProvider)
            : [];

        if (filteredModels.length === 0) {
            return { match: null, ambiguous: false };
        }

        const requestQuant = this._extractWhatsappModelQuantToken(requestedModelName);
        const scored = filteredModels
            .map(model => {
                const aliases = this._buildWhatsappModelAliases(model);
                const aliasBlob = aliases.join(' ');
                const quantRank = this._extractWhatsappModelQuantRank(model);
                const matchesRequestedQuant = !!requestQuant && aliasBlob.includes(requestQuant);
                return {
                    model,
                    score: this._scoreWhatsappModelCandidate(requestedModelName, model),
                    quantRank,
                    matchesRequestedQuant
                };
            })
            .filter(entry => entry.score > 0)
            .sort((left, right) => {
                if (right.score !== left.score) return right.score - left.score;
                if (right.matchesRequestedQuant !== left.matchesRequestedQuant) return Number(right.matchesRequestedQuant) - Number(left.matchesRequestedQuant);
                if (right.quantRank !== left.quantRank) return right.quantRank - left.quantRank;
                return left.model.label.localeCompare(right.model.label);
            });

        if (scored.length === 0 || scored[0].score < 35) {
            return { match: null, ambiguous: false };
        }

        if (scored.length > 1
            && scored[1].score === scored[0].score
            && scored[1].matchesRequestedQuant === scored[0].matchesRequestedQuant
            && scored[1].quantRank === scored[0].quantRank) {
            return { match: null, ambiguous: true };
        }

        return { match: scored[0].model, ambiguous: false };
    }

    async _getWhatsappLocalizedModelProviderLabel(provider, language) {
        if (provider === 'cloud') {
            return this._getLocalizedLangText(language, 'whatsappModelsProviderCloud', 'Cloud');
        }
        return this._getLocalizedLangText(language, 'whatsappModelsProviderLocal', 'Local');
    }

    async _persistWhatsappSelectedModel(modelSelector = null, fallbackModel = '', fallbackProvider = 'local') {
        const selector = modelSelector || document.getElementById('model-selector');
        if (!selector || typeof PaiperworkDB === 'undefined' || typeof PaiperworkDB.saveModel !== 'function') {
            return false;
        }

        const liveMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
        if (!liveMasterKey) {
            console.warn('[ConnectorWhatsapp][models] Skipping model persistence because no live master key is available');
            return false;
        }

        const selectedOption = selector.options[selector.selectedIndex] || null;
        const selectedModel = String(selector.value || fallbackModel || '').trim();
        const selectedProvider = String(
            (selectedOption && selectedOption.dataset && selectedOption.dataset.provider)
                || fallbackProvider
                || (window.OllamaAPI && typeof window.OllamaAPI.getModelSource === 'function'
                    ? (window.OllamaAPI.getModelSource(selectedModel) || 'local')
                    : 'local')
        ).trim().toLowerCase() || 'local';

        if (!selectedModel) {
            console.warn('[ConnectorWhatsapp][models] Skipping model persistence because the selector has no resolved model');
            return false;
        }

        const saved = await PaiperworkDB.saveModel(liveMasterKey, selectedModel, selectedProvider);
        if (!saved) {
            console.warn('[ConnectorWhatsapp][models] Failed to persist WhatsApp-selected model', {
                selectedModel,
                selectedProvider
            });
        }
        return !!saved;
    }

    async _handleWhatsappModelCommand(phone, replyTarget, userText, language, phoneContext = null) {
        const command = this._parseWhatsappModelCommand(userText);
        if (!command) {
            return false;
        }

        const botPrefix = '🤖 ';
        const { modelSelector, models } = await this._loadWhatsappAvailableModels();
        const modelLocked = await this._getWhatsappModelLockState();

        if (!modelSelector || !Array.isArray(models) || models.length === 0) {
            const unavailableText = await this._getLocalizedLangText(
                language,
                'whatsappModelsUnavailable',
                'I could not load the model list right now.'
            );
            await this.postWhatsappText(replyTarget || phone, `${botPrefix}${unavailableText}`);
            return true;
        }

        if (command.type === 'current') {
            const currentModel = models.find(model => model.isCurrent) || null;
            if (!currentModel) {
                const noCurrentText = await this._getLocalizedLangText(
                    language,
                    'whatsappModelsCurrentUnknown',
                    'No model is currently selected.'
                );
                await this.postWhatsappText(replyTarget || phone, `${botPrefix}${noCurrentText}`);
                return true;
            }

            const providerLabel = await this._getWhatsappLocalizedModelProviderLabel(currentModel.provider, language);
            const currentText = await this._getLocalizedLangText(
                language,
                'whatsappModelsCurrentAnswer',
                'The current model is {model} ({provider}).',
                {
                    model: currentModel.label,
                    provider: providerLabel
                }
            );
            await this.postWhatsappText(replyTarget || phone, `${botPrefix}${currentText}`);
            return true;
        }

        if (command.type === 'list') {
            const localHeader = await this._getLocalizedLangText(language, 'whatsappModelsLocalHeader', 'Local models');
            const cloudHeader = await this._getLocalizedLangText(language, 'whatsappModelsCloudHeader', 'Cloud models');
            const availableTitle = await this._getLocalizedLangText(language, 'whatsappModelsAvailableTitle', 'Available models');
            const currentTitle = await this._getLocalizedLangText(language, 'whatsappModelsCurrentModel', 'Current model');
            const noLocalText = await this._getLocalizedLangText(language, 'whatsappModelsNoLocal', 'No local models available.');
            const noCloudText = await this._getLocalizedLangText(language, 'whatsappModelsNoCloud', 'No cloud models available.');
            const tipText = modelLocked
                ? await this._getLocalizedLangText(
                    language,
                    'whatsappModelsLockedTip',
                    'AI model changes are locked. Disable "Lock AI model" in Connectors to allow switching.'
                )
                : await this._getLocalizedLangText(
                    language,
                    'whatsappModelsListTip',
                    'Reply with "Use Gemma4 Local" or "Use Gemma4 Cloud" to switch models.'
                );
            const currentMarker = await this._getLocalizedLangText(language, 'whatsappModelsCurrentMarker', 'current');

            const formatModels = (items, emptyText) => {
                if (!Array.isArray(items) || items.length === 0) {
                    return `- ${emptyText}`;
                }
                return items.map(item => `- ${item.label}${item.isCurrent ? ` (${currentMarker})` : ''}`).join('\n');
            };

            const localModels = models.filter(model => model.provider === 'local');
            const cloudModels = models.filter(model => model.provider === 'cloud');
            const currentModel = models.find(model => model.isCurrent) || null;
            const currentProviderLabel = currentModel
                ? await this._getWhatsappLocalizedModelProviderLabel(currentModel.provider, language)
                : '';

            const parts = [
                `${botPrefix}${availableTitle}`,
                `${localHeader}:\n${formatModels(localModels, noLocalText)}`,
                `${cloudHeader}:\n${formatModels(cloudModels, noCloudText)}`
            ];

            if (currentModel) {
                parts.push(`${currentTitle}: ${currentModel.label} (${currentProviderLabel})`);
            }

            parts.push(tipText);
            await this.postWhatsappText(replyTarget || phone, parts.join('\n\n'));
            return true;
        }

        const requestedModelName = String(command.requestedModelName || '').trim();
        if (!requestedModelName) {
            const missingNameText = await this._getLocalizedLangText(
                language,
                'whatsappModelsSwitchMissingName',
                'Tell me which model to use, for example: "Use Gemma4 Local".'
            );
            await this.postWhatsappText(replyTarget || phone, `${botPrefix}${missingNameText}`);
            return true;
        }

        if (modelLocked) {
            const lockedText = await this._getLocalizedLangText(
                language,
                'whatsappModelsSwitchLocked',
                'AI model changes are locked right now. Disable "Lock AI model" in Connectors to allow switching.'
            );
            await this.postWhatsappText(replyTarget || phone, `${botPrefix}${lockedText}`);
            return true;
        }

        const resolution = this._matchWhatsappRequestedModel(requestedModelName, models, command.provider || null);
        if (resolution.ambiguous) {
            const ambiguousText = await this._getLocalizedLangText(
                language,
                'whatsappModelsSwitchAmbiguous',
                'I found more than one match for "{query}". Add "Local" or "Cloud" to choose the right model.',
                { query: requestedModelName }
            );
            await this.postWhatsappText(replyTarget || phone, `${botPrefix}${ambiguousText}`);
            return true;
        }

        const matchedModel = resolution.match;
        if (!matchedModel) {
            const notFoundText = await this._getLocalizedLangText(
                language,
                'whatsappModelsSwitchNotFound',
                'I could not find a matching model for "{query}". Ask me to show your models for the current list.',
                { query: requestedModelName }
            );
            await this.postWhatsappText(replyTarget || phone, `${botPrefix}${notFoundText}`);
            return true;
        }

        modelSelector.value = matchedModel.value;
        modelSelector.selectedIndex = matchedModel.index;

        await this._persistWhatsappSelectedModel(modelSelector, matchedModel.value, matchedModel.provider);

        if (typeof OllamaAPI !== 'undefined' && OllamaAPI) {
            OllamaAPI.previousContext = null;
            if (typeof OllamaAPI.resetContext === 'function') {
                OllamaAPI.resetContext();
            }
        }

        const updatedPhoneContext = (phoneContext && typeof phoneContext === 'object')
            ? { ...phoneContext }
            : ((await this._getWhatsappPhoneContext(phone)) || {});
        updatedPhoneContext.localPreviousContext = null;
        updatedPhoneContext.conversationTurns = [];
        await this._setWhatsappPhoneContext(phone, updatedPhoneContext);

        try {
            modelSelector.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (dispatchErr) {
            console.warn('[ConnectorWhatsapp][models] Failed to dispatch model selector change event', dispatchErr);
        }

        const providerLabel = await this._getWhatsappLocalizedModelProviderLabel(matchedModel.provider, language);
        const switchedText = await this._getLocalizedLangText(
            language,
            'whatsappModelsSwitchSuccess',
            'Model changed to {model} ({provider}). Future replies will use this model.',
            {
                model: matchedModel.label,
                provider: providerLabel
            }
        );
        await this.postWhatsappText(replyTarget || phone, `${botPrefix}${switchedText}`);
        return true;
    }

    _presentationRequestHasExplicitSourceText(text) {
        const normalized = this._normalizeWhatsappResearchReportText(text);
        if (!normalized) return false;

        const parts = this._extractPresentationRequestParts(normalized);
        if (!parts.sourceText) return false;

        if (parts.sourceText !== normalized) {
            return true;
        }

        const lines = normalized.split('\n').filter(Boolean);
        return lines.length > 1 && this._isPresentationIntent(lines[0]);
    }

    _isSavedPresentationIntent(text) {
        const normalized = this._normalizeDocumentIntentKeymapText(text);
        if (!normalized) return false;

        const savedCueTokens = this._getPresentationKeymapTokens('savedCues');
        const browseTokens = this._getPresentationKeymapTokens('actions.browse');
        const sendTokens = this._getPresentationKeymapTokens('actions.send');
        const intentTokens = this._getPresentationKeymapTokens('intent');

        const hasSavedCue = this._textMatchesDocumentKeymapTokens(normalized, savedCueTokens);
        const hasPresentationNoun = this._textMatchesDocumentKeymapTokens(normalized, intentTokens);
        const hasBrowseAction = this._textMatchesDocumentKeymapTokens(normalized, browseTokens);
        const hasSendAction = this._textMatchesDocumentKeymapTokens(normalized, sendTokens);

        return hasSavedCue || (hasPresentationNoun && (hasBrowseAction || hasSendAction) && !this._presentationRequestHasExplicitSourceText(text));
    }

    async _getSavedPromptablePresentationsForWhatsapp() {
        const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
        if (!hashedMasterKey || typeof PaiperworkDB === 'undefined' || typeof PaiperworkDB.getPromptablePresentations !== 'function') {
            console.warn('[ConnectorWhatsapp][presentation] Saved presentations unavailable', {
                hasHashedMasterKey: !!hashedMasterKey,
                hasDbApi: typeof PaiperworkDB !== 'undefined',
                hasListFn: typeof PaiperworkDB !== 'undefined' && typeof PaiperworkDB.getPromptablePresentations === 'function'
            });
            return [];
        }

        const items = await PaiperworkDB.getPromptablePresentations(hashedMasterKey);
        const normalizedItems = Array.isArray(items) ? items : [];
        const sendableItems = [];

        if (typeof PaiperworkDB.loadPromptablePresentationHtml === 'function') {
            for (const item of normalizedItems) {
                const html = await PaiperworkDB.loadPromptablePresentationHtml(hashedMasterKey, item && item.id);
                const htmlLength = String(html || '').trim().length;
                if (htmlLength > 0) {
                    sendableItems.push(item);
                    continue;
                }

                console.warn('[ConnectorWhatsapp][presentation] Skipping unsendable saved presentation for WhatsApp list', {
                    id: item && item.id,
                    title: item && item.title ? item.title : '',
                    hashedMasterKeyPrefix: hashedMasterKey.slice(0, 8)
                });
            }
        }

        const itemsForWhatsapp = typeof PaiperworkDB.loadPromptablePresentationHtml === 'function'
            ? sendableItems
            : normalizedItems;

        console.info('[ConnectorWhatsapp][presentation] Loaded saved presentations', {
            count: itemsForWhatsapp.length,
            hashedMasterKeyPrefix: hashedMasterKey.slice(0, 8),
            ids: itemsForWhatsapp.map(item => item && item.id).filter(Boolean)
        });
        return itemsForWhatsapp;
    }

    _matchSavedPresentationSelection(input, presentations = []) {
        const rawInput = String(input || '').trim();
        if (!rawInput || !Array.isArray(presentations) || presentations.length === 0) {
            return null;
        }

        const selectionCandidate = this._extractSavedPresentationSelectionCandidate(rawInput);

        const numericChoice = Number(selectionCandidate);
        if (!Number.isNaN(numericChoice) && Number.isFinite(numericChoice) && numericChoice >= 1 && numericChoice <= presentations.length) {
            return presentations[numericChoice - 1];
        }

        const normalize = (value) => this._normalizeDocumentIntentKeymapText(value);
        const compact = (value) => normalize(value).replace(/\s+/g, '');
        const normalizedInput = normalize(selectionCandidate);
        const compactInput = compact(selectionCandidate);

        if (!normalizedInput) {
            return null;
        }

        let match = presentations.find(item => {
            const normalizedTitle = normalize(item.title || '');
            return normalizedTitle && normalizedTitle === normalizedInput;
        });

        if (!match) {
            match = presentations.find(item => {
                const normalizedTitle = normalize(item.title || '');
                const compactTitle = compact(item.title || '');
                return normalizedTitle.includes(normalizedInput)
                    || (compactInput && compactTitle.includes(compactInput));
            });
        }

        return match || null;
    }

    _extractSavedPresentationSelectionCandidate(input) {
        const rawInput = this._normalizeWhatsappResearchReportText(input);
        if (!rawInput) {
            return '';
        }

        let candidate = rawInput;
        const sendTokens = this._getPresentationKeymapTokens('actions.send');
        const browseTokens = this._getPresentationKeymapTokens('actions.browse');
        const savedCues = this._getPresentationKeymapTokens('savedCues');
        const intentTokens = this._getPresentationKeymapTokens('intent');

        const removablePrefixes = [...new Set([...sendTokens, ...browseTokens])]
            .map(token => String(token || '').trim())
            .filter(Boolean)
            .sort((left, right) => right.length - left.length);

        for (const token of removablePrefixes) {
            const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            candidate = candidate.replace(new RegExp(`^${escapedToken}\\s+`, 'i'), '');
        }

        candidate = candidate.replace(/^(?:me|the|my|this|that|to\s+me|for\s+me)\s+/i, '');
        candidate = candidate.replace(/^(?:el|la|los|las|mi|mis|para\s+mi)\s+/i, '');
        candidate = candidate.replace(/^(?:o|a|os|as|minha|minhas|meu|meus|para\s+mim)\s+/i, '');
        candidate = candidate.replace(/^(?:le|la|les|ma|mes|moi|pour\s+moi)\s+/i, '');
        candidate = candidate.replace(/^(?:der|die|das|den|dem|mein|meine|meinen|fur\s+mich|für\s+mich)\s+/i, '');
        candidate = candidate.replace(/^(?:il|lo|la|gli|le|mia|mie|mio|miei|per\s+me)\s+/i, '');
        candidate = candidate.replace(/^(?:эт[ао]|мой|моя|мои|мне)\s+/i, '');

        const removableSuffixes = [...new Set([...savedCues, ...intentTokens])]
            .map(token => String(token || '').trim())
            .filter(Boolean)
            .sort((left, right) => right.length - left.length);

        for (const token of removableSuffixes) {
            const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            candidate = candidate.replace(new RegExp(`\\s+${escapedToken}$`, 'i'), '');
        }

        candidate = candidate.replace(/^[-:,.\s]+|[-:,.\s]+$/g, '').trim();
        return candidate || rawInput;
    }

    _matchPendingSavedPresentationFollowUp(phone, text) {
        const pendingSelection = this._getPendingPresentationSelection(phone);
        if (!pendingSelection || !Array.isArray(pendingSelection.items) || pendingSelection.items.length === 0) {
            return null;
        }

        if (this._presentationRequestHasExplicitSourceText(text)) {
            return null;
        }

        return this._matchSavedPresentationSelection(text, pendingSelection.items);
    }

    async _sendSavedPresentationToWhatsapp(phone, presentationItem, language = null) {
        const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
        if (!phone || !presentationItem || !hashedMasterKey) {
            console.warn('[ConnectorWhatsapp][presentation] Saved presentation send blocked', {
                hasPhone: !!phone,
                hasPresentationItem: !!presentationItem,
                hasHashedMasterKey: !!hashedMasterKey
            });
            return false;
        }

        if (typeof PaiperworkDB === 'undefined' || typeof PaiperworkDB.loadPromptablePresentationHtml !== 'function') {
            console.warn('[ConnectorWhatsapp][presentation] Saved presentation send unavailable: DB loader missing');
            return false;
        }

        console.info('[ConnectorWhatsapp][presentation] Sending saved presentation start', {
            phone: String(phone || '').replace(/@.*$/g, ''),
            id: presentationItem.id,
            title: presentationItem.title || '',
            hashedMasterKeyPrefix: hashedMasterKey.slice(0, 8)
        });

        const html = await PaiperworkDB.loadPromptablePresentationHtml(hashedMasterKey, presentationItem.id);
        const normalizedHtml = String(html || '').trim();
        if (!normalizedHtml) {
            console.warn('[ConnectorWhatsapp][presentation] Saved presentation HTML was empty', {
                id: presentationItem.id,
                title: presentationItem.title || '',
                hashedMasterKeyPrefix: hashedMasterKey.slice(0, 8)
            });
            return false;
        }

        const title = String(presentationItem.title || 'SlideForge Presentation').trim() || 'SlideForge Presentation';
        const filename = this._sanitizeWhatsappPresentationFilename(title);
        const blob = new Blob([normalizedHtml], { type: 'text/html' });
        console.info('[ConnectorWhatsapp][presentation] Saved presentation HTML ready', {
            id: presentationItem.id,
            title,
            filename,
            htmlLength: normalizedHtml.length,
            htmlPreview: normalizedHtml.slice(0, 120)
        });
        await this.postWhatsappFile(phone, blob, filename, `🤖 ${title}`);
        console.info('[ConnectorWhatsapp][presentation] Saved presentation file post completed', {
            id: presentationItem.id,
            title,
            filename
        });

        const sentText = await this._getLocalizedLangText(
            language,
            'presentationSent',
            'Presentation created and sent as an HTML file.'
        );
        await this.postWhatsappText(phone, `🤖 ${sentText}`);
        return true;
    }

    async _handleWhatsappSavedPresentations(phone, requestText, language = null) {
        const presentations = await this._getSavedPromptablePresentationsForWhatsapp();
        const botPrefix = '🤖 ';
        const pendingSelection = this._getPendingPresentationSelection(phone);
        const normalizedRequest = this._normalizeWhatsappResearchReportText(requestText);

        console.info('[ConnectorWhatsapp][presentation] Handling saved presentations request', {
            phone: String(phone || '').replace(/@.*$/g, ''),
            requestText: normalizedRequest,
            pendingSelectionCount: Array.isArray(pendingSelection && pendingSelection.items) ? pendingSelection.items.length : 0,
            availableCount: presentations.length
        });

        if (!presentations.length) {
            this._clearPendingPresentationSelection(phone);
            const emptyText = await this._getLocalizedLangText(
                language,
                'presentationSavedEmpty',
                'No saved presentations are currently available.'
            );
            await this.postWhatsappText(phone, `${botPrefix}${emptyText}`);
            return true;
        }

        const trySelection = pendingSelection
            ? this._matchSavedPresentationSelection(normalizedRequest, pendingSelection.items || presentations)
            : this._matchSavedPresentationSelection(normalizedRequest, presentations);

        console.info('[ConnectorWhatsapp][presentation] Saved presentation selection result', {
            requestText: normalizedRequest,
            matchedId: trySelection && trySelection.id,
            matchedTitle: trySelection && trySelection.title,
            usedPendingSelection: !!pendingSelection
        });

        if (trySelection) {
            const selectionItems = Array.isArray(pendingSelection && pendingSelection.items) && pendingSelection.items.length
                ? pendingSelection.items
                : presentations.slice(0, 10);
            this._setPendingPresentationSelection(phone, { items: selectionItems });
            const sendingText = await this._getLocalizedLangText(
                language,
                'presentationSendingSaved',
                'Sending saved presentation: {title}',
                { title: trySelection.title || 'Presentation' }
            );
            await this.postWhatsappText(phone, `${botPrefix}${sendingText}`);
            const sent = await this._sendSavedPresentationToWhatsapp(phone, trySelection, language);
            if (!sent) {
                const failedText = await this._getLocalizedLangText(
                    language,
                    'presentationSavedSendFailed',
                    'Failed to load or send the selected saved presentation.'
                );
                await this.postWhatsappText(phone, `${botPrefix}${failedText}`);
            }
            return true;
        }

        const shouldList = this._isSavedPresentationIntent(normalizedRequest) || !!pendingSelection;
        if (shouldList) {
            const listItems = presentations.slice(0, 10);
            this._setPendingPresentationSelection(phone, { items: listItems });
            const names = listItems.map((item, index) => `${index + 1}. ${item.title || 'Presentation'}`).join('\n');
            const promptText = await this._getLocalizedLangText(
                language,
                'presentationChooseSavedPrompt',
                'Choose from the saved presentations:'
            );
            const tipText = await this._getLocalizedLangText(
                language,
                'presentationChooseSavedTip',
                'To receive one, reply with "Send me <presentation name>" or "Send me <number>".'
            );
            await this.postWhatsappText(phone, `${botPrefix}${promptText}\n${names}\n${tipText}`);
            return true;
        }

        return false;
    }

    _estimatePromptablePresentationSlides(sourceText) {
        const text = this._normalizeWhatsappResearchReportText(sourceText);
        if (!text) return 5;

        const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
        const paragraphs = text.split(/\n\s*\n+/).map(part => part.trim()).filter(Boolean);
        const wordCount = (text.match(/\S+/g) || []).length;
        const sentenceCount = (text.match(/[.!?]+(?=\s|$)/g) || []).length || Math.max(1, paragraphs.length);
        const bulletCount = lines.filter(line => /^([\-*•]|\d+[.)])\s+/.test(line)).length;
        const headingCount = lines.filter(line => this._isPresentationHeadingCandidate(line)).length;
        const sectionAnchorCount = lines.filter(line => this._isPresentationSectionAnchor(line)).length;
        const denseParagraphCount = paragraphs.filter(paragraph => ((paragraph.match(/\S+/g) || []).length >= 120)).length;

        const lengthEstimate = Math.ceil(wordCount / 110);
        const sentenceEstimate = Math.ceil(sentenceCount / 5);
        const structureEstimate = Math.ceil(
            (headingCount * 1.4)
            + (sectionAnchorCount * 1.25)
            + (bulletCount / 4)
            + (paragraphs.length * 0.55)
            + (denseParagraphCount * 0.75)
        );

        let slideEstimate = Math.max(lengthEstimate, sentenceEstimate, structureEstimate, 3);

        if (headingCount >= 3) {
            slideEstimate = Math.max(slideEstimate, headingCount + Math.ceil(bulletCount / 6));
        }

        if (sectionAnchorCount >= 2) {
            slideEstimate = Math.max(slideEstimate, sectionAnchorCount + Math.ceil(paragraphs.length / 2));
        }

        return Math.max(3, Math.min(15, slideEstimate || 5));
    }

    _isPresentationHeadingCandidate(line) {
        const candidate = String(line || '').trim();
        if (!candidate) return false;
        if (/^([\-*•]|\d+[.)])\s+/.test(candidate)) return false;
        if (candidate.length > 90) return false;

        const wordCount = (candidate.match(/\S+/g) || []).length;
        if (wordCount === 0 || wordCount > 10) return false;

        if (/^#{1,6}\s+/.test(candidate)) return true;
        if (/:$/.test(candidate)) return true;
        if (/^[A-Z0-9\s&:/\-]{4,}$/.test(candidate)) return true;
        if (/^(?:[A-Z][^.!?\n]+)$/.test(candidate) && wordCount <= 8) return true;

        return false;
    }

    _isPresentationSectionAnchor(line) {
        const candidate = this._normalizeDocumentIntentKeymapText(line);
        if (!candidate) return false;

        const sectionAnchors = window.Keymaps
            && window.Keymaps.presentation
            && Array.isArray(window.Keymaps.presentation.sectionAnchors)
            ? window.Keymaps.presentation.sectionAnchors
            : [];

        if (!sectionAnchors.length) return false;

        return sectionAnchors.some(anchor => {
            const normalizedAnchor = this._normalizeDocumentIntentKeymapText(anchor);
            if (!normalizedAnchor) return false;

            return candidate === normalizedAnchor
                || candidate.startsWith(normalizedAnchor + ':')
                || candidate.startsWith(normalizedAnchor + ' -')
                || candidate.includes(' ' + normalizedAnchor + ' ');
        });
    }

    _sanitizeWhatsappPresentationFilename(title) {
        const cleaned = String(title || 'slideforge-presentation')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80);
        return `${cleaned || 'slideforge-presentation'}.html`;
    }

    async _waitForWhatsappUi(checkFn, timeoutMs = 5000, intervalMs = 50) {
        const timeoutAt = Date.now() + timeoutMs;
        while (Date.now() < timeoutAt) {
            try {
                const result = checkFn();
                if (result) return result;
            } catch (_err) {
            }
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
        return null;
    }

    _getResearchKeymapConfig() {
        const keymap = window.Keymaps && window.Keymaps.research;
        if (Array.isArray(keymap)) {
            return {
                intent: keymap,
                actions: {},
                outputs: [],
                modifiers: [],
                terms: keymap
            };
        }

        return keymap || {
            intent: [],
            actions: {},
            outputs: [],
            modifiers: [],
            terms: []
        };
    }

    _getResearchKeymapTokens(...paths) {
        const keymap = this._getResearchKeymapConfig();
        const collected = [];

        for (const path of paths) {
            const segments = String(path || '').split('.').filter(Boolean);
            let value = keymap;
            for (const segment of segments) {
                value = value && value[segment];
            }
            if (Array.isArray(value)) {
                collected.push(...value);
            }
        }

        return [...new Set(collected.map(token => String(token || '').trim()).filter(Boolean))];
    }

    _isResearchIntent(text) {
        const normalizedText = this._normalizeDocumentIntentKeymapText(text);
        if (!normalizedText) return false;

        const intentTokens = this._getResearchKeymapTokens('intent');
        const compareTokens = this._getResearchKeymapTokens('actions.compare');
        const createTokens = this._getResearchKeymapTokens('actions.create');
        const outputTokens = this._getResearchKeymapTokens('outputs');
        const modifierTokens = this._getResearchKeymapTokens('modifiers');

        const hasIntent = this._textMatchesDocumentKeymapTokens(normalizedText, intentTokens);
        const hasCompare = this._textMatchesDocumentKeymapTokens(normalizedText, compareTokens);
        const hasCreate = this._textMatchesDocumentKeymapTokens(normalizedText, createTokens);
        const hasOutput = this._textMatchesDocumentKeymapTokens(normalizedText, outputTokens);
        const hasModifier = this._textMatchesDocumentKeymapTokens(normalizedText, modifierTokens);
        const wordCount = normalizedText.split(/\s+/).filter(Boolean).length;

        if (hasIntent || hasCompare) {
            return true;
        }

        if (hasCreate && hasOutput && (hasModifier || wordCount >= 4)) {
            return true;
        }

        if (hasOutput && hasModifier && wordCount >= 4) {
            return true;
        }

        return false;
    }

    _extractDataVizType(text) {
        if (!text) return null;
        const candidate = String(text || '').toLowerCase();

        if (window.Keymaps && window.Keymaps.dataViz) {
            const chartTypeMap = window.Keymaps.dataViz.chartType;
            for (const [type, tokens] of Object.entries(chartTypeMap)) {
                for (const token of tokens) {
                    if (candidate.includes(token)) {
                        return type;
                    }
                }
            }
        }

        return null;
    }

    async _ensureDataVizReady() {
        if (typeof window === 'undefined') return false;
        if (window.dataViz && window.dataVizTab) return true;

        if (window.tabLoader && typeof window.tabLoader.loadTabScripts === 'function') {
            try {
                await window.tabLoader.loadTabScripts('dataviz');
            } catch (error) {
                console.warn('[ConnectorWhatsapp][debug] _ensureDataVizReady failed to load dataviz tab', error);
            }
        }

        if (!window.dataViz && typeof window.DataViz === 'function') {
            window.dataViz = new window.DataViz();
            await window.dataViz.initialize();
        }

        if (!window.dataVizTab && typeof window.DataVizTab === 'function') {
            window.dataVizTab = new window.DataVizTab();
            await window.dataVizTab.initialize();
        }

        return !!window.dataViz && !!window.dataVizTab;
    }

    async _activateDataVizButton(vizType) {
        if (!vizType) return false;

        const cleanedType = String(vizType || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        if (!cleanedType) return false;

        const supported = ['pie','bar','line','scatter','area','radar','heatmap','bubble'];
        if (!supported.includes(cleanedType)) {
            console.warn('[ConnectorWhatsapp] Unsupported DataViz type:', vizType, '->', cleanedType);
            return false;
        }

        const button = document.querySelector(`.dataviz-button[data-viz-type="${cleanedType}"]`);
        if (button) {
            if (!button.classList.contains('active')) {
                button.click();
            }
            return true;
        }

        // if steps below didn't render from DataVizTab initialization, try to initialize anyway now
        if (window.dataVizTab && typeof window.dataVizTab.initialize === 'function') {
            await window.dataVizTab.initialize();
        }

        const retryButton = document.querySelector(`.dataviz-button[data-viz-type="${cleanedType}"]`);
        if (retryButton) {
            if (!retryButton.classList.contains('active')) {
                retryButton.click();
            }
            return true;
        }

        console.warn('[ConnectorWhatsapp] DataViz button not found after retry:', vizType, 'normalized:', cleanedType);
        return false;
    }

    async postWhatsappImage(chatId, dataUrl, filename) {
        if (!chatId || !dataUrl) return;
        const normalizedPhone = String(chatId).replace(/@.*$/g, '');
        let blob = null;
        try {
            const response = await fetch(dataUrl);
            blob = await response.blob();

            // Send as image so WhatsApp displays it in-image rather than as a generic file
            const fd = new FormData();
            fd.append('phone', normalizedPhone);
            fd.append('image', blob, filename || 'chart.png');

            await fetch('/api/whatsapp/send-image', {
                method: 'POST',
                body: fd
            });
        } catch (err) {
            console.error('ConnectorWhatsapp: postWhatsappImage failed', err);
            // Fallback to existing file send mode
            if (blob) {
                try {
                    await this.postWhatsappFile(normalizedPhone, blob, filename || 'chart.png');
                } catch (fallbackErr) {
                    console.error('ConnectorWhatsapp: postWhatsappImage fallback failed', fallbackErr);
                }
            }
        }
    }

    async _handleWhatsappDataViz(phone, chartType, promptText, language = null) {
        if (!phone || !chartType) return false;

        const successReady = await this._ensureDataVizReady();
        if (!successReady) {
            const unavailableText = await this._getLocalizedLangText(
                language,
                'datavizNotAvailable',
                'DataViz is not available right now. Please try again later.'
            );
            await this.postWhatsappText(phone, `🤖 ${unavailableText}`);
            return true;
        }

        // Ensure DataViz mode is activated in UI
        sessionStorage.setItem('activeVizType', chartType);
        sessionStorage.setItem('datavizModeActive', 'true');
        await this._activateDataVizButton(chartType);

        const creatingText = await this._getLocalizedLangText(
            language,
            'datavizCreatingChart',
            `Creating ${chartType} chart...`,
            { type: chartType }
        );
        await this.postWhatsappText(phone, `🤖 ${creatingText}`);

        try {
            await window.dataViz.createVisualization(chartType, promptText);

            // Follow the same export workflow as the chart view window to capture stable PNG output.
            let capturedDataUrl = null;
            let originalDownloadImage = null;
            if (window.dataViz && typeof window.dataViz.exportChartAsPng === 'function') {
                originalDownloadImage = window.dataViz.downloadImage;
                window.dataViz.downloadImage = (dataUrl, filename) => {
                    capturedDataUrl = dataUrl;
                    // Don't trigger local download here; WhatsApp path handles envelope.
                };

                try {
                    window.dataViz.exportChartAsPng();

                    // Wait for export chart workflow (html2canvas async) to fill capturedDataUrl
                    let waitAttempts = 0;
                    while (!capturedDataUrl && waitAttempts < 40) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        waitAttempts += 1;
                    }

                } catch (exportErr) {
                    console.warn('ConnectorWhatsapp: exportChartAsPng workflow failed', exportErr);
                } finally {
                    if (originalDownloadImage) window.dataViz.downloadImage = originalDownloadImage;
                }
            }

            if (capturedDataUrl) {
                const successText = await this._getLocalizedLangText(
                    language,
                    'datavizGeneratedSuccess',
                    'Chart generated successfully, sending image...'
                );
                await this.postWhatsappText(phone, `🤖 ${successText}`);
                await this.postWhatsappImage(phone, capturedDataUrl, `${chartType}-chart.png`);

                // Close chart window in paiperwork after successful send
                if (window.dataViz && typeof window.dataViz.closeFloatingWindow === 'function') {
                    window.dataViz.closeFloatingWindow();
                } else {
                    const floatingWindow = document.querySelector('.dataviz-floating-window');
                    if (floatingWindow) floatingWindow.remove();
                    const backdrop = document.querySelector('.dataviz-backdrop');
                    if (backdrop) backdrop.remove();
                }

                return true;
            }

            // Fallback if export workflow capture fails
            const fallbackText = await this._getLocalizedLangText(
                language,
                'datavizGeneratedFallback',
                'Chart generated but could not capture image via export workflow. Please view the chart window.'
            );
            await this.postWhatsappText(phone, `🤖 ${fallbackText}`);
            return true;
        } catch (err) {
            console.error('ConnectorWhatsapp: _handleWhatsappDataViz failed', err);
            const failedText = await this._getLocalizedLangText(
                language,
                'datavizGenerationFailed',
                'Failed to generate the chart. Please try again.'
            );
            await this.postWhatsappText(phone, `🤖 ${failedText}`);
            return true;
        }
    }

    async _ensurePromptablePresentationReady() {
        if (window.tabLoader && typeof window.tabLoader.loadTabScripts === 'function') {
            try {
                await window.tabLoader.loadTabScripts('presentation');
            } catch (loadErr) {
                console.warn('[ConnectorWhatsapp][presentation] Failed to load presentation tab scripts', loadErr);
            }
        }

        try {
            const presentationTabButton = document.querySelector('.tab-button[data-tab="presentation"]');
            if (presentationTabButton && !presentationTabButton.classList.contains('active')) {
                presentationTabButton.click();
            }
        } catch (_err) {
        }

        if (typeof window.handlepresentationtab === 'function') {
            try {
                await window.handlepresentationtab();
            } catch (presentationTabErr) {
                console.warn('[ConnectorWhatsapp][presentation] handlepresentationtab failed', presentationTabErr);
            }
        }

        const modeSelector = document.getElementById('presentation-mode-selector');
        if (modeSelector) {
            modeSelector.value = 'promptable-presentation';
            modeSelector.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (window.PromptedPresentationWorkflow && typeof window.PromptedPresentationWorkflow.open === 'function') {
            window.PromptedPresentationWorkflow.open();
        } else {
            console.warn('[ConnectorWhatsapp][presentation] PromptedPresentationWorkflow is still unavailable after presentation tab bootstrap');
        }

        return this._waitForWhatsappUi(() => {
            if (!window.PromptedPresentationWorkflow || !window.PromptedPresentationWorkflow.overlay) {
                return null;
            }

            return window.PromptedPresentationWorkflow;
        }, 7000, 100);
    }

    _closeWhatsappPromptablePresentationWindow() {
        try {
            if (window.PromptedPresentationWorkflow && typeof window.PromptedPresentationWorkflow.close === 'function') {
                window.PromptedPresentationWorkflow.close();
            }
        } catch (closeErr) {
            console.warn('[ConnectorWhatsapp][presentation] Failed to close promptable presentation window', closeErr);
        }
    }

    async _saveWhatsappPromptablePresentationToLibrary(htmlContent, title = '') {
        const workflow = window.PromptedPresentationWorkflow;

        if (!workflow || typeof workflow.savePresentationToLibrary !== 'function') {
            console.warn('[ConnectorWhatsapp][presentation] Promptable presentation autosave unavailable', {
                hasWorkflow: !!workflow,
                hasSaveMethod: !!(workflow && typeof workflow.savePresentationToLibrary === 'function')
            });
            return null;
        }

        const saveResult = await workflow.savePresentationToLibrary({
            htmlContent,
            title,
            mode: 'html',
            promptForName: false,
            showAlerts: false
        });

        console.info('[ConnectorWhatsapp][presentation] Promptable presentation autosaved', {
            id: saveResult && saveResult.id ? saveResult.id : null,
            title: saveResult && saveResult.title ? saveResult.title : String(title || '').trim(),
            htmlLength: saveResult && saveResult.html ? saveResult.html.length : String(htmlContent || '').trim().length
        });

        return saveResult;
    }

    async _generateWhatsappPromptablePresentationHtml(sourceText, slideCount, extraRequestText = '') {
        const workflow = window.PromptedPresentationWorkflow;
        if (!workflow || typeof workflow.generatePresentationHtml !== 'function') {
            throw new Error('Promptable presentation workflow is unavailable.');
        }

        const sanitizedSourceText = this._normalizeWhatsappResearchReportText(sourceText);
        if (!sanitizedSourceText) {
            throw new Error('Presentation source text is empty.');
        }

        const sanitizedExtraRequestText = this._normalizeWhatsappResearchReportText(extraRequestText);
        const clampedSlideCount = Math.max(1, Math.min(20, Number(slideCount) || 5));

        workflow.savedSourceText = sanitizedSourceText;
        workflow.savedExtraRequestText = sanitizedExtraRequestText;
        if (typeof workflow.setPresentationMode === 'function') {
            workflow.setPresentationMode('html');
        } else {
            workflow.selectedPresentationMode = 'html';
        }
        if (workflow.slideCountSelector) {
            workflow.slideCountSelector.value = String(clampedSlideCount);
        }
        if (typeof workflow.updateTextActionButtons === 'function') {
            workflow.updateTextActionButtons();
        }

        const prompt = sanitizedExtraRequestText
            ? workflow.buildUserPromptWithExtra(clampedSlideCount, sanitizedSourceText, sanitizedExtraRequestText)
            : workflow.buildUserPrompt(clampedSlideCount, sanitizedSourceText);

        const abortController = new AbortController();
        const timeoutMs = 5 * 60 * 1000;
        let timeoutTriggered = false;
        const timeoutId = setTimeout(() => {
            timeoutTriggered = true;
            try {
                abortController.abort();
            } catch (_timeoutAbortErr) {
            }
        }, timeoutMs);
        workflow.currentAbortController = abortController;
        if (typeof workflow.setRequestProgressVisible === 'function') {
            workflow.setRequestProgressVisible(true);
        }
        if (typeof workflow.showStreamingHtmlPreview === 'function') {
            workflow.showStreamingHtmlPreview(window.Lang ? (Lang.get('generatingSlideForge') || 'Generating SlideForge...') : 'Generating SlideForge...');
        }

        try {
            const htmlContent = await workflow.generatePresentationHtml(prompt, abortController.signal, 'html', (delta) => {
                if (typeof workflow.queueStreamingHtmlCode === 'function') {
                    workflow.queueStreamingHtmlCode(delta);
                }
            });

            if (typeof workflow.flushStreamingCodePending === 'function') {
                workflow.flushStreamingCodePending(true);
            }
            if (typeof workflow.clearStreamingHtmlPreviewRefs === 'function') {
                workflow.clearStreamingHtmlPreviewRefs();
            }
            if (typeof workflow.setPresentationHtml === 'function') {
                workflow.setPresentationHtml(htmlContent);
            } else {
                workflow.currentPresentationHtml = htmlContent;
            }

            return workflow.currentPresentationHtml || htmlContent;
        } catch (err) {
            if (timeoutTriggered) {
                const timeoutError = new Error('Promptable presentation generation timed out after 5 minutes.');
                timeoutError.code = 'PROMPTABLE_PRESENTATION_TIMEOUT';
                throw timeoutError;
            }
            throw err;
        } finally {
            clearTimeout(timeoutId);
            if (typeof workflow.setRequestProgressVisible === 'function') {
                workflow.setRequestProgressVisible(false);
            }
            workflow.currentAbortController = null;
            if (typeof workflow.updatePromptableWebSearchUiState === 'function') {
                workflow.updatePromptableWebSearchUiState();
            }
        }
    }

    async _handleWhatsappPromptablePresentation(phone, requestText, language = null) {
        if (!phone) return false;

        const shouldUseSavedPresentationFlow = this._isSavedPresentationIntent(requestText)
            || (!!this._getPendingPresentationSelection(phone) && !this._presentationRequestHasExplicitSourceText(requestText));

        if (shouldUseSavedPresentationFlow) {
            return this._handleWhatsappSavedPresentations(phone, requestText, language);
        }

        const workflow = await this._ensurePromptablePresentationReady();
        if (!workflow) {
            const unavailableText = await this._getLocalizedLangText(
                language,
                'presentationNotAvailable',
                'SlideForge promptable presentation is not available right now. Please try again later.'
            );
            await this.postWhatsappText(phone, `🤖 ${unavailableText}`);
            return false;
        }

        const { sourceText, extraRequestText } = this._extractPresentationRequestParts(requestText);
        const effectiveSourceText = sourceText || this._normalizeWhatsappResearchReportText(requestText);
        const slideCount = this._estimatePromptablePresentationSlides(effectiveSourceText);
        this._clearPendingPresentationSelection(phone);

        const creatingText = await this._getLocalizedLangText(
            language,
            'presentationCreating',
            'Creating a promptable SlideForge presentation with {slides} slides...',
            { slides: slideCount }
        );
        await this.postWhatsappText(phone, `🤖 ${creatingText}`);

        try {
            const htmlContent = await this._generateWhatsappPromptablePresentationHtml(effectiveSourceText, slideCount, extraRequestText);
            const normalizedHtml = String(htmlContent || '').trim();
            if (!normalizedHtml) {
                throw new Error('Promptable presentation HTML was empty.');
            }

            const title = window.PromptedPresentationWorkflow && typeof window.PromptedPresentationWorkflow.extractPresentationTitle === 'function'
                ? window.PromptedPresentationWorkflow.extractPresentationTitle(normalizedHtml)
                : 'SlideForge Presentation';
            const filename = this._sanitizeWhatsappPresentationFilename(title);
            const blob = new Blob([normalizedHtml], { type: 'text/html' });

            try {
                await this._saveWhatsappPromptablePresentationToLibrary(normalizedHtml, title);
            } catch (saveErr) {
                console.warn('[ConnectorWhatsapp][presentation] Failed to autosave promptable presentation before WhatsApp send', saveErr);
            }

            await this.postWhatsappFile(phone, blob, filename, `🤖 ${title}`);

            this._closeWhatsappPromptablePresentationWindow();

            const sentText = await this._getLocalizedLangText(
                language,
                'presentationSent',
                'Presentation created and sent as an HTML file.'
            );
            await this.postWhatsappText(phone, `🤖 ${sentText}`);
            return true;
        } catch (err) {
            console.error('ConnectorWhatsapp: _handleWhatsappPromptablePresentation failed', err);
            if (err && err.code === 'PROMPTABLE_PRESENTATION_TIMEOUT') {
                this._closeWhatsappPromptablePresentationWindow();
                const timeoutText = await this._getLocalizedLangText(
                    language,
                    'presentationTimeoutRetry',
                    'Presentation creation timed out due to an unexpected error. Please try again.'
                );
                await this.postWhatsappText(phone, `🤖 ${timeoutText}`);
                return false;
            }
            const failedText = await this._getLocalizedLangText(
                language,
                'presentationFailed',
                'Presentation generation failed. Please try again later.'
            );
            await this.postWhatsappText(phone, `🤖 ${failedText}`);
            return false;
        }
    }

    startIncomingPolling() {
        if (this.incomingPollInterval) return;
        //console.log('ConnectorWhatsapp: startIncomingPolling');
        this._pollWhatsappIncomingMessages().catch(err => console.warn('ConnectorWhatsapp: initial poll failed', err));
        this.incomingPollInterval = setInterval(() => {
            this._pollWhatsappIncomingMessages().catch(err => console.warn('ConnectorWhatsapp: poll failed', err));
        }, this.incomingPollIntervalMs);
    }

    stopIncomingPolling() {
        if (this.incomingPollInterval) {
            clearInterval(this.incomingPollInterval);
            this.incomingPollInterval = null;
        }
    }

    async _pollWhatsappIncomingMessages() {
        try {
            const res = await fetch('/api/whatsapp/incoming/poll', { method: 'GET', headers: { 'Content-Type': 'application/json' }});
            if (!res.ok) {
                return;
            }
            const messages = await res.json();
            if (!Array.isArray(messages) || messages.length === 0) {
                return;
            }
            for (const msg of messages) {
                try {
                    if (this._isWhatsappBotMode() && typeof this.postWhatsappPresence === 'function') {
                        const replyTarget = this._getWhatsappIncomingReplyTarget(msg) || this._getWhatsappIncomingThreadKey(msg);
                        await this._ensureWhatsappPresenceStartedIfNeeded(replyTarget);
                    }
                    const processed = await this._orchestrateMessage(msg);
                    const isBusy = window.isGenerating || (window.chat && window.chat.isGenerating);
                    if (isBusy) {
                        console.info('[ConnectorWhatsapp] Busy generating, queueing incoming WA message');
                        await this.enqueueWhatsappIncomingMessage(processed);
                        continue;
                    }
                    window.dispatchEvent(new CustomEvent('whatsappIncoming', { detail: processed }));
                } catch (e) {
                    console.warn('ConnectorWhatsapp: failed to handle incoming message', e);
                    try {
                        const isBusy = window.isGenerating || (window.chat && window.chat.isGenerating);
                        if (isBusy) {
                            await this.enqueueWhatsappIncomingMessage(msg);
                        } else {
                            window.dispatchEvent(new CustomEvent('whatsappIncoming', { detail: msg }));
                        }
                    } catch (err) {
                        console.warn('ConnectorWhatsapp: failed to dispatch fallback whatsappIncoming', err);
                    }
                }
            }
        } catch (err) {
            console.warn('ConnectorWhatsapp: _pollWhatsappIncomingMessages error', err);
        }
    }

    async postWhatsappText(chatId, text) {
        if (!chatId || !text) return;
        const normalizedPhone = this._getResolvedWhatsappOutgoingTarget(chatId);
        try {
            await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: normalizedPhone,
                    message: text,
                    mode: window.whatsappSelectedMode || 'bot'
                })
            });
        } catch (err) {
            console.error('ConnectorWhatsapp: postWhatsappText failed', err);
        }
    }

    async postWhatsappPresence(chatId, action) {
        if (!chatId || !action) return;
        const normalizedPhone = this._getResolvedWhatsappOutgoingTarget(chatId);
        try {
            await fetch('/api/whatsapp/presence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: normalizedPhone, action: action })
            });
        } catch (err) {
            console.warn('ConnectorWhatsapp: postWhatsappPresence failed', err);
        }
    }

    // Send a file attachment (multipart/form-data) to the server proxy which forwards to the gateway
    async postWhatsappFile(chatId, fileBlob, filename, caption) {
        if (!chatId || !fileBlob) return;
        try {
            const normalizedPhone = this._getResolvedWhatsappOutgoingTarget(chatId);
            const fd = new FormData();
            fd.append('phone', normalizedPhone);
            if (caption) fd.append('caption', caption);
            // Append file. If fileBlob is already a File, preserve name.
            if (fileBlob instanceof File) {
                fd.append('file', fileBlob, filename || fileBlob.name);
            } else {
                fd.append('file', fileBlob, filename || 'snippet.txt');
            }

            console.info('[ConnectorWhatsapp][postWhatsappFile] Sending file', {
                phone: normalizedPhone,
                filename: filename || (fileBlob instanceof File ? fileBlob.name : 'snippet.txt'),
                caption: caption || '',
                size: typeof fileBlob.size === 'number' ? fileBlob.size : null,
                type: fileBlob && fileBlob.type ? fileBlob.type : ''
            });

            const response = await fetch('/api/whatsapp/send-file', {
                method: 'POST',
                body: fd
            });

            const responseText = await response.text().catch(() => '');
            console.info('[ConnectorWhatsapp][postWhatsappFile] Response received', {
                phone: normalizedPhone,
                filename: filename || (fileBlob instanceof File ? fileBlob.name : 'snippet.txt'),
                ok: response.ok,
                status: response.status,
                responseText: responseText.slice(0, 500)
            });

            if (!response.ok) {
                throw new Error(`WhatsApp send-file request failed with status ${response.status}${responseText ? `: ${responseText.slice(0, 200)}` : ''}`);
            }
        } catch (err) {
            console.error('ConnectorWhatsapp: postWhatsappFile failed', err);
            throw err;
        }
    }

    _stripThinkingContent(text) {
        if (!text) return '';
        let s = String(text);
        // Remove common thinking markers and internal tags
        s = s.replace(/<think[^>]*>[\s\S]*?<\/think>/gi, ' ');
        s = s.replace(/<thinking[^>]*>[\s\S]*?<\/thinking>/gi, ' ');
        s = s.replace(/\[\[?THINK\]?\]/gi, ' ');
        s = s.replace(/🤖\s*Thinking\.\.\./gi, ' ');
        s = s.replace(/\bThinking\.\.\.\b/gi, ' ');
        // Remove any leftover XML/HTML tags that are clearly internal
        s = s.replace(/<[^>]+>/g, ' ');
        // Collapse whitespace
        s = s.replace(/\s+/g, ' ').trim();
        return s;
    }

    _parseOrchestratorJSON(raw) {
        if (!raw || typeof raw !== 'string') return null;
        let text = raw.trim();

        // If model echoes the instruction string in full, treat as fallback chat.
        if (/Output\s+ONLY\s+valid\s+JSON/i.test(text)) {
            return {
                tool: 'chat',
                document: '',
                confidence: 0.9,
                reason: 'Unable to parse intent as JSON'
            };
        }

        // Remove thinking tags if present in output
        text = text.replace(/<think[^>]*>[\s\S]*?<\/think>/gi, ' ');
        text = text.replace(/<[^>]+>/g, ' ');

        // Try direct parse
        try {
            return JSON.parse(text);
        } catch (e) {
            // Attempt to extract first JSON object substring
            const m = text.match(/\{[\s\S]*\}/);
            if (m && m[0]) {
                try { return JSON.parse(m[0]); } catch (_) {
                    return {
                        tool: 'chat',
                        document: '',
                        confidence: 0.9,
                        reason: 'Unable to parse intent as JSON'
                    };
                }
            }
            return {
                tool: 'chat',
                document: '',
                confidence: 0.9,
                reason: 'Unable to parse intent as JSON'
            };
        }
    }

    async _findReferencedDocumentFromText(text, hashedMasterKey = null) {
        const rawText = String(text || '').trim();
        const resolvedMasterKey = String(hashedMasterKey || sessionStorage.getItem('hashedMasterKey') || '').trim();
        if (!rawText || !resolvedMasterKey) return null;

        const db = await PaiperworkDB.getDatabase(resolvedMasterKey);
        if (!db) return null;

        const result = db.exec(`SELECT document_id, document_name FROM documents_${resolvedMasterKey} WHERE embedding_status = 'completed'`);
        const rows = result?.[0]?.values || [];
        if (!rows.length) return null;

        const normalize = (value) => this._normalizeDocumentIntentKeymapText(String(value || '').replace(/\.[a-z0-9]{1,6}$/i, ''));
        const compact = (value) => normalize(value).replace(/\s+/g, '');
        const normalizedText = normalize(rawText);
        const compactText = compact(rawText);
        if (!normalizedText) return null;

        let bestMatch = null;
        let bestScore = 0;

        for (const [documentId, encName] of rows) {
            try {
                const name = await PaiperworkDB.decrypt(resolvedMasterKey, JSON.parse(encName));
                const normalizedName = normalize(name);
                const normalizedId = normalize(documentId);
                const compactName = compact(name);
                const compactId = compact(documentId);
                if (!normalizedName && !normalizedId) continue;

                let score = 0;
                if (normalizedName && normalizedText.includes(normalizedName)) score = Math.max(score, 1);
                if (normalizedId && normalizedText.includes(normalizedId)) score = Math.max(score, 0.98);
                if (compactName && compactText.includes(compactName)) score = Math.max(score, 1);
                if (compactId && compactText.includes(compactId)) score = Math.max(score, 0.98);

                const textTokens = new Set(normalizedText.split(/\s+/).filter(Boolean));
                const docTokens = new Set(normalizedName.split(/\s+/).filter(Boolean));
                const overlap = Array.from(docTokens).filter(token => textTokens.has(token)).length;
                if (overlap > 0) {
                    score = Math.max(score, overlap / Math.max(docTokens.size, 1));
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = { id: String(documentId).trim(), name: String(name || '').trim() };
                }
            } catch (decodeErr) {
                console.warn('ConnectorWhatsapp: _findReferencedDocumentFromText decode failed', decodeErr);
            }
        }

        return bestScore >= 0.75 ? bestMatch : null;
    }

    async _orchestrateMessage(msg) {
        try {
            if (!msg || !msg.body) return msg;

            const original = String(msg.body || '');
            const cleaned = this._stripThinkingContent(original);
            const routingIntentText = this._getWhatsappRoutingIntentText(cleaned);
            const shortInput = cleaned.length > 200 ? cleaned.substring(0, 200) + '...' : cleaned;
            console.info('[ConnectorWhatsapp][orchestrator] Sanitized input:', shortInput);

            // Build system prompt for orchestrator
            const systemPrompt = ORCHESTRATOR_SYSTEM_PROMPT;
            const contextSize = (document.getElementById('context-selector') && document.getElementById('context-selector').value) || '8192';

            const normalizedPhone = this._getWhatsappIncomingThreadKey(msg);
            this._appendWhatsappOrchestratorContext(normalizedPhone, { role: 'user', text: cleaned });
            let phoneContext = (await this._getWhatsappPhoneContext(normalizedPhone)) || {};
            phoneContext = (await this._appendWhatsappPhoneConversationTurn(normalizedPhone, { role: 'user', text: cleaned }, phoneContext)) || phoneContext;

            // We currently rely on the orchestrator model only (system prompt guidance) to select tool.
            let orchText = '';
            let routingSession = null;
            try {
                if (typeof OllamaAPI === 'undefined' || !OllamaAPI.OrchestratorCall) {
                    console.warn('[ConnectorWhatsapp][orchestrator] OllamaAPI.OrchestratorCall not available - skipping orchestration');
                } else {
                    this._showWhatsappOrchestratorModal();
                    routingSession = await this._beginWhatsappModelRoutingSession(normalizedPhone, phoneContext);
                    const orchestratorContext = this._normalizeWhatsappOrchestratorTurns(this._getWhatsappOrchestratorContext(normalizedPhone) || []);
                    orchText = await OllamaAPI.OrchestratorCall(cleaned, systemPrompt, contextSize, orchestratorContext, null, `wa_orch_${Date.now()}`, null);
                }
            } catch (e) {
                console.error('[ConnectorWhatsapp][orchestrator] Orchestrator call failed', e);
            } finally {
                this._hideWhatsappOrchestratorModal();
                try {
                    await this._endWhatsappModelRoutingSession(routingSession);
                } catch (sessionErr) {
                    console.warn('[ConnectorWhatsapp][orchestrator] Failed to finalize routing session', sessionErr);
                }
            }

            let decision = { tool: 'chat', confidence: 0, reason: 'orchestrator_unavailable_or_failed' };

            if (orchText && typeof orchText === 'string' && orchText.trim().length > 0) {
                const rawOut = orchText.trim();
                const sanitizedOut = rawOut.replace(/<think[^>]*>[\s\S]*?<\/think>/gi, ' ').trim();
                console.info('[ConnectorWhatsapp][orchestrator] Raw output (sanitized):', sanitizedOut.substring(0, 400));

                if (!rawOut.startsWith('{') && !rawOut.includes('"tool"')) {
                    console.warn('[ConnectorWhatsapp][orchestrator] Orchestrator output appears non-JSON and will be ignored. Verify orchestrator model is used.', { rawOut });
                }

                const parsed = this._parseOrchestratorJSON(sanitizedOut);
                if (parsed && parsed.tool) {
                    const toolRaw = String(parsed.tool || '').toLowerCase();
                    let toolNormalized = 'chat';
                    if (toolRaw.includes('research')) {
                        toolNormalized = 'research';
                    } else if (toolRaw.includes('presentation') || toolRaw.includes('slideforge') || toolRaw.includes('slide deck') || toolRaw.includes('slides') || toolRaw.includes('deck')) {
                        toolNormalized = 'presentation';
                    } else if (toolRaw.includes('dataviz') || toolRaw.includes('visualization') || toolRaw.includes('graph') || toolRaw.includes('chart')) {
                        toolNormalized = 'dataviz';
                    } else if (toolRaw.includes('web') || toolRaw.includes('search')) {
                        toolNormalized = 'chat+websearch';
                    } else if (toolRaw.includes('document') || toolRaw.includes('doc')) {
                        toolNormalized = 'document-check';
                    }
                    // Force document-check for generic document summary intent when we have no file name.
                    // Do not override research tool selection, which can include terms like "report".
                    const isDocumentIntent = (this._isDocumentSelectionIntent(routingIntentText) || this._isSummaryIntent(routingIntentText)) && toolNormalized !== 'research' && toolNormalized !== 'presentation';
                    if (isDocumentIntent && (!parsed.document || String(parsed.document).trim() === '')) {
                        toolNormalized = 'document-check';
                        parsed.document = '';
                        parsed.reason = 'Ambiguous document summary request; use existing ingested documents, do not ask for attachment.';
                    }
                    decision.tool = toolNormalized;

                    // For chat/chat+websearch user conversations, prefer short concise replies (mobile-friendly)
                    if (toolNormalized === 'chat' || toolNormalized === 'chat+websearch') {
                        decision.shortAnswer = true;
                    }
                    // Document hint (optional) - normalise common fields
                    decision.document = parsed.document || parsed.document_name || parsed.doc || parsed.doc_id || parsed.documentId || parsed.document_id || '';
                    decision.confidence = Number(parsed.confidence) || Number(parsed.confidence) === 0 ? Number(parsed.confidence) : (parsed.confidence === 0 ? 0 : (parsed.confidence || 0));
                    decision.reason = parsed.reason || parsed.explanation || '';

                    // If prompt-based orchestrator gave chat but text matches data-viz criteria, upgrade to dataviz
                    if (decision.tool === 'chat' && this._isDataVizIntent(routingIntentText) && !this._isPresentationIntent(routingIntentText)) {
                        decision.tool = 'dataviz';
                        decision.reason = (decision.reason ? decision.reason + ' ' : '') + 'Detected dataviz intent via keymap fallback.';
                    } else if (decision.tool === 'chat' && this._isPresentationIntent(routingIntentText)) {
                        decision.tool = 'presentation';
                        decision.reason = (decision.reason ? decision.reason + ' ' : '') + 'Detected presentation intent via keymap fallback.';
                    }

                    // Apply normalized language from orchestrator if provided, or fallback to local detection.
                    if (parsed.language) {
                        decision.language = this._normalizeLanguage(parsed.language) || parsed.language;
                    }

                    if (parsed.think === false || parsed.think === 'false') {
                        decision.think = false;
                    }
                } else {
                    console.warn('[ConnectorWhatsapp][orchestrator] Could not parse orchestrator JSON, falling back to chat', { rawOut });
                    decision = { tool: 'chat', confidence: 0, reason: 'parse_failure' };
                }
            } else {
                console.info('[ConnectorWhatsapp][orchestrator] Empty orchestrator response, defaulting to chat');
            }

            const modelCommand = this._parseWhatsappModelCommand(routingIntentText || cleaned);
            if (modelCommand) {
                decision.tool = 'chat';
                decision.document = '';
                decision.shortAnswer = true;
                decision.reason = (decision.reason ? `${decision.reason} ` : '') + 'Model-management command handled by frontend chat routing.';
            }

            if (decision.tool === 'chat' || decision.tool === 'chat+websearch') {
                try {
                    const matchedSavedPresentation = this._matchPendingSavedPresentationFollowUp(normalizedPhone, routingIntentText);
                    if (matchedSavedPresentation) {
                        decision.tool = 'presentation';
                        decision.reason = (decision.reason ? `${decision.reason} ` : '') + 'Upgraded via pending saved-presentation follow-up.';
                    }

                    if (!matchedSavedPresentation) {
                        const documentReference = await this._findReferencedDocumentFromText(routingIntentText, sessionStorage.getItem('hashedMasterKey'));
                        const wantsDocumentFlow = !!documentReference && (
                            this._isSummaryIntent(routingIntentText)
                            || this._isQuestionIntent(routingIntentText)
                            || this._hasRunnableDocumentQuestionText(routingIntentText, documentReference.name)
                            || this._isDocumentSelectionIntent(routingIntentText)
                        );

                        if (wantsDocumentFlow) {
                            decision.tool = 'document-check';
                            decision.document = documentReference.name;
                            decision.reason = (decision.reason ? `${decision.reason} ` : '') + 'Upgraded via saved-document title fallback.';
                        }
                    }
                } catch (docFallbackErr) {
                    console.warn('[ConnectorWhatsapp][orchestrator] document title fallback failed', docFallbackErr);
                }
            }

            if (!decision.language) {
                const autoLang = this._detectLanguage(cleaned);
                if (autoLang) decision.language = autoLang;
            }

            // Attach orchestration decision to the message (so downstream can act on it)
            msg.orchestrator = decision;
            return msg;
        } catch (err) {
            console.error('[ConnectorWhatsapp][orchestrator] Error during orchestration', err);
            return msg;
        }
    }

    async handleOrchestratorResearch(msg) {
        try {
            const queryFromOrch = String(msg?.orchestrator?.query || '').trim();
            const query = queryFromOrch || String(msg?.body || '').trim();
            const phone = String(msg?.chat_id || msg?.from || msg?.from_name || msg?.fromJid || '').replace(/@.*$/g, '');
            const language = msg?.user_language || msg?.orchestrator?.language || this._detectLanguage(query) || 'English';

            if (!query) {
                const noTopicText = await this._getLocalizedLangText(
                    language,
                    'researchNoTopic',
                    'Research request received but no topic was detected. Please provide a clear research question.'
                );
                await this.postWhatsappText(phone, `🤖 ${noTopicText}`);
                return false;
            }

            if (typeof window.handleResearchTab === 'function') {
                await window.handleResearchTab();
            } else if (window.app && typeof window.app.handleResearchTab === 'function') {
                await window.app.handleResearchTab();
            } else {
                // Fallback guard: trigger global research tab loader
                if (typeof window !== 'undefined' && window.tabLoader && typeof window.tabLoader.loadTabScripts === 'function') {
                    try {
                        await window.tabLoader.loadTabScripts('research');
                    } catch (e) {
                        console.warn('[ConnectorWhatsapp][research] Failed to load research tab scripts', e);
                    }
                }
                if (typeof window.handleResearchTab === 'function') {
                    await window.handleResearchTab();
                }
            }

            // Set question in research UI and execute research search
            const researchInput = document.getElementById('research-query-input');
            if (researchInput) {
                researchInput.value = query;
            }

            if (window.researchTab && window.researchTab.researchAutomation && typeof window.researchTab.researchAutomation.performResearch === 'function') {
                const startedText = await this._getLocalizedLangText(
                    language,
                    'researchStarted',
                    `Research has started for "${query}". Gathering insights...`,
                    { query }
                );
                await this.postWhatsappText(phone, `🤖 ${startedText}`);
                const report = await window.researchTab.researchAutomation.performResearch();
                const inProgressText = await this._getLocalizedLangText(
                    language,
                    'researchInProgress',
                    'Research in progress: collecting and summarizing results.'
                );
                await this.postWhatsappText(phone, `🤖 ${inProgressText}`);

                const whatsappResearchReport = this._getResearchReportTextForWhatsapp(report);
                const autosaveTitle = query || (window.researchTab && window.researchTab.researchAutomation && window.researchTab.researchAutomation.currentQuery) || 'Research Report';

                if (whatsappResearchReport) {
                    try {
                        await this._autosaveWhatsappResearchToKnowledgeBase(whatsappResearchReport, autosaveTitle);
                    } catch (autosaveErr) {
                        console.warn('[ConnectorWhatsapp][research] Autosave to knowledge base failed', autosaveErr);
                    }

                    await this._sendWhatsappTextChunked(phone, whatsappResearchReport, language);
                    await this._closeWhatsappResearchWindows();
                } else {
                    const completedEmptyText = await this._getLocalizedLangText(
                        language,
                        'researchCompletedEmpty',
                        'Research completed, but report text was empty or unavailable. Please check the Research tab.'
                    );
                    await this.postWhatsappText(phone, `🤖 ${completedEmptyText}`);
                    await this._closeWhatsappResearchWindows();
                }

                return true;
            }

            const moduleNotReadyText = await this._getLocalizedLangText(
                language,
                'researchModuleNotReady',
                'Research flow initiated, but research module is not ready yet. Please try again shortly.'
            );
            await this.postWhatsappText(phone, `🤖 ${moduleNotReadyText}`);
            return false;
        } catch (err) {
            console.error('ConnectorWhatsapp: handleOrchestratorResearch error', err);
            const phone = String(msg?.chat_id || msg?.from || msg?.from_name || msg?.fromJid || '').replace(/@.*$/g, '');
            const language = msg?.user_language || msg?.orchestrator?.language || this._detectLanguage(String(msg?.body || '')) || 'English';
            const failedText = await this._getLocalizedLangText(
                language,
                'researchFailedStart',
                'Failed to start research workflow. Please try again.'
            );
            await this.postWhatsappText(phone, `🤖 ${failedText}`);
            return false;
        }
    }

    async handleOrchestratorDocumentCheck(msg) {
        try {
            const rawBody = String(msg?.body || '').trim();
            const docName = String(msg?.orchestrator?.document || '').trim();
            const phone = String(msg?.chat_id || msg?.from || msg?.from_name || msg?.fromJid || '').replace(/@.*$/g, '');
            const language = msg?.user_language || msg?.orchestrator?.language || this._detectLanguage(rawBody) || 'English';
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');

            if (!hashedMasterKey) {
                const noMasterKeyText = await this._getLocalizedLangText(
                    language,
                    'ragNoMasterKey',
                    'Cannot check documents because the master key is not present.'
                );
                await this.postWhatsappText(phone, noMasterKeyText);
                return { continueToChat: false };
            }

            const db = await PaiperworkDB.getDatabase(hashedMasterKey);
            if (!db) {
                const dbUnavailableText = await this._getLocalizedLangText(
                    language,
                    'ragDbUnavailable',
                    'Document database is unavailable.'
                );
                await this.postWhatsappText(phone, dbUnavailableText);
                return { continueToChat: false };
            }

            await this._ensureDocumentsTabReady();

            const result = db.exec(`SELECT document_id, document_name FROM documents_${hashedMasterKey} WHERE embedding_status = 'completed'`);
            const docs = [];
            if (result && result[0] && Array.isArray(result[0].values)) {
                for (const [documentId, encName] of result[0].values) {
                    try {
                        const name = await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encName));
                        docs.push({ id: documentId, name });
                    } catch (_e) {
                        console.warn('ConnectorWhatsapp: decrypt document name failed', _e);
                    }
                }
            }

            const botPrefix = '🤖 ';
            const pending = this._getPendingDocSelection(phone);
            const userIntentText = (rawBody || '').trim();
            const input = (docName || rawBody || '').trim();

            const explicitQuestionToDocMatch = userIntentText.match(/\b(?:ask|make)\s+(?:a\s+)?question\s+(?:to|about)\s+([\w\-@\.\s]+)$/i);
            const extractedDocumentHint = explicitQuestionToDocMatch ? explicitQuestionToDocMatch[1].trim() : '';

            const shouldListDocs = !userIntentText || /\b(check|list|show|open|review|browse).*\b(documents?|files?|reports?|pdfs?)\b/i.test(userIntentText);
            if (shouldListDocs) {
                this._clearPendingDocSelection(phone);
                if (docs.length === 0) {
                    const noDocumentsText = await this._getLocalizedLangText(
                        language,
                        'ragNoDocumentsFound',
                        'No documents are currently available. Upload one to start document checking.'
                    );
                    await this.postWhatsappText(phone, botPrefix + noDocumentsText);
                    return { continueToChat: false };
                }

                const names = docs.slice(0, 10).map((d, i) => `${i + 1}. ${d.name}`).join('\n');
                const choosePrompt = await this._getLocalizedLangText(
                    language,
                    'ragChooseDocumentPrompt',
                    'I found these documents:'
                );
                const placeholderTip = await this._getLocalizedLangText(
                    language,
                    'ragChooseDocumentTip',
                    'Reply with the document name or number from the list to start document questioning.'
                );
                const actionHint = await this._getLocalizedLangText(
                    language,
                    'ragChooseDocumentActionTip',
                    'After choosing, reply with "summary" to generate a summary, or ask a question for document query mode.'
                );
                await this.postWhatsappText(phone, `${botPrefix}${choosePrompt}\n${names}\n${placeholderTip}\n${actionHint}`);
                return { continueToChat: false };
            }

            // If we have a pending selection, handle summary/question action intents.
            if (pending) {
                const isSummaryPresentationWorkflow = this._isSummaryToPresentationWorkflowIntent(userIntentText);
                const isSummaryRequest = this._isSummaryIntent(userIntentText);
                const isQuestionRequest = this._isQuestionIntent(userIntentText);
                const hasRunnableQuestionText = this._hasRunnableDocumentQuestionText(userIntentText, pending.name);
                if (isSummaryRequest) {
                    if (isSummaryPresentationWorkflow) {
                        await this._handleWhatsappMatchedDocumentSummaryToPresentationWorkflow(phone, phone, pending, language);
                        return { continueToChat: false };
                    }
                    await this._executeDocumentSummary(phone, pending, hashedMasterKey, language);
                    return { continueToChat: false };
                }

                if (isQuestionRequest || hasRunnableQuestionText) {
                    const wasAlreadyActive = this._isWhatsappDocumentScopeActive(phone);
                    const success = await this._activateWhatsappDocumentScope(phone, pending);
                    console.info('[ConnectorWhatsapp][debug] pending doc question activation result', {
                        phone,
                        pendingDocumentId: pending.id,
                        pendingDocumentName: pending.name,
                        wasAlreadyActive,
                        success,
                        hasRunnableQuestionText
                    });
                    if (success) {
                        if (!wasAlreadyActive) {
                            const modeActivatedText = await this._getLocalizedLangText(
                                language,
                                'ragDocumentModeActivated',
                                'Document questioning mode activated for'
                            );
                            await this.postWhatsappText(phone, `${botPrefix}${modeActivatedText}: ${pending.name}`);
                        }
                        if (hasRunnableQuestionText) {
                            return { continueToChat: true };
                        }
                        return { continueToChat: false };
                    }
                    const modeFailedText = await this._getLocalizedLangText(
                        language,
                        'ragDocumentModeFailed',
                        'Failed to activate document questioning mode for'
                    );
                    await this.postWhatsappText(phone, `${botPrefix}${modeFailedText}: ${pending.name}`);
                    return { continueToChat: false };
                }
            
                // fallback to existing logic when not pure summary/question intent
                const customQuestionTrigger = isQuestionRequest;
                const isPureAction = /^\s*(summary|summarize|ask questions?|question(?:ing)?|help me ask)\s*$/i.test(input);
                const isFullQuestion = /\?|^(who|what|where|when|why|how|explain|describe|tell me)/i.test(input);

                if (customQuestionTrigger) {
                    const wasAlreadyActive = this._isWhatsappDocumentScopeActive(phone);
                    const success = await this._activateWhatsappDocumentScope(phone, pending);
                    if (success) {
                        if (!wasAlreadyActive) {
                            const modeActivatedText = await this._getLocalizedLangText(
                                language,
                                'ragDocumentModeActivated',
                                'Document questioning mode activated for'
                            );
                            await this.postWhatsappText(phone, `${botPrefix}${modeActivatedText}: ${pending.name}`);
                        }
                        // Keep pending for possible further actions until user leaves mode.
                        if (isFullQuestion && !isPureAction) {
                            return { continueToChat: true };
                        }
                        return { continueToChat: false };
                    }
                    const modeFailedText = await this._getLocalizedLangText(
                        language,
                        'ragDocumentModeFailed',
                        'Failed to activate document questioning mode for'
                    );
                    await this.postWhatsappText(phone, `${botPrefix}${modeFailedText}: ${pending.name}`);
                    return { continueToChat: false };
                }
            }

            // Try to resolve document selection by index or fuzzy title match.
            const normalize = (text) => String(text || '').toLowerCase().replace(/[^a-z0-9\u00C0-\u017F]+/gi, ' ').trim();
            const compact = (text) => normalize(text).replace(/\s+/g, '');
            const normalizedInput = normalize(input);
            const compactInput = compact(input);

            let match = null;
            const numericChoice = Number(input);
            if (!Number.isNaN(numericChoice) && Number.isFinite(numericChoice) && numericChoice >= 1 && numericChoice <= docs.length) {
                match = docs[numericChoice - 1];
            }

            // If user asks 'summarize <doc>' or similar, strip the action verb prefix/suffix and match the topic.
            let docHint = normalizedInput;
            const intentPattern = /^(summary|summarize|résumer|resumen|resumo|摘要|概述|总结|ask\s+questions?|question(?:ing)?|ask\s+about|about|explain|describe)\s*|\s*(summary|summarize|résumer|resumen|resumo|摘要|概述|总结|ask\s+questions?|question(?:ing)?|ask\s+about|about|explain|describe)$/gi;
            const stripped = normalizedInput.replace(intentPattern, '').trim();
            if (stripped && stripped.length < normalizedInput.length) {
                docHint = normalize(stripped);
            }

            if (!match) {
                match = docs.find(d => {
                    const normalizedName = normalize(d.name);
                    const normalizedId = normalize(d.id);
                    const compactName = compact(d.name);
                    const compactId = compact(d.id);
                    return normalizedName === normalizedInput
                        || normalizedId === normalizedInput
                        || (compactInput && (compactName === compactInput || compactId === compactInput));
                });
            }

            if (!match && normalizedInput && !/^(summary|summarize|résumer|resumen|resumo|摘要|概述|总结)$/.test(normalizedInput)) {
                match = docs.find(d => {
                    const normalizedName = normalize(d.name);
                    const normalizedId = normalize(d.id);
                    const compactName = compact(d.name);
                    const compactId = compact(d.id);
                    return normalizedName.includes(normalizedInput)
                        || normalizedId.includes(normalizedInput)
                        || (compactInput && (compactName.includes(compactInput) || compactId.includes(compactInput)));
                });
            }

            if (!match && docHint && docHint !== normalizedInput) {
                const compactDocHint = docHint.replace(/\s+/g, '');
                match = docs.find(d => {
                    const normalizedName = normalize(d.name);
                    const normalizedId = normalize(d.id);
                    const compactName = compact(d.name);
                    const compactId = compact(d.id);
                    return normalizedName.includes(docHint)
                        || normalizedId.includes(docHint)
                        || (compactDocHint && (compactName.includes(compactDocHint) || compactId.includes(compactDocHint)));
                });
            }

            if (!match && (normalizedInput || docHint)) {
                const inputTokens = new Set((docHint || normalizedInput).split(/\s+/).filter(Boolean));
                let bestScore = 0;
                for (const d of docs) {
                    const docTokens = new Set(normalize(d.name).split(/\s+/).filter(Boolean));
                    const overlap = Array.from(inputTokens).filter(t => docTokens.has(t)).length;
                    const score = overlap / Math.max(inputTokens.size, docTokens.size, 1);
                    if (score > bestScore) {
                        bestScore = score;
                        match = d;
                    }
                }
                if (bestScore < 0.35) {
                    match = null;
                }
            }

            // If orchestrator suggested a document and we still have no exact match,
            // try relaxed matching against normalized ids and names (strip extensions).
            if (!match && docName) {
                const docNameNoExt = normalize(String(docName).replace(/\.[a-z0-9]{1,6}$/i, ''));
                const compactDocNameNoExt = docNameNoExt.replace(/\s+/g, '');
                console.info('[ConnectorWhatsapp][debug] trying docName fallback match', { docName, docNameNoExt, compactDocNameNoExt, docsCount: docs.length });
                match = docs.find(d => {
                    const n = normalize(d.name);
                    const idn = normalize(d.id);
                    const compactName = compact(d.name);
                    const compactId = compact(d.id);
                    return n === docNameNoExt
                        || idn === docNameNoExt
                        || n.includes(docNameNoExt)
                        || idn.includes(docNameNoExt)
                        || (compactDocNameNoExt && (
                            compactName === compactDocNameNoExt
                            || compactId === compactDocNameNoExt
                            || compactName.includes(compactDocNameNoExt)
                            || compactId.includes(compactDocNameNoExt)
                        ));
                });
                if (match) console.info('[ConnectorWhatsapp][debug] docName fallback found match', { match });
            }

            if (!match) {
                if (docs.length > 0) {
                    const names = docs.slice(0, 10).map((d, i) => `${i + 1}. ${d.name}`).join('\n');
                    const warmPrompt = await this._getLocalizedLangText(
                        language,
                        'ragChooseDocumentWarmPrompt',
                        'Choose from the existing documents:'
                    );
                    const nextActionTip = await this._getLocalizedLangText(
                        language,
                        'ragChooseDocumentActionTip',
                        'Please clarify your question by using one of these document names; do not send new attachments.'
                    );
                    await this.postWhatsappText(phone, `${botPrefix}${warmPrompt}\n${names}\n${nextActionTip}`);
                } else {
                    const noDocumentsText = await this._getLocalizedLangText(
                        language,
                        'ragNoDocumentsFound',
                        'No documents are currently available in the app. Please clarify your question; do not send attachments.'
                    );
                    await this.postWhatsappText(phone, botPrefix + noDocumentsText);
                }
                return { continueToChat: false };
            }

            // If user explicitly asked for summary of the matched document, generate immediately.
            if (this._isSummaryIntent(input)) {
                if (this._isSummaryToPresentationWorkflowIntent(input)) {
                    await this._handleWhatsappMatchedDocumentSummaryToPresentationWorkflow(phone, phone, match, language);
                    return { continueToChat: false };
                }
                await this._executeDocumentSummary(phone, match, hashedMasterKey, language);
                return { continueToChat: false };
            }

            // If user explicitly asked for summary of the matched document, generate immediately.
            console.info('[ConnectorWhatsapp][debug] selected doc for document-check', {
                phone,
                pendingSelection: { id: match.id, name: match.name },
                userIntentText,
                isSummaryRequest: this._isSummaryIntent(userIntentText),
                isQuestionRequest: this._isQuestionIntent(userIntentText)
            });

            const isSummaryRequest = this._isSummaryIntent(userIntentText);
            const isSummaryPresentationWorkflow = this._isSummaryToPresentationWorkflowIntent(userIntentText);
            const isQuestionRequest = this._isQuestionIntent(userIntentText);
            const hasRunnableQuestionText = this._hasRunnableDocumentQuestionText(userIntentText, match.name);
            if (isSummaryRequest) {
                if (isSummaryPresentationWorkflow) {
                    await this._handleWhatsappMatchedDocumentSummaryToPresentationWorkflow(phone, phone, match, language);
                    return { continueToChat: false };
                }
                await this._executeDocumentSummary(phone, match, hashedMasterKey, language);
                return { continueToChat: false };
            }

            if (isQuestionRequest || hasRunnableQuestionText) {
                const wasAlreadyActive = this._isWhatsappDocumentScopeActive(phone);
                const success = await this._activateWhatsappDocumentScope(phone, match);
                console.info('[ConnectorWhatsapp][debug] matched doc question activation result', {
                    phone,
                    matchedDocumentId: match.id,
                    matchedDocumentName: match.name,
                    wasAlreadyActive,
                    success,
                    hasRunnableQuestionText
                });
                if (success) {
                    if (!wasAlreadyActive) {
                        const modeActivatedText = await this._getLocalizedLangText(
                            language,
                            'ragDocumentModeActivated',
                            'Document questioning mode activated for'
                        );
                        await this.postWhatsappText(phone, `${botPrefix}${modeActivatedText}: ${match.name}`);
                    }
                    this._setPendingDocSelection(phone, { id: match.id, name: match.name });
                    if (hasRunnableQuestionText) {
                        return { continueToChat: true };
                    }
                    return { continueToChat: false };
                }
                const modeFailedText = await this._getLocalizedLangText(
                    language,
                    'ragDocumentModeFailed',
                    'Failed to activate document questioning mode for'
                );
                await this.postWhatsappText(phone, `${botPrefix}${modeFailedText}: ${match.name}`);
                return { continueToChat: false };
            }

            // Selected a document; ask whether to summary or ask questions.
            this._setPendingDocSelection(phone, { id: match.id, name: match.name });
            const documentSelectedText = await this._getLocalizedLangText(
                language,
                'ragDocumentSelected',
                '📄 Document selected'
            );
            const nextActionTip = await this._getLocalizedLangText(
                language,
                'ragDocumentActionTip',
                'Reply with "summary" to summarize the document, or ask a question to enter document-questioning mode.'
            );
            await this.postWhatsappText(phone, `${botPrefix}${documentSelectedText}: ${match.name}\n${nextActionTip}`);
            return { continueToChat: false };
        } catch (err) {
            console.error('ConnectorWhatsapp: handleOrchestratorDocumentCheck error', err);
            const phone = String(msg?.chat_id || msg?.from || msg?.from_name || msg?.fromJid || '').replace(/@.*$/g, '');
            const language = msg?.user_language || msg?.orchestrator?.language || this._detectLanguage(String(msg?.body || '')) || 'English';
            const errorText = await this._getLocalizedLangText(
                language,
                'ragDocumentCheckError',
                'Failed to handle document-check request.'
            );
            await this.postWhatsappText(phone, errorText);
            return { continueToChat: false };
        }
    }

    // Queue an incoming message for later retry processing
    async enqueueWhatsappIncomingMessage(msg) {
        try {
            if (!msg || !msg.body) return;
            if (this.whatsappIncomingRetryQueue.length >= 20) {
                this.whatsappIncomingRetryQueue.shift();
            }
            this.whatsappIncomingRetryQueue.push(msg);
        } catch (e) {
            console.warn('ConnectorWhatsapp: enqueueWhatsappIncomingMessage failed', e);
        }
    }

    // Drain any queued incoming messages when the app is idle
    async drainWhatsappIncomingQueue() {
        try {
            while (this.whatsappIncomingRetryQueue.length > 0 && !window.isGenerating && !(window.chat && window.chat.isGenerating)) {
                const nextMsg = this.whatsappIncomingRetryQueue.shift();
                if (window.chat && typeof window.chat.processWhatsappIncomingMessage === 'function') {
                    await window.chat.processWhatsappIncomingMessage(nextMsg);
                }
            }
        } catch (e) {
            console.warn('ConnectorWhatsapp: drainWhatsappIncomingQueue failed', e);
        }
    }

    // Lightweight incoming WhatsApp processing glue moved from Chat. 
    // This sets the pending reply chat id, triggers the chat send/generation,
    // waits for completion, then asks the connectors to send the rendered assistant reply back.
    async processWhatsappIncomingMessage(msg) {
        if (!msg) return;

        // If the UI is currently generating a response, queue this message for later.
        const isBusy = window.isGenerating || (window.chat && window.chat.isGenerating);
        if (isBusy) {
            console.info('[ConnectorWhatsapp] processWhatsappIncomingMessage: currently busy, enqueueing message');
            await this.enqueueWhatsappIncomingMessage(msg);
            return;
        }

        let shouldResetWebSearchMode = false;

        try {
            const normalizedPhone = this._getWhatsappIncomingThreadKey(msg);
            const replyTarget = this._getWhatsappIncomingReplyTarget(msg) || normalizedPhone;

            if (this._isWhatsappBotMode() && typeof this.postWhatsappPresence === 'function') {
                await this._ensureWhatsappPresenceStartedIfNeeded(replyTarget);
            }

            let orchTool = msg && msg.orchestrator && msg.orchestrator.tool ? String(msg.orchestrator.tool).toLowerCase() : null;
            let pendingDoc = this._getPendingDocSelection(normalizedPhone);
            let docModeActive = this._isWhatsappDocumentScopeActive(normalizedPhone);

            const userText = String(msg?.body || '').trim();
            const routingIntentText = this._getWhatsappRoutingIntentText(userText);
            let phoneContext = (await this._getWhatsappPhoneContext(normalizedPhone)) || {};
            const inferredLanguage = this._detectLanguage(routingIntentText || userText);

            if (this._isWhatsappBotMode()) {
                phoneContext = (await this._ensureWhatsappBotConversationThread(msg, normalizedPhone, phoneContext)) || phoneContext;
            }

            if (window.RAG_Utils && typeof window.RAG_Utils.resolveDocumentQuestioningAction === 'function') {
                try {
                    const docModeAction = await window.RAG_Utils.resolveDocumentQuestioningAction(routingIntentText || userText, {
                        scopeKey: this._getWhatsappDocumentScopeKey(normalizedPhone),
                        hashedMasterKey: sessionStorage.getItem('hashedMasterKey'),
                        orchestratorTool: orchTool
                    });
                    if (docModeAction && docModeAction.action === 'exit') {
                        this._exitWhatsappDocumentScope(normalizedPhone);
                        this._clearPendingDocSelection(normalizedPhone);
                        pendingDoc = null;
                        docModeActive = false;
                    } else if (docModeAction && (docModeAction.action === 'enter' || docModeAction.action === 'switch') && docModeAction.match && docModeAction.match.documentId) {
                        orchTool = 'document-check';
                    }
                } catch (docModeErr) {
                    console.warn('ConnectorWhatsapp: resolveDocumentQuestioningAction failed', docModeErr);
                }
            }

            // If orchestrator is missing or defaulted to chat, but text clearly asks for chart creation,
            // force dataviz routing.
            if ((!orchTool || orchTool === 'chat') && this._isDataVizIntent(routingIntentText) && !this._isPresentationIntent(routingIntentText)) {
                orchTool = 'dataviz';
            }

            if ((!orchTool || orchTool === 'chat') && this._isPresentationIntent(routingIntentText)) {
                orchTool = 'presentation';
            }

            let orchestratorLanguage = null;
            if (msg && msg.orchestrator && msg.orchestrator.language) {
                orchestratorLanguage = this._normalizeLanguage(msg.orchestrator.language);
            }

            if (orchestratorLanguage && orchestratorLanguage !== phoneContext.language) {
                phoneContext.language = orchestratorLanguage;
                await this._setWhatsappPhoneContext(normalizedPhone, phoneContext);
            }

            if (!orchestratorLanguage && inferredLanguage && inferredLanguage !== phoneContext.language) {
                phoneContext.language = inferredLanguage;
                await this._setWhatsappPhoneContext(normalizedPhone, phoneContext);
            }

            const resolvedLanguage = orchestratorLanguage || phoneContext.language || inferredLanguage || 'English';
            msg.user_language = resolvedLanguage;
            // Avoid mutating potentially frozen orchestrator objects
            const baseOrch = msg.orchestrator || {};
            msg.orchestrator = Object.assign({}, baseOrch, {
                language: orchestratorLanguage || resolvedLanguage,
                tool: orchTool || (baseOrch.tool || 'chat')
            });
            window.whatsappIncomingLanguage = orchestratorLanguage || resolvedLanguage;
            window.whatsappIncomingLanguageSample = userText;
            window.lastOrchestratorDecision = msg.orchestrator;

            const modelCommandHandled = await this._handleWhatsappModelCommand(
                normalizedPhone,
                replyTarget,
                userText,
                resolvedLanguage,
                phoneContext
            );
            if (modelCommandHandled) {
                return;
            }

            if (this._isSummaryToPresentationWorkflowIntent(routingIntentText || userText)) {
                if (window.chatInstance) {
                    window.chatInstance.whatsappPendingReplyChatId = replyTarget;
                    window.chatInstance.whatsappPendingReplyIdentityKey = normalizedPhone;
                }

                const workflowHandled = await this._handleWhatsappSummaryToPresentationWorkflow(
                    normalizedPhone,
                    replyTarget,
                    userText,
                    resolvedLanguage
                );
                if (workflowHandled) {
                    return;
                }
            }

            const shouldForceResearchWorkflow = this._isResearchIntent(routingIntentText) && (orchTool === 'research' || orchTool === 'chat+websearch' || !orchTool);
            if (shouldForceResearchWorkflow) {
                orchTool = 'research';
                msg.orchestrator = Object.assign({}, msg.orchestrator, { tool: 'research' });
                window.lastOrchestratorDecision = msg.orchestrator;
            }
            let chartType = this._extractDataVizType(routingIntentText);

            // Orchestrator-driven web search / dataviz switch
            try {
                if (orchTool === 'chat+websearch') {
                    await this._ensureWhatsappWebSearchMode(true);
                    shouldResetWebSearchMode = true;
                } else {
                    // For chat, document-check, research, dataviz, presentation we keep websearch off.
                    await this._ensureWhatsappWebSearchMode(false);
                }
            } catch (err) {
                console.warn('ConnectorWhatsapp: _ensureWhatsappWebSearchMode failed', err);
            }

            if (orchTool === 'dataviz' && !chartType) {
                // Re-check with expanded multi-language detection if orchestrator says dataviz
                chartType = this._extractDataVizType(routingIntentText);
            }

            if (orchTool === 'dataviz' && chartType) {
                if (window.chatInstance) {
                    window.chatInstance.whatsappPendingReplyChatId = replyTarget;
                    window.chatInstance.whatsappPendingReplyIdentityKey = normalizedPhone;
                }
                await this._handleWhatsappDataViz(normalizedPhone, chartType, userText, resolvedLanguage);
                return;
            }

            if (orchTool === 'presentation') {
                if (window.chatInstance) {
                    window.chatInstance.whatsappPendingReplyChatId = replyTarget;
                    window.chatInstance.whatsappPendingReplyIdentityKey = normalizedPhone;
                }
                await this._handleWhatsappPromptablePresentation(normalizedPhone, userText, resolvedLanguage);
                return;
            }

            const isDocumentIntent = this._isDocumentSelectionIntent(routingIntentText) || this._isSummaryIntent(routingIntentText);
            const asksToSpecificDoc = /ask\s+(?:a\s+)?question\s+to\s+([\w\-@\.\s]+)/i.test(routingIntentText);

            // preserve backwards compatibility for plain question routing to chat/chat+websearch;
            // do not treat general questions as documents unless explicit document reference exists.
            const isGenericQuestion = this._isQuestionIntent(routingIntentText) && !this._isDocumentSelectionIntent(routingIntentText) && !this._isSummaryIntent(routingIntentText);

            if (shouldForceResearchWorkflow) {
                try {
                    if (window.chatInstance) {
                        window.chatInstance.whatsappPendingReplyChatId = replyTarget;
                        window.chatInstance.whatsappPendingReplyIdentityKey = normalizedPhone;
                    }
                    const reached = await this.handleOrchestratorResearch(msg);
                    if (reached) return;
                } catch (e) {
                    console.error('ConnectorWhatsapp: handleOrchestratorResearch failed', e);
                }
            }

            const shouldForceDocCheck = orchTool === 'document-check' || !!pendingDoc || docModeActive || isDocumentIntent || asksToSpecificDoc;
            if (shouldForceDocCheck) {
                let continueToChat = false;
                try {
                    if (window.chatInstance && typeof window.chatInstance._handleOrchestratorDocumentCheck === 'function') {
                        window.chatInstance.whatsappPendingReplyChatId = replyTarget;
                        window.chatInstance.whatsappPendingReplyIdentityKey = normalizedPhone;
                        const result = await window.chatInstance._handleOrchestratorDocumentCheck(msg);
                        continueToChat = result && result.continueToChat;
                    }
                } catch (e) { console.error('ConnectorWhatsapp: _handleOrchestratorDocumentCheck failed', e); }
                if (!continueToChat) return;
            }

            // Mark pending reply target on chat instance for downstream flows
            try {
                if (window.chatInstance) {
                    window.chatInstance.whatsappPendingReplyChatId = replyTarget;
                    window.chatInstance.whatsappPendingReplyIdentityKey = normalizedPhone;
                    window.chatInstance.documentConversationScopeKey = this._getWhatsappDocumentScopeKey(normalizedPhone);
                    console.info('[ConnectorWhatsapp][debug] assigned chat document scope', {
                        phone: normalizedPhone,
                        replyTarget,
                        documentConversationScopeKey: window.chatInstance.documentConversationScopeKey,
                        orchTool,
                        pendingDoc,
                        docModeActive
                    });
                }
            } catch (_) {}

            // Inject incoming text into prompt input
            try {
                const promptInput = document.getElementById('prompt-input');
                if (promptInput) promptInput.value = String(msg.body || '').trim();
            } catch (e) {}

            // Start the standard send flow via Chat
            let sendPromise = null;
            let routingSession = null;
            try {
                routingSession = await this._beginWhatsappModelRoutingSession(normalizedPhone, phoneContext);
                if (window.chatInstance && typeof window.chatInstance.handleSendButtonClick === 'function') {
                    sendPromise = window.chatInstance.handleSendButtonClick();
                }
            } catch (e) {
                console.error('ConnectorWhatsapp: failed to start send pipeline for incoming WA message', e);
            }

            // Post presence/thinking to the phone (best-effort)
            try {
                if (window.chatInstance && window.chatInstance.whatsappPendingReplyChatId && typeof this.postWhatsappPresence === 'function') {
                    await this._startWhatsappPresenceKeepAlive(window.chatInstance.whatsappPendingReplyChatId);

                    const shouldSendThinking = !(msg?.orchestrator && msg.orchestrator.think === false);
                    if (shouldSendThinking && typeof this.postWhatsappText === 'function') {
                        const language = msg?.user_language || resolvedLanguage || 'English';
                        const thinkingText = this._localizedThinkingText(language);
                        await this.postWhatsappText(window.chatInstance.whatsappPendingReplyChatId, thinkingText);
                    }
                }
            } catch (e) {
                console.warn('ConnectorWhatsapp: failed to post presence/thinking for incoming WA message', e);
            }

            // Await send pipeline promise if it returned one
            try { if (sendPromise && typeof sendPromise.then === 'function') await sendPromise; } catch (_) {}

            // Wait for generation to finish (poll with timeout)
            try {
                const pollMs = 200;
                const maxMs = 120000;
                let waited = 0;
                while ((window.isGenerating || (window.chatInstance && window.chatInstance.isGenerating)) && waited < maxMs) {
                    // small sleep
                    // eslint-disable-next-line no-await-in-loop
                    await new Promise(r => setTimeout(r, pollMs));
                    waited += pollMs;
                }
            } catch (_) {}

            // Ask connectors to send the assistant reply back to the phone
            try {
                if (typeof this.maybeSendWhatsappReply === 'function') {
                    await this.maybeSendWhatsappReply(replyTarget);
                }

            } catch (e) {
                console.error('ConnectorWhatsapp: maybeSendWhatsappReply failed', e);
            }

            // Drain any queued incoming messages
            try {
                await this.drainWhatsappIncomingQueue();
            } catch (e) {
                console.warn('ConnectorWhatsapp: drainWhatsappIncomingQueue failed', e);
            }

        } catch (err) {
            console.error('ConnectorWhatsapp: processWhatsappIncomingMessage error', err);
        } finally {
            try { await this._endWhatsappModelRoutingSession(routingSession); } catch (_) {}
            try {
                if (shouldResetWebSearchMode) {
                    await this._ensureWhatsappWebSearchMode(false);
                }
            } catch (_) {}
            try { await this._postWhatsappPresenceStopIfNeeded(); } catch (_) {}
            try {
                if (window.chatInstance) {
                    window.chatInstance.whatsappPendingReplyChatId = null;
                    window.chatInstance.whatsappPendingReplyIdentityKey = null;
                    window.chatInstance.documentConversationScopeKey = 'ui';
                }
            } catch(_) {}
        }
    }

    _clearWhatsappPresenceKeepAliveTimer() {
        if (this._whatsappPresenceKeepAliveTimer) {
            clearInterval(this._whatsappPresenceKeepAliveTimer);
            this._whatsappPresenceKeepAliveTimer = null;
        }
    }

    async _startWhatsappPresenceKeepAlive(chatId) {
        const target = this._getResolvedWhatsappOutgoingTarget(
            chatId || this._whatsappPresenceChatId || window.chat?.whatsappPendingReplyChatId || window.chatInstance?.whatsappPendingReplyChatId || ''
        );
        if (!target || typeof this.postWhatsappPresence !== 'function') return;

        if (this._whatsappPresenceKeepAliveTimer && this._whatsappPresenceChatId === target) {
            await this._ensureWhatsappPresenceStartedIfNeeded(target);
            return;
        }

        this._clearWhatsappPresenceKeepAliveTimer();
        await this._ensureWhatsappPresenceStartedIfNeeded(target);

        this._whatsappPresenceKeepAliveTimer = setInterval(() => {
            if (!this._whatsappPresenceStarted || this._whatsappPresenceChatId !== target || typeof this.postWhatsappPresence !== 'function') {
                return;
            }
            this.postWhatsappPresence(target, 'start').catch(err => {
                console.warn('ConnectorWhatsapp: WhatsApp presence keepalive failed', err);
            });
        }, this._whatsappPresenceKeepAliveIntervalMs);
    }

    // Ensure presence 'start' is posted once for the given chatId (or current chat if omitted)
    async _ensureWhatsappPresenceStartedIfNeeded(chatId) {
        try {
            const target = this._getResolvedWhatsappOutgoingTarget(
                chatId || this._whatsappPresenceChatId || window.chat?.whatsappPendingReplyChatId || window.chatInstance?.whatsappPendingReplyChatId || ''
            );
            if (!target) return;
            if (this._whatsappPresenceStarted && this._whatsappPresenceChatId === target) return;
            if (this._whatsappPresenceStarted && this._whatsappPresenceChatId && this._whatsappPresenceChatId !== target) {
                await this._postWhatsappPresenceStopIfNeeded(this._whatsappPresenceChatId);
            }
            if (typeof this.postWhatsappPresence === 'function') {
                await this.postWhatsappPresence(target, 'start');
                this._whatsappPresenceStarted = true;
                this._whatsappPresenceChatId = target;
            }
        } catch (err) {
            console.warn('ConnectorWhatsapp: _ensureWhatsappPresenceStartedIfNeeded failed', err);
        }
    }

    // Post presence 'stop' for the given chatId (or current chat if omitted)
    async _postWhatsappPresenceStopIfNeeded(chatId) {
        try {
            this._clearWhatsappPresenceKeepAliveTimer();
            const target = this._getResolvedWhatsappOutgoingTarget(
                chatId || this._whatsappPresenceChatId || window.chat?.whatsappPendingReplyChatId || window.chatInstance?.whatsappPendingReplyChatId || ''
            );
            if (!target) return;
            if (typeof this.postWhatsappPresence === 'function') {
                await this.postWhatsappPresence(target, 'stop');
            }
        } catch (err) {
            console.warn('ConnectorWhatsapp: _postWhatsappPresenceStopIfNeeded failed', err);
        }
        try {
            this._whatsappPresenceStarted = false;
            this._whatsappPresenceChatId = '';
        } catch (_) {}
    }

    _normalizeWhatsappLinkUrl(href) {
        const raw = String(href || '').trim();
        if (!raw) return '';
        if (/^www\./i.test(raw)) return `https://${raw}`;
        if (/^https?:\/\//i.test(raw)) return raw;
        return '';
    }

    _appendWhatsappTextPiece(base, piece) {
        const current = String(base || '');
        const nextPiece = String(piece || '');
        if (!nextPiece) return current;
        if (!current) return nextPiece;
        if (/\n$/.test(current) || /^\n/.test(nextPiece)) return current + nextPiece;
        if (/\s$/.test(current) || /^\s/.test(nextPiece)) return current + nextPiece;
        return `${current} ${nextPiece}`;
    }

    _getWhatsappListItemPrefix(element) {
        if (!element || !element.parentElement) return '- ';
        const parentTag = String(element.parentElement.tagName || '').toLowerCase();
        if (parentTag !== 'ol') return '- ';

        const items = Array.from(element.parentElement.children || []).filter(child => String(child.tagName || '').toLowerCase() === 'li');
        const index = items.indexOf(element);
        return `${index >= 0 ? index + 1 : 1}. `;
    }

    _extractWhatsappTextFromNode(node) {
        if (!node) return '';

        if (node.nodeType === Node.TEXT_NODE) {
            return String(node.textContent || '').replace(/\s+/g, ' ');
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        const element = node;
        const tagName = String(element.tagName || '').toLowerCase();

        if (element.classList && element.classList.contains('code-block')) {
            return '';
        }

        if (tagName === 'br') {
            return '\n';
        }

        if (tagName === 'a') {
            const href = this._normalizeWhatsappLinkUrl(element.getAttribute('href') || element.href || '');
            if (href) return href;
        }

        let content = '';
        const childNodes = Array.from(element.childNodes || []);
        for (const child of childNodes) {
            content = this._appendWhatsappTextPiece(content, this._extractWhatsappTextFromNode(child));
        }

        content = content.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n');

        if (tagName === 'li') {
            const line = content.trim();
            const prefix = this._getWhatsappListItemPrefix(element);
            return line ? `${prefix}${line}\n` : '';
        }

        if (tagName === 'td' || tagName === 'th') {
            const cell = content.trim();
            return cell ? `${cell} | ` : '';
        }

        if (tagName === 'tr') {
            const row = content.replace(/\s*\|\s*$/g, '').trim();
            return row ? `${row}\n` : '';
        }

        if (/^h[1-6]$/i.test(tagName)) {
            const heading = content.trim();
            return heading ? `*${heading}*\n\n` : '';
        }

        if (/^(p|div|section|article|header|footer|aside|blockquote|figcaption|h1|h2|h3|h4|h5|h6|pre|ul|ol|table|thead|tbody|tr)$/i.test(tagName)) {
            const block = content.trim();
            return block ? `${block}\n\n` : '';
        }

        return content;
    }

    _normalizeWhatsappReplyText(text) {
        let content = String(text || '').replace(/\u00a0/g, ' ').replace(/[\t\r]+/g, '');
        if (!content.trim()) return '';

        content = content.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, '$2');
        content = content.replace(/__HELP_ANCHOR_\d+__/g, '');
        content = content.replace(/\*([^*\n]+)\*\s*\n(?!\n)/g, '*$1*\n\n');
        content = content.replace(/\n\s*([.,;:!?])/g, '$1');
        content = content.replace(/([\-*•]\s+[^\n]+)\n(?!\n|[\-*•]\s|\d+\.\s|https?:\/\/)/g, '$1 ');
        content = content.replace(/(\d+\.\s+[^\n]+)\n(?!\n|[\-*•]\s|\d+\.\s|https?:\/\/)/g, '$1 ');
        content = content.replace(/\n{3,}/g, '\n\n');

        const rawLines = content.split('\n');
        const normalizedLines = [];

        for (const rawLine of rawLines) {
            const line = rawLine.trim();
            if (!line) {
                if (normalizedLines.length > 0 && normalizedLines[normalizedLines.length - 1] !== '') {
                    normalizedLines.push('');
                }
                continue;
            }

            const isStructuredLine = /^([\-*•]\s+|\d+\.\s+|https?:\/\/|\*[^*]+\*|[^|]+\s\|\s[^|]+)/i.test(line);
            if (normalizedLines.length === 0 || normalizedLines[normalizedLines.length - 1] === '' || isStructuredLine) {
                normalizedLines.push(line.replace(/^#{1,6}\s+/, ''));
                continue;
            }

            normalizedLines[normalizedLines.length - 1] = `${normalizedLines[normalizedLines.length - 1]} ${line}`;
        }

        return normalizedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    }

    // Send the assistant's most recent response to the given phone (multi-part: text/code/attachments)
    async maybeSendWhatsappReply(chatId) {
        try {
            const targetPhone = chatId || (window.chat && window.chat.whatsappPendingReplyChatId) || null;
            if (!targetPhone) return;
            const language = this._getActiveWhatsappReplyLanguage();

            const aiReplies = document.querySelector('.ai-replies');
            if (!aiReplies) return;

            const assistantMessages = aiReplies.querySelectorAll('.assistant-message');
            if (assistantMessages.length === 0) return;

            const lastMessage = assistantMessages[assistantMessages.length - 1];
            const responseContainer = lastMessage.querySelector('.ai-response-container') || lastMessage;
            if (!responseContainer) return;

            const clone = responseContainer.cloneNode(true);

            // Remove nods to thinking and UI controls.
            clone.querySelectorAll('.thinking-mode-container, .thinking-summary, .thinking-transition, [data-thinking], [class*="thinking-"], .message-actions, .copy-response-container, .copy-button, .regenerate-button, .delete-button').forEach(el => el.remove());

            const _decodeSavedBackup = (commentText) => {
                try {
                    const m = commentText.match(/SAVED_CODE_BACKUP:([A-Za-z0-9+/=]+)/);
                    if (m && m[1]) {
                        try { return decodeURIComponent(escape(window.atob(m[1]))); } catch (e) { try { return window.atob(m[1]); } catch (_) { return ''; } }
                    }
                } catch (_e) {}
                return '';
            };

            // Walk top-level children and build segments
            const segments = [];
            let textBuffer = '';
            const children = Array.from(clone.childNodes || []);
            for (const child of children) {
                try {
                    if (child.nodeType === Node.ELEMENT_NODE && child.classList && child.classList.contains('code-block')) {
                        if (textBuffer && textBuffer.trim()) segments.push({ type: 'text', text: textBuffer });
                        textBuffer = '';

                        const codeEl = child.querySelector('code');
                        let codeText = '';
                        if (codeEl) {
                            codeText = codeEl.getAttribute('data-saved-code') || codeEl.dataset?.cleanCode || codeEl.textContent || '';
                            if ((!codeText || codeText.trim() === '') && codeEl.childNodes) {
                                for (const n of Array.from(codeEl.childNodes)) {
                                    if (n && n.nodeType === Node.COMMENT_NODE && String(n.nodeValue || '').includes('SAVED_CODE_BACKUP:')) {
                                        const dec = _decodeSavedBackup(String(n.nodeValue || ''));
                                        if (dec) { codeText = dec; break; }
                                    }
                                }
                            }
                        } else {
                            codeText = child.textContent || '';
                        }
                        const langEl = child.querySelector('.code-language');
                        let lang = (langEl && langEl.textContent) ? String(langEl.textContent).toLowerCase() : '';
                        if (lang === 'markup') lang = 'html';
                        segments.push({ type: 'code', lang: lang, code: codeText });
                    } else {
                        textBuffer = this._appendWhatsappTextPiece(textBuffer, this._extractWhatsappTextFromNode(child));
                    }
                } catch (e) {
                    console.warn('ConnectorWhatsapp: Error extracting segment from response:', e);
                }
            }
            if (textBuffer && textBuffer.trim()) segments.push({ type: 'text', text: textBuffer });

            if (!segments || segments.length === 0) return;

            // Ensure presence start is posted
            try { await this._startWhatsappPresenceKeepAlive(targetPhone); } catch (_) { }

            let firstMessage = true;
            for (const seg of segments) {
                if (!seg) continue;
                if (seg.type === 'text') {
                    let content = this._normalizeWhatsappReplyText(seg.text || '');
                    if (!content || !content.trim()) continue;
                    const prefix = firstMessage ? '🤖 ' : '';
                    try {
                        if (typeof this.postWhatsappText === 'function') {
                            await this.postWhatsappText(targetPhone, prefix + content);
                        }
                        this._appendWhatsappOrchestratorContext(targetPhone, { role: 'assistant', text: content });
                        await this._appendWhatsappPhoneConversationTurn(targetPhone, { role: 'assistant', text: content });
                    } catch (err) {
                        console.warn('ConnectorWhatsapp: Failed to send WhatsApp text segment via connectors:', err);
                    }
                } else if (seg.type === 'code') {
                    const raw = seg.code || '';
                    if (!raw || !raw.trim()) continue;
                    if (seg.lang && seg.lang.toLowerCase() === 'html') {
                        try {
                            const blob = new Blob([raw], { type: 'text/html' });
                            const filename = `paiperwork-snippet-${Date.now()}.html`;
                            const snippetCaptionText = await this._getLocalizedLangText(
                                language,
                                'whatsappHtmlSnippetCaption',
                                'HTML snippet'
                            );
                            const caption = `${firstMessage ? '🤖 ' : ''}${snippetCaptionText}`;
                            if (typeof this.postWhatsappFile === 'function') {
                                await this.postWhatsappFile(targetPhone, blob, filename, caption);
                            }
                        } catch (err) {
                            console.error('ConnectorWhatsapp: Failed to send WhatsApp HTML attachment via connectors:', err);
                            try {
                                const fence = '```html\n' + raw + '\n```';
                                if (typeof this.postWhatsappText === 'function') {
                                    await this.postWhatsappText(targetPhone, (firstMessage ? '🤖 ' : '') + fence);
                                }
                            } catch (_e) {}
                        }
                    } else {
                        try {
                            const fence = '```' + (seg.lang || '') + '\n' + raw + '\n```';
                            if (typeof this.postWhatsappText === 'function') {
                                await this.postWhatsappText(targetPhone, (firstMessage ? '🤖 ' : '') + fence);
                            }
                        } catch (err) {
                            console.warn('ConnectorWhatsapp: Failed to send WhatsApp code segment via connectors:', err);
                        }
                    }
                }

                firstMessage = false;
                await new Promise(r => setTimeout(r, 180));
            }

            try { await this._postWhatsappPresenceStopIfNeeded(targetPhone); } catch (err) { console.warn('ConnectorWhatsapp: Failed to post WhatsApp presence stop via connectors:', err); }
            return;
        } catch (error) {
            console.error('ConnectorWhatsapp: Error in multi-part WhatsApp reply flow:', error);
            // Best-effort fallback: do nothing
        }
    }
}

window.ConnectorWhatsapp = ConnectorWhatsapp;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.connectors) window.connectors = new ConnectorWhatsapp();
    });
} else {
    if (!window.connectors) window.connectors = new ConnectorWhatsapp();
}
