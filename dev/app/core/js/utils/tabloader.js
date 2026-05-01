class TabLoader {
    // Initializes the TabLoader instance, sets up tab configurations, and triggers tab initialization.
    constructor() {
        this.loadedModules = {};
        this.loadingPromises = {};
        this.loadedClasses = {};
        this.pollIntervalMs = 100;
        this.tabConfigs = {
            'chat': {
                required: true,
                scripts: []
            },
            'documents': {
                required: false,
                scripts: ['js/tabs/documents_tab.js']
            },
            'dataviz': {
                scripts: ['js/utils/charts/chartRenderer.js', 'js/utils/charts/piechart.js', 'js/utils/charts/barchart.js', 'js/utils/charts/linechart.js', 'js/utils/charts/scatterplotchart.js', 'js/utils/charts/areachart.js', 'js/utils/charts/radarchart.js', 'js/utils/charts/heatmap.js', 'js/utils/charts/bubblechart.js', 'js/tabs/dataviz.js', 'js/tabs/dataviztab.js']
            },
            'paperwork': {
                scripts: [
                    'js/tabs/paperworkgenerator.js',
                    'js/tabs/paperwork.js',
                    'js/tabs/paperworktab.js',
                ]
            },
            'translate': {
                scripts: [
                    'js/tabs/translate.js',
                    'js/tabs/translateTab.js',
                ]
            },
            'research': {
                scripts: [
                    'js/tabs/research.js',
                    'js/tabs/researchTab.js',
                ]
            },
            'artwork': {
                scripts: [
                    'js/tabs/artworks.js',
                    'js/tabs/artworkstab.js',
                    'js/tabs/artworkpreviewwindow.js',
                ]
            },
            'models': {
                scripts: ['js/tabs/modelstab.js']
            },
            'connectors': {
                scripts: ['js/utils/keymaps.js', 'js/tabs/connectorstab.js']
            },
            'presentation': {
                scripts: [
                    'js/libraries/JSZip/jszip.min.js',
                    'js/libraries/konvajs/konva.min.js',
                    'js/libraries/PDFjs/jspdf.umd.min.js',
                    'js/utils/presentation/SlideStyles.js',
                    'js/utils/presentation/sidebar.js',
                    'js/utils/presentation/content.js',
                    'js/utils/presentation/undoSystem.js',
                    'js/utils/presentation/component_selectionHelper.js',
                    'js/tabs/presentation.js',
                    'js/utils/presentation/previewwindow.js',
                    'js/utils/presentation/pdfexport.js',
                    'js/utils/presentation/StyleDIY.js',
                    'js/utils/presentation/promptedpresentation.js',
                    'js/tabs/presentationTab.js'
                ]
            },
            'artifacts': {
                scripts: ['js/tabs/artifacts.js', 'js/tabs/artifactstab.js']
            },

        };

        this.initializeTabs();
    }

    // Detect hosted/cloud mode so slow remote loads get a longer readiness timeout.
    isOnlineMode() {
        if (window.PAIPERWORK_CLOUD_ONLY === true) {
            return true;
        }
        if (window.PAIPERWORK_IS_LOCAL_RUNTIME === true) {
            return false;
        }

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

    getTabLoadMaxAttempts() {
        return this.isOnlineMode() ? 180 : 50;
    }

    // Sets up click handlers for tab buttons and loads scripts for the active tab on page load.
    initializeTabs() {
        // Set up tab button click handlers
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                this.loadTabScripts(tabName);
            });
        });


        // No hashed masterkey yet, just load tab scripts normally
        const activeTab = document.querySelector('.tab-button.active');
        if (activeTab) {
            const tabName = activeTab.getAttribute('data-tab');
            this.loadTabScripts(tabName);
        }

    }

    // Initializes the UI components or class instances for the specified tab after its scripts are loaded.
    initializeTabComponent(tabName) {
       //console.log(`TabLoader: Initializing component for tab "${tabName}"`);

        if (tabName === 'documents') {
           //console.log('TabLoader: Initializing Documents tab');
            if (typeof initializeDocumentUI === 'function') {
                initializeDocumentUI();
            } else {
                console.error('TabLoader: initializeDocumentUI function not found');
            }
        }
        // For DataViz, create instances if they don't exist
        if (tabName === 'dataviz' && window.DataViz && window.DataVizTab) {
            if (!window.dataViz) {
               //console.log('TabLoader: Creating DataViz instance');
                window.dataViz = new window.DataViz();
            }
            if (!window.dataVizTab) {
               //console.log('TabLoader: Creating DataVizTab instance');
                window.dataVizTab = new window.DataVizTab();
            }

        }

        // For Paperwork, ensure the instance is created
        if (tabName === 'paperwork' && window.Paperwork) {
            if (!window.paperworkInstance) {
               //console.log('TabLoader: Creating Paperwork instance');
                window.paperworkInstance = new window.Paperwork();
                // Initialize the Paperwork instance
                window.paperworkInstance.initialize().then(() => {
                   //console.log('TabLoader: Paperwork instance initialized');
                }).catch(err => {
                    console.error('TabLoader: Error initializing Paperwork:', err);
                });
            }
        }
        // Replace the research tab initialization block with this code
        if (tabName === 'research') {
            if (window.Research && window.ResearchTab) {
                // Initialize Research components
               //console.log('TabLoader: Initializing Research components');

                // Create KnowledgeBase instance
                if (!window.knowledgeBase) {
                   //console.log('TabLoader: Creating KnowledgeBase instance');
                    window.knowledgeBase = new window.Research.KnowledgeBase();
                    window.knowledgeBase.initialize().catch(err => {
                        console.error('TabLoader: Error initializing KnowledgeBase:', err);
                    });
                }

                // Create ResearchAutomation instance
                if (!window.researchAutomation) {
                   //console.log('TabLoader: Creating ResearchAutomation instance');
                    window.researchAutomation = new window.Research.ResearchAutomation();
                    window.researchAutomation.initialize().catch(err => {
                        console.error('TabLoader: Error initializing ResearchAutomation:', err);
                    });
                }


                // Create ResearchTab instance
                if (!window.researchTab) {
                   //console.log('TabLoader: Creating ResearchTab instance');
                    window.researchTab = new window.ResearchTab();
                }
            }
        }
        // For Artwork, create instances if they don't exist
        if (tabName === 'artwork' && window.Artworks && window.ArtworksTab) {
            if (!window.artworksInstance) {
               //console.log('TabLoader: Creating Artworks instance');
                window.artworksInstance = new window.Artworks();
            }
            if (!window.artworksTab) {
               //console.log('TabLoader: Creating ArtworksTab instance');
                window.artworksTab = new window.ArtworksTab();
            }
        }

        // For Translate, create tab instance if needed
        if (tabName === 'translate' && window.TranslateTab) {
            if (!window.translateTab) {
                window.translateTab = new window.TranslateTab();
            }
        }
        // For Translate, create tab instance if needed
        if (tabName === 'connectors' && window.ConnectorsTab) {
            if (!window.connectorsTab) {
                window.connectorsTab = new window.ConnectorsTab();
            }
        }
        // For Chat, ensure the chat tab is initialized

        switch (tabName) {

            case 'paperwork':
                if (window.paperworkTab && !window.paperworkTab.initialized) {
                   //console.log('TabLoader: Initializing Paperwork tab');
                    window.paperworkTab.initialize();
                }
                break;

            case 'artwork':
                if (window.artworksTab && !window.artworksTab.initialized) {
                   //console.log('TabLoader: Initializing Artwork tab');
                    window.artworksTab.initialize();
                }
                break;

            case 'translate':
                if (window.translateTab && !window.translateTab.isInitialized) {
                    window.translateTab.initialize();
                }
                break;
            
            case 'presentation':
                if (window.presentationtab && !window.presentationtab.isInitialized) {
                   //console.log('TabLoader: Initializing presentation tab');
                    window.presentationtab.initialize();
                }
                break;

            case 'artifacts':
                if (window.artifactsTab && !window.artifactsTab.isInitialized) {
                    window.artifactsTab.initialize();
                }
                break;

            case 'connectors':
                if (window.connectorsTab && !window.connectorsTab.isInitialized) {
                    window.connectorsTab.initialize();
                }
                break;
        }
    }

    // Loads all required scripts for the specified tab sequentially, waits for their availability, and then initializes the tab's components.
    async loadTabScripts(tabName) {
       //console.log(`TabLoader: Loading scripts for tab "${tabName}"`);
        const tabConfig = this.tabConfigs[tabName];
        if (!tabConfig) return;

        try {
            // First load all scripts
            for (const script of tabConfig.scripts) {
                // Load scripts sequentially to ensure proper dependency order
                if (!this.loadedModules[script]) {
                    if (!this.loadingPromises[script]) {
                        this.loadingPromises[script] = this.loadScript(script);
                    }
                    await this.loadingPromises[script];
                }
            }

            // Wait for scripts to be evaluated
            await new Promise(resolve => setTimeout(resolve, 100));
            if (tabName === 'documents') {
                await new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = this.getTabLoadMaxAttempts();

                    const checkInterval = setInterval(() => {
                        attempts++;
                        if (window.documentsTabLoaded) {
                            clearInterval(checkInterval);
                           //console.log('TabLoader: Documents tab components ready');
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkInterval);
                            console.error('TabLoader: Documents tab components not loaded');
                            reject(new Error('Timeout waiting for Documents tab components'));
                        }
                    }, this.pollIntervalMs);
                });
            }
            // For Paperwork specifically, ensure global objects are available
            if (tabName === 'paperwork') {
                await new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = this.getTabLoadMaxAttempts();

                    const checkInterval = setInterval(() => {
                        attempts++;
                        // Check for all required class definitions
                        if (window.UIHelpers && window.TemplateDesign &&
                            window.DocumentGenerator && window.Paperwork) {
                            clearInterval(checkInterval);
                           //console.log('TabLoader: Paperwork components ready');
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkInterval);
                            console.error('TabLoader: Paperwork component status:', {
                                UIHelpers: !!window.UIHelpers,
                                TemplateDesign: !!window.TemplateDesign,
                                DocumentGenerator: !!window.DocumentGenerator,
                                Paperwork: !!window.Paperwork
                            });
                            reject(new Error('Timeout waiting for Paperwork components'));
                        }
                    }, this.pollIntervalMs);
                });
            }
            if (tabName === 'research') {
                await new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = this.getTabLoadMaxAttempts();

                    const checkInterval = setInterval(() => {
                        attempts++;
                        if (window.Research && window.ResearchTab &&
                            window.ResearchLoaded && window.ResearchTabLoaded) {
                            clearInterval(checkInterval);
                           //console.log('TabLoader: Research components ready');
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkInterval);
                            console.error('TabLoader: Component status:', {
                                Research: !!window.Research,
                                ResearchTab: !!window.ResearchTab,
                                ResearchLoaded: !!window.ResearchLoaded,
                                ResearchTabLoaded: !!window.ResearchTabLoaded
                            });
                            reject(new Error('Timeout waiting for Research components'));
                        }
                    }, this.pollIntervalMs);
                });
            }
            // Keep other tab component checks as is
            if (tabName === 'dataviz') {
                await new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = this.getTabLoadMaxAttempts();

                    const checkInterval = setInterval(() => {
                        attempts++;
                        if (window.DataViz && window.DataVizTab &&
                            window.DataVizLoaded && window.DataVizTabLoaded) {
                            clearInterval(checkInterval);
                           //console.log('TabLoader: DataViz components ready');
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkInterval);
                            console.error('TabLoader: Component status:', {
                                DataViz: !!window.DataViz,
                                DataVizTab: !!window.DataVizTab,
                                DataVizLoaded: !!window.DataVizLoaded,
                                DataVizTabLoaded: !!window.DataVizTabLoaded
                            });
                            reject(new Error('Timeout waiting for DataViz components'));
                        }
                    }, this.pollIntervalMs);
                });
            }
            if (tabName === 'artwork') {
                await new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = this.getTabLoadMaxAttempts();

                    const checkInterval = setInterval(() => {
                        attempts++;
                        if (window.Artworks && window.ArtworksTab &&
                            window.ArtworksLoaded && window.ArtworksTabLoaded) {
                            clearInterval(checkInterval);
                           //console.log('TabLoader: Artwork components ready');
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkInterval);
                            console.error('TabLoader: Component status:', {
                                Artworks: !!window.Artworks,
                                ArtworksTab: !!window.ArtworksTab,
                                ArtworksLoaded: !!window.ArtworksLoaded,
                                ArtworksTabLoaded: !!window.ArtworksTabLoaded
                            });
                            reject(new Error('Timeout waiting for Artwork components'));
                        }
                    }, this.pollIntervalMs);
                });
            }
            if (tabName === 'presentation') {
                await new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = this.getTabLoadMaxAttempts();

                    const checkInterval = setInterval(() => {
                        attempts++;
                        if (window.presentation && window.presentationtab) {
                            clearInterval(checkInterval);
                           //console.log('TabLoader: SlideForge components ready');
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkInterval);
                            console.error('TabLoader: Component status:', {
                                presentation: !!window.presentation,
                                presentationtab: !!window.presentationtab
                            });
                            reject(new Error('Timeout waiting for SlideForge components'));
                        }
                    }, this.pollIntervalMs);
                });
            }
            if (tabName === 'models') {
                await new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = this.getTabLoadMaxAttempts();

                    const checkInterval = setInterval(() => {
                        attempts++;
                        if (window.ModelDownloader) {
                            clearInterval(checkInterval);
                           //console.log('TabLoader: ModelDownloader component ready');
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkInterval);
                            console.error('TabLoader: ModelDownloader not available');
                            reject(new Error('Timeout waiting for ModelDownloader'));
                        }
                    }, this.pollIntervalMs);
                });
            }
            if (tabName === 'connectors') {
                await new Promise((resolve, reject) => {
                    let attempts = 0;
                    const maxAttempts = this.getTabLoadMaxAttempts();

                    const checkInterval = setInterval(() => {
                        attempts++;
                        if (window.connectorsTab) {
                            clearInterval(checkInterval);
                           //console.log('TabLoader: ModelDownloader component ready');
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkInterval);
                            console.error('TabLoader: Connectors not available');
                            reject(new Error('Timeout waiting for Connectors Tab'));
                        }
                    }, this.pollIntervalMs);
                });
            }
            // Mark scripts as loaded and clear promises
            tabConfig.scripts.forEach(script => {
                this.loadedModules[script] = true;
                delete this.loadingPromises[script];
            });

            // Initialize components
            await this.initializeTabComponent(tabName);

        } catch (error) {
            console.error(`TabLoader: Error loading scripts for tab "${tabName}":`, error);
            this.handleLoadError(tabName, error);
        }
    }

    // Dynamically loads a JavaScript file by creating a <script> tag and appending it to the document head. Returns a Promise.
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = src;
            script.onload = () => {
               //console.log(`TabLoader: Successfully loaded script: ${src}`);

                // No need to check for chat.js or chattab.js since they're loaded in HTML

                resolve();
            };
            script.onerror = (error) => {
                console.error(`TabLoader: Failed to load script: ${src}`, error);
                reject(new Error(`Failed to load ${src}`));
            };
            document.head.appendChild(script);
        });
    }

    // Loads scripts for optional features (not tabs), such as websearch, if needed. Returns a Promise.
    loadFeatureScripts(feature) {
        const featureScripts = {
            'websearch': ['js/websearch.js'],
            // Add other features as needed
        };

        if (featureScripts[feature]) {
            return Promise.all(featureScripts[feature].map(script => this.loadScript(script)));
        }

        return Promise.resolve();
    }

    // Handles errors that occur during tab script loading by displaying an error message in the tab's content area.
    handleLoadError(tabName, error) {
        const tabElement = document.getElementById(`${tabName}-tab`);
        if (tabElement) {
            tabElement.innerHTML = `
                <div class="error-message" style="padding: 20px; text-align: center; color: #e74c3c;">
                    <h3>Error Loading Tab</h3>
                    <p>Failed to load the ${tabName} tab components.</p>
                    <p>Error: ${error.message}</p>
                    <button onclick="window.tabLoader.retryLoad('${tabName}')" 
                            style="padding: 8px 16px; margin-top: 10px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // Retries loading scripts for a tab after a previous failure by clearing the loaded status and calling loadTabScripts again.
    async retryLoad(tabName) {
        // Clear loaded status for this tab's scripts
        const tabConfig = this.tabConfigs[tabName];
        if (tabConfig) {
            tabConfig.scripts.forEach(script => {
                delete this.loadedModules[script];
                delete this.loadingPromises[script];
            });
        }
        // Try loading again
        await this.loadTabScripts(tabName);
    }
}


// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
   //console.log('TabLoader: DOM content loaded, initializing tabLoader');
    window.tabLoader = new TabLoader();

    // Since ChatTab is already in the HTML, we can initialize it immediately
    // if the chat tab is active
    if (document.querySelector('.tab-button[data-tab="chat"].active')) {
       //console.log('TabLoader: Chat tab is active, initializing ChatTab directly');
        if (window.ChatTab) {

        } else {
            console.error('TabLoader: ChatTab class not found - this is unexpected');
        }
    }
});

