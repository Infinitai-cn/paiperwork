class Translate {
	constructor() {
		this.isInitialized = false;
		this.maxBlocksPerRequest = 240;
		this.maxCharsPerRequest = 18000;
	}

	async initialize() {
		if (this.isInitialized) {
			return;
		}
		this.isInitialized = true;
	}

	async checkExtractableTextAvailability({ file, previewDocument = null }) {
		if (!window.pdfjsLib || typeof window.pdfjsLib.getDocument !== 'function') {
			throw new Error('PDF.js not available');
		}

		let pdfDocument = previewDocument;
		let ownsPdfDocument = false;

		if (!pdfDocument) {
			if (!file) {
				throw new Error('No PDF file selected');
			}
			const fileData = await file.arrayBuffer();
			const loadingTask = window.pdfjsLib.getDocument({
				data: fileData,
				enableXfa: true
			});
			pdfDocument = await loadingTask.promise;
			ownsPdfDocument = true;
		}

		const diagnostics = [];
		let hasExtractableText = false;

		try {
			for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
				const page = await pdfDocument.getPage(pageNumber);
				const extractionAttempt = await this.extractPageTextItems(page);
				const normalizedTextItemCount = extractionAttempt.items.reduce((count, item) => {
					return count + (this.normalizeText(item?.str || '').length > 0 ? 1 : 0);
				}, 0);

				diagnostics.push({
					pageNumber,
					extractionMode: extractionAttempt.mode,
					rawTextItemCount: extractionAttempt.items.length,
					normalizedTextItemCount
				});

				if (normalizedTextItemCount > 0) {
					hasExtractableText = true;
					break;
				}
			}
		} finally {
			if (ownsPdfDocument && pdfDocument && typeof pdfDocument.destroy === 'function') {
				try {
					await pdfDocument.destroy();
				} catch (error) {
					console.warn('[Translate] Failed to destroy temporary pdfDocument after extractable-text check', error);
				}
			}
		}

		return {
			hasExtractableText,
			diagnostics
		};
	}

	async buildEditableDocument({ file, previewDocument = null, renderScale = 1.1 }) {
		if (!window.pdfjsLib || typeof window.pdfjsLib.getDocument !== 'function') {
			throw new Error('PDF.js not available');
		}

		let pdfDocument = previewDocument;
		let ownsPdfDocument = false;

		if (!pdfDocument) {
			if (!file) {
				throw new Error('No PDF file selected');
			}
			const fileData = await file.arrayBuffer();
			const loadingTask = window.pdfjsLib.getDocument({
				data: fileData,
				enableXfa: true
			});
			pdfDocument = await loadingTask.promise;
			ownsPdfDocument = true;
		}

		const pages = [];

		for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
			const page = await pdfDocument.getPage(pageNumber);
			const viewport = page.getViewport({ scale: renderScale });
			const extractionAttempt = await this.extractPageTextItems(page);
			const textBlocks = extractionAttempt.items
				.map((textItem, itemIndex) => this.buildTextBlockFromItem(textItem, itemIndex, pageNumber, viewport, renderScale))
				.filter(Boolean);

			pages.push({
				pageNumber,
				width: viewport.width,
				height: viewport.height,
				renderScale,
				extractionMode: extractionAttempt.mode,
				textBlocks
			});
		}

		if (ownsPdfDocument && pdfDocument && typeof pdfDocument.destroy === 'function') {
			try {
				await pdfDocument.destroy();
			} catch (error) {
				console.warn('[Translate] Failed to destroy temporary pdfDocument after editable model build', error);
			}
		}

		return {
			documentId: `translate_${Date.now()}`,
			fileName: file?.name || 'pdf-document',
			pageCount: pages.length,
			pages
		};
	}

	async runTransform({ file, instruction, scope, scopeTarget, previewDocument = null, editableDocument = null, abortSignal = null, onReplacement = null }) {
		if (!file) {
			throw new Error('No PDF file selected');
		}
		if (!instruction || !instruction.trim()) {
			throw new Error('Please enter a transform instruction');
		}
		if (!scopeTarget || !Array.isArray(scopeTarget.pageNumbers) || scopeTarget.pageNumbers.length === 0) {
			throw new Error('No scope target selected');
		}

		console.group('[Translate] runTransform');
		//console.log('file:', file.name);
		//console.log('scope:', scope);
		//console.log('scopeTarget:', scopeTarget);
		//console.log('instructionLength:', instruction.trim().length);
		console.groupEnd();
		this.throwIfAborted(abortSignal);

		const extraction = editableDocument
			? this.extractScopedBlocksFromEditableDocument(editableDocument, scopeTarget, abortSignal)
			: await this.extractScopedTextBlocks(file, scopeTarget, previewDocument, abortSignal);
		this.throwIfAborted(abortSignal);
		if (extraction.blocks.length === 0) {
			const pagesWithText = (extraction.diagnostics?.pageTextCounts || [])
				.filter(pageInfo => pageInfo.normalizedTextItemCount > 0)
				.map(pageInfo => pageInfo.pageNumber);

			console.warn('[Translate] No extractable text found', {
				selectedPages: extraction.pageNumbers,
				scopeTarget,
				pageTextCounts: extraction.diagnostics?.pageTextCounts || []
			});

			if (pagesWithText.length > 0) {
				throw new Error(`No extractable text found in selected scope. Try page(s): ${pagesWithText.join(', ')}`);
			}

			throw new Error('No extractable text found in selected scope (PDF appears image-only or non-selectable).');
		}

		const modelResult = await this.requestTransformFromOllama({
			fileName: file.name,
			instruction,
			scope,
			scopeTarget,
			blocks: extraction.blocks,
			blockMap: extraction.blockMap,
			onReplacement,
			abortSignal
		});

		const streamedReplacements = Array.isArray(modelResult?.streamedReplacements)
			? modelResult.streamedReplacements
			: [];

		let parsedResult = { replacements: [] };
		try {
			parsedResult = this.parseTransformResponse(modelResult?.rawOutput || '', extraction.blockMap);
		} catch (error) {
			if (streamedReplacements.length === 0) {
				throw error;
			}
		}

		const replacements = this.mergeReplacements(streamedReplacements, parsedResult.replacements, extraction.blockMap);
		if (replacements.length === 0) {
			throw new Error('No valid replacements returned');
		}

		return {
			ok: true,
			fileName: file.name,
			instruction,
			scope,
			scopeTarget,
			processedAt: Date.now(),
			sourceBlockCount: extraction.blocks.length,
			replacementCount: replacements.length,
			replacements
		};
	}

	mergeReplacements(streamedReplacements, parsedReplacements, blockMap) {
		const mergedByBlockId = new Map();

		const append = candidate => {
			if (!candidate || typeof candidate !== 'object') {
				return;
			}

			const blockId = typeof candidate.blockId === 'string' ? candidate.blockId : '';
			const transformedText = typeof candidate.transformedText === 'string' ? candidate.transformedText : '';
			if (!blockId || !transformedText || !blockMap.has(blockId)) {
				return;
			}

			const sourceBlock = blockMap.get(blockId);
			mergedByBlockId.set(blockId, {
				blockId,
				pageNumber: sourceBlock.pageNumber,
				originalText: sourceBlock.text,
				transformedText
			});
		};

		(streamedReplacements || []).forEach(append);
		(parsedReplacements || []).forEach(append);

		return Array.from(mergedByBlockId.values());
	}

	extractScopedBlocksFromEditableDocument(editableDocument, scopeTarget, abortSignal = null) {
		if (!editableDocument || !Array.isArray(editableDocument.pages)) {
			throw new Error('Editable document model is not available');
		}

		const sourceType = String(editableDocument.sourceType || '').toLowerCase();
		const preserveDocumentFormatting = sourceType === 'txt' || sourceType === 'md';

		const pageNumbers = this.normalizePageNumbers(scopeTarget.pageNumbers, editableDocument.pages.length);
		const blocks = [];
		const blockMap = new Map();
		let totalChars = 0;

		for (const pageNumber of pageNumbers) {
			this.throwIfAborted(abortSignal);
			const pageData = editableDocument.pages.find(page => page.pageNumber === pageNumber);
			if (!pageData || !Array.isArray(pageData.textBlocks)) {
				continue;
			}

			for (const textBlock of pageData.textBlocks) {
				this.throwIfAborted(abortSignal);
				const rawSourceText = textBlock.transformedText || textBlock.originalText || textBlock.text;
				const preserveBlockFormatting = preserveDocumentFormatting || !!textBlock.preserveFormatting;
				const sourceText = preserveBlockFormatting
					? this.normalizeTextPreservingFormatting(rawSourceText)
					: this.normalizeText(rawSourceText);
				if (!sourceText || !sourceText.trim()) {
					continue;
				}

				const nextCharTotal = totalChars + sourceText.length;
				if (blocks.length >= this.maxBlocksPerRequest || nextCharTotal > this.maxCharsPerRequest) {
					throw new Error('Selected scope is too large. Please use page or selection scope.');
				}

				const block = {
					blockId: textBlock.blockId,
					pageNumber,
					text: sourceText
				};

				blocks.push(block);
				blockMap.set(block.blockId, block);
				totalChars = nextCharTotal;
			}
		}

		const diagnostics = {
			pageTextCounts: editableDocument.pages.map(page => ({
				pageNumber: page.pageNumber,
				rawTextItemCount: page.textBlocks?.length || 0,
				normalizedTextItemCount: (page.textBlocks || []).filter(block => {
					const blockPreserveFormatting = preserveDocumentFormatting || !!block.preserveFormatting;
					const normalizedText = blockPreserveFormatting
						? this.normalizeTextPreservingFormatting(block.originalText || block.text)
						: this.normalizeText(block.originalText || block.text);
					return !!normalizedText && !!normalizedText.trim();
				}).length,
				extractionMode: page.extractionMode || 'editable-model'
			}))
		};

		return { blocks, blockMap, pageNumbers, diagnostics };
	}

	async extractScopedTextBlocks(file, scopeTarget, previewDocument = null, abortSignal = null) {
		if (!window.pdfjsLib || typeof window.pdfjsLib.getDocument !== 'function') {
			throw new Error('PDF.js not available');
		}

		let pdfDocument = previewDocument;
		let ownsPdfDocument = false;

		if (!pdfDocument) {
			const fileData = await file.arrayBuffer();
			const loadingTask = window.pdfjsLib.getDocument({
				data: fileData,
				enableXfa: true
			});
			pdfDocument = await loadingTask.promise;
			ownsPdfDocument = true;
		}

		/*console.log('[Translate] document capabilities', {
			numPages: pdfDocument.numPages,
			isPureXfa: !!pdfDocument.isPureXfa,
			allXfaHtml: !!pdfDocument.allXfaHtml
		});*/

		const pageNumbers = this.normalizePageNumbers(scopeTarget.pageNumbers, pdfDocument.numPages);
		console.group('[Translate] extractScopedTextBlocks');
		//console.log('pdfTotalPages:', pdfDocument.numPages);
		//console.log('scopeTargetPages(raw):', scopeTarget.pageNumbers);
		//console.log('scopeTargetPages(validated):', pageNumbers);
		console.groupEnd();

		const blocks = [];
		const blockMap = new Map();
		let totalChars = 0;

		for (const pageNumber of pageNumbers) {
			this.throwIfAborted(abortSignal);
			const page = await pdfDocument.getPage(pageNumber);
			const extractionAttempt = await this.extractPageTextItems(page);
			const textItems = extractionAttempt.items;
			let normalizedCount = 0;

			console.group(`[Translate] page ${pageNumber}`);
			//console.log('textExtractionMode:', extractionAttempt.mode);
			//console.log('rawTextItemCount:', textItems.length);

			const rawItemPreview = textItems.slice(0, 30).map((item, index) => {
				const rawText = typeof item.str === 'string' ? item.str : '';
				const normalizedText = this.normalizeText(rawText);
				return {
					index,
					rawText,
					normalizedText,
					rawLength: rawText.length,
					normalizedLength: normalizedText.length
				};
			});
			console.table(rawItemPreview);

			for (let itemIndex = 0; itemIndex < textItems.length; itemIndex += 1) {
				this.throwIfAborted(abortSignal);
				const textItem = textItems[itemIndex];
				const normalizedText = this.normalizeText(textItem.str);

				if (!normalizedText) {
					continue;
				}
				normalizedCount += 1;

				const nextCharTotal = totalChars + normalizedText.length;
				if (blocks.length >= this.maxBlocksPerRequest || nextCharTotal > this.maxCharsPerRequest) {
					throw new Error('Selected scope is too large. Please use page or selection scope.');
				}

				const blockId = `p${pageNumber}-t${itemIndex}`;
				const block = {
					blockId,
					pageNumber,
					text: normalizedText
				};

				blocks.push(block);
				blockMap.set(blockId, block);
				totalChars = nextCharTotal;
			}

			const pageBlocks = blocks
				.filter(block => block.pageNumber === pageNumber)
				.map(block => ({ blockId: block.blockId, text: block.text }))
				.slice(0, 60);

			//console.log('normalizedTextItemCount:', normalizedCount);
			//console.log('extractedBlocksOnPage:', pageBlocks.length);
			console.table(pageBlocks);
			console.groupEnd();
		}

		console.group('[Translate] extraction summary');
		//console.log('totalExtractedBlocks:', blocks.length);
		//console.log('totalExtractedChars:', totalChars);
		console.groupEnd();

		const diagnostics = {
			pageTextCounts: []
		};

		if (blocks.length === 0) {
			diagnostics.pageTextCounts = await this.scanAllPageTextCounts(pdfDocument, abortSignal);
			console.group('[Translate] full-document text diagnostics');
			console.table(diagnostics.pageTextCounts);
			console.groupEnd();
		}

		if (ownsPdfDocument && pdfDocument && typeof pdfDocument.destroy === 'function') {
			try {
				await pdfDocument.destroy();
			} catch (error) {
				console.warn('[Translate] Failed to destroy temporary pdfDocument', error);
			}
		}

		return { blocks, blockMap, pageNumbers, diagnostics };
	}

	async extractPageTextItems(page) {
		try {
			const textContent = await page.getTextContent();
			if (Array.isArray(textContent.items) && textContent.items.length > 0) {
				return { mode: 'default', items: textContent.items };
			}
		} catch (error) {
			console.warn('[Translate] page.getTextContent() default failed', error);
		}

		try {
			const textContentWithMarked = await page.getTextContent({
				includeMarkedContent: true,
				disableNormalization: true
			});
			if (Array.isArray(textContentWithMarked.items) && textContentWithMarked.items.length > 0) {
				return { mode: 'includeMarkedContent', items: textContentWithMarked.items };
			}
		} catch (error) {
			console.warn('[Translate] page.getTextContent() includeMarkedContent failed', error);
		}

		if (typeof page.streamTextContent === 'function') {
			try {
				const textItems = [];
				const streamReader = page.streamTextContent({ includeMarkedContent: true }).getReader();

				while (true) {
					const { value, done } = await streamReader.read();
					if (done) {
						break;
					}

					if (value && Array.isArray(value.items)) {
						textItems.push(...value.items);
					}
				}

				if (textItems.length > 0) {
					return { mode: 'streamTextContent', items: textItems };
				}
			} catch (error) {
				console.warn('[Translate] page.streamTextContent() failed', error);
			}
		}

		try {
			const annotations = await page.getAnnotations({ intent: 'display' });
			const annotationItems = [];

			annotations.forEach((annotation, annotationIndex) => {
				const candidates = [
					annotation?.contents,
					annotation?.title,
					annotation?.fieldValue,
					annotation?.alternativeText,
					annotation?.buttonValue
				];

				candidates.forEach(candidateText => {
					if (typeof candidateText !== 'string') {
						return;
					}

					const normalizedCandidate = this.normalizeText(candidateText);
					if (!normalizedCandidate) {
						return;
					}

					annotationItems.push({
						str: normalizedCandidate,
						__source: `annotation-${annotationIndex}`
					});
				});
			});

			if (annotationItems.length > 0) {
				return { mode: 'annotations', items: annotationItems };
			}
		} catch (error) {
			console.warn('[Translate] page.getAnnotations() fallback failed', error);
		}

		return { mode: 'none', items: [] };
	}

	buildTextBlockFromItem(textItem, itemIndex, pageNumber, viewport, renderScale) {
		const originalText = this.normalizeText(textItem?.str || '');
		if (!originalText) {
			return null;
		}

		const styleHint = this.inferStyleFromTextItem(textItem);

		const itemTransform = Array.isArray(textItem.transform) ? textItem.transform : [1, 0, 0, 1, 0, 0];
		const combinedTransform = window.pdfjsLib?.Util?.transform
			? window.pdfjsLib.Util.transform(viewport.transform, itemTransform)
			: itemTransform;

		const left = Number.isFinite(combinedTransform[4]) ? combinedTransform[4] : 0;
		const baselineY = Number.isFinite(combinedTransform[5]) ? combinedTransform[5] : 0;
		const fontSize = Math.max(8, Math.abs(combinedTransform[3]) || Math.abs(textItem.height || 0) * renderScale || 12);
		const width = Math.max(24, Math.abs((textItem.width || 0) * renderScale));
		const height = Math.max(fontSize * 1.15, Math.abs((textItem.height || 0) * renderScale) || fontSize * 1.15);
		const top = Math.max(0, baselineY - height + 2);

		return {
			blockId: `p${pageNumber}-t${itemIndex}`,
			pageNumber,
			originalText,
			transformedText: '',
			left,
			top,
			width,
			height,
			fontSize,
			lineHeight: Math.max(fontSize * 1.15, 12),
			fontFamily: styleHint.fontFamily,
			fontWeight: styleHint.fontWeight,
			fontStyle: styleHint.fontStyle,
			color: styleHint.color
		};
	}

	inferStyleFromTextItem(textItem) {
		const fontNameRaw = (textItem?.fontName || '').toString();
		const fontNameLower = fontNameRaw.toLowerCase();
		const fontWeight = /bold|black|heavy|semibold|demibold/.test(fontNameLower) ? '700' : '400';
		const fontStyle = /italic|oblique/.test(fontNameLower) ? 'italic' : 'normal';

		let fontFamily = 'Arial';
		if (fontNameRaw) {
			fontFamily = fontNameRaw.replace(/[+,_-]/g, ' ').trim() || 'Arial';
		}

		let color = '#111111';
		if (Array.isArray(textItem?.color) && textItem.color.length >= 3) {
			const [red, green, blue] = textItem.color;
			const toByte = value => {
				if (!Number.isFinite(value)) return 0;
				if (value <= 1) return Math.max(0, Math.min(255, Math.round(value * 255)));
				return Math.max(0, Math.min(255, Math.round(value)));
			};
			const toHex = value => toByte(value).toString(16).padStart(2, '0');
			color = `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
		}

		return {
			fontFamily,
			fontWeight,
			fontStyle,
			color
		};
	}

	async scanAllPageTextCounts(pdfDocument, abortSignal = null) {
		const pageTextCounts = [];

		for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
			this.throwIfAborted(abortSignal);
			const page = await pdfDocument.getPage(pageNumber);
			const extractionAttempt = await this.extractPageTextItems(page);
			const textItems = extractionAttempt.items;
			let normalizedTextItemCount = 0;

			for (let itemIndex = 0; itemIndex < textItems.length; itemIndex += 1) {
				const textItem = textItems[itemIndex];
				if (this.normalizeText(textItem.str)) {
					normalizedTextItemCount += 1;
				}
			}

			pageTextCounts.push({
				pageNumber,
				rawTextItemCount: textItems.length,
				extractionMode: extractionAttempt.mode,
				normalizedTextItemCount
			});
		}

		return pageTextCounts;
	}

	throwIfAborted(abortSignal) {
		if (!abortSignal) {
			return;
		}
		if (abortSignal.aborted) {
			throw new DOMException('Operation aborted', 'AbortError');
		}
	}

	normalizePageNumbers(pageNumbers, maxPageCount) {
		if (!Array.isArray(pageNumbers)) {
			return [];
		}

		const validPageNumbers = pageNumbers
			.map(pageNumber => Number(pageNumber))
			.filter(pageNumber => Number.isInteger(pageNumber) && pageNumber >= 1 && pageNumber <= maxPageCount);

		return Array.from(new Set(validPageNumbers)).sort((left, right) => left - right);
	}

	normalizeText(textValue) {
		if (typeof textValue !== 'string') {
			return '';
		}
		return textValue.replace(/\s+/g, ' ').trim();
	}

	normalizeTextPreservingFormatting(textValue) {
		if (typeof textValue !== 'string') {
			return '';
		}
		return textValue.replace(/\r\n?/g, '\n');
	}

	getTransformSystemPrompt() {
		return [
			'You are a document translation engine.',
			'You must ONLY transform provided text blocks and never invent new block IDs.',
			'The requested instruction is always translation-focused. Translate text to the requested target language.',
			'For long single-block inputs, you may emit multiple updates for the same blockId as translation progresses.',
			'Preserve original line breaks and paragraph boundaries whenever possible.',
			'For markdown-like content, preserve markdown structure exactly (headings, bullets, numbered lists, code fences, inline code, links).',
			'Keep structural markers unchanged when present, such as [Image: ...], [Image N], and [TextBox].',
			'Return JSON only. No markdown, no prose, no explanations.',
			'Prefer streaming-friendly NDJSON with one JSON object per line:',
			'{"blockId":"<id>","transformedText":"<text>"}',
			'You may optionally end with {"done":true}.',
			'If NDJSON cannot be produced, fallback to this JSON object shape:',
			'{"replacements":[{"blockId":"<id>","transformedText":"<text>"}]}',
			'Rules:',
			'- Keep exact meaning.',
			'- Keep technical terms and units accurate.',
			'- Preserve bullet/list intent where present.',
			'- Include only block IDs from input. Omit unchanged blocks.',
			'- transformedText must be a plain string.'
		].join('\n');
	}

	getSelectedChatModel() {
		const modelSelector = document.getElementById('model-selector');
		return modelSelector ? String(modelSelector.value || '').trim() : '';
	}

	switchToChatTabFromModelWarning() {
		if (window.tabManager && typeof window.tabManager.switchTab === 'function') {
			window.tabManager.switchTab('chat-tab');
		} else {
			const chatButton = document.querySelector('.tab-button[data-tab="chat"]');
			if (chatButton) {
				chatButton.click();
			}
		}

		setTimeout(() => {
			const modelSelector = document.getElementById('model-selector');
			if (modelSelector) {
				modelSelector.focus();
			}
		}, 120);
	}

	showChatModelRequiredWindow() {
		const existing = document.getElementById('translate-model-warning');
		if (existing) {
			return;
		}

		const overlay = document.createElement('div');
		overlay.id = 'translate-model-warning';
		overlay.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.6);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 20000;
		`;

		const dialog = document.createElement('div');
		dialog.style.cssText = `
			width: min(440px, calc(100vw - 32px));
			background: var(--card-bg, #1f2937);
			color: var(--text-color, #ffffff);
			border: 1px solid var(--border-color, #374151);
			border-radius: 10px;
			padding: 18px;
			box-sizing: border-box;
			text-align: center;
		`;

		const titleText = (window.Lang && Lang.get('modelSelectionRequired')) || 'Model selection required';
		const messageText = (window.Lang && Lang.get('translateModelRequired')) || 'Please select one model in the Chat tab model selector before using Translate.';
		const okText = (window.Lang && Lang.get('ok')) || 'Okay';

		dialog.innerHTML = `
			<h3 style="margin: 0 0 10px 0; font-size: 18px;">${titleText}</h3>
			<p style="margin: 0 0 14px 0; line-height: 1.45;">${messageText}</p>
			<button id="translate-model-warning-ok" style="padding: 9px 18px; border: none; border-radius: 8px; background: var(--accent-color, #4f46e5); color: #fff; cursor: pointer; font-weight: 600;">${okText}</button>
		`;

		overlay.appendChild(dialog);
		document.body.appendChild(overlay);

		const okButton = document.getElementById('translate-model-warning-ok');
		if (okButton) {
			okButton.addEventListener('click', () => {
				if (overlay.parentNode) {
					overlay.parentNode.removeChild(overlay);
				}
				this.switchToChatTabFromModelWarning();
			});
		}
	}

	ensureChatModelSelectedForGeneration() {
		const model = this.getSelectedChatModel();
		if (model) {
			return model;
		}

		this.showChatModelRequiredWindow();
		return '';
	}

	async requestTransformFromOllama({ fileName, instruction, scope, scopeTarget, blocks, blockMap, abortSignal = null, onReplacement = null }) {
		if (!window.OllamaAPI || typeof window.OllamaAPI.sendToOllama !== 'function') {
			throw new Error('Ollama API not available');
		}

		const selectedModel = this.ensureChatModelSelectedForGeneration();
		if (!selectedModel) {
			throw new Error((window.Lang && Lang.get('selectModelPrompt')) || 'Please select a model first.');
		}

		const payload = {
			task: 'pdf_text_transform',
			fileName,
			instruction,
			scope,
			scopeTarget,
			blocks
		};

		const userPrompt = `Transform the provided PDF text blocks according to the instruction. Return JSON only.\\n\\n${JSON.stringify(payload)}`;
		const contextSelector = document.getElementById('context-selector');
		const contextSize = contextSelector ? contextSelector.value : 8192;

		const response = await window.OllamaAPI.sendToOllama(
			userPrompt,
			this.getTransformSystemPrompt(),
			contextSize,
			null,
			abortSignal,
			`pdfworks_${Date.now()}`,
			null,
			false
		);

		if (!response || !response.ok) {
			throw new Error('No response from Ollama');
		}

		const streamState = this.createStreamingReplacementState({ blockMap, onReplacement });
		const rawOutput = await this.collectResponseText(response, {
			onTextChunk: chunk => streamState.consumeText(chunk)
		});
		streamState.flushPending();

		return {
			rawOutput,
			streamedReplacements: streamState.getReplacements()
		};
	}

	createStreamingReplacementState({ blockMap, onReplacement }) {
		const latestReplacementsByBlockId = new Map();
		let lineBuffer = '';

		const normalizeAndStore = replacementEntry => {
			if (!replacementEntry || typeof replacementEntry !== 'object') {
				return;
			}

			const blockId = typeof replacementEntry.blockId === 'string' ? replacementEntry.blockId : '';
			const transformedText = typeof replacementEntry.transformedText === 'string' ? replacementEntry.transformedText : '';
			if (!blockId || !transformedText || !blockMap?.has(blockId)) {
				return;
			}

			const sourceBlock = blockMap.get(blockId);
			const existingReplacement = latestReplacementsByBlockId.get(blockId);
			if (existingReplacement && existingReplacement.transformedText === transformedText) {
				return;
			}

			const replacement = {
				blockId,
				pageNumber: sourceBlock.pageNumber,
				originalText: sourceBlock.text,
				transformedText
			};

			latestReplacementsByBlockId.set(blockId, replacement);
			if (typeof onReplacement === 'function') {
				try {
					onReplacement(replacement);
				} catch (error) {
					console.warn('[Translate] onReplacement callback failed', error);
				}
			}
		};

		const consumeParsedPayload = payload => {
			if (!payload || typeof payload !== 'object') {
				return;
			}

			if (Array.isArray(payload)) {
				payload.forEach(normalizeAndStore);
				return;
			}

			if (Array.isArray(payload.replacements)) {
				payload.replacements.forEach(normalizeAndStore);
				return;
			}

			normalizeAndStore(payload);
		};

		const parseLineIfJson = line => {
			const trimmedLine = String(line || '').trim();
			if (!trimmedLine) {
				return;
			}

			try {
				const payload = JSON.parse(trimmedLine);
				consumeParsedPayload(payload);
			} catch (_error) {
				// Keep fallback to full response parsing
			}
		};

		return {
			consumeText(textChunk) {
				if (typeof textChunk !== 'string' || !textChunk) {
					return;
				}

				lineBuffer += textChunk;
				let newlineIndex = lineBuffer.indexOf('\n');
				while (newlineIndex >= 0) {
					const line = lineBuffer.slice(0, newlineIndex);
					lineBuffer = lineBuffer.slice(newlineIndex + 1);
					parseLineIfJson(line);
					newlineIndex = lineBuffer.indexOf('\n');
				}
			},
			flushPending() {
				if (lineBuffer.trim()) {
					parseLineIfJson(lineBuffer);
				}
				lineBuffer = '';
			},
			getReplacements() {
				return Array.from(latestReplacementsByBlockId.values());
			}
		};
	}

	async collectResponseText(response, options = {}) {
		if (!response.body) {
			throw new Error('Invalid Ollama response stream');
		}

		const onTextChunk = typeof options.onTextChunk === 'function' ? options.onTextChunk : null;

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let outputText = '';
		let pendingLine = '';

		const appendModelChunk = value => {
			if (typeof value !== 'string' || !value) {
				return;
			}
			outputText += value;
			if (onTextChunk) {
				onTextChunk(value);
			}
		};

		const parseStreamLine = rawLine => {
			const trimmedLine = String(rawLine || '').trim();
			if (!trimmedLine) {
				return;
			}

			let payloadText = trimmedLine;
			if (payloadText.startsWith('data:')) {
				payloadText = payloadText.slice(5).trim();
			}

			if (!payloadText || payloadText === '[DONE]') {
				return;
			}

			try {
				const parsedLine = JSON.parse(payloadText);
				if (typeof parsedLine.response === 'string') {
					appendModelChunk(parsedLine.response);
					return;
				}

				const cloudMessageContent = parsedLine?.message?.content;
				if (typeof cloudMessageContent === 'string') {
					appendModelChunk(cloudMessageContent);
				}
			} catch (_error) {
				// Ignore malformed stream lines
			}
		};

		while (true) {
			const { value, done } = await reader.read();
			if (done) {
				break;
			}

			pendingLine += decoder.decode(value, { stream: true });
			const lines = pendingLine.split(/\r?\n/);
			pendingLine = lines.pop() || '';
			lines.forEach(parseStreamLine);
		}

		pendingLine += decoder.decode();
		if (pendingLine.trim()) {
			parseStreamLine(pendingLine);
		}

		if (!outputText.trim()) {
			throw new Error('Empty response from model');
		}

		return outputText;
	}

	parseTransformResponse(rawOutput, blockMap) {
		const cleanOutput = this.cleanModelOutput(rawOutput);
		const payload = this.extractJsonPayload(cleanOutput);
		const replacementsArray = Array.isArray(payload)
			? payload
			: (Array.isArray(payload.replacements) ? payload.replacements : []);

		if (replacementsArray.length === 0) {
			throw new Error('Model returned no replacements');
		}

		const replacements = [];
		const seenBlockIds = new Set();

		for (const replacementEntry of replacementsArray) {
			if (!replacementEntry || typeof replacementEntry !== 'object') {
				continue;
			}

			const { blockId, transformedText } = replacementEntry;
			if (typeof blockId !== 'string' || typeof transformedText !== 'string') {
				continue;
			}
			if (!blockMap.has(blockId) || seenBlockIds.has(blockId)) {
				continue;
			}

			const sourceBlock = blockMap.get(blockId);
			replacements.push({
				blockId,
				pageNumber: sourceBlock.pageNumber,
				originalText: sourceBlock.text,
				transformedText
			});
			seenBlockIds.add(blockId);
		}

		if (replacements.length === 0) {
			throw new Error('No valid replacements returned');
		}

		return { replacements };
	}

	cleanModelOutput(rawOutput) {
		if (typeof rawOutput !== 'string') {
			return '';
		}

		return rawOutput
			.replace(/<think>[\s\S]*?<\/think>/gi, '')
			.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
			.replace(/```json/gi, '')
			.replace(/```/g, '')
			.trim();
	}

	extractJsonPayload(text) {
		if (!text) {
			throw new Error('Empty model payload');
		}

		try {
			return JSON.parse(text);
		} catch (_error) {
			// Continue with bounded extraction
		}

		const objectCandidate = this.extractBalancedSection(text, '{', '}');
		if (objectCandidate) {
			try {
				return JSON.parse(objectCandidate);
			} catch (_error) {
				// Continue to array candidate
			}
		}

		const arrayCandidate = this.extractBalancedSection(text, '[', ']');
		if (arrayCandidate) {
			return JSON.parse(arrayCandidate);
		}

		throw new Error('Unable to parse model JSON response');
	}

	extractBalancedSection(text, openChar, closeChar) {
		let startIndex = -1;
		let depth = 0;
		let inString = false;
		let escaping = false;

		for (let index = 0; index < text.length; index += 1) {
			const char = text[index];

			if (inString) {
				if (escaping) {
					escaping = false;
					continue;
				}
				if (char === '\\') {
					escaping = true;
					continue;
				}
				if (char === '"') {
					inString = false;
				}
				continue;
			}

			if (char === '"') {
				inString = true;
				continue;
			}

			if (char === openChar) {
				if (depth === 0) {
					startIndex = index;
				}
				depth += 1;
				continue;
			}

			if (char === closeChar && depth > 0) {
				depth -= 1;
				if (depth === 0 && startIndex >= 0) {
					return text.slice(startIndex, index + 1);
				}
			}
		}

		return null;
	}
}

window.Translate = Translate;
window.TranslateLoaded = true;
