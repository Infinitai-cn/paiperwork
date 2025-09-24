class presentation {
    constructor() {
        this.stages = [];
        this._globalControls = null;
        // current forwarded selection payload (array of Konva nodes)
        this.selectedNodes = [];
        // map of pw_id -> { stage, node }
        this.nodeMap = {};
        this._pwIdCounter = 1;
        // (shape persistence removed) 
    }

    // generate a presentation-scoped pw id
    generatePwId(prefix = 'pw') {
        try {
            const id = `${prefix}_${(this._pwIdCounter++).toString(36)}`;
            return id;
        } catch (e) { return `pw_${Date.now()}`; }
    }

    // register a node by pw id
    registerNodePwId(pwId, stage, node) {
        try {
            if (!pwId || !node) return false;
            this.nodeMap = this.nodeMap || {};
            this.nodeMap[pwId] = { stage, node };
            return true;
        } catch (e) { return false; }
    }

    // unregister node
    unregisterNodePwId(pwId) {
        try { if (this.nodeMap && this.nodeMap[pwId]) delete this.nodeMap[pwId]; } catch (e) {}
    }

    // find node by pw id
    findNodeByPwId(pwId) {
        try { return (this.nodeMap && this.nodeMap[pwId]) ? this.nodeMap[pwId].node : null; } catch (e) { return null; }
    }

    // Assign pw_id attributes to nodes created by a style application and register them in nodeMap.
    assignPwIdsForStages(stages) {
        try {
            if (!Array.isArray(stages)) return false;
            this.nodeMap = this.nodeMap || {};
            const selectors = ['Text','Image','Rect','Circle','Path','Line','Ellipse','RegularPolygon','Wedge','Ring','Shape','Group'];
            const newIds = new Set();
            stages.forEach(stage => {
                try {
                    selectors.forEach(sel => {
                        try {
                            const found = (stage && typeof stage.find === 'function') ? stage.find(sel) : [];
                            if (!found || found.length === 0) return;
                            found.forEach(node => {
                                try {
                                    if (!node || typeof node.getAttr !== 'function' || typeof node.setAttr !== 'function') return;
                                    const existing = node.getAttr && (node.getAttr('pw_id') || node.getAttr('_pwId'));
                                    if (existing) {
                                        // register existing
                                        this.registerNodePwId(existing, stage, node);
                                        newIds.add(existing);
                                        return;
                                    }
                                    const pwId = this.generatePwId('pw');
                                    try { node.setAttr && node.setAttr('pw_id', pwId); } catch(e) { }
                                    this.registerNodePwId(pwId, stage, node);
                                    newIds.add(pwId);
                                } catch(e) { /* per-node ignore */ }
                            });
                        } catch(e) { /* per-selector ignore */ }
                    });
                } catch(e) { /* per-stage ignore */ }
            });
            // remove stale entries from nodeMap (those not present in newIds)
            try {
                const keys = Object.keys(this.nodeMap || {});
                keys.forEach(k => { if (!newIds.has(k)) { try { delete this.nodeMap[k]; } catch(e) {} } });
            } catch(e) {}
            //console.log('[SlideForge] assignPwIdsForStages completed - total ids=', Object.keys(this.nodeMap).length);
            return true;
        } catch (e) { console.warn('[SlideForge] assignPwIdsForStages failed', e); return false; }
    }

    // Store the current selection payload forwarded by PreviewWindow/selectionHelper
    setSelection(selectedNodes) {
        try {
            this.selectedNodes = Array.isArray(selectedNodes) ? selectedNodes : (selectedNodes ? [selectedNodes] : []);
            // update any global controls state which depends on available text nodes
            try { this._updateGlobalControlsState(); } catch (e) {}
            //console.log('[SlideForge] setSelection called, count=', this.selectedNodes.length);
            return true;
        } catch (e) {
            console.warn('[SlideForge] setSelection error', e);
            return false;
        }
    }

    // Keep a reference to the Konva stages so global controls can operate on them
    setStages(stages) {
        this.stages = Array.isArray(stages) ? stages : [];
        this._updateGlobalControlsState();
        // sync current values into global controls (fontFamily, fontSize, fill, lineHeight, letterSpacing)
        try { if (typeof this.refreshGlobalControls === 'function') this.refreshGlobalControls(); } catch (e) { console.warn('[SlideForge] refreshGlobalControls failed', e); }
    }

    // Create (or return cached) DOM element containing global text controls
    createGlobalTextControls() {
        if (this._globalControls) return this._globalControls;
        const container = document.createElement('div');
        container.className = 'presentation-global-text-controls';

    // Header / legend for the global text controls
    const header = document.createElement('div');
    header.style.fontSize = '15px';
    header.style.fontWeight = '700';
    header.style.marginBottom = '8px';
    header.textContent = (window.Lang ? Lang.get('presentationGlobalTextControlsHeader') : 'Global Text Modifications');
    container.appendChild(header);

        // createLabel now accepts a translation key and a fallback text
        const createLabel = (key, fallback) => {
            const el = document.createElement('div');
            el.style.fontSize = '13px';
            el.style.margin = '8px 0 4px 0';
            el.textContent = (window.Lang ? Lang.get(key) : fallback);
            return el;
        };

        // Font family
        const fontSelect = document.createElement('select');
        // NOTE: Removed Auto (detected) option — selector shows friendly labels but keeps full CSS family as value
        [
            'Arial, Helvetica, sans-serif',
            'Helvetica, Arial, sans-serif',
            'Montserrat, Arial, sans-serif',
            'Impact, "Arial Black", sans-serif',
            'Times New Roman, Times, serif',
            'Georgia, serif',
            'Verdana, Geneva, sans-serif',
            'Tahoma, sans-serif',
            'Trebuchet MS, Helvetica, sans-serif',
            'Courier New, Courier, monospace',
            'Lucida Console, Monaco, monospace',
            'Roboto, "Helvetica Neue", Arial, sans-serif',
            'Open Sans, Arial, sans-serif',
            'Palatino Linotype, "Book Antiqua", Palatino, serif',
            'Garamond, serif',
            'Franklin Gothic Medium, "Arial Narrow", Arial, sans-serif',
            'Brush Script MT, cursive'
        ].forEach(f => {
            const opt = document.createElement('option');
            opt.value = f;
            // show a simplified, friendly label (only the first font token) while preserving the full family string as the option value
            const firstToken = (f || '').toString().split(',')[0].replace(/['\"]/g, '').trim();
            opt.textContent = firstToken || f;
            fontSelect.appendChild(opt);
        });
        // make the selector fill the sidebar width with a small inset so it visually matches the sidebar
		fontSelect.style.display = 'block';
		fontSelect.style.width = 'calc(100% - 16px)';
		fontSelect.style.boxSizing = 'border-box';
		fontSelect.style.padding = '6px 8px';
		// onchange: apply selected full family string directly
		fontSelect.onchange = () => {
			const val = fontSelect.value;
			this.applyToAllTextNodes({ fontFamily: val });
		};
    container.appendChild(createLabel('presentationLabelFontFamily', 'Font family'));
        container.appendChild(fontSelect);

        // Font size
        const fontSize = document.createElement('input');
        fontSize.type = 'number'; fontSize.min = 6; fontSize.max = 200; fontSize.value = 24;
        fontSize.onchange = () => this.applyToAllTextNodes({ fontSize: parseInt(fontSize.value,10) || 12 });
    container.appendChild(createLabel('presentationLabelFontSize', 'Font size'));
        container.appendChild(fontSize);

        // (Global bold/italic/underline controls removed - not used globally)
        // add a small spacer
        const spacer = document.createElement('div'); spacer.style.height = '8px'; container.appendChild(spacer);

        // Text color
        const textColor = document.createElement('input'); textColor.type='color'; textColor.value='#111111'; textColor.onchange = () => this.applyToAllTextNodes({ fill: textColor.value });
    container.appendChild(createLabel('presentationLabelTextColor', 'Text color'));
        container.appendChild(textColor);

        // NOTE: Alignment controls removed to simplify global controls

        // Line height and letter spacing
        const lineHeight = document.createElement('input'); lineHeight.type='number'; lineHeight.min='0.5'; lineHeight.step='0.1'; lineHeight.value='1.2'; lineHeight.onchange = () => this.applyToAllTextNodes({ lineHeight: parseFloat(lineHeight.value) || 1.0 });
    container.appendChild(createLabel('presentationLabelLineHeight', 'Line height'));
        container.appendChild(lineHeight);
        const letterSpacing = document.createElement('input'); letterSpacing.type='number'; letterSpacing.step='0.1'; letterSpacing.value='0'; letterSpacing.onchange = () => this.applyToAllTextNodes({ letterSpacing: parseFloat(letterSpacing.value) || 0 });
    container.appendChild(createLabel('presentationLabelLetterSpacing', 'Letter spacing'));
        container.appendChild(letterSpacing);

        this._globalControls = container;
        // store refs for potential future updates
        this._globalRefs = { fontSelect, fontSize, textColor, lineHeight, letterSpacing };

        // Set initial enabled/disabled state
        this._updateGlobalControlsState();

        return this._globalControls;
    }

    getGlobalTextControls() {
        return this.createGlobalTextControls();
    }

    // Find all Konva.Text nodes across known stages
    findAllTextNodes() {
        if (!Array.isArray(this.stages)) return [];
        let result = [];
        this.stages.forEach(stage => {
            try {
                if (stage && typeof stage.find === 'function') {
                    const found = stage.find('Text') || [];
                    result = result.concat(found);
                }
            } catch (e) {
                // ignore
            }
        });
        return result;
    }


    // Heuristic to detect bullet/content text nodes vs titles/subtitles
    _isBulletTextNode(txt) {
        if (!txt || typeof txt.text !== 'function') return false;
        try {
            // Prefer explicit marker if present
            const role = txt.getAttr && txt.getAttr('slideRole');
            if (role === 'bullet' || role === 'content') return true;
            if (role === 'title' || role === 'subtitle' || role === 'cover-title') return false;

            const text = (txt.text && txt.text()) || '';
            if (!text) return false;
            const trimmed = text.trim();
            // Common bullet markers: •, -, *, numbered lists (1.), or starting with dash
            if (/^(\u2022|•|\-|\*|\d+\.|•)\s+/.test(trimmed)) return true;
            // Heuristic: bullets often are shorter fontSize (<= 48) and positioned lower than large titles
            const fs = (txt.fontSize && txt.fontSize()) || 0;
            if (fs && fs <= 24) return true;
            return false;
        } catch (e) {
            return false;
        }
    }

    _updateGlobalControlsState() {
        if (!this._globalControls) return;
        const anyText = this.findAllTextNodes().length > 0;
        const inputs = Array.from(this._globalControls.querySelectorAll('input,select,button'));
        inputs.forEach(el => el.disabled = !anyText);
    }

    // Refresh the global controls inputs to reflect current bullet text attributes
	refreshGlobalControls() {
		if (!this._globalControls || !this._globalRefs) return;
		try {
			const refs = this._globalRefs || {};
			const texts = this.findAllTextNodes() || [];
			const bullets = texts.filter(t => this._isBulletTextNode(t));
			if (!bullets || bullets.length === 0) {
				Object.values(refs).forEach(r => { if (r && r.disabled !== undefined) r.disabled = true; });
				return;
			}

			const mostCommon = (arr, accessor, fallback) => {
				const map = {};
				arr.forEach(v => {
					try {
						const val = accessor(v);
						if (val === undefined || val === null) return;
						map[val] = (map[val] || 0) + 1;
					} catch (e) {}
				});
				let best = null; let bestCount = 0;
				Object.entries(map).forEach(([k,c]) => { if (c > bestCount) { best = k; bestCount = c; } });
				return best !== null ? best : fallback;
			};

			if (refs.fontSelect) {
				try {
					const options = Array.from(refs.fontSelect.options).map(o => o.value);
					// derive most-common family string from bullets
					const fam = mostCommon(bullets, t => t.fontFamily && t.fontFamily(), refs.fontSelect.value || options[0]);
					let detectedFamily = null;
					if (options.includes(fam)) {
						detectedFamily = fam;
					} else {
						// try token match
						const famToken = (fam || '').toString().split(',')[0].replace(/['\"]/g, '').trim().toLowerCase();
						const found = options.find(opt => opt.toLowerCase().includes(famToken));
						if (found) detectedFamily = found;
					}
					if (detectedFamily) {
						refs.fontSelect.value = detectedFamily;
					}
					refs.fontSelect.disabled = false;
				} catch (e) {
					// fallback to simple assignment in case of unexpected structure
					const fam = mostCommon(bullets, t => t.fontFamily && t.fontFamily(), refs.fontSelect.value || 'Arial');
					refs.fontSelect.value = fam;
					refs.fontSelect.disabled = false;
				}
			}
			if (refs.fontSize) {
				try {
					// prefer the smallest font size among bullets so selector shows the minimum when multiple sizes exist
					const sizes = bullets.map(t => (t.fontSize && t.fontSize())).filter(v => typeof v === 'number' && !isNaN(v));
					if (sizes.length > 0) {
						refs.fontSize.value = Math.min.apply(null, sizes);
					} else {
						const fs = mostCommon(bullets, t => (t.fontSize && t.fontSize()) || undefined, refs.fontSize.value);
						refs.fontSize.value = fs || refs.fontSize.value;
					}
					refs.fontSize.disabled = false;
				} catch (e) {
					try { refs.fontSize.disabled = false; } catch (e2) {}
				}
			}
			if (refs.textColor) {
				const col = mostCommon(bullets, t => (t.fill && t.fill()) || undefined, refs.textColor.value);
				refs.textColor.value = col || refs.textColor.value;
				refs.textColor.disabled = false;
			}
			if (refs.lineHeight) {
				const lh = mostCommon(bullets, t => (t.lineHeight && t.lineHeight()) || undefined, refs.lineHeight.value);
				refs.lineHeight.value = lh || refs.lineHeight.value;
				refs.lineHeight.disabled = false;
			}
			if (refs.letterSpacing) {
				const ls = mostCommon(bullets, t => (t.letterSpacing && t.letterSpacing()) || undefined, refs.letterSpacing.value);
				refs.letterSpacing.value = ls || refs.letterSpacing.value;
				refs.letterSpacing.disabled = false;
			}
		} catch (e) {
			console.warn('[SlideForge] refreshGlobalControls error', e);
		}
	}

    // Apply attrs to all text nodes found. Special-case: fontSize and fill and lineHeight/letterSpacing should only affect bullet/content text nodes.
    applyToAllTextNodes(attrs) {
        const texts = this.findAllTextNodes();
        // Handle fontSize, fill, lineHeight, letterSpacing specially: apply only to bullet/content nodes
        const handleFontSize = attrs && attrs.fontSize !== undefined;
        const handleFill = attrs && attrs.fill !== undefined;
        const handleLineHeight = attrs && attrs.lineHeight !== undefined;
        const handleLetterSpacing = attrs && attrs.letterSpacing !== undefined;

        if (handleFontSize || handleFill || handleLineHeight || handleLetterSpacing) {
            const bulletTexts = texts.filter(t => this._isBulletTextNode(t));
            bulletTexts.forEach(txt => {
                try {
                    const specific = {};
                    if (handleFontSize) specific.fontSize = attrs.fontSize;
                    if (handleFill) specific.fill = attrs.fill;
                    if (handleLineHeight) specific.lineHeight = attrs.lineHeight;
                    if (handleLetterSpacing) specific.letterSpacing = attrs.letterSpacing;
                    this._applyAttrsToTextNode(txt, specific);
                    const layer = txt.getLayer(); if (layer && typeof layer.batchDraw === 'function') layer.batchDraw();
                } catch (e) {
                    console.warn('[SlideForge] Error applying specific attrs to text node', e);
                }
            });
        }

        // Apply remaining attributes to all texts (excluding the ones handled above)
        const otherAttrs = Object.assign({}, attrs);
        ['fontSize','fill','lineHeight','letterSpacing'].forEach(k => { if (otherAttrs && otherAttrs[k] !== undefined) delete otherAttrs[k]; });
        if (otherAttrs && Object.keys(otherAttrs).length > 0) {
            texts.forEach(txt => {
                try {
                    this._applyAttrsToTextNode(txt, otherAttrs);
                    const layer = txt.getLayer(); if (layer && typeof layer.batchDraw === 'function') layer.batchDraw();
                } catch (e) {
                    console.warn('[SlideForge] Error applying attrs to text node', e);
                }
            });
        }

        // update controls state if needed
        this._updateGlobalControlsState();
        //console.log('[SlideForge] applyToAllTextNodes', attrs);
    }

    // Helper similar to Sidebar implementation for applying attributes to a Konva.Text node
    _applyAttrsToTextNode(txt, attrs) {
        if (!txt) return;
        try {
            if (attrs.fontFamily !== undefined) txt.fontFamily(attrs.fontFamily);
            if (attrs.fontSize !== undefined) txt.fontSize(attrs.fontSize);
            if (attrs.fill !== undefined) txt.fill(attrs.fill);
            if (attrs.lineHeight !== undefined) txt.lineHeight(attrs.lineHeight);
            if (attrs.letterSpacing !== undefined) txt.letterSpacing(attrs.letterSpacing);
            if (attrs.align !== undefined) txt.align(attrs.align);

            // Note: global toggle bold/italic/underline logic removed. Node-level controls can still set fontStyle directly if implemented.
        } catch (e) {
            console.warn('[SlideForge] _applyAttrsToTextNode error', e, attrs);
        }
    }
        // Apply attribute changes to the currently selected nodes (from selectionHelper)
    _applyToSelectedTextNodes(attrs = {}) {
        try {
            const stages = Array.isArray(this.stages) ? this.stages : (window.presentation && window.presentation.stages) || [];
            let anyApplied = false;
            stages.forEach(stage => {
                try {
                    // find selection helper (support multiple stored names used across the codebase)
                    // locate any helper instance without probing its internal 'selected' property
                    const helper = (stage && (
                        stage._presentationselectionHelper ||
                        stage._presentationSelectionHelper ||
                        stage._selectionHelper ||
                        null
                    ));
                    if (!helper) return;

                    // Resolve selected nodes without reading helper.selected directly.
                    // Prefer the global presentation.selectedNodes (forwarded payload), else ask helper via a public getter if present.
                    let nodes = [];
                    if (window.presentation && Array.isArray(window.presentation.selectedNodes) && window.presentation.selectedNodes.length > 0) {
                         nodes = window.presentation.selectedNodes;
                     } else if (helper && typeof helper.getSelectedNodes === 'function') {
                         try { nodes = helper.getSelectedNodes() || []; } catch (e) { nodes = []; }
                     } else {
                         nodes = [];
                     }

                     // Normalize selection: if a Group is selected, expand to its descendant Text nodes so
                     // node-specific text edits apply even when the click resolved to a Group container.
                     try {
                        const expanded = [];
                        for (let n of nodes) {
                            try {
                                const clsN = (n && typeof n.getClassName === 'function') ? n.getClassName() : (n && n.className) || null;
                                if (clsN === 'Group') {
                                    try {
                                        if (typeof n.find === 'function') {
                                            const texts = n.find('Text') || [];
                                            if (texts && texts.length > 0) {
                                                expanded.push(...texts);
                                                continue;
                                            }
                                        }
                                    } catch (e) { /* ignore group find errors */ }
                                }
                                expanded.push(n);
                            } catch (e) { /* per-node ignore */ }
                        }
                        nodes = expanded;
                    } catch (e) { /* ignore normalization errors */ }

                     nodes.forEach(n => {
                         try {
                             Object.entries(attrs).forEach(([k, v]) => {
                                 // prefer Konva setter methods when present
                                 if (typeof n[k] === 'function') {
                                     try { n[k](v); } catch(e) { n.setAttr && n.setAttr(k, v); }
                                 } else if (k === 'fill' && typeof n.fill === 'function') {
                                     n.fill(v);
                                 } else if ((k === 'fontSize' || k === 'font-size') && typeof n.fontSize === 'function') {
                                     n.fontSize(v);
                                 } else if ((k === 'lineHeight' || k === 'line-height') && typeof n.lineHeight === 'function') {
                                     n.lineHeight(v);
                                 } else if (n.setAttr) {
                                     n.setAttr(k, v);
                                 } else {
                                     try { n[k] = v; } catch(e) {}
                                 }
                             });
                             const layer = n.getLayer && n.getLayer(); if (layer && typeof layer.batchDraw === 'function') layer.batchDraw();
                             anyApplied = true;
                         } catch (e) { /* per-node */ }
                     });
                } catch (e) { /* per-stage */ }
            });

            // fallback: if no helper found, try window.presentation.selectedNodes
            if (!anyApplied && window.presentation && Array.isArray(window.presentation.selectedNodes)) {
                try {
                    window.presentation.selectedNodes.forEach(n => {
                        try {
                            Object.entries(attrs).forEach(([k, v]) => {
                                if (typeof n[k] === 'function') n[k](v);
                                else if (n.setAttr) n.setAttr(k, v);
                                else try { n[k] = v; } catch(e) {}
                            });
                            const layer = n.getLayer && n.getLayer(); if (layer && typeof layer.batchDraw === 'function') layer.batchDraw();
                            anyApplied = true;
                        } catch (e) {}
                    });
                } catch (e) {}
            }

            if (!anyApplied) {
                // nothing applied — no selection helper or selected nodes available
                //console.log('[SlideForge] _applyToSelectedTextNodes: no selected nodes found');
            } else {
                //console.log('[SlideForge] _applyToSelectedTextNodes applied', attrs);
            }
            return anyApplied;
        } catch (e) {
            console.warn('[SlideForge] _applyToSelectedTextNodes error', e);
            return false;
        }
    }
}

// Export class and initialize global instance
window.presentation = presentation;
window.presentation = new presentation();
