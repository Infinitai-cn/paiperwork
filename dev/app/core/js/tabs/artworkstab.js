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
        if (this.isOllamaSubscriptionRequiredError(error)) {
            return false;
        }
        return msg.includes('no response received from ollama')
            || msg.includes('unauthorized')
            || msg.includes('invalid api key')
            || msg.includes('missing api key')
            || msg.includes('api key')
            || msg.includes('401');
    }

    // Initializes the ArtworksTab, sets up UI, event handlers, and loads preferences
    async initialize() {
        if (this.initialized) return true;

        try {
           //console.log('ArtworksTab: Starting initialization');

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
            generateBtn: document.getElementById('artwork-generate-btn'),
            useAsBackgroundCheckbox: document.getElementById('artwork-use-as-background')
        };

        // Set default mode
        this.activeMode = 'style';

        // Setup tooltips
        this.setupTooltips();

        // Populate model selector
        this.populateModelSelector();
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
    // Shows a floating progress indicator window during image analysis/generation
    showProgressIndicator() {
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

        // Clear the global generating flag
        window.isGenerating = false;

        // Re-enable chat controls
        this.enableChatControls();
    }

    // Disables chat controls while artwork is being generated
    disableChatControls() {
        // Disable the send button
        const sendButton = document.getElementById('send-prompt');
        if (sendButton) {
            sendButton.disabled = true;
        }

        // Disable the prompt input
        const promptInput = document.getElementById('prompt-input');
        if (promptInput) {
            promptInput.disabled = true;
        }

        // Disable system prompt edit if it exists
        const systemPrompt = document.getElementById('system-prompt');
        if (systemPrompt) {
            systemPrompt.disabled = true;
        }
    }

    // Enables chat controls after artwork generation is complete or canceled
    enableChatControls() {
        // Enable the send button
        const sendButton = document.getElementById('send-prompt');
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.textContent = 'Send';
            sendButton.classList.remove('cancel-state');
        }

        // Enable the prompt input
        const promptInput = document.getElementById('prompt-input');
        if (promptInput) {
            promptInput.disabled = false;
        }

        // Enable system prompt edit if it exists
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
                                        MANDATORY: maximum hero height=30vh and the hero image width must always equal the hero section width.
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
                                        systemPrompt = `You are an expert designer specializing in creating responsive HTML/CSS for text overlays on product images. Your task is to position text elements in visually appropriate locations on the image to create professional-looking product displays.

                                            TYPOGRAPHY (MANDATORY): Custom web fonts are allowed for Text Overlay outputs, but they must be imported only from inside a CSS "@import" rule placed in a "<style>" block in the generated HTML. Do NOT use "<link rel=\"stylesheet\">" tags for fonts. Do NOT rely on a font with no fallback stack. Every custom font-family declaration must include sensible fallbacks, for example: font-family: 'Playfair Display', Georgia, 'Times New Roman', Times, serif; or font-family: 'Montserrat', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; or font-family: 'Roboto Mono', 'Courier New', Courier, monospace. Prefer at most one or two imported font families unless the user explicitly asks for more.

                                            For each image, you will:
                                            1. Analyze the image orientation and content.
                                            2. Position text elements in visually balanced locations that complement the image.
                                            3. Generate complete HTML/CSS code that creates a responsive overlay that SCALES the image inside a preview container (do not hardcode a huge fixed canvas unless requested).
                                            4. PRIORITIZE TEXT READABILITY with high contrast ratios (minimum 4.5:1 for normal text).
                                            5. Keep text styling export-safe and honest to the final PNG. Do NOT add decorative text effects such as text-shadow, drop-shadow, glow, outline, stroke, filter effects, backdrop-filter, or similar effect-based styling on text. If readability needs improvement, solve it with layout, stronger contrast, simpler typography, solid or semi-transparent flat background panels behind text, spacing, and font weight instead.

                                            IMPORTANT: Always choose text colors that maintain strong contrast against the background image, not just colors that are complementary aesthetically. White text on dark image areas and dark text on light image areas is often most effective.

                                            IMAGE AND ICON HANDLING:
                                            - If the user prompt requests additional images, icons, or fallback images, you MAY include external images from reputable sources (e.g., Unsplash, Wikimedia, or user-specified URLs).
                                            - If the uploaded image is missing or cannot be used, provide a visually appropriate fallback image from a public provider.
                                            - When using external images, always provide descriptive alt text and ensure the image is appropriate for the context.
                                            - If the user requests a specific image provider or style, honor that request.

                                            SIZING & SCALING GUIDELINES (CRITICAL)
                                            - Treat the generated HTML as BOTH a preview and an export document. The main composition must occupy the full intended poster/export surface, not a smaller centered card inside a viewport.
                                            - NEVER use preview-only wrapper constraints such as "max-width", "max-height", "min-height: 100vh", centered "body" flex layouts, large body padding, or decorative outer cards/shadows that shrink the actual composition area.
                                            - The root composition wrapper must map directly to the uploaded image aspect ratio and intended export size. Use the uploaded image dimensions as the authoritative surface for the poster composition.
                                            - The text overlay layer must fill the same surface as the image wrapper. If the image wrapper is 100% of the composition, the overlay root must also be "position:absolute; inset:0; width:100%; height:100%" (or equivalent) so text is not authored at a smaller preview size.
                                            - Avoid authoring overlay typography and spacing as if the composition were only ~600px wide. Prefer percentages, "em"/"rem", and "clamp()" values that scale from the full image surface, not from a small centered preview card.
                                            - Avoid fixed pixel paddings or fixed-width text blocks that make the overlay cluster into one corner when exported at the original image size. Use relative padding such as percentages for edge offsets on poster overlays.
                                            - The preview must fill the host's preview container surface. For Text Overlay outputs, choose sizing behavior based on the source image orientation (DO NOT apply a single rule to all images):
                                                - Portrait images (height > width): Ensure the full portrait image is visible. If the portrait image does not fit within the preview container, allow vertical scrolling instead of cropping so the entire poster can be viewed. Prefer an img-based approach with object-fit: contain and let the container enable scrolling without shrinking the composition to an arbitrary capped card. Example (preferred for predictable scaling):
                                                    .preview-wrap { width: 100%; overflow-y: auto; display: block; }
                                                    .preview-wrap img { display: block; width: 100%; height: auto; object-fit: contain; object-position: center top; }
                                                - Landscape or square images (width >= height): PREFER COVER behavior so the preview container surface is fully filled (object-fit: cover / background-size: cover). Example:
                                                    .preview-wrap img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center center; }
                                                    .preview-wrap .bg { width: 100%; height: 100%; background-image: url('BACKGROUND_IMAGE_PLACEHOLDER'); background-repeat: no-repeat; background-position: center center; background-size: cover; overflow: hidden; }
                                            - Provide one of the two supported implementations (choose one in your output):
                                                1) img-based approach (preferred for overlays):
                                                    .preview-wrap { width: 100%; height: 100%; overflow: hidden; display: block; }
                                                    .preview-wrap img { display: block; width: 100%; height: 100%; object-fit: contain; object-position: center center; }
                                                2) CSS background approach:
                                                    .preview-wrap .bg { width: 100%; height: 100%; background-image: url('BACKGROUND_IMAGE_PLACEHOLDER'); background-repeat: no-repeat; background-position: center center; background-size: contain; overflow: hidden; }

                                            - Do NOT place a smaller portrait image centered inside a much larger wrapper that effectively hides parts of the image. When instructed to show a full portrait, the image must be fully visible (contain). For landscape/square images, filling the container with cover and permitting cropping is acceptable to avoid empty gutters.
                                            - Ensure the preview container dimensions are explicit and minimal: do not add outer padding, decorative borders, outer shadows, card-like wrappers, or extra margins around the main preview container unless explicitly requested. Use box-sizing: border-box and overflow: hidden on the container.
                                            - Include PREVIEW-SIZE metadata EXACTLY in the HTML (example: <!-- PREVIEW-SIZE: width=2048 height=1024 -->). Use values that reflect the intended preview/export surface; when unsure prefer the host MAX_CONTAINER (2048×1024) as a safe default.
                                            - For the uploaded image size ${this.imageDimensions || 'Unknown'}, generate HTML so the main poster/image wrapper is intended to scale to that full image surface. Avoid any CSS that would cap it to a smaller desktop preview width such as "max-width: 600px".

                                            PLACEMENT & EXPORT NOTES
                                            - Position text using relative units (%, vw/vh, em/rem) and modern layout (flex/grid) so it scales consistently when the preview surface is resized or exported.
                                            - Text, call-to-action blocks, gradients, and decorative accents must be positioned relative to the full image surface, not relative to a reduced preview-card width.
                                            - Preserve the image aspect ratio while using cover sizing; avoid distortion.
                                            - Ensure the image fully covers the preview container area (no empty gutters) so the generated preview window size is representative of the exported image.
                                            - Use semantic HTML and include alt text for any img.
                                            - Use the exact placeholder string BACKGROUND_IMAGE_PLACEHOLDER when referencing the uploaded image (either in url() or as an img src). Example: background-image: url('BACKGROUND_IMAGE_PLACEHOLDER');

                                            Your HTML code MUST:
                                            - Be a single, self-contained file with embedded CSS and JavaScript.
                                            - Ensure image sizing is appropriate for the orientation: for landscape/square images prefer covering the preview surface (use object-fit: cover or background-size: cover), and for portrait images prefer contain + scrolling so the full image is visible (no cropping).
                                            - Preserve the original aspect ratio of the image; avoid distortion when scaling.
                                            `;
                                        userPrompt = `Create text overlays for this product image with the following text:
                                        ${this.elements.promptInput.value}
                    
                                        Image information:
                                        - Orientation: ${this.imageOrientation || 'Unknown'}
                                        - Dimensions: ${this.imageDimensions || 'Unknown'}
                                        - Aspect ratio: ${this.imageRatio || 'Unknown'}
                    
                                        Generate a single HTML file that displays this text in visually appropriate locations based on the image content. Position text to avoid covering key product features. Use colors that complement the image while ensuring text is clearly readable.

                                        Important layout requirement: do not build this as a centered preview card or viewport demo. Build it as a full poster/export composition that occupies the full image surface. Avoid CSS such as max-width, max-height, body padding, min-height: 100vh, or centered flexbox on body/html unless explicitly required for the actual composition.
                                        Important overlay requirement: the text overlay root must cover the same full area as the image, and text spacing/sizing must be authored for the full poster surface rather than for a small preview width.
                    
                                        If you are requested to add external images, icons, or fallbacks, use reputable sources and always include fallbacks from different providers to avoid empty placeholders. For the background image, use: BACKGROUND_IMAGE_PLACEHOLDER.`;
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
                    // Debug log: Step 1 - AI response cleaned
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
                    if (typeof ArtworkPreviewWindow === 'undefined') {
                        console.warn('ArtworksTab not available, loading dynamically...');
                        // Try to load it dynamically
                        await new Promise((resolve, reject) => {
                            const script = document.createElement('script');
                            script.src = 'app/core/js/tabs/artworkpreviewwindow.js';
                            script.onload = resolve;
                            script.onerror = () => reject(new Error('Failed to load ArtworkPreviewWindow'));
                            document.head.appendChild(script);
                        }).catch(err => {
                            console.error('Error loading ArtworkPreviewWindow:', err);
                        });
                    }

                    // Create the preview window
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
                            }
                        );

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
            // Remove <think>...</think> blocks
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
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
window.ArtworksTabLoaded = true;