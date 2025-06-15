class ModelDownloader {

    static downloadState = {
        isDownloading: false,
        selectedModel: '',
        selectedTag: '',
        downloadedSize: 0,
        totalSize: 0,
        status: '',
        startTime: null
    };
    static browsingState = {
        models: [],
        selectedModel: '',
        modelTags: {},  // Store tags by model name
        selectedTag: ''
    };

    // Saves the current browsing state to encrypted storage
    static async saveBrowsingState() {
        await this.storeEncryptedValue('modelBrowsingState', JSON.stringify(this.browsingState));
    }

    // Saves the current download state to encrypted storage
    static async saveDownloadState() {
        // Create a copy without any non-serializable properties
        const stateToSave = { ...this.downloadState };
        await this.storeEncryptedValue('modelDownloadState', JSON.stringify(stateToSave));
    }

    // Restores the browsing state from encrypted storage
    static async restoreBrowsingState() {
        try {
            const savedStateJson = await this.retrieveEncryptedValue('modelBrowsingState');
            if (!savedStateJson) return false;

            const savedState = JSON.parse(savedStateJson);
            this.browsingState = savedState;

            //console.log('Restoring browsing state:', savedState);
            return true;
        } catch (error) {
            console.error('Error restoring browsing state:', error);
            return false;
        }
    }

    // Restores the download state from encrypted storage and updates the UI if needed
    static async restoreDownloadState() {
        try {
            const savedStateJson = await this.retrieveEncryptedValue('modelDownloadState');
            if (!savedStateJson) return;

            const savedState = JSON.parse(savedStateJson);
            this.downloadState = savedState;

            if (savedState.isDownloading) {
                //console.log('Restoring download state:', savedState);

                // Get UI elements
                const modelSelect = document.getElementById('model-select');
                const sizeSelect = document.getElementById('size-select');

                // REMOVED: Don't get download button here - let displayModels handle it
                // const downloadBtn = document.getElementById('download-btn');

                const description = document.getElementById('model-description');

                // Check if model now exists (completed while app was closed)
                const localModels = await this.loadLocalModels(false);
                const fullModelName = `${savedState.selectedModel}:${savedState.selectedTag}`;
                const modelExists = localModels.some(m => m.name === fullModelName);

                if (modelExists) {
                    // Download completed while away
                    //console.log('Download completed while app was closed');
                    this.downloadState.isDownloading = false;
                    await this.saveDownloadState();
                    return;
                }

                // Restore model selection
                if (modelSelect && savedState.selectedModel) {
                    modelSelect.value = savedState.selectedModel;

                    // Trigger change event to load sizes
                    const changeEvent = new Event('change');
                    modelSelect.dispatchEvent(changeEvent);

                    // Wait for sizes to load then restore size selection
                    setTimeout(async () => {
                        if (sizeSelect && savedState.selectedTag) {
                            sizeSelect.value = savedState.selectedTag;
                        }

                        // REMOVED: Don't update button text here - let displayModels handle it
                        // This was causing the "Resume" text to override "Refreshing stats"

                        // Restore description
                        if (description) {
                            description.textContent = savedState.status ||
                                Lang.get('modelDownloadInterrupted') ||
                                'Download was interrupted. Click Resume to continue.';
                        }
                    }, 500);
                }
            }
        } catch (error) {
            console.error('Error restoring download state:', error);
            await this.storeEncryptedValue('modelDownloadState', '');
        }
    }

    // Checks and updates the download status, polling the backend and updating the UI
    static async updateDownloadStatus() {
        if (!this.downloadState.isDownloading) return;

        try {
            // First check if model already exists (completed while app was closed)
            const tagsResponse = await fetch('http://localhost:11434/api/tags');
            const tagsData = await tagsResponse.json();
            const fullModelName = `${this.downloadState.selectedModel}:${this.downloadState.selectedTag}`;
            const modelExists = tagsData.models?.some(m => m.name === fullModelName);

            if (modelExists) {
                // Download completed - handle completion
                this.downloadState.isDownloading = false;
                await this.saveDownloadState();

                // Update UI to show completion
                const downloadBtn = document.getElementById('download-btn');
                const btnText = downloadBtn?.querySelector('.btn-text');
                const description = document.getElementById('model-description');
                const cancelBtn = document.getElementById('cancel-download-btn');

                if (btnText) btnText.textContent = Lang.get('modelDownloadComplete');
                if (description) description.textContent = Lang.get('modelDownloadSuccess', { model: fullModelName });
                if (downloadBtn) downloadBtn.disabled = false;
                if (cancelBtn) cancelBtn.style.display = 'none';

                // Re-enable fetch button when download completes
                const fetchBtn = document.getElementById('fetch-models-btn');
                const modelSelect = document.getElementById('model-select');
                const sizeSelect = document.getElementById('size-select');

                if (fetchBtn) {
                    fetchBtn.disabled = false;
                    fetchBtn.title = '';
                }
                if (modelSelect) {
                    modelSelect.disabled = false;
                    modelSelect.title = '';
                }
                if (sizeSelect) {
                    sizeSelect.disabled = false;
                    sizeSelect.title = '';
                }
                await this.loadLocalModels();
                return; // Exit early - no need to check status anymore
            }

            // Ensure cancel button has proper event handler after switching tabs
            let cancelBtn = document.getElementById('cancel-download-btn');
            if (cancelBtn) {
                // Remove any existing handlers to prevent duplicates
                cancelBtn.replaceWith(cancelBtn.cloneNode(true));
                cancelBtn = document.getElementById('cancel-download-btn');

                // Add the event handler
                cancelBtn.addEventListener('click', () => this.handleCancelDownload(fullModelName));
            }

            // Only check download status every 10 seconds instead of 3
            // This significantly reduces connection attempts
            if (!this._lastStatusCheck || Date.now() - this._lastStatusCheck > 10000) {
                this._lastStatusCheck = Date.now();

                try {
                    // Create a controller to abort this request when needed
                    const abortController = new AbortController();
                    const signal = abortController.signal;

                    // Set a timeout to abort this request after a few seconds
                    const timeoutId = setTimeout(() => abortController.abort(), 5000);

                    //console.log(`Checking download status for: ${fullModelName}`);

                    // Reconnect to the model download stream
                    const response = await fetch('http://localhost:11434/api/pull', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: fullModelName }),
                        signal: signal
                    });

                    // Clear the timeout since we've got a response
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const reader = response.body.getReader();
                        let gotUpdate = false;

                        // Read just a few chunks to get the latest status
                        for (let i = 0; i < 5; i++) {
                            const { done, value } = await reader.read();
                            if (done) break;

                            const chunk = new TextDecoder().decode(value);
                            const lines = chunk.split('\n').filter(line => line.trim());

                            for (const line of lines) {
                                try {
                                    const status = JSON.parse(line);
                                    gotUpdate = true;

                                    // Update status in our state
                                    if (status.status) {
                                        this.downloadState.status = status.status;
                                    }

                                    // Update total size
                                    if (status.total && status.total > 0) {
                                        this.downloadState.totalSize = status.total;
                                    }

                                    // Update progress
                                    if (status.completed && status.completed > 0) {
                                        this.downloadState.downloadedSize = status.completed;
                                    }

                                    // Update UI
                                    const downloadBtn = document.getElementById('download-btn');
                                    const btnText = downloadBtn?.querySelector('.btn-text');
                                    const description = document.getElementById('model-description');

                                    if (btnText && this.downloadState.totalSize > 0) {
                                        btnText.textContent = Lang.get('modelDownloading', {
                                            downloaded: this.formatBytes(this.downloadState.downloadedSize),
                                            total: this.formatBytes(this.downloadState.totalSize)
                                        });
                                    }

                                    if (description && status.status) {
                                        description.textContent = status.status;
                                    }

                                    // Save state after getting an update
                                    await this.saveDownloadState();

                                    // If we've gotten an update, we can abort and save bandwidth
                                    if (gotUpdate) {
                                        abortController.abort();
                                    }
                                } catch (e) {
                                    console.warn('Error parsing status line:', e);
                                }
                            }
                        }

                        // Abort the connection after we've read what we need
                        if (!signal.aborted) {
                            abortController.abort();
                        }
                    }
                } catch (reconnectError) {
                    if (reconnectError.name !== 'AbortError') {
                        console.warn('Error checking download status:', reconnectError);
                    }
                }
            }

            // Schedule next update - using a longer interval of 5 seconds
            setTimeout(() => this.updateDownloadStatus(), 5000);

        }
        catch (error) {
            console.error('Error in updateDownloadStatus:', error);

            // If we have persistent errors, re-enable the fetch button after multiple retries
            if (this._errorRetryCount === undefined) this._errorRetryCount = 0;
            this._errorRetryCount++;

            if (this._errorRetryCount > 3) {
                // After multiple errors, assume download failed and re-enable fetch button
                const fetchBtn = document.getElementById('fetch-models-btn');
                const modelSelect = document.getElementById('model-select');
                const sizeSelect = document.getElementById('size-select');

                if (fetchBtn) {
                    fetchBtn.disabled = false;
                    fetchBtn.title = '';
                }
                if (modelSelect) {
                    modelSelect.disabled = false;
                    modelSelect.title = '';
                }
                if (sizeSelect) {
                    sizeSelect.disabled = false;
                    sizeSelect.title = '';
                }
            }

            setTimeout(() => this.updateDownloadStatus(), 15000); // Longer retry on error
        }
    }

    // Creates and returns a styled cancel button for download cancellation
    static createCancelButton() {
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancel-download-btn';
        cancelBtn.className = 'cancel-download-btn';
        cancelBtn.innerHTML = `<span class="btn-text">${Lang.get('modelCancelButton')}</span>`;
        cancelBtn.style.backgroundColor = '#e74c3c';
        cancelBtn.style.color = 'white';
        cancelBtn.style.width = '100%';
        cancelBtn.style.marginTop = '8px';

        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.backgroundColor = '#c0392b';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.backgroundColor = '#e74c3c';
        });

        return cancelBtn;
    }

    // Handles the cancellation of a model download, updates state and UI
    static async handleCancelDownload(modelName) {
        const confirmCancel = confirm(Lang.get('modelCancelDownloadConfirm'));
        if (!confirmCancel) return;

        //console.log('Cancelling download for:', modelName);

        const downloadBtn = document.getElementById('download-btn');
        const btnText = downloadBtn?.querySelector('.btn-text');
        const description = document.getElementById('model-description');
        const cancelBtn = document.getElementById('cancel-download-btn');

        if (description) description.textContent = Lang.get('modelCancellingDownload');

        // Update download state
        this.downloadState.isDownloading = false;
        this.downloadState.status = Lang.get('modelCancellingDownload');
        await this.saveDownloadState();

        try {

            // Update UI
            if (btnText) btnText.textContent = Lang.get('modelDownloadButton');
            if (description) description.textContent = Lang.get('modelDownloadCancelled');
            if (downloadBtn) downloadBtn.disabled = false;
            if (cancelBtn) cancelBtn.style.display = 'none';

            const fetchBtn = document.getElementById('fetch-models-btn');
            const modelSelect = document.getElementById('model-select');
            const sizeSelect = document.getElementById('size-select');
            if (fetchBtn) {
                fetchBtn.disabled = false;
                fetchBtn.title = '';
            }
            if (modelSelect) {
                modelSelect.disabled = false;
                modelSelect.title = '';
            }
            if (sizeSelect) {
                sizeSelect.disabled = false;
                sizeSelect.title = '';
            }
            //console.log('Download cancelled. Partial files may remain on disk.');

            // Add restart advice
            const restartMsg = document.createElement('p');
            restartMsg.className = 'text-sm text-center text-warning';
            restartMsg.style.color = '#e74c3c';
            restartMsg.style.marginTop = '8px';
            restartMsg.textContent = Lang.get('modelDownloadCancelled');

            if (downloadBtn && downloadBtn.parentNode) {
                downloadBtn.parentNode.appendChild(restartMsg);
                setTimeout(() => restartMsg.remove(), 5000); // Remove after 30 seconds
            }
        } catch (error) {
            console.error('Error cancelling download:', error);
            if (description) description.textContent = Lang.get('modelCancellationError');
        }

        // Refresh local models to be safe
        await this.loadLocalModels();
    }
    static async updateDownloadStatus() {
        if (!this.downloadState.isDownloading) return;

        try {
            // First check if model already exists (download completed)
            const tagsResponse = await fetch('http://localhost:11434/api/tags');
            const tagsData = await tagsResponse.json();
            const fullModelName = `${this.downloadState.selectedModel}:${this.downloadState.selectedTag}`;
            const modelExists = tagsData.models?.some(m => m.name === fullModelName);

            if (modelExists) {
                // Download completed - handle completion
                this.downloadState.isDownloading = false;
                await this.saveDownloadState();

                // Update UI to show completion
                const downloadBtn = document.getElementById('download-btn');
                const btnText = downloadBtn?.querySelector('.btn-text');
                const description = document.getElementById('model-description');
                const cancelBtn = document.getElementById('cancel-download-btn');

                if (btnText) btnText.textContent = Lang.get('modelDownloadComplete');
                if (description) description.textContent = Lang.get('modelDownloadSuccess', { model: fullModelName });
                if (downloadBtn) downloadBtn.disabled = false;
                if (cancelBtn) cancelBtn.style.display = 'none';

                await this.loadLocalModels();
            } else {
                // Model doesn't exist yet - try to reconnect to download stream
                //console.log('Reconnecting to download stream for:', fullModelName);

                try {
                    // Create a controller to abort this request when needed
                    const abortController = new AbortController();
                    const signal = abortController.signal;

                    // Set a timeout to abort this request after a few seconds
                    // We just want to get an update, not maintain the connection indefinitely
                    const timeoutId = setTimeout(() => abortController.abort(), 5000);

                    // Reconnect to the model download stream
                    const response = await fetch('http://localhost:11434/api/pull', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: fullModelName,
                        }),
                        signal: signal
                    });

                    // Clear the timeout since we've got a response
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const reader = response.body.getReader();
                        let gotUpdate = false;

                        // Read just a few chunks to get the latest status
                        for (let i = 0; i < 5; i++) {
                            const { done, value } = await reader.read();
                            if (done) break;

                            const chunk = new TextDecoder().decode(value);
                            const lines = chunk.split('\n').filter(line => line.trim());

                            for (const line of lines) {
                                try {
                                    const status = JSON.parse(line);
                                    gotUpdate = true;

                                    // Update status in our state
                                    if (status.status) {
                                        this.downloadState.status = status.status;
                                    }

                                    // Update total size
                                    if (status.total && status.total > 0) {
                                        this.downloadState.totalSize = status.total;
                                    }

                                    // Update progress
                                    if (status.completed && status.completed > 0) {
                                        this.downloadState.downloadedSize = status.completed;
                                    }

                                    // Update UI
                                    const downloadBtn = document.getElementById('download-btn');
                                    const btnText = downloadBtn?.querySelector('.btn-text');
                                    const description = document.getElementById('model-description');

                                    if (btnText && this.downloadState.totalSize > 0) {
                                        btnText.textContent = Lang.get('modelDownloading', {
                                            downloaded: this.formatBytes(this.downloadState.downloadedSize),
                                            total: this.formatBytes(this.downloadState.totalSize)
                                        });
                                    }

                                    if (description && status.status) {
                                        description.textContent = status.status;
                                    }

                                    // Save state after getting an update
                                    await this.saveDownloadState();

                                    // If we've gotten an update, we can abort and save bandwidth
                                    if (gotUpdate) {
                                        abortController.abort();
                                    }
                                } catch (e) {
                                    console.warn('Error parsing status line:', e);
                                }
                            }
                        }

                        // Abort the connection after we've read what we need
                        if (!signal.aborted) {
                            abortController.abort();
                        }
                    }
                } catch (reconnectError) {
                    // If this is just an AbortError, it's expected
                    if (reconnectError.name !== 'AbortError') {
                        console.warn('Error reconnecting to download stream:', reconnectError);
                    }
                    // Continue polling even if reconnect fails
                }

                // Schedule next update
                setTimeout(() => this.updateDownloadStatus(), 3000);
            }
        } catch (error) {
            console.error('Error in updateDownloadStatus:', error);
            setTimeout(() => this.updateDownloadStatus(), 5000);
        }
    }

    static setupEventListeners() {
        const modelSelect = document.getElementById('model-select');
        const sizeSelect = document.getElementById('size-select');
        const description = document.getElementById('model-description');
        const sizeSelector = document.getElementById('size-selector');
        const downloadBtn = document.getElementById('download-btn');
        const localModelSelect = document.getElementById('local-model-select');
        const deleteBtn = document.getElementById('delete-btn');

        // Load initial local models
        this.loadLocalModels();

        // Show/hide delete button based on selection
        localModelSelect?.addEventListener('change', (e) => {
            if (e.target.value) {
                deleteBtn.classList.remove('hidden');
            } else {
                deleteBtn.classList.add('hidden');
            }
        });

        modelSelect?.addEventListener('change', async (e) => {
            const option = e.target.selectedOptions[0];
            const modelName = e.target.value;
            const desc = option?.dataset?.description || '';

            // Save selected model to browsing state
            this.browsingState.selectedModel = modelName;
            await this.saveBrowsingState();

            // Show description
            description.textContent = desc;
            description.classList.remove('hidden');

            // Always reset button text when model selection changes
            // This handles both active downloads and completed downloads
            const btnText = downloadBtn?.querySelector('.btn-text');
            if (btnText) {
                btnText.textContent = Lang.get('modelDownloadButton');
            }

            if (modelName) {
                // Show the size selector immediately with a loading message
                sizeSelector.classList.remove('hidden');
                sizeSelect.innerHTML = `<option value="">${Lang.get('modelFetchingSizes')}</option>`;
                downloadBtn.classList.add('hidden');

                try {
                    // Check if we already have tags cached for this model
                    let tags = [];
                    if (this.browsingState.modelTags[modelName]) {
                        //console.log('Using cached tags for model:', modelName);
                        tags = this.browsingState.modelTags[modelName];
                    } else {
                        // Fetch tags for selected model
                        tags = await this.fetchModelTags(modelName);

                        // Cache tags in browsing state
                        this.browsingState.modelTags[modelName] = tags;
                        await this.saveBrowsingState();
                    }

                    // Update size selector with tags
                    if (tags.length > 0) {
                        sizeSelect.innerHTML = tags
                            .map((tag, index) => `
                            <option value="${tag.name}" 
                                data-size="${tag.size}"
                                ${index === 0 ? 'selected' : ''}>
                                ${tag.name} (${tag.size})
                            </option>
                        `).join('');

                        // Show the download button and enable it immediately since we've auto-selected the first size
                        downloadBtn.classList.remove('hidden');
                        downloadBtn.disabled = false; // Enable button since a size is selected

                        // Add a change event listener to size selector to enable/disable download button
                        sizeSelect.addEventListener('change', () => {
                            const selectedSize = sizeSelect.value;

                            this.browsingState.selectedTag = selectedSize;
                            this.saveBrowsingState();

                            // Always reset button text when size selection changes
                            // This handles both active downloads and completed downloads
                            const btnText = downloadBtn?.querySelector('.btn-text');
                            if (btnText) {
                                btnText.textContent = Lang.get('modelDownloadButton');
                            }
                        });

                        // If we have a previously selected tag for this model, restore it
                        if (this.browsingState.selectedTag &&
                            tags.some(tag => tag.name === this.browsingState.selectedTag)) {
                            sizeSelect.value = this.browsingState.selectedTag;
                            // Trigger change event
                            sizeSelect.dispatchEvent(new Event('change'));
                        }
                    } else {
                        sizeSelect.innerHTML = `<option value="">${Lang.get('modelNoSizesFound')}</option>`;
                        downloadBtn.classList.add('hidden');
                        description.textContent = Lang.get('modelNoTags');
                    }
                } catch (error) {
                    console.error('Error fetching model tags:', error);
                    sizeSelect.innerHTML = `<option value="">${Lang.get('modelSizesFetchError')}</option>`;
                    downloadBtn.classList.add('hidden');
                }
            } else {
                // No model selected, hide size selector and download button
                sizeSelector.classList.add('hidden');
                downloadBtn.classList.add('hidden');
            }
        });

        // Modify the downloadBtn click handler to include validation checks
        downloadBtn?.addEventListener('click', () => {
            const modelName = modelSelect.value;
            const size = sizeSelect.value;

            // Additional validation before pulling the model
            if (!modelName || !size) {
                // This should never happen due to our disabled state handling,
                // but it's good to have a fallback check
                alert(Lang.get('modelSelectBothRequired'));
                return;
            }

            this.pullModel(`${modelName}:${size}`);
        });

        // Handle delete button click
        deleteBtn?.addEventListener('click', () => {
            const modelName = localModelSelect.value;
            if (modelName && confirm(Lang.get('modelDeleteConfirm', { model: modelName }))) {
                this.deleteModel(modelName);
            }
        });
    }

    // Fetches the list of available models from the Ollama library API
    static async fetchAvailableModels() {
        //console.log('Starting model fetch from Ollama library...');
        try {
            //console.log('Fetching webpage...');
            const url = 'http://localhost:8182/api/library';
            //console.log('Using URL:', url);

            const response = await fetch(url);
            //console.log('Response status:', response.status);

            const html = await response.text();
            //console.log('Received HTML length:', html.length);
            //console.log('First 500 chars of HTML:', html.substring(0, 500));

            return this.parseWithDOM(html);
        } catch (error) {
            console.error('Error fetching models:', error);
            return [];
        }
    }

    // Parses the HTML from the models library page and extracts model info
    static parseWithDOM(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const models = [];

        //console.log('Parsing HTML document...');

        // Try different selectors for model cards
        const modelElements = doc.querySelectorAll('a[href^="/library/"]') ||
            doc.querySelectorAll('.card') ||
            doc.querySelectorAll('[data-testid="model-card"]');

        //console.log('Found model elements:', modelElements.length);

        modelElements.forEach((element, index) => {
            try {
                // Get model name from href attribute or title
                const modelName = element.getAttribute('href')?.replace('/library/', '') ||
                    element.querySelector('h3')?.textContent?.trim() || '';

                // Get description
                const descElement = element.querySelector('p') ||
                    element.querySelector('.description') ||
                    element.querySelector('[data-testid="model-description"]');
                const description = descElement?.textContent?.trim() || '';

                // Get pull count using the x-test-pull-count attribute
                const pullCountElement = element.querySelector('[x-test-pull-count]');
                const pullCountText = pullCountElement?.textContent?.trim() || '0';

                // Convert pull count to number (handle K, M suffixes)
                const pullCount = this.parsePullCount(pullCountText);

                if (modelName && !modelName.includes('View all')) {
                    const model = {
                        name: modelName.toLowerCase(),
                        description: description,
                        sizes: [], // We'll get these from the tags page
                        stats: {
                            pulls: pullCount,
                            pullsFormatted: pullCountText, // Keep original formatted string
                            updated: new Date().toISOString()
                        }
                    };

                    models.push(model);
                    //console.log('Added model:', model);
                }
            } catch (error) {
                console.error('Error parsing model element:', error);
            }
        });

        //console.log(`Total models parsed: ${models.length}`);
        return models;
    }

    // Parses a pull count string (e.g., "1.2K") and returns a number
    static parsePullCount(pullText) {
        if (!pullText) return 0;

        const number = parseFloat(pullText.replace(/[^0-9.]/g, ''));
        const suffix = pullText.replace(/[0-9.]/g, '').trim().toUpperCase();

        switch (suffix) {
            case 'K':
                return number * 1000;
            case 'M':
                return number * 1000000;
            case 'B':
                return number * 1000000000;
            default:
                return number;
        }
    }

    // Renders the models tab UI and restores state, wiring up all controls
    static async displayModels(models) {

        if (!this._initialized) {
            // Add tab visibility change handler
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible' &&
                    this.downloadState &&
                    this.downloadState.isDownloading) {
                    // When tab becomes visible again, immediately update the download status
                    this.updateDownloadStatus();
                }
            });
            this._initialized = true;
        }

        if (!models || !Array.isArray(models)) {
            console.error('No valid models array provided');
            models = []; // Use empty array to allow UI initialization
        }

        // Call the centering styles function here, before creating any UI elements
        this.addModelCenteringStyles();
        const container = document.querySelector('.models-container') ||
            document.createElement('div');
        container.className = 'models-container';
        container.style.maxWidth = '800px'; // Set wider container width for models tab
        container.style.margin = '0 auto'; // Center the container
        container.style.padding = '20px';

        // Create model selector with loading placeholder initially
        const modelSelect = `
        <div class="model-selector">
                   <div class="fetch-button-container" style="margin-bottom: 16px; width: 100%; max-width: 300px;">
                <button id="fetch-models-btn" class="fetch-models-btn" style="width: 100%; height: 38px; border-radius: 6px; font-size: 14px; background-color: #404040; color: white;">
                    <span class="btn-text">${Lang.get('modelFetchButton')}</span>
                </button>
                <!-- Updated status element with proper centering -->
                <p id="fetch-status" class="text-sm text-center" style="margin-top: 8px; font-size: 13px; min-height: 18px; text-align: center; width: 100%;"></p>
            </div>
            <div class="download-section-container">
                <div class="download-section">
                    <div class="flex flex-col gap-2">
                        <label class="label">${Lang.get('modelSelectLabel')}</label>
                        <select id="model-select" class="form-select">
                            <option value="">${Lang.get('modelChooseOption')}</option>
                        </select>
                        <p id="model-description" class="text-sm text-gray-500"></p>
                    </div>
    
                    <div id="size-selector" class="hidden flex flex-col gap-2">
                        <label class="label">${Lang.get('modelSizeLabel')}</label>
                        <select id="size-select" class="form-select"></select>
                    </div>
    
                    <button id="download-btn" class="hidden mt-4 relative overflow-hidden">
                        <span class="btn-text">${Lang.get('modelDownloadButton')}</span>
                    </button>
                </div>
            </div>
    
            <div class="local-models-section-container">
                <div class="local-models-section">
                    <div>
                        <label class="label">${Lang.get('modelLocalLabel')}</label>
                        <select id="local-model-select" class="form-select">
                            <option value="">${Lang.get('modelLoadingOption')}</option>
                        </select>
                        <button id="delete-btn" class="hidden">
                            <span class="btn-text">${Lang.get('modelDeleteButton')}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

        container.innerHTML = modelSelect;

        // Add to document if not already present
        if (!document.querySelector('.models-container')) {
            document.querySelector('.main-container')?.appendChild(container);
        }
        const fetchBtn = container.querySelector('#fetch-models-btn');
        if (fetchBtn) {
            fetchBtn.addEventListener('mouseenter', () => {
                fetchBtn.style.backgroundColor = '#505050';
            });
            fetchBtn.addEventListener('mouseleave', () => {
                fetchBtn.style.backgroundColor = '#404040';
            });

            // Add click handler for fetch button
            // Update the click handler for the fetch button

            fetchBtn.addEventListener('click', async () => {
                const statusEl = document.getElementById('fetch-status');
                const btnText = fetchBtn.querySelector('.btn-text');
                const modelSelect = document.getElementById('model-select');

                // Get references to the other UI elements we need to reset
                const sizeSelector = document.getElementById('size-selector');
                const sizeSelect = document.getElementById('size-select');
                const description = document.getElementById('model-description');
                const downloadBtn = document.getElementById('download-btn');

                try {
                    // Update UI to indicate fetching
                    fetchBtn.disabled = true;
                    btnText.textContent = Lang.get('modelFetching');
                    statusEl.textContent = Lang.get('modelPleaseWait');

                    // Reset all UI elements related to model selection
                    if (description) description.textContent = '';

                    // Important: Reset and hide size selector
                    if (sizeSelector) sizeSelector.classList.add('hidden');
                    if (sizeSelect) {
                        // Clear all existing options from the size selector
                        sizeSelect.innerHTML = `<option value="">${Lang.get('modelFetchingSizes')}</option>`;
                    }

                    if (downloadBtn) downloadBtn.classList.add('hidden');

                    // Update the model select dropdown to show "Fetching models..."
                    if (modelSelect) {
                        modelSelect.innerHTML = `<option value="">${Lang.get('modelFetchingMessage')}</option>`;
                    }

                    // Perform the fetch
                    const models = await this.fetchAvailableModels();

                    // Update the models list
                    this.updateOnlineModelsList(models);

                    // Also reset browsing state since we have new models
                    this.browsingState.selectedModel = '';
                    this.browsingState.selectedTag = '';

                    // Clear any cached model tags to ensure fresh data when selecting models
                    this.browsingState.modelTags = {};

                    await this.saveBrowsingState();

                    // Update status
                    statusEl.textContent = Lang.get('modelFetchSuccess', { count: models.length });

                    // Reset button
                    btnText.textContent = Lang.get('modelFetchButton');
                    fetchBtn.disabled = false;

                    // Clear status after a delay
                    setTimeout(() => {
                        statusEl.textContent = '';
                    }, 5000);

                } catch (error) {
                    console.error('Error fetching models:', error);
                    statusEl.textContent = Lang.get('modelFetchError');
                    btnText.textContent = Lang.get('modelFetchRetry');
                    fetchBtn.disabled = false;
                    modelSelect.disabled = false;
                    sizeSelect.disabled = false;

                    // Update model select to show error
                    if (modelSelect) {
                        modelSelect.innerHTML = `<option value="">${Lang.get('modelFetchError')}</option>`;
                    }
                }
            });


        }
        // Apply styling to buttons
        const downloadBtn = container.querySelector('#download-btn');
        if (downloadBtn) {
            downloadBtn.style.backgroundColor = '#404040';
            downloadBtn.style.color = 'white';

            downloadBtn.addEventListener('mouseenter', () => {
                if (!downloadBtn.disabled) {
                    downloadBtn.style.backgroundColor = '#505050';
                }
            });
            downloadBtn.addEventListener('mouseleave', () => {
                if (!downloadBtn.disabled) {
                    downloadBtn.style.backgroundColor = '#404040';
                }
            });
        }

        // Style delete button
        const deleteBtn = container.querySelector('#delete-btn');
        if (deleteBtn) {
            deleteBtn.style.backgroundColor = '#404040';
            deleteBtn.style.color = 'white';
            deleteBtn.style.width = '100%';

            deleteBtn.addEventListener('mouseenter', () => {
                if (!deleteBtn.disabled) {
                    deleteBtn.style.backgroundColor = '#505050';
                }
            });
            deleteBtn.addEventListener('mouseleave', () => {
                if (!deleteBtn.disabled) {
                    deleteBtn.style.backgroundColor = '#404040';
                }
            });
        }

        // Set up event listeners for basic UI interaction
        this.setupEventListeners();

        // Restore browsing state if available
        const hasBrowsingState = await this.restoreBrowsingState();

        const hasActiveDownload = this.downloadState && this.downloadState.isDownloading;

        // Immediately load local models - don't wait for online models
        this.loadLocalModels();

        // Restore any active download state
        this.restoreDownloadState();

        if (this.downloadState && this.downloadState.isDownloading) {
            const fullModelName = `${this.downloadState.selectedModel}:${this.downloadState.selectedTag}`;
            const downloadBtn = document.getElementById('download-btn');
            const btnText = downloadBtn?.querySelector('.btn-text');
            const description = document.getElementById('model-description');
            const fetchBtn = document.getElementById('fetch-models-btn');
            const modelSelect = document.getElementById('model-select');
            const sizeSelect = document.getElementById('size-select');
            if (fetchBtn) {
                fetchBtn.disabled = true;
                fetchBtn.title = Lang.get('modelFetchDisabledDuringDownload');
            }
            if (modelSelect) {
                modelSelect.disabled = true;
                modelSelect.title = '';
            }
            if (sizeSelect) {
                sizeSelect.disabled = true;
                sizeSelect.title = '';
            }
            // Create cancel button if it doesn't exist
            let cancelBtn = document.getElementById('cancel-download-btn');
            if (!cancelBtn && downloadBtn) {
                cancelBtn = this.createCancelButton();
                downloadBtn.parentNode.insertBefore(cancelBtn, downloadBtn.nextSibling);
                cancelBtn.style.display = 'block';

                // Add event handler to cancel button
                cancelBtn.addEventListener('click', () => this.handleCancelDownload(fullModelName));
            }

            // Update download button text and status
            if (btnText) {
                // Show "Refreshing download stats" when initially returning to the tab
                btnText.textContent = Lang.get('modelRefreshingStats');
                downloadBtn.disabled = true;
            }

            // Update description with the current status if available
            if (description) {
                if (this.downloadState.status) {
                    description.textContent = this.downloadState.status;
                } else {
                    description.textContent = Lang.get('modelRefreshingStats');
                }
            }

            // Start the status update polling immediately when returning to the tab
            // This will quickly get the latest status and update the UI
            setTimeout(() => this.updateDownloadStatus(true), 100);
        }

        const modelsToUse = models.length > 0 ? models :
            (this.browsingState.models.length > 0 ? this.browsingState.models : []);

        if (modelsToUse.length > 0) {
            this.updateOnlineModelsList(modelsToUse);

            // If we have a saved model selection, restore it
            if (hasBrowsingState && this.browsingState.selectedModel) {
                const modelSelect = document.getElementById('model-select');
                if (modelSelect) {
                    // Set the value
                    modelSelect.value = this.browsingState.selectedModel;

                    // Trigger change event to load sizes and restore other UI elements
                    setTimeout(() => {
                        modelSelect.dispatchEvent(new Event('change'));
                    }, 100);
                }
            }
        }
    }

    // Updates the online models dropdown with the provided models array
    static updateOnlineModelsList(models) {
        const modelSelect = document.getElementById('model-select');
        if (!modelSelect) return;

        // Create options HTML
        const optionsHtml = `
            <option value="">${Lang.get('modelChooseOption')}</option>
            ${models.map(model => `
                <option value="${model.name}" data-description="${model.description || ''}">
                    ${model.name} (${model.stats?.pullsFormatted || '0'} pulls)
                </option>
            `).join('')}
        `;

        // Update the select element
        modelSelect.innerHTML = optionsHtml;
        //console.log(`Updated online models list with ${models.length} models`);

        // Save models in browsing state
        this.browsingState.models = models;
        this.saveBrowsingState();
    }

    // Fetches and updates the online models list asynchronously
    static async fetchAndUpdateOnlineModels() {
        try {
            //console.log('Starting async fetch of online models');

            // Update selector to show fetching status
            const modelSelect = document.getElementById('model-select');
            if (modelSelect) {
                modelSelect.innerHTML = `<option value="">${Lang.get('modelFetchingMessage')}</option>`;
            }

            const models = await this.fetchAvailableModels();
            //console.log(`Fetched ${models.length} online models`);
            this.updateOnlineModelsList(models);
        } catch (error) {
            console.error('Error fetching online models:', error);
            // Update selector to show error
            const modelSelect = document.getElementById('model-select');
            if (modelSelect) {
                modelSelect.innerHTML = `<option value="">${Lang.get('modelFetchError')}</option>`;
            }
        }
    }

    // Detects the Ollama backend version and stores it in localStorage
    static async detectOllamaVersion() {
        try {
            const response = await fetch('http://localhost:11434/api/version');
            if (response.ok) {
                const data = await response.json();
                if (data.version) {
                    //console.log('Detected Ollama version:', data.version);
                    localStorage.setItem('ollamaVersion', data.version);
                    return data.version;
                }
            }
            return '0.0.0'; // Default if not found
        } catch (error) {
            console.error('Error detecting Ollama version:', error);
            return '0.0.0';
        }
    }

    // Fetches all tags (variants/sizes) for a given model from the Ollama library
    static async fetchModelTags(modelName) {
        //console.log(`Fetching tags for model: ${modelName}`);

        // Method 1: Try the direct Ollama library API first
        try {
            const encodedModelName = encodeURIComponent(modelName);
            const url = `http://localhost:8182/api/library/${encodedModelName}/tags`;
            //console.log('Fetching from URL:', url);

            const response = await fetch(url);
            //console.log('Tags response status:', response.status);

            if (response.ok) {
                const html = await response.text();
                //console.log('Received HTML content length:', html.length);

                // Try the main parsing method first
                let tags = this.parseTagsFromHTML(html, modelName);

                if (tags.length > 0) {
                    //console.log(`Successfully parsed ${tags.length} tags using HTML parsing`);
                    return this.removeDuplicateTags(tags);
                }

                // Only try alternative methods if the main one fails
                tags = this.parseTagsAlternativeMethod(html, modelName);
                if (tags.length > 0) {
                    //console.log(`Successfully parsed ${tags.length} tags using alternative method`);
                    return this.removeDuplicateTags(tags);
                }

                // Try JSON extraction method as last resort
                tags = this.parseTagsFromJSON(html, modelName);
                if (tags.length > 0) {
                    //console.log(`Successfully parsed ${tags.length} tags using JSON extraction`);
                    return this.removeDuplicateTags(tags);
                }
            }
        } catch (error) {
            //console.log('Direct HTML scraping failed:', error);
        }

        // Method 2: Try the main model page only if direct tags page fails
        try {
            const encodedModelName = encodeURIComponent(modelName);
            const mainUrl = `http://localhost:8182/api/library/${encodedModelName}`;
            //console.log('Trying main model page:', mainUrl);

            const response = await fetch(mainUrl);
            if (response.ok) {
                const html = await response.text();
                const tags = this.parseTagsFromMainPage(html, modelName);

                if (tags.length > 0) {
                    //console.log(`Successfully parsed ${tags.length} tags from main page`);
                    return this.removeDuplicateTags(tags);
                }
            }
        } catch (error) {
            //console.log('Main page scraping failed:', error);
        }

        //console.log(`All tag fetching methods failed for ${modelName}`);
        return [];
    }

    // Removes duplicate tags from a tags array
    static removeDuplicateTags(tags) {
        const seen = new Set();
        const uniqueTags = [];

        for (const tag of tags) {
            if (!seen.has(tag.name)) {
                seen.add(tag.name);
                uniqueTags.push(tag);
            }
        }

        //console.log(`Removed ${tags.length - uniqueTags.length} duplicate tags`);
        return uniqueTags;
    }

    // Parses tags and sizes from the HTML of the tags page
    static parseTagsFromHTML(html, modelName) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const tags = [];

        //console.log('Parsing HTML for model tags...');

        // First, try to parse the model table which contains both tag names and sizes
        const modelRows = doc.querySelectorAll('a[href*="' + modelName + ':"], div[class*="group"] a[href*="' + modelName + ':"]');
        //console.log(`Found ${modelRows.length} model row links`);

        if (modelRows.length > 0) {
            modelRows.forEach(link => {
                try {
                    const href = link.getAttribute('href');
                    const tagMatch = href.match(new RegExp(`${modelName}:([^/\\s]+)`));

                    if (tagMatch && tagMatch[1]) {
                        const tagName = tagMatch[1];

                        if (!tags.some(t => t.name === tagName)) {
                            // Try to find size from the table row structure
                            let size = 'Unknown';

                            // Look for the table row container that has size information
                            const tableRow = link.closest('div[class*="grid"]') || link.closest('a');
                            if (tableRow) {
                                // Look for size in the table structure
                                const sizeElements = tableRow.querySelectorAll('p');
                                for (const sizeEl of sizeElements) {
                                    const sizeText = sizeEl.textContent || '';
                                    const sizeMatch = sizeText.match(/(\d+(?:\.\d+)?\s*(?:GB|MB|KB|TB))/i);
                                    if (sizeMatch) {
                                        size = sizeMatch[1].replace(/\s+/g, '');
                                        //console.log(`Found size ${size} for tag ${tagName} from table row`);
                                        break;
                                    }
                                }
                            }

                            // If still no size found, try looking in the mobile view format
                            if (size === 'Unknown') {
                                const mobileContainer = link.closest('a[class*="flex"]');
                                if (mobileContainer) {
                                    const mobileText = mobileContainer.textContent || '';
                                    const sizeMatch = mobileText.match(/(\d+(?:\.\d+)?\s*(?:GB|MB|KB|TB))/i);
                                    if (sizeMatch) {
                                        size = sizeMatch[1].replace(/\s+/g, '');
                                        //console.log(`Found size ${size} for tag ${tagName} from mobile view`);
                                    }
                                }
                            }

                            tags.push({
                                name: tagName,
                                size: size,
                                fullName: `${modelName}:${tagName}`
                            });

                            //console.log(`Found tag from model table: ${tagName} (${size})`);
                        }
                    }
                } catch (error) {
                    console.warn('Error parsing model row:', error);
                }
            });

            if (tags.length > 0) {
                return tags;
            }
        }

        // Fallback: try the x-test-size elements, but with better size detection
        const sizeElements = doc.querySelectorAll('span[x-test-size]');
        //console.log(`Found ${sizeElements.length} x-test-size elements`);

        if (sizeElements.length > 0) {
            sizeElements.forEach(element => {
                const tagName = element.textContent?.trim();
                if (tagName && !tags.some(t => t.name === tagName)) {
                    // For x-test-size elements, we need to correlate with the model table
                    let size = 'Unknown';

                    // Try to find a corresponding model row with this tag
                    const correspondingLink = doc.querySelector(`a[href*="${modelName}:${tagName}"]`);
                    if (correspondingLink) {
                        const tableRow = correspondingLink.closest('div[class*="grid"]') || correspondingLink.closest('a');
                        if (tableRow) {
                            const sizeElements = tableRow.querySelectorAll('p');
                            for (const sizeEl of sizeElements) {
                                const sizeText = sizeEl.textContent || '';
                                const sizeMatch = sizeText.match(/(\d+(?:\.\d+)?\s*(?:GB|MB|KB|TB))/i);
                                if (sizeMatch) {
                                    size = sizeMatch[1].replace(/\s+/g, '');
                                    //console.log(`Found size ${size} for tag ${tagName} via correlation`);
                                    break;
                                }
                            }
                        }
                    }

                    tags.push({
                        name: tagName,
                        size: size,
                        fullName: `${modelName}:${tagName}`
                    });
                    //console.log(`Found tag from x-test-size: ${tagName} (${size})`);
                }
            });

            if (tags.length > 0) {
                return tags;
            }
        }

        // Alternative approach: look for patterns in the entire HTML that match the model
        const tagPattern = new RegExp(`${modelName}:([a-zA-Z0-9._-]+)`, 'g');
        const matches = html.matchAll(tagPattern);

        for (const match of matches) {
            const tagName = match[1];
            if (tagName && !tags.some(t => t.name === tagName)) {
                // Try to find size near this tag mention
                const contextStart = Math.max(0, match.index - 300);
                const contextEnd = Math.min(html.length, match.index + 300);
                const context = html.substring(contextStart, contextEnd);

                const sizeMatch = context.match(/(\d+(?:\.\d+)?\s*(?:GB|MB|KB|TB))/i);
                const size = sizeMatch ? sizeMatch[1].replace(/\s+/g, '') : 'Unknown';

                tags.push({
                    name: tagName,
                    size: size,
                    fullName: `${modelName}:${tagName}`
                });

                //console.log(`Found tag via pattern matching: ${tagName} (${size})`);
            }
        }

        // Fallback: try the original selectors
        if (tags.length === 0) {
            const possibleSelectors = [
                'li.group',
                '.model-tag',
                '.model-variant',
                '[data-testid*="tag"]',
                '[data-testid*="variant"]',
                'a[href*=":"]',
                '.tag-item',
                '.variant-item'
            ];

            for (const selector of possibleSelectors) {
                const items = doc.querySelectorAll(selector);
                //console.log(`Trying selector "${selector}": found ${items.length} items`);

                if (items.length > 0) {
                    items.forEach(item => {
                        try {
                            // Multiple ways to find the tag name
                            const link = item.querySelector(`a[href*="${modelName}:"]`) ||
                                item.querySelector('a[href*=":"]') ||
                                item;

                            if (link && link.href) {
                                const href = link.getAttribute('href');
                                const matches = href.match(new RegExp(`${modelName}:([^/\\s]+)`));

                                if (matches && matches[1]) {
                                    const tagName = matches[1];

                                    // Check for duplicates
                                    if (!tags.some(t => t.name === tagName)) {
                                        // Find size information using multiple patterns
                                        const sizePatterns = [
                                            /\b(\d+(?:\.\d+)?\s*(?:GB|MB|KB|TB|B))\b/i,
                                            /Size:\s*(\d+(?:\.\d+)?\s*(?:GB|MB|KB|TB|B))/i,
                                            /(\d+(?:\.\d+)?)\s*(GB|MB|KB|TB|B)/i
                                        ];

                                        let size = 'Unknown';
                                        const text = item.textContent || '';

                                        for (const pattern of sizePatterns) {
                                            const sizeMatch = text.match(pattern);
                                            if (sizeMatch && sizeMatch[1]) {
                                                size = sizeMatch[1].replace(/\s+/g, '') + (sizeMatch[2] || '');
                                                break;
                                            }
                                        }

                                        tags.push({
                                            name: tagName,
                                            size: size,
                                            fullName: `${modelName}:${tagName}`
                                        });

                                        //console.log(`Found tag: ${tagName} (${size})`);
                                    }
                                }
                            }
                        } catch (error) {
                            console.warn('Error parsing item:', error);
                        }
                    });

                    if (tags.length > 0) {
                        break; // Found tags with this selector, no need to try others
                    }
                }
            }
        }

        return tags;
    }

    // Alternative method to parse tags from HTML using regex patterns
    static parseTagsAlternativeMethod(html, modelName) {
        const tags = [];
        //console.log('Trying alternative parsing method...');

        // Look for patterns like "modelname:tag" in the HTML
        const tagPattern = new RegExp(`${modelName}:([a-zA-Z0-9._-]+)`, 'g');
        const matches = html.matchAll(tagPattern);

        for (const match of matches) {
            const tagName = match[1];
            if (tagName && !tags.some(t => t.name === tagName)) {
                // Try to find size near this tag mention
                const contextStart = Math.max(0, match.index - 200);
                const contextEnd = Math.min(html.length, match.index + 200);
                const context = html.substring(contextStart, contextEnd);

                const sizeMatch = context.match(/\b(\d+(?:\.\d+)?\s*[KMGT]B)\b/i);
                const size = sizeMatch ? sizeMatch[1].replace(/\s+/g, '') : 'Unknown';

                tags.push({
                    name: tagName,
                    size: size,
                    fullName: `${modelName}:${tagName}`
                });

                //console.log(`Alternative method found tag: ${tagName} (${size})`);
            }
        }

        return tags;
    }

    // Parses tags from the main model page HTML
    static parseTagsFromMainPage(html, modelName) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const tags = [];

        //console.log('Parsing tags from main model page...');

        // Look for size badges or tags in the main page
        const possibleElements = [
            ...doc.querySelectorAll('[class*="tag"]'),
            ...doc.querySelectorAll('[class*="badge"]'),
            ...doc.querySelectorAll('[class*="size"]'),
            ...doc.querySelectorAll('span'),
            ...doc.querySelectorAll('.inline-flex')
        ];

        const sizePattern = /\b(\d+(?:\.\d+)?)\s*([kmgt]?b)\b/i;
        const tagPattern = /^[a-zA-Z0-9._-]+$/;

        possibleElements.forEach(element => {
            const text = element.textContent?.trim();
            if (text) {
                // Check if this looks like a size tag (e.g., "7b", "13b", "70b")
                if (tagPattern.test(text) && text.length <= 10) {
                    // This might be a tag name
                    const fullName = `${modelName}:${text}`;

                    if (!tags.some(t => t.name === text)) {
                        tags.push({
                            name: text,
                            size: 'Unknown',
                            fullName: fullName
                        });

                        //console.log(`Main page found potential tag: ${text}`);
                    }
                }
            }
        });

        return tags;
    }

    // Extracts from JSON embedded in script tags
    static extractTagsFromScripts(html, modelName) {
        const tags = [];
        //console.log('Extracting tags from script tags...');

        // Look for JSON data in script tags
        const scriptMatches = html.matchAll(/<script[^>]*>(.*?)<\/script>/gis);

        for (const match of scriptMatches) {
            const scriptContent = match[1];

            try {
                // Look for JSON objects that might contain model data
                const jsonMatches = scriptContent.matchAll(/(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g);

                for (const jsonMatch of jsonMatches) {
                    try {
                        const jsonStr = jsonMatch[1];
                        if (jsonStr.includes(modelName)) {
                            const data = JSON.parse(jsonStr);

                            // Look for tags/variants/sizes in the JSON
                            this.extractTagsFromObject(data, modelName, tags);
                        }
                    } catch (e) {
                        // Not valid JSON, continue
                    }
                }
            } catch (error) {
                console.warn('Error parsing script content:', error);
            }
        }

        return tags;
    }

    // Recursively extracts tags from a JSON object
    static extractTagsFromObject(obj, modelName, tags) {
        if (typeof obj !== 'object' || obj === null) return;

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                // Check if this looks like a model tag
                const tagMatch = value.match(new RegExp(`${modelName}:([a-zA-Z0-9._-]+)`));
                if (tagMatch) {
                    const tagName = tagMatch[1];
                    if (!tags.some(t => t.name === tagName)) {
                        tags.push({
                            name: tagName,
                            size: 'Unknown',
                            fullName: value
                        });
                    }
                }
            } else if (typeof value === 'object') {
                this.extractTagsFromObject(value, modelName, tags);
            }
        }
    }

    // Parses tags from JSON blobs embedded in the HTML
    static parseTagsFromJSON(html, modelName) {
        const tags = [];
        //console.log('Trying JSON extraction method...');

        // Look for window.__INITIAL_STATE__ or similar patterns
        const patterns = [
            /window\.__INITIAL_STATE__\s*=\s*({.*?});/s,
            /window\.__NUXT__\s*=\s*({.*?});/s,
            /__NEXT_DATA__\s*=\s*({.*?})/s,
            /data-initial-state="([^"]*)"/,
            /data-props="([^"]*)"/
        ];

        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
                try {
                    let jsonStr = match[1];
                    if (match[0].includes('data-')) {
                        // Decode HTML entities if from data attribute
                        jsonStr = jsonStr.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
                    }

                    const data = JSON.parse(jsonStr);
                    this.extractTagsFromObject(data, modelName, tags);

                    if (tags.length > 0) {
                        //console.log(`JSON extraction found ${tags.length} tags`);
                        break;
                    }
                } catch (e) {
                    console.warn('Failed to parse JSON from pattern:', pattern);
                }
            }
        }

        return tags;
    }

    // Loads the list of local models from the backend and updates the UI
    static async loadLocalModels() {
        try {
            const response = await fetch('http://localhost:11434/api/tags');
            const data = await response.json();
            const localModelSelect = document.getElementById('local-model-select');

            if (localModelSelect && data.models) {
                localModelSelect.innerHTML = `
                    <option value="">${Lang.get('modelDeleteSelectOption')}</option>
                    ${data.models.map(model => `
                        <option value="${model.name}">${model.name}</option>
                    `).join('')}
                `;

                // Try to select the most recently downloaded model if available
                const lastModel = await this.retrieveEncryptedValue('lastDownloadedModel');
                if (lastModel && data.models.some(m => m.name === lastModel)) {
                    localModelSelect.value = lastModel;

                    // Trigger change event to update UI elements
                    const changeEvent = new Event('change');
                    localModelSelect.dispatchEvent(changeEvent);
                }
            }
            return data.models || [];
        } catch (error) {
            console.error('Error loading local models:', error);
            return [];
        }
    }

    // Deletes a local model from Ollama and updates the UI and settings
    static async deleteModel(modelName) {
        const deleteBtn = document.getElementById('delete-btn');
        const btnText = deleteBtn.querySelector('.btn-text');
        const description = document.getElementById('model-description');

        try {
            btnText.textContent = Lang.get('modelDeleting');
            deleteBtn.disabled = true;

            // Check if model is in browser settings
            const hashedMasterKey = localStorage.getItem('hashedMasterKey');
            const settings = await PaiperworkDB.loadSettings(hashedMasterKey);

            // Store the deleted model name for reference
            localStorage.setItem('lastDeletedModel', modelName);

            // Delete from Ollama
            const response = await fetch('http://localhost:11434/api/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: modelName }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // If model was saved in settings, remove it
            if (settings && settings.model === modelName) {
                settings.model = null;
                await PaiperworkDB.saveModel(hashedMasterKey, '');
                //console.log(`Removed deleted model ${modelName} from settings`);
            }
            try {

                // Also remove from localStorage if exists
                const settingsKey = `model_settings_${modelName}`;
                localStorage.removeItem(settingsKey);
            } catch (settingsError) {
                console.warn(`Error deleting settings for model ${modelName}:`, settingsError);
                // Continue with model deletion
            }
            // Refresh local models list
            await this.loadLocalModels();

            btnText.textContent = Lang.get('modelDeleted2');
            description.textContent = Lang.get('modelDeleteSuccess', { model: modelName });
            //console.log(`Model ${modelName} deleted successfully`);

            // Reset button text after a short delay
            setTimeout(() => {
                btnText.textContent = Lang.get('modelDeleteButton');
            }, 2000);

        } catch (error) {
            console.error('Error deleting model:', error);
            btnText.textContent = Lang.get('modelDeleteError');
            description.textContent = Lang.get('modelErrorMessage', { message: error.message });
        } finally {
            deleteBtn.disabled = false;
        }
    }

    // Initiates or resumes a model download, handles progress and cancellation
    static async pullModel(modelName) {
        // Get the model and tag names
        const modelParts = modelName.split(':');
        const baseModel = modelParts[0];
        const tag = modelParts[1] || '';

        // Check if this is a resume of an existing download
        const isResume = this.downloadState.isDownloading &&
            this.downloadState.selectedModel === baseModel &&
            this.downloadState.selectedTag === tag;

        // Initialize download state if not resuming
        if (!isResume) {
            this.downloadState = {
                isDownloading: true,
                selectedModel: baseModel,
                selectedTag: tag,
                downloadedSize: 0,
                totalSize: 0,
                status: Lang.get('modelDownloadStarting'),
                startTime: Date.now()
            };
        } else {
            // Just update status to show we're resuming
            this.downloadState.status = Lang.get('modelDownloadResuming');
            this.downloadState.isDownloading = true;
        }
        await this.saveDownloadState();

        const btn = document.getElementById('download-btn');
        const btnText = btn.querySelector('.btn-text');
        const description = document.getElementById('model-description');

        // Disable fetch button during download
        const fetchBtn = document.getElementById('fetch-models-btn');
        if (fetchBtn) {
            fetchBtn.disabled = true;
            fetchBtn.title = Lang.get('modelFetchDisabledDuringDownload');
        }
        // Also disable model and size selectors during download
        const modelSelect = document.getElementById('model-select');
        const sizeSelect = document.getElementById('size-select');
        if (modelSelect) {
            modelSelect.disabled = true;
            modelSelect.title = Lang.get('modelFetchDisabledDuringDownload');
        }
        if (sizeSelect) {
            sizeSelect.disabled = true;
            sizeSelect.title = Lang.get('modelFetchDisabledDuringDownload');
        }
        // Create/show cancel button
        let cancelBtn = document.getElementById('cancel-download-btn');
        if (!cancelBtn) {
            cancelBtn = this.createCancelButton();
            btn.parentNode.insertBefore(cancelBtn, btn.nextSibling);
        }

        // Status message depends on whether we're resuming
        if (isResume) {
            //console.log(`Resuming download for model: ${modelName}`);
            btnText.textContent = Lang.get('modelDownloadResuming');
            description.textContent = Lang.get('modelDownloadResuming');
        } else {
            //console.log(`Starting new download for model: ${modelName}`);
            btnText.textContent = Lang.get('modelDownloadStarting');
            description.textContent = Lang.get('modelDownloadStarting');
        }

        btn.disabled = true;
        cancelBtn.style.display = 'block';

        // Create an AbortController for cancellation
        const abortController = new AbortController();
        const signal = abortController.signal;

        // Create a local cancel handler with access to abortController
        const cancelHandler = async () => {
            const confirmCancel = confirm(Lang.get('modelCancelDownloadConfirm'));
            if (!confirmCancel) return;

            //console.log('Cancelling download for:', modelName);
            description.textContent = Lang.get('modelCancellingDownload');

            // Update download state
            this.downloadState.isDownloading = false;
            this.downloadState.status = Lang.get('modelCancellingDownload');
            await this.saveDownloadState();

            // IMPORTANT: Abort the fetch request
            abortController.abort();

            try {
                // Wait a moment for the abort to complete
                await new Promise(resolve => setTimeout(resolve, 500));

                // Update UI
                btnText.textContent = Lang.get('modelDownloadButton');
                description.textContent = Lang.get('modelDownloadCancelled');
                btn.disabled = false;
                cancelBtn.style.display = 'none';

                //Re-enable the fetch button
                const fetchBtn = document.getElementById('fetch-models-btn');
                const modelSelect = document.getElementById('model-select');
                const sizeSelect = document.getElementById('size-select');

                if (fetchBtn) {
                    fetchBtn.disabled = false;
                    fetchBtn.title = '';
                }
                if (modelSelect) {
                    modelSelect.disabled = false;
                    modelSelect.title = '';
                }
                if (sizeSelect) {
                    sizeSelect.disabled = false;
                    sizeSelect.title = '';
                }

                //console.log('Download cancelled. Partial files may remain on disk.');

                // Add restart advice
                const restartMsg = document.createElement('p');
                restartMsg.className = 'text-sm text-center text-warning';
                restartMsg.style.color = '#e74c3c';
                restartMsg.style.marginTop = '8px';
                restartMsg.textContent = Lang.get('modelDownloadCancelled');

                if (btn.parentNode) {
                    btn.parentNode.appendChild(restartMsg);
                    setTimeout(() => restartMsg.remove(), 5000); // Remove after 30 seconds
                }
            } catch (error) {
                console.error('Error during cancellation:', error);
                description.textContent = Lang.get('modelCancellationError');
            }

            // Refresh local models to be safe
            await this.loadLocalModels();
        };

        // Add the cancel handler
        cancelBtn.onclick = cancelHandler;

        try {
            //console.log('Making API call to Ollama:', {
            //url: 'http://localhost:11434/api/pull',
                //body: { name: modelName }
        //});

        const response = await fetch('http://localhost:11434/api/pull', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: modelName }),
            signal: signal // This is crucial - pass the abort signal to fetch
        });

        //console.log('API response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        let downloadedSize = 0;
        let totalSize = 0;
        let lastStatus = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
                try {
                    const status = JSON.parse(line);
                    lastStatus = status.status || lastStatus;

                    // Update total size if provided
                    if (status.total) {
                        totalSize = status.total;
                        this.downloadState.totalSize = totalSize;
                        await this.saveDownloadState();
                    }

                    // Update progress based on completed bytes
                    if (status.completed) {
                        downloadedSize = status.completed;
                        const progress = (downloadedSize / totalSize) * 100;

                        // Update download state
                        this.downloadState.downloadedSize = downloadedSize;
                        this.downloadState.status = status.status || lastStatus;

                        // Only save state periodically to avoid excessive writes
                        if (downloadedSize % 10485760 < 1048576) { // Save roughly every 10MB of progress
                            await this.saveDownloadState();
                        }

                        const downloaded = this.formatBytes(downloadedSize);
                        const total = this.formatBytes(totalSize);
                        btnText.textContent = Lang.get('modelDownloading', {
                            downloaded: downloaded,
                            total: total
                        });
                    }

                    // Update status message
                    if (status.status) {
                        description.textContent = status.status;
                        this.downloadState.status = status.status;
                    }

                    // Check for completion
                    if (status.status === "success") {
                        btnText.textContent = Lang.get('modelDownloadComplete');
                        description.textContent = Lang.get('modelDownloadSuccess', { model: modelName });

                        // Update and save download state
                        this.downloadState.isDownloading = false;
                        this.downloadState.status = "success";
                        await this.saveDownloadState();

                        //console.log('Download complete:', {
                        //model: modelName,
                            //size: this.formatBytes(totalSize),
                                //status: status.status
                    //});
                    break;
                }
                    } catch (e) {
                console.warn('Error parsing status line:', { error: e, line });
            }
        }
    }

    // Only verify after we've seen the success status
    if(lastStatus === "success") {
    //console.log('Verifying download completion...');
    const verifyResponse = await fetch('http://localhost:11434/api/tags');
    const tags = await verifyResponse.json();
    //console.log('Available models after download:', tags);

    const fetchBtn = document.getElementById('fetch-models-btn');
    const modelSelect = document.getElementById('model-select');
    const sizeSelect = document.getElementById('size-select');

    if (fetchBtn) {
        fetchBtn.disabled = false;
        fetchBtn.title = '';
    }
    if (modelSelect) {
        modelSelect.disabled = false;
        modelSelect.title = '';
    }
    if (sizeSelect) {
        sizeSelect.disabled = false;
        sizeSelect.title = '';
    }

    const modelFound = tags.models?.some(m => m.name === modelName);
    //console.log(`Model ${modelName} verification:`, modelFound ? 'Found' : 'Not found');

    if (!modelFound) {
        throw new Error('Model not found after download completed');
    }
    await this.loadLocalModels();
    // Set this as the selected model in the dropdown
    const localModelSelect = document.getElementById('local-model-select');
    if (localModelSelect) {
        localModelSelect.value = modelName;

        // Trigger change event to update UI elements like delete button
        const changeEvent = new Event('change');
        localModelSelect.dispatchEvent(changeEvent);
    }

    // Store as most recently downloaded model
    await this.storeEncryptedValue('lastDownloadedModel', modelName);
} else {
    throw new Error(`Download did not complete successfully. Final status: ${lastStatus}`);
}

        } catch (error) {
    // Check if this was an AbortError
    if (error.name === 'AbortError') {
        //console.log('Download was aborted by user');
        // The cancel handler will take care of UI updates
    } else {
        console.error('Error in pull process:', error);
        btnText.textContent = Lang.get('modelDownloadError');
        description.textContent = Lang.get('modelErrorMessage', { message: error.message });

        // Reset UI for non-abort errors
        btn.disabled = false;
        cancelBtn.style.display = 'none';

        // Re-enable fetch button on error
        const fetchBtn = document.getElementById('fetch-models-btn');
        const modelSelect = document.getElementById('model-select');
        const sizeSelect = document.getElementById('size-select');

        if (fetchBtn) {
            fetchBtn.disabled = false;
            fetchBtn.title = '';
        }
        if (modelSelect) {
            modelSelect.disabled = false;
            modelSelect.title = '';
        }
        if (sizeSelect) {
            sizeSelect.disabled = false;
            sizeSelect.title = '';
        }

        // Mark download as not in progress
        this.downloadState.isDownloading = false;
        await this.saveDownloadState();
    }

} finally {
    // Remove the event listener to prevent memory leaks
    // Only reset UI if it wasn't an abort (the cancel handler handles that case)
    if (!signal.aborted) {
        btn.disabled = false;
        cancelBtn.style.display = 'none';
    }

    //console.log('Pull process completed for:', modelName);
}
    }

    // Formats a byte count as a human-readable string (e.g., "1.2 GB")
    static formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

    // Injects CSS styles for centering and styling the models tab UI
    static addModelCenteringStyles() {
    if (document.getElementById('model-centering-styles')) {
        return; // Already added
    }

    const style = document.createElement('style');
    style.id = 'model-centering-styles';
    style.textContent = `
    /* Center models tab controls */
    .model-selector {
        max-width: 360px !important; /* Match chat tab width */
        margin: 0 auto !important;
        padding: 16px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        box-sizing: border-box !important;
    }
    
    /* Style for the fetch status message */
    #fetch-status {
        text-align: center !important;
        width: 100% !important;
        font-size: 13px !important;
        color: var(--text-color, #fff) !important;
        opacity: 0.9 !important;
        margin-top: 8px !important;
        min-height: 18px !important;
        transition: opacity 0.3s ease !important;
    }
    
    /* Make status more visible when it has content */
    #fetch-status:not(:empty) {
        opacity: 1 !important;
        margin-top: 10px !important;
        margin-bottom: 5px !important;
    }
    
    /* Create containers for the sections that will have borders */
    .download-section-container,
    .local-models-section-container {
        width: 100% !important;
        max-width: 300px !important;
        margin: 0 auto 16px auto !important;
        border: 1px solid var(--border-color, #333333) !important;
        border-radius: 8px !important;
        padding: 16px !important;
        background-color: rgba(255, 255, 255, 0.03) !important;
        box-sizing: border-box !important;
    }
    
    /* Override any existing styles for these sections */
    .model-selector .download-section,
    .model-selector .local-models-section {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        background: transparent !important;
    }
    
    .model-selector select, 
    .model-selector button,
    .model-selector .label,
    .model-selector #model-description {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        margin-left: auto !important;
        margin-right: auto !important;
        text-align: center !important;
    }
    
    .model-selector .label {
        text-align: center !important;
        display: block !important;
        margin-bottom: 8px !important;
        font-weight: 500 !important;
    }
    
    /* Adjust dropdown appearance to match chat */
    .model-selector select {
        height: 38px !important;
        padding: 0 10px !important;
        border: 2px solid var(--border-color) !important;
        border-radius: 4px !important;
        background-color: var(--bg-color) !important;
        color: var(--text-color) !important;
        font-size: 14px !important;
        margin-bottom: 12px !important;
    }
    
    .model-selector button {
        height: 38px !important;
        border-radius: 6px !important;
        font-size: 14px !important;
        margin-top: 8px !important;
    }
    
    /* Style for the download progress text */
    .model-selector button .btn-text {
        color: rgba(255, 255, 255, 0.9) !important; /* Light gray text for better visibility */
        font-weight: 500 !important; /* Make text slightly bolder */
        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3) !important; /* Add subtle text shadow for better readability */
    }
    
    /* Style when the button is disabled (during download) */
    .model-selector button:disabled .btn-text {
        color: rgba(255, 255, 255, 0.9) !important; /* Keep text visible when disabled */
    }
    
    #model-description {
    color: var(--text-color) !important;
        min-height: 20px !important;
        margin: 8px 0 !important;
        font-size: 13px !important;
    }
    .text-gray-500 {
    color: var(--text-color) !important;
    opacity: 0.7;
    } 
    /* Remove the border-top from the local models section */
    .local-models-section.mt-12.pt-4.border-t.border-gray-700 {
        margin-top: 0 !important;
        padding-top: 0 !important;
        border-top: none !important;
    }
         /* Improved styling for disabled fetch button */
    .fetch-models-btn:disabled {
        opacity: 0.6 !important;
        cursor: not-allowed !important;
        background-color: #303030 !important; /* Darker background when disabled */
    }

    /* Prevent hover effect on disabled buttons */
    .fetch-models-btn:disabled:hover {
        background-color: #303030 !important; /* Keep the darker background on hover when disabled */
    }

    /* Style download button when disabled */
    #download-btn:disabled {
        opacity: 0.6 !important;
        cursor: not-allowed !important;
        background-color: #303030 !important;
    }

    #download-btn:disabled:hover {
        background-color: #303030 !important;
    }
    
    /* Add tooltip for disabled fetch button */
    .fetch-models-btn {
        position: relative !important;
    }
    
    .fetch-models-btn:disabled[title]:hover::before {
        content: attr(title);
        position: absolute;
        top: -35px;
        left: 50%;
        transform: translateX(-50%);
        padding: 5px 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 100;
    }
    `;

    document.head.appendChild(style);

    // Now we need to modify the HTML structure to add the container divs
    setTimeout(() => {
        // Get the sections
        const downloadSection = document.querySelector('.download-section');
        const localModelsSection = document.querySelector('.local-models-section');

        if (downloadSection && !downloadSection.parentElement.classList.contains('download-section-container')) {
            // Wrap the download section in a container
            const container = document.createElement('div');
            container.className = 'download-section-container';
            downloadSection.parentNode.insertBefore(container, downloadSection);
            container.appendChild(downloadSection);
        }

        if (localModelsSection && !localModelsSection.parentElement.classList.contains('local-models-section-container')) {
            // Wrap the local models section in a container
            const container = document.createElement('div');
            container.className = 'local-models-section-container';
            localModelsSection.parentNode.insertBefore(container, localModelsSection);
            container.appendChild(localModelsSection);
        }
    }, 100);
}

    // Stores a value in localStorage with encryption
    static async storeEncryptedValue(key, value) {
    // Use a fixed key for non-user data (or derive from a fixed application seed)
    const appKey = await PaiperworkDB.hashMasterKeyValue('application-settings');
    const encrypted = await PaiperworkDB.encryptPrompt(appKey, value);
    localStorage.setItem(key, JSON.stringify(encrypted));
}

    // Retrieves and decrypts a value from localStorage
    static async retrieveEncryptedValue(key) {
    const encryptedData = localStorage.getItem(key);
    if (!encryptedData) return null;

    const appKey = await PaiperworkDB.hashMasterKeyValue('application-settings');
    try {
        return await PaiperworkDB.decryptPrompt(appKey, JSON.parse(encryptedData));
    } catch (e) {
        console.error('Failed to decrypt localStorage value:', e);
        return null;
    }
}
}

// Register the class and signal it's loaded
window.ModelDownloader = ModelDownloader;
window.ModelDownloaderLoaded = true;
(async function () {
    try {
        const version = await ModelDownloader.detectOllamaVersion();
        //console.log('Initialized Ollama version detection:', version);
    } catch (error) {
        console.error('Error initializing Ollama version detection:', error);
    }
})();
