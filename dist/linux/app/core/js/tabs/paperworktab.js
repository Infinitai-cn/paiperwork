class PaperworkTab {
    constructor() {
        this.initialized = false;
        this.paperworkManager = null;
    }

    // Initializes the paperwork tab interface and its manager
    async initialize() {
        if (this.initialized) return;

       //console.log('PaperworkTab: Initializing paperwork tab interface');

        // Initialize the paperwork manager
        this.paperworkManager = new Paperwork();
        await this.paperworkManager.initialize();

        // Create the paperwork tab content
        this.createPaperworkTabContent();

        this.initialized = true;
    }

    // Creates the content for the paperwork tab and applies styles
    createPaperworkTabContent() {
        // Get the paperwork tab container
        const paperworkTab = document.getElementById('paperwork-tab');
        if (!paperworkTab) {
            console.error('PaperworkTab: Unable to find paperwork tab element');
            return;
        }

        // The content is loaded elsewhere, so we only need to add styles
        this.addPaperworkStyles();
    }

    // Displays the paperwork tab and sets up template selection UI
    showPaperworkTab() {
        // Get the paperwork tab
        const paperworkTab = document.getElementById('paperwork-tab');
        if (!paperworkTab) return;

        // Check if we've already initialized the paperwork tab
        if (paperworkTab.hasAttribute('data-initialized')) return;

        // Set content for the paperwork tab - direct template grid instead of a button
        paperworkTab.innerHTML = `
    <div class="paperwork-container">
        <h3 class="paperwork-title">${Lang.get('paperworkTabTitle')}</h3>
        <p class="paperwork-description">${Lang.get('paperworkTabDescription')}</p>
        
        <div class="paperwork-template-grid">
            <div class="paperwork-template-item" data-template="meeting-minutes">
                <div class="paperwork-template-title">${Lang.get('paperworkTemplateMeetingMinutes')}</div>
                <div class="paperwork-template-description">${Lang.get('paperworkTemplateMeetingMinutesDesc')}</div>
            </div>

            <div class="paperwork-template-item" data-template="business-letter">
                <div class="paperwork-template-title">${Lang.get('paperworkTemplateBusinessLetter')}</div>
                <div class="paperwork-template-description">${Lang.get('paperworkTemplateBusinessLetterDesc')}</div>
            </div>

            <div class="paperwork-template-item" data-template="reporting">
                <div class="paperwork-template-title">${Lang.get('paperworkTemplateTechnicalReport')}</div>
                <div class="paperwork-template-description">${Lang.get('paperworkTemplateTechnicalReportDesc')}</div>
            </div>
                        
            <div class="paperwork-template-item" data-template="contract">
                <div class="paperwork-template-title">${Lang.get('paperworkTemplateContract')}</div>
                <div class="paperwork-template-description">${Lang.get('paperworkTemplateContractDesc')}</div>
            </div>
            
            <div class="paperwork-template-item" data-template="proposal">
                <div class="paperwork-template-title">${Lang.get('paperworkTemplateProposal')}</div>
                <div class="paperwork-template-description">${Lang.get('paperworkTemplateProposalDesc')}</div>
            </div>
            
            <div class="paperwork-template-item" data-template="memo">
                <div class="paperwork-template-title">${Lang.get('paperworkTemplateMemo')}</div>
                <div class="paperwork-template-description">${Lang.get('paperworkTemplateMemoDesc')}</div>
            </div>
        </div>
    </div>
`;

        // Add event listeners to template items
        const templateItems = paperworkTab.querySelectorAll('.paperwork-template-item');
        templateItems.forEach(item => {
            item.addEventListener('click', () => {
                const templateType = item.getAttribute('data-template');
                // Use the existing selectTemplate method
                this.selectTemplate(templateType);
            });
        });

        // Add CSS styles specifically for the paperwork tab
        this.addPaperworkStyles();

        // Mark the tab as initialized
        paperworkTab.setAttribute('data-initialized', 'true');
    }

    // Handles selection of a paperwork template and opens the appropriate editor
    selectTemplate(templateType) {
       //console.log(`PaperworkTab: Selected template type: ${templateType}`);

        // Make sure we have a reference to the paperworkManager
        if (!this.paperworkManager) {
            console.error('PaperworkTab: paperworkManager not initialized');
            return;
        }

        // Make sure uiHelpers is accessible
        if (!this.paperworkManager.uiHelpers) {
            console.error('PaperworkTab: uiHelpers not available through paperworkManager');
            return;
        }

        // For technical reports, go directly to the template designer
        if (templateType === 'reporting') {
            this.paperworkManager.uiHelpers.showTemplateDesigner(); // Use uiHelpers to show template designer
        } else {
            // For other document types, use the document editor through uiHelpers
            this.paperworkManager.uiHelpers.showDocumentEditor(templateType);
        }
    }

    // Adds CSS styles for the paperwork tab if not already present
    addPaperworkStyles() {
        // Check if styles already exist
        if (document.getElementById('paperwork-styles')) return;

        const styleSheet = document.createElement('style');
        styleSheet.id = 'paperwork-styles';
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
        .paperwork-dashboard {
                padding: 20px;
                max-width: 1200px;
                margin: 0 auto;
                color: var(--text-color);
            }
            
            .paperwork-header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 1px solid var(--border-color);
            }
            
            .paperwork-header h2 {
                font-size: 24px;
                margin-bottom: 10px;
            }
            
            .paperwork-header p {
                font-size: 16px;
                color: var(--text-secondary);
            }
            
            .paperwork-tool-group {
                margin-bottom: 30px;
            }
            
            .paperwork-tool-group h3 {
                font-size: 18px;
                margin-bottom: 15px;
                padding-bottom: 8px;
                border-bottom: 1px solid var(--border-subtle);
            }
            
            .paperwork-tools-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 20px;
            }
                /* New button styling to match dataviztab */
        .paperwork-button {
            background: var(--background-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 20px 15px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100px;
            text-align: center;
            color: var(--text-color);
        }
        
        .paperwork-button:hover {
            background-color: var(--preview-button-hover) !important; /* Same purple color as DataViz */
            color: white !important;
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(79, 70, 229, 0.3);
            border-color: #4f46e5 !important;
        }
                #paperwork-tab .paperwork-button:hover {
            background-color: var(--preview-button-hover)  !important; /* Same purple color as DataViz */
            color: white !important;
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(79, 70, 229, 0.3);
            border-color: #4f46e5 !important;
        }
        .paperwork-button.active {
            background-color: var(--primary-color, #4f46e5);
            color: white;
            border-color: var(--primary-color, #4f46e5);
        }
        
        .paperwork-label {
            font-size: 16px;
            font-weight: 500;
        }
        
        /* Animation for button click */
        .paperwork-button:active {
            transform: scale(0.95);
        }
            .paperwork-tool-item {
                background-color: var(--background-secondary);
                border-radius: 8px;
                padding: 20px;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                border: 1px solid var(--border-color);
            }
            
            .paperwork-tool-item:hover {
                transform: translateY(-3px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                background-color: var(--hover-bg);
            }
            
            .paperwork-tool-icon {
                font-size: 32px;
                margin-bottom: 15px;
            }
            
            .paperwork-tool-title {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 8px;
            }
            
            .paperwork-tool-desc {
                font-size: 14px;
                color: var(--text-secondary);
            }
        `;

        document.head.appendChild(styleSheet);
    }
}

// Initialize the global instance
window.paperworkTab = new PaperworkTab();