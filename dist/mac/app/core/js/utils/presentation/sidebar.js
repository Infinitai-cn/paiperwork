class SlideForgeSidebar {
    constructor({ onStyleSelect }) {
        //console.log('[Sidebar] constructor called');
        this.selectedStyle = 'classic';
        this.onStyleSelect = onStyleSelect;
        this.sidebar = null;
    }

    injectStyles() {
        if (document.getElementById('presentation-sidebar-styles')) {
            //console.log('[Sidebar] Styles already injected');
            return;
        }
        //console.log('[Sidebar] Injecting styles');
        const style = document.createElement('style');
        style.id = 'presentation-sidebar-styles';
        style.textContent = `
            .presentation-sidebar {
                position: fixed;
                top: 100px;
                left: 32px;
                width: 300px;
                height: calc(100vh - 120px);
                background: var(--panel-background, #f8f9fa);
                display: flex;
                flex-direction: column;
                padding: 32px 24px 24px 24px;
                box-sizing: border-box;
                border-radius: 18px;
                border: 1.5px solid var(--border-color, #e1e5e9);
                box-shadow: 0 8px 32px rgba(0,0,0,0.18);
                z-index: 10010;
                overflow-y: auto;
            }
            .presentation-preview-content {
                margin-left: 340px !important;
                transition: margin-left 0.2s;
            }
            .sidebar-tabs {
                display: flex;
                flex-direction: row;
                gap: 6px;
                margin-bottom: 20px;
                padding: 4px;
                border-radius: 16px;
                background: var(--sidebar-tabbar-bg, linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%));
                box-shadow: 0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.2);
                z-index: 10020;
                position: relative;
            }
            .sidebar-tab {
                flex: 1 1 0;
                min-width: 0;
                text-align: center;
                font-size: 13px;
                font-weight: 600;
                color: var(--sidebar-tab-color, #64748b);
                background: transparent;
                border: none;
                outline: none;
                padding: 8px 12px;
                height: auto;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 10021;
                position: relative;
                overflow: hidden;
            }
            .sidebar-tab:hover {
                background: var(--sidebar-tab-hover-bg, rgba(59, 130, 246, 0.08));
                color: var(--sidebar-tab-hover-color, #3b82f6);
                transform: translateY(-1px);
            }
            .sidebar-tab.selected {
                background: var(--sidebar-tab-selected-bg, linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%));
                color: var(--sidebar-tab-selected-color, #ffffff);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 2px 4px rgba(0,0,0,0.1);
                transform: translateY(-2px);
            }
            .sidebar-tab.selected::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%);
                border-radius: 12px;
                pointer-events: none;
            }
            .sidebar-tab-content { display: none; }
            .sidebar-tab-content.active { display: block; }
            .sidebar-title {
                font-size: 18px;
                font-weight: 600;
                color: var(--text-color, #1a1a1a);
                margin-bottom: 24px;
                text-align: center;
            }
            @media (prefers-color-scheme: dark) {
                .sidebar-tabs {
                    background: var(--sidebar-tabbar-bg, linear-gradient(135deg, #1e293b 0%, #0f172a 100%));
                    box-shadow: 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
                }
                /* Ensure the main sidebar background also adapts to dark mode */
                .presentation-sidebar {
                    background: var(--panel-background, #1e1e1e);
                    border: 1.5px solid var(--border-color, #404040);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                }
                .sidebar-tab {
                    color: var(--sidebar-tab-color, #94a3b8);
                }
                .sidebar-tab:hover {
                    background: var(--sidebar-tab-hover-bg, rgba(56, 189, 248, 0.15));
                    color: var(--sidebar-tab-hover-color, #38bdf8);
                }
                .sidebar-tab.selected {
                    background: var(--sidebar-tab-selected-bg, linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%));
                    color: var(--sidebar-tab-selected-color, #ffffff);
                    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4), 0 2px 4px rgba(0,0,0,0.2);
                }
            }
            .sidebar-style-card {
                width: 100%;
                height: 80px;
                margin-bottom: 16px;
                background: var(--background-color, #ffffff);
                border: 2px solid var(--border-color, #e1e5e9);
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                font-weight: 600;
                color: var(--text-color, #1a1a1a);
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                position: relative;
                overflow: hidden;
            }
            .sidebar-style-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                border-color: var(--accent-color, #4f46e5);
            }
            .sidebar-style-card.selected {
                border: 2.5px solid #2563eb; /* blue border for light mode */
                background: var(--accent-color-light, #f0f4ff);
                color: var(--accent-color, #4f46e5);
                box-shadow: 0 8px 24px rgba(79, 70, 229, 0.15);
            }
            .sidebar-style-card.classic {
                background: linear-gradient(135deg, #ffffff 0%, #1264b6ff 100%);
                border-color: #3b3d40ff;
            }
            .sidebar-style-card.purple-glass {
                background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
                color: #ffffff;
                border-color: #8b5cf6;
            }
            .sidebar-style-card.brutalist {
                background: linear-gradient(135deg, #ffffffff 0%, #f70727ff 100%);
                color: #ffffff;
                border-color: #404040;
                font-family: 'Courier New', monospace;
            }
            .sidebar-style-card.corporate {
                background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
                color: #ffffff;
                border-color: #1e40af;
            }
            .sidebar-style-card.wilderness {
                background: linear-gradient(135deg, #4ade80 0%, #166534 100%);
                color: #fff;
                border-color: #166534;
                font-family: 'Montserrat', Arial;
            }
            .sidebar-style-card.enchanted {
                background: linear-gradient(135deg, #e12ae4ff 0%, #5b054fff 100%);
                color: #fff;
                border-color: #0ea5e9;
                font-family: 'Roboto Mono', monospace;
            }
            .sidebar-style-card.sophie {
                background: linear-gradient(135deg, #f25e94ff 0%, #f7d0e8ff 100%);
                color: #fff;
                border-color: #ae00b1ff;
                font-family: 'Roboto Mono', monospace;
            }
            .sidebar-style-card.darkmode {
                background: linear-gradient(135deg, #18181b 0%, #27272a 100%);
                color: #f4f4f5;
                border-color: #27272a;
            }
            .sidebar-style-card.lightmode {
                background: linear-gradient(135deg, #cbcbdcff 0%, #e6e6f5ff 100%);
                color: #313134ff;
                border-color: #27272a;
            }
            .sidebar-style-card.product {
                background: linear-gradient(135deg, #fbbf24 0%, #f59e42 100%);
                color: #fff;
                border-color: #f59e42;
                font-family: 'Montserrat', Arial;
            }
            .sidebar-style-card.finance {
                background: linear-gradient(135deg, #10b981 0%, #155e75 100%);
                color: #fff;
                border-color: #10b981;
                font-family: 'Montserrat', Arial;
            }
            .sidebar-style-card.data {
                background: linear-gradient(135deg, #312e81 0%, #06b6d4 100%);
                color: #fff;
                border-color: #06b6d4;
                font-family: 'Montserrat', Arial;
            }
            .sidebar-style-card.hobby {
                background: linear-gradient(135deg, #fbbf24 0%, #a16207 100%);
                color: #fff;
                border-color: #fbbf24;
                font-family: 'Montserrat', Arial;
            }
            .sidebar-style-card.pets {
                background: linear-gradient(135deg, #fbbfca 0%, #fef08a 100%);
                color: #7c3aed;
                border-color: #fbbfca;
                font-family: 'Montserrat', Arial;
            }
            .sidebar-style-card.classic.selected {
                background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
                color: var(--accent-color, #4f46e5);
            }
            .sidebar-style-card.purple-glass.selected {
                background: linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%);
                color: #6d28d9;
                border-color: #6d28d9;
            }
            .sidebar-style-card.brutalist.selected {
                background: linear-gradient(135deg, #ffffffff 0%, #00a563ff 100%);
                color: #f9fafb;
                border-color: var(--accent-color, #4f46e5);
            }
            .sidebar-style-card.corporate.selected {
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: #ffffff;
                border-color: var(--accent-color, #4f46e5);
            }
            .sidebar-style-card.wilderness.selected {
                background: linear-gradient(135deg, #bbf7d0 0%, #4ade80 100%);
                color: #166534;
                border-color: #166534;
            }
            .sidebar-style-card.sophie.selected {
                background: linear-gradient(135deg, #ff01b3ff 0%, #f69fddff 100%);
                color: #ffffffff;
                border-color: #0ea5e9;
            }
            .sidebar-style-card.enchanted.selected {
                background: linear-gradient(135deg, #a970ffff 0%, #440040ff 100%);
                color: #eff5ffff;
                border-color: #0ea5e9;
            }
            .sidebar-style-card.darkmode.selected {
                background: linear-gradient(135deg, #27272a 0%, #18181b 100%);
                color: #fff;
                border-color: #fbbf24;
            }
            .sidebar-style-card.lightmode.selected {
                background: linear-gradient(135deg, #c4c4daff 0%, #d1d1efff 100%);
                color: #353232ff;
                border-color: #fbbf24;
            }
            .sidebar-style-card.product.selected {
                background: linear-gradient(135deg, #fde68a 0%, #fbbf24 100%);
                color: #b45309;
                border-color: #f59e42;
            }
            .sidebar-style-card.finance.selected {
                background: linear-gradient(135deg, #6ee7b7 0%, #155e75 100%);
                color: #155e75;
                border-color: #10b981;
            }
            .sidebar-style-card.data.selected {
                background: linear-gradient(135deg, #818cf8 0%, #06b6d4 100%);
                color: #0e7490;
                border-color: #06b6d4;
            }
            .sidebar-style-card.hobby.selected {
                background: linear-gradient(135deg, #fde68a 0%, #fbbf24 100%);
                color: #a16207;
                border-color: #fbbf24;
            }
            .sidebar-style-card.pets.selected {
                background: linear-gradient(135deg, #fef9c3 0%, #fbbfca 100%);
                color: #a21caf;
                border-color: #fbbfca;
            }
            .sidebar-style-card.diy {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: #ffffff;
                border-color: #6366f1;
                font-family: 'Montserrat', Arial;
                position: relative;
                overflow: visible;
            }
            .sidebar-style-card.diy::before {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f093fb, #ff6b6b);
                border-radius: 18px;
                z-index: -1;
                animation: diyGradientShift 3s ease-in-out infinite;
            }
            .sidebar-style-card.diy.selected {
                background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                color: #ffffff;
                border-color: #8b5cf6;
                box-shadow: 0 12px 32px rgba(168, 85, 247, 0.4);
            }
            .sidebar-import-btn {
                width: 100%;
                padding: 10px 12px;
                margin-bottom: 8px;
                border-radius: 10px;
                border: 1px solid rgba(0,0,0,0.08);
                background: linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%);
                color: #0f172a;
                font-weight: 700;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(2,6,23,0.06);
            }
            .sidebar-import-btn:hover { transform: translateY(-1px); }
            @media (prefers-color-scheme: dark) {
                .sidebar-import-btn { background: linear-gradient(180deg, #1f2937 0%, #27111aff 100%); color: #e6eef8; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 6px 18px rgba(0,0,0,0.6); }
            }
        `;
        document.head.appendChild(style);
    }

    render(parent) {
        //console.log('[Sidebar] render called, parent:', parent);
        this.injectStyles();
        this.sidebar = document.createElement('div');
        this.sidebar.className = 'presentation-sidebar';

        // Tab bar
        const tabBar = document.createElement('div');
        tabBar.className = 'sidebar-tabs';
        const tabDefs = [
            { key: 'styles', label: 'Style', labelKey: 'sidebarTabStyles' },
            { key: 'text', label: 'Text', labelKey: 'sidebarTabText' },
            { key: 'picture', label: 'Pic', labelKey: 'sidebarTabPicture' }
        ];
        this.tabButtons = {};
        tabDefs.forEach((tab, idx) => {
            const btn = document.createElement('button');
            btn.className = 'sidebar-tab' + (idx === 0 ? ' selected' : '');
            btn.textContent = (window.Lang ? Lang.get(tab.labelKey) : tab.label);
            // When clicking a tab, explicitly clear any current selection on stages so the UI reflects the tab context.
            btn.onclick = () => {
                try {
                    this.selectTab(tab.key, { preserveSelection: false });
                } catch (e) { console.warn('[Sidebar] tab click selectTab error', e); }
            };
            tabBar.appendChild(btn);
            this.tabButtons[tab.key] = btn;
        });
        this.sidebar.appendChild(tabBar);
        //console.log('[Sidebar] Tab bar rendered');

        // Tab content containers
        this.tabContents = {};
        tabDefs.forEach((tab, idx) => {
            const tabContent = document.createElement('div');
            tabContent.className = 'sidebar-tab-content' + (idx === 0 ? ' active' : '');
            tabContent.dataset.tab = tab.key;
            this.tabContents[tab.key] = tabContent;
            this.sidebar.appendChild(tabContent);
        });
        //console.log('[Sidebar] Tab content containers created');

        // Integrate presentation-level global text controls into Text tab
        if (this.tabContents['text']) {
            if (window.presentation && typeof window.presentation.getGlobalTextControls === 'function') {
                try {
                    const globalControls = window.presentation.getGlobalTextControls();
                    this.tabContents['text'].appendChild(globalControls);
                    this.globalTextControls = globalControls;

                    // Populate global controls with current bullet text attributes
                    try { this._refreshGlobalTextControls(); } catch (e) { console.warn('[Sidebar] refresh global controls failed', e); }

                } catch (e) {
                    console.warn('[Sidebar] Error attaching global text controls', e);
                }
            } else {
                const note = document.createElement('div');
                note.style.opacity = '0.7';
                note.style.fontSize = '13px';
                note.style.margin = '8px 0';
                note.textContent = (window.Lang ? Lang.get('sidebarGlobalTextControlsUnavailable') : 'Global text controls unavailable');
                this.tabContents['text'].appendChild(note);
            }

            // Create node-specific controls (hidden by default). These act on selected nodes only.
            this.nodeTextControls = document.createElement('div');
            this.nodeTextControls.className = 'sidebar-node-text-controls';
            this.nodeTextControls.style.display = 'none';
            this.nodeTextControls.style.marginTop = '12px';

            const nodeTitle = document.createElement('div');
            nodeTitle.style.fontWeight = '600';
            nodeTitle.style.marginBottom = '8px';
            nodeTitle.textContent = (window.Lang ? Lang.get('sidebarSelectedTextControls') : 'Selected text controls');
            this.nodeTextControls.appendChild(nodeTitle);

            // Font size for selected nodes
            const fsLabel = document.createElement('div'); fsLabel.style.fontSize='13px'; fsLabel.style.margin='6px 0 4px 0'; fsLabel.textContent=(window.Lang ? Lang.get('presentationLabelFontSize') : 'Font size');
            this.nodeFontSize = document.createElement('input'); this.nodeFontSize.type='number'; this.nodeFontSize.min=6; this.nodeFontSize.max=200; this.nodeFontSize.value=24;
            this.nodeFontSize.onchange = () => this._applyToSelectedTextNodes({ fontSize: parseInt(this.nodeFontSize.value,10) || 12 });
            this.nodeTextControls.appendChild(fsLabel); this.nodeTextControls.appendChild(this.nodeFontSize);

            // Text color for selected nodes
            const tcLabel = document.createElement('div'); tcLabel.style.fontSize='13px'; tcLabel.style.margin='6px 0 4px 0'; tcLabel.textContent=(window.Lang ? Lang.get('presentationLabelTextColor') : 'Text color');
            this.nodeTextColor = document.createElement('input'); this.nodeTextColor.type='color'; this.nodeTextColor.value='#111111'; this.nodeTextColor.onchange = () => this._applyToSelectedTextNodes({ fill: this.nodeTextColor.value });
            this.nodeTextControls.appendChild(tcLabel); this.nodeTextControls.appendChild(this.nodeTextColor);

            // AI text modification UI
            const aiLegend = document.createElement('div');
            aiLegend.style.fontSize = '13px';
            aiLegend.style.fontWeight = '600';
            aiLegend.style.margin = '12px 0 6px 0';
            aiLegend.textContent = (window.Lang ? Lang.get('sidebarAiTextModification') : 'AI text modification');
            this.nodeTextControls.appendChild(aiLegend);

            this.aiTextInput = document.createElement('textarea');
            this.aiTextInput.rows = 5;
            this.aiTextInput.placeholder = (window.Lang ? Lang.get('sidebarAiTextInputPlaceholder') : 'Input text modification, eg: Translate to Spanish');
            this.aiTextInput.style.width = '100%';
            this.aiTextInput.style.boxSizing = 'border-box';
            this.aiTextInput.style.padding = '8px';
            this.aiTextInput.style.marginBottom = '8px';
            this.aiTextInput.style.resize = 'vertical';
            this.nodeTextControls.appendChild(this.aiTextInput);

            const aiBtn = document.createElement('button');
            aiBtn.textContent = (window.Lang ? Lang.get('sidebarAiModify') : 'Modify');
            aiBtn.style.padding = '8px 12px';
            aiBtn.style.cursor = 'pointer';
            aiBtn.dataset.running = '0';

            // click behaviour: start modify or cancel when running
            aiBtn.onclick = async () => {
                try {
                    //console.log('[Sidebar] AI Modify button clicked. applyToAll=', !!this.aiApplyToAll);

                    // If running, treat click as Cancel
                    if (aiBtn.dataset.running === '1') {
                        try {
                            if (window.SlideForgeAbortController) {
                                //console.log('[Sidebar] Cancel requested: aborting SlideForgeAbortController');
                                window.SlideForgeAbortController.abort();
                            } else {
                                //console.log('[Sidebar] Cancel requested but no SlideForgeAbortController present');
                            }
                        } catch (e) { console.warn('[Sidebar] error aborting', e); }
                        // disable briefly to avoid double-clicks
                        aiBtn.disabled = true;
                        return;
                    }

                    const q = (this.aiTextInput && this.aiTextInput.value) || '';
                    //console.log('[Sidebar] AI query:', q);
                    if (!q || q.trim().length === 0) {
                        //console.log('[Sidebar] Empty AI query; aborting');
                        return;
                    }

                    // Start request: switch to cancel state
                    aiBtn.dataset.running = '1';
                    aiBtn.textContent = (window.Lang ? Lang.get('sidebarAiCancel') : 'Cancel');
                    // make it visually red
                    aiBtn.style.background = '#ef4444';
                    aiBtn.style.color = '#ffffff';
                    aiBtn.style.border = '1px solid rgba(0,0,0,0.08)';

                    // progress UI element (created below) may be used to show progress
                    try {
                        if (this.aiApplyToAll) {
                            //console.log('[Sidebar] Apply-to-all is enabled; attempting batch path');
                            // Apply to all text nodes sequentially
                            const helper = this._findAnyHelper();
                            //console.log('[Sidebar] Found helper for batch?', !!helper);
                            if (helper && typeof helper.processAllTextNodesWithAI === 'function') {
                                try {
                                    //console.log('[Sidebar] helper identity:', helper && (helper.constructor ? helper.constructor.name : typeof helper));
                                    try { //console.log('[Sidebar] helper.processAllTextNodesWithAI source (truncated):', (typeof helper.processAllTextNodesWithAI === 'function') ? helper.processAllTextNodesWithAI.toString().slice(0,300) : String(helper.processAllTextNodesWithAI)); 
                                    } catch(e) { console.warn('[Sidebar] failed to stringify helper method', e); }
                                } catch (e) {}
                                //console.log('[Sidebar] Calling helper.processAllTextNodesWithAI');
                                const t0 = Date.now();
                                await helper.processAllTextNodesWithAI(q.trim(), {
                                    perNodeDelayMs: 150,
                                    progressCb: (idx, total) => {
                                        try {
                                            if (aiProgress) aiProgress.textContent = `${idx}/${total}`;
                                            //console.log(`[Sidebar][Batch] progress ${idx}/${total}`);
                                        } catch(e) {}
                                    }
                                });
                                const t1 = Date.now();
                                //console.log('[Sidebar] helper.processAllTextNodesWithAI completed, elapsed ms=', (t1 - t0));
                            } else {
                                console.warn('[Sidebar] Batch helper unavailable or missing processAllTextNodesWithAI');
                                // fallback to single-node modify if batch unavailable
                                    if (typeof this.onAiModify === 'function') {
                                        //console.log('[Sidebar] Falling back to onAiModify handler (single-selection)');
                                        await this.onAiModify(q.trim(), Array.isArray(this._lastSelection) ? this._lastSelection.slice() : []);
                                    } else {
                                        const helper2 = this._findAnyHelper();
                                        //console.log('[Sidebar] Found helper for single path?', !!helper2);
                                        const selectedNodes = Array.isArray(this._lastSelection) ? this._lastSelection.slice() : [];
                                        if (helper2 && typeof helper2.modifySelectedTextWithAI === 'function') {
                                            //console.log('[Sidebar] Calling helper2.modifySelectedTextWithAI with selected nodes');
                                            await helper2.modifySelectedTextWithAI(q.trim(), { selectedNodes });
                                        } else if (helper2 && typeof helper2.onAiModify === 'function') {
                                            //console.log('[Sidebar] Calling helper2.onAiModify');
                                            await helper2.onAiModify(q.trim(), {});
                                        } else {
                                            //console.log('[Sidebar] AI modify unavailable (no helper found) - cannot apply batch');
                                        }
                                    }
                            }
                        } else {
                            //console.log('[Sidebar] Apply-to-all is disabled; using single-selection path');
                            // Single-selection modify path
                            if (typeof this.onAiModify === 'function') {
                                //console.log('[Sidebar] Using this.onAiModify handler');
                                await this.onAiModify(q.trim(), Array.isArray(this._lastSelection) ? this._lastSelection.slice() : []);
                            } else {
                                const helper = this._findAnyHelper();
                                //console.log('[Sidebar] Found helper for single path?', !!helper);
                                if (helper && typeof helper.modifySelectedTextWithAI === 'function') {
                                    //console.log('[Sidebar] Calling helper.modifySelectedTextWithAI with selected nodes');
                                    // Prefer helper attached to the stage of the first selected node if possible
                                    const selectedNodes = Array.isArray(this._lastSelection) ? this._lastSelection.slice() : [];
                                    await helper.modifySelectedTextWithAI(q.trim(), { selectedNodes });
                                } else if (helper && typeof helper.onAiModify === 'function') {
                                    //console.log('[Sidebar] Calling helper.onAiModify');
                                    await helper.onAiModify(q.trim(), {});
                                } else {
                                    //console.log('[Sidebar] AI modify unavailable (no helper found)');
                                }
                            }
                        }

                    } catch (e) {
                        try {
                            if (e && (e.name === 'AbortError' || (e.message && e.message.toLowerCase().includes('abort')))) {
                                // canceled by user
                                //console.log('[Sidebar] AI Modify aborted by user');
                            } else {
                                console.warn('[Sidebar] onAiModify handler error', e);
                            }
                        } catch (inner) {}
                    } finally {
                        // Reset button to normal state
                        aiBtn.dataset.running = '0';
                        aiBtn.disabled = false;
                        aiBtn.textContent = (window.Lang ? Lang.get('sidebarAiModify') : 'Modify');
                        aiBtn.style.background = '';
                        aiBtn.style.color = '';
                        aiBtn.style.border = '';
                        try { if (aiProgress) aiProgress.textContent = ''; } catch(e) {}
                        //console.log('[Sidebar] AI Modify flow finished; UI reset');
                    }

                } catch (e) { console.warn('[Sidebar] AI Modify error', e); }
            };

            // Create a horizontal row containing the Modify button and the new Apply-to-All switch
            const aiRow = document.createElement('div');
            aiRow.style.display = 'flex';
            aiRow.style.alignItems = 'center';
            aiRow.style.gap = '8px';

            // ensure a default flag on the sidebar instance
            this.aiApplyToAll = !!this.aiApplyToAll;

            // Append the Modify button to the row
            aiRow.appendChild(aiBtn);

            // Progress indicator for batch operations
            const aiProgress = document.createElement('div');
            aiProgress.style.fontSize = '12px';
            aiProgress.style.opacity = '0.9';
            aiProgress.style.marginLeft = '8px';
            aiProgress.textContent = '';
            // append progress after button but before the switch so it remains visible
            aiRow.appendChild(aiProgress);

            // Build a simple toggle switch (visual) and label to the right of the button
            const switchWrapper = document.createElement('label');
            switchWrapper.style.display = 'inline-flex';
            switchWrapper.style.alignItems = 'center';
            switchWrapper.style.gap = '8px';
            switchWrapper.style.marginLeft = 'auto'; // push it to the right side of the row
            switchWrapper.style.cursor = 'pointer';
            switchWrapper.title = (window.Lang ? Lang.get('sidebarAiEditsAllTextTooltip') : 'If enabled, AI edits will be applied to all matching text nodes');

            const switchInput = document.createElement('input');
            switchInput.type = 'checkbox';
            switchInput.style.display = 'none';
            switchInput.checked = !!this.aiApplyToAll;
            switchInput.onchange = (e) => { this.aiApplyToAll = !!e.target.checked; };

            // visual slider
            const slider = document.createElement('span');
            slider.style.width = '44px';
            slider.style.height = '24px';
            slider.style.background = switchInput.checked ? '#60a5fa' : '#e5e7eb';
            slider.style.borderRadius = '999px';
            slider.style.position = 'relative';
            slider.style.display = 'inline-block';
            slider.style.transition = 'background 0.18s ease';

            const knob = document.createElement('span');
            knob.style.width = '18px';
            knob.style.height = '18px';
            knob.style.background = '#ffffff';
            knob.style.borderRadius = '50%';
            knob.style.position = 'absolute';
            knob.style.top = '3px';
            knob.style.left = switchInput.checked ? '23px' : '3px';
            knob.style.boxShadow = '0 1px 4px rgba(0,0,0,0.25)';
            knob.style.transition = 'left 0.18s ease';

            slider.appendChild(knob);

            const switchLabel = document.createElement('span');
            switchLabel.textContent = (window.Lang ? Lang.get('sidebarApplyToAllText') : 'Apply to all text');
            switchLabel.style.fontSize = '13px';
            switchLabel.style.color = 'var(--text-color, #111827)';

            // clicking the wrapper toggles the hidden checkbox and updates visuals
            switchWrapper.onclick = (ev) => {
                try {
                    ev.preventDefault();
                    switchInput.checked = !switchInput.checked;
                    // update visual
                    slider.style.background = switchInput.checked ? '#60a5fa' : '#e5e7eb';
                    knob.style.left = switchInput.checked ? '23px' : '3px';
                    // update state
                    this.aiApplyToAll = !!switchInput.checked;
                } catch (e) {}
            };

            switchWrapper.appendChild(switchInput);
            switchWrapper.appendChild(slider);
            switchWrapper.appendChild(switchLabel);

            // Append the switch wrapper to the row
            aiRow.appendChild(switchWrapper);

            // Finally append the composed row into nodeTextControls
            this.nodeTextControls.appendChild(aiRow);

            this.tabContents['text'].appendChild(this.nodeTextControls);
        }

        // Add title to Styles tab only
        const title = document.createElement('div');
        title.className = 'sidebar-title';
    title.textContent = (window.Lang ? Lang.get('sidebarSlideForgeStylesTitle') : 'SlideForge Styles');
        this.tabContents['styles'].appendChild(title);

        // Style cards in Styles tab
        const styles = [
            { key: 'diy', label: 'DIY Style', labelKey: 'sidebarStyleDiy', render: 'renderDIY', special: true },
            { key: 'classic', label: 'Classic', labelKey: 'sidebarStyleClassic', render: 'renderClassic' },
            { key: 'darkmode', label: 'Dark mode', labelKey: 'sidebarStyleDarkmode', render: 'renderDarkMode' },
            { key: 'lightmode', label: 'Light mode', labelKey: 'sidebarStyleLightmode', render: 'renderLightMode' },
            { key: 'product', label: 'Product', labelKey: 'sidebarStyleProduct', render: 'renderProductShowcase' },
            { key: 'corporate', label: 'Corporate', labelKey: 'sidebarStyleCorporate', render: 'renderCorporate' },
            { key: 'finance', label: 'Finance', labelKey: 'sidebarStyleFinance', render: 'renderFinance' },
            { key: 'data', label: 'Data', labelKey: 'sidebarStyleData', render: 'renderData' },
            { key: 'purple-glass', label: 'Purple Glass', labelKey: 'sidebarStylePurpleGlass', render: 'renderPurpleGlass' },
            { key: 'wilderness', label: 'Wilderness', labelKey: 'sidebarStyleWilderness', render: 'renderWilderness' },
            { key: 'sophie', label: 'Sophie', labelKey: 'sidebarStyleSophie', render: 'renderSophie' },
            { key: 'enchanted', label: 'Enchanted', labelKey: 'sidebarStyleEnchanted', render: 'renderEnchanted' },
            { key: 'hobby', label: 'Hobby', labelKey: 'sidebarStyleHobby', render: 'renderHobby' },
            { key: 'pets', label: 'Pets', labelKey: 'sidebarStylePets', render: 'renderPets' },
            { key: 'brutalist', label: 'Brutalist', labelKey: 'sidebarStyleBrutalist', render: 'renderBrutalist' },
        ];
        this.styleRenderMap = {};
        styles.forEach(styleObj => {
            this.styleRenderMap[styleObj.key] = styleObj.render;
            const card = document.createElement('div');
            card.className = `sidebar-style-card ${styleObj.key}`;
            if (styleObj.key === this.selectedStyle) card.classList.add('selected');
            card.title = (window.Lang ? Lang.get(styleObj.labelKey) : styleObj.label);
            
            // Special handling for DIY button
            if (styleObj.special && styleObj.key === 'diy') {
                // Add a small availability dot if saved styles exist (checked asynchronously)
                (async () => {
                    try {
                        // If in-memory current style exists, show dot immediately
                        if (window.StyleDIY && window.StyleDIY.lastGeneratedStyle) {
                            const dot = document.createElement('span');
                            dot.className = 'sidebar-diy-available-dot';
                            dot.title = (window.Lang ? Lang.get('sidebarDiyStylesAvailable') : 'DIY styles available');
                            dot.style.cssText = 'position:absolute;top:6px;right:10px;width:10px;height:10px;border-radius:50%;background:#10b981;box-shadow:0 0 6px rgba(16,185,129,0.6);';
                            card.appendChild(dot);
                        } else {
                            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                            if (hashedMasterKey && typeof PaiperworkDB !== 'undefined' && typeof PaiperworkDB.getCustomStyles === 'function') {
                                try {
                                    const dbStyles = await PaiperworkDB.getCustomStyles(hashedMasterKey) || [];
                                    if (Array.isArray(dbStyles) && dbStyles.length > 0) {
                                        const dot = document.createElement('span');
                                        dot.className = 'sidebar-diy-available-dot';
                                        dot.title = (window.Lang ? Lang.get('sidebarDiyStylesAvailable') : 'DIY styles available');
                                        dot.style.cssText = 'position:absolute;top:6px;right:10px;width:10px;height:10px;border-radius:50%;background:#10b981;box-shadow:0 0 6px rgba(16,185,129,0.6);';
                                        card.appendChild(dot);
                                    }
                                } catch (e) { console.warn('[Sidebar] Failed to check DIY styles in DB', e); }
                            }
                        }
                    } catch (e) { console.warn('[Sidebar] error checking DIY availability', e); }
                })();

                // Async click handler: prefer in-memory current style, otherwise check DB for saved styles before opening manager
                card.onclick = async () => {
                    try {
                        if (window.StyleDIY && window.StyleDIY.lastGeneratedStyle) {
                            //console.log('[Sidebar] DIY style available (in-memory), opening style manager');
                            window.StyleDIY.openDIYStyleManager();
                            return;
                        }

                        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                        if (hashedMasterKey && typeof PaiperworkDB !== 'undefined' && typeof PaiperworkDB.getCustomStyles === 'function') {
                            try {
                                const dbStyles = await PaiperworkDB.getCustomStyles(hashedMasterKey) || [];
                                if (Array.isArray(dbStyles) && dbStyles.length > 0) {
                                    //console.log('[Sidebar] DIY styles found in DB, opening style manager');
                                    window.StyleDIY.openDIYStyleManager();
                                    return;
                                }
                            } catch (e) { console.warn('[Sidebar] Error fetching DIY styles on click', e); }
                        }

                        //console.log('[Sidebar] No DIY style available, opening creation modal');
                        this.openDIYModal();
                    } catch (e) {
                        console.warn('[Sidebar] DIY click handler error', e);
                        this.openDIYModal();
                    }
                };
            } else {
                card.onclick = () => this.selectStyle(styleObj.key);
            }
            
            card.textContent = (window.Lang ? Lang.get(styleObj.labelKey) : styleObj.label);
            this.tabContents['styles'].appendChild(card);
            //console.log('[Sidebar] Style card created:', styleObj.key);
        });
        //console.log('[Sidebar] All style cards rendered');

        // Build Picture tab UI: simple image search controls
        if (this.tabContents['picture']) {
            try {
                this._pictureControls = document.createElement('div');
                this._pictureControls.className = 'presentation-picture-controls';

                const picHeader = document.createElement('div');
                picHeader.style.fontSize = '15px';
                picHeader.style.fontWeight = '700';
                picHeader.style.marginBottom = '8px';
                picHeader.textContent = (window.Lang ? Lang.get('sidebarPictureTools') : 'Picture tools');
                this._pictureControls.appendChild(picHeader);

                // Simple checkmark toggle above Import picture: no behavior attached
                const changeCoverToggleRow = document.createElement('div');
                changeCoverToggleRow.style.display = 'flex';
                changeCoverToggleRow.style.alignItems = 'center';
                changeCoverToggleRow.style.gap = '8px';
                changeCoverToggleRow.style.marginBottom = '8px';

                const changeCoverCheckbox = document.createElement('input');
                changeCoverCheckbox.type = 'checkbox';
                changeCoverCheckbox.id = 'pw_change_cover_toggle';
                changeCoverCheckbox.style.width = '16px';
                changeCoverCheckbox.style.height = '16px';

                const changeCoverCheckboxLabel = document.createElement('label');
                changeCoverCheckboxLabel.htmlFor = 'pw_change_cover_toggle';
                changeCoverCheckboxLabel.textContent = (window.Lang ? Lang.get('sidebarChangeCoverPicture') : 'change cover picture');
                changeCoverCheckboxLabel.style.fontSize = '13px';
                changeCoverCheckboxLabel.style.userSelect = 'none';

                changeCoverToggleRow.appendChild(changeCoverCheckbox);
                changeCoverToggleRow.appendChild(changeCoverCheckboxLabel);
                this._pictureControls.appendChild(changeCoverToggleRow);

                // Import picture button (full width)
                const importBtn = document.createElement('button');
                importBtn.className = 'sidebar-import-btn';
                importBtn.textContent = (window.Lang ? Lang.get('sidebarImportPicture') : 'Import picture');
                importBtn.title = (window.Lang ? Lang.get('sidebarImportReplaceImage') : 'Import an image file and replace the selected picture on the stage');
                importBtn.onclick = async () => {
                    try {
                        // If the change-cover checkbox is selected, route the import to the cover stage image
                        try {
                            if (changeCoverCheckbox && changeCoverCheckbox.checked) {
                                // Create a hidden file input to pick an image
                                const inputCover = document.createElement('input');
                                inputCover.type = 'file';
                                inputCover.accept = 'image/*';
                                inputCover.style.display = 'none';
                                inputCover.onchange = async () => {
                                    try {
                                        const file = inputCover.files && inputCover.files[0];
                                        if (!file) { this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicNoFileSelected') : 'No file selected'); return; }
                                        this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicImportingCover') : 'Importing cover image...');

                                        // convert file to base64 dataURL
                                        const toDataUrl = f => new Promise((res, rej) => {
                                            const reader = new FileReader();
                                            reader.onload = () => res(reader.result);
                                            reader.onerror = rej;
                                            reader.readAsDataURL(f);
                                        });
                                        let b64 = null;
                                        try { b64 = await toDataUrl(file); } catch (e) { console.warn('[Sidebar] file->dataURL failed', e); }

                                        // Find the cover stage and candidate image node
                                        const stages = (window.presentation && window.presentation.stages) || [];
                                        const coverStage = stages && stages.length ? stages[0] : null;
                                        if (!coverStage) { this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverStageUnavailable') : 'Cover stage unavailable.'); return; }
                                        const images = (coverStage.find && coverStage.find('Image')) || [];
                                        let candidate = null; let maxArea = 0;
                                        try {
                                            const arr = (typeof images.toArray === 'function') ? images.toArray() : Array.from(images);
                                            arr.forEach(img => {
                                                try {
                                                    const r = img.getClientRect ? img.getClientRect({ relativeTo: coverStage }) : { width: img.width && img.width() || img.width || 0, height: img.height && img.height() || img.height || 0 };
                                                    const area = (r.width || 0) * (r.height || 0);
                                                    if (area > maxArea) { maxArea = area; candidate = img; }
                                                } catch (e) {}
                                            });
                                        } catch (e) {}

                                        // Resolve helper from candidate's stage (or any helper)
                                        let helper = null;
                                        try {
                                            const nodeStage = (candidate && typeof candidate.getStage === 'function') ? candidate.getStage() : null;
                                            if (nodeStage) helper = nodeStage._presentationselectionHelper || nodeStage._presentationSelectionHelper || nodeStage._selectionHelper || null;
                                        } catch (e) { helper = null; }
                                        if (!helper) helper = this._findAnyHelper();

                                        const doReplace = async (h, payload) => {
                                            try {
                                                if (h && typeof h.replaceCoverImage === 'function') return await h.replaceCoverImage(payload);
                                                if (h && typeof h.replaceSelectedImage === 'function') return await h.replaceSelectedImage(payload, { preserveSize: true, forceTargetNode: candidate });
                                                return false;
                                            } catch (e) { console.warn('[Sidebar] doReplace threw', e); return false; }
                                        };

                                        let ok = false;
                                        if (b64) ok = await doReplace(helper, b64);
                                        if (!ok) {
                                            // Attempt manual fallback: prefer calling selection helper.replaceSelectedImage
                                            // with forceTargetNode so the helper can preserve the original node box.
                                            try {
                                                if (candidate && b64) {
                                                    const nodeStage = (candidate && typeof candidate.getStage === 'function') ? candidate.getStage() : null;
                                                    const helperObj = nodeStage && (nodeStage._presentationselectionHelper || nodeStage._presentationSelectionHelper || nodeStage._selectionHelper) ? (nodeStage._presentationselectionHelper || nodeStage._presentationSelectionHelper || nodeStage._selectionHelper) : null;
                                                    if (helperObj && typeof helperObj.replaceSelectedImage === 'function') {
                                                        try { const ok2 = await helperObj.replaceSelectedImage(b64, { preserveSize: true, forceTargetNode: candidate }); if (ok2) { this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverReplacedFallback') : 'Cover image replaced (fallback)'); ok = true; } }
                                                        catch (e) { /* fallthrough to manual image fallback */ }
                                                    }

                                                    if (!ok) {
                                                        // last-resort manual fallback (existing behavior)
                                                        const img = new window.Image();
                                                        img.src = b64;
                                                        img.onload = () => {
                                                            try {
                                                                try { if (typeof candidate.image === 'function') candidate.image(img); else candidate.setAttr && candidate.setAttr('image', img); } catch(e) { console.warn('[Sidebar] manual set image failed', e); }
                                                                // existing fitted resize logic (keeps behavior but is last-resort)
                                                                let prevW = null, prevH = null;
                                                                try { prevW = (typeof candidate.width === 'function') ? candidate.width() : (candidate.getAttr && candidate.getAttr('width')); } catch (e) {}
                                                                try { prevH = (typeof candidate.height === 'function') ? candidate.height() : (candidate.getAttr && candidate.getAttr('height')); } catch (e) {}
                                                                const srcW = (typeof img.naturalWidth === 'number' && img.naturalWidth > 0) ? img.naturalWidth : img.width || 0;
                                                                const srcH = (typeof img.naturalHeight === 'number' && img.naturalHeight > 0) ? img.naturalHeight : img.height || 0;
                                                                try {
                                                                    try {
                                                                        let origW = null, origH = null;
                                                                        try { origW = (typeof candidate.getAttr === 'function') ? candidate.getAttr('_pwOrigW') : candidate._pwOrigW; } catch (e) { origW = null; }
                                                                        try { origH = (typeof candidate.getAttr === 'function') ? candidate.getAttr('_pwOrigH') : candidate._pwOrigH; } catch (e) { origH = null; }
                                                                        let targetW = (origW !== null && origW !== undefined) ? origW : prevW;
                                                                        let targetH = (origH !== null && origH !== undefined) ? origH : prevH;
                                                                        const nodeStage2 = (candidate && typeof candidate.getStage === 'function') ? candidate.getStage() : null;
                                                                        let fitted = null;
                                                                        try {
                                                                            if (nodeStage2 && nodeStage2._presentationselectionHelper && typeof nodeStage2._presentationselectionHelper._computeFittedSize === 'function') {
                                                                                fitted = nodeStage2._presentationselectionHelper._computeFittedSize(srcW, srcH, targetW, targetH);
                                                                            } else if (window.presentation && window.presentation._selectionHelper && typeof window.presentation._selectionHelper._computeFittedSize === 'function') {
                                                                                fitted = window.presentation._selectionHelper._computeFittedSize(srcW, srcH, targetW, targetH);
                                                                            }
                                                                        } catch (e) {}
                                                                        if (!fitted) {
                                                                            if (targetH) {
                                                                                const scale = targetH / (srcH || 1);
                                                                                fitted = { w: Math.max(1, Math.round(srcW * scale)), h: Math.max(1, Math.round(srcH * scale)) };
                                                                            } else if (targetW) {
                                                                                const scale = targetW / (srcW || 1);
                                                                                fitted = { w: Math.max(1, Math.round(srcW * scale)), h: Math.max(1, Math.round(srcH * scale)) };
                                                                            } else {
                                                                                fitted = { w: srcW, h: srcH };
                                                                            }
                                                                        }
                                                                        if (fitted) {
                                                                            if (typeof candidate.width === 'function' && typeof candidate.height === 'function') { candidate.width(fitted.w); candidate.height(fitted.h); } else { candidate.setAttr && candidate.setAttr('width', fitted.w); candidate.setAttr && candidate.setAttr('height', fitted.h); }
                                                                        }
                                                                    } catch (e) {}
                                                                } catch (e) { console.warn('[Sidebar] manual resize failed', e); }
                                                                try { const layer = candidate.getLayer && candidate.getLayer(); if (layer && typeof layer.draw === 'function') layer.draw(); const st = candidate.getStage && candidate.getStage(); if (st && typeof st.batchDraw === 'function') st.batchDraw(); } catch (e) {}
                                                                this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverReplacedFallback') : 'Cover image replaced (fallback)');
                                                            } catch (e) { console.warn('[Sidebar] manual cover replace onload handler failed', e); this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverReplaceFailed') : 'Cover replace failed'); }
                                                        };
                                                        img.onerror = () => { this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverReplaceFailedLoad') : 'Cover replace failed (image load)'); };
                                                        ok = true;
                                                    }
                                                } else {
                                                    this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverReplaceUnavailable') : 'Cover replace unavailable.');
                                                }
                                            } catch (e) {
                                                console.warn('[Sidebar] manual fallback failed', e);
                                                this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverReplaceUnavailable') : 'Cover replace unavailable.');
                                            }
                                        } else {
                                            this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverImageReplaced') : 'Cover image replaced');
                                        }
                                    } catch (e) { console.warn('[Sidebar] import cover onchange error', e); this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicImportFailed') : 'Import failed'); }
                                };
                                document.body.appendChild(inputCover);
                                inputCover.click();
                                setTimeout(() => { try { document.body.removeChild(inputCover); } catch(e) {} }, 3000);
                                return;
                            }
                        } catch (e) { console.warn('[Sidebar] change-cover import precheck failed', e); }
                        // Prefer pw_id if available
                        let targetPwId = this._lastSelectionId || null;
                        if (!targetPwId) {
                            const sel = Array.isArray(this._lastSelection) ? this._lastSelection : [];
                            if (!sel || sel.length === 0) {
                                try {
                                    this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicPleaseSelectPictureFirst') : 'Please select a picture on the presentation first.');
                                    this.picSearchStatus.style.color = '#f97316';
                                    setTimeout(() => { try { this.picSearchStatus.textContent = ''; this.picSearchStatus.style.color = ''; } catch(e) {} }, 4000);
                                } catch (e) {}
                                return;
                            }
                            try { targetPwId = (sel[0] && typeof sel[0].getAttr === 'function') ? (sel[0].getAttr('pw_id') || sel[0].getAttr('_pwId')) : (sel[0] && (sel[0].pw_id || sel[0]._pwId)); } catch(e) { targetPwId = null; }
                        }

                        // If still no pw id, try cover fallback then warn
                        if (!targetPwId) {
                            try { targetPwId = (parsedSlides && parsedSlides.cover && parsedSlides.cover._pw && (parsedSlides.cover._pw.imageId || parsedSlides.cover._pw.id)) ? (parsedSlides.cover._pw.imageId || parsedSlides.cover._pw.id) : null; } catch (e) { targetPwId = null; }
                        }
                        if (!targetPwId) {
                            this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicPleaseSelectPictureFirst') : 'Please select a picture on the presentation first.');
                            return;
                        }

                        // create a hidden file input to pick an image
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.style.display = 'none';
                        input.onchange = async () => {
                            try {
                                const file = input.files && input.files[0];
                                if (!file) {
                                    this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicNoFileSelected') : 'No file selected');
                                    return;
                                }
                                this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicImporting') : 'Importing image...');

                                // find node by pw_id and resolve helper from its stage
                                let node = null;
                                try { node = (window.presentation && typeof window.presentation.findNodeByPwId === 'function') ? window.presentation.findNodeByPwId(targetPwId) : null; } catch(e) { node = null; }

                                if (!node) {
                                    this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicSelectedNodeNotFound') : 'Selected node not found (stale).');
                                    return;
                                }

                                let helper = null;
                                try {
                                    const nodeStage = (node && typeof node.getStage === 'function') ? node.getStage() : (node && node.getLayer && typeof node.getLayer === 'function' ? (node.getLayer() && node.getLayer().getStage && node.getLayer().getStage()) : null);
                                    if (nodeStage) helper = nodeStage._presentationselectionHelper || nodeStage._presentationSelectionHelper || nodeStage._selectionHelper || null;
                                } catch(e) { helper = null; }

                                const hasImport = h => h && (typeof h.importAndReplace === 'function');
                                if (!hasImport(helper)) {
                                    helper = this._findAnyHelper();
                                }

                                if (!hasImport(helper)) {
                                    this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicImportUnavailableNoHelper') : 'Import unavailable: no selection helper found.');
                                    return;
                                }

                                try {
                                    const ok = await helper.importAndReplace(file, { preserveSize: true });
                                    this.picSearchStatus.textContent = ok ? (window.Lang ? Lang.get('sidebarPicReplaceSelectedImage') : 'Replaced selected image') : (window.Lang ? Lang.get('sidebarPicNoPicturesToReplace') : 'No pictures to replace selected');
                                } catch (e) {
                                    console.warn('[Sidebar] helper.importAndReplace threw', e);
                                    this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicImportFailed') : 'Import failed');
                                }
                            } catch (e) { console.warn('[Sidebar] import onchange error', e); this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicImportFailed') : 'Import failed'); }
                        };
                        // append to body, trigger click, then remove
                        document.body.appendChild(input);
                        input.click();
                        setTimeout(() => { try { document.body.removeChild(input); } catch(e) {} }, 2000);
                    } catch (e) { console.warn('[Sidebar] import button error', e); }
                };

                this._pictureControls.appendChild(importBtn);

                // --- Change cover picture switch (appears only when cover is focused and image covers full stage)
                this._changeCoverWrapper = document.createElement('div');
                this._changeCoverWrapper.style.display = 'none';
                this._changeCoverWrapper.style.marginTop = '12px';
                this._changeCoverWrapper.style.alignItems = 'center';
                this._changeCoverWrapper.style.justifyContent = 'space-between';

                const changeCoverLabel = document.createElement('div');
                changeCoverLabel.style.fontSize = '13px';
                changeCoverLabel.style.fontWeight = '600';
                changeCoverLabel.textContent = (window.Lang ? Lang.get('sidebarChangeCoverPictureLabel') : 'Change cover picture');
                this._changeCoverWrapper.appendChild(changeCoverLabel);

                const changeCoverBtn = document.createElement('button');
                changeCoverBtn.className = 'sidebar-import-btn';
                changeCoverBtn.textContent = (window.Lang ? Lang.get('sidebarChangeButtonLabel') : 'Change');
                changeCoverBtn.title = (window.Lang ? Lang.get('sidebarChangeCoverTitle') : 'Import or pick a thumbnail to replace the cover image');
                changeCoverBtn.onclick = async () => {
                    try {
                        // Trigger the import flow but target the cover stage image node
                        // We will reuse the import button flow but set a special flag so helper.replaceSelectedImage targets the cover
                        // Find the cover stage (index 0) and its largest Image node
                        const stages = (window.presentation && window.presentation.stages) || [];
                        const coverStage = stages && stages.length ? stages[0] : null;
                        if (!coverStage) {
                            this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverStageUnavailable') : 'Cover stage unavailable.');
                            return;
                        }

                        // Find largest image node on cover stage
                        const images = (coverStage.find && coverStage.find('Image')) || [];
                        let candidate = null;
                        let maxArea = 0;
                        try {
                            const arr = (typeof images.toArray === 'function') ? images.toArray() : Array.from(images);
                            arr.forEach(img => {
                                try {
                                    const r = img.getClientRect ? img.getClientRect({ relativeTo: coverStage }) : { width: img.width && img.width() || img.width || 0, height: img.height && img.height() || img.height || 0 };
                                    const area = (r.width || 0) * (r.height || 0);
                                    if (area > maxArea) { maxArea = area; candidate = img; }
                                } catch (e) {
                                    console.warn('[Sidebar] helper.importAndReplace threw', e);
                                    this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicImportFailed') : 'Import failed');
                                }
                            });
                        } catch (e) {}
                        // If no candidate image, fall back to import button behaviour (user selects a target manually)
                        if (!candidate) {
                            importBtn.click();
                            return;
                        }

                        // Create file input to pick image and then use helper.replaceSelectedImage on the candidate node
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.style.display = 'none';
                        input.onchange = async () => {
                            try {
                                const file = input.files && input.files[0];
                                if (!file) { this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicNoFileSelected') : 'No file selected'); return; }
                                this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicImportingCover') : 'Importing cover image...');

                                // convert file to base64 dataURL
                                const toDataUrl = f => new Promise((res, rej) => {
                                    const reader = new FileReader();
                                    reader.onload = () => res(reader.result);
                                    reader.onerror = rej;
                                    reader.readAsDataURL(f);
                                });
                                let b64 = null;
                                try { b64 = await toDataUrl(file); } catch (e) { console.warn('[Sidebar] file->dataURL failed', e); }

                                // Try to use selection helper replaceSelectedImage if available for the candidate node's stage
                                let helper = null;
                                try {
                                    const nodeStage = (candidate && typeof candidate.getStage === 'function') ? candidate.getStage() : null;
                                    if (nodeStage) helper = nodeStage._presentationselectionHelper || nodeStage._presentationSelectionHelper || nodeStage._selectionHelper || null;
                                } catch (e) { helper = null; }

                                if (!helper) helper = this._findAnyHelper();

                                const doReplace = (h, payload) => {
                                    try {
                                        if (h && typeof h.replaceCoverImage === 'function') return h.replaceCoverImage(payload);
                                        if (h && typeof h.replaceSelectedImage === 'function') return h.replaceSelectedImage(payload, { preserveSize: true, forceTargetNode: candidate });
                                        return false;
                                    } catch (e) { console.warn('[Sidebar] doReplace threw', e); return false; }
                                };

                                let ok = false;
                                if (b64) ok = await doReplace(helper, b64);
                                if (!ok) {
                                    // fallback: if helper cannot replace, trigger global import flow
                                    importBtn.click();
                                } else {
                                    this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverImageReplaced') : 'Cover image replaced');
                                }
                            } catch (e) { console.warn('[Sidebar] changeCover input onchange error', e); this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicImportFailed') : 'Import failed'); }
                        };
                        document.body.appendChild(input);
                        input.click();
                        setTimeout(() => { try { document.body.removeChild(input); } catch(e) {} }, 3000);

                    } catch (e) { console.warn('[Sidebar] changeCoverBtn click error', e); }
                };

                this._changeCoverWrapper.appendChild(changeCoverBtn);
                this._pictureControls.appendChild(this._changeCoverWrapper);

                const searchLabel = document.createElement('div');
                searchLabel.style.fontSize = '13px';
                searchLabel.style.margin = '6px 0 4px 0';
                searchLabel.textContent = (window.Lang ? Lang.get('sidebarSearchImagesLabel') : 'Search images');
                this._pictureControls.appendChild(searchLabel);

                this.picSearchInput = document.createElement('input');
                this.picSearchInput.type = 'text';
                this.picSearchInput.placeholder = (window.Lang ? Lang.get('sidebarPicSearchInputPlaceholder') : 'Describe the image...');
                this.picSearchInput.style.width = '100%';
                this.picSearchInput.style.boxSizing = 'border-box';
                this.picSearchInput.style.padding = '8px';
                this.picSearchInput.style.marginBottom = '8px';

                this.picSearchButton = document.createElement('button');
                this.picSearchButton.textContent = (window.Lang ? Lang.get('sidebarSearchImagesButton') : 'Search images');
                this.picSearchButton.style.display = 'inline-block';
                this.picSearchButton.style.padding = '8px 12px';
                this.picSearchButton.style.cursor = 'pointer';
                this.picSearchButton.onclick = () => {
                    const q = (this.picSearchInput && this.picSearchInput.value) || '';
                    try {
                        if (typeof this.onImageSearch === 'function') {
                            this.onImageSearch(q);
                        } else {
                            //console.log('[Sidebar] Search images clicked, query:', q);
                        }
                    } catch (e) {
                        console.warn('[Sidebar] onImageSearch handler error', e);
                    }
                };

                this._pictureControls.appendChild(this.picSearchInput);
                this._pictureControls.appendChild(this.picSearchButton);

                // Status / progress
                this.picSearchStatus = document.createElement('div');
                this.picSearchStatus.style.fontSize = '12px';
                this.picSearchStatus.style.opacity = '0.85';
                this.picSearchStatus.style.marginTop = '8px';
                this._pictureControls.appendChild(this.picSearchStatus);

                // Thumbnails container
                this.picThumbsContainer = document.createElement('div');
                // Layout as a 3x4 grid so 12 thumbnails are visible without scrolling
                this.picThumbsContainer.style.display = 'grid';
                this.picThumbsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
                this.picThumbsContainer.style.gap = '8px';
                this.picThumbsContainer.style.alignItems = 'stretch';
                this.picThumbsContainer.style.marginTop = '10px';
                // Exact height to fit 4 rows of 72px thumbnails + gaps (4*72 + 3*8 = 312)
                this.picThumbsContainer.style.height = '312px';
                // Hide any scrollbar (content fits the container)
                this.picThumbsContainer.style.overflow = 'hidden';
                this.picThumbsContainer.style.width = '100%';
                this._pictureControls.appendChild(this.picThumbsContainer);

                // Helper to find any selection helper instance on stages
                this._findAnyHelper = () => {
                    try {
                        const stages = (window.presentation && window.presentation.stages) || [];
                        for (let s of stages) {
                            if (!s) continue;
                            // Prefer the standardized selection helper properties. Do NOT fall back to Transformer variants.
                            const candidate = s._presentationselectionHelper || s._presentationSelectionHelper || s._selectionHelper || null;
                             if (candidate) return candidate;
                        }
                    } catch (e) {}
                    return null;
                };

                // Render thumbnails helper
                this._renderPicThumbnails = (base64List, query) => {
                    try {
                        this.picThumbsContainer.innerHTML = '';
                        if (!Array.isArray(base64List) || base64List.length === 0) {
                            this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicNoImagesFound') : 'No images found.');
                            return;
                        }
                        this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicSelectPictureToReplace') : 'Select a picture to replace');
                        base64List.forEach((b64, idx) => {
                            try {
                                const wrapper = document.createElement('div');
                                // Let the grid cell determine the size so three columns x four rows layout holds
                                wrapper.style.width = '100%';
                                wrapper.style.height = '100%';
                                wrapper.style.overflow = 'hidden';
                                wrapper.style.borderRadius = '8px';
                                wrapper.style.border = '1px solid rgba(0,0,0,0.08)';
                                wrapper.style.cursor = 'pointer';
                                wrapper.title = (window.Lang ? Lang.get('sidebarReplaceImageTooltip').replace('{n}', (idx+1)) : `Replace image ${idx+1}`);

                                const img = document.createElement('img');
                                img.src = b64;
                                img.style.width = '100%';
                                img.style.height = '100%';
                                img.style.objectFit = 'cover';
                                img.onload = () => { /* nothing */ };
                                wrapper.appendChild(img);

                                wrapper.onclick = async () => {
                                    try {
                                        //console.log('[Sidebar] thumbnail clicked', idx);

                                        // Robustly detect whether the 'change cover picture' toggle is active (local var or DOM id)
                                        const isCoverToggleChecked = (changeCoverCheckbox && changeCoverCheckbox.checked) || (typeof document !== 'undefined' && document.getElementById && (document.getElementById('pw_change_cover_toggle') && document.getElementById('pw_change_cover_toggle').checked));
                                        //console.log('[Sidebar] thumbnail click - coverToggle?', isCoverToggleChecked, 'localElem=', !!changeCoverCheckbox);
                                        // If the 'change cover picture' toggle is active, route to cover replacement
                                        if (isCoverToggleChecked) {
                                            try {
                                                // Find cover stage and candidate image
                                                const stages = (window.presentation && window.presentation.stages) || [];
                                                const coverStage = stages && stages.length ? stages[0] : null;
                                                if (!coverStage) { this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverStageUnavailable') : 'Cover stage unavailable.'); return; }
                                                const images = (coverStage.find && coverStage.find('Image')) || [];
                                                let candidate = null; let maxArea = 0;
                                                try {
                                                    const arr = (typeof images.toArray === 'function') ? images.toArray() : Array.from(images);
                                                    arr.forEach(imgNode => {
                                                        try {
                                                            const r = imgNode.getClientRect ? imgNode.getClientRect({ relativeTo: coverStage }) : { width: imgNode.width && imgNode.width() || imgNode.width || 0, height: imgNode.height && imgNode.height() || imgNode.height || 0 };
                                                            const area = (r.width || 0) * (r.height || 0);
                                                            if (area > maxArea) { maxArea = area; candidate = imgNode; }
                                                        } catch (e) {}
                                                    });
                                                } catch (e) {}

                                                // Try helper first
                                                let h = null;
                                                try { const nodeStage = (candidate && typeof candidate.getStage === 'function') ? candidate.getStage() : null; if (nodeStage) h = nodeStage._presentationselectionHelper || nodeStage._presentationSelectionHelper || nodeStage._selectionHelper || null; } catch(e) { h = null; }
                                                if (!h) h = this._findAnyHelper();

                                                const doReplace = async (helperObj, payload) => {
                                                    try {
                                                        if (helperObj && typeof helperObj.replaceCoverImage === 'function') return await helperObj.replaceCoverImage(payload);
                                                        if (helperObj && typeof helperObj.replaceSelectedImage === 'function') return await helperObj.replaceSelectedImage(payload, { preserveSize: true, forceTargetNode: candidate });
                                                        return false;
                                                    } catch (e) { console.warn('[Sidebar] cover thumbnail doReplace threw', e); return false; }
                                                };

                                                let ok = false;
                                                try { ok = await doReplace(h, b64); } catch(e) { ok = false; }

                                                if (!ok) {
                                                    // manual fallback: set image on candidate and resize
                                                    try {
                                                        if (candidate && b64) {
                                                            const imgobj = new window.Image();
                                                            imgobj.src = b64;
                                                            imgobj.onload = () => {
                                                                try {
                                                                    try { if (typeof candidate.image === 'function') candidate.image(imgobj); else candidate.setAttr && candidate.setAttr('image', imgobj); } catch(e) { console.warn('[Sidebar] manual thumbnail set image failed', e); }

                                                                    let prevW = null, prevH = null;
                                                                    try { prevW = (typeof candidate.width === 'function') ? candidate.width() : (candidate.getAttr && candidate.getAttr('width')); } catch (e) {}
                                                                    try { prevH = (typeof candidate.height === 'function') ? candidate.height() : (candidate.getAttr && candidate.getAttr('height')); } catch (e) {}

                                                                    const srcW = (typeof imgobj.naturalWidth === 'number' && imgobj.naturalWidth > 0) ? imgobj.naturalWidth : imgobj.width || 0;
                                                                    const srcH = (typeof imgobj.naturalHeight === 'number' && imgobj.naturalHeight > 0) ? imgobj.naturalHeight : imgobj.height || 0;

                                                                        // compute fitted size preserving aspect ratio and fitting into previous node box
                                                                        try {
                                                                            // Prefer original markers if present to avoid cumulative resizing
                                                                            let origW = null, origH = null;
                                                                            try { origW = (typeof candidate.getAttr === 'function') ? candidate.getAttr('_pwOrigW') : candidate._pwOrigW; } catch (e) { origW = null; }
                                                                            try { origH = (typeof candidate.getAttr === 'function') ? candidate.getAttr('_pwOrigH') : candidate._pwOrigH; } catch (e) { origH = null; }

                                                                            let targetW = (origW !== null && origW !== undefined) ? origW : prevW;
                                                                            let targetH = (origH !== null && origH !== undefined) ? origH : prevH;

                                                                            // If selection helper is available on stage, use its compute helper
                                                                            const nodeStage = (candidate && typeof candidate.getStage === 'function') ? candidate.getStage() : null;
                                                                            let fitted = null;
                                                                            try {
                                                                                if (nodeStage && nodeStage._presentationselectionHelper && typeof nodeStage._presentationselectionHelper._computeFittedSize === 'function') {
                                                                                    fitted = nodeStage._presentationselectionHelper._computeFittedSize(srcW, srcH, targetW, targetH);
                                                                                } else if (window.presentation && window.presentation._selectionHelper && typeof window.presentation._selectionHelper._computeFittedSize === 'function') {
                                                                                    fitted = window.presentation._selectionHelper._computeFittedSize(srcW, srcH, targetW, targetH);
                                                                                }
                                                                            } catch (e) {}

                                                                            if (!fitted) {
                                                                                // fallback simple fit: prefer height then width
                                                                                if (targetH) {
                                                                                    const scale = targetH / (srcH || 1);
                                                                                    fitted = { w: Math.max(1, Math.round(srcW * scale)), h: Math.max(1, Math.round(srcH * scale)) };
                                                                                } else if (targetW) {
                                                                                    const scale = targetW / (srcW || 1);
                                                                                    fitted = { w: Math.max(1, Math.round(srcW * scale)), h: Math.max(1, Math.round(srcH * scale)) };
                                                                                } else {
                                                                                    fitted = { w: srcW, h: srcH };
                                                                                }
                                                                            }

                                                                            if (fitted) {
                                                                                if (typeof candidate.width === 'function' && typeof candidate.height === 'function') { candidate.width(fitted.w); candidate.height(fitted.h); } else { candidate.setAttr && candidate.setAttr('width', fitted.w); candidate.setAttr && candidate.setAttr('height', fitted.h); }
                                                                            }
                                                                        } catch (e) {}

                                                                    try { const layer = candidate.getLayer && candidate.getLayer(); if (layer && typeof layer.draw === 'function') layer.draw(); const st = candidate.getStage && candidate.getStage(); if (st && typeof st.batchDraw === 'function') st.batchDraw(); } catch (e) {}
                                                                    this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverReplacedFallback') : 'Cover image replaced (fallback)');
                                                                } catch (e) { console.warn('[Sidebar] manual thumbnail onload handler failed', e); this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverReplaceFailed') : 'Cover replace failed'); }
                                                            };
                                                            imgobj.onerror = () => { this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverReplaceFailedLoad') : 'Cover replace failed (image load)'); };
                                                            ok = true;
                                                        }
                                                    } catch (e) { console.warn('[Sidebar] manual thumbnail fallback failed', e); this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverReplaceUnavailable') : 'Cover replace unavailable.'); }
                                                } else {
                                                    this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverImageReplaced') : 'Cover image replaced');
                                                }
                                            } catch (e) { console.warn('[Sidebar] cover thumbnail replace error', e); this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverReplaceFailed') : 'Cover replace failed'); }
                                            return;
                                        }

                                        // Use forwarded selection payload instead of querying helper.selected
                                        // Prefer using pw_id if available
                                        let targetPwId = this._lastSelectionId || null;
                                        if (!targetPwId) {
                                            const sel = Array.isArray(this._lastSelection) ? this._lastSelection : [];
                                            if (sel && sel.length > 0) {
                                                try { targetPwId = (sel[0] && typeof sel[0].getAttr === 'function') ? (sel[0].getAttr('pw_id') || sel[0].getAttr('_pwId')) : (sel[0] && (sel[0].pw_id || sel[0]._pwId)); } catch(e) { targetPwId = null; }
                                            }
                                        }

                                        if (!targetPwId) {
                                            try { targetPwId = (parsedSlides && parsedSlides.cover && parsedSlides.cover._pw && (parsedSlides.cover._pw.imageId || parsedSlides.cover._pw.id)) ? (parsedSlides.cover._pw.imageId || parsedSlides.cover._pw.id) : null; } catch(e) { targetPwId = null; }
                                        }

                                        if (!targetPwId) {
                                            this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicPleaseSelectPictureFirst') : 'Please select a picture on the presentation first.');
                                            console.warn('[Sidebar] No image selected to replace (payload)');
                                            return;
                                        }

                                        // find a node registered for this pw id
                                        let node = null;
                                        try { node = (window.presentation && typeof window.presentation.findNodeByPwId === 'function') ? window.presentation.findNodeByPwId(targetPwId) : null; } catch(e) { node = null; }

                                        if (!node) {
                                            this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicSelectedNodeNotFound') : 'Selected node not found (stale).');
                                            console.warn('[Sidebar] Selected pw_id not found in presentation.nodeMap:', targetPwId);
                                            return;
                                        }

                                        // resolve helper from node's stage
                                        let helper = null;
                                        try {
                                            const nodeStage = (node && typeof node.getStage === 'function') ? node.getStage() : (node && node.getLayer && typeof node.getLayer === 'function' ? (node.getLayer() && node.getLayer().getStage && node.getLayer().getStage()) : null);
                                            if (nodeStage) helper = nodeStage._presentationselectionHelper || nodeStage._presentationSelectionHelper || nodeStage._selectionHelper || null;
                                        } catch(e) { helper = null; }

                                        // If the 'change cover picture' toggle is active, route to cover replacement
                                        if (changeCoverCheckbox && changeCoverCheckbox.checked) {
                                            try {
                                                // Find cover stage and candidate image
                                                const stages = (window.presentation && window.presentation.stages) || [];
                                                const coverStage = stages && stages.length ? stages[0] : null;
                                                if (!coverStage) { this.picSearchStatus.textContent = 'Cover stage unavailable.'; return; }
                                                const images = (coverStage.find && coverStage.find('Image')) || [];
                                                let candidate = null; let maxArea = 0;
                                                try {
                                                    const arr = (typeof images.toArray === 'function') ? images.toArray() : Array.from(images);
                                                    arr.forEach(imgNode => {
                                                        try {
                                                            const r = imgNode.getClientRect ? imgNode.getClientRect({ relativeTo: coverStage }) : { width: imgNode.width && imgNode.width() || imgNode.width || 0, height: imgNode.height && imgNode.height() || imgNode.height || 0 };
                                                            const area = (r.width || 0) * (r.height || 0);
                                                            if (area > maxArea) { maxArea = area; candidate = imgNode; }
                                                        } catch (e) {}
                                                    });
                                                } catch (e) {}

                                                // Try helper first
                                                let h = null;
                                                try { const nodeStage = (candidate && typeof candidate.getStage === 'function') ? candidate.getStage() : null; if (nodeStage) h = nodeStage._presentationselectionHelper || nodeStage._presentationSelectionHelper || nodeStage._selectionHelper || null; } catch(e) { h = null; }
                                                if (!h) h = this._findAnyHelper();

                                                const doReplace = async (helperObj, payload) => {
                                                    try {
                                                        if (helperObj && typeof helperObj.replaceCoverImage === 'function') return await helperObj.replaceCoverImage(payload);
                                                        if (helperObj && typeof helperObj.replaceSelectedImage === 'function') return await helperObj.replaceSelectedImage(payload, { preserveSize: true, forceTargetNode: candidate });
                                                        return false;
                                                    } catch (e) { console.warn('[Sidebar] cover thumbnail doReplace threw', e); return false; }
                                                };

                                                let ok = false;
                                                try { ok = await doReplace(h, b64); } catch(e) { ok = false; }

                                                if (!ok) {
                                                    // manual fallback: set image on candidate and resize
                                                    try {
                                                        if (candidate && b64) {
                                                            const imgobj = new window.Image();
                                                            imgobj.src = b64;
                                                            imgobj.onload = () => {
                                                                try {
                                                                    try { if (typeof candidate.image === 'function') candidate.image(imgobj); else candidate.setAttr && candidate.setAttr('image', imgobj); } catch(e) { console.warn('[Sidebar] manual thumbnail set image failed', e); }

                                                                    let prevW = null, prevH = null;
                                                                    try { prevW = (typeof candidate.width === 'function') ? candidate.width() : (candidate.getAttr && candidate.getAttr('width')); } catch (e) {}
                                                                    try { prevH = (typeof candidate.height === 'function') ? candidate.height() : (candidate.getAttr && candidate.getAttr('height')); } catch (e) {}

                                                                    const srcW = (typeof imgobj.naturalWidth === 'number' && imgobj.naturalWidth > 0) ? imgobj.naturalWidth : imgobj.width || 0;
                                                                    const srcH = (typeof imgobj.naturalHeight === 'number' && imgobj.naturalHeight > 0) ? imgobj.naturalHeight : imgobj.height || 0;

                                                                    try {
                                                                        let origW = null, origH = null;
                                                                        try { origW = (typeof candidate.getAttr === 'function') ? candidate.getAttr('_pwOrigW') : candidate._pwOrigW; } catch (e) { origW = null; }
                                                                        try { origH = (typeof candidate.getAttr === 'function') ? candidate.getAttr('_pwOrigH') : candidate._pwOrigH; } catch (e) { origH = null; }

                                                                        let targetW = (origW !== null && origW !== undefined) ? origW : prevW;
                                                                        let targetH = (origH !== null && origH !== undefined) ? origH : prevH;

                                                                        const nodeStage = (candidate && typeof candidate.getStage === 'function') ? candidate.getStage() : null;
                                                                        let fitted = null;
                                                                        try {
                                                                            if (nodeStage && nodeStage._presentationselectionHelper && typeof nodeStage._presentationselectionHelper._computeFittedSize === 'function') {
                                                                                fitted = nodeStage._presentationselectionHelper._computeFittedSize(srcW, srcH, targetW, targetH);
                                                                            } else if (window.presentation && window.presentation._selectionHelper && typeof window.presentation._selectionHelper._computeFittedSize === 'function') {
                                                                                fitted = window.presentation._selectionHelper._computeFittedSize(srcW, srcH, targetW, targetH);
                                                                            }
                                                                        } catch (e) {}

                                                                        if (!fitted) {
                                                                            if (targetH) {
                                                                                const scale = targetH / (srcH || 1);
                                                                                fitted = { w: Math.max(1, Math.round(srcW * scale)), h: Math.max(1, Math.round(srcH * scale)) };
                                                                            } else if (targetW) {
                                                                                const scale = targetW / (srcW || 1);
                                                                                fitted = { w: Math.max(1, Math.round(srcW * scale)), h: Math.max(1, Math.round(srcH * scale)) };
                                                                            } else {
                                                                                fitted = { w: srcW, h: srcH };
                                                                            }
                                                                        }

                                                                        if (fitted) {
                                                                            if (typeof candidate.width === 'function' && typeof candidate.height === 'function') { candidate.width(fitted.w); candidate.height(fitted.h); } else { candidate.setAttr && candidate.setAttr('width', fitted.w); candidate.setAttr && candidate.setAttr('height', fitted.h); }
                                                                        }
                                                                    } catch(e) {}

                                                                    try { const layer = candidate.getLayer && candidate.getLayer(); if (layer && typeof layer.draw === 'function') layer.draw(); const st = candidate.getStage && candidate.getStage(); if (st && typeof st.batchDraw === 'function') st.batchDraw(); } catch (e) {}
                                                                    this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverReplacedFallback') : 'Cover image replaced (fallback)');
                                                                } catch (e) { console.warn('[Sidebar] manual thumbnail onload handler failed', e); this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverReplaceFailed') : 'Cover replace failed'); }
                                                            };
                                                            imgobj.onerror = () => { this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverReplaceFailedLoad') : 'Cover replace failed (image load)'); };
                                                            ok = true;
                                                        }
                                                    } catch (e) { console.warn('[Sidebar] manual thumbnail fallback failed', e); this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverReplaceUnavailable') : 'Cover replace unavailable.'); }
                                                } else {
                                                    this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverImageReplaced') : 'Cover image replaced');
                                                }
                                            } catch (e) { console.warn('[Sidebar] cover thumbnail replace error', e); this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicCoverReplaceFailed') : 'Cover replace failed'); }
                                            return;
                                        }

                                        const hasReplace = h => h && (typeof h.replaceSelectedImage === 'function');
                                        if (!hasReplace(helper)) {
                                            helper = this._findAnyHelper();
                                        }

                                        if (!hasReplace(helper)) {
                                            this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicReplacementUnavailableNoHelper') : 'Replacement unavailable: no selection helper found.');
                                            console.warn('[Sidebar] No helper with replaceSelectedImage found');
                                            return;
                                        }

                                        try {
                                            const replaced = helper.replaceSelectedImage(b64, { preserveSize: true });
                                            //console.log('[Sidebar] replaceSelectedImage returned', replaced);
                                            this.picSearchStatus.textContent = replaced ? (window.Lang ? Lang.get('sidebarPicReplaceSelectedImage') : 'Replaced selected image') : (window.Lang ? Lang.get('sidebarPicNoPicturesToReplace') : 'No pictures to replace selected');
                                        } catch (e) { console.warn('[Sidebar] helper.replaceSelectedImage threw', e); this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarReplaceFailed') : 'Replace failed'); }
 
                                    } catch (e) { console.warn('[Sidebar] thumbnail click error', e); }
                                };

                                this.picThumbsContainer.appendChild(wrapper);
                            } catch (e) { /* per-image */ }
                        });
                    } catch (e) {
                        console.warn('[Sidebar] _renderPicThumbnails error', e);
                    }
                };

                // Wire search button to call helper.searchImages and render thumbnails
                this.picSearchButton.onclick = async () => {
                    const q = (this.picSearchInput && this.picSearchInput.value) || '';
                    if (!q || q.trim().length < 1) {
                        this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicPleaseEnterSearchQuery') : 'Please enter a search query.');
                        return;
                    }
                    this.picSearchButton.disabled = true;
                    this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicSearching') : 'Searching...');

                    try {
                        const helper = this._findAnyHelper();
                        let images = [];

                        if (helper && typeof helper.searchImages === 'function') {
                            // Primary path: let the helper perform a single search + downloads (avoids duplicate logic)
                                images = await helper.searchImages(q.trim(), 12, (i, total) => {
                                this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicDownloadingImages').replace('{i}', i).replace('{total}', total) : `Downloading images... (${i}/${total})`);
                            });

                        } else if (window.Content && typeof window.Content.searchSlideImage === 'function') {
                            // Minimal fallback: call Content.searchSlideImage once and accept base64/data-URI results only
                            try {
                                const res = await window.Content.searchSlideImage({ imageQuery: q.trim(), title: q.trim(), multi: true });
                                let candidates = [];
                                if (Array.isArray(res)) {
                                    candidates = res;
                                } else if (res && Array.isArray(res.images)) {
                                    candidates = res.images;
                                } else if (res && Array.isArray(res.imageUrls)) {
                                    candidates = res.imageUrls;
                                } else if (res && Array.isArray(res.results)) {
                                    candidates = res.results.map(r => (r && (r.imageUrl || r.url || r.src)) || null).filter(Boolean);
                                } else if (typeof res === 'string') {
                                    candidates = [res];
                                }

                                // Only accept data: URIs (already base64) in this minimal fallback to avoid duplicating fetch/convert logic
                                images = (candidates || []).filter(s => typeof s === 'string' && s.startsWith('data:')).slice(0, 8);
                                if (!images || images.length === 0) {
                                    this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicSearchReturnedRemote') : 'Search returned remote URLs; enable preview window helper to fetch images.');
                                }
                            } catch (e) {
                                console.warn('[Sidebar] Content.searchSlideImage single-call fallback failed', e);
                                this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicImageSearchFailed') : 'Image search failed');
                            }

                        } else {
                            // No provider available
                            this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicImageSearchUnavailable') : 'Image search unavailable (no helper/provider).');
                        }

                        this._renderPicThumbnails(images, q.trim());

                    } catch (e) {
                        console.warn('[Sidebar] Image search failed', e);
                        this.picSearchStatus.textContent = (window.Lang ? Lang.get('sidebarPicImageSearchFailed') : 'Image search failed');
                    } finally {
                        this.picSearchButton.disabled = false;
                    }
                };

                this.tabContents['picture'].appendChild(this._pictureControls);
            } catch (e) {
                console.warn('[Sidebar] failed to create picture controls', e);
            }
        }
        // Note: Shape tab removed per simplification request

        parent.appendChild(this.sidebar);
        //console.log('[Sidebar] Sidebar appended to parent:', parent.className || parent);
    }

    selectTab(tabKey, opts = {}) {
        //console.log('[Sidebar] selectTab called:', tabKey);

        // Default behavior: preserve current stage selection unless explicitly requested to clear.
        const preserve = (opts && typeof opts.preserveSelection !== 'undefined') ? !!opts.preserveSelection : true;
        //console.log('[Sidebar] selectTab preserveSelection=', preserve);

        // Clear any active selections on all presentation stages only when preserve is explicitly false
        try {
            if (!preserve && window.presentation && Array.isArray(window.presentation.stages)) {
                window.presentation.stages.forEach(s => {
                    try {
                        // Call deselect on any known selection helper property (standardized names only)
                        if (s && s._presentationselectionHelper && typeof s._presentationselectionHelper.deselect === 'function') {
                            s._presentationselectionHelper.deselect();
                        } else if (s && s._presentationSelectionHelper && typeof s._presentationSelectionHelper.deselect === 'function') {
                            s._presentationSelectionHelper.deselect();
                        } else if (s && s._selectionHelper && typeof s._selectionHelper.deselect === 'function') {
                            s._selectionHelper.deselect();
                        }
                    } catch (e) { /* ignore per-stage */ }
                });
            }
        } catch (e) { console.warn('[Sidebar] error clearing selections before tab switch', e); }

        Object.entries(this.tabContents).forEach(([key, el]) => {
            el.classList.toggle('active', key === tabKey);
        });
        Object.entries(this.tabButtons).forEach(([key, btn]) => {
            btn.classList.toggle('selected', key === tabKey);
        });

        // When opening the Text tab, only refresh and show global controls when there is no node selection.
        // Do NOT force-show global controls here when a node is selected because onSelectionChange
        // is responsible for showing node-specific controls for a selected Text node.
        if (tabKey === 'text') {
            try {
                if ((!this._lastSelection || this._lastSelection.length === 0) && this.globalTextControls) {
                    this.globalTextControls.style.display = '';
                    if (this.nodeTextControls) this.nodeTextControls.style.display = 'none';
                    this._refreshGlobalTextControls();
                }
                // If there is a node selection, onSelectionChange will set nodeTextControls visible.
            } catch (e) { console.warn('[Sidebar] _refreshGlobalTextControls error', e); }
        } else {
            // For other tabs ensure global text controls are hidden and node controls are hidden as well
            try {
                if (this.globalTextControls) this.globalTextControls.style.display = 'none';
                if (this.nodeTextControls) this.nodeTextControls.style.display = 'none';
            } catch (e) {}
        }
    }


    // Gather bullet/content text nodes via presentation heuristics and set global controls to reflect their common attributes
    _refreshGlobalTextControls() {
        if (!this.globalTextControls || !window.presentation) return;
        try {
            const refs = window.presentation._globalRefs || {};
            const texts = window.presentation.findAllTextNodes() || [];
            const bullets = texts.filter(t => window.presentation._isBulletTextNode(t));

            // Debug logging to inspect what the presentation exposes for bullet text nodes
            try {
                //console.log('[Sidebar] _refreshGlobalTextControls: total texts=', texts.length, 'bullet candidates=', bullets.length);
                const inspect = bullets.map(t => ({
                    text: (t.text && t.text()) || '',
                    fontFamily: (t.fontFamily && t.fontFamily()) || null,
                    fontSize: (t.fontSize && t.fontSize()) || null,
                    fill: (t.fill && t.fill()) || null,
                    lineHeight: (t.lineHeight && t.lineHeight()) || null,
                    letterSpacing: (t.letterSpacing && t.letterSpacing()) || null,
                    slideRole: (t.getAttr && t.getAttr('slideRole')) || null
                }));
                //console.log('[Sidebar] bullet text inspection:', inspect);
                if (refs.fontSelect && refs.fontSelect.options) {
                    const opts = Array.from(refs.fontSelect.options).map(o => o.value);
                    //console.log('[Sidebar] fontSelect options count=', opts.length, 'options=', opts);
                }
            } catch (logErr) {
                console.warn('[Sidebar] _refreshGlobalTextControls logging error', logErr);
            }

            if (!bullets || bullets.length === 0) {
                // disable inputs
                Object.values(refs).forEach(r => { if (r && r.disabled !== undefined) r.disabled = true; });
                return;
            }

            // Helper to pick most common value or fallback
            const mostCommon = (arr, accessor, fallback) => {
                const map = {};
                arr.forEach(v => {
                    try { const val = accessor(v); if (val === undefined || val === null) return; map[val] = (map[val] || 0) + 1; } catch (e) {}
                });
                let best = null; let bestCount = 0;
                Object.entries(map).forEach(([k,c]) => { if (c > bestCount) { best = k; bestCount = c; } });
                return best !== null ? best : fallback;
            };

            // fontFamily with fuzzy matching against select options
            if (refs.fontSelect) {
                try {
                    const options = Array.from(refs.fontSelect.options).map(o => o.value);
                    const optionTokens = options.map(o => o.split(',').map(s => s.replace(/['\"]/g, '').trim().toLowerCase()));
                    const bulletsFamilies = bullets.map(t => (t.fontFamily && t.fontFamily()) || '').filter(Boolean).map(f => f.split(',').map(s => s.replace(/['\"]/g, '').trim().toLowerCase()));

                    let bestOption = null; let bestScore = -1;
                    optionTokens.forEach((optTokens, idx) => {
                        let score = 0;
                        bulletsFamilies.forEach(btokens => {
                            for (let bt of btokens) {
                                if (optTokens.includes(bt)) { score++; break; }
                            }
                        });
                        if (score > bestScore) { bestScore = score; bestOption = options[idx]; }
                    });

                    if (bestScore > 0 && bestOption) {
                        refs.fontSelect.value = bestOption;
                    } else {
                        // fallback: try to pick the exact most common family string if present among options
                        const fam = mostCommon(bullets, t => t.fontFamily && t.fontFamily(), refs.fontSelect.value || options[0]);
                        if (options.includes(fam)) {
                            refs.fontSelect.value = fam;
                        } else {
                            // try match by token of the most common family
                            const famToken = (fam || '').toString().split(',')[0].replace(/['\"]/g, '').trim().toLowerCase();
                            const found = options.find(opt => opt.toLowerCase().includes(famToken));
                            if (found) refs.fontSelect.value = found;
                        }
                    }
                    refs.fontSelect.disabled = false;
                } catch (e) {
                    const fam = mostCommon(bullets, t => t.fontFamily && t.fontFamily(), refs.fontSelect.value || 'Arial');
                    refs.fontSelect.value = fam;
                    refs.fontSelect.disabled = false;
                }
            }

            // fontSize (number)
            if (refs.fontSize) {
                const fs = mostCommon(bullets, t => (t.fontSize && t.fontSize()) || undefined, refs.fontSize.value);
                refs.fontSize.value = fs || refs.fontSize.value;
                refs.fontSize.disabled = false;
            }
            // textColor (fill)
            if (refs.textColor) {
                const col = mostCommon(bullets, t => (t.fill && t.fill()) || undefined, refs.textColor.value);
                refs.textColor.value = col || refs.textColor.value;
                refs.textColor.disabled = false;
            }
            // lineHeight
            if (refs.lineHeight) {
                const lh = mostCommon(bullets, t => (t.lineHeight && t.lineHeight()) || undefined, refs.lineHeight.value);
                refs.lineHeight.value = lh || refs.lineHeight.value;
                refs.lineHeight.disabled = false;
            }
            // letterSpacing
            if (refs.letterSpacing) {
                const ls = mostCommon(bullets, t => (t.letterSpacing && t.letterSpacing()) || undefined, refs.letterSpacing.value);
                refs.letterSpacing.value = ls || refs.letterSpacing.value;
                refs.letterSpacing.disabled = false;
            }

        } catch (e) {
            console.warn('[Sidebar] _refreshGlobalTextControls failed', e);
        }
    }

    async renderSelectedStyle(stages, parsedSlides, slideImagesResult) {
        //console.log('[Sidebar] renderSelectedStyle called:', this.selectedStyle);
        //console.log('[Sidebar] Available stages:', stages ? stages.length : 'null');
        //console.log('[Sidebar] Parsed slides:', parsedSlides ? Object.keys(parsedSlides) : 'null');
        
        if (window.SlideStyles && typeof window.SlideStyles.clearStages === 'function') {
            window.SlideStyles.clearStages(stages);
        }
        
        // Special handling for DIY style
        if (this.selectedStyle === 'diy') {
            //console.log('[Sidebar] Rendering DIY style via StyleDIY.renderDIY');
            if (window.StyleDIY && typeof window.StyleDIY.renderDIY === 'function') {
                await window.StyleDIY.renderDIY(stages, parsedSlides, slideImagesResult);
                //console.log('[Sidebar] DIY style rendering completed');
                return;
            } else {
                console.error('[Sidebar] StyleDIY.renderDIY not available, falling back to classic');
            }
        }
        
        const renderFnName = this.styleRenderMap?.[this.selectedStyle];
        //console.log('[Sidebar] Looking for render function:', renderFnName);
        
        if (window.SlideStyles && typeof window.SlideStyles[renderFnName] === 'function') {
            await window.SlideStyles[renderFnName](stages, parsedSlides, slideImagesResult);
            //console.log('[Sidebar] Style rendering completed:', renderFnName);
        } else {
            //console.log('[Sidebar] Render function not found, using classic fallback');
            if (window.SlideStyles && typeof window.SlideStyles.renderClassic === 'function') {
                await window.SlideStyles.renderClassic(stages, parsedSlides, slideImagesResult);
            }
        }
    }

    selectStyle(styleKey) {
        //console.log('[Sidebar] selectStyle called:', styleKey);
        this.selectedStyle = styleKey;
        Array.from(this.sidebar.querySelectorAll('.sidebar-style-card')).forEach(card => {
            card.classList.toggle('selected', card.classList.contains(styleKey));
        });
        if (typeof this.onStyleSelect === 'function') {
            try { this.onStyleSelect(styleKey); } catch(e) { console.warn('[Sidebar] onStyleSelect handler threw', e); }
        }

        // Keep the Styles tab active after changing style — do not switch to Text or any other tab.
        try {
            this.selectTab('styles', { preserveSelection: true });
        } catch (e) {
            console.warn('[Sidebar] failed to re-select styles tab after selectStyle', e);
        }
    }

    openDIYModal() {
        //console.log('[Sidebar] Opening DIY modal');
        if (window.StyleDIY && typeof window.StyleDIY.openDIYModal === 'function') {
            window.StyleDIY.openDIYModal();
        } else {
            console.warn('[Sidebar] StyleDIY not available');
        }
    }

    getSelectedStyle() {
        return this.selectedStyle;
    }

    // Called by PreviewWindow when selection changes in a stage
    onSelectionChange(selectedNodesOrPayload) {
        try {
            // Accept either an array of nodes or an object { selectedNodes, clickedClass }
            let payload = selectedNodesOrPayload;
            let selectedNodes = [];
            if (payload && payload.selectedNodes !== undefined) {
                selectedNodes = Array.isArray(payload.selectedNodes) ? payload.selectedNodes : (payload.selectedNodes ? [payload.selectedNodes] : []);
            } else {
                selectedNodes = Array.isArray(payload) ? payload : (payload ? [payload] : []);
            }

            // Cancel any pending empty-selection handler
            try { if (this._pendingEmptySelectionTimer) { clearTimeout(this._pendingEmptySelectionTimer); this._pendingEmptySelectionTimer = null; } } catch(e) {}

            // store last selection payload so thumbnail handlers can use it without querying helper.selected
            this._lastSelection = Array.isArray(selectedNodes) ? selectedNodes : (selectedNodes ? [selectedNodes] : []);

            // determine and store pw_id for this selection (if any)
            try {
                this._lastSelectionId = null;
                const sel = Array.isArray(this._lastSelection) ? this._lastSelection : [];
                if (sel && sel.length > 0) {
                    try { this._lastSelectionId = (sel[0] && typeof sel[0].getAttr === 'function') ? (sel[0].getAttr('pw_id') || sel[0].getAttr('_pwId')) : (sel[0] && (sel[0].pw_id || sel[0]._pwId)); } catch(e) { this._lastSelectionId = null; }
                }
            } catch(e) { this._lastSelectionId = null; }

            // If there's no selection, do NOT auto-switch tabs. Just update controls if the Text tab is active.
            if (!selectedNodes || selectedNodes.length === 0) {
                // clear cached lastSelectionId
                this._lastSelectionId = null;

                // hide any node-specific text controls
                try { if (this.nodeTextControls) this.nodeTextControls.style.display = 'none'; } catch (e) {}

                // If Text tab is currently active, show global text controls (do not change tabs)
                try {
                    const activeTabKey = Object.entries(this.tabButtons).find(([k, btn]) => btn && btn.classList && btn.classList.contains('selected'))?.[0] || null;
                    if (activeTabKey === 'text' && this.globalTextControls) {
                        this.globalTextControls.style.display = '';
                        try { this._refreshGlobalTextControls(); } catch (e) {}
                    }
                } catch (e) { /* ignore */ }

                return;
            }

            const first = selectedNodes[0];
            const cls = (first && typeof first.getClassName === 'function') ? first.getClassName() : (first && first.className) || null;
            if (!cls) return;

            // Always hide global controls when there is a node selection
            try { if (this.globalTextControls) this.globalTextControls.style.display = 'none'; } catch (e) {}

            // Only auto-select the Text tab when the selected node is a Text node.
            if (cls === 'Text') {
                try {
                    this.selectTab('text', { preserveSelection: true });
                    if (this.nodeTextControls) this.nodeTextControls.style.display = 'block';
                    // Populate text node controls with current values
                    try {
                        if (this.nodeFontSize && typeof first.fontSize === 'function') this.nodeFontSize.value = first.fontSize();
                        if (this.nodeTextColor && typeof first.fill === 'function') this.nodeTextColor.value = first.fill() || this.nodeTextColor.value;
                    } catch (e) { /* ignore populate errors */ }
                } catch (e) { console.warn('[Sidebar] onSelectionChange text handling failed', e); }
            } else {
                // For Images and Shapes do not auto-switch tabs; just ensure node-specific text controls are hidden.
                try { if (this.nodeTextControls) this.nodeTextControls.style.display = 'none'; } catch (e) {}
            }
        } catch (e) {
            console.warn('[Sidebar] onSelectionChange error', e);
        }
    }

    // Delegate selected-node attribute updates to the presentation module
    _applyToSelectedTextNodes(attrs = {}) {
        try {
            if (window.presentation && typeof window.presentation._applyToSelectedTextNodes === 'function') {
                return window.presentation._applyToSelectedTextNodes(attrs);
            }
            console.warn('[Sidebar] presentation._applyToSelectedTextNodes not available');
            return false;
        } catch (e) {
            console.warn('[Sidebar] _applyToSelectedTextNodes delegator error', e);
            return false;
        }
    }

}

window.SlideForgeSidebar = SlideForgeSidebar;
