class Chat {
    constructor() {
        this.userScrollActive = false;
        this.scrollIdleTimer = null;
        this.scrollIdleDelay = 5000;
        this.scrollTimeout = null;
        if (window.autoScrollEnabled === undefined) {
            window.autoScrollEnabled = true;
        }
        this.isGenerating = false;
        this.globalAbortController = null;
        this.currentRequestId = null;

        this.isInsideCodeBlock = false;
        this.codeBlockContent = '';
        this.codeBlockLanguage = '';
        this.aiResponse = '';

        this.systemPromptWarningShown = false;
        this.initialized = false;

        // CRITICAL: Make this instance available globally
        window.chatInstance = this;

        // Register lightweight WhatsApp connector event listeners
        try {
            window.addEventListener('whatsappPaired', () => {
                try {
                    if (window.connectors && typeof window.connectors.startIncomingPolling === 'function') {
                        window.connectors.startIncomingPolling();
                    }
                } catch (e) { console.error('Chat: failed to start connectors polling on whatsappPaired', e); }
            });
            window.addEventListener('whatsappUnpaired', () => {
                try {
                    if (window.connectors && typeof window.connectors.stopIncomingPolling === 'function') {
                        window.connectors.stopIncomingPolling();
                    }
                } catch (e) { console.error('Chat: failed to stop connectors polling on whatsappUnpaired', e); }
            });
            window.addEventListener('wechatPaired', () => {
                try {
                    if (window.wechatConnectorBridge && typeof window.wechatConnectorBridge.startIncomingPolling === 'function') {
                        window.wechatConnectorBridge.startIncomingPolling();
                    } else if (window.connectors && typeof window.connectors.startWechatIncomingPolling === 'function') {
                        window.connectors.startWechatIncomingPolling();
                    }
                } catch (e) { console.error('Chat: failed to start WeChat polling on wechatPaired', e); }
            });
            window.addEventListener('wechatUnpaired', () => {
                try {
                    if (window.wechatConnectorBridge && typeof window.wechatConnectorBridge.stopIncomingPolling === 'function') {
                        window.wechatConnectorBridge.stopIncomingPolling();
                    } else if (window.connectors && typeof window.connectors.stopWechatIncomingPolling === 'function') {
                        window.connectors.stopWechatIncomingPolling();
                    }
                } catch (e) { console.error('Chat: failed to stop WeChat polling on wechatUnpaired', e); }
            });
            window.addEventListener('whatsappIncoming', (e) => {
                try {
                    const msg = e && e.detail ? e.detail : null;
                    if (!msg) return;

                    const busy = window.isGenerating || this.isGenerating || (window.chat && window.chat.isGenerating);
                    if (busy) {
                        if (window.connectors && typeof window.connectors.enqueueWhatsappIncomingMessage === 'function') {
                            window.connectors.enqueueWhatsappIncomingMessage(msg).catch(err => console.warn('Chat: failed to enqueue busy WA message', err));
                        } else {
                            console.warn('Chat: no connector enqueue function available while busy');
                        }
                        return;
                    }

                    if (!this.initialized) {
                        // Queue incoming message until chat is initialized
                        if (window.connectors && typeof window.connectors.enqueueWhatsappIncomingMessage === 'function') {
                            window.connectors.enqueueWhatsappIncomingMessage(msg).catch(err => console.warn('Chat: failed to enqueue early WA message', err));
                        }
                        return;
                    }
                    this.processWhatsappIncomingMessage(msg);
                } catch (err) {
                    console.error('Chat: error handling whatsappIncoming event', err);
                }
            });
            window.addEventListener('wechatIncoming', (e) => {
                try {
                    const msg = e && e.detail ? e.detail : null;
                    if (!msg) return;
                    console.info('Chat: wechatIncoming event received', { msg });

                    const busy = window.isGenerating || this.isGenerating || (window.chat && window.chat.isGenerating);
                    if (busy) {
                        if (window.wechatConnectorBridge && typeof window.wechatConnectorBridge.enqueueIncomingMessage === 'function') {
                            window.wechatConnectorBridge.enqueueIncomingMessage(msg).catch(err => console.warn('Chat: failed to enqueue busy WeChat message', err));
                        } else if (window.connectors && typeof window.connectors.enqueueWechatIncomingMessage === 'function') {
                            window.connectors.enqueueWechatIncomingMessage(msg).catch(err => console.warn('Chat: failed to enqueue busy WeChat message', err));
                        } else {
                            console.warn('Chat: no connector enqueue function available while busy');
                        }
                        return;
                    }

                    if (!this.initialized) {
                        if (window.wechatConnectorBridge && typeof window.wechatConnectorBridge.enqueueIncomingMessage === 'function') {
                            window.wechatConnectorBridge.enqueueIncomingMessage(msg).catch(err => console.warn('Chat: failed to enqueue early WeChat message', err));
                        } else if (window.connectors && typeof window.connectors.enqueueWechatIncomingMessage === 'function') {
                            window.connectors.enqueueWechatIncomingMessage(msg).catch(err => console.warn('Chat: failed to enqueue early WeChat message', err));
                        }
                        return;
                    }
                    this.processWechatIncomingMessage(msg);
                } catch (err) {
                    console.error('Chat: error handling wechatIncoming event', err);
                }
            });
        } catch (err) {
            console.warn('Chat: failed to attach global WhatsApp listeners', err);
        }

    }

    generateConversationMessageId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }

        return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    }

    createConversationMessageIds() {
        return {
            userMessageId: this.generateConversationMessageId(),
            assistantMessageId: this.generateConversationMessageId()
        };
    }

    isCloudAuthFailureError(error) {
        const message = String(error?.message || '').toLowerCase();
        const directStatus = Number(error?.status || error?.statusCode || error?.response?.status || NaN);

        if (directStatus === 401 || directStatus === 403) {
            return true;
        }

        // Catch multiple edge-case formats:
        // - "Ollama request failed (401): ..."
        // - "Failed to get response from Ollama: 401"
        // - proxy-auth hints and explicit unauthorized wording
        return /(^|\D)401(\D|$)/.test(message)
            || message.includes('unauthorized')
            || message.includes('cloudproxy401')
            || message.includes('keylen=0');
    }

    // Thin wrapper: delegate incoming WhatsApp message processing to the connector
    async processWhatsappIncomingMessage(msg) {
        const busy = window.isGenerating || this.isGenerating || (window.chat && window.chat.isGenerating);
        if (busy) {
            if (window.connectors && typeof window.connectors.enqueueWhatsappIncomingMessage === 'function') {
                try {
                    await window.connectors.enqueueWhatsappIncomingMessage(msg);
                } catch (err) {
                    console.warn('Chat: failed to enqueue busy WA message', err);
                }
            }
            return;
        }

        if (window.connectors && typeof window.connectors.processWhatsappIncomingMessage === 'function') {
            try {
                await window.connectors.processWhatsappIncomingMessage(msg);
                return;
            } catch (e) {
                console.error('Chat: connectors.processWhatsappIncomingMessage failed', e);
            }
        }
        // Fallback: if chat not initialized, enqueue for later processing
        if (!this.initialized) {
            try { await this.enqueueWhatsappIncomingMessage(msg); } catch (err) { console.warn('Chat: failed to enqueue fallback WA message', err); }
            return;
        }
    }

    async processWechatIncomingMessage(msg) {
        const busy = window.isGenerating || this.isGenerating || (window.chat && window.chat.isGenerating);
        if (busy) {
            if (window.wechatConnectorBridge && typeof window.wechatConnectorBridge.enqueueIncomingMessage === 'function') {
                try {
                    await window.wechatConnectorBridge.enqueueIncomingMessage(msg);
                    return;
                } catch (err) {
                    console.warn('Chat: failed to enqueue busy WeChat message', err);
                }
            }
            if (window.connectors && typeof window.connectors.enqueueWechatIncomingMessage === 'function') {
                try {
                    await window.connectors.enqueueWechatIncomingMessage(msg);
                    return;
                } catch (err) {
                    console.warn('Chat: failed to enqueue busy WeChat message', err);
                }
            }
            return;
        }

        if (window.wechatConnectorBridge && typeof window.wechatConnectorBridge.processIncomingMessage === 'function') {
            try {
                await window.wechatConnectorBridge.processIncomingMessage(msg);
                return;
            } catch (e) {
                console.error('Chat: wechatConnectorBridge.processIncomingMessage failed', e);
            }
        } else if (window.connectors && typeof window.connectors.processWechatIncomingMessage === 'function') {
            try {
                await window.connectors.processWechatIncomingMessage(msg);
                return;
            } catch (e) {
                console.error('Chat: connectors.processWechatIncomingMessage failed', e);
            }
        }

        // Fallback: if chat not initialized, enqueue for later processing
        if (!this.initialized) {
            if (window.wechatConnectorBridge && typeof window.wechatConnectorBridge.enqueueIncomingMessage === 'function') {
                try { await window.wechatConnectorBridge.enqueueIncomingMessage(msg); } catch (err) { console.warn('Chat: failed to enqueue fallback WeChat message', err); }
            } else if (window.connectors && typeof window.connectors.enqueueWechatIncomingMessage === 'function') {
                try { await window.connectors.enqueueWechatIncomingMessage(msg); } catch (err) { console.warn('Chat: failed to enqueue fallback WeChat message', err); }
            }
            return;
        }
    }

    // Wrapper for orchestrator document-check from connectors (WhatsApp or WeChat)
    async _handleOrchestratorDocumentCheck(msg) {
        if (window.connectors && typeof window.connectors.handleOrchestratorDocumentCheck === 'function') {
            return await window.connectors.handleOrchestratorDocumentCheck(msg);
        }

        const phone = String(msg?.chat_id || msg?.from || msg?.from_name || msg?.fromJid || '').replace(/@.*$/g, '').trim();
        if (phone && typeof window.connectors?.postWhatsappText === 'function') {
            await window.connectors.postWhatsappText(phone, Lang.get('ragDocumentCheckNotSupported') || 'Document-check is not available right now.');
            return;
        }

        const wechatTarget = String(msg?.account || msg?.account_id || msg?.accountId || msg?.chat_id || msg?.from || msg?.from_name || msg?.fromJid || '').trim();
        if (wechatTarget && typeof window.connectors?.postWechatText === 'function') {
            await window.connectors.postWechatText(wechatTarget, Lang.get('ragDocumentCheckNotSupported') || 'Document-check is not available right now.');
        }
    }

    async handleCloudAuthFailureIfNeeded(error) {
        const selectedProvider = (window.OllamaAPI && typeof window.OllamaAPI.getSelectedModelSource === 'function')
            ? (window.OllamaAPI.getSelectedModelSource() || 'local')
            : 'local';

        if (selectedProvider !== 'cloud' || !this.isCloudAuthFailureError(error)) {
            return false;
        }

        if (window.chatTab && typeof window.chatTab.openOllamaApiKeyManager === 'function') {
            try {
                await window.chatTab.openOllamaApiKeyManager(true);
            } catch (modalError) {
                console.error('Chat: Failed to open cloud API key manager after auth failure', modalError);
            }
        }

        return true;
    }

    isOllamaRateLimitError(error) {
        const message = String(error?.message || '').toLowerCase();
        const directStatus = Number(error?.status || error?.statusCode || error?.response?.status || NaN);

        if (directStatus === 429) {
            return true;
        }

        return /(^|\D)429(\D|$)/.test(message)
            || message.includes('too many requests')
            || message.includes('weekly usage')
            || message.includes('daily limit')
            || message.includes('ollama api error 429');
    }

    handleOllamaRateLimitInChat(error, aiReplies) {
        if (!this.isOllamaRateLimitError(error)) {
            return false;
        }

        const message = (Lang.get && Lang.get('ollamaRateLimitExceeded'))
            || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.';

        const errorDiv = document.createElement('div');
        errorDiv.className = 'system-message';
        errorDiv.innerHTML = `<div class="message-bubble error">${message}</div>`;
        aiReplies.appendChild(errorDiv);

        return true;
    }

    handleOllamaCloudAccessErrorInChat(error, aiReplies) {
        const accessError = window.OllamaAPI && typeof window.OllamaAPI.getOllamaCloudAccessErrorDetails === 'function'
            ? window.OllamaAPI.getOllamaCloudAccessErrorDetails(error)
            : null;

        if (!accessError) {
            return false;
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'system-message';
        errorDiv.innerHTML = `<div class="message-bubble error">${accessError.body}</div>`;
        aiReplies.appendChild(errorDiv);
        return true;
    }

    consumePendingCloudAccessErrorInChat(aiReplies) {
        const pending = window.OllamaAPI && typeof window.OllamaAPI.consumePendingCloudAccessError === 'function'
            ? window.OllamaAPI.consumePendingCloudAccessError()
            : null;

        if (!pending) {
            return false;
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'system-message';
        errorDiv.innerHTML = `<div class="message-bubble error">${pending.body}</div>`;
        aiReplies.appendChild(errorDiv);
        return true;
    }

    // Initializes the chat system, sets up event listeners and global references
    async initialize() {
       //console.log('Chat: Initializing chat system');

        if (this.initialized) {
           //console.log('Chat: Already initialized, skipping');
            return true;
        }

        // Set up global references
        window.isGenerating = false;
        window.copyBubbleContent = this.copyBubbleContent.bind(this);
        window.cancelOllamaGeneration = this.cancelOllamaGeneration.bind(this);
        window.cleanupIncompleteResponses = this.cleanupIncompleteResponses.bind(this);

        // Add these handler references
        window.handleSystemPromptChange = this.handleSystemPromptChange.bind(this);
        const aiReplies = document.querySelector('.ai-replies');
        if (aiReplies) {
            // User direct interactions with scroll mechanisms
            aiReplies.addEventListener('wheel', () => {
                this.handleUserScroll();
            });

            // Detect scrollbar drag (mousedown on scrollbar)
            aiReplies.addEventListener('mousedown', (e) => {
                // Check if click was near the scrollbar
                const clickedNearScrollbar = e.clientX > (aiReplies.getBoundingClientRect().right - 20);
                if (clickedNearScrollbar) {
                    this.handleUserScroll();
                }
            });

            // Check when scrolling stops if we're at the bottom
            aiReplies.addEventListener('scrollend', () => {
                this.checkScrollBottom();
            });

           //console.log('Chat: Simplified scroll event listeners attached');
        }

        // Set up system prompt save button handler
        this.setupSystemPromptButton();

        // Mark as initialized
        this.initialized = true;
       //console.log('Chat: Chat system initialized');
        return true;
    }

    // Sets up the system prompt save button and its event handler
    setupSystemPromptButton() {
        const saveSystemPromptButton = document.getElementById('save-system-prompt');
        if (saveSystemPromptButton) {
            // Remove any existing event listeners first
            const newButton = saveSystemPromptButton.cloneNode(true);
            if (saveSystemPromptButton.parentNode) {
                saveSystemPromptButton.parentNode.replaceChild(newButton, saveSystemPromptButton);
            }

            // Add event listener
            newButton.addEventListener('click', async () => {
                const systemPrompt = document.getElementById('system-prompt').value;
                const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');

                // Check if the system prompt has changed
                const confirmed = this.handleSystemPromptChange(systemPrompt);
                if (!confirmed) {
                   //console.log('System prompt change was cancelled by user');
                    return;
                }

                try {
                    await PaiperworkDB.saveSystemPrompt(hashedMasterKey, systemPrompt);
                   //console.log('System prompt saved successfully');

                    // Show save confirmation
                    const saveConfirmation = document.createElement('div');
                    saveConfirmation.className = 'save-confirmation';
                    saveConfirmation.textContent = Lang.get('systemPromptSaved') || 'System prompt saved';
                    saveConfirmation.style.cssText = `
                        position: absolute;
                        top: 5px;
                        right: 5px;
                        background-color: #10b981;
                        color: white;
                        padding: 5px 10px;
                        border-radius: 4px;
                        font-size: 12px;
                        opacity: 0;
                        transition: opacity 0.3s;
                    `;

                    const promptContainer = document.querySelector('.system-prompt-container');
                    if (promptContainer) {
                        promptContainer.appendChild(saveConfirmation);

                        // Fade in
                        setTimeout(() => {
                            saveConfirmation.style.opacity = '1';
                        }, 10);

                        // Fade out and remove
                        setTimeout(() => {
                            saveConfirmation.style.opacity = '0';
                            setTimeout(() => {
                                if (saveConfirmation.parentNode) {
                                    saveConfirmation.parentNode.removeChild(saveConfirmation);
                                }
                            }, 300);
                        }, 2000);
                    }
                } catch (error) {
                    console.error('Error saving system prompt:', error);
                    alert(Lang.get('errorSavingSystemPrompt') || 'Error saving system prompt');
                }
            });
        }
    }

    // Enhances the system prompt with additional insights using OllamaAPI
    async enhanceSystemPromptWithInsights(systemPromptText) {
       //console.log('Chat DEBUG: Starting enhanceSystemPromptWithInsights');
       //console.log('Chat DEBUG: Input system prompt type:', typeof systemPromptText);
       //console.log('Chat DEBUG: Input system prompt length:',
        //systemPromptText ? systemPromptText.length : 0);


        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!hashedMasterKey) {
            console.error('Cannot enhance prompt: no masterkey ID found');
            return systemPromptText;
        }

       //console.log('Enhancing system prompt using OllamaAPI.buildCompleteSystemPrompt');

        try {
            // Use the comprehensive system prompt builder from OllamaAPI
            const enhancedPrompt = await OllamaAPI.buildCompleteSystemPrompt(hashedMasterKey, systemPromptText);

           //console.log('Prompt enhancement complete:', {
            //originalLength: systemPromptText.length,
            //enhancedLength: enhancedPrompt.length,
            //enhancedFirst100: enhancedPrompt.substring(0, 100) + '...'
            // });

            return enhancedPrompt;
        } catch (error) {
            console.error('Error enhancing system prompt:', error);
            // Return original in case of error
            return systemPromptText;
        }
    }

    async processInsightsIfEnabled(prompt, promptInput, sendButton, hashedMasterKey) {
        if (!prompt || !hashedMasterKey) {
            return false;
        }

        try {
            const settings = await PaiperworkDB.loadSettings(hashedMasterKey);
            const insightsEnabled = settings.insights_enabled === true || String(settings.insights_enabled).toLowerCase() === 'true';
            if (!insightsEnabled) {
                return false;
            }

            if (!SubjectiveInteractions.isMessageInsightWorthy(prompt)) {
                return false;
            }

            const insights = await SubjectiveInteractions.analyzeUserMessage(prompt, promptInput, sendButton);
            await SubjectiveInteractions.storeInsights(hashedMasterKey, insights);
            return true;
        } catch (error) {
            console.error('Chat: Error running insights workflow:', error);
            return false;
        }
    }


    // Adds a "Run" button to code blocks for HTML/markup languages
    addRunButtonsToCodeBlock(block) {
        const language = block.querySelector('.code-language')?.textContent?.toLowerCase();
        const buttonsContainer = block.querySelector('.code-header .flex.gap-2');

        if (buttonsContainer) {
            // Add HTML run button
            if (language === 'markup' || language === 'html') {
                if (!buttonsContainer.querySelector('.code-run-btn')) {
                    const runButton = document.createElement('button');
                    runButton.className = 'code-run-btn';
                    runButton.textContent = 'Run';
                    runButton.style.cssText = `
                    padding: 2px 8px;
                    font-size: 12px;
                    color: #fff;
                    background-color: #22c55e;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    margin-right: 8px;
                    display: inline-block;
                    float: left;
                `;
                    runButton.setAttribute('onclick', 'window.runHtmlCode(this)');
                    buttonsContainer.insertBefore(runButton, buttonsContainer.firstChild);
                }
            }
        }
    }
    // Copies the content of a message bubble to the clipboard
    copyBubbleContent(button) {
        const messageBubble = button.closest('.message-bubble');
        if (messageBubble) {
            const bubbleText = messageBubble.childNodes[0].textContent.trim();
            navigator.clipboard.writeText(bubbleText).then(() => {
                // Visual feedback
                const originalText = button.textContent;
                button.textContent = Lang.get('copied');
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy message:', err);
                button.textContent = Lang.get('copyError');
                setTimeout(() => {
                    button.textContent = Lang.get('copy');
                }, 2000);
            });
        }
    }
    // Handles changes to the system prompt, including context reset and UI updates
    handleSystemPromptChange(newSystemPrompt, skipWarning = false) {
        // Add this flag to the constructor if not already there
        if (!this.systemPromptWarningShown && !skipWarning) {
            const confirmed = confirm(Lang.get('systemPromptChangeWarning') ||
                'Changing the system prompt will reset the conversation context. Continue?');

            if (!confirmed) {
                return false;
            }
            this.systemPromptWarningShown = true;
        }

        // Reset local and cloud context when system prompt changes
        if (OllamaAPI && typeof OllamaAPI.resetContext === 'function') {
            OllamaAPI.resetContext();
        }

        // Get the AI replies container
        const aiReplies = document.querySelector('.ai-replies');
        if (!aiReplies) return true;

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
        const assistantMessages = aiReplies.querySelectorAll('.assistant-message');
        if (assistantMessages.length > 0) {
            const lastMessage = assistantMessages[assistantMessages.length - 1];
            const lastAssistantMessage = lastMessage.querySelector('.ai-response-container')?.innerHTML;
            if (lastAssistantMessage) {
                conversations.push({
                    role: 'assistant',
                    message: lastAssistantMessage
                });
            }
        }

    // If there are no conversation entries, also ensure we don't add a continue button
    // when the aiReplies container is empty or only contains the welcome message.
    const assistantMessagesAll = aiReplies.querySelectorAll('.assistant-message');
    const hasOnlyWelcome = (assistantMessagesAll.length === 1 && assistantMessagesAll[0].classList.contains('welcome-message'));

    if (conversations.length > 0 && !hasOnlyWelcome) {
            const continueButton = OllamaAPI.createContinueButton(conversations, aiReplies);

            // Add the system prompt change note
            const resetNote = document.createElement('div');
            resetNote.className = 'context-reset-note';
            // Make the note full-width and left-aligned while the container centers the button below
            resetNote.style.cssText = 'width:100%; text-align:center; align-self:flex-start; margin-bottom:8px;';
            resetNote.innerHTML = `<small style="color: #888; font-style: italic;">${Lang.get('contextResetNote') || 'Context was reset due to system prompt change'}</small>`;

            // Insert at the beginning of the continue button container
            if (continueButton.firstChild) {
                continueButton.insertBefore(resetNote, continueButton.firstChild);
            } else {
                continueButton.appendChild(resetNote);
            }

            // Ensure any existing continuation container is removed, then append the new one at the end
            try {
                const existing = aiReplies.querySelector('.continuation-container');
                if (existing) {
                    existing.remove();
                }
                aiReplies.appendChild(continueButton);
                // Ensure the new continue button is visible at the end
                try { continueButton.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { /* ignore */ }
            } catch (e) {
                console.warn('Chat: error replacing continue button in aiReplies', e);
            }
        }

        return true;
    }

    // Handles user scroll events and manages auto-scroll state
    handleUserScroll() {
       //console.log('Chat: User scroll detected');

        // If already marked as user scrolling, just reset the timer
        if (this.userScrollActive) {
            // Clear existing timer and create a new one
            if (this.scrollIdleTimer) {
                clearTimeout(this.scrollIdleTimer);
            }
        } else {
            // First user scroll action - disable auto-scroll
           //console.log('Chat: User scrolled, disabling auto-scroll');
            this.userScrollActive = true;
            window.autoScrollEnabled = false; // Set GLOBAL flag instead
        }

        // Set timer to re-enable auto-scroll after inactivity period
        this.scrollIdleTimer = setTimeout(() => {
           //console.log('Chat: Scroll idle timeout reached, re-enabling auto-scroll');
            this.userScrollActive = false;
            window.autoScrollEnabled = true; // Set GLOBAL flag instead

            // If still generating content, scroll to bottom
            if (window.isGenerating || this.isGenerating) {
                this.scrollToBottom();
            }
        }, this.scrollIdleDelay);
    }

    // Checks if the user has scrolled to the bottom and updates auto-scroll state
    checkScrollBottom() {
        const aiReplies = document.querySelector('.ai-replies');
        if (!aiReplies) return;

        // User has scrolled to bottom - re-enable auto-scroll immediately
        const isAtBottom = aiReplies.scrollTop + aiReplies.clientHeight >= aiReplies.scrollHeight - 80;

        if (isAtBottom && this.userScrollActive) {
           //console.log('Chat: User scrolled to bottom, re-enabling auto-scroll');

            // Clear idle timer
            if (this.scrollIdleTimer) {
                clearTimeout(this.scrollIdleTimer);
                this.scrollIdleTimer = null;
            }

            // Reset flags
            this.userScrollActive = false;
            window.autoScrollEnabled = true; // Set GLOBAL flag instead
        }
    }

    // Scrolls the chat to the bottom if auto-scroll is enabled
    scrollToBottom() {
        if (!window.autoScrollEnabled) { // Check GLOBAL flag instead
            return; // Don't scroll if auto-scroll is disabled
        }

        const aiReplies = document.querySelector('.ai-replies');
        if (aiReplies) {
            aiReplies.scrollTop = aiReplies.scrollHeight;
        }
    }

    // Deactivate web-search mode after the assistant reply completes.
    deactivateWebSearchButton() {
        const webButton = document.getElementById('web-search');
        if (webButton && webButton.classList.contains('active')) {
            webButton.classList.remove('active');
        }
    }

    // Handles the send button click, including prompt processing, RAG, web search, and DataViz
    async handleSendButtonClick() {
        const aiReplies = document.querySelector('.ai-replies');
        const conversationScopeKey = this.documentConversationScopeKey || 'ui';
        const allowGlobalDocumentFallback = conversationScopeKey === 'ui';
        const activeDocumentConversation = (window.RAG_Utils && typeof window.RAG_Utils.getActiveDocumentConversation === 'function')
            ? (window.RAG_Utils.getActiveDocumentConversation(conversationScopeKey) || null)
            : null;
        const whatsappRequestScope = (typeof window !== 'undefined' && window.__paiperworkWhatsappActiveRequest)
            ? window.__paiperworkWhatsappActiveRequest
            : null;
        const wechatRequestScope = (typeof window !== 'undefined' && window.__paiperworkwechatActiveRequest)
            ? window.__paiperworkwechatActiveRequest
            : null;
        const whatsappTargetConversationGroup = Number(whatsappRequestScope && whatsappRequestScope.targetConversationGroup);
        const wechatTargetConversationGroup = Number(wechatRequestScope && wechatRequestScope.targetConversationGroup);

        if (Number.isInteger(whatsappTargetConversationGroup) && whatsappTargetConversationGroup > 0) {
            if (window.currentConversationGroup !== whatsappTargetConversationGroup) {
                if (window.chatTab && typeof window.chatTab.loadSessionConversation === 'function') {
                    await window.chatTab.loadSessionConversation({
                        group_id: whatsappTargetConversationGroup,
                        preview: whatsappRequestScope?.sessionPreview || 'WhatsApp conversation',
                        timestamp: new Date().toISOString()
                    });
                }
                window.currentConversationGroup = whatsappTargetConversationGroup;
            }

            window.forceNewConversationGroup = false;
        }

        if (Number.isInteger(wechatTargetConversationGroup) && wechatTargetConversationGroup > 0) {
            if (window.currentConversationGroup !== wechatTargetConversationGroup) {
                if (window.chatTab && typeof window.chatTab.loadSessionConversation === 'function') {
                    await window.chatTab.loadSessionConversation({
                        group_id: wechatTargetConversationGroup,
                        preview: wechatRequestScope?.sessionPreview || 'WeChat conversation',
                        timestamp: new Date().toISOString()
                    });
                }
                window.currentConversationGroup = wechatTargetConversationGroup;
            }

            window.forceNewConversationGroup = false;
        }

        // Check if we're in Documents tab (for global document search)
        const isDocumentsTabActive = document.querySelector('.tab-button[data-tab="documents"]')?.classList.contains('active');

        // Check if document questioning mode is active (specific document)
        const activeDocumentId = activeDocumentConversation?.documentId
            || (allowGlobalDocumentFallback ? localStorage.getItem('ragQuestioningDocumentId') : null);
        /*console.info('[Chat][debug] handleSendButtonClick scope state', {
            conversationScopeKey,
            activeDocumentConversation,
            activeDocumentId,
            whatsappPendingReplyChatId: this.whatsappPendingReplyChatId || null
        });*/

        // Prioritize document questioning mode over global document search
        if (isDocumentsTabActive && !activeDocumentId) {
            // Only perform global document search if no specific document is selected
            if (window.RAG_Utils && typeof window.RAG_Utils.handleDocumentGlobalSearch === 'function') {
                // Call the function from RAG_Utils
                await window.RAG_Utils.handleDocumentGlobalSearch();
            } else {
                console.error('Document global search function not available');
            }
            return;
        }

        // Modified check that excludes welcome messages from the count
        const welcomeMessage = aiReplies?.querySelector('.welcome-message');
        const messageCount = aiReplies?.querySelectorAll('.user-message, .assistant-message:not(.welcome-message)').length || 0;
        const noExistingMessages = !aiReplies || messageCount === 0;

        // FIXED: Check if we only have welcome messages (no real conversation) OR no currentConversationGroup
        const onlyWelcomeMessages = welcomeMessage && messageCount === 0;
        const noActiveGroup = !(Number.isInteger(whatsappTargetConversationGroup) && whatsappTargetConversationGroup > 0)
            && !(Number.isInteger(wechatTargetConversationGroup) && wechatTargetConversationGroup > 0)
            && !window.currentConversationGroup;

        // If chat area is empty, only contains welcome message, or no active conversation group, treat this as a new conversation group
        let forceNewGroup = window.forceNewConversationGroup === true || noExistingMessages || onlyWelcomeMessages || noActiveGroup;
        if ((Number.isInteger(whatsappTargetConversationGroup) && whatsappTargetConversationGroup > 0)
            || (Number.isInteger(wechatTargetConversationGroup) && wechatTargetConversationGroup > 0)) {
            forceNewGroup = false;
        }

        const sendButton = document.getElementById('send-prompt');
        const promptInput = document.getElementById('prompt-input');
        const progressBar = document.getElementById('progress-bar');

        // If currently generating, this click means "cancel"
        if (window.isGenerating || this.isGenerating) {
            this.cancelOllamaGeneration();
            return;
        }

        // Check if we're in DataViz tab first (regardless of whether a button is selected)
        const datavizModeActive = document.querySelector('.tab-button[data-tab="dataviz"]')?.classList.contains('active');

        // And then add this line right after to update sessionStorage accordingly:
        sessionStorage.setItem('datavizModeActive', datavizModeActive ? 'true' : 'false');

        // If DataViz tab is active, we should always be in DataViz mode, regardless of sessionStorage state
        if (datavizModeActive) {
            sessionStorage.setItem('datavizModeActive', 'true'); // Ensure storage is set

            if (!window.dataViz) {
                console.error('Chat: DataViz: Missing dataViz instance');
                alert(Lang.get('datavizNotInitialized'));
                return;
            }

            // Check if a chart type is selected regardless of prompt content
            const activeVizType = sessionStorage.getItem('activeVizType');
            if (!activeVizType) {
                console.warn('Chat: DataViz: No chart type selected');
                window.dataViz.showFloatingWindow(`
                <div class="dataviz-error" style="text-align: center; padding: 30px;">
                    <h3>${Lang.get('datavizNoChartType')}</h3>
                    <p>${Lang.get('datavizSelectChartPrompt')}</p>
                    <div style="margin-top: 20px;">
                        <button onclick="document.querySelector('.dataviz-floating-window .close-button').click()" 
                                style="background: #4f46e5; color: white; border: none; border-radius: 4px; padding: 10px 15px; cursor: pointer;">
                            ${Lang.get('datavizOkSelect')}
                        </button>
                    </div>
                </div>
            `);
                return; // Stop processing - This prevents fallthrough to regular chat
            }

            const prompt = promptInput.value.trim();
            if (prompt) {
                // Clear the input first
                promptInput.value = '';

                try {
                    // Call the DataViz handler
                    await window.dataViz.createVisualization(activeVizType, prompt);
                    return; // Skip the rest of the standard flow
                } catch (error) {
                    console.error('Chat: Error creating visualization:', error);
                    // Show error message but still prevent fallthrough to regular chat
                    window.dataViz.showFloatingWindow(`
                    <div class="dataviz-error" style="text-align: center; padding: 30px;">
                        <h3>${Lang.get('datavizError')}</h3>
                        <p>${error.message}</p>
                        <div style="margin-top: 20px;">
                            <button onclick="document.querySelector('.dataviz-floating-window .close-button').click()" 
                                    style="background: #4f46e5; color: white; border: none; border-radius: 4px; padding: 10px 15px; cursor: pointer;">
                                ${Lang.get('datavizOk')}
                            </button>
                        </div>
                    </div>
                `);
                    return; // Important: Still stop here even on error
                }
            } else {
                // No prompt but in DataViz mode, show message to enter a prompt
                window.dataViz.showFloatingWindow(`
                <div class="dataviz-error" style="text-align: center; padding: 30px;">
                    <h3>${Lang.get('datavizNoData')}</h3>
                    <p>${Lang.get('datavizEnterData')}</p>
                    <div style="margin-top: 20px;">
                        <button onclick="document.querySelector('.dataviz-floating-window .close-button').click()" 
                                style="background: #4f46e5; color: white; border: none; border-radius: 4px; padding: 10px 15px; cursor: pointer;">
                            ${Lang.get('datavizOk')}
                        </button>
                    </div>
                </div>
            `);
                return; // Still prevent fallthrough to regular chat
            }
        }

        // Check if a model is selected first
        const modelSelector = document.getElementById('model-selector');
        if (!modelSelector.value) {
            alert(Lang.get('selectModelPrompt'));
            return;
        }

        const prompt = promptInput.value.trim();
        if (!prompt) {
            return;
        }

        if (window.RAG_Utils && typeof window.RAG_Utils.resolveDocumentQuestioningAction === 'function') {
            try {
                const documentModeAction = await window.RAG_Utils.resolveDocumentQuestioningAction(prompt, {
                    scopeKey: conversationScopeKey,
                    activeDocumentId,
                    hashedMasterKey: sessionStorage.getItem('hashedMasterKey')
                });
                if (documentModeAction && documentModeAction.action === 'exit') {
                    if (typeof window.RAG_Utils.exitDocumentConversationScope === 'function') {
                        window.RAG_Utils.exitDocumentConversationScope(conversationScopeKey);
                    }
                    promptInput.value = '';
                    return;
                } else if (documentModeAction && (documentModeAction.action === 'enter' || documentModeAction.action === 'switch') && documentModeAction.match && documentModeAction.match.documentId) {
                    let enabled = false;
                    if (conversationScopeKey === 'ui') {
                        enabled = await window.RAG_Utils.enableDocumentQuestioningMode(documentModeAction.match.documentId, { force: true });
                    } else if (typeof window.RAG_Utils.activateDocumentConversationScope === 'function') {
                        enabled = await window.RAG_Utils.activateDocumentConversationScope(conversationScopeKey, {
                            id: documentModeAction.match.documentId,
                            name: documentModeAction.match.documentName
                        }, { force: true });
                    }
                    if (enabled) {
                        try {
                            if (conversationScopeKey === 'ui') {
                                window.RAG_Utils.updateDocumentQuestioningUI(true);
                            }
                        } catch (uiErr) {
                            console.warn('Chat: updateDocumentQuestioningUI after intent activation failed', uiErr);
                        }
                    }
                }
            } catch (intentErr) {
                console.warn('Chat: automatic document mode action resolution failed', intentErr);
            }
        }

        const isGemma3 = modelSelector.value.toLowerCase().includes('gemma3');
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

        const userDiv = document.createElement('div');
        userDiv.className = 'user-message';
        userDiv.style.flexDirection = 'column';
        userDiv.style.display = 'flex';
        userDiv.style.alignSelf = 'flex-end';
        userDiv.style.alignItems = 'flex-end';
        userDiv.style.textAlign = 'right';

        const conversationMessageIds = this.createConversationMessageIds();
        userDiv.dataset.messageId = conversationMessageIds.userMessageId;

        const extractVisiblePromptFromAutomationPrompt = (rawPrompt) => {
            const promptText = String(rawPrompt || '').trim();
            if (!promptText) {
                return '';
            }

            const hiddenPromptPrefixes = [
                'Operate only on the cached Knowledge Base entry below.',
                'Operate only on the cached summary below.',
                'Operate only on the cached research report below.',
                'Operate only on the assistant answer below from the active document-questioning conversation.'
            ];

            if (!hiddenPromptPrefixes.some(prefix => promptText.startsWith(prefix))) {
                return '';
            }

            const normalizedPromptText = promptText.replace(/\s+/g, ' ').trim();
            const requestLabels = ['User request:', 'Current user request:'];
            const stopLabels = [
                'Cached research report:',
                'Cached summary:',
                'Cached Knowledge Base entry:',
                'Cached knowledge base entry:',
                'Assistant answer:',
                'Cached assistant answer:'
            ];

            for (const label of requestLabels) {
                const labelIndex = normalizedPromptText.toLowerCase().indexOf(label.toLowerCase());
                if (labelIndex < 0) {
                    continue;
                }

                const requestStart = labelIndex + label.length;
                let requestEnd = normalizedPromptText.length;
                for (const stopLabel of stopLabels) {
                    const stopIndex = normalizedPromptText.toLowerCase().indexOf(stopLabel.toLowerCase(), requestStart);
                    if (stopIndex >= 0 && stopIndex < requestEnd) {
                        requestEnd = stopIndex;
                    }
                }

                const extracted = normalizedPromptText.slice(requestStart, requestEnd).trim();
                if (extracted) {
                    return extracted;
                }
            }

            return '';
        };

        const automationVisiblePrompt = extractVisiblePromptFromAutomationPrompt(prompt);

        const visiblePrompt = (whatsappRequestScope && typeof whatsappRequestScope.displayUserText === 'string' && whatsappRequestScope.displayUserText.trim())
            ? whatsappRequestScope.displayUserText.trim()
            : (wechatRequestScope && typeof wechatRequestScope.displayUserText === 'string' && wechatRequestScope.displayUserText.trim())
                ? wechatRequestScope.displayUserText.trim()
                : automationVisiblePrompt || prompt;

        userDiv.innerHTML = `<div class="message-bubble">${visiblePrompt}</div>`;

        if (isGemma3 && window.selectedImages && window.selectedImages.length > 0 && !window.imagesUnderTheHood) {
            // Add images container after the message bubble
            const imagesContainer = document.createElement('div');
            imagesContainer.className = 'user-message-images';
            imagesContainer.style.display = 'flex';
            imagesContainer.style.flexDirection = 'column';
            imagesContainer.style.flexWrap = 'wrap';
            imagesContainer.style.gap = '8px';
            imagesContainer.style.marginTop = '8px';
            imagesContainer.style.marginBottom = '8px';

            const selectedImagePayloads = Array.isArray(window.selectedImagePayloads)
                ? window.selectedImagePayloads
                : [];

            // Add each image
            window.selectedImages.forEach((imgSrc, index) => {
                const imgWrapper = document.createElement('div');
                imgWrapper.style.position = 'relative';
                imgWrapper.style.borderRadius = '8px';
                imgWrapper.style.overflow = 'hidden';
                imgWrapper.style.border = '1px solid var(--border-color)';
                imgWrapper.style.maxWidth = '200px';

                const img = document.createElement('img');
                img.src = imgSrc;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '150px';
                img.style.objectFit = 'contain';
                img.style.cursor = 'pointer';
                img.dataset.fullImage = imgSrc;
                const imageData = selectedImagePayloads[index]?.dataUrl || imgSrc;
                img.dataset.imageData = imageData;
                img.setAttribute('data-image-data', imageData);

                img.addEventListener('click', (e) => {
                    this.showFullSizeImage(e.target.dataset.fullImage);
                });

                imgWrapper.appendChild(img);
                imagesContainer.appendChild(imgWrapper);
            });

            userDiv.appendChild(imagesContainer);
        } else if (window.selectedImage && typeof window.selectedImage === 'string' && !window.imagesUnderTheHood) {
            // Single image case
            const imgContainer = document.createElement('div');
            imgContainer.className = 'user-message-image';
            imgContainer.style.display = 'block';
            imgContainer.style.maxWidth = '200px';
            imgContainer.style.marginTop = '8px';
            imgContainer.style.marginBottom = '8px';
            imgContainer.style.borderRadius = '8px';
            imgContainer.style.overflow = 'hidden';
            imgContainer.style.border = '1px solid var(--border-color)';

            const img = document.createElement('img');
            img.src = window.selectedImage;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '150px';
            img.style.objectFit = 'contain';
            img.style.cursor = 'pointer';
            img.dataset.fullImage = window.selectedImage;
            const singleImageData = window.selectedImagePayload?.dataUrl || window.selectedImage;
            img.dataset.imageData = singleImageData;
            img.setAttribute('data-image-data', singleImageData);

            img.addEventListener('click', (e) => {
                this.showFullSizeImage(e.target.dataset.fullImage);
            });

            imgContainer.appendChild(img);
            userDiv.appendChild(imgContainer);
        }

        this.addCopyActionToUserMessage(userDiv);
        applyWhatsappRequestMetadata(userDiv);
        applyWechatRequestMetadata(userDiv);

        userDiv.appendChild(document.createElement('br'));
        aiReplies.appendChild(userDiv);
        if (window.autoScrollEnabled) {
            requestAnimationFrame(() => {
                aiReplies.scrollTop = aiReplies.scrollHeight;
            });
        }

        // Clear input immediately so UI reflects that the message has been queued.
        promptInput.value = '';

        // Cloud workflow gate: require a stored API key before sending.
        const selectedProvider = (window.OllamaAPI && typeof window.OllamaAPI.getSelectedModelSource === 'function')
            ? (window.OllamaAPI.getSelectedModelSource() || 'local')
            : 'local';
        if (selectedProvider === 'cloud') {
            const routing = await OllamaAPI.getApiRoutingForModel(modelSelector.value);
            const requiresDirectCloudKey = routing && routing.baseUrl === '/api/cloud';
            if (!requiresDirectCloudKey) {
                // Local-daemon cloud mode (`ollama signin`) does not require app-managed API key.
            } else {
            if (!window.chatTab || typeof window.chatTab.ensureCloudApiKeyForSend !== 'function') {
                alert((Lang.get && Lang.get('ollamaApiKeyRequired')) || 'An Ollama API key is required to use cloud models.');
                return;
            }
            const hasCloudKey = await window.chatTab.ensureCloudApiKeyForSend();
            if (!hasCloudKey) {
                return;
            }
            if (typeof window.chatTab.closeAllOllamaApiKeyModals === 'function') {
                window.chatTab.closeAllOllamaApiKeyModals();
            }
            }
        }

        // Set generating flag FIRST before any async operations
        window.isGenerating = true;
        this.isGenerating = true;
        window.currentMessageImages = [];

        // Capture the current image data before it gets cleared
        if (isGemma3 && window.selectedImages && window.selectedImages.length > 0) {
            // Save Gemma3 multi-image data
            const selectedImagePayloads = Array.isArray(window.selectedImagePayloads)
                ? window.selectedImagePayloads
                : [];

            window.currentMessageImages = window.selectedImages.map((img, index) => {
                const payload = selectedImagePayloads[index] || {};
                return {
                    src: payload.dataUrl || img,
                    dataUrl: payload.dataUrl || img,
                    originalBlob: payload.originalBlob || null,
                    fileName: payload.fileName || '',
                    mimeType: payload.mimeType || '',
                    byteSize: payload.byteSize || 0
                };
            });
        } else if (window.selectedImage) {
            // Save single image data
            const payload = window.selectedImagePayload || {};
            window.currentMessageImages = [{
                src: payload.dataUrl || window.selectedImage,
                dataUrl: payload.dataUrl || window.selectedImage,
                originalBlob: payload.originalBlob || null,
                fileName: payload.fileName || '',
                mimeType: payload.mimeType || '',
                byteSize: payload.byteSize || 0
            }];
        }

        // Apply inline styles DIRECTLY to ensure the button changes immediately
        sendButton.textContent = Lang.get('cancelButton');
        sendButton.style.backgroundColor = '#ef4444'; // Red color for cancel
        sendButton.style.color = 'white';
        sendButton.classList.add('cancel-state');

        // Create a new AbortController for this request
        this.globalAbortController = new AbortController();
        window.globalAbortController = this.globalAbortController;

        progressBar.classList.add('active', 'indeterminate');

        const baseSystemPrompt = document.getElementById('system-prompt').value;
        const contextSize = document.getElementById('context-selector').value;
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        this.aiResponse = '';

        // First load the base system prompt
        let basePrompt;
        const isShortAnswer = window.lastOrchestratorDecision && window.lastOrchestratorDecision.shortAnswer;
        if (isShortAnswer) {
            basePrompt = (basePrompt || '') + '\n\nPlease answer in 2-3 short sentences in the same language as the user. Keep it concise and readable on mobile.';
        }
        try {
            const settings = await PaiperworkDB.loadSettings(hashedMasterKey);
            basePrompt = settings.systemPrompt || baseSystemPrompt;
        } catch (error) {
            console.error('Chat: Error loading system prompt from database:', error);
            basePrompt = baseSystemPrompt;
        }

        let enhancedSystemPrompt = await this.enhanceSystemPromptWithInsights(basePrompt);

        // NOTE: WhatsApp language enforcement is now handled in OllamaAPI.buildCompleteSystemPrompt.
        // The routine will inspect window.whatsappIncomingLanguage and enforce it at the model system level.

        const buildQueryFocusedSnippet = (rawText, queryText, maxChars) => {
            const text = String(rawText || '').trim();
            if (!text) {
                return '';
            }

            if (!Number.isFinite(maxChars) || maxChars <= 0 || text.length <= maxChars) {
                return text;
            }

            const queryTerms = String(queryText || '')
                .toLowerCase()
                .split(/[^\p{L}\p{N}]+/u)
                .map(term => term.trim())
                .filter(term => term.length >= 3 && !['there', 'what', 'with', 'from', 'have', 'this', 'that', 'flip4'].includes(term));

            let matchIndex = -1;
            for (const term of queryTerms) {
                const index = text.toLowerCase().indexOf(term);
                if (index >= 0 && (matchIndex === -1 || index < matchIndex)) {
                    matchIndex = index;
                }
            }

            if (matchIndex === -1) {
                return `${text.slice(0, maxChars).trimEnd()}...`;
            }

            const halfWindow = Math.floor(maxChars / 2);
            const start = Math.max(0, matchIndex - halfWindow);
            const end = Math.min(text.length, start + maxChars);
            const adjustedStart = Math.max(0, end - maxChars);
            const snippet = text.slice(adjustedStart, end).trim();

            return `${adjustedStart > 0 ? '...' : ''}${snippet}${end < text.length ? '...' : ''}`;
        };

        const buildRankedRagContext = (ragResults, options = {}) => {
            const maxChunks = Number.isFinite(options.maxChunks) ? options.maxChunks : 6;
            const maxPerDocument = Number.isFinite(options.maxPerDocument) ? options.maxPerDocument : 3;
            const maxCharsPerChunk = Number.isFinite(options.maxCharsPerChunk) ? options.maxCharsPerChunk : 650;
            const totalBudgetChars = Number.isFinite(options.totalBudgetChars) ? options.totalBudgetChars : 3600;
            const queryText = String(options.query || '').trim();

            const safeResults = Array.isArray(ragResults) ? ragResults : [];
            const sorted = [...safeResults].sort((a, b) => (Number(b?.similarity || 0) - Number(a?.similarity || 0)));
            const perDocCount = new Map();
            const picked = [];
            let usedChars = 0;

            for (const item of sorted) {
                if (picked.length >= maxChunks || usedChars >= totalBudgetChars) break;

                const docId = String(item?.documentId || 'unknown');
                const currentDocCount = perDocCount.get(docId) || 0;
                if (currentDocCount >= maxPerDocument) continue;

                const rawText = String(item?.text || '').trim();
                if (!rawText) continue;

                const clipped = buildQueryFocusedSnippet(rawText, queryText, maxCharsPerChunk);

                const pageNum = item?.metadata?.pageNumber || item?.pageNumber || 'unknown';
                const docName = item?.documentName || 'Unknown Document';
                const entry = `[Document: ${docName} | Page: ${pageNum} | Score: ${Number(item?.similarity || 0).toFixed(3)}]\n${clipped}`;

                const nextUsed = usedChars + entry.length;
                if (nextUsed > totalBudgetChars) continue;

                picked.push(entry);
                usedChars = nextUsed;
                perDocCount.set(docId, currentDocCount + 1);
            }

            return picked.join('\n\n');
        };

        try {
            // Generate a unique request ID
            this.currentRequestId = `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

            // Check if we're in document questioning mode
            const scopedDocument = (window.RAG_Utils && typeof window.RAG_Utils.getActiveDocumentConversation === 'function')
                ? (window.RAG_Utils.getActiveDocumentConversation(conversationScopeKey) || null)
                : null;
            const documentId = scopedDocument?.documentId
                || (allowGlobalDocumentFallback ? localStorage.getItem('ragQuestioningDocumentId') : null);
            // Also allow triggering the document+websearch flow when the Documents tab is selected
            const isDocumentsTabSelected = document.querySelector('.tab-button[data-tab="documents"]')?.classList.contains('active');
            let documentName;
            documentName = scopedDocument?.documentName || null;
            if (!documentName && allowGlobalDocumentFallback) {
                try {
                    documentName = await PaiperworkDB.secureLocalStorageGet('ragQuestioningDocumentName');
                } catch (err) {
                    console.error('Chat: could not load secure ragQuestioningDocumentName, falling back to plain localStorage', err);
                    documentName = localStorage.getItem('ragQuestioningDocumentName');
                }
            }

            // Check if web search is enabled
            const webSearchEnabled = document.getElementById('web-search').classList.contains('active');
            /*console.info('[Chat][debug] response routing state', {
                conversationScopeKey,
                scopedDocument,
                documentId,
                documentName,
                webSearchEnabled,
                isDocumentsTabSelected
            });*/

            const aiDiv = document.createElement('div');
            aiDiv.className = 'assistant-message';
            aiDiv.dataset.messageId = conversationMessageIds.assistantMessageId;
            applyWhatsappRequestMetadata(aiDiv);
            applyWechatRequestMetadata(aiDiv);
            aiReplies.appendChild(aiDiv);

            const streamProcessor = new StreamProcessor();

            //  CRITICAL FIX: Ensure StreamProcessor has the latest thinking state (prefer helper if present)
            streamProcessor._cachedThinkingEnabled = (window.ThinkingState && typeof window.ThinkingState.getEffectiveThinkingEnabled === 'function')
                ? window.ThinkingState.getEffectiveThinkingEnabled()
                : (localStorage.getItem('thinkingEnabled') === 'true');
           //console.log('🧠 Chat: Created StreamProcessor with thinking state:', streamProcessor._cachedThinkingEnabled);

            // Detach the auto-created container from aiReplies
            const autoContainer = streamProcessor.responseContainer;
            if (autoContainer.parentNode) {
                autoContainer.parentNode.removeChild(autoContainer);
            }

            // Add it to our aiDiv
            aiDiv.appendChild(streamProcessor.responseContainer);

            let response;
            // Prefer a stored documentId (single-document RAG). If absent, but the Documents
            // tab is active, run the RAG over all stored documents and continue with the
            // same document+websearch flow.
            if (webSearchEnabled && (documentId || isDocumentsTabSelected)) {
                try {
                    // Step 1: First get document context
                    const constraints = documentId ? { documentId: documentId } : {};
                    const ragResults = await RAG.searchDocumentsWithConstraint(
                        prompt,
                        hashedMasterKey,
                        modelSelector.value,
                        constraints
                    );

                    const documentContext = buildRankedRagContext(ragResults, {
                        maxChunks: 6,
                        maxPerDocument: 4,
                        maxCharsPerChunk: 650,
                        totalBudgetChars: 3800
                    });

                    //  FIX: Remove duplicate AI div and streamProcessor creation
                    // Use the existing aiDiv and streamProcessor from above

                    // Step 2: Process document response first
                    streamProcessor.processChunk('<h3>📄 Document Information</h3>');

                    // Get response from document only
                    const documentSystemPrompt = `${enhancedSystemPrompt || ''}\n\nAnswer the user's question based ONLY on this document context:\n\n${documentContext || ''}\n\nProvide a concise response using only information from the document. Do NOT reference web sources yet.`;

                    //  CRITICAL FIX: Pass streamProcessor to enable native thinking
                    const documentResponse = await OllamaAPI.sendToOllama(
                        prompt,
                        documentSystemPrompt,
                        contextSize,
                        OllamaAPI.previousContext,
                        this.globalAbortController.signal,
                        this.currentRequestId + "_doc",
                        streamProcessor //  ADD: Pass streamProcessor for thinking support
                    );

                    //  CRITICAL FIX: Check if response was handled by StreamProcessor
                    if (documentResponse && documentResponse.success && documentResponse.streamProcessor) {
                       //console.log('🧠 Chat: Document response fully handled by OllamaAPI with thinking support');
                        // Skip manual stream processing since it was handled by sendToOllama
                    } else {
                        //  FALLBACK: Manual stream processing if needed
                        const docReader = documentResponse.body.getReader();
                        const decoder = new TextDecoder();
                        let documentAnswer = '';
                        let streamBuffer = '';

                        // Read document response
                        while (true) {
                            const { value, done } = await docReader.read();
                            streamBuffer += decoder.decode(value || new Uint8Array(), { stream: !done });
                            const lines = streamBuffer.split('\n');
                            streamBuffer = lines.pop() || '';

                            for (const line of lines) {
                                if (line.trim()) {
                                    try {
                                        const data = JSON.parse(line);
                                        const responseChunk = data.response || data.message?.content || '';
                                        if (responseChunk) {
                                            streamProcessor.processChunk(responseChunk);
                                            documentAnswer += responseChunk;
                                        }
                                        this.scrollToBottom();

                                        if (data.done) {
                                            // Document response finished, save context
                                            OllamaAPI.previousContext = data.context;
                                        }
                                    } catch (error) {
                                        console.error('Chat: Error processing document response chunk:', error);
                                    }
                                }
                            }

                            if (done) {
                                const tail = streamBuffer.trim();
                                if (tail) {
                                    try {
                                        const data = JSON.parse(tail);
                                        const responseChunk = data.response || data.message?.content || '';
                                        if (responseChunk) {
                                            streamProcessor.processChunk(responseChunk);
                                            documentAnswer += responseChunk;
                                        }
                                        this.scrollToBottom();
                                        if (data.done) {
                                            OllamaAPI.previousContext = data.context;
                                        }
                                    } catch (error) {
                                        console.error('Chat: Error processing document response tail chunk:', error);
                                    }
                                }
                                break;
                            }
                        }
                    }

                    streamProcessor.processChunk(`\n\n<div class="search-transition">${Lang.get('webSearchTransition')}</div>\n\n`);
                    this.scrollToBottom();

                    // Get the document answer for web search query generation
                    let documentAnswer = streamProcessor.responseContainer.textContent || '';

                    // Prepare web search query based on DOCUMENT ANSWER
                    let searchQuery = '';
                    try {
                        const webSearchPrompt = `Based on the document answer below, create a VERY SHORT search query (10-15 words) that will find ADDITIONAL information to expand the answer.

                    DOCUMENT ANSWER:
                    --------------------
                    ${documentAnswer.substring(0, 1000)}
                    --------------------
                    
                    Focus on: 
                    1. Key terms from the answer that need more information
                    2. Aspects mentioned but not detailed in the answer
                    3. Potential gaps in the document's coverage of the topic
                    
                    When citing sources in your response, ALWAYS use Markdown link format like [Title or description](URL) - never use [REF] or reference numbers.
                    
                    Return ONLY the search query words with no explanations, quotes or additional text.`;

                        //  CRITICAL FIX: Use a separate streamProcessor for search query generation
                        const searchQueryResponse = await OllamaAPI.sendToOllama(
                            webSearchPrompt,
                            Lang.get('searchQueryOptimizerPrompt'),
                            contextSize,
                            null,
                            this.globalAbortController.signal,
                            this.currentRequestId + "_query",
                            null //  No streamProcessor for query generation
                        );

                        // Extract search query
                        if (searchQueryResponse && !searchQueryResponse.success) {
                            const searchQueryReader = searchQueryResponse.body.getReader();
                            const decoder = new TextDecoder();
                            let streamBuffer = '';
                            let reachedDone = false;

                            while (true) {
                                const { value, done } = await searchQueryReader.read();
                                streamBuffer += decoder.decode(value || new Uint8Array(), { stream: !done });
                                const lines = streamBuffer.split('\n');
                                streamBuffer = lines.pop() || '';

                                for (const line of lines) {
                                    if (line.trim()) {
                                        try {
                                            const data = JSON.parse(line);
                                            searchQuery += data.response || data.message?.content || '';
                                            if (data.done) {
                                                reachedDone = true;
                                                break;
                                            }
                                        } catch (error) {
                                            console.error('Chat: Error processing search query response:', error);
                                        }
                                    }
                                }

                                if (reachedDone) break;

                                if (done) {
                                    const tail = streamBuffer.trim();
                                    if (tail) {
                                        try {
                                            const data = JSON.parse(tail);
                                            searchQuery += data.response || data.message?.content || '';
                                        } catch (error) {
                                            console.error('Chat: Error processing search query response tail:', error);
                                        }
                                    }
                                    break;
                                }
                            }
                        }

                        // Clean up query
                        searchQuery = searchQuery.trim()
                            .replace(/^["']|["']$/g, '')
                            .replace(/^search\s+for\s+|^find\s+|^query\s+|^search\s+/i, '')
                            .replace(/\.$/, '');

                        // Fallback to user prompt if something went wrong
                        if (!searchQuery || searchQuery.length < 3) {
                            const words = prompt.split(/\s+/);
                            searchQuery = words.slice(0, Math.min(words.length, 10)).join(' ');
                        }

                    } catch (error) {
                        console.error('Chat: Error generating search query:', error);
                        searchQuery = prompt.split(/\s+/).slice(0, 10).join(' ');
                    }

                    streamProcessor.processChunk(`<h3>${Lang.get('webSearchInfo')}</h3>`);
                    this.scrollToBottom();

                    try {
                        //  CRITICAL FIX: Use the optimized sendToOllamaWithWebSearch with thinking support
                        await OllamaAPI.sendToOllamaWithWebSearch(
                            searchQuery,
                            `You are examining web search results to enhance information from a document.
                                                            
                        Document information provided:
                        ${documentAnswer.substring(0, 2000) || ''}
                        
                        Instructions:
                        1. Focus ONLY on information that complements or updates what's in the document
                        2. ALWAYS cite web sources using Markdown link format like [Title](URL)
                        3. Reference: "According to [Harvard Business Review](https://hbr.org/article)" NOT "[1]" or "Source [1]"
                        4. Make clear when you're providing web information vs document information
                        5. Present the web information as a helpful extension to the document-based answer`,
                            true,
                            this.globalAbortController.signal,
                            documentAnswer.substring(0, 2000),
                            true,
                            forceNewGroup,
                            window.currentConversationGroup
                        );

                        // Finalize the response
                        this.addMessageActionsToMessage(aiDiv);
                        streamProcessor.finishResponse();

                        // Store conversation
                        const aiResponse = (streamProcessor && typeof streamProcessor.getCleanResponseHTML === 'function')
                            ? streamProcessor.getCleanResponseHTML()
                            : streamProcessor.responseContainer.outerHTML;
                        await PaiperworkDB.storeConversationOnly(
                            hashedMasterKey,
                            prompt,
                            aiResponse,
                            forceNewGroup,
                            window.currentConversationGroup,
                            conversationMessageIds
                        );

                        if (window.forceNewConversationGroup) {
                           //console.log('Chat: Reset forceNewConversationGroup flag after conversation storage');
                            window.forceNewConversationGroup = false;
                        }

                        if (window.currentConversationGroup) {
                            await PaiperworkDB.touchConversationGroup(hashedMasterKey, window.currentConversationGroup);
                            await this.refreshConversationListIfNeeded(hashedMasterKey, window.currentConversationGroup);
                        }

                    } catch (error) {
                        console.error('Chat: Error in web search enhancement:', error);

                        if (error.name === 'AbortError') {
                           //console.log('Chat: Web search was aborted by user');
                        } else {
                            streamProcessor.processChunk(`<p><em>Error enhancing with web search: ${error.message}</em></p>`);
                        }

                        // Finalize response even if there was an error
                        this.addMessageActionsToMessage(aiDiv);
                        streamProcessor.finishResponse();
                        const aiResponse = (streamProcessor && typeof streamProcessor.getCleanResponseHTML === 'function')
                            ? streamProcessor.getCleanResponseHTML()
                            : streamProcessor.responseContainer.outerHTML;
                        await PaiperworkDB.storeConversationOnly(
                            hashedMasterKey,
                            prompt,
                            aiResponse,
                            forceNewGroup,
                            window.currentConversationGroup,
                            conversationMessageIds
                        );
                    }

                    if (window.currentConversationGroup) {
                        await PaiperworkDB.touchConversationGroup(hashedMasterKey, window.currentConversationGroup);
                        await this.refreshConversationListIfNeeded(hashedMasterKey, window.currentConversationGroup);
                    }

                    // Reset UI state
                    window.isGenerating = false;
                    this.isGenerating = false;
                    sendButton.textContent = Lang.get('sendButton');
                    sendButton.classList.remove('cancel-state');
                    sendButton.style.backgroundColor = '';
                    sendButton.style.color = '';
                    progressBar.classList.remove('active', 'indeterminate');
                    this.globalAbortController = null;
                    window.globalAbortController = null;

                } catch (error) {
                    console.error('Chat: Error in document + web search mode:', error);

                    if (this.handleOllamaRateLimitInChat(error, aiReplies)) {
                        return;
                    }

                    const handledCloudAuth = await this.handleCloudAuthFailureIfNeeded(error);
                    if (handledCloudAuth) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'system-message';
                        errorDiv.innerHTML = `<div class="message-bubble error">${(Lang.get && Lang.get('ollamaApiKeyRequired')) || 'An Ollama API key is required to use cloud models.'}</div>`;
                        aiReplies.appendChild(errorDiv);
                        return;
                    }

                    // Display error message
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'system-message';
                    errorDiv.innerHTML = `<div class="message-bubble error">${Lang.get('errorOccurred').replace('{error}', error.message)}</div>`;
                    aiReplies.appendChild(errorDiv);
                }

                return; // Skip the standard response handling

            } else if (webSearchEnabled) {
               //console.log('Chat: Web search enabled, checking for images');

                // FIXED: Declare these variables at the beginning of the web search block
                const modelSelector = document.getElementById('model-selector');
                const isGemma3 = modelSelector.value.toLowerCase().includes('gemma3');
                const hasValidSingleImage = window.selectedImage && typeof window.selectedImage === 'string' && window.selectedImage.trim().length > 0;
                const hasValidMultiImages = isGemma3 && window.selectedImages && Array.isArray(window.selectedImages) && window.selectedImages.length > 0;
                const hasValidImageData = hasValidSingleImage || hasValidMultiImages;

                if (hasValidImageData && OllamaAPI.isVisualModel(modelSelector.value)) {
                   //console.log('Chat: Image + Web search mode detected');

                    try {
                        // Step 1: Send image + prompt to AI to get a descriptive search query
                        streamProcessor.processChunk('<h3>🔍 Analyzing image for web search...</h3>');
                        this.scrollToBottom();

                        const imageAnalysisPrompt = `Analyze this image and the user's request: "${prompt}"
                        
                        Create a detailed web search query (10-20 words) that will help find similar images, related information, or answer the user's question about this image.
                        
                        Focus on:
                        1. Key visual elements (objects, style, colors, composition)
                        2. The user's specific intent from their message
                        3. Technical aspects if relevant (photography style, art technique, etc.)
                        
                        Return ONLY the search query words with no explanations, quotes, or additional text.`;

                        // Use sendToOllamaWithImage to analyze the image
                        let searchQueryResponse;
                        if (hasValidMultiImages) {
                            searchQueryResponse = await OllamaAPI.sendToOllamaWithImage(
                                imageAnalysisPrompt,
                                'You are an expert at analyzing images and creating effective search queries.',
                                contextSize,
                                null, // single image data
                                null, // previous context
                                this.globalAbortController.signal,
                                this.currentRequestId + "_image_analysis",
                                window.selectedImages, // multi-images
                                null, // model override
                                null // no streamProcessor for this step
                            );
                        } else {
                            searchQueryResponse = await OllamaAPI.sendToOllamaWithImage(
                                imageAnalysisPrompt,
                                'You are an expert at analyzing images and creating effective search queries.',
                                contextSize,
                                window.selectedImage,
                                null, // previous context
                                this.globalAbortController.signal,
                                this.currentRequestId + "_image_analysis",
                                null, // multi-images
                                null, // model override
                                null // no streamProcessor for this step
                            );
                        }

                        // Extract the search query from the response
                        let searchQuery = '';
                        if (searchQueryResponse && searchQueryResponse.body) {
                            const reader = searchQueryResponse.body.getReader();
                            const decoder = new TextDecoder();
                            let streamBuffer = '';
                            let reachedDone = false;

                            while (true) {
                                const { value, done } = await reader.read();
                                streamBuffer += decoder.decode(value || new Uint8Array(), { stream: !done });
                                const lines = streamBuffer.split('\n');
                                streamBuffer = lines.pop() || '';

                                for (const line of lines) {
                                    if (line.trim()) {
                                        try {
                                            const data = JSON.parse(line);
                                            searchQuery += data.response || data.message?.content || '';
                                            if (data.done) {
                                                reachedDone = true;
                                                break;
                                            }
                                        } catch (error) {
                                            console.error('Error parsing image analysis response:', error);
                                        }
                                    }
                                }

                                if (reachedDone) break;

                                if (done) {
                                    const tail = streamBuffer.trim();
                                    if (tail) {
                                        try {
                                            const data = JSON.parse(tail);
                                            searchQuery += data.response || data.message?.content || '';
                                        } catch (error) {
                                            console.error('Error parsing image analysis response tail:', error);
                                        }
                                    }
                                    break;
                                }
                            }
                        }

                        // Clean up the search query
                        searchQuery = searchQuery.trim()
                            .replace(/^["']|["']$/g, '') // Remove quotes
                            .replace(/^search\s+for\s+|^find\s+|^query\s+|^search\s+/i, '') // Remove search prefixes
                            .replace(/\.$/, ''); // Remove trailing period

                        // Fallback to original prompt if analysis failed
                        if (!searchQuery || searchQuery.length < 3) {
                            console.warn('Image analysis produced poor search query, using original prompt');
                            searchQuery = prompt.split(/\s+/).slice(0, 10).join(' ');
                        }

                       //console.log('Generated search query from image analysis:', searchQuery);

                        // Step 2: Perform web search with the generated query
                        streamProcessor.processChunk(`\n\n<h3>🌐 Searching the web for: "${searchQuery}"</h3>`);
                        this.scrollToBottom();

                        // Step 3: Use the existing web search infrastructure
                        const webSearchResults = await WebSearch.smartSearch(searchQuery, new Date(), false);

                        let webSearchContext = '';
                        if (webSearchResults && webSearchResults.items && webSearchResults.items.length > 0) {
                            webSearchContext = WebSearch.formatSearchResults(webSearchResults, false);
                           //console.log('Web search found results for image query:', webSearchResults.items.length);
                        } else {
                            webSearchContext = 'Web search found no relevant results for this image-based query.';
                        }

                        // Step 4: Send the original image + prompt + web results back to AI for final response
                        streamProcessor.processChunk(`\n\n<h3>💡 Generating response with web search results...</h3>`);
                        this.scrollToBottom();

                        const finalSystemPrompt = `${enhancedSystemPrompt || ''}

                        Web search results for the image query "${searchQuery}":
                        ${webSearchContext}
                        
                        Instructions:
                        1. Analyze the provided image(s) carefully
                        2. Consider the user's original request: "${prompt}"
                        3. Use the web search results to provide additional context, similar images, or related information
                        4. ALWAYS cite web sources using Markdown link format like [Title](URL)
                        5. Combine your visual analysis with the web search findings
                        6. If the search found similar images or related content, mention and link to them`;

                        // Final AI response with image + web context
                        let finalResponse;
                        if (hasValidMultiImages) {
                            finalResponse = await OllamaAPI.sendToOllamaWithImage(
                                prompt,
                                finalSystemPrompt,
                                contextSize,
                                null, // single image data
                                OllamaAPI.previousContext,
                                this.globalAbortController.signal,
                                this.currentRequestId + "_final",
                                window.selectedImages, // multi-images
                                null, // model override
                                streamProcessor // Pass streamProcessor for thinking support
                            );
                        } else {
                            finalResponse = await OllamaAPI.sendToOllamaWithImage(
                                prompt,
                                finalSystemPrompt,
                                contextSize,
                                window.selectedImage,
                                OllamaAPI.previousContext,
                                this.globalAbortController.signal,
                                this.currentRequestId + "_final",
                                null, // multi-images
                                null, // model override
                                streamProcessor // Pass streamProcessor for thinking support
                            );
                        }

                        // Check if response was handled by StreamProcessor
                        if (finalResponse && finalResponse.success && finalResponse.streamProcessor) {
                           //console.log('🧠 Chat: Image + Web search response fully handled by OllamaAPI');

                            // Handle final cleanup
                            this.addMessageActionsToMessage(aiDiv);

                            // Store conversation data
                            const dbData = await PaiperworkDB.getExistingDatabase(hashedMasterKey);
                            if (dbData) {
                                await PaiperworkDB.storeConversationOnly(
                                    hashedMasterKey,
                                    prompt,
                                    streamProcessor.getCleanResponseHTML(),
                                    forceNewGroup,
                                    window.currentConversationGroup,
                                    conversationMessageIds
                                );

                                await this.processInsightsIfEnabled(prompt, promptInput, sendButton, hashedMasterKey);

                                // Update conversation group
                                if (window.currentConversationGroup) {
                                    await PaiperworkDB.touchConversationGroup(hashedMasterKey, window.currentConversationGroup);
                                    await this.refreshConversationListIfNeeded(hashedMasterKey, window.currentConversationGroup);
                                }
                            }

                            return; // Exit early since response was handled
                        }

                        // Fallback manual processing if needed
                        if (finalResponse && finalResponse.body) {
                            const reader = finalResponse.body.getReader();
                            const decoder = new TextDecoder();
                            let streamBuffer = '';
                            let reachedDone = false;

                            while (true) {
                                const { value, done } = await reader.read();
                                streamBuffer += decoder.decode(value || new Uint8Array(), { stream: !done });
                                const lines = streamBuffer.split('\n');
                                streamBuffer = lines.pop() || '';

                                for (const line of lines) {
                                    if (line.trim()) {
                                        try {
                                            const data = JSON.parse(line);
                                            if (data.done) {
                                                streamProcessor.finishResponse();
                                                this.addMessageActionsToMessage(aiDiv);

                                                // Store conversation
                                                await PaiperworkDB.storeConversationOnly(
                                                    hashedMasterKey,
                                                    prompt,
                                                    streamProcessor.getCleanResponseHTML(),
                                                    forceNewGroup,
                                                    window.currentConversationGroup,
                                                    conversationMessageIds
                                                );

                                                await this.processInsightsIfEnabled(prompt, promptInput, sendButton, hashedMasterKey);

                                                if (window.currentConversationGroup) {
                                                    await PaiperworkDB.touchConversationGroup(hashedMasterKey, window.currentConversationGroup);
                                                    await this.refreshConversationListIfNeeded(hashedMasterKey, window.currentConversationGroup);
                                                }

                                                return;
                                            } else {
                                                const responseChunk = data.response || data.message?.content;
                                                if (responseChunk) {
                                                    streamProcessor.processChunk(responseChunk);
                                                }
                                                this.scrollToBottom();
                                            }
                                        } catch (error) {
                                            console.error('Error processing final response chunk:', error);
                                        }
                                    }
                                }

                                if (reachedDone) break;

                                if (done) {
                                    const tail = streamBuffer.trim();
                                    if (tail) {
                                        try {
                                            const data = JSON.parse(tail);
                                            if (data.done) {
                                                streamProcessor.finishResponse();
                                                this.addMessageActionsToMessage(aiDiv);

                                                await PaiperworkDB.storeConversationOnly(
                                                    hashedMasterKey,
                                                    prompt,
                                                    streamProcessor.getCleanResponseHTML(),
                                                    forceNewGroup,
                                                    window.currentConversationGroup,
                                                    conversationMessageIds
                                                );

                                                if (window.currentConversationGroup) {
                                                    await PaiperworkDB.touchConversationGroup(hashedMasterKey, window.currentConversationGroup);
                                                    await this.refreshConversationListIfNeeded(hashedMasterKey, window.currentConversationGroup);
                                                }

                                                return;
                                            } else {
                                                const responseChunk = data.response || data.message?.content;
                                                if (responseChunk) {
                                                    streamProcessor.processChunk(responseChunk);
                                                    this.scrollToBottom();
                                                }
                                            }
                                        } catch (error) {
                                            console.error('Error processing final response tail chunk:', error);
                                        }
                                    }
                                    break;
                                }
                            }
                        }

                    } catch (error) {
                        console.error('Chat: Error in image + web search mode:', error);

                        if (error.name === 'AbortError') {
                           //console.log('Chat: Image + web search was aborted');
                            this.cleanupIncompleteResponses();
                            return;
                        }

                        // Show error in chat
                        streamProcessor.processChunk(`\n\n<div class="error-message" style="color: #ef4444; padding: 10px; background: rgba(239, 68, 68, 0.1); border-radius: 6px;">
                        <strong>Error in image web search:</strong> ${error.message}
                        </div>`);
                        streamProcessor.finishResponse();
                        this.addMessageActionsToMessage(aiDiv);
                    }

                    return; // Skip standard web search processing

                } else {
                    // Handle case where we have images but model isn't visual
                    if (hasValidImageData && !OllamaAPI.isVisualModel(modelSelector.value)) {
                        console.warn('Chat: Images detected but model is not visual, proceeding with text-only web search');
                        streamProcessor.processChunk(`<div class="warning-message" style="color: #f59e0b; padding: 8px; background: rgba(245, 158, 11, 0.1); border-radius: 4px; margin-bottom: 10px;">
                        <strong>Note:</strong> You uploaded an image, but ${modelSelector.value} is not a visual model. The search will be based on your text prompt only.
                        </div>`);
                    }

                    // Standard web search without images (existing code)
                   //console.log('Chat: Standard web search without images');

                    try {
                        //  CRITICAL FIX: Standard web search with thinking support
                        response = await OllamaAPI.sendToOllamaWithWebSearch(
                            prompt,
                            enhancedSystemPrompt,
                            true, // includeContext
                            this.globalAbortController.signal,
                            '', // documentContext
                            false, // isDocumentWebSearch
                            forceNewGroup,
                            window.currentConversationGroup,
                            async () => await this.processInsightsIfEnabled(prompt, promptInput, sendButton, hashedMasterKey)
                        );

                        // Check if the response was aborted
                        if (!response && this.globalAbortController.signal.aborted) {
                           //console.log('Chat: Request was aborted by user');
                            this.cleanupIncompleteResponses();
                            return;
                        }

                        //  IMPORTANT: The sendToOllamaWithWebSearch method now handles everything internally
                        // including streamProcessor creation and thinking support, so we don't need manual processing

                    } catch (error) {
                        console.error('Chat: Error in web search:', error);

                        if (error.name === 'AbortError') {
                           //console.log('Chat: Request was aborted');
                            this.cleanupIncompleteResponses();
                            return;
                        }

                        // For other errors, show a message in the chat
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'system-message';
                        errorDiv.innerHTML = `<div class="message-bubble error">${Lang.get('webSearchError').replace('{error}', error.message)}</div>`;
                        aiReplies.appendChild(errorDiv);
                        return;
                    }
                }

            } else {
                // No web search mode
               //console.log('Chat: Standard mode without web search');

                if (documentId) {
                    // RAG only
                    /*console.info('[Chat][debug] entering document-specific RAG branch', {
                        conversationScopeKey,
                        documentId,
                        documentName
                    });*/
                   //console.log('Chat: Using document-specific RAG for document ID:', documentId);

                    // Get document context
                    const ragResults = await RAG.searchDocumentsWithConstraint(
                        prompt,
                        hashedMasterKey,
                        modelSelector.value,
                        { documentId: documentId }
                    );

                    const documentRagLogPayload = {
                        prompt,
                        documentId,
                        documentName,
                        chunkCount: Array.isArray(ragResults) ? ragResults.length : 0,
                        chunks: Array.isArray(ragResults)
                            ? ragResults.map((result, index) => ({
                                index: index + 1,
                                documentId: result.documentId,
                                documentName: result.documentName || documentName || null,
                                similarity: result.similarity,
                                text: result.text,
                                metadata: result.metadata || null
                            }))
                            : []
                    };
                    //console.info('[Chat][document-rag] Retrieved chunks for document questioning', JSON.stringify(documentRagLogPayload, null, 2));

                   //console.log(`Chat: RAG: Found ${ragResults.length} chunks from document ${documentId}`);

                    // If no chunks found, inform user
                    if (!ragResults || ragResults.length === 0) {
                        // Create an AI response explaining that no relevant content was found
                        const noContentResponse = await OllamaAPI.sendToOllama(
                            prompt,
                            `${enhancedSystemPrompt || ''}\n\nYou are in document question mode for a document but no relevant content was found. Inform the user that you couldn't find relevant information in their document and suggest they try a different question.`,
                            contextSize,
                            OllamaAPI.previousContext,
                            this.globalAbortController.signal,
                            this.currentRequestId + "_no_content",
                            streamProcessor //  ADD: Pass streamProcessor for thinking support
                        );

                        // Return early since we have no context
                        return noContentResponse;
                    }

                    const context = ragResults.map(result => result.text).join('\n\n');
                    const rankedContext = buildRankedRagContext(ragResults, {
                        maxChunks: 5,
                        maxPerDocument: 3,
                        maxCharsPerChunk: ragResults.length === 1 ? 2200 : 700,
                        totalBudgetChars: ragResults.length === 1 ? 5000 : 3400,
                        query: prompt
                    });
                    const ragSystemPrompt = `${enhancedSystemPrompt || ''}\n\nAnswer the user's question based on the following information retrieved from the document. Only use information from this document to answer:\n\n${rankedContext || ''}`;

                   //console.log(`Chat: RAG: Found ${ragResults.length} matching chunks for document ${documentId}`);
                   //console.log('Chat: RAG: Context length:', context.length > 0 ? context.length : "Empty context!");

                    if (!context || context.length === 0) {
                        console.warn('Chat: RAG: No context found for document questioning!');
                    }

                    //  CRITICAL FIX: Pass streamProcessor to enable native thinking
                    response = await OllamaAPI.sendToOllama(
                        prompt,
                        ragSystemPrompt,
                        contextSize,
                        OllamaAPI.previousContext,
                        this.globalAbortController.signal,
                        this.currentRequestId,
                        streamProcessor //  ADD: Pass streamProcessor for thinking support
                    );

                } else {
                    // Regular chat without RAG
                    const isGemma3 = modelSelector.value.toLowerCase().includes('gemma3');
                    const hasValidSingleImage = window.selectedImage && typeof window.selectedImage === 'string' && window.selectedImage.trim().length > 0;
                    const hasValidMultiImages = isGemma3 && window.selectedImages && Array.isArray(window.selectedImages) && window.selectedImages.length > 0;
                    const hasValidImageData = hasValidSingleImage || hasValidMultiImages;

                    if (hasValidImageData && OllamaAPI.isVisualModel(modelSelector.value)) {
                       //console.log('Chat: Including image in prompt for visual model');
                        const isMultiImageModel = isGemma3 && hasValidMultiImages;

                        //  CRITICAL FIX: Pass streamProcessor to enable native thinking
                        response = await OllamaAPI.sendToOllamaWithImage(
                            prompt,
                            enhancedSystemPrompt,
                            contextSize,
                            isMultiImageModel ? null : window.selectedImage,
                            OllamaAPI.previousContext,
                            this.globalAbortController.signal,
                            this.currentRequestId,
                            isMultiImageModel ? window.selectedImages : null,
                            null, // modelOverride
                            streamProcessor //  ADD: Pass streamProcessor for thinking support
                        );
                    } else {
                        //  CRITICAL FIX: Pass streamProcessor to enable native thinking
                        response = await OllamaAPI.sendToOllama(
                            prompt,
                            enhancedSystemPrompt,
                            contextSize,
                            OllamaAPI.previousContext,
                            this.globalAbortController.signal,
                            this.currentRequestId,
                            streamProcessor //  ADD: Pass streamProcessor for thinking support
                        );
                    }
                }
            }

            //  CRITICAL CHECK: If response was handled by StreamProcessor, skip manual processing
            if (response && response.success && response.streamProcessor) {
                if (response.partial || response.interrupted) {
                    console.warn('Chat: Stream completed with partial/interrupted flag', {
                        requestId: this.currentRequestId,
                        documentMode: !!documentId,
                        partial: !!response.partial,
                        interrupted: !!response.interrupted,
                        model: modelSelector?.value || ''
                    });
                }

                // Response was fully processed by sendToOllama, we're done!
               //console.log('🧠 Chat: Response fully handled by OllamaAPI with thinking support');

                // Handle final cleanup
                this.addMessageActionsToMessage(aiDiv);

                // Store conversation data
                const dbData = await PaiperworkDB.getExistingDatabase(hashedMasterKey);
                if (dbData) {
                    await PaiperworkDB.storeConversationOnly(
                        hashedMasterKey,
                        prompt,
                        streamProcessor.getCleanResponseHTML(),
                        forceNewGroup,
                        window.currentConversationGroup,
                        conversationMessageIds
                    );

                    await this.processInsightsIfEnabled(prompt, promptInput, sendButton, hashedMasterKey);

                    // Update conversation group
                    if (window.currentConversationGroup) {
                        await PaiperworkDB.touchConversationGroup(hashedMasterKey, window.currentConversationGroup);
                        await this.refreshConversationListIfNeeded(hashedMasterKey, window.currentConversationGroup);
                    }
                }

                // Reset UI state
                progressBar.classList.remove('active', 'indeterminate');
                sendButton.textContent = Lang.get('sendButton');
                sendButton.classList.remove('cancel-state');
                sendButton.style.backgroundColor = '';
                sendButton.style.color = '';
                window.isGenerating = false;
                this.isGenerating = false;
                this.globalAbortController = null;
                window.globalAbortController = null;
                this.deactivateWebSearchButton();

                return; //  CRITICAL: Exit early to skip manual stream processing
            }

            //  FALLBACK: Manual stream processing if response wasn't handled by StreamProcessor
            // Make sure only proceed to read the response body if we have a valid response
            if (!response) {
                console.warn('Chat: No standard response object received from Ollama');
                // Check if this is web search mode - response might be handled differently
                if (webSearchEnabled) {
                   //console.log('Chat: Web search mode completed without standard response object');
                    // Skip the error for web search since it handles its own response
                    return;
                } else {
                    if (this.consumePendingCloudAccessErrorInChat(aiReplies)) {
                        return;
                    }
                    console.error('Chat: No response received from Ollama');
                    throw new Error('No response received from Ollama');
                }
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama request failed (${response.status}): ${errorText || response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let streamBuffer = '';

            // Process the response stream
            while (true) {
                const { value, done } = await reader.read();

                if (this.globalAbortController && this.globalAbortController.signal.aborted) {
                   //console.log('Chat: Abort detected during stream processing');
                    throw new DOMException('The user aborted a request.', 'AbortError');
                }

                streamBuffer += decoder.decode(value || new Uint8Array(), { stream: !done });
                const lines = streamBuffer.split('\n');
                streamBuffer = lines.pop() || '';

                for (const line of lines) {
                    // Add this check for visual model errors
                    if (line.trim() && line.includes('failed to process inputs: this model is missing data required for image input')) {
                        // Show visual model error in the UI
                        const errorMessage = `<div class="error-message" style="color: #ef4444; padding: 10px; background: rgba(239, 68, 68, 0.1); border-radius: 6px; margin: 10px 0;">
                        <strong>Visual Model Error:</strong> This model appears to be missing the necessary components to process images.
                        <ul style="margin-top: 8px; padding-left: 20px;">
                            <li>The model may not be properly quantized or converted to support images</li>
                            <li>Try using a different visual model from the model selector</li>
                            <li>If using a custom model, ensure it was properly converted with visual capabilities</li>
                        </ul>
                    </div>`;

                        streamProcessor.responseContainer.innerHTML = errorMessage;
                        this.cleanupIncompleteResponses();

                        // Log the detailed error for debugging
                        console.warn("Visual model missing image capabilities:", line);
                        return; // Exit the function early
                    }
                    if (line.trim()) {
                        try {
                            const data = JSON.parse(line);
                            if (data.done) {
                                // Processing logic for completed response
                                const buttons = streamProcessor.responseContainer.querySelectorAll('.code-copy-btn');
                                buttons.forEach(button => button.style.display = 'block');
                                this.aiResponse = streamProcessor.responseContainer.outerHTML;
                                window.isGenerating = false;
                                this.isGenerating = false;

                                // Reset button state
                                sendButton.textContent = Lang.get('sendButton');
                                sendButton.classList.remove('cancel-state');
                                sendButton.style.backgroundColor = '';
                                sendButton.style.color = '';

                                // Clear abort controller
                                this.globalAbortController = null;
                                window.globalAbortController = null;
                                this.currentRequestId = null;

                                // Handle context management (cloud responses may omit `context`).
                                if (Array.isArray(data.context)) {
                                    OllamaAPI.previousContext = data.context;
                                    OllamaAPI.updateContextRemaining(data.context.length);
                                }

                                this.addMessageActionsToMessage(aiDiv);
                                streamProcessor.finishResponse();
                                this.deactivateWebSearchButton();

                                // Update UI scroll position
                                if (window.autoScrollEnabled) {
                                    aiReplies.scrollTop = aiReplies.scrollHeight;
                                }

                                // Store conversation data
                                const dbData = await PaiperworkDB.getExistingDatabase(hashedMasterKey);

                                if (dbData) {
                                    // Save conversation
                                    await PaiperworkDB.storeConversationOnly(
                                        hashedMasterKey,
                                        prompt,
                                        streamProcessor.getCleanResponseHTML(),
                                        forceNewGroup,
                                        window.currentConversationGroup,
                                        conversationMessageIds
                                    );

                                    if (window.forceNewConversationGroup) {
                                       //console.log('Chat: Reset forceNewConversationGroup flag after regular conversation storage');
                                        window.forceNewConversationGroup = false;
                                    }
                                    if (window.currentConversationGroup) {
                                        await PaiperworkDB.touchConversationGroup(hashedMasterKey, window.currentConversationGroup);
                                        await this.refreshConversationListIfNeeded(hashedMasterKey, window.currentConversationGroup);
                                    }
                                    await this.processInsightsIfEnabled(prompt, promptInput, sendButton, hashedMasterKey);
                                }
                            }
                            else {
                                const responseChunk = data.response || data.message?.content;
                                if (responseChunk) {
                                    streamProcessor.processChunk(responseChunk);
                                }
                            }
                        } catch (parseError) {
                            console.error('Chat: Error parsing response chunk:', parseError, line);
                        }
                    }
                }

                if (done) {
                    const tail = streamBuffer.trim();
                    if (tail) {
                        try {
                            const data = JSON.parse(tail);
                            if (data.done) {
                                const buttons = streamProcessor.responseContainer.querySelectorAll('.code-copy-btn');
                                buttons.forEach(button => button.style.display = 'block');
                                this.aiResponse = streamProcessor.responseContainer.outerHTML;
                                window.isGenerating = false;
                                this.isGenerating = false;

                                sendButton.textContent = Lang.get('sendButton');
                                sendButton.classList.remove('cancel-state');
                                sendButton.style.backgroundColor = '';
                                sendButton.style.color = '';

                                this.globalAbortController = null;
                                window.globalAbortController = null;
                                this.currentRequestId = null;

                                if (Array.isArray(data.context)) {
                                    OllamaAPI.previousContext = data.context;
                                    OllamaAPI.updateContextRemaining(data.context.length);
                                }

                                this.addMessageActionsToMessage(aiDiv);
                                streamProcessor.finishResponse();

                                if (window.autoScrollEnabled) {
                                    aiReplies.scrollTop = aiReplies.scrollHeight;
                                }

                                const dbData = await PaiperworkDB.getExistingDatabase(hashedMasterKey);

                                if (dbData) {
                                    await PaiperworkDB.storeConversationOnly(
                                        hashedMasterKey,
                                        prompt,
                                        streamProcessor.getCleanResponseHTML(),
                                        forceNewGroup,
                                        window.currentConversationGroup,
                                        conversationMessageIds
                                    );

                                    if (window.forceNewConversationGroup) {
                                        window.forceNewConversationGroup = false;
                                    }
                                    if (window.currentConversationGroup) {
                                        await PaiperworkDB.touchConversationGroup(hashedMasterKey, window.currentConversationGroup);
                                        await this.refreshConversationListIfNeeded(hashedMasterKey, window.currentConversationGroup);
                                    }
                                    await this.processInsightsIfEnabled(prompt, promptInput, sendButton, hashedMasterKey);
                                }
                            }
                            else {
                                const responseChunk = data.response || data.message?.content;
                                if (responseChunk) {
                                    streamProcessor.processChunk(responseChunk);
                                }
                            }
                        } catch (parseError) {
                            console.error('Chat: Error parsing response tail chunk:', parseError, tail);
                        }
                    }
                    break;
                }
            }

            if (window.autoScrollEnabled) {
                requestAnimationFrame(() => {
                    aiReplies.scrollTop = aiReplies.scrollHeight;
                });
            }

        } catch (error) {
            console.error('Chat: Error in stream processing:', error);

            if (error.message && (
                error.message.includes('failed to process inputs: this model is missing data required for image input') ||
                (window.selectedImage && error.message.includes('failed to create new sequence'))
            )) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'assistant-message';
                errorDiv.innerHTML = `<div class="ai-response-container">
                <div class="error-message" style="color: #ef4444; padding: 10px; background: rgba(239, 68, 68, 0.1); border-radius: 6px; margin: 10px 0;">
                   <strong>${Lang.get('visualModelError')}</strong> ${Lang.get('visualModelErrorDetails')}
                    <ul style="margin-top: 8px; padding-left: 20px;">
                        <li>${Lang.get('tryDifferentVisualModel')}</li>
                        <li>${Lang.get('modelImproperlyQuantized')}</li>
                        <li>${Lang.get('checkProperVisualModel')}</li>
                    </ul>
                </div>
            </div>`;
                aiReplies.appendChild(errorDiv);

                console.warn("Visual model error detected:", error.message);
            } else if (error.name === 'AbortError') {
               //console.log('Chat: Request was aborted by user');

                // Reset UI state
                sendButton.textContent = Lang.get('sendButton');
                sendButton.classList.remove('cancel-state');
                sendButton.style.backgroundColor = '';
                sendButton.style.color = '';
                window.isGenerating = false;
                this.isGenerating = false;
                this.cleanupIncompleteResponses();
            } else if (this.handleOllamaCloudAccessErrorInChat(error, aiReplies)) {
                // Specific cloud-access message already shown.
            } else if (this.handleOllamaRateLimitInChat(error, aiReplies)) {
                // Specific usage-limit message already shown.
            } else if (await this.handleCloudAuthFailureIfNeeded(error)) {

                const errorDiv = document.createElement('div');
                errorDiv.className = 'system-message';
                errorDiv.innerHTML = `<div class="message-bubble error">${(Lang.get && Lang.get('ollamaApiKeyRequired')) || 'An Ollama API key is required to use cloud models.'}</div>`;
                aiReplies.appendChild(errorDiv);
            } else {
                // Handle other errors by showing them in chat
                const errorDiv = document.createElement('div');
                errorDiv.className = 'system-message';
                errorDiv.innerHTML = `<div class="message-bubble error">${Lang.get('errorOccurred').replace('{error}', error.message)}</div>`;
                aiReplies.appendChild(errorDiv);
            }
        } finally {
            // Always reset UI state
            progressBar.classList.remove('active', 'indeterminate');

            // Reset the button completely, both class and inline styles
            sendButton.textContent = Lang.get('sendButton');
            sendButton.classList.remove('cancel-state');

            // Add these lines to explicitly reset the inline styles
            sendButton.style.backgroundColor = '';
            sendButton.style.color = '';

            window.isGenerating = false;
            this.isGenerating = false;
            this.globalAbortController = null;
            window.globalAbortController = null;

            this.resetImageData();
        }
    }
    // Displays a full-size image in a modal overlay
    showFullSizeImage(imageSrc) {
        if (!imageSrc) return;

        // Create modal for full-size image
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

        // Add click handler to close
        modal.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Create image
        const img = document.createElement('img');
        img.src = imageSrc;
        img.style.maxWidth = '90%';
        img.style.maxHeight = '90%';
        img.style.objectFit = 'contain';
        img.style.border = '2px solid white';
        img.style.borderRadius = '4px';

        // Prevent click on image from closing modal
        img.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        modal.appendChild(img);
        document.body.appendChild(modal);
    }
    // Cancels ongoing AI generation and resets UI state
    cancelOllamaGeneration() {
       //console.log('Chat: cancelOllamaGeneration called, stack:', new Error().stack);
       //console.log('Chat: Aborting generation');

        // Try to abort using this instance's controller first
        if (this.globalAbortController) {
            try {
                this.globalAbortController.abort();
                this.globalAbortController = null;
                this.isGenerating = false;
                window.isGenerating = false;

                // Reset UI elements
                const progressBar = document.getElementById('progress-bar');
                if (progressBar) {
                    progressBar.classList.remove('active', 'indeterminate');
                }

                // Reset send button
                const sendButton = document.getElementById('send-prompt');
                if (sendButton) {
                   //console.log('Chat: Resetting send button to Send state');
                    sendButton.textContent = Lang.get('sendButton');
                    sendButton.style.backgroundColor = '';
                    sendButton.style.color = '';
                    sendButton.classList.remove('cancel-state');
                }

                // Clean up incomplete responses
                this.cleanupIncompleteResponses();


                this.resetImageData();

                return true;
            } catch (error) {
                console.error('Chat: Error during abort with instance controller:', error);
            }
        }

        // Fallback to global controller if instance one didn't work
        if (window.globalAbortController) {
            try {
               //console.log('Chat: Trying with global abort controller');
                window.globalAbortController.abort();
                window.globalAbortController = null;
                this.isGenerating = false;
                window.isGenerating = false;

                // Reset UI elements
                const progressBar = document.getElementById('progress-bar');
                if (progressBar) {
                    progressBar.classList.remove('active', 'indeterminate');
                }

                // Reset send button
                const sendButton = document.getElementById('send-prompt');
                if (sendButton) {
                    sendButton.textContent = Lang.get('sendButton') || 'Send';
                    sendButton.style.backgroundColor = '';
                    sendButton.style.color = '';
                    sendButton.classList.remove('cancel-state');
                }

                // Clean up incomplete responses
                this.cleanupIncompleteResponses();

                return true;
            } catch (error) {
                console.error('Chat: Error during abort with global controller:', error);
            }
        }

        // If we got here, no controllers worked, but we'll still reset UI
        console.warn('Chat: No active AbortController found when trying to cancel');

        // Reset UI state anyway as a fallback
        window.isGenerating = false;
        this.isGenerating = false;

        const sendButton = document.getElementById('send-prompt');
        if (sendButton) {
            sendButton.textContent = Lang.get('sendButton') || 'Send';
            sendButton.style.backgroundColor = '';
            sendButton.style.color = '';
            sendButton.classList.remove('cancel-state');
        }

        // Try cleaning up responses anyway
        this.cleanupIncompleteResponses();

        return false;
    }
    // Cleans up incomplete AI responses and updates the UI accordingly
    cleanupIncompleteResponses() {
       //console.log('Chat: Cleaning up incomplete responses');

        // FIRST ALWAYS: Check for and cancel ALL active thinking modes
        if (window.activeThinkingModes && window.activeThinkingModes.size > 0) {
           //console.log(`Chat: Found ${window.activeThinkingModes.size} active thinking modes to cancel`);

            // Cancel all active thinking modes
            window.activeThinkingModes.forEach((thinkingMode, id) => {
               //console.log(`Chat: Cancelling thinking mode ${id}`);

                // First clear the timer
                if (thinkingMode.timer) {
                    clearInterval(thinkingMode.timer);
                    thinkingMode.timer = null;

                    // Update UI to show cancelled state
                    if (thinkingMode.timerElement) {
                        const cancelledText = Lang.get('cancelled') || 'cancelled';
                        thinkingMode.timerElement.textContent = `${thinkingMode.elapsedSeconds}s (${cancelledText})`;
                        thinkingMode.timerElement.style.color = 'var(--thinking-cancelled-color, #e53e3e)';
                        thinkingMode.timerElement.style.textDecoration = 'line-through';
                    }

                    // Mark as inactive
                    thinkingMode.active = false;
                    thinkingMode.cancelled = true;
                }
            });

            // Clear the registry
            window.activeThinkingModes.clear();
           //console.log('Chat: All thinking modes cancelled');
        }

        // Get all messages to determine the correct placement for cancel note
        const aiReplies = document.querySelector('.ai-replies');
        if (!aiReplies) return true;

        const allMessages = aiReplies.querySelectorAll('.user-message, .assistant-message');
        if (allMessages.length === 0) return true;

        // Find the last message in the conversation
        const lastMessage = allMessages[allMessages.length - 1];

        // Check if the last message is a user message (meaning AI never started responding)
        const isLastMessageUser = lastMessage.classList.contains('user-message');

        // If the last message is a user message, we need to create a placeholder assistant message
        // or add the cancel note to the user message itself
        if (isLastMessageUser) {
           //console.log('Chat: Last message is from user, AI never started responding');

            // Check if this user message already has a cancel note
            if (!lastMessage.querySelector('.cancel-note')) {
                // Create a separate cancel message that appears on the left
                const cancelMessage = document.createElement('div');
                cancelMessage.className = 'cancel-note user-cancel-note';
                cancelMessage.style.cssText = `
                color: #888;
                font-size: 0.85em;
                font-style: italic;
                margin-top: 5px;
                margin-bottom: 5px;
                padding: 5px 10px;
                background-color: rgba(239, 68, 68, 0.05);
                border-left: 3px solid #ef4444;
                border-radius: 4px;
                text-align: left;
            `;
                cancelMessage.textContent = Lang.get('generationCancelledBeforeStart') || 'Generation was cancelled before AI response';

                // Create a separate regenerate button container that appears on the right
                const regenerateContainer = document.createElement('div');
                regenerateContainer.className = 'regenerate-container user-regenerate-container';
                regenerateContainer.style.cssText = `
                text-align: right;
                margin-top: 5px;
                margin-bottom: 5px;
            `;

                // Add the regenerate button
                const regenerateButton = document.createElement('button');
                regenerateButton.className = 'regenerate-inline-button';
                regenerateButton.textContent = Lang.get('tryAgain') || 'Try Again';
                regenerateButton.style.cssText = `
                background-color: transparent;
                color: var(--accent-color,rgb(252, 252, 255));
                border: 1px solid var(--accent-color, #4f46e5);
                border-radius: 4px;
                padding: 2px 8px;
                font-size: 0.85em;
                cursor: pointer;
                transition: background-color 0.2s, color 0.2s;
            `;

                // Add hover effect
                regenerateButton.addEventListener('mouseenter', () => {
                    regenerateButton.style.backgroundColor = 'var(--accent-color, #4f46e5)';
                    regenerateButton.style.color = 'white';
                });

                regenerateButton.addEventListener('mouseleave', () => {
                    regenerateButton.style.backgroundColor = 'transparent';
                    regenerateButton.style.color = 'var(--accent-color,rgb(255, 255, 255))';
                });

                // FIXED: Add click handler for regeneration - use regenerateMessage instead of handleSendButtonClick
                regenerateButton.addEventListener('click', () => {
                    // Remove both the cancel message and regenerate container
                    cancelMessage.remove();
                    regenerateContainer.remove();

                    // Call regenerateMessage directly on the user message
                    // This will handle the proper removal and recreation of the user message
                    this.regenerateMessage(lastMessage);
                });

                regenerateContainer.appendChild(regenerateButton);

                // Add both containers separately to the user message
                lastMessage.appendChild(cancelMessage);
                lastMessage.appendChild(regenerateContainer);
            }

            return true;
        }

        // Handle assistant messages (when AI was responding and got cancelled)
        const assistantMessages = aiReplies.querySelectorAll('.assistant-message');
        if (assistantMessages.length > 0) {
            const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];

            // Find the best container to add the cancel note to
            // Try different possible containers in order of preference
            let targetContainer = null;

            // 1. Try .ai-response-container (completed messages)
            targetContainer = lastAssistantMessage.querySelector('.ai-response-container');

            // 2. Try StreamProcessor container (streaming messages)
            if (!targetContainer) {
                targetContainer = lastAssistantMessage.querySelector('.response-container');
            }

            // 3. Try any div that contains response content
            if (!targetContainer) {
                const contentDivs = lastAssistantMessage.querySelectorAll('div');
                for (let div of contentDivs) {
                    if (div.textContent.trim().length > 0 && !div.classList.contains('cancel-note')) {
                        targetContainer = div;
                        break;
                    }
                }
            }

            // 4. If no suitable container found, use the message element itself
            if (!targetContainer) {
                targetContainer = lastAssistantMessage;
            }

            // Remove any existing cancel notes to avoid duplicates
            const existingCancelNotes = lastAssistantMessage.querySelectorAll('.cancel-note');
            existingCancelNotes.forEach(note => note.remove());

            // Create a container for the cancel message and regenerate button
            const cancelContainer = document.createElement('div');
            cancelContainer.className = 'cancel-note';
            cancelContainer.style.cssText = `
            color: #888;
            font-size: 0.85em;
            font-style: italic;
            margin-top: 5px;
            padding: 5px 10px;
            border-top: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

            // Add the cancel message
            const cancelMessage = document.createElement('span');
            cancelMessage.textContent = Lang.get('generationCancelled') || 'Generation was cancelled';
            cancelContainer.appendChild(cancelMessage);

            // Add the regenerate button
            const regenerateButton = document.createElement('button');
            regenerateButton.className = 'regenerate-inline-button';
            regenerateButton.textContent = Lang.get('regenerateMessage') || 'Regenerate';
            regenerateButton.style.cssText = `
            background-color: transparent;
            color: var(--accent-color,rgb(252, 252, 255));
            border: 1px solid var(--accent-color, #4f46e5);
            border-radius: 4px;
            padding: 2px 8px;
            font-size: 0.85em;
            cursor: pointer;
            margin-left: 10px;
            transition: background-color 0.2s, color 0.2s;
        `;

            // Add hover effect
            regenerateButton.addEventListener('mouseenter', () => {
                regenerateButton.style.backgroundColor = 'var(--accent-color, #4f46e5)';
                regenerateButton.style.color = 'white';
            });

            regenerateButton.addEventListener('mouseleave', () => {
                regenerateButton.style.backgroundColor = 'transparent';
                regenerateButton.style.color = 'var(--accent-color,rgb(255, 255, 255))';
            });

            // Add click handler for regeneration
            regenerateButton.addEventListener('click', () => {
                this.regenerateMessage(lastAssistantMessage);
            });

            cancelContainer.appendChild(regenerateButton);

            // Add the cancel container to the target container
            targetContainer.appendChild(cancelContainer);
        }

        // Also check if there are any incomplete message bubbles
        const incompleteMessages = document.querySelectorAll('.incomplete-message');
       //console.log('Chat: Found incomplete messages:', incompleteMessages.length);
        incompleteMessages.forEach(msg => {
            msg.classList.remove('incomplete-message');
            msg.classList.add('cancelled-message');
        });

        return true;
    }
    // Resets image-related UI and state, preserving images for continuity if needed
    resetImageData() {
        // First preserve any current images in OllamaAPI.lastUsedImages for continuity
        if ((window.selectedImages && window.selectedImages.length > 0) || window.selectedImage) {
           //console.log('Chat: Preserving images for continuity before UI reset');

            // Create array for storing images
            let imagesToSave = [];

            // Get images from either multi-image or single image source
            if (window.selectedImages && window.selectedImages.length > 0) {
                imagesToSave = window.selectedImages.map(img => {
                    let imgData = img;
                    // Clean the base64 data if needed
                    if (typeof imgData === 'string' && imgData.includes('base64,')) {
                        imgData = imgData.split('base64,')[1];
                    }
                    return imgData;
                });
            } else if (window.selectedImage) {
                let imgData = window.selectedImage;
                if (typeof imgData === 'string' && imgData.includes('base64,')) {
                    imgData = imgData.split('base64,')[1];
                }
                imagesToSave = [imgData];
            }

            // Store images for future requests - CRUCIAL LINE
            if (imagesToSave.length > 0) {
                OllamaAPI.lastUsedImages = [...imagesToSave];
               //console.log(`Chat: Saved ${imagesToSave.length} images under-the-hood for continuity`);
            }
        }

        // Check if current model is Gemma3
        const modelSelector = document.getElementById('model-selector');
        const currentModel = modelSelector?.value || '';
        const isGemma3 = currentModel.toLowerCase().includes('gemma3');

        // Reset UI elements
        const imagePreview = document.getElementById('image-preview');
        const imageContainer = document.querySelector('.image-upload-preview');
        const imageButton = document.getElementById('image-button');
        const imageModal = document.getElementById('image-modal');

        // For both Gemma3 and non-Gemma3, we now handle similarly with different UI indicators
        // Reset UI elements in the modal window
        if (imageModal) {
            const uploadPlaceholder = imageModal.querySelector('.upload-placeholder');
            const imagePreview = imageModal.querySelector('.image-preview');
            const imageGrid = imageModal.querySelector('.image-grid');

            if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
            if (imagePreview) imagePreview.style.display = 'none';
            if (imageGrid && imageGrid.innerHTML) imageGrid.innerHTML = '';
        }

        // Reset the image button appearance to normal state
        if (imageButton) {
            imageButton.classList.remove('active');
            imageButton.style.backgroundColor = '#404040';
            imageButton.style.color = 'white';
            imageButton.style.transform = 'none';
            imageButton.style.boxShadow = 'none';

            // Remove badge for cleaner UI, but keep data for under-the-hood use
            const badge = imageButton.querySelector('.image-count-badge');
            if (badge) badge.remove();
        }

        if (imagePreview) imagePreview.src = '';
        if (imageContainer) imageContainer.classList.add('hidden');

        // Clear the UI-related image variables but NOT OllamaAPI.lastUsedImages
        window.selectedImage = null;
        window.cleanedImageBase64 = null;
        window.selectedImages = [];
        window.cleanedImageBase64Array = [];
        window.selectedImagePayload = null;
        window.selectedImagePayloads = [];

        // Mark images as hidden (used only under the hood)
        window.imagesUnderTheHood = true;

       //console.log('Chat: Image UI reset, keeping images under the hood for continuity');
       //console.log(`Chat: We have ${OllamaAPI.lastUsedImages.length} images preserved for continuity`);
    }
    // Regenerates an AI response for a given message, restoring prompt, images, and web search state
    async regenerateMessage(messageElement) {
        try {
            // Find the user message that preceded this AI message
            let userMessageElement = messageElement.previousElementSibling;
            while (userMessageElement && !userMessageElement.classList.contains('user-message')) {
                userMessageElement = userMessageElement.previousElementSibling;
            }

            if (!userMessageElement) {
                console.error('Could not find the user message to regenerate from');
                return;
            }

            // Extract the original user prompt
            const messageBubble = userMessageElement.querySelector('.message-bubble');
            if (!messageBubble) {
                console.error('Could not find message bubble in user message');
                return;
            }

            //  ENHANCED: Extract original prompt and check for images/web search
            let originalPrompt = messageBubble.textContent.trim();
            let wasWebSearchActive = false;
            let originalImages = [];

            // Determine if web-search was active by checking the web-search button state
            // We no longer rely on parsing the user message HTML (which could be inconsistent).
            const webSearchButtonEl = document.getElementById('web-search');
            if (webSearchButtonEl && webSearchButtonEl.classList.contains('active')) {
                wasWebSearchActive = true;
                // Keep originalPrompt as-is (we'll use the prompt input / model to generate the query in sendToOllamaWithWebSearch)
            }

            //  NEW: Check if this message had images
            const imageElements = userMessageElement.querySelectorAll('img');
            const imageDataElements = userMessageElement.querySelectorAll('[data-image-data]');

            // Clear the array first
            originalImages = [];

            if (imageElements.length > 0 || imageDataElements.length > 0) {
               //console.log(`Regenerate: Found ${imageElements.length + imageDataElements.length} images to restore`);

                // Collect image data from img elements
                imageElements.forEach(img => {
                    const storedImageData = img.getAttribute('data-image-data') || img.dataset.imageData || '';
                    if (storedImageData && !originalImages.includes(storedImageData)) {
                        originalImages.push(storedImageData);
                    } else if (img.src && img.src.startsWith('data:image/') && !originalImages.includes(img.src)) {
                        originalImages.push(img.src);
                    }
                });

                // Collect image data from data attributes
                imageDataElements.forEach(element => {
                    const imageData = element.getAttribute('data-image-data');
                    if (imageData) {
                        originalImages.push(imageData);
                    }
                });

                // ADDITIONAL CHECK: Look specifically in image containers that are siblings of the message bubble
                const messageBubble = userMessageElement.querySelector('.message-bubble');
                if (messageBubble) {
                    // Look for single image container (sibling of message bubble)
                    const singleImageContainer = userMessageElement.querySelector('.user-message-image');
                    if (singleImageContainer) {
                        const img = singleImageContainer.querySelector('img');
                        const storedImageData = img?.getAttribute('data-image-data') || img?.dataset?.imageData || '';
                        if (storedImageData && !originalImages.includes(storedImageData)) {
                            originalImages.push(storedImageData);
                           //console.log('Regenerate: Found single image in .user-message-image container');
                        } else if (img && img.src && img.src.startsWith('data:image/') && !originalImages.includes(img.src)) {
                            originalImages.push(img.src);
                           //console.log('Regenerate: Found single image in .user-message-image container');
                        }
                    }

                    // Look for multi-image container (sibling of message bubble)
                    const multiImageContainer = userMessageElement.querySelector('.user-message-images');
                    if (multiImageContainer) {
                        const imgs = multiImageContainer.querySelectorAll('img');
                        imgs.forEach(img => {
                            const storedImageData = img.getAttribute('data-image-data') || img.dataset.imageData || '';
                            if (storedImageData && !originalImages.includes(storedImageData)) {
                                originalImages.push(storedImageData);
                            } else if (img.src && img.src.startsWith('data:image/') && !originalImages.includes(img.src)) {
                                originalImages.push(img.src);
                            }
                        });
                        if (imgs.length > 0) {
                           //console.log(`Regenerate: Found ${imgs.length} images in .user-message-images container`);
                        }
                    }
                }
            }

            /*console.log('Regenerate: Extracted data:', {
                prompt: originalPrompt.substring(0, 50) + '...',
                wasWebSearchActive,
                imageCount: originalImages.length
            });*/

            // Remove the AI message that we're regenerating
            messageElement.remove();

            // NEW: Remove any continue conversation buttons since we're regenerating
            const continueButtons = document.querySelectorAll(
                '.continue-button-container, .continuation-container, .continue-conversation-container, [class*="continue"]'
            );
            continueButtons.forEach(button => {
               //console.log('Regenerate: Removing continue button due to regeneration');
                button.remove();
            });


            // Get current model and check if it's visual
            const modelSelector = document.getElementById('model-selector');
            const selectedModel = modelSelector.value;
            const isVisualModel = await OllamaAPI.isVisualModel(selectedModel);
            const isGemma3 = selectedModel.toLowerCase().includes('gemma3');

            //  RESTORE IMAGES: Set up image state for regeneration
            if (originalImages.length > 0 && isVisualModel) {
               //console.log('Regenerate: Restoring images for visual model');

                // Restore image state variables
                if (isGemma3 && originalImages.length > 1) {
                    // Multi-image mode for Gemma3
                    window.selectedImages = [...originalImages];
                    window.cleanedImageBase64Array = originalImages.map(img => {
                        if (img.includes('base64,')) {
                            return img.split('base64,')[1];
                        }
                        return img;
                    });
                    window.currentMessageImages = originalImages.map(img => ({ src: img }));

                   //console.log(`Regenerate: Restored ${originalImages.length} images for Gemma3`);
                } else {
                    // Single image mode
                    window.selectedImage = originalImages[0];
                    window.cleanedImageBase64 = originalImages[0].includes('base64,')
                        ? originalImages[0].split('base64,')[1]
                        : originalImages[0];
                    window.currentMessageImages = [{ src: originalImages[0] }];

                   //console.log('Regenerate: Restored single image');
                }

                // Update UI to show image button as active
                const imageButton = document.getElementById('image-button');
                if (imageButton) {
                    imageButton.classList.add('active');
                    imageButton.style.backgroundColor = '#4f46e5';
                    imageButton.style.color = 'white';

                    // Add badge for multi-image
                    if (isGemma3 && originalImages.length > 1) {
                        let badge = imageButton.querySelector('.image-count-badge');
                        if (!badge) {
                            badge = document.createElement('span');
                            badge.className = 'image-count-badge';
                            badge.style.cssText = `
                            position: absolute;
                            top: -8px;
                            right: -8px;
                            background-color: #ef4444;
                            color: white;
                            border-radius: 50%;
                            width: 20px;
                            height: 20px;
                            font-size: 12px;
                            font-weight: bold;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        `;
                            imageButton.appendChild(badge);
                        }
                        badge.textContent = originalImages.length;
                    }
                }
            } else if (originalImages.length > 0 && !isVisualModel) {
                console.warn('Regenerate: Had images but current model is not visual - images will be ignored');
            }

            //  RESTORE WEB SEARCH: Set web search state
            const webSearchButton = document.getElementById('web-search');
            if (webSearchButton) {
                if (wasWebSearchActive) {
                    webSearchButton.classList.add('active');
                   //console.log('Regenerate: Activated web search');
                } else {
                    webSearchButton.classList.remove('active');
                   //console.log('Regenerate: Deactivated web search');
                }
            }

            // Put the original prompt back in the input
            const promptInput = document.getElementById('prompt-input');
            if (promptInput) {
                promptInput.value = originalPrompt;
                promptInput.focus();
            }

            // Start generation with the restored state
            window.isGenerating = true;
            const progressBar = document.getElementById('progress-bar');
            progressBar.classList.add('active', 'indeterminate');

            // Create AbortController for cancellation
            const abortController = new AbortController();
            window.globalAbortController = abortController;

            // Toggle send button to cancel state
            const sendButton = document.getElementById('send-prompt');
            if (sendButton) {
                sendButton.textContent = Lang.get('cancelButton') || 'Cancel';
                sendButton.style.backgroundColor = '#ef4444';
                sendButton.style.color = 'white';
                sendButton.classList.add('cancel-state');
            }

            try {
                const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                const baseSystemPrompt = document.getElementById('system-prompt').value;
                let basePrompt;
                try {
                    const settings = await PaiperworkDB.loadSettings(hashedMasterKey);
                    basePrompt = settings.systemPrompt || baseSystemPrompt;
                } catch (error) {
                    console.error('Chat: Error loading system prompt from database:', error);
                    basePrompt = baseSystemPrompt;
                }

                const systemPrompt = await OllamaAPI.buildCompleteSystemPrompt(hashedMasterKey, basePrompt);
                const contextSize = document.getElementById('context-selector').value;

                //  ROUTE TO APPROPRIATE METHOD: Choose the right generation method
                if (wasWebSearchActive) {
                   //console.log('Regenerate: Using web search method (preserve original system prompt)');
                    // Per requirement: do NOT pass the enhanced/modified system prompt here — use the base prompt as-is.
                    // `basePrompt` was loaded from settings or fallback above.
                    try {
                        // Keep the web-search button active (it was active before)
                        const webSearchButton = document.getElementById('web-search');
                        if (webSearchButton) webSearchButton.classList.add('active');

                        await OllamaAPI.sendToOllamaWithWebSearch(
                            originalPrompt,
                            basePrompt, // pass unmodified base prompt per user request
                            true, // includeContext
                            abortController.signal,
                            '', // documentContext
                            false, // isDocumentWebSearch
                            false,
                            window.currentConversationGroup,
                            async () => await this.processInsightsIfEnabled(originalPrompt, document.getElementById('prompt-input'), document.getElementById('send-prompt'), hashedMasterKey)
                        );
                    } catch (e) {
                        console.error('Regenerate: Error during web-search regeneration:', e);
                        throw e;
                    }
                } else if (originalImages.length > 0 && isVisualModel) {
                   //console.log('Regenerate: Using image method');

                    // Determine which image data to use
                    let imageDataToSend = null;
                    let multiImagesToSend = null;

                    if (isGemma3 && originalImages.length > 1) {
                        multiImagesToSend = originalImages;
                    } else {
                        imageDataToSend = originalImages[0];
                    }

                    const response = await OllamaAPI.sendToOllamaWithImage(
                        originalPrompt,
                        systemPrompt,
                        contextSize,
                        imageDataToSend,
                        this.previousContext,
                        abortController.signal,
                        `regenerate_${Date.now()}`,
                        multiImagesToSend
                    );

                    if (response && response.ok) {
                        await this.handleImageResponse(response, originalPrompt, systemPrompt, abortController.signal);
                    }
                } else {
                   //console.log('Regenerate: Using normal method');
                    const aiReplies = document.querySelector('.ai-replies');
                    const aiDiv = document.createElement('div');
                    aiDiv.className = 'assistant-message';
                    const regenerateMessageIds = {
                        userMessageId: userMessage?.dataset?.messageId || null,
                        assistantMessageId: this.generateConversationMessageId()
                    };
                    aiDiv.dataset.messageId = regenerateMessageIds.assistantMessageId;
                    aiReplies.appendChild(aiDiv);

                    const streamProcessor = new StreamProcessor();
                    const autoContainer = streamProcessor.responseContainer;
                    if (autoContainer.parentNode) {
                        autoContainer.parentNode.removeChild(autoContainer);
                    }
                    aiDiv.appendChild(streamProcessor.responseContainer);

                    const response = await OllamaAPI.sendToOllama(
                        originalPrompt,
                        systemPrompt,
                        contextSize,
                        this.previousContext,
                        abortController.signal,
                        `regenerate_${Date.now()}`,
                        streamProcessor
                    );

                    if (response && response.success) {
                        // Handle completion
                        const buttons = streamProcessor.responseContainer.querySelectorAll('.code-copy-btn');
                        buttons.forEach(button => button.style.display = 'block');

                        if (window.chat && typeof window.chat.addMessageActionsToMessage === 'function') {
                            window.chat.addMessageActionsToMessage(aiDiv);
                        }

                        const aiResponse = streamProcessor.responseContainer.outerHTML;
                        await PaiperworkDB.storeConversationOnly(
                            hashedMasterKey,
                            originalPrompt,
                            aiResponse,
                            false,
                            window.currentConversationGroup,
                            regenerateMessageIds
                        );
                    }
                }

                // Clear the input after successful regeneration
                if (promptInput) {
                    promptInput.value = '';
                }

            } catch (error) {
                console.error('Error during regeneration:', error);

                if (error.name === 'AbortError') {
                   //console.log('Regeneration was cancelled by user');
                } else {
                    alert(Lang.get('regenerationError') || 'Error during regeneration: ' + error.message);
                }
            } finally {
                // Reset UI state
                progressBar.classList.remove('active', 'indeterminate');
                window.isGenerating = false;

                if (sendButton) {
                    sendButton.textContent = Lang.get('sendButton') || 'Send';
                    sendButton.style.backgroundColor = '';
                    sendButton.style.color = '';
                    sendButton.classList.remove('cancel-state');
                }

                window.globalAbortController = null;
            }

        } catch (error) {
            console.error('Error in regenerateMessage:', error);
            alert(Lang.get('regenerationError') || 'Error during message regeneration');
        }
    }

    //  NEW HELPER METHOD: Handle image response processing
    async handleImageResponse(response, originalPrompt, systemPrompt, abortSignal) {
        const aiReplies = document.querySelector('.ai-replies');
        const aiDiv = document.createElement('div');
        aiDiv.className = 'assistant-message';
        const imageResponseMessageIds = {
            userMessageId: null,
            assistantMessageId: this.generateConversationMessageId()
        };
        aiDiv.dataset.messageId = imageResponseMessageIds.assistantMessageId;
        aiReplies.appendChild(aiDiv);

        const streamProcessor = new StreamProcessor();
        const autoContainer = streamProcessor.responseContainer;
        if (autoContainer.parentNode) {
            autoContainer.parentNode.removeChild(autoContainer);
        }
        aiDiv.appendChild(streamProcessor.responseContainer);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let streamBuffer = '';

        try {
            while (true) {
                const { value, done } = await reader.read();
            streamBuffer += decoder.decode(value || new Uint8Array(), { stream: !done });
            const lines = streamBuffer.split('\n');
            streamBuffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const data = JSON.parse(line);

                            if (data.done) {
                                const buttons = streamProcessor.responseContainer.querySelectorAll('.code-copy-btn');
                                buttons.forEach(button => button.style.display = 'block');

                                streamProcessor.finishResponse();

                                if (window.chat && typeof window.chat.addMessageActionsToMessage === 'function') {
                                    window.chat.addMessageActionsToMessage(aiDiv);
                                }

                                const aiResponse = streamProcessor.responseContainer.outerHTML;
                                const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');

                                await PaiperworkDB.storeConversationOnly(
                                    hashedMasterKey,
                                    originalPrompt,
                                    aiResponse,
                                    false,
                                    window.currentConversationGroup,
                                    imageResponseMessageIds
                                );

                                // Update context
                                if (data.context) {
                                    this.previousContext = data.context;
                                    window.currentCheckpoint = { lastContext: data.context };
                                    OllamaAPI.updateContextRemaining(data.context.length);
                                }

                                return;
                            } else {
                                const responseChunk = data.response || data.message?.content;
                                if (responseChunk) {
                                    streamProcessor.processChunk(responseChunk);
                                }
                            }
                        } catch (error) {
                            console.error('Error processing image response chunk:', error);
                        }
                    }
                }

                if (done) {
                    const tail = streamBuffer.trim();
                    if (tail) {
                        try {
                            const data = JSON.parse(tail);

                            if (data.done) {
                                const buttons = streamProcessor.responseContainer.querySelectorAll('.code-copy-btn');
                                buttons.forEach(button => button.style.display = 'block');

                                streamProcessor.finishResponse();

                                if (window.chat && typeof window.chat.addMessageActionsToMessage === 'function') {
                                    window.chat.addMessageActionsToMessage(aiDiv);
                                }

                                const aiResponse = streamProcessor.responseContainer.outerHTML;
                                const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');

                                await PaiperworkDB.storeConversationOnly(
                                    hashedMasterKey,
                                    originalPrompt,
                                    aiResponse,
                                    false,
                                    window.currentConversationGroup,
                                    imageResponseMessageIds
                                );

                                if (data.context) {
                                    this.previousContext = data.context;
                                    window.currentCheckpoint = { lastContext: data.context };
                                    OllamaAPI.updateContextRemaining(data.context.length);
                                }

                                return;
                            } else {
                                const responseChunk = data.response || data.message?.content;
                                if (responseChunk) {
                                    streamProcessor.processChunk(responseChunk);
                                }
                            }
                        } catch (error) {
                            console.error('Error processing image response tail chunk:', error);
                        }
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Error in handleImageResponse:', error);
            throw error;
        }
    }
    // Refreshes the conversation list UI if the group has changed
    async refreshConversationListIfNeeded(hashedMasterKey, groupId) {
        // Only refresh if:
        // 1. This is a new conversation (null -> some ID)
        // 2. We switched to a different conversation
        // 3. We're forcing a refresh

        // Store the most recent fetched group ID
        if (!this.lastFetchedGroupId || this.lastFetchedGroupId !== groupId) {
           //console.log(`Chat: Group changed from ${this.lastFetchedGroupId} to ${groupId}, refreshing conversation list`);
            this.lastFetchedGroupId = groupId;

            if (window.chatTab && typeof window.chatTab.loadSessionsList === 'function') {
                const updatedSessions = await window.chatTab.loadSessionsList(hashedMasterKey);
                window.chatTab.renderSessionsList(updatedSessions);
            }
            return true;
        } else {
           //console.log(`Chat: Still in group ${groupId}, skipping conversation list refresh`);
            return false;
        }
    }
    // Adds export functionality to a delete button if available
    addExportButton(deleteButton) {
        if (!deleteButton) return;

        // Use the Export class if available, otherwise show error
        if (window.export && typeof window.export.addExportButton === 'function') {
            window.export.addExportButton(deleteButton);
        } else {
            console.error('Chat: Export system not available, cannot add export button');
        }
    }
    // Deletes a conversation pair (user + assistant message) from UI and database
    async deleteConversationPair(messageElement) {
        // Get the conversation pair (user message + assistant response)
        const aiReplies = document.querySelector('.ai-replies');
        if (!aiReplies) {
            console.error('AI replies container not found');
            return false;
        }

        // Find the user message and assistant message pair
        let userMessage, assistantMessage;

        if (messageElement.classList.contains('user-message')) {
            // If clicked on user message, find the next assistant message
            userMessage = messageElement;
            assistantMessage = userMessage.nextElementSibling;

            // Check if next element is actually an assistant message
            if (!assistantMessage || !assistantMessage.classList.contains('assistant-message')) {
                console.warn('No assistant message found after user message');
                assistantMessage = null;
            }
        } else if (messageElement.classList.contains('assistant-message')) {
            // If clicked on assistant message, find the previous user message
            assistantMessage = messageElement;

            // Get all messages in the chat
            const allMessages = Array.from(aiReplies.children);
            const assistantIndex = allMessages.indexOf(assistantMessage);

            // Look for the preceding user message
            if (assistantIndex > 0) {
                // Search backwards for the closest user message
                for (let i = assistantIndex - 1; i >= 0; i--) {
                    if (allMessages[i].classList.contains('user-message')) {
                        userMessage = allMessages[i];
                        break;
                    }
                }
            }

            if (!userMessage) {
                console.warn('No user message found before assistant message');
            }
        } else {
            console.error('Element is neither user nor assistant message:', messageElement);
            return false;
        }

        // Confirm deletion with user
        if (!confirm(Lang.get('deleteMessagePairConfirm') || 'Delete this message pair? This cannot be undone.')) {
            return false;
        }

        // Create and show floating delete confirmation
        const deleteModal = this.createDeleteConfirmationModal();
        document.body.appendChild(deleteModal);

        try {
            // Extract content for database matching
            let userContent = null;
            let assistantContent = null;

            // Extract user content more reliably
            if (userMessage) {
                const userBubble = userMessage.querySelector('.message-bubble');
                if (userBubble) {
                    // Get text content, handling potential image data
                    userContent = userBubble.textContent.trim();

                    // Check if this message has images that might be stored as JSON
                    const imageElements = userMessage.querySelectorAll('img');
                    if (imageElements.length > 0) {
                        // If there are images, the database might store this as JSON
                        // We need to match against both the text and the full JSON structure
                       //console.log(`User message has ${imageElements.length} images, will try multiple match strategies`);
                    }
                }
            }

            const cleanAssistantContentForDeletion = (html) => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html || '';

                const transientElements = tempDiv.querySelectorAll(
                    '.message-actions, .copy-response-container, .cancel-note, .code-copy-btn, .code-copy-with-lines-btn, .toggle-line-numbers, .code-run-btn, .line-numbers, [style*="display: none"], [style*="visibility: hidden"]'
                );
                transientElements.forEach(el => el.remove());

                return (tempDiv.innerText || tempDiv.textContent || '')
                    .normalize('NFKC')
                    .replace(/\r\n/g, '\n')
                    .replace(/\u00a0/g, ' ')
                    .replace(/[ \t]+/g, ' ')
                    .replace(/\n{2,}/g, '\n')
                    .replace(/[ \t]*\n[ \t]*/g, '\n')
                    .trim();
            };

            // Extract assistant content more reliably
            if (assistantMessage) {
                const responseContainer = assistantMessage.querySelector('.ai-response-container');
                if (responseContainer) {
                    assistantContent = cleanAssistantContentForDeletion(responseContainer.innerHTML);
                }
            }

            /*console.log('Extracted content for deletion:', {
                userContentLength: userContent?.length || 0,
                assistantContentLength: assistantContent?.length || 0,
                userPreview: userContent?.substring(0, 50) + '...',
                assistantPreview: assistantContent?.substring(0, 50) + '...'
            });*/

            // Store references to remove from DOM
            const elementsToRemove = [];
            if (userMessage) elementsToRemove.push(userMessage);
            if (assistantMessage) elementsToRemove.push(assistantMessage);

            // Update modal status to show database deletion
            this.updateDeleteModalStatus(deleteModal, 'database');

            // Remove from database
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            const userMessageId = userMessage?.dataset?.messageId || null;
            const assistantMessageId = assistantMessage?.dataset?.messageId || null;
            if (hashedMasterKey && (userMessageId || assistantMessageId || userContent || assistantContent)) {
                try {
                    let deletionSuccess = false;
                    const deletionOptions = {
                        conversationGroup: window.currentConversationGroup || null
                    };

                    if (userMessageId || assistantMessageId) {
                        deletionSuccess = await PaiperworkDB.deleteConversationPairByIds(
                            hashedMasterKey,
                            userMessageId,
                            assistantMessageId,
                            deletionOptions
                        );
                    }

                    if (!deletionSuccess && userContent && assistantContent) {
                        deletionSuccess = await PaiperworkDB.deleteConversationPair(
                            hashedMasterKey,
                            userContent,
                            assistantContent,
                            {
                                ...deletionOptions,
                                requirePair: true
                            }
                        );
                    }

                    if (!deletionSuccess && userContent) {
                        deletionSuccess = await PaiperworkDB.deleteConversationPair(
                            hashedMasterKey,
                            userContent,
                            null,
                            {
                                ...deletionOptions,
                                requirePair: false
                            }
                        );
                    }

                    if (!deletionSuccess && assistantContent) {
                        deletionSuccess = await PaiperworkDB.deleteConversationPair(
                            hashedMasterKey,
                            null,
                            assistantContent,
                            {
                                ...deletionOptions,
                                requirePair: false
                            }
                        );
                    }

                    if (!deletionSuccess) {
                        throw new Error('Database deletion failed with all strategies');
                    }

                    await new Promise(resolve => setTimeout(resolve, 100));
                   //console.log('Database deletion completed successfully');
                } catch (dbError) {
                    console.error('Error in database deletion:', dbError);
                    // Remove modal before showing error
                    if (deleteModal.parentNode) {
                        deleteModal.parentNode.removeChild(deleteModal);
                    }
                    alert('Error deleting from database. See console for details.');
                    return false;
                }
            } else {
                console.error('Missing hashedMasterKey or message content for database deletion');
            }

            // Update modal status to show UI deletion
            this.updateDeleteModalStatus(deleteModal, 'ui');

            // Add animation class to each element
            elementsToRemove.forEach(el => {
                el.classList.add('deleting');
                el.style.animation = 'fade-out 0.3s forwards';
            });

            // Wait for animation to complete
            await new Promise(resolve => setTimeout(resolve, 300));

            // Now remove from DOM
            elementsToRemove.forEach(el => {
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                } else {
                    console.warn('Element already removed or has no parent:', el);
                }
            });

            // Always refresh the count after DOM removal
            await new Promise(resolve => setTimeout(resolve, 100)); // Let DOM settle

            // Check if there are any REAL conversation messages left
            const remainingMessages = aiReplies.querySelectorAll('.user-message, .assistant-message:not(.welcome-message)');
            const welcomeMessages = aiReplies.querySelectorAll('.welcome-message');

           //console.log(`After deletion: ${remainingMessages.length} conversation messages + ${welcomeMessages.length} welcome messages remain in UI`);

            // CRITICAL FIX: Check if ONLY welcome messages remain (no real conversation messages)
            if (remainingMessages.length === 0) {
               //console.log('No real conversation messages left, group should be considered empty');

                // Update modal status to show session refresh
                this.updateDeleteModalStatus(deleteModal, 'refresh');

                // Remove any continue buttons since there's nothing to continue from
                const continueButtons = document.querySelectorAll(
                    '.continue-button-container, .continuation-container, .continue-conversation-container, [class*="continue"]'
                );
                continueButtons.forEach(button => {
                    button.remove();
                });

                // CLEAR WELCOME MESSAGES TOO - they're not part of real conversation
                welcomeMessages.forEach(welcomeMsg => {
                   //console.log('Removing welcome message as conversation is empty');
                    welcomeMsg.remove();
                });

                const currentGroupId = window.currentConversationGroup;

                if (hashedMasterKey && currentGroupId) {
                    if (window.chatTab && typeof window.chatTab.deleteEmptyConversationGroupIfNoMessages === 'function') {
                        await window.chatTab.deleteEmptyConversationGroupIfNoMessages(hashedMasterKey, currentGroupId);
                    } else {
                        window.currentConversationGroup = null;
                        if (window.chatTab && typeof window.chatTab.showWelcomeMessage === 'function') {
                            window.chatTab.showWelcomeMessage();
                        }
                        if (window.chatTab && typeof window.chatTab.loadSessionsList === 'function') {
                            const updatedSessions = await window.chatTab.loadSessionsList(hashedMasterKey);
                            window.chatTab.renderSessionsList(updatedSessions);
                        }
                    }
                }
            } else {
                // Messages remain - NO conversation list refresh
               //console.log(`${remainingMessages.length} conversation messages remain - not refreshing list`);

                // Optional: Touch the conversation group to update its timestamp (no refresh)
                const currentGroupId = window.currentConversationGroup;
                if (hashedMasterKey && currentGroupId) {
                    try {
                        await PaiperworkDB.touchConversationGroup(hashedMasterKey, currentGroupId);
                    } catch (error) {
                        console.warn('Error touching conversation group:', error);
                    }
                }
            }

            // Update modal to show success and remove modal
            this.updateDeleteModalStatus(deleteModal, 'success');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Show success for 1 second

           //console.log('Delete operation completed successfully');
            return true;
        } catch (error) {
            console.error('Error deleting conversation pair:', error);

            // Update modal to show error
            this.updateDeleteModalStatus(deleteModal, 'error', error.message);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Show error for 2 seconds

            alert(Lang.get('deleteMessagePairError') || 'Error deleting message pair');
            return false;
        } finally {
            // Always remove the modal
            if (deleteModal && deleteModal.parentNode) {
                deleteModal.parentNode.removeChild(deleteModal);
            }
        }
    }
    // Creates a modal dialog for delete confirmation
    createDeleteConfirmationModal() {
        const modal = document.createElement('div');
        modal.className = 'delete-confirmation-modal';
        modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--bg-color);
        color: var(--text-color);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        width: 350px;
        max-width: 90vw;
        max-height: 90vh;
        backdrop-filter: blur(8px);
        animation: modalFadeIn 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
        text-align: center;
    `;

        // Add CSS animation keyframes if not already defined
        if (!document.querySelector('#delete-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'delete-modal-styles';
            style.textContent = `
            @keyframes modalFadeIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
            .delete-confirmation-modal * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            .delete-confirmation-modal {
                display: block !important;
            }
        `;
            document.head.appendChild(style);
        }

        // Create header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        width: 100%;
        margin-top: 0;
        padding-top: 0;
        text-align: center;
    `;

        const headerTitle = document.createElement('h3');
        headerTitle.style.cssText = `
        margin: 0;
        padding: 0;
        font-size: 18px;
        font-weight: 600;
        line-height: 1.3;
        color: var(--heading-color);
        margin-top: 0;
        padding-top: 0;
        text-align: center;
    `;
        headerTitle.textContent = Lang.get('deletingMessagePair') || 'Deleting Message Pair';

        modalHeader.appendChild(headerTitle);

        // Create body
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.style.cssText = `
        width: 100%;
        margin: 0;
        padding: 0;
        text-align: center;
    `;

        // Create status text container (simplified without spinner)
        const statusTextContainer = document.createElement('div');
        statusTextContainer.className = 'status-text';
        statusTextContainer.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0;
        padding: 0;
    `;

        const statusMessage = document.createElement('span');
        statusMessage.className = 'status-message';
        statusMessage.style.cssText = `
        font-size: 14px;
        color: var(--text-color);
        opacity: 0.8;
        line-height: 1.4;
        margin: 0;
        padding: 0;
        text-align: center;
    `;
        statusMessage.textContent = Lang.get('preparingDeletion') || 'Preparing deletion...';

        statusTextContainer.appendChild(statusMessage);

        // Assemble modal body (without progress container)
        modalBody.appendChild(statusTextContainer);

        // Assemble modal
        modal.appendChild(modalHeader);
        modal.appendChild(modalBody);

        return modal;
    }
    //  FIXED: Update delete modal status with proper element targeting
    updateDeleteModalStatus(modal, status, errorMessage = '') {
        if (!modal) return;

        const statusMessage = modal.querySelector('.status-message');
        const modalHeader = modal.querySelector('.modal-header h3');

        if (!statusMessage || !modalHeader) {
            console.warn('Modal elements not found for status update');
            return;
        }

        switch (status) {
            case 'database':
                statusMessage.textContent = Lang.get('deletingFromDatabase') || 'Deleting from database...';
                break;

            case 'ui':
                statusMessage.textContent = Lang.get('removingFromInterface') || 'Removing from interface...';
                break;

            case 'refresh':
                statusMessage.textContent = Lang.get('refreshingConversationList') || 'Refreshing conversation list...';
                break;

            case 'success':
                statusMessage.textContent = Lang.get('deletionCompleted') || 'Deletion completed successfully!';
                statusMessage.style.color = 'var(--success-color, #10b981)';
                modalHeader.textContent = Lang.get('deletionSuccessful') || 'Deletion Successful';
                break;

            case 'error':
                statusMessage.textContent = errorMessage || Lang.get('deletionFailed') || 'Deletion failed';
                statusMessage.style.color = 'var(--error-color, #ef4444)';
                modalHeader.textContent = Lang.get('deletionError') || 'Deletion Error';
                break;
        }
    }
    localizeMessageActionButtons(rootElement = document) {
        if (!rootElement || !rootElement.querySelectorAll) return;

        rootElement.querySelectorAll('.regenerate-message').forEach((btn) => {
            btn.textContent = Lang.get('regenerateMessage') || 'Regenerate';
        });

        rootElement.querySelectorAll('.delete-message-pair').forEach((btn) => {
            btn.textContent = Lang.get('deleteMessagePair') || 'Delete';
        });

        rootElement.querySelectorAll('.copy-btn').forEach((btn) => {
            btn.textContent = Lang.get('copy') || 'Copy';
        });
    }
    addCopyActionToUserMessage(userMessage) {
        if (!userMessage || !userMessage.classList.contains('user-message')) {
            console.error('Invalid user message element for adding copy action');
            return;
        }

        const messageBubble = userMessage.querySelector('.message-bubble');
        if (!messageBubble) {
            console.error('No message bubble found in user message');
            return;
        }

        const existingActions = userMessage.querySelector('.user-message-actions');
        if (existingActions) {
            existingActions.remove();
        }

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'user-message-actions';
        actionsContainer.style.cssText = `
            text-align: right;
            margin-top: 0.35rem;
            opacity: 0.7;
            transition: opacity 0.2s;
        `;

        actionsContainer.addEventListener('mouseenter', () => {
            actionsContainer.style.opacity = '1';
        });
        actionsContainer.addEventListener('mouseleave', () => {
            actionsContainer.style.opacity = '0.7';
        });

        const copyButton = document.createElement('a');
        copyButton.href = '#';
        copyButton.className = 'copy-btn';
        copyButton.textContent = Lang.get('copy') || 'Copy';
        copyButton.style.cssText = `
            color: inherit;
            text-decoration: none;
            cursor: pointer;
        `;

        copyButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const cleanText = (messageBubble.innerText || messageBubble.textContent || '').replace(/\r\n/g, '\n').trimEnd();
            if (!cleanText) {
                return;
            }

            navigator.clipboard.writeText(cleanText)
                .then(() => {
                    const originalText = copyButton.textContent;
                    copyButton.textContent = (Lang.get('copied') || 'Copied');
                    setTimeout(() => {
                        copyButton.textContent = originalText;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy user message text:', err);
                    const originalText = copyButton.textContent;
                    copyButton.textContent = (Lang.get('copyError') || 'Error');
                    setTimeout(() => {
                        copyButton.textContent = originalText;
                    }, 2000);
                });
        });

        actionsContainer.appendChild(copyButton);

        const trailingBreak = Array.from(userMessage.children).find((child) => child.tagName === 'BR');
        if (trailingBreak) {
            userMessage.insertBefore(actionsContainer, trailingBreak);
        } else {
            userMessage.appendChild(actionsContainer);
        }

        this.localizeMessageActionButtons(userMessage);
    }
    // Adds action buttons (regenerate, delete, copy) to an assistant message
    addMessageActionsToMessage(assistantMessage) {
       //console.log('Chat: Adding message actions to assistant message');

        if (!assistantMessage || !assistantMessage.classList.contains('assistant-message')) {
            console.error('Invalid message element for adding actions');
            return;
        }

        // Find the response container
        const responseContainer = assistantMessage.querySelector('.ai-response-container');
        if (!responseContainer) {
            console.error('No response container found in message');
            return;
        }

        // Remove any existing message actions
        const existingActions = responseContainer.querySelector('.message-actions, .copy-response-container');
        if (existingActions) {
            existingActions.remove();
        }

        // Create the actions container
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'message-actions';
        actionsContainer.style.cssText = `
            text-align: right;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            padding-top: 0.5rem;
            opacity: 0.7;
            border-top: 1px solid var(--border-color);
            transition: opacity 0.2s;
        `;

        // Add hover effects
        actionsContainer.addEventListener('mouseenter', () => {
            actionsContainer.style.opacity = '1';
        });
        actionsContainer.addEventListener('mouseleave', () => {
            actionsContainer.style.opacity = '0.7';
        });

        // Create regenerate button - USE DIRECT ONCLICK ATTRIBUTE
        const regenerateButton = document.createElement('a');
        regenerateButton.href = '#';
        regenerateButton.className = 'regenerate-message';
        regenerateButton.textContent = Lang.get('regenerateMessage') || 'Regenerate';
        regenerateButton.style.cssText = `
            color: inherit;
            text-decoration: none;
            cursor: pointer;
            margin-right: 10px;
        `;
        regenerateButton.setAttribute('onclick', 'event.preventDefault(); window.chat.regenerateMessage(this.closest(".assistant-message")); return false;');

        // Create delete button - USE DIRECT ONCLICK ATTRIBUTE
        const deleteButton = document.createElement('a');
        deleteButton.href = '#';
        deleteButton.className = 'delete-message-pair';
        deleteButton.textContent = Lang.get('deleteMessagePair') || 'Delete';
        deleteButton.style.cssText = `
            color: #ef4444;
            text-decoration: none;
            cursor: pointer;
            margin-right: 10px;
        `;
        deleteButton.setAttribute('onclick', 'event.preventDefault(); window.chat.deleteConversationPair(this.closest(".assistant-message")); return false;');

        // Create copy button - USE DIRECT ONCLICK ATTRIBUTE 
        const copyButton = document.createElement('a');
        copyButton.href = '#';
        copyButton.className = 'copy-btn';
        copyButton.textContent = Lang.get('copy') || 'Copy';
        copyButton.style.cssText = `
            color: inherit;
            text-decoration: none;
            cursor: pointer;
        `;

        copyButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const responseDiv = copyButton.closest('.assistant-message')?.querySelector('.ai-response-container');

            if (!responseDiv) {
                console.error('Cannot find response container for copying');
                return;
            }

            // Method 1: Try using streamProcessor if available
            if (responseDiv.streamProcessor && typeof responseDiv.streamProcessor.copyFullResponse === 'function') {
                responseDiv.streamProcessor.copyFullResponse(copyButton);
                return;
            }

            // Method 2: Fallback if no streamProcessor - copy the HTML without action buttons
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = responseDiv.innerHTML;

            const actionButtons = tempDiv.querySelectorAll('.message-actions, .copy-response-container');
            actionButtons.forEach(el => el.remove());

            const cancelNotes = tempDiv.querySelectorAll('.cancel-note');
            cancelNotes.forEach(el => el.remove());

            const cleanText = (tempDiv.innerText || tempDiv.textContent || '').replace(/\r\n/g, '\n').trimEnd();

            navigator.clipboard.writeText(cleanText)
                .then(() => {
                    const originalText = copyButton.textContent;
                    copyButton.textContent = (Lang.get('copied') || 'Copied');
                    setTimeout(() => {
                        copyButton.textContent = originalText;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy text:', err);
                    const originalText = copyButton.textContent;
                    copyButton.textContent = (Lang.get('copyError') || 'Error');
                    setTimeout(() => {
                        copyButton.textContent = originalText;
                    }, 2000);
                });
        });

        // Add buttons to container
        actionsContainer.appendChild(regenerateButton);
        actionsContainer.appendChild(deleteButton);
        actionsContainer.appendChild(copyButton);

        // Add container to response container
        responseContainer.appendChild(actionsContainer);

        // Ensure labels always match current language.
        this.localizeMessageActionButtons(responseContainer);

       //console.log('Message actions added successfully');
    }
    // Checks if a given error text matches known visual model errors
    isVisualModelError(text) {
        if (!text) return false;

        // Common error patterns for visual models
        const errorPatterns = [
            'failed to process inputs: this model is missing data required for image input',
            'model is missing data required for image input',
            'failed to create new sequence: failed to process inputs'
        ];

        return errorPatterns.some(pattern => text.includes(pattern));
    }
}

document.addEventListener('DOMContentLoaded', () => {
   //console.log('DOMContentLoaded: Setting up Chat static methods for global access');

    // Ensure Chat class methods are available globally via both Chat and chat
    if (window.Chat) {
        // Make sure window.Chat has the required methods
        if (!window.Chat.deleteConversationPair) {
            window.Chat.deleteConversationPair = function (messageElement) {
                if (window.chat && typeof window.chat.deleteConversationPair === 'function') {
                    return window.chat.deleteConversationPair(messageElement);
                } else {
                    console.error('deleteConversationPair not available on window.chat');
                    return false;
                }
            };
           //console.log('Set up window.Chat.deleteConversationPair');
        }

        if (!window.Chat.regenerateMessage) {
            window.Chat.regenerateMessage = function (messageElement) {
                if (window.chat && typeof window.chat.regenerateMessage === 'function') {
                    return window.chat.regenerateMessage(messageElement);
                } else {
                    console.error('regenerateMessage not available on window.chat');
                    return false;
                }
            };
           //console.log('Set up window.Chat.regenerateMessage');
        }
    }

    // Also make sure the instance methods are available if needed
    if (window.chat && !window.chatInstance) {
        window.chatInstance = window.chat;
       //console.log('Set window.chatInstance from window.chat');
    }
});


// Also make sure to add this line to expose Chat globally if needed
window.Chat = Chat;
