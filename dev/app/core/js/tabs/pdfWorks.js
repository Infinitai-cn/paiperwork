class PdfWorks {
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
					console.warn('[PdfWorks] Failed to destroy temporary pdfDocument after extractable-text check', error);
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
				console.warn('[PdfWorks] Failed to destroy temporary pdfDocument after editable model build', error);
			}
		}

		return {
			documentId: `pdfworks_${Date.now()}`,
			fileName: file?.name || 'pdf-document',
			pageCount: pages.length,
			pages
		};
	}

	async runTransform({ file, instruction, scope, scopeTarget, previewDocument = null, editableDocument = null, abortSignal = null }) {
		if (!file) {
			throw new Error('No PDF file selected');
		}
		if (!instruction || !instruction.trim()) {
			throw new Error('Please enter a transform instruction');
		}
		if (!scopeTarget || !Array.isArray(scopeTarget.pageNumbers) || scopeTarget.pageNumbers.length === 0) {
			throw new Error('No scope target selected');
		}

		console.group('[PdfWorks] runTransform');
		console.log('file:', file.name);
		console.log('scope:', scope);
		console.log('scopeTarget:', scopeTarget);
		console.log('instructionLength:', instruction.trim().length);
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

			console.warn('[PdfWorks] No extractable text found', {
				selectedPages: extraction.pageNumbers,
				scopeTarget,
				pageTextCounts: extraction.diagnostics?.pageTextCounts || []
			});

			if (pagesWithText.length > 0) {
				throw new Error(`No extractable text found in selected scope. Try page(s): ${pagesWithText.join(', ')}`);
			}

			throw new Error('No extractable text found in selected scope (PDF appears image-only or non-selectable).');
		}

		const rawModelOutput = await this.requestTransformFromOllama({
			fileName: file.name,
			instruction,
			scope,
			scopeTarget,
			blocks: extraction.blocks,
			abortSignal
		});

		const parsedResult = this.parseTransformResponse(rawModelOutput, extraction.blockMap);

		return {
			ok: true,
			fileName: file.name,
			instruction,
			scope,
			scopeTarget,
			processedAt: Date.now(),
			sourceBlockCount: extraction.blocks.length,
			replacementCount: parsedResult.replacements.length,
			replacements: parsedResult.replacements
		};
	}

	extractScopedBlocksFromEditableDocument(editableDocument, scopeTarget, abortSignal = null) {
		if (!editableDocument || !Array.isArray(editableDocument.pages)) {
			throw new Error('Editable document model is not available');
		}

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
				const sourceText = this.normalizeText(textBlock.transformedText || textBlock.originalText || textBlock.text);
				if (!sourceText) {
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
				normalizedTextItemCount: (page.textBlocks || []).filter(block => this.normalizeText(block.originalText || block.text)).length,
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

		console.log('[PdfWorks] document capabilities', {
			numPages: pdfDocument.numPages,
			isPureXfa: !!pdfDocument.isPureXfa,
			allXfaHtml: !!pdfDocument.allXfaHtml
		});

		const pageNumbers = this.normalizePageNumbers(scopeTarget.pageNumbers, pdfDocument.numPages);
		console.group('[PdfWorks] extractScopedTextBlocks');
		console.log('pdfTotalPages:', pdfDocument.numPages);
		console.log('scopeTargetPages(raw):', scopeTarget.pageNumbers);
		console.log('scopeTargetPages(validated):', pageNumbers);
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

			console.group(`[PdfWorks] page ${pageNumber}`);
			console.log('textExtractionMode:', extractionAttempt.mode);
			console.log('rawTextItemCount:', textItems.length);

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

			console.log('normalizedTextItemCount:', normalizedCount);
			console.log('extractedBlocksOnPage:', pageBlocks.length);
			console.table(pageBlocks);
			console.groupEnd();
		}

		console.group('[PdfWorks] extraction summary');
		console.log('totalExtractedBlocks:', blocks.length);
		console.log('totalExtractedChars:', totalChars);
		console.groupEnd();

		const diagnostics = {
			pageTextCounts: []
		};

		if (blocks.length === 0) {
			diagnostics.pageTextCounts = await this.scanAllPageTextCounts(pdfDocument, abortSignal);
			console.group('[PdfWorks] full-document text diagnostics');
			console.table(diagnostics.pageTextCounts);
			console.groupEnd();
		}

		if (ownsPdfDocument && pdfDocument && typeof pdfDocument.destroy === 'function') {
			try {
				await pdfDocument.destroy();
			} catch (error) {
				console.warn('[PdfWorks] Failed to destroy temporary pdfDocument', error);
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
			console.warn('[PdfWorks] page.getTextContent() default failed', error);
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
			console.warn('[PdfWorks] page.getTextContent() includeMarkedContent failed', error);
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
				console.warn('[PdfWorks] page.streamTextContent() failed', error);
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
			console.warn('[PdfWorks] page.getAnnotations() fallback failed', error);
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

	getTransformSystemPrompt() {
		return [
			'You are a PDF text transformation engine.',
			'You must ONLY transform provided text blocks and never invent new block IDs.',
			'Return JSON only. No markdown, no prose, no explanations.',
			'Required output shape:',
			'{"replacements":[{"blockId":"<id>","transformedText":"<text>"}]}',
			'Rules:',
			'- Keep exact meaning unless instruction explicitly asks to summarize or simplify.',
			'- Keep technical terms and units accurate.',
			'- Preserve bullet/list intent where present.',
			'- Include only block IDs from input. Omit unchanged blocks.',
			'- transformedText must be a plain string.'
		].join('\n');
	}

	async requestTransformFromOllama({ fileName, instruction, scope, scopeTarget, blocks, abortSignal = null }) {
		if (!window.OllamaAPI || typeof window.OllamaAPI.sendToOllama !== 'function') {
			throw new Error('Ollama API not available');
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
			`pdfworks_${Date.now()}`
		);

		if (!response || !response.ok) {
			throw new Error('No response from Ollama');
		}

		return this.collectResponseText(response);
	}

	async collectResponseText(response) {
		if (!response.body) {
			throw new Error('Invalid Ollama response stream');
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let outputText = '';

		while (true) {
			const { value, done } = await reader.read();
			if (done) {
				break;
			}

			const chunkText = decoder.decode(value, { stream: true });
			const lines = chunkText.split('\n');

			for (const line of lines) {
				const trimmedLine = line.trim();
				if (!trimmedLine) {
					continue;
				}

				try {
					const parsedLine = JSON.parse(trimmedLine);
					if (typeof parsedLine.response === 'string') {
						outputText += parsedLine.response;
					}
				} catch (_error) {
					// Ignore malformed stream lines
				}
			}
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

window.PdfWorks = PdfWorks;
window.PdfWorksLoaded = true;
