class OllamaAPI {

    static localModelNames = new Set();
    static cloudModelNames = new Set();
    static pulledCloudModels = new Set();
    static taggedVisualModelNames = new Set();
    static pendingCloudAccessError = null;

    static _cachedThinkingEnabled = (window.ThinkingState && typeof window.ThinkingState.getEffectiveThinkingEnabled === 'function')
        ? window.ThinkingState.getEffectiveThinkingEnabled()
        : ((localStorage.getItem('thinkingEnabledGptOss') === 'true') || (localStorage.getItem('thinkingEnabled') === 'true'));
    static _lastThinkingCheck = Date.now();

    // Add listener for thinking state changes
    static {
        // Listen for storage events (when localStorage changes in other tabs)
        window.addEventListener('storage', (e) => {
                if (e.key === 'thinkingEnabled' || e.key === 'thinkingEnabledGptOss') {
                // prefer the gpt-oss-specific key when present
                this._cachedThinkingEnabled = (window.ThinkingState && typeof window.ThinkingState.getEffectiveThinkingEnabled === 'function')
                    ? window.ThinkingState.getEffectiveThinkingEnabled()
                    : ((localStorage.getItem('thinkingEnabledGptOss') === 'true') || (localStorage.getItem('thinkingEnabled') === 'true'));
                //console.log('🧠 OllamaAPI: Thinking state changed via storage event:', this._cachedThinkingEnabled);
            }
        });

        // Listen for custom events when thinking is toggled in same tab
        window.addEventListener('thinkingStateChanged', (e) => {
            this._cachedThinkingEnabled = e.detail.enabled;
           //console.log('🧠 OllamaAPI: Thinking state changed via custom event:', this._cachedThinkingEnabled);
        });
    }
    static totalTokensUsed = 0;
    static currentContextSize = 8192; // Default value
    static contextLimitReached = false;
    static previousContext = null;
    // When true (set by resetContext), OpenAI message history is intentionally
    // cleared so the next request starts fresh. Cleared again once a "continue
    // conversation" rebuilds history.
    static _openAIContextReset = false;
    static scrollDebounceTimeout = null;
    static {
        window.autoScrollEnabled = window.autoScrollEnabled === undefined ? true : window.autoScrollEnabled;
        window.imagesUnderTheHood = false;
    }
    static visualModels = null;
    static visualModelsSource = null;
    static lastUsedImages = []; // Store the last real images used in the conversation
    static systemPromptCache = new Map();
    static systemPromptRevision = new Map();
    static insightsRevision = new Map();


    constructor() {
    }

    static _getRevision(map, hashedMasterKey) {
        return map.get(hashedMasterKey) || 0;
    }

    static _bumpRevision(map, hashedMasterKey) {
        const next = (map.get(hashedMasterKey) || 0) + 1;
        map.set(hashedMasterKey, next);
        return next;
    }

    static invalidateSystemPromptCache(hashedMasterKey, reason = 'manual') {
        if (hashedMasterKey) {
            this.systemPromptCache.delete(hashedMasterKey);
            //console.info('[PromptCache] invalidated', { hashedMasterKey: 'present', reason });
            return;
        }

        this.systemPromptCache.clear();
        //console.info('[PromptCache] invalidated all', { reason });
    }

    static notifySystemPromptChanged(hashedMasterKey) {
        if (!hashedMasterKey) return;
        this._bumpRevision(this.systemPromptRevision, hashedMasterKey);
        this.invalidateSystemPromptCache(hashedMasterKey, 'system-prompt-changed');
    }

    static notifyInsightsChanged(hashedMasterKey) {
        if (!hashedMasterKey) return;
        this._bumpRevision(this.insightsRevision, hashedMasterKey);
        this.invalidateSystemPromptCache(hashedMasterKey, 'insights-changed');
    }

    static createStreamProcessorForRouting(isCloudRouting, existingProcessor = null) {
        if (existingProcessor instanceof StreamProcessor) {
            //console.info('[StreamRouting] Reusing StreamProcessor for display', {
                //source: isCloudRouting ? 'cloud' : 'local'
            //});
            return existingProcessor;
        }

        //console.info('[StreamRouting] Creating StreamProcessor for display', {
            //source: isCloudRouting ? 'cloud' : 'local'
        //});
        return new StreamProcessor();
    }

    static countTokens(text) {
        return text.split(/[\s,.!?;:'"()\[\]{}]+/).length;
    }

    static getOllamaRateLimitMessage() {
        return (window.Lang && typeof Lang.get === 'function' && Lang.get('ollamaRateLimitExceeded'))
            || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.';
    }

    static getOllamaSubscriptionRequiredMessage() {
        return (window.Lang && typeof Lang.get === 'function' && Lang.get('ollamaSubscriptionRequired'))
            || 'This Ollama Cloud model requires a subscription. Upgrade your Ollama plan to access it. Visit: https://ollama.com/upgrade';
    }

    static getOllamaHighVolumeSubscriptionMessage() {
        return (window.Lang && typeof Lang.get === 'function' && Lang.get('ollamaHighVolumeSubscriptionRequired'))
            || 'This Ollama Cloud model is experiencing high volume. While capacity is being added, a subscription is required for access. Visit: https://ollama.com/upgrade';
    }

    static getOllamaCloudAccessErrorDetails(error) {
        const rawMessage = String(error && error.message ? error.message : error || '');
        const message = rawMessage.toLowerCase();
        const directStatus = Number(error?.status || error?.statusCode || error?.response?.status || NaN);

        const isHighVolumeSubscription = message.includes('model is experiencing high volume')
            || message.includes('while capacity is being added');

        const hasSubscriptionLanguage = message.includes('requires a subscription')
            || message.includes('subscription is required')
            || message.includes('subscription required for access')
            || message.includes('upgrade for access')
            || message.includes('ollama.com/upgrade')
            || isHighVolumeSubscription;

        const isSubscriptionRequired = hasSubscriptionLanguage
            || (directStatus === 403 && hasSubscriptionLanguage);

        if (isSubscriptionRequired) {
            return {
                type: isHighVolumeSubscription ? 'high-volume-subscription-required' : 'subscription-required',
                title: (window.Lang && typeof Lang.get === 'function' && Lang.get(isHighVolumeSubscription ? 'ollamaHighVolumeSubscriptionRequiredTitle' : 'ollamaSubscriptionRequiredTitle'))
                    || (isHighVolumeSubscription ? 'High volume, subscription required' : 'Subscription required'),
                body: isHighVolumeSubscription ? this.getOllamaHighVolumeSubscriptionMessage() : this.getOllamaSubscriptionRequiredMessage(),
                link: 'https://ollama.com/upgrade'
            };
        }

        if (this.isOllamaRateLimitError(error)) {
            return {
                type: 'usage-limit',
                title: (window.Lang && typeof Lang.get === 'function' && Lang.get('artifactCloudLimitTitle')) || 'Cloud usage limit reached',
                body: this.getOllamaRateLimitMessage(),
                link: 'https://ollama.com/settings'
            };
        }

        return null;
    }

    static rememberCloudAccessError(error) {
        const details = this.getOllamaCloudAccessErrorDetails(error);
        this.pendingCloudAccessError = details
            ? {
                ...details,
                rawMessage: String(error && error.message ? error.message : error || '').trim(),
                timestamp: Date.now()
            }
            : null;
        return this.pendingCloudAccessError;
    }

    static consumePendingCloudAccessError() {
        const pending = this.pendingCloudAccessError;
        this.pendingCloudAccessError = null;
        return pending;
    }

    static clearPendingCloudAccessError() {
        this.pendingCloudAccessError = null;
    }

    static isWhatsappConnectorServerActive() {
        const connectorsTab = window.connectorsTab;
        if (!connectorsTab || typeof connectorsTab !== 'object') {
            return false;
        }

        return connectorsTab.serverStarted === true
            || connectorsTab.serverStarting === true
            || connectorsTab.serverStopping === true;
    }

    static isWechatConnectorServerActive() {
        const connectorsTab = window.connectorsTab;
        if (!connectorsTab || typeof connectorsTab !== 'object') {
            return false;
        }

        return connectorsTab.wechatServerStarted === true
            || connectorsTab.wechatServerStarting === true
            || connectorsTab.wechatServerStopping === true;
    }

    static isConnectorServerActive() {
        return this.isWhatsappConnectorServerActive() || this.isWechatConnectorServerActive();
    }

    static showBlockingOllamaWarning(message, options = {}) {
        const normalizedMessage = String(message || '').trim();
        if (!normalizedMessage) {
            return false;
        }

        if (this.isConnectorServerActive()) {
            /*console.info('[OllamaAPI] Suppressed blocking warning while connector server is active', {
                scope: String(options.scope || 'generic'),
                message: normalizedMessage
            });*/
            return false;
        }

        window.alert(normalizedMessage);
        return true;
    }

    static confirmBlockingOllamaWarning(message, options = {}) {
        const normalizedMessage = String(message || '').trim();
        if (!normalizedMessage) {
            return false;
        }

        if (this.isConnectorServerActive()) {
/*             console.info('[OllamaAPI] Suppressed blocking confirmation while connector server is active', {
                scope: String(options.scope || 'generic'),
                message: normalizedMessage
            }); */
            return false;
        }

        return window.confirm(normalizedMessage);
    }

    static isOllamaRateLimitStatus(status, responseText = '') {
        if (Number(status) === 429) {
            return true;
        }

        const text = String(responseText || '').toLowerCase();
        return text.includes('too many requests')
            || text.includes('weekly usage')
            || text.includes('daily limit')
            || text.includes('statuscode":429')
            || text.includes('status": "429')
            || text.includes('status":429');
    }

    static isOllamaRateLimitError(error) {
        const message = String(error && error.message ? error.message : error || '').toLowerCase();
        if (!message) {
            return false;
        }

        return message.includes('429')
            || message.includes('too many requests')
            || message.includes('weekly usage')
            || message.includes('daily limit')
            || message.includes('usage limit')
            || message.includes('ollama.com/settings');
    }

    static isOllamaSubscriptionRequiredError(error) {
        return !!(this.getOllamaCloudAccessErrorDetails(error)?.type === 'subscription-required');
    }
    
    static normalizeConversationText(text, maxChars = 1200) {
        if (typeof text !== 'string') return '';
        const normalized = text
            .replace(/\s+/g, ' ')
            .replace(/\u00a0/g, ' ')
            .trim();
        if (!normalized) return '';
        if (normalized.length <= maxChars) return normalized;
        return normalized.substring(0, maxChars) + '...';
    }
    
    static getMessageTextForHistory(messageNode, maxCharsPerTurn = 1200) {
        if (!messageNode) return '';
        
        const role = messageNode.classList.contains('user-message') ? 'user' : 'assistant';
        let text = '';
        
        if (role === 'user') {
            const userBubble = messageNode.querySelector('.message-bubble');
            text = userBubble?.textContent || '';
        } else {
            const responseContainer = messageNode.querySelector('.ai-response-container');
            const assistantBubble = messageNode.querySelector('.message-bubble');
            text = responseContainer?.textContent || assistantBubble?.textContent || '';
        }
        
        return this.normalizeConversationText(text, maxCharsPerTurn);
    }
    
    static buildCloudConversationHistoryBlock(currentUserPrompt = '', options = {}) {
        const whatsappOverride = (typeof window !== 'undefined' && window.__paiperworkWhatsappContextOverride && window.__paiperworkWhatsappContextOverride.active)
            ? window.__paiperworkWhatsappContextOverride
            : null;

        const aiReplies = document.querySelector('.ai-replies');
        const maxTurns = Number.isFinite(options.maxTurns) ? options.maxTurns : 8;
        const maxCharsPerTurn = Number.isFinite(options.maxCharsPerTurn) ? options.maxCharsPerTurn : 1200;
        const maxCharsTotal = Number.isFinite(options.maxCharsTotal) ? options.maxCharsTotal : 12000;

        const turns = [];
        if (whatsappOverride && Array.isArray(whatsappOverride.turns) && whatsappOverride.turns.length) {
            for (const turn of whatsappOverride.turns) {
                const role = String(turn && turn.role ? turn.role : '').trim().toLowerCase();
                const content = this.normalizeConversationText(turn && (turn.text || turn.content || ''), maxCharsPerTurn);
                if ((role === 'user' || role === 'assistant') && content) {
                    turns.push({ role, content });
                }
            }
        } else {
            if (!aiReplies) return '';

            const messageNodes = Array.from(aiReplies.querySelectorAll('.user-message, .assistant-message:not(.welcome-message)'));
            if (!messageNodes.length) return '';

            for (const node of messageNodes) {
                const role = node.classList.contains('user-message') ? 'user' : 'assistant';
                const content = this.getMessageTextForHistory(node, maxCharsPerTurn);
                if (content) {
                    turns.push({ role, content });
                }
            }
        }

        if (!turns.length) return '';
        
        // The active prompt is already represented by the live input/request body.
        // Remove it from history to avoid duplicating the same turn.
        const normalizedCurrentPrompt = this.normalizeConversationText(currentUserPrompt, maxCharsPerTurn);
        if (normalizedCurrentPrompt) {
            while (turns.length > 0) {
                const lastTurn = turns[turns.length - 1];
                if (lastTurn.role !== 'user') break;
                if (lastTurn.content !== normalizedCurrentPrompt) break;
                turns.pop();
            }
        }
        
        if (!turns.length) return '';
        
        const cappedTurns = turns.slice(-maxTurns * 2);
        const selectedTurns = [];
        let usedChars = 0;
        
        for (let i = cappedTurns.length - 1; i >= 0; i--) {
            const turn = cappedTurns[i];
            const cost = turn.content.length;
            if (selectedTurns.length > 0 && (usedChars + cost) > maxCharsTotal) {
                break;
            }
            selectedTurns.unshift(turn);
            usedChars += cost;
        }
        
        if (!selectedTurns.length) return '';
        
        const historyLines = selectedTurns.map(turn => `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}`);
        
        return [
            'Conversation history (prior turns):',
            historyLines.join('\n\n'),
            'Treat this as the active in-session context and continue naturally. Do not claim the conversation has no prior context.'
        ].join('\n\n');
    }

    static buildWechatConversationHistoryBlock(currentUserPrompt = '', options = {}) {
        const wechatOverride = (typeof window !== 'undefined' && window.__paiperworkwechatContextOverride && window.__paiperworkwechatContextOverride.active)
            ? window.__paiperworkwechatContextOverride
            : null;

        const aiReplies = document.querySelector('.ai-replies');
        const maxTurns = Number.isFinite(options.maxTurns) ? options.maxTurns : 8;
        const maxCharsPerTurn = Number.isFinite(options.maxCharsPerTurn) ? options.maxCharsPerTurn : 1200;
        const maxCharsTotal = Number.isFinite(options.maxCharsTotal) ? options.maxCharsTotal : 12000;

        const turns = [];
        if (wechatOverride && Array.isArray(wechatOverride.turns) && wechatOverride.turns.length) {
            for (const turn of wechatOverride.turns) {
                const role = String(turn && turn.role ? turn.role : '').trim().toLowerCase();
                const content = this.normalizeConversationText(turn && (turn.text || turn.content || ''), maxCharsPerTurn);
                if ((role === 'user' || role === 'assistant') && content) {
                    turns.push({ role, content });
                }
            }
        } else {
            if (!aiReplies) return '';

            const messageNodes = Array.from(aiReplies.querySelectorAll('.user-message, .assistant-message:not(.welcome-message)'));
            if (!messageNodes.length) return '';

            for (const node of messageNodes) {
                const role = node.classList.contains('user-message') ? 'user' : 'assistant';
                const content = this.getMessageTextForHistory(node, maxCharsPerTurn);
                if (content) {
                    turns.push({ role, content });
                }
            }
        }

        if (!turns.length) return '';
        
        const cappedTurns = turns.slice(-maxTurns * 2);
        const selectedTurns = [];
        let usedChars = 0;
        
        for (let i = cappedTurns.length - 1; i >= 0; i--) {
            const turn = cappedTurns[i];
            const cost = turn.content.length;
            if (selectedTurns.length > 0 && (usedChars + cost) > maxCharsTotal) {
                break;
            }
            selectedTurns.unshift(turn);
            usedChars += cost;
        }
        
        if (!selectedTurns.length) return '';
        
        const historyLines = selectedTurns.map(turn => `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}`);
        
        return [
            'Conversation history (prior turns):',
            historyLines.join('\n\n'),
            'Treat this as the active in-session context and continue naturally. Do not claim the conversation has no prior context.'
        ].join('\n\n');
    }
    
    static logCloudStreamDiagnostics(scope, details = {}) {
        try {
            console.warn('[CloudStream] ' + scope, details);
        } catch (_err) {
            // Logging must never break response handling.
        }
    }

    static isStreamDebugEnabled() {
        try {
            return localStorage.getItem('debugStream') === 'true';
        } catch (_err) {
            return false;
        }
    }

    static logStreamSummary(scope, details = {}) {
        if (!this.isStreamDebugEnabled()) return;
        try {
            //console.info('[StreamDebug] ' + scope, details);
        } catch (_err) {
            // Debug logging must never break response handling.
        }
    }

    static trackCloudTokenUsage(sentText = '', receivedText = '') {
        const sentTokens = sentText ? this.countTokens(String(sentText)) : 0;
        const receivedTokens = receivedText ? this.countTokens(String(receivedText)) : 0;
        this.totalTokensUsed += (sentTokens + receivedTokens);
        this.updateContextRemaining(this.totalTokensUsed);
    }

    static getModelSource(modelName) {
        if (!modelName) return null;
        const rawName = String(modelName || '').trim();
        if (rawName.toLowerCase().endsWith('-cloud')) return 'cloud';

        const candidates = this.getModelMatchCandidates(rawName);
        const setMatches = (modelSet) => {
            if (!(modelSet instanceof Set) || modelSet.size === 0) return false;

            for (const candidate of candidates) {
                if (modelSet.has(candidate)) return true;
            }

            for (const entry of modelSet) {
                const normalizedEntry = this.normalizeModelMatchName(entry);
                if (!normalizedEntry) continue;
                for (const candidate of candidates) {
                    if (candidate === normalizedEntry) return true;
                }
            }

            return false;
        };

        if (setMatches(this.cloudModelNames)) return 'cloud';
        if (setMatches(this.localModelNames)) return 'local';
        return null;
    }

    static isOnlineDeploymentMode() {
        if (window.PAIPERWORK_CLOUD_ONLY === true) return true;
        if (window.PAIPERWORK_IS_LOCAL_RUNTIME === true) return false;
        const host = String(window.location.hostname || '').toLowerCase();
        const protocol = String(window.location.protocol || '').toLowerCase();
        const isLocal = host === 'localhost'
            || host === '127.0.0.1'
            || host === '::1'
            || host === '0.0.0.0'
            || /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[0-1])\.)/.test(host)
            || protocol === 'file:'
            || protocol === 'app:'
            || protocol === 'tauri:'
            || protocol === 'capacitor:'
            || protocol === 'electron:';
        return !isLocal;
    }

    static normalizeCloudModelName(modelName) {
        const name = String(modelName || '').trim();
        if (!name) return '';
        return this.getCloudApiModelName(name);
    }

    static normalizeModelMatchName(modelName) {
        let name = String(modelName || '').trim().toLowerCase();
        if (!name) return '';

        name = name
            .replace(/\u00a0/g, ' ')
            .replace(/[：]/g, ':')
            .replace(/\((?:cloud|local)(?:\s+models?)?\)/gi, '')
            .replace(/\[(?:cloud|local)(?:\s+models?)?\]/gi, '')
            .replace(/\b(?:cloud|local)(?:\s+models?)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        return this.getCloudApiModelName(name).toLowerCase();
    }

    static getModelMatchCandidates(modelName) {
        const normalized = this.normalizeModelMatchName(modelName);
        if (!normalized) return [];

        const candidates = new Set();
        candidates.add(normalized);

        const firstToken = normalized.split(' ')[0];
        if (firstToken) candidates.add(firstToken);

        // Add family base before size/variant suffix (e.g. qwen3.5:397b -> qwen3.5)
        // so minor cloud renames in numeric size tags do not break capability matching.
        if (firstToken && firstToken.includes(':')) {
            const familyBase = firstToken.split(':')[0].trim();
            if (familyBase) candidates.add(familyBase);
        }

        if (firstToken && firstToken.includes('/')) {
            const unscoped = firstToken.split('/').pop();
            if (unscoped) candidates.add(unscoped);
        }

        return Array.from(candidates).filter(candidate => candidate && candidate.length >= 3);
    }

    // Direct ollama.com API expects model names without the -cloud suffix.
    static getCloudApiModelName(modelName) {
        const name = String(modelName || '').trim();
        if (!name) return '';
        return name
            .replace(/\((?:cloud|local)(?:\s+models?)?\)\s*$/i, '')
            .replace(/\[(?:cloud|local)(?:\s+models?)?\]\s*$/i, '')
            .replace(/\s+(?:cloud|local)(?:\s+models?)?\s*$/i, '')
            .replace(/(?:-cloud)+$/i, '')
            .trim();
    }

    // Local Ollama signed-in cloud mode expects cloud model calls through localhost with -cloud suffix.
    static getCloudLocalModelName(modelName) {
        return this.getCloudApiModelName(modelName);
    }

    static async ensureCloudModelPulled(modelName, headers) {
        const requestedModel = String(modelName || '').trim();
        const normalizedModel = this.normalizeCloudModelName(requestedModel);

        //console.info('[CloudPull] ensureCloudModelPulled called', { modelName, requestedModel, normalizedModel });

        if (!normalizedModel) return normalizedModel;
        if (this.pulledCloudModels.has(normalizedModel)) {
            //console.info('[CloudPull] already pulled in session cache', { normalizedModel });
            return normalizedModel;
        }

        //console.info('[CloudPull] request start', { endpoint: 'http://localhost:11434/api/pull', model: normalizedModel });
        const pullResponse = await fetch('http://localhost:11434/api/pull', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Match Models tab semantics: streamed pull with `name` payload.
            body: JSON.stringify({ name: normalizedModel })
        });

        if (!pullResponse.ok) {
            const text = await pullResponse.text();
            if (this.isOllamaRateLimitStatus(pullResponse.status, text)) {
                throw new Error(`${this.getOllamaRateLimitMessage()}${text ? `\n${text}` : ''}`);
            }
            console.error('[CloudPull] request failed', {
                model: normalizedModel,
                status: pullResponse.status,
                text
            });
            throw new Error(`Cloud model pull failed (${pullResponse.status}) for ${normalizedModel}: ${text || pullResponse.statusText}`);
        }

        // Consume stream updates similarly to the Models tab flow.
        if (pullResponse.body && typeof pullResponse.body.getReader === 'function') {
            const reader = pullResponse.body.getReader();
            const decoder = new TextDecoder();
            let streamBuffer = '';

            while (true) {
                const { done, value } = await reader.read();
                streamBuffer += decoder.decode(value || new Uint8Array(), { stream: !done });
                const lines = streamBuffer.split('\n');
                streamBuffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const status = JSON.parse(line);
                        const statusText = String(status?.status || '').toLowerCase();
                        if (statusText) {
                            //('[CloudPull] stream status', { model: normalizedModel, status: status.status });
                        }
                        if (status?.error) {
                            console.error('[CloudPull] stream error', { model: normalizedModel, error: status.error });
                            throw new Error(String(status.error));
                        }
                    } catch (_parseErr) {
                        // Ignore non-JSON chunk fragments while streaming.
                    }
                }

                if (done) {
                    const tail = streamBuffer.trim();
                    if (tail) {
                        try {
                            const status = JSON.parse(tail);
                            const statusText = String(status?.status || '').toLowerCase();
                            if (statusText) {
                                //('[CloudPull] stream status', { model: normalizedModel, status: status.status });
                            }
                            if (status?.error) {
                                console.error('[CloudPull] stream error', { model: normalizedModel, error: status.error });
                                throw new Error(String(status.error));
                            }
                        } catch (_parseErr) {
                            // Ignore any trailing partial fragments.
                        }
                    }
                    break;
                }
            }
        }

        this.pulledCloudModels.add(normalizedModel);
        //console.info('[CloudPull] completed and cached', { normalizedModel });
        return normalizedModel;
    }

    static getSelectedModelSource() {
        const modelSelector = document.getElementById('model-selector');
        if (!modelSelector || modelSelector.selectedIndex < 0) {
            return null;
        }

        const selectedOption = modelSelector.options[modelSelector.selectedIndex];
        if (selectedOption && selectedOption.dataset && selectedOption.dataset.provider) {
            return selectedOption.dataset.provider;
        }

        return this.getModelSource(modelSelector.value);
    }

    static isCloudModelSelected() {
        return this.getSelectedModelSource() === 'cloud';
    }

    static async getStoredCloudApiKey() {
        try {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            const dbApi = (window && window.PaiperworkDB)
                ? window.PaiperworkDB
                : (typeof PaiperworkDB !== 'undefined' ? PaiperworkDB : null);

            if (!hashedMasterKey || !dbApi || typeof dbApi.getOllamaApiKey !== 'function') {
                return '';
            }
            const key = await dbApi.getOllamaApiKey(hashedMasterKey);
            const trimmed = (key || '').trim();
            if (!trimmed) return '';
            return trimmed
                .replace(/^(?:Bearer\s+)+/i, '')
                .replace(/^['"]+|['"]+$/g, '')
                .trim();
        } catch (_err) {
            return '';
        }
    }

    static async getApiRoutingForModel(modelName) {
        const source = this.getModelSource(modelName) || this.getSelectedModelSource() || 'local';
        const isCloud = source === 'cloud';
        const baseUrl = isCloud ? '/api/cloud' : 'http://localhost:11434/api';
        const headers = { 'Content-Type': 'application/json' };
        let normalizedModelName = modelName;

        if (isCloud) {
            normalizedModelName = this.getCloudApiModelName(modelName);
            const cloudApiKey = await this.getStoredCloudApiKey();
            if (cloudApiKey) {
                headers['Authorization'] = `Bearer ${cloudApiKey}`;
            }
        }

        return { source, baseUrl, headers, modelName: normalizedModelName };
    }

    // ── OpenAI-compatible endpoint (POST /v1/chat/completions) ──────────────
    // Ollama fully supports the OpenAI Chat Completions API at:
    //   local: http://localhost:11434/v1
    //   cloud: /api/cloud/v1  (proxied by the Go server to https://ollama.com/v1)
    // Context is managed the standard OpenAI way (a `messages` array) instead
    // of the proprietary numeric token `context` array, which breaks on the
    // llama.cpp / MLX runners that newer Ollama versions use.
    static async getOpenAIRoutingForModel(modelName) {
        const source = this.getModelSource(modelName) || this.getSelectedModelSource() || 'local';
        const isCloud = source === 'cloud';
        const baseUrl = isCloud ? '/api/cloud/v1' : 'http://localhost:11434/v1';
        const headers = { 'Content-Type': 'application/json' };
        let normalizedModelName = modelName;

        if (isCloud) {
            normalizedModelName = this.getCloudApiModelName(modelName);
            const cloudApiKey = await this.getStoredCloudApiKey();
            if (cloudApiKey) {
                headers['Authorization'] = `Bearer ${cloudApiKey}`;
            }
        }

        return { source, baseUrl, headers, modelName: normalizedModelName };
    }

    // Returns true when the current chat view holds a real multi-turn conversation
    // (used by callers that previously probed the proprietary `previousContext`).
    static hasActiveConversationContext() {
        try {
            const aiReplies = document.querySelector('.ai-replies');
            if (!aiReplies) return false;
            const userMessages = aiReplies.querySelectorAll('.user-message');
            const assistantMessages = aiReplies.querySelectorAll('.assistant-message:not(.welcome-message)');
            return userMessages.length > 0 || assistantMessages.length > 0;
        } catch (_err) {
            return false;
        }
    }

    // Builds the prior conversation as standard OpenAI messages ({role, content}).
    // Source of truth, in priority order:
    //   1. options.historyMessages (caller-provided, e.g. Campaign orchestrator)
    //   2. active WhatsApp / WeChat connector override turns
    //   3. the rendered .ai-replies DOM (main chat)
    static buildOpenAIConversationMessages(currentUserPrompt = '', options = {}) {
        if (Array.isArray(options.historyMessages)) {
            if (options.historyMessages.length === 0) {
                return [];
            }
            return options.historyMessages
                .map(m => {
                    const role = String(m && m.role ? m.role : '').trim().toLowerCase();
                    const content = this.normalizeConversationText(m && (m.content ?? m.text) || '', Number.isFinite(options.maxCharsPerTurn) ? options.maxCharsPerTurn : 1200);
                    if ((role === 'user' || role === 'assistant') && content) {
                        return { role, content };
                    }
                    return null;
                })
                .filter(Boolean);
        }

        // After an explicit context reset (context/system prompt change), the next
        // request intentionally starts fresh until history is rebuilt.
        if (this._openAIContextReset) {
            return [];
        }

        const whatsappOverride = (typeof window !== 'undefined' && window.__paiperworkWhatsappContextOverride && window.__paiperworkWhatsappContextOverride.active)
            ? window.__paiperworkWhatsappContextOverride
            : null;
        const wechatOverride = (typeof window !== 'undefined' && window.__paiperworkwechatContextOverride && window.__paiperworkwechatContextOverride.active)
            ? window.__paiperworkwechatContextOverride
            : null;

        const maxTurns = Number.isFinite(options.maxTurns) ? options.maxTurns : 8;
        const maxCharsPerTurn = Number.isFinite(options.maxCharsPerTurn) ? options.maxCharsPerTurn : 1200;
        const maxCharsTotal = Number.isFinite(options.maxCharsTotal) ? options.maxCharsTotal : 12000;

        const turns = [];
        const override = whatsappOverride || wechatOverride;
        if (override && Array.isArray(override.turns) && override.turns.length) {
            for (const turn of override.turns) {
                const role = String(turn && turn.role ? turn.role : '').trim().toLowerCase();
                const content = this.normalizeConversationText(turn && (turn.text || turn.content || ''), maxCharsPerTurn);
                if ((role === 'user' || role === 'assistant') && content) {
                    turns.push({ role, content });
                }
            }
        } else {
            const aiReplies = document.querySelector('.ai-replies');
            if (!aiReplies) return [];

            const messageNodes = Array.from(aiReplies.querySelectorAll('.user-message, .assistant-message:not(.welcome-message)'));
            if (!messageNodes.length) return [];

            for (const node of messageNodes) {
                const role = node.classList.contains('user-message') ? 'user' : 'assistant';
                const content = this.getMessageTextForHistory(node, maxCharsPerTurn);
                if (content) {
                    turns.push({ role, content });
                }
            }
        }

        if (!turns.length) return [];

        // The active prompt may already be represented in the history; remove the
        // trailing duplicate of the current user turn so it is not sent twice.
        const normalizedCurrentPrompt = this.normalizeConversationText(currentUserPrompt, maxCharsPerTurn);
        if (normalizedCurrentPrompt) {
            while (turns.length > 0) {
                const lastTurn = turns[turns.length - 1];
                if (lastTurn.role !== 'user') break;
                if (lastTurn.content !== normalizedCurrentPrompt) break;
                turns.pop();
            }
        }

        if (!turns.length) return [];

        const cappedTurns = turns.slice(-maxTurns * 2);
        const selectedTurns = [];
        let usedChars = 0;

        for (let i = cappedTurns.length - 1; i >= 0; i--) {
            const turn = cappedTurns[i];
            const cost = turn.content.length;
            if (selectedTurns.length > 0 && (usedChars + cost) > maxCharsTotal) {
                break;
            }
            selectedTurns.unshift(turn);
            usedChars += cost;
        }

        return selectedTurns;
    }

    // Converts base64 image data into OpenAI content parts for a user message.
    static _buildOpenAIUserContent(prompt, images) {
        const cleanedImages = (Array.isArray(images) && images.length > 0)
            ? images.map(img => {
                let data = String(img || '');
                if (data.includes('base64,')) data = data.split('base64,')[1];
                return data;
            }).filter(Boolean)
            : [];

        if (cleanedImages.length === 0) {
            return prompt || '';
        }

        const parts = [];
        if (prompt) {
            parts.push({ type: 'text', text: prompt });
        }
        for (const img of cleanedImages) {
            parts.push({ type: 'image_url', image_url: `data:image/jpeg;base64,${img}` });
        }
        return parts;
    }

    // Builds the full OpenAI `messages` array: system + prior turns + current user turn.
    static buildOpenAIMessages(system, userPrompt, options = {}) {
        const messages = [];
        if (system && String(system).trim()) {
            messages.push({ role: 'system', content: String(system) });
        }
        const prior = this.buildOpenAIConversationMessages(userPrompt, options);
        for (const m of prior) {
            messages.push(m);
        }
        messages.push({ role: 'user', content: this._buildOpenAIUserContent(userPrompt, options.images) });
        return messages;
    }

    // Builds the POST body for /v1/chat/completions with normal OpenAI context.
    // `think` semantics: true  -> leave at model default (no field sent);
    //                    false -> reasoning_effort "none" (explicitly disable).
    static buildOpenAIChatPayload({ model, system, userPrompt, contextSize, modelParams, images, think = null, stream = true, historyMessages = null, maxTurns, maxCharsPerTurn, maxCharsTotal }) {
        const messages = this.buildOpenAIMessages(system, userPrompt, {
            images,
            historyMessages,
            maxTurns,
            maxCharsPerTurn,
            maxCharsTotal
        });

        const payload = {
            model,
            messages,
            stream: stream !== false,
            stream_options: { include_usage: true }
        };

        // Ollama's OpenAI-compatible layer maps these standard OpenAI fields, so
        // translate the app's model parameters into top-level fields. Unknown
        // Ollama options are kept in `options` for backward compatibility with
        // Ollama versions that honor them, but are ignored by current ones.
        const optionMappings = {
            temperature: 'temperature',
            top_p: 'top_p',
            stop: 'stop',
            seed: 'seed',
            frequency_penalty: 'frequency_penalty',
            presence_penalty: 'presence_penalty',
            num_predict: 'max_tokens'
        };
        if (modelParams && typeof modelParams === 'object') {
            for (const [ollamaKey, openAIKey] of Object.entries(optionMappings)) {
                if (modelParams[ollamaKey] !== undefined && modelParams[ollamaKey] !== null) {
                    payload[openAIKey] = modelParams[ollamaKey];
                }
            }
        }

        const options = {};
        const numCtx = parseInt(contextSize);
        if (Number.isFinite(numCtx) && numCtx > 0) {
            options.num_ctx = numCtx;
        }
        if (modelParams && typeof modelParams === 'object') {
            Object.assign(options, modelParams);
        }
        if (Object.keys(options).length > 0) {
            payload.options = options;
        }

        if (think === false) {
            // Explicitly disable thinking for reasoning models.
            payload.reasoning_effort = 'none';
        }
        // think === true leaves reasoning at the model's default.

        return payload;
    }

    // Parses one SSE line from /v1/chat/completions into a normalized object.
    // Returns null for non-JSON fragments; `{ done: true }` for [DONE].
    static parseOpenAIChatStreamLine(line) {
        const trimmed = String(line || '').trim();
        if (!trimmed) return null;

        const payload = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;
        if (!payload || payload === '[DONE]') {
            return { done: true };
        }

        try {
            const data = JSON.parse(payload);
            const choice = Array.isArray(data.choices) ? data.choices[0] : null;
            const delta = (choice && choice.delta) || {};
            let content = '';
            if (typeof delta.content === 'string') content = delta.content;
            let reasoning = '';
            if (typeof delta.reasoning === 'string') reasoning = delta.reasoning;
            else if (typeof delta.reasoning_content === 'string') reasoning = delta.reasoning_content;

            const usage = data.usage || null;
            const finishReason = choice && choice.finish_reason ? String(choice.finish_reason) : null;

            return {
                content,
                reasoning,
                finishReason,
                usage,
                done: payload === '[DONE]' || (Array.isArray(data.choices) && data.choices.length === 0)
            };
        } catch (_err) {
            return null;
        }
    }

    // Updates the context-remaining UI from an OpenAI usage object when present,
    // otherwise falls back to a character-based estimate.
    static updateContextFromUsage(usage, promptText = '', responseText = '') {
        if (usage && typeof usage === 'object') {
            const promptTokens = Number.isFinite(Number(usage.prompt_tokens)) ? Number(usage.prompt_tokens) : 0;
            const completionTokens = Number.isFinite(Number(usage.completion_tokens)) ? Number(usage.completion_tokens) : 0;
            const total = promptTokens + completionTokens;
            if (total > 0) {
                this.totalTokensUsed = total;
                this.updateContextRemaining(total);
                return;
            }
        }
        if (promptText || responseText) {
            this.trackCloudTokenUsage(promptText, responseText);
        }
    }

    // Reads an OpenAI /v1/chat/completions stream and re-emits it as the legacy
    // Ollama NDJSON shape (`{"response":...}`, `{"thinking":...}`, `{"done":true}`)
    // so that the many existing manual stream-draining callers keep working with
    // zero changes. Also feeds usage back into the context-remaining UI.
    // `{done:true}` is emitted exactly once, at stream end (matching the original
    // Ollama /api/generate stream contract), after all content/usage chunks.
    static openAIStreamToLegacyNDJSON(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = '';
        let assistantText = '';
        let doneReason = 'stop';

        const emitLine = (controller, obj) => {
            try {
                controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
            } catch (_err) {
                // Stream may already be closed.
            }
        };

        const processLine = (controller, line) => {
            const parsed = OllamaAPI.parseOpenAIChatStreamLine(line);
            if (!parsed) return;
            if (parsed.reasoning) {
                emitLine(controller, { thinking: parsed.reasoning });
            }
            if (parsed.content) {
                assistantText += parsed.content;
                emitLine(controller, {
                    response: parsed.content,
                    message: { role: 'assistant', content: parsed.content }
                });
            }
            if (parsed.usage) {
                OllamaAPI.updateContextFromUsage(parsed.usage, '', assistantText);
            }
            if (parsed.finishReason) {
                doneReason = parsed.finishReason;
            }
        };

        return new ReadableStream({
            async start(controller) {
                try {
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';
                        for (const line of lines) {
                            if (line.trim()) processLine(controller, line);
                        }
                    }
                    const tail = buffer.trim();
                    if (tail) processLine(controller, tail);
                    emitLine(controller, { done: true, done_reason: doneReason });
                    controller.close();
                } catch (err) {
                    try {
                        if (assistantText) {
                            emitLine(controller, { done: true, done_reason: doneReason, interrupted: true });
                        }
                        controller.close();
                    } catch (_e) {
                        try { controller.error(err); } catch (_e2) { /* ignore */ }
                    }
                }
            }
        });
    }

    static async loadOllamaModels() {
        const modelSelector = document.getElementById('model-selector');
        const onlineMode = this.isOnlineDeploymentMode();
       //console.log('Loading Ollama models...');

        try {
           //console.log('Fetching local and cloud Ollama models...');
            const cloudApiKey = await this.getStoredCloudApiKey();

            const fetchLocalTagsWithRetry = async () => {
                const timeouts = [7000, 12000];
                let lastError = null;

                for (let i = 0; i < timeouts.length; i++) {
                    try {
                        const resp = await fetch('http://localhost:11434/api/tags', {
                            signal: AbortSignal.timeout(timeouts[i])
                        });
                        if (resp.ok) {
                            return resp;
                        }
                        if (this.isOllamaRateLimitStatus(resp.status)) {
                            throw new Error(this.getOllamaRateLimitMessage());
                        }
                        lastError = new Error(`local /api/tags returned ${resp.status}`);
                    } catch (err) {
                        lastError = err;
                    }
                }

                throw lastError || new Error('local /api/tags unavailable');
            };

            const localTagsPromise = onlineMode
                ? Promise.resolve({ skipped: true })
                : fetchLocalTagsWithRetry();

            const cloudTagsTimeoutMs = 5000; // increased from 2500 to improve reliability on slow/cloud paths

            const [localResponse, cloudResponse] = await Promise.allSettled([
                localTagsPromise,
                fetch('/api/cloud/tags', {
                    // Cloud fetch should never block local model visibility.
                    signal: AbortSignal.timeout(cloudTagsTimeoutMs),
                    headers: cloudApiKey
                        ? {
                            'Authorization': `Bearer ${cloudApiKey}`
                        }
                        : undefined
                })
            ]);

            let localModels = [];
            let cloudModels = [];

            if (!onlineMode && localResponse.status === 'fulfilled' && localResponse.value.ok) {
                const localData = await localResponse.value.json();
                localModels = Array.isArray(localData.models) ? localData.models : [];

                // Normalize shape defensively in case backend returns `model` instead of `name`.
                localModels = localModels
                    .map(model => ({
                        ...model,
                        name: model?.name || model?.model || ''
                    }))
                    .filter(model => model.name);

                this._cachedLocalModels = localModels;
            } else if (!onlineMode) {
                console.warn('OllamaAPI: local /api/tags unavailable during loadOllamaModels', {
                    status: localResponse.status,
                    httpOk: localResponse.status === 'fulfilled' ? localResponse.value.ok : false
                });

                // Keep local selector usable during transient daemon startup by using cache.
                if (Array.isArray(this._cachedLocalModels) && this._cachedLocalModels.length > 0) {
                    localModels = [...this._cachedLocalModels];
                    /* console.info('OllamaAPI: using cached local models due to temporary local /api/tags failure', {
                        cachedCount: localModels.length
                    }); */
                }
            } else {
                localModels = [];
            }

            if (cloudResponse.status === 'fulfilled' && cloudResponse.value.ok) {
                const cloudData = await cloudResponse.value.json();
                cloudModels = Array.isArray(cloudData.models) ? cloudData.models : [];
            } else if (cloudResponse.status === 'fulfilled' && cloudResponse.value.status === 429) {
                console.warn('OllamaAPI: cloud model list rate-limited (429).', this.getOllamaRateLimitMessage());
            } else if (cloudResponse.status === 'rejected') {
                //console.info('OllamaAPI: cloud /api/cloud/tags unavailable or timed out; continuing with local models only');
            }

            // If local tags include already pulled cloud models, keep them only in CLOUD MODELS.
            const cloudNormalizedNames = new Set(cloudModels.map(model => this.normalizeCloudModelName(model.name)));
            localModels = localModels.filter(model => {
                const localName = String(model?.name || '').trim();
                const looksLikeCloudModel = localName.toLowerCase().endsWith('-cloud');
                if (!looksLikeCloudModel) {
                    return true;
                }
                return !cloudNormalizedNames.has(this.getCloudApiModelName(localName));
            });

            this.localModelNames = new Set(localModels.map(model => model.name));
            const cloudModelsForDisplay = cloudModels;

            const normalizedCloudDisplayNames = [];
            const seenCloudNames = new Set();
            cloudModelsForDisplay.forEach(model => {
                const normalized = this.normalizeCloudModelName(model?.name || model?.model || '');
                if (normalized && !seenCloudNames.has(normalized)) {
                    seenCloudNames.add(normalized);
                    normalizedCloudDisplayNames.push(normalized);
                }
            });

            normalizedCloudDisplayNames.sort((left, right) => left.localeCompare(right, undefined, {
                sensitivity: 'base',
                numeric: true
            }));

            this.localModelNames = onlineMode ? new Set() : new Set(localModels.map(model => model.name));
            this.cloudModelNames = new Set(normalizedCloudDisplayNames);

            // Build capability/tag-derived visual model cache from /api/tags and /api/cloud/tags data.
            // This is a hint layer only; isVisualModel() still falls back to VISUAL_MODELS list.
            const hasVisualCapabilityHint = (model) => {
                if (!model || typeof model !== 'object') return false;

                const valuesToScan = [
                    model.name,
                    model.model,
                    model.template,
                    model.modelfile,
                    model?.details?.family,
                    model?.details?.format,
                    model?.details?.parent_model,
                    model?.details?.architecture,
                    ...(Array.isArray(model?.details?.families) ? model.details.families : []),
                    ...(Array.isArray(model?.capabilities) ? model.capabilities : []),
                    ...(Array.isArray(model?.details?.capabilities) ? model.details.capabilities : [])
                ];

                return valuesToScan.some(value => {
                    const text = String(value || '').toLowerCase();
                    if (!text) return false;
                    return text.includes('vision')
                        || text.includes('vl')
                        || text.includes('multimodal')
                        || text.includes('image')
                        || text.includes('llava')
                        || text.includes('minicpm-v');
                });
            };

            this.taggedVisualModelNames = new Set();
            const registerTaggedVisual = (modelName) => {
                const candidates = this.getModelMatchCandidates(modelName);
                candidates.forEach(candidate => this.taggedVisualModelNames.add(candidate));
            };

            localModels.forEach(model => {
                if (hasVisualCapabilityHint(model)) {
                    registerTaggedVisual(model?.name || model?.model || '');
                }
            });
            cloudModelsForDisplay.forEach(model => {
                if (hasVisualCapabilityHint(model)) {
                    registerTaggedVisual(model?.name || model?.model || '');
                }
            });

            // Keep old behavior: if nothing is available at all, show guidance.
            if (localModels.length === 0 && normalizedCloudDisplayNames.length === 0) {
                console.warn('No local or cloud models found in Ollama');

                setTimeout(() => {
                    this.showBlockingOllamaWarning(Lang.get('noModelsFound') || 'No models found in Ollama.', { scope: 'load-models-empty' });
                }, 500);

                return false;
            }

            // Clear existing options first
            modelSelector.innerHTML = `<option value="">${Lang.get('selectModel')}</option>`;

            const appendGroupHeader = (label) => {
                const headerOption = document.createElement('option');
                headerOption.value = '';
                headerOption.disabled = true;
                headerOption.className = 'model-group-header';
                headerOption.textContent = `--- ${label} ---`;
                modelSelector.appendChild(headerOption);
            };

            // Add local models first.
            if (!onlineMode && localModels.length > 0) {
                appendGroupHeader('LOCAL MODELS');
                localModels.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.name;
                    option.textContent = model.name;
                    option.dataset.provider = 'local';
                    modelSelector.appendChild(option);
                });
            }

            // Then add cloud models.
            if (normalizedCloudDisplayNames.length > 0) {
                appendGroupHeader('CLOUD MODELS');
                normalizedCloudDisplayNames.forEach(normalizedCloudName => {
                    const option = document.createElement('option');
                    option.value = normalizedCloudName;
                    option.textContent = normalizedCloudName;
                    option.dataset.provider = 'cloud';
                    modelSelector.appendChild(option);
                });
            }

            if (modelSelector.options.length > 1) {
                // Keep the "Select Model" option selected initially
                modelSelector.selectedIndex = 0;
            }

            return true;
        } catch (error) {
            console.error('Error loading Ollama models:', error);

            // Show error alert with retry option
            setTimeout(() => {
                const errorMessage = error.toString().includes('Failed to fetch') ?
                    Lang.get('ollamaConnectionError') || 'Could not connect to Ollama. Please make sure Ollama is running.' :
                    Lang.get('ollamaLoadError') || 'Error loading models from Ollama.';

                const retryText = Lang.get('ollamaRetryPrompt') || 'Would you like to retry? (Make sure Ollama is running)';
                if (this.confirmBlockingOllamaWarning(`${errorMessage} ${retryText}`, { scope: 'load-models-error' })) {
                    OllamaAPI.loadOllamaModels();
                }
            }, 500);

            return false;
        }
    }
    // Returns model-specific parameters from MODEL_PARAMETERS based on the model name.
    static getModelParameters(modelName) {
        // If no parameters file is loaded or no model name provided, return empty object
        if (!window.MODEL_PARAMETERS || !modelName) {
            return {};
        }

        // Get the base model name (before any ":" separator)
        const baseModelName = modelName.split(':')[0].toLowerCase().trim();

        // First try exact match
        if (window.MODEL_PARAMETERS[baseModelName]) {
           //console.log(`OllamaAPI: Using custom parameters for ${baseModelName} (exact match)`);
            return window.MODEL_PARAMETERS[baseModelName];
        }

        // Sort parameter keys by length (descending) to prioritize more specific matches
        const sortedKeys = Object.keys(window.MODEL_PARAMETERS).sort((a, b) => b.length - a.length);

        // Then look for most specific prefix match
        for (const prefix of sortedKeys) {
            if (baseModelName.startsWith(prefix)) {
               //console.log(`OllamaAPI: Using custom parameters for ${baseModelName} (matched prefix ${prefix})`);
                return window.MODEL_PARAMETERS[prefix];
            }
        }

        // Finally, try substring match as fallback
        for (const key of sortedKeys) {
            if (baseModelName.includes(key)) {
               //console.log(`OllamaAPI: Using custom parameters for ${baseModelName} (matched substring ${key})`);
                return window.MODEL_PARAMETERS[key];
            }
        }

        // No match found, return empty object (use Ollama defaults)
       //console.log(`OllamaAPI: No custom parameters for ${baseModelName}, using defaults`);
        return {};
    }
    // Fetches metadata for a given model from the Ollama API.
    static async fetchModelMetadata(modelName, options = { autoload: true, retryDelayMs: 500 }) {
        // Returns { data, nativeContext, nativeContextPath } or null on error
        try {
            const doAutoload = options && options.autoload;
            const routing = await this.getApiRoutingForModel(modelName);
            const isLocalhostRouting = String(routing.baseUrl || '').startsWith('http://localhost:11434/api');
            const hasCloudApiKey = routing.source !== 'cloud' || !!routing.headers['Authorization'];

            // Do not call cloud metadata endpoints before a user key is configured.
            if (routing.source === 'cloud' && !hasCloudApiKey) {
                return null;
            }

            // For cloud-routed models, skip autoload entirely to avoid startup-side auth noise.
            const shouldAutoload = doAutoload && hasCloudApiKey && routing.source !== 'cloud';
            if (shouldAutoload) {
                try {
                    // Warm the model into memory through the OpenAI-compatible endpoint
                    // (single-turn, minimal output, no proprietary context involved).
                    const openAIRouting = await this.getOpenAIRoutingForModel(modelName);
                    const loadResp = await fetch(`${openAIRouting.baseUrl}/chat/completions`, {
                        method: 'POST',
                        headers: openAIRouting.headers,
                        body: JSON.stringify({
                            model: openAIRouting.modelName || modelName,
                            messages: [{ role: 'user', content: '' }],
                            stream: false,
                            max_tokens: 1
                        })
                    });
                   //console.log('OllamaAPI: Autoload response status:', loadResp.status, 'ok?', loadResp.ok);
                    if (loadResp.status === 429) {
                        console.warn('OllamaAPI: Autoload skipped due to rate limit (429)');
                    }
                    try {
                        const bodyText = await loadResp.text();
                       //console.log('OllamaAPI: Autoload response body (trimmed):', bodyText ? (bodyText.length > 1000 ? bodyText.substring(0, 1000) + '...[truncated]' : bodyText) : '<empty>');
                    } catch (e) {
                        // ignore
                    }
                } catch (e) {
                    console.warn('OllamaAPI: Autoload request failed', e);
                }
            }

            const candidateNames = ['context_length', 'context_size', 'context_window', 'num_ctx', 'max_context', 'num_context', 'context', 'n_ctx'];

            const isLikelyContextPath = (path) => {
                const lowerPath = String(path || '').toLowerCase();
                if (!lowerPath) return false;

                if (lowerPath.includes('context')) return true;

                return candidateNames.some(name =>
                    lowerPath.endsWith(`.${name}`) ||
                    lowerPath.endsWith(`_${name}`) ||
                    lowerPath.endsWith(`-${name}`) ||
                    lowerPath === name
                );
            };

            const toNumericContextValue = (value) => {
                if (typeof value === 'number' && Number.isFinite(value)) {
                    return value;
                }

                if (typeof value === 'string') {
                    const cleaned = value.trim().toLowerCase().replace(/,/g, '');

                    if (/^\d+(?:\.\d+)?$/.test(cleaned)) {
                        return Number(cleaned);
                    }

                    // Handle compact formats like "128k", "2m", "1.5b".
                    const compactMatch = cleaned.match(/^(\d+(?:\.\d+)?)([kmb])$/);
                    if (compactMatch) {
                        const n = Number(compactMatch[1]);
                        const unit = compactMatch[2];
                        if (!Number.isFinite(n)) return null;
                        if (unit === 'k') return n * 1000;
                        if (unit === 'm') return n * 1000000;
                        if (unit === 'b') return n * 1000000000;
                    }
                }

                return null;
            };

            const findContext = (obj, path = '', seen = new Set()) => {
                if (obj === null || obj === undefined) return undefined;
                if (seen.has(obj)) return undefined;
                if (typeof obj === 'number' || typeof obj === 'string') {
                    const maybeNumeric = toNumericContextValue(obj);
                    if (maybeNumeric !== null && isLikelyContextPath(path)) {
                        return { value: maybeNumeric, path };
                    }
                    return undefined;
                }
                if (typeof obj === 'object') {
                    seen.add(obj);

                    // Direct candidate names
                    for (const name of candidateNames) {
                        if (Object.prototype.hasOwnProperty.call(obj, name)) {
                            try {
                                const v = obj[name];
                                const p = path ? `${path}.${name}` : name;
                                const maybeNumeric = toNumericContextValue(v);
                                if (maybeNumeric !== null) return { value: maybeNumeric, path: p };
                                if (Array.isArray(v)) return { value: v.length, path: p };
                                if (typeof v === 'object' && v !== null && v.length !== undefined) return { value: v.length, path: p };
                            } catch (e) { /* ignore */ }
                        }
                    }

                    // Keys that contain 'context' or match candidate name endings (handles 'gptoss.context_length')
                    for (const k of Object.keys(obj)) {
                        const lower = ('' + k).toLowerCase();
                        if (lower.includes('context') || candidateNames.some(n => lower.endsWith(n))) {
                            try {
                                const v = obj[k];
                                const p = path ? `${path}.${k}` : k;
                                const maybeNumeric = toNumericContextValue(v);
                                if (maybeNumeric !== null) return { value: maybeNumeric, path: p };
                                if (Array.isArray(v) && v.length > 0) return { value: v.length, path: p };
                                const nested = findContext(v, p, seen);
                                if (nested !== undefined) return nested;
                            } catch (e) { /* ignore */ }
                        }
                    }

                    // Generic recursion into properties as a last resort.
                    // Primitive values are only accepted when their path is context-related.
                    for (const k of Object.keys(obj)) {
                        try {
                            const v = obj[k];
                            const p = path ? `${path}.${k}` : k;
                            const nested = findContext(v, p, seen);
                            if (nested !== undefined) return nested;
                        } catch (e) { /* ignore */ }
                    }
                }
                return undefined;
            };

            const attemptFetch = async (attempt) => {
                try {
                   //console.log(`OllamaAPI: Fetching metadata for ${modelName} (attempt ${attempt})`);
                    const targetName = routing.modelName || modelName;
                    const payloadCandidates = [
                        { name: targetName },
                        { model: targetName }
                    ];

                    let best = null;

                    for (let i = 0; i < payloadCandidates.length; i++) {
                        const response = await fetch(`${routing.baseUrl}/show`, {
                            method: 'POST',
                            headers: routing.headers,
                            body: JSON.stringify(payloadCandidates[i])
                        });

                        if (!response.ok) {
                            const errorText = await response.text();
                            if (this.isOllamaRateLimitStatus(response.status, errorText)) {
                                throw new Error(`${this.getOllamaRateLimitMessage()}${errorText ? `\n${errorText}` : ''}`);
                            }
                            if (i === payloadCandidates.length - 1) {
                                throw new Error(`Failed to fetch model metadata: ${response.status}`);
                            }
                            continue;
                        }

                        const data = await response.json();
                        const foundObj = findContext(data);
                        const nativeContext = (foundObj && typeof foundObj === 'object' && foundObj.value !== undefined) ? foundObj.value : null;
                        const nativeContextPath = (foundObj && typeof foundObj === 'object' && foundObj.path) ? foundObj.path : null;

                        best = { data, nativeContext, nativeContextPath };
                        if (nativeContext !== null && nativeContext !== undefined) {
                            break;
                        }
                    }

                    return best;
                } catch (err) {
                    console.warn('OllamaAPI: Error fetching model metadata on attempt', attempt, err);
                    return null;
                }
            };

            let result = await attemptFetch(1);
            if ((!result || result.nativeContext === null) && shouldAutoload) {
                // wait and retry once
                await new Promise(r => setTimeout(r, options.retryDelayMs || 500));
                result = await attemptFetch(2);
            }

            return result;
        } catch (error) {
            console.error('OllamaAPI: Error fetching model metadata:', error);
            return null;
        }
    }
    // Unified send method. Accepts optional `options` object for extended features:
    //   options.modelOverride - override the model selector value
    //   options.images        - array of base64 image strings to attach
    // `forceThink` can be used by callers to explicitly enable/disable native "think"
    // behavior for a single request. `null` means respect the user/global setting.
    static async sendToOllama(userPrompt, systemPrompt, contextSize, previousContext = null, abortSignal = null, requestId = null, streamProcessor = null, forceThink = null, options = {}) {
		this.clearPendingCloudAccessError();
       //console.log('Normal OllamaAPI: Sending to Ollama...');

        // Model selection: allow override from options, otherwise use the DOM selector.
        let selectedModel;
        if (options && options.modelOverride) {
            selectedModel = options.modelOverride;
        } else {
            const modelSelector = document.getElementById('model-selector');
            selectedModel = modelSelector ? modelSelector.value : '';
        }
        const webSearchEnabled = document.getElementById('web-search')?.classList.contains('active');
        const modelParams = this.getModelParameters(selectedModel);

        // Check if this is a visual model
        const isVisualModel = await OllamaAPI.isVisualModel(selectedModel);
        //  CRITICAL FIX: Always refresh cache before each request to get latest state
        this._cachedThinkingEnabled = (window.ThinkingState && typeof window.ThinkingState.getEffectiveThinkingEnabled === 'function')
            ? window.ThinkingState.getEffectiveThinkingEnabled()
            : (localStorage.getItem('thinkingEnabled') === 'true');

        // Allow callers to explicitly force think on/off via `forceThink` (null = respect user setting)
        const thinkingEnabled = (typeof forceThink === 'boolean') ? forceThink : this._cachedThinkingEnabled;
        // Reasoning-effort models (gpt-oss, Qwen3.8) are always treated as native thinking models
        const supportsNativeThinking = !!(window.isThinkingModel && window.isThinkingModel(selectedModel)) ||
            !!(window.isReasoningEffortModel && window.isReasoningEffortModel(selectedModel));

        let enhancedPrompt = userPrompt;

        // ── Image handling ──────────────────────────────────────────────
        // Priority: 1) explicitly passed options.images  2) window.currentMessageImages
        //           3) OllamaAPI.lastUsedImages (for multi-turn visual conversations)
        let requestImages = null;
        const explicitImages = (options && Array.isArray(options.images) && options.images.length > 0) ? options.images : null;

        if (explicitImages) {
            const cleaned = explicitImages.map(img => {
                let data = String(img || '');
                if (data.includes('base64,')) data = data.split('base64,')[1];
                return data;
            }).filter(Boolean);
            if (cleaned.length) {
                requestImages = cleaned;
                OllamaAPI.lastUsedImages = [...cleaned];
            }
        } else if (isVisualModel) {
            if (window.currentMessageImages && window.currentMessageImages.length > 0) {
                const savedImages = window.currentMessageImages.map(img => {
                    let imgData = img.src || img;
                    if (imgData.includes('base64,')) imgData = imgData.split('base64,')[1];
                    return imgData;
                });
                requestImages = savedImages;
                OllamaAPI.lastUsedImages = [...savedImages];
            } else if (OllamaAPI.lastUsedImages && OllamaAPI.lastUsedImages.length > 0) {
                requestImages = [...OllamaAPI.lastUsedImages];
            }
        }
        // ── End image handling ──────────────────────────────────────────

        try {
            const routing = await this.getOpenAIRoutingForModel(selectedModel);
            const isCloudRouting = routing.source === 'cloud';

            const whatsappRequestScope = (typeof window !== 'undefined' && window.__paiperworkWhatsappActiveRequest)
                ? window.__paiperworkWhatsappActiveRequest
                : null;
            const wechatRequestScope = (typeof window !== 'undefined' && window.__paiperworkwechatActiveRequest)
                ? window.__paiperworkwechatActiveRequest
                : null;
            const historyOptions = { images: requestImages };
            if (options && Array.isArray(options.historyMessages)) {
                historyOptions.historyMessages = options.historyMessages;
            }
            if (whatsappRequestScope || wechatRequestScope) {
                historyOptions.maxTurns = 30;
            }

            // Normal OpenAI context management: `messages` array carries the full
            // conversation (system + prior turns + current user turn). No proprietary
            // numeric `context` round-trip is used anymore.
            const jsonPost = this.buildOpenAIChatPayload({
                model: routing.modelName || selectedModel,
                system: systemPrompt,
                userPrompt: enhancedPrompt,
                contextSize,
                modelParams,
                images: requestImages,
                think: supportsNativeThinking ? thinkingEnabled : null,
                stream: true,
                historyMessages: historyOptions.historyMessages,
                maxTurns: historyOptions.maxTurns,
                maxCharsPerTurn: historyOptions.maxCharsPerTurn,
                maxCharsTotal: historyOptions.maxCharsTotal
            });

            if (streamProcessor) {
                streamProcessor = this.createStreamProcessorForRouting(isCloudRouting, streamProcessor);
            }

            // Keep processor thinking state in sync after potential processor replacement.
            if (streamProcessor) {
                streamProcessor._cachedThinkingEnabled = thinkingEnabled;
            }

            const cloudPromptText = `${systemPrompt || ''}\n${enhancedPrompt || ''}`;
            let cloudResponseText = '';
            const requestPayload = jsonPost;

            const fetchOptions = {
                method: 'POST',
                headers: routing.headers,
                body: JSON.stringify(requestPayload)
            };

            if (isCloudRouting) {
                const authHeader = fetchOptions.headers?.Authorization || '';
                const hasAuth = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') && authHeader.length > 8;
                //console.info('[CloudAuth] sendToOllama request headers', {
                    //hasAuthorizationHeader: hasAuth,
                    //authorizationLength: authHeader ? authHeader.length : 0,
                    //hasLegacyKeyHeader: !!fetchOptions.headers?.['X-Ollama-Api-Key']
                //});
            }

            if (abortSignal instanceof AbortSignal) {
                fetchOptions.signal = abortSignal;
            }

           //console.log('🧠 OllamaAPI: Sending request with thinking support:', supportsNativeThinking ? thinkingEnabled : 'n/a');

            const response = await fetch(`${routing.baseUrl}/chat/completions`, fetchOptions);

            if (response.status === 429) {
                const errorText = await response.text();
                throw new Error(`${this.getOllamaRateLimitMessage()}${errorText ? `\n${errorText}` : ''}`);
            }

            if (response.status === 500) {
                this.showBlockingOllamaWarning(Lang.get('ollamaContextSizeError', 'Communication error, please try again or restart Ollama.'), { scope: 'send-to-ollama-context' });
                return null;
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama request failed (${response.status}): ${errorText || response.statusText}`);
            }

            // After successful API response, schedule image data reset (visual model flow).
            if (requestImages && requestImages.length > 0) {
                setTimeout(() => {
                    if (window.chat && typeof window.chat.resetImageData === 'function') {
                        window.chat.resetImageData();
                    }
                }, 100);
            }

            // If we have a stream processor, we need to handle the response here.
            // Without one, re-emit the OpenAI SSE stream as the legacy Ollama
            // NDJSON shape ({response}/{thinking}/{done}) so the many existing
            // manual stream-draining callers keep working with zero changes.
            if (!streamProcessor) {
                return new Response(this.openAIStreamToLegacyNDJSON(response), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // If we have a stream processor, we need to handle the response here
            if (streamProcessor) {
               //console.log('🧠 OllamaAPI: Processing response with StreamProcessor');

                streamProcessor.thinkingMode = {
                    active: false,
                    content: '',
                    startTime: null,
                    endTime: null,
                    container: null,
                    timer: null,
                    timerElement: null,
                    elapsedSeconds: 0,
                    isNative: false,
                    id: null
                };

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let streamBuffer = '';
                let sawDoneEvent = false;
                let parsedLineCount = 0;
                let parseErrorCount = 0;
                let rawChunkCount = 0;
                let lastParsedEvent = null;
                let doneMeta = null;
                let sawResponseAfterDone = false;
                let streamUsage = null;
                const streamStartedAt = Date.now();
                let firstChunkAt = null;
                let lastChunkAt = null;

                // Normalizes one OpenAI SSE chunk into StreamProcessor calls.
                const handleParsedChunk = (parsed) => {
                    if (!parsed) return;
                    parsedLineCount += 1;
                    lastParsedEvent = {
                        done: !!parsed.done || !!parsed.finishReason,
                        hasResponse: !!parsed.content,
                        hasThinking: !!parsed.reasoning,
                        responseLength: parsed.content ? parsed.content.length : 0
                    };

                    const currentThinkingEnabled = (window.ThinkingState && typeof window.ThinkingState.getUserThinkingEnabled === 'function')
                        ? window.ThinkingState.getUserThinkingEnabled()
                        : (localStorage.getItem('thinkingEnabled') === 'true');

                    // Native thinking/reasoning (OpenAI `delta.reasoning`).
                    if (parsed.reasoning && supportsNativeThinking && currentThinkingEnabled) {
                        if (streamProcessor.processThinking) {
                            streamProcessor.processThinking(parsed.reasoning);
                        } else {
                            streamProcessor.processChunk(parsed.reasoning);
                        }
                    }

                    // Regular content (OpenAI `delta.content`).
                    if (parsed.content) {
                        if (sawDoneEvent) {
                            sawResponseAfterDone = true;
                        }
                        streamProcessor.processChunk(parsed.content);
                        if (isCloudRouting) {
                            cloudResponseText += parsed.content;
                        }
                    }

                    if (parsed.usage) {
                        streamUsage = parsed.usage;
                    }

                    if (parsed.finishReason || parsed.done) {
                        sawDoneEvent = true;
                        doneMeta = {
                            done_reason: parsed.finishReason || 'stop',
                            eval_count: streamUsage ? (streamUsage.completion_tokens ?? null) : null,
                            prompt_eval_count: streamUsage ? (streamUsage.prompt_tokens ?? null) : null,
                            hasContext: false,
                            responseCharsOnDone: String(parsed.content || '').length
                        };
                    }
                };

                try {
                    while (true) {
                        const { value, done } = await reader.read();
                        rawChunkCount += 1;
                        if (!firstChunkAt && value && value.length) {
                            firstChunkAt = Date.now();
                        }
                        lastChunkAt = Date.now();
                        streamBuffer += decoder.decode(value || new Uint8Array(), { stream: !done });
                        const lines = streamBuffer.split('\n');
                        streamBuffer = lines.pop() || '';

                        for (const line of lines) {
                            if (!line.trim()) continue;
                            try {
                                handleParsedChunk(this.parseOpenAIChatStreamLine(line));
                            } catch (error) {
                                parseErrorCount += 1;
                                console.error('🧠 OllamaAPI: Error processing response chunk:', error);
                                if (isCloudRouting) {
                                    this.logCloudStreamDiagnostics('sendToOllama parse error', {
                                        model: jsonPost.model,
                                        lineLength: line.length,
                                        linePreview: line.substring(0, 220),
                                        parsedLineCount,
                                        parseErrorCount,
                                        rawChunkCount
                                    });
                                }
                                this.logStreamSummary('sendToOllama parse error', {
                                    requestId: requestId || jsonPost.request_id,
                                    model: jsonPost.model,
                                    source: isCloudRouting ? 'cloud' : 'local',
                                    linePreview: String(line || '').substring(0, 180),
                                    parsedLineCount,
                                    parseErrorCount,
                                    rawChunkCount
                                });
                            }
                        }

                        if (done) {
                            if (isCloudRouting && !sawDoneEvent) {
                                this.logCloudStreamDiagnostics('sendToOllama stream ended without done', {
                                    model: jsonPost.model,
                                    parsedLineCount,
                                    parseErrorCount,
                                    rawChunkCount,
                                    cloudResponseChars: cloudResponseText.length,
                                    tailLength: streamBuffer.length,
                                    tailPreview: (streamBuffer || '').substring(0, 220),
                                    lastParsedEvent
                                });
                            }
                            const tail = streamBuffer.trim();
                            if (tail) {
                                try {
                                    handleParsedChunk(this.parseOpenAIChatStreamLine(tail));
                                } catch (_tailErr) {
                                    // Ignore trailing partial line on stream end.
                                }
                            }
                            break;
                        }
                    }

                    // Finalize once after stream closure so delayed chunks are not dropped.
                    streamProcessor.finishResponse();

                    // Normal OpenAI context accounting: prefer server-reported usage
                    // (stream_options.include_usage), fall back to a text estimate.
                    if (streamUsage) {
                        OllamaAPI.updateContextFromUsage(streamUsage, cloudPromptText, cloudResponseText);
                    } else if (isCloudRouting) {
                        OllamaAPI.trackCloudTokenUsage(cloudPromptText, cloudResponseText);
                    } else if (streamProcessor?.responseContainer?.textContent) {
                        OllamaAPI.trackCloudTokenUsage(cloudPromptText, streamProcessor.responseContainer.textContent);
                    }

                    return {
                        success: true,
                        streamProcessor,
                        partial: !sawDoneEvent,
                        doneMeta,
                        responseChars: isCloudRouting
                            ? cloudResponseText.length
                            : (streamProcessor?.responseContainer?.textContent || '').length,
                        source: isCloudRouting ? 'cloud' : 'local'
                    };
                } catch (streamError) {
                    console.error('🧠 OllamaAPI: Stream processing error:', streamError);

                    // If cloud streaming drops after partial text arrived, preserve partial output
                    // instead of bubbling a null response to Chat UI.
                    const hasPartialCloudOutput = isCloudRouting && (
                        (typeof cloudResponseText === 'string' && cloudResponseText.length > 0) ||
                        (streamProcessor && streamProcessor.responseContainer && streamProcessor.responseContainer.textContent && streamProcessor.responseContainer.textContent.trim().length > 0)
                    );

                    if (hasPartialCloudOutput) {
                        this.logCloudStreamDiagnostics('sendToOllama recovered with partial output', {
                            model: jsonPost.model,
                            errorName: streamError?.name || '<unknown>',
                            errorMessage: streamError?.message || String(streamError),
                            partialChars: cloudResponseText.length
                        });

                        try {
                            streamProcessor.finishResponse();
                        } catch (_finishErr) {
                            // Keep recovery path resilient.
                        }

                        OllamaAPI.trackCloudTokenUsage(cloudPromptText, cloudResponseText);

                        return { success: true, streamProcessor, partial: true, interrupted: true };
                    }

                    throw streamError;
                } finally {
                    const endedAt = Date.now();
                    this.logStreamSummary('sendToOllama completed', {
                        requestId: requestId || jsonPost.request_id,
                        model: jsonPost.model,
                        source: isCloudRouting ? 'cloud' : 'local',
                        sawDoneEvent,
                        parsedLineCount,
                        parseErrorCount,
                        rawChunkCount,
                        hadFinalContext: false,
                        doneMeta,
                        sawResponseAfterDone,
                        optionsDebug: {
                            num_ctx: jsonPost?.options?.num_ctx ?? null
                        },
                        promptChars: cloudPromptText.length,
                        responseChars: isCloudRouting
                            ? cloudResponseText.length
                            : (streamProcessor?.responseContainer?.textContent || '').length,
                        streamMs: endedAt - streamStartedAt,
                        ttfbMs: firstChunkAt ? (firstChunkAt - streamStartedAt) : null,
                        tailGapMs: (firstChunkAt && lastChunkAt) ? (endedAt - lastChunkAt) : null,
                        endedWithBufferedTail: String(streamBuffer || '').trim().length > 0
                    });
                }
            }

            return response;

        } catch (error) {
            console.error('Ollama connection error:', error);

            if (error.name === 'AbortError') {
               //console.log('🧠 OllamaAPI: Request was aborted by user');

                // If we have a stream processor and thinking is active, cancel it
                if (streamProcessor && streamProcessor.thinkingMode.active) {
                   //console.log('🧠 OllamaAPI: Cancelling active thinking mode due to abort');
                    streamProcessor.cancelThinkingMode();
                }

                throw error;
            }

            const cloudAccessError = this.getOllamaCloudAccessErrorDetails(error);
            if (cloudAccessError) {
                this.rememberCloudAccessError(error);
                this.showBlockingOllamaWarning(cloudAccessError.body, { scope: `send-to-ollama-${cloudAccessError.type}` });
            } else {
                this.clearPendingCloudAccessError();
                this.showBlockingOllamaWarning(Lang.get('ollamaConnectionError'), { scope: 'send-to-ollama-connection' });
            }
            return null;
        }
    }

    // Converts a {role, text|content} turns array (e.g. Campaign orchestrator
    // history) into standard OpenAI messages. Returns null for non-turn payloads
    // (e.g. the old numeric token `context` arrays).
    static _normalizeTurnsToMessages(turns) {
        if (!Array.isArray(turns) || turns.length === 0) return null;
        const messages = [];
        for (const turn of turns) {
            const role = String(turn && turn.role ? turn.role : '').trim().toLowerCase();
            const content = String(turn && (turn.content ?? turn.text) || '').trim();
            if ((role === 'user' || role === 'assistant') && content) {
                messages.push({ role, content });
            }
        }
        return messages.length ? messages : null;
    }

    // OrchestratorCall: headless call to Ollama that returns only cleaned text.
    // Signature mirrors `sendToOllama` but this method will NOT attach a
    // StreamProcessor or render UI; it always returns a single plain string.
    // `previousContext` may be a turns array ({role,text}) which is mapped to
    // standard OpenAI messages for context continuity.
    static async OrchestratorCall(userPrompt, systemPrompt, contextSize, previousContext = null, abortSignal = null, requestId = null, streamProcessor = null, historyMessages = null) {
        try {
            // Force headless behavior by not passing a StreamProcessor to sendToOllama
            // and explicitly disable native thinking for orchestrator latency.
            const sendOptions = {};
            const history = historyMessages || this._normalizeTurnsToMessages(previousContext);
            if (history && history.length) {
                sendOptions.historyMessages = history;
            }
            const response = await this.sendToOllama(userPrompt, systemPrompt, contextSize, previousContext, abortSignal, requestId, null, false, sendOptions);
            if (!response) return '';

            // If the helper returned a simple string
            if (typeof response === 'string') return response.trim();

            // If we received a Fetch Response, try to drain NDJSON or text
            if (response instanceof Response) {
                try {
                    if (!response.body || typeof response.body.getReader !== 'function') {
                        const text = await response.text();
                        return (text || '').trim();
                    }

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';
                    let extracted = '';

                    while (true) {
                        const { value, done } = await reader.read();
                        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (!line.trim()) continue;
                            try {
                                const data = JSON.parse(line.trim());
                                const chunk = data.response || data.message?.content || data.text || '';
                                if (Array.isArray(chunk)) extracted += chunk.join('');
                                else if (typeof chunk === 'string') extracted += chunk;
                            } catch (e) {
                                // Fallback: append raw line
                                extracted += line;
                            }
                        }

                        if (done) {
                            if (buffer && buffer.trim()) {
                                try {
                                    const data = JSON.parse(buffer);
                                    const chunk = data.response || data.message?.content || data.text || '';
                                    if (Array.isArray(chunk)) extracted += chunk.join('');
                                    else if (typeof chunk === 'string') extracted += chunk;
                                } catch (e) {
                                    extracted += buffer;
                                }
                            }
                            break;
                        }
                    }

                    return (extracted || '').replace(/\s+/g, ' ').trim();
                } catch (e) {
                    console.error('OrchestratorCall: error draining Response', e);
                    try { const text = await response.text(); return (text || '').trim(); } catch (_) { return ''; }
                }
            }

            // If sendToOllama returned a streamProcessor wrapper, extract clean text
            if (response.success && response.streamProcessor) {
                const sp = response.streamProcessor;
                if (sp && typeof sp.getCleanResponseText === 'function') {
                    return (sp.getCleanResponseText() || '').trim();
                } else if (sp && sp.responseContainer && sp.responseContainer.textContent) {
                    return sp.responseContainer.textContent.trim();
                }
            }

            // Try common shaped responses
            if (response.response) {
                if (Array.isArray(response.response)) return response.response.join('').trim();
                if (typeof response.response === 'string') return response.response.trim();
            }
            if (response.text && typeof response.text === 'string') return response.text.trim();

            return '';
        } catch (err) {
            console.error('OrchestratorCall error', err);
            if (err?.name === 'AbortError') {
                throw err;
            }
            return '';
        }
    }
    // Sends a prompt to the Ollama API with web search context, handles streaming and UI updates.
    static async sendToOllamaWithWebSearch(
        prompt,
        systemPrompt,
        includeContext = true,
        abortSignal = null,
        documentContext = '',
        isDocumentWebSearch = false,
        forceNewGroup = null,
        targetConversationGroup = null,
        insightsCallback = null
    ) {
       //console.log('Websearch OllamaAPI: Sending to Ollama...');
        const progressBar = document.getElementById('progress-bar');
        progressBar.classList.add('active', 'indeterminate');

        // Track if we have an abort controller
        if (abortSignal) {
           //console.log('WebSearch has abort signal, adding listener');
        }

        // Create an artificial response object to return
        let artificialResponse = {
            ok: true,
            status: 200,
            body: {
                getReader() {
                    return {
                        async read() {
                            // This will be called once and signal completion immediately
                            return { done: true };
                        }
                    };
                }
            }
        };

        let searchStatusDiv = null;
        const removeSearchStatus = () => {
            if (searchStatusDiv && searchStatusDiv.parentNode) {
                searchStatusDiv.parentNode.removeChild(searchStatusDiv);
            }
            searchStatusDiv = null;
        };

        const showSearchStatus = () => {
            removeSearchStatus();
            const aiReplies = document.querySelector('.ai-replies');
            if (!aiReplies) return;

            searchStatusDiv = document.createElement('div');
            searchStatusDiv.className = 'assistant-message web-search-status-message';
            searchStatusDiv.innerHTML = `
                <div class="ai-response-container" style="display:flex; align-items:center; gap:10px; padding:10px 12px;">
                    <svg width="16" height="16" viewBox="0 0 50 50" aria-hidden="true" style="flex:0 0 auto;">
                        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-opacity="0.25" stroke-width="5"></circle>
                        <path d="M25 5a20 20 0 0 1 20 20" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round">
                            <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite"></animateTransform>
                        </path>
                    </svg>
                    <span>${(window.Lang && typeof Lang.get === 'function' && Lang.get('searchingInternet')) || 'Searching internet...'}</span>
                </div>
            `;

            aiReplies.appendChild(searchStatusDiv);
            if (window.OllamaAPI && typeof window.OllamaAPI.scrollToBottom === 'function') {
                window.OllamaAPI.scrollToBottom();
            }
        };

        let streamProcessor = null;
        let aiDiv = null;
        const whatsappRequestScope = (typeof window !== 'undefined' && window.__paiperworkWhatsappActiveRequest)
            ? window.__paiperworkWhatsappActiveRequest
            : null;
        const wechatRequestScope = (typeof window !== 'undefined' && window.__paiperworkwechatActiveRequest)
            ? window.__paiperworkwechatActiveRequest
            : null;
        const applyWhatsappRequestMetadata = (element) => {
            if (!element || !whatsappRequestScope || !whatsappRequestScope.id) {
                return;
            }

            element.dataset.whatsappRequestId = whatsappRequestScope.id;
            if (whatsappRequestScope.phone) {
                element.dataset.whatsappPhone = whatsappRequestScope.phone;
            }
            if (whatsappRequestScope.replyTarget) {
                element.dataset.whatsappReplyTarget = whatsappRequestScope.replyTarget;
            }
            if (whatsappRequestScope.deviceId) {
                element.dataset.whatsappDeviceId = whatsappRequestScope.deviceId;
            }
        };
        const applyWechatRequestMetadata = (element) => {
            if (!element || !wechatRequestScope || !wechatRequestScope.id) {
                return;
            }

            element.dataset.wechatRequestId = wechatRequestScope.id;
            if (wechatRequestScope.account) {
                element.dataset.wechatAccount = wechatRequestScope.account;
            }
            if (wechatRequestScope.replyTarget) {
                element.dataset.wechatReplyTarget = wechatRequestScope.replyTarget;
            }
        };

        try {
            // Get the original prompt before any thinking tags removal
            const originalPrompt = prompt;
            // Create a separate variable for the prompt sent to the model so we don't
            // overwrite `prompt` which must remain the user's original input for storage.
            let userPromptForRequest = prompt;

            console.log('[OllamaAPI] sendToOllamaWithWebSearch prompt:', prompt);
        // --- NEW: Ask the model to create a concise web-search query based on the user's prompt ---
            let generatedQuery = null;

            try {
                // Build a short system/user prompt pair that instructs the model to produce a concise search query.
                // We intentionally do NOT change the external `systemPrompt` passed to the overall websearch flow.
                // Move the instruction into the user prompt so we do NOT change the external systemPrompt
                const queryUserPrompt = `You will be asked to produce a single concise web search query (no surrounding text) that best captures the user's information need. Keep it short and focused; do not include commentary or quotes.\n\nCreate a concise web search query for this user request:\n\n${originalPrompt}`;

                // Call sendToOllama WITHOUT a StreamProcessor to avoid rendering the internal query-generation step in the chat UI.
                const queryResponse = await OllamaAPI.sendToOllama(queryUserPrompt, systemPrompt, document.getElementById('context-selector').value, null, null, `webquery_${Date.now()}`, null);

                // sendToOllama may return { success: true, streamProcessor } when it processed the stream
                if (!queryResponse) {
                    generatedQuery = originalPrompt;
                } else if (queryResponse.success && queryResponse.streamProcessor) {
                    try {
                        const sp = queryResponse.streamProcessor || qpStreamProcessor;
                        // Prefer responseContainer textContent if present
                        if (sp && sp.responseContainer && sp.responseContainer.textContent) {
                            generatedQuery = sp.responseContainer.textContent.trim() || originalPrompt;
                        } else if (sp && sp.getText && typeof sp.getText === 'function') {
                            generatedQuery = (await sp.getText()).trim() || originalPrompt;
                        } else {
                            generatedQuery = originalPrompt;
                        }
                    } catch (e) {
                        generatedQuery = originalPrompt;
                    }
                } else if (queryResponse instanceof Response) {
                    // Drain NDJSON stream and extract only generated text chunks.
                    try {
                        const reader = queryResponse.body && typeof queryResponse.body.getReader === 'function'
                            ? queryResponse.body.getReader()
                            : null;

                        if (!reader) {
                            const text = await queryResponse.text();
                            generatedQuery = text.trim() || originalPrompt;
                        } else {
                            const decoder = new TextDecoder();
                            let buffer = '';
                            let extracted = '';

                            while (true) {
                                const { value, done } = await reader.read();
                                buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
                                const lines = buffer.split('\n');
                                buffer = lines.pop() || '';

                                for (const line of lines) {
                                    if (!line.trim()) continue;
                                    try {
                                        const data = JSON.parse(line);
                                        const chunk = data.response || data.message?.content || '';
                                        if (chunk) extracted += chunk;
                                    } catch (_e) {
                                        // Ignore malformed/partial line chunks from stream boundaries.
                                    }
                                }

                                if (done) {
                                    const tail = buffer.trim();
                                    if (tail) {
                                        try {
                                            const data = JSON.parse(tail);
                                            const chunk = data.response || data.message?.content || '';
                                            if (chunk) extracted += chunk;
                                        } catch (_e) {
                                            // Ignore partial tail data.
                                        }
                                    }
                                    break;
                                }
                            }

                            generatedQuery = extracted.trim() || originalPrompt;
                        }
                    } catch (e) {
                        generatedQuery = originalPrompt;
                    }
                } else if (queryResponse.body && typeof queryResponse.body.getReader === 'function') {
                    // If we get a raw response-like object, drain it and try to parse it into a query
                    try {
                        const reader = queryResponse.body.getReader();
                        const decoder = new TextDecoder();
                        let buffer = '';
                        let extracted = '';

                        while (true) {
                            const { value, done } = await reader.read();
                            if (done) break;
                            buffer += decoder.decode(value, { stream: true });
                            const lines = buffer.split('\n');
                            buffer = lines.pop();
                            for (const line of lines) {
                                if (!line.trim()) continue;
                                try {
                                    const data = JSON.parse(line);
                                    if (data.response) {
                                        if (Array.isArray(data.response)) extracted += data.response.join('');
                                        else if (typeof data.response === 'string') extracted += data.response;
                                    } else if (data.text && typeof data.text === 'string') extracted += data.text;
                                } catch (e) {
                                    extracted += line;
                                }
                            }
                        }

                        if (buffer && buffer.trim()) {
                            try {
                                const data = JSON.parse(buffer);
                                if (data.response) {
                                    if (Array.isArray(data.response)) extracted += data.response.join('');
                                    else if (typeof data.response === 'string') extracted += data.response;
                                } else if (data.text && typeof data.text === 'string') extracted += data.text;
                            } catch (e) {
                                extracted += buffer;
                            }
                        }

                        const cleaned = extracted.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
                        generatedQuery = (cleaned && cleaned.length) ? cleaned : (extracted.trim() || originalPrompt);
                    } catch (e) {
                        generatedQuery = originalPrompt;
                    }
                } else if (queryResponse.success && queryResponse.streamProcessor) {
                    // If sendToOllama returned a streamProcessor wrapper (from streaming path), try to extract text
                    try {
                        const sp = queryResponse.streamProcessor;
                        // Prefer a `response` or `getText` property if available, else fall back to container text
                        if (sp && sp.responseContainer) {
                            generatedQuery = sp.responseContainer.textContent.trim() || originalPrompt;
                        } else {
                            generatedQuery = originalPrompt;
                        }
                    } catch (e) {
                        generatedQuery = originalPrompt;
                    }
                } else if (typeof queryResponse === 'string') {
                    generatedQuery = queryResponse.trim() || originalPrompt;
                } else {
                    // Unknown shape - fallback
                    generatedQuery = originalPrompt;
                }
            } catch (queryErr) {
                console.error('Failed to generate websearch query via model:', queryErr);
                generatedQuery = originalPrompt;
            }

            // Log the query received from Ollama that we'll use for the web search
            try {
                console.log('[OllamaAPI] generated websearch query:', generatedQuery);
            } catch (e) {
                // ignore console errors in unusual environments
            }

            // Persist the query so other parts of the app can see what was actually used
            try {
                await PaiperworkDB.secureLocalStorageSet('last_docwebsearch_query', generatedQuery);
            } catch (e) {
                try { localStorage.setItem('last_docwebsearch_query', generatedQuery); } catch (err) { }
            }

            // Pass the generated query (instead of raw prompt) to WebSearch.smartSearch
            const searchQueryToUse = generatedQuery || prompt;

            // Debug log which query will actually be used for WebSearch
            try {
               //console.log('Using search query for WebSearch.smartSearch:', searchQueryToUse);
            } catch (e) {}

            // Pass the isDocumentWebSearch flag to WebSearch.smartSearch
            let webSearchResults;
            showSearchStatus();
            try {
                webSearchResults = await WebSearch.smartSearch(searchQueryToUse, new Date(), isDocumentWebSearch);
            } finally {
                removeSearchStatus();
            }

            // Important: Get the actual search query used (after thinking tags were stripped)
            // This will be different than originalPrompt if thinking tags were removed
            let actualSearchQuery = prompt;
            try {
                const got = await PaiperworkDB.secureLocalStorageGet('last_docwebsearch_query');
                if (got) actualSearchQuery = got;
            } catch (e) {
                actualSearchQuery = localStorage.getItem('last_docwebsearch_query') || prompt;
            }

            // Update the UI with search info using the ACTUAL query used (not the thinking output)
            const searchInfo = `
            <div class="web-search-info">
                <p><strong>Web search performed:</strong> ${new Date().toLocaleTimeString()}</p>
                <p><em>Search query:</em> "${actualSearchQuery}"</p>
            </div>`;
            window.isGenerating = true;

            // Check if we have document context provided
            const hasDocumentContext = documentContext && documentContext.trim().length > 0;

            // Get web search results
            let webSearchContext = '';
            try {
                // Use the actual prompt as the search query
               //console.log(`Performing web search for query: "${prompt}"`);

                if (webSearchResults && webSearchResults.items && webSearchResults.items.length > 0) {
                    webSearchContext = WebSearch.formatSearchResults(webSearchResults, isDocumentWebSearch);
                   //console.log('Web search found results:', webSearchResults.items.length);
                    // Log the first result for debugging
                    if (webSearchResults.items[0]) {
                       //console.log('First result:', {
                        //  title: webSearchResults.items[0].title,
                        //  link: webSearchResults.items[0].link,
                        //   snippet: webSearchResults.items[0].snippet?.substring(0, 100) + '...'
                        //   });
                    }
                } else {
                   //console.log('Web search found no results');
                    webSearchContext = 'Web search found no relevant results for this query.';
                }
            } catch (searchError) {
                console.error('Web search failed:', searchError);
                webSearchContext = `Web search failed with error: ${searchError.message}`;
            }

            // Build the enhanced system prompt with context
            let enhancedSystemPrompt = systemPrompt || '';

            // Add instructions based on what context we have
            if (hasDocumentContext) {
                enhancedSystemPrompt += `\n\nDocument context:\n${documentContext}\n\n`;

                if (webSearchContext) {
                    enhancedSystemPrompt += `\nAdditional web search results:\n${webSearchContext}\n\n`;
                    enhancedSystemPrompt += `\nInstruction: First use information from the document context, then supplement with web search results as needed. Cite your sources.`;
                }
            } else {
                if (webSearchContext) {
                    enhancedSystemPrompt = enhancedSystemPrompt;
                    // Append web search context to the prompt we'll send to the model,
                    // but DO NOT mutate the original `prompt` variable which should be
                    // preserved for database storage and logging.
                    userPromptForRequest = prompt + `\n\nInstruction: Use the web search results to inform your answer. ALWAYS USE THIS FORMAT for links [source website](url) and cite your sources with the website name.\n\nWeb search results:\n${webSearchContext}`;
                }

            }

           //console.log('Enhanced prompt created with web search results');

            // Set up UI
            const aiReplies = document.querySelector('.ai-replies');
            const modelSelector = document.getElementById('model-selector');
            const selectedModel = modelSelector.value;
            const routing = await this.getOpenAIRoutingForModel(selectedModel);
            const contextSize = document.getElementById('context-selector').value;
            const modelParams = this.getModelParameters(selectedModel);

            //  CRITICAL FIX: Always refresh cache before each request to get latest state
            this._cachedThinkingEnabled = (window.ThinkingState && typeof window.ThinkingState.getEffectiveThinkingEnabled === 'function')
                ? window.ThinkingState.getEffectiveThinkingEnabled()
                : (window.ThinkingState && typeof window.ThinkingState.getEffectiveThinkingEnabled === 'function')
                    ? window.ThinkingState.getEffectiveThinkingEnabled()
                    : (localStorage.getItem('thinkingEnabled') === 'true');

            const thinkingEnabled = this._cachedThinkingEnabled;
            // Reasoning-effort models (gpt-oss, Qwen3.8) are always treated as native thinking models
            const supportsNativeThinking = !!(window.isThinkingModel && window.isThinkingModel(selectedModel)) ||
                !!(window.isReasoningEffortModel && window.isReasoningEffortModel(selectedModel));

            // Create AI message container
            aiDiv = document.createElement('div');
            aiDiv.className = 'assistant-message';
            applyWhatsappRequestMetadata(aiDiv);
            applyWechatRequestMetadata(aiDiv);
            aiReplies.appendChild(aiDiv);

            // Create the stream processor
            streamProcessor = this.createStreamProcessorForRouting(routing.source === 'cloud');

            //  ALSO: Update StreamProcessor's cache if it exists
            if (streamProcessor) {
                streamProcessor._cachedThinkingEnabled = thinkingEnabled;
               //console.log('🧠 WebSearch OllamaAPI: Updated StreamProcessor cache to:', thinkingEnabled);
            }

            /*console.log('🧠 WebSearch OllamaAPI: Fresh thinking state check:', {
                thinkingEnabled: thinkingEnabled,
                supportsNativeThinking: supportsNativeThinking,
                model: selectedModel,
                hasStreamProcessor: !!streamProcessor
            });*/

            // Detach the auto-created container from aiReplies
            const autoContainer = streamProcessor.responseContainer;
            if (autoContainer.parentNode) {
                autoContainer.parentNode.removeChild(autoContainer);
            }

            // Add it to our aiDiv
            aiDiv.appendChild(streamProcessor.responseContainer);

            const persistWebSearchConversation = async () => {
                const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                if (!hashedMasterKey) return;

                const normalizedTargetGroup = Number.isInteger(targetConversationGroup)
                    ? targetConversationGroup
                    : (Number.isInteger(window.currentConversationGroup) ? window.currentConversationGroup : null);

                const shouldForceNewGroup =
                    forceNewGroup === true ||
                    window.forceNewConversationGroup === true ||
                    !normalizedTargetGroup;

                const aiResponse = (streamProcessor && typeof streamProcessor.getCleanResponseHTML === 'function')
                    ? streamProcessor.getCleanResponseHTML()
                    : streamProcessor.responseContainer.outerHTML;
                await PaiperworkDB.storeConversationOnly(
                    hashedMasterKey,
                    originalPrompt,
                    aiResponse,
                    shouldForceNewGroup,
                    shouldForceNewGroup ? null : normalizedTargetGroup
                );

                if (window.forceNewConversationGroup) {
                    window.forceNewConversationGroup = false;
                }

                if (window.currentConversationGroup) {
                    await PaiperworkDB.touchConversationGroup(hashedMasterKey, window.currentConversationGroup);
                    if (window.chat && typeof window.chat.refreshConversationListIfNeeded === 'function') {
                        await window.chat.refreshConversationListIfNeeded(hashedMasterKey, window.currentConversationGroup);
                    }
                }

                if (typeof insightsCallback === 'function') {
                    try {
                        await insightsCallback();
                    } catch (callbackError) {
                        console.error('OllamaAPI: WebSearch insights callback failed:', callbackError);
                    }
                }
            };

            const isCloudRouting = routing.source === 'cloud';

            // Log the request details for debugging
           //console.log('Sending Ollama request with:');
           //console.log('- Model:', selectedModel);
           //console.log('- Context size:', contextSize);
           //console.log('- Has abort signal:', !!abortSignal);

            // Check if this is a visual model
            const isVisualModel = await OllamaAPI.isVisualModel(selectedModel);

            // Normal OpenAI context management: `messages` carries prior turns and
            // the current user turn. No proprietary numeric `context` round-trip.
            const historyOptions = {};
            if (whatsappRequestScope || wechatRequestScope) {
                historyOptions.maxTurns = 30;
            }
            const requestBody = this.buildOpenAIChatPayload({
                model: routing.modelName || selectedModel,
                system: enhancedSystemPrompt,
                userPrompt: userPromptForRequest,
                contextSize,
                modelParams,
                images: (isVisualModel && OllamaAPI.lastUsedImages && OllamaAPI.lastUsedImages.length > 0)
                    ? [...OllamaAPI.lastUsedImages]
                    : null,
                think: supportsNativeThinking ? thinkingEnabled : null,
                stream: true,
                maxTurns: historyOptions.maxTurns,
                maxCharsPerTurn: historyOptions.maxCharsPerTurn,
                maxCharsTotal: historyOptions.maxCharsTotal
            });

            const cloudPromptText = `${enhancedSystemPrompt || ''}\n${userPromptForRequest || ''}`;
            let cloudResponseText = '';
            const requestPayload = requestBody;
            const fetchOptions = {
                method: 'POST',
                headers: routing.headers,
                body: JSON.stringify(requestPayload)
            };

            if (abortSignal instanceof AbortSignal) {
                fetchOptions.signal = abortSignal;
            }

           //console.log('OllamaAPI WebSearch: Fetch options include signal:', !!fetchOptions.signal);

            const response = await fetch(`${routing.baseUrl}/chat/completions`, fetchOptions);

            if (response.status === 429) {
                const errorText = await response.text();
                throw new Error(`${this.getOllamaRateLimitMessage()}${errorText ? `\n${errorText}` : ''}`);
            }

            // Add additional logging right after the fetch call
           //console.log('Fetch request sent with abort signal:', !!abortSignal);
            if (!response || !response.ok) {
                if (abortSignal && abortSignal.aborted) {
                   //console.log('Request was aborted during fetch');
                    throw new Error('Request was aborted');
                }
                throw new Error(`Failed to get response from Ollama: ${response ? response.status : 'No response'}`);
            }

            if (response.status === 500) {
                this.showBlockingOllamaWarning(Lang.get('ollamaerror500'), { scope: 'websearch-500' });
                aiDiv.remove();
                return;
            }

           //console.log('🧠 WebSearch OllamaAPI: Processing response with StreamProcessor');

            //  INITIALIZE THINKING MODE: Reset thinking mode for this stream
            streamProcessor.thinkingMode = {
                active: false,
                content: '',
                startTime: null,
                endTime: null,
                container: null,
                timer: null,
                timerElement: null,
                elapsedSeconds: 0,
                isNative: false,
                id: null
            };

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let streamBuffer = '';
            let streamUsage = null;

            const handleWebSearchChunk = (parsed) => {
                if (!parsed) return;
                const currentThinkingEnabled = (window.ThinkingState && typeof window.ThinkingState.getUserThinkingEnabled === 'function')
                    ? window.ThinkingState.getUserThinkingEnabled()
                    : (localStorage.getItem('thinkingEnabled') === 'true');

                // Native thinking/reasoning (OpenAI `delta.reasoning`).
                if (parsed.reasoning && supportsNativeThinking && currentThinkingEnabled) {
                    if (streamProcessor.processThinking) {
                        streamProcessor.processThinking(parsed.reasoning);
                    } else {
                        streamProcessor.processChunk(parsed.reasoning);
                    }
                }

                if (parsed.usage) {
                    streamUsage = parsed.usage;
                }

                // Regular content (OpenAI `delta.content`).
                if (parsed.content) {
                    streamProcessor.processChunk(parsed.content);
                    if (isCloudRouting) {
                        cloudResponseText += parsed.content;
                    }
                }

                if (parsed.finishReason || parsed.done) {
                    return 'done';
                }

                OllamaAPI.scrollToBottom();
                return null;
            };

            const finalizeWebSearch = async () => {
                const buttons = streamProcessor.responseContainer.querySelectorAll('.code-copy-btn');
                buttons.forEach(button => button.style.display = 'block');

                streamProcessor.finishResponse();

                if (window.chat && typeof window.chat.addMessageActionsToMessage === 'function') {
                    window.chat.addMessageActionsToMessage(aiDiv);
                }

                // Normal OpenAI context accounting via server-reported usage.
                if (streamUsage) {
                    OllamaAPI.updateContextFromUsage(streamUsage, cloudPromptText, cloudResponseText);
                } else if (isCloudRouting) {
                    OllamaAPI.trackCloudTokenUsage(cloudPromptText, cloudResponseText);
                }

                if (OllamaAPI.contextLimitReached) {
                    this.handleContextLimitReached();
                }

                // Store conversation and refresh session list for web-search flow.
                await persistWebSearchConversation();
                OllamaAPI.scrollToBottom();
            };

            // Process the stream (OpenAI SSE).
            let sawDoneEvent = false;
            while (true) {
                if (abortSignal && abortSignal.aborted) {
                   //console.log('Abort signal detected during stream processing - breaking out of read loop');
                    break;
                }
                const { value, done } = await reader.read();
                streamBuffer += decoder.decode(value || new Uint8Array(), { stream: !done });
                const lines = streamBuffer.split('\n');
                streamBuffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        if (handleWebSearchChunk(this.parseOpenAIChatStreamLine(line)) === 'done') {
                            sawDoneEvent = true;
                        }
                    } catch (error) {
                        console.error('Error processing chunk:', error);
                    }
                }

                if (done) {
                    const tail = streamBuffer.trim();
                    if (tail) {
                        try {
                            if (handleWebSearchChunk(this.parseOpenAIChatStreamLine(tail)) === 'done') {
                                sawDoneEvent = true;
                            }
                        } catch (_tailErr) {
                            // Ignore trailing partial line on stream end.
                        }
                    }
                    break;
                }
            }

            // Finalize once the stream closes (whether or not a done marker was seen)
            // so web-search conversations are persisted.
            if (streamProcessor && streamProcessor.responseContainer) {
                await finalizeWebSearch();
            }

            // If we reach here, we're done processing the stream.
            return artificialResponse;

        } catch (error) {
            console.error('Error sending to Ollama with web search:', error);

            if (error.name === 'AbortError') {
               //console.log('Request was aborted by user');

                // If we have a stream processor and thinking is active, cancel it
                if (streamProcessor && streamProcessor.thinkingMode.active) {
                   //console.log('🧠 WebSearch OllamaAPI: Cancelling active thinking mode due to abort');
                    streamProcessor.cancelThinkingMode();
                }

                throw error;
            }

            // Add an error message to the UI
            const aiReplies = document.querySelector('.ai-replies');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'assistant-message';
            errorDiv.innerHTML = `<div class="message-bubble">Error: ${error.message}</div>`;
            aiReplies.appendChild(errorDiv);

            throw error; // Re-throw the error so the caller knows something went wrong
        } finally {
            removeSearchStatus();
            progressBar.classList.remove('active', 'indeterminate');
            window.isGenerating = false;
        }
    }
    // Thin wrapper around sendToOllama for image requests. Builds the images array
    // from the legacy parameters and delegates to the unified method.
    static async sendToOllamaWithImage(userPrompt, systemPrompt, contextSize, imageData, previousContext = null, abortSignal = null, requestId = null, multiImages = null, modelOverride = null, streamProcessor = null) {
        let images = null;

        if (multiImages && Array.isArray(multiImages) && multiImages.length > 0) {
            if (!window.cleanedImageBase64Array || window.cleanedImageBase64Array.length === 0) {
                console.error('OllamaAPI: No cleaned image data array available');
                throw new Error('Missing image data for visual model');
            }
            images = [...window.cleanedImageBase64Array];
        } else if (imageData && typeof imageData === 'string' && imageData.trim().length > 0) {
            let base64Image = imageData;
            if (base64Image.includes('base64,')) {
                base64Image = base64Image.split('base64,')[1];
            }
            if (!base64Image || base64Image.trim() === '') {
                console.error('OllamaAPI: Invalid base64 image data');
                throw new Error('Invalid image format for visual model');
            }
            window.cleanedImageBase64 = base64Image;
            images = [base64Image];
        }

        // Also support the artworks tab model override path (falls back to chat model in sendToOllama).
        let effectiveModelOverride = modelOverride;
        if (!effectiveModelOverride && window.artworksTab?.artworksInstance?.selectedModel) {
            effectiveModelOverride = window.artworksTab.artworksInstance.selectedModel;
        }

        return this.sendToOllama(userPrompt, systemPrompt, contextSize, previousContext, abortSignal, requestId, streamProcessor, null, { images, modelOverride: effectiveModelOverride });
    }

    static updateContextRemaining(usedContext) {
       //console.log('Context used:', usedContext);
        const totalContextSize = parseInt(document.getElementById('context-selector').value);
       //console.log('Total context available:', totalContextSize);

        const percentRemaining = Math.max(0, Math.round(((totalContextSize - usedContext) / totalContextSize) * 100));
       //console.log('Calculated percent remaining:', percentRemaining);

        const contextLabel = document.getElementById('context-remaining-label');
        if (contextLabel) {
            contextLabel.textContent = Lang.get('ollamaContextRemaining', { percent: percentRemaining });
           //console.log('Updated context label to:', contextLabel.textContent);

            if (percentRemaining <= 20) {
                contextLabel.style.color = 'orange';
               //console.log('Context warning: Orange');
            }
            if (percentRemaining <= 10) {
                contextLabel.style.color = 'red';
               //console.log('Context warning: Red');
            }
            if (percentRemaining <= 0) {
                this.contextLimitReached = true;
               //console.log('Context limit reached');

                // Instead of waiting for an alert later, handle it here gracefully
                this.handleContextLimitReached();
            }
        }
    }

    static async handleContextLimitReached() {
        // Get the AI replies container
        const aiReplies = document.querySelector('.ai-replies');
        if (!aiReplies) return;

        // Show a gentle notification
        const notification = document.createElement('div');
        notification.className = 'context-limit-notification';
        notification.style.cssText = `
            background-color: #f97316;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            margin: 15px 0;
            font-size: 14px;
            display: flex;
            align-items: center;
        `;

        notification.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation" style="margin-right: 10px;"></i>
        <div>
            <strong>${Lang.get('contextLimitReachedTitle') || 'Context limit reached'}</strong>
            <p style="margin: 5px 0 0 0;">${Lang.get('contextLimitReachedMessage') || 'You\'ve reached the context limit. A continue button has been added to help you continue the conversation smoothly.'}</p>
        </div>
    `;

        // Find the last assistant message to append the notification
        const assistantMessages = aiReplies.querySelectorAll('.assistant-message');
        if (assistantMessages.length > 0) {
            const lastMessage = assistantMessages[assistantMessages.length - 1];
            const responseContainer = lastMessage.querySelector('.ai-response-container');

            if (responseContainer) {
                responseContainer.appendChild(notification);

                // Create minimal conversations array for continue button
                const conversations = [];

                // Get the last user message (if any)
                const userMessages = aiReplies.querySelectorAll('.user-message');
                if (userMessages.length > 0) {
                    const lastUserMessage = userMessages[userMessages.length - 1].querySelector('.message-bubble')?.innerHTML;
                    if (lastUserMessage) {
                        conversations.push({
                            role: 'user',
                            message: lastUserMessage
                        });
                    }
                }

                // Get the last assistant message
                const lastAssistantMessage = responseContainer?.innerHTML;
                if (lastAssistantMessage) {
                    conversations.push({
                        role: 'assistant',
                        message: lastAssistantMessage
                    });
                }

                // Call our own method directly if we have conversations to use
                if (conversations.length > 0) {
                    // Skip when only the welcome message is present in the UI
                    const assistantMessagesAllOllama = aiReplies.querySelectorAll('.assistant-message');
                    const hasOnlyWelcomeOllama = (assistantMessagesAllOllama.length === 1 && assistantMessagesAllOllama[0].classList.contains('welcome-message'));

                    if (!hasOnlyWelcomeOllama) {
                        const continueButton = this.createContinueButton(conversations, aiReplies);

                        // FIX: Actually append the button to aiReplies
                        aiReplies.appendChild(continueButton);
                    }
                }
            }
        }

        // Now reset the context
        this.resetContext();

    }
    static resetContext() {
        this.totalTokensUsed = 0;
        this.currentContextSize = parseInt(document.getElementById('context-selector').value);
        this.previousContext = null;  // Using class property
        window.currentCheckpoint = null;
        this.contextLimitReached = false;
        // OpenAI message history starts fresh until rebuilt by a continuation.
        this._openAIContextReset = true;

        if (typeof window !== 'undefined') {
            if (window.__paiperworkWhatsappContextOverride) {
                delete window.__paiperworkWhatsappContextOverride;
            }
            if (window.__paiperworkwechatContextOverride) {
                delete window.__paiperworkwechatContextOverride;
            }
        }

        const contextLabel = document.getElementById('context-remaining-label');
        if (contextLabel) {
            contextLabel.style.color = '';
            contextLabel.textContent = Lang.get('ollamaContextRemaining', { percent: 100 });
        }

       //console.log('Context reset complete');
    }
    static async buildCompleteSystemPrompt(hashedMasterKey, basePrompt = '') {
       //console.log('OllamaAPI DEBUG: Building complete system prompt with temporal awareness and language enforcement...');

        let formattedBasePrompt = basePrompt?.trim() || '';
        const hasProvidedBasePrompt = !!formattedBasePrompt;
        const basePromptSignature = hasProvidedBasePrompt
            ? `${formattedBasePrompt.length}:${formattedBasePrompt.slice(0, 80)}`
            : '<db>';
        const browserLanguageValue = (window.Lang && typeof window.Lang.getCurrentLanguage === 'function')
            ? (window.Lang.getCurrentLanguage() || '')
            : (navigator.language || navigator.userLanguage || 'en');

        const whatsappLanguageValue = (window.whatsappIncomingLanguage && String(window.whatsappIncomingLanguage).trim())
            ? String(window.whatsappIncomingLanguage).trim()
            : '';

        const wechatLanguageValue = (window.wechatIncomingLanguage && String(window.wechatIncomingLanguage).trim())
            ? String(window.wechatIncomingLanguage).trim()
            : '';

        const orchestratorLanguageValue = (window.lastOrchestratorDecision && window.lastOrchestratorDecision.language && String(window.lastOrchestratorDecision.language).trim())
            ? String(window.lastOrchestratorDecision.language).trim()
            : '';

        const selectedLanguageValue = orchestratorLanguageValue || whatsappLanguageValue || wechatLanguageValue || browserLanguageValue || 'en';
        const normalizedLanguageCode = this.getLanguageCode(selectedLanguageValue || 'en');
        const normalizedLanguageDisplayName = this.getLanguageDisplayName(selectedLanguageValue || normalizedLanguageCode || 'en');
         /* console.log('OllamaAPI: buildCompleteSystemPrompt language auto-detect', {
            orchestratorLanguageValue,
            whatsappLanguageValue,
            wechatLanguageValue,
            browserLanguageValue,
            selectedLanguageValue,
            originalIncomingTextExample: (window.whatsappIncomingLanguage && window.whatsappIncomingLanguageSample)
                ? window.whatsappIncomingLanguageSample
                : ((window.wechatIncomingLanguage && window.wechatIncomingLanguageSample) ? window.wechatIncomingLanguageSample : undefined)
        });  */
        const dayKey = new Date().toISOString().slice(0, 10);

        let reasoningLevel = '';        
            try {
                if (window.gptOssReasoningLevel) {
                    reasoningLevel = (window.gptOssReasoningLevel || '').toLowerCase().trim();
                }
        } catch (_wErr) {
            // ignore
        }
        if (!reasoningLevel) {
            try {
                const activeBtn = document.querySelector('#gptoss-reasoning-selector .gptoss-reasoning-btn.active');
                if (activeBtn && activeBtn.dataset && activeBtn.dataset.level) {
                    reasoningLevel = (activeBtn.dataset.level || '').toLowerCase().trim();
                }
            } catch (_domErr) {
                // ignore
            }
        }
        if (!reasoningLevel) {
            reasoningLevel = (localStorage.getItem('gptOssReasoningLevel') || '').toLowerCase().trim();
        }

        const selectedModel = document.getElementById('model-selector')?.value || '';
        const baseModel = ((window.getBaseModelName ? window.getBaseModelName(selectedModel) : (selectedModel || '').toLowerCase()) || '').split(':')[0];
        // Reasoning-effort models (gpt-oss family, Qwen3.8) expose a Low/Mid/High selector.
        // Map the UI levels to each model's accepted reasoning_effort values:
        //   gpt-oss : low / medium / high
        //   Qwen3.8 : low / medium / xhigh
        const isReasoningEffortModel = !!(window.isReasoningEffortModel && window.isReasoningEffortModel(selectedModel));
        const isQwen38 = baseModel.startsWith('qwen3.8');
        const appliesReasoningPrefix = isReasoningEffortModel && !!reasoningLevel;
        let reasoningKey = '';
        if (appliesReasoningPrefix) {
            if (reasoningLevel === 'mid') {
                reasoningKey = 'medium';
            } else if (reasoningLevel === 'high' && isQwen38) {
                reasoningKey = 'xhigh';
            } else {
                reasoningKey = reasoningLevel;
            }
        }

        const cacheKey = [
            `sysRev:${this._getRevision(this.systemPromptRevision, hashedMasterKey)}`,
            `insRev:${this._getRevision(this.insightsRevision, hashedMasterKey)}`,
            `lang:${normalizedLanguageCode}`,
            `day:${dayKey}`,
            `reason:${reasoningKey}`,
            `base:${basePromptSignature}`
        ].join('|');

        const cachedEntry = this.systemPromptCache.get(hashedMasterKey);
        if (cachedEntry && cachedEntry.cacheKey === cacheKey && cachedEntry.prompt) {
            return cachedEntry.prompt;
        }

        if (!formattedBasePrompt) {
            const settings = await PaiperworkDB.loadSettings(hashedMasterKey);
            formattedBasePrompt = settings?.systemPrompt || '';
        }

        // Ensure base prompt ends with proper punctuation and space
        if (formattedBasePrompt) {
            // If it doesn't end with punctuation, add a period
            if (!formattedBasePrompt.match(/[.!?;:]$/)) {
                formattedBasePrompt += '.';
            }
            // Always ensure there's a space after the punctuation
            formattedBasePrompt += ' ';
        }

        // Add language enforcement using the canonical display name and code derived from the selected language value.
        let languageEnforcement = '';
        try {
           //console.log('OllamaAPI DEBUG: Adding language enforcement...');

            const normalizedLangCode = normalizedLanguageCode || this.getLanguageCode(selectedLanguageValue || 'en');
            const userLanguage = normalizedLanguageDisplayName || this.getLanguageDisplayName(selectedLanguageValue || normalizedLangCode || 'en');

            // Create language enforcement instruction using human-readable language names.
            // Include the language code as secondary information for clarity.
            languageEnforcement = `Always respond in ${userLanguage} (${normalizedLangCode}). Match the user's language and communication style. If the user writes in ${userLanguage}, respond in ${userLanguage}. `;

           //console.log('OllamaAPI DEBUG: Language enforcement added for:', normalizedLangCode, userLanguage);
        } catch (error) {
            console.error('OllamaAPI: Error adding language enforcement:', error);
            // Continue without language enforcement if there's an error
        }

        // Add temporal awareness with precision formatting
        const now = new Date();
        const dateOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        const formattedDate = now.toLocaleDateString('en-US', dateOptions);

        // Create temporal context section
        const temporalContext = `Current date and time: ${formattedDate}. When providing information: 1) Consider if your knowledge might be outdated relative to the current date. 2) For time-sensitive topics, mention possible limitations. 3) Be transparent about knowledge cutoff when discussing rapidly evolving topics.`;

        // LOAD INSIGHTS: Only load them when the subjective interactions toggle is enabled.
        let insightsString = '';
        try {
            const insightsEnabled = localStorage.getItem('insightsEnabled') === 'true';
            if (insightsEnabled && typeof window.ensureSubjectiveInteractionsLoaded === 'function') {
                await window.ensureSubjectiveInteractionsLoaded();
            }

            const insights = insightsEnabled ? await SubjectiveInteractions.loadInsights(hashedMasterKey) : [];

            if (insights && insights.length > 0) {
               //console.log('OllamaAPI DEBUG: Found insights in database:', insights.length);

                // Clean quotes from insights before joining
                const cleanedInsights = insights.map(insight => insight.replace(/^"|"$/g, ''));

                insightsString = `To better connect with this person, remember: they are unique, with their own story, feelings, and way of seeing the world. Here's what makes them who they are: ${cleanedInsights.join(', ')}`;

                // Ensure insights section ends with proper punctuation
                if (!insightsString.endsWith('.')) {
                    insightsString += '.';
                }

                // Ensure space after punctuation
                insightsString += ' ';

               //console.log('OllamaAPI DEBUG: Insights added to system prompt:', insightsString.substring(0, 100) + '...');
            } else {
               //console.log('OllamaAPI DEBUG: No insights found in database');
            }
        } catch (error) {
            console.error('OllamaAPI: Error loading insights:', error);
        }

        // COMBINE ALL COMPONENTS in the requested order:
        // 1. User saved prompt (base prompt)
        // 2. Language enforcement
        // 3. Insights
        // 4. Temporal context
        const finalPrompt = formattedBasePrompt + languageEnforcement + insightsString + temporalContext;

        // If the gpt-oss reasoning selector is present and a level is set, prepend it to the system prompt
        let finalPromptWithReasoning = finalPrompt;
        try {
            if (appliesReasoningPrefix) {
                const reasoningPrefix = `reasoning:${reasoningKey}\n\n`;
                finalPromptWithReasoning = reasoningPrefix + finalPrompt;
            }
        } catch (e) {
            console.warn('OllamaAPI: error applying gpt-oss reasoning prefix', e);
        }

        /*console.log('OllamaAPI DEBUG: Final system prompt components:', {
            basePromptLength: formattedBasePrompt.length,
            languageEnforcementLength: languageEnforcement.length,
            insightsLength: insightsString.length,
            temporalContextLength: temporalContext.length,
            finalLength: finalPrompt.length
        });*/

        // Enhanced logging to show what's actually in the final prompt
         //console.log('OllamaAPI DEBUG: Complete system prompt with language enforcement + insights:');
         //console.log(finalPrompt);

        const finalResult = finalPromptWithReasoning.trim();
        //console.log('OllamaAPI: buildCompleteSystemPrompt final system prompt length:', finalResult.length);
        //console.log('OllamaAPI: buildCompleteSystemPrompt final system prompt:', finalResult);
        /*console.log('OllamaAPI: buildCompleteSystemPrompt language context:', {
            lang: selectedLanguageValue,
            whatsappLanguageValue,
            orchestratorLanguageValue
        }); */
        this.systemPromptCache.set(hashedMasterKey, {
            cacheKey,
            prompt: finalResult
        });
        return finalResult;
    }

    // Normalizes a user language label/code to ISO-like code for prompt directives.
    static getLanguageCode(langCode) {
        if (!langCode) return 'en';
        const normalized = String(langCode).trim().toLowerCase();
        const languageCodeMap = {
            'en': 'en', 'en-us': 'en', 'en-gb': 'en', 'english': 'en',
            'es': 'es', 'es-es': 'es', 'es-mx': 'es', 'spanish': 'es', 'espanol': 'es', 'español': 'es',
            'fr': 'fr', 'fr-fr': 'fr', 'french': 'fr', 'francais': 'fr', 'français': 'fr',
            'de': 'de', 'de-de': 'de', 'german': 'de', 'deutsch': 'de',
            'it': 'it', 'it-it': 'it', 'italian': 'it', 'italiano': 'it',
            'pt': 'pt', 'pt-br': 'pt', 'pt-pt': 'pt', 'portuguese': 'pt', 'portugues': 'pt', 'português': 'pt',
            'ru': 'ru', 'ru-ru': 'ru', 'russian': 'ru', 'русский': 'ru',
            'ja': 'ja', 'ja-jp': 'ja', 'japanese': 'ja', '日本語': 'ja',
            'ko': 'ko', 'ko-kr': 'ko', 'korean': 'ko', '한국어': 'ko',
            'zh': 'zh', 'zh-cn': 'zh', 'zh-tw': 'zh', 'chinese': 'zh', '中文': 'zh', '简体中文': 'zh', '繁體中文': 'zh', '繁体中文': 'zh',
            'ar': 'ar', 'ar-sa': 'ar', 'arabic': 'ar', 'العربية': 'ar',
            'hi': 'hi', 'hi-in': 'hi', 'hindi': 'hi', 'हिन्दी': 'hi', 'हिंदी': 'hi'
        };
        if (languageCodeMap[normalized]) return languageCodeMap[normalized];
        const base = normalized.split('-')[0];
        if (languageCodeMap[base]) return languageCodeMap[base];
        return 'en';
    }

    // Converts a language code (e.g., 'en-US') to a human-readable language name.
    static getLanguageDisplayName(langCode) {
        const languageMap = {
            'en': 'English',
            'en-us': 'English',
            'en-gb': 'English',
            'english': 'English',
            'es': 'Spanish',
            'es-es': 'Spanish',
            'es-mx': 'Spanish',
            'spanish': 'Spanish',
            'espanol': 'Spanish',
            'español': 'Spanish',
            'fr': 'French',
            'fr-fr': 'French',
            'french': 'French',
            'francais': 'French',
            'français': 'French',
            'de': 'German',
            'de-de': 'German',
            'german': 'German',
            'deutsch': 'German',
            'it': 'Italian',
            'it-it': 'Italian',
            'italian': 'Italian',
            'italiano': 'Italian',
            'pt': 'Portuguese',
            'pt-br': 'Portuguese',
            'pt-pt': 'Portuguese',
            'portuguese': 'Portuguese',
            'portugues': 'Portuguese',
            'português': 'Portuguese',
            'ru': 'Russian',
            'ru-ru': 'Russian',
            'russian': 'Russian',
            'русский': 'Russian',
            'ja': 'Japanese',
            'ja-jp': 'Japanese',
            'japanese': 'Japanese',
            '日本語': 'Japanese',
            'ko': 'Korean',
            'ko-kr': 'Korean',
            'korean': 'Korean',
            '한국어': 'Korean',
            'zh': 'Chinese',
            'zh-cn': 'Chinese',
            'zh-tw': 'Chinese',
            'chinese': 'Chinese',
            '中文': 'Chinese',
            '简体中文': 'Chinese',
            '繁體中文': 'Chinese',
            '繁体中文': 'Chinese',
            'ar': 'Arabic',
            'ar-sa': 'Arabic',
            'arabic': 'Arabic',
            'العربية': 'Arabic',
            'hi': 'Hindi',
            'hi-in': 'Hindi',
            'hindi': 'Hindi',
            'हिन्दी': 'Hindi',
            'हिंदी': 'Hindi',
            'nl': 'Dutch',
            'nl-nl': 'Dutch',
            'dutch': 'Dutch',
            'sv': 'Swedish',
            'sv-se': 'Swedish',
            'swedish': 'Swedish',
            'da': 'Danish',
            'da-dk': 'Danish',
            'danish': 'Danish',
            'no': 'Norwegian',
            'nb-no': 'Norwegian',
            'norwegian': 'Norwegian',
            'fi': 'Finnish',
            'fi-fi': 'Finnish',
            'finnish': 'Finnish',
            'pl': 'Polish',
            'pl-pl': 'Polish',
            'polish': 'Polish',
            'tr': 'Turkish',
            'tr-tr': 'Turkish',
            'turkish': 'Turkish',
            'el': 'Greek',
            'el-gr': 'Greek',
            'greek': 'Greek',
            'he': 'Hebrew',
            'he-il': 'Hebrew',
            'hebrew': 'Hebrew',
            'th': 'Thai',
            'th-th': 'Thai',
            'thai': 'Thai',
            'vi': 'Vietnamese',
            'vi-vn': 'Vietnamese',
            'vietnamese': 'Vietnamese',
            'id': 'Indonesian',
            'id-id': 'Indonesian',
            'indonesian': 'Indonesian',
            'ms': 'Malay',
            'ms-my': 'Malay',
            'malay': 'Malay',
            'uk': 'Ukrainian',
            'uk-ua': 'Ukrainian',
            'ukrainian': 'Ukrainian',
            'cs': 'Czech',
            'cs-cz': 'Czech',
            'czech': 'Czech',
            'sk': 'Slovak',
            'sk-sk': 'Slovak',
            'slovak': 'Slovak',
            'hu': 'Hungarian',
            'hu-hu': 'Hungarian',
            'hungarian': 'Hungarian',
            'ro': 'Romanian',
            'ro-ro': 'Romanian',
            'romanian': 'Romanian',
            'bg': 'Bulgarian',
            'bg-bg': 'Bulgarian',
            'bulgarian': 'Bulgarian',
            'hr': 'Croatian',
            'hr-hr': 'Croatian',
            'croatian': 'Croatian',
            'sr': 'Serbian',
            'sr-rs': 'Serbian',
            'serbian': 'Serbian',
            'sl': 'Slovenian',
            'sl-si': 'Slovenian',
            'slovenian': 'Slovenian',
            'et': 'Estonian',
            'et-ee': 'Estonian',
            'estonian': 'Estonian',
            'lv': 'Latvian',
            'lv-lv': 'Latvian',
            'latvian': 'Latvian',
            'lt': 'Lithuanian',
            'lt-lt': 'Lithuanian',
            'lithuanian': 'Lithuanian'
        };

        // Get base language code (e.g., 'en-US' -> 'en')
        const normalized = String(langCode || '').trim().toLowerCase();
        const baseCode = normalized.split('-')[0];

        // Try exact match first, then base code, then default to English
        return languageMap[normalized] ||
            languageMap[baseCode] ||
            'English';
    }
    // Extracts readable plain text from a stored conversation message for the
    // continuation summary. Code blocks are deliberately DROPPED: they are not
    // useful as summary context and, because the stored HTML duplicates the full
    // code inside data-saved-code / data-clean-code attributes, counting tokens
    // on them exhausts the continuation budget and silently drops the real
    // user prompt + AI reply. HTML entities are decoded for clean text.
    static extractConversationPlainText(content, role = '') {
        if (content === null || content === undefined) return '';
        let text = String(content);
        if (!text.trim()) return '';

        // User continuation turns wrap the real prompt in a hidden div.
        if (role === 'user' && text.includes('continuation-prompt')) {
            const match = text.match(/<div class="continuation-prompt"[^>]*>([\s\S]*?)<\/div>/i);
            if (match && match[1] && String(match[1]).trim()) {
                text = match[1];
            }
        }

        // Drop code blocks entirely (also removes the duplicated code attributes).
        text = text
            .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
            .replace(/<code[\s\S]*?<\/code>/gi, ' ')
            // Strip any remaining HTML tags.
            .replace(/<[^>]*>/g, ' ');

        // Decode common HTML entities so the model receives real characters.
        text = text
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#0*39;/g, "'")
            .replace(/&#0*(\d+);/g, (m, d) => String.fromCharCode(Number(d)));

        return text.replace(/\s+/g, ' ').trim();
    }

    static prepareConversationContext(conversations, maxTokens = 2048) {
        // Clean each message ONCE up-front: drop code blocks, strip HTML and
        // decode entities. Token counting then reflects the real conversational
        // text instead of raw HTML (whose code attributes duplicate the code and
        // could exhaust the budget, dropping the user prompt + AI reply).
        const cleaned = (conversations || []).map(conv => ({
            role: conv.role,
            plainText: this.extractConversationPlainText(conv.message, conv.role),
            timestamp: conv.timestamp
        }));

        // Identify the last N exchanges that fit within our token budget
        let tokenCount = 0;
        let contextMessages = [];

        // Start from the most recent messages, working backwards
        for (let i = cleaned.length - 1; i >= 0; i--) {
            const conv = cleaned[i];
            const messageTokens = this.countTokens(conv.plainText);

            // If adding this message would exceed our budget, stop
            if (tokenCount + messageTokens > maxTokens && contextMessages.length > 0) {
                break;
            }

            // Add this message to our context
            contextMessages.unshift(conv);
            tokenCount += messageTokens;
        }

        // Add summary prefix if we couldn't include all messages
        let contextPrompt = '';
        if (contextMessages.length < cleaned.length) {
            const omittedCount = cleaned.length - contextMessages.length;
            contextPrompt = Lang.get('ollamaConversationStart', { count: omittedCount });
        }

        // Format the context for the AI
        contextMessages.forEach(msg => {
            const rolePrefix = msg.role === 'user' ? 'User: ' : 'Assistant: ';
            contextPrompt += `${rolePrefix}${msg.plainText}\n\n`;
        });

        return {
            contextPrompt,
            includedMessages: contextMessages.length,
            totalTokens: tokenCount
        };
    }
    static async buildContextFromConversations(conversations) {
       //console.log('OllamaAPI: Building context from conversations:', conversations.length);

        if (!conversations || conversations.length === 0) {
           //console.log('OllamaAPI: No conversations provided, resetting context');
            this.previousContext = [];
            this._openAIContextReset = true;
            return [];
        }

        try {
            // OpenAI-compatible context management needs no server-side context
            // initialization round-trip: the conversation turns are simply kept
            // as standard messages and replayed on the next chat request.
            const messages = conversations
                .map(conv => ({
                    role: (String(conv?.role || '').trim().toLowerCase() === 'assistant') ? 'assistant' : 'user',
                    content: String(conv?.message || conv?.content || '').replace(/<[^>]*>?/gm, '') // Strip HTML
                }))
                .filter(msg => msg.role === 'user' || msg.role === 'assistant');

            // Store previous conversations for UI purposes.
            this.previousConversations = conversations;

            // History is now available again for subsequent requests.
            this._openAIContextReset = false;

            return messages;
        } catch (error) {
            console.error('OllamaAPI: Error building context from conversations:', error);
            // Still store the conversations even if context building fails
            this.previousConversations = conversations;
            return null;
        }
    }
    // Continues a previous conversation by sending a continuation prompt and handling the response.
    static async continuePreviousConversation(continuationPrompt, messagesToKeep) {
        window.newImagesAdded = false;
        const progressBar = document.getElementById('progress-bar');
        progressBar.classList.add('active', 'indeterminate');

        // Create AbortController for cancellation
        const abortController = new AbortController();
        window.globalAbortController = abortController;

        // Toggle send button to cancel state
        const sendButton = document.getElementById('send-prompt');
        if (sendButton) {
            sendButton.textContent = Lang.get('cancelButton') || 'Cancel';
            sendButton.style.backgroundColor = '#ef4444'; // Red color for cancel
            sendButton.style.color = 'white';
            sendButton.classList.add('cancel-state');
        }

        try {
            window.isGenerating = true;
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');

            // IMPORTANT: Reset image-related state variables to prevent hanging
            window.selectedImage = null;
            window.cleanedImageBase64 = null;
            window.selectedImages = [];
            window.cleanedImageBase64Array = [];

            // STEP 1: Get the user's proper system prompt with insights and temporal context
            // WITHOUT including any continuation context
            const systemPrompt = await this.buildCompleteSystemPrompt(hashedMasterKey);

            const contextSize = document.getElementById('context-selector').value;
            const selectedModel = document.getElementById('model-selector').value;
            const modelParams = this.getModelParameters(selectedModel);
            const routing = await this.getOpenAIRoutingForModel(selectedModel);
            const aiReplies = document.querySelector('.ai-replies');

            // STEP 2: The user prompt will contain the continuation instructions and previous messages
            // Process continuationPrompt to remove any image data
            let cleanedPrompt = continuationPrompt;
            if (typeof continuationPrompt === 'string') {
                // Remove any base64 image data to reduce token usage and prevent hanging
                cleanedPrompt = continuationPrompt.replace(/data:image\/[^;]+;base64,[a-zA-Z0-9+/=]+/g, '[IMAGE DATA]');
            }

            const userPrompt = `${cleanedPrompt}\n\nPlease continue our conversation based on this context.`;
            const noticeToUser = `<i>${Lang.get('continuationFromPrevious')}</i>`;
            // Create AI message container div
            const aiDiv = document.createElement('div');
            aiDiv.className = 'assistant-message';
            aiReplies.appendChild(aiDiv);

            // Create the stream processor, which will create its own response container
            const streamProcessor = this.createStreamProcessorForRouting(routing.source === 'cloud');

            // Detach the auto-created container from aiReplies
            const autoContainer = streamProcessor.responseContainer;
            if (autoContainer.parentNode) {
                autoContainer.parentNode.removeChild(autoContainer);
            }

            // And add it to our aiDiv instead
            aiDiv.appendChild(streamProcessor.responseContainer);

            // STEP 3: Send to Ollama with CLEAR separation of system prompt and user continuation prompt.
            // The continuation prompt is self-contained (it embeds the prepared conversation
            // summary), so no prior messages are replayed here.
            const isCloudRouting = routing.source === 'cloud';
            let cloudResponseText = '';
            const requestBody = this.buildOpenAIChatPayload({
                model: routing.modelName || document.getElementById('model-selector').value,
                system: systemPrompt,
                userPrompt,
                contextSize,
                modelParams,
                think: null,
                stream: true,
                historyMessages: []
            });

            const cloudPromptText = `${systemPrompt || ''}\n${userPrompt || ''}`;

            const response = await fetch(`${routing.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: routing.headers,
                body: JSON.stringify(requestBody),
                signal: abortController.signal // Add the abort signal here
            });

            if (response.status === 429) {
                const errorText = await response.text();
                this.showBlockingOllamaWarning(this.getOllamaRateLimitMessage(), { scope: 'continuation-rate-limit' });
                aiDiv.remove();
                throw new Error(`${this.getOllamaRateLimitMessage()}${errorText ? `\n${errorText}` : ''}`);
            }

            if (response.status === 500) {
                this.showBlockingOllamaWarning(Lang.get('ollamaContextSizeError'), { scope: 'continuation-500' });
                aiDiv.remove();
                return false;
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama request failed (${response.status}): ${errorText || response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let streamBuffer = '';
            let streamUsage = null;

            const finalizeContinuation = async () => {
                const buttons = streamProcessor.responseContainer.querySelectorAll('.code-copy-btn');
                buttons.forEach(button => button.style.display = 'block');

                // Normal OpenAI context accounting via server-reported usage.
                if (streamUsage) {
                    OllamaAPI.updateContextFromUsage(streamUsage, cloudPromptText, cloudResponseText);
                } else if (isCloudRouting) {
                    this.trackCloudTokenUsage(cloudPromptText, cloudResponseText);
                }

                if (this.contextLimitReached) {
                    this.showBlockingOllamaWarning(Lang.get('ollamaContextSizeError'), { scope: 'continuation-context-limit' });
                    this.resetContext();
                }

                streamProcessor.finishResponse();

                // Add message action buttons BEFORE capturing the HTML for storage
                if (window.chat && typeof window.chat.addMessageActionsToMessage === 'function') {
                    window.chat.addMessageActionsToMessage(aiDiv);
                }

                // Now capture the HTML AFTER adding buttons
                const aiResponse = streamProcessor.responseContainer.outerHTML;

                OllamaAPI.scrollToBottom();

                // The continuation succeeded: history is rebuilt from the DOM again.
                this._openAIContextReset = false;

                // Use the stored conversation group from when the session was loaded
                const targetConversationGroup = window.currentConversationGroup;

                // Store this as a regular conversation turn
                const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                await PaiperworkDB.storeConversationOnly(
                    hashedMasterKey,
                    `${noticeToUser}<div class="continuation-prompt" style="display:none;">${continuationPrompt}</div>`,
                    aiResponse,
                    false,
                    targetConversationGroup
                );

                if (window.chatTab && typeof window.chatTab.loadSessionsList === 'function') {
                    const updatedSessions = await window.chatTab.loadSessionsList(hashedMasterKey);
                    window.chatTab.renderSessionsList(updatedSessions);
                }

                // Re-enable the prompt input and restore original placeholder
                const promptInput = document.getElementById('prompt-input');
                if (promptInput) {
                    promptInput.disabled = false;

                    if (promptInput.dataset.originalPlaceholder) {
                        promptInput.placeholder = promptInput.dataset.originalPlaceholder;
                    } else {
                        promptInput.placeholder = Lang.get('enterMessage') || 'Enter your message...';
                    }

                    promptInput.focus();
                }

                return true;
            };

            // Process the stream (OpenAI SSE).
            let sawDoneEvent = false;
            while (true) {
                const { value, done } = await reader.read();
                streamBuffer += decoder.decode(value || new Uint8Array(), { stream: !done });
                const lines = streamBuffer.split('\n');
                streamBuffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const parsed = this.parseOpenAIChatStreamLine(line);
                        if (!parsed) continue;
                        if (parsed.usage) {
                            streamUsage = parsed.usage;
                        }
                        if (parsed.content) {
                            streamProcessor.processChunk(parsed.content);
                            if (isCloudRouting) {
                                cloudResponseText += parsed.content;
                            }
                        }
                        if (parsed.finishReason || parsed.done) {
                            sawDoneEvent = true;
                        }
                        OllamaAPI.scrollToBottom();
                    } catch (error) {
                        console.error('Error processing chunk:', error);
                    }
                }

                if (done) {
                    const tail = streamBuffer.trim();
                    if (tail) {
                        try {
                            const parsed = this.parseOpenAIChatStreamLine(tail);
                            if (parsed) {
                                if (parsed.usage) {
                                    streamUsage = parsed.usage;
                                }
                                if (parsed.content) {
                                    streamProcessor.processChunk(parsed.content);
                                    if (isCloudRouting) {
                                        cloudResponseText += parsed.content;
                                    }
                                }
                                if (parsed.finishReason || parsed.done) {
                                    sawDoneEvent = true;
                                }
                            }
                        } catch (_tailErr) {
                            // Ignore trailing partial line on stream end.
                        }
                    }
                    break;
                }

                OllamaAPI.scrollToBottom();
            }

            if (streamProcessor && streamProcessor.responseContainer) {
                return await finalizeContinuation();
            }

            return true;
        } catch (error) {
            console.error('Error in conversation continuation:', error);

            // Handle abort errors specially
            if (error.name === 'AbortError') {
               //console.log('Continuation was cancelled by user');

                // If there's a cleanup function for incomplete responses, call it
                if (window.cleanupIncompleteResponses && typeof window.cleanupIncompleteResponses === 'function') {
                    window.cleanupIncompleteResponses();
                }

                // Remove any partial response message
                const aiReplies = document.querySelector('.ai-replies');
                const lastMessage = aiReplies.querySelector('.assistant-message:last-child');
                if (lastMessage) {
                    lastMessage.remove();
                }

                // Also remove the separator
                const separator = aiReplies.querySelector('.conversation-continuation-marker');
                if (separator) {
                    separator.remove();
                }

                return false; // Explicitly return false for AbortError to preserve the continue button
            } else {
                // Regular error handling for non-abort errors
                return false;
            }
        } finally {
            progressBar.classList.remove('active', 'indeterminate');
            window.isGenerating = false;

            // Reset the send button back to normal
            if (sendButton) {
                sendButton.textContent = Lang.get('sendButton') || 'Send';
                sendButton.style.backgroundColor = '';
                sendButton.style.color = '';
                sendButton.classList.remove('cancel-state');
            }

            // Clear the global abort controller
            window.globalAbortController = null;
        }

        return true;
    }
    static createContinueButton(conversations, aiReplies) {
        // Create continuation UI element
        const continuationDiv = document.createElement('div');
        continuationDiv.className = 'continuation-container';
        continuationDiv.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 20px auto;
        padding: 10px;
        max-width: 900px;
    `;

        const continueButton = document.createElement('button');
        continueButton.textContent = Lang.get('ollamaContinueButton');
        continueButton.className = 'continue-btn';
        continueButton.style.cssText = `
        padding: 8px 16px;
        background-color: var(--accent-color, #4f46e5);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: all 0.2s;
    `;

        continueButton.addEventListener('mouseover', function () {
            this.style.backgroundColor = 'var(--accent-color-hover, #4338ca)';
            this.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        });

        continueButton.addEventListener('mouseout', function () {
            this.style.backgroundColor = 'var(--accent-color, #4f46e5)';
            this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });

        continueButton.addEventListener('click', async function () {
            try {
                this.disabled = true;
                this.textContent = Lang.get('ollamaContinueProcessing');

                // FIRST: Add the "Continue conversation" user message
                const continueUserMessage = document.createElement('div');
                continueUserMessage.className = 'user-message continue-message';
                continueUserMessage.style.flexDirection = 'column';
                continueUserMessage.style.display = 'flex';
                continueUserMessage.style.alignSelf = 'flex-end';
                continueUserMessage.style.alignItems = 'flex-end';
                continueUserMessage.style.textAlign = 'right';
                continueUserMessage.innerHTML = `<div class="message-bubble">${Lang.get('continueConversation') || 'Continue conversation'}</div><br>`;

                // Add the continue user message to the chat BEFORE removing the continue button
                aiReplies.appendChild(continueUserMessage);

                // Remove the continue button container since we're about to continue
                continuationDiv.remove();

                // IMPROVED: Load only conversations from the current group
                const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                const result = await PaiperworkDB.loadConversationsByGroup(
                    hashedMasterKey,
                    window.currentConversationGroup // Use the current group ID
                );

                if (!result?.conversations || result.conversations.length === 0) {
                    console.error('No conversations found when trying to continue');
                    // Re-add the continue button if we failed
                    aiReplies.appendChild(continuationDiv);
                    this.disabled = false;
                    this.textContent = Lang.get('ollamaContinueButton');
                    // Remove the user message we just added since continuation failed
                    continueUserMessage.remove();
                    return;
                }

                // Use the group-filtered conversations
                const freshConversations = result.conversations;

                // Add the "Continue conversation" message to the conversations array for database storage
                freshConversations.push({
                    role: 'user',
                    message: Lang.get('continueConversation') || 'Continue conversation',
                    timestamp: Date.now()
                });

                // 1. Calculate token budget based on available context
                const contextSize = parseInt(document.getElementById('context-selector').value || 8192);
                const summaryBudget = Math.min(Math.floor(contextSize * 0.25), 2048); // Use at most 25% of context

                // 2. Prepare the context summary from the FRESH conversations
                const contextData = OllamaAPI.prepareConversationContext(freshConversations, summaryBudget);

                // 3. Create a visual separator for continuation
                const separatorDiv = document.createElement('div');
                separatorDiv.className = 'conversation-continuation-marker';
                separatorDiv.innerHTML = `
                <div style="display: flex; align-items: center; margin: 20px 0;">
                    <hr style="flex-grow: 1; border: none; border-top: 1px dashed #ccc;">
                    <span style="margin: 0 10px; color: #666; font-size: 12px;">${Lang.get('ollamaContinuingMessage')}</span>
                    <hr style="flex-grow: 1; border: none; border-top: 1px dashed #ccc;">
                </div>
            `;

                aiReplies.appendChild(separatorDiv);

                // 4. Scroll to the separator
                separatorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // 5. Create a system message to help the AI continue properly
                const continuationPrompt = `You are continuing a previous conversation. Consider the context below and continue naturally from where you left off:

            ${contextData.contextPrompt}
            
            Continue the conversation naturally from this point.`;

                // Log how much context we're including
               //console.log(`OllamaAPI: Creating continuation with ${contextData.includedMessages} messages (${contextData.totalTokens} tokens)`);

                // 6. Send the continuation prompt to Ollama
                const success = await OllamaAPI.continuePreviousConversation(continuationPrompt, contextData.includedMessages);

                if (success) {
                    // Reset image data to ensure clean state
                    window.selectedImage = null;
                    window.cleanedImageBase64 = null;
                    window.selectedImages = [];
                    const imageButton = document.getElementById('image-button');
                    if (imageButton) {
                        imageButton.classList.remove('active');
                        imageButton.style.backgroundColor = '#404040';
                        imageButton.style.color = 'white';

                        // Remove badge if any
                        const badge = imageButton.querySelector('.image-count-badge');
                        if (badge) {
                            badge.remove();
                        }
                    }

                } else {
                    // If continuation failed, restore the continue button and remove the user message
                    aiReplies.appendChild(continuationDiv);
                    continueUserMessage.remove();
                    this.disabled = false;
                    this.textContent = Lang.get('ollamaContinueButton');
                }
            } catch (error) {
                console.error('Error continuing conversation:', error);
                this.showBlockingOllamaWarning(Lang.get('ollamaContinuationError'), { scope: 'continuation-error' });
                // Restore the continue button if there was an error
                aiReplies.appendChild(continuationDiv);
                // Remove the user message we added
                const continueUserMessage = aiReplies.querySelector('.continue-message');
                if (continueUserMessage) {
                    continueUserMessage.remove();
                }
                this.disabled = false;
                this.textContent = Lang.get('ollamaContinueButton');
            }

            const modelSelector = document.getElementById('model-selector');
        });

        continuationDiv.appendChild(continueButton);
        setTimeout(() => {
            continuationDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
           //console.log('Scrolled to continue button to ensure visibility');
        }, 150);
        return continuationDiv;
    }
    static scrollToBottom() {
        // Always check window.autoScrollEnabled with a safe default
        if (window.autoScrollEnabled === false) {
            return;
        }

        // Rest of your scrolling code...
        clearTimeout(this.scrollDebounceTimeout);

        this.scrollDebounceTimeout = setTimeout(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const aiReplies = document.querySelector('.ai-replies');
                    if (aiReplies) {
                        aiReplies.scrollTop = aiReplies.scrollHeight + 100;
                       //console.log('Scroll executed, height:', aiReplies.scrollHeight);
                    }
                });
            });
        }, 1000);
    }
    static async loadVisualModels() {
        try {
            // Always prefer runtime global list when available.
            // This avoids getting stuck with fallback defaults if this file initialized first.
            if (window.VISUAL_MODELS && Array.isArray(window.VISUAL_MODELS) && window.VISUAL_MODELS.length > 0) {
                const normalizedGlobal = window.VISUAL_MODELS
                    .map(model => String(model || '').trim())
                    .filter(Boolean);

                const shouldRefreshFromGlobal = !Array.isArray(this.visualModels)
                    || this.visualModelsSource !== 'global'
                    || this.visualModels.length !== normalizedGlobal.length
                    || this.visualModels.some((model, index) => model !== normalizedGlobal[index]);

                if (shouldRefreshFromGlobal) {
                    this.visualModels = normalizedGlobal;
                    this.visualModelsSource = 'global';
                }

                return this.visualModels;
            }

            // If we already have a list (from a previous global load), keep it.
            if (Array.isArray(this.visualModels) && this.visualModels.length > 0) {
                return this.visualModels;
            }

            // Fallback to default list if not available
            console.warn('OllamaAPI: VISUAL_MODELS not found, using default list');
            this.visualModels = ['gemma3', 'llava', 'llama-vision', 'phi3-vision', 'bakllava'];
            this.visualModelsSource = 'fallback';
            return this.visualModels;
        } catch (error) {
            console.error('OllamaAPI: Error loading visual models list:', error);
            this.visualModels = ['gemma3', 'llava', 'llama-vision', 'phi3-vision', 'bakllava'];
            this.visualModelsSource = 'fallback';
            return this.visualModels;
        }
    }

    static isVisualModel(modelName) {
        if (!this.visualModels) {
           //console.log('OllamaAPI: Visual models list not loaded yet');
            return false;
        }

        if (!modelName) {
           //console.log('OllamaAPI: No model name provided to isVisualModel');
            return false;
        }

        const modelCandidates = this.getModelMatchCandidates(modelName);
        if (!modelCandidates.length) return false;

        // 1) Prefer capability/tag-derived hints when available.
        // 2) Always fall back to VISUAL_MODELS identifier list for cloud models that may be untagged.
        const matchedByTags = modelCandidates.some(candidate => this.taggedVisualModelNames.has(candidate));
        if (matchedByTags) {
            return true;
        }

        // Check if any visual model identifier is contained in the selected model.
        const isVisual = this.visualModels.some(visualModel => {
            const visualCandidates = this.getModelMatchCandidates(visualModel);
            if (!visualCandidates.length) return false;

            const isMatch = visualCandidates.some(visualCandidate =>
                modelCandidates.some(modelCandidate =>
                    modelCandidate.includes(visualCandidate) || visualCandidate.includes(modelCandidate)
                )
            );
            if (isMatch) {
               //console.log(`OllamaAPI: Match found! '${visualModel}' matched model '${modelName}'`);
            }
            return isMatch;
        });

       //console.log(`OllamaAPI: Model '${modelName}' is visual:`, isVisual);
        return isVisual;
    }
}
window.OllamaAPI = OllamaAPI;
(async function () {
    try {
        // Pre-load the visual models list when the file loads
        await OllamaAPI.loadVisualModels();
       //console.log('OllamaAPI: Visual models preloaded:', OllamaAPI.visualModels);
    } catch (error) {
        console.error('OllamaAPI: Failed to preload visual models:', error);
    }
})();