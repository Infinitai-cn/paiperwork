class PromptedPresentationWorkflow {
	static savedSlideCount = 8;

	static getActiveHashedMasterKey() {
		return sessionStorage.getItem('hashedMasterKey') || '';
	}

	static extractPresentationTitle(htmlContent) {
		if (!htmlContent) {
			return 'Untitled presentation';
		}

		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(htmlContent, 'text/html');

			const titleText = (doc.querySelector('title')?.textContent || '').trim();
			if (titleText) {
				return titleText.slice(0, 120);
			}

			const h1Text = (doc.querySelector('h1')?.textContent || '').trim();
			if (h1Text) {
				return h1Text.slice(0, 120);
			}
		} catch (error) {
			// Fall through to default title if parsing fails.
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

	static isDarkThemeActive() {
		if (typeof document === 'undefined') {
			return false;
		}

		const root = document.documentElement;
		const body = document.body;

		if (root && (root.classList.contains('dark-mode') || root.classList.contains('dark-theme'))) {
			return true;
		}

		if (body && (body.classList.contains('dark-mode') || body.classList.contains('dark-theme'))) {
			return true;
		}

		return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
	}

	static ensureRequestProgressStyles() {
		if (typeof document === 'undefined') {
			return;
		}

		const styleId = 'promptable-request-progress-style';
		if (document.getElementById(styleId)) {
			return;
		}

		const style = document.createElement('style');
		style.id = styleId;
		style.textContent = `
@keyframes promptableRequestProgressIndefinite {
	0% { transform: translateX(-130%); }
	50% { transform: translateX(60%); }
	100% { transform: translateX(260%); }
}
`;
		document.head.appendChild(style);
	}

	static setRequestProgressVisible(isVisible) {
		if (!this.requestProgressTrack || !this.requestProgressBar) {
			return;
		}

		if (isVisible) {
			const isDark = this.isDarkThemeActive();
			const trackColor = isDark ? 'rgba(34, 197, 94, 0.22)' : 'rgba(37, 99, 235, 0.18)';
			const progressColor = isDark ? '#22c55e' : '#2563eb';

			this.requestProgressTrack.style.background = trackColor;
			this.requestProgressTrack.style.opacity = '1';
			this.requestProgressTrack.style.boxShadow = 'inset 0 0 0 1px rgba(148, 163, 184, 0.2)';
			this.requestProgressBar.style.background = progressColor;
			this.requestProgressBar.style.animationPlayState = 'running';
			return;
		}

		this.requestProgressTrack.style.opacity = '0';
		this.requestProgressTrack.style.boxShadow = 'none';
		this.requestProgressBar.style.animationPlayState = 'paused';
	}

	static showStreamingHtmlPreview(statusText = '') {
		if (!this.renderArea) {
			return;
		}

		this.renderArea.innerHTML = '';

		const wrapper = document.createElement('div');
		wrapper.style.width = '100%';
		wrapper.style.height = '100%';
		wrapper.style.display = 'flex';
		wrapper.style.flexDirection = 'column';
		wrapper.style.gap = '8px';
		wrapper.style.minHeight = '0';

		const status = document.createElement('div');
		status.textContent = statusText || (window.Lang ? (Lang.get('generatingSlideForge') || 'Generating SlideForge...') : 'Generating SlideForge...');
		status.style.fontSize = '12px';
		status.style.opacity = '0.85';
		status.style.color = 'var(--text-color, #ffffff)';

		const codePreview = document.createElement('textarea');
		codePreview.readOnly = true;
		codePreview.spellcheck = false;
		codePreview.wrap = 'off';
		codePreview.style.flex = '1 1 auto';
		codePreview.style.width = '100%';
		codePreview.style.minHeight = '0';
		codePreview.style.resize = 'none';
		codePreview.style.border = '1px solid var(--border-color, #404040)';
		codePreview.style.borderRadius = '10px';
		codePreview.style.background = 'var(--background-color, #18181b)';
		codePreview.style.color = 'var(--text-color, #ffffff)';
		codePreview.style.padding = '12px';
		codePreview.style.boxSizing = 'border-box';
		codePreview.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
		codePreview.style.fontSize = '12px';
		codePreview.style.lineHeight = '1.45';
		codePreview.style.overflow = 'auto';

		wrapper.appendChild(status);
		wrapper.appendChild(codePreview);
		this.renderArea.appendChild(wrapper);

		this.streamingCodeWrapper = wrapper;
		this.streamingCodeStatus = status;
		this.streamingCodePreview = codePreview;
	}

	static appendStreamingHtmlCode(delta) {
		if (!this.streamingCodePreview || !delta) {
			return;
		}

		this.streamingCodePreview.value += String(delta);
		this.streamingCodePreview.scrollTop = this.streamingCodePreview.scrollHeight;
	}

	static ensureStreamingCodeSmoothState() {
		if (this.streamingCodeSmoothState) {
			return;
		}

		this.streamingCodeSmoothState = {
			pending: '',
			queue: [],
			enqueueTimer: null,
			renderTimer: null,
			enqueueDelayMs: 14,
			renderCadenceMs: 14,
			minBufferedChars: 24,
			maxBufferedChars: 320,
			lastRenderAt: 0,
			hardLimitMs: 42,
		};
	}

	static findNextStreamingMarker(buffer) {
		const markers = ['```', '</think>', '<think>', '\n'];
		let best = null;

		for (const marker of markers) {
			const idx = buffer.indexOf(marker);
			if (idx === -1) {
				continue;
			}
			if (!best || idx < best.index) {
				best = { marker, index: idx };
			}
		}

		return best;
	}

	static extractStreamingUnit(text, force) {
		if (!text) {
			return null;
		}

		const wsMatch = text.match(/^(\s+)/);
		if (wsMatch) {
			return wsMatch[1];
		}

		const wordWithSpace = text.match(/^([^\s]+)(\s+)/);
		if (wordWithSpace) {
			return wordWithSpace[1] + wordWithSpace[2];
		}

		if (/[\u3040-\u30ff\u3400-\u9fff]/.test(text)) {
			return text[0];
		}

		if (/[.!?,;:]$/.test(text)) {
			return text;
		}

		return force ? text : null;
	}

	static enqueueStreamingUnits(force = false) {
		this.ensureStreamingCodeSmoothState();
		const state = this.streamingCodeSmoothState;

		let guard = 0;
		while (state.pending && guard < 256) {
			guard += 1;
			const markerData = this.findNextStreamingMarker(state.pending);

			if (markerData && markerData.index === 0) {
				state.queue.push(markerData.marker);
				state.pending = state.pending.slice(markerData.marker.length);
				continue;
			}

			if (markerData && markerData.index > 0) {
				const prefix = state.pending.slice(0, markerData.index);
				const unit = this.extractStreamingUnit(prefix, force);
				if (!unit) {
					if (force) {
						state.queue.push(prefix);
						state.pending = state.pending.slice(prefix.length);
					}
					break;
				}

				state.queue.push(unit);
				state.pending = state.pending.slice(unit.length);
				continue;
			}

			const unit = this.extractStreamingUnit(state.pending, force);
			if (!unit) {
				break;
			}

			state.queue.push(unit);
			state.pending = state.pending.slice(unit.length);
		}
	}

	static startStreamingCodeRenderPump() {
		this.ensureStreamingCodeSmoothState();
		const state = this.streamingCodeSmoothState;

		if (state.renderTimer) {
			return;
		}

		state.renderTimer = setInterval(() => {
			if (!state.queue.length) {
				clearInterval(state.renderTimer);
				state.renderTimer = null;
				return;
			}

			const unit = state.queue.shift();
			state.lastRenderAt = Date.now();
			this.appendStreamingHtmlCode(unit);
		}, state.renderCadenceMs);
	}

	static flushStreamingCodePending(force = false) {
		this.ensureStreamingCodeSmoothState();
		const state = this.streamingCodeSmoothState;

		this.enqueueStreamingUnits(force);
		if (force && state.pending) {
			state.queue.push(state.pending);
			state.pending = '';
		}

		this.startStreamingCodeRenderPump();
	}

	static queueStreamingHtmlCode(delta) {
		if (!delta) {
			return;
		}

		this.ensureStreamingCodeSmoothState();
		const state = this.streamingCodeSmoothState;
		state.pending += String(delta);

		const shouldFlushBoundary =
			state.pending.length >= state.maxBufferedChars ||
			state.pending.includes('\n') ||
			state.pending.includes('```') ||
			state.pending.includes('<think>') ||
			state.pending.includes('</think>');

		const now = Date.now();
		const sinceLastRender = state.lastRenderAt ? (now - state.lastRenderAt) : Number.MAX_SAFE_INTEGER;

		if (shouldFlushBoundary) {
			this.flushStreamingCodePending(true);
			return;
		}

		if (state.pending.length >= state.minBufferedChars && sinceLastRender >= state.hardLimitMs) {
			this.flushStreamingCodePending(false);
			return;
		}

		if (!state.enqueueTimer) {
			state.enqueueTimer = setTimeout(() => {
				state.enqueueTimer = null;
				this.flushStreamingCodePending(true);
			}, state.enqueueDelayMs);
		}
	}

	static clearStreamingHtmlPreviewRefs() {
		if (this.streamingCodeSmoothState) {
			if (this.streamingCodeSmoothState.enqueueTimer) {
				clearTimeout(this.streamingCodeSmoothState.enqueueTimer);
				this.streamingCodeSmoothState.enqueueTimer = null;
			}
			if (this.streamingCodeSmoothState.renderTimer) {
				clearInterval(this.streamingCodeSmoothState.renderTimer);
				this.streamingCodeSmoothState.renderTimer = null;
			}
			this.streamingCodeSmoothState.pending = '';
			this.streamingCodeSmoothState.queue = [];
		}

		this.streamingCodeWrapper = null;
		this.streamingCodeStatus = null;
		this.streamingCodePreview = null;
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

	static escapeNoticeHtml(text) {
		return String(text || '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	static isCloudUsageLimitError(error) {
		if (window.OllamaAPI && typeof window.OllamaAPI.getOllamaCloudAccessErrorDetails === 'function') {
			return !!window.OllamaAPI.getOllamaCloudAccessErrorDetails(error);
		}

		const message = String(error && error.message ? error.message : error || '').toLowerCase();
		return message.includes('429')
			|| message.includes('too many requests')
			|| message.includes('weekly usage')
			|| message.includes('daily limit')
			|| message.includes('usage limit')
			|| message.includes('requires a subscription')
			|| message.includes('upgrade for access');
	}

	static showCloudUsageLimitNotice(error, renderArea) {
		if (!this.isCloudUsageLimitError(error)) {
			return false;
		}

		const rawMessage = String(error && error.message ? error.message : error || '');
		const safeMessage = this.escapeNoticeHtml(rawMessage);
		const accessError = window.OllamaAPI && typeof window.OllamaAPI.getOllamaCloudAccessErrorDetails === 'function'
			? window.OllamaAPI.getOllamaCloudAccessErrorDetails(error)
			: null;
		const title = accessError?.title || ((window.Lang && Lang.get('artifactCloudLimitTitle')) || 'Cloud usage limit reached');
		const body = accessError?.body || ((window.Lang && Lang.get('artifactCloudLimitBody')) || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.');
		const link = accessError?.link || 'https://ollama.com/settings';

		if (renderArea) {
			renderArea.innerHTML = `
				<div style="padding:16px;border:1px solid rgba(239,68,68,0.35);border-radius:12px;background:rgba(239,68,68,0.08);color:var(--text-color,#f5f5f5);max-width:900px;margin:16px auto;">
					<div style="font-weight:700;margin-bottom:8px;color:#ef4444;">${this.escapeNoticeHtml(title)}</div>
					<div style="white-space:pre-wrap;line-height:1.5;margin-bottom:10px;">${this.escapeNoticeHtml(body)}</div>
					<div style="white-space:pre-wrap;line-height:1.45;opacity:0.95;margin-bottom:10px;">${safeMessage}</div>
					<a href="${this.escapeNoticeHtml(link)}" target="_blank" rel="noopener noreferrer" style="color:#f87171;text-decoration:underline;">${this.escapeNoticeHtml(link)}</a>
				</div>
			`;
			return true;
		}

		const overlay = document.createElement('div');
		overlay.className = 'promptable-usage-limit-overlay';
		overlay.style.position = 'fixed';
		overlay.style.inset = '0';
		overlay.style.zIndex = '10070';
		overlay.style.background = 'rgba(0,0,0,0.45)';
		overlay.style.backdropFilter = 'blur(2px)';
		overlay.style.display = 'flex';
		overlay.style.alignItems = 'center';
		overlay.style.justifyContent = 'center';

		const card = document.createElement('div');
		card.style.width = 'min(680px, 92vw)';
		card.style.maxHeight = '80vh';
		card.style.overflowY = 'auto';
		card.style.background = 'var(--panel-background, #1f2937)';
		card.style.color = 'var(--text-color, #f9fafb)';
		card.style.border = '1px solid rgba(239,68,68,0.35)';
		card.style.borderRadius = '12px';
		card.style.padding = '16px';
		card.style.boxShadow = '0 12px 36px rgba(0,0,0,0.35)';
		card.innerHTML = `
			<div style="font-weight:700;margin-bottom:8px;color:#ef4444;">${this.escapeNoticeHtml(title)}</div>
			<div style="line-height:1.5;margin-bottom:10px;">${this.escapeNoticeHtml(body)}</div>
			<div style="white-space:pre-wrap;line-height:1.45;opacity:0.95;margin-bottom:10px;">${safeMessage}</div>
			<a href="${this.escapeNoticeHtml(link)}" target="_blank" rel="noopener noreferrer" style="color:#f87171;text-decoration:underline;">${this.escapeNoticeHtml(link)}</a>
			<div style="display:flex;justify-content:flex-end;margin-top:14px;">
				<button type="button" class="promptable-usage-limit-close" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border-color,#374151);background:var(--button-bg,#111827);color:var(--text-color,#f9fafb);cursor:pointer;">OK</button>
			</div>
		`;

		overlay.appendChild(card);
		document.body.appendChild(overlay);
		const closeOverlay = () => {
			if (overlay.parentNode) {
				overlay.parentNode.removeChild(overlay);
			}
		};
		overlay.addEventListener('click', (event) => {
			if (event.target === overlay) {
				closeOverlay();
			}
		});
		const closeBtn = card.querySelector('.promptable-usage-limit-close');
		if (closeBtn) {
			closeBtn.addEventListener('click', closeOverlay);
		}

		return true;
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
		const standaloneHtml = await this.buildStandalonePromptableHtml(htmlContent || '');
		const filename = `${this.sanitizeHtmlFilename(title)}.html`;
		const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });

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

				this.setPresentationHtml(this.normalizePromptableNavigationHtml(html));
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

					const normalizedHtml = this.normalizePromptableNavigationHtml(html);
					const saveResult = await this.saveHtmlToDisk(item.title || 'presentation', normalizedHtml);
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

	static async savePresentationToLibrary({
		htmlContent = null,
		title = '',
		mode = null,
		promptForName = false,
		showAlerts = true,
	} = {}) {
		const hashedMasterKey = this.getActiveHashedMasterKey();
		if (!hashedMasterKey) {
			console.error('[PromptablePresentation] Save blocked: missing active hashed master key');
			if (showAlerts) {
				alert(window.Lang ? (Lang.get('presentationError') || 'Master key not found.') : 'Master key not found.');
			}
			throw new Error('Master key not found.');
		}

		const dbApi = this.getDatabaseApi();
		if (!dbApi || typeof dbApi.savePromptablePresentation !== 'function') {
			console.error('[PromptablePresentation] Save blocked: PaiperworkDB.savePromptablePresentation API unavailable', {
				hasWindowPaiperworkDB: !!(typeof window !== 'undefined' && window.PaiperworkDB),
				hasGlobalPaiperworkDB: typeof PaiperworkDB !== 'undefined',
				saveMethodType: dbApi ? typeof dbApi.savePromptablePresentation : 'undefined'
			});
			if (showAlerts) {
				alert(window.Lang ? (Lang.get('presentationError') || 'Database API unavailable.') : 'Database API unavailable.');
			}
			throw new Error('Database API unavailable.');
		}

		const htmlSource = htmlContent == null ? this.currentPresentationHtml : htmlContent;
		const htmlToSave = await this.buildStandalonePromptableHtml(String(htmlSource || '').trim());
		if (!htmlToSave) {
			console.error('[PromptablePresentation] Save blocked: no current presentation HTML available', {
				hasCurrentPresentationHtml: !!this.currentPresentationHtml,
				htmlLength: this.currentPresentationHtml ? String(this.currentPresentationHtml).length : 0
			});
			if (showAlerts) {
				alert(window.Lang ? (Lang.get('presentationError') || 'No presentation HTML to save.') : 'No presentation HTML to save.');
			}
			throw new Error('No presentation HTML to save.');
		}

		const defaultTitle = this.extractPresentationTitle(htmlToSave);
		let resolvedTitle = String(title || '').trim();
		if (promptForName) {
			const chosenTitle = await this.promptPresentationName(defaultTitle);
			if (chosenTitle === null) {
				return null;
			}
			resolvedTitle = String(chosenTitle || '').trim();
		}

		const finalTitle = (resolvedTitle || defaultTitle || 'Untitled presentation').trim();
		const selectedMode = mode || (this.selectedPresentationMode === 'pdf' ? 'pdf' : 'html');

		/* console.info('[PromptablePresentation] Saving presentation to DB', {
			title: finalTitle,
			mode: selectedMode,
			htmlLength: htmlToSave.length,
			hasMasterKey: !!hashedMasterKey,
			masterKeyPrefix: String(hashedMasterKey).slice(0, 8)
		}); */

		const savedId = await dbApi.savePromptablePresentation(hashedMasterKey, {
			title: finalTitle,
			mode: selectedMode,
			html: htmlToSave,
		});

		this.currentPresentationHtml = htmlToSave;
		//console.info('[PromptablePresentation] Save completed, refreshing saved presentations list');
		await this.refreshSavedPresentations();
		//console.info('[PromptablePresentation] Saved presentations list refreshed');

		return {
			id: savedId,
			title: finalTitle,
			mode: selectedMode,
			html: htmlToSave,
		};
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

	static switchToChatTabFromModelWarning() {
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

	static showChatModelRequiredWindow() {
		const existing = document.getElementById('prompted-presentation-model-warning');
		if (existing) {
			return;
		}

		const overlay = document.createElement('div');
		overlay.id = 'prompted-presentation-model-warning';
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
		const messageText = (window.Lang && Lang.get('promptedPresentationModelRequired')) || 'Please select one model in the Chat tab model selector before generating prompted presentations.';
		const okText = (window.Lang && Lang.get('ok')) || 'Okay';

		dialog.innerHTML = `
			<h3 style="margin: 0 0 10px 0; font-size: 18px;">${titleText}</h3>
			<p style="margin: 0 0 14px 0; line-height: 1.45;">${messageText}</p>
			<button id="prompted-presentation-model-warning-ok" style="padding: 9px 18px; border: none; border-radius: 8px; background: var(--accent-color, #4f46e5); color: #fff; cursor: pointer; font-weight: 600;">${okText}</button>
		`;

		overlay.appendChild(dialog);
		document.body.appendChild(overlay);

		const okButton = document.getElementById('prompted-presentation-model-warning-ok');
		if (okButton) {
			okButton.addEventListener('click', () => {
				if (overlay.parentNode) {
					overlay.parentNode.removeChild(overlay);
				}
				this.switchToChatTabFromModelWarning();
			});
		}
	}

	static ensureChatModelSelectedForGeneration() {
		const model = this.getSelectedModel();
		if (model) {
			return model;
		}

		this.showChatModelRequiredWindow();
		return '';
	}

	static getSelectedContextSize() {
		const contextSelector = document.getElementById('context-selector');
		const value = contextSelector ? parseInt(contextSelector.value, 10) : 8192;
		return Number.isFinite(value) ? value : 8192;
	}

	static getPromptableImageProxyBaseUrl(useAbsolute = true) {
		const proxyPath = '/api/proxy/fetch-image?url=';
		if (!useAbsolute || typeof window === 'undefined' || !window.location || !/^https?:$/i.test(window.location.protocol || '')) {
			return proxyPath;
		}
		return `${window.location.origin}${proxyPath}`;
	}

	static isPromptableProxyImageUrl(rawUrl) {
		const value = String(rawUrl || '').trim();
		if (!value) {
			return false;
		}

		if (value.includes('/api/proxy/fetch-image?url=')) {
			return true;
		}

		if (typeof window !== 'undefined' && window.location && /^https?:$/i.test(window.location.protocol || '')) {
			return value.startsWith(`${window.location.origin}/api/proxy/fetch-image?url=`);
		}

		return false;
	}

	static buildPromptableProxiedImageUrl(rawUrl, useAbsolute = true) {
		const value = String(rawUrl || '').trim();
		if (!value || /^data:|^blob:/i.test(value)) {
			return value;
		}

		if (!/^https?:\/\//i.test(value) || this.isPromptableProxyImageUrl(value)) {
			return value;
		}

		if (typeof window !== 'undefined' && window.location && /^https?:$/i.test(window.location.protocol || '')) {
			try {
				const parsed = new URL(value, window.location.origin);
				if (parsed.origin === window.location.origin) {
					return parsed.toString();
				}
			} catch (_error) {
				// Fall through to proxy rewriting.
			}
		}

		return `${this.getPromptableImageProxyBaseUrl(useAbsolute)}${encodeURIComponent(value)}`;
	}

	static async readPromptableBlobAsDataUrl(blob) {
		return await new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result || '');
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	}

	static getPromptableImageFetchUrl(rawUrl, useAbsolute = false) {
		const value = String(rawUrl || '').trim();
		if (!value || /^data:|^blob:/i.test(value)) {
			return value;
		}

		if (this.isPromptableProxyImageUrl(value)) {
			return value;
		}

		if (!/^https?:\/\//i.test(value)) {
			return value;
		}

		if (typeof window !== 'undefined' && window.location && /^https?:$/i.test(window.location.protocol || '')) {
			try {
				const parsed = new URL(value, window.location.origin);
				if (parsed.origin === window.location.origin) {
					return parsed.toString();
				}
			} catch (_error) {
				// Fall through to proxy fetch.
			}
		}

		return this.buildPromptableProxiedImageUrl(value, useAbsolute);
	}

	static async fetchPromptableImageAsDataUrl(rawUrl, abortSignal = null) {
		const value = String(rawUrl || '').trim();
		if (!value) {
			return '';
		}

		if (/^data:/i.test(value)) {
			return value;
		}

		this.promptableImageDataUrlCache = this.promptableImageDataUrlCache || new Map();
		if (this.promptableImageDataUrlCache.has(value)) {
			return await this.promptableImageDataUrlCache.get(value);
		}

		const promise = (async () => {
			this.promptableImageFetchIntervalMs = Number.isFinite(this.promptableImageFetchIntervalMs)
				? this.promptableImageFetchIntervalMs
				: 350;
			this.promptableImageFetchBackoffMs = Number.isFinite(this.promptableImageFetchBackoffMs)
				? this.promptableImageFetchBackoffMs
				: 1500;

			const sleep = (ms) => new Promise((resolve, reject) => {
				const timer = setTimeout(resolve, Math.max(0, ms || 0));
				if (abortSignal) {
					abortSignal.addEventListener('abort', () => {
						clearTimeout(timer);
						reject(new DOMException('Aborted', 'AbortError'));
					}, { once: true });
				}
			});

			const waitForFetchTurn = async () => {
				const now = Date.now();
				const nextAllowedAt = Number(this.promptableImageNextFetchAt || 0);
				if (nextAllowedAt > now) {
					await sleep(nextAllowedAt - now);
				}
				this.promptableImageNextFetchAt = Date.now() + this.promptableImageFetchIntervalMs;
			};

			const fetchUrl = this.getPromptableImageFetchUrl(value, false);
			let lastError = null;
			for (let attempt = 0; attempt < 2; attempt += 1) {
				await waitForFetchTurn();
				const response = await fetch(fetchUrl, { signal: abortSignal });
				if (response.ok) {
					const blob = await response.blob();
					return await this.readPromptableBlobAsDataUrl(blob);
				}

				lastError = new Error(`Image fetch failed with status ${response.status}`);
				if (response.status !== 429 || attempt >= 1) {
					throw lastError;
				}

				this.promptableImageNextFetchAt = Date.now() + this.promptableImageFetchBackoffMs;
				await sleep(this.promptableImageFetchBackoffMs);
			}

			throw lastError || new Error('Image fetch failed');
		})();

		this.promptableImageDataUrlCache.set(value, promise);
		try {
			return await promise;
		} catch (error) {
			this.promptableImageDataUrlCache.delete(value);
			throw error;
		}
	}

	static normalizePromptableImageQueryCandidate(rawValue) {
		const value = String(rawValue || '').replace(/\s+/g, ' ').trim();
		if (!value || value.length < 3 || /^https?:\/\//i.test(value)) {
			return '';
		}

		const lowered = value.toLowerCase();
		if (['image', 'photo', 'picture', 'illustration', 'graphic'].includes(lowered)) {
			return '';
		}

		return value.slice(0, 140);
	}

	static findPromptableSlideContextElement(imageElement) {
		let current = imageElement ? imageElement.parentElement : null;
		while (current && current !== current.ownerDocument?.body) {
			const tagName = String(current.tagName || '').toLowerCase();
			const className = String(current.className || '').toLowerCase();
			const id = String(current.id || '').toLowerCase();
			if (
				tagName === 'section'
				|| tagName === 'article'
				|| current.hasAttribute('data-slide')
				|| className.includes('slide')
				|| id.includes('slide')
				|| className.includes('swiper-slide')
			) {
				return current;
			}
			current = current.parentElement;
		}
		return imageElement?.ownerDocument?.body || null;
	}

	static extractPromptableImageSearchQueries(imageElement) {
		const queries = [];
		const pushQuery = (value) => {
			const normalized = this.normalizePromptableImageQueryCandidate(value);
			if (!normalized || queries.includes(normalized)) {
				return;
			}
			queries.push(normalized);
		};

		if (!imageElement) {
			return queries;
		}

		pushQuery(imageElement.getAttribute('data-image-query'));
		pushQuery(imageElement.getAttribute('data-search-query'));
		pushQuery(imageElement.getAttribute('alt'));
		pushQuery(imageElement.getAttribute('title'));

		const slideElement = this.findPromptableSlideContextElement(imageElement);
		if (slideElement) {
			const heading = slideElement.querySelector('h1, h2, h3, h4, header h1, header h2, header h3');
			pushQuery(heading ? heading.textContent : '');
			const subheading = slideElement.querySelector('h5, h6, p, li');
			const subheadingText = String(subheading ? subheading.textContent : '').replace(/\s+/g, ' ').trim();
			if (heading && subheadingText) {
				pushQuery(`${heading.textContent} ${subheadingText}`);
			}

			const fullText = String(slideElement.textContent || '').replace(/\s+/g, ' ').trim();
			if (fullText) {
				pushQuery(fullText.split(/[.!?]/)[0]);
			}
		}

		return queries.slice(0, 5);
	}

	static async resolvePromptableImageDataUrl(imageElement, abortSignal = null) {
		if (!imageElement) {
			return '';
		}

		const currentSrc = String(imageElement.getAttribute('src') || imageElement.currentSrc || '').trim();
		if (/^data:/i.test(currentSrc)) {
			return currentSrc;
		}

		const queries = this.extractPromptableImageSearchQueries(imageElement);
		for (const query of queries) {
			let urls = [];
			try {
				urls = await this.searchPromptableImageUrls(query, 8);
			} catch (_searchError) {
				continue;
			}

			for (const url of urls) {
				try {
					const dataUrl = await this.fetchPromptableImageAsDataUrl(url, abortSignal);
					if (dataUrl) {
						imageElement.setAttribute('data-image-query', query);
						return dataUrl;
					}
				} catch (_fetchError) {
					// Try next candidate.
				}
			}
		}

		if (currentSrc) {
			try {
				return await this.fetchPromptableImageAsDataUrl(currentSrc, abortSignal);
			} catch (_currentSrcError) {
				// Keep the original reference unchanged if both search and fetch fail.
			}
		}

		return '';
	}

	static async inlinePromptablePresentationImages(documentRef, abortSignal = null) {
		if (!documentRef || typeof documentRef.querySelectorAll !== 'function') {
			return;
		}

		const images = Array.from(documentRef.querySelectorAll('img'));
		for (const imageElement of images) {
			if (!imageElement) {
				continue;
			}

			try {
				const dataUrl = await this.resolvePromptableImageDataUrl(imageElement, abortSignal);
				if (!dataUrl) {
					continue;
				}
				imageElement.setAttribute('src', dataUrl);
				imageElement.removeAttribute('srcset');
			} catch (_inlineError) {
				// Leave the existing image reference unchanged if embedding fails.
			}
		}
	}

	static serializePromptableDocument(documentRef) {
		if (!documentRef || !documentRef.documentElement) {
			return '';
		}

		let doctype = '';
		if (documentRef.doctype && documentRef.doctype.name) {
			doctype = `<!DOCTYPE ${documentRef.doctype.name}`;
			if (documentRef.doctype.publicId) {
				doctype += ` PUBLIC \"${documentRef.doctype.publicId}\"`;
			}
			if (documentRef.doctype.systemId) {
				doctype += `${documentRef.doctype.publicId ? '' : ' SYSTEM'} \"${documentRef.doctype.systemId}\"`;
			}
			doctype += '>';
		}

		const body = documentRef.documentElement.outerHTML;
		return doctype ? `${doctype}\n${body}` : body;
	}

	static async buildStandalonePromptableHtml(htmlContent, abortSignal = null) {
		const normalizedHtml = this.normalizePromptableNavigationHtml(htmlContent || '');
		if (!normalizedHtml) {
			return '';
		}

		let documentRef = null;
		try {
			const parser = new DOMParser();
			documentRef = parser.parseFromString(normalizedHtml, 'text/html');
		} catch (_error) {
			return normalizedHtml;
		}

		if (!documentRef || !documentRef.body) {
			return normalizedHtml;
		}

		await this.inlinePromptablePresentationImages(documentRef, abortSignal);
		return this.serializePromptableDocument(documentRef);
	}

	static async buildPresentationRoutingAndOptions(model, baseOptions = {}) {
		let routing = await OllamaAPI.getApiRoutingForModel(model);

		if (routing && routing.source === 'cloud') {
			const ensureCloudKey = window.chatTab && typeof window.chatTab.ensureCloudApiKeyForSend === 'function'
				? window.chatTab.ensureCloudApiKeyForSend.bind(window.chatTab)
				: null;

			if (ensureCloudKey) {
				const hasCloudKey = await ensureCloudKey();
				if (!hasCloudKey) {
					throw new Error('Cloud API key required');
				}
				routing = await OllamaAPI.getApiRoutingForModel(model);
			}
		}

		const options = { ...(baseOptions || {}) };

		return { routing, options };
	}

	static buildArtisticPresentationSystemPrompt() {
		return [
			'You are an expert artistic HTML presentation creator.',
			'Your job is to produce a visually rich presentation as a single, self-contained HTML document.',
            'The first slide is always the main title and subtitle slide.',
            'Create differentiated and visually appealing differentiated backgrounds for each slide using SVG that effectively communicate the provided content.',
			'Use one topical content image per slide and make the image choice different for each slide topic.',
			'For every slide image, include a concise descriptive alt text or data-image-query that names the ideal photo subject for that specific slide.',
			'If you include external image URLs, use only direct image file URLs that return image bytes, not HTML page URLs. NEVER use those images as slide backgrounds.',
			'ALWAYS use all text content provided by the user in the exact same order as provided; do not reorder any part of the text.',
			'When the user does not specify an exact slide count, infer a suitable count from the source structure and amount of content.',
			'Do not collapse substantial multi-section source material into only 2 slides. Use one cover slide plus enough content slides to cover the major sections and key details.',
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
			'Use one topical content image per slide and make the image choice different for each slide topic.',
			'For every slide image, include a concise descriptive alt text or data-image-query that names the ideal photo subject for that specific slide.',
			'If you include external image URLs, use only direct image file URLs that return image bytes, not HTML page URLs. NEVER use those images as slide backgrounds.',
			'ALWAYS use all text content provided by the user in the exact same order as provided; do not reorder any part of the text.',
			'When the user does not specify an exact slide count, infer a suitable count from the source structure and amount of content.',
			'Do not collapse substantial multi-section source material into only 2 slides. Use one cover slide plus enough content slides to cover the major sections and key details.',
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
				? 'var(--presentation-web-state-active-color, var(--accent-color, #4f46e5))'
				: 'var(--presentation-web-state-inactive-color, var(--text-color, #ffffff))';
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
			options: {},
		};
		const { routing, options: requestOptions } = await this.buildPresentationRoutingAndOptions(model, {
			num_ctx: this.getSelectedContextSize(),
		});
		requestBody.model = routing.modelName || requestBody.model;
		requestBody.options = requestOptions;
		const payload = requestBody;

		try {
			const response = await fetch(`${routing.baseUrl}/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', ...routing.headers },
				body: JSON.stringify(payload),
				signal: abortSignal,
			});

			if (!response.ok) {
				if (response.status === 429) {
					const errorText = await response.text();
					throw new Error(`${(window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.'}${errorText ? `\n${errorText}` : ''}`);
				}
				return fallbackQuery || originalText;
			}

			const data = await response.json();
			const optimized = String(data?.response || data?.message?.content || '')
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
			const message = String(error?.message || '').toLowerCase();
			if (message.includes('429') || message.includes('too many requests') || message.includes('weekly usage') || message.includes('daily limit')) {
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

		const retrievalConfig = {
			primaryExtractionCount: 10,
			maxFinalSources: 12,
			minUsableSources: 6,
			minUniqueDomains: 4,
			fallbackQueryCount: 3,
			fallbackExtractionCount: 5,
		};

		const primarySearchResults = await window.WebSearch.smartSearch(finalQuery, searchAbortController, false);
		if (abortSignal && abortSignal.aborted) {
			throw new DOMException('Aborted', 'AbortError');
		}

		const primaryEnhancedResults = await this.enhancePromptableSearchResults(
			primarySearchResults,
			retrievalConfig.primaryExtractionCount
		);

		let collectedSources = this.collectPromptableWebSearchSources(
			primaryEnhancedResults,
			retrievalConfig.maxFinalSources
		);

		const needsFallbackExpansion = this.shouldExpandPromptableWebSearchCoverage(
			collectedSources,
			retrievalConfig
		);

		if (needsFallbackExpansion) {
			const fallbackCandidates = collectedSources.slice(0, retrievalConfig.fallbackQueryCount);
			for (const candidate of fallbackCandidates) {
				if (!candidate || !candidate.title) {
					continue;
				}

				if (abortSignal && abortSignal.aborted) {
					throw new DOMException('Aborted', 'AbortError');
				}

				const expansionQuery = this.buildPromptableExpansionQuery(finalQuery, candidate.title);
				if (!expansionQuery) {
					continue;
				}

				const fallbackSearchResults = await window.WebSearch.smartSearch(expansionQuery, searchAbortController, false);
				const fallbackEnhancedResults = await this.enhancePromptableSearchResults(
					fallbackSearchResults,
					retrievalConfig.fallbackExtractionCount
				);

				const fallbackSources = this.collectPromptableWebSearchSources(
					fallbackEnhancedResults,
					retrievalConfig.maxFinalSources
				);

				collectedSources = this.mergePromptableWebSearchSources(
					collectedSources,
					fallbackSources,
					retrievalConfig.maxFinalSources
				);

				if (!this.shouldExpandPromptableWebSearchCoverage(collectedSources, retrievalConfig)) {
					break;
				}
			}
		}

		const normalizedItems = collectedSources
			.slice(0, retrievalConfig.maxFinalSources)
			.map((item, index) => {
				const title = String(item.title || `Result ${index + 1}`).trim();
				const url = String(item.url || item.link || '').trim();
				const snippet = String(item.snippet || '').replace(/\s+/g, ' ').trim();
				const extracted = String(item.extractedContent || item.pageContent || item.summary || '')
					.replace(/\s+/g, ' ')
					.trim();

				const lines = [
					`${index + 1}. ${title}`,
					url ? `Source: ${url}` : '',
					snippet ? `Snippet: ${snippet.slice(0, 700)}` : '',
					extracted ? `Details: ${extracted.slice(0, 1800)}` : '',
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

	static async enhancePromptableSearchResults(searchResults, extractionCount = 10) {
		if (!window.WebSearch || typeof window.WebSearch.enhanceWithPageContent !== 'function') {
			return searchResults;
		}

		try {
			return await window.WebSearch.enhanceWithPageContent(searchResults, extractionCount, false);
		} catch (_error) {
			return searchResults;
		}
	}

	static extractPromptableSourceDomain(url) {
		const raw = String(url || '').trim();
		if (!raw) {
			return '';
		}

		try {
			return (new URL(raw)).hostname.replace(/^www\./i, '').toLowerCase();
		} catch (_error) {
			return '';
		}
	}

	static collectPromptableWebSearchSources(searchResults, maxSources = 12) {
		const items = Array.isArray(searchResults && searchResults.items) ? searchResults.items : [];
		const enhancedContent = Array.isArray(searchResults && searchResults.enhancedContent) ? searchResults.enhancedContent : [];

		const enhancedByUrl = new Map();
		enhancedContent.forEach((entry) => {
			if (!entry || !entry.url) {
				return;
			}
			const url = String(entry.url || '').trim();
			if (!url || enhancedByUrl.has(url)) {
				return;
			}
			enhancedByUrl.set(url, entry);
		});

		const sources = [];
		const seenUrls = new Set();

		for (const item of items) {
			if (!item || (!item.title && !item.link && !item.snippet)) {
				continue;
			}

			const url = String(item.link || '').trim();
			if (!url || seenUrls.has(url)) {
				continue;
			}

			seenUrls.add(url);
			const enhanced = enhancedByUrl.get(url);
			const extractedContent = String(
				(enhanced && (enhanced.extractedContent || enhanced.summary || enhanced.pageContent))
				|| item.extractedContent
				|| item.pageContent
				|| item.summary
				|| ''
			).replace(/\s+/g, ' ').trim();
			const snippet = String(item.snippet || '').replace(/\s+/g, ' ').trim();

			sources.push({
				title: String(item.title || '').trim() || 'Untitled source',
				url,
				snippet,
				extractedContent,
				domain: this.extractPromptableSourceDomain(url),
			});

			if (sources.length >= maxSources) {
				break;
			}
		}

		return sources;
	}

	static shouldExpandPromptableWebSearchCoverage(sources, config) {
		const list = Array.isArray(sources) ? sources : [];
		if (!list.length) {
			return true;
		}

		const usableSourceCount = list.filter((source) => {
			const snippetLen = String(source && source.snippet ? source.snippet : '').trim().length;
			const detailsLen = String(source && source.extractedContent ? source.extractedContent : '').trim().length;
			return detailsLen >= 220 || snippetLen >= 140;
		}).length;

		const uniqueDomains = new Set(
			list
				.map((source) => String(source && source.domain ? source.domain : '').trim())
				.filter(Boolean)
		).size;

		if (usableSourceCount < Number(config && config.minUsableSources ? config.minUsableSources : 6)) {
			return true;
		}

		if (uniqueDomains < Number(config && config.minUniqueDomains ? config.minUniqueDomains : 4)) {
			return true;
		}

		return false;
	}

	static buildPromptableExpansionQuery(baseQuery, title) {
		const base = String(baseQuery || '').trim();
		const topicTitle = String(title || '').replace(/\s+/g, ' ').trim();
		if (!base || !topicTitle) {
			return base || topicTitle;
		}

		const compactTitle = topicTitle.split(/\s+/).slice(0, 10).join(' ');
		return `${base} ${compactTitle}`.trim();
	}

	static mergePromptableWebSearchSources(primarySources, secondarySources, maxSources = 12) {
		const merged = [];
		const seen = new Set();
		const pushUnique = (source) => {
			if (!source) {
				return;
			}
			const key = String(source.url || '').trim();
			if (!key || seen.has(key)) {
				return;
			}
			seen.add(key);
			merged.push(source);
		};

		(primarySources || []).forEach(pushUnique);
		(secondarySources || []).forEach(pushUnique);

		return merged.slice(0, maxSources);
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

	static normalizePromptableNavigationHtml(htmlContent) {
		const raw = String(htmlContent || '').trim();
		if (!raw) {
			return raw;
		}

		let documentRef = null;
		try {
			const parser = new DOMParser();
			documentRef = parser.parseFromString(raw, 'text/html');
		} catch (_error) {
			return raw;
		}

		if (!documentRef || !documentRef.body) {
			return raw;
		}

		// Some generated decks output percentage tokens inside SVG path d attributes
		// (e.g., "M50% 20 Q 100% 50 50% 80"), which is invalid path syntax in browsers.
		// Normalize those tokens by stripping only the trailing percent sign.
		try {
			const svgPaths = documentRef.querySelectorAll('svg path[d]');
			svgPaths.forEach((pathEl) => {
				const d = pathEl.getAttribute('d');
				if (!d || d.indexOf('%') === -1) {
					return;
				}
				const normalizedD = d.replace(/(-?\d+(?:\.\d+)?)%/g, '$1');
				if (normalizedD !== d) {
					pathEl.setAttribute('d', normalizedD);
				}
			});
		} catch (_svgNormalizeError) {
			// Ignore sanitizer failures; downstream rendering should still proceed.
		}

		const hasPrevButton = !!documentRef.querySelector('[id*="prev" i], [class*="prev" i], [aria-label*="prev" i], [data-action*="prev" i], button[onclick*="prev" i], button[title*="prev" i]');
		const hasNextButton = !!documentRef.querySelector('[id*="next" i], [class*="next" i], [aria-label*="next" i], [data-action*="next" i], button[onclick*="next" i], button[title*="next" i]');

		const cloakClassName = 'pw-start-reset-cloak';
		const cloakStyleId = 'pw-start-reset-cloak-style';
		const cloakCss = `html.${cloakClassName},body.${cloakClassName}{opacity:0!important;background:#000!important}html,body{transition:opacity .18s ease}`;

		if (documentRef.documentElement) {
			documentRef.documentElement.classList.add(cloakClassName);
		}
		if (documentRef.body) {
			documentRef.body.classList.add(cloakClassName);
		}

		let head = documentRef.head;
		if (!head && documentRef.documentElement) {
			head = documentRef.createElement('head');
			documentRef.documentElement.insertBefore(head, documentRef.body || documentRef.documentElement.firstChild);
		}

		if (head) {
			const existingCloakStyle = head.querySelector(`#${cloakStyleId}`);
			if (existingCloakStyle) {
				existingCloakStyle.textContent = cloakCss;
			} else {
				const cloakStyle = documentRef.createElement('style');
				cloakStyle.id = cloakStyleId;
				cloakStyle.textContent = cloakCss;
				head.appendChild(cloakStyle);
			}
		}

		const scriptId = 'pw-remote-nav-normalizer';
		const existingScript = documentRef.getElementById(scriptId);
		if (existingScript) {
			existingScript.remove();
		}

		const script = documentRef.createElement('script');
		script.id = scriptId;
		script.textContent = [
			'(function(){',
			'  if (window.__pwRemoteNavBound) return;',
			'  window.__pwRemoteNavBound = true;',
			'  var __pwResetStarted = false;',
			'  var __pwResetDone = false;',
			'  var __pwResetAttempts = 0;',
			'  var __pwRevealDone = false;',
			'  var __pwRevealPatched = false;',
			'  var installStartCloak = function(){',
			'    try {',
			'      var styleId = "pw-start-reset-cloak-style";',
			'      if (!document.getElementById(styleId)) {',
			'        var css = "html.pw-start-reset-cloak,body.pw-start-reset-cloak{opacity:0!important;background:#000!important}html,body{transition:opacity .18s ease}";',
			'        var styleEl = document.createElement("style");',
			'        styleEl.id = styleId;',
			'        styleEl.textContent = css;',
			'        (document.head || document.documentElement || document.body).appendChild(styleEl);',
			'      }',
			'      if (document.documentElement) document.documentElement.classList.add("pw-start-reset-cloak");',
			'      if (document.body) document.body.classList.add("pw-start-reset-cloak");',
			'    } catch (e) {}',
			'  };',
			'  var revealPresentation = function(){',
			'    if (__pwRevealDone) return;',
			'    __pwRevealDone = true;',
			'    var doReveal = function(){',
			'      try {',
			'        if (document.documentElement) document.documentElement.classList.remove("pw-start-reset-cloak");',
			'        if (document.body) document.body.classList.remove("pw-start-reset-cloak");',
			'      } catch (e) {}',
			'    };',
			'    if (typeof window.requestAnimationFrame === "function") {',
			'      window.requestAnimationFrame(function(){ window.requestAnimationFrame(doReveal); });',
			'    } else {',
			'      setTimeout(doReveal, 0);',
			'    }',
			'  };',
			'  var findVisible = function(list){',
			'    for (var i = 0; i < list.length; i++) {',
			'      var el = list[i];',
			'      if (!el || el.disabled) continue;',
			'      var style = window.getComputedStyle(el);',
			'      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) continue;',
			'      return el;',
			'    }',
			'    return null;',
			'  };',
			'  var getPrevButton = function(){',
			'    return findVisible(Array.prototype.slice.call(document.querySelectorAll([',
			"      '[data-action*=\\\"prev\\\" i]',",
			"      '[aria-label*=\\\"prev\\\" i]',",
			"      'button[title*=\\\"prev\\\" i]',",
			"      '[id*=\\\"prev\\\" i]',",
			"      '[class*=\\\"prev\\\" i]'",
			'    ].join(","))));',
			'  };',
			'  var getNextButton = function(){',
			'    return findVisible(Array.prototype.slice.call(document.querySelectorAll([',
			"      '[data-action*=\\\"next\\\" i]',",
			"      '[aria-label*=\\\"next\\\" i]',",
			"      'button[title*=\\\"next\\\" i]',",
			"      '[id*=\\\"next\\\" i]',",
			"      '[class*=\\\"next\\\" i]'",
			'    ].join(","))));',
			'  };',
			'  var triggerClick = function(btn){',
			'    if (!btn) return false;',
			'    try { btn.click(); return true; } catch(e) { return false; }',
			'  };',
			'  var getExpectedSlideCount = function(){',
			'    try {',
			'      var parentDoc = window.parent && window.parent.document ? window.parent.document : null;',
			'      if (!parentDoc) return 0;',
			'      var selector = parentDoc.getElementById("promptable-slide-count-selector");',
			'      if (!selector) return 0;',
			'      var n = parseInt(String(selector.value || ""), 10);',
			'      return Number.isFinite(n) && n > 0 ? n : 0;',
			'    } catch (e) {',
			'      return 0;',
			'    }',
			'  };',
			'  var resetHash = function(){',
			'    try {',
			'      if (!window.location || !window.location.hash) return;',
			'      if (window.history && typeof window.history.replaceState === "function") {',
			'        window.history.replaceState(null, "", window.location.pathname + window.location.search);',
			'      } else {',
			'        window.location.hash = "";',
			'      }',
			'    } catch (e) {}',
			'  };',
			'  var hasRevealApi = function(){',
			'    return !!(window.Reveal && typeof window.Reveal.slide === "function" && typeof window.Reveal.getIndices === "function");',
			'  };',
			'  var getPlainSlides = function(){',
			'    try {',
			'      return Array.prototype.slice.call(document.querySelectorAll(".slide"));',
			'    } catch (e) {',
			'      return [];',
			'    }',
			'  };',
			'  var isPlainDeckAtStart = function(){',
			'    var slides = getPlainSlides();',
			'    if (!slides.length) return false;',
			'    var activeIdx = -1;',
			'    for (var i = 0; i < slides.length; i++) {',
			'      if (slides[i] && slides[i].classList && slides[i].classList.contains("active")) {',
			'        activeIdx = i;',
			'        break;',
			'      }',
			'    }',
			'    return activeIdx <= 0;',
			'  };',
			'  var resetPlainDeckToStart = function(){',
			'    var slides = getPlainSlides();',
			'    if (!slides.length) return false;',
			'    for (var i = 0; i < slides.length; i++) {',
			'      if (!slides[i] || !slides[i].classList) continue;',
			'      if (i === 0) slides[i].classList.add("active");',
			'      else slides[i].classList.remove("active");',
			'    }',
			'    try {',
			'      var total = slides.length;',
			'      var counter = document.getElementById("slide-counter") || document.querySelector(\'[id*="counter" i], [class*="counter" i]\');',
			'      if (counter) counter.textContent = "1 / " + total;',
			'      var progress = document.getElementById("progressBar") || document.getElementById("progress-bar") || document.querySelector(".progress-bar");',
			'      if (progress && progress.style) progress.style.width = (100 / Math.max(total, 1)) + "%";',
			'    } catch (e) {}',
			'    return true;',
			'  };',
			'  var forceRevealStartOptions = function(){',
			'    try {',
			'      if (!window.Reveal || typeof window.Reveal.configure !== "function") return;',
			'      window.Reveal.configure({ hash: false, history: false, fragmentInURL: false });',
			'    } catch (e) {}',
			'  };',
			'  var patchRevealInitialize = function(){',
			'    try {',
			'      if (!window.Reveal || __pwRevealPatched || typeof window.Reveal.initialize !== "function") return;',
			'      var originalInitialize = window.Reveal.initialize.bind(window.Reveal);',
			'      window.Reveal.initialize = function(options){',
			'        var opts = Object.assign({}, options || {}, { hash: false, history: false, fragmentInURL: false });',
			'        var result = originalInitialize(opts);',
			'        var afterInit = function(){',
			'          forceRevealStartOptions();',
			'          resetHash();',
			'          try { window.Reveal.slide(0, 0, 0); } catch (e) {}',
			'        };',
			'        if (result && typeof result.then === "function") {',
			'          result.then(afterInit).catch(function(){ afterInit(); });',
			'        } else {',
			'          setTimeout(afterInit, 0);',
			'        }',
			'        return result;',
			'      };',
			'      __pwRevealPatched = true;',
			'    } catch (e) {}',
			'  };',
			'  var resetViaReveal = function(){',
			'    try {',
			'      if (!hasRevealApi()) return false;',
			'      forceRevealStartOptions();',
			'      window.Reveal.slide(0, 0, 0);',
			'      return true;',
			'    } catch (e) { return false; }',
			'  };',
			'  var isAtStart = function(){',
			'    try {',
			'      if (hasRevealApi()) {',
			'        var idx = window.Reveal.getIndices() || {};',
			'        return Number(idx.h || 0) === 0 && Number(idx.v || 0) === 0 && Number(idx.f || 0) === 0;',
			'      }',
			'    } catch (e) {}',
			'    return isPlainDeckAtStart();',
			'  };',
			'  var resetViaPrev = function(){',
			'    var prev = getPrevButton();',
			'    if (!prev) return false;',
			'    var expectedSlides = getExpectedSlideCount();',
			'    var maxClicks = expectedSlides > 0 ? Math.max(expectedSlides + 2, 12) : 48;',
			'    for (var i = 0; i < maxClicks; i++) {',
			'      var btn = getPrevButton();',
			'      if (!btn || btn.disabled) break;',
			'      if (!triggerClick(btn)) break;',
			'    }',
			'    return true;',
			'  };',
			'  var resetToStart = function(){',
			'    if (__pwResetDone) return;',
			'    patchRevealInitialize();',
			'    resetHash();',
			'    if (isAtStart()) { __pwResetDone = true; revealPresentation(); return; }',
			'    var revealReset = resetViaReveal();',
			'    if (!revealReset) {',
			'      var plainReset = resetPlainDeckToStart();',
			'      if (!plainReset) resetViaPrev();',
			'    }',
			'    if (isAtStart()) { __pwResetDone = true; revealPresentation(); }',
			'  };',
			'  var scheduleResetLoop = function(){',
			'    if (__pwResetStarted) return;',
			'    __pwResetStarted = true;',
			'    var runAttempt = function(){',
			'      if (__pwResetDone) { revealPresentation(); return; }',
			'      __pwResetAttempts += 1;',
			'      resetToStart();',
			'      if (__pwResetDone) { revealPresentation(); return; }',
			'      if (__pwResetAttempts < 72) setTimeout(runAttempt, 50);',
			'      else { resetToStart(); revealPresentation(); }',
			'    };',
			'    setTimeout(runAttempt, 0);',
			'  };',
			'  installStartCloak();',
			'  patchRevealInitialize();',
			'  resetHash();',
			'  setTimeout(revealPresentation, 4500);',
			'  if (document.readyState === "loading") {',
			'    document.addEventListener("DOMContentLoaded", scheduleResetLoop, { once: true });',
			'  } else {',
			'    scheduleResetLoop();',
			'  }',
			'  window.addEventListener("load", scheduleResetLoop, { once: true });',
			'  var handler = function(ev){',
			`    if (!${hasPrevButton && hasNextButton}) return;`,
			'    if (!ev) return;',
			'    var target = ev.target || null;',
			'    var tag = target && target.tagName ? String(target.tagName).toLowerCase() : "";',
			'    if (target && (target.isContentEditable || tag === "input" || tag === "textarea" || tag === "select")) return;',
			'    var key = String(ev.key || "").toLowerCase();',
			'    var code = String(ev.code || "").toLowerCase();',
			'    var isPrev = key === "arrowleft" || key === "pageup" || code === "arrowleft" || code === "pageup";',
			'    var isNext = key === "arrowright" || key === "pagedown" || key === " " || key === "spacebar" || key === "enter" || code === "arrowright" || code === "pagedown" || code === "space" || code === "enter";',
			'    if (!isPrev && !isNext) return;',
			'    var btn = isPrev ? getPrevButton() : getNextButton();',
			'    if (!btn) return;',
			'    ev.preventDefault();',
			'    ev.stopPropagation();',
			'    triggerClick(btn);',
			'  };',
			'  document.addEventListener("keydown", handler, true);',
			'})();'
		].join('\n');

		if (head) {
			head.insertBefore(script, head.firstChild || null);
		} else if (documentRef.body) {
			documentRef.body.insertBefore(script, documentRef.body.firstChild || null);
		}

		const doctype = '<!DOCTYPE html>';
		return `${doctype}\n${documentRef.documentElement.outerHTML}`;
	}

	static buildUserPrompt(slideCount, sourceText) {
		return this.buildUserPromptWithExtra(slideCount, sourceText, '', false);
	}

	static buildAutoSlideCountGuidance(sourceText) {
		const text = String(sourceText || '').trim();
		if (!text) {
			return {
				targetSlides: 4,
				minimumSlides: 3
			};
		}

		const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
		const paragraphs = text.split(/\n\s*\n+/).map(part => part.trim()).filter(Boolean);
		const wordCount = (text.match(/\S+/g) || []).length;
		const markdownHeadingCount = lines.filter(line => /^#{1,6}\s+/.test(line)).length;
		const numberedSectionCount = lines.filter(line => /^\d+(?:\.\d+)*\.?\s+/.test(line)).length;
		const bulletCount = lines.filter(line => /^([\-*•]|\d+[.)])\s+/.test(line)).length;
		const tableLineCount = lines.filter(line => /\|/.test(line)).length;

		const structuralEstimate = Math.max(
			markdownHeadingCount,
			numberedSectionCount,
			Math.ceil(bulletCount / 4),
			tableLineCount >= 3 ? 2 : 0
		);
		const contentEstimate = Math.ceil(wordCount / 120);
		const paragraphEstimate = Math.ceil(paragraphs.length / 2);

		const targetSlides = Math.max(4, Math.min(12, Math.max(contentEstimate, paragraphEstimate, structuralEstimate + 1, 4)));
		const minimumSlides = Math.max(3, Math.min(targetSlides, targetSlides - 1));

		return {
			targetSlides,
			minimumSlides
		};
	}

	static buildUserPromptWithExtra(slideCount, sourceText, extraRequestText, removeWebSearchMentions = false) {
		const resolvedSlideCount = Number(slideCount);
		const hasExplicitSlideCount = Number.isFinite(resolvedSlideCount) && resolvedSlideCount > 0;
		const autoSlideGuidance = hasExplicitSlideCount ? null : this.buildAutoSlideCountGuidance(sourceText);
		const parts = [
			hasExplicitSlideCount
				? `Create a presentation with exactly ${resolvedSlideCount} slides.`
				: `Create a presentation with an appropriate number of slides based on the request and source material. If the request explicitly asks for a specific slide count, follow it exactly. Otherwise, choose the number of slides needed to cover the topic well without padding. For this source, target around ${autoSlideGuidance.targetSlides} slides and do not use fewer than ${autoSlideGuidance.minimumSlides} slides unless the source is genuinely minimal.`
		];

		if (!hasExplicitSlideCount && autoSlideGuidance) {
			parts.push(
				`Auto slide-count guidance: use 1 cover slide plus enough content slides to cover the major sections in order. This source should usually produce around ${autoSlideGuidance.targetSlides} slides, with a practical minimum of ${autoSlideGuidance.minimumSlides}.`
			);
		}

		if (extraRequestText && String(extraRequestText).trim()) {
			parts.push(
				'Keep everything else the same as the provided source material and existing presentation requirements unless the extra request explicitly changes it.',
				'Do not rewrite, compress, or drift the underlying content beyond the requested modifications. Preserve the same topic coverage, detail level, structure, and order unless the extra request explicitly asks otherwise.',
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
		actionRow.style.flexWrap = 'wrap';

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

		const importBtn = document.createElement('button');
		importBtn.type = 'button';
		importBtn.textContent = window.Lang
			? (Lang.get('importImageButton') || 'Import image')
			: 'Import image';
		importBtn.style.height = '32px';
		importBtn.style.padding = '0 10px';
		importBtn.style.borderRadius = '8px';
		importBtn.style.border = '1px solid var(--presentation-export-border, transparent)';
		importBtn.style.cursor = 'pointer';
		importBtn.style.background = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
		importBtn.style.color = 'var(--presentation-export-color, #ffffff)';

		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = 'image/*';
		fileInput.style.display = 'none';

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
		actionRow.appendChild(importBtn);
		actionRow.appendChild(closeBtn);

		panel.appendChild(title);
		panel.appendChild(inputRow);
		panel.appendChild(status);
		panel.appendChild(resultGrid);
		panel.appendChild(actionRow);
		panel.appendChild(fileInput);

		this.overlay.appendChild(panel);

		this.promptableImageEditorPanel = panel;
		this.promptableImageEditorInput = searchInput;
		this.promptableImageEditorSearchBtn = searchBtn;
		this.promptableImageEditorStatus = status;
		this.promptableImageEditorResults = resultGrid;
		this.promptableImageEditorRestoreBtn = restoreBtn;
		this.promptableImageEditorImportBtn = importBtn;
		this.promptableImageEditorFileInput = fileInput;

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

		importBtn.addEventListener('click', () => {
			fileInput.value = '';
			fileInput.click();
		});

		fileInput.addEventListener('change', (event) => {
			const selectedFile = event && event.target && event.target.files && event.target.files[0]
				? event.target.files[0]
				: null;
			if (!selectedFile) {
				return;
			}
			void this.importPromptableSelectedImageFromFile(selectedFile);
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
			this.promptableImageEditorImportBtn = null;
			this.promptableImageEditorFileInput = null;
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

		return this.serializePromptableDocument(frame.contentDocument);
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
			const proxiedUrl = this.buildPromptableProxiedImageUrl(url, true);
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
			img.src = proxiedUrl || url;
			img.alt = 'search-result';
			img.style.width = '100%';
			img.style.height = '100%';
			img.style.objectFit = 'cover';

			thumbBtn.appendChild(img);
			thumbBtn.addEventListener('click', () => {
				void this.replacePromptableSelectedImage(url);
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

	static async replacePromptableSelectedImage(url) {
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
		if (!/^https?:\/\//i.test(normalizedUrl) && !/^data:/i.test(normalizedUrl)) {
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

		this.updatePromptableImageEditorStatus(
			window.Lang ? (Lang.get('searchingImagesLabel') || 'Searching images...') : 'Searching images...',
			'info'
		);

		let dataUrl = normalizedUrl;
		try {
			dataUrl = await this.fetchPromptableImageAsDataUrl(normalizedUrl);
		} catch (error) {
			this.updatePromptableImageEditorStatus(
				String(error && error.message ? error.message : error),
				'error'
			);
			return;
		}

		this.promptableSelectedImage.setAttribute('src', dataUrl);
		this.promptableSelectedImage.removeAttribute('srcset');
		this.promptableSelectedImage.src = dataUrl;
		this.syncPromptableCurrentHtmlFromFrame(this.promptableEditingFrame);

		this.updatePromptableImageEditorStatus(
			window.Lang ? (Lang.get('imageReplacedStatus') || 'Image replaced. You can restore the original at any time.') : 'Image replaced. You can restore the original at any time.',
			'info'
		);
	}

	static async importPromptableSelectedImageFromFile(file) {
		if (!this.promptableSelectedImage) {
			this.updatePromptableImageEditorStatus(
				window.Lang
					? (Lang.get('clickImageToEdit') || 'Click an image in the presentation to replace it.')
					: 'Click an image in the presentation to replace it.',
				'muted'
			);
			return;
		}

		if (!(file instanceof Blob) || !String(file.type || '').toLowerCase().startsWith('image/')) {
			this.updatePromptableImageEditorStatus(
				window.Lang
					? (Lang.get('promptableLocalImageOnly') || 'Please choose a valid image file from your computer.')
					: 'Please choose a valid image file from your computer.',
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

		this.updatePromptableImageEditorStatus(
			window.Lang ? (Lang.get('importingImageLabel') || 'Importing image...') : 'Importing image...',
			'info'
		);

		let dataUrl = '';
		try {
			dataUrl = await this.readPromptableBlobAsDataUrl(file);
		} catch (error) {
			this.updatePromptableImageEditorStatus(
				String(error && error.message ? error.message : error),
				'error'
			);
			return;
		}

		if (!dataUrl) {
			this.updatePromptableImageEditorStatus(
				window.Lang
					? (Lang.get('promptableLocalImageReadFailed') || 'Failed to read the selected image file.')
					: 'Failed to read the selected image file.',
				'error'
			);
			return;
		}

		this.promptableSelectedImage.setAttribute('src', dataUrl);
		this.promptableSelectedImage.removeAttribute('srcset');
		this.promptableSelectedImage.src = dataUrl;
		this.syncPromptableCurrentHtmlFromFrame(this.promptableEditingFrame);

		this.updatePromptableImageEditorStatus(
			window.Lang
				? (Lang.get('imageImportedStatus') || 'Image imported from your computer. You can restore the original at any time.')
				: 'Image imported from your computer. You can restore the original at any time.',
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
		this.promptableImageEditorImportBtn = null;
		this.promptableImageEditorFileInput = null;
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

	static async generatePresentationHtml(userText, abortSignal = null, mode = 'html', onDelta = null) {
		const model = this.ensureChatModelSelectedForGeneration();
		if (!model) {
			throw new Error(window.Lang ? (Lang.get('selectModelPrompt') || 'Please select a model first.') : 'Please select a model first.');
		}

		const promptPayload = userText;
		const systemPrompt = mode === 'pdf'
			? this.buildPdfPresentationSystemPrompt()
			: this.buildArtisticPresentationSystemPrompt();
		/*console.log(
			`[PromptedPresentationWorkflow] generatePresentationHtml payload\n${JSON.stringify({
				mode,
				model,
				promptLength: String(promptPayload || '').length,
				prompt: String(promptPayload || ''),
				systemLength: String(systemPrompt || '').length,
				system: String(systemPrompt || '')
			}, null, 2)}`
		);*/

		const requestBody = {
			model,
			system: systemPrompt,
			prompt: promptPayload,
			stream: true,
			options: {},
		};
		const { routing, options: requestOptions } = await this.buildPresentationRoutingAndOptions(model, {
			num_ctx: this.getSelectedContextSize(),
		});
		requestBody.model = routing.modelName || requestBody.model;
		requestBody.options = requestOptions;
		const payload = requestBody;

		const response = await fetch(`${routing.baseUrl}/generate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...routing.headers },
			body: JSON.stringify(payload),
			signal: abortSignal,
		});

		if (!response.ok) {
			const errorText = await response.text();
			if (response.status === 429) {
				throw new Error(`${(window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.'}${errorText ? `\n${errorText}` : ''}`);
			}
			throw new Error(`Ollama error (${response.status}): ${errorText}`);
		}

		if (!response.body || typeof response.body.getReader !== 'function') {
			const data = await response.json();
			const fallbackChunk = data?.response || data?.message?.content || '';
			if (fallbackChunk && onDelta) {
				onDelta(fallbackChunk);
			}
			const htmlResponse = this.cleanHtmlResponse(fallbackChunk);
			if (!htmlResponse) {
				throw new Error('Model returned an empty HTML response.');
			}
			return await this.buildStandalonePromptableHtml(htmlResponse, abortSignal);
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let streamBuffer = '';
		let aggregated = '';

		while (true) {
			const { value, done } = await reader.read();
			streamBuffer += decoder.decode(value || new Uint8Array(), { stream: !done });
			const lines = streamBuffer.split('\n');
			streamBuffer = lines.pop() || '';

			for (const line of lines) {
				const trimmedLine = String(line || '').trim();
				if (!trimmedLine || trimmedLine === '[DONE]' || trimmedLine === 'data: [DONE]') {
					continue;
				}

				const normalizedLine = trimmedLine.startsWith('data:')
					? trimmedLine.slice(5).trim()
					: trimmedLine;
				if (!normalizedLine || normalizedLine === '[DONE]') {
					continue;
				}

				try {
					const data = JSON.parse(normalizedLine);
					const responseChunk = data.response || data.message?.content || '';
					if (typeof responseChunk === 'string' && responseChunk.length > 0) {
						aggregated += responseChunk;
						if (onDelta) {
							onDelta(responseChunk);
						}
					}
				} catch (_error) {
					aggregated += normalizedLine;
					if (onDelta) {
						onDelta(normalizedLine);
					}
				}
			}

			if (done) {
				break;
			}
		}

		if (streamBuffer.trim()) {
			try {
				const normalized = streamBuffer.trim().startsWith('data:')
					? streamBuffer.trim().slice(5).trim()
					: streamBuffer.trim();
				const data = JSON.parse(normalized);
				const responseChunk = data.response || data.message?.content || '';
				if (typeof responseChunk === 'string' && responseChunk.length > 0) {
					aggregated += responseChunk;
					if (onDelta) {
						onDelta(responseChunk);
					}
				}
			} catch (_error) {
				aggregated += streamBuffer.trim();
				if (onDelta) {
					onDelta(streamBuffer.trim());
				}
			}
		}

		const htmlResponse = this.cleanHtmlResponse(aggregated);

		if (!htmlResponse) {
			throw new Error('Model returned an empty HTML response.');
		}

		return await this.buildStandalonePromptableHtml(htmlResponse, abortSignal);
	}

	static open({ onClose } = {}) {
		if (this.overlay && document.body.contains(this.overlay)) {
			return;
		}

		this.ensureRequestProgressStyles();

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
		topBar.style.justifyContent = 'flex-start';
		topBar.style.alignItems = 'center';
		topBar.style.gap = '12px';
		topBar.style.padding = '10px 12px';
		topBar.style.background = 'var(--presentation-modal-bg, var(--panel-background, #222426))';
		topBar.style.borderBottom = '1px solid var(--border-color, #404040)';
		topBar.style.boxShadow = 'var(--presentation-modal-box-shadow, 0 2px 8px rgba(0,0,0,0.18))';
		topBar.style.flex = '0 0 auto';

		const requestProgressTrack = document.createElement('div');
		requestProgressTrack.className = 'promptable-request-progress-track';
		requestProgressTrack.style.position = 'relative';
		requestProgressTrack.style.flex = '1 1 55vw';
		requestProgressTrack.style.width = '100%';
		requestProgressTrack.style.maxWidth = '860px';
		requestProgressTrack.style.minWidth = '220px';
		requestProgressTrack.style.height = '8px';
		requestProgressTrack.style.borderRadius = '999px';
		requestProgressTrack.style.overflow = 'hidden';
		requestProgressTrack.style.opacity = '0';
		requestProgressTrack.style.transition = 'opacity 160ms ease';

		const requestProgressBar = document.createElement('div');
		requestProgressBar.className = 'promptable-request-progress-bar';
		requestProgressBar.style.position = 'absolute';
		requestProgressBar.style.top = '0';
		requestProgressBar.style.bottom = '0';
		requestProgressBar.style.width = '34%';
		requestProgressBar.style.borderRadius = '999px';
		requestProgressBar.style.transform = 'translateX(-130%)';
		requestProgressBar.style.animation = 'promptableRequestProgressIndefinite 1.25s ease-in-out infinite';
		requestProgressBar.style.animationPlayState = 'paused';

		requestProgressTrack.appendChild(requestProgressBar);

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
		sidebar.style.minHeight = '0';
		sidebar.style.display = 'flex';
		sidebar.style.flexDirection = 'column';
		sidebar.style.background = 'var(--presentation-modal-bg, var(--panel-background, #222426))';
		sidebar.style.border = '1px solid var(--border-color, #404040)';
		sidebar.style.borderRadius = '12px';
		sidebar.style.boxShadow = 'var(--presentation-modal-box-shadow, 0 8px 32px rgba(0,0,0,0.18))';
		sidebar.style.color = 'var(--presentation-modal-text, var(--text-color, #ffffff))';
		sidebar.style.padding = '12px';
		sidebar.style.boxSizing = 'border-box';
		sidebar.style.overflow = 'hidden';

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
		sidebarList.style.flex = '1 1 auto';
		sidebarList.style.minHeight = '0';
		sidebarList.style.overflowY = 'auto';
		sidebarList.style.overflowX = 'hidden';
		sidebarList.style.boxSizing = 'border-box';
		sidebarList.style.paddingRight = '12px';
		sidebarList.style.scrollbarGutter = 'stable';

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
		slideCountSelector.id = 'promptable-slide-count-selector';
		slideCountSelector.style.height = '40px';
		slideCountSelector.style.padding = '0 12px';
		slideCountSelector.style.borderRadius = '8px';
		slideCountSelector.style.border = '1px solid var(--border-color, #404040)';
		slideCountSelector.style.background = 'var(--background-color, #18181b)';
		slideCountSelector.style.color = 'var(--text-color, #ffffff)';
		slideCountSelector.style.outline = 'none';
		for (let i = 5; i <= 25; i += 1) {
			const option = document.createElement('option');
			option.value = String(i);
			option.textContent = String(i);
			slideCountSelector.appendChild(option);
		}

		const initialSlideCount = Number.isFinite(Number(this.savedSlideCount)) ? Number(this.savedSlideCount) : 8;
		slideCountSelector.value = String(Math.min(Math.max(initialSlideCount, 5), 25));

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
		this.promptableImageEditorImportBtn = null;
		this.promptableImageEditorFileInput = null;

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
			this.setRequestProgressVisible(true);

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
			this.showStreamingHtmlPreview(window.Lang ? (Lang.get('generatingSlideForge') || 'Generating SlideForge...') : 'Generating SlideForge...');

			try {
				this.promptedContextChanged = true;
				let effectiveUserPrompt = userPrompt;

				if (this.isPromptableWebSearchEnabled) {
					this.clearStreamingHtmlPreviewRefs();
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
					this.showStreamingHtmlPreview(window.Lang ? (Lang.get('generatingSlideForge') || 'Generating SlideForge...') : 'Generating SlideForge...');
				}

				const selectedMode = this.selectedPresentationMode === 'pdf' ? 'pdf' : 'html';
				const htmlContent = await this.generatePresentationHtml(effectiveUserPrompt, abortController.signal, selectedMode, (delta) => {
					this.queueStreamingHtmlCode(delta);
				});
				this.flushStreamingCodePending(true);
				this.clearStreamingHtmlPreviewRefs();
				this.setPresentationHtml(htmlContent);
				await this.refreshSavedPresentations();
			} catch (error) {
				this.clearStreamingHtmlPreviewRefs();
				if (error && error.name === 'AbortError') {
					renderArea.innerHTML = `<div style="padding:12px;opacity:0.8;">${window.Lang ? (Lang.get('cancelButton') || 'Cancelled') : 'Cancelled'}</div>`;
				} else {
					console.error('Promptable presentation generation failed:', error);
					if (!this.showCloudUsageLimitNotice(error, renderArea)) {
						renderArea.innerHTML = `<div style="padding:12px;color:#ef4444;white-space:pre-wrap;">${String(error.message || error)}</div>`;
					}
				}
			} finally {
				this.setRequestProgressVisible(false);
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
			//console.info('[PromptablePresentation] Save presentation clicked');
			saveBtn.disabled = true;
			const previousLabel = saveBtn.textContent;
			saveBtn.textContent = window.Lang ? (Lang.get('savingButton') || 'Saving...') : 'Saving...';

			try {
				const saveResult = await this.savePresentationToLibrary({ promptForName: true, showAlerts: true });
				if (saveResult === null) {
					return;
				}
			} catch (error) {
				console.error('[PromptablePresentation] Failed to save promptable presentation', {
					error,
					message: error && error.message ? error.message : String(error),
					stack: error && error.stack ? error.stack : null,
					hasCurrentPresentationHtml: !!this.currentPresentationHtml,
					htmlLength: this.currentPresentationHtml ? String(this.currentPresentationHtml).length : 0,
					hasMasterKey: !!this.getActiveHashedMasterKey(),
					masterKeyPrefix: String(this.getActiveHashedMasterKey() || '').slice(0, 8)
				});
			} finally {
				saveBtn.disabled = false;
				saveBtn.textContent = previousLabel;
				//console.info('[PromptablePresentation] Save flow finished');
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
		closeBtn.style.marginLeft = 'auto';

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
			this.setRequestProgressVisible(false);
			this.clearStreamingHtmlPreviewRefs();
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
			this.requestProgressTrack = null;
			this.requestProgressBar = null;
			this.ensureContinueButtonForChatAfterPromptedClose();
			if (typeof onClose === 'function') {
				onClose();
			}
		};

		this.close = closeWindow;

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

		topBar.appendChild(requestProgressTrack);
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
		this.requestProgressTrack = requestProgressTrack;
		this.requestProgressBar = requestProgressBar;
		this.setRequestProgressVisible(false);
		this.updateTextActionButtons();
		this.updateFullscreenButtonLabel();
		this.refreshSavedPresentations();
	}

	static close() {
		if (typeof this.close === 'function') {
			this.close();
		}
	}

	static setPresentationHtml(htmlContent) {
		if (!this.renderArea) {
			return;
		}

		this.clearStreamingHtmlPreviewRefs();

		const normalizedHtml = this.normalizePromptableNavigationHtml(htmlContent || '');
		this.currentPresentationHtml = normalizedHtml;
		this.teardownPromptableFrameImageClickHandler();
		this.promptableImageOriginalSrcById = {};
		const previousRenderAreaBackground = this.renderArea.style.background;

		this.renderArea.innerHTML = '';
		this.renderArea.style.background = '#000';

		const frame = document.createElement('iframe');
		frame.className = 'promptable-presentation-frame';
		frame.style.width = '100%';
		frame.style.height = '100%';
		frame.style.border = '0';
		frame.style.borderRadius = '10px';
		frame.style.background = '#000';
		frame.setAttribute('allowfullscreen', 'true');
		frame.addEventListener('load', () => {
			this.renderArea.style.background = previousRenderAreaBackground;
		}, { once: true });
		frame.srcdoc = normalizedHtml;

		this.renderArea.appendChild(frame);
		this.attachPromptableFrameImageClickHandler(frame);
	}
}

window.PromptedPresentationWorkflow = PromptedPresentationWorkflow;
