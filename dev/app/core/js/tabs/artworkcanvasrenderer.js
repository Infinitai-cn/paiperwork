/**
 * ArtworkCanvasRenderer - Renders text overlays on a canvas for perfect WYSIWYG export
 * This class handles all canvas rendering, text block management, and export functionality
 */
class ArtworkCanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.bgImage = null;           // Image element for background
        this.textBlocks = [];          // Array of text block objects
        this.selectedBlockIndex = -1;
        this.scale = 1;
        this.onChange = null;          // Callback when canvas state changes
        this._renderCycle = 0;
        this._renderLoggedBlockIds = new Set();
        this._loadedWebFontKeys = new Set();
        this._loadedStylesheetHrefs = new Set();
        this._fontLoadGeneration = 0;
    }

    /**
     * Load background image into the canvas
     * @param {string} imageSrc - Base64 or URL of the background image
     * @returns {Promise<void>}
     */
    async loadBackground(imageSrc) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.bgImage = img;
                this.canvas.width = img.naturalWidth;
                this.canvas.height = img.naturalHeight;
                this.render();
                resolve();
            };
            img.onerror = (error) => {
                console.error('ArtworkCanvasRenderer: Failed to load background image', error);
                reject(error);
            };
            img.src = imageSrc;
        });
    }

    
    /**
     * Render everything to canvas
     */
    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        this._renderCycle += 1;
        this._renderLoggedBlockIds.clear();

        // Clear canvas
        ctx.clearRect(0, 0, w, h);

         // Draw background image at original size (centered, preserving aspect ratio)
        if (this.bgImage) {
            const imgW = this.bgImage.width;
            const imgH = this.bgImage.height;
            // Draw the background at its natural/original dimensions
            ctx.drawImage(this.bgImage, 0, 0, imgW, imgH);
          }

                // Draw decorations (lines, shapes, ornaments) behind text.
                // Overlay JSON can include large panels that should not hide text.
                this.renderDecorations(ctx);

                    // Draw all text blocks
                this.textBlocks.forEach((block, index) => {
                        this.drawTextBlock(ctx, block, index === this.selectedBlockIndex);
                    });
        }

      /**
       * Draw a single text block with all styling
       * @param {CanvasRenderingContext2D} ctx - Canvas context
       * @param {Object} block - Text block configuration
       * @param {boolean} isSelected - Whether this block is selected
       */
    drawTextBlock(ctx, block, isSelected) {
        ctx.save();

        const layout = this.getTextBlockLayout(block);

        // Determine if this block came from JSON overlay data (center-based positioning)
        const isOverlayBlock = block.overlaySource === true;

        const drawX = layout.anchorX;
        const drawY = layout.anchorY;
        const drawCx = drawX;
        const drawCy = drawY;

        // Apply transform (position, rotation, scale)
        ctx.translate(drawCx, drawCy);
        ctx.rotate((block.rotation || 0) * Math.PI / 180);
        ctx.translate(-drawCx, -drawCy);

        // Text styling
        ctx.font = `${block.fontStyle || 'normal'} ${block.fontWeight || 'normal'} ${block.fontSize}px "${block.fontFamily}"`;
        ctx.textAlign = block.textAlign || 'left';
        ctx.textBaseline = 'top';

        // Shadow - handle both JSON overlay object format and legacy boolean format
        if (block.shadow) {
            if (typeof block.shadow === 'object' && block.shadow.enabled) {
                ctx.shadowColor = block.shadow.color || 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = block.shadow.blur || 4;
                ctx.shadowOffsetX = block.shadow.offsetX || 2;
                ctx.shadowOffsetY = block.shadow.offsetY || 2;
            } else if (block.shadow === true || block.shadow === 1) {
                // Legacy boolean format
                ctx.shadowColor = block.shadowColor || 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = block.shadowBlur || 4;
                ctx.shadowOffsetX = block.shadowOffsetX || 2;
                ctx.shadowOffsetY = block.shadowOffsetY || 2;
            }
        }

        // Apply opacity (for overlay blocks)
        if (block.opacity !== undefined && block.opacity !== 1) {
            ctx.globalAlpha = this.normalizeOpacity(block.opacity, 1);
        }

        const textLines = layout.lines;
        const lineHeight = layout.lineHeight;
        let currentY = layout.textTop;

        const blockLogId = block.id || `${drawX},${drawY}:${block.text?.slice(0, 32) || ''}`;
        if (!this._renderLoggedBlockIds.has(blockLogId)) {
            this._renderLoggedBlockIds.add(blockLogId);
        }

        // Draw backgroundColor panel behind text (for readability and workaround effects)
        if (block.backgroundColor) {
            ctx.save();
            const panelX = layout.outerLeft;
            const panelY = layout.outerTop;
            const panelWidth = layout.outerWidth;
            const panelHeight = layout.outerHeight;
            const bgColor = block.backgroundColor;
            ctx.fillStyle = bgColor;
            
            // Draw rounded rectangle background
            this.roundedRect(ctx, panelX, panelY, panelWidth, panelHeight, 6);
            ctx.fill();
            ctx.restore();
        }

        // Fill text
        if (block.fillStyle) {
            ctx.fillStyle = block.fillStyle;
            for (const line of textLines) {
                ctx.fillText(line, drawX, currentY);
                currentY += lineHeight;
            }
        }

        // Stroke text
        if (block.strokeStyle) {
            ctx.strokeStyle = block.strokeStyle;
            ctx.lineWidth = block.strokeWidth || 1;
            let strokeY = layout.textTop;
            for (const line of textLines) {
                ctx.strokeText(line, drawX, strokeY);
                strokeY += lineHeight;
            }
        }

        // Update block height based on wrapped text
        if (isOverlayBlock && textLines.length > 0) {
            block.width = layout.outerWidth;
            block.height = layout.outerHeight;
        }

        // Selection indicator
        if (isSelected) {
            ctx.strokeStyle = '#00aaff';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 3]);
            ctx.strokeRect(layout.outerLeft - 4, layout.outerTop - 4, layout.outerWidth + 8, layout.outerHeight + 8);
            this.drawResizeHandles(ctx, layout);
        }

        ctx.restore();
    }

    /**
     * Draw resize handles for selected text block
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} block - Text block configuration
     */
    drawResizeHandles(ctx, block) {
        const handles = this.getHandlePositions(block);
        handles.forEach(handle => {
            ctx.setLineDash([]);
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#00aaff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(handle.x, handle.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }

    /**
     * Get positions of resize handles for a text block
     * @param {Object} block - Text block configuration
     * @returns {Array} Array of handle positions
     */
    getHandlePositions(block) {
        return [];
    }

    /**
     * Hit testing - find which text block was clicked
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number} Index of selected block, or -1 if none
     */
    hitTest(x, y) {
        // Reverse order so topmost blocks are selected first
        for (let i = this.textBlocks.length - 1; i >= 0; i--) {
            const block = this.textBlocks[i];
            const bounds = this.getTextBlockLayout(block);
            if (x >= bounds.outerLeft && x <= bounds.outerLeft + bounds.outerWidth &&
                y >= bounds.outerTop && y <= bounds.outerTop + bounds.outerHeight) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Hit testing across text and decoration elements.
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} Hit target descriptor
     */
    hitTestAny(x, y) {
        const textIndex = this.hitTest(x, y);
        if (textIndex >= 0) {
            return { type: 'text', index: textIndex };
        }

        for (let i = (this.ornaments?.length || 0) - 1; i >= 0; i--) {
            if (this.hitTestOrnament(this.ornaments[i], x, y)) {
                return { type: 'ornament', index: i };
            }
        }

        for (let i = (this.shapes?.length || 0) - 1; i >= 0; i--) {
            if (this.hitTestShape(this.shapes[i], x, y)) {
                return { type: 'shape', index: i };
            }
        }

        for (let i = (this.lines?.length || 0) - 1; i >= 0; i--) {
            if (this.hitTestLineElement(this.lines[i], x, y)) {
                return { type: 'line', index: i };
            }
        }

        return null;
    }

    hitTestOrnament(ornament, x, y) {
        if (!ornament) return false;
        const ox = Number(ornament.x) || 0;
        const oy = Number(ornament.y) || 0;
        const size = Math.max(1, Number(ornament.size) || 20);
        return x >= ox && x <= ox + size && y >= oy && y <= oy + size;
    }

    hitTestShape(shape, x, y) {
        if (!shape) return false;
        const type = String(shape.type || '').toLowerCase();

        if (type === 'rect') {
            const sx = Number(shape.x) || 0;
            const sy = Number(shape.y) || 0;
            const sw = Math.max(1, Number(shape.width) || 0);
            const sh = Math.max(1, Number(shape.height) || 0);
            return x >= sx && x <= sx + sw && y >= sy && y <= sy + sh;
        }

        if (type === 'circle' || type === 'ellipse') {
            const cx = Number(shape.cx) || ((Number(shape.x) || 0) + (Number(shape.width) || 0) / 2);
            const cy = Number(shape.cy) || ((Number(shape.y) || 0) + (Number(shape.height) || 0) / 2);
            const rx = Math.max(1, Number(shape.rx) || ((Number(shape.width) || (type === 'circle' ? 50 : 100)) / 2));
            const ry = Math.max(1, Number(shape.ry) || ((Number(shape.height) || (type === 'circle' ? 50 : 100)) / 2));
            const nx = (x - cx) / rx;
            const ny = (y - cy) / ry;
            return (nx * nx + ny * ny) <= 1;
        }

        if (type === 'line') {
            const x1 = Number(shape.x) || 0;
            const y1 = Number(shape.y) || 0;
            const x2 = x1 + (Number(shape.width) || 100);
            const y2 = y1 + (Number(shape.height) || 0);
            const stroke = Math.max(2, Number(shape.strokeWidth) || 2);
            return this.isPointNearLineSegment(x, y, x1, y1, x2, y2, stroke + 6);
        }

        if (type === 'polygon' && typeof shape.points === 'string') {
            const points = shape.points
                .trim()
                .split(/\s+/)
                .map((pair) => pair.split(',').map((value) => Number(value)))
                .filter((pair) => pair.length === 2 && Number.isFinite(pair[0]) && Number.isFinite(pair[1]));
            if (!points.length) return false;
            const xs = points.map((pair) => pair[0]);
            const ys = points.map((pair) => pair[1]);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            return x >= minX && x <= maxX && y >= minY && y <= maxY;
        }

        const sx = Number(shape.x) || 0;
        const sy = Number(shape.y) || 0;
        const sw = Math.max(1, Number(shape.width) || 40);
        const sh = Math.max(1, Number(shape.height) || 40);
        return x >= sx && x <= sx + sw && y >= sy && y <= sy + sh;
    }

    hitTestLineElement(line, x, y) {
        if (!line) return false;
        const x1 = Number(line.x1) || 0;
        const y1 = Number(line.y1) || 0;
        const x2 = Number(line.x2) || 0;
        const y2 = Number(line.y2) || 0;
        const stroke = Math.max(2, Number(line.strokeWidth) || 2);
        return this.isPointNearLineSegment(x, y, x1, y1, x2, y2, stroke + 6);
    }

    isPointNearLineSegment(px, py, x1, y1, x2, y2, threshold = 8) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) {
            const dpx = px - x1;
            const dpy = py - y1;
            return Math.sqrt(dpx * dpx + dpy * dpy) <= threshold;
        }

        let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        const ddx = px - projX;
        const ddy = py - projY;
        return Math.sqrt(ddx * ddx + ddy * ddy) <= threshold;
    }

    /**
     * Hit test for resize handles
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} Handle object or null
     */
    hitTestHandle(x, y) {
        if (this.selectedBlockIndex < 0) return null;
        const block = this.textBlocks[this.selectedBlockIndex];
        const handles = this.getHandlePositions(block);
        const threshold = 10; // pixel radius

        for (const handle of handles) {
            const dx = x - handle.x;
            const dy = y - handle.y;
            if (Math.sqrt(dx * dx + dy * dy) < threshold) {
                return handle;
            }
        }
        return null;
    }

    /**
     * Export canvas to PNG data URL
     * @param {number} scale - Export scale (1 = original, 2 = 2x, etc.)
     * @returns {string} Data URL of the exported image
     */
    exportPNG(scale = 1) {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = this.canvas.width * scale;
        exportCanvas.height = this.canvas.height * scale;
        const exportCtx = exportCanvas.getContext('2d');
        exportCtx.scale(scale, scale);

        // Render without selection indicators
        const selected = this.selectedBlockIndex;
        this.selectedBlockIndex = -1;
        this.render();
        exportCtx.drawImage(this.canvas, 0, 0);

        // Restore editor view
        this.selectedBlockIndex = selected;
        this.render();

        return exportCanvas.toDataURL('image/png');
    }

    /**
     * Wrap text lines to fit within maxWidth
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array} lines - Array of text lines
     * @param {number} maxWidth - Maximum width in pixels
     * @returns {Array} Wrapped text lines
     */
    wrapTextToMaxWidth(ctx, lines, maxWidth) {
        const wrappedLines = [];
        
        for (const line of lines) {
            // If line is empty, add it as is
            if (!line.trim()) {
                wrappedLines.push('');
                continue;
            }
            
            // If line fits within maxWidth, add it as is
            if (ctx.measureText(line).width <= maxWidth) {
                wrappedLines.push(line);
                continue;
            }
            
            // Word wrap the line
            const words = line.split(' ');
            let currentLine = '';
            
            for (const word of words) {
                const testLine = currentLine ? currentLine + ' ' + word : word;
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width <= maxWidth) {
                    currentLine = testLine;
                } else {
                    if (currentLine) {
                        wrappedLines.push(currentLine);
                    }
                    // If single word is wider than maxWidth, split it
                    if (ctx.measureText(word).width > maxWidth) {
                        let charCount = 0;
                        let tempLine = '';
                        for (const char of word) {
                            tempLine += char;
                            charCount++;
                            if (ctx.measureText(tempLine).width > maxWidth) {
                                wrappedLines.push(tempLine);
                                tempLine = '';
                            }
                        }
                        if (tempLine) {
                            currentLine = tempLine;
                        } else {
                            currentLine = '';
                        }
                    } else {
                        currentLine = word;
                    }
                }
            }
            
            if (currentLine) {
                wrappedLines.push(currentLine);
            }
        }
        
        return wrappedLines;
    }

    /**
     * Get text block dimensions by measuring text
     * @param {Object} block - Text block configuration
     * @returns {Object} Dimensions {width, height}
     */
    measureTextBlock(block) {
        const layout = this.getTextBlockLayout(block);
        return {
            width: layout.outerWidth,
            height: layout.outerHeight
        };
    }

    /**
     * Add a new text block
     * @param {Object} block - Text block configuration
     * @returns {number} Index of the new block
     */
    addTextBlock(block) {
        const dimensions = this.measureTextBlock(block);
        block.width = dimensions.width;
        block.height = dimensions.height;
        this.textBlocks.push(block);
        this.selectedBlockIndex = this.textBlocks.length - 1;
        this.render();
        if (this.onChange) this.onChange();
        return this.textBlocks.length - 1;
    }

    /**
     * Update an existing text block
     * @param {number} index - Block index
     * @param {Object} updates - Properties to update
     */
    updateTextBlock(index, updates) {
        if (index < 0 || index >= this.textBlocks.length) return;
        const block = this.textBlocks[index];
        Object.assign(block, updates);

        // Re-measure if font-related properties changed
        if (['fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'text'].includes(Object.keys(updates)[0])) {
            const dimensions = this.measureTextBlock(block);
            block.width = dimensions.width;
            block.height = dimensions.height;
        }

        this.render();
        if (this.onChange) this.onChange();
    }

    /**
     * Delete a text block
     * @param {number} index - Block index
     */
    deleteTextBlock(index) {
        if (index < 0 || index >= this.textBlocks.length) return;
        this.textBlocks.splice(index, 1);
        if (this.selectedBlockIndex === index) {
            this.selectedBlockIndex = -1;
        } else if (this.selectedBlockIndex > index) {
            this.selectedBlockIndex--;
        }
        this.render();
        if (this.onChange) this.onChange();
    }

    /**
     * Clear all text blocks
     */
    clearTextBlocks(options = {}) {
        const shouldRender = options.render !== false;
        const shouldNotify = options.notify !== false;
        this.textBlocks = [];
        this.selectedBlockIndex = -1;
        if (shouldRender) {
            this.render();
        }
        if (shouldNotify && this.onChange) {
            this.onChange();
        }
    }

    /**
     * Set the change callback
     * @param {Function} callback - Function to call on state change
     */
    setOnChange(callback) {
        this.onChange = callback;
    }

    /**
     * Get the current canvas state
     * @returns {Object} Canvas state
     */
    getState() {
        return {
            bgImage: this.bgImage ? this.bgImage.src : null,
            textBlocks: this.textBlocks,
            selectedBlockIndex: this.selectedBlockIndex
        };
    }

    /**
     * Get canvas data as HTML string for code editor display
     * @returns {string} HTML string representation of canvas content
     */
    getCanvasData() {
        let html = '<!DOCTYPE html>\n<html>\n<head>\n';
        html += '<meta charset="UTF-8">\n';
        html += '<style>\n';
        html += 'body { margin: 0; padding: 0; }\n';
        html += '</style>\n';
        html += '</head>\n<body>\n';

        // Add background image if available
        if (this.bgImage) {
            html += `<img src="${this.bgImage.src}" style="width: 100%; height: auto;">\n`;
        }

        // Add text blocks
        this.textBlocks.forEach(block => {
            html += `<div style="position: absolute; left: ${block.x}px; top: ${block.y}px; `;
            html += `font-family: '${block.fontFamily}'; `;
            html += `font-size: ${block.fontSize}px; `;
            html += `font-weight: ${block.fontWeight}; `;
            html += `font-style: ${block.fontStyle}; `;
            html += `text-align: ${block.textAlign}; `;
            html += `color: ${block.fillStyle}; `;
            html += `transform: rotate(${block.rotation || 0}deg); `;
            html += `">${block.text}</div>\n`;
        });

        html += '</body>\n</html>';
        return html;
    }

    /**
     * Compute shared layout for a text block.
     * @param {Object} block - Text block configuration
     * @returns {Object} Layout metrics and bounds
     */
    getTextBlockLayout(block) {
        const ctx = this.ctx;
        const fontSize = Number(block?.fontSize) || 16;
        const fontWeight = block?.fontWeight || 'normal';
        const fontStyle = block?.fontStyle || 'normal';
        const textAlign = block?.textAlign || 'left';
        const anchorX = Number(block?.x) || 0;
        const anchorY = Number(block?.y) || 0;

        ctx.save();
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${block?.fontFamily || 'Arial'}"`;
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'top';

        const rawLines = String(block?.text || '').split('\n');
        const maxWidth = Number(block?.maxWidth) || 0;
        const lines = maxWidth > 0 ? this.wrapTextToMaxWidth(ctx, rawLines, maxWidth) : rawLines;
        const lineHeight = (Number(block?.lineHeight) || 1.3) * fontSize;
        const lineWidths = lines.map((line) => ctx.measureText(line).width);
        const textWidth = lineWidths.length ? Math.max(...lineWidths) : 0;
        const textHeight = lines.length * lineHeight;

        const hasBackground = !!block?.backgroundColor;
        const padding = hasBackground
            ? this.parsePadding(block?.backgroundPadding || '8px 12px')
            : { top: 0, right: 0, bottom: 0, left: 0 };

        const contentLeft = textAlign === 'center'
            ? anchorX - (textWidth / 2)
            : textAlign === 'right'
                ? anchorX - textWidth
                : anchorX;

        const outerLeft = hasBackground
            ? (textAlign === 'center'
                ? anchorX - ((textWidth + padding.left + padding.right) / 2)
                : textAlign === 'right'
                    ? anchorX - textWidth - padding.left - padding.right
                    : anchorX - padding.left)
            : contentLeft;
        const outerTop = hasBackground ? anchorY - padding.top : anchorY;
        const outerWidth = textWidth + padding.left + padding.right;
        const outerHeight = textHeight + padding.top + padding.bottom;

        ctx.restore();

        return {
            anchorX,
            anchorY,
            textAlign,
            fontSize,
            lineHeight,
            lines,
            lineWidths,
            textWidth,
            textHeight,
            contentLeft,
            textTop: anchorY,
            contentTop: anchorY,
            outerLeft,
            outerTop,
            outerWidth,
            outerHeight,
            hasBackground,
            padding,
        };
    }

    /**
     * Set canvas state from object
     * @param {Object} state - Canvas state
     */
    setState(state) {
        if (state.bgImage) {
            this.loadBackground(state.bgImage);
        }
        this.textBlocks = state.textBlocks || [];
        this.selectedBlockIndex = state.selectedBlockIndex || -1;
        this.render();
        if (this.onChange) this.onChange();
    }

    /**
     * Load HTML content into the canvas renderer
     * Parses HTML elements and creates text blocks from them
     * @param {string} html - HTML content to load
     */
    loadHtml(html) {
        // Clear existing text blocks
        this.clearTextBlocks({ render: false, notify: false });
        
        // Parse the HTML to extract text elements with their styles
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Build a temporary offscreen container to compute real styles & positions
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.visibility = 'hidden';
        tempContainer.style.overflow = 'hidden';
        tempContainer.style.left = '0';
        tempContainer.style.top = '0';
        document.body.appendChild(tempContainer);
        
        // Clone the parsed document body into the temp container to get real computed styles
        const cloneBody = doc.body ? doc.body.cloneNode(true) : null;
        if (cloneBody) {
            tempContainer.appendChild(cloneBody);
        }
        
        // Wait a frame for styles to be computed by the browser
        requestAnimationFrame(() => {
            // Collect all text-containing elements from the cloned DOM
            const allElements = tempContainer.querySelectorAll('*');
            const textBlocks = [];
            
            // Determine the bounding rect of the content for relative positioning
            const containerRect = tempContainer.getBoundingClientRect();
            
            allElements.forEach((element) => {
                const text = (element.textContent || '').trim();
                if (!text) return;
                
                // Skip elements that are purely structural (html, head, body, meta, link, style, script, title, br, hr)
                const tag = element.tagName.toLowerCase();
                if (['html', 'head', 'body', 'meta', 'link', 'style', 'script', 'title', 'br', 'hr'].includes(tag)) return;
                
                // Get computed styles from the browser (includes CSS from <style> tags)
                const computedStyle = tempContainer.ownerDocument.defaultView.getComputedStyle(element);
                
                // Only create a text block for elements that actually render text
                const display = computedStyle.display;
                if (display === 'none' || display === 'hidden') return;
                
                // Parse font properties
                const rawFontFamily = computedStyle.fontFamily || 'Arial';
                const fontFamily = rawFontFamily.replace(/['"]/g, '').split(',')[0].trim() || 'Arial';
                const fontSize = parseFloat(computedStyle.fontSize) || 16;
                const fontWeight = computedStyle.fontWeight || 'normal';
                const fontStyle = computedStyle.fontStyle || 'normal';
                const textAlign = computedStyle.textAlign || 'left';
                
                // Parse color (computed style returns rgb/rgba)
                let fillStyle = computedStyle.color || '#000000';
                
                // Parse text shadow for canvas shadow
                const shadowStr = computedStyle.textShadow || '';
                let shadow = false;
                let shadowColor = 'rgba(0,0,0,0.5)';
                let shadowBlur = 4;
                let shadowOffsetX = 2;
                let shadowOffsetY = 2;
                if (shadowStr && shadowStr !== 'none' && shadowStr !== 'initial' && shadowStr !== 'unset') {
                    shadow = true;
                    // Parse "offsetX offsetY blurColor color" or "offsetX offsetY color"
                    const parts = shadowStr.trim().split(/\s+/);
                    if (parts.length >= 3) {
                        shadowOffsetX = parseInt(parts[0], 10) || 2;
                        shadowOffsetY = parseInt(parts[1], 10) || 2;
                        shadowBlur = parseInt(parts[2], 10) || 4;
                        // Last part is the color (may have 4+ parts if color has spaces)
                        shadowColor = parts.slice(3).join(' ') || 'rgba(0,0,0,0.5)';
                    }
                }
                
                // Parse stroke
                let strokeStyle = null;
                let strokeWidth = 0;
                if (computedStyle.webkitTextStrokeColor && computedStyle.webkitTextStrokeWidth) {
                    strokeStyle = computedStyle.webkitTextStrokeColor;
                    strokeWidth = parseFloat(computedStyle.webkitTextStrokeWidth) || 1;
                }
                
                // Get element position relative to the container
                const elementRect = element.getBoundingClientRect();
                const x = elementRect.left - containerRect.left;
                const y = elementRect.top - containerRect.top;
                
                // Measure text dimensions
                this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;
                const lines = text.split('\n');
                let maxWidth = 0;
                lines.forEach(line => {
                    const metrics = this.ctx.measureText(line);
                    if (metrics.width > maxWidth) maxWidth = metrics.width;
                });
                const lineHeight = fontSize * 1.3;
                const width = maxWidth + 4; // small padding
                const height = lines.length * lineHeight + 4;
                
                // Parse rotation from transform
                let rotation = 0;
                const transform = computedStyle.transform;
                if (transform && transform !== 'none' && transform !== 'matrix(1, 0, 0, 1, 0, 0)') {
                    // Try to extract rotation from matrix: matrix(a, b, c, d, e, f)
                    // rotation = atan2(b, a)
                    const matrixMatch = transform.match(/matrix(?:3d)?\(([^)]+)\)/);
                    if (matrixMatch) {
                        const vals = matrixMatch[1].split(',').map(v => parseFloat(v.trim()));
                        if (vals.length >= 4) {
                            rotation = Math.atan2(vals[1], vals[0]) * 180 / Math.PI;
                        }
                    }
                }
                
                textBlocks.push({
                    text: text,
                    x: Math.round(x),
                    y: Math.round(y),
                    width: Math.round(width),
                    height: Math.round(height),
                    fontSize: fontSize,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    fontStyle: fontStyle,
                    textAlign: textAlign,
                    fillStyle: fillStyle,
                    strokeStyle: strokeStyle,
                    strokeWidth: strokeWidth,
                    shadow: shadow,
                    shadowColor: shadowColor,
                    shadowBlur: shadowBlur,
                    shadowOffsetX: shadowOffsetX,
                    shadowOffsetY: shadowOffsetY,
                    rotation: Math.round(rotation * 10) / 10
                });
            });
            
            // Sort text blocks by y-position (top to bottom) so overlapping renders correctly
            textBlocks.sort((a, b) => a.y - b.y);
            
            // Add all text blocks to the renderer
            for (const block of textBlocks) {
                this.textBlocks.push(block);
            }
            
            if (this.textBlocks.length > 0) {
                this.selectedBlockIndex = this.textBlocks.length - 1;
            }
            
            // Clean up temp container
            if (tempContainer.parentNode) {
                tempContainer.parentNode.removeChild(tempContainer);
            }
            
            this.render();
            if (this.onChange) this.onChange();
        });
    }

    /**
     * Load overlay data from JSON configuration
     * This method parses the JSON overlay data and creates text blocks, shapes, lines, and ornaments
     * @param {Object} overlayData - JSON overlay data from AI response
     * @returns {Promise<void>}
     */
    loadOverlayData(overlayData) {
        //console.log('ArtworkCanvasRenderer: Received overlay data:', JSON.stringify(overlayData, null, 2));
        if (!overlayData || !overlayData.overlay) {
            console.warn('ArtworkCanvasRenderer: Invalid overlay data');
            return;
        }

        const overlay = overlayData.overlay;
        this._fontLoadGeneration += 1;
        const fontLoadGeneration = this._fontLoadGeneration;
        
        // Set canvas dimensions to match the background image
        if (overlay.width && overlay.height) {
            this.canvas.width = overlay.width;
            this.canvas.height = overlay.height;
        }

        // Clear existing text blocks
        this.clearTextBlocks({ render: false, notify: false });

        // Process text elements
        if (overlay.texts && Array.isArray(overlay.texts)) {
            for (const textData of overlay.texts) {
                // Parse shadow - JSON overlay format is an object with enabled flag
                let shadow = null;
                if (textData.shadow && typeof textData.shadow === 'object') {
                    shadow = {
                        enabled: textData.shadow.enabled !== false,
                        color: textData.shadow.color || 'rgba(0,0,0,0.5)',
                        blur: Number(textData.shadow.blur) || 4,
                        offsetX: Number(textData.shadow.offsetX) || 2,
                        offsetY: Number(textData.shadow.offsetY) || 2
                    };
                }

                const block = {
                    text: textData.text || '',
                    x: Number(textData.x) || 0,
                    y: Number(textData.y) || 0,
                    fontSize: Number(textData.fontSize) || 16,
                    fontFamily: textData.fontFamily || 'Arial',
                    fontWeight: textData.fontWeight || 'normal',
                    fontStyle: textData.fontStyle || 'normal',
                    textAlign: textData.textAlign || 'left',
                    fillStyle: textData.color || '#FFFFFF',
                    rotation: Number(textData.rotation) || 0,
                    opacity: Number(textData.opacity) || 1,
                    lineHeight: Number(textData.lineHeight) || 1.3,
                    maxWidth: Number(textData.maxWidth) || 0,
                    letterSpacing: Number(textData.letterSpacing) || 0,
                    backgroundColor: textData.backgroundColor || null,
                    backgroundPadding: textData.backgroundPadding || '8px 12px',
                    shadow: shadow,
                    overlaySource: true,  // Mark as JSON overlay source for correct positioning
                    id: textData.id || null,
                    fontRef: textData.fontRef || null
                };

                // Measure text dimensions with maxWidth support
                const dimensions = this.measureTextBlock(block);
                block.width = dimensions.width;
                block.height = dimensions.height;

                this.textBlocks.push(block);
            }
        }

        // Process shapes, lines, and ornaments (stored for rendering)
        this.shapes = overlay.shapes || [];
        this.lines = overlay.lines || [];
        this.ornaments = overlay.ornaments || [];

        // Render everything
        this.render();
        if (this.onChange) this.onChange();

        // Load web fonts asynchronously and rerender after font files are ready.
        this.loadOverlayWebFonts(overlay, fontLoadGeneration)
            .then((loadedCount) => {
                if (fontLoadGeneration !== this._fontLoadGeneration) {
                    return;
                }
                if (loadedCount > 0) {
                    /* console.log('ArtworkCanvasRenderer[overlay-chain]: web fonts loaded, rerendering', {
                        loadedCount
                    }); */
                    this.render();
                    if (this.onChange) this.onChange();
                }
            })
            .catch((error) => {
                //console.warn('ArtworkCanvasRenderer[overlay-chain]: web font loading failed', error);
            });
    }

    async loadOverlayWebFonts(overlay, generation) {
        if (!overlay || generation !== this._fontLoadGeneration) {
            return 0;
        }

        const descriptors = [];
        if (Array.isArray(overlay.webFonts)) {
            descriptors.push(...overlay.webFonts);
        }
        if (Array.isArray(overlay.texts)) {
            overlay.texts.forEach((text) => {
                if (text && (text.fontUrl || text.googleFont || text.googleFontUrl)) {
                    descriptors.push({
                        family: text.fontFamily,
                        url: text.fontUrl || null,
                        googleFont: text.googleFont || null,
                        googleFontUrl: text.googleFontUrl || null,
                        source: text.fontProvider || null,
                        weight: text.fontWeight,
                        style: text.fontStyle
                    });
                }
            });
        }

        if (!descriptors.length) {
            return 0;
        }

        let loadedCount = 0;
        for (const descriptor of descriptors) {
            if (generation !== this._fontLoadGeneration) {
                break;
            }
            const loaded = await this.loadSingleWebFontDescriptor({
                family: descriptor.family,
                url: descriptor.url,
                googleFont: descriptor.googleFont,
                googleFontUrl: descriptor.googleFontUrl,
                source: descriptor.source,
                weight: descriptor.weight,
                style: descriptor.style
            });
            if (loaded) {
                loadedCount += 1;
            }
        }

        return loadedCount;
    }

    async loadSingleWebFontDescriptor(descriptor) {
        if (!descriptor || typeof descriptor !== 'object') {
            return false;
        }

        const family = String(descriptor.family || descriptor.fontFamily || '').trim();
        if (!family) {
            return false;
        }

        const normalizedFamily = this.normalizeFontFamilyName(family);
        const isSystemFamily = this.isLikelySystemFontFamily(normalizedFamily);

        const weight = String(descriptor.weight || descriptor.fontWeight || '400').trim();
        const style = String(descriptor.style || descriptor.fontStyle || 'normal').trim();
        const provider = String(descriptor.source || descriptor.provider || '').trim().toLowerCase();
        const explicitGoogleCssUrl = String(descriptor.googleFontUrl || '').trim();
        const explicitGoogleFamily = String(descriptor.googleFont || '').trim();
        const url = String(descriptor.url || descriptor.fontUrl || '').trim();

        const googleCssUrl = explicitGoogleCssUrl || this.buildGoogleFontsCssUrl(normalizedFamily, explicitGoogleFamily || normalizedFamily, weight, style);
        if (provider === 'google' || explicitGoogleCssUrl || explicitGoogleFamily) {
            return await this.ensureStylesheetFont(normalizedFamily, googleCssUrl, `${normalizedFamily}|google|${weight}|${style}`);
        }

        if (url) {
            const isStylesheet = /fonts\.googleapis\.com|\.css(\?|$)/i.test(url);
            if (isStylesheet) {
                return await this.ensureStylesheetFont(normalizedFamily, url, `${normalizedFamily}|css|${weight}|${style}`);
            }
            return await this.ensureFontFaceFont(normalizedFamily, url, weight, style);
        }

        if (!isSystemFamily) {
            const fallbackUrl = this.buildGoogleFontsCssUrl(normalizedFamily, normalizedFamily, weight, style);
            return await this.ensureStylesheetFont(
                normalizedFamily,
                fallbackUrl,
                `${normalizedFamily}|fallback-google|${weight}|${style}`
            );
        }

        return false;
    }

    buildGoogleFontsCssUrl(family, explicitFamilyParam, weight, style) {
        if (explicitFamilyParam) {
            const encoded = encodeURIComponent(explicitFamilyParam.trim()).replace(/%20/g, '+');
            return `https://fonts.googleapis.com/css2?family=${encoded}&display=swap`;
        }

        if (!family) {
            return '';
        }

        const familyParam = family.trim().replace(/\s+/g, '+');
        const normalizedWeight = /^\d+$/.test(String(weight || '')) ? String(weight) : '400';
        const normalizedStyle = String(style || '').toLowerCase() === 'italic' ? 'italic' : 'normal';
        const styleAxis = normalizedStyle === 'italic' ? `ital,wght@1,${normalizedWeight}` : `wght@${normalizedWeight}`;
        return `https://fonts.googleapis.com/css2?family=${familyParam}:${styleAxis}&display=swap`;
    }

    normalizeFontFamilyName(fontFamily) {
        return String(fontFamily || '')
            .split(',')
            .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
            .find(Boolean) || '';
    }

    isLikelySystemFontFamily(fontFamily) {
        const normalized = this.normalizeFontFamilyName(fontFamily).toLowerCase();
        if (!normalized) {
            return true;
        }

        const knownSystemFonts = new Set([
            'arial', 'helvetica', 'georgia', 'times new roman', 'times', 'verdana',
            'impact', 'courier new', 'courier', 'system-ui', 'sans-serif', 'serif', 'monospace',
            '-apple-system', 'blinkmacsystemfont'
        ]);

        return knownSystemFonts.has(normalized);
    }

    async ensureStylesheetFont(family, href, key) {
        if (!href) {
            return false;
        }
        if (this._loadedWebFontKeys.has(key)) {
            //console.log('ArtworkCanvasRenderer[overlay-chain]: stylesheet font already loaded', { family, href, key });
            return false;
        }

        if (!this._loadedStylesheetHrefs.has(href)) {
            //console.log('ArtworkCanvasRenderer[overlay-chain]: injecting stylesheet font link', { family, href, key });
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
            this._loadedStylesheetHrefs.add(href);
        } else {
            //console.log('ArtworkCanvasRenderer[overlay-chain]: stylesheet already injected', { family, href, key });
        }

        const loaded = await this.waitForFontFamily(family, 3500);
        //console.log('ArtworkCanvasRenderer[overlay-chain]: stylesheet font readiness result', { family, href, key, loaded });
        if (loaded) {
            this._loadedWebFontKeys.add(key);
        }
        return loaded;
    }

    async ensureFontFaceFont(family, url, weight, style) {
        const key = `${family}|${url}|${weight}|${style}`;
        if (this._loadedWebFontKeys.has(key)) {
            //console.log('ArtworkCanvasRenderer[overlay-chain]: direct font already loaded', { family, url, weight, style, key });
            return false;
        }

        try {
            //console.log('ArtworkCanvasRenderer[overlay-chain]: loading direct font face', { family, url, weight, style, key });
            const face = new FontFace(family, `url("${url}")`, { weight, style });
            const loadedFace = await face.load();
            document.fonts.add(loadedFace);
            const ready = await this.waitForFontFamily(family, 3500);
            //console.log('ArtworkCanvasRenderer[overlay-chain]: direct font face readiness result', { family, url, weight, style, key, ready });
            this._loadedWebFontKeys.add(key);
            return true;
        } catch (error) {
            console.warn('ArtworkCanvasRenderer[overlay-chain]: FontFace load failed', {
                family,
                url,
                error
            });
            return false;
        }
    }

    async waitForFontFamily(family, timeoutMs = 3500) {
        if (!document.fonts || !document.fonts.load) {
            //console.log('ArtworkCanvasRenderer[overlay-chain]: document.fonts unavailable for font readiness check', { family, timeoutMs });
            return false;
        }

        //console.log('ArtworkCanvasRenderer[overlay-chain]: waiting for font family', { family, timeoutMs });
        const timeoutPromise = new Promise((resolve) => {
            window.setTimeout(() => resolve(false), timeoutMs);
        });
        const loadPromise = document.fonts
            .load(`16px "${family}"`)
            .then(() => true)
            .catch(() => false);
        const ready = await Promise.race([loadPromise, timeoutPromise]);
        //console.log('ArtworkCanvasRenderer[overlay-chain]: font family wait finished', { family, timeoutMs, ready });
        return ready;
    }

    /**
     * Render shapes, lines, and ornaments to canvas
     */
    renderDecorations(ctx) {
        // Render lines first (behind everything)
        if (this.lines && Array.isArray(this.lines)) {
            for (const line of this.lines) {
                ctx.save();
                ctx.globalAlpha = this.normalizeOpacity(line.opacity, 1);
                ctx.strokeStyle = line.color || '#FFFFFF';
                ctx.lineWidth = Number(line.strokeWidth) || 2;
                
                if (line.dashArray) {
                    ctx.setLineDash(line.dashArray.split(',').map(d => Number(d.trim()) || 0));
                }
                
                ctx.beginPath();
                ctx.moveTo(Number(line.x1) || 0, Number(line.y1) || 0);
                ctx.lineTo(Number(line.x2) || 0, Number(line.y2) || 0);
                ctx.stroke();
                ctx.restore();
            }
        }

        // Render shapes
        if (this.shapes && Array.isArray(this.shapes)) {
            for (const shape of this.shapes) {
                ctx.save();
                ctx.globalAlpha = this.normalizeOpacity(shape.opacity, 1);
                
                const cx = Number(shape.cx) || (Number(shape.x) || 0) + (Number(shape.width) || 0) / 2;
                const cy = Number(shape.cy) || (Number(shape.y) || 0) + (Number(shape.height) || 0) / 2;
                
                if (shape.rotation) {
                    ctx.translate(cx, cy);
                    ctx.rotate(shape.rotation * Math.PI / 180);
                    ctx.translate(-cx, -cy);
                }

                if (shape.type === 'rect') {
                    const w = Number(shape.width) || 100;
                    const h = Number(shape.height) || 100;
                    const x = Number(shape.x) || 0;
                    const y = Number(shape.y) || 0;
                    const rx = Number(shape.rx) || 0;
                    
                    if (shape.color) {
                        ctx.fillStyle = shape.color;
                        this.roundedRect(ctx, x, y, w, h, rx);
                        ctx.fill();
                    }
                    if (shape.strokeColor) {
                        ctx.strokeStyle = shape.strokeColor;
                        ctx.lineWidth = Number(shape.strokeWidth) || 2;
                        this.roundedRect(ctx, x, y, w, h, rx);
                        ctx.stroke();
                    }
                } else if (shape.type === 'circle' || shape.type === 'ellipse') {
                    ctx.beginPath();
                    const rx = Number(shape.rx) || (shape.type === 'circle' ? (Number(shape.width) || 50) : (Number(shape.width) || 100) / 2);
                    const ry = Number(shape.ry) || (shape.type === 'circle' ? (Number(shape.height) || 50) : (Number(shape.height) || 100) / 2);
                    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
                    if (shape.color) {
                        ctx.fillStyle = shape.color;
                        ctx.fill();
                    }
                    if (shape.strokeColor) {
                        ctx.strokeStyle = shape.strokeColor;
                        ctx.lineWidth = Number(shape.strokeWidth) || 2;
                        ctx.stroke();
                    }
                } else if (shape.type === 'line') {
                    ctx.strokeStyle = shape.strokeColor || shape.color || '#FFFFFF';
                    ctx.lineWidth = Number(shape.strokeWidth) || 2;
                    ctx.beginPath();
                    ctx.moveTo(Number(shape.x) || 0, Number(shape.y) || 0);
                    ctx.lineTo((Number(shape.x) || 0) + (Number(shape.width) || 100), (Number(shape.y) || 0) + (Number(shape.height) || 0));
                    ctx.stroke();
                }
                
                ctx.restore();
            }
        }

        // Render ornaments (simplified - stars and badges)
        if (this.ornaments && Array.isArray(this.ornaments)) {
            for (const ornament of this.ornaments) {
                ctx.save();
                ctx.globalAlpha = this.normalizeOpacity(ornament.opacity, 1);
                
                const x = Number(ornament.x) || 0;
                const y = Number(ornament.y) || 0;
                const size = Number(ornament.size) || 20;
                
                if (ornament.rotation) {
                    ctx.translate(x + size / 2, y + size / 2);
                    ctx.rotate(ornament.rotation * Math.PI / 180);
                    ctx.translate(-(x + size / 2), -(y + size / 2));
                }

                if (ornament.type === 'star') {
                    this.drawStar(ctx, x + size / 2, y + size / 2, 5, size / 2, size / 4, ornament.color || '#FFD700');
                } else if (ornament.type === 'badge') {
                    ctx.beginPath();
                    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
                    ctx.fillStyle = ornament.color || '#FF0000';
                    ctx.fill();
                    if (ornament.secondaryColor) {
                        ctx.fillStyle = ornament.secondaryColor;
                        ctx.font = `bold ${size / 2}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('!', x + size / 2, y + size / 2 + 1);
                    }
                }
                
                ctx.restore();
            }
        }
    }

    /**
     * Draw a star shape on canvas
     */
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    /**
     * Draw a rounded rectangle on canvas
     */
    roundedRect(ctx, x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
    }

    /**
     * Render text blocks with background panels and shadows
     */
    renderTextWithBackgrounds(ctx) {
        for (const block of this.textBlocks) {
            ctx.save();
            
            // Apply opacity
            ctx.globalAlpha = block.opacity || 1;
            
            // Apply rotation
            if (block.rotation) {
                const cx = block.x + block.width / 2;
                const cy = block.y + block.height / 2;
                ctx.translate(cx, cy);
                ctx.rotate(block.rotation * Math.PI / 180);
                ctx.translate(-cx, -cy);
            }

            // Draw background panel if specified
            if (block.backgroundColor) {
                const padding = this.parsePadding(block.backgroundPadding);
                ctx.fillStyle = block.backgroundColor;
                this.roundedRect(
                    ctx,
                    block.x - padding.left,
                    block.y - padding.top,
                    block.width + padding.left + padding.right,
                    block.height + padding.top + padding.bottom,
                    4
                );
                ctx.fill();
            }

            // Draw shadow if specified
            if (block.shadow && block.shadow.enabled) {
                ctx.shadowColor = block.shadow.color || 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = Number(block.shadow.blur) || 4;
                ctx.shadowOffsetX = Number(block.shadow.offsetX) || 2;
                ctx.shadowOffsetY = Number(block.shadow.offsetY) || 2;
            }

            // Set text styles
            const fontWeight = typeof block.fontWeight === 'number' ? block.fontWeight : 
                              block.fontWeight === 'bold' ? 'bold' : 'normal';
            ctx.font = `${block.fontStyle || 'normal'} ${fontWeight} ${block.fontSize}px "${block.fontFamily}"`;
            ctx.textAlign = block.textAlign || 'left';
            ctx.textBaseline = 'top';
            ctx.fillStyle = block.fillStyle || '#FFFFFF';
            ctx.letterSpacing = block.letterSpacing || '0px';

            // Draw text (handle multi-line)
            const lines = block.text.split('\n');
            const lineHeight = block.fontSize * (block.lineHeight || 1.3);
            
            for (let i = 0; i < lines.length; i++) {
                let textX = block.x;
                if (block.textAlign === 'center') {
                    textX = block.x + block.width / 2;
                    ctx.textAlign = 'center';
                } else if (block.textAlign === 'right') {
                    textX = block.x + block.width;
                    ctx.textAlign = 'right';
                }
                
                ctx.fillText(lines[i], textX, block.y + i * lineHeight);
            }

            ctx.restore();
        }
    }

    /**
     * Parse padding string to object
     */
    parsePadding(paddingStr) {
        const parts = String(paddingStr || '8px 12px').split(/\s+/);
        let top = 8, right = 12, bottom = 8, left = 12;
        
        if (parts.length === 1) {
            top = right = bottom = left = parseInt(parts[0]) || 8;
        } else if (parts.length === 2) {
            top = bottom = parseInt(parts[0]) || 8;
            right = left = parseInt(parts[1]) || 12;
        } else if (parts.length === 3) {
            top = parseInt(parts[0]) || 8;
            right = left = parseInt(parts[1]) || 12;
            bottom = parseInt(parts[2]) || 8;
        } else if (parts.length >= 4) {
            top = parseInt(parts[0]) || 8;
            right = parseInt(parts[1]) || 12;
            bottom = parseInt(parts[2]) || 8;
            left = parseInt(parts[3]) || 12;
        }
        
        return { top, right, bottom, left };
    }

    /**
     * Normalize opacity while preserving explicit 0 values.
     */
    normalizeOpacity(value, fallback = 1) {
        const n = Number(value);
        if (!Number.isFinite(n)) return fallback;
        if (n < 0) return 0;
        if (n > 1) return 1;
        return n;
    }

}