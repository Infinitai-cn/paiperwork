class ArtworkPreviewWindow {
    constructor(generatedCode, title = 'Generated Design', backgroundImage = null, options = null) {

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
        this.overlayData = options?.overlayData || null; // JSON overlay data from AI response
        this.isTextOverlayPreview = this.previewMode === 'overlay' || (!this.previewMode && title.includes('Text Overlay'));
        this.isStyleTransferPreview = this.previewMode === 'style';
        // Never open the preview window maximized by default.
        // Always start un-maximized and use computed dimensions or fallbacks.
        this.shouldStartMaximized = false;
        this.styleTransferCodeSyncTimer = null;
        this.styleTransferImageEditorPanel = null;
        this.styleTransferImageEditorFileInput = null;
        this.styleTransferImageEditorSearchInput = null;
        this.styleTransferImageEditorSearchBtn = null;
        this.styleTransferImageEditorResults = null;
        this.styleTransferImageEditorStatus = null;
        this.styleTransferImageEditorRestoreBtn = null;
        this.styleTransferImageEditorImportBtn = null;
        this.styleTransferImageEditorTarget = null;
        this.styleTransferImageEditorFrameDoc = null;
        this.styleTransferImageOriginalSrcById = {};
        this.styleTransferImageReplacementsById = {};
        this.htmlPreviewLayoutScheduled = false;
        this.htmlPreviewAutoSizeArea = 0;
        this.htmlPreviewReady = false;
        // Cache for fetched assets to avoid repeated network calls during export
        this._assetDataUrlCache = new Map();
        this.htmlPreviewGutterRemoved = false;
        this.htmlPreviewStabilizationToken = 0;
        this.setHtmlPreviewFitToPreview(typeof options?.autoFitHtmlPreview === 'boolean' ? options.autoFitHtmlPreview : true);
        this.position = {
            x: 0,
            y: 0,
            isDragging: false,
            startX: 0,
            startY: 0
        };

        // Canvas preview manager for text overlay editing
        this.canvasPreviewManager = null;

        // Markdown conversion disabled — input is always HTML
        this.isMarkdown = false;

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

    // Detect whether the ArtworksTab requested a Design Rationale view.
    // Prefer explicit API on `window.artworksTab` if available; fall back
    // to button/DOM heuristics or a global flag.
    isDesignRationaleRequested() {
        try {
            if (window.artworksTab && typeof window.artworksTab.isDesignRationaleSelected === 'function') {
                return !!window.artworksTab.isDesignRationaleSelected();
            }

            if (window.__pw_design_rationale_request) {
                return true;
            }

            // Look for common button selectors or text content indicating the control
            const btn = document.querySelector('.design-rationale-btn, .design-rationale, button[data-role="design-rationale"]');
            if (btn) {
                if (btn.classList.contains('active') || btn.classList.contains('pressed') || btn.getAttribute('aria-pressed') === 'true') return true;
                const txt = (btn.textContent || '').trim().toLowerCase();
                if (txt.indexOf('design rationale') !== -1 || txt.indexOf('rationale') !== -1) return true;
            }

            return false;
        } catch (e) {
            return false;
        }
    }

    setHtmlPreviewFitToPreview(enabled) {
        this.autoFitHtmlPreview = !!enabled;
        if (this.debugHtmlPreviewFitToPreview) {
            //console.debug('ArtworkPreviewWindow: setHtmlPreviewFitToPreview called', { enabled: this.autoFitHtmlPreview });
        }
    }
    setDebugHtmlPreviewFitToPreview(enabled) {
        this.debugHtmlPreviewFitToPreview = !!enabled;
        //console.debug('ArtworkPreviewWindow: setDebugHtmlPreviewFitToPreview called', { enabled: this.debugHtmlPreviewFitToPreview });
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
               <div class="preview-iframe-shell">
                   <iframe class="preview-iframe" sandbox="allow-scripts allow-same-origin allow-modals" style="background-color:#000;"></iframe>
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
            <button class="export-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <polyline points="8 12 12 16 16 12"></polyline>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                </svg>
                 ${Lang.get(this.isStyleTransferPreview ? 'artworkExportHTML' : 'artworkExportPNG')}
            </button>
            <button class="close-preview-btn">${Lang.get('artworkClose')}</button>
        </div>
    `;

        // Store the default (maximized) dimensions for the toggle function
        if (this.isTextOverlayPreview && this.sourceImageWidth > 0 && this.sourceImageHeight > 0) {
            // Compute a sensible starting size based on the source image while
            // constraining to the window size so the preview isn't enormous.
            const maxWindowWidth = Math.floor(window.innerWidth * 0.94);
            const maxWindowHeight = Math.floor(window.innerHeight * 0.94);
            const aspect = this.sourceImageWidth / Math.max(1, this.sourceImageHeight);
            let finalWidth = Math.min(maxWindowWidth, Math.round(this.sourceImageWidth));
            let finalHeight = Math.min(maxWindowHeight, Math.round(this.sourceImageHeight));

            // If the image is larger than the available area, scale it down
            if (finalWidth > maxWindowWidth || finalHeight > maxWindowHeight) {
                const widthScale = maxWindowWidth / finalWidth;
                const heightScale = maxWindowHeight / finalHeight;
                const scale = Math.min(widthScale, heightScale, 1);
                finalWidth = Math.max(420, Math.round(finalWidth * scale));
                finalHeight = Math.max(320, Math.round(finalHeight * scale));
            }

            this.container.dataset.prevWidth = `${finalWidth}px`;
            this.container.dataset.prevHeight = `${finalHeight}px`;
            this.container.dataset.prevLeft = `${Math.max(16, Math.round((window.innerWidth - finalWidth) / 2))}px`;
            this.container.dataset.prevTop = `${Math.max(16, Math.round((window.innerHeight - finalHeight) / 2))}px`;
        } else {
            this.container.dataset.prevWidth = '80vw';  // Fallback size when un-maximized
            // Default iframe/container height fallback: prefer large preview canvas
            this.container.dataset.prevHeight = '900px';
            this.container.dataset.prevLeft = '10vw';   // Centered when un-maximized
            this.container.dataset.prevTop = '10vh';
        }

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

        // For text-overlay previews, adjust container and shell heights so the iframe
        // can display the full source image height (accounting for header/footer chrome).
        if (this.isTextOverlayPreview && this.sourceImageWidth > 0 && this.sourceImageHeight > 0) {
            try {
                const prevHeightStr = String(this.container.dataset.prevHeight || '');
                let imageHeight = null;
                const pxMatch = prevHeightStr.match(/^(\d+)px$/);
                if (pxMatch) {
                    imageHeight = Number(pxMatch[1]);
                } else {
                    const num = Number(prevHeightStr);
                    if (!Number.isNaN(num)) imageHeight = num;
                }

                if (imageHeight) {
                    const headerEl = this.container.querySelector('.preview-window-header');
                    const controlsEl = this.container.querySelector('.preview-window-view-controls');
                    const footerEl = this.container.querySelector('.preview-window-footer');
                    const headerH = headerEl ? headerEl.offsetHeight : 0;
                    const controlsH = controlsEl ? controlsEl.offsetHeight : 0;
                    const footerH = footerEl ? footerEl.offsetHeight : 0;
                    const chromeExtra = 16;

                    const totalContainerHeight = imageHeight + headerH + controlsH + footerH + chromeExtra;
                    const maxWindowHeight = Math.floor(window.innerHeight * 0.94);
                    const finalContainerHeight = Math.min(maxWindowHeight, totalContainerHeight);

                    // Apply container height (includes chrome)
                    this.container.style.height = `${finalContainerHeight}px`;

                    // Compute preview shell height (space available for the iframe)
                    const chromeHeight = headerH + controlsH + footerH + chromeExtra;
                    let previewShellHeight = imageHeight;
                    if (finalContainerHeight < totalContainerHeight) {
                        const availableForPreview = Math.max(120, finalContainerHeight - chromeHeight);
                        previewShellHeight = Math.max(120, Math.round(availableForPreview));
                    }

                    if (this.previewFrameShell) {
                        this.previewFrameShell.style.height = `${previewShellHeight}px`;
                    }

                    // Ensure iframe fills the shell
                    if (this.previewFrame) {
                        this.previewFrame.style.height = '100%';
                    }

                    // Store updated prevHeight for toggling/back navigation
                    this.container.dataset.prevHeight = `${finalContainerHeight}px`;
                }
            } catch (err) {
                console.warn('ArtworkPreviewWindow: failed to adjust overlay sizing', err);
            }
        }

        // Note: keep the maximize button for text-overlay previews so users
        // can expand the preview window if desired.

        // Setup event listeners
        this.setupEventListeners();
    }

    scheduleHtmlPreviewLayout() {
        if (this.isTextOverlayPreview || this.isMarkdown || this.htmlPreviewLayoutScheduled || this.currentView !== 'preview') {
            return;
        }

        this.htmlPreviewLayoutScheduled = true;
        const stabilizationToken = ++this.htmlPreviewStabilizationToken;
        requestAnimationFrame(async () => {
            try {
                this.syncHtmlPreviewLayout();
                this.triggerGenericHtmlPreviewResize();
                await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                if (stabilizationToken !== this.htmlPreviewStabilizationToken || this.currentView !== 'preview') {
                    return;
                }

                this.syncHtmlPreviewLayout();
                this.triggerGenericHtmlPreviewResize();
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

    enforceStyleTransferSingleScrollbar(frameDoc) {
        if (!this.isStyleTransferPreview || !frameDoc) {
            return;
        }

        try {
            const docElement = frameDoc.documentElement;
            const body = frameDoc.body;

            if (docElement) {
                docElement.style.overflowX = 'hidden';
                docElement.style.overflowY = 'hidden';
            }

            if (body) {
                body.style.overflowX = 'hidden';
                body.style.overflowY = 'hidden';
            }

            let singleScrollbarStyle = frameDoc.querySelector('style[data-pw-style-transfer-single-scrollbar]');
            if (!singleScrollbarStyle) {
                singleScrollbarStyle = frameDoc.createElement('style');
                singleScrollbarStyle.setAttribute('data-pw-style-transfer-single-scrollbar', 'true');
                singleScrollbarStyle.textContent = 'html, body { overflow-x: hidden !important; overflow-y: hidden !important; }';
                frameDoc.head?.appendChild(singleScrollbarStyle);
            }
        } catch (_error) {
            // Ignore same-document style enforcement errors.
        }
    }
    setGenericHtmlPreviewReady(isReady) {
        if (this.isTextOverlayPreview || this.isMarkdown || !this.previewFrame) {
            return;
        }

        this.htmlPreviewReady = !!isReady;
        this.previewFrame.style.visibility = this.htmlPreviewReady ? 'visible' : 'hidden';
        this.previewFrame.style.opacity = this.htmlPreviewReady ? '1' : '0';
    }

    parseGenericHtmlPreviewSize(htmlSource) {
        if (!htmlSource || typeof htmlSource !== 'string') {
            return null;
        }

        const commentMatch = htmlSource.match(/<!--\s*PREVIEW-SIZE:\s*width=(\d+)(?:\s+height=(\d+))?\s*-->/i);
        const cssWidthMatch = htmlSource.match(/--preview-width:\s*(\d+)px/i);
        const cssHeightMatch = htmlSource.match(/--preview-height:\s*(\d+)px/i);

        const widthValue = commentMatch?.[1]
            || cssWidthMatch?.[1];
        const heightValue = commentMatch?.[2]
            || cssHeightMatch?.[1];

        const width = widthValue ? Number(widthValue) : null;
        const height = heightValue ? Number(heightValue) : null;

        if (!width) {
            return null;
        }

        return {
            width,
            height,
        };
    }

    /**
     * Called when canvas content changes
     */
    onCanvasChange() {
        // Update the code editor with the current canvas content
        if (this.canvasPreviewManager && this.canvasPreviewManager.renderer) {
            if (typeof this.canvasPreviewManager.syncCodeEditorFromCanvas === 'function') {
                this.canvasPreviewManager.syncCodeEditorFromCanvas();
            } else if (this.codeEditor) {
                const canvasData = this.canvasPreviewManager.renderer.getCanvasData();
                this.codeEditor.textContent = canvasData;
            }
        }
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

        const width = contentWidth || viewportWidth;
        const height = contentHeight || viewportHeight;

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

        const measuredWidth = bounds.isScrollablePage ? bounds.viewportWidth : (bounds.contentWidth || bounds.width);
        const measuredHeight = bounds.isScrollablePage ? bounds.viewportHeight : (bounds.contentHeight || bounds.height);
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
            scale = Math.min(maxContentWidth / measuredWidth, maxContentHeight / measuredHeight);
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

        const previewContainer = this.container.querySelector('.preview-preview-view');
        if (!previewContainer) {
            return;
        }

        let availableWidth = Math.max(1, previewContainer.clientWidth);
        let availableHeight = Math.max(1, previewContainer.clientHeight);

        if (this.htmlPreviewSuggestedWidth && !this.container.classList.contains('maximized')) {
            this.autoSizeGenericHtmlPreviewWindow({
                left: 0,
                top: 0,
                width: this.htmlPreviewSuggestedWidth,
                height: this.htmlPreviewSuggestedHeight || availableHeight,
                contentWidth: this.htmlPreviewSuggestedWidth,
                contentHeight: this.htmlPreviewSuggestedHeight || availableHeight,
                viewportWidth: this.htmlPreviewSuggestedWidth,
                viewportHeight: this.htmlPreviewSuggestedHeight || availableHeight,
                isScrollablePage: false,
            });

            // Recompute available space after the preview window is auto-sized.
            availableWidth = Math.max(1, previewContainer.clientWidth);
            availableHeight = Math.max(1, previewContainer.clientHeight);
        }

        // Allow style-transfer previews to be fit-to-shell even if the
        // document looks like a scrollable page (many sections). This keeps
        // generated-style outputs from expanding the preview window and
        // avoids creating a right-side gutter.
        const shouldFitToShell = this.autoFitHtmlPreview && (this.isStyleTransferPreview || !bounds.isScrollablePage) && bounds.contentWidth > 0 && bounds.contentHeight > 0;
        let scale = 1;
        if (shouldFitToShell) {
            const widthScale = availableWidth / bounds.contentWidth;
            const heightScale = availableHeight / bounds.contentHeight;
            scale = Math.min(widthScale, heightScale, 2);
            if (this.debugHtmlPreviewFitToPreview) {
                console.debug('ArtworkPreviewWindow[html] fit-to-preview enabled', {
                    availableWidth,
                    availableHeight,
                    contentWidth: bounds.contentWidth,
                    contentHeight: bounds.contentHeight,
                    widthScale,
                    heightScale,
                    scale,
                });
            }
        } else {
            if (this.debugHtmlPreviewFitToPreview) {
                console.debug('ArtworkPreviewWindow[html] fit-to-preview disabled', {
                    availableWidth,
                    availableHeight,
                    contentWidth: bounds.contentWidth,
                    contentHeight: bounds.contentHeight,
                    isScrollablePage: bounds.isScrollablePage,
                });
            }
        }
        this.previewFrame.style.width = '100%';
        this.previewFrame.style.height = '100%';

        this.previewFrame.style.maxWidth = 'none';
        this.previewFrame.style.maxHeight = 'none';
        this.previewFrame.style.transformOrigin = 'top left';
        this.previewFrame.style.transform = `scale(${scale})`;

        /* console.debug('ArtworkPreviewWindow[html] syncHtmlPreviewLayout', {
            bounds,
            availableWidth,
            availableHeight,
            previewFrameShell: this.previewFrameShell?.getBoundingClientRect(),
            previewFrame: this.previewFrame.getBoundingClientRect(),
        }); */

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

    commitStyleTransferPreviewTextChange(editableId, textValue) {
        if (!this.isStyleTransferPreview || !this.codeEditor) {
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
            // Fallback: serialize live iframe DOM to capture the in-frame edits
            try {
                const iframeDoc = this.previewFrame?.contentDocument || this.previewFrame?.contentWindow?.document;
                if (iframeDoc && iframeDoc.documentElement) {
                    let serialized = this.serializeSourceDocument(iframeDoc, sourceCode);
                    serialized = this.stripPreviewMetadataFromHtml(serialized);
                    this.updateCodeEditorSource(serialized);
                }
            } catch (_e) {}
            return;
        }

        targetElement.textContent = textValue;
        const updatedCode = this.serializeSourceDocument(parsedDoc, sourceCode);
        this.updateCodeEditorSource(updatedCode);
    }
    enableStyleTransferPreviewEditing(frameDoc) {
        if (!this.isStyleTransferPreview || !frameDoc?.body) {
            return;
        }

        const editableElements = this.getTextOverlayEditableElements(frameDoc);
        editableElements.forEach((element, index) => {
            element.dataset.artworkEditableText = 'true';
            element.dataset.artworkEditableTextId = String(index);
            element.contentEditable = 'true';
            element.spellcheck = false;
            element.tabIndex = 0;
            element.style.cursor = 'text';

            if (element.dataset.artworkEditableBound === 'true') {
                return;
            }

            const syncElementText = () => {
                const editableId = element.dataset.artworkEditableTextId;
                const textValue = element.innerText.replace(/\r\n/g, '\n');
                window.clearTimeout(this.styleTransferCodeSyncTimer);
                this.styleTransferCodeSyncTimer = window.setTimeout(() => {
                    this.commitStyleTransferPreviewTextChange(editableId, textValue);
                }, 120);
            };

            element.addEventListener('click', (event) => {
                event.stopPropagation();
                element.focus();
            });
            element.addEventListener('input', syncElementText);
            element.addEventListener('blur', syncElementText);
            element.dataset.artworkEditableBound = 'true';
        });

        this.enableStyleTransferPreviewImageReplacement(frameDoc);
    }

    getStyleTransferImageReplacementTargets(frameDoc) {
        if (!this.isStyleTransferPreview || !frameDoc?.body) {
            return [];
        }

        const iframeWindow = frameDoc.defaultView;
        if (!iframeWindow) {
            return [];
        }

        const images = Array.from(frameDoc.body.querySelectorAll('img'));
        const backgroundElements = Array.from(frameDoc.body.querySelectorAll('*')).filter((element) => {
            if (!(element instanceof iframeWindow.HTMLElement)) {
                return false;
            }

            if (element.tagName === 'IMG') {
                return false;
            }

            const computedStyle = iframeWindow.getComputedStyle(element);
            return computedStyle && computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none';
        });

        return [...images, ...backgroundElements];
    }

    enableStyleTransferPreviewImageReplacement(frameDoc) {
        const targets = this.getStyleTransferImageReplacementTargets(frameDoc);
        targets.forEach((target) => {
            if (!target || target.dataset.artworkStyleTransferImageBound === 'true') {
                return;
            }

            const getEventPath = (event) => {
                if (typeof event.composedPath === 'function') {
                    return event.composedPath();
                }

                const path = [];
                let node = event.target;
                if (node && node.nodeType === Node.TEXT_NODE) {
                    path.push(node);
                    node = node.parentElement;
                }
                while (node) {
                    path.push(node);
                    node = node.parentNode;
                }
                return path;
            };

            const isClickInsideEditableText = (event) => {
                const path = getEventPath(event);
                const currentTarget = event.currentTarget;
                for (const node of path) {
                    if (!node) {
                        continue;
                    }
                    if (node === currentTarget) {
                        break;
                    }
                    if (!(node instanceof HTMLElement)) {
                        continue;
                    }
                    if (node.closest('[data-artwork-editable-text="true"]') || node.isContentEditable) {
                        return true;
                    }
                }

                const clicked = event.target && event.target.nodeType === Node.TEXT_NODE ? event.target.parentElement : event.target;
                return clicked instanceof HTMLElement && clicked.closest('[data-artwork-editable-text="true"]') && clicked !== currentTarget;
            };

            target.style.cursor = 'pointer';
            target.addEventListener('click', (event) => {
                const path = event.composedPath ? event.composedPath() : [event.target];
                const pathInfo = path.map((node) => {
                    if (node instanceof Text) {
                        return `TEXT(${String(node.textContent || '').trim().slice(0, 20)})`;
                    }
                    if (node instanceof HTMLElement) {
                        const tags = [node.tagName];
                        if (node.dataset.artworkEditableText === 'true') {
                            tags.push('editable');
                        }
                        if (node.dataset.pwStyleTransferImageId) {
                            tags.push(`imgId=${node.dataset.pwStyleTransferImageId}`);
                        }
                        if (node.isContentEditable) {
                            tags.push('contentEditable');
                        }
                        return tags.join('[') + (tags.length > 1 ? ']' : '');
                    }
                    return String(node);
                }).join(' > ');
                const clicked = event.target && event.target.nodeType === Node.TEXT_NODE ? event.target.parentElement : event.target;
                const insideEditable = isClickInsideEditableText(event);

                if (insideEditable) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                this.openStyleTransferImageEditorForTarget(target, frameDoc);
            });
            target.dataset.artworkStyleTransferImageBound = 'true';
        });
    }

    openStyleTransferImageEditorForTarget(target, frameDoc) {
        if (!target || !frameDoc || !this.container) {
            return;
        }

        this.clearStyleTransferImageSelectionVisuals();
        const targetId = target.dataset.pwStyleTransferImageId || `pw-style-img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        target.dataset.pwStyleTransferImageId = targetId;
        this.styleTransferImageEditorTarget = target;
        this.styleTransferImageEditorFrameDoc = frameDoc;

        if (!this.styleTransferImageOriginalSrcById[targetId]) {
            if (target.tagName === 'IMG') {
                this.styleTransferImageOriginalSrcById[targetId] = target.getAttribute('src') || target.currentSrc || '';
            } else {
                const computedStyle = frameDoc.defaultView.getComputedStyle(target);
                this.styleTransferImageOriginalSrcById[targetId] = computedStyle && computedStyle.backgroundImage ? computedStyle.backgroundImage : '';
            }
        }

        target.dataset.pwStyleTransferPreviousOutline = target.style.outline || '';
        target.dataset.pwStyleTransferPreviousOutlineOffset = target.style.outlineOffset || '';
        target.style.outline = '3px solid var(--accent-color, #4f46e5)';
        target.style.outlineOffset = '2px';

        this.createStyleTransferImageEditorPanel();
        this.positionStyleTransferImageEditorPanel();
    }

    clearStyleTransferImageSelectionVisuals() {
        if (!this.styleTransferImageEditorTarget) {
            return;
        }

        try {
            const target = this.styleTransferImageEditorTarget;
            target.style.outline = target.dataset.pwStyleTransferPreviousOutline || '';
            target.style.outlineOffset = target.dataset.pwStyleTransferPreviousOutlineOffset || '';
            delete target.dataset.pwStyleTransferPreviousOutline;
            delete target.dataset.pwStyleTransferPreviousOutlineOffset;
        } catch (_error) {
        }

        this.styleTransferImageEditorTarget = null;
    }

    createStyleTransferImageEditorPanel() {
        if (this.styleTransferImageEditorPanel) {
            return;
        }

        const panel = document.createElement('div');
        panel.style.position = 'absolute';
        panel.style.left = '50%';
        panel.style.top = '50%';
        panel.style.transform = 'translate(-50%, -50%)';
        panel.style.width = '320px';
        panel.style.padding = '12px';
        panel.style.borderRadius = '12px';
        panel.style.background = 'var(--panel-background, #1f2937)';
        panel.style.border = '1px solid var(--border-color, #4b5563)';
        panel.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.25)';
        panel.style.zIndex = '10010';
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
        panel.style.gap = '10px';

        const title = document.createElement('div');
        title.textContent = window.Lang ? (Lang.get('replaceImageLabel') || 'Replace image') : 'Replace image';
        title.style.fontWeight = '700';
        title.style.fontSize = '14px';
        title.style.color = 'var(--text-color, #ffffff)';

        const searchRow = document.createElement('div');
        searchRow.style.display = 'flex';
        searchRow.style.alignItems = 'center';
        searchRow.style.gap = '8px';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = window.Lang
            ? (Lang.get('searchImagesPlaceholder') || 'Search images')
            : 'Search images';
        searchInput.style.flex = '1 1 auto';
        searchInput.style.height = '34px';
        searchInput.style.padding = '0 10px';
        searchInput.style.borderRadius = '8px';
        searchInput.style.border = '1px solid var(--border-color, #4b5563)';
        searchInput.style.background = 'var(--background-color, #111827)';
        searchInput.style.color = 'var(--text-color, #ffffff)';
        searchInput.style.outline = 'none';

        const searchBtn = document.createElement('button');
        searchBtn.type = 'button';
        searchBtn.textContent = window.Lang ? (Lang.get('searchButton') || 'Search') : 'Search';
        searchBtn.style.height = '34px';
        searchBtn.style.padding = '0 12px';
        searchBtn.style.borderRadius = '8px';
        searchBtn.style.border = '1px solid transparent';
        searchBtn.style.background = 'var(--accent-color, #4f46e5)';
        searchBtn.style.color = '#ffffff';
        searchBtn.style.cursor = 'pointer';

        searchRow.appendChild(searchInput);
        searchRow.appendChild(searchBtn);

        const info = document.createElement('div');
        info.textContent = window.Lang
            ? (Lang.get('promptableLocalImageOnly') || 'Please choose a valid image file from your computer.')
            : 'Please choose a valid image file from your computer.';
        info.style.fontSize = '12px';
        info.style.lineHeight = '1.4';
        info.style.color = 'var(--text-color, #d1d5db)';

        const status = document.createElement('div');
        status.style.fontSize = '12px';
        status.style.lineHeight = '1.4';
        status.style.color = 'var(--text-color, #ffffff)';
        status.style.minHeight = '18px';
        status.textContent = window.Lang
            ? (Lang.get('clickImageToEdit') || 'Click an image in the presentation to replace it.')
            : 'Click an image in the presentation to replace it.';

        const resultGrid = document.createElement('div');
        resultGrid.style.display = 'grid';
        resultGrid.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
        resultGrid.style.gap = '8px';
        resultGrid.style.maxHeight = '220px';
        resultGrid.style.overflow = 'auto';

        const buttonRow = document.createElement('div');
        buttonRow.style.display = 'flex';
        buttonRow.style.gap = '8px';
        buttonRow.style.flexWrap = 'wrap';

        const restoreBtn = document.createElement('button');
        restoreBtn.type = 'button';
        restoreBtn.textContent = window.Lang ? (Lang.get('restoreOriginalButton') || 'Restore original') : 'Restore original';
        restoreBtn.style.flex = '1 1 auto';
        restoreBtn.style.height = '34px';
        restoreBtn.style.borderRadius = '8px';
        restoreBtn.style.border = '1px solid var(--border-color, #4b5563)';
        restoreBtn.style.background = 'var(--background-color, #111827)';
        restoreBtn.style.color = 'var(--text-color, #ffffff)';
        restoreBtn.style.cursor = 'pointer';

        const importBtn = document.createElement('button');
        importBtn.type = 'button';
        importBtn.textContent = window.Lang ? (Lang.get('importImageButton') || 'Import image') : 'Import image';
        importBtn.style.flex = '1 1 auto';
        importBtn.style.height = '34px';
        importBtn.style.borderRadius = '8px';
        importBtn.style.border = '1px solid transparent';
        importBtn.style.background = 'var(--accent-color, #4f46e5)';
        importBtn.style.color = '#ffffff';
        importBtn.style.cursor = 'pointer';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.textContent = window.Lang ? (Lang.get('closeButton') || 'Close') : 'Close';
        closeBtn.style.flex = '1 1 auto';
        closeBtn.style.height = '34px';
        closeBtn.style.borderRadius = '8px';
        closeBtn.style.border = '1px solid var(--border-color, #4b5563)';
        closeBtn.style.background = 'var(--background-color, #111827)';
        closeBtn.style.color = 'var(--text-color, #ffffff)';
        closeBtn.style.cursor = 'pointer';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';

        buttonRow.appendChild(restoreBtn);
        buttonRow.appendChild(importBtn);
        buttonRow.appendChild(closeBtn);

        panel.appendChild(title);
        panel.appendChild(searchRow);
        panel.appendChild(info);
        panel.appendChild(status);
        panel.appendChild(resultGrid);
        panel.appendChild(buttonRow);
        panel.appendChild(fileInput);

        this.container.appendChild(panel);
        this.styleTransferImageEditorPanel = panel;
        this.styleTransferImageEditorStatus = status;
        this.styleTransferImageEditorSearchInput = searchInput;
        this.styleTransferImageEditorSearchBtn = searchBtn;
        this.styleTransferImageEditorResults = resultGrid;
        this.styleTransferImageEditorFileInput = fileInput;
        this.styleTransferImageEditorRestoreBtn = restoreBtn;
        this.styleTransferImageEditorImportBtn = importBtn;

        searchBtn.addEventListener('click', () => {
            this.searchStyleTransferImagesFromEditor();
        });

        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.searchStyleTransferImagesFromEditor();
            }
        });

        importBtn.addEventListener('click', () => {
            if (!this.styleTransferImageEditorFileInput) {
                return;
            }
            this.styleTransferImageEditorFileInput.value = '';
            this.styleTransferImageEditorFileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            if (!event || !event.target || !event.target.files || !event.target.files[0]) {
                return;
            }
            this.importStyleTransferSelectedImageFromFile(event.target.files[0]);
        });

        restoreBtn.addEventListener('click', () => this.restoreStyleTransferSelectedImage());
        closeBtn.addEventListener('click', () => this.hideStyleTransferImageEditorPanel());
    }

    positionStyleTransferImageEditorPanel() {
        if (!this.styleTransferImageEditorPanel || !this.container) {
            return;
        }

        const containerRect = this.container.getBoundingClientRect();
        if (!containerRect || Number.isNaN(containerRect.width)) {
            return;
        }

        this.styleTransferImageEditorPanel.style.left = '50%';
        this.styleTransferImageEditorPanel.style.top = '50%';
        this.styleTransferImageEditorPanel.style.transform = 'translate(-50%, -50%)';
    }

    hideStyleTransferImageEditorPanel() {
        if (this.styleTransferImageEditorPanel && this.styleTransferImageEditorPanel.parentNode) {
            this.styleTransferImageEditorPanel.parentNode.removeChild(this.styleTransferImageEditorPanel);
        }
        this.styleTransferImageEditorPanel = null;
        this.styleTransferImageEditorStatus = null;
        this.styleTransferImageEditorFileInput = null;
        this.styleTransferImageEditorRestoreBtn = null;
        this.styleTransferImageEditorImportBtn = null;
        this.clearStyleTransferImageSelectionVisuals();
    }

    updateStyleTransferImageEditorStatus(message, type = 'info') {
        if (!this.styleTransferImageEditorStatus) {
            return;
        }
        this.styleTransferImageEditorStatus.textContent = message || '';
        this.styleTransferImageEditorStatus.style.color = type === 'error' ? '#f87171' : 'var(--text-color, #ffffff)';
        this.styleTransferImageEditorStatus.style.opacity = type === 'muted' ? '0.78' : '1';
    }
    getTextOverlayEditableElements(root) {
        const rootDoc = root?.nodeType === Node.DOCUMENT_NODE ? root : root?.ownerDocument;
        const scope = root?.body || root;
        if (!scope || !rootDoc) {
            return [];
        }

        const rootWindow = rootDoc.defaultView || window;
        const HTMLElementClass = rootWindow?.HTMLElement || HTMLElement;
        const allowedInlineChildren = new Set(['SPAN', 'STRONG', 'EM', 'B', 'I', 'A', 'LABEL', 'CODE', 'U', 'SMALL', 'SUB', 'SUP', 'MARK', 'BR']);
        const forbiddenAncestorSelector = 'svg, script, style, noscript';

        const getDirectTextContent = (element) => Array.from(element.childNodes || [])
            .filter((node) => node && node.nodeType === Node.TEXT_NODE)
            .map((node) => String(node.textContent || ''))
            .join('')
            .trim();

        const hasOnlyInlineTextualDescendants = (element) => {
            const children = Array.from(element.children || []);
            if (!children.length) {
                return false;
            }

            const childHTMLElementClass = rootWindow?.HTMLElement || HTMLElement;
            return children.every((child) => {
                if (!(child instanceof childHTMLElementClass)) {
                    return false;
                }

                const childText = (child.textContent || '').trim();
                if (!childText) {
                    return true;
                }

                if (!allowedInlineChildren.has(child.tagName)) {
                    return false;
                }

                return getDirectTextContent(child).length > 0 || hasOnlyInlineTextualDescendants(child);
            });
        };

        const candidates = Array.from(scope.querySelectorAll('*')).filter((element) => {
            const isHtmlElement = element instanceof HTMLElementClass;
            if (!isHtmlElement) {
                return false;
            }

            if (element.closest(forbiddenAncestorSelector)) {
                return false;
            }

            const textContent = (element.textContent || '').trim();
            if (!textContent) {
                return false;
            }

            return getDirectTextContent(element).length > 0 || hasOnlyInlineTextualDescendants(element);
        });

        return candidates.filter((element) => {
            const nearestCandidateAncestor = element.parentElement
                ? candidates.find((candidate) => candidate !== element && candidate.contains(element) && candidate === element.parentElement.closest('*'))
                : null;
            if (!nearestCandidateAncestor) {
                return true;
            }

            return !allowedInlineChildren.has(element.tagName);
        });
    }
    async searchStyleTransferImagesFromEditor() {
        if (!this.styleTransferImageEditorSearchInput) {
            return;
        }

        const query = String(this.styleTransferImageEditorSearchInput.value || '').trim();
        if (!query) {
            this.updateStyleTransferImageEditorStatus(
                window.Lang ? (Lang.get('searchQueryRequired') || 'Enter an image search query.') : 'Enter an image search query.',
                'muted'
            );
            return;
        }

        if (this.styleTransferImageEditorSearchBtn) {
            this.styleTransferImageEditorSearchBtn.disabled = true;
        }

        this.updateStyleTransferImageEditorStatus(
            window.Lang ? (Lang.get('searchingImagesLabel') || 'Searching images...') : 'Searching images...',
            'info'
        );

        try {
            const urls = await this.searchStyleTransferImageUrls(query, 18);
            this.renderStyleTransferImageSearchResults(urls);
            if (!urls.length) {
                this.updateStyleTransferImageEditorStatus(
                    window.Lang ? (Lang.get('webSearchNoResultsFound') || 'No results found') : 'No results found',
                    'muted'
                );
                return;
            }

            this.updateStyleTransferImageEditorStatus(
                window.Lang ? (Lang.get('clickThumbnailToReplace') || 'Click a thumbnail to replace the selected image.') : 'Click a thumbnail to replace the selected image.',
                'info'
            );
        } catch (error) {
            console.error('ArtworkPreviewWindow: Style transfer image search failed', error);
            this.updateStyleTransferImageEditorStatus(String(error && error.message ? error.message : error), 'error');
        } finally {
            if (this.styleTransferImageEditorSearchBtn) {
                this.styleTransferImageEditorSearchBtn.disabled = false;
            }
        }
    }

    async searchStyleTransferImageUrls(query, count = 18) {
        const q = String(query || '').trim();
        if (!q) {
            return [];
        }

        if (window.PromptablePresentation && typeof window.PromptablePresentation.searchPromptableImageUrls === 'function') {
            try {
                return await window.PromptablePresentation.searchPromptableImageUrls(q, count);
            } catch (e) {
                console.warn('ArtworkPreviewWindow: promptable search failed, falling back', e);
            }
        }

        let urls = [];
        try {
            const multiResp = await fetch(`/api/proxy/image-search-multi?q=${encodeURIComponent(q)}`);
            if (multiResp && multiResp.ok) {
                const multiData = await multiResp.json();
                let multiList = [];
                if (Array.isArray(multiData && multiData.images)) {
                    multiList = multiData.images;
                } else if (Array.isArray(multiData && multiData.results)) {
                    multiList = multiData.results;
                } else if (Array.isArray(multiData && multiData.hits)) {
                    multiList = multiData.hits;
                }

                multiList.forEach((entry) => {
                    if (typeof entry === 'string' && /^https?:\/\//i.test(entry)) {
                        urls.push(entry);
                        return;
                    }
                    if (!entry || typeof entry !== 'object') {
                        return;
                    }
                    const candidate = entry.imageUrl || entry.url || entry.src || entry.webformatURL || '';
                    if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate)) {
                        urls.push(candidate);
                    }
                });
            }
        } catch (error) {
            console.warn('ArtworkPreviewWindow: image-search-multi failed', error);
        }

        if (urls.length < count) {
            try {
                const singleResp = await fetch(`/api/proxy/image-search?q=${encodeURIComponent(q)}`);
                if (singleResp && singleResp.ok) {
                    const singleData = await singleResp.json();
                    const extracted = this.extractStyleTransferImageSearchUrls(singleData);
                    urls = urls.concat(extracted);
                }
            } catch (error) {
                console.warn('ArtworkPreviewWindow: image-search fallback failed', error);
            }
        }

        return Array.from(new Set(urls)).filter((url) => /^https?:\/\//i.test(String(url || ''))).slice(0, count);
    }

    extractStyleTransferImageSearchUrls(payload) {
        const urls = [];
        const visit = (value, depth = 0) => {
            if (!value || depth > 6) {
                return;
            }
            if (typeof value === 'string') {
                if (/^https?:\/\//i.test(value)) {
                    urls.push(value);
                }
                return;
            }
            if (Array.isArray(value)) {
                value.forEach((item) => visit(item, depth + 1));
                return;
            }
            if (typeof value === 'object') {
                const candidates = ['imageUrl', 'url', 'src', 'previewURL', 'largeImageURL', 'thumb', 'thumbnail', 'webformatURL'];
                candidates.forEach((key) => {
                    if (typeof value[key] === 'string' && /^https?:\/\//i.test(value[key])) {
                        urls.push(value[key]);
                    }
                });
                Object.values(value).forEach((nested) => visit(nested, depth + 1));
            }
        };
        visit(payload, 0);
        return Array.from(new Set(urls)).filter(Boolean);
    }

    renderStyleTransferImageSearchResults(urls) {
        if (!this.styleTransferImageEditorResults) {
            return;
        }

        this.styleTransferImageEditorResults.innerHTML = '';
        (urls || []).forEach((url) => {
            if (!/^https?:\/\//i.test(String(url || '').trim())) {
                return;
            }
            const proxiedUrl = this.buildStyleTransferProxiedImageUrl(url, true);
            const thumbBtn = document.createElement('button');
            thumbBtn.type = 'button';
            thumbBtn.style.padding = '0';
            thumbBtn.style.borderRadius = '8px';
            thumbBtn.style.border = '1px solid var(--border-color, #4b5563)';
            thumbBtn.style.overflow = 'hidden';
            thumbBtn.style.cursor = 'pointer';
            thumbBtn.style.background = 'var(--background-color, #111827)';
            thumbBtn.style.height = '74px';

            const img = document.createElement('img');
            img.src = proxiedUrl || url;
            img.alt = 'search-result';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';

            thumbBtn.appendChild(img);
            thumbBtn.addEventListener('click', () => {
                this.replaceStyleTransferSelectedImage(url);
            });

            this.styleTransferImageEditorResults.appendChild(thumbBtn);
        });

        this.positionStyleTransferImageEditorPanel();
    }

    async replaceStyleTransferSelectedImage(url) {
        if (!this.styleTransferImageEditorTarget || !url) {
            this.updateStyleTransferImageEditorStatus(
                window.Lang ? (Lang.get('clickImageToEdit') || 'Click an image in the presentation to replace it.') : 'Click an image in the presentation to replace it.',
                'muted'
            );
            return;
        }

        const normalizedUrl = String(url || '').trim();
        if (!/^https?:\/\//i.test(normalizedUrl) && !/^data:/i.test(normalizedUrl)) {
            this.updateStyleTransferImageEditorStatus(
                window.Lang ? (Lang.get('promptableDirectLinkOnly') || 'Only direct image links (http/https) are allowed.') : 'Only direct image links (http/https) are allowed.',
                'error'
            );
            return;
        }

        this.updateStyleTransferImageEditorStatus(
            window.Lang ? (Lang.get('searchingImagesLabel') || 'Searching images...') : 'Searching images...',
            'info'
        );

        let dataUrl = normalizedUrl;
        try {
            dataUrl = await this.fetchStyleTransferImageAsDataUrl(normalizedUrl);
        } catch (error) {
            this.updateStyleTransferImageEditorStatus(String(error && error.message ? error.message : error), 'error');
            return;
        }

        if (!dataUrl) {
            this.updateStyleTransferImageEditorStatus(
                window.Lang ? (Lang.get('promptableLocalImageReadFailed') || 'Failed to read the selected image file.') : 'Failed to read the selected image file.',
                'error'
            );
            return;
        }

        this.applyStyleTransferImageReplacement(dataUrl);
        this.updateStyleTransferImageEditorStatus(
            window.Lang ? (Lang.get('imageReplacedStatus') || 'Image replaced. You can restore the original at any time.') : 'Image replaced. You can restore the original at any time.',
            'info'
        );
    }

    buildStyleTransferProxiedImageUrl(rawUrl, useAbsolute = true) {
        if (window.PromptablePresentation && typeof window.PromptablePresentation.buildPromptableProxiedImageUrl === 'function') {
            return window.PromptablePresentation.buildPromptableProxiedImageUrl(rawUrl, useAbsolute);
        }
        return String(rawUrl || '');
    }

    async fetchStyleTransferImageAsDataUrl(rawUrl, abortSignal = null) {
        if (window.PromptablePresentation && typeof window.PromptablePresentation.fetchPromptableImageAsDataUrl === 'function') {
            return await window.PromptablePresentation.fetchPromptableImageAsDataUrl(rawUrl, abortSignal);
        }

        const value = String(rawUrl || '').trim();
        if (!value) {
            return '';
        }
        if (/^data:/i.test(value)) {
            return value;
        }

        const response = await fetch(value, { signal: abortSignal });
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }
        const blob = await response.blob();
        return await this.blobToDataUrl(blob);
    }

    async importStyleTransferSelectedImageFromFile(file) {
        if (!this.styleTransferImageEditorTarget) {
            this.updateStyleTransferImageEditorStatus(
                window.Lang ? (Lang.get('clickImageToEdit') || 'Click an image in the presentation to replace it.') : 'Click an image in the presentation to replace it.',
                'muted'
            );
            return;
        }

        if (!(file instanceof Blob) || !String(file.type || '').toLowerCase().startsWith('image/')) {
            this.updateStyleTransferImageEditorStatus(
                window.Lang ? (Lang.get('promptableLocalImageOnly') || 'Please choose a valid image file from your computer.') : 'Please choose a valid image file from your computer.',
                'error'
            );
            return;
        }

        this.updateStyleTransferImageEditorStatus(
            window.Lang ? (Lang.get('importingImageLabel') || 'Importing image...') : 'Importing image...',
            'info'
        );

        let dataUrl;
        try {
            dataUrl = await this.blobToDataUrl(file);
        } catch (error) {
            this.updateStyleTransferImageEditorStatus(String(error && error.message ? error.message : error), 'error');
            return;
        }

        if (!dataUrl) {
            this.updateStyleTransferImageEditorStatus(
                window.Lang ? (Lang.get('promptableLocalImageReadFailed') || 'Failed to read the selected image file.') : 'Failed to read the selected image file.',
                'error'
            );
            return;
        }

        this.applyStyleTransferImageReplacement(dataUrl);
        this.updateStyleTransferImageEditorStatus(
            window.Lang ? (Lang.get('imageImportedStatus') || 'Image imported from your computer. You can restore the original at any time.') : 'Image imported from your computer. You can restore the original at any time.',
            'info'
        );
    }

    applyStyleTransferImageReplacement(dataUrl) {
        if (!this.styleTransferImageEditorTarget) {
            return;
        }

        const target = this.styleTransferImageEditorTarget;
        const targetId = target.dataset.pwStyleTransferImageId;
        if (target.tagName === 'IMG') {
            target.setAttribute('src', dataUrl);
            target.removeAttribute('srcset');
            target.src = dataUrl;
        } else {
            target.style.backgroundImage = `url("${dataUrl}")`;
        }

        if (targetId) {
            this.styleTransferImageReplacementsById[targetId] = dataUrl;
        }

        this.commitStyleTransferPreviewImageChange();
    }

    restoreStyleTransferSelectedImage() {
        if (!this.styleTransferImageEditorTarget) {
            this.updateStyleTransferImageEditorStatus(
                window.Lang ? (Lang.get('clickImageToEdit') || 'Click an image in the presentation to replace it.') : 'Click an image in the presentation to replace it.',
                'muted'
            );
            return;
        }

        const target = this.styleTransferImageEditorTarget;
        const targetId = target.dataset.pwStyleTransferImageId;
        const originalSrc = targetId ? this.styleTransferImageOriginalSrcById[targetId] : '';
        if (!originalSrc) {
            this.updateStyleTransferImageEditorStatus(
                window.Lang ? (Lang.get('noOriginalImageStored') || 'No original image stored for this element.') : 'No original image stored for this element.',
                'error'
            );
            return;
        }

        if (target.tagName === 'IMG') {
            target.setAttribute('src', originalSrc);
            target.removeAttribute('srcset');
            target.src = originalSrc;
        } else {
            if (originalSrc === 'none' || !originalSrc) {
                target.style.backgroundImage = '';
            } else {
                target.style.backgroundImage = originalSrc;
            }
        }

        if (targetId) {
            delete this.styleTransferImageReplacementsById[targetId];
        }

        this.commitStyleTransferPreviewImageChange();
        this.updateStyleTransferImageEditorStatus(
            window.Lang ? (Lang.get('imageRestoredStatus') || 'Original image restored.') : 'Original image restored.',
            'info'
        );
    }

    commitStyleTransferPreviewImageChange() {
        if (!(this.isStyleTransferPreview || this.isTextOverlayPreview) || !this.codeEditor || !this.styleTransferImageEditorFrameDoc) {
            return;
        }

        const sourceCode = this.codeEditor.textContent || this.codeEditor.innerText;
        const updatedCode = this.serializeSourceDocument(this.styleTransferImageEditorFrameDoc, sourceCode);
        this.updateCodeEditorSource(updatedCode);
        if (this.currentView === 'preview') {
            this.updatePreview();
        }
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

        const exportBtn = this.container.querySelector('.export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                if (this.isStyleTransferPreview) {
                    this.exportPreviewHtml();
                  } else if (this.isTextOverlayPreview && this.canvasPreviewManager) {
                      // Wait for canvas to be fully initialized before exporting
                    if (this.canvasPreviewManager._initPromise) {
                        await this.canvasPreviewManager._initPromise;
                      }
                      // Use canvas export for text overlay previews
                    await this.canvasPreviewManager.exportCanvas();
                  }
              });
          }
        // Maximize button (may be removed for text-overlay previews)
        const maximizeBtn = this.container.querySelector('.preview-window-maximize-btn');
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => this.toggleMaximize());
        }

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

        // Always treat incoming content as HTML. Preserve as-is.
        let htmlCode = typeof code === 'string' ? code.trim() : String(code);

        // Strip surrounding triple-backtick fences if present (``` or ```html)
        try {
            if (typeof htmlCode === 'string') {
                // Remove BOM if present
                htmlCode = htmlCode.replace(/^\uFEFF/, '');

                // Remove a leading fence line like ```html or ``` (allowing additional backticks and optional language token)
                htmlCode = htmlCode.replace(/^[\s]*`{3,}[ \t]*[^\r\n]*\r?\n/i, '');

                // Remove a trailing fence line like ``` on its own line (handles CRLF/LF)
                htmlCode = htmlCode.replace(/\r?\n[\s]*`{3,}[\s]*$/i, '');

                // Handle the rare case where the closing fence is at the very end without a preceding newline
                htmlCode = htmlCode.replace(/\s*`{3,}\s*$/i, '');

                htmlCode = htmlCode.trim();
            }
        } catch (e) {
            // ignore and fall back to original htmlCode
        }

        // Add background image comments directly to the code in the editor
        if (this.backgroundImage) {
            this.codeEditor.textContent = this.addBackgroundImageComments(htmlCode);
        } else {
            // Set code to editor
            this.codeEditor.textContent = htmlCode;
        }

        // Apply syntax highlighting using CodeStyler
        if (window.CodeStyler) {
            const highlighted = this.highlightCode(this.codeEditor.textContent);
            this.codeEditor.innerHTML = highlighted;
        }

        this.previewDirty = true;
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

    // Remove internal preview-only comments that should never be rendered in the iframe
    stripInternalPreviewComments(code) {
        if (!code || typeof code !== 'string') {
            return code;
        }

        return code.replace(/\/\*[\s\S]*?artworkBackgroundImage(?:Warning|Instructions|Replace)[\s\S]*?\*\//gi, '');
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

    parseOverlayJsonFromEditorText(text) {
        if (!text || typeof text !== 'string') return null;

        const trimmed = text.trim();
        const jsonBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (jsonBlockMatch) {
            try {
                const parsed = JSON.parse(jsonBlockMatch[1].trim());
                if (parsed && parsed.overlay) {
                    return parsed;
                }
            } catch (_e) {
                // Fall through to additional parsing strategies.
            }
        }

        try {
            const parsed = JSON.parse(trimmed);
            if (parsed && parsed.overlay) {
                return parsed;
            }
        } catch (_e) {
            // Fall through to regex object extraction.
        }

        const jsonMatch = trimmed.match(/\{[\s\S]*"overlay"\s*:[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed && parsed.overlay) {
                    return parsed;
                }
            } catch (_e) {
                // Ignore parsing failures and return null.
            }
        }

        return null;
    }

    // Updates the content of the preview iframe based on the current code/editor state
    updatePreview() {
        // If canvas mode is active for text overlay, update the canvas renderer instead
        if (this.isTextOverlayPreview && this.canvasPreviewManager && this.canvasPreviewManager.isCanvasMode) {
            const code = this.codeEditor.textContent || this.codeEditor.innerText;
            if (this.canvasPreviewManager.renderer) {
                const overlayFromEditor = this.parseOverlayJsonFromEditorText(code);
                if (overlayFromEditor) {
                    console.log('ArtworkPreviewWindow[overlay-chain]: updatePreview reloading overlay JSON into canvas renderer', {
                        texts: Array.isArray(overlayFromEditor.overlay?.texts) ? overlayFromEditor.overlay.texts.length : 0,
                        shapes: Array.isArray(overlayFromEditor.overlay?.shapes) ? overlayFromEditor.overlay.shapes.length : 0,
                        lines: Array.isArray(overlayFromEditor.overlay?.lines) ? overlayFromEditor.overlay.lines.length : 0,
                        ornaments: Array.isArray(overlayFromEditor.overlay?.ornaments) ? overlayFromEditor.overlay.ornaments.length : 0
                    });
                    this.overlayData = overlayFromEditor;
                    this.canvasPreviewManager.renderer.loadOverlayData(overlayFromEditor);
                } else if (this.overlayData && this.overlayData.overlay) {
                    console.log('ArtworkPreviewWindow[overlay-chain]: updatePreview preserving existing overlay JSON renderer state');
                    this.canvasPreviewManager.renderer.loadOverlayData(this.overlayData);
                } else {
                    console.error('ArtworkPreviewWindow[overlay-chain]: Overlay mode is JSON-only; HTML fallback disabled');
                }
             }
            return;
         }

        if (!this.previewFrame) return;

        //console.log('ArtworkPreviewWindow: updatePreview called');
        let code = this.codeEditor.textContent || this.codeEditor.innerText;
        code = this.stripInternalPreviewComments(code);
       //console.log('ArtworkPreviewWindow: Raw code from editor:', code.substring(0, 200) + '...');

        // Treat editor content as HTML; no markdown extraction or conversion required

        // Process code for preview
        let processedCode = code;

        // Resolve image placeholders for the live preview without mutating the editable HTML.
        if (this.backgroundImage) {
            processedCode = this.resolveBackgroundImageReferences(processedCode, this.backgroundImage);
        }

        // Continue with normal processing
        this.writeToIframe(processedCode);
    }


    // Writes processed code or HTML to the preview iframe, handling markdown if needed
    writeToIframe(processedCode) {
          // Markdown conversion removed — assume incoming content is HTML and use as-is

        // Strip internal-only preview comments before rendering
        processedCode = this.stripInternalPreviewComments(processedCode);

        // Remove surrounding triple-backtick fences if present (``` or ```html)
        try {
            if (typeof processedCode === 'string') {
                // Remove BOM if present
                processedCode = processedCode.replace(/^\uFEFF/, '');

                // Remove a leading fence line like ```html or ``` (allowing additional backticks and optional language token)
                processedCode = processedCode.replace(/^[\s]*`{3,}[ \t]*[^\r\n]*\r?\n/i, '');

                // Remove a trailing fence line like ``` on its own line (handles CRLF/LF)
                processedCode = processedCode.replace(/\r?\n[\s]*`{3,}[\s]*$/i, '');

                // Handle the rare case where the closing fence is at the very end without a preceding newline
                processedCode = processedCode.replace(/\s*`{3,}\s*$/i, '');

                processedCode = processedCode.trim();
            }
        } catch (e) {
            // If anything goes wrong, fall back to original processedCode
        }

        // Validate that we have valid content
        if (!processedCode || processedCode.trim() === '') {
            console.error('ArtworkPreviewWindow: No content found, aborting preview update');
            return;
        }

        // Track any preview sizing metadata included by the HTML style transfer model output.
        this.htmlPreviewSuggestedWidth = null;
        this.htmlPreviewSuggestedHeight = null;
        const previewSizeHint = this.parseGenericHtmlPreviewSize(processedCode);
        if (previewSizeHint) {
            this.htmlPreviewSuggestedWidth = previewSizeHint.width;
            this.htmlPreviewSuggestedHeight = previewSizeHint.height;
        }

        // Inject a small fonts-ready watcher into the preview HTML so the
        // host can reliably wait for webfonts (e.g., Google Fonts via @import)
        // before capturing/exporting. We avoid duplicating the watcher.
        try {
            if (typeof processedCode === 'string' && processedCode.indexOf('data-pw-fonts-watch') === -1) {
                const watcherScript = `
<script data-pw-fonts-watch>(function(){
    try{
        window.__pwFontsReady = false;
        window.__pwFontsReadyPromise = (function(){
            if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
                return document.fonts.ready.then(function(){ window.__pwFontsReady = true; return true; }).catch(function(){ window.__pwFontsReady = true; return true; });
            }
            return new Promise(function(r){ setTimeout(function(){ window.__pwFontsReady = true; r(true); }, 250); });
        })();

        window.__pwWaitForFonts = async function(timeoutMs){
            try{
                var p = window.__pwFontsReadyPromise || Promise.resolve(true);
                if (typeof timeoutMs === 'number' && timeoutMs > 0) {
                    return Promise.race([p, new Promise(function(res){ setTimeout(function(){ res(false); }, timeoutMs); })]);
                }
                await p;
                return true;
            } catch(e){ return false; }
        };

        (async function(){ try { await window.__pwFontsReadyPromise; try{ document.dispatchEvent(new CustomEvent('pwFontsReady')); }catch(e){} } catch(e){} })();
    }catch(e){}
})();</script>
`;

                if (/<\/head>/i.test(processedCode)) {
                    processedCode = processedCode.replace(/<\/head>/i, watcherScript + '</head>');
                } else if (/<body[^>]*>/i.test(processedCode)) {
                    processedCode = processedCode.replace(/<body([^>]*)>/i, '<body$1>' + watcherScript);
                } else {
                    processedCode = watcherScript + processedCode;
                }
            }
        } catch (_e) {
            // non-fatal: preview should still render without watcher
        }

       //console.log('ArtworkPreviewWindow: Final processed code preview:', processedCode.substring(0, 100) + '...');

        // If this is a style-transfer preview we must render the raw HTML
        // with absolutely minimal intervention. Use `srcdoc` (or fallback
        // to document.write) and return immediately to avoid any
        // normalization, editing hooks, resizing or layout scheduling.
        if (this.isStyleTransferPreview) {
            const previewShell = this.previewFrameShell || this.container.querySelector('.preview-iframe-shell') || this.container.querySelector('.preview-preview-view');
            try {
                // Remove any existing iframe to avoid leftover transforms/styles
                if (this.previewFrame && this.previewFrame.parentNode) {
                    try { this.previewFrame.parentNode.removeChild(this.previewFrame); } catch (_) {}
                }

                const newIframe = document.createElement('iframe');
                newIframe.className = 'preview-iframe';
                newIframe.sandbox = 'allow-scripts allow-same-origin allow-modals';
                // Minimal inline styles to ensure it fills the shell — height will be adjusted to document height on load
                newIframe.style.width = '100%';
                newIframe.style.height = 'auto';
                newIframe.style.border = 'none';
                newIframe.style.display = 'block';
                newIframe.style.position = 'relative';
                newIframe.style.backgroundColor = '#000';
                newIframe.style.left = '';
                newIframe.style.top = '';
                newIframe.style.transform = 'none';
                newIframe.style.visibility = 'visible';
                newIframe.style.opacity = '1';

                if (previewShell) {
                    previewShell.appendChild(newIframe);
                } else {
                    // Fallback: append to container
                    this.container.appendChild(newIframe);
                }

                this.previewFrame = newIframe;

                // Prefer srcdoc to avoid touching the iframe document directly
                try {
                    newIframe.srcdoc = processedCode;
                } catch (e) {
                    const frameDoc = newIframe.contentDocument || newIframe.contentWindow?.document;
                    if (frameDoc) {
                        frameDoc.open();
                        frameDoc.write(processedCode);
                        frameDoc.close();
                    } else {
                        newIframe.setAttribute('srcdoc', processedCode);
                    }
                }

                // When the iframe loads, attempt to size it to its document height so
                // generated HTML can determine the preview height. If the document
                // reports no usable height, fall back to `900px`.
                try {
                    newIframe.addEventListener('load', () => {
                        try {
                            const frameDoc = newIframe.contentDocument || newIframe.contentWindow?.document;
                            if (!frameDoc) return;

                            this.enforceStyleTransferSingleScrollbar(frameDoc);

                            const docEl = frameDoc.documentElement || frameDoc.body;
                            const body = frameDoc.body || {};
                            const docHeight = Math.max(
                                Number(docEl.scrollHeight || 0),
                                Number(body.scrollHeight || 0),
                                Number(docEl.offsetHeight || 0),
                                Number(body.offsetHeight || 0)
                            );

                            const suggested = Number(this.htmlPreviewSuggestedHeight) || 0;
                            const desiredHeight = Math.max(suggested || 0, docHeight || 0) || 900;

                            // Apply measured/fallback heights to iframe and shell
                            try {
                                newIframe.style.height = `${desiredHeight}px`;
                                if (previewShell) previewShell.style.height = `${desiredHeight}px`;
                                // Remember this size as the preview window default for future toggles
                                try { this.container.dataset.prevHeight = `${desiredHeight}px`; } catch (_) {}
                            } catch (_e) {
                                // ignore style application errors
                            }
                            // Enable in-iframe editing for style-transfer previews
                            try {
                                this.enableStyleTransferPreviewEditing(frameDoc);
                                this.setGenericHtmlPreviewReady(true);
                            } catch (editErr) {
                                console.warn('ArtworkPreviewWindow: Failed to enable style-transfer editing', editErr);
                            }
                        } catch (measureErr) {
                            console.warn('ArtworkPreviewWindow: error sizing style-transfer iframe on load', measureErr);
                        }
                    }, { once: true });
                } catch (_e) {
                    // ignore
                }

                this.previewDirty = false;
                this.previewInitialized = true;
            } catch (error) {
                console.error('ArtworkPreviewWindow: Failed to render style-transfer preview raw:', error);
            }

            return;
        }

        // If this is a text-overlay preview, render the raw HTML into a
        // fresh iframe and enable inline editing, but DO NOT run the
        // normalizer, sizing, or layout scheduler. This mirrors the
        // style-transfer behavior while preserving text editing hooks.
        if (this.isTextOverlayPreview) {
            const previewShell = this.previewFrameShell || this.container.querySelector('.preview-iframe-shell') || this.container.querySelector('.preview-preview-view');
            try {
                if (this.previewFrame && this.previewFrame.parentNode) {
                    try { this.previewFrame.parentNode.removeChild(this.previewFrame); } catch (_) {}
                }

                const newIframe = document.createElement('iframe');
                newIframe.className = 'preview-iframe';
                newIframe.sandbox = 'allow-scripts allow-same-origin allow-modals';
                newIframe.style.width = '100%';
                newIframe.style.height = '100%';
                newIframe.style.border = 'none';
                newIframe.style.display = 'block';
                newIframe.style.position = 'relative';
                newIframe.style.backgroundColor = '#000';
                newIframe.style.left = '';
                newIframe.style.top = '';
                newIframe.style.transform = 'none';
                newIframe.style.visibility = 'visible';
                newIframe.style.opacity = '1';

                if (previewShell) {
                    previewShell.appendChild(newIframe);
                } else {
                    this.container.appendChild(newIframe);
                }

                this.previewFrame = newIframe;

                try {
                    newIframe.srcdoc = processedCode;
                } catch (e) {
                    const frameDoc = newIframe.contentDocument || newIframe.contentWindow?.document;
                    if (frameDoc) {
                        frameDoc.open();
                        frameDoc.write(processedCode);
                        frameDoc.close();
                    } else {
                        newIframe.setAttribute('srcdoc', processedCode);
                    }
                }

                try {
                    newIframe.addEventListener('load', () => {
                        try {
                            const frameDoc = newIframe.contentDocument || newIframe.contentWindow?.document;
                            if (!frameDoc) return;

                            // Keep the raw preview layout intact, but still inject
                            // the editor selection styling/bindings required for
                            // single-click box selection and resizing.
                            try {
                                // Inject a minimal editing aid stylesheet to ensure
                                // editable elements are clickable and selectable.
                                try {
                                    const aidStyle = frameDoc.createElement('style');
                                    aidStyle.setAttribute('data-artwork-overlay-aid', 'true');
                                    aidStyle.textContent = `
html, body { background: transparent !important; }
[data-artwork-editable-text] { cursor: text !important; pointer-events: auto !important; -webkit-user-select: text !important; user-select: text !important; }
[data-artwork-editable-text] * { pointer-events: auto !important; }
img, svg, canvas { max-width: 100% !important; height: auto !important; }
`;
                                    try { frameDoc.head?.appendChild(aidStyle); } catch (_) { /*ignore*/ }
                                } catch (_e) {}

                                // Normalize background images in the iframe to avoid
                                // `background-size: cover` cropping for large images.
                                // This is intentionally scoped to text-overlay previews
                                // to preserve author intent for style-transfer outputs.
                                try {
                                    const allElemsForBg = Array.from(frameDoc.querySelectorAll('*'));
                                    let bgCount = 0;
                                    let convertedBgCount = 0;
                                    const urlRegex = /url\((?:"|')?(.*?)(?:"|')?\)/i;
                                    for (const el of allElemsForBg) {
                                        try {
                                            const cs = frameDoc.defaultView.getComputedStyle(el);
                                            if (cs && cs.backgroundImage && cs.backgroundImage !== 'none') {
                                                // Normalize CSS to avoid cover/cropping behavior
                                                el.style.backgroundSize = 'contain';
                                                el.style.backgroundRepeat = 'no-repeat';
                                                el.style.backgroundPosition = 'center center';
                                                el.style.backgroundAttachment = 'scroll';
                                                bgCount++;

                                                // Attempt to convert CSS background-image(url(...))
                                                // into an inline <img> element for more reliable
                                                // measurement and scaling inside the preview.
                                                try {
                                                    const m = cs.backgroundImage.match(urlRegex);
                                                    if (m && m[1]) {
                                                        const url = m[1];
                                                        const bgImg = frameDoc.createElement('img');
                                                        bgImg.setAttribute('data-artwork-bg-img', 'true');
                                                        bgImg.src = url;
                                                        bgImg.style.position = 'absolute';
                                                        bgImg.style.inset = '0';
                                                        bgImg.style.width = '100%';
                                                        bgImg.style.height = '100%';
                                                        bgImg.style.objectFit = 'contain';
                                                        bgImg.style.pointerEvents = 'none';
                                                        bgImg.style.userSelect = 'none';
                                                        bgImg.style.zIndex = '-1';

                                                        // Ensure the element creates a positioned stacking
                                                        // context so the absolute image fills it.
                                                        const pos = cs.position;
                                                        if (!pos || pos === 'static') {
                                                            el.style.position = 'relative';
                                                        }

                                                        // Remove the background-image to avoid double-draw
                                                        try { el.style.backgroundImage = 'none'; } catch (_) {}
                                                        // Ensure overflow hidden so the image is clipped
                                                        try { if (!el.style.overflow || el.style.overflow === 'visible') el.style.overflow = 'hidden'; } catch (_) {}

                                                        // Insert the image as the first child so it sits
                                                        // behind other content in most stacking contexts.
                                                        try { el.insertBefore(bgImg, el.firstChild); } catch (_) {}
                                                        convertedBgCount++;
                                                    }
                                                } catch (_) {}
                                            }
                                        } catch (_) {}
                                    }
                                    if (bgCount) {
                                        try { } catch (_) {}
                                    }
                                    if (convertedBgCount) {
                                        try {} catch (_) {}
                                    }
                                } catch (_) {}

                                // Measure document size and let the iframe render at
                                // natural content dimensions — do not apply any host-side
                                // scaling. This lets us observe the inline <img> behavior
                                // after converting CSS backgrounds to images.
                                try {
                                    const frameDocEl = frameDoc.documentElement || frameDoc.body;
                                    const bodyEl = frameDoc.body || {};

                                    let desiredImageWidth = 0;
                                    let desiredImageHeight = 0;
                                    try {
                                        const imgs = Array.from(frameDoc.images || []);
                                        for (const img of imgs) {
                                            try {
                                                const w = Number(img.naturalWidth || img.clientWidth || 0);
                                                const h = Number(img.naturalHeight || img.clientHeight || 0);
                                                if (w > desiredImageWidth) desiredImageWidth = w;
                                                if (h > desiredImageHeight) desiredImageHeight = h;
                                            } catch (_) {}
                                        }
                                    } catch (_) {}

                                    const docScrollWidth = Math.max(Number(frameDocEl.scrollWidth || 0), Number(bodyEl.scrollWidth || 0));
                                    const docScrollHeight = Math.max(Number(frameDocEl.scrollHeight || 0), Number(bodyEl.scrollHeight || 0));

                                    const desiredContentWidth = Math.max(desiredImageWidth || 0, bgMaxWidth || 0, docScrollWidth || 0);
                                    const desiredContentHeight = Math.max(desiredImageHeight || 0, bgMaxHeight || 0, docScrollHeight || 0);

                                    // Apply natural sizing: let iframe width fill the shell
                                    // and set the iframe height to the document height so
                                    // the full content is visible without scaling.
                                    try {
                                        newIframe.style.width = '100%';
                                        newIframe.style.height = `${Math.max(80, Math.round(desiredContentHeight))}px`;
                                        if (previewShell) {
                                            previewShell.style.height = `${Math.max(80, Math.round(desiredContentHeight))}px`;
                                            previewShell.style.width = '100%';
                                            previewShell.style.overflow = 'auto';
                                        }

                                        const headerEl = this.container.querySelector('.preview-window-header');
                                        const controlsEl = this.container.querySelector('.preview-window-view-controls');
                                        const footerEl = this.container.querySelector('.preview-window-footer');
                                        const headerH = headerEl ? headerEl.offsetHeight : 0;
                                        const controlsH = controlsEl ? controlsEl.offsetHeight : 0;
                                        const footerH = footerEl ? footerEl.offsetHeight : 0;
                                        const chromeExtra = 12;
                                        const maxWindowHeight = Math.floor(window.innerHeight * 0.94);
                                        const finalContainerHeight = Math.min(maxWindowHeight, headerH + controlsH + footerH + chromeExtra + Math.max(80, Math.round(desiredContentHeight)));
                                        this.container.style.height = `${finalContainerHeight}px`;
                                        try { this.container.dataset.prevHeight = `${finalContainerHeight}px`; } catch (_) {}
                                    } catch (_e) {
                                        // ignore style application errors
                                    }

                                    // Collect debug info (no scaling)
                                    try {
                                        let imagesInfo = [];
                                        const imgs2 = Array.from(frameDoc.images || []);
                                        for (const img of imgs2) {
                                            try {
                                                imagesInfo.push({
                                                    src: img.currentSrc || img.src || (img.getAttribute && img.getAttribute('src') || ''),
                                                    naturalWidth: Number(img.naturalWidth || 0),
                                                    naturalHeight: Number(img.naturalHeight || 0),
                                                    clientWidth: Number(img.clientWidth || 0),
                                                    clientHeight: Number(img.clientHeight || 0)
                                                });
                                            } catch (_ignore) {}
                                        }

                                        const containerRect = this.container.getBoundingClientRect();
                                        const iframeRect = newIframe.getBoundingClientRect();
                                        const shellRect = previewShell ? previewShell.getBoundingClientRect() : null;

                                    } catch (_e) {}
                                } catch (_) {}

                                this.normalizeTextOverlayDocument(frameDoc);
                                this.enableTextOverlayPreviewEditing(frameDoc);
                                Promise.resolve().then(async () => {
                                    try {
                                        if (typeof frameDoc.defaultView?.__pwWaitForFonts === 'function') {
                                            await frameDoc.defaultView.__pwWaitForFonts(4000);
                                        }
                                        await this.prepareTextOverlayFontNormalization(frameDoc, processedCode);
                                    } catch (fontWeightError) {
                                        console.warn('ArtworkPreviewWindow: Failed to normalize text-overlay preview font weights', fontWeightError);
                                    }
                                });
                            } catch (editErr) {
                                console.warn('ArtworkPreviewWindow: Failed to enable text-overlay editing', editErr);
                            }
                        } catch (err) {
                            console.warn('ArtworkPreviewWindow: error during text-overlay iframe load', err);
                        }
                    }, { once: true });
                } catch (_e) {
                    // ignore
                }

                this.previewDirty = false;
                this.previewInitialized = true;
            } catch (error) {
                console.error('ArtworkPreviewWindow: Failed to render text-overlay preview raw:', error);
            }

            return;
        }

        // Get iframe document for non-style-transfer flows
        const frameDoc = this.previewFrame.contentDocument || this.previewFrame.contentWindow.document;

        try {
            // Always write HTML content as provided (no markdown wrapping)
            frameDoc.open();
            frameDoc.write(processedCode);
            frameDoc.close();

            if (this.isTextOverlayPreview) {
                try {
                    if (frameDoc.body) {
                        frameDoc.body.style.visibility = 'hidden';
                    }
                } catch (_error) {
                    // ignore if document not ready
                }
                this.normalizeTextOverlayDocument(frameDoc);
                this.enableTextOverlayPreviewEditing(frameDoc);
                Promise.resolve().then(async () => {
                    try {
                        if (typeof frameDoc.defaultView?.__pwWaitForFonts === 'function') {
                            await frameDoc.defaultView.__pwWaitForFonts(4000);
                        }
                        await this.prepareTextOverlayFontNormalization(frameDoc, processedCode);
                    } catch (fontWeightError) {
                        console.warn('ArtworkPreviewWindow: Failed to normalize text-overlay preview font weights', fontWeightError);
                    }
                });
            } else {
                // For generic HTML previews, provide editing hooks for style-transfer and schedule layout when appropriate.
                this.enableStyleTransferPreviewEditing(frameDoc);
                if (this.isStyleTransferPreview) {
                    try {
                        if (this.previewFrame) {
                            this.previewFrame.style.visibility = 'visible';
                            this.previewFrame.style.opacity = '1';
                            this.previewFrame.style.width = '100%';
                            this.previewFrame.style.height = '100%';
                            this.previewFrame.style.transform = 'none';
                            this.previewFrame.style.position = 'relative';
                            this.previewFrame.style.left = '';
                            this.previewFrame.style.top = '';
                            this.previewFrame.style.maxWidth = '';
                            this.previewFrame.style.maxHeight = '';
                        }
                    } catch (_error) {
                        // ignore
                    }
                    this.setGenericHtmlPreviewReady(true);
                } else {
                    this.setGenericHtmlPreviewReady(false);
                    this.scheduleHtmlPreviewLayout();
                }
            }

           //console.log('ArtworkPreviewWindow: Preview updated successfully');
                this.previewDirty = false;
                this.previewInitialized = true;

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
            code.includes('console.log')) {
           //console.log('Detected JavaScript content');
            return 'javascript';
        }

        // Default to markup for unknown types
       //console.log('Could not determine language, defaulting to markup');
        return 'markup';
    }
    // Switches between code and preview views, recreating the iframe for preview mode
    async switchView(view) {
        // Guard: if we're already showing the requested view, skip
        if (view === this.currentView) return;

        // If we're currently waiting for an async init (e.g. canvas load) and the
        // user clicks the *other* view, abort the pending init and switch immediately.
        if (this._viewSwitchPending && view !== this.currentView) {
            this._viewSwitchPending = false;
        }

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
            // Populate code editor with generated code if empty
            if (this.isTextOverlayPreview && this.codeEditor) {
                const existingCode = this.codeEditor.textContent || this.codeEditor.innerText || '';
                if (!existingCode.trim()) {
                    // Use canvas-generated HTML if canvas mode is active, otherwise use generatedCode
                    let codeToDisplay = '';
                    if (this.canvasPreviewManager && this.canvasPreviewManager.isCanvasMode) {
                        codeToDisplay = this.canvasPreviewManager.generateHTMLFromCanvas();
                    } else {
                        codeToDisplay = this.generatedCode || '';
                    }
                    if (codeToDisplay) {
                        this.codeEditor.textContent = codeToDisplay;
                    }
                }
            }
            codeView.classList.add('active');
            previewView.classList.remove('active');
        } else {
            codeView.classList.remove('active');
            previewView.classList.add('active');

            const needsPreviewRefresh = this.previewDirty || !this.previewInitialized;

            // Initialize canvas preview manager for text overlay previews
            if (this.isTextOverlayPreview && !this.canvasPreviewManager) {
                this.canvasPreviewManager = new CanvasPreviewManager(this);
                this.canvasPreviewManager.setOnChange(() => this.onCanvasChange());
            }

            // Initialize canvas mode if needed — wait for async initialization
            let canvasInitPromise = null;
            if (this.isTextOverlayPreview && this.canvasPreviewManager && !this.canvasPreviewManager.isCanvasMode) {
                // Load current code into canvas renderer
                const code = this.codeEditor.textContent || this.codeEditor.innerText;
                // Initialize canvas with background + code (async)
                canvasInitPromise = this.canvasPreviewManager.initialize(code).catch(err => {
                    console.warn('ArtworkPreviewWindow: Canvas initialization failed', err);
                });
            }

            // Wait for canvas initialization to complete before proceeding
            if (canvasInitPromise) {
                this._viewSwitchPending = true;
                try {
                    await canvasInitPromise;
                } finally {
                    this._viewSwitchPending = false;
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
                    newIframe.style.visibility = 'hidden';
                    newIframe.style.opacity = '0';
                } else {
                    newIframe.style.visibility = 'hidden';
                    newIframe.style.opacity = '0';
                }
                newIframe.style.backgroundColor = '#000';

                (previewShell || previewContainer).appendChild(newIframe);
                this.previewFrame = newIframe;
                this.previewDirty = true;
            }

            if (this.isTextOverlayPreview) {
                if (needsPreviewRefresh) {
                    this.textOverlayFrameBounds = null;
                    this.textOverlayPreviewReady = false;
                    if (this.previewFrameShell) {
                        this.previewFrameShell.style.width = '100%';
                        this.previewFrameShell.style.height = '100%';
                    }
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

        // Always copy the current editor content (input is HTML)
        code = this.codeEditor.textContent || this.codeEditor.innerText || '';

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
        // Allow maximizing for all preview types (including text-overlay).
        const isMaximizing = !this.container.classList.contains('maximized');
        const computedStyle = window.getComputedStyle(this.container);

        if (isMaximizing) {
            this.container.dataset.prevWidth = this.container.style.width || computedStyle.width;
            this.container.dataset.prevHeight = this.container.style.height || computedStyle.height;
            this.container.dataset.prevLeft = this.container.style.left || computedStyle.left;
            this.container.dataset.prevTop = this.container.style.top || computedStyle.top;
        }

        this.container.classList.toggle('maximized');

        if (isMaximizing) {
            // Maximize
            this.container.style.width = '100vw';
            this.container.style.height = '100vh';
            this.container.style.left = '0';
            this.container.style.top = '0';
        } else {
            const prevWidth = this.container.dataset.prevWidth || '80vw';
            const prevHeight = this.container.dataset.prevHeight || '900px';
            const prevLeft = this.container.dataset.prevLeft || '10vw';
            const prevTop = this.container.dataset.prevTop || '10vh';

            this.container.style.width = prevWidth;
            this.container.style.height = prevHeight;
            this.container.style.left = prevLeft;
            this.container.style.top = prevTop;
        }

        if (!this.isStyleTransferPreview) {
            this.scheduleHtmlPreviewLayout();
        }
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
    async fetchAssetAsDataUrl(rawSrc, baseUrl) {
        let src = String(rawSrc || '').trim();
        if (!src) return null;

        // Already a data URL
        if (/^data:/i.test(src)) return src;

        // Resolve relative URLs against base
        try {
            src = new URL(src, baseUrl || window.location.href).href;
        } catch (_e) {
            // keep original
        }

        if (this._assetDataUrlCache && this._assetDataUrlCache.has(src)) {
            return this._assetDataUrlCache.get(src);
        }

        // Try to fetch as a blob first (preferred when CORS permits)
        try {
            const response = await fetch(src, { cache: 'force-cache' });
            if (response && response.ok) {
                const blob = await response.blob();
                const dataUrl = await this.blobToDataUrl(blob);
                if (dataUrl) {
                    this._assetDataUrlCache.set(src, dataUrl);
                    return dataUrl;
                }
            } else {
                console.warn(`[fetchAssetAsDataUrl] HTTP ${response?.status || 'unknown'} for ${src}`);
            }
        } catch (_err) {
            // fetch may fail due to CORS or network; fall back to image->canvas approach
            console.warn(`[fetchAssetAsDataUrl] Fetch failed for ${src}: ${_err.message || 'CORS or network error'}`);
        }

        // Fallback: attempt to draw the image into a canvas (requires CORS headers to succeed)
        try {
            const img = await new Promise((resolve, reject) => {
                const image = new Image();
                image.crossOrigin = 'anonymous';
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error('Image load failed'));
                image.src = src;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width || 1;
            canvas.height = img.naturalHeight || img.height || 1;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(img, 0, 0);
            let dataUrl = null;
            try {
                dataUrl = canvas.toDataURL('image/png');
            } catch (err) {
                // toDataURL can fail if the image tainted the canvas (CORS)
                console.warn(`[fetchAssetAsDataUrl] Canvas toDataURL failed for ${src}: CORS restriction or tainted canvas`);
                return null;
            }
            if (dataUrl) {
                this._assetDataUrlCache.set(src, dataUrl);
                return dataUrl;
            }
        } catch (_err) {
            console.warn(`[fetchAssetAsDataUrl] Image load failed for ${src}: ${_err.message || 'Unknown error'}`);
            return null;
        }

        return null;
    }

    async buildStandaloneHtmlWithInlinedAssets(sourceHtml, baseUrl) {
        if (!sourceHtml || typeof sourceHtml !== 'string') return sourceHtml;
        const parser = new DOMParser();
        const doc = parser.parseFromString(sourceHtml, 'text/html');
        if (!doc || !doc.documentElement) return sourceHtml;

        const resolveUrl = (raw, relativeTo) => {
            try {
                return new URL(String(raw || ''), relativeTo || baseUrl || window.location.href).href;
            } catch (_e) {
                return String(raw || '');
            }
        };

        const urlRegex = /url\((?:"|'|)?(.*?)(?:"|'|)?\)/g;

        const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        try {
            // Inline <img> and srcset
            const imgs = Array.from(doc.querySelectorAll('img'));
            for (const img of imgs) {
                try {
                    const srcAttr = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original');
                    if (srcAttr) {
                        const abs = resolveUrl(srcAttr, baseUrl);
                        let dataUrl = this._assetDataUrlCache?.get(abs) || null;
                        if (!dataUrl) dataUrl = await this.fetchAssetAsDataUrl(abs, baseUrl);
                        if (dataUrl) img.setAttribute('src', dataUrl);
                    }

                    const srcset = img.getAttribute('srcset');
                    if (srcset) {
                        const parts = srcset.split(',').map((s) => String(s || '').trim()).filter(Boolean);
                        const newParts = [];
                        for (const part of parts) {
                            const seg = part.split(/\s+/).filter(Boolean);
                            const urlPart = seg[0];
                            const desc = seg.slice(1).join(' ');
                            try {
                                const abs = resolveUrl(urlPart, baseUrl);
                                let d = this._assetDataUrlCache?.get(abs) || null;
                                if (!d) d = await this.fetchAssetAsDataUrl(abs, baseUrl) || urlPart;
                                newParts.push(desc ? `${d} ${desc}` : d);
                            } catch (_e) {
                                newParts.push(part);
                            }
                        }
                        img.setAttribute('srcset', newParts.join(', '));
                    }
                } catch (_e) {
                    // ignore per-image failures
                }
            }

            // Inline <source> elements (picture/video)
            const sources = Array.from(doc.querySelectorAll('source[src], source[srcset]'));
            for (const source of sources) {
                try {
                    const ssrc = source.getAttribute('src');
                    if (ssrc) {
                        const abs = resolveUrl(ssrc, baseUrl);
                        let d = this._assetDataUrlCache?.get(abs) || null;
                        if (!d) d = await this.fetchAssetAsDataUrl(abs, baseUrl);
                        if (d) source.setAttribute('src', d);
                    }
                    const ssrcset = source.getAttribute('srcset');
                    if (ssrcset) {
                        const parts = ssrcset.split(',').map((s) => String(s || '').trim()).filter(Boolean);
                        const newParts = [];
                        for (const part of parts) {
                            const seg = part.split(/\s+/).filter(Boolean);
                            const urlPart = seg[0];
                            const desc = seg.slice(1).join(' ');
                            try {
                                const abs = resolveUrl(urlPart, baseUrl);
                                let d = this._assetDataUrlCache?.get(abs) || null;
                                if (!d) d = await this.fetchAssetAsDataUrl(abs, baseUrl) || urlPart;
                                newParts.push(desc ? `${d} ${desc}` : d);
                            } catch (_e) {
                                newParts.push(part);
                            }
                        }
                        source.setAttribute('srcset', newParts.join(', '));
                    }
                } catch (_e) {}
            }

            // Inline style attributes containing url(...)
            const styledEls = Array.from(doc.querySelectorAll('[style]'));
            for (const el of styledEls) {
                try {
                    let style = el.getAttribute('style') || '';
                    let m;
                    const found = [];
                    while ((m = urlRegex.exec(style)) !== null) {
                        if (m[1]) found.push(m[1]);
                    }
                    for (const raw of found) {
                        try {
                            const abs = resolveUrl(raw, baseUrl);
                            let d = this._assetDataUrlCache?.get(abs) || null;
                            if (!d) d = await this.fetchAssetAsDataUrl(abs, baseUrl) || null;
                            if (d) {
                                const esc = escapeRegExp(raw);
                                style = style.replace(new RegExp(esc, 'g'), d);
                            }
                        } catch (_e) {}
                    }
                    el.setAttribute('style', style);
                } catch (_e) {}
            }

            // Inline <style> blocks
            const styleBlocks = Array.from(doc.querySelectorAll('style'));
            for (const styleEl of styleBlocks) {
                try {
                    let css = styleEl.textContent || '';
                    let m;
                    const found = [];
                    while ((m = urlRegex.exec(css)) !== null) {
                        if (m[1]) found.push(m[1]);
                    }
                    for (const raw of found) {
                        try {
                            const abs = resolveUrl(raw, baseUrl);
                            let d = this._assetDataUrlCache?.get(abs) || null;
                            if (!d) d = await this.fetchAssetAsDataUrl(abs, baseUrl) || null;
                            if (d) {
                                const esc = escapeRegExp(raw);
                                css = css.replace(new RegExp(esc, 'g'), d);
                            }
                        } catch (_e) {}
                    }
                    styleEl.textContent = css;
                } catch (_e) {}
            }

            // Inline linked stylesheets by fetching and replacing url(...) with data URLs
            const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]'));
            for (const link of links) {
                try {
                    const href = link.getAttribute('href');
                    if (!href) continue;
                    const absHref = resolveUrl(href, baseUrl);
                    let cssText = null;
                    try {
                        const resp = await fetch(absHref, { cache: 'force-cache' });
                        if (resp && resp.ok) cssText = await resp.text();
                    } catch (_e) {
                        cssText = null;
                    }
                    if (!cssText) continue;
                    let m;
                    const found = [];
                    while ((m = urlRegex.exec(cssText)) !== null) {
                        if (m[1]) found.push(m[1]);
                    }
                    for (const raw of found) {
                        try {
                            const abs = resolveUrl(raw, absHref);
                            let d = this._assetDataUrlCache?.get(abs) || null;
                            if (!d) d = await this.fetchAssetAsDataUrl(abs, baseUrl) || null;
                            if (d) {
                                const esc = escapeRegExp(raw);
                                cssText = cssText.replace(new RegExp(esc, 'g'), d);
                            }
                        } catch (_e) {}
                    }
                    const styleEl = doc.createElement('style');
                    styleEl.textContent = cssText;
                    link.parentNode?.replaceChild(styleEl, link);
                } catch (_e) {}
            }

            // Inline <image> inside SVG
            const svgImages = Array.from(doc.querySelectorAll('image'));
            for (const svgImage of svgImages) {
                try {
                    const href = svgImage.getAttribute('href') || svgImage.getAttribute('xlink:href');
                    if (!href) continue;
                    const abs = resolveUrl(href, baseUrl);
                    let d = this._assetDataUrlCache?.get(abs) || null;
                    if (!d) d = await this.fetchAssetAsDataUrl(abs, baseUrl) || null;
                    if (d) {
                        svgImage.setAttribute('href', d);
                        svgImage.removeAttribute('xlink:href');
                    }
                } catch (_e) {}
            }

            // Serialize back to HTML string (preserve doctype if present in source)
            return this.serializeSourceDocument(doc, sourceHtml);
        } catch (err) {
            console.error('buildStandaloneHtmlWithInlinedAssets failed:', err);
            return sourceHtml;
        }
    }

    stripPreviewMetadataFromHtml(html) {
        if (!html || typeof html !== 'string') return html;
        try {
            // Remove data- attributes injected by the preview/editor (best-effort)
            // e.g. data-artwork-editable-text, data-artwork-editable-text-id, data-artwork-editable-bound,
            // data-pw-style-transfer-image-id, data-artwork-overlay-normalizer, etc.
            let sanitized = String(html).replace(/\sdata-(?:pw|artwork)[a-zA-Z0-9-_]*=(?:"[^"]*"|'[^']*'|[^\s>]+)/g, '');

            // Remove injected <style> blocks used only for preview adjustments
            sanitized = sanitized.replace(/<style[^>]*data-pw-[^>]*>[\s\S]*?<\/style>/gi, '');
            sanitized = sanitized.replace(/<style[^>]*data-artwork-overlay-normalizer[^>]*>[\s\S]*?<\/style>/gi, '');

            // Strip any pw-only attributes left on elements
            sanitized = sanitized.replace(/\sdata-pw-[a-zA-Z0-9-_]*(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/g, '');

            return sanitized;
        } catch (err) {
            return html;
        }
    }

    async inlineImagesInHtml(sourceHtml, baseUrl) {
        if (!sourceHtml || typeof sourceHtml !== 'string') return sourceHtml;
        const parser = new DOMParser();
        const doc = parser.parseFromString(sourceHtml, 'text/html');
        if (!doc || !doc.documentElement) return sourceHtml;

        const resolveUrl = (raw) => {
            try { return new URL(String(raw || ''), baseUrl || window.location.href).href; } catch (_e) { return String(raw || ''); }
        };

        const urlRegex = /url\((?:"|'|)?(.*?)(?:"|'|)?\)/g;

        let inlineSuccessCount = 0;
        let inlineFailureCount = 0;
        const failedUrls = [];

        try {
            // Inline <img> elements and their srcset attributes
            const imgs = Array.from(doc.querySelectorAll('img'));
            for (const img of imgs) {
                try {
                    const srcAttr = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original');
                    if (srcAttr) {
                        const abs = resolveUrl(srcAttr);
                        let dataUrl = this._assetDataUrlCache?.get(abs) || null;
                        if (!dataUrl) dataUrl = await this.fetchAssetAsDataUrl(abs, baseUrl);
                        if (dataUrl) {
                            img.setAttribute('src', dataUrl);
                            inlineSuccessCount++;
                        } else {
                            inlineFailureCount++;
                            failedUrls.push(abs);
                        }
                    }

                    const srcset = img.getAttribute('srcset');
                    if (srcset) {
                        const parts = srcset.split(',').map((s) => String(s || '').trim()).filter(Boolean);
                        const newParts = [];
                        for (const part of parts) {
                            const seg = part.split(/\s+/).filter(Boolean);
                            const urlPart = seg[0];
                            const desc = seg.slice(1).join(' ');
                            try {
                                const abs = resolveUrl(urlPart);
                                let d = this._assetDataUrlCache?.get(abs) || null;
                                if (!d) d = await this.fetchAssetAsDataUrl(abs, baseUrl) || urlPart;
                                newParts.push(desc ? `${d} ${desc}` : d);
                            } catch (_e) {
                                newParts.push(part);
                            }
                        }
                        img.setAttribute('srcset', newParts.join(', '));
                    }
                } catch (_e) { inlineFailureCount++; }
            }

            // Inline <source> elements used in <picture> or media elements
            const sources = Array.from(doc.querySelectorAll('source[src], source[srcset]'));
            for (const source of sources) {
                try {
                    const ssrc = source.getAttribute('src');
                    if (ssrc) {
                        const abs = resolveUrl(ssrc);
                        let d = this._assetDataUrlCache?.get(abs) || null;
                        if (!d) d = await this.fetchAssetAsDataUrl(abs, baseUrl);
                        if (d) {
                            source.setAttribute('src', d);
                            inlineSuccessCount++;
                        } else {
                            inlineFailureCount++;
                            failedUrls.push(abs);
                        }
                    }
                    const ssrcset = source.getAttribute('srcset');
                    if (ssrcset) {
                        const parts = ssrcset.split(',').map((s) => String(s || '').trim()).filter(Boolean);
                        const newParts = [];
                        for (const part of parts) {
                            const seg = part.split(/\s+/).filter(Boolean);
                            const urlPart = seg[0];
                            const desc = seg.slice(1).join(' ');
                            try {
                                const abs = resolveUrl(urlPart);
                                let d = this._assetDataUrlCache?.get(abs) || null;
                                if (!d) d = await this.fetchAssetAsDataUrl(abs, baseUrl) || urlPart;
                                newParts.push(desc ? `${d} ${desc}` : d);
                            } catch (_e) {
                                newParts.push(part);
                            }
                        }
                        source.setAttribute('srcset', newParts.join(', '));
                    }
                } catch (_e) { inlineFailureCount++; }
            }

            // Inline url(...) in inline style attributes
            const styledEls = Array.from(doc.querySelectorAll('[style]'));
            for (const el of styledEls) {
                try {
                    let style = el.getAttribute('style') || '';
                    if (!style || style.indexOf('url(') === -1) continue;
                    let m;
                    const found = [];
                    while ((m = urlRegex.exec(style)) !== null) {
                        if (m[1]) found.push(m[1]);
                    }
                    for (const raw of found) {
                        try {
                            const abs = resolveUrl(raw);
                            let d = this._assetDataUrlCache?.get(abs) || null;
                            if (!d) d = await this.fetchAssetAsDataUrl(abs, baseUrl) || null;
                            if (d) {
                                style = style.split(raw).join(d);
                                inlineSuccessCount++;
                            } else {
                                inlineFailureCount++;
                                failedUrls.push(abs);
                            }
                        } catch (_e) { inlineFailureCount++; }
                    }
                    el.setAttribute('style', style);
                } catch (_e) { inlineFailureCount++; }
            }

            // Inline url(...) occurrences inside <style> blocks (do not fetch external stylesheets)
            const styleBlocks = Array.from(doc.querySelectorAll('style'));
            for (const styleEl of styleBlocks) {
                try {
                    let css = styleEl.textContent || '';
                    if (!css || css.indexOf('url(') === -1) continue;
                    let m;
                    const found = [];
                    while ((m = urlRegex.exec(css)) !== null) {
                        if (m[1]) found.push(m[1]);
                    }
                    for (const raw of found) {
                        try {
                            const abs = resolveUrl(raw);
                            let d = this._assetDataUrlCache?.get(abs) || null;
                            if (!d) d = await this.fetchAssetAsDataUrl(abs, baseUrl) || null;
                            if (d) {
                                css = css.split(raw).join(d);
                                inlineSuccessCount++;
                            } else {
                                inlineFailureCount++;
                                failedUrls.push(abs);
                            }
                        } catch (_e) { inlineFailureCount++; }
                    }
                    styleEl.textContent = css;
                } catch (_e) { inlineFailureCount++; }
            }

            // Add warning comment if some images failed to inline
            if (inlineFailureCount > 0) {
                const warningComment = `\n<!--\nWARNING: ${inlineFailureCount} image(s) could not be inlined due to CORS restrictions.\nThese images will remain as external URLs in the exported HTML.\nFailed URLs: ${failedUrls.slice(0, 10).join(', ')}${failedUrls.length > 10 ? '...' : ''}\nTo fix this, ensure your images have proper CORS headers or use data URLs directly.\n-->\n`;
                const serialized = this.serializeSourceDocument(doc, sourceHtml);
                return serialized.replace('</head>', warningComment + '</head>');
            }

            return this.serializeSourceDocument(doc, sourceHtml);
        } catch (err) {
            console.error('inlineImagesInHtml failed:', err);
            inlineFailureCount++;
            failedUrls.push('unknown');
            // Return original HTML with error comment
            const warningComment = `\n<!--\nERROR: Failed to inline images. Original HTML returned.\nError: ${err.message || err}\n-->\n`;
            const serialized = this.serializeSourceDocument(doc, sourceHtml);
            return serialized.replace('</head>', warningComment + '</head>');
        }
    }

    async exportPreviewHtml() {
        if (!this.isStyleTransferPreview) {
            return;
        }

        if (this.currentView !== 'preview') {
            this.switchView('preview');
            setTimeout(() => this.exportPreviewHtml(), 500);
            return;
        }

        const sourceHtml = await this.getPreviewExportSourceHtml();
        if (!sourceHtml) {
            console.error('No HTML source available for export.');
            this.showExportInstructions();
            return;
        }

        // Minimal export: take the raw HTML (with edits applied) and inline images only.

        const notification = document.createElement('div');
        notification.className = 'export-notification';
        notification.innerHTML = `
            <div class="export-notification-content">
                <h3>${Lang.get('artworkExportingHTML')}</h3>
                <p>${Lang.get('artworkExportWait')}</p>
                <div class="export-progress"></div>
                <div class="button-container">
                    <button class="dismiss-export-btn" style="display: none;">${Lang.get('artworkClose')}</button>
                </div>
            </div>
        `;
        document.body.appendChild(notification);

        try {
            let saveResult = null;

            // Inline images only into the source HTML provided by the editor (do not alter other markup).
            let finalHtml = sourceHtml;
            try {
                const baseUrl = this.previewFrame?.contentWindow?.location?.href || window.location.href;
                finalHtml = await this.inlineImagesInHtml(sourceHtml, baseUrl);
            } catch (_e) {
                finalHtml = sourceHtml;
            }

            // Check if there are any external image URLs remaining in the HTML
            const externalImageCount = (finalHtml.match(/<img[^>]+src=["'][^"']+\.png["'][^>]*>/gi) || []).length +
                                       (finalHtml.match(/<img[^>]+src=["'][^"']+\.jpg["'][^>]*>/gi) || []).length +
                                       (finalHtml.match(/<img[^>]+src=["'][^"']+\.jpeg["'][^>]*>/gi) || []).length +
                                       (finalHtml.match(/<img[^>]+src=["'][^"']+\.gif["'][^>]*>/gi) || []).length +
                                       (finalHtml.match(/<img[^>]+src=["'][^"']+\.svg["'][^>]*>/gi) || []).length;

            if (externalImageCount > 0) {
                const content = notification.querySelector('.export-notification-content');
                const p = content.querySelector('p');
                if (p) {
                    p.innerHTML = `${Lang.get('artworkExportWait')}<br><small style="color: #f59e0b;">${Lang.get('artworkExportWarningCORS')}</small>`;
                }
            }

            if (window.PromptedPresentationWorkflow && typeof window.PromptedPresentationWorkflow.saveHtmlToDisk === 'function') {
                const title = typeof this.title === 'string' && this.title.trim() ? this.title.trim() : 'design-export';
                saveResult = await window.PromptedPresentationWorkflow.saveHtmlToDisk(title, finalHtml);
            } else {
                const filename = (window.PromptedPresentationWorkflow && typeof window.PromptedPresentationWorkflow.sanitizeHtmlFilename === 'function')
                    ? `${window.PromptedPresentationWorkflow.sanitizeHtmlFilename(this.title || 'design-export')}.html`
                    : `${String(this.title || 'design-export').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '') || 'design-export'}.html`;
                const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = filename;
                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);
                URL.revokeObjectURL(url);
                saveResult = 'saved';
            }

            const content = notification.querySelector('.export-notification-content');
            const h3 = content.querySelector('h3');
            const p = content.querySelector('p');
            const progress = content.querySelector('.export-progress');
            const button = content.querySelector('.dismiss-export-btn');

            h3.textContent = Lang.get('artworkExportSuccessHTML');
            p.textContent = Lang.get('artworkExportDownloadedHTML');
            progress.style.display = 'none';
            button.style.display = 'inline-block';

            button.addEventListener('click', () => notification.remove());
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.remove();
                }
            }, 3000);

            return saveResult;
        } catch (error) {
            console.error('Error exporting HTML:', error);
            this.showExportInstructions(notification);
        }
    }
    // Shows fallback instructions for exporting an image if PNG export fails
    showExportInstructions(existingNotification = null) {
        const notification = existingNotification || document.createElement('div');
        notification.className = 'export-notification';
        notification.innerHTML = `
    <div class="export-notification-content">
        <h3>${Lang.get(this.isStyleTransferPreview ? 'artworkExportHTML' : 'artworkExportPNG')}</h3>
        <p>${Lang.get('artworkExportInstructions')}</p>
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
            inset: 0;
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

        .artwork-preview-window.text-overlay-preview .preview-preview-view.active {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            background-color: #000000;
            overflow: hidden;
        }
        
        .preview-iframe-shell {
            position: relative;
            display: flex;
            flex: 1 1 auto;
            min-width: 0;
            min-height: 0;
            overflow: hidden;
        }

        .preview-iframe {
            display: block;
            flex: 1 1 auto;
            min-width: 0;
            min-height: 0;
            width: auto;
            height: auto;
            border: none;
            background-color: #000000;
            position: relative;
            z-index: 1;
            transition: opacity 0.12s ease;
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

        .artwork-preview-window.text-overlay-preview .preview-iframe {
            box-shadow: none;
            background-color: #000000;
        }

        .artwork-preview-window.text-overlay-preview .preview-iframe-shell {
            flex: 0 0 auto;
            overflow: hidden;
        }

        /* Canvas preview styles */
        .canvas-preview-container {
            position: relative;
            width: 100%;
            height: 100%;
            background-color: #000;
            overflow: hidden;
        }

        .canvas-preview-container canvas {
            display: block;
            width: 100%;
            height: 100%;
        }

        .canvas-controls {
            display: flex;
            gap: 8px;
            padding: 8px;
            background-color: rgba(0, 0, 0, 0.8);
            border-radius: 4px;
        }

        .canvas-control-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background-color: var(--accent-color, #4f46e5);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
        }

        .canvas-control-btn:hover {
            background-color: var(--accent-color-hover, #3c359e);
        }

        .canvas-control-btn svg {
            width: 16px;
            height: 16px;
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
        
        .export-btn {
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
        
        .export-btn:hover {
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

        .font-install-workflow-steps {
            margin: 14px 0 10px;
            display: grid;
            gap: 8px;
        }

        .font-install-step {
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 6px;
            padding: 10px 12px;
            text-align: left;
            background-color: var(--export-step-bg, rgba(127, 127, 127, 0.06));
        }

        .font-install-step[data-state="active"] {
            border-color: var(--export-step-active-border, var(--accent-color, #4f46e5));
            background-color: var(--export-step-active-bg, rgba(79, 70, 229, 0.08));
        }

        .font-install-step[data-state="done"] {
            border-color: var(--export-step-done-border, #1f8b4c);
            background-color: var(--export-step-done-bg, rgba(31, 139, 76, 0.08));
        }

        .font-install-step[data-state="failed"] {
            border-color: var(--export-step-failed-border, #c0392b);
            background-color: var(--export-step-failed-bg, rgba(192, 57, 43, 0.08));
        }

        .font-install-step[data-state="skipped"] {
            opacity: 0.7;
        }

        .font-install-step-title {
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 3px;
            color: var(--text-color, #333);
        }

        .font-install-step-detail {
            font-size: 12px;
            line-height: 1.35;
            color: var(--text-color, #555);
            min-height: 16px;
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

        .font-install-button-row {
            display: flex !important;
            justify-content: flex-end !important;
            align-items: center;
            width: 100%;
            text-align: right;
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

// Expose a global helper so other modules can open the design rationale modal
try {
    window.showDesignRationaleModal = function(rawMarkdown) {
        ArtworkPreviewWindow.showDesignRationale(rawMarkdown);
    };
} catch (e) {
    // ignore
}