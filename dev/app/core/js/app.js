document.addEventListener('DOMContentLoaded', async function () {
   //console.log('DOM Content Loaded');
    Lang.initialize();
    OllamaAPI.currentContextSize = parseInt(document.getElementById('context-selector')?.value || 8192);
    setupTabSwitching();

    // Initialize app with database and UI elements
    const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
    if (hashedMasterKey && document.getElementById('model-selector')) {
       //console.log('Starting initialization');
        window.__paiperworkDbBootPromise = (async () => {
            const dbInitialized = await PaiperworkDB.initializeDatabase(hashedMasterKey);
            if (!dbInitialized) {
                return false;
            }

            const settings = await PaiperworkDB.loadSettings(hashedMasterKey);

            // Reconcile latest local selection into DB on startup when they diverge.
            // This protects against stale persisted DB state after rapid tab/model changes.
            try {
                const localModel = await PaiperworkDB.readNormalizedLocalStorageValue('selectedModel', hashedMasterKey);
                const localProvider = String(await PaiperworkDB.readNormalizedLocalStorageValue('selectedModelProvider', hashedMasterKey) || 'local').trim().toLowerCase() || 'local';
                const dbModel = String(settings?.model || '').trim();
                const dbProvider = String(settings?.modelProvider || 'local').trim().toLowerCase() || 'local';

                if (localModel && (localModel !== dbModel || localProvider !== dbProvider)) {
                    await PaiperworkDB.saveModel(hashedMasterKey, localModel, localProvider);
                }
            } catch (_reconcileErr) {
                // Non-fatal; app should still continue startup.
            }

            // Warm API key lookup cache so first cloud send after refresh is not racing storage init.
            try {
                await PaiperworkDB.getOllamaApiKey(hashedMasterKey);
            } catch (_warmErr) {
                // Non-fatal warmup failure.
            }

            return true;
        })();

        try {
            const dbInitialized = await window.__paiperworkDbBootPromise;
            if (dbInitialized) {
                const settings = await PaiperworkDB.loadSettings(hashedMasterKey);
               //console.log('Settings loaded');

                // Initialize UI using ChatTab instead
               //console.log('App.js: Initializing ChatTab');
                await ChatTab.initialize();
               //console.log('App.js: ChatTab UI initialization complete');
            }
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }
});


// Sets up tab switching logic and handles tab activation/deactivation events
function setupTabSwitching() {
    //console.debug('[app] setupTabSwitching initializing');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

   //console.log('App: Setting up tab buttons:', tabButtons.length);
   //console.log('App: Setting up tab panes:', tabPanes.length);

    let previousTab = document.querySelector('.tab-button.active')?.dataset?.tab || null;

    tabButtons.forEach(button => {
        button.addEventListener('click', async () => {
           //console.log('App: Tab clicked:', button.dataset.tab);

            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Get corresponding tab pane and activate it
            const tabId = `${button.dataset.tab}-tab`;
            const tabElement = document.getElementById(tabId);
           //console.log(`App: Looking for tab element: ${tabId}`, !!tabElement);

            if (tabElement) {
                tabElement.classList.add('active');

                // Force repaint to ensure consistent styling
                void tabElement.offsetWidth;
            }
            // Notify the previous tab it's being deactivated (if it has a handler)
            if (previousTab && previousTab !== button.dataset.tab) {
                const prevTabInstance = window[`${previousTab}Tab`];
                if (prevTabInstance && typeof prevTabInstance.handleTabChange === 'function') {
                   //console.log(`App: Notifying ${previousTab}Tab it's being deactivated`);
                    prevTabInstance.handleTabChange(false);
                }

                // Release heavy vector DB instances when leaving Documents tab.
                if (previousTab === 'documents' && button.dataset.tab !== 'documents' && window.PaiperworkDB) {
                    const isStillProcessingDocs = !!(window.RAG_Utils &&
                        typeof window.RAG_Utils.isDocumentProcessing === 'function' &&
                        window.RAG_Utils.isDocumentProcessing());

                    if (!isStillProcessingDocs && typeof window.PaiperworkDB.closeRagDatabases === 'function') {
                        await window.PaiperworkDB.closeRagDatabases(sessionStorage.getItem('hashedMasterKey'));
                    }
                }

                // Release html payload DB handles when exiting Artifacts/SlideForge context.
                const leavesHtmlTabs = (previousTab === 'artifacts' || previousTab === 'presentation') &&
                    button.dataset.tab !== 'artifacts' &&
                    button.dataset.tab !== 'presentation';

                if (leavesHtmlTabs && window.PaiperworkDB && typeof window.PaiperworkDB.closeHtmlDatabases === 'function') {
                    await window.PaiperworkDB.closeHtmlDatabases(sessionStorage.getItem('hashedMasterKey'));
                }

                // Release knowledge-base DB handles when exiting Research tab.
                if (previousTab === 'research' && button.dataset.tab !== 'research' && window.PaiperworkDB && typeof window.PaiperworkDB.closeKnowledgeDatabases === 'function') {
                    await window.PaiperworkDB.closeKnowledgeDatabases(sessionStorage.getItem('hashedMasterKey'));
                }
            }
            // Handle specific tab activations
            if (button.dataset.tab === 'models') {
                handleModelsTab();
            } else if (button.dataset.tab === 'chat') {
                await handleChatTab();
            } else if (button.dataset.tab === 'documents') {
                await handleDocumentsTab();
            } else if (button.dataset.tab === 'dataviz') {
                await handleDataVizTab();
            } else if (button.dataset.tab === 'paperwork') {
                await handlePaperworkTab();
            } else if (button.dataset.tab === 'artwork') {
                await handleArtworksTab();
            } else if (button.dataset.tab === 'research') {
                await handleResearchTab();
                if (window.researchTab && typeof window.researchTab.clearModelWarningIfModelSelected === 'function') {
                    window.researchTab.clearModelWarningIfModelSelected();
                }
            } else if (button.dataset.tab === 'presentation') {
                await handlepresentationtab();
            } else if (button.dataset.tab === 'database') {
                await handleDatabaseTab();
            }
            // Guarded exit: call the module function if available to avoid ReferenceError
            if (typeof exitDocumentQuestioningMode === 'function') {
                exitDocumentQuestioningMode();
            } else if (window.RAG_Utils && typeof window.RAG_Utils.exitDocumentQuestioningMode === 'function') {
                window.RAG_Utils.exitDocumentQuestioningMode();
            }


            // Notify the new tab it's being activated (if it has a handler)
            const newTabInstance = window[`${button.dataset.tab}Tab`];
            if (newTabInstance && typeof newTabInstance.handleTabChange === 'function') {
               //console.log(`App: Notifying ${button.dataset.tab}Tab it's being activated`);
                newTabInstance.handleTabChange(true);
            }
            // Special case: SlideForge tab (ensure UI always renders)
           /* ß */
            // Apply consistent styling to tab container
            document.querySelector('.tab-container').classList.add('tab-switched');
            setTimeout(() => {
                document.querySelector('.tab-container').classList.remove('tab-switched');
            }, 50);

            // If documents tab and progressContainer is showing, disable upload zone
            if (button.dataset.tab === 'documents' &&
                window.RAG_Utils &&
                window.RAG_Utils.documentUIElements &&
                window.RAG_Utils.documentUIElements.progressContainer &&
                window.RAG_Utils.documentUIElements.progressContainer.style.display !== 'none') {

                // Processing in progress - make sure upload zone is hidden
                if (window.RAG_Utils.documentUIElements.uploadZone) {
                    window.RAG_Utils.documentUIElements.uploadZone.style.display = 'none';
                }
            }

            previousTab = button.dataset.tab;
        });
    });
}

// Handles initialization and UI setup for the DataViz tab
async function handleDataVizTab() {
   //console.log('App: DataViz tab clicked');

    try {
        // Wait for scripts to load first
        if (!window.DataViz) {
           //console.log('App: Waiting for DataViz library to load...');
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.DataViz) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts > 10) { // 2 seconds timeout
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for DataViz to load'));
                    }
                }, 200);
            });
        }

        // Now initialize DataViz
        if (window.dataViz) {
            await window.dataViz.initialize();
           //console.log('App: DataViz library initialized');
        } else {
           //console.log('App: Creating new DataViz instance');
            window.dataViz = new window.DataViz();
            await window.dataViz.initialize();
        }

        // Similarly wait for DataVizTab
        if (!window.DataVizTab) {
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.DataVizTab) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts > 10) {
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for DataVizTab to load'));
                    }
                }, 200);
            });
        }

        // Initialize DataViz UI
        if (window.dataVizTab) {
           //console.log('App: Initializing DataViz UI');
            await window.dataVizTab.initialize();
        } else {
           //console.log('App: Creating new DataVizTab instance');
            window.dataVizTab = new window.DataVizTab();
            await window.dataVizTab.initialize();
        }
    } catch (error) {
        console.error('App: Error initializing DataViz:', error);

        // Show error message in the tab
        const datavizTab = document.getElementById('dataviz-tab');
        if (datavizTab) {
            datavizTab.innerHTML = `
            <div class="dataviz-error" style="padding: 20px; text-align: center; color: #e74c3c;">
                <h3>${Lang.get('errorLoadingModels')}</h3>
                <p>${error.message || Lang.get('errorTryAgain')}</p>
                <button onclick="window.tabLoader.retryLoad('dataviz')" 
                        style="padding: 8px 16px; margin-top: 10px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    ${Lang.get('retryButton')}
                </button>
            </div>
        `;
        }
    }
}

// Handles refreshing and setting the model selector in the Chat tab
async function handleChatTab() {
   //console.log('Chat tab clicked - refreshing model list');
    const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
    const lastDeletedModel = sessionStorage.getItem('lastDeletedModel');

    // Give the DOM time to update after tab switch
    setTimeout(async () => {
        const settings = await PaiperworkDB.loadSettings(hashedMasterKey);
        const persistedModel = await PaiperworkDB.readNormalizedLocalStorageValue('selectedModel', hashedMasterKey);
        const persistedProvider = String(await PaiperworkDB.readNormalizedLocalStorageValue('selectedModelProvider', hashedMasterKey) || '').trim();
                       
        const modelSelector = document.getElementById('model-selector');
       //console.log('Model selector present:', !!modelSelector);

        if (modelSelector) {
            try {
                // Preserve current UI selection as a fallback for tab switches.
                const previousOption = modelSelector.options[modelSelector.selectedIndex] || null;
                const previousModel = modelSelector.value || '';
                const previousProvider = (previousOption && previousOption.dataset && previousOption.dataset.provider)
                    ? previousOption.dataset.provider
                    : ((window.OllamaAPI && typeof window.OllamaAPI.getModelSource === 'function')
                        ? (window.OllamaAPI.getModelSource(previousModel) || 'local')
                        : 'local');

                // Clear existing options
                modelSelector.innerHTML = `<option value="">${Lang.get('selectModel')}</option>`;

                // Wait for models to load and populate
                const modelsLoaded = await OllamaAPI.loadOllamaModels();
                if (!modelsLoaded) {
                    console.warn('App: Skipping model restore because model list failed to load');
                    return;
                }

                // IMPORTANT: Prefer the model that is currently selected in UI memory.
                // On quick tab switches, DB settings can still be stale for a brief moment.
                const targetModel = previousModel || persistedModel || ((settings && settings.model) ? settings.model : '');
                const targetProvider = previousModel
                    ? previousProvider
                    : (persistedModel
                        ? (String(persistedProvider || '').trim().toLowerCase() || previousProvider)
                        : ((settings && settings.modelProvider && String(settings.modelProvider).trim())
                            ? String(settings.modelProvider).trim().toLowerCase()
                            : previousProvider));

                // Check if previously selected model still exists
                if (targetModel) {
                   //console.log('Checking for previously selected model:', settings.model);
                    const desiredProvider = targetProvider;

                    const exactProviderOption = Array.from(modelSelector.options).find(option =>
                        option.value === targetModel &&
                        option.dataset &&
                        option.dataset.provider === desiredProvider
                    );

                    const modelExists = !!exactProviderOption || Array.from(modelSelector.options)
                        .some(option => option.value === targetModel);

                    if (modelExists) {
                        if (exactProviderOption) {
                            modelSelector.value = exactProviderOption.value;
                            modelSelector.selectedIndex = exactProviderOption.index;
                        } else {
                            modelSelector.value = targetModel;
                        }
                       //console.log('Successfully set model to:', targetModel);
                    } else {
                        // Check if this was the model we just deleted
                        if (lastDeletedModel && lastDeletedModel === targetModel) {
                            alert(Lang.get('modelDeleted').replace('{model}', targetModel));
                            sessionStorage.removeItem('lastDeletedModel'); // Clear the reference
                        }
                        // Only clear persisted model if it came from settings; do not clear
                        // when this was only an in-memory fallback selection.
                        if (settings && settings.model) {
                            await PaiperworkDB.saveModel(hashedMasterKey, '');
                        }
                        console.warn('Previously selected model not found:', targetModel);
                    }
                }
            } catch (error) {
                console.error('Error setting model:', error);
            }
        }
    }, 100);
}

// Initializes or refreshes the Documents tab and its UI
async function handleDocumentsTab() {
   //console.log('App: Documents tab clicked');

    // Keep model list in sync with current local/cloud state (same behavior intent as Chat tab).
    const modelSelector = document.getElementById('model-selector');
    if (modelSelector && window.OllamaAPI && typeof window.OllamaAPI.loadOllamaModels === 'function') {
        try {
            const previousOption = modelSelector.options[modelSelector.selectedIndex] || null;
            const previousModel = modelSelector.value || '';
            const previousProvider = (previousOption && previousOption.dataset && previousOption.dataset.provider)
                ? previousOption.dataset.provider
                : ((window.OllamaAPI && typeof window.OllamaAPI.getModelSource === 'function')
                    ? (window.OllamaAPI.getModelSource(previousModel) || 'local')
                    : 'local');

            const modelsLoaded = await window.OllamaAPI.loadOllamaModels();
            if (modelsLoaded && previousModel) {
                const exactProviderOption = Array.from(modelSelector.options).find(option =>
                    option.value === previousModel &&
                    option.dataset &&
                    option.dataset.provider === previousProvider
                );

                const fallbackOption = Array.from(modelSelector.options).find(option =>
                    option.value === previousModel
                );

                const optionToRestore = exactProviderOption || fallbackOption;
                if (optionToRestore) {
                    modelSelector.value = optionToRestore.value;
                    modelSelector.selectedIndex = optionToRestore.index;
                }
            }
        } catch (modelRefreshError) {
            console.error('App: Error refreshing model list for Documents tab:', modelRefreshError);
        }
    }

    // Create a helper function to initialize or refresh documents
    const initOrRefreshDocuments = async (retry = false) => {
        if (window.RAG_Utils) {
            if (!window.RAG_Utils.initialized) {
               //console.log('App: Initializing document UI');
                window.RAG_Utils.initializeDocumentUI();
                // Additional wait to ensure documents load
                setTimeout(() => {
                    window.RAG_Utils.updateDocumentsList(true).catch(error => {
                        console.error('App: Error updating documents list after init:', error);
                    });
                }, 200);
            } else {
               //console.log('App: Document UI already initialized, refreshing document list');
                window.RAG_Utils.updateDocumentsList(true).catch(error => {
                    console.error('App: Error updating documents list:', error);
                });
            }
            return true;
        }
        return false;
    };

    // First attempt to initialize or refresh documents
    let success = await initOrRefreshDocuments();
    if (success && window.RAG_Utils && typeof window.RAG_Utils.refreshEmbeddingModelSelectorWithPrompt === 'function') {
        window.RAG_Utils.refreshEmbeddingModelSelectorWithPrompt();
    }

    // If RAG_Utils isn't available yet, wait and retry with increasing intervals
    if (!success) {
       //console.log('App: RAG_Utils not available, waiting 100ms...');
        await new Promise(resolve => setTimeout(resolve, 100));
        success = await initOrRefreshDocuments();
        if (success && window.RAG_Utils && typeof window.RAG_Utils.refreshEmbeddingModelSelectorWithPrompt === 'function') {
            window.RAG_Utils.refreshEmbeddingModelSelectorWithPrompt();
        }

        if (!success) {
           //console.log('App: RAG_Utils still not available, waiting 300ms...');
            await new Promise(resolve => setTimeout(resolve, 300));
            success = await initOrRefreshDocuments(true);
            if (success && window.RAG_Utils && typeof window.RAG_Utils.refreshEmbeddingModelSelectorWithPrompt === 'function') {
                window.RAG_Utils.refreshEmbeddingModelSelectorWithPrompt();
            }

            if (!success) {
                console.error('App: RAG_Utils still not available after multiple attempts');

                // Create placeholder UI
                const documentsTab = document.getElementById('documents-tab');
                if (documentsTab) {
                    documentsTab.innerHTML = `
                    <div class="documents-area">
                        <div class="empty-state">
                            <p>${Lang.get('documentSystemUnavailable')}</p>
                            <p>${Lang.get('refreshPage')}</p>
                        </div>
                    </div>
                `;
                }
            }
        }
    }
}

// Initializes and displays the Paperwork tab and its tools
async function handlePaperworkTab() {
   //console.log('App: Paperwork tab clicked');

    try {
        // Get the paperwork tab element
        const paperworkTab = document.getElementById('paperwork-tab');

        // Clear any existing content first to ensure we start fresh
        if (paperworkTab) {
            paperworkTab.innerHTML = `<div style="text-align:center; padding:20px;">${Lang.get('loadingDocumentTools')}</div>`;
            paperworkTab.removeAttribute('data-initialized');
        }

        // Check if Paperwork class is available
        if (!window.Paperwork) {
            //console.warn('App: Paperwork class not loaded, waiting...');

            // Wait for Paperwork class to be available with timeout
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 10;
                const checkInterval = setInterval(() => {
                    if (window.Paperwork) {
                        clearInterval(checkInterval);
                        resolve();
                    } else if (++attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        reject(new Error('Paperwork class failed to load'));
                    }
                }, 200);
            });
        }

        // Create a new Paperwork instance if it doesn't exist yet
        if (!window.paperworkInstance) {
           //console.log('App: Creating new Paperwork instance');
            window.paperworkInstance = new window.Paperwork();

            // Initialize the paperwork instance
            await window.paperworkInstance.initialize();
        }

        // Wait for PaperworkTab to be available
        if (!window.paperworkTab) {
           //console.log('App: Waiting for PaperworkTab to load...');
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 10;
                const checkInterval = setInterval(() => {
                    if (window.paperworkTab) {
                        clearInterval(checkInterval);
                        resolve();
                    } else if (++attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        reject(new Error('PaperworkTab instance failed to load'));
                    }
                }, 200);
            });

            // Initialize PaperworkTab if it hasn't been initialized
            if (!window.paperworkTab.initialized) {
                await window.paperworkTab.initialize();
            }
        }

        // Now call showPaperworkTab from the global paperworkTab instance
       //console.log('App: Showing paperwork tab content');
        window.paperworkTab.showPaperworkTab();

    } catch (error) {
        console.error('App: Error initializing Paperwork:', error);

        // Show error message in the paperwork tab
        const paperworkTab = document.getElementById('paperwork-tab');
        if (paperworkTab) {
            paperworkTab.innerHTML = `
                <div style="text-align:center; padding:20px; color:#e74c3c;">
                    <h3>${Lang.get('failedLoadDocumentTools')}</h3>
                    <p>${error.message}</p>
                    <button onclick="handlePaperworkTab()" 
                            style="padding:8px 16px; background:#4f46e5; color:white; 
                            border:none; border-radius:4px; margin-top:10px; cursor:pointer;">
                        ${Lang.get('retryButton')}
                    </button>
                </div>
            `;
        }
    }
}

// Initializes and displays the Research tab and its tools
async function handleResearchTab() {
   //console.log('App: Research tab clicked');

    try {
        // Wait for Research classes to be available
        if (!window.ResearchTab) {
           //console.log('App: Waiting for ResearchTab to load...');
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.ResearchTab) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts > 10) { // 2 seconds timeout
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for Research module'));
                    }
                }, 200);
            });
        }

        // Initialize Research tab
        if (window.researchTab) {
           //console.log('App: Research module already initialized');
            if (!window.researchTab.initialized) {
                await window.researchTab.initialize();
            } else {
                // Simply notify the tab that it's being activated
                if (typeof window.researchTab.handleTabChange === 'function') {
                    window.researchTab.handleTabChange(true);
                }
            }
        } else {
           //console.log('App: Creating new ResearchTab instance');
            window.researchTab = new ResearchTab();
            await window.researchTab.initialize();
        }
    } catch (error) {
        console.error('App: Error initializing Research tab:', error);

        // Show error message
        const researchTab = document.getElementById('research-tab');
        if (researchTab) {
            researchTab.innerHTML = `
                <div style="text-align:center; padding:20px; color:#e74c3c;">
                    <h3>${Lang.get('failedLoadResearchTools')}</h3>
                    <p>${error.message}</p>
                    <button onclick="handleResearchTab()" 
                            style="padding:8px 16px; background:#4f46e5; color:white; 
                            border:none; border-radius:4px; margin-top:10px; cursor:pointer;">
                     ${Lang.get('retryButton')}
                    </button>
                </div>
            `;
        }
    }
}

// Initializes and displays the Artworks tab and its tools
async function handleArtworksTab() {
   //console.log('App: Artwork tab clicked');

    try {
        // Wait for scripts to load first
        if (!window.Artworks) {
           //console.log('App: Waiting for Artworks library to load...');
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.Artworks) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts > 10) { // 2 seconds timeout
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for Artworks to load'));
                    }
                }, 200);
            });
        }

        // Now initialize Artworks instance if needed
        if (!window.artworksInstance) {
           //console.log('App: Creating new Artworks instance');
            window.artworksInstance = new window.Artworks();
            await window.artworksInstance.initialize();
        }

        // Wait for ArtworksTab
        if (!window.ArtworksTab) {
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.ArtworksTab) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts > 10) {
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for ArtworksTab to load'));
                    }
                }, 200);
            });
        }

        // Initialize ArtworksTab UI
        if (window.artworksTab) {
           //console.log('App: Initializing Artworks UI');
            await window.artworksTab.initialize();
        } else {
           //console.log('App: Creating new ArtworksTab instance');
            window.artworksTab = new window.ArtworksTab();
            await window.artworksTab.initialize();
        }

        // Reset Ollama context to ensure no lingering images
        OllamaAPI.resetContext();

    } catch (error) {
        console.error('App: Error initializing Artworks:', error);

        // Show error message in the tab
        const artworkTab = document.getElementById('artwork-tab');
        if (artworkTab) {
            artworkTab.innerHTML = `
                <div class="artwork-error" style="padding: 20px; text-align: center; color: #e74c3c;">
                    <h3>${Lang.get('errorLoadingVisualModels') || 'Error Loading Visual Models'}</h3>
                    <p>${error.message || Lang.get('errorTryAgain') || 'Please try again later.'}</p>
                    <button onclick="window.handleArtworksTab()" 
                            style="padding: 8px 16px; margin-top: 10px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ${Lang.get('retryButton') || 'Retry'}
                    </button>
                </div>
            `;
        }
    }
}

// Initializes and displays the SlideForge tab and its document processing tools
async function handlepresentationtab() {
   //console.log('App: SlideForge tab clicked');

    try {
        // Wait for scripts to load first
        if (!window.presentation) {
           //console.log('App: Waiting for SlideForge library to load...');
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.presentation) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts > 10) { // 2 seconds timeout
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for SlideForge to load'));
                    }
                }, 200);
            });
        }

        // Now initialize SlideForge instance if needed
        if (!window.presentation) {
           //console.log('App: Creating new SlideForge instance');
            window.presentation = new window.presentation();
            await window.presentation.initialize();
        }

        // Wait for presentationtab
        if (!window.presentationtab) {
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.presentationtab) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts > 10) {
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for presentationtab to load'));
                    }
                }, 200);
            });
        }

        // Initialize presentationtab UI
        if (window.presentationtab) {
           //console.log('App: Initializing SlideForge UI');
            await window.presentationtab.initialize();
        } else {
           //console.log('App: Creating new presentationtab instance');
            window.presentationtab = new window.presentationtab();
            await window.presentationtab.initialize();
        }

    } catch (error) {
        console.error('App: Error initializing SlideForge:', error);

        // Show error message in the tab
        const presentationtab = document.getElementById('presentation-tab');
        if (presentationtab) {
            presentationtab.innerHTML = `
                <div class="presentation-error" style="padding: 20px; text-align: center; color: #e74c3c;">
                    <h3>${Lang.get('errorLoadingSlideForgeTools') || 'Error Loading SlideForge Tools'}</h3>
                    <p>${error.message || Lang.get('errorTryAgain') || 'Please try again later.'}</p>
                    <button onclick="window.handlepresentationtab()" 
                            style="padding: 8px 16px; margin-top: 10px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ${Lang.get('retryButton') || 'Retry'}
                    </button>
                </div>
            `;
        }
    }
}

// Initializes and displays the Models tab and its model downloader UI
async function handleModelsTab() {

   //console.log('Models tab clicked - initializing model downloader UI');

    try {
        // Wait for ModelDownloader to be available
        if (!window.ModelDownloader) {
           //console.log('Waiting for ModelDownloader to load...');
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.ModelDownloader) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts > 50) { // 5 seconds timeout
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for ModelDownloader'));
                    }
                }, 100);
            });
        }

        // Initialize ModelDownloader first
        if (typeof window.ModelDownloader.initialize === 'function') {
            window.ModelDownloader.initialize();
        }
        // Initialize UI immediately with empty models array
        // This will create the UI structure and immediately start loading local models
        window.ModelDownloader.displayModels([]);



    } catch (error) {
        console.error('Error in models tab:', error);
        const modelsTab = document.getElementById('models-tab');
        if (modelsTab) {
            modelsTab.innerHTML = `
                <div class="error-message" style="padding: 20px; text-align: center; color: #e74c3c;">
                    <h3>${Lang.get('errorLoadingModels')}</h3>
                    <p>${error.message}</p>
                    <button onclick="window.tabLoader.retryLoad('models')" 
                            style="padding: 8px 16px; margin-top: 10px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ${Lang.get('retryButton')}
                    </button>
                </div>
            `;
        }
    }

}

// Initializes and displays the Database tab and its management UI
async function handleDatabaseTab() {
   //console.log('Database tab clicked');

    try {
        // Check if DatabaseTab is available
        if (!window.DatabaseTab) {
           //console.log('Waiting for DatabaseTab to load...');
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.DatabaseTab) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts > 10) { // 2 seconds timeout
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for DatabaseTab to load'));
                    }
                }, 200);
            });
        }

        // Initialize Database tab
        if (window.databaseTab) {
           //console.log('Database module already initialized');
            if (!window.databaseTab.initialized) {
                await window.databaseTab.initialize();
            } else {
                // Simply notify the tab that it's being activated
                if (typeof window.databaseTab.handleTabChange === 'function') {
                    window.databaseTab.handleTabChange(true);
                }
            }
        } else {
           //console.log('Creating new DatabaseTab instance');
            window.databaseTab = new DatabaseTab();
            await window.databaseTab.initialize();
        }
    } catch (error) {
        console.error('Error initializing Database tab:', error);

        // Show error message
        const databaseTab = document.getElementById('database-tab');
        if (databaseTab) {
            databaseTab.innerHTML = `
                <div style="text-align:center; padding:20px; color:#e74c3c;">
                    <h3>${Lang.get('failedLoadDatabaseManagement')}</h3>
                    <p>${error.message}</p>
                    <button onclick="handleDatabaseTab()" 
                            style="padding:8px 16px; background:#4f46e5; color:white; 
                            border:none; border-radius:4px; margin-top:10px; cursor:pointer;">
                       ${Lang.get('retryButton')}
                    </button>
                </div>
            `;
        }
    }
}

// Sets up event handlers and styles for the chat interface
function setupChatHandlers(sendButton, promptInput) {
    const aiReplies = document.querySelector('.ai-replies');

}

// Cancels the current Ollama generation process and resets UI state
function cancelOllamaGeneration() {
   //console.log('App: Delegating cancellation to Chat instance');

    // Simply delegate to ChatTab or Chat
    if (window.chatTab) {
        // Let ChatTab handle the cancellation entirely
        if (typeof window.chatTab.handleCancelGeneration === 'function') {
            return window.chatTab.handleCancelGeneration();
        }
    }

    // Fall back to Chat if ChatTab isn't available
    if (window.chat && window.chat.initialized) {
        return window.chat.cancelOllamaGeneration();
    }

    // Last resort fallback
    console.warn('App: No chat instances available for cancellation');

    // Reset UI state as a last resort
    const sendButton = document.getElementById('send-prompt');
    if (sendButton) {
        sendButton.textContent = Lang.get('sendButton');
        sendButton.style.backgroundColor = '';
        sendButton.style.color = '';
        sendButton.classList.remove('cancel-state');
    }

    // Additionally, abort any global abort controller used by other flows (e.g., Documents tab)
    try {
        if (window.globalAbortController) {
            try {
                window.globalAbortController.abort();
            } catch (e) {
                // ignore
            }
            window.globalAbortController = null;
        }
    } catch (err) {
        console.warn('App: Error aborting globalAbortController during cancel:', err);
    }

    window.isGenerating = false;
    return false;
}

window.cancelOllamaGeneration = cancelOllamaGeneration;
window.handlePaperworkTab = handlePaperworkTab;
window.handleArtworksTab = handleArtworksTab;
window.handlepresentationtab = handlepresentationtab;
window.handleDatabaseTab = handleDatabaseTab;