/**
 * CanvasPreviewManager - Manages canvas-based text overlay preview
 * Integrates ArtworkCanvasRenderer and CanvasInteractionHandler into ArtworkPreviewWindow
 */
class CanvasPreviewManager {
    constructor(previewWindow) {
        this.previewWindow = previewWindow;
        this.canvas = null;
        this.canvasStage = null;
        this.renderer = null;
        this.interactionHandler = null;
        this.isCanvasMode = false;
        this.textBlocks = [];
        this.selectedBlockIndex = -1;
        this.onChange = null;
        this.zoomLevel = Number(previewWindow?.textOverlayZoom) || 1;
    }

    /**
      * Initialize canvas preview mode (async — loads background then HTML)
      * @param {string} code - HTML code to render as text overlays
      * @returns {Promise<void>}
      */
    async initialize(code = null) {
        if (this.isCanvasMode) return;

         // Create canvas container
        const container = this.previewWindow.container.querySelector('.preview-preview-view');
        if (!container) return;

         // Remove iframe if present
        const iframe = container.querySelector('iframe');
        if (iframe) iframe.remove();

         // Create canvas container
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-preview-container';
        canvasContainer.style.width = '100%';
        canvasContainer.style.height = '100%';
        canvasContainer.style.position = 'relative';
        canvasContainer.style.overflow = 'auto';

         // Create canvas element
        this.canvasStage = document.createElement('div');
        this.canvasStage.className = 'canvas-preview-stage';

        this.canvas = document.createElement('canvas');
        this.canvas.style.width = 'auto';
        this.canvas.style.height = 'auto';
        this.canvas.style.maxWidth = 'none';
        this.canvas.style.maxHeight = 'none';
        this.canvas.style.display = 'block';
        this.canvasStage.appendChild(this.canvas);
        canvasContainer.appendChild(this.canvasStage);


         // Insert canvas container before the footer in the window container.
        const windowContainer = this.previewWindow.container;
        const footer = windowContainer.querySelector('.preview-window-footer');
        if (footer) {
            windowContainer.insertBefore(canvasContainer, footer);
         } else {
            windowContainer.appendChild(canvasContainer);
         }

         // Create the ArtworkCanvasRenderer
        this.renderer = new ArtworkCanvasRenderer(this.canvas);
        this.renderer.setOnChange(() => this.onCanvasChange());

         // Create the CanvasInteractionHandler
        this.interactionHandler = new CanvasInteractionHandler(
            this.renderer,
            this.canvas,
            () => this.onCanvasChange()
        );

          // Store this promise so exportCanvas() can await initialization
        this._initPromise = (async () => {
              // Load background image if available
            const backgroundImage = this.previewWindow.backgroundImage;
            if (backgroundImage) {
                try {
                    await this.renderer.loadBackground(backgroundImage);
                  } catch (err) {
                    console.warn('CanvasPreviewManager: Failed to load background image', err);
                      // Set fallback dimensions from source image if available
                    if (this.previewWindow.sourceImageWidth > 0 && this.previewWindow.sourceImageHeight > 0) {
                        this.canvas.width = this.previewWindow.sourceImageWidth;
                        this.canvas.height = this.previewWindow.sourceImageHeight;
                                                this.syncCanvasDisplaySize();
                        this.renderer.render();
                      }
                  }
                } else if (this.previewWindow.sourceImageWidth > 0 && this.previewWindow.sourceImageHeight > 0) {
                  // No background image but we have source dimensions
                this.canvas.width = this.previewWindow.sourceImageWidth;
                this.canvas.height = this.previewWindow.sourceImageHeight;
                                this.syncCanvasDisplaySize();
                this.renderer.render();
              }

                  // If overlay JSON data is available, use it directly instead of HTML
            const overlayData = this.previewWindow.overlayData;
            if (overlayData) {
                try {
                                        const overlay = overlayData.overlay || {};
                        await this.renderer.loadOverlayData(overlayData);
                  } catch (err) {
                    console.warn('CanvasPreviewManager: Failed to load overlay data', err);
                                        if (this.previewWindow?.isTextOverlayPreview) {
                                                console.error('CanvasPreviewManager[overlay-chain]: Overlay mode is JSON-only; HTML fallback disabled');
                                        } else if (code) {
                                                console.log('CanvasPreviewManager[overlay-chain]: Falling back to HTML load after overlay JSON failure');
                                                await this.renderer.loadHtml(code);
                                        }
                  }
                            } else if (code && !this.previewWindow?.isTextOverlayPreview) {
                  // Load HTML code into renderer if provided (fallback)
                try {
                                        console.log('CanvasPreviewManager[overlay-chain]: No overlay JSON available, loading HTML fallback');
                    await this.renderer.loadHtml(code);
                  } catch (err) {
                    console.warn('CanvasPreviewManager: Failed to load HTML code', err);
                  }
                            } else if (this.previewWindow?.isTextOverlayPreview) {
                                console.error('CanvasPreviewManager[overlay-chain]: Missing overlay JSON in overlay mode; cannot initialize text overlay from HTML');
              }

                  // Mark canvas mode as active
            this.isCanvasMode = true;

                  // Add event listeners
            this.addEventListeners();
          })();
          await this._initPromise;
          this.centerCanvasInView();
          return this._initPromise;
         }

    /**
     * Add event listeners
     */
    addEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Handle canvas resize     */
    handleResize() {
    if (!this.canvas || !this.renderer) return;
    this.syncCanvasDisplaySize();
    this.renderer.render();
    this.centerCanvasInView();
}

    syncCanvasDisplaySize() {
        if (!this.canvas) return;

        const zoomLevel = Number(this.zoomLevel) || 1;
        const displayWidth = Math.max(1, Math.round((Number(this.canvas.width) || 0) * zoomLevel));
        const displayHeight = Math.max(1, Math.round((Number(this.canvas.height) || 0) * zoomLevel));

        this.canvas.style.width = `${displayWidth}px`;
        this.canvas.style.height = `${displayHeight}px`;
    }

    centerCanvasInView() {
        const canvasContainer = this.previewWindow?.container?.querySelector('.canvas-preview-container');
        if (!canvasContainer) {
            return;
        }

        window.requestAnimationFrame(() => {
            const maxScrollLeft = Math.max(0, canvasContainer.scrollWidth - canvasContainer.clientWidth);
            const maxScrollTop = Math.max(0, canvasContainer.scrollHeight - canvasContainer.clientHeight);
            canvasContainer.scrollLeft = Math.round(maxScrollLeft / 2);
            canvasContainer.scrollTop = Math.round(maxScrollTop / 2);
        });
    }

    setZoom(zoomLevel) {
        const nextZoom = Number(zoomLevel);
        if (!Number.isFinite(nextZoom) || nextZoom <= 0) {
            return;
        }

        this.zoomLevel = nextZoom;
        this.syncCanvasDisplaySize();
        this.centerCanvasInView();
    }

    /**
     * Handle canvas state change
     */
    onCanvasChange() {
        this.textBlocks = this.renderer.textBlocks;
        this.selectedBlockIndex = this.renderer.selectedBlockIndex;

        // Keep the JSON source in sync for overlay mode, and preserve the old
        // code-view behavior for HTML previews.
        if (this.previewWindow.isTextOverlayPreview || this.previewWindow.currentView === 'code') {
            this.updateCodeFromCanvas();
        }

        if (this.onChange) {
            this.onChange();
        }
    }

    /**
     * Update code editor from canvas state
     */
    updateCodeFromCanvas() {
        this.syncCodeEditorFromCanvas();
    }

    /**
     * Sync the code editor with the latest canvas state.
     */
    syncCodeEditorFromCanvas() {
        if (!this.previewWindow.codeEditor) return;

        const code = this.generateCodeFromCanvas();
        if (!code) return;

        this.previewWindow.generatedCode = code;
        this.previewWindow.codeEditor.textContent = code;
    }

    /**
     * Generate the current editable source from canvas state.
     * Overlay previews serialize back to JSON; other previews stay HTML.
     */
    generateCodeFromCanvas() {
        if (this.previewWindow?.isTextOverlayPreview) {
            const overlayData = this.buildOverlayDataFromCanvas();
            if (!overlayData) {
                return '';
            }

            this.previewWindow.overlayData = overlayData;
            return JSON.stringify(overlayData, null, 2);
        }

        return this.generateHTMLFromCanvas();
    }

    /**
     * Build overlay JSON from the current canvas text blocks.
     */
    buildOverlayDataFromCanvas() {
        if (!this.renderer) {
            return null;
        }

        const cloneOverlayData = (value) => {
            if (!value || typeof value !== 'object') {
                return { overlay: {} };
            }

            if (typeof structuredClone === 'function') {
                try {
                    return structuredClone(value);
                } catch (_error) {
                    // Fall through to JSON cloning.
                }
            }

            return JSON.parse(JSON.stringify(value));
        };

        const asNumber = (value, fallback) => {
            const numericValue = Number(value);
            return Number.isFinite(numericValue) ? numericValue : fallback;
        };

        const overlayData = cloneOverlayData(this.previewWindow?.overlayData || { overlay: {} });
        const overlay = overlayData.overlay || (overlayData.overlay = {});
        const existingTexts = Array.isArray(overlay.texts) ? overlay.texts : [];
        const existingTextsById = new Map();

        existingTexts.forEach((text, index) => {
            if (text && text.id !== undefined && text.id !== null) {
                existingTextsById.set(String(text.id), text);
            } else {
                existingTextsById.set(`index:${index}`, text);
            }
        });

        overlay.width = this.renderer.canvas?.width || overlay.width || 0;
        overlay.height = this.renderer.canvas?.height || overlay.height || 0;
        overlay.texts = this.renderer.textBlocks.map((block, index) => {
            const existingText = block.id !== undefined && block.id !== null
                ? existingTextsById.get(String(block.id))
                : existingTextsById.get(`index:${index}`);
            const serializedText = existingText && typeof existingText === 'object'
                ? { ...existingText }
                : {};

            serializedText.id = block.id ?? serializedText.id ?? null;
            serializedText.text = block.text ?? '';
            serializedText.x = asNumber(block.x, 0);
            serializedText.y = asNumber(block.y, 0);
            serializedText.fontSize = asNumber(block.fontSize, 16);
            serializedText.fontFamily = block.fontFamily || serializedText.fontFamily || 'Arial';
            serializedText.fontWeight = block.fontWeight || serializedText.fontWeight || 'normal';
            serializedText.fontStyle = block.fontStyle || serializedText.fontStyle || 'normal';
            serializedText.textAlign = block.textAlign || serializedText.textAlign || 'left';
            serializedText.color = block.fillStyle || serializedText.color || '#FFFFFF';
            serializedText.rotation = asNumber(block.rotation, 0);
            serializedText.opacity = block.opacity !== undefined ? asNumber(block.opacity, 1) : (serializedText.opacity ?? 1);
            serializedText.lineHeight = block.lineHeight !== undefined ? asNumber(block.lineHeight, 1.3) : (serializedText.lineHeight ?? 1.3);
            serializedText.maxWidth = block.maxWidth !== undefined ? asNumber(block.maxWidth, 0) : (serializedText.maxWidth ?? 0);
            serializedText.letterSpacing = block.letterSpacing !== undefined ? asNumber(block.letterSpacing, 0) : (serializedText.letterSpacing ?? 0);
            serializedText.backgroundColor = block.backgroundColor !== undefined ? block.backgroundColor : (serializedText.backgroundColor ?? null);
            serializedText.backgroundPadding = block.backgroundPadding !== undefined ? block.backgroundPadding : (serializedText.backgroundPadding ?? '8px 12px');
            serializedText.shadow = block.shadow !== undefined ? block.shadow : serializedText.shadow;
            serializedText.overlaySource = true;
            if (block.fontRef !== undefined || serializedText.fontRef !== undefined) {
                serializedText.fontRef = block.fontRef ?? serializedText.fontRef ?? null;
            }
            if (block.fontUrl !== undefined || serializedText.fontUrl !== undefined) {
                serializedText.fontUrl = block.fontUrl ?? serializedText.fontUrl ?? null;
            }
            if (block.googleFont !== undefined || serializedText.googleFont !== undefined) {
                serializedText.googleFont = block.googleFont ?? serializedText.googleFont ?? null;
            }
            if (block.googleFontUrl !== undefined || serializedText.googleFontUrl !== undefined) {
                serializedText.googleFontUrl = block.googleFontUrl ?? serializedText.googleFontUrl ?? null;
            }
            if (block.fontProvider !== undefined || serializedText.fontProvider !== undefined) {
                serializedText.fontProvider = block.fontProvider ?? serializedText.fontProvider ?? null;
            }

            return serializedText;
        });

        overlay.ornaments = Array.isArray(this.renderer.ornaments)
            ? cloneOverlayData(this.renderer.ornaments)
            : [];
        delete overlay.shapes;
        delete overlay.lines;

        return overlayData;
    }

    /**
     * Generate HTML from canvas state
     */
    generateHTMLFromCanvas() {
        let html = '<!DOCTYPE html>\n<html>\n<head>\n';
        html += '<meta charset="UTF-8">\n';
        html += '<style>\n';
        html += 'body { margin: 0; padding: 0; }\n';
        html += '</style>\n';
        html += '</head>\n<body>\n';

        // Add background image if available
        if (this.renderer.bgImage) {
            html += `<img src="${this.renderer.bgImage.src}" style="width: 100%; height: auto;">\n`;
        }

        // Add text blocks
        this.renderer.textBlocks.forEach(block => {
            html += `<div style="position: absolute; left: ${block.x}px; top: ${block.y}px; `;
            html += `font-family: '${block.fontFamily}'; `;
            html += `font-size: ${block.fontSize}px; `;
            html += `font-weight: ${block.fontWeight}; `;
            html += `font-style: ${block.fontStyle}; `;
            html += `text-align: ${block.textAlign}; `;
            html += `color: ${block.fillStyle}; `;
            html += `transform: rotate(${block.rotation}deg); `;
            html += `">${block.text}</div>\n`;
        });

        html += '</body>\n</html>';
        return html;
    }

    /**
     * Set change callback
     */
    setOnChange(callback) {
        this.onChange = callback;
    }

    /**
     * Get canvas state
     */
    getState() {
        return this.renderer.getState();
    }

    /**
     * Set canvas state
     */
    setState(state) {
        this.renderer.setState(state);
    }

    /**
     * Export canvas (background + text overlays) as a PNG file download
     * @param {number} scale - Export scale (default 2 for high-res)
     * @returns {Promise<void>}
     */
    async exportCanvas(scale = 1) {
        // Ensure initialization is complete
        if (this._initPromise) {
            await this._initPromise;
        }
        if (!this.renderer || !this.canvas) {
            console.warn('CanvasPreviewManager: Cannot export — canvas not initialized');
            return;
        }
        const dataUrl = this.renderer.exportPNG(scale);
        const link = document.createElement('a');
        link.download = 'artwork-export.png';
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Toggle canvas mode
     */
    toggleCanvasMode() {
        if (this.isCanvasMode) {
            this.disableCanvasMode();
        } else {
            this.initialize();
        }
    }

    /**
     * Disable canvas mode
     */
    disableCanvasMode() {
        if (!this.isCanvasMode) return;

        // Remove canvas container
        const container = this.previewWindow.container.querySelector('.canvas-preview-container');
        if (container) {
            container.remove();
        }

        // Re-add iframe
        const previewView = this.previewWindow.container.querySelector('.preview-preview-view');
        if (previewView) {
            const iframeShell = document.createElement('div');
            iframeShell.className = 'preview-iframe-shell';
            iframeShell.innerHTML = '<iframe class="preview-iframe" sandbox="allow-scripts allow-same-origin allow-modals" style="background-color:#000;"></iframe>';
            previewView.appendChild(iframeShell);
        }

        this.isCanvasMode = false;
    }

    /**
     * Destroy canvas preview manager
     */
    destroy() {
        this.disableCanvasMode();
        this.renderer = null;
        this.interactionHandler = null;
        this.canvas = null;
    }
}
