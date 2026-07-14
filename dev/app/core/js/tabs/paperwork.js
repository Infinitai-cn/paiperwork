class Paperwork {
    constructor() {
        this.initialized = false;
        this.floatingWindow = null;
        this.documentContent = null;

        // Create UI helpers first
        this.uiHelpers = new UIHelpers(this);

        // Then create the other components with a reference to this instance
        this.templateDesign = new TemplateDesign(this);
        this.documentGenerator = new DocumentGenerator(this);

    }

    async initialize() {
        if (this.initialized) return;
       //console.log('Paperwork: Initializing paperwork manager');

        // Add global styles
        this.addPaperworkGlobalStyles();

        // Initialize components
        await this.templateDesign.initialize();
        await this.documentGenerator.initialize();

        this.initialized = true;
    }
    showDocumentTemplates() {
       //console.log('Paperwork: Showing document templates');
        if (window.paperworkTab) {
            window.paperworkTab.showPaperworkTab();
        } else {
            console.error('Paperwork: PaperworkTab instance not available');
        }
    }
    showFloatingWindow(title, content, buttons = []) {
        return this.uiHelpers.showFloatingWindow(title, content, buttons);
    }

    closeFloatingWindow() {
        this.uiHelpers.closeFloatingWindow();
    }

    showLoadingState(message) {
        this.uiHelpers.showLoadingState(message);
    }

    clearLoadingState() {
        this.uiHelpers.clearLoadingState();
    }

    async callAIService(systemPrompt, userPrompt) {
        return await this.uiHelpers.callAIService(systemPrompt, userPrompt);
    }
    addPaperworkGlobalStyles() {
        // Check if styles already exist
        if (document.getElementById('paperwork-global-styles')) return;

        const styleSheet = document.createElement('style');
        styleSheet.id = 'paperwork-global-styles';
        styleSheet.textContent = `
        
        .paperwork-floating-window-header {
            padding: 16px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
            background-color: var(--preview-header-bg); 
        }
        
        .paperwork-floating-window-title {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
        }
        
        .paperwork-floating-window-close {
            background: transparent;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 5px;
            border-radius: 6px;
            transition: background-color 0.2s;
        }
        
        .paperwork-floating-window-close:hover {
            background-color: var(--hover-bg);
            color: var(--text-color);
        }
        
        .paperwork-floating-window {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 80%;
            max-width: 900px;
            max-height: 85vh;
            background-color: var(--bg-color);
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid var(--border-color);
            color: var(--text-color);
        }
        
        /* Critical fix for maximized windows */
        .paperwork-floating-window[data-maximized="true"] {
            position: fixed !important;
            top: 2vh !important;
            left: 2vw !important;
            width: 96vw !important;
            height: 96vh !important;
            max-width: none !important;
            max-height: none !important;
            transform: none !important;
        }
        
        .paperwork-document-preview {
            background-color: var(--bg-color);
            padding: 15px;
            border-radius: 6px;
            border: 1px solid var(--border-color);
        }
        
        .paperwork-form {
            background-color: var(--bg-color);
            border-radius: 6px;
        }
        .paperwork-floating-window-footer {
            padding: 16px 20px;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            border-top: 1px solid var(--border-color);
            background-color: var(--bg-color);
        }
        
        .paperwork-btn {
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
            border: 1px solid transparent;
        }
        
        .paperwork-btn-primary {
            background-color: var(--primary-color, #4f46e5);
            color: white;
            border-color: var(--primary-color, #4f46e5);
        }
        
        .paperwork-btn-primary:hover {
            background-color: var(--primary-color-dark, #3730a3);
            border-color: var(--primary-color-dark, #3730a3);
        }
        
        .paperwork-btn-secondary {
            background-color: transparent;
            color: var(--text-color);
            border-color: var(--border-color);
        }
        
        .paperwork-btn-secondary:hover {
            background-color: var(--hover-bg);
        }
        
        .paperwork-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--modal-backdrop, rgba(0, 0, 0, 0.6));
            z-index: 999;
            backdrop-filter: blur(2px);
        }
        
        /* Document template styling */
        .paperwork-template-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .paperwork-template-item {
            background-color: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 15px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            text-align: center;
        }
        
        .paperwork-template-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            background-color: var(--preview-button-hover) !important;
        }
        
        .paperwork-template-icon {
            font-size: 24px;
            margin-bottom: 10px;
            color: var(--primary-color, #4f46e5);
        }
        
        .paperwork-template-title {
            font-weight: 600;
            margin-bottom: 5px;
            font-size: 14px;
        }
        
        /* Document editor styling */
        .paperwork-document-editor {
            background-color: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            min-height: 400px;
        }
        
        .paperwork-form-group {
            margin-bottom: 20px;
        }
        
        .paperwork-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--text-color);
        }

        .paperwork-floating-window-content {
            padding: 20px;
            overflow-y: auto;
            overflow-x: hidden;
            flex: 1;
            background-color: var(--bg-color);
            max-width: 100%;
        }

        .paperwork-input, .paperwork-textarea, .paperwork-select {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            padding: 10px 12px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background-color: var(--bg-color);
            color: var(--text-color);
            font-size: 14px;
            transition: border-color 0.2s;
            opacity: 1;
        }
        
        .paperwork-input:focus, .paperwork-textarea:focus, .paperwork-select:focus {
            border-color: var(--primary-color, #4f46e5);
            outline: none;
        }
        
        .paperwork-textarea {
            min-height: 120px;
            resize: vertical;
        }
    `;

        document.head.appendChild(styleSheet);
    }

    handleEscapeKey = (event) => {
        if (event.key === 'Escape') {
            this.closeFloatingWindow();
        }
    }
}

class UIHelpers {
    constructor(paperworkInstance) {
        this.paperwork = paperworkInstance;
        // Define A4 dimensions in pixels (at 96 DPI)
        this.A4_WIDTH_PX = 794;  // 210mm
        this.A4_HEIGHT_PX = 1123; // 297mm
        this.PAGE_MARGINS = {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50
        };
        // Track pages
        this.pages = [[]]; // Start with one empty page
        this.currentPage = 0;
    }

    async showDocumentEditor(templateType) {
        if (templateType === 'reporting') {
           //console.log('Technical Report selected: Skipping editor form and going directly to template designer');
            // We're already in the intermediate window at this point, so close it first
            this.closeFloatingWindow();

            // After a small delay, show the template designer
            setTimeout(() => {
                this.showTemplateDesigner();
            }, 300);

            // Important: Return early to avoid executing the rest of this method
            return;
        }

        let title, formFields;

        try {
            switch (templateType) {
                case 'business-letter':
                    title = Lang.get('paperworkBusinessLetterTitle');
                    formFields = this.getBusinessLetterFields();
                    break;

                case 'contract':
                    title = Lang.get('paperworkContractTitle');
                    formFields = this.getContractFields();
                    break;
                case 'proposal':  // Add specific case for proposal
                    title = Lang.get('paperworkProposalTitle');
                    formFields = this.getProposalFields();
                    break;

                case 'memo':
                    title = Lang.get('paperworkMemoTitle');
                    formFields = this.getMemoFields();
                    break;
                case 'meeting-minutes':
                    title = Lang.get('paperworkMeetingMinutesTitle');
                    formFields = this.getMeetingMinutesFields();
                    break;
                default:
                    title = Lang.get('paperworkDocumentEditorTitle');
                    formFields = this.getGenericDocumentFields();
            }
            const formContent = `
            <div class="paperwork-form" style="max-width: 100%; overflow-x: hidden;">
                ${formFields}
            </div>
        `;
            this.showFloatingWindow(
                title,
                `<div style="max-width: 100%; overflow-x: hidden;">${formContent}</div>`,
                [
                    {
                        text: Lang.get('paperworkNewButton'),
                        type: 'secondary',
                        position: 'left',
                        action: () => this.paperwork.documentGenerator.clearDocumentFields(templateType)
                    },
                    {
                        text: Lang.get('paperworkGenerateDocumentButton'),
                        type: 'primary',
                        action: () => this.generateDocument(templateType)
                    },
                    {
                        text: Lang.get('paperworkCancelButton'),
                        type: 'secondary',
                        action: () => this.closeFloatingWindow()
                    }
                ]
            );

            // Load saved data after the form is created
            setTimeout(() => {
                this.loadLetterData(templateType);
            }, 100);
        } catch (error) {
            console.error('Error in showDocumentEditor:', error);
            alert(Lang.get('paperworkErrorOccurred'));
        }
    }

    async callAIService(systemPrompt, userPrompt) {
        try {
           //console.log('Calling Ollama API with system prompt:', systemPrompt);
           //console.log('And user prompt:', userPrompt);

            // Get the selected model from the chat tab model selector
            const modelSelector = document.getElementById('model-selector');

            // Check if we have a valid model selection
            if (!modelSelector || !modelSelector.value || modelSelector.value === "Select a model...") {
                alert(Lang.get('paperworkAIServiceFailed'));
                throw new Error("No AI model selected");
            }

            const selectedModel = modelSelector.value;
           //console.log(`Using AI model: ${selectedModel}`);
            let routing = await OllamaAPI.getApiRoutingForModel(selectedModel);

            // Keep cloud behavior consistent with Chat: ensure a key exists before direct cloud calls.
            if (routing && routing.source === 'cloud') {
                const ensureCloudKey = window.chatTab && typeof window.chatTab.ensureCloudApiKeyForSend === 'function'
                    ? window.chatTab.ensureCloudApiKeyForSend.bind(window.chatTab)
                    : null;

                if (ensureCloudKey) {
                    const hasCloudKey = await ensureCloudKey();
                    if (!hasCloudKey) {
                        throw new Error('Cloud API key required');
                    }
                    // Refresh routing so headers include the newly-saved key.
                    routing = await OllamaAPI.getApiRoutingForModel(selectedModel);
                }
            }

            const requestOptions = {
                temperature: 0.7,
                num_ctx: 8192
            };

            const response = await fetch(`${routing.baseUrl}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...routing.headers
                },
                body: JSON.stringify({
                    model: routing.modelName || selectedModel,
                    system: systemPrompt,
                    prompt: userPrompt,
                    stream: false,
                    options: requestOptions
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();

                // Detect Ollama Cloud response truncation (unexpected EOF).
                // The AI generated content but the connection was closed mid-transfer.
                // Don't show a misleading "failed to connect" modal for this.
                let isTruncated = false;
                try {
                    const errJson = JSON.parse(errorText);
                    if (errJson.error === 'CLOUD_RESPONSE_TRUNCATED') {
                        isTruncated = true;
                    }
                } catch (_) { /* not JSON, ignore */ }

                if (isTruncated) {
                    throw new Error('CLOUD_RESPONSE_TRUNCATED');
                }

                if (response.status === 429) {
                    throw new Error(`${(window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.'}${errorText ? `\n${errorText}` : ''}`);
                }
                throw new Error(`Ollama API error: ${response.status}`);
            }

            const data = await response.json();

            // Get the AI response
            let aiResponse = data?.response || data?.message?.content || '';

            // Remove any thinking/reasoning blocks
            aiResponse = this.removeAIThinkingBlocks(aiResponse);

            return aiResponse;
        } catch (error) {
            this.clearLoadingState(); // Make sure we clear any loading state
            console.error('Error calling Ollama API:', error);

            // If it's specifically about not having a model selected, we've already shown an alert
            if (error.message === "No AI model selected") {
                return "AI model not selected";
            }

            // For other errors
            if (String(error?.message || '').toLowerCase().includes('429') || String(error?.message || '').toLowerCase().includes('too many requests') || String(error?.message || '').toLowerCase().includes('weekly usage') || String(error?.message || '').toLowerCase().includes('daily limit')) {
                alert((window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.');
            } else if (error?.message === 'CLOUD_RESPONSE_TRUNCATED') {
                // Ollama Cloud closed the connection mid-response — the AI generated
                // content but it was too large for the transfer. Don't show a misleading
                // "failed to connect" modal; return gracefully so the user isn't blocked.
                console.warn('Ollama Cloud response was truncated (unexpected EOF). The AI generated content but it could not be fully transferred.');
                return `AI response was truncated during transfer. Please try again with a smaller request or a different model.`;
            } else {
                alert(Lang.get('paperworkAIServiceFailed'));
            }
            return `AI failed to reply`;
        }
    }
    removeAIThinkingBlocks(text) {
        if (!text) return text;

        // Define the thinking tag patterns
        const thinkingPatterns = [
            /<think>[\s\S]*?<\/think>/gi,
            /<thinking>[\s\S]*?<\/thinking>/gi,
            /<reflection>[\s\S]*?<\/reflection>/gi,
            /<reasoning>[\s\S]*?<\/reasoning>/gi,
            /<cot>[\s\S]*?<\/cot>/gi
        ];

        // Apply each pattern to remove thinking blocks
        let cleanedText = text;
        thinkingPatterns.forEach(pattern => {
            cleanedText = cleanedText.replace(pattern, '');
        });

        // Clean up any additional whitespace that might be left
        cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n').trim();

        return cleanedText;
    }
    async showTemplateDesigner() {
        if (!this.paperwork.templateDesign) {
           //console.log('Initializing TemplateDesign instance for Paperwork');
            this.paperwork.templateDesign = new TemplateDesign(this.paperwork);
            await this.paperwork.templateDesign.initialize(this.paperwork);
        }

        let templateData = {
            name: '',
            sections: []
        };

        // Calculate dimensions for a proper A4 size with good proportions
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // For a true size representation
        const A4_WIDTH_PX = 794;  // 210mm at 96 DPI
        const A4_HEIGHT_PX = 1123; // 297mm at 96 DPI

        // Set a larger modal width to accommodate the true-size A4
        const modalWidth = Math.min(1200, viewportWidth * 0.98);

        const heightRatio = (viewportHeight * 0.85) / A4_HEIGHT_PX;
        const widthRatio = (modalWidth * 0.7) / A4_WIDTH_PX;
        // Set to 1 (real size) if we have enough space, otherwise scale down
        const scaleFactor = 1.0; // Force true size (don't scale down)

        // Scale A4 dimensions while maintaining aspect ratio
        const finalCanvasWidth = A4_WIDTH_PX * scaleFactor;
        const finalCanvasHeight = A4_HEIGHT_PX * scaleFactor;

        // Calculate properties panel width
        const presetPanelWidth = Math.min(350, modalWidth * 0.25);
        // Template for the UI with presets on the right side
        const content = `
        <div class="visual-template-designer">
            <div class="paperwork-form-group">
                <label class="paperwork-label">${Lang.get('paperworkReportNameLabel')}</label>
               <input type="text" class="paperwork-input" id="template-name" value="${templateData.name}" placeholder="${Lang.get('paperworkTemplateNamePlaceholder')}">
            </div>
            
           <div class="template-design-container" style="display: flex; flex-direction: row; gap: 20px; margin-top: 20px; overflow: auto;">
                <!-- A4 Canvas in the center -->
                <div class="template-canvas-container" style="flex: none; width: ${A4_WIDTH_PX}px; position: relative; margin: 0 auto; overflow: auto;">
                    <div class="canvas-corner-label" style="position: absolute; top: -20px; left: 0; font-size: 12px; color: #666;">
                    ${Lang.get('paperworkA4DocumentLabel', { percent: Math.round(scaleFactor * 100), scaleNote: scaleFactor < 1 ? Lang.get('paperworkScaledToFit') : Lang.get('paperworkActualSize') })}
                    </div>
                    <div id="template-canvas" class="template-canvas" style="position: relative; width: 100%; height: ${finalCanvasHeight}px; border: 2px dashed var(--border-color); border-radius: 4px; overflow: auto; background-color: white; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
                        <!-- Canvas content will be generated here -->
                        <div id="canvas-placeholder" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #aaa; text-align: center;">
                            <p>${Lang.get('paperworkCanvasPlaceholder')}</p>
                        </div>
                        <div id="template-sections-container">
                            <!-- Template sections will be rendered here -->
                        </div>
                    </div>
                </div>
                
                <!-- Preset Components Panel - Now on the right -->
                <div class="template-presets" style="width: ${presetPanelWidth}px; border: 1px solid var(--border-color); border-radius: 6px; padding: 15px; background-color: var(--bg-color); overflow: auto; max-height: ${finalCanvasHeight}px;">
                    <h4 style="margin-top: 0; margin-bottom: 15px;">${Lang.get('paperworkDesignPresetsTitle')}</h4>
                    
                    <!-- Document Header -->
                    <div class="preset-item" data-type="document-header" style="margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 4px; background-color: var(--bg-color); cursor: pointer; overflow: hidden;">
                        <div style="padding: 10px; border-bottom: 1px solid var(--border-color); font-weight: 500;">${Lang.get('paperworkDocumentHeaderPreset')}</div>
                        <div style="padding: 10px;">
                            <div style="height: 18px; background-color: #e0e0e0; margin-bottom: 8px; border-radius: 3px;"></div>
                            <div style="height: 10px; background-color: #e0e0e0; width: 60%; border-radius: 3px;"></div>
                        </div>
                    </div>
                    
                    <!-- Section Header -->
                    <div class="preset-item" data-type="section-header" style="margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 4px; background-color: var(--bg-color); cursor: pointer; overflow: hidden;">
                        <div style="padding: 10px; border-bottom: 1px solid var(--border-color); font-weight: 500;">${Lang.get('paperworkSectionHeaderPreset')}</div>
                        <div style="padding: 10px;">
                            <div style="height: 14px; background-color: #e0e0e0; margin-bottom: 5px; border-radius: 3px;"></div>
                            <div style="height: 1px; background-color: #e0e0e0; margin-top: 5px;"></div>
                        </div>
                    </div>

                    <!-- Text Area -->
                    <div class="preset-item" data-type="text-area" style="margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 4px; background-color: var(--bg-color); cursor: pointer; overflow: hidden;">
                        <div style="padding: 10px; border-bottom: 1px solid var(--border-color); font-weight: 500;">${Lang.get('paperworkTextAreaPreset')}</div>
                        <div style="padding: 10px;">
                            <div style="height: 10px; background-color: #e0e0e0; width: 60%; margin-bottom: 5px; border-radius: 3px;"></div>
                            <div style="height: 60px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px;"></div>
                        </div>
                    </div>
                    
                    <!-- Text + Image (Side by Side) -->
                    <div class="preset-item" data-type="text-image-right" style="margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 4px; background-color: var(--bg-color); cursor: pointer; overflow: hidden;">
                        <div style="padding: 10px; border-bottom: 1px solid var(--border-color); font-weight: 500;">${Lang.get('paperworkTextImageRightPreset')}</div>                        <div style="padding: 10px;">
                            <div style="height: 10px; background-color: #e0e0e0; width: 60%; margin-bottom: 5px; border-radius: 3px;"></div>
                            <div style="display: flex; gap: 5px;">
                                <div style="flex: 2; height: 40px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px;"></div>
                                <div style="flex: 1; height: 40px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; display: flex; align-items: center; justify-content: center;">
                                    <div style="font-size: 12px; color: #999;">🖼️</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Image + Text (Side by Side) -->
                    <div class="preset-item" data-type="image-text-right" style="margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 4px; background-color: var(--bg-color); cursor: pointer; overflow: hidden;">
                        <div style="padding: 10px; border-bottom: 1px solid var(--border-color); font-weight: 500;">${Lang.get('paperworkImageTextRightPreset')}</div>                        <div style="padding: 10px;">
                            <div style="height: 10px; background-color: #e0e0e0; width: 60%; margin-bottom: 5px; border-radius: 3px;"></div>
                            <div style="display: flex; gap: 5px;">
                                <div style="flex: 1; height: 40px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; display: flex; align-items: center; justify-content: center;">
                                    <div style="font-size: 12px; color: #999;">🖼️</div>
                                </div>
                                <div style="flex: 2; height: 40px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px;"></div>
                            </div>
                        </div>
                    </div>
                                        <!-- Picture Gallery (4 images) -->
                    <div class="preset-item" data-type="picture-gallery" style="margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 4px; background-color: var(--bg-color); cursor: pointer; overflow: hidden;">
                        <div style="padding: 10px; border-bottom: 1px solid var(--border-color); font-weight: 500;">${Lang.get('paperworkPictureGalleryPreset')}</div>                        <div style="padding: 10px;">
                            <div style="height: 10px; background-color: #e0e0e0; width: 60%; margin-bottom: 5px; border-radius: 3px;"></div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                                <div style="height: 30px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; display: flex; align-items: center; justify-content: center;">
                                    <div style="font-size: 12px; color: #999;">🖼️</div>
                                </div>
                                <div style="height: 30px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; display: flex; align-items: center; justify-content: center;">
                                    <div style="font-size: 12px; color: #999;">🖼️</div>
                                </div>
                                <div style="height: 30px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; display: flex; align-items: center; justify-content: center;">
                                    <div style="font-size: 12px; color: #999;">🖼️</div>
                                </div>
                                <div style="height: 30px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; display: flex; align-items: center; justify-content: center;">
                                    <div style="font-size: 12px; color: #999;">🖼️</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Picture Row (1x4 images) -->
                    <div class="preset-item" data-type="picture-row" style="margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 4px; background-color: var(--bg-color); cursor: pointer; overflow: hidden;">
                        <div style="padding: 10px; border-bottom: 1px solid var(--border-color); font-weight: 500;">${Lang.get('paperworkPictureRowPreset')}</div>    <div style="padding: 10px;">
                            <div style="height: 10px; background-color: #e0e0e0; width: 60%; margin-bottom: 5px; border-radius: 3px;"></div>
                            <div style="display: flex; gap: 5px;">
                                <div style="flex: 1; height: 30px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; display: flex; align-items: center; justify-content: center;">
                                    <div style="font-size: 12px; color: #999;">🖼️</div>
                                </div>
                                <div style="flex: 1; height: 30px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; display: flex; align-items: center; justify-content: center;">
                                    <div style="font-size: 12px; color: #999;">🖼️</div>
                                </div>
                                <div style="flex: 1; height: 30px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; display: flex; align-items: center; justify-content: center;">
                                    <div style="font-size: 12px; color: #999;">🖼️</div>
                                </div>
                                <div style="flex: 1; height: 30px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 3px; display: flex; align-items: center; justify-content: center;">
                                    <div style="font-size: 12px; color: #999;">🖼️</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Divider -->
                    <div class="preset-item" data-type="divider" style="margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 4px; background-color: var(--bg-color); cursor: pointer; overflow: hidden;">
                        <div style="padding: 10px; border-bottom: 1px solid var(--border-color); font-weight: 500;">${Lang.get('paperworkDividerPreset')}</div>                        <div style="padding: 10px;">
                            <div style="height: 10px; display: flex; align-items: center;">
                                <div style="height: 1px; background-color: #e0e0e0; width: 100%;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="preset-item" data-type="empty-space" style="margin-bottom: 15px; border: 1px solid var(--border-color); border-radius: 4px; background-color: var(--bg-color); cursor: pointer; overflow: hidden;" title="Empty Space">
                        <div style="padding: 10px; border-bottom: 1px solid var(--border-color); font-weight: 500;">${Lang.get('paperworkEmptySpacePreset')}</div>    <div style="padding: 10px;">
                            <div style="height: 40px; background-color: #f5f5f5; border: 1px dashed #ddd; border-radius: 3px; display: flex; align-items: center; justify-content: center;">
                                <div style="font-size: 12px; color: #999;">${Lang.get('paperworkEmptySpace')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;


        // After showing the window, set custom styles
        setTimeout(() => {

            // Add this to your fixedMaximizedStyles variable

            const fixedMaximizedStyles = `
            /* Critical maximized window fixes */
            .floating-window[data-maximized="true"] {
                position: fixed !important;
                top: 2% !important;
                left: 2% !important;
                width: 96% !important;
                height: 96% !important;
                transform: none !important;
                display: flex !important;
                flex-direction: column !important;
                max-width: none !important;
                max-height: none !important;
                transition: none !important;
            }
            
            /* Ensure content fills the maximized window */
            .floating-window[data-maximized="true"] .paperwork-floating-window-content {
                flex: 1 !important;
                height: auto !important;
                max-height: none !important;
                overflow: auto !important;
            }
            
            /* Critical - Always maintain row layout for the template design container */
            .template-design-container {
                display: flex !important;
                flex-direction: row !important;
                gap: 20px !important;
                margin-top: 20px !important;
                overflow: auto !important;
            }
            
            /* Better positioning for template canvas */
            .floating-window[data-maximized="true"] .template-canvas-container {
                max-height: calc(100vh - 180px) !important;
                flex: 1 !important;  /* Allow canvas to grow */
            }
            
            /* Keep sidebar at fixed width */
            .floating-window[data-maximized="true"] .template-presets {
                max-height: calc(100vh - 180px) !important;
                width: 350px !important; /* Fixed width for sidebar */
                flex: 0 0 350px !important; /* Don't allow sidebar to grow or shrink */
            }
            
            /* Force hardware acceleration for smoother transitions */
            .floating-window {
                transform: translate3d(0, 0, 0);
                will-change: transform, width, height;
                transition: all 0.2s ease-out;
            }
            `;

            // Add these styles to document head
            const maximizedFixStyles = document.createElement('style');
            maximizedFixStyles.textContent = fixedMaximizedStyles;
            document.head.appendChild(maximizedFixStyles);
            const positionFixStyles = document.createElement('style');
            positionFixStyles.textContent = `
                /* Specific rules to ensure centered positioning works properly */
                .paperwork-floating-window {
                    position: fixed !important;
                    transition: none !important; /* Disable transitions to prevent positioning issues */
                }
                
                .paperwork-floating-window:not([data-maximized="true"]) {
                    top: 50% !important;
                    left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                }
            `;
            document.head.appendChild(positionFixStyles);
            // Create all the action buttons
            const buttons = [
                {
                    text: Lang.get('paperworkFontSelectorButton'),
                    type: 'custom',
                    position: 'left',
                    order: 1,  // Explicitly set the order
                    element: this.paperwork.templateDesign.addFontSelector()
                },
                {
                    text: Lang.get('paperworkSaveTemplateButton'),
                    action: () => {
                        if (this.paperwork && this.paperwork.templateDesign) {
                            this.paperwork.templateDesign.saveTemplate();
                        } else {
                            console.error('Template design not initialized');
                        }
                    }
                },
                {
                    text: Lang.get('paperworkLoadTemplateButton'),
                    action: () => {
                        if (this.paperwork && this.paperwork.templateDesign) {
                            this.paperwork.templateDesign.loadTemplate();
                        } else {
                            console.error('Template design not initialized');
                        }
                    }
                },
                {
                    text: Lang.get('paperworkManageTemplatesButton'),
                    action: () => {
                        if (this.paperwork && this.paperwork.templateDesign) {
                            this.paperwork.templateDesign.manageTemplates();
                        } else {
                            console.error('Template design not initialized');
                        }
                    }
                },
                {
                    text: Lang.get('paperworkSavePDFButton'),
                    action: () => {
                        if (this.paperwork && this.paperwork.templateDesign) {
                            this.paperwork.templateDesign.savePDF();
                        } else {
                            console.error('Template design not initialized');
                        }
                    }
                }
            ];
            this.showFloatingWindow(
                Lang.get('paperworkCreateTechnicalReportTitle'),
                content,
                buttons
            );


            // Find the window header and control buttons
            if (this.floatingWindowElement) {
                const windowHeader = this.floatingWindowElement.querySelector('.paperwork-floating-window-header');
                const controlButtons = this.floatingWindowElement.querySelector('.paperwork-floating-window-header > div:last-child');



                // Add CSS for header buttons
                const style = document.createElement('style');
                style.textContent = `
                .header-action-btn {
                    font-size: 12px;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    background-color: var(--bg-color, #f5f5f5);
                    color: var(--text-color, #333);
                    border: 1px solid var(--border-color, #ddd);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 28px;
                    white-space: nowrap;
                    transition: background-color 0.2s;
                }
                
                .header-action-btn:hover {
                    background-color: #4f46e5;
                    color: white !important;
                    border-color: #4f46e5;
                }
    
                
                .header-action-btn.primary {
                    background-color: var(--primary-color, #4299e1);
                    color: white;
                    border: none;
                }
                
                .header-action-btn.primary:hover {
                    background-color: var(--primary-dark-color, #3182ce);
                }
                
                /* Make header larger to accommodate buttons */
                .paperwork-floating-window-header {
                    padding: 10px 15px !important;
                    height: auto !important;
                }
                
                /* Ensure buttons fit on smaller screens */
                @media (max-width: 1200px) {
                    .header-action-btn {
                        padding: 4px 6px;
                        font-size: 11px;
                    }
                }
                
                @media (max-width: 900px) {
                    .header-action-btn {
                        padding: 4px;
                        max-width: 60px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                }
                       .template-page {
                        position: relative;
                        width: 100%;
                        min-height: ${this.A4_HEIGHT_PX}px;
                        margin-bottom: 30px;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                        background-color: white;
                        padding: ${this.PAGE_MARGINS.top}px ${this.PAGE_MARGINS.right}px ${this.PAGE_MARGINS.bottom}px ${this.PAGE_MARGINS.left}px;
                        box-sizing: border-box;
                    }
                    
                    .page-break-indicator {
                        background-color: #f0f4f8;
                        color: #4a5568;
                        padding: 8px;
                        text-align: center;
                        font-weight: 500;
                        border-bottom: 1px dashed #cbd5e0;
                        font-size: 12px;
                        margin-bottom: 15px;
                    }
                    
                    .page-number {
                        position: absolute;
                        bottom: 5px;
                        right: 10px;
                        font-size: 12px;
                        color: #999;
                    }
                    
                    .empty-space-container {
                        position: relative;
                        cursor: row-resize;
                        transition: background-color 0.2s;
                    }
                    
                    .empty-space-container:hover {
                        background-color: #f0f0f0;
                    }
                    
                    .empty-space-container.resizing {
                        background-color: #e6f7ff;
                        border-color: #1890ff;
                    }
                    
                    .expand-to-page-btn {
                        background-color: #f0f4f8;
                        color: #4a5568;
                        border: 1px solid #cbd5e0;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 12px;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    }
                    
                    .expand-to-page-btn:hover {
                        background-color: #e2e8f0;
                    }
            `;
                document.head.appendChild(style);

                // Adjust the window content area to use the full height since we removed the footer
                const windowContent = this.floatingWindowElement.querySelector('.paperwork-floating-window-content');
                if (windowContent) {
                    windowContent.style.height = 'calc(100% - 48px)';  // 48px is the typical header height
                    windowContent.style.overflowY = 'auto';
                }

                // Update maximize button functionality to adjust with new layout
                const maximizeBtn = this.floatingWindowElement.querySelector('.maximize-window-btn');
                if (maximizeBtn) {
                    maximizeBtn.addEventListener('click', () => {
                        const isMaximized = maximizeBtn.getAttribute('data-maximized') === 'true';

                        if (!isMaximized) {
                            // We're maximizing - adjust header buttons for more space
                            document.querySelectorAll('.header-action-btn').forEach(btn => {
                                btn.style.padding = '4px 8px';
                                btn.style.maxWidth = '120px';
                            });
                        } else {
                            // We're restoring - reset modal width to what it was
                            setTimeout(() => {
                                // Only proceed if the floating window exists
                                if (this.floatingWindowElement) {
                                    const fontSelectorPlaceholder = this.floatingWindowElement.querySelector('#font-selector-placeholder');
                                    if (fontSelectorPlaceholder) {
                                        const fontSelector = this.paperwork.templateDesign.addFontSelector();
                                        fontSelectorPlaceholder.appendChild(fontSelector);
                                    }
                                    this.floatingWindowElement.style.width = `${modalWidth}px`;

                                    // Reset button styles based on screen size
                                    const screenWidth = window.innerWidth;
                                    document.querySelectorAll('.header-action-btn').forEach(btn => {
                                        if (screenWidth <= 900) {
                                            btn.style.padding = '4px';
                                            btn.style.maxWidth = '60px';
                                        } else if (screenWidth <= 1200) {
                                            btn.style.padding = '4px 6px';
                                            btn.style.maxWidth = '100px';
                                        } else {
                                            btn.style.padding = '4px 8px';
                                            btn.style.maxWidth = '120px';
                                        }
                                    });
                                }
                            }, 10);
                        }
                    });
                }

                // Adjust window dimensions
                this.floatingWindowElement.style.width = `${modalWidth}px`;
                this.floatingWindowElement.style.maxWidth = '95%';
                this.floatingWindowElement.style.maxHeight = '90vh';

                const contentElement = this.floatingWindowElement.querySelector('.paperwork-floating-window-content');
                if (contentElement) {
                    contentElement.style.overflow = 'auto';
                }
            }

            // Add styling for presets
            if (!document.getElementById('template-designer-styles')) {
                const style = document.createElement('style');
                style.id = 'template-designer-styles';
                style.textContent = `
                .preset-item {
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .preset-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .template-section {
                    border: 1px solid #ddd;
                    margin-bottom: 10px;
                    background-color: white;
                    border-radius: 4px;
                    position: relative;
                }
                .section-controls {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    display: flex;
                    gap: 5px;
                    z-index: 5;
                }
                .section-control-btn {
                    width: 24px;
                    height: 24px;
                    border-radius: 3px;
                    border: none;
                    background-color: rgba(255, 255, 255, 0.8);
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    color: #666;
                }
            .template-canvas {
                /* Ensure white background for A4 area */
                background-color: white !important;
            }
            
            .template-section {
                /* Ensure proper contrast for section content */
                color: #333 !important;
            }
            
            /* Better contrast for editable areas */
            .editable-content {
                color: #333 !important;
            }
            
            /* Make section controls more visible */
            .section-controls {
                background-color: rgba(255, 255, 255, 0.8);
                padding: 2px;
                border-radius: 4px;
            }
            
            /* Enhance visibility of AI button text */
            .ai-enhance-btn {
                font-weight: 500;
            }
            
            /* Style adjustments for editing sections */
            .section-edit-dialog {
                color: #333;
            }
            
            .dialog-field {
                margin-bottom: 15px;
            }
            
            .dialog-field label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
            }
            
            .dialog-field input[type="text"],
            .dialog-field input[type="number"],
            .dialog-field select {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .section-control-btn:hover {
                background-color: white;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
            }
            .move-up-btn { color: #2196F3; }
            .move-down-btn { color: #2196F3; }
            .edit-section-btn { color: #4CAF50; }
            .delete-section-btn { color: #F44336; }
            
            /* Enhanced A4 appearance */
            .template-canvas {
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                background-color: white;
            }
            
            /* Add a subtle paper texture */
            .template-canvas::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMjHxIGmVAAAAVklEQVRoQ+3SMREAQAgDQUAg/x5YwIIX2glM850Nl0A6kZ0I0ol04q92ItaJWCdidbxY4IjVSR6xRnlEGqUT6UQ6kU6kE+lERBKRRCQRSUQSkURkGzkB2WXGCbKNDBMAAAAASUVORK5CYII=');
                opacity: 0.03;
                pointer-events: none;
            }
                 .editable-content {
                outline: none;
                transition: background-color 0.2s;
            }
    
            .editable-content:hover {
                background-color: #f0f8ff !important;
            }
            
            .editable-content:focus {
                background-color: #e6f3ff !important;
                box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.5);
            }
            
            .editing-controls {
                display: flex;
                gap: 8px;
                margin-top: 8px;
            }
            
            .ai-enhance-btn {
                background-color: #4299e1;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .ai-enhance-btn:hover {
                background-color: #3182ce;
            }
    
            .undo-edit-btn {
                background-color: #e2e8f0;
                color: #4a5568;
                border: 1px solid #cbd5e0;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
                
            .undo-edit-btn:hover {
                background-color: #cbd5e0;
            }
                    .placeholder-text {
                        font-style: italic;
                        color: #666 !important;
                    }
                    
                    .editable-content:empty:not(:focus)::before {
                        content: "${Lang.get('paperworkClickToEdit')}";
                        font-style: italic;
                        color: #aaa;
                    }
                        /* Improve text area appearance */
            .editable-content[data-field="placeholder"] {
                min-height: 80px !important; 
                padding: 15px !important;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                font-size: 14px;
                line-height: 1.5;
                transition: all 0.2s ease;
            }
            
            .editable-content[data-field="placeholder"]:focus {
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.1), 0 0 0 2px rgba(66, 153, 225, 0.5) !important;
                outline: none !important;
            }
            
            /* Improve overall editable content readability */
            .editable-content {
                word-wrap: break-word;
                overflow-wrap: break-word;
                hyphens: auto;
            }
            
            /* Add style for placeholder text in text areas that's more distinctive */
            .editable-content[data-field="placeholder"].placeholder-text {
                color: #888 !important;
                font-style: italic;
            }
            
            /* Fix Firefox contenteditable cursor not showing */
            .editable-content[contenteditable=true]:empty {
                min-height: 20px;
            }
                                /* Maximize mode adjustments */
            .floating-window[data-maximized="true"] .template-content {
                display: flex;
                gap: 20px;
                height: calc(100% - 100px);
            }
            
            .floating-window[data-maximized="true"] .template-sidebar {
                flex: 0 0 250px;
                overflow-y: auto;
                padding-right: 10px;
            }
            
            .floating-window[data-maximized="true"] .template-canvas-container {
                flex: 1;
                overflow: auto;
                padding: 20px;
            }
            
            .floating-window[data-maximized="true"] .preset-categories {
                display: flex;
                flex-direction: column;
                gap: 0;
            }
            
            /* Improve scrolling in maximized mode */
            .template-canvas-container::-webkit-scrollbar,
            .template-sidebar::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            
            .template-canvas-container::-webkit-scrollbar-thumb,
            .template-sidebar::-webkit-scrollbar-thumb {
                background: #ccc;
                border-radius: 4px;
            }
            
            .template-canvas-container::-webkit-scrollbar-thumb:hover,
            .template-sidebar::-webkit-scrollbar-thumb:hover {
                background: #aaa;
            }
            
            /* Make report preview look better in maximized mode */
            .floating-window[data-maximized="true"] .document-preview {
                display: flex;
                height: calc(100% - 50px);
            }
            
            .floating-window[data-maximized="true"] .document-content {
                flex: 1;
                overflow: auto;
                padding: 40px;
                background: white;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
                margin: 20px;
            }
            
            .floating-window[data-maximized="true"] .document-actions {
                width: 200px;
                padding: 20px;
            }
        `;
                document.head.appendChild(style);
            }

            // Initialize the template sections container
            const sectionsContainer = document.getElementById('template-sections-container');
            sectionsContainer.setAttribute('data-sections', JSON.stringify(templateData.sections || []));

            // Set up click handlers for presets
            document.querySelectorAll('.preset-item').forEach(item => {
                item.addEventListener('click', () => {
                    const presetType = item.getAttribute('data-type');
                    this.addSectionFromPreset(presetType);
                });
            });

            // Render existing sections if editing a template
            if (templateData.sections && templateData.sections.length > 0) {
                this.renderTemplateSections(templateData.sections);
            }
        }, 100);
        setTimeout(async () => {
            let savedFont = 'Arial';
            try {
                const got = await PaiperworkDB.secureLocalStorageGet('pdf-font-preference');
                if (got) savedFont = got;
            } catch (e) {
                try { savedFont = localStorage.getItem('pdf-font-preference') || 'Arial'; } catch (err) { savedFont = 'Arial'; }
            }

            // Call through the paperwork.templateDesign instance if it exists
            if (this.paperwork && this.paperwork.templateDesign &&
                typeof this.paperwork.templateDesign.updateReportEditorFont === 'function') {
                this.paperwork.templateDesign.updateReportEditorFont(savedFont);
            } else {
                console.error('templateDesign.updateReportEditorFont is not available');
            }
    }, 300);
    }
    showFloatingWindow(title, content, buttons = []) {
        // Remove any existing floating window
        this.closeFloatingWindow();

        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'paperwork-backdrop';
        document.body.appendChild(backdrop);

        // Create floating window
        const floatingWindow = document.createElement('div');
        floatingWindow.className = 'paperwork-floating-window floating-window';
        floatingWindow.style.transition = 'all 0.3s ease-in-out';

        // Create custom header
        const windowHeader = document.createElement('div');
        windowHeader.className = 'paperwork-floating-window-header';
        windowHeader.style.display = 'flex';
        windowHeader.style.justifyContent = 'space-between';
        windowHeader.style.alignItems = 'center';
        windowHeader.style.borderBottom = '1px solid #ddd';
        windowHeader.style.padding = '10px 15px';

        const titleElement = document.createElement('h3');
        titleElement.className = 'paperwork-floating-window-title';
        titleElement.style.margin = '0';
        titleElement.style.fontSize = '18px';
        titleElement.style.fontWeight = '500';
        titleElement.textContent = title;

        const controlButtons = document.createElement('div');
        controlButtons.style.display = 'flex';
        controlButtons.style.gap = '10px';

        // Add maximize button
        const maximizeBtn = document.createElement('button');
        maximizeBtn.className = 'maximize-window-btn';
        maximizeBtn.innerHTML = '&#x26F6;'; // Unicode for maximize icon
        maximizeBtn.title = Lang.get('paperworkMaximizeTooltip');
        maximizeBtn.style.background = 'none';
        maximizeBtn.style.border = 'none';
        maximizeBtn.style.fontSize = '16px';
        maximizeBtn.style.cursor = 'pointer';
        maximizeBtn.style.color = '#666';
        maximizeBtn.style.padding = '0';
        maximizeBtn.setAttribute('data-maximized', 'false');

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-window-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.color = '#666';
        closeBtn.style.padding = '0';

        // Add buttons to controls
        controlButtons.appendChild(maximizeBtn);
        controlButtons.appendChild(closeBtn);

        // Build header
        windowHeader.appendChild(titleElement);
        windowHeader.appendChild(controlButtons);

        // Add completed header to window
        floatingWindow.appendChild(windowHeader);

        // Create content
        const windowContent = document.createElement('div');
        windowContent.className = 'paperwork-floating-window-content';
        windowContent.innerHTML = content;
        floatingWindow.appendChild(windowContent);

        // Create footer with buttons
        if (buttons.length > 0) {
            const footer = document.createElement('div');
            footer.className = 'paperwork-floating-window-footer';
            footer.style.display = 'flex';
            footer.style.justifyContent = 'space-between';
            footer.style.alignItems = 'center';

            // Create left and right button containers
            const leftBtnContainer = document.createElement('div');
            leftBtnContainer.style.display = 'flex';
            leftBtnContainer.style.gap = '12px';
            leftBtnContainer.style.flexWrap = 'wrap';
            leftBtnContainer.style.alignItems = 'center';

            const rightBtnContainer = document.createElement('div');
            rightBtnContainer.style.display = 'flex';
            rightBtnContainer.style.gap = '12px';
            rightBtnContainer.style.alignItems = 'center';

            // Sort buttons by order property (if present)
            const leftButtons = buttons.filter(btn => btn.position === 'left')
                .sort((a, b) => (a.order || 99) - (b.order || 99));

            const rightButtons = buttons.filter(btn => btn.position !== 'left')
                .sort((a, b) => (a.order || 99) - (b.order || 99));

            // Add left buttons in sorted order
            leftButtons.forEach(button => {
                if (button.type === 'custom' && button.element) {
                    leftBtnContainer.appendChild(button.element);
                } else {
                    // Create regular button...
                    const btn = document.createElement('button');
                    btn.textContent = button.text;

                    // Apply theme-aware styling
                    if (button.type === 'primary') {
                        btn.className = 'paperwork-btn paperwork-btn-primary';
                        btn.style.cssText = 'padding: 8px 16px; background-color: var(--accent-color, #4f46e5); color: var(--accent-text, white); border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.2s;';
                    } else if (button.type === 'danger') {
                        btn.className = 'paperwork-btn paperwork-btn-danger';
                        btn.style.cssText = 'padding: 8px 16px; background-color: var(--danger-color, #dc3545); color: white; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.2s;';
                    } else {
                        btn.className = 'paperwork-btn paperwork-btn-secondary';
                        btn.style.cssText = 'padding: 8px 16px; background-color: var(--button-bg, #f5f5f5); color: var(--button-text, #333); border: 1px solid var(--border-color, #ddd); border-radius: 4px; cursor: pointer; transition: all 0.2s;';
                    }

                    // Add hover effect
                    btn.addEventListener('mouseenter', () => {
                        if (button.type === 'primary') {
                            btn.style.backgroundColor = 'var(--accent-color-hover, #3730a3)';
                        } else if (button.type === 'danger') {
                            btn.style.backgroundColor = 'var(--danger-color-hover, #c82333)';
                        } else {
                            btn.style.backgroundColor = 'var(--preview-button-hover, #e2e8f0)';
                        }
                    });

                    btn.addEventListener('mouseleave', () => {
                        if (button.type === 'primary') {
                            btn.style.backgroundColor = 'var(--accent-color, #4f46e5)';
                        } else if (button.type === 'danger') {
                            btn.style.backgroundColor = 'var(--danger-color, #dc3545)';
                        } else {
                            btn.style.backgroundColor = 'var(--button-bg, #f5f5f5)';
                        }
                    });

                    // Add click event
                    if (typeof button.action === 'function') {
                        btn.addEventListener('click', button.action);
                    }

                    leftBtnContainer.appendChild(btn);
                }
            });

            // Apply the same pattern to right buttons
            rightButtons.forEach(button => {
                if (button.type === 'custom' && button.element) {
                    rightBtnContainer.appendChild(button.element);
                } else {
                    const btn = document.createElement('button');
                    btn.textContent = button.text;

                    // Apply theme-aware styling
                    if (button.type === 'primary') {
                        btn.className = 'paperwork-btn paperwork-btn-primary';
                        btn.style.cssText = 'padding: 8px 16px; background-color: var(--accent-color, #4f46e5); color: var(--accent-text, white); border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.2s;';
                    } else if (button.type === 'danger') {
                        btn.className = 'paperwork-btn paperwork-btn-danger';
                        btn.style.cssText = 'padding: 8px 16px; background-color: var(--danger-color, #dc3545); color: white; border: none; border-radius: 4px; cursor: pointer; transition: background-color 0.2s;';
                    } else {
                        btn.className = 'paperwork-btn paperwork-btn-secondary';
                        btn.style.cssText = 'padding: 8px 16px; background-color: var(--button-bg, #f5f5f5); color: var(--button-text, #333); border: 1px solid var(--border-color, #ddd); border-radius: 4px; cursor: pointer; transition: all 0.2s;';
                    }

                    // Add hover effect
                    btn.addEventListener('mouseenter', () => {
                        if (button.type === 'primary') {
                            btn.style.backgroundColor = 'var(--accent-color-hover, #3730a3)';
                        } else if (button.type === 'danger') {
                            btn.style.backgroundColor = 'var(--danger-color-hover, #c82333)';
                        } else {
                            btn.style.backgroundColor = 'var(--preview-button-hover, #e2e8f0)';
                        }
                    });

                    btn.addEventListener('mouseleave', () => {
                        if (button.type === 'primary') {
                            btn.style.backgroundColor = 'var(--accent-color, #4f46e5)';
                        } else if (button.type === 'danger') {
                            btn.style.backgroundColor = 'var(--danger-color, #dc3545)';
                        } else {
                            btn.style.backgroundColor = 'var(--button-bg, #f5f5f5)';
                        }
                    });

                    // Add click event
                    if (typeof button.action === 'function') {
                        btn.addEventListener('click', button.action);
                    }

                    rightBtnContainer.appendChild(btn);
                }
            });
            footer.appendChild(leftBtnContainer);
            footer.appendChild(rightBtnContainer);
            floatingWindow.appendChild(footer);
        }

        // Add event listeners for control buttons
        closeBtn.addEventListener('click', () => {
            this.closeFloatingWindow();
        });

        // Replace the maximize button click handler

        // Replace the resize handler in the maximizeBtn event listener

        maximizeBtn.addEventListener('click', () => {
            const isMaximized = maximizeBtn.getAttribute('data-maximized') === 'true';

            if (isMaximized) {
                // Restore to normal size
                maximizeBtn.setAttribute('data-maximized', 'false');
                floatingWindow.setAttribute('data-maximized', 'false');

                // Remove maximized styles
                floatingWindow.style.removeProperty('width');
                floatingWindow.style.removeProperty('height');
                floatingWindow.style.removeProperty('top');
                floatingWindow.style.removeProperty('left');
                floatingWindow.style.removeProperty('max-width');
                floatingWindow.style.removeProperty('max-height');

                // Force reflow
                void floatingWindow.offsetWidth;

                // Restore centered positioning
                floatingWindow.style.width = '80%';
                floatingWindow.style.height = '80%';
                floatingWindow.style.maxWidth = '1200px';
                floatingWindow.style.maxHeight = '800px';
                floatingWindow.style.top = '50%';
                floatingWindow.style.left = '50%';
                floatingWindow.style.transform = 'translate(-50%, -50%)';

                maximizeBtn.innerHTML = '&#x26F6;';
                maximizeBtn.title = Lang.get('paperworkMaximizeTooltip');
            } else {
                // Maximize - FIX: Keep the window properly positioned
                maximizeBtn.setAttribute('data-maximized', 'true');
                floatingWindow.setAttribute('data-maximized', 'true');

                // Remove centering transform first
                floatingWindow.style.removeProperty('transform');

                // Force reflow
                void floatingWindow.offsetWidth;

                // Set maximized styles with proper positioning
                floatingWindow.style.width = '96vw';
                floatingWindow.style.height = '96vh';
                floatingWindow.style.maxWidth = 'none';
                floatingWindow.style.maxHeight = 'none';
                floatingWindow.style.top = '2vh';    // Use viewport units
                floatingWindow.style.left = '2vw';   // Use viewport units

                maximizeBtn.innerHTML = '&#x2699;';
                maximizeBtn.title = Lang.get('paperworkRestoreTooltip');
            }

            // Resize content areas with delay to ensure styles are applied
            setTimeout(() => {
                const templateContent = floatingWindow.querySelector('.template-design-container');
                const templateCanvas = floatingWindow.querySelector('.template-canvas-container');
                const templatePresets = floatingWindow.querySelector('.template-presets');

                if (templateContent) {
                    // Important: ALWAYS keep row direction for the template content
                    templateContent.style.display = 'flex';
                    templateContent.style.flexDirection = 'row';
                    templateContent.style.height = 'auto';
                }

                if (templateCanvas) {
                    templateCanvas.style.maxHeight = 'calc(100vh - 180px)';
                    templateCanvas.style.overflowY = 'auto';
                }

                if (templatePresets) {
                    templatePresets.style.maxHeight = 'calc(100vh - 180px)';
                    templatePresets.style.overflowY = 'auto';

                    // Ensure the presets panel width is maintained
                    if (!isMaximized) {
                        templatePresets.style.width = '350px';
                    }
                }

                // Force browser to recalculate layout
                floatingWindow.style.display = 'none';
                void floatingWindow.offsetHeight; // Force reflow
                floatingWindow.style.display = 'flex';
            }, 200);
        });

        document.body.appendChild(floatingWindow);

        // Allow closing with escape key
        document.addEventListener('keydown', this.handleEscapeKey);

        // Store for later reference
        this.backdropElement = backdrop;
        this.floatingWindowElement = floatingWindow;
    }
    closeFloatingWindow() {
        // Remove escape key handler
        document.removeEventListener('keydown', this.handleEscapeKey);

        // Remove elements
        if (this.backdropElement) {
            document.body.removeChild(this.backdropElement);
            this.backdropElement = null;
        }

        if (this.floatingWindowElement) {
            document.body.removeChild(this.floatingWindowElement);
            this.floatingWindowElement = null;
        }
    }
    showLoadingState(message) {
        // Create loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'paperwork-loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="paperwork-loading-container">
                <div class="paperwork-loading-spinner"></div>
                <div class="paperwork-loading-message">${message || Lang.get('paperworkProcessingMessage')}</div>
                            </div>
        `;
        document.body.appendChild(loadingOverlay);

        // Add CSS for loading overlay
        const style = document.createElement('style');
        style.id = 'paperwork-loading-styles';
        style.textContent = `
            .paperwork-loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            }
            
            .paperwork-loading-container {
                background-color: var(--modal-background, #ffffff);
                padding: 20px;
                border-radius: 8px;
                text-align: center;
            }
            
            .paperwork-loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid var(--border-color, #e5e7eb);
                border-top: 4px solid var(--accent-color, #4f46e5);
                border-radius: 50%;
                margin: 0 auto 15px auto;
                animation: paperwork-spin 1s linear infinite;
            }
            
            .paperwork-loading-message {
                color: var(--text-color, #333);
                font-size: 16px;
            }
            
            @keyframes paperwork-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    clearLoadingState() {
        const loadingOverlay = document.querySelector('.paperwork-loading-overlay');
        if (loadingOverlay) {
            document.body.removeChild(loadingOverlay);
        }

        const loadingStyles = document.getElementById('paperwork-loading-styles');
        if (loadingStyles) {
            document.head.removeChild(loadingStyles);
        }
    }

    updateReportEditorFont(newFont) {
        // Delegate to the templateDesign instance
        if (this.paperwork && this.paperwork.templateDesign) {
            this.paperwork.templateDesign.updateReportEditorFont(newFont);
        } else {
            console.error('Template design not initialized in Paperwork instance');
        }
    }

    //------------- Delegation for documents generation

    getBusinessLetterFields() {
        // Delegate to the DocumentGenerator through Paperwork
        return this.paperwork.documentGenerator.getBusinessLetterFields();
    }

    getContractFields() {
        // Delegate to the DocumentGenerator through Paperwork
        return this.paperwork.documentGenerator.getContractFields();
    }
    getProposalFields() {
        // Delegate to the DocumentGenerator through Paperwork
        return this.paperwork.documentGenerator.getProposalFields();
    }
    getGenericDocumentFields() {
        // Delegate to the DocumentGenerator through Paperwork
        return this.paperwork.documentGenerator.getGenericDocumentFields();
    }
    getMemoFields() {
        // Delegate to the DocumentGenerator through Paperwork
        return this.paperwork.documentGenerator.getMemoFields();
    }
    getMeetingMinutesFields() {
        // Delegate to the DocumentGenerator through Paperwork
        return this.paperwork.documentGenerator.getMeetingMinutesFields();
    }
    generateDocument(templateType) {
        // Delegate to the DocumentGenerator through Paperwork
        return this.paperwork.documentGenerator.generateDocument(templateType);
    }

    loadLetterData(templateType) {
        // Delegate to the DocumentGenerator through Paperwork
        return this.paperwork.documentGenerator.loadLetterData(templateType);
    }
    //------------- Delegation for template designer generation

    addSectionFromPreset(presetType) {
       //console.log(`UIHelpers: Delegating addSectionFromPreset to TemplateDesign: ${presetType}`);

        if (this.paperwork && this.paperwork.templateDesign) {
            // No need to set dimensions - each class maintains its own
            this.paperwork.templateDesign.addSectionFromPreset(presetType);
        } else {
            console.error('Template design not initialized in Paperwork instance');
        }
    }

    renderTemplateSections(sections) {
       //console.log('UIHelpers: Delegating renderTemplateSections to TemplateDesign');
        // Make sure we're using templateDesign, not templateDesigner (wrong name)
        if (this.paperwork && this.paperwork.templateDesign) {
            return this.paperwork.templateDesign.renderTemplateSections(sections);
        } else {
            console.error('Template design not initialized in Paperwork instance');
        }
    }

    saveTemplateDesign(templateId) {
       //console.log(`UIHelpers: Delegating saveTemplateDesign to TemplateDesign: ${templateId}`);
        if (this.paperwork && this.paperwork.templateDesign) {
            return this.paperwork.templateDesign.saveTemplateDesign(templateId);
        } else {
            console.error('Template design not initialized in Paperwork instance');
        }
    }

    generateUniqueId() {
        // This utility function can be added directly to UIHelpers for convenience
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    handleEscapeKey = (event) => {
        if (event.key === 'Escape') {
            this.closeFloatingWindow();
        }
    }
    // Add styles for paperwork tab
    addPaperworkTabStyles() {
        // Check if styles already exist
        if (document.getElementById('paperwork-tab-styles')) return;

        const styleSheet = document.createElement('style');
        styleSheet.id = 'paperwork-tab-styles';
        styleSheet.textContent = `
        .paperwork-container {
            padding: 20px;
            max-width: 720px;
            margin: 0 auto;
        }
        
        .paperwork-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
            color: var(--text-color);
            text-align: center;
        }
        
        .paperwork-description {
            font-size: 14px;
            margin-bottom: 25px;
            color: var(--text-muted);
            line-height: 1.4;
            text-align: center;
        }
        
        /* Grid layout for template buttons - similar to dataviz */
        .paperwork-template-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 20px;
        }
        
        .paperwork-template-item {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px 15px;
            background-color: var(--button-bg, rgba(255, 255, 255, 0.05));
            border: 1px solid var(--border-color, #333);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: center;
            color: var(--text-color);
        }
        
        /* Match hover and active states to dataviz */
        .paperwork-template-item:hover {
            background-color: var(--button-hover-bg, rgba(255, 255, 255, 0.1));
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .paperwork-template-item:active {
            background-color: var(--primary-color, #4f46e5);
            color: white;
            transform: scale(0.98);
            box-shadow: 0 1px 4px rgba(0,0,0,0.1) inset;
        }
        
        .paperwork-template-icon {
            font-size: 28px;
            margin-bottom: 15px;
        }
        
        .paperwork-template-title {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 8px;
        }
        
        .paperwork-template-description {
            font-size: 13px;
            color: var(--text-secondary, #888);
            line-height: 1.3;
        }
        
        /* Make sure the container adapts to small screens */
        @media (max-width: 480px) {
            .paperwork-template-grid {
                grid-template-columns: 1fr;
            }
        }
    `;

        document.head.appendChild(styleSheet);
    }
}
class TemplateDesign {
    constructor(paperworkInstance) {
        this.paperwork = paperworkInstance;

        // Initialize with default values that will be overridden
        this.A4_WIDTH_PX = 794;  // 210mm at 96 DPI
        this.A4_HEIGHT_PX = 1123; // 297mm at 96 DPI
        this.PAGE_MARGINS = {
            top: 72,
            right: 72,
            bottom: 72,
            left: 72
        };
    }

    async initialize(paperworkInstance) {
        if (paperworkInstance) {
            this.paperwork = paperworkInstance;
        }
    }

    addSectionFromPreset(presetType) {
        const sectionsContainer = document.getElementById('template-sections-container');
        const placeholder = document.getElementById('canvas-placeholder');

        // Hide placeholder if this is the first section
        if (placeholder) {
            placeholder.style.display = 'none';
        }

        // Get current sections
        let sections = [];
        try {
            sections = JSON.parse(sectionsContainer.getAttribute('data-sections') || '[]');
        } catch (e) {
            console.error('Error parsing sections:', e);
        }

        // Create new section based on preset type
        const newSection = this.createSectionFromPreset(presetType);

        // Add section to the list
        sections.push(newSection);

        // Update data attribute
        sectionsContainer.setAttribute('data-sections', JSON.stringify(sections));

        // Render all sections
        this.renderTemplateSections(sections);
        // Show notification
        this.showNotification(Lang.get('paperworkSectionAddedToDocument', { sectionType: this.getSectionTypeName(presetType) }));
    }
    createSectionFromPreset(presetType) {
        const sectionId = this.generateUniqueId();

        let section = {
            id: sectionId,
            type: presetType,
            fields: []
        };


        switch (presetType) {
            case 'document-header':
                section.title = Lang.get('paperworkDocumentTitle');
                section.subtitle = Lang.get('paperworkDocumentSubtitle');
                break;

            case 'section-header':
                section.title = Lang.get('paperworkSectionHeader');
                break;

            case 'text-area':
                section.label = Lang.get('paperworkTextAreaField');
                section.placeholder = Lang.get('paperworkEnterLongerTextHere');
                section.required = false;
                section.rows = 5;
                break;

            case 'picture-gallery':
                section.label = Lang.get('paperworkImageGallery');
                section.imageCount = 4;
                break;

            case 'text-image-right':
                section.label = Lang.get('paperworkTextWithImage');
                section.textPlaceholder = Lang.get('paperworkEnterTextHere');
                section.required = false;
                break;

            case 'image-text-right':
                section.label = Lang.get('paperworkImageWithText');
                section.textPlaceholder = Lang.get('paperworkEnterTextHere');
                section.required = false;
                break;
            case 'picture-row':
                section.type = 'picture-row';
                section.label = Lang.get('paperworkImageRow');
                section.imageCount = 4; // Default to 4 images in a row
                section.required = false;
                break;
            case 'divider':
                // No additional properties needed
                break;
            case 'empty-space':
                section.height = 100; // Default height in pixels
                section.flexible = true; // Can expand to fill page
                break;
        }

        return section;
    }
    renderTemplateSections(sections) {
        const sectionsContainer = document.getElementById('template-sections-container');

        // Clear existing content
        sectionsContainer.innerHTML = '';

        // Create a single page container
        const pageContainer = document.createElement('div');
        pageContainer.className = 'template-page';
        pageContainer.style.position = 'relative';
        pageContainer.style.width = '100%';
        pageContainer.style.minHeight = `${this.A4_HEIGHT_PX}px`;
        pageContainer.style.marginBottom = '20px';
        pageContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        pageContainer.style.backgroundColor = 'white';

        // Add page number indicator for visual reference only
        const pageIndicator = document.createElement('div');
        pageIndicator.className = 'page-number';
        pageIndicator.textContent = Lang.get('paperworkDesignCanvas');
        pageIndicator.style.position = 'absolute';
        pageIndicator.style.bottom = '5px';
        pageIndicator.style.right = '10px';
        pageIndicator.style.fontSize = '12px';
        pageIndicator.style.color = '#999';
        pageContainer.appendChild(pageIndicator);

        sectionsContainer.appendChild(pageContainer);

        // Render each section sequentially in a single continuous canvas
        sections.forEach((section, index) => {
            const sectionHTML = this.renderTemplateSection(section, index);
            pageContainer.innerHTML += sectionHTML;
        });

        // Add event listeners for section controls
        this.addSectionControlListeners();

        // Add helper text for page breaks at the bottom if there are sections
        if (sections.length > 0) {
            const helpText = document.createElement('div');
            helpText.className = 'page-break-help';
            helpText.style.padding = '10px';
            helpText.style.marginTop = '10px';
            helpText.style.backgroundColor = '#f5f7fa';
            helpText.style.borderRadius = '4px';
            helpText.style.fontSize = '13px';
            helpText.style.color = '#666';
            helpText.innerHTML = Lang.get('paperworkPageBreakHelp');
            sectionsContainer.appendChild(helpText);
        }
    }
    // Update renderTemplateSection to add direct editing and AI enhancement
    renderTemplateSection(section, index) {
        // Get sections array from the container
        const sectionsContainer = document.getElementById('template-sections-container');
        const allSections = JSON.parse(sectionsContainer.getAttribute('data-sections') || '[]');

        let sectionHTML = `<div class="template-section" data-section-id="${section.id}" data-section-index="${index}">`;

        // Add control buttons
        sectionHTML += `
        <div class="section-controls">
            ${index > 0 ? `<button class="section-control-btn move-up-btn" title="${Lang.get('paperworkMoveUp')}">↑</button>` : ''}
            ${index < allSections.length - 1 ? `<button class="section-control-btn move-down-btn" title="${Lang.get('paperworkMoveDown')}">↓</button>` : ''}
            <button class="section-control-btn edit-section-btn" title="${Lang.get('paperworkEdit')}">✎</button>
            <button class="section-control-btn delete-section-btn" title="${Lang.get('paperworkDelete')}">×</button>
        </div>
        `;

        // Render content based on section type
        switch (section.type) {
            case 'document-header':
                sectionHTML += `
            <div style="padding: 20px; text-align: center;">
                <h1 contenteditable="true" class="editable-content ${section.title === Lang.get('paperworkDocumentTitle') ? 'placeholder-text' : ''}" 
                    style="margin: 0 0 10px 0; font-size: 24px;" data-section-id="${section.id}" data-field="title">${section.title || Lang.get('paperworkDocumentTitle')}</h1>
                <p contenteditable="true" class="editable-content ${section.subtitle === Lang.get('paperworkDocumentSubtitle') ? 'placeholder-text' : ''}" 
                    style="margin: 0; color: #666;" data-section-id="${section.id}" data-field="subtitle">${section.subtitle || Lang.get('paperworkDocumentSubtitle')}</p>
                <div class="editing-controls" style="margin-top: 10px;">
                    <button class="ai-enhance-btn" data-section-id="${section.id}" data-fields="title,subtitle">${Lang.get('paperworkEnhanceWithAI')}</button>
                    <button class="undo-edit-btn" data-section-id="${section.id}" style="display: ${section._previousValues ? 'inline-block' : 'none'};">${Lang.get('paperworkUndoChanges')}</button>                </div>
            </div>
            `;
                break;
                break;

            case 'section-header':
                sectionHTML += `
            <div style="padding: 15px 20px;">
                <h2 contenteditable="true" class="editable-content" style="margin: 0 0 5px 0; font-size: 18px;" data-section-id="${section.id}" data-field="title">${section.title || Lang.get('paperworkSectionHeader')}</h2>
                <hr style="border: none; height: 1px; background-color: #ddd; margin: 0;">
                <div class="editing-controls" style="margin-top: 10px;">
                    <button class="ai-enhance-btn" data-section-id="${section.id}" data-fields="title">${Lang.get('paperworkEnhanceWithAI')}</button>
                                        <button class="undo-edit-btn" data-section-id="${section.id}" style="display: none;">${Lang.get('paperworkUndoChanges')}</button>
                                                        </div>
            </div>
        `;
                break;

            case 'text-area':
                sectionHTML += `
            <div style="padding: 15px 20px;">
                <div contenteditable="true" class="editable-content" style="min-height: ${(section.rows || 5) * 20}px; border: 1px solid #ddd; border-radius: 4px; background-color: #f9f9f9; padding: 10px; color: #333;" data-section-id="${section.id}" data-field="placeholder">${section.placeholder || Lang.get('paperworkEnterLongerTextHere')}</div>
                <div class="editing-controls" style="margin-top: 10px;">
                    <button class="ai-enhance-btn" data-section-id="${section.id}" data-fields="placeholder">${Lang.get('paperworkEnhanceWithAI')}</button>       
                                 <button class="undo-edit-btn" data-section-id="${section.id}" style="display: none;">${Lang.get('paperworkUndoChanges')}</button>   
                 </div>
            </div>
            `;
                break;
            case 'text-image-right':
                sectionHTML += `
                    <div style="padding: 15px 20px;">
                        <div style="display: flex; gap: 15px;">
                            <div contenteditable="true" class="editable-content" style="flex: 2; min-height: 100px; border: 1px solid #ddd; border-radius: 4px; background-color: #f9f9f9; padding: 10px; color: #333;" data-section-id="${section.id}" data-field="textPlaceholder">${section.textPlaceholder || Lang.get('paperworkEnterTextHere')}</div>
                            <div class="image-placeholder" 
                                data-section-id="${section.id}" 
                                data-image-index="0"
                                style="flex: 1; aspect-ratio: 1/1; border: 1px solid #ddd; border-radius: 4px; background-color: #f9f9f9; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; cursor: pointer;">
                                ${section.images && section.images[0] ?
                        `<img src="${section.images[0]}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` :
                        `<div class="placeholder-text">
                                        <div style="text-align: center;">
                                        <div style="font-size: 24px; margin-bottom: 5px;">📷</div>
                                        <div style="font-size: 12px;">${Lang.get('paperworkClickOrDragImage')}</div>
                                        </div>
                                    </div>`
                    }
                                <input type="file" class="image-file-input" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;" accept="image/*">
                            </div>
                        </div>
                        <div class="editing-controls" style="margin-top: 10px;">
                            <button class="ai-enhance-btn" data-section-id="${section.id}" data-fields="label,textPlaceholder">${Lang.get('paperworkEnhanceWithAI')}</button>                            <button class="undo-edit-btn" data-section-id="${section.id}" style="display: none;">${Lang.get('paperworkUndoChanges')}</button>                        </div>
                    </div>
                `;
                break;

            case 'image-text-right':
                sectionHTML += `
                    <div style="padding: 15px 20px;">
                        <div style="display: flex; gap: 15px;">
                            <div class="image-placeholder" 
                                data-section-id="${section.id}" 
                                data-image-index="0"
                                style="flex: 1; aspect-ratio: 1/1; border: 1px solid #ddd; border-radius: 4px; background-color: #f9f9f9; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; cursor: pointer;">
                                ${section.images && section.images[0] ?
                        `<img src="${section.images[0]}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` :
                        `<div class="placeholder-text">
                                        <div style="text-align: center;">
                                            <div style="font-size: 24px; margin-bottom: 5px;">📷</div>
                                            <div style="font-size: 12px;">${Lang.get('paperworkClickOrDragImage')}</div>
                                        </div>
                                    </div>`
                    }
                                <input type="file" class="image-file-input" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;" accept="image/*">
                            </div>
                            <div contenteditable="true" class="editable-content" style="flex: 2; min-height: 100px; border: 1px solid #ddd; border-radius: 4px; background-color: #f9f9f9; padding: 10px; color: #333;" data-section-id="${section.id}" data-field="textPlaceholder">${section.textPlaceholder || Lang.get('paperworkEnterTextHere')}</div>
                        </div>
                        <div class="editing-controls" style="margin-top: 10px;">
                           <button class="ai-enhance-btn" data-section-id="${section.id}" data-fields="label,textPlaceholder">${Lang.get('paperworkEnhanceWithAI')}</button>
                            <button class="undo-edit-btn" data-section-id="${section.id}" style="display: none;">${Lang.get('paperworkUndoChanges')}</button>
                                                    </div>
                    </div>
                `;
                break;
            case 'picture-gallery':
                sectionHTML += `
                        <div style="padding: 15px 20px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                ${Array.from({ length: section.imageCount || 4 }).map((_, i) => `
                                    <div class="image-placeholder" 
                                        data-section-id="${section.id}" 
                                        data-image-index="${i}"
                                        style="aspect-ratio: 4/3; border: 1px solid #ddd; border-radius: 4px; background-color: #f9f9f9; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; cursor: pointer;">
                                        ${section.images && section.images[i] ?
                        `<img src="${section.images[i]}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` :
                        `<div class="placeholder-text">
                                                <div style="text-align: center;">
                                                    <div style="font-size: 24px; margin-bottom: 5px;">📷</div>
                                                    <div style="font-size: 12px;">${Lang.get('paperworkClickOrDragImage')}</div>
                                                </div>
                                            </div>`
                    }
                                        <input type="file" class="image-file-input" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;" accept="image/*">
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                break;
            case 'picture-row':
                sectionHTML += `
                        <div style="padding: 15px 20px;">
                            <div style="display: flex; gap: 10px; margin-top: 5px;">
                                ${Array.from({ length: 4 }).map((_, i) => `
                                    <div class="image-placeholder" 
                                        data-section-id="${section.id}" 
                                        data-image-index="${i}"
                                        style="flex: 1; height: 120px; background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #aaa; position: relative; overflow: hidden; cursor: pointer;">
                                        ${section.images && section.images[i] ?
                        `<img src="${section.images[i]}" style="max-width: 100%; max-height: 100%; object-fit: contain;">` :
                        `<div class="placeholder-text">
                                                <div style="text-align: center;">
                                                    <div style="font-size: 24px; margin-bottom: 5px;">📷</div>
                                                    <div style="font-size: 12px;">${Lang.get('paperworkClickOrDragImage')}</div>
                                                </div>
                                            </div>`
                    }
                                        <input type="file" class="image-file-input" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;" accept="image/*">
                                    </div>
                                `).join('')}
                            </div>
                            <div contenteditable="true" class="editable-content" style="font-size: 13px; color: #666; margin-top: 8px; text-align: center;" data-section-id="${section.id}" data-field="caption">
                                ${section.caption || Lang.get('paperworkAddCaptionHere')}
                            </div>
                            <div class="editing-controls" style="margin-top: 10px;">
                                <button class="ai-enhance-btn" data-section-id="${section.id}" data-fields="caption">${Lang.get('paperworkEnhanceCaption')}</button>
                                <button class="undo-edit-btn" data-section-id="${section.id}" style="display: none;">${Lang.get('paperworkUndoChanges')}</button>
                            </div>
                        </div>
                    `;
                break;
            case 'empty-space':
                sectionHTML += `
                        <div style="padding: 15px 20px;">
                            <div class="empty-space-container" 
                                 data-section-id="${section.id}"
                                 style="height: ${section.height}px; 
                                        border: 1px dashed #ddd; 
                                        border-radius: 4px; 
                                        background-color: #f9f9f9; 
                                        display: flex; 
                                        align-items: center; 
                                        justify-content: center;
                                        position: relative;
                                        cursor: ns-resize;">
                                <div style="color: #aaa; text-align: center;">
                                        <div style="font-size: 14px;">${section.height >= 400 ? Lang.get('paperworkPageBreakSpace') : Lang.get('paperworkEmptySpace')}</div>
                                        <div style="font-size: 12px; margin-top: 5px;">${Lang.get('paperworkDragToResize')}</div>
                                    ${section.height >= 400 ?
                        `<div style="font-size: 12px; color: #ff5722; margin-top: 5px;">Likely causes page break in PDF</div>` :
                        ''}
                                </div>
                                <div class="resize-handle" style="position: absolute; bottom: 0; left: 0; right: 0; height: 10px; cursor: ns-resize;"></div>
                            </div>
                            <div class="editing-controls" style="margin-top: 10px;">
                            <button class="edit-section-btn" data-section-id="${section.id}">${Lang.get('paperworkAdjustHeight')}</button>
                            <button class="page-break-btn" data-section-id="${section.id}">${Lang.get('paperworkInsertPageBreak')}</button>
                            </div>
                        </div>
                    `;
                break;
        }

        sectionHTML += `</div>`;

        return sectionHTML;
    }
    addSectionControlListeners() {
        // Delete section buttons
        document.querySelectorAll('.delete-section-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.closest('.template-section');
                const sectionIndex = parseInt(section.getAttribute('data-section-index'));
                this.deleteSection(sectionIndex);
            });
        });

        // Edit section buttons
        document.querySelectorAll('.edit-section-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.closest('.template-section');
                const sectionIndex = parseInt(section.getAttribute('data-section-index'));
                this.editSection(sectionIndex);
            });
        });

        // Move up buttons
        document.querySelectorAll('.move-up-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.closest('.template-section');
                const sectionIndex = parseInt(section.getAttribute('data-section-index'));
                this.moveSection(sectionIndex, 'up');
            });
        });

        // Move down buttons
        document.querySelectorAll('.move-down-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.closest('.template-section');
                const sectionIndex = parseInt(section.getAttribute('data-section-index'));
                this.moveSection(sectionIndex, 'down');
            });
        });
        // Add listeners for editable content
        document.querySelectorAll('.editable-content').forEach(element => {
            // Add the blur event (already exists)
            element.addEventListener('blur', (e) => {
                this.updateSectionContent(e.target);
            });

            // Add a focus event to clear placeholder text
            element.addEventListener('focus', (e) => {
                this.handleFocus(e.target);
            });

            // Save original content for undo functionality (already exists)
            element.setAttribute('data-original', element.innerHTML);
        });

        // Add listeners for AI enhance buttons
        document.querySelectorAll('.ai-enhance-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sectionId = e.target.getAttribute('data-section-id');
                const fields = e.target.getAttribute('data-fields').split(',');
                this.enhanceWithAI(sectionId, fields);
            });
        });

        // Add listeners for undo buttons
        document.querySelectorAll('.undo-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sectionId = e.target.getAttribute('data-section-id');
                this.undoChanges(sectionId);
            });
        });
        document.querySelectorAll('.expand-to-page-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sectionId = e.target.getAttribute('data-section-id');
                this.expandSectionToEndOfPage(sectionId);
            });
        });
        // Add listeners for image placeholders
        document.querySelectorAll('.image-placeholder').forEach(placeholder => {
            // Set up drag-over and drop events
            placeholder.addEventListener('dragover', (e) => {
                e.preventDefault();
                placeholder.style.backgroundColor = '#e6f7ff';
                placeholder.style.borderColor = '#4f46e5';
            });

            placeholder.addEventListener('dragleave', (e) => {
                e.preventDefault();
                placeholder.style.backgroundColor = '#f9f9f9';
                placeholder.style.borderColor = '#ddd';
            });

            placeholder.addEventListener('drop', async (e) => {
                e.preventDefault();
                placeholder.style.backgroundColor = '#f9f9f9';
                placeholder.style.borderColor = '#ddd';

                const sectionId = placeholder.getAttribute('data-section-id');
                const imageIndex = placeholder.getAttribute('data-image-index');

                // Handle file drop
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const file = e.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        await this.handleImageUpload(file, sectionId, imageIndex, placeholder);
                    }
                }
            });

            // Set up click-to-upload via the hidden file input
            const fileInput = placeholder.querySelector('.image-file-input');
            if (fileInput) {
                fileInput.addEventListener('change', async (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        const sectionId = placeholder.getAttribute('data-section-id');
                        const imageIndex = placeholder.getAttribute('data-image-index');

                        await this.handleImageUpload(file, sectionId, imageIndex, placeholder);

                        // Reset the file input so the same file can be selected again if needed
                        e.target.value = '';
                    }
                });
            }
        });


        // Add drag-to-resize functionality for empty space sections
        document.querySelectorAll('.empty-space-container').forEach(container => {
            let startY, startHeight;

            const onMouseDown = (e) => {
                e.preventDefault();

                // Get the initial position and height
                startY = e.clientY;
                startHeight = parseInt(container.style.height);

                // Add event listeners for dragging
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);

                // Change appearance during resize
                container.style.borderColor = 'var(--primary-color, #4f46e5)';
                container.style.boxShadow = '0 0 0 1px var(--primary-color, #4f46e5)';
            };

            const onMouseMove = (e) => {
                // Calculate new height
                const newHeight = Math.max(20, startHeight + (e.clientY - startY));

                // Update container height
                container.style.height = newHeight + 'px';

                // Show the current height as a tooltip
                const heightDisplay = container.querySelector('.height-display') ||
                    (() => {
                        const div = document.createElement('div');
                        div.className = 'height-display';
                        div.style.position = 'absolute';
                        div.style.right = '10px';
                        div.style.top = '10px';
                        div.style.background = 'rgba(0,0,0,0.7)';
                        div.style.color = 'white';
                        div.style.padding = '3px 8px';
                        div.style.borderRadius = '3px';
                        div.style.fontSize = '12px';
                        container.appendChild(div);
                        return div;
                    })();

                heightDisplay.textContent = `${newHeight}px`;
            };

            const onMouseUp = (e) => {
                // Remove event listeners
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);

                // Reset appearance
                container.style.borderColor = '#ddd';
                container.style.boxShadow = 'none';

                // Get the sections data
                const sectionId = container.getAttribute('data-section-id');
                const sectionsContainer = document.getElementById('template-sections-container');
                let sections = JSON.parse(sectionsContainer.getAttribute('data-sections') || '[]');

                // Find the section and update its height
                const section = sections.find(s => s.id === sectionId);
                if (section) {
                    section.height = parseInt(container.style.height);
                    sectionsContainer.setAttribute('data-sections', JSON.stringify(sections));
                }

                // Remove height display
                const heightDisplay = container.querySelector('.height-display');
                if (heightDisplay) {
                    container.removeChild(heightDisplay);
                }
            };

            // Attach the mousedown event to the container and the resize handle
            container.addEventListener('mousedown', onMouseDown);
            const resizeHandle = container.querySelector('.resize-handle');
            if (resizeHandle) {
                resizeHandle.addEventListener('mousedown', onMouseDown);
            }
        });
        document.querySelectorAll('.page-break-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sectionId = e.target.getAttribute('data-section-id');
                this.insertPageBreak(sectionId);
            });
        });
    }
    handleFocus(element) {
        const sectionId = element.getAttribute('data-section-id');
        const field = element.getAttribute('data-field');

        const sectionsContainer = document.getElementById('template-sections-container');
        let sections = JSON.parse(sectionsContainer.getAttribute('data-sections') || '[]');

        const section = sections.find(s => s.id === sectionId);
        if (!section || !field) return;

        // Check if the content is still the default placeholder
        const isDefaultContent = this.isDefaultContent(section, field, element.innerHTML);

        if (isDefaultContent) {
            // Clear the content when it's the default placeholder
            element.innerHTML = '';

            // Apply a different style to indicate editing mode
            element.style.fontStyle = 'normal';
            element.style.color = '#000';
        }
    }
    deleteSection(index) {
        if (!confirm(Lang.get('paperworkDeleteSectionConfirm'))) return;

        const sectionsContainer = document.getElementById('template-sections-container');
        let sections = JSON.parse(sectionsContainer.getAttribute('data-sections') || '[]');

        sections.splice(index, 1);

        sectionsContainer.setAttribute('data-sections', JSON.stringify(sections));

        // Show placeholder if all sections were deleted
        if (sections.length === 0) {
            const placeholder = document.getElementById('canvas-placeholder');
            if (placeholder) {
                placeholder.style.display = 'block';
            }
        }

        this.renderTemplateSections(sections);
    }
    editSection(index) {
        const sectionsContainer = document.getElementById('template-sections-container');
        let sections = JSON.parse(sectionsContainer.getAttribute('data-sections') || '[]');

        if (!sections[index]) return;

        const section = sections[index];

        // Create edit dialog
        const editDialog = document.createElement('div');
        editDialog.className = 'section-edit-dialog';
        editDialog.style.position = 'fixed';
        editDialog.style.top = '50%';
        editDialog.style.left = '50%';
        editDialog.style.transform = 'translate(-50%, -50%)';
        editDialog.style.backgroundColor = 'white';
        editDialog.style.padding = '20px';
        editDialog.style.borderRadius = '8px';
        editDialog.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        editDialog.style.zIndex = '1000';
        editDialog.style.minWidth = '300px';

        if (section.type === 'empty-space') {
            // For empty space, use theme-aware styling
            editDialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: var(--bg-color, white);
                color: var(--text-color, #333);
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                min-width: 300px;
                border: 1px solid var(--border-color, #eee);
            `;
        } else {
            // Keep the original styling for other section types
            editDialog.style.position = 'fixed';
            editDialog.style.top = '50%';
            editDialog.style.left = '50%';
            editDialog.style.transform = 'translate(-50%, -50%)';
            editDialog.style.backgroundColor = 'white';
            editDialog.style.padding = '20px';
            editDialog.style.borderRadius = '8px';
            editDialog.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
            editDialog.style.zIndex = '1000';
            editDialog.style.minWidth = '300px';
        }
        // Dialog content depends on section type
        let dialogContent = `
        <h3 style="margin-top: 0;">${Lang.get('paperworkEditSectionTitle', { sectionType: this.getSectionTypeName(section.type) })}</h3>
    `;
        if (section.type === 'empty-space') {
            dialogContent += `
            <div class="dialog-field" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: var(--label-color, #555);">${Lang.get('paperworkHeightPixels')}</label>
                    <input type="number" id="edit-section-height" value="${section.height || 100}" min="20" max="1000" 
                       style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color, #ddd); 
                       background-color: var(--input-bg, white); color: var(--text-color, #333);">
            </div>
            <div class="dialog-field" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: var(--label-color, #555);">${Lang.get('paperworkBehavior')}</label>
                       <select id="edit-section-flexible" 
                        style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color, #ddd);
                        background-color: var(--input-bg, white); color: var(--text-color, #333);">
                    <option value="false" ${!section.flexible ? 'selected' : ''}>${Lang.get('paperworkFixedHeight')}</option>
                    <option value="true" ${section.flexible ? 'selected' : ''}>${Lang.get('paperworkExpandToEndOfPage')}</option>
                </select>
            </div>
        `;
        } else {
            switch (section.type) {
                case 'document-header':
                    dialogContent += `
                <div class="dialog-field">
                    <label>${Lang.get('paperworkTitle')}</label>
                    <input type="text" id="edit-section-title" value="${section.title || ''}">
                </div>
                <div class="dialog-field">
                    <label>${Lang.get('paperworkSubtitle')}</label>
                    <input type="text" id="edit-section-subtitle" value="${section.subtitle || ''}">
                </div>
            `;
                    break;

                case 'section-header':
                    dialogContent += `
                <div class="dialog-field">
                    <label>${Lang.get('paperworkTitle')}</label>
                    <input type="text" id="edit-section-title" value="${section.title || ''}">
                </div>
            `;
                    break;

                case 'text-area':
                    dialogContent += `
                <div class="dialog-field">
                    <label>${Lang.get('paperworkLabel')}</label>
                    <input type="text" id="edit-section-label" value="${section.label || ''}">
                </div>
                <div class="dialog-field">
                    <label>${Lang.get('paperworkPlaceholder')}</label>
                    <input type="text" id="edit-section-placeholder" value="${section.placeholder || ''}">
                </div>
                <div class="dialog-field">
                    <label>${Lang.get('paperworkRequired')}</label>
                    <input type="checkbox" id="edit-section-required" ${section.required ? 'checked' : ''}>
                </div>
            `;

                    // Add rows field for text areas
                    if (section.type === 'text-area') {
                        dialogContent += `
                    <div class="dialog-field">
                        <label>${Lang.get('paperworkRows')}</label>
                        <input type="number" id="edit-section-rows" value="${section.rows || 5}" min="2" max="20">
                    </div>
                `;
                    }
                    break;

                case 'picture-gallery':
                    dialogContent += `
                <div class="dialog-field">
                    <label>${Lang.get('paperworkLabel')}</label>
                    <input type="text" id="edit-section-label" value="${section.label || ''}">
                </div>
                <div class="dialog-field">
                    <label>${Lang.get('paperworkNumberOfImages')}</label>
                    <select id="edit-section-imagecount">
                        <option value="2" ${section.imageCount === 2 ? 'selected' : ''}>${Lang.get('paperworkTwoImages')}</option>
                        <option value="4" ${!section.imageCount || section.imageCount === 4 ? 'selected' : ''}>${Lang.get('paperworkFourImages')}</option>
                        <option value="6" ${section.imageCount === 6 ? 'selected' : ''}>${Lang.get('paperworkSixImages')}</option>
                    </select>
                </div>
            `;
                    break;

                case 'text-image-right':
                case 'image-text-right':
                    dialogContent += `
                <div class="dialog-field">
                    <label>${Lang.get('paperworkLabel')}</label>
                    <input type="text" id="edit-section-label" value="${section.label || ''}">
                </div>
                <div class="dialog-field">
                    <label>${Lang.get('paperworkTextPlaceholder')}</label>
                    <input type="text" id="edit-section-textplaceholder" value="${section.textPlaceholder || ''}">
                </div>
                <div class="dialog-field">
                    <label>${Lang.get('paperworkRequired')}</label>
                    <input type="checkbox" id="edit-section-required" ${section.required ? 'checked' : ''}>
                </div>
            `;
                    break;
                case 'empty-space':
                    dialogContent += `
                        <div class="dialog-field">
                            <label>${Lang.get('paperworkHeightPixels')}</label>
                            <input type="number" id="edit-section-height" value="${section.height || 100}" min="20" max="1000">
                        </div>
                        <div class="dialog-field">
                            <label>${Lang.get('paperworkBehavior')}</label>
                            <select id="edit-section-flexible">
                               <option value="false" ${!section.flexible ? 'selected' : ''}>${Lang.get('paperworkFixedHeight')}</option>
                               <option value="true" ${section.flexible ? 'selected' : ''}>${Lang.get('paperworkExpandToEndOfPage')}</option>
                            </select>
                        </div>
                    `;
                    break;
            }
        }

        if (section.type === 'empty-space') {
            dialogContent += `
                <div class="dialog-buttons" style="text-align: right; margin-top: 20px;">
                <button id="cancel-section-edit" style="margin-right: 10px; padding: 8px 15px; 
                       background: var(--button-secondary-bg, #f5f5f5); 
                       color: var(--button-secondary-text, #333);
                       border: 1px solid var(--border-color, #ddd); 
                       border-radius: 4px; cursor: pointer;">${Lang.get('paperworkCancel')}</button>
                       
                <button id="save-section-edit" style="padding: 8px 15px; 
                       background: var(--primary-color, #4f46e5); 
                       color: white; 
                       border: none; border-radius: 4px; cursor: pointer;">${Lang.get('paperworkSave')}</button>
                </div>
            `;
        } else {
            // Original buttons for other section types
            dialogContent += `
                <div class="dialog-buttons" style="text-align: right; margin-top: 20px;">
                    <button id="cancel-section-edit" style="margin-right: 10px; padding: 8px 15px; background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">${Lang.get('paperworkCancel')}</button>
                    <button id="save-section-edit" style="padding: 8px 15px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">${Lang.get('paperworkSave')}</button>
                </div>
            `;
        }


        editDialog.innerHTML = dialogContent;
        document.body.appendChild(editDialog);

        // Add event listeners
        document.getElementById('cancel-section-edit').addEventListener('click', () => {
            document.body.removeChild(editDialog);
        });

        document.getElementById('save-section-edit').addEventListener('click', () => {
            // Update section based on type
            switch (section.type) {
                case 'document-header':
                    section.title = document.getElementById('edit-section-title').value;
                    section.subtitle = document.getElementById('edit-section-subtitle').value;
                    break;

                case 'section-header':
                    section.title = document.getElementById('edit-section-title').value;
                    break;

                case 'text-input':
                case 'text-area':
                    section.label = document.getElementById('edit-section-label').value;
                    section.placeholder = document.getElementById('edit-section-placeholder').value;
                    section.required = document.getElementById('edit-section-required').checked;

                    if (section.type === 'text-area') {
                        section.rows = parseInt(document.getElementById('edit-section-rows').value);
                    }
                    break;

                case 'picture-gallery':
                    section.label = document.getElementById('edit-section-label').value;
                    section.imageCount = parseInt(document.getElementById('edit-section-imagecount').value);
                    break;

                case 'text-image-right':
                case 'image-text-right':
                    section.label = document.getElementById('edit-section-label').value;
                    section.textPlaceholder = document.getElementById('edit-section-textplaceholder').value;
                    section.required = document.getElementById('edit-section-required').checked;
                    break;
                case 'empty-space':
                    section.height = parseInt(document.getElementById('edit-section-height').value);
                    section.flexible = document.getElementById('edit-section-flexible').value === 'true';
                    break;
            }

            // Update sections
            sections[index] = section;
            sectionsContainer.setAttribute('data-sections', JSON.stringify(sections));

            // Re-render sections
            this.renderTemplateSections(sections);

            // Remove dialog
            document.body.removeChild(editDialog);
        });
    }
    getSectionTypeName(sectionType) {
        const typeNames = {
            'document-header': 'Document Header',
            'section-header': 'Section Header',
            'text-input': 'Text Field',
            'text-area': 'Text Area',
            'text-image-right': 'Text with Image',
            'image-text-right': 'Image with Text',
            'divider': 'Divider',
            'picture-gallery': 'Image Gallery',
            'picture-row': 'Image Row',
            'empty-space': 'Empty Space',
        };
        return typeNames[sectionType] || sectionType;
    }
    moveSection(index, direction) {
        const sectionsContainer = document.getElementById('template-sections-container');
        let sections = JSON.parse(sectionsContainer.getAttribute('data-sections') || '[]');

        if (direction === 'up' && index > 0) {
            // Swap with previous section
            [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
        } else if (direction === 'down' && index < sections.length - 1) {
            // Swap with next section
            [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
        } else {
            return; // Nothing to do
        }

        // Update sections
        sectionsContainer.setAttribute('data-sections', JSON.stringify(sections));

        // Re-render sections
        this.renderTemplateSections(sections);
    }
    expandSectionToEndOfPage(sectionId) {
        const sectionsContainer = document.getElementById('template-sections-container');
        let sections = JSON.parse(sectionsContainer.getAttribute('data-sections') || '[]');

        const sectionIndex = sections.findIndex(s => s.id === sectionId);
        if (sectionIndex === -1) return;

        // Calculate available space
        const availableSpace = this.calculateAvailableSpaceAfterSection(sectionIndex, sections);

        // Update the section height
        sections[sectionIndex].height = availableSpace;
        sections[sectionIndex].flexible = true;

        // Update sections data
        sectionsContainer.setAttribute('data-sections', JSON.stringify(sections));

        // Re-render sections
        this.renderTemplateSections(sections);

        // Show notification
        this.showNotification(Lang.get('paperworkSectionExpandedToEndOfPage'));
    }
    calculateAvailableSpaceAfterSection(sectionIndex, sections) {
        // Get A4 dimensions minus margins
        const usablePageHeight = this.A4_HEIGHT_PX - this.PAGE_MARGINS.top - this.PAGE_MARGINS.bottom;

        // Calculate height of all sections up to this one
        let totalHeightBefore = 0;
        for (let i = 0; i <= sectionIndex; i++) {
            const section = sections[i];
            const sectionElement = document.querySelector(`.template-section[data-section-index="${i}"]`);

            if (sectionElement) {
                totalHeightBefore += sectionElement.offsetHeight;
            }
        }

        // Available space is what's left on the page
        const availableSpace = Math.max(50, usablePageHeight - totalHeightBefore + 50); // Add 50px as this empty section has padding

        return availableSpace;
    }
    saveTemplateDesign() {
        // Get template name
        const templateName = document.getElementById('template-name').value.trim();
        if (!templateName) {
            alert(Lang.get('paperworkPleaseEnterReportName'));
            return;
        }

        // Get sections from container
        const sectionsContainer = document.getElementById('template-sections-container');
        let sections = [];

        try {
            sections = JSON.parse(sectionsContainer.getAttribute('data-sections') || '[]');
        } catch (error) {
            console.error('Error parsing sections:', error);
        }

        if (sections.length === 0) {
            alert(Lang.get('paperworkPleaseAddAtLeastOneSection'));
            return;
        }

        // Create temporary document in memory
        const reportContent = this.generateReportFromSections(sections, templateName);

        // Close designer and show document preview
        this.closeFloatingWindow();

        // Show document preview with generated content
        setTimeout(() => {
            this.showDocumentPreview(reportContent, templateName);
        }, 300);
    }
    insertPageBreak(sectionId) {
        // Get the section to update
        const sectionsContainer = document.getElementById('template-sections-container');
        let sections = JSON.parse(sectionsContainer.getAttribute('data-sections') || '[]');
        const sectionIndex = sections.findIndex(s => s.id === sectionId);

        if (sectionIndex === -1) return;

        // Update the section height to be large enough for a page break
        sections[sectionIndex].height = 500;  // Guaranteed to create a page break in most cases
        sections[sectionIndex].isPageBreak = true;

        // Update sections data
        sectionsContainer.setAttribute('data-sections', JSON.stringify(sections));

        // Re-render the section
        this.renderTemplateSections(sections);

        // Show notification
        this.showNotification(Lang.get('paperworkPageBreakSpaceInserted'));
    }

    showDocumentPreview(content, title) {
        this.showFloatingWindow(
            title,
            `<div class="document-preview">
            <div class="document-content">
                ${content}
            </div>
            <div class="document-actions">
                <p>Your report is ready. You can now print it or save it as PDF.</p>
            </div>
        </div>`,
            [
                {
                    text: Lang.get('paperworkPrint'),
                    type: 'primary',
                    action: () => window.print()
                },
                {
                    text: Lang.get('paperworkNewReport'),
                    type: 'secondary',
                    action: () => {
                        this.closeFloatingWindow();
                        setTimeout(() => this.paperwork.uiHelpers.showTemplateDesigner(), 300);
                    }
                },
                {
                    text: Lang.get('paperworkClose'),
                    type: 'secondary',
                    action: () => this.closeFloatingWindow()
                }
            ]
        );
    }
    generateReportFromSections(sections, title) {
        let reportContent = `<h1>${title}</h1>\n\n`;

        // Convert sections to markdown/HTML content
        sections.forEach(section => {
            switch (section.type) {
                case 'document-header':
                    reportContent += `<h1>${section.title || Lang.get('paperworkDocumentTitle')}</h1>\n`;
                    reportContent += `<p class="subtitle">${section.subtitle || ''}</p>\n\n`;
                    break;

                case 'section-header':
                    reportContent += `<h2>${section.title || Lang.get('paperworkSectionHeader')}</h2>\n\n`;
                    break;

                case 'text-input':
                case 'text-area':
                    reportContent += `<h3>${section.label || 'Text Field'}</h3>\n`;
                    reportContent += `<p class="placeholder">${section.placeholder || Lang.get('paperworkEnterTextHere')}</p>\n\n`;
                    break;

                case 'picture-row':
                    reportContent += `<div class="image-row">
                            <div class="image-placeholder"></div>
                            <div class="image-placeholder"></div>
                            <div class="image-placeholder"></div>
                            <div class="image-placeholder"></div>
                        </div>\n`;
                    reportContent += `<p class="image-caption">${section.caption || Lang.get('paperworkAddCaptionHere')}</p>\n\n`;
                    break;
            }
        });

        return reportContent;
    }
    updateSectionContent(element) {
        const sectionId = element.getAttribute('data-section-id');
        const field = element.getAttribute('data-field');
        const newContent = element.innerHTML.trim();

        const sectionsContainer = document.getElementById('template-sections-container');
        let sections = JSON.parse(sectionsContainer.getAttribute('data-sections') || '[]');

        // Find the section and update the field
        const section = sections.find(s => s.id === sectionId);
        if (section && field) {
            // If content is empty, restore default placeholder
            if (newContent === '') {
                // Get default content for this section type and field
                const defaultContent = this.getDefaultContent(section.type, field);
                element.innerHTML = defaultContent;

                // Update the section with default content
                section[field] = defaultContent;

                // Reset styles to placeholder appearance
                element.style.fontStyle = 'italic';
                element.style.color = '#666';
            } else {
                // Create _previousValues object if it doesn't exist
                if (!section._previousValues) {
                    section._previousValues = {};
                }

                // Only store the previous value if we don't already have one for this field
                if (!section._previousValues[field]) {
                    section._previousValues[field] = section[field];
                }

                // Update the field with new content
                section[field] = newContent;
            }

            // Update sections data
            sectionsContainer.setAttribute('data-sections', JSON.stringify(sections));

            // Show the undo button if we have previous values
            if (section._previousValues && Object.keys(section._previousValues).length > 0) {
                const undoBtn = document.querySelector(`.undo-edit-btn[data-section-id="${sectionId}"]`);
                if (undoBtn) {
                    undoBtn.style.display = 'inline-block';
                }
            }
        }
    }
    // Add this helper method to get default content for a section type and field
    getDefaultContent(sectionType, field) {
        const defaultContent = {
            'document-header': {
                'title': Lang.get('paperworkDocumentTitle'),
                'subtitle': Lang.get('paperworkDocumentSubtitle')
            },
            'section-header': {
                'title': Lang.get('paperworkSectionHeader')
            },
            'text-area': {
                'label': Lang.get('paperworkTextAreaField'),
                'placeholder': Lang.get('paperworkEnterLongerTextHere')
            },
            'text-image-right': {
                'label': Lang.get('paperworkTextWithImage'),
                'textPlaceholder': Lang.get('paperworkEnterTextHere')
            },
            'image-text-right': {
                'label': Lang.get('paperworkImageWithText'),
                'textPlaceholder': Lang.get('paperworkEnterTextHere')
            },
            'picture-gallery': {
                'label': Lang.get('paperworkImageGallery')
            },
            'picture-row': {
                'label': Lang.get('paperworkImageRow'),
                'caption': Lang.get('paperworkAddCaptionHere')
            },
        };

        // Return default content if defined
        if (defaultContent[sectionType] && defaultContent[sectionType][field]) {
            return defaultContent[sectionType][field];
        }

        // Fallbacks for field types
        switch (field) {
            case 'title': return Lang.get('paperworkDocumentTitle');
            case 'subtitle': return Lang.get('paperworkDocumentSubtitle');
            case 'label': return Lang.get('paperworkTextAreaField');
            case 'placeholder': return Lang.get('paperworkEnterTextHere');
            case 'textPlaceholder': return Lang.get('paperworkEnterTextHere');
            default: return Lang.get('paperworkClickToEdit');s
        }
    }
    async enhanceWithAI(sectionId, fields) {
        const sectionsContainer = document.getElementById('template-sections-container');
        let sections = JSON.parse(sectionsContainer.getAttribute('data-sections') || '[]');

        const section = sections.find(s => s.id === sectionId);
        if (!section) return;

        // Create a fresh _previousValues object for this AI enhancement operation
        // This ensures we're storing the current user values, not the original placeholders
        section._previousValues = {};

        // Collect text to enhance and store current values for undo
        let textToEnhance = '';
        let fieldLabels = {};

        fields.forEach(field => {
            if (section[field]) {
                // Store the current value for undo BEFORE sending to AI
                section._previousValues[field] = section[field];

                textToEnhance += `[${field}]: ${section[field]}\n\n`;
                fieldLabels[field] = this.getFieldFriendlyName(field);
            }
        });

        if (!textToEnhance) {
            alert(Lang.get('paperworkNoTextToEnhance'));
            return;
        }

        // Show loading state
        this.paperwork.uiHelpers.showLoadingState(Lang.get('paperworkEnhancingWithAI'));

        // Create the system prompt for AI text enhancement
        const systemPrompt = `
        You are an expert editor and writing assistant helping to improve text for a technical report.
        Your task is to enhance the provided text by:
        1. Improving clarity and readability
        2. Fixing any grammar or spelling errors
        3. Making the tone professional and consistent
        4. Making the text more concise and impactful
        5. Preserving the original meaning and information
        
        IMPORTANT: For each section in brackets like [title] or [subtitle], you MUST return the enhanced version with EXACTLY the same marker format.
        
        Example input:
        [title]: Draft Title
        [subtitle]: Draft subtitle
        
        Example output:
        [title]: Improved Title
        [subtitle]: Improved subtitle
        
        Maintain the EXACT format with brackets and colon. Only return the enhanced text.
    `;

        try {
            // Call AI service to enhance text
            const enhancedText = await this.paperwork.uiHelpers.callAIService(
                systemPrompt,
                `Please enhance the following text for my technical report:\n\n${textToEnhance}`
            );

           //console.log('Raw AI response:', JSON.stringify(enhancedText));

            // If there was a response, process it
            if (enhancedText && enhancedText !== "AI failed to reply" && enhancedText !== "AI model not selected") {
                // Parse the enhanced text to extract sections
                const enhancedFields = this.parseEnhancedText(enhancedText, fields);

                // Check if we actually got any enhanced fields
                if (Object.keys(enhancedFields).length === 0) {
                    console.error('No fields were extracted from AI response');
                    alert(Lang.get('paperworkAIResponseProcessError'));
                    this.paperwork.uiHelpers.clearLoadingState();
                    return;
                }

                // Update section with enhanced text
                fields.forEach(field => {
                    if (enhancedFields[field]) {
                        // Update the field with AI enhanced content
                        section[field] = enhancedFields[field];

                        // Update the visible content
                        const element = document.querySelector(`.editable-content[data-section-id="${sectionId}"][data-field="${field}"]`);
                        if (element) {
                            element.innerHTML = enhancedFields[field];
                        }
                    }
                });

                // Update sections data
                sectionsContainer.setAttribute('data-sections', JSON.stringify(sections));

                // Show the undo button
                const undoBtn = document.querySelector(`.undo-edit-btn[data-section-id="${sectionId}"]`);
                if (undoBtn) {
                    undoBtn.style.display = 'inline-block';
                }
            } else {
                if (enhancedText === "AI model not selected") {
                    alert(Lang.get('paperworkSelectAIModelFirst'));
                } else {
                    alert(Lang.get('paperworkAIServiceUnableToEnhance'));
                }
            }
        } catch (error) {
            console.error('Error enhancing text with AI:', error);
            alert(Lang.get('paperworkErrorEnhancingWithAI'));
        } finally {
            // Clear loading state
            this.paperwork.uiHelpers.clearLoadingState();
        }
    }
    parseEnhancedText(enhancedText, fields) {
       //console.log('Parsing AI response:', enhancedText);
        const result = {};

        // First, try looking for the format [field]: content
        fields.forEach(field => {
            // Check for regular format with field name in brackets
            const bracketRegex = new RegExp(`\\[${field}\\]:\\s*([\\s\\S]*?)(?=\\[\\w+\\]:|$)`, 'i');
            const bracketMatch = enhancedText.match(bracketRegex);

            if (bracketMatch && bracketMatch[1]) {
                result[field] = bracketMatch[1].trim();
               //console.log(`Extracted ${field} using bracket format:`, result[field]);
            } else {
                // As a fallback, try to identify content based on field name as heading
                const headingRegex = new RegExp(`${this.getFieldFriendlyName(field)}:\\s*([\\s\\S]*?)(?=(?:\\w+):|$)`, 'i');
                const headingMatch = enhancedText.match(headingRegex);

                if (headingMatch && headingMatch[1]) {
                    result[field] = headingMatch[1].trim();
                   //console.log(`Extracted ${field} using heading format:`, result[field]);
                } else {
                   //console.log(`Could not extract ${field} from AI response`);
                }
            }
        });

        // If we haven't found anything yet and there's only one field, use the entire response
        if (Object.keys(result).length === 0 && fields.length === 1) {
            result[fields[0]] = enhancedText.trim();
           //console.log(`Using entire response for ${fields[0]}`);
        }

        return result;
    }

    // Method to get friendly field names for AI prompts
    getFieldFriendlyName(field) {
        const fieldNames = {
            'title': 'Title',
            'subtitle': 'Subtitle',
            'label': 'Label',
            'placeholder': 'Content',
            'textPlaceholder': 'Text Content'
        };

        return fieldNames[field] || field;
    }
    undoChanges(sectionId) {
        const sectionsContainer = document.getElementById('template-sections-container');
        let sections = JSON.parse(sectionsContainer.getAttribute('data-sections') || '[]');

        const section = sections.find(s => s.id === sectionId);
        if (!section || !section._previousValues) return;

       //console.log('Undoing changes for section:', sectionId, 'Previous values:', section._previousValues);

        // Restore previous values
        Object.keys(section._previousValues).forEach(field => {
            // Only update if there's actually a previous value to restore
            if (section._previousValues[field]) {
                section[field] = section._previousValues[field];

                // Update the visible content
                const element = document.querySelector(`.editable-content[data-section-id="${sectionId}"][data-field="${field}"]`);
                if (element) {
                    element.innerHTML = section._previousValues[field];
                }
            }
        });

        // Clear previous values
        delete section._previousValues;

        // Update sections data
        sectionsContainer.setAttribute('data-sections', JSON.stringify(sections));

        // Hide the undo button
        const undoBtn = document.querySelector(`.undo-edit-btn[data-section-id="${sectionId}"]`);
        if (undoBtn) {
            undoBtn.style.display = 'none';
        }
    }

    // Add a method to handle closeFloatingWindow for previewing
    closeFloatingWindow() {
        // Use the UI helper's method
        this.paperwork.uiHelpers.closeFloatingWindow();
    }
    // Add this helper method
    isDefaultContent(section, field, currentContent) {
        // Default content based on section type and field
        const defaultContent = {
            'document-header': {
                'title': Lang.get('paperworkDocumentTitle'),
                'subtitle': Lang.get('paperworkDocumentSubtitle')
            },
            'section-header': {
                'title': Lang.get('paperworkSectionHeader')
            },
            'text-area': {
                'label': Lang.get('paperworkTextAreaField'),
                'placeholder': Lang.get('paperworkEnterLongerTextHere')
            },
            'text-image-right': {
                'label': Lang.get('paperworkTextWithImage'),
                'textPlaceholder': Lang.get('paperworkEnterTextHere')
            },
            'image-text-right': {
                'label': Lang.get('paperworkImageWithText'),
                'textPlaceholder': Lang.get('paperworkEnterTextHere')
            },
            'picture-gallery': {
                'label': Lang.get('paperworkImageGallery')
            }
        };

        // Check if section type exists in our mapping
        if (defaultContent[section.type] && defaultContent[section.type][field]) {
            return currentContent === defaultContent[section.type][field];
        }

        // For fallback, check if content matches these common placeholder patterns
        return (
            currentContent === Lang.get('paperworkDocumentTitle') ||
            currentContent === Lang.get('paperworkSectionHeader') ||
            currentContent === Lang.get('paperworkEnterTextHere') ||
            currentContent === Lang.get('paperworkEnterLongerTextHere') ||
            currentContent === Lang.get('paperworkDocumentSubtitle') ||
            currentContent === Lang.get('paperworkTextAreaField') ||
            currentContent === Lang.get('paperworkTextWithImage') ||
            currentContent === Lang.get('paperworkImageWithText') ||
            currentContent === Lang.get('paperworkImageGallery')
        );
    }

    // Add this function at the end of the class (before the closing bracket)
    showNotification(message) {
        // Remove any existing notifications first
        const existingNotifications = document.querySelectorAll('.template-notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'template-notification';

        // Apply theme-aware styling
        notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 16px;
        background-color: var(--bg-color, #fff);
        color: var(--text-color, #333);
        border: 1px solid var(--border-color, #eee);
        border-left: 4px solid var(--accent-color, #4f46e5);
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1100;
        max-width: 300px;
        animation: templateNotificationSlideIn 0.3s ease-out;
    `;

        // Add the message text
        notification.innerHTML = `<p style="margin: 0; color: var(--text-color, #333);">${message}</p>`;

        // Add to the document
        document.body.appendChild(notification);

        // Add keyframes for the animation if not already present
        if (!document.getElementById('template-notification-keyframes')) {
            const keyframes = document.createElement('style');
            keyframes.id = 'template-notification-keyframes';
            keyframes.textContent = `
            @keyframes templateNotificationSlideIn {
                from {transform: translateX(50px); opacity: 0;}
                to {transform: translateX(0); opacity: 1;}
            }
            
            @keyframes templateNotificationFadeOut {
                from {opacity: 1;}
                to {opacity: 0;}
            }
            
            .template-notification.fade-out {
                animation: templateNotificationFadeOut 0.5s ease-out forwards;
            }
        `;
            document.head.appendChild(keyframes);
        }

        // Remove the notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
    // Process an image file, resize and compress it if needed
    async processImage(file, maxWidth = 800, maxHeight = 600, quality = 0.7) {
        // For multi-image reports, use even more aggressive compression
        if (file._isMultipleImages) {
            maxWidth = 600;
            maxHeight = 450;
            quality = 0.5;
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Check image dimensions
                    let width = img.width;
                    let height = img.height;

                    // If image is too large, calculate new dimensions
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.floor(width * ratio);
                        height = Math.floor(height * ratio);
                    }

                    // Create canvas for resizing
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');

                    // Draw image on canvas at new size
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to base64 with quality parameter
                    const resizedImage = canvas.toDataURL('image/jpeg', quality);

                    // Calculate size in KB
                    const sizeInKB = Math.round(resizedImage.length * 0.75 / 1024);

                    resolve({
                        dataUrl: resizedImage,
                        width,
                        height,
                        sizeInKB
                    });
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = event.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }
    // Check if image file size is too large for email
    checkImageSize(file, isMultipleImages = false) {
        return new Promise((resolve) => {
            // For reports with multiple images, use a stricter limit per image
            // 1MB per image is more reasonable for reports with multiple images
            // Standard email attachment total size limit is typically 20-25MB
            const maxSizeBytes = isMultipleImages ? 1 * 1024 * 1024 : 2 * 1024 * 1024;

            if (file.size > maxSizeBytes) {
                const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
                let message = '';

                if (isMultipleImages) {
                    message = `This image is ${sizeInMB}MB, which is too large for a multi-image report. 
                          A typical report with multiple images should keep each image under 1MB to maintain a reasonable total size. 
                          Would you like to automatically reduce this image's size?`;
                } else {
                    message = `This image is ${sizeInMB}MB, which may be too large for email or reports. 
                          Would you like to reduce its size?`;
                }

                if (confirm(message)) {
                    resolve(true); // User agreed to reduce size
                } else {
                    resolve(false); // User wants to keep original size
                }
            } else {
                resolve(false); // No resizing needed
            }
        });
    }
    async handleImageUpload(file, sectionId, imageIndex, placeholder) {
        // Verify it's an image file
        if (!file.type.startsWith('image/')) {
            alert(Lang.get('paperworkPleaseSelectImageFile'));
            return;
        }

        // Get the section to determine if it's a multi-image section
        const sectionsContainer = document.getElementById('template-sections-container');
        let sections = JSON.parse(sectionsContainer.getAttribute('data-sections') || '[]');
        const section = sections.find(s => s.id === sectionId);

        if (!section) return;

        // Determine if this is a multi-image section type
        const isMultiImageSection = ['picture-gallery', 'picture-row'].includes(section.type);

        // Check if image is too large based on section type
        const needsResizing = await this.checkImageSize(file, isMultiImageSection);
        let processedImage;

        try {
            // Show loading state in the placeholder
            placeholder.innerHTML = `<div style="text-align: center;">${Lang.get('paperworkProcessingImage')}</div>`;
            // Process the image (resize and compress)
            // Use stricter parameters for multi-image sections
            if (isMultiImageSection) {
                file._isMultipleImages = true; // Mark file for special processing
            }

            processedImage = await this.processImage(
                file,
                isMultiImageSection ? 600 : 800,  // Smaller max width for multi-image sections
                isMultiImageSection ? 450 : 600,  // Smaller max height for multi-image sections
                needsResizing ? 0.4 : (isMultiImageSection ? 0.6 : 0.8)  // Lower quality for multi-image sections
            );

            // Update the UI to show the processed image
            placeholder.innerHTML = `
            <img src="${processedImage.dataUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
            <input type="file" class="image-file-input" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;" accept="image/*">
        `;

            // Initialize images array if it doesn't exist
            if (!section.images) {
                section.images = [];
            }

            // Store the image data
            section.images[parseInt(imageIndex)] = processedImage.dataUrl;

            // Update the sections data
            sectionsContainer.setAttribute('data-sections', JSON.stringify(sections));

            // Show a notification with different text for multi-image sections
            if (isMultiImageSection) {
                this.showNotification(Lang.get('paperworkImageAddedOptimized', { size: processedImage.sizeInKB }));
            } else {
                this.showNotification(Lang.get('paperworkImageAdded', { size: processedImage.sizeInKB }));
            }
        } catch (error) {
            console.error('Image processing error:', error);
            placeholder.innerHTML = `
            <div class="placeholder-text" style="color: #ff4d4f;">
                ${Lang.get('paperworkErrorProcessingImage')}
            </div>            
            <input type="file" class="image-file-input" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;" accept="image/*">
        `;
            alert(Lang.get('paperworkImageProcessingError'));
        }
    }
    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    async saveTemplate() {
        // Get template name
        const templateName = document.getElementById('template-name').value.trim();
        if (!templateName) {
            alert(Lang.get('paperworkEnterReportNameToSave'));
            return;
        }

        // Get sections from container
        const sectionsContainer = document.getElementById('template-sections-container');
        let sections = [];

        try {
            sections = JSON.parse(sectionsContainer.getAttribute('data-sections') || '[]');
        } catch (error) {
            console.error('Error parsing sections:', error);
            alert(Lang.get('paperworkErrorParsingTemplateSections'));
            return;
        }

        if (sections.length === 0) {
            alert(Lang.get('paperworkAddAtLeastOneSectionToTemplate'));
            return;
        }

        // Show loading state
        this.paperwork.uiHelpers.showLoadingState(Lang.get('paperworkSaving'));

        try {
            // Create template object
            const template = {
                id: this.generateUniqueId(),
                name: templateName,
                sections: sections,
                created: new Date().toISOString()
            };

            // Save template to database
            const hashedMasterKey = await PaiperworkDB.hashMasterKeyValue('reportTemplates');

            // Get existing templates
            let templates = [];
            const existingTemplatesStr = localStorage.getItem('reportTemplates');
            if (existingTemplatesStr) {
                try {
                    const encryptedTemplates = JSON.parse(existingTemplatesStr);
                    const decryptedTemplatesStr = await PaiperworkDB.decrypt(hashedMasterKey, encryptedTemplates);
                    templates = JSON.parse(decryptedTemplatesStr || '[]');
                } catch (e) {
                    console.error('Error parsing existing templates:', e);
                }
            }

            // Check if a template with this name already exists
            const existingIndex = templates.findIndex(t => t.name === templateName);
            if (existingIndex >= 0) {
                if (!confirm(`A template named "${templateName}" already exists. Do you want to replace it?`)) {
                    this.paperwork.uiHelpers.clearLoadingState();
                    return;
                }
                templates[existingIndex] = template;
            } else {
                templates.push(template);
            }

            // Save updated templates list
            const updatedTemplatesStr = JSON.stringify(templates);
            const encryptedTemplates = await PaiperworkDB.encrypt(hashedMasterKey, updatedTemplatesStr);
            localStorage.setItem('reportTemplates', JSON.stringify(encryptedTemplates));

            this.paperwork.uiHelpers.clearLoadingState();

            // Show success message
            this.showNotification(Lang.get('paperworkTemplateSavedSuccessfully', { templateName }));
        } catch (error) {
            console.error('Error saving template:', error);
            this.paperwork.uiHelpers.clearLoadingState();
            alert(Lang.get('paperworkErrorSavingTemplate'));
        }
    }

    async loadTemplate() {
        try {
            // Show loading state
            this.paperwork.uiHelpers.showLoadingState(Lang.get('paperworkLoadingTemplates'));

            // Get templates from database
            const hashedMasterKey = await PaiperworkDB.hashMasterKeyValue('reportTemplates');
            const existingTemplatesStr = localStorage.getItem('reportTemplates');

            if (!existingTemplatesStr) {
                this.paperwork.uiHelpers.clearLoadingState();
                alert(Lang.get('paperworkNoSavedTemplatesFound'));
                return;
            }

            const encryptedTemplates = JSON.parse(existingTemplatesStr);
            const decryptedTemplatesStr = await PaiperworkDB.decrypt(hashedMasterKey, encryptedTemplates);
            const templates = JSON.parse(decryptedTemplatesStr || '[]');

            this.paperwork.uiHelpers.clearLoadingState();

            if (templates.length === 0) {
                alert(Lang.get('paperworkNoSavedTemplatesFound'));
                return;
            }

            // Show template selection dialog
            this.showTemplateSelectionDialog(templates);
        } catch (error) {
            console.error('Error loading templates:', error);
            this.paperwork.uiHelpers.clearLoadingState();
            alert(Lang.get('paperworkErrorLoadingTemplates'));
        }
    }

    showTemplateSelectionDialog(templates) {
        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'template-selection-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: var(--bg-color, white);
            color: var(--text-color, #333);
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            min-width: 400px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            border: 1px solid var(--border-color, #eee);
        `;

        // Create content
        let dialogContent = `
        <h3 style="margin-top: 0; margin-bottom: 15px;">${Lang.get('paperworkLoadTemplate')}</h3>
        <p style="margin-bottom: 15px;">${Lang.get('paperworkSelectTemplateToLoad')}</p>
            <div class="template-list" style="margin-bottom: 20px; max-height: 50vh; overflow-y: auto;">
        `;

        // Add templates with specific classes for targeting
        templates.forEach(template => {
            const created = new Date(template.created);
            const formattedDate = created.toLocaleDateString() + ' ' + created.toLocaleTimeString();

            dialogContent += `
                <div class="template-item" data-template-id="${template.id}" style="padding: 10px; margin-bottom: 8px; border: 1px solid var(--border-color, #ddd); border-radius: 4px; cursor: pointer; transition: all 0.2s;">
                    <div class="item-title" style="font-weight: bold; color: var(--text-color, #333);">${template.name}</div>
                    <div class="item-details" style="font-size: 12px; color: var(--text-secondary, #666);">${Lang.get('paperworkCreated')}: ${formattedDate}</div>
                    <div class="item-details" style="font-size: 12px; color: var(--text-secondary, #666);">${Lang.get('paperworkSectionsCount', { count: template.sections.length })}</div>
                </div>
            `;
        });

        dialogContent += `</div>`;

        // Add buttons
        dialogContent += `
            <div class="dialog-buttons" style="text-align: right; margin-top: 20px;">
                <button id="delete-template-btn" style="float: left; padding: 8px 15px; 
                <button id="delete-template-btn" style="float: left; padding: 8px 15px; 
                       background: var(--delete-button-bg, #f44336); 
                       color: white;
                       border: none; 
                       border-radius: 4px; cursor: pointer; display: none;">${Lang.get('paperworkDelete')}</button>
                       
                <button id="cancel-template-selection" style="margin-right: 10px; padding: 8px 15px; 
                       background: var(--button-secondary-bg, #f5f5f5); 
                       color: var(--button-secondary-text, #333);
                       border: 1px solid var(--border-color, #ddd); 
                       border-radius: 4px; cursor: pointer;">${Lang.get('paperworkCancel')}</button>
            </div>
        `;

        dialog.innerHTML = dialogContent;
        document.body.appendChild(dialog);

        // Add event listeners
        document.getElementById('cancel-template-selection').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });

        const deleteBtn = document.getElementById('delete-template-btn');

        // Add click event for template items
        let selectedTemplateId = null;

        dialog.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                // Use primary color for better visibility in both light and dark modes
                item.style.backgroundColor = 'var(--primary-color, #4f46e5)';
                item.style.borderColor = 'var(--primary-color, #4f46e5)';

                // Change text color to ensure readability on colored background
                const titleElement = item.querySelector('.item-title');
                const detailElements = item.querySelectorAll('.item-details');

                if (titleElement) titleElement.style.color = 'white';
                detailElements.forEach(el => el.style.color = 'rgba(255, 255, 255, 0.8)');
            });

            item.addEventListener('mouseleave', () => {
                if (item.getAttribute('data-template-id') !== selectedTemplateId) {
                    // Reset styles when not selected
                    item.style.backgroundColor = '';
                    item.style.borderColor = 'var(--border-color, #ddd)';

                    // Reset text color to theme variables
                    const titleElement = item.querySelector('.item-title');
                    const detailElements = item.querySelectorAll('.item-details');

                    if (titleElement) titleElement.style.color = 'var(--text-color, #333)';
                    detailElements.forEach(el => el.style.color = 'var(--text-secondary, #666)');
                }
            });

            item.addEventListener('click', () => {
                // Deselect previously selected item
                if (selectedTemplateId) {
                    const prevSelected = dialog.querySelector(`.template-item[data-template-id="${selectedTemplateId}"]`);
                    if (prevSelected) {
                        prevSelected.style.backgroundColor = '';
                        prevSelected.style.borderColor = 'var(--border-color, #ddd)';

                        // Reset text colors on previously selected item
                        const prevTitleElement = prevSelected.querySelector('.item-title');
                        const prevDetailElements = prevSelected.querySelectorAll('.item-details');

                        if (prevTitleElement) prevTitleElement.style.color = 'var(--text-color, #333)';
                        prevDetailElements.forEach(el => el.style.color = 'var(--text-secondary, #666)');
                    }
                }

                // Select this item
                const templateId = item.getAttribute('data-template-id');
                selectedTemplateId = templateId;

                // Apply selected styles with white text for contrast
                item.style.backgroundColor = 'var(--primary-color, #4f46e5)';
                item.style.borderColor = 'var(--primary-color, #4f46e5)';

                const titleElement = item.querySelector('.item-title');
                const detailElements = item.querySelectorAll('.item-details');

                if (titleElement) titleElement.style.color = 'white';
                detailElements.forEach(el => el.style.color = 'rgba(255, 255, 255, 0.8)');

                // Show delete button
                deleteBtn.style.display = 'block';

                // Double-click to load template
                const selectedTemplate = templates.find(t => t.id === templateId);
                if (selectedTemplate) {
                    this.applyTemplate(selectedTemplate);
                    document.body.removeChild(dialog);
                }
            });
        });

        // Delete button functionality
        deleteBtn.addEventListener('click', async () => {
            if (!selectedTemplateId) return;

            const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
            if (!selectedTemplate) return;

            if (confirm(Lang.get('paperworkDeleteTemplateConfirm', { templateName: selectedTemplate.name }))) {
                this.paperwork.uiHelpers.showLoadingState('Deleting template...');

                try {
                    const hashedMasterKey = await PaiperworkDB.hashMasterKeyValue('reportTemplates');
                    const filteredTemplates = templates.filter(t => t.id !== selectedTemplateId);

                    // Save updated templates list
                    const updatedTemplatesStr = JSON.stringify(filteredTemplates);
                    const encryptedTemplates = await PaiperworkDB.encrypt(hashedMasterKey, updatedTemplatesStr);
                    localStorage.setItem('reportTemplates', JSON.stringify(encryptedTemplates));

                    this.paperwork.uiHelpers.clearLoadingState();

                    // Update the dialog
                    document.body.removeChild(dialog);

                    if (filteredTemplates.length > 0) {
                        this.showTemplateSelectionDialog(filteredTemplates);
                    } else {
                        this.showNotification(`Template "${selectedTemplate.name}" deleted`);
                    }
                } catch (error) {
                    console.error('Error deleting template:', error);
                    this.paperwork.uiHelpers.clearLoadingState();
                    alert(Lang.get('paperworkErrorDeletingTemplate', { error: 'Please try again' }));
                }
            }
        });
    }

    applyTemplate(template) {
        // Set template name
        const templateNameInput = document.getElementById('template-name');
        if (templateNameInput) {
            templateNameInput.value = template.name;
        }

        // Get sections container
        const sectionsContainer = document.getElementById('template-sections-container');
        if (!sectionsContainer) {
            console.error('Template sections container not found');
            return;
        }

        // Apply sections
        sectionsContainer.setAttribute('data-sections', JSON.stringify(template.sections));

        // Render sections
        this.renderTemplateSections(template.sections);

        // Show notification
        this.showNotification(Lang.get('paperworkTemplateLoadedSuccessfully', { templateName: template.name }));
        setTimeout(() => {
            this.showNotification(
                Lang.get('paperworkTemplateNameChangeTip'),
                'info',
                5000
            );
        }, 1500);

        // Hide placeholder if this is the first section
        const placeholder = document.getElementById('canvas-placeholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
    }
    async manageTemplates() {
        try {
            // Show loading state
            this.paperwork.uiHelpers.showLoadingState(Lang.get('paperworkLoadingTemplates'));

            // Get templates from database
            const hashedMasterKey = await PaiperworkDB.hashMasterKeyValue('reportTemplates');
            const existingTemplatesStr = localStorage.getItem('reportTemplates');

            if (!existingTemplatesStr) {
                this.paperwork.uiHelpers.clearLoadingState();
                alert(Lang.get('paperworkNoSavedTemplatesFound'));
                return;
            }

            const encryptedTemplates = JSON.parse(existingTemplatesStr);
            const decryptedTemplatesStr = await PaiperworkDB.decrypt(hashedMasterKey, encryptedTemplates);
            const templates = JSON.parse(decryptedTemplatesStr || '[]');

            this.paperwork.uiHelpers.clearLoadingState();

            if (templates.length === 0) {
                alert(Lang.get('paperworkNoSavedTemplatesFound'));
                return;
            }

            // Show template management dialog
            this.showTemplateManagementDialog(templates);
        } catch (error) {
            console.error('Error loading templates:', error);
            this.paperwork.uiHelpers.clearLoadingState();
            alert(Lang.get('paperworkErrorLoadingTemplates'));
        }
    }

    showTemplateManagementDialog(templates) {
        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'template-management-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: var(--bg-color, white);
            color: var(--text-color, #333);
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            min-width: 500px;
            max-width: 700px;
            max-height: 80vh;
            overflow-y: auto;
            border: 1px solid var(--border-color, #eee);
        `;

        // Create content
        let dialogContent = `
         <h3 style="margin-top: 0; margin-bottom: 15px;">${Lang.get('paperworkManageTemplates')}</h3>
         <p style="margin-bottom: 15px;">${Lang.get('paperworkTemplateManagementDescription')}</p>
            <div class="template-list" style="margin-bottom: 20px; max-height: 50vh; overflow-y: auto;">
        `;

        if (templates.length === 0) {
            dialogContent += `<p style="color: var(--text-secondary, #666); text-align: center; padding: 20px;">${Lang.get('paperworkNoTemplatesFound')}</p>`;
        } else {
            // Add templates with load and delete buttons for each
            templates.forEach(template => {
                const created = new Date(template.created);
                const formattedDate = created.toLocaleDateString() + ' ' + created.toLocaleTimeString();

                dialogContent += `
                    <div class="template-item" style="padding: 10px; margin-bottom: 8px; border: 1px solid var(--border-color, #ddd); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <div style="font-weight: bold;">${template.name}</div>
                            <div style="font-size: 12px; color: var(--text-secondary, #666);">Created: ${formattedDate}</div>
                            <div style="font-size: 12px; color: var(--text-secondary, #666);">${template.sections.length} sections</div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="template-load-btn" data-template-id="${template.id}" style="padding: 6px 10px; 
                                   background: var(--primary-color, #4f46e5); 
                                   color: white;
                                   border: none; 
                                   border-radius: 4px; cursor: pointer;">${Lang.get('paperworkLoad')}</button>
       
                            <button class="template-delete-btn" data-template-id="${template.id}" style="padding: 6px 10px; 
                                   background: var(--delete-button-bg, #f44336); 
                                   color: white;
                                   border: none; 
                                   border-radius: 4px; cursor: pointer;">${Lang.get('paperworkDelete')}</button>
                        </div>
                    </div>
                `;
            });
        }

        dialogContent += `</div>`;

        // Add close button
        dialogContent += `
            <div class="dialog-buttons" style="text-align: right; margin-top: 20px;">
                <button id="close-management-dialog" style="padding: 8px 15px; 
                       background: var(--button-secondary-bg, #f5f5f5); 
                       color: var(--button-secondary-text, #333);
                       border: 1px solid var(--border-color, #ddd); 
                       border-radius: 4px; cursor: pointer;">${Lang.get('paperworkClose')}</button>
            </div>
        `;

        dialog.innerHTML = dialogContent;
        document.body.appendChild(dialog);

        // Add event listeners
        document.getElementById('close-management-dialog').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });

        // Add event listeners for load and delete buttons
        dialog.querySelectorAll('.template-load-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const templateId = btn.getAttribute('data-template-id');
                const selectedTemplate = templates.find(t => t.id === templateId);

                if (selectedTemplate) {
                    this.applyTemplate(selectedTemplate);
                    document.body.removeChild(dialog);
                }
            });
        });

        dialog.querySelectorAll('.template-delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const templateId = btn.getAttribute('data-template-id');
                const selectedTemplate = templates.find(t => t.id === templateId);

                if (!selectedTemplate) return;

                if (confirm(Lang.get('paperworkDeleteTemplateConfirm', { templateName: selectedTemplate.name }))) {
                    this.paperwork.uiHelpers.showLoadingState('Deleting template...');

                    try {
                        const hashedMasterKey = await PaiperworkDB.hashMasterKeyValue('reportTemplates');
                        const filteredTemplates = templates.filter(t => t.id !== templateId);

                        // Save updated templates list
                        const updatedTemplatesStr = JSON.stringify(filteredTemplates);
                        const encryptedTemplates = await PaiperworkDB.encrypt(hashedMasterKey, updatedTemplatesStr);
                        localStorage.setItem('reportTemplates', JSON.stringify(encryptedTemplates));

                        this.paperwork.uiHelpers.clearLoadingState();

                        // Update the dialog - remove this item from the list
                        document.body.removeChild(dialog);

                        // If we still have templates, show the updated list
                        if (filteredTemplates.length > 0) {
                            this.showTemplateManagementDialog(filteredTemplates);
                        } else {
                            this.showNotification(Lang.get('paperworkTemplateDeleted', { templateName: selectedTemplate.name }));
                        }
                    } catch (error) {
                        console.error('Error deleting template:', error);
                        this.paperwork.uiHelpers.clearLoadingState();
                        alert(Lang.get('paperworkErrorDeletingTemplate', { error: 'Please try again' }));
                    }
                }
            });
        });
    }

    addFontSelector() {
        const fontSelector = document.createElement('div');
        fontSelector.className = 'font-selector-container';
        fontSelector.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        const title = document.createElement('div');
        title.style.fontWeight = '500';
        title.style.fontSize = '14px';
        title.style.whiteSpace = 'nowrap';
        title.textContent = Lang.get('paperworkPDFFont') + ':';

        const fontSelect = document.createElement('select');
        fontSelect.id = 'pdf-font-select';
        fontSelect.style.padding = '4px 6px';
        fontSelect.style.borderRadius = '4px';
        fontSelect.style.border = '1px solid var(--border-color, #ddd)';
        fontSelect.style.width = '150px';

        // Add common system fonts
        const fonts = [
            'Arial',
            'Helvetica',
            'Times New Roman',
            'Times',
            'Courier New',
            'Courier',
            'Verdana',
            'Georgia',
            'Palatino',
            'Garamond',
            'Bookman',
            'Tahoma',
            'Trebuchet MS'
        ];

        fonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font;
            option.style.fontFamily = font;
            fontSelect.appendChild(option);
        });

        // Set default to Arial or previously selected font (try secure storage first)
        (async () => {
            try {
                const got = await PaiperworkDB.secureLocalStorageGet('pdf-font-preference');
                fontSelect.value = got || 'Arial';
            } catch (e) {
                fontSelect.value = (localStorage.getItem('pdf-font-preference') || 'Arial');
            }
        })();

        // Store the selected font and update both preview and editor
        fontSelect.addEventListener('change', async () => {
            const newFont = fontSelect.value;
            try {
                await PaiperworkDB.secureLocalStorageSet('pdf-font-preference', newFont);
            } catch (e) {
                localStorage.setItem('pdf-font-preference', newFont);
            }
            this.showNotification(Lang.get('paperworkFontSetForPDF', { font: newFont }));

            // Update any open PDF preview
            this.updateOpenPreviewFont(newFont);

            // Update the main report editor
            this.updateReportEditorFont(newFont);
        });

        // Add preview button
        const previewBtn = document.createElement('button');
        previewBtn.textContent = Lang.get('paperworkPreview');
        previewBtn.style.cssText = `
            padding: 4px 8px;
            background: var(--primary-color, #4f46e5);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            white-space: nowrap;
            font-size: 13px;
        `;
        previewBtn.addEventListener('click', () => {
            this.previewPDF();
        });

        // Put it all together
        fontSelector.appendChild(title);
        fontSelector.appendChild(fontSelect);
        fontSelector.appendChild(previewBtn);

        return fontSelector;
    }
    updateReportEditorFont(newFont) {
        // Update all editable content in the template editor
        const sectionsContainer = document.getElementById('template-sections-container');
        if (!sectionsContainer) return;

        // Apply the font to all template pages
        const templatePages = document.querySelectorAll('.template-page');
        templatePages.forEach(page => {
            page.style.fontFamily = `'${newFont}', sans-serif`;
        });

        // Update all editable text elements
        const textElements = document.querySelectorAll('.editable-content, h1, h2, h3, p');
        textElements.forEach(element => {
            element.style.fontFamily = `'${newFont}', sans-serif`;
        });

        // Add a CSS rule to apply the font to all new elements added to the template
        const styleId = 'template-font-style';
        let fontStyle = document.getElementById(styleId);

        if (!fontStyle) {
            fontStyle = document.createElement('style');
            fontStyle.id = styleId;
            document.head.appendChild(fontStyle);
        }

        fontStyle.textContent = `
            #template-sections-container .template-page,
            #template-sections-container .editable-content,
            #template-sections-container h1,
            #template-sections-container h2,
            #template-sections-container h3,
            #template-sections-container p {
                font-family: '${newFont}', sans-serif !important;
            }
        `;

        // Also update font selector dropdown to reflect current selection
        const fontSelect = document.getElementById('pdf-font-select');
        if (fontSelect) {
            fontSelect.value = newFont;
        }

       //console.log(`Report editor font updated to: ${newFont}`);
    }
    updateOpenPreviewFont(newFont) {
        // Check if a preview dialog is currently open
        const previewDialog = document.querySelector('.pdf-preview-dialog');
        if (!previewDialog) return;

        // Update the header text to reflect the new font
        const headerText = previewDialog.querySelector('h3');
        if (headerText) {
            headerText.textContent = `PDF Preview (using ${newFont} font)`;
        }

        // Find the preview content container
        const contentContainer = previewDialog.querySelector('.pdf-page');
        if (contentContainer) {
            // Update the main container's font
            contentContainer.style.fontFamily = `'${newFont}', sans-serif !important`;

            // Update all text elements within the preview to use the new font
            const textElements = contentContainer.querySelectorAll('h1, h2, h3, p, div, span');
            textElements.forEach(element => {
                element.style.fontFamily = `'${newFont}', sans-serif !important`;
            });
        }

       //console.log(`PDF preview font updated to: ${newFont}`);
    }
    async previewPDF() {
        // Get template name
        const templateName = document.getElementById('template-name').value.trim() || 'Technical Report Preview';

        // Get selected font (prefer secure storage)
        let selectedFont = 'Arial';
        try {
            const got = await PaiperworkDB.secureLocalStorageGet('pdf-font-preference');
            if (got) selectedFont = got;
        } catch (e) {
            selectedFont = localStorage.getItem('pdf-font-preference') || 'Arial';
        }

        // Get sections
        const sectionsContainer = document.getElementById('template-sections-container');
        let sections;

        try {
            sections = JSON.parse(sectionsContainer.getAttribute('data-sections') || '[]');
            if (sections.length === 0) {
                alert(Lang.get('paperworkAddSectionBeforePreview'));
                return;
            }
        } catch (error) {
            console.error('Error parsing sections:', error);
            alert(Lang.get('paperworkErrorPreparingSections'));
            return;
        }

        // Show loading state
        this.paperwork.uiHelpers.showLoadingState(Lang.get('paperworkGeneratingPreview'));

        try {
            // Generate the full report content
            const reportContent = this.renderReportForPDF(sections, templateName, selectedFont);

            // Extract each page content properly
            const pageContents = [];
            const wrapper = document.createElement('div');
            wrapper.innerHTML = reportContent;
            const pageElements = wrapper.querySelectorAll('.pdf-page');

            pageElements.forEach(pageElement => {
                pageContents.push(pageElement.innerHTML);
            });

           //console.log(`Preview: Found ${pageContents.length} pages in PDF content`);

            // Create a preview dialog with theme-aware styling
            const previewDialog = document.createElement('div');
            previewDialog.className = 'pdf-preview-dialog';
            previewDialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80%;
                max-width: 800px;
                height: 80vh;
                background: var(--bg-color, white);
                color: var(--text-color, #333);
                z-index: 2000;
                border-radius: 8px;
                box-shadow: 0 0 20px rgba(0,0,0,0.3);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid var(--border-color, #eee);
            `;

            // Create header with title and close button
            const header = document.createElement('div');
            header.className = 'pdf-preview-header';
            header.style.cssText = `
                padding: 15px;
                border-bottom: 1px solid var(--border-color, #eee);
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;

            const title = document.createElement('h3');
            title.textContent = Lang.get('paperworkPDFPreviewTitle', { font: selectedFont });
            title.style.margin = '0';

            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-preview-btn';
            closeBtn.setAttribute('title', Lang.get('paperworkClose'));
            closeBtn.style.cssText = `
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                color: var(--text-color, #333);
            `;

            header.appendChild(title);
            header.appendChild(closeBtn);

            // Create content container with theme-aware styling
            const content = document.createElement('div');
            content.style.cssText = `
                flex: 1;
                overflow: auto;
                padding: 20px;
                background: var(--preview-bg, #f5f5f5);
            `;

            // Add each page with a page break indicator between them
            let previewHTML = '';
            pageContents.forEach((pageContent, index) => {
                if (index > 0) {
                    // Add page break indicator between pages
                    previewHTML += `
                        <div class="page-break-indicator" style="
                            margin: 15px 0;
                            border-bottom: 2px dashed #ff5722;
                            position: relative;
                            height: 20px;
                            background: white;
                            text-align: center;
                        ">
                            <span style="
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                background: #ff5722;
                                color: white;
                                padding: 2px 10px;
                                border-radius: 10px;
                                font-size: 12px;
                                font-weight: bold;
                           ">${Lang.get('paperworkPageBreakIndicator')}</span>
                        </div>
                    `;
                }

                previewHTML += `
                <div style="
                    background: white; 
                    padding: 40px; 
                    margin: 0 auto; 
                    max-width: ${this.A4_WIDTH_PX}px;
                    height: ${this.A4_HEIGHT_PX}px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                    color: #333;
                    position: relative;
                ">
                    <div class="page-indicator" style="
                        position: absolute;
                        top: 5px;
                        right: 10px;
                        background: #f0f0f0;
                        padding: 2px 8px;
                        border-radius: 10px;
                        font-size: 12px;
                        color: #666;
                    ">${Lang.get('paperworkPageNumber', { number: index + 1 })}</div>
                    ${pageContent}
                </div>
            `;
            });

            content.innerHTML = previewHTML;

            // Put it all together
            previewDialog.appendChild(header);
            previewDialog.appendChild(content);

            // Add backdrop with theme-aware styling
            const backdrop = document.createElement('div');
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: var(--modal-backdrop, rgba(0,0,0,0.5));
                z-index: 1999;
            `;

            // Add to document
            document.body.appendChild(backdrop);
            document.body.appendChild(previewDialog);

            // Add close functionality
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(previewDialog);
                document.body.removeChild(backdrop);
            });

            backdrop.addEventListener('click', () => {
                document.body.removeChild(previewDialog);
                document.body.removeChild(backdrop);
            });

        } catch (error) {
            console.error('Error generating preview:', error);
            alert(Lang.get('paperworkErrorGeneratingPreview'));
        } finally {
            this.paperwork.uiHelpers.clearLoadingState();
        }
    }
    async savePDF() {
        // Get template name
        const templateName = document.getElementById('template-name').value.trim() || 'Technical Report';

        // Get sections from container
        const sectionsContainer = document.getElementById('template-sections-container');
        let sections = [];

        try {
            sections = JSON.parse(sectionsContainer.getAttribute('data-sections') || '[]');
        } catch (error) {
            console.error('Error parsing sections:', error);
            alert(Lang.get('paperworkErrorPreparingSections'));
            return;
        }

        if (sections.length === 0) {
            alert(Lang.get('paperworkAddSectionBeforeSavingPDF'));
            return;
        }

        // Show loading state
        this.paperwork.uiHelpers.showLoadingState(Lang.get('paperworkGeneratingPDF'));

        try {
            // Get the selected font or use Arial as default (prefer secure storage)
            let selectedFont = 'Arial';
            try {
                const got = await PaiperworkDB.secureLocalStorageGet('pdf-font-preference');
                if (got) selectedFont = got;
            } catch (e) {
                selectedFont = localStorage.getItem('pdf-font-preference') || 'Arial';
            }
           //console.log(`Using font: ${selectedFont} for PDF export`);

            // Create a hidden container to render the report for PDF conversion
            const pdfContainer = document.createElement('div');
            pdfContainer.className = 'pdf-render-container';
            pdfContainer.style.position = 'absolute';
            pdfContainer.style.left = '-1000px';
            pdfContainer.style.top = '100px';
            pdfContainer.style.width = `${this.A4_WIDTH_PX}px`;
            pdfContainer.style.backgroundColor = 'white';  // Explicit white background
            pdfContainer.style.color = 'black';  // Explicit black text
            pdfContainer.style.border = 'none';  // No border
            pdfContainer.style.padding = `${this.PAGE_MARGINS.top}px ${this.PAGE_MARGINS.right}px ${this.PAGE_MARGINS.bottom}px ${this.PAGE_MARGINS.left}px`;
            pdfContainer.style.zIndex = '-1';
            document.body.appendChild(pdfContainer);

            // Add font preload to ensure it's available
            const fontPreloader = document.createElement('div');
            fontPreloader.style.fontFamily = selectedFont;
            fontPreloader.style.position = 'absolute';
            fontPreloader.style.opacity = '0';
            fontPreloader.textContent = 'Font Preloader';
            pdfContainer.appendChild(fontPreloader);

            // Render report content into the container
            const content = this.renderReportForPDF(sections, templateName, selectedFont);
            pdfContainer.innerHTML = content;


            // Wait for images and fonts to load completely
            await document.fonts.ready;
            await this.waitForImagesToLoad(pdfContainer);

            // Force browser to render fonts (longer timeout for better rendering)
            await new Promise(resolve => setTimeout(resolve, 500));

            // Ensure we have visible text for debugging
           //console.log('PDF container content:', pdfContainer.innerText.substring(0, 100) + '...');

            // Use html2canvas to convert each page to an image
            const pages = pdfContainer.querySelectorAll('.pdf-page');
            const pageCanvases = [];

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];

                // Debug page content
               //console.log(`Page ${i + 1} content length:`, page.innerText.length);

                const canvas = await html2canvas(page, {
                    scale: 2, // Higher resolution
                    useCORS: true,
                    logging: true,
                    backgroundColor: 'white',  // Force white background
                    letterRendering: true,
                    allowTaint: true,
                    foreignObjectRendering: false
                });

                pageCanvases.push(canvas);
            }

            // Create PDF using jsPDF
            const pdf = await this.generatePDF(pageCanvases, templateName);

            // Remove the temporary container
            document.body.removeChild(pdfContainer);

            // Clear loading state
            this.paperwork.uiHelpers.clearLoadingState();

            // Show success notification
            this.showNotification(Lang.get('paperworkPDFGeneratedSuccessfully'));

        } catch (error) {
            console.error('Error generating PDF:', error);
            this.paperwork.uiHelpers.clearLoadingState();
            alert(Lang.get('paperworkErrorGeneratingPDF'));
        }
    }
    renderReportForPDF(sections, title, selectedFont = 'Arial') {
        // Create an array to store each page's content separately
        const pages = [];
        let currentPageContent = '';
        let currentPageHeight = 60; // Starting height for title

        // Start the first page with the title
        currentPageContent = `<h1 style="font-family: '${selectedFont}', sans-serif !important; color: #333 !important; margin-bottom: 15px !important; font-size: 24px !important; background-color: white !important;">${title}</h1>`;

        // Calculate usable page height with some flexibility
        const pageHeight = this.A4_HEIGHT_PX - this.PAGE_MARGINS.top - this.PAGE_MARGINS.bottom;
        const maxPageFill = pageHeight * 1;

       //console.log(`PDF: Page height: ${pageHeight}px, Max fill: ${maxPageFill}px`);

        // Process each section
        sections.forEach((section, index) => {
            // Get section HTML and height
            const sectionHTML = this.renderSectionForPDF(section, selectedFont);
            const sectionHeight = this.estimateSectionHeight(section);

           //console.log(`PDF: Section ${index} (${section.type}): height=${sectionHeight}px, current page height=${currentPageHeight}px`);

            // Check if this is an explicit page break
            const isPageBreak = section.type === 'empty-space' && (section.isPageBreak || section.height >= 400);

            // Is this a section header?
            const isHeaderSection = section.type === 'section-header' || section.type === 'document-header';

            // Look ahead to next section if this is a header
            const nextSectionIsBig = (index < sections.length - 1) &&
                this.estimateSectionHeight(sections[index + 1]) > 150;

            // We need to break the page in these scenarios only:
            // 1. This section is explicitly marked as a page break
            // 2. Adding this section would exceed the maximum page fill AND the page already has content
            // 3. This is a header section AND the next section is big AND they won't both fit
            let shouldBreakPage = false;

            if (isPageBreak) {
                shouldBreakPage = true;
               //console.log(`PDF: Breaking page before section ${index} because: explicit page break`);
            }
            else if (currentPageHeight > 0 && (currentPageHeight + sectionHeight > maxPageFill)) {
                shouldBreakPage = true;
               //console.log(`PDF: Breaking page before section ${index} because: would exceed max page fill (${currentPageHeight + sectionHeight}px > ${maxPageFill}px)`);
            }
            else if (isHeaderSection && nextSectionIsBig && (currentPageHeight + sectionHeight + 150 > maxPageFill)) {
                shouldBreakPage = true;
               //console.log(`PDF: Breaking page before section ${index} because: would orphan header`);
            }

            // If we should break the page
            if (shouldBreakPage) {
                // Save current page and start a new one
                pages.push(currentPageContent);
                currentPageContent = '';
                currentPageHeight = 0;

               //console.log(`PDF: Starting new page ${pages.length + 1}`);

                // Skip rendering the empty space section that was just used as a page break
                if (isPageBreak && section.type === 'empty-space') {
                   //console.log(`PDF: Skipping empty space used for page break`);
                    return; // Skip this iteration
                }
            }

            // Add the section to current page
            currentPageContent += sectionHTML;
            currentPageHeight += sectionHeight;
           //console.log(`PDF: Added section, new page height: ${currentPageHeight}px`);
        });

        // Add the last page if it has content
        if (currentPageContent.length > 0) {
            pages.push(currentPageContent);
        }

        // Now build the final HTML with completely separate PDF pages inside a container div
        let content = '<div class="pdf-wrapper" style="background-color: white !important; color: black !important; width: 100% !important;">';

        // Add each page as a separate element
        pages.forEach((pageContent, pageIndex) => {
            content += `<div class="pdf-page pdf-page-${pageIndex + 1}" style="width: ${this.A4_WIDTH_PX - this.PAGE_MARGINS.left - this.PAGE_MARGINS.right}px; height: ${this.A4_HEIGHT_PX - this.PAGE_MARGINS.top - this.PAGE_MARGINS.bottom}px; position: relative; overflow: hidden; margin-bottom: 20px; font-family: '${selectedFont}', sans-serif !important; background-color: white !important; color: black !important; border: none !important;">${pageContent}</div>`;
        });

        // Close the wrapper div
        content += '</div>';

       //console.log(`PDF: Finished with ${pages.length} pages`);

        return content;
    }
    estimateSectionHeight(section) {
        // First approach: DOM measurement with correction
        const sectionElement = document.querySelector(`.template-section[data-section-id="${section.id}"]`);

        if (sectionElement) {
            // Get the actual rendered height
            const styles = window.getComputedStyle(sectionElement);
            const marginTop = parseInt(styles.marginTop) || 0;
            const marginBottom = parseInt(styles.marginBottom) || 0;

            // Get raw height
            const rawHeight = sectionElement.scrollHeight + marginTop + marginBottom;

            // Apply a CORRECTION FACTOR to account for editor UI elements
            // that aren't present in PDF output
            // Editor UI typically adds 70-120px per section depending on controls
            const uiControlsHeight = (() => {
                // Estimate UI control height based on section type
                switch (section.type) {
                    case 'document-header':
                    case 'section-header':
                        return 80; // Title sections have AI controls and edit buttons
                    case 'text-area':
                        return 60; // Text areas have minimal controls
                    case 'text-image-right':
                    case 'image-text-right':
                        return 80; // Image sections have more controls
                    case 'picture-gallery':
                    case 'picture-row':
                        return 90; // Gallery sections have more complex controls
                    default:
                        return 70; // Default correction
                }
            })();

            // Calculate corrected height, never go below minimum values
            const correctedHeight = Math.max(
                rawHeight - uiControlsHeight,
                this.getMinimumSectionHeight(section)
            );

            return correctedHeight;
        }

        // Fallback to content-based estimation when DOM element isn't available
        return this.getMinimumSectionHeight(section);
    }

    // Helper function to get minimum height based on content
    getMinimumSectionHeight(section) {
        // Base heights for PDF rendering (much smaller than editor heights)
        const baseHeights = {
            'document-header': 20,    // -10px
            'section-header': 10,     // -10px
            'text-area': 40,          // -20px
            'text-image-right': 80,  // -30px
            'image-text-right': 80,  // -30px
            'picture-gallery': 80,   // -40px
            'picture-row': 80,       // -30px
            'divider': 1,            // -10px
            'empty-space': section.height || 30
        };

        // Get base height for this section type
        let height = baseHeights[section.type] || 30;

        // For text content, estimate based on character count
        if (['text-area', 'text-image-right', 'image-text-right'].includes(section.type)) {
            let textContent = '';
            if (section.type === 'text-area' && section.placeholder) {
                textContent = section.placeholder;
            } else if (['text-image-right', 'image-text-right'].includes(section.type) && section.textPlaceholder) {
                textContent = section.textPlaceholder;
            }

            if (textContent) {
                // More accurate line calculation - approximately 80 chars per line for PDF
                const lineEstimate = Math.max(1, Math.ceil(textContent.length / 95));
                const textHeight = lineEstimate * 16; // 20px per line in PDF output
                height = Math.max(height, textHeight + 10);
            }
        }

        return height;
    }

    renderSectionForPDF(section, selectedFont = 'Arial') {
        let sectionHTML = '';
        // Define transparent pixel base64 for image placeholders
        const transparentPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

        // Function to check if a label is a design preset label that should be excluded
        const isDesignLabel = (label) => {
            if (!label) return false;
            const designLabels = [
                'Text Area Field', 'Image Row', 'Text Area', 'Picture Gallery',
                'Section Header', 'Document Header', 'Text with Image',
                'Image with Text', 'Empty Space', 'Divider'
            ];
            return designLabels.some(preset =>
                label === preset ||
                label.includes(preset) ||
                label.replace(/\s+/g, '').toLowerCase() === preset.replace(/\s+/g, '').toLowerCase()
            );
        };

        // Determine if we should show the label
        const shouldShowLabel = section.label && !isDesignLabel(section.label);

        // Create font style with !important flags
        const fontStyle = `font-family: '${selectedFont}', sans-serif !important; color: #333 !important;`;

        switch (section.type) {
            case 'document-header':
                sectionHTML += `
                <div style="margin-bottom: 20px !important;">
                    <h1 style="${fontStyle} font-size: 24px !important; margin-bottom: 5px !important;">${section.title || Lang.get('paperworkDocumentTitle')}</h1>
                    <p style="${fontStyle} font-size: 16px !important; color: #666 !important;">${section.subtitle || ''}</p>
                </div>
            `;
                break;

            case 'section-header':
                sectionHTML += `
                <div style="margin: 20px 0 10px 0 !important;">
                    <h2 style="${fontStyle} font-size: 18px !important; border-bottom: 1px solid #eee !important; padding-bottom: 5px !important;">${section.title || Lang.get('paperworkSectionHeader')}</h2>
                </div>
            `;
                break;

            case 'text-area':
                sectionHTML += `
                <div style="margin-bottom: 15px !important;">
                    ${shouldShowLabel ? `<p style="${fontStyle} font-weight: bold !important;">${section.label}</p>` : ''}
                    <p style="${fontStyle} line-height: 1.6 !important;">${section.placeholder || Lang.get('paperworkEnterTextHere')}</p>
                </div>
            `;
                break;

            case 'text-image-right':
                sectionHTML += `
                <div style="display: flex !important; margin-bottom: 15px !important; gap: 20px !important;">
                    <div style="flex: 2 !important;">
                        ${shouldShowLabel ? `<p style="${fontStyle} font-weight: bold !important; margin-bottom: 5px !important;">${section.label}</p>` : ''}
                        <p style="${fontStyle} line-height: 1.6 !important;">${section.textPlaceholder || Lang.get('paperworkEnterTextHere')}</p>
                    </div>
                    <div style="flex: 1 !important; text-align: center !important;">
                        ${section.images && section.images[0]
                        ? `<img src="${section.images[0]}" style="max-width: 100% !important; height: auto !important; max-height: 300px !important;" alt="Report image">`
                        : `<img src="${transparentPixel}" width="150" height="150" style="border: 1px dashed #ccc !important;" alt="No image">`}
                    </div>
                </div>
            `;
                break;

            case 'image-text-right':
                sectionHTML += `
                <div style="display: flex !important; margin-bottom: 15px !important; gap: 20px !important;">
                    <div style="flex: 1 !important; text-align: center !important;">
                        ${section.images && section.images[0]
                        ? `<img src="${section.images[0]}" style="max-width: 100% !important; height: auto !important; max-height: 300px !important;" alt="Report image">`
                        : `<img src="${transparentPixel}" width="150" height="150" style="border: 1px dashed #ccc !important;" alt="No image">`}
                    </div>
                    <div style="flex: 2 !important;">
                        ${shouldShowLabel ? `<p style="${fontStyle} font-weight: bold !important; margin-bottom: 5px !important;">${section.label}</p>` : ''}
                        <p style="${fontStyle} line-height: 1.6 !important;">${section.textPlaceholder || Lang.get('paperworkEnterTextHere')}</p>
                    </div>
                </div>
            `;
                break;

            case 'picture-gallery':
                sectionHTML += `
                <div style="margin-bottom: 15px !important;">
                    ${shouldShowLabel ? `<p style="${fontStyle} font-weight: bold !important;">${section.label}</p>` : ''}
                    <div style="display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; margin-top: 10px !important;">
            `;

                // Add up to 4 images with transparent fallback
                for (let i = 0; i < 4; i++) {
                    sectionHTML += `
                    <div style="text-align: center !important; margin: 5px !important;">
                        ${section.images && section.images[i]
                            ? `<img src="${section.images[i]}" style="max-width: 100% !important; height: auto !important; max-height: 200px !important;" alt="Gallery image ${i + 1}">`
                            : `<img src="${transparentPixel}" width="120" height="120" style="border: 1px dashed #ccc !important;" alt="No image">`}
                    </div>
                `;
                }

                sectionHTML += `
                    </div>
                    ${section.caption ? `<p style="${fontStyle} text-align: center !important; color: #666 !important; margin-top: 5px !important; font-style: italic !important;">${section.caption}</p>` : ''}
                </div>
            `;
                break;

            case 'picture-row':
                sectionHTML += `
                <div style="margin-bottom: 15px !important;">
                    ${shouldShowLabel ? `<p style="${fontStyle} font-weight: bold !important;">${section.label}</p>` : ''}
                    <div style="display: flex !important; gap: 10px !important; margin-top: 10px !important; flex-wrap: wrap !important;">
            `;

                // Add images in a row with transparent fallback
                for (let i = 0; i < 4; i++) {
                    sectionHTML += `
                    <div style="text-align: center !important; flex: 1 !important; min-width: 100px !important;">
                        ${section.images && section.images[i]
                            ? `<img src="${section.images[i]}" style="max-width: 100% !important; height: auto !important; max-height: 150px !important;" alt="Row image ${i + 1}">`
                            : `<img src="${transparentPixel}" width="100" height="100" style="border: 1px dashed #ccc !important;" alt="No image">`}
                    </div>
                `;
                }

                sectionHTML += `
                    </div>
                    ${section.caption ? `<p style="${fontStyle} text-align: center !important; color: #666 !important; margin-top: 5px !important; font-style: italic !important;">${section.caption}</p>` : ''}
                </div>
            `;
                break;

            case 'divider':
                sectionHTML += `<hr style="border: none !important; border-top: 1px solid #ddd !important; margin: 20px 0 !important;">`;
                break;

            case 'empty-space':
                const height = section.height || 50;
                sectionHTML += `<div style="height: ${height}px !important;"></div>`;
                break;
        }

        return sectionHTML;
    }


    // Wait for all images to load
    waitForImagesToLoad(container) {
        const images = container.querySelectorAll('img');
        if (images.length === 0) return Promise.resolve();

        const promises = Array.from(images).map(img => {
            return new Promise((resolve) => {
                if (img.complete) {
                    resolve();
                } else {
                    img.onload = () => resolve();
                    img.onerror = () => resolve(); // Resolve even on error to prevent hanging
                }
            });
        });

        return Promise.all(promises);
    }

    // Update the generatePDF method for more professional output

    async generatePDF(canvases, filename) {
        return new Promise(async (resolve, reject) => {
            try {
                // Create a new jsPDF instance with white background
                const { jsPDF } = window.jspdf;
                if (!jsPDF) {
                    throw new Error('jsPDF library not found. Falling back to alternative method.');
                }

                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: 'a4',
                    compress: true,
                    putOnlyUsedFonts: true,
                    background: '#FFFFFF'  // Force white background
                });

                // Add each canvas as a page
                for (let i = 0; i < canvases.length; i++) {
                    const canvas = canvases[i];

                    // Add a white background rectangle first
                    if (i > 0) {
                        pdf.addPage();
                    }

                    // Fill the entire page with white first
                    pdf.setFillColor(255, 255, 255);
                    pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');

                    const imgData = canvas.toDataURL('image/jpeg', 0.95);

                    // Page dimensions
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    const margin = 35;

                    pdf.addImage(
                        imgData,
                        'JPEG',
                        margin,
                        margin,
                        pageWidth - (margin * 2),
                        pageHeight - (margin * 2),
                        '',
                        'FAST'
                    );
                }

                // Save the PDF
                pdf.save(`${filename}.pdf`);
                resolve(pdf);

            } catch (error) {
                console.error('Error in jsPDF generation, using alternative method', error);

                // Fallback to direct download of first canvas as image if PDF creation fails
                try {
                    if (canvases.length > 0) {
                        const link = document.createElement('a');
                        link.download = `${filename}.jpg`;
                        link.href = canvases[0].toDataURL('image/jpeg', 0.95);
                        link.click();
                        resolve(null);
                    } else {
                        reject(new Error('No canvas available for export'));
                    }
                } catch (fallbackError) {
                    reject(fallbackError);
                }
            }
        });
    }

}
// Create a global instance when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const paperwork = new Paperwork();
    await paperwork.initialize();
    window.paperworkInstance = paperwork;
   //console.log('Paperwork system initialized');
});

// Make both classes globally available
window.Paperwork = Paperwork;
window.UIHelpers = UIHelpers;
window.TemplateDesign = TemplateDesign;