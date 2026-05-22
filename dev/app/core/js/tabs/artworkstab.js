class ArtworksTab {
    // Initializes the ArtworksTab class and sets up initial state
    constructor() {
       //console.log('ArtworksTab: Initializing ArtworksTab class');
        this.artworksInstance = null;
        this.initialized = false;
        this.imageFile = null;
        this.imageBase64 = null;

        // UI Elements will be initialized later
        this.elements = {};
    }

    isOnlineDeploymentMode() {
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

    getRateLimitMessage() {
        return (window.Lang && typeof Lang.get === 'function' && Lang.get('ollamaRateLimitExceeded'))
            || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.';
    }

    isRateLimitError(error) {
        const msg = String(error?.message || '').toLowerCase();
        return msg.includes('429')
            || msg.includes('420')
            || msg.includes('too many requests')
            || msg.includes('weekly usage')
            || msg.includes('daily limit')
            || msg.includes('rate limit');
    }

    isOllamaSubscriptionRequiredError(error) {
        const msg = String(error?.message || '').toLowerCase();
        return msg.includes('requires a subscription')
            || msg.includes('subscription is required')
            || msg.includes('subscription required for access')
            || msg.includes('upgrade for access')
            || msg.includes('ollama.com/upgrade')
            || msg.includes('this model requires a subscription');
    }

    isOllamaApiKeyError(error) {
        const msg = String(error?.message || '').toLowerCase();
        const directStatus = Number(error?.status || error?.statusCode || error?.response?.status || NaN);
        if (this.isOllamaSubscriptionRequiredError(error)) {
            return false;
        }
        if (directStatus === 401 || directStatus === 403) {
            return true;
        }

        return /(^|\D)401(\D|$)/.test(msg)
            || /(^|\D)403(\D|$)/.test(msg)
            || msg.includes('unauthorized')
            || msg.includes('forbidden')
            || msg.includes('cloudproxy401')
            || msg.includes('keylen=0')
            || msg.includes('invalid api key')
            || msg.includes('missing api key')
            || msg.includes('api key required')
            || msg.includes('ollama api key required')
            || msg.includes('api key appears invalid')
            || msg.includes('api key appears expired');
    }

    // Initializes the ArtworksTab, sets up UI, event handlers, and loads preferences
    async initialize() {
        if (this.initialized) return true;

        try {
            
            // Add CSS styles
            this.addStyles();

            // Initialize or get Artworks instance
            if (!window.artworksInstance) {
               //console.log('ArtworksTab: Creating new Artworks instance');
                window.artworksInstance = new Artworks();
            }
            this.artworksInstance = window.artworksInstance;

            // Initialize the artworks class
            await this.artworksInstance.initialize();

            // Setup UI
            this.setupUI();

            // Setup event handlers
            this.setupEventHandlers();

            // The UI is now ready, load saved preferences
            // (loadSavedModelSelection is already called from populateModelSelector)

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('ArtworksTab: Initialization error:', error);
            return false;
        }
    }

    // Adds CSS styles from the Artworks class to the document
    addStyles() {
        // Add CSS styles from the Artworks class
        const styleElement = document.createElement('style');
        styleElement.textContent = Artworks.css;
        document.head.appendChild(styleElement);
    }

    // Sets up the UI for the Artworks tab, including all controls and layout
    setupUI() {
        const artworkTab = document.getElementById('artwork-tab');
        if (!artworkTab) {
            console.error('ArtworksTab: Could not find artwork-tab element');
            return;
        }

        // Clear any existing content
        artworkTab.innerHTML = '';

        // Check if visual models are available
        if (!this.artworksInstance.hasVisualModels()) {
            this.showNoModelsUI(artworkTab);
            return;
        }

        // Create UI structure without the warning box
        artworkTab.innerHTML = `
        <div class="artwork-container">
            <div class="artwork-section">
                <label for="artwork-model-selector">${Lang.get('artworkSelectVisualModel')}</label>
                <select id="artwork-model-selector" class="artwork-model-selector"></select>
            </div>
            
            <div class="artwork-section">
                <label>${Lang.get('artworkSelectMode')}</label>
                <div class="artwork-mode-buttons">
                    <button id="artwork-mode-style" class="artwork-mode-button active">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"></path>
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2Z"></path>
                        </svg>
                        <span>${Lang.get('artworkHtmlStyleTransfer')}</span>
                    </button>
                    <button id="artwork-mode-overlay" class="artwork-mode-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <path d="M7 7h10"></path>
                            <path d="M7 12h10"></path>
                            <path d="M7 17h5"></path>
                        </svg>
                        <span>${Lang.get('artworkTextOverlay')}</span>
                    </button>
                </div>
            </div>
            
            <div class="artwork-section">
                <label>${Lang.get('artworkUploadReferenceImage')}</label>
                <div id="artwork-upload-area" class="artwork-upload-area">
                    <div class="artwork-upload-placeholder">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <p>${Lang.get('artworkDragImageOrClick')}</p>
                    </div>
                </div>
                
                <div id="artwork-image-preview" class="artwork-image-preview">
                    <img id="artwork-preview-img" src="" alt="Preview">
                    <button id="artwork-remove-image" class="artwork-remove-image">×</button>
                    <div class="artwork-image-options">
                        <label class="artwork-checkbox-container">
                            <input type="checkbox" id="artwork-use-as-background">
                            <span class="artwork-checkbox-label">${Lang.get('artworkUseAsBackground')}</span>
                        </label>
                    </div>
                </div>
                
                <!-- Hidden file input -->
                <input type="file" id="artwork-file-input" accept="image/*" style="display: none;">
            </div>
            
            <div class="artwork-section">
                <label for="artwork-prompt">${Lang.get('artworkDesignInstructions')}</label>
                <textarea 
                    id="artwork-prompt" 
                    class="artwork-prompt-input" 
                    placeholder="${Lang.get('artworkDesignInstructionsPlaceholder')}"></textarea>
            </div>

            <div id="artwork-webstyle-clone-section" class="artwork-section artwork-webstyle-clone-section" style="display: none;">
                <label for="artwork-webstyle-clone-input">${Lang.get('artworkCloneWebsiteStyleFrom') || 'Clone website style from:'}</label>
                <input
                    type="text"
                    id="artwork-webstyle-clone-input"
                    class="artwork-webstyle-clone-input"
                    placeholder="${Lang.get('artworkCloneWebsiteStylePlaceholder') || 'www.acoolwebsite.com'}">
            </div>
            
            <div class="artwork-actions">
                <button id="artwork-generate-btn" class="artwork-generate-btn" disabled>
                    ${Lang.get('artworkGenerateDesign')}
                </button>
            </div>
        </div>
    `;

        // Add CSS fixes for the UI issues
        this.addCustomStyles();

        // Store references to UI elements - remove warningBox reference
        this.elements = {
            modelSelector: document.getElementById('artwork-model-selector'),
            modeButtons: {
                style: document.getElementById('artwork-mode-style'),
                overlay: document.getElementById('artwork-mode-overlay')
            },
            uploadArea: document.getElementById('artwork-upload-area'),
            fileInput: document.getElementById('artwork-file-input'),
            imagePreview: document.getElementById('artwork-image-preview'),
            previewImg: document.getElementById('artwork-preview-img'),
            removeImageBtn: document.getElementById('artwork-remove-image'),
            promptInput: document.getElementById('artwork-prompt'),
            webstyleCloneSection: document.getElementById('artwork-webstyle-clone-section'),
            webstyleCloneInput: document.getElementById('artwork-webstyle-clone-input'),
            generateBtn: document.getElementById('artwork-generate-btn'),
            useAsBackgroundCheckbox: document.getElementById('artwork-use-as-background'),
            propertiesPanel: document.getElementById('artwork-properties-panel'),
            textContent: document.getElementById('artwork-text-content'),
            fontFamily: document.getElementById('artwork-font-family'),
            fontSize: document.getElementById('artwork-font-size'),
            fontSizeValue: document.getElementById('artwork-font-size-value'),
            fontWeight: document.getElementById('artwork-font-weight'),
            textColor: document.getElementById('artwork-text-color'),
            textColorValue: document.getElementById('artwork-text-color-value'),
            textAlign: document.getElementById('artwork-text-align'),
            fontStyle: document.getElementById('artwork-font-style'),
            textShadow: document.getElementById('artwork-text-shadow')
        };

        // Set default mode
        this.activeMode = 'style';

        // Setup tooltips
        this.setupTooltips();

        // Populate model selector
        this.populateModelSelector();
        this.updateWebsiteStyleCloneVisibility();
    }


    // Loads the saved visual model selection from the database and restores it
    async loadSavedModelSelection() {
        try {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            if (!hashedMasterKey) return;

            // Load settings from database
            const settings = await PaiperworkDB.loadSettings(hashedMasterKey);

            // Look for visualModel property
            if (settings && settings.visualModel && this.elements.modelSelector) {
                // Check if the saved model is in the list of available models
                const savedModel = settings.visualModel;
                const isModelAvailable = Array.from(this.elements.modelSelector.options)
                    .some(option => option.value === savedModel);

                if (isModelAvailable) {
                   //console.log('ArtworksTab: Restoring saved vision model:', savedModel);
                    this.elements.modelSelector.value = savedModel;
                    this.artworksInstance.selectedModel = savedModel;

                    // Update button state
                    this.updateGenerateButtonState();
                } else {
                   //console.log('ArtworksTab: Saved model is no longer available, using default');
                }
            }
        } catch (error) {
            console.error('ArtworksTab: Error loading saved vision model:', error);
        }
    }
    // Populates the model selector dropdown and loads saved selection if available
    populateModelSelector() {
        const { modelSelector } = this.elements;
        if (!modelSelector) return;
        const onlineMode = this.isOnlineDeploymentMode();

        // Clear existing options
        modelSelector.innerHTML = `<option value="">${Lang.get('artworkSelectVisualModelOption')}</option>`;

        const localVisualModels = Array.isArray(this.artworksInstance.localVisualModels)
            ? this.artworksInstance.localVisualModels
            : this.artworksInstance.visualModels.filter(model => model.provider !== 'cloud');

        const cloudVisualModels = Array.isArray(this.artworksInstance.cloudVisualModels)
            ? this.artworksInstance.cloudVisualModels
            : this.artworksInstance.visualModels.filter(model => model.provider === 'cloud');

        const appendGroupHeader = (label) => {
            const headerOption = document.createElement('option');
            headerOption.value = '';
            headerOption.disabled = true;
            headerOption.className = 'model-group-header';
            headerOption.textContent = `--- ${label} ---`;
            modelSelector.appendChild(headerOption);
        };

        const appendModelOption = (model) => {
            const option = document.createElement('option');
            option.value = model.name;
            option.textContent = model.name;
            option.dataset.provider = model.provider || 'local';
            modelSelector.appendChild(option);
        };

        let localVisualModelsForDisplay = localVisualModels;
        let cloudVisualModelsForDisplay = cloudVisualModels;

        if (onlineMode) {
            localVisualModelsForDisplay = [];

            // In hosted mode local /api/tags can be cloud-routed; display those as cloud entries.
            const merged = [...cloudVisualModels, ...localVisualModels];
            const seen = new Set();
            cloudVisualModelsForDisplay = merged
                .map(model => {
                    const normalizedName = (window.OllamaAPI && typeof window.OllamaAPI.normalizeCloudModelName === 'function')
                        ? window.OllamaAPI.normalizeCloudModelName(model?.name || '')
                        : String(model?.name || '');
                    return {
                        ...model,
                        name: normalizedName,
                        provider: 'cloud'
                    };
                })
                .filter(model => {
                    const name = String(model?.name || '').trim();
                    if (!name || seen.has(name)) return false;
                    seen.add(name);
                    return true;
                })
                .sort((a, b) => String(a.name).localeCompare(String(b.name)));
        }

        if (localVisualModelsForDisplay.length > 0) {
            appendGroupHeader(Lang.get('artworkLocalVisualModelsHeader') || 'LOCAL VISUAL MODELS');
            localVisualModelsForDisplay.forEach(appendModelOption);
        }

        if (cloudVisualModelsForDisplay.length > 0) {
            appendGroupHeader(Lang.get('artworkCloudVisualModelsHeader') || 'CLOUD VISUAL MODELS');
            cloudVisualModelsForDisplay.forEach(appendModelOption);
        }

        // Fallback for unexpected data shapes.
        if (localVisualModelsForDisplay.length === 0 && cloudVisualModelsForDisplay.length === 0) {
            const fallbackModels = onlineMode
                ? this.artworksInstance.visualModels.map(model => ({ ...model, provider: 'cloud' }))
                : this.artworksInstance.visualModels;
            fallbackModels.forEach(appendModelOption);
        }

        const availableModels = [...localVisualModelsForDisplay, ...cloudVisualModelsForDisplay];

        if (availableModels.length === 1) {
            modelSelector.value = availableModels[0].name;
            this.artworksInstance.selectedModel = modelSelector.value;

            // Save this auto-selection with the visual model key
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            if (hashedMasterKey) {
                PaiperworkDB.saveVisualModel(hashedMasterKey, this.artworksInstance.selectedModel)
                    .catch(err => console.error('Error saving auto-selected model:', err));
            }
        } else {
            // Try to load the previously saved model selection
            this.loadSavedModelSelection();
        }
    }

    // Displays a UI message when no visual models are available
    showNoModelsUI(container) {
        container.innerHTML = `
            <div class="artwork-container">
                <h2 class="artwork-title">${Lang.get('artworkVisualDesignStudio')}</h2>
                <p class="artwork-description">
                    ${Lang.get('artworkCreateDesignsDescription')}
                </p>
                
                <div class="no-models-message">
                    <div class="no-models-icon">⚠️</div>
                    <div class="no-models-title">${Lang.get('artworkNoVisualModelsAvailable')}</div>
                    <p class="no-models-description">
                        ${Lang.get('artworkFeatureRequiresVisualModels')}
                    </p>
                    <p class="no-models-description">
                        ${Lang.get('artworkNoCompatibleModelsInstalled')}
                    </p>
                    <p class="no-models-description">
                        ${Lang.get('artworkInstallModelsLike')}
                    </p>
                    <p class="no-models-description">
                        ${Lang.get('artworkToUseThisFeature')}
                    </p>
                    <button class="goto-models-btn" id="goto-models-btn">
                        ${Lang.get('artworkGoToModelsTab')}
                    </button>
                </div>
            </div>
        `;

        // Add event listener to the go to models button
        const gotoModelsBtn = document.getElementById('goto-models-btn');
        if (gotoModelsBtn) {
            gotoModelsBtn.addEventListener('click', () => {
                // Find and click the models tab button
                const modelsTabButton = document.querySelector('.tab-button[data-tab="models"]');
                if (modelsTabButton) {
                    modelsTabButton.click();
                }
            });
        }
    }
    // Handles tab activation and deactivation, including cleanup and context reset
    handleTabChange(isActive) {
        if (!this.initialized) return;

       //console.log(`ArtworksTab: Handle tab change, isActive=${isActive}`);

        if (!isActive) {
            // We're leaving the ArtworksTab
           //console.log('ArtworksTab: Tab deactivated, cleaning up');

            // Clean up any image data to prevent memory leaks
            if (this.imageBase64) {
               //console.log('ArtworksTab: Clearing image data');
                this.imageBase64 = null;
                this.imageFile = null;

                // Clear global references that might be used by Ollama
                if (window.cleanedImageBase64) {
                    window.cleanedImageBase64 = null;
                }
                if (window.cleanedImageBase64Array) {
                    window.cleanedImageBase64Array = null;
                }
            }

            // Reset Ollama context to prevent image data persistence
            if (window.OllamaAPI) {
               //console.log('ArtworksTab: Resetting Ollama context');
                window.OllamaAPI.resetContext();

                // Rebuild system prompt for text conversation
                const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                if (hashedMasterKey) {
                    window.OllamaAPI.buildCompleteSystemPrompt(hashedMasterKey).then(systemPrompt => {
                       //console.log('ArtworksTab: System prompt rebuilt for chat context');
                    });
                }
            }

            // Set up continuation button if needed
            this.setupContinuationButton();
        } else {
            // We're activating the ArtworksTab
           //console.log('ArtworksTab: Tab activated');

            // Reset Ollama context to ensure clean state
            if (window.OllamaAPI) {
                window.OllamaAPI.resetContext();
            }
        }
    }

    // Sets up the continuation button for conversation history in the chat
    setupContinuationButton() {
        // Only proceed if RAG and OllamaAPI are available
        if (!window.RAG || !window.OllamaAPI) return;

        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!hashedMasterKey) return;

        // Load conversation history
        window.RAG.loadConversations(hashedMasterKey).then(conversations => {
            if (conversations && conversations.length > 0) {
                // Find the last AI message container
                const aiReplies = document.querySelector('.ai-replies');
                if (!aiReplies) return;

                const lastAIMessage = aiReplies.querySelector('.assistant-message:last-child');
                if (!lastAIMessage) return;

                // Check if we already have a continue button
                if (lastAIMessage.nextElementSibling &&
                    lastAIMessage.nextElementSibling.classList.contains('continue-conversation-button')) {
                    return; // Button already exists
                }

                // Skip adding continuation button if the aiReplies only contains the welcome message
                const assistantMessagesAllArt = aiReplies.querySelectorAll('.assistant-message');
                const hasOnlyWelcomeArt = (assistantMessagesAllArt.length === 1 && assistantMessagesAllArt[0].classList.contains('welcome-message'));

                if (!hasOnlyWelcomeArt) {
                    // Add continuation button after the last AI message
                    const continueButton = window.OllamaAPI.createContinueButton(conversations, aiReplies);
                    if (continueButton) {
                        lastAIMessage.after(continueButton);
                    }
                }
            }
        }).catch(error => {
            console.error('ArtworksTab: Error setting up continuation button:', error);
        });
    }

    // Updates the state and appearance of the generate button based on requirements
    updateGenerateButtonState() {
        if (!this.elements || !this.elements.generateBtn) return;

        const { modelSelector, promptInput, generateBtn } = this.elements;

        // Check requirements: model, prompt, and image
        const hasModel = modelSelector && modelSelector.value && modelSelector.value.trim() !== '';
        const hasPrompt = promptInput && promptInput.value && promptInput.value.trim() !== '';
        const hasImage = !!this.imageBase64;

        // For visual designs, we MUST have an image
        const isEnabled = hasModel && hasPrompt && hasImage;

        // Update button state
        generateBtn.disabled = !isEnabled;

        // Visual feedback on button
        if (isEnabled) {
            generateBtn.classList.add('active');
        } else {
            generateBtn.classList.remove('active');

            // Show helpful tooltip about what's missing
            let reason = '';
            if (!hasModel) reason = Lang.get('artworkPleaseSelectVisualModel');
            else if (!hasImage) reason = Lang.get('artworkPleaseUploadReferenceImage');
            else if (!hasPrompt) reason = Lang.get('artworkPleaseProvideDesignInstructions');

            generateBtn.setAttribute('title', reason);
        }
    }

    // Sets up all event handlers for UI elements in the Artworks tab
    setupEventHandlers() {
        // Skip if no models available (UI is different)
        if (!this.artworksInstance.hasVisualModels()) return;

        const {
            modelSelector, modeButtons, uploadArea, fileInput,
            removeImageBtn, promptInput, generateBtn
        } = this.elements;

        // Initialize last known value for model selector to avoid unnecessary unloads
        try {
            modelSelector.__lastModelValue = modelSelector.value || '';
        } catch (e) {
            modelSelector.__lastModelValue = '';
        }

        // Model selection change - localized unload-on-select logic added
        modelSelector.addEventListener('change', async (event) => {
            this.artworksInstance.selectedModel = modelSelector.value;
            this.updateGenerateButtonState();

            // --- Unload-on-select (localized to ArtworksTab)
            try {
                // Only react for real user interactions
                if (event && event.isTrusted) {
                    const newValue = modelSelector.value || '';
                    if (newValue !== modelSelector.__lastModelValue) {
                        if (modelSelector.__unloadDebounceTimeout) clearTimeout(modelSelector.__unloadDebounceTimeout);
                        modelSelector.__unloadDebounceTimeout = setTimeout(async () => {
                            try {
                                if (this && typeof this.unloadOllamaModels === 'function') {
                                   //console.log('ArtworksTab: User changed visual model — calling ArtworksTab.unloadOllamaModels() to free memory.');
                                    await this.unloadOllamaModels();
                                } else {
                                    console.warn('ArtworksTab: unloadOllamaModels not found on ArtworksTab; skipping unload on model change.');
                                }
                            } catch (err) {
                                console.error('ArtworksTab: Error while unloading Ollama models on model change:', err);
                            } finally {
                                modelSelector.__lastModelValue = newValue;
                            }
                        }, 300);
                    }
                }
            } catch (err) {
                console.error('ArtworksTab: Error in unload-on-select handler:', err);
            }

            // Save the selected model to database
            if (this.artworksInstance.selectedModel) {
                try {
                    const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                    if (hashedMasterKey) {
                        await PaiperworkDB.saveVisualModel(hashedMasterKey, this.artworksInstance.selectedModel);
                       //console.log('ArtworksTab: Saved selected vision model to database');
                    }
                } catch (error) {
                    console.error('ArtworksTab: Error saving vision model preference:', error);
                }
            }
        });

        // Mode buttons click handlers
        Object.keys(modeButtons).forEach(mode => {
            modeButtons[mode].addEventListener('click', () => {
                // Remove active class from all buttons
                Object.values(modeButtons).forEach(btn => {
                    btn.classList.remove('active');
                });

                // Add active class to clicked button
                modeButtons[mode].classList.add('active');

                // Set active mode
                this.activeMode = mode;

                const orientationInfo = document.querySelector('.artwork-orientation-info');
                if (orientationInfo) {
                    orientationInfo.style.display = mode === 'overlay' ? 'block' : 'none';
                }
                // Update prompt placeholder based on mode
                this.updatePromptPlaceholder();
                this.updateWebsiteStyleCloneVisibility();

                // Show/hide properties panel based on mode
                if (this.elements.propertiesPanel) {
                    this.elements.propertiesPanel.style.display = mode === 'overlay' ? 'block' : 'none';
                }

                // Show/hide "Use as background" checkbox based on mode
                if (this.elements.useAsBackgroundCheckbox && this.imageBase64) {
                    if (mode === 'style') {
                        this.elements.useAsBackgroundCheckbox.parentElement.style.display = 'flex';
                    } else {
                        this.elements.useAsBackgroundCheckbox.parentElement.style.display = 'none';
                        // Uncheck if not in style mode
                        this.elements.useAsBackgroundCheckbox.checked = false;
                    }
                }
            });
        });

        // Image upload area click
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.handleImageSelection(e.target.files[0]);
            }
        });

        // Drag and drop handling
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--accent-color, #4f46e5)';
            uploadArea.style.backgroundColor = 'rgba(79, 70, 229, 0.05)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--border-color)';
            uploadArea.style.backgroundColor = 'transparent';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border-color)';
            uploadArea.style.backgroundColor = 'transparent';

            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                this.handleImageSelection(e.dataTransfer.files[0]);
            }
        });

        // Remove image button
        removeImageBtn.addEventListener('click', () => {
            this.removeImage();
        });

        // Prompt input change
        promptInput.addEventListener('input', () => {
            this.updateGenerateButtonState();
        });

        // Generate button click
        generateBtn.addEventListener('click', () => {
            this.generateArtwork();
        });

        // Properties Panel Event Handlers
        const {
            propertiesPanel, textContent, fontFamily, fontSize, fontSizeValue,
            fontWeight, textColor, textColorValue, textAlign, fontStyle, textShadow
        } = this.elements;

        // Show/hide properties panel based on mode
        if (propertiesPanel) {
            propertiesPanel.style.display = this.activeMode === 'overlay' ? 'block' : 'none';
        }

        // Text content change
        if (textContent) {
            textContent.addEventListener('input', () => {
                this.updateTextOverlay();
            });
        }

        // Font family change
        if (fontFamily) {
            fontFamily.addEventListener('change', () => {
                this.updateTextOverlay();
            });
        }

        // Font size change
        if (fontSize) {
            fontSize.addEventListener('input', () => {
                if (fontSizeValue) {
                    fontSizeValue.textContent = fontSize.value;
                }
                this.updateTextOverlay();
            });
        }

        // Font weight change
        if (fontWeight) {
            fontWeight.addEventListener('change', () => {
                this.updateTextOverlay();
            });
        }

        // Text color change
        if (textColor) {
            textColor.addEventListener('input', () => {
                if (textColorValue) {
                    textColorValue.textContent = textColor.value;
                }
                this.updateTextOverlay();
            });
        }

        // Text alignment change
        if (textAlign) {
            textAlign.addEventListener('change', () => {
                this.updateTextOverlay();
            });
        }

        // Font style change
        if (fontStyle) {
            fontStyle.addEventListener('change', () => {
                this.updateTextOverlay();
            });
        }

        // Text shadow toggle
        if (textShadow) {
            textShadow.addEventListener('change', () => {
                this.updateTextOverlay();
            });
        }

        const chatForm = document.querySelector('.chat-form');
        if (chatForm) {
            chatForm.addEventListener('submit', async (e) => {
                // If we're in the artwork tab but submitting a chat message,
                // we need to restore the system prompt first
                await this.restoreSystemPrompt();
            });

            // Also listen for send button clicks
            const sendButton = document.getElementById('send-prompt');
            if (sendButton) {
                sendButton.addEventListener('click', async () => {
                    // Only try to restore if we're not already generating
                    if (!window.isGenerating) {
                        await this.restoreSystemPrompt();
                    }
                });
            }
        }
        promptInput.addEventListener('keydown', (e) => {
            // Check if Enter key was pressed without Shift key
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent default behavior (newline)

                // Only trigger if the generate button is enabled
                if (!generateBtn.disabled) {
                   //console.log('ArtworksTab: Enter key pressed in prompt input, triggering generation');
                    generateBtn.click();
                } else {
                    // Provide feedback if button is disabled
                    const reason = generateBtn.getAttribute('title') || 'Cannot generate yet';
                   //console.log(`ArtworksTab: Generation not possible: ${reason}`);


                }
            }
        });
    }

    // Handles image file selection, reads the image, and updates the preview
    handleImageSelection(file) {
        // Check file type
        if (!file.type.startsWith('image/')) {
            alert(Lang.get('artworkPleaseSelectImageFile'));
            return;
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert(Lang.get('artworkImageTooLarge'));
            return;
        }

        this.imageFile = file;

        // Read the file and show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            // Store the full data URL including prefix
            this.imageBase64 = e.target.result;

            // IMPORTANT: Prepare cleaned version for Ollama API
            if (this.imageBase64.includes('base64,')) {
                window.cleanedImageBase64 = this.imageBase64.split('base64,')[1];
            } else {
                window.cleanedImageBase64 = this.imageBase64;
            }
            const img = new Image();
            img.onload = () => {
                const width = img.width;
                const height = img.height;
                const orientation = width > height ? 'Landscape' : (width < height ? 'Portrait' : 'Square');
                const ratio = (width / height).toFixed(2);

                // Store this info for use in prompts
                this.imageWidth = width;
                this.imageHeight = height;
                this.imageOrientation = orientation;
                this.imageRatio = ratio;
                this.imageDimensions = `${width}×${height}`;

                // Create or update orientation info element
                let orientationInfo = this.elements.imagePreview.querySelector('.artwork-orientation-info');
                if (!orientationInfo) {
                    orientationInfo = document.createElement('div');
                    orientationInfo.className = 'artwork-orientation-info';
                    this.elements.imagePreview.appendChild(orientationInfo);
                }

                orientationInfo.innerHTML = `<span>Image: ${orientation} (${width}×${height}, ratio: ${ratio})</span>`;

                // Show orientation info only for text overlay mode
                orientationInfo.style.display = this.activeMode === 'overlay' ? 'block' : 'none';
            };
            img.src = this.imageBase64;
           //console.log('ArtworksTab: Image loaded and prepared for visual analysis');

            // Update UI
            this.elements.previewImg.src = this.imageBase64;
            this.elements.imagePreview.style.display = 'block';
            this.elements.uploadArea.style.display = 'none';

            // Show the "Use as background" checkbox for style mode only
            if (this.elements.useAsBackgroundCheckbox) {
                if (this.activeMode === 'style') {
                    this.elements.useAsBackgroundCheckbox.parentElement.style.display = 'flex';
                } else {
                    this.elements.useAsBackgroundCheckbox.parentElement.style.display = 'none';
                }
            }

            this.updateGenerateButtonState();
        };
        reader.readAsDataURL(file);
    }
    // Removes the currently selected image and resets related UI elements
    removeImage() {
        this.imageFile = null;
        this.imageBase64 = null;
        this.elements.previewImg.src = '';
        this.elements.imagePreview.style.display = 'none';
        this.elements.uploadArea.style.display = 'block';

        // Reset the checkbox
        if (this.elements.useAsBackgroundCheckbox) {
            this.elements.useAsBackgroundCheckbox.checked = false;
        }

        // Create a completely new file input element
        if (this.elements.fileInput) {
            // Get the parent element
            const parent = this.elements.fileInput.parentNode;

            // Create a brand new element (don't clone)
            const newFileInput = document.createElement('input');
            newFileInput.type = 'file';
            newFileInput.id = 'artwork-file-input';
            newFileInput.accept = 'image/*';
            newFileInput.style.display = 'none';

            // Replace the old input with the new one
            parent.removeChild(this.elements.fileInput);
            parent.appendChild(newFileInput);

            // Update our reference
            this.elements.fileInput = newFileInput;

            // Re-attach the event listener
            this.elements.fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.handleImageSelection(e.target.files[0]);
                }
            });

            // CRITICAL FIX: We also need to update the click handler on the upload area
            // First remove old listeners by cloning the element
            const oldUploadArea = this.elements.uploadArea;
            const newUploadArea = oldUploadArea.cloneNode(true);
            oldUploadArea.parentNode.replaceChild(newUploadArea, oldUploadArea);

            // Update our reference and add new event listener
            this.elements.uploadArea = newUploadArea;
            this.elements.uploadArea.addEventListener('click', () => {
               //console.log('ArtworksTab: Upload area clicked, opening file dialog');
                this.elements.fileInput.click();
            });

           //console.log('ArtworksTab: File input and upload area completely recreated');
        }

        this.updateGenerateButtonState();
    }
    // Sets up tooltips for elements with data-tooltip attributes
    setupTooltips() {
        // Get all elements with data-tooltip
        const tooltipElements = document.querySelectorAll('[data-tooltip]');

        tooltipElements.forEach(element => {
            let tooltipTimeout;
            let tooltipEl;

            // On mouseenter, start the timeout
            element.addEventListener('mouseenter', () => {
                // Clear any existing timeout
                if (tooltipTimeout) clearTimeout(tooltipTimeout);

                // Set a timeout to show the tooltip after 2 seconds
                tooltipTimeout = setTimeout(() => {
                    // Create tooltip element
                    tooltipEl = document.createElement('div');
                    tooltipEl.classList.add('artwork-tooltip');
                    tooltipEl.textContent = element.getAttribute('data-tooltip');

                    // Position the tooltip
                    document.body.appendChild(tooltipEl);

                    const rect = element.getBoundingClientRect();
                    tooltipEl.style.top = `${rect.bottom + 10}px`;
                    tooltipEl.style.left = `${rect.left + (rect.width / 2) - (tooltipEl.offsetWidth / 2)}px`;

                    // Add visible class
                    setTimeout(() => {
                        tooltipEl.classList.add('visible');
                    }, 10);
                }, 2000); // 2-second delay
            });

            // On mouseleave, clear the timeout and remove the tooltip
            element.addEventListener('mouseleave', () => {
                if (tooltipTimeout) {
                    clearTimeout(tooltipTimeout);
                    tooltipTimeout = null;
                }

                if (tooltipEl) {
                    tooltipEl.classList.remove('visible');

                    // Remove after transition
                    setTimeout(() => {
                        if (tooltipEl && tooltipEl.parentNode) {
                            tooltipEl.parentNode.removeChild(tooltipEl);
                        }
                        tooltipEl = null;
                    }, 300);
                }
            });
        });
    }
    // Updates the prompt input placeholder based on the selected mode
    updatePromptPlaceholder() {
        const { promptInput } = this.elements;

        switch (this.activeMode) {
            case 'style':
                promptInput.placeholder = Lang.get('artworkStyleModePlaceholder');
                break;
            case 'overlay':
                promptInput.placeholder = Lang.get('artworkOverlayModePlaceholder');
                break;
            case 'rationale':
                promptInput.placeholder = Lang.get('artworkRationaleModePlaceholder');
                break;
        }
    }

    updateWebsiteStyleCloneVisibility() {
        if (!this.elements || !this.elements.webstyleCloneSection) {
            return;
        }

        this.elements.webstyleCloneSection.style.display = this.activeMode === 'overlay' ? 'block' : 'none';
    }

    updateTextOverlay() {
        // Update the canvas renderer with current text overlay properties
        if (!this.artworksInstance || !this.artworksInstance.canvasRenderer) {
            return;
        }

        const {
            textContent, fontFamily, fontSize, fontWeight,
            textColor, textAlign, fontStyle, textShadow
        } = this.elements;

        // Get current text overlay properties from the properties panel
        const textOverlay = {
            text: textContent ? textContent.value : '',
            fontFamily: fontFamily ? fontFamily.value : 'Arial',
            fontSize: fontSize ? parseInt(fontSize.value) : 24,
            fontWeight: fontWeight ? fontWeight.value : 'normal',
            fillStyle: textColor ? textColor.value : '#ffffff',
            textAlign: textAlign ? textAlign.value : 'left',
            fontStyle: fontStyle ? fontStyle.value : 'normal',
            shadow: textShadow ? textShadow.checked : false
        };

        // Update the canvas renderer
        this.artworksInstance.canvasRenderer.updateTextOverlay(textOverlay);
    }

    async ensureOverlayEditorScriptsLoaded() {
        const overlayEditorReady = () => (
            typeof ArtworkCanvasRenderer !== 'undefined'
            && typeof CanvasInteractionHandler !== 'undefined'
            && typeof CanvasPreviewManager !== 'undefined'
        );

        if (overlayEditorReady()) {
            return true;
        }

        const loader = window.tabLoader;
        if (!loader || typeof loader.loadScript !== 'function') {
            throw new Error('Overlay editor loader is unavailable.');
        }

        const overlayScripts = [
            'js/tabs/artworkcanvasrenderer.js',
            'js/tabs/canvasinteractionhandler.js',
            'js/tabs/canvaspreviewmanager.js'
        ];

        for (const script of overlayScripts) {
            if (!loader.loadedModules[script]) {
                if (!loader.loadingPromises[script]) {
                    loader.loadingPromises[script] = loader.loadScript(script);
                }
                await loader.loadingPromises[script];
                loader.loadedModules[script] = true;
                delete loader.loadingPromises[script];
            }
        }

        await new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = loader.getTabLoadMaxAttempts ? loader.getTabLoadMaxAttempts() : 50;
            const checkInterval = window.setInterval(() => {
                attempts += 1;
                if (overlayEditorReady()) {
                    window.clearInterval(checkInterval);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    window.clearInterval(checkInterval);
                    reject(new Error('Timeout waiting for overlay editor components to load.'));
                }
            }, loader.pollIntervalMs || 100);
        });

        return true;
    }

    setArtworkProgressMessage(message, timingMessage = null) {
        const progressWindow = document.querySelector('.artwork-progress-window');
        if (!progressWindow) {
            return;
        }

        const messageEl = progressWindow.querySelector('.artwork-progress-message');
        if (messageEl && message) {
            messageEl.textContent = message;
        }

        if (timingMessage != null) {
            const timingEl = progressWindow.querySelector('.artwork-timing');
            if (timingEl) {
                timingEl.textContent = timingMessage;
            }
        }
    }

    logWebsiteStyleClone(step, details = null, level = 'info') {
        const entry = {
            timestamp: new Date().toISOString(),
            step,
            details: details && typeof details === 'object' ? details : (details == null ? undefined : { value: details })
        };

        if (!window.__paiperworkWebsiteStyleCloneLog || !Array.isArray(window.__paiperworkWebsiteStyleCloneLog)) {
            window.__paiperworkWebsiteStyleCloneLog = [];
        }
        window.__paiperworkWebsiteStyleCloneLog.push(entry);

        const logger = level === 'error'
            ? console.error
            : (level === 'warn' ? console.warn : console.info);
        try {
            //logger('[WebsiteStyleClone]', step, entry.details || {});
        } catch (_error) {
            console.info('[WebsiteStyleClone]', step);
        }

        return entry;
    }

    normalizeWebsiteStyleCloneUrl(rawValue) {
        const trimmed = String(rawValue || '').trim();
        if (!trimmed) {
            this.logWebsiteStyleClone('normalize-skipped-empty-input');
            return '';
        }

        this.logWebsiteStyleClone('normalize-start', {
            rawValue: trimmed,
            hasScheme: /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
        });

        const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
            ? trimmed
            : `https://${trimmed}`;

        let parsedUrl = null;
        try {
            parsedUrl = new URL(withScheme);
        } catch (_error) {
            this.logWebsiteStyleClone('normalize-invalid-url', { rawValue: trimmed, candidate: withScheme }, 'warn');
            throw new Error(Lang.get('artworkCloneWebsiteStyleInvalidUrl') || 'Please enter a valid website URL.');
        }

        if (!/^https?:$/i.test(parsedUrl.protocol) || !parsedUrl.hostname) {
            this.logWebsiteStyleClone('normalize-invalid-protocol-or-host', {
                candidate: parsedUrl.href,
                protocol: parsedUrl.protocol,
                hostname: parsedUrl.hostname
            }, 'warn');
            throw new Error(Lang.get('artworkCloneWebsiteStyleInvalidUrl') || 'Please enter a valid website URL.');
        }

        this.logWebsiteStyleClone('normalize-success', { normalizedUrl: parsedUrl.href });
        return parsedUrl.href;
    }

    async fetchWebsiteStyleReference(normalizedUrl) {
        if (!normalizedUrl) {
            this.logWebsiteStyleClone('fetch-skipped-empty-url');
            return null;
        }

        this.logWebsiteStyleClone('fetch-start', { normalizedUrl });

        this.setArtworkProgressMessage(
            Lang.get('artworkCloneWebsiteStyleLoading') || 'Analyzing website fonts and colors...',
            Lang.get('artworkGenerationTiming')
        );

        const response = await fetch(`/api/extract/style?url=${encodeURIComponent(normalizedUrl)}`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            let errorText = '';
            try {
                errorText = await response.text();
            } catch (_error) {
                errorText = '';
            }
            this.logWebsiteStyleClone('fetch-failed', {
                normalizedUrl,
                status: response.status,
                error: errorText || `HTTP ${response.status}`
            }, 'warn');
            throw new Error(errorText || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const result = {
            url: data && typeof data.url === 'string' ? data.url : normalizedUrl,
            fonts: Array.isArray(data?.fonts) ? data.fonts.filter(Boolean) : [],
            colors: Array.isArray(data?.colors) ? data.colors.filter(Boolean) : [],
            fontDescriptors: Array.isArray(data?.fontDescriptors)
                ? data.fontDescriptors.filter((font) => font && typeof font === 'object' && (font.family || font.fontFamily))
                : []
        };

        this.logWebsiteStyleClone('fetch-success', {
            normalizedUrl,
            resolvedUrl: result.url,
            fontCount: result.fonts.length,
            fontDescriptorCount: result.fontDescriptors.length,
            colorCount: result.colors.length,
            fonts: result.fonts,
            fontDescriptors: result.fontDescriptors,
            colors: result.colors
        });

        return result;
    }

    buildWebsiteStylePromptSuffix(styleReference) {
        if (!styleReference || typeof styleReference !== 'object') {
            this.logWebsiteStyleClone('prompt-suffix-skipped-no-style-reference');
            return '';
        }

        const fonts = Array.isArray(styleReference.fonts) ? styleReference.fonts.filter(Boolean) : [];
        const colors = Array.isArray(styleReference.colors) ? styleReference.colors.filter(Boolean) : [];
        const fontDescriptors = Array.isArray(styleReference.fontDescriptors)
            ? styleReference.fontDescriptors.filter((font) => font && typeof font === 'object' && (font.family || font.fontFamily))
            : [];
        if (!fonts.length && !colors.length && !fontDescriptors.length) {
            this.logWebsiteStyleClone('prompt-suffix-skipped-no-fonts-or-colors', {
                sourceUrl: styleReference.url || '',
                fontCount: fonts.length,
                fontDescriptorCount: fontDescriptors.length,
                colorCount: colors.length
            });
            return '';
        }

        const lines = ['Website style reference:'];
        if (styleReference.url) {
            lines.push(`- Source website: ${styleReference.url}`);
        }
        if (fonts.length) {
            lines.push(`- Use these fonts when appropriate: ${fonts.join(', ')}`);
        }
        if (fontDescriptors.length) {
            lines.push('- Prefer these exact website webfont descriptors before inventing substitutes:');
            fontDescriptors.slice(0, 10).forEach((font) => {
                lines.push(`  ${JSON.stringify(font)}`);
            });
            lines.push('- For text overlay JSON, copy these website-linked descriptors into overlay.webFonts and reference them from text elements using fontRef or matching fontFamily values.');
            lines.push('- When a website link is provided and the design has multiple text blocks, assign one website font per text block whenever practical so the overlay uses several different linked fonts instead of repeating one family everywhere.');
            lines.push('- Use the provided website font URLs directly when they exist. Do not replace them with Google Fonts or invented substitutes unless the descriptor itself already points to Google or no usable website font URL is available.');
        } else if (fonts.length) {
            lines.push('- For text overlay JSON, preserve website fonts by adding them to overlay.webFonts and referencing them from text elements using fontRef or fontFamily.');
            lines.push('- When a website link is provided and the design has multiple text blocks, spread the available website font families across the text blocks instead of repeating a single family unless readability clearly requires repetition.');
            lines.push('- When you only know the family name and not a real font URL, you may fall back to a compatible web font source, but do not default to Google Fonts unless it is a clear match.');
        }
        if (colors.length) {
            lines.push(`- Use these CSS colors when appropriate: ${colors.join(', ')}`);
            lines.push('- Reuse these website CSS colors for text, shapes, lines, ornaments, and text background panels when they fit the composition and maintain readability.');
        }
        lines.push('- Adapt these style cues to the uploaded image and preserve strong readability and contrast.');

        this.logWebsiteStyleClone('prompt-suffix-built', {
            sourceUrl: styleReference.url || '',
            fontCount: fonts.length,
            fontDescriptorCount: fontDescriptors.length,
            colorCount: colors.length,
            fonts,
            fontDescriptors,
            colors
        });

        return lines.join('\n');
    }

    isExternalProgressManaged() {
        return window.__campaignManagedArtworkProgress === true;
    }

    concealPreviewWindowForExternalWorkflow(previewWindow) {
        if (!this.isExternalProgressManaged() || !previewWindow) {
            return;
        }

        if (previewWindow.container) {
            previewWindow.container.style.visibility = 'hidden';
            previewWindow.container.style.opacity = '0';
            previewWindow.container.style.pointerEvents = 'none';
        }

        if (previewWindow.overlay) {
            previewWindow.overlay.style.visibility = 'hidden';
            previewWindow.overlay.style.opacity = '0';
            previewWindow.overlay.style.pointerEvents = 'none';
        }
    }

    // Shows a floating progress indicator window during image analysis/generation
    showProgressIndicator() {
        if (this.isExternalProgressManaged()) {
            window.isGenerating = true;
            this.disableChatControls();
            return;
        }

        // First, check if we already have a floating window
        let progressWindow = document.querySelector('.artwork-progress-window');

        // Always remove any existing window to ensure a fresh state
        if (progressWindow) {
            progressWindow.remove();
        }

        // Create a fresh progress window
        progressWindow = document.createElement('div');
        progressWindow.className = 'artwork-progress-window';
        progressWindow.innerHTML = `
        <div class="artwork-progress-header">
            <h3>${Lang.get('analyzingImage')}</h3>
            <button class="artwork-progress-close">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="artwork-progress-content">
            <div class="artwork-spinner"></div>
            <p class="artwork-progress-message">${Lang.get('analyzingImageAndGenerating')}</p>
            <p class="artwork-timing">${Lang.get('artworkGenerationTiming')}</p>
        </div>
    `;

        // Always create a fresh overlay
        let overlay = document.querySelector('.artwork-overlay');
        if (overlay) {
            overlay.remove();
        }
        overlay = document.createElement('div');
        overlay.className = 'artwork-overlay';
        document.body.appendChild(overlay);

        // Add the progress window to the body
        document.body.appendChild(progressWindow);

        // Set up the close button to abort the generation
        const closeBtn = progressWindow.querySelector('.artwork-progress-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
               //console.log('ArtworksTab: User canceled generation');
                if (window.artworkAbortController) {
                    window.artworkAbortController.abort();
                }
                this.hideProgressIndicator();
            });
        }

        // Set a global flag to indicate we're generating
        window.isGenerating = true;

        // Disable chat controls while generating
        this.disableChatControls();
    }
    // Hides the floating progress indicator window and overlay
    hideProgressIndicator() {
        // Hide the floating progress window
        const progressWindow = document.querySelector('.artwork-progress-window');
        if (progressWindow) {
            progressWindow.style.display = 'none';
        }

        // Hide the overlay
        const overlay = document.querySelector('.artwork-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        const systemPrompt = document.getElementById('system-prompt');
        if (systemPrompt) {
            systemPrompt.disabled = false;
        }

        // Clear the global generating flag
        window.isGenerating = false;

        // Re-enable chat controls
        this.enableChatControls();
    }

    disableChatControls() {
        const sendButton = document.getElementById('send-prompt');
        if (sendButton) {
            sendButton.disabled = true;
        }

        const promptInput = document.getElementById('prompt-input');
        if (promptInput) {
            promptInput.disabled = true;
        }

        const systemPrompt = document.getElementById('system-prompt');
        if (systemPrompt) {
            systemPrompt.disabled = true;
        }
    }

    enableChatControls() {
        const sendButton = document.getElementById('send-prompt');
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.textContent = 'Send';
            sendButton.classList.remove('cancel-state');
        }

        const promptInput = document.getElementById('prompt-input');
        if (promptInput) {
            promptInput.disabled = false;
        }

        const systemPrompt = document.getElementById('system-prompt');
        if (systemPrompt) {
            systemPrompt.disabled = false;
        }
    }

    // Stores the current system prompt before updating it for artwork generation
    async storeAndUpdateSystemPrompt() {
        // First, check if we already have stored the original system prompt
        if (!this.originalSystemPrompt) {
            // Get the current system prompt before we change it
            const systemPromptElement = document.getElementById('system-prompt');
            if (systemPromptElement) {
                this.originalSystemPrompt = systemPromptElement.value;
               //console.log('ArtworksTab: Stored original system prompt');
            }
        }

        return this.originalSystemPrompt;
    }

    // Restores the original system prompt after artwork generation is complete
    async restoreSystemPrompt() {
        // Only restore if we have an original stored
        if (this.originalSystemPrompt) {
            const systemPromptElement = document.getElementById('system-prompt');
            if (systemPromptElement) {
                // Change the system prompt back to original
                systemPromptElement.value = this.originalSystemPrompt;
               //console.log('ArtworksTab: Restored original system prompt');

                // Also rebuild the Ollama context with original prompt
                const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                if (hashedMasterKey && window.OllamaAPI) {
                    await window.OllamaAPI.buildCompleteSystemPrompt(hashedMasterKey, this.originalSystemPrompt);
                    // Reset context to ensure clean state
                    window.OllamaAPI.resetContext();
                   //console.log('ArtworksTab: Rebuilt system prompt and reset context');

                    // Update UI to show the change was made
                    const saveButton = document.getElementById('save-system-prompt');
                    if (saveButton) {
                        saveButton.disabled = true;
                    }
                }
            }
        }
    }

    // Adds custom CSS styles for the Artworks tab UI elements
    addCustomStyles() {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            /* Center the generate button */
            .artwork-actions {
                display: flex;
                justify-content: center;
                margin: 20px 0;
                width: 100%;
            }
            
            /* Make button more prominent */
            .artwork-generate-btn {
                padding: 12px 24px;
                font-size: 16px;
                border-radius: 6px;
                background-color: var(--accent-color, #4f46e5);
                color: white;
                border: none;
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 200px;
            }
            
            .artwork-generate-btn:hover:not([disabled]) {
                background-color: var(--accent-color-dark, #3c35b5);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            
            .artwork-generate-btn[disabled] {
                background-color: #cccccc;
                cursor: not-allowed;
                opacity: 0.7;
            }
            
            /* Fix the text area width to prevent overflow */
            .artwork-prompt-input {
                width: 100%;
                box-sizing: border-box;
                min-height: 100px;
                padding: 12px;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 6px;
                font-family: inherit;
                font-size: 14px;
                resize: vertical;
                margin-bottom: 10px;
            }

            .artwork-webstyle-clone-input {
                width: 100%;
                box-sizing: border-box;
                padding: 12px;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 6px;
                font-family: inherit;
                font-size: 14px;
                background-color: var(--bg-color, #ffffff);
                color: var(--text-color, inherit);
            }
            
            /* Ensure container respects boundaries */
            .artwork-container {
                width: 100%;
                max-width: 100%;
                padding: 20px;
                box-sizing: border-box;
                overflow-x: hidden;
            }
            
            /* Improve section spacing */
            .artwork-section {
                margin-bottom: 20px;
                width: 100%;
                max-width: 100%;
            }
            
            /* Better responsive layout for mode buttons */
            .artwork-mode-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                justify-content: center;
            }
           /* Progress indicator styles */
            .artwork-progress-bar {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 4px;
                background: linear-gradient(90deg, var(--accent-color, #4f46e5) 0%, var(--accent-color-light, #818cf8) 50%, var(--accent-color, #4f46e5) 100%);
                background-size: 200% 100%;
                animation: artwork-progress-animation 1.5s linear infinite;
                z-index: 1000;
            }
            
            @keyframes artwork-progress-animation {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            
            .artwork-generating-indicator {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 30px;
                text-align: center;
            }
            
            .artwork-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(79, 70, 229, 0.3);
                border-radius: 50%;
                border-top-color: var(--accent-color, #4f46e5);
                animation: artwork-spin 1s linear infinite;
                margin-bottom: 15px;
            }
            
            .artwork-timing {
                font-size: 12px;
                opacity: 0.7;
                margin-top: 5px;
            }
            
            @keyframes artwork-spin {
                to { transform: rotate(360deg); }
            }
             /* Checkbox styling */
            .artwork-image-options {
                margin-top: 10px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .artwork-checkbox-container {
                display: flex;
                align-items: center;
                font-size: 14px;
                cursor: pointer;
            }
            
            .artwork-checkbox-container input[type="checkbox"] {
                margin-right: 8px;
                cursor: pointer;
            }
            
            .artwork-checkbox-label {
                color: var(--text-color);
            }
            
            .artwork-checkbox-tooltip {
                margin-left: 5px;
                color: var(--text-muted);
                font-size: 12px;
                cursor: help;
            }
                .artwork-orientation-info {
            margin-top: 10px;
            font-size: 14px;
            color: var(--text-muted, #64748b);
            text-align: center;
            padding: 5px;
            background-color: var(--bg-muted, #f8fafc);
            border-radius: 4px;
            width: 100%;
        }
            
            /* Properties Panel Styles */
            .artwork-properties-panel {
                background-color: var(--bg-muted, #f8fafc);
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 8px;
                padding: 20px;
                margin-top: 20px;
            }
            
            .artwork-properties-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
            }
            
            .artwork-property-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .artwork-property-group label {
                font-size: 13px;
                font-weight: 600;
                color: var(--text-color);
            }
            
            .artwork-text-content-input {
                width: 100%;
                padding: 10px;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 6px;
                font-family: inherit;
                font-size: 14px;
                resize: vertical;
                background-color: var(--bg-color, #ffffff);
                color: var(--text-color);
            }
            
            .artwork-font-family-select,
            .artwork-font-weight-select,
            .artwork-text-align-select,
            .artwork-font-style-select {
                width: 100%;
                padding: 10px;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 6px;
                font-family: inherit;
                font-size: 14px;
                background-color: var(--bg-color, #ffffff);
                color: var(--text-color);
                cursor: pointer;
            }
            
            .artwork-font-size-input {
                width: 100%;
                padding: 8px;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 6px;
                font-family: inherit;
                font-size: 14px;
                background-color: var(--bg-color, #ffffff);
                color: var(--text-color);
                cursor: pointer;
            }
            
            .artwork-font-size-value {
                font-weight: 600;
                color: var(--accent-color, #4f46e5);
            }
            
            .artwork-color-picker-wrapper {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .artwork-text-color-input {
                width: 50px;
                height: 40px;
                padding: 2px;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 6px;
                cursor: pointer;
                background-color: var(--bg-color, #ffffff);
            }
            
            .artwork-color-value {
                font-size: 13px;
                color: var(--text-color);
                font-family: monospace;
            }
            
            .artwork-checkbox-container {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                cursor: pointer;
            }
            
            .artwork-checkbox-container input[type="checkbox"] {
                width: 18px;
                height: 18px;
                cursor: pointer;
            }
            
            .artwork-checkbox-label {
                color: var(--text-color);
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .artwork-properties-grid {
                    grid-template-columns: 1fr;
                }
            }
    `;
        document.head.appendChild(styleEl);
    }
    // Handles the artwork generation process, including sending data to the AI and displaying results
    async generateArtwork() {
        // Double-check that we have all requirements
        if (!this.imageBase64 ||
            !this.elements.promptInput.value ||
            !this.artworksInstance.selectedModel) {

            console.warn('ArtworksTab: Attempt to generate without all requirements met');
            this.updateGenerateButtonState(); // Ensure button is disabled
            return;
        }

        try {
            // Store the original system prompt before proceeding
            await this.storeAndUpdateSystemPrompt();

            // Update UI to show generating state
            this.elements.generateBtn.disabled = true;
            this.elements.generateBtn.textContent = Lang.get('artworkGenerating');

            // Show progress indicator
            this.showProgressIndicator();

            // Prepare image data - IMPORTANT FIX: Ensure clean base64 format
            let imageDataToUse;
            if (this.imageBase64.includes('base64,')) {
                imageDataToUse = this.imageBase64.split('base64,')[1];
            } else {
                imageDataToUse = this.imageBase64;
            }
            if (!this.imageBase64) {
                throw new Error('No image data available for processing');
            }

            // Add logging to track the issue:
           //console.log('ArtworksTab: Image data length:', this.imageBase64.length);
           //console.log('ArtworksTab: Active mode:', this.activeMode);

            // Resize the image before sending
            const resizedImageData = await this.resizeImageForAI(
                imageDataToUse,  // Use the cleaned data, not window.cleanedImageBase64
                1024, 1024, 0.8
            );
            window.cleanedImageBase64 = resizedImageData;

            // Log that we're correctly preparing the image
           //console.log('ArtworksTab: Image properly prepared for visual analysis');

            let websiteStyleReference = null;
            if (this.activeMode === 'overlay') {
                await this.ensureOverlayEditorScriptsLoaded();
                const websiteStyleUrlRaw = this.elements.webstyleCloneInput?.value || '';
                this.logWebsiteStyleClone('workflow-mode-check', {
                    activeMode: this.activeMode,
                    hasWebsiteUrl: Boolean(websiteStyleUrlRaw.trim())
                });
                if (websiteStyleUrlRaw.trim()) {
                    const normalizedWebsiteStyleUrl = this.normalizeWebsiteStyleCloneUrl(websiteStyleUrlRaw);
                    try {
                        websiteStyleReference = await this.fetchWebsiteStyleReference(normalizedWebsiteStyleUrl);
                    } catch (error) {
                        console.warn('ArtworksTab: Website style analysis failed, continuing without website hints', error);
                        this.setArtworkProgressMessage(
                            Lang.get('analyzingImageAndGenerating'),
                            `${Lang.get('artworkCloneWebsiteStyleFailed') || 'Website style analysis failed. Continuing without website style hints.'}`
                        );
                        this.logWebsiteStyleClone('workflow-fallback-to-normal-prompt', {
                            normalizedUrl: normalizedWebsiteStyleUrl,
                            error: String(error && (error.message || error) || 'Unknown error')
                        }, 'warn');
                        websiteStyleReference = null;
                    }
                } else {
                    this.logWebsiteStyleClone('workflow-skipped-empty-url');
                }
            }

            // Create system prompts and user prompts based on active mode
            let systemPrompt, userPrompt;

            switch (this.activeMode) {
                                // In the generateArtwork method, concise style-mode system prompt:
                                case 'style':
                                        systemPrompt = `You are a web/visual designer. Return one complete, self-contained HTML document (inline CSS and JS). Follow these concise rules.

                                        IMAGE HANDLING
                                        - If no image is provided: do not include <img>, background-image, or placeholders.
                                        - If an image is provided:
                                            * Do not upscale beyond its native dimensions (aspect-ratio: ${this.imageRatio || 'auto'}).
                                            * Prefer using an <img> for predictable scaling, or a background placeholder token ` +
                                            `'BACKGROUND_IMAGE_PLACEHOLDER'` + ` if requested.
                                            * Use responsive CSS (e.g., max-width:100%; height:auto; or a container with the correct aspect-ratio).
                                            * When using the uploaded image in a hero section, the image area MUST be exactly constrained to the hero section box: hero width must be 100% of its parent, media width must be 100% of the hero, and the media must not overflow outside the hero bounds.
                                            * Never let the hero image or hero background render larger than the hero section width. Do not use fixed pixel widths, min-width values above 100%, transforms that enlarge the media, or viewport-sized wrappers that make the image appear oversized.
                                            * For hero media, prefer this structure: a ".hero" wrapper with "position:relative; width:100%; overflow:hidden;", a ".hero-media" layer with "position:absolute; inset:0; width:100%; height:100%;", and either an "<img>" or background image inside that layer.
                                            * When using CSS backgrounds, set the hero height to 20vh (avoid 100vh). Use "background-attachment:scroll; background-size:cover; background-position:center; background-repeat:no-repeat; overflow:hidden;". Provide a mobile rule to increase to 30vh if needed.
                                            * Only reference images when one is provided.

                                        OUTPUT REQUIREMENTS
                                        - Return only the final HTML document (no explanations).
                                        - Inline all CSS and JS; no external dependencies.
                                        - Include preview metadata exactly: <!-- PREVIEW-SIZE: width=1200 height=900 -->. Use width=1200px; if height is unknown default to 900px.
                                        - Prefer a multi-section webpage (hero + >=2 sections + footer) unless the user requests a single-panel composition.
                                        - Prevent horizontal overflow: set html,body {margin:0;padding:0;width:100%;max-width:100%;overflow-x:hidden;} and avoid 100vw on root wrappers.

                                        ACCESSIBILITY & RESPONSIVE
                                        - Use semantic markup, ARIA where appropriate, and maintain readable contrast. Ensure the page scales correctly on mobile.

                                        PREFERRED HERO EXAMPLE
                                        <section class="hero">
                                            <div class="hero-media">
                                                <img src="BACKGROUND_IMAGE_PLACEHOLDER" alt="Hero" />
                                            </div>
                                            <div class="hero-content">...</div>
                                        </section>
                                        <style>
                                            .hero{position:relative;width:100%;height:20vh;display:flex;align-items:center;justify-content:center;overflow:hidden}
                                            .hero-media{position:absolute;inset:0;width:100%;height:100%;overflow:hidden}
                                            .hero img{display:block;width:100%;height:100%;object-fit:cover;object-position:center}
                                            .hero-content{position:relative;z-index:1}
                                            @media(max-width:600px){.hero{height:30vh}}
                                        </style>
                                        MANDATORY: maximum hero height=30vh and the hero image width must always equal the hero section width exactly.
                                        ${this.elements.useAsBackgroundCheckbox && this.elements.useAsBackgroundCheckbox.checked ?
                                        `IMPORTANT: Use the exact placeholder string BACKGROUND_IMAGE_PLACEHOLDER for background images (do not include base64 data). Example: background-image: url(BACKGROUND_IMAGE_PLACEHOLDER);` : ''}

                                        Format the code with clear indentation and brief comments.`;
                        userPrompt = `${this.imageBase64
                            ? `Create a complete HTML webpage inspired by the uploaded image with this style direction: ${this.elements.promptInput.value}.`
                            : `Create a complete HTML webpage with this style direction: ${this.elements.promptInput.value}.`} ${this.elements.useAsBackgroundCheckbox && this.elements.useAsBackgroundCheckbox.checked && this.imageBase64
                            ? ' Use the uploaded image directly as a background image in appropriate sections of the design. Ensure the hero/background image is clipped to the hero section and its visible width always matches the hero section width exactly.'
                                     : ''
                                     } Build it as a real webpage with multiple sections unless I explicitly asked for a single-panel composition. Use standard responsive webpage behavior with normal vertical scrolling, not a fixed-size poster or one-screen artboard.`;
                    break;

                                 case 'overlay': // Text Overlay mode
                                        systemPrompt = `You are an expert designer specializing in creating text overlays on product images. Your task is to analyze the image and produce a JSON configuration that describes text overlays, SVG shapes/lines/ornaments, and their visual properties for rendering onto the background image.
                                            REQUIREMENT: Never overlap text elements on top of each other. Always ensure strong readability and contrast against the background image.
                                            SUPPORTED TEXT EFFECTS:
                                            The rendering engine supports the following text effects. Use them to create visually compelling designs:
                                            - Font family, size, weight, style: You may use system fonts OR web fonts (including Google Fonts). Use fontWeight "bold" or 700 for headlines, "normal" or 400 for body text. Use fontStyle "italic" for emphasis.
                                            - Text color (solid): Set the "color" property to any hex color (e.g., "#FFFFFF", "#000000", "#FFD700"). Choose colors with strong contrast against the background image.
                                            - Text shadow: Use the "shadow" object with properties: enabled (boolean), color (hex), blur (pixels), offsetX (pixels), offsetY (pixels). Example: {"enabled": true, "color": "#000000", "blur": 10, "offsetX": 3, "offsetY": 3}. Shadows improve readability and add depth.
                                            - Glow effect: Use the "glow" object with properties: enabled (boolean), color (hex or rgba), blur (pixels), offsetX (pixels, usually 0), offsetY (pixels, usually 0). Example: {"enabled": true, "color": "rgba(255,255,255,0.9)", "blur": 18, "offsetX": 0, "offsetY": 0}. Glow is best for a soft halo around short headline text.
                                            - Text stroke (outline): Use the "outline" object with properties: enabled (boolean), color (hex), width (pixels). Example: {"enabled": true, "color": "#000000", "width": 3}. Outline works well for strong headline separation from busy backgrounds.
                                            - Gradient text: Do NOT simulate gradient text by duplicating or stacking the same words in multiple text elements. Use a single solid-color impactful headline instead.
                                            - Pattern/texture text: Not directly supported in JSON. Do not compensate by putting most text in backgroundColor boxes. Prefer a clean solid text treatment instead.
                                            - Rotation/scale transforms: Use the "rotation" property (in degrees) to rotate text. Positive values rotate clockwise. Use maxWidth and fontSize to effectively scale text.
                                            - Opacity/alpha: Use the "opacity" property (0-1) to make text semi-transparent. Values closer to 0 are more transparent, 1 is fully opaque.
                                            - Text clipping: Not directly supported — instead, use maxWidth to constrain text width and ensure text stays within desired bounds.
                                            - Compositing modes: Not directly supported — instead, use opacity, contrast-aware text color, shadow, glow, and outline to achieve desired visual layering effects.
                                            - Background panels: Use "backgroundColor" (hex color, optionally with alpha like "rgba(0,0,0,0.5)") and "backgroundPadding" (e.g., "10px 15px") only as a last resort when readability cannot be solved cleanly with text color, shadow, glow, or outline.
                                            - Panel restraint: Avoid putting background panels behind most text nodes. In a typical poster, use zero background panels or at most one key panel for the single hardest-to-read text block. Do not give every headline/subheadline/footer its own box unless the image is extremely busy everywhere.

                                            OUTPUT FORMAT (MANDATORY):
                                            You MUST respond with a SINGLE valid JSON object wrapped in a markdown code block with language identifier "json". Do NOT include any explanatory text before or after the JSON. Do NOT output HTML, CSS, or any other format. The JSON must be parseable by standard JSON.parse().

                                            JSON SCHEMA:
                                            {
                                              "overlay": {
                                                "width": <number>,           // Background image width in pixels
                                                "height": <number>,          // Background image height in pixels
                                                                                                "webFonts": [                // Optional: web fonts to load before rendering text
                                                                                                    {
                                                                                                        "family": "<string>",  // Font family name used by text elements
                                                                                                        "source": "<string>",  // Optional: "google" | "url"
                                                                                                        "googleFont": "<string>", // Optional Google css2 family value, e.g. "Bebas Neue:wght@400;700"
                                                                                                        "googleFontUrl": "<string>", // Optional full Google Fonts CSS URL
                                                                                                        "url": "<string>",     // Optional direct font file URL (.woff2/.woff/.ttf) or CSS URL
                                                                                                        "weight": "<string|number>", // Optional default weight for this descriptor
                                                                                                        "style": "<string>"    // Optional default style for this descriptor
                                                                                                    }
                                                                                                ],
                                                "texts": [                   // Array of text overlay elements
                                                  {
                                                    "id": "<string>",        // Unique identifier
                                                    "text": "<string>",      // The text content
                                                    "x": <number>,           // X position in pixels (0 = left edge)
                                                    "y": <number>,           // Y position in pixels (0 = top edge)
                                                    "fontSize": <number>,    // Font size in pixels
                                                    "fontFamily": "<string>",// Font family name (e.g., "Helvetica", "Georgia", "Arial")
                                                    "fontWeight": "<string|number>", // "normal", "bold", "100"-"900"
                                                    "fontStyle": "<string>", // "normal" or "italic"
                                                    "fontRef": "<string>", // Optional: references overlay.webFonts[i].family
                                                    "fontUrl": "<string>", // Optional direct per-text webfont URL (woff2/woff/ttf/css)
                                                    "googleFont": "<string>", // Optional per-text Google css2 family value
                                                    "googleFontUrl": "<string>", // Optional per-text Google Fonts CSS URL
                                                    "fontProvider": "<string>", // Optional per-text provider hint, e.g. "google"
                                                    "color": "<string>",     // Text color in hex (e.g., "#FFFFFF")
                                                    "textAlign": "<string>", // "left", "center", or "right"
                                                    "lineHeight": <number>,  // Line height multiplier (e.g., 1.2, 1.5)
                                                    "maxWidth": <number>,    // Maximum width in pixels (0 = no limit)
                                                    "opacity": <number>,     // Opacity 0-1 (default 1)
                                                    "rotation": <number>,    // Rotation in degrees (default 0)
                                                    "letterSpacing": <number>, // Letter spacing in pixels (default 0)
                                                    "backgroundColor": "<string>", // Optional semi-transparent background panel color in hex (e.g., "rgba(0,0,0,0.5)")
                                                    "backgroundPadding": "<string>", // Padding around text on bg panel (e.g., "10px 15px")
                                                    "shadow": {              // Optional text shadow
                                                      "enabled": <boolean>,
                                                      "color": "<string>",   // Shadow color
                                                      "blur": <number>,      // Blur radius in pixels
                                                      "offsetX": <number>,   // Horizontal offset
                                                      "offsetY": <number>    // Vertical offset
                                                                                                        },
                                                                                                        "glow": {                // Optional soft halo effect around text
                                                                                                            "enabled": <boolean>,
                                                                                                            "color": "<string>",   // Glow color, hex or rgba recommended
                                                                                                            "blur": <number>,      // Glow blur radius in pixels
                                                                                                            "offsetX": <number>,   // Usually 0 for even glow
                                                                                                            "offsetY": <number>    // Usually 0 for even glow
                                                                                                        },
                                                                                                        "outline": {             // Optional text outline
                                                                                                            "enabled": <boolean>,
                                                                                                            "color": "<string>",   // Outline color
                                                                                                            "width": <number>      // Outline width in pixels
                                                    }
                                                  }
                                                ],
                                                                                                "ornaments": [           // Unified SVG-style decorations and ornaments
                                                  {
                                                    "id": "<string>",      // Unique identifier
                                                                                                        "type": "<string>",    // "rect", "circle", "ellipse", "line", "polygon", "star", "badge", "path", "custom"
                                                                                                        "x": <number>,         // Base X position for most ornament types
                                                                                                        "y": <number>,         // Base Y position for most ornament types
                                                                                                        "width": <number>,     // Width for rect/ellipse/path/custom/line fallback
                                                                                                        "height": <number>,    // Height for rect/ellipse/path/custom/line fallback
                                                                                                        "size": <number>,      // Size for star/badge ornaments
                                                                                                        "rx": <number>,        // Corner radius for rect or x-radius for ellipse
                                                                                                        "ry": <number>,        // Y-radius for ellipse
                                                                                                        "cx": <number>,        // Optional center X for circle/ellipse
                                                                                                        "cy": <number>,        // Optional center Y for circle/ellipse
                                                                                                        "x1": <number>,        // Start X for line ornaments
                                                                                                        "y1": <number>,        // Start Y for line ornaments
                                                                                                        "x2": <number>,        // End X for line ornaments
                                                                                                        "y2": <number>,        // End Y for line ornaments
                                                                                                        "points": "<string>",  // Polygon points string (e.g., "10,10 20,30 30,10")
                                                                                                        "pathData": "<string>", // SVG path data for type "path" or "custom"
                                                                                                        "color": "<string>",   // Fill color or primary line color
                                                                                                        "secondaryColor": "<string>", // Accent color for badge/star motifs
                                                                                                        "strokeColor": "<string>", // Optional stroke/outline color
                                                                                                        "strokeWidth": <number>, // Stroke width in pixels
                                                                                                        "dashArray": "<string>", // Dash pattern for line ornaments (e.g., "5,5")
                                                                                                        "opacity": <number>,   // Opacity 0-1
                                                                                                        "rotation": <number>   // Rotation in degrees
                                                  }
                                                ]
                                              }
                                            }

                                                                                        VALID EXAMPLE (structure only, adapt positions/colors/content to the uploaded image):
                                                                                        \`\`\`json
                                                                                        {
                                                                                            "overlay": {
                                                                                                "width": 1200,
                                                                                                "height": 1600,
                                                                                                "webFonts": [],
                                                                                                "texts": [
                                                                                                    {
                                                                                                        "id": "headline",
                                                                                                        "text": "Brew Bold",
                                                                                                        "x": 600,
                                                                                                        "y": 420,
                                                                                                        "fontSize": 118,
                                                                                                        "fontFamily": "Arial",
                                                                                                        "fontWeight": 700,
                                                                                                        "fontStyle": "normal",
                                                                                                        "color": "#FFF7ED",
                                                                                                        "textAlign": "center",
                                                                                                        "lineHeight": 1.05,
                                                                                                        "maxWidth": 760,
                                                                                                        "opacity": 1,
                                                                                                        "rotation": 0,
                                                                                                        "letterSpacing": 1.5,
                                                                                                        "backgroundColor": "#0F172ACC",
                                                                                                        "backgroundPadding": "18px 26px",
                                                                                                        "shadow": {
                                                                                                            "enabled": true,
                                                                                                            "color": "#000000",
                                                                                                            "blur": 18,
                                                                                                            "offsetX": 0,
                                                                                                            "offsetY": 8
                                                                                                        },
                                                                                                        "glow": {
                                                                                                            "enabled": false,
                                                                                                            "color": "#FFFFFF",
                                                                                                            "blur": 0,
                                                                                                            "offsetX": 0,
                                                                                                            "offsetY": 0
                                                                                                        },
                                                                                                        "outline": {
                                                                                                            "enabled": false,
                                                                                                            "color": "#000000",
                                                                                                            "width": 0
                                                                                                        }
                                                                                                    },
                                                                                                    {
                                                                                                        "id": "subhead",
                                                                                                        "text": "Small batch flavor for every morning.",
                                                                                                        "x": 600,
                                                                                                        "y": 575,
                                                                                                        "fontSize": 42,
                                                                                                        "fontFamily": "Arial",
                                                                                                        "fontWeight": 400,
                                                                                                        "fontStyle": "normal",
                                                                                                        "color": "#F8FAFC",
                                                                                                        "textAlign": "center",
                                                                                                        "lineHeight": 1.3,
                                                                                                        "maxWidth": 700,
                                                                                                        "opacity": 1,
                                                                                                        "rotation": 0,
                                                                                                        "letterSpacing": 0,
                                                                                                        "backgroundColor": "#00000066",
                                                                                                        "backgroundPadding": "10px 16px",
                                                                                                        "shadow": {
                                                                                                            "enabled": false,
                                                                                                            "color": "#000000",
                                                                                                            "blur": 0,
                                                                                                            "offsetX": 0,
                                                                                                            "offsetY": 0
                                                                                                        },
                                                                                                        "glow": {
                                                                                                            "enabled": false,
                                                                                                            "color": "#FFFFFF",
                                                                                                            "blur": 0,
                                                                                                            "offsetX": 0,
                                                                                                            "offsetY": 0
                                                                                                        },
                                                                                                        "outline": {
                                                                                                            "enabled": false,
                                                                                                            "color": "#000000",
                                                                                                            "width": 0
                                                                                                        }
                                                                                                    }
                                                                                                ],
                                                                                                "ornaments": [
                                                                                                    {
                                                                                                        "id": "divider-1",
                                                                                                        "type": "line",
                                                                                                        "x1": 290,
                                                                                                        "y1": 660,
                                                                                                        "x2": 910,
                                                                                                        "y2": 660,
                                                                                                        "color": "#FDBA74",
                                                                                                        "strokeWidth": 4,
                                                                                                        "opacity": 0.9,
                                                                                                        "rotation": 0
                                                                                                    }
                                                                                                ]
                                                                                            }
                                                                                        }
                                                                                        \`\`\`

                                            POSITIONING GUIDELINES:
                                            - All coordinates are in PIXELS relative to the background image dimensions (0,0 = top-left corner).
                                            - Use the image width/height from the image information provided in the user prompt to calculate positions.
                                            - Position text in visually balanced locations that complement the image content.
                                            - Avoid covering key product features or important image areas.
                                            - Use percentages converted to pixels: x = (percentage / 100) * width, y = (percentage / 100) * height.
                                            - For example, center text: x = width * 0.5, y = height * 0.3 (adjust based on visual balance).

                                            TYPOGRAPHY GUIDELINES:
                                            - PRIORITIZE TEXT READABILITY with high contrast ratios (minimum 4.5:1 for normal text).
                                            - Choose text colors that maintain strong contrast against the background image.
                                            - White text on dark image areas and dark text on light image areas is often most effective.
                                            - Use font sizes proportional to the image dimensions. For a 1920px wide image, minimum font size should be 24px.
                                            - You may use system fonts or web fonts. For web fonts, include valid entries in overlay.webFonts (or per-text fontUrl/googleFont/googleFontUrl fields).
                                            - When a website style reference is provided, carry its linked website fonts into overlay.webFonts and use matching fontRef or fontFamily values for the relevant text elements.
                                            - When a website style reference is provided and there are multiple text blocks, prefer one website font family per text block so the design uses as many different linked website fonts as possible without harming readability.
                                            - When website webfont descriptors are provided, prefer those exact linked font URLs over substitutes.
                                            - Use fontWeight "bold" or 700 for headlines, "normal" or 400 for body text.
                                                - Prefer readability fixes in this order: text color, shadow, glow, outline, then backgroundColor panel only if those still do not produce clear contrast.
                                                - Keep backgroundColor panels rare and intentional. In most outputs, no more than one text element should need a panel.
                                            - You may use subtle glow, shadow, or outline on key headline text when it improves readability against the image.
                                            - Do not stack too many effects on the same text block. Prefer at most one of shadow or glow, and use outline only when the background is visually busy.
                                            - Never create fake gradient headlines by repeating the same text in darker or lighter stacked layers.
                                            - Each semantic text block should appear only once in overlay.texts unless the user explicitly asks for duplicated decorative typography.

                                            COLOR GUIDELINES:
                                            - When a website style reference is provided, reuse its extracted CSS colors in the overlay JSON when they fit the design.
                                            - Prefer website CSS colors for text, ornaments, and background panels before inventing a different palette.
                                            - Keep all chosen colors readable against the uploaded image and use only hex color strings in the JSON.

                                            SVG ORNAMENT GUIDELINES:
                                            - Always include 1 to 5 cinematic SVG-style ornaments in overlay.ornaments that match the image theme and enhance the typography.
                                            - Use overlay.ornaments as the ONLY vector decoration field. Do NOT output top-level shapes or lines arrays.
                                            - Build ornaments as tasteful dividers, frames, rays, underlines, badges, flourishes, geometric motifs, or custom SVG path accents that fit the image theme.
                                            - Use path ornament types as needed.
                                            - Small example: {"id":"orn-1","type":"line","x1":180,"y1":860,"x2":980,"y2":860,"color":"#D4AF37","strokeWidth":3,"opacity":0.9}
                                            - For type "path" or "custom", provide valid SVG pathData plus x, y, width, and height so the ornament can be rendered and edited correctly.
                                            - Decorative SVG graphics should feel intentional and visually rich, not generic clipart.
                                            - Do NOT place ornaments on top of text or through text. Keep clear spacing so decorative elements never overlap the readable text area.
                                            - All ornaments must have valid pixel coordinates within the image bounds.

                                            IMPORTANT RULES:
                                            - The "width" and "height" fields in the overlay object MUST match the actual uploaded image dimensions.
                                            - All numeric values must be actual numbers, not strings.
                                            - All color values must be hex strings (e.g., "#FFFFFF", "#000000", "#FF0000").
                                            - Always include theme-matching vector ornaments in overlay.ornaments unless the user explicitly asks for text-only output.
                                            - If website font descriptors are provided in the user prompt, use those exact linked URLs first and preserve their family names in overlay.webFonts.
                                            - If website CSS colors are provided in the user prompt, reuse them in the JSON wherever they fit the composition before inventing new colors.
                                            - Only use Google Fonts when the reference site uses Google Fonts or when no usable website font URL is available.
                                            - If you use direct font files, use publicly reachable URLs that allow loading from browsers.
                                            - The JSON must be valid and parseable. No trailing commas, no comments, no single quotes.
                                            - Do NOT include any text outside the JSON code block.
                                            - Do NOT wrap the JSON in any markdown other than the standard \`\`\`json ... \`\`\` fence.
                                            `;
                                        userPrompt = `Create text overlays for this product image with the following text:
                                        ${this.elements.promptInput.value}
                    
                                        Image information:
                                        - Orientation: ${this.imageOrientation || 'Unknown'}
                                        - Dimensions: ${this.imageDimensions || 'Unknown'}
                                        - Aspect ratio: ${this.imageRatio || 'Unknown'}
                    
                                        Respond with a SINGLE valid JSON object (wrapped in a \`\`\`json code block) that describes the text overlays and ornaments to render on this background image. Use the exact image dimensions provided above to calculate all pixel positions. Position text in visually balanced locations that complement the image content and avoid covering key product features. Choose text colors with strong contrast against the background. Include ornaments only if they enhance the design meaningfully, and keep ornaments clear of the text so they do not overlap or cross through readable text.

                                        Do NOT fake gradient text by repeating the same header or sentence in multiple stacked text elements with darker or lighter colors. The main poster sentence should appear once as a single text block unless I explicitly ask for duplicated typography.
                    
                                        If website font descriptors are provided, use them directly in overlay.webFonts instead of substituting other providers. When the design has multiple text blocks, try to assign a different website-linked font to each block so the poster uses several of the provided website fonts. Reuse website CSS colors from the style reference in the overlay JSON when they fit the design. Only add a fallback provider when no usable website font source is available or the user explicitly asks for one.`;
                                    {
                                     const websiteStylePromptSuffix = this.buildWebsiteStylePromptSuffix(websiteStyleReference);
                                        if (websiteStylePromptSuffix) {
                                            userPrompt += `\n\n${websiteStylePromptSuffix}`;
                                            this.logWebsiteStyleClone('prompt-augmented', {
                                                finalPromptLength: userPrompt.length,
                                            sourceUrl: websiteStyleReference?.url || ''
                                            });
                                        } else {
                                            this.logWebsiteStyleClone('prompt-not-augmented', {
                                                finalPromptLength: userPrompt.length,
                                                sourceUrl: websiteStyleReference?.url || ''
                                            });
                                        }
                                    }
                    
                    break;

            }


            // This ensures the image is sent properly
            const modelName = this.artworksInstance.selectedModel;
            const contextSize = document.getElementById('context-selector')?.value || '8192';

            // Reset any previous context to ensure clean slate for image analysis
            if (window.OllamaAPI) {
                window.OllamaAPI.resetContext();
            }

            // Create an abort controller for timeout and user cancellation
            window.artworkAbortController = new AbortController();
            //const timeout = setTimeout(() => window.artworkAbortController.abort('Timeout'), 120000); // 2 minute timeout

            try {
                // Call OllamaAPI directly with proper system prompt and user prompt separation
                const response = await window.OllamaAPI.sendToOllamaWithImage(
                    userPrompt,               // User prompt
                    systemPrompt,             // System prompt  
                    contextSize,              // Context size
                    window.cleanedImageBase64,   // Image
                    null,                     // Previous context
                    window.artworkAbortController.signal,   // Abort signal
                    null,                     // Request ID
                    null,                     // Multi images
                    this.artworksInstance.selectedModel  // Model override
                );

                if (!response) {
                    const pendingCloudAccessError = window.OllamaAPI
                        && typeof window.OllamaAPI.consumePendingCloudAccessError === 'function'
                        ? window.OllamaAPI.consumePendingCloudAccessError()
                        : null;

                    if (pendingCloudAccessError && pendingCloudAccessError.body) {
                        throw new Error(pendingCloudAccessError.body);
                    }

                    throw new Error('No response received from Ollama');
                }

                // Process the response stream
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullResponse = '';
                let streamBuffer = '';

                const processStreamLine = (rawLine) => {
                    const trimmedLine = String(rawLine || '').trim();
                    if (!trimmedLine || trimmedLine === '[DONE]' || trimmedLine === 'data: [DONE]') {
                        return;
                    }

                    const normalizedLine = trimmedLine.startsWith('data:')
                        ? trimmedLine.slice(5).trim()
                        : trimmedLine;
                    if (!normalizedLine || normalizedLine === '[DONE]') {
                        return;
                    }

                    const data = JSON.parse(normalizedLine);
                    if (typeof data.response === 'string') {
                        fullResponse += data.response;
                    } else if (data.message && typeof data.message.content === 'string') {
                        fullResponse += data.message.content;
                    }
                };

                while (true) {
                    const { value, done } = await reader.read();
                    streamBuffer += decoder.decode(value || new Uint8Array(), { stream: !done });
                    const lines = streamBuffer.split('\n');
                    streamBuffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.trim()) {
                            try {
                                processStreamLine(line);
                            } catch (error) {
                                console.error('Error processing chunk:', error);
                            }
                        }
                    }

                    if (done) {
                        const tail = streamBuffer.trim();
                        if (tail) {
                            try {
                                processStreamLine(tail);
                            } catch (_tailErr) {
                                // Ignore trailing partial fragments on stream end.
                            }
                        }
                        break;
                    }
                }

                this.hideProgressIndicator();

                // Show result
                if (fullResponse) {
                    // IMPORTANT: Strip thinking tags from response before processing
                    fullResponse = this.stripThinkingTags(fullResponse);
                    /* console.log('ArtworksTab[overlay-chain]: Received AI response', {
                        mode: this.activeMode,
                        responseLength: fullResponse.length,
                        hasJsonFence: /```json/i.test(fullResponse),
                        hasOverlayKey: /"overlay"\s*:/.test(fullResponse)
                    }); */
                    // Debug log: Step 1 - AI response cleaned
                    
                    // Parse overlay JSON data if in overlay mode
                    let overlayData = null;
                    if (this.activeMode === 'overlay') {
                       overlayData = this.parseOverlayJsonFromResponse(fullResponse);
                        if (overlayData?.overlay) {
                            const overlay = overlayData.overlay;
                        } else {
                            console.error('ArtworksTab: Failed to parse overlay JSON in overlay mode');
                            throw new Error('Overlay mode requires valid JSON with an overlay object.');
                        }
                    }
                    
                    // Store the full response in case we need it later, but don't display in tab
                    this._generatedResponse = fullResponse;
                    
                    let imageUrl = null;
                    if (this.imageBase64) {
                        try {
                            const byteCharacters = atob(this.imageBase64.split(',')[1] || this.imageBase64);
                            const byteArrays = [];

                            for (let i = 0; i < byteCharacters.length; i += 512) {
                                const slice = byteCharacters.slice(i, i + 512);
                                const byteNumbers = new Array(slice.length);
                                for (let j = 0; j < slice.length; j++) {
                                    byteNumbers[j] = slice.charCodeAt(j);
                                }
                                const byteArray = new Uint8Array(byteNumbers);
                                byteArrays.push(byteArray);
                            }

                            const blob = new Blob(byteArrays, { type: 'image/jpeg' });
                            imageUrl = URL.createObjectURL(blob);

                            window.backgroundImageUrl = imageUrl;
                            window.backgroundImage = this.imageBase64;
                        } catch (error) {
                            console.error('ArtworksTab: Failed to create blob URL, falling back to base64', error);
                            imageUrl = this.imageBase64;
                            window.backgroundImageUrl = this.imageBase64;
                            window.backgroundImage = this.imageBase64;
                        }
                    }

                    if ((this.activeMode === 'overlay') ||
                        (this.elements.useAsBackgroundCheckbox && this.elements.useAsBackgroundCheckbox.checked)) {
                        const injectedImageUrl = imageUrl || this.imageBase64;
                        if (injectedImageUrl) {
                            fullResponse = this.replaceBackgroundPlaceholders(fullResponse, injectedImageUrl);
                        }
                    }

                    // Debug log: Step 2 - after initial background placeholder replacement
                    // Check if ArtworkPreviewWindow is available
                    if (typeof ArtworkPreviewWindow !== 'undefined') {
                        // IMPORTANT: Store the actual image in a variable for the preview window
                        let imageUrl;
                        if (this.imageBase64) {
                            try {
                                // Create a blob from the base64 data
                                const byteCharacters = atob(this.imageBase64.split(',')[1] || this.imageBase64);
                                const byteArrays = [];

                                for (let i = 0; i < byteCharacters.length; i += 512) {
                                    const slice = byteCharacters.slice(i, i + 512);
                                    const byteNumbers = new Array(slice.length);
                                    for (let j = 0; j < slice.length; j++) {
                                        byteNumbers[j] = slice.charCodeAt(j);
                                    }
                                    const byteArray = new Uint8Array(byteNumbers);
                                    byteArrays.push(byteArray);
                                }

                                const blob = new Blob(byteArrays, { type: 'image/jpeg' });
                                imageUrl = URL.createObjectURL(blob);

                                // Store both the blob URL and original data
                                window.backgroundImageUrl = imageUrl;
                                window.backgroundImage = this.imageBase64; // Keep for compatibility

                               //console.log('ArtworksTab: Created blob URL for image to improve performance');
                            } catch (error) {
                                console.error('ArtworksTab: Failed to create blob URL, falling back to base64', error);
                                imageUrl = this.imageBase64;
                                window.backgroundImageUrl = this.imageBase64;
                                window.backgroundImage = this.imageBase64;
                            }
                        }

                        // Keep overlay HTML lightweight in the editor and resolve the image only at preview/export time.
                        if (this.activeMode !== 'overlay' &&
                            this.elements.useAsBackgroundCheckbox && this.elements.useAsBackgroundCheckbox.checked) {
                            const injectedImageUrl = imageUrl;

                            fullResponse = fullResponse.replace(
                                /url\(['"]?BACKGROUND_IMAGE_PLACEHOLDER['"]?\)/gi,
                                `url('${injectedImageUrl}')`
                            );

                            fullResponse = fullResponse.replace(
                                /url\(['"]?window\.backgroundImage['"]?\)/gi,
                                `url('${injectedImageUrl}')`
                            );

                            fullResponse = fullResponse.replace(
                                /url\(window\.backgroundImage\)/gi,
                                `url('${injectedImageUrl}')`
                            );

                            fullResponse = fullResponse.replace(
                                /url\(\s*window\s*\[\s*['"]backgroundImage['"]\s*\]\s*\)/gi,
                                `url('${injectedImageUrl}')`
                            );

                            fullResponse = fullResponse.replace(
                                /<img\s+[^>]*src\s*=\s*["']BACKGROUND_IMAGE_PLACEHOLDER["'][^>]*>/gi,
                                (match) => match.replace(/src\s*=\s*["']BACKGROUND_IMAGE_PLACEHOLDER["']/gi, `src="${injectedImageUrl}"`)
                            );

                            fullResponse = fullResponse.replace(
                                /<img\s+[^>]*src\s*=\s*BACKGROUND_IMAGE_PLACEHOLDER[^>]*>/gi,
                                (match) => match.replace(/src\s*=\s*BACKGROUND_IMAGE_PLACEHOLDER/gi, `src="${injectedImageUrl}"`)
                            );
                        }

                        // Debug log: Step 3 - about to create ArtworkPreviewWindow

                        // Create the preview with the improved image handling
                        const previewWindow = new ArtworkPreviewWindow(
                            fullResponse,
                            `Generated ${this.activeMode === 'style' ? 'Style' : (this.activeMode === 'overlay' ? 'Text Overlay' : 'Generated')}`,
                            // Always pass the blob URL for overlay mode, otherwise respect checkbox
                            (this.activeMode === 'overlay') ||
                                (this.elements.useAsBackgroundCheckbox && this.elements.useAsBackgroundCheckbox.checked) ?
                                (this.activeMode === 'overlay' ? (imageUrl || this.imageBase64) : imageUrl) : null,
                            {
                                previewMode: this.activeMode,
                                sourceImageWidth: this.activeMode === 'overlay' && this.imageWidth ? this.imageWidth : 0,
                                sourceImageHeight: this.activeMode === 'overlay' && this.imageHeight ? this.imageHeight : 0,
                                exportBackgroundImage: this.activeMode === 'overlay' && this.imageBase64 ? this.imageBase64 : (imageUrl || null),
                                overlayData: overlayData,
                            }
                        );

                        this.concealPreviewWindowForExternalWorkflow(previewWindow);

                        // Debug log: Step 4 - preview window created

                        // Set up cleanup function for when preview window is closed
                        if (previewWindow && typeof previewWindow.addOnCloseCallback === 'function') {
                            previewWindow.addOnCloseCallback(() => {
                                // Clean up blob URL when preview window is closed
                                if (imageUrl && imageUrl.startsWith('blob:')) {
                                    URL.revokeObjectURL(imageUrl);
                                   //console.log('ArtworksTab: Revoked blob URL to prevent memory leaks');
                                }
                            });
                        }

						try {
							window.__lastArtworkPreviewWindow = previewWindow;
							window.dispatchEvent(new CustomEvent('artwork:preview-ready', {
								detail: {
									previewWindow,
									mode: this.activeMode
								}
							}));
						} catch (previewEventError) {
							console.warn('ArtworksTab: failed to publish preview-ready event', previewEventError);
						}
                    } else {
                        console.error('ArtworkPreviewWindow not available, skipping in-tab fallback rendering');
                    }
                } else {
                    throw new Error('Empty response from AI');
                }
            } catch (error) {
                // If aborted, show appropriate message in the progress window
                if (error.name === 'AbortError' || window.artworkAbortController.signal.aborted) {
                   //console.log('ArtworksTab: Generation was canceled');

                    // Update the floating progress window to show cancellation
                    const progressWindow = document.querySelector('.artwork-progress-window');
                    if (progressWindow) {
                        const spinner = progressWindow.querySelector('.artwork-spinner');
                        const message = progressWindow.querySelector('.artwork-progress-message');
                        const timing = progressWindow.querySelector('.artwork-timing');

                        // Change header to indicate cancellation
                        const header = progressWindow.querySelector('.artwork-progress-header h3');
                        if (header) header.textContent = Lang.get('artworkGenerationCanceled');

                        // Replace spinner with an X icon
                        if (spinner) {
                            spinner.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10" stroke="#e53e3e" fill="none"></circle>
                        <line x1="15" y1="9" x2="9" y2="15" stroke="#e53e3e"></line>
                        <line x1="9" y1="9" x2="15" y2="15" stroke="#e53e3e"></line>
                    </svg>
                `;
                            spinner.style.border = 'none';
                            spinner.style.animation = 'none';
                        }

                        // Update message
                        if (message) message.textContent = Lang.get('artworkGenerationWasCanceled');

                        // Update timing message
                        if (timing) timing.textContent = Lang.get('artworkTryAgainDifferentPrompt');

                        // Make sure the close button is working
                        const closeBtn = progressWindow.querySelector('.artwork-progress-close');
                        if (closeBtn) {
                            // Remove old handlers and add fresh one
                            const newCloseBtn = closeBtn.cloneNode(true);
                            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

                            // Add event listener to close the window when clicked
                            newCloseBtn.addEventListener('click', () => {
                                this.hideProgressIndicator();
                            });
                        }

                        return; // Exit early
                    }

                    // Fallback if progress window not found
                    console.warn('ArtworksTab: Generation canceled with no progress window available');
                } else {
                    // Similarly, modify the error handling for non-abort errors
                    // This would be in the outer catch block
                    const progressWindow = document.querySelector('.artwork-progress-window');
                    if (progressWindow) {
                        const spinner = progressWindow.querySelector('.artwork-spinner');
                        const message = progressWindow.querySelector('.artwork-progress-message');
                        const timing = progressWindow.querySelector('.artwork-timing');

                        // Change header to indicate error
                        const header = progressWindow.querySelector('.artwork-progress-header h3');
                        if (header) header.textContent = Lang.get('artworkGenerationFailed');

                        // Replace spinner with an error icon
                        if (spinner) {
                            spinner.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10" stroke="#e53e3e" fill="none"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                `;
                            spinner.style.border = 'none';
                            spinner.style.animation = 'none';
                        }

                        // Update message with error details
                        if (message) {
                            if (error.message && error.message.includes('Response will be generated by OllamaAPI directly')) {
                                message.textContent = Lang.get('artworkImageAnalysisFailed');
                            } else if (this.isRateLimitError(error)) {
                                message.textContent = this.getRateLimitMessage();
                            } else {
                                message.textContent = `${Lang.get('error')}: ${error.message}`;
                            }
                        }

                        // Update timing message
                        if (timing) timing.textContent = Lang.get('artworkTryAgainDifferentPromptOrModel');

                        // Make sure the close button is working
                        const closeBtn = progressWindow.querySelector('.artwork-progress-close');
                        if (closeBtn) {
                            // Remove old handlers and add fresh one
                            const newCloseBtn = closeBtn.cloneNode(true);
                            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

                            // Add event listener to close the window when clicked
                            newCloseBtn.addEventListener('click', () => {
                                this.hideProgressIndicator();
                            });
                        }
                    }


                    throw error; // Re-throw for the outer catch block if needed
                }
            } finally {
                //clearTimeout(timeout);
                // Clear the abort controller reference
                window.artworkAbortController = null;
            }

            // Restore the system prompt
            await this.restoreSystemPrompt();
        } catch (error) {
                console.error('ArtworksTab: Error generating artwork:', error);
                this.hideProgressIndicator();

                // Errors are shown in blocking warnings / progress UI, not in an in-tab output panel.
                if (error.message && error.message.includes('Response will be generated by OllamaAPI directly')) {
                    console.warn('ArtworksTab: Received placeholder response from compatibility wrapper, ignoring');
                }

                // Prompt for an Ollama API key only when the error explicitly requires one.
                if ((this.activeMode === 'style' || this.activeMode === 'overlay')
                    && this.isOllamaApiKeyError(error)
                    && window.chatTab
                    && typeof window.chatTab.openOllamaApiKeyManager === 'function') {
                    setTimeout(() => {
                        window.chatTab.openOllamaApiKeyManager(true).catch((modalError) => {
                            console.error('ArtworksTab: Failed to open Ollama API key manager', modalError);
                        });
                    }, 50);
                }

                // Restore system prompt in case of exception
                await this.restoreSystemPrompt();
        } finally {
            // Reset UI
            if (this.elements && this.elements.generateBtn) {
                try {
                    this.elements.generateBtn.disabled = false;
                    this.elements.generateBtn.textContent = Lang.get('artworkGenerateDesign');
                } catch (_e) {
                    // ignore
                }
            }

            // Make sure button state is updated
            try { this.updateGenerateButtonState(); } catch (_e) {}
        }
    }
    // Removes thinking and reasoning tags from the AI response text
    stripThinkingTags(text) {
        if (!text || typeof text !== 'string') return text;

       //console.log('ArtworksTab: Stripping thinking tags from response');

        // Remove thinking tags and their content
        let cleanedText = text
            // Remove  grandchildren blocks
            .replace(/ grandchildren blocks/gi, '')
            // Remove <thinking>...</thinking> blocks
            .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
            // Remove <reflection>...</reflection> blocks
            .replace(/<reflection>[\s\S]*?<\/reflection>/gi, '')
            // Remove <reasoning>...</reasoning> blocks
            .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
            // Remove <cot>...</cot> blocks (chain of thought)
            .replace(/<cot>[\s\S]*?<\/cot>/gi, '')
            // Remove any other common thinking-related tags
            .replace(/<analysis>[\s\S]*?<\/analysis>/gi, '')
            .replace(/<internal>[\s\S]*?<\/internal>/gi, '')
            // Clean up any extra whitespace or newlines left behind
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim();

       //console.log('ArtworksTab: Thinking tags removed from response');
        return cleanedText;
    }

    // Replaces BACKGROUND_IMAGE_PLACEHOLDER references in generated HTML with a real image URL
    replaceBackgroundPlaceholders(html, imageUrl) {
        if (!html || typeof html !== 'string' || !imageUrl) return html;

        const urlPattern = /url\(\s*(['"]?)BACKGROUND_IMAGE_PLACEHOLDER\1\s*\)/gi;
        html = html.replace(urlPattern, `url('${imageUrl}')`);

        const imgSrcPattern = /(<img\b[^>]*\bsrc\s*=\s*)(['"]?)BACKGROUND_IMAGE_PLACEHOLDER\2([^>]*>)/gi;
        html = html.replace(imgSrcPattern, (_, prefix, quote, suffix) => {
            return `${prefix}'${imageUrl}'${suffix}`;
        });

        const imgSrcNoQuotePattern = /(<img\b[^>]*\bsrc\s*=\s*)BACKGROUND_IMAGE_PLACEHOLDER([^>]*>)/gi;
        html = html.replace(imgSrcNoQuotePattern, (_, prefix, suffix) => {
            return `${prefix}'${imageUrl}'${suffix}`;
        });

        return html;
    }

    // Extracts and parses JSON overlay data from AI response
    // Looks for ```json ... ``` code blocks or standalone JSON objects
    parseOverlayJsonFromResponse(response) {
        if (!response || typeof response !== 'string') return null;

        let text = response.trim();

        const buildResponseSnippet = source => String(source || '')
            .replace(/\s+/g, ' ')
            .slice(0, 1200);

        const parseOverlayCandidate = candidate => {
            if (!candidate || typeof candidate !== 'string') {
                return null;
            }

            try {
                const parsed = JSON.parse(candidate.trim());
                return parsed && parsed.overlay ? parsed : null;
            } catch (_error) {
                return null;
            }
        };

        const extractBalancedOverlayObject = source => {
            const overlayKeyIndex = String(source || '').search(/"overlay"\s*:/);
            if (overlayKeyIndex < 0) {
                return null;
            }

            let objectStart = -1;
            for (let index = overlayKeyIndex; index >= 0; index -= 1) {
                const char = source[index];
                if (char === '{') {
                    objectStart = index;
                    break;
                }
            }

            if (objectStart < 0) {
                return null;
            }

            let depth = 0;
            let inString = false;
            let escaping = false;

            for (let index = objectStart; index < source.length; index += 1) {
                const char = source[index];

                if (escaping) {
                    escaping = false;
                    continue;
                }

                if (char === '\\') {
                    escaping = true;
                    continue;
                }

                if (char === '"') {
                    inString = !inString;
                    continue;
                }

                if (inString) {
                    continue;
                }

                if (char === '{') {
                    depth += 1;
                    continue;
                }

                if (char === '}') {
                    depth -= 1;
                    if (depth === 0) {
                        return source.slice(objectStart, index + 1);
                    }
                }
            }

            return null;
        };


        // Try to extract JSON from markdown code block first
        const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonBlockMatch) {
            const jsonStr = jsonBlockMatch[1].trim();
            const parsedFencedJson = parseOverlayCandidate(jsonStr);
            if (parsedFencedJson) {
                return parsedFencedJson;
            }

            const extractedFencedOverlay = extractBalancedOverlayObject(jsonStr);
            const parsedExtractedFencedOverlay = parseOverlayCandidate(extractedFencedOverlay);
            if (parsedExtractedFencedOverlay) {
                return parsedExtractedFencedOverlay;
            }

            console.warn('ArtworksTab[overlay-chain]: Fenced JSON parse failed');
            // Fall through to try parsing the full response
        }

        // Try parsing the entire response as JSON
        const parsedFullResponse = parseOverlayCandidate(text);
        if (parsedFullResponse) {
            return parsedFullResponse;
        }

        console.warn('ArtworksTab[overlay-chain]: Full response JSON parse failed');

        // Try to find a JSON object in the response using regex
        const jsonMatch = text.match(/\{[\s\S]*"overlay"\s*:[\s\S]*\}/);
        if (jsonMatch) {
            const parsedRegexJson = parseOverlayCandidate(jsonMatch[0]);
            if (parsedRegexJson) {
                return parsedRegexJson;
            }

            console.warn('ArtworksTab[overlay-chain]: Regex-extracted JSON parse failed');
        }

        const balancedOverlayObject = extractBalancedOverlayObject(text);
        const parsedBalancedOverlayObject = parseOverlayCandidate(balancedOverlayObject);
        if (parsedBalancedOverlayObject) {
            return parsedBalancedOverlayObject;
        }

        console.warn('ArtworksTab[overlay-chain]: Failed to parse overlay JSON from response', {
            responseLength: text.length,
            hasJsonFence: /```json/i.test(text),
            hasOverlayKey: /"overlay"\s*:/.test(text),
            balancedOverlayLength: balancedOverlayObject ? balancedOverlayObject.length : 0,
            responseSnippet: buildResponseSnippet(text)
        });

        return null;
    }

    // Resizes the uploaded image to fit within specified dimensions and returns base64 data
    resizeImageForAI(base64Data, maxWidth = 1024, maxHeight = 1024, quality = 0.8) {
        return new Promise((resolve, reject) => {
            if (!base64Data) {
                reject(new Error('No image data provided for resizing'));
                return;
            }

            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Calculate new dimensions maintaining aspect ratio
                    let { width, height } = img;

                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width *= ratio;
                        height *= ratio;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Draw and compress
                    ctx.drawImage(img, 0, 0, width, height);
                    const resizedBase64 = canvas.toDataURL('image/jpeg', quality);

                    // Return just the base64 part
                    resolve(resizedBase64.split(',')[1]);
                } catch (error) {
                    reject(new Error(`Image resizing failed: ${error.message}`));
                }
            };

            img.onerror = () => {
                reject(new Error('Failed to load image for resizing'));
            };

            img.src = `data:image/jpeg;base64,${base64Data}`;
        });
    }
    
    // Helper method to unload all models from Ollama to ensure clean memory (localized to ArtworksTab)
    async unloadOllamaModels() {
        try {
            const modelName = this?.artworksInstance?.selectedModel || document.getElementById('artwork-model-selector')?.value || '';
            const selectedProvider = (window.OllamaAPI && typeof window.OllamaAPI.getModelSource === 'function')
                ? (window.OllamaAPI.getModelSource(modelName) || 'local')
                : 'local';

            // Unload uses local daemon endpoints and should not run for cloud-only model selections.
            if (selectedProvider === 'cloud') {
                return;
            }

           //console.log('ArtworksTab: Getting list of loaded Ollama models...');

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
           //console.log('ArtworksTab: Ollama /api/ps response:', psData);

            // Extract loaded models from the response
            let loadedModels = [];
            if (psData && psData.models && Array.isArray(psData.models)) {
                loadedModels = psData.models.map(model => model.name || model.model).filter(Boolean);
            }

           //console.log('ArtworksTab: Found loaded models:', loadedModels);

            if (loadedModels.length === 0) {
               //console.log('ArtworksTab: No models currently loaded. Skipping unload.');
                return;
            }

            // Unload each model individually
            const unloadPromises = loadedModels.map(async (modelName) => {
                try {
                   //console.log('ArtworksTab: Unloading model:', modelName);

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

                    if (!unloadResponse.ok) {
                        if (unloadResponse.status === 429) {
                            console.warn(`ArtworksTab: Unload rate-limited (429) for ${modelName}.`, (window.Lang && typeof Lang.get === 'function' && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached (429).');
                            return;
                        }
                        console.warn(`ArtworksTab: Warning - failed to unload ${modelName}: ${unloadResponse.status} ${unloadResponse.statusText}`);
                    } else {
                       //console.log(`ArtworksTab: Successfully triggered unload for model: ${modelName}`);
                    }

                } catch (modelError) {
                    console.error(`ArtworksTab: Error unloading model ${modelName}:`, modelError);
                }
            });

            // Wait for all unload operations to complete
            await Promise.all(unloadPromises);

           //console.log('ArtworksTab: All model unload operations completed');

            // Wait a brief moment for the unloads to complete
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error('ArtworksTab: Error in unloadOllamaModels:', error);
            if (error && error.message && error.message.includes('Failed to fetch')) {
                throw new Error('Could not connect to Ollama to unload models.');
            }
            throw error;
        }
    }
}
// Export to global scope - IMPORTANT FIX
window.ArtworksTab = ArtworksTab;

// Flag to indicate this script has loaded
window.ArtworksTabLoaded = true