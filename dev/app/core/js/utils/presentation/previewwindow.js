
class PreviewWindow {
    constructor({ file, numPages, stageWidth, stageHeight }) {
        this.file = file;
        this.numPages = numPages;
        // Force A4 landscape size for presentations
        this.stageWidth = 1280;
        this.stageHeight = 720;
        this.stages = [];
        this.modal = null;
    }

    open() {
        // Create modal overlay
        this.modal = document.createElement('div');
        this.modal.className = 'presentation-preview-overlay';
        this.modal.style.position = 'fixed';
        this.modal.style.top = '0';
        this.modal.style.left = '0';
        this.modal.style.width = '100vw';
        this.modal.style.height = '100vh';
        // Use theme variable for overlay color and add blur (always apply blur)
        this.modal.style.background = 'var(--modal-overlay-bg, rgba(30,30,30,0.7))';
        this.modal.style.backdropFilter = 'blur(12px)';
        this.modal.style.webkitBackdropFilter = 'blur(12px)';
        this.modal.style.zIndex = '9999';
        this.modal.style.display = 'flex';
        this.modal.style.alignItems = 'center';
        this.modal.style.justifyContent = 'center';

        // Modal content container
        const content = document.createElement('div');
        content.className = 'presentation-preview-window';
        content.style.position = 'relative';
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.width = '100vw';
        content.style.height = '100vh';
        content.style.background = 'var(--background-color, #ffffff)';
        content.style.borderRadius = '0';
        content.style.boxShadow = 'none';
        content.style.overflow = 'hidden';

        // Main body flex row: sidebar left, slides right
        const bodyRow = document.createElement('div');
        bodyRow.style.display = 'flex';
        bodyRow.style.flexDirection = 'row';
        bodyRow.style.width = '100%';
        bodyRow.style.height = 'calc(100vh - 80px)';
        bodyRow.style.alignItems = 'flex-start';
        // Sidebar integration
        let sidebar = null;
        if (window.SlideForgeSidebar) {
            sidebar = new window.SlideForgeSidebar({
                onStyleSelect: async styleKey => {
                    //console.log('[PreviewWindow] Selected style:', styleKey);
                    try {
                        // Ensure any active selectionHelpers are deselected to avoid selectionHelper trying to update removed nodes
                        try {
                            (this.stages || []).forEach(s => { if (s && s._presentationselectionHelper && typeof s._presentationselectionHelper.deselect === 'function') { try { s._presentationselectionHelper.deselect(); } catch(e) {} } });
                        } catch(e) { /* ignore */ }

                        // Only re-render if slides data is available
                        if (this.parsedSlides && this.slideImagesResult && typeof sidebar.renderSelectedStyle === 'function') {
                            await sidebar.renderSelectedStyle(this.stages, this.parsedSlides, this.slideImagesResult);

                            // After applying a new style via Sidebar, re-assign pw_ids so presentation.nodeMap stays in sync
                            try {
                                if (window.presentation && typeof window.presentation.assignPwIdsForStages === 'function') {
                                    try { window.presentation.assignPwIdsForStages(this.stages); } catch(e) { /* ignore */ }
                                }
                            } catch(e) { /* ignore */ }
                        }
                    } catch (e) {
                        console.error('[PreviewWindow] Error in onStyleSelect handler', e);
                    }
                }
            });
            sidebar.render(bodyRow);
            this.sidebar = sidebar;
        }

        // Header with close button
        const header = document.createElement('div');
        header.className = 'presentation-preview-header';
        header.style.width = '100%';
        header.style.height = '80px';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        header.style.padding = '0 32px';
        header.style.boxSizing = 'border-box';
        header.style.background = 'var(--panel-background, #f8f9fa)';
        header.style.borderBottom = '1px solid var(--border-color, #e1e5e9)';
        header.style.zIndex = '10002';
        // Export PDF button
        const exportBtn = document.createElement('button');
        exportBtn.className = 'presentation-export-btn';
    exportBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7 7 7-7"/></svg> ' + (window.Lang ? Lang.get('exportPdf') : 'Export PDF');
        exportBtn.style.display = 'flex';
        exportBtn.style.alignItems = 'center';
        exportBtn.style.gap = '8px';
        // Theme-aware styles using CSS variables (themes.css should override these)
    exportBtn.setAttribute('aria-label', (window.Lang ? Lang.get('exportPdf') : 'Export PDF'));
        exportBtn.style.background = 'var(--presentation-export-bg, var(--accent-color, #007aff))';
        exportBtn.style.color = 'var(--presentation-export-color, var(--modal-text, var(--text-color, #fff)))';
        exportBtn.style.border = '1px solid var(--presentation-export-border, transparent)';
        exportBtn.style.fontWeight = '600';
        exportBtn.style.fontSize = '16px';
        exportBtn.style.padding = '8px 18px';
        exportBtn.style.borderRadius = '8px';
        exportBtn.style.cursor = 'pointer';
        exportBtn.style.boxShadow = 'var(--presentation-export-box-shadow, 0 2px 8px rgba(0,0,0,0.10))';
        exportBtn.style.transition = 'background 0.2s, color 0.2s, box-shadow 0.2s, border-color 0.2s';
        exportBtn.onmouseover = () => {
            exportBtn.style.background = 'var(--presentation-export-hover-bg, var(--accent-color-hover, #005bb5))';
            exportBtn.style.color = 'var(--presentation-export-hover-color, var(--export-text-color-hover, #fff))';
            exportBtn.style.boxShadow = 'var(--presentation-export-hover-box-shadow, 0 4px 16px rgba(0,122,255,0.15))';
            exportBtn.style.borderColor = 'var(--presentation-export-hover-border, transparent)';
        };
        exportBtn.onmouseout = () => {
            exportBtn.style.background = 'var(--presentation-export-bg, var(--accent-color, #007aff))';
            exportBtn.style.color = 'var(--presentation-export-color, var(--modal-text, var(--text-color, #fff)))';
            exportBtn.style.boxShadow = 'var(--presentation-export-box-shadow, 0 2px 8px rgba(0,0,0,0.10))';
            exportBtn.style.borderColor = 'var(--presentation-export-border, transparent)';
        };
        exportBtn.onfocus = () => exportBtn.style.outline = '2px solid var(--presentation-export-focus-outline, rgba(255,255,255,0.9))';
        // Add a small spinner element for export progress feedback
        const spinner = document.createElement('span');
        spinner.className = 'presentation-export-spinner';
        spinner.setAttribute('aria-hidden', 'true');
        spinner.style.display = 'none';
        spinner.style.width = '16px';
        spinner.style.height = '16px';
        spinner.style.borderRadius = '50%';
        spinner.style.border = '2px solid rgba(255,255,255,0.3)';
        spinner.style.borderTopColor = 'rgba(255,255,255,0.95)';
        spinner.style.boxSizing = 'border-box';
        spinner.style.transition = 'opacity 0.12s';
        exportBtn.insertBefore(spinner, exportBtn.firstChild);

        // Ensure minimal CSS for spinner animation and reduced-motion respect
        const styleId = 'preview-export-spinner-styles';
        if (!document.getElementById(styleId)) {
            const styleEl = document.createElement('style');
            styleEl.id = styleId;
            styleEl.textContent = `
                .presentation-export-spinner.spin {
                    animation: pw-export-spin 0.9s linear infinite;
                }

                @keyframes pw-export-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @media (prefers-reduced-motion: reduce) {
                    .presentation-export-spinner.spin { animation: none; }
                }
            `;
            document.head.appendChild(styleEl);
        }

        // Async click handler shows spinner while export runs with robust cleanup and fallback
        exportBtn.onclick = async () => {
            const labelText = (window.Lang ? Lang.get('exportPdf') : 'Export PDF');
            if (!(window.pdfExport && typeof window.pdfExport.exportSlideForgePDF === 'function')) {
                alert(window.Lang ? Lang.get('pdfExportUnavailable') : 'PDF export is not available.');
                return;
            }

            // central cleanup function to restore UI
            const originalInner = exportBtn.innerHTML;
            let fallbackTimer = null;
            const cleanup = (restoreLabel = true) => {
                try {
                    spinner.classList.remove('spin');
                    spinner.style.display = 'none';
                } catch (e) { /* ignore */ }
                try {
                    exportBtn.removeAttribute('aria-busy');
                    exportBtn.disabled = false;
                } catch (e) { /* ignore */ }
                try {
                    if (restoreLabel) exportBtn.innerHTML = originalInner;
                } catch (e) { try { exportBtn.textContent = (window.Lang ? Lang.get('exportPdf') : 'Export PDF'); } catch (_) {} }
            };

            try {
                // show spinner + disable button
                spinner.style.display = '';
                // force reflow to ensure transition if any
                // eslint-disable-next-line no-unused-expressions
                spinner.offsetHeight;
                spinner.classList.add('spin');
                exportBtn.disabled = true;
                exportBtn.setAttribute('aria-busy', 'true');

                // Optionally change text to indicate progress
                exportBtn.innerHTML = '';
                exportBtn.appendChild(spinner);
                const txt = document.createElement('span');
                txt.style.marginLeft = '8px';
                txt.textContent = (window.Lang ? Lang.get('exporting') : 'Exporting...');
                exportBtn.appendChild(txt);

                // Start a fallback timer to ensure spinner is removed in case export doesn't return a promise or hangs
                fallbackTimer = setTimeout(() => {
                    console.warn('[PreviewWindow] PDF export fallback timeout reached; cleaning up UI');
                    cleanup(true);
                }, 30000); // 30s fallback

                // Call export; support both promise and non-promise implementations
                const result = window.pdfExport.exportSlideForgePDF(this.stages, { pdfName: 'presentation.pdf' });
                if (result && typeof result.then === 'function') {
                    await result;
                } else {
                    // Not a promise - wait a short UX-friendly interval then rely on fallback timer
                    await new Promise(r => setTimeout(r, 800));
                }

                // Success - clear fallback and cleanup
                if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
                cleanup(true);
            } catch (e) {
                if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
                cleanup(true);
                console.error('[PreviewWindow] PDF export error', e);
                alert(window.Lang ? Lang.get('pdfExportFailed') : 'PDF export failed.');
            }
        };

        // Header title
        const title = document.createElement('h3');
    title.textContent = (window.Lang ? Lang.get('presentationPreviewTitle') : 'SlideForge Preview');
        title.style.margin = '0 0 0 18px';
        title.style.color = 'var(--text-color, #1a1a1a)';
        title.style.fontSize = '20px';
        title.style.fontWeight = '600';

        // Add export button and title to header (exportBtn left of title)
        const leftHeader = document.createElement('div');
        leftHeader.style.display = 'flex';
        leftHeader.style.alignItems = 'center';
        leftHeader.appendChild(exportBtn);
        leftHeader.appendChild(title);
        header.appendChild(leftHeader);

    
        const closeBtn = document.createElement('button');
        closeBtn.className = 'presentation-close-btn';
        closeBtn.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#fff;font-size:28px;font-weight:bold;line-height:1;">&times;</span>';
        // Use theme CSS variables with sensible fallbacks so icon remains visible in both themes
        closeBtn.style.background = 'var(--presentation-modal-close-bg, var(--error-color, #e53935))';
        closeBtn.style.border = '1px solid var(--presentation-modal-close-border, transparent)';
        closeBtn.style.width = '36px';
        closeBtn.style.height = '36px';
        closeBtn.style.display = 'flex';
        closeBtn.style.alignItems = 'center';
        closeBtn.style.justifyContent = 'center';
        closeBtn.style.fontSize = '28px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.color = 'var(--presentation-modal-close-icon-color, #ffffff)';
        closeBtn.style.padding = '0';
        closeBtn.style.borderRadius = '10px';
        closeBtn.style.boxShadow = 'var(--presentation-modal-close-box-shadow, 0 2px 8px rgba(0,0,0,0.18))';
        closeBtn.style.transition = 'background 0.15s, box-shadow 0.15s, color 0.15s';
        closeBtn.onmouseover = () => {
            closeBtn.style.background = 'var(--presentation-modal-close-hover-bg, #b71c1c)';
            closeBtn.style.boxShadow = 'var(--presentation-modal-close-hover-shadow, 0 4px 16px rgba(229,57,53,0.25))';
            closeBtn.style.color = 'var(--presentation-modal-close-hover-color, var(--presentation-modal-close-icon-color, #ffffff))';
        };
        closeBtn.onmouseout = () => {
            closeBtn.style.background = 'var(--presentation-modal-close-bg, var(--error-color, #e53935))';
            closeBtn.style.boxShadow = 'var(--presentation-modal-close-box-shadow, 0 2px 8px rgba(0,0,0,0.18))';
            closeBtn.style.color = 'var(--presentation-modal-close-icon-color, #ffffff)';
        };
        closeBtn.onclick = () => this.close();
        header.appendChild(closeBtn);
        content.appendChild(header);

        // Scrollable stages container
        const stagesContainer = document.createElement('div');
        stagesContainer.className = 'presentation-preview-content';
        stagesContainer.style.overflowY = 'auto';
        stagesContainer.style.height = '100%';
        stagesContainer.style.marginLeft = '0px';
        stagesContainer.style.width = 'calc(100vw - 340px)';
        stagesContainer.style.padding = '0';
        stagesContainer.style.background = 'var(--app-background, #fafafa)';
        stagesContainer.style.borderRadius = '0 0 0 0';

        // Create Konva stages for each page
        for (let i = 0; i < this.numPages; i++) {
            const stageDiv = document.createElement('div');
            stageDiv.className = 'konva-stage-container';
            stageDiv.style.margin = '24px auto';
            stageDiv.style.background = '#fff';
            stageDiv.style.border = '2px solid #ffffffff';
            //stageDiv.style.borderRadius = '12px';
            stageDiv.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
            stageDiv.style.width = this.stageWidth + 'px';
            stageDiv.style.height = this.stageHeight + 'px';
            stageDiv.style.position = 'relative';

            // Create Konva stage
            if (window.Konva) {
                const stage = new window.Konva.Stage({
                    container: stageDiv,
                    width: this.stageWidth,
                    height: this.stageHeight
                });
                this.stages.push(stage);
                // Add a layer and simple text for demo
                const layer = new window.Konva.Layer();
                const text = new window.Konva.Text({
                    text: `Slide ${i + 1}`,
                    fontSize: 32,
                    x: 40,
                    y: 40,
                    fill: '#333'
                });
                layer.add(text);
                stage.add(layer);

                // Initialize a selectionHelper per stage and wire selection events
                try {
                    const selectionHelper = new window.selectionHelper();
                    selectionHelper.init({ stage, layer });
                    // store selectionHelper reference on stage for later use
                    stage._presentationselectionHelper = selectionHelper;
                    // listen for selection changes
                    selectionHelper.on('selectionChange', payload => {
                        try {
                            // selectionHelper may emit either an array of nodes or an object { selectedNodes, clickedClass }
                            const selectedNodes = (payload && payload.selectedNodes) ? payload.selectedNodes : (Array.isArray(payload) ? payload : (payload ? [payload] : []));
                            const clickedClass = (payload && payload.clickedClass) ? payload.clickedClass : ((selectedNodes && selectedNodes[0] && typeof selectedNodes[0].getClassName === 'function') ? selectedNodes[0].getClassName() : (selectedNodes && selectedNodes[0] && selectedNodes[0].className) || null);

                            //console.log('[PreviewWindow] selectionHelper selectionChange', selectedNodes && selectedNodes.length, 'clickedClass=', clickedClass);

                            const now = Date.now();

                            if (selectedNodes && selectedNodes.length > 0) {
                                // Track origin stage and timestamp
                                try { this._lastSelectionOriginStage = stage; } catch(e) { this._lastSelectionOriginStage = null; }
                                try {
                                    const firstNode = (selectedNodes && selectedNodes[0]) ? selectedNodes[0] : null;
                                    const cls = firstNode && typeof firstNode.getClassName === 'function' ? firstNode.getClassName() : (firstNode && firstNode.className) || null;
                                    this._lastSelectionWasText = (cls === 'Text');
                                } catch(e) { this._lastSelectionWasText = false; }
                                this._lastSelectionTimestamp = now;

                                // Populate presentation.selectedNodes first
                                if (window.presentation && typeof window.presentation.setSelection === 'function') {
                                    try { window.presentation.setSelection(selectedNodes); } catch (e) { /* ignore */ }
                                }

                                // Forward selection payload to Sidebar FIRST so it can set this._lastSelection and decide which controls to show
                                if (this.sidebar && typeof this.sidebar.onSelectionChange === 'function') {
                                    try { this.sidebar.onSelectionChange(payload); } catch (e) { /* ignore */ }
                                }

                                // Decide which tab should be active for this selection
                                let tabKey = 'shape';
                                try {
                                    const firstNode = (selectedNodes && selectedNodes[0]) ? selectedNodes[0] : null;
                                    const cls = firstNode && typeof firstNode.getClassName === 'function' ? firstNode.getClassName() : (firstNode && firstNode.className) || null;
                                    if (cls === 'Text') tabKey = 'text';
                                    else if (cls === 'Image') tabKey = 'picture';
                                } catch (e) { tabKey = 'shape'; }

                                // Activate tab AFTER notifying the sidebar so the tab logic can use the forwarded payload
                                if (this.sidebar && typeof this.sidebar.selectTab === 'function') {
                                    try { this.sidebar.selectTab(tabKey, { preserveSelection: true }); } catch (e) { /* ignore */ }
                                }

                                // After forwarding, clear selections in other stages (leave originating stage selected)
                                try {
                                    const originatingHelper = selectionHelper;
                                    // determine pw id for first selected node (if any)
                                    let originPwId = null;
                                    try {
                                        const fnode = (selectedNodes && selectedNodes[0]) ? selectedNodes[0] : null;
                                        if (fnode && typeof fnode.getAttr === 'function') originPwId = fnode.getAttr('pw_id') || fnode.getAttr('_pwId');
                                    } catch(e) { originPwId = null; }

                                    (this.stages || []).forEach(s2 => {
                                        try {
                                            if (s2 === stage) return; // keep origin
                                            const otherHelper = s2._presentationselectionHelper || s2._presentationSelectionHelper || s2._selectionHelper || null;
                                            if (!otherHelper) return;

                                            // If originPwId exists, only deselect nodes that do not match the origin id
                                            if (originPwId) {
                                                try {
                                                    // find nodes on s2 that share originPwId
                                                    if (s2 && typeof s2.find === 'function') {
                                                        const matched = (s2.find('Text') || []).concat(s2.find('Image') || []).filter(n => {
                                                            try { const id = (typeof n.getAttr === 'function') ? (n.getAttr('pw_id') || n.getAttr('_pwId')) : (n.pw_id || n._PwId); return id === originPwId; } catch(e) { return false; }
                                                        });
                                                        if (matched && matched.length > 0) {
                                                            // other stage contains matching nodes; skip deselect to avoid clearing equivalent logical selection
                                                            return;
                                                        }
                                                    }
                                                } catch(e) { /* ignore */ }
                                            }

                                            // otherwise deselect the other helper
                                            if (otherHelper && typeof otherHelper.deselect === 'function') {
                                                try { otherHelper.deselect(); } catch(e) { /* ignore */ }
                                            }
                                        } catch(e) { /* per-stage ignore */ }
                                    });
                                } catch(e) { console.warn('[PreviewWindow] error clearing other stage selections', e); }

                            } else {
                                // Empty selection — may be legitimate or noisy. Suppress very-recent empty events that immediately follow a non-empty selection from any stage.
                                const age = now - (this._lastSelectionTimestamp || 0);
                                // If there was a recent non-empty selection within threshold, ignore this empty event to avoid UI flip-flop
                                const SUPPRESSION_MS = 250;
                                if (this._lastSelectionTimestamp && age >= 0 && age < SUPPRESSION_MS) {
                                    //console.log('[PreviewWindow] suppressing empty selection because recent non-empty selection exists (age ms):', age);
                                    return;
                                }

                                // Forward empty selection to Sidebar (Sidebar.onSelectionChange will activate the Text tab and show global controls)
                                try {
                                    if (this.sidebar && typeof this.sidebar.onSelectionChange === 'function') {
                                        try { this.sidebar.onSelectionChange({ selectedNodes: [], clickedClass }); } catch(e) { /* ignore */ }
                                    }
                                    //console.log('[PreviewWindow] empty selection forwarded to sidebar (presentation.setSelection skipped)');
                                } catch(e) { /* ignore */ }

                                // If this empty selection comes from the last origin stage (user clicked stage to deselect),
                                // and the last selection was a Text node, then clear presentation.selectedNodes as well so node-level edits no longer act on the old nodes.
                                try {
                                    if (this._lastSelectionOriginStage && stage === this._lastSelectionOriginStage && this._lastSelectionWasText) {
                                        if (window.presentation && typeof window.presentation.setSelection === 'function') {
                                            try { window.presentation.setSelection([]); 
                                                //console.log('[PreviewWindow] cleared presentation.selectedNodes due to user deselect of Text'); 

                                            } catch(e) { /* ignore */ }
                                        }
                                        // reset origin tracking
                                        try { this._lastSelectionOriginStage = null; this._lastSelectionWasText = false; this._lastSelectionTimestamp = 0; } catch(e) {}
                                    }
                                } catch(e) { /* ignore */ }
                            }

                        } catch (e) {
                            console.warn('[PreviewWindow] error handling selectionChange', e);
                        }
                    });
                } catch (e) {
                    console.warn('[PreviewWindow] selectionHelper init failed', e);
                }
            } else {
                // Konva not loaded
                    stageDiv.innerHTML = `<div style="padding:40px;text-align:center;color:#e74c3c;">${(window.Lang ? Lang.get('konvaNotLoaded') : 'Konva.js not loaded')}</div>`;
            }

            stagesContainer.appendChild(stageDiv);
        }

        // Inform presentation module about created stages so global controls can operate on them
        if (window.presentation && typeof window.presentation.setStages === 'function') {
            try {
                window.presentation.setStages(this.stages);
                //console.log('[PreviewWindow] presentation.setStages called with', this.stages.length, 'stages');
            } catch (e) {
                console.warn('[PreviewWindow] Error calling presentation.setStages', e);
            }
        }

        bodyRow.appendChild(stagesContainer);
        content.appendChild(bodyRow);
        this.modal.appendChild(content);
        document.body.appendChild(this.modal);

        this.applySlidesData = async (parsedSlides, slideImagesResult) => {
            this.parsedSlides = parsedSlides;
            this.slideImagesResult = slideImagesResult;
            if (!window.SlideStyles) return;
            // Use sidebar's selected style if available, else fallback to classic
            if (this.sidebar && typeof this.sidebar.renderSelectedStyle === 'function') {
                await this.sidebar.renderSelectedStyle(this.stages, parsedSlides, slideImagesResult);
            } else {
                await window.SlideStyles.applyStyle('classic', this.stages, { parsedSlides, slideImagesResult });
            }

            // After applying style, prefer seeding nodes with parsedSlides _pw ids (if available)
            try {
                try {
                    if (this.parsedSlides && Array.isArray(this.stages)) {
                        for (let si = 0; si < this.stages.length; si++) {
                            try {
                                const stage = this.stages[si];
                                if (!stage || typeof stage.find !== 'function') continue;
                                const texts = stage.find('Text') || [];
                                if (si === 0) {
                                    // cover
                                    const cover = this.parsedSlides.cover || {};
                                    const titleId = (cover._pw && cover._pw.titleId) || (cover._pw && cover._pw.id) || null;
                                    const subtitleId = (cover._pw && cover._pw.subtitleId) || null;
                                    if (texts[0] && titleId) {
                                        try { texts[0].setAttr && texts[0].setAttr('pw_id', titleId); } catch(e) { texts[0].pw_id = titleId; }
                                    }
                                    if (texts[1] && subtitleId) {
                                        try { texts[1].setAttr && texts[1].setAttr('pw_id', subtitleId); } catch(e) { texts[1].pw_id = subtitleId; }
                                    }
                                } else {
                                    const slideIndex = si - 1;
                                    const slideData = (this.parsedSlides && Array.isArray(this.parsedSlides.slides)) ? this.parsedSlides.slides[slideIndex] : null;
                                    if (!slideData) continue;
                                    const titleId = (slideData._pw && slideData._pw.titleId) || (slideData._pw && slideData._pw.id) || null;
                                    if (texts[0] && titleId) {
                                        try { texts[0].setAttr && texts[0].setAttr('pw_id', titleId); } catch(e) { texts[0].pw_id = titleId; }
                                    }
                                    for (let ti = 1; ti < texts.length; ti++) {
                                        try {
                                            const contentIndex = ti - 1;
                                            const contentIds = (slideData._pw && Array.isArray(slideData._pw.contentIds)) ? slideData._pw.contentIds : null;
                                            const cid = (contentIds && contentIds[contentIndex]) ? contentIds[contentIndex] : null;
                                            if (cid) {
                                                try { texts[ti].setAttr && texts[ti].setAttr('pw_id', cid); } catch(e) { texts[ti].pw_id = cid; }
                                            }
                                        } catch(e) { /* per-text ignore */ }
                                    }
                                }
                            } catch(e) { /* per-stage ignore */ }
                        }
                    }
                } catch(e) { /* ignore seeding errors */ }

                // After seeding, call presentation.assignPwIdsForStages to register nodes and generate any missing ids
                if (window.presentation && typeof window.presentation.assignPwIdsForStages === 'function') {
                    try { window.presentation.assignPwIdsForStages(this.stages); } catch(e) { /* ignore */ }
                }
            // Shape edits re-apply removed (shape tab and helpers were removed)
            } catch(e) { /* ignore */ }
            // Build a mapping from pw_id -> source location in parsedSlides so edits can be persisted
            try {
                this._pwIdToSource = this._pwIdToSource || {};
                this._pwIdToSource = {};
                if (this.parsedSlides) {
                    // Stage 0 = cover
                    for (let si = 0; si < this.stages.length; si++) {
                        try {
                            const stage = this.stages[si];
                            if (!stage || typeof stage.find !== 'function') continue;
                            const texts = stage.find('Text') || [];
                            if (si === 0) {
                                // cover: map first text -> cover.title, second -> cover.subtitle (if present)
                                if (texts[0]) {
                                    try { const id = (typeof texts[0].getAttr === 'function') ? (texts[0].getAttr('pw_id') || texts[0].getAttr('_pwId')) : (texts[0].pw_id || texts[0]._pwId); if (id) this._pwIdToSource[id] = { type: 'cover', field: 'title' }; } catch(e) {}
                                }
                                if (texts[1]) {
                                    try { const id = (typeof texts[1].getAttr === 'function') ? (texts[1].getAttr('pw_id') || texts[1].getAttr('_pwId')) : (texts[1].pw_id || texts[1]._pwId); if (id) this._pwIdToSource[id] = { type: 'cover', field: 'subtitle' }; } catch(e) {}
                                }
                            } else {
                                const slideIndex = si - 1;
                                const slideData = (this.parsedSlides && Array.isArray(this.parsedSlides.slides)) ? this.parsedSlides.slides[slideIndex] : null;
                                if (!slideData) continue;
                                // convention: first text node = title, subsequent = slide.content[] in order
                                if (texts[0]) {
                                    try { const id = (typeof texts[0].getAttr === 'function') ? (texts[0].getAttr('pw_id') || texts[0].getAttr('_pwId')) : (texts[0].pw_id || texts[0]._pwId); if (id) this._pwIdToSource[id] = { type: 'slide', slideIndex, field: 'title' }; } catch(e) {}
                                }
                                for (let ti = 1; ti < texts.length; ti++) {
                                    try {
                                        const id = (typeof texts[ti].getAttr === 'function') ? (texts[ti].getAttr('pw_id') || texts[ti].getAttr('_pwId')) : (texts[ti].pw_id || texts[ti]._pwId);
                                        const contentIndex = ti - 1;
                                        if (id) this._pwIdToSource[id] = { type: 'slide', slideIndex, field: 'content', contentIndex };
                                    } catch(e) { }
                                }
                            }
                        } catch(e) { /* per-stage ignore */ }
                    }
                }
                //console.log('[PreviewWindow] built pwId->source mapping, entries=', Object.keys(this._pwIdToSource || {}).length);
                // Notify sidebar to update Change Cover visibility. Images may load asynchronously
                // so attempt immediate and delayed retries to ensure the overlay appears once images are ready.
                try {
                    if (this.sidebar && typeof this.sidebar._updateChangeCoverVisibility === 'function') {
                        try { this.sidebar._updateChangeCoverVisibility(); } catch(e) {}
                        setTimeout(() => { try { this.sidebar._updateChangeCoverVisibility(); } catch(e) {} }, 300);
                        setTimeout(() => { try { this.sidebar._updateChangeCoverVisibility(); } catch(e) {} }, 1000);
                    }
                } catch (e) { /* ignore */ }
            } catch(e) { console.warn('[PreviewWindow] failed to build pwId->source mapping', e); }
        };
        // Expose helper to update parsedSlides by pw_id so edits persist across re-styles/exports
        this.updateParsedSlideText = (pwId, newText) => {
            try {
                if (!pwId) return false;
                if (!this.parsedSlides) return false;
                this._pwIdToSource = this._pwIdToSource || {};
                let meta = this._pwIdToSource[pwId] || null;
                // If mapping missing, try reverse lookup into parsedSlides._pw metadata
                if (!meta && this.parsedSlides) {
                    try {
                        // check cover
                        const cover = this.parsedSlides.cover || null;
                        if (cover && cover._pw) {
                            if (cover._pw.titleId === pwId || cover._pw.id === pwId) meta = { type: 'cover', field: 'title' };
                            else if (cover._pw.subtitleId === pwId) meta = { type: 'cover', field: 'subtitle' };
                        }
                        // check slides
                        if (!meta && Array.isArray(this.parsedSlides.slides)) {
                            for (let si = 0; si < this.parsedSlides.slides.length; si++) {
                                const s = this.parsedSlides.slides[si] || {};
                                if (s._pw) {
                                    if (s._pw.titleId === pwId || s._pw.id === pwId) { meta = { type: 'slide', slideIndex: si, field: 'title' }; break; }
                                    if (Array.isArray(s._pw.contentIds)) {
                                        for (let ci = 0; ci < s._pw.contentIds.length; ci++) {
                                            if (s._pw.contentIds[ci] === pwId) { meta = { type: 'slide', slideIndex: si, field: 'content', contentIndex: ci }; break; }
                                        }
                                        if (meta) break;
                                    }
                                }
                            }
                        }
                        if (meta) this._pwIdToSource[pwId] = meta;
                    } catch (e) { /* ignore reverse lookup errors */ }
                }
                if (!meta) {
                    console.warn('[PreviewWindow] updateParsedSlideText - no mapping for pwId', pwId);
                    return false;
                }
                if (meta.type === 'cover') {
                    if (meta.field === 'title') {
                        this.parsedSlides.cover = this.parsedSlides.cover || {};
                        this.parsedSlides.cover.title = newText;
                    } else if (meta.field === 'subtitle') {
                        this.parsedSlides.cover = this.parsedSlides.cover || {};
                        this.parsedSlides.cover.subtitle = newText;
                    }
                    return true;
                }
                if (meta.type === 'slide') {
                    const sidx = meta.slideIndex;
                    if (!Array.isArray(this.parsedSlides.slides) || !this.parsedSlides.slides[sidx]) return false;
                    if (meta.field === 'title') {
                        this.parsedSlides.slides[sidx].title = newText;
                        try { window.presentationParsedSlidesRef = this.parsedSlides; } catch(e) {}
                        //console.log('[PreviewWindow] updateParsedSlideText - updated slide title', sidx, newText);
                        return true;
                    }
                    if (meta.field === 'content') {
                        const cidx = meta.contentIndex || 0;
                        this.parsedSlides.slides[sidx].content = this.parsedSlides.slides[sidx].content || [];
                        // extend array if needed
                        while (this.parsedSlides.slides[sidx].content.length <= cidx) this.parsedSlides.slides[sidx].content.push('');
                        this.parsedSlides.slides[sidx].content[cidx] = newText;
                        try { window.presentationParsedSlidesRef = this.parsedSlides; } catch(e) {}
                        //console.log('[PreviewWindow] updateParsedSlideText - updated slide content', sidx, cidx, newText);
                        return true;
                    }
                }
                return false;
            } catch (e) {
                console.warn('[PreviewWindow] updateParsedSlideText error', e);
                return false;
            }
        };
        // Expose helper to update parsedSlides/slideImagesResult by pw_id so image edits persist across re-styles/exports
        this.updateParsedSlideImage = (pwId, base64) => {
            try {
                if (!pwId) return false;
                if (!base64) return false;
                this._pwIdToSource = this._pwIdToSource || {};
                let meta = this._pwIdToSource[pwId] || null;
                // If mapping missing, try reverse lookup into parsedSlides._pw metadata
                if (!meta && this.parsedSlides) {
                    try {
                        const cover = this.parsedSlides.cover || null;
                        if (cover && cover._pw) {
                            if (cover._pw.imageId === pwId || cover._pw.id === pwId) meta = { type: 'cover', field: 'image' };
                        }
                        if (!meta && Array.isArray(this.parsedSlides.slides)) {
                            for (let si = 0; si < this.parsedSlides.slides.length; si++) {
                                const s = this.parsedSlides.slides[si] || {};
                                if (s._pw) {
                                    if (s._pw.imageId === pwId || s._pw.id === pwId) { meta = { type: 'slide', slideIndex: si, field: 'image' }; break; }
                                }
                            }
                        }
                        if (meta) this._pwIdToSource[pwId] = meta;
                    } catch (e) { /* ignore reverse lookup errors */ }
                }
                if (!meta) {
                    console.warn('[PreviewWindow] updateParsedSlideImage - no mapping for pwId', pwId);
                    return false;
                }

                // Ensure slideImagesResult exists and is in sync
                this.slideImagesResult = this.slideImagesResult || { coverImage: null, slideImages: [] };

                if (meta.type === 'cover') {
                    // store base64 in slideImagesResult and optionally in parsedSlides metadata
                    this.slideImagesResult.coverImage = base64;
                    try {
                        this.parsedSlides = this.parsedSlides || {};
                        this.parsedSlides.cover = this.parsedSlides.cover || {};
                        // keep a copy reference on parsedSlides for debugging/export
                        this.parsedSlides.cover.imageBase64 = base64;
                    } catch (e) { /* ignore */ }
                    //console.log('[PreviewWindow] updateParsedSlideImage - updated cover image for pwId', pwId);
                    return true;
                }

                if (meta.type === 'slide') {
                    const sidx = meta.slideIndex;
                    // ensure slideImagesResult.slideImages array has the right length
                    this.slideImagesResult.slideImages = this.slideImagesResult.slideImages || [];
                    while (this.slideImagesResult.slideImages.length <= sidx) this.slideImagesResult.slideImages.push(null);
                    this.slideImagesResult.slideImages[sidx] = base64;
                    try {
                        this.parsedSlides = this.parsedSlides || {};
                        if (!Array.isArray(this.parsedSlides.slides)) this.parsedSlides.slides = [];
                        while (this.parsedSlides.slides.length <= sidx) this.parsedSlides.slides.push({ title: '', content: [] });
                        this.parsedSlides.slides[sidx]._pw = this.parsedSlides.slides[sidx]._pw || {};
                        this.parsedSlides.slides[sidx]._pw.imageData = base64;
                    } catch (e) { /* ignore */ }
                    //console.log('[PreviewWindow] updateParsedSlideImage - updated slide image', sidx, 'pwId=', pwId);
                    return true;
                }

                return false;
            } catch (e) {
                console.warn('[PreviewWindow] updateParsedSlideImage error', e);
                return false;
            }
        };
        // Allow external callers to focus/scroll a specific stage in the preview by index.
        this.focusStage = (index) => {
            try {
                if (typeof index !== 'number' || index < 0) return;
                if (!this.modal) return;
                const content = this.modal.querySelector('.presentation-preview-content');
                if (!content) return;
                const items = content.querySelectorAll('.konva-stage-container');
                const el = (items && items[index]) ? items[index] : null;
                if (!el) return;

                // Smoothly scroll the target stage into view and briefly emphasize it
                try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { el.scrollIntoView && el.scrollIntoView(); }
                try {
                    const prev = el.style.boxShadow;
                    el.style.boxShadow = '0 14px 44px rgba(0,0,0,0.36), 0 6px 18px rgba(0,0,0,0.12)';
                    setTimeout(() => { try { el.style.boxShadow = prev || '0 8px 32px rgba(0,0,0,0.15)'; } catch (e) { } }, 700);
                } catch (e) { /* ignore */ }
                // Record last focused stage so sidebar can detect visual focus (not only selection)
                try { this._lastFocusedStage = this.stages[index]; } catch(e) { this._lastFocusedStage = null; }
                // Notify sidebar to re-evaluate visibility (images may be loaded or focus changed)
                try {
                    if (this.sidebar && typeof this.sidebar._updateChangeCoverVisibility === 'function') {
                        try { this.sidebar._updateChangeCoverVisibility(); } catch(e) {}
                        setTimeout(() => { try { this.sidebar._updateChangeCoverVisibility(); } catch(e) {} }, 250);
                        setTimeout(() => { try { this.sidebar._updateChangeCoverVisibility(); } catch(e) {} }, 800);
                    }
                } catch (e) { /* ignore */ }
            } catch (e) {
                console.warn('[PreviewWindow] focusStage error', e);
            }
        };
    }

    close() {
        if (this.modal) {
            document.body.removeChild(this.modal);
            this.modal = null;
        }
        this.stages = [];
        // Ensure presentation module also clears its stages reference
        if (window.presentation && typeof window.presentation.setStages === 'function') {
            try {
                window.presentation.setStages([]);
                //console.log('[PreviewWindow] presentation.setStages called with empty array on close');
            } catch (e) {
                console.warn('[PreviewWindow] Error clearing presentation stages on close', e);
            }
        }
        // Optionally abort AI if not already done
        if (window.SlideForgeAbortController && typeof window.SlideForgeAbortController.abort === 'function') {
            window.SlideForgeAbortController.abort();
        }
    }
}

window.PreviewWindow = PreviewWindow;
// Do NOT instantiate here; let the app create instances as needed.
