
class Artworks {
    constructor() {
       //console.log('Artworks: Initializing Artworks class');
        this.visualModels = [];
        this.localVisualModels = [];
        this.cloudVisualModels = [];
        this.initialized = false;
        this.selectedModel = null;
        this.currentImage = null;
        this.isGenerating = false;
    }

    isOnlineDeploymentMode() {
        if (window.PAIPERWORK_CLOUD_ONLY === true) return true;
        const host = String(window.location.hostname || '').toLowerCase();
        const protocol = String(window.location.protocol || '').toLowerCase();
        const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1' || protocol === 'file:';
        return !isLocal;
    }

    // Initializes the Artworks class by loading visual models if not already initialized
    async initialize() {
        if (this.initialized) return true;

        try {
           //console.log('Artworks: Starting initialization');

            // Load available visual models
            await this.loadVisualModels();

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Artworks: Initialization error:', error);
            return false;
        }
    }

    // Loads available visual models from the Ollama API and filters them for visual models
    async loadVisualModels() {
        try {
            const onlineMode = this.isOnlineDeploymentMode();
            const cloudApiKey = (window.OllamaAPI && typeof window.OllamaAPI.getStoredCloudApiKey === 'function')
                ? await window.OllamaAPI.getStoredCloudApiKey()
                : '';

            const localTagsPromise = onlineMode
                ? Promise.resolve({ skipped: true })
                : fetch('http://localhost:11434/api/tags');

            const [localResult, cloudResult] = await Promise.allSettled([
                localTagsPromise,
                fetch('/api/cloud/tags', {
                    headers: cloudApiKey ? { 'Authorization': `Bearer ${cloudApiKey}` } : undefined
                })
            ]);

            const localModels = (!onlineMode && localResult.status === 'fulfilled' && localResult.value.ok)
                ? ((await localResult.value.json()).models || [])
                : [];
            const cloudModels = (cloudResult.status === 'fulfilled' && cloudResult.value.ok)
                ? ((await cloudResult.value.json()).models || [])
                : [];

            if (cloudResult.status === 'fulfilled' && cloudResult.value.status === 429) {
                console.warn('Artworks: Cloud model listing hit rate limit (429).', (window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached (429).');
            }
            if (!onlineMode && localResult.status === 'fulfilled' && localResult.value.status === 429) {
                console.warn('Artworks: Local model listing hit rate limit (429).', (window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached (429).');
            }

            const normalizeModel = (model, provider) => {
                const rawName = String(model?.name || model?.model || '').trim();
                if (!rawName) return null;

                const normalizedName = (provider === 'cloud' && window.OllamaAPI && window.OllamaAPI.normalizeCloudModelName)
                    ? window.OllamaAPI.normalizeCloudModelName(rawName)
                    : rawName;

                return {
                    ...model,
                    name: normalizedName,
                    provider
                };
            };

            if (window.OllamaAPI) {
                if (!(window.OllamaAPI.localModelNames instanceof Set)) window.OllamaAPI.localModelNames = new Set();
                if (!(window.OllamaAPI.cloudModelNames instanceof Set)) window.OllamaAPI.cloudModelNames = new Set();
                localModels.forEach(model => model?.name && window.OllamaAPI.localModelNames.add(model.name));
                cloudModels.forEach(model => {
                    if (!model?.name) return;
                    const normalizedCloudName = window.OllamaAPI.normalizeCloudModelName
                        ? window.OllamaAPI.normalizeCloudModelName(model.name)
                        : model.name;
                    window.OllamaAPI.cloudModelNames.add(normalizedCloudName);
                });
            }

            const allModels = [
                ...(onlineMode ? [] : localModels.map(model => normalizeModel(model, 'local')).filter(Boolean)),
                ...cloudModels.map(model => normalizeModel(model, 'cloud')).filter(Boolean)
            ];

            // Use VISUAL_MODELS list from visualmodels.js if available
            const visualModelIdentifiers = window.VISUAL_MODELS || [
                'gemma3', 'llava', 'bakllava', 'vision', 'phi3-vision'
            ];

           //console.log('Artworks: Using visual model identifiers:', visualModelIdentifiers);

            const hasVisualCapabilityHint = (model) => {
                const details = model?.details || {};
                const capabilityFields = [
                    model?.capabilities,
                    details?.capabilities,
                    details?.families,
                    details?.family,
                    details?.architecture,
                    details?.type,
                    model?.modality,
                    model?.modalities
                ];

                const flattened = capabilityFields
                    .flatMap(value => Array.isArray(value) ? value : [value])
                    .filter(Boolean)
                    .map(value => String(value).toLowerCase());

                return flattened.some(value =>
                    value.includes('vision') ||
                    value.includes('image') ||
                    value.includes('multimodal') ||
                    value.includes('vl')
                );
            };

            // Filter for visual models by checking if any identifier is in the model name
            this.visualModels = allModels.filter(model => {
                const modelName = String(model.name || '').toLowerCase();
                const matchesByName = visualModelIdentifiers.some(identifier =>
                    modelName.includes(String(identifier || '').toLowerCase())
                );
                return matchesByName || hasVisualCapabilityHint(model);
            });

            this.localVisualModels = onlineMode
                ? []
                : this.visualModels
                    .filter(model => model.provider === 'local')
                    .sort((a, b) => String(a.name).localeCompare(String(b.name)));

            this.cloudVisualModels = this.visualModels
                .filter(model => model.provider === 'cloud')
                .sort((a, b) => String(a.name).localeCompare(String(b.name)));

           //console.log(`Artworks: Loaded ${this.visualModels.length} visual models:`,
                //this.visualModels.map(m => m.name));

            return this.visualModels;
        } catch (error) {
            console.error('Artworks: Error loading visual models:', error);
            this.visualModels = [];
            this.localVisualModels = [];
            this.cloudVisualModels = [];
            return [];
        }
    }


    // Prepares image data by removing the base64 prefix if present
    prepareImageData(imageDataUrl) {
        // Clean base64 data by removing the prefix if present
        if (imageDataUrl.includes('base64,')) {
            return imageDataUrl.split('base64,')[1];
        }
        return imageDataUrl;
    }

    // Checks if there are any visual models loaded
    hasVisualModels() {
        return this.visualModels && this.visualModels.length > 0;
    }

    // Compatibility wrapper for generating artwork, logs the call and delegates to ArtworksTab
    async generateArtwork(image, prompt, modelName) {
       //console.log('Artworks: generateArtwork called with model:', modelName);

        // This is now just a compatibility wrapper that logs the call
        // The actual implementation is in ArtworksTab.generateArtwork

        try {
            this.isGenerating = true;

            // Log that we're using the direct OllamaAPI approach instead
           //console.log('Artworks: Using OllamaAPI directly for better image handling');

            // Return a placeholder - the actual implementation is now in ArtworksTab
            return {
                success: true,
                response: "Response will be generated by OllamaAPI directly"
            };
        } catch (error) {
            console.error('Artworks: Error in compatibility wrapper:', error);
            return {
                success: false,
                error: error.message || 'Unknown error in Artworks.generateArtwork compatibility wrapper'
            };
        } finally {
            this.isGenerating = false;
        }
    }

    // Returns the CSS styles for the artwork tab
    static get css() {
        return `
        .artwork-container {
            padding: 20px;
            max-width: 340px;
            margin: 0 auto;
        }
        
        .artwork-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--text-color);
        }
        
        .artwork-description {
            font-size: 14px;
            color: var(--text-color-secondary);
            margin-bottom: 16px;
            line-height: 1.5;
        }
        
        .artwork-warning {
            background-color: rgba(245, 158, 11, 0.1);
            border-left: 4px solid #f59e0b;
            padding: 12px;
            margin-bottom: 24px;
            border-radius: 4px;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .artwork-warning-title {
            font-weight: 600;
            margin-bottom: 4px;
            color: #f59e0b;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .artwork-warning-content {
            color: var(--text-color);
        }
        
        .artwork-section {
            margin-bottom: 20px;
        }
        
        .artwork-section label {
            display: block;
            font-weight: 500;
            margin-bottom: 8px;
            color: var(--text-color);
        }
        
        .artwork-model-selector {
            width: 100%;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid var(--border-color);
            background-color: var(--bg-color);
            color: var(--text-color);
            margin-bottom: 16px;
        }
        
        .artwork-upload-area {
            border: 2px dashed var(--border-color);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .artwork-upload-area:hover {
            border-color: var(--accent-color, #4f46e5);
            background-color: rgba(79, 70, 229, 0.05);
        }
        
        .artwork-upload-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            color: var(--text-color-secondary);
        }
        
        .artwork-image-preview {
            margin-top: 16px;
            position: relative;
            display: none;
        }
        
        .artwork-image-preview img {
            max-width: 100%;
            max-height: 200px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .artwork-remove-image {
            position: absolute;
            top: -10px;
            right: -10px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: #ef4444;
            color: white;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            cursor: pointer;
        }
        
        .artwork-prompt-input {
            width: 100%;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid var(--border-color);
            background-color: var(--bg-color);
            color: var(--text-color);
            resize: vertical;
            min-height: 100px;
            font-family: inherit;
            line-height: 1.5;
        }
        
        .artwork-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
        }
        
        .artwork-generate-btn {
            padding: 10px 16px;
            background-color: var(--accent-color, #4f46e5);
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .artwork-generate-btn:hover {
            background-color: var(--accent-hover-color, #4338ca);
        }
        
        .artwork-generate-btn:disabled {
            background-color: #9ca3af;
            cursor: not-allowed;
        }
        
        .no-models-message {
            text-align: center;
            padding: 30px 20px;
            background-color: rgba(239, 68, 68, 0.1);
            border-radius: 8px;
            margin: 20px 0;
            color: var(--text-color);
        }
        
        .no-models-icon {
            font-size: 40px;
            margin-bottom: 16px;
        }
        
        .no-models-title {
            font-weight: 600;
            font-size: 18px;
            margin-bottom: 8px;
            color: #ef4444;
        }
        
        .no-models-description {
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 16px;
        }
        
        .goto-models-btn {
            display: inline-block;
            padding: 8px 16px;
            background-color: var(--accent-color, #4f46e5);
            color: white;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            border: none;
            font-size: 14px;
        }
        
        .goto-models-btn:hover {
            background-color: var(--accent-hover-color, #4338ca);
        }
        
        .artwork-output {
            margin-top: 24px;
            display: none;
        }
        
        .artwork-output-title {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 12px;
        }
        
        .artwork-result {
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 16px;
            background-color: var(--code-bg);
            max-height: 300px;
            overflow-y: auto;
            white-space: pre-wrap;
            font-family: monospace;
            font-size: 14px;
            line-height: 1.4;
        }
            .artwork-mode-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 16px;
        }

        .artwork-mode-button {
            flex: 1;
            aspect-ratio: 1 / 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10px;
            background-color: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .artwork-mode-button svg {
            margin-bottom: 8px;
            color: var(--text-color-secondary);
        }
        
        .artwork-mode-button span {
            font-size: 12px;
            text-align: center;
            color: var(--text-color-secondary);
        }
        
        .artwork-mode-button:hover {
            background-color: rgba(79, 70, 229, 0.05);
            border-color: var(--accent-color, #4f46e5);
        }
        
        .artwork-mode-button.active {
            background-color: var(--accent-color, #4f46e5);
            border-color: var(--accent-color, #4f46e5);
            transform: scale(0.97);
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .artwork-mode-button.active svg,
        .artwork-mode-button.active span {
            color: white;
        }
        
        .artwork-tooltip {
            position: fixed;
            background-color: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 14px;
            max-width: 300px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.3s, transform 0.3s;
            pointer-events: none;
        }
        
        .artwork-tooltip:after {
            content: '';
            position: absolute;
            top: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-bottom: 6px solid #333;
        }
        
        .artwork-tooltip.visible {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    }
}

// Export to global scope - IMPORTANT FIX
window.Artworks = Artworks;

// Flag to indicate this script has loaded
window.ArtworksLoaded = true;