class ChatTab {
    constructor() {
        this.initialized = false;
        this.ollamaApiKeyModalPromise = null;
        window.chat = new Chat();
        window.chatInstance = window.chat;
    }

    closeAllOllamaApiKeyModals() {
        const overlays = document.querySelectorAll('.ollama-api-key-overlay');
        overlays.forEach((overlay) => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
    }

    async cancelActiveGenerationForTransition(reason = 'conversation-transition') {
        const hasActiveGeneration = !!(window.isGenerating || window.globalAbortController);
        if (!hasActiveGeneration) return;

        try {
            if (window.chat && typeof window.chat.cancelOllamaGeneration === 'function') {
                window.chat.cancelOllamaGeneration();
            } else if (typeof window.cancelOllamaGeneration === 'function') {
                window.cancelOllamaGeneration();
            } else if (window.globalAbortController) {
                window.globalAbortController.abort();
                window.globalAbortController = null;
            }
        } catch (cancelError) {
            console.warn(`ChatTab: Failed to cancel in-flight generation during ${reason}`, cancelError);
        }

        window.isGenerating = false;
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.classList.remove('active', 'indeterminate');
        }
        const sendButton = document.getElementById('send-prompt');
        if (sendButton) {
            sendButton.textContent = Lang.get('sendButton') || 'Send';
            sendButton.style.backgroundColor = '';
            sendButton.style.color = '';
            sendButton.classList.remove('cancel-state');
        }
    }

    // Initializes the chat tab, sets up UI, loads settings, and prepares the chat environment.
    async initialize() {
       //console.log('ChatTab: Initializing chat tab instance');
        // Add CSS for insights editor
        const style = document.createElement('style');
        style.id = 'insights-editor-styles';
        style.textContent = `
            .insights-editor-overlay {
                z-index: 1000;
                animation: fade-in 0.2s ease-out;
            }
            
            .insights-editor-content {
                animation: slide-up 0.3s ease-out;
            }
            
            .insight-item {
                transition: background-color 0.2s;
            }
            
            .insight-item:hover {
                background-color: var(--bg-color, #fff) !important;
            }
            
            .insight-input:focus {
                outline: 2px solid var(--accent-color, #4f46e5);
                border-color: transparent;
            }
            
            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slide-up {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;

        // Add the style to the document head if it doesn't already exist
        if (!document.getElementById('insights-editor-styles')) {
            document.head.appendChild(style);
        }

        if (this.initialized) {
           //console.log('ChatTab: Already initialized, skipping');
            return true;
        }

        try {
            // Get the current hashed masterkey
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            if (!hashedMasterKey) {
                console.error('ChatTab: No hashed masterkey found in localStorage');
                return false;
            }

            // Make sure Chat module is loaded and initialized first
            if (!window.chat) {
               //console.log('ChatTab: Creating new Chat instance');
                window.chat = new Chat();
                await window.chat.initialize();
            } else if (!window.chat.initialized) {
               //console.log('ChatTab: Initializing existing Chat instance');
                await window.chat.initialize();
            } else {
               //console.log('ChatTab: Using existing initialized Chat instance');
            }

            // Set up UI elements with proper context
            this.setupUIElements();
            this.setupConversationHistoryHandlers();
            // Load masterkey data (system prompt, context size, insights toggle)
            await this.loadMasterKeyData(hashedMasterKey);

            // Set up event handlers
            this.setupEventListeners();

            const systemPromptElement = document.getElementById('system-prompt');
            if (systemPromptElement) {
               //console.log('ChatTab: Building complete system prompt using OllamaAPI');
                const enhancedPrompt = await OllamaAPI.buildCompleteSystemPrompt(hashedMasterKey);
               //console.log('ChatTab: System prompt enhanced with temporal context and insights');
                window.enhancedSystemPrompt = enhancedPrompt; // Store for future use
            }

            //Load conversation sessions instead of loading the full history
            const sessions = await this.loadSessionsList(hashedMasterKey);
            this.renderSessionsList(sessions);

            // If there are no previous sessions, show welcome message
            //if (!sessions || sessions.length === 0) {
            this.showWelcomeMessage();
            // }

            // ADD: Check for thinking toggle after model selector is loaded
           //console.log('🧠 ChatTab: Checking for thinking toggle button after initialization');
            await this.checkInitialThinkingToggle();

            this.initialized = true;
           //console.log('ChatTab: Chat tab instance initialized successfully');
            return true;
        } catch (error) {
            console.error('ChatTab: Error initializing chat tab:', error);
            return false;
        }

    }

    // Checks if the "thinking" toggle should be shown for the current model and updates UI accordingly.
    async checkInitialThinkingToggle() {
       //console.log('🧠 ChatTab: Starting initial thinking toggle check');

        const selectedProvider = (window.OllamaAPI && typeof window.OllamaAPI.getSelectedModelSource === 'function')
            ? (window.OllamaAPI.getSelectedModelSource() || 'local')
            : 'local';

        // Local daemon version checks do not apply to cloud-selected models.
        if (selectedProvider !== 'cloud') {
            const ollamaVersion = await this.getOllamaVersion();
           //console.log('🔍 ChatTab: Ollama version detected:', ollamaVersion);

            if (!this.isVersionSupported(ollamaVersion, '0.9.0')) {
               //console.log('🚫 ChatTab: Ollama version too old for thinking feature. Requires 0.9.0+, found:', ollamaVersion);
                return;
            }
        }

        // Wait for model selector to be available and populated
        const modelSelector = document.getElementById('model-selector');
        if (!modelSelector) {
            console.warn('🧠 ChatTab: Model selector not found during initial check');
            return;
        }

        // Wait for the model selector to be populated (check if it has options beyond the default)
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait

        while (attempts < maxAttempts) {
            if (modelSelector.options.length > 1) {
                // Model selector is populated
                break;
            }

            // Wait 100ms and try again
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (attempts >= maxAttempts) {
            console.warn('🧠 ChatTab: Timeout waiting for model selector to be populated');
            return;
        }

       //console.log('🧠 ChatTab: Model selector populated, checking current model');

        // Get the current model value
        const currentModel = modelSelector.value;

        if (currentModel) {
           //console.log('🧠 ChatTab: Found current model on startup:', currentModel);

            // Ensure isThinkingModel function is available
            if (window.isThinkingModel && typeof window.isThinkingModel === 'function') {
                // Check if current model supports thinking and update UI accordingly
                this.updateThinkingToggleUI(currentModel);
            } else {
                console.warn('🧠 ChatTab: isThinkingModel function not available yet, scheduling retry');

                // Retry after a short delay to allow other scripts to load
                setTimeout(() => {
                    if (window.isThinkingModel && typeof window.isThinkingModel === 'function') {
                       //console.log('🧠 ChatTab: Retrying thinking toggle check after delay');
                        this.updateThinkingToggleUI(currentModel);
                    } else {
                        console.error('🧠 ChatTab: isThinkingModel function still not available after retry');
                    }
                }, 500);
            }
        } else {
           //console.log('🧠 ChatTab: No model selected on startup, thinking toggle check skipped');
        }
    }

    addModelChangeContinueButton() {
        const aiReplies = document.querySelector('.ai-replies');
        if (!aiReplies || !window.OllamaAPI || typeof window.OllamaAPI.createContinueButton !== 'function') {
            return;
        }

        const assistantMessages = Array.from(aiReplies.querySelectorAll('.assistant-message'))
            .filter(message => !message.classList.contains('welcome-message'));

        if (assistantMessages.length === 0) {
            return;
        }

        const conversations = [];
        const messageNodes = aiReplies.querySelectorAll('.user-message, .assistant-message');

        messageNodes.forEach(node => {
            if (node.classList.contains('assistant-message')) {
                if (node.classList.contains('welcome-message')) {
                    return;
                }
                const assistantMessage = node.querySelector('.ai-response-container')?.innerHTML;
                if (assistantMessage) {
                    conversations.push({
                        role: 'assistant',
                        message: assistantMessage,
                        timestamp: Date.now()
                    });
                }
                return;
            }

            const userMessage = node.querySelector('.message-bubble')?.innerHTML;
            if (userMessage) {
                conversations.push({
                    role: 'user',
                    message: userMessage,
                    timestamp: Date.now()
                });
            }
        });

        if (conversations.length === 0) {
            return;
        }

        const existingButtons = aiReplies.querySelectorAll('.continuation-container');
        existingButtons.forEach(button => button.remove());

        const continueButton = window.OllamaAPI.createContinueButton(conversations, aiReplies);
        const resetNote = document.createElement('div');
        resetNote.className = 'context-reset-note';
        resetNote.style.cssText = 'width:100%; text-align:center; align-self:flex-start; margin-bottom:8px;';
        resetNote.innerHTML = `<small style="color: #888; font-style: italic;">${Lang.get('modelChangeContextResetNote') || Lang.get('contextResetNote') || 'Context was reset due to model change'}</small>`;

        if (continueButton.firstChild) {
            continueButton.insertBefore(resetNote, continueButton.firstChild);
        } else {
            continueButton.appendChild(resetNote);
        }

        aiReplies.appendChild(continueButton);
        setTimeout(() => {
            try {
                continueButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch (_e) {
                // ignore scroll errors
            }
        }, 50);
    }

    // Fetches the current Ollama server version from the local API.
    async getOllamaVersion() {
        try {
            const selectedProvider = (window.OllamaAPI && typeof window.OllamaAPI.getSelectedModelSource === 'function')
                ? (window.OllamaAPI.getSelectedModelSource() || 'local')
                : 'local';

            // Version endpoint is local-daemon specific; cloud models should bypass this check.
            if (selectedProvider === 'cloud') {
                return this._lastKnownOllamaVersion || null;
            }

            const response = await fetch('http://localhost:11434/api/version', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 429) {
                    console.warn('🔍 ChatTab: Local version check rate-limited (429).', (window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached (429).');
                    return this._lastKnownOllamaVersion || null;
                }
                console.warn('🔍 ChatTab: Failed to fetch Ollama version, status:', response.status);
                return null;
            }

            const data = await response.json();
            const version = data.version || null;
            if (version) {
                this._lastKnownOllamaVersion = version;
            }
            return version;
        } catch (error) {
            console.warn('🔍 ChatTab: Error fetching Ollama version:', error.message);
            // Use the last known good version to avoid flickering/removal on transient failures.
            return this._lastKnownOllamaVersion || null;
        }
    }

    // Compares two version strings to determine if the current version meets the required version.
    isVersionSupported(currentVersion, requiredVersion) {
        if (!currentVersion) {
            const selectedProvider = (window.OllamaAPI && typeof window.OllamaAPI.getSelectedModelSource === 'function')
                ? (window.OllamaAPI.getSelectedModelSource() || 'local')
                : 'local';
            if (selectedProvider === 'cloud') {
                return true;
            }
            console.warn('🔍 ChatTab: No Ollama version available, assuming not supported');
            return false;
        }

        // Parse version strings (e.g., "0.9.0" -> [0, 9, 0])
        const parseVersion = (version) => {
            return version.split('.').map(num => parseInt(num, 10));
        };

        try {
            const current = parseVersion(currentVersion);
            const required = parseVersion(requiredVersion);

            // Compare major.minor.patch
            for (let i = 0; i < Math.max(current.length, required.length); i++) {
                const currentPart = current[i] || 0;
                const requiredPart = required[i] || 0;

                if (currentPart > requiredPart) {
                    return true;
                } else if (currentPart < requiredPart) {
                    return false;
                }
                // If equal, continue to next part
            }

            // All parts are equal, version is supported
            return true;
        } catch (error) {
            console.error('🔍 ChatTab: Error parsing version strings:', error);
            return false;
        }
    }

    showCloudModelPrepToast(message) {
        console.info('[CloudPrep] Toast show:', message || 'Preparing cloud model...');

        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '10080';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.background = 'rgba(0, 0, 0, 0.35)';

        const modal = document.createElement('div');
        modal.style.width = 'min(460px, 90vw)';
        modal.style.background = 'var(--panel-background, #222426)';
        modal.style.border = '1px solid var(--border-color, #404040)';
        modal.style.borderRadius = '10px';
        modal.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.35)';
        modal.style.color = 'var(--text-color, #f5f5f5)';
        modal.style.padding = '14px';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.gap = '10px';

        const title = document.createElement('div');
        title.textContent = 'Cloud Model Preparation';
        title.style.fontSize = '14px';
        title.style.fontWeight = '600';

        const body = document.createElement('div');
        body.textContent = message || 'Downloading model metadata, please wait (or close this window and choose a different model).';
        body.style.fontSize = '13px';
        body.style.lineHeight = '1.4';

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.justifyContent = 'flex-end';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.padding = '7px 11px';
        closeBtn.style.border = '1px solid var(--border-color, #404040)';
        closeBtn.style.borderRadius = '6px';
        closeBtn.style.background = 'transparent';
        closeBtn.style.color = 'var(--text-color, #f5f5f5)';
        closeBtn.style.cursor = 'pointer';

        let userClosed = false;
        closeBtn.addEventListener('click', () => {
            userClosed = true;
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            console.info('[CloudPrep] Toast manually closed by user');
        });

        actions.appendChild(closeBtn);
        modal.appendChild(title);
        modal.appendChild(body);
        modal.appendChild(actions);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        return () => {
            console.info('[CloudPrep] Toast close');
            if (userClosed) {
                return;
            }
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };
    }

    async prepareSelectedCloudModel(modelName, options = {}) {
        const modelNameStr = String(modelName || '').trim();
        console.info('[CloudPrep] prepareSelectedCloudModel called', {
            modelName: modelNameStr
        });
        const selectedProvider = ((window.OllamaAPI && typeof window.OllamaAPI.getModelSource === 'function')
            ? (window.OllamaAPI.getModelSource(modelNameStr) || window.OllamaAPI.getSelectedModelSource?.() || 'local')
            : 'local');
        console.info('[CloudPrep] provider resolved', { selectedProvider });
        if (selectedProvider !== 'cloud') {
            console.info('[CloudPrep] skip: not a cloud model');
            return true;
        }

        const hasExternalToast = !!(options && typeof options.closeToast === 'function');
        const closeToast = hasExternalToast
            ? options.closeToast
            : this.showCloudModelPrepToast('Downloading model metadata, please wait (or close this window and choose a different model).');
        const toastStart = Date.now();

        const routing = await OllamaAPI.getApiRoutingForModel(modelName);
        const requiresDirectCloudKey = routing && routing.baseUrl === '/api/cloud';
        const hasCloudKey = !!(routing && routing.headers && routing.headers['Authorization']);
        console.info('[CloudPrep] routing resolved', {
            source: routing?.source,
            baseUrl: routing?.baseUrl,
            apiModelName: routing?.modelName,
            hasCloudKey,
            requiresDirectCloudKey
        });
        if (requiresDirectCloudKey && !hasCloudKey) {
            console.warn('[CloudPrep] skip: no cloud key available yet');
            closeToast();
            return false;
        }

        try {
            if (requiresDirectCloudKey) {
                // Direct ollama.com routing does not use local daemon pull semantics.
                console.info('[CloudPrep] direct cloud mode: skipping local pull, refreshing metadata only', {
                    model: routing.modelName || modelName
                });
            } else {
                console.info('[CloudPrep] pull start', { model: routing.modelName || modelName });
                await OllamaAPI.ensureCloudModelPulled(routing.modelName || modelName, routing.headers);
                console.info('[CloudPrep] pull success', { model: routing.modelName || modelName });
            }
            await this.refreshModelMaximumContextLabel(modelNameStr);
            return true;
        } catch (error) {
            console.error('[CloudPrep] pull failed', error);
            throw error;
        } finally {
            const elapsed = Date.now() - toastStart;
            if (elapsed < 800) {
                await new Promise(resolve => setTimeout(resolve, 800 - elapsed));
            }
            closeToast();
        }
    }

    async refreshModelMaximumContextLabel(modelName) {
        const nativeCtxEl = document.getElementById('model-native-context');
        if (nativeCtxEl) {
            nativeCtxEl.textContent = Lang.get('retrievingModelContext') || 'Retrieving model max context size...';
            nativeCtxEl.removeAttribute('title');
        }

        try {
            const metaResult = await OllamaAPI.fetchModelMetadata(modelName, { autoload: true, retryDelayMs: 500 });
            const nativeContext = (metaResult && metaResult.nativeContext !== null && metaResult.nativeContext !== undefined)
                ? Number(metaResult.nativeContext)
                : null;
            const displayVal = Number.isFinite(nativeContext)
                ? this.formatTokenCountForDisplay(nativeContext)
                : 'n/a';
            if (nativeCtxEl) {
                nativeCtxEl.textContent = displayVal;
                if (Number.isFinite(nativeContext)) {
                    nativeCtxEl.title = `${Math.round(nativeContext).toLocaleString()} tokens`;
                } else {
                    nativeCtxEl.removeAttribute('title');
                }
            }
            return displayVal;
        } catch (metaErr) {
            console.warn('ChatTab: Error fetching model metadata', metaErr);
            if (nativeCtxEl) {
                nativeCtxEl.textContent = 'n/a';
                nativeCtxEl.removeAttribute('title');
            }
            return 'n/a';
        }
    }

    formatTokenCountForDisplay(rawValue) {
        const value = Number(rawValue);
        if (!Number.isFinite(value) || value <= 0) {
            return 'n/a';
        }

        const rounded = Math.round(value);

        const compact = (divisor, suffix) => {
            const normalized = rounded / divisor;
            const shown = normalized < 100 ? Math.round(normalized * 10) / 10 : Math.round(normalized);
            return `${String(shown).replace(/\.0$/, '')}${suffix}`;
        };

        if (rounded >= 1000000000) return compact(1000000000, 'B');
        if (rounded >= 1000000) return compact(1000000, 'M');
        if (rounded >= 1000) return compact(1000, 'k');
        return String(rounded);
    }

    updateContextCardsVisibility(modelName = null) {
        const contextSelector = document.getElementById('context-selector');
        const contextSizePanel = contextSelector ? contextSelector.closest('.panel') : null;
        const contextRemainingPanel = document.getElementById('context-remaining-panel');
        const isOnlineDeployment = (window.OllamaAPI && typeof window.OllamaAPI.isOnlineDeploymentMode === 'function')
            ? window.OllamaAPI.isOnlineDeploymentMode()
            : false;

        let provider = 'local';
        try {
            const modelSelector = document.getElementById('model-selector');
            const selectedOption = modelSelector && modelSelector.selectedIndex >= 0
                ? modelSelector.options[modelSelector.selectedIndex]
                : null;
            const targetModel = modelName || modelSelector?.value || '';

            provider = (selectedOption && selectedOption.dataset && selectedOption.dataset.provider)
                ? selectedOption.dataset.provider
                : ((window.OllamaAPI && typeof window.OllamaAPI.getModelSource === 'function')
                    ? (window.OllamaAPI.getModelSource(targetModel) || window.OllamaAPI.getSelectedModelSource?.() || 'local')
                    : 'local');
        } catch (_error) {
            provider = 'local';
        }

        const showContextCards = !isOnlineDeployment && provider !== 'cloud';
        [contextSizePanel, contextRemainingPanel].forEach(panel => {
            if (!panel) return;
            panel.style.display = showContextCards ? '' : 'none';
            panel.setAttribute('aria-hidden', showContextCards ? 'false' : 'true');
        });
    }


    // Sets up all UI elements, event handlers, and model/context selectors for the chat tab.
    setupUIElements() {
       //console.log('ChatTab: Setting up UI elements');
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');

    // Get all UI elements
    const modelSelector = document.getElementById('model-selector');
    // Keep a reference to this ChatTab instance for use inside event handlers
    const chatTab = this;
    // Initialize last known value for model selector to avoid unnecessary unloads
    if (modelSelector) {
        try {
            modelSelector.__lastModelValue = modelSelector.value || '';
        } catch (e) {
            modelSelector.__lastModelValue = '';
        }
    }
        const contextSelector = document.getElementById('context-selector');
        const systemPrompt = document.getElementById('system-prompt');
        const saveButton = document.getElementById('save-prompt');
        const deleteButton = document.getElementById('clear-currentsession');
        const sendButton = document.getElementById('send-prompt');
        const promptInput = document.getElementById('prompt-input');
        this.addExportButton(deleteButton);
        this.addCloudApiKeyButton(deleteButton);

        // Set up insights toggle
        const insightsEnabled = localStorage.getItem('insightsEnabled') === 'true';
        document.querySelectorAll('.toggle-option').forEach(button => {
            const isOn = button.getAttribute('data-value') === 'on';
            if ((isOn && insightsEnabled) || (!isOn && !insightsEnabled)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Add edit button for insights
        const insightsContainer = document.querySelector('.insights-container');
       //console.log('Toggle container found:', insightsContainer); // Log if container is found

        if (insightsContainer) {
            const editButton = document.createElement('button');
            editButton.id = 'edit-insights-button';
            editButton.className = 'edit-insights-button';
            editButton.innerHTML = 'e'; // Use 'e' as text
            editButton.title = Lang.get('editInsightsButton');
            editButton.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 6px;
        background-color: var(--border-color, #ddd);
        color: var(--text-color, #333);
        border: none;
        cursor: pointer;
        font-size: 14px;
        margin-right: 10px;  
        margin-left: 10px;  
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
            `;
           //console.log('Edit button created:', editButton); // Log button creation

            // Add hover effect
            editButton.addEventListener('mouseenter', () => {
                editButton.style.backgroundColor = 'var(--accent-color, #4f46e5)';
                editButton.style.color = 'white';
            });

            editButton.addEventListener('mouseleave', () => {
                editButton.style.backgroundColor = 'var(--border-color, #ddd)';
                editButton.style.color = 'var(--text-color, #333)';
            });

            // Add click handler
            editButton.addEventListener('click', () => this.openInsightsEditor());

            const insightsLabel = insightsContainer.querySelector('.insights-label');
            if (insightsLabel) {
                // Create a wrapper for label and button to control their spacing
                const wrapper = document.createElement('div');
                wrapper.style.cssText = `
                    display: flex;
                    align-items: center;
                    margin-right: auto; /* Push the toggle to the right */
                `;

                // Get the parent container to replace the label with our wrapper
                const parent = insightsLabel.parentNode;

                // Move the existing label into the wrapper
                parent.removeChild(insightsLabel);
                wrapper.appendChild(insightsLabel);

                // Add the button to the wrapper with proper spacing
                wrapper.appendChild(editButton);

                // Insert the wrapper at the beginning of the insights container
                parent.insertBefore(wrapper, parent.firstChild);

                // Ensure the button has the right margin (remove left margin, we control it in the flex container)
                editButton.style.marginLeft = '10px';
                editButton.style.marginRight = '0';
            } else {
                // Fallback: insert as first child if label can't be found
               //console.log('No label found, using fallback insertion');
                insightsContainer.insertBefore(editButton, toggleSwitch);
               //console.log('Button inserted as first child:', insightsContainer.firstChild === editButton); // Verify insertion
            }

            // Add an additional check to see if button is in DOM after insertion
            setTimeout(() => {
                const buttonInDOM = document.getElementById('edit-insights-button');
               //console.log('Button found in DOM after insertion:', !!buttonInDOM);
            }, 100);
        }

        // Set up context selector
        if (contextSelector && contextSelector.children.length === 0) {
            // Base list of common context sizes
            const contextSizes = [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 10485760];

            // Load any custom/saved context sizes from database
            let customSizes = [];
            try {
                const savedCustomSizes = localStorage.getItem('customContextSizes');
                if (savedCustomSizes) {
                    customSizes = JSON.parse(savedCustomSizes);
                }
            } catch (error) {
                console.error('Error loading custom context sizes:', error);
            }

            // Combine and sort all sizes without duplicates
            const allSizes = [...new Set([...contextSizes, ...customSizes])].sort((a, b) => a - b);

            // Create dropdown options
            allSizes.forEach(size => {
                const option = document.createElement('option');
                option.value = size;
                option.textContent = size >= 1048576 ? `${size / 1048576}M` : size >= 1024 ? `${size / 1024}K` : size;
                contextSelector.appendChild(option);
            });

            // Set saved value
            // const savedSize = localStorage.getItem('contextSize') || '8192';
            //  contextSelector.value = savedSize;
        }

        // Add a small legend below the context selector to show the model's native maximum context
        try {
            const contextSelectorEl = document.getElementById('context-selector');
            if (contextSelectorEl && !document.getElementById('model-native-context-legend')) {
                const wrapper = document.createElement('div');
                wrapper.id = 'model-native-context-legend';
                // Force the legend to occupy a full row so it appears BELOW the selector
                wrapper.style.display = 'block';
                wrapper.style.width = '100%';
                wrapper.style.boxSizing = 'border-box';
                // If parent is a flex container, ensure this element breaks the line
                wrapper.style.flexBasis = '100%';
                wrapper.style.flexGrow = '0';
                wrapper.style.marginTop = '6px';
                wrapper.style.fontSize = '12px';
                wrapper.style.color = 'var(--muted-text-color, #999)';
                // Center the legend horizontally
                wrapper.style.textAlign = 'center';
                wrapper.innerHTML = `${Lang.get('modelMaximumContext') || 'Model Maximum context:'} <span id="model-native-context">—</span>`;
                // Ensure the inner span is inline-block so centering behaves consistently
                // We'll set that if the element is added to DOM below.
                // Prefer inserting INSIDE the nearest .panel ancestor so the legend is visually inside the card
                let panelAncestor = contextSelectorEl.closest('.panel');
                if (panelAncestor) {
                    // Try to find the inner flex-row that holds the label+selector and append after it
                    const innerRow = panelAncestor.querySelector('div[style*="display: flex"]') || panelAncestor.querySelector('div');
                    if (innerRow && innerRow.parentNode) {
                        // Insert the legend immediately after the innerRow so it stays inside the panel
                        innerRow.parentNode.insertBefore(wrapper, innerRow.nextSibling);
                        const spanEl = wrapper.querySelector('#model-native-context');
                        if (spanEl) spanEl.style.display = 'inline-block';
                    } else {
                        // As a fallback, append to the panel itself
                        panelAncestor.appendChild(wrapper);
                        const spanEl = wrapper.querySelector('#model-native-context');
                        if (spanEl) spanEl.style.display = 'inline-block';
                    }
                } else {
                    // Fallback: insert after the selector element as before
                    contextSelectorEl.parentNode.insertBefore(wrapper, contextSelectorEl.nextSibling);
                    const spanEl = wrapper.querySelector('#model-native-context');
                    if (spanEl) spanEl.style.display = 'inline-block';
                }
            }
        } catch (e) {
            console.warn('ChatTab: Could not insert model-native-context legend', e);
        }


        // Set system prompt placeholder
        if (systemPrompt && !systemPrompt.hasAttribute('placeholder')) {
            systemPrompt.setAttribute('placeholder', Lang.get('systemPromptPlaceholder') || 'Add here instructions for the model to behave as you will like to...');
        }

        // Set up model selector handler
        if (modelSelector) {
            // First, load visual models list
            OllamaAPI.loadVisualModels().then(async () => {
               //console.log('ChatTab: Visual models loaded successfully');

                // Check current model on startup AND load its context
                if (modelSelector.value) {
                   //console.log('ChatTab: Checking initial model:', modelSelector.value);
                    this.updateVisualModelUI(modelSelector.value);

                    // CRITICAL: Load model-specific context for the currently selected model
                    const hasModelSpecificContext = await this.loadModelSpecificContextSize(hashedMasterKey, modelSelector.value);

                    if (!hasModelSpecificContext) {
                        // No model-specific context found, use default
                        const savedSize = localStorage.getItem('contextSize') || '8192';
                        contextSelector.value = savedSize;
                    }
                } else {
                    // No model selected, use default context
                    const savedSize = localStorage.getItem('contextSize') || '8192';
                    contextSelector.value = savedSize;
                }

                this.updateContextCardsVisibility(modelSelector.value || '');

                // After visual models are loaded and initial UI is set, fetch the model metadata
                try {
                    const initialModel = modelSelector.value;
                    if (initialModel) {
                        const startupProvider = (window.OllamaAPI && typeof window.OllamaAPI.getModelSource === 'function')
                            ? (window.OllamaAPI.getModelSource(initialModel) || 'local')
                            : 'local';

                        if (startupProvider === 'cloud') {
                            await this.prepareSelectedCloudModel(initialModel);
                        } else {
                            await this.refreshModelMaximumContextLabel(initialModel);
                        }
                    }
                } catch (startupErr) {
                    console.warn('ChatTab: Error fetching model metadata on startup', startupErr);
                    const nativeCtxEl = document.getElementById('model-native-context');
                    if (nativeCtxEl) nativeCtxEl.textContent = 'n/a';
                }
            });

            modelSelector.addEventListener('change', async (event) => {
                const selectedModel = modelSelector.value;
                const selectedOption = modelSelector.options[modelSelector.selectedIndex];
                const selectedProvider = (selectedOption && selectedOption.dataset && selectedOption.dataset.provider)
                    ? selectedOption.dataset.provider
                    : ((window.OllamaAPI && typeof window.OllamaAPI.getSelectedModelSource === 'function')
                        ? (window.OllamaAPI.getSelectedModelSource() || 'local')
                        : 'local');
                const liveMasterKey = sessionStorage.getItem('hashedMasterKey') || hashedMasterKey;
                console.info('[CloudPrep] model selector changed', {
                    selectedModel,
                    selectedProvider,
                    hasLiveMasterKey: !!liveMasterKey,
                    trustedEvent: !!(event && event.isTrusted)
                });

                this.updateContextCardsVisibility(selectedModel);

                // Persist immediately in plaintext to survive hard-refresh before async DB writes complete.
                try {
                    localStorage.setItem('selectedModel', String(selectedModel || ''));
                    localStorage.setItem('selectedModelProvider', String(selectedProvider || 'local'));
                } catch (_storageErr) {
                    // Non-fatal: DB persistence still runs below.
                }
               //console.log('🔄 ChatTab: Model changed to:', selectedModel);
                try {
                    const base = (window.getBaseModelName && window.getBaseModelName(selectedModel)) || selectedModel;
                   //console.log('🔍 ChatTab: base model for selectedModel=', selectedModel, '->', base);
                } catch (e) {
                    console.warn('ChatTab: Error computing base model for logging', e);
                }

                // --- Unload-on-select (consolidated)
                try {
                    // Only react for real user interactions
                    if (event && event.isTrusted) {
                        const newValue = modelSelector.value || '';
                        if (newValue !== modelSelector.__lastModelValue) {
                            if (modelSelector.__unloadDebounceTimeout) clearTimeout(modelSelector.__unloadDebounceTimeout);
                            modelSelector.__unloadDebounceTimeout = setTimeout(async () => {
                                try {
                                    if (chatTab && typeof chatTab.unloadOllamaModels === 'function') {
                                       //console.log('ChatTab: User changed model — calling ChatTab.unloadOllamaModels() to free memory.');
                                        await chatTab.unloadOllamaModels();
                                    } else {
                                        // If the ChatTab method isn't present, skip unload to avoid calling presentation-only code
                                        console.warn('ChatTab: unloadOllamaModels not found on ChatTab; skipping unload on model change.');
                                    }
                                } catch (err) {
                                    console.error('ChatTab: Error while unloading Ollama models on model change:', err);
                                } finally {
                                    modelSelector.__lastModelValue = newValue;
                                }
                            }, 300);
                        }
                    }
                } catch (err) {
                    console.error('ChatTab: Error in unload-on-select handler:', err);
                }

                // Save the selected model and provider to the database
                const savedModelOk = await PaiperworkDB.saveModel(liveMasterKey, selectedModel, selectedProvider);
                if (!savedModelOk) {
                    console.error('ChatTab: Failed to persist selected model/provider', {
                        selectedModel,
                        selectedProvider
                    });
                }

                // For cloud models, ensure key exists and pre-pull model metadata on selection.
                if (selectedProvider === 'cloud') {
                    console.info('[CloudPrep] cloud model selected, ensuring key and preparing pull');
                    const keyCheckMasterKey = sessionStorage.getItem('hashedMasterKey');
                    const existingCloudKey = keyCheckMasterKey
                        ? this.normalizeCloudApiKey(await PaiperworkDB.getOllamaApiKey(keyCheckMasterKey))
                        : '';
                    const shouldDelayPrepToast = !existingCloudKey;
                    let closePrepToast = null;

                    // Show immediately when a key already exists; delay for first-time key setup.
                    if (!shouldDelayPrepToast) {
                        closePrepToast = this.showCloudModelPrepToast('Preparing selected cloud model, please wait...');
                    }
                    try {
                        const routing = await OllamaAPI.getApiRoutingForModel(selectedModel);
                        const requiresDirectCloudKey = routing && routing.baseUrl === '/api/cloud';
                        let canPrepare = true;
                        if (requiresDirectCloudKey) {
                            let hasCloudKey = !!existingCloudKey;
                            if (!hasCloudKey) {
                                hasCloudKey = await this.ensureCloudApiKeyForSend();
                                console.info('[CloudPrep] ensureCloudApiKeyForSend result', { hasCloudKey });
                            } else {
                                console.info('[CloudPrep] cloud key already present in DB, skipping key manager prompt');
                            }
                            canPrepare = hasCloudKey;

                            // Key may have just been saved via modal; only now show prep toast.
                            if (hasCloudKey && !closePrepToast) {
                                closePrepToast = this.showCloudModelPrepToast('Preparing selected cloud model, please wait...');
                            }
                        }
                        if (canPrepare) {
                            try {
                                const prepOptions = closePrepToast ? { closeToast: closePrepToast } : undefined;
                                await this.prepareSelectedCloudModel(selectedModel, prepOptions);
                            } catch (prepError) {
                                console.error('[CloudPrep] prepare on selector change failed', prepError);
                            }
                        }
                    } finally {
                        if (typeof closePrepToast === 'function') {
                            closePrepToast();
                        }
                    }
                }

                // Reset context for the new model
                if (saveButton) saveButton.disabled = true;
                OllamaAPI.previousContext = null;
                OllamaAPI.resetContext();
                this.addModelChangeContinueButton();

                // Load model-specific context size (legacy vramramcalculator removed)
                if (selectedModel) {
                    // Previously used vramramcalculator to fetch model-specific context.
                    // That logic has been removed; fall back to saved context size if present.
                    const savedSize = localStorage.getItem('contextSize') || '8192';
                    contextSelector.value = savedSize;
                } else {
                    const savedSize = localStorage.getItem('contextSize') || '8192';
                    contextSelector.value = savedSize;
                }

                // Update UI for visual models
                this.updateVisualModelUI(selectedModel);

                // Update UI for thinking models
               //console.log('🧠 ChatTab: Updating thinking toggle for model:', selectedModel);
                this.updateThinkingToggleUI(selectedModel);

                // Ensure the reasoning selector visibility reflects the newly selected model
                try {
                    const base = (window.getBaseModelName && window.getBaseModelName(selectedModel)) || (selectedModel || '').toLowerCase();
                    const baseOnly = (base || '').split(':')[0];
                    const reasoningSelector = document.getElementById('gptoss-reasoning-selector');
                    if (baseOnly === 'gpt-oss') {
                        // ensure selector exists and default is set
                            if (reasoningSelector) {
                            reasoningSelector.style.display = '';
                            if (!localStorage.getItem('gptOssReasoningLevel')) {
                                // Programmatic initialization: set default to mid without firing user-only handlers
                                localStorage.setItem('gptOssReasoningLevel', 'mid');
                                const btn = reasoningSelector.querySelector('.gptoss-reasoning-btn[data-level="mid"]');
                                if (btn) {
                                    // update visuals
                                    const siblings = reasoningSelector.querySelectorAll('.gptoss-reasoning-btn');
                                    siblings.forEach(s => { s.classList.remove('active'); s.style.backgroundColor = ''; s.style.color = ''; });
                                    btn.classList.add('active');
                                    btn.style.backgroundColor = 'var(--accent-color, #4f46e5)';
                                    btn.style.color = 'white';
                                    // mirror to quick-access global for immediate reads by OllamaAPI
                                    window.gptOssReasoningLevel = 'mid';
                                    // notify other in-tab listeners if needed
                                    window.dispatchEvent(new CustomEvent('gptOssReasoningChanged', { detail: { level: 'mid' } }));
                                }
                            }
                        } else {
                            // trigger creation via updateThinkingToggleUI if it's not in DOM
                            setTimeout(() => this.updateThinkingToggleUI(selectedModel), 50);
                        }
                    } else {
                        if (reasoningSelector) reasoningSelector.style.display = 'none';
                    }
                } catch (e) {
                    console.warn('ChatTab: error updating reasoning selector visibility on model change', e);
                }

                // Handle Gemma3 specific changes for image modal
                const isVisualModel = await OllamaAPI.isVisualModel(selectedModel);
                if (isVisualModel) {
                    const isGemma3 = selectedModel.toLowerCase().includes('gemma3');
                    this.updateImageModalForModel(isGemma3);
                }

                // Fetch model metadata (autoload then /api/show) and update native context legend
                try {
                    if (selectedProvider !== 'cloud') {
                        await this.refreshModelMaximumContextLabel(selectedModel);
                    }
                } catch (metaErr) {
                    console.warn('ChatTab: Error fetching model metadata after model change', metaErr);
                    const nativeCtxEl = document.getElementById('model-native-context');
                    if (nativeCtxEl) nativeCtxEl.textContent = 'n/a';
                }

            });
        }

        // Set up delete conversation handlers
        this.setupDeleteHandlers(deleteButton, hashedMasterKey);
    }

    // Loads the list of conversation sessions from the database and prepares them for display.
    async loadSessionsList(hashedMasterKey) {
       //console.log('ChatTab: Loading sessions list for masterkey:', hashedMasterKey);

        // Get the conversation list container
        const conversationList = document.getElementById('conversation-list');
        if (conversationList) {
            // Clear existing content and create fixed loading indicator at the top
            conversationList.innerHTML = `<div class="loading-indicator" style="text-align:center; padding:10px; color:#666; position:sticky; top:0; background:var(--bg-color); z-index:10;">${Lang.get('loadingConversations')}</div><div class="sessions-container"></div>`;
        }

        try {
            // OPTIMIZATION: Open database ONCE at the beginning
            const db = await PaiperworkDB.getDatabase(hashedMasterKey);
            if (!db) {
               //console.log('ChatTab: No database found');
                if (conversationList) {
                    conversationList.innerHTML = `<div class="no-sessions" style="text-align: center;">${Lang.get('noPreviousConversations')}</div>`;
                }
                return [];
            }

            // Check if the group_updated_at column exists before using it in the query
            const columnsResult = db.exec(`PRAGMA table_info(conversations_${hashedMasterKey})`);
            const hasUpdatedAtColumn = columnsResult[0]?.values.some(col => col[1] === 'group_updated_at');

            // Get all group IDs and their most recent timestamps
            let groupQuery;
            if (hasUpdatedAtColumn) {
                groupQuery = `
                SELECT conversation_group, MAX(COALESCE(group_updated_at, timestamp)) as latest_timestamp 
                FROM conversations_${hashedMasterKey}
                GROUP BY conversation_group
                ORDER BY latest_timestamp DESC
            `;
            } else {
                groupQuery = `
                SELECT conversation_group, MAX(timestamp) as latest_timestamp 
                FROM conversations_${hashedMasterKey}
                GROUP BY conversation_group
                ORDER BY latest_timestamp DESC
            `;
            }

            const groupResult = db.exec(groupQuery);
            if (!groupResult[0]?.values || groupResult[0].values.length === 0) {
               //console.log('ChatTab: No conversation groups found');
                if (conversationList) {
                    conversationList.innerHTML = `<div class="no-sessions" style="text-align: center;">${Lang.get('noPreviousConversations')}</div>`;
                }
                return [];
            }

            // Extract group IDs
            const groupData = groupResult[0].values.map(row => ({
                id: row[0] || 1,
                latest_timestamp: row[1]
            }));

           //console.log(`ChatTab: Found ${groupData.length} conversation groups`);

            // OPTIMIZATION: Load ALL conversations at once instead of per-group
            const allConversationsQuery = `
            SELECT conversation, timestamp, role, conversation_group
            FROM conversations_${hashedMasterKey}
            ORDER BY timestamp ASC
        `;

            const allConversationsResult = db.exec(allConversationsQuery);

            // Group conversations by conversation_group
            const conversationsByGroup = {};
            if (allConversationsResult[0]?.values) {
                for (const row of allConversationsResult[0].values) {
                    const conversation = row[0];
                    const timestamp = row[1];
                    const role = row[2];
                    const group = row[3] || 1;

                    if (!conversationsByGroup[group]) {
                        conversationsByGroup[group] = [];
                    }

                    conversationsByGroup[group].push({
                        conversation,
                        timestamp,
                        role,
                        group
                    });
                }
            }

            // Update loading indicator with count
            if (conversationList) {
                const loadingIndicator = conversationList.querySelector('.loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.textContent = `${Lang.get('loadingConversations')} (${groupData.length} ${Lang.get('conversationsFound')})`;
                }
            }

            // Get the sessions container which will hold all session items
            const sessionsContainer = conversationList.querySelector('.sessions-container');

            // Keep track of rendered sessions with their actual timestamps
            let renderedSessions = [];
            let processedCount = 0;

            // OPTIMIZATION: Process all groups with the pre-loaded conversation data
            for (const group of groupData) {
                try {
                    const groupConversations = conversationsByGroup[group.id] || [];

                    if (groupConversations.length === 0) {
                        console.warn(`ChatTab: No conversations found for group ${group.id}`);
                        continue;
                    }

                    // Find the first user message for preview
                    let previewMessage = '';
                    let actualTimestamp = null;

                    for (const conv of groupConversations) {
                        try {
                            const decryptedRole = await PaiperworkDB.decrypt(
                                hashedMasterKey,
                                JSON.parse(conv.role)
                            );

                            if (decryptedRole === 'user') {
                                const decryptedMessage = await PaiperworkDB.decrypt(
                                    hashedMasterKey,
                                    JSON.parse(conv.conversation)
                                );

                                const decryptedTimestamp = await PaiperworkDB.decrypt(
                                    hashedMasterKey,
                                    JSON.parse(conv.timestamp)
                                );

                                previewMessage = this.createSessionPreview(decryptedMessage);
                                actualTimestamp = new Date(decryptedTimestamp).getTime();
                                break; // Use first user message
                            }
                        } catch (decryptError) {
                            console.error(`ChatTab: Error decrypting conversation in group ${group.id}:`, decryptError);
                            continue;
                        }
                    }

                    if (!previewMessage) {
                        console.warn(`ChatTab: No valid user message found for group ${group.id}`);
                        continue;
                    }

                    // Create session object
                    const session = {
                        group_id: group.id,
                        preview: previewMessage,
                        timestamp: new Date(actualTimestamp).toISOString(),
                        timestampValue: actualTimestamp
                    };

                    renderedSessions.push(session);
                    processedCount++;

                    // Update progress periodically
                    if (processedCount % 5 === 0 && sessionsContainer) {
                        const loadingIndicator = conversationList.querySelector('.loading-indicator');
                        if (loadingIndicator) {
                            loadingIndicator.textContent = `${Lang.get('loadingConversations')} (${processedCount}/${groupData.length})`;
                        }
                    }

                } catch (error) {
                    console.error(`ChatTab: Error processing group ${group.id}:`, error);
                    continue;
                }
            }

            // Sort sessions by timestampValue in descending order (newest first)
            renderedSessions.sort((a, b) => b.timestampValue - a.timestampValue);

            // Render sessions in the proper sorted order
            if (sessionsContainer) {
                sessionsContainer.innerHTML = '';

                renderedSessions.forEach((session, index) => {
                    const sessionItem = this.createSessionItem(session, index);
                    sessionsContainer.appendChild(sessionItem);

                    // Add separator line after each session except the last one
                    if (index < renderedSessions.length - 1) {
                        const separator = document.createElement('hr');
                        separator.className = 'session-separator';
                        separator.style.margin = '8px 15%';
                        separator.style.border = 'none';
                        separator.style.height = '1px';
                        separator.style.backgroundColor = '#444';
                        separator.style.opacity = '0.4';
                        sessionsContainer.appendChild(separator);
                    }
                });
            }

            // Remove loading indicator after all processing is complete
            if (conversationList) {
                const loadingIndicator = conversationList.querySelector('.loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }

                // Show no conversations message if needed
                if (renderedSessions.length === 0) {
                    conversationList.innerHTML = `<div class="no-sessions" style="text-align: center;">${Lang.get('noPreviousConversations')}</div>`;
                }
            }

           //console.log(`ChatTab: Successfully loaded ${renderedSessions.length} conversation sessions`);
            return renderedSessions;

        } catch (error) {
            console.error('ChatTab: Error loading sessions list:', error);
            if (conversationList) {
                conversationList.innerHTML = `<div class="error-message">${Lang.get('errorLoadingConversations')}</div>`;
            }
            return [];
        }
    }

    // Loads and renders all messages for a selected conversation session.
    async loadSessionConversation(session) {
        await this.cancelActiveGenerationForTransition('load-session-conversation');

        const aiReplies = document.querySelector('.ai-replies');
        if (!aiReplies) {
            console.error('ChatTab: AI replies container not found');
            return;
        }

        // Clear existing messages
        aiReplies.innerHTML = '';

        // Store the current session group ID globally
        window.currentConversationGroup = session.group_id;
       //console.log('ChatTab: Set currentConversationGroup =', session.group_id);

        // IMPORTANT: Instead of using the session object passed in,
        // load the most up-to-date data from the database for this group
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');

        try {
            // Load fresh data for this specific group from database
           //console.log('ChatTab: Loading fresh conversation data for group:', session.group_id);
            const result = await PaiperworkDB.loadConversationsByGroup(hashedMasterKey, session.group_id);

            if (!result || !result.conversations || result.conversations.length === 0) {
                console.warn('ChatTab: No conversations found for group', session.group_id);
                aiReplies.innerHTML = `<div class="no-messages">${Lang.get('noMessagesFound')}</div>`;
                return;
            }

            // Sort the conversations by timestamp
            const conversations = result.conversations.sort((a, b) =>
                new Date(a.timestamp) - new Date(b.timestamp)
            );

           //console.log(`ChatTab: Rendering ${conversations.length} messages for group ${session.group_id}`);

            // Create array to track conversations for the continue button
            const conversationsForContinue = [];

            // Render the messages from this session
            conversations.forEach((conv, index) => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `${conv.role}-message`;

                if (conv.role === 'user') {
                    messageDiv.style.flexDirection = 'column';
                    messageDiv.style.display = 'flex';
                    messageDiv.style.alignSelf = 'flex-end';
                    messageDiv.style.alignItems = 'flex-end';
                    messageDiv.style.textAlign = 'right';
                    // Try to parse the message to check for embedded images
                    let messageText = conv.message;
                    let messageImages = conv.images || [];

                    try {
                       //console.log('IMAGES DEBUG: Processing user message:', typeof conv.message);
                        // Check if the message is a JSON string containing text and images
                        const parsedMessage = JSON.parse(conv.message);
                       //console.log('IMAGES DEBUG: Parsed message successfully:', parsedMessage);

                        if (parsedMessage && typeof parsedMessage === 'object') {
                            if (parsedMessage.text !== undefined) {
                                messageText = parsedMessage.text;
                               //console.log('IMAGES DEBUG: Found text content:', messageText.substring(0, 50) + '...');

                                if (Array.isArray(parsedMessage.images)) {
                                    messageImages = parsedMessage.images;
                                   //console.log('IMAGES DEBUG: Found images array with length:', messageImages.length);
                                    // messageImages.forEach((img, idx) => {
                                   //console.log(`IMAGES DEBUG: Image ${idx} type:`, typeof img,
                                    // 'src exists:', Boolean(img.src || img));
                                    // });
                                }
                            }
                        }
                    } catch (e) {
                       //console.log('IMAGES DEBUG: Not JSON or parsing error:', e.message);
                        // Not JSON, use the message as plain text
                        messageText = conv.message;
                    }

                    // Create the message bubble with the extracted text
                    let messageContent = `<div class="message-bubble">${messageText}</div>`;

                    // Add images if present in parsed data
                    if (messageImages && messageImages.length > 0) {
                       //console.log('IMAGES DEBUG: Creating image containers for', messageImages.length, 'images');
                        const imagesContainer = document.createElement('div');
                        imagesContainer.className = 'user-message-images';
                        imagesContainer.style.display = 'flex';
                        imagesContainer.style.flexDirection = 'column'; // Add this line
                        imagesContainer.style.flexWrap = 'wrap';
                        imagesContainer.style.gap = '8px';
                        imagesContainer.style.marginTop = '8px';
                        imagesContainer.style.marginBottom = '8px';

                        messageImages.forEach((img, idx) => {
                            const imgWrapper = document.createElement('div');
                            imgWrapper.style.position = 'relative';
                            imgWrapper.style.borderRadius = '8px';
                            imgWrapper.style.overflow = 'hidden';
                            imgWrapper.style.border = '1px solid var(--border-color)';
                            imgWrapper.style.maxWidth = '200px';

                            const imgEl = document.createElement('img');
                            if (typeof img === 'string') {
                               //console.log('IMAGES DEBUG: Setting img.src from string:', img.substring(0, 30) + '...');
                                imgEl.src = img;
                                imgEl.dataset.fullImage = img;
                            } else if (img && typeof img === 'object') {
                               //console.log('IMAGES DEBUG: Setting img.src from object:', img);
                                imgEl.src = img.src || img.thumbnail || '';
                                imgEl.dataset.fullImage = img.src || img.thumbnail || '';
                            } else {
                               //console.log('IMAGES DEBUG: Invalid image data:', img);
                            }
                            imgEl.style.maxWidth = '100%';
                            imgEl.style.maxHeight = '150px';
                            imgEl.style.objectFit = 'contain';
                            imgEl.style.cursor = 'pointer';

                            // Add click handler to show full-size image
                            imgEl.addEventListener('click', (e) => {
                                if (window.chat && typeof window.chat.showFullSizeImage === 'function') {
                                    window.chat.showFullSizeImage(e.target.dataset.fullImage);
                                } else {
                                    // Fallback implementation
                                    const modal = document.createElement('div');
                                    modal.style.position = 'fixed';
                                    modal.style.top = '0';
                                    modal.style.left = '0';
                                    modal.style.width = '100%';
                                    modal.style.height = '100%';
                                    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
                                    modal.style.display = 'flex';
                                    modal.style.alignItems = 'center';
                                    modal.style.justifyContent = 'center';
                                    modal.style.zIndex = '10000';

                                    modal.addEventListener('click', () => {
                                        document.body.removeChild(modal);
                                    });

                                    const fullImg = document.createElement('img');
                                    fullImg.src = e.target.dataset.fullImage;
                                    fullImg.style.maxWidth = '90%';
                                    fullImg.style.maxHeight = '90%';
                                    fullImg.style.objectFit = 'contain';
                                    fullImg.style.border = '2px solid white';
                                    fullImg.style.borderRadius = '4px';

                                    fullImg.addEventListener('click', (e) => {
                                        e.stopPropagation();
                                    });

                                    modal.appendChild(fullImg);
                                    document.body.appendChild(modal);
                                }
                            });

                            imgWrapper.appendChild(imgEl);
                            imagesContainer.appendChild(imgWrapper);
                        });

                        const messageBubbleDiv = document.createElement('div');
                        messageBubbleDiv.className = 'message-bubble';
                        messageBubbleDiv.innerHTML = messageText;

                        // Clear any existing content first
                        messageDiv.innerHTML = '';
                        messageDiv.appendChild(messageBubbleDiv);
                        messageDiv.appendChild(imagesContainer);
                        messageDiv.appendChild(document.createElement('br'));
                    } else {
                        messageDiv.innerHTML = `${messageContent}<br>`;
                    }

                    // Add to conversations array for continue button
                    conversationsForContinue.push({
                        role: 'user',
                        message: messageText,
                        timestamp: conv.timestamp,
                        images: messageImages // Use the parsed images
                    });

                } else {
                    // CRITICAL: Don't manipulate the HTML in any way
                    // Simply set the innerHTML directly from the loaded conversation
                    const container = document.createElement('div');
                    container.innerHTML = conv.message;

                    // Create StreamProcessor instance for this response
                    const streamProcessor = new StreamProcessor();

                    // Remove constructor-created placeholder container from chat root.
                    if (streamProcessor.responseContainer && streamProcessor.responseContainer.parentNode) {
                        streamProcessor.responseContainer.parentNode.removeChild(streamProcessor.responseContainer);
                    }

                    // Replace the auto-created empty container with our loaded content
                    const loadedContent = container.querySelector('.ai-response-container');
                    if (loadedContent) {
                        streamProcessor.responseContainer = loadedContent;
                        streamProcessor.rawResponseHtml = loadedContent.innerHTML;
                        // Attach the streamProcessor to the container for reference
                        loadedContent.streamProcessor = streamProcessor;
                    }

                    // DO NOT MODIFY CONTENT - Just process code blocks for functionality
                    const codeBlocks = container.querySelectorAll('.code-block');
                    codeBlocks.forEach((block, idx) => {
                        const nextBlockId = `code-block-${StreamProcessor.nextCodeBlockId()}`;
                        block.id = nextBlockId;
                        StreamProcessor.reserveCodeBlockId(nextBlockId);

                        // Configure code block buttons
                        const copyBtn = block.querySelector('.code-copy-btn');
                        if (copyBtn) {
                            copyBtn.setAttribute('onclick', 'window.copyCodeBlock(this)');
                        }

                        // Process the code block for functionality
                        StreamProcessor.processSavedCodeBlock(block);

                        // Add Run button for HTML code blocks
                        if (window.chat && typeof window.chat.addRunButtonsToCodeBlock === 'function') {
                            window.chat.addRunButtonsToCodeBlock(block);
                        }
                    });

                    messageDiv.appendChild(container);

                    // Saved HTML may contain old action labels from a different language.
                    if (window.chat && typeof window.chat.localizeMessageActionButtons === 'function') {
                        window.chat.localizeMessageActionButtons(messageDiv);
                    }

                    // Add to conversations array for continue button
                    conversationsForContinue.push({
                        role: 'assistant',
                        message: conv.message,
                        timestamp: conv.timestamp
                    });

                    // Add event listeners to copy links (legacy + current action containers)
                    const copyLinks = messageDiv.querySelectorAll('.copy-response-container a, .message-actions a.copy-btn');
                    copyLinks.forEach(link => {
                        link.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const container = link.closest('.assistant-message')?.querySelector('.ai-response-container');
                            if (container && container.streamProcessor) {
                                container.streamProcessor.copyFullResponse(link);
                                return;
                            }

                            // Fallback copy path if streamProcessor reference is unavailable.
                            if (container) {
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = container.innerHTML;
                                tempDiv.querySelectorAll('.message-actions, .copy-response-container, .cancel-note').forEach(el => el.remove());
                                const cleanText = (tempDiv.innerText || tempDiv.textContent || '').replace(/\r\n/g, '\n').trimEnd();

                                navigator.clipboard.writeText(cleanText).then(() => {
                                    const originalText = link.textContent;
                                    link.textContent = (Lang.get('copied') || 'Copied');
                                    setTimeout(() => {
                                        link.textContent = originalText;
                                    }, 2000);
                                }).catch(err => {
                                    console.error('Failed to copy loaded message:', err);
                                });
                            }
                        });
                    });
                }

                aiReplies.appendChild(messageDiv);
            });

            // Disable the prompt input until "Continue" is clicked
            const promptInput = document.getElementById('prompt-input');
            if (promptInput) {
                promptInput.disabled = false;

                // Store the original placeholder to restore later
                if (!promptInput.dataset.originalPlaceholder) {
                    promptInput.dataset.originalPlaceholder = promptInput.placeholder || '';
                }

                // Set the "click continue first" placeholder
                promptInput.placeholder = Lang.get('clickContinueFirst');
            }

            // CRITICAL: Rebuild the conversation context for proper continuation
            // Skip adding continue button if the UI only shows the welcome message
            const assistantMessagesAllLoad = aiReplies.querySelectorAll('.assistant-message');
            const hasOnlyWelcomeLoad = (assistantMessagesAllLoad.length === 1 && assistantMessagesAllLoad[0].classList.contains('welcome-message'));

            if (conversationsForContinue.length > 0 && !hasOnlyWelcomeLoad) {
                // Store this in OllamaAPI's state for future use when continuing
                OllamaAPI.previousConversations = conversationsForContinue;

                // Reset any existing context to start fresh with this session
                OllamaAPI.resetContext();

                // Add the continue button using OllamaAPI's built-in function
                const continueButton = OllamaAPI.createContinueButton(conversationsForContinue, aiReplies);
                aiReplies.appendChild(continueButton);
            }

            // Scroll to the bottom after loading conversation
            requestAnimationFrame(() => {
                aiReplies.scrollTop = aiReplies.scrollHeight;
            });
        } catch (error) {
            console.error('ChatTab: Error loading conversation group data:', error);
            aiReplies.innerHTML = '<div class="error-message">Error loading conversation</div>';
        }
    }

    // Creates a DOM element representing a single session item in the conversation list.
    createSessionItem(session, index) {
        const sessionItem = document.createElement('div');
        sessionItem.className = 'session-item';
        sessionItem.dataset.index = index;
        sessionItem.dataset.groupId = session.group_id;

        // Create a container for session content
        const sessionContent = document.createElement('div');
        sessionContent.className = 'session-content';
        sessionContent.style.flex = '1';
        sessionContent.style.overflow = 'hidden';

        const preview = document.createElement('div');
        preview.className = 'session-preview';
        preview.textContent = session.preview || 'Conversation';

        const date = document.createElement('div');
        date.className = 'session-date';
        date.textContent = this.formatSessionDate(session.timestamp);

        sessionContent.appendChild(preview);
        sessionContent.appendChild(date);

        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'session-delete-btn';
        deleteBtn.innerHTML = 'x';
        deleteBtn.title = Lang.get('deleteSession') || 'Delete this conversation';
        deleteBtn.style.background = 'transparent';
        deleteBtn.style.border = 'none';
        deleteBtn.style.color = '#888';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.padding = '4px';
        deleteBtn.style.marginLeft = '8px';
        deleteBtn.style.opacity = '0';
        deleteBtn.style.transition = 'opacity 0.2s ease';

        // Make the session item a flex container
        sessionItem.style.display = 'flex';
        sessionItem.style.alignItems = 'center';
        sessionItem.style.position = 'relative';

        sessionItem.appendChild(sessionContent);
        sessionItem.appendChild(deleteBtn);

        // Show delete button on hover
        sessionItem.addEventListener('mouseenter', () => {
            deleteBtn.style.opacity = '1';
        });

        sessionItem.addEventListener('mouseleave', () => {
            deleteBtn.style.opacity = '0';
        });

        // Store session data in a global variable for easy access
        if (!window.chatSessions) window.chatSessions = [];
        window.chatSessions[index] = session;

        // Add click handler to load this session
        sessionContent.addEventListener('click', async () => {
            await this.cancelActiveGenerationForTransition('session-switch');
            await this.loadSessionConversation(session);

            // Update active state in UI
            document.querySelectorAll('.session-item').forEach(item => {
                item.classList.remove('active');
                item.style.backgroundColor = '';
                item.style.borderLeft = '';
            });
            sessionItem.classList.add('active');
            sessionItem.style.backgroundColor = 'rgba(79, 70, 229, 0.08)';
            sessionItem.style.borderLeft = '3px solid #4f46e5';
        });

        // Add delete handler
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteConversationGroup(session.group_id, sessionItem);
        });

        return sessionItem;
    }

    // Generates a short preview string for a session from the user's first message.
    createSessionPreview(message) {
        let textContent = '';

        // Try to parse as JSON first (for messages with images)
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage && typeof parsedMessage === 'object' && parsedMessage.text) {
                // If successful and has a text field, use that
                textContent = parsedMessage.text;
            } else {
                // Fallback to the original message if JSON doesn't have expected structure
                textContent = message;
            }
        } catch (e) {
            // Not JSON, use the message as is
            textContent = message;
        }

        // Remove HTML tags for preview text
        const textOnly = textContent.replace(/<[^>]*>/g, '');

        // Truncate to 50 characters
        let preview = textOnly.substring(0, 50);
        if (textOnly.length > 50) {
            preview += '...';
        }

        return preview;
    }

    // Formats a timestamp into a human-readable date string for session display.
    formatSessionDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        // Format the time
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        const timeStr = date.toLocaleTimeString(undefined, timeOptions);

        if (isToday) {
            return `Today at ${timeStr}`;
        }

        // Check if it's yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday at ${timeStr}`;
        }

        // Format the date
        const dateOptions = { month: 'short', day: 'numeric' };
        const dateStr = date.toLocaleDateString(undefined, dateOptions);

        return `${dateStr} at ${timeStr}`;
    }

    // Renders the list of conversation sessions in the sidebar.
    renderSessionsList(sessions) {
        const conversationList = document.getElementById('conversation-list');
        if (!conversationList) {
            console.error('ChatTab: Conversation list container not found');
            return;
        }

        // Clear the loading indicator
        conversationList.innerHTML = '';

        // If no sessions, show "No conversations" message
        if (!sessions || sessions.length === 0) {
            conversationList.innerHTML = `<div class="no-sessions" style="text-align: center;">${Lang.get('noPreviousConversations')}</div>`;
            return;
        }

        // Create elements for each session
        sessions.forEach((session, index) => {
            const sessionItem = document.createElement('div');
            sessionItem.className = 'session-item';
            sessionItem.dataset.index = index;
            sessionItem.dataset.groupId = session.group_id;

            // IMPORTANT: Mark this session as active if it matches the current conversation group
            const isActiveGroup = window.currentConversationGroup && window.currentConversationGroup === session.group_id;
            if (isActiveGroup) {
                sessionItem.classList.add('active');
                sessionItem.style.backgroundColor = 'rgba(79, 70, 229, 0.08)';
                sessionItem.style.borderLeft = '3px solid #4f46e5';
            }

            // Create a container for session content
            const sessionContent = document.createElement('div');
            sessionContent.className = 'session-content';
            sessionContent.style.flex = '1';
            sessionContent.style.overflow = 'hidden';

            const preview = document.createElement('div');
            preview.className = 'session-preview';
            preview.textContent = session.preview || 'Conversation';

            const date = document.createElement('div');
            date.className = 'session-date';
            date.textContent = this.formatSessionDate(session.timestamp);

            sessionContent.appendChild(preview);
            sessionContent.appendChild(date);

            // Add delete button to each session
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'session-delete-btn';
            deleteBtn.innerHTML = 'x';
            deleteBtn.title = Lang.get('deleteSession') || 'Delete this conversation';
            deleteBtn.style.background = 'transparent';
            deleteBtn.style.border = 'none';
            deleteBtn.style.color = '#888';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.padding = '4px';
            deleteBtn.style.marginLeft = '8px';
            deleteBtn.style.opacity = '0';
            deleteBtn.style.transition = 'opacity 0.2s ease';

            // Make the session item a flex container to position content and delete button
            sessionItem.style.display = 'flex';
            sessionItem.style.alignItems = 'center';
            sessionItem.style.position = 'relative';

            sessionItem.appendChild(sessionContent);
            sessionItem.appendChild(deleteBtn);

            // Show delete button on hover
            sessionItem.addEventListener('mouseenter', () => {
                deleteBtn.style.opacity = '1';
            });

            sessionItem.addEventListener('mouseleave', () => {
                deleteBtn.style.opacity = '0';
            });

            // Store session data in a global variable for easy access
            if (!window.chatSessions) window.chatSessions = [];
            window.chatSessions[index] = session;

            // Add click handler to load this session
            sessionContent.addEventListener('click', async () => {
                await this.cancelActiveGenerationForTransition('session-switch');
                await this.loadSessionConversation(session);

                // Update active state in UI
                document.querySelectorAll('.session-item').forEach(item => {
                    item.classList.remove('active');
                    // Reset styling for non-active items
                    item.style.backgroundColor = '';
                    item.style.borderLeft = '';
                });
                sessionItem.classList.add('active');

                // Apply visual highlighting for active session
                sessionItem.style.backgroundColor = 'rgba(79, 70, 229, 0.08)';
                sessionItem.style.borderLeft = '3px solid #4f46e5';
            });

            // Add delete handler
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the session click
                this.deleteConversationGroup(session.group_id, sessionItem);
            });

            conversationList.appendChild(sessionItem);

            // Add a separator line after each session except the last one
            if (index < sessions.length - 1) {
                const separator = document.createElement('hr');
                separator.className = 'session-separator';
                separator.style.margin = '8px 15%';
                separator.style.border = 'none';
                separator.style.height = '1px';
                separator.style.backgroundColor = '#444';
                separator.style.opacity = '0.4';

                conversationList.appendChild(separator);
            }
        });
    }

    // Deletes a conversation group (session) from the UI and database after confirmation.
    async deleteConversationGroup(groupId, sessionItem) {
        if (!groupId) {
            console.error('ChatTab: Missing group ID for deletion');
            return;
        }

        // Confirm deletion
        const confirmMessage = Lang.get('confirmDeleteGroup') || 'Are you sure you want to delete this conversation?';
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            if (!hashedMasterKey) {
                console.error('ChatTab: No hashed masterkey found');
                return;
            }

           //console.log(`ChatTab: Deleting conversation group ${groupId} for masterkey ${hashedMasterKey}`);

            // Add visual feedback during deletion
            if (sessionItem) {
                sessionItem.style.opacity = '0.5';
                sessionItem.style.pointerEvents = 'none';
            }

            // Delete from database
            const success = await this.deleteConversationGroupFromDb(hashedMasterKey, groupId);

            if (success) {
                // Find and remove separator associated with this session item
                if (sessionItem && sessionItem.parentNode) {
                    // Check for separator before this session item
                    const prevSibling = sessionItem.previousElementSibling;
                    if (prevSibling && prevSibling.classList.contains('session-separator')) {
                        prevSibling.parentNode.removeChild(prevSibling);
                    }

                    // Check for separator after this session item
                    const nextSibling = sessionItem.nextElementSibling;
                    if (nextSibling && nextSibling.classList.contains('session-separator')) {
                        nextSibling.parentNode.removeChild(nextSibling);
                    }

                    // Now remove the session item itself
                    sessionItem.parentNode.removeChild(sessionItem);
                }
                // If this was the currently displayed conversation, show welcome message
                const currentGroup = window.currentConversationGroup;
                if (currentGroup && currentGroup == groupId) {
                    this.showWelcomeMessage();
                    window.currentConversationGroup = null;

                    // Enable prompt input
                    const promptInput = document.getElementById('prompt-input');
                    if (promptInput) {
                        promptInput.disabled = false;
                        promptInput.placeholder = promptInput.dataset.originalPlaceholder || Lang.get('enterMessage') || 'Enter your message...';
                    }
                }

               //console.log(`ChatTab: Successfully deleted conversation group ${groupId}`);
            } else {
                // Restore UI on failure
                if (sessionItem) {
                    sessionItem.style.opacity = '';
                    sessionItem.style.pointerEvents = '';
                }
                alert(Lang.get('errorDeletingConversation') || 'Error deleting conversation');
            }
        } catch (error) {
            console.error('ChatTab: Error deleting conversation group:', error);
            alert(Lang.get('errorDeletingConversation') || 'Error deleting conversation');

            // Restore UI on error
            if (sessionItem) {
                sessionItem.style.opacity = '';
                sessionItem.style.pointerEvents = '';
            }
        }
    }

    // Deletes all messages in a conversation group from the database.
    async deleteConversationGroupFromDb(hashedMasterKey, groupId) {
        try {
            // Get the database
            const db = await PaiperworkDB.getDatabase(hashedMasterKey);
            if (!db) {
                console.error(`ChatTab: Database not found for masterkey: ${hashedMasterKey}`);
                return false;
            }

           //console.log(`DATABASE: Deleting conversation group ${groupId} from conversations_${hashedMasterKey}`);

            // Delete all messages with this group ID
            db.exec(`DELETE FROM conversations_${hashedMasterKey} WHERE conversation_group = ?`, [groupId]);

            // Save changes to IndexedDB
            await PaiperworkDB.saveToStorage(db.export(), hashedMasterKey);

            return true;
        } catch (error) {
            console.error('ChatTab: Error deleting conversation group from database:', error);
            return false;
        }
    }

    // Displays a welcome message in the chat area when no conversation is selected.
    showWelcomeMessage() {
        const aiReplies = document.querySelector('.ai-replies');
        if (!aiReplies) return;

        // FIXED: Clear current conversation group when showing welcome message
        window.currentConversationGroup = null;

        aiReplies.innerHTML = `
        <div class="assistant-message welcome-message">
            <div class="ai-response-container" style="text-align: center; padding: 20px;">
                <p>${Lang.get('welcomeNewConversation') || 'Welcome to your new conversation!'}</p>
                <p>${Lang.get('chooseModelStart') || 'Choose a model and type a message below to get started.'}</p>
            </div>
        </div>
    `;
    }

    // Updates the UI for visual models, including image upload and modal logic.
    updateVisualModelUI(modelName) {
        let processingDrop = false;
        const updateMultiImageGridRef = this.updateMultiImageGrid.bind(this);
        const promptContainer = document.querySelector('.prompt-container');
        const existingImageButton = document.getElementById('image-button');
        const webSearchButton = document.getElementById('web-search');

        // Guard against startup/model-switch races where VISUAL_MODELS has not been loaded yet.
        if (!OllamaAPI.visualModels && typeof OllamaAPI.loadVisualModels === 'function') {
            OllamaAPI.loadVisualModels()
                .then(() => this.updateVisualModelUI(modelName))
                .catch((error) => console.warn('ChatTab: Failed to load visual models before UI update', error));
            return;
        }

        // Check if the selected model is a visual model
        const isVisual = OllamaAPI.isVisualModel(modelName);
       //console.log('ChatTab: Model is visual:', isVisual, modelName);
        OllamaAPI.maxImagesUsed = 0;
       //console.log('ChatTab: Reset maxImagesUsed to 0 due to model change');

        // Check if the model is Gemma3 for multi-image support
        const isGemma3 = modelName.toLowerCase().includes('gemma3');
       //console.log('ChatTab: Model is Gemma3 (multi-image):', isGemma3);

        // Only reset image data if NOT Gemma3
        if (!isGemma3) {
            // Reset all image data for non-Gemma3 models
            window.selectedImage = null;
            window.cleanedImageBase64 = null;
            window.selectedImages = [];
            window.cleanedImageBase64Array = [];
        } else {
            // Initialize multi-image arrays if needed for Gemma3
            window.selectedImages = window.selectedImages || [];
            window.cleanedImageBase64Array = window.cleanedImageBase64Array || [];
        }

        // If it's a visual model and we don't have an image button yet, create it
        if (isVisual && !existingImageButton) {
            // Create image button
            const imageButton = document.createElement('button');
            imageButton.id = 'image-button';
            imageButton.className = 'image-button';
            imageButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
        `;
            imageButton.title = Lang.get('addImage') || 'Add Image';

            // Apply the same styling as the web-search button
            imageButton.style.width = '40px';
            imageButton.style.height = '70px';
            imageButton.style.backgroundColor = '#404040';
            imageButton.style.color = 'white';
            imageButton.style.border = '2px solid var(--border-color)';
            imageButton.style.borderRadius = '8px';
            imageButton.style.cursor = 'pointer';
            imageButton.style.transition = 'all 0.2s ease';
            imageButton.style.display = 'flex';
            imageButton.style.alignItems = 'center';
            imageButton.style.justifyContent = 'center';
            imageButton.style.position = 'relative'; // Needed for the badge

            // Insert before the web button if it exists, otherwise add to prompt area
            if (webSearchButton) {
                webSearchButton.parentNode.insertBefore(imageButton, webSearchButton);
            } else {
                const promptArea = document.querySelector('.prompt-area');
                if (promptArea) {
                    promptArea.insertBefore(imageButton, promptArea.firstChild);
                }
            }

            // Create hidden file input with multi-select for Gemma3
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'image-upload';
            fileInput.accept = 'image/*';
            // Enable multiple file selection for Gemma3
            if (isGemma3) {
                fileInput.multiple = true;
            }
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);

            // Create image modal
            const imageModal = document.createElement('div');
            imageModal.id = 'image-modal';
            imageModal.className = 'image-modal';
            imageModal.style.display = 'none';
            imageModal.style.position = 'fixed';
            imageModal.style.top = '0';
            imageModal.style.left = '0';
            imageModal.style.width = '100%';
            imageModal.style.height = '100%';
            imageModal.style.backgroundColor = 'rgba(0,0,0,0.8)';
            imageModal.style.zIndex = '1000';
            imageModal.style.display = 'none';
            imageModal.style.alignItems = 'center';
            imageModal.style.justifyContent = 'center';

            // Create modal content with multi-image support for Gemma3
            imageModal.innerHTML = `
            <div class="image-modal-content" style="background: var(--bg-color); padding: 20px; border-radius: 8px; max-width: 90%; max-height: 90%; display: flex; flex-direction: column; position: relative; overflow-y: auto;">
                <button class="close-modal" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: var(--text-color); font-size: 24px; cursor: pointer;">×</button>
                <h3 style="margin-top: 0;">${Lang.get('addImage') || 'Add Image'}</h3>
                
                <div class="upload-placeholder" style="margin: 20px 0; border: 2px dashed #ddd; border-radius: 8px; padding: 20px; text-align: center;">
                    <div class="upload-label" style="display: flex; flex-direction: column; align-items: center; cursor: pointer; color: #666;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <span style="margin-top: 10px;" class="upload-text">${isGemma3 ?
                    Lang.get('clickOrDragMultipleImages') || 'Click to upload or drag image(s) here' :
                    Lang.get('clickOrDragSingleImage') || 'Click to upload or drag an image here'}</span>
                        <span style="margin-top: 5px; font-size: 0.8em; color: #22c55e;" class="model-hint">
                            ${isGemma3 ?
                    `Gemma3: ${Lang.get('dragMultipleImages') || 'You can add multiple images'}` :
                    Lang.get('singleImageOnly') || 'This model supports only one image at a time'}
                        </span>
                    </div>
                </div>
                
                <!-- Image preview container -->
                <div class="image-preview" style="display: none; margin: 20px 0;">
                    <!-- For single image mode -->
                    <div class="single-image-preview" style="${isGemma3 ? 'display: none;' : ''}">
                        <img id="preview-image" src="" style="max-width: 100%; max-height: 300px; border-radius: 8px;">
                        <div class="image-dimensions" style="margin-top: 10px; font-size: 12px; color: #666;"></div>
                        <button class="remove-image" style="margin-top: 10px; width: 30px; height: 30px; line-height: 1; font-size: 20px; background: #ef4444; color: white; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
                    </div>
                    
                    <!-- For multi-image mode (Gemma3) -->
                    <div class="multi-image-preview" style="${isGemma3 ? '' : 'display: none;'}">
                        <div class="image-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;"></div>
                        ${isGemma3 ? `<div class="multi-image-count" style="margin-top: 10px; font-size: 14px; color: #666;">0 ${Lang.get('imagesSelected') || 'images selected'}</div>` : ''}
                    </div>
                </div>
                
                <div class="modal-buttons" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
                    ${isGemma3 ? `<button class="clear-all-images" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; display: none;">${Lang.get('clearAllImages') || 'Clear All'}</button>` : ''}
                    <button class="cancel-button" style="padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">${Lang.get('cancel') || 'Cancel'}</button>
                    <button class="insert-button" style="padding: 8px 16px; background: var(--accent-color, #4f46e5); color: white; border: none; border-radius: 4px; cursor: pointer;" disabled>${Lang.get('insertImage') || 'Insert Image'}</button>
                </div>
            </div>
            `;

            document.body.appendChild(imageModal);

            // Add event listeners
            imageButton.addEventListener('click', () => {
                // First check if we're in "images under the hood" mode and reset if needed
                if (window.imagesUnderTheHood) {
                    // If adding new visible images, clear the under-the-hood flag and data
                    window.imagesUnderTheHood = false;
                    window.selectedImages = [];
                    window.cleanedImageBase64Array = [];
                    window.currentMessageImages = [];

                   //console.log('ChatTab: Resetting under-the-hood image data for new visible images');
                }
                // Reset the UI state based on current image data before showing the modal
                const uploadPlaceholder = imageModal.querySelector('.upload-placeholder');
                const imagePreview = imageModal.querySelector('.image-preview');
                const previewImage = imageModal.querySelector('#preview-image');
                const insertButton = imageModal.querySelector('.insert-button');

                // If there's no image data, reset the modal to default state
                if (!window.selectedImage || typeof window.selectedImage !== 'string') {
                    if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
                    if (imagePreview) imagePreview.style.display = 'none';
                    if (insertButton) insertButton.disabled = true;

                    // Clear any existing preview
                    if (previewImage) previewImage.src = '';

                    // Reset dimensions text if it exists
                    const dimensions = imageModal.querySelector('.image-dimensions');
                    if (dimensions) dimensions.textContent = '';
                }

                // Show the modal
                imageModal.style.display = 'flex';
            });

            // Close modal events
            const closeModal = () => {
                imageModal.style.display = 'none';
            };

            imageModal.querySelector('.close-modal').addEventListener('click', closeModal);
            imageModal.querySelector('.cancel-button').addEventListener('click', closeModal);


            const handleImageFile = (file, appendMode = false) => {
                // Check file type
                if (!file.type.startsWith('image/')) {
                    alert(Lang.get('onlyImagesAllowed') || 'Only image files are allowed');
                    return;
                }

                // Check file size (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                    alert(Lang.get('imageTooLarge') || 'Image is too large (max 5MB)');
                    return;
                }

                // For non-Gemma3 models, ensure we're in single image mode (replace any existing)
                if (!isGemma3) {
                    appendMode = false;
                    // Reset arrays even if provided
                    window.selectedImages = [];
                    window.cleanedImageBase64Array = [];
                }

                // Add this reset/cleanup step
                if (!appendMode) {
                    // Reset the state for single image mode
                    window.selectedImage = null;
                    window.cleanedImageBase64 = null;
                    const previewImage = imageModal.querySelector('#preview-image');
                    if (previewImage) previewImage.src = '';
                }

                // Add quality information for the user
               //console.log(`Image selected: ${file.name}, ${(file.size / 1024 / 1024).toFixed(2)}MB, ${file.type}`);

                const reader = new FileReader();
                reader.onload = (e) => {
                    // Show preview containers
                    const uploadPlaceholder = imageModal.querySelector('.upload-placeholder');
                    const imagePreview = imageModal.querySelector('.image-preview');
                    uploadPlaceholder.style.display = 'none';
                    imagePreview.style.display = 'block';

                    // Enable insert and clear buttons
                    imageModal.querySelector('.insert-button').disabled = false;
                    if (isGemma3) {
                        const clearAllBtn = imageModal.querySelector('.clear-all-images');
                        if (clearAllBtn) clearAllBtn.style.display = 'block';
                    }

                    if (isGemma3) {
                        // Multi-image mode (Gemma3)
                        // Store base64 image data in the array
                        if (!appendMode) {
                            window.selectedImages = [];
                            window.cleanedImageBase64Array = [];
                        }
                        window.selectedImages.push(e.target.result);

                        // Clean the base64 data
                        let base64Image = e.target.result;
                        if (base64Image.includes('base64,')) {
                            base64Image = base64Image.split('base64,')[1];
                        }
                        window.cleanedImageBase64Array.push(base64Image);

                        // Update the grid of images
                        updateMultiImageGridRef();
                    } else {
                        // Single image mode
                        window.selectedImage = e.target.result;
                        window.cleanedImageBase64 = null; // Reset cleaned base64

                        // Show preview
                        const previewImage = imageModal.querySelector('#preview-image');
                        const singleImagePreview = imageModal.querySelector('.single-image-preview');
                        singleImagePreview.style.display = 'block';
                        previewImage.src = e.target.result;

                        // Show dimensions
                        const img = new Image();
                        img.onload = function () {
                            const dimensions = imageModal.querySelector('.image-dimensions');
                            dimensions.textContent = `${img.naturalWidth} × ${img.naturalHeight}px, ${(file.size / 1024 / 1024).toFixed(2)}MB`;
                        };
                        img.src = e.target.result;
                    }

                   //console.log('ChatTab: Image(s) loaded and ready for sending');
                };

                reader.readAsDataURL(file);
            };
            const updateMultiImageGridRef = this.updateMultiImageGrid.bind(this);

            // Update file selection handler to handle multiple images for Gemma3
            fileInput.addEventListener('change', (event) => {
                if (!event.target.files || event.target.files.length === 0) return;

                // Get all selected files
                const files = Array.from(event.target.files);

                // Check if we're using Gemma3 (multi-image) or regular mode
                if (isGemma3) {
                    // Process multiple files
                    files.forEach(file => {
                        handleImageFile(file, true); // true = append mode for multi-image
                    });
                } else {
                    // Single image mode - just process the first file
                    handleImageFile(files[0], false); // false = replace mode
                }
            });

            // Add "Clear All" button functionality for multi-image mode
            if (isGemma3) {
                const clearAllBtn = imageModal.querySelector('.clear-all-images');
                clearAllBtn.addEventListener('click', () => {
                    // Clear all images
                    window.selectedImages = [];
                    window.cleanedImageBase64Array = [];

                    // CRITICAL FIX: Replace the file input to ensure change event can fire again
                    const oldFileInput = document.getElementById('image-upload');
                    if (oldFileInput) {
                        // Create a new file input with the same properties
                        const newFileInput = document.createElement('input');
                        newFileInput.type = 'file';
                        newFileInput.id = 'image-upload';
                        newFileInput.accept = 'image/*';
                        newFileInput.multiple = true; // Always true for Gemma3
                        newFileInput.style.display = 'none';

                        // Add the same event listener to the new input
                        newFileInput.addEventListener('change', (event) => {
                            if (!event.target.files || event.target.files.length === 0) return;
                            const files = Array.from(event.target.files);
                            files.forEach(file => {
                                handleImageFile(file, true);
                            });
                        });

                        // Replace the old input with the new one
                        oldFileInput.parentNode.replaceChild(newFileInput, oldFileInput);
                       //console.log('ChatTab: File input replaced after Clear All');
                    }

                    // Use the updateMultiImageGrid method which properly handles empty state
                    this.updateMultiImageGrid();
                });
            }

            // Handle image removal for single image mode
            imageModal.querySelector('.remove-image').addEventListener('click', () => {
                window.selectedImage = null;
                window.cleanedImageBase64 = null; // Clear stored cleaned base64 too

                // CRITICAL FIX: Create a new file input element to replace the old one
                // This ensures the change event will fire even if the same file is selected again
                const oldFileInput = document.getElementById('image-upload');
                if (oldFileInput) {
                    // Create a new file input with the same properties
                    const newFileInput = document.createElement('input');
                    newFileInput.type = 'file';
                    newFileInput.id = 'image-upload';
                    newFileInput.accept = 'image/*';
                    newFileInput.style.display = 'none';

                    // Set multiple attribute if needed (for Gemma3)
                    if (isGemma3) {
                        newFileInput.multiple = true;
                    }

                    // Add the same event listener to the new input
                    newFileInput.addEventListener('change', (event) => {
                        if (!event.target.files || event.target.files.length === 0) return;

                        // Get all selected files
                        const files = Array.from(event.target.files);

                        // Check if we're using Gemma3 (multi-image) or regular mode
                        if (isGemma3) {
                            // Process multiple files
                            files.forEach(file => {
                                handleImageFile(file, true); // true = append mode for multi-image
                            });
                        } else {
                            // Single image mode - just process the first file
                            handleImageFile(files[0], false); // false = replace mode
                        }
                    });

                    // Replace the old input with the new one
                    oldFileInput.parentNode.replaceChild(newFileInput, oldFileInput);

                   //console.log('ChatTab: File input replaced to allow selecting same file again');
                }

                // Reset UI elements
                const uploadPlaceholder = imageModal.querySelector('.upload-placeholder');
                const imagePreview = imageModal.querySelector('.image-preview');
                const singleImagePreview = imageModal.querySelector('.single-image-preview');

                // Ensure upload placeholder is visible and image preview is hidden
                if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
                if (imagePreview) imagePreview.style.display = 'none';
                if (singleImagePreview) singleImagePreview.style.display = 'none';

                // Clear the image src
                const previewImage = imageModal.querySelector('#preview-image');
                if (previewImage) previewImage.src = '';

                // Reset image dimensions
                const dimensions = imageModal.querySelector('.image-dimensions');
                if (dimensions) dimensions.textContent = '';

                // Disable the insert button
                imageModal.querySelector('.insert-button').disabled = true;

                // Reset the image button appearance to show no image is attached
                imageButton.classList.remove('active');
                imageButton.style.backgroundColor = '#404040';
                imageButton.style.color = 'white';
                imageButton.style.transform = 'none';
                imageButton.style.boxShadow = 'none';

               //console.log('ChatTab: Image removed, UI reset');
            });

            // Handle image insertion with multi-image support
            imageModal.querySelector('.insert-button').addEventListener('click', () => {
                window.newImagesAdded = true;
                if (isGemma3) {
                    // Multi-image mode - check if we have images
                    if (!window.selectedImages || window.selectedImages.length === 0) {
                        alert(Lang.get('noImagesSelected') || 'Please select at least one image');
                        return;
                    }

                    // Visual feedback that image is attached
                    imageButton.classList.add('active');
                    imageButton.style.backgroundColor = 'rgb(253,148,7)';
                    imageButton.style.color = 'black';
                    imageButton.style.transform = 'scale(0.95)';
                    imageButton.style.boxShadow = 'inset 0 0 5px rgba(0,0,0,0.2)';

                    // Display count of images on button (small badge)
                    const existingBadge = imageButton.querySelector('.image-count-badge');
                    if (existingBadge) {
                        existingBadge.textContent = window.selectedImages.length;
                    } else {
                        const badge = document.createElement('span');
                        badge.className = 'image-count-badge';
                        badge.textContent = window.selectedImages.length;
                        badge.style.position = 'absolute';
                        badge.style.top = '-5px';
                        badge.style.right = '-5px';
                        badge.style.backgroundColor = '#ef4444';
                        badge.style.color = 'white';
                        badge.style.borderRadius = '50%';
                        badge.style.width = '20px';
                        badge.style.height = '20px';
                        badge.style.display = 'flex';
                        badge.style.alignItems = 'center';
                        badge.style.justifyContent = 'center';
                        badge.style.fontSize = '12px';
                        badge.style.fontWeight = 'bold';

                        imageButton.appendChild(badge);
                    }

                   //console.log(`ChatTab: ${window.selectedImages.length} images confirmed and ready for sending`);
                } else {
                    // Single image mode - check if we have an image
                    if (!window.selectedImage || typeof window.selectedImage !== 'string') {
                        alert(Lang.get('imageDataInvalid') || 'Image data is invalid. Please try uploading again.');
                        return;
                    }

                    // When inserting a new image, reset any stored cleaned base64
                    window.cleanedImageBase64 = null;

                    // Visual feedback that image is attached
                    imageButton.classList.add('active');
                    imageButton.style.backgroundColor = 'rgb(253,148,7)';
                    imageButton.style.color = 'black';
                    imageButton.style.transform = 'scale(0.95)';
                    imageButton.style.boxShadow = 'inset 0 0 5px rgba(0,0,0,0.2)';

                   //console.log('ChatTab: Image confirmed and ready for sending');
                }

                closeModal();
            });

            // Add drag and drop support for the upload area
            const uploadArea = imageModal.querySelector('.upload-placeholder');
            const fileInputArea = uploadArea; // Alias for clarity

            fileInputArea.addEventListener('dragover', (e) => {
                e.preventDefault();

                // Get the current selected model to determine if it's Gemma3
                const modelSelector = document.getElementById('model-selector');
                const selectedModel = modelSelector ? modelSelector.value : '';
                const isGemma3 = selectedModel.toLowerCase().includes('gemma3');

                // Update the visual feedback based on model type
                fileInputArea.style.borderColor = 'var(--accent-color, #4f46e5)';
                fileInputArea.style.backgroundColor = 'rgba(79, 70, 229, 0.05)';

                // Update the placeholder text dynamically based on model type
                const uploadText = fileInputArea.querySelector('.upload-text');
                if (uploadText) {
                    uploadText.textContent = isGemma3 ?
                        (Lang.get('clickOrDragMultipleImages') || 'Click to upload or drag image(s) here') :
                        (Lang.get('clickOrDragSingleImage') || 'Click to upload or drag an image here');
                }

                // Update the hint text as well
                const modelHint = fileInputArea.querySelector('.model-hint');
                if (modelHint) {
                    modelHint.textContent = isGemma3 ?
                        `Gemma3: ${Lang.get('dragMultipleImages') || 'You can add multiple images'}` :
                        (Lang.get('singleImageOnly') || 'This model supports only one image at a time');
                }
            });

            fileInputArea.addEventListener('dragleave', () => {
                fileInputArea.style.borderColor = '#ddd';
                fileInputArea.style.backgroundColor = 'transparent';
            });

            fileInputArea.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Stop event propagation

                if (processingDrop) return; // Skip if already processing
                processingDrop = true;
                fileInputArea.style.borderColor = '#ddd';
                fileInputArea.style.backgroundColor = 'transparent';

                // Process drop on the upload area
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const files = Array.from(e.dataTransfer.files);

                    if (isGemma3) {
                        // Process all dropped files for Gemma3
                        files.forEach(file => {
                            if (file.type.startsWith('image/')) {
                                handleImageFile(file, true);
                            }
                        });
                    } else {
                        // Only process the first file for other models
                        if (files.length > 1) {
                           //console.log('ChatTab: Multiple files dropped but this model only supports one image - using first image only');
                        }

                        // Find the first valid image
                        const imageFile = files.find(file => file.type.startsWith('image/'));
                        if (imageFile) {
                            handleImageFile(imageFile, false);
                        } else {
                            console.warn('ChatTab: No valid image files found in dropped files');
                        }
                    }
                }
                setTimeout(() => { processingDrop = false; }, 100); // Reset flag
            });

            imageModal.addEventListener('dragover', (e) => {
                e.preventDefault();

                // Skip if this event is being handled by the file input area directly
                if (fileInputArea.contains(e.target)) return;

                // Get the current selected model to determine if it's Gemma3
                const modelSelector = document.getElementById('model-selector');
                const selectedModel = modelSelector ? modelSelector.value : '';
                const isGemma3 = selectedModel.toLowerCase().includes('gemma3');

                // Show visual feedback on the file input area
                if (e.target !== fileInputArea) {
                    fileInputArea.style.borderColor = 'var(--accent-color, #4f46e5)';
                    fileInputArea.style.backgroundColor = 'rgba(79, 70, 229, 0.05)';
                }

                // Update the placeholder text dynamically based on model type
                const uploadText = fileInputArea.querySelector('.upload-text');
                if (uploadText) {
                    uploadText.textContent = isGemma3 ?
                        (Lang.get('clickOrDragMultipleImages') || 'Click to upload or drag image(s) here') :
                        (Lang.get('clickOrDragSingleImage') || 'Click to upload or drag an image here');
                }

                // Update the hint text as well
                const modelHint = fileInputArea.querySelector('.model-hint');
                if (modelHint) {
                    modelHint.textContent = isGemma3 ?
                        `Gemma3: ${Lang.get('dragMultipleImages') || 'You can add multiple images'}` :
                        (Lang.get('singleImageOnly') || 'This model supports only one image at a time');
                }
            });

            imageModal.addEventListener('drop', (e) => {
                e.preventDefault();

                // Skip if this event is being handled by the file input area
                if (fileInputArea.contains(e.target)) return;

                if (processingDrop) return; // Skip if already processing
                processingDrop = true;
                fileInputArea.style.borderColor = '#ddd';
                fileInputArea.style.backgroundColor = 'transparent';

                // Process drop anywhere in the modal
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const files = Array.from(e.dataTransfer.files);

                    if (isGemma3) {
                        // Process all dropped files for Gemma3
                        files.forEach(file => {
                            if (file.type.startsWith('image/')) {
                                handleImageFile(file, true);
                            }
                        });
                    } else {
                        // Only process the first file for other models
                        if (files.length > 1) {
                           //console.log('ChatTab: Multiple files dropped but this model only supports one image - using first image only');
                        }

                        // Find the first valid image
                        const imageFile = files.find(file => file.type.startsWith('image/'));
                        if (imageFile) {
                            handleImageFile(imageFile, false);
                        } else {
                            console.warn('ChatTab: No valid image files found in dropped files');
                        }
                    }
                }
                setTimeout(() => { processingDrop = false; }, 100); // Reset flag
            });
            // Update the click handler on the image modal:

            imageModal.addEventListener('click', (e) => {
                // Check if we clicked on the upload label or one of its children
                const uploadLabel = imageModal.querySelector('.upload-label');
                if (uploadLabel && (e.target === uploadLabel || uploadLabel.contains(e.target))) {
                    // Get the current selected model to determine if it's Gemma3
                    const modelSelector = document.getElementById('model-selector');
                    const selectedModel = modelSelector ? modelSelector.value : '';
                    const isGemma3 = selectedModel.toLowerCase().includes('gemma3');

                   //console.log('ChatTab: Upload area clicked, creating new file input for model:', selectedModel);
                   //console.log('ChatTab: Multi-image mode (Gemma3):', isGemma3);

                    // Get the current file input
                    const oldFileInput = document.getElementById('image-upload');
                    if (!oldFileInput) return;

                    // Create a new file input with the same properties
                    const newFileInput = document.createElement('input');
                    newFileInput.type = 'file';
                    newFileInput.id = 'image-upload';
                    newFileInput.accept = 'image/*';
                    newFileInput.style.display = 'none';

                    // Set multiple attribute based on current model type
                    newFileInput.multiple = isGemma3;

                    // Add the same event listener
                    newFileInput.addEventListener('change', (event) => {
                        if (!event.target.files || event.target.files.length === 0) return;

                        // Process the selected files
                        const files = Array.from(event.target.files);

                        if (isGemma3) {
                            files.forEach(file => {
                                handleImageFile(file, true);
                            });
                        } else {
                            handleImageFile(files[0], false);
                        }
                    });

                    // Replace the old input
                    oldFileInput.parentNode.replaceChild(newFileInput, oldFileInput);

                    // Trigger a click on the new input to open the file dialog
                    newFileInput.click();
                   //console.log('ChatTab: File input replaced before opening file dialog with multiple =', newFileInput.multiple);
                }
            });
        }
        // If it's not a visual model but we have an image button, remove it
        else if (!isVisual && existingImageButton) {
            existingImageButton.remove();

            // Also remove any related elements
            const fileInput = document.getElementById('image-upload');
            const imageModal = document.getElementById('image-modal');

            if (fileInput) fileInput.remove();
            if (imageModal) imageModal.remove();

            // Always reset image data when removing the button, regardless of model type
            window.selectedImage = null;
            window.cleanedImageBase64 = null;
            window.selectedImages = [];
            window.cleanedImageBase64Array = [];
        }

        // Update button UI state if it exists
        if (isVisual && existingImageButton && isGemma3 && window.selectedImages && window.selectedImages.length > 0) {
            // If we're switching to Gemma3 and already have images, update the button UI
            existingImageButton.classList.add('active');
            existingImageButton.style.backgroundColor = 'rgb(253,148,7)';
            existingImageButton.style.color = 'black';

            // Update or create the badge counter
            let badge = existingImageButton.querySelector('.image-count-badge');
            if (badge) {
                badge.textContent = window.selectedImages.length;
            } else {
                badge = document.createElement('span');
                badge.className = 'image-count-badge';
                badge.textContent = window.selectedImages.length;
                badge.style.position = 'absolute';
                badge.style.top = '-5px';
                badge.style.right = '-5px';
                badge.style.backgroundColor = '#ef4444';
                badge.style.color = 'white';
                badge.style.borderRadius = '50%';
                badge.style.width = '20px';
                badge.style.height = '20px';
                badge.style.display = 'flex';
                badge.style.alignItems = 'center';
                badge.style.justifyContent = 'center';
                badge.style.fontSize = '12px';
                badge.style.fontWeight = 'bold';
                existingImageButton.appendChild(badge);
            }
        }
    }
    // Updates the image modal UI and resets image data based on the selected model type.
    updateImageModalForModel(isGemma3) {
       //console.log('ChatTab: Updating image modal for model type:', isGemma3 ? 'Gemma3' : 'Other visual model');

        const imageModal = document.getElementById('image-modal');
        if (!imageModal) return;

        // Only reset image data if NOT Gemma3
        if (!isGemma3) {
            // Updates the image modal UI and resets image data based on the selected model type.
            // For non-Gemma3 models, reset all image data
            window.selectedImage = null;
            window.cleanedImageBase64 = null;
            window.selectedImages = [];
            window.cleanedImageBase64Array = [];
        } else {
            // For Gemma3, preserve the image arrays but ensure they're initialized
            window.selectedImages = window.selectedImages || [];
            window.cleanedImageBase64Array = window.cleanedImageBase64Array || [];
        }

        // Update file input multiple attribute
        const fileInput = document.getElementById('image-upload');
        if (fileInput) {
            fileInput.multiple = isGemma3;
            // Reset file input value (ADD THIS)
            fileInput.value = '';
           //console.log('ChatTab: File input multiple attribute set to:', isGemma3);
        }

        // Update text elements
        const uploadText = imageModal.querySelector('.upload-text');
        const modelHint = imageModal.querySelector('.model-hint');

        if (uploadText) {
            uploadText.textContent = isGemma3 ?
                (Lang.get('clickOrDragMultipleImages') || 'Click to upload or drag image(s) here') :
                (Lang.get('clickOrDragSingleImage') || 'Click to upload or drag an image here');
        }

        if (modelHint) {
            modelHint.textContent = isGemma3 ?
                `Gemma3: ${Lang.get('dragMultipleImages') || 'You can add multiple images'}` :
                (Lang.get('singleImageOnly') || 'This model supports only one image at a time');
        }

        // Show/hide appropriate preview containers
        const singleImagePreview = imageModal.querySelector('.single-image-preview');
        const multiImagePreview = imageModal.querySelector('.multi-image-preview');

        if (singleImagePreview) {
            singleImagePreview.style.display = isGemma3 ? 'none' : '';
        }

        if (multiImagePreview) {
            multiImagePreview.style.display = isGemma3 ? '' : 'none';
        }

        // Show/hide Clear All button
        const clearAllButton = imageModal.querySelector('.clear-all-images');
        if (clearAllButton) {
            clearAllButton.style.display = isGemma3 ? '' : 'none';
        }

        // Reset image preview display
        const imagePreview = imageModal.querySelector('.image-preview');
        const uploadPlaceholder = imageModal.querySelector('.upload-placeholder');

        if (imagePreview) imagePreview.style.display = 'none';
        if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';

        // Reset insert button state
        const insertButton = imageModal.querySelector('.insert-button');
        if (insertButton) insertButton.disabled = true;

        // Update UI to show current images if any (for Gemma3)
        if (isGemma3 && window.selectedImages && window.selectedImages.length > 0) {
            this.updateMultiImageGrid();
        }

       //console.log('ChatTab: Image modal updated for', isGemma3 ? 'Gemma3' : 'regular visual model');
    }

    // Updates the image grid in the modal for multi-image (Gemma3) support.
    updateMultiImageGrid() {
        // Get necessary elements - we need to ensure these are found properly
        const imageModal = document.getElementById('image-modal');
        const imageGrid = imageModal?.querySelector('.image-grid');
        const imageCount = imageModal?.querySelector('.multi-image-count');

        if (!imageModal || !imageGrid || !imageCount) {
            console.error('ChatTab: Required elements for updateMultiImageGrid not found');
            return;
        }

        // Get both preview containers
        const imagePreview = imageModal.querySelector('.image-preview');
        const singleImagePreview = imageModal.querySelector('.single-image-preview');
        const multiImagePreview = imageModal.querySelector('.multi-image-preview');
        const uploadPlaceholder = imageModal.querySelector('.upload-placeholder');

        // First check if we have any images left
        if (!window.selectedImages || window.selectedImages.length === 0) {
            // No images left - show upload placeholder, hide image preview section
            if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
            if (imagePreview) imagePreview.style.display = 'none';
            if (singleImagePreview) singleImagePreview.style.display = 'none';
            if (multiImagePreview) multiImagePreview.style.display = 'none';

            // Hide clear all button and disable insert button
            const clearAllBtn = imageModal.querySelector('.clear-all-images');
            const insertButton = imageModal.querySelector('.insert-button');
            if (clearAllBtn) clearAllBtn.style.display = 'none';
            if (insertButton) insertButton.disabled = true;

            // IMPORTANT: Also reset the image button in the chat interface
            const imageButton = document.getElementById('image-button');
            if (imageButton) {
                // Remove active state
                imageButton.classList.remove('active');
                imageButton.style.backgroundColor = '#404040'; // Reset to default color
                imageButton.style.color = 'white';
                imageButton.style.transform = 'none';
                imageButton.style.boxShadow = 'none';

                // Remove the badge if it exists
                const badge = imageButton.querySelector('.image-count-badge');
                if (badge) {
                    badge.remove();
                }
            }

            return;
        }

        // Show proper containers for images
        if (uploadPlaceholder) uploadPlaceholder.style.display = 'none';
        if (imagePreview) imagePreview.style.display = 'block';
        if (singleImagePreview) singleImagePreview.style.display = 'none'; // Hide single image preview
        if (multiImagePreview) multiImagePreview.style.display = 'block'; // Show multi-image preview

        // Clear the grid
        imageGrid.innerHTML = '';


        // Add each image to the grid
        window.selectedImages.forEach((imgSrc, index) => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'image-grid-item';
            imgContainer.style.position = 'relative';
            imgContainer.style.overflow = 'hidden';
            imgContainer.style.borderRadius = '4px';

            const img = document.createElement('img');
            img.src = imgSrc;
            img.style.width = '100%';
            img.style.height = '100px';
            img.style.objectFit = 'cover';

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '×';
            removeBtn.style.position = 'absolute';
            removeBtn.style.top = '5px';
            removeBtn.style.right = '5px';
            removeBtn.style.width = '22px';
            removeBtn.style.height = '22px';
            removeBtn.style.borderRadius = '50%';
            removeBtn.style.background = '#ef4444';
            removeBtn.style.color = 'white';
            removeBtn.style.border = 'none';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.display = 'flex';
            removeBtn.style.alignItems = 'center';
            removeBtn.style.justifyContent = 'center';
            removeBtn.style.fontSize = '14px';
            removeBtn.style.lineHeight = '1';

            // Remove this specific image when clicked
            removeBtn.addEventListener('click', () => {
                window.selectedImages.splice(index, 1);
                window.cleanedImageBase64Array.splice(index, 1);
                this.updateMultiImageGrid(); // Use this method directly
            });

            imgContainer.appendChild(img);
            imgContainer.appendChild(removeBtn);
            imageGrid.appendChild(imgContainer);
        });

        // Update the count display
        imageCount.textContent = `${window.selectedImages.length} ${Lang.get('imagesSelected') || 'images selected'}`;

        // Show/hide the clear all button based on if we have images
        const clearAllBtn = imageModal.querySelector('.clear-all-images');
        if (clearAllBtn) {
            clearAllBtn.style.display = window.selectedImages.length > 0 ? 'block' : 'none';
        }

        // Enable/disable insert button
        const insertButton = imageModal.querySelector('.insert-button');
        if (insertButton) {
            insertButton.disabled = window.selectedImages.length === 0;
        }
    }

    // Sets up handlers for image upload, preview, and removal for single-image mode.
    setupImageUploadHandlers() {
        const imageUpload = document.getElementById('image-upload');
        const previewImage = document.getElementById('preview-image');
        const imagePreview = document.querySelector('.image-preview');
        const uploadPlaceholder = document.querySelector('.upload-placeholder');
        const removeImageBtn = document.querySelector('.remove-image');

        if (!imageUpload || !previewImage || !imagePreview || !uploadPlaceholder) return;

        // Store the selected image in sessionStorage
        window.selectedImage = null;

        // Handle file selection
        // In the setupImageUploadHandlers method, add quality information:

        imageUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            // Check file type
            if (!file.type.startsWith('image/')) {
                alert(Lang.get('onlyImagesAllowed') || 'Only image files are allowed');
                return;
            }

            // Check file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                alert(Lang.get('imageTooLarge') || 'Image is too large (max 5MB)');
                return;
            }

            // Add quality information for the user
           //console.log(`Image selected: ${file.name}, ${(file.size / 1024 / 1024).toFixed(2)}MB, ${file.type}`);

            const reader = new FileReader();
            reader.onload = (e) => {
                // Store base64 image data
                window.selectedImage = e.target.result;

                // Show preview
                previewImage.src = e.target.result;
                uploadPlaceholder.style.display = 'none';
                imagePreview.style.display = 'block';

                // Create an image element to get dimensions
                const img = new Image();
                img.onload = function () {
                    // Add dimensions info
                    const dimensions = document.createElement('div');
                    dimensions.className = 'image-dimensions';
                    dimensions.textContent = `${img.naturalWidth} × ${img.naturalHeight}px`;
                    dimensions.style.fontSize = '12px';
                    dimensions.style.color = '#666';
                    dimensions.style.textAlign = 'center';
                    dimensions.style.marginTop = '5px';

                    // Remove any existing dimensions info
                    const existingDimensions = imagePreview.querySelector('.image-dimensions');
                    if (existingDimensions) existingDimensions.remove();

                    // Add the new dimensions info
                    imagePreview.appendChild(dimensions);
                };
                img.src = e.target.result;

               //console.log('ChatTab: Image loaded and ready for sending');
            };

            reader.readAsDataURL(file);
        });

        // Handle image removal
        removeImageBtn.addEventListener('click', () => {
            window.selectedImage = null;
            imageUpload.value = '';
            uploadPlaceholder.style.display = 'block';
            imagePreview.style.display = 'none';
        });
    }

    // Sets up the new chat button and its event handlers for starting a new conversation.
    setupConversationHistoryHandlers() {
        const newChatButton = document.querySelector('.new-conversation-btn');
        if (newChatButton) {
            // Apply styling to make the button more distinctive
            newChatButton.style.backgroundColor = 'var(--accent-color, #4f46e5)';
            newChatButton.style.color = 'white';
            newChatButton.style.border = 'none';
            newChatButton.style.borderRadius = '6px';
            newChatButton.style.padding = '6px 7px';
            newChatButton.style.fontWeight = '500';
            newChatButton.style.display = 'flex';
            newChatButton.style.alignItems = 'center';
            newChatButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            newChatButton.style.transition = 'all 0.2s ease';

            // Add a plus icon before the text
            newChatButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                    style="margin-right: 6px;">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                ${Lang.get('newChat') || 'New Chat'}
            `;

            // Add hover effect
            newChatButton.addEventListener('mouseenter', () => {
                newChatButton.style.backgroundColor = '#3c3aa6';
                newChatButton.style.transform = 'translateY(-1px)';
                newChatButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            });

            newChatButton.addEventListener('mouseleave', () => {
                newChatButton.style.backgroundColor = 'var(--accent-color, #4f46e5)';
                newChatButton.style.transform = 'translateY(0)';
                newChatButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            });

            newChatButton.addEventListener('click', async () => {
                await this.cancelActiveGenerationForTransition('new-chat');

                // Clear the current conversation
                const aiReplies = document.querySelector('.ai-replies');
                if (aiReplies) {
                    aiReplies.innerHTML = '';
                }

                // Reset context and conversation state
                OllamaAPI.previousContext = null;
                OllamaAPI.resetContext();
                OllamaAPI.previousConversations = [];
                OllamaAPI.maxImagesUsed = 0;
                OllamaAPI.lastUsedImages = [];
                window.imagesUnderTheHood = false;

                // Set flag to force a new conversation group on next message
                window.forceNewConversationGroup = true;

                window.currentConversationGroup = null;
               //console.log('ChatTab: Reset currentConversationGroup = null on new chat button click');

                // Reset any global state
                window.selectedImage = null;
                window.cleanedImageBase64 = null;
                window.selectedImages = [];
                window.cleanedImageBase64Array = [];

                // Reset the image button if present
                const imageButton = document.getElementById('image-button');
                if (imageButton) {
                    imageButton.classList.remove('active');
                    imageButton.style.backgroundColor = '#404040';
                    imageButton.style.color = 'white';
                    imageButton.style.transform = 'none';
                    imageButton.style.boxShadow = 'none';

                    // Remove any image count badge
                    const badge = imageButton.querySelector('.image-count-badge');
                    if (badge) badge.remove();
                }

                // Enable and clear prompt input
                const promptInput = document.getElementById('prompt-input');
                if (promptInput) {
                    promptInput.disabled = false;
                    promptInput.value = '';
                    promptInput.placeholder = promptInput.dataset.originalPlaceholder || Lang.get('enterMessage') || 'Enter your message...';

                    // Set focus on the input for immediate typing
                    promptInput.focus();
                }

                // Reset the web search button if active
                const webButton = document.getElementById('web-search');
                if (webButton && webButton.classList.contains('active')) {
                    webButton.classList.remove('active');
                }

                // Show welcome message for new chat
                this.showWelcomeMessage();

                // Reset active state in session list
                document.querySelectorAll('.session-item').forEach(item => {
                    item.classList.remove('active');
                });

                try {
                    const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                    if (hashedMasterKey) {
                        // Reload sessions list from database
                        const sessions = await this.loadSessionsList(hashedMasterKey);
                        // Render the updated sessions list
                        this.renderSessionsList(sessions);
                        window.currentConversationGroup = null;
                        this.showWelcomeMessage();
                    }
                } catch (error) {
                    console.error('ChatTab: Error refreshing sessions list:', error);
                }
               //console.log('ChatTab: New chat initialized - context and UI reset');
            });
        }
    }

    // Sets up the delete conversation handler for the main delete button.
    setupDeleteHandlers(deleteButton, hashedMasterKey) {
        if (deleteButton) {
            deleteButton.addEventListener('click', async () => {
                if (confirm(Lang.get('deleteConversationConfirm'))) {
                    const success = await PaiperworkDB.deleteDatabase(hashedMasterKey);
                    if (success) {
                        alert(Lang.get('conversationDeleted'));
                        window.location.href = '../welcome.html';
                    }
                }
            });
        }

    }

    // Updates or creates the "thinking" toggle button in the UI based on model support and version.
    updateThinkingToggleUI(modelName) {
       //console.log('🧠 ChatTab: updateThinkingToggleUI called with model:', modelName);

        // Track the latest request so delayed async responses do not overwrite newer UI state.
        this._thinkingUiRequestId = (this._thinkingUiRequestId || 0) + 1;
        const requestId = this._thinkingUiRequestId;

        // First check Ollama version before proceeding
        this.getOllamaVersion().then(ollamaVersion => {
            if (requestId !== this._thinkingUiRequestId) {
                return;
            }

            // If selection changed while awaiting version, ignore this stale update.
            const liveModelSelector = document.getElementById('model-selector');
            const liveModel = liveModelSelector ? liveModelSelector.value : '';
            if (liveModel && modelName && liveModel !== modelName) {
                return;
            }

           //console.log('🔍 ChatTab: Ollama version for thinking toggle:', ollamaVersion);

            // When version fetch is temporarily unavailable, keep current UI unchanged.
            if (!ollamaVersion) {
                return;
            }

            if (!this.isVersionSupported(ollamaVersion, '0.9.0')) {
               //console.log('🚫 ChatTab: Ollama version too old for thinking feature. Requires 0.9.0+, found:', ollamaVersion);

                // Remove thinking button if it exists (version downgrade scenario)
                const existingThinkingButton = document.getElementById('thinking-toggle-btn');
                if (existingThinkingButton) {
                   //console.log('🧠 ChatTab: Removing thinking toggle button due to unsupported Ollama version');
                    existingThinkingButton.remove();
                }
                return;
            }

            // Find the correct container - look for the panel that contains the model selector
            const modelSelector = document.getElementById('model-selector');
            const existingThinkingButton = document.getElementById('thinking-toggle-btn');

            if (!modelSelector) {
                console.error('🧠 ChatTab: Model selector not found');
                return;
            }

            // Find the parent panel of the model selector or the chat tab container
            let targetContainer = modelSelector.parentElement;

            // If the model selector is directly in the chat tab, find a better insertion point
            const chatTab = document.getElementById('chat-tab');
            if (chatTab && chatTab.contains(modelSelector)) {
                // Insert after the model selector within the chat tab
                targetContainer = chatTab;
            }
            // Check if this model supports thinking
            const supportsThinking = window.isThinkingModel && window.isThinkingModel(modelName);
            // Determine base model without quant suffix for special-casing
            const baseModelForCheck = (window.getBaseModelName && window.getBaseModelName(modelName)) || (modelName || '').toLowerCase();
            // Normalize to the token before any ':' so variants like 'gpt-oss:20b' are recognized as gpt-oss
            const baseOnly = (baseModelForCheck || '').split(':')[0];
            const isGptOss = baseOnly === 'gpt-oss';
            const shouldShowThinkingUI = !!supportsThinking || isGptOss;
           //console.log('🧠 ChatTab: updateThinkingToggleUI model=', modelName, 'baseModelForCheck=', baseModelForCheck, 'baseOnly=', baseOnly, 'supportsThinking=', supportsThinking, 'isGptOss=', isGptOss);

            if (shouldShowThinkingUI && !existingThinkingButton) {
               //console.log('🧠 ChatTab: Creating thinking toggle button');

                // Create thinking toggle button
                const thinkingButton = document.createElement('button');
                thinkingButton.id = 'thinking-toggle-btn';
                thinkingButton.className = 'thinking-toggle-button';
                thinkingButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"></path>
                        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"></path>
                        <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"></path>
                        <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"></path>
                        <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"></path>
                        <path d="M3.477 10.896a4 4 0 0 1 .585-.396"></path>
                        <path d="M19.938 10.5a4 4 0 0 1 .585.396"></path>
                        <path d="M6 18a4 4 0 0 1-1.967-.516"></path>
                        <path d="M19.967 17.484A4 4 0 0 1 18 18"></path>
                    </svg>
                    <span class="thinking-toggle-text">${Lang.get('activateThinking') || 'Activate thinking'}</span>
                `;

                // Match the model selector's styling exactly with improved centering
                thinkingButton.style.cssText = `
                    height: 40px !important;
                    min-height: 40px !important;
                    max-height: 40px !important;
                    width: calc(100% - 32px) !important;
                    margin: 8px 16px !important;
                    border: 1px solid var(--border-color) !important;
                    border-radius: 6px !important;
                    background-color: var(--button-bg, #f3f4f6) !important;
                    color: var(--text-color) !important;
                    padding: 8px 12px !important;
                    font-size: 14px !important;
                    box-sizing: border-box !important;
                    line-height: 1.2 !important;
                    cursor: pointer !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 8px !important;
                    transition: all 0.2s ease !important;
                    flex-shrink: 0 !important;
                    flex-grow: 0 !important;
                    text-align: center !important;
                `;

                //  CRITICAL FIX: Load initial state BEFORE adding click handler
                if (isGptOss) {
                    // gpt-oss: always active and non-interactive
                    thinkingButton.classList.add('active');
                    thinkingButton.style.backgroundColor = 'var(--accent-color, #4f46e5)';
                    thinkingButton.style.borderColor = 'var(--accent-color, #4f46e5)';
                    thinkingButton.style.color = 'white';
                    thinkingButton.querySelector('.thinking-toggle-text').textContent =
                        Lang.get('deactivateThinking') || 'Deactivate thinking';
                    thinkingButton.disabled = true;
                    // persist the enforced state for gpt-oss only (do not overwrite global setting)
                    if (window.ThinkingState && typeof window.ThinkingState.setGptOssThinkingEnabled === 'function') {
                        window.ThinkingState.setGptOssThinkingEnabled(true);
                    } else {
                        localStorage.setItem('thinkingEnabledGptOss', 'true');
                    }
                    // mark that no click handler should be attached
                    thinkingButton._thinkingClickHandler = null;
                } else {
                    const thinkingEnabled = (window.ThinkingState && typeof window.ThinkingState.getEffectiveThinkingEnabled === 'function')
                        ? window.ThinkingState.getEffectiveThinkingEnabled()
                        : (window.ThinkingState && typeof window.ThinkingState.getEffectiveThinkingEnabled === 'function')
                            ? window.ThinkingState.getEffectiveThinkingEnabled()
                            : (localStorage.getItem('thinkingEnabled') === 'true');
                   //console.log('🧠 ChatTab: Initial thinking state from localStorage:', thinkingEnabled);

                    // Set initial visual state without triggering click
                    if (thinkingEnabled) {
                        thinkingButton.classList.add('active');
                        thinkingButton.style.backgroundColor = 'var(--accent-color, #4f46e5)';
                        thinkingButton.style.borderColor = 'var(--accent-color, #4f46e5)';
                        thinkingButton.style.color = 'white';
                        thinkingButton.querySelector('.thinking-toggle-text').textContent =
                            Lang.get('deactivateThinking') || 'Deactivate thinking';
                       //console.log('🧠 ChatTab: Set initial active state');
                    } else {
                        thinkingButton.classList.remove('active');
                        thinkingButton.style.backgroundColor = 'var(--button-bg, #f3f4f6)';
                        thinkingButton.style.borderColor = 'var(--border-color)';
                        thinkingButton.style.color = 'var(--text-color)';
                        thinkingButton.querySelector('.thinking-toggle-text').textContent =
                            Lang.get('activateThinking') || 'Activate thinking';
                       //console.log('🧠 ChatTab: Set initial inactive state');
                    }

                    // Add click handler AFTER setting initial state (named so we can remove later if needed)
                    const _thinkingHandler = function () {
                        const isActive = thinkingButton.classList.contains('active');

                        if (isActive) {
                            // Deactivate thinking
                            thinkingButton.classList.remove('active');
                            thinkingButton.style.backgroundColor = 'var(--button-bg, #f3f4f6)';
                            thinkingButton.style.borderColor = 'var(--border-color)';
                            thinkingButton.style.color = 'var(--text-color)';
                            thinkingButton.querySelector('.thinking-toggle-text').textContent =
                                Lang.get('activateThinking') || 'Activate thinking';
                            if (window.ThinkingState && typeof window.ThinkingState.setUserThinkingEnabled === 'function') {
                                window.ThinkingState.setUserThinkingEnabled(false);
                            } else {
                                if (window.ThinkingState && typeof window.ThinkingState.setUserThinkingEnabled === 'function') {
                                    window.ThinkingState.setUserThinkingEnabled(false);
                                } else {
                                    localStorage.setItem('thinkingEnabled', 'false');
                                }
                            }

                            // Dispatch custom event for same-tab updates
                            window.dispatchEvent(new CustomEvent('thinkingStateChanged', {
                                detail: { enabled: false }
                            }));
                        } else {
                            // Activate thinking
                            thinkingButton.classList.add('active');
                            thinkingButton.style.backgroundColor = 'var(--accent-color, #4f46e5)';
                            thinkingButton.style.borderColor = 'var(--accent-color, #4f46e5)';
                            thinkingButton.style.color = 'white';
                            thinkingButton.querySelector('.thinking-toggle-text').textContent =
                                Lang.get('deactivateThinking') || 'Deactivate thinking';
                            if (window.ThinkingState && typeof window.ThinkingState.setUserThinkingEnabled === 'function') {
                                window.ThinkingState.setUserThinkingEnabled(true);
                            } else {
                                if (window.ThinkingState && typeof window.ThinkingState.setUserThinkingEnabled === 'function') {
                                    window.ThinkingState.setUserThinkingEnabled(true);
                                } else {
                                    localStorage.setItem('thinkingEnabled', 'true');
                                }
                            }

                            // Dispatch custom event for same-tab updates
                            window.dispatchEvent(new CustomEvent('thinkingStateChanged', {
                                detail: { enabled: true }
                            }));
                        }
                    };

                    thinkingButton.addEventListener('click', _thinkingHandler);
                    thinkingButton._thinkingClickHandler = _thinkingHandler;
                }

                // If this is gpt-oss, create a 3-state reasoning selector (Low/Mid/High) placed before the thinking button
                if (isGptOss) {
                    // Only create if it doesn't already exist
                    let reasoningSelector = document.getElementById('gptoss-reasoning-selector');
                    if (!reasoningSelector) {
                        reasoningSelector = document.createElement('div');
                        reasoningSelector.id = 'gptoss-reasoning-selector';
                        reasoningSelector.className = 'gptoss-reasoning-selector';
                        // Minimal inline layout to match surrounding controls
                        reasoningSelector.style.cssText = 'display:flex;gap:8px;margin:8px 16px;justify-content:center;align-items:center;';

                        const levels = [
                            { id: 'low', label: Lang.get('reasoningLow') || 'Low' },
                            { id: 'mid', label: Lang.get('reasoningMid') || 'Mid' },
                            { id: 'high', label: Lang.get('reasoningHigh') || 'High' }
                        ];

                        // Load saved level or default to mid
                        const saved = localStorage.getItem('gptOssReasoningLevel') || 'mid';
                        // Mirror into a window-level quick-access variable for immediate reads
                        window.gptOssReasoningLevel = saved;

                        levels.forEach(lv => {
                            const btn = document.createElement('button');
                            btn.type = 'button';
                            btn.className = 'gptoss-reasoning-btn';
                            btn.dataset.level = lv.id;
                            btn.textContent = lv.label;
                            btn.style.cssText = 'padding:6px 10px;border-radius:6px;border:1px solid var(--border-color);background:var(--button-bg);cursor:pointer;';
                            if (lv.id === saved) {
                                btn.classList.add('active');
                                btn.style.backgroundColor = 'var(--accent-color, #4f46e5)';
                                btn.style.color = 'white';
                            }

                            btn.addEventListener('click', (event) => {
                                // Only allow interaction when gpt-oss is active
                                const current = document.getElementById('gptoss-reasoning-selector');
                                if (!current || current.style.display === 'none') return;
                                // update visuals
                                const siblings = current.querySelectorAll('.gptoss-reasoning-btn');
                                siblings.forEach(s => {
                                    s.classList.remove('active');
                                    s.style.backgroundColor = '';
                                    s.style.color = '';
                                });
                                btn.classList.add('active');
                                btn.style.backgroundColor = 'var(--accent-color, #4f46e5)';
                                btn.style.color = 'white';

                                // persist selection
                                localStorage.setItem('gptOssReasoningLevel', btn.dataset.level);
                                // mirror to quick-access global for immediate reads by OllamaAPI
                                window.gptOssReasoningLevel = btn.dataset.level;
                                // notify other in-tab listeners if needed
                                window.dispatchEvent(new CustomEvent('gptOssReasoningChanged', { detail: { level: btn.dataset.level } }));

                                // If this is a real user click (not a programmatic .click()), trigger system-prompt-change flow
                                try {
                                    if (event && event.isTrusted && window.chatInstance && typeof window.chatInstance.handleSystemPromptChange === 'function') {
                                        // Directly call the handler; the system prompt content is assembled later in buildCompleteSystemPrompt
                                        window.chatInstance.handleSystemPromptChange();
                                    }
                                } catch (e) {
                                    console.warn('ChatTab: error calling handleSystemPromptChange after reasoning change', e);
                                }
                            });

                            reasoningSelector.appendChild(btn);
                        });

                        // Insert reasoning selector before the thinking button
                        if (targetContainer === chatTab) {
                            const modelSelectorIndex = Array.from(chatTab.children).indexOf(modelSelector);
                            if (modelSelectorIndex !== -1 && modelSelectorIndex < chatTab.children.length - 1) {
                                chatTab.insertBefore(reasoningSelector, chatTab.children[modelSelectorIndex + 1]);
                            } else {
                                modelSelector.insertAdjacentElement('afterend', reasoningSelector);
                            }
                        } else {
                            modelSelector.insertAdjacentElement('afterend', reasoningSelector);
                        }
                    } else {
                        // ensure visible
                        reasoningSelector.style.display = '';
                    }
                }

                // Find the correct insertion point
                if (targetContainer === chatTab) {
                    // Insert after the model selector
                    const modelSelectorIndex = Array.from(chatTab.children).indexOf(modelSelector);
                    if (modelSelectorIndex !== -1 && modelSelectorIndex < chatTab.children.length - 1) {
                        // Insert after model selector
                        chatTab.insertBefore(thinkingButton, chatTab.children[modelSelectorIndex + 1]);
                    } else {
                        // Insert after model selector (at the end if it's the last child)
                        modelSelector.insertAdjacentElement('afterend', thinkingButton);
                    }
                } else {
                    // Insert after model selector in its parent container
                    modelSelector.insertAdjacentElement('afterend', thinkingButton);
                }

               //console.log('🧠 ChatTab: Thinking toggle button added to DOM after model selector');

            } else if (!shouldShowThinkingUI && existingThinkingButton) {
               //console.log('🧠 ChatTab: Removing thinking toggle button (model not supported)');
                existingThinkingButton.remove();
                const reasoningSelector = document.getElementById('gptoss-reasoning-selector');
                if (reasoningSelector) reasoningSelector.style.display = 'none';
            } else if (shouldShowThinkingUI && existingThinkingButton) {
               //console.log('🧠 ChatTab: Thinking toggle button already exists for supported model - updating state if needed');

                // If the selected model is gpt-oss, enforce active + disabled state
                if (isGptOss) {
                    // Remove any existing click handler to ensure it cannot be toggled
                    try {
                        if (existingThinkingButton._thinkingClickHandler) {
                            existingThinkingButton.removeEventListener('click', existingThinkingButton._thinkingClickHandler);
                            existingThinkingButton._thinkingClickHandler = null;
                        }
                    } catch (e) {
                        console.warn('ChatTab: error removing existing thinking click handler', e);
                    }

                    existingThinkingButton.classList.add('active');
                    existingThinkingButton.style.backgroundColor = 'var(--accent-color, #4f46e5)';
                    existingThinkingButton.style.borderColor = 'var(--accent-color, #4f46e5)';
                    existingThinkingButton.style.color = 'white';
                    const txt = existingThinkingButton.querySelector('.thinking-toggle-text');
                    if (txt) txt.textContent = Lang.get('deactivateThinking') || 'Deactivate thinking';
                    existingThinkingButton.disabled = true;
                    // persist the enforced state for gpt-oss only (do not overwrite global setting)
                    if (window.ThinkingState && typeof window.ThinkingState.setGptOssThinkingEnabled === 'function') {
                        window.ThinkingState.setGptOssThinkingEnabled(true);
                    } else {
                        localStorage.setItem('thinkingEnabledGptOss', 'true');
                        // Notify same-tab listeners that thinking state changed
                        window.dispatchEvent(new CustomEvent('thinkingStateChanged', { detail: { enabled: true } }));
                    }
                } else {
                    // Non-gpt-oss thinking model: ensure button is interactive and reflects stored state
                    existingThinkingButton.disabled = false;

                    // Re-attach click handler if it was previously removed
                    if (!existingThinkingButton._thinkingClickHandler) {
                        const _handler = function () {
                            const isActive = existingThinkingButton.classList.contains('active');

                            if (isActive) {
                                existingThinkingButton.classList.remove('active');
                                existingThinkingButton.style.backgroundColor = 'var(--button-bg, #f3f4f6)';
                                existingThinkingButton.style.borderColor = 'var(--border-color)';
                                existingThinkingButton.style.color = 'var(--text-color)';
                                const txt = existingThinkingButton.querySelector('.thinking-toggle-text');
                                if (txt) txt.textContent = Lang.get('activateThinking') || 'Activate thinking';
                                localStorage.setItem('thinkingEnabled', 'false');

                                window.dispatchEvent(new CustomEvent('thinkingStateChanged', { detail: { enabled: false } }));
                            } else {
                                existingThinkingButton.classList.add('active');
                                existingThinkingButton.style.backgroundColor = 'var(--accent-color, #4f46e5)';
                                existingThinkingButton.style.borderColor = 'var(--accent-color, #4f46e5)';
                                existingThinkingButton.style.color = 'white';
                                const txt = existingThinkingButton.querySelector('.thinking-toggle-text');
                                if (txt) txt.textContent = Lang.get('deactivateThinking') || 'Deactivate thinking';
                                localStorage.setItem('thinkingEnabled', 'true');

                                window.dispatchEvent(new CustomEvent('thinkingStateChanged', { detail: { enabled: true } }));
                            }
                        };

                        existingThinkingButton.addEventListener('click', _handler);
                        existingThinkingButton._thinkingClickHandler = _handler;
                    }

                    // Apply visual state from localStorage
                    const thinkingEnabledNow = (window.ThinkingState && typeof window.ThinkingState.getEffectiveThinkingEnabled === 'function')
                        ? window.ThinkingState.getEffectiveThinkingEnabled()
                        : (window.ThinkingState && typeof window.ThinkingState.getEffectiveThinkingEnabled === 'function')
                            ? window.ThinkingState.getEffectiveThinkingEnabled()
                            : (localStorage.getItem('thinkingEnabled') === 'true');
                    if (thinkingEnabledNow) {
                        existingThinkingButton.classList.add('active');
                        existingThinkingButton.style.backgroundColor = 'var(--accent-color, #4f46e5)';
                        existingThinkingButton.style.borderColor = 'var(--accent-color, #4f46e5)';
                        existingThinkingButton.style.color = 'white';
                        const txt = existingThinkingButton.querySelector('.thinking-toggle-text');
                        if (txt) txt.textContent = Lang.get('deactivateThinking') || 'Deactivate thinking';
                    } else {
                        existingThinkingButton.classList.remove('active');
                        existingThinkingButton.style.backgroundColor = 'var(--button-bg, #f3f4f6)';
                        existingThinkingButton.style.borderColor = 'var(--border-color)';
                        existingThinkingButton.style.color = 'var(--text-color)';
                        const txt = existingThinkingButton.querySelector('.thinking-toggle-text');
                        if (txt) txt.textContent = Lang.get('activateThinking') || 'Activate thinking';
                    }
                }
                // Manage the reasoning selector visibility for existing button updates
                try {
                    let reasoningSelector = document.getElementById('gptoss-reasoning-selector');
                    if (isGptOss) {
                        // show or create if missing
                        if (!reasoningSelector) {
                            // trigger a fresh UI creation by calling updateThinkingToggleUI again after a small delay
                            setTimeout(() => this.updateThinkingToggleUI(modelName), 50);
                        } else {
                            reasoningSelector.style.display = '';
                            // ensure a saved default exists
                            if (!localStorage.getItem('gptOssReasoningLevel')) {
                                // Programmatic initialization: set default to mid without firing user-only handlers
                                localStorage.setItem('gptOssReasoningLevel', 'mid');
                                // update visuals
                                const btn = reasoningSelector.querySelector('.gptoss-reasoning-btn[data-level="mid"]');
                                if (btn) {
                                    const siblings = reasoningSelector.querySelectorAll('.gptoss-reasoning-btn');
                                    siblings.forEach(s => { s.classList.remove('active'); s.style.backgroundColor = ''; s.style.color = ''; });
                                    btn.classList.add('active');
                                    btn.style.backgroundColor = 'var(--accent-color, #4f46e5)';
                                    btn.style.color = 'white';
                                    window.gptOssReasoningLevel = 'mid';
                                    window.dispatchEvent(new CustomEvent('gptOssReasoningChanged', { detail: { level: 'mid' } }));
                                }
                            }
                        }
                    } else {
                        // hide if present
                        if (reasoningSelector) reasoningSelector.style.display = 'none';
                    }
                } catch (e) {
                    console.warn('ChatTab: error managing gpt-oss reasoning selector visibility', e);
                }
            } else {
               //console.log('🧠 ChatTab: Model does not support thinking, no button needed');
            }
        }).catch(error => {
            console.error('🔍 ChatTab: Error checking Ollama version for thinking toggle:', error);
        });
    }

    // Sets up all event listeners for UI controls, including prompt, context, and web search.
    setupEventListeners() {
        const contextSelector = document.getElementById('context-selector');
        const saveButton = document.getElementById('save-prompt');
        const systemPrompt = document.getElementById('system-prompt');
        const aiReplies = document.querySelector('.ai-replies');
        // Insights toggle
        document.querySelectorAll('.toggle-option').forEach(button => {
            // First, remove any existing click handlers to avoid multiple bindings
            if (button._insightsToggleHandler) {
                button.removeEventListener('click', button._insightsToggleHandler);
            }

            // Create a simple click handler with explicit binding
            button._insightsToggleHandler = function (event) {
                if (event) event.preventDefault();

                // Log the click explicitly
               //console.log('TOGGLE CLICKED:', this.getAttribute('data-value'));

                // Get state of clicked button
                const isToggleOn = this.getAttribute('data-value') === 'on';

                // Always update both buttons immediately in the UI
                document.querySelectorAll('.toggle-option').forEach(b => {
                    if (b === this) {
                        b.classList.add('active');
                    } else {
                        b.classList.remove('active');
                    }
                });

                // Update localStorage state - this now only controls DISPLAY, not loading
                localStorage.setItem('insightsEnabled', isToggleOn);

                // Get references to required elements
                const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                const systemPrompt = document.getElementById('system-prompt');

                // Process the insights toggle change in a separate async function
                // to avoid issues with 'this' binding in async functions
                this._processInsightsToggle(isToggleOn, hashedMasterKey, systemPrompt);
            };

            // Add a helper method to process the insights
            button._processInsightsToggle = async function (isToggleOn, hashedMasterKey, systemPrompt) {
                // Process the insights toggle change
                if (window.chat && systemPrompt) {
                    try {
                        // Save the setting to the database FIRST
                        await PaiperworkDB.saveInsightsEnabled(hashedMasterKey, isToggleOn);
                       //console.log('INSIGHTS TOGGLE: State saved to database:', isToggleOn);

                        // CORRECTED LOGIC: This toggle ONLY controls whether insights are included in system prompts
                        // Insights are ALWAYS loaded from the database - this just controls their USAGE
                        if (isToggleOn) {
                           //console.log('INSIGHTS TOGGLE: Insights collection ON');
                        } else {
                           //console.log('INSIGHTS TOGGLE: Insights collection OFF');
                        }

                        // The actual inclusion/exclusion of insights happens in OllamaAPI.buildCompleteSystemPrompt()
                        // This toggle just saves the preference - no other action needed here

                    } catch (error) {
                        console.error('INSIGHTS TOGGLE: Error processing insights toggle:', error);
                    }
                } else {
                    console.error('INSIGHTS TOGGLE: Chat instance or system prompt not available');
                }
            };

            // Add the click event handler with proper binding
            button.addEventListener('click', button._insightsToggleHandler);
        });

        if (saveButton && systemPrompt) {
            // Enable save button when system prompt changes
            this._originalSystemPrompt = systemPrompt.value;

            systemPrompt.addEventListener('input', () => {
                saveButton.disabled = false;
            });


            systemPrompt.addEventListener('focus', () => {
                // Only store it the first time it gets focus in a session
                if (this._originalSystemPrompt === undefined) {
                    this._originalSystemPrompt = systemPrompt.value;
                   //console.log('ChatTab: Original system prompt stored:', this._originalSystemPrompt);
                }
            });
            // Save system prompt
            saveButton.addEventListener('click', async () => {
                const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                const newSystemPrompt = systemPrompt.value;
                const aiReplies = document.querySelector('.ai-replies');

                // First check if there are any messages to continue from
                const assistantMessages = aiReplies.querySelectorAll('.assistant-message');
                const userMessages = aiReplies.querySelectorAll('.user-message');

                // Check if there's an active conversation context
                // This means the user has actually talked with the AI in this session
                const hasActiveContext = OllamaAPI.previousContext !== null &&
                    OllamaAPI.previousContext !== undefined;

               //console.log('ChatTab: Active conversation context exists:', hasActiveContext);

                // Only show warning and add continue button if there's an active conversation
                if (assistantMessages.length > 0 && window.chat && hasActiveContext) {
                    // Show warning with improved message about continue button
                    const confirmed = confirm(
                        Lang.get('systemPromptChangeWarningWithContinue') ||
                        'Changing the system prompt will reset the conversation context. A "Continue Conversation" button will be added so you can continue with the new system prompt. Proceed?'
                    );

                    if (!confirmed) {
                        // User canceled - restore the original prompt
                        systemPrompt.value = settings.systemPrompt || '';
                       //console.log('ChatTab: System prompt change canceled, reverting to:', systemPrompt.value);
                        saveButton.disabled = true; // Disable save button since we're back to original
                        return;
                    }

                    // Proceed with saving and reset context
                    await PaiperworkDB.saveSystemPrompt(hashedMasterKey, newSystemPrompt);
                    saveButton.disabled = true;

                    // Reset the context
                    OllamaAPI.resetContext();
                   //console.log('ChatTab: Context reset due to system prompt change');

                    // Build conversation history in the format OllamaAPI expects
                    const conversations = [];

                    // Extract all conversations from the UI
                    for (let i = 0; i < Math.min(userMessages.length, assistantMessages.length); i++) {
                        const userMessage = userMessages[i].querySelector('.message-bubble')?.innerHTML;
                        const assistantMessage = assistantMessages[i].querySelector('.ai-response-container')?.innerHTML;

                        if (userMessage) {
                            conversations.push({
                                role: 'user',
                                message: userMessage,
                                timestamp: Date.now() - (userMessages.length - i) * 60000 // Approximate timestamp
                            });
                        }

                        if (assistantMessage) {
                            conversations.push({
                                role: 'assistant',
                                message: assistantMessage,
                                timestamp: Date.now() - (assistantMessages.length - i) * 60000 // Approximate timestamp
                            });
                        }
                    }

                    // Create continue button if we have conversations
                    if (conversations.length > 0) {
                        // Remove any existing continue buttons first
                        const existingButtons = aiReplies.querySelectorAll('.continuation-container');
                        existingButtons.forEach(button => button.remove());

                        // First check if we already have one, otherwise determine from conversations
                        if (!window.currentConversationGroup) {
                            // Try to determine group from the last message in the conversation history
                            // This assumes all messages in the current UI are from the same group
                            const lastAssistantMessage = conversations.filter(c => c.role === 'assistant').pop();
                            if (lastAssistantMessage && lastAssistantMessage.conversation_group) {
                                window.currentConversationGroup = lastAssistantMessage.conversation_group;
                            } else {
                                // Fallback to group 1 if we can't determine the group
                                window.currentConversationGroup = 1;
                            }
                           //console.log('ChatTab: Setting currentConversationGroup =', window.currentConversationGroup);
                        }

                        // Create the continue button using OllamaAPI's method
                        const continueButton = OllamaAPI.createContinueButton(conversations, aiReplies);




                        // Find the actual button element inside the container
                        const actualButton = continueButton.querySelector('.continue-btn');



                        // Make sure the container is appended to the chat area
                        if (!continueButton.parentElement) {
                            aiReplies.appendChild(continueButton);
                           //console.log('ChatTab: Continue button appended directly to chat area');
                        }

                        // Ensure it's visible by scrolling to it
                        setTimeout(() => {
                            continueButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                    }
                } else {
                    // No conversation yet, just save without warning
                    await PaiperworkDB.saveSystemPrompt(hashedMasterKey, newSystemPrompt);
                    saveButton.disabled = true;
                    OllamaAPI.resetContext();
                }
            });
        }


        // Create new handler with context warning and manual selection saving
        contextSelector._changeHandler = async (event) => {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            const newContextSize = contextSelector.value;
            const modelSelector = document.getElementById('model-selector');
            const aiReplies = document.querySelector('.ai-replies');

            // Save manual context selection for the current model using the new class
            if (modelSelector && modelSelector.value && hashedMasterKey) {
                const selectedModel = modelSelector.value;
                const kvcacheCheckbox = document.getElementById('kvcache-q8-checkbox');
                const isKvcacheQ8 = kvcacheCheckbox ? kvcacheCheckbox.checked : false;

               //console.log(`🔧 ChatTab: User manually selected context ${newContextSize} for ${selectedModel}`);

                // vramramcalculator removed: save directly to PaiperworkDB
                await PaiperworkDB.saveModelContextSize(hashedMasterKey, selectedModel, parseInt(newContextSize), isKvcacheQ8, false);

               //console.log(`✅ ChatTab: Saved MANUAL context size ${newContextSize} for model ${selectedModel}`);
            }

            // First check if there are any messages to continue from
            const assistantMessages = aiReplies.querySelectorAll('.assistant-message');
            const userMessages = aiReplies.querySelectorAll('.user-message');

            // Check if there's an active conversation context
            const hasActiveContext = OllamaAPI.previousContext !== null &&
                OllamaAPI.previousContext !== undefined;

            // Only show warning and add continue button if there's an active conversation
            if (assistantMessages.length > 0 && window.chat && hasActiveContext) {
                // Store the previous value to revert if user cancels
                const previousValue = contextSelector._previousValue || '8192';

                // Show warning with improved message about continue button
                const confirmed = confirm(
                    Lang.get('contextSizeChangeWarningWithContinue') ||
                    'Changing the context size will reset the conversation context. A "Continue Conversation" button will be added so you can continue with the new context size. Proceed?'
                );

                if (!confirmed) {
                    // User canceled - restore the original value
                    contextSelector.value = previousValue;
                   //console.log('ChatTab: Context size change canceled, reverting to:', previousValue);
                    return;
                }

                // Proceed with saving and reset context
                contextSelector._previousValue = newContextSize;
                localStorage.setItem('contextSize', newContextSize);
                await PaiperworkDB.saveContextSize(hashedMasterKey, newContextSize);

                // Reset the context
                OllamaAPI.previousContext = null;
                OllamaAPI.resetContext();
               //console.log('ChatTab: Context reset due to context size change');

                // Build conversation history in the format OllamaAPI expects
                const conversations = [];

                // Extract all conversations from the UI
                for (let i = 0; i < Math.min(userMessages.length, assistantMessages.length); i++) {
                    const userMessage = userMessages[i].querySelector('.message-bubble')?.innerHTML;
                    const assistantMessage = assistantMessages[i].querySelector('.ai-response-container')?.innerHTML;

                    if (userMessage) {
                        conversations.push({
                            role: 'user',
                            message: userMessage,
                            timestamp: Date.now() - (userMessages.length - i) * 60000
                        });
                    }

                    if (assistantMessage) {
                        conversations.push({
                            role: 'assistant',
                            message: assistantMessage,
                            timestamp: Date.now() - (assistantMessages.length - i) * 60000
                        });
                    }
                }

                // Skip adding continue button when only the welcome message exists in the UI
                const assistantMessagesAllHistory = aiReplies.querySelectorAll('.assistant-message');
                const hasOnlyWelcomeHistory = (assistantMessagesAllHistory.length === 1 && assistantMessagesAllHistory[0].classList.contains('welcome-message'));

                if (conversations.length > 0 && !hasOnlyWelcomeHistory) {
                    // Remove any existing continue buttons first
                    const existingButtons = aiReplies.querySelectorAll('.continuation-container');
                    existingButtons.forEach(button => button.remove());

                    // Create the continue button using OllamaAPI's method
                    const continueButton = OllamaAPI.createContinueButton(conversations, aiReplies);

                    // Make sure the container is appended to the chat area
                    if (!continueButton.parentElement) {
                        aiReplies.appendChild(continueButton);
                    }

                    // Ensure it's visible by scrolling to it
                    setTimeout(() => {
                        continueButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                }
            } else {
                // No active conversation yet, just save without warning
                contextSelector._previousValue = newContextSize;
                localStorage.setItem('contextSize', newContextSize);
                await PaiperworkDB.saveContextSize(hashedMasterKey, newContextSize);

                // Reset context for next message
                OllamaAPI.previousContext = null;
                OllamaAPI.resetContext();
            }
        };
        if (contextSelector) {
            // Remove any existing handler first to avoid duplicates
            if (contextSelector._previousChangeHandler) {
                contextSelector.removeEventListener('change', contextSelector._previousChangeHandler);
            }

            // Save reference to the current handler for future cleanup
            contextSelector._previousChangeHandler = contextSelector._changeHandler;

            // Attach the event handler
            contextSelector.addEventListener('change', contextSelector._changeHandler);
           //console.log('ChatTab: Context selector change handler attached');
        }
        // Web search button
        const webButton = document.getElementById('web-search');
        if (webButton) {
            webButton.addEventListener('click', async () => {
                // Check the current state before toggling
                const isActivating = !webButton.classList.contains('active');

                if (isActivating) {
                    // Load web search scripts if needed
                    if (typeof window.WebSearch === 'undefined') {
                        try {
                            // Show loading state
                            webButton.disabled = true;
                            webButton.classList.add('loading');
                            webButton.textContent = 'Loading...';

                            // Load the WebSearch module
                            await window.tabLoader.loadFeatureScripts('websearch');

                            // Wait a moment to ensure scripts are initialized
                            await new Promise(resolve => setTimeout(resolve, 100));

                            // Initialize WebSearch if needed
                            if (window.WebSearch && window.WebSearch.initializeWebSearchReferences) {
                                window.WebSearch.initializeWebSearchReferences();
                            }

                            // Restore button state
                            webButton.disabled = false;
                            webButton.classList.remove('loading');
                            webButton.textContent = Lang.get('webButton') || 'Web';

                           //console.log('WebSearch module loaded successfully');
                        } catch (error) {
                            console.error('Failed to load WebSearch module:', error);
                            alert('Failed to load web search functionality. Please try again.');

                            // Restore button state without activating
                            webButton.disabled = false;
                            webButton.classList.remove('loading');
                            webButton.textContent = Lang.get('webButton') || 'Web';
                            return; // Don't proceed with activation
                        }
                    }
                }

                // Toggle the class
                webButton.classList.toggle('active');

                // Web search was deactivated, add continue button if needed (deactivated for now)
                if (!isActivating) {
                }
            });
        }

        // Handle send button and prompt input
        const sendButton = document.getElementById('send-prompt');
        const promptInput = document.getElementById('prompt-input');

        if (sendButton && promptInput) {
            // Clean up any existing handlers first
            if (this._sendClickHandler) {
                sendButton.removeEventListener('click', this._sendClickHandler);
            }

            // Create a bound handler and save reference for cleanup
            this._sendClickHandler = this.handleSendButtonClick.bind(this);
            sendButton.addEventListener('click', this._sendClickHandler, { capture: true });

            // Do the same for the keydown handler
            if (this._keydownHandler) {
                promptInput.removeEventListener('keydown', this._keydownHandler);
            }

            this._keydownHandler = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    // Call handler directly instead of triggering click
                    this.handleSendButtonClick(e);
                }
            };

            promptInput.addEventListener('keydown', this._keydownHandler, { capture: true });
        }

    }

    // Loads master key-specific settings (system prompt, model, context, insights) from the database.
    async loadMasterKeyData(hashedMasterKey) {
       //console.log('ChatTab: Loading masterkey data for', hashedMasterKey);
        try {
            // Load settings from database
            const settings = await PaiperworkDB.loadSettings(hashedMasterKey);

            if (settings) {
                // Load system prompt
                const systemPrompt = document.getElementById('system-prompt');
                if (systemPrompt && settings.systemPrompt) {
                    systemPrompt.value = settings.systemPrompt;
                    this._originalSystemPrompt = settings.systemPrompt;
                }

                // Set insights enabled state
                if (settings.insights_enabled !== undefined) {
                    const insightsEnabled = settings.insights_enabled === 'true';
                    localStorage.setItem('insightsEnabled', insightsEnabled.toString());

                    // Update toggle UI
                    document.querySelectorAll('.toggle-option').forEach(btn => {
                        const isOn = btn.getAttribute('data-value') === 'on';
                        if ((isOn && insightsEnabled) || (!isOn && !insightsEnabled)) {
                            btn.classList.add('active');
                        } else {
                            btn.classList.remove('active');
                        }
                    });
                }

                settings.model = await PaiperworkDB.normalizeStoredStringValue(settings.model, hashedMasterKey);
                settings.modelProvider = String(await PaiperworkDB.normalizeStoredStringValue(settings.modelProvider, hashedMasterKey) || settings.modelProvider || '').trim();

                if (settings.model) {
                    try {
                        const modelSelector = document.getElementById('model-selector');
                        if (modelSelector) {
                            // Clear existing options first
                            modelSelector.innerHTML = `<option value="">${Lang.get('selectModel')}</option>`;

                            // Load available models
                           //console.log('ChatTab: Loading available Ollama models');
                            const modelsLoaded = await OllamaAPI.loadOllamaModels();
                            if (!modelsLoaded) {
                                console.warn('ChatTab: Skipping saved-model restore because model list failed to load');
                                return;
                            }

                            const persistedProvider = await PaiperworkDB.readNormalizedLocalStorageValue('selectedModelProvider', hashedMasterKey);

                            const desiredProvider = (settings.modelProvider && String(settings.modelProvider).trim())
                                ? String(settings.modelProvider).trim().toLowerCase()
                                : (persistedProvider
                                    ? String(persistedProvider).trim().toLowerCase()
                                    : ((window.OllamaAPI && typeof window.OllamaAPI.getModelSource === 'function')
                                        ? (window.OllamaAPI.getModelSource(settings.model) || 'local')
                                        : 'local'));

                            const exactProviderOption = Array.from(modelSelector.options).find(option =>
                                option.value === settings.model &&
                                option.dataset &&
                                option.dataset.provider === desiredProvider
                            );

                            const modelExists = !!exactProviderOption || Array.from(modelSelector.options)
                                .some(option => option.value === settings.model);

                            if (modelExists) {
                                if (exactProviderOption) {
                                    modelSelector.value = exactProviderOption.value;
                                    modelSelector.selectedIndex = exactProviderOption.index;
                                } else {
                                    modelSelector.value = settings.model;
                                }
                               //console.log('ChatTab: Successfully set model to:', settings.model);
                                this.updateContextCardsVisibility(modelSelector.value || settings.model);

                                // IMPORTANT: Check if this is a visual model after loading
                                await OllamaAPI.loadVisualModels(); // Ensure visual models are loaded
                               //console.log('ChatTab: Checking if saved model is visual:', modelSelector.value || settings.model);
                                this.updateVisualModelUI(modelSelector.value || settings.model);

                                //  NEW: Load model-specific context after setting the model
                               //console.log('🚀 ChatTab: App startup - loading context for model:', settings.model);
                                const contextSelector = document.getElementById('context-selector');
                                if (contextSelector) {
                                    await this.loadAndSetModelContext(hashedMasterKey, settings.model, contextSelector);
                                }
                            } else {
                                // Check if this was a recently deleted model
                                const lastDeletedModel = sessionStorage.getItem('lastDeletedModel');
                                if (lastDeletedModel && lastDeletedModel === settings.model) {
                                    alert(Lang.get('modelDeleted').replace('{model}', settings.model));
                                    sessionStorage.removeItem('lastDeletedModel');
                                }
                                await PaiperworkDB.saveModel(hashedMasterKey, '');
                                console.warn('ChatTab: Previously selected model not found:', settings.model);
                            }
                        }
                    } catch (error) {
                        console.error('ChatTab: Error loading models:', error);
                    }
                } else {
                    // Still load the models even if none was previously selected
                    try {
                        const modelSelector = document.getElementById('model-selector');
                        if (modelSelector) {
                            // Clear existing options
                            modelSelector.innerHTML = `<option value="">${Lang.get('selectModel')}</option>`;

                            // Load available models
                           //console.log('ChatTab: Loading available Ollama models without preselection');
                            await OllamaAPI.loadOllamaModels();
                            this.updateContextCardsVisibility(modelSelector.value || '');
                            
                        }
                    } catch (error) {
                        console.error('ChatTab: Error loading models without preselection:', error);
                    }
                }

                // Set context size - but only if we didn't load model-specific context above
                if (settings.contextSize && !settings.model) {
                    // Only set general context size if no model was loaded (which would have set its own context)
                    localStorage.setItem('contextSize', settings.contextSize);
                    const contextSelector = document.getElementById('context-selector');
                    if (contextSelector) {
                        contextSelector.value = settings.contextSize;
                    }
                } else if (settings.contextSize && settings.model) {
                    // If we have both a model and context size, but model-specific loading didn't work,
                    // fall back to the saved context size
                    const contextSelector = document.getElementById('context-selector');
                    if (contextSelector && !contextSelector.value) {
                        localStorage.setItem('contextSize', settings.contextSize);
                        contextSelector.value = settings.contextSize;
                    }
                }

                // Update masterkey name display
                const masterkeyLabel = document.getElementById('masterkey-label');
                if (masterkeyLabel) {
                    // Get the hashedMasterKey for decryption
                    const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                    const encryptedMasterKeyStr = sessionStorage.getItem('encryptedMasterKey');

                    if (encryptedMasterKeyStr && hashedMasterKey) {
                        try {
                            const encryptedMasterKey = JSON.parse(encryptedMasterKeyStr);

                            // Decrypt the master key
                            PaiperworkDB.decrypt(hashedMasterKey, encryptedMasterKey)
                                .then(decryptedMasterKey => {
                                    // Store the actual master key for toggle functionality
                                    const actualMasterKey = decryptedMasterKey;
                                    const maskedMasterKey = '•'.repeat(Math.min(actualMasterKey.length, 12));

                                    // Set initial state (masked)
                                    masterkeyLabel.textContent = `${Lang.get('masterkeyLabel')}: ${maskedMasterKey}`;
                                    masterkeyLabel.style.cursor = 'pointer';
                                    masterkeyLabel.style.userSelect = 'none';
                                    masterkeyLabel.title = Lang.get('clickToShowMasterKey');

                                    // Add click functionality
                                    let isVisible = false;
                                    masterkeyLabel.addEventListener('click', () => {
                                        if (isVisible) {
                                            // Hide the master key
                                            masterkeyLabel.textContent = `${Lang.get('masterkeyLabel')}: ${maskedMasterKey}`;
                                            isVisible = false;
                                        } else {
                                            // Show the master key
                                            masterkeyLabel.textContent = `${Lang.get('masterkeyLabel')}: ${actualMasterKey}`;
                                            isVisible = true;

                                            // Hide it again after 3 seconds
                                            setTimeout(() => {
                                                if (isVisible) {
                                                    masterkeyLabel.textContent = `${Lang.get('masterkeyLabel')}: ${maskedMasterKey}`;
                                                    isVisible = false;
                                                }
                                            }, 3000);
                                        }
                                    });
                                })
                                .catch(error => {
                                    console.error('Error decrypting masterkey name:', error);
                                    masterkeyLabel.textContent = `${Lang.get('masterkeyLabel')}: Default`;
                                    masterkeyLabel.style.cursor = 'default';
                                    masterkeyLabel.style.userSelect = 'auto';
                                    masterkeyLabel.title = '';
                                });
                        } catch (error) {
                            console.error('Error parsing encrypted masterkey:', error);
                            masterkeyLabel.textContent = `${Lang.get('masterkeyLabel')}: Default`;
                        }
                    } else {
                        // No encrypted master key found
                        masterkeyLabel.textContent = `${Lang.get('masterkeyLabel')}: Default`;
                    }
                }
            }
        } catch (error) {
            console.error('ChatTab: Error loading masterkey data:', error);
        }
    }

    // Loads and sets the context size for a specific model, using the calculator if available.
    async loadAndSetModelContext(hashedMasterKey, modelName, contextSelector) {
       //console.log('🔄 ChatTab: Loading and setting context for model:', modelName);

        if (!contextSelector) {
            console.error('❌ ChatTab: Context selector not found');
            return;
        }

        try {
            // vramramcalculator removed: use saved context size as fallback
            const savedSize = localStorage.getItem('contextSize') || '8192';
            contextSelector.value = savedSize;
            // Also fetch and display native model context if available
            try {
                if (modelName) {
                    await this.refreshModelMaximumContextLabel(modelName);
                }
            } catch (err) {
                console.warn('ChatTab: Error fetching model metadata during loadAndSetModelContext', err);
            }
        } catch (error) {
            console.error('❌ ChatTab: Error in loadAndSetModelContext:', error);
            const savedSize = localStorage.getItem('contextSize') || '8192';
            contextSelector.value = savedSize;
        }
    }

    // Handles the send button click, including debouncing, validation, and delegating to Chat.
    async handleSendButtonClick(event) {
        // Use event-based debouncing - mark this event as handled
        if (event && event._handledByChattab) {
            return;
        }

        if (event) {
            event._handledByChattab = true;
            event.stopImmediatePropagation();
        }

        const sendButton = document.getElementById('send-prompt');
        const promptInput = document.getElementById('prompt-input');
        const modelSelector = document.getElementById('model-selector');
        const imageButton = document.getElementById('image-button');

        // IMPORTANT: Handle cancel state first and directly
        if (window.isGenerating || (sendButton && sendButton.classList.contains('cancel-state'))) {
            if (window.chat) {
                window.chat.cancelOllamaGeneration();

                // ADDED: Reset image button state if we're cancelling during a continuation 
                // and we don't have any new images loaded in the current session
                if (imageButton && !window.newImagesAdded) {
                    // Reset image button state
                    imageButton.classList.remove('active');
                    imageButton.style.backgroundColor = '#404040'; // Reset to default color
                    imageButton.style.color = 'white';
                    imageButton.style.transform = 'none';
                    imageButton.style.boxShadow = 'none';

                    // Remove any image count badge
                    const badge = imageButton.querySelector('.image-count-badge');
                    if (badge) badge.remove();

                    // Also reset the image data variables
                    window.selectedImage = null;
                    window.cleanedImageBase64 = null;
                    window.selectedImages = [];
                    window.cleanedImageBase64Array = [];

                   //console.log('ChatTab: Reset image button state on cancellation');
                }
            } else {
                // Fallback if no chat instance
                if (window.cancelOllamaGeneration) {
                    window.cancelOllamaGeneration();
                }
            }
            return;
        }
        // For normal sending, require a prompt and model
        if (!modelSelector || !modelSelector.value) {
            alert(Lang.get('selectModelPrompt'));
            return;
        }

        const prompt = promptInput?.value?.trim();
        if (!prompt) {
            return;
        }

        // Cloud workflow gate: require a stored API key before sending.
        const selectedProvider = (window.OllamaAPI && typeof window.OllamaAPI.getSelectedModelSource === 'function')
            ? (window.OllamaAPI.getSelectedModelSource() || 'local')
            : 'local';
        if (selectedProvider === 'cloud') {
            const hasCloudKey = await this.ensureCloudApiKeyForSend();
            if (!hasCloudKey) {
                return;
            }
        }

        // --- Temporary thinking toggle for gpt-oss ---
        // If the selected model is a gpt-oss model, and thinking is currently disabled,
        // enable it temporarily in localStorage so streamprocessor can show native thinking
        // UI. We'll restore the previous values after the send finishes.
        const modelVal = modelSelector?.value || '';
        const isGptOss = modelVal.toLowerCase().includes('gpt-oss') || modelVal.toLowerCase().startsWith('gpt-oss');
        let _prevThinking = null;
        let _prevThinkingGptOss = null;
        let _weToggledThinking = false;
        if (isGptOss) {
            try {
                _prevThinking = localStorage.getItem('thinkingEnabled');
                _prevThinkingGptOss = localStorage.getItem('thinkingEnabledGptOss');

                const globalEnabled = _prevThinking === 'true';
                const gptOssEnabled = _prevThinkingGptOss === 'true';

                // If global thinking is disabled, enable the global flag so all
                // request-prep code paths notice it. We don't rely on the per-model
                // flag (it may be hardcoded true) — ensuring the global key is set
                // makes the behavior visible to components that only read `thinkingEnabled`.
                if (!globalEnabled) {
                    try {
                        localStorage.setItem('thinkingEnabled', 'true');
                        // also ensure the per-model flag is present to be explicit
                        localStorage.setItem('thinkingEnabledGptOss', 'true');
                    } catch (e) {
                        // ignore storage set errors
                    }
                    // record that we changed it so we can restore after send
                    _weToggledThinking = true;
                   //console.log('ChatTab: Temporarily enabled thinkingEnabled (and thinkingEnabledGptOss) for gpt-oss send');

                    // Dispatch a custom event so in-tab listeners (StreamProcessor, others)
                    // update their cached thinking state immediately.
                    try {
                        const ev = new CustomEvent('thinkingStateChanged', { detail: { enabled: true } });
                        window.dispatchEvent(ev);
                    } catch (err) {
                        // ignore if CustomEvent or dispatch fails in some environments
                    }
                }
            } catch (err) {
                console.warn('ChatTab: Error toggling thinking flags for gpt-oss', err);
            }
        }

        // Set this on the chat object to use - don't call its handler directly
        if (window.chat) {
            try {
                // Use a direct method call to send the message
                await window.chat.handleSendButtonClick();
            } catch (error) {
                console.error('Error sending message:', error);
                // alert(Lang.get('errorSendingMessage'));
            } finally {
                // Restore any thinking flags we changed for gpt-oss
                if (isGptOss && _weToggledThinking) {
                    try {
                        // Restore per-model key
                        if (_prevThinkingGptOss === null) {
                            localStorage.removeItem('thinkingEnabledGptOss');
                        } else {
                            localStorage.setItem('thinkingEnabledGptOss', _prevThinkingGptOss);
                        }
                        // Restore global key
                        if (_prevThinking === null) {
                            localStorage.removeItem('thinkingEnabled');
                        } else {
                            localStorage.setItem('thinkingEnabled', _prevThinking);
                        }

                        // Dispatch event to notify listeners the thinking state changed
                        try {
                            const prevEnabled = (_prevThinking === 'true') || (_prevThinkingGptOss === 'true');
                            const ev = new CustomEvent('thinkingStateChanged', { detail: { enabled: !!prevEnabled } });
                            window.dispatchEvent(ev);
                        } catch (err) {
                            // ignore
                        }

                       //console.log('ChatTab: Restored thinkingEnabled and thinkingEnabledGptOss after gpt-oss send');
                    } catch (err) {
                        console.warn('ChatTab: Error restoring thinking flags for gpt-oss', err);
                    }
                }
            }
        } else {
            console.error('ChatTab: Chat instance not available');
            alert(Lang.get('errorChatNotInitialized'));
        }
    }

    async ensureCloudApiKeyForSend() {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!hashedMasterKey) return false;

        try {
            if (window.__paiperworkDbBootPromise && typeof window.__paiperworkDbBootPromise.then === 'function') {
                await window.__paiperworkDbBootPromise;
            }
        } catch (bootErr) {
            console.warn('[CloudAuth] DB boot promise wait failed', bootErr);
        }

        try {
            if (PaiperworkDB && typeof PaiperworkDB.initializeDatabase === 'function') {
                await PaiperworkDB.initializeDatabase(hashedMasterKey);
            }
        } catch (initErr) {
            console.warn('[CloudAuth] DB init before key read failed', initErr);
        }

        let existingApiKey = '';
        for (let attempt = 0; attempt < 3; attempt++) {
            existingApiKey = this.normalizeCloudApiKey(await PaiperworkDB.getOllamaApiKey(hashedMasterKey));
            if (existingApiKey) {
                break;
            }
            if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 150));
            }
        }

        // Send-time gate should only require key presence.
        // If a key already exists in DB, do not reopen the required-key modal.
        if (existingApiKey) {
            return true;
        }

        if (!existingApiKey) {
            const saved = await this.openOllamaApiKeyManager(true);
            if (!saved) {
                alert((Lang.get && Lang.get('ollamaApiKeyRequired')) || 'An Ollama API key is required to use cloud models.');
                return false;
            }
            existingApiKey = this.normalizeCloudApiKey(await PaiperworkDB.getOllamaApiKey(hashedMasterKey));
        }

        return !!existingApiKey;
    }

    normalizeCloudApiKey(rawKey) {
        const key = String(rawKey || '').trim();
        if (!key) return '';
        return key
            .replace(/^(?:Bearer\s+)+/i, '')
            .replace(/^['"]+|['"]+$/g, '')
            .trim();
    }

    async validateCloudApiKey(apiKey) {
        const normalized = this.normalizeCloudApiKey(apiKey);
        if (!normalized) {
            return {
                isValid: false,
                definitiveInvalid: true,
                status: null,
                reason: 'empty-key'
            };
        }

        try {
            const selectedModel = document.getElementById('model-selector')?.value || '';
            const routing = (window.OllamaAPI && typeof window.OllamaAPI.getApiRoutingForModel === 'function')
                ? await window.OllamaAPI.getApiRoutingForModel(selectedModel)
                : null;
            const modelName = routing?.modelName || selectedModel;

            const runValidationAttempt = async (attemptNo) => {
                const controller = new AbortController();
                const timeoutMs = 20000;
                const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                try {
                    // Validate against the same endpoint style used by real sends.
                    const response = await fetch('/api/cloud/generate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${normalized}`
                        },
                        body: JSON.stringify({
                            model: modelName,
                            stream: false,
                            prompt: 'ping'
                        }),
                        signal: controller.signal
                    });

                    const definitiveInvalid = response.status === 401 || response.status === 403;
                    const isRateLimited = response.status === 429;
                    const result = {
                        isValid: response.ok,
                        definitiveInvalid,
                        status: response.status,
                        reason: response.ok
                            ? 'ok'
                            : (definitiveInvalid
                                ? 'unauthorized'
                                : (isRateLimited ? 'rate-limit' : 'non-auth-status'))
                    };

                    if (isRateLimited) {
                        console.warn('[CloudAuth] validateCloudApiKey rate-limited (429)', {
                            modelName: modelName || '<empty>',
                            attempt: attemptNo,
                            message: (window.Lang && typeof Lang.get === 'function' && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached (429).'
                        });
                    }

                    console.info('[CloudAuth] validateCloudApiKey result', {
                        status: response.status,
                        ok: response.ok,
                        modelName: modelName || '<empty>',
                        normalizedKeyLooksBearerPrefixed: /^Bearer\s+/i.test(normalized),
                        attempt: attemptNo,
                        reason: result.reason
                    });

                    return result;
                } catch (error) {
                    const isAbort = error && error.name === 'AbortError';
                    const result = {
                        isValid: false,
                        definitiveInvalid: false,
                        status: null,
                        reason: isAbort ? 'timeout' : 'network-error'
                    };

                    console.warn('[CloudAuth] validateCloudApiKey transient failure', {
                        modelName: modelName || '<empty>',
                        attempt: attemptNo,
                        reason: result.reason,
                        error: error?.message || String(error)
                    });

                    return result;
                } finally {
                    clearTimeout(timeoutId);
                }
            };

            const firstAttempt = await runValidationAttempt(1);
            if (firstAttempt.isValid || firstAttempt.definitiveInvalid) {
                return firstAttempt;
            }

            // Transient path: retry once before deciding.
            await new Promise(resolve => setTimeout(resolve, 350));
            const secondAttempt = await runValidationAttempt(2);
            if (secondAttempt.isValid || secondAttempt.definitiveInvalid) {
                return secondAttempt;
            }

            // If both attempts are transient/non-auth failures, don't block send with "invalid key".
            return {
                isValid: false,
                definitiveInvalid: false,
                status: secondAttempt.status,
                reason: secondAttempt.reason || 'transient-unknown'
            };
        } catch (_error) {
            return {
                isValid: false,
                definitiveInvalid: false,
                status: null,
                reason: 'unexpected-error'
            };
        }
    }

    async openOllamaApiKeyManager(requireKey = false) {
        if (this.ollamaApiKeyModalPromise) {
            return this.ollamaApiKeyModalPromise;
        }

        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!hashedMasterKey) return false;

        const existingApiKey = await PaiperworkDB.getOllamaApiKey(hashedMasterKey);

        this.closeAllOllamaApiKeyModals();

        this.ollamaApiKeyModalPromise = new Promise((resolve) => {
            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'ollama-api-key-overlay';
            modalOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            `;

            const modal = document.createElement('div');
            modal.style.cssText = `
                width: min(560px, 92vw);
                background: var(--bg-color);
                color: var(--text-color);
                border: 1px solid var(--border-color);
                border-radius: 10px;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            `;

            const title = document.createElement('h3');
            title.textContent = (Lang.get && Lang.get('ollamaCloudApiKeyTitle')) || 'Ollama Cloud API key required';
            title.style.margin = '0';

            const info = document.createElement('p');
            info.style.margin = '0';
            info.innerHTML = `${(Lang.get && Lang.get('ollamaCloudApiKeyInfo')) || 'To use cloud models, add your Ollama API key. This key will be stored encrypted in your user database.'} <a href="https://ollama.com" target="_blank" rel="noopener noreferrer">ollama.com</a>`;

            const input = document.createElement('input');
            input.type = 'password';
            input.placeholder = (Lang.get && Lang.get('ollamaApiKeyPlaceholder')) || 'Paste your Ollama API key';
            input.value = existingApiKey || '';
            input.autocomplete = 'off';
            input.style.cssText = `
                width: 100%;
                box-sizing: border-box;
                padding: 10px 12px;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                background: var(--input-bg);
                color: var(--text-color);
            `;

            const actions = document.createElement('div');
            actions.style.cssText = `display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap;`;

            const closeBtn = document.createElement('button');
            closeBtn.textContent = (Lang.get && Lang.get('cancelButton')) || 'Cancel';
            closeBtn.style.cssText = `padding:8px 12px; border:1px solid var(--border-color); border-radius:6px; background:var(--button-bg); color:var(--text-color); cursor:pointer;`;

            const addBtn = document.createElement('button');
            addBtn.textContent = (Lang.get && Lang.get('ollamaApiKeyAddButton')) || 'Add';
            addBtn.style.cssText = `padding:8px 12px; border:none; border-radius:6px; background:var(--accent-color); color:var(--accent-text); cursor:pointer;`;

            const updateBtn = document.createElement('button');
            updateBtn.textContent = (Lang.get && Lang.get('ollamaApiKeyUpdateButton')) || 'Update';
            updateBtn.style.cssText = `padding:8px 12px; border:none; border-radius:6px; background:var(--accent-color); color:var(--accent-text); cursor:pointer;`;

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = (Lang.get && Lang.get('ollamaApiKeyDeleteButton')) || 'Delete';
            deleteBtn.style.cssText = `padding:8px 12px; border:none; border-radius:6px; background:var(--danger-color); color:white; cursor:pointer;`;

            const hasExisting = !!(existingApiKey && existingApiKey.trim().length > 0);
            addBtn.disabled = hasExisting;
            addBtn.style.opacity = hasExisting ? '0.6' : '1';
            updateBtn.disabled = !hasExisting;
            updateBtn.style.opacity = !hasExisting ? '0.6' : '1';
            deleteBtn.disabled = !hasExisting;
            deleteBtn.style.opacity = !hasExisting ? '0.6' : '1';

            let finished = false;
            const finish = (saved) => {
                if (finished) return;
                finished = true;
                this.closeAllOllamaApiKeyModals();
                this.ollamaApiKeyModalPromise = null;
                resolve(saved);
            };

            closeBtn.addEventListener('click', () => finish(false));

            addBtn.addEventListener('click', async () => {
                const value = input.value.trim();
                if (!value) {
                    alert('Please provide an API key.');
                    return;
                }
                const ok = await PaiperworkDB.saveOllamaApiKey(hashedMasterKey, value);
                if (ok) {
                    finish(true);
                } else {
                    alert('Failed to save API key. Please try again.');
                }
            });

            updateBtn.addEventListener('click', async () => {
                const value = input.value.trim();
                if (!value) {
                    alert('Please provide an API key.');
                    return;
                }
                const ok = await PaiperworkDB.saveOllamaApiKey(hashedMasterKey, value);
                if (ok) {
                    finish(true);
                } else {
                    alert('Failed to update API key. Please verify the key and try again.');
                }
            });

            deleteBtn.addEventListener('click', async () => {
                const ok = (typeof PaiperworkDB.deleteOllamaApiKey === 'function')
                    ? await PaiperworkDB.deleteOllamaApiKey(hashedMasterKey)
                    : await PaiperworkDB.saveOllamaApiKey(hashedMasterKey, '');
                if (!requireKey && ok) {
                    finish(true);
                    return;
                }
                if (requireKey && ok) {
                    alert('API key deleted. Add a key to continue with cloud models.');
                    finish(false);
                    return;
                }
                if (!ok) {
                    alert('Failed to delete API key. Please try again.');
                }
            });

            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    finish(false);
                }
            });

            actions.appendChild(closeBtn);
            actions.appendChild(deleteBtn);
            actions.appendChild(updateBtn);
            actions.appendChild(addBtn);

            modal.appendChild(title);
            modal.appendChild(info);
            modal.appendChild(input);
            modal.appendChild(actions);
            modalOverlay.appendChild(modal);
            document.body.appendChild(modalOverlay);
            input.focus();
        });

        return this.ollamaApiKeyModalPromise;
    }

    // Opens the modal editor for user insights, allowing editing and saving to the database.
    async openInsightsEditor() {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!hashedMasterKey) return;

        // Load insights from database
        const insights = await SubjectiveInteractions.loadInsights(hashedMasterKey);

        // Create modal container
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'insights-editor-overlay';
        modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

        // Create modal content with theme-aware styling
        const modalContent = document.createElement('div');
        modalContent.className = 'insights-editor-content';
        modalContent.style.cssText = `
        background-color: var(--bg-color);
        color: var(--text-color);
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        width: 80%;
        max-width: 600px;
        max-height: 80%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;

        // Add header with theme-aware styling
        const modalHeader = document.createElement('div');
        modalHeader.style.cssText = `
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border-color);
    `;

        const modalTitle = document.createElement('h3');
        modalTitle.textContent = Lang.get('editUserInsights');
        modalTitle.style.margin = '0';
        modalTitle.style.color = 'var(--text-color)';

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.style.cssText = `
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        padding: 0 8px;
        color: var(--text-color);
    `;
        closeButton.addEventListener('click', () => document.body.removeChild(modalOverlay));

        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);

        // Add insights container with theme-aware styling
        const insightsContainer = document.createElement('div');
        insightsContainer.className = 'insights-list';
        insightsContainer.style.cssText = `
        padding: 16px;
        overflow-y: auto;
        flex-grow: 1;
    `;

        if (!insights || insights.length === 0) {
            const noInsights = document.createElement('p');
            noInsights.textContent = Lang.get('noInsightsStored');
            noInsights.style.textAlign = 'center';
            noInsights.style.color = 'var(--card-meta)';
            insightsContainer.appendChild(noInsights);
        } else {
            // Add insights as editable items with theme-aware styling
            insights.forEach((insight, index) => {
                const insightItem = document.createElement('div');
                insightItem.className = 'insight-item';
                insightItem.style.cssText = `
                margin-bottom: 12px;
                padding: 8px;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                display: flex;
                align-items: center;
                background-color: var(--card-bg);
            `;

                const insightInput = document.createElement('input');
                insightInput.type = 'text';
                insightInput.className = 'insight-input';
                insightInput.value = insight;
                insightInput.style.cssText = `
                flex-grow: 1;
                padding: 6px;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                font-size: 14px;
                background-color: var(--input-bg);
                color: var(--text-color);
            `;

                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-insight';
                deleteButton.innerHTML = '&times;';
                deleteButton.title = 'Delete this insight';
                deleteButton.style.cssText = `
                margin-left: 8px;
                background-color: var(--danger-color);
                color: white;
                border: none;
                border-radius: 4px;
                width: 28px;
                height: 28px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            `;

                deleteButton.addEventListener('click', () => {
                    insightItem.remove();
                });

                insightItem.appendChild(insightInput);
                insightItem.appendChild(deleteButton);
                insightsContainer.appendChild(insightItem);
            });
        }

        // Add footer with buttons and theme-aware styling
        const modalFooter = document.createElement('div');
        modalFooter.style.cssText = `
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid var(--border-color);
    `;

        // Add button to add new insight
        const addButton = document.createElement('button');
        addButton.textContent = Lang.get('addNewInsight');
        addButton.style.cssText = `
        background-color: var(--accent-color);
        color: var(--accent-text);
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
    `;

        addButton.addEventListener('mouseenter', () => {
            addButton.style.backgroundColor = 'var(--accent-color-hover)';
        });

        addButton.addEventListener('mouseleave', () => {
            addButton.style.backgroundColor = 'var(--accent-color)';
        });

        addButton.addEventListener('click', () => {
            const insightItem = document.createElement('div');
            insightItem.className = 'insight-item';
            insightItem.style.cssText = `
            margin-bottom: 12px;
            padding: 8px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            display: flex;
            align-items: center;
            background-color: var(--card-bg);
        `;

            const insightInput = document.createElement('input');
            insightInput.type = 'text';
            insightInput.className = 'insight-input';
            insightInput.value = '';
            insightInput.placeholder = Lang.get('enterNewInsight');
            insightInput.style.cssText = `
            flex-grow: 1;
            padding: 6px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            font-size: 14px;
            background-color: var(--input-bg);
            color: var(--text-color);
        `;

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-insight';
            deleteButton.innerHTML = '&times;';
            deleteButton.title = 'Delete this insight';
            deleteButton.style.cssText = `
            margin-left: 8px;
            background-color: var(--danger-color);
            color: white;
            border: none;
            border-radius: 4px;
            width: 28px;
            height: 28px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        `;

            deleteButton.addEventListener('click', () => {
                insightItem.remove();
            });

            insightItem.appendChild(insightInput);
            insightItem.appendChild(deleteButton);
            insightsContainer.appendChild(insightItem);

            // Focus the new input
            insightInput.focus();
        });

        // Add save button with theme-aware styling
        const saveButton = document.createElement('button');
        saveButton.textContent = Lang.get('saveChanges');
        saveButton.style.cssText = `
        background-color: var(--accent-color);
        color: var(--accent-text);
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
        margin-left: 8px;
    `;

        saveButton.addEventListener('mouseenter', () => {
            saveButton.style.backgroundColor = 'var(--accent-color-hover)';
        });

        saveButton.addEventListener('mouseleave', () => {
            saveButton.style.backgroundColor = 'var(--accent-color)';
        });

        saveButton.addEventListener('click', async () => {
            // Show loading state
            saveButton.textContent = Lang.get('saving');
            saveButton.disabled = true;

            try {
                // Collect all valid insights
                const updatedInsights = [];
                const insightInputs = insightsContainer.querySelectorAll('.insight-input');

                insightInputs.forEach(input => {
                    const value = input.value.trim();
                    if (value) {
                        updatedInsights.push(value);
                    }
                });

                // First, clear all existing insights
                await SubjectiveInteractions.clearInsights(hashedMasterKey);

                // Add each insight individually
                for (const insight of updatedInsights) {
                    await SubjectiveInteractions.storeInsight(hashedMasterKey, insight);
                }

                // Rebuild the system prompt if insights are enabled
                const insightsEnabled = localStorage.getItem('insightsEnabled') === 'true';
                if (insightsEnabled) {
                    await OllamaAPI.buildCompleteSystemPrompt(hashedMasterKey);
                }

                // Close the modal
                document.body.removeChild(modalOverlay);
            } catch (error) {
                console.error('Error saving insights:', error);
                saveButton.textContent = Lang.get('errorSaving');
                setTimeout(() => {
                    saveButton.textContent = Lang.get('saveChanges');
                    saveButton.disabled = false;
                }, 2000);
            }
        });

        modalFooter.appendChild(addButton);
        modalFooter.appendChild(saveButton);

        // Assemble modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(insightsContainer);
        modalContent.appendChild(modalFooter);
        modalOverlay.appendChild(modalContent);

        // Add to document
        document.body.appendChild(modalOverlay);
    }

    // Initializes the ChatTab singleton instance if not already created.
    static initialize() {
        if (!window.chatTab) {
           //console.log('ChatTab: Creating new ChatTab instance');
            window.chatTab = new ChatTab();
            return window.chatTab.initialize();
        } else if (!window.chatTab.initialized) {
           //console.log('ChatTab: Initializing existing ChatTab instance');
            return window.chatTab.initialize();
        } else {
           //console.log('ChatTab: Using existing initialized ChatTab instance');
            return Promise.resolve(true);
        }
    }

    // Adds an export conversation button, delegating to Chat if available.
    addExportButton(deleteButton) {
        if (!deleteButton) return;

       //console.log('ChatTab: Adding export conversation button via delegator');

        // Check if there's a Chat instance with the method
        if (window.chat && typeof window.chat.addExportButton === 'function') {
            // Call the Chat class's implementation
            window.chat.addExportButton(deleteButton);
           //console.log('ChatTab: Delegated to Chat.addExportButton successfully');
        } else {
            console.error('ChatTab: Failed to delegate - Chat instance or addExportButton method not available');

            // Fallback implementation if Chat's method is not available
            const exportButton = document.createElement('button');
            exportButton.id = 'export-conversation';
            exportButton.className = 'primary-button';
            exportButton.innerHTML = `<i class="fa-solid fa-file-export"></i> ${Lang.get('exportConversation') || 'Export Conversation'}`;

            exportButton.style.cssText = deleteButton.style.cssText;
            exportButton.style.marginBottom = '10px';
            exportButton.style.backgroundColor = '#4f46e5';

            deleteButton.parentNode.insertBefore(exportButton, deleteButton);

            exportButton.addEventListener('click', () => {
                if (window.chat && typeof window.chat.exportConversation === 'function') {
                    window.chat.exportConversation();
                } else {
                    alert(Lang.get('errorExportingConversation') || 'Error exporting conversation: Chat functionality not available');
                }
            });
        }
    }

    addCloudApiKeyButton(deleteButton) {
        if (!deleteButton || !deleteButton.parentNode) return;

        // Avoid duplicate button creation when chat tab is re-initialized.
        if (document.getElementById('manage-cloud-api-key')) {
            return;
        }

        const manageButton = document.createElement('button');
        manageButton.id = 'manage-cloud-api-key';
        manageButton.className = deleteButton.className || 'primary-button';
        manageButton.innerHTML = `<i class="fa-solid fa-key"></i> ${Lang.get('manageCloudApiKey') || 'Manage Cloud API key'}`;

        if (deleteButton.nextSibling) {
            deleteButton.parentNode.insertBefore(manageButton, deleteButton.nextSibling);
        } else {
            deleteButton.parentNode.appendChild(manageButton);
        }

        manageButton.addEventListener('click', async () => {
            try {
                if (typeof this.openOllamaApiKeyManager === 'function') {
                    await this.openOllamaApiKeyManager(false);
                }
            } catch (error) {
                console.error('ChatTab: Failed to open cloud API key manager', error);
            }
        });
    }


    // Adds custom CSS styles for document-questioning mode banner.
    addDocumentModeStyles() {
        // Only add if not already present
        if (document.getElementById('document-mode-styles')) return;

        const style = document.createElement('style');
        style.id = 'document-mode-styles';
        style.textContent = `
        .document-questioning-indicator {
            position: relative;
            background-color: #f0fdf4;
            border: 1px solid #10B981;
            border-radius: 6px;
            padding: 10px 16px;
            margin: 0 auto 12px;
            width: calc(100% - 32px);
            max-width: 800px;
            box-sizing: border-box;
            z-index: 5;
        }
        
        .document-questioning-info {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            width: 100%;
        }
        
        .mode-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
             color:rgb(6, 96, 66);
        }
        
        .document-name {
            max-width: 300px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color:rgb(6, 96, 66);
            font-weight: bold;
            text-align: center;
            padding: 0 10px;
        }
        
        .document-details {
            display: flex;
            justify-content: flex-end;
        }
        
        .exit-questioning {
            background: none;
            border: 1px solid #10B981;
            color:rgb(6, 96, 66);
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .exit-questioning:hover {
            background-color: #10B981;
            color: white;
        }
        
        body.dark-theme .document-questioning-indicator {
            background-color: rgba(5, 150, 105, 0.1);
            border-color: #059669;
        }
        
        body.dark-theme .mode-indicator,
        body.dark-theme .document-name {
            color: black; /* Keep text black even in dark theme */
        }
    `;

        document.head.appendChild(style);
    }

    // Updates the UI to show the document-questioning mode banner if active.
    updateDocumentQuestioningUI(forceShow = false) {
        const documentId = localStorage.getItem('ragQuestioningDocumentId');
        const documentName = localStorage.getItem('ragQuestioningDocumentName');

        if (!documentId || !documentName) return;

        // Check if we're in the chat tab or force is enabled
        const isChatTabActive = document.querySelector('.tab-button[data-tab="chat"].active') !== null;
        if (!isChatTabActive && !forceShow) return;

        // Check if banner already exists
        let indicator = document.getElementById('document-mode-indicator');
        if (indicator) return; // Banner already exists

        // Create banner
        indicator = document.createElement('div');
        indicator.className = 'document-questioning-indicator';
        indicator.id = 'document-mode-indicator';

        indicator.innerHTML = `
        <div class="document-questioning-info">
            <div class="mode-indicator document-mode">
                <span class="mode-icon">📄</span>
                <span class="mode-label">${Lang.get('ragDocumentModeLabel') || 'Document Mode'}</span>
            </div>
            <span class="document-name" title="${documentName}">${documentName}</span>
            <div class="document-details">
                <button class="exit-questioning">${Lang.get('ragDocumentModeExit') || 'Exit'}</button>
            </div>
        </div>
    `;

        // Insert at the appropriate location
        const aiReplies = document.querySelector('.ai-replies');
        if (aiReplies && aiReplies.parentNode) {
            aiReplies.parentNode.insertBefore(indicator, aiReplies);
        }

        // Add exit handler
        indicator.querySelector('.exit-questioning').addEventListener('click', () => {
            this.exitDocumentQuestioningMode();
        });

        // Mark body with class for styling
        document.body.classList.add('document-questioning-active');
    }

    // Exits document-questioning mode, removes banner, and restores input placeholder.
    exitDocumentQuestioningMode() {
        // Remove stored data
        localStorage.removeItem('ragQuestioningDocumentId');
        localStorage.removeItem('ragQuestioningDocumentName');

        // Remove banner
        const indicator = document.getElementById('document-mode-indicator');
        if (indicator) indicator.remove();

        // Remove body class
        document.body.classList.remove('document-questioning-active');

        // Restore placeholder
        const promptInput = document.getElementById('prompt-input');
        if (promptInput) {
            const originalPlaceholder = promptInput.getAttribute('data-original-placeholder');
            if (originalPlaceholder) {
                promptInput.setAttribute('placeholder', originalPlaceholder);
                promptInput.removeAttribute('data-original-placeholder');
            }
        }
    }

        // Helper method to unload all models from Ollama to ensure clean memory
        async unloadOllamaModels() {
            try {
                const modelName = document.getElementById('model-selector')?.value || '';
                const selectedProvider = (window.OllamaAPI && typeof window.OllamaAPI.getSelectedModelSource === 'function')
                    ? (window.OllamaAPI.getSelectedModelSource() || window.OllamaAPI.getModelSource?.(modelName) || 'local')
                    : 'local';

                // Unload uses local daemon endpoints and should not run for cloud-only model selections.
                if (selectedProvider === 'cloud') {
                    return;
                }

               //console.log('ChatTab: Getting list of loaded Ollama models...');

                // First, get the list of currently loaded models using /api/ps
                const psResponse = await fetch('http://localhost:11434/api/ps', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!psResponse.ok) {
                    throw new Error(`HTTP ${psResponse.status}: ${psResponse.statusText}`);
                }

                const psData = await psResponse.json();
               //console.log('ChatTab: Ollama /api/ps response:', psData);

                // Extract loaded models from the response
                let loadedModels = [];
                if (psData && psData.models && Array.isArray(psData.models)) {
                    loadedModels = psData.models.map(model => model.name || model.model).filter(Boolean);
                }

               //console.log('ChatTab: Found loaded models:', loadedModels);

                if (loadedModels.length === 0) {
                   //console.log('ChatTab: No models currently loaded. Skipping unload.');
                    return;
                }

                // Unload each model individually
                const unloadPromises = loadedModels.map(async (modelName) => {
                    try {
                       //console.log('ChatTab: Unloading model:', modelName);

                        const unloadResponse = await fetch('http://localhost:11434/api/generate', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                model: modelName,
                                keep_alive: 0,
                                stream: false
                            })
                        });

                        let unloadData = null;
                        try {
                            unloadData = await unloadResponse.json();
                        } catch (jsonErr) {
                            unloadData = null;
                        }

                        /* console.log(`ChatTab: Unload response for ${modelName}:`, {
                            status: unloadResponse.status,
                            ok: unloadResponse.ok,
                            data: unloadData
                        }); */

                        if (!unloadResponse.ok) {
                            if (unloadResponse.status === 429) {
                                console.warn(`ChatTab: Unload rate-limited (429) for ${modelName}.`, (window.Lang && typeof Lang.get === 'function' && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached (429).');
                                return;
                            }
                            console.warn(`ChatTab: Warning - failed to unload ${modelName}: ${unloadResponse.status} ${unloadResponse.statusText}`);
                        } else {
                           //console.log(`ChatTab: Successfully triggered unload for model: ${modelName}`);
                        }

                    } catch (modelError) {
                        console.error(`ChatTab: Error unloading model ${modelName}:`, modelError);
                    }
                });

                // Wait for all unload operations to complete
                await Promise.all(unloadPromises);

               //console.log('ChatTab: All model unload operations completed');

                // Wait a brief moment for the unloads to complete
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.error('ChatTab: Error in unloadOllamaModels:', error);
                if (error && error.message && error.message.includes('Failed to fetch')) {
                    throw new Error('Could not connect to Ollama to unload models.');
                }
                throw error;
            }
        }

}
window.ChatTab = ChatTab;
