class PdfWorksTab {
	constructor() {
		this.isInitialized = false;
		this.selectedFile = null;
		this.pdfWorksManager = null;
		this.previewOverlay = null;
		this.previewDocument = null;
		this.isPreviewMaximized = false;
		this.previewWindowRestoreState = null;
		this.previewTotalPages = 0;
		this.activePageNumber = null;
		this.selectedPageNumbers = new Set();
		this.transformedBlocksById = new Map();
		this.editableDocumentModel = null;
		this.editableBlocksById = new Map();
		this.infoOverlay = null;
		this.hasExtractableTextInSelectedFile = null;
		this.isTransformRunning = false;
		this.transformAbortController = null;
		this.minimumReadableContrast = 4.5;
	}

	async initialize() {
		if (!this.pdfWorksManager && window.PdfWorks) {
			this.pdfWorksManager = new window.PdfWorks();
			await this.pdfWorksManager.initialize();
		}

		if (!this.isInitialized) {
			this.injectStyles();
			this.isInitialized = true;
		}

		await this.createTabUI();
		this.setupEventListeners();
	}

	async createTabUI() {
		const tabElement = document.getElementById('pdfworks-tab');
		if (!tabElement) {
			console.error('PdfWorksTab: Unable to find pdfworks tab element');
			return;
		}

		tabElement.innerHTML = `
			<div class="pdfworks-container">
				<div class="pdfworks-header">
					<h3>${Lang.get('pdfWorksTitle')}</h3>
				</div>

				<div class="pdfworks-content">
					<div class="pdfworks-upload-zone" id="pdfworks-upload-zone">
						<div class="upload-icon">📄</div>
						<div class="upload-text">
							<p>${Lang.get('pdfWorksDragDrop')}</p>
							<p>${Lang.get('pdfWorksSupportedFormat')}</p>
						</div>
						<input type="file" id="pdfworks-file-input" accept=".pdf,application/pdf" style="display: none;">
						<button id="pdfworks-browse-button" class="browse-button">${Lang.get('browseFiles')}</button>
					</div>

					<div class="pdfworks-reopen-container" id="pdfworks-reopen-container" style="display: none;">
						<button id="pdfworks-reopen-preview-button" class="browse-button pdfworks-reopen-button">${Lang.get('pdfWorksReopenPreviewButton')}</button>
					</div>

					<div class="pdfworks-file-info" id="pdfworks-file-info" style="display: none;">
						<div class="file-details">
							<span id="pdfworks-file-name"></span>
							<button id="pdfworks-remove-file" class="remove-file-btn">
								<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--presentation-remove-file-color, #111);font-size:18px;font-weight:bold;line-height:1;">&times;</span>
							</button>
						</div>
					</div>

					<div class="pdfworks-status" id="pdfworks-status" style="display:none;"></div>
				</div>
			</div>
		`;
	}

	setupEventListeners() {
		const uploadZone = document.getElementById('pdfworks-upload-zone');
		const fileInput = document.getElementById('pdfworks-file-input');
		const browseButton = document.getElementById('pdfworks-browse-button');
		const reopenPreviewButton = document.getElementById('pdfworks-reopen-preview-button');
		const removeFileButton = document.getElementById('pdfworks-remove-file');

		if (!uploadZone || !fileInput || !browseButton || !reopenPreviewButton || !removeFileButton) {
			return;
		}

		uploadZone.addEventListener('dragover', this.handleDragOver.bind(this));
		uploadZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
		uploadZone.addEventListener('drop', this.handleDrop.bind(this));

		browseButton.addEventListener('click', () => fileInput.click());
		reopenPreviewButton.addEventListener('click', this.reopenPreviewWindow.bind(this));
		fileInput.addEventListener('change', this.handleFileSelect.bind(this));
		removeFileButton.addEventListener('click', this.removeFile.bind(this));
	}

	handleDragOver(event) {
		event.preventDefault();
		event.stopPropagation();
		event.currentTarget.classList.add('drag-over');
	}

	handleDragLeave(event) {
		event.preventDefault();
		event.stopPropagation();
		event.currentTarget.classList.remove('drag-over');
	}

	handleDrop(event) {
		event.preventDefault();
		event.stopPropagation();
		event.currentTarget.classList.remove('drag-over');

		const files = event.dataTransfer.files;
		if (files && files.length > 0) {
			this.processFile(files[0]);
		}
	}

	handleFileSelect(event) {
		const files = event.target.files;
		if (files && files.length > 0) {
			this.processFile(files[0]);
		}
	}

	async processFile(file) {
		this.cancelActiveTransform({ showFeedback: false });

		const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
		if (!isPdf) {
			alert(Lang.get('pdfWorksOnlyPdfSupported'));
			return;
		}

		this.transformedBlocksById.clear();
		this.editableDocumentModel = null;
		this.editableBlocksById.clear();
		this.hideInfoOverlay();
		this.selectedFile = file;

		try {
			if (!this.pdfWorksManager && window.PdfWorks) {
				this.pdfWorksManager = new window.PdfWorks();
				await this.pdfWorksManager.initialize();
			}

			if (!this.pdfWorksManager) {
				throw new Error('PDF Works service not available');
			}

			const probeResult = await this.pdfWorksManager.checkExtractableTextAvailability({ file });
			this.hasExtractableTextInSelectedFile = !!probeResult?.hasExtractableText;

			if (!this.hasExtractableTextInSelectedFile) {
				this.showFileInfo(file, { showReopenButton: false });
				this.showStatus(Lang.get('pdfWorksNoExtractableStatus'), 'error');
				this.showNoExtractableTextModal(file.name);
				this.updateTransformButtonState();
				return;
			}

			this.showFileInfo(file, { showReopenButton: true });
			this.updateTransformButtonState();
			await this.openPdfPreviewWindow(file);
		} catch (error) {
			console.error('PdfWorksTab preview error:', error);
			this.showStatus(Lang.get('pdfWorksPreviewFailed', { error: error.message }), 'error');
		}
	}

	showFileInfo(file, options = {}) {
		const showReopenButton = options.showReopenButton !== false;
		const fileInfo = document.getElementById('pdfworks-file-info');
		const fileName = document.getElementById('pdfworks-file-name');
		const uploadZone = document.getElementById('pdfworks-upload-zone');
		const reopenContainer = document.getElementById('pdfworks-reopen-container');

		if (!fileInfo || !fileName || !uploadZone || !reopenContainer) {
			return;
		}

		fileName.textContent = file.name;
		fileInfo.style.display = 'block';
		uploadZone.style.display = 'none';
		reopenContainer.style.display = showReopenButton ? 'block' : 'none';
	}

	removeFile() {
		this.selectedFile = null;
		this.hasExtractableTextInSelectedFile = null;
		this.transformedBlocksById.clear();
		this.editableDocumentModel = null;
		this.editableBlocksById.clear();
		this.hideInfoOverlay();

		const fileInfo = document.getElementById('pdfworks-file-info');
		const uploadZone = document.getElementById('pdfworks-upload-zone');
		const reopenContainer = document.getElementById('pdfworks-reopen-container');
		const fileInput = document.getElementById('pdfworks-file-input');

		if (fileInfo) {
			fileInfo.style.display = 'none';
		}
		if (uploadZone) {
			uploadZone.style.display = 'block';
		}
		if (reopenContainer) {
			reopenContainer.style.display = 'none';
		}
		if (fileInput) {
			fileInput.value = '';
		}

		this.updateTransformButtonState();
		this.hideStatus();
		this.closePdfPreviewWindow();
	}

	async reopenPreviewWindow() {
		if (!this.selectedFile) {
			return;
		}

		if (this.hasExtractableTextInSelectedFile === false) {
			this.showNoExtractableTextModal(this.selectedFile.name);
			return;
		}

		try {
			await this.openPdfPreviewWindow(this.selectedFile);
		} catch (error) {
			console.error('PdfWorksTab reopen preview error:', error);
			this.showStatus(Lang.get('pdfWorksPreviewFailed', { error: error.message }), 'error');
		}
	}

	async openPdfPreviewWindow(file) {
		this.hideInfoOverlay();
		this.closePdfPreviewWindow();
		this.previewTotalPages = 0;
		this.activePageNumber = null;
		this.selectedPageNumbers.clear();

		this.previewOverlay = document.createElement('div');
		this.previewOverlay.className = 'pdfworks-preview-overlay';

		const previewWindow = document.createElement('div');
		previewWindow.className = 'pdfworks-preview-window';

		const header = document.createElement('div');
		header.className = 'pdfworks-preview-header';

		const title = document.createElement('h3');
		title.textContent = Lang.get('pdfWorksPreviewTitle', { fileName: file.name });

		const headerActions = document.createElement('div');
		headerActions.className = 'pdfworks-preview-header-actions';

		const maximizeButton = document.createElement('button');
		maximizeButton.className = 'pdfworks-preview-maximize';
		maximizeButton.innerHTML = '❐';
		maximizeButton.setAttribute('aria-label', Lang.get('pdfWorksRestorePreview'));
		maximizeButton.addEventListener('click', () => this.togglePreviewMaximize(previewWindow, maximizeButton));

		const closeButton = document.createElement('button');
		closeButton.className = 'pdfworks-preview-close';
		closeButton.innerHTML = '&times;';
		closeButton.setAttribute('aria-label', Lang.get('pdfWorksClosePreview'));
		closeButton.addEventListener('click', () => this.closePdfPreviewWindow());

		header.appendChild(title);
		headerActions.appendChild(maximizeButton);
		headerActions.appendChild(closeButton);
		header.appendChild(headerActions);

		const body = document.createElement('div');
		body.className = 'pdfworks-preview-body';

		const controls = document.createElement('div');
		controls.className = 'pdfworks-preview-controls';
		controls.innerHTML = `
			<div class="pdfworks-preview-controls-title">${Lang.get('pdfWorksControlsTitle')}</div>
			<div class="setting-group">
				<label for="pdfworks-preview-scope-selector">${Lang.get('pdfWorksScopeLabel')}</label>
				<select id="pdfworks-preview-scope-selector">
					<option value="selection">${Lang.get('pdfWorksScopeSelection')}</option>
					<option value="page">${Lang.get('pdfWorksScopePage')}</option>
					<option value="document">${Lang.get('pdfWorksScopeDocument')}</option>
				</select>
			</div>
			<div class="pdfworks-scope-help" id="pdfworks-scope-help"></div>
			<div class="setting-group pdfworks-prompt-group">
				<label for="pdfworks-preview-instruction-input">${Lang.get('pdfWorksInstructionLabel')}</label>
				<textarea id="pdfworks-preview-instruction-input" rows="6" placeholder="${Lang.get('pdfWorksInstructionPlaceholder')}"></textarea>
			</div>
			<button id="pdfworks-preview-transform-button" class="generate-button" disabled>${Lang.get('pdfWorksTransformButton')}</button>
			<button id="pdfworks-preview-export-button" class="generate-button pdfworks-export-button" disabled>${Lang.get('pdfWorksExportButton')}</button>
			<div class="pdfworks-status" id="pdfworks-preview-status" style="display:none;"></div>
		`;

		const loading = document.createElement('div');
		loading.className = 'pdfworks-preview-loading';
		loading.textContent = Lang.get('pdfWorksLoadingPreview');

		const pagesContainer = document.createElement('div');
		pagesContainer.className = 'pdfworks-preview-pages';
		pagesContainer.appendChild(loading);

		body.appendChild(controls);
		body.appendChild(pagesContainer);

		previewWindow.appendChild(header);
		previewWindow.appendChild(body);
		previewWindow.classList.add('maximized');
		previewWindow.style.width = '98vw';
		previewWindow.style.height = '96vh';
		this.previewWindowRestoreState = {
			width: 'min(92vw, 1200px)',
			height: 'min(90vh, 900px)'
		};
		this.isPreviewMaximized = true;
		this.previewOverlay.appendChild(previewWindow);
		document.body.appendChild(this.previewOverlay);

		this.previewOverlay.addEventListener('click', event => {
			if (event.target === this.previewOverlay) {
				this.closePdfPreviewWindow();
			}
		});

		const previewInstructionInput = document.getElementById('pdfworks-preview-instruction-input');
		const previewScopeSelector = document.getElementById('pdfworks-preview-scope-selector');
		const previewTransformButton = document.getElementById('pdfworks-preview-transform-button');
		const previewExportButton = document.getElementById('pdfworks-preview-export-button');
		if (previewInstructionInput) {
			previewInstructionInput.addEventListener('input', () => this.updateTransformButtonState());
		}
		if (previewScopeSelector) {
			previewScopeSelector.addEventListener('change', this.handleScopeChange.bind(this));
		}
		if (previewTransformButton) {
			previewTransformButton.addEventListener('click', this.handleTransform.bind(this));
		}
		if (previewExportButton) {
			previewExportButton.addEventListener('click', this.handleExportRebuiltPdf.bind(this));
		}
		this.updateTransformButtonState();
		this.updateExportButtonState();

		if (!window.pdfjsLib || typeof window.pdfjsLib.getDocument !== 'function') {
			loading.textContent = Lang.get('pdfWorksPdfjsUnavailable');
			throw new Error('PDF.js library not available');
		}

		const arrayBuffer = await file.arrayBuffer();
		const loadingTask = window.pdfjsLib.getDocument({
			data: arrayBuffer,
			enableXfa: true
		});
		this.previewDocument = await loadingTask.promise;
		this.previewTotalPages = this.previewDocument.numPages;
		this.activePageNumber = this.previewTotalPages > 0 ? 1 : null;

		await this.ensureEditableDocumentModel(file);

		pagesContainer.innerHTML = '';

		for (let pageNumber = 1; pageNumber <= this.previewDocument.numPages; pageNumber++) {
			const page = await this.previewDocument.getPage(pageNumber);
			const viewport = page.getViewport({ scale: 1.1 });

			const pageContainer = document.createElement('div');
			pageContainer.className = 'pdfworks-preview-page';
			pageContainer.dataset.pageNumber = String(pageNumber);
			pageContainer.addEventListener('click', event => this.handlePageScopeSelection(pageNumber, event));

			const pageLabel = document.createElement('div');
			pageLabel.className = 'pdfworks-preview-page-label';
			pageLabel.textContent = Lang.get('pdfWorksPageLabel', pageNumber);

			const canvas = document.createElement('canvas');
			canvas.width = viewport.width;
			canvas.height = viewport.height;
			canvas.className = 'pdfworks-preview-canvas';

			const canvasFrame = document.createElement('div');
			canvasFrame.className = 'pdfworks-preview-canvas-frame';
			canvasFrame.dataset.pageNumber = String(pageNumber);

			const transformedOverlay = document.createElement('div');
			transformedOverlay.className = 'pdfworks-preview-overlay-layer';
			transformedOverlay.dataset.pageNumber = String(pageNumber);

			await this.renderPageWithoutTextLayer(page, viewport, canvas);

			pageContainer.appendChild(pageLabel);
			canvasFrame.appendChild(canvas);
			canvasFrame.appendChild(transformedOverlay);
			pageContainer.appendChild(canvasFrame);
			pagesContainer.appendChild(pageContainer);
		}

		this.renderAllEditableOverlays();
		this.applyScopeVisualState();
		this.updateScopeHelpText();
		this.updateTransformButtonState();
		this.updateExportButtonState();
	}

	async renderPageWithoutTextLayer(page, viewport, canvas) {
		const context = canvas.getContext('2d');
		if (!context) {
			throw new Error('Unable to get preview canvas context');
		}

		const noTextContext = this.createNoTextCanvasContext(context);
		await page.render({
			canvasContext: noTextContext,
			viewport
		}).promise;
	}

	createNoTextCanvasContext(canvasContext) {
		return new Proxy(canvasContext, {
			get(target, property) {
				if (property === 'fillText' || property === 'strokeText') {
					return () => {};
				}

				const value = target[property];
				if (typeof value === 'function') {
					return value.bind(target);
				}

				return value;
			},
			set(target, property, value) {
				target[property] = value;
				return true;
			}
		});
	}

	async ensureEditableDocumentModel(file) {
		if (!this.pdfWorksManager && window.PdfWorks) {
			this.pdfWorksManager = new window.PdfWorks();
			await this.pdfWorksManager.initialize();
		}

		if (!this.pdfWorksManager) {
			throw new Error('PDF Works service not available');
		}

		this.editableDocumentModel = await this.pdfWorksManager.buildEditableDocument({
			file,
			previewDocument: this.previewDocument,
			renderScale: 1.1
		});

		this.rebuildEditableBlockIndex();
	}

	rebuildEditableBlockIndex() {
		this.editableBlocksById.clear();
		if (!this.editableDocumentModel || !Array.isArray(this.editableDocumentModel.pages)) {
			return;
		}

		this.editableDocumentModel.pages.forEach(page => {
			(page.textBlocks || []).forEach(block => {
				this.editableBlocksById.set(block.blockId, block);
			});
		});
	}

	renderAllEditableOverlays() {
		if (!this.previewOverlay) {
			return;
		}

		const overlayNodes = this.previewOverlay.querySelectorAll('.pdfworks-preview-overlay-layer');
		overlayNodes.forEach(node => {
			const pageNumber = Number(node.dataset.pageNumber || 0);
			this.renderEditableOverlayForPage(pageNumber);
		});
	}

	renderEditableOverlayForPage(pageNumber) {
		if (!this.previewOverlay || !pageNumber) {
			return;
		}

		const overlayNode = this.previewOverlay.querySelector(`.pdfworks-preview-overlay-layer[data-page-number="${pageNumber}"]`);
		if (!overlayNode) {
			return;
		}

		if (!this.editableDocumentModel || !Array.isArray(this.editableDocumentModel.pages)) {
			overlayNode.innerHTML = '';
			return;
		}

		const pageData = this.editableDocumentModel.pages.find(page => page.pageNumber === pageNumber);
		const pageBlocks = (pageData?.textBlocks || []).slice().sort((left, right) => left.blockId.localeCompare(right.blockId));

		if (pageBlocks.length === 0) {
			overlayNode.innerHTML = '';
			return;
		}

		overlayNode.innerHTML = '';

		pageBlocks.forEach(block => {
			const textBlockElement = document.createElement('div');
			textBlockElement.className = 'pdfworks-editable-text-block';
			textBlockElement.dataset.blockId = block.blockId;
			textBlockElement.dataset.pageNumber = String(pageNumber);
			const contrastStyle = this.resolveReadableTextStyle(block, pageNumber);
			textBlockElement.contentEditable = 'true';
			textBlockElement.style.left = `${Math.max(0, block.left || 0)}px`;
			textBlockElement.style.top = `${Math.max(0, block.top || 0)}px`;
			textBlockElement.style.width = `${Math.max(24, block.width || 24)}px`;
			textBlockElement.style.minHeight = `${Math.max(18, block.height || 18)}px`;
			textBlockElement.style.fontSize = `${Math.max(10, block.fontSize || 10)}px`;
			textBlockElement.style.lineHeight = `${Math.max(12, block.lineHeight || 12)}px`;
			textBlockElement.style.fontFamily = block.fontFamily || 'Arial';
			textBlockElement.style.fontWeight = block.fontWeight || '400';
			textBlockElement.style.fontStyle = block.fontStyle || 'normal';
			textBlockElement.style.color = contrastStyle.textColor;
			textBlockElement.style.caretColor = contrastStyle.textColor;
			textBlockElement.style.textShadow = contrastStyle.textShadow;
			textBlockElement.textContent = block.transformedText || block.originalText || '';

			textBlockElement.addEventListener('mousedown', event => event.stopPropagation());
			textBlockElement.addEventListener('click', event => {
				event.stopPropagation();
				this.handlePageScopeSelection(pageNumber, event);
			});
			textBlockElement.addEventListener('input', () => {
				const normalizedText = textBlockElement.innerText.replace(/\s+/g, ' ').trim();
				block.transformedText = normalizedText;
				this.transformedBlocksById.set(block.blockId, {
					blockId: block.blockId,
					pageNumber,
					transformedText: normalizedText
				});
			});

			overlayNode.appendChild(textBlockElement);
		});
	}

	applyTransformReplacements(replacements) {
		if (!Array.isArray(replacements) || replacements.length === 0) {
			return 0;
		}

		let appliedCount = 0;
		replacements.forEach(replacement => {
			if (!replacement || typeof replacement !== 'object') {
				return;
			}

			const { blockId, pageNumber, transformedText } = replacement;
			if (typeof blockId !== 'string' || !Number.isInteger(pageNumber) || typeof transformedText !== 'string') {
				return;
			}

			const editableBlock = this.editableBlocksById.get(blockId);
			if (editableBlock) {
				editableBlock.transformedText = transformedText;
			}

			this.transformedBlocksById.set(blockId, {
				blockId,
				pageNumber,
				transformedText
			});
			appliedCount += 1;
		});

		this.renderAllEditableOverlays();
		this.updateExportButtonState();
		return appliedCount;
	}

	updateExportButtonState() {
		const exportButton = document.getElementById('pdfworks-preview-export-button');
		if (!exportButton) {
			return;
		}

		const hasFile = !!this.selectedFile;
		const hasModelPages = !!(this.editableDocumentModel && Array.isArray(this.editableDocumentModel.pages) && this.editableDocumentModel.pages.length > 0);
		exportButton.disabled = !(hasFile && hasModelPages);
	}

	async handleExportRebuiltPdf() {
		const exportButton = document.getElementById('pdfworks-preview-export-button');
		if (!exportButton) {
			return;
		}

		const JsPdfClass = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
		if (!JsPdfClass) {
			this.showStatus(Lang.get('pdfWorksExportFailed', { error: 'jsPDF not available' }), 'error');
			return;
		}

		if (!this.editableDocumentModel || !Array.isArray(this.editableDocumentModel.pages) || this.editableDocumentModel.pages.length === 0) {
			this.showStatus(Lang.get('pdfWorksExportFailed', { error: 'editable model is not ready' }), 'error');
			return;
		}

		exportButton.disabled = true;
		exportButton.textContent = Lang.get('pdfWorksExportingButton');
		this.showStatus(Lang.get('pdfWorksExportingStatus'), 'info');

		try {
			const pageFrames = Array.from(this.previewOverlay?.querySelectorAll('.pdfworks-preview-canvas-frame') || []);
			const pageFrameByNumber = new Map();
			pageFrames.forEach(frame => {
				const pageNumber = Number(frame.dataset.pageNumber || 0);
				if (pageNumber > 0) {
					pageFrameByNumber.set(pageNumber, frame);
				}
			});

			let pdfInstance = null;
			const pages = this.editableDocumentModel.pages.slice().sort((left, right) => left.pageNumber - right.pageNumber);

			for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
				const page = pages[pageIndex];
				const pageFrame = pageFrameByNumber.get(page.pageNumber);
				const sourceCanvas = pageFrame ? pageFrame.querySelector('.pdfworks-preview-canvas') : null;

				if (!sourceCanvas) {
					continue;
				}

				const mergedCanvas = document.createElement('canvas');
				mergedCanvas.width = sourceCanvas.width;
				mergedCanvas.height = sourceCanvas.height;
				const mergedContext = mergedCanvas.getContext('2d');

				mergedContext.drawImage(sourceCanvas, 0, 0);
				this.drawEditableBlocksToCanvas(mergedContext, page);

				const pageWidth = mergedCanvas.width;
				const pageHeight = mergedCanvas.height;
				const orientation = pageWidth >= pageHeight ? 'l' : 'p';
				const pageImageData = mergedCanvas.toDataURL('image/jpeg', 0.94);

				if (!pdfInstance) {
					pdfInstance = new JsPdfClass({
						orientation,
						unit: 'px',
						format: [pageWidth, pageHeight]
					});
				} else {
					pdfInstance.addPage([pageWidth, pageHeight], orientation);
				}

				pdfInstance.addImage(pageImageData, 'JPEG', 0, 0, pageWidth, pageHeight);
			}

			if (!pdfInstance) {
				throw new Error('No pages available for export');
			}

			const sourceName = (this.selectedFile?.name || 'pdfworks-document').replace(/\.pdf$/i, '');
			pdfInstance.save(`${sourceName}-rebuilt.pdf`);

			this.showStatus(Lang.get('pdfWorksExportDone'), 'success');
			exportButton.textContent = Lang.get('pdfWorksExportDoneButton');
		} catch (error) {
			console.error('PdfWorksTab export error:', error);
			this.showStatus(Lang.get('pdfWorksExportFailed', { error: error.message }), 'error');
			exportButton.textContent = Lang.get('pdfWorksRetryButton');
		} finally {
			setTimeout(() => {
				exportButton.textContent = Lang.get('pdfWorksExportButton');
				this.updateExportButtonState();
			}, 1000);
		}
	}

	drawEditableBlocksToCanvas(context, page) {
		const blocks = Array.isArray(page?.textBlocks) ? page.textBlocks : [];
		blocks.forEach(block => {
			const text = (block.transformedText || block.originalText || '').trim();
			if (!text) {
				return;
			}

			const contrastStyle = this.resolveReadableTextStyle(block, page?.pageNumber);

			const left = Math.max(0, Number(block.left || 0));
			const top = Math.max(0, Number(block.top || 0));
			const width = Math.max(24, Number(block.width || 24));
			const height = Math.max(16, Number(block.height || 16));
			const fontSize = Math.max(9, Number(block.fontSize || 11));
			const lineHeight = Math.max(fontSize * 1.15, Number(block.lineHeight || fontSize * 1.15));
			const fontWeight = (block.fontWeight || '400').toString();
			const fontStyle = (block.fontStyle || 'normal').toString();
			const fontFamily = (block.fontFamily || 'Arial').toString();
			const fontColor = contrastStyle.textColor;

			context.save();
			context.fillStyle = fontColor;
			context.strokeStyle = contrastStyle.outlineColor;
			context.lineWidth = Math.max(0.9, fontSize * 0.09);
			context.lineJoin = 'round';
			context.miterLimit = 2;
			context.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}, Arial, Helvetica, sans-serif`;
			context.textBaseline = 'top';
			const measuredMetrics = context.measureText('Mg');
			const measuredGlyphHeight = Math.max(
				fontSize,
				Number(measuredMetrics.actualBoundingBoxAscent || 0) + Number(measuredMetrics.actualBoundingBoxDescent || 0)
			);
			const effectiveLineHeight = Math.max(lineHeight, measuredGlyphHeight + 2, fontSize * 1.22);

			const textLines = this.wrapTextToWidth(context, text, Math.max(16, width - 2));
			let y = top + 1;
			const pageBottomLimit = context.canvas ? context.canvas.height - 1 : Number.POSITIVE_INFINITY;
			for (const textLine of textLines) {
				if (y >= pageBottomLimit) {
					break;
				}
				context.strokeText(textLine, left + 2, y);
				context.fillText(textLine, left + 2, y);
				y += effectiveLineHeight;
			}
			context.restore();
		});
	}

	resolveReadableTextStyle(block, pageNumber) {
		const fallbackDark = { red: 17, green: 17, blue: 17 };
		const fallbackLight = { red: 255, green: 255, blue: 255 };
		const requestedColor = this.parseCssColorToRgb(block?.color) || fallbackDark;
		const sampledBackground = this.sampleBackgroundColorForBlock(pageNumber, block);

		if (!sampledBackground) {
			const textColor = this.rgbToCssColor(requestedColor);
			const outlineColor = this.rgbToCssColor(this.pickOutlineColorForText(requestedColor));
			return {
				textColor,
				outlineColor,
				textShadow: this.buildTextShadowCss(this.pickOutlineColorForText(requestedColor))
			};
		}

		const requestedContrast = this.getContrastRatio(requestedColor, sampledBackground);
		const darkContrast = this.getContrastRatio(fallbackDark, sampledBackground);
		const lightContrast = this.getContrastRatio(fallbackLight, sampledBackground);

		let finalRgb = requestedColor;
		if (requestedContrast < this.minimumReadableContrast) {
			finalRgb = darkContrast >= lightContrast ? fallbackDark : fallbackLight;
		}

		const outlineRgb = this.pickOutlineColorForText(finalRgb);
		return {
			textColor: this.rgbToCssColor(finalRgb),
			outlineColor: this.rgbToCssColor(outlineRgb),
			textShadow: this.buildTextShadowCss(outlineRgb)
		};
	}

	pickOutlineColorForText(textRgb) {
		const textLuminance = this.getRelativeLuminance(textRgb);
		return textLuminance > 0.4
			? { red: 0, green: 0, blue: 0 }
			: { red: 255, green: 255, blue: 255 };
	}

	buildTextShadowCss(outlineRgb) {
		const red = this.clampColorByte(outlineRgb?.red);
		const green = this.clampColorByte(outlineRgb?.green);
		const blue = this.clampColorByte(outlineRgb?.blue);
		return `0 0 1px rgba(${red}, ${green}, ${blue}, 0.9), 0 0 2px rgba(${red}, ${green}, ${blue}, 0.55)`;
	}

	sampleBackgroundColorForBlock(pageNumber, block) {
		if (!pageNumber || !this.previewOverlay || !block) {
			return null;
		}

		const pageFrame = this.previewOverlay.querySelector(`.pdfworks-preview-canvas-frame[data-page-number="${pageNumber}"]`);
		const sourceCanvas = pageFrame ? pageFrame.querySelector('.pdfworks-preview-canvas') : null;
		if (!sourceCanvas) {
			return null;
		}

		const sourceContext = sourceCanvas.getContext('2d');
		if (!sourceContext) {
			return null;
		}

		const sampleLeft = Math.max(0, Math.floor(Number(block.left || 0) + 1));
		const sampleTop = Math.max(0, Math.floor(Number(block.top || 0) + 1));
		const maxSampleWidth = Math.max(2, Math.floor(Number(block.width || 24) - 2));
		const maxSampleHeight = Math.max(2, Math.floor(Number(block.height || 18) - 2));
		const sampleWidth = Math.max(1, Math.min(maxSampleWidth, sourceCanvas.width - sampleLeft));
		const sampleHeight = Math.max(1, Math.min(maxSampleHeight, sourceCanvas.height - sampleTop));

		if (sampleWidth <= 0 || sampleHeight <= 0) {
			return null;
		}

		try {
			const imageData = sourceContext.getImageData(sampleLeft, sampleTop, sampleWidth, sampleHeight).data;
			let redSum = 0;
			let greenSum = 0;
			let blueSum = 0;
			let alphaWeight = 0;

			for (let offset = 0; offset < imageData.length; offset += 4) {
				const alpha = Number(imageData[offset + 3] || 0) / 255;
				if (alpha <= 0) {
					continue;
				}
				redSum += Number(imageData[offset] || 0) * alpha;
				greenSum += Number(imageData[offset + 1] || 0) * alpha;
				blueSum += Number(imageData[offset + 2] || 0) * alpha;
				alphaWeight += alpha;
			}

			if (alphaWeight <= 0) {
				return null;
			}

			return {
				red: this.clampColorByte(redSum / alphaWeight),
				green: this.clampColorByte(greenSum / alphaWeight),
				blue: this.clampColorByte(blueSum / alphaWeight)
			};
		} catch (error) {
			return null;
		}
	}

	parseCssColorToRgb(value) {
		if (typeof value !== 'string') {
			return null;
		}

		const normalized = value.trim().toLowerCase();
		if (!normalized) {
			return null;
		}

		const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
		if (hexMatch) {
			const hex = hexMatch[1];
			if (hex.length === 3) {
				return {
					red: parseInt(`${hex[0]}${hex[0]}`, 16),
					green: parseInt(`${hex[1]}${hex[1]}`, 16),
					blue: parseInt(`${hex[2]}${hex[2]}`, 16)
				};
			}

			return {
				red: parseInt(hex.slice(0, 2), 16),
				green: parseInt(hex.slice(2, 4), 16),
				blue: parseInt(hex.slice(4, 6), 16)
			};
		}

		const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/);
		if (rgbMatch) {
			const parts = rgbMatch[1].split(',').map(part => Number(part.trim()));
			if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) {
				return {
					red: this.clampColorByte(parts[0]),
					green: this.clampColorByte(parts[1]),
					blue: this.clampColorByte(parts[2])
				};
			}
		}

		return null;
	}

	clampColorByte(value) {
		if (!Number.isFinite(value)) {
			return 0;
		}
		return Math.max(0, Math.min(255, Math.round(value)));
	}

	rgbToCssColor(rgb) {
		const red = this.clampColorByte(rgb?.red);
		const green = this.clampColorByte(rgb?.green);
		const blue = this.clampColorByte(rgb?.blue);
		return `rgb(${red}, ${green}, ${blue})`;
	}

	getRelativeLuminance(rgb) {
		const channelToLinear = channel => {
			const normalized = this.clampColorByte(channel) / 255;
			return normalized <= 0.03928
				? normalized / 12.92
				: Math.pow((normalized + 0.055) / 1.055, 2.4);
		};

		const red = channelToLinear(rgb?.red);
		const green = channelToLinear(rgb?.green);
		const blue = channelToLinear(rgb?.blue);
		return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
	}

	getContrastRatio(leftRgb, rightRgb) {
		const leftLum = this.getRelativeLuminance(leftRgb);
		const rightLum = this.getRelativeLuminance(rightRgb);
		const lighter = Math.max(leftLum, rightLum);
		const darker = Math.min(leftLum, rightLum);
		return (lighter + 0.05) / (darker + 0.05);
	}

	wrapTextToWidth(context, text, maxWidth) {
		if (!text) {
			return [];
		}

		const safeMaxWidth = Math.max(16, Number(maxWidth) || 16);
		const wrapTolerance = Math.max(1.5, Math.min(8, safeMaxWidth * 0.02));
		const paragraphCandidates = String(text)
			.replace(/\r\n?/g, '\n')
			.split('\n');

		const lines = [];
		paragraphCandidates.forEach((paragraph, paragraphIndex) => {
			const normalizedParagraph = paragraph.replace(/\s+/g, ' ').trim();
			if (!normalizedParagraph) {
				if (paragraphIndex < paragraphCandidates.length - 1) {
					lines.push('');
				}
				return;
			}

			const words = normalizedParagraph.split(' ');
			let currentLine = '';

			for (const word of words) {
				const testLine = currentLine ? `${currentLine} ${word}` : word;
				if (context.measureText(testLine).width <= safeMaxWidth + wrapTolerance || !currentLine) {
					currentLine = testLine;
				} else {
					lines.push(currentLine);
					currentLine = word;
				}
			}

			if (currentLine) {
				lines.push(currentLine);
			}

			this.rebalanceOrphanLastWord(lines, safeMaxWidth, wrapTolerance, context);

			if (paragraphIndex < paragraphCandidates.length - 1) {
				lines.push('');
			}
		});

		return lines;
	}

	rebalanceOrphanLastWord(lines, maxWidth, tolerance, context) {
		if (!Array.isArray(lines) || lines.length < 2) {
			return;
		}

		let lastIndex = lines.length - 1;
		while (lastIndex >= 0 && !lines[lastIndex]) {
			lastIndex -= 1;
		}
		if (lastIndex <= 0) {
			return;
		}

		const lastLine = String(lines[lastIndex] || '').trim();
		if (!lastLine || lastLine.includes(' ')) {
			return;
		}

		let previousIndex = lastIndex - 1;
		while (previousIndex >= 0 && !lines[previousIndex]) {
			previousIndex -= 1;
		}
		if (previousIndex < 0) {
			return;
		}

		const previousLine = String(lines[previousIndex] || '').trim();
		if (!previousLine) {
			return;
		}

		const mergedLine = `${previousLine} ${lastLine}`;
		if (context.measureText(mergedLine).width <= maxWidth + tolerance) {
			lines[previousIndex] = mergedLine;
			lines.splice(lastIndex, 1);
		}
	}

	escapeHtml(value) {
		if (typeof value !== 'string') {
			return '';
		}

		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	closePdfPreviewWindow() {
		this.cancelActiveTransform({ showFeedback: false });

		if (this.previewDocument && typeof this.previewDocument.destroy === 'function') {
			try {
				this.previewDocument.destroy();
			} catch (error) {
				console.warn('PdfWorksTab: error closing preview document', error);
			}
		}

		this.previewDocument = null;
		this.editableDocumentModel = null;
		this.editableBlocksById.clear();

		if (this.previewOverlay && this.previewOverlay.parentNode) {
			this.previewOverlay.parentNode.removeChild(this.previewOverlay);
		}

		this.previewOverlay = null;
		this.isPreviewMaximized = false;
		this.previewWindowRestoreState = null;
		this.previewTotalPages = 0;
		this.activePageNumber = null;
		this.selectedPageNumbers.clear();
	}

	showNoExtractableTextModal(fileName) {
		this.hideInfoOverlay();

		const overlay = document.createElement('div');
		overlay.className = 'pdfworks-info-overlay';

		const modal = document.createElement('div');
		modal.className = 'pdfworks-info-modal';
		modal.innerHTML = `
			<div class="pdfworks-info-title">${this.escapeHtml(Lang.get('pdfWorksNoExtractableTitle'))}</div>
			<div class="pdfworks-info-message">${this.escapeHtml(Lang.get('pdfWorksNoExtractableMessage', { fileName }))}</div>
			<div class="pdfworks-info-actions">
				<button class="browse-button pdfworks-info-close-btn">${this.escapeHtml(Lang.get('pdfWorksNoExtractableCloseButton'))}</button>
			</div>
		`;

		overlay.addEventListener('click', event => {
			if (event.target === overlay) {
				this.hideInfoOverlay();
			}
		});

		const closeButton = modal.querySelector('.pdfworks-info-close-btn');
		if (closeButton) {
			closeButton.addEventListener('click', () => this.hideInfoOverlay());
		}

		overlay.appendChild(modal);
		document.body.appendChild(overlay);
		this.infoOverlay = overlay;
	}

	hideInfoOverlay() {
		if (this.infoOverlay && this.infoOverlay.parentNode) {
			this.infoOverlay.parentNode.removeChild(this.infoOverlay);
		}
		this.infoOverlay = null;
	}

	handleScopeChange() {
		const scope = this.getCurrentScope();

		if (scope === 'page' && !this.activePageNumber && this.previewTotalPages > 0) {
			this.activePageNumber = 1;
		}

		if (scope === 'document') {
			this.selectedPageNumbers.clear();
		}

		this.applyScopeVisualState();
		this.updateScopeHelpText();
		this.updateTransformButtonState();
	}

	handlePageScopeSelection(pageNumber, event = null) {
		const scope = this.getCurrentScope();

		if (scope === 'document') {
			return;
		}

		if (scope === 'page') {
			this.activePageNumber = pageNumber;
			this.selectedPageNumbers.clear();
			this.selectedPageNumbers.add(pageNumber);
		} else {
			const additiveSelection = !!(event && (event.metaKey || event.ctrlKey || event.shiftKey));

			if (!additiveSelection) {
				this.selectedPageNumbers.clear();
				this.selectedPageNumbers.add(pageNumber);
			} else {
				if (this.selectedPageNumbers.has(pageNumber)) {
					this.selectedPageNumbers.delete(pageNumber);
				} else {
					this.selectedPageNumbers.add(pageNumber);
				}
			}
		}

		this.applyScopeVisualState();
		this.updateTransformButtonState();
	}

	applyScopeVisualState() {
		if (!this.previewOverlay) {
			return;
		}

		const scope = this.getCurrentScope();
		const pageCards = this.previewOverlay.querySelectorAll('.pdfworks-preview-page');

		pageCards.forEach(card => {
			const pageNumber = Number(card.dataset.pageNumber || 0);
			card.classList.remove('scope-page-active', 'scope-selection-active', 'scope-document-active');

			if (scope === 'document') {
				card.classList.add('scope-document-active');
				return;
			}

			if (scope === 'page') {
				if (pageNumber === this.activePageNumber) {
					card.classList.add('scope-page-active');
				}
				return;
			}

			if (scope === 'selection' && this.selectedPageNumbers.has(pageNumber)) {
				card.classList.add('scope-selection-active');
			}
		});
	}

	updateScopeHelpText() {
		const help = document.getElementById('pdfworks-scope-help');
		if (!help) {
			return;
		}

		const scope = this.getCurrentScope();
		if (scope === 'document') {
			help.textContent = Lang.get('pdfWorksScopeHintDocument');
		} else if (scope === 'page') {
			help.textContent = Lang.get('pdfWorksScopeHintPage');
		} else {
			help.textContent = Lang.get('pdfWorksScopeHintSelection');
		}
	}

	getCurrentScope() {
		const scopeSelector = document.getElementById('pdfworks-preview-scope-selector');
		return scopeSelector ? scopeSelector.value : 'document';
	}

	getScopeTarget(scope) {
		if (scope === 'document') {
			return {
				type: 'document',
				pageNumbers: Array.from({ length: this.previewTotalPages }, (_, index) => index + 1)
			};
		}

		if (scope === 'page') {
			if (!this.activePageNumber) {
				return null;
			}
			return {
				type: 'page',
				pageNumber: this.activePageNumber,
				pageNumbers: [this.activePageNumber]
			};
		}

		const selectedPages = Array.from(this.selectedPageNumbers).sort((left, right) => left - right);
		if (selectedPages.length === 0) {
			return null;
		}

		return {
			type: 'selection',
			pageNumbers: selectedPages
		};
	}

	togglePreviewMaximize(previewWindow, maximizeButton) {
		if (!previewWindow || !maximizeButton) {
			return;
		}

		if (!this.isPreviewMaximized) {
			this.previewWindowRestoreState = {
				width: previewWindow.style.width || `${previewWindow.offsetWidth}px`,
				height: previewWindow.style.height || `${previewWindow.offsetHeight}px`
			};

			previewWindow.classList.add('maximized');
			previewWindow.style.width = '98vw';
			previewWindow.style.height = '96vh';
			maximizeButton.innerHTML = '❐';
			maximizeButton.setAttribute('aria-label', Lang.get('pdfWorksRestorePreview'));
			this.isPreviewMaximized = true;
			return;
		}

		previewWindow.classList.remove('maximized');
		if (this.previewWindowRestoreState) {
			previewWindow.style.width = this.previewWindowRestoreState.width;
			previewWindow.style.height = this.previewWindowRestoreState.height;
		}
		maximizeButton.innerHTML = '▢';
		maximizeButton.setAttribute('aria-label', Lang.get('pdfWorksMaximizePreview'));
		this.isPreviewMaximized = false;
	}

	updateTransformButtonState() {
		const instructionInput = document.getElementById('pdfworks-preview-instruction-input');
		const transformButton = document.getElementById('pdfworks-preview-transform-button');

		if (!instructionInput || !transformButton) {
			return;
		}

		if (this.isTransformRunning) {
			transformButton.disabled = false;
			transformButton.textContent = Lang.get('cancel');
			return;
		}

		const hasFile = !!this.selectedFile;
		const hasInstruction = instructionInput.value.trim().length > 0;
		const scope = this.getCurrentScope();
		const hasScopeTarget = !!this.getScopeTarget(scope);
		transformButton.disabled = !hasFile || !hasInstruction || !hasScopeTarget;
		transformButton.textContent = Lang.get('pdfWorksTransformButton');
	}

	async handleTransform() {
		const transformButton = document.getElementById('pdfworks-preview-transform-button');
		const instructionInput = document.getElementById('pdfworks-preview-instruction-input');
		const scopeSelector = document.getElementById('pdfworks-preview-scope-selector');

		if (!transformButton || !instructionInput || !scopeSelector || !this.selectedFile) {
			return;
		}

		if (this.isTransformRunning) {
			this.cancelActiveTransform({ showFeedback: true });
			return;
		}

		const scope = scopeSelector.value;
		const instruction = instructionInput.value.trim();
		const scopeTarget = this.getScopeTarget(scope);

		console.group('[PdfWorksTab] Transform request');
		console.log('scope:', scope);
		console.log('scopeTarget:', scopeTarget);
		console.log('activePageNumber:', this.activePageNumber);
		console.log('selectedPageNumbers:', Array.from(this.selectedPageNumbers).sort((left, right) => left - right));
		console.log('instructionLength:', instruction.length);
		console.groupEnd();

		if (!scopeTarget) {
			if (scope === 'selection') {
				this.showStatus(Lang.get('pdfWorksSelectionRequired'), 'error');
			} else if (scope === 'page') {
				this.showStatus(Lang.get('pdfWorksPageRequired'), 'error');
			}
			this.updateTransformButtonState();
			return;
		}

		this.isTransformRunning = true;
		this.transformAbortController = new AbortController();
		this.updateTransformButtonState();
		this.showStatus(Lang.get('pdfWorksRunningTransformScope', { scope: scopeTarget.type }), 'info');

		try {
			if (!this.pdfWorksManager && window.PdfWorks) {
				this.pdfWorksManager = new window.PdfWorks();
				await this.pdfWorksManager.initialize();
			}

			if (!this.pdfWorksManager) {
				throw new Error('PDF Works service not available');
			}

			const transformResult = await this.pdfWorksManager.runTransform({
				file: this.selectedFile,
				instruction,
				scope,
				scopeTarget,
				previewDocument: this.previewDocument,
				editableDocument: this.editableDocumentModel,
				abortSignal: this.transformAbortController ? this.transformAbortController.signal : null
			});

			const appliedCount = this.applyTransformReplacements(transformResult?.replacements || []);

			this.showStatus(Lang.get('pdfWorksTransformDoneCount', { count: appliedCount }), 'success');
		} catch (error) {
			if (error && error.name === 'AbortError') {
				this.showStatus(Lang.get('generationCancelled'), 'info');
			} else {
				console.error('PdfWorksTab transform error:', error);
				this.showStatus(Lang.get('pdfWorksTransformFailed', { error: error.message }), 'error');
			}
		} finally {
			this.isTransformRunning = false;
			this.transformAbortController = null;
			this.updateTransformButtonState();
		}
	}

	cancelActiveTransform({ showFeedback = false } = {}) {
		if (!this.isTransformRunning && !this.transformAbortController) {
			return;
		}

		try {
			if (this.transformAbortController) {
				this.transformAbortController.abort();
			}
		} catch (_error) {
			// Ignore abort edge cases
		}

		this.isTransformRunning = false;
		this.transformAbortController = null;
		if (showFeedback) {
			this.showStatus(Lang.get('generationCancelled'), 'info');
		}
		this.updateTransformButtonState();
	}

	showStatus(message, type = 'info') {
		const statusElement = document.getElementById('pdfworks-preview-status') || document.getElementById('pdfworks-status');
		if (!statusElement) {
			return;
		}

		statusElement.textContent = message;
		statusElement.className = `pdfworks-status ${type}`;
		statusElement.style.display = 'block';
	}

	hideStatus() {
		const statusElement = document.getElementById('pdfworks-preview-status') || document.getElementById('pdfworks-status');
		if (!statusElement) {
			return;
		}
		statusElement.style.display = 'none';
	}

	async handleTabChange(isActive) {
		if (isActive) {
			await this.initialize();
		}
	}

	injectStyles() {
		if (document.getElementById('pdfworks-tab-styles')) {
			return;
		}

		const style = document.createElement('style');
		style.id = 'pdfworks-tab-styles';
		style.textContent = `
			.pdfworks-container {
				width: 380px;
				padding: 0;
				margin: 0;
				background: var(--background-color);
				color: var(--text-color);
				box-sizing: border-box;
				height: 100%;
				overflow-y: auto;
			}

			.pdfworks-header {
				margin: 10px 10px 20px 10px;
				text-align: center;
			}

			.pdfworks-header h3 {
				margin: 0;
				font-size: 18px;
				font-weight: 600;
				color: var(--text-color);
			}

			.pdfworks-content {
				padding: 0 10px 10px 10px;
				display: flex;
				flex-direction: column;
				gap: 20px;
			}

			.pdfworks-upload-zone {
				border: 2px dashed var(--border-color);
				border-radius: 8px;
				padding: 25px 15px;
				text-align: center;
				background: var(--panel-background);
				transition: all 0.3s ease;
				cursor: pointer;
				position: relative;
				width: 100%;
				box-sizing: border-box;
			}

			.pdfworks-upload-zone:hover {
				border-color: var(--accent-color);
				background: var(--hover-background);
			}

			.pdfworks-upload-zone.drag-over {
				border-color: var(--accent-color);
				background: var(--hover-background);
				transform: scale(1.02);
			}

			.upload-icon {
				font-size: 48px;
				margin-bottom: 15px;
				opacity: 0.6;
			}

			.upload-text p {
				margin: 5px 0;
				color: var(--text-color);
			}

			.upload-text p:first-child {
				font-weight: 500;
				font-size: 16px;
			}

			.upload-text p:last-child {
				font-size: 14px;
				opacity: 0.7;
			}

			.browse-button {
				margin-top: 15px;
				padding: 8px 20px;
				background: var(--accent-color);
				color: var(--presentation-browse-color, #ffffff);
				border: none;
				border-radius: 4px;
				cursor: pointer;
				font-size: 14px;
				transition: background 0.3s ease, color 0.2s ease, border-color 0.2s ease;
			}

			.browse-button:hover {
				background: var(--presentation-browse-hover-bg, #10b981);
				color: #ffffff;
				border: 1px solid var(--presentation-browse-hover-border, transparent);
			}

			.pdfworks-reopen-container {
				margin-top: -8px;
			}

			.pdfworks-reopen-button {
				width: 100%;
			}

			.pdfworks-file-info {
				background: var(--panel-background);
				border: 1px solid var(--border-color);
				border-radius: 6px;
				padding: 12px;
				display: flex;
				align-items: center;
				justify-content: space-between;
				width: 100%;
				box-sizing: border-box;
			}

			.file-details {
				display: flex;
				align-items: center;
				justify-content: space-between;
				width: 100%;
				gap: 10px;
			}

			.file-details span {
				font-weight: 500;
				color: var(--text-color);
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				max-width: 280px;
				flex: 1;
				min-width: 0;
			}

			.remove-file-btn {
				background: var(--error-color);
				color: white;
				border: none;
				border-radius: 50%;
				width: 24px;
				height: 24px;
				cursor: pointer;
				font-size: 16px;
				line-height: 1;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-left: 10px;
				flex-shrink: 0;
			}

			.remove-file-btn:hover {
				background: var(--error-hover);
			}

			.pdfworks-settings {
				background: var(--panel-background);
				border: 1px solid var(--border-color);
				border-radius: 6px;
				padding: 12px;
				width: 100%;
				box-sizing: border-box;
			}

			.pdfworks-settings .setting-group {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 10px;
				margin-bottom: 12px;
			}

			.pdfworks-settings .setting-group:last-child {
				margin-bottom: 0;
			}

			.pdfworks-settings .setting-group label {
				font-weight: 500;
				color: var(--text-color);
				flex: 1;
			}

			.pdfworks-settings .setting-group select {
				background: var(--input-background);
				border: 1px solid var(--border-color);
				border-radius: 4px;
				padding: 6px 10px;
				color: var(--text-color);
				font-size: 14px;
				cursor: pointer;
			}

			.pdfworks-settings .setting-group select:hover {
				border-color: var(--accent-color);
			}

			.pdfworks-settings .setting-group select:focus,
			.pdfworks-settings .setting-group textarea:focus {
				outline: none;
				border-color: var(--accent-color);
				box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
			}

			.pdfworks-prompt-group {
				align-items: flex-start !important;
				flex-direction: column;
			}

			#pdfworks-instruction-input {
				width: 100%;
				box-sizing: border-box;
				padding: 8px;
				border-radius: 6px;
				border: 1px solid var(--border-color);
				resize: vertical;
				background: var(--input-background);
				color: var(--text-color);
				font-size: inherit;
				font-family: inherit;
			}

			.generate-button {
				width: 100%;
				padding: 10px;
				border: none;
				border-radius: 6px;
				cursor: pointer;
				font-weight: 600;
				background: var(--accent-color);
				color: white;
			}

			.generate-button + .generate-button {
				margin-top: 10px;
			}

			.generate-button:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}

			.pdfworks-export-button {
				margin-top: 0;
				background: var(--presentation-browse-hover-bg, #10b981);
			}

			.pdfworks-status {
				border-radius: 6px;
				padding: 10px;
				font-size: 13px;
				line-height: 1.4;
				border: 1px solid transparent;
				background: var(--panel-background);
				color: var(--text-color);
				margin-top: 12px;
				min-height: 40px;
				box-sizing: border-box;
				word-break: break-word;
			}

			.pdfworks-status.info {
				border-color: var(--border-color);
			}

			.pdfworks-status.success {
				border-color: #16a34a;
			}

			.pdfworks-status.error {
				border-color: #dc2626;
			}

			.pdfworks-preview-overlay {
				position: fixed;
				top: 0;
				left: 0;
				width: 100vw;
				height: 100vh;
				background: var(--modal-overlay-bg, rgba(30,30,30,0.7));
				backdrop-filter: blur(10px);
				-webkit-backdrop-filter: blur(10px);
				z-index: 9999;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.pdfworks-info-overlay {
				position: fixed;
				top: 0;
				left: 0;
				width: 100vw;
				height: 100vh;
				background: var(--modal-overlay-bg, rgba(30,30,30,0.52));
				z-index: 10010;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.pdfworks-info-modal {
				width: min(88vw, 460px);
				background: var(--background-color);
				border: 1px solid var(--border-color);
				border-radius: 10px;
				box-shadow: 0 14px 34px rgba(0,0,0,0.22);
				padding: 16px;
				display: flex;
				flex-direction: column;
				gap: 12px;
			}

			.pdfworks-info-title {
				font-size: 16px;
				font-weight: 600;
				color: var(--text-color);
			}

			.pdfworks-info-message {
				font-size: 13px;
				line-height: 1.45;
				color: var(--text-color);
				opacity: 0.92;
			}

			.pdfworks-info-actions {
				display: flex;
				justify-content: flex-end;
			}

			.pdfworks-info-close-btn {
				margin-top: 0;
			}

			.pdfworks-preview-window {
				width: min(92vw, 1200px);
				height: min(90vh, 900px);
				min-width: 780px;
				min-height: 520px;
				max-width: 98vw;
				max-height: 96vh;
				background: var(--background-color);
				border: 1px solid var(--border-color);
				border-radius: 12px;
				box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
				overflow: hidden;
				display: flex;
				flex-direction: column;
				resize: both;
			}

			.pdfworks-preview-window.maximized {
				resize: none;
			}

			.pdfworks-preview-header {
				height: 56px;
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 0 16px;
				border-bottom: 1px solid var(--border-color);
				background: var(--panel-background);
			}

			.pdfworks-preview-header h3 {
				margin: 0;
				font-size: 16px;
				font-weight: 600;
				color: var(--text-color);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				max-width: calc(100% - 56px);
			}

			.pdfworks-preview-close {
				background: var(--error-color, #e53935);
				border: none;
				color: #fff;
				width: 32px;
				height: 32px;
				border-radius: 8px;
				font-size: 24px;
				line-height: 1;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.pdfworks-preview-close:hover {
				background: var(--error-hover, #b71c1c);
			}

			.pdfworks-preview-header-actions {
				display: flex;
				align-items: center;
				gap: 8px;
			}

			.pdfworks-preview-maximize {
				background: var(--accent-color);
				border: none;
				color: #fff;
				width: 32px;
				height: 32px;
				border-radius: 8px;
				font-size: 16px;
				line-height: 1;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.pdfworks-preview-maximize:hover {
				background: var(--accent-color-hover, #4338ca);
			}

			.pdfworks-preview-body {
				flex: 1;
				overflow: hidden;
				padding: 0;
				display: flex;
				flex-direction: row;
				gap: 0;
			}

			.pdfworks-preview-controls {
				width: 320px;
				min-width: 320px;
				height: 100%;
				overflow-y: auto;
				padding: 16px;
				box-sizing: border-box;
				border-right: 1px solid var(--border-color);
				background: var(--panel-background);
				display: flex;
				flex-direction: column;
				gap: 14px;
			}

			.pdfworks-preview-controls-title {
				font-size: 15px;
				font-weight: 600;
				margin-bottom: 12px;
				color: var(--text-color);
			}

			.pdfworks-preview-controls .setting-group {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 10px;
				margin-bottom: 0;
			}

			.pdfworks-scope-help {
				font-size: 12px;
				opacity: 0.8;
				margin: -2px 0 2px;
				line-height: 1.4;
				color: var(--text-color);
			}

			.pdfworks-preview-controls .setting-group label {
				font-weight: 500;
				color: var(--text-color);
				flex: 1;
			}

			.pdfworks-preview-controls .setting-group select {
				background: var(--input-background);
				border: 1px solid var(--border-color);
				border-radius: 4px;
				padding: 6px 10px;
				color: var(--text-color);
				font-size: 14px;
				cursor: pointer;
			}

			.pdfworks-preview-controls .setting-group select:hover {
				border-color: var(--accent-color);
			}

			.pdfworks-preview-controls .setting-group select:focus,
			.pdfworks-preview-controls .setting-group textarea:focus {
				outline: none;
				border-color: var(--accent-color);
				box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
			}

			.pdfworks-preview-controls .pdfworks-prompt-group {
				align-items: flex-start;
				flex-direction: column;
			}

			#pdfworks-preview-instruction-input {
				width: 100%;
				box-sizing: border-box;
				padding: 8px;
				border-radius: 6px;
				border: 1px solid var(--border-color);
				resize: vertical;
				background: var(--input-background);
				color: var(--text-color);
				font-size: inherit;
				font-family: inherit;
			}

			.pdfworks-preview-pages {
				flex: 1;
				overflow: auto;
				padding: 16px;
				display: flex;
				flex-direction: column;
				gap: 16px;
			}

			.pdfworks-preview-loading {
				font-size: 14px;
				color: var(--text-color);
				opacity: 0.8;
			}

			.pdfworks-preview-page {
				display: flex;
				flex-direction: column;
				gap: 8px;
				align-items: center;
				padding: 8px;
				border-radius: 8px;
				cursor: pointer;
				border: 1px solid transparent;
				transition: border-color 0.18s ease, background 0.18s ease;
			}

			.pdfworks-preview-page.scope-document-active {
				border-color: rgba(79, 70, 229, 0.2);
			}

			.pdfworks-preview-page.scope-page-active,
			.pdfworks-preview-page.scope-selection-active {
				border-color: var(--accent-color);
				background: var(--hover-background);
			}

			.pdfworks-preview-page-label {
				font-size: 13px;
				font-weight: 600;
				color: var(--text-color);
			}

			.pdfworks-preview-canvas {
				max-width: 100%;
				height: auto;
				border: 1px solid var(--border-color);
				border-radius: 6px;
				background: #fff;
			}

			.pdfworks-preview-canvas-frame {
				position: relative;
				display: inline-block;
				max-width: 100%;
			}

			.pdfworks-preview-overlay-layer {
				position: absolute;
				left: 0;
				top: 0;
				right: 0;
				bottom: 0;
				overflow: hidden;
				box-sizing: border-box;
				pointer-events: auto;
			}

			.pdfworks-preview-overlay-layer.hidden {
				display: none;
			}

			.pdfworks-editable-text-block {
				position: absolute;
				padding: 1px 2px;
				border: 1px dashed transparent;
				color: var(--text-color);
				background: transparent;
				border-radius: 2px;
				white-space: pre-wrap;
				word-break: break-word;
				overflow: hidden;
				caret-color: var(--text-color);
				z-index: 2;
			}

			.pdfworks-editable-text-block:hover,
			.pdfworks-editable-text-block:focus {
				border-color: var(--accent-color);
				outline: none;
				background: color-mix(in srgb, var(--panel-background) 20%, transparent);
			}

			.pdfworks-overlay-title {
				font-weight: 600;
				margin-bottom: 6px;
			}

			.pdfworks-overlay-rows {
				display: flex;
				flex-direction: column;
				gap: 6px;
			}

			.pdfworks-overlay-row {
				display: flex;
				flex-direction: column;
				gap: 2px;
				padding-top: 6px;
				border-top: 1px solid var(--border-color);
			}

			.pdfworks-overlay-row:first-child {
				padding-top: 0;
				border-top: none;
			}

			.pdfworks-overlay-blockid {
				font-weight: 600;
				opacity: 0.85;
			}

			.pdfworks-overlay-text {
				white-space: pre-wrap;
				word-break: break-word;
			}
		`;

		document.head.appendChild(style);
	}
}

window.PdfWorksTab = PdfWorksTab;
window.PdfWorksTabLoaded = true;
