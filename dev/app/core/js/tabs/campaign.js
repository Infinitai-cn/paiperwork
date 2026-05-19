class CampaignWorkflowManager {
	constructor(tab) {
		this.tab = tab;
	}

	async buildExecutionResponse(action, payload) {
		const selectedModel = String(payload?.model?.value || '').trim();
		if (!selectedModel) {
			return {
				chatMessage: '',
				statusMessage: Lang.get('noModelSelected'),
				workflow: null,
				artifactRequests: []
			};
		}

		const workflow = this.buildExecutionPlan(action, payload);
		return {
			chatMessage: '',
			statusMessage: Lang.get('campaignWorkflowAppliedStatus'),
			workflow,
			artifactRequests: this.buildArtifactRequests(workflow, payload, action)
		};
	}

	async runWorkflow(action, payload) {
		const selectedModel = String(payload?.model?.value || '').trim();
		if (!selectedModel) {
			return {
				chatMessage: Lang.get('noModelSelected'),
				statusMessage: Lang.get('noModelSelected')
			};
		}

		if (!window.OllamaAPI || typeof window.OllamaAPI.OrchestratorCall !== 'function') {
			return {
				chatMessage: Lang.get('campaignOrchestratorUnavailable'),
				statusMessage: Lang.get('campaignOrchestratorUnavailable')
			};
		}

		const userPrompt = this.buildOrchestratorPrompt(action, payload);
		const systemPrompt = this.getOrchestratorSystemPrompt();
		const contextSize = String(document.getElementById('context-selector')?.value || '8192');
		const contextKey = this.getContextKey();
		const previousContext = this.getContext(contextKey);

		this.appendContextTurn(contextKey, {
			role: 'user',
			text: payload.prompt || this.getActionLabel(action)
		});

		try {
			const raw = await window.OllamaAPI.OrchestratorCall(
				userPrompt,
				systemPrompt,
				contextSize,
				previousContext,
				null,
				`campaign_orch_${Date.now()}`,
				null
			);

			const parsed = this.parseOrchestratorResponse(raw);
			const assistantText = parsed.chatMessage
				|| parsed.statusMessage
				|| (typeof raw === 'string' && raw.trim() ? raw.trim() : Lang.get('campaignOrchestratorEmptyResponse'));

			this.appendContextTurn(contextKey, {
				role: 'assistant',
				text: assistantText
			});

			return {
				campaign_brief: parsed.campaignBrief,
				palette: parsed.palette,
				outputs: parsed.outputs,
				chatMessage: assistantText,
				statusMessage: parsed.statusMessage || Lang.get('campaignWorkflowAppliedStatus'),
				workflow: parsed.workflow,
				artifactRequests: []
			};
		} catch (error) {
			console.error('CampaignWorkflowManager: orchestrator workflow failed', error);
			return {
				chatMessage: Lang.get('campaignOrchestratorFailed'),
				statusMessage: Lang.get('campaignOrchestratorFailed')
			};
		}
	}

	buildArtifactRequests(workflow, payload, action) {
		if (!workflow || typeof workflow !== 'object') {
			return [];
		}

		if (!this.isWorkflowExecutionAction(action)) {
			return [];
		}

		const recommendedAction = String(workflow.recommended_action || workflow.recommendedAction || 'none').trim().toLowerCase();
		if (!recommendedAction || recommendedAction === 'none') {
			return [];
		}

		const requestedTargets = Array.isArray(workflow.targets) ? workflow.targets : [];
		const allowedTargets = ['poster', 'presentation', 'miniapp'];
		return requestedTargets
			.map(target => String(target || '').trim().toLowerCase())
			.filter(target => allowedTargets.includes(target))
			.map(target => ({
				target,
				action: recommendedAction,
				reason: String(workflow.reason || '').trim(),
				model: payload?.model || {},
				campaign: payload?.campaign || {},
				prompt: payload?.prompt || '',
				images: Array.isArray(payload?.images) ? payload.images : []
			}));
	}

	buildExecutionPlan(action, payload) {
		const outputs = payload?.campaign?.outputs || {};
		const hasImages = Array.isArray(payload?.images) && payload.images.some(image => image?.dataUrl);
		const fallbackTargets = [];

		if (action === 'generate') {
			fallbackTargets.push('presentation', 'miniapp');
			if (hasImages) {
				fallbackTargets.push('poster');
			}
		}

		const plan = {
			recommended_action: action,
			targets: fallbackTargets,
			reason: `Deterministic ${action} execution plan triggered by the user action button.`
		};

		console.log('CampaignWorkflowManager: buildExecutionPlan', {
			action,
			hasImages,
			targets: fallbackTargets
		});

		return plan;
	}

	isWorkflowExecutionAction(action) {
		return action === 'generate';
	}

	getActionLabel(action) {
		if (action === 'discuss') {
			return 'Discuss Campaign';
		}

		return Lang.get(`campaignActionLabel_${action}`) || action || 'Campaign action';
	}

	async consumeArtifactRequest(request) {
		const target = String(request?.target || '').trim().toLowerCase();
		if (!target) {
			return {
				target,
				action: request?.action || '',
				chatMessage: Lang.get('campaignArtifactLaunchFailed'),
				statusMessage: Lang.get('campaignArtifactLaunchFailed')
			};
		}

		switch (target) {
			case 'presentation':
				return this.consumePresentationRequest(request);
			case 'miniapp':
				return this.consumeMiniappRequest(request);
			case 'poster':
				return this.consumePosterRequest(request);
			default:
				return {
					target,
					action: request?.action || '',
					chatMessage: Lang.get('campaignArtifactLaunchFailed'),
					statusMessage: Lang.get('campaignArtifactLaunchFailed')
				};
		}
	}

	async consumePresentationRequest(request) {
		const signal = request?.signal || null;
		let releaseAbort = () => {};
		let restoreOverlay = () => {};
		try {
			this.throwIfAborted(signal);
			await this.loadPromptedPresentationScript();

			const workflow = window.PromptedPresentationWorkflow;
			if (!workflow || typeof workflow.open !== 'function') {
				return this.buildArtifactFailure('presentation', request.action, Lang.get('campaignArtifactLaunchFailed'));
			}

			releaseAbort = this.bindAbortSignal(signal, () => {
				this.abortPresentationWorkflow();
			});

			const previousHtml = String(workflow.currentPresentationHtml || '').trim();
			const sourceText = this.buildCampaignSourceText(request);
			workflow.savedSourceText = sourceText;
			workflow.savedExtraRequestText = this.buildPresentationExtraPrompt(request);
			workflow.savedSlideCount = 5;
			workflow.currentPresentationHtml = '';
			workflow.open();

			const overlay = await this.waitFor(() => workflow.overlay || false, 4000, signal);
			restoreOverlay = this.concealOverlayElement(overlay);
			const sendButton = await this.waitFor(() => this.findSendButton(workflow.overlay), 4000, signal);
			if (!sendButton) {
				return this.buildArtifactFailure('presentation', request.action, Lang.get('campaignArtifactLaunchFailed'));
			}

			this.throwIfAborted(signal);
			sendButton.click();
			const finalHtml = await this.waitForPromptablePresentationHtml(previousHtml, signal);
			if (window.PromptedPresentationWorkflow && typeof window.PromptedPresentationWorkflow.close === 'function') {
				window.PromptedPresentationWorkflow.close();
			}
			return this.buildArtifactCompleted('presentation', request.action, {
				presentation_html: finalHtml
			});
		} catch (error) {
			if (this.isAbortError(error)) {
				return this.buildArtifactCancelled('presentation', request.action);
			}
			console.error('CampaignWorkflowManager: presentation consumer failed', error);
			return this.buildArtifactFailure('presentation', request.action, Lang.get('campaignArtifactLaunchFailed'));
		} finally {
			releaseAbort();
			restoreOverlay();
		}
	}

	async consumeMiniappRequest(request) {
		const signal = request?.signal || null;
		let releaseAbort = () => {};
		let restoreOverlay = () => {};
		try {
			this.throwIfAborted(signal);
			await this.loadArtifactsScript();

			if (!window.ArtifactsWindow || typeof window.ArtifactsWindow.open !== 'function') {
				return this.buildArtifactFailure('miniapp', request.action, Lang.get('campaignArtifactLaunchFailed'));
			}

			releaseAbort = this.bindAbortSignal(signal, () => {
				this.abortMiniappWorkflow();
			});

			const sourceText = this.buildCampaignSourceText(request);
			const extraRequestText = this.buildMiniappExtraPrompt(request);
			const previousHtml = String(window.ArtifactsWindow.currentArtifactHtml || '').trim();
			window.ArtifactsWindow.savedSourceText = sourceText;
			window.ArtifactsWindow.savedExtraRequestText = extraRequestText;
			window.ArtifactsWindow.currentArtifactHtml = '';
			window.ArtifactsWindow.open();

			const overlay = await this.waitFor(() => window.ArtifactsWindow.overlay || false, 4000, signal);
			restoreOverlay = this.concealOverlayElement(overlay);

			if (window.ArtifactsWindow.promptInput) {
				window.ArtifactsWindow.promptInput.value = `${extraRequestText}${sourceText}`;
				window.ArtifactsWindow.promptInput.dispatchEvent(new Event('input', { bubbles: true }));
			}

			const sendButton = await this.waitFor(() => this.findSendButton(window.ArtifactsWindow.overlay), 4000, signal);
			if (!sendButton) {
				return this.buildArtifactFailure('miniapp', request.action, Lang.get('campaignArtifactLaunchFailed'));
			}

			this.throwIfAborted(signal);
			sendButton.click();
			const htmlContent = await this.waitForArtifactHtml(previousHtml, signal);
			const standaloneHtml = typeof window.ArtifactsWindow.buildStandaloneArtifactHtml === 'function'
				? await window.ArtifactsWindow.buildStandaloneArtifactHtml(htmlContent)
				: htmlContent;
			if (window.ArtifactsWindow && typeof window.ArtifactsWindow.close === 'function') {
				window.ArtifactsWindow.close();
			}
			return this.buildArtifactCompleted('miniapp', request.action, {
				miniapp_html: standaloneHtml || htmlContent
			});
		} catch (error) {
			if (this.isAbortError(error)) {
				return this.buildArtifactCancelled('miniapp', request.action);
			}
			console.error('CampaignWorkflowManager: miniapp consumer failed', error);
			return this.buildArtifactFailure('miniapp', request.action, Lang.get('campaignArtifactLaunchFailed'));
		} finally {
			releaseAbort();
			restoreOverlay();
		}
	}

	async consumePosterRequest(request) {
		const signal = request?.signal || null;
		let releaseAbort = () => {};
		const imageEntry = Array.isArray(request?.images) ? request.images.find(image => image?.dataUrl) : null;
		if (!imageEntry) {
			console.warn('CampaignWorkflowManager: poster request skipped because no campaign image was provided', {
				action: request?.action || '',
				imageCount: Array.isArray(request?.images) ? request.images.length : 0
			});
			return this.buildArtifactFailure('poster', request.action, Lang.get('campaignPosterImageRequired'));
		}

		try {
			this.throwIfAborted(signal);
			console.log('CampaignWorkflowManager: starting poster consumer', {
				action: request?.action || '',
				imageName: imageEntry.name || 'campaign-poster-reference.png',
				imageType: imageEntry.mimeType || 'image/png',
				promptLength: String(request?.prompt || '').length,
				reason: String(request?.reason || '')
			});

			await this.loadArtworkScripts();
			console.log('CampaignWorkflowManager: artwork scripts ready', {
				hasArtworks: !!window.Artworks,
				hasArtworksTabClass: !!window.ArtworksTab
			});

			if (!window.artworksInstance) {
				window.artworksInstance = new window.Artworks();
				await window.artworksInstance.initialize();
				console.log('CampaignWorkflowManager: initialized artworksInstance for poster consumer');
			}

			if (!window.artworksTab) {
				window.artworksTab = new window.ArtworksTab();
				console.log('CampaignWorkflowManager: created artworksTab for poster consumer');
			}

			const workflow = window.artworksTab;
			if (!workflow || typeof workflow.generateArtwork !== 'function') {
				console.warn('CampaignWorkflowManager: poster consumer could not access artwork workflow', {
					hasWorkflow: !!workflow,
					hasGenerateArtwork: !!workflow?.generateArtwork
				});
				return this.buildArtifactFailure('poster', request.action, Lang.get('campaignArtifactLaunchFailed'));
			}

			releaseAbort = this.bindAbortSignal(signal, () => {
				this.abortPosterWorkflow();
			});

			if (!workflow.initialized && typeof workflow.initialize === 'function') {
				console.log('CampaignWorkflowManager: initializing artworksTab before poster generation');
				await workflow.initialize();
			}

			const modelSelector = workflow.elements?.modelSelector;
			const selectedVisualModel = await this.ensurePosterVisualModel(workflow);
			if (!modelSelector || !selectedVisualModel) {
				console.warn('CampaignWorkflowManager: poster consumer missing selected visual model', {
					hasModelSelector: !!modelSelector,
					selectedModel: String(modelSelector?.value || ''),
					artworksInstanceSelectedModel: String(workflow?.artworksInstance?.selectedModel || '')
				});
				return this.buildArtifactFailure('poster', request.action, Lang.get('campaignPosterVisualModelRequired'));
			}

			console.log('CampaignWorkflowManager: poster workflow ready to launch', {
				selectedModel: selectedVisualModel,
				initialized: !!workflow.initialized,
				hasPromptInput: !!workflow.elements?.promptInput,
				hasOverlayModeButton: !!workflow.elements?.modeButtons?.overlay,
				hasGenerateButton: !!workflow.elements?.generateBtn
			});

			if (workflow.elements?.modeButtons?.overlay) {
				workflow.elements.modeButtons.overlay.click();
				console.log('CampaignWorkflowManager: selected overlay mode for poster workflow');
			}

			if (workflow.elements?.promptInput) {
				workflow.elements.promptInput.value = this.buildPosterPrompt(request);
				workflow.elements.promptInput.dispatchEvent(new Event('input', { bubbles: true }));
				console.log('CampaignWorkflowManager: poster prompt applied to artwork workflow', {
					promptLength: String(workflow.elements.promptInput.value || '').length
				});
			}

			const previousPreview = window.__lastArtworkPreviewWindow || null;
			const imageFile = this.dataUrlToFile(imageEntry.dataUrl, imageEntry.name || 'campaign-poster-reference.png', imageEntry.mimeType || 'image/png');
			workflow.handleImageSelection(imageFile);
			console.log('CampaignWorkflowManager: poster image handed to artwork workflow', {
				fileName: imageFile.name,
				fileType: imageFile.type,
				fileSize: imageFile.size
			});
			await this.waitFor(() => !!workflow.imageBase64 && workflow.elements?.generateBtn && !workflow.elements.generateBtn.disabled, 4000, signal);
			this.throwIfAborted(signal);
			console.log('CampaignWorkflowManager: poster workflow input ready, invoking generateArtwork', {
				hasImageBase64: !!workflow.imageBase64,
				generateDisabled: !!workflow.elements?.generateBtn?.disabled
			});

			window.__campaignManagedArtworkProgress = true;
			await workflow.generateArtwork();
			console.log('CampaignWorkflowManager: artwork workflow finished generateArtwork, waiting for preview window');
			const previewWindow = await this.waitForArtworkPreview(previousPreview, signal);
			console.log('CampaignWorkflowManager: poster preview window detected', {
				hasPreviewWindow: !!previewWindow,
				hasCanvasPreviewManager: !!previewWindow?.canvasPreviewManager
			});
			const posterPng = await this.captureArtworkPreviewPng(previewWindow, signal);
			const posterOverlayData = await this.captureArtworkPreviewOverlayData(previewWindow, signal);
			const posterBackgroundImage = this.captureArtworkPreviewBackgroundImage(previewWindow, imageEntry.dataUrl);
			console.log('CampaignWorkflowManager: poster PNG captured', {
				length: String(posterPng || '').length
			});
			if (previewWindow && typeof previewWindow.close === 'function') {
				previewWindow.close();
			}
			return this.buildArtifactCompleted('poster', request.action, {
				poster_png: posterPng,
				poster_overlay_data: posterOverlayData,
				poster_background_image: posterBackgroundImage
			});
		} catch (error) {
			if (this.isAbortError(error)) {
				return this.buildArtifactCancelled('poster', request.action);
			}
			console.error('CampaignWorkflowManager: poster consumer failed', error);
			return this.buildArtifactFailure('poster', request.action, Lang.get('campaignArtifactLaunchFailed'));
		} finally {
			window.__campaignManagedArtworkProgress = false;
			releaseAbort();
		}
	}

	async ensurePosterVisualModel(workflow) {
		const modelSelector = workflow?.elements?.modelSelector;
		let selectedModel = String(modelSelector?.value || workflow?.artworksInstance?.selectedModel || '').trim();
		if (selectedModel) {
			return selectedModel;
		}

		if (typeof workflow?.loadSavedModelSelection === 'function') {
			await workflow.loadSavedModelSelection();
			selectedModel = String(modelSelector?.value || workflow?.artworksInstance?.selectedModel || '').trim();
			if (selectedModel) {
				console.log('CampaignWorkflowManager: restored saved visual model via artworksTab', {
					selectedModel
				});
				return selectedModel;
			}
		}

		selectedModel = await this.loadSavedVisualModelPreference();
		if (!selectedModel || !modelSelector) {
			return '';
		}

		const optionExists = Array.from(modelSelector.options || []).some(option => option.value === selectedModel);
		if (!optionExists) {
			console.warn('CampaignWorkflowManager: saved visual model is not available in current artwork selector', {
				savedModel: selectedModel
			});
			return '';
		}

		modelSelector.value = selectedModel;
		if (workflow.artworksInstance) {
			workflow.artworksInstance.selectedModel = selectedModel;
		}
		modelSelector.dispatchEvent(new Event('change', { bubbles: true }));
		if (typeof workflow.updateGenerateButtonState === 'function') {
			workflow.updateGenerateButtonState();
		}

		console.log('CampaignWorkflowManager: restored saved visual model from settings for poster consumer', {
			selectedModel
		});
		return selectedModel;
	}

	async loadSavedVisualModelPreference() {
		const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
		if (!hashedMasterKey || !window.PaiperworkDB || typeof window.PaiperworkDB.loadSettings !== 'function') {
			return String(localStorage.getItem('selectedVisualModel') || '').trim();
		}

		try {
			const settings = await window.PaiperworkDB.loadSettings(hashedMasterKey);
			return String(settings?.visualModel || localStorage.getItem('selectedVisualModel') || '').trim();
		} catch (error) {
			console.warn('CampaignWorkflowManager: failed to load saved visual model preference', error);
			return String(localStorage.getItem('selectedVisualModel') || '').trim();
		}
	}

	async loadArtworkScripts() {
		const scripts = [
			{ src: 'js/tabs/artworks.js', globalName: 'Artworks' },
			{ src: 'js/tabs/artworkpreviewwindow.js', globalName: null },
			{ src: 'js/tabs/artworkstab.js', globalName: 'ArtworksTab' },
			{ src: 'js/tabs/artworkcanvasrenderer.js', globalName: 'ArtworkCanvasRenderer' },
			{ src: 'js/tabs/canvasinteractionhandler.js', globalName: 'CanvasInteractionHandler' },
			{ src: 'js/tabs/canvaspreviewmanager.js', globalName: 'CanvasPreviewManager' }
		];

		for (const script of scripts) {
			await this.loadScriptIfNeeded(script.src, script.globalName);
		}
	}

	async ensureArtworkEditorDependenciesLoaded() {
		const overlayEditorReady = () => (
			(typeof ArtworkCanvasRenderer !== 'undefined' || !!window.ArtworkCanvasRenderer)
			&& (typeof CanvasInteractionHandler !== 'undefined' || !!window.CanvasInteractionHandler)
			&& (typeof CanvasPreviewManager !== 'undefined' || !!window.CanvasPreviewManager)
		);

		if (overlayEditorReady()) {
			return true;
		}

		const loader = window.tabLoader;
		if (!loader || typeof loader.loadScript !== 'function') {
			throw new Error('Overlay editor loader is unavailable.');
		}

		const overlayScripts = [
			'js/tabs/artworkcanvasrenderer.js',
			'js/tabs/canvasinteractionhandler.js',
			'js/tabs/canvaspreviewmanager.js'
		];

		for (const script of overlayScripts) {
			if (!loader.loadedModules[script]) {
				if (!loader.loadingPromises[script]) {
					loader.loadingPromises[script] = loader.loadScript(script);
				}
				await loader.loadingPromises[script];
				loader.loadedModules[script] = true;
				delete loader.loadingPromises[script];
			}
		}

		await new Promise((resolve, reject) => {
			let attempts = 0;
			const maxAttempts = loader.getTabLoadMaxAttempts ? loader.getTabLoadMaxAttempts() : 50;
			const checkInterval = window.setInterval(() => {
				attempts += 1;
				if (overlayEditorReady()) {
					window.clearInterval(checkInterval);
					resolve();
				} else if (attempts >= maxAttempts) {
					window.clearInterval(checkInterval);
					reject(new Error('Timeout waiting for overlay editor components to load.'));
				}
			}, loader.pollIntervalMs || 100);
		});

		this.resolveLoadedGlobal('ArtworkCanvasRenderer');
		this.resolveLoadedGlobal('CanvasInteractionHandler');
		this.resolveLoadedGlobal('CanvasPreviewManager');

		return true;
	}

	resolveLoadedGlobal(globalName) {
		if (!globalName) {
			return null;
		}

		if (window[globalName]) {
			return window[globalName];
		}

		let resolved = null;
		try {
			resolved = new Function(`return typeof ${globalName} !== 'undefined' ? ${globalName} : null;`)();
		} catch (error) {
			resolved = null;
		}

		if (resolved) {
			window[globalName] = resolved;
		}

		return resolved;
	}

	loadScriptIfNeeded(scriptSrc, globalName) {
		if (!globalName) {
			return Promise.resolve();
		}

		if (this.resolveLoadedGlobal(globalName)) {
			return Promise.resolve();
		}

		if (!window._campaignScriptLoadingPromises) {
			window._campaignScriptLoadingPromises = {};
		}

		if (window._campaignScriptLoadingPromises[scriptSrc]) {
			return window._campaignScriptLoadingPromises[scriptSrc];
		}

		window._campaignScriptLoadingPromises[scriptSrc] = new Promise((resolve, reject) => {
			const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
			if (existingScript) {
				if (this.resolveLoadedGlobal(globalName)) {
					resolve();
					return;
				}

				existingScript.addEventListener('load', () => {
					if (this.resolveLoadedGlobal(globalName)) {
						resolve();
						return;
					}

					reject(new Error(`${globalName} is not available after loading ${scriptSrc}`));
				}, { once: true });
				existingScript.addEventListener('error', () => reject(new Error(`Failed to load ${scriptSrc}`)), { once: true });
				return;
			}

			const script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = scriptSrc;
			script.onload = () => {
				if (this.resolveLoadedGlobal(globalName)) {
					resolve();
					return;
				}

				reject(new Error(`${globalName} is not available after loading ${scriptSrc}`));
			};
			script.onerror = () => reject(new Error(`Failed to load ${scriptSrc}`));
			document.head.appendChild(script);
		});

		return window._campaignScriptLoadingPromises[scriptSrc];
	}

	buildArtifactStarted(target, action) {
		const targetLabel = this.getTargetLabel(target);
		return {
			target,
			action,
			chatMessage: Lang.get('campaignArtifactStartedMessage')
				.replace('{action}', action || 'generate')
				.replace('{target}', targetLabel),
			statusMessage: Lang.get('campaignArtifactStartedStatus')
				.replace('{action}', action || 'generate')
				.replace('{target}', targetLabel)
		};
	}

	buildArtifactCompleted(target, action, outputs = {}) {
		const targetLabel = this.getTargetLabel(target);
		return {
			target,
			action,
			outputs,
			chatMessage: Lang.get('campaignArtifactCompletedMessage')
				.replace('{action}', action || 'generate')
				.replace('{target}', targetLabel),
			statusMessage: Lang.get('campaignArtifactCompletedStatus')
				.replace('{action}', action || 'generate')
				.replace('{target}', targetLabel)
		};
	}

	buildArtifactCancelled(target, action) {
		return {
			target,
			action,
			cancelled: true,
			chatMessage: Lang.get('campaignWorkflowCancelledStatus'),
			statusMessage: Lang.get('campaignWorkflowCancelledStatus')
		};
	}

	buildArtifactFailure(target, action, message) {
		const targetLabel = this.getTargetLabel(target);
		return {
			target,
			action,
			chatMessage: message,
			statusMessage: Lang.get('campaignArtifactFailedStatus')
				.replace('{target}', targetLabel)
				.replace('{reason}', message)
		};
	}

	getTargetLabel(target) {
		const labels = {
			poster: Lang.get('campaignPosterView'),
			presentation: Lang.get('campaignPresentationView'),
			miniapp: Lang.get('campaignMiniAppView')
		};

		return labels[target] || target;
	}

	cancelActiveArtifact(target = '') {
		const normalizedTarget = String(target || '').trim().toLowerCase();
		if (!normalizedTarget) {
			this.abortPresentationWorkflow();
			this.abortMiniappWorkflow();
			this.abortPosterWorkflow();
			return;
		}

		if (normalizedTarget === 'presentation') {
			this.abortPresentationWorkflow();
			return;
		}

		if (normalizedTarget === 'miniapp') {
			this.abortMiniappWorkflow();
			return;
		}

		if (normalizedTarget === 'poster') {
			this.abortPosterWorkflow();
		}
	}

	abortPresentationWorkflow() {
		const workflow = window.PromptedPresentationWorkflow;
		if (workflow?.currentAbortController) {
			workflow.currentAbortController.abort();
		}
		if (workflow && typeof workflow.close === 'function') {
			workflow.close();
		}
	}

	abortMiniappWorkflow() {
		const workflow = window.ArtifactsWindow;
		if (workflow?.currentAbortController) {
			workflow.currentAbortController.abort();
		}
		if (workflow && typeof workflow.close === 'function') {
			workflow.close();
		}
	}

	abortPosterWorkflow() {
		if (window.artworkAbortController) {
			window.artworkAbortController.abort();
		}
		if (window.__lastArtworkPreviewWindow && typeof window.__lastArtworkPreviewWindow.close === 'function') {
			window.__lastArtworkPreviewWindow.close();
		}
	}

	createAbortError() {
		if (typeof DOMException === 'function') {
			return new DOMException('Campaign workflow aborted', 'AbortError');
		}

		const error = new Error('Campaign workflow aborted');
		error.name = 'AbortError';
		return error;
	}

	isAbortError(error) {
		return !!error && (error.name === 'AbortError' || String(error.message || '').toLowerCase().includes('abort'));
	}

	throwIfAborted(signal) {
		if (signal?.aborted) {
			throw this.createAbortError();
		}
	}

	bindAbortSignal(signal, onAbort) {
		if (!signal || typeof onAbort !== 'function') {
			return () => {};
		}

		const handler = () => {
			onAbort();
		};

		if (signal.aborted) {
			handler();
			return () => {};
		}

		signal.addEventListener('abort', handler, { once: true });
		return () => {
			signal.removeEventListener('abort', handler);
		};
	}

	findSendButton(overlay) {
		if (!overlay) {
			return false;
		}

		const sendButtonLabel = String(Lang.get('sendButton') || 'Send').trim().toLowerCase();
		return Array.from(overlay.querySelectorAll('button')).find(button => {
			const label = String(button.textContent || '').trim().toLowerCase();
			return label === sendButtonLabel || label === 'send';
		}) || false;
	}

	concealOverlayElement(overlay) {
		if (!overlay || overlay.dataset.campaignHiddenWorkflow === 'true') {
			return () => {};
		}

		const previousVisibility = overlay.style.visibility;
		const previousOpacity = overlay.style.opacity;
		const previousPointerEvents = overlay.style.pointerEvents;
		overlay.dataset.campaignHiddenWorkflow = 'true';
		overlay.style.visibility = 'hidden';
		overlay.style.opacity = '0';
		overlay.style.pointerEvents = 'none';
		return () => {
			if (!overlay || !overlay.dataset) {
				return;
			}
			delete overlay.dataset.campaignHiddenWorkflow;
			overlay.style.visibility = previousVisibility;
			overlay.style.opacity = previousOpacity;
			overlay.style.pointerEvents = previousPointerEvents;
		};
	}

	buildCampaignSourceText(request) {
		const campaign = request?.campaign || {};
		const brief = campaign.brief || {};
		const keyPoints = Array.isArray(brief.key_points) ? brief.key_points : [];
		return [
			`Campaign name: ${campaign.name || brief.title || 'Untitled campaign'}`,
			`Title: ${brief.title || ''}`,
			`Subtitle: ${brief.subtitle || ''}`,
			`Core message: ${brief.core_message || ''}`,
			`Audience: ${brief.audience || ''}`,
			`Tone: ${brief.tone || ''}`,
			`Key points: ${keyPoints.join('; ')}`,
			'',
			'Request context:',
			request?.prompt || '',
			'',
			'Reasoning:',
			request?.reason || ''
		].join('\n');
	}

	buildColorPaletteDesignRequest(request) {
		const paletteDirection = String(request?.campaign?.brief?.color_palette || '').trim();
		if (!paletteDirection) {
			return '';
		}

		return `Design direction: use this campaign color palette for the visual styling system, not as body copy or visible text unless the content explicitly calls for it. Palette guidance: ${paletteDirection}`;
	}

	createCampaignBriefFile(request) {
		const safeName = String(request?.campaign?.name || request?.campaign?.brief?.title || 'campaign-brief')
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '') || 'campaign-brief';
		return new File([
			this.buildCampaignSourceText(request)
		], `${safeName}.md`, { type: 'text/markdown' });
	}

	buildPresentationExtraPrompt(request) {
		const colorPaletteDesignRequest = this.buildColorPaletteDesignRequest(request);
		return [
			'Create a polished promptable presentation for this campaign brief.',
			'Keep the deck aligned with the audience, tone, and key points.',
			colorPaletteDesignRequest,
			request?.reason ? `Workflow reason: ${request.reason}` : '',
			request?.prompt ? `User request: ${request.prompt}` : ''
		].filter(Boolean).join(' ');
	}

	buildMiniappExtraPrompt(request) {
		const colorPaletteDesignRequest = this.buildColorPaletteDesignRequest(request);
		const miniappCustomization = request?.campaign?.brief?.miniapp_customization || {};
		const addRequests = String(miniappCustomization.add || '').trim();
		const removeRequests = String(miniappCustomization.remove || '').trim();
		return [
			'Create a very beautiful and modern mini app related to the provided campaign brief,',
			'with responsive design, clear calls to action, interactive buttons, and tasteful animations.',
			(addRequests || removeRequests) ? 'Treat the mini app customization requests as functional guidance, not visible body copy.' : '',
			addRequests ? `Requested mini app functionality to add or emphasize: ${addRequests}.` : '',
			removeRequests ? `Requested mini app functionality to remove, avoid, or keep out: ${removeRequests}.` : '',
			colorPaletteDesignRequest,
			request?.reason ? `Workflow reason: ${request.reason}.` : '',
			request?.prompt ? `User request: ${request.prompt}` : ''
		].filter(Boolean).join(' ');
	}

	buildPosterPrompt(request) {
		const brief = request?.campaign?.brief || {};
		const posterCopy = brief.poster_copy || {};
		const keyPoints = Array.isArray(brief.key_points) ? brief.key_points : [];
		return [
			'Create a visually strong poster with text overlays using the uploaded reference image.',
			'The poster must stay concise, clear, and impactful. Do not overcrowd it with text.',
			'Use the dedicated poster brief section as the source of truth for the overlay text hierarchy.',
			posterCopy.header ? `Poster header: ${posterCopy.header}` : '',
			posterCopy.subheader ? `Poster subheader: ${posterCopy.subheader}` : '',
			posterCopy.body ? `Poster body: ${posterCopy.body}` : '',
			posterCopy.footer ? `Poster footer: ${posterCopy.footer}` : '',
			brief.title ? `Campaign title: ${brief.title}` : '',
			brief.subtitle ? `Campaign subtitle: ${brief.subtitle}` : '',
			brief.core_message ? `Core message: ${brief.core_message}` : '',
			brief.audience ? `Audience: ${brief.audience}` : '',
			brief.tone ? `Tone: ${brief.tone}` : '',
			keyPoints.length ? `Supporting key points: ${keyPoints.join('; ')}` : '',
			request?.reason ? `Workflow reason: ${request.reason}.` : '',
			request?.prompt ? `User request: ${request.prompt}` : ''
		].filter(Boolean).join(' ');
	}

	loadPromptedPresentationScript() {
		if (window.PromptedPresentationWorkflow) {
			return Promise.resolve();
		}

		if (window._promptedPresentationScriptLoadingPromise) {
			return window._promptedPresentationScriptLoadingPromise;
		}

		window._promptedPresentationScriptLoadingPromise = new Promise((resolve, reject) => {
			const scriptSrc = 'js/utils/presentation/promptedpresentation.js';
			const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
			if (existingScript) {
				if (window.PromptedPresentationWorkflow) {
					resolve();
					return;
				}
				existingScript.addEventListener('load', () => resolve());
				existingScript.addEventListener('error', () => reject(new Error('Failed to load promptedpresentation.js')));
				return;
			}

			const script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = scriptSrc;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Failed to load promptedpresentation.js'));
			document.head.appendChild(script);
		});

		return window._promptedPresentationScriptLoadingPromise;
	}

	async loadArtifactsScript() {
		if (window.ArtifactsWindow) {
			return;
		}

		if (window._artifactsScriptLoadingPromise) {
			return window._artifactsScriptLoadingPromise;
		}

		window._artifactsScriptLoadingPromise = new Promise((resolve, reject) => {
			const scriptSrc = 'js/tabs/artifacts.js';
			const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
			if (existingScript) {
				if (window.ArtifactsWindow) {
					resolve();
					return;
				}
				existingScript.addEventListener('load', () => resolve());
				existingScript.addEventListener('error', () => reject(new Error('Failed to load artifacts.js')));
				return;
			}

			const script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = scriptSrc;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Failed to load artifacts.js'));
			document.head.appendChild(script);
		});

		return window._artifactsScriptLoadingPromise;
	}

	dataUrlToFile(dataUrl, fileName, mimeType = 'application/octet-stream') {
		const parts = String(dataUrl || '').split(',');
		const base64 = parts.length > 1 ? parts[1] : parts[0];
		const binary = window.atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let index = 0; index < binary.length; index += 1) {
			bytes[index] = binary.charCodeAt(index);
		}
		return new File([bytes], fileName, { type: mimeType });
	}

	waitFor(predicate, timeoutMs = 4000, signal = null) {
		return new Promise((resolve, reject) => {
			const startedAt = Date.now();
			let settled = false;

			const handleAbort = () => {
				finishReject(this.createAbortError());
			};

			const finishResolve = value => {
				if (settled) {
					return;
				}
				settled = true;
				if (signal) {
					signal.removeEventListener('abort', handleAbort);
				}
				resolve(value);
			};

			const finishReject = error => {
				if (settled) {
					return;
				}
				settled = true;
				if (signal) {
					signal.removeEventListener('abort', handleAbort);
				}
				reject(error);
			};

			if (signal?.aborted) {
				finishReject(this.createAbortError());
				return;
			}

			if (signal) {
				signal.addEventListener('abort', handleAbort, { once: true });
			}

			const tick = async () => {
				if (settled) {
					return;
				}

				if (signal?.aborted) {
					finishReject(this.createAbortError());
					return;
				}

				try {
					const result = await predicate();
					if (result) {
						finishResolve(result);
						return;
					}
				} catch (error) {
					finishReject(error);
					return;
				}

				if (Date.now() - startedAt >= timeoutMs) {
					finishReject(new Error('Timed out waiting for workflow readiness'));
					return;
				}

				window.requestAnimationFrame(() => {
					void tick();
				});
			};

			void tick();
		});
	}

	waitForPromptablePresentationHtml(previousHtml = '', signal = null) {
		return this.waitFor(async () => {
			const workflow = window.PromptedPresentationWorkflow;
			if (!workflow) {
				return false;
			}
			const currentHtml = String(workflow.currentPresentationHtml || '').trim();
			if (workflow.currentAbortController) {
				return false;
			}
			return currentHtml || false;
		}, 960000, signal);
	}

	waitForArtifactHtml(previousHtml = '', signal = null) {
		return this.waitFor(async () => {
			const workflow = window.ArtifactsWindow;
			if (!workflow) {
				return false;
			}
			const currentHtml = String(workflow.currentArtifactHtml || '').trim();
			if (workflow.currentAbortController) {
				return false;
			}
			return currentHtml || false;
		}, 960000, signal);
	}

	waitForArtworkPreview(previousPreview = null, signal = null) {
		return this.waitFor(() => {
			const previewWindow = window.__lastArtworkPreviewWindow || null;
			return previewWindow && previewWindow !== previousPreview ? previewWindow : false;
		}, 960000, signal);
	}

	async captureArtworkPreviewPng(previewWindow, signal = null) {
		this.throwIfAborted(signal);
		if (!previewWindow || !previewWindow.canvasPreviewManager) {
			throw new Error('Artwork preview is not available for PNG capture');
		}

		if (previewWindow.canvasPreviewManager._initPromise) {
			await previewWindow.canvasPreviewManager._initPromise;
		}

		this.throwIfAborted(signal);

		if (!previewWindow.canvasPreviewManager.renderer || typeof previewWindow.canvasPreviewManager.renderer.exportPNG !== 'function') {
			throw new Error('Artwork canvas renderer is not ready');
		}

		return previewWindow.canvasPreviewManager.renderer.exportPNG(1);
	}

	async captureArtworkPreviewOverlayData(previewWindow, signal = null) {
		this.throwIfAborted(signal);
		if (!previewWindow) {
			return null;
		}

		if (previewWindow.canvasPreviewManager?._initPromise) {
			await previewWindow.canvasPreviewManager._initPromise;
		}

		const overlayData = typeof previewWindow.canvasPreviewManager?.buildOverlayDataFromCanvas === 'function'
			? previewWindow.canvasPreviewManager.buildOverlayDataFromCanvas()
			: previewWindow.overlayData;

		return this.cloneJsonCompatible(overlayData);
	}

	captureArtworkPreviewBackgroundImage(previewWindow, fallbackImage = '') {
		return String(
			previewWindow?.exportBackgroundImage
			|| previewWindow?.backgroundImage
			|| fallbackImage
			|| ''
		).trim();
	}

	cloneJsonCompatible(value) {
		if (!value || typeof value !== 'object') {
			return null;
		}

		if (typeof structuredClone === 'function') {
			try {
				return structuredClone(value);
			} catch (_error) {
				// Fall through to JSON cloning.
			}
		}

		try {
			return JSON.parse(JSON.stringify(value));
		} catch (_error) {
			return null;
		}
	}

	buildOrchestratorPrompt(action, payload) {
		const imageList = Array.isArray(payload?.images) ? payload.images : [];
		const imageSummary = imageList.length
			? imageList.map((image, index) => `${index + 1}. ${image.name || 'image'} (${image.mimeType || 'unknown'})`).join('\n')
			: 'No uploaded images.';

		return [
			`Requested action: ${action}`,
			'Important: this is a chat-only discussion turn from the prompt composer. You may refine the brief and ask strategic questions, but you must keep workflow.recommended_action as "none" and return no generation targets.',
			`Selected model: ${payload?.model?.label || payload?.model?.value || 'unknown'}`,
			'Latest user message:',
			payload?.prompt || '',
			'',
			'Current campaign brief JSON:',
			JSON.stringify(payload?.campaign?.brief || {}, null, 2),
			'',
			'Current palette JSON:',
			JSON.stringify(payload?.campaign?.palette || [], null, 2),
			'',
			'Current outputs availability:',
			JSON.stringify({
				hasPosterPng: !!payload?.campaign?.outputs?.poster_png,
				hasPresentationHtml: !!payload?.campaign?.outputs?.presentation_html,
				hasMiniappHtml: !!payload?.campaign?.outputs?.miniapp_html
			}, null, 2),
			'',
			'Uploaded image registry:',
			imageSummary
		].join('\n');
	}

	getUserLanguageInstruction() {
		const fallbackLanguageCode = 'en';
		const currentLanguage = (typeof Lang !== 'undefined' && Lang && typeof Lang.getCurrentLanguage === 'function')
			? (Lang.getCurrentLanguage() || fallbackLanguageCode)
			: fallbackLanguageCode;
		const normalizedLanguageCode = (window.OllamaAPI && typeof window.OllamaAPI.getLanguageCode === 'function')
			? window.OllamaAPI.getLanguageCode(currentLanguage || fallbackLanguageCode)
			: String(currentLanguage || fallbackLanguageCode).trim().toLowerCase() || fallbackLanguageCode;
		const languageDisplayName = (window.OllamaAPI && typeof window.OllamaAPI.getLanguageDisplayName === 'function')
			? window.OllamaAPI.getLanguageDisplayName(currentLanguage || normalizedLanguageCode || fallbackLanguageCode)
			: normalizedLanguageCode;

		return `Absolute priority: reply in the user's language only: ${languageDisplayName} (${normalizedLanguageCode}). Every visible sentence in chat_message and every user-facing phrase in status_message must be written in ${languageDisplayName}. Do not switch to English unless the user explicitly switches to English.`;
	}

	getOrchestratorSystemPrompt() {
		return [
			this.getUserLanguageInstruction(),
			'You are the Paiperwork Campaign Orchestrator.',
			'You are an expert campaign strategist acting as a sparring partner, not a passive assistant.',
			'You build and refine a campaign brief through discussion only.',
			'This language rule outranks tone, style, brevity, and every other instruction. If there is any conflict, keep the reply in the user language.',
			'Use the selected model as the orchestrator brain, but keep orchestration state separate from the visible chat conversation.',
			'The visible chat must feel like a sharp brainstorming exchange between experienced teammates shaping a strong campaign.',
			'Write like a real person thinking out loud with context, not like customer support, a polished assistant template, or a corporate memo.',
			'It is fine to sound a little rambling, occasionally repeat a point for emphasis, shorten thoughts, use fragments, and pivot mid-thought if that feels natural.',
			'Prefer grounded, specific phrasing over tidy generic advice. Sound like someone who is actually reacting to this campaign brief in the moment.',
			'Do not sound overly formal, overly cheerful, or overly neat. Avoid stock openings, canned reassurance, and rigid step-by-step template phrasing unless the user clearly asks for structure.',
			'Challenge weak positioning, vague audiences, generic claims, weak calls to action, and unsupported assumptions instead of politely accepting them.',
			'Ask the smallest number of high-value questions needed to sharpen the brief, and offer concrete strategic alternatives when you challenge an idea.',
			'Always keep manual edits safe. Prefer partial updates and patch-compatible changes over broad regeneration.',
			'Always update the campaign brief first, then palette if useful, but never decide when campaign generation should start.',
			'The campaign brief may include a subtitle. Use it when it sharpens the positioning, headline hierarchy, or storytelling, but keep it concise.',
			'The campaign brief may include a campaign color palette note describing the intended visual direction for presentations and mini apps. Refine it collaboratively with the user when useful.',
			'The campaign brief includes a dedicated poster_copy section that serves as the poster-specific brief section for concise poster text. Keep it sharp and impactful, not crowded.',
			'The campaign brief may also include a dedicated miniapp_customization section with user-authored requests about features to add or remove. Use it to help the user tune the mini app, preserve it carefully, and treat it as product guidance rather than visible copy.',
			'Use poster_copy.header, poster_copy.subheader, poster_copy.body, and poster_copy.footer for poster-specific text planning.',
			'Use miniapp_customization.add and miniapp_customization.remove to track mini app feature preferences and exclusions when the user discusses them.',
			'The poster brief section should be shorter and more forceful than the general campaign brief. Do not dump the full brief into poster_copy.',
			'Campaign generation and update are deterministic UI actions outside your control. Do not decide, recommend, trigger, or schedule poster, presentation, or miniapp execution.',
			'If the user request is ambiguous, weak, or missing critical information, use chat_message to ask clarifying questions and improve the strategy instead of pretending the brief is complete.',
			'Always keep workflow.recommended_action = "none" and workflow.targets = [] because execution is handled deterministically by the user buttons, not by you.',
			'Never use internal workflow wording in chat_message. Do not say things like queued, payload, backend, JSON, structured response, trigger, or workflow plan in the visible reply.',
			'Use status_message for short machine-facing UI status text, but still write it in the user language. Use chat_message for natural, user-facing strategic conversation in that same language.',
			'Treat every turn as brainstorming only: refine the brief, challenge the idea, ask questions, and keep workflow.recommended_action = "none" with an empty targets list.',
			'Every turn already includes the current campaign brief. Read it carefully and revise it incrementally instead of restarting from scratch.',
			'Preserve manual edits. Prefer narrow updates and patch-friendly changes. When a safe targeted update is not possible, explain the conflict briefly in chat_message and keep workflow.recommended_action as "none".',
			'Output ONLY valid JSON with this shape:',
			'{',
			'  "chat_message": "natural visible reply for the user",',
			'  "status_message": "short frontend status",',
			'  "campaign_brief": {',
			'    "title": "",',
			'    "subtitle": "",',
			'    "core_message": "",',
			'    "audience": "",',
			'    "key_points": [],',
			'    "color_palette": "",',
			'    "tone": "",',
			'    "poster_copy": {',
			'      "header": "",',
			'      "subheader": "",',
			'      "body": "",',
			'      "footer": ""',
			'    },',
			'    "miniapp_customization": {',
			'      "add": "",',
			'      "remove": ""',
			'    }',
			'  },',
			'  "palette": ["#000000", "#ffffff"],',
			'  "workflow": {',
			'    "recommended_action": "none",',
			'    "targets": [],',
			'    "reason": ""',
			'  }',
			'}',
			'When you still need more information, return an improved partial campaign_brief, a natural human-sounding brainstorming chat_message, and workflow.recommended_action = "none" with an empty target list.',
			'Do not include markdown fences or explanations outside JSON.'
		].join('\n');
	}

	parseOrchestratorResponse(raw) {
		const text = String(raw || '').trim();
		if (!text) {
			return {
				chatMessage: '',
				statusMessage: '',
				campaignBrief: null,
				palette: null,
				outputs: null,
				workflow: null
			};
		}

		let cleaned = text.replace(/<think[^>]*>[\s\S]*?<\/think>/gi, ' ').trim();
		let parsed = null;
		const looksStructured = this.looksLikeStructuredCampaignResponse(cleaned);

		try {
			parsed = JSON.parse(cleaned);
		} catch (_error) {
			const repaired = this.repairMalformedOrchestratorJson(cleaned);
			if (repaired && repaired !== cleaned) {
				try {
					parsed = JSON.parse(repaired);
					cleaned = repaired;
				} catch (_repairError) {
					parsed = null;
				}
			}

			const match = cleaned.match(/\{[\s\S]*\}/);
			if (!parsed && match && match[0]) {
				try {
					parsed = JSON.parse(match[0]);
				} catch (_innerError) {
					parsed = null;
				}
			}

			if (!parsed) {
				parsed = this.extractStructuredResponseFields(cleaned);
			}
		}

		if (!parsed || typeof parsed !== 'object') {
			if (looksStructured) {
				return {
					chatMessage: Lang.get('campaignOrchestratorFailed'),
					statusMessage: Lang.get('campaignOrchestratorFailed'),
					campaignBrief: null,
					palette: null,
					outputs: null,
					workflow: null
				};
			}

			return {
				chatMessage: cleaned,
				statusMessage: cleaned,
				campaignBrief: null,
				palette: null,
				outputs: null,
				workflow: null
			};
		}

		return {
			chatMessage: String(parsed.chat_message || parsed.chatMessage || '').trim(),
			statusMessage: String(parsed.status_message || parsed.statusMessage || parsed.workflow?.reason || '').trim(),
			campaignBrief: parsed.campaign_brief || parsed.campaignBrief || null,
			palette: Array.isArray(parsed.palette) ? parsed.palette : null,
			outputs: parsed.outputs && typeof parsed.outputs === 'object' ? parsed.outputs : null,
			workflow: parsed.workflow && typeof parsed.workflow === 'object' ? parsed.workflow : null
		};
	}

	looksLikeStructuredCampaignResponse(text) {
		const value = String(text || '').trim();
		if (!value) {
			return false;
		}

		return value.startsWith('{')
			|| /"?(chat_message|status_message|campaign_brief|palette|workflow)"?\s*:?/i.test(value);
	}

	repairMalformedOrchestratorJson(text) {
		let repaired = String(text || '').trim();
		if (!repaired) {
			return repaired;
		}

		const knownKeys = ['chat_message', 'status_message', 'campaign_brief', 'palette', 'workflow', 'outputs'];
		knownKeys.forEach(key => {
			const brokenKeyPattern = new RegExp(`"${key}\\s*"\\s*(?=[\\"\\{\\[])`, 'g');
			repaired = repaired.replace(brokenKeyPattern, `"${key}": `);
		});

		return repaired;
	}

	extractStructuredResponseFields(text) {
		const source = String(text || '').trim();
		if (!source) {
			return null;
		}

		const chatMessage = this.extractJsonStringField(source, 'chat_message') || this.extractJsonStringField(source, 'chatMessage');
		const statusMessage = this.extractJsonStringField(source, 'status_message') || this.extractJsonStringField(source, 'statusMessage');
		const campaignBrief = this.extractJsonObjectField(source, 'campaign_brief') || this.extractJsonObjectField(source, 'campaignBrief');
		const palette = this.extractJsonArrayField(source, 'palette');
		const outputs = this.extractJsonObjectField(source, 'outputs');
		const workflow = this.extractJsonObjectField(source, 'workflow');

		if (!chatMessage && !statusMessage && !campaignBrief && !palette && !outputs && !workflow) {
			return null;
		}

		return {
			chat_message: chatMessage || '',
			status_message: statusMessage || '',
			campaign_brief: campaignBrief || null,
			palette: palette || null,
			outputs: outputs || null,
			workflow: workflow || null
		};
	}

	extractJsonStringField(text, fieldName) {
		const escapedField = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const match = text.match(new RegExp(`"${escapedField}\\s*"\\s*:?\\s*"((?:\\.|[^"\\])*)"`, 'i'));
		if (!match || !match[1]) {
			return '';
		}

		try {
			return JSON.parse(`"${match[1]}"`);
		} catch (_error) {
			return match[1];
		}
	}

	extractJsonObjectField(text, fieldName) {
		const raw = this.extractBalancedJsonSegment(text, fieldName, '{', '}');
		if (!raw) {
			return null;
		}

		try {
			return JSON.parse(raw);
		} catch (_error) {
			return null;
		}
	}

	extractJsonArrayField(text, fieldName) {
		const raw = this.extractBalancedJsonSegment(text, fieldName, '[', ']');
		if (!raw) {
			return null;
		}

		try {
			return JSON.parse(raw);
		} catch (_error) {
			return null;
		}
	}

	extractBalancedJsonSegment(text, fieldName, openChar, closeChar) {
		const escapedField = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const fieldPattern = new RegExp(`"${escapedField}\\s*"\\s*:?[\\s\\n\\r]*\\${openChar}`, 'i');
		const match = fieldPattern.exec(text);
		if (!match) {
			return '';
		}

		const startIndex = text.indexOf(openChar, match.index);
		if (startIndex < 0) {
			return '';
		}

		let depth = 0;
		let inString = false;
		let isEscaped = false;
		for (let index = startIndex; index < text.length; index += 1) {
			const char = text[index];

			if (inString) {
				if (isEscaped) {
					isEscaped = false;
				} else if (char === '\\') {
					isEscaped = true;
				} else if (char === '"') {
					inString = false;
				}
				continue;
			}

			if (char === '"') {
				inString = true;
				continue;
			}

			if (char === openChar) {
				depth += 1;
			} else if (char === closeChar) {
				depth -= 1;
				if (depth === 0) {
					return text.slice(startIndex, index + 1);
				}
			}
		}

		return '';
	}

	getContextKey() {
		return String(this.tab?.state?.currentCampaign?.id || 'draft').trim() || 'draft';
	}

	getContext(key) {
		if (!window._campaignOrchestratorContext) {
			window._campaignOrchestratorContext = {};
		}
		return window._campaignOrchestratorContext[key] || null;
	}

	setContext(key, context) {
		if (!window._campaignOrchestratorContext) {
			window._campaignOrchestratorContext = {};
		}
		window._campaignOrchestratorContext[key] = context;
	}

	clearContext(key) {
		if (!key || !window._campaignOrchestratorContext) {
			return;
		}

		delete window._campaignOrchestratorContext[key];
	}

	rekeyContext(previousKey, nextKey) {
		const fromKey = String(previousKey || '').trim();
		const toKey = String(nextKey || '').trim();
		if (!fromKey || !toKey || fromKey === toKey) {
			return;
		}

		const existing = this.getContext(fromKey);
		if (!existing) {
			return;
		}

		this.setContext(toKey, this.normalizeTurns(existing));
		this.clearContext(fromKey);
	}

	normalizeTurns(turns, maxTurns = 20) {
		if (!Array.isArray(turns)) {
			return [];
		}

		const normalized = turns
			.map(turn => ({
				role: String(turn?.role || '').trim().toLowerCase(),
				text: String(turn?.text || turn?.content || '').trim()
			}))
			.filter(turn => (turn.role === 'user' || turn.role === 'assistant') && turn.text);

		if (normalized.length <= maxTurns) {
			return normalized;
		}

		return normalized.slice(normalized.length - maxTurns);
	}

	appendContextTurn(key, entry) {
		if (!key || !entry) {
			return;
		}

		const current = this.getContext(key) || [];
		const next = Array.isArray(current) ? [...current] : [];
		next.push({
			role: String(entry.role || '').trim().toLowerCase(),
			text: String(entry.text || entry.content || '').trim()
		});
		this.setContext(key, this.normalizeTurns(next));
	}
}

window.CampaignWorkflowManager = CampaignWorkflowManager;
