class OllamaAPI {

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
    static scrollDebounceTimeout = null;
    static {
        window.autoScrollEnabled = window.autoScrollEnabled === undefined ? true : window.autoScrollEnabled;
        window.imagesUnderTheHood = false;
        OllamaAPI.maxImagesUsed = 0;
    }
    static visualModels = null;
    static maxImagesUsed = 0; // Track the maximum number of images used in this conversation
    static lastUsedImages = []; // Store the last real images used in the conversation


    constructor() {
    }

    static countTokens(text) {
        return text.split(/[\s,.!?;:'"()\[\]{}]+/).length;
    }
    static async loadOllamaModels() {
        const modelSelector = document.getElementById('model-selector');
        //console.log('Loading Ollama models...');

        try {
            //console.log('Fetching from Ollama API...');
            const response = await fetch('http://localhost:11434/api/tags');

            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            // //console.log('Found models:', data.models ? data.models.length : 0);

            // Check if there are no models
            if (!data.models || data.models.length === 0) {
                console.warn('No models found in Ollama');

                // Show alert and redirect to models tab
                setTimeout(() => {
                    alert(Lang.get('noModelsFound') || 'No models found in Ollama. Redirecting to the Models tab to download one.');

                    // Find and click the models tab button
                    const modelsTabButton = document.querySelector('.tab-button[data-tab="models"]');
                    if (modelsTabButton) {
                        modelsTabButton.click();
                    } else {
                        // If no tab button, try direct navigation
                        window.location.href = 'index.html?tab=models';
                    }
                }, 500);

                return false;
            }

            // Clear existing options first
            modelSelector.innerHTML = `<option value="">${Lang.get('selectModel')}</option>`;

            // Add models to selector
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.name;
                option.textContent = model.name;
                modelSelector.appendChild(option);
            });

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
                if (confirm(`${errorMessage} ${retryText}`)) {
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

            if (doAutoload) {
                try {
                    const loadResp = await fetch('http://localhost:11434/api/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model: modelName, keep_alive: '-1s', stream: false, prompt: '' })
                    });
                    //console.log('OllamaAPI: Autoload response status:', loadResp.status, 'ok?', loadResp.ok);
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

            const candidateNames = ['context_length', 'context_size', 'num_ctx', 'max_context', 'num_context', 'context'];

            const findContext = (obj, path = '', seen = new Set()) => {
                if (obj === null || obj === undefined) return undefined;
                if (seen.has(obj)) return undefined;
                if (typeof obj === 'number') return { value: obj, path };
                if (typeof obj === 'string') {
                    const numericRe = /^\s*\d+(?:\.\d+)?\s*$/;
                    if (numericRe.test(obj)) return { value: Number(obj), path };
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
                                if (typeof v === 'number') return { value: v, path: p };
                                if (typeof v === 'string' && /^\s*\d+(?:\.\d+)?\s*$/.test(v)) return { value: Number(v), path: p };
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
                                if (typeof v === 'number') return { value: v, path: p };
                                if (typeof v === 'string' && /^\s*\d+(?:\.\d+)?\s*$/.test(v)) return { value: Number(v), path: p };
                                if (Array.isArray(v) && v.length > 0) return { value: v.length, path: p };
                                const nested = findContext(v, p, seen);
                                if (nested !== undefined) return nested;
                            } catch (e) { /* ignore */ }
                        }
                    }

                    // Generic recursion into properties (shallow) as a last resort
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
                    const response = await fetch(`http://localhost:11434/api/show`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: modelName })
                    });

                    if (!response.ok) {
                        throw new Error(`Failed to fetch model metadata: ${response.status}`);
                    }

                    const data = await response.json();
                    // Try to find native context in the returned object
                    const foundObj = findContext(data);
                    const nativeContext = (foundObj && typeof foundObj === 'object' && foundObj.value !== undefined) ? foundObj.value : null;
                    const nativeContextPath = (foundObj && typeof foundObj === 'object' && foundObj.path) ? foundObj.path : null;

                    //console.log('OllamaAPI: /api/show returned metadata; nativeContextPath:', nativeContextPath, 'nativeContext:', nativeContext);
                    return { data, nativeContext, nativeContextPath };
                } catch (err) {
                    console.warn('OllamaAPI: Error fetching model metadata on attempt', attempt, err);
                    return null;
                }
            };

            let result = await attemptFetch(1);
            if ((!result || result.nativeContext === null) && doAutoload) {
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
    // Sends a prompt to the Ollama API for text models, handling streaming and thinking mode.
    static async sendToOllama(userPrompt, systemPrompt, contextSize, previousContext = null, abortSignal = null, requestId = null, streamProcessor = null) {
        //console.log('Normal OllamaAPI: Sending to Ollama...');

        const modelSelector = document.getElementById('model-selector');
        const selectedModel = modelSelector.value;
        const webSearchEnabled = document.getElementById('web-search').classList.contains('active');
        const modelParams = this.getModelParameters(selectedModel);

        // Check if this is a visual model
        const isVisualModel = await OllamaAPI.isVisualModel(selectedModel);
        const isGemma3 = selectedModel.toLowerCase().includes('gemma3');

        //  CRITICAL FIX: Always refresh cache before each request to get latest state
        this._cachedThinkingEnabled = (window.ThinkingState && typeof window.ThinkingState.getEffectiveThinkingEnabled === 'function')
            ? window.ThinkingState.getEffectiveThinkingEnabled()
            : (localStorage.getItem('thinkingEnabled') === 'true');

        const thinkingEnabled = this._cachedThinkingEnabled;
        const supportsNativeThinking = window.isThinkingModel && window.isThinkingModel(selectedModel);

        //  ALSO: Update StreamProcessor's cache if it exists
        if (streamProcessor) {
            streamProcessor._cachedThinkingEnabled = thinkingEnabled;
            //console.log('🧠 OllamaAPI: Updated StreamProcessor cache to:', thinkingEnabled);
        }

        let enhancedPrompt = userPrompt;
        const jsonPost = {
            model: selectedModel,
            keep_alive: "-1s",
            stream: true,
            system: systemPrompt,
            prompt: enhancedPrompt,
            raw: false,
            options: {
                num_ctx: parseInt(contextSize),
                ...modelParams  // Spread in any parameters that exist
            },
            context: window.currentCheckpoint?.lastContext || OllamaAPI.previousContext,
            request_id: requestId || `ollama_${Date.now()}`
        };

        // Add thinking parameter for Ollama 0.9.0+ native thinking support
        if (supportsNativeThinking && thinkingEnabled) {
            jsonPost.think = true;
            //console.log('🧠 OllamaAPI: ✅ SET think=true in request payload');
        } else if (supportsNativeThinking && !thinkingEnabled) {
            jsonPost.think = false;
            //console.log('🧠 OllamaAPI: ✅ SET think=false in request payload');
        } else {
            //console.log('🧠 OllamaAPI: ❌ NOT setting think flag - model not supported or function missing');
        }

        if (isVisualModel) {
            // First check if we have real images saved from the previous message
            if (window.currentMessageImages && window.currentMessageImages.length > 0) {
                //console.log(`OllamaAPI: Using ${window.currentMessageImages.length} saved real images from previous message`);

                const savedImages = window.currentMessageImages.map(img => {
                    let imgData = img.src || img;
                    if (imgData.includes('base64,')) {
                        imgData = imgData.split('base64,')[1];
                    }
                    return imgData;
                });

                jsonPost.images = savedImages;
                OllamaAPI.lastUsedImages = [...savedImages];
                OllamaAPI.maxImagesUsed = Math.max(OllamaAPI.maxImagesUsed, savedImages.length);
            }
            else if (OllamaAPI.maxImagesUsed > 0) {
                if (OllamaAPI.lastUsedImages && OllamaAPI.lastUsedImages.length > 0) {
                    if (isGemma3) {
                        //console.log(`OllamaAPI: Reusing ${OllamaAPI.lastUsedImages.length} previously sent images`);
                        if (OllamaAPI.lastUsedImages.length < OllamaAPI.maxImagesUsed) {
                            //console.log(`OllamaAPI: Adjusting maxImagesUsed to match actual available images (${OllamaAPI.lastUsedImages.length})`);
                            OllamaAPI.maxImagesUsed = OllamaAPI.lastUsedImages.length;
                            jsonPost.images = [...OllamaAPI.lastUsedImages];
                        } else {
                            jsonPost.images = OllamaAPI.lastUsedImages;
                        }
                    } else {
                        //console.log(`OllamaAPI: Reusing previously sent image for ${selectedModel}`);
                        jsonPost.images = [OllamaAPI.lastUsedImages[0]];
                    }
                } else {
                    //console.log(`OllamaAPI: No saved real images found, resetting counter and not sending any images`);
                    OllamaAPI.maxImagesUsed = 0;
                }
            } else {
                //console.log(`OllamaAPI: No images used yet, not adding any images`);
            }
        }

        try {
            const fetchOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonPost)
            };

            if (abortSignal instanceof AbortSignal) {
                fetchOptions.signal = abortSignal;
            }

            //console.log('🧠 OllamaAPI: Sending request with thinking support:', !!jsonPost.think);

            const response = await fetch('http://localhost:11434/api/generate', fetchOptions);

            if (response.status === 500) {
                alert(Lang.get('ollamaContextSizeError', 'Communication error, please try again or restart Ollama.'));
                return null;
            }

            // If we have a stream processor, we need to handle the response here
            if (streamProcessor && response.ok) {
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

                try {
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (line.trim()) {
                                try {
                                    const data = JSON.parse(line);

                                    //  CRITICAL FIX: Always get FRESH thinking state for each chunk
                                    const currentThinkingEnabled = (window.ThinkingState && typeof window.ThinkingState.getUserThinkingEnabled === 'function')
                                        ? window.ThinkingState.getUserThinkingEnabled()
                                        : (window.ThinkingState && typeof window.ThinkingState.getUserThinkingEnabled === 'function')
                                            ? window.ThinkingState.getUserThinkingEnabled()
                                            : (localStorage.getItem('thinkingEnabled') === 'true');
                                    const hasThinkingData = 'thinking' in data;
                                    const hasResponseData = 'response' in data;

                                    //  ENHANCED LOGGING: Add model info to debug (throttled)
                                    const shouldLog = (hasThinkingData || hasResponseData) &&
                                        (Date.now() - this._lastThinkingCheck > 5000);

                                    if (shouldLog) {
                                        try {
                                         /* console.log('🧠 OllamaAPI: thinking presence check', {
                                                thinkingEnabled: currentThinkingEnabled,
                                                hasThinkingField: hasThinkingData,
                                                thinkingLength: hasThinkingData && data.thinking ? (typeof data.thinking === 'string' ? data.thinking.length : (Array.isArray(data.thinking) ? data.thinking.length : 0)) : 0,
                                                hasResponseField: hasResponseData,
                                                responseLength: hasResponseData && data.response ? (typeof data.response === 'string' ? data.response.length : (Array.isArray(data.response) ? data.response.length : 0)) : 0,
                                                model: selectedModel,
                                                requestHadThinkFlag: !!jsonPost && !!jsonPost.think,
                                                isDone: !!data.done,
                                                timestamp: new Date().toISOString()
                                            }); */
                                        } catch (logErr) {
                                            console.warn('🧠 OllamaAPI: Failed to log thinking presence', logErr);
                                        }
                                        this._lastThinkingCheck = Date.now();
                                    }

                                    //  CRITICAL FIX: Check if we need to start native thinking mode
                                    // Even if we don't have thinking data yet, we might need to prepare the container
                                    if (currentThinkingEnabled && supportsNativeThinking && !streamProcessor.thinkingMode.isNative) {
                                        //console.log('🧠 OllamaAPI: Initializing native thinking mode for upcoming data');
                                        streamProcessor.startNativeThinkingMode();
                                    }

                                    // 🧠 Enhanced: Handle native thinking data with detailed logging
                                    if (data.thinking && supportsNativeThinking && currentThinkingEnabled) {
                                        //console.log('🧠 OllamaAPI: Processing thinking data chunk, length:', data.thinking.length);

                                        //  ADD: Call processThinking method if it exists
                                        if (streamProcessor.processThinking) {
                                            streamProcessor.processThinking(data.thinking);
                                        } else {
                                            console.warn('🧠 OllamaAPI: processThinking method not found on streamProcessor');
                                            streamProcessor.processChunk(data.thinking);
                                        }
                                    } else if (data.thinking && supportsNativeThinking && !currentThinkingEnabled) {
                                        //console.log('🧠 OllamaAPI: Skipping thinking data - thinking disabled');
                                    } else if (data.thinking && !supportsNativeThinking) {
                                        //console.log('🧠 OllamaAPI: Skipping thinking data - model not supported');
                                    }

                                    // Handle regular response data
                                    if (data.response) {
                                        streamProcessor.processChunk(data.response);
                                    }

                                    // Handle completion
                                    if (data.done) {
                                        //console.log('🧠 OllamaAPI: Response complete');
                                        streamProcessor.finishResponse();

                                        // Update context
                                        if (data.context) {
                                            OllamaAPI.previousContext = data.context;
                                            window.currentCheckpoint = {
                                                lastContext: data.context
                                            };
                                            OllamaAPI.updateContextRemaining(data.context.length);
                                        }

                                        return { success: true, streamProcessor };
                                    }
                                } catch (error) {
                                    console.error('🧠 OllamaAPI: Error processing response chunk:', error);
                                    console.error('🧠 OllamaAPI: Problematic line:', line);
                                }
                            }
                        }
                    }
                } catch (streamError) {
                    console.error('🧠 OllamaAPI: Stream processing error:', streamError);
                    throw streamError;
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

            alert(Lang.get('ollamaConnectionError'));
            return null;
        }
    }
    // Sends a prompt to the Ollama API with web search context, handles streaming and UI updates.
    static async sendToOllamaWithWebSearch(prompt, systemPrompt, includeContext = true, abortSignal = null, documentContext = '', isDocumentWebSearch = false) {
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

        try {
            // Get the original prompt before any thinking tags removal
            const originalPrompt = prompt;
            // Create a separate variable for the prompt sent to the model so we don't
            // overwrite `prompt` which must remain the user's original input for storage.
            let userPromptForRequest = prompt;

            // --- NEW: Ask the model to create a concise web-search query based on the user's prompt ---
            let generatedQuery = null;

            try {
                // Build a short system/user prompt pair that instructs the model to produce a concise search query.
                // We intentionally do NOT change the external `systemPrompt` passed to the overall websearch flow.
                // Move the instruction into the user prompt so we do NOT change the external systemPrompt
                const queryUserPrompt = `You will be asked to produce a single concise web search query (no surrounding text) that best captures the user's information need. Keep it short and focused; do not include commentary or quotes.\n\nCreate a concise web search query for this user request:\n\n${originalPrompt}`;

                // Call sendToOllama to get the model's reply. We'll pass a temporary StreamProcessor so we get identical streaming parsing behavior
                const qpStreamProcessor = new StreamProcessor();
                const queryResponse = await OllamaAPI.sendToOllama(queryUserPrompt, systemPrompt, document.getElementById('context-selector').value, null, null, `webquery_${Date.now()}`, qpStreamProcessor);

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
                        } else if (qpStreamProcessor && qpStreamProcessor.responseContainer && qpStreamProcessor.responseContainer.textContent) {
                            generatedQuery = qpStreamProcessor.responseContainer.textContent.trim() || originalPrompt;
                        } else {
                            generatedQuery = originalPrompt;
                        }
                    } catch (e) {
                        generatedQuery = originalPrompt;
                    }
                } else if (queryResponse instanceof Response) {
                    // Non-streamed fetch Response - read text
                    try {
                        const text = await queryResponse.text();
                        generatedQuery = text.trim() || originalPrompt;
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
                //console.log('Ollama generated websearch query:', generatedQuery);
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
            const webSearchResults = await WebSearch.smartSearch(searchQueryToUse, new Date(), isDocumentWebSearch);

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
            const contextSize = document.getElementById('context-selector').value;
            const modelParams = this.getModelParameters(selectedModel);

            //  CRITICAL FIX: Always refresh cache before each request to get latest state
            this._cachedThinkingEnabled = (window.ThinkingState && typeof window.ThinkingState.getEffectiveThinkingEnabled === 'function')
                ? window.ThinkingState.getEffectiveThinkingEnabled()
                : (window.ThinkingState && typeof window.ThinkingState.getEffectiveThinkingEnabled === 'function')
                    ? window.ThinkingState.getEffectiveThinkingEnabled()
                    : (localStorage.getItem('thinkingEnabled') === 'true');

            const thinkingEnabled = this._cachedThinkingEnabled;
            const supportsNativeThinking = window.isThinkingModel && window.isThinkingModel(selectedModel);

            // Create AI message container
            const aiDiv = document.createElement('div');
            aiDiv.className = 'assistant-message';
            aiReplies.appendChild(aiDiv);

            // Create the stream processor
            const streamProcessor = new StreamProcessor();

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

            // Prepare the context if needed
            let context = [];
            if (includeContext && OllamaAPI.previousContext) {
                context = OllamaAPI.previousContext;
            }

            // Log the request details for debugging
            //console.log('Sending Ollama request with:');
            //console.log('- Model:', selectedModel);
            //console.log('- Context size:', contextSize);
            //console.log('- Has abort signal:', !!abortSignal);

            // Check if this is a visual model
            const isVisualModel = await OllamaAPI.isVisualModel(selectedModel);
            const isGemma3 = selectedModel.toLowerCase().includes('gemma3');

            // Prepare request body
            const requestBody = {
                model: selectedModel,
                // Use the separate prompt variable for the request so originalPrompt stays intact
                prompt: userPromptForRequest,
                system: enhancedSystemPrompt,
                stream: true,
                context: context,
                options: {
                    num_ctx: parseInt(contextSize),
                    ...modelParams  // Spread in any parameters that exist
                }
            };

            //  ADD THINKING SUPPORT: Add thinking parameter for Ollama 0.9.0+ native thinking support
            if (supportsNativeThinking && thinkingEnabled) {
                requestBody.think = true;
                //console.log('🧠 WebSearch OllamaAPI: ✅ SET think=true in request payload');
            } else if (supportsNativeThinking && !thinkingEnabled) {
                requestBody.think = false;
                //console.log('🧠 WebSearch OllamaAPI: ✅ SET think=false in request payload');
            } else {
                //console.log('🧠 WebSearch OllamaAPI: ❌ NOT setting think flag - model not supported or function missing');
            }

            //  LOG THE FINAL REQUEST PAYLOAD (excluding sensitive data):
            /*console.log('🧠 WebSearch OllamaAPI: Final request payload thinking status:', {
                model: requestBody.model,
                hasThinkFlag: 'think' in requestBody,
                thinkValue: requestBody.think,
                hasSystemPrompt: !!requestBody.system,
                hasStreamProcessor: !!streamProcessor
            });*/

            if (isVisualModel) {
                // FIXED: Only add images if we've used images before
                if (OllamaAPI.maxImagesUsed > 0) {
                    // Check if we have last used images first
                    if (OllamaAPI.lastUsedImages && OllamaAPI.lastUsedImages.length > 0) {
                        if (isGemma3) {
                            //console.log(`OllamaAPI WebSearch: Reusing previously sent images`);
                            // For Gemma3, ensure we have the right number of images
                            if (OllamaAPI.lastUsedImages.length < OllamaAPI.maxImagesUsed) {
                                //console.log(`OllamaAPI: Adjusting maxImagesUsed to match actual available images (${OllamaAPI.lastUsedImages.length})`);
                                // Instead of padding with images, adjust maxImagesUsed to match what we have
                                OllamaAPI.maxImagesUsed = OllamaAPI.lastUsedImages.length;
                                requestBody.images = [...OllamaAPI.lastUsedImages];
                            } else {
                                requestBody.images = OllamaAPI.lastUsedImages;
                            }
                        } else {
                            //console.log(`OllamaAPI WebSearch: Reusing previously sent image`);
                            requestBody.images = [OllamaAPI.lastUsedImages[0]];
                        }
                    } else {
                        // No previous real images exist, reset counter
                        //console.log(`OllamaAPI WebSearch: No saved real images found, resetting counter and not sending any images`);
                        OllamaAPI.maxImagesUsed = 0; // Reset this to avoid problems in future requests
                        // Don't set requestBody.images at all
                    }
                } else {
                    //console.log(`OllamaAPI WebSearch: No images used yet, not adding any images`);
                }
            }

            // Send to Ollama with our enhanced prompt and fetch options
            const fetchOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            };

            if (abortSignal instanceof AbortSignal) {
                fetchOptions.signal = abortSignal;
            }

            //console.log('OllamaAPI WebSearch: Fetch options include signal:', !!fetchOptions.signal);

            const response = await fetch('http://localhost:11434/api/generate', fetchOptions);

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
                alert(Lang.get('ollamaerror500'));
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

            // Process the stream
            while (true) {
                if (abortSignal && abortSignal.aborted) {
                    //console.log('Abort signal detected during stream processing - breaking out of read loop');
                    break;
                }
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const data = JSON.parse(line);

                            //  CRITICAL FIX: Always get FRESH thinking state for each chunk
                            const currentThinkingEnabled = (window.ThinkingState && typeof window.ThinkingState.getUserThinkingEnabled === 'function')
                                ? window.ThinkingState.getUserThinkingEnabled()
                                : (localStorage.getItem('thinkingEnabled') === 'true');
                            const hasThinkingData = 'thinking' in data;
                            const hasResponseData = 'response' in data;

                            //  ENHANCED LOGGING: Add model info to debug
                            const shouldLog = (hasThinkingData || hasResponseData) &&
                                (Date.now() - this._lastThinkingCheck > 5000);

                            if (shouldLog) {
                                /*console.log('🧠 WebSearch OllamaAPI: Received data chunk - Status check:', {
                                    thinkingEnabled: currentThinkingEnabled,
                                    supportsNativeThinking,
                                    model: selectedModel,
                                    hasThinkingField: hasThinkingData,
                                    hasResponseField: hasResponseData,
                                    thinkingLength: data.thinking ? data.thinking.length : 0,
                                    responseLength: data.response ? data.response.length : 0,
                                    isDone: data.done,
                                    //  NEW: Add raw data sample for debugging
                                    rawThinkingData: hasThinkingData ? data.thinking.substring(0, 50) + '...' : 'none',
                                    requestHadThinkFlag: !!requestBody.think
                                });*/
                                this._lastThinkingCheck = Date.now();
                            }

                            //  CRITICAL FIX: Check if we need to start native thinking mode
                            // Even if we don't have thinking data yet, we might need to prepare the container
                            if (currentThinkingEnabled && supportsNativeThinking && !streamProcessor.thinkingMode.isNative) {
                                //console.log('🧠 WebSearch OllamaAPI: Initializing native thinking mode for upcoming data');
                                streamProcessor.startNativeThinkingMode();
                            }

                            // 🧠 Enhanced: Handle native thinking data with detailed logging
                            if (data.thinking && supportsNativeThinking && currentThinkingEnabled) {
                                //console.log('🧠 WebSearch OllamaAPI: Processing thinking data chunk, length:', data.thinking.length);

                                //  ADD: Call processThinking method if it exists
                                if (streamProcessor.processThinking) {
                                    streamProcessor.processThinking(data.thinking);
                                } else {
                                    console.warn('🧠 WebSearch OllamaAPI: processThinking method not found on streamProcessor');
                                    streamProcessor.processChunk(data.thinking);
                                }
                            } else if (data.thinking && supportsNativeThinking && !currentThinkingEnabled) {
                                //console.log('🧠 WebSearch OllamaAPI: Skipping thinking data - thinking disabled');
                            } else if (data.thinking && !supportsNativeThinking) {
                                //console.log('🧠 WebSearch OllamaAPI: Skipping thinking data - model not supported');
                            }

                            if (data.done) {
                                // Handle completion
                                const buttons = streamProcessor.responseContainer.querySelectorAll('.code-copy-btn');
                                buttons.forEach(button => button.style.display = 'block');

                                streamProcessor.finishResponse();

                                if (window.chat && typeof window.chat.addMessageActionsToMessage === 'function') {
                                    window.chat.addMessageActionsToMessage(aiDiv);
                                }
                                const aiResponse = streamProcessor.responseContainer.outerHTML;

                                // Handle context management
                                OllamaAPI.previousContext = data.context;
                                window.currentCheckpoint = {
                                    lastContext: data.context
                                };
                                OllamaAPI.updateContextRemaining(data.context.length);

                                if (OllamaAPI.contextLimitReached) {
                                    this.handleContextLimitReached();
                                }

                                // Store conversation if needed - use the original user prompt (not the enhanced request prompt)
                                const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                                //console.log('WebSearch: Saving conversation to database');
                                await PaiperworkDB.storeConversationOnly(
                                    hashedMasterKey,
                                    originalPrompt,
                                    aiResponse,
                                    window.forceNewConversationGroup || false,  // Not forcing a new group
                                    window.currentConversationGroup  // Use current group if it exists
                                );

                                if (window.forceNewConversationGroup) {
                                    //console.log('WebSearch: Created new conversation group based on forceNewConversationGroup flag');
                                    window.forceNewConversationGroup = false;
                                }
                                OllamaAPI.scrollToBottom();

                                return artificialResponse;
                            } else {
                                // Handle regular response data
                                if (data.response) {
                                    streamProcessor.processChunk(data.response);
                                }
                                OllamaAPI.scrollToBottom();
                            }
                        } catch (error) {
                            console.error('Error processing chunk:', error);
                        }
                    }
                }
            }

            // If we reach here, we're done processing but didn't get a data.done event
            // Still return the artificial response
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
            progressBar.classList.remove('active', 'indeterminate');
            window.isGenerating = false;
        }
    }
    // Sends a prompt with image data to the Ollama API for visual models, handles single and multi-image cases.
    static async sendToOllamaWithImage(userPrompt, systemPrompt, contextSize, imageData, previousContext = null, abortSignal = null, requestId = null, multiImages = null, modelOverride = null) {
        //console.log('Picture OllamaAPI: Sending to Ollama...');
        try {
            // Use the model override if provided, otherwise fall back to selectors
            let selectedModel;
            if (modelOverride) {
                selectedModel = modelOverride;
                //console.log('OllamaAPI: Using provided model override:', selectedModel);
            } else if (window.artworksTab && window.artworksTab.artworksInstance && window.artworksTab.artworksInstance.selectedModel) {
                selectedModel = window.artworksTab.artworksInstance.selectedModel;
                //console.log('OllamaAPI: Using artwork tab model:', selectedModel);
            } else {
                const modelSelector = document.getElementById('model-selector');
                selectedModel = modelSelector.value;
                //console.log('OllamaAPI: Using chat tab model:', selectedModel);
            }
            const isGemma3 = selectedModel.toLowerCase().includes('gemma3');
            const modelParams = this.getModelParameters(selectedModel);
            // Create the request body
            const jsonPost = {
                model: selectedModel,
                keep_alive: "-1s",
                stream: true,
                system: systemPrompt,
                prompt: userPrompt,
                raw: false,
                options: {
                    num_ctx: parseInt(contextSize),
                    ...modelParams  // Spread in any parameters that exist
                },
                context: window.currentCheckpoint?.lastContext || OllamaAPI.previousContext,
                request_id: requestId || `ollama_image_${Date.now()}`
            };

            // Handle multi-image mode for Gemma3
            if (isGemma3 && multiImages && Array.isArray(multiImages) && multiImages.length > 0) {
                //console.log(`OllamaAPI: Preparing multi-image request with ${multiImages.length} images`);

                // Make sure we have the cleanedImageBase64Array
                if (!window.cleanedImageBase64Array || window.cleanedImageBase64Array.length === 0) {
                    console.error('OllamaAPI: No cleaned image data array available');
                    throw new Error('Missing image data for visual model');
                }

                // Update max images if this batch is larger than previous max
                OllamaAPI.maxImagesUsed = Math.max(OllamaAPI.maxImagesUsed, window.cleanedImageBase64Array.length);
                //console.log(`OllamaAPI: Updated max images used to ${OllamaAPI.maxImagesUsed}`);

                // Create images array with the actual images
                const imagesArray = [...window.cleanedImageBase64Array];

                // If we've previously sent more images than we have now, pad with  images
                if (imagesArray.length < OllamaAPI.maxImagesUsed) {
                    //console.log(`OllamaAPI: Adjusting maxImagesUsed to match available images (${imagesArray.length})`);
                    OllamaAPI.maxImagesUsed = imagesArray.length;
                }

                // Set the padded images array in the request
                jsonPost.images = imagesArray;

            } else if (imageData && typeof imageData === 'string' && imageData.trim().length > 0) {
                // Single image mode
                //console.log('OllamaAPI: Preparing single image request for model:', selectedModel);

                // Store the cleaned base64 image if we don't have it already
                if (!window.cleanedImageBase64) {
                    // Ensure the image is properly formatted as base64
                    let base64Image = imageData;
                    if (base64Image.includes('base64,')) {
                        base64Image = base64Image.split('base64,')[1];
                    }

                    if (!base64Image || base64Image.trim() === '') {
                        console.error('OllamaAPI: Invalid base64 image data');
                        throw new Error('Invalid image format for visual model');
                    }

                    // Store the cleaned base64 for future requests
                    window.cleanedImageBase64 = base64Image;
                }

                // Update max images for single image (always 1)
                OllamaAPI.maxImagesUsed = Math.max(OllamaAPI.maxImagesUsed, 1);

                // For single image, we don't need padding since max is 1
                jsonPost.images = [window.cleanedImageBase64];

            } else {
                // No image data provided but we're in visual mode
                if (OllamaAPI.maxImagesUsed > 0) {
                    // Check if we have last used images first
                    if (OllamaAPI.lastUsedImages && OllamaAPI.lastUsedImages.length > 0) {
                        if (isGemma3) {
                            // For Gemma3, ensure we have the right number of images by reusing or padding
                            //console.log(`OllamaAPI Image: Reusing ${OllamaAPI.lastUsedImages.length} previously sent images`);
                            if (OllamaAPI.lastUsedImages.length < OllamaAPI.maxImagesUsed) {
                                //console.log(`OllamaAPI: Adjusting maxImagesUsed to match actual available images (${OllamaAPI.lastUsedImages.length})`);
                                // Instead of padding with  images, adjust maxImagesUsed to match what we have
                                OllamaAPI.maxImagesUsed = OllamaAPI.lastUsedImages.length;
                                jsonPost.images = [...OllamaAPI.lastUsedImages];
                            } else {
                                jsonPost.images = OllamaAPI.lastUsedImages;
                            }
                        } else {
                            // For other visual models, just use the first previously sent image
                            //console.log(`OllamaAPI Image: Reusing previously sent image for ${selectedModel}`);
                            jsonPost.images = [OllamaAPI.lastUsedImages[0]];
                        }
                    } else {
                        // No previous real images exist, just reset maxImagesUsed
                        // IMPORTANT: Don't send  images at all
                        //console.log(`OllamaAPI Image: No saved real images found, not sending any images`);
                        OllamaAPI.maxImagesUsed = 0; // Reset this to avoid the problem in future requests
                        // Don't set jsonPost.images at all
                    }
                } else {
                    // FIXED: If no images have been used and this is a visual model request without an image
                    // This is likely an error case since this method is specifically for sending images
                    console.error('OllamaAPI: No valid image data provided for visual model');
                    throw new Error('Missing or invalid image data for visual model');
                }
            }

            // Rest of method for sending request
            //console.log('OllamaAPI: Sending image request with abort signal:', !!abortSignal);

            const fetchOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonPost)
            };

            if (abortSignal instanceof AbortSignal) {
                fetchOptions.signal = abortSignal;
            }

            //console.log('OllamaAPI: Fetch options include signal:', !!fetchOptions.signal);
            //console.log(`OllamaAPI: Sending request with ${jsonPost.images.length} images`);

            const response = await fetch('http://localhost:11434/api/generate', fetchOptions);

            // After successful API call, conditionally schedule an image reset
            if (response.ok) {
                // Use setTimeout to ensure this happens after processing completes
                setTimeout(() => {
                    if (window.chat && typeof window.chat.resetImageData === 'function') {
                        //console.log('OllamaAPI: Resetting image data for visual models');
                        window.chat.resetImageData();
                    }
                }, 100);
            }

            if (!response.ok) {
                if (response.status === 500) {
                    alert(Lang.get('ollamaContextSizeError'));
                    return null;
                }

                const errorText = await response.text();
                console.error('OllamaAPI: Error response from server:', errorText);
                throw new Error(`Server error: ${response.status} - ${errorText.substring(0, 100)}`);
            }

            return response;
        } catch (error) {
            console.error('OllamaAPI: Error sending image:', error);

            if (error.name === 'AbortError') {
                //console.log('OllamaAPI: Request was aborted by user');
                throw error; // Rethrow so the caller knows it was aborted
            }

            alert(Lang.get('ollamaConnectionError') + ': ' + error.message);
            return null;
        }
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
        this.maxImagesUsed = 0;
        //console.log('OllamaAPI: Reset maxImagesUsed to 0');
        const contextLabel = document.getElementById('context-remaining-label');
        if (contextLabel) {
            contextLabel.style.color = '';
            contextLabel.textContent = Lang.get('ollamaContextReset');
        }

        //console.log('Context reset complete');
    }
    static async buildCompleteSystemPrompt(hashedMasterKey, basePrompt = '') {
        //console.log('OllamaAPI DEBUG: Building complete system prompt with temporal awareness and language enforcement...');

        // First, if no basePrompt is provided, load it from the database
        let formattedBasePrompt = basePrompt?.trim() || '';

        if (!formattedBasePrompt) {
            //console.log('OllamaAPI DEBUG: No base prompt provided, loading from database');
            const settings = await PaiperworkDB.loadSettings(hashedMasterKey);
            formattedBasePrompt = settings?.systemPrompt || '';
            //console.log('OllamaAPI DEBUG: Loaded system prompt from database:',
                //formattedBasePrompt ? `Found (${formattedBasePrompt.length} chars)` : 'None');
        } else {
            //console.log('OllamaAPI DEBUG: Using provided base prompt:',
                //formattedBasePrompt.substring(0, 30) + '...');
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

        // ADD LANGUAGE ENFORCEMENT: Detect user's language and add enforcement
        let languageEnforcement = '';
        try {
            //console.log('OllamaAPI DEBUG: Adding language enforcement...');

            // Get user's language from browser or saved preference
            let userLanguage = 'English'; // Default fallback

            // Try to get language from Lang system if available
            if (window.Lang && typeof window.Lang.getCurrentLanguage === 'function') {
                const langCode = window.Lang.getCurrentLanguage();
                userLanguage = this.getLanguageDisplayName(langCode);
            } else {
                // Fallback to browser language
                const browserLang = navigator.language || navigator.userLanguage || 'en';
                userLanguage = this.getLanguageDisplayName(browserLang);
            }

            // Create language enforcement instruction
            languageEnforcement = `Always respond in ${userLanguage}. Match the user's language and communication style. If the user writes in ${userLanguage}, respond in ${userLanguage}. `;

            //console.log('OllamaAPI DEBUG: Language enforcement added for:', userLanguage);
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

        // LOAD INSIGHTS: Always load insights from database
        let insightsString = '';
        try {
            //console.log('OllamaAPI DEBUG: Loading insights from database (always loaded regardless of toggle)...');
            const insights = await SubjectiveInteractions.loadInsights(hashedMasterKey);

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
        try {
            // Prefer window-level quick-access (set immediately on click), then DOM active button, then localStorage
            let reasoningLevel = '';
            try {
                if (window.gptOssReasoningLevel) {
                    reasoningLevel = (window.gptOssReasoningLevel || '').toLowerCase().trim();
                    //console.log('OllamaAPI DEBUG: using window.gptOssReasoningLevel=', reasoningLevel);
                }
            } catch (wErr) { /* ignore */ }

            if (!reasoningLevel) {
                try {
                    const activeBtn = document.querySelector('#gptoss-reasoning-selector .gptoss-reasoning-btn.active');
                    if (activeBtn && activeBtn.dataset && activeBtn.dataset.level) {
                        reasoningLevel = (activeBtn.dataset.level || '').toLowerCase().trim();
                        //console.log('OllamaAPI DEBUG: using DOM active reasoning level=', reasoningLevel);
                    }
                } catch (domErr) {
                    // ignore DOM read errors
                }
            }

            // If still no value, read localStorage
            if (!reasoningLevel) {
                const reasoningLevelRaw = localStorage.getItem('gptOssReasoningLevel') || '';
                reasoningLevel = (reasoningLevelRaw || '').toLowerCase().trim();
                //console.log('OllamaAPI DEBUG: falling back to stored gptOssReasoningLevel=', reasoningLevel);
            }
            // Only apply when the model selector is gpt-oss (or variant) - check base token
            const modelSelector = document.getElementById('model-selector');
            const selectedModel = modelSelector ? modelSelector.value : '';
            const baseModel = (window.getBaseModelName ? window.getBaseModelName(selectedModel) : (selectedModel || '').toLowerCase()).split(':')[0];
            if (baseModel === 'gpt-oss' && reasoningLevel) {
                // Map mid -> medium for the token name if needed
                const mapLevel = reasoningLevel === 'mid' ? 'medium' : reasoningLevel;
                const reasoningPrefix = `reasoning:${mapLevel}\n\n`;
                //console.log('OllamaAPI DEBUG: Complete system prompt with reasoning level:', mapLevel);
                //console.log(reasoningPrefix + finalPrompt);
                return (reasoningPrefix + finalPrompt).trim();
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

        return finalPrompt.trim();
    }

    // Converts a language code (e.g., 'en-US') to a human-readable language name.
    static getLanguageDisplayName(langCode) {
        const languageMap = {
            'en': 'English',
            'en-US': 'English',
            'en-GB': 'English',
            'es': 'Spanish',
            'es-ES': 'Spanish',
            'es-MX': 'Spanish',
            'fr': 'French',
            'fr-FR': 'French',
            'de': 'German',
            'de-DE': 'German',
            'it': 'Italian',
            'it-IT': 'Italian',
            'pt': 'Portuguese',
            'pt-BR': 'Portuguese',
            'pt-PT': 'Portuguese',
            'ru': 'Russian',
            'ru-RU': 'Russian',
            'ja': 'Japanese',
            'ja-JP': 'Japanese',
            'ko': 'Korean',
            'ko-KR': 'Korean',
            'zh': 'Chinese',
            'zh-CN': 'Chinese',
            'zh-TW': 'Chinese',
            'ar': 'Arabic',
            'ar-SA': 'Arabic',
            'hi': 'Hindi',
            'hi-IN': 'Hindi',
            'nl': 'Dutch',
            'nl-NL': 'Dutch',
            'sv': 'Swedish',
            'sv-SE': 'Swedish',
            'da': 'Danish',
            'da-DK': 'Danish',
            'no': 'Norwegian',
            'nb-NO': 'Norwegian',
            'fi': 'Finnish',
            'fi-FI': 'Finnish',
            'pl': 'Polish',
            'pl-PL': 'Polish',
            'tr': 'Turkish',
            'tr-TR': 'Turkish',
            'el': 'Greek',
            'el-GR': 'Greek',
            'he': 'Hebrew',
            'he-IL': 'Hebrew',
            'th': 'Thai',
            'th-TH': 'Thai',
            'vi': 'Vietnamese',
            'vi-VN': 'Vietnamese',
            'id': 'Indonesian',
            'id-ID': 'Indonesian',
            'ms': 'Malay',
            'ms-MY': 'Malay',
            'uk': 'Ukrainian',
            'uk-UA': 'Ukrainian',
            'cs': 'Czech',
            'cs-CZ': 'Czech',
            'sk': 'Slovak',
            'sk-SK': 'Slovak',
            'hu': 'Hungarian',
            'hu-HU': 'Hungarian',
            'ro': 'Romanian',
            'ro-RO': 'Romanian',
            'bg': 'Bulgarian',
            'bg-BG': 'Bulgarian',
            'hr': 'Croatian',
            'hr-HR': 'Croatian',
            'sr': 'Serbian',
            'sr-RS': 'Serbian',
            'sl': 'Slovenian',
            'sl-SI': 'Slovenian',
            'et': 'Estonian',
            'et-EE': 'Estonian',
            'lv': 'Latvian',
            'lv-LV': 'Latvian',
            'lt': 'Lithuanian',
            'lt-LT': 'Lithuanian'
        };

        // Get base language code (e.g., 'en-US' -> 'en')
        const baseCode = langCode.toLowerCase().split('-')[0];

        // Try exact match first, then base code, then default to English
        return languageMap[langCode.toLowerCase()] ||
            languageMap[baseCode] ||
            'English';
    }
    static prepareConversationContext(conversations, maxTokens = 2048) {
        // First, identify the last N exchanges that fit within our token budget
        let tokenCount = 0;
        let contextMessages = [];

        // Start from the most recent messages, working backwards
        for (let i = conversations.length - 1; i >= 0; i--) {
            const conv = conversations[i];
            const messageTokens = this.countTokens(conv.message);

            // If adding this message would exceed our budget, stop
            if (tokenCount + messageTokens > maxTokens && contextMessages.length > 0) {
                break;
            }

            // Add this message to our context
            contextMessages.unshift({
                role: conv.role,
                content: conv.message,
                timestamp: conv.timestamp
            });
            tokenCount += messageTokens;
        }

        // Add summary prefix if we couldn't include all messages
        let contextPrompt = '';
        if (contextMessages.length < conversations.length) {
            const omittedCount = conversations.length - contextMessages.length;
            contextPrompt = Lang.get('ollamaConversationStart', { count: omittedCount });
        }

        // Format the context for the AI
        contextMessages.forEach(msg => {
            const rolePrefix = msg.role === 'user' ? 'User: ' : 'Assistant: ';

            // Extract the actual prompt from continuation messages if present
            let plainContent = '';
            if (msg.role === 'user' && msg.content.includes('continuation-prompt')) {
                // Try to extract the hidden continuation prompt first
                const match = msg.content.match(/<div class="continuation-prompt"[^>]*>(.*?)<\/div>/);
                if (match && match[1]) {
                    plainContent = match[1];
                } else {
                    // Fall back to regular content cleaning if needed
                    plainContent = msg.content.replace(/<[^>]*>?/gm, '');
                }
            } else {
                // Regular content cleaning for non-continuation messages
                plainContent = msg.content.replace(/<[^>]*>?/gm, '');
            }

            contextPrompt += `${rolePrefix}${plainContent}\n\n`;
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
            return [];
        }

        try {
            // Get the system prompt with insights and temporal context
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            const systemPrompt = await this.buildCompleteSystemPrompt(hashedMasterKey);
            //console.log('OllamaAPI: Got enhanced system prompt for context building');

            // Format messages in the way Ollama expects
            const messages = conversations.map(conv => ({
                role: conv.role,
                content: conv.message.replace(/<[^>]*>?/gm, '') // Strip HTML
            }));

            const contextSize = document.getElementById('context-selector').value || '8192';
            const modelSelector = document.getElementById('model-selector');

            // Create a special message that just initializes context without generating a response
            const initMessage = "This is a context initialization message. Please acknowledge receipt without elaborating.";

            // Make a direct API call to build context without generating a visible response
            //console.log('OllamaAPI: Making API call to initialize context');
            const response = await fetch('http://localhost:11434/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelSelector.value,
                    messages: [...messages, { role: 'user', content: initMessage }],
                    stream: false,
                    system: systemPrompt,
                    options: {
                        num_ctx: parseInt(contextSize)
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to build context: ${response.status}`);
            }

            const result = await response.json();

            // Store both the context and conversations
            if (result && result.context) {
                this.previousContext = result.context;
                //console.log('OllamaAPI: Context built successfully with',
                //  this.previousContext.length, 'tokens');
            } else {
                console.warn('OllamaAPI: No context returned from Ollama');
                this.previousContext = [];
            }

            // Also store previous conversations for UI purposes
            this.previousConversations = conversations;

            return this.previousContext;
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

            // Reset max images count to avoid  images being added
            OllamaAPI.maxImagesUsed = 0;

            // STEP 1: Get the user's proper system prompt with insights and temporal context
            // WITHOUT including any continuation context
            const systemPrompt = await this.buildCompleteSystemPrompt(hashedMasterKey);

            const contextSize = document.getElementById('context-selector').value;
            const selectedModel = document.getElementById('model-selector').value;
            const modelParams = this.getModelParameters(selectedModel);
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
            const streamProcessor = new StreamProcessor();

            // Detach the auto-created container from aiReplies
            const autoContainer = streamProcessor.responseContainer;
            if (autoContainer.parentNode) {
                autoContainer.parentNode.removeChild(autoContainer);
            }

            // And add it to our aiDiv instead
            aiDiv.appendChild(streamProcessor.responseContainer);

            // STEP 3: Send to Ollama with CLEAR separation of system prompt and user continuation prompt
            // Pass the abort signal to the fetch request
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: document.getElementById('model-selector').value,
                    prompt: userPrompt,
                    system: systemPrompt,
                    stream: true,
                    context: window.currentCheckpoint?.lastContext || this.previousContext || [],
                    options: {
                        num_ctx: parseInt(contextSize),
                        ...modelParams
                    }
                }),
                signal: abortController.signal // Add the abort signal here
            });

            if (response.status === 500) {
                alert(Lang.get('ollamaContextSizeError'));
                aiDiv.remove();
                return false;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // Process the stream
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const data = JSON.parse(line);

                            if (data.done) {
                                // Capture final content and update state
                                const buttons = streamProcessor.responseContainer.querySelectorAll('.code-copy-btn');
                                buttons.forEach(button => button.style.display = 'block');

                                // Handle context management
                                this.previousContext = data.context;
                                window.currentCheckpoint = {
                                    lastContext: data.context
                                };
                                this.updateContextRemaining(data.context.length);

                                if (this.contextLimitReached) {
                                    alert(Lang.get('ollamaContextSizeError'));
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

                                // Use the stored conversation group from when the session was loaded
                                const targetConversationGroup = window.currentConversationGroup;

                                // Store this as a regular conversation turn
                                const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                                await PaiperworkDB.storeConversationOnly(
                                    hashedMasterKey,
                                    `${noticeToUser}<div class="continuation-prompt" style="display:none;">${continuationPrompt}</div>`, // Modified
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

                                    // Restore the original placeholder if one was saved
                                    if (promptInput.dataset.originalPlaceholder) {
                                        promptInput.placeholder = promptInput.dataset.originalPlaceholder;
                                    } else {
                                        // Default placeholder if none was saved
                                        promptInput.placeholder = Lang.get('enterMessage') || 'Enter your message...';
                                    }

                                    // Focus the input to allow immediate typing
                                    promptInput.focus();
                                }

                                return true;
                            } else {
                                streamProcessor.processChunk(data.response);
                                OllamaAPI.scrollToBottom();
                            }
                        } catch (error) {
                            console.error('Error processing chunk:', error);
                        }
                    }
                }

                OllamaAPI.scrollToBottom();
            }
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

                    // Reset max images count
                    OllamaAPI.maxImagesUsed = 0;
                } else {
                    // If continuation failed, restore the continue button and remove the user message
                    aiReplies.appendChild(continuationDiv);
                    continueUserMessage.remove();
                    this.disabled = false;
                    this.textContent = Lang.get('ollamaContinueButton');
                }
            } catch (error) {
                console.error('Error continuing conversation:', error);
                alert(Lang.get('ollamaContinuationError'));
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
        // If already loaded, return the cached list
        if (this.visualModels) return this.visualModels;

        try {
            // Check if window.VISUAL_MODELS is available (from visualmodels.js)
            if (window.VISUAL_MODELS && Array.isArray(window.VISUAL_MODELS)) {
                this.visualModels = window.VISUAL_MODELS;
                //console.log('OllamaAPI: Loaded visual models from global array:', this.visualModels);
                return this.visualModels;
            }

            // Fallback to default list if not available
            console.warn('OllamaAPI: VISUAL_MODELS not found, using default list');
            this.visualModels = ['gemma3', 'llava', 'llama-vision', 'phi3-vision', 'bakllava'];
            return this.visualModels;
        } catch (error) {
            console.error('OllamaAPI: Error loading visual models list:', error);
            this.visualModels = ['gemma3', 'llava', 'llama-vision', 'phi3-vision', 'bakllava'];
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

        // Normalize model name for comparison (lowercase, remove version numbers)
        const normalizedName = modelName.toLowerCase();
        //console.log(`OllamaAPI: Checking if '${normalizedName}' is a visual model`);

        // Log all models we're checking against
        //console.log('OllamaAPI: Available visual models:', this.visualModels);

        // Check if any visual model name is contained in the selected model
        const isVisual = this.visualModels.some(visualModel => {
            const isMatch = normalizedName.includes(visualModel.toLowerCase());
            if (isMatch) {
                //console.log(`OllamaAPI: Match found! '${visualModel}' is in '${normalizedName}'`);
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