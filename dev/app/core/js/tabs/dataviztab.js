class DataVizTab {
    constructor() {
        this.initialized = false;
        this.activeButton = null;
        this.isVizModeActive = false;
    }

    // Initializes the DataVizTab, sets up UI and event listeners
    async initialize() {
       //console.log('DataVizTab: Initializing tab');
        
        if (this.initialized) {
           //console.log('DataVizTab: Already initialized');
            return;
        }
    
        // Get the tab container
        const tabContainer = document.getElementById('dataviz-tab');
        if (!tabContainer) {
            console.error('DataVizTab: Could not find tab container');
            return;
        }
    
        // Clear any existing content
        tabContainer.innerHTML = '';
        
        // Create the main container
        const mainContainer = document.createElement('div');
        mainContainer.className = 'dataviz-container';
        
        // Update to include cleaner 2-column layout with translations
        mainContainer.innerHTML = `
        <h2 class="dataviz-title">${Lang.get('datavizTitle')}</h2>
        <p class="dataviz-description">${Lang.get('datavizDescription')}</p>
        
        <div class="dataviz-grid">
            <button class="dataviz-button" data-viz-type="pie">
                <div class="dataviz-label">${Lang.get('datavizPieChart')}</div>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="dataviz-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 2a10 10 0 0 1 0 20 10 10 0 1 1 0-20"></path>
                    <path d="M12 12 6 6"></path>
                </svg>
            </button>
            <button class="dataviz-button" data-viz-type="bar">
                <div class="dataviz-label">${Lang.get('datavizBarChart')}</div>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="dataviz-icon">
                    <path d="M12 20V10"></path>
                    <path d="M18 20V4"></path>
                    <path d="M6 20v-4"></path>
                    <path d="M2 20h20"></path>
                </svg>
            </button>
            <button class="dataviz-button" data-viz-type="line">
                <div class="dataviz-label">${Lang.get('datavizLineChart')}</div>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="dataviz-icon">
                    <path d="M21 6H3"></path>
                    <path d="M3 6v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6"></path>
                    <path d="m4 15 4-8 4 8 4-4 4 4"></path>
                </svg>
            </button>
            <button class="dataviz-button" data-viz-type="scatter">
                <div class="dataviz-label">${Lang.get('datavizScatterPlot')}</div>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="dataviz-icon">
                    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                    <circle cx="8" cy="8" r="1.5"></circle>
                    <circle cx="12" cy="12" r="1.5"></circle>
                    <circle cx="16" cy="16" r="1.5"></circle>
                    <circle cx="7" cy="17" r="1.5"></circle>
                    <circle cx="17" cy="7" r="1.5"></circle>
                </svg>
            </button>
            <button class="dataviz-button" data-viz-type="area">
                <div class="dataviz-label">${Lang.get('datavizAreaChart')}</div>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="dataviz-icon">
                    <path d="M21 6H3"></path>
                    <path d="M3 6v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6"></path>
                    <path d="M21 16 17 12 13 16 9 8 5 16 3 14"></path>
                    <path d="M21 16 3 16 L3 14 L5 16 L9 8 L13 16 L17 12 L21 16Z" fill="currentColor" fill-opacity="0.2"></path>
                </svg>
            </button>
            <button class="dataviz-button" data-viz-type="radar">
                <div class="dataviz-label">${Lang.get('datavizRadarChart')}</div>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="dataviz-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                    <path d="M12 2v20"></path>
                    <path d="M2 12h20"></path>
                    <path d="M19.07 4.93l-14.14 14.14"></path>
                    <path d="M4.93 4.93l14.14 14.14"></path>
                </svg>
            </button>
            <button class="dataviz-button" data-viz-type="heatmap">
                <div class="dataviz-label">${Lang.get('datavizHeatMap')}</div>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="dataviz-icon">
                    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                    <rect x="5" y="5" width="4" height="4" rx="1" fill="currentColor" fill-opacity="0.8"></rect>
                    <rect x="10" y="5" width="4" height="4" rx="1" fill="currentColor" fill-opacity="0.5"></rect>
                    <rect x="15" y="5" width="4" height="4" rx="1" fill="currentColor" fill-opacity="0.3"></rect>
                    <rect x="5" y="10" width="4" height="4" rx="1" fill="currentColor" fill-opacity="0.4"></rect>
                    <rect x="10" y="10" width="4" height="4" rx="1" fill="currentColor" fill-opacity="0.7"></rect>
                    <rect x="15" y="10" width="4" height="4" rx="1" fill="currentColor" fill-opacity="0.2"></rect>
                    <rect x="5" y="15" width="4" height="4" rx="1" fill="currentColor" fill-opacity="0.3"></rect>
                    <rect x="10" y="15" width="4" height="4" rx="1" fill="currentColor" fill-opacity="0.2"></rect>
                    <rect x="15" y="15" width="4" height="4" rx="1" fill="currentColor" fill-opacity="0.6"></rect>
                </svg>
            </button>
            <button class="dataviz-button" data-viz-type="bubble">
                <div class="dataviz-label">${Lang.get('datavizBubbleChart')}</div>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="dataviz-icon">
                    <circle cx="8" cy="12" r="4"></circle>
                    <circle cx="16" cy="8" r="3"></circle>
                    <circle cx="16" cy="16" r="2"></circle>
                    <path d="M2 18h20"></path>
                    <path d="M2 18v2"></path>
                    <path d="M22 18v2"></path>
                </svg>
            </button>
        </div>
    `;
        
        tabContainer.appendChild(mainContainer);
        
        // Add event listeners for the buttons
        this.setupEventListeners();
        
        // Listen for theme changes if the app supports them
        this.setupThemeWatcher();
        
        // Check if we need to restore an active visualization type
        this.checkForActiveVizType();
        
        this.initialized = true;
       //console.log('DataVizTab: Initialization complete');
    }

    // Injects custom styles for the DataVizTab UI if not already present
    addDataVizStyles() {
        // Check if styles already exist
        if (document.getElementById('dataviz-custom-styles')) return;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'dataviz-custom-styles';
        styleSheet.textContent = `
            .dataviz-container {
                padding: 20px;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .dataviz-title {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 10px;
                text-align: center;
                color: var(--text-color);
            }
            
            .dataviz-description {
                text-align: center;
                color: var(--text-secondary);
                margin-bottom: 30px;
            }
            
            .dataviz-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .dataviz-button {
                background: var(--background-secondary);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 20px 15px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                height: 160px; /* Increased height to accommodate larger icons */
                text-align: center;
                color: var(--text-color);
            }
            
            .dataviz-button:hover {
                background-color: var(--preview-button-hover) !important;
                color: white !important;
                transform: translateY(-3px);
                box-shadow: 0 5px 15px rgba(79, 70, 229, 0.3);
                border-color: #4f46e5 !important;
            }
            
            .dataviz-button.active {
                background-color: var(--primary-color, #4f46e5);
                color: white;
                border-color: var(--primary-color, #4f46e5);
            }
            
            .dataviz-label {
                font-size: 16px;
                font-weight: 500;
                margin-bottom: 10px; /* Add space between label and icon */
            }
            
            .dataviz-icon {
                margin-top: 5px; /* Space between the icon and the text above it */
            }
            
            /* Ensure icons change color on hover */
            .dataviz-button:hover .dataviz-icon {
                stroke: white;
            }
            
            .dataviz-button.active .dataviz-icon {
                stroke: white;
            }
        `;
        
        document.head.appendChild(styleSheet);
    }

    // Sets up listeners for theme changes to react to theme updates
    setupThemeWatcher() {
        // Check if the app has a theme toggle function we can listen to
        if (window.themeToggle) {
            window.themeToggle.addEventListener('themeChanged', (event) => {
               //console.log('DataVizTab: Theme changed to', event.detail.theme);
            });
        }

        // Alternative: Use MutationObserver to watch for class changes on body
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                   //console.log('DataVizTab: Body class changed, may indicate theme change');
                }
            });
        });

        observer.observe(document.body, { attributes: true });
    }

    // Sets up event listeners for visualization buttons and handles their logic
    setupEventListeners() {
        const buttons = document.querySelectorAll('.dataviz-button');
        const webSearchButton = document.getElementById('web-search');

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                // Check if this button is already active
                const wasActive = button.classList.contains('active');

                // Remove active class from all buttons
                buttons.forEach(btn => btn.classList.remove('active'));

                // If the button wasn't already active, make it active and handle mode changes
                if (!wasActive) {
                    button.classList.add('active');
                    this.activeButton = button;
                    
                    // Get the visualization type
                    const vizType = button.dataset.vizType;
                   //console.log(`DataVizTab: ${Lang.get('datavizModeActive')}: ${vizType}`);
                    
                    // Set the visualization mode flag
                    this.isVizModeActive = true;
                
                    // Exit document questioning mode if enabled
                    if (window.RAG_Utils &&
                        localStorage.getItem('ragQuestioningDocumentId')) {
                       //console.log('DataVizTab: Exiting document questioning mode');
                        window.RAG_Utils.exitDocumentQuestioningMode();
                    }

                    // Disable web search button
                    if (webSearchButton) {
                       //console.log('DataVizTab: Disabling web search button');
                        webSearchButton.classList.remove('active');
                        webSearchButton.disabled = true;
                        webSearchButton.style.opacity = '0.5';
                        webSearchButton.style.cursor = 'not-allowed';
                    }

                    // Update prompt input placeholder
                    const promptInput = document.getElementById('prompt-input');
                    if (promptInput) {
                        promptInput.placeholder = Lang.get('datavizPromptPlaceholder', {chartType: this.getVizTypeName(vizType)});
                    }

                    // Store visualization mode in session storage
                    sessionStorage.setItem('activeVizType', vizType);
                    sessionStorage.setItem('datavizModeActive', 'true');

                } else {
                    // Button was deselected - restore normal mode
                    this.activeButton = null;
                    this.isVizModeActive = false;  // Reset the viz mode flag
                   //console.log(`DataVizTab: ${Lang.get('datavizSelectionDeselected')}`);

                    // Re-enable web search button
                    if (webSearchButton) {
                       //console.log('DataVizTab: Re-enabling web search button');
                        webSearchButton.disabled = false;
                        webSearchButton.style.opacity = '';
                        webSearchButton.style.cursor = '';
                    }

                    // Reset prompt input placeholder
                    const promptInput = document.getElementById('prompt-input');
                    if (promptInput) {
                        promptInput.placeholder = Lang.get('datavizDefaultPrompt');
                    }

                    // Clear visualization mode from session storage
                    sessionStorage.removeItem('activeVizType');
                    sessionStorage.removeItem('datavizModeActive');
                }

                // Highlight the selection with simple feedback
                button.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    button.style.transform = '';
                }, 200);
            });
        });

        // Add handler for tab switches to deactivate visualization mode
        this.setupTabChangeListener();
    }

    // Adds listeners to tab buttons to deactivate visualization mode on tab change
    setupTabChangeListener() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(tabButton => {
            tabButton.addEventListener('click', () => {
                // If switching to a tab other than dataviz, deselect any active viz button
                if (tabButton.dataset.tab !== 'dataviz' && this.activeButton) {
                   //console.log(`DataVizTab: ${Lang.get('datavizModeDeactivated')}`);

                    // Deselect active button
                    if (this.activeButton) {
                        this.activeButton.classList.remove('active');
                        this.activeButton = null;
                    }

                    // Re-enable web search button
                    const webSearchButton = document.getElementById('web-search');
                    if (webSearchButton) {
                        webSearchButton.disabled = false;
                        webSearchButton.style.opacity = '';
                        webSearchButton.style.cursor = '';
                    }

                    // Reset prompt input placeholder
                    const promptInput = document.getElementById('prompt-input');
                    if (promptInput) {
                        promptInput.placeholder = Lang.get('datavizDefaultPrompt');
                    }

                    // Clear visualization mode from session storage
                    sessionStorage.removeItem('activeVizType');
                    sessionStorage.removeItem('datavizModeActive');
                }
            });
        });
    }

    // Checks session storage for an active visualization type and restores it if present
    checkForActiveVizType() {
        const activeVizType = sessionStorage.getItem('activeVizType');
        const datavizModeActive = sessionStorage.getItem('datavizModeActive') === 'true';

        if (activeVizType && datavizModeActive) {
           //console.log('DataVizTab: Restoring active visualization type:', activeVizType);

            // Find the corresponding button and trigger a click
            const buttons = document.querySelectorAll('.dataviz-button');
            const matchingButton = Array.from(buttons).find(
                button => button.dataset.vizType === activeVizType
            );

            if (matchingButton) {
                // Simulate a click to restore the state
                matchingButton.click();
            }
        }
    }

    // Returns the display name for a given visualization type
    getVizTypeName(vizType) {
        const names = {
            'pie': Lang.get('datavizPieChart'),
            'bar': Lang.get('datavizBarChart'),
            'line': Lang.get('datavizLineChart'),
            'scatter': Lang.get('datavizScatterPlot'),
            'area': Lang.get('datavizAreaChart'),
            'radar': Lang.get('datavizRadarChart'),
            'heatmap': Lang.get('datavizHeatMap'),
            'bubble': Lang.get('datavizBubbleChart')
        };

        return names[vizType] || 'Chart';
    }

    // Sets up the configuration area for the selected visualization type
    setupVizConfig(vizType) {
       //console.log(`DataVizTab: Setting up configuration for ${vizType}`);

        // This will be expanded later with specific configuration options for each chart type
        const configArea = document.getElementById('dataviz-config-area');
        if (!configArea) return;

        // For now, just add a simple message
        configArea.innerHTML = `
            <div style="padding: 15px; background: rgba(79, 70, 229, 0.1); border-radius: 6px; margin: 10px 0;">
                <p>${Lang.get('datavizConfigurationOptions', {chartType: this.getVizTypeName(vizType)})}</p>
            </div>
        `;
    }


}

document.addEventListener('DOMContentLoaded', () => {
    window.dataVizTab = new DataVizTab();
   //console.log('DataVizTab: Instance created and assigned to window.dataVizTab');
});

// Register the class on the window object immediately
window.DataVizTab = DataVizTab;
// Signal that the class is available
window.DataVizTabLoaded = true;