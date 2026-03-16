class ArtifactsWindow {
	static getActiveHashedMasterKey() {
		return sessionStorage.getItem('hashedMasterKey') || '';
	}

	static getDatabaseApi() {
		if (typeof window !== 'undefined' && window.PaiperworkDB) {
			return window.PaiperworkDB;
		}
		if (typeof PaiperworkDB !== 'undefined') {
			return PaiperworkDB;
		}
		return null;
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
		} catch (_error) {
			return '';
		}
	}

	static t(key, fallback) {
		if (window.Lang) {
			return Lang.get(key) || fallback;
		}
		return fallback;
	}

	static normalizeArtifactHistoryText(text) {
		if (typeof text !== 'string') {
			return '';
		}

		const normalized = text.replace(/\u00a0/g, ' ').trim();

		if (!normalized) {
			return '';
		}

		return normalized;
	}

	static normalizeArtifactPromptText(text) {
		if (typeof text !== 'string') {
			return '';
		}

		return text.replace(/\u00a0/g, ' ').trim();
	}

	static getArtifactConversationHistory() {
		if (!Array.isArray(this.artifactConversationHistory)) {
			this.artifactConversationHistory = [];
		}
		return this.artifactConversationHistory;
	}

	static addArtifactHistoryTurn(role, content) {
		const normalizedRole = role === 'assistant' ? 'assistant' : 'user';
		const normalizedContent = this.normalizeArtifactHistoryText(content);
		if (!normalizedContent) {
			return;
		}

		const history = this.getArtifactConversationHistory();
		history.push({ role: normalizedRole, content: normalizedContent });
	}

	static buildArtifactCloudHistoryBlock(currentUserPrompt = '') {
		const history = this.getArtifactConversationHistory();
		if (!history.length) {
			return '';
		}

		const normalizedCurrentPrompt = this.normalizeArtifactHistoryText(currentUserPrompt);
		const snapshot = history.slice();

		if (normalizedCurrentPrompt) {
			while (snapshot.length > 0) {
				const lastTurn = snapshot[snapshot.length - 1];
				if (lastTurn.role !== 'user' || lastTurn.content !== normalizedCurrentPrompt) {
					break;
				}
				snapshot.pop();
			}
		}

		if (!snapshot.length) {
			return '';
		}

		const lines = snapshot.map((turn) => `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}`);
		return [
			'Conversation history (prior turns):',
			lines.join('\n\n'),
			'Treat this as active in-session context and continue naturally.'
		].join('\n\n');
	}

	static resetArtifactConversationContext() {
		this.artifactConversationHistory = [];
		this.artifactLocalContext = null;
	}

	static setGenerationStatus(message = '', type = 'idle') {
		if (!this.statusLabel) {
			return;
		}

		this.statusLabel.textContent = message || '';
		if (!message) {
			this.statusLabel.style.opacity = '0';
			return;
		}

		this.statusLabel.style.opacity = '1';
		this.statusLabel.style.color = '#d1d5db';
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

		const styleId = 'artifacts-request-progress-style';
		if (document.getElementById(styleId)) {
			return;
		}

		const style = document.createElement('style');
		style.id = styleId;
		style.textContent = `
@keyframes artifactsRequestProgressIndefinite {
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

	static escapeHtml(text) {
		return String(text || '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	static setArtifactEditorMode(isEditing) {
		if (!this.codeEditor) {
			return;
		}

		this.codeEditor.style.background = 'var(--background-color, #18181b)';
		this.codeEditor.style.color = 'var(--text-color, #ffffff)';
		this.codeEditor.style.caretColor = 'var(--text-color, #ffffff)';
	}

	static updateCodeSyntaxPreview() {
		// Syntax overlay removed intentionally; plain text editor only.
	}

	static setCodeEditorValue(nextValue) {
		if (!this.codeEditor) {
			return;
		}
		this.codeEditor.value = String(nextValue || '');
	}

	static appendCodeEditorValue(delta) {
		if (!this.codeEditor || !delta) {
			return;
		}
		this.codeEditor.value += delta;
	}

	static scrollCodeEditorToBottom() {
		if (!this.codeEditor) {
			return;
		}
		this.codeEditor.scrollTop = this.codeEditor.scrollHeight;
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
		const existing = document.getElementById('artifacts-model-warning');
		if (existing) {
			return;
		}

		const overlay = document.createElement('div');
		overlay.id = 'artifacts-model-warning';
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
		const messageText = (window.Lang && Lang.get('artifactsModelRequired')) || 'Please select one model in the Chat tab model selector before generating artifacts.';
		const okText = (window.Lang && Lang.get('ok')) || 'Okay';

		dialog.innerHTML = `
			<h3 style="margin: 0 0 10px 0; font-size: 18px;">${titleText}</h3>
			<p style="margin: 0 0 14px 0; line-height: 1.45;">${messageText}</p>
			<button id="artifacts-model-warning-ok" style="padding: 9px 18px; border: none; border-radius: 8px; background: var(--accent-color, #4f46e5); color: #fff; cursor: pointer; font-weight: 600;">${okText}</button>
		`;

		overlay.appendChild(dialog);
		document.body.appendChild(overlay);

		const okButton = document.getElementById('artifacts-model-warning-ok');
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

	static async buildArtifactRoutingAndOptions(model, baseOptions = {}) {
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

	static buildArtifactSystemPrompt() {
		return [
			'You are an elite software engineer and creative technical architect specialized in HTML, CSS, JavaScript, and modern web tooling.',
			'Generate professional, artistic, smart, production-quality code solutions that directly satisfy the user request.',
			'Return ONLY one fenced HTML code block with CSS and JS and nothing else.',
			'Start with ```html and end with ```.',
			'Inside the fence, provide one complete runnable HTML document.',
			'Do not include explanations, notes, prefaces, or postfaces.',
			'Use comments only when required to clarify non-obvious logic; avoid unnecessary comments.',
			'Prioritize clean architecture, maintainability, accessibility, responsiveness, performance, and security.',
			'External dependencies are allowed when they materially improve quality or feasibility; use stable libraries/CDNs and wire them correctly.',
			'Choose sensible defaults when requirements are ambiguous and complete the solution end-to-end.',
			'Use semantic HTML, robust CSS, and reliable JavaScript with proper event wiring and state handling.',
			'For YouTube content, always use iframe embeds with https://www.youtube-nocookie.com/embed/VIDEO_ID or https://www.youtube.com/embed/VIDEO_ID; never use direct YouTube stream/watch URLs in <video> or <source> tags.',
			'When embedding video, include iframe allow attributes for playback APIs and set allowfullscreen.',
			'For non-YouTube video streams such as .m3u8 (HLS), generate player code that uses native HLS where available and hls.js fallback for browsers that do not natively play HLS.',
			'If the requested media format needs a runtime library, include and initialize the required library inside the generated HTML.',
			'Ensure the output renders correctly in modern browsers without additional explanation from you.'
		].join(' ');
	}

	static isLikelyHlsStreamUrl(rawUrl) {
		const url = String(rawUrl || '').trim();
		if (!url) {
			return false;
		}
		return /\.m3u8(?:[?#].*)?$/i.test(url);
	}

	static extractYouTubeVideoId(rawUrl) {
		const value = String(rawUrl || '').trim();
		if (!value) {
			return '';
		}

		try {
			const parsed = new URL(value, window.location.origin);
			const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
			const path = parsed.pathname || '';

			if (host === 'youtu.be') {
				const id = path.replace(/^\/+/, '').split('/')[0];
				return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : '';
			}

			if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
				const watchId = parsed.searchParams.get('v');
				if (watchId && /^[A-Za-z0-9_-]{11}$/.test(watchId)) {
					return watchId;
				}

				const parts = path.split('/').filter(Boolean);
				if (parts.length >= 2 && (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live')) {
					const id = parts[1];
					return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : '';
				}
			}
		} catch (_error) {
			const fallback = value.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/i);
			return fallback ? fallback[1] : '';
		}

		return '';
	}

	static buildYouTubeEmbedUrl(videoId) {
		if (!videoId) {
			return '';
		}
		return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
	}

	static normalizeYouTubeEmbeds(htmlText) {
		const sourceHtml = String(htmlText || '');
		if (!sourceHtml.trim() || typeof DOMParser === 'undefined') {
			return sourceHtml;
		}

		let doc;
		try {
			doc = new DOMParser().parseFromString(sourceHtml, 'text/html');
		} catch (_error) {
			return sourceHtml;
		}

		const addPlaybackAllow = (iframe) => {
			if (!iframe) {
				return;
			}
			const allowParts = new Set(
				String(iframe.getAttribute('allow') || '')
					.split(';')
					.map((part) => part.trim())
					.filter(Boolean)
			);
			['accelerometer', 'autoplay', 'clipboard-write', 'encrypted-media', 'gyroscope', 'picture-in-picture', 'web-share'].forEach((feature) => allowParts.add(feature));
			iframe.setAttribute('allow', Array.from(allowParts).join('; '));
			iframe.setAttribute('allowfullscreen', 'true');
			iframe.setAttribute('referrerpolicy', iframe.getAttribute('referrerpolicy') || 'strict-origin-when-cross-origin');
			iframe.setAttribute('loading', iframe.getAttribute('loading') || 'lazy');
		};

		doc.querySelectorAll('iframe[src]').forEach((iframe) => {
			const rawSrc = iframe.getAttribute('src') || '';
			const videoId = this.extractYouTubeVideoId(rawSrc);
			if (videoId) {
				iframe.setAttribute('src', this.buildYouTubeEmbedUrl(videoId));
				addPlaybackAllow(iframe);
				return;
			}

			const src = String(rawSrc).trim().toLowerCase();
			if (src.includes('youtube.com/embed/') || src.includes('youtube-nocookie.com/embed/')) {
				addPlaybackAllow(iframe);
			}
		});

		const upgradeVideoToIframe = (videoElement, url) => {
			const videoId = this.extractYouTubeVideoId(url);
			if (!videoId || !videoElement || !videoElement.parentNode) {
				return;
			}

			const iframe = doc.createElement('iframe');
			iframe.setAttribute('src', this.buildYouTubeEmbedUrl(videoId));
			iframe.style.width = videoElement.style.width || '100%';
			iframe.style.height = videoElement.style.height || '360px';
			iframe.style.border = videoElement.style.border || '0';
			if (videoElement.className) {
				iframe.className = videoElement.className;
			}
			if (videoElement.id) {
				iframe.id = videoElement.id;
			}
			addPlaybackAllow(iframe);
			videoElement.parentNode.replaceChild(iframe, videoElement);
		};

		const hlsTargets = [];

		doc.querySelectorAll('video').forEach((videoElement, index) => {
			const videoSrc = videoElement.getAttribute('src') || '';
			if (videoSrc && this.extractYouTubeVideoId(videoSrc)) {
				upgradeVideoToIframe(videoElement, videoSrc);
				return;
			}

			if (videoSrc && this.isLikelyHlsStreamUrl(videoSrc)) {
				const elementId = videoElement.id || `artifacts-hls-video-${index}`;
				videoElement.id = elementId;
				videoElement.setAttribute('controls', videoElement.getAttribute('controls') || 'controls');
				videoElement.setAttribute('playsinline', videoElement.getAttribute('playsinline') || 'playsinline');
				hlsTargets.push({ id: elementId, src: videoSrc });
				return;
			}

			const sourceChild = videoElement.querySelector('source[src]');
			if (!sourceChild) {
				return;
			}

			const sourceSrc = sourceChild.getAttribute('src') || '';
			if (sourceSrc && this.extractYouTubeVideoId(sourceSrc)) {
				upgradeVideoToIframe(videoElement, sourceSrc);
				return;
			}

			if (sourceSrc && this.isLikelyHlsStreamUrl(sourceSrc)) {
				const elementId = videoElement.id || `artifacts-hls-video-${index}`;
				videoElement.id = elementId;
				videoElement.setAttribute('controls', videoElement.getAttribute('controls') || 'controls');
				videoElement.setAttribute('playsinline', videoElement.getAttribute('playsinline') || 'playsinline');
				hlsTargets.push({ id: elementId, src: sourceSrc });
			}
		});

		if (hlsTargets.length) {
			const initScript = doc.createElement('script');
			initScript.setAttribute('data-artifacts-hls-init', 'true');
			initScript.textContent = `
(function() {
	const targets = ${JSON.stringify(hlsTargets)};
	const HLS_SRC = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js';

	const attachPlayers = () => {
		targets.forEach((target) => {
			const el = document.getElementById(target.id);
			if (!el || !target || !target.src) return;

			const hlsType = 'application/vnd.apple.mpegurl';
			if (typeof el.canPlayType === 'function' && el.canPlayType(hlsType)) {
				if (!el.getAttribute('src')) {
					el.setAttribute('src', target.src);
				}
				return;
			}

			if (window.Hls && window.Hls.isSupported()) {
				try {
					if (el.__artifactsHlsInstance && typeof el.__artifactsHlsInstance.destroy === 'function') {
						el.__artifactsHlsInstance.destroy();
					}
					const hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
					hls.loadSource(target.src);
					hls.attachMedia(el);
					el.__artifactsHlsInstance = hls;
				} catch (error) {
					console.warn('[ArtifactsWindow] HLS attach failed:', error);
				}
			}
		});
	};

	if (window.Hls && typeof window.Hls.isSupported === 'function') {
		attachPlayers();
		return;
	}

	const existingScript = Array.from(document.scripts || []).find((s) => String(s.src || '').indexOf('hls.min.js') !== -1);
	if (existingScript) {
		if (window.Hls) {
			attachPlayers();
		} else {
			existingScript.addEventListener('load', attachPlayers, { once: true });
		}
		return;
	}

	const loader = document.createElement('script');
	loader.src = HLS_SRC;
	loader.async = true;
	loader.addEventListener('load', attachPlayers, { once: true });
	document.head.appendChild(loader);
})();
`;
			(doc.body || doc.documentElement).appendChild(initScript);
		}

		const normalizedDoc = doc.documentElement ? doc.documentElement.outerHTML : sourceHtml;
		if (!normalizedDoc || normalizedDoc === sourceHtml) {
			return sourceHtml;
		}

		return `<!doctype html>\n${normalizedDoc}`;
	}

	static cleanHtmlResponse(rawText) {
		if (!rawText) {
			return '';
		}

		let cleaned = String(rawText).trim();
		if (cleaned.startsWith('```')) {
			cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, '');
			cleaned = cleaned.replace(/\s*```$/, '');
		}

		return cleaned.trim();
	}

	static async ensureWebSearchModuleLoaded() {
		if (typeof window.WebSearch !== 'undefined') {
			if (window.WebSearch && typeof window.WebSearch.initializeWebSearchReferences === 'function') {
				window.WebSearch.initializeWebSearchReferences();
			}
			return true;
		}

		if (window.tabLoader && typeof window.tabLoader.loadFeatureScripts === 'function') {
			await window.tabLoader.loadFeatureScripts('websearch');
			await new Promise((resolve) => setTimeout(resolve, 100));
			if (window.WebSearch && typeof window.WebSearch.initializeWebSearchReferences === 'function') {
				window.WebSearch.initializeWebSearchReferences();
			}
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

		const { routing, options: requestOptions } = await this.buildArtifactRoutingAndOptions(model, {
			num_ctx: this.getSelectedContextSize(),
		});
		requestBody.model = routing.modelName || requestBody.model;
		requestBody.options = requestOptions;

		try {
			const response = await fetch(`${routing.baseUrl}/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', ...routing.headers },
				body: JSON.stringify(requestBody),
				signal: abortSignal,
			});

			if (!response.ok) {
				if (response.status === 429) {
					const errorText = await response.text();
					throw new Error(`${(window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached (429). You may have hit a daily or weekly limit. Please wait for reset or upgrade your Ollama plan: https://ollama.com/upgrade'}${errorText ? `\n${errorText}` : ''}`);
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

	static async enhanceArtifactsSearchResults(searchResults, extractionCount = 10) {
		if (!window.WebSearch || typeof window.WebSearch.enhanceWithPageContent !== 'function') {
			return searchResults;
		}

		try {
			return await window.WebSearch.enhanceWithPageContent(searchResults, extractionCount, false);
		} catch (_error) {
			return searchResults;
		}
	}

	static extractArtifactsSourceDomain(url) {
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

	static collectArtifactsWebSearchSources(searchResults, maxSources = 12) {
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
				domain: this.extractArtifactsSourceDomain(url),
			});

			if (sources.length >= maxSources) {
				break;
			}
		}

		return sources;
	}

	static shouldExpandArtifactsWebSearchCoverage(sources, config) {
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

	static buildArtifactsExpansionQuery(baseQuery, title) {
		const base = String(baseQuery || '').trim();
		const topicTitle = String(title || '').replace(/\s+/g, ' ').trim();
		if (!base || !topicTitle) {
			return base || topicTitle;
		}

		const compactTitle = topicTitle.split(/\s+/).slice(0, 10).join(' ');
		return `${base} ${compactTitle}`.trim();
	}

	static mergeArtifactsWebSearchSources(primarySources, secondarySources, maxSources = 12) {
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

		const primaryEnhancedResults = await this.enhanceArtifactsSearchResults(
			primarySearchResults,
			retrievalConfig.primaryExtractionCount
		);

		let collectedSources = this.collectArtifactsWebSearchSources(
			primaryEnhancedResults,
			retrievalConfig.maxFinalSources
		);

		const needsFallbackExpansion = this.shouldExpandArtifactsWebSearchCoverage(
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

				const expansionQuery = this.buildArtifactsExpansionQuery(finalQuery, candidate.title);
				if (!expansionQuery) {
					continue;
				}

				const fallbackSearchResults = await window.WebSearch.smartSearch(expansionQuery, searchAbortController, false);
				const fallbackEnhancedResults = await this.enhanceArtifactsSearchResults(
					fallbackSearchResults,
					retrievalConfig.fallbackExtractionCount
				);

				const fallbackSources = this.collectArtifactsWebSearchSources(
					fallbackEnhancedResults,
					retrievalConfig.maxFinalSources
				);

				collectedSources = this.mergeArtifactsWebSearchSources(
					collectedSources,
					fallbackSources,
					retrievalConfig.maxFinalSources
				);

				if (!this.shouldExpandArtifactsWebSearchCoverage(collectedSources, retrievalConfig)) {
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
			'Web research results to use as artifact content:',
			normalizedItems.join('\n\n')
		].join('\n');
	}

	static createCodeFenceExtractor(onCodeChunk) {
		const state = {
			started: false,
			ended: false,
			pending: '',
		};

		const emitCode = (text) => {
			if (!text || !onCodeChunk) {
				return;
			}
			onCodeChunk(text);
		};

		const processAfterStart = (text) => {
			if (!text || state.ended) {
				return;
			}

			const combined = state.pending + text;
			const endIndex = combined.indexOf('```');
			if (endIndex === -1) {
				emitCode(combined);
				state.pending = '';
				return;
			}

			emitCode(combined.slice(0, endIndex));
			state.ended = true;
			state.pending = '';
		};

		return {
			push(text) {
				if (!text || state.ended) {
					return;
				}

				if (state.started) {
					processAfterStart(text);
					return;
				}

				const combined = state.pending + text;
				const startIndex = combined.indexOf('```');
				if (startIndex === -1) {
					state.pending = combined.slice(-2);
					return;
				}

				const afterTicks = combined.slice(startIndex + 3);
				const newLineIndex = afterTicks.indexOf('\n');
				if (newLineIndex === -1) {
					state.pending = combined.slice(startIndex);
					return;
				}

				state.started = true;
				state.pending = '';
				const codeAfterFenceHeader = afterTicks.slice(newLineIndex + 1);
				processAfterStart(codeAfterFenceHeader);
			},
			finish() {
				if (state.started && !state.ended && state.pending) {
					emitCode(state.pending);
				}
				return {
					started: state.started,
					ended: state.ended,
				};
			},
		};
	}

	static async streamArtifactHtml(userPrompt = '', abortSignal = null, onDelta = null) {
		const model = this.ensureChatModelSelectedForGeneration();
		if (!model) {
			throw new Error('No model selected.');
		}

		const requestBody = {
			model,
			system: this.buildArtifactSystemPrompt(),
			prompt: String(userPrompt || ''),
			stream: true,
			options: {},
		};

		const { routing, options: requestOptions } = await this.buildArtifactRoutingAndOptions(model, {
			num_ctx: this.getSelectedContextSize(),
		});

		const isCloudRouting = routing && routing.source === 'cloud';
		if (!isCloudRouting && Array.isArray(this.artifactLocalContext) && this.artifactLocalContext.length) {
			requestBody.context = this.artifactLocalContext;
		}

		if (isCloudRouting) {
			const cloudHistoryBlock = this.buildArtifactCloudHistoryBlock(userPrompt);
			if (cloudHistoryBlock) {
				requestBody.prompt = `${cloudHistoryBlock}\n\nCurrent user request:\n${String(userPrompt || '')}`;
			}
		}

		requestBody.model = routing.modelName || requestBody.model;
		requestBody.options = requestOptions;

		const response = await fetch(`${routing.baseUrl}/generate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...routing.headers },
			body: JSON.stringify(requestBody),
			signal: abortSignal,
		});

		if (!response.ok) {
			const errorText = await response.text();
			if (response.status === 429) {
				throw new Error(`${(window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached (429). You may have hit a daily or weekly limit. Please wait for reset or upgrade your Ollama plan: https://ollama.com/upgrade'}${errorText ? `\n${errorText}` : ''}`);
			}
			throw new Error(`Ollama error (${response.status}): ${errorText}`);
		}

		if (!response.body || typeof response.body.getReader !== 'function') {
			const data = await response.json();
			const fallback = this.cleanHtmlResponse(data?.response || data?.message?.content || '');
			if (fallback && onDelta) {
				onDelta(fallback);
			}
			const fallbackContext = Array.isArray(data?.context) ? data.context : null;
			if (fallbackContext) {
				this.artifactLocalContext = fallbackContext;
			}
			return { text: fallback, context: fallbackContext, isCloudRouting };
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let streamBuffer = '';
		let aggregated = '';
		let finalContext = null;

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
					if (Array.isArray(data.context)) {
						finalContext = data.context;
					}
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
				if (Array.isArray(data.context)) {
					finalContext = data.context;
				}
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

		if (!isCloudRouting && Array.isArray(finalContext)) {
			this.artifactLocalContext = finalContext;
		}

		return { text: aggregated, context: finalContext, isCloudRouting };
	}

	static applyArtifactsWebSearchToggleStyles() {
		if (!this.webSearchBtn) {
			return;
		}

		const activeBackground = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
		const activeColor = 'var(--presentation-export-color, #ffffff)';
		const inactiveBackground = 'var(--background-color, #18181b)';
		const inactiveColor = 'var(--text-color, #ffffff)';
		const activeLabel = this.t('artifactWebButtonActive', 'Web active');
		const inactiveLabel = this.t('artifactWebButtonInactive', 'Web');

		this.webSearchBtn.textContent = this.isArtifactsWebSearchEnabled ? activeLabel : inactiveLabel;

		this.webSearchBtn.style.background = this.isArtifactsWebSearchEnabled ? activeBackground : inactiveBackground;
		this.webSearchBtn.style.color = this.isArtifactsWebSearchEnabled ? activeColor : inactiveColor;
		this.webSearchBtn.style.border = this.isArtifactsWebSearchEnabled
			? '1px solid var(--presentation-export-border, transparent)'
			: '1px solid var(--border-color, #404040)';
	}

	static async promptArtifactName(defaultTitle = '') {
		return new Promise((resolve) => {
			const initialName = (defaultTitle || '').trim() || this.t('artifactUntitled', 'Untitled artifact');

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
			title.textContent = this.t('artifactNameDialogTitle', 'Name your artifact');
			title.style.fontSize = '16px';
			title.style.fontWeight = '600';
			title.style.color = 'var(--text-color, #ffffff)';
			title.style.marginBottom = '10px';

			const input = document.createElement('input');
			input.type = 'text';
			input.value = initialName;
			input.placeholder = this.t('artifactNamePlaceholder', 'Enter artifact name');
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
			cancelBtn.textContent = this.t('cancelButton', 'Cancel');
			cancelBtn.style.height = '34px';
			cancelBtn.style.padding = '0 12px';
			cancelBtn.style.border = '1px solid var(--border-color, #404040)';
			cancelBtn.style.borderRadius = '8px';
			cancelBtn.style.cursor = 'pointer';
			cancelBtn.style.background = 'var(--background-color, #18181b)';
			cancelBtn.style.color = 'var(--text-color, #ffffff)';

			const saveBtn = document.createElement('button');
			saveBtn.type = 'button';
			saveBtn.textContent = this.t('saveButton', 'Save');
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

	static async showArtifactPromptDialog(promptText = '') {
		return new Promise((resolve) => {
			const normalizedPrompt = this.normalizeArtifactPromptText(promptText);

			const overlay = document.createElement('div');
			overlay.style.position = 'fixed';
			overlay.style.inset = '0';
			overlay.style.zIndex = '10045';
			overlay.style.background = 'var(--modal-overlay-bg, rgba(30, 30, 30, 0.7))';
			overlay.style.backdropFilter = 'blur(5px)';
			overlay.style.webkitBackdropFilter = 'blur(5px)';
			overlay.style.display = 'flex';
			overlay.style.alignItems = 'center';
			overlay.style.justifyContent = 'center';

			const modal = document.createElement('div');
			modal.style.width = 'min(760px, 94vw)';
			modal.style.maxHeight = '80vh';
			modal.style.background = 'var(--presentation-modal-bg, var(--panel-background, #222426))';
			modal.style.border = '1px solid var(--border-color, #404040)';
			modal.style.borderRadius = '12px';
			modal.style.boxShadow = 'var(--presentation-modal-box-shadow, 0 8px 32px rgba(0,0,0,0.18))';
			modal.style.padding = '14px';
			modal.style.boxSizing = 'border-box';
			modal.style.display = 'flex';
			modal.style.flexDirection = 'column';
			modal.style.gap = '10px';

			const title = document.createElement('div');
			title.textContent = this.t('artifactPromptDialogTitle', 'Prompt used');
			title.style.fontSize = '16px';
			title.style.fontWeight = '600';
			title.style.color = 'var(--text-color, #ffffff)';

			const promptViewer = document.createElement('textarea');
			promptViewer.readOnly = true;
			promptViewer.value = normalizedPrompt || this.t('artifactPromptEmpty', 'No prompt saved for this artifact.');
			promptViewer.style.width = '100%';
			promptViewer.style.minHeight = '240px';
			promptViewer.style.maxHeight = '58vh';
			promptViewer.style.padding = '10px';
			promptViewer.style.borderRadius = '8px';
			promptViewer.style.border = '1px solid var(--border-color, #404040)';
			promptViewer.style.background = 'var(--background-color, #18181b)';
			promptViewer.style.color = 'var(--text-color, #ffffff)';
			promptViewer.style.outline = 'none';
			promptViewer.style.resize = 'vertical';
			promptViewer.style.boxSizing = 'border-box';

			const actions = document.createElement('div');
			actions.style.display = 'flex';
			actions.style.justifyContent = 'flex-end';
			actions.style.gap = '8px';

			const copyBtn = document.createElement('button');
			copyBtn.type = 'button';
			copyBtn.textContent = this.t('copy', 'Copy');
			copyBtn.style.height = '34px';
			copyBtn.style.padding = '0 12px';
			copyBtn.style.border = '1px solid var(--presentation-export-border, transparent)';
			copyBtn.style.borderRadius = '8px';
			copyBtn.style.cursor = 'pointer';
			copyBtn.style.background = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
			copyBtn.style.color = 'var(--presentation-export-color, #ffffff)';

			const closeBtn = document.createElement('button');
			closeBtn.type = 'button';
			closeBtn.textContent = this.t('closeButton', 'Close');
			closeBtn.style.height = '34px';
			closeBtn.style.padding = '0 12px';
			closeBtn.style.border = '1px solid var(--border-color, #404040)';
			closeBtn.style.borderRadius = '8px';
			closeBtn.style.cursor = 'pointer';
			closeBtn.style.background = 'var(--background-color, #18181b)';
			closeBtn.style.color = 'var(--text-color, #ffffff)';

			const closeAndResolve = () => {
				if (overlay && overlay.parentNode) {
					overlay.parentNode.removeChild(overlay);
				}
				resolve();
			};

			const copyPromptToClipboard = async () => {
				const textToCopy = String(promptViewer.value || '');
				if (!textToCopy) {
					return false;
				}

				if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
					await navigator.clipboard.writeText(textToCopy);
					return true;
				}

				promptViewer.focus();
				promptViewer.select();
				return document.execCommand('copy');
			};

			overlay.addEventListener('click', (event) => {
				if (event.target === overlay) {
					closeAndResolve();
				}
			});

			copyBtn.addEventListener('click', async () => {
				const originalLabel = copyBtn.textContent;
				try {
					const copied = await copyPromptToClipboard();
					copyBtn.textContent = copied ? this.t('copied', 'Copied!') : this.t('copyError', 'Error');
				} catch (_error) {
					copyBtn.textContent = this.t('copyError', 'Error');
				}

				setTimeout(() => {
					copyBtn.textContent = originalLabel;
				}, 1200);
			});

			closeBtn.addEventListener('click', closeAndResolve);
			overlay.addEventListener('keydown', (event) => {
				if (event.key === 'Escape') {
					event.preventDefault();
					closeAndResolve();
				}
			});

			actions.appendChild(copyBtn);
			actions.appendChild(closeBtn);
			modal.appendChild(title);
			modal.appendChild(promptViewer);
			modal.appendChild(actions);
			overlay.appendChild(modal);
			document.body.appendChild(overlay);

			overlay.setAttribute('tabindex', '-1');
			overlay.focus();
			setTimeout(() => {
				promptViewer.focus();
				promptViewer.setSelectionRange(0, 0);
			}, 0);
		});
	}

	static open({ onClose } = {}) {
		if (this.overlay && document.body.contains(this.overlay)) {
			return;
		}

		this.ensureRequestProgressStyles();

		const overlay = document.createElement('div');
		overlay.className = 'artifacts-overlay';
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

		const title = document.createElement('div');
		title.textContent = this.t('artifactsTab', 'Artifacts');
		title.style.fontWeight = '700';
		title.style.fontSize = '15px';
		title.style.color = 'var(--text-color, #ffffff)';

		const topActions = document.createElement('div');
		topActions.style.display = 'flex';
		topActions.style.alignItems = 'center';
		topActions.style.gap = '8px';
		topActions.style.marginLeft = 'auto';

		const requestProgressTrack = document.createElement('div');
		requestProgressTrack.className = 'artifacts-request-progress-track';
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
		requestProgressBar.className = 'artifacts-request-progress-bar';
		requestProgressBar.style.position = 'absolute';
		requestProgressBar.style.top = '0';
		requestProgressBar.style.bottom = '0';
		requestProgressBar.style.width = '34%';
		requestProgressBar.style.borderRadius = '999px';
		requestProgressBar.style.transform = 'translateX(-130%)';
		requestProgressBar.style.animation = 'artifactsRequestProgressIndefinite 1.25s ease-in-out infinite';
		requestProgressBar.style.animationPlayState = 'paused';

		requestProgressTrack.appendChild(requestProgressBar);

		const codeViewBtn = document.createElement('button');
		codeViewBtn.type = 'button';
		codeViewBtn.textContent = this.t('artworkCode', 'Code');
		codeViewBtn.style.height = '34px';
		codeViewBtn.style.padding = '0 12px';
		codeViewBtn.style.borderRadius = '8px';
		codeViewBtn.style.cursor = 'pointer';
		codeViewBtn.style.transition = 'background 0.2s, color 0.2s, border-color 0.2s';

		const artifactViewBtn = document.createElement('button');
		artifactViewBtn.type = 'button';
		artifactViewBtn.textContent = this.t('artifactItemLabel', 'Artifact');
		artifactViewBtn.style.height = '34px';
		artifactViewBtn.style.padding = '0 12px';
		artifactViewBtn.style.borderRadius = '8px';
		artifactViewBtn.style.cursor = 'pointer';
		artifactViewBtn.style.transition = 'background 0.2s, color 0.2s, border-color 0.2s';

		const closeBtn = document.createElement('button');
		closeBtn.type = 'button';
		closeBtn.innerHTML = '&times;';
		closeBtn.setAttribute('aria-label', this.t('artifactWindowCloseAria', 'Close artifacts window'));
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
		closeBtn.style.marginLeft = '16px';

		const workspace = document.createElement('div');
		workspace.className = 'artifacts-workspace';
		workspace.style.display = 'flex';
		workspace.style.flex = '1 1 auto';
		workspace.style.minHeight = '0';
		workspace.style.padding = '20px';
		workspace.style.gap = '20px';

		const canvasHost = document.createElement('div');
		canvasHost.style.flex = '1 1 auto';
		canvasHost.style.minWidth = '0';
		canvasHost.style.display = 'flex';

		const renderArea = document.createElement('div');
		renderArea.className = 'artifacts-render-area';
		renderArea.style.flex = '1 1 auto';
		renderArea.style.minWidth = '0';
		renderArea.style.background = 'var(--presentation-modal-bg, var(--panel-background, #222426))';
		renderArea.style.border = '1px solid var(--border-color, #404040)';
		renderArea.style.borderRadius = '12px';
		renderArea.style.boxShadow = 'var(--presentation-modal-box-shadow, 0 8px 32px rgba(0,0,0,0.18))';
		renderArea.style.overflow = 'hidden';
		renderArea.style.display = 'block';

		const editorShell = document.createElement('div');
		editorShell.className = 'artifacts-code-shell';
		editorShell.style.position = 'relative';
		editorShell.style.width = '100%';
		editorShell.style.height = '100%';
		editorShell.style.borderBottom = '1px solid var(--border-color, #404040)';
		editorShell.style.display = 'none';

		const editor = document.createElement('textarea');
		editor.className = 'artifacts-code-editor';
		editor.style.position = 'absolute';
		editor.style.inset = '0';
		editor.style.width = '100%';
		editor.style.height = '100%';
		editor.style.resize = 'none';
		editor.style.border = '0';
		editor.style.outline = 'none';
		editor.style.padding = '12px 12px 28px 12px';
		editor.style.boxSizing = 'border-box';
		editor.style.background = 'var(--background-color, #18181b)';
		editor.style.color = 'var(--text-color, #ffffff)';
		editor.style.caretColor = 'var(--text-color, #ffffff)';
		editor.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
		editor.style.fontSize = '13px';
		editor.style.lineHeight = '1.45';
		editor.style.whiteSpace = 'pre';
		editor.style.wordBreak = 'normal';
		editor.style.overflowWrap = 'normal';
		editor.style.tabSize = '4';
		editor.style.MozTabSize = '4';
		editor.style.overflow = 'auto';
		editor.wrap = 'off';
		editor.placeholder = '<!doctype html>\n<html>\n...';

		editorShell.appendChild(editor);

		const sidebar = document.createElement('aside');
		sidebar.style.width = '300px';
		sidebar.style.flex = '0 0 300px';
		sidebar.style.minHeight = '0';
		sidebar.style.display = 'flex';
		sidebar.style.flexDirection = 'column';
		sidebar.style.background = 'var(--presentation-modal-bg, var(--panel-background, #222426))';
		sidebar.style.border = '1px solid var(--border-color, #404040)';
		sidebar.style.borderRadius = '12px';
		sidebar.style.padding = '12px';
		sidebar.style.boxSizing = 'border-box';
		sidebar.style.color = 'var(--text-color, #ffffff)';
		sidebar.style.overflow = 'hidden';

		const bodyFrame = document.createElement('iframe');
		bodyFrame.className = 'artifacts-frame';
		bodyFrame.style.width = '100%';
		bodyFrame.style.height = '100%';
		bodyFrame.style.border = '0';
		bodyFrame.style.background = 'transparent';
		bodyFrame.setAttribute('allowfullscreen', 'true');
		bodyFrame.style.display = 'block';

		renderArea.appendChild(editorShell);
		renderArea.appendChild(bodyFrame);

		const sidebarEmpty = document.createElement('div');
		sidebarEmpty.textContent = this.t('artifactSidebarEmpty', 'No saved artifacts yet.');
		sidebarEmpty.style.opacity = '0.8';
		sidebarEmpty.style.fontSize = '13px';
		sidebarEmpty.style.marginTop = '10px';

		const sidebarList = document.createElement('div');
		sidebarList.style.marginTop = '10px';
		sidebarList.style.flex = '1 1 auto';
		sidebarList.style.minHeight = '0';
		sidebarList.style.overflowY = 'auto';
		sidebarList.style.overflowX = 'hidden';
		sidebarList.style.boxSizing = 'border-box';
		sidebarList.style.paddingRight = '12px';
		sidebarList.style.scrollbarGutter = 'stable';

		sidebar.appendChild(sidebarEmpty);
		sidebar.appendChild(sidebarList);

		canvasHost.appendChild(renderArea);
		workspace.appendChild(canvasHost);
		workspace.appendChild(sidebar);

		const bottomBar = document.createElement('div');
		bottomBar.style.flex = '0 0 auto';
		bottomBar.style.display = 'flex';
		bottomBar.style.justifyContent = 'space-between';
		bottomBar.style.alignItems = 'center';
		bottomBar.style.gap = '10px';
		bottomBar.style.padding = '12px 16px 16px 16px';
		bottomBar.style.background = 'var(--presentation-modal-bg, var(--panel-background, #222426))';
		bottomBar.style.borderTop = '1px solid var(--border-color, #404040)';

		const leftFooterGroup = document.createElement('div');
		leftFooterGroup.style.display = 'flex';
		leftFooterGroup.style.alignItems = 'center';
		leftFooterGroup.style.gap = '8px';
		leftFooterGroup.style.flex = '1 1 auto';
		leftFooterGroup.style.minWidth = '0';

		const rightFooterGroup = document.createElement('div');
		rightFooterGroup.style.display = 'flex';
		rightFooterGroup.style.alignItems = 'center';
		rightFooterGroup.style.gap = '10px';
		rightFooterGroup.style.flex = '0 0 auto';

		const promptInput = document.createElement('input');
		promptInput.type = 'text';
		promptInput.placeholder = this.t('enterMessage', 'Enter your message...');
		promptInput.style.height = '40px';
		promptInput.style.flex = '1 1 auto';
		promptInput.style.minWidth = '180px';
		promptInput.style.padding = '0 12px';
		promptInput.style.borderRadius = '8px';
		promptInput.style.border = '1px solid var(--border-color, #404040)';
		promptInput.style.background = 'var(--background-color, #18181b)';
		promptInput.style.color = 'var(--text-color, #ffffff)';
		promptInput.style.fontSize = '15px';
		promptInput.style.outline = 'none';

		const statusLabel = document.createElement('span');
		statusLabel.style.fontSize = '12px';
		statusLabel.style.opacity = '0';
		statusLabel.style.whiteSpace = 'nowrap';
		statusLabel.style.overflow = 'hidden';
		statusLabel.style.textOverflow = 'ellipsis';
		statusLabel.style.maxWidth = '220px';
		statusLabel.style.color = 'var(--text-color, #ffffff)';

		const saveArtifactBtn = document.createElement('button');
		saveArtifactBtn.type = 'button';
		saveArtifactBtn.textContent = this.t('saveArtifactButton', 'Save Artifact');
		saveArtifactBtn.style.height = '40px';
		saveArtifactBtn.style.padding = '0 16px';
		saveArtifactBtn.style.border = '1px solid var(--presentation-export-border, transparent)';
		saveArtifactBtn.style.borderRadius = '8px';
		saveArtifactBtn.style.cursor = 'pointer';
		saveArtifactBtn.style.background = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
		saveArtifactBtn.style.color = 'var(--presentation-export-color, #ffffff)';

		const fullscreenBtn = document.createElement('button');
		fullscreenBtn.type = 'button';
		fullscreenBtn.textContent = this.t('paperworkFullscreen', 'Fullscreen');
		fullscreenBtn.style.height = '40px';
		fullscreenBtn.style.padding = '0 16px';
		fullscreenBtn.style.border = '1px solid var(--presentation-export-border, transparent)';
		fullscreenBtn.style.borderRadius = '8px';
		fullscreenBtn.style.cursor = 'pointer';
		fullscreenBtn.style.background = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
		fullscreenBtn.style.color = 'var(--presentation-export-color, #ffffff)';

		const sendBtn = document.createElement('button');
		sendBtn.type = 'button';
		sendBtn.textContent = this.t('sendButton', 'Send');
		sendBtn.style.height = '40px';
		sendBtn.style.padding = '0 16px';
		sendBtn.style.border = '1px solid var(--presentation-export-border, transparent)';
		sendBtn.style.borderRadius = '8px';
		sendBtn.style.cursor = 'pointer';
		sendBtn.style.background = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
		sendBtn.style.color = 'var(--presentation-export-color, #ffffff)';

		const webSearchBtn = document.createElement('button');
		webSearchBtn.type = 'button';
		webSearchBtn.textContent = this.t('artifactWebButtonInactive', 'Web');
		webSearchBtn.style.height = '40px';
		webSearchBtn.style.minWidth = '96px';
		webSearchBtn.style.padding = '0 16px';
		webSearchBtn.style.borderRadius = '8px';
		webSearchBtn.style.cursor = 'pointer';
		webSearchBtn.style.transition = 'background 0.2s, color 0.2s, border-color 0.2s';

		const closeWindow = () => {
			if (this.currentAbortController) {
				this.currentAbortController.abort();
				this.currentAbortController = null;
			}
			this.setGenerationStatus('');
			this.setRequestProgressVisible(false);
			this.resetArtifactConversationContext();

			if (this.fullscreenChangeHandler) {
				document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler);
				this.fullscreenChangeHandler = null;
			}

			if (overlay && document.body.contains(overlay)) {
				document.body.removeChild(overlay);
			}

			this.overlay = null;
			this.fullscreenBtn = null;
			this.saveArtifactBtn = null;
			this.promptInput = null;
			this.sendBtn = null;
			this.webSearchBtn = null;
			this.statusLabel = null;
			this.requestProgressTrack = null;
			this.requestProgressBar = null;
			this.currentArtifactPrompt = '';
			this.codeEditor = null;
			this.codeEditorShell = null;
			this.codePreview = null;
			this.codePreviewLayer = null;
			this.renderFrame = null;
			this.sidebarList = null;
			this.sidebarEmpty = null;

			if (typeof onClose === 'function') {
				onClose();
			}
		};

		this.fullscreenChangeHandler = () => {
			this.updateFullscreenButtonLabel();
		};
		document.addEventListener('fullscreenchange', this.fullscreenChangeHandler);

		let editorUpdateTimer = null;
		editor.addEventListener('input', () => {
			if (editorUpdateTimer) {
				clearTimeout(editorUpdateTimer);
			}
			editorUpdateTimer = setTimeout(() => {
				this.currentArtifactHtml = editor.value || '';
				this.renderCurrentArtifact();
			}, 120);
		});
		editor.addEventListener('mousedown', () => this.setArtifactEditorMode(true));
		editor.addEventListener('focus', () => this.setArtifactEditorMode(true));
		editor.addEventListener('blur', () => this.setArtifactEditorMode(true));

		saveArtifactBtn.addEventListener('click', async () => {
			const hashedMasterKey = this.getActiveHashedMasterKey();
			const dbApi = this.getDatabaseApi();
			if (!hashedMasterKey || !dbApi || typeof dbApi.saveArtifact !== 'function') {
				alert(this.t('artifactDatabaseUnavailable', 'Database API unavailable.'));
				return;
			}

			const htmlToSave = (this.currentArtifactHtml || '').trim();
			const promptToSave = this.normalizeArtifactPromptText(this.currentArtifactPrompt || '');
			if (!htmlToSave) {
				alert(this.t('artifactNoHtmlToSave', 'No HTML to save.'));
				return;
			}

			const defaultTitle = this.extractArtifactTitle(htmlToSave);
			const chosenTitle = await this.promptArtifactName(defaultTitle);
			if (chosenTitle === null) {
				return;
			}
			const finalTitle = (chosenTitle || defaultTitle || this.t('artifactUntitled', 'Untitled artifact')).trim();

			saveArtifactBtn.disabled = true;
			const previousLabel = saveArtifactBtn.textContent;
			saveArtifactBtn.textContent = this.t('savingButton', 'Saving...');

			try {
				await dbApi.saveArtifact(hashedMasterKey, {
					title: finalTitle,
					html: htmlToSave,
					prompt: promptToSave,
				});
				await this.refreshSavedArtifacts();
			} catch (error) {
				console.error('[ArtifactsWindow] Save artifact failed:', error);
				alert(this.t('artifactSaveFailed', 'Could not save artifact.'));
			} finally {
				saveArtifactBtn.disabled = false;
				saveArtifactBtn.textContent = previousLabel;
			}
		});

		this.currentAbortController = null;
		this.isArtifactsWebSearchEnabled = false;
		this.webSearchBtn = webSearchBtn;
		this.applyArtifactsWebSearchToggleStyles();

		webSearchBtn.addEventListener('click', () => {
			this.isArtifactsWebSearchEnabled = !this.isArtifactsWebSearchEnabled;
			this.applyArtifactsWebSearchToggleStyles();
		});

		promptInput.addEventListener('keydown', (event) => {
			if (event.key !== 'Enter') {
				return;
			}
			event.preventDefault();
			if (!sendBtn.disabled) {
				sendBtn.click();
			}
		});

		sendBtn.addEventListener('click', async () => {
			if (this.currentAbortController) {
				this.currentAbortController.abort();
				this.setGenerationStatus(this.t('artifactStatusCancelled', 'Cancelled'), 'idle');
				this.setRequestProgressVisible(false);
				return;
			}

			const previousLabel = sendBtn.textContent;
			const previousBackground = sendBtn.style.background;
			const previousColor = sendBtn.style.color;

			const abortController = new AbortController();
			this.currentAbortController = abortController;
			this.setViewMode('code');
			if (this.codeEditor) {
				this.setCodeEditorValue('');
			}
			this.currentArtifactHtml = '';

			sendBtn.textContent = this.t('cancelButton', 'Cancel');
			sendBtn.style.background = '#ef4444';
			sendBtn.style.color = '#ffffff';
			sendBtn.disabled = false;
			promptInput.disabled = true;
			webSearchBtn.disabled = true;
			this.setRequestProgressVisible(true);

			try {
				const promptText = String(promptInput.value || '').trim();
				promptInput.value = '';
				let effectiveUserPrompt = promptText;

				let smoothQueue = '';
				let smoothRaf = null;
				const flushSmoothQueue = () => {
					if (smoothRaf) {
						cancelAnimationFrame(smoothRaf);
						smoothRaf = null;
					}
					if (smoothQueue && this.codeEditor) {
						this.appendCodeEditorValue(smoothQueue);
						this.scrollCodeEditorToBottom();
						smoothQueue = '';
					}
				};
				const pumpSmoothQueue = () => {
					smoothRaf = null;
					if (!this.codeEditor || !smoothQueue) {
						return;
					}
					const take = Math.min(14, smoothQueue.length);
					this.appendCodeEditorValue(smoothQueue.slice(0, take));
					this.scrollCodeEditorToBottom();
					smoothQueue = smoothQueue.slice(take);
					if (smoothQueue.length > 0) {
						smoothRaf = requestAnimationFrame(pumpSmoothQueue);
					}
				};
				const queueCodeChunk = (chunk) => {
					if (!chunk) {
						return;
					}
					smoothQueue += chunk;
					if (!smoothRaf) {
						smoothRaf = requestAnimationFrame(pumpSmoothQueue);
					}
				};

				const fenceExtractor = this.createCodeFenceExtractor(queueCodeChunk);

				if (this.isArtifactsWebSearchEnabled && promptText) {
					this.setGenerationStatus(this.t('artifactStatusWebSearchRunning', 'Web search running...'), 'idle');
					const webSearchSourceText = await this.buildWebSearchSourceText(promptText, abortController.signal);
					if (webSearchSourceText) {
						effectiveUserPrompt = [
							'Use the following user goal and web research context to produce the artifact HTML.',
							`User goal:\n${promptText}`,
							'',
							webSearchSourceText,
						].join('\n');
					}
				}

				this.setGenerationStatus(this.t('artifactStatusGenerating', 'Generating artifact...'), 'idle');
				const streamResult = await this.streamArtifactHtml(effectiveUserPrompt, abortController.signal, (delta) => {
					fenceExtractor.push(delta);
				});

				const fenceState = fenceExtractor.finish();
				flushSmoothQueue();

				const receivedCode = this.codeEditor ? String(this.codeEditor.value || '').trim() : '';
				if (!fenceState.started || !receivedCode) {
					throw new Error('No code block received from model response.');
				}

				this.currentArtifactHtml = receivedCode;
				this.currentArtifactPrompt = promptText;
				this.addArtifactHistoryTurn('user', promptText);
				this.addArtifactHistoryTurn('assistant', receivedCode);
				if (streamResult && !streamResult.isCloudRouting && Array.isArray(streamResult.context)) {
					this.artifactLocalContext = streamResult.context;
				}
				this.setViewMode('artifact');
				this.setGenerationStatus(this.t('artifactStatusDone', 'Done'), 'success');
			} catch (error) {
				if (error && error.name === 'AbortError') {
					this.setGenerationStatus(this.t('artifactStatusCancelled', 'Cancelled'), 'idle');
				} else {
					console.error('[ArtifactsWindow] Send failed:', error);
					this.setGenerationStatus(this.t('artifactStatusFailed', 'Generation failed'), 'error');
				}
			} finally {
				this.currentAbortController = null;
				this.setRequestProgressVisible(false);
				sendBtn.textContent = previousLabel;
				sendBtn.style.background = previousBackground;
				sendBtn.style.color = previousColor;
				sendBtn.disabled = false;
				promptInput.disabled = false;
				webSearchBtn.disabled = false;
			}
		});

		fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
		codeViewBtn.addEventListener('click', () => this.setViewMode('code'));
		artifactViewBtn.addEventListener('click', () => this.setViewMode('artifact'));
		closeBtn.addEventListener('click', closeWindow);
		overlay.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				closeWindow();
			}
		});

		topBar.appendChild(title);
		topBar.appendChild(requestProgressTrack);
		topActions.appendChild(codeViewBtn);
		topActions.appendChild(artifactViewBtn);
		topActions.appendChild(closeBtn);
		topBar.appendChild(topActions);
		overlay.appendChild(topBar);
		overlay.appendChild(workspace);
		leftFooterGroup.appendChild(promptInput);
		leftFooterGroup.appendChild(statusLabel);
		leftFooterGroup.appendChild(sendBtn);
		leftFooterGroup.appendChild(webSearchBtn);
		rightFooterGroup.appendChild(saveArtifactBtn);
		rightFooterGroup.appendChild(fullscreenBtn);
		bottomBar.appendChild(leftFooterGroup);
		bottomBar.appendChild(rightFooterGroup);
		overlay.appendChild(bottomBar);

		document.body.appendChild(overlay);
		overlay.setAttribute('tabindex', '-1');
		overlay.focus();

		this.overlay = overlay;
		this.fullscreenBtn = fullscreenBtn;
		this.saveArtifactBtn = saveArtifactBtn;
		this.promptInput = promptInput;
		this.sendBtn = sendBtn;
		this.statusLabel = statusLabel;
		this.requestProgressTrack = requestProgressTrack;
		this.requestProgressBar = requestProgressBar;
		this.codeEditor = editor;
		this.codeEditorShell = editorShell;
		this.codePreviewLayer = null;
		this.codePreview = null;
		this.codeViewBtn = codeViewBtn;
		this.artifactViewBtn = artifactViewBtn;
		this.renderFrame = bodyFrame;
		this.sidebarList = sidebarList;
		this.sidebarEmpty = sidebarEmpty;
		this.currentArtifactHtml = this.currentArtifactHtml || this.getDefaultArtifactHtml();
		if (typeof this.currentArtifactPrompt !== 'string') {
			this.currentArtifactPrompt = '';
		}
		this.setCodeEditorValue(this.currentArtifactHtml);
		this.setArtifactEditorMode(false);
		this.renderCurrentArtifact();
		this.setViewMode('artifact');
		this.setRequestProgressVisible(false);
		this.updateFullscreenButtonLabel();
		this.refreshSavedArtifacts();
	}

	static applyViewModeStyles() {
		if (!this.codeViewBtn || !this.artifactViewBtn || !this.codeEditorShell || !this.renderFrame) {
			return;
		}

		const activeBackground = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
		const activeColor = 'var(--presentation-export-color, #ffffff)';
		const inactiveBackground = 'var(--background-color, #18181b)';
		const inactiveColor = 'var(--text-color, #ffffff)';

		const codeActive = this.activeViewMode === 'code';
		this.codeEditorShell.style.display = codeActive ? 'block' : 'none';
		this.renderFrame.style.display = codeActive ? 'none' : 'block';

		this.codeViewBtn.style.background = codeActive ? activeBackground : inactiveBackground;
		this.codeViewBtn.style.color = codeActive ? activeColor : inactiveColor;
		this.codeViewBtn.style.border = codeActive
			? '1px solid var(--presentation-export-border, transparent)'
			: '1px solid var(--border-color, #404040)';

		this.artifactViewBtn.style.background = codeActive ? inactiveBackground : activeBackground;
		this.artifactViewBtn.style.color = codeActive ? inactiveColor : activeColor;
		this.artifactViewBtn.style.border = codeActive
			? '1px solid var(--border-color, #404040)'
			: '1px solid var(--presentation-export-border, transparent)';
	}

	static setViewMode(mode) {
		this.activeViewMode = mode === 'code' ? 'code' : 'artifact';
		this.setArtifactEditorMode(this.activeViewMode === 'code');
		if (this.activeViewMode === 'artifact' && this.codeEditor) {
			const codeFromEditor = String(this.codeEditor.value || '').trim();
			if (codeFromEditor) {
				this.currentArtifactHtml = codeFromEditor;
				this.renderCurrentArtifact();
			}
		}
		this.applyViewModeStyles();
	}

	static getDefaultArtifactHtml() {
		const titleText = this.t('artifactsTab', 'Artifacts');
		const hintText = this.t('artifactDefaultHint', 'Start building your artifact HTML here.');
		return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${titleText}</title>
  <style>
	body {
	  margin: 0;
	  min-height: 100vh;
	  display: grid;
	  place-items: center;
	  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
	  background: linear-gradient(140deg, #e0f2fe 0%, #f8fafc 55%, #dbeafe 100%);
	  color: #0f172a;
	}
	.card {
	  width: min(680px, 92vw);
	  background: #ffffff;
	  border: 1px solid #dbeafe;
	  border-radius: 16px;
	  padding: 20px;
	  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
	}
	h1 { margin: 0 0 8px; font-size: 1.3rem; }
	p { margin: 0; line-height: 1.5; }
  </style>
</head>
<body>
  <main class="card">
	<h1>${titleText}</h1>
	<p>${hintText}</p>
  </main>
</body>
</html>`;
	}

	static renderCurrentArtifact() {
		if (!this.renderFrame) {
			return;
		}
		const html = this.currentArtifactHtml || this.getDefaultArtifactHtml();
		this.renderFrame.srcdoc = this.normalizeYouTubeEmbeds(html);
	}

	static async refreshSavedArtifacts() {
		if (!this.sidebarList || !this.sidebarEmpty) {
			return;
		}

		const hashedMasterKey = this.getActiveHashedMasterKey();
		const dbApi = this.getDatabaseApi();
		if (!hashedMasterKey || !dbApi || typeof dbApi.getArtifacts !== 'function') {
			this.sidebarList.innerHTML = '';
			this.sidebarEmpty.style.display = 'block';
			return;
		}

		this.sidebarList.innerHTML = '';
		this.sidebarEmpty.style.display = 'block';
		this.sidebarEmpty.textContent = this.t('artifactSidebarLoading', 'Loading saved artifacts...');

		const savedItems = await dbApi.getArtifacts(hashedMasterKey);
		this.sidebarList.innerHTML = '';
		this.sidebarList.style.display = 'flex';
		this.sidebarList.style.flexDirection = 'column';
		this.sidebarList.style.alignItems = 'center';
		this.sidebarEmpty.textContent = this.t('artifactSidebarEmpty', 'No saved artifacts yet.');
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
			thumbText.textContent = item.title || this.t('artifactItemLabel', 'Artifact');
			thumbText.style.fontSize = '12px';
			thumbText.style.lineHeight = '1.3';
			thumbText.style.textAlign = 'center';
			thumbText.style.opacity = '0.92';
			thumbText.style.wordBreak = 'break-word';
			thumb.appendChild(thumbText);

			const time = document.createElement('div');
			time.textContent = this.formatDateLabel(item.updated_at || item.created_at);
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
			saveToDiskBtn.textContent = this.t('saveToDiskButton', 'Save to disk');
			saveToDiskBtn.style.height = '30px';
			saveToDiskBtn.style.padding = '0 10px';
			saveToDiskBtn.style.border = '1px solid var(--border-color, #404040)';
			saveToDiskBtn.style.borderRadius = '8px';
			saveToDiskBtn.style.cursor = 'pointer';
			saveToDiskBtn.style.background = 'var(--presentation-export-bg, var(--accent-color, #4f46e5))';
			saveToDiskBtn.style.color = 'var(--presentation-export-color, #ffffff)';
			saveToDiskBtn.style.fontSize = '12px';

			const promptBtn = document.createElement('button');
			promptBtn.type = 'button';
			promptBtn.textContent = this.t('artifactPromptButton', 'Prompt');
			promptBtn.style.height = '30px';
			promptBtn.style.padding = '0 10px';
			promptBtn.style.border = '1px solid var(--border-color, #404040)';
			promptBtn.style.borderRadius = '8px';
			promptBtn.style.cursor = 'pointer';
			promptBtn.style.background = 'var(--background-color, #18181b)';
			promptBtn.style.color = 'var(--text-color, #ffffff)';
			promptBtn.style.fontSize = '12px';

			const deleteBtn = document.createElement('button');
			deleteBtn.type = 'button';
			deleteBtn.textContent = this.t('deleteButton', 'Delete');
			deleteBtn.style.height = '30px';
			deleteBtn.style.padding = '0 10px';
			deleteBtn.style.border = '1px solid var(--border-color, #404040)';
			deleteBtn.style.borderRadius = '8px';
			deleteBtn.style.cursor = 'pointer';
			deleteBtn.style.background = 'var(--presentation-modal-close-bg, #e53935)';
			deleteBtn.style.color = 'var(--presentation-modal-close-icon-color, #ffffff)';
			deleteBtn.style.fontSize = '12px';

			actions.appendChild(promptBtn);
			actions.appendChild(saveToDiskBtn);
			actions.appendChild(deleteBtn);
			card.appendChild(openBtn);
			card.appendChild(actions);

			const openSavedArtifact = async () => {
				const resolvedDbApi = this.getDatabaseApi();
				if (!resolvedDbApi || typeof resolvedDbApi.loadArtifactHtml !== 'function') {
					return;
				}

				const html = await resolvedDbApi.loadArtifactHtml(hashedMasterKey, item.id);
				if (!html) {
					return;
				}

				this.currentArtifactHtml = html;
				this.currentArtifactPrompt = this.normalizeArtifactPromptText(item.prompt_text || '');
				if (this.codeEditor) {
					this.setCodeEditorValue(html);
				}
				this.renderCurrentArtifact();
			};

			promptBtn.addEventListener('click', async (event) => {
				event.preventDefault();
				event.stopPropagation();
				await this.showArtifactPromptDialog(item.prompt_text || '');
			});

			openBtn.addEventListener('click', async (event) => {
				event.preventDefault();
				event.stopPropagation();
				await openSavedArtifact();
			});

			card.addEventListener('click', async () => {
				await openSavedArtifact();
			});

			saveToDiskBtn.addEventListener('click', async (event) => {
				event.preventDefault();
				event.stopPropagation();

				const resolvedDbApi = this.getDatabaseApi();
				if (!resolvedDbApi || typeof resolvedDbApi.loadArtifactHtml !== 'function') {
					return;
				}

				const html = await resolvedDbApi.loadArtifactHtml(hashedMasterKey, item.id);
				if (!html) {
					return;
				}

				await this.saveHtmlToDisk(item.title || this.t('artifactFilenameBase', 'artifact'), html);
			});

			deleteBtn.addEventListener('click', async (event) => {
				event.stopPropagation();
				const resolvedDbApi = this.getDatabaseApi();
				if (!resolvedDbApi || typeof resolvedDbApi.deleteArtifact !== 'function') {
					return;
				}

				const confirmMessage = window.Lang
					? (Lang.get('confirmDeleteArtifact') || 'Are you sure you want to delete this artifact?')
					: 'Are you sure you want to delete this artifact?';
				if (!confirm(confirmMessage)) {
					return;
				}

				deleteBtn.disabled = true;
				const deleted = await resolvedDbApi.deleteArtifact(hashedMasterKey, item.id);
				if (!deleted) {
					deleteBtn.disabled = false;
					return;
				}

				await this.refreshSavedArtifacts();
			});

			this.sidebarList.appendChild(card);
		});
	}

	static updateFullscreenButtonLabel() {
		if (!this.fullscreenBtn) {
			return;
		}
		const isFullscreen = !!document.fullscreenElement;
		this.fullscreenBtn.textContent = window.Lang
			? (Lang.get(isFullscreen ? 'paperworkExitFullscreen' : 'paperworkFullscreen') || (isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'))
			: (isFullscreen ? 'Exit Fullscreen' : 'Fullscreen');
	}

	static async toggleFullscreen() {
		const target = this.renderFrame || this.overlay;
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
			console.error('Failed to toggle artifacts fullscreen:', error);
		} finally {
			this.updateFullscreenButtonLabel();
		}
	}

	static extractArtifactTitle(htmlContent) {
		if (!htmlContent) {
			return 'artifact';
		}

		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(htmlContent, 'text/html');
			const title = (doc.querySelector('title')?.textContent || '').trim();
			if (title) {
				return title.slice(0, 120);
			}
		} catch (error) {
			// Fall back to default title on parse failures.
		}

		return 'artifact';
	}

	static sanitizeHtmlFilename(rawTitle) {
		const base = (rawTitle || 'artifact')
			.toString()
			.trim()
			.replace(/\.[a-z0-9]+$/i, '')
			.replace(/[\\/:*?"<>|]+/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();

		return (base || 'artifact').slice(0, 120);
	}

	static async saveCurrentArtifactToDisk() {
		const htmlContent = (this.currentArtifactHtml || '').trim();
		if (!htmlContent) {
			return;
		}

		const title = this.extractArtifactTitle(htmlContent);
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
				return;
			} catch (error) {
				if (error && error.name === 'AbortError') {
					return;
				}
				console.error('[ArtifactsWindow] File picker save failed, falling back to download', error);
			}
		}

		const objectUrl = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = objectUrl;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
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
				return;
			} catch (error) {
				if (error && error.name === 'AbortError') {
					return;
				}
				console.error('[ArtifactsWindow] File picker save failed, falling back to download', error);
			}
		}

		const objectUrl = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = objectUrl;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
	}
}

window.ArtifactsWindow = ArtifactsWindow;

window.addEventListener('artifacts:open-requested', () => {
	if (window.ArtifactsWindow && typeof window.ArtifactsWindow.open === 'function') {
		window.ArtifactsWindow.open();
	}
});
