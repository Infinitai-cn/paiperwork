class presentationtab {
        constructor() {
        this.isInitialized = false;
        this.presentationGenerator = null;
        this.loadingWindow = null;
    }

    async createSlideForge() {
        // Get uploaded file and page count
    const file = this.selectedFile;
    // Debug: log selected file info to help diagnose incorrect document selection
    try { 
        //console.log('[SlideForgeTab] createSlideForge - selectedFile:', file && file.name ? `${file.name} (${file.size || 'unknown'} bytes)` : file); 
        } catch (e) {}
        const pagesSelector = document.getElementById('presentation-pages-selector');
        const numPages = pagesSelector ? parseInt(pagesSelector.value, 10) : 1;
        if (!file || !numPages) {
            alert(Lang.get('pleaseSelectFileAndPages'));
            return;
        }

        // Only instantiate and call PreviewWindow, all logic is inside that class
        if (window.PreviewWindow) {
            // Show loading modal only (no preview window yet)
            let loadingModal = document.createElement('div');
            loadingModal.className = 'presentation-loading-modal-standalone';
            loadingModal.style.position = 'fixed';
            loadingModal.style.top = '0';
            loadingModal.style.left = '0';
            loadingModal.style.width = '100vw';
            loadingModal.style.height = '100vh';
            loadingModal.style.background = 'var(--modal-overlay-bg, rgba(30,30,30,0.7))';
            loadingModal.style.backdropFilter = 'blur(8px)';
            loadingModal.style.webkitBackdropFilter = 'blur(8px)'; // Safari support
            loadingModal.style.display = 'flex';
            loadingModal.style.alignItems = 'center';
            loadingModal.style.justifyContent = 'center';
            loadingModal.style.zIndex = '9999';
            // Spinner and message (theme-aware via CSS vars; classes allow themes.css overrides)
            const spinner = document.createElement('div');
            spinner.className = 'presentation-loading-spinner';
            spinner.style.width = '48px';
            spinner.style.height = '48px';
            spinner.style.border = '6px solid var(--presentation-loading-border, var(--border-color, #e1e5e9))';
            spinner.style.borderTop = '6px solid var(--presentation-loading-accent, var(--accent-color, #007aff))';
            spinner.style.borderRadius = '50%';
            spinner.style.animation = 'spin 1s linear infinite';
            spinner.style.marginBottom = '24px';

            let msgDiv = document.createElement('div');
            msgDiv.className = 'presentation-loading-msg';
            msgDiv.style.fontSize = '20px';
            msgDiv.style.fontWeight = '500';
            msgDiv.style.textAlign = 'center';
            msgDiv.style.color = 'var(--presentation-loading-text, var(--modal-text, var(--text-color, #fafafa)))';
            msgDiv.textContent = Lang.get('extractingTextFromDocument');

            const modalBox = document.createElement('div');
            modalBox.className = 'presentation-loading-modal-box';
            modalBox.style.background = 'var(--presentation-modal-bg, var(--modal-bg, var(--panel-background, #222)))';
            modalBox.style.color = 'var(--presentation-modal-text, var(--modal-text, var(--text-color, #fafafa)))';
            modalBox.style.borderRadius = '16px';
            modalBox.style.boxShadow = 'var(--presentation-modal-box-shadow, 0 8px 32px rgba(0,0,0,0.18))';
            modalBox.style.padding = '40px 48px';
            modalBox.style.display = 'flex';
            modalBox.style.flexDirection = 'column';
            modalBox.style.alignItems = 'center';
            modalBox.style.justifyContent = 'center';
            modalBox.style.position = 'relative';
            
            // Close button for loading modal (theme-aware)
            const loadingCloseBtn = document.createElement('button');
            loadingCloseBtn.className = 'presentation-loading-close';
            loadingCloseBtn.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--presentation-modal-close-icon-color, #fff);font-size:28px;font-weight:bold;line-height:1;">&times;</span>';
            loadingCloseBtn.style.background = 'var(--presentation-modal-close-bg, #e53935)';
            loadingCloseBtn.style.border = '1px solid var(--presentation-modal-close-border, transparent)';
            loadingCloseBtn.style.width = '36px';
            loadingCloseBtn.style.height = '36px';
            loadingCloseBtn.style.display = 'flex';
            loadingCloseBtn.style.alignItems = 'center';
            loadingCloseBtn.style.justifyContent = 'center';
            loadingCloseBtn.style.fontSize = '28px';
            loadingCloseBtn.style.cursor = 'pointer';
            loadingCloseBtn.style.padding = '0';
            loadingCloseBtn.style.borderRadius = '10px';
            loadingCloseBtn.style.boxShadow = 'var(--presentation-modal-close-box-shadow, 0 2px 8px rgba(0,0,0,0.18))';
            loadingCloseBtn.style.position = 'absolute';
            loadingCloseBtn.style.top = '12px';
            loadingCloseBtn.style.right = '12px';
            loadingCloseBtn.style.zIndex = '10004';
            loadingCloseBtn.style.transition = 'background 0.2s, box-shadow 0.2s';
            loadingCloseBtn.onmouseover = () => {
                loadingCloseBtn.style.background = 'var(--presentation-modal-close-hover-bg, #b71c1c)';
                loadingCloseBtn.style.boxShadow = 'var(--presentation-modal-close-hover-shadow, 0 4px 16px rgba(229,57,53,0.25))';
                loadingCloseBtn.style.color = 'var(--presentation-modal-close-hover-color, var(--presentation-modal-close-icon-color, #fff))';
            };
            loadingCloseBtn.onmouseout = () => {
                loadingCloseBtn.style.background = 'var(--presentation-modal-close-bg, #e53935)';
                loadingCloseBtn.style.boxShadow = 'var(--presentation-modal-close-box-shadow, 0 2px 8px rgba(0,0,0,0.18))';
                loadingCloseBtn.style.color = 'var(--presentation-modal-close-icon-color, #fff)';
            };
            // Use arrow function to preserve 'this' context
            loadingCloseBtn.onclick = () => {
                this.abortGeneration();
            };
            
            modalBox.appendChild(loadingCloseBtn);
            modalBox.appendChild(spinner);
            modalBox.appendChild(msgDiv);
            loadingModal.appendChild(modalBox);
            document.body.appendChild(loadingModal);

            // Notify chat that we're effectively changing the system prompt for this generation
            // and create a continue button in the chat container. Skip the confirmation dialog
            // because this is an explicit user action (generate presentation).
            try {
                if (window.chatInstance && typeof window.chatInstance.handleSystemPromptChange === 'function') {
                    window.chatInstance.handleSystemPromptChange(undefined, true);
                }
            } catch (e) {
                console.warn('SlideForgeTab: error notifying chat of system prompt change', e);
            }

            // Ensure a shared AbortController exists as soon as the loading modal is shown
            try {
                if (!window.SlideForgeAbortController) window.SlideForgeAbortController = new AbortController();
            } catch (e) { /* ignore */ }

            // Helper to update loading message
            const setLoadingMessage = msg => { if (msgDiv) msgDiv.textContent = msg; };

            const contentInstance = new window.Content();
            const logCallback = msg => { 
            //console.log('[SlideForgeTab]', msg); 
            };
            setLoadingMessage(Lang.get('extractingTextFromDocument'));
            try {
                const extractedText = await contentInstance.extractTextFromDocument(file, logCallback);
                // Read extra user prompt (optional)
                let extraPrompt = '';
                try { extraPrompt = (document.getElementById('presentation-extra-prompt') && document.getElementById('presentation-extra-prompt').value) || ''; } catch (e) { extraPrompt = ''; }
                if (extraPrompt && extraPrompt.trim()) logCallback('[SlideForgeTab] extraPrompt: ' + extraPrompt);
                setLoadingMessage(Lang.get('generatingSlidetext'));
                const numSlides = numPages;
                let aiReply = '';
                let parsedSlides = null;
                try {
                    // If extraPrompt is provided, prefer using it in the AI call when supported by contentInstance
                    if (extraPrompt && extraPrompt.trim() && typeof contentInstance.generateSlideForgeRawAIReply === 'function') {
                        try {
                            aiReply = await contentInstance.generateSlideForgeRawAIReply(file, numSlides, logCallback, { extraPrompt });
                        } catch (e) {
                            // fallback to original signature
                            aiReply = await contentInstance.generateSlideForgeRawAIReply(file, numSlides, logCallback);
                        }
                    } else {
                        aiReply = await contentInstance.generateSlideForgeRawAIReply(file, numSlides, logCallback);
                    }
                    setLoadingMessage(Lang.get('aiReplyReceived'));
                    logCallback('[AI] Raw reply: ' + aiReply);
                    try {
                        parsedSlides = await contentInstance.parseSlideForgeAIReply(aiReply, numSlides, logCallback);
                        setLoadingMessage(Lang.get('searchingImagesForSlides'));
                    } catch (parseErr) {
                        logCallback('[Error] Failed to parse AI reply: ' + parseErr.message);

                        // Detect JSON parse failures from Content.cleanAIResponse
                        const isParseError = !!(parseErr && (String(parseErr.message || '').indexOf('Invalid AI response format') !== -1 || (parseErr.details && parseErr.details.originalError)));

                        // Single automatic retry: update the same loading modal legend and call the AI once more
                        if (isParseError && !loadingModal.__retried) {
                            loadingModal.__retried = true;
                            logCallback('[SlideForgeTab] JSON parse error detected — attempting one automatic retry using the same loading window');

                            // Update the visible legend in-place on the same loading modal
                            try {
                                const retryText = (window.Lang ? Lang.get('requestingAgainDueToIncompleteAIReply') : 'Requesting again the presentation due to incomplete AI reply');
                                setLoadingMessage(retryText);
                            } catch (e) { /* ignore */ }

                            // Call the AI again once
                            try {
                                let aiReply2 = '';
                                try {
                                    aiReply2 = await contentInstance.generateSlideForgeRawAIReply(file, numSlides, logCallback);
                                } catch (e2) {
                                    logCallback('[Error] Retry AI call failed: ' + e2.message);
                                    setLoadingMessage(Lang.get('presentationError') + ': ' + e2.message);
                                    return;
                                }

                                setLoadingMessage(Lang.get('aiReplyReceived'));
                                logCallback('[AI] Raw reply (retry): ' + aiReply2);

                                // Try parsing the retry reply
                                try {
                                    parsedSlides = await contentInstance.parseSlideForgeAIReply(aiReply2, numSlides, logCallback);
                                    setLoadingMessage(Lang.get('searchingImagesForSlides'));
                                } catch (parseErr2) {
                                    logCallback('[Error] Retry parse failed: ' + parseErr2.message);
                                    setLoadingMessage(Lang.get('presentationError') + ': ' + parseErr2.message);
                                    return;
                                }

                                // Continue with image downloads and preview rendering (same flow)
                                let slideImagesResult2 = null;
                                try {
                                    slideImagesResult2 = await contentInstance.downloadAllSlideImages(parsedSlides, logCallback);
                                    setLoadingMessage(Lang.get('creatingSlideForge'));
                                } catch (imgErr2) {
                                    logCallback('[Error] Failed to download images (retry): ' + imgErr2.message);
                                    setLoadingMessage(Lang.get('presentationError') + ': ' + imgErr2.message);
                                    return;
                                }

                                // Only proceed to preview if we actually have slides
                                if (parsedSlides && parsedSlides.slides && Array.isArray(parsedSlides.slides) && parsedSlides.slides.length > 0) {
                                    // Remove loading modal and show preview window
                                    try { if (loadingModal && document.body.contains(loadingModal)) document.body.removeChild(loadingModal); } catch (e) { }

                                    const stageWidth = 1280;
                                    const stageHeight = 720;
                                    window.presentationPreview = new window.PreviewWindow({
                                        file,
                                        numPages,
                                        stageWidth,
                                        stageHeight
                                    });
                                    window.presentationPreview.open();
                                    if (window.presentationPreview && typeof window.presentationPreview.applySlidesData === 'function') {
                                        await window.presentationPreview.applySlidesData(parsedSlides, slideImagesResult2);
                                    }

                                    return;
                                } else {
                                    // Keep loading modal open and show a helpful error message instead of opening an empty preview
                                    logCallback('[SlideForgeTab] Aborting preview open: no slides generated after retry');
                                    try {
                                        setLoadingMessage(Lang.get('presentationError') + ': ' + (window.Lang ? Lang.get('noSlidesGenerated') : 'AI returned no slides.'));
                                    } catch (e) {
                                        setLoadingMessage('SlideForge error: AI returned no slides.');
                                    }
                                    return;
                                }
                            } catch (retryFlowErr) {
                                logCallback('[Error] Retry flow failed: ' + (retryFlowErr && retryFlowErr.message ? retryFlowErr.message : retryFlowErr));
                                setLoadingMessage(Lang.get('presentationError') + ': ' + (retryFlowErr && retryFlowErr.message ? retryFlowErr.message : ''));
                                return;
                            }
                        }

                        // Not a parse error or already retried -> show error and abort
                        setLoadingMessage(Lang.get('presentationError') + ': ' + parseErr.message);
                        return;
                    }
                    let slideImagesResult = null;
                    try {
                        slideImagesResult = await contentInstance.downloadAllSlideImages(parsedSlides, logCallback);
                        setLoadingMessage(Lang.get('creatingSlideForge'));
                    } catch (imgErr) {
                        logCallback('[Error] Failed to download images: ' + imgErr.message);
                        setLoadingMessage(Lang.get('presentationError') + ': ' + imgErr.message);
                        return;
                    }
                    // Only proceed to preview if we actually have slides
                    if (parsedSlides && parsedSlides.slides && Array.isArray(parsedSlides.slides) && parsedSlides.slides.length > 0) {
                        // Remove loading modal and show preview window
                        try { if (loadingModal && document.body.contains(loadingModal)) document.body.removeChild(loadingModal); } catch (e) { }
                        // Now open preview window and render slides
                        const stageWidth = 1280;
                        const stageHeight = 720;
                        window.presentationPreview = new window.PreviewWindow({
                            file,
                            numPages,
                            stageWidth,
                            stageHeight
                        });
                        window.presentationPreview.open();
                        if (window.presentationPreview && typeof window.presentationPreview.applySlidesData === 'function') {
                            await window.presentationPreview.applySlidesData(parsedSlides, slideImagesResult);
                        }
                    } else {
                        // Keep loading modal open and show a helpful error message instead of opening an empty preview
                        logCallback('[SlideForgeTab] Aborting preview open: no slides generated');
                        try {
                            setLoadingMessage(Lang.get('presentationError') + ': ' + (window.Lang ? Lang.get('noSlidesGenerated') : 'AI returned no slides.'));
                        } catch (e) {
                            setLoadingMessage('SlideForge error: AI returned no slides.');
                        }
                        return;
                    }
                } catch (aiErr) {
                    setLoadingMessage(Lang.get('presentationError') + ': ' + aiErr.message);
                    logCallback('[Error] ' + aiErr.message);
                }
            } catch (err) {
                setLoadingMessage(Lang.get('presentationError') + ': ' + err.message);
                logCallback('[Error] ' + err.message);
            }
        } else {
            alert(Lang.get('previewWindowNotFound'));
        }
    }

    async initialize() {
        if (this.isInitialized) {
            return;
        }

        //console.log('SlideForgetab: Initializing SlideForge tab interface');
        this.injectStyles();
        await this.createTabUI();
        this.setupEventListeners();
        // Wire up generate button to createSlideForge (Task 1)
        const generateButton = document.getElementById('presentation-generate-button');
        if (generateButton) {
            generateButton.addEventListener('click', () => this.createSlideForge());
        }
        this.isInitialized = true;
    }

    async createTabUI() {
        const tabElement = document.getElementById('presentation-tab');
        if (!tabElement) {
            console.error('SlideForgetab: Unable to find SlideForge tab element');
            return;
        }

        tabElement.innerHTML = `
            <div class="presentation-container">
                <div class="presentation-header">
                    <h3 id="presentation-title">${Lang.get('createSlideForgeFromDocument')}</h3>
                </div>
                
                <div class="presentation-content">
                    <!-- Drag and Drop Zone -->
                    <div class="presentation-upload-zone" id="presentation-upload-zone">
                        <div class="upload-icon">📄</div>
                        <div class="upload-text">
                            <p id="presentation-drag-drop-text">${Lang.get('dragDropDocuments')}</p>
                            <p id="presentation-supported-formats">${Lang.get('supportedFormatsList')}</p>
                        </div>
                        <input type="file" id="presentation-file-input" accept=".pdf,.docx,.txt,.md" style="display: none;">
                        <button id="presentation-browse-button" class="browse-button">${Lang.get('browseFiles')}</button>
                    </div>

                    <!-- File Info -->
                    <div class="presentation-file-info" id="presentation-file-info" style="display: none;">
                        <div class="file-details">
                            <span id="presentation-file-name"></span>
            <button id="presentation-remove-file" class="remove-file-btn"><span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--presentation-remove-file-color, #111);font-size:18px;font-weight:bold;line-height:1;">&times;</span></button>
                        </div>
                    </div>

                    <!-- Settings -->
                    <div class="presentation-settings">
                        <div class="setting-group">
                            <select id="presentation-mode-selector">
                                <option value="summarize">${Lang.get('summarizeToSlideForge')}</option>
                            </select>
                        </div>
                        <div class="setting-group">
                            <label for="presentation-pages-selector" id="presentation-pages-label">${Lang.get('numberOfSlides')}:</label>
                            <select id="presentation-pages-selector">
                                ${Array.from({length: 15}, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
                            </select>
                        </div>

                        <!-- Number of text bullets per slide -->
                        <div class="setting-group">
                            <label for="presentation-bullets-selector" id="presentation-bullets-label">${Lang.get('presentationBulletsLabel')}</label>
                            <select id="presentation-bullets-selector">
                                ${Array.from({length: 4}, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
                            </select>
                        </div>

                    <!-- Generate Button -->
                    <!-- Extra user prompt for presentation generation -->
                    <div class="setting-group" style="margin-top:8px;">
                        <textarea id="presentation-extra-prompt" rows="4" placeholder="${Lang.get('presentationExtraPromptPlaceholder')}" style="width:100%;box-sizing:border-box;padding:8px;border-radius:6px;border:1px solid var(--input-border,#ccc);resize:vertical;font-size:inherit;font-family:inherit;"></textarea>
                    </div>
                    <button id="presentation-generate-button" class="generate-button" disabled>
                        ${Lang.get('generateSlideForge')}
                    </button>
                </div>

                <!-- Loading Indicator -->
                <div class="presentation-loading" id="presentation-loading" style="display: none;">
                    <div class="loading-spinner"></div>
                    <p id="presentation-loading-text">${Lang.get('generatingSlideForge')}</p>
                </div>
            </div>
        `;

        // Set default number of slides
        document.getElementById('presentation-pages-selector').value = '5';
        // Set default bullets per slide
        document.getElementById('presentation-bullets-selector').value = '3';
        // Set default mode
        document.getElementById('presentation-mode-selector').value = 'summarize';


        // Add mode selector logic for enabling/disabling number of slides and hiding bullets when visual storytelling is selected
        const modeSelector = document.getElementById('presentation-mode-selector');
        const slidesSelector = document.getElementById('presentation-pages-selector');
        const bulletsSelector = document.getElementById('presentation-bullets-selector');
        const bulletsLabel = document.getElementById('presentation-bullets-label');
        modeSelector.addEventListener('change', function() {
            // No special-mode handling required; ensure selectors are visible and enabled for all modes
            if (slidesSelector) { slidesSelector.style.display = ''; slidesSelector.disabled = false; }
            const slidesLabel = document.getElementById('presentation-pages-label');
            if (slidesLabel) slidesLabel.style.display = '';
            if (bulletsSelector) { bulletsSelector.disabled = false; bulletsSelector.style.display = ''; }
            if (bulletsLabel) bulletsLabel.style.display = '';
        });
    // Initial state: selectors visible and enabled by default
    if (slidesSelector) { slidesSelector.style.display = ''; slidesSelector.disabled = false; }
    if (bulletsSelector) bulletsSelector.disabled = false;
    }

    setupEventListeners() {
        const uploadZone = document.getElementById('presentation-upload-zone');
        const fileInput = document.getElementById('presentation-file-input');
        const browseButton = document.getElementById('presentation-browse-button');
        const generateButton = document.getElementById('presentation-generate-button');
        const removeFileButton = document.getElementById('presentation-remove-file');

        // Drag and drop events
        uploadZone.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadZone.addEventListener('drop', this.handleDrop.bind(this));

        // File input events
        browseButton.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Remove file event
        removeFileButton.addEventListener('click', this.removeFile.bind(this));

    }

    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('drag-over');
    }

    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('drag-over');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(event) {
        const files = event.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    processFile(file) {
        // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];
    const allowedExtensions = ['.pdf', '.docx', '.txt', '.md'];
        
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
            alert(Lang.get('unsupportedFileType'));
            return;
        }

    // Store file
    this.selectedFile = file;
    // Debug: log when a file is processed/selected
    try { 
        //console.log('[SlideForgeTab] processFile - stored selectedFile:', file && file.name ? `${file.name} (${file.size || 'unknown'} bytes)` : file); 
    } catch (e) {}

        // Update UI
        this.showFileInfo(file);
        this.enableGenerateButton();
    }

    showFileInfo(file) {
        const fileInfo = document.getElementById('presentation-file-info');
        const fileName = document.getElementById('presentation-file-name');
        const uploadZone = document.getElementById('presentation-upload-zone');

        fileName.textContent = file.name;
        fileInfo.style.display = 'block';
        uploadZone.style.display = 'none';
    }

    removeFile() {
        this.selectedFile = null;
        
        const fileInfo = document.getElementById('presentation-file-info');
        const uploadZone = document.getElementById('presentation-upload-zone');
        const generateButton = document.getElementById('presentation-generate-button');
        const fileInput = document.getElementById('presentation-file-input');

        fileInfo.style.display = 'none';
        uploadZone.style.display = 'block';
        generateButton.disabled = true;
        fileInput.value = '';
    }

    enableGenerateButton() {
        const generateButton = document.getElementById('presentation-generate-button');
        generateButton.disabled = false;
    }

    abortGeneration() {


        // Abort the global SlideForgeAbortController if it exists
        if (window.SlideForgeAbortController && typeof window.SlideForgeAbortController.abort === 'function') {
            window.SlideForgeAbortController.abort();
            window.SlideForgeAbortController = null;
        }

        // Find and remove any existing loading modal
        const existingModal = document.querySelector('.presentation-loading-modal-standalone');
        if (existingModal && document.body.contains(existingModal)) {
            document.body.removeChild(existingModal);
        }

        // Show notification
        //console.log('SlideForge generation aborted by user');
    }

    async handleTabChange(isActive) {
        if (isActive) {
            if (!this.isInitialized) {
                await this.initialize();
            } else {
                // Always re-render UI when tab is activated
                await this.createTabUI();
                this.setupEventListeners();
            }
        }
    }

    injectStyles() {
        if (document.getElementById('presentation-tab-styles')) {
            return; // Styles already injected
        }

        const style = document.createElement('style');
        style.id = 'presentation-tab-styles';
        style.textContent = `
            /* SlideForge Tab Styles */
            .presentation-container {
                width: 380px;
                padding: 0;
                margin: 0;
                background: var(--background-color);
                color: var(--text-color);
                box-sizing: border-box;
                height: 100%;
                overflow-y: auto;
            }

            .presentation-header {
                margin: 10px 10px 20px 10px;
                text-align: center;
            }

            .presentation-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: var(--text-color);
            }

            .presentation-content {
                padding: 0 10px 10px 10px;
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            /* Upload Zone Styles */
            .presentation-upload-zone {
                border: 2px dashed var(--border-color);
                border-radius: 8px;
                padding: 25px 15px;
                text-align: center;
                background: var(--panel-background);
                transition: all 0.3s ease;
                cursor: pointer;
                position: relative;
                width: 100%;
                box-sizing: border-box;
            }

            .presentation-upload-zone:hover {
                border-color: var(--accent-color);
                background: var(--hover-background);
            }

            .presentation-upload-zone.drag-over {
                border-color: var(--accent-color);
                background: var(--hover-background);
                transform: scale(1.02);
            }

            .upload-icon {
                font-size: 48px;
                margin-bottom: 15px;
                opacity: 0.6;
            }

            .upload-text p {
                margin: 5px 0;
                color: var(--text-color);
            }

            .upload-text p:first-child {
                font-weight: 500;
                font-size: 16px;
            }

            .upload-text p:last-child {
                font-size: 14px;
                opacity: 0.7;
            }

            .browse-button {
                margin-top: 15px;
                padding: 8px 20px;
                background: var(--accent-color);
                color: var(--presentation-browse-color, #ffffff);
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.3s ease, color 0.2s ease, border-color 0.2s ease;
            }

            /* Ensure readable text on hover: force green background and white text in both themes */
            .browse-button:hover {
                background: var(--presentation-browse-hover-bg, #10b981);
                color: #ffffff;
                border: 1px solid var(--presentation-browse-hover-border, transparent);
            }

            /* File Info Styles */
            .presentation-file-info {
                background: var(--panel-background);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                padding: 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                box-sizing: border-box;
            }

            .file-details {
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                gap: 10px;
            }

            .file-details span {
                font-weight: 500;
                color: var(--text-color);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 280px;
                flex: 1;
                min-width: 0;
            }

            .remove-file-btn {
                background: var(--error-color);
                color: white;
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                cursor: pointer;
                font-size: 16px;
                line-height: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: 10px;
                flex-shrink: 0;
            }

            .remove-file-btn:hover {
                background: var(--error-hover);
            }

            /* Settings Styles */
            .presentation-settings {
                background: var(--panel-background);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                padding: 12px;
                width: 100%;
                box-sizing: border-box;
            }

            .presentation-settings .setting-group {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 12px;
            }
            .presentation-settings .setting-group:last-child {
                margin-bottom: 0;
            }
            .presentation-settings .setting-group label {
                font-weight: 500;
                color: var(--text-color);
                flex: 1;
            }
            .presentation-settings .setting-group select {
                background: var(--input-background);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                padding: 6px 10px;
                color: var(--text-color);
                font-size: 14px;
                cursor: pointer;
            }
            .presentation-settings .setting-group select:hover {
                border-color: var(--accent-color);
            }
            .presentation-settings .setting-group select:focus {
                outline: none;
                border-color: var(--accent-color);
                box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
            }
            /* SlideForge switch flex container for alignment */
            .presentation-settings .presentation-switch-flex {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                min-width: 0;
                flex: 0 0 auto;
                width: auto;
                max-width: none;
            }
            /* SlideForge Tab: Modern slider switch (smaller, 40px width, right-aligned, no flex grow) */
            .presentation-settings .toggle-switch {
                position: relative;
                display: inline-block;
                width: 40px !important;
                min-width: 40px !important;
                max-width: 40px !important;
                height: 22px;
                background: none;
                border-radius: 22px;
                padding: 0;
                vertical-align: middle;
                margin-left: auto;
                flex: 0 0 auto;
            }
            .presentation-settings .toggle-switch input[type="checkbox"] {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .presentation-settings .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #404040;
                transition: .4s;
                border-radius: 22px;
            }
            .presentation-settings .toggle-slider:before {
                position: absolute;
                content: "";
                height: 16px;
                width: 16px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            .presentation-settings .toggle-switch input:checked + .toggle-slider {
                background-color: #4f46e5;
            }
            .presentation-settings .toggle-switch input:checked + .toggle-slider:before {
                transform: translateX(18px);
            }

            /* Generate Button */
            .generate-button {
                padding: 12px 24px;
                background: var(--accent-color);
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
                box-sizing: border-box;
            }

            .generate-button:hover:not(:disabled) {
                background: var(--presentation-generate-hover-bg, #10b981);
                color: var(--presentation-generate-hover-color, #ffffff);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
            }

            .generate-button:disabled {
                background: var(--disabled-color);
                cursor: not-allowed;
                opacity: 0.6;
            }

            /* Loading Styles */
            .presentation-loading {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(var(--background-rgb), 0.9);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                z-index: 10;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid var(--border-color);
                border-top: 4px solid var(--accent-color);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 15px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .presentation-loading p {
                color: var(--text-color);
                font-weight: 500;
                margin: 0;
            }

            /* SlideForge Preview Window Styles - Full Screen */
            .presentation-preview-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: var(--bg-color) !important;
                display: flex;
                flex-direction: column;
                z-index: 1000;
                padding: 0;
                margin: 0;
                width: 100vw;
                height: 100vh;
                overflow: hidden;
                opacity: 1 !important;
            }

            .presentation-preview-window {
                background: var(--bg-color) !important;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                box-shadow: none;
                border-radius: 0;
                margin: 0;
                padding: 0;
                overflow: hidden;
                opacity: 1 !important;
            }

            .presentation-preview-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 20px 30px;
                border-bottom: 1px solid var(--border-color);
                background: var(--bg-color) !important;
                min-height: 60px;
                flex-shrink: 0;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                position: relative;
                z-index: 1001;
                opacity: 1 !important;
            }

            .presentation-preview-header h3 {
                margin: 0;
                color: var(--text-color);
                font-size: 20px;
                font-weight: 600;
                flex: 1;
            }

            .presentation-preview-controls {
                display: flex;
                gap: 12px;
                align-items: center;
            }

            .presentation-control-btn {
                padding: 10px 18px;
                background: var(--accent-color);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
                min-width: 80px;
            }

            .presentation-control-btn:hover {
                background: var(--accent-hover);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
            }

            .presentation-preview-content {
                display: flex;
                flex-direction: column;
                flex: 1;
                overflow: hidden;
                background: var(--bg-color) !important;
                opacity: 1 !important;
            }

            .presentation-current-slide {
                flex: 1;
                padding: 20px;
                overflow: hidden;
                background: var(--bg-color) !important;
                color: var(--text-color);
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 0;
                opacity: 1 !important;
            }

            /* REMOVE ALL WIDTH/HEIGHT/MAX-WIDTH/MAX-HEIGHT RULES FOR .slide-preview */
            .slide-preview {
                /* Only visual styles, NO sizing here! */
                background: #ffffff;
                border: 3px solid #e1e5e9;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                display: flex;
                flex-direction: column;
                justify-content: center;
                text-align: left;
                padding: 60px;
                box-sizing: border-box;
                color: #333333;
                position: relative;
                overflow: hidden;
                /* No width, height, min/max rules! */
            }

            .slide-preview.title-slide {
                text-align: center;
            }

            .slide-preview h1 {
                font-size: 36px;
                font-weight: bold;
                margin-bottom: 20px;
                color: #2c3e50;
            }

            .slide-preview h2 {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 20px;
                color: #2c3e50;
                border-bottom: 2px solid #3498db;
            }

            .slide-preview .subtitle {
                font-size: 18px;
                color: #7f8c8d;
                margin-top: 10px;
            }

            .slide-preview ul {
                font-size: 18px;
                line-height: 1.6;
                margin: 0;
                padding-left: 20px;
            }

            .slide-preview li {
                margin-bottom: 10px;
                color: #34495e;
            }

            /* Content slide layout with image support */
            .slide-content-area {
                display: flex;
                flex-direction: column;
                width: 60%;
                padding-right: 20px;
            }

            /* Single column layout for slides without images */
            .slide-preview.content-slide.no-image {
                flex-direction: column;
            }

            .slide-preview.content-slide.no-image .slide-content-area {
                width: 100%;
                padding-right: 0;
            }

            .slide-preview.content-slide.no-image .slide-image-placeholder {
                display: none;
            }

            .slide-preview.content-slide.single-column {
                display: block;
            }

            /* Thumbnails bar: Remove all min/max/height rules, set only in JS */
            .presentation-thumbnails {
                border-top: 1px solid var(--border-color);
                padding: 20px 30px;
                background: var(--panel-background) !important;
                display: flex;
                gap: 15px;
                overflow-x: auto;
                /* Remove min-height, max-height, height rules! */
                flex-shrink: 0;
                box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
                opacity: 1 !important;
            }

            .thumbnail {
                min-width: 140px;
                height: 80px;
                background: #ffffff;
                border: 3px solid #000000;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                padding: 10px;
                position: relative;
                transition: all 0.3s ease;
                box-sizing: border-box;
                flex-shrink: 0;
            }

            .thumbnail:hover {
                border-color: var(--accent-color);
                transform: scale(1.05);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            }

            .thumbnail.active {
                border-color: var(--accent-color);
                box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2);
                transform: scale(1.02);
            }

            .thumbnail-content {
                flex: 1;
                overflow: hidden;
            }

            .thumbnail-content h4 {
                margin: 0 0 6px 0;
                font-size: 11px;
                font-weight: bold;
                color: #2c3e50;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                line-height: 1.2;
            }

            .thumbnail-content p {
                margin: 0;
                font-size: 9px;
                color: #7f8c8d;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                line-height: 1.2;
            }

            .slide-number {
                position: absolute;
                bottom: 4px;
                right: 6px;
                font-size: 11px;
                font-weight: bold;
                color: var(--text-color);
                background: var(--bg-color);
                padding: 3px 6px;
                border-radius: 3px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            }

            /* Dark mode adjustments for slide content */
            @media (prefers-color-scheme: dark) {
                .slide-preview {
                    background: #1e1e1e;
                    border-color: #404040;
                    color: #e0e0e0;
                }

                .slide-preview h1,
                .slide-preview h2 {
                    color: #ffffff;
                }

                .slide-preview h2 {
                    border-bottom-color: #4f46e5;
                }

                .slide-preview .subtitle {
                    color: #a0a0a0;
                }

                .slide-preview li {
                    color: #d0d0d0;
                }

                .thumbnail {
                    background: #2d2d2d;
                    border-color: #404040;
                }

                .thumbnail-content h4 {
                    color: #ffffff;
                }

                .thumbnail-content p {
                    color: #a0a0a0;
                }

                .slide-image-placeholder {
                    background: #2d2d2d;
                    border-color: #404040;
                    color: #666666;
                }
            }

            /* Force solid backgrounds - no transparency allowed */
            .presentation-preview-overlay,
            .presentation-preview-overlay *,
            .presentation-preview-window,
            .presentation-preview-window * {
                -webkit-backdrop-filter: none !important;
                backdrop-filter: none !important;
            }

            /* Ensure solid background for dark mode */
            @media (prefers-color-scheme: dark) {
                .presentation-preview-overlay {
                    background: var(--bg-color) !important;
                }

                .presentation-preview-window {
                    background: var(--bg-color) !important;
                }

                .presentation-preview-header {
                    background: var(--bg-color) !important;
                    border-bottom-color: #333333;
                }

                .presentation-preview-content {
                    background: var(--bg-color) !important;
                }

                .presentation_current_slide {
                    background: var(--bg-color) !important;
                }

                .presentation-thumbnails {
                    background: #262626 !important;
                    border-top-color: #333333;
                }
            }

            /* Responsive adjustments for smaller screens */
            @media (max-width: 768px) {
                .presentation-preview-header {
                    padding: 15px 20px;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .presentation-preview-header h3 {
                    font-size: 18px;
                    flex-basis: 100%;
                    margin-bottom: 10px;
                }

                .presentation-preview-controls {
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .presentation-control-btn {
                    padding: 8px 14px;
                    font-size: 13px;
                    min-width: 70px;
                }

                .presentation-close-btn {
                    width: 36px;
                    height: 36px;
                    font-size: 18px;
                }

                .slide-preview {
                    padding: 30px;
                    margin: 10px;
                    /* Remove width, height, min/max rules */
                }

                .presentation-thumbnails {
                    padding: 15px 20px;
                    /* Remove min-height, max-height, height rules */
                }

                .thumbnail {
                    min-width: 120px;
                    height: 70px;
                    padding: 8px;
                }

                .thumbnail-content h4 {
                    font-size: 10px;
                }

                .thumbnail-content p {
                    font-size: 8px;
                }
            }

            /* Ultra-wide screen adjustments */
            @media (min-width: 1920px) {
                .slide-preview {
                    /* Remove max-width/max-height rules */
                }
            }

            /* Responsive adjustments for A4 landscape preview */
            @media (max-width: 1200px) {
                .slide-preview {
                    /* Remove width/height/min/max rules! */
                    padding: 30px;
                }
            }

            @media (max-width: 768px) {
                .presentation-preview-header {
                    padding: 15px 20px;
                }
                
                .slide-preview {
                    padding: 20px;
                    font-size: 14px;
                    /* Remove width, height, min/max rules! */
                }
                
                .slide-preview h1 {
                    font-size: 28px;
                }
                
                .slide-preview h2 {
                    font-size: 22px;
                }
                
                .slide-preview ul {
                    font-size: 16px;
                }
                
                .presentation-thumbnails {
                    padding: 10px 20px;
                    /* Remove min-height, max-height, height rules! */
                }
            }

            /* SlideForge Property Sidebar Controls (light mode default) */
            #SlideForge-props-sidebar {
                background: var(--panel-background, #f8f9fa) !important;
                color: var(--text-color, #222) !important;
                border-color: var(--border-color, #e1e5e9) !important;
                box-shadow: none !important;
                transition: background 0.2s, color 0.2s, border 0.2s;
            }
            #SlideForge-props-sidebar * {
                color: var(--text-color, #222) !important;
                border-color: var(--border-color, #e1e5e9) !important;
                box-shadow: none !important;
                transition: background 0.2s, color 0.2s, border 0.2s;
            }
            #SlideForge-props-sidebar input,
            #SlideForge-props-sidebar select,
            #SlideForge-props-sidebar textarea {
                background: var(--input-bg, #fff) !important;
                color: var(--text-color, #222) !important;
                border: 1px solid var(--border-color, #e1e5e9) !important;
                border-radius: 4px;
                padding: 6px 10px;
                margin-bottom: 10px;
                font-size: 14px;
                transition: background 0.2s, color 0.2s, border 0.2s;
            }
            #SlideForge-props-sidebar label {
                color: var(--text-color, #222) !important;
                font-weight: 500;
                margin-bottom: 4px;
            }
            #SlideForge-props-sidebar .presentation-control-group {
                margin-bottom: 16px;
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 10px;
            }
            #SlideForge-props-sidebar button {
                background: var(--accent-color, #4f46e5) !important;
                color: #fff !important;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
                font-size: 14px;
                cursor: pointer;
                transition: background 0.2s;
            }
            #SlideForge-props-sidebar button:hover {
                background: var(--accent-color-hover, #3730a3) !important;
            }
            /* Dark mode for sidebar and controls */
            @media (prefers-color-scheme: dark) {
                #SlideForge-props-sidebar {
                    background: var(--panel-background, #23272e) !important;
                    color: var(--text-color, #e0e0e0) !important;
                    border-color: var(--border-color, #404040) !important;
                }
                #SlideForge-props-sidebar * {
                    color: var(--text-color, #e0e0e0) !important;
                    border-color: var(--border-color, #404040) !important;
                }
                #SlideForge-props-sidebar input,
                #SlideForge-props-sidebar select,
                #SlideForge-props-sidebar textarea {
                    background: var(--input-bg, #181a1b) !important;
                    color: var(--text-color, #e0e0e0) !important;
                    border: 1px solid var(--border-color, #404040) !important;
                }
                #SlideForge-props-sidebar label {
                    color: var(--text-color, #e0e0e0) !important;
                }
                #SlideForge-props-sidebar button {
                    background: var(--accent-color, #6366f1) !important;
                    color: #fff !important;
                }
                #SlideForge-props-sidebar button:hover {
                    background: var(--accent-color-hover, #3730a3) !important;
                }
            }

            /* SlideForge Loading Window Styles */
            .presentation-loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }

            .presentation-loading-window {
                background: var(--bg-color);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 30px;
                min-width: 400px;
                max-width: 500px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                position: relative;
                text-align: center;
                animation: slideIn 0.3s ease;
            }

            .presentation-loading-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
            }

            .presentation-loading-title {
                font-size: 20px;
                font-weight: 600;
                color: var(--text-color);
                margin: 0;
                flex: 1;
                text-align: left;
            }

            .presentation-loading-close {
                background: none;
                border: none;
                font-size: 24px;
                color: var(--label-color);
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
                margin-left: 15px;
            }

            .presentation-loading-close:hover {
                background: var(--danger-color);
                color: white;
            }

            .presentation-loading-content {
                margin-bottom: 25px;
            }

            .presentation-spinner {
                margin: 0 auto 20px auto;
                width: 50px;
                height: 50px;
                border: 4px solid var(--border-color);
                border-top: 4px solid var(--accent-color);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                display: block;
            }

            .presentation-loading-message {
                font-size: 16px;
                color: var(--text-color);
                margin-bottom: 10px;
                line-height: 1.5;
            }

            .presentation-loading-status {
                font-size: 14px;
                color: var(--label-color);
                font-style: italic;
            }

            .presentation-loading-actions {
                display: flex;
                gap: 10px;
                justify-content: center;
            }

            .presentation-abort-button {
                padding: 10px 20px;
                background: var(--danger-color);
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .presentation-abort-button:hover {
                background: var(--danger-color-hover);
                transform: translateY(-1px);
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideIn {
                from { 
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Thumbnails bar (vertical, right of slide) */
            .presentation-preview-thumbnails {
                background: var(--panel-background) !important;
                border-radius: 6px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                gap: 10px;
                padding-top: 10px;
                height: 100%;
                width: 110px;
                transition: background 0.2s, color 0.2s;
            }
            /* No background set in JS! Only this CSS is the source of truth. */
            @media (prefers-color-scheme: dark) {
                .presentation-preview-thumbnails {
                    background: var(--panel-background) !important;
                }
            }

            /* Beautified Sidebar Styles */
            .presentation-sidebar-container {
                background: var(--panel-background);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                margin-bottom: 16px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }

            .presentation-sidebar-header {
                background: var(--accent-color);
                color: white;
                padding: 12px 16px;
                font-weight: 600;
                font-size: 14px;
                text-align: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }

            .presentation-sidebar-separator {
                height: 1px;
                background: #e5e7eb;
                margin: 0;
            }

            @media (prefers-color-scheme: dark) {
                .presentation-sidebar-separator {
                    background: #374151;
                }
            }

            .presentation-sidebar-section {
                padding: 16px;
            }

            .presentation-sidebar-legend {
                font-size: 12px;
                color: var(--text-color);
                opacity: 0.8;
                margin-bottom: 12px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .presentation-control-group {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 12px;
            }

            .presentation-control-group:last-child {
                margin-bottom: 0;
            }

            .presentation-control-label {
                font-weight: 500;
                color: var(--text-color);
                font-size: 13px;
                flex: 1;
                min-width: 0;
            }

            .presentation-control-input {
                background: var(--input-background);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                padding: 6px 10px;
                color: var(--text-color);
                font-size: 13px;
                transition: all 0.2s ease;
                box-sizing: border-box;
            }

            .presentation-control-input:hover {
                border-color: var(--accent-color);
            }

            .presentation-control-input:focus {
                outline: none;
                border-color: var(--accent-color);
                box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
            }

            /* Special styling for color input elements to preserve native appearance */
            input[type="color"].presentation-control-input {
                background: transparent !important;
                padding: 2px !important;
                width: 48px;
                height: 32px;
                cursor: pointer;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                overflow: hidden;
            }

            input[type="color"].presentation-control-input:hover {
                border-color: var(--accent-color);
            }

            input[type="color"].presentation-control-input:focus {
                outline: none;
                border-color: var(--accent-color);
                box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
            }

            /* Ensure color picker swatch is visible */
            input[type="color"].presentation-control-input::-webkit-color-swatch-wrapper {
                padding: 0;
                border: none;
                border-radius: 2px;
            }

            input[type="color"].presentation-control-input::-webkit-color-swatch {
                border: none;
                border-radius: 2px;
                box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
            }

            .presentation-button-group {
                display: flex;
                gap: 6px;
                justify-content: center;
                padding: 12px 0;
            }

            .presentation-sidebar-btn {
                flex: 1;
                min-width: 0;
                padding: 8px 12px;
                background: var(--accent-color);
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 6px;
                font-weight: 300;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .presentation-sidebar-btn:hover {
                background: var(--accent-hover);
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);
            }

            .presentation-sidebar-btn:active {
                transform: translateY(0);
            }

            .presentation-sidebar-btn.secondary {
                background: var(--border-color);
                color: var(--text-color);
            }

            .presentation-sidebar-btn.secondary:hover {
                background: #d1d5db;
            }

            @media (prefers-color-scheme: dark) {
                .presentation-sidebar-btn.secondary {
                    background: #4b5563;
                    color: #e5e7eb;
                }

                .presentation-sidebar-btn.secondary:hover {
                    background: #6b7280;
                }
            }

            .presentation-style-controls {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .presentation-style-checkbox {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                font-weight: 600;
            }

            .presentation-style-checkbox input[type="checkbox"] {
                margin: 0;
                width: 16px;
                height: 16px;
            }

            /* Background blur effect for modal windows */
            .modal-background-blur {
                filter: blur(3px);
                transition: filter 0.3s ease;
            }

            .presentation-abort-button:hover {
                background: var(--danger-hover, #c82333);
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes scaleIn {
                from { 
                    opacity: 0;
                    transform: scale(0.9);
                }
                to { 
                    opacity: 1;
                    transform: scale(1);
                }
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

        `;
        
        document.head.appendChild(style);

        // Utility: Detect system dark mode
        window.isSystemDarkMode = function() {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        };
    }

}

// Export class and initialize global instance
window.presentationtab = presentationtab;
window.presentationtab = new presentationtab();
