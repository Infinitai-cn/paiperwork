
class ConnectorsTab {
    constructor() {
        this.isInitialized = false;
        this.tabElement = document.getElementById('connectors-tab');
        this.whatsappButton = null;
        this.isPaired = false;
        this.serverStarted = false;
        this.serverStarting = false;
        this.serverStopping = false;
        this.pollInterval = null; // status button poll interval
        this.qrPollInterval = null; // QR modal poll interval
        this.qrCountdownInterval = null;
        this.qrCountdownSeconds = 0;
        this.qrRefreshNoticeTimeout = null;
        this.lastQrDataUrl = '';
        this.lastQrSignature = '';
        this.lastQrTimestamp = 0;
        this.whatsappQrTTL = 20000;
        this.whatsappQrWaitingForRefresh = false;
        this._currentQrObjectUrl = null;
        this.whatsappRequestGeneration = 0;
        this.whatsappPendingFetchControllers = new Set();
        this.whatsappQrRetryTimeout = null;
        this.whatsappManualStopRequested = false;
        this.whatsappWebsocketShouldReconnect = false;
        this.whatsappPairModalDismissed = false;
        this.whatsappRestartBlockedUntil = 0;
        this.whatsappRestartCooldownTimer = null;
        // Incoming WhatsApp polling state (messages from gateway)
        this.incomingPollInterval = null;
        this.incomingPollIntervalMs = 2500;

        this.whatsappWs = null;
        this.whatsappWsReconnectTimer = null;
        this.whatsappWsStartupTimer = null;
        this.whatsappMode = null; // personal or bot
        this.whatsappPersonalModeButton = null;
        this.whatsappBotModeButton = null;
        this.whatsappModelLockButton = null;
        this.whatsappPairNewDeviceButton = null;
        this.wechatButton = null;
        this.wechatServerStarted = false;
        this.wechatServerStarting = false;
        this.wechatServerStopping = false;
        this.wechatRequestGeneration = 0;
        this.wechatServerStatusPollInterval = null;
        this.wechatRuntimeStateSyncInterval = null;
        this.wechatIsPaired = false;
        this.wechatHasSavedAccount = false;
        this.wechatRestoreAttempted = false;
        this.wechatMigrationAttempted = false;
        this.wechatLoginSessionId = null;
        this.wechatLoginStatusPolling = null;
        this.wechatLoginModalDismissed = false;
        this.wechatLoginCurrentStatus = '';
        this.wechatDeleteAllPairedButton = null;
        this.wechatClearContextsButton = null;
        this.whatsappClearContextsButton = null;
        this.whatsappDeleteAllPairedButton = null;
        this.whatsappModelLocked = false;
        this.whatsappUnpairButton = null;
        this.savedWhatsappDeviceId = null;
        this.savedWhatsappDevices = [];
        this.whatsappFreshPairRequested = false;
        this.whatsappFreshPairDeviceId = null;
        this.whatsappSessionImportedForDevice = null;
        this.whatsappSessionRestoreSkippedForDevice = null;
        this.whatsappSessionRestoreStatus = '';
        this.whatsappStalePreferredDeviceCleared = null;
        this.whatsappRemoteLogoutNoticeShown = null;
        this.whatsappRemoteLogoutActive = false;
        this.whatsappModalPhase = 'starting';
        this.whatsappQrGraceUntil = 0;
        this.whatsappQrGraceMs = 5000;
        this.whatsappDeviceCatalogWritePromise = Promise.resolve();
        this.whatsappModeSelectionVersion = 0;
        this.whatsappModeLoadRequestId = 0;
        this._boundWhatsappPairingWindowCloseHandler = () => {
            this._handleWhatsappPairingWindowClose();
            this._handleWechatPairingWindowClose();
        };
        this._connectorScriptLoadPromises = {};
    }
    
    async _loadConnectorScript(src) {
        if (typeof window === 'undefined') {
            return;
        }
        if (!this._connectorScriptLoadPromises) {
            this._connectorScriptLoadPromises = {};
        }
        if (this._connectorScriptLoadPromises[src]) {
            return this._connectorScriptLoadPromises[src];
        }

        if (window.tabLoader && typeof window.tabLoader.loadScript === 'function') {
            this._connectorScriptLoadPromises[src] = window.tabLoader.loadScript(src);
            return this._connectorScriptLoadPromises[src];
        }

        this._connectorScriptLoadPromises[src] = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = src;
            script.onload = () => resolve();
            script.onerror = (error) => reject(new Error(`Failed to load connector script: ${src}`));
            document.head.appendChild(script);
        });
        return this._connectorScriptLoadPromises[src];
    }

    async _ensureWhatsappConnectorLoaded() {
        if (typeof window !== 'undefined' && window.connectors && typeof window.connectors.postWhatsappText === 'function' && typeof window.connectors.startIncomingPolling === 'function') {
            return;
        }
        await this._loadConnectorScript('js/tabs/connectorWhatsapp.js');
    }

    async _ensureWechatConnectorLoaded() {
        if (typeof window !== 'undefined' && window.wechatConnectorBridge && typeof window.wechatConnectorBridge.getInstance === 'function') {
            return;
        }
        await this._loadConnectorScript('js/tabs/connectorWechat.js');
    }

static ORCHESTRATOR_SYSTEM_PROMPT = `You are an internal routing assistant for Paiperwork.
Your job is to decide whether an incoming user message should be handled by the normal chat flow ("chat"), by the chat+websearch flow ("chat+websearch"), by document-check ("document-check"), by the research workflow ("research"), by the promptable SlideForge presentation workflow ("presentation"), by the Artifacts miniapp workflow ("artifact"), or by the Knowledge Base workflow ("knowledge"). When the input includes active follow-up session context, you should also help rewrite the final engine prompt for that workflow.

Instructions:
- Do NOT produce natural chat replies. Under no circumstances generate conversational text as output.
- Always respond with valid JSON only.
- Required JSON fields: tool, document, confidence, reason, language, think.
- Optional JSON fields when useful:
    - query: for research requests, the best final research query to send to the engine.
    - merged_prompt: for active follow-up workflows, a single semantically merged prompt/request that should be preferred over naive concatenation.
- Do NOT include any extra text, analysis, or commentary outside the JSON object.
- If you cannot parse intent or format JSON, return exactly: { "tool": "chat", "document": "", "confidence": 0.9, "reason": "Unable to parse intent as JSON", "language": "English", "think": false }
- Set the "language" field to the detected user language name, using values like "English", "Español", "Français", "Deutsch", "Italiano", "Português", "中文", "日本語", "한국어", or "Русский".
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
    - Artifact command examples:
        - English: "Create one pinball game miniapp" => artifact
        - English: "Generate one beautiful moving wallpaper miniapp using internet" => artifact
        - English: "Show my saved miniapps" => artifact
        - English: "Send my saved pinball miniapp" => artifact
        - English follow-up after an artifact was just created: "Make the rain drops bigger" => artifact
        - English follow-up after an artifact was just created: "Add a start button and make the background darker" => artifact
        - English follow-up after an artifact was just created: "For the rain sounds use white/pink/mixed noise" => artifact
        - English follow-up close reply after an artifact was just created: "No thanks, I'm finished" => artifact session close
        - Español: "Crea una miniaplicación de pinball" => artifact
        - Français: "Crée une miniapp de flipper" => artifact
        - Deutsch: "Erstelle eine Mini-App als Pinball-Spiel" => artifact
        - Italiano: "Crea una miniapp flipper" => artifact
        - Português: "Cria uma miniaplicação de papel de parede animado" => artifact
        - Русский: "Создай мини-приложение пинбол" => artifact
        - 中文: "创建一个弹球迷你应用" => artifact
        - 日本語: "ピンボールのミニアプリを作成" => artifact
        - 한국어: "핀볼 미니앱을 만들어줘" => artifact
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
- Generic creative-writing or writing-assistance requests stay on "chat" unless the user explicitly names a specialized workflow target. Examples: "Create a beautiful poem", "Write a short story", "Create a script for an escape room", and "Write a marketing email" => chat.
- If user asks to create, generate, build, or prepare a presentation or slide deck from provided text/content, prefer "presentation".
- If user asks to list, browse, view, choose, or send an existing saved presentation, also prefer "presentation".
- If user asks to create, generate, build, or prepare a miniapp / mini application / artifact / HTML mini app, prefer "artifact".
- If user asks to list, browse, view, choose, or send an existing saved miniapp / artifact, also prefer "artifact".
- Do not choose "presentation" or "artifact" from the verbs alone. Require explicit workflow nouns such as presentation, slide deck, slides, miniapp, mini application, artifact, or HTML app, or a saved-workflow cue.
- Treat localized equivalents and spacing variants of "artifact", "miniapp", "mini-app", and "mini app" as the same artifact intent across all supported languages.
- If the immediately previous user turns were about creating or refining an artifact/miniapp, then follow-up modification requests like "make it darker", "add a start button", or "make the rain drops bigger" should remain on "artifact" even if the user does not repeat the words miniapp or artifact.
- When there is an active artifact/miniapp session, treat short refinement requests as "artifact" by default unless the user explicitly switches domains to models, documents, research, dataviz, or presentations.
- When there is an active artifact/miniapp session, any request that does not explicitly start a fresh artifact creation flow should be treated as a modification of the current miniapp. Requests like "translate to Chinese", "make it blue", or "add a timer" are follow-up artifact modifications even if they do not mention miniapp. Only treat it as a new artifact creation when the user explicitly asks to create/build/generate/make a new miniapp/artifact.
- In an active artifact/miniapp session, phrases like "use white noise", "use pink noise", "use this color", or "use bigger drops" are artifact refinements, not AI model-switch requests.
- In an active artifact/miniapp session, replies like "no", "no thanks", "I'm finished", "I'm good", "looks good", or their localized equivalents mean the user wants to close artifact follow-up mode, not switch AI models.
- Requests to make the miniapp richer with web/internet/search context should still stay on "artifact", not "chat+websearch".
- Follow-Up Prompt Reconstruction:
    - If the input includes active follow-up session context for artifact/miniapp, research, prompted presentations, or document-summary/document-questioning flows, do not just classify the tool. Also infer the best final rewritten request for the downstream engine.
    - Use the optional field merged_prompt when the current user message modifies, negates, replaces, narrows, or refines a previous request.
    - The merged_prompt must be a clean, coherent rewrite of the intended final request, not a blind concatenation of old and new instructions.
    - Resolve conflicts by applying the latest user intent over earlier details. If the refinement negates something from the previous request, remove or rewrite the old part instead of keeping both.
    - Preserve the user's goal, style, and scope unless the new refinement explicitly changes them.
    - For research follow-ups, prefer query for the final research query. You may also include merged_prompt if it helps, but query is preferred for the research engine.
    - For prompted presentations follow-ups, merged_prompt should describe the best final presentation-generation request/source prompt after reconciling the previous prompt and the new refinement.
    - For artifact/miniapp follow-ups, merged_prompt should describe the best final miniapp-generation prompt after reconciling the previous prompt and the new refinement.
    - For document-summary or document-questioning follow-ups, merged_prompt may clarify the actual summary/question request while preserving the selected-document context. If the user explicitly names a different already-ingested document, treat that as an explicit document switch and set the document field to that other document instead of keeping the current one. Do not invent filenames.
    - Example: previous request "Create a rain forest with dynamic rain" plus refinement "Remove the rain" should produce a merged_prompt closer to "Create a rainforest scene, no dynamic rain" and not "Create a rain forest with dynamic rain, remove the rain".
    - Example: previous request "Research AI trends for startups" plus refinement "focus on Europe and exclude healthcare" should produce query like "AI trends for startups in Europe excluding healthcare".
    - Example: previous request "Create a presentation about our 2026 roadmap" plus refinement "make it more minimal and add moving ornaments" should produce a merged_prompt that already reflects the updated presentation direction.
- For ambiguous conversational text in any language, default to "chat".
- Decide ONLY one tool per request; do not emit multiple tool values.
- Ignore any internal "thinking" markers or tags (for example: <think>...</think>, <thinking>...</thinking>, and text like "💬 Thinking..."). Treat those as not part of the user's request.
- Handle multi-language requests robustly using these keyword signals.
- Prefer "chat+websearch" when the user explicitly requests web lookups, asks for current events, requests citations, or asks for verifiable/up-to-date facts.
- Prefer "research" when the user asks for a research-style workflow, comprehensive topic analysis, or actionable insights (examples: "research the latest AI trends", "prepare a report on market dynamics", "investigate competitor strategies", "what is the best approach for market research?").
- Requests about available AI models, the current selected model, installed models, switching models, choosing between local/cloud models, or commands like "show me my models" / "what model is selected now" / "use Gemma4 local" are NOT document requests. Route those to "chat" so the frontend can handle model management.
- Choose "document-check" whenever the user explicitly or implicitly asks to interact with saved documents or files. Use semantic intent matching (not just exact text matches) and fuzzy document-name matching (close titles, partial names, alternate case, punctuation variations) so varied forms like "I want to review my recent reports", "find the PDF about taxes", "can you open that contract", "browse my docs", and "show me my uploads" are all treated as document-check. Also treat forms like "ask a question to <document>", "question this document", "ask about <document>", "a question for <doc title>" as document-check intent (not general knowledge questions without explicit document reference). If the user asks to "summarize" or "ask about" a near-matching document name (e.g. "Summarize a call to action" vs "A_Call_to_Action_for_Generative_AI.pdf"), prefer document-check with the closest candidate. Do not set document-check for generic conversational queries like "What day is today?", "Who won the game?", or "How do I boil pasta?" unless there is explicit document context. Examples of document intent: "my documents", "check my documents", "list my documents", "summarize my file", "summarize invoice.pdf", "ask questions about my report", "open the contract named X", "review the uploaded files", or when the user mentions uploading content to be checked. In these cases:
    - If you can confidently identify a specific saved document, set the "document" field to that exact filename or id.
    - If you cannot confidently identify a specific document (user didn't supply a filename or the name is ambiguous), set the tool to "document-check" and set the "document" field to an empty string so the frontend can ask the user to choose from candidate documents.
    - Do not choose "chat" merely because a filename is missing; prefer "document-check" when document intent is clear.

- Use only already ingested documents from the app. Do not ask users to send or upload new files via wechat; those are forbidden for security reasons.
- If document intent is ambiguous (e.g. "a document", "some doc" with no explicit existing filename), choose "document-check" and set "document" to ""; do not reroute to chat or ask for attachments.
- If user intent is still unclear after document-check, keep the response as JSON and set the tool to "chat" with a reason like "Please clarify your question". Do not output natural-language instructions outside the JSON.
- Detect the user language and always include the "language" field in the JSON output using the language name, not a short code.

- Always include the required fields in the returned JSON, e.g.:
  { "tool": "chat", "document": "", "confidence": 0.9, "reason": "Casual conversational request.", "language": "Spanish", "think": false }

Examples of inputs and the exact JSON you must output (output must be valid JSON only, no text):
Input: "Summarize my invoice.pdf"
Output: { "tool": "document-check", "document": "invoice.pdf", "confidence": 0.95, "reason": "User explicitly requested a summary for a named saved file.", "language": "English", "think": false }

Input: "I want to check my documents"
Output: { "tool": "document-check", "document": "", "confidence": 0.9, "reason": "User expressed intent to check saved documents but did not name one.", "language": "English", "think": false }

Input: "What's the weather today?"
Output: { "tool": "chat+websearch", "document": "", "confidence": 0.95, "reason": "Explicit web-query requesting current information.", "language": "English", "think": false }

Input: "Tell me a joke"
Output: { "tool": "chat", "document": "", "confidence": 0.9, "reason": "Casual conversational request with no document or web-intent.", "language": "English", "think": false }

Input: "Research the latest trends in electric vehicle batteries and summarize opportunities for startups."
Output: { "tool": "research", "document": "", "query": "latest trends in electric vehicle batteries and opportunities for startups", "confidence": 0.95, "reason": "Explicit research-style request with analytical intent.", "language": "English", "think": false }

Input: "Create a presentation with this text: Our 2026 roadmap focuses on AI automation, cloud cost controls, and customer expansion across Europe."
Output: { "tool": "presentation", "document": "", "confidence": 0.95, "reason": "User explicitly requested a slide presentation from provided text.", "language": "English", "think": false }

Input: "Create one pinball game miniapp very beautiful"
Output: { "tool": "artifact", "document": "", "confidence": 0.95, "reason": "User explicitly requested an HTML miniapp artifact.", "language": "English", "think": false }

Output ONLY valid JSON and nothing else. Do NOT include markdown fence markers (three backticks) or any additional explanation. Do NOT emit code blocks. If your response is not strictly valid JSON, return:
{"tool":"chat","document":"","confidence":0.9,"reason":"Unable to parse intent as JSON","language":"English","think":false}

If unsure, choose "chat".
`;



    initialize() {
        if (this.isInitialized || !this.tabElement) {
            return;
        }
        this.tabElement.innerHTML = `
            <div class="connectors-container">

                <div class="connectors-card connectors-card-whatsapp collapsed">
                    <div id="whatsapp-status-card" class="connectors-status-card">
                        ${Lang.get('whatsappNotPairedCard') || 'WhatsApp not paired'}
                    </div>
                    <div class="whatsapp-button-container">
                        <button id="whatsapp-pair-btn" class="connectors-whatsapp-button" title="${Lang.get('startServerButton') || 'Start server'}">${Lang.get('startServerButton') || 'Start server'}</button>
                    </div>
                    <div class="whatsapp-mode-button-container">
                        <button id="whatsapp-personal-mode-btn" class="connectors-mode-button" title="${Lang.get('whatsappPersonalModeButtonTitle') || 'Personal mode'}">${Lang.get('whatsappPersonalModeButton') || 'Personal'}</button>
                        <button id="whatsapp-bot-mode-btn" class="connectors-mode-button" title="${Lang.get('whatsappBotModeButtonTitle') || 'Bot mode'}">${Lang.get('whatsappBotModeButton') || 'Bot'}</button>
                    </div>
                    <div class="whatsapp-model-lock-button-container">
                        <button id="whatsapp-model-lock-btn" class="connectors-mode-button connectors-mode-button-full" title="Lock AI model">Lock AI model</button>
                    </div>
                    <div class="whatsapp-new-device-button-container" style="margin-top:16px;">
                        <button id="whatsapp-pair-new-device-btn" class="connectors-mode-button connectors-mode-button-full connectors-mode-button-neutral" title="Pair a new WhatsApp device">Pair new device</button>
                    </div>
                    <div class="whatsapp-clear-contexts-button-container" style="margin-top:12px;">
                        <button id="whatsapp-clear-contexts-btn" class="connectors-mode-button connectors-mode-button-full connectors-mode-button-neutral" title="Clear WhatsApp Contexts">Clear WhatsApp Contexts</button>
                    </div>
                    <div class="whatsapp-delete-all-devices-button-container" style="margin-top:12px;">
                        <button id="whatsapp-delete-all-paired-btn" class="connectors-mode-button connectors-mode-button-full connectors-mode-button-neutral" title="Delete paired device(s)">Delete paired device(s)</button>
                    </div>
                </div>

                <div class="connectors-card connectors-card-wechat collapsed">
                    <div id="wechat-status-card" class="connectors-status-card">
                        ${Lang.get('wechatNotPairedCard') || 'WeChat not paired'}
                    </div>
                    <div class="wechat-button-container">
                        <button id="wechat-pair-btn" class="connectors-whatsapp-button connectors-wechat-button" title="${Lang.get('startWechatServerButton') || 'Start server'}">${Lang.get('startWechatServerButton') || 'Start server'}</button>
                    </div>
                    <div class="wechat-model-lock-button-container">
                        <button id="wechat-model-lock-btn" class="connectors-mode-button connectors-mode-button-full" title="Lock AI model">Lock AI model</button>
                    </div>
                    <div class="wechat-clear-contexts-button-container" style="margin-top:12px;">
                        <button id="wechat-clear-contexts-btn" class="connectors-mode-button connectors-mode-button-full connectors-mode-button-neutral" title="Clear WeChat Contexts">Clear WeChat Contexts</button>
                    </div>
                    <div class="wechat-delete-all-devices-button-container" style="margin-top:12px;">
                        <button id="wechat-delete-all-paired-btn" class="connectors-mode-button connectors-mode-button-full connectors-mode-button-neutral" title="Delete paired account(s)">Delete paired account(s)</button>
                    </div>
                </div>

            </div>
        `;

        this.whatsappButton = document.getElementById('whatsapp-pair-btn');
        if (this.whatsappButton) {
            this.setupWhatsappButton();
        }

        const whatsappStatusCard = document.getElementById('whatsapp-status-card');
        const whatsappCard = this.tabElement.querySelector('.connectors-card-whatsapp');
        if (whatsappStatusCard && whatsappCard) {
            whatsappStatusCard.style.cursor = 'pointer';
            whatsappStatusCard.title = 'Click to expand or collapse this card';
            whatsappStatusCard.addEventListener('click', () => {
                whatsappCard.classList.toggle('collapsed');
            });
        }

        this.wechatButton = document.getElementById('wechat-pair-btn');
        this.wechatDeleteAllPairedButton = document.getElementById('wechat-delete-all-paired-btn');
        if (this.wechatButton) {
            this.setupWechatButton();
        }
        if (this.wechatDeleteAllPairedButton) {
            this.wechatDeleteAllPairedButton.addEventListener('click', async () => {
                await this.deleteAllPairedWechatData();
            });
        }

        const wechatStatusCard = document.getElementById('wechat-status-card');
        const wechatCard = this.tabElement.querySelector('.connectors-card-wechat');
        if (wechatStatusCard && wechatCard) {
            wechatStatusCard.style.cursor = 'pointer';
            wechatStatusCard.title = 'Click to expand or collapse this card';
            wechatStatusCard.addEventListener('click', () => {
                wechatCard.classList.toggle('collapsed');
            });
        }

        this.isInitialized = true;

        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', this._boundWhatsappPairingWindowCloseHandler);
            window.addEventListener('pagehide', this._boundWhatsappPairingWindowCloseHandler);
        }
    }

    setupWhatsappButton() {
        if (!this.whatsappButton) return;

        //console.log('ConnectorsTab: setupWhatsappButton called');

        // Reference mode buttons
        this.whatsappPersonalModeButton = document.getElementById('whatsapp-personal-mode-btn');
        this.whatsappBotModeButton = document.getElementById('whatsapp-bot-mode-btn');
        this.whatsappModelLockButton = document.getElementById('whatsapp-model-lock-btn');
        this.whatsappPairNewDeviceButton = document.getElementById('whatsapp-pair-new-device-btn');
        this.whatsappClearContextsButton = document.getElementById('whatsapp-clear-contexts-btn');
        this.whatsappDeleteAllPairedButton = document.getElementById('whatsapp-delete-all-paired-btn');

        if (this.whatsappPersonalModeButton) {
            this.whatsappPersonalModeButton.addEventListener('click', async () => {
                await this.setWhatsappMode('personal');
            });
        }
        if (this.whatsappBotModeButton) {
            this.whatsappBotModeButton.addEventListener('click', async () => {
                await this.setWhatsappMode('bot');
            });
        }
        if (this.whatsappModelLockButton) {
            this.whatsappModelLockButton.addEventListener('click', async () => {
                await this.setWhatsappModelLock(!this.whatsappModelLocked);
            });
        }
        if (this.whatsappPairNewDeviceButton) {
            this.whatsappPairNewDeviceButton.addEventListener('click', async () => {
                if (this._isWhatsappPairNewDeviceBlocked()) {
                    return;
                }
                const readyForFreshPair = await this._prepareWhatsappFreshPairingStart();
                if (!readyForFreshPair) {
                    return;
                }
                await this.startWhatsappFreshPairing();
            });
        }
        if (this.whatsappClearContextsButton && window.DatabaseTab && typeof window.DatabaseTab.bindClearWhatsappPhoneContextsButton === 'function') {
            window.DatabaseTab.bindClearWhatsappPhoneContextsButton(this.whatsappClearContextsButton);
        }
        if (this.whatsappDeleteAllPairedButton) {
            this.whatsappDeleteAllPairedButton.addEventListener('click', async () => {
                if (this._isWhatsappStoppedServerActionBlocked()) {
                    return;
                }
                await this.deleteAllPairedWhatsappDevices();
            });
        }


        // Initialize mode state from DB
        this.loadWhatsappModeFromDb().catch(err => {
            console.warn('ConnectorsTab: loadWhatsappModeFromDb failed', err);
            this.setWhatsappMode(null);
        });
        this.loadWhatsappModelLockFromDb().catch(err => {
            console.warn('ConnectorsTab: loadWhatsappModelLockFromDb failed', err);
            this.setWhatsappModelLock(false, true);
        });

        // Load any saved device from persistent Paiperwork DB and sync to server state
        this._loadSavedWhatsappDeviceInfo().then(async info => {
            if (this._hasMultipleSavedWhatsappDevices()) {
                this.savedWhatsappDeviceId = null;
                return;
            }

            void info;
        }).catch(err => {
            console.warn('ConnectorsTab: initial _loadSavedWhatsappDeviceInfo failed', err);
        });

        // Initialize button state
        this.setWhatsappPairButtonState(false);

        // Check connection once at startup (no continuous polling until user starts pairing).
        (async () => {
            await this._loadSavedWhatsappDeviceInfo();

            if (this._hasMultipleSavedWhatsappDevices()) {
                this.savedWhatsappDeviceId = null;
                return;
            }
            const status = await this.refreshWhatsappPairButton({ check: true });
            if (status && status.gatewayRunning) {
                this.serverStarted = true;
                const alreadyPaired = !!status.loggedIn;
                this.setWhatsappPairButtonState(alreadyPaired);
                if (!alreadyPaired) {
                    const hasSavedDevices = Array.isArray(this.savedWhatsappDevices) && this.savedWhatsappDevices.length > 0;
                    this._setWhatsappFreshPairRequested(!hasSavedDevices);
                    this.openWhatsappPairModal();
                }
            }
        })();

        // Add click event listener
        this.whatsappButton.addEventListener('click', async () => {
            //console.log('ConnectorsTab: whatsapp button click detected');
            if (this.serverStopping) {
                return;
            }
            if (!this.serverStarted) {
                await this.startWhatsappServer();
                return;
            }
            await this.stopWhatsappServer();
        });
    }

    setupWechatButton() {
        if (!this.wechatButton) return;

        this.wechatButton.addEventListener('click', async () => {
            if (this.wechatServerStopping) {
                return;
            }
            if (!this.wechatServerStarted) {
                await this.startWechatServer();
                return;
            }
            await this.stopWechatServer();
        });

        this.wechatClearContextsButton = document.getElementById('wechat-clear-contexts-btn');
        if (this.wechatClearContextsButton) {
            this.wechatClearContextsButton.addEventListener('click', async () => {
                await this.clearAllWechatContexts();
            });
        }

        this.setWechatPairButtonState(false);
        (async () => {
            const status = await this.refreshWechatPairButton({ check: true });
            if (status && status.serverStarted) {
                this.wechatServerStarted = true;
                const alreadyPaired = status.paired === true;
                this.setWechatPairButtonState(alreadyPaired);
                if (!alreadyPaired) {
                    this.wechatHasSavedAccount = await this._hasSavedWechatAccount();
                    if (!this.wechatHasSavedAccount) {
                        await this._startWechatLoginFlow();
                    }
                }
            }
        })();
    }

    async refreshWechatPairButton(options = { check: true }) {
        if (!this.wechatButton || !options.check) {
            return null;
        }

        try {
            const res = await fetch('/api/wechat/status', { cache: 'no-store' });
            if (!res.ok) {
                this.wechatServerStarted = false;
                this.wechatServerStarting = false;
                this.wechatServerStopping = false;
                this.setWechatPairButtonState(false);
                return null;
            }

            const data = await res.json();
            //console.info('ConnectorsTab: refreshWechatPairButton response', data);
            this.wechatServerStarted = data.serverStarted === true;
            const wasPaired = this.wechatIsPaired === true;
            this.wechatIsPaired = data.paired === true;
            this.wechatServerStarting = false;
            this.wechatServerStopping = false;
            this.setWechatPairButtonState(this.wechatIsPaired);
            if (this.wechatServerStarted && this.wechatIsPaired && !wasPaired) {
                window.dispatchEvent(new CustomEvent('wechatPaired'));
            }
            if (wasPaired && !this.wechatIsPaired) {
                window.dispatchEvent(new CustomEvent('wechatUnpaired'));
                this._stopWechatRuntimeStateSync();
            }

            if (this.wechatServerStarted && this.wechatIsPaired) {
                this._startWechatRuntimeStateSync();
            }

            if (this.wechatServerStarted && !this.wechatMigrationAttempted) {
                this.wechatMigrationAttempted = true;
                const migrated = await this._migrateWechatRuntimeStateToPaiperworkDB();
                if (migrated) {
                    this.wechatHasSavedAccount = true;
                }
            }

            if (this.wechatServerStarted && !this.wechatIsPaired && !this.wechatRestoreAttempted) {
                this.wechatHasSavedAccount = await this._hasSavedWechatAccount();
                if (this.wechatHasSavedAccount) {
                    this.wechatRestoreAttempted = true;
                    const restored = await this._restoreSavedWechatAccounts();
                    if (restored) {
                        return this.refreshWechatPairButton({ check: true });
                    }
                }
            }

            return data;
        } catch (err) {
            console.warn('ConnectorsTab: refreshWechatPairButton failed', err);
            return null;
        }
    }

    setWechatPairButtonState(isPaired) {
        if (!this.wechatButton) {
            return;
        }

        this.wechatIsPaired = isPaired;
        const statusCard = document.getElementById('wechat-status-card');
        if (statusCard) {
            if (this.wechatServerStarted) {
                statusCard.textContent = isPaired
                    ? (Lang.get('wechatPairedCard') || 'WeChat paired')
                    : (Lang.get('wechatServerStartedCard') || 'WeChat server started');
            } else {
                statusCard.textContent = (Lang.get('wechatNotPairedCard') || 'WeChat not paired');
            }
        }

        let buttonText = Lang.get('startWechatServerButton') || 'Start server';
        let buttonTitle = buttonText;
        let disabled = false;

        if (this.wechatServerStopping) {
            buttonText = 'Stopping the server...';
            buttonTitle = 'Stopping the server...';
            disabled = true;
        } else if (this.wechatServerStarted) {
            buttonText = 'Stop server';
            buttonTitle = 'Stop server';
        } else if (this.wechatServerStarting) {
            buttonText = Lang.get('serverStartingButton') || 'Starting server...';
            buttonTitle = buttonText;
            disabled = true;
        }

        this.wechatButton.textContent = buttonText;
        this.wechatButton.title = buttonTitle;
        this.wechatButton.disabled = disabled;
        this.wechatButton.style.height = '56px';
        this.wechatButton.style.minHeight = '56px';
        this.wechatButton.style.padding = '0 16px';
        this.wechatButton.style.borderRadius = '8px';
        this.wechatButton.style.fontWeight = '600';
        this.wechatButton.style.cursor = disabled ? 'not-allowed' : 'pointer';
        if (disabled) {
            this.wechatButton.style.backgroundColor = '#c4c4ca';
            this.wechatButton.style.color = '#575f6b';
        } else {
            this.wechatButton.style.backgroundColor = '';
            this.wechatButton.style.color = '';
        }
    }

    async _hasSavedWechatAccount() {
        try {
            const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
            if (!hashedMasterKey) {
                return false;
            }

            const accounts = await PaiperworkDB.listPersistedWechatAccounts(hashedMasterKey);
            return Array.isArray(accounts) && accounts.length > 0;
        } catch (err) {
            console.warn('ConnectorsTab: _hasSavedWechatAccount failed', err);
            return false;
        }
    }

    async _loadSavedWechatAccounts() {
        try {
            const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
            if (!hashedMasterKey) {
                return [];
            }
            return await PaiperworkDB.listPersistedWechatAccounts(hashedMasterKey);
        } catch (err) {
            console.warn('ConnectorsTab: _loadSavedWechatAccounts failed', err);
            return [];
        }
    }

    async _restoreSavedWechatAccounts() {
        try {
            const savedAccounts = await this._loadSavedWechatAccounts();
            if (!Array.isArray(savedAccounts) || savedAccounts.length === 0) {
                return false;
            }
            const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
            if (!hashedMasterKey) {
                return false;
            }

            const res = await fetch('/api/wechat/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hashedMasterKey, accounts: savedAccounts })
            });
            if (!res.ok) {
                console.warn('ConnectorsTab: restore saved WeChat accounts failed', await res.text());
                return false;
            }
            return true;
        } catch (err) {
            console.warn('ConnectorsTab: _restoreSavedWechatAccounts failed', err);
            return false;
        }
    }

    async _persistWechatAccountAfterLogin(data) {
        try {
            const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
            const accountId = String(data?.account_id || data?.ilink_bot_id || data?.ilinkBotId || '').trim();
            const baseUrl = String(data?.base_url || data?.baseUrl || data?.baseurl || data?.baseURL || '').trim();
            const token = String(data?.bot_token || data?.token || '').trim();
            if (!hashedMasterKey || !data || !accountId || !token || !baseUrl) {
                console.warn('ConnectorsTab: _persistWechatAccountAfterLogin skipped due to invalid login payload', {
                    hashedMasterKeyPresent: !!hashedMasterKey,
                    account_id: accountId,
                    tokenPresent: !!token,
                    bot_token: Boolean(data?.bot_token),
                    token: data?.token,
                    base_url: data?.base_url,
                    baseUrl: data?.baseUrl,
                    baseurl: data?.baseurl,
                    ilink_bot_id: data?.ilink_bot_id,
                    payload: data
                });
                return;
            }

            const existingAccounts = await this._loadSavedWechatAccounts();
            const alreadySaved = Array.isArray(existingAccounts) && existingAccounts.some((account) => account.account_id === accountId);
            const rawLoginStatus = String(data.status || 'connected').trim();
            const normalizedLoginStatus = rawLoginStatus.toLowerCase() === 'confirmed' ? 'connected' : rawLoginStatus;
            const accountToSave = {
                account_id: accountId,
                base_url: baseUrl,
                token,
                ilink_user_id: String(data.ilink_user_id || data.ilinkUserId || ''),
                enabled: true,
                login_status: normalizedLoginStatus,
                last_error: String(data.error || ''),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            //console.info('ConnectorsTab: WeChat normalized account payload to save', accountToSave);

            if (alreadySaved) {
                console.info('ConnectorsTab: persisted WeChat account already exists, updating saved record', {
                    account_id: accountId,
                    base_url: baseUrl
                });
            }

            await PaiperworkDB.savePersistedWechatAccount(hashedMasterKey, accountToSave);
            //console.info('ConnectorsTab: saved persisted WeChat account', { account_id: accountId, base_url: baseUrl });
        } catch (err) {
            console.warn('ConnectorsTab: _persistWechatAccountAfterLogin failed', err);
        }
    }

    async _fetchWechatMigrationState() {
        try {
            const res = await fetch('/api/wechat/migration/legacy-state', { cache: 'no-store' });
            if (!res.ok) {
                throw new Error(await res.text());
            }
            return await res.json();
        } catch (err) {
            console.warn('ConnectorsTab: failed to fetch WeChat migration state', err);
            return null;
        }
    }

    async _migrateWechatRuntimeStateToPaiperworkDB() {
        try {
            const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
            if (!hashedMasterKey) {
                return false;
            }

            const migrationState = await this._fetchWechatMigrationState();
            if (!migrationState) {
                return false;
            }

            const accounts = Array.isArray(migrationState.accounts) ? migrationState.accounts : [];
            const sessions = Array.isArray(migrationState.login_sessions) ? migrationState.login_sessions : [];
            const peerContexts = Array.isArray(migrationState.peer_contexts) ? migrationState.peer_contexts : [];
            const events = Array.isArray(migrationState.events) ? migrationState.events : [];
            const logs = Array.isArray(migrationState.logs) ? migrationState.logs : [];

            let persistedAny = false;
            for (const account of accounts) {
                const saved = await PaiperworkDB.savePersistedWechatAccount(hashedMasterKey, account);
                if (saved) {
                    persistedAny = true;
                }
            }

            for (const session of sessions) {
                const saved = await PaiperworkDB.savePersistedWechatLoginSession(hashedMasterKey, session);
                if (saved) {
                    persistedAny = true;
                }
            }

            for (const peerContext of peerContexts) {
                const saved = await PaiperworkDB.savePersistedWechatPeerContext(hashedMasterKey, peerContext);
                if (saved) {
                    persistedAny = true;
                }
            }

            for (const event of events) {
                const saved = await PaiperworkDB.savePersistedWechatEvent(hashedMasterKey, event);
                if (saved) {
                    persistedAny = true;
                }
            }

            for (const logEntry of logs) {
                const saved = await PaiperworkDB.savePersistedWechatLog(hashedMasterKey, logEntry);
                if (saved) {
                    persistedAny = true;
                }
            }

            if (persistedAny) {
                console.info('ConnectorsTab: WeChat runtime state migrated to PaiperworkDB');
            }
            return persistedAny;
        } catch (err) {
            console.warn('ConnectorsTab: _migrateWechatRuntimeStateToPaiperworkDB failed', err);
            return false;
        }
    }

    async _syncWechatAccountStateToPaiperworkDB() {
        try {
            const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
            if (!hashedMasterKey || !this.wechatServerStarted || !this.wechatIsPaired) {
                return false;
            }

            const res = await fetch('/api/wechat/migration/legacy-state?accounts_only=1', { cache: 'no-store' });
            if (!res.ok) {
                console.warn('ConnectorsTab: failed to sync WeChat account state', await res.text());
                return false;
            }

            const data = await res.json();
            if (!Array.isArray(data.accounts)) {
                return false;
            }

            let persistedAny = false;
            for (const account of data.accounts) {
                const saved = await PaiperworkDB.savePersistedWechatAccount(hashedMasterKey, account);
                if (saved) {
                    persistedAny = true;
                }
            }
            if (persistedAny) {
                //console.info('ConnectorsTab: persisted WeChat runtime account state', { accountCount: data.accounts.length });
            }
            return persistedAny;
        } catch (err) {
            console.warn('ConnectorsTab: _syncWechatAccountStateToPaiperworkDB failed', err);
            return false;
        }
    }

    _startWechatRuntimeStateSync() {
        if (this.wechatRuntimeStateSyncInterval) {
            return;
        }
        this.wechatRuntimeStateSyncInterval = setInterval(async () => {
            if (!this.wechatServerStarted || !this.wechatIsPaired) {
                return;
            }
            await this._syncWechatAccountStateToPaiperworkDB();
        }, 15000);
    }

    _stopWechatRuntimeStateSync() {
        if (this.wechatRuntimeStateSyncInterval) {
            clearInterval(this.wechatRuntimeStateSyncInterval);
            this.wechatRuntimeStateSyncInterval = null;
        }
    }

    async startWechatServer() {
        this.wechatRestoreAttempted = false;
        this.wechatMigrationAttempted = false;
        this.wechatServerStopping = false;
        this.wechatServerStarting = true;
        this.wechatServerStarted = false;
        this.setWechatPairButtonState(false);

        try {
            await this._ensureWechatConnectorLoaded();
        } catch (loadErr) {
            console.error('ConnectorsTab: failed to load WeChat connector script', loadErr);
            this.wechatServerStarting = false;
            this.setWechatPairButtonState(false);
            return;
        }

        const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
        if (!hashedMasterKey) {
            console.warn('ConnectorsTab: missing hashedMasterKey for WeChat start');
            this.wechatServerStarting = false;
            return;
        }

        if (window.__paiperworkDbBootPromise) {
            await window.__paiperworkDbBootPromise;
        }

        try {
            const savedAccounts = await this._loadSavedWechatAccounts();
            const res = await fetch('/api/wechat/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hashedMasterKey, accounts: savedAccounts })
            });
            if (!res.ok) {
                throw new Error(await res.text());
            }

            const data = await res.json();
            this.wechatServerStarted = data.serverStarted === true;
            this.wechatIsPaired = data.paired === true;
            this.wechatServerStarting = false;
            this.setWechatPairButtonState(this.wechatIsPaired);

            if (this.wechatServerStarted && this.wechatIsPaired) {
                console.info('ConnectorsTab: WeChat server started and already paired, invoking WeChat bridge onPaired');
                if (window.wechatConnectorBridge && typeof window.wechatConnectorBridge.getInstance === 'function') {
                    const bridgeInstance = window.wechatConnectorBridge.getInstance();
                    if (bridgeInstance && typeof bridgeInstance.onPaired === 'function') {
                        bridgeInstance.onPaired();
                    } else {
                        window.dispatchEvent(new CustomEvent('wechatPaired'));
                    }
                } else {
                    window.dispatchEvent(new CustomEvent('wechatPaired'));
                }
                this._startWechatRuntimeStateSync();
            }

            if (this.wechatServerStarted && !this.wechatMigrationAttempted) {
                this.wechatMigrationAttempted = true;
                const migrated = await this._migrateWechatRuntimeStateToPaiperworkDB();
                if (migrated) {
                    this.wechatHasSavedAccount = true;
                }
            }

            if (this.wechatServerStarted && !this.wechatIsPaired) {
                this.wechatHasSavedAccount = await this._hasSavedWechatAccount();
                if (this.wechatHasSavedAccount) {
                    await this.refreshWechatPairButton({ check: true });
                } else {
                    await this._startWechatLoginFlow();
                }
            }
        } catch (err) {
            console.error('ConnectorsTab: failed to start WeChat server', err);
            this.wechatServerStarted = false;
            this.wechatServerStarting = false;
            this.setWechatPairButtonState(false);
        }
    }

    async stopWechatServer() {
        this.wechatServerStopping = true;
        this.wechatServerStarting = false;
        this.setWechatPairButtonState(this.wechatIsPaired);

        let stopped = false;
        try {
            const res = await fetch('/api/wechat/stop', { method: 'POST' });
            if (!res.ok) {
                console.warn('ConnectorsTab: stop WeChat server failed', await res.text());
            } else {
                stopped = true;
            }
        } catch (err) {
            console.warn('ConnectorsTab: stop WeChat server request failed', err);
        }

        if (stopped) {
            const wasPaired = this.wechatIsPaired === true;
            this.wechatServerStarted = false;
            this.wechatIsPaired = false;
            this.wechatHasSavedAccount = false;
            this.wechatRestoreAttempted = false;
            this.wechatMigrationAttempted = false;
            this._stopWechatRuntimeStateSync();
            if (wasPaired) {
                window.dispatchEvent(new CustomEvent('wechatUnpaired'));
            }
        }
        this.wechatServerStopping = false;
        this.setWechatPairButtonState(this.wechatServerStarted ? this.wechatIsPaired : false);
    }

    async deleteAllPairedWechatData() {
        const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
        if (!hashedMasterKey) {
            console.warn('ConnectorsTab: deleteAllPairedWechatData missing master key');
            return;
        }

        const confirmMessage = (window.Lang && typeof Lang.get === 'function' && Lang.get('wechatDeleteAllPairedConfirm')) || 'You are about to delete WeChat pairing information from Paiperwork, are you sure?';
        if (typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm(confirmMessage)) {
            return;
        }

        try {
            if (this.wechatServerStarted) {
                await this.stopWechatServer();
            }

            await PaiperworkDB.clearWechatDatabase(hashedMasterKey);

            const wasPaired = this.wechatIsPaired === true;
            this.wechatServerStarted = false;
            this.wechatIsPaired = false;
            this.wechatHasSavedAccount = false;
            this.wechatRestoreAttempted = false;
            this.wechatMigrationAttempted = false;
            this.wechatLoginSessionId = null;
            this.wechatLoginStatusPolling = null;
            this.wechatLoginModalDismissed = true;
            if (wasPaired) {
                window.dispatchEvent(new CustomEvent('wechatUnpaired'));
            }
            this.setWechatPairButtonState(false);
            this._setWechatLoginModalStatus((window.Lang && typeof Lang.get === 'function' && Lang.get('wechatDeleteAllPairedSuccess')) || 'Paiperwork WeChat pairing data deleted. Click Start server to pair a new account now.');
        } catch (err) {
            console.warn('ConnectorsTab: deleteAllPairedWechatData failed', err);
            this._setWechatLoginModalStatus((window.Lang && typeof Lang.get === 'function' && Lang.get('wechatDeleteAllPairedFailed')) || 'Failed to delete Paiperwork WeChat pairing data. See console logs.');
        }
    }

    async clearAllWechatContexts() {
        const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
        if (!hashedMasterKey) {
            console.warn('ConnectorsTab: clearAllWechatContexts missing master key');
            return;
        }

        const confirmMessage = (window.Lang && typeof Lang.get === 'function' && Lang.get('wechatClearContextsConfirm')) || 'This will clear WeChat conversation context and message history but keep the paired account. Continue?';
        if (typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm(confirmMessage)) {
            return;
        }

        try {
            if (window.connectors && typeof window.connectors.clearAllwechatPerAccountRuntimeState === 'function') {
                await window.connectors.clearAllwechatPerAccountRuntimeState();
            }
            const ok = await PaiperworkDB.clearWechatContexts(hashedMasterKey);
            if (!ok) {
                throw new Error('clearWechatContexts returned false');
            }

            if (window.databaseTab && typeof window.databaseTab.refreshDatabaseStats === 'function') {
                await window.databaseTab.refreshDatabaseStats();
            }
            if (this.wechatServerStarted && this.wechatIsPaired) {
                await this.refreshWechatPairButton({ check: true });
            }
            this._setWechatLoginModalStatus((window.Lang && typeof Lang.get === 'function' && Lang.get('wechatClearContextsSuccess')) || 'WeChat context cleared. Paired account preserved.');
        } catch (err) {
            console.warn('ConnectorsTab: clearAllWechatContexts failed', err);
            this._setWechatLoginModalStatus((window.Lang && typeof Lang.get === 'function' && Lang.get('wechatClearContextsFailed')) || 'Failed to clear WeChat contexts. See console logs.');
        }
    }

    async _startWechatLoginFlow() {
        if (!this.wechatServerStarted || this.wechatIsPaired) {
            return;
        }
        this.wechatLoginSessionId = null;
        this.wechatLoginCurrentStatus = '';
        this.wechatLoginModalDismissed = false;
        this._openWechatLoginModal();

        try {
            const apiUrl = window.wechatConnector.getProxyApiPath('/api/accounts/login/start');
            //console.info('ConnectorsTab: starting WeChat login flow', { apiUrl });
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            if (!res.ok) {
                throw new Error(await res.text());
            }
            const data = await res.json();
            this.wechatLoginSessionId = String(data.session_id || data.sessionId || '').trim();
            if (!this.wechatLoginSessionId) {
                throw new Error('missing login session id');
            }
            this._setWechatLoginModalStatus('Scan the QR code with WeChat to login.');
            await this._refreshWechatLoginQr();
            this._startWechatLoginStatusPolling();
        } catch (err) {
            console.warn('ConnectorsTab: WeChat login flow failed', err);
            this._setWechatLoginModalStatus('Failed to start WeChat login flow. Check logs.');
        }
    }

    _openWechatLoginModal() {
        if (this.wechatLoginModalDismissed) {
            return;
        }
        if (window.wechatConnector && typeof window.wechatConnector.createLoginModal === 'function') {
            window.wechatConnector.createLoginModal(() => {
                this._handleWechatLoginModalClose();
            });
            return;
        }

        let modal = document.getElementById('wx-pair-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'wx-pair-modal';
            modal.className = 'wx-pair-modal';
            modal.style.position = 'fixed';
            modal.style.left = '50%';
            modal.style.top = '50%';
            modal.style.transform = 'translate(-50%, -50%)';
            modal.style.width = '360px';
            modal.style.maxWidth = 'calc(100vw - 24px)';
            modal.style.background = 'var(--modal-background, var(--card-bg, #ffffff))';
            modal.style.color = 'var(--text-color, #111111)';
            modal.style.border = '1px solid var(--border-color, #ccc)';
            modal.style.padding = '14px';
            modal.style.boxSizing = 'border-box';
            modal.style.maxHeight = 'calc(100vh - 32px)';
            modal.style.overflowY = 'auto';
            modal.style.zIndex = '9999';
            modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)';
            modal.style.borderRadius = '14px';
            modal.style.fontFamily = 'var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)';
        }

        modal.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;">
                <h2 style="margin:0;font-size:18px;font-weight:700;color:var(--text-color, #111111);">WeChat QR login</h2>
                <button id="wx-close-modal-x" type="button" aria-label="Close pairing" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:1px solid var(--border-color, #ccc);border-radius:999px;background:var(--button-secondary-bg, #f3f4f6);color:var(--button-secondary-text, #111111);cursor:pointer;font-size:20px;line-height:1;">&times;</button>
            </div>
            <div id="wx-status" style="margin-bottom:12px;font-size:14px;color:var(--text-color, #4d4d4d);">Starting WeChat login...</div>
            <div id="wx-qr-container" style="text-align:center;margin-bottom:12px;min-height:240px;display:flex;align-items:center;justify-content:center;background:var(--button-secondary-bg, #f8f8f8);border-radius:12px;padding:12px;">
                <div style="color:var(--disabled-color, #777);font-size:13px;">Waiting for QR code...</div>
            </div>
            <div id="wx-qr-note" style="font-size:13px;color:var(--text-color, #4d4d4d);margin-bottom:16px;">Scan the QR in the WeChat app to continue.</div>
            <button id="wx-close-modal" style="width:100%;padding:10px;background:var(--button-bg, #4CAF50);color:var(--button-text, #ffffff);border:1px solid transparent;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;">Close</button>
        `;

        if (!document.body.contains(modal)) {
            document.body.appendChild(modal);
        }

        const closeBtn = document.getElementById('wx-close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this._handleWechatLoginModalClose();
            });
        }
        const closeX = document.getElementById('wx-close-modal-x');
        if (closeX) {
            closeX.addEventListener('click', () => {
                this._handleWechatLoginModalClose();
            });
        }
    }

    _handleWechatLoginModalClose() {
        if (this.wechatLoginModalDismissed) {
            return;
        }
        this.wechatLoginModalDismissed = true;
        this._stopWechatLoginFlow();
        this._closeWechatLoginModal();
        this.stopWechatServer().catch(err => {
            console.warn('ConnectorsTab: failed to stop WeChat server after modal close', err);
        });
    }

    _setWechatLoginModalStatus(message) {
        if (window.wechatConnector && typeof window.wechatConnector.setLoginModalStatus === 'function') {
            window.wechatConnector.setLoginModalStatus(message);
            return;
        }
        this.wechatLoginCurrentStatus = String(message || '');
        const statusEl = document.getElementById('wx-status');
        if (statusEl) {
            statusEl.textContent = this.wechatLoginCurrentStatus;
        }
    }

    async _refreshWechatLoginQr() {
        if (!this.wechatLoginSessionId) {
            return;
        }
        if (window.wechatConnector && typeof window.wechatConnector.renderLoginQr === 'function') {
            window.wechatConnector.renderLoginQr(this.wechatLoginSessionId);
            return;
        }

        const qrContainer = document.getElementById('wx-qr-container');
        if (!qrContainer) {
            return;
        }
        qrContainer.innerHTML = '';
        const img = document.createElement('img');
        img.alt = 'WeChat QR Code';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '260px';
        img.style.borderRadius = '12px';
        img.style.border = '1px solid var(--border-color, #ddd)';
        img.src = window.wechatConnector ? window.wechatConnector.getProxyApiPath('/api/accounts/login/qr') + '?session_id=' + encodeURIComponent(this.wechatLoginSessionId) + '&ts=' + Date.now() : '/api/wechat/api/accounts/login/qr?session_id=' + encodeURIComponent(this.wechatLoginSessionId) + '&ts=' + Date.now();
        img.addEventListener('error', () => {
            qrContainer.innerHTML = '<div style="color:var(--disabled-color, #777);font-size:13px;">Unable to load WeChat QR code. Refresh the page or retry.</div>';
        });
        qrContainer.appendChild(img);
    }

    _startWechatLoginStatusPolling() {
        this._stopWechatLoginFlow();
        if (!this.wechatLoginSessionId) {
            return;
        }
        this.wechatLoginStatusPolling = setInterval(() => {
            this._pollWechatLoginStatus().catch(err => {
                console.warn('ConnectorsTab: WeChat login status poll failed', err);
            });
        }, 3000);
    }

    async _pollWechatLoginStatus() {
        if (this.wechatLoginModalDismissed || !this.wechatLoginSessionId) {
            return;
        }
        try {
            const apiUrl = window.wechatConnector ? window.wechatConnector.getProxyApiPath('/api/accounts/login/status') : '/api/wechat/api/accounts/login/status';
            const url = apiUrl + '?session_id=' + encodeURIComponent(this.wechatLoginSessionId);
            //console.info('ConnectorsTab: polling WeChat login status', { url });
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) {
                console.warn('ConnectorsTab: login status poll returned non-ok', { status: res.status, url });
                if (res.status === 404) {
                    this._setWechatLoginModalStatus('WeChat login session not found. Restarting login flow...');
                    await this._startWechatLoginFlow();
                }
                return;
            }
            const data = await res.json();
            //console.info('ConnectorsTab: WeChat login status response', data);
            const statusText = String(data.status || '').trim();
            if (data.error) {
                this._setWechatLoginModalStatus('WeChat login error: ' + data.error);
                this._stopWechatLoginFlow();
                return;
            }
            if (statusText && statusText !== this.wechatLoginCurrentStatus) {
                this._setWechatLoginModalStatus('Login status: ' + statusText.replace(/_/g, ' '));
            }
            const accountId = String(data.account_id || data.ilink_bot_id || data.ilinkBotId || '').trim();
            const loginToken = String(data.bot_token || data.token || data.botToken || '').trim();
            const baseUrl = String(data.base_url || data.baseUrl || data.baseurl || data.baseURL || '').trim();
            const hasWechatCredentials = Boolean(accountId) && Boolean(loginToken) && Boolean(baseUrl);
            const completedStatuses = ['completed', 'connected', 'confirmed'];
            const isLoggedIn = completedStatuses.includes(statusText.toLowerCase()) && hasWechatCredentials;
            if (isLoggedIn) {
                const payloadToSave = {
                    ...data,
                    account_id: accountId,
                    bot_token: loginToken,
                    base_url: baseUrl
                };
                //console.info('ConnectorsTab: WeChat login successful, saving persisted account data', payloadToSave);
                await this._persistWechatAccountAfterLogin(payloadToSave);
                this._setWechatLoginModalStatus('WeChat login completed. Refreshing status...');
                this._stopWechatLoginFlow();
                await this.refreshWechatPairButton({ check: true });
                this.wechatIsPaired = true;
                this.wechatHasSavedAccount = true;
                this.setWechatPairButtonState(true);
                this._closeWechatLoginModal();
                return;
            }
        } catch (err) {
            console.warn('ConnectorsTab: _pollWechatLoginStatus error', err);
        }
    }

    _stopWechatLoginFlow() {
        if (this.wechatLoginStatusPolling) {
            clearInterval(this.wechatLoginStatusPolling);
            this.wechatLoginStatusPolling = null;
        }
    }

    _closeWechatLoginModal() {
        this.wechatLoginModalDismissed = true;
        this._stopWechatLoginFlow();
        if (window.wechatConnector && typeof window.wechatConnector.closeLoginModal === 'function') {
            window.wechatConnector.closeLoginModal();
            return;
        }
        const modal = document.getElementById('wx-pair-modal');
        if (modal && document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    }

    _beginWhatsappRequestGeneration() {
        this.whatsappManualStopRequested = false;
        this.whatsappRequestGeneration += 1;
        return this.whatsappRequestGeneration;
    }

    _setWhatsappFreshPairRequested(isFreshPair) {
        this.whatsappFreshPairRequested = !!isFreshPair;
        if (!this.whatsappFreshPairRequested) {
            this.whatsappFreshPairDeviceId = null;
        }
    }

    _getWhatsappStopRequestUrl() {
        const stopParams = this._appendWhatsappUserScope(new URLSearchParams({ stop: 'true' }));
        return '/api/whatsapp/qr?' + stopParams.toString();
    }

    async _requestWhatsappServerStop(options = {}) {
        const { keepalive = false } = options;
        const stopUrl = this._getWhatsappStopRequestUrl();
        const headers = this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' });
        return fetch(stopUrl, {
            method: 'POST',
            headers,
            keepalive: !!keepalive
        });
    }

    _teardownWhatsappPairModalUi() {
        this.whatsappPairModalDismissed = true;
        this.closeWhatsappPairModal();
        try {
            if (this._currentQrObjectUrl) {
                URL.revokeObjectURL(this._currentQrObjectUrl);
                this._currentQrObjectUrl = null;
            }
        } catch (_) {}
        this.stopPolling();
        this.stopWhatsappModalCountdown();
        this.clearWhatsappQrCountdown();
    }

    async _cancelWhatsappPairingAndStopServer(source = 'modal-close') {
        /*console.log('ConnectorsTab: _cancelWhatsappPairingAndStopServer', {
            source,
            serverStarted: this.serverStarted,
            serverStarting: this.serverStarting,
            serverStopping: this.serverStopping,
            isPaired: this.isPaired
        });*/

        this._teardownWhatsappPairModalUi();

        if (this.serverStarted || this.serverStarting || this.serverStopping) {
            await this.stopWhatsappServer();
            return;
        }

        this.setWhatsappPairButtonState(this.isPaired);
    }

    _handleWhatsappPairingWindowClose() {
        if (!(this.serverStarted || this.serverStarting || this.serverStopping)) {
            return;
        }

        const modal = document.getElementById('wa-pair-modal');
        if (modal && !this.isPaired) {
            this.whatsappPairModalDismissed = true;
        }
        this.whatsappWebsocketShouldReconnect = false;
        this.stopPolling();
        this.stopWhatsappModalCountdown();

        const stopUrl = this._getWhatsappStopRequestUrl();
        try {
            if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
                navigator.sendBeacon(stopUrl, new Blob([], { type: 'application/json' }));
                return;
            }
        } catch (_) {}

        try {
            fetch(stopUrl, {
                method: 'POST',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' }),
                keepalive: true
            }).catch(() => {});
        } catch (_) {}
    }

    _handleWechatPairingWindowClose() {
        if (!(this.wechatServerStarted || this.wechatServerStarting || this.wechatServerStopping)) {
            return;
        }

        this.wechatLoginModalDismissed = true;
        this._stopWechatLoginFlow();

        const stopUrl = '/api/wechat/stop';
        try {
            if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
                navigator.sendBeacon(stopUrl, new Blob([], { type: 'application/json' }));
                return;
            }
        } catch (_) {}

        try {
            fetch(stopUrl, {
                method: 'POST',
                keepalive: true
            }).catch(() => {});
        } catch (_) {}
    }

    _getWhatsappSelectedModel() {
        const modelSelector = document.getElementById('model-selector');
        return modelSelector && modelSelector.value ? String(modelSelector.value).trim() : '';
    }

    _ensureWhatsappModelSelected() {
        const selectedModel = this._getWhatsappSelectedModel();
        if (selectedModel) {
            return true;
        }

        const errorMsg = (window.Lang && typeof Lang.get === 'function' && Lang.get('whatsappNoModelSelected')) || 'No AI model selected, please select a model in Chat Tab first.';
        this.setWhatsappPairButtonState(false);
        this._showNoModelSelectedModal(errorMsg);
        return false;
    }

    _getWhatsappUserScopedHeaders(extraHeaders = null) {
        const headers = { ...(extraHeaders || {}) };
        const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
        if (hashedMasterKey) {
            headers['X-Paiperwork-User'] = hashedMasterKey;
        }
        return headers;
    }

    _appendWhatsappUserScope(params) {
        const resolvedParams = params instanceof URLSearchParams ? params : new URLSearchParams(params || '');
        const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
        if (hashedMasterKey) {
            resolvedParams.set('user', hashedMasterKey);
        }
        return resolvedParams;
    }

    _resolveWhatsappEventDeviceId(payload) {
        if (!payload || typeof payload !== 'object') {
            return '';
        }

        const result = payload.result && typeof payload.result === 'object'
            ? payload.result
            : (payload.Result && typeof payload.Result === 'object' ? payload.Result : null);
        const directDeviceId = String(payload.device_id || payload.deviceId || '').trim();
        if (directDeviceId) {
            return directDeviceId;
        }
        if (result) {
            const resultDeviceId = String(result.device_id || result.deviceId || '').trim();
            const jid = String(result.jid || result.JID || '').trim();

            // Keep the exact paired device variant (for example "861...:65@s.whatsapp.net")
            // when it belongs to the same WhatsApp identity as the JID. This preserves
            // the user's modal selection in multi-device setups while still allowing a
            // fallback to jid when older payloads only expose a transient placeholder id.
            if (resultDeviceId) {
                const normalizedResultDeviceId = this._normalizeWhatsappDeviceIdentity(resultDeviceId);
                const normalizedJid = this._normalizeWhatsappDeviceIdentity(jid);
                if (!jid || (normalizedResultDeviceId && normalizedResultDeviceId === normalizedJid)) {
                    return resultDeviceId;
                }
            }
            if (jid) {
                return jid;
            }
            return resultDeviceId;
        }
        return '';
    }

    _normalizeWhatsappDeviceIdentity(deviceId) {
        const value = String(deviceId || '').trim().toLowerCase();
        if (!value) {
            return '';
        }

        const withoutDomain = value.includes('@') ? value.split('@')[0] : value;
        return withoutDomain.includes(':') ? withoutDomain.split(':')[0] : withoutDomain;
    }

    _getWhatsappDeviceAccountKey(deviceId = '', metadata = null) {
        const entry = metadata && typeof metadata === 'object' ? metadata : {};
        const candidate = String(
            entry.phone_number
            || entry.phoneNumber
            || entry.jid
            || entry.JID
            || deviceId
            || ''
        ).trim();
        if (!candidate) {
            return '';
        }

        const normalized = this._normalizeWhatsappDeviceIdentity(candidate);
        return normalized || candidate.toLowerCase();
    }

    _getWhatsappDeviceCatalogRank(entry) {
        const deviceId = String(entry && entry.deviceId || '').trim();
        const state = String(entry && entry.state || '').trim().toLowerCase();
        let rank = 0;

        if (deviceId.includes('@') && deviceId.includes(':')) {
            rank += 4;
        } else if (deviceId.includes('@')) {
            rank += 2;
        }
        if (state === 'logged_in') {
            rank += 1;
        }

        return rank;
    }

    _isWhatsappPairedDeviceId(deviceId) {
        const resolvedDeviceId = String(deviceId || '').trim();
        return !!(resolvedDeviceId && resolvedDeviceId.includes('@') && resolvedDeviceId.includes(':'));
    }

    _shouldReplaceWhatsappDeviceCatalogEntry(existingEntry, nextEntry) {
        if (!existingEntry) {
            return true;
        }
        if (!nextEntry) {
            return false;
        }

        const existingRank = this._getWhatsappDeviceCatalogRank(existingEntry);
        const nextRank = this._getWhatsappDeviceCatalogRank(nextEntry);
        if (nextRank !== existingRank) {
            return nextRank > existingRank;
        }

        const existingSavedAt = String(existingEntry.savedAt || existingEntry.created_at || '').trim();
        const nextSavedAt = String(nextEntry.savedAt || nextEntry.created_at || '').trim();
        return !!nextSavedAt && nextSavedAt >= existingSavedAt;
    }

    _matchesWhatsappDeviceReference(entry, deviceId = '', metadata = null) {
        const candidateDeviceId = String(entry && entry.deviceId || '').trim();
        const resolvedDeviceId = String(deviceId || '').trim();
        if (!candidateDeviceId || !resolvedDeviceId && !metadata) {
            return false;
        }

        if (resolvedDeviceId && candidateDeviceId === resolvedDeviceId) {
            return true;
        }

        const resolvedIsPaired = this._isWhatsappPairedDeviceId(resolvedDeviceId);
        const candidateIsPaired = this._isWhatsappPairedDeviceId(candidateDeviceId);
        if (resolvedDeviceId && candidateDeviceId && resolvedIsPaired && candidateIsPaired) {
            // Different paired WhatsApp device IDs must not be treated as the same device
            // just because they share the same account metadata (same phone/jid).
            return false;
        }

        const normalizedReference = this._normalizeWhatsappDeviceIdentity(resolvedDeviceId);
        return !!(normalizedReference && normalizedReference === this._normalizeWhatsappDeviceIdentity(candidateDeviceId));
    }

    _findBestWhatsappDeviceCatalogEntry(entries = [], deviceId = '', metadata = null) {
        const matches = (Array.isArray(entries) ? entries : [])
            .filter(entry => this._matchesWhatsappDeviceReference(entry, deviceId, metadata));
        if (!matches.length) {
            return null;
        }

        return matches.sort((left, right) => this._getWhatsappDeviceCatalogRank(right) - this._getWhatsappDeviceCatalogRank(left))[0] || null;
    }

    _matchesWhatsappDeviceMetadataIdentity(entry, metadata = null) {
        if (!entry || !metadata || typeof metadata !== 'object') {
            return false;
        }

        const normalizedMetaPhone = this._normalizeWhatsappDeviceIdentity(metadata.phone_number || metadata.phoneNumber || '');
        const normalizedMetaJid = this._normalizeWhatsappDeviceIdentity(metadata.jid || metadata.JID || '');
        if (!normalizedMetaPhone && !normalizedMetaJid) {
            return false;
        }

        const candidatePhone = this._normalizeWhatsappDeviceIdentity(entry.phone_number);
        const candidateJid = this._normalizeWhatsappDeviceIdentity(entry.jid);
        return !!(
            (normalizedMetaPhone && (candidatePhone === normalizedMetaPhone || candidateJid === normalizedMetaPhone))
            || (normalizedMetaJid && (candidatePhone === normalizedMetaJid || candidateJid === normalizedMetaJid))
        );
    }

    _resolvePersistableWhatsappEventDeviceId(payload) {
        const result = payload && payload.result && typeof payload.result === 'object'
            ? payload.result
            : (payload && payload.Result && typeof payload.Result === 'object' ? payload.Result : {});
        const directPayloadDeviceId = String(payload && (payload.device_id || payload.deviceId) || '').trim();
        const directResultDeviceId = String(result && (result.device_id || result.deviceId) || '').trim();
        const resolvedEventDeviceId = String(this._resolveWhatsappEventDeviceId(payload) || '').trim();

        if (this._isWhatsappPairedDeviceId(directPayloadDeviceId)) {
            return directPayloadDeviceId;
        }
        if (this._isWhatsappPairedDeviceId(directResultDeviceId)) {
            return directResultDeviceId;
        }
        if (this._isWhatsappPairedDeviceId(resolvedEventDeviceId)) {
            return resolvedEventDeviceId;
        }

        return '';
    }

    _resolveWhatsappRuntimeEventDeviceId(payload) {
        if (!payload || typeof payload !== 'object') {
            return '';
        }

        const result = payload.result && typeof payload.result === 'object'
            ? payload.result
            : (payload.Result && typeof payload.Result === 'object' ? payload.Result : {});

        return String(
            payload.device_id
            || payload.deviceId
            || result.device_id
            || result.deviceId
            || ''
        ).trim();
    }

    async _migrateSavedWhatsappSessionBundle(sourceDeviceIds = [], targetDeviceId = '') {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        const resolvedTargetDeviceId = String(targetDeviceId || '').trim();
        if (!hashedMasterKey || !resolvedTargetDeviceId) {
            return false;
        }

        try {
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasGetFn = dbHandle && typeof dbHandle.getWhatsappSessionBundle === 'function';
            const hasSaveFn = dbHandle && typeof dbHandle.saveWhatsappSessionBundle === 'function';
            const hasClearFn = dbHandle && typeof dbHandle.clearWhatsappSessionBundle === 'function';
            if (!hasGetFn || !hasSaveFn || !hasClearFn) {
                return false;
            }

            const uniqueSourceIds = [...new Set((Array.isArray(sourceDeviceIds) ? sourceDeviceIds : [])
                .map(deviceId => String(deviceId || '').trim())
                .filter(deviceId => deviceId && deviceId !== resolvedTargetDeviceId))];
            if (!uniqueSourceIds.length) {
                return false;
            }

            let targetBundle = await dbHandle.getWhatsappSessionBundle(hashedMasterKey, resolvedTargetDeviceId);
            let migrated = false;

            for (const sourceDeviceId of uniqueSourceIds) {
                const sourceBundle = await dbHandle.getWhatsappSessionBundle(hashedMasterKey, sourceDeviceId);
                if (sourceBundle && sourceBundle.session && typeof sourceBundle.session === 'object' && !targetBundle) {
                    await dbHandle.saveWhatsappSessionBundle(hashedMasterKey, resolvedTargetDeviceId, sourceBundle.session, {
                        ...(sourceBundle.metadata && typeof sourceBundle.metadata === 'object' ? sourceBundle.metadata : {}),
                        migratedFrom: sourceDeviceId,
                        migratedAt: new Date().toISOString()
                    });
                    targetBundle = sourceBundle;
                    migrated = true;
                }

                await dbHandle.clearWhatsappSessionBundle(hashedMasterKey, sourceDeviceId);
            }

            if (migrated) {
                /*console.log('ConnectorsTab: migrated whatsapp session bundle to canonical device', {
                    targetDeviceId: resolvedTargetDeviceId,
                    sourceDeviceIds: uniqueSourceIds
                });*/
            }

            return migrated;
        } catch (err) {
            console.warn('ConnectorsTab: _migrateSavedWhatsappSessionBundle failed', err);
            return false;
        }
    }

    _shouldAcceptWhatsappLoginEventDevice(payload) {
        const resolvedEventDeviceId = String(this._resolveWhatsappEventDeviceId(payload) || '').trim();
        if (!resolvedEventDeviceId) {
            return true;
        }

        // Fresh-pair flows intentionally create a new device that may not match
        // the currently selected saved device. Do not reject the successful
        // LOGIN_SUCCESS/LOGGED_IN event against stale restore selection state.
        if (this.whatsappFreshPairRequested) {
            return true;
        }

        const selectedDeviceId = String(this.savedWhatsappDeviceId || '').trim();
        if (!selectedDeviceId) {
            return true;
        }

        const result = payload && payload.result && typeof payload.result === 'object'
            ? payload.result
            : (payload && payload.Result && typeof payload.Result === 'object' ? payload.Result : {});
        const selectedEntry = this._findBestWhatsappDeviceCatalogEntry(this.savedWhatsappDevices, selectedDeviceId) || { deviceId: selectedDeviceId };
        const selectedAccountKey = this._getWhatsappDeviceAccountKey(selectedDeviceId, selectedEntry);
        const eventAccountKey = this._getWhatsappDeviceAccountKey(resolvedEventDeviceId, result);

        if (selectedAccountKey && eventAccountKey) {
            return selectedAccountKey === eventAccountKey;
        }

        return this._normalizeWhatsappDeviceIdentity(selectedDeviceId) === this._normalizeWhatsappDeviceIdentity(resolvedEventDeviceId);
    }

    async _persistWhatsappDeviceFromLoginEvent(payload) {
        const runtimeDeviceId = this._resolveWhatsappRuntimeEventDeviceId(payload);
        const persistDeviceId = this._resolvePersistableWhatsappEventDeviceId(payload);
        const targetDeviceId = String(persistDeviceId || runtimeDeviceId || '').trim();
        if (!targetDeviceId) {
            return false;
        }

        const result = payload && payload.result && typeof payload.result === 'object'
            ? payload.result
            : (payload && payload.Result && typeof payload.Result === 'object' ? payload.Result : {});
        const rawJid = String(result.jid || result.JID || persistDeviceId || targetDeviceId || '').trim();
        const phoneNumber = String(result.phone_number || result.phoneNumber || '').trim() || this._normalizeWhatsappDeviceIdentity(rawJid);
        const displayName = String(
            result.display_name
            || result.displayName
            || result.push_name
            || result.pushName
            || ''
        ).trim();

        const metadata = { state: 'logged_in' };
        if (phoneNumber) {
            metadata.phone_number = phoneNumber;
        }
        if (displayName) {
            metadata.display_name = displayName;
        }
        if (rawJid) {
            metadata.jid = rawJid;
        }

        return this._upsertSavedWhatsappDevice(targetDeviceId, metadata, { select: true });
    }

    _resolveSavedWhatsappCatalogDeviceId(deviceId = null) {
        const requested = String(deviceId || '').trim();
        if (!requested) {
            const runtimeSelected = String(this.savedWhatsappDeviceId || '').trim();
            return this._isWhatsappPairedDeviceId(runtimeSelected) ? runtimeSelected : '';
        }

        if (Array.isArray(this.savedWhatsappDevices)) {
            const directMatch = this.savedWhatsappDevices.find(entry => String(entry && entry.deviceId || '').trim() === requested);
            const bestMatch = this._findBestWhatsappDeviceCatalogEntry(this.savedWhatsappDevices, requested, directMatch || null);
            if (bestMatch && bestMatch.deviceId) {
                return String(bestMatch.deviceId).trim();
            }

            const normalizedRequested = this._normalizeWhatsappDeviceIdentity(requested);
            if (normalizedRequested) {
                const identityMatch = this.savedWhatsappDevices.find(entry => {
                    return this._normalizeWhatsappDeviceIdentity(entry && entry.deviceId) === normalizedRequested;
                });
                if (identityMatch && identityMatch.deviceId) {
                    return String(identityMatch.deviceId).trim();
                }
            }
        }

        return this._isWhatsappPairedDeviceId(requested) ? requested : '';
    }

    _sameWhatsappDeviceCatalogEntries(left, right) {
        const normalize = (entries) => {
            const list = Array.isArray(entries) ? entries : [];
            return list
                .map(entry => this._sanitizeWhatsappDeviceCatalogEntry(entry))
                .filter(Boolean)
                .map(entry => `${entry.deviceId}|${entry.display_name}|${entry.phone_number}|${entry.state}|${entry.created_at}`)
                .sort();
        };

        const normalizedLeft = normalize(left);
        const normalizedRight = normalize(right);
        if (normalizedLeft.length !== normalizedRight.length) {
            return false;
        }

        return normalizedLeft.every((value, index) => value === normalizedRight[index]);
    }

    _hasMultipleSavedWhatsappDevices() {
        return Array.isArray(this.savedWhatsappDevices) && this.savedWhatsappDevices.length > 1;
    }

    _resolveSavedWhatsappPersistableDeviceId(deviceId = null) {
        const requested = String(deviceId || '').trim();
        const resolvedCatalogDeviceId = this._resolveSavedWhatsappCatalogDeviceId(requested);
        if (this._isWhatsappPairedDeviceId(resolvedCatalogDeviceId)) {
            return resolvedCatalogDeviceId;
        }

        const savedEntries = Array.isArray(this.savedWhatsappDevices) ? this.savedWhatsappDevices : [];
        const savedEntry = savedEntries.find(entry => String(entry && entry.deviceId || '').trim() === requested)
            || savedEntries.find(entry => String(entry && entry.deviceId || '').trim() === resolvedCatalogDeviceId)
            || null;
        if (savedEntry) {
            const pairedMetadataMatch = savedEntries.find(entry => {
                const candidateDeviceId = String(entry && entry.deviceId || '').trim();
                return this._isWhatsappPairedDeviceId(candidateDeviceId)
                    && this._matchesWhatsappDeviceMetadataIdentity(entry, savedEntry);
            });
            if (pairedMetadataMatch && pairedMetadataMatch.deviceId) {
                return String(pairedMetadataMatch.deviceId).trim();
            }
        }

        const normalizedRequested = this._normalizeWhatsappDeviceIdentity(requested || resolvedCatalogDeviceId);
        if (!normalizedRequested || !savedEntries.length) {
            return '';
        }

        const pairedMatch = savedEntries.find(entry => {
            const candidateDeviceId = String(entry && entry.deviceId || '').trim();
            if (!this._isWhatsappPairedDeviceId(candidateDeviceId)) {
                return false;
            }
            return this._normalizeWhatsappDeviceIdentity(candidateDeviceId) === normalizedRequested
                || this._normalizeWhatsappDeviceIdentity(entry && entry.jid) === normalizedRequested
                || this._normalizeWhatsappDeviceIdentity(entry && entry.phone_number) === normalizedRequested;
        });

        return pairedMatch && pairedMatch.deviceId ? String(pairedMatch.deviceId).trim() : '';
    }

    _resolveSavedWhatsappStartupDeviceId(deviceId = null) {
        const persistableDeviceId = this._resolveSavedWhatsappPersistableDeviceId(deviceId);
        if (persistableDeviceId) {
            return persistableDeviceId;
        }

        const requested = String(deviceId || '').trim();
        const resolvedCatalogDeviceId = this._resolveSavedWhatsappCatalogDeviceId(requested);
        const fallbackDeviceId = String(resolvedCatalogDeviceId || requested || '').trim();
        if (!fallbackDeviceId) {
            return '';
        }

        const savedEntries = Array.isArray(this.savedWhatsappDevices) ? this.savedWhatsappDevices : [];
        const matchingEntry = savedEntries.find(entry => {
            const candidateDeviceId = String(entry && entry.deviceId || '').trim();
            return candidateDeviceId === fallbackDeviceId
                || this._matchesWhatsappDeviceReference(entry, fallbackDeviceId)
                || this._matchesWhatsappDeviceMetadataIdentity(entry, { deviceId: fallbackDeviceId });
        });

        return matchingEntry && matchingEntry.deviceId ? String(matchingEntry.deviceId).trim() : fallbackDeviceId;
    }

    async _syncWhatsappLoginSuccessToServer(deviceOrPayload = null, maxAttempts = 6) {
        const payload = deviceOrPayload && typeof deviceOrPayload === 'object' ? deviceOrPayload : null;
        const payloadPersistDeviceId = payload ? this._resolvePersistableWhatsappEventDeviceId(payload) : '';
        const explicitDeviceId = typeof deviceOrPayload === 'string' ? String(deviceOrPayload || '').trim() : '';
        const resolvedSavedDeviceId = this._resolveSavedWhatsappCatalogDeviceId(this.savedWhatsappDeviceId || '');
        const resolvedDeviceId = String(
            payloadPersistDeviceId
            || explicitDeviceId
            || resolvedSavedDeviceId
            || ''
        ).trim();
        const result = payload && payload.result && typeof payload.result === 'object'
            ? payload.result
            : (payload && payload.Result && typeof payload.Result === 'object' ? payload.Result : null);
        const resolvedPhoneNumber = String(
            (result && (result.phone_number || result.phoneNumber))
            || (payload && (payload.phone_number || payload.phoneNumber))
            || ''
        ).trim();

        if (!resolvedDeviceId || !this._isWhatsappPairedDeviceId(resolvedDeviceId)) {
            return false;
        }

        const sendDbSync = async () => {
            const syncPayload = {};
            if (resolvedDeviceId) {
                syncPayload.device_id = resolvedDeviceId;
            }
            if (resolvedPhoneNumber) {
                syncPayload.phone_number = resolvedPhoneNumber;
            }
            await fetch('/api/whatsapp/db-sync', {
                method: 'POST',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(syncPayload)
            });
        };

        try {
            await sendDbSync();
        } catch (syncErr) {
            console.warn('ConnectorsTab: immediate whatsapp db-sync after login failed', syncErr);
        }

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
                const params = this._appendWhatsappUserScope(new URLSearchParams({ check: 'true' }));
                if (resolvedDeviceId) {
                    params.set('device_id', resolvedDeviceId);
                }

                const response = await fetch(`/api/whatsapp/qr?${params.toString()}`, {
                    headers: this._getWhatsappUserScopedHeaders(),
                    cache: 'no-store'
                });

                if (response.ok) {
                    const data = await response.json().catch(() => null);
                    if (data && data.loggedIn) {
                        try {
                            await sendDbSync();
                        } catch (syncErr) {
                            console.warn('ConnectorsTab: whatsapp db-sync after login failed', syncErr);
                        }
                        return true;
                    }
                }
            } catch (err) {
                console.warn('ConnectorsTab: post-login whatsapp sync failed', { attempt, err });
            }

            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return false;
    }

    async _syncSavedWhatsappCatalogToServer() {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!hashedMasterKey) {
            return false;
        }

        let devices = Array.isArray(this.savedWhatsappDevices) ? this.savedWhatsappDevices : [];
        let selectedDeviceId = String(this.savedWhatsappDeviceId || '').trim();
        let loadedFromInfo = false;

        if (!devices.length) {
            const info = await this._loadSavedWhatsappDeviceInfo();
            const normalized = this._normalizeWhatsappDeviceCatalog(info);
            devices = Array.isArray(normalized.devices) ? normalized.devices : [];
            loadedFromInfo = true;
            if (!selectedDeviceId) {
                selectedDeviceId = String(normalized.selectedDeviceId || '').trim();
            }
        }

        const rawDevices = devices.map(entry => ({
            deviceId: String(entry && entry.deviceId || '').trim(),
            jid: String(entry && entry.jid || '').trim(),
            phone_number: String(entry && entry.phone_number || '').trim(),
            display_name: String(entry && entry.display_name || '').trim(),
            state: String(entry && entry.state || '').trim(),
            created_at: String(entry && entry.created_at || '').trim()
        }));

        const persistedDevices = rawDevices;

        const resolvedSelectedDeviceId = this._resolveSavedWhatsappStartupDeviceId(selectedDeviceId);
        /* console.info('ConnectorsTab: syncing saved WhatsApp catalog to server before startup', {
            selectedDeviceId,
            resolvedSelectedDeviceId,
            totalSavedDevices: Array.isArray(devices) ? devices.length : 0,
            persistedDevicesCount: persistedDevices.length,
            persistedDeviceIds: persistedDevices.map(entry => entry.deviceId)
        }); */

        await fetch('/api/whatsapp/db-sync', {
            method: 'POST',
            headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                selected_device_id: resolvedSelectedDeviceId,
                devices: persistedDevices,
                debug_total_devices: rawDevices.length,
                debug_loaded_from_info: loadedFromInfo,
                debug_filtered_non_persistable: Math.max(0, rawDevices.length - persistedDevices.length),
                debug_raw_device_ids: rawDevices.map(entry => entry.deviceId)
            })
        });

        return true;
    }

    _isWhatsappRequestActive(requestGeneration, allowDuringManualStop = false) {
        if (typeof requestGeneration === 'number' && requestGeneration !== this.whatsappRequestGeneration) {
            return false;
        }
        if (!allowDuringManualStop && this.whatsappManualStopRequested) {
            return false;
        }
        return true;
    }

    _cancelWhatsappAsyncWork({ manualStop = false } = {}) {
        if (manualStop) {
            this.whatsappManualStopRequested = true;
        }

        this.whatsappRequestGeneration += 1;

        if (this.whatsappQrRetryTimeout) {
            clearTimeout(this.whatsappQrRetryTimeout);
            this.whatsappQrRetryTimeout = null;
        }

        if (this.whatsappPendingFetchControllers && this.whatsappPendingFetchControllers.size) {
            for (const controller of Array.from(this.whatsappPendingFetchControllers)) {
                try {
                    controller.abort();
                } catch (_) {}
            }
            this.whatsappPendingFetchControllers.clear();
        }
    }

    _clearWhatsappRestartCooldownTimer() {
        if (this.whatsappRestartCooldownTimer) {
            clearTimeout(this.whatsappRestartCooldownTimer);
            this.whatsappRestartCooldownTimer = null;
        }
    }

    _isWhatsappRestartBlocked() {
        return !!(this.whatsappRestartBlockedUntil && Date.now() < this.whatsappRestartBlockedUntil);
    }

    _isWhatsappPairNewDeviceBlocked() {
        return !!(
            this.serverStarted
            ||
            this.serverStopping
            || this.serverStarting
            || this._isWhatsappRestartBlocked()
        );
    }

    _isWhatsappStoppedServerActionBlocked() {
        return !!(
            this.serverStarted
            || this.serverStopping
            || this.serverStarting
            || this._isWhatsappRestartBlocked()
        );
    }

    _setWhatsappRestartBlocked(ms = 0) {
        this._clearWhatsappRestartCooldownTimer();
        if (!(ms > 0)) {
            this.whatsappRestartBlockedUntil = 0;
            return;
        }

        this.whatsappRestartBlockedUntil = Date.now() + ms;
        this.whatsappRestartCooldownTimer = setTimeout(() => {
            this.whatsappRestartCooldownTimer = null;
            this.whatsappRestartBlockedUntil = 0;
            this.setWhatsappPairButtonState(this.isPaired);
        }, ms);
    }

    _handleWhatsappManualStopInProgress(message = 'Manual stop in progress') {
        this.serverStarted = false;
        this.serverStarting = false;
        this.serverStopping = false;
        this.isPaired = false;
        this._setWhatsappFreshPairRequested(false);
        this._setWhatsappRestartBlocked(5000);
        this.closeWhatsappPairModal();
        this.stopPolling();
        this.stopWhatsappModalCountdown();
        this.clearWhatsappQrCountdown();
        this.setWhatsappPairButtonState(false);
        this.setWhatsappModalStatus(message);
    }

    _getWhatsappRemoteLogoutWarningMessage() {
        return (window.Lang && typeof Lang.get === 'function' && Lang.get('whatsappRemoteLogoutRestartWarning'))
            || 'This WhatsApp device was removed from your phone. Start the server again to reconnect the next saved device or create a fresh pairing.';
    }

    async _handleWhatsappRemoteLogout(eventDeviceId = null, { force = false } = {}) {
        const resolvedDeviceId = String(eventDeviceId || this.savedWhatsappDeviceId || '').trim();
        const noticeKey = resolvedDeviceId || 'remote_logout';
        if (!force && this.whatsappRemoteLogoutNoticeShown === noticeKey) {
            return;
        }
        this.whatsappRemoteLogoutNoticeShown = noticeKey;
        this.whatsappRemoteLogoutActive = true;

        try {
            await this._forgetSavedWhatsappDeviceAfterUnpair(resolvedDeviceId || null, 'event-remote_logout');
        } catch (err) {
            console.warn('ConnectorsTab: failed to forget saved device after REMOTE_LOGOUT', err);
        }

        this.serverStarted = false;
        this.serverStarting = false;
        this.serverStopping = false;
        this.isPaired = false;
        this._setWhatsappFreshPairRequested(false);
        this._cancelWhatsappAsyncWork();
        this.stopWhatsappWebsocketListener();
        this._teardownWhatsappPairModalUi();
        this.setWhatsappPairButtonState(false);
        this.setWhatsappModalStatus(this._getWhatsappRemoteLogoutWarningMessage());

        if (typeof window.alert === 'function') {
            window.alert(this._getWhatsappRemoteLogoutWarningMessage());
        }
    }

    _getWhatsappQrSignature(data, qrUrl) {
        const normalizedQr = String(qrUrl || '').trim();
        const qrTimestamp = Number(data && data.qrTimestamp);
        if (normalizedQr && Number.isFinite(qrTimestamp) && qrTimestamp > 0) {
            return `${normalizedQr}::${qrTimestamp}`;
        }
        return normalizedQr;
    }

    _syncWhatsappQrTTL(data = null) {
        const qrDuration = Number(data && data.qrDuration);
        if (Number.isFinite(qrDuration) && qrDuration > 0) {
            this.whatsappQrTTL = qrDuration * 1000;
            return;
        }

        if (!(this.whatsappQrTTL > 0)) {
            this.whatsappQrTTL = 20000;
        }
    }

    _getWhatsappQrIssuedAt(data = null) {
        const qrTimestamp = Number(data && data.qrTimestamp);
        if (Number.isFinite(qrTimestamp) && qrTimestamp > 0) {
            return qrTimestamp;
        }

        return Date.now();
    }

    _logWhatsappQrUpdate(kind, data = null, qrUrl = '') {
        const payload = {
            kind: String(kind || 'update'),
            qrTimestamp: Number(data && data.qrTimestamp) || 0,
            qrDuration: Number(data && data.qrDuration) || 0,
            qrSource: String(qrUrl || '').startsWith('data:') ? 'data-url' : 'proxy-url'
        };

        //console.info('ConnectorsTab: WhatsApp QR update', payload);
    }

    setWhatsappPairButtonState(isPaired) {
        //console.log('ConnectorsTab: setWhatsappPairButtonState', { isPaired });
        if (!this.whatsappButton) {
            console.warn('ConnectorsTab: setWhatsappPairButtonState called but whatsappButton is null');
            return;
        }
        this.isPaired = isPaired;
        this.whatsappButton.dataset.whatsappPaired = isPaired ? 'true' : 'false';
        this.whatsappButton.style.height = '56px';
        this.whatsappButton.style.minHeight = '56px';

        // Initialize QR countdown timer state
        if (typeof this.whatsappQrTTL === 'undefined') {
            this.whatsappQrTTL = 20000;
        }
        if (typeof this.qrCountdownTimer === 'undefined') {
            this.qrCountdownTimer = null;
        }
        this.whatsappButton.style.padding = '0 16px';
        this.whatsappButton.style.borderRadius = '8px';
        this.whatsappButton.style.fontWeight = '600';

        const statusCard = document.getElementById('whatsapp-status-card');
        if (statusCard) {
            if (this.serverStarted) {
                if (isPaired) {
                    const pairedLabel = (Lang.get('whatsappPairedCard') || 'WhatsApp paired');
                    const connectedPhoneNumber = this._getWhatsappPairedStatusPhoneNumber();
                    if (connectedPhoneNumber) {
                        statusCard.innerHTML = `${pairedLabel}<br><span style="display:block;font-size:12px;font-weight:500;opacity:0.85;margin-top:2px;">${this._escapeHtml(connectedPhoneNumber)}</span>`;
                    } else {
                        statusCard.textContent = pairedLabel;
                    }
                } else {
                    statusCard.textContent = (Lang.get('whatsappNotPairedCard') || 'WhatsApp not paired');
                }
            } else {
                statusCard.textContent = (Lang.get('whatsappNotPairedCard') || 'WhatsApp not paired');
            }
        }

        if (this.serverStopping) {
            this.whatsappButton.textContent = 'Stopping the server...';
            this.whatsappButton.title = 'Stopping the server...';
            this.whatsappButton.disabled = true;
        } else if (this.serverStarted) {
            this.whatsappButton.textContent = 'Stop server';
            this.whatsappButton.title = 'Stop server';
            this.whatsappButton.disabled = false;
        } else if (this._isWhatsappRestartBlocked()) {
            this.whatsappButton.textContent = 'Please wait...';
            this.whatsappButton.title = 'Please wait before starting the server again';
            this.whatsappButton.disabled = true;
        } else if (this.serverStarting) {
            this.whatsappButton.textContent = Lang.get('serverStartingButton') || 'Starting server...';
            this.whatsappButton.title = Lang.get('serverStartingButton') || 'Starting server...';
            this.whatsappButton.disabled = true;
        } else {
            this.whatsappButton.textContent = Lang.get('startServerButton') || 'Start server';
            this.whatsappButton.title = Lang.get('startServerButton') || 'Start server';
            this.whatsappButton.disabled = !this.whatsappMode;
        }

        if (this.whatsappButton.disabled) {
            this.whatsappButton.style.backgroundColor = '#c4c4ca';
            this.whatsappButton.style.color = '#575f6b';
            this.whatsappButton.style.cursor = 'not-allowed';
        } else {
            this.whatsappButton.style.backgroundColor = '';
            this.whatsappButton.style.color = '';
            this.whatsappButton.style.cursor = 'pointer';
        }

        if (this.whatsappPairNewDeviceButton) {
            this.whatsappPairNewDeviceButton.style.width = '100%';
            this.whatsappPairNewDeviceButton.style.padding = '12px 16px';
            this.whatsappPairNewDeviceButton.style.borderRadius = '8px';
            this.whatsappPairNewDeviceButton.style.fontWeight = '600';
            this.whatsappPairNewDeviceButton.disabled = this._isWhatsappPairNewDeviceBlocked() || !this.whatsappMode;
            if (this.serverStarted && !this.serverStarting && !this.serverStopping) {
                this.whatsappPairNewDeviceButton.textContent = 'Pair new device';
                this.whatsappPairNewDeviceButton.title = 'Stop the WhatsApp server before pairing a new device';
            } else if (this._isWhatsappRestartBlocked()) {
                this.whatsappPairNewDeviceButton.textContent = 'Please wait...';
                this.whatsappPairNewDeviceButton.title = 'Please wait before pairing a new device';
            } else {
                this.whatsappPairNewDeviceButton.textContent = 'Pair new device';
                this.whatsappPairNewDeviceButton.title = 'Pair a new WhatsApp device';
            }
            if (this.whatsappPairNewDeviceButton.disabled) {
                this.whatsappPairNewDeviceButton.style.backgroundColor = 'var(--button-secondary-disabled-bg, #e5e7eb)';
                this.whatsappPairNewDeviceButton.style.borderColor = 'var(--button-secondary-disabled-border, var(--button-secondary-border, #cbd5e1))';
                this.whatsappPairNewDeviceButton.style.color = 'var(--button-secondary-disabled-text, #6b7280)';
                this.whatsappPairNewDeviceButton.style.cursor = 'not-allowed';
            } else {
                this.whatsappPairNewDeviceButton.style.backgroundColor = 'var(--button-secondary-bg, #f5f5f5)';
                this.whatsappPairNewDeviceButton.style.borderColor = 'var(--button-secondary-border, #cbd5e1)';
                this.whatsappPairNewDeviceButton.style.color = 'var(--button-secondary-text, #333333)';
                this.whatsappPairNewDeviceButton.style.cursor = 'pointer';
            }
        }

        if (this.whatsappDeleteAllPairedButton) {
            this.whatsappDeleteAllPairedButton.style.width = '100%';
            this.whatsappDeleteAllPairedButton.style.padding = '12px 16px';
            this.whatsappDeleteAllPairedButton.style.borderRadius = '8px';
            this.whatsappDeleteAllPairedButton.style.fontWeight = '600';
            const deleteAllDisabled = this._isWhatsappStoppedServerActionBlocked();
            this.whatsappDeleteAllPairedButton.disabled = deleteAllDisabled;
            this.whatsappDeleteAllPairedButton.textContent = (window.Lang && typeof Lang.get === 'function' && Lang.get('whatsappDeleteAllPairedButton')) || 'Delete paired device(s)';
            if (this.serverStarted && !this.serverStarting && !this.serverStopping) {
                this.whatsappDeleteAllPairedButton.title = 'Stop the WhatsApp server before deleting paired device(s)';
            } else if (this._isWhatsappRestartBlocked()) {
                this.whatsappDeleteAllPairedButton.title = 'Please wait before deleting paired device(s)';
            } else {
                this.whatsappDeleteAllPairedButton.title = (window.Lang && typeof Lang.get === 'function' && Lang.get('whatsappDeleteAllPairedButtonTitle')) || 'Delete paired device(s)';
            }
            if (deleteAllDisabled) {
                this.whatsappDeleteAllPairedButton.style.backgroundColor = 'var(--button-secondary-disabled-bg, #e5e7eb)';
                this.whatsappDeleteAllPairedButton.style.borderColor = 'var(--button-secondary-disabled-border, var(--button-secondary-border, #cbd5e1))';
                this.whatsappDeleteAllPairedButton.style.color = 'var(--button-secondary-disabled-text, #6b7280)';
                this.whatsappDeleteAllPairedButton.style.cursor = 'not-allowed';
            } else {
                this.whatsappDeleteAllPairedButton.style.backgroundColor = 'var(--button-secondary-bg, #f5f5f5)';
                this.whatsappDeleteAllPairedButton.style.borderColor = 'var(--button-secondary-border, #cbd5e1)';
                this.whatsappDeleteAllPairedButton.style.color = 'var(--button-secondary-text, #333333)';
                this.whatsappDeleteAllPairedButton.style.cursor = 'pointer';
            }
        }

        if (this.whatsappClearContextsButton) {
            this.whatsappClearContextsButton.style.width = '100%';
            this.whatsappClearContextsButton.style.padding = '12px 16px';
            this.whatsappClearContextsButton.style.borderRadius = '8px';
            this.whatsappClearContextsButton.style.fontWeight = '600';
            const clearContextsDisabled = this._isWhatsappStoppedServerActionBlocked();
            this.whatsappClearContextsButton.disabled = clearContextsDisabled;
            this.whatsappClearContextsButton.textContent = (window.Lang && typeof Lang.get === 'function' && Lang.get('clearWhatsappPhoneContextsButton')) || 'Clear WhatsApp Contexts';
            if (this.serverStarted && !this.serverStarting && !this.serverStopping) {
                this.whatsappClearContextsButton.title = 'Stop the WhatsApp server before clearing WhatsApp contexts';
            } else if (this._isWhatsappRestartBlocked()) {
                this.whatsappClearContextsButton.title = 'Please wait before clearing WhatsApp contexts';
            } else {
                this.whatsappClearContextsButton.title = (window.Lang && typeof Lang.get === 'function' && Lang.get('clearWhatsappPhoneContextsButton')) || 'Clear WhatsApp Contexts';
            }
            if (clearContextsDisabled) {
                this.whatsappClearContextsButton.style.backgroundColor = 'var(--button-secondary-disabled-bg, #e5e7eb)';
                this.whatsappClearContextsButton.style.borderColor = 'var(--button-secondary-disabled-border, var(--button-secondary-border, #cbd5e1))';
                this.whatsappClearContextsButton.style.color = 'var(--button-secondary-disabled-text, #6b7280)';
                this.whatsappClearContextsButton.style.cursor = 'not-allowed';
            } else {
                this.whatsappClearContextsButton.style.backgroundColor = 'var(--button-secondary-bg, #f5f5f5)';
                this.whatsappClearContextsButton.style.borderColor = 'var(--button-secondary-border, #cbd5e1)';
                this.whatsappClearContextsButton.style.color = 'var(--button-secondary-text, #333333)';
                this.whatsappClearContextsButton.style.cursor = 'pointer';
            }
        }

        // Notify other parts of the app about pairing state
        if (isPaired) {
            this.stopWhatsappWebsocketListener();
        }

        try {
            if (isPaired) {
                //console.log('ConnectorsTab: dispatching whatsappPaired');
                window.dispatchEvent(new CustomEvent('whatsappPaired'));
                if (window.connectors && typeof window.connectors.startIncomingPolling === 'function') {
                    window.connectors.startIncomingPolling();
                }
            } else {
                //console.log('ConnectorsTab: dispatching whatsappUnpaired');
                window.dispatchEvent(new CustomEvent('whatsappUnpaired'));
            }
        } catch (e) {
            console.warn('ConnectorsTab: CustomEvent dispatch failed', e);
        }
    }

    _getWhatsappPairedStatusPhoneNumber() {
        const selectedDeviceId = String(this.savedWhatsappDeviceId || '').trim();
        const selectedEntry = this._findBestWhatsappDeviceCatalogEntry(this.savedWhatsappDevices, selectedDeviceId) || null;
        const candidatePhoneNumber = String(
            (selectedEntry && (selectedEntry.phone_number || selectedEntry.jid || selectedEntry.deviceId))
            || ''
        ).trim();
        if (!candidatePhoneNumber) {
            return '';
        }

        return this._normalizeWhatsappDeviceIdentity(candidatePhoneNumber) || candidatePhoneNumber;
    }

    _escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async setWhatsappMode(mode, fromDB = false) {
        const normalized = mode === 'personal' || mode === 'bot' ? mode : null;
        //console.log('ConnectorsTab: setWhatsappMode called', { mode, normalized, fromDB });
        if (!fromDB) {
            this.whatsappModeSelectionVersion += 1;
        }
        this.whatsappMode = normalized;

        if (this.whatsappPersonalModeButton) {
            this.whatsappPersonalModeButton.classList.toggle('active', normalized === 'personal');
        }
        if (this.whatsappBotModeButton) {
            this.whatsappBotModeButton.classList.toggle('active', normalized === 'bot');
        }

        if (typeof window !== 'undefined') {
            window.whatsappSelectedMode = normalized;
        }

        const dbInstance = window.PaiperworkDB || (typeof PaiperworkDB !== 'undefined' ? PaiperworkDB : null);
        if (!fromDB && dbInstance && typeof dbInstance.saveWhatsappMode === 'function') {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            if (hashedMasterKey) {
                try {
                    const saveResult = await dbInstance.saveWhatsappMode(hashedMasterKey, normalized || '');
                    if (!saveResult) {
                        console.warn('ConnectorsTab: saveWhatsappMode returned false');
                    }
                } catch (err) {
                    console.warn('ConnectorsTab: saveWhatsappMode failed', err);
                }
            }
        } else if (fromDB) {
            // loaded from DB, no need to re-save
        } else {
            console.warn('ConnectorsTab: saveWhatsappMode skipped - dbInstance missing or method missing');
        }

        try {
            await fetch('/api/whatsapp/mode', {
                method: 'POST',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ mode: normalized || '' })
            });
        } catch (err) {
            console.warn('ConnectorsTab: _updateWhatsappServerMode failed', err);
        }

        // Re-adjust the start server button state now that mode changed.
        this.setWhatsappPairButtonState(this.isPaired);
    }

    async _syncCurrentWhatsappModeSelection() {
        const normalized = this.whatsappMode === 'personal' || this.whatsappMode === 'bot'
            ? this.whatsappMode
            : null;
        if (!normalized) {
            return null;
        }

        try {
            const response = await fetch('/api/whatsapp/mode', {
                method: 'POST',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ mode: normalized })
            });
            if (!response.ok) {
                console.warn('ConnectorsTab: _syncCurrentWhatsappModeSelection failed', await response.text());
            }
        } catch (err) {
            console.warn('ConnectorsTab: _syncCurrentWhatsappModeSelection request failed', err);
        }

        if (typeof window !== 'undefined') {
            window.whatsappSelectedMode = normalized;
        }

        return normalized;
    }

    async setWhatsappModelLock(locked, fromDB = false) {
        const normalizedLocked = locked === true || String(locked).toLowerCase() === 'true';
        this.whatsappModelLocked = normalizedLocked;

        if (this.whatsappModelLockButton) {
            this.whatsappModelLockButton.classList.toggle('active', normalizedLocked);
            this.whatsappModelLockButton.textContent = normalizedLocked ? 'AI model locked' : 'Lock AI model';
            this.whatsappModelLockButton.title = normalizedLocked ? 'AI model locked' : 'Lock AI model';
            this.whatsappModelLockButton.setAttribute('aria-pressed', normalizedLocked ? 'true' : 'false');
        }

        if (typeof window !== 'undefined') {
            window.whatsappModelLocked = normalizedLocked;
        }

        const dbInstance = window.PaiperworkDB || (typeof PaiperworkDB !== 'undefined' ? PaiperworkDB : null);
        if (!fromDB && dbInstance && typeof dbInstance.saveWhatsappModelLock === 'function') {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            if (hashedMasterKey) {
                try {
                    const saveResult = await dbInstance.saveWhatsappModelLock(hashedMasterKey, normalizedLocked);
                    if (!saveResult) {
                        console.warn('ConnectorsTab: saveWhatsappModelLock returned false');
                    }
                } catch (err) {
                    console.warn('ConnectorsTab: saveWhatsappModelLock failed', err);
                }
            }
        }
    }

    async unpairWhatsappDevice() {
        //console.log('ConnectorsTab: unpairWhatsappDevice called');
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!hashedMasterKey) {
            console.warn('ConnectorsTab: unpairWhatsappDevice missing master key');
            return;
        }

        const activeDeviceId = String(this.savedWhatsappDeviceId || '').trim();

        try {
            // Stop the gateway server and clear UI state first.
            await this.stopWhatsappServer();

            if (activeDeviceId) {
                await this._removeSavedWhatsappDevice(activeDeviceId, {
                    syncServer: false,
                    reason: 'manual-unpair',
                    selectReplacement: 'none'
                });
            } else {
                await this._clearSavedWhatsappDeviceInfo();
            }
            this.isPaired = false;
            this.setWhatsappPairButtonState(false);
            this.closeWhatsappPairModal();
            this.stopPolling();
            this.setWhatsappModalStatus('WhatsApp unpaired and cleared from Paiperwork.');
            this.setWhatsappMode(null);
        } catch (err) {
            console.warn('ConnectorsTab: unpairWhatsappDevice failed', err);
            this.setWhatsappModalStatus('Failed to unpair WhatsApp. See console logs.');
        }
    }

    async _hasPersistedWhatsappDeviceInDb() {
        const savedDeviceId = String(this.savedWhatsappDeviceId || '').trim();
        if (savedDeviceId) {
            return true;
        }

        if (Array.isArray(this.savedWhatsappDevices) && this.savedWhatsappDevices.some(entry => String(entry && entry.deviceId || '').trim())) {
            return true;
        }

        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!hashedMasterKey) {
            return false;
        }

        try {
            const dbHandle = await this._getPaiperworkDBHandle();
            if (!dbHandle) {
                return false;
            }

            if (typeof dbHandle.initializeDatabase === 'function') {
                await dbHandle.initializeDatabase(hashedMasterKey);
            }

            if (typeof dbHandle.hasWhatsappPersistedPairingData === 'function') {
                return !!(await dbHandle.hasWhatsappPersistedPairingData(hashedMasterKey));
            }

            const hasFn = typeof dbHandle.getWhatsappDeviceInfo === 'function';
            if (!hasFn) {
                return false;
            }

            const info = await dbHandle.getWhatsappDeviceInfo(hashedMasterKey);
            const normalized = this._normalizeWhatsappDeviceCatalog(info);
            const selectedDeviceId = String(normalized.selectedDeviceId || '').trim();
            if (selectedDeviceId) {
                return true;
            }

            return normalized.devices.some(entry => String(entry && entry.deviceId || '').trim());
        } catch (err) {
            console.warn('ConnectorsTab: _hasPersistedWhatsappDeviceInDb failed', err);
            return false;
        }
    }

    _confirmWhatsappFreshPairingReplacement() {
        const confirmMessage = (window.Lang && typeof Lang.get === 'function' && Lang.get('whatsappPairNewDeviceReplaceWarning'))
            || 'A WhatsApp device is already paired in Paiperwork. Pairing a new device will remove the existing pairing before continuing. Do you want to continue?';
        if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
            return true;
        }

        return !!window.confirm(confirmMessage);
    }

    async _prepareWhatsappFreshPairingStart() {
        // The first side effect after clicking Pair new device must be the warning.
        // This method only reads local/runtime DB state before asking the user.
        const hasPersistedDevice = await this._hasPersistedWhatsappDeviceInDb();
        if (!hasPersistedDevice) {
            return true;
        }

        if (!this._confirmWhatsappFreshPairingReplacement()) {
            return false;
        }

        return this.deleteAllPairedWhatsappDevices({ skipConfirm: true, suppressSuccessStatus: true });
    }

    async deleteAllPairedWhatsappDevices(options = {}) {
        const { skipConfirm = false, suppressSuccessStatus = false } = options || {};
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!hashedMasterKey) {
            console.warn('ConnectorsTab: deleteAllPairedWhatsappDevices missing master key');
            return false;
        }

        if (!skipConfirm) {
            const confirmMessage = (window.Lang && typeof Lang.get === 'function' && Lang.get('whatsappDeleteAllPairedConfirm'))
                || 'You are about to delete pairing information from Paiperwork, are you sure?';
            if (typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm(confirmMessage)) {
                return false;
            }
        }

        try {
            this.serverStopping = true;
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('whatsappUnpaired'));
            }
            const response = await fetch('/api/whatsapp/pairing-data/delete-all', {
                method: 'POST',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' })
            });
            if (!response.ok) {
                throw new Error(await response.text());
            }

            await this._waitForWhatsappGatewayStop();

            await this._clearSavedWhatsappDeviceInfo();

            this.serverStarted = false;
            this.serverStarting = false;
            this.serverStopping = false;
            this.isPaired = false;
            this.whatsappRemoteLogoutNoticeShown = null;
            this.whatsappSessionImportedForDevice = null;
            this.whatsappSessionRestoreSkippedForDevice = null;
            this._setWhatsappFreshPairRequested(true);
            this.whatsappFreshPairDeviceId = null;
            this.stopWhatsappWebsocketListener();
            this.stopPolling();
            this.stopWhatsappModalCountdown();
            this.clearWhatsappQrCountdown();
            this.closeWhatsappPairModal();
            this.setWhatsappPairButtonState(false);
            if (!suppressSuccessStatus) {
                this.setWhatsappModalStatus((window.Lang && typeof Lang.get === 'function' && Lang.get('whatsappDeleteAllPairedSuccess')) || 'Paiperwork WhatsApp DB tables cleared. Click Start server to pair a new device now.');
            }
            return true;
        } catch (err) {
            console.warn('ConnectorsTab: deleteAllPairedWhatsappDevices failed', err);
            this.setWhatsappModalStatus((window.Lang && typeof Lang.get === 'function' && Lang.get('whatsappDeleteAllPairedFailed')) || 'Failed to delete Paiperwork pairing data. See console logs.');
            return false;
        } finally {
            this.serverStopping = false;
        }
    }

    async loadWhatsappModeFromDb(retryCount = 0) {
        const loadRequestId = ++this.whatsappModeLoadRequestId;
        const selectionVersionAtStart = this.whatsappModeSelectionVersion;
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        const dbHandle = window.PaiperworkDB || (typeof PaiperworkDB !== 'undefined' ? PaiperworkDB : null);
        //console.log('ConnectorsTab: loadWhatsappModeFromDb begin', { hashedMasterKey, retryCount, hasDBClass: !!dbHandle });

        if (!hashedMasterKey || !dbHandle || typeof dbHandle.getWhatsappMode !== 'function') {
            console.warn('ConnectorsTab: loadWhatsappModeFromDb missing prerequisites', {
                hashedMasterKey,
                hasDBClass: !!dbHandle,
                hasFn: dbHandle && typeof dbHandle.getWhatsappMode === 'function'
            });

            if (retryCount < 5) {
                setTimeout(() => this.loadWhatsappModeFromDb(retryCount + 1), 300);
                return;
            }

            this.setWhatsappMode(null);
            return;
        }

        try {
            const dbInstance = window.PaiperworkDB || (typeof PaiperworkDB !== 'undefined' ? PaiperworkDB : null);
            if (!dbInstance) {
                throw new Error('PaiperworkDB is not available');
            }
            //console.log('ConnectorsTab: initializeDatabase call');
            const initResult = await dbInstance.initializeDatabase(hashedMasterKey);
            //console.log('ConnectorsTab: initializeDatabase result', { initResult });

            const mode = await dbInstance.getWhatsappMode(hashedMasterKey);
            //console.log('ConnectorsTab: read Whatsapp mode from DB', { mode });

            if (loadRequestId !== this.whatsappModeLoadRequestId || selectionVersionAtStart !== this.whatsappModeSelectionVersion) {
                return;
            }

            if (!mode) {
                //console.log('ConnectorsTab: no mode found in DB, leaving unselected');
                this.setWhatsappMode(null, true);
            } else {
                this.setWhatsappMode(mode, true);
            }
        } catch (err) {
            console.warn('ConnectorsTab: loadWhatsappModeFromDb failed', err);
            if (retryCount < 5) {
                setTimeout(() => this.loadWhatsappModeFromDb(retryCount + 1), 300);
                return;
            }
            this.setWhatsappMode(null);
        }
    }

    async loadWhatsappModelLockFromDb(retryCount = 0) {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        const dbHandle = window.PaiperworkDB || (typeof PaiperworkDB !== 'undefined' ? PaiperworkDB : null);

        if (!hashedMasterKey || !dbHandle || typeof dbHandle.getWhatsappModelLock !== 'function') {
            if (retryCount < 5) {
                setTimeout(() => this.loadWhatsappModelLockFromDb(retryCount + 1), 300);
                return;
            }

            this.setWhatsappModelLock(false, true);
            return;
        }

        try {
            const dbInstance = window.PaiperworkDB || (typeof PaiperworkDB !== 'undefined' ? PaiperworkDB : null);
            if (!dbInstance) {
                throw new Error('PaiperworkDB is not available');
            }

            await dbInstance.initializeDatabase(hashedMasterKey);
            const locked = await dbInstance.getWhatsappModelLock(hashedMasterKey);
            await this.setWhatsappModelLock(locked, true);
        } catch (err) {
            console.warn('ConnectorsTab: loadWhatsappModelLockFromDb failed', err);
            if (retryCount < 5) {
                setTimeout(() => this.loadWhatsappModelLockFromDb(retryCount + 1), 300);
                return;
            }
            this.setWhatsappModelLock(false, true);
        }
    }

    async _getPaiperworkDBHandle(retryCount = 0) {
        const dbHandle = window.PaiperworkDB || (typeof PaiperworkDB !== 'undefined' ? PaiperworkDB : null);
        if (dbHandle) {
            if (retryCount > 0) {
                console.info('ConnectorsTab: _getPaiperworkDBHandle recovered after retry', { retryCount });
            }
            return dbHandle;
        }

        if (retryCount < 16) {
            await new Promise(resolve => setTimeout(resolve, 200));
            return this._getPaiperworkDBHandle(retryCount + 1);
        }

        console.warn('ConnectorsTab: _getPaiperworkDBHandle timeout, DB handle not available', { retryCount });
        return null;
    }

    _sanitizeWhatsappDeviceCatalogEntry(entry, fallbackDeviceId = '') {
        if (!entry || typeof entry !== 'object') {
            return null;
        }

        const deviceId = String(entry.deviceId || entry.device_id || entry.id || entry.device || fallbackDeviceId || '').trim();
        if (!deviceId) {
            return null;
        }

        const rawJid = String(entry.jid || (deviceId.includes('@') ? deviceId : '')).trim();
        const normalizedPhone = String(entry.phone_number || '').trim() || this._normalizeWhatsappDeviceIdentity(rawJid || deviceId);

        return {
            deviceId,
            jid: rawJid,
            phone_number: normalizedPhone,
            display_name: String(entry.display_name || entry.displayName || entry.push_name || entry.pushName || entry.name || '').trim(),
            alias: String(entry.alias || '').trim(),
            state: String(entry.state || '').trim(),
            created_at: String(entry.created_at || entry.createdAt || '').trim(),
            savedAt: String(entry.savedAt || entry.saved_at || '').trim()
        };
    }

    async _fetchAuthoritativeWhatsappDevicesFromServer() {
        try {
            const params = this._appendWhatsappUserScope(new URLSearchParams());
            const response = await fetch(`/api/whatsapp/devices?${params.toString()}`, {
                headers: this._getWhatsappUserScopedHeaders(),
                cache: 'no-store'
            });

            if (!response.ok) {
                console.warn('ConnectorsTab: _fetchAuthoritativeWhatsappDevicesFromServer failed', response.status);
                return { available: false, devices: [] };
            }

            const body = await response.json().catch(() => null);
            const results = Array.isArray(body && body.results) ? body.results : (Array.isArray(body) ? body : []);
            const devices = results
                .map(entry => this._sanitizeWhatsappDeviceCatalogEntry(entry))
                .filter(Boolean);

            return { available: true, devices };
        } catch (err) {
            console.warn('ConnectorsTab: _fetchAuthoritativeWhatsappDevicesFromServer failed', err);
            return { available: false, devices: [] };
        }
    }

    async _reconcileSavedWhatsappDevicesWithAuthoritativeDevices(reason = 'runtime-refresh') {
        const { available, devices } = await this._fetchAuthoritativeWhatsappDevicesFromServer();
        if (!available || !Array.isArray(devices) || !devices.length) {
            return false;
        }

        const info = await this._loadSavedWhatsappDeviceInfo();
        const normalized = this._normalizeWhatsappDeviceCatalog(info);
        if (!Array.isArray(normalized.devices) || normalized.devices.length === 0) {
            return false;
        }

        const authoritativeKeys = new Set(
            devices
                .map(entry => this._normalizeWhatsappDeviceIdentity(entry && entry.deviceId))
                .filter(Boolean)
        );
        if (!authoritativeKeys.size) {
            return false;
        }

        const removedDevices = normalized.devices.filter(entry => {
            const deviceKey = this._normalizeWhatsappDeviceIdentity(entry && entry.deviceId);
            return deviceKey && !authoritativeKeys.has(deviceKey);
        });
        if (!removedDevices.length) {
            return false;
        }

        const remainingDevices = normalized.devices.filter(entry => {
            const deviceKey = this._normalizeWhatsappDeviceIdentity(entry && entry.deviceId);
            return !deviceKey || authoritativeKeys.has(deviceKey);
        });
        const selectedDeviceKey = this._normalizeWhatsappDeviceIdentity(normalized.selectedDeviceId);
        const nextSelectedDeviceId = (remainingDevices.find(entry => this._normalizeWhatsappDeviceIdentity(entry && entry.deviceId) === selectedDeviceKey) || remainingDevices[0] || {}).deviceId || '';

        /*console.log('ConnectorsTab: _reconcileSavedWhatsappDevicesWithAuthoritativeDevices pruning stale saved devices', {
            reason,
            authoritativeDeviceIds: devices.map(entry => entry.deviceId),
            removedDeviceIds: removedDevices.map(entry => entry.deviceId),
            remainingDeviceIds: remainingDevices.map(entry => entry.deviceId),
            nextSelectedDeviceId
        });*/

        if (!remainingDevices.length) {
            await this._clearSavedWhatsappDeviceInfo();
        } else {
            const saveResult = await this._writeWhatsappDeviceCatalog(nextSelectedDeviceId, remainingDevices, normalized.meta);
            if (!saveResult) {
                console.warn('ConnectorsTab: _reconcileSavedWhatsappDevicesWithAuthoritativeDevices failed to persist pruned catalog', {
                    reason,
                    removedDeviceIds: removedDevices.map(entry => entry.deviceId)
                });
                return false;
            }
        }

        for (const removedDevice of removedDevices) {
            const removedDeviceId = String(removedDevice && removedDevice.deviceId || '').trim();
            if (removedDeviceId) {
                await this._clearSavedWhatsappSessionBundle(removedDeviceId);
            }
        }

        const postReconcile = await this._readSavedWhatsappDeviceCatalogFromDb();
        /*console.log('ConnectorsTab: _reconcileSavedWhatsappDevicesWithAuthoritativeDevices post-reconcile catalog snapshot', {
            reason,
            selectedDeviceId: postReconcile && postReconcile.normalized ? postReconcile.normalized.selectedDeviceId : '',
            remainingDeviceIds: postReconcile && postReconcile.normalized && Array.isArray(postReconcile.normalized.devices)
                ? postReconcile.normalized.devices.map(entry => entry.deviceId)
                : []
        });*/

        return true;
    }

    _composeWhatsappDeviceInfoWithAuthoritativeDevices(info = null, preferredInfo = null, authoritativeDevices = []) {
        const baseInfo = info && typeof info === 'object' ? { ...info } : {};
        const baseMeta = baseInfo.meta && typeof baseInfo.meta === 'object' ? { ...baseInfo.meta } : {};
        const devices = Array.isArray(authoritativeDevices)
            ? authoritativeDevices.map(entry => this._sanitizeWhatsappDeviceCatalogEntry(entry)).filter(Boolean)
            : [];

        const preferredDeviceId = String(preferredInfo && preferredInfo.deviceId ? preferredInfo.deviceId : '').trim();
        const baseNormalized = this._normalizeWhatsappDeviceCatalog(baseInfo);
        const requestedSelectedDeviceId = String(baseNormalized.selectedDeviceId || baseInfo.deviceId || '').trim();

        let selectedDeviceId = '';
        const normalizedPreferredDeviceId = this._normalizeWhatsappDeviceIdentity(preferredDeviceId);
        const normalizedRequestedSelectedDeviceId = this._normalizeWhatsappDeviceIdentity(requestedSelectedDeviceId);

        if (requestedSelectedDeviceId) {
            const requestedEntry = devices.find(entry => {
                const candidateDeviceId = String(entry && entry.deviceId || '').trim();
                return candidateDeviceId === requestedSelectedDeviceId
                    || (normalizedRequestedSelectedDeviceId && this._normalizeWhatsappDeviceIdentity(candidateDeviceId) === normalizedRequestedSelectedDeviceId);
            });
            if (requestedEntry && requestedEntry.deviceId) {
                selectedDeviceId = requestedEntry.deviceId;
            } else if (!this._isWhatsappPairedDeviceId(requestedSelectedDeviceId)) {
                const normalizedMetaPhone = this._normalizeWhatsappDeviceIdentity(baseMeta.phone_number || '');
                const normalizedMetaJid = this._normalizeWhatsappDeviceIdentity(baseMeta.jid || '');
                const matchingByMetadata = devices.find(entry => {
                    const candidatePhone = this._normalizeWhatsappDeviceIdentity(entry.phone_number);
                    const candidateJid = this._normalizeWhatsappDeviceIdentity(entry.jid);
                    return (normalizedMetaPhone && (candidatePhone === normalizedMetaPhone || candidateJid === normalizedMetaPhone))
                        || (normalizedMetaJid && (candidatePhone === normalizedMetaJid || candidateJid === normalizedMetaJid));
                });
                if (matchingByMetadata && matchingByMetadata.deviceId) {
                    selectedDeviceId = matchingByMetadata.deviceId;
                }
            }
        }

        if (!selectedDeviceId && preferredDeviceId) {
            const preferredEntry = devices.find(entry => {
                const candidateDeviceId = String(entry && entry.deviceId || '').trim();
                return candidateDeviceId === preferredDeviceId
                    || (normalizedPreferredDeviceId && this._normalizeWhatsappDeviceIdentity(candidateDeviceId) === normalizedPreferredDeviceId);
            });
            if (preferredEntry && preferredEntry.deviceId) {
                selectedDeviceId = preferredEntry.deviceId;
            }
        } else if (devices[0] && devices[0].deviceId) {
            selectedDeviceId = devices[0].deviceId;
        }

        const selectedEntry = devices.find(entry => entry.deviceId === selectedDeviceId) || null;
        baseMeta.devices = devices;
        baseMeta.selectedDeviceId = selectedEntry ? selectedEntry.deviceId : '';
        baseMeta.phone_number = selectedEntry ? selectedEntry.phone_number || '' : '';
        baseMeta.display_name = selectedEntry ? selectedEntry.display_name || '' : '';
        baseMeta.alias = selectedEntry ? selectedEntry.alias || '' : '';
        baseMeta.state = selectedEntry ? selectedEntry.state || '' : '';
        baseMeta.created_at = selectedEntry ? selectedEntry.created_at || '' : '';

        return {
            ...baseInfo,
            deviceId: selectedEntry ? selectedEntry.deviceId : '',
            meta: baseMeta
        };
    }

    _normalizeWhatsappDeviceCatalog(info = null) {
        const deviceInfo = info && typeof info === 'object' ? info : null;
        const meta = deviceInfo && deviceInfo.meta && typeof deviceInfo.meta === 'object' ? { ...deviceInfo.meta } : {};
        const devices = [];
        const seen = new Set();

        const pushEntry = (entry, fallbackDeviceId = '') => {
            const normalized = this._sanitizeWhatsappDeviceCatalogEntry(entry, fallbackDeviceId);
            const identityKey = String(normalized && normalized.deviceId || '').trim()
                || this._normalizeWhatsappDeviceIdentity(normalized && normalized.deviceId)
                || '';
            if (!normalized || !identityKey) {
                return;
            }

            const existingIndex = devices.findIndex(entry => {
                const candidateKey = String(entry && entry.deviceId || '').trim()
                    || this._normalizeWhatsappDeviceIdentity(entry && entry.deviceId)
                    || '';
                return candidateKey === identityKey;
            });
            if (existingIndex >= 0) {
                if (this._shouldReplaceWhatsappDeviceCatalogEntry(devices[existingIndex], normalized)) {
                    devices[existingIndex] = normalized;
                }
                seen.add(identityKey);
                return;
            }

            seen.add(identityKey);
            devices.push(normalized);
        };

        if (Array.isArray(meta.devices)) {
            meta.devices.forEach(entry => pushEntry(entry));
        }

        if (deviceInfo && deviceInfo.deviceId) {
            pushEntry({
                deviceId: deviceInfo.deviceId,
                phone_number: meta.phone_number || '',
                display_name: meta.display_name || '',
                alias: meta.alias || '',
                state: meta.state || '',
                created_at: meta.created_at || '',
                savedAt: meta.savedAt || meta.saved_at || ''
            }, deviceInfo.deviceId);
        }

        const hasExplicitSelectedDevice = Object.prototype.hasOwnProperty.call(meta, 'selectedDeviceId');
        const explicitSelectedDeviceId = String(meta.selectedDeviceId || '').trim();
        const requestedDeviceId = String(deviceInfo && deviceInfo.deviceId ? deviceInfo.deviceId : '').trim();
        const normalizedExplicitSelectedDeviceId = this._normalizeWhatsappDeviceIdentity(explicitSelectedDeviceId);
        const normalizedRequestedDeviceId = this._normalizeWhatsappDeviceIdentity(requestedDeviceId);
        let selectedDeviceId = '';

        if (hasExplicitSelectedDevice) {
            const explicitEntry = this._findBestWhatsappDeviceCatalogEntry(devices, explicitSelectedDeviceId);
            selectedDeviceId = explicitEntry && explicitEntry.deviceId ? explicitEntry.deviceId : '';
        } else if (requestedDeviceId) {
            const requestedEntry = this._findBestWhatsappDeviceCatalogEntry(devices, requestedDeviceId);
            selectedDeviceId = requestedEntry && requestedEntry.deviceId ? requestedEntry.deviceId : '';
        } else {
            selectedDeviceId = devices[0] && devices[0].deviceId ? devices[0].deviceId : '';
        }

        return { devices, selectedDeviceId, meta };
    }

    _applyWhatsappDeviceCatalogState(info = null) {
        const normalized = this._normalizeWhatsappDeviceCatalog(info);
        this.savedWhatsappDevices = normalized.devices;
        this.savedWhatsappDeviceId = normalized.selectedDeviceId || null;
        return normalized;
    }

    _buildWhatsappDeviceInfoPayload(selectedDeviceId, devices, fallbackMeta = null) {
        const normalizedDevices = Array.isArray(devices)
            ? devices.map(entry => this._sanitizeWhatsappDeviceCatalogEntry(entry)).filter(Boolean)
            : [];
        const meta = fallbackMeta && typeof fallbackMeta === 'object' ? { ...fallbackMeta } : {};
        delete meta.devices;
        delete meta.phone_number;
        delete meta.display_name;
        delete meta.alias;
        delete meta.state;
        delete meta.created_at;
        delete meta.savedAt;
        delete meta.saved_at;

        const resolvedSelectedDeviceId = String(selectedDeviceId || '').trim();
    const selectedEntry = this._findBestWhatsappDeviceCatalogEntry(normalizedDevices, resolvedSelectedDeviceId) || null;
        meta.devices = normalizedDevices;
        meta.selectedDeviceId = selectedEntry ? selectedEntry.deviceId : '';

        if (selectedEntry) {
            meta.phone_number = selectedEntry.phone_number || '';
            meta.display_name = selectedEntry.display_name || '';
            meta.alias = selectedEntry.alias || '';
            meta.state = selectedEntry.state || '';
            meta.created_at = selectedEntry.created_at || '';
            meta.savedAt = selectedEntry.savedAt || '';
        }

        return {
            deviceId: selectedEntry ? selectedEntry.deviceId : '',
            meta
        };
    }

    async _writeWhatsappDeviceCatalog(selectedDeviceId, devices, fallbackMeta = null) {
        const runWrite = async () => {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasFn = dbHandle && typeof dbHandle.saveWhatsappDeviceInfo === 'function';
            if (!hashedMasterKey || !dbHandle || !hasFn) {
                return false;
            }

            const payload = this._buildWhatsappDeviceInfoPayload(selectedDeviceId, devices, fallbackMeta);
            const saveResult = await dbHandle.saveWhatsappDeviceInfo(hashedMasterKey, payload.deviceId, payload.meta);
            if (saveResult) {
                this._applyWhatsappDeviceCatalogState(payload);
            }
            return !!saveResult;
        };

        const nextWrite = Promise.resolve(this.whatsappDeviceCatalogWritePromise)
            .catch(() => false)
            .then(runWrite);
        this.whatsappDeviceCatalogWritePromise = nextWrite.catch(() => false);
        return nextWrite;
    }

    async _loadSavedWhatsappDevices() {
        const info = await this._loadSavedWhatsappDeviceInfo();
        return this._normalizeWhatsappDeviceCatalog(info).devices;
    }

    async _readSavedWhatsappDeviceCatalogFromDb(retryCount = 0) {
        try {
            const info = await this._loadSavedWhatsappDeviceInfo(retryCount);
            const normalized = this._normalizeWhatsappDeviceCatalog(info);
            /* console.info('ConnectorsTab: _readSavedWhatsappDeviceCatalogFromDb loaded catalog', {
                info,
                deviceCount: normalized.devices.length,
                selectedDeviceId: normalized.selectedDeviceId,
                deviceIds: normalized.devices.map(entry => entry.deviceId)
            }); */
            return {
                info,
                normalized
            };
        } catch (err) {
            console.warn('ConnectorsTab: _readSavedWhatsappDeviceCatalogFromDb failed', err);
            return { info: null, normalized: this._normalizeWhatsappDeviceCatalog(null) };
        }
    }

    async _selectSavedWhatsappDevice(deviceId, sourceDevices = null) {
        const resolvedDeviceId = String(deviceId || '').trim();
        if (!resolvedDeviceId) {
            return false;
        }

        const normalized = Array.isArray(sourceDevices)
            ? this._normalizeWhatsappDeviceCatalog(this._composeWhatsappDeviceInfoWithAuthoritativeDevices(null, null, sourceDevices))
            : this._normalizeWhatsappDeviceCatalog(await this._loadSavedWhatsappDeviceInfo());
        const resolvedEntry = this._findBestWhatsappDeviceCatalogEntry(normalized.devices, resolvedDeviceId);
        if (!resolvedEntry || !resolvedEntry.deviceId) {
            return false;
        }
        const canonicalSelectedDeviceId = String(resolvedEntry.deviceId || '').trim();

        const previousDeviceId = String(this.savedWhatsappDeviceId || '').trim();
        /*console.log('ConnectorsTab: _selectSavedWhatsappDevice', {
            resolvedDeviceId: canonicalSelectedDeviceId,
            previousDeviceId,
            availableDeviceIds: normalized.devices.map(entry => entry.deviceId)
        });*/
        const saveResult = await this._writeWhatsappDeviceCatalog(canonicalSelectedDeviceId, normalized.devices, normalized.meta);
        if (!saveResult) {
            return false;
        }

        if (previousDeviceId && previousDeviceId !== canonicalSelectedDeviceId) {
            this.whatsappSessionImportedForDevice = null;
            this.whatsappSessionRestoreSkippedForDevice = null;
        }

        return true;
    }

    async _upsertSavedWhatsappDevice(deviceId, metadata = {}, options = {}) {
        const requestedDeviceId = String(deviceId || '').trim();
        if (!requestedDeviceId) {
            return false;
        }

        const info = await this._loadSavedWhatsappDeviceInfo();
        const normalized = this._normalizeWhatsappDeviceCatalog(info);
        const previousSelectedDeviceId = String(this.savedWhatsappDeviceId || normalized.selectedDeviceId || '').trim();
        const matchingEntries = normalized.devices.filter(entry => {
            return this._matchesWhatsappDeviceReference(entry, requestedDeviceId, metadata)
                || this._matchesWhatsappDeviceMetadataIdentity(entry, metadata);
        });
        const existingEntry = matchingEntries.sort((left, right) => this._getWhatsappDeviceCatalogRank(right) - this._getWhatsappDeviceCatalogRank(left))[0] || {};
        const resolvedDeviceId = !this._isWhatsappPairedDeviceId(requestedDeviceId)
            && this._isWhatsappPairedDeviceId(existingEntry && existingEntry.deviceId)
            ? String(existingEntry.deviceId || '').trim()
            : requestedDeviceId;
        const nextEntry = this._sanitizeWhatsappDeviceCatalogEntry({
            ...existingEntry,
            ...metadata,
            deviceId: resolvedDeviceId,
            savedAt: new Date().toISOString()
        }, resolvedDeviceId);
        const removedDeviceIds = matchingEntries
            .map(entry => String(entry && entry.deviceId || '').trim())
            .filter(candidateDeviceId => candidateDeviceId && candidateDeviceId !== resolvedDeviceId);
        const nextDevices = normalized.devices.filter(entry => {
            return !this._matchesWhatsappDeviceReference(entry, requestedDeviceId, metadata)
                && !this._matchesWhatsappDeviceMetadataIdentity(entry, metadata);
        });
        nextDevices.unshift(nextEntry);

        const shouldSelect = options.select !== false;
        const nextSelectedDeviceId = shouldSelect
            ? nextEntry.deviceId
            : ((this._findBestWhatsappDeviceCatalogEntry(nextDevices, normalized.selectedDeviceId || previousSelectedDeviceId) || {}).deviceId || nextEntry.deviceId);
        /*console.log('ConnectorsTab: _upsertSavedWhatsappDevice', {
            resolvedDeviceId,
            previousSelectedDeviceId,
            shouldSelect,
            nextSelectedDeviceId,
            existingDeviceIds: normalized.devices.map(entry => entry.deviceId),
            nextDeviceIds: nextDevices.map(entry => entry.deviceId),
            removedDeviceIds
        });*/
        const saveResult = await this._writeWhatsappDeviceCatalog(nextSelectedDeviceId, nextDevices, normalized.meta);
        if (!saveResult) {
            return false;
        }

        if (removedDeviceIds.length) {
            await this._migrateSavedWhatsappSessionBundle(removedDeviceIds, nextEntry.deviceId);
        }

        if (previousSelectedDeviceId && previousSelectedDeviceId !== nextEntry.deviceId && shouldSelect) {
            this.whatsappSessionImportedForDevice = null;
            this.whatsappSessionRestoreSkippedForDevice = null;
        }

        return true;
    }

    async _removeSavedWhatsappDevice(deviceId, options = {}) {
        const resolvedDeviceId = String(deviceId || this.savedWhatsappDeviceId || '').trim();
        if (!resolvedDeviceId) {
            return false;
        }

        if (options.purgeServer !== false) {
            try {
                await this._deleteSavedWhatsappDeviceOnServer(resolvedDeviceId, options.reason || 'device-removed');
            } catch (purgeErr) {
                console.warn('ConnectorsTab: _removeSavedWhatsappDevice failed to purge backend saved device', {
                    resolvedDeviceId,
                    reason: options.reason || '',
                    error: purgeErr
                });
                return false;
            }
        }

        const info = await this._loadSavedWhatsappDeviceInfo();
        const normalized = this._normalizeWhatsappDeviceCatalog(info);
        const matchesResolvedDevice = (candidateDeviceId) => {
            const resolvedCandidateDeviceId = String(candidateDeviceId || '').trim();
            if (!resolvedCandidateDeviceId) {
                return false;
            }
            return resolvedCandidateDeviceId === resolvedDeviceId;
        };

        const matchingEntries = normalized.devices.filter(entry => matchesResolvedDevice(entry && entry.deviceId));
        const remainingDevices = normalized.devices.filter(entry => !matchesResolvedDevice(entry && entry.deviceId));
        const wasSelected = matchesResolvedDevice(normalized.selectedDeviceId);
        const fallbackSelection = options.selectReplacement === 'none'
            ? ''
            : (remainingDevices[0] && remainingDevices[0].deviceId ? remainingDevices[0].deviceId : '');
        const nextSelectedDeviceId = wasSelected ? fallbackSelection : (normalized.selectedDeviceId || fallbackSelection);
        /*console.log('ConnectorsTab: _removeSavedWhatsappDevice', {
            resolvedDeviceId,
            reason: options.reason || '',
            wasSelected,
            previousSelectedDeviceId: normalized.selectedDeviceId || '',
            remainingDeviceIds: remainingDevices.map(entry => entry.deviceId),
            nextSelectedDeviceId
        });*/

        if (!remainingDevices.length) {
            await this._clearSavedWhatsappDeviceInfo();
            /*console.log('ConnectorsTab: _removeSavedWhatsappDevice cleared all saved device info', {
                resolvedDeviceId,
                reason: options.reason || ''
            });*/
        } else {
            const saveResult = await this._writeWhatsappDeviceCatalog(nextSelectedDeviceId, remainingDevices, normalized.meta);
            if (!saveResult) {
                console.warn('ConnectorsTab: _removeSavedWhatsappDevice failed to persist updated device catalog', {
                    resolvedDeviceId,
                    reason: options.reason || '',
                    attemptedRemainingDeviceIds: remainingDevices.map(entry => entry.deviceId)
                });
                return false;
            }
            /*console.log('ConnectorsTab: _removeSavedWhatsappDevice persisted updated device catalog', {
                resolvedDeviceId,
                reason: options.reason || '',
                remainingDeviceIds: remainingDevices.map(entry => entry.deviceId),
                nextSelectedDeviceId
            });*/
        }

        await this._clearSavedWhatsappSessionBundle(resolvedDeviceId);
        if (matchesResolvedDevice(this.whatsappSessionImportedForDevice)) {
            this.whatsappSessionImportedForDevice = null;
        }
        if (matchesResolvedDevice(this.whatsappSessionRestoreSkippedForDevice)) {
            this.whatsappSessionRestoreSkippedForDevice = null;
        }

        if (options.syncServer !== false) {
            void options;
        }

		const postDeleteCatalog = await this._readSavedWhatsappDeviceCatalogFromDb();
		/*console.log('ConnectorsTab: _removeSavedWhatsappDevice post-delete catalog snapshot', {
			resolvedDeviceId,
			reason: options.reason || '',
			selectedDeviceId: postDeleteCatalog && postDeleteCatalog.normalized ? postDeleteCatalog.normalized.selectedDeviceId : '',
			remainingDeviceIds: postDeleteCatalog && postDeleteCatalog.normalized && Array.isArray(postDeleteCatalog.normalized.devices)
				? postDeleteCatalog.normalized.devices.map(entry => entry.deviceId)
				: []
		});*/

        return true;
    }

    async _forgetSavedWhatsappDeviceAfterUnpair(deviceId = null, reason = 'remote-unpair') {
        try {
            const resolvedDeviceId = this._resolveSavedWhatsappCatalogDeviceId(deviceId || this.savedWhatsappDeviceId || '');
            const shouldFullyPurgeLocalArtifacts = /(remote[_-]?logout|remote-unpair|logged[_-]?out)/i.test(String(reason || ''));
			/*console.log('ConnectorsTab: _forgetSavedWhatsappDeviceAfterUnpair begin', {
				deviceId: deviceId || null,
				resolvedDeviceId: resolvedDeviceId || null,
				reason
			});*/
            await this._clearWhatsappRuntimeSession(resolvedDeviceId || null);

            if (shouldFullyPurgeLocalArtifacts) {
                await this._clearSavedWhatsappDeviceInfo();
                this.whatsappStalePreferredDeviceCleared = resolvedDeviceId || null;
                return;
            }

            if (!resolvedDeviceId) {
                await this._clearSavedWhatsappDeviceInfo();
				console.log('ConnectorsTab: _forgetSavedWhatsappDeviceAfterUnpair cleared all saved device info because no resolved device remained', {
					reason
				});
                return;
            }

            await this._removeSavedWhatsappDevice(resolvedDeviceId, {
                reason,
                selectReplacement: 'auto'
            });

            this.whatsappStalePreferredDeviceCleared = resolvedDeviceId;
			/*console.log('ConnectorsTab: _forgetSavedWhatsappDeviceAfterUnpair completed', {
				resolvedDeviceId,
				reason,
				whatsappStalePreferredDeviceCleared: this.whatsappStalePreferredDeviceCleared
			});*/
        } catch (err) {
            console.warn('ConnectorsTab: _forgetSavedWhatsappDeviceAfterUnpair failed', err);
        }
    }

    _formatWhatsappSavedDeviceLabel(device) {
        const entry = this._sanitizeWhatsappDeviceCatalogEntry(device);
        if (!entry) {
            return {
                primary: 'Unknown device',
                secondary: '',
                deviceId: ''
            };
        }

        const primary = entry.alias || entry.display_name || entry.phone_number || `Device ${entry.deviceId.slice(-8)}`;
        const secondary = [entry.phone_number, entry.display_name, entry.state, entry.created_at]
            .filter(value => !!value && value !== primary)
            .join(' | ');

        return {
            primary,
            secondary,
            deviceId: entry.deviceId
        };
    }

    async _chooseSavedWhatsappDeviceForStart() {
        if (this.whatsappFreshPairRequested) {
            this.savedWhatsappDeviceId = null;
            return '';
        }

        const { normalized } = await this._readSavedWhatsappDeviceCatalogFromDb();
        const devices = Array.isArray(normalized && normalized.devices) ? normalized.devices : [];

        if (!Array.isArray(devices) || devices.length === 0) {
            return '';
        }

        const candidateDeviceIds = [
            this.savedWhatsappDeviceId,
            normalized.selectedDeviceId,
            ...devices.map(entry => String(entry && entry.deviceId || '').trim())
        ];
        let resolvedDeviceId = '';
        for (const candidateDeviceId of candidateDeviceIds) {
            const persistableDeviceId = this._resolveSavedWhatsappPersistableDeviceId(candidateDeviceId);
            if (persistableDeviceId) {
                resolvedDeviceId = persistableDeviceId;
                break;
            }
        }

        if (!resolvedDeviceId) {
            this.savedWhatsappDeviceId = null;
            return '';
        }

        const selectedEntry = this._findBestWhatsappDeviceCatalogEntry(devices, resolvedDeviceId);
        if (!selectedEntry || !selectedEntry.deviceId) {
            this.savedWhatsappDeviceId = null;
            return '';
        }

        const collapsedDevices = [selectedEntry];
        const shouldPersistCollapsedCatalog = devices.length !== 1
            || String(normalized.selectedDeviceId || '').trim() !== String(selectedEntry.deviceId || '').trim();

        if (shouldPersistCollapsedCatalog) {
            const saveResult = await this._writeWhatsappDeviceCatalog(selectedEntry.deviceId, collapsedDevices, normalized.meta);
            if (!saveResult) {
                console.warn('ConnectorsTab: failed to persist collapsed single-device WhatsApp catalog before startup', {
                    selectedDeviceId: selectedEntry.deviceId
                });
            }
        }

        this.savedWhatsappDeviceId = String(selectedEntry.deviceId || '').trim() || null;
        this.savedWhatsappDevices = collapsedDevices;
        return this.savedWhatsappDeviceId || '';
    }

    async _loadSavedWhatsappDeviceInfo(retryCount = 0) {
        try {
            await Promise.resolve(this.whatsappDeviceCatalogWritePromise).catch(() => false);
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasFn = dbHandle && typeof dbHandle.getWhatsappDeviceInfo === 'function';
            //console.log('ConnectorsTab: _loadSavedWhatsappDeviceInfo called', { hashedMasterKey, hasDbHandle: !!dbHandle, hasFn, retryCount });

            if (!hashedMasterKey || !dbHandle || !hasFn) {
                const missingMetas = {
                    hashedMasterKey: !!hashedMasterKey,
                    dbHandle: !!dbHandle,
                    getWhatsappDeviceInfoFn: hasFn
                };
                console.info('ConnectorsTab: _loadSavedWhatsappDeviceInfo missing hashed key or DB handle', missingMetas, { retryCount });

                if (retryCount < 12 && hashedMasterKey) {
                    // Wait for PaiperworkDB to initialize in the app startup flow.
                    await new Promise(resolve => setTimeout(resolve, 250));
                    return this._loadSavedWhatsappDeviceInfo(retryCount + 1);
                }

                return null;
            }

            if (typeof dbHandle.initializeDatabase === 'function') {
                //console.info('ConnectorsTab: _loadSavedWhatsappDeviceInfo initializing DB handle', { hashedMasterKey });
                await dbHandle.initializeDatabase(hashedMasterKey);
            }

            const info = await dbHandle.getWhatsappDeviceInfo(hashedMasterKey);
            /* console.info('ConnectorsTab: _loadSavedWhatsappDeviceInfo read saved device info', {
                info
            }); */
            if (!info) {
                //console.info('ConnectorsTab: _loadSavedWhatsappDeviceInfo no WhatsApp device info found');
            } else {
                //console.info('ConnectorsTab: _loadSavedWhatsappDeviceInfo retrieved info', info);
            }

            const runtimeSelectedDeviceId = String(this.savedWhatsappDeviceId || '').trim();
            const normalized = this._applyWhatsappDeviceCatalogState(info);
            const selectedDeviceId = String(normalized.selectedDeviceId || '').trim();
            const runtimeSelectedEntry = runtimeSelectedDeviceId && this._isWhatsappPairedDeviceId(runtimeSelectedDeviceId)
                ? this._findBestWhatsappDeviceCatalogEntry(normalized.devices, runtimeSelectedDeviceId)
                : null;
            const selectedEntry = selectedDeviceId
                ? this._findBestWhatsappDeviceCatalogEntry(normalized.devices, selectedDeviceId, normalized.meta || null)
                : null;
            if (runtimeSelectedEntry && runtimeSelectedEntry.deviceId && this._isWhatsappPairedDeviceId(runtimeSelectedEntry.deviceId)) {
                this.savedWhatsappDeviceId = runtimeSelectedEntry.deviceId;
            } else if (selectedEntry && selectedEntry.deviceId && this._isWhatsappPairedDeviceId(selectedEntry.deviceId)) {
                this.savedWhatsappDeviceId = selectedEntry.deviceId;
            } else if (normalized.devices.length === 1 && normalized.devices[0] && normalized.devices[0].deviceId && this._isWhatsappPairedDeviceId(normalized.devices[0].deviceId)) {
                this.savedWhatsappDeviceId = normalized.devices[0].deviceId;
            } else {
                this.savedWhatsappDeviceId = null;
            }

            return info;
        } catch (err) {
            console.warn('ConnectorsTab: _loadSavedWhatsappDeviceInfo failed', err);
            return null;
        }
    }

    async _saveCurrentWhatsappDeviceInfo(targetDeviceId = null, retryCount = 0) {
        try {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasFn = dbHandle && typeof dbHandle.saveWhatsappDeviceInfo === 'function';
            //console.log('ConnectorsTab: _saveCurrentWhatsappDeviceInfo called', { hashedMasterKey, hasDbHandle: !!dbHandle, hasFn, retryCount });

            if (!hashedMasterKey || !dbHandle || !hasFn) {
                /*console.log('ConnectorsTab: _saveCurrentWhatsappDeviceInfo missing hashed key or DB handle', {
                    hashedMasterKey: !!hashedMasterKey,
                    dbHandle: !!dbHandle,
                    saveFn: hasFn
                });*/

                if (retryCount < 6 && hashedMasterKey) {
                    await new Promise(resolve => setTimeout(resolve, 250));
                    return this._saveCurrentWhatsappDeviceInfo(targetDeviceId, retryCount + 1);
                }

                return;
            }

            const params = this._appendWhatsappUserScope(new URLSearchParams());
            const res = await fetch(`/api/whatsapp/devices?${params.toString()}`, {
                headers: this._getWhatsappUserScopedHeaders(),
                cache: 'no-store'
            });
            //console.log('ConnectorsTab: /api/whatsapp/devices returned', { status: res.status });
            if (!res.ok) {
                console.warn('ConnectorsTab: _saveCurrentWhatsappDeviceInfo no devices, status', res.status);
                return;
            }
            const body = await res.json();
            const devices = Array.isArray(body.results) ? body.results : (Array.isArray(body) ? body : []);
            //console.log('ConnectorsTab: _saveCurrentWhatsappDeviceInfo devices', devices);
            const desiredDeviceId = this._resolveSavedWhatsappCatalogDeviceId(targetDeviceId || this.savedWhatsappDeviceId || '');
            const normalizedDesiredDeviceId = this._normalizeWhatsappDeviceIdentity(desiredDeviceId);
            const desiredDeviceIsPaired = this._isWhatsappPairedDeviceId(desiredDeviceId);
            const selectedDeviceId = this._resolveSavedWhatsappCatalogDeviceId(this.savedWhatsappDeviceId || '');
            const normalizedSelectedDeviceId = this._normalizeWhatsappDeviceIdentity(selectedDeviceId);
            const connectedDevices = devices.filter(d => d && d.state === 'logged_in');
            let connectedDevice = null;

            const connectedDeviceIds = connectedDevices
                .map(d => String((d && (d.id || d.device || d.device_id)) || '').trim())
                .filter(Boolean);

            const connectedSelectionDevice = normalizedSelectedDeviceId
                ? connectedDevices.find(d => {
                    const candidateDeviceId = String((d && (d.id || d.device || d.device_id)) || '').trim();
                    return this._normalizeWhatsappDeviceIdentity(candidateDeviceId) === normalizedSelectedDeviceId;
                }) || null
                : null;

            const isFreshPairPlaceholder = String(desiredDeviceId || '').startsWith('pw-');
            if (normalizedDesiredDeviceId) {
                connectedDevice = connectedDevices.find(d => {
                    const candidateDeviceId = String((d && (d.id || d.device || d.device_id)) || '').trim();
                    return this._normalizeWhatsappDeviceIdentity(candidateDeviceId) === normalizedDesiredDeviceId;
                }) || null;

                if (!connectedDevice && isFreshPairPlaceholder && connectedDevices.length > 0) {
                    const normalizedCurrentSelected = normalizedSelectedDeviceId;
                    const candidateDevices = connectedDevices
                        .map(d => {
                            const candidateDeviceId = String((d && (d.id || d.device || d.device_id)) || '').trim();
                            return {
                                raw: d,
                                deviceId: candidateDeviceId,
                                normalized: this._normalizeWhatsappDeviceIdentity(candidateDeviceId),
                                rank: this._getWhatsappDeviceCatalogRank({ deviceId: candidateDeviceId, state: String(d && d.state || '').trim() })
                            };
                        })
                        .filter(entry => entry.normalized && entry.normalized !== normalizedCurrentSelected);

                    candidateDevices.sort((left, right) => right.rank - left.rank);
                    connectedDevice = (candidateDevices[0] && candidateDevices[0].raw) || connectedDevices[0] || null;

                    if (connectedDevice) {
                        console.info('ConnectorsTab: _saveCurrentWhatsappDeviceInfo resolved new connected device for fresh-pair placeholder', {
                            desiredDeviceId,
                            chosenDeviceId: String((connectedDevice && (connectedDevice.id || connectedDevice.device || connectedDevice.device_id)) || '').trim(),
                            connectedDeviceIds
                        });
                    }
                }

                if (!connectedDevice && desiredDeviceIsPaired) {
                    if (connectedSelectionDevice && selectedDeviceId && selectedDeviceId !== desiredDeviceId) {
                        return;
                    }

                    if (retryCount < 12 && (this.serverStarted || this.serverStarting)) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        return this._saveCurrentWhatsappDeviceInfo(targetDeviceId, retryCount + 1);
                    }

                    if (!connectedDevice && connectedDevices.length > 0) {
                        console.warn('ConnectorsTab: _saveCurrentWhatsappDeviceInfo preserving explicit paired device selection because no connected device matched the requested identity', {
                            desiredDeviceId,
                            savedWhatsappDeviceId: selectedDeviceId || null,
                            connectedDeviceIds
                        });
                    }
                    return;
                }
            }

            if (!connectedDevice && connectedDevices.length === 1) {
                connectedDevice = connectedDevices[0] || null;
            }

            const resolvedConnectedDeviceId = String((connectedDevice && (connectedDevice.id || connectedDevice.device || connectedDevice.device_id)) || '').trim();
            if (!connectedDevice || !resolvedConnectedDeviceId) {
                //console.log('ConnectorsTab: _saveCurrentWhatsappDeviceInfo found no connected device');
                return;
            }

            if ((desiredDeviceId && desiredDeviceId !== resolvedConnectedDeviceId) || (selectedDeviceId && selectedDeviceId !== resolvedConnectedDeviceId)) {
                await this._migrateSavedWhatsappSessionBundle([desiredDeviceId, selectedDeviceId], resolvedConnectedDeviceId);
            }

            const metadata = {};
            if (connectedDevice.phone_number) {
                metadata.phone_number = connectedDevice.phone_number;
            }
            if (connectedDevice.display_name) {
                metadata.display_name = connectedDevice.display_name;
            }
            if (connectedDevice.jid) {
                metadata.jid = connectedDevice.jid;
            }
            if (connectedDevice.state) {
                metadata.state = connectedDevice.state;
            }
            if (connectedDevice.created_at) {
                metadata.created_at = connectedDevice.created_at;
            }

            await this._upsertSavedWhatsappDevice(resolvedConnectedDeviceId, metadata);
            try {
                await this._captureWhatsappSessionBundle(resolvedConnectedDeviceId);
            } catch (captureErr) {
                console.warn('ConnectorsTab: failed to capture session bundle after save', captureErr);
            }
            if (this.whatsappUnpairButton) {
                this.whatsappUnpairButton.disabled = false;
                this.whatsappUnpairButton.style.display = 'inline-block';
            }
        } catch (err) {
            console.warn('ConnectorsTab: _saveCurrentWhatsappDeviceInfo failed', err);
        }
    }

    async _clearSavedWhatsappDeviceInfo() {
        try {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasFn = dbHandle && typeof dbHandle.clearWhatsappDeviceInfo === 'function';
            if (!hashedMasterKey || !dbHandle || !hasFn) {
                //console.log('ConnectorsTab: _clearSavedWhatsappDeviceInfo skipped - missing hashed key or DB handle', { hashedMasterKey: !!hashedMasterKey, dbHandle: !!dbHandle, clearFn: hasFn });
                return;
            }
            await dbHandle.clearWhatsappDeviceInfo(hashedMasterKey);
            if (typeof dbHandle.clearAllWhatsappSessionBundles === 'function') {
                await dbHandle.clearAllWhatsappSessionBundles(hashedMasterKey);
            }
            if (typeof dbHandle.clearAllWhatsappPhoneContexts === 'function') {
                await dbHandle.clearAllWhatsappPhoneContexts(hashedMasterKey);
            }
            this.savedWhatsappDeviceId = null;
            this.savedWhatsappDevices = [];
            this.whatsappSessionImportedForDevice = null;
            this.whatsappSessionRestoreSkippedForDevice = null;
            this.whatsappStalePreferredDeviceCleared = null;
            if (this.whatsappUnpairButton) {
                this.whatsappUnpairButton.disabled = true;
                this.whatsappUnpairButton.style.display = 'none';
            }
            //console.log('ConnectorsTab: Cleared saved WhatsApp device info from DB');
        } catch (err) {
            console.warn('ConnectorsTab: _clearSavedWhatsappDeviceInfo failed', err);
        }
    }

    async _deleteSavedWhatsappDeviceOnServer(deviceId, reason = '') {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        const resolvedDeviceId = String(deviceId || '').trim();
        if (!hashedMasterKey || !resolvedDeviceId) {
            return;
        }

        const params = this._appendWhatsappUserScope(new URLSearchParams());
        params.set('device_id', resolvedDeviceId);
        if (reason) {
            params.set('reason', String(reason));
        }

        const response = await fetch('/api/whatsapp/devices?' + params.toString(), {
            method: 'DELETE',
            headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' })
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }
    }

    async _resetStoredWhatsappDeviceForFreshPairing(reason = '') {
        try {
            //console.log('ConnectorsTab: resetting stored WhatsApp device for fresh pairing', { reason });
            const activeDeviceId = String(this.savedWhatsappDeviceId || '').trim();
            await this._clearWhatsappRuntimeSession(activeDeviceId || null);
            await this._clearStoredWhatsappDeviceSelection(activeDeviceId || null, reason || 'device-reset');
        } catch (err) {
            console.warn('ConnectorsTab: _resetStoredWhatsappDeviceForFreshPairing failed', err);
        }
    }

    async _clearStoredWhatsappDeviceSelection(deviceId = null, reason = 'device-reset') {
        try {
            const resolvedDeviceId = String(deviceId || this.savedWhatsappDeviceId || '').trim();
            const info = await this._loadSavedWhatsappDeviceInfo();
            const normalized = this._normalizeWhatsappDeviceCatalog(info);

            if (!normalized.devices.length) {
                await this._clearSavedWhatsappDeviceInfo();
            } else {
                const saveResult = await this._writeWhatsappDeviceCatalog('', normalized.devices, normalized.meta);
                if (!saveResult) {
                    console.warn('ConnectorsTab: failed to clear selected WhatsApp device while preserving saved catalog', {
                        reason,
                        deviceId: resolvedDeviceId || null
                    });
                }
            }
            if (resolvedDeviceId) {
                this.whatsappStalePreferredDeviceCleared = resolvedDeviceId;
            }
        } catch (err) {
            console.warn('ConnectorsTab: _clearStoredWhatsappDeviceSelection failed', err);
        }
    }

    async _maybeClearStalePreferredDeviceOnQrFallback(data) {
        const hadSavedDevice = String(this.savedWhatsappDeviceId || '').trim();
        const hasQrFallback = !!(data && data.qrDataUrl);
        const isConnected = !!(data && data.loggedIn);
        if (!hadSavedDevice || !hasQrFallback || isConnected) {
            return;
        }

        // Do not clear saved device selection just because QR exists.
        // In NoDisk/startup races, backend can temporarily return a QR while the preferred
        // device is still valid. Only clear when backend signals explicit stale/deleted state.
        const statusText = [
            String((data && data.status) || ''),
            String((data && data.reason) || ''),
            String((data && data.message) || ''),
            String((data && data.error) || ''),
            String((data && data.details) || '')
        ].join(' ').toLowerCase();

        const explicitStaleDevice = /(remote logout|logged out from phone|removed from phone whatsapp|device unlinked from phone|remote_logout)/.test(statusText);
        if (!explicitStaleDevice) {
            /*console.log('ConnectorsTab: keeping saved device selection during QR fallback (no explicit stale-device signal)', {
                hadSavedDevice,
                status: data && data.status,
                reason: data && data.reason
            });*/
            return;
        }

        if (this.whatsappStalePreferredDeviceCleared === hadSavedDevice) {
            return;
        }

        //console.log('ConnectorsTab: removing saved device because QR fallback indicates explicit phone-side unlink', { hadSavedDevice });
        await this._forgetSavedWhatsappDeviceAfterUnpair(hadSavedDevice, 'qr-fallback-remote-unpair');
        this.setWhatsappSessionRestoreStatus('Session restore: unpaired device removed from saved list, waiting for fresh pairing.');
    }

    async _clearSavedWhatsappSessionBundle(deviceId = null) {
        try {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            const resolvedDeviceId = String(deviceId || this.savedWhatsappDeviceId || '').trim();
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasFn = dbHandle && typeof dbHandle.clearWhatsappSessionBundle === 'function';
            if (!hashedMasterKey || !resolvedDeviceId || !dbHandle || !hasFn) {
				/*console.log('ConnectorsTab: _clearSavedWhatsappSessionBundle skipped', {
					hasHashedMasterKey: !!hashedMasterKey,
					resolvedDeviceId,
					hasDbHandle: !!dbHandle,
					hasClearFunction: !!hasFn
				});*/
                return;
            }

            await dbHandle.clearWhatsappSessionBundle(hashedMasterKey, resolvedDeviceId);
			/*console.log('ConnectorsTab: _clearSavedWhatsappSessionBundle cleared session bundle', {
				resolvedDeviceId
			});*/
        } catch (err) {
            console.warn('ConnectorsTab: _clearSavedWhatsappSessionBundle failed', err);
        }
    }

    async _clearWhatsappRuntimeSession(deviceId = null) {
        try {
            const resolvedDeviceId = String(deviceId || this.savedWhatsappDeviceId || '').trim();
            if (!resolvedDeviceId) {
                return;
            }
            const params = new URLSearchParams();
            params.set('device_id', resolvedDeviceId);
            this._appendWhatsappUserScope(params);
            const response = await fetch('/api/whatsapp/session?' + params.toString(), {
                method: 'DELETE',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' })
            });
            if (!response.ok && response.status !== 503 && response.status !== 412) {
                console.warn('ConnectorsTab: _clearWhatsappRuntimeSession non-ok response', response.status, await response.text().catch(() => ''));
            }
        } catch (err) {
            console.warn('ConnectorsTab: _clearWhatsappRuntimeSession failed', err);
        }
    }

    async _captureWhatsappSessionBundle(deviceId = null) {
        const resolvedDeviceId = String(deviceId || this.savedWhatsappDeviceId || '').trim();
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!resolvedDeviceId || !hashedMasterKey) {
            return false;
        }

        try {
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasFn = dbHandle && typeof dbHandle.saveWhatsappSessionBundle === 'function';
            if (!hasFn) {
                return false;
            }

            const params = new URLSearchParams();
            params.set('device_id', resolvedDeviceId);
            this._appendWhatsappUserScope(params);
            const response = await fetch('/api/whatsapp/session/export?' + params.toString(), {
                method: 'GET',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' })
            });
            if (!response.ok) {
                return false;
            }

            const payload = await response.json();
            const session = payload && payload.results && payload.results.session;
            if (!session || typeof session !== 'object') {
                return false;
            }

            await dbHandle.saveWhatsappSessionBundle(hashedMasterKey, resolvedDeviceId, session, {
                source: 'gowa-export',
                capturedAt: new Date().toISOString()
            });

            return true;
        } catch (err) {
            console.warn('ConnectorsTab: _captureWhatsappSessionBundle failed', err);
            return false;
        }
    }

    async _hasSavedWhatsappSessionBundle(deviceId = null) {
        const resolvedDeviceId = String(deviceId || this.savedWhatsappDeviceId || '').trim();
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!resolvedDeviceId || !hashedMasterKey) {
            return false;
        }

        try {
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasGetFn = dbHandle && typeof dbHandle.getWhatsappSessionBundle === 'function';
            if (!hasGetFn) {
                return false;
            }
            const stored = await dbHandle.getWhatsappSessionBundle(hashedMasterKey, resolvedDeviceId);
            return !!(stored && stored.session && typeof stored.session === 'object');
        } catch (err) {
            console.warn('ConnectorsTab: _hasSavedWhatsappSessionBundle failed', err);
            return false;
        }
    }

    async _canonicalizeSavedWhatsappDeviceForRestore(deviceId) {
        const resolvedDeviceId = String(deviceId || '').trim();
        if (!resolvedDeviceId) {
            return '';
        }

        const persistedCandidateDeviceId = this._resolveSavedWhatsappPersistableDeviceId(resolvedDeviceId);
        if (persistedCandidateDeviceId && persistedCandidateDeviceId !== resolvedDeviceId) {
            return persistedCandidateDeviceId;
        }

        const savedEntry = (Array.isArray(this.savedWhatsappDevices) ? this.savedWhatsappDevices : [])
            .find(entry => String(entry && entry.deviceId || '').trim() === resolvedDeviceId) || null;

        const { available, devices } = await this._fetchAuthoritativeWhatsappDevicesFromServer();
        if (!available || !Array.isArray(devices) || !devices.length) {
            return resolvedDeviceId;
        }

        const bestEntry = this._findBestWhatsappDeviceCatalogEntry(devices, resolvedDeviceId, savedEntry)
            || this._findBestWhatsappDeviceCatalogEntry(this.savedWhatsappDevices, resolvedDeviceId, savedEntry);
        const canonicalDeviceId = String(bestEntry && bestEntry.deviceId || resolvedDeviceId).trim();
        if (!canonicalDeviceId || canonicalDeviceId === resolvedDeviceId) {
            return resolvedDeviceId;
        }

        await this._upsertSavedWhatsappDevice(canonicalDeviceId, bestEntry || {}, { select: true });
        return canonicalDeviceId;
    }

    async _resolveSavedWhatsappSessionBundle(deviceId) {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        const resolvedDeviceId = String(deviceId || '').trim();
        if (!hashedMasterKey || !resolvedDeviceId) {
            return { deviceId: resolvedDeviceId, stored: null };
        }

        const savedEntry = (Array.isArray(this.savedWhatsappDevices) ? this.savedWhatsappDevices : [])
            .find(entry => String(entry && entry.deviceId || '').trim() === resolvedDeviceId) || null;

        const dbHandle = await this._getPaiperworkDBHandle();
        const hasGetFn = dbHandle && typeof dbHandle.getWhatsappSessionBundle === 'function';
        const hasSaveFn = dbHandle && typeof dbHandle.saveWhatsappSessionBundle === 'function';
        const hasClearFn = dbHandle && typeof dbHandle.clearWhatsappSessionBundle === 'function';
        if (!hasGetFn) {
            return { deviceId: resolvedDeviceId, stored: null };
        }

        const directStored = await dbHandle.getWhatsappSessionBundle(hashedMasterKey, resolvedDeviceId);
        if (directStored && directStored.session && typeof directStored.session === 'object') {
            return { deviceId: resolvedDeviceId, stored: directStored };
        }

        const matchingEntries = (Array.isArray(this.savedWhatsappDevices) ? this.savedWhatsappDevices : [])
            .filter(entry => this._matchesWhatsappDeviceReference(entry, resolvedDeviceId, savedEntry));
        const candidateIds = [...new Set(matchingEntries
            .sort((left, right) => this._getWhatsappDeviceCatalogRank(right) - this._getWhatsappDeviceCatalogRank(left))
            .map(entry => String(entry && entry.deviceId || '').trim())
            .filter(candidateDeviceId => candidateDeviceId && candidateDeviceId !== resolvedDeviceId))];

        for (const candidateDeviceId of candidateIds) {
            const stored = await dbHandle.getWhatsappSessionBundle(hashedMasterKey, candidateDeviceId);
            if (!stored || !stored.session || typeof stored.session !== 'object') {
                continue;
            }

            if (hasSaveFn && hasClearFn) {
                await dbHandle.saveWhatsappSessionBundle(hashedMasterKey, resolvedDeviceId, stored.session, {
                    ...(stored.metadata && typeof stored.metadata === 'object' ? stored.metadata : {}),
                    migratedFrom: candidateDeviceId,
                    migratedAt: new Date().toISOString()
                });
                await dbHandle.clearWhatsappSessionBundle(hashedMasterKey, candidateDeviceId);
            }

            /*console.log('ConnectorsTab: resolved whatsapp session bundle from alias device', {
                resolvedDeviceId,
                candidateDeviceId
            });*/
            return {
                deviceId: resolvedDeviceId,
                stored: {
                    ...stored,
                    deviceId: resolvedDeviceId
                }
            };
        }

        return { deviceId: resolvedDeviceId, stored: null };
    }

    async _restoreWhatsappSessionBundleIfNeeded(force = false) {
        let resolvedDeviceId = String(this.savedWhatsappDeviceId || '').trim();
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!resolvedDeviceId || !hashedMasterKey) {
            this.setWhatsappSessionRestoreStatus('Session restore: no saved session found.');
            return false;
        }

        resolvedDeviceId = await this._canonicalizeSavedWhatsappDeviceForRestore(resolvedDeviceId);
        if (resolvedDeviceId && resolvedDeviceId !== this.savedWhatsappDeviceId) {
            this.savedWhatsappDeviceId = resolvedDeviceId;
        }

        if (!force && this.whatsappSessionImportedForDevice === resolvedDeviceId) {
            this.setWhatsappSessionRestoreStatus('Session restore: already loaded for this device.');
            return false;
        }

        if (!force && this.whatsappSessionRestoreSkippedForDevice === resolvedDeviceId) {
            this.setWhatsappSessionRestoreStatus('Session restore: using persisted gateway session for this device.');
            return false;
        }

        try {
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasGetFn = dbHandle && typeof dbHandle.getWhatsappSessionBundle === 'function';
            if (!hasGetFn) {
                this.setWhatsappSessionRestoreStatus('Session restore: local session API unavailable.');
                return false;
            }

            const { stored } = await this._resolveSavedWhatsappSessionBundle(resolvedDeviceId);
            if (!stored || !stored.session || typeof stored.session !== 'object') {
                this.whatsappSessionRestoreSkippedForDevice = resolvedDeviceId;
                this.setWhatsappSessionRestoreStatus('Session restore: no local bundle found, continuing with persisted gateway session.');
                return false;
            }

            const response = await fetch('/api/whatsapp/session/import', {
                method: 'POST',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    device_id: resolvedDeviceId,
                    session: stored.session
                })
            });

            if (!response.ok) {
                console.warn('ConnectorsTab: _restoreWhatsappSessionBundleIfNeeded import failed', await response.text());
                this.whatsappSessionRestoreSkippedForDevice = resolvedDeviceId;
                this.setWhatsappSessionRestoreStatus('Session restore: import failed, continuing with persisted gateway session.');
                return false;
            }

            const reconnectResponse = await fetch('/api/whatsapp/session/reconnect', {
                method: 'POST',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    device_id: resolvedDeviceId
                })
            });
            if (!reconnectResponse.ok) {
                console.warn('ConnectorsTab: _restoreWhatsappSessionBundleIfNeeded reconnect failed', await reconnectResponse.text());
                this.whatsappSessionRestoreSkippedForDevice = resolvedDeviceId;
                this.setWhatsappSessionRestoreStatus('Session restore: reconnect request failed, continuing with persisted gateway session.');
                return false;
            }

            this.whatsappSessionImportedForDevice = resolvedDeviceId;
            this.whatsappSessionRestoreSkippedForDevice = null;
            this.setWhatsappSessionRestoreStatus('Session restore: imported successfully, reconnecting saved device.');
            return true;
        } catch (err) {
            console.warn('ConnectorsTab: _restoreWhatsappSessionBundleIfNeeded failed', err);
            this.whatsappSessionRestoreSkippedForDevice = resolvedDeviceId;
            this.setWhatsappSessionRestoreStatus('Session restore: error, continuing with persisted gateway session.');
            return false;
        }
    }

    async _enableWhatsappFreshPairFallback(reason = 'session-restore-unavailable') {
        const hasMultipleSavedDevices = this._hasMultipleSavedWhatsappDevices();
        const activeSavedDeviceId = String(this.savedWhatsappDeviceId || '').trim();
        /*('ConnectorsTab: _enableWhatsappFreshPairFallback requested', {
            reason,
            savedWhatsappDeviceId: activeSavedDeviceId || null,
            hasMultipleSavedDevices
        });*/

        if (hasMultipleSavedDevices && activeSavedDeviceId) {
            this.whatsappSessionImportedForDevice = null;
            this.whatsappSessionRestoreSkippedForDevice = null;
            this.savedWhatsappDeviceId = null;
            if (this.serverStarted && !this.serverStopping) {
                await this.stopWhatsappServer();
                this.setWhatsappModalPhase('starting', 'Saved device restore failed. Server stopped; choose another saved device or pair new.');
            } else {
                this.setWhatsappModalStatus('Saved device restore failed. Choose another saved device or use Pair new device.');
            }
            return;
        }

        if (this.whatsappFreshPairRequested) {
            return;
        }

        this._setWhatsappFreshPairRequested(true);
        this.whatsappFreshPairDeviceId = null;
        this.whatsappSessionImportedForDevice = null;
        this.whatsappSessionRestoreSkippedForDevice = null;

        try {
            await this._clearWhatsappRuntimeSession(this.savedWhatsappDeviceId || null);
        } catch (err) {
            console.warn('ConnectorsTab: _enableWhatsappFreshPairFallback failed to clear runtime session', err);
        }

        /*console.log('ConnectorsTab: _enableWhatsappFreshPairFallback', {
            reason,
            savedWhatsappDeviceId: this.savedWhatsappDeviceId
        });*/
    }

    _collectWhatsappEventText(payload) {
        const chunks = [];
        const push = (value) => {
            if (value === null || typeof value === 'undefined') return;
            const text = String(value).trim();
            if (text) chunks.push(text.toLowerCase());
        };

        push(payload && payload.code);
        push(payload && payload.Code);
        push(payload && payload.message);
        push(payload && payload.Message);

        const result = payload && payload.result;
        if (result && typeof result === 'object') {
            push(result.reason);
            push(result.error);
            push(result.message);
            push(result.details);
            push(result.status);
            push(result.code);
        } else {
            push(result);
        }

        return chunks.join(' | ');
    }

    _isTransientConnectivityFailure(payload) {
        const text = this._collectWhatsappEventText(payload);
        if (!text) return false;

        return /(network|offline|timeout|timed out|temporary|temporarily|unreachable|context canceled|connection refused|dns|econn|etimedout|503|502|504|transport|gateway unavailable)/.test(text);
    }

    _shouldResetStoredDeviceForEvent(code, payload) {
        const normalized = String(code || '').toUpperCase();

        if (normalized === 'DISCONNECTED') {
            return false;
        }

        if (normalized === 'REMOTE_LOGOUT') {
            return true;
        }

        return false;
    }

    _shouldDeleteSavedDeviceForEvent(code, payload) {
        const normalized = String(code || '').toUpperCase();
        if (normalized === 'REMOTE_LOGOUT') {
            return true;
        }

        if (normalized !== 'LOGOUT_COMPLETE' && normalized !== 'LOGGED_OUT') {
            return false;
        }

        const text = this._collectWhatsappEventText(payload);
        return /(remote logout|logged out from phone|removed from phone whatsapp|device unlinked from phone|remote_logout)/.test(text);
    }

    _armWhatsappQrGracePeriod() {
        const shouldDelayQr = !!this.savedWhatsappDeviceId;
        this.whatsappQrGraceUntil = shouldDelayQr ? (Date.now() + this.whatsappQrGraceMs) : 0;
    }

    _isWhatsappQrGraceActive() {
        return !!(this.whatsappQrGraceUntil && Date.now() < this.whatsappQrGraceUntil);
    }

    _shouldDelayWhatsappQrRender(data = null) {
        if (!this.savedWhatsappDeviceId) {
            return false;
        }

        if (this.isPaired || (data && data.loggedIn)) {
            return false;
        }

        return this._isWhatsappQrGraceActive();
    }

    _getWhatsappQrWithheldStatusMessage(data = null) {
        if (data && data.qrWithheld && this.savedWhatsappDeviceId) {
            return 'Saved WhatsApp device found. Waiting for a confirmed reconnect result before showing a QR code. If you unpaired it from the phone, remove it from saved devices or use Pair new device.';
        }

        if (this.savedWhatsappDeviceId) {
            return 'Recovering saved WhatsApp session, please wait...';
        }

        return 'Recovering WhatsApp session, please wait...';
    }

    setWhatsappModalStatus(message, whiteText = false) {
        const statusDiv = document.getElementById('wa-status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.style.color = whiteText ? 'var(--wa-modal-status-strong, var(--text-color, #ffffff))' : 'var(--wa-modal-status-color, #666)';
        }
    }

    _isWindowsLocalRuntime() {
        if (typeof window === 'undefined' || window.PAIPERWORK_IS_LOCAL_RUNTIME !== true) {
            return false;
        }

        const navigatorData = window.navigator || {};
        const platform = String((navigatorData.userAgentData && navigatorData.userAgentData.platform) || navigatorData.platform || '').toLowerCase();
        const userAgent = String(navigatorData.userAgent || '').toLowerCase();
        return platform.includes('win') || userAgent.includes('windows');
    }

    _extractWindowsWhatsappStartupFailureDetail(rawValue) {
        const rawText = String(rawValue || '').trim();
        if (!rawText) {
            return '';
        }

        try {
            const parsed = JSON.parse(rawText);
            const candidate = String((parsed && (parsed.message || parsed.error || parsed.detail)) || '').trim();
            if (candidate) {
                return this._extractWindowsWhatsappStartupFailureDetail(candidate);
            }
        } catch (_err) {
            // Response was not JSON; continue with raw text.
        }

        const normalized = rawText.replace(/^"+|"+$/g, '').trim();
        if (!normalized) {
            return '';
        }

        if (/^(gateway-unavailable|gateway-stopped|service unavailable|internal server error)$/i.test(normalized)) {
            return '';
        }
        if (/^<!doctype html/i.test(normalized) || /^<html/i.test(normalized)) {
            return '';
        }

        return normalized;
    }

    _shouldShowWindowsWhatsappStartupFailure(options = {}, statusCode = 0, rawDetail = '') {
        if (!this._isWindowsLocalRuntime()) {
            return false;
        }

        const startupInFlight = !!options.start || this.serverStarting || this.whatsappModalPhase === 'starting';
        if (!startupInFlight) {
            return false;
        }

        if (statusCode === 0) {
            return true;
        }

        if (statusCode >= 500) {
            return true;
        }

        return /gateway-unavailable|failed to start gateway|failed to initialize chat storage|sqlite|database|stream replaced/i.test(String(rawDetail || ''));
    }

    _showWindowsWhatsappStartupFailure(rawDetail = '') {
        const detail = this._extractWindowsWhatsappStartupFailureDetail(rawDetail);
        const baseMessage = 'Windows WhatsApp startup failed, but Paiperwork stayed open. Try Start server again. If it keeps failing, rebuild or update the Windows package.';
        const fullMessage = detail ? `${baseMessage} Detail: ${detail}` : baseMessage;

        if (this.whatsappModalPhase === 'starting' || this.serverStarting) {
            this.setWhatsappModalPhase('starting', fullMessage);
            return;
        }

        this.setWhatsappModalStatus(fullMessage);
    }

    setWhatsappModalActivitySpinner(isVisible) {
        const spinnerWrap = document.getElementById('wa-starting-spinner');
        if (!spinnerWrap) {
            return;
        }

        spinnerWrap.style.display = isVisible ? 'flex' : 'none';
    }

    setWhatsappModalPhase(phase, statusMessage = '') {
        const normalized = phase === 'qr' ? 'qr' : 'starting';
        const desiredStartingMessage = statusMessage || 'Server starting, please wait...';
        const currentPhase = this.whatsappModalPhase;

        // Keep starting-phase UI stable during poll ticks: only update text.
        if (normalized === 'starting' && currentPhase === 'starting') {
            this.setWhatsappModalStatus(desiredStartingMessage);
            this.setWhatsappModalActivitySpinner(true);
            return;
        }

        this.whatsappModalPhase = normalized;

        const titleEl = document.getElementById('wa-modal-title');
        const qrLegend = document.getElementById('wa-qr-legend');
        const qrContainer = document.getElementById('wa-qr-container');
        const statusDiv = document.getElementById('wa-status');
        const restoreStatusDiv = document.getElementById('wa-session-restore-status');

        if (normalized === 'starting') {
            this.setWhatsappModalStartStatus(false);
            this.setWhatsappModalActivitySpinner(true);
            if (titleEl) {
                titleEl.style.display = 'none';
            }
            if (qrLegend) {
                qrLegend.style.display = 'none';
                qrLegend.textContent = '';
            }
            if (qrContainer) {
                qrContainer.innerHTML = '';
            }
            if (restoreStatusDiv) {
                restoreStatusDiv.textContent = '';
                restoreStatusDiv.style.display = 'none';
            }
            if (statusDiv) {
                statusDiv.style.fontSize = '20px';
                statusDiv.style.fontWeight = '700';
                statusDiv.style.textAlign = 'center';
                statusDiv.style.color = 'var(--wa-modal-status-strong, #2f3742)';
            }
            this.clearWhatsappQrCountdown();
            this.setWhatsappModalStatus(desiredStartingMessage);
            return;
        }

        if (titleEl) {
            titleEl.style.display = 'block';
        }
        this.setWhatsappModalStartStatus(false);
        this.setWhatsappModalActivitySpinner(false);
        if (qrLegend) {
            qrLegend.style.display = 'block';
            qrLegend.innerHTML = 'Scan this QR code in WhatsApp.<br><span style="font-size:12px;color:var(--wa-modal-muted, #6d7784);">Phone: Settings > Linked devices > Link a device</span>';
        }
        if (statusDiv) {
            statusDiv.style.fontSize = '14px';
            statusDiv.style.fontWeight = '400';
            statusDiv.style.textAlign = 'center';
            statusDiv.style.color = 'var(--wa-modal-status-color, #666)';
        }
        if (statusMessage) {
            this.setWhatsappModalStatus(statusMessage);
        } else {
            this.setWhatsappModalStatus('');
        }
    }

    setWhatsappSessionRestoreStatus(message) {
        this.whatsappSessionRestoreStatus = String(message || '').trim();
        const statusDiv = document.getElementById('wa-session-restore-status');
        if (!statusDiv) {
            return;
        }
        // Keep runtime value for diagnostics, but hide from modal to reduce noise.
        statusDiv.textContent = '';
        statusDiv.style.display = 'block';
    }

    setWhatsappQrCountdown(remainingMs) {
        const countdownDiv = document.getElementById('wa-qr-countdown');
        if (!countdownDiv) return;

        if (remainingMs <= 0) {
            countdownDiv.textContent = 'QR code expired, waiting for refresh...';
            countdownDiv.style.display = 'block';
            return;
        }

        const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
        countdownDiv.textContent = `QR code valid for ${seconds}s`;
        countdownDiv.style.display = 'block';
    }

    clearWhatsappQrCountdown() {
        const countdownDiv = document.getElementById('wa-qr-countdown');
        if (!countdownDiv) return;
        countdownDiv.textContent = '';
        countdownDiv.style.display = 'none';

        if (this.qrCountdownTimer) {
            clearInterval(this.qrCountdownTimer);
            this.qrCountdownTimer = null;
        }
    }

    startWhatsappQrCountdown() {
        if (this.qrCountdownTimer) {
            clearInterval(this.qrCountdownTimer);
            this.qrCountdownTimer = null;
        }

        if (!this.lastQrTimestamp) {
            this.clearWhatsappQrCountdown();
            return;
        }

        this.qrCountdownTimer = setInterval(() => {
            const elapsed = Date.now() - this.lastQrTimestamp;
            const remaining = this.whatsappQrTTL - elapsed;
            if (remaining <= 0) {
                if (!this.whatsappQrWaitingForRefresh) {
                    this.whatsappQrWaitingForRefresh = true;
                    this.setWhatsappModalRefreshNote('Waiting for a refreshed QR code...');
                }
                this.setWhatsappQrCountdown(0);
                if (this.qrCountdownTimer) {
                    clearInterval(this.qrCountdownTimer);
                    this.qrCountdownTimer = null;
                }
                return;
            }
            this.setWhatsappQrCountdown(remaining);
        }, 1000);

        // immediate update
        const elapsed = Date.now() - this.lastQrTimestamp;
        this.setWhatsappQrCountdown(this.whatsappQrTTL - elapsed);
    }

    setWhatsappModalRefreshNote(message) {
        const noteDiv = document.getElementById('wa-qr-refresh-note');
        if (!noteDiv) return;

        // Also update countdown visibility when refresh note is set to non-empty
        const countdownDiv = document.getElementById('wa-qr-countdown');
        if (countdownDiv && message) {
            countdownDiv.style.display = 'block';
        }

        if (!message) {
            noteDiv.style.visibility = 'hidden';
            noteDiv.style.opacity = '0';
            noteDiv.textContent = '';
            return;
        }

        noteDiv.textContent = message;
        noteDiv.style.visibility = 'visible';
        noteDiv.style.opacity = '1';

        if (this.qrRefreshNoticeTimeout) {
            clearTimeout(this.qrRefreshNoticeTimeout);
            this.qrRefreshNoticeTimeout = null;
        }

        this.qrRefreshNoticeTimeout = setTimeout(() => {
            this.setWhatsappModalRefreshNote('');
        }, 3000);
    }

    setWhatsappModalCountdown(seconds) {
        // Countdown removed per requirement.
        // This function exists for backward compatibility.
    }

    startWhatsappModalCountdown() {
        this.stopWhatsappModalCountdown();
        this.qrCountdownSeconds = 60;
        this.setWhatsappModalCountdown(this.qrCountdownSeconds);
        this.qrCountdownInterval = setInterval(() => {
            this.qrCountdownSeconds = Math.max(0, this.qrCountdownSeconds - 1);
            this.setWhatsappModalCountdown(this.qrCountdownSeconds);
            if (this.qrCountdownSeconds <= 0) {
                this.stopWhatsappModalCountdown();
            }
        }, 1000);
    }

    stopWhatsappModalCountdown() {
        if (this.qrCountdownInterval) {
            clearInterval(this.qrCountdownInterval);
            this.qrCountdownInterval = null;
        }
    }

    async startWhatsappServer() {
        /*console.log('ConnectorsTab: startWhatsappServer called', {
            serverStarted: this.serverStarted,
            serverStarting: this.serverStarting,
            savedWhatsappDeviceId: this.savedWhatsappDeviceId,
            savedDeviceCount: Array.isArray(this.savedWhatsappDevices) ? this.savedWhatsappDevices.length : 0
        });*/

        this.whatsappRemoteLogoutNoticeShown = null;
        this.whatsappRemoteLogoutActive = false;
        this.whatsappSessionImportedForDevice = null;
        this.whatsappSessionRestoreSkippedForDevice = null;
        this.whatsappSessionRestoreStatus = '';

        try {
            await this._ensureWhatsappConnectorLoaded();
        } catch (loadErr) {
            console.error('ConnectorsTab: failed to load WhatsApp connector script', loadErr);
            this.setWhatsappPairButtonState(false);
            return;
        }

        if (this._isWhatsappRestartBlocked()) {
            this.setWhatsappPairButtonState(false);
            return;
        }

        if (!this._ensureWhatsappModelSelected()) {
            return;
        }

        const selectedStartDeviceId = await this._chooseSavedWhatsappDeviceForStart();
        if (selectedStartDeviceId === null) {
            return;
        }

        if (selectedStartDeviceId) {
            this._setWhatsappFreshPairRequested(false);
            this.whatsappFreshPairDeviceId = null;
        }

        await this._syncCurrentWhatsappModeSelection();

        const requestGeneration = this._beginWhatsappRequestGeneration();
        this.whatsappPairModalDismissed = false;
        this.serverStarted = true;
        this.serverStarting = true;
        this.serverStopping = false;
        this.openWhatsappPairModal(true);
        this.setWhatsappModalPhase('starting', 'Starting WhatsApp server, please wait...');
        this.setWhatsappPairButtonState(this.isPaired);

        try {
            if (selectedStartDeviceId) {
                this.savedWhatsappDeviceId = selectedStartDeviceId;
            } else {
                // Try to rehydrate stored device information from the encrypted per-user DB.
                await this._loadSavedWhatsappDeviceInfo();
            }
            const hasSavedDevices = Array.isArray(this.savedWhatsappDevices) && this.savedWhatsappDevices.length > 0;
            if (!selectedStartDeviceId) {
                this._setWhatsappFreshPairRequested(!hasSavedDevices);
                this.whatsappFreshPairDeviceId = null;
            }
            this._armWhatsappQrGracePeriod();

            const data = await this.refreshWhatsappPairButton({
                start: true,
                check: true,
                requestGeneration,
                deviceId: selectedStartDeviceId
            });

            if (!this._isWhatsappRequestActive(requestGeneration)) {
                return;
            }

            this.serverStarting = false;
            if (data && !(data.gatewayRunning || data.connected)) {
                this.serverStarted = false;
            }

            this.setWhatsappPairButtonState(this.isPaired);

            if (this.serverStarted && !this.isPaired && !this.whatsappPairModalDismissed) {
                this.openWhatsappPairModal(true);
            }
        } catch (err) {
            if (!this._isWhatsappRequestActive(requestGeneration, true)) {
                return;
            }
            this.serverStarted = false;
            this.serverStarting = false;
            this.serverStopping = false;
            this.setWhatsappPairButtonState(false);
            console.error('ConnectorsTab: failed to start server', err);
        }
    }

    async startWhatsappFreshPairing() {
        if (!this._ensureWhatsappModelSelected()) {
            return;
        }

        this.whatsappRemoteLogoutNoticeShown = null;
        this.whatsappRemoteLogoutActive = false;
        await this._syncCurrentWhatsappModeSelection();

        this._setWhatsappFreshPairRequested(true);
        this.whatsappFreshPairDeviceId = null;
        this.whatsappSessionImportedForDevice = null;
        this.whatsappSessionRestoreSkippedForDevice = null;
        this.whatsappSessionRestoreStatus = '';
        this.isPaired = false;

        if (this.serverStarted) {
            const activeDeviceId = String(this.whatsappFreshPairDeviceId || this.savedWhatsappDeviceId || '').trim();
            try {
                await this._clearWhatsappRuntimeSession(activeDeviceId || null);
            } catch (err) {
                console.warn('ConnectorsTab: failed to clear runtime session before fresh pairing restart', err);
            }

            await this.stopWhatsappServer({ suppressRestartBlock: true, preserveFreshPairRequested: true });
            this._setWhatsappRestartBlocked(0);
            this._setWhatsappFreshPairRequested(true);
            this.whatsappFreshPairDeviceId = null;
        }

        const requestGeneration = this._beginWhatsappRequestGeneration();
        this.whatsappPairModalDismissed = false;
        this.serverStarted = true;
        this.serverStarting = true;
        this.serverStopping = false;
        this.setWhatsappPairButtonState(this.isPaired);

        try {
            this.openWhatsappPairModal(true);
        } catch (e) {
            console.warn('ConnectorsTab: openWhatsappPairModal failed during fresh pair start', e);
        }

        try {
            await this._loadSavedWhatsappDeviceInfo();
            this._armWhatsappQrGracePeriod();

            const data = await this.refreshWhatsappPairButton({ start: true, check: true, requestGeneration, freshPair: true });

            if (!this._isWhatsappRequestActive(requestGeneration)) {
                return;
            }

            this.serverStarting = false;
            if (data && !(data.gatewayRunning || data.connected)) {
                this.serverStarted = false;
            }

            this.setWhatsappPairButtonState(this.isPaired);

            if (this.serverStarted && !this.isPaired && !this.whatsappPairModalDismissed) {
                this.openWhatsappPairModal(true);
            }
        } catch (err) {
            if (!this._isWhatsappRequestActive(requestGeneration, true)) {
                return;
            }
            this.serverStarted = false;
            this.serverStarting = false;
            this.serverStopping = false;
            this._setWhatsappFreshPairRequested(false);
            this.setWhatsappPairButtonState(false);
            console.error('ConnectorsTab: failed to start fresh WhatsApp pairing', err);
        }
    }

    async _waitForWhatsappGatewayStop(timeoutMs = 15000, intervalMs = 400) {
        const deadline = Date.now() + timeoutMs;

        while (Date.now() < deadline) {
            try {
                const params = this._appendWhatsappUserScope(new URLSearchParams());
                const res = await fetch('/api/whatsapp/gateway-info?' + params.toString(), {
                    cache: 'no-store',
                    headers: this._getWhatsappUserScopedHeaders()
                });
                if (res.ok) {
                    const data = await res.json();
                    if (!data || data.gatewayRunning !== true) {
                        return true;
                    }
                }
            } catch (err) {
                console.warn('ConnectorsTab: gateway-info poll during stop failed', err);
            }

            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }

        return false;
    }

    async _fetchWhatsappGatewayInfo() {
        try {
            const params = this._appendWhatsappUserScope(new URLSearchParams());
            const res = await fetch('/api/whatsapp/gateway-info?' + params.toString(), {
                cache: 'no-store',
                headers: this._getWhatsappUserScopedHeaders()
            });
            if (!res.ok) {
                return null;
            }
            return await res.json();
        } catch (err) {
            console.warn('ConnectorsTab: gateway-info fetch failed', err);
            return null;
        }
    }

    async _closeWhatsappPairModalIfGatewayRecovered(modal, requestGeneration, source = 'gateway-info') {
        const gatewayInfo = await this._fetchWhatsappGatewayInfo();
        if (!this._isWhatsappRequestActive(requestGeneration)) {
            return false;
        }
        if (gatewayInfo && gatewayInfo.gatewayRunning && gatewayInfo.loggedIn) {
            /*console.log('ConnectorsTab: closing QR modal after recovered gateway login', {
                source,
                gatewayInfo
            });*/
            this._completeWhatsappPairingFlow(modal, source);
            return true;
        }

        if (gatewayInfo && gatewayInfo.gatewayRunning && await this._hasRecoveredLoggedInWhatsappSavedDevice(String((gatewayInfo && gatewayInfo.deviceId) || '').trim())) {
            this._completeWhatsappPairingFlow(modal, source + ':saved-device');
            return true;
        }

        return false;
    }

    async _hasRecoveredLoggedInWhatsappSavedDevice(targetDeviceId = '') {
        const requestedDeviceId = String(targetDeviceId || this.savedWhatsappDeviceId || '').trim();
        if (!requestedDeviceId) {
            return false;
        }

        try {
            await this._saveCurrentWhatsappDeviceInfo(requestedDeviceId);
        } catch (err) {
            console.warn('ConnectorsTab: saved-device recovery verification failed', err);
        }

        const resolvedDeviceId = this._resolveSavedWhatsappCatalogDeviceId(requestedDeviceId || this.savedWhatsappDeviceId || '');
        const savedEntry = this._findBestWhatsappDeviceCatalogEntry(this.savedWhatsappDevices, resolvedDeviceId || requestedDeviceId) || null;
        return String((savedEntry && savedEntry.state) || '').trim().toLowerCase() === 'logged_in';
    }

    _showNoModelSelectedModal(message) {
        const existing = document.getElementById('wa-no-model-modal');
        if (existing) {
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'wa-no-model-modal';
        overlay.style.cssText = 'position: fixed; top:0; left:0; width:100%; height:100%; background:var(--modal-overlay-bg, rgba(0,0,0,0.6)); display:flex; align-items:center; justify-content:center; z-index:99999;';

        const dialog = document.createElement('div');
        dialog.style.cssText = 'width:min(440px,calc(100vw-32px)); background:var(--wa-modal-bg, var(--card-bg,#fff)); color:var(--wa-modal-text, var(--text-color,#000)); border:1px solid var(--wa-modal-border, var(--border-color,#ccc)); border-radius:10px; padding:18px; text-align:center; box-shadow:var(--wa-modal-shadow, 0 18px 55px rgba(15,23,42,0.22));';

        const title = document.createElement('h3');
        title.style.margin = '0 0 10px 0';
        title.style.fontSize = '18px';
        title.textContent = (window.Lang && Lang.get('modelSelectionRequired')) || 'Model selection required';

        const msg = document.createElement('p');
        msg.style.margin = '0 0 14px 0';
        msg.style.lineHeight = '1.45';
        msg.style.color = 'var(--wa-modal-muted, var(--text-color, #000))';
        msg.textContent = message;

        const chatBtn = document.createElement('button');
        chatBtn.style.cssText = 'margin:0 8px 0 0; padding:9px 14px; border:none; border-radius:8px; background:var(--accent-color,#4f46e5); color:#fff; cursor:pointer; font-weight:600;';
        chatBtn.textContent = (window.Lang && Lang.get('switchToChatTab')) || 'Go to Chat Tab';
        chatBtn.addEventListener('click', () => {
            if (window.tabManager && typeof window.tabManager.switchTab === 'function') {
                window.tabManager.switchTab('chat-tab');
            } else {
                const chatTabButton = document.querySelector('.tab-button[data-tab="chat"]');
                if (chatTabButton) {
                    chatTabButton.click();
                }
            }
            if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
        });

        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = 'padding:9px 14px; border:1px solid var(--wa-modal-secondary-btn-border, var(--border-color,#d0d7de)); border-radius:8px; background:var(--wa-modal-secondary-btn-bg, var(--panel-background, #e5e7eb)); color:var(--wa-modal-secondary-btn-text, var(--text-color, #111)); cursor:pointer; font-weight:600; transition:background-color 120ms ease, border-color 120ms ease, color 120ms ease;';
        closeBtn.textContent = (window.Lang && Lang.get('cancel')) || 'Cancel';
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'var(--wa-modal-secondary-btn-hover-bg, var(--wa-modal-secondary-btn-bg, var(--panel-background, #e5e7eb)))';
            closeBtn.style.borderColor = 'var(--wa-modal-secondary-btn-hover-border, var(--wa-modal-secondary-btn-border, var(--border-color,#d0d7de)))';
            closeBtn.style.color = 'var(--wa-modal-secondary-btn-hover-text, var(--wa-modal-secondary-btn-text, var(--text-color, #111)))';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'var(--wa-modal-secondary-btn-bg, var(--panel-background, #e5e7eb))';
            closeBtn.style.borderColor = 'var(--wa-modal-secondary-btn-border, var(--border-color,#d0d7de))';
            closeBtn.style.color = 'var(--wa-modal-secondary-btn-text, var(--text-color, #111))';
        });
        closeBtn.addEventListener('click', () => {
            if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
        });

        dialog.appendChild(title);
        dialog.appendChild(msg);
        dialog.appendChild(chatBtn);
        dialog.appendChild(closeBtn);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }

    async stopWhatsappServer(options = {}) {
        const { suppressRestartBlock = false, preserveFreshPairRequested = false } = options || {};
        //console.log('ConnectorsTab: stopWhatsappServer called');
        this.serverStopping = true;
        this.serverStarting = false;
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('whatsappUnpaired'));
        }
        if (!preserveFreshPairRequested) {
            this._setWhatsappFreshPairRequested(false);
        }
        this.whatsappSessionImportedForDevice = null;
        this.whatsappSessionRestoreSkippedForDevice = null;
        this.whatsappSessionRestoreStatus = '';
        this.setWhatsappPairButtonState(this.isPaired);
        this._cancelWhatsappAsyncWork({ manualStop: true });
        this.whatsappWebsocketShouldReconnect = false;
        try {
            const res = await this._requestWhatsappServerStop();
            if (!res.ok) {
                console.warn('ConnectorsTab: stop Whatsapp server failed', await res.text());
            }
        } catch (err) {
            console.warn('ConnectorsTab: stopWhatsappServer request failed', err);
        }

        await this._waitForWhatsappGatewayStop();

        this.serverStarted = false;
        this.serverStarting = false;
        this.serverStopping = false;
        this.whatsappPairModalDismissed = false;
        if (suppressRestartBlock) {
            this._setWhatsappRestartBlocked(0);
        } else {
            this._setWhatsappRestartBlocked(5000);
        }
        this.isPaired = false;
        this.closeWhatsappPairModal();
        this.stopWhatsappWebsocketListener();
        this.stopPolling();
        this.stopWhatsappModalCountdown();
        this.setWhatsappPairButtonState(false);
        this.setWhatsappModalStatus('WhatsApp server stopped.');
    }

    async refreshWhatsappPairButton(options = { start: false, check: true }) {
        //console.log('ConnectorsTab: refreshWhatsappPairButton called', options);
        if (!this.whatsappButton) {
            console.warn('ConnectorsTab: refreshWhatsappPairButton called but whatsappButton missing');
            return;
        }

        const requestGeneration = typeof options.requestGeneration === 'number'
            ? options.requestGeneration
            : this.whatsappRequestGeneration;

        if (!this._isWhatsappRequestActive(requestGeneration)) {
            return null;
        }

        let controller = null;

        try {
            const params = new URLSearchParams();
            if (options.start) params.set('start', 'true');
            if (options.check) params.set('check', 'true');
            const freshPairRequested = !!options.freshPair || this.whatsappFreshPairRequested;
            const activeFreshPairDeviceId = String(this.whatsappFreshPairDeviceId || '').trim();
            if (freshPairRequested) {
                params.set('fresh_pair', 'true');
            }

            let candidateSavedDeviceId = '';
            const explicitRequestedDeviceId = freshPairRequested ? '' : String(options.deviceId || '').trim();
            if (freshPairRequested) {
                candidateSavedDeviceId = activeFreshPairDeviceId;
            } else {
                candidateSavedDeviceId = this._resolveSavedWhatsappStartupDeviceId(explicitRequestedDeviceId || this.savedWhatsappDeviceId || '');
            }
            if (!freshPairRequested && !candidateSavedDeviceId) {
                const info = await this._loadSavedWhatsappDeviceInfo();
                const normalizedInfo = this._normalizeWhatsappDeviceCatalog(info);
                const normalizedSelectedDeviceId = this._resolveSavedWhatsappStartupDeviceId(normalizedInfo.selectedDeviceId || '');
                if (normalizedSelectedDeviceId) {
                    candidateSavedDeviceId = normalizedSelectedDeviceId;
                    this.savedWhatsappDeviceId = normalizedSelectedDeviceId;
                } else if (this._hasMultipleSavedWhatsappDevices()) {
                    candidateSavedDeviceId = '';
                } else if (info && info.deviceId) {
                    const normalizedInfoDeviceId = this._resolveSavedWhatsappStartupDeviceId(info.deviceId || '');
                    candidateSavedDeviceId = normalizedInfoDeviceId;
                    this.savedWhatsappDeviceId = normalizedInfoDeviceId || null;
                }
            }
            if (candidateSavedDeviceId) {
                params.set('device_id', candidateSavedDeviceId);
				if (await this._hasSavedWhatsappSessionBundle(candidateSavedDeviceId)) {
					params.set('restore_session', 'true');
				}
            }

            if (options.start && !freshPairRequested) {
                try {
                    await this._syncSavedWhatsappCatalogToServer();
                } catch (syncErr) {
                    console.warn('ConnectorsTab: failed to sync saved WhatsApp device catalog before startup', syncErr);
                }
            }

            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            if (hashedMasterKey) {
                params.set('user', hashedMasterKey);
            }

            const url = `/api/whatsapp/qr?${params.toString()}`;

            //console.log('ConnectorsTab: refreshWhatsappPairButton fetching', url);
            const fetchOptions = {};
            if (typeof AbortController !== 'undefined') {
                controller = new AbortController();
                this.whatsappPendingFetchControllers.add(controller);
                fetchOptions.signal = controller.signal;
            }
            const res = await fetch(url, fetchOptions);
            if (controller) {
                this.whatsappPendingFetchControllers.delete(controller);
                controller = null;
            }
            //console.log('ConnectorsTab: refreshWhatsappPairButton response status', res.status);
            if (res.status === 409) {
                const errorBody = await res.json().catch(() => ({}));
                if (!this._isWhatsappRequestActive(requestGeneration)) {
                    return null;
                }
                const message = errorBody.message || 'WhatsApp gateway locked to another user session. Please stop and restart for this user key.';
                this.setWhatsappPairButtonState(false);
                this.setWhatsappModalStatus(message);
                console.warn('ConnectorsTab: refreshWhatsappPairButton user mismatch', errorBody);
                return;
            }
            if (res.status === 412) {
                const errorBody = await res.json().catch(() => ({}));
                if (!this._isWhatsappRequestActive(requestGeneration)) {
                    return null;
                }
                this.setWhatsappPairButtonState(false);
                this.setWhatsappModalStatus(String((errorBody && errorBody.message) || 'Reconnect could not resolve the stored WhatsApp device. Use Pair new device if the saved pairing is no longer valid.'));
                return null;
            }
            if (!res.ok) {
                if (!this._isWhatsappRequestActive(requestGeneration)) {
                    return null;
                }
                const errorText = await res.text().catch(() => '');
                if (this._shouldShowWindowsWhatsappStartupFailure(options, res.status, errorText)) {
                    this._showWindowsWhatsappStartupFailure(errorText);
                }
                console.warn('ConnectorsTab: refreshWhatsappPairButton non-ok response', res.status, errorText);
                await this.setWhatsappPairButtonState(false);
                return {
                    gatewayRunning: false,
                    connected: false,
                    loggedIn: false,
                    status: 'error',
                    httpStatus: res.status
                };
            }

            const data = await res.json();
            if (!this._isWhatsappRequestActive(requestGeneration)) {
                return null;
            }

            const responseDeviceId = String((data && (data.deviceId || data.device_id)) || '').trim();
            if (responseDeviceId) {
                if (freshPairRequested) {
                    this.whatsappFreshPairDeviceId = responseDeviceId;
                    if (data && data.loggedIn) {
                        this.savedWhatsappDeviceId = responseDeviceId;
                    }
                } else if (candidateSavedDeviceId && this._isWhatsappPairedDeviceId(responseDeviceId)) {
                    this.savedWhatsappDeviceId = responseDeviceId;
                } else if (data && data.loggedIn && this._isWhatsappPairedDeviceId(responseDeviceId)) {
                    this.savedWhatsappDeviceId = responseDeviceId;
                }
            }

            this._syncWhatsappQrTTL(data);

            if (data && data.status === 'stopped' && typeof data.message === 'string' && data.message.toLowerCase().includes('manual stop')) {
                this._handleWhatsappManualStopInProgress(data.message);
                return data;
            }

            if (data && data.status === 'stopped' && String(data.reason || '').toLowerCase() === 'remote_logout') {
                await this._handleWhatsappRemoteLogout(String((data && (data.deviceId || data.device_id)) || '').trim() || this.savedWhatsappDeviceId || null);
                return data;
            }

            //console.log('ConnectorsTab: refreshWhatsappPairButton data', data);

            await this._maybeClearStalePreferredDeviceOnQrFallback(data);

            const justStarted = this.serverStarted == false && data.gatewayRunning;
            if (data.gatewayRunning) {
                this.serverStarted = true;
                if (this.whatsappWebsocketShouldReconnect || options.start || this.serverStarting) {
                    this.whatsappWebsocketShouldReconnect = true;
                    this.ensureWhatsappWebsocketListener(data);
                }
                if (!freshPairRequested && !!data.loggedIn) {
					await this._reconcileSavedWhatsappDevicesWithAuthoritativeDevices('refreshWhatsappPairButton');
				}
            }

            // Do not automatically stop the gateway while pairing checks are in flight.
            // This avoids race conditions when gowa is starting and reporting gatewayRunning=true but not yet connected.
            // if (!data.connected && data.gatewayRunning && !options.start) {
            //     //console.log('ConnectorsTab: gateway running but not connected, stopping gateway to reset');
            //     await fetch('/api/whatsapp/qr?stop=true');
            // }

            // Treat only authenticated session as paired.
            // `connected=true` can happen during QR phase before login completes.
            const isPaired = !!data.loggedIn;

            // Only attempt session import once gateway is actually running.
            // This avoids calling session import during passive tab checks
            // when the embedded gateway has not been started yet.
            const restoreCandidateDeviceId = this._resolveSavedWhatsappStartupDeviceId(this.savedWhatsappDeviceId || '');
            if (!freshPairRequested && !isPaired && data.gatewayRunning && restoreCandidateDeviceId) {
                await this._restoreWhatsappSessionBundleIfNeeded();
            }

            const shouldSaveDevice = isPaired;
            const shouldClearDeviceInfo = !isPaired && this.serverStarted && !data.gatewayRunning && !options.start;
            let modalStatus;

            if (options.start) {
                modalStatus = 'Starting gateway...';
            } else if (data.gatewayRunning) {
                if (data.loggedIn) {
                    modalStatus = 'WhatsApp connected.';
                } else if (data.qrWithheld) {
                    modalStatus = this._getWhatsappQrWithheldStatusMessage(data);
                } else if (data.qrDataUrl) {
                    modalStatus = 'Gateway running, scan QR code in the window.';
                } else {
                    modalStatus = 'Gateway running; waiting for session recovery (no QR yet).';
                }
            } else {
                modalStatus = 'WhatsApp gateway is not running. Click Pair to start.';
            }

            // Avoid flicker: keep the explicit starting-phase message stable
            // while polling/status checks run.
            const isStartingPhase = this.whatsappModalPhase === 'starting';
            if (!isStartingPhase || isPaired || !!data.qrDataUrl) {
                this.setWhatsappModalStatus(modalStatus);
            }

            // Do not set `lastQrDataUrl`/`lastQrTimestamp` here - leave DOM
            // updates and timestamping to the QR polling logic to avoid a
            // race where refresh sets the cached value before the modal has
            // actually inserted the image element.

            await this.setWhatsappPairButtonState(isPaired);
            if (isPaired) {
				if (shouldSaveDevice) {
                    await this._saveCurrentWhatsappDeviceInfo(this.savedWhatsappDeviceId || null);
				}
				this.whatsappSessionImportedForDevice = this.savedWhatsappDeviceId || null;
                this.whatsappSessionRestoreSkippedForDevice = null;
                this.whatsappStalePreferredDeviceCleared = null;
            } else if (shouldClearDeviceInfo) {
                // Preserve the saved catalog across stop/unpaired transitions so users can
                // choose among previously paired devices on the next start.
                await this._clearStoredWhatsappDeviceSelection(this.savedWhatsappDeviceId || null, 'gateway-stopped-unpaired');
            } else {
                //console.log('ConnectorsTab: refreshWhatsappPairButton not clearing saved device info (startup/unconfirmed state)', { data, serverStarted: this.serverStarted });
            }

            return data;
        } catch (err) {
            if (controller) {
                this.whatsappPendingFetchControllers.delete(controller);
            }
            if (err && err.name === 'AbortError') {
                return null;
            }
            if (!this._isWhatsappRequestActive(requestGeneration, true)) {
                return null;
            }
            console.warn('ConnectorsTab: refreshWhatsappPairButton failed', err);
            if (this._shouldShowWindowsWhatsappStartupFailure(options, 0, err && err.message ? err.message : '')) {
                this._showWindowsWhatsappStartupFailure(err && err.message ? err.message : '');
            }
            await this.setWhatsappPairButtonState(false);
            return null;
        }
    }

    startPolling() {
        // Clear existing interval if any
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }

        // Poll every 5 seconds
        this.pollInterval = setInterval(async () => {
            await this.refreshWhatsappPairButton();
        }, 5000);
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        if (this.qrPollInterval) {
            clearInterval(this.qrPollInterval);
            this.qrPollInterval = null;
        }
        if (this.whatsappQrRetryTimeout) {
            clearTimeout(this.whatsappQrRetryTimeout);
            this.whatsappQrRetryTimeout = null;
        }
        this.stopWhatsappModalCountdown();
    }

    startWhatsappWebsocketListener() {
        if (this.whatsappWs || typeof WebSocket === 'undefined') {
            return;
        }

        if (this.whatsappWsStartupTimer) {
            clearTimeout(this.whatsappWsStartupTimer);
            this.whatsappWsStartupTimer = null;
        }

        this.whatsappWebsocketShouldReconnect = true;

        const wsUrl = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + '127.0.0.1:3000/ws';
        let socketOpened = false;

        try {
            this.whatsappWs = new WebSocket(wsUrl);
        } catch (err) {
            console.warn('ConnectorsTab: failed to open whatsapp websocket', err);
            return;
        }

        this.whatsappWs.onopen = () => {
            socketOpened = true;
            //console.log('ConnectorsTab: whatsapp websocket connected');
        };

        this.whatsappWs.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                const code = (payload && (payload.Code || payload.code || '')).toString();

                if (code === 'LOGIN_SUCCESS' || code === 'LOGGED_IN') {
                    const eventDeviceId = this._resolveWhatsappEventDeviceId(payload);
                    const persistDeviceId = this._resolvePersistableWhatsappEventDeviceId(payload);
                    const runtimeDeviceId = this._resolveWhatsappRuntimeEventDeviceId(payload);
                    if (eventDeviceId && !this._shouldAcceptWhatsappLoginEventDevice(payload)) {
                        console.warn('ConnectorsTab: ignoring websocket login event for non-selected device during restore', {
                            eventDeviceId,
                            savedWhatsappDeviceId: this.savedWhatsappDeviceId || null
                        });
                        return;
                    }
                    if (persistDeviceId) {
                        this.savedWhatsappDeviceId = persistDeviceId;
                        this.whatsappStalePreferredDeviceCleared = null;
                    }
                    this._persistWhatsappDeviceFromLoginEvent(payload).catch(err => {
                        console.warn('ConnectorsTab: failed to persist device after websocket LOGIN_SUCCESS', err);
                    });
                    this.whatsappRemoteLogoutNoticeShown = null;
                    //console.log('ConnectorsTab: whatsapp event indicates paired', payload);
                    this._completeWhatsappPairingFlow(null, 'websocket:' + code);
                    this._syncWhatsappLoginSuccessToServer(payload).catch(err => {
                        console.warn('ConnectorsTab: post-login whatsapp backend sync failed', err);
                    });
                    if (typeof this._saveCurrentWhatsappDeviceInfo === 'function') {
						this._saveCurrentWhatsappDeviceInfo(runtimeDeviceId || persistDeviceId || eventDeviceId || this.savedWhatsappDeviceId || null).catch(err => {
                            console.warn('ConnectorsTab: save device info after websocket LOGIN_SUCCESS failed', err);
                        });
						setTimeout(() => {
							this._saveCurrentWhatsappDeviceInfo(runtimeDeviceId || persistDeviceId || eventDeviceId || this.savedWhatsappDeviceId || null).catch(err => {
								console.warn('ConnectorsTab: delayed save device info after websocket LOGIN_SUCCESS failed', err);
							});
						}, 5000);
                    }
                    this._captureWhatsappSessionBundle(runtimeDeviceId || persistDeviceId || eventDeviceId || null).catch(err => {
                        console.warn('ConnectorsTab: capture session after websocket LOGIN_SUCCESS failed', err);
                    });
                    return;
                }

                if (code === 'REMOTE_LOGOUT') {
                    const eventDeviceId = this._resolveWhatsappEventDeviceId(payload);
                    this._handleWhatsappRemoteLogout(eventDeviceId || this.savedWhatsappDeviceId || null, { force: true }).catch(err => {
                        console.warn('ConnectorsTab: failed to handle WhatsApp REMOTE_LOGOUT event', err);
                    });
                    this.setWhatsappPairButtonState(false);
                    return;
                }

                if (code === 'LOGOUT_COMPLETE' || code === 'DISCONNECTED' || code === 'LOGGED_OUT') {
                    //console.log('ConnectorsTab: whatsapp event indicates unpaired', payload);
                    const eventDeviceId = this._resolveWhatsappEventDeviceId(payload);
                    if (this._shouldDeleteSavedDeviceForEvent(code, payload)) {
                        (async () => {
                            await this._forgetSavedWhatsappDeviceAfterUnpair(eventDeviceId || this.savedWhatsappDeviceId || null, 'event-' + String(code || '').toLowerCase());
                        })().catch(err => {
                            console.warn('ConnectorsTab: failed to forget saved device after WhatsApp unpair event', err);
                        });
                        this.setWhatsappPairButtonState(false);
                        return;
                    } else if (this._shouldResetStoredDeviceForEvent(code, payload)) {
                        this._resetStoredWhatsappDeviceForFreshPairing(code).catch(err => {
                            console.warn('ConnectorsTab: failed to reset stored device after logout event', err);
                        });
                    }
                    this.setWhatsappPairButtonState(false);
                    if (this.serverStarted && !this.whatsappPairModalDismissed) {
                        this.openWhatsappPairModal();
                    }
                    return;
                }

                if (code === 'AUTHENTICATION_FAILED') {
                    //console.log('ConnectorsTab: whatsapp event indicates authentication issue', payload);
                    this.setWhatsappPairButtonState(false);
                    if (this.serverStarted && !this.whatsappPairModalDismissed) {
                        this.openWhatsappPairModal();
                    }
                    return;
                }

            } catch (err) {
                console.warn('ConnectorsTab: failed to parse whatsapp websocket message', err);
            }
        };

        this.whatsappWs.onclose = (event) => {
            //console.log('ConnectorsTab: whatsapp websocket closed', event);
            this.whatsappWs = null;
            if (this.whatsappWsReconnectTimer) {
                clearTimeout(this.whatsappWsReconnectTimer);
            }
            if (!this.whatsappWebsocketShouldReconnect || this.whatsappManualStopRequested || !this.serverStarted) {
                this.whatsappWsReconnectTimer = null;
                return;
            }
            this.whatsappWsReconnectTimer = setTimeout(() => {
                this.whatsappWsReconnectTimer = null;
                this.ensureWhatsappWebsocketListener();
            }, 3000);
        };

        this.whatsappWs.onerror = (err) => {
            if (!socketOpened && this.whatsappWebsocketShouldReconnect && this.serverStarted) {
                //console.info('ConnectorsTab: whatsapp websocket not ready yet; will retry');
                return;
            }
            console.warn('ConnectorsTab: whatsapp websocket error', err);
        };
    }

    stopWhatsappWebsocketListener() {
        this.whatsappWebsocketShouldReconnect = false;
        if (this.whatsappWsStartupTimer) {
            clearTimeout(this.whatsappWsStartupTimer);
            this.whatsappWsStartupTimer = null;
        }
        if (this.whatsappWs) {
            try {
                this.whatsappWs.close();
            } catch (err) {
                console.warn('ConnectorsTab: failed to close whatsapp websocket', err);
            }
            this.whatsappWs = null;
        }
        if (this.whatsappWsReconnectTimer) {
            clearTimeout(this.whatsappWsReconnectTimer);
            this.whatsappWsReconnectTimer = null;
        }
    }

    async ensureWhatsappWebsocketListener(gatewayInfo = null) {
        if (this.whatsappWs || typeof WebSocket === 'undefined') {
            return;
        }

        if (!this.serverStarted || this.serverStopping || this.whatsappManualStopRequested) {
            return;
        }

        const resolvedGatewayInfo = gatewayInfo || await this._fetchWhatsappGatewayInfo();
        if (resolvedGatewayInfo && resolvedGatewayInfo.gatewayRunning && resolvedGatewayInfo.websocketReady) {
            this.startWhatsappWebsocketListener();
            return;
        }

        if (this.whatsappWsStartupTimer || !this.whatsappWebsocketShouldReconnect) {
            return;
        }

        this.whatsappWsStartupTimer = setTimeout(() => {
            this.whatsappWsStartupTimer = null;
            this.ensureWhatsappWebsocketListener();
        }, 1000);
    }

    closeWhatsappPairModal() {
        const modal = document.getElementById('wa-pair-modal');
        if (modal && document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    }

    _completeWhatsappPairingFlow(modal = null, source = 'unknown') {
        //console.log('ConnectorsTab: _completeWhatsappPairingFlow', { source, isPaired: this.isPaired });
        this._cancelWhatsappAsyncWork();
        this.stopPolling();
        this.stopWhatsappModalCountdown();
        this.clearWhatsappQrCountdown();
        this._setWhatsappFreshPairRequested(false);
        this.lastQrDataUrl = '';
        this.lastQrSignature = '';
        this.lastQrTimestamp = 0;
        this.whatsappQrWaitingForRefresh = false;
        this.setWhatsappPairButtonState(true);
        this.serverStarted = true;
        this.whatsappPairModalDismissed = false;
        this.setWhatsappModalStatus('');
        this.setWhatsappModalStartStatus(false);

        const targetModal = modal || document.getElementById('wa-pair-modal');
        if (targetModal && document.body.contains(targetModal)) {
            document.body.removeChild(targetModal);
        }

        if (window.showSuccessInfo) {
            window.showSuccessInfo((window.Lang && typeof Lang.get === 'function' && Lang.get('whatsappPairedCard')) || 'WhatsApp paired successfully');
        }
    }

    // Polling for incoming WhatsApp messages is implemented in `connectorWhatsapp.js`.
    // Call the global `window.connectors` API directly (startIncomingPolling/stopIncomingPolling).

    // Sending messages and presence is implemented in `connectorWhatsapp.js`.
    // Call the global `window.connectors.postWhatsappText` and
    // `window.connectors.postWhatsappPresence` APIs directly.

    openWhatsappPairModal(force = false) {
        //console.log('ConnectorsTab: openWhatsappPairModal called');
        if (this.isPaired) {
            //console.log('ConnectorsTab: openWhatsappPairModal skipped because already paired');
            return;
        }
        if (this.whatsappRemoteLogoutActive) {
            return;
        }
        if (this.whatsappPairModalDismissed && !force) {
            //console.log('ConnectorsTab: openWhatsappPairModal skipped because modal was dismissed');
            return;
        }
        this.whatsappPairModalDismissed = false;
        let modal = document.getElementById('wa-pair-modal');
        if (!modal) {
            //console.log('ConnectorsTab: creating wa-pair-modal');
            modal = document.createElement('div');
            modal.id = 'wa-pair-modal';
            modal.className = 'wa-pair-modal';
            modal.style.position = 'fixed';
            modal.style.left = '50%';
            modal.style.top = '50%';
            modal.style.transform = 'translate(-50%, -50%)';
            modal.style.width = '360px';
            modal.style.maxWidth = 'calc(100vw - 24px)';
            modal.style.background = 'var(--wa-modal-bg, var(--card-bg, #ffffff))';
            modal.style.color = 'var(--wa-modal-text, var(--text-color, #111111))';
            modal.style.border = '1px solid var(--wa-modal-border, var(--border-color, #ccc))';
            modal.style.padding = '12px';
            modal.style.boxSizing = 'border-box';
            modal.style.maxHeight = 'calc(100vh - 32px)';
            modal.style.overflowY = 'auto';
            modal.style.zIndex = '9999';
            modal.style.boxShadow = 'var(--wa-modal-shadow, 0 4px 20px rgba(0,0,0,0.15))';
            modal.style.borderRadius = '12px';
            modal.style.fontFamily = 'var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)';
        } else {
            //console.log('ConnectorsTab: wa-pair-modal already exists');
        }

        // Create modal content
        modal.innerHTML = `
            <div class="wa-pair-modal-content">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                    <h2 id="wa-modal-title" style="margin: 0; font-size: 18px; font-weight: 600; color: var(--wa-modal-text, var(--text-color, #111111));">Pair WhatsApp</h2>
                    <button id="wa-close-modal-x" type="button" aria-label="Close pairing" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:1px solid var(--wa-modal-close-x-border, var(--border-color, #ccc));border-radius:999px;background:var(--wa-modal-close-x-bg, var(--panel-background, #f3f4f6));color:var(--wa-modal-close-x-text, var(--text-color, #111111));cursor:pointer;font-size:20px;line-height:1;transition:background-color 0.2s ease,border-color 0.2s ease,color 0.2s ease;">&times;</button>
                </div>
                <div id="wa-start-status" style="display: none; align-items: center; justify-content: center; gap: 8px; font-size: 13px; color: #0b74de; margin-bottom: 8px;">
                    <div class="wa-loading-spinner" style="width: 16px; height: 16px; border: 3px solid var(--wa-modal-spinner-track, #c4c4c4); border-top-color: var(--wa-modal-spinner-accent, #0b74de); border-top-left-radius: 50%; border-radius: 50%; margin: 0; animation: wa-spin 0.9s linear infinite;"></div>
                    <span id="wa-start-status-text">Server starting...</span>
                </div>
                <div id="wa-qr-container" style="text-align: center; margin-top: 16px; margin-bottom: 16px; background: var(--wa-modal-qr-surface, transparent); border-radius: 12px; padding: 12px;"></div>
                <div id="wa-qr-legend" style="text-align: center; font-size: 13px; color: var(--wa-modal-status-color, #4d4d4d); margin-top: 4px; margin-bottom: 8px; display: none;"></div>
                <div id="wa-status" style="text-align: center; font-size: 14px; color: var(--wa-modal-status-color, #666);"></div>
                <div id="wa-starting-spinner" style="display: none; justify-content: center; align-items: center; margin-top: 18px; margin-bottom: 2px;">
                    <div class="wa-loading-spinner" style="width: 22px; height: 22px; border: 3px solid var(--wa-modal-spinner-track, #c4c4c4); border-top-color: var(--wa-modal-spinner-accent, #0b74de); border-top-left-radius: 50%; border-radius: 50%; animation: wa-spin 0.9s linear infinite;"></div>
                </div>
                <div id="wa-session-restore-status" style="text-align: center; font-size: 12px; color: var(--wa-modal-muted, #7a7a7a); margin-top: 6px; min-height: 16px; display: none;"></div>
                <div id="wa-qr-countdown" style="text-align: center; font-size: 13px; color: var(--wa-modal-status-color, #4d4d4d); margin-top: 6px; min-height: 18px; display: none;"></div>
                <div id="wa-qr-refresh-note" style="text-align: center; font-size: 13px; color: var(--wa-modal-link, #007bff); margin-top: 8px; min-height: 18px; visibility: hidden; opacity: 0; transition: opacity 0.25s;"></div>
                <button id="wa-close-modal" style="margin-top: 18px; width: 100%; padding: 10px; background: var(--wa-modal-close-btn-bg, #4CAF50); color: var(--wa-modal-close-btn-text, #ffffff); border: 1px solid transparent; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; box-shadow: var(--wa-modal-shadow, 0 4px 20px rgba(0,0,0,0.15));">Close</button>
            </div>
        `;

        document.body.appendChild(modal);
        // Ensure modal is visible even if CSS rules set it to hidden by default
        try { modal.style.display = 'block'; } catch (_) {}

        // Start listening for gowa websocket events once the gateway is really up.
        this.whatsappWebsocketShouldReconnect = true;
        this.ensureWhatsappWebsocketListener();
        this.setWhatsappSessionRestoreStatus(this.whatsappSessionRestoreStatus);

        // Reset any cached QR URL so the poller always inserts a fresh
        // image into the modal (avoids stale/duplicate QR interference).
        try { this.lastQrDataUrl = ''; this.lastQrSignature = ''; this.lastQrTimestamp = 0; } catch (_) {}
        this.setWhatsappModalRefreshNote('');

        // Add close button handler
        const closeBtn = document.getElementById('wa-close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this._cancelWhatsappPairingAndStopServer('modal-close-button').catch(err => {
                    console.warn('ConnectorsTab: failed to stop WhatsApp server after modal close', err);
                });
            });
        }

        const closeModalX = document.getElementById('wa-close-modal-x');
        if (closeModalX) {
            closeModalX.addEventListener('mouseenter', () => {
                closeModalX.style.background = 'var(--wa-modal-close-x-hover-bg, var(--wa-modal-close-x-bg, #f3f4f6))';
                closeModalX.style.borderColor = 'var(--wa-modal-close-x-hover-border, var(--wa-modal-close-x-border, #ccc))';
                closeModalX.style.color = 'var(--wa-modal-close-x-hover-text, var(--wa-modal-close-x-text, #111111))';
            });
            closeModalX.addEventListener('mouseleave', () => {
                closeModalX.style.background = 'var(--wa-modal-close-x-bg, var(--panel-background, #f3f4f6))';
                closeModalX.style.borderColor = 'var(--wa-modal-close-x-border, var(--border-color, #ccc))';
                closeModalX.style.color = 'var(--wa-modal-close-x-text, var(--text-color, #111111))';
            });
            closeModalX.addEventListener('click', () => {
                this._cancelWhatsappPairingAndStopServer('modal-close-x').catch(err => {
                    console.warn('ConnectorsTab: failed to stop WhatsApp server after modal x close', err);
                });
            });
        }

        // Ensure spinner animation keyframes exist in DOM
        if (!document.getElementById('wa-spinner-keyframes')) {
            const spinnerStyle = document.createElement('style');
            spinnerStyle.id = 'wa-spinner-keyframes';
            spinnerStyle.textContent = `
                @keyframes wa-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(spinnerStyle);
        }

        this.setWhatsappModalPhase('starting', 'Server starting, please wait...');

        // Start polling for QR code
        this.startQrPolling(modal, this.whatsappRequestGeneration);
    }

    setWhatsappModalStartStatus(isActive, text = 'Server starting...', showSpinner = true) {
        const startStatus = document.getElementById('wa-start-status');
        const startText = document.getElementById('wa-start-status-text');

        if (!startStatus || !startText) {
            return;
        }

        startText.textContent = text;
        startText.style.color = 'var(--wa-modal-status-strong, var(--text-color, #ffffff))';

        const spinner = startStatus.querySelector('.wa-loading-spinner') || startStatus.querySelector('.loading-spinner');

        if (isActive) {
            startStatus.style.display = 'flex';
            startStatus.style.color = 'var(--wa-modal-status-strong, var(--text-color, #ffffff))';
            if (spinner) {
                spinner.style.display = showSpinner ? 'inline-block' : 'none';
            }
        } else {
            startStatus.style.display = 'none';
            if (spinner) {
                spinner.style.display = 'none';
            }
        }
    }

    async startQrPolling(modal, requestGeneration = this.whatsappRequestGeneration) {
        if (this.isPaired) {
            //console.log('ConnectorsTab: startQrPolling skipped because already paired');
            return;
        }

        let pollCount = 0;
        let unavailablePollCount = 0;
        const maxPolls = 20; // 60 seconds * 20 = 20 minutes max
        const qrTTL = this.whatsappQrTTL || 20000;

        const pollQr = async () => {
            if (!this._isWhatsappRequestActive(requestGeneration)) {
                return;
            }

            if (this.isPaired) {
                //console.log('ConnectorsTab: pollQr stopped because already paired');
                this.stopPolling();
                return;
            }

            pollCount++;
            //console.log('ConnectorsTab: pollQr tick', { pollCount });
            if (pollCount > maxPolls) {
                this.stopPolling();
                //console.log('ConnectorsTab: pollQr maxPolls reached; stopping');
                return;
            }

            try {
                let data = await this.refreshWhatsappPairButton({ check: true, requestGeneration });
                if (!this._isWhatsappRequestActive(requestGeneration)) {
                    return;
                }
                if (this.isPaired) {
                    // Pairing may have been confirmed by websocket or an earlier refresh.
                    // Ignore stale QR payloads and close the modal immediately.
                    this._completeWhatsappPairingFlow(modal, 'poll:state-isPaired');
                    return;
                }
                if (!data) {
                    unavailablePollCount += 1;

                    // If status remains unavailable for several polls, treat it as
                    // a stopped/unreachable gateway and stop background polling.
                    if (unavailablePollCount >= 5) {
                        const gatewayInfo = await this._fetchWhatsappGatewayInfo();
                        if (!this._isWhatsappRequestActive(requestGeneration)) {
                            return;
                        }

                        if (gatewayInfo && gatewayInfo.gatewayRunning) {
                            //console.log('ConnectorsTab: pollQr detected repeated unavailable status but gateway still running; keeping recovery state active');
                            this.serverStarted = true;
                            this.serverStarting = false;
                            this.setWhatsappPairButtonState(false);
                            this.setWhatsappModalPhase('starting', 'Recovering WhatsApp session, please wait...');
                            unavailablePollCount = 0;
                            return;
                        }

                        //console.log('ConnectorsTab: pollQr detected repeated unavailable status; stopping poll loop');
                        this.serverStarted = false;
                        this.serverStarting = false;
                        this.stopPolling();
                        this.stopWhatsappWebsocketListener();
                        this.setWhatsappPairButtonState(false);
                        this.setWhatsappModalPhase('starting', 'WhatsApp server stopped. Click Pair to start.');
                        return;
                    }

                    // If the status endpoint is unavailable (503) while the
                    // bundled gateway is still starting, attempt to fetch a
                    // server-cached QR image directly. The server will return
                    // cached image bytes even when the gateway API is transient.
                    const startupWaitMessage = this._shouldDelayWhatsappQrRender()
                        ? 'Recovering WhatsApp session, please wait...'
                        : 'Server starting, please wait...';
                    this.setWhatsappModalPhase('starting', startupWaitMessage);
                    if (this._shouldDelayWhatsappQrRender()) {
                        return;
                    }
                    try {
                        const qrContainer = document.getElementById('wa-qr-container');
                        const proxyParams = this._appendWhatsappUserScope(new URLSearchParams({ ts: String(Date.now()) }));
                        const proxyUrl = '/api/whatsapp/qr-image?' + proxyParams.toString();
                        const blob = await this._fetchProxiedQrBlob(proxyUrl);
                        if (!this._isWhatsappRequestActive(requestGeneration)) {
                            return;
                        }
                        if (blob) {
                            if (qrContainer) {
                                try { if (this._currentQrObjectUrl) URL.revokeObjectURL(this._currentQrObjectUrl); } catch (_) {}
                                const obj = URL.createObjectURL(blob);
                                this._currentQrObjectUrl = obj;
                                qrContainer.innerHTML = '';
                                const img = document.createElement('img');
                                img.alt = 'WhatsApp QR Code';
                                img.style.maxWidth = '200px';
                                img.style.maxHeight = '200px';
                                img.style.borderRadius = '8px';
                                img.style.border = '2px solid var(--wa-modal-qr-border, #ddd)';
                                img.src = obj;
                                qrContainer.appendChild(img);
                                //console.log('ConnectorsTab: proxied cached QR blob loaded, size=', blob.size);
                            }
                            try { this.lastQrTimestamp = Date.now(); this.startWhatsappQrCountdown(); } catch (_) {}
                            return;
                        }
                    } catch (err) {
                        console.warn('ConnectorsTab: cached QR fetch attempt failed', err);
                    }

                    this.setWhatsappModalPhase('starting', 'Server starting, please wait...');
                    return;
                }

                unavailablePollCount = 0;

                if (data.loggedIn) {
                    this._completeWhatsappPairingFlow(modal, 'poll:data-connected');
                    return;
                }

                if (data.qrWithheld) {
                    const recovered = data.gatewayRunning
                        ? await this._closeWhatsappPairModalIfGatewayRecovered(modal, requestGeneration, 'poll:qr-withheld-recovered')
                        : false;
                    if (recovered) {
                        return;
                    }

                    this.setWhatsappModalPhase('starting', this._getWhatsappQrWithheldStatusMessage(data));
                    const qrContainer = document.getElementById('wa-qr-container');
                    if (qrContainer) {
                        qrContainer.innerHTML = '';
                    }
                    this.clearWhatsappQrCountdown();
                    return;
                }

                if (!data.loggedIn && !data.qrDataUrl && data.gatewayRunning) {
                    const recovered = await this._closeWhatsappPairModalIfGatewayRecovered(modal, requestGeneration, 'poll:gateway-info-recovered');
                    if (recovered) {
                        return;
                    }
                }

                if (this.isPaired) {
                    this._completeWhatsappPairingFlow(modal, 'poll:post-connected-check');
                    return;
                }

                let qrUrl = data.qrDataUrl || data.qr;
                if (data.qrWithheld) {
                    qrUrl = '';
                }
                if (!qrUrl && data.gatewayRunning && !data.connected && !data.loggedIn) {
                    // In startup edge-cases, check-only polling can return running status
                    // without QR payload. Re-trigger a start/check request to force QR generation.
                    //console.log('ConnectorsTab: pollQr missing QR while gateway running, forcing start+check refresh');
                    const refreshed = await this.refreshWhatsappPairButton({ start: true, check: true, requestGeneration });
                    if (refreshed) {
                        data = refreshed;
                        qrUrl = data.qrWithheld ? '' : (data.qrDataUrl || data.qr);
                    }
                }

                if (!this._isWhatsappRequestActive(requestGeneration)) {
                    return;
                }

                if (this.isPaired || data.loggedIn) {
                    this._completeWhatsappPairingFlow(modal, 'poll:before-render-qr');
                    return;
                }

                if (!qrUrl && data.gatewayRunning) {
                    const recovered = await this._closeWhatsappPairModalIfGatewayRecovered(modal, requestGeneration, 'poll:before-stale-qr-render');
                    if (recovered) {
                        return;
                    }
                }

                if (!qrUrl) {
                    const noQrStatus = data.qrWithheld
                        ? this._getWhatsappQrWithheldStatusMessage(data)
                        : 'Server starting, please wait...';
                    this.setWhatsappModalPhase('starting', noQrStatus);
                }

                const qrLogPreview = !qrUrl
                    ? ''
                    : (String(qrUrl).startsWith('data:')
                        ? `<data-url len=${String(qrUrl).length}>`
                        : `${String(qrUrl).slice(0, 180)}${String(qrUrl).length > 180 ? '...(truncated)' : ''}`);
                //console.log('ConnectorsTab: pollQr got data.qrDataUrl', qrLogPreview);
                // Use the server proxy for absolute gateway URLs to avoid
                // mixed-content/CORS problems when the frontend is served over HTTPS.
                if (qrUrl) {
                    if (this._shouldDelayWhatsappQrRender(data)) {
                        this.setWhatsappModalPhase('starting', this._getWhatsappQrWithheldStatusMessage(data));
                        return;
                    }
                    this.setWhatsappModalPhase('qr');
                    const currentQr = qrUrl;
                    const currentQrIssuedAt = this._getWhatsappQrIssuedAt(data);
                    const currentQrSignature = this._getWhatsappQrSignature(data, currentQr);
                    const isNewQr = currentQrSignature !== this.lastQrSignature;

                    if (isNewQr) {
                        const updateKind = this.lastQrSignature ? 'refreshed' : 'initial';
                        this.lastQrDataUrl = currentQr;
                        this.lastQrSignature = currentQrSignature;
                        this.lastQrTimestamp = currentQrIssuedAt;
                        this.whatsappQrWaitingForRefresh = false;
                        this._logWhatsappQrUpdate(updateKind, data, currentQr);
                        this.setWhatsappModalRefreshNote(updateKind === 'refreshed' ? 'QR code refreshed.' : '');
                        this.startWhatsappQrCountdown();
                    } else if (!this.qrCountdownTimer && this.lastQrTimestamp) {
                        // Ensure countdown continues after accidental timer stop.
                        this.startWhatsappQrCountdown();
                    }

                    if (isNewQr) {
                        const qrContainer = document.getElementById('wa-qr-container');
                        const statusDiv = document.getElementById('wa-status');

                    if (qrContainer) {
                        // Clear and prepare an <img> element with handlers so we
                        // can detect load/error and only mark the QR as current
                        // when it successfully loads.
                        qrContainer.innerHTML = '';
                        const img = document.createElement('img');
                        img.alt = 'WhatsApp QR Code';
                        img.style.maxWidth = '200px';
                        img.style.maxHeight = '200px';
                        img.style.borderRadius = '8px';
                        img.style.border = '2px solid var(--wa-modal-qr-border, #ddd)';

                        const placeholderHTML = '<div class="loading-spinner"></div><p style="margin:12px 0 0 0; font-size:14px; color:var(--wa-modal-status-color, #666);">Waiting for QR...</p>' +
                            '<p style="font-size:12px;color:var(--wa-modal-muted, #444);margin-top:8px;">If QR does not appear, open <a id="wa-qr-link" style="color:var(--wa-modal-link, #007bff);" target="_blank" rel="noopener noreferrer">direct link</a></p>';

                        const showPlaceholder = () => {
                            qrContainer.innerHTML = placeholderHTML;
                            const link = document.getElementById('wa-qr-link');
                            if (link) link.href = currentQr;
                            try { this.lastQrDataUrl = ''; this.lastQrSignature = ''; this.lastQrTimestamp = 0; this.whatsappQrWaitingForRefresh = false; } catch (_) {}
                            if (this.whatsappQrRetryTimeout) {
                                clearTimeout(this.whatsappQrRetryTimeout);
                            }
                            this.whatsappQrRetryTimeout = setTimeout(() => {
                                this.whatsappQrRetryTimeout = null;
                                pollQr();
                            }, 1000);
                        };

                        // If we received an inline data URL, use it directly to avoid
                        // long URL encoding issues and proxy indirection.
                        if (currentQr.startsWith('data:')) {
                            try { if (this._currentQrObjectUrl) URL.revokeObjectURL(this._currentQrObjectUrl); } catch (_) {}
                            img.onload = () => {
                                //console.log('ConnectorsTab: inline QR data URL loaded');
                                try { this.lastQrDataUrl = currentQr; this.lastQrSignature = currentQrSignature; this.lastQrTimestamp = currentQrIssuedAt; this.startWhatsappQrCountdown(); } catch (_) {}
                                this.setWhatsappModalStartStatus(false);
                            };
                            img.onerror = (e) => {
                                console.warn('ConnectorsTab: inline QR data URL error', e);
                                showPlaceholder();
                            };
                            img.src = currentQr;
                            qrContainer.appendChild(img);
                        } else {
                            // Try server-cached proxied blob first (fast, accurate).
                            const proxyParams = this._appendWhatsappUserScope(new URLSearchParams({ ts: String(Date.now()) }));
                            const proxyUrl = '/api/whatsapp/qr-image?' + proxyParams.toString();
                            //console.log('ConnectorsTab: fetching proxied QR at', proxyUrl);
                            try {
                                const blob = await this._fetchProxiedQrBlob(proxyUrl);
                                if (blob) {
                                    try { if (this._currentQrObjectUrl) URL.revokeObjectURL(this._currentQrObjectUrl); } catch (_) {}
                                    const obj = URL.createObjectURL(blob);
                                    this._currentQrObjectUrl = obj;
                                    img.onload = () => {
                                        //console.log('ConnectorsTab: proxied QR image loaded');
                                        try { this.lastQrDataUrl = currentQr; this.lastQrSignature = currentQrSignature; this.lastQrTimestamp = currentQrIssuedAt; this.startWhatsappQrCountdown(); } catch (_) {}
                                        this.setWhatsappModalStartStatus(false);
                                    };
                                    img.onerror = (e) => {
                                        console.warn('ConnectorsTab: proxied QR image error', e);
                                        showPlaceholder();
                                    };
                                    img.src = obj;
                                    qrContainer.appendChild(img);
                                    //console.log('ConnectorsTab: proxied QR blob appended, size=', blob.size);
                                } else {
                                    // Fallback: let the browser fetch the proxied URL
                                    // directly (this will surface server-side errors
                                    // via the image onerror handler).
                                    const directProxyParams = this._appendWhatsappUserScope(new URLSearchParams({
                                        url: currentQr,
                                        ts: String(Date.now())
                                    }));
                                    const directProxy = '/api/whatsapp/qr-image?' + directProxyParams.toString();
                                    img.onload = () => {
                                        //console.log('ConnectorsTab: direct-proxy QR image loaded');
                                        try { this.lastQrDataUrl = currentQr; this.lastQrSignature = currentQrSignature; this.lastQrTimestamp = currentQrIssuedAt; this.startWhatsappQrCountdown(); } catch (_) {}
                                        this.setWhatsappModalStartStatus(false);
                                    };
                                    img.onerror = (e) => {
                                        console.warn('ConnectorsTab: direct-proxy QR image error', e);
                                        showPlaceholder();
                                    };
                                    img.src = directProxy;
                                    qrContainer.appendChild(img);
                                }
                            } catch (err) {
                                console.warn('ConnectorsTab: error fetching proxied QR', err);
                                // Final fallback: try direct image URL via proxy
                                const directProxyParams = this._appendWhatsappUserScope(new URLSearchParams({
                                    url: currentQr,
                                    ts: String(Date.now())
                                }));
                                const directProxy = '/api/whatsapp/qr-image?' + directProxyParams.toString();
                                img.onload = () => {
                                    //console.log('ConnectorsTab: direct-proxy QR image loaded after fetch error');
                                    try { this.lastQrDataUrl = currentQr; this.lastQrSignature = currentQrSignature; this.lastQrTimestamp = currentQrIssuedAt; this.startWhatsappQrCountdown(); } catch (_) {}
                                    this.setWhatsappModalStartStatus(false);
                                };
                                img.onerror = (e) => {
                                    console.warn('ConnectorsTab: direct-proxy QR image error after fetch error', e);
                                    showPlaceholder();
                                };
                                img.src = directProxy;
                                qrContainer.appendChild(img);
                            }
                        }
                    }
                }
            }

                if (this.lastQrDataUrl && Date.now() - this.lastQrTimestamp > qrTTL) {
                    if (!this.whatsappQrWaitingForRefresh) {
                        this.whatsappQrWaitingForRefresh = true;
                        this.setWhatsappModalRefreshNote('Waiting for a refreshed QR code...');
                    }
                    this.setWhatsappQrCountdown(0);
                }

            } catch (err) {
                if (!this._isWhatsappRequestActive(requestGeneration, true)) {
                    return;
                }
                console.warn('ConnectorsTab: QR polling failed', err);
                this.stopPolling();
            }
        };

    

        //console.log('ConnectorsTab: starting QR polling');
        // Countdown removed; we show refresh status message instead.
        await this.refreshWhatsappPairButton({ start: true, check: true, requestGeneration });
        if (!this._isWhatsappRequestActive(requestGeneration)) {
            return;
        }
        await pollQr();

        if (this.qrPollInterval) {
            clearInterval(this.qrPollInterval);
            this.qrPollInterval = null;
        }

        this.qrPollInterval = setInterval(() => {
            //console.log('ConnectorsTab: polling QR');
            pollQr();
        }, 3000); // 3 seconds between refresh attempts until paired
    }

    destroy() {
        this.stopPolling();
        if (this.whatsappButton) {
            this.whatsappButton.removeEventListener('click', this.openWhatsappPairModal);
        }
    }

    // Fetch a proxied QR image URL and return a Blob if successful.
    async _fetchProxiedQrBlob(proxyUrl) {
        try {
            const res = await fetch(proxyUrl, { cache: 'no-store' });
            if (!res.ok) {
                console.warn('ConnectorsTab: _fetchProxiedQrBlob non-OK status', res.status, res.statusText);
                return null;
            }
            const ct = res.headers.get('Content-Type') || '';
            if (!ct.startsWith('image')) {
                console.warn('ConnectorsTab: _fetchProxiedQrBlob non-image content-type', ct);
                return null;
            }
            const blob = await res.blob();
            return blob;
        } catch (err) {
            console.warn('ConnectorsTab: _fetchProxiedQrBlob failed', err);
            return null;
        }
    }
}

window.ConnectorsTab = ConnectorsTab;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.connectorsTab = new ConnectorsTab();
    });
} else {
    window.connectorsTab = new ConnectorsTab();
}
