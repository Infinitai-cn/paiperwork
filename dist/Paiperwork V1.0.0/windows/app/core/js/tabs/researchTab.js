class ResearchTab {
    constructor() {
        this.initialized = false;
        this.hashedMasterKey = localStorage.getItem('hashedMasterKey');
        this.knowledgeBase = null;
        this.researchAutomation = null;
        this.competitiveAnalysis = null;
        this.currentSubTab = 'research';
    }

    // Initializes the ResearchTab, sets up UI, event listeners, and components
    async initialize() {
        if (this.initialized) {
            //console.log('ResearchTab: Already initialized, checking for model selection...');
            // Clear warning if model is now selected
            this.clearModelWarningIfModelSelected();
            return;
        }

        //console.log('ResearchTab: Initializing');

        try {
            this.addStyles();

            // Set up tab UI
            this.createTabUI();

            // Add research size selector (NEW)
            this.addResearchSizeControls();

            // Initialize components
            this.knowledgeBase = new KnowledgeBase();
            await this.knowledgeBase.initialize();

            this.researchAutomation = new ResearchAutomation();
            await this.researchAutomation.initialize();

            // Set up event listeners for sub-tabs
            this.setupSubTabHandlers();

            this.initialized = true;
            //console.log('ResearchTab: Initialization complete');

            // Show the default sub-tab
            this.switchSubTab('research');
        } catch (error) {
            console.error('ResearchTab: Error initializing', error);
            document.getElementById('research-tab').innerHTML = `
                <div class="error-container">
                    <h3>${Lang.get('researchInitializationFailed')}</h3>
                    <p>${Lang.get('researchErrorMessage', { message: error.message })}</p>
                    <button onclick="window.researchTab.initialize()" class="retry-btn">${Lang.get('retryButton')}</button>
                </div>
            `;
        }
    }
    // Creates the main UI structure for the research tab and its sub-tabs
    createTabUI() {
        const researchTab = document.getElementById('research-tab');


        researchTab.innerHTML = `
        <div class="research-container">
            <!-- Sub-tabs navigation -->
            <div class="sub-tabs">
                <button class="sub-tab-btn active" data-subtab="research">
                    <i class="fas fa-search"></i> ${Lang.get('researchSubTab')}
                </button>
                <button class="sub-tab-btn" data-subtab="knowledge-base">
                    <i class="fas fa-brain"></i> ${Lang.get('knowledgeBaseSubTab')}
                </button>
            </div>
            
            <!-- Research Sub-tab -->
            <div id="research-subtab" class="sub-tab-content active">
                <h2>${Lang.get('researchAssistantTitle')}</h2>
                <p class="tool-description">${Lang.get('researchAssistantDescription')}</p>
                <div class="research-query-container">
                    <div class="input-group">
                        <input type="text" id="research-query-input" placeholder="${Lang.get('researchQueryPlaceholder')}" class="research-input">
                        <button id="research-query-btn" class="research-btn">${Lang.get('researchButton')}</button>
                    </div>
                </div>
                
                <div id="research-controls"></div>
                
                <div class="progress-container">
                    <div id="research-progress" class="progress-bar"></div>
                </div>
                
                <div id="research-results" class="results-container"></div>
            </div>
                
                <!-- Knowledge Base Sub-tab -->
                <div id="knowledge-base-subtab" class="sub-tab-content">
                    <h2>${Lang.get('knowledgeBaseTitle')}</h2>
                    <p class="tool-description">${Lang.get('knowledgeBaseDescription')}</p>
                    
                    <div class="knowledge-controls">
                        <div class="input-group">
                            <input type="text" id="collection-name-input" placeholder="${Lang.get('knowledgeBaseCollectionPlaceholder')}" class="kb-input">
                            <button id="create-collection-btn" class="kb-btn">${Lang.get('knowledgeBaseCreateButton')}</button>
                        </div>
                    </div>
                    
                    <div class="collections-container">
                        <h3>${Lang.get('knowledgeBaseCollectionsTitle')}</h3>
                        <div id="knowledge-collections-list" class="collections-list"></div>
                    </div>
                    
                </div>
            </div>
        `;
    }
    // Adds the research size selector controls to the research tab
    addResearchSizeControls() {
        // Get the controls container
        const researchControlsContainer = document.getElementById('research-controls');

        if (!researchControlsContainer || researchControlsContainer.querySelector('.research-size-controls')) {
            return; // Exit if container doesn't exist or controls already added
        }

        // Create the size controls element
        const sizeControls = document.createElement('div');
        sizeControls.className = 'research-size-controls';
        sizeControls.style.cssText = `
            margin-bottom: 20px;
            padding: 12px 15px;
            border-radius: 8px;
            background: var(--card-bg, rgba(0, 0, 0, 0.03));
            border: 1px solid var(--border-color, #e2e8f0);
        `;

        // Add the HTML for the controls
        sizeControls.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <label for="research-size-selector" style="font-weight: 500; color: var(--text-color);">${Lang.get('researchSizeLabel')}</label>
                <div class="info-tooltip" style="position: relative;">
                    <span style="cursor: help; color: var(--text-muted); font-size: 14px; display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; border: 1px solid var(--text-muted);">?</span>
                    <div class="tooltip-content" style="
                        position: absolute;
                        bottom: 100%;
                        right: 0;
                        background: var(--card-bg);
                        border: 1px solid var(--border-color);
                        padding: 10px;
                        border-radius: 6px;
                        width: 250px;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.1);
                        font-size: 12px;
                        display: none;
                        z-index: 100;
                    ">
                        ${Lang.get('researchSizeTooltip')}
                    </div>
                </div>
            </div>
            <select id="research-size-selector" style="
                width: 100%;
                padding: 8px 12px;
                border-radius: 6px;
                border: 1px solid var(--border-color);
                background: var(--input-bg);
                color: var(--text-color);
                height: 38px;
                font-size: 14px;
            ">
                <option value="concise">${Lang.get('researchSizeConcise')}</option>
                <option value="standard" selected>${Lang.get('researchSizeStandard')}</option>
                <option value="detailed">${Lang.get('researchSizeDetailed')}</option>
                <option value="comprehensive">${Lang.get('researchSizeComprehensive')}</option>
                <option value="extensive">${Lang.get('researchSizeExtensive')}</option>
            </select>
        `;

        // Insert at the beginning of the research controls
        researchControlsContainer.prepend(sizeControls);

        // Add tooltip functionality
        const infoTooltip = sizeControls.querySelector('.info-tooltip');
        const tooltipContent = sizeControls.querySelector('.tooltip-content');

        if (infoTooltip && tooltipContent) {
            infoTooltip.addEventListener('mouseenter', () => {
                tooltipContent.style.display = 'block';
            });

            infoTooltip.addEventListener('mouseleave', () => {
                tooltipContent.style.display = 'none';
            });
        }

        // Add style for better tooltip visibility in dark mode
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .tooltip-content {
                color: var(--text-color);
                line-height: 1.4;
                margin-bottom: 10px;
            }
            
            .research-size-controls select {
                appearance: auto;
            }
            
            @media (max-width: 768px) {
                .research-size-controls label {
                    font-size: 14px;
                }
            }
        `;
        document.head.appendChild(styleEl);

        // Make sure the ResearchAutomation class can access this value
        document.getElementById('research-size-selector').addEventListener('change', (e) => {
            if (this.researchAutomation) {
                this.researchAutomation.reportSize = e.target.value;
                //console.log(`Research report size set to ${e.target.value}`);
            }
        });
    }
    // Injects the CSS styles needed for the research tab and its components
    addStyles() {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            /* Main container styles */
            .research-container {
                width: 100%;
                max-width: 100%;
                padding: 20px;
                box-sizing: border-box;
                overflow-x: hidden;
            }
            
            /* Title and description styles */
            .research-container h2 {
                margin-top: 0;
                color: var(--text-color, #1e293b);
                font-size: 1.8rem;
                margin-bottom: 10px;
            }
            
            .tool-description {
                color: var(--text-muted, #64748b);
                margin-bottom: 25px;
                font-size: 1rem;
            }
            
            /* Sub-tab navigation */
            .sub-tabs {
                display: flex;
                gap: 10px;
                margin-bottom: 25px;
                border-bottom: 1px solid var(--border-color, #e2e8f0);
                padding-bottom: 10px;
            }
            
            .sub-tab-btn {
                background: none;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                color: var(--text-muted, #64748b);
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s ease;
            }
            
            .sub-tab-btn:hover {
                background-color: var(--hover-bg,rgb(53, 53, 53));
                color: var(--text-color, #1e293b);
            }
            
            .sub-tab-btn.active {
                background-color: var(--accent-color, #4f46e5);
                color: white;
            }
            
            .sub-tab-btn i {
                font-size: 16px;
            }
            
            /* Sub-tab content */
            .sub-tab-content {
                display: none;
                animation: fadeIn 0.3s ease;
            }
            
            .sub-tab-content.active {
                display: block;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            /* Research query container */
            .research-query-container {
                margin-bottom: 20px;
            }
            
            .input-group {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .research-input, .kb-input, .kb-search-input {
                flex: 1;
                padding: 12px;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 6px;
                font-family: inherit;
                font-size: 14px;
                background-color: var(--input-bg, #ffffff);
                color: var(--text-color, #1e293b);
                transition: border-color 0.2s ease;
            }
            
            .research-input:focus, .kb-input:focus, .kb-search-input:focus {
                outline: none;
                border-color: var(--accent-color, #4f46e5);
                box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
            }
            
            .research-btn, .kb-btn, .kb-search-btn, .analysis-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                background-color: var(--accent-color, #4f46e5);
                color: white;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            
            .research-btn:hover, .kb-btn:hover, .kb-search-btn:hover, .analysis-btn:hover {
                background-color: var(--accent-color-dark, #3c35b5);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            
            .research-btn:disabled, .kb-btn:disabled, .kb-search-btn:disabled, .analysis-btn:disabled {
                background-color: #cccccc;
                cursor: not-allowed;
                opacity: 0.7;
                transform: none;
                box-shadow: none;
            }
            
            /* Progress bar */
            .progress-container {
                height: 6px;
                background-color: var(--bg-muted, #f1f5f9);
                border-radius: 3px;
                margin-bottom: 20px;
                overflow: hidden;
                display: none;
            }
            
            .progress-bar {
                height: 100%;
                width: 0%;
                background-color: var(--accent-color, #4f46e5);
                border-radius: 3px;
                transition: width 0.3s ease;
            }
            
            /* Results container */
            .results-container, .knowledge-results, .analysis-results {
                margin-top: 20px;
                padding: 20px;
                border-radius: 8px;
                background-color: var(--card-bg, white);
                border: 1px solid var(--border-color, #e2e8f0);
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                display: none;
            }
    
            /* Unified model selector styles for both research and knowledge */
            .model-selector {
                margin-bottom: 25px;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
            }
            
            .model-label, 
            .model-selector label {
                margin-bottom: 8px;
                display: block;
                font-weight: 500;
                color: var(--text-color, #1e293b);
            }

            #research-model-selector{
                height: 38px;
                width: 300px;
                padding: 0 12px;
                border: 1px solid var(--border-color, #e2e8f0);
                border-radius: 6px;
                background-color: var(--input-bg, #ffffff);
                color: var(--text-color);
                margin: 0;
                box-sizing: border-box;
            }
            
            .model-selector-tip {
                font-size: 12px;
                color: var(--text-muted, #64748b);
                margin-top: 5px;
            }
            
            /* Knowledge Base Layout */
            .knowledge-controls {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 30px;
                width: 100%;
                padding: 15px 0;
                border-bottom: 1px solid var(--border-color, #e2e8f0);
                position: relative;
            }
            
            /* Center the input group properly */
            .knowledge-controls .input-group {
                display: flex;
                justify-content: center;
                width: 100%;
                max-width: 600px;
                margin: 0 auto 15px auto;
                gap: 10px;
            }
            
            /* Fix create collection button */
            #create-collection-btn {
                flex: 0 0 auto;
                max-width: 130px !important;
                height: 38px; /* Match input height */
                padding: 0 10px;
                line-height: 38px;
                text-align: center;
            }
            
            /* Fix collection name input */
            #collection-name-input {
                flex: 1;
                max-width: 175px !important;
                height: 38px;
                line-height: 38px;
                padding: 0 12px;
            }
    
            /* Search section comes first now */
            .knowledge-search-container {
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 1px solid var(--border-color, #e2e8f0);
            }
            
            .kb-status-badge {
                display: inline-flex;
                align-items: center;
                margin-left: 8px;
                padding: 2px 6px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
            }
    
            .kb-status-badge.success {
                background-color: rgba(34, 197, 94, 0.15);
                color: rgb(34, 197, 94);
            }
    
            .kb-status-badge.warning {
                background-color: rgba(245, 158, 11, 0.15);
                color: rgb(245, 158, 11);
            }
    
            .kb-status-badge.error {
                background-color: rgba(239, 68, 68, 0.15);
                color: rgb(239, 68, 68);
            }
    
            .entry-embedding-status {
                font-size: 13px;
                margin-top: 6px;
                display: none;
            }
    
            /* Animation for processing state */
            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }
    
            .processing {
                animation: pulse 1.5s infinite;
            }
            
            /* Style search inputs consistently */
            .knowledge-search-container .input-group {
                max-width: 600px;
                margin: 0 auto;
                display: flex;
                gap: 10px;
            }
    
            /* Make search input same height */
            .kb-search-input {
                flex: 1;
                height: 38px !important;
                line-height: 38px !important;
                padding: 0 12px !important;
            }
    
            /* Make search button same height */
            .kb-search-btn {
                height: 38px !important;
                min-width: 100px !important;
                padding: 0 15px !important;
                line-height: 38px !important;
            }
    
            /* Collections section styling */
            .collections-container {
                margin-bottom: 20px;
            }
    
            /* Empty state styling for collections */
            .empty-state {
                text-align: center;
                color: var(--text-muted, #64748b);
                padding: 20px;
                background-color: var(--bg-alt, #f8fafc);
                border-radius: 8px;
                border: 1px dashed var(--border-color, #e2e8f0);
                margin: 15px 0;
            }
    
            /* All buttons and inputs consistent styling */
            .research-input, .kb-input, .kb-search-input {
                height: 38px;
                line-height: 38px;
                padding: 0 12px;
            }
    
            .research-btn, .kb-btn, .kb-search-btn, .competitor-btn, .analysis-btn {
                height: 38px;
                line-height: 38px;
                padding: 0 15px;
            }
        `;
        document.head.appendChild(styleEl);
    }

    // Sets up responsive design adjustments for different screen sizes
    setupResponsiveDesign() {
        // Adjust layout for smaller screens
        const handleResize = () => {
            const width = window.innerWidth;
            const subTabs = document.querySelector('.sub-tabs');

            if (subTabs) {
                if (width < 768) {
                    subTabs.style.flexDirection = 'column';

                    // Make form inputs stack on mobile
                    const formRow = document.querySelectorAll('.form-row');
                    formRow.forEach(row => {
                        row.style.flexDirection = 'column';
                    });
                } else {
                    subTabs.style.flexDirection = 'row';

                    // Restore form inputs to row
                    const formRow = document.querySelectorAll('.form-row');
                    formRow.forEach(row => {
                        row.style.flexDirection = 'row';
                    });
                }
            }
        };

        // Call once on init
        handleResize();

        // Add resize listener
        window.addEventListener('resize', handleResize);
    }

    // Sets up event handlers for switching between sub-tabs
    setupSubTabHandlers() {
        // Set up sub-tab switching
        const subTabButtons = document.querySelectorAll('.sub-tab-btn');
        subTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const subtab = button.dataset.subtab;
                this.switchSubTab(subtab);
            });
        });


    }
    // Dynamically loads the WebSearch module if not already loaded
    async loadWebSearchModule() {
        try {
            // Check if WebSearch is already loaded
            if (typeof window.WebSearch !== 'undefined') {
                //console.log('Research: WebSearch module already loaded');
                return true;
            }

            //console.log('Research: Loading WebSearch module...');

            // Use the same method as in ChatTab to load the WebSearch feature
            if (!window.tabLoader || typeof window.tabLoader.loadFeatureScripts !== 'function') {
                console.error('Research: tabLoader not available for loading WebSearch');
                throw new Error('Tab loader not available');
            }

            // Load the WebSearch module
            await window.tabLoader.loadFeatureScripts('websearch');

            // Wait a moment to ensure scripts are initialized
            await new Promise(resolve => setTimeout(resolve, 100));

            // Initialize WebSearch if needed
            if (window.WebSearch && window.WebSearch.initializeWebSearchReferences) {
                window.WebSearch.initializeWebSearchReferences();
            }

            //console.log('Research: WebSearch module loaded successfully');
            return true;
        } catch (error) {
            console.error('Research: Failed to load WebSearch module:', error);
            throw error;
        }
    }

    // Switches between the research and knowledge base sub-tabs
    switchSubTab(subtab) {
        // Update current tab
        this.currentSubTab = subtab;

        // Update tab button states
        const subTabButtons = document.querySelectorAll('.sub-tab-btn');
        subTabButtons.forEach(button => {
            if (button.dataset.subtab === subtab) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Update content visibility
        const subTabContents = document.querySelectorAll('.sub-tab-content');
        subTabContents.forEach(content => {
            if (content.id === `${subtab}-subtab`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        // Special handling for specific tabs
        if (subtab === 'knowledge-base' && this.knowledgeBase) {
            this.knowledgeBase.renderAllCollections();
        }
    }

    // Handles actions when the research tab becomes active or inactive
    handleTabChange(isActive) {
        //console.log('ResearchTab: Tab change, active =', isActive);

        if (isActive && !this.initialized) {
            this.initialize();
        }
    }
    // Clears the model selection warning if a model is now selected
    clearModelWarningIfModelSelected() {
        const modelSelector = document.getElementById('model-selector');
        const resultsContainer = document.getElementById('research-results');

        // If a model is now selected and there's a warning message, clear it
        if (modelSelector && modelSelector.value && resultsContainer) {
            const errorMessage = resultsContainer.querySelector('.error-message');
            if (errorMessage && errorMessage.textContent.includes(Lang.get('modelSelectionRequired'))) {
                resultsContainer.innerHTML = '';
                resultsContainer.style.display = 'none';
                //console.log('ResearchTab: Cleared model selection warning - model is now selected');
            }
        }
    }
    handleTabChange(isActive) {
        if (isActive) {
            //console.log('ResearchTab: Tab activated, checking model selection...');
            // Clear warning if model is now selected when tab becomes active
            this.clearModelWarningIfModelSelected();
        }
    }
}

// Export to global scope
window.ResearchTab = ResearchTab;

// Add "Research.js" file loaded flag
window.ResearchTabLoaded = true;

// Create the global instance
window.researchTab = new ResearchTab();

//console.log("ResearchTab module loaded");