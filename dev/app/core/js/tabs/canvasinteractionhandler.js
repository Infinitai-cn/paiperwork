/**
 * CanvasInteractionHandler - Handles mouse/touch interactions for canvas editing
 * This class manages drag, resize, and rotation of text blocks on the canvas
 */
class CanvasInteractionHandler {
    constructor(renderer, canvas, onChange) {
        this.renderer = renderer;
        this.canvas = canvas;
        this.onChange = onChange;
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.startX = 0;
        this.startY = 0;
        this.startBlock = null;
        this.dragTarget = null;
        this.startElement = null;
        this.activeHandle = null;
        this.activeHandleIndex = null;
        this.interactionStartState = null;
        this._renderRafId = null;

        this.bindEvents();
    }

    /**
     * Bind mouse and touch event listeners to canvas
     */
    bindEvents() {
        if (!this.canvas.hasAttribute('tabindex')) {
            this.canvas.setAttribute('tabindex', '0');
        }

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('keydown', (e) => this.onKeyDown(e));

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 0 });
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.onMouseUp({});
        });
    }

    /**
     * Get canvas coordinates from client coordinates
     * @param {Object} e - Event object
     * @returns {Object} Canvas coordinates {x, y}
     */
    getCanvasCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    /**
     * Handle mouse down event
     * @param {Object} e - Event object
     */
    onMouseDown(e) {
        this.canvas.focus();
        const coords = this.getCanvasCoords(e);
        const handle = this.renderer.hitTestHandle(coords.x, coords.y);

        if (handle) {
            // Start resize
            this.isResizing = true;
            this.renderer.setVerticalCenterGuide(null);
            this.activeHandle = handle;
            this.activeHandleIndex = handle.index;
            this.startX = coords.x;
            this.startY = coords.y;
            const selectedBlock = this.renderer.textBlocks[this.renderer.selectedBlockIndex];
            this.startBlock = selectedBlock
                ? {
                    ...JSON.parse(JSON.stringify(selectedBlock)),
                    __layout: this.renderer.getTextBlockLayout(selectedBlock)
                }
                : null;
            this.renderer.setSelectedTarget({ type: 'text', index: this.renderer.selectedBlockIndex });
            this.canvas.style.cursor = handle.cursor;
            this.interactionStartState = this.renderer.getState();
        } else {
            const target = this.renderer.hitTestAny(coords.x, coords.y);
            if (!target) {
                // Clicked empty space — deselect
                this.renderer.setVerticalCenterGuide(null);
                this.renderer.setSelectedTarget(null);
                this.dragTarget = null;
                this.startElement = null;
                this.interactionStartState = null;
                this.onChange();
                return;
            }

            this.dragTarget = target;
            this.isDragging = true;
            this.startX = coords.x;
            this.startY = coords.y;
            this.renderer.setSelectedTarget(target);
            this.interactionStartState = this.renderer.getState();

            if (target.type === 'text') {
                this.startBlock = { ...this.renderer.textBlocks[target.index] };
                this.startElement = null;
            } else {
                this.startBlock = null;
                const element = this.getTargetElement(target);
                this.startElement = element ? JSON.parse(JSON.stringify(element)) : null;
            }

            this.canvas.style.cursor = 'move';
        }
        this.onChange();
    }

    /**
     * Handle mouse move event
     * @param {Object} e - Event object
     */
    onMouseMove(e) {
        if (!this.isDragging && !this.isResizing) {
            // Update cursor based on hover
            const coords = this.getCanvasCoords(e);
            const handle = this.renderer.hitTestHandle(coords.x, coords.y);
            if (handle) {
                this.canvas.style.cursor = handle.cursor;
            } else {
                const target = this.renderer.hitTestAny(coords.x, coords.y);
                this.canvas.style.cursor = target ? 'move' : 'default';
            }
            return;
        }

        const coords = this.getCanvasCoords(e);
        const dx = coords.x - this.startX;
        const dy = coords.y - this.startY;

        if (this.isDragging) {
            if (!this.dragTarget) return;

            if (this.dragTarget.type === 'text') {
                const block = this.renderer.textBlocks[this.dragTarget.index];
                if (!block || !this.startBlock) return;
                block.x = this.startBlock.x + dx;
                block.y = this.startBlock.y + dy;
            } else {
                this.moveDecorationTarget(this.dragTarget, dx, dy);
            }

            this.updateVerticalCenterGuide(this.dragTarget);
        } else if (this.isResizing) {
            const block = this.renderer.textBlocks[this.renderer.selectedBlockIndex];
            if (!block) return;
            this.renderer.setVerticalCenterGuide(null);
            this.handleResize(block, this.activeHandleIndex, dx, dy);
        }

        this.scheduleRender();
    }

    scheduleRender() {
        if (this._renderRafId !== null) {
            return;
        }

        this._renderRafId = window.requestAnimationFrame(() => {
            this._renderRafId = null;
            this.renderer.render();
        });
    }

    flushRender() {
        if (this._renderRafId !== null) {
            window.cancelAnimationFrame(this._renderRafId);
            this._renderRafId = null;
        }
        this.renderer.render();
    }

    /**
     * Handle resize operation
     * @param {Object} block - Text block being resized
     * @param {number} handleIndex - Index of the handle being used
     * @param {number} dx - Delta X from start
     * @param {number} dy - Delta Y from start
     */
    handleResize(block, handleIndex, dx, dy) {
        if (!block || !this.startBlock) {
            return;
        }

        const startLayout = this.startBlock.__layout || this.renderer.getTextBlockLayout(this.startBlock);
        const startRawLines = String(this.startBlock.text || '').split('\n');
        const preservesExplicitLineLayout = startLayout.lines.length === startRawLines.length;
        const textAlign = this.startBlock.textAlign || 'left';
        const startingTextWidth = Math.max(1, Number(startLayout.textWidth) || 0);
        const startingMaxWidth = Number(this.startBlock.maxWidth) > 0
            ? Number(this.startBlock.maxWidth)
            : startingTextWidth;
        const startingFontSize = Math.max(8, Number(this.startBlock.fontSize) || 16);
        const startCenterX = startLayout.outerLeft + (startLayout.outerWidth / 2);
        const startCenterY = startLayout.outerTop + (startLayout.outerHeight / 2);

        let proposedMaxWidth = startingMaxWidth;
        if (textAlign === 'center') {
            proposedMaxWidth = startingMaxWidth + (dx * 2);
        } else if (textAlign === 'right') {
            proposedMaxWidth = startingMaxWidth - dx;
        } else {
            proposedMaxWidth = startingMaxWidth + dx;
        }

        if (handleIndex === 1) {
            proposedMaxWidth += dy * 0.15;
        }

        const nextMaxWidth = Math.max(30, Math.round(proposedMaxWidth));
        const widthScale = nextMaxWidth / Math.max(1, startingMaxWidth);
        const nextFontSize = Math.max(8, Math.round(startingFontSize * widthScale));

        block.fontSize = nextFontSize;

        if (preservesExplicitLineLayout) {
            block.maxWidth = 0;
        } else {
            block.maxWidth = nextMaxWidth;
        }

        const resizedLayout = this.renderer.getTextBlockLayout(block);
        const nextCenterX = resizedLayout.outerLeft + (resizedLayout.outerWidth / 2);
        const nextCenterY = resizedLayout.outerTop + (resizedLayout.outerHeight / 2);

        block.x += startCenterX - nextCenterX;
        block.y += startCenterY - nextCenterY;

        const dimensions = this.renderer.measureTextBlock(block);
        block.width = dimensions.width;
        block.height = dimensions.height;
    }

    /**
     * Handle mouse up event
     * @param {Object} e - Event object
     */
    onMouseUp(e) {
        const shouldStoreUndo = (this.isDragging || this.isResizing)
            && this.interactionStartState
            && this.renderer.hasStateChanged(this.interactionStartState, this.renderer.getState());

        this.renderer.setVerticalCenterGuide(null);

        if (shouldStoreUndo) {
            this.renderer.pushUndoSnapshot(this.interactionStartState);
        }

        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.dragTarget = null;
        this.activeHandle = null;
        this.activeHandleIndex = null;
        this.startBlock = null;
        this.startElement = null;
        this.interactionStartState = null;
        this.canvas.style.cursor = 'default';
        this.flushRender();

        if (this.onChange) {
            this.onChange();
        }
    }

    onKeyDown(e) {
        const isUndoShortcut = (e.metaKey || e.ctrlKey) && !e.shiftKey && String(e.key || '').toLowerCase() === 'z';
        if (isUndoShortcut) {
            const restored = this.renderer.undoLastAction();
            if (!restored) {
                return;
            }

            e.preventDefault();
            this.dragTarget = null;
            this.startElement = null;
            this.startBlock = null;
            this.interactionStartState = null;
            if (this.onChange) {
                this.onChange();
            }
            return;
        }

        if (e.key !== 'Delete' && e.key !== 'Backspace') {
            return;
        }

        const activeElement = document.activeElement;
        const tagName = String(activeElement?.tagName || '').toLowerCase();
        const isEditable = activeElement?.isContentEditable || tagName === 'input' || tagName === 'textarea';
        if (isEditable && activeElement !== this.canvas) {
            return;
        }

        const deleted = this.renderer.deleteSelectedTarget();
        if (!deleted) {
            return;
        }

        e.preventDefault();
        this.dragTarget = null;
        this.startElement = null;
        this.startBlock = null;
        this.interactionStartState = null;
        if (this.onChange) {
            this.onChange();
        }
    }

    getTargetElement(target) {
        if (!target || typeof target.index !== 'number') {
            return null;
        }
        if (target.type !== 'text') {
            return this.renderer.ornaments?.[target.index] || null;
        }
        return null;
    }

    moveDecorationTarget(target, dx, dy) {
        const element = this.getTargetElement(target);
        const start = this.startElement;
        if (!element || !start) return;

        if ([start.x1, start.y1, start.x2, start.y2].some((value) => value !== undefined)) {
            element.x1 = (Number(start.x1) || 0) + dx;
            element.y1 = (Number(start.y1) || 0) + dy;
            element.x2 = (Number(start.x2) || 0) + dx;
            element.y2 = (Number(start.y2) || 0) + dy;
            return;
        }

        if (start.points && typeof start.points === 'string') {
            const translated = start.points
                .trim()
                .split(/\s+/)
                .map((pair) => {
                    const [px, py] = pair.split(',').map((value) => Number(value));
                    if (!Number.isFinite(px) || !Number.isFinite(py)) {
                        return pair;
                    }
                    return `${px + dx},${py + dy}`;
                })
                .join(' ');
            element.points = translated;
        }

        if (start.x !== undefined) {
            element.x = (Number(start.x) || 0) + dx;
        }
        if (start.y !== undefined) {
            element.y = (Number(start.y) || 0) + dy;
        }
        if (start.cx !== undefined) {
            element.cx = (Number(start.cx) || 0) + dx;
        }
        if (start.cy !== undefined) {
            element.cy = (Number(start.cy) || 0) + dy;
        }
    }

    updateVerticalCenterGuide(target) {
        const bounds = this.getTargetBounds(target);
        if (!bounds) {
            this.renderer.setVerticalCenterGuide(null);
            return;
        }

        const elementCenterX = bounds.outerLeft !== undefined
            ? bounds.outerLeft + (bounds.outerWidth / 2)
            : bounds.x + (bounds.width / 2);
        const imageCenterX = this.canvas.width / 2;
        const guideThreshold = 6;

        if (Math.abs(elementCenterX - imageCenterX) <= guideThreshold) {
            this.renderer.setVerticalCenterGuide(imageCenterX);
            return;
        }

        this.renderer.setVerticalCenterGuide(null);
    }

    getTargetBounds(target) {
        if (!target) {
            return null;
        }

        if (target.type === 'text') {
            const block = this.renderer.textBlocks?.[target.index];
            return block ? this.renderer.getTextBlockLayout(block) : null;
        }

        return this.renderer.getDecorationBounds(target);
    }

    /**
     * Set the change callback
     * @param {Function} callback - Function to call on state change
     */
    setOnChange(callback) {
        this.onChange = callback;
    }

    /**
     * Get the current interaction state
     * @returns {Object} Interaction state
     */
    getState() {
        return {
            isDragging: this.isDragging,
            isResizing: this.isResizing,
            isRotating: this.isRotating,
            activeHandle: this.activeHandle,
            activeHandleIndex: this.activeHandleIndex
        };
    }

    /**
     * Reset interaction state
     */
    reset() {
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.renderer.setVerticalCenterGuide(null);
        this.dragTarget = null;
        this.activeHandle = null;
        this.activeHandleIndex = null;
        this.startBlock = null;
        this.startElement = null;
        this.flushRender();
    }
}