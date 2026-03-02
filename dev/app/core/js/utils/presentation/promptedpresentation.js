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

	static async promptPresentationName(defaultTitle = '') {
		return new Promise((resolve) => {
			const untitledLabel = window.Lang
				? (Lang.get('untitledPresentation') || 'Untitled presentation')
				: 'Untitled presentation';
			const initialName = (defaultTitle || '').trim() || untitledLabel;

			const overlay = document.createElement('div');
			overlay.style.position = 'fixed';
			overlay.style.inset = '0';
			overlay.style.zIndex = '10040';
			overlay.style.background = 'var(--modal-overlay-bg, rgba(30, 30, 30, 0.7))';
			overlay.style.backdropFilter = 'blur(5px)';
			overlay.style.webkitBackdropFilter = 'blur(5px)';
			overlay.style.display = 'flex';
			overlay.style.alignItems = 'center';
			overlay.style.justifyContent = 'center';

			const modal = document.createElement('div');
			modal.style.width = 'min(460px, 92vw)';
			modal.style.background = 'var(--presentation-modal-bg, var(--panel-background, #222426))';
			modal.style.border = '1px solid var(--border-color, #404040)';
			modal.style.borderRadius = '12px';
			modal.style.boxShadow = 'var(--presentation-modal-box-shadow, 0 8px 32px rgba(0,0,0,0.18))';
			modal.style.padding = '14px';
			modal.style.boxSizing = 'border-box';

			const title = document.createElement('div');
			title.textContent = window.Lang
				? (Lang.get('presentationNameDialogTitle') || 'Name your presentation')
				: 'Save presentation';
			title.style.fontSize = '16px';
			title.style.fontWeight = '600';
			title.style.color = 'var(--text-color, #ffffff)';
			title.style.marginBottom = '10px';

			const input = document.createElement('input');
			input.type = 'text';
			input.value = initialName;
			input.placeholder = window.Lang
				? (Lang.get('presentationNamePlaceholder') || 'Enter presentation name')
				: 'Enter presentation name';
			input.style.width = '100%';
			input.style.height = '38px';
			input.style.padding = '0 10px';
			input.style.borderRadius = '8px';
			input.style.border = '1px solid var(--border-color, #404040)';
			input.style.background = 'var(--background-color, #18181b)';
			input.style.color = 'var(--text-color, #ffffff)';
			input.style.outline = 'none';
			input.style.boxSizing = 'border-box';

			const actions = document.createElement('div');
			actions.style.marginTop = '12px';
			actions.style.display = 'flex';
			actions.style.justifyContent = 'flex-end';
			actions.style.gap = '8px';

			const cancelBtn = document.createElement('button');
			cancelBtn.type = 'button';
			cancelBtn.textContent = window.Lang ? (Lang.get('cancel') || 'Cancel') : 'Cancel';
			cancelBtn.style.height = '34px';
			cancelBtn.style.padding = '0 12px';
			cancelBtn.style.border = '1px solid var(--border-color, #404040)';
			cancelBtn.style.borderRadius = '8px';
			cancelBtn.style.cursor = 'pointer';
			cancelBtn.style.background = 'var(--background-color, #18181b)';
			cancelBtn.style.color = 'var(--text-color, #ffffff)';

			const saveBtn = document.createElement('button');
			saveBtn.type = 'button';
			saveBtn.textContent = window.Lang ? (Lang.get('save') || 'Save') : 'Save';
			saveBtn.style.height = '34px';
			saveBtn.style.padding = '0 12px';
			saveBtn.style.border = '1px solid var(--presentation-export-border, transparent)';
			saveBtn.style.borderRadius = '8px';
			saveBtn.style.cursor = 'pointer';
			saveBtn.style.background = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
			saveBtn.style.color = 'var(--presentation-export-color, #ffffff)';

			const closeAndResolve = (value) => {
				if (overlay && overlay.parentNode) {
					overlay.parentNode.removeChild(overlay);
				}
				resolve(value);
			};

			overlay.addEventListener('click', (event) => {
				if (event.target === overlay) {
					closeAndResolve(null);
				}
			});

			cancelBtn.addEventListener('click', () => closeAndResolve(null));
			saveBtn.addEventListener('click', () => closeAndResolve((input.value || '').trim()));

			input.addEventListener('keydown', (event) => {
				if (event.key === 'Enter') {
					event.preventDefault();
					closeAndResolve((input.value || '').trim());
				} else if (event.key === 'Escape') {
					event.preventDefault();
					closeAndResolve(null);
				}
			});

			actions.appendChild(cancelBtn);
			actions.appendChild(saveBtn);
			modal.appendChild(title);
			modal.appendChild(input);
			modal.appendChild(actions);
			overlay.appendChild(modal);
			document.body.appendChild(overlay);

			setTimeout(() => {
				input.focus();
				input.select();
			}, 0);
		});
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
			thumb.style.height = '78px';
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

			const time = document.createElement('div');
			const isScrollableMode = String(item.mode || 'html').toLowerCase() === 'pdf';
			const modeLabel = isScrollableMode
				? (window.Lang ? (Lang.get('scrollableModeButton') || 'Scrollable mode') : 'Scrollable mode')
				: (window.Lang ? (Lang.get('interactiveModeButton') || 'Interactive mode') : 'Interactive mode');
			time.textContent = `${this.formatDateLabel(item.updated_at || item.created_at)} · ${modeLabel}`;
			time.style.fontSize = '9px';
			time.style.opacity = '0.75';
			time.style.marginTop = '4px';

			openBtn.appendChild(thumb);
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
				const previousSaveLabel = saveToDiskBtn.textContent;
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
						const successKey = 'saveToDiskSuccessHtml';
						const successFallback = 'HTML presentation saved to disk.';
						this.showToastMessage(
							window.Lang ? (Lang.get(successKey) || Lang.get('saveToDiskSuccess') || successFallback) : successFallback,
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
					saveToDiskBtn.textContent = previousSaveLabel;
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

	static buildPdfPresentationSystemPrompt() {
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
            'Create one presentation in html (vertically scrollable, every slide will occupy 100% of the viewport and all will be shown at the same time) with vertically stacked different slides (first one is the cover) and pictures.',
            'You can link online pictures, from the  text below, make each slide different and make the backgrounds beautiful using SVG ornaments.',
            '1. Use the CSS property break-after: page on each slide.', 
            '2. Remove any overflow: hidden, scroll-snap, or height: 100vh restrictions inside the print media query so the content flows naturally onto pages.', 
		].join(' ');
	}

	static applyModeButtonStyles() {
		if (!this.htmlModeBtn || !this.pdfModeBtn) {
			return;
		}

		const activeBackground = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
		const activeColor = 'var(--presentation-export-color, #ffffff)';
		const inactiveBackground = 'var(--background-color, #18181b)';
		const inactiveColor = 'var(--text-color, #ffffff)';

		const isHtmlMode = this.selectedPresentationMode !== 'pdf';

		this.htmlModeBtn.style.background = isHtmlMode ? activeBackground : inactiveBackground;
		this.htmlModeBtn.style.color = isHtmlMode ? activeColor : inactiveColor;
		this.htmlModeBtn.style.border = isHtmlMode
			? '1px solid var(--presentation-export-border, transparent)'
			: '1px solid var(--border-color, #404040)';

		this.pdfModeBtn.style.background = isHtmlMode ? inactiveBackground : activeBackground;
		this.pdfModeBtn.style.color = isHtmlMode ? inactiveColor : activeColor;
		this.pdfModeBtn.style.border = isHtmlMode
			? '1px solid var(--border-color, #404040)'
			: '1px solid var(--presentation-export-border, transparent)';
	}

	static setPresentationMode(mode) {
		this.selectedPresentationMode = mode === 'pdf' ? 'pdf' : 'html';
		this.applyModeButtonStyles();
	}

	static applyWebSearchToggleStyles() {
		if (!this.promptableWebSearchBtn) {
			return;
		}

		const activeBackground = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
		const activeColor = 'var(--presentation-export-color, #ffffff)';
		const inactiveBackground = 'var(--background-color, #18181b)';
		const inactiveColor = 'var(--text-color, #ffffff)';

		this.promptableWebSearchBtn.style.background = this.isPromptableWebSearchEnabled ? activeBackground : inactiveBackground;
		this.promptableWebSearchBtn.style.color = this.isPromptableWebSearchEnabled ? activeColor : inactiveColor;
		this.promptableWebSearchBtn.style.border = this.isPromptableWebSearchEnabled
			? '1px solid var(--presentation-export-border, transparent)'
			: '1px solid var(--border-color, #404040)';
	}

	static updatePromptableWebSearchUiState() {
		this.applyWebSearchToggleStyles();

		if (this.addTextBtn) {
			this.addTextBtn.textContent = this.isPromptableWebSearchEnabled
				? (window.Lang ? (Lang.get('webSearchPromptButton') || 'Web search prompt') : 'Web search prompt')
				: (window.Lang ? (Lang.get('addTextButton') || 'Add text') : 'Add text');
		}

		if (this.webSearchStateLabel) {
			this.webSearchStateLabel.textContent = this.isPromptableWebSearchEnabled
				? (window.Lang ? (Lang.get('webSearchStateOn') || 'Web ON') : 'Web ON')
				: (window.Lang ? (Lang.get('webSearchStateOff') || 'Web OFF') : 'Web OFF');
			this.webSearchStateLabel.style.color = this.isPromptableWebSearchEnabled
				? 'var(--presentation-export-bg, var(--accent-color, #4f46e5))'
				: 'var(--text-color, #ffffff)';
			this.webSearchStateLabel.style.opacity = this.isPromptableWebSearchEnabled ? '1' : '0.75';
		}
	}

	static async ensureWebSearchModuleLoaded() {
		if (typeof window.WebSearch !== 'undefined') {
			if (window.WebSearch && typeof window.WebSearch.initializeWebSearchReferences === 'function') {
				window.WebSearch.initializeWebSearchReferences();
			}
			return true;
		}

		if (!window.tabLoader || typeof window.tabLoader.loadFeatureScripts !== 'function') {
			throw new Error('Web search loader unavailable.');
		}

		await window.tabLoader.loadFeatureScripts('websearch');
		await new Promise((resolve) => setTimeout(resolve, 100));

		if (window.WebSearch && typeof window.WebSearch.initializeWebSearchReferences === 'function') {
			window.WebSearch.initializeWebSearchReferences();
		}

		if (typeof window.WebSearch === 'undefined' || typeof window.WebSearch.smartSearch !== 'function') {
			throw new Error('Web search module failed to initialize.');
		}

		return true;
	}

	static async buildOptimizedWebSearchQuery(sourceText, abortSignal = null) {
		const originalText = String(sourceText || '').trim();
		if (!originalText) {
			return '';
		}

		const fallbackQuery = originalText.split(/\s+/).slice(0, 12).join(' ').trim();
		const model = this.getSelectedModel();
		if (!model) {
			return fallbackQuery || originalText;
		}

		const queryPrompt = [
			'Based on the user content below, create a VERY SHORT web search query (10-15 words) that best captures the likely intent.',
			'Return ONLY the search query words with no explanations, no quotes, and no extra text.',
			'',
			'User content:',
			originalText
		].join('\n');

		const requestBody = {
			model,
			system: window.Lang
				? (Lang.get('searchQueryOptimizerPrompt') || 'You generate concise web search queries.')
				: 'You generate concise web search queries.',
			prompt: queryPrompt,
			stream: false,
			options: {
				num_ctx: this.getSelectedContextSize(),
			},
		};

		try {
			const response = await fetch('http://localhost:11434/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
				signal: abortSignal,
			});

			if (!response.ok) {
				return fallbackQuery || originalText;
			}

			const data = await response.json();
			const optimized = String(data && data.response ? data.response : '')
				.trim()
				.replace(/^```[a-zA-Z]*\s*/, '')
				.replace(/\s*```$/, '')
				.replace(/^['"]+|['"]+$/g, '')
				.replace(/^search\s+for\s+|^find\s+|^query\s+|^search\s+/i, '')
				.replace(/\s+/g, ' ')
				.replace(/\.$/, '')
				.trim();

			return optimized || fallbackQuery || originalText;
		} catch (error) {
			if (error && error.name === 'AbortError') {
				throw error;
			}
			return fallbackQuery || originalText;
		}
	}

	static async buildWebSearchSourceText(sourceText, abortSignal = null) {
		await this.ensureWebSearchModuleLoaded();

		const querySeed = String(sourceText || '').trim();
		if (!querySeed) {
			return '';
		}

		const searchAbortController = new AbortController();
		if (abortSignal) {
			if (abortSignal.aborted) {
				throw new DOMException('Aborted', 'AbortError');
			}
			abortSignal.addEventListener('abort', () => {
				try {
					searchAbortController.abort();
				} catch (_error) {
				}
			}, { once: true });
		}

		const optimizedQuery = await this.buildOptimizedWebSearchQuery(querySeed, abortSignal);
		const finalQuery = String(optimizedQuery || querySeed).trim() || querySeed;

		const searchResults = await window.WebSearch.smartSearch(finalQuery, searchAbortController, false);
		const items = Array.isArray(searchResults && searchResults.items) ? searchResults.items : [];

		if (!items.length) {
			return '';
		}

		const normalizedItems = items
			.filter((item) => item && (item.title || item.snippet || item.link))
			.slice(0, 6)
			.map((item, index) => {
				const title = String(item.title || `Result ${index + 1}`).trim();
				const url = String(item.link || '').trim();
				const snippet = String(item.snippet || '').replace(/\s+/g, ' ').trim();
				const extracted = String(item.extractedContent || item.pageContent || item.summary || '')
					.replace(/\s+/g, ' ')
					.trim();

				const lines = [
					`${index + 1}. ${title}`,
					url ? `Source: ${url}` : '',
					snippet ? `Snippet: ${snippet.slice(0, 500)}` : '',
					extracted ? `Details: ${extracted.slice(0, 1200)}` : '',
				].filter(Boolean);

				return lines.join('\n');
			})
			.filter(Boolean);

		if (!normalizedItems.length) {
			return '';
		}

		return [
			'Topic provided by user:',
			querySeed,
			'',
			'Optimized web search query:',
			finalQuery,
			'',
			'Web research results to use as presentation content:',
			normalizedItems.join('\n\n')
		].join('\n');
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
		return this.buildUserPromptWithExtra(slideCount, sourceText, '', false);
	}

	static buildUserPromptWithExtra(slideCount, sourceText, extraRequestText, removeWebSearchMentions = false) {
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
			'If the provided content includes picture/image links, use those links in relevant slides whenever possible, fall back to your own images sources if required.'
		);

		if (removeWebSearchMentions) {
			parts.push(
				'Do not mention or imply that any content comes from web search, search results, or web research.',
				'Avoid labels/disclaimers like "Sources provided via Web Research", "Based on web results", "Search results", or any similar phrasing.',
				'Be verbose and content-rich when writing slide text from this material.',
				'Expand key points with concrete details, context, and useful explanations so the presentation feels substantial rather than succinct.'
			);
		}

		parts.push(
			'Use the following text as the source content, preserving order, meaning and integrity:',
			sourceText
		);

		return parts.join('\n\n');
	}

	static resetPromptableImageSelectionVisuals() {
		if (!this.promptableSelectedImage) {
			return;
		}

		try {
			this.promptableSelectedImage.style.outline = this.promptableSelectedImage.dataset.pwPromptableOutline || '';
			this.promptableSelectedImage.style.outlineOffset = this.promptableSelectedImage.dataset.pwPromptableOutlineOffset || '';
			delete this.promptableSelectedImage.dataset.pwPromptableOutline;
			delete this.promptableSelectedImage.dataset.pwPromptableOutlineOffset;
		} catch (_error) {
		}

		this.promptableSelectedImage = null;
	}

	static updatePromptableImageEditorStatus(message, type = 'info') {
		if (!this.promptableImageEditorStatus) {
			return;
		}

		this.promptableImageEditorStatus.textContent = message || '';
		this.promptableImageEditorStatus.style.color = type === 'error'
			? '#ef4444'
			: 'var(--text-color, #ffffff)';
		this.promptableImageEditorStatus.style.opacity = type === 'muted' ? '0.75' : '1';
	}

	static ensurePromptableImageEditorPanel() {
		if (this.promptableImageEditorPanel && this.overlay && this.overlay.contains(this.promptableImageEditorPanel)) {
			return;
		}

		if (!this.overlay) {
			return;
		}

		const panel = document.createElement('div');
		panel.style.position = 'absolute';
		panel.style.left = '50%';
		panel.style.top = '50%';
		panel.style.transform = 'translate(-50%, -50%)';
		panel.style.width = '340px';
		panel.style.maxHeight = '55vh';
		panel.style.display = 'flex';
		panel.style.flexDirection = 'column';
		panel.style.gap = '8px';
		panel.style.padding = '10px';
		panel.style.borderRadius = '10px';
		panel.style.border = '1px solid var(--border-color, #404040)';
		panel.style.background = 'var(--presentation-modal-bg, var(--panel-background, #222426))';
		panel.style.boxShadow = 'var(--presentation-modal-box-shadow, 0 8px 32px rgba(0,0,0,0.18))';
		panel.style.zIndex = '10030';

		const title = document.createElement('div');
		title.textContent = window.Lang
			? (Lang.get('replaceImageLabel') || 'Replace image')
			: 'Replace image';
		title.style.fontWeight = '600';
		title.style.fontSize = '13px';

		const inputRow = document.createElement('div');
		inputRow.style.display = 'flex';
		inputRow.style.alignItems = 'center';
		inputRow.style.gap = '8px';

		const searchInput = document.createElement('input');
		searchInput.type = 'text';
		searchInput.placeholder = window.Lang
			? (Lang.get('searchImagesPlaceholder') || 'Search images')
			: 'Search images';
		searchInput.style.flex = '1 1 auto';
		searchInput.style.height = '34px';
		searchInput.style.padding = '0 10px';
		searchInput.style.borderRadius = '8px';
		searchInput.style.border = '1px solid var(--border-color, #404040)';
		searchInput.style.background = 'var(--background-color, #18181b)';
		searchInput.style.color = 'var(--text-color, #ffffff)';
		searchInput.style.outline = 'none';

		const searchBtn = document.createElement('button');
		searchBtn.type = 'button';
		searchBtn.textContent = window.Lang ? (Lang.get('searchButton') || 'Search') : 'Search';
		searchBtn.style.height = '34px';
		searchBtn.style.padding = '0 12px';
		searchBtn.style.borderRadius = '8px';
		searchBtn.style.border = '1px solid var(--presentation-export-border, transparent)';
		searchBtn.style.cursor = 'pointer';
		searchBtn.style.background = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
		searchBtn.style.color = 'var(--presentation-export-color, #ffffff)';

		inputRow.appendChild(searchInput);
		inputRow.appendChild(searchBtn);

		const status = document.createElement('div');
		status.style.fontSize = '12px';
		status.style.lineHeight = '1.35';
		status.style.minHeight = '16px';
		status.style.color = 'var(--text-color, #ffffff)';
		status.style.opacity = '0.78';

		const resultGrid = document.createElement('div');
		resultGrid.style.display = 'grid';
		resultGrid.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
		resultGrid.style.gap = '8px';
		resultGrid.style.maxHeight = '260px';
		resultGrid.style.overflow = 'auto';

		const actionRow = document.createElement('div');
		actionRow.style.display = 'flex';
		actionRow.style.justifyContent = 'space-between';
		actionRow.style.gap = '8px';

		const restoreBtn = document.createElement('button');
		restoreBtn.type = 'button';
		restoreBtn.textContent = window.Lang
			? (Lang.get('restoreOriginalButton') || 'Restore original')
			: 'Restore original';
		restoreBtn.style.height = '32px';
		restoreBtn.style.padding = '0 10px';
		restoreBtn.style.borderRadius = '8px';
		restoreBtn.style.border = '1px solid var(--border-color, #404040)';
		restoreBtn.style.cursor = 'pointer';
		restoreBtn.style.background = 'var(--background-color, #18181b)';
		restoreBtn.style.color = 'var(--text-color, #ffffff)';

		const closeBtn = document.createElement('button');
		closeBtn.type = 'button';
		closeBtn.textContent = window.Lang ? (Lang.get('closeButton') || 'Close') : 'Close';
		closeBtn.style.height = '32px';
		closeBtn.style.padding = '0 10px';
		closeBtn.style.borderRadius = '8px';
		closeBtn.style.border = '1px solid var(--border-color, #404040)';
		closeBtn.style.cursor = 'pointer';
		closeBtn.style.background = 'var(--background-color, #18181b)';
		closeBtn.style.color = 'var(--text-color, #ffffff)';

		actionRow.appendChild(restoreBtn);
		actionRow.appendChild(closeBtn);

		panel.appendChild(title);
		panel.appendChild(inputRow);
		panel.appendChild(status);
		panel.appendChild(resultGrid);
		panel.appendChild(actionRow);

		this.overlay.appendChild(panel);

		this.promptableImageEditorPanel = panel;
		this.promptableImageEditorInput = searchInput;
		this.promptableImageEditorSearchBtn = searchBtn;
		this.promptableImageEditorStatus = status;
		this.promptableImageEditorResults = resultGrid;
		this.promptableImageEditorRestoreBtn = restoreBtn;

		const runSearch = async () => {
			await this.searchPromptableImagesFromEditor();
		};

		searchBtn.addEventListener('click', () => {
			runSearch();
		});

		searchInput.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				runSearch();
			}
		});

		restoreBtn.addEventListener('click', () => {
			this.restorePromptableSelectedImage();
		});

		closeBtn.addEventListener('click', () => {
			if (panel && panel.parentNode) {
				panel.parentNode.removeChild(panel);
			}
			this.promptableImageEditorPanel = null;
			this.promptableImageEditorInput = null;
			this.promptableImageEditorSearchBtn = null;
			this.promptableImageEditorStatus = null;
			this.promptableImageEditorResults = null;
			this.promptableImageEditorRestoreBtn = null;
			this.resetPromptableImageSelectionVisuals();
		});

		this.updatePromptableImageEditorStatus(
			window.Lang
				? (Lang.get('clickImageToEdit') || 'Click an image in the presentation to replace it.')
				: 'Click an image in the presentation to replace it.',
			'muted'
		);

		this.positionPromptableImageEditorPanelCentered();
	}

	static positionPromptableImageEditorPanelCentered(frame = null) {
		const panel = this.promptableImageEditorPanel;
		const activeFrame = frame || this.promptableEditingFrame || this.promptableFrame || (this.renderArea ? this.renderArea.querySelector('.promptable-presentation-frame') : null);
		if (!panel || !this.overlay) {
			return;
		}

		const overlayRect = this.overlay.getBoundingClientRect();
		if (!overlayRect || !Number.isFinite(overlayRect.top)) {
			return;
		}

		let left = overlayRect.width / 2;
		let top = overlayRect.height / 2;

		if (activeFrame) {
			const frameRect = activeFrame.getBoundingClientRect();
			if (frameRect && Number.isFinite(frameRect.left) && Number.isFinite(frameRect.top)) {
				left = (frameRect.left - overlayRect.left) + (frameRect.width / 2);
				top = (frameRect.top - overlayRect.top) + (frameRect.height / 2);
			}
		}

		panel.style.left = `${Math.round(left)}px`;
		panel.style.top = `${Math.round(top)}px`;
		panel.style.transform = 'translate(-50%, -50%)';
		panel.style.right = 'auto';
		panel.style.bottom = 'auto';
	}

	static extractPromptableSearchImageUrls(payload) {
		const urls = [];

		const visit = (value, depth = 0) => {
			if (!value || depth > 6) {
				return;
			}

			if (typeof value === 'string') {
				if (/^https?:\/\//i.test(value)) {
					urls.push(value);
				}
				return;
			}

			if (Array.isArray(value)) {
				value.forEach((item) => visit(item, depth + 1));
				return;
			}

			if (typeof value === 'object') {
				const candidates = ['imageUrl', 'url', 'src', 'previewURL', 'largeImageURL', 'thumb', 'thumbnail', 'webformatURL'];
				candidates.forEach((key) => {
					if (typeof value[key] === 'string' && /^https?:\/\//i.test(value[key])) {
						urls.push(value[key]);
					}
				});
				Object.values(value).forEach((nested) => visit(nested, depth + 1));
			}
		};

		visit(payload, 0);
		return Array.from(new Set(urls)).filter(Boolean);
	}

	static async searchPromptableImageUrls(query, count = 18) {
		const q = String(query || '').trim();
		if (!q) {
			return [];
		}

		let urls = [];

		try {
			const multiResp = await fetch(`/api/proxy/image-search-multi?q=${encodeURIComponent(q)}`);
			if (multiResp && multiResp.ok) {
				const multiData = await multiResp.json();
				let multiList = [];
				if (Array.isArray(multiData && multiData.images)) {
					multiList = multiData.images;
				} else if (Array.isArray(multiData && multiData.results)) {
					multiList = multiData.results;
				} else if (Array.isArray(multiData && multiData.hits)) {
					multiList = multiData.hits;
				}

				multiList.forEach((entry) => {
					if (typeof entry === 'string' && /^https?:\/\//i.test(entry)) {
						urls.push(entry);
						return;
					}
					if (!entry || typeof entry !== 'object') {
						return;
					}
					const candidate = entry.imageUrl || entry.url || entry.src || entry.webformatURL || '';
					if (typeof candidate === 'string' && /^https?:\/\//i.test(candidate)) {
						urls.push(candidate);
					}
				});
			}
		} catch (error) {
			console.warn('[PromptablePresentation] Multi image search failed', error);
		}

		if (urls.length < count) {
			try {
				const singleResp = await fetch(`/api/proxy/image-search?q=${encodeURIComponent(q)}`);
				if (singleResp && singleResp.ok) {
					const singleData = await singleResp.json();
					urls = urls.concat(this.extractPromptableSearchImageUrls(singleData));
				}
			} catch (error) {
				console.warn('[PromptablePresentation] Single image search fallback failed', error);
			}
		}

		return Array.from(new Set(urls)).filter((url) => /^https?:\/\//i.test(url)).slice(0, count);
	}

	static serializePromptableFrameDocument(frame) {
		if (!frame || !frame.contentDocument || !frame.contentDocument.documentElement) {
			return this.currentPresentationHtml || '';
		}

		const doc = frame.contentDocument;
		let doctype = '';
		if (doc.doctype && doc.doctype.name) {
			doctype = `<!DOCTYPE ${doc.doctype.name}`;
			if (doc.doctype.publicId) {
				doctype += ` PUBLIC \"${doc.doctype.publicId}\"`;
			}
			if (doc.doctype.systemId) {
				doctype += `${doc.doctype.publicId ? '' : ' SYSTEM'} \"${doc.doctype.systemId}\"`;
			}
			doctype += '>';
		}

		const body = doc.documentElement.outerHTML;
		return doctype ? `${doctype}\n${body}` : body;
	}

	static syncPromptableCurrentHtmlFromFrame(frame = null) {
		const targetFrame = frame || this.promptableEditingFrame || (this.renderArea ? this.renderArea.querySelector('.promptable-presentation-frame') : null);
		if (!targetFrame) {
			return;
		}
		this.currentPresentationHtml = this.serializePromptableFrameDocument(targetFrame);
	}

	static getPromptableImageStableId(imageElement) {
		if (!imageElement) {
			return '';
		}

		let imageId = imageElement.getAttribute('data-pw-promptable-image-id') || '';
		if (!imageId) {
			imageId = `pwimg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
			imageElement.setAttribute('data-pw-promptable-image-id', imageId);
		}

		return imageId;
	}

	static selectPromptableImage(imageElement, frame) {
		if (!imageElement || !frame) {
			return;
		}

		this.resetPromptableImageSelectionVisuals();
		this.ensurePromptableImageEditorPanel();

		const imageId = this.getPromptableImageStableId(imageElement);
		if (!this.promptableImageOriginalSrcById) {
			this.promptableImageOriginalSrcById = {};
		}

		if (!this.promptableImageOriginalSrcById[imageId]) {
			this.promptableImageOriginalSrcById[imageId] = imageElement.getAttribute('src') || imageElement.currentSrc || '';
		}

		imageElement.dataset.pwPromptableOutline = imageElement.style.outline || '';
		imageElement.dataset.pwPromptableOutlineOffset = imageElement.style.outlineOffset || '';
		imageElement.style.outline = '3px solid var(--accent-color, #4f46e5)';
		imageElement.style.outlineOffset = '2px';

		this.promptableSelectedImage = imageElement;
		this.promptableEditingFrame = frame;
		this.positionPromptableImageEditorPanelCentered(frame);
		this.updatePromptableImageEditorStatus(
			window.Lang
				? (Lang.get('imageSelectedStatus') || 'Image selected. Search and click a thumbnail to replace it.')
				: 'Image selected. Search and click a thumbnail to replace it.',
			'info'
		);

		if (this.promptableImageEditorInput) {
			this.promptableImageEditorInput.focus();
		}
	}

	static renderPromptableImageSearchResults(urls) {
		if (!this.promptableImageEditorResults) {
			return;
		}

		this.promptableImageEditorResults.innerHTML = '';
		(urls || []).forEach((url) => {
			if (!/^https?:\/\//i.test(String(url || '').trim())) {
				return;
			}
			const thumbBtn = document.createElement('button');
			thumbBtn.type = 'button';
			thumbBtn.style.padding = '0';
			thumbBtn.style.borderRadius = '8px';
			thumbBtn.style.border = '1px solid var(--border-color, #404040)';
			thumbBtn.style.overflow = 'hidden';
			thumbBtn.style.cursor = 'pointer';
			thumbBtn.style.background = 'var(--background-color, #18181b)';
			thumbBtn.style.height = '74px';

			const img = document.createElement('img');
			img.src = url;
			img.alt = 'search-result';
			img.style.width = '100%';
			img.style.height = '100%';
			img.style.objectFit = 'cover';

			thumbBtn.appendChild(img);
			thumbBtn.addEventListener('click', () => {
				this.replacePromptableSelectedImage(url);
			});

			this.promptableImageEditorResults.appendChild(thumbBtn);
		});

		this.positionPromptableImageEditorPanelCentered();
	}

	static async searchPromptableImagesFromEditor() {
		if (!this.promptableImageEditorInput) {
			return;
		}

		const query = String(this.promptableImageEditorInput.value || '').trim();
		if (!query) {
			this.updatePromptableImageEditorStatus(
				window.Lang ? (Lang.get('searchQueryRequired') || 'Enter an image search query.') : 'Enter an image search query.',
				'muted'
			);
			return;
		}

		this.updatePromptableImageEditorStatus(
			window.Lang ? (Lang.get('searchingImagesLabel') || 'Searching images...') : 'Searching images...',
			'info'
		);

		if (this.promptableImageEditorSearchBtn) {
			this.promptableImageEditorSearchBtn.disabled = true;
		}

		try {
			const urls = await this.searchPromptableImageUrls(query, 18);
			this.renderPromptableImageSearchResults(urls);
			if (!urls.length) {
				this.updatePromptableImageEditorStatus(
					window.Lang ? (Lang.get('webSearchNoResultsFound') || 'No results found') : 'No results found',
					'muted'
				);
				return;
			}

			this.updatePromptableImageEditorStatus(
				window.Lang
					? (Lang.get('clickThumbnailToReplace') || 'Click a thumbnail to replace the selected image.')
					: 'Click a thumbnail to replace the selected image.',
				'info'
			);
		} catch (error) {
			console.error('[PromptablePresentation] Image search failed', error);
			this.updatePromptableImageEditorStatus(
				String(error && error.message ? error.message : error),
				'error'
			);
		} finally {
			if (this.promptableImageEditorSearchBtn) {
				this.promptableImageEditorSearchBtn.disabled = false;
			}
		}
	}

	static replacePromptableSelectedImage(url) {
		if (!this.promptableSelectedImage || !url) {
			this.updatePromptableImageEditorStatus(
				window.Lang
					? (Lang.get('clickImageToEdit') || 'Click an image in the presentation to replace it.')
					: 'Click an image in the presentation to replace it.',
				'muted'
			);
			return;
		}

		const normalizedUrl = String(url || '').trim();
		if (!/^https?:\/\//i.test(normalizedUrl)) {
			this.updatePromptableImageEditorStatus(
				window.Lang
					? (Lang.get('promptableDirectLinkOnly') || 'Only direct image links (http/https) are allowed.')
					: 'Only direct image links (http/https) are allowed.',
				'error'
			);
			return;
		}

		const imageId = this.getPromptableImageStableId(this.promptableSelectedImage);
		if (!this.promptableImageOriginalSrcById) {
			this.promptableImageOriginalSrcById = {};
		}
		if (!this.promptableImageOriginalSrcById[imageId]) {
			this.promptableImageOriginalSrcById[imageId] = this.promptableSelectedImage.getAttribute('src') || this.promptableSelectedImage.currentSrc || '';
		}

		this.promptableSelectedImage.setAttribute('src', normalizedUrl);
		this.promptableSelectedImage.removeAttribute('srcset');
		this.promptableSelectedImage.src = normalizedUrl;
		this.syncPromptableCurrentHtmlFromFrame(this.promptableEditingFrame);

		this.updatePromptableImageEditorStatus(
			window.Lang ? (Lang.get('imageReplacedStatus') || 'Image replaced. You can restore the original at any time.') : 'Image replaced. You can restore the original at any time.',
			'info'
		);
	}

	static restorePromptableSelectedImage() {
		if (!this.promptableSelectedImage) {
			this.updatePromptableImageEditorStatus(
				window.Lang
					? (Lang.get('clickImageToEdit') || 'Click an image in the presentation to replace it.')
					: 'Click an image in the presentation to replace it.',
				'muted'
			);
			return;
		}

		const imageId = this.getPromptableImageStableId(this.promptableSelectedImage);
		const originalSrc = this.promptableImageOriginalSrcById ? this.promptableImageOriginalSrcById[imageId] : '';
		if (!originalSrc) {
			this.updatePromptableImageEditorStatus(
				window.Lang ? (Lang.get('noOriginalImageStored') || 'No original image stored for this element.') : 'No original image stored for this element.',
				'error'
			);
			return;
		}

		this.promptableSelectedImage.setAttribute('src', originalSrc);
		this.promptableSelectedImage.removeAttribute('srcset');
		this.promptableSelectedImage.src = originalSrc;
		this.syncPromptableCurrentHtmlFromFrame(this.promptableEditingFrame);

		this.updatePromptableImageEditorStatus(
			window.Lang ? (Lang.get('imageRestoredStatus') || 'Original image restored.') : 'Original image restored.',
			'info'
		);
	}

	static clearPromptableImageEditorArtifacts() {
		this.resetPromptableImageSelectionVisuals();

		if (this.promptableImageEditorPanel && this.promptableImageEditorPanel.parentNode) {
			this.promptableImageEditorPanel.parentNode.removeChild(this.promptableImageEditorPanel);
		}

		this.promptableImageEditorPanel = null;
		this.promptableImageEditorInput = null;
		this.promptableImageEditorSearchBtn = null;
		this.promptableImageEditorStatus = null;
		this.promptableImageEditorResults = null;
		this.promptableImageEditorRestoreBtn = null;
	}

	static isPromptableEditableTextCandidate(element) {
		if (!element || element.nodeType !== 1) {
			return false;
		}

		const tagName = String(element.tagName || '').toLowerCase();
		const allowedTags = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'blockquote', 'figcaption', 'span', 'div', 'td', 'th']);
		if (!allowedTags.has(tagName)) {
			return false;
		}

		if (element.closest('script,style,noscript,svg,canvas,iframe,button,a,input,textarea,select,option,[contenteditable="false"]')) {
			return false;
		}

		if (element.querySelector('img,video,canvas,svg,iframe,input,textarea,select,button')) {
			return false;
		}

		const textContent = String(element.textContent || '').trim();
		if (!textContent) {
			return false;
		}

		if (tagName === 'div') {
			const allowedInlineChildren = new Set(['span', 'strong', 'em', 'b', 'i', 'u', 'small', 'mark', 'sup', 'sub', 'br']);
			const hasComplexChildren = Array.from(element.children || []).some((child) => !allowedInlineChildren.has(String(child.tagName || '').toLowerCase()));
			if (hasComplexChildren) {
				return false;
			}
		}

		return true;
	}

	static enablePromptableInlineTextEditing(frameDocument, frame) {
		if (!frameDocument || !frame) {
			return;
		}

		if (this.promptableFrameTextDocument && this.promptableFrameTextInputHandler) {
			this.promptableFrameTextDocument.removeEventListener('input', this.promptableFrameTextInputHandler, true);
		}
		if (this.promptableFrameTextDocument && this.promptableFrameTextFocusOutHandler) {
			this.promptableFrameTextDocument.removeEventListener('focusout', this.promptableFrameTextFocusOutHandler, true);
		}
		if (this.promptableFrameTextDocument && this.promptableFrameTextKeydownHandler) {
			this.promptableFrameTextDocument.removeEventListener('keydown', this.promptableFrameTextKeydownHandler, true);
		}

		const styleId = 'pw-promptable-text-edit-style';
		if (!frameDocument.getElementById(styleId)) {
			const textEditStyle = frameDocument.createElement('style');
			textEditStyle.id = styleId;
			textEditStyle.textContent = [
				'[data-pw-editable-text="1"] { cursor: text !important; }',
				'[data-pw-editable-text="1"]:focus { outline: 2px dashed var(--accent-color, #4f46e5) !important; outline-offset: 2px !important; }'
			].join('\n');
			if (frameDocument.head) {
				frameDocument.head.appendChild(textEditStyle);
			}
		}

		const candidates = frameDocument.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,span,div,td,th');
		candidates.forEach((element) => {
			if (!this.isPromptableEditableTextCandidate(element)) {
				return;
			}
			element.setAttribute('data-pw-editable-text', '1');
			element.setAttribute('contenteditable', 'true');
			element.setAttribute('spellcheck', 'false');
		});

		const scheduleSync = () => {
			if (this.promptableTextSyncRaf) {
				cancelAnimationFrame(this.promptableTextSyncRaf);
			}
			this.promptableTextSyncRaf = requestAnimationFrame(() => {
				this.promptableTextSyncRaf = null;
				this.syncPromptableCurrentHtmlFromFrame(frame);
			});
		};

		const textInputHandler = (event) => {
			const target = event && event.target;
			if (!target || typeof target.closest !== 'function') {
				return;
			}
			if (!target.closest('[data-pw-editable-text="1"]')) {
				return;
			}
			scheduleSync();
		};

		const textFocusOutHandler = (event) => {
			const target = event && event.target;
			if (!target || typeof target.closest !== 'function') {
				return;
			}
			if (!target.closest('[data-pw-editable-text="1"]')) {
				return;
			}
			scheduleSync();
		};

		const textKeydownHandler = (event) => {
			const target = event && event.target;
			if (!target || typeof target.closest !== 'function') {
				return;
			}
			if (!target.closest('[data-pw-editable-text="1"]')) {
				return;
			}
			if (event.key === 'Escape') {
				event.preventDefault();
				if (typeof target.blur === 'function') {
					target.blur();
				}
			}
		};

		frameDocument.addEventListener('input', textInputHandler, true);
		frameDocument.addEventListener('focusout', textFocusOutHandler, true);
		frameDocument.addEventListener('keydown', textKeydownHandler, true);

		this.promptableFrameTextDocument = frameDocument;
		this.promptableFrameTextInputHandler = textInputHandler;
		this.promptableFrameTextFocusOutHandler = textFocusOutHandler;
		this.promptableFrameTextKeydownHandler = textKeydownHandler;
	}

	static attachPromptableFrameImageClickHandler(frame) {
		if (!frame) {
			return;
		}

		if (this.promptableFrame && this.promptableFrame !== frame && this.promptableFrameLoadHandler) {
			this.promptableFrame.removeEventListener('load', this.promptableFrameLoadHandler);
		}

		this.promptableFrame = frame;

		const bindDocumentHandler = () => {
			if (!frame.contentDocument) {
				return;
			}

			if (this.promptableFrameDocument && this.promptableFrameImageClickHandler) {
				this.promptableFrameDocument.removeEventListener('click', this.promptableFrameImageClickHandler, true);
			}

			const frameDocument = frame.contentDocument;
			const styleId = 'pw-promptable-image-edit-style';
			if (!frameDocument.getElementById(styleId)) {
				const style = frameDocument.createElement('style');
				style.id = styleId;
				style.textContent = 'img { cursor: pointer !important; }';
				frameDocument.head && frameDocument.head.appendChild(style);
			}

			const imageClickHandler = (event) => {
				if (!event || !event.target || typeof event.target.closest !== 'function') {
					return;
				}
				const imageElement = event.target.closest('img');
				if (!imageElement) {
					return;
				}

				event.preventDefault();
				event.stopPropagation();
				this.selectPromptableImage(imageElement, frame);
			};

			frameDocument.addEventListener('click', imageClickHandler, true);
			this.enablePromptableInlineTextEditing(frameDocument, frame);
			this.promptableFrameDocument = frameDocument;
			this.promptableFrameImageClickHandler = imageClickHandler;
		};

		const onLoad = () => {
			this.clearPromptableImageEditorArtifacts();
			bindDocumentHandler();
		};

		frame.addEventListener('load', onLoad);
		this.promptableFrameLoadHandler = onLoad;

		if (frame.contentDocument && frame.contentDocument.readyState !== 'loading') {
			bindDocumentHandler();
		}
	}

	static teardownPromptableFrameImageClickHandler() {
		if (this.promptableFrame && this.promptableFrameLoadHandler) {
			this.promptableFrame.removeEventListener('load', this.promptableFrameLoadHandler);
		}

		if (this.promptableFrameDocument && this.promptableFrameImageClickHandler) {
			this.promptableFrameDocument.removeEventListener('click', this.promptableFrameImageClickHandler, true);
		}

		if (this.promptableFrameTextDocument && this.promptableFrameTextInputHandler) {
			this.promptableFrameTextDocument.removeEventListener('input', this.promptableFrameTextInputHandler, true);
		}
		if (this.promptableFrameTextDocument && this.promptableFrameTextFocusOutHandler) {
			this.promptableFrameTextDocument.removeEventListener('focusout', this.promptableFrameTextFocusOutHandler, true);
		}
		if (this.promptableFrameTextDocument && this.promptableFrameTextKeydownHandler) {
			this.promptableFrameTextDocument.removeEventListener('keydown', this.promptableFrameTextKeydownHandler, true);
		}
		if (this.promptableTextSyncRaf) {
			cancelAnimationFrame(this.promptableTextSyncRaf);
			this.promptableTextSyncRaf = null;
		}

		this.promptableFrame = null;
		this.promptableFrameLoadHandler = null;
		this.promptableFrameDocument = null;
		this.promptableFrameImageClickHandler = null;
		this.promptableFrameTextDocument = null;
		this.promptableFrameTextInputHandler = null;
		this.promptableFrameTextFocusOutHandler = null;
		this.promptableFrameTextKeydownHandler = null;
		this.promptableEditingFrame = null;
		this.clearPromptableImageEditorArtifacts();
	}

	static updateTextActionButtons() {
		if (this.addTextBtn) {
			this.addTextBtn.textContent = this.isPromptableWebSearchEnabled
				? (window.Lang ? (Lang.get('webSearchPromptButton') || 'Web search prompt') : 'Web search prompt')
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

	static async generatePresentationHtml(userText, abortSignal = null, mode = 'html') {
		const model = this.getSelectedModel();
		if (!model) {
			throw new Error(window.Lang ? (Lang.get('selectModelPrompt') || 'Please select a model first.') : 'Please select a model first.');
		}

		const promptPayload = userText;

		const requestBody = {
			model,
			system: mode === 'pdf'
				? this.buildPdfPresentationSystemPrompt()
				: this.buildArtisticPresentationSystemPrompt(),
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
		bottomBar.style.display = 'grid';
		bottomBar.style.gridTemplateColumns = '1fr auto 1fr';
		bottomBar.style.columnGap = '10px';
		bottomBar.style.alignItems = 'center';
		bottomBar.style.padding = '12px 16px 16px 16px';
		bottomBar.style.background = 'var(--presentation-modal-bg, var(--panel-background, #222426))';
		bottomBar.style.borderTop = '1px solid var(--border-color, #404040)';

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

		this.selectedPresentationMode = 'html';
		this.isPromptableWebSearchEnabled = false;
		this.promptableImageOriginalSrcById = {};
		this.promptableSelectedImage = null;
		this.promptableEditingFrame = null;
		this.promptableFrame = null;
		this.promptableFrameLoadHandler = null;
		this.promptableFrameDocument = null;
		this.promptableFrameImageClickHandler = null;
		this.promptableFrameTextDocument = null;
		this.promptableFrameTextInputHandler = null;
		this.promptableFrameTextFocusOutHandler = null;
		this.promptableFrameTextKeydownHandler = null;
		this.promptableTextSyncRaf = null;
		this.promptableImageEditorPanel = null;
		this.promptableImageEditorInput = null;
		this.promptableImageEditorSearchBtn = null;
		this.promptableImageEditorStatus = null;
		this.promptableImageEditorResults = null;
		this.promptableImageEditorRestoreBtn = null;

		const modeToggleWrap = document.createElement('div');
		modeToggleWrap.style.display = 'flex';
		modeToggleWrap.style.alignItems = 'center';
		modeToggleWrap.style.gap = '8px';

		const htmlModeBtn = document.createElement('button');
		htmlModeBtn.type = 'button';
		htmlModeBtn.textContent = window.Lang
			? (Lang.get('interactiveModeButton') || 'Interactive mode')
			: 'Interactive mode';
		htmlModeBtn.style.height = '40px';
		htmlModeBtn.style.padding = '0 14px';
		htmlModeBtn.style.borderRadius = '8px';
		htmlModeBtn.style.cursor = 'pointer';
		htmlModeBtn.style.transition = 'background 0.2s, color 0.2s, border-color 0.2s';

		const pdfModeBtn = document.createElement('button');
		pdfModeBtn.type = 'button';
		pdfModeBtn.textContent = window.Lang
			? (Lang.get('scrollableModeButton') || 'Scrollable mode')
			: 'Scrollable mode';
		pdfModeBtn.style.height = '40px';
		pdfModeBtn.style.padding = '0 14px';
		pdfModeBtn.style.borderRadius = '8px';
		pdfModeBtn.style.cursor = 'pointer';
		pdfModeBtn.style.transition = 'background 0.2s, color 0.2s, border-color 0.2s';

		htmlModeBtn.addEventListener('click', () => {
			if (this.currentAbortController) {
				return;
			}
			this.setPresentationMode('html');
		});

		pdfModeBtn.addEventListener('click', () => {
			if (this.currentAbortController) {
				return;
			}
			this.setPresentationMode('pdf');
		});

		this.htmlModeBtn = htmlModeBtn;
		this.pdfModeBtn = pdfModeBtn;
		this.applyModeButtonStyles();

		modeToggleWrap.appendChild(htmlModeBtn);
		modeToggleWrap.appendChild(pdfModeBtn);

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

		const webSearchToggleBtn = document.createElement('button');
		webSearchToggleBtn.type = 'button';
		webSearchToggleBtn.textContent = window.Lang ? (Lang.get('useWebSearchButton') || 'Use web search') : 'Use web search';
		webSearchToggleBtn.style.height = '40px';
		webSearchToggleBtn.style.minWidth = '130px';
		webSearchToggleBtn.style.padding = '0 16px';
		webSearchToggleBtn.style.borderRadius = '8px';
		webSearchToggleBtn.style.cursor = 'pointer';
		webSearchToggleBtn.style.marginLeft = '50px';
		webSearchToggleBtn.style.transition = 'background 0.2s, color 0.2s, border-color 0.2s';

		const webSearchStateLabel = document.createElement('span');
		webSearchStateLabel.style.fontSize = '12px';
		webSearchStateLabel.style.marginLeft = '6px';
		webSearchStateLabel.style.color = 'var(--text-color, #ffffff)';
		webSearchStateLabel.style.userSelect = 'none';
		this.webSearchStateLabel = webSearchStateLabel;

		this.promptableWebSearchBtn = webSearchToggleBtn;
		this.updatePromptableWebSearchUiState();

		webSearchToggleBtn.addEventListener('click', async () => {
			if (this.currentAbortController) {
				return;
			}

			const isActivating = !this.isPromptableWebSearchEnabled;
			if (isActivating) {
				const previousLabel = webSearchToggleBtn.textContent;
				webSearchToggleBtn.disabled = true;
				webSearchToggleBtn.textContent = 'Loading...';
				try {
					await this.ensureWebSearchModuleLoaded();
					this.isPromptableWebSearchEnabled = true;
				} catch (error) {
					console.error('[PromptablePresentation] Failed to load web search module', error);
					const webLoadError = String(error && error.message ? error.message : error);
					const translatedWebError = window.Lang ? (Lang.get('webSearchError') || '') : '';
					this.showToastMessage(
						translatedWebError
							? translatedWebError.replace('{error}', webLoadError)
							: `Failed to load web search: ${webLoadError}`,
						'error'
					);
					this.isPromptableWebSearchEnabled = false;
				} finally {
					webSearchToggleBtn.disabled = false;
					webSearchToggleBtn.textContent = previousLabel;
				}
			} else {
				this.isPromptableWebSearchEnabled = false;
			}

			this.updatePromptableWebSearchUiState();
		});

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
			htmlModeBtn.disabled = true;
			pdfModeBtn.disabled = true;
			addTextBtn.disabled = true;
			extraRequestBtn.disabled = true;
			webSearchToggleBtn.disabled = true;
			renderArea.innerHTML = `<div style="padding:12px;opacity:0.8;">${window.Lang ? (Lang.get('generatingSlideForge') || 'Generating SlideForge...') : 'Generating SlideForge...'}</div>`;

			try {
				this.promptedContextChanged = true;
				let effectiveUserPrompt = userPrompt;

				if (this.isPromptableWebSearchEnabled) {
					renderArea.innerHTML = `<div style="padding:12px;opacity:0.8;">${window.Lang ? (Lang.get('webSearchPerformed') || 'Web search performed') : 'Web search performed'}...</div>`;
					const webSearchSourceText = await this.buildWebSearchSourceText(sourceText, abortController.signal);
					if (webSearchSourceText) {
						effectiveUserPrompt = extraRequestText
							? this.buildUserPromptWithExtra(selectedSlides, webSearchSourceText, extraRequestText, true)
							: this.buildUserPromptWithExtra(selectedSlides, webSearchSourceText, '', true);
					} else {
						this.showToastMessage(
							window.Lang ? (Lang.get('webSearchNoResultsFound') || 'No results found') : 'No results found',
							'info'
						);
					}
					renderArea.innerHTML = `<div style="padding:12px;opacity:0.8;">${window.Lang ? (Lang.get('generatingSlideForge') || 'Generating SlideForge...') : 'Generating SlideForge...'}</div>`;
				}

				const selectedMode = this.selectedPresentationMode === 'pdf' ? 'pdf' : 'html';
				const htmlContent = await this.generatePresentationHtml(effectiveUserPrompt, abortController.signal, selectedMode);
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
				htmlModeBtn.disabled = false;
				pdfModeBtn.disabled = false;
				addTextBtn.disabled = false;
				extraRequestBtn.disabled = false;
				webSearchToggleBtn.disabled = false;
				this.updatePromptableWebSearchUiState();
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

			const defaultTitle = this.extractPresentationTitle(htmlToSave);
			const chosenTitle = await this.promptPresentationName(defaultTitle);
			if (chosenTitle === null) {
				return;
			}

			const title = (chosenTitle || defaultTitle || 'Untitled presentation').trim();

			saveBtn.disabled = true;
			const previousLabel = saveBtn.textContent;
			saveBtn.textContent = window.Lang ? (Lang.get('savingButton') || 'Saving...') : 'Saving...';
			const selectedMode = this.selectedPresentationMode === 'pdf' ? 'pdf' : 'html';

			try {
				console.info('[PromptablePresentation] Saving presentation to DB', {
					title,
					mode: selectedMode,
					htmlLength: htmlToSave.length,
					hasMasterKey: !!hashedMasterKey,
					masterKeyPrefix: String(hashedMasterKey).slice(0, 8)
				});
				await dbApi.savePromptablePresentation(hashedMasterKey, {
					title,
					mode: selectedMode,
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

		const modeControlsGroup = document.createElement('div');
		modeControlsGroup.style.display = 'flex';
		modeControlsGroup.style.alignItems = 'center';
		modeControlsGroup.style.gap = '8px';
		modeControlsGroup.style.gridColumn = '1';
		modeControlsGroup.style.justifySelf = 'start';
		modeControlsGroup.style.paddingRight = '16px';
		modeControlsGroup.style.marginRight = '8px';
		modeControlsGroup.style.borderRight = '1px solid var(--border-color, #404040)';

		const centerControlsGroup = document.createElement('div');
		centerControlsGroup.style.gridColumn = '2';
		centerControlsGroup.style.justifySelf = 'center';
		centerControlsGroup.style.display = 'flex';
		centerControlsGroup.style.alignItems = 'center';
		centerControlsGroup.style.justifyContent = 'center';
		centerControlsGroup.style.gap = '10px';
		centerControlsGroup.style.flexWrap = 'wrap';

		const rightControlsGroup = document.createElement('div');
		rightControlsGroup.style.gridColumn = '3';
		rightControlsGroup.style.justifySelf = 'end';
		rightControlsGroup.style.display = 'flex';
		rightControlsGroup.style.alignItems = 'center';
		rightControlsGroup.style.justifyContent = 'flex-end';
		rightControlsGroup.style.gap = '10px';

		modeControlsGroup.appendChild(modeToggleWrap);
		centerControlsGroup.appendChild(slidesLabel);
		centerControlsGroup.appendChild(slideCountSelector);
		centerControlsGroup.appendChild(addTextBtn);
		centerControlsGroup.appendChild(extraRequestBtn);
		centerControlsGroup.appendChild(sendBtn);
		centerControlsGroup.appendChild(webSearchToggleBtn);
		centerControlsGroup.appendChild(webSearchStateLabel);
		rightControlsGroup.appendChild(fullscreenBtn);
		rightControlsGroup.appendChild(saveBtn);

		bottomBar.appendChild(modeControlsGroup);
		bottomBar.appendChild(centerControlsGroup);
		bottomBar.appendChild(rightControlsGroup);

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
			this.teardownPromptableFrameImageClickHandler();
			if (this.fullscreenChangeHandler) {
				document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler);
				this.fullscreenChangeHandler = null;
			}
			if (overlay && document.body.contains(overlay)) {
				document.body.removeChild(overlay);
			}
			this.overlay = null;
			this.htmlModeBtn = null;
			this.pdfModeBtn = null;
			this.promptableWebSearchBtn = null;
			this.webSearchStateLabel = null;
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
		this.teardownPromptableFrameImageClickHandler();
		this.promptableImageOriginalSrcById = {};

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
		this.attachPromptableFrameImageClickHandler(frame);
	}
}

window.PromptedPresentationWorkflow = PromptedPresentationWorkflow;
