class selectionHelper {
    constructor() {
        this.stage = null;
        this.layer = null; // optional content layer reference
        this.overlayLayer = null; // dedicated layer for selection UI
        this._selectionRect = null; // visible fallback selection rectangle
        this.events = {};
        this.selected = [];
        this._stageClickHandler = null;
    }

    init({ stage, layer } = {}) {
        if (!window.Konva) {
            console.warn('[selectionHelper] Konva not available');
            return;
        }
        this.stage = stage;
        if (layer) this.layer = layer;

        // create an overlay layer for selection UI and ensure it's on top
        try {
            this.overlayLayer = new window.Konva.Layer({ listening: true });
            if (this.stage) {
                if (!this.overlayLayer.getParent()) this.stage.add(this.overlayLayer);
                if (this.overlayLayer.getParent() && typeof this.overlayLayer.moveToTop === 'function') this.overlayLayer.moveToTop();
                if (typeof this.overlayLayer.batchDraw === 'function') this.overlayLayer.batchDraw();
            }
        } catch (e) {
            console.warn('[selectionHelper] overlay layer creation failed, falling back to content layer', e);
            this.overlayLayer = this.layer || null;
        }

        // create visible selection rect (fallback becomes main selection UI)
        try {
            this._selectionRect = new window.Konva.Rect({
                x: 0, y: 0, width: 0, height: 0,
                stroke: '#f97316', strokeWidth: 2,
                dash: [8, 6], cornerRadius: 6,
                listening: false,
                visible: false
            });
            if (this.overlayLayer) this.overlayLayer.add(this._selectionRect);
        } catch (e) {
            console.warn('[selectionHelper] selection rect creation failed', e);
            this._selectionRect = null;
        }

        // stage click handler: select/deselect nodes using fallback rect
        this._stageClickHandler = e => {
            try {
                const rawTarget = e.target;
                const tClass = (rawTarget && rawTarget.getClassName && rawTarget.getClassName()) || null;
                const tId = (rawTarget && rawTarget._id) || null;
               //console.log('[selectionHelper] stage click target:', { className: tClass, id: tId });

                // remember last clicked class so we can include it in selectionChange payloads
                try { this._lastClickedClass = tClass; } catch (e) { this._lastClickedClass = null; }

                // click on empty stage (background)
                if (!rawTarget || rawTarget === this.stage) {
                    this.deselect();
                    return;
                }

                // Ignore clicks on the visible selection rect itself
                if (this._selectionRect && rawTarget === this._selectionRect) {
                   //console.log('[selectionHelper] click on selection rect - ignored');
                    return;
                }

                // Also ignore clicks coming from overlay UI children
                try {
                    if (rawTarget && typeof rawTarget.getParent === 'function' && rawTarget.getParent() === this.overlayLayer) {
                       //console.log('[selectionHelper] click on overlay UI - ignored');
                        return;
                    }
                } catch (e) { /* ignore overlay-parent check errors */ }

                // Resolve to a selectable node: prefer Image or Text nodes.
                let target = rawTarget;
                try {
                    // Treat a broader set of node classes as selectable (Images, Texts and Shapes)
                    const selectable = new Set(['Image', 'Text', 'Rect', 'Circle', 'Path', 'Line', 'Ellipse', 'RegularPolygon', 'Wedge', 'Ring', 'Shape', 'Group']);
                    while (target && target !== this.stage) {
                        let cls = null;
                        try { cls = (typeof target.getClassName === 'function') ? target.getClassName() : null; } catch (e) { cls = null; }

                        if (cls && selectable.has(cls)) {
                            // If a Group, try to prefer Image/Text children inside it, otherwise keep the Group as selectable
                            if (cls === 'Group') {
                                try {
                                    if (typeof target.find === 'function') {
                                        const imgs = target.find('Image') || [];
                                        if (imgs && imgs.length > 0) { target = imgs[imgs.length - 1]; break; }
                                        const txts = target.find('Text') || [];
                                        if (txts && txts.length > 0) { target = txts[0]; break; }
                                    }
                                } catch (e) { /* ignore group-inspection errors */ }
                            }
                            // Found a selectable node (Image/Text/Shape)
                            break;
                        }

                        try { target = (typeof target.getParent === 'function') ? target.getParent() : null; } catch (e) { target = null; }
                    }
                } catch (err) {
                    console.warn('[selectionHelper] error resolving clickable target', err);
                }

                // If nothing resolved to a node we can operate on, treat it as background click
                if (!target || target === this.stage) {
                    this.deselect();
                    return;
                }

                // If the resolved node carries a pw_id we should select all nodes that share that pw_id
                try {
                    let pwId = null;
                    try { pwId = this._getNodeIdentifier(target); } catch (e) { pwId = null; }
                    if (pwId) {
                        const matched = [];
                        const selectors = ['Text', 'Image', 'Rect', 'Circle', 'Path', 'Line', 'Ellipse', 'RegularPolygon', 'Wedge', 'Ring', 'Shape', 'Group'];
                        for (let sel of selectors) {
                            try {
                                if (!this.stage || typeof this.stage.find !== 'function') continue;
                                const arr = this.stage.find(sel) || [];
                                arr.forEach(n => {
                                    try {
                                        const id = this._getNodeIdentifier(n);
                                        if (id === pwId) matched.push(n);
                                    } catch (e) { }
                                });
                            } catch (e) { /* per-selector ignore */ }
                        }

                        if (matched.length > 0) {
                            this.select(matched);
                            return;
                        }
                    }
                } catch (e) { /* ignore pw id resolution errors */ }

                // select the resolved node
                this.select(target);
            } catch (err) {
                console.warn('[selectionHelper] stage click handler error', err);
            }
        };

        if (this.stage && typeof this.stage.on === 'function') {
            this.stage.on('click', this._stageClickHandler);
        }

        // double-click / double-tap handler for inline text editing
        this._stageDblClickHandler = e => {
            try {
                const rawTarget = e.target;
                let target = rawTarget;

                // Resolve to a Text node by climbing parents
                try {
                    while (target && target !== this.stage) {
                        const cls = (typeof target.getClassName === 'function') ? target.getClassName() : null;
                        if (cls === 'Text') break;
                        target = (typeof target.getParent === 'function') ? target.getParent() : null;
                    }
                } catch (err) { target = null; }

                if (!target || target === this.stage) return;

                // Only allow editing Konva.Text nodes
                try {
                    if (typeof target.getClassName === 'function' && target.getClassName() === 'Text') {
                        // ensure this node is selected first
                        try { this.select(target); } catch (e) { }
                        this._startTextEdit(target);
                    }
                } catch (e) { /* ignore */ }
            } catch (err) {
                console.warn('[selectionHelper] dblclick handler error', err);
            }
        };

        if (this.stage && typeof this.stage.on === 'function') {
            this.stage.on('dblclick', this._stageDblClickHandler);
            this.stage.on('dbltap', this._stageDblClickHandler);
        }

        // expose a default AI-modify handler that the Sidebar or other UI can call
        try { this.onAiModify = this.modifySelectedTextWithAI ? this.modifySelectedTextWithAI.bind(this) : null; } catch (e) { this.onAiModify = null; }
    }

    on(eventName, cb) {
        if (!this.events[eventName]) this.events[eventName] = [];
        this.events[eventName].push(cb);
    }

    off(eventName, cb) {
        if (!this.events[eventName]) return;
        this.events[eventName] = this.events[eventName].filter(f => f !== cb);
    }

    _emit(eventName, payload) {
        const list = this.events[eventName] || [];
        list.forEach(cb => { try { cb(payload); } catch (e) { console.warn('[selectionHelper] event handler error', e); } });
    }

    // Select a single node or an array of nodes using the fallback rect
    select(nodeOrArray) {
        const nodes = Array.isArray(nodeOrArray) ? nodeOrArray : [nodeOrArray];
        const valid = nodes.filter(n => n && n.getClassName && n.getClassName() !== 'selectionHelper');
       //console.log('[selectionHelper] select called, valid nodes count:', valid.length);

        this.selected = valid;

        // Record original size for Image nodes on first selection to avoid cumulative resizing
        try {
            valid.forEach(n => {
                try {
                    const cls = (n && typeof n.getClassName === 'function') ? n.getClassName() : null;
                    if (cls && cls === 'Image') {
                        // Try to read existing original size marker
                        let origW = null, origH = null;
                        try { origW = (typeof n.getAttr === 'function') ? n.getAttr('_pwOrigW') : (n._pwOrigW); } catch (e) { origW = null; }
                        try { origH = (typeof n.getAttr === 'function') ? n.getAttr('_pwOrigH') : (n._pwOrigH); } catch (e) { origH = null; }

                        if ((origW === null || origW === undefined) || (origH === null || origH === undefined)) {
                            // Capture current displayed size as original (only once)
                            let curW = null, curH = null;
                            try { curW = (typeof n.width === 'function') ? n.width() : (n.getAttr && n.getAttr('width')); } catch (e) { curW = null; }
                            try { curH = (typeof n.height === 'function') ? n.height() : (n.getAttr && n.getAttr('height')); } catch (e) { curH = null; }
                            try { if (typeof n.setAttr === 'function') { if (curW !== null && curW !== undefined) n.setAttr('_pwOrigW', curW); if (curH !== null && curH !== undefined) n.setAttr('_pwOrigH', curH); } else { if (curW !== null && curW !== undefined) n._pwOrigW = curW; if (curH !== null && curH !== undefined) n._pwOrigH = curH; } } catch (e) { }
                        }
                    }
                } catch (e) { /* per-node ignore */ }
            });
        } catch (e) { }

        // compute union bbox and show selection rect on top layer
        try {
            if (!this._selectionRect || !this.stage) return;

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            valid.forEach(n => {
                try {
                    const r = (typeof n.getClientRect === 'function') ? n.getClientRect({ relativeTo: this.stage }) : null;
                    if (r) {
                        minX = Math.min(minX, r.x);
                        minY = Math.min(minY, r.y);
                        maxX = Math.max(maxX, r.x + r.width);
                        maxY = Math.max(maxY, r.y + r.height);
                    }
                } catch (e) { /* ignore per-node */ }
            });

            if (minX === Infinity || minY === Infinity) {
                const n = valid[0];
                if (n && typeof n.getClientRect === 'function') {
                    const r = n.getClientRect({ relativeTo: this.stage });
                    minX = r.x; minY = r.y; maxX = r.x + r.width; maxY = r.y + r.height;
                }
            }

            if (minX !== Infinity) {
                // ensure rect is on overlay/top layer
                let topLayer = null;
                try {
                    if (this.stage && typeof this.stage.getLayers === 'function') {
                        const layers = this.stage.getLayers();
                        if (layers && layers.length > 0) topLayer = layers[layers.length - 1];
                    }
                } catch (e) { }
                topLayer = topLayer || this.overlayLayer || (valid[0] && valid[0].getLayer && valid[0].getLayer());

                try {
                    if (this._selectionRect.getLayer() !== topLayer) {
                        if (this._selectionRect.getLayer()) this._selectionRect.getLayer().remove(this._selectionRect);
                        if (topLayer) topLayer.add(this._selectionRect);
                    }
                } catch (e) { }

                const pad = 8;
                this._selectionRect.setAttrs({ x: minX - pad, y: minY - pad, width: Math.max(10, (maxX - minX) + pad * 2), height: Math.max(10, (maxY - minY) + pad * 2), visible: true });

                try { if (topLayer && typeof topLayer.batchDraw === 'function') topLayer.batchDraw(); } catch (e) { }
                try { if (this.stage && typeof this.stage.draw === 'function') this.stage.draw(); } catch (e) { }
            }
        } catch (e) {
            console.warn('[selectionHelper] selectionRect update failed', e);
        }

        // emit selection event
        try {
            const info = valid.map(n => ({ className: n.getClassName(), attrs: (typeof n.getAttrs === 'function') ? n.getAttrs() : (n.attrs || {}) }));
           //console.log('[selectionHelper] selection', info);
            this._emit('selectionChange', { selectedNodes: valid, clickedClass: this._lastClickedClass || null });
        } catch (e) {
            this._emit('selectionChange', { selectedNodes: valid, clickedClass: this._lastClickedClass || null });
        }

        // Clear the transient clickedClass so it doesn't carry over to subsequent deselect events
        try { this._lastClickedClass = null; } catch (e) { }
    }

    deselect() {
        // Diagnostic trace to help identify who is calling deselect
        try {
           //console.log('[selectionHelper] deselect called - current selected count=', Array.isArray(this.selected) ? this.selected.length : 0);
            //console.trace('[selectionHelper] deselect call stack');
        } catch (e) { }

        this.selected = [];
        try {
            if (this._selectionRect) {
                try { this._selectionRect.hide && this._selectionRect.hide(); } catch (e) { this._selectionRect.setAttrs && this._selectionRect.setAttrs({ visible: false }); }
                const rectLayer = this._selectionRect.getLayer && this._selectionRect.getLayer();
                if (rectLayer && typeof rectLayer.batchDraw === 'function') rectLayer.batchDraw();
            }
        } catch (e) { }

       //console.log('[selectionHelper] deselected');
        // Emit deselect with no clickedClass to avoid propagating stale click context
        try { this._lastClickedClass = null; } catch (e) { }
        this._emit('selectionChange', { selectedNodes: [], clickedClass: null });
    }

    // apply a property to selected nodes (simple helper)
    applyProperty(key, value) {
        if (!this.selected || this.selected.length === 0) return;
        this.selected.forEach(n => {
            try {
                if (typeof n[key] === 'function') {
                    n[key](value);
                } else {
                    n.setAttr && n.setAttr(key, value);
                }
                const layer = n.getLayer(); if (layer && typeof layer.batchDraw === 'function') layer.batchDraw();
            } catch (e) {
                console.warn('[selectionHelper] applyProperty error', e);
            }
        });
    }

    // Image search and cache per helper instance. Uses server multi-image API first, then falls back.
    async searchImages(query, count = 12, progressCb) {
        if (!query || typeof query !== 'string' || query.trim().length === 0) return [];
        this._imageCache = this._imageCache || {};
        const qk = query.trim();
        const cached = Array.isArray(this._imageCache[qk]) ? this._imageCache[qk] : [];
        if (cached && cached.length >= count) {
           //console.log('[selectionHelper] searchImages - returning cached results:', qk, 'count=', Math.min(count, cached.length));
            return cached.slice(0, count);
        }

        // helper to convert a list of urls (or data URIs) to base64 data URIs
        const loadUrlsToBase64 = async (urls = [], progressCb) => {
            const out = [];
           //console.log('[selectionHelper] loadUrlsToBase64 - starting download/convert for', urls.length, 'items');
            for (let i = 0; i < urls.length; i++) {
                const raw = urls[i];
                try {
                    if (!raw) { progressCb && progressCb(i + 1, urls.length); //console.log('[selectionHelper] loadUrlsToBase64 - skipping empty url at', i); 
                    continue; 
                }
                    if (typeof raw === 'string' && raw.startsWith('data:')) {
                        out.push(raw);
                        progressCb && progressCb(i + 1, urls.length);
                       //console.log('[selectionHelper] loadUrlsToBase64 - already data URI at', i);
                        continue;
                    }
                    const resp = await fetch(raw);
                    if (!resp.ok) { progressCb && progressCb(i + 1, urls.length); 
                       //console.log('[selectionHelper] loadUrlsToBase64 - fetch failed for', raw, 'status=', resp.status); 
                        continue; 
                    }
                    const blob = await resp.blob();
                    const base64 = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                    out.push(base64);
                   //console.log('[selectionHelper] loadUrlsToBase64 - converted item', i + 1, '/', urls.length);
                } catch (e) {
                    console.warn('[selectionHelper] loadUrlsToBase64 - error converting url at index', i, e);
                }
                progressCb && progressCb(i + 1, urls.length);
            }
           //console.log('[selectionHelper] loadUrlsToBase64 - finished, converted count=', out.length);
            return out;
        };

        let results = [];

        // Primary: call server multi-image endpoint to obtain multiple image URLs in one request
        try {
           //console.log('[selectionHelper] searchImages - calling server multi-image endpoint for:', qk);
            const resp = await fetch(`/api/proxy/image-search-multi?q=${encodeURIComponent(qk)}`);
            if (resp && resp.ok) {
                const j = await resp.json();
                let images = [];
                if (j && Array.isArray(j.images)) images = j.images;
                else if (j && Array.isArray(j.results)) images = j.results;
                else if (j && Array.isArray(j.hits)) images = j.hits;

                // normalize to string URLs
                images = (images || []).map(u => {
                    if (!u) return null;
                    if (typeof u === 'string') return u;
                    if (u.imageUrl) return u.imageUrl;
                    if (u.url) return u.url;
                    if (u.src) return u.src;
                    if (u.webformatURL) return u.webformatURL;
                    return null;
                }).filter(Boolean);

                images = Array.from(new Set(images)).filter(u => /^https?:\/\//i.test(u));
               //console.log('[selectionHelper] server multi - extracted urls count=', images.length, 'sample=', images.slice(0, Math.min(5, images.length)));

                if (images.length > 0) {
                    const limited = images.slice(0, count);
                    const converted = await loadUrlsToBase64(limited, (i, total) => { if (progressCb) progressCb(i, total); });
                    results = results.concat(converted || []);
                }
            } else {
                console.warn('[selectionHelper] server multi endpoint returned non-ok response', resp && resp.status);
            }
        } catch (e) {
            console.warn('[selectionHelper] server multi-image request failed', e);
        }

        // If not enough results, previously we fell back to Content.searchSlideImage.
        // That fallback has been removed because Content.searchSlideImage performs a single-image search.
        // Rely on the server multi-image endpoint and the single-image proxy only.
        if ((!results || results.length < count)) {
           //console.log('[selectionHelper] searchImages - skipping Content.searchSlideImage fallback (removed)');
        }

        // Last-resort fallback: call single-image proxy and extract urls
        if ((!results || results.length < count)) {
            try {
               //console.log('[selectionHelper] searchImages - falling back to single proxy search for:', qk);
                const resp2 = await fetch(`/api/proxy/image-search?q=${encodeURIComponent(qk)}`);
                if (resp2 && resp2.ok) {
                    const j = await resp2.json();
                    const extractUrls = (obj, depth = 0) => {
                        const found = [];
                        if (!obj || depth > 6) return found;
                        if (typeof obj === 'string') {
                            if (/^https?:\/\//i.test(obj)) found.push(obj);
                            return found;
                        }
                        if (Array.isArray(obj)) {
                            for (let item of obj) found.push(...extractUrls(item, depth + 1));
                            return found;
                        }
                        if (typeof obj === 'object') {
                            const candidates = ['imageUrl', 'url', 'src', 'previewURL', 'largeImageURL', 'thumb', 'thumbnail', 'dataUrl', 'data', 'webformatURL'];
                            for (let f of candidates) {
                                if (obj[f] && typeof obj[f] === 'string' && /^https?:\/\//i.test(obj[f])) {
                                    found.push(obj[f]);
                                }
                                if (obj[f] && typeof obj[f] === 'object') {
                                    found.push(...extractUrls(obj[f], depth + 1));
                                }
                            }
                            Object.values(obj).forEach(v => { found.push(...extractUrls(v, depth + 1)); });
                            return found;
                        }
                        return found;
                    };

                    let urls = Array.from(new Set(extractUrls(j))).filter(Boolean);
                   //console.log('[selectionHelper] proxy single - extracted urls count=', urls.length, 'sample=', urls.slice(0, Math.min(5, urls.length)));

                    const need = count - (results ? results.length : 0);
                    if (need > 0 && urls.length > 0) {
                        const limited = urls.slice(0, need);
                        const converted = await loadUrlsToBase64(limited, (i, total) => { if (progressCb) progressCb((results ? results.length : 0) + i, total + (results ? results.length : 0)); });
                        results = (results || []).concat(converted || []);
                    }
                }
            } catch (e) {
                console.warn('[selectionHelper] proxy single-search failed', e);
            }
        }

        // Merge with cache, keep unique and limit to count
        const merged = Array.from(new Set([...(cached || []), ...(results || [])])).slice(0, count);
        this._imageCache[qk] = merged;
       //console.log('[selectionHelper] searchImages finished - final base64 count=', merged.length, 'for query=', qk);
        return merged;
    }

    getCachedImages(query) {
        this._imageCache = this._imageCache || {};
        if (!query) return [];
        return this._imageCache[query.trim()] || [];
    }

    // Public getter to allow external modules to safely query current selection without reading internal fields
    getSelectedNodes() {
        return Array.isArray(this.selected) ? this.selected.slice() : [];
    }

    // Helper: read canonical identifier for a node. Prefer explicit pw_id (set by renderers),
    // fall back to legacy _pwId, Konva id attribute or direct .id property/method.
    _getNodeIdentifier(node) {
        try {
            if (!node) return null;
            // Preferred: Konva attributes via getAttr
            if (typeof node.getAttr === 'function') {
                const v = node.getAttr('pw_id') || node.getAttr('_pwId');
                if (v) return v;
            }
            // Finally, check plain properties that might have been attached (only our id fields)
            if (node.pw_id) return node.pw_id;
            if (node._pwId) return node._pwId;
        } catch (e) { /* ignore and return null */ }
        return null;
    }

    // Helper: compute fitted width/height for an image so it fits inside target box while
    // preserving aspect ratio. If both targetW and targetH are provided, the image will be
    // scaled to fit inside the box (no cropping). If only one is provided, scale to that
    // dimension. Returns an object { w, h }.
    _computeFittedSize(srcW, srcH, targetW, targetH) {
        try {
            srcW = Number(srcW) || 0;
            srcH = Number(srcH) || 0;
            const hasSrc = srcW > 0 && srcH > 0;
            const tw = (targetW !== null && targetW !== undefined) ? Number(targetW) : null;
            const th = (targetH !== null && targetH !== undefined) ? Number(targetH) : null;

            if (!hasSrc) {
                // no intrinsic size: fallback to targets or 0
                return { w: (tw || srcW || 0), h: (th || srcH || 0) };
            }

            if (tw && th) {
                const scale = Math.min(tw / srcW, th / srcH);
                const w = Math.max(1, Math.round(srcW * scale));
                const h = Math.max(1, Math.round(srcH * scale));
                return { w, h };
            }

            if (tw) {
                const scale = tw / srcW;
                const w = Math.max(1, Math.round(srcW * scale));
                const h = Math.max(1, Math.round(srcH * scale));
                return { w, h };
            }

            if (th) {
                const scale = th / srcH;
                const w = Math.max(1, Math.round(srcW * scale));
                const h = Math.max(1, Math.round(srcH * scale));
                return { w, h };
            }

            // No targets provided: return natural size
            return { w: srcW, h: srcH };
        } catch (e) {
            return { w: srcW || 0, h: srcH || 0 };
        }
    }

    // Create an offscreen canvas sized to targetW/targetH and draw the source image scaled
    // to fit inside while preserving aspect ratio and centered. Returns the canvas element.
    _makeContainedCanvas(img, targetW, targetH) {
        try {
            targetW = Number(targetW) || 0;
            targetH = Number(targetH) || 0;
            if (!targetW || !targetH) return null;
            const srcW = (typeof img.naturalWidth === 'number' && img.naturalWidth > 0) ? img.naturalWidth : img.width || 0;
            const srcH = (typeof img.naturalHeight === 'number' && img.naturalHeight > 0) ? img.naturalHeight : img.height || 0;
            const fitted = this._computeFittedSize(srcW, srcH, targetW, targetH);
            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext && canvas.getContext('2d');
            if (!ctx) return null;
            // clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // optional: fill transparent background
            // draw image centered
            const dx = Math.round((targetW - fitted.w) / 2);
            const dy = Math.round((targetH - fitted.h) / 2);
            try { ctx.drawImage(img, 0, 0, srcW, srcH, dx, dy, fitted.w, fitted.h); } catch (e) { try { ctx.drawImage(img, dx, dy, fitted.w, fitted.h); } catch (e2) { /* ignore */ } }
            return canvas;
        } catch (e) { return null; }
    }

    // Ensure the node has recorded original display size attributes (_pwOrigW/_pwOrigH).
    // This writes the original size only if missing so it persists across replacements.
    _ensureOriginalSizeRecorded(node) {
        try {
            if (!node) return;
            let origW = null, origH = null;
            try { origW = (typeof node.getAttr === 'function') ? node.getAttr('_pwOrigW') : node._pwOrigW; } catch (e) { origW = null; }
            try { origH = (typeof node.getAttr === 'function') ? node.getAttr('_pwOrigH') : node._pwOrigH; } catch (e) { origH = null; }
            if ((origW === null || origW === undefined) || (origH === null || origH === undefined)) {
                let curW = null, curH = null;
                try { curW = (typeof node.width === 'function') ? node.width() : (node.getAttr && node.getAttr('width')); } catch (e) { curW = null; }
                try { curH = (typeof node.height === 'function') ? node.height() : (node.getAttr && node.getAttr('height')); } catch (e) { curH = null; }
                try {
                    // log that we're recording the original size (only once)
                    let nid = null; try { nid = (typeof this._getNodeIdentifier === 'function') ? this._getNodeIdentifier(node) : null; } catch(e) { nid = null; }
                    //console.debug('[selectionHelper] recording _pwOrig size', { id: nid, curW, curH });
                    if (typeof node.setAttr === 'function') {
                        if (curW !== null && curW !== undefined) node.setAttr('_pwOrigW', curW);
                        if (curH !== null && curH !== undefined) node.setAttr('_pwOrigH', curH);
                    } else {
                        if (curW !== null && curW !== undefined) node._pwOrigW = curW;
                        if (curH !== null && curH !== undefined) node._pwOrigH = curH;
                    }
                } catch (e) { /* ignore */ }
            } else {
                try { let nid = null; try { nid = (typeof this._getNodeIdentifier === 'function') ? this._getNodeIdentifier(node) : null; } catch(e){}; 
                //console.debug('[selectionHelper] original size already present', { id: nid, origW, origH }); 
                } catch (e) { }
            }
        } catch (e) { /* ignore */ }
    }

    // Replace image(s) on currently selected Konva.Image nodes with a base64 data URI.
    replaceSelectedImage(base64, opts = { preserveSize: true }) {
        try {
           //console.log('[selectionHelper] replaceSelectedImage called, selectedCount=', Array.isArray(this.selected) ? this.selected.length : 0, 'preserveSize=', opts && opts.preserveSize);
            if (!base64 || typeof base64 !== 'string') return false;
            let sel = Array.isArray(this.selected) ? this.selected : [];
            // allow forcing a target node via opts.forceTargetNode
            if (opts && opts.forceTargetNode) sel = Array.isArray(opts.forceTargetNode) ? opts.forceTargetNode : [opts.forceTargetNode];
            if (!sel.length) return false;

            const img = new window.Image();
            img.src = base64;
            img.onload = () => {
        sel.forEach((n, idx) => {
                    try {
            try { this._ensureOriginalSizeRecorded(n); } catch (e) {}
                        const className = (n && n.getClassName && typeof n.getClassName === 'function') ? n.getClassName() : null;
                        const isImage = (className && className.toLowerCase() === 'image') || (n && typeof n.image === 'function');
                       //console.log('[selectionHelper] replaceSelectedImage - node', idx, 'className=', className, 'isImage=', !!isImage);
                        if (!isImage) return;

                        // preserve previous size unless opt says otherwise
                        let prevW = null, prevH = null;
                        try { prevW = (typeof n.width === 'function') ? n.width() : (n.getAttr && n.getAttr('width')); } catch (e) { }
                        try { prevH = (typeof n.height === 'function') ? n.height() : (n.getAttr && n.getAttr('height')); } catch (e) { }

                        // natural image size (prefer naturalWidth/naturalHeight)
            const srcW = (typeof img.naturalWidth === 'number' && img.naturalWidth > 0) ? img.naturalWidth : img.width || 0;
            const srcH = (typeof img.naturalHeight === 'number' && img.naturalHeight > 0) ? img.naturalHeight : img.height || 0;

                        // sizing/application:
                        try {
                            // read recorded original display size (when selection captured it)
                            let origW = null, origH = null;
                            try { origW = (typeof n.getAttr === 'function') ? n.getAttr('_pwOrigW') : n._pwOrigW; } catch (e) { origW = null; }
                            try { origH = (typeof n.getAttr === 'function') ? n.getAttr('_pwOrigH') : n._pwOrigH; } catch (e) { origH = null; }

                            // If preserveSize is requested and we have a target box, keep node size and draw
                            // the incoming image into an offscreen canvas of that box so aspect ratio is preserved
                            // without changing the node's width/height (prevents cumulative shrinking).
                            if (opts.preserveSize) {
                                let targetW = (origW !== null && origW !== undefined) ? origW : null;
                                let targetH = (origH !== null && origH !== undefined) ? origH : null;
                                if (!targetW || !targetH) {
                                    try { if (typeof n.width === 'function') targetW = targetW || n.width(); else targetW = targetW || (n.getAttr && n.getAttr('width')); } catch (e) {}
                                    try { if (typeof n.height === 'function') targetH = targetH || n.height(); else targetH = targetH || (n.getAttr && n.getAttr('height')); } catch (e) {}
                                }

                                if (targetW && targetH) {
                                    const canvas = this._makeContainedCanvas(img, targetW, targetH);
                                    if (canvas) {
                                        // set the canvas as the image on the Konva node; keep node width/height unchanged
                                        try { if (typeof n.image === 'function') n.image(canvas); else n.setAttr && n.setAttr('image', canvas); } catch (e) { console.warn('[selectionHelper] replaceSelectedImage - set canvas image failed', e); }
                                    } else {
                                        // fallback: set image and do not alter node size
                                        try { if (typeof n.image === 'function') n.image(img); else n.setAttr && n.setAttr('image', img); } catch (e) {}
                                    }
                                } else {
                                    // no target box: fallback to behaving like preserveSize=false
                                    const fitted = this._computeFittedSize(srcW, srcH, null, null);
                                    try { if (typeof n.image === 'function') n.image(img); else n.setAttr && n.setAttr('image', img); } catch (e) {}
                                    if (typeof n.width === 'function' && typeof n.height === 'function') { n.width(fitted.w); n.height(fitted.h); } else { n.setAttr && n.setAttr('width', fitted.w); n.setAttr && n.setAttr('height', fitted.h); }
                                }
                            } else {
                                // not preserving size: set node image and resize to image's natural size
                                const fitted = this._computeFittedSize(srcW, srcH, null, null);
                                try { if (typeof n.image === 'function') n.image(img); else n.setAttr && n.setAttr('image', img); } catch (e) {}
                                if (typeof n.width === 'function' && typeof n.height === 'function') { n.width(fitted.w); n.height(fitted.h); } else { n.setAttr && n.setAttr('width', fitted.w); n.setAttr && n.setAttr('height', fitted.h); }
                            }
                        } catch (e) { /* ignore sizing errors */ }

                        const layer = n.getLayer && n.getLayer(); if (layer && typeof layer.batchDraw === 'function') layer.batchDraw();
                       //console.log('[selectionHelper] replaceSelectedImage - replaced node', idx);
                        // Persist replacement into parsedSlides/slideImagesResult if preview API is available
                        try {
                            const pwId = this._getNodeIdentifier(n);
                            if (pwId && typeof window.presentationPreview !== 'undefined' && window.presentationPreview && typeof window.presentationPreview.updateParsedSlideImage === 'function') {
                                try {
                                    window.presentationPreview.updateParsedSlideImage(pwId, base64);
                                    console.info('[selectionHelper] persisted image replacement to parsedSlides pwId=', pwId);
                                } catch (err) {
                                    console.warn('[selectionHelper] updateParsedSlideImage failed', err);
                                }
                            }
                        } catch (e) { /* non-fatal */ }
                    } catch (e) {
                        console.warn('[selectionHelper] replaceSelectedImage - per-node error', e);
                    }
                });
                try { if (this.stage && typeof this.stage.draw === 'function') this.stage.draw(); } catch (e) { }
            };
            img.onerror = (err) => { console.warn('[selectionHelper] replaceSelectedImage - failed to load base64 image', err); };
            return true;
        } catch (e) {
            console.warn('[selectionHelper] replaceSelectedImage error', e);
            return false;
        }
    
    }

    // Helper: read a File or Blob and return a data URL (base64)
    readFileToDataURL(file) {
        return new Promise((resolve, reject) => {
            try {
                if (!file) return reject(new Error('no file'));
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = (e) => reject(e);
                reader.readAsDataURL(file);
            } catch (e) { reject(e); }
        });
    }

    // Import a File/Blob (e.g., from an <input type=file>) and replace currently selected image nodes with it.
    async importAndReplace(fileOrBlob, opts = { preserveSize: true }) {
        try {
           //console.log('[selectionHelper] importAndReplace called, selectedCount=', Array.isArray(this.selected) ? this.selected.length : 0);
            if (!fileOrBlob) return false;
            const sel = Array.isArray(this.selected) ? this.selected : [];
            if (!sel.length) return false;

            // if provided a FileList, pick first
            if (fileOrBlob instanceof FileList) fileOrBlob = fileOrBlob[0];

            // if it's a URL string, fetch it
            if (typeof fileOrBlob === 'string' && /^https?:\/\//i.test(fileOrBlob)) {
                try {
                    const resp = await fetch(fileOrBlob);
                    if (!resp.ok) return false;
                    const blob = await resp.blob();
                    fileOrBlob = blob;
                } catch (e) { console.warn('[selectionHelper] importAndReplace fetch failed', e); return false; }
            }

            // If it's a File/Blob: convert to data URL
            let dataUrl = null;
            if (fileOrBlob instanceof Blob || (typeof fileOrBlob === 'object' && fileOrBlob.constructor && (fileOrBlob.constructor.name === 'File' || fileOrBlob.constructor.name === 'Blob'))) {
                dataUrl = await this.readFileToDataURL(fileOrBlob);
            } else if (typeof fileOrBlob === 'string' && fileOrBlob.startsWith('data:')) {
                dataUrl = fileOrBlob;
            } else {
                console.warn('[selectionHelper] importAndReplace - unsupported file type');
                return false;
            }

            if (!dataUrl) return false;

            // Load image and apply replacement with aspect-ratio preserving sizing similar to thumbnail flow
            const img = new window.Image();
            img.src = dataUrl;
            img.onload = () => {
                let selNodes = Array.isArray(this.selected) ? this.selected : [];
                if (opts && opts.forceTargetNode) selNodes = Array.isArray(opts.forceTargetNode) ? opts.forceTargetNode : [opts.forceTargetNode];
        selNodes.forEach((n, idx) => {
                    try {
            try { this._ensureOriginalSizeRecorded(n); } catch (e) {}
                        const className = (n && n.getClassName && typeof n.getClassName === 'function') ? n.getClassName() : null;
                        const isImage = (className && className.toLowerCase() === 'image') || (n && typeof n.image === 'function');
                        if (!isImage) return;

                        // previous node size - prefer original markers to avoid cumulative shrink
                        let prevW = null, prevH = null;
                        try { prevW = (typeof n.getAttr === 'function') ? (n.getAttr('_pwOrigW') || n.getAttr('width')) : (n._pwOrigW || (n.getAttr && n.getAttr('width'))); } catch (e) { prevW = null; }
                        try { prevH = (typeof n.getAttr === 'function') ? (n.getAttr('_pwOrigH') || n.getAttr('height')) : (n._pwOrigH || (n.getAttr && n.getAttr('height'))); } catch (e) { prevH = null; }

                        // natural image size
                        const srcW = (typeof img.naturalWidth === 'number' && img.naturalWidth > 0) ? img.naturalWidth : img.width || 0;
                        const srcH = (typeof img.naturalHeight === 'number' && img.naturalHeight > 0) ? img.naturalHeight : img.height || 0;

                        // sizing/application: prefer keeping node size by drawing the incoming image into
                        // an offscreen canvas sized to the node's original box when preserveSize=true.
                        try {
                            let origW = null, origH = null;
                            try { origW = (typeof n.getAttr === 'function') ? n.getAttr('_pwOrigW') : n._pwOrigW; } catch (e) { origW = null; }
                            try { origH = (typeof n.getAttr === 'function') ? n.getAttr('_pwOrigH') : n._pwOrigH; } catch (e) { origH = null; }

                            if (opts.preserveSize) {
                                let targetW = (origW !== null && origW !== undefined) ? origW : null;
                                let targetH = (origH !== null && origH !== undefined) ? origH : null;
                                if (!targetW || !targetH) {
                                    try { if (typeof n.width === 'function') targetW = targetW || n.width(); else targetW = targetW || (n.getAttr && n.getAttr('width')); } catch (e) {}
                                    try { if (typeof n.height === 'function') targetH = targetH || n.height(); else targetH = targetH || (n.getAttr && n.getAttr('height')); } catch (e) {}
                                }

                                if (targetW && targetH) {
                                    const canvas = this._makeContainedCanvas(img, targetW, targetH);
                                    if (canvas) {
                                        try { if (typeof n.image === 'function') n.image(canvas); else n.setAttr && n.setAttr('image', canvas); } catch (e) { console.warn('[selectionHelper] importAndReplace - set canvas image failed', e); }
                                    } else {
                                        try { if (typeof n.image === 'function') n.image(img); else n.setAttr && n.setAttr('image', img); } catch (e) {}
                                        const fitted = this._computeFittedSize(srcW, srcH, null, null);
                                        if (typeof n.width === 'function' && typeof n.height === 'function') { n.width(fitted.w); n.height(fitted.h); } else { n.setAttr && n.setAttr('width', fitted.w); n.setAttr && n.setAttr('height', fitted.h); }
                                    }
                                } else {
                                    // no target size available, fallback to resizing to natural size
                                    try { if (typeof n.image === 'function') n.image(img); else n.setAttr && n.setAttr('image', img); } catch (e) {}
                                    const fitted = this._computeFittedSize(srcW, srcH, null, null);
                                    if (typeof n.width === 'function' && typeof n.height === 'function') { n.width(fitted.w); n.height(fitted.h); } else { n.setAttr && n.setAttr('width', fitted.w); n.setAttr && n.setAttr('height', fitted.h); }
                                }
                            } else {
                                try { if (typeof n.image === 'function') n.image(img); else n.setAttr && n.setAttr('image', img); } catch (e) {}
                                const fitted = this._computeFittedSize(srcW, srcH, null, null);
                                if (typeof n.width === 'function' && typeof n.height === 'function') { n.width(fitted.w); n.height(fitted.h); } else { n.setAttr && n.setAttr('width', fitted.w); n.setAttr && n.setAttr('height', fitted.h); }
                            }
                        } catch (e) { /* ignore sizing errors */ }

                        try { const layer = n.getLayer && n.getLayer(); if (layer && typeof layer.batchDraw === 'function') layer.batchDraw(); } catch (e) { }
                        // Persist replacement into parsedSlides/slideImagesResult if preview API is available
                        try {
                            const pwId = this._getNodeIdentifier(n);
                            if (pwId && typeof window.presentationPreview !== 'undefined' && window.presentationPreview && typeof window.presentationPreview.updateParsedSlideImage === 'function') {
                                try {
                                    window.presentationPreview.updateParsedSlideImage(pwId, dataUrl);
                                    console.info('[selectionHelper] persisted imported image to parsedSlides pwId=', pwId);
                                } catch (err) {
                                    console.warn('[selectionHelper] updateParsedSlideImage failed', err);
                                }
                            }
                        } catch (e) { /* non-fatal */ }
                    } catch (e) {
                        console.warn('[selectionHelper] importAndReplace - per-node error', e);
                    }
                });

                try { if (this.stage && typeof this.stage.draw === 'function') this.stage.draw(); } catch (e) { }
            };
            img.onerror = (err) => { console.warn('[selectionHelper] importAndReplace - failed to load dataUrl image', err); };

            return true;
        } catch (e) {
            console.warn('[selectionHelper] importAndReplace error', e);
            return false;
        }
    }

    // New: modify selected Text node(s) using an AI API and replace their content with the cleaned reply
    async modifySelectedTextWithAI(userPrompt, opts = {}) {
        try {
            if (!userPrompt || typeof userPrompt !== 'string') {
                console.warn('[selectionHelper] modifySelectedTextWithAI - missing userPrompt');
                return false;
            }
            // Allow caller to pass explicit nodes to operate on via opts.selectedNodes
            const selected = Array.isArray(opts.selectedNodes) ? opts.selectedNodes.slice() : (Array.isArray(this.selected) ? this.selected.slice() : []);
            try { //console.log('[selectionHelper] modifySelectedTextWithAI invoked; selectedNodes length=', selected.length); 
            } catch (e) {}
            
            const textNodes = selected.filter(n => n && typeof n.getClassName === 'function' && n.getClassName() === 'Text');
            if (!textNodes.length) {
                console.warn('[selectionHelper] modifySelectedTextWithAI - no Text nodes selected');
                return false;
            }

            // System prompt: instruct the AI to act only as a text editor and to return only the modified text
            const systemPrompt = (
                "You are a text editor. You will modify the provided text according to the user's instructions. " +
                "When responding, RETURN ONLY THE MODIFIED TEXT and NOTHING ELSE — no explanations, no annotations, no markdown, no tags, no code fences, no JSON, no labels. " +
                "Preserve necessary line breaks and punctuation. If the instruction cannot be applied, return the original text unchanged. " +
                "Do not add commentary, step-by-step thoughts, or any metadata."
            );

            // Determine context size / model similar to Content.generateSlideForgeRawAIReply
            const contextSize = document.getElementById('context-selector')?.value || 8192;

            // ADD LANGUAGE ENFORCEMENT: detect user's language and add enforcement instruction
            let languageEnforcement = '';
            try {
                let userLanguage = 'English';
                if (window.Lang && typeof window.Lang.getCurrentLanguage === 'function') {
                    const langCode = window.Lang.getCurrentLanguage();
                    if (window.Content && typeof window.Content.getLanguageDisplayName === 'function') {
                        userLanguage = window.Content.getLanguageDisplayName(langCode);
                    } else {
                        userLanguage = (langCode || 'English').toString();
                    }
                } else {
                    const browserLang = navigator.language || navigator.userLanguage || 'en';
                    if (window.Content && typeof window.Content.getLanguageDisplayName === 'function') {
                        userLanguage = window.Content.getLanguageDisplayName(browserLang);
                    } else {
                        userLanguage = (browserLang || 'English').toString();
                    }
                }
                languageEnforcement = `Always respond in ${userLanguage}. Match the user's language and communication style. If the user writes in ${userLanguage}, respond in ${userLanguage}.\n`;
            } catch (err) { /* continue without language enforcement */ }

            // Create an abort controller so the operation can be cancelled (exposed like other flows)
            try {
                if (!window.SlideForgeAbortController) window.SlideForgeAbortController = new AbortController();
            } catch (e) { window.SlideForgeAbortController = new AbortController(); }
            const abortSignal = window.SlideForgeAbortController.signal;

            for (let node of textNodes) {
                try {
                    const original = (typeof node.text === 'function') ? (node.text() || '') : ((node.getAttr && node.getAttr('text')) || '');
                    const payloadPrompt = (userPrompt || '') + ': ' + original;

                    // Use the curated non-stream helper to avoid "thinking" streaming issues
                    let fullText = '';
                    try {
                        const modelSelectorEl = document.getElementById('model-selector');
                        const selectedModel = modelSelectorEl ? (modelSelectorEl.value || '') : '';
                        // Prepend language enforcement idempotently to the system prompt
                        let effectiveSystem = String(systemPrompt || '');
                        try {
                            if (languageEnforcement && String(languageEnforcement).trim()) {
                                const le = String(languageEnforcement).trim();
                                if (String(effectiveSystem).indexOf(le) === -1) effectiveSystem = le + ' ' + effectiveSystem;
                            }
                        } catch (e) { }
                        const resp = await StyleDIY.sendToOllama(payloadPrompt, effectiveSystem, selectedModel, abortSignal);
                        if (!resp) {
                            console.warn('[selectionHelper] modifySelectedTextWithAI - empty response from StyleDIY.sendToOllama');
                            continue;
                        }
                        if (typeof resp === 'string') fullText = resp;
                        else if (resp && typeof resp.response === 'string') fullText = resp.response;
                        else if (resp && typeof resp.text === 'string') fullText = resp.text;
                        else if (resp && typeof resp.toString === 'function') fullText = resp.toString();
                        else fullText = String(resp);
                    } catch (apiError) {
                        console.warn('[selectionHelper] modifySelectedTextWithAI - StyleDIY.sendToOllama call failed', apiError);
                        continue;
                    }

                    let reply = this._cleanAIReply(fullText);
                    if (!reply) reply = original;

                    try {
                        if (typeof node.text === 'function') node.text(reply);
                        else if (node.setAttr) node.setAttr('text', reply);
                        const layer = node.getLayer && node.getLayer(); if (layer && typeof layer.batchDraw === 'function') layer.batchDraw();
                        // Persist AI modification to parsedSlides if preview helper exists
                        try {
                            const pwId = this._getNodeIdentifier(node);
                            if (pwId && typeof window.presentationPreview !== 'undefined' && window.presentationPreview && typeof window.presentationPreview.updateParsedSlideText === 'function') {
                                try { window.presentationPreview.updateParsedSlideText(pwId, reply); 
                                   //console.log('[selectionHelper] persisted AI edit to parsedSlides pwId=', pwId); 
                                } catch (e) { }
                            }
                        } catch (e) { }
                    } catch (e) {
                        console.warn('[selectionHelper] modifySelectedTextWithAI - applying text failed', e);
                    }

                } catch (e) {
                    console.warn('[selectionHelper] modifySelectedTextWithAI - per-node error', e);
                }
            }

            try { if (this.stage && typeof this.stage.draw === 'function') this.stage.draw(); } catch (e) { }
            return true;
        } catch (e) {
            console.warn('[selectionHelper] modifySelectedTextWithAI error', e);
            return false;
        } finally {
            // Cleanup abort controller similar to Content
            window.SlideForgeAbortController = null;
        }
    }

    // Helper: clean AI reply from extraneous content so only the edited text remains
    _cleanAIReply(reply) {
        try {
            if (!reply || typeof reply !== 'string') return '';

            let s = reply.trim();

            // If the model returns a JSON wrapper, try to extract common fields
            try {
                const maybeJson = JSON.parse(s);
                if (maybeJson && typeof maybeJson === 'object') {
                    if (typeof maybeJson.text === 'string') return maybeJson.text.trim();
                    if (typeof maybeJson.result === 'string') return maybeJson.result.trim();
                    if (typeof maybeJson.output === 'string') return maybeJson.output.trim();
                }
            } catch (e) { /* not JSON, continue */ }

            // remove markdown code fences but preserve inner content (including any markup inside)
            s = s.replace(/```[a-zA-Z0-9-]*\n([\s\S]*?)\n```/g, (m, p1) => p1 || '');
            s = s.replace(/```/g, '');

            // NOTE: Do NOT strip HTML tags here. Preserve markup/formatting expectations so that
            // generated HTML or inline tags returned by the model remain intact.
            // s = s.replace(/<[^>]+>/g, '');

            // remove common assistant/thinking prefixes and labels
            s = s.replace(/^\s*(Assistant|AI|Model|Result|Answer|Modified text|Output)\s*[:\-]\s*/i, '');
            s = s.replace(/\b\(thinking\)|\bthinking\b\:*/ig, '');

            // remove extra lines that look like internal commentary (lines that begin with isolated brackets or dashes)
            const lines = s.split(/\r?\n/).filter(l => {
                const t = l.trim();
                if (!t) return true; // keep blank lines as they may be meaningful
                if (/^\[.*\]$/.test(t)) return false;
                if (/^\-\s+/.test(t)) return false;
                if (/^\.\.\.+/.test(t)) return false;
                return true;
            });
            s = lines.join('\n').trim();

            return s;
        } catch (e) {
            console.warn('[selectionHelper] _cleanAIReply error', e);
            return (typeof reply === 'string') ? reply.trim() : '';
        }
    }

    // Start an inline text editor (HTML textarea) positioned over the Konva Text node
    _startTextEdit(node) {
        try {
            // Cleanup any existing editor first
            try { this._destroyTextEditor(); } catch (e) { }

            if (!node || typeof node.getClassName !== 'function' || node.getClassName() !== 'Text') return;
            const stage = this.stage;
            if (!stage || typeof stage.container !== 'function') return;

            // Get node absolute position and stage container rect
            let absPos = { x: 0, y: 0 };
            try { absPos = node.getAbsolutePosition() || absPos; } catch (e) { }
            const container = stage.container();
            const box = container.getBoundingClientRect();

            // compute pixel position
            const left = box.left + absPos.x;
            const top = box.top + absPos.y;

            // create textarea
            const ta = document.createElement('textarea');
            ta.value = (typeof node.text === 'function') ? (node.text() || '') : ((node.getAttr && node.getAttr('text')) || '');
            ta.style.position = 'absolute';
            ta.style.left = `${left}px`;
            ta.style.top = `${top}px`;
            // size roughly to node size
            try {
                const w = (typeof node.width === 'function') ? node.width() : (node.getAttr && node.getAttr('width')) || 200;
                const h = (typeof node.height === 'function') ? node.height() : (node.getAttr && node.getAttr('height')) || 40;
                ta.style.width = `${Math.max(60, w)}px`;
                ta.style.height = `${Math.max(24, h)}px`;
            } catch (e) { }

            // copy some font styles if available
            try {
                const fontSize = (typeof node.fontSize === 'function') ? node.fontSize() : (node.getAttr && node.getAttr('fontSize')) || 14;
                const fontFamily = (typeof node.fontFamily === 'function') ? node.fontFamily() : (node.getAttr && node.getAttr('fontFamily')) || 'Arial';
                const color = (typeof node.fill === 'function') ? node.fill() : (node.getAttr && node.getAttr('fill')) || '#000';
                ta.style.fontSize = `${fontSize}px`;
                ta.style.fontFamily = fontFamily;
                ta.style.color = color;
            } catch (e) { }

            ta.style.zIndex = 100000;
            ta.style.padding = '4px';
            ta.style.margin = '0';
            ta.style.outline = 'none';
            ta.style.resize = 'both';

            // Choose light/dark styling: prefer explicit 'darkmode' class on body or html, fall back to prefers-color-scheme
            let isDark = false;
            try {
                if (document && document.body && typeof document.body.classList === 'object' && document.body.classList.contains('darkmode')) isDark = true;
            } catch (e) { }
            try {
                if (!isDark && document && document.documentElement && typeof document.documentElement.classList === 'object' && document.documentElement.classList.contains('darkmode')) isDark = true;
            } catch (e) { }
            try {
                if (!isDark && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) isDark = true;
            } catch (e) { }

            // Finalize colors: prefer Konva node fill for light mode; for dark mode use high-contrast light text
            try {
                const nodeFill = (typeof node.fill === 'function') ? node.fill() : (node.getAttr && node.getAttr('fill')) || null;

                // Helper: detect whether a CSS color string is visually light
                const isColorLight = (col) => {
                    if (!col || typeof col !== 'string') return false;
                    try {
                        col = col.trim().toLowerCase();
                        // hex formats
                        if (col[0] === '#') {
                            let hex = col.slice(1);
                            if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
                            if (hex.length !== 6) return false;
                            const r = parseInt(hex.substring(0, 2), 16);
                            const g = parseInt(hex.substring(2, 4), 16);
                            const b = parseInt(hex.substring(4, 6), 16);
                            const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
                            return lum > 0.75;
                        }
                        // rgb/rgba
                        const rgbMatch = col.match(/rgba?\(([^)]+)\)/);
                        if (rgbMatch) {
                            const parts = rgbMatch[1].split(',').map(p => parseFloat(p));
                            if (parts.length >= 3) {
                                const r = parts[0];
                                const g = parts[1];
                                const b = parts[2];
                                const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
                                return lum > 0.75;
                            }
                        }
                        return false;
                    } catch (e) { return false; }
                };

                if (isDark) {
                    ta.style.background = '#0b1220';
                    ta.style.border = '1px solid rgba(255,255,255,0.08)';
                    ta.style.color = '#e5e7eb';
                    ta.style.caretColor = '#e5e7eb';
                    ta.style.boxShadow = '0 6px 18px rgba(2,6,23,0.6)';
                } else {
                    // In light mode, ensure text is dark enough for white background even if node fill is light
                    ta.style.background = 'white';
                    ta.style.border = '1px solid rgba(0,0,0,0.12)';
                    let effectiveColor = nodeFill || '#111';
                    try {
                        if (isColorLight(effectiveColor)) {
                            effectiveColor = '#000';
                        }
                    } catch (e) { effectiveColor = effectiveColor || '#000'; }
                    ta.style.color = effectiveColor;
                    ta.style.caretColor = effectiveColor;
                    ta.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                }
            } catch (e) {
                // fallback
                ta.style.background = 'white';
                ta.style.border = '1px solid rgba(0,0,0,0.12)';
                ta.style.color = '#111';
                ta.style.caretColor = '#111';
            }

            // attach events: blur => commit, Esc => cancel, Cmd/Ctrl+Enter => commit
            const commit = () => {
                try {
                    const newText = ta.value;
                    if (typeof node.text === 'function') node.text(newText);
                    else if (node.setAttr) node.setAttr('text', newText);
                    const layer = node.getLayer && node.getLayer(); if (layer && typeof layer.batchDraw === 'function') layer.batchDraw();
                    // Persist edit back to parsedSlides if preview exposes helper
                    try {
                        const pwId = this._getNodeIdentifier(node);
                        if (pwId && typeof window.presentationPreview !== 'undefined' && window.presentationPreview && typeof window.presentationPreview.updateParsedSlideText === 'function') {
                            try { window.presentationPreview.updateParsedSlideText(pwId, newText); 
                               //console.log('[selectionHelper] persisted inline edit to parsedSlides pwId=', pwId); 
                                } catch (e) { }
                        }
                    } catch (e) { }
                } catch (e) { console.warn('[selectionHelper] _startTextEdit commit failed', e); }
                this._destroyTextEditor();
                try { if (this.stage && typeof this.stage.draw === 'function') this.stage.draw(); } catch (e) { }
            };

            const cancel = () => { this._destroyTextEditor(); };

            const onKey = (ev) => {
                if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
                    ev.preventDefault(); commit();
                } else if (ev.key === 'Escape') {
                    ev.preventDefault(); cancel();
                }
            };

            ta.addEventListener('blur', commit);
            ta.addEventListener('keydown', onKey);

            // store refs for cleanup
            this._textEditorEl = ta;
            this._textEditorListeners = { onKey };

            document.body.appendChild(ta);
            // focus and place cursor at end
            ta.focus();
            try { ta.selectionStart = ta.selectionEnd = ta.value.length; } catch (e) { }
        } catch (e) {
            console.warn('[selectionHelper] _startTextEdit error', e);
        }
    }

    // Destroy inline editor if present
    _destroyTextEditor() {
        try {
            if (this._textEditorEl) {
                try { this._textEditorEl.removeEventListener('keydown', this._textEditorListeners && this._textEditorListeners.onKey); } catch (e) { }
                try { this._textEditorEl.remove(); } catch (e) { try { document.body.removeChild(this._textEditorEl); } catch (e2) { } }
            }
        } catch (e) { console.warn('[selectionHelper] _destroyTextEditor error', e); }
        this._textEditorEl = null;
        this._textEditorListeners = null;
    }

    destroy() {
        try {
            if (this.stage && this._stageClickHandler && typeof this.stage.off === 'function') {
                this.stage.off('click', this._stageClickHandler);
            }
            if (this.stage && this._stageDblClickHandler && typeof this.stage.off === 'function') {
                try { this.stage.off('dblclick', this._stageDblClickHandler); } catch (e) { }
                try { this.stage.off('dbltap', this._stageDblClickHandler); } catch (e) { }
            }
            // ensure any inline editor is removed
            try { this._destroyTextEditor(); } catch (e) { }
            if (this._selectionRect) {
                try { if (this._selectionRect.getParent()) this._selectionRect.destroy(); } catch (e) { }
                this._selectionRect = null;
            }
            if (this.overlayLayer && this.stage) {
                try { if (this.overlayLayer.getParent()) this.overlayLayer.destroy(); } catch (e) { }
                this.overlayLayer = null;
            }
        } catch (e) {
            console.warn('[selectionHelper] destroy error', e);
        }
        this.events = {};
        this.selected = [];
        this.stage = null;
    }

    async processAllTextNodesWithAI(userPrompt, opts = {}) {
        // opts: { model, apiPath, perNodeDelayMs = 150, progressCb }
        const perNodeDelay = opts.perNodeDelayMs || 150;
        const progressCb = typeof opts.progressCb === 'function' ? opts.progressCb : null;

        // gather text nodes (prefer presentation nodeMap)
        const allNodes = (window.presentation && Object.values(window.presentation.nodeMap || {})) || [];
       //console.log('[selectionHelper] processAllTextNodesWithAI - nodeMap size =', allNodes.length);

        // Expand Groups into descendant Text nodes as well
        const textNodes = [];
        for (const n of allNodes) {
            try {
                if (!n) continue;
                const cls = (typeof n.getClassName === 'function') ? n.getClassName() : null;
                if (cls === 'Text') { textNodes.push(n); continue; }
                // If Group, find descendant Text nodes
                if (cls === 'Group' && typeof n.find === 'function') {
                    const found = n.find('Text') || [];
                    if (found && found.length) found.forEach(t => textNodes.push(t));
                }
            } catch (e) { /* ignore per-node */ }
        }

        // If nothing found in nodeMap, try fallback: scan all stages for Text nodes
        if (!textNodes.length) {
            try {
               //console.log('[selectionHelper] processAllTextNodesWithAI - no text nodes in nodeMap, scanning stages fallback');
                const stages = (window.presentation && window.presentation.stages) || [];
                for (const s of stages) {
                    try {
                        if (!s || typeof s.find !== 'function') continue;
                        const found = s.find('Text') || [];
                        if (found && found.length) {
                            found.forEach(t => textNodes.push(t));
                        }
                    } catch (e) { }
                }
               //console.log('[selectionHelper] processAllTextNodesWithAI - fallback scan found text nodes=', textNodes.length);
            } catch (e) { console.warn('[selectionHelper] processAllTextNodesWithAI - stage scan failed', e); }
        } else {
           //console.log('[selectionHelper] processAllTextNodesWithAI - textNodes found via nodeMap=', textNodes.length);
        }

        if (!textNodes || textNodes.length === 0) {
           //console.log('[selectionHelper] processAllTextNodesWithAI - no text nodes to process, exiting');
            return;
        }

        const total = textNodes.length;

        // shared abort controller visible to Sidebar Cancel
        try { if (window.SlideForgeAbortController) window.SlideForgeAbortController.abort(); } catch (e) { }
        try {
            if (!window.SlideForgeAbortController) window.SlideForgeAbortController = new AbortController();
        } catch (e) { window.SlideForgeAbortController = new AbortController(); }
        const signal = window.SlideForgeAbortController.signal;

        // Create a conservative system prompt if not provided
        let systemPrompt = opts.systemPrompt || (
            "You are a text editor. Modify the provided text according to the user's instructions. RETURN ONLY THE MODIFIED TEXT and NOTHING ELSE — no explanations, no annotations, no markdown fences, no labels. Preserve meaningful formatting, punctuation and inline markup (HTML) if present."
        );

        // ADD LANGUAGE ENFORCEMENT: detect user's language and add enforcement instruction
        try {
            let userLanguage = 'English';
            if (window.Lang && typeof window.Lang.getCurrentLanguage === 'function') {
                const langCode = window.Lang.getCurrentLanguage();
                if (window.Content && typeof window.Content.getLanguageDisplayName === 'function') {
                    userLanguage = window.Content.getLanguageDisplayName(langCode);
                } else {
                    userLanguage = (langCode || 'English').toString();
                }
            } else {
                const browserLang = navigator.language || navigator.userLanguage || 'en';
                if (window.Content && typeof window.Content.getLanguageDisplayName === 'function') {
                    userLanguage = window.Content.getLanguageDisplayName(browserLang);
                } else {
                    userLanguage = (browserLang || 'English').toString();
                }
            }
            const langInstr = `Always respond in ${userLanguage}. Match the user's language and communication style. If the user writes in ${userLanguage}, respond in ${userLanguage}.\n`;
            if (String(systemPrompt || '').indexOf(String(langInstr).trim()) === -1) {
                systemPrompt = String(langInstr).trim() + '\n\n' + systemPrompt;
            }
        } catch (err) { /* ignore language enforcement errors */ }

        // Determine context size similar to other flows
        const contextSize = opts.contextSize || document.getElementById('context-selector')?.value || 8192;

        for (let i = 0; i < textNodes.length; i++) {
            const node = textNodes[i];
            if (!node) continue;
            if (signal.aborted) {
               //console.log('[selectionHelper] processAllTextNodesWithAI - aborted before processing node', i);
                break;
            }

            // Try to bring the corresponding preview stage into view so the user sees changes live.
            try {
                // Determine stage index for this node. Prefer window.presentation.nodeMap mapping if available.
                let stageIndex = -1;
                try {
                    if (window.presentation && window.presentation.nodeMap) {
                        // node may have a pw_id attribute registered in nodeMap
                        const attrs = (typeof node.getAttr === 'function') ? node.getAttr('pw_id') || node.getAttr('_pwId') : (node.pw_id || node._pwId);
                        if (attrs) {
                            const nm = window.presentation.nodeMap || {};
                            const keys = Object.keys(nm || {});
                            for (let k of keys) {
                                try {
                                    const entry = nm[k];
                                    if (!entry) continue;
                                    // entry.node may be a node reference or an object with attrs including pw_id
                                    const entryNode = entry.node;
                                    const entryId = this._getNodeIdentifier(entryNode) || (entry && (entry.pw_id || entry._pwId));
                                    const nodeId = this._getNodeIdentifier(node);
                                    if (entryNode === node || (entryId && nodeId && entryId === nodeId)) {
                                        // find stage index in presentation.stages
                                        if (window.presentation && Array.isArray(window.presentation.stages)) {
                                            stageIndex = window.presentation.stages.indexOf(entry.stage);
                                            if (stageIndex >= 0) break;
                                        }
                                    }
                                } catch (e) { }
                            }
                        }
                    }
                } catch (e) { }

                // If stageIndex is still unknown, try node.getStage() and match against presentation.stages
                if (stageIndex === -1) {
                    try {
                        if (node && typeof node.getStage === 'function') {
                            const s = node.getStage();
                            if (s && window.presentation && Array.isArray(window.presentation.stages)) {
                                stageIndex = window.presentation.stages.indexOf(s);
                            }
                        }
                    } catch (e) { }
                }

                // Call PreviewWindow.focusStage if available, otherwise attempt DOM fallback
                try {
                    if (typeof window.presentationPreview !== 'undefined' && window.presentationPreview && typeof window.presentationPreview.focusStage === 'function' && stageIndex >= 0) {
                        try { window.presentationPreview.focusStage(stageIndex); } catch (e) { }
                    } else if (typeof window.PreviewWindow !== 'undefined' && window.presentation && Array.isArray(window.presentation.stages) && stageIndex >= 0) {
                        // Try to find the modal instance by scanning document for '.presentation-preview-window'
                        try {
                            const modal = document.querySelector('.presentation-preview-window');
                            if (modal) {
                                const items = modal.querySelectorAll('.konva-stage-container');
                                const el = (items && items[stageIndex]) ? items[stageIndex] : null;
                                if (el) { try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { el.scrollIntoView && el.scrollIntoView(); } }
                            }
                        } catch (e) { }
                    }
                } catch (e) { }

                // Also notify presentation selection plumbing so Sidebar and Preview can highlight the node
                try { if (window.presentation && typeof window.presentation.setSelection === 'function') window.presentation.setSelection([node]); } catch (e) { }
            } catch (e) { /* non-fatal */ }

            // build prompt: user instruction + current text
            const original = (typeof node.text === 'function') ? (node.text() || '') : ((node.getAttr && node.getAttr('text')) || '');
            const payloadPrompt = `${userPrompt}\n\n${original}`;

            try {
                const label = `ai_modify_node_${i}`;
               //console.log('[selectionHelper] processAllTextNodesWithAI - processing node', i + 1, 'of', total, 'label=', label);
                let fullReply = '';

                // Use the curated non-stream helper that disables "thinking" streaming mode.
                // StyleDIY.sendToOllama is the project's canonical non-stream wrapper and
                // returns a single response (string/object). Keep normalization simple.
                let resp = null;
                try {
                    // StyleDIY.sendToOllama expects the selected model name, not context size.
                    const modelSelectorEl = document.getElementById('model-selector');
                    const selectedModel = modelSelectorEl ? (modelSelectorEl.value || '') : '';
                    resp = await StyleDIY.sendToOllama(payloadPrompt, systemPrompt, selectedModel, signal);
                    // normalize common response shapes to a string
                    if (!resp) {
                        console.warn('[selectionHelper] processAllTextNodesWithAI - StyleDIY.sendToOllama returned empty for node', i);
                        if (progressCb) try { progressCb(i + 1, total); } catch (e) { }
                        await new Promise(res => setTimeout(res, perNodeDelay));
                        continue;
                    }
                    if (typeof resp === 'string') fullReply = resp;
                    else if (resp && typeof resp.response === 'string') fullReply = resp.response;
                    else if (resp && typeof resp.text === 'string') fullReply = resp.text;
                    else if (resp && typeof resp.toString === 'function') fullReply = resp.toString();
                    else fullReply = String(resp);
                } catch (apiErr) {
                    console.warn('[selectionHelper] processAllTextNodesWithAI - StyleDIY.sendToOllama call failed for node', i, apiErr);
                    if (progressCb) try { progressCb(i + 1, total); } catch (e) { }
                    await new Promise(res => setTimeout(res, perNodeDelay));
                    continue;
                }

               //console.log('[selectionHelper] processAllTextNodesWithAI - raw reply length for node', i + 1, '=', fullReply ? fullReply.length : 0);

                const cleaned = (typeof this._cleanAIReply === 'function') ? this._cleanAIReply(fullReply) : fullReply;
                const finalText = cleaned || original;

                try {
                    if (typeof node.text === 'function') node.text(finalText);
                    else if (node.setAttr) node.setAttr('text', finalText);
                    const layer = node.getLayer && node.getLayer(); if (layer && typeof layer.batchDraw === 'function') layer.batchDraw();
                   //console.log('[selectionHelper] processAllTextNodesWithAI - applied text to node', i + 1);
                    // Persist AI batch modification to parsedSlides if preview helper exists
                    try {
                        const pwId = this._getNodeIdentifier(node);
                        if (pwId && typeof window.presentationPreview !== 'undefined' && window.presentationPreview && typeof window.presentationPreview.updateParsedSlideText === 'function') {
                            try { window.presentationPreview.updateParsedSlideText(pwId, finalText); 
                               //console.log('[selectionHelper] persisted AI batch edit to parsedSlides pwId=', pwId); 
                                } catch (e) { }
                        }
                    } catch (e) { }
                } catch (e) { console.warn('[AI] failed to set node text', e); }

                // progress callback after successful application
                try { if (progressCb) progressCb(i + 1, total); } catch (e) { }

                // small delay between nodes
                await new Promise(res => setTimeout(res, perNodeDelay));

            } catch (e) {
                if (e && (e.name === 'AbortError' || (e.message && e.message.toLowerCase().includes('abort')))) {
                   //console.log('[AI] processing aborted by user');
                    break;
                } else {
                    console.warn('[AI] error processing node', e);
                    // continue to next node
                }
            }
        }

        // cleanup
        try { window.SlideForgeAbortController = null; } catch (e) { }
    }
}
// Expose helper to global namespace
window.selectionHelper = selectionHelper;