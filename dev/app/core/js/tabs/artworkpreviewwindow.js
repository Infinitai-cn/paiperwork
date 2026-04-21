class ArtworkPreviewWindow {
    constructor(generatedCode, title = 'Generated Design', backgroundImage = null, options = null) {
       //console.log('ArtworkPreviewWindow: Constructor called with:');
       //console.log('- Title:', title);
       //console.log('- Code preview:', generatedCode ? generatedCode.substring(0, 200) + '...' : 'No code');
       //console.log('- Background image:', backgroundImage ? 'Present' : 'None');

        this.generatedCode = generatedCode;
        this.title = title;
        this.isVisible = false;
        this.currentView = 'code'; // 'code' or 'preview'
        this.container = null;
        this.codeEditor = null;
        this.previewFrame = null;
        this.previewFrameShell = null;
        this.previewDirty = true;
        this.previewInitialized = false;
        this.backgroundImage = backgroundImage; // Store the background image
        this.exportBackgroundImage = typeof options?.exportBackgroundImage === 'string' ? options.exportBackgroundImage : backgroundImage;
        this.previewMode = typeof options?.previewMode === 'string' ? options.previewMode : null;
        this.sourceImageWidth = Number(options?.sourceImageWidth) || 0;
        this.sourceImageHeight = Number(options?.sourceImageHeight) || 0;
        this.isTextOverlayPreview = this.previewMode === 'overlay' || (!this.previewMode && title.includes('Text Overlay'));
        this.shouldStartMaximized = this.isTextOverlayPreview;
        this.textOverlayFrameBounds = null;
        this.textOverlayLayoutScheduled = false;
        this.didAutoSizeTextOverlayWindow = false;
        this.textOverlayAutoSizeArea = 0;
        this.textOverlayPreviewReady = false;
        this.textOverlayPreviewStabilizationToken = 0;
        this.textOverlayStabilizationAttempts = 0;
        this.maxTextOverlayStabilizationAttempts = 6;
        this.textOverlayCodeSyncTimer = null;
        this.htmlPreviewLayoutScheduled = false;
        this.htmlPreviewAutoSizeArea = 0;
        this.htmlPreviewReady = false;
        this.htmlPreviewGutterRemoved = false;
        this.htmlPreviewStabilizationToken = 0;
        this.exportAssetCache = new Map();
        this.position = {
            x: 0,
            y: 0,
            isDragging: false,
            startX: 0,
            startY: 0
        };

        // FIXED: Improve markdown detection - only true rationale content should be treated as markdown
        this.isMarkdown = (this.previewMode === 'rationale' || (!this.previewMode && title.includes('Rationale'))) && !this.containsHTMLCode(generatedCode);
       //console.log('ArtworkPreviewWindow: Is markdown content:', this.isMarkdown);

        // Set up event listener for preview window close
        document.addEventListener('artworkPreviewClosed', async (event) => {
            // Find ArtworksTab instance and restore prompt if possible
            if (window.artworksTab && typeof window.artworksTab.restoreSystemPrompt === 'function') {
                await window.artworksTab.restoreSystemPrompt();
            }
        });

        // Ensure CodeStyler syntax styles are added if available
        if (window.CodeStyler && typeof window.CodeStyler.addSyntaxStyles === 'function') {
            window.CodeStyler.addSyntaxStyles();
        }

        // Create window content
        this.createWindow();

        // Set up theme listener
        this.setupThemeListener();

        // FIXED: Always use setCode for HTML content, even if it comes with markdown blocks
        if (this.isMarkdown) {
           //console.log('ArtworkPreviewWindow: Processing as true markdown content (rationale)');
            // For design rationales, set content and switch to preview
            if (this.codeEditor) {
                this.codeEditor.textContent = this.generatedCode;
                this.switchView('preview'); // Show formatted preview by default
            }
        } else {
           //console.log('ArtworkPreviewWindow: Processing as code content');
            // For HTML/code content, use code processing
            this.setCode(this.generatedCode);
            this.switchView('preview');
        }

        this.show();
    }

    // Method to detect HTML code vs pure markdown
    containsHTMLCode(content) {
        if (!content || typeof content !== 'string') return false;

        // Check for HTML indicators
        const htmlIndicators = [
            /<!DOCTYPE/i,
            /<html/i,
            /<head>/i,
            /<body>/i,
            /<style>/i,
            /<script>/i,
            /```html/i,
            /```css/i,
            /```javascript/i
        ];

        return htmlIndicators.some(pattern => pattern.test(content));
    }

    // Creates the preview window DOM structure and sets up initial state
    createWindow() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = `artwork-preview-window${this.shouldStartMaximized ? ' maximized' : ''}${this.isTextOverlayPreview ? ' text-overlay-preview' : ''}`;

        // Determine button text based on content type
        const copyButtonText = (this.isMarkdown || this.title.includes('Rationale'))
            ? Lang.get('artworkCopyText')
            : Lang.get('artworkCopyCode');

        this.container.innerHTML = `
        <div class="preview-window-header">
            <div class="preview-window-title">${this.title}</div>
            <div class="preview-window-controls">
                <button class="preview-window-maximize-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="8" y1="3" x2="8" y2="21"></line>
                        <line x1="16" y1="3" x2="16" y2="21"></line>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                    </svg>
                </button>
                <button class="preview-window-close-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
        <div class="preview-window-view-controls">
            <button class="preview-view-btn code " data-view="code">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
                ${Lang.get('artworkCode')}
            </button>
            <button class="preview-view-btn preview active" data-view="preview">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                 ${Lang.get('artworkPreview')}
            </button>
        </div>
        <div class="preview-window-content">
            <div class="preview-code-view active">
                <div class="code-editor" contenteditable="true"></div>
            </div>
            <div class="preview-preview-view">
               <div class="preview-loading-state" aria-live="polite">Assets loading, please wait...</div>
               <div class="preview-iframe-shell">
                   <iframe class="preview-iframe" sandbox="allow-scripts allow-same-origin allow-modals"></iframe>
               </div>
            </div>
        </div>
        <div class="preview-window-footer">
            <button class="copy-code-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                ${copyButtonText}
            </button>
            <button class="export-png-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <polyline points="8 12 12 16 16 12"></polyline>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                </svg>
                 ${Lang.get('artworkExportPNG')}
            </button>
            <button class="close-preview-btn">${Lang.get('artworkClose')}</button>
        </div>
    `;

        // Store the default (maximized) dimensions for the toggle function
        this.container.dataset.prevWidth = '80vw';  // Fallback size when un-maximized
        this.container.dataset.prevHeight = '80vh';
        this.container.dataset.prevLeft = '10vw';   // Centered when un-maximized
        this.container.dataset.prevTop = '10vh';

        if (this.shouldStartMaximized) {
            this.container.style.width = '100vw';
            this.container.style.height = '100vh';
            this.container.style.left = '0';
            this.container.style.top = '0';
        } else {
            this.container.style.width = this.container.dataset.prevWidth;
            this.container.style.height = this.container.dataset.prevHeight;
            this.container.style.left = this.container.dataset.prevLeft;
            this.container.style.top = this.container.dataset.prevTop;
        }

        // Append to body
        document.body.appendChild(this.container);

        // Cache DOM elements
        this.codeEditor = this.container.querySelector('.code-editor');
        this.previewFrameShell = this.container.querySelector('.preview-iframe-shell');
        this.previewFrame = this.container.querySelector('.preview-iframe');

        // Setup event listeners
        this.setupEventListeners();
    }

    scheduleTextOverlayPreviewLayout() {
        if (!this.isTextOverlayPreview || this.textOverlayLayoutScheduled || this.currentView !== 'preview') {
            return;
        }

        this.textOverlayLayoutScheduled = true;
        const stabilizationToken = ++this.textOverlayPreviewStabilizationToken;
        requestAnimationFrame(async () => {
            let shouldRetry = false;
            try {
                await this.waitForPreviewAssets();
                if (stabilizationToken !== this.textOverlayPreviewStabilizationToken || this.currentView !== 'preview') {
                    return;
                }

                this.syncTextOverlayPreviewLayout();
                const firstBounds = this.captureTextOverlayBoundsSnapshot();
                await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                await this.waitForPreviewAssets();
                if (stabilizationToken !== this.textOverlayPreviewStabilizationToken || this.currentView !== 'preview') {
                    return;
                }

                this.syncTextOverlayPreviewLayout();
                await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                if (stabilizationToken !== this.textOverlayPreviewStabilizationToken || this.currentView !== 'preview') {
                    return;
                }

                const secondBounds = this.captureTextOverlayBoundsSnapshot();
                const stability = this.evaluateTextOverlayPreviewStability(firstBounds, secondBounds);
                if (!stability.isSettled && this.textOverlayStabilizationAttempts < this.maxTextOverlayStabilizationAttempts) {
                    this.textOverlayStabilizationAttempts += 1;
                    shouldRetry = true;
                    return;
                }

                this.textOverlayStabilizationAttempts = 0;
                this.setTextOverlayPreviewReady(true);
            } finally {
                requestAnimationFrame(() => {
                    this.textOverlayLayoutScheduled = false;
                    if (shouldRetry && stabilizationToken === this.textOverlayPreviewStabilizationToken && this.currentView === 'preview') {
                        this.scheduleTextOverlayPreviewLayout();
                    }
                });
            }
        });
    }

    scheduleHtmlPreviewLayout() {
        if (this.isTextOverlayPreview || this.isMarkdown || this.htmlPreviewLayoutScheduled || this.currentView !== 'preview') {
            return;
        }

        this.htmlPreviewLayoutScheduled = true;
        const stabilizationToken = ++this.htmlPreviewStabilizationToken;
        requestAnimationFrame(async () => {
            try {
                await this.waitForPreviewAssets();
                if (stabilizationToken !== this.htmlPreviewStabilizationToken || this.currentView !== 'preview') {
                    return;
                }

                this.syncHtmlPreviewLayout();
                await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                await this.waitForPreviewAssets();
                if (stabilizationToken !== this.htmlPreviewStabilizationToken || this.currentView !== 'preview') {
                    return;
                }

                this.syncHtmlPreviewLayout();
                await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                if (stabilizationToken !== this.htmlPreviewStabilizationToken || this.currentView !== 'preview') {
                    return;
                }

                this.setGenericHtmlPreviewReady(true);
            } finally {
                requestAnimationFrame(() => {
                    this.htmlPreviewLayoutScheduled = false;
                });
            }
        });
    }

    setGenericHtmlPreviewReady(isReady) {
        if (this.isTextOverlayPreview || this.isMarkdown || !this.previewFrame) {
            return;
        }

        this.htmlPreviewReady = !!isReady;
        this.previewFrame.style.visibility = this.htmlPreviewReady ? 'visible' : 'hidden';
        this.previewFrame.style.opacity = this.htmlPreviewReady ? '1' : '0';
        const loadingState = this.container?.querySelector('.preview-loading-state');
        if (loadingState) {
            loadingState.classList.toggle('active', !this.htmlPreviewReady && this.currentView === 'preview');
        }
    }

    setTextOverlayPreviewReady(isReady) {
        if (!this.isTextOverlayPreview || !this.previewFrame) {
            return;
        }

        this.textOverlayPreviewReady = !!isReady;
        this.previewFrame.style.visibility = this.textOverlayPreviewReady ? 'visible' : 'hidden';
        this.previewFrame.style.opacity = this.textOverlayPreviewReady ? '1' : '0';
        const loadingState = this.container?.querySelector('.preview-loading-state');
        if (loadingState) {
            loadingState.textContent = 'Assets loading, please wait...';
            loadingState.classList.toggle('active', !this.textOverlayPreviewReady && this.currentView === 'preview');
        }
    }

    captureTextOverlayBoundsSnapshot() {
        const bounds = this.getSourceImageBounds() || this.getVisibleTextOverlayBounds() || this.textOverlayFrameBounds;
        if (!bounds) {
            return null;
        }

        return {
            left: Number(bounds.left) || 0,
            top: Number(bounds.top) || 0,
            width: Math.max(1, Number(bounds.width) || 0),
            height: Math.max(1, Number(bounds.height) || 0),
        };
    }

    evaluateTextOverlayPreviewStability(previousBounds, currentBounds) {
        const iframe = this.previewFrame;
        const iframeWindow = iframe ? iframe.contentWindow : null;
        const iframeDoc = iframe ? (iframe.contentDocument || iframeWindow?.document) : null;
        const docElement = iframeDoc?.documentElement;
        const body = iframeDoc?.body;
        const contentWidth = Math.max(
            docElement?.scrollWidth || 0,
            docElement?.offsetWidth || 0,
            docElement?.clientWidth || 0,
            body?.scrollWidth || 0,
            body?.offsetWidth || 0,
            body?.clientWidth || 0,
        );
        const referenceWidth = Math.max(
            currentBounds?.width || 0,
            this.sourceImageWidth || 0,
            this.textOverlayFrameBounds?.width || 0,
            docElement?.clientWidth || 0,
            body?.clientWidth || 0,
        );
        const gutterWidth = Math.max(0, Math.round(contentWidth - referenceWidth));
        const gutterRemoved = gutterWidth <= 2;
        const boundsStable = !!currentBounds && !!previousBounds
            ? Math.abs(currentBounds.width - previousBounds.width) <= 1
                && Math.abs(currentBounds.height - previousBounds.height) <= 1
                && Math.abs(currentBounds.left - previousBounds.left) <= 2
                && Math.abs(currentBounds.top - previousBounds.top) <= 2
            : !!currentBounds;

        return {
            boundsStable,
            gutterRemoved,
            gutterWidth,
            contentWidth,
            referenceWidth,
            isSettled: boundsStable && gutterRemoved,
        };
    }

    evaluateGenericHtmlPreviewGutter(bounds = null) {
        const iframe = this.previewFrame;
        const iframeWindow = iframe ? iframe.contentWindow : null;
        const iframeDoc = iframe ? (iframe.contentDocument || iframeWindow?.document) : null;
        if (!iframeDoc) {
            return {
                gutterRemoved: false,
                gutterWidth: 0,
                viewportWidth: 0,
                contentWidth: 0,
            };
        }

        const docElement = iframeDoc.documentElement;
        const body = iframeDoc.body;
        const measuredBounds = bounds || this.getRenderedHtmlDocumentBounds();
        const viewportWidth = Math.max(
            iframe?.clientWidth || 0,
            iframeWindow?.innerWidth || 0,
            docElement?.clientWidth || 0,
            body?.clientWidth || 0,
        );
        const contentWidth = Math.max(
            measuredBounds?.contentWidth || 0,
            docElement?.scrollWidth || 0,
            body?.scrollWidth || 0,
        );
        const gutterWidth = Math.max(0, Math.round(contentWidth - viewportWidth));
        const gutterRemoved = gutterWidth <= 2;

        this.htmlPreviewGutterRemoved = gutterRemoved;
        /*console.info('ArtworkPreviewWindow[html]: gutter stability check', {
            gutterRemoved,
            gutterWidth,
            viewportWidth,
            contentWidth,
        });*/

        return {
            gutterRemoved,
            gutterWidth,
            viewportWidth,
            contentWidth,
        };
    }

    getRenderedHtmlDocumentBounds() {
        const iframe = this.previewFrame;
        const iframeWindow = iframe ? iframe.contentWindow : null;
        const iframeDoc = iframe ? (iframe.contentDocument || iframeWindow?.document) : null;
        if (!iframeDoc) {
            return null;
        }

        const docElement = iframeDoc.documentElement;
        const body = iframeDoc.body;
        if (!docElement || !body) {
            return null;
        }

        const contentWidth = Math.max(
            docElement.scrollWidth || 0,
            docElement.offsetWidth || 0,
            docElement.clientWidth || 0,
            body.scrollWidth || 0,
            body.offsetWidth || 0,
            body.clientWidth || 0,
        );
        const contentHeight = Math.max(
            docElement.scrollHeight || 0,
            docElement.offsetHeight || 0,
            docElement.clientHeight || 0,
            body.scrollHeight || 0,
            body.offsetHeight || 0,
            body.clientHeight || 0,
        );

        const viewportWidth = Math.max(
            iframe?.clientWidth || 0,
            iframeWindow?.innerWidth || 0,
            docElement.clientWidth || 0,
            body.clientWidth || 0,
        );
        const viewportHeight = Math.max(
            iframe?.clientHeight || 0,
            iframeWindow?.innerHeight || 0,
            docElement.clientHeight || 0,
            body.clientHeight || 0,
        );

        const width = Math.max(contentWidth, viewportWidth);
        const height = Math.max(contentHeight, viewportHeight);

        if (width <= 0 || height <= 0) {
            return null;
        }

        const semanticSectionCount = body.querySelectorAll('section, article').length;
        const semanticShellCount = body.querySelectorAll('header, nav, main, footer').length;
        const hasSemanticPageStructure = semanticSectionCount >= 2 || semanticShellCount >= 2;
        const childCount = body.children.length;
        const bodyStyle = iframeWindow?.getComputedStyle(body);
        const htmlStyle = iframeWindow?.getComputedStyle(docElement);
        const rootOverflowHidden = bodyStyle?.overflow === 'hidden'
            || htmlStyle?.overflow === 'hidden'
            || bodyStyle?.overflowY === 'hidden'
            || htmlStyle?.overflowY === 'hidden';
        const hasTallScrollableContent = contentHeight > Math.max(1200, viewportHeight + 600);
        const hasWideScrollableContent = contentWidth > Math.max(1200, viewportWidth + 240);
        const isSingleArtboardLike = childCount <= 2 && !hasSemanticPageStructure && rootOverflowHidden;
        const isScrollablePage = hasSemanticPageStructure
            || (hasTallScrollableContent && !isSingleArtboardLike)
            || (hasWideScrollableContent && semanticSectionCount >= 1);

        return {
            left: 0,
            top: 0,
            width,
            height,
            contentWidth,
            contentHeight,
            viewportWidth: Math.max(1, viewportWidth),
            viewportHeight: Math.max(1, viewportHeight),
            isScrollablePage,
            semanticSectionCount,
            semanticShellCount,
            rootOverflowHidden,
        };
    }

    autoSizeGenericHtmlPreviewWindow(bounds) {
        if (!bounds || !this.container) {
            return;
        }

        const measuredWidth = bounds.isScrollablePage ? bounds.viewportWidth : bounds.width;
        const measuredHeight = bounds.isScrollablePage ? bounds.viewportHeight : bounds.height;
        const boundsArea = Math.max(1, measuredWidth * measuredHeight);
        if (boundsArea <= this.htmlPreviewAutoSizeArea * 1.05) {
            return;
        }

        const previewArea = this.container.querySelector('.preview-window-content');
        if (!previewArea) {
            return;
        }

        const previewChromeHeight = this.container.offsetHeight - previewArea.clientHeight;
        const maxWindowWidth = Math.floor(window.innerWidth * 0.94);
        const maxWindowHeight = Math.floor(window.innerHeight * 0.94);
        const maxContentWidth = Math.max(420, maxWindowWidth - 24);
        const maxContentHeight = Math.max(280, maxWindowHeight - previewChromeHeight - 24);
        let finalWidth;
        let finalHeight;
        let scale = 1;

        if (bounds.isScrollablePage) {
            finalWidth = Math.max(420, Math.min(maxWindowWidth, Math.round(measuredWidth + 24)));
            finalHeight = Math.max(420, Math.min(maxWindowHeight, Math.round(measuredHeight + previewChromeHeight + 24)));
        } else {
            scale = Math.min(maxContentWidth / measuredWidth, maxContentHeight / measuredHeight, 1);
            finalWidth = Math.max(420, Math.round(measuredWidth * scale));
            finalHeight = Math.max(320, Math.round(measuredHeight * scale) + previewChromeHeight);
        }

        this.container.classList.remove('maximized');
        this.container.style.width = `${finalWidth}px`;
        this.container.style.height = `${finalHeight}px`;
        this.container.style.left = `${Math.max(16, Math.round((window.innerWidth - finalWidth) / 2))}px`;
        this.container.style.top = `${Math.max(16, Math.round((window.innerHeight - finalHeight) / 2))}px`;
        this.htmlPreviewAutoSizeArea = boundsArea;
        /*console.info('ArtworkPreviewWindow[html]: auto-sized window from returned document bounds', {
            bounds,
            finalWidth,
            finalHeight,
            scale,
            mode: bounds.isScrollablePage ? 'scrollable-page' : 'fixed-canvas',
        });*/
    }

    syncHtmlPreviewLayout() {
        if (this.isTextOverlayPreview || this.isMarkdown || !this.previewFrame || this.currentView !== 'preview') {
            return;
        }

        const bounds = this.getRenderedHtmlDocumentBounds();
        if (!bounds) {
            return;
        }

        this.autoSizeGenericHtmlPreviewWindow(bounds);

        const previewContainer = this.container.querySelector('.preview-preview-view');
        if (!previewContainer) {
            return;
        }

        const availableWidth = Math.max(1, previewContainer.clientWidth);
        const availableHeight = Math.max(1, previewContainer.clientHeight);
        let scale = 1;

        if (bounds.isScrollablePage) {
            this.previewFrame.style.width = '100%';
            this.previewFrame.style.height = '100%';
        } else {
            scale = Math.min(availableWidth / bounds.width, availableHeight / bounds.height, 1);
            this.previewFrame.style.width = `${Math.max(1, Math.round(bounds.width * scale))}px`;
            this.previewFrame.style.height = `${Math.max(1, Math.round(bounds.height * scale))}px`;
        }

        /*console.info('ArtworkPreviewWindow[html]: applied preview layout from returned document bounds', {
            bounds,
            availableWidth,
            availableHeight,
            scale,
            iframeWidth: this.previewFrame.style.width,
            iframeHeight: this.previewFrame.style.height,
            mode: bounds.isScrollablePage ? 'scrollable-page' : 'fixed-canvas',
        });*/
    }

    getTextOverlayCaptureCandidate() {
        const iframe = this.previewFrame;
        const iframeWindow = iframe ? iframe.contentWindow : null;
        const iframeDoc = iframe ? (iframe.contentDocument || iframeWindow?.document) : null;
        if (!iframeWindow || !iframeDoc || !iframeDoc.body) {
            //console.warn('ArtworkPreviewWindow[text-overlay]: missing iframe context while measuring bounds');
            return null;
        }

        const docElement = iframeDoc.documentElement;
        const body = iframeDoc.body;
        const docWidth = Math.max(docElement?.clientWidth || 0, iframeWindow.innerWidth || 0, body.clientWidth || 0);
        const docHeight = Math.max(docElement?.clientHeight || 0, iframeWindow.innerHeight || 0, body.clientHeight || 0);
        const docArea = Math.max(1, docWidth * docHeight);
        const sourceBounds = this.getSourceImageBounds();
        const sourceArea = sourceBounds ? Math.max(1, sourceBounds.width * sourceBounds.height) : 0;
        const sourceAspectRatio = sourceBounds ? sourceBounds.width / Math.max(1, sourceBounds.height) : 0;
        const candidates = [body, ...Array.from(body.querySelectorAll('*'))];
        let bestMatch = null;
        const debugCandidates = [];

        for (const element of candidates) {
            if (!(element instanceof iframeWindow.HTMLElement)) {
                continue;
            }

            const style = iframeWindow.getComputedStyle(element);
            if (!style || style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || '1') === 0) {
                continue;
            }

            const rect = element.getBoundingClientRect();
            if (!rect || rect.width < 40 || rect.height < 40) {
                continue;
            }

            const area = rect.width * rect.height;
            const elementAspectRatio = rect.width / Math.max(1, rect.height);
            const fillsViewport = area >= docArea * 0.96;
            const hasBackgroundImage = style.backgroundImage && style.backgroundImage !== 'none';
            const isMediaElement = ['IMG', 'SVG', 'CANVAS', 'VIDEO'].includes(element.tagName);
            const isPrimaryContainer = element.classList.contains('container')
                || element.classList.contains('artboard')
                || element.classList.contains('background-image')
                || element.id === 'container';
            const isLikelyArtboard = element.classList.contains('container')
                || element.classList.contains('artboard')
                || style.aspectRatio !== 'auto'
                || (style.overflow === 'hidden' && (style.position !== 'static' || element.childElementCount > 0));

            if (!isMediaElement && !hasBackgroundImage && !isLikelyArtboard) {
                continue;
            }

            if (fillsViewport && element !== body) {
                continue;
            }

            let sourceSimilarityScore = 0;
            if (sourceBounds) {
                const widthDelta = Math.abs(rect.width - sourceBounds.width);
                const heightDelta = Math.abs(rect.height - sourceBounds.height);
                const areaDeltaRatio = Math.abs(area - sourceArea) / sourceArea;
                const aspectRatioDelta = Math.abs(elementAspectRatio - sourceAspectRatio);
                const isNearSourceSize = widthDelta <= sourceBounds.width * 0.08 && heightDelta <= sourceBounds.height * 0.08;

                if (isNearSourceSize) {
                    sourceSimilarityScore += docArea * 2.25;
                }

                sourceSimilarityScore += Math.max(0, docArea * (1 - Math.min(areaDeltaRatio, 1)));
                sourceSimilarityScore += Math.max(0, docArea * 0.75 * (1 - Math.min(aspectRatioDelta, 1)));
            }

            const score = area
                + (hasBackgroundImage ? docArea : 0)
                + (isMediaElement ? docArea * 0.75 : 0)
                + (element.classList.contains('container') ? docArea * 0.5 : 0)
                + (isPrimaryContainer ? docArea * 0.75 : 0)
                + sourceSimilarityScore
                - (fillsViewport ? docArea * 0.5 : 0);

            debugCandidates.push({
                tag: element.tagName,
                className: element.className || '',
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                area: Math.round(area),
                sourceSimilarityScore: Math.round(sourceSimilarityScore),
                hasBackgroundImage,
                isMediaElement,
                isPrimaryContainer,
                isLikelyArtboard,
                fillsViewport,
                score: Math.round(score),
            });

            if (!bestMatch || score > bestMatch.score) {
                bestMatch = {
                    score,
                    element,
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                };
            }
        }

        if (!bestMatch) {
            /*console.warn('ArtworkPreviewWindow[text-overlay]: no suitable bounds candidate found', {
                docWidth,
                docHeight,
                candidateCount: debugCandidates.length,
            });*/
            return null;
        }

        debugCandidates.sort((left, right) => right.score - left.score);
        /*console.info('ArtworkPreviewWindow[text-overlay]: top bounds candidates', {
            docWidth,
            docHeight,
            bestMatch: {
                tag: bestMatch.element?.tagName || '',
                className: bestMatch.element?.className || '',
                left: Math.round(bestMatch.left),
                top: Math.round(bestMatch.top),
                width: Math.round(bestMatch.width),
                height: Math.round(bestMatch.height),
                score: Math.round(bestMatch.score),
            },
            topCandidates: debugCandidates.slice(0, 5),
        });*/

        return {
            element: bestMatch.element,
            left: Math.max(0, bestMatch.left),
            top: Math.max(0, bestMatch.top),
            width: Math.max(1, bestMatch.width),
            height: Math.max(1, bestMatch.height),
        };
    }

    getVisibleTextOverlayBounds() {
        const candidate = this.getTextOverlayCaptureCandidate();
        if (!candidate) {
            return null;
        }

        return {
            left: candidate.left,
            top: candidate.top,
            width: candidate.width,
            height: candidate.height,
        };
    }

    getSourceImageBounds() {
        if (!this.isTextOverlayPreview || this.sourceImageWidth <= 0 || this.sourceImageHeight <= 0) {
            return null;
        }

        return {
            left: 0,
            top: 0,
            width: this.sourceImageWidth,
            height: this.sourceImageHeight,
        };
    }

    normalizeTextOverlayDocument(frameDoc) {
        if (!this.isTextOverlayPreview || !frameDoc || this.sourceImageWidth <= 0 || this.sourceImageHeight <= 0) {
            return;
        }

        const html = frameDoc.documentElement;
        const body = frameDoc.body;
        if (!html || !body) {
            return;
        }

        const injectStyle = frameDoc.createElement('style');
        injectStyle.setAttribute('data-artwork-overlay-normalizer', 'true');
        injectStyle.textContent = `
html, body {
    width: ${this.sourceImageWidth}px !important;
    height: ${this.sourceImageHeight}px !important;
    min-width: ${this.sourceImageWidth}px !important;
    min-height: ${this.sourceImageHeight}px !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    background: #000 !important;
}
body {
    display: block !important;
    position: relative !important;
}
.page-wrapper {
    position: absolute !important;
    inset: 0 !important;
    width: ${this.sourceImageWidth}px !important;
    height: ${this.sourceImageHeight}px !important;
    min-height: ${this.sourceImageHeight}px !important;
    max-width: ${this.sourceImageWidth}px !important;
    max-height: ${this.sourceImageHeight}px !important;
    margin: 0 !important;
    padding: 0 !important;
    display: block !important;
    background: #000 !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
}
.container,
img.container,
[class*="container"] {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: auto !important;
    bottom: auto !important;
    width: ${this.sourceImageWidth}px !important;
    height: ${this.sourceImageHeight}px !important;
    max-width: ${this.sourceImageWidth}px !important;
    max-height: ${this.sourceImageHeight}px !important;
    min-width: ${this.sourceImageWidth}px !important;
    min-height: ${this.sourceImageHeight}px !important;
    margin: 0 !important;
    inset: 0 !important;
    box-sizing: border-box !important;
    aspect-ratio: auto !important;
    background-position: center center !important;
    background-repeat: no-repeat !important;
    background-size: 100% 100% !important;
    box-shadow: none !important;
    transform: none !important;
}
[data-artwork-editable-text="true"] {
    cursor: text !important;
}
[data-artwork-editable-text="true"]:focus {
    outline: 2px dashed rgba(255, 255, 255, 0.75) !important;
    outline-offset: 2px !important;
}
        `;
        frameDoc.head?.appendChild(injectStyle);

        html.style.width = `${this.sourceImageWidth}px`;
        html.style.height = `${this.sourceImageHeight}px`;
        html.style.margin = '0';
        html.style.padding = '0';
        html.style.overflow = 'hidden';
        body.style.width = `${this.sourceImageWidth}px`;
        body.style.height = `${this.sourceImageHeight}px`;
        body.style.margin = '0';
        body.style.padding = '0';
        body.style.overflow = 'hidden';

        const pageWrapper = body.querySelector('.page-wrapper');
        if (pageWrapper) {
            pageWrapper.style.position = 'absolute';
            pageWrapper.style.inset = '0';
            pageWrapper.style.width = `${this.sourceImageWidth}px`;
            pageWrapper.style.height = `${this.sourceImageHeight}px`;
            pageWrapper.style.minHeight = `${this.sourceImageHeight}px`;
            pageWrapper.style.maxWidth = `${this.sourceImageWidth}px`;
            pageWrapper.style.maxHeight = `${this.sourceImageHeight}px`;
            pageWrapper.style.padding = '0';
            pageWrapper.style.margin = '0';
            pageWrapper.style.display = 'block';
            pageWrapper.style.overflow = 'hidden';
        }

        const artboard = body.querySelector('.container, img.container, [class*="container"]');
        if (artboard) {
            artboard.style.position = 'absolute';
            artboard.style.top = '0';
            artboard.style.left = '0';
            artboard.style.width = `${this.sourceImageWidth}px`;
            artboard.style.height = `${this.sourceImageHeight}px`;
            artboard.style.maxWidth = `${this.sourceImageWidth}px`;
            artboard.style.maxHeight = `${this.sourceImageHeight}px`;
            artboard.style.minWidth = `${this.sourceImageWidth}px`;
            artboard.style.minHeight = `${this.sourceImageHeight}px`;
            artboard.style.margin = '0';
            artboard.style.boxShadow = 'none';
            artboard.style.transform = 'none';
        }

        /*console.info('ArtworkPreviewWindow[text-overlay]: normalized iframe document to source image size', {
            sourceImageWidth: this.sourceImageWidth,
            sourceImageHeight: this.sourceImageHeight,
            hasPageWrapper: !!pageWrapper,
            hasArtboard: !!artboard,
        });*/
    }

    getTextOverlayEditableElements(root) {
        const rootDoc = root?.nodeType === Node.DOCUMENT_NODE ? root : root?.ownerDocument;
        const scope = root?.body || root;
        if (!scope || !rootDoc) {
            return [];
        }

        const editableTags = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'DIV', 'A', 'LI', 'STRONG', 'EM', 'LABEL', 'B', 'I']);
        return Array.from(scope.querySelectorAll('*')).filter((element) => {
            const isHtmlElement = rootDoc.defaultView
                ? element instanceof rootDoc.defaultView.HTMLElement
                : element?.nodeType === Node.ELEMENT_NODE;
            if (!isHtmlElement) {
                return false;
            }

            if (!editableTags.has(element.tagName)) {
                return false;
            }

            if (element.closest('svg, script, style, noscript')) {
                return false;
            }

            const hasUnsupportedChildren = Array.from(element.children).some((child) => child.tagName !== 'BR');
            if (hasUnsupportedChildren) {
                return false;
            }

            const directText = Array.from(element.childNodes)
                .filter((node) => node.nodeType === Node.TEXT_NODE)
                .map((node) => node.textContent || '')
                .join('')
                .trim();

            return directText.length > 0;
        });
    }

    serializeSourceDocument(doc, originalSource) {
        if (!doc?.documentElement) {
            return originalSource;
        }

        const hasDoctype = /<!DOCTYPE/i.test(String(originalSource || ''));
        const html = doc.documentElement.outerHTML;
        return hasDoctype ? `<!DOCTYPE html>\n${html}` : html;
    }

    updateCodeEditorSource(code) {
        if (!this.codeEditor || typeof code !== 'string' || !code.trim()) {
            return;
        }

        this.generatedCode = code;
        this.codeEditor.textContent = code;
        if (window.CodeStyler) {
            this.codeEditor.innerHTML = this.highlightCode(code);
        }
        this.previewDirty = false;
        this.previewInitialized = true;
    }

    commitTextOverlayPreviewTextChange(editableId, textValue) {
        if (!this.isTextOverlayPreview || !this.codeEditor) {
            return;
        }

        const sourceCode = this.codeEditor.textContent || this.codeEditor.innerText;
        if (!sourceCode) {
            return;
        }

        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(sourceCode, 'text/html');
        const editableElements = this.getTextOverlayEditableElements(parsedDoc);
        const targetElement = editableElements[Number(editableId)];
        if (!targetElement) {
            return;
        }

        targetElement.textContent = textValue;
        const updatedCode = this.serializeSourceDocument(parsedDoc, sourceCode);
        this.updateCodeEditorSource(updatedCode);
    }

    enableTextOverlayPreviewEditing(frameDoc) {
        if (!this.isTextOverlayPreview || !frameDoc?.body) {
            return;
        }

        const editableElements = this.getTextOverlayEditableElements(frameDoc);
        editableElements.forEach((element, index) => {
            element.dataset.artworkEditableText = 'true';
            element.dataset.artworkEditableTextId = String(index);
            element.contentEditable = 'true';
            element.spellcheck = false;

            if (element.dataset.artworkEditableBound === 'true') {
                return;
            }

            const syncElementText = () => {
                const editableId = element.dataset.artworkEditableTextId;
                const textValue = element.innerText.replace(/\r\n/g, '\n');
                window.clearTimeout(this.textOverlayCodeSyncTimer);
                this.textOverlayCodeSyncTimer = window.setTimeout(() => {
                    this.commitTextOverlayPreviewTextChange(editableId, textValue);
                }, 120);
            };

            element.addEventListener('input', syncElementText);
            element.addEventListener('blur', syncElementText);
            element.dataset.artworkEditableBound = 'true';
        });
    }

    normalizeGenericHtmlDocument(frameDoc) {
        if (this.isTextOverlayPreview || this.isMarkdown || !frameDoc) {
            return;
        }

        const html = frameDoc.documentElement;
        const body = frameDoc.body;
        const iframeWindow = this.previewFrame?.contentWindow;
        if (!html || !body || !iframeWindow) {
            return;
        }

        const htmlStyle = iframeWindow.getComputedStyle(html);
        const bodyStyle = iframeWindow.getComputedStyle(body);
        const bodyBackground = bodyStyle?.backgroundColor;
        const htmlBackground = htmlStyle?.backgroundColor;
        const hasTransparentHtmlBackground = !htmlBackground
            || htmlBackground === 'transparent'
            || htmlBackground === 'rgba(0, 0, 0, 0)';

        const injectStyle = frameDoc.createElement('style');
        injectStyle.setAttribute('data-artwork-html-normalizer', 'true');
        injectStyle.textContent = `
html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    min-height: 100% !important;
    overflow-x: hidden !important;
}
body {
    position: relative !important;
}
        `;
        frameDoc.head?.appendChild(injectStyle);

        html.style.margin = '0';
        html.style.padding = '0';
        html.style.width = '100%';
        html.style.maxWidth = '100%';
        html.style.minHeight = '100%';
        html.style.overflowX = 'hidden';
        body.style.margin = '0';
        body.style.padding = '0';
        body.style.width = '100%';
        body.style.maxWidth = '100%';
        body.style.minHeight = '100%';
        body.style.overflowX = 'hidden';

        if (bodyBackground && hasTransparentHtmlBackground) {
            html.style.backgroundColor = bodyBackground;
        }

        /*console.info('ArtworkPreviewWindow[html]: normalized generic iframe document', {
            bodyBackground,
            htmlBackground: hasTransparentHtmlBackground ? bodyBackground || htmlBackground : htmlBackground,
        });*/
    }

    autoSizeTextOverlayWindow(bounds) {
        if (!this.isTextOverlayPreview || !bounds || !this.container) {
            return;
        }

        const boundsArea = Math.max(1, bounds.width * bounds.height);
        if (this.didAutoSizeTextOverlayWindow && boundsArea <= this.textOverlayAutoSizeArea * 1.15) {
            return;
        }

        const previewArea = this.container.querySelector('.preview-window-content');
        if (!previewArea) {
            return;
        }

        const previewChromeHeight = this.container.offsetHeight - previewArea.clientHeight;
        const maxWindowWidth = Math.floor(window.innerWidth * 0.92);
        const maxWindowHeight = Math.floor(window.innerHeight * 0.92);
        const maxContentWidth = Math.max(320, maxWindowWidth - 32);
        const maxContentHeight = Math.max(240, maxWindowHeight - previewChromeHeight - 32);
        const scale = Math.min(maxContentWidth / bounds.width, maxContentHeight / bounds.height, 1);
        const targetWidth = Math.round(bounds.width * scale);
        const targetHeight = Math.round(bounds.height * scale) + previewChromeHeight;
        const finalWidth = Math.max(420, targetWidth);
        const finalHeight = Math.max(320, targetHeight);

        this.container.classList.remove('maximized');
        this.container.style.width = `${finalWidth}px`;
        this.container.style.height = `${finalHeight}px`;
        this.container.style.left = `${Math.max(16, Math.round((window.innerWidth - finalWidth) / 2))}px`;
        this.container.style.top = `${Math.max(16, Math.round((window.innerHeight - finalHeight) / 2))}px`;
        this.didAutoSizeTextOverlayWindow = true;
        this.textOverlayAutoSizeArea = boundsArea;
        /*console.info('ArtworkPreviewWindow[text-overlay]: auto-sized window from bounds', {
            sourceImageWidth: this.sourceImageWidth,
            sourceImageHeight: this.sourceImageHeight,
            bounds,
            finalWidth,
            finalHeight,
        });*/
    }

    syncTextOverlayPreviewLayout() {
        if (!this.isTextOverlayPreview || !this.previewFrame || this.currentView !== 'preview') {
            return;
        }

        const iframeWindow = this.previewFrame.contentWindow;
        const iframeDoc = this.previewFrame.contentDocument || iframeWindow?.document;
        const docElement = iframeDoc?.documentElement;
        const body = iframeDoc?.body;
        if (!iframeWindow || !iframeDoc || !docElement || !body) {
            return;
        }

        const measuredViewportBounds = {
            left: 0,
            top: 0,
            width: Math.max(docElement.clientWidth || 0, iframeWindow.innerWidth || 0, body.clientWidth || 0),
            height: Math.max(docElement.clientHeight || 0, iframeWindow.innerHeight || 0, body.clientHeight || 0),
        };
        const sourceBounds = this.getSourceImageBounds();
        const renderedBounds = this.getVisibleTextOverlayBounds();
        const bounds = sourceBounds || renderedBounds || this.textOverlayFrameBounds || measuredViewportBounds;

        if (!bounds) {
            //console.warn('ArtworkPreviewWindow[text-overlay]: no bounds available, using full preview iframe size');
            this.previewFrame.style.width = '100%';
            this.previewFrame.style.height = '100%';
            return;
        }

        this.textOverlayFrameBounds = bounds;
        this.autoSizeTextOverlayWindow(bounds);

        const previewContainer = this.container.querySelector('.preview-preview-view');
        if (!previewContainer) {
            return;
        }

        const availableWidth = Math.max(1, previewContainer.clientWidth - 32);
        const availableHeight = Math.max(1, previewContainer.clientHeight - 32);
        const scale = Math.min(availableWidth / bounds.width, availableHeight / bounds.height, 1);
        if (this.previewFrameShell) {
            this.previewFrameShell.style.width = `${Math.max(1, Math.round(bounds.width * scale))}px`;
            this.previewFrameShell.style.height = `${Math.max(1, Math.round(bounds.height * scale))}px`;
        }
        this.previewFrame.style.width = `${Math.max(1, Math.round(bounds.width))}px`;
        this.previewFrame.style.height = `${Math.max(1, Math.round(bounds.height))}px`;
        this.previewFrame.style.maxWidth = 'none';
        this.previewFrame.style.maxHeight = 'none';
        this.previewFrame.style.position = 'absolute';
        this.previewFrame.style.top = '0';
        this.previewFrame.style.left = '0';
        this.previewFrame.style.transformOrigin = 'top left';
        this.previewFrame.style.transform = `scale(${scale})`;
        /*console.info('ArtworkPreviewWindow[text-overlay]: applied preview layout', {
            sourceBounds,
            bounds,
            measuredViewportBounds,
            availableWidth,
            availableHeight,
            scale,
            iframeWidth: this.previewFrame.style.width,
            iframeHeight: this.previewFrame.style.height,
            containerWidth: this.container.style.width,
            containerHeight: this.container.style.height,
        });*/
    }
    // Sets up all event listeners for the preview window (buttons, drag, etc.)
    setupEventListeners() {
        // Close button (X)
        const closeBtn = this.container.querySelector('.preview-window-close-btn');
       //console.log('Close button found:', closeBtn); // Debug log
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
               //console.log('Close button clicked'); // Debug log
                this.close();
            });
        }

        // Footer close button
        const footerCloseBtn = this.container.querySelector('.close-preview-btn');
       //console.log('Footer close button found:', footerCloseBtn); // Debug log
        if (footerCloseBtn) {
            footerCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
               //console.log('Footer close button clicked'); // Debug log
                this.close();
            });
        }

        // Copy code button
        const copyBtn = this.container.querySelector('.copy-code-btn');
        copyBtn.addEventListener('click', () => this.copyCode());

        const exportPngBtn = this.container.querySelector('.export-png-btn');
        if (exportPngBtn) {
            exportPngBtn.addEventListener('click', () => this.captureAndDownloadImage());
        }
        // Maximize button
        const maximizeBtn = this.container.querySelector('.preview-window-maximize-btn');
        maximizeBtn.addEventListener('click', () => this.toggleMaximize());

        // View switcher buttons
        const viewBtns = this.container.querySelectorAll('.preview-view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });

        // Dragging functionality
        const header = this.container.querySelector('.preview-window-header');
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.preview-window-controls')) return;

            this.position.isDragging = true;
            this.position.startX = e.clientX;
            this.position.startY = e.clientY;
            this.position.x = this.container.offsetLeft;
            this.position.y = this.container.offsetTop;

            header.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.position.isDragging) return;

            const dx = e.clientX - this.position.startX;
            const dy = e.clientY - this.position.startY;

            this.container.style.left = `${this.position.x + dx}px`;
            this.container.style.top = `${this.position.y + dy}px`;
        });

        document.addEventListener('mouseup', () => {
            if (!this.position.isDragging) return;

            this.position.isDragging = false;
            header.style.cursor = 'grab';
        });

        // Code editor change event
        this.codeEditor.addEventListener('input', () => {
            this.previewDirty = true;
            // If in preview mode, update the preview when code changes
            if (this.currentView === 'preview') {
                this.updatePreview();
            }
        });
    }
    // Processes and sets the code content in the editor, applies syntax highlighting, and updates the preview
    setCode(code) {
        if (!code) return;

       //console.log('ArtworkPreviewWindow: setCode called with:', code.substring(0, 200) + '...');

        // Extract HTML content if it's embedded in markdown code blocks
        let htmlCode = code;

        // Check if code is a string before using string methods
        if (typeof code === 'string') {
           //console.log('ArtworkPreviewWindow: Processing string content');

            // ENHANCED: Remove explanatory text that comes before code blocks
            // Look for patterns like "Here's the HTML..." or "Okay, here's the HTML..."
            const explanationPatterns = [
                /^.*?(?=```)/s,  // Remove everything before first ```
                /Key improvements.*$/s,  // Remove "Key improvements" section
                /\*\*.*?\*\*.*$/s,  // Remove bold text explanations
                /This revised response.*$/s  // Remove concluding explanations
            ];

            // First, try to find and extract just the code block content
            let codeBlockFound = false;

            // Try to extract HTML from markdown code blocks (most specific first)
            if (code.includes('```html')) {
               //console.log('ArtworkPreviewWindow: Found ```html block');
                const htmlMatch = code.match(/```html\s*([\s\S]*?)\s*```/);
                if (htmlMatch && htmlMatch[1]) {
                    htmlCode = htmlMatch[1].trim();
                    codeBlockFound = true;
                   //console.log('ArtworkPreviewWindow: Extracted HTML from ```html block');
                }
            }
            else if (code.includes('```markup')) {
               //console.log('ArtworkPreviewWindow: Found ```markup block');
                const markupMatch = code.match(/```markup\s*([\s\S]*?)\s*```/);
                if (markupMatch && markupMatch[1]) {
                    htmlCode = markupMatch[1].trim();
                    codeBlockFound = true;
                   //console.log('ArtworkPreviewWindow: Extracted HTML from ```markup block');
                }
            }
            // Try to extract CSS from markdown code blocks
            else if (code.includes('```css')) {
               //console.log('ArtworkPreviewWindow: Found ```css block');
                const cssMatch = code.match(/```css\s*([\s\S]*?)\s*```/);
                if (cssMatch && cssMatch[1]) {
                    htmlCode = cssMatch[1].trim();
                    codeBlockFound = true;
                   //console.log('ArtworkPreviewWindow: Extracted CSS from ```css block');
                }
            }
            // Try to extract JavaScript from markdown code blocks
            else if (code.includes('```javascript') || code.includes('```js')) {
               //console.log('ArtworkPreviewWindow: Found JavaScript block');
                const jsMatch = code.match(/```(?:javascript|js)\s*([\s\S]*?)\s*```/);
                if (jsMatch && jsMatch[1]) {
                    htmlCode = jsMatch[1].trim();
                    codeBlockFound = true;
                   //console.log('ArtworkPreviewWindow: Extracted JavaScript from code block');
                }
            }
            // NEW: Handle generic code blocks that might contain HTML
            else if (code.includes('```')) {
               //console.log('ArtworkPreviewWindow: Found generic ``` block');
                // Look for any code block that contains HTML-like content
                const genericCodeMatch = code.match(/```[a-zA-Z]*\s*([\s\S]*?)\s*```/);
                if (genericCodeMatch && genericCodeMatch[1]) {
                    const potentialHtml = genericCodeMatch[1].trim();
                   //console.log('ArtworkPreviewWindow: Potential HTML content:', potentialHtml.substring(0, 100) + '...');

                    // Check if it looks like HTML
                    if (potentialHtml.includes('<!DOCTYPE') ||
                        potentialHtml.includes('<html') ||
                        (potentialHtml.includes('<') && potentialHtml.includes('>') && potentialHtml.includes('</'))) {
                        htmlCode = potentialHtml;
                        codeBlockFound = true;
                       //console.log('ArtworkPreviewWindow: Extracted HTML from generic code block');
                    }
                }
            }

            // If no code block was found, but the content looks like it has HTML mixed with text
            if (!codeBlockFound) {
               //console.log('ArtworkPreviewWindow: No code block found, checking for inline HTML');

                // NEW: Try to extract HTML that might be mixed with explanatory text
                // Look for patterns that start with <!DOCTYPE or <html
                const htmlDocMatch = code.match(/(<!DOCTYPE[\s\S]*?<\/html>)/i);
                if (htmlDocMatch && htmlDocMatch[1]) {
                    htmlCode = htmlDocMatch[1].trim();
                    codeBlockFound = true;
                   //console.log('ArtworkPreviewWindow: Extracted complete HTML document from mixed content');
                }
                // Fallback: look for any substantial HTML-like content
                else if (code.includes('<html') && code.includes('</html>')) {
                    const htmlStartIndex = code.indexOf('<html');
                    const htmlEndIndex = code.lastIndexOf('</html>') + 7;
                    if (htmlStartIndex !== -1 && htmlEndIndex > htmlStartIndex) {
                        htmlCode = code.substring(htmlStartIndex, htmlEndIndex).trim();
                        codeBlockFound = true;
                       //console.log('ArtworkPreviewWindow: Extracted HTML by finding <html> tags');
                    }
                }
            }

            // Additional cleanup: Remove any remaining triple backticks that might be at start/end
            htmlCode = htmlCode.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '').trim();

            // NEW: Remove any explanatory text that might still be attached
            if (codeBlockFound) {
                // Remove common explanatory phrases that might be at the start
                const cleanupPatterns = [
                    /^.*?(?=<!DOCTYPE)/s,
                    /^.*?(?=<html)/s,
                    /^Here's.*?:/,
                    /^Okay.*?:/,
                    /^.*?code.*?:/i
                ];

                for (const pattern of cleanupPatterns) {
                    const beforeCleanup = htmlCode;
                    htmlCode = htmlCode.replace(pattern, '').trim();
                    if (htmlCode !== beforeCleanup) {
                       //console.log('ArtworkPreviewWindow: Removed explanatory text with pattern:', pattern);
                        break;
                    }
                }
            }

           //console.log('ArtworkPreviewWindow: Final processed code length:', htmlCode.length);
           //console.log('ArtworkPreviewWindow: Code starts with:', htmlCode.substring(0, 50));
        }

        // Add background image comments directly to the code in the editor
        if (this.backgroundImage) {
            htmlCode = this.addBackgroundImageComments(htmlCode);
           //console.log('ArtworkPreviewWindow: Added background image comments');
        }

        // Set code to editor
        this.codeEditor.textContent = htmlCode;

        // Apply syntax highlighting using CodeStyler
        if (window.CodeStyler) {
            const highlighted = this.highlightCode(htmlCode);
            this.codeEditor.innerHTML = highlighted;
           //console.log('ArtworkPreviewWindow: Applied syntax highlighting');
        }

        this.previewDirty = true;
           //console.log('ArtworkPreviewWindow: Preview marked dirty');
    }

    // Adds instructional comments to code where a background image placeholder is used
    addBackgroundImageComments(code) {
        if (!code) return code;

        // First, add a comment before any background-image that uses our placeholder
        let processedCode = code.replace(
            /background-image\s*:\s*url\s*\(\s*window\.backgroundImage\s*\)/g,
            `/* ${Lang.get('artworkBackgroundImageWarning')}
     * ${Lang.get('artworkBackgroundImageInstructions')}
     * background-image: url('your-image.jpg');
     */
    background-image: url(window.backgroundImage)`
        );

        // Then add an inline comment for any other instances of window.backgroundImage
        processedCode = processedCode.replace(
            /url\s*\(\s*window\.backgroundImage\s*\)/g,
            function (match) {
                // Only replace if it doesn't already have our comment
                if (!match.includes('/* IMPORTANT')) {
                    return `url(window.backgroundImage) /* ${Lang.get('artworkBackgroundImageReplace')} */`;
                }
                return match;
            }
        );

        return processedCode;
    }

    resolveBackgroundImageReferences(code, imageUrl) {
        if (!code || !imageUrl) return code;

        let processedCode = code.replace(
            /url\(['"]?BACKGROUND_IMAGE_PLACEHOLDER['"]?\)/gi,
            `url('${imageUrl}')`
        );

        processedCode = processedCode.replace(
            /url\(['"]?window\.backgroundImage['"]?\)/gi,
            `url('${imageUrl}')`
        );

        processedCode = processedCode.replace(
            /url\(window\.backgroundImage\)/gi,
            `url('${imageUrl}')`
        );

        processedCode = processedCode.replace(
            /url\(\s*window\s*\[\s*['"]backgroundImage['"]\s*\]\s*\)/gi,
            `url('${imageUrl}')`
        );

        processedCode = processedCode.replace(
            /(<img\s+[^>]*src\s*=\s*["'])BACKGROUND_IMAGE_PLACEHOLDER(["'][^>]*>)/gi,
            `$1${imageUrl}$2`
        );

        processedCode = processedCode.replace(
            /(<img\s+[^>]*src\s*=\s*)BACKGROUND_IMAGE_PLACEHOLDER([^>]*>)/gi,
            `$1"${imageUrl}"$2`
        );

        return processedCode;
    }

    // Updates the content of the preview iframe based on the current code/editor state
    updatePreview() {
        if (!this.previewFrame) return;

       //console.log('ArtworkPreviewWindow: updatePreview called');

        // Get current code from editor
        let code = this.codeEditor.textContent || this.codeEditor.innerText;
       //console.log('ArtworkPreviewWindow: Raw code from editor:', code.substring(0, 200) + '...');

        // NEW: If the code still contains markdown formatting, extract the HTML
        if (code.includes('```html') || code.includes('```') || code.includes('Okay, here\'s')) {
           //console.log('ArtworkPreviewWindow: Code still contains markdown, extracting...');

            // Try to extract HTML from markdown code blocks
            if (code.includes('```html')) {
                const htmlMatch = code.match(/```html\s*([\s\S]*?)\s*```/);
                if (htmlMatch && htmlMatch[1]) {
                    code = htmlMatch[1].trim();
                   //console.log('ArtworkPreviewWindow: Extracted HTML from markdown block');
                }
            }
            // Handle generic code blocks
            else if (code.includes('```')) {
                const genericMatch = code.match(/```[a-zA-Z]*\s*([\s\S]*?)\s*```/);
                if (genericMatch && genericMatch[1]) {
                    const potentialHtml = genericMatch[1].trim();
                    if (potentialHtml.includes('<!DOCTYPE') || potentialHtml.includes('<html')) {
                        code = potentialHtml;
                       //console.log('ArtworkPreviewWindow: Extracted HTML from generic code block');
                    }
                }
            }

            // Remove explanatory text that might still be present
            code = code.replace(/^.*?(?=<!DOCTYPE|<html)/s, '').trim();

            // Update the editor with the cleaned code
            this.codeEditor.textContent = code;
           //console.log('ArtworkPreviewWindow: Updated editor with cleaned code');
        }

        // Process code for preview
        let processedCode = code;

        // Resolve image placeholders for the live preview without mutating the editable HTML.
        if (this.backgroundImage) {
            processedCode = this.resolveBackgroundImageReferences(processedCode, this.backgroundImage);
        }

        // Continue with normal processing
        this.writeToIframe(processedCode);
    }

    normalizeViewportMeta(htmlContent) {
        let html = String(htmlContent || '');
        if (!html) return html;

        const viewportMetaRegex = /<meta[^>]*name\s*=\s*["']viewport["'][^>]*>/gi;
        const matches = html.match(viewportMetaRegex) || [];
        if (matches.length === 0) return html;

        const canonicalViewport = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
        let replacedFirst = false;

        html = html.replace(viewportMetaRegex, () => {
            if (replacedFirst) {
                return '';
            }
            replacedFirst = true;
            return canonicalViewport;
        });

        return html;
    }

    // Writes processed code or HTML to the preview iframe, handling markdown if needed
    writeToIframe(processedCode) {
        // FIXED: Only convert to HTML if this is truly markdown content (rationale), not HTML code
        if (this.isMarkdown && this.title.includes('Rationale') && !this.containsHTMLCode(processedCode)) {
           //console.log('ArtworkPreviewWindow: Converting true markdown to HTML');
            processedCode = this.convertMarkdownToHTML(processedCode);
        } else {
           //console.log('ArtworkPreviewWindow: Using HTML code as-is');
        }

        // Validate that we have valid content
        if (!processedCode || processedCode.trim() === '') {
            console.error('ArtworkPreviewWindow: No content found, aborting preview update');
            return;
        }

        // Keep generated HTML resilient when model output contains malformed viewport tags.
        processedCode = this.normalizeViewportMeta(processedCode);

       //console.log('ArtworkPreviewWindow: Final processed code preview:', processedCode.substring(0, 100) + '...');

        // Get iframe document
        const frameDoc = this.previewFrame.contentDocument || this.previewFrame.contentWindow.document;

        try {
            // For HTML code content, write it directly
            if (!this.isMarkdown && this.containsHTMLCode(processedCode)) {
               //console.log('ArtworkPreviewWindow: Writing HTML code directly to iframe');
                frameDoc.open();
                frameDoc.write(processedCode);
                frameDoc.close();
                this.normalizeTextOverlayDocument(frameDoc);
                this.enableTextOverlayPreviewEditing(frameDoc);
                this.normalizeGenericHtmlDocument(frameDoc);
                this.setGenericHtmlPreviewReady(false);
                this.scheduleHtmlPreviewLayout();
            } else {
                // For markdown or other content, wrap it with our template
               //console.log('ArtworkPreviewWindow: Writing wrapped content to iframe');
                frameDoc.open();
                frameDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    /* Reset styles */
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                        line-height: 1.6;
                        color: var(--text-color, #333);
                        background-color: var(--bg-color, #ffffff);
                        padding: 20px;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    
                    /* Markdown-specific styles for design rationale */
                    h1, h2, h3, h4, h5, h6 {
                        margin-top: 1.5em;
                        margin-bottom: 0.5em;
                        font-weight: 600;
                        line-height: 1.3;
                    }
                    
                    h1 { font-size: 2em; color: var(--accent-color, #4f46e5); }
                    h2 { font-size: 1.6em; color: var(--text-color, #333); }
                    h3 { font-size: 1.4em; color: var(--text-color, #333); }
                    h4 { font-size: 1.2em; color: var(--text-color, #555); }
                    h5 { font-size: 1.1em; color: var(--text-color, #555); }
                    h6 { font-size: 1em; color: var(--text-color, #666); font-weight: 500; }
                    
                    p {
                        margin-bottom: 1em;
                        text-align: justify;
                    }
                    
                    ul, ol {
                        margin-bottom: 1em;
                        padding-left: 2em;
                    }
                    
                    li {
                        margin-bottom: 0.5em;
                    }
                    
                    strong {
                        font-weight: 600;
                        color: var(--accent-color, #4f46e5);
                    }
                    
                    em {
                        font-style: italic;
                        color: var(--text-color, #555);
                    }
                    
                    blockquote {
                        border-left: 4px solid var(--accent-color, #4f46e5);
                        padding-left: 1em;
                        margin: 1em 0;
                        font-style: italic;
                        color: var(--text-color, #666);
                    }
                    
                    code {
                        background-color: var(--code-bg, #f1f5f9);
                        padding: 0.2em 0.4em;
                        border-radius: 3px;
                        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
                        font-size: 0.9em;
                    }
                    
                    /* Dark mode support */
                    @media (prefers-color-scheme: dark) {
                        body {
                            background-color: var(--bg-color, #1a1a1a);
                            color: var(--text-color, #e5e5e5);
                        }
                        
                        h1 { color: var(--accent-color, #818cf8); }
                        h2, h3 { color: var(--text-color, #e5e5e5); }
                        h4, h5 { color: var(--text-color, #d1d5db); }
                        h6 { color: var(--text-color, #9ca3af); }
                        
                        strong { color: var(--accent-color, #818cf8); }
                        em { color: var(--text-color, #d1d5db); }
                        blockquote { color: var(--text-color, #9ca3af); }
                    }
                </style>
            </head>
            <body>
                ${processedCode}
            </body>
            </html>
        `);
                frameDoc.close();
            this.normalizeTextOverlayDocument(frameDoc);
            this.enableTextOverlayPreviewEditing(frameDoc);
            this.normalizeGenericHtmlDocument(frameDoc);
            this.setGenericHtmlPreviewReady(false);
            this.scheduleHtmlPreviewLayout();
            }

           //console.log('ArtworkPreviewWindow: Preview updated successfully');
                this.previewDirty = false;
                this.previewInitialized = true;
            if (this.currentView === 'preview') {
                this.scheduleTextOverlayPreviewLayout();
            }
        } catch (error) {
            console.error('ArtworkPreviewWindow: Error updating preview:', error);
            console.error('ArtworkPreviewWindow: Problematic code:', processedCode.substring(0, 500));
        }
    }
    // Applies syntax highlighting to code using CodeStyler or escapes HTML if unavailable
    highlightCode(code) {
        // If CodeStyler isn't available, return escaped code
        if (!window.CodeStyler) {
            return code
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        try {
            // Make sure CodeStyler syntax styles are loaded
            if (typeof window.CodeStyler.addSyntaxStyles === 'function') {
                window.CodeStyler.addSyntaxStyles();
            }

            // Detect language from content
            let language = this.detectLanguage(code);

            // Use the proper highlighting method based on language
            if (language === 'markup' || language === 'html') {
                // Use the enhanced highlightMarkup method for HTML
                const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');

                // For debugging, we can use the debug version
                if (window.CodeStyler.highlightMarkupDebug && false) { // Set to true to enable debug mode
                    return window.CodeStyler.highlightMarkupDebug(escapedCode);
                }

                return window.CodeStyler.highlightMarkup(escapedCode);
            } else if (language && typeof window.CodeStyler.highlightCode === 'function') {
                // Use the enhanced highlightCode method for other languages
                const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return window.CodeStyler.highlightCode(escapedCode, language);
            } else {
                // Fallback to simple markup highlighting
                return window.CodeStyler.highlightMarkup(
                    code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
                );
            }
        } catch (error) {
            console.error('Error applying syntax highlighting:', error);
            // Return escaped code if highlighting fails
            return code
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }
    }

    // Attempts to detect the programming language of the provided code for highlighting
    detectLanguage(code) {
       //console.log('detectLanguage called with:',
            //code ? code.substring(0, 30) + '...' : 'undefined');

        if (!code) {
           //console.log('Code is empty, defaulting to markup');
            return 'markup';
        }

        // For HTML content
        if (code.includes('<html') ||
            code.includes('<!DOCTYPE') ||
            (code.includes('<') && code.includes('>') && code.includes('</') && !code.includes('{'))) {
           //console.log('Detected HTML/markup content');
            return 'markup';
        }

        // For CSS content - check for typical CSS patterns
        if (code.includes('{') && code.includes('}') &&
            (code.includes('px') || code.includes('rgb') || code.includes('#') ||
                code.includes('margin') || code.includes('padding') || code.includes('@media'))) {
           //console.log('Detected CSS content');
            return 'css';
        }

        // For JavaScript content - check for JS keywords and patterns
        if (code.includes('function') || code.includes('const ') ||
            code.includes('var ') || code.includes('let ') ||
            code.includes('return ') || code.includes('=> {') ||
            code.includes('//console.log')) {
           //console.log('Detected JavaScript content');
            return 'javascript';
        }

        // Default to markup for unknown types
       //console.log('Could not determine language, defaulting to markup');
        return 'markup';
    }
    // Switches between code and preview views, recreating the iframe for preview mode
    switchView(view) {
        if (view === this.currentView) return;

        this.currentView = view;

        // Update buttons
        const buttons = this.container.querySelectorAll('.preview-view-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            }
        });

        // Update views
        const codeView = this.container.querySelector('.preview-code-view');
        const previewView = this.container.querySelector('.preview-preview-view');

        if (view === 'code') {
            codeView.classList.add('active');
            previewView.classList.remove('active');
            const loadingState = this.container.querySelector('.preview-loading-state');
            if (loadingState) {
                loadingState.classList.remove('active');
            }
        } else {
            codeView.classList.remove('active');
            previewView.classList.add('active');

            const needsPreviewRefresh = this.previewDirty || !this.previewInitialized;

            const loadingState = this.container.querySelector('.preview-loading-state');
            if (loadingState) {
                if (this.isTextOverlayPreview && needsPreviewRefresh) {
                    loadingState.textContent = 'Assets loading, please wait...';
                    loadingState.classList.add('active');
                } else if (!this.isMarkdown && needsPreviewRefresh) {
                    loadingState.classList.add('active');
                } else {
                    loadingState.classList.remove('active');
                }
            }

            const previewContainer = this.container.querySelector('.preview-preview-view');
            const previewShell = this.previewFrameShell || this.container.querySelector('.preview-iframe-shell');
            this.previewFrameShell = previewShell;

            if (!this.previewFrame || !this.previewFrame.isConnected) {
                const newIframe = document.createElement('iframe');
                newIframe.className = 'preview-iframe';
                newIframe.sandbox = 'allow-scripts allow-same-origin allow-modals';
                if (this.isTextOverlayPreview) {
                    newIframe.style.width = `${this.sourceImageWidth || 1}px`;
                    newIframe.style.height = `${this.sourceImageHeight || 1}px`;
                    newIframe.style.visibility = 'hidden';
                    newIframe.style.opacity = '0';
                } else {
                    newIframe.style.visibility = 'hidden';
                    newIframe.style.opacity = '0';
                }

                (previewShell || previewContainer).appendChild(newIframe);
                this.previewFrame = newIframe;
                this.previewDirty = true;
            }

            if (this.isTextOverlayPreview) {
                if (needsPreviewRefresh) {
                    this.textOverlayFrameBounds = null;
                    this.didAutoSizeTextOverlayWindow = false;
                    this.textOverlayAutoSizeArea = 0;
                    this.textOverlayPreviewReady = false;
                    this.textOverlayStabilizationAttempts = 0;
                    this.textOverlayPreviewStabilizationToken += 1;
                    if (this.previewFrameShell) {
                        this.previewFrameShell.style.width = '100%';
                        this.previewFrameShell.style.height = '100%';
                    }
                    this.setTextOverlayPreviewReady(false);
                } else {
                    this.setTextOverlayPreviewReady(true);
                }
            } else if (needsPreviewRefresh) {
                this.htmlPreviewAutoSizeArea = 0;
                this.htmlPreviewGutterRemoved = false;
                this.setGenericHtmlPreviewReady(false);
            } else {
                this.setGenericHtmlPreviewReady(true);
            }

            if (needsPreviewRefresh) {
                this.updatePreview();
            }
        }
    }
    // Copies the code or rationale text to the clipboard, stripping markdown if needed
    copyCode() {
        let code;

        // For design rationale (markdown content), copy clean text without markdown
        if (this.isMarkdown || this.title.includes('Rationale')) {
            // Get the raw markdown content and strip formatting
            const rawCode = this.codeEditor.textContent || this.codeEditor.innerText;
            code = this.stripMarkdownFormatting(rawCode);
        } else {
            // For regular code content, copy the raw code from editor
            code = this.codeEditor.textContent || this.codeEditor.innerText;
        }

        // Copy to clipboard
        navigator.clipboard.writeText(code)
            .then(() => {
                // Show a temporary success message
                const copyBtn = this.container.querySelector('.copy-code-btn');
                const originalText = copyBtn.innerHTML;

                copyBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                ${Lang.get('artworkCopied')}
            `;

                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy code:', err);
                alert(Lang.get('artworkCopyFailed'));
            });
    }

    // Toggles the preview window between maximized and previous size/position
    toggleMaximize() {
        this.container.classList.toggle('maximized');

        if (this.container.classList.contains('maximized')) {
            // Store current dimensions for later restoration
            this.container.dataset.prevWidth = this.container.style.width;
            this.container.dataset.prevHeight = this.container.style.height;
            this.container.dataset.prevLeft = this.container.style.left;
            this.container.dataset.prevTop = this.container.style.top;

            // Maximize
            this.container.style.width = '100%';
            this.container.style.height = '100%';
            this.container.style.left = '0';
            this.container.style.top = '0';
        } else {
            // Restore previous dimensions
            this.container.style.width = this.container.dataset.prevWidth;
            this.container.style.height = this.container.dataset.prevHeight;
            this.container.style.left = this.container.dataset.prevLeft;
            this.container.style.top = this.container.dataset.prevTop;
        }

        this.scheduleTextOverlayPreviewLayout();
        this.scheduleHtmlPreviewLayout();
    }

    // Shows the preview window and overlay, and updates the preview
    show() {
       //console.log('Show method called, isVisible:', this.isVisible); // Debug log
        if (this.isVisible) return;

        this.container.style.display = 'flex';
        this.isVisible = true;

        // Add an overlay behind the window
        const overlay = document.createElement('div');
        overlay.className = 'artwork-preview-overlay';
        document.body.appendChild(overlay);
        this.overlay = overlay;

       //console.log('Window shown, isVisible now:', this.isVisible); // Debug log
    }

    // Closes the preview window, removes overlay, and dispatches close event
    close() {
       //console.log('Close method called'); // Debug log
        if (!this.isVisible) {
           //console.log('Window already closed');
            return;
        }

        if (this.container) {
           //console.log('Removing container from DOM'); // Debug log
            // Instead of just hiding, completely remove from DOM
            this.container.remove();
        }

        this.isVisible = false;

        // Remove overlay
        if (this.overlay) {
           //console.log('Removing overlay'); // Debug log
            this.overlay.remove();
        }

        // Trigger an event that the tab can listen for to restore system prompt
        const closeEvent = new CustomEvent('artworkPreviewClosed', {
            detail: { timestamp: Date.now() }
        });
        document.dispatchEvent(closeEvent);

       //console.log('Window closed successfully'); // Debug log
    }

    // Removes the preview window and cleans up resources
    destroy() {
        this.close();
        this.container.remove();
    }

    // Sets up a listener to update the theme when the system color scheme changes
    setupThemeListener() {
        // Check if the browser supports matchMedia
        if (window.matchMedia) {
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            // Add event listener for theme changes
            if (darkModeMediaQuery.addEventListener) {
                darkModeMediaQuery.addEventListener('change', () => this.updateTheme());
            } else if (darkModeMediaQuery.addListener) {
                // Fallback for older browsers
                darkModeMediaQuery.addListener(() => this.updateTheme());
            }
        }
    }
    // Updates the preview and syntax highlighting to match the current theme
    updateTheme() {
        // Update the preview iframe content when theme changes
        if (this.currentView === 'preview') {
            this.updatePreview();
        }

        // Re-apply syntax highlighting with new theme
        if (window.CodeStyler && this.codeEditor) {
            const code = this.codeEditor.textContent || this.codeEditor.innerText;
            this.codeEditor.innerHTML = this.highlightCode(code);
        }
    }

    async blobToDataUrl(blob) {
        if (!blob) {
            return null;
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('Failed converting blob to data URL.'));
            reader.readAsDataURL(blob);
        });
    }

    async fetchAssetAsDataUrl(rawUrl, baseUrl) {
        const url = String(rawUrl || '').trim().replace(/^['"]|['"]$/g, '');
        if (!url || url.startsWith('data:')) {
            return url;
        }

        let resolvedUrl = url;
        try {
            resolvedUrl = new URL(url, baseUrl || window.location.href).href;
        } catch (_error) {
        }

        if (resolvedUrl.startsWith('data:')) {
            return resolvedUrl;
        }

        if (this.exportAssetCache.has(resolvedUrl)) {
            return this.exportAssetCache.get(resolvedUrl);
        }

        const fetchPromise = fetch(resolvedUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch export asset: ${response.status}`);
                }
                return response.blob();
            })
            .then((blob) => this.blobToDataUrl(blob))
            .catch((error) => {
                console.warn('ArtworkPreviewWindow: unable to inline export asset', { url: resolvedUrl, error });
                return resolvedUrl;
            });

        this.exportAssetCache.set(resolvedUrl, fetchPromise);
        return fetchPromise;
    }

    async inlineCssUrlsForExport(cssValue, baseUrl) {
        const value = String(cssValue || '');
        if (!value || !/url\(/i.test(value)) {
            return value;
        }

        const matches = [...value.matchAll(/url\(([^)]+)\)/gi)];
        if (matches.length === 0) {
            return value;
        }

        const replacements = await Promise.all(matches.map(async (match) => {
            const originalUrl = String(match[1] || '').trim();
            const inlinedUrl = await this.fetchAssetAsDataUrl(originalUrl, baseUrl);
            return {
                fullMatch: match[0],
                replacement: `url("${inlinedUrl}")`,
            };
        }));

        let output = value;
        replacements.forEach(({ fullMatch, replacement }) => {
            output = output.replace(fullMatch, replacement);
        });
        return output;
    }

    async waitForImageElement(img) {
        if (!img) {
            return;
        }

        if (img.complete) {
            if (typeof img.decode === 'function') {
                await img.decode().catch(() => {});
            }
            return;
        }

        await new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
        });

        if (typeof img.decode === 'function') {
            await img.decode().catch(() => {});
        }
    }

    async loadImageForCanvas(src) {
        const imageSrc = String(src || '').trim();
        if (!imageSrc) {
            return null;
        }

        return new Promise((resolve, reject) => {
            const image = new Image();
            if (!imageSrc.startsWith('data:')) {
                image.crossOrigin = 'anonymous';
            }
            image.onload = async () => {
                if (typeof image.decode === 'function') {
                    await image.decode().catch(() => {});
                }
                resolve(image);
            };
            image.onerror = reject;
            image.src = imageSrc;
        });
    }

    async inlineElementStyleAssetsForExport(element, iframeWindow, baseUrl) {
        if (!(element instanceof iframeWindow.HTMLElement)) {
            return;
        }

        const computedStyle = iframeWindow.getComputedStyle(element);
        const backgroundImage = computedStyle?.backgroundImage;
        if (backgroundImage && backgroundImage !== 'none' && /url\(/i.test(backgroundImage)) {
            const inlinedBackgroundImage = await this.inlineCssUrlsForExport(backgroundImage, baseUrl);
            if (inlinedBackgroundImage && inlinedBackgroundImage !== backgroundImage) {
                element.style.backgroundImage = inlinedBackgroundImage;
            }
        }

        const maskImage = computedStyle?.maskImage;
        if (maskImage && maskImage !== 'none' && /url\(/i.test(maskImage)) {
            const inlinedMaskImage = await this.inlineCssUrlsForExport(maskImage, baseUrl);
            if (inlinedMaskImage && inlinedMaskImage !== maskImage) {
                element.style.maskImage = inlinedMaskImage;
                element.style.webkitMaskImage = inlinedMaskImage;
            }
        }
    }

    async inlinePreviewAssetsForExport() {
        const iframe = this.previewFrame;
        const iframeWindow = iframe ? iframe.contentWindow : null;
        const iframeDoc = iframe ? (iframe.contentDocument || iframeWindow?.document) : null;
        if (!iframeWindow || !iframeDoc || !iframeDoc.body) {
            return;
        }

        const baseUrl = iframeWindow.location?.href || window.location.href;
        const images = Array.from(iframeDoc.images || []);
        await Promise.all(images.map(async (img) => {
            const src = img?.currentSrc || img?.getAttribute('src') || img?.src;
            if (!src) {
                return;
            }
            const inlinedSrc = await this.fetchAssetAsDataUrl(src, baseUrl);
            if (inlinedSrc && inlinedSrc !== img.src) {
                img.src = inlinedSrc;
                img.removeAttribute('srcset');
            }
            await this.waitForImageElement(img);
        }));

        const elements = [iframeDoc.documentElement, iframeDoc.body, ...Array.from(iframeDoc.body.querySelectorAll('*'))];
        await Promise.all(elements.map((element) => this.inlineElementStyleAssetsForExport(element, iframeWindow, baseUrl)));

        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }

    async waitForPreviewAssets() {
        const iframe = this.previewFrame;
        const iframeWindow = iframe ? iframe.contentWindow : null;
        const iframeDoc = iframe ? (iframe.contentDocument || iframeWindow?.document) : null;
        if (!iframeDoc) {
            return;
        }

        if (iframeDoc.fonts && typeof iframeDoc.fonts.ready === 'object') {
            try {
                await iframeDoc.fonts.ready;
            } catch (_error) {
            }
        }

        const images = Array.from(iframeDoc.images || []);
        await Promise.all(images.map((img) => {
            if (!img) {
                return Promise.resolve();
            }
            if (img.complete) {
                if (typeof img.decode === 'function') {
                    return img.decode().catch(() => {});
                }
                return Promise.resolve();
            }

            return new Promise((resolve) => {
                img.addEventListener('load', resolve, { once: true });
                img.addEventListener('error', resolve, { once: true });
            });
        }));

        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }

    getPreviewCaptureMetrics() {
        const iframe = this.previewFrame;
        const iframeWindow = iframe ? iframe.contentWindow : null;
        const iframeDoc = iframe ? (iframe.contentDocument || iframeWindow?.document) : null;
        if (!iframe || !iframeWindow || !iframeDoc) {
            return null;
        }

        const docElement = iframeDoc.documentElement;
        const body = iframeDoc.body;
        const viewportWidth = Math.max(
            iframe.clientWidth || 0,
            iframeWindow.innerWidth || 0,
            docElement ? docElement.clientWidth : 0,
            body ? body.clientWidth : 0,
        );
        const viewportHeight = Math.max(
            iframe.clientHeight || 0,
            iframeWindow.innerHeight || 0,
            docElement ? docElement.clientHeight : 0,
            body ? body.clientHeight : 0,
        );

        const computedBodyStyle = body ? iframeWindow.getComputedStyle(body) : null;
        const computedHtmlStyle = docElement ? iframeWindow.getComputedStyle(docElement) : null;
        const backgroundColor = (computedBodyStyle && computedBodyStyle.backgroundColor && computedBodyStyle.backgroundColor !== 'rgba(0, 0, 0, 0)')
            ? computedBodyStyle.backgroundColor
            : (computedHtmlStyle && computedHtmlStyle.backgroundColor && computedHtmlStyle.backgroundColor !== 'rgba(0, 0, 0, 0)')
                ? computedHtmlStyle.backgroundColor
                : '#000000';

        if (this.isTextOverlayPreview) {
            const sourceBounds = this.getSourceImageBounds();
            const overlayBounds = sourceBounds || this.textOverlayFrameBounds || this.getVisibleTextOverlayBounds() || {
                left: 0,
                top: 0,
                width: viewportWidth,
                height: viewportHeight,
            };

            /*console.info('ArtworkPreviewWindow[text-overlay]: export capture target', {
                targetTag: body?.tagName || '',
                targetClassName: body?.className || '',
                captureWidth: Math.round(overlayBounds.width),
                captureHeight: Math.round(overlayBounds.height),
                captureX: 0,
                captureY: 0,
                backgroundColor: 'transparent',
                usingOverlayElementTarget: false,
                outputWidth: this.sourceImageWidth,
                outputHeight: this.sourceImageHeight,
            });*/

            return {
                target: body,
                windowWidth: Math.max(1, Math.round(overlayBounds.width)),
                windowHeight: Math.max(1, Math.round(overlayBounds.height)),
                width: Math.max(1, Math.round(overlayBounds.width)),
                height: Math.max(1, Math.round(overlayBounds.height)),
                scrollX: 0,
                scrollY: 0,
                backgroundColor: null,
                outputWidth: this.sourceImageWidth > 0 ? this.sourceImageWidth : Math.max(1, Math.round(overlayBounds.width)),
                outputHeight: this.sourceImageHeight > 0 ? this.sourceImageHeight : Math.max(1, Math.round(overlayBounds.height)),
                renderedOverlayBounds: overlayBounds,
                compositeBackgroundImage: !!this.backgroundImage,
            };
        }

        const overlayCaptureCandidate = this.isTextOverlayPreview ? this.getTextOverlayCaptureCandidate() : null;
        const renderedOverlayBounds = overlayCaptureCandidate
            ? {
                left: overlayCaptureCandidate.left,
                top: overlayCaptureCandidate.top,
                width: overlayCaptureCandidate.width,
                height: overlayCaptureCandidate.height,
            }
            : null;
        const captureBounds = renderedOverlayBounds || (this.isTextOverlayPreview ? this.textOverlayFrameBounds : null);
        const captureWidth = captureBounds ? captureBounds.width : viewportWidth;
        const captureHeight = captureBounds ? captureBounds.height : viewportHeight;
        const useOverlayTarget = !!(this.isTextOverlayPreview && overlayCaptureCandidate?.element);
        const captureX = useOverlayTarget ? 0 : (captureBounds ? captureBounds.left : (iframeWindow.scrollX || iframeWindow.pageXOffset || 0));
        const captureY = useOverlayTarget ? 0 : (captureBounds ? captureBounds.top : (iframeWindow.scrollY || iframeWindow.pageYOffset || 0));
        const target = useOverlayTarget ? overlayCaptureCandidate.element : (docElement || body);

        if (this.isTextOverlayPreview) {
            /*console.info('ArtworkPreviewWindow[text-overlay]: export capture target', {
                targetTag: target?.tagName || '',
                targetClassName: target?.className || '',
                captureWidth: Math.round(captureWidth),
                captureHeight: Math.round(captureHeight),
                captureX: Math.round(captureX),
                captureY: Math.round(captureY),
                backgroundColor,
                usingOverlayElementTarget: useOverlayTarget,
            });*/
        }

        return {
            target,
            windowWidth: useOverlayTarget ? Math.max(1, Math.round(captureWidth)) : viewportWidth,
            windowHeight: useOverlayTarget ? Math.max(1, Math.round(captureHeight)) : viewportHeight,
            width: captureWidth,
            height: captureHeight,
            scrollX: captureX,
            scrollY: captureY,
            backgroundColor,
            outputWidth: this.isTextOverlayPreview && this.sourceImageWidth > 0 ? this.sourceImageWidth : 0,
            outputHeight: this.isTextOverlayPreview && this.sourceImageHeight > 0 ? this.sourceImageHeight : 0,
            renderedOverlayBounds,
        };
    }

    prepareClonedPreviewForExport(clonedDoc, captureMetrics) {
        if (!clonedDoc || !captureMetrics) {
            return;
        }

        const docElement = clonedDoc.documentElement;
        const body = clonedDoc.body;
        const isTransparentOverlayExport = this.isTextOverlayPreview && captureMetrics.backgroundColor == null;

        if (this.isTextOverlayPreview) {
            this.normalizeTextOverlayDocument(clonedDoc);

            const editableElements = Array.from(clonedDoc.querySelectorAll('[data-artwork-editable-text="true"]'));
            editableElements.forEach((element) => {
                element.removeAttribute('contenteditable');
                element.style.outline = 'none';
                element.style.caretColor = 'transparent';
            });
        }

        if (docElement) {
            docElement.style.width = `${captureMetrics.windowWidth}px`;
            docElement.style.height = `${captureMetrics.windowHeight}px`;
            docElement.style.overflow = this.isTextOverlayPreview ? 'hidden' : 'visible';
            docElement.style.backgroundColor = isTransparentOverlayExport ? 'transparent' : captureMetrics.backgroundColor;
        }

        if (body) {
            body.style.width = `${captureMetrics.windowWidth}px`;
            body.style.height = `${captureMetrics.windowHeight}px`;
            body.style.overflow = this.isTextOverlayPreview ? 'hidden' : 'visible';
            body.style.backgroundColor = isTransparentOverlayExport ? 'transparent' : captureMetrics.backgroundColor;
        }

        if (isTransparentOverlayExport) {
            const pageWrapper = body?.querySelector('.page-wrapper');
            if (pageWrapper) {
                pageWrapper.style.backgroundColor = 'transparent';
                pageWrapper.style.background = 'transparent';
                pageWrapper.style.overflow = 'hidden';
            }

            const artboard = body?.querySelector('.container, img.container, [class*="container"]');
            if (artboard) {
                artboard.style.overflow = 'hidden';
            }
        }
    }

    resizeCanvasForExport(canvas, captureMetrics) {
        const outputWidth = Number(captureMetrics?.outputWidth) || 0;
        const outputHeight = Number(captureMetrics?.outputHeight) || 0;
        if (!canvas || outputWidth <= 0 || outputHeight <= 0) {
            return canvas;
        }

        if (canvas.width === outputWidth && canvas.height === outputHeight) {
            return canvas;
        }

        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = outputWidth;
        exportCanvas.height = outputHeight;
        const exportContext = exportCanvas.getContext('2d');
        if (!exportContext) {
            return canvas;
        }

        exportContext.drawImage(canvas, 0, 0, outputWidth, outputHeight);
        /*console.info('ArtworkPreviewWindow[text-overlay]: resized export canvas to source image dimensions', {
            renderedWidth: canvas.width,
            renderedHeight: canvas.height,
            outputWidth,
            outputHeight,
            renderedOverlayBounds: captureMetrics.renderedOverlayBounds,
        });*/
        return exportCanvas;
    }

    async finalizeExportCanvas(canvas, captureMetrics) {
        const resizedCanvas = this.resizeCanvasForExport(canvas, captureMetrics);
        const exportBackgroundImage = this.exportBackgroundImage || this.backgroundImage;
        if (!this.isTextOverlayPreview || !captureMetrics?.compositeBackgroundImage || !exportBackgroundImage) {
            return resizedCanvas;
        }

        try {
            const backgroundImage = await this.loadImageForCanvas(exportBackgroundImage);
            if (!backgroundImage) {
                return resizedCanvas;
            }

            const outputWidth = Number(captureMetrics?.outputWidth) || resizedCanvas.width;
            const outputHeight = Number(captureMetrics?.outputHeight) || resizedCanvas.height;
            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = outputWidth;
            exportCanvas.height = outputHeight;
            const exportContext = exportCanvas.getContext('2d');
            if (!exportContext) {
                return resizedCanvas;
            }

            exportContext.clearRect(0, 0, outputWidth, outputHeight);
            exportContext.drawImage(backgroundImage, 0, 0, outputWidth, outputHeight);
            exportContext.drawImage(resizedCanvas, 0, 0, outputWidth, outputHeight);
            /*console.info('ArtworkPreviewWindow[text-overlay]: composited source background image into export canvas', {
                outputWidth,
                outputHeight,
                overlayCanvasWidth: resizedCanvas.width,
                overlayCanvasHeight: resizedCanvas.height,
            });*/
            return exportCanvas;
        } catch (error) {
            //console.warn('ArtworkPreviewWindow[text-overlay]: failed composing source background image into export canvas', error);
            return resizedCanvas;
        }
    }

    renderPreviewToCanvas(captureMetrics) {
        const baseOptions = {
            scale: Math.max(2, window.devicePixelRatio || 1),
            useCORS: true,
            allowTaint: false,
            backgroundColor: captureMetrics.backgroundColor,
            logging: false,
            imageTimeout: 0,
            removeContainer: true,
            windowWidth: captureMetrics.windowWidth,
            windowHeight: captureMetrics.windowHeight,
            width: captureMetrics.width,
            height: captureMetrics.height,
            scrollX: captureMetrics.scrollX,
            scrollY: captureMetrics.scrollY,
            x: captureMetrics.scrollX,
            y: captureMetrics.scrollY,
            onclone: (clonedDoc) => this.prepareClonedPreviewForExport(clonedDoc, captureMetrics),
        };

        return html2canvas(captureMetrics.target, {
            ...baseOptions,
            foreignObjectRendering: true,
        }).catch((error) => {
            console.warn('ArtworkPreviewWindow: foreignObject export failed, retrying with canvas renderer', error);
            return html2canvas(captureMetrics.target, {
                ...baseOptions,
                foreignObjectRendering: false,
            });
        });
    }

    // Captures the preview as a PNG image and triggers a download, showing notifications
    async captureAndDownloadImage() {
        // Make sure we're in preview mode first
        if (this.currentView !== 'preview') {
            this.switchView('preview');
            setTimeout(() => this.captureAndDownloadImage(), 500);
            return;
        }

        const iframe = this.previewFrame;
        if (!iframe) return;

        try {
            // Create a progress notification with consistent styling
            const notification = document.createElement('div');
            notification.className = 'export-notification';
            notification.innerHTML = `
            <div class="export-notification-content">
                <h3>${Lang.get('artworkExportingPNG')}</h3>
                <p>${Lang.get('artworkExportWait')}</p>
                <div class="export-progress"></div>
                <div class="button-container">
                    <button class="dismiss-export-btn" style="display: none;">${Lang.get('artworkClose')}</button>
                </div>
            </div>
        `;
            document.body.appendChild(notification);

            // Use html2canvas to capture the iframe content
            if (typeof html2canvas !== 'function') {
                throw new Error('html2canvas not found. Make sure it is properly loaded.');
            }

			await this.waitForPreviewAssets();
            await this.inlinePreviewAssetsForExport();
            await this.waitForPreviewAssets();
			const captureMetrics = this.getPreviewCaptureMetrics();
			if (!captureMetrics || !captureMetrics.target) {
				throw new Error('Preview content is not ready for export.');
			}

            this.renderPreviewToCanvas(captureMetrics).then(async (canvas) => {
                try {
                    const exportCanvas = await this.finalizeExportCanvas(canvas, captureMetrics);
                    // Convert canvas to PNG with maximum quality
                    const imgData = exportCanvas.toDataURL('image/png', 1.0);
                    const link = document.createElement('a');
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    link.download = `design-export-${timestamp}.png`;
                    link.href = imgData;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Update the existing notification content instead of replacing it
                    const content = notification.querySelector('.export-notification-content');
                    const h3 = content.querySelector('h3');
                    const p = content.querySelector('p');
                    const progress = content.querySelector('.export-progress');
                    const button = content.querySelector('.dismiss-export-btn');

                    h3.textContent = Lang.get('artworkExportSuccess');
                    p.textContent = Lang.get('artworkExportDownloaded');
                    progress.style.display = 'none'; // Hide progress bar
                    button.style.display = 'inline-block'; // Show close button

                    // Add event listener to the existing button
                    button.addEventListener('click', () => {
                        notification.remove();
                    });

                    // Auto-dismiss after 3 seconds
                    setTimeout(() => {
                        if (document.body.contains(notification)) {
                            notification.remove();
                        }
                    }, 3000);

                } catch (e) {
                    console.error('Error creating PNG:', e);
                    this.showExportInstructions(notification);
                }
            }).catch(error => {
                console.error('Error with html2canvas:', error);
                this.showExportInstructions(notification);
            });
        } catch (error) {
            console.error('Error exporting as PNG:', error);
            this.showExportInstructions();
        }
    }
    // Shows fallback instructions for exporting an image if PNG export fails
    showExportInstructions(existingNotification = null) {
        const notification = existingNotification || document.createElement('div');
        notification.className = 'export-notification';
        notification.innerHTML = `
    <div class="export-notification-content">
        <h3>${Lang.get('artworkExportPNG')}</h3>
        <p>${Lang.get('artworkExportInstructions')}</p>
        <ol>
            <li>${Lang.get('artworkExportScreenshot')}
                <ul>
                    <li><strong>Mac:</strong> ${Lang.get('artworkExportMac')}</li>
                    <li><strong>Windows:</strong> ${Lang.get('artworkExportWindows')}</li>
                </ul>
            </li>
            <li>${Lang.get('artworkExportPasteSave')}</li>
        </ol>
        <div style="text-align: right;">
            <button class="dismiss-export-btn">${Lang.get('artworkExportGotIt')}</button>
        </div>
    </div>
`;

        if (!existingNotification) {
            document.body.appendChild(notification);
        }

        const dismissBtn = notification.querySelector('.dismiss-export-btn');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                notification.remove();
            });
        }
    }
    // Detects if the provided content is likely markdown (used for rationale)
    detectMarkdownContent(content) {
        if (!content || typeof content !== 'string') return false;

        // Look for markdown indicators
        const markdownIndicators = [
            /^#{1,6}\s/m,           // Headers (# ## ### etc.)
            /\*\*.*?\*\*/,          // Bold text
            /\*.*?\*/,              // Italic text
            /^-\s/m,                // Bullet points
            /^\d+\.\s/m             // Numbered lists
        ];

        return markdownIndicators.some(pattern => pattern.test(content));
    }
    // Converts markdown text to HTML for rationale preview
    convertMarkdownToHTML(markdown) {
        if (!markdown) return '';

        let html = markdown;

        // Convert headers (### becomes <h3>, #### becomes <h4>, etc.)
        html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

        // Convert bold text (**text** becomes <strong>text</strong>)
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Convert italic text (*text* becomes <em>text</em>)
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Convert bullet points (- item becomes <li>item</li>)
        html = html.replace(/^- (.*$)/gm, '<li>$1</li>');

        // Wrap consecutive <li> elements in <ul>
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        html = html.replace(/<\/li>\s*<li>/g, '</li><li>');

        // Convert line breaks to paragraphs
        html = html.split('\n\n').map(paragraph => {
            paragraph = paragraph.trim();
            if (!paragraph) return '';

            // Don't wrap headers or lists in <p> tags
            if (paragraph.startsWith('<h') ||
                paragraph.startsWith('<ul') ||
                paragraph.startsWith('<ol') ||
                paragraph.startsWith('<li')) {
                return paragraph;
            }

            return `<p>${paragraph}</p>`;
        }).join('\n');

        // Clean up any remaining single line breaks
        html = html.replace(/\n/g, '<br>');

        return html;
    }
    // Strips markdown formatting from text for clean copying
    stripMarkdownFormatting(markdown) {
        if (!markdown) return '';

        let text = markdown;

        // Remove markdown headers (### Header becomes Header)
        text = text.replace(/^#{1,6}\s+(.*)$/gm, '$1');

        // Remove bold formatting (**text** becomes text)
        text = text.replace(/\*\*(.*?)\*\*/g, '$1');

        // Remove italic formatting (*text* becomes text)
        text = text.replace(/\*(.*?)\*/g, '$1');

        // Remove bullet points (- item becomes item)
        text = text.replace(/^-\s+(.*)$/gm, '$1');

        // Remove numbered list formatting (1. item becomes item)
        text = text.replace(/^\d+\.\s+(.*)$/gm, '$1');

        // Clean up multiple consecutive line breaks (keep max 2)
        text = text.replace(/\n{3,}/g, '\n\n');

        // Trim whitespace
        text = text.trim();

        return text;
    }
}

(function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .artwork-preview-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 9998;
        }
        
        .artwork-preview-window {
            position: fixed;
            display: flex;
            flex-direction: column;
            background-color: var(--bg-color, #ffffff);
            border: 1px solid var(--border-color, #ddd);
            border-radius: 8px;
            box-shadow: 0 10px 25px var(--preview-shadow, rgba(0, 0, 0, 0.2));
            z-index: 9999;
            min-width: 400px;
            min-height: 300px;
            max-width: 100%;
            max-height: 100%;
            overflow: hidden;
            color: var(--text-color, #333);
        }
        
        .preview-window-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background-color: var(--preview-header-bg, #f5f5f5);
            border-bottom: 1px solid var(--border-color, #ddd);
            cursor: grab;
        }
        
        .preview-window-title {
            font-weight: bold;
            font-size: 14px;
            color: var(--text-color, #333);
        }
        
        .preview-window-controls {
            display: flex;
            gap: 8px;
        }
        
        .preview-window-controls button {
            background: none;
            border: none;
            color: var(--text-color, #666);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .preview-window-controls button:hover {
            background-color: rgba(127, 127, 127, 0.1);
        }
        
        .preview-window-view-controls {
            display: flex;
            padding: 8px 15px;
            border-bottom: 1px solid var(--border-color, #ddd);
            background-color: var(--preview-toolbar-bg, #f5f5f5);
        }
        
        .preview-view-btn {
            background: none;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--text-color, #666);
        }
        
        .preview-view-btn:hover {
            background-color: rgba(127, 127, 127, 0.1);
        }
        
        .preview-view-btn.active {
            background-color: var(--accent-color, #4f46e5);
            color: white;
        }
        
        .preview-view-btn.active svg {
            stroke: white;
        }
        
        .preview-window-content {
            flex: 1;
            overflow: hidden;
            position: relative;
            background-color: var(--bg-color, #ffffff);
        }
        
        .preview-code-view,
        .preview-preview-view {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            display: none;
        }
        
        .preview-code-view.active,
        .preview-preview-view.active {
            display: block;
        }

        .preview-preview-view.active {
            background-color: #000000;
        }

        .preview-loading-state {
            display: none;
            position: absolute;
            inset: 0;
            align-items: center;
            justify-content: center;
            padding: 24px;
            text-align: center;
            color: #f5f5f5;
            background: rgba(0, 0, 0, 0.42);
            backdrop-filter: blur(14px) saturate(0.9);
            -webkit-backdrop-filter: blur(14px) saturate(0.9);
            font-size: 14px;
            letter-spacing: 0.02em;
            z-index: 3;
            pointer-events: none;
            font-weight: 500;
        }

        .preview-loading-state.active {
            display: flex;
        }

        .artwork-preview-window.text-overlay-preview .preview-preview-view.active {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            background-color: #000000;
        }
        
        .code-editor {
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            padding: 15px;
            min-height: 100%;
            white-space: pre-wrap;
            outline: none;
            overflow: auto;
            color: var(--text-color, #333);
            background-color: var(--bg-color, #ffffff);
        }
        
        .preview-iframe-shell {
            position: relative;
            width: 100%;
            height: 100%;
        }

        .preview-iframe {
            width: 100%;
            height: 100%;
            border: none;
            background-color: #000000;
            position: relative;
            z-index: 1;
            transition: opacity 0.12s ease;
        }

        .artwork-preview-window.text-overlay-preview .preview-iframe {
            box-shadow: none;
            background-color: #000000;
        }

        .artwork-preview-window.text-overlay-preview .preview-iframe-shell {
            flex: 0 0 auto;
            overflow: hidden;
        }
        
        .preview-window-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 10px 15px;
            border-top: 1px solid var(--border-color, #ddd);
            background-color: var(--preview-header-bg, #f5f5f5);
        }
        
        .copy-code-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background-color: var(--bg-color, #fff);
            border: 1px solid var(--border-color, #ddd);
            border-radius: 4px;
            cursor: pointer;
            color: var(--text-color, #333);
        }
        
        .copy-code-btn:hover {
            background-color: var(--button-bg, rgba(127, 127, 127, 0.1));
        }
        
        .close-preview-btn {
            padding: 6px 15px;
            background-color: var(--accent-color, #4f46e5);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .close-preview-btn:hover {
            background-color: var(--accent-color-hover, #3c359e);
        }
        
        .export-png-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background-color: var(--accent-color, #4f46e5);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .export-png-btn:hover {
            background-color: var(--accent-color-hover, #3c359e);
        }
        
        /* Maximized state */
        .artwork-preview-window.maximized {
            border-radius: 0;
            width: 100vw !important;
            height: 100vh !important;
            left: 0 !important;
            top: 0 !important;
        }
        
        /* Export Notification Styles - Theme Compatible */
        .export-notification {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .export-notification-content {
            background-color: var(--bg-color, #ffffff);
            padding: 20px;
            border-radius: 8px;
            max-width: 500px;
            box-shadow: 0 4px 15px var(--db-notification-shadow, rgba(0, 0, 0, 0.2));
            color: var(--text-color, #333);
            border: 1px solid var(--border-color, #e0e0e0);
        }
        
        .export-notification-content h3 {
            margin-top: 0;
            margin-bottom: 10px;
            color: var(--text-color, #333);
            text-align: center;
        }
        
        .export-notification-content p {
            color: var(--text-color, #333);
            text-align: center;
            margin-bottom: 10px;
        }
        
        .export-notification-content ol {
            text-align: left;
            padding-left: 20px;
            color: var(--text-color, #333);
        }
        
        .export-notification-content li {
            color: var(--text-color, #333);
            margin-bottom: 5px;
        }
        
        .export-notification-content ul {
            margin-top: 5px;
        }
        
        .export-notification-content strong {
            color: var(--text-color, #333);
        }
        
        .export-progress {
            height: 4px;
            width: 100%;
            background-color: var(--border-color, #e2e8f0);
            margin-top: 15px;
            border-radius: 2px;
            overflow: hidden;
            position: relative;
        }
        
        .export-progress::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 30%;
            background-color: var(--accent-color, #4f46e5);
            animation: progress 1.5s infinite linear;
        }
        
        @keyframes progress {
            0% { left: -30%; }
            100% { left: 100%; }
        }
        
        .button-container {
            text-align: right;
            margin-top: 15px;
        }
        
        .dismiss-export-btn {
            padding: 8px 16px;
            background-color: var(--accent-color, #4f46e5);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .dismiss-export-btn:hover {
            background-color: var(--accent-color-hover, #3c359e);
        }
        
        /* Syntax highlighting styles - complete set */
        .syntax-tag { color: var(--syntax-tag-color, #22863a); }
        .syntax-attr { color: var(--syntax-attr-color, #6f42c1); }
        .syntax-string { color: var(--syntax-string-color, #032f62); }
        .syntax-comment { color: var(--syntax-comment-color, #6a737d); }
        .syntax-doctype { color: var(--syntax-doctype-color, #6a737d); }
        .syntax-keyword { color: var(--syntax-keyword-color, #d73a49); }
        .syntax-builtin { color: var(--syntax-builtin-color, #005cc5); }
        .syntax-operator { color: var(--syntax-operator-color, #d73a49); }
        .syntax-special-char { color: var(--syntax-special-char-color, #032f62); }
        
        /* Dark mode syntax highlighting */
        @media (prefers-color-scheme: dark) {
            .syntax-tag { color: #7ee787; }
            .syntax-attr { color: #d2a8ff; }
            .syntax-string { color: #a5d6ff; }
            .syntax-comment { color: #8b949e; }
            .syntax-doctype { color: #8b949e; }
            .syntax-keyword { color: #ff7b72; }
            .syntax-builtin { color: #79c0ff; }
            .syntax-operator { color: #ff7b72; }
            .syntax-special-char { color: #79c0ff; }
            
            /* Adjust preview iframe for dark mode content */
            .preview-iframe {
                background-color: #ffffff;
                /* We keep the iframe background white because most generated 
                   content expects a light background */
            }
        }
    `;

    document.head.appendChild(style);
})();