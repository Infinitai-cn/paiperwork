class PromptedPresentationWorkflow {
	static getActiveHashedMasterKey() {
		return sessionStorage.getItem('hashedMasterKey') || '';
	}

	static extractPresentationTitle(htmlContent) {
		if (!htmlContent) {
			return 'Untitled presentation';
		}

		const titleMatch = htmlContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
		if (titleMatch && titleMatch[1] && titleMatch[1].trim()) {
			return titleMatch[1].trim().slice(0, 120);
		}

		const h1Match = htmlContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
		if (h1Match && h1Match[1]) {
			const cleanH1 = h1Match[1].replace(/<[^>]+>/g, '').trim();
			if (cleanH1) {
				return cleanH1.slice(0, 120);
			}
		}

		return 'Untitled presentation';
	}

	static formatDateLabel(isoDate) {
		if (!isoDate) {
			return '';
		}
		try {
			const date = new Date(isoDate);
			if (Number.isNaN(date.getTime())) {
				return '';
			}
			return date.toLocaleString();
		} catch (error) {
			return '';
		}
	}

	static showToastMessage(message, type = 'success') {
		if (!message) {
			return;
		}

		const containerId = 'promptable-toast-container';
		let toastContainer = document.getElementById(containerId);
		if (!toastContainer) {
			toastContainer = document.createElement('div');
			toastContainer.id = containerId;
			toastContainer.style.position = 'fixed';
			toastContainer.style.right = '16px';
			toastContainer.style.bottom = '16px';
			toastContainer.style.zIndex = '10060';
			toastContainer.style.display = 'flex';
			toastContainer.style.flexDirection = 'column';
			toastContainer.style.gap = '8px';
			document.body.appendChild(toastContainer);
		}

		const toast = document.createElement('div');
		toast.style.minWidth = '220px';
		toast.style.maxWidth = '360px';
		toast.style.padding = '10px 12px';
		toast.style.borderRadius = '10px';
		toast.style.border = '1px solid var(--border-color, #404040)';
		toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
		toast.style.fontSize = '13px';
		toast.style.lineHeight = '1.35';
		toast.style.opacity = '0';
		toast.style.transform = 'translateY(8px)';
		toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
		toast.style.background = type === 'error'
			? 'var(--presentation-modal-close-bg, #e53935)'
			: (type === 'info' ? 'var(--panel-background, #222426)' : 'var(--presentation-export-bg, var(--accent-color, #4f46e5))');
		toast.style.color = 'var(--presentation-export-color, #ffffff)';
		toast.textContent = message;

		toastContainer.appendChild(toast);
		requestAnimationFrame(() => {
			toast.style.opacity = '1';
			toast.style.transform = 'translateY(0)';
		});

		setTimeout(() => {
			toast.style.opacity = '0';
			toast.style.transform = 'translateY(8px)';
			setTimeout(() => {
				if (toast.parentNode) {
					toast.parentNode.removeChild(toast);
				}
				if (toastContainer && toastContainer.childElementCount === 0 && toastContainer.parentNode) {
					toastContainer.parentNode.removeChild(toastContainer);
				}
			}, 220);
		}, 2600);
	}

	static sanitizeHtmlFilename(rawTitle) {
		const base = (rawTitle || 'presentation')
			.toString()
			.trim()
			.replace(/\.[a-z0-9]+$/i, '')
			.replace(/[\\/:*?"<>|]+/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

		return (base || 'presentation').slice(0, 120);
	}

	static async saveHtmlToDisk(title, htmlContent) {
		const filename = `${this.sanitizeHtmlFilename(title)}.html`;
		const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });

		if (window && typeof window.showSaveFilePicker === 'function') {
			try {
				const fileHandle = await window.showSaveFilePicker({
					suggestedName: filename,
					types: [{
						description: 'HTML file',
						accept: { 'text/html': ['.html'] },
					}],
				});
				const writable = await fileHandle.createWritable();
				await writable.write(blob);
				await writable.close();
				return 'saved';
			} catch (error) {
				if (error && error.name === 'AbortError') {
					return 'cancelled';
				}
				console.error('[PromptablePresentation] File picker save failed, falling back to download', error);
			}
		}

		try {
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement('a');
			anchor.href = url;
			anchor.download = filename;
			document.body.appendChild(anchor);
			anchor.click();
			document.body.removeChild(anchor);
			URL.revokeObjectURL(url);
			return 'saved';
		} catch (error) {
			console.error('[PromptablePresentation] Download fallback failed', error);
			return 'failed';
		}
	}

	static getDatabaseApi() {
		let dbApi = (typeof window !== 'undefined' && window.PaiperworkDB)
			? window.PaiperworkDB
			: null;

		if (!dbApi && typeof PaiperworkDB !== 'undefined') {
			dbApi = PaiperworkDB;
		}

		if (dbApi && typeof window !== 'undefined' && !window.PaiperworkDB) {
			window.PaiperworkDB = dbApi;
		}

		return dbApi;
	}

	static ensureContinueButtonForChatAfterPromptedClose() {
		if (!this.promptedContextChanged) {
			return;
		}

		const aiReplies = document.querySelector('.ai-replies');
		if (!aiReplies) {
			this.promptedContextChanged = false;
			return;
		}

		const existingContinueButton = aiReplies.querySelector('.continuation-container');
		if (existingContinueButton) {
			this.promptedContextChanged = false;
			return;
		}

		const assistantMessages = aiReplies.querySelectorAll('.assistant-message');
		const userMessages = aiReplies.querySelectorAll('.user-message');
		const hasOnlyWelcome = (assistantMessages.length === 1 && assistantMessages[0].classList.contains('welcome-message'));
		const hasChatGoingOn = !hasOnlyWelcome && (assistantMessages.length > 0 || userMessages.length > 0);

		if (!hasChatGoingOn) {
			this.promptedContextChanged = false;
			return;
		}

		const systemPromptElement = document.getElementById('system-prompt');
		const currentSystemPrompt = systemPromptElement ? systemPromptElement.value : '';

		if (window.chatInstance && typeof window.chatInstance.handleSystemPromptChange === 'function') {
			window.chatInstance.handleSystemPromptChange(currentSystemPrompt, true);
			this.promptedContextChanged = false;
			return;
		}

		if (window.chat && typeof window.chat.handleSystemPromptChange === 'function') {
			window.chat.handleSystemPromptChange(currentSystemPrompt, true);
			this.promptedContextChanged = false;
			return;
		}

		if (window.OllamaAPI && typeof window.OllamaAPI.resetContext === 'function') {
			window.OllamaAPI.resetContext();
		}

		if (window.OllamaAPI && typeof window.OllamaAPI.createContinueButton === 'function') {
			const conversations = [];

			const lastUserBubble = userMessages.length > 0
				? userMessages[userMessages.length - 1].querySelector('.message-bubble')
				: null;
			if (lastUserBubble && lastUserBubble.innerHTML) {
				conversations.push({ role: 'user', message: lastUserBubble.innerHTML });
			}

			const lastAssistantMessage = assistantMessages.length > 0
				? assistantMessages[assistantMessages.length - 1]
				: null;
			const lastAssistantContainer = lastAssistantMessage
				? lastAssistantMessage.querySelector('.ai-response-container')
				: null;
			if (lastAssistantContainer && lastAssistantContainer.innerHTML) {
				conversations.push({ role: 'assistant', message: lastAssistantContainer.innerHTML });
			}

			if (conversations.length > 0) {
				const continueButton = window.OllamaAPI.createContinueButton(conversations, aiReplies);
				aiReplies.appendChild(continueButton);
			}
		}

		this.promptedContextChanged = false;
	}

	static async refreshSavedPresentations() {
		if (!this.sidebarList || !this.sidebarEmpty) {
			return;
		}

		const hashedMasterKey = this.getActiveHashedMasterKey();
		const dbApi = this.getDatabaseApi();
		if (!hashedMasterKey || !dbApi || typeof dbApi.getPromptablePresentations !== 'function') {
			this.sidebarList.innerHTML = '';
			this.sidebarEmpty.style.display = 'block';
			return;
		}

		this.sidebarList.innerHTML = '';
		this.sidebarEmpty.style.display = 'block';
		this.sidebarEmpty.textContent = window.Lang
			? (Lang.get('promptableSidebarLoading') || 'Loading saved presentations...')
			: 'Loading presentations...';

		const savedItems = await dbApi.getPromptablePresentations(hashedMasterKey);
		this.sidebarList.innerHTML = '';
		this.sidebarList.style.display = 'flex';
		this.sidebarList.style.flexDirection = 'column';
		this.sidebarList.style.alignItems = 'center';
		this.sidebarEmpty.textContent = window.Lang
			? (Lang.get('promptableSidebarEmpty') || 'No saved presentations yet.')
			: 'No saved presentations yet.';
		this.sidebarEmpty.style.display = savedItems.length ? 'none' : 'block';

		savedItems.forEach((item) => {
			const card = document.createElement('div');
			card.style.width = 'calc(100% - 12px)';
			card.style.maxWidth = '292px';
			card.style.display = 'block';
			card.style.border = '1px solid var(--border-color, #404040)';
			card.style.background = 'var(--background-color, #18181b)';
			card.style.borderRadius = '10px';
			card.style.padding = '7px';
			card.style.marginBottom = '10px';
			card.style.marginLeft = 'auto';
			card.style.marginRight = 'auto';
			card.style.textAlign = 'left';
			card.style.color = 'var(--text-color, #ffffff)';
			card.style.cursor = 'pointer';

			const openBtn = document.createElement('button');
			openBtn.type = 'button';
			openBtn.style.width = '100%';
			openBtn.style.display = 'block';
			openBtn.style.border = '0';
			openBtn.style.padding = '0';
			openBtn.style.margin = '0';
			openBtn.style.background = 'transparent';
			openBtn.style.color = 'inherit';
			openBtn.style.cursor = 'pointer';
			openBtn.style.textAlign = 'left';

			const thumb = document.createElement('div');
			thumb.style.width = '100%';
			thumb.style.aspectRatio = '16 / 9';
			thumb.style.borderRadius = '8px';
			thumb.style.border = '1px solid var(--border-color, #404040)';
			thumb.style.background = 'var(--panel-background, #222426)';
			thumb.style.display = 'flex';
			thumb.style.alignItems = 'center';
			thumb.style.justifyContent = 'center';
			thumb.style.padding = '8px';
			thumb.style.boxSizing = 'border-box';

			const thumbText = document.createElement('div');
			thumbText.textContent = item.title || 'Presentation';
			thumbText.style.fontSize = '12px';
			thumbText.style.lineHeight = '1.3';
			thumbText.style.textAlign = 'center';
			thumbText.style.opacity = '0.92';
			thumbText.style.wordBreak = 'break-word';
			thumb.appendChild(thumbText);

			const title = document.createElement('div');
			title.textContent = item.title || 'Presentation';
			title.style.marginTop = '5px';
			title.style.fontSize = '12px';
			title.style.lineHeight = '1.2';
			title.style.fontWeight = '600';
			title.style.whiteSpace = 'nowrap';
			title.style.overflow = 'hidden';
			title.style.textOverflow = 'ellipsis';

			const time = document.createElement('div');
			time.textContent = this.formatDateLabel(item.updated_at || item.created_at);
			time.style.fontSize = '10px';
			time.style.opacity = '0.75';
			time.style.marginTop = '2px';

			openBtn.appendChild(thumb);
			openBtn.appendChild(title);
			openBtn.appendChild(time);

			const actions = document.createElement('div');
			actions.style.display = 'flex';
			actions.style.gap = '6px';
			actions.style.justifyContent = 'flex-end';
			actions.style.marginTop = '8px';

			const saveToDiskBtn = document.createElement('button');
			saveToDiskBtn.type = 'button';
			saveToDiskBtn.textContent = window.Lang ? (Lang.get('saveToDiskButton') || 'Save to disk') : 'Save to disk';
			saveToDiskBtn.style.height = '30px';
			saveToDiskBtn.style.padding = '0 10px';
			saveToDiskBtn.style.border = '1px solid var(--border-color, #404040)';
			saveToDiskBtn.style.borderRadius = '8px';
			saveToDiskBtn.style.cursor = 'pointer';
			saveToDiskBtn.style.background = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
			saveToDiskBtn.style.color = 'var(--presentation-export-color, #ffffff)';
			saveToDiskBtn.style.fontSize = '12px';

			const deleteBtn = document.createElement('button');
			deleteBtn.type = 'button';
			deleteBtn.textContent = window.Lang ? (Lang.get('deleteButton') || 'Delete') : 'Delete';
			deleteBtn.style.height = '30px';
			deleteBtn.style.padding = '0 10px';
			deleteBtn.style.border = '1px solid var(--border-color, #404040)';
			deleteBtn.style.borderRadius = '8px';
			deleteBtn.style.cursor = 'pointer';
			deleteBtn.style.background = 'var(--presentation-modal-close-bg, #e53935)';
			deleteBtn.style.color = 'var(--presentation-modal-close-icon-color, #ffffff)';
			deleteBtn.style.fontSize = '12px';

			actions.appendChild(saveToDiskBtn);
			actions.appendChild(deleteBtn);
			card.appendChild(openBtn);
			card.appendChild(actions);

			const openSavedPresentation = async () => {
				if (!this.renderArea || !hashedMasterKey) {
					return;
				}

				const resolvedDbApi = this.getDatabaseApi();
				if (!resolvedDbApi || typeof resolvedDbApi.loadPromptablePresentationHtml !== 'function') {
					this.renderArea.innerHTML = `<div style="padding:12px;color:#ef4444;">${window.Lang ? (Lang.get('presentationError') || 'Database API unavailable.') : 'Database API unavailable.'}</div>`;
					return;
				}

				this.renderArea.innerHTML = `<div style="padding:12px;opacity:0.8;">${window.Lang ? (Lang.get('loadingPresentation') || 'Loading presentation...') : 'Loading presentation...'}</div>`;
				const html = await resolvedDbApi.loadPromptablePresentationHtml(hashedMasterKey, item.id);
				if (!html) {
					this.renderArea.innerHTML = `<div style="padding:12px;color:#ef4444;">${window.Lang ? (Lang.get('presentationError') || 'Could not load presentation.') : 'Could not load presentation.'}</div>`;
					return;
				}

				this.setPresentationHtml(html);
			};

			openBtn.addEventListener('click', async (event) => {
				event.preventDefault();
				event.stopPropagation();
				await openSavedPresentation();
			});

			card.addEventListener('click', async () => {
				await openSavedPresentation();
			});

			saveToDiskBtn.addEventListener('click', async (event) => {
				event.preventDefault();
				event.stopPropagation();

				const resolvedDbApi = this.getDatabaseApi();
				if (!hashedMasterKey || !resolvedDbApi || typeof resolvedDbApi.loadPromptablePresentationHtml !== 'function') {
					return;
				}

				saveToDiskBtn.disabled = true;
				try {
					const html = await resolvedDbApi.loadPromptablePresentationHtml(hashedMasterKey, item.id);
					if (!html) {
						this.showToastMessage(
							window.Lang ? (Lang.get('saveToDiskFailed') || 'Could not save presentation to disk.') : 'Could not save presentation to disk.',
							'error'
						);
						return;
					}

					const saveResult = await this.saveHtmlToDisk(item.title || 'presentation', html);
					if (saveResult === 'saved') {
						this.showToastMessage(
							window.Lang ? (Lang.get('saveToDiskSuccess') || 'Presentation saved to disk.') : 'Presentation saved to disk.',
							'success'
						);
					} else if (saveResult === 'cancelled') {
						this.showToastMessage(
							window.Lang ? (Lang.get('saveToDiskCancelled') || 'Save to disk cancelled.') : 'Save to disk cancelled.',
							'info'
						);
					} else {
						this.showToastMessage(
							window.Lang ? (Lang.get('saveToDiskFailed') || 'Could not save presentation to disk.') : 'Could not save presentation to disk.',
							'error'
						);
					}
				} finally {
					saveToDiskBtn.disabled = false;
				}
			});

			deleteBtn.addEventListener('click', async (event) => {
				event.stopPropagation();
				const resolvedDbApi = this.getDatabaseApi();
				if (!hashedMasterKey || !resolvedDbApi || typeof resolvedDbApi.deletePromptablePresentation !== 'function') {
					return;
				}

				const confirmMessage = window.Lang
					? (Lang.get('confirmDeletePresentation') || 'Are you sure you want to delete this presentation?')
					: 'Are you sure you want to delete this presentation?';
				if (!confirm(confirmMessage)) {
					return;
				}

				deleteBtn.disabled = true;
				const deleted = await resolvedDbApi.deletePromptablePresentation(hashedMasterKey, item.id);
				if (!deleted) {
					deleteBtn.disabled = false;
					return;
				}

				if (this.currentPresentationHtml && this.extractPresentationTitle(this.currentPresentationHtml) === (item.title || '')) {
					this.currentPresentationHtml = '';
				}

				await this.refreshSavedPresentations();
			});

			this.sidebarList.appendChild(card);
		});
	}

	static getFullscreenTarget() {
		if (!this.renderArea) {
			return null;
		}

		const frame = this.renderArea.querySelector('.promptable-presentation-frame');
		return frame || this.renderArea;
	}

	static updateFullscreenButtonLabel() {
		if (!this.fullscreenBtn) {
			return;
		}

		const isFullscreen = !!document.fullscreenElement;
		this.fullscreenBtn.textContent = window.Lang
			? Lang.get(isFullscreen ? 'paperworkExitFullscreen' : 'paperworkFullscreen')
			: (isFullscreen ? 'Exit Fullscreen' : 'Fullscreen');
	}

	static async toggleFullscreen() {
		const target = this.getFullscreenTarget();
		if (!target) {
			return;
		}

		try {
			if (document.fullscreenElement) {
				await document.exitFullscreen();
			} else {
				await target.requestFullscreen();
			}
		} catch (error) {
			console.error('Failed to toggle fullscreen:', error);
		}
	}

	static getSelectedModel() {
		const modelSelector = document.getElementById('model-selector');
		return modelSelector ? modelSelector.value : '';
	}

	static getSelectedContextSize() {
		const contextSelector = document.getElementById('context-selector');
		const value = contextSelector ? parseInt(contextSelector.value, 10) : 8192;
		return Number.isFinite(value) ? value : 8192;
	}

	static buildArtisticPresentationSystemPrompt() {
		return [
			'You are an expert artistic HTML presentation creator.',
			'Your job is to produce a visually rich presentation as a single, self-contained HTML document.',
            'The first slide is always the main title and subtitle slide.',
            'Create differentiated and visually appealing differentiated backgrounds for each slide using SVG that effectively communicate the provided content.',
			'Use online image URLs (https://...) to enrich slides, NEVER use them as backgrounds. this images must always match the slide content and be relevant to the topic.',
			'ALWAYS use all text content provided by the user in the exact same order as provided; do not reorder any part of the text.',
			'Respect the exact number of slides requested by the user.',
			'Output MUST be only one HTML document and nothing else.',
			'Do not output markdown fences, explanations, or notes.',
			'Use semantic HTML and JS with inline CSS so it renders directly when injected into a container.',
			'Each slide should be clearly separated (for example with section elements and fixed-height slide blocks).',
            'Always use prev/next arrows for slide navigation.',
            'Do not output markdown fences, explanations, or notes.'
		].join(' ');
	}

	static cleanHtmlResponse(rawText) {
		if (!rawText) {
			return '';
		}

		let cleaned = rawText.trim();

		if (cleaned.startsWith('```')) {
			cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, '');
			cleaned = cleaned.replace(/\s*```$/, '');
		}

		return cleaned.trim();
	}

	static buildUserPrompt(slideCount, sourceText) {
		return this.buildUserPromptWithExtra(slideCount, sourceText, '');
	}

	static buildUserPromptWithExtra(slideCount, sourceText, extraRequestText) {
		const parts = [
			`Create a presentation with exactly ${slideCount} slides.`
		];

		if (extraRequestText && String(extraRequestText).trim()) {
			parts.push(
				'Apply the following extra presentation requests first (style/layout/image treatment):',
				String(extraRequestText).trim()
			);
		}

		parts.push(
			'Use the following text as the source content, preserving order, meaning and integrity:',
			sourceText
		);

		return parts.join('\n\n');
	}

	static updateTextActionButtons() {
		if (this.addTextBtn) {
			const hasSourceText = (this.savedSourceText || '').trim().length > 0;
			this.addTextBtn.textContent = hasSourceText
				? (window.Lang ? (Lang.get('editTextButton') || 'Edit presentation text') : 'Edit presentation text')
				: (window.Lang ? (Lang.get('addTextButton') || 'Add text') : 'Add text');
		}

		if (this.extraRequestBtn) {
			const hasExtraRequest = (this.savedExtraRequestText || '').trim().length > 0;
			this.extraRequestBtn.textContent = hasExtraRequest
				? (window.Lang ? (Lang.get('editExtraRequestButton') || 'Edit extra request') : 'Edit extra request')
				: (window.Lang ? (Lang.get('extraRequestButton') || 'Extra request') : 'Extra request');
		}
	}

	static openSourceTextEditor() {
		this.openTextEditor('source');
	}

	static openExtraRequestEditor() {
		this.openTextEditor('extra');
	}

	static openTextEditor(mode = 'source') {
		if (this.textEditorOverlay && document.body.contains(this.textEditorOverlay)) {
			return;
		}

		const isExtraRequestEditor = mode === 'extra';

		const editorOverlay = document.createElement('div');
		editorOverlay.style.position = 'fixed';
		editorOverlay.style.inset = '0';
		editorOverlay.style.zIndex = '10020';
		editorOverlay.style.background = 'var(--modal-overlay-bg, rgba(30, 30, 30, 0.7))';
		editorOverlay.style.backdropFilter = 'blur(6px)';
		editorOverlay.style.webkitBackdropFilter = 'blur(6px)';
		editorOverlay.style.display = 'flex';
		editorOverlay.style.alignItems = 'center';
		editorOverlay.style.justifyContent = 'center';

		const editorWindow = document.createElement('div');
		editorWindow.style.width = 'min(900px, 92vw)';
		editorWindow.style.height = 'min(620px, 82vh)';
		editorWindow.style.background = 'var(--presentation-modal-bg, var(--panel-background, #222426))';
		editorWindow.style.border = '1px solid var(--border-color, #404040)';
		editorWindow.style.borderRadius = '12px';
		editorWindow.style.boxShadow = 'var(--presentation-modal-box-shadow, 0 8px 32px rgba(0,0,0,0.18))';
		editorWindow.style.display = 'flex';
		editorWindow.style.flexDirection = 'column';
		editorWindow.style.padding = '12px';
		editorWindow.style.boxSizing = 'border-box';

		const editorTop = document.createElement('div');
		editorTop.style.display = 'flex';
		editorTop.style.justifyContent = 'space-between';
		editorTop.style.alignItems = 'center';
		editorTop.style.marginBottom = '10px';

		const editorTitle = document.createElement('div');
		editorTitle.textContent = isExtraRequestEditor
			? (window.Lang ? (Lang.get('extraRequestButton') || 'Extra request') : 'Extra request')
			: (window.Lang ? (Lang.get('addTextButton') || 'Add text') : 'Add text');
		editorTitle.style.fontWeight = '600';
		editorTitle.style.color = 'var(--text-color, #ffffff)';

		const closeEditorBtn = document.createElement('button');
		closeEditorBtn.type = 'button';
		closeEditorBtn.textContent = window.Lang ? (Lang.get('closeButton') || 'Close') : 'Close';
		closeEditorBtn.style.height = '34px';
		closeEditorBtn.style.padding = '0 12px';
		closeEditorBtn.style.border = '1px solid var(--border-color, #404040)';
		closeEditorBtn.style.borderRadius = '8px';
		closeEditorBtn.style.cursor = 'pointer';
		closeEditorBtn.style.background = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
		closeEditorBtn.style.color = 'var(--presentation-export-color, #ffffff)';

		const textArea = document.createElement('textarea');
		textArea.style.flex = '1 1 auto';
		textArea.style.width = '100%';
		textArea.style.resize = 'none';
		textArea.style.padding = '12px';
		textArea.style.borderRadius = '10px';
		textArea.style.border = '1px solid var(--border-color, #404040)';
		textArea.style.background = 'var(--background-color, #18181b)';
		textArea.style.color = 'var(--text-color, #ffffff)';
		textArea.style.boxSizing = 'border-box';
		textArea.style.outline = 'none';
		textArea.style.fontSize = '17px';
		textArea.style.lineHeight = '1.5';
		textArea.value = isExtraRequestEditor ? (this.savedExtraRequestText || '') : (this.savedSourceText || '');
        this.textEditorTextArea = textArea;
		this.activeEditorMode = mode;

		const closeEditor = () => {
			if (isExtraRequestEditor) {
				this.savedExtraRequestText = textArea.value || '';
			} else {
				this.savedSourceText = textArea.value || '';
			}
			this.updateTextActionButtons();
			if (editorOverlay && document.body.contains(editorOverlay)) {
				document.body.removeChild(editorOverlay);
			}
			this.textEditorOverlay = null;
			this.textEditorTextArea = null;
			this.activeEditorMode = null;
		};

		closeEditorBtn.addEventListener('click', closeEditor);
		editorOverlay.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				closeEditor();
			}
		});

		editorTop.appendChild(editorTitle);
		editorTop.appendChild(closeEditorBtn);
		editorWindow.appendChild(editorTop);
		editorWindow.appendChild(textArea);
		editorOverlay.appendChild(editorWindow);
		document.body.appendChild(editorOverlay);
		editorOverlay.setAttribute('tabindex', '-1');
		editorOverlay.focus();
		textArea.focus();
		this.textEditorOverlay = editorOverlay;
	}

	static async generatePresentationHtml(userText, abortSignal = null) {
		const model = this.getSelectedModel();
		if (!model) {
			throw new Error(window.Lang ? (Lang.get('selectModelPrompt') || 'Please select a model first.') : 'Please select a model first.');
		}

		const promptPayload = userText;

		const requestBody = {
			model,
			system: this.buildArtisticPresentationSystemPrompt(),
			prompt: promptPayload,
			stream: false,
			options: {
				num_ctx: this.getSelectedContextSize(),
			},
		};

		const response = await fetch('http://localhost:11434/api/generate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(requestBody),
			signal: abortSignal,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Ollama error (${response.status}): ${errorText}`);
		}

		const data = await response.json();
		const htmlResponse = this.cleanHtmlResponse(data && data.response ? data.response : '');

		if (!htmlResponse) {
			throw new Error('Model returned an empty HTML response.');
		}

		return htmlResponse;
	}

	static open({ onClose } = {}) {
		if (this.overlay && document.body.contains(this.overlay)) {
			return;
		}

		const overlay = document.createElement('div');
		overlay.className = 'promptable-presentation-overlay';
		overlay.style.position = 'fixed';
		overlay.style.top = '0';
		overlay.style.left = '0';
		overlay.style.width = '100vw';
		overlay.style.height = '100vh';
		overlay.style.zIndex = '10000';
		overlay.style.background = 'var(--modal-overlay-bg, rgba(30, 30, 30, 0.7))';
		overlay.style.backdropFilter = 'blur(8px)';
		overlay.style.webkitBackdropFilter = 'blur(8px)';
		overlay.style.display = 'flex';
		overlay.style.flexDirection = 'column';
		overlay.style.boxSizing = 'border-box';

		const topBar = document.createElement('div');
		topBar.style.display = 'flex';
		topBar.style.justifyContent = 'flex-end';
		topBar.style.alignItems = 'center';
		topBar.style.padding = '10px 12px';
		topBar.style.background = 'var(--presentation-modal-bg, var(--panel-background, #222426))';
		topBar.style.borderBottom = '1px solid var(--border-color, #404040)';
		topBar.style.boxShadow = 'var(--presentation-modal-box-shadow, 0 2px 8px rgba(0,0,0,0.18))';
		topBar.style.flex = '0 0 auto';

		const workspace = document.createElement('div');
		workspace.className = 'promptable-presentation-workspace';
		workspace.style.display = 'flex';
		workspace.style.flex = '1 1 auto';
		workspace.style.minHeight = '0';
		workspace.style.padding = '20px';
		workspace.style.paddingTop = '20px';
		workspace.style.gap = '20px';

		const canvasHost = document.createElement('div');
		canvasHost.className = 'promptable-presentation-canvas-host';
		canvasHost.style.flex = '1 1 auto';
		canvasHost.style.minWidth = '0';
		canvasHost.style.display = 'flex';
		canvasHost.style.alignItems = 'stretch';
		canvasHost.style.justifyContent = 'stretch';

		const renderArea = document.createElement('div');
		renderArea.className = 'promptable-presentation-render-area';
		renderArea.style.width = '100%';
		renderArea.style.maxWidth = '100%';
		renderArea.style.aspectRatio = '16 / 9';
		renderArea.style.background = 'var(--presentation-modal-bg, var(--panel-background, #222426))';
		renderArea.style.border = '1px solid var(--border-color, #404040)';
		renderArea.style.borderRadius = '12px';
		renderArea.style.boxShadow = 'var(--presentation-modal-box-shadow, 0 8px 32px rgba(0,0,0,0.18))';
		renderArea.style.color = 'var(--presentation-modal-text, var(--text-color, #ffffff))';
		renderArea.style.padding = '16px';
		renderArea.style.overflow = 'auto';
		renderArea.style.boxSizing = 'border-box';
		renderArea.style.fontFamily = 'inherit';

		const sidebar = document.createElement('aside');
		sidebar.className = 'promptable-presentation-sidebar';
		sidebar.style.width = '320px';
		sidebar.style.flex = '0 0 320px';
		sidebar.style.background = 'var(--presentation-modal-bg, var(--panel-background, #222426))';
		sidebar.style.border = '1px solid var(--border-color, #404040)';
		sidebar.style.borderRadius = '12px';
		sidebar.style.boxShadow = 'var(--presentation-modal-box-shadow, 0 8px 32px rgba(0,0,0,0.18))';
		sidebar.style.color = 'var(--presentation-modal-text, var(--text-color, #ffffff))';
		sidebar.style.padding = '12px';
		sidebar.style.boxSizing = 'border-box';
		sidebar.style.overflow = 'auto';

		const sidebarTitle = document.createElement('div');
		sidebarTitle.textContent = window.Lang
			? (Lang.get('promptableSidebarTitle') || 'Saved presentations')
			: 'Saved presentations';
		sidebarTitle.style.fontWeight = '600';
		sidebarTitle.style.marginBottom = '10px';

		const sidebarPlaceholder = document.createElement('div');
		sidebarPlaceholder.textContent = window.Lang
			? (Lang.get('promptableSidebarEmpty') || 'No saved presentations yet.')
			: 'No saved presentations yet.';
		sidebarPlaceholder.style.opacity = '0.8';
		sidebarPlaceholder.style.fontSize = '13px';

		const sidebarList = document.createElement('div');
		sidebarList.style.marginTop = '10px';

		sidebar.appendChild(sidebarTitle);
		sidebar.appendChild(sidebarPlaceholder);
		sidebar.appendChild(sidebarList);
		canvasHost.appendChild(renderArea);
		workspace.appendChild(canvasHost);
		workspace.appendChild(sidebar);

		const bottomBar = document.createElement('div');
		bottomBar.className = 'promptable-presentation-bottom';
		bottomBar.style.flex = '0 0 auto';
		bottomBar.style.display = 'flex';
		bottomBar.style.justifyContent = 'center';
		bottomBar.style.alignItems = 'center';
		bottomBar.style.gap = '10px';
		bottomBar.style.padding = '12px 16px 16px 16px';
		bottomBar.style.background = 'var(--presentation-modal-bg, var(--panel-background, #222426))';
		bottomBar.style.borderTop = '1px solid var(--border-color, #404040)';
		bottomBar.style.flexWrap = 'wrap';

		const slidesLabel = document.createElement('label');
		slidesLabel.textContent = window.Lang
			? (Lang.get('numberOfSlidesLabel') || 'Number of slides:')
			: 'Number of slides:';
		slidesLabel.style.color = 'var(--text-color, #ffffff)';
		slidesLabel.style.fontSize = '14px';
		slidesLabel.style.fontWeight = '600';

		const slideCountSelector = document.createElement('select');
		slideCountSelector.style.height = '40px';
		slideCountSelector.style.padding = '0 12px';
		slideCountSelector.style.borderRadius = '8px';
		slideCountSelector.style.border = '1px solid var(--border-color, #404040)';
		slideCountSelector.style.background = 'var(--background-color, #18181b)';
		slideCountSelector.style.color = 'var(--text-color, #ffffff)';
		slideCountSelector.style.outline = 'none';
		for (let i = 1; i <= 20; i += 1) {
			const option = document.createElement('option');
			option.value = String(i);
			option.textContent = String(i);
			slideCountSelector.appendChild(option);
		}
		slideCountSelector.value = '8';

		const addTextBtn = document.createElement('button');
		addTextBtn.type = 'button';
		addTextBtn.textContent = window.Lang ? (Lang.get('addTextButton') || 'Add text') : 'Add text';
		addTextBtn.style.height = '40px';
		addTextBtn.style.padding = '0 16px';
		addTextBtn.style.border = '1px solid var(--presentation-export-border, transparent)';
		addTextBtn.style.borderRadius = '8px';
		addTextBtn.style.cursor = 'pointer';
		addTextBtn.style.background = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
		addTextBtn.style.color = 'var(--presentation-export-color, #ffffff)';
		addTextBtn.addEventListener('click', () => {
			this.openSourceTextEditor();
		});

		const extraRequestBtn = document.createElement('button');
		extraRequestBtn.type = 'button';
		extraRequestBtn.textContent = window.Lang ? (Lang.get('extraRequestButton') || 'Extra request') : 'Extra request';
		extraRequestBtn.style.height = '40px';
		extraRequestBtn.style.padding = '0 16px';
		extraRequestBtn.style.border = '1px solid var(--presentation-export-border, transparent)';
		extraRequestBtn.style.borderRadius = '8px';
		extraRequestBtn.style.cursor = 'pointer';
		extraRequestBtn.style.background = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
		extraRequestBtn.style.color = 'var(--presentation-export-color, #ffffff)';
		extraRequestBtn.addEventListener('click', () => {
			this.openExtraRequestEditor();
		});

		const sendBtn = document.createElement('button');
		sendBtn.type = 'button';
		sendBtn.textContent = window.Lang ? Lang.get('sendButton') : 'Send';
		sendBtn.style.height = '40px';
		sendBtn.style.padding = '0 16px';
		sendBtn.style.border = '1px solid var(--presentation-export-border, transparent)';
		sendBtn.style.borderRadius = '8px';
		sendBtn.style.cursor = 'pointer';
		sendBtn.style.background = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
		sendBtn.style.color = 'var(--presentation-export-color, #ffffff)';
		sendBtn.style.transition = 'background 0.2s, color 0.2s';

		sendBtn.addEventListener('click', async () => {
			if (this.currentAbortController) {
				this.currentAbortController.abort();
				return;
			}

			const selectedSlides = parseInt(slideCountSelector.value, 10) || 1;
			const sourceText = (this.savedSourceText || '').trim();
			const extraRequestText = (this.savedExtraRequestText || '').trim();
			if (!sourceText) {
				alert(window.Lang
					? (Lang.get('promptTextRequired') || 'Please click "Add text" and provide presentation content first.')
					: 'Please click "Add text" and provide presentation content first.');
				return;
			}
			const userPrompt = extraRequestText
				? this.buildUserPromptWithExtra(selectedSlides, sourceText, extraRequestText)
				: this.buildUserPrompt(selectedSlides, sourceText);

			const previousSendLabel = sendBtn.textContent;
			const previousSendBackground = sendBtn.style.background;
			const previousSendColor = sendBtn.style.color;
			const abortController = new AbortController();
			this.currentAbortController = abortController;

			sendBtn.disabled = false;
			sendBtn.textContent = window.Lang ? (Lang.get('cancelButton') || 'Cancel') : 'Cancel';
			sendBtn.style.background = '#ef4444';
			sendBtn.style.color = '#ffffff';
			slideCountSelector.disabled = true;
			addTextBtn.disabled = true;
			extraRequestBtn.disabled = true;
			renderArea.innerHTML = `<div style="padding:12px;opacity:0.8;">${window.Lang ? (Lang.get('generatingSlideForge') || 'Generating SlideForge...') : 'Generating SlideForge...'}</div>`;

			try {
				this.promptedContextChanged = true;
				const htmlContent = await this.generatePresentationHtml(userPrompt, abortController.signal);
				this.setPresentationHtml(htmlContent);
				await this.refreshSavedPresentations();
			} catch (error) {
				if (error && error.name === 'AbortError') {
					renderArea.innerHTML = `<div style="padding:12px;opacity:0.8;">${window.Lang ? (Lang.get('cancelButton') || 'Cancelled') : 'Cancelled'}</div>`;
				} else {
					console.error('Promptable presentation generation failed:', error);
					renderArea.innerHTML = `<div style="padding:12px;color:#ef4444;white-space:pre-wrap;">${String(error.message || error)}</div>`;
				}
			} finally {
				this.currentAbortController = null;
				sendBtn.textContent = previousSendLabel;
				sendBtn.style.background = previousSendBackground;
				sendBtn.style.color = previousSendColor;
				sendBtn.disabled = false;
				slideCountSelector.disabled = false;
				addTextBtn.disabled = false;
				extraRequestBtn.disabled = false;
			}
		});

		const saveBtn = document.createElement('button');
		saveBtn.type = 'button';
		saveBtn.textContent = window.Lang ? Lang.get('savePresentation') : 'Save presentation';
		saveBtn.style.height = '40px';
		saveBtn.style.padding = '0 16px';
		saveBtn.style.border = '1px solid var(--presentation-export-border, transparent)';
		saveBtn.style.borderRadius = '8px';
		saveBtn.style.cursor = 'pointer';
		saveBtn.style.background = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
		saveBtn.style.color = 'var(--presentation-export-color, #ffffff)';
		saveBtn.addEventListener('click', async () => {
			console.info('[PromptablePresentation] Save presentation clicked');
			const hashedMasterKey = this.getActiveHashedMasterKey();
			if (!hashedMasterKey) {
				console.error('[PromptablePresentation] Save blocked: missing active hashed master key');
				alert(window.Lang ? (Lang.get('presentationError') || 'Master key not found.') : 'Master key not found.');
				return;
			}

			const dbApi = this.getDatabaseApi();
			if (!dbApi || typeof dbApi.savePromptablePresentation !== 'function') {
				console.error('[PromptablePresentation] Save blocked: PaiperworkDB.savePromptablePresentation API unavailable', {
					hasWindowPaiperworkDB: !!(typeof window !== 'undefined' && window.PaiperworkDB),
					hasGlobalPaiperworkDB: typeof PaiperworkDB !== 'undefined',
					saveMethodType: dbApi ? typeof dbApi.savePromptablePresentation : 'undefined'
				});
				alert(window.Lang ? (Lang.get('presentationError') || 'Database API unavailable.') : 'Database API unavailable.');
				return;
			}

			const htmlToSave = (this.currentPresentationHtml || '').trim();
			if (!htmlToSave) {
				console.error('[PromptablePresentation] Save blocked: no current presentation HTML available', {
					hasCurrentPresentationHtml: !!this.currentPresentationHtml,
					htmlLength: this.currentPresentationHtml ? String(this.currentPresentationHtml).length : 0
				});
				alert(window.Lang ? (Lang.get('presentationError') || 'No presentation HTML to save.') : 'No presentation HTML to save.');
				return;
			}

			saveBtn.disabled = true;
			const previousLabel = saveBtn.textContent;
			saveBtn.textContent = window.Lang ? (Lang.get('savingButton') || 'Saving...') : 'Saving...';

			try {
				const title = this.extractPresentationTitle(htmlToSave);
				console.info('[PromptablePresentation] Saving presentation to DB', {
					title,
					htmlLength: htmlToSave.length,
					hasMasterKey: !!hashedMasterKey,
					masterKeyPrefix: String(hashedMasterKey).slice(0, 8)
				});
				await dbApi.savePromptablePresentation(hashedMasterKey, {
					title,
					html: htmlToSave,
				});
				console.info('[PromptablePresentation] Save completed, refreshing saved presentations list');
				await this.refreshSavedPresentations();
				console.info('[PromptablePresentation] Saved presentations list refreshed');
			} catch (error) {
				console.error('[PromptablePresentation] Failed to save promptable presentation', {
					error,
					message: error && error.message ? error.message : String(error),
					stack: error && error.stack ? error.stack : null,
					htmlLength: htmlToSave.length,
					hasMasterKey: !!hashedMasterKey,
					masterKeyPrefix: String(hashedMasterKey).slice(0, 8)
				});
				alert(window.Lang ? (Lang.get('presentationError') || 'Could not save presentation.') : 'Could not save presentation.');
			} finally {
				saveBtn.disabled = false;
				saveBtn.textContent = previousLabel;
				console.info('[PromptablePresentation] Save flow finished');
			}
		});

		const fullscreenBtn = document.createElement('button');
		fullscreenBtn.type = 'button';
		fullscreenBtn.textContent = window.Lang ? Lang.get('paperworkFullscreen') : 'Fullscreen';
		fullscreenBtn.style.height = '40px';
		fullscreenBtn.style.padding = '0 16px';
		fullscreenBtn.style.border = '1px solid var(--presentation-export-border, transparent)';
		fullscreenBtn.style.borderRadius = '8px';
		fullscreenBtn.style.cursor = 'pointer';
		fullscreenBtn.style.background = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
		fullscreenBtn.style.color = 'var(--presentation-export-color, #ffffff)';
		fullscreenBtn.addEventListener('click', () => {
			this.toggleFullscreen();
		});

		const rightControlsSpacer = document.createElement('div');
		rightControlsSpacer.style.width = '200px';
		rightControlsSpacer.style.flex = '0 0 200px';

		bottomBar.appendChild(slidesLabel);
		bottomBar.appendChild(slideCountSelector);
		bottomBar.appendChild(addTextBtn);
		bottomBar.appendChild(extraRequestBtn);
		bottomBar.appendChild(sendBtn);
		bottomBar.appendChild(rightControlsSpacer);
		bottomBar.appendChild(fullscreenBtn);
		bottomBar.appendChild(saveBtn);

		const closeBtn = document.createElement('button');
		closeBtn.type = 'button';
		closeBtn.innerHTML = '&times;';
		closeBtn.setAttribute('aria-label', 'Close promptable presentation window');
		closeBtn.style.width = '36px';
		closeBtn.style.height = '36px';
		closeBtn.style.border = '1px solid var(--presentation-modal-close-border, transparent)';
		closeBtn.style.borderRadius = '8px';
		closeBtn.style.background = 'var(--presentation-modal-close-bg, #e53935)';
		closeBtn.style.color = 'var(--presentation-modal-close-icon-color, #ffffff)';
		closeBtn.style.cursor = 'pointer';
		closeBtn.style.fontSize = '26px';
		closeBtn.style.lineHeight = '1';
		closeBtn.style.boxShadow = 'var(--presentation-modal-close-box-shadow, 0 2px 8px rgba(0,0,0,0.18))';
		closeBtn.style.transition = 'background 0.2s, box-shadow 0.2s, color 0.2s';

		closeBtn.addEventListener('mouseover', () => {
			closeBtn.style.background = 'var(--presentation-modal-close-hover-bg, #b71c1c)';
			closeBtn.style.color = 'var(--presentation-modal-close-hover-color, var(--presentation-modal-close-icon-color, #ffffff))';
			closeBtn.style.boxShadow = 'var(--presentation-modal-close-hover-shadow, 0 4px 16px rgba(229,57,53,0.25))';
		});

		closeBtn.addEventListener('mouseout', () => {
			closeBtn.style.background = 'var(--presentation-modal-close-bg, #e53935)';
			closeBtn.style.color = 'var(--presentation-modal-close-icon-color, #ffffff)';
			closeBtn.style.boxShadow = 'var(--presentation-modal-close-box-shadow, 0 2px 8px rgba(0,0,0,0.18))';
		});

		const closeWindow = () => {
			if (this.textEditorTextArea) {
				if (this.activeEditorMode === 'extra') {
					this.savedExtraRequestText = this.textEditorTextArea.value || this.savedExtraRequestText || '';
				} else {
					this.savedSourceText = this.textEditorTextArea.value || this.savedSourceText || '';
				}
			}
			if (this.textEditorOverlay && document.body.contains(this.textEditorOverlay)) {
				document.body.removeChild(this.textEditorOverlay);
				this.textEditorOverlay = null;
				this.textEditorTextArea = null;
				this.activeEditorMode = null;
			}
			if (this.currentAbortController) {
				this.currentAbortController.abort();
				this.currentAbortController = null;
			}
			if (this.fullscreenChangeHandler) {
				document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler);
				this.fullscreenChangeHandler = null;
			}
			if (overlay && document.body.contains(overlay)) {
				document.body.removeChild(overlay);
			}
			this.overlay = null;
			this.ensureContinueButtonForChatAfterPromptedClose();
			if (typeof onClose === 'function') {
				onClose();
			}
		};

		closeBtn.addEventListener('click', closeWindow);
		overlay.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				closeWindow();
			}
		});

		this.fullscreenChangeHandler = () => {
			this.updateFullscreenButtonLabel();
		};
		document.addEventListener('fullscreenchange', this.fullscreenChangeHandler);

		topBar.appendChild(closeBtn);
		overlay.appendChild(topBar);
		overlay.appendChild(workspace);
		overlay.appendChild(bottomBar);

		document.body.appendChild(overlay);
		overlay.setAttribute('tabindex', '-1');
		overlay.focus();
		this.overlay = overlay;
		this.renderArea = renderArea;
		this.addTextBtn = addTextBtn;
		this.extraRequestBtn = extraRequestBtn;
		this.slideCountSelector = slideCountSelector;
		this.fullscreenBtn = fullscreenBtn;
		this.sidebarList = sidebarList;
		this.sidebarEmpty = sidebarPlaceholder;
		this.updateTextActionButtons();
		this.updateFullscreenButtonLabel();
		this.refreshSavedPresentations();
	}

	static setPresentationHtml(htmlContent) {
		if (!this.renderArea) {
			return;
		}

		this.currentPresentationHtml = htmlContent || '';

		this.renderArea.innerHTML = '';

		const frame = document.createElement('iframe');
		frame.className = 'promptable-presentation-frame';
		frame.style.width = '100%';
		frame.style.height = '100%';
		frame.style.border = '0';
		frame.style.borderRadius = '10px';
		frame.style.background = 'transparent';
		frame.setAttribute('allowfullscreen', 'true');
		frame.srcdoc = htmlContent || '';

		this.renderArea.appendChild(frame);
	}
}

window.PromptedPresentationWorkflow = PromptedPresentationWorkflow;
