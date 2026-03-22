class ResearchAutomation {
    constructor() {
        this.hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        this.contextSize = document.getElementById('context-selector')?.value || '8192';
        // Basic state
        this.isResearching = false;
        this.pendingSummarizations = new Set();
        this.allSummarizationsComplete = true;
        this.currentDate = new Date();
        this.formattedDate = this.currentDate.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        this.reportSize = document.getElementById('research-size-selector')?.value || 'standard';
        // UI references
        this.activeWindow = null;

        // Research settings
        this.deepSearchEnabled = false;
        this.maxDeepSearchDepth = 1;
        this.maxLinksPerPage = 3;
        this.visitedUrls = new Set();

        this.abortController = null;
        this._skipAllSummarizations = false;
        this._researchRunCounter = 0;
        this._activeResearchRunId = null;
        this._lastDisplayedResearchRunId = null;
    }


    async initialize() {
        // Set up listeners
        document.getElementById('research-query-btn').addEventListener('click',
            () => this.performResearch());

        // Add deep search controls to the research controls container
        const researchControlsContainer = document.getElementById('research-controls');

        const sizeSelector = document.getElementById('research-size-selector');
        if (sizeSelector) {
            this.reportSize = sizeSelector.value;
           //console.log(`Research: Report size initialized to ${this.reportSize}`);
        }

        // ADD THIS CHECK to prevent duplicate controls
        if (researchControlsContainer && !researchControlsContainer.querySelector('.deep-search-controls')) {
            // Create the deep search option container
            const deepSearchControls = document.createElement('div');
            deepSearchControls.className = 'deep-search-controls';
            deepSearchControls.style.cssText = `
                margin-top: 15px;
                padding: 12px 15px;
                border-radius: 8px;
                background: var(--card-bg, rgba(0, 0, 0, 0.03));
                border: 1px solid var(--border-color, #e2e8f0);
            `;
            // Add the controls HTML
            deepSearchControls.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: ${this.deepSearchEnabled ? '10px' : '0px'};">
                    <div style="display: flex; align-items: center;">
                        <input type="checkbox" id="deep-search-toggle" style="margin: 0; margin-right: 8px;">
                        <label for="deep-search-toggle" style="font-weight: 500; margin: 0;">${Lang.get('researchEnableDeepSearch')}</label>
                    </div>
                    <div class="info-tooltip" style="position: relative;">
                        <span style="cursor: help; color: var(--label-color); font-size: 14px;">ℹ️</span>
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
                            ${Lang.get('researchDeepSearchTooltip')}
                        </div>
                    </div>
                </div>
                <div id="deep-search-options" style="display: none; margin-top: 10px;">
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <div style="display: flex; align-items: center;">
                            <label for="deep-search-depth" style="margin-right: 8px; font-size: 13px;">${Lang.get('researchDeepSearchDepth')}</label>
                            <select id="deep-search-depth" style="
                                padding: 3px 8px;
                                border-radius: 4px;
                                border: 1px solid var(--border-color);
                                background: var(--bg-color);
                                color: var(--text-color);
                                font-size: 13px;
                            ">
                                <option value="1">${Lang.get('researchDeepSearchLevel1')}</option>
                                <option value="2">${Lang.get('researchDeepSearchLevel2')}</option>
                                <option value="3">${Lang.get('researchDeepSearchLevel3')}</option>
                            </select>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <label for="deep-search-links" style="margin-right: 8px; font-size: 13px;">${Lang.get('researchDeepSearchLinksPerPage')}</label>
                            <select id="deep-search-links" style="
                                padding: 3px 8px;
                                border-radius: 4px;
                                border: 1px solid var(--border-color);
                                background: var(--bg-color);
                                color: var(--text-color);
                                font-size: 13px;
                            ">
                                <option value="1">${Lang.get('researchDeepSearchLink1')}</option>
                                <option value="2">${Lang.get('researchDeepSearchLink2')}</option>
                                <option value="3" selected>${Lang.get('researchDeepSearchLink3')}</option>
                                <option value="5">${Lang.get('researchDeepSearchLink5')}</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;

            // Add to the DOM
            researchControlsContainer.appendChild(deepSearchControls);

            // Add event listeners
            const toggleCheckbox = deepSearchControls.querySelector('#deep-search-toggle');
            const deepSearchOptions = deepSearchControls.querySelector('#deep-search-options');
            const depthSelector = deepSearchControls.querySelector('#deep-search-depth');
            const linksSelector = deepSearchControls.querySelector('#deep-search-links');
            const infoTooltip = deepSearchControls.querySelector('.info-tooltip');
            const tooltipContent = deepSearchControls.querySelector('.tooltip-content');

            // Toggle deep search options visibility
            toggleCheckbox.addEventListener('change', (e) => {
                this.deepSearchEnabled = e.target.checked;
                deepSearchOptions.style.display = this.deepSearchEnabled ? 'block' : 'none';
               //console.log(`Deep Search ${this.deepSearchEnabled ? 'ENABLED' : 'DISABLED'} ✅`);
            });

            // Update depth configuration when changed
            depthSelector.addEventListener('change', (e) => {
                this.maxDeepSearchDepth = parseInt(e.target.value, 10);
               //console.log(`Deep Search depth set to ${this.maxDeepSearchDepth} levels 🔍`);
            });

            // Update links per page configuration when changed
            linksSelector.addEventListener('change', (e) => {
                this.maxLinksPerPage = parseInt(e.target.value, 10);
               //console.log(`Deep Search links per page set to ${this.maxLinksPerPage} links 🔗`);
            });

            // Add tooltip hover effect
            infoTooltip.addEventListener('mouseenter', () => {
                tooltipContent.style.display = 'block';
            });

            infoTooltip.addEventListener('mouseleave', () => {
                tooltipContent.style.display = 'none';
            });
        }
    }
    getWordCountRangeForSize(size, isPartialReport = false) {
        // If it's a partial report, use smaller ranges
        if (isPartialReport) {
            switch (size) {
                case 'concise': return "200-300";
                case 'detailed': return "600-800";
                case 'comprehensive': return "1000-1500";
                case 'extensive': return "1500-2000";
                case 'standard':
                default: return "400-600";
            }
        }

        // For full reports
        switch (size) {
            case 'concise': return "500-800";
            case 'detailed': return "2000-3000";
            case 'comprehensive': return "4000-5000";
            case 'extensive': return "6000+";
            case 'standard':
            default: return "1000-1500";
        }
    }
    // Shows a floating window with a progress spinner and message during research operations
    showFloatingWindow(title, message, progress = 0) {
        // Store reference to the object that will be returned
        let windowObj;

        // First close any existing floating window
        if (this.activeWindow) {
            try {
                this.activeWindow.close();
                this.activeWindow = null;
            } catch (e) {
                console.warn('Error closing previous window:', e);
            }
        }
        // Create overlay container
        const overlay = document.createElement('div');
        overlay.className = 'floating-overlay research-overlay';
        overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(3px);
    `;

        // Create window container - with theme variables
        const container = document.createElement('div');
        container.className = 'floating-window research-window';
        container.style.cssText = `
        background-color: var(--card-bg, #ffffff);
        border-radius: 10px;
        box-shadow: 0 4px 20px var(--preview-shadow, rgba(0, 0, 0, 0.15));
        width: 500px;
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        border: 1px solid var(--border-color, #e5e7eb);
    `;

        // Create header with theme variables
        const header = document.createElement('div');
        header.className = 'floating-header';
        header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
        background-color: var(--preview-header-bg, #f8f9fa);
    `;

        // Add title with theme variables
        const titleElement = document.createElement('div');
        titleElement.textContent = title;
        titleElement.style.cssText = `
        font-weight: 500;
        font-size: 16px;
        color: var(--text-color, #111827);
    `;

        // Add close button with theme variables
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.style.cssText = `
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 0 5px;
        color: var(--label-color, #6b7280);
    `;

        header.appendChild(titleElement);
        header.appendChild(closeButton);
        container.appendChild(header);

        // Create content container with theme variables
        const content = document.createElement('div');
        content.className = 'floating-content';
        content.style.cssText = `
        padding: 20px;
        overflow-y: auto;
        flex-grow: 1;
        color: var(--text-color, #111827);
    `;

        // Add spinner and message with theme variables
        content.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <div class="spinner" style="width: 40px; height: 40px; border: 3px solid var(--border-color, rgba(0, 0, 0, 0.1)); border-radius: 50%; border-top-color: var(--accent-color, #4f46e5); animation: spin 1s linear infinite; margin-bottom: 15px;"></div>
            <h3 style="margin-bottom: 15px; font-size: 18px; color: var(--text-color);">${Lang.get('researchInProgress')}</h3>
            <p id="loading-message" style="color: var(--label-color, #6b7280); margin-bottom: 20px; font-size: 14px;">${message}</p>
            <div style="width: 100%; height: 6px; background-color: var(--button-bg, #e5e7eb); border-radius: 3px; overflow: hidden;">
                <div id="progress-bar" style="height: 100%; width: ${progress}%; background-color: var(--accent-color, #4f46e5); transition: width 0.3s ease;"></div>
            </div>
        </div>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;

        container.appendChild(content);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // Flag to prevent multiple clicks
        let isClosing = false;

        closeButton.addEventListener('click', () => {
           //console.log('Close button clicked - starting close sequence');

            // Prevent multiple clicks - NO CHANGES HERE
            if (isClosing) {
               //console.log('Already closing - ignoring repeated click');
                return;
            }

           //console.log('Setting isClosing = true');
            isClosing = true;

            // IMPORTANT: Store all references FIRST before any cleanup
            const overlayElement = overlay;
            const windowReference = windowObj;

            // Immediate visual feedback
            closeButton.disabled = true;
            closeButton.textContent = '✓';
            closeButton.style.color = 'var(--accent-color, #4f46e5)';
           //console.log('Button visual feedback applied');

            // Set flags BEFORE any async operations
            this.isCancelled = true;
            this.isResearching = false;
            this._skipAllSummarizations = true; // This is crucial!
           //console.log('Cancellation flags set: isCancelled=true, isResearching=false, _skipAllSummarizations=true');

            // CRITICAL FIX: Immediately remove from DOM with zero delay
            try {
                // Remove element first - highest priority
                if (document.body.contains(overlayElement)) {
                    document.body.removeChild(overlayElement);
                   //console.log('Overlay successfully removed from DOM');
                }
            } catch (err) {
                console.error('Error removing overlay element:', err);
            }

            // ONLY AFTER DOM removal, handle the object reference
            if (this.activeWindow === windowReference) {
                this.activeWindow = null;
               //console.log('Active window reference cleared');
            }

            // Run cleanup operations AFTER DOM is modified
            // This ensures visual feedback is immediate
            setTimeout(() => {
               //console.log('Running post-close cleanup operations');
                this.completeTermination();
            }, 0);
        });
        // Create window object with methods
        windowObj = {
            update: (newMessage, newProgress) => {
                const messageEl = content.querySelector('#loading-message');
                const progressEl = content.querySelector('#progress-bar');

                if (messageEl) messageEl.textContent = newMessage;
                if (progressEl && newProgress !== undefined) {
                    progressEl.style.width = `${newProgress}%`;
                }
            },
            close: () => {
                // Remove immediately
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }

                // Clear window reference
                if (this.activeWindow === windowObj) {
                    this.activeWindow = null;
                }
            },
            overlay: overlay,
            content: content
        };

        // Store reference to active window
        this.activeWindow = windowObj;

        return windowObj;
    }
    // Performs the full research workflow: query validation, search, summarization, and report generation
    async performResearch() {
        // Prevent multiple research processes
        if (this.isResearching) {
            alert(Lang.get('researchProcessAlreadyRunning'));
            return;
        }

        const query = document.getElementById('research-query-input').value.trim();

        // Validation #1: Check if research topic input is empty
        if (!query) {
            // Show error message for empty query
            const resultsContainer = document.getElementById('research-results');
            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = `
            <div class="error-message" style="padding: 20px; text-align: center; color: var(--danger-color); background-color: var(--danger-bg, #f8d7da); border-radius: 6px; margin: 20px 0;">
                <h3>${Lang.get('researchMissingTopic')}</h3>
                <p>${Lang.get('researchEnterTopicPrompt')}</p>
            </div>`;

            // Highlight the input field to draw attention
            const inputField = document.getElementById('research-query-input');
            inputField.style.borderColor = 'var(--danger-color, #dc3545)';
            inputField.focus();

            // Reset border color after a short delay
            setTimeout(() => {
                inputField.style.borderColor = '';
            }, 3000);

            return;
        }

        // Validation #2: Check if a model is selected
        const modelSelector = document.getElementById('model-selector');
        if (!modelSelector || !modelSelector.value) {
            // Show warning dialog for missing model selection
            const resultsContainer = document.getElementById('research-results');
            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = `
            <div class="error-message" style="padding: 20px; text-align: center; background-color: var(--warning-bg, #fff3cd); border-radius: 6px; color: var(--warning-color, #856404); margin: 20px 0;">
                <h3>${Lang.get('modelSelectionRequired')}</h3>
                <p>${Lang.get('researchModelRequired')}</p>
                <button id="switch-to-chat-btn" class="action-btn" style="
                    padding: 8px 16px;
                    background-color: var(--accent-color, #4f46e5);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    margin-top: 10px;
                    cursor: pointer;
                ">${Lang.get('switchToChatTab')}</button>
            </div>`;

            // Add event listener to the button to switch to chat tab
            setTimeout(() => {
                const switchButton = document.getElementById('switch-to-chat-btn');
                if (switchButton) {
                    switchButton.addEventListener('click', () => {
                        const chatTabButton = document.querySelector('.tab-button[data-tab="chat"]');
                        if (chatTabButton) {
                            chatTabButton.click();
                        } else {
                            console.error('Chat tab button not found');
                        }
                    });
                }
            }, 0);
            return;
        }

        this.isCancelled = false;
        this.isResearching = true;
        this._skipAllSummarizations = false;
        const currentRunId = ++this._researchRunCounter;
        this._activeResearchRunId = currentRunId;

        // Reset state
        this.visitedUrls = new Set();
        this.abortController = new AbortController();

        // Get query from input
        this.currentQuery = query;


        // Show loading window
        const loadingWindow = this.showFloatingWindow(Lang.get('researchProcess'), Lang.get('researchStarting'));
        this.activeWindow = loadingWindow;

        try {
            // PHASE 1: Generate search queries (sequential)
            this.updateLoadingProgress(loadingWindow, Lang.get('researchGeneratingQueries'), 10);
            const searchQueries = await this.generateSearchQueries(query);

            // PHASE 2: Master operation tracking - CRITICAL ADDITION
            // Set up a master tracking system for ALL operations
            this.totalOperations = 0;
            this.completedOperations = 0;
            this.pendingOperations = new Set();
            this.isTrackingOperations = true;

            // PHASE 3: Execute all web searches (sequential)
            this.updateLoadingProgress(loadingWindow, Lang.get('researchSearchingInfo'), 20);
            const searchResults = await this.executeAllSearches(searchQueries);

            if (searchResults.length === 0) {
                throw new Error("No search results found");
            }

            // PHASE 4: Process all sources (fully sequential)
            this.updateLoadingProgress(loadingWindow, Lang.get('researchProcessingSources'), 40);
            const sources = await this.processAllSourcesSequentially(searchResults, query, loadingWindow);

            // PHASE 5: No more operations can be started
            this.isTrackingOperations = false;

            // PHASE 6: Wait for ALL operations to complete
            this.updateLoadingProgress(loadingWindow, Lang.get('researchFinalizingData'), 80);
            const allOperationsCompleted = await this.waitForAllOperationsToComplete(30000, loadingWindow);
            if (!allOperationsCompleted || this.isCancelled || this._activeResearchRunId !== currentRunId) {
                throw new DOMException('Research process aborted', 'AbortError');
            }

            // PHASE 7: Now we can safely generate and display results
            this.updateLoadingProgress(loadingWindow, Lang.get('researchGeneratingReport'), 90);
            const report = await this.generateReport(query, sources);

            if (this.isCancelled || this._activeResearchRunId !== currentRunId) {
                throw new DOMException('Research process aborted', 'AbortError');
            }

            this.updateLoadingProgress(loadingWindow, Lang.get('researchComplete'), 100);
            loadingWindow.close();
            this.displayResearchResults(report, sources, currentRunId);
        }
        catch (error) {
            console.error("Research error:", error);

            const isAbortError = error?.name === 'AbortError'
                || String(error?.message || '').toLowerCase().includes('research process aborted');

            if (this.activeWindow === loadingWindow) {
                loadingWindow.close();
                this.activeWindow = null;
            }

            // Abort can be intentional (e.g., when closing/transitioning windows).
            // Do not replace the tab UI with an error panel for this case.
            if (isAbortError) {
                return;
            }

            // Show error message
            const resultsContainer = document.getElementById('research-results');
            if (!this.showCloudUsageLimitNotice(error, resultsContainer)) {
                resultsContainer.style.display = 'block';
                resultsContainer.innerHTML = `
            <div class="error-message">
                <h3>${Lang.get('researchError')}</h3>
                <p>${error.message}</p>
                <button onclick="window.researchTab.researchAutomation.performResearch()" class="retry-btn">${Lang.get('retryButton')}</button>
            </div>`;
            }
        } finally {
            // Reset state
            if (this._activeResearchRunId === currentRunId) {
                this.isResearching = false;
                this.abortController = null;
            }
        }
    }

    isCloudUsageLimitError(error) {
        const message = String(error?.message || error || '').toLowerCase();
        return message.includes('429')
            || message.includes('too many requests')
            || message.includes('weekly usage')
            || message.includes('daily limit')
            || message.includes('usage limit')
            || message.includes('ollama.com/upgrade');
    }

    showCloudUsageLimitNotice(error, resultsContainer) {
        if (!this.isCloudUsageLimitError(error)) {
            return false;
        }

        const title = (window.Lang && Lang.get('artifactCloudLimitTitle')) || 'Cloud usage limit reached';
        const translatedBody = (window.Lang && Lang.get('artifactCloudLimitBody'))
            || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.';
        const safeMessage = this.escapeHtml(String(error?.message || error || ''));

        if (resultsContainer) {
            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML = `
            <div class="error-message" style="border:1px solid rgba(239,68,68,0.35); background:rgba(239,68,68,0.08);">
                <h3 style="color:#b91c1c;">${this.escapeHtml(title)}</h3>
                <p>${this.escapeHtml(translatedBody)}</p>
                <p style="white-space:pre-wrap;">${safeMessage}</p>
                <p><a href="https://ollama.com/settings" target="_blank" rel="noopener noreferrer">https://ollama.com/settings</a></p>
                <button onclick="window.researchTab.researchAutomation.performResearch()" class="retry-btn">${Lang.get('retryButton')}</button>
            </div>`;
            return true;
        }

        const floating = this.showFloatingWindow(
            this.escapeHtml(title),
            `${this.escapeHtml(translatedBody)}\n\n${safeMessage}\n\nhttps://ollama.com/settings`
        );
        if (floating && floating.content) {
            floating.content.innerHTML = `
            <div style="text-align:center; line-height:1.5;">
                <h3 style="margin:0 0 8px 0; color:#b91c1c;">${this.escapeHtml(title)}</h3>
                <p style="margin:0 0 10px 0;">${this.escapeHtml(translatedBody)}</p>
                <p style="margin:0 0 10px 0; white-space:pre-wrap;">${safeMessage}</p>
                <p style="margin:0;"><a href="https://ollama.com/settings" target="_blank" rel="noopener noreferrer">https://ollama.com/settings</a></p>
            </div>
            `;
        }

        return true;
    }

    // Processes all search results sequentially, extracting and summarizing sources one by one
    async processAllSourcesSequentially(searchResults, query, loadingWindow = null) {
        const allSources = [];
       //console.log(`Research: Beginning sequential processing of all search results`);

        try {
            // First, calculate EXACTLY how many UNIQUE sources we'll process
            let totalSourcesToProcess = 0;
            const uniqueSourceUrls = new Set();

            // Count primary sources
            for (const searchGroup of searchResults) {
                if (searchGroup.enhancedContent?.length > 0) {
                    for (const content of searchGroup.enhancedContent) {
                        const url = content && content.url ? String(content.url).trim() : '';
                        if (!url || uniqueSourceUrls.has(url)) continue;
                        uniqueSourceUrls.add(url);
                        totalSourcesToProcess += 1;
                    }
                } else if (searchGroup.results) {
                    for (const result of searchGroup.results.slice(0, 3)) {
                        const url = result && result.link ? String(result.link).trim() : '';
                        if (!url || uniqueSourceUrls.has(url)) continue;
                        uniqueSourceUrls.add(url);
                        totalSourcesToProcess += 1;
                    }
                }
            }

           //console.log(`Research: Will process exactly ${totalSourcesToProcess} sources in sequence`);

            // Now process each source ONE BY ONE
            let processedCount = 0;
            const processingBaseProgress = 40;
            const processingMaxProgress = 79;

            if (loadingWindow && totalSourcesToProcess > 0) {
                this.updateLoadingProgress(
                    loadingWindow,
                    `${Lang.get('researchProcessingSources')} (${totalSourcesToProcess} remaining)`,
                    processingBaseProgress
                );
            }

            for (const searchGroup of searchResults) {
                // Process enhanced content first (if available)
                if (searchGroup.enhancedContent?.length > 0) {
                    for (const content of searchGroup.enhancedContent) {
                        // Skip if already visited
                        if (this.visitedUrls.has(content.url)) continue;
                       //console.log(`Research: Processing source ${processedCount + 1}/${totalSourcesToProcess}`);

                        // NEW: Clean title before processing
                        const cleanedTitle = this.cleanSearchResultTitle(content.title, content.url);

                        // Process this source COMPLETELY before moving to next one
                        if (content.isPdf || content.requiresSpecialExtraction) {
                            await this.processSourceWithTimeout(
                                content.url,
                                cleanedTitle || null,
                                searchGroup.query,
                                allSources,
                                0,
                                null
                            );
                        } else {
                            await this.processSourceWithTimeout(
                                content.url,
                                cleanedTitle,
                                searchGroup.query,
                                allSources,
                                0,
                                null,
                                content.extractedContent
                            );
                        }

                        processedCount += 1;
                        if (loadingWindow && totalSourcesToProcess > 0) {
                            const remainingCount = Math.max(totalSourcesToProcess - processedCount, 0);
                            const ratio = processedCount / totalSourcesToProcess;
                            const progressValue = Math.round(processingBaseProgress + ((processingMaxProgress - processingBaseProgress) * ratio));
                            this.updateLoadingProgress(
                                loadingWindow,
                                `${Lang.get('researchProcessingSources')} (${remainingCount} remaining)`,
                                progressValue
                            );
                        }

                        if (this.isCancelled) break;
                    }
                } else if (searchGroup.results) {
                    // Process regular search results (top 3 max)
                    for (const result of searchGroup.results.slice(0, 3)) {
                        // Skip if already visited
                        if (this.visitedUrls.has(result.link)) continue;
                       //console.log(`Research: Processing source ${processedCount + 1}/${totalSourcesToProcess}`);

                        // NEW: Clean title before processing
                        const cleanedTitle = this.cleanSearchResultTitle(result.title, result.link);

                        // Process completely before moving to next
                        await this.processSourceWithTimeout(
                            result.link,
                            cleanedTitle,
                            searchGroup.query,
                            allSources,
                            0,
                            null
                        );

                        processedCount += 1;
                        if (loadingWindow && totalSourcesToProcess > 0) {
                            const remainingCount = Math.max(totalSourcesToProcess - processedCount, 0);
                            const ratio = processedCount / totalSourcesToProcess;
                            const progressValue = Math.round(processingBaseProgress + ((processingMaxProgress - processingBaseProgress) * ratio));
                            this.updateLoadingProgress(
                                loadingWindow,
                                `${Lang.get('researchProcessingSources')} (${remainingCount} remaining)`,
                                progressValue
                            );
                        }

                        if (this.isCancelled) break;
                    }
                }

                if (this.isCancelled) break;
            }

           //console.log(`Research: Completed sequential processing of ${processedCount}/${totalSourcesToProcess} sources`);
            return allSources;
        } catch (error) {
            console.error("Error in sequential source processing:", error);
            return allSources; // Return whatever we have
        }
    }

    // Cleans up search result titles by removing translation prompts, breadcrumbs, and domain artifacts
    cleanSearchResultTitle(title, url) {
       //console.log(`TITLE CLEANING INPUT: "${title}" for URL: ${url}`);

        if (!title || !url) return title || '';

        try {
            // 1. FIRST: Remove search engine translation prompts
            let cleanedTitle = title
                .replace(/\.\.\.Translate this result$/i, '')
                .replace(/\s*-\s*Translate this result$/i, '')
                .replace(/\s*›\s*\.\.\.Translate this result$/i, '')
                .replace(/Translate this result$/i, '')
                .trim();

            // 2. Remove search engine breadcrumbs and navigation elements
            cleanedTitle = cleanedTitle
                .replace(/\s*›\s*[^›]*$/, '') // Remove breadcrumb trails like "› page › section"
                .replace(/\s*-\s*[^-]*\.(com|org|gov|edu|net).*$/, '') // Remove site suffixes
                .trim();

            // 3. Direct split at common URL prefixes that might be fused to the title
            const urlPrefixes = ['https://', 'http://', 'www.'];
            for (const prefix of urlPrefixes) {
                const prefixIndex = cleanedTitle.indexOf(prefix);
                if (prefixIndex > 0) {
                   //console.log(`TITLE CLEANING: Splitting at ${prefix}`);
                    cleanedTitle = cleanedTitle.substring(0, prefixIndex).trim();
                    break; // Exit after first match
                }
            }

            // 4. Parse the URL to get the domain for further checks
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace('www.', '');

            // 5. Check for domain being fused within title (like "ScienceAlerthttps://")
            const domainIndex = cleanedTitle.toLowerCase().indexOf(domain.toLowerCase());
            if (domainIndex > 0) {
               //console.log(`TITLE CLEANING: Taking text before domain`);
                cleanedTitle = cleanedTitle.substring(0, domainIndex).trim();
            }

            // 6. Check for domain TLDs fused directly to text (.com, .gov, etc.)
            const commonTLDs = ['.com', '.org', '.gov', '.edu', '.net', '.io'];
            for (const tld of commonTLDs) {
                // Find TLD followed by non-alphanumeric character or end of string
                const tldRegex = new RegExp(`(.*?)${tld}(?:[^a-zA-Z0-9]|$)`, 'i');
                const match = cleanedTitle.match(tldRegex);
                if (match && match[1] && match.index > 0) {
                   //console.log(`TITLE CLEANING: Splitting at domain extension ${tld}`);
                    cleanedTitle = match[1].trim();
                    break;
                }
            }

            // 7. Handle remaining path separators in title
            if (cleanedTitle.includes('›')) {
               //console.log(`TITLE CLEANING: Cleaning title with path separators`);
                cleanedTitle = cleanedTitle.split('›')[0].trim();
            }

            // 8. If domain starts with title, extract site name
            if (cleanedTitle.toLowerCase().startsWith(domain.toLowerCase())) {
               //console.log(`TITLE CLEANING: Title starts with domain`);
                const siteName = domain.split('.')[0];
                cleanedTitle = siteName.charAt(0).toUpperCase() + siteName.slice(1);
            }

            // 9. Final cleanup - remove any remaining unwanted patterns
            cleanedTitle = cleanedTitle
                .replace(/\s*\.\.\.\s*$/, '') // Remove trailing ellipsis
                .replace(/\s*-\s*$/, '') // Remove trailing dashes
                .trim();

           //console.log(`TITLE CLEANING: Final result: "${cleanedTitle}"`);
            return cleanedTitle || title; // Fallback to original if cleaning resulted in empty string

        } catch (error) {
            console.error('TITLE CLEANING ERROR:', error);
            return title;
        }
    }

    // Tracks the start of an asynchronous research operation for progress monitoring
    trackOperation(operationId) {
        if (!this.isTrackingOperations) return false;

        this.totalOperations++;
        this.pendingOperations.add(operationId);
       //console.log(`Research: Operation started [${operationId}], ${this.pendingOperations.size}/${this.totalOperations} pending`);
        return true;
    }

    // Marks an asynchronous research operation as complete for progress monitoring
    completeOperation(operationId) {
        if (!this.pendingOperations.has(operationId)) return;

        this.pendingOperations.delete(operationId);
        this.completedOperations++;
       //console.log(`Research: Operation completed [${operationId}], ${this.pendingOperations.size}/${this.totalOperations} pending`);
    }
    // Executes all search queries in parallel and cleans up the results
    async executeAllSearches(searchQueries) {
       //console.log(`Research: Executing ${searchQueries.length} search queries in parallel`);

        // Run searches in parallel with Promise.all
        const searchPromises = searchQueries.map(async (searchQuery) => {
            try {
                const result = await window.WebSearch.smartSearch(searchQuery, this.abortController, true);
                if (result?.items?.length > 0) {
                    // Clean translation prompts from search result items
                    const cleanedItems = result.items.map(item => ({
                        ...item,
                        title: this.removeTranslationPrompts(item.title || ''),
                        snippet: this.removeTranslationPrompts(item.snippet || ''),
                        description: this.removeTranslationPrompts(item.description || '')
                    }));

                    // Clean enhanced content if present
                    const cleanedEnhancedContent = result.enhancedContent?.map(content => ({
                        ...content,
                        title: this.removeTranslationPrompts(content.title || ''),
                        extractedContent: this.removeTranslationPrompts(content.extractedContent || '')
                    })) || [];

                    return {
                        query: searchQuery,
                        results: cleanedItems,
                        enhancedContent: cleanedEnhancedContent
                    };
                }
                return null;
            } catch (error) {
                console.error(`Search error for "${searchQuery}":`, error);
                return null;
            }
        });

        // Wait for all searches to complete
        const searchResults = (await Promise.all(searchPromises)).filter(Boolean);
       //console.log(`Research: Completed ${searchResults.length} search queries`);

        return searchResults;
    }

    // Processes only the primary (top-level) sources from search results
    async processPrimarySources(searchResults) {
       //console.log("Research: Processing primary sources");
        const allSources = [];

        // Process all search groups sequentially
        for (const searchGroup of searchResults) {
            // Process regular search results (limit to top 3)
            if (searchGroup.results && searchGroup.results.length > 0) {
                for (const result of searchGroup.results.slice(0, 3)) {
                    await this.processSourceWithTimeout(
                        result.link,
                        result.title,
                        searchGroup.query,
                        allSources,
                        0, // Depth 0 = primary source
                        null // No linked-from for primary sources
                    );

                    // Check for cancellation
                    if (this.isCancelled) {
                       //console.log("Research cancelled during primary source processing");
                        break;
                    }
                }
            }

            // Process enhanced content if available
            if (searchGroup.enhancedContent && searchGroup.enhancedContent.length > 0) {
                for (const content of searchGroup.enhancedContent) {
                    // Skip if already processed URL
                    if (this.visitedUrls.has(content.url)) continue;

                    if (content.isPdf || content.requiresSpecialExtraction) {
                        await this.processSourceWithTimeout(
                            content.url,
                            content.title || null,
                            searchGroup.query,
                            allSources,
                            0, // Depth 0 = primary source
                            null // No linked-from for primary sources
                        );
                    } else {
                        // Process with pre-extracted content
                        await this.processSourceWithTimeout(
                            content.url,
                            content.title,
                            searchGroup.query,
                            allSources,
                            0,
                            null,
                            content.extractedContent
                        );
                    }

                    // Check for cancellation
                    if (this.isCancelled) {
                       //console.log("Research cancelled during enhanced content processing");
                        break;
                    }
                }
            }

            // Check for cancellation between search groups
            if (this.isCancelled) break;
        }

       //console.log(`Research: Completed processing ${allSources.length} primary sources`);
        return allSources;
    }

    // Processes deep links found within primary sources up to a specified depth
    async processDeepLinks(primarySources, query) {
       //console.log(`Research: Processing deep links with max depth ${this.maxDeepSearchDepth}`);
        const deepSources = [];
        let processingPromises = []; // Track ALL promises across ALL depth levels

        try {
            // Process each level of depth sequentially
            for (let currentDepth = 1; currentDepth <= this.maxDeepSearchDepth; currentDepth++) {
               //console.log(`Research: Processing depth level ${currentDepth}`);

                // Identify sources to process at this level
                const sourcesToProcess = currentDepth === 1 ?
                    primarySources :
                    deepSources.filter(source => source.depth === currentDepth - 1);

               //console.log(`Research: Found ${sourcesToProcess.length} sources to process at depth ${currentDepth}`);

                // For each source at the current depth level
                for (const source of sourcesToProcess) {
                    // Skip sources with no content
                    if (!source.originalContent) {
                       //console.log(`Research: Skipping source with no content: ${source.title}`);
                        continue;
                    }

                    try {
                        // Extract relevant links from the source content
                        const links = await this.extractRelevantLinks(source.originalContent, source.url, query);
                       //console.log(`Research: Found ${links.length} links from source: ${source.title}`);

                        if (this.isCancelled) {
                           //console.log(`Research: Processing cancelled, stopping deep link extraction`);
                            break;
                        }

                        // Process each link with explicit promise tracking
                        const validLinks = links.filter(link =>
                            link && !this.visitedUrls.has(link) && !this.isCancelled
                        ).slice(0, this.maxLinksPerPage);

                       //console.log(`Research: Will process ${validLinks.length} valid links from source: ${source.title}`);

                        // Process each link and explicitly track the promise
                        for (const link of validLinks) {
                            // Create a promise for this link processing and add to tracking array
                            const processPromise = this.processSourceWithTimeout(
                                link,
                                null,
                                query,
                                deepSources,
                                currentDepth,
                                source.title
                            );

                            // CRITICAL: Make sure we're actually tracking the promise
                            processingPromises.push(processPromise);
                        }
                    } catch (error) {
                        console.error(`Research: Error processing deep links for ${source.title}:`, error);
                    }

                    // Check for cancellation between sources
                    if (this.isCancelled) break;
                }

                // Check for cancellation between depth levels
                if (this.isCancelled) break;

                // Wait for all links at current depth level to finish before moving to next level
                if (processingPromises.length > 0) {
                   //console.log(`Research: Waiting for ${processingPromises.length} link processing operations at depth ${currentDepth}...`);
                    await Promise.all(processingPromises);
                   //console.log(`Research: Completed processing all links at depth ${currentDepth}`);
                    // Clear the array for next depth level
                    processingPromises = [];
                }
            }

            // Log completion
           //console.log(`Research: Completed processing ${deepSources.length} deep links across all depths`);
            return deepSources;
        } catch (error) {
            console.error(`Research: Error in deep link processing:`, error);
            // Return whatever sources we've managed to process so far
            return deepSources;
        }
    }
    // Processes a single source (URL) with a timeout, extracting and summarizing its content
    async processSourceWithTimeout(url, title, query, targetArray, depth, linkedFrom = null, preExtractedContent = null) {
        // Skip if already visited or cancelled
        if (this.visitedUrls.has(url) || this.isCancelled) return;

       //console.log(`Research: Processing ${depth > 0 ? 'deep link' : 'primary source'}: ${url}`);

        // Mark as visited immediately to prevent duplicates
        this.visitedUrls.add(url);

        try {
            // Use Promise.race to implement timeout
            const extractionPromise = preExtractedContent ?
                Promise.resolve(preExtractedContent) :
                this.extractContent(url);

            // Set timeout to 15 seconds
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout processing ${url}`)), 15000)
            );

            // Wait for extraction or timeout
            const content = await Promise.race([extractionPromise, timeoutPromise]);
            if (!content) {
               //console.log(`Research: No content extracted from ${url}`);
                return;
            }

            // Handle content object format for PDFs
            let extractedContent = '';
            let isPdf = false;

            if (typeof content === 'object' && content !== null) {
                // Handle PDF content
                if (content.isPdf) {
                    isPdf = true;
                    extractedContent = content.text;
                } else {
                    extractedContent = content;
                }
            } else {
                extractedContent = content;
            }

            // Get or create title
            let pageTitle = title;
            if (!pageTitle) {
                // Create title from URL or content
                pageTitle = this.generateTitleFromUrlOrContent(url, extractedContent, isPdf);
            }

            // Summarize content with timeout
            const summary = await this.summarizeWithTimeout(extractedContent, query);

            // Add to sources array
            targetArray.push({
                title: pageTitle,
                url: url,
                summary: summary,
                relevance: depth === 0 ? 1.0 : (0.9 - (depth * 0.2)),
                depth: depth,
                linkedFrom: linkedFrom,
                originalContent: extractedContent,
                isPdf: isPdf
            });

           //console.log(`Research: Successfully processed ${pageTitle}`);

        } catch (error) {
            console.error(`Research: Error processing ${url}:`, error);
        }
    }

    // Generates a title for a source based on its URL or content, with special handling for PDFs
    generateTitleFromUrlOrContent(url, content, isPdf = false) {
        // Default title will be extracted from URL
        let title = '';

        try {
            // For PDFs, create a title based on URL
            if (isPdf) {
                // Extract filename from URL and format it nicely
                const urlObj = new URL(url);
                const filename = urlObj.pathname.split('/').pop() || 'Document';
                title = filename.replace('.pdf', '').replace(/%20/g, ' ').replace(/[-_]/g, ' ');

                // Capitalize first letter of each word for better readability
                title = title.replace(/\b\w/g, c => c.toUpperCase());

                // Add PDF indicator
                title = `${title} ${Lang.get('researchPdfDocumentLabel')}`;
                return title;
            }

            // For HTML content, try to extract the title tag
            if (content && typeof content === 'string') {
                const titleMatch = content.match(/<title>(.*?)<\/title>/i);
                if (titleMatch && titleMatch[1]) {
                    title = titleMatch[1].trim();

                    // Clean up the title
                    title = title
                        .replace(/\s+/g, ' ')               // Normalize whitespace
                        .replace(/&amp;/g, '&')            // Replace HTML entities
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'");

                    // Remove common website suffixes like " - Site Name"
                    title = title.replace(/\s*[-–|]\s*[^-–|]+$/, '');

                    if (title) return title;
                }
            }

            // If we couldn't extract a title, create one from the URL
            if (!title) {
                const urlObj = new URL(url);

                // First try using the last path component
                const pathParts = urlObj.pathname.split('/').filter(Boolean);
                if (pathParts.length > 0) {
                    const lastPath = pathParts[pathParts.length - 1]
                        .replace(/\.html?$/, '')
                        .replace(/-|_/g, ' ');

                    title = lastPath
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                }

                // If no path, use the domain name
                if (!title || title.length < 3) {
                    title = urlObj.hostname.replace('www.', '');
                    // Capitalize first letter
                    title = title.charAt(0).toUpperCase() + title.slice(1);
                }
            }

            return title || Lang.get('researchUntitledPage');
        } catch (error) {
            console.error('Error generating title from URL:', error);
            // Fall back to a simple URL-based title
            return url.split('/').pop() || Lang.get('researchUntitledPage');
        }
    }
    // Summarizes content with a timeout and handles cancellation
    async summarizeWithTimeout(content, query) {
        try {
            // Check for cancellation first
            if (this.isCancelled) {
               //console.log("Research: Summarization cancelled");
                throw new DOMException('Research process aborted', 'AbortError');
            }

            // Skip empty content
            if (!content || content.length < 50) {
                return Lang.get('researchInsufficientContent');
            }

            // The user's system can take as long as needed for this operation
            return await this.summarizeContent(content, query);
        } catch (error) {
            // Handle cancellation errors specifically
            if (error.name === 'AbortError' || this.isCancelled) {
               //console.log("Research: Summarization cancelled after started");
                throw error; // Re-throw to propagate the cancellation
            }

            console.error("Error summarizing content:", error);
            return content.substring(0, 150) + Lang.get('summaryFailedSuffix');
        }
    }
    // Summarizes content using the selected model and tracks the operation
    async summarizeContent(content, query) {
        const operationId = Math.random().toString(36).substr(2, 9);

        // Register this operation in our master tracking system
        if (!this.trackOperation(`summarize_${operationId}`)) {
           //console.log(`Research: Skipping summarization ${operationId} - tracking disabled`);
            return Lang.get('researchSummaryProcessingCompleted');
        }

        try {
           //console.log(`Research: Starting content summarization (operation id: ${operationId})`);

            // Check for enhanced cancellation
            if (this.isCancelled || this._skipAllSummarizations) {
               //console.log(`Research: Summarization ${operationId} skipped due to cancellation flag`);
                throw new DOMException('Research process aborted', 'AbortError');
            }

            // Don't process empty or very short content
            if (!content || content.length < 50) {
                return Lang.get('researchInsufficientContent');
            }

            // Get word count guidance based on report size
            let summaryLength;
            switch (this.reportSize) {
                case 'concise':
                    summaryLength = "brief (150-250 words)";
                    break;
                case 'detailed':
                    summaryLength = "detailed (500-700 words)";
                    break;
                case 'comprehensive':
                    summaryLength = "comprehensive (700-1000 words)";
                    break;
                case 'extensive':
                    summaryLength = "thorough and extensive (1000-1500 words)";
                    break;
                case 'standard':
                default:
                    summaryLength = "thorough but concise (300-500 words)";
                    break;
            }

            const systemPrompt = `LANGUAGE REQUIREMENT: Write the ENTIRE report in the SAME LANGUAGE as this query: "${query}". 
            Summarize the following content to extract key information relevant to the query.
            Focus on factual information and include any statistics or data points.
            Today's date is ${this.formattedDate}, so interpret any time references accordingly.
            Keep the summary ${summaryLength}. Include the most important details, data points, and conclusions.`;

            // Check cancellation again before API call
            if (this.isCancelled || this._skipAllSummarizations) {
               //console.log("Research: Summarization cancelled before API call");
                throw new DOMException('Research process aborted', 'AbortError');
            }
            const selectedModel = document.getElementById('model-selector').value;
            // Get model-specific parameters using OllamaAPI utility
            const modelParams = OllamaAPI.getModelParameters(selectedModel);

            const controller = this.abortController || new AbortController();
            const signal = controller.signal;

            const { routing, options: requestOptions } = await this.buildResearchRoutingAndOptions(selectedModel, {
                num_ctx: parseInt(this.contextSize),
                ...modelParams
            });
            const response = await fetch(`${routing.baseUrl}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...routing.headers },
                body: JSON.stringify({
                    model: routing.modelName || selectedModel,
                    prompt: `Query: ${query}\n\nContent: ${content.substring(0, 8000)}`,
                    system: systemPrompt,
                    think: false,
                    options: requestOptions,
                    stream: false
                }),
                signal: signal
            });

            // Check cancellation after fetch
            if (this.isCancelled) {
                throw new DOMException('Research process aborted', 'AbortError');
            }

            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 429) {
                    throw new Error(`${(window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.'}${errorText ? `\n${errorText}` : ''}`);
                }
                throw new Error(`Summarization request failed: ${response.status}`);
            }

            const data = await response.json();

            // Check cancellation after parse
            if (this.isCancelled) {
                throw new DOMException('Research process aborted', 'AbortError');
            }

            /*console.log('Research: Content summary complete:', {
                operationId,
                queryLength: query.length,
                contentLength: content.length,
                summaryLength: data.response?.length || 0,
                summaryFirstSentence: data.response?.substring(0, 50) + '...' || 'No summary'
            });*/

            return this.removeAIThinkingTags(String(data?.response || data?.message?.content || '').trim());
        } catch (error) {
            console.error(`Research: Error in summarization ${operationId}:`, error);
            const msg = String(error?.message || '').toLowerCase();
            if (msg.includes('429') || msg.includes('too many requests') || msg.includes('weekly usage') || msg.includes('daily limit')) {
                return (window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.';
            }
            return content.substring(0, 150) + Lang.get('summaryFailedSuffix');
        } finally {
            // CRITICAL: Mark this operation as complete in our master tracker
            this.completeOperation(`summarize_${operationId}`);
        }
    }
    // Waits for all tracked research operations to complete or until a timeout
    async waitForAllOperationsToComplete(maxWaitTimeMs = 30000, loadingWindow = null) {
        if (this.pendingOperations.size === 0) {
           //console.log(`Research: No pending operations (${this.completedOperations}/${this.totalOperations}), continuing immediately`);
            return true;
        }

       //console.log(`Research: Waiting for ${this.pendingOperations.size} operations to complete (${this.completedOperations}/${this.totalOperations} total)`);

		const startedAt = Date.now();
		let timeoutWarningShown = false;

		while (this.pendingOperations.size > 0) {
			if (this.isCancelled) {
				return false;
			}

			if (!timeoutWarningShown && maxWaitTimeMs > 0 && (Date.now() - startedAt) > maxWaitTimeMs) {
				timeoutWarningShown = true;
				console.warn(`Research: Pending operations exceeded ${maxWaitTimeMs}ms (${this.pendingOperations.size} still pending). Continuing to wait to avoid premature finalization.`);
			}

            if (timeoutWarningShown && loadingWindow) {
                const remainingCount = this.pendingOperations.size;
                const longWaitStatusKey = remainingCount === 1
                    ? 'researchLongWaitStatusSingular'
                    : 'researchLongWaitStatusPlural';
                this.updateLoadingProgress(
                    loadingWindow,
                    Lang.get(longWaitStatusKey, { count: remainingCount }),
                    80
                );
            }

			await new Promise((resolve) => setTimeout(resolve, 500));
		}

		return true;
    }
    // Waits for all summarization operations to complete or until a timeout
    async waitForSummarizationsToComplete(maxWaitTimeMs = 30000) {
        // If already complete, return immediately
        if (this.allSummarizationsComplete && this.pendingSummarizations.size === 0) {
           //console.log(`Research: No pending summarizations (${this._totalSummarizationsCompleted}/${this._totalSummarizationsStarted}), continuing immediately`);
            return;
        }

       //console.log(`Research: Waiting for ${this.pendingSummarizations.size} summarization operations to complete (${this._totalSummarizationsCompleted}/${this._totalSummarizationsStarted} total)`);

        // Create a promise that resolves when all summarizations are done
        return new Promise((resolve) => {
            // Set a timeout for the maximum wait time
            const timeoutId = setTimeout(() => {
               //console.log(`Research: Maximum wait time reached, continuing anyway (${this._totalSummarizationsCompleted}/${this._totalSummarizationsStarted} completed, ${this.pendingSummarizations.size} still pending)`);
                this.allSummarizationsComplete = true; // Force complete
                resolve();
            }, maxWaitTimeMs);

            // Check function that runs every 500ms
            const checkComplete = () => {
                if (this.allSummarizationsComplete || this.pendingSummarizations.size === 0) {
                    clearTimeout(timeoutId);
                    clearInterval(intervalId);
                   //console.log(`Research: All summarizations complete (${this._totalSummarizationsCompleted}/${this._totalSummarizationsStarted}), continuing`);
                    resolve();
                } else {
                   //console.log(`Research: Still waiting for ${this.pendingSummarizations.size} summarizations (${this._totalSummarizationsCompleted}/${this._totalSummarizationsStarted} total)`);
                }
            };

            // Check periodically
            const intervalId = setInterval(checkComplete, 500);
        });
    }
    // Removes AI "thinking" tags (e.g., <think>, <cot>) from generated text
    removeAIThinkingTags(text) {
        if (!text) return text;

        // Define patterns for thinking tags
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

    async buildResearchRoutingAndOptions(selectedModel, baseOptions = {}) {
        let routing = await OllamaAPI.getApiRoutingForModel(selectedModel);

        // Keep cloud authentication flow consistent with Chat before direct cloud requests.
        if (routing && routing.source === 'cloud') {
            const ensureCloudKey = window.chatTab && typeof window.chatTab.ensureCloudApiKeyForSend === 'function'
                ? window.chatTab.ensureCloudApiKeyForSend.bind(window.chatTab)
                : null;

            if (ensureCloudKey) {
                const hasCloudKey = await ensureCloudKey();
                if (!hasCloudKey) {
                    throw new Error('Cloud API key required');
                }
                // Refresh routing so auth headers include the saved key.
                routing = await OllamaAPI.getApiRoutingForModel(selectedModel);
            }
        }

        const options = { ...(baseOptions || {}) };

        return { routing, options };
    }

    // Sorts sources by relevance and removes duplicates by URL
    processResultSources(allSources) {
        // Sort sources by relevance
        allSources.sort((a, b) => b.relevance - a.relevance);

        // Remove duplicate sources
        const uniqueUrls = new Set();
        const uniqueSources = [];
        for (const source of allSources) {
            if (!uniqueUrls.has(source.url)) {
                uniqueUrls.add(source.url);
                uniqueSources.push(source);
            }
        }
        return uniqueSources;
    }
    // Extracts content from a URL, handling PDFs and non-PDFs, with cancellation support
    async extractContent(url) {
        // Check cancellation before starting
        if (this.isCancelled) throw new DOMException('Research process aborted', 'AbortError');

        try {
            // Enhanced PDF detection - check URL patterns more thoroughly
            const isPdfUrl = url.toLowerCase().endsWith('.pdf') ||
                url.toLowerCase().includes('/pdf/') ||
                url.toLowerCase().includes('pdf.') ||
                url.toLowerCase().includes('document/d/') || // Google Docs PDFs
                url.toLowerCase().includes('arxiv.org'); // Academic PDFs

            if (isPdfUrl) {
               //console.log('Research: Detected PDF URL, using PDF.js for extraction:', url);
                const pdfContent = await this.extractPdfContent(url);

                // Mark this content as coming from a PDF for better source display
                return {
                    text: pdfContent,
                    isPdf: true,
                    pdfUrl: url
                };
            }

            // Use WebSearch's extraction via the proxy for non-PDF content
            const encodedUrl = encodeURIComponent(url);
            const extractionUrl = `/api/extract/content?url=${encodedUrl}`;

            const response = await fetch(extractionUrl, {
                signal: this.abortController?.signal
            });

            // Check cancellation after fetch
            if (this.isCancelled) throw new DOMException('Research process aborted', 'AbortError');

            if (!response.ok) {
                // If server returns a 415 (Unsupported Media Type), try PDF extraction as fallback
                if (response.status === 415 || response.status === 422) {
                   //console.log('Research: Server indicated unsupported content type, trying PDF extraction:', url);
                    const pdfContent = await this.extractPdfContent(url);
                    return {
                        text: pdfContent,
                        isPdf: true,
                        pdfUrl: url
                    };
                }
                throw new Error(`Content extraction failed: ${response.status}`);
            }

            const data = await response.json();

            // Check cancellation after parse
            if (this.isCancelled) throw new DOMException('Research process aborted', 'AbortError');

            let content = data.content || Lang.get('failedToExtractContentFrom', { url: url });

            // NEW: Clean translation prompts from extracted content
            content = this.removeTranslationPrompts(content);

            return content;
        } catch (error) {
            // Propagate abort error
            if (error.name === 'AbortError' || this.isCancelled) {
                throw new DOMException('Research process aborted', 'AbortError');
            }
            console.error('Error extracting content:', error);
            return Lang.get('failedToExtractContent', { url: url, error: error.message });
        }
    }

    // Removes translation prompts and breadcrumbs from text content
    removeTranslationPrompts(text) {
        if (!text || typeof text !== 'string') return text;

       //console.log('Cleaning translation prompts from content...');

        // Remove various translation prompt patterns
        let cleanedText = text
            // Remove "Translate this result" and variations
            .replace(/\.\.\.Translate this result\s*/gi, '')
            .replace(/\s*-\s*Translate this result\s*/gi, '')
            .replace(/\s*›\s*\.\.\.Translate this result\s*/gi, '')
            .replace(/Translate this result\s*/gi, '')

            // Remove other common translation prompts
            .replace(/\s*\|\s*Translate this page\s*/gi, '')
            .replace(/\s*-\s*Translate this page\s*/gi, '')
            .replace(/Translate this page\s*/gi, '')

            // Remove "See translation" prompts
            .replace(/\s*-\s*See translation\s*/gi, '')
            .replace(/See translation\s*/gi, '')

            // Remove Google Translate prompts
            .replace(/\s*-\s*Google Translate\s*/gi, '')
            .replace(/Google Translate\s*/gi, '')

            // Remove breadcrumb navigation that might confuse the AI
            .replace(/\s*›\s*[^›]*\s*›.*$/gm, '') // Remove breadcrumb trails

            // Clean up any extra whitespace left behind
            .replace(/\s{3,}/g, ' ')
            .trim();

        return cleanedText;
    }

    // Extracts relevant links from HTML content for deep search, filtering out irrelevant URLs
    async extractRelevantLinks(content, sourceUrl, query) {
        // Check for cancellation
        if (this.isCancelled) return [];

       //console.log(`🔎 [Deep Search] Extracting links from ${sourceUrl}`);

        try {
            // For link extraction, we need raw HTML rather than the extracted text content
            const rawHtml = await this.fetchRawHtmlForLinkExtraction(sourceUrl);

            // Use rawHtml if available, otherwise fall back to the provided content
            const htmlToProcess = rawHtml || content;

            // First extract all links from the content using regex
            const urlPattern = /href=["'](https?:\/\/[^"']+)["']/g;
            const matches = htmlToProcess.match(urlPattern) || [];

            // Extract the actual URLs
            let links = matches.map(match => {
                const urlMatch = match.match(/href=["'](https?:\/\/[^"']+)["']/);
                return urlMatch ? urlMatch[1] : null;
            }).filter(url => url !== null);

           //console.log(`🔎 [Deep Search] Found ${links.length} raw links in content`);

            // Limit number of links to process
            if (links.length === 0) {
               //console.log(`🔎 [Deep Search] No links found in content`);
                return [];
            }

            // Filter out links we've already visited
            const beforeFilter = links.length;
            links = links.filter(url => !this.visitedUrls.has(url));
           //console.log(`🔎 [Deep Search] Filtered ${beforeFilter - links.length} already visited links, ${links.length} remaining`);
            const beforeResourceFilter = links.length;
            links = links.filter(url => {
                const lowerUrl = url.toLowerCase();

                // Parse the URL to check for domain and path
                let urlObj;
                try {
                    urlObj = new URL(url);
                } catch (e) {
                    // If URL parsing fails, skip this URL
                    return false;
                }

                // Better check for file extensions anywhere in the URL
                const hasCommonFileExtension =
                    lowerUrl.includes('.css') ||
                    lowerUrl.includes('.js') ||
                    lowerUrl.includes('.jpg') ||
                    lowerUrl.includes('.jpeg') ||
                    lowerUrl.includes('.png') ||
                    lowerUrl.includes('.gif') ||
                    lowerUrl.includes('.svg') ||
                    lowerUrl.includes('.ico') ||
                    lowerUrl.includes('.zip') ||
                    lowerUrl.includes('.xml');

                // Skip homepages (URLs that end with just the domain or /)
                const isHomepage = urlObj.pathname === "/" || urlObj.pathname === "";

                // Better detection of static assets and image files
                const isStaticAsset =
                    urlObj.hostname.includes('static') ||
                    urlObj.hostname.includes('assets') ||
                    urlObj.hostname.includes('cdn') ||
                    urlObj.pathname.includes('/static/') ||
                    urlObj.pathname.includes('/assets/') ||
                    urlObj.pathname.includes('/img/') ||
                    urlObj.pathname.includes('/image') ||
                    urlObj.pathname.includes('/icon') ||
                    urlObj.pathname.includes('/favicon');

                // Skip known problematic URL patterns
                return !hasCommonFileExtension &&
                    !lowerUrl.includes('/wp-json/') &&
                    !lowerUrl.includes('/feed') &&
                    !lowerUrl.includes('/feeds/') &&
                    !lowerUrl.includes('/rss/') &&
                    !lowerUrl.includes('/api/') &&
                    !lowerUrl.includes('oembed') &&
                    !lowerUrl.includes('scholar.google.com/scholar_lookup') &&
                    !isStaticAsset && // Exclude static asset domains & paths
                    !isHomepage; // Skip homepages
            });
           //console.log(`🔎 [Deep Search] Filtered ${beforeResourceFilter - links.length} API/resource links, ${links.length} remaining`);

            // Filter out URLs from common domains we want to avoid
            const beforeDomainFilter = links.length;
            links = links.filter(url => {
                const lowerUrl = url.toLowerCase();
                // Skip social media, video platforms, etc.
                return !lowerUrl.includes('youtube.com') &&
                    !lowerUrl.includes('facebook.com') &&
                    !lowerUrl.includes('twitter.com') &&
                    !lowerUrl.includes('instagram.com') &&
                    !lowerUrl.includes('tiktok.com') &&
                    !lowerUrl.includes('linkedin.com') &&
                    !lowerUrl.includes('pinterest.com') &&
                    !lowerUrl.includes('reddit.com');
            });
           //console.log(`🔎 [Deep Search] Filtered ${beforeDomainFilter - links.length} social/video links, ${links.length} remaining`);
            if (links.length > this.maxLinksPerPage) {
                // Score links based on domain quality
                const scoredLinks = links.map(url => {
                    const lowerUrl = url.toLowerCase();
                    let score = 0;

                    // Boost academic and research sites
                    if (lowerUrl.includes('pubmed') ||
                        lowerUrl.includes('nih.gov') ||
                        lowerUrl.includes('.edu') ||
                        lowerUrl.includes('doi.org') ||
                        lowerUrl.includes('journal') ||
                        lowerUrl.includes('science') ||
                        lowerUrl.includes('research') ||
                        lowerUrl.includes('academic')) {
                        score += 5;
                    }

                    return { url, score };
                });

                // Sort by score (highest first) and take the top N
                scoredLinks.sort((a, b) => b.score - a.score);
                links = scoredLinks.map(item => item.url).slice(0, this.maxLinksPerPage);

               //console.log(`🔎 [Deep Search] Prioritized ${links.length} academic/research links`);
            }
            // If we still have too many links, filter them based on relevance to query
            if (links.length > this.maxLinksPerPage * 2) {
                const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 3);

                // Score each link based on how many query terms appear in the URL or its surrounding context
                const scoredLinks = links.map(url => {
                    const lowerUrl = url.toLowerCase();
                    let score = 0;

                    // Check URL itself for query terms
                    queryTerms.forEach(term => {
                        if (lowerUrl.includes(term)) {
                            score += 2;
                        }
                    });

                    // Check for link context by finding the link in the original content
                    // and extracting surrounding text (50 chars before and after)
                    const linkPos = content.indexOf(url);
                    if (linkPos !== -1) {
                        const start = Math.max(0, linkPos - 50);
                        const end = Math.min(content.length, linkPos + url.length + 50);
                        const context = content.substring(start, end).toLowerCase();

                        // Score increases based on query terms in surrounding context
                        queryTerms.forEach(term => {
                            if (context.includes(term)) {
                                score += 1;
                            }
                        });
                    }

                    return { url, score };
                });

                // Sort by score and take top ones
                scoredLinks.sort((a, b) => b.score - a.score);
                links = scoredLinks.slice(0, this.maxLinksPerPage).map(item => item.url);
            } else {
                // If we don't have too many links, just take the top few
                links = links.slice(0, this.maxLinksPerPage);
            }

           //console.log(`🔎 [Deep Search] Selected ${links.length} top links for deep search exploration`);
            if (links.length > 0) {
               //console.log(`🔎 [Deep Search] First few links:`, links.slice(0, 3));
            }
            return links;
        } catch (error) {
            console.error('🔎 [Deep Search] Error extracting links from content:', error);
            return [];
        }
    }
    // Extracts text content from a PDF using PDF.js, with paywall detection and cancellation support
    async extractPdfContent(url) {
        // Check for cancellation before starting
        if (this.isCancelled) {
            throw new DOMException('Research process aborted', 'AbortError');
        }

        if (!window.pdfjsLib) {
            throw new Error('PDF.js library not loaded');
        }

        try {
           //console.log('📄 PDF EXTRACTION: Starting extraction for URL:', url);

            // Use our proxy server with abort controller
            const proxyUrl = `/api/proxy/pdf?url=${encodeURIComponent(url)}`;
           //console.log('📄 PDF EXTRACTION: Using proxy URL:', proxyUrl);

            const loadingTask = window.pdfjsLib.getDocument({
                url: proxyUrl,
                withCredentials: false,
                // Add signal if the PDF.js library supports it
                ...(this.abortController ? { signal: this.abortController.signal } : {})
            });

            // Check again for cancellation
            if (this.isCancelled) {
                throw new DOMException('Research process aborted', 'AbortError');
            }

            const pdf = await loadingTask.promise;
           //console.log(`📄 PDF EXTRACTION: Successfully loaded PDF with ${pdf.numPages} pages`);

            // Another cancellation check after PDF loading
            if (this.isCancelled) {
                throw new DOMException('Research process aborted', 'AbortError');
            }

            let textContent = '';

            // Extract text from each page (up to 50 pages max)
            const pagesToExtract = Math.min(pdf.numPages, 50);

            for (let i = 1; i <= pagesToExtract; i++) {
                // Check for cancellation in each iteration
                if (this.isCancelled) {
                    throw new DOMException('Research process aborted', 'AbortError');
                }

                const page = await pdf.getPage(i);
                const content = await page.getTextContent();

                // Join text items into a string
                const pageText = content.items.map(item => item.str).join(' ');
                textContent += pageText + '\n\n';

                // Free up memory
                page.cleanup();
            }

            // Final cancellation check
            if (this.isCancelled) {
                throw new DOMException('Research process aborted', 'AbortError');
            }

            // Limit the size of the extracted text to avoid performance issues
            if (textContent.length > 100000) {
                textContent = textContent.substring(0, 100000) + '...[content truncated due to size]';
            }

           //console.log(`📄 PDF EXTRACTION: Successfully extracted ${textContent.length} characters from PDF`);
            return textContent;
        } catch (error) {
            // Propagate abort errors
            if (error.name === 'AbortError' || this.isCancelled) {
               //console.log('PDF extraction cancelled');
                throw new DOMException('Research process aborted', 'AbortError');
            }

            console.error('📄 PDF EXTRACTION ERROR:', error);

            // Check for common academic paywall domains
            const isProbablyPaywalled =
                url.includes('science.org') ||
                url.includes('nature.com') ||
                url.includes('springer') ||
                url.includes('wiley') ||
                url.includes('jstor') ||
                url.includes('uchicago.edu') ||
                url.includes('academic.oup.com') ||
                url.includes('doi.org');

            if (isProbablyPaywalled || error.toString().includes("403")) {
               //console.log('📄 PDF EXTRACTION: Detected academic paywall, adding placeholder content');

                // Extract publication details from URL
                const urlParts = url.split('/');
                const fileName = urlParts[urlParts.length - 1];
                const journalName = url.match(/\/\/(www\.)?([^\/]+)/)[2].replace('www.', '');

                // Create placeholder content for paywalled PDFs
                return `[This is an academic PDF from ${journalName} that appears to require institutional access]
    
                Title: ${fileName.replace('.pdf', '').replace(/-/g, ' ')}
                URL: ${url}
                
                This source has been identified as a PDF that likely requires academic or institutional access. While the full text cannot be automatically extracted, you can:
                
                1. Click the "View PDF" link to open it in your browser if you have access through your institution
                2. Search for the paper title in Google Scholar or your institution's library
                3. Consider this reference in your research, noting you may need to access it manually
                
                [PDF access limited - Academic/Institutional access may be required]`;
            }

            throw new Error(Lang.get('failedToExtractPDF') + ': ' + error.message);
        }
    }
    async generateAndDisplayResults(query, loadingWindow, uniqueSources) {


        // Update loading window
        this.updateLoadingProgress(loadingWindow, "Generating research report...", 90);
        const report = await this.generateReport(query, uniqueSources);



        // PHASE 5: Display results
        this.updateLoadingProgress(loadingWindow, Lang.get('researchComplete'), 100);

        // Close loading window
        loadingWindow.close();
        this.activeWindow = null;

        // Log completion without referencing the stats variable
       //console.log(`RESEARCH COMPLETE: Research process finished successfully`);

        // Now display results
        this.displayResearchResults(report, uniqueSources);
    }
    async processSearchResults(searchResults) {
        const sources = [];
       //console.log(`Research: Processing ${searchResults.length} search result groups sequentially`);

        // Process each search group sequentially
        for (const searchGroup of searchResults) {
            // Process enhanced content first
            if (searchGroup.enhancedContent?.length > 0) {
               //console.log(`Research: Processing ${searchGroup.enhancedContent.length} enhanced content items sequentially`);

                // Process one item at a time in sequence
                for (const content of searchGroup.enhancedContent) {
                    // NEW: Clean the title first
                    const cleanedTitle = this.cleanSearchResultTitle(content.title, content.url);

                    if (content.isPdf === true || content.requiresSpecialExtraction === true) {
                       //console.log(`Research: Processing PDF: ${content.url}`);

                        // Process completely before continuing - await each step
                        await this.processSearchResultWithExtraction(
                            content.url,
                            cleanedTitle || null,
                            searchGroup.query,
                            sources,
                            0 // Depth 0 = top-level source
                        );
                    } else {
                        // Process with pre-extracted content
                        await this.processSearchResultWithExtraction(
                            content.url,
                            cleanedTitle,
                            searchGroup.query,
                            sources,
                            0,
                            null,
                            content.extractedContent
                        );
                    }
                }
            } else {
                // Process top search results sequentially
                for (const result of searchGroup.results.slice(0, 3)) {
                    // NEW: Clean the title first
                    const cleanedTitle = this.cleanSearchResultTitle(result.title, result.link);

                    await this.processSearchResultWithExtraction(
                        result.link,
                        cleanedTitle,
                        searchGroup.query,
                        sources,
                        0
                    );
                }
            }
        }

        // The sources array is now fully populated with all processed sources
        return { sources };
    }
    async processSearchResultWithExtraction(url, title, query, sources, depth, linkedFrom = null, preExtractedContent = null) {
        try {
            // Skip if already visited or cancelled
            if (this.visitedUrls.has(url) || !this.abortController) return;

            // Determine source type based on URL pattern and depth
            const isPdfUrl = url.toLowerCase().endsWith('.pdf') ||
                url.toLowerCase().includes('/pdf/') ||
                url.toLowerCase().includes('pdf.') ||
                url.toLowerCase().includes('document/d/') ||
                url.toLowerCase().includes('arxiv.org');

            // Classify source type: 'pdf', 'deep', or 'regular'
            const sourceType = isPdfUrl ? 'pdf' : (depth > 0 ? 'deep' : 'regular');



            // Log depth information with source type
            const depthIndicator = depth > 0 ? `[${"→".repeat(depth)}]` : "";
           //console.log(`${depthIndicator} Processing ${sourceType.toUpperCase()} source: ${url}`);
            if (depth > 0 && linkedFrom) {
               //console.log(`${depthIndicator} This link was found in: ${linkedFrom}`);
            }

            // Mark as visited to avoid duplicates
            this.visitedUrls.add(url);


            // Extract content with appropriate method
            let content = null;
            try {
                if (preExtractedContent) {
                    content = preExtractedContent;
                } else {
                    content = await this.extractContent(url);
                }
            } catch (extractionError) {
                console.error(`${depthIndicator} Error extracting content from ${url}:`, extractionError);

                // For PDFs, still add to sources even if extraction failed
                if (isPdfUrl) {
                   //console.log(`${depthIndicator} Adding PDF to sources despite extraction failure: ${url}`);

                    // Create a placeholder title if needed
                    let pageTitle = title;
                    if (!pageTitle) {
                        const urlObj = new URL(url);
                        const filename = urlObj.pathname.split('/').pop() || 'Document';
                        pageTitle = filename.replace('.pdf', '').replace(/%20/g, ' ').replace(/[-_]/g, ' ');
                        pageTitle = pageTitle.replace(/\b\w/g, c => c.toUpperCase());
                        pageTitle = `${pageTitle} [PDF Document]`;
                    } else if (!title.includes('[PDF')) {
                        pageTitle = `${title} [PDF Document]`;
                    }
                    if (isPdfUrl) {
                       //console.log(`📄 PDF PROCESSING: Detected PDF URL requiring special extraction: ${url}`);
                        /*console.log(`📄 PDF CRITERIA MET: 
                            - URL ends with .pdf: ${url.toLowerCase().endsWith('.pdf')}
                            - URL contains /pdf/: ${url.toLowerCase().includes('/pdf/')}
                            - URL contains pdf.: ${url.toLowerCase().includes('pdf.')}
                            - URL contains document/d/: ${url.toLowerCase().includes('document/d/')}
                            - URL contains arxiv.org: ${url.toLowerCase().includes('arxiv.org')}
                        `);*/
                    }
                    // Add PDF to sources even without content
                    sources.push({
                        title: pageTitle,
                        url: url,
                        summary: Lang.get('pdfCouldNotBeProcessed'),
                        relevance: depth === 0 ? 1.0 : (0.9 - (depth * 0.2)),
                        depth: depth,
                        linkedFrom: linkedFrom,
                        originalContent: null,
                        isPdf: true // Mark as PDF explicitly
                    });
                   //console.log(`${depthIndicator} Added PDF to sources: "${pageTitle}"`);


                    return;
                }

                // For non-PDFs, just continue with the loop
                return;
            }

            // Handle new content format that might be returned for PDFs
            let extractedContent = '';
            let isPdf = false;

            if (typeof content === 'object' && content !== null) {
                // This is the branch that handles PDF content
                if (content.isPdf) {
                    isPdf = true;
                    extractedContent = content.text;
                } else {
                    extractedContent = content;
                }
            } else {
                extractedContent = content;
            }

            // Special handling for PDFs with extraction problems
            if (isPdf && (!extractedContent || extractedContent.includes(Lang.get('failedToExtractContent')))) {
               //console.log(`${depthIndicator} PDF extraction had issues but still adding to sources: ${url}`);

                // Create a title for PDF if needed
                let pageTitle = title;
                if (!pageTitle) {
                    const urlObj = new URL(url);
                    const filename = urlObj.pathname.split('/').pop() || 'Document';
                    pageTitle = filename.replace('.pdf', '').replace(/%20/g, ' ').replace(/[-_]/g, ' ');
                    pageTitle = pageTitle.replace(/\b\w/g, c => c.toUpperCase());
                    pageTitle = `${pageTitle} [PDF Document]`;
                } else if (!title.includes('[PDF')) {
                    pageTitle = `${title} [PDF Document]`;
                    if (pageTitle && pageTitle.includes('http')) {
                        // Remove any URLs from the title
                        pageTitle = pageTitle.replace(/https?:\/\/[^\s]+/g, '').trim();
                    }
                }

               //console.log(`📄 Processing URL: ${url}`);
               //console.log(`📄 isPdfUrl detected: ${isPdfUrl}`);
               //console.log(`📄 isPdf from content: ${isPdf}`);

                // IMPORTANT: Make sure URL-based PDF detection sets the flag even if content object didn't
                if (isPdfUrl && !isPdf) {
                   //console.log(`📄 Setting isPdf=true based on URL pattern for: ${url}`);
                    isPdf = true;
                }

                // Add more logging of the final state
               //console.log(`📄 Final isPdf flag before adding to sources: ${isPdf}`);

                // Get a basic summary for the PDF
                const summary = Lang.get('pdfCouldNotBeFullyProcessed');

                // Later when adding to sources, the isPdf flag should now be properly set
                sources.push({
                    title: pageTitle,
                    url: url,
                    summary: summary,
                    relevance: depth === 0 ? 1.0 : (0.9 - (depth * 0.2)),
                    depth: depth,
                    linkedFrom: linkedFrom,
                    originalContent: depth === 0 ? extractedContent : null,
                    isPdf: isPdf  // This should now be correctly set
                });

                // Log the addition
               //console.log(`${depthIndicator} Added PDF with extraction issues to sources: "${pageTitle}"`);

                // Decrement PDF counter before returning

                return;
            }

            // Skip empty content for non-PDF files
            if (!isPdf && (!extractedContent || extractedContent.includes("Failed to extract content"))) {
               //console.log(`${depthIndicator} Skipping empty/failed content for: ${url}`);

                return;
            }

            // Try to extract title if needed
            let pageTitle = title;
            if (!pageTitle) {
                if (isPdf) {
                    // Create a title for PDF based on URL
                    const urlObj = new URL(url);
                    const filename = urlObj.pathname.split('/').pop() || 'Document';
                    pageTitle = filename.replace('.pdf', '').replace(/%20/g, ' ').replace(/[-_]/g, ' ');
                    // Capitalize first letter of each word
                    pageTitle = pageTitle.replace(/\b\w/g, c => c.toUpperCase());
                    // Add PDF indicator
                    pageTitle = `${pageTitle} [PDF Document]`;
                } else {
                    const titleMatch = extractedContent.match(/<title>(.*?)<\/title>/i);
                    pageTitle = titleMatch ? titleMatch[1] : url.split('/').pop() || "Untitled";
                    // Add this enhanced title cleanup logic - replace your existing if statement
                    if (pageTitle && !isPdf) {
                        // Remove URL patterns from title
                        pageTitle = pageTitle.replace(/https?:\/\/[^\s]+/g, '').trim();

                        // If domain name is at beginning of title without spaces
                        const urlObj = new URL(url);
                        const domain = urlObj.hostname.replace('www.', '');

                        // If title starts with domain (like "sina.com.cn...")
                        if (pageTitle.toLowerCase().startsWith(domain.toLowerCase())) {
                            pageTitle = pageTitle.substring(domain.length).trim();
                        }

                        // Remove common patterns that combine title with domain
                        pageTitle = pageTitle
                            .replace(/\s*[-–|]\s*$/, '')  // Remove trailing dash or pipe
                            .replace(/\s*[-–|]\s*[^-–|]+\.[^-–|]+$/, '') // Remove "- domain.com"
                            .trim();

                        // If title is now empty or just the domain name, use the path component
                        if (!pageTitle || pageTitle.length < 3) {
                            const pathParts = urlObj.pathname.split('/').filter(p => p);
                            if (pathParts.length > 0) {
                                // Get the last meaningful path segment
                                const lastPath = pathParts[pathParts.length - 1]
                                    .replace(/\.html?$/, '')
                                    .replace(/-|_/g, ' ');

                                // Capitalize first letter of each word
                                pageTitle = lastPath
                                    .split(' ')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(' ');
                            } else {
                                // Use domain name as title if nothing better
                                pageTitle = domain.charAt(0).toUpperCase() + domain.slice(1);
                            }
                        }

                        // Add site name after the title for context
                        const siteName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
                        if (!pageTitle.toLowerCase().includes(siteName.toLowerCase())) {
                            pageTitle = `${pageTitle} - ${siteName}`;
                        }
                    }
                }
            } else if (isPdf && !title.includes('[PDF')) {
                // Add PDF indicator to provided title
                pageTitle = `${title} [PDF Document]`;
            }

           //console.log(`${depthIndicator} Summarizing content for: "${pageTitle}"`);


            // Summarize
            try {
                // Summarize
                const summary = await this.summarizeContent(extractedContent, query);

                // Add to sources with PDF flag
                sources.push({
                    title: pageTitle,
                    url: url,
                    summary: summary,
                    relevance: depth === 0 ? 1.0 : (0.9 - (depth * 0.2)),
                    depth: depth,
                    linkedFrom: linkedFrom,
                    originalContent: depth === 0 ? extractedContent : null,
                    isPdf: isPdf
                });

               //console.log(`${depthIndicator} Added to sources: "${pageTitle}" (depth=${depth})`);

                // IMPORTANT FIX: Track parent operation for entire deep search process
                // Only increment the parent deep search operation if we're going to process links
                if (this.deepSearchEnabled && depth < this.maxDeepSearchDepth) {
                    // Add a parent operation counter for the entire batch


                    try {
                        const links = await this.extractRelevantLinks(extractedContent, url, query);

                        if (links.length > 0) {
                            await this.limitConcurrency(links, async (link) => {
                                if (this.visitedUrls.has(link)) return;
                                this.visitedUrls.add(link);


                                try {
                                    await this.processSearchResultWithExtraction(link, null, query, sources, depth + 1, url);
                                } finally {

                                }
                            }, 3); // Process 3 links at a time
                        }
                    } finally {

                    }
                }


            } catch (error) {
                console.error(`Error processing search result for ${url}:`, error);

                // Even on error, decrement counters
            }
        } finally {

        }
    }
    async generateSearchQueries(mainQuery) {
        // Check cancellation before starting
        if (this.isCancelled) {
            throw new DOMException('Research process aborted', 'AbortError');
        }

        // Detect the language of the original query
        const queryLanguage = this.detectLanguage(mainQuery);

        // Use Ollama to break down a complex research masterkey into sub-queries
        const systemPrompt = `You are a research assistant. Today's date is ${this.formattedDate}.

        CRITICAL LANGUAGE REQUIREMENT: 
        - The user's query is in ${queryLanguage}
        - You MUST generate ALL search queries in ${queryLanguage} 
        - Do NOT translate to English or any other language
        - Preserve the exact language, tone, and terminology of the original query
        
        Generate 3-5 specific search queries to thoroughly research the following topic.
        Each query should focus on a different aspect of the main question.
        If the query contains time-based references like "recent", "last decade", or "past few years", 
        interpret them relative to the current date: ${this.formattedDate}.
        
        EXAMPLE:
        If input is "¿Cuál es el genético que causa el pelo blanco en los gatos?"
        Generate queries like:
        - "¿Qué genes controlan el color del pelaje en los gatos?"
        - "¿Cómo funciona la genética del albinismo en felinos?"
        - "¿Cuáles son las mutaciones genéticas que causan pelo blanco en gatos?"
        
        Return ONLY a JSON array of strings in ${queryLanguage}, nothing else.`;

        try {
            const selectedModel = document.getElementById('model-selector').value;
            // Get model-specific parameters using OllamaAPI utility
            const modelParams = OllamaAPI.getModelParameters(selectedModel);
            const { routing, options: requestOptions } = await this.buildResearchRoutingAndOptions(selectedModel, {
                num_ctx: parseInt(this.contextSize),
                temperature: 0.3, // Lower temperature for more consistent language output
                ...modelParams
            });

            // First check if Ollama is actually available
            try {
                // Cloud calls are proxied through the app backend and do not require local daemon checks.
                if (routing.source === 'cloud') {
                    throw new Error('skip-local-version-check-for-cloud');
                }

               //console.log('Research: Checking Ollama API availability...');
                const checkResponse = await fetch('http://localhost:11434/api/version', {
                    method: 'GET',
                    signal: AbortSignal.timeout(2000) // 2 second timeout
                });

                if (!checkResponse.ok) {
                    throw new Error(`Ollama server responded with ${checkResponse.status}`);
                }
               //console.log('Research: Ollama API is available');
            } catch (connectionError) {
                if (connectionError?.message === 'skip-local-version-check-for-cloud') {
                    // Continue without fallback for cloud providers.
                } else {
                console.warn('Research: Ollama API is not available:', connectionError);
               //console.log('Research: Using direct query and generated sub-queries as fallback');
                // Fall back to basic query breakdown if Ollama is not available
                return this.generateBasicQueries(mainQuery);
                }
            }

            // Check cancellation before proceeding to next API call
            if (this.isCancelled) {
                throw new DOMException('Research process aborted', 'AbortError');
            }

            // Proceed with the Ollama API call
            const response = await fetch(`${routing.baseUrl}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...routing.headers },
                body: JSON.stringify({
                    model: routing.modelName || selectedModel,
                    prompt: `User query: "${mainQuery}"

                    Please generate 3-5 research queries in the SAME language as this query.`,
                    system: systemPrompt,
                    think: false,
                    options: requestOptions,
                    stream: false
                }),
                signal: this.abortController?.signal
            });

            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 429) {
                    throw new Error(`${(window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.'}${errorText ? `\n${errorText}` : ''}`);
                }
                throw new Error(`Query generation request failed: ${response.status}`);
            }

            if (this.isCancelled) {
                throw new DOMException('Research process aborted', 'AbortError');
            }

            const data = await response.json();

            // Check cancellation after parsing
            if (this.isCancelled) {
                throw new DOMException('Research process aborted', 'AbortError');
            }

            const cleanedResponse = this.removeAIThinkingTags(data?.response || data?.message?.content || '');

            // Enhanced logging of raw response
            /*console.log('Research: Raw AI response for search queries:', {
                requestModel: selectedModel,
                requestDate: this.formattedDate,
                responseLength: data.response?.length || 0,
                responseFirstLine: data.response?.split('\n')[0] || 'No response',
                detectedLanguage: queryLanguage,
                originalQuery: mainQuery
            });*/

            try {
                // First remove markdown code block markers if present
                let responseText = cleanedResponse.trim();
                if (responseText.startsWith('```json') || responseText.startsWith('```')) {
                    // Extract content between code blocks
                    const startIndex = responseText.indexOf('\n') + 1;
                    const endIndex = responseText.lastIndexOf('```');
                    if (startIndex > 0 && endIndex > startIndex) {
                        responseText = responseText.substring(startIndex, endIndex).trim();
                    } else {
                        // If we can't find proper code block markers, remove just the starting ones
                        responseText = responseText.replace(/^```(json)?/, '').trim();
                    }
                }

                // Try to parse the cleaned JSON
                const queries = JSON.parse(responseText);

                // Validate that queries are in the same language
                const validatedQueries = this.validateQueryLanguage(queries, queryLanguage, mainQuery);
                return validatedQueries;

            } catch (e) {
                console.warn('Failed to parse search queries as JSON, using fallback method', e);

                // Fallback: extract queries line by line, excluding markdown and JSON syntax
                const lines = cleanedResponse
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line &&
                        !line.startsWith('[') &&
                        !line.startsWith(']') &&
                        !line.startsWith('{') &&
                        !line.startsWith('}') &&
                        !line.startsWith('```'))
                    .map(line => line.replace(/^"\s*|\s*"$|^'\s*|\s*'$|^\d+\.\s*|^-\s*|\s*,$/g, ''));

                // Take up to 5 queries and validate language
                const fallbackQueries = lines.slice(0, 5);
                return this.validateQueryLanguage(fallbackQueries, queryLanguage, mainQuery);
            }
        } catch (error) {
            // Check if this is an abortion error
            if (error.name === 'AbortError' || this.isCancelled) {
               //console.log('Research: Query generation cancelled');
                throw new DOMException('Research process aborted', 'AbortError');
            }

            const msg = String(error?.message || '').toLowerCase();
            if (msg.includes('429') || msg.includes('too many requests') || msg.includes('weekly usage') || msg.includes('daily limit')) {
                throw error;
            }

            console.error('Error generating search queries:', error);
            // If all else fails, use our basic query generation
            return this.generateBasicQueries(mainQuery);
        }
    }

    detectLanguage(text) {
        // Simple language detection based on common patterns
        const spanishPatterns = /¿|¡|ñ|á|é|í|ó|ú|ü|Qué|Cuál|Cómo|Dónde|Por qué|genético|gatos/i;
        const englishPatterns = /\b(what|which|how|where|why|genetic|cats|the|and|or|in|on|at)\b/i;

        if (spanishPatterns.test(text)) {
            return 'Spanish';
        } else if (englishPatterns.test(text)) {
            return 'English';
        }

        // Default fallback - try to detect by character patterns
        const hasSpanishChars = /[ñáéíóúü¿¡]/i.test(text);
        return hasSpanishChars ? 'Spanish' : 'English';
    }

    validateQueryLanguage(queries, expectedLanguage, originalQuery) {
        if (!Array.isArray(queries)) {
            console.warn('Invalid queries format, using fallback');
            return this.generateBasicQueries(originalQuery);
        }

        // Filter out any queries that appear to be in the wrong language
        const validQueries = queries.filter(query => {
            if (!query || typeof query !== 'string') return false;

            const queryLanguage = this.detectLanguage(query);
            const isCorrectLanguage = queryLanguage === expectedLanguage;

            if (!isCorrectLanguage) {
                console.warn(`Filtered out query in wrong language: "${query}" (expected ${expectedLanguage}, got ${queryLanguage})`);
            }

            return isCorrectLanguage;
        });

        // If we don't have enough valid queries, fall back to basic generation
        if (validQueries.length < 2) {
            console.warn('Not enough queries in correct language, using fallback');
            return this.generateBasicQueries(originalQuery);
        }

       //console.log(`Research: Validated ${validQueries.length} queries in ${expectedLanguage}:`, validQueries);
        return validQueries;
    }

    async limitConcurrency(items, asyncFunction, maxConcurrent = 5) {
        const results = [];
        const executing = new Set();

        for (const item of items) {
            // Create the promise for this item
            const p = Promise.resolve().then(() => asyncFunction(item));

            // Add to results
            results.push(p);

            // Add to executing set
            executing.add(p);

            // Once it completes, remove from executing set
            p.then(() => executing.delete(p));

            // If we've reached max, wait for one to finish
            if (executing.size >= maxConcurrent) {
                await Promise.race(executing);
            }
        }

        // Wait for all promises to complete
        return Promise.all(results);
    }

    generateBasicQueries(mainQuery) {
        // Generate some basic search queries without using AI
        const baseQuery = mainQuery.trim();

        // Generate variations
        const queries = [
            baseQuery, // Original query
            `${baseQuery} ${Lang.get('factsAndStatistics')}`,
            `${Lang.get('latestResearchOn')} ${baseQuery}`,
            `${baseQuery} ${Lang.get('analysis')}`
        ];

        // Remove duplicates and return
        return [...new Set(queries)];
    }

    async fetchRawHtmlForLinkExtraction(url) {
       //console.log(`🔎 [Deep Search] Fetching raw HTML from: ${url}`);

        try {
            const encodedUrl = encodeURIComponent(url);
            const fetchUrl = `/api/extract/raw-html?url=${encodedUrl}`;

            const response = await fetch(fetchUrl, {
                signal: this.abortController?.signal
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch raw HTML: ${response.status}`);
            }

            const data = await response.json();
           //console.log(`🔎 [Deep Search] Fetched ${data.rawHtml?.length || 0} bytes of HTML`);

            return data.rawHtml || '';
        } catch (error) {
            console.error(`🔎 [Deep Search] Error fetching raw HTML:`, error);
            return '';
        }
    }

    cleanQueryForSearch(query) {
        // Remove any leading/trailing spaces and dashes
        let cleaned = query.trim().replace(/^[-–—]/, '');

        // Remove any invalid escape sequences 
        cleaned = cleaned.replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .replace(/\\\\/g, "\\");

        return cleaned;
    }

    cleanQueryForDisplay(query) {
        if (!query) return '';

        // First remove any escape sequences
        let cleaned = query
            .replace(/\\"/g, '"')  // Replace \" with "
            .replace(/\\'/g, "'")  // Replace \' with '
            .replace(/\\\\/g, "\\"); // Replace \\ with \

        // Remove surrounding quotes (both single and double quotes)
        cleaned = cleaned.replace(/^['"](.*)['"]$/, '$1');

        // For display purposes only, if you want to remove ALL quotes:
        cleaned = cleaned.replace(/["']/g, '');

        // Or to just visually clean up the display but preserve search quality, 
        // keep the internal quotes - they improve search accuracy

        return cleaned;
    }

    updateLoadingProgress(window, message, percent = null) {
        if (window && window.update) {
            // Add deep search indicator to the message if enabled
            let displayMessage = message;
            if (this.deepSearchEnabled) {
                displayMessage += ` [Deep Search Enabled: ${this.maxDeepSearchDepth} levels]`;
            }
            window.update(displayMessage, percent);
        }
    }

    async generateReport(query, sources) {
        // Check cancellation before starting
        if (this.isCancelled) throw new DOMException('Research process aborted', 'AbortError');

        // Ensure we have sources to work with
        if (!sources || sources.length === 0) {
            return "⚠️ No relevant sources were found to answer this query. Please try a different research question or refine your query.";
        }

        // Process sources in batches of 5
        const batchSize = 5;
        const reportParts = [];

        for (let i = 0; i < sources.length; i += batchSize) {
            const sourceBatch = sources.slice(i, i + batchSize);
            const batchReport = await this.generatePartialReport(query, sourceBatch, i);
            reportParts.push(batchReport);
        }

        // Combine the parts
        const finalReport = await this.combineReportParts(reportParts, query);
        return finalReport;
    }

    // Add these two new methods to the ResearchAutomation class:
    async generatePartialReport(query, sourceBatch, startIndex) {
        // Check cancellation before starting
        if (this.isCancelled) throw new DOMException('Research process aborted', 'AbortError');

       //console.log(`Generating partial report for batch ${startIndex / 5 + 1} with ${sourceBatch.length} sources`);

        // Combine sources into context with adjusted indices
        let context = sourceBatch.map((source, index) =>
            `[${startIndex + index + 1}] ${source.title}\nURL: ${source.url}\nSummary: ${source.summary.substring(0, 300)}...`
        ).join('\n\n');

        // NEW: Determine word count range based on report size and batch count
        const wordCountRange = this.getWordCountRangeForSize(this.reportSize, true);

        const systemPrompt = `
        LANGUAGE REQUIREMENT: Write the ENTIRE report in the SAME LANGUAGE as this query: "${query}". 
        You are an expert research analyst preparing part of a research report.
        Today's date is ${this.formattedDate}.
        
        TASK: Analyze the provided sources (${startIndex + 1}-${startIndex + sourceBatch.length}) to extract key information related to the research question.
        
        For this batch of sources:
        1. Extract all relevant facts, data points, and insights
        2. Organize the information into clear sections with appropriate headings
        3. Include in-text citations using [n] format where n is the source number
        4. Don't create an introduction or conclusion for the full report
        5. Focus exclusively on the content from these specific sources
        
        Your partial report should be well-structured and ready to be combined with other sections.
        Aim for approximately ${wordCountRange} words for this section.
    `;

        try {
            // Check cancellation again before API call
            if (this.isCancelled) throw new DOMException('Research process aborted', 'AbortError');

            const selectedModel = document.getElementById('model-selector').value;
            // Get model-specific parameters using OllamaAPI utility
            const modelParams = OllamaAPI.getModelParameters(selectedModel);

            const controller = this.abortController || new AbortController();
            const signal = controller.signal;

            const { routing, options: requestOptions } = await this.buildResearchRoutingAndOptions(selectedModel, {
                num_ctx: parseInt(this.contextSize),
                ...modelParams
            });
            const response = await fetch(`${routing.baseUrl}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...routing.headers },
                body: JSON.stringify({
                    model: routing.modelName || selectedModel,
                    prompt: `Research Question: ${query}\n\nAvailable Sources:\n${context}\n\nPlease generate a partial research report covering these specific sources.`,
                    system: systemPrompt,
                    think: false,
                    options: requestOptions,
                    stream: false
                }),
                signal: signal
            });

            // Check cancellation after fetch
            if (this.isCancelled) throw new DOMException('Research process aborted', 'AbortError');

            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 429) {
                    throw new Error(`${(window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.'}${errorText ? `\n${errorText}` : ''}`);
                }
                throw new Error(`Partial report generation failed: ${response.status}`);
            }

            const data = await response.json();

            // Check cancellation after parse
            if (this.isCancelled) throw new DOMException('Research process aborted', 'AbortError');

            return this.removeAIThinkingTags(data?.response || data?.message?.content || '');
        } catch (error) {
            // Handle cancellation errors specifically
            if (error.name === 'AbortError' || this.isCancelled) {
                throw new DOMException('Research process aborted', 'AbortError');
            }

            console.error('Error generating partial research report:', error);
            return Lang.get('failedToGeneratePartialReport', { start: startIndex + 1, end: startIndex + sourceBatch.length, error: error.message });
        }
    }

    async combineReportParts(reportParts, query) {
        // Check cancellation before starting
        if (this.isCancelled) throw new DOMException('Research process aborted', 'AbortError');

        if (reportParts.length === 0) {
            return Lang.get('noReportPartsGenerated');
        }

        if (reportParts.length === 1) {
            return reportParts[0]; // If only one part, no need to combine
        }

       //console.log(`Combining ${reportParts.length} report parts into final report`);

        // Create a context with all report parts
        const context = reportParts.map((part, index) =>
            `### REPORT SECTION ${index + 1}\n${part.substring(0, 2500)}...`
        ).join('\n\n');

        // NEW: Determine word count range based on report size

        const wordCountRange = this.getWordCountRangeForSize(this.reportSize);

        const systemPrompt = `
        LANGUAGE REQUIREMENT: Write the ENTIRE report in the SAME LANGUAGE as this query: "${query}". 
        You are an expert research analyst creating a cohesive final report.
        Today's date is ${this.formattedDate}.
        
        TASK: Synthesize the provided report sections into one comprehensive research report on "${query}".
        
        For the final report:
        1. Create a compelling introduction that frames the research question
        2. Combine and reorganize all information from the sections
        3. Remove any redundancies or duplicated content
        4. Ensure proper flow and transitions between topics
        5. Maintain all citations in the [n] format
        6. Add a substantive conclusion that synthesizes key insights
        7. Include a complete "Sources" section listing all references
        
        The final report should be thorough, well-structured, and read as a single cohesive document.
        Aim for approximately ${wordCountRange} words for the complete report.
    `;

        try {
            // Check cancellation again before API call
            if (this.isCancelled) throw new DOMException('Research process aborted', 'AbortError');

            const selectedModel = document.getElementById('model-selector').value;
            const modelParams = OllamaAPI.getModelParameters(selectedModel);

            const controller = this.abortController || new AbortController();
            const signal = controller.signal;

            const { routing, options: requestOptions } = await this.buildResearchRoutingAndOptions(selectedModel, {
                num_ctx: parseInt(this.contextSize),
                ...modelParams
            });
            const response = await fetch(`${routing.baseUrl}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...routing.headers },
                body: JSON.stringify({
                    model: routing.modelName || selectedModel,
                    prompt: `Research Question: ${query}\n\nReport Sections to Combine:\n${context}\n\nPlease create a cohesive final research report.`,
                    system: systemPrompt,
                    think: false,
                    options: requestOptions,
                    stream: false
                }),
                signal: signal
            });

            // Check cancellation after fetch
            if (this.isCancelled) throw new DOMException('Research process aborted', 'AbortError');

            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 429) {
                    throw new Error(`${(window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.'}${errorText ? `\n${errorText}` : ''}`);
                }
                throw new Error(`Final report combination failed: ${response.status}`);
            }

            const data = await response.json();
            return this.removeAIThinkingTags(data?.response || data?.message?.content || '');
        } catch (error) {
            // Handle cancellation errors specifically
            if (error.name === 'AbortError' || this.isCancelled) {
                throw new DOMException('Research process aborted', 'AbortError');
            }

            const msg = String(error?.message || '').toLowerCase();
            if (msg.includes('429') || msg.includes('too many requests') || msg.includes('weekly usage') || msg.includes('daily limit')) {
                return (window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.';
            }

            console.error('Error combining research report parts:', error);

            // Fallback: just concatenate the parts with headings
            return `# ${Lang.get('researchReportTitle')}: ${query}\n\n` + reportParts.join('\n\n--- \n\n');
        }
    }
    // Displays the research results and sources in a floating window, with editing and export options
    displayResearchResults(report, sources, runId = null) {
        if (runId !== null && runId !== this._activeResearchRunId) {
            return;
        }

        if (runId !== null && this._lastDisplayedResearchRunId === runId) {
            return;
        }

        // Simple flag to prevent duplicate windows
        if (this._isDisplayingResults || document.querySelector('.research-results-overlay')) {
           //console.log('Research: Results window already exists or is being displayed, skipping duplicate call');
            return;
        }

        try {
           //console.log('Research: Beginning display of results');


            // NEW ADDITION: Call the force stop method to terminate any lingering processes 
            // before displaying results - this will ensure clean termination of ALL processing
            this.forceStopAllOperations();

            // Re-enable research flag since forceStopAllOperations sets it to false
            this.isResearching = false;

            // IMPORTANT: Find and close ALL research progress windows first
            const progressElements = document.querySelectorAll('.research-overlay, .floating-overlay')
                ;
            progressElements.forEach(el => {
                try {
                    if (document.body.contains(el)) {
                       //console.log('Research: Removing progress overlay element');
                        document.body.removeChild(el);
                    }
                } catch (e) {
                    console.error('Research: Error removing overlay', e);
                }
            });

            // Reset any existing window reference
            if (this.activeWindow) {
               //console.log('Research: Clearing active window reference');
                this.activeWindow = null;
            }


            // Set a flag to indicate we're displaying results - prevents race conditions
            this._isDisplayingResults = true;
            if (runId !== null) {
                this._lastDisplayedResearchRunId = runId;
            }

            // Create display window for results
            const contentContainer = this.createResultsWindow(report, sources);

           //console.log('Research: Results displayed in floating window');

        } catch (error) {
            console.error('Research: Error displaying results:', error);
        } finally {

            // Reset display flag AFTER cleanup
            setTimeout(() => {
                this._isDisplayingResults = false;
               //console.log('Research: Reset _isDisplayingResults flag');
            }, 500);
        }

        return;
    }

    // Creates the floating results window for the research report and sources panel
    createResultsWindow(report, sources) {
       //console.log('Research: Creating results window');

        try {
            const progressContainer = document.getElementById('research-progress');
            if (progressContainer) {
                progressContainer.style.display = 'none';
               //console.log('Research: Hidden progress container');
            }

            // Debug the sources
            console.log('All sources:', sources.map(s => ({
                title: s.title,
                url: s.url.substring(0, 50) + '...',
                isPdf: s.isPdf,
                isUrlPdf: s.url.toLowerCase().includes('.pdf'),
                contentLength: s.originalContent ? s.originalContent.length : 0
            })));

            // Count PDFs for debugging
            const pdfCount = sources.filter(s => s.isPdf || s.url.toLowerCase().includes('.pdf')).length;
           //console.log(`Research: Found ${pdfCount} PDF sources out of ${sources.length} total sources`);

            // Create floating window for comfortable research viewing
            const overlay = document.createElement('div');
            overlay.className = 'research-results-overlay';
            overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(3px);
        `;

            // Create the window container
            const container = document.createElement('div');
            container.className = 'research-results-window';
            container.style.cssText = `
            background-color: var(--bg-color, #ffffff);
            border-radius: 12px;
            box-shadow: 0 8px 30px var(--preview-shadow, rgba(0, 0, 0, 0.25));
            width: 85%;
            height: 90%;
            max-width: 1400px;
            max-height: 900px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            border: 1px solid var(--border-color, #e5e7eb);
        `;

            try {


                const progressContainer = document.getElementById('research-progress');
                if (progressContainer) {
                    progressContainer.style.display = 'none';
                   //console.log('Research: Hidden progress container');
                }
                // Debug the sources
                /*console.log('All sources:', sources.map(s => ({
                    title: s.title,
                    url: s.url.substring(0, 50) + '...',
                    isPdf: s.isPdf,
                    isUrlPdf: s.url.toLowerCase().includes('.pdf'),
                    contentLength: s.originalContent ? s.originalContent.length : 0
                })));*/

                // Count PDFs for debugging
                const pdfCount = sources.filter(s => s.isPdf || s.url.toLowerCase().includes('.pdf')).length;
               //console.log(`Research: Found ${pdfCount} PDF sources out of ${sources.length} total sources`);

                // Create floating window for comfortable research viewing
                const overlay = document.createElement('div');
                overlay.className = 'research-results-overlay';
                overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                backdrop-filter: blur(3px);
            `;

                // Create the window container
                const container = document.createElement('div');
                container.className = 'research-results-window';
                container.style.cssText = `
                background-color: var(--bg-color, #ffffff);
                border-radius: 12px;
                box-shadow: 0 8px 30px var(--preview-shadow, rgba(0, 0, 0, 0.25));
                width: 85%;
                height: 90%;
                max-width: 1400px;
                max-height: 900px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                border: 1px solid var(--border-color, #e5e7eb);
            `;

                // Window header with title and close button
                const header = document.createElement('div');
                header.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px;
                border-bottom: 1px solid var(--border-color, #e5e7eb);
                background-color: var(--preview-header-bg, #f8f9fa);
            `;

                const query = document.getElementById('research-query-input').value;
                const titleText = query ? `${Lang.get('researchResultsTitle')}: ${query.substring(0, 60)}${query.length > 60 ? '...' : ''}` : Lang.get('researchResults');

                const titleElement = document.createElement('div');
                titleElement.textContent = titleText;
                titleElement.style.cssText = `
                font-weight: 600;
                font-size: 18px;
                color: var(--text-color, #111827);
                flex-grow: 1;
            `;

                const closeButton = document.createElement('button');
                closeButton.innerHTML = '&times;';
                closeButton.style.cssText = `
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                padding: 0 5px;
                color: var(--label-color, #6b7280);
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: background-color 0.2s;
                &:hover {
                    background-color: var(--button-hover-bg, rgba(0, 0, 0, 0.05));
                }
            `;

                closeButton.addEventListener('click', () => {
                    document.body.removeChild(overlay);
                });

                header.appendChild(titleElement);
                header.appendChild(closeButton);
                container.appendChild(header);

                // Create content area with two-column layout for wider screens
                const contentWrapper = document.createElement('div');
                contentWrapper.style.cssText = `
                flex: 1;
                overflow: hidden;
                display: flex;
                flex-direction: row;
            `;

                // Convert the processed report's markdown to HTML
                const reportHtml = this.convertMarkdownToHtml(report);

                // Main report content (left side) - MAKE EDITABLE
                const reportContainer = document.createElement('div');
                reportContainer.className = 'report-content-area';
                reportContainer.style.cssText = `
                flex: 3;
                padding: 25px 30px;
                overflow-y: auto;
                border-right: 1px solid var(--border-color, #e5e7eb);
            `;

                // Count sources from deep search
                const deepSources = sources.filter(s => s.depth > 0).length;

                // ADD EDIT INDICATOR AND MAKE CONTENT EDITABLE
                reportContainer.innerHTML = `
                <div class="edit-indicator" style="margin-bottom: 15px; padding: 8px 12px; background: rgba(79, 70, 229, 0.1); border-radius: 6px; font-size: 14px; color: var(--accent-color);">
                    <span style="display: flex; align-items: center; gap: 8px;">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style="min-width: 16px;">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                        </svg>
                        ${Lang.get('researchReportEditable')}
                    </span>
                </div>
                <div class="research-report">
                    <div class="report-content" contenteditable="true" style="outline: none; border: 1px solid transparent; padding: 8px; border-radius: 4px; transition: border-color 0.2s; min-height: 500px;">
                        ${reportHtml}
                    </div>
                </div>
            `;

                // Make contenteditable area show a subtle border when focused
                const reportContent = reportContainer.querySelector('.report-content');
                reportContent.addEventListener('focus', () => {
                    reportContent.style.borderColor = 'var(--accent-color, #4f46e5)';
                    reportContent.style.backgroundColor = 'rgba(79, 70, 229, 0.03)';
                });
                reportContent.addEventListener('blur', () => {
                    reportContent.style.borderColor = 'transparent';
                    reportContent.style.backgroundColor = 'transparent';
                });

                // Sources panel (right side)
                const sourcesContainer = document.createElement('div');
                sourcesContainer.className = 'sources-panel-area';
                sourcesContainer.style.cssText = `
                flex: 2;
                padding: 25px;
                overflow-y: auto;
                background-color: var(--card-bg, rgba(0, 0, 0, 0.02));
            `;

                // POPULATE SOURCES PANEL WITH ACTUAL SOURCES
                let sourcesHTML = `
                <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 18px; color: var(--text-color);">${Lang.get('researchSourcesCount', { count: sources.length })}</h2>
            `;

                if (deepSources > 0) {
                    sourcesHTML += `
                    <div style="padding: 6px 10px; margin-bottom: 16px; background: rgba(79, 70, 229, 0.08); border-radius: 4px; font-size: 13px;">
                        ${Lang.get('researchDeepSourcesIncluded', { count: deepSources })}
                    </div>
                `;
                }

               //console.log("PDF sources before rendering:",
                   // sources.filter(s => s.isPdf || s.url.toLowerCase().includes('.pdf')));

                sources.forEach((source, index) => {
                    const isDeepSource = source.depth > 0;
                    // Use the explicit isPdf flag if available, otherwise check the URL pattern
                    const isPdf = source.isPdf || source.url.toLowerCase().endsWith('.pdf') || source.url.toLowerCase().includes('/pdf/');

                    // Improved title cleaning to ensure separation from URL
                    let cleanTitle = source.title || "Untitled Source";

                    // Ensure URLs aren't embedded in the title
                    if (cleanTitle.includes('http')) {
                        // Extract domain from URL
                        try {
                            const urlObj = new URL(source.url);
                            const domain = urlObj.hostname.replace('www.', '');

                            // If title contains domain without spacing, add spacing
                            if (cleanTitle.toLowerCase().includes(domain.toLowerCase())) {
                                const domainIndex = cleanTitle.toLowerCase().indexOf(domain.toLowerCase());
                                if (domainIndex > 0) {
                                    // Insert space between domain name and rest of title
                                    cleanTitle = cleanTitle.substring(0, domainIndex).trim();
                                }
                            }
                        } catch (e) {
                            // If URL parsing fails, just use basic cleanup
                            cleanTitle = cleanTitle.replace(/https?:\/\/[^\s]+/g, '').trim();
                        }
                    }

                    // For PDFs, add an indicator in the title if not already present
                    if (isPdf && !cleanTitle.includes('[PDF]') && !cleanTitle.includes('PDF Document')) {
                        cleanTitle = `📄 ${cleanTitle} [PDF]`;
                    }

                    sourcesHTML += `
                    <div class="source-item" data-source-index="${index}" style="
                        margin-bottom: 20px;
                        padding: 12px;
                        border: 1px solid var(--border-color, #e5e7eb);
                        border-radius: 6px;
                        background-color: var(--bg-color, white);
                        ${isDeepSource ? 'border-left: 3px solid var(--accent-color, #4f46e5);' : ''}
                        ${isPdf ? 'border-left: 3px solid var(--success-color, #10b981);' : ''}
                    ">
                        <div class="source-header" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span class="source-number" style="font-weight: bold;">[${index + 1}]</span>
                            <button class="remove-source-btn" style="
                                background: none;
                                border: none;
                                color: var(--danger-color, #ef4444);
                                cursor: pointer;
                                font-size: 16px;
                                padding: 0 4px;
                                opacity: 0.7;
                            ">×</button>
                        </div>
                        <h4 style="margin-top: 0; margin-bottom: 4px;">${cleanTitle}</h4>
                        <div class="source-link-container" style="margin-bottom: 8px;">
                        ${isPdf ?
                            `<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 5px;">
                                <a href="${source.url}" target="_blank" class="view-source-link" data-url="${source.url}" style=" 
                                    color: var(--link-color, #3b82f6);
                                    font-size: 13px;
                                    text-decoration: underline;
                                    cursor: pointer;
                                ">${Lang.get('researchViewPDF')}</a>
                            </div>
                            <div class="pdf-url" style="font-size: 12px; color: var(--text-muted, #6b7280); word-break: break-all; margin-top: 4px;">
                                ${source.url}
                            </div>` :
                            `<a href="${source.url}" target="_blank" style="
                                color: var(--link-color, #3b82f6);
                                display: block;
                                font-size: 13px;
                                word-break: break-all;
                            ">${source.url}</a>`
                        }
                        </div>
                        <div class="source-summary" contenteditable="true" style="
                            border: 1px solid transparent;
                            padding: 8px;
                            border-radius: 4px;
                            font-size: 14px;
                            transition: border-color 0.2s;
                        ">${this.convertMarkdownToHtml(source.summary)}</div>
                        ${isDeepSource ? `<div style="margin-top: 8px; font-size: 12px; color: var(--label-color);">Found via deep search (depth ${source.depth})</div>` : ''}
                        ${isPdf ? `<div style="margin-top: 8px; font-size: 12px; color: var(--success-color, #10b981);">PDF Document</div>` : ''}
                    </div>
                    `;
                });
                // Add event listener for PDF view links after the container is added to DOM
                document.addEventListener('click', function (e) {
                    if (e.target.classList.contains('view-source-link')) {
                        e.preventDefault();
                        const url = e.target.getAttribute('data-url');
                       //console.log('PDF link clicked, opening in new tab:', url);
                        window.open(url, '_blank');
                    }
                }, false);

                sourcesContainer.innerHTML = sourcesHTML;

               //console.log("Before enhanced PDF detection:",
                   // sources.filter(s => s.isPdf || s.url.toLowerCase().includes('.pdf')).length);

                // Enhanced PDF detection
                sources.forEach(source => {
                    // Ensure URL is properly formatted
                    if (source.url && !source.url.startsWith('http')) {
                        source.url = 'https://' + source.url;
                    }

                    // Expanded PDF detection patterns
                    const isPdfUrl = source.url.toLowerCase().endsWith('.pdf') ||
                        source.url.toLowerCase().includes('/pdf/') ||
                        source.url.toLowerCase().includes('.pdf?') ||
                        source.url.toLowerCase().includes('pdf.') ||
                        source.url.toLowerCase().includes('document/d/') ||
                        source.url.toLowerCase().includes('arxiv.org') ||
                        source.url.toLowerCase().includes('doi.org') ||
                        /view.*pdf/i.test(source.url);

                    if (isPdfUrl) {
                       //console.log(`Enhanced PDF detection: ${source.title} (${source.url})`);
                        source.isPdf = true;
                    }
                });

               //console.log("After enhanced PDF detection:",
                    //sources.filter(s => s.isPdf || s.url.toLowerCase().includes('.pdf')).length);

                // Log ALL sources with full details
                /*console.log("Complete sources list:", sources.map(s => ({
                    title: s.title,
                    url: s.url,
                    isPdf: s.isPdf,
                    looksLikePdf: s.url.toLowerCase().includes('.pdf'),
                    hasViewPdfLink: s.isPdf || s.url.toLowerCase().includes('.pdf'),
                })));*/

                // Log ALL sources with full details
                /*console.log("Complete sources list:", sources.map(s => ({
                    title: s.title,
                    url: s.url,
                    isPdf: s.isPdf,
                    looksLikePdf: s.url.toLowerCase().includes('.pdf'),
                    hasViewPdfLink: s.isPdf || s.url.toLowerCase().includes('.pdf'),
                })));*/

                // Add event listeners for source summary editing
                sourcesContainer.querySelectorAll('.source-summary').forEach(el => {
                    el.addEventListener('focus', () => {
                        el.style.borderColor = 'var(--accent-color, #4f46e5)';
                        el.style.backgroundColor = 'rgba(79, 70, 229, 0.03)';
                    });
                    el.addEventListener('blur', () => {
                        el.style.borderColor = 'transparent';
                        el.style.backgroundColor = 'transparent';
                    });
                });

                // Add event listeners for source removal
                sourcesContainer.querySelectorAll('.remove-source-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const sourceItem = btn.closest('.source-item');
                        if (sourceItem && confirm(Lang.get('researchConfirmRemoveSource'))) {
                            sourceItem.remove();

                            // Renumber remaining sources
                            sourcesContainer.querySelectorAll('.source-item').forEach((item, idx) => {
                                item.querySelector('.source-number').textContent = `[${idx + 1}]`;
                            });
                        }
                    });
                });

                // Add both containers to the content wrapper
                contentWrapper.appendChild(reportContainer);
                contentWrapper.appendChild(sourcesContainer);
                container.appendChild(contentWrapper);

                // Footer with action buttons
                const footer = document.createElement('div');
                footer.style.cssText = `
                padding: 16px 20px;
                border-top: 1px solid var(--border-color, #e5e7eb);
                display: flex;
                justify-content: flex-end;
                gap: 15px;
                background-color: var(--preview-header-bg, #f8f9fa);
            `;

                // Save to Knowledge Base button
                const saveToKbButton = document.createElement('button');
                saveToKbButton.textContent = Lang.get('researchSaveToKnowledgeBase');
                saveToKbButton.className = 'kb-action-btn';
                saveToKbButton.style.cssText = `
                padding: 10px 20px;
                border-radius: 6px;
                background-color: var(--accent-color, #4f46e5);
                color: white;
                border: none;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
                &:hover {
                    background-color: var(--accent-hover, #4338ca);
                }
            `;

                saveToKbButton.addEventListener('click', () => {
                    // Get edited report content from contenteditable div
                    const editedReport = reportContainer.querySelector('.report-content').innerHTML;
                    const convertedReport = this.htmlToMarkdown(editedReport);

                    // Get edited sources
                    const editedSources = [];
                    sourcesContainer.querySelectorAll('.source-item').forEach((sourceItem, index) => {
                        const sourceIndex = parseInt(sourceItem.dataset.sourceIndex);
                        const originalSource = sources[sourceIndex];
                        const editedSummary = sourceItem.querySelector('.source-summary').innerHTML;

                        editedSources.push({
                            ...originalSource,
                            summary: this.htmlToPlainText(editedSummary)
                        });
                    });

                    this.saveToKnowledgeBase(convertedReport, editedSources);
                });


                // Export button
                const exportButton = document.createElement('button');
                exportButton.textContent = Lang.get('exportButton');
                exportButton.className = 'export-action-btn';
                exportButton.style.cssText = `
                padding: 10px 20px;
                border-radius: 6px;
                background-color: var(--button-bg, #f3f4f6);
                color: var(--text-color, #111827);
                border: 1px solid var(--border-color, #d1d5db);
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s;
                &:hover {
                    background-color: var(--button-hover-bg, #e5e7eb);
                }
            `;

                exportButton.addEventListener('click', () => {
                    // Get edited report content
                    const editedReport = reportContainer.querySelector('.report-content').innerHTML;
                    // We need to keep the htmlToMarkdown function for this conversion
                    const convertedReport = this.htmlToMarkdown ?
                        this.htmlToMarkdown(editedReport) :
                        editedReport.replace(/<[^>]*>/g, ''); // Simple fallback if htmlToMarkdown not available

                    // Use the centralized export class
                    if (window.export && typeof window.export.showExportOptionsDialog === 'function') {
                        const title = this.currentQuery || 'Research Report';
                        window.export.showExportOptionsDialog(title, convertedReport);
                    } else {
                        console.warn('Export utility not available. Please try again later.');
                        alert(Lang.get('exportUtilityNotAvailable'));
                    }
                });

                footer.appendChild(exportButton);
                footer.appendChild(saveToKbButton);
                container.appendChild(footer);

                // Add responsive styles for smaller screens
                const style = document.createElement('style');
                style.textContent = `
                @media (max-width: 1024px) {
                    .research-results-window {
                        width: 95%;
                    }
                }
                @media (max-width: 768px) {
                    .report-content-area {
                        flex: 2;
                    }
                    .sources-panel-area {
                        flex: 1;
                    }
                }
                @media (max-width: 640px) {
                    .research-results-window .report-content-area, 
                    .research-results-window .sources-panel-area {
                        padding: 15px;
                    }
                }
            `;

                document.head.appendChild(style);
                overlay.appendChild(container);
                document.body.appendChild(overlay);

                // Also update the existing research-results container with a link to open the floating window
                const resultsContainer = document.getElementById('research-results');
                if (resultsContainer) {
                    resultsContainer.style.display = 'block';

                    // First remove any existing reopen-research-window listeners to prevent duplicates
                    const existingReopenButton = document.getElementById('reopen-research-window');
                    if (existingReopenButton) {
                        const newReopenButton = existingReopenButton.cloneNode(true);
                        if (existingReopenButton.parentNode) {
                            existingReopenButton.parentNode.replaceChild(newReopenButton, existingReopenButton);
                        }
                    }

                    resultsContainer.innerHTML = `
                 <div class="research-complete-notice" style="padding: 20px; text-align: center;">
                     <h3>${Lang.get('researchComplete')}</h3>
                     <p>${Lang.get('researchResultsDisplayed')} 
                     <a href="#" id="reopen-research-window" style="color: var(--accent-color);">${Lang.get('researchReopenLink')}</a>.</p>
                 </div>
             `;

                    setTimeout(() => {
                        const reopenButton = document.getElementById('reopen-research-window');
                        if (reopenButton) {
                            // Remove any existing click event listeners
                            const newReopenButton = reopenButton.cloneNode(true);
                            reopenButton.parentNode.replaceChild(newReopenButton, reopenButton);

                            // Add the event listener to the new button
                            newReopenButton.addEventListener('click', (e) => {
                                e.preventDefault();
                               //console.log('Reopen button clicked by user');
                                // Remove any existing overlays first
                                document.querySelectorAll('.research-results-overlay').forEach(el => el.remove());
                                // Call this function again to reopen the window
                                this.displayResearchResults(report, sources);
                            });
                        }
                    }, 100);
                }


               //console.log('Research: Results displayed in floating window');

                // Set the flag immediately rather than with timeout
                this._isDisplayingResults = false;
               //console.log('Research: Reset _isDisplayingResults flag');
               //console.log('Research: Results displayed in floating window');
            } catch (error) {
                console.error('Research: Error displaying results in floating window:', error);

                // Fall back to the original display method if something goes wrong
                const resultsContainer = document.getElementById('research-results');
                if (resultsContainer) {
                    resultsContainer.style.display = 'block';
                    resultsContainer.innerHTML = `
                    <div class="error-message">
                        <h3>Error Displaying Research</h3>
                        <p>There was an error displaying the research results: ${error.message}</p>
                        <p>Please try again or check the console for more information.</p>
                    </div>
                `;
                }
            } finally {
                // Triple-ensure operations are cleared

                // Reset display flag
                this._isDisplayingResults = false;
               //console.log('Research: Reset _isDisplayingResults flag');
            }

            // Set the research results reference for reopening
            this.researchResults = {
                report: report,
                sources: sources
            };

            return container;
        } catch (error) {
            console.error('Research: Error creating results window:', error);
            throw error; // Re-throw so the caller can handle it
        }
    }

    // Converts HTML content to Markdown format for export or saving
    htmlToMarkdown(html) {
        if (!html) return '';

        // Remove any <br> tags first
        let markdown = html.replace(/<br\s*\/?>/gi, '\n');

        // Replace heading tags
        markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
        markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
        markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
        markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
        markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
        markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

        // Replace paragraphs
        markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

        // Replace bold and italic
        markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
        markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
        markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
        markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

        // Replace links
        markdown = markdown.replace(/<a[^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

        // Replace lists
        markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '* $1\n');
        markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, '$1\n');
        markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, '$1\n');

        // Replace sup tags (used for source references)
        markdown = markdown.replace(/<sup[^>]*>\[(.*?)\]<\/sup>/gi, '[$1]');

        // Remove any remaining HTML tags
        markdown = markdown.replace(/<[^>]*>/g, '');

        // Decode HTML entities
        const entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&nbsp;': ' '
        };

        for (const [entity, char] of Object.entries(entities)) {
            markdown = markdown.replace(new RegExp(entity, 'g'), char);
        }

        // Remove multiple line breaks
        markdown = markdown.replace(/\n{3,}/g, '\n\n');

        return markdown.trim();
    }
    // Converts HTML content to plain text, removing tags and decoding entities
    htmlToPlainText(html) {
        if (!html) return '';

        // Replace <br> tags with newlines
        let text = html.replace(/<br\s*\/?>/gi, '\n');

        // Replace paragraph tags with newlines
        text = text.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '\n\n');

        // Remove all other HTML tags
        text = text.replace(/<[^>]*>/g, '');

        // Decode HTML entities
        const entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&nbsp;': ' '
        };

        for (const [entity, char] of Object.entries(entities)) {
            text = text.replace(new RegExp(entity, 'g'), char);
        }

        // Remove excess whitespace
        text = text.replace(/\s+/g, ' ').trim();

        return text;
    }
    // Downloads a file with the given content and filename using a Blob
    downloadFile(content, filename, mimeType = 'text/plain') {
        try {
            // Create a blob with explicit UTF-8 encoding
            const blob = new Blob([new TextEncoder().encode(content)], { type: mimeType });
            const url = URL.createObjectURL(blob);

            // Create an anchor element for downloading
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);

            // Trigger the download
            a.click();

            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);

           //console.log('Research: Successfully downloaded report as', filename);
            return true;
        } catch (error) {
            console.error('Research: Error exporting report:', error);
            alert('Error exporting report: ' + error.message);
            return false;
        }
    }

    // Cleans up text by normalizing line breaks, removing artifacts, and fixing encoding issues
    cleanText(text) {
        if (!text) return '';

        return text
            .replace(/\r\n/g, '\n')  // Normalize line breaks
            .replace(/\ufffd/g, '') // Remove replacement character
            .replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu, '') // Remove emojis
            .replace(/â€™/g, "'")  // Fix apostrophes
            .replace(/â€œ/g, '"')  // Fix left double quotes
            .replace(/â€/g, '"')   // Fix right double quotes
            .replace(/â€¦/g, '...') // Fix ellipsis
            .replace(/â€"/g, '—')  // Fix em dash
            .replace(/Â/g, '')     // Remove non-breaking space artifact
            .replace(/ðŸ.{1,3}/g, ''); // Remove emoji codes
    }

    // Escapes HTML special characters in a string
    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Converts Markdown to HTML for display in the UI, handling headings, lists, links, and code
    convertMarkdownToHtml(markdown) {
        if (!markdown) return '';

        // First handle code blocks (```code```)
        let html = markdown.replace(/```(.*?)\n([\s\S]*?)```/g, (match, language, code) => {
            const escapedCode = this.escapeHtml(code);
            return `<div class="code-block"><div class="code-header">${language || 'code'}</div><pre><code class="${language || ''}">${escapedCode}</code></pre></div>`;
        });

        // Handle inline code (`code`)
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Handle headings
        html = html.replace(/## (.*?)\n/g, '<h2>$1</h2>')
            .replace(/# (.*?)\n/g, '<h1>$1</h1>')
            .replace(/### (.*?)\n/g, '<h3>$1</h3>')
            .replace(/#### (.*?)\n/g, '<h4>$1</h4>');

        // Handle formatting
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Handle links
        html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

        // Handle citation references
        html = html.replace(/\[(\d+)\]/g, '<sup>[$1]</sup>');

        // Handle lists
        html = html.replace(/^(\d+)\. (.*?)$/gm, '<li>$2</li>')
            .replace(/^\* (.*?)$/gm, '<li>$1</li>');

        // Wrap lists
        html = html.replace(/<li>(.*?)<\/li>\n<li>/g, '<li>$1</li><li>');
        html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

        // Handle paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = `<p>${html}</p>`;
        html = html.replace(/<p><\/p>/g, '');

        // Fix any nested paragraphs in other elements
        html = html.replace(/<(h\d|li|div|code)(.*?)><p>(.*?)<\/p><\/(h\d|li|div|code)>/g, '<$1$2>$3</$4>');

        return html;
    }
    // Initiates the process to save a research report and sources to the knowledge base
    async saveToKnowledgeBase(report, sources) {
       //console.log('Research: Preparing to save report to knowledge base');

        // Make sure the research tab is initialized first
        if (!window.researchTab || !window.researchTab.initialized) {
            await window.researchTab.initialize();
        }

        if (!window.researchTab.knowledgeBase) {
            alert(Lang.get('knowledgeBaseNotAvailable'));
            return;
        }

        // Check if a research model is selected
        const modelSelector = document.getElementById('model-selector');
        const selectedModel = modelSelector?.value;

        if (!selectedModel) {
            alert(Lang.get('researchModelRequiredForKB'));
            return;
        }

        // Show the save dialog
        this.showSaveToKnowledgeBaseDialog(report, sources);
    }

    // Shows the modal dialog for saving a report and sources to the knowledge base
    showSaveToKnowledgeBaseDialog(report, sources) {
       //console.log('Research: Showing save to knowledge base dialog');

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'kb-save-modal-overlay';
        overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        backdrop-filter: blur(3px);
    `;

        // Create modal container using theme variables
        const modal = document.createElement('div');
        modal.className = 'kb-save-modal';
        modal.style.cssText = `
        background-color: var(--bg-color, #ffffff);
        color: var(--text-color, #000000);
        border-radius: 10px;
        padding: 24px;
        width: 500px;
        max-width: 90%;
        box-shadow: 0 5px 15px var(--preview-shadow, rgba(0, 0, 0, 0.3));
    `;

        // Modal header
        modal.innerHTML = `
        <h2 style="margin-top: 0; font-size: 1.5rem; color: var(--text-color);">
            ${Lang.get('saveToKnowledgeBase')}
        </h2>
        <p style="margin-bottom: 20px; color: var(--label-color);">
            ${Lang.get('researchSaveDescription')}
        </p>
    `;

        // Add title input field with the research query pre-filled
        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = `margin-bottom: 20px;`;
        titleContainer.innerHTML = `
        <label for="kb-report-title" style="display: block; margin-bottom: 8px; color: var(--text-color); font-weight: 500;">${Lang.get('reportTitle')}</label>
        <input type="text" id="kb-report-title" value="${this.currentQuery || 'Research Report'}" style="
            width: 100%;
            padding: 10px 12px;
            border-radius: 6px;
            border: 1px solid var(--border-color);
            background-color: var(--input-bg);
            color: var(--text-color);
            box-sizing: border-box;
        ">
    `;
        modal.appendChild(titleContainer);

        // Add source options
        const sourcesContainer = document.createElement('div');
        sourcesContainer.style.cssText = `margin-bottom: 20px;`;
        sourcesContainer.innerHTML = `
        <label style="display: block; margin-bottom: 8px; color: var(--text-color); font-weight: 500;">${Lang.get('sourceOptions')}</label>
        <div style="
            padding: 12px;
            border-radius: 6px;
            border: 1px solid var(--border-color);
            background-color: var(--card-bg);
        ">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <input type="radio" id="sources-separate" name="sources-option" value="separate" checked style="margin-right: 8px;">
                <label for="sources-separate" style="color: var(--text-color);">${Lang.get('saveSeparateEntries')} (${sources.length} sources)</label>
            </div>
            <div style="display: flex; align-items: center;">
                <input type="radio" id="sources-included" name="sources-option" value="included" style="margin-right: 8px;">
                <label for="sources-included" style="color: var(--text-color);">${Lang.get('includeSourcesInReport')}</label>
            </div>
        </div>
    `;
        modal.appendChild(sourcesContainer);

        // Collection selector section
        const collectionContainer = document.createElement('div');
        collectionContainer.style.cssText = `margin-bottom: 24px;`;
        collectionContainer.innerHTML = `
        <label for="kb-collection-selector" style="display: block; margin-bottom: 8px; color: var(--text-color); font-weight: 500;">${Lang.get('saveToCollection')}</label>
        <select id="kb-collection-selector" style="
            width: 100%;
            padding: 10px 12px;
            border-radius: 6px;
            border: 1px solid var(--border-color);
            background-color: var(--input-bg);
            color: var(--text-color);
            box-sizing: border-box;
        ">
            <option value="loading">${Lang.get('loadingCollections')}</option>
        </select>
    `;
        modal.appendChild(collectionContainer);

        // Buttons container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 12px;
    `;

        // Cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = Lang.get('cancelButton');
        cancelButton.style.cssText = `
        padding: 10px 16px;
        border-radius: 6px;
        border: 1px solid var(--border-color);
        background-color: var(--button-bg);
        color: var(--button-text);
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s;
    `;

        // Save button
        const saveButton = document.createElement('button');
        saveButton.textContent = Lang.get('researchSaveToKnowledgeBase');
        saveButton.style.cssText = `
        padding: 10px 16px;
        border-radius: 6px;
        border: none;
        background-color: var(--accent-color);
        color: var(--accent-text, white);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
    `;

        // Add buttons to container
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(saveButton);
        modal.appendChild(buttonContainer);

        // Add modal to overlay and overlay to document
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Now populate the collections dropdown
        this.populateCollectionSelector(document.getElementById('kb-collection-selector'));

        // Event handlers
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        // Add hover effects
        cancelButton.addEventListener('mouseenter', () => {
            cancelButton.style.backgroundColor = 'var(--button-hover-bg, #e5e7eb)';
        });
        cancelButton.addEventListener('mouseleave', () => {
            cancelButton.style.backgroundColor = 'var(--button-bg)';
        });

        saveButton.addEventListener('mouseenter', () => {
            saveButton.style.backgroundColor = 'var(--accent-color-hover, #4338ca)';
        });
        saveButton.addEventListener('mouseleave', () => {
            saveButton.style.backgroundColor = 'var(--accent-color)';
        });

        // Save button click handler
        saveButton.addEventListener('click', async () => {
            // Get form values
            const title = document.getElementById('kb-report-title').value.trim();
            const collectionId = document.getElementById('kb-collection-selector').value;
            const saveSeparateSources = document.getElementById('sources-separate').checked;

            // Validate
            if (!title) {
                alert(Lang.get('pleaseEnterReportTitle'));
                return;
            }

            if (collectionId === 'loading' || collectionId === '') {
                alert(Lang.get('pleaseSelectCollection'));
                return;
            }

            // Disable button while saving
            saveButton.disabled = true;
            saveButton.textContent = Lang.get('saving');
            saveButton.style.opacity = '0.7';

            try {
                // Handle new collection creation if needed
                let finalCollectionId = collectionId;
                if (collectionId === 'new') {
                    // Use the report title as collection name (already validated above)
                    try {
                        const newCollection = {
                            id: `collection_${Date.now()}`,
                            name: title, // Use the report title directly
                            entries: [],
                            created: new Date().toISOString(),
                            updated: new Date().toISOString()
                        };

                        // Save to database
                        await PaiperworkDB.saveKnowledgeCollection(window.researchTab.knowledgeBase.hashedMasterKey, newCollection);

                        // Add to collections array
                        window.researchTab.knowledgeBase.collections.push(newCollection);

                        // Set as target collection
                        finalCollectionId = newCollection.id;
                    } catch (error) {
                        console.error('Error creating new collection:', error);
                        alert(Lang.get('failedToCreateNewCollection', { error: error.message }));

                        // Reset button state
                        saveButton.disabled = false;
                        saveButton.textContent = 'Save to Knowledge Base';
                        saveButton.style.opacity = '1';
                        return;
                    }
                }

                // Create entry data
                const entryData = {
                    title: title,
                    content: report,
                    source: {
                        type: 'research',
                        query: this.currentQuery || title,
                        timestamp: new Date().toISOString(),
                        sourcesCount: sources?.length || 0,
                        sources: sources?.map(s => ({
                            title: s.title,
                            url: s.url,
                            summary: s.summary
                        }))
                    }
                };

                // Save main report
                const mainEntryId = await window.researchTab.knowledgeBase.addEntry(finalCollectionId, entryData);

                // Handle sources if requested
                if (saveSeparateSources) {
                    await this.saveSources(finalCollectionId, title, mainEntryId, sources);
                }

                // Close dialog
                document.body.removeChild(overlay);

                // Show success message
                alert(Lang.get('researchSavedSuccessfully'));

                await window.researchTab.knowledgeBase.reloadCollections();

                // Refresh collections display if we're on the knowledge base tab
                if (window.researchTab.currentSubTab === 'knowledge-base') {
                    window.researchTab.knowledgeBase.renderAllCollections();
                }
            } catch (error) {
                console.error('Error saving to knowledge base:', error);
                alert(Lang.get('failedToSaveToKnowledgeBase', { error: error.message }));

                // Re-enable button
                saveButton.disabled = false;
                saveButton.textContent = 'Save to Knowledge Base';
                saveButton.style.opacity = '1';
            }
        });

        return overlay;
    }

    // Populates the collection selector dropdown with available knowledge base collections
    async populateCollectionSelector(selectElement) {
        try {
            const knowledgeBase = window.researchTab.knowledgeBase;
            const collections = knowledgeBase.collections || [];

            // Clear the loading option
            selectElement.innerHTML = '';

            // Add create new option
            const newOption = document.createElement('option');
            newOption.value = 'new';
            newOption.textContent = Lang.get('createNewCollectionOption');
            newOption.selected = true;
            selectElement.appendChild(newOption);

            // Add collections to dropdown
            if (collections && collections.length > 0) {
                collections.forEach(collection => {
                    const option = document.createElement('option');
                    option.value = collection.id;
                    option.textContent = Lang.get('collectionWithEntries', { name: collection.name, count: collection.entries?.length || 0 });
                    selectElement.appendChild(option);
                });
            }

            // Keep the safer default to prevent accidental saves into existing collections.
            selectElement.value = 'new';
        } catch (error) {
            console.error('Error loading collections:', error);
            selectElement.innerHTML = `<option value="">${Lang.get('errorLoadingCollections')}</option>`;
        }
    }

    // Saves each source as a separate entry in the knowledge base, showing progress
    async saveSources(collectionId, reportTitle, mainEntryId, sources) {
        if (!sources || sources.length === 0) return;

        // Create progress dialog
        const progressOverlay = document.createElement('div');
        progressOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;

        const progressContent = document.createElement('div');
        progressContent.style.cssText = `
        background-color: var(--bg-color);
        color: var(--text-color);
        border-radius: 10px;
        padding: 24px;
        width: 400px;
        max-width: 90%;
        box-shadow: 0 5px 15px var(--preview-shadow);
    `;

        progressContent.innerHTML = `
        <h3 style="margin-top: 0; font-size: 1.3rem; margin-bottom: 16px; color: var(--text-color);">
            ${Lang.get('savingSourcesTitle')}
        </h3>
        <p id="saving-status" style="margin-bottom: 16px; color: var(--label-color);">
            ${Lang.get('savingSourceInitial', { total: sources.length })}
        </p>
        <div style="height: 6px; background-color: var(--button-bg); border-radius: 3px; overflow: hidden;">
            <div id="save-progress" style="height: 100%; width: 0%; background-color: var(--accent-color); transition: width 0.3s;"></div>
        </div>
    `;

        progressOverlay.appendChild(progressContent);
        document.body.appendChild(progressOverlay);

        const statusEl = document.getElementById('saving-status');
        const progressEl = document.getElementById('save-progress');

        // Save each source
        let savedCount = 0;
        for (const [index, source] of sources.entries()) {
            if (!source.title || !source.url || !source.summary) continue;

            // Update progress UI
            statusEl.textContent = Lang.get('savingSourceProgress', { current: index + 1, total: sources.length });
            progressEl.style.width = `${((index + 1) / sources.length) * 100}%`;

            // Create source entry content - format the summary as HTML
            const sourceTitle = `${Lang.get('sourcePrefix')}: ${source.title || Lang.get('untitledSource')}`;
            const formattedSummary = this.convertMarkdownToHtml ?
                this.convertMarkdownToHtml(source.summary || Lang.get('noSummaryAvailable')) :
                source.summary || Lang.get('noSummaryAvailable');

            const sourceContent = `*${Lang.get('sourceFromResearch')}: "${reportTitle}"*\n\n` +
                `## ${Lang.get('summary')}\n${source.summary || Lang.get('noSummaryAvailable')}\n\n` +
                `## ${Lang.get('sourceURL')}\n[${source.url}](${source.url})\n\n` +
                `*${Lang.get('entryCreatedAsSourceReference')} "${reportTitle}".*`;

            // Create entry data
            const sourceEntryData = {
                title: sourceTitle,  // The title goes here in metadata
                content: sourceContent,  // Content without duplicate title
                source: {
                    type: 'research_source',
                    url: source.url,
                    parentReport: mainEntryId,
                    researchQuery: reportTitle,
                    timestamp: new Date().toISOString()
                }
            };

            // Small delay to update UI
            await new Promise(resolve => setTimeout(resolve, 50));

            // Save to knowledge base
            try {
                await window.researchTab.knowledgeBase.addEntry(collectionId, sourceEntryData);
                savedCount++;
            } catch (error) {
                console.error(`Failed to save source ${index + 1}:`, error);
            }
        }

        // Remove progress dialog
        document.body.removeChild(progressOverlay);
        return savedCount;
    }

    // Forcefully stops all ongoing research operations, timers, and UI overlays
    forceStopAllOperations() {
       //console.log('RESEARCH: Force stopping ALL search operations');

        // 1. Set cancellation flags immediately
        this.isCancelled = true;
        this.isResearching = false;
        this._skipAllSummarizations = true;
        // Call the complete termination method
        this.completeTermination();

        // 2. Abort any ongoing fetch operations
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        // 3. Create a new AbortController for any future operations
        this.abortController = new AbortController();

        // 4. Kill WebSearch operations specifically - simplified approach
        if (window.WebSearch && typeof window.WebSearch.cancelAllOperations === 'function') {
           //console.log('Calling WebSearch cancelAllOperations');
            window.WebSearch.cancelAllOperations();
        }

        // 5. Stop any ongoing timers
        if (!this._pendingTimers) this._pendingTimers = [];
        this._pendingTimers.forEach(timerId => clearTimeout(timerId));
        this._pendingTimers = [];

        // 6. Close any active window
        if (this.activeWindow) {
            try {
                this.activeWindow.close();
                this.activeWindow = null;
               //console.log('Closed active window');
            } catch (e) {
                console.error('Error closing active window:', e);
            }
        }

        // 7. Remove any overlays from the DOM
        document.querySelectorAll('.research-overlay, .floating-overlay').forEach(el => {
            try {
                if (document.body.contains(el)) {
                    document.body.removeChild(el);
                }
            } catch (err) {
                console.error('Error removing overlay:', err);
            }
        });

        // 8. Reset any UI elements
        const resultsContainer = document.getElementById('research-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `<div class="cancelled-message">${Lang.get('researchProcessCancelled')}</div>`;
        }

        // 9. Reset visited URLs set
        this.visitedUrls = new Set();

       //console.log('RESEARCH: All operations successfully terminated');
        return true;
    }
    // Completes termination of all research processes and resets state
    completeTermination() {
       //console.log('ENHANCED TERMINATION: Ensuring all processes are fully stopped');

        // 1. Abort any ongoing fetch operations
        if (this.abortController) {
           //console.log('Aborting fetch operations with AbortController');
            this.abortController.abort();
            this.abortController = new AbortController();
        }

        // 2. Terminate WebSearch operations
        if (window.WebSearch && typeof window.WebSearch.cancelAllOperations === 'function') {
           //console.log('Terminating all WebSearch operations');
            window.WebSearch.cancelAllOperations();
        }

        // 3. Clear all pending summarizations
        const pendingCount = this.pendingSummarizations.size;
        if (pendingCount > 0) {
           //console.log(`Clearing ${pendingCount} pending summarization operations`);
            this.pendingSummarizations.clear();
            this.allSummarizationsComplete = true;
        }

        // 4. Terminate in-progress summarizations by modifying behavior
        this._skipAllSummarizations = true;

        // 5. Clear all pending timers and intervals
        if (this._pendingTimers && this._pendingTimers.length) {
           //console.log(`Clearing ${this._pendingTimers.length} pending timers`);
            this._pendingTimers.forEach(timerId => clearTimeout(timerId));
            this._pendingTimers = [];
        }

        // 6. Break any deep-search processing chains
        this.deepSearchEnabled = false;
        this.maxDeepSearchDepth = 0;
        this.maxLinksPerPage = 0;

        // 7. Force clear all queued or pending requests
        this.visitedUrls = new Set();

       //console.log('ENHANCED TERMINATION: All cancellation measures applied');
    }
}

class KnowledgeBase {
    constructor() {
        this.collections = [];
        this.selectedModel = '';
        this.hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        this.abortController = null;
        this.usingSyntheticEmbeddings = false;
        this._createCollectionHandler = null;
        this._creatingCollection = false;
    }

    async reloadCollections() {
        const collections = await PaiperworkDB.loadKnowledgeCollections(this.hashedMasterKey);
        this.collections = Array.isArray(collections) ? collections : [];
        return this.collections;
    }

    async initialize() {
        // Simply load knowledge collections from database
        await this.reloadCollections();

        // Set up event listeners for collection creation
        const createBtn = document.getElementById('create-collection-btn');
        if (createBtn) {
            if (createBtn.__kbCreateHandler && typeof createBtn.__kbCreateHandler === 'function') {
                createBtn.removeEventListener('click', createBtn.__kbCreateHandler);
            }

            this._createCollectionHandler = () => this.createNewCollection();
            createBtn.addEventListener('click', this._createCollectionHandler);
            createBtn.__kbCreateHandler = this._createCollectionHandler;
        }

        // Log initialization
       //console.log(`Knowledge Base: Initialized with ${this.collections?.length || 0} collections`);
    }

    // Helper method for HTML escaping
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    viewEntryDirectly(collectionId, entryId) {
        // First switch to the knowledge base tab
        if (window.researchTab) {
            window.researchTab.switchSubTab('knowledge-base');
        }

        // Then view the collection
        setTimeout(() => {
            this.viewCollection(collectionId);

            // Then find and open the specific entry
            setTimeout(() => {
                const entryElement = document.querySelector(`[data-entry-id="${entryId}"]`);
                if (entryElement) {
                    entryElement.click();
                }
            }, 300);
        }, 100);
    }

    renderAllCollections() {
        // Fix the ID mismatch - use 'knowledge-collections-list' instead of 'collections-list'
        const container = document.getElementById('knowledge-collections-list');
        if (!container) {
            console.error("Knowledge Base: Could not find collections container element");
            return;
        }

        if (!this.collections || this.collections.length === 0) {
            container.innerHTML = `<div class="empty-state">${Lang.get('noKnowledgeCollections')}</div>`;
            return;
        }

        // Clear the container first
        container.innerHTML = '';

        // Render each collection
        this.collections.forEach(collection => {
            const card = this.renderCollection(collection);
            container.appendChild(card);
        });

        // Add debug log
       //console.log(`Knowledge Base: Rendered ${this.collections.length} collections`);
    }
    renderCollection(collection) {
        const card = document.createElement('div');
        card.className = 'collection-card';
        card.dataset.id = collection.id;
        card.style.cssText = `
            background-color: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        `;

        const entriesCount = collection.entries ? collection.entries.length : 0;
        const lastUpdated = collection.updated ? new Date(collection.updated).toLocaleDateString() : Lang.get('never');

        card.innerHTML = `
            <h4 class="collection-title" style="color: var(--card-title); margin-top: 0;">${collection.name}</h4>
            <div class="collection-stats" style="margin: 10px 0; color: var(--card-text);">
                <div><strong>${Lang.get('entries')}:</strong> ${entriesCount}</div>
                <div><strong>${Lang.get('lastUpdated')}:</strong> ${lastUpdated}</div>
            </div>
            <div class="collection-actions" style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
                <button class="collection-btn view-btn" style="background-color: var(--accent-color, #4f46e5); color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer;">${Lang.get('view')}</button>
                <button class="collection-btn edit-btn" style="background-color: var(--button-bg); color: var(--button-text); border: 1px solid var(--border-color); border-radius: 4px; padding: 6px 12px; cursor: pointer;">${Lang.get('edit')}</button>
                <button class="collection-btn export-btn" style="background-color: var(--success-color, #10b981); color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer;">${Lang.get('export')}</button>
                <button class="collection-btn delete-btn" style="background-color: var(--danger-color); color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer;">${Lang.get('delete')}</button>
            </div>
        `;
        // Add event listeners
        card.querySelector('.view-btn').addEventListener('click', () => {
            this.viewCollection(collection.id);
        });

        card.querySelector('.edit-btn').addEventListener('click', () => {
            this.editCollection(collection.id);
        });

        // Add export button listener
        card.querySelector('.export-btn').addEventListener('click', () => {
            // Format the collection data for export
            const formattedContent = this.formatCollectionForExport(collection);

            // Use the centralized export class to handle the export
            if (window.export && typeof window.export.showExportOptionsDialog === 'function') {
                window.export.showExportOptionsDialog(collection.name, formattedContent);
            } else {
                console.warn('Export utility not available. Please try again later.');
                alert(Lang.get('exportUtilityNotAvailable'));
            }
        });

        card.querySelector('.delete-btn').addEventListener('click', () => {
            this.deleteCollection(collection.id);
        });

        return card;
    }
    async createNewCollection() {
        if (this._creatingCollection) return;

        const nameInput = document.getElementById('collection-name-input');
        const createBtn = document.getElementById('create-collection-btn');
        const name = (nameInput?.value || '').trim();
        if (!name) return;

        const existing = this.collections.find(c => String(c?.name || '').trim().toLowerCase() === name.toLowerCase());
        if (existing) {
            if (nameInput) nameInput.value = '';
            this.renderAllCollections();
            this.viewCollection(existing.id);
            return;
        }

        this._creatingCollection = true;
        if (createBtn) {
            createBtn.disabled = true;
        }

        const newCollection = {
            id: `collection_${Date.now()}`,
            name: name,
            entries: [],
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };

        try {
            this.collections.push(newCollection);
            await PaiperworkDB.saveKnowledgeCollection(this.hashedMasterKey, newCollection);
            if (nameInput) nameInput.value = '';

            // Update UI
            this.renderAllCollections();
        } finally {
            this._creatingCollection = false;
            if (createBtn) {
                createBtn.disabled = false;
            }
        }
    }

    viewCollection(collectionId) {
        // Get the collection
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) {
            console.error('Knowledge Base: Collection not found', collectionId);
            return;
        }

        // Check if a model is selected in the CHAT model selector
        const mainModelSelector = document.getElementById('model-selector');
        const selectedModel = mainModelSelector?.value;

        // If no model is selected, show a warning and return
        if (!selectedModel) {
           //console.log('Knowledge Base: No model selected for viewing collection');

            // Create warning overlay
            const warningOverlay = document.createElement('div');
            warningOverlay.className = 'model-warning-overlay';
            warningOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.6);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1500;
            `;

            // Create warning dialog
            const warningDialog = document.createElement('div');
            warningDialog.className = 'model-warning-dialog';
            warningDialog.style.cssText = `
                background-color: var(--card-bg, #fff);
                border-radius: 8px;
                padding: 24px;
                max-width: 450px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                text-align: center;
            `;

            // Add warning content
            warningDialog.innerHTML = `
                <div style="font-size: 40px; color: var(--warning-color, #f59e0b); margin-bottom: 16px;">⚠️</div>
                <h3 style="margin-top: 0; color: var(--text-color); font-size: 18px;">${Lang.get('modelSelectionRequired')}</h3>
                <p style="margin: 16px 0; color: var(--text-color); line-height: 1.5;">
                    ${Lang.get('knowledgeBaseModelRequired')}
                </p>
                <div style="display: flex; justify-content: center; gap: 10px; margin-top: 20px;">
                    <button id="select-model-btn" style="
                        background-color: var(--accent-color, #4f46e5);
                        color: white;
                        border: none;
                        border-radius: 6px;
                        padding: 10px 20px;
                        cursor: pointer;
                        font-size: 14px;
                    ">${Lang.get('selectModel')}</button>
                </div>
            `;

            // Add dialog to overlay
            warningOverlay.appendChild(warningDialog);
            document.body.appendChild(warningOverlay);

            // Add event listener to close button
            document.getElementById('select-model-btn').addEventListener('click', () => {
                document.body.removeChild(warningOverlay);

                // Switch to chat tab to select model
                window.tabManager.switchTab('chat-tab');

                // Focus on model selector
                setTimeout(() => {
                    const modelSelector = document.getElementById('model-selector');
                    if (modelSelector) modelSelector.focus();
                }, 100);
            });

            return;
        }

        // Create the collection view container
        const container = document.createElement('div');
        container.className = 'collection-view';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: var(--bg-color, #fff);
            z-index: 1000;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            align-items: center; /* Center horizontally */
            box-sizing: border-box;
        `;

        // Create header with back button and new entry button
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--border-color, #eee);
            width: 100%;
            max-width: 800px; /* Match the entries container max-width */
        `;
        const titleEl = document.createElement('h2');
        titleEl.textContent = collection.name;
        titleEl.style.cssText = `
        margin: 0 0 0 20px;
        flex-grow: 1;
    `;

        const backBtn = document.createElement('button');
        backBtn.textContent = Lang.get('backToKnowledgeBase');
        backBtn.className = 'kb-btn';
        backBtn.style.cssText = `
        cursor: pointer;
        padding: 8px 16px;
        text-align: center;
        min-width: 180px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    `;

        const newEntryBtn = document.createElement('button');
        newEntryBtn.textContent = Lang.get('newEntry');
        newEntryBtn.className = 'kb-btn';
        newEntryBtn.style.cssText = `
        cursor: pointer;
        padding: 8px 16px;
        text-align: center;
        min-width: 120px;
        background-color: var(--accent-color, #4f46e5);
        color: white;
        margin-left: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border-radius: 6px;
    `;

        backBtn.addEventListener('click', () => {
            document.body.removeChild(container);
            this.renderAllCollections();
        });

        newEntryBtn.addEventListener('click', () => {
            this.showAddEntryForm(collection.id, container);
        });

        header.appendChild(backBtn);
        header.appendChild(titleEl);
        header.appendChild(newEntryBtn);
        container.appendChild(header);

        // Create entries container
        const entriesContainer = document.createElement('div');
        entriesContainer.className = 'collection-entries';
        entriesContainer.id = `collection-entries-${collection.id}`;
        entriesContainer.style.cssText = `
            width: 100%;
            max-width: 1000px; /* Limit width for better readability */
            box-sizing: border-box;
            padding: 0 10px;
            color: var(--text-color, #1e293b);
        `;
        container.appendChild(entriesContainer);

        // Check if collection has entries
        if (!collection.entries || collection.entries.length === 0) {
            entriesContainer.innerHTML = `
            <div class="empty-state" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                height: 200px;
                padding: 40px 20px;
                color: var(--text-muted, #64748b);
                font-size: 16px;
                border: 1px dashed var(--border-color, #e2e8f0);
                border-radius: 8px;
                margin: 20px 0;
                background-color: var(--card-bg, #f8fafc);
            ">
                <div style="font-size: 24px; margin-bottom: 10px; opacity: 0.5;">📝</div>
                ${Lang.get('noEntriesInCollection')}
            </div>
        `;
        } else {
            // Render each entry
            collection.entries.forEach(entry => {
                const entryCard = document.createElement('div');
                entryCard.className = 'entry-card';
                entryCard.dataset.entryId = entry.id;
                entryCard.style.cssText = `
                background-color: var(--card-bg);
                border-radius: 8px;
                border: 1px solid var(--card-border);
                padding: 16px;
                margin-bottom: 16px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                width: 100%;
                box-sizing: border-box;
                cursor: pointer;
            `;

                // Keep preview faithful to authored text (preserve manual newlines)
                const truncatedContent = entry.content.substring(0, 200);
                const previewContent = this.escapeHtml(truncatedContent).replace(/\n/g, '<br>');

                entryCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h4 style="color: var(--card-title); margin: 0 0 10px 0;">${entry.title}</h4>
                </div>
                <div class="entry-content" style="color: var(--card-text);">
                    ${previewContent}${entry.content.length > 200 ? '...' : ''}
                </div>
                <div class="entry-meta" style="color: var(--card-meta); margin-top: 10px; font-size: 12px;">
                    <div class="entry-date">Created: ${new Date(entry.created).toLocaleDateString()}</div>
                </div>
            `;

                // Add click handler to show full entry
                entryCard.addEventListener('click', () => {
                    this.viewEntry(collection.id, entry.id, container);
                });

                entriesContainer.appendChild(entryCard);
            });
        }

        document.body.appendChild(container);
    }
    showAddEntryForm(collectionId, parentContainer) {
        // Create the form container
        const formOverlay = document.createElement('div');
        formOverlay.className = 'entry-form-overlay';
        formOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1100;
        `;

        const formContainer = document.createElement('div');
        formContainer.className = 'entry-form';
        formContainer.style.cssText = `
            background-color: var(--bg-color, #fff);
            padding: 20px;
            border-radius: 8px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        `;

        formContainer.innerHTML = `
            <h3 style="margin-top: 0;">${Lang.get('addNewKnowledgeEntry')}</h3>
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold;">${Lang.get('entryTitle')}</label>
                <input type="text" id="entry-title" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color, #ddd); font-size: 16px; line-height: 1.6;">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold;">${Lang.get('content')}</label>
                <textarea id="entry-content" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color, #ddd); min-height: 300px; font-family: inherit; font-size: 16px; line-height: 1.6;"></textarea>
                <div style="font-size: 12px; margin-top: 4px; color: var(--text-muted, #666);">${Lang.get('markdownFormattingNote')}</div>
            </div>
            <!-- Add embedding status indicator -->
            <div id="entry-embedding-status" class="entry-embedding-status" style="font-size: 13px; margin-top: 8px; padding: 5px 0; display: none;"></div>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px;">
                <button id="cancel-entry" style="padding: 8px 16px; border: 1px solid var(--border-color, #ddd); background: transparent; border-radius: 4px;">${Lang.get('cancelButton')}</button>
                <button id="save-entry" style="padding: 8px 16px; background: var(--accent-color, #4f46e5); color: white; border: none; border-radius: 4px;">${Lang.get('saveEntry')}</button>
            </div>
        `;

        formOverlay.appendChild(formContainer);
        parentContainer.appendChild(formOverlay);

        // Set up event listeners
        document.getElementById('cancel-entry').addEventListener('click', () => {
            parentContainer.removeChild(formOverlay);
        });

        document.getElementById('save-entry').addEventListener('click', async () => {
            const title = document.getElementById('entry-title').value.trim();
            const content = document.getElementById('entry-content').value;

            if (!title) {
                alert(Lang.get('pleaseEnterTitle'));
                return;
            }

            if (!content.trim()) {
                alert(Lang.get('pleaseEnterContent'));
                return;
            }

            try {
                // Show loading state
                const saveBtn = document.getElementById('save-entry');
                saveBtn.textContent = Lang.get('saveEntry');
                saveBtn.disabled = true;

                // Show embedding generation status
                const statusEl = document.getElementById('entry-embedding-status');
                statusEl.innerHTML = `<span class="processing" style="color: var(--text-muted);">⏳ ${Lang.get('generatingEmbeddings')}</span>`;
                statusEl.style.display = 'block';

                // Create entry data
                const entryData = {
                    title: title,
                    content: content,
                    source: { type: 'manual', addedAt: new Date().toISOString() }
                };

                // Add to the collection
                await this.addEntry(collectionId, entryData);

                // Update embedding status before closing
                statusEl.innerHTML = `<span style="color: green;">✓ ${Lang.get('entrySavedSuccessfully')}</span>`;

                // Close after brief delay to show success
                setTimeout(() => {
                    parentContainer.removeChild(formOverlay);
                    this.refreshEntriesList(collectionId, document.getElementById(`collection-entries-${collectionId}`));
                }, 1000);

            } catch (error) {
                console.error('Error adding entry:', error);

                // Show error in status
                const statusEl = document.getElementById('entry-embedding-status');
                statusEl.innerHTML = `<span style="color: red;">❌ ${Lang.get('error')}: ${error.message}</span>`;
                statusEl.style.display = 'block';

                // Reset button state
                const saveBtn = document.getElementById('save-entry');
                saveBtn.textContent = Lang.get('saving');
                saveBtn.disabled = false;
            }
        });
    }
    async addEntry(collectionId, entryData) {
       //console.log('Knowledge Base: Adding entry to collection', collectionId);

        try {
            // Find the collection by ID
            const collection = this.collections.find(c => c.id === collectionId);
            if (!collection) {
                throw new Error('Collection not found');
            }

            // Create a unique ID for the entry
            const entryId = 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

            // Create the entry object with metadata - SIMPLIFIED without embeddings
            const entry = {
                id: entryId,
                title: entryData.title,
                content: entryData.content,
                source: entryData.source || { type: 'manual' },
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };

           //console.log('Knowledge Base: Creating text-only entry:', {
               // title: entry.title
           // });

            // Initialize entries array if it doesn't exist
            if (!collection.entries) {
                collection.entries = [];
            }

            // Add the entry to the collection
            collection.entries.push(entry);
            collection.updated = new Date().toISOString();

            // Save the updated collection to the database
            await PaiperworkDB.updateKnowledgeCollection(this.hashedMasterKey, collection);

            this.renderAllCollections();

           //console.log('Knowledge Base: Entry added successfully');
            return entryId;
        } catch (error) {
            console.error('Knowledge Base: Error adding entry:', error);
            throw error;
        }
    }
    viewEntry(collectionId, entryId, parentContainer) {
        // Find the collection and entry
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) return;

        const entry = collection.entries.find(e => e.id === entryId);
        if (!entry) return;

        // Create the entry view overlay
        const entryOverlay = document.createElement('div');
        entryOverlay.className = 'entry-view-overlay';

        // FIX: Change from position:absolute to position:fixed to make it independent of parent scrolling
        entryOverlay.style.cssText = `
        position: fixed; 
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--bg-color, #fff);
        z-index: 1000;
        padding: 20px;
        overflow-y: auto; /* Keep this to allow scrolling within the entry */
        box-sizing: border-box;
    `;

        // FIX: Add a higher z-index to ensure it appears on top of everything
        entryOverlay.style.zIndex = '2000';

        // FIX: Prevent body scrolling when entry is open
        document.body.style.overflow = 'hidden';

        // Header with back button
        const header = document.createElement('div');
        header.style.cssText = `
        position: sticky;
        top: 0;
        background-color: var(--bg-color, #fff);
        z-index: 1100;
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border-color, #eee);
    `;

        const backBtn = document.createElement('button');
        backBtn.textContent = Lang.get('backToEntries');
        backBtn.className = 'kb-btn';
        backBtn.style.cssText = `
        cursor: pointer;
        padding: 8px 16px;
        text-align: center;
        min-width: 150px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    `;

        const titleEl = document.createElement('h2');
        titleEl.textContent = entry.title;
        titleEl.style.cssText = `
        margin: 0 0 0 20px;
        flex-grow: 1;
    `;

        // Add entry action buttons
        const actionBtnsContainer = document.createElement('div');
        actionBtnsContainer.style.cssText = `
        display: flex;
        gap: 10px;
        margin-left: auto;
    `;

        const editBtn = document.createElement('button');
        editBtn.textContent = Lang.get('editEntry');
        editBtn.className = 'kb-btn';
        editBtn.style.cssText = `
        cursor: pointer;
        padding: 8px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        background-color: var(--button-bg, #ececec);
        color: var(--button-text, #404040);
        border: 1px solid var(--border-color, #ddd);
        border-radius: 4px;
        min-width: 100px;
        height: 36px;
    `;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = Lang.get('deleteEntry');
        deleteBtn.className = 'kb-btn';
        deleteBtn.style.cssText = `
        cursor: pointer;
        padding: 8px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        background-color: var(--danger-color, #dc3545);
        color: white;
        border: none;
        border-radius: 4px;
        min-width: 100px;
        height: 36px;
    `;

        backBtn.addEventListener('click', () => {
            document.body.style.overflow = ''; // Restore body scrolling
            document.body.removeChild(entryOverlay);
        });
        editBtn.addEventListener('click', () => {
            this.editEntry(collectionId, entryId, parentContainer);
        });

        deleteBtn.addEventListener('click', () => {
            this.deleteEntry(collectionId, entryId, parentContainer);
        });

        // Assemble the header
        actionBtnsContainer.appendChild(editBtn);
        actionBtnsContainer.appendChild(deleteBtn);
        header.appendChild(backBtn);
        header.appendChild(titleEl);
        header.appendChild(actionBtnsContainer);
        entryOverlay.appendChild(header);

        // Entry content
        const contentEl = document.createElement('div');
        contentEl.className = 'entry-full-content';
        contentEl.style.cssText = `
        white-space: pre-wrap;
        line-height: 1.6;
        color: var(--text-color);
        font-size: 16px;
        max-width: 100%;
        overflow-wrap: break-word;
    `;

        // Preserve original user text exactly to avoid markdown conversion adding
        // extra visual spacing for numbered lists and paragraphs.
        contentEl.textContent = entry.content || '';

        entryOverlay.appendChild(contentEl);
        // Add styling for markdown content
        const markdownStyles = document.createElement('style');
        markdownStyles.textContent = `
    .entry-full-content h1, .entry-full-content h2, .entry-full-content h3, .entry-full-content h4 {
        margin-top: 1.5em;
        margin-bottom: 0.75em;
        color: var(--heading-color, inherit);
    }
    .entry-full-content h1 { font-size: 1.8em; }
    .entry-full-content h2 { font-size: 1.5em; }
    .entry-full-content h3 { font-size: 1.3em; }
    .entry-full-content h4 { font-size: 1.1em; }
    
    .entry-full-content p {
        margin-bottom: 1em;
        line-height: 1.6;
    }
    
    .entry-full-content ul, .entry-full-content ol {
        padding-left: 2em;
        margin-bottom: 1em;
    }
    
    .entry-full-content li {
        margin-bottom: 0.5em;
    }
    
    .entry-full-content code {
        background-color: var(--code-bg, rgba(0, 0, 0, 0.05));
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: monospace;
        font-size: 0.9em;
    }
    
    .entry-full-content .code-block {
        margin: 1em 0;
        border-radius: 6px;
        overflow: hidden;
        background-color: var(--code-block-bg, rgba(0, 0, 0, 0.03));
        border: 1px solid var(--border-color, #e2e8f0);
    }
    
    .entry-full-content .code-header {
        padding: 0.5em 1em;
        background-color: var(--code-header-bg, rgba(0, 0, 0, 0.05));
        border-bottom: 1px solid var(--border-color, #e2e8f0);
        font-family: monospace;
        font-size: 0.8em;
        color: var(--code-header-color, rgba(0, 0, 0, 0.7));
    }
    
    .entry-full-content pre {
        margin: 0;
        padding: 1em;
        overflow-x: auto;
    }
    
    .entry-full-content pre code {
        background-color: transparent;
        padding: 0;
        border-radius: 0;
        font-size: 0.9em;
        white-space: pre;
    }
    
    .entry-full-content a {
        color: var(--link-color, #3b82f6);
        text-decoration: underline;
    }
    
    .entry-full-content sup {
        color: var(--accent-color, #4f46e5);
    }
`;

        entryOverlay.appendChild(markdownStyles);
        // Metadata section
        const metaEl = document.createElement('div');
        metaEl.className = 'entry-metadata';
        metaEl.style.cssText = `
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color, #e2e8f0);
        color: var(--text-muted, #64748b);
        font-size: 14px;
    `;

        metaEl.innerHTML = `
        <div><strong>Created:</strong> ${new Date(entry.created).toLocaleString()}</div>
        ${entry.updated ? `<div><strong>Last updated:</strong> ${new Date(entry.updated).toLocaleString()}</div>` : ''}
        <div><strong>Source:</strong> ${entry.source?.type || 'Unknown'}</div>
    `;

        document.body.appendChild(entryOverlay);

        // FIX: Ensure focus is set to the overlay for keyboard navigation
        setTimeout(() => entryOverlay.focus(), 10);
    }
    editEntry(collectionId, entryId, parentContainer) {
        // Find the collection and entry
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) return;

        const entry = collection.entries.find(e => e.id === entryId);
        if (!entry) return;

        // CLOSE the fullscreen entry view first
        const entryViewOverlay = document.querySelector('.entry-view-overlay');
        if (entryViewOverlay) {
            // Restore body scrolling
            document.body.style.overflow = '';
            document.body.removeChild(entryViewOverlay);
        }

        // Create the form container with FIXED positioning
        const formOverlay = document.createElement('div');
        formOverlay.className = 'entry-form-overlay';
        formOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2100;
    `;

        const formContainer = document.createElement('div');
        formContainer.className = 'entry-form';
        formContainer.style.cssText = `
        background-color: var(--bg-color, #fff);
        padding: 20px;
        border-radius: 8px;
        width: 94%;
        max-width: 980px;
        max-height: 94vh;
        overflow-y: auto;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    `;

        formContainer.innerHTML = `
        <h3 style="margin-top: 0;">${Lang.get('editKnowledgeEntry')}</h3>
        <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: bold;">${Lang.get('entryTitle')}</label>
            <input type="text" id="entry-title" value="${entry.title.replace(/"/g, '&quot;')}" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color, #ddd); font-size: 16px; line-height: 1.6;">
        </div>
        <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: bold;">Content</label>
            <textarea id="entry-content" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--border-color, #ddd); min-height: 420px; font-family: inherit; font-size: 16px; line-height: 1.6;">${entry.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
            <div style="font-size: 12px; margin-top: 4px; color: var(--text-muted, #666);">${Lang.get('markdownFormattingNote')}</div>
        </div>
        <div id="entry-embedding-status" class="entry-embedding-status" style="font-size: 13px; margin-top: 8px; padding: 5px 0; display: none;"></div>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="cancel-entry" style="padding: 8px 16px; border: 1px solid var(--border-color, #ddd); background: transparent; border-radius: 4px;">${Lang.get('cancelButton')}</button>
            <button id="save-entry" style="padding: 8px 16px; background: var(--accent-color, #4f46e5); color: white; border: none; border-radius: 4px;">${Lang.get('saveChanges')}</button>
        </div>
    `;

        formOverlay.appendChild(formContainer);
        // Append to document.body instead of parentContainer
        document.body.appendChild(formOverlay);

        // Set up event listeners
        document.getElementById('cancel-entry').addEventListener('click', () => {
            document.body.removeChild(formOverlay);
            // REOPEN the entry view after canceling
            this.viewEntry(collectionId, entryId, parentContainer);
        });

        document.getElementById('save-entry').addEventListener('click', async () => {
            const title = document.getElementById('entry-title').value.trim();
            const content = document.getElementById('entry-content').value;

            if (!title) {
                alert(Lang.get('pleaseEnterTitle'));
                return;
            }

            if (!content.trim()) {
                alert(Lang.get('pleaseEnterContent'));
                return;
            }

            try {
                // Show loading state
                const saveBtn = document.getElementById('save-entry');
                saveBtn.textContent = Lang.get('saving');
                saveBtn.disabled = true;

                // Update entry data
                entry.title = title;
                entry.content = content;
                entry.updated = new Date().toISOString();

                // Save to database
                await PaiperworkDB.updateKnowledgeCollection(this.hashedMasterKey, collection);

                // Close form overlay
                document.body.removeChild(formOverlay);

                // REOPEN the entry view with updated content
                this.viewEntry(collectionId, entryId, parentContainer);

                // Optional: Refresh the entries list in the background
                const entriesContainer = document.getElementById(`collection-entries-${collectionId}`);
                if (entriesContainer) {
                    this.refreshEntriesList(collectionId, entriesContainer);
                }

            } catch (error) {
                console.error('Error updating entry:', error);
                alert(Lang.get('failedToUpdateEntry') + ': ' + error.message);

                // Reset button state
                const saveBtn = document.getElementById('save-entry');
                saveBtn.textContent = Lang.get('saveChanges');
                saveBtn.disabled = false;
            }
        });
    }

    deleteEntry(collectionId, entryId, parentContainer) {
        // Find the collection and entry
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) return;

        const entryIndex = collection.entries.findIndex(e => e.id === entryId);
        if (entryIndex === -1) return;

        const entry = collection.entries[entryIndex];

        // Confirm deletion
        if (!confirm(Lang.get('confirmDeleteEntry', { title: entry.title }))) {
            return;
        }

        // Remove the entry
        collection.entries.splice(entryIndex, 1);
        collection.updated = new Date().toISOString();

        // Save changes to database
        PaiperworkDB.updateKnowledgeCollection(this.hashedMasterKey, collection)
            .then(() => {
                // Close the fullscreen entry view
                const entryViewOverlay = document.querySelector('.entry-view-overlay');
                if (entryViewOverlay) {
                    // Restore body scrolling
                    document.body.style.overflow = '';
                    document.body.removeChild(entryViewOverlay);
                }

                // Navigate back to the collection view and refresh the entries list
                this.viewCollection(collectionId);
            })
            .catch(error => {
                console.error('Error deleting entry:', error);
                alert(Lang.get('failedToDeleteEntry') + ': ' + error.message);
            });
    }
    refreshEntriesList(collectionId, entriesContainer) {
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection || !entriesContainer) return;

        // Clear container
        entriesContainer.innerHTML = '';

        if (!collection.entries || collection.entries.length === 0) {
            entriesContainer.innerHTML = `
            <div class="empty-state" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                height: 200px;
                padding: 40px 20px;
                color: var(--text-muted, #64748b);
                font-size: 16px;
                border: 1px dashed var(--border-color, #e2e8f0);
                border-radius: 8px;
                margin: 20px 0;
                background-color: var(--card-bg, #f8fafc);
            ">
                <div style="font-size: 24px; margin-bottom: 10px; opacity: 0.5;">📝</div>
                ${Lang.get('noEntriesInCollection')}
            </div>
        `;
            return;
        }

        // Render each entry with plain-text previews to avoid injected blank lines
        collection.entries.forEach(entry => {
            const entryCard = document.createElement('div');
            entryCard.className = 'entry-card';
            entryCard.dataset.entryId = entry.id; // Add data attribute for easy reference
            entryCard.style.cssText = `
            background-color: var(--card-bg);
            border-radius: 8px;
            border: 1px solid var(--card-border);
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            width: 100%;
            box-sizing: border-box;
            cursor: pointer;
        `;

            // Keep preview faithful to authored text (preserve manual newlines)
            const truncatedContent = entry.content.substring(0, 200);
            const previewContent = this.escapeHtml(truncatedContent).replace(/\n/g, '<br>');

            entryCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="color: var(--card-title); margin: 0 0 10px 0;">${entry.title}</h4>
            </div>
            <div class="entry-content" style="color: var(--card-text);">
                ${previewContent}${entry.content.length > 200 ? '...' : ''}
            </div>
            <div class="entry-meta" style="color: var(--card-meta); margin-top: 10px; font-size: 12px;">
                <div class="entry-date">${Lang.get('created')}: ${new Date(entry.created).toLocaleDateString()}</div>
            </div>
        `;

            // Add click handler to show full entry
            entryCard.addEventListener('click', () => {
                this.viewEntry(collectionId, entry.id, entriesContainer.closest('.collection-view'));
            });

            entriesContainer.appendChild(entryCard);
        });
    }
    formatCollectionForExport(collection) {
        if (!collection || !collection.entries) {
            return Lang.get('noContentForExport');
        }

        let content = `# ${collection.name}\n\n`;

        // TEMPORARY: Add entries WITHOUT numbered titles to see what's in the content
        collection.entries.forEach((entry, index) => {
            // Clean the entry content to remove any existing titles or metadata
            let cleanContent = entry.content || '';

            // Remove any existing titles that match the entry title
            const titleVariations = [
                new RegExp(`^#\\s*${entry.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'gm'),
                new RegExp(`^##\\s*${entry.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'gm'),
                new RegExp(`^${entry.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'gm')
            ];

            titleVariations.forEach(regex => {
                cleanContent = cleanContent.replace(regex, '');
            });

            // Remove existing export timestamps and metadata
            cleanContent = cleanContent
                .replace(/^Exportado el:.*$/gm, '')
                .replace(/^Exported on:.*$/gm, '')
                .replace(/^\*Source from research:.*$/gm, '')
                .replace(/^Source from research:.*$/gm, '')
                .replace(/^-{3,}.*$/gm, '')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

            content += `${cleanContent}\n\n`;
        });

        return content;
    }
    editCollection(collectionId) {
       //console.log(`Knowledge Base: Editing collection ${collectionId}`);

        // Find the collection
        const collection = this.collections.find(c => c.id === collectionId);
        if (!collection) {
            alert(Lang.get('collectionNotFound'));
            return;
        }

        // Prompt for new name
        const newName = prompt(Lang.get('enterNewCollectionName'), collection.name);
        if (!newName || newName === collection.name) {
            return; // Cancelled or unchanged
        }

        // Update collection
        collection.name = newName;
        collection.updated = new Date().toISOString();

        // Save to database
        PaiperworkDB.updateKnowledgeCollection(this.hashedMasterKey, collection)
            .then(() => {
                this.renderAllCollections();
            })
            .catch(error => {
                console.error('Error updating collection:', error);
                alert(Lang.get('failedToUpdateCollection') + ': ' + error.message);
            });
    }

    deleteCollection(collectionId) {
       //console.log(`Knowledge Base: Deleting collection ${collectionId}`);

        // Find the collection
        const collectionIndex = this.collections.findIndex(c => c.id === collectionId);
        if (collectionIndex === -1) {
            alert(Lang.get('collectionNotFound'));
            return;
        }

        // Confirm deletion
        const collection = this.collections[collectionIndex];
        const entryCount = collection.entries ? collection.entries.length : 0;

        if (!confirm(Lang.get('confirmDeleteCollection', { name: collection.name, count: entryCount }))) {
            return; // Cancelled
        }

        // Delete from database first
        PaiperworkDB.deleteKnowledgeCollection(this.hashedMasterKey, collectionId)
            .then(() => {
                // Remove from local array if DB delete was successful
                this.collections.splice(collectionIndex, 1);
                this.renderAllCollections();
            })
            .catch(error => {
                console.error('Error deleting collection:', error);
                alert(Lang.get('failedToDeleteCollection') + ': ' + error.message);
            });
    }
    getSelectedModel() {
        const mainModelSelector = document.getElementById('model-selector');
        return mainModelSelector?.value || null;
    }

    createAbortController() {
        if (this.abortController) {
            // Cancel any ongoing operations
            this.abortController.abort();
        }
        this.abortController = new AbortController();
        return this.abortController;
    }

    // Add this new method to show notifications
    showNotification(message, type = 'warning', duration = 6000) {
        const notificationContainer = document.getElementById('app-notifications') ||
            (() => {
                // Create container if it doesn't exist
                const container = document.createElement('div');
                container.id = 'app-notifications';
                container.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column-reverse;
                    gap: 10px;
                    max-width: 350px;
                `;
                document.body.appendChild(container);
                return container;
            })();

                const notification = document.createElement('div');
                notification.className = `notification ${type}`;
                notification.style.cssText = `
                    padding: 12px 16px;
                    border-radius: 8px;
                    background-color: ${type === 'warning' ? 'var(--warning-bg, #fff3cd)' : 'var(--info-bg, #d1ecf1)'};
                    color: ${type === 'warning' ? 'var(--warning-text, #856404)' : 'var(--info-text, #0c5460)'};
                    border-left: 4px solid ${type === 'warning' ? 'var(--warning-border, #ffeeba)' : 'var(--info-border, #bee5eb)'};
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                    margin-bottom: 8px;
                    animation: slide-in 0.3s ease-out;
                    font-size: 14px;
                    max-width: 100%;
                `;
        
                notification.innerHTML = `
                    <div style="display: flex; align-items: flex-start; justify-content: space-between;">
                        <div style="margin-right: 8px;">
                            <strong>${type === 'warning' ? Lang.get('warning') : Lang.get('info')}</strong> ${message}
                        </div>
                        <button style="background: none; border: none; cursor: pointer; font-size: 18px; line-height: 1; padding: 0; color: inherit;">×</button>
                    </div>
                `;

        // Add close button functionality
        notification.querySelector('button').addEventListener('click', () => {
            notification.remove();
        });

        // Auto-remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, duration);

        // Add to container
        notificationContainer.appendChild(notification);

        return notification;
    }
}


window.Research = {
    KnowledgeBase: KnowledgeBase,
    ResearchAutomation: ResearchAutomation,
};

// Set the loaded flag
window.ResearchLoaded = true;

//console.log("Research module loaded");