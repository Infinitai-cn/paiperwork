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
            this.activeHandle = handle;
            this.activeHandleIndex = handle.index;
            this.startX = coords.x;
            this.startY = coords.y;
            this.startBlock = { ...this.renderer.textBlocks[this.renderer.selectedBlockIndex] };
            this.renderer.setSelectedTarget({ type: 'text', index: this.renderer.selectedBlockIndex });
            this.canvas.style.cursor = handle.cursor;
        } else {
            const target = this.renderer.hitTestAny(coords.x, coords.y);
            if (!target) {
                // Clicked empty space — deselect
                this.renderer.setSelectedTarget(null);
                this.dragTarget = null;
                this.startElement = null;
                this.onChange();
                return;
            }

            this.dragTarget = target;
            this.isDragging = true;
            this.startX = coords.x;
            this.startY = coords.y;
            this.renderer.setSelectedTarget(target);

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
        } else if (this.isResizing) {
            const block = this.renderer.textBlocks[this.renderer.selectedBlockIndex];
            if (!block) return;
            this.handleResize(block, this.activeHandleIndex, dx, dy);
        }

        this.renderer.render();
        this.onChange();
    }

    /**
     * Handle resize operation
     * @param {Object} block - Text block being resized
     * @param {number} handleIndex - Index of the handle being used
     * @param {number} dx - Delta X from start
     * @param {number} dy - Delta Y from start
     */
    handleResize(block, handleIndex, dx, dy) {
        switch (handleIndex) {
            case 0: // right-top (height only)
                block.height -= dy;
                break;
            case 1: // right-bottom (width only)
                block.width += dx;
                break;
        }
        // Enforce minimum size
        block.width = Math.max(30, block.width);
        block.height = Math.max(20, block.height);
    }

    /**
     * Handle mouse up event
     * @param {Object} e - Event object
     */
    onMouseUp(e) {
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.dragTarget = null;
        this.activeHandle = null;
        this.activeHandleIndex = null;
        this.startBlock = null;
        this.startElement = null;
        this.canvas.style.cursor = 'default';
    }

    onKeyDown(e) {
        const isUndoShortcut = (e.metaKey || e.ctrlKey) && !e.shiftKey && String(e.key || '').toLowerCase() === 'z';
        if (isUndoShortcut) {
            const restored = this.renderer.undoLastDeletion();
            if (!restored) {
                return;
            }

            e.preventDefault();
            this.dragTarget = null;
            this.startElement = null;
            this.startBlock = null;
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
        if (this.onChange) {
            this.onChange();
        }
    }

    getTargetElement(target) {
        if (!target || typeof target.index !== 'number') {
            return null;
        }
        if (target.type === 'shape') {
            return this.renderer.shapes?.[target.index] || null;
        }
        if (target.type === 'line') {
            return this.renderer.lines?.[target.index] || null;
        }
        if (target.type === 'ornament') {
            return this.renderer.ornaments?.[target.index] || null;
        }
        return null;
    }

    moveDecorationTarget(target, dx, dy) {
        const element = this.getTargetElement(target);
        const start = this.startElement;
        if (!element || !start) return;

        if (target.type === 'line') {
            element.x1 = (Number(start.x1) || 0) + dx;
            element.y1 = (Number(start.y1) || 0) + dy;
            element.x2 = (Number(start.x2) || 0) + dx;
            element.y2 = (Number(start.y2) || 0) + dy;
            return;
        }

        if (target.type === 'ornament') {
            element.x = (Number(start.x) || 0) + dx;
            element.y = (Number(start.y) || 0) + dy;
            return;
        }

        if (target.type === 'shape') {
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
        this.dragTarget = null;
        this.activeHandle = null;
        this.activeHandleIndex = null;
        this.startBlock = null;
        this.startElement = null;
    }
}