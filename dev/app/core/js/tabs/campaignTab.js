class CampaignTab {
	constructor() {
		this.isInitialized = false;
		this.tabElement = document.getElementById('campaign-tab');
		this.modalElement = null;
		this.workflowManager = null;
		this.chatAutoScrollGap = 18;
		this.activeChatAnimation = null;
		this.campaignOutputEditorFrame = null;
		this.campaignOutputEditorType = '';
		this.campaignOutputHtmlChangeHandler = null;
		this.campaignPosterEditorHost = null;
		this.campaignPosterCanvas = null;
		this.campaignPosterRenderer = null;
		this.campaignPosterInteractionHandler = null;
		this.campaignPosterSyncTimer = null;
		this.skipCampaignPosterStateSyncOnce = false;
		this.campaignPosterZoom = 1;
		this.campaignPosterMinZoom = 0.25;
		this.campaignPosterMaxZoom = 3;
		this.campaignPosterZoomStep = 0.25;
		this.isSavingCampaignPresentation = false;
		this.isSavingCampaignPoster = false;
		this.isSavingCampaignMiniapp = false;
		this.hasManualOutputEdits = false;
		this.posterVisualModelPromptResolver = null;
		this.state = {
			activeViewport: 'brief',
			draftPrompt: '',
			isWorkflowPending: false,
			artifactRegeneration: this.createArtifactRegenerationState(),
			posterVisualModelPrompt: this.createPosterVisualModelPromptState(),
			chatMessages: [],
			imageRegistry: [],
			pendingArtifacts: [],
			pendingWorkflow: null,
			workflowProgress: this.createWorkflowProgressState(),
			savedCampaigns: [],
			currentCampaign: {
				id: '',
				name: '',
				createdAt: '',
				updatedAt: '',
				brief: {
					title: '',
					subtitle: '',
					coreMessage: '',
					audience: '',
					keyPoints: [],
					colorPalette: '',
					tone: '',
					posterCopy: {
						header: '',
						subheader: '',
						body: '',
						footer: ''
					},
					miniappCustomization: {
						add: '',
						remove: ''
					}
				},
				palette: [],
				outputs: {
					posterPng: null,
					posterOverlayData: null,
					posterBackgroundImage: '',
					presentationHtml: '',
					miniappHtml: ''
				}
			}
		};
	}

	createWorkflowProgressState() {
		return {
			isOpen: false,
			action: '',
			currentTarget: '',
			currentStageIndex: -1,
			completedStageCount: 0,
			totalStages: 0,
			targets: [],
			statusMessage: '',
			abortController: null,
			isCancelling: false,
			isFailed: false,
			failedTarget: '',
			failureDetail: ''
		};
	}

	createArtifactRegenerationState() {
		return {
			poster: {
				isPending: false,
				abortController: null
			},
			presentation: {
				isPending: false,
				abortController: null
			},
			miniapp: {
				isPending: false,
				abortController: null
			}
		};
	}

	createPosterVisualModelPromptState() {
		return {
			isOpen: false,
			message: '',
			errorMessage: '',
			selectedModel: '',
			models: []
		};
	}

	async initialize() {
		if (!this.tabElement) {
			this.tabElement = document.getElementById('campaign-tab');
		}
		if (!this.tabElement) {
			return;
		}
		if (!document.getElementById('campaign-tab-styles')) {
			this.injectStyles();
		}

		await this.loadSavedCampaigns();
		this.renderTab();
		this.ensureModal();
		this.bindTabEvents();
		this.bindModalEvents();
		this.bindWorkflowEvents();

		this.isInitialized = true;
	}

	async ensureWorkflowManagerReady() {
		if (this.workflowManager) {
			return this.workflowManager;
		}

		if (window.CampaignWorkflowManager) {
			this.workflowManager = new window.CampaignWorkflowManager(this);
			return this.workflowManager;
		}

		if (!window._campaignWorkflowScriptLoadingPromise) {
			if (window.tabLoader && typeof window.tabLoader.loadScript === 'function') {
				window._campaignWorkflowScriptLoadingPromise = window.tabLoader.loadScript('js/tabs/campaign.js');
			} else {
				window._campaignWorkflowScriptLoadingPromise = new Promise((resolve, reject) => {
					const scriptSrc = 'js/tabs/campaign.js';
					const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
					if (existingScript) {
						existingScript.addEventListener('load', () => resolve());
						existingScript.addEventListener('error', () => reject(new Error('Failed to load campaign.js')));
						return;
					}

					const script = document.createElement('script');
					script.type = 'text/javascript';
					script.src = scriptSrc;
					script.onload = () => resolve();
					script.onerror = () => reject(new Error('Failed to load campaign.js'));
					document.head.appendChild(script);
				});
			}
		}

		await window._campaignWorkflowScriptLoadingPromise;

		if (!window.CampaignWorkflowManager) {
			throw new Error('CampaignWorkflowManager is not available');
		}

		this.workflowManager = new window.CampaignWorkflowManager(this);
		return this.workflowManager;
	}

	getDatabaseApi() {
		if (typeof window !== 'undefined' && window.PaiperworkDB) {
			return window.PaiperworkDB;
		}

		if (typeof PaiperworkDB !== 'undefined') {
			if (typeof window !== 'undefined' && !window.PaiperworkDB) {
				window.PaiperworkDB = PaiperworkDB;
			}
			return PaiperworkDB;
		}

		return null;
	}

	async loadSavedCampaigns() {
		const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
		const databaseApi = this.getDatabaseApi();

		if (!hashedMasterKey || !databaseApi || typeof databaseApi.getCampaigns !== 'function') {
			console.warn('CampaignTab: loadSavedCampaigns aborted before DB read', {
				hashedMasterKeyPresent: !!hashedMasterKey,
				hasWindowDatabaseApi: !!(typeof window !== 'undefined' && window.PaiperworkDB),
				hasResolvedDatabaseApi: !!databaseApi,
				hasGetCampaigns: !!databaseApi && typeof databaseApi.getCampaigns === 'function'
			});
			this.state.savedCampaigns = [];
			return;
		}

		try {
			const campaigns = await databaseApi.getCampaigns(hashedMasterKey);

			this.state.savedCampaigns = Array.isArray(campaigns)
				? campaigns.map(campaign => ({
					id: campaign.id,
					name: campaign.name || Lang.get('campaignUntitledName'),
					dateCreated: this.formatCampaignDate(campaign.updated_at || campaign.created_at)
				}))
				: [];

		} catch (error) {
			console.warn('CampaignTab: failed to load saved campaigns', error);
			this.state.savedCampaigns = [];
		}
	}

	normalizeChatHistory(messages) {
		if (!Array.isArray(messages)) {
			return [];
		}

		return messages
			.map(message => ({
				id: String(message?.id || `campaign-chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
				role: String(message?.role || '').trim().toLowerCase(),
				content: String(message?.content || message?.text || '').trim(),
				createdAt: String(message?.createdAt || message?.created_at || '').trim() || new Date().toISOString()
			}))
			.filter(message => ['user', 'assistant', 'warning'].includes(message.role) && message.content);
	}

	serializeChatHistory() {
		return this.normalizeChatHistory(this.state.chatMessages);
	}

	getPersistedOrchestratorContext() {
		const contextKey = String(this.state.currentCampaign.id || 'draft').trim() || 'draft';
		if (this.workflowManager && typeof this.workflowManager.getContext === 'function') {
			return typeof this.workflowManager.normalizeTurns === 'function'
				? this.workflowManager.normalizeTurns(this.workflowManager.getContext(contextKey) || [])
				: (Array.isArray(this.workflowManager.getContext(contextKey)) ? this.workflowManager.getContext(contextKey) : []);
		}

		const stored = window._campaignOrchestratorContext?.[contextKey];
		return Array.isArray(stored) ? stored : [];
	}

	restorePersistedOrchestratorContext(campaignId, turns) {
		if (!campaignId) {
			return;
		}

		const normalizedTurns = this.workflowManager && typeof this.workflowManager.normalizeTurns === 'function'
			? this.workflowManager.normalizeTurns(Array.isArray(turns) ? turns : [])
			: (Array.isArray(turns) ? turns : []);

		if (this.workflowManager && typeof this.workflowManager.setContext === 'function') {
			this.workflowManager.setContext(campaignId, normalizedTurns);
			return;
		}

		if (!window._campaignOrchestratorContext) {
			window._campaignOrchestratorContext = {};
		}
		window._campaignOrchestratorContext[campaignId] = normalizedTurns;
	}

	rekeyPersistedOrchestratorContext(previousKey, nextKey) {
		if (this.workflowManager && typeof this.workflowManager.rekeyContext === 'function') {
			this.workflowManager.rekeyContext(previousKey, nextKey);
			return;
		}

		const fromKey = String(previousKey || '').trim();
		const toKey = String(nextKey || '').trim();
		if (!fromKey || !toKey || fromKey === toKey || !window._campaignOrchestratorContext?.[fromKey]) {
			return;
		}

		window._campaignOrchestratorContext[toKey] = window._campaignOrchestratorContext[fromKey];
		delete window._campaignOrchestratorContext[fromKey];
	}

	clearPersistedOrchestratorContext(contextKey) {
		const resolvedKey = String(contextKey || '').trim();
		if (!resolvedKey) {
			return;
		}

		if (this.workflowManager && typeof this.workflowManager.clearContext === 'function') {
			this.workflowManager.clearContext(resolvedKey);
			return;
		}

		if (window._campaignOrchestratorContext) {
			delete window._campaignOrchestratorContext[resolvedKey];
		}
	}

	showWarning(message) {
		const text = String(message || '').trim();
		if (!text) {
			return;
		}

		this.setFooterStatus(text);
		window.alert(text);
	}

	injectStyles() {
		const style = document.createElement('style');
		style.id = 'campaign-tab-styles';
		style.textContent = `
			@keyframes campaignProgressIndeterminate {
				0% { transform: translateX(-140%); }
				50% { transform: translateX(25%); }
				100% { transform: translateX(165%); }
			}
			.campaign-tab-shell, .campaign-modal {
				--campaign-accent-strong: #ff6a2f;
				--campaign-accent-soft: #ea580c;
				--campaign-accent-tint: #545454;
				--campaign-accent-text: #e86032;
			}
			.campaign-tab-shell { width: calc(100% - 40px); margin: 16px 20px; display: grid; gap: 18px; align-items: start; }
			.campaign-tab-card { background: transparent; border: 0; border-radius: 0; box-shadow: none; padding: 0; }
			.campaign-tab-header { display: grid; justify-items: center; gap: 18px; text-align: center; }
			.campaign-tab-header > div { display: grid; gap: 6px; justify-items: center; }
			.campaign-studio-panel { background: var(--card-bg, rgba(255, 255, 255, 0.78)); border: 1px solid var(--card-border, rgba(15, 23, 42, 0.08)); border-radius: 18px; box-shadow: 0 16px 50px var(--db-stats-card-shadow, rgba(15, 23, 42, 0.08)); color: var(--card-text, var(--text-color, #0f172a)); }
			.campaign-tab-title { margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--heading-color, var(--text-color, #0f172a)); }
			.campaign-tab-copy { margin: 8px 0 0; color: var(--label-color, var(--text-color, #475569)); line-height: 1.5; max-width: 860px; }
			.campaign-open-button, .campaign-action-button, .campaign-modal-close { border: 0; border-radius: 999px; padding: 10px 16px; font-weight: 600; cursor: pointer; }
			.campaign-open-button { min-width: 220px; min-height: 54px; margin-top: 2px; justify-self: center; align-self: center; padding: 14px 24px; border: none; border-radius: 12px; background: linear-gradient(135deg, var(--accent-color, #b06629) 0%, var(--accent-color-hover, #76441b) 100%); color: #ffffff; font-size: 16px; font-weight: 700; letter-spacing: 0.2px; box-shadow: 0 12px 24px rgba(118, 68, 27, 0.28); transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease; }
			.campaign-open-button:hover { transform: translateY(-1px); box-shadow: 0 16px 28px rgba(118, 68, 27, 0.34); filter: brightness(1.03); }
			.campaign-open-button:focus-visible { outline: 2px solid var(--accent-color, #b06629); outline-offset: 3px; }
			.campaign-action-button.primary { background: linear-gradient(135deg, #0f766e, #155e75); color: #fff; }
			.campaign-action-button { background: var(--button-secondary-bg, #e2e8f0); color: var(--button-secondary-text, #0f172a); }
			.campaign-action-button:disabled { opacity: 0.55; cursor: not-allowed; }
			.campaign-list-title { margin: 0 0 12px; font-size: 0.95rem; font-weight: 700; color: var(--heading-color, var(--text-color, #0f172a)); text-align: center; }
			.campaign-empty-state { margin: 0; color: var(--label-color, #64748b); text-align: center; }
			.campaign-saved-list { display: grid; gap: 10px; justify-items: center; }
			.campaign-saved-card { width: min(100%, 860px); display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-radius: 14px; background: var(--card-bg, #f8fafc); border: 1px solid var(--card-border, #e2e8f0); }
			.campaign-saved-meta { display: grid; gap: 2px; }
			.campaign-saved-name { font-weight: 700; color: var(--card-title, var(--text-color, #0f172a)); }
			.campaign-saved-date { color: var(--card-meta, #64748b); font-size: 0.92rem; }
			.campaign-saved-open { flex: 1; min-width: 0; border: 0; background: transparent; text-align: left; padding: 0; cursor: pointer; }
			.campaign-saved-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
			.campaign-saved-action { border: 1px solid color-mix(in srgb, var(--button-secondary-text, #0f172a) 18%, transparent); border-radius: 999px; padding: 8px 12px; font-size: 0.88rem; cursor: pointer; background: color-mix(in srgb, var(--button-secondary-bg, #e2e8f0) 72%, white 28%); color: var(--button-secondary-text, #0f172a); box-shadow: 0 1px 2px rgba(15, 23, 42, 0.14); }
			.campaign-saved-action.delete { background: color-mix(in srgb, var(--danger-color, #dc3545) 14%, var(--card-bg, #ffffff)); color: var(--danger-color, #dc3545); }
			.campaign-modal { position: fixed; inset: 0; z-index: 9999; display: none; }
			.campaign-modal.is-open { display: block; }
			.campaign-modal-backdrop { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.52); backdrop-filter: blur(8px); }
			.campaign-modal-dialog { position: relative; height: 100%; width: 100%; display: grid; grid-template-rows: auto 1fr auto; background: linear-gradient(180deg, var(--bg-color, #f8fafc) 0%, var(--bg-color-secondary, #e2e8f0) 100%); }
			.campaign-progress-overlay { position: absolute; inset: 0; z-index: 4; display: none; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.3); backdrop-filter: blur(14px); }
			.campaign-progress-overlay.is-open { display: flex; }
			.campaign-poster-model-overlay { position: absolute; inset: 0; z-index: 5; display: none; align-items: center; justify-content: center; padding: 24px; background: rgba(15, 23, 42, 0.42); backdrop-filter: blur(16px); }
			.campaign-poster-model-overlay.is-open { display: flex; }
			.campaign-poster-model-card { width: min(520px, calc(100vw - 48px)); display: grid; gap: 16px; padding: 24px; border-radius: 24px; background: color-mix(in srgb, var(--card-bg, #ffffff) 92%, rgba(15, 23, 42, 0.12)); border: 1px solid color-mix(in srgb, var(--card-border, #cbd5e1) 72%, rgba(255, 255, 255, 0.16)); box-shadow: 0 28px 90px rgba(15, 23, 42, 0.24); color: var(--card-text, var(--text-color, #0f172a)); }
			.campaign-poster-model-title { margin: 0; font-size: 1.18rem; font-weight: 800; color: var(--heading-color, var(--text-color, #0f172a)); }
			.campaign-poster-model-body { margin: 0; line-height: 1.6; color: var(--label-color, #475569); }
			.campaign-poster-model-error { padding: 12px 14px; border-radius: 14px; background: color-mix(in srgb, var(--danger-color, #dc2626) 14%, var(--card-bg, #ffffff)); border: 1px solid color-mix(in srgb, var(--danger-color, #dc2626) 34%, var(--card-border, #dbe4ee)); color: var(--danger-color, #dc2626); line-height: 1.5; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--danger-color, #dc2626) 10%, transparent); }
			.campaign-poster-model-field { display: grid; gap: 8px; }
			.campaign-poster-model-label { font-size: 0.82rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--campaign-accent-strong, #c2410c); }
			.campaign-poster-model-select { width: 100%; border: 1px solid var(--card-border, #cbd5e1); border-radius: 14px; padding: 11px 12px; background: var(--input-background, var(--card-bg, #ffffff)); color: var(--text-color, #0f172a); font: inherit; box-shadow: inset 0 1px 0 color-mix(in srgb, var(--card-border, #cbd5e1) 14%, transparent); }
			.campaign-poster-model-select:focus { outline: 2px solid color-mix(in srgb, var(--campaign-accent-soft, #ea580c) 48%, transparent); outline-offset: 2px; border-color: color-mix(in srgb, var(--campaign-accent-soft, #ea580c) 42%, var(--card-border, #cbd5e1)); }
			.campaign-poster-model-actions { display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
			.campaign-poster-model-button { border: 0; border-radius: 999px; padding: 10px 16px; cursor: pointer; font: inherit; font-weight: 700; }
			.campaign-poster-model-button.secondary { background: var(--button-secondary-bg, #ffffff); color: var(--button-secondary-text, #0f172a); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--card-border, #cbd5e1) 72%, transparent); }
			.campaign-poster-model-button.primary { background: var(--campaign-accent-soft, #ea580c); color: var(--button-primary-text, var(--accent-text, #fff7ed)); box-shadow: 0 10px 24px color-mix(in srgb, var(--campaign-accent-soft, #ea580c) 24%, transparent); }
			.campaign-poster-model-button:disabled { opacity: 0.55; cursor: not-allowed; }
			.campaign-progress-card { width: min(520px, calc(100vw - 48px)); display: grid; gap: 14px; padding: 24px; border-radius: 24px; background: color-mix(in srgb, var(--card-bg, #ffffff) 86%, rgba(15, 23, 42, 0.14)); border: 1px solid color-mix(in srgb, var(--card-border, #cbd5e1) 72%, rgba(255, 255, 255, 0.4)); box-shadow: 0 28px 90px rgba(15, 23, 42, 0.24); color: var(--card-text, var(--text-color, #0f172a)); }
			.campaign-progress-eyebrow { font-size: 0.76rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--campaign-accent-strong, #c2410c); }
			.campaign-progress-title { margin: 0; font-size: 1.3rem; font-weight: 800; color: var(--heading-color, var(--text-color, #0f172a)); }
			.campaign-progress-body { margin: 0; line-height: 1.6; color: var(--label-color, #475569); }
			.campaign-progress-steps { display: grid; gap: 8px; }
			.campaign-progress-step { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; background: color-mix(in srgb, var(--card-bg, #ffffff) 88%, transparent); border: 1px solid var(--card-border, #dbe4ee); color: var(--card-text, var(--text-color, #0f172a)); }
			.campaign-progress-step::before { content: ''; width: 10px; height: 10px; border-radius: 999px; background: color-mix(in srgb, var(--card-border, #cbd5e1) 88%, white 12%); flex-shrink: 0; }
			.campaign-progress-step.is-active { border-color: color-mix(in srgb, var(--campaign-accent-soft, #ea580c) 42%, var(--card-border, #dbe4ee)); background: color-mix(in srgb, var(--campaign-accent-soft, #ea580c) 9%, var(--card-bg, #ffffff)); }
			.campaign-progress-step.is-active::before { background: var(--campaign-accent-soft, #ea580c); box-shadow: 0 0 0 5px color-mix(in srgb, var(--campaign-accent-soft, #ea580c) 18%, transparent); }
			.campaign-progress-step.is-complete { border-color: color-mix(in srgb, #0f766e 40%, var(--card-border, #dbe4ee)); }
			.campaign-progress-step.is-complete::before { background: #0f766e; }
			.campaign-progress-step.is-error { border-color: color-mix(in srgb, #dc2626 44%, var(--card-border, #dbe4ee)); background: color-mix(in srgb, #fecaca 46%, var(--card-bg, #ffffff)); color: #991b1b; }
			.campaign-progress-step.is-error::before { background: #dc2626; box-shadow: 0 0 0 5px color-mix(in srgb, #dc2626 18%, transparent); }
			.campaign-progress-step-label { font-weight: 700; }
			.campaign-progress-actions { display: flex; align-items: center; gap: 14px; }
			.campaign-progress-bar { position: relative; flex: 1; min-width: 0; height: 12px; overflow: hidden; border-radius: 999px; background: color-mix(in srgb, var(--card-border, #cbd5e1) 78%, rgba(255, 255, 255, 0.48)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--card-border, #cbd5e1) 72%, transparent); }
			.campaign-progress-bar::after { content: ''; position: absolute; inset: 0 auto 0 0; width: 42%; border-radius: inherit; background: linear-gradient(90deg, color-mix(in srgb, var(--campaign-accent-soft, #ea580c) 24%, transparent) 0%, var(--campaign-accent-soft, #ea580c) 48%, color-mix(in srgb, var(--campaign-accent-tint, #fed7aa) 44%, var(--campaign-accent-strong, #c2410c)) 100%); animation: campaignProgressIndeterminate 1.25s ease-in-out infinite; will-change: transform; }
			.campaign-progress-overlay.is-cancelling .campaign-progress-bar { background: color-mix(in srgb, #fca5a5 28%, rgba(255, 255, 255, 0.48)); box-shadow: inset 0 0 0 1px rgba(220, 38, 38, 0.18); }
			.campaign-progress-overlay.is-cancelling .campaign-progress-bar::after { background: linear-gradient(90deg, rgba(248, 113, 113, 0.2) 0%, #ef4444 52%, #b91c1c 100%); }
			.campaign-progress-overlay.is-failed .campaign-progress-bar { background: color-mix(in srgb, #fecaca 42%, rgba(255, 255, 255, 0.58)); box-shadow: inset 0 0 0 1px rgba(220, 38, 38, 0.18); }
			.campaign-progress-overlay.is-failed .campaign-progress-bar::after { width: 100%; animation: none; transform: none; background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%); }
			.campaign-progress-cancel { border: 0; border-radius: 999px; padding: 11px 16px; font-weight: 700; cursor: pointer; background: #b91c1c; color: #ffffff; }
			.campaign-progress-cancel:disabled { opacity: 0.65; cursor: not-allowed; }
			.campaign-modal-header, .campaign-modal-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 20px 24px; border-bottom: 1px solid var(--card-border, rgba(15, 23, 42, 0.08)); color: var(--text-color, #0f172a); }
			.campaign-modal-footer { display: grid; grid-template-columns: minmax(375px, 450px) minmax(0, 1fr); align-items: center; justify-content: initial; border-bottom: 0; border-top: 0; column-gap: 16px; }
			.campaign-modal-title { margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--heading-color, var(--text-color, #0f172a)); }
			.campaign-modal-subtitle { display: none; }
			.campaign-modal-close { background: var(--button-secondary-bg, #fff); color: var(--button-secondary-text, #0f172a); }
			.campaign-view-switcher, .campaign-footer-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
			.campaign-view-button { border: 0; border-radius: 999px; padding: 9px 14px; background: transparent; color: var(--label-color, #334155); cursor: pointer; font-weight: 600; }
			.campaign-view-button.is-active { background: var(--campaign-accent-soft, #ea580c); color: #fff7ed; box-shadow: 0 10px 24px rgba(234, 88, 12, 0.22); }
			.campaign-modal-body { display: grid; grid-template-columns: minmax(375px, 450px) minmax(0, 1fr); gap: 16px; padding: 16px 24px 24px; min-height: 0; color: var(--text-color, #0f172a); }
			.campaign-sidebar-column, .campaign-preview-column { min-height: 0; }
			.campaign-preview-column { display: flex; min-height: 0; }
			.campaign-studio-panel { --campaign-panel-gap: 14px; height: 100%; padding: 18px; display: grid; gap: var(--campaign-panel-gap); }
			.campaign-sidebar-panel { grid-template-rows: minmax(0, 1fr) auto auto; }
			.campaign-preview-panel { flex: 1; min-height: 0; grid-template-rows: minmax(0, 1fr); overflow: hidden; }
			.campaign-section-label { font-size: 0.78rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--campaign-accent-strong, #c2410c); }
			.campaign-chat-log, .campaign-preview-placeholder, .campaign-uploads-box { border: 1px dashed var(--card-border, #94a3b8); border-radius: 14px; background: color-mix(in srgb, var(--card-bg, #ffffff) 88%, transparent); padding: 14px; color: var(--card-text, #475569); }
			.campaign-chat-log { margin-top: 8px; min-height: 0; max-height: 100%; overflow: auto; display: grid; gap: 10px; align-content: start; padding-bottom: 18px; }
			.campaign-chat-message { border-radius: 12px; padding: 10px 12px; background: var(--card-bg, #ffffff); border: 1px solid var(--card-border, #dbe4ee); color: var(--card-text, var(--text-color, #0f172a)); }
			.campaign-chat-message.assistant { background: color-mix(in srgb, var(--campaign-accent-tint, #fed7aa) 22%, var(--card-bg, #ffffff)); border-color: color-mix(in srgb, var(--campaign-accent-soft, #ea580c) 30%, var(--card-border, #dbe4ee)); }
			.campaign-chat-message.warning { background: color-mix(in srgb, var(--warning-color, #f59e0b) 16%, var(--card-bg, #ffffff)); border-color: color-mix(in srgb, var(--warning-color, #f59e0b) 48%, var(--card-border, #dbe4ee)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--warning-color, #f59e0b) 18%, transparent); }
			.campaign-chat-message.warning .campaign-chat-role { color: var(--warning-color, #b45309); }
			.campaign-chat-role { display: block; margin-bottom: 4px; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: var(--campaign-accent-strong, #c2410c); }
			.campaign-chat-content p { margin: 0; }
			.campaign-chat-content p + p { margin-top: 0.7em; }
			.campaign-chat-content ul, .campaign-chat-content ol { margin: 0.55em 0 0 1.25em; padding: 0; }
			.campaign-chat-content li + li { margin-top: 0.2em; }
			.campaign-chat-content code { padding: 0.1em 0.35em; border-radius: 6px; background: color-mix(in srgb, var(--card-bg, #ffffff) 70%, var(--border-color, #cbd5e1)); font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; font-size: 0.92em; }
			.campaign-chat-content a { color: var(--campaign-accent-strong, #c2410c); text-decoration: underline; }
			.campaign-prompt-input { width: 100%; height: 84px; min-height: 84px; resize: vertical; border: 1px solid var(--card-border, #cbd5e1); border-radius: 14px; padding: 10px 12px; background: var(--input-background, #fff); color: var(--text-color, #0f172a); font: inherit; box-sizing: border-box; }
			.campaign-prompt-composer { display: grid; gap: 8px; position: relative; z-index: 1; }
			.campaign-prompt-actions { display: flex; justify-content: flex-end; min-height: 0; }
			.campaign-send-button { display: inline-flex; align-items: center; justify-content: center; height: 30px; min-height: 30px; max-height: 30px; margin: 0; padding: 0 12px; line-height: 1; font-size: 13px; box-sizing: border-box; appearance: none; -webkit-appearance: none; border: 0; border-radius: 8px; cursor: pointer; font-weight: 700; background: var(--accent-color, #4f46e5); color: var(--accent-text, #ffffff); }
			.campaign-send-button:disabled { opacity: 0.55; cursor: not-allowed; }
			.campaign-send-button.cancel-state { background: #dc2626; }
			.campaign-send-button .campaign-send-progress { display: none; position: relative; width: 22px; height: 4px; min-width: 22px; border-radius: 999px; background: rgba(255,255,255,0.25); overflow: hidden; margin-right: 8px; }
			.campaign-send-button.is-loading .campaign-send-progress { display: inline-flex; }
			.campaign-send-button .campaign-send-progress::before { content: ''; position: absolute; inset: 0; width: 120%; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 45%, transparent 100%); transform: translateX(-100%); animation: campaignSendProgress 1s linear infinite; }
			.campaign-send-button .campaign-send-text { display: inline-block; }
			@keyframes campaignSendProgress { to { transform: translateX(100%); } }
			.campaign-uploads-section { margin-top: 2px; }
			.campaign-upload-picker { display: flex; justify-content: flex-start; }
			.campaign-upload-trigger { display: inline-flex; align-items: center; justify-content: center; min-height: 34px; padding: 0 14px; border: 0; border-radius: 10px; cursor: pointer; font: inherit; font-weight: 700; background: var(--accent-color, #4f46e5); color: var(--accent-text, #ffffff); }
			.campaign-upload-input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
			.campaign-upload-list { display: grid; gap: 8px; margin-top: 12px; }
			.campaign-upload-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border-radius: 12px; background: var(--card-bg, #ffffff); border: 1px solid var(--card-border, #dbe4ee); }
			.campaign-upload-preview { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; }
			.campaign-upload-thumbnail { width: 48px; height: 48px; object-fit: cover; border-radius: 10px; background: color-mix(in srgb, var(--card-bg, #ffffff) 82%, var(--border-color, #cbd5e1)); border: 1px solid var(--card-border, #dbe4ee); flex-shrink: 0; }
			.campaign-upload-meta { display: grid; gap: 2px; min-width: 0; }
			.campaign-upload-size { color: var(--card-meta, #64748b); font-size: 0.85rem; }
			.campaign-upload-remove { border: 0; border-radius: 999px; padding: 7px 10px; cursor: pointer; background: color-mix(in srgb, var(--danger-color, #dc3545) 14%, var(--card-bg, #ffffff)); color: var(--danger-color, #dc3545); }
			.campaign-preview-placeholder { margin-top: 0; min-height: 0; height: 100%; display: grid; place-items: center; text-align: center; align-self: stretch; box-sizing: border-box; overflow: hidden; }
			.campaign-preview-placeholder.is-brief { display: block; height: 100%; text-align: left; overflow-y: auto; overflow-x: hidden; padding-right: 6px; }
			.campaign-preview-placeholder.has-output { display: block; padding: 0; overflow: hidden; }
			.campaign-brief-preview { min-height: 100%; height: auto; padding: 2px 2px 24px; box-sizing: border-box; display: grid; gap: 16px; align-content: start; color: var(--card-text, var(--text-color, #0f172a)); }
			.campaign-brief-header { display: grid; gap: 8px; padding: 18px 20px; border-radius: 18px; background: color-mix(in srgb, var(--campaign-accent-tint, #fed7aa) 18%, var(--card-bg, #ffffff)); border: 1px solid color-mix(in srgb, var(--campaign-accent-soft, #ea580c) 24%, var(--card-border, #dbe4ee)); }
			.campaign-brief-kicker { font-size: 0.76rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--campaign-accent-strong, #c2410c); }
			.campaign-brief-title { margin: 0; font-size: 1.5rem; line-height: 1.15; color: var(--heading-color, var(--text-color, #0f172a)); }
			.campaign-brief-subtitle { margin: 0; font-size: 1rem; line-height: 1.5; color: var(--label-color, #475569); }
			.campaign-brief-section { display: grid; gap: 12px; padding: 16px 18px; border-radius: 16px; background: color-mix(in srgb, var(--campaign-accent-tint, #fed7aa) 18%, var(--card-bg, #ffffff)); border: 1px solid color-mix(in srgb, var(--campaign-accent-soft, #ea580c) 24%, var(--card-border, #dbe4ee)); }
			.campaign-brief-section.poster { border-color: color-mix(in srgb, var(--campaign-accent-soft, #ea580c) 24%, var(--card-border, #dbe4ee)); background: color-mix(in srgb, var(--campaign-accent-tint, #fed7aa) 18%, var(--card-bg, #ffffff)); }
			.campaign-brief-section-title { margin: 0; font-size: 0.82rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--campaign-accent-strong, #c2410c); }
			.campaign-brief-fields { display: grid; gap: 10px; }
			.campaign-brief-field { display: grid; gap: 6px; }
			.campaign-brief-field-label { font-size: 0.82rem; font-weight: 700; color: var(--label-color, #64748b); }
			.campaign-brief-field-value { margin: 0; line-height: 1.6; color: var(--card-text, var(--text-color, #0f172a)); white-space: pre-wrap; }
			.campaign-brief-input, .campaign-brief-textarea { width: 100%; border: 1px solid color-mix(in srgb, var(--card-border, #dbe4ee) 92%, transparent); border-radius: 12px; background: color-mix(in srgb, var(--input-background, #ffffff) 94%, transparent); color: var(--text-color, #0f172a); font: inherit; box-sizing: border-box; }
			.campaign-brief-input { min-height: 42px; padding: 10px 12px; }
			.campaign-brief-textarea { min-height: 96px; padding: 10px 12px; resize: vertical; line-height: 1.55; }
			.campaign-brief-textarea.keypoints { min-height: 180px; max-height: 280px; overflow-y: auto; }
			.campaign-brief-input.title { font-size: 1.35rem; font-weight: 800; min-height: 52px; padding: 12px 14px; background: color-mix(in srgb, var(--card-bg, #ffffff) 96%, transparent); }
			.campaign-brief-input.subtitle { font-size: 1rem; }
			.campaign-brief-input:focus, .campaign-brief-textarea:focus { outline: 2px solid color-mix(in srgb, var(--campaign-accent-soft, #ea580c) 44%, white 6%); outline-offset: 1px; border-color: color-mix(in srgb, var(--campaign-accent-soft, #ea580c) 36%, var(--card-border, #dbe4ee)); }
			.campaign-brief-keypoints-hint { margin: -2px 0 0; font-size: 0.8rem; color: var(--label-color, #64748b); }
			.campaign-brief-list { margin: 0; padding-left: 1.15rem; display: grid; gap: 4px; }
			.campaign-brief-list li { line-height: 1.55; }
			.campaign-output-frame, .campaign-output-image { display: block; width: 100%; height: 100%; min-height: 100%; border: 0; border-radius: 14px; background: #ffffff; }
			.campaign-output-image { object-fit: contain; background: color-mix(in srgb, var(--card-bg, #ffffff) 88%, transparent); }
			.campaign-presentation-shell, .campaign-miniapp-shell { display: grid; grid-template-rows: minmax(0, 1fr) auto; height: 100%; min-height: 100%; }
			.campaign-presentation-frame-wrap, .campaign-miniapp-frame-wrap { min-height: 0; }
			.campaign-presentation-actions, .campaign-miniapp-actions { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 12px 12px 14px; }
			.campaign-presentation-action-group, .campaign-miniapp-action-group { display: inline-flex; align-items: center; justify-content: flex-end; gap: 10px; margin-left: auto; flex-wrap: wrap; }
			.campaign-artifact-progress { width: 96px; height: 8px; border-radius: 999px; overflow: hidden; background: color-mix(in srgb, var(--campaign-accent-tint, #fed7aa) 52%, var(--card-bg, #ffffff)); position: relative; flex: 0 0 auto; }
			.campaign-artifact-progress::after { content: ''; position: absolute; inset: 0; width: 40%; border-radius: inherit; background: linear-gradient(90deg, transparent 0%, var(--campaign-accent-strong, #c2410c) 25%, color-mix(in srgb, var(--campaign-accent-strong, #c2410c) 70%, #ffffff) 50%, var(--campaign-accent-strong, #c2410c) 75%, transparent 100%); animation: campaignArtifactIndeterminate 1s ease-in-out infinite; }
			.campaign-presentation-action, .campaign-miniapp-action { border: 0; border-radius: 999px; padding: 9px 14px; cursor: pointer; font: inherit; font-weight: 700; background: color-mix(in srgb, var(--campaign-accent-tint, #fed7aa) 40%, var(--card-bg, #ffffff)); color: var(--campaign-accent-strong, #c2410c); }
			.campaign-presentation-action:disabled, .campaign-miniapp-action:disabled { opacity: 0.45; cursor: not-allowed; }
			.campaign-presentation-action.is-cancelling, .campaign-miniapp-action.is-cancelling { background: color-mix(in srgb, #fecaca 62%, var(--card-bg, #ffffff)); color: #b91c1c; }
			.campaign-poster-editor-shell, .campaign-poster-shell { display: grid; grid-template-rows: minmax(0, 1fr) auto; height: 100%; min-height: 100%; background: color-mix(in srgb, var(--card-bg, #ffffff) 92%, transparent); }
			.campaign-poster-visual-region { min-height: 0; display: grid; grid-template-rows: auto minmax(0, 1fr); overflow: hidden; }
			.campaign-poster-shell .campaign-poster-visual-region { grid-template-rows: minmax(0, 1fr); }
			.campaign-poster-editor-toolbar { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 12px 12px 0; flex-shrink: 0; }
			.campaign-poster-editor-actions { display: inline-flex; align-items: center; gap: 8px; }
			.campaign-poster-editor-button { border: 0; border-radius: 999px; padding: 8px 12px; cursor: pointer; font: inherit; font-weight: 700; background: color-mix(in srgb, var(--campaign-accent-tint, #fed7aa) 40%, var(--card-bg, #ffffff)); color: var(--campaign-accent-strong, #c2410c); }
			.campaign-poster-editor-button:disabled { opacity: 0.45; cursor: not-allowed; }
			.campaign-poster-editor-stage { min-height: 0; height: 100%; padding: 12px; overflow: auto; }
			.campaign-poster-editor-canvas-wrap { min-width: 100%; min-height: 100%; display: flex; align-items: center; justify-content: center; }
			.campaign-poster-editor-canvas { display: block; max-width: none; max-height: none; height: auto; border-radius: 14px; box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12); background: #ffffff; }
			.campaign-poster-image-wrap { min-height: 0; padding: 12px; display: flex; align-items: center; justify-content: center; overflow: auto; }
			.campaign-poster-image-wrap .campaign-output-image { width: auto; max-width: none; height: auto; min-height: 0; max-height: none; }
			.campaign-poster-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 12px 16px; border-top: 1px solid color-mix(in srgb, var(--campaign-accent-soft, #ea580c) 16%, var(--card-border, #dbe4ee)); background: color-mix(in srgb, var(--card-bg, #ffffff) 96%, transparent); }
			.campaign-poster-action-group { display: inline-flex; align-items: center; justify-content: flex-end; gap: 10px; margin-left: auto; flex-wrap: wrap; }
			.campaign-poster-action { border: 0; border-radius: 999px; padding: 9px 14px; cursor: pointer; font: inherit; font-weight: 700; background: color-mix(in srgb, var(--campaign-accent-tint, #fed7aa) 40%, var(--card-bg, #ffffff)); color: var(--campaign-accent-strong, #c2410c); }
			.campaign-poster-action:disabled { opacity: 0.45; cursor: not-allowed; }
			.campaign-poster-action.is-cancelling { background: color-mix(in srgb, #fecaca 62%, var(--card-bg, #ffffff)); color: #b91c1c; }
			.campaign-poster-zoom-controls { display: inline-flex; align-items: center; gap: 8px; min-width: 0; }
			.campaign-poster-zoom-button { border: 0; border-radius: 999px; width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font: inherit; font-weight: 800; font-size: 1rem; background: color-mix(in srgb, var(--campaign-accent-tint, #fed7aa) 36%, var(--card-bg, #ffffff)); color: var(--campaign-accent-strong, #c2410c); }
			.campaign-poster-zoom-button:disabled { opacity: 0.45; cursor: not-allowed; }
			.campaign-poster-zoom-level { min-width: 56px; text-align: center; font-size: 0.82rem; font-weight: 800; letter-spacing: 0.04em; color: var(--label-color, #475569); }
			.campaign-placeholder-copy { max-width: 640px; }
			.campaign-placeholder-copy strong { display: block; margin-bottom: 10px; color: var(--card-title, var(--text-color, #0f172a)); }
			.campaign-placeholder-copy p { margin: 0; }
			.campaign-status { color: var(--label-color, #64748b); font-size: 0.95rem; }
			.campaign-status:empty { display: none; }
			.campaign-footer-status { min-width: 0; justify-self: end; text-align: right; color: var(--label-color, #475569); font-size: 0.92rem; }
			.campaign-footer-status:empty { display: none; }
			.campaign-footer-actions { margin-top: 8px; flex-shrink: 0; justify-self: center; }
			@keyframes campaignArtifactIndeterminate {
				0% { transform: translateX(-120%); }
				100% { transform: translateX(280%); }
			}
			@media (max-width: 980px) {
				.campaign-modal-body { grid-template-columns: 1fr; }
				.campaign-modal-footer { grid-template-columns: 1fr; row-gap: 10px; }
				.campaign-footer-actions, .campaign-footer-status { justify-self: center; text-align: center; }
				.campaign-poster-actions { flex-wrap: wrap; justify-content: center; }
				.campaign-poster-action-group { margin-left: 0; justify-content: center; }
			}
		`;
		document.head.appendChild(style);
	}

	renderTab() {
		const cardsMarkup = this.state.savedCampaigns.length
			? this.state.savedCampaigns.map(campaign => `
				<div class="campaign-saved-card">
					<button class="campaign-saved-open" type="button" data-campaign-load-id="${this.escapeHtml(campaign.id)}">
						<div class="campaign-saved-meta">
							<div class="campaign-saved-name">${this.escapeHtml(campaign.name)}</div>
							<div class="campaign-saved-date">${this.escapeHtml(campaign.dateCreated)}</div>
						</div>
					</button>
					<div class="campaign-saved-actions">
						<button class="campaign-saved-action delete" type="button" data-campaign-card-action="delete" data-campaign-id="${this.escapeHtml(campaign.id)}">${Lang.get('deleteButton')}</button>
					</div>
				</div>
			`).join('')
			: `<p class="campaign-empty-state">${Lang.get('campaignEmptyState')}</p>`;

		this.tabElement.innerHTML = `
			<div class="campaign-tab-shell">
				<section class="campaign-tab-card">
					<div class="campaign-tab-header">
						<div>
							<h2 class="campaign-tab-title">${Lang.get('campaignTab')}</h2>
							<p class="campaign-tab-copy">${Lang.get('campaignTabIntro')}</p>
						</div>
						<button id="open-campaign-studio" class="campaign-open-button" type="button">${Lang.get('openCampaignStudioButton')}</button>
					</div>
				</section>
				<section class="campaign-tab-card">
					<h3 class="campaign-list-title">${Lang.get('campaignSavedListTitle')}</h3>
					<div class="campaign-saved-list">${cardsMarkup}</div>
				</section>
			</div>
		`;
	}

	ensureModal() {
		if (this.modalElement && document.body.contains(this.modalElement)) {
			this.updateModalContent();
			return;
		}

		const modal = document.createElement('div');
		modal.className = 'campaign-modal';
		modal.id = 'campaign-studio-modal';
		modal.innerHTML = this.getModalMarkup();
		document.body.appendChild(modal);
		this.modalElement = modal;
		this.updateModalContent();
	}

	getModalMarkup() {
		return `
			<div class="campaign-modal-backdrop" data-campaign-close="true"></div>
			<div class="campaign-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="campaign-studio-title">
				<div class="campaign-modal-header">
					<div>
						<h2 id="campaign-studio-title" class="campaign-modal-title"></h2>
						<p class="campaign-modal-subtitle" id="campaign-studio-subtitle"></p>
					</div>
					<div class="campaign-view-switcher" id="campaign-view-switcher"></div>
					<button class="campaign-modal-close" type="button" data-campaign-close="true"></button>
				</div>
				<div class="campaign-modal-body">
					<div class="campaign-sidebar-column">
						<section class="campaign-studio-panel campaign-sidebar-panel">
							<div class="campaign-chat-log" id="campaign-chat-log"></div>
							<div class="campaign-prompt-composer">
								<textarea id="campaign-prompt-input" class="campaign-prompt-input"></textarea>
								<div class="campaign-prompt-actions">
									<button id="campaign-send-button" class="campaign-send-button" type="button">
								<span class="campaign-send-progress" aria-hidden="true"></span>
								<span class="campaign-send-text"></span>
							</button>
								</div>
							</div>
							<div class="campaign-uploads-section">
								<div class="campaign-section-label" id="campaign-uploads-label"></div>
								<div class="campaign-uploads-box">
									<div class="campaign-upload-picker">
										<button id="campaign-upload-trigger" class="campaign-upload-trigger" type="button"></button>
									</div>
									<input id="campaign-upload-input" class="campaign-upload-input" type="file" accept="image/*">
									<div id="campaign-upload-list" class="campaign-upload-list"></div>
								</div>
							</div>
						</section>
					</div>
					<div class="campaign-preview-column">
						<section class="campaign-studio-panel campaign-preview-panel">
							<div class="campaign-preview-placeholder" id="campaign-preview-placeholder"></div>
						</section>
					</div>
				</div>
				<div class="campaign-modal-footer">
					<div class="campaign-footer-actions">
						<button class="campaign-action-button primary" type="button" data-campaign-action="generate"></button>
						<button class="campaign-action-button" type="button" data-campaign-action="save"></button>
					</div>
					<div class="campaign-footer-status" id="campaign-footer-status"></div>
				</div>
				<div class="campaign-progress-overlay" id="campaign-workflow-progress" aria-hidden="true">
					<div class="campaign-progress-card" role="status" aria-live="polite">
						<div class="campaign-progress-eyebrow" id="campaign-progress-eyebrow"></div>
						<h3 class="campaign-progress-title" id="campaign-progress-title"></h3>
						<p class="campaign-progress-body" id="campaign-progress-body"></p>
						<div class="campaign-progress-steps" id="campaign-progress-steps"></div>
						<div class="campaign-progress-actions">
							<div class="campaign-progress-bar" aria-hidden="true"></div>
							<button id="campaign-progress-cancel" class="campaign-progress-cancel" type="button"></button>
						</div>
					</div>
				</div>
				<div class="campaign-poster-model-overlay" id="campaign-poster-model-overlay" aria-hidden="true"></div>
			</div>
		`;
	}

	bindTabEvents() {
		if (!this.tabElement || this.tabElement.dataset.boundCampaign === 'true') {
			return;
		}

		this.tabElement.dataset.boundCampaign = 'true';
		this.tabElement.addEventListener('click', event => {
			const openButton = event.target.closest('#open-campaign-studio');
			if (openButton) {
				this.resetCurrentCampaign();
				void this.ensureWorkflowManagerReady().catch(error => {
					console.error('CampaignTab: failed to lazy-load workflow manager on studio open', error);
				});
				this.openStudio();
				return;
			}

			const loadButton = event.target.closest('[data-campaign-load-id]');
			if (loadButton) {
				this.loadCampaignById(loadButton.dataset.campaignLoadId);
				return;
			}

			const cardAction = event.target.closest('[data-campaign-card-action]');
			if (cardAction) {
				const campaignId = cardAction.dataset.campaignId;
				if (cardAction.dataset.campaignCardAction === 'delete') {
					this.deleteCampaignById(campaignId);
				}
			}
		});
	}

	bindModalEvents() {
		if (!this.modalElement || this.modalElement.dataset.boundCampaign === 'true') {
			return;
		}

		this.modalElement.dataset.boundCampaign = 'true';

		this.modalElement.addEventListener('input', event => {
			if (event.target.id === 'campaign-prompt-input') {
				this.state.draftPrompt = event.target.value;
				this.updatePromptComposerState();
				return;
			}

			const briefField = event.target.closest('[data-campaign-brief-field]');
			if (briefField) {
				this.handleBriefFieldInput(briefField.dataset.campaignBriefField, event.target.value);
			}
		});

		this.modalElement.addEventListener('keydown', event => {
			if (event.target.id === 'campaign-prompt-input' && event.key === 'Enter' && !event.shiftKey) {
				event.preventDefault();
				this.submitPromptMessage();
			}
		});

		this.modalElement.addEventListener('change', event => {
			if (event.target.id === 'campaign-upload-input') {
				this.handleUploadSelection(event.target.files);
				return;
			}

			if (event.target.id === 'campaign-poster-model-select') {
				this.state.posterVisualModelPrompt = {
					...this.createPosterVisualModelPromptState(),
					...this.state.posterVisualModelPrompt,
					selectedModel: String(event.target.value || '').trim()
				};
				this.renderPosterVisualModelPrompt();
			}
		});

		this.modalElement.addEventListener('click', event => {
			const promptCancelButton = event.target.closest('[data-campaign-poster-model-cancel]');
			if (promptCancelButton) {
				this.resolvePosterVisualModelPrompt('');
				return;
			}

			const promptConfirmButton = event.target.closest('[data-campaign-poster-model-confirm]');
			if (promptConfirmButton) {
				this.confirmPosterVisualModelPrompt();
				return;
			}

			const closeRequested = event.target.closest('[data-campaign-close="true"]');
			if (closeRequested) {
				if (this.state.posterVisualModelPrompt?.isOpen) {
					return;
				}
				if (this.state.workflowProgress?.isOpen) {
					return;
				}
				this.closeStudio();
				return;
			}

			const cancelWorkflowButton = event.target.closest('#campaign-progress-cancel');
			if (cancelWorkflowButton) {
				if (this.state.workflowProgress?.isFailed) {
					this.hideWorkflowProgress();
					return;
				}
				this.cancelActiveWorkflowSequence();
				return;
			}

			const viewButton = event.target.closest('[data-campaign-view]');
			if (viewButton) {
				this.setActiveViewport(viewButton.dataset.campaignView);
				return;
			}

			const posterActionButton = event.target.closest('[data-campaign-poster-action]');
			if (posterActionButton) {
				this.handleCampaignPosterAction(posterActionButton.dataset.campaignPosterAction);
				return;
			}

			const presentationActionButton = event.target.closest('[data-campaign-presentation-action]');
			if (presentationActionButton) {
				this.handleCampaignPresentationAction(presentationActionButton.dataset.campaignPresentationAction);
				return;
			}

			const miniappActionButton = event.target.closest('[data-campaign-miniapp-action]');
			if (miniappActionButton) {
				this.handleCampaignMiniappAction(miniappActionButton.dataset.campaignMiniappAction);
				return;
			}

			const actionButton = event.target.closest('[data-campaign-action]');
			if (actionButton) {
				this.handleAction(actionButton.dataset.campaignAction);
				return;
			}

			const sendButton = event.target.closest('#campaign-send-button');
			if (sendButton) {
				if (this.state.isWorkflowPending && this.state.pendingWorkflow?.action === 'discuss') {
					this.cancelPendingWorkflowRequest();
				} else {
					this.submitPromptMessage();
				}
				return;
			}

			const uploadTrigger = event.target.closest('#campaign-upload-trigger');
			if (uploadTrigger) {
				this.modalElement?.querySelector('#campaign-upload-input')?.click();
				return;
			}

			const removeImageButton = event.target.closest('[data-campaign-image-remove]');
			if (removeImageButton) {
				this.removeImageFromRegistry(removeImageButton.dataset.campaignImageRemove);
			}
		});
	}

	bindWorkflowEvents() {
		window.__campaignWorkflowHandler = this;

		if (window.__campaignWorkflowEventsBound) {
			return;
		}

		window.__campaignWorkflowEventsBound = true;

		window.addEventListener('campaign:workflow-requested', event => {
			const handler = window.__campaignWorkflowHandler;
			if (handler && typeof handler.handleWorkflowRequested === 'function') {
				void handler.handleWorkflowRequested(event.detail || {});
			}
		});

		window.addEventListener('campaign:workflow-response', event => {
			const handler = window.__campaignWorkflowHandler;
			if (handler && typeof handler.handleWorkflowResponse === 'function') {
				handler.handleWorkflowResponse(event.detail || {});
			}
		});

		window.addEventListener('campaign:workflow-planned', event => {
			const handler = window.__campaignWorkflowHandler;
			if (handler && typeof handler.handleWorkflowPlanned === 'function') {
				handler.handleWorkflowPlanned(event.detail || {});
			}
		});

		window.addEventListener('campaign:artifact-requested', event => {
			const handler = window.__campaignWorkflowHandler;
			if (handler && typeof handler.handleArtifactRequested === 'function') {
				void handler.handleArtifactRequested(event.detail || {});
			}
		});

		window.addEventListener('campaign:artifact-response', event => {
			const handler = window.__campaignWorkflowHandler;
			if (handler && typeof handler.handleArtifactResponse === 'function') {
				handler.handleArtifactResponse(event.detail || {});
			}
		});
	}

	updateModalContent() {
		if (!this.modalElement) {
			return;
		}

		const setText = (selector, key) => {
			const element = this.modalElement.querySelector(selector);
			if (element) {
				element.textContent = key ? Lang.get(key) : '';
			}
		};

		setText('.campaign-modal-close', 'campaignCloseStudioButton');
		setText('#campaign-studio-title', 'campaignStudioModalTitle');
		setText('#campaign-studio-subtitle', '');
		setText('#campaign-uploads-label', 'campaignUploadsLabel');
		setText('#campaign-footer-status', '');

		const promptInput = this.modalElement.querySelector('#campaign-prompt-input');
		if (promptInput) {
			promptInput.placeholder = Lang.get('campaignPromptPlaceholder');
			if (promptInput.value !== this.state.draftPrompt) {
				promptInput.value = this.state.draftPrompt;
			}
			promptInput.disabled = this.state.isWorkflowPending && this.state.pendingWorkflow?.action !== 'discuss';
		}

		const sendButton = this.modalElement.querySelector('#campaign-send-button');
		if (sendButton) {
			const sendText = sendButton.querySelector('.campaign-send-text');
			if (sendText) {
				sendText.textContent = Lang.get('sendButton') || 'Send';
			} else {
				sendButton.textContent = Lang.get('sendButton') || 'Send';
			}
		}

		const progressCancelButton = this.modalElement.querySelector('#campaign-progress-cancel');
		if (progressCancelButton) {
			progressCancelButton.textContent = Lang.get('campaignWorkflowCancelButton');
		}

		const uploadTrigger = this.modalElement.querySelector('#campaign-upload-trigger');
		if (uploadTrigger) {
			uploadTrigger.textContent = Lang.get('campaignChooseImageButton');
		}

		const actions = {
			generate: 'campaignGenerateButton',
			save: 'campaignSaveButton'
		};

		Object.entries(actions).forEach(([action, key]) => {
			const button = this.modalElement.querySelector(`[data-campaign-action="${action}"]`);
			if (button) {
				button.textContent = Lang.get(key);
			}
		});

		this.renderViewSwitcher();
		this.renderChatLog();
		this.renderImageRegistry();
		this.renderViewport();
		this.renderWorkflowProgress();
		this.renderPosterVisualModelPrompt();
		this.updatePromptComposerState();
	}

	promptForPosterVisualModel(options = {}) {
		const models = Array.isArray(options.models)
			? options.models
				.map(model => ({
					name: String(model?.name || '').trim(),
					provider: String(model?.provider || '').trim().toLowerCase()
				}))
				.filter(model => model.name)
			: [];

		if (!models.length) {
			return Promise.resolve('');
		}

		if (this.posterVisualModelPromptResolver) {
			this.resolvePosterVisualModelPrompt('');
		}

		const preferredModel = String(options.selectedModel || '').trim();
		const selectedModel = models.some(model => model.name === preferredModel)
			? preferredModel
			: models[0].name;

		this.state.posterVisualModelPrompt = {
			isOpen: true,
			message: String(options.message || Lang.get('campaignPosterVisualModelModalBody') || '').trim(),
			errorMessage: String(options.errorMessage || '').trim(),
			selectedModel,
			models
		};
		this.renderPosterVisualModelPrompt();

		return new Promise(resolve => {
			this.posterVisualModelPromptResolver = resolve;
		});
	}

	confirmPosterVisualModelPrompt() {
		const selectedModel = String(this.state.posterVisualModelPrompt?.selectedModel || '').trim();
		if (!selectedModel) {
			this.state.posterVisualModelPrompt = {
				...this.state.posterVisualModelPrompt,
				errorMessage: Lang.get('artworkPleaseSelectVisualModel') || ''
			};
			this.renderPosterVisualModelPrompt();
			return;
		}

		this.resolvePosterVisualModelPrompt(selectedModel);
	}

	resolvePosterVisualModelPrompt(selectedModel) {
		const resolver = this.posterVisualModelPromptResolver;
		this.posterVisualModelPromptResolver = null;
		this.state.posterVisualModelPrompt = this.createPosterVisualModelPromptState();
		this.renderPosterVisualModelPrompt();
		if (typeof resolver === 'function') {
			resolver(String(selectedModel || '').trim());
		}
	}

	renderPosterVisualModelPrompt() {
		const overlay = this.modalElement?.querySelector('#campaign-poster-model-overlay');
		if (!overlay) {
			return;
		}

		const promptState = this.state.posterVisualModelPrompt || this.createPosterVisualModelPromptState();
		overlay.classList.toggle('is-open', !!promptState.isOpen);
		overlay.setAttribute('aria-hidden', promptState.isOpen ? 'false' : 'true');

		if (!promptState.isOpen) {
			overlay.innerHTML = '';
			return;
		}

		const optionMarkup = promptState.models.map(model => {
			const providerLabel = model.provider === 'cloud'
				? (Lang.get('artworkCloudVisualModelsHeader') || 'Cloud')
				: (Lang.get('artworkLocalVisualModelsHeader') || 'Local');
			return `<option value="${this.escapeHtml(model.name)}"${model.name === promptState.selectedModel ? ' selected' : ''}>${this.escapeHtml(`${model.name} (${providerLabel})`)}</option>`;
		}).join('');

		overlay.innerHTML = `
			<div class="campaign-poster-model-card" role="dialog" aria-modal="true" aria-labelledby="campaign-poster-model-title">
				<h3 class="campaign-poster-model-title" id="campaign-poster-model-title">${this.escapeHtml(Lang.get('campaignPosterVisualModelModalTitle') || Lang.get('artworkSelectVisualModel') || '')}</h3>
				<p class="campaign-poster-model-body">${this.escapeHtml(promptState.message || Lang.get('campaignPosterVisualModelModalBody') || '')}</p>
				${promptState.errorMessage ? `<div class="campaign-poster-model-error">${this.escapeHtml(promptState.errorMessage)}</div>` : ''}
				<div class="campaign-poster-model-field">
					<label class="campaign-poster-model-label" for="campaign-poster-model-select">${this.escapeHtml(Lang.get('artworkSelectVisualModel') || '')}</label>
					<select id="campaign-poster-model-select" class="campaign-poster-model-select">${optionMarkup}</select>
				</div>
				<div class="campaign-poster-model-actions">
					<button class="campaign-poster-model-button secondary" type="button" data-campaign-poster-model-cancel="true">${this.escapeHtml(Lang.get('cancelButton') || Lang.get('closeButton') || 'Cancel')}</button>
					<button class="campaign-poster-model-button primary" type="button" data-campaign-poster-model-confirm="true">${this.escapeHtml(Lang.get('selectButton') || 'Select')}</button>
				</div>
			</div>
		`;

		window.requestAnimationFrame(() => {
			const select = overlay.querySelector('#campaign-poster-model-select');
			if (select) {
				select.focus();
			}
		});
	}

	renderChatLog(options = {}) {
		const chatLog = this.modalElement?.querySelector('#campaign-chat-log');
		if (!chatLog) {
			return;
		}

		const shouldStickToBottom = !!options.forceScrollToBottom || this.isChatLogNearBottom(chatLog);

		if (!this.state.chatMessages.length) {
				chatLog.innerHTML = '';
			return;
		}

		chatLog.innerHTML = this.state.chatMessages.map(message => `
			<div class="campaign-chat-message ${this.escapeHtml(message.role)}">
				<span class="campaign-chat-role">${this.escapeHtml(this.getChatRoleLabel(message.role))}</span>
				<div class="campaign-chat-content">${this.formatChatMessageContent(message)}</div>
			</div>
		`).join('');

		if (shouldStickToBottom) {
			this.scrollChatLogToLatest(chatLog);
		}
	}

	isChatLogNearBottom(chatLog) {
		if (!chatLog) {
			return false;
		}

		const remaining = chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight;
		return remaining <= this.chatAutoScrollGap + 8;
	}

	scrollChatLogToLatest(chatLog) {
		window.requestAnimationFrame(() => {
			const currentChatLog = chatLog || this.modalElement?.querySelector('#campaign-chat-log');
			if (!currentChatLog) {
				return;
			}

			const maxScrollTop = Math.max(0, currentChatLog.scrollHeight - currentChatLog.clientHeight);
			currentChatLog.scrollTop = maxScrollTop;
		});
	}

	renderImageRegistry() {
		const list = this.modalElement?.querySelector('#campaign-upload-list');
		if (!list) {
			return;
		}

		if (!this.state.imageRegistry.length) {
				list.innerHTML = '';
			return;
		}

		list.innerHTML = this.state.imageRegistry.map(image => `
			<div class="campaign-upload-item">
					<div class="campaign-upload-preview">
						<img class="campaign-upload-thumbnail" src="${this.escapeHtml(image.dataUrl || '')}" alt="${this.escapeHtml(image.name || 'Campaign upload')}">
						<div class="campaign-upload-meta">
							<div class="campaign-upload-size">${this.escapeHtml(this.formatBytes(image.size))}</div>
						</div>
				</div>
				<button class="campaign-upload-remove" type="button" data-campaign-image-remove="${this.escapeHtml(image.id)}">${Lang.get('deleteButton')}</button>
			</div>
		`).join('');
	}

	renderViewSwitcher() {
		const switcher = this.modalElement?.querySelector('#campaign-view-switcher');
		if (!switcher) {
			return;
		}

		const views = [
			{ id: 'brief', label: Lang.get('campaignBriefView') },
			{ id: 'poster', label: Lang.get('campaignPosterView') },
			{ id: 'presentation', label: Lang.get('campaignPresentationView') },
			{ id: 'miniapp', label: Lang.get('campaignMiniAppView') }
		];

		switcher.innerHTML = views.map(view => `
			<button class="campaign-view-button${view.id === this.state.activeViewport ? ' is-active' : ''}" type="button" data-campaign-view="${view.id}">${view.label}</button>
		`).join('');
	}

	renderViewport() {
		const preview = this.modalElement?.querySelector('#campaign-preview-placeholder');
		if (!preview) {
			return;
		}

		this.teardownCampaignOutputEditor();
		this.teardownCampaignPosterEditor();

		const outputs = this.state.currentCampaign.outputs || {};

		const copy = {
			brief: {
				title: Lang.get('campaignBriefView'),
				body: this.getBriefPreviewText()
			},
			poster: {
				title: Lang.get('campaignPosterView'),
				body: Lang.get('campaignPosterPlaceholder')
			},
			presentation: {
				title: Lang.get('campaignPresentationView'),
				body: Lang.get('campaignPresentationPlaceholder')
			},
			miniapp: {
				title: Lang.get('campaignMiniAppView'),
				body: Lang.get('campaignMiniAppPlaceholder')
			}
		};

		const current = copy[this.state.activeViewport] || copy.brief;
		const isBriefView = this.state.activeViewport === 'brief';
		preview.classList.toggle('is-brief', isBriefView);
		preview.classList.remove('has-output');

		if (isBriefView) {
			preview.innerHTML = `
				${this.getBriefPreviewMarkup()}
			`;
			return;
		}

		if (this.state.activeViewport === 'poster' && outputs.posterPng) {
			preview.classList.add('has-output');
			if (outputs.posterOverlayData && outputs.posterBackgroundImage) {
				preview.innerHTML = `
					<div class="campaign-poster-editor-shell">
						<div class="campaign-poster-visual-region">
							<div class="campaign-poster-editor-toolbar">
								<div class="campaign-poster-editor-actions">
									<button class="campaign-poster-editor-button" type="button" data-campaign-poster-action="delete">${this.escapeHtml(Lang.get('deleteButton'))}</button>
									<button class="campaign-poster-editor-button" type="button" data-campaign-poster-action="undo">${this.escapeHtml(Lang.get('paperworkUndoEditButton'))}</button>
								</div>
							</div>
							<div class="campaign-poster-editor-stage" data-campaign-poster-editor-stage="true"></div>
						</div>
						<div class="campaign-poster-actions" data-campaign-poster-actions="true">${this.getCampaignPosterActionMarkup()}</div>
					</div>
				`;
				void this.enableCampaignPosterEditing(preview.querySelector('[data-campaign-poster-editor-stage="true"]'));
				return;
			}

			preview.innerHTML = `
				<div class="campaign-poster-shell">
					<div class="campaign-poster-visual-region">
						<div class="campaign-poster-image-wrap">
							<img class="campaign-output-image" src="${this.escapeHtml(outputs.posterPng)}" alt="${this.escapeHtml(Lang.get('campaignPosterView'))}">
						</div>
					</div>
					<div class="campaign-poster-actions" data-campaign-poster-actions="true">${this.getCampaignPosterActionMarkup()}</div>
				</div>
			`;
				const posterImage = preview.querySelector('.campaign-poster-image-wrap .campaign-output-image');
				if (posterImage) {
					const applyImageZoom = () => this.applyCampaignPosterZoom();
					if (posterImage.complete) {
						window.requestAnimationFrame(applyImageZoom);
					} else {
						posterImage.addEventListener('load', applyImageZoom, { once: true });
					}
				}
			return;
		}

		if (this.state.activeViewport === 'presentation' && outputs.presentationHtml) {
			const presentationRegeneration = this.getArtifactRegenerationState('presentation');
			const isPresentationRegenerating = presentationRegeneration.isPending;
			const presentationSaveLabel = this.isSavingCampaignPresentation
				? Lang.get('artworkExportingHTML')
				: Lang.get('saveToDiskButton');
			preview.classList.add('has-output');
			preview.innerHTML = `
				<div class="campaign-presentation-shell">
					<div class="campaign-presentation-frame-wrap">
						<iframe class="campaign-output-frame" title="${this.escapeHtml(Lang.get('campaignPresentationView'))}" srcdoc="${this.escapeHtml(outputs.presentationHtml)}"></iframe>
					</div>
					<div class="campaign-presentation-actions">
						<div class="campaign-presentation-action-group">
							${isPresentationRegenerating ? '<div class="campaign-artifact-progress" aria-hidden="true"></div>' : ''}
							<button class="campaign-presentation-action${isPresentationRegenerating ? ' is-cancelling' : ''}" type="button" data-campaign-presentation-action="${isPresentationRegenerating ? 'cancel' : 'regenerate'}"${this.state.isWorkflowPending ? ' disabled' : ''}>${this.escapeHtml(isPresentationRegenerating ? (Lang.get('cancelButton') || Lang.get('cancel') || 'Cancel') : Lang.get('regenerateMessage'))}</button>
							<button class="campaign-presentation-action" type="button" data-campaign-presentation-action="save"${this.state.isWorkflowPending || isPresentationRegenerating || this.isSavingCampaignPresentation ? ' disabled' : ''}>${this.escapeHtml(presentationSaveLabel)}</button>
						</div>
					</div>
				</div>
			`;
			const frame = preview.querySelector('.campaign-output-frame');
			void this.enableCampaignOutputEditing(frame, 'presentation');
			return;
		}

		if (this.state.activeViewport === 'miniapp' && outputs.miniappHtml) {
			const miniappRegeneration = this.getArtifactRegenerationState('miniapp');
			const isMiniappRegenerating = miniappRegeneration.isPending;
			const miniappSaveLabel = this.isSavingCampaignMiniapp
				? Lang.get('artworkExportingHTML')
				: Lang.get('saveToDiskButton');
			preview.classList.add('has-output');
			preview.innerHTML = `
				<div class="campaign-miniapp-shell">
					<div class="campaign-miniapp-frame-wrap">
						<iframe class="campaign-output-frame" title="${this.escapeHtml(Lang.get('campaignMiniAppView'))}" srcdoc="${this.escapeHtml(outputs.miniappHtml)}"></iframe>
					</div>
					<div class="campaign-miniapp-actions">
						<div class="campaign-miniapp-action-group">
							${isMiniappRegenerating ? '<div class="campaign-artifact-progress" aria-hidden="true"></div>' : ''}
							<button class="campaign-miniapp-action${isMiniappRegenerating ? ' is-cancelling' : ''}" type="button" data-campaign-miniapp-action="${isMiniappRegenerating ? 'cancel' : 'regenerate'}"${this.state.isWorkflowPending ? ' disabled' : ''}>${this.escapeHtml(isMiniappRegenerating ? (Lang.get('cancelButton') || Lang.get('cancel') || 'Cancel') : Lang.get('regenerateMessage'))}</button>
							<button class="campaign-miniapp-action" type="button" data-campaign-miniapp-action="save"${this.state.isWorkflowPending || isMiniappRegenerating || this.isSavingCampaignMiniapp ? ' disabled' : ''}>${this.escapeHtml(miniappSaveLabel)}</button>
						</div>
					</div>
				</div>
			`;
			const frame = preview.querySelector('.campaign-output-frame');
			void this.enableCampaignOutputEditing(frame, 'miniapp');
			return;
		}

		preview.innerHTML = `
			<div class="campaign-placeholder-copy">
				<strong>${current.title}</strong>
				<p>${current.body}</p>
			</div>
		`;
	}

	async enableCampaignOutputEditing(frame, outputType) {
		const normalizedType = String(outputType || '').trim().toLowerCase();
		if (!frame || !normalizedType) {
			return;
		}

		try {
			if (!window.PromptedPresentationWorkflow && this.workflowManager && typeof this.workflowManager.loadPromptedPresentationScript === 'function') {
				await this.workflowManager.loadPromptedPresentationScript();
			}

			if (!frame.isConnected || this.state.activeViewport !== normalizedType) {
				return;
			}

			const workflow = window.PromptedPresentationWorkflow;
			if (!workflow || typeof workflow.attachPromptableFrameImageClickHandler !== 'function') {
				return;
			}

			this.teardownCampaignOutputEditor();
			this.campaignOutputEditorFrame = frame;
			this.campaignOutputEditorType = normalizedType;
			const currentHtml = normalizedType === 'miniapp'
				? this.state.currentCampaign?.outputs?.miniappHtml
				: this.state.currentCampaign?.outputs?.presentationHtml;
			workflow.currentPresentationHtml = String(currentHtml || frame.getAttribute('srcdoc') || '');
			this.campaignOutputHtmlChangeHandler = (html, editedFrame) => {
				if (editedFrame !== this.campaignOutputEditorFrame) {
					return;
				}
				this.handleCampaignOutputHtmlMutated(normalizedType, html);
			};
			workflow.onPromptableHtmlMutated = this.campaignOutputHtmlChangeHandler;
			workflow.attachPromptableFrameImageClickHandler(frame);
		} catch (error) {
			console.error('CampaignTab: failed to enable promptable output editing', error);
		}
	}

	async enableCampaignPosterEditing(host) {
		if (!host) {
			return;
		}

		try {
			await this.ensureWorkflowManagerReady();

			if (this.workflowManager && typeof this.workflowManager.loadArtworkScripts === 'function') {
				await this.workflowManager.loadArtworkScripts();
			}
			if (this.workflowManager && typeof this.workflowManager.ensureArtworkEditorDependenciesLoaded === 'function') {
				await this.workflowManager.ensureArtworkEditorDependenciesLoaded();
			}

			if (!host.isConnected || this.state.activeViewport !== 'poster') {
				return;
			}

			const ArtworkCanvasRendererCtor = window.ArtworkCanvasRenderer
				|| (typeof ArtworkCanvasRenderer !== 'undefined' ? ArtworkCanvasRenderer : null);
			const CanvasInteractionHandlerCtor = window.CanvasInteractionHandler
				|| (typeof CanvasInteractionHandler !== 'undefined' ? CanvasInteractionHandler : null);

			if (!ArtworkCanvasRendererCtor || !CanvasInteractionHandlerCtor) {
				throw new Error('Campaign poster editor dependencies are unavailable');
			}

			const outputs = this.state.currentCampaign?.outputs || {};
			if (!outputs.posterOverlayData || !outputs.posterBackgroundImage) {
				return;
			}

			this.teardownCampaignPosterEditor();
			host.innerHTML = '<div class="campaign-poster-editor-canvas-wrap"><canvas class="campaign-poster-editor-canvas"></canvas></div>';
			const canvas = host.querySelector('.campaign-poster-editor-canvas');
			if (!canvas) {
				return;
			}

			const renderer = new ArtworkCanvasRendererCtor(canvas);
			this.campaignPosterEditorHost = host;
			this.campaignPosterCanvas = canvas;
			this.campaignPosterRenderer = renderer;
			await renderer.loadBackground(outputs.posterBackgroundImage);
			await renderer.loadOverlayData(this.cloneCampaignJson(outputs.posterOverlayData));
			renderer.setOnChange(() => {
				this.scheduleCampaignPosterStateSync();
				this.updateCampaignPosterActionState();
			});
			this.campaignPosterInteractionHandler = new CanvasInteractionHandlerCtor(renderer, canvas, () => {
				this.scheduleCampaignPosterStateSync();
				this.updateCampaignPosterActionState();
			});
			canvas.setAttribute('aria-label', Lang.get('campaignPosterView'));
			this.applyCampaignPosterZoom();
			canvas.focus();
			this.updateCampaignPosterActionState();
		} catch (error) {
			console.error('CampaignTab: failed to enable campaign poster editing', error);
			const preview = this.modalElement?.querySelector('#campaign-preview-placeholder');
			const posterPng = this.state.currentCampaign?.outputs?.posterPng || '';
			if (preview && posterPng && this.state.activeViewport === 'poster') {
				preview.innerHTML = `<img class="campaign-output-image" src="${this.escapeHtml(posterPng)}" alt="${this.escapeHtml(Lang.get('campaignPosterView'))}">`;
			}
		}
	}

	teardownCampaignOutputEditor() {
		const workflow = window.PromptedPresentationWorkflow;
		if (workflow && this.campaignOutputEditorFrame && workflow.promptableFrame === this.campaignOutputEditorFrame && typeof workflow.teardownPromptableFrameImageClickHandler === 'function') {
			workflow.teardownPromptableFrameImageClickHandler();
		}

		if (workflow && workflow.onPromptableHtmlMutated === this.campaignOutputHtmlChangeHandler) {
			workflow.onPromptableHtmlMutated = null;
		}

		this.campaignOutputEditorFrame = null;
		this.campaignOutputEditorType = '';
		this.campaignOutputHtmlChangeHandler = null;
	}

	teardownCampaignPosterEditor() {
		if (this.skipCampaignPosterStateSyncOnce) {
			this.skipCampaignPosterStateSyncOnce = false;
		} else {
			this.flushCampaignPosterStateSync();
		}

		this.campaignPosterEditorHost = null;
		this.campaignPosterCanvas = null;
		this.campaignPosterRenderer = null;
		this.campaignPosterInteractionHandler = null;
	}

	handleCampaignPosterAction(action) {
		if (action === 'regenerate') {
			void this.regenerateCampaignPoster();
			return;
		}

			if (action === 'cancel') {
				this.cancelArtifactRegeneration('poster');
				return;
			}

		if (action === 'save') {
			void this.saveCampaignPosterToDisk();
			return;
		}

		if (action === 'zoom-out') {
			this.adjustCampaignPosterZoom(-this.campaignPosterZoomStep);
			return;
		}

		if (action === 'zoom-in') {
			this.adjustCampaignPosterZoom(this.campaignPosterZoomStep);
			return;
		}

		const renderer = this.campaignPosterRenderer;
		if (!renderer) {
			return;
		}

		if (action === 'delete') {
			if (renderer.deleteSelectedTarget()) {
				this.scheduleCampaignPosterStateSync();
				this.updateCampaignPosterActionState();
			}
			return;
		}

		if (action === 'undo') {
			if (renderer.undoLastDeletion()) {
				this.scheduleCampaignPosterStateSync();
				this.updateCampaignPosterActionState();
			}
		}
	}

	updateCampaignPosterActionState() {
		if (!this.modalElement || this.state.activeViewport !== 'poster') {
			return;
		}

		const posterActions = this.modalElement.querySelector('[data-campaign-poster-actions="true"]');
		if (posterActions) {
			posterActions.innerHTML = this.getCampaignPosterActionMarkup();
		}

		const deleteButton = this.modalElement.querySelector('[data-campaign-poster-action="delete"]');
		const undoButton = this.modalElement.querySelector('[data-campaign-poster-action="undo"]');
		const renderer = this.campaignPosterRenderer;
		const hasSelection = !!renderer && (renderer.selectedBlockIndex >= 0 || !!renderer.selectedDecorationTarget);
		const canUndo = !!renderer && typeof renderer.canUndoAction === 'function' && renderer.canUndoAction();

		if (deleteButton) {
			deleteButton.disabled = !hasSelection;
		}

		if (undoButton) {
			undoButton.disabled = !canUndo;
		}
	}

	adjustCampaignPosterZoom(delta) {
		this.setCampaignPosterZoom(this.campaignPosterZoom + delta);
	}

	setCampaignPosterZoom(value) {
		const steppedZoom = Math.round(Number(value) / this.campaignPosterZoomStep) * this.campaignPosterZoomStep;
		const nextZoom = Math.min(this.campaignPosterMaxZoom, Math.max(this.campaignPosterMinZoom, steppedZoom));

		if (!Number.isFinite(nextZoom)) {
			return;
		}

		this.campaignPosterZoom = nextZoom;
		this.applyCampaignPosterZoom();
		this.updateCampaignPosterActionState();
	}

	applyCampaignPosterZoom() {
		if (!this.modalElement || this.state.activeViewport !== 'poster') {
			return;
		}

		const zoomLevel = Number(this.campaignPosterZoom) || 1;
		const editorStage = this.modalElement.querySelector('.campaign-poster-editor-stage');
		if (this.campaignPosterCanvas && editorStage) {
			const intrinsicWidth = Number(this.campaignPosterCanvas.width) || 0;
			const intrinsicHeight = Number(this.campaignPosterCanvas.height) || 0;
			const fitScale = this.getCampaignPosterFitScale(intrinsicWidth, intrinsicHeight, editorStage.clientWidth, editorStage.clientHeight);
			this.campaignPosterCanvas.style.width = `${Math.max(1, Math.round(intrinsicWidth * fitScale * zoomLevel))}px`;
			this.campaignPosterCanvas.style.height = `${Math.max(1, Math.round(intrinsicHeight * fitScale * zoomLevel))}px`;
			this.centerCampaignPosterScroll(editorStage);
		}

		const posterImage = this.modalElement.querySelector('.campaign-poster-image-wrap .campaign-output-image');
		const imageWrap = posterImage?.closest('.campaign-poster-image-wrap');
		if (posterImage && imageWrap) {
			const intrinsicWidth = Number(posterImage.naturalWidth) || 0;
			const intrinsicHeight = Number(posterImage.naturalHeight) || 0;
			const fitScale = this.getCampaignPosterFitScale(intrinsicWidth, intrinsicHeight, imageWrap.clientWidth, imageWrap.clientHeight);
			posterImage.style.width = `${Math.max(1, Math.round(intrinsicWidth * fitScale * zoomLevel))}px`;
			posterImage.style.height = `${Math.max(1, Math.round(intrinsicHeight * fitScale * zoomLevel))}px`;
			this.centerCampaignPosterScroll(imageWrap);
		}
	}

	getCampaignPosterFitScale(contentWidth, contentHeight, viewportWidth, viewportHeight) {
		const safeContentWidth = Math.max(1, Number(contentWidth) || 1);
		const safeContentHeight = Math.max(1, Number(contentHeight) || 1);
		const safeViewportWidth = Math.max(1, Number(viewportWidth) || 1);
		const safeViewportHeight = Math.max(1, Number(viewportHeight) || 1);
		return Math.min(safeViewportWidth / safeContentWidth, safeViewportHeight / safeContentHeight);
	}

	centerCampaignPosterScroll(container) {
		if (!container) {
			return;
		}

		window.requestAnimationFrame(() => {
			const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
			const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
			container.scrollLeft = Math.round(maxScrollLeft / 2);
			container.scrollTop = Math.round(maxScrollTop / 2);
		});
	}

	getCampaignPosterActionMarkup() {
		const posterRegeneration = this.getArtifactRegenerationState('poster');
		const isPosterRegenerating = posterRegeneration.isPending;
		const isPosterBusy = this.state.isWorkflowPending || this.isSavingCampaignPoster;
		const posterSaveLabel = this.isSavingCampaignPoster
			? Lang.get('campaignPosterRenderingButton')
			: Lang.get('saveToDiskButton');
		const zoomPercentage = `${Math.round((Number(this.campaignPosterZoom) || 1) * 100)}%`;
		const canZoomOut = (Number(this.campaignPosterZoom) || 1) > this.campaignPosterMinZoom;
		const canZoomIn = (Number(this.campaignPosterZoom) || 1) < this.campaignPosterMaxZoom;

		return `
			<div class="campaign-poster-zoom-controls" aria-label="Poster zoom controls">
				<button class="campaign-poster-zoom-button" type="button" data-campaign-poster-action="zoom-out" aria-label="Zoom out" title="Zoom out"${canZoomOut ? '' : ' disabled'}>-</button>
				<span class="campaign-poster-zoom-level">${this.escapeHtml(zoomPercentage)}</span>
				<button class="campaign-poster-zoom-button" type="button" data-campaign-poster-action="zoom-in" aria-label="Zoom in" title="Zoom in"${canZoomIn ? '' : ' disabled'}>+</button>
			</div>
			<div class="campaign-poster-action-group">
				${isPosterRegenerating ? '<div class="campaign-artifact-progress" aria-hidden="true"></div>' : ''}
				<button class="campaign-poster-action${isPosterRegenerating ? ' is-cancelling' : ''}" type="button" data-campaign-poster-action="${isPosterRegenerating ? 'cancel' : 'regenerate'}"${isPosterBusy ? ' disabled' : ''}>${this.escapeHtml(isPosterRegenerating ? (Lang.get('cancelButton') || Lang.get('cancel') || 'Cancel') : Lang.get('regenerateMessage'))}</button>
				<button class="campaign-poster-action" type="button" data-campaign-poster-action="save"${isPosterBusy || isPosterRegenerating ? ' disabled' : ''}>${this.escapeHtml(posterSaveLabel)}</button>
			</div>
		`;
	}

	async regenerateCampaignPoster() {
		if (this.state.isWorkflowPending || this.getArtifactRegenerationState('poster').isPending) {
			return;
		}

		const payload = this.buildWorkflowPayload('generate');
		if (!String(payload?.model?.value || '').trim()) {
			this.setFooterStatus(Lang.get('noModelSelected'));
			return;
		}

		const posterImages = this.getPosterRegenerationImages(payload);
		if (!posterImages.length) {
			this.setFooterStatus(Lang.get('campaignPosterImageRequired'));
			return;
		}

		const abortController = this.beginArtifactRegeneration('poster');
		if (this.state.activeViewport === 'poster') {
			this.updateCampaignPosterActionState();
		} else {
			this.renderViewport();
		}
		this.setFooterStatus(
			Lang.get('campaignArtifactQueuedStatus')
				.replace('{action}', Lang.get('regenerateMessage'))
				.replace('{target}', this.getCampaignTargetLabel('poster'))
		);

		try {
			await this.handleArtifactRequested({
				target: 'poster',
				action: 'generate',
				reason: 'Regenerate only the poster using the latest poster brief section, campaign brief, palette guidance, and the latest available poster image source (prefer a newly uploaded image, otherwise reuse the current poster background image).',
				model: payload.model,
				campaign: payload.campaign,
				prompt: payload.prompt || '',
				images: posterImages,
				signal: abortController?.signal || null
			});
		} finally {
			this.finishArtifactRegeneration('poster');
			if (this.state.activeViewport === 'poster') {
				this.updateCampaignPosterActionState();
			} else {
				this.renderViewport();
			}
		}
	}

	getPosterRegenerationImages(payload) {
		const uploadedImages = Array.isArray(payload?.images)
			? payload.images.filter(image => image?.dataUrl)
			: [];
		if (uploadedImages.length) {
			return uploadedImages;
		}

		const currentPosterBackgroundImage = String(
			payload?.campaign?.outputs?.poster_background_image
			|| this.state.currentCampaign?.outputs?.posterBackgroundImage
			|| ''
		).trim();
		if (!currentPosterBackgroundImage) {
			return [];
		}

		return [{
			id: 'campaign-poster-existing-background',
			name: 'campaign-poster-current-background.png',
			mimeType: this.getCampaignImageMimeType(currentPosterBackgroundImage),
			dataUrl: currentPosterBackgroundImage
		}];
	}

	getCampaignImageMimeType(dataUrl) {
		const match = String(dataUrl || '').match(/^data:([^;,]+)[;,]/i);
		return match?.[1] || 'image/png';
	}

	async saveCampaignPosterToDisk() {
		if (this.isSavingCampaignPoster) {
			return;
		}

		this.isSavingCampaignPoster = true;
		if (this.state.activeViewport === 'poster') {
			this.updateCampaignPosterActionState();
		} else {
			this.renderViewport();
		}

		try {
			await this.waitForCampaignActionPaint();
			this.flushCampaignPosterStateSync();
			const renderer = this.campaignPosterRenderer;
			const posterPng = renderer && typeof renderer.exportPNG === 'function'
				? renderer.exportPNG(1)
				: String(this.state.currentCampaign?.outputs?.posterPng || '').trim();
			if (!posterPng) {
				return;
			}

			const fileName = `${this.sanitizeCampaignFileName(this.state.currentCampaign.name || this.state.currentCampaign.brief.title || Lang.get('campaignPosterView'))}-poster.png`;
			this.downloadCampaignPng(posterPng, fileName);
		} finally {
			this.isSavingCampaignPoster = false;
			if (this.state.activeViewport === 'poster') {
				this.updateCampaignPosterActionState();
			} else {
				this.renderViewport();
			}
		}
	}

	waitForCampaignActionPaint() {
		return new Promise(resolve => {
			window.requestAnimationFrame(() => {
				window.requestAnimationFrame(resolve);
			});
		});
	}

	scheduleCampaignPosterStateSync() {
		if (this.campaignPosterSyncTimer) {
			window.clearTimeout(this.campaignPosterSyncTimer);
		}

		this.campaignPosterSyncTimer = window.setTimeout(() => {
			this.campaignPosterSyncTimer = null;
			this.syncCampaignPosterStateFromCanvas();
		}, 120);
	}

	flushCampaignPosterStateSync() {
		if (this.campaignPosterSyncTimer) {
			window.clearTimeout(this.campaignPosterSyncTimer);
			this.campaignPosterSyncTimer = null;
		}

		this.syncCampaignPosterStateFromCanvas();
	}

	syncCampaignPosterStateFromCanvas() {
		const renderer = this.campaignPosterRenderer;
		if (!renderer) {
			return;
		}

		const nextOverlayData = this.buildCampaignPosterOverlayData(renderer, this.state.currentCampaign?.outputs?.posterOverlayData);
		const nextPosterPng = typeof renderer.exportPNG === 'function' ? renderer.exportPNG(1) : '';
		if (!nextOverlayData || !nextPosterPng) {
			return;
		}

		this.state.currentCampaign.outputs.posterOverlayData = nextOverlayData;
		this.state.currentCampaign.outputs.posterPng = nextPosterPng;
		this.hasManualOutputEdits = true;
		this.state.currentCampaign.updatedAt = new Date().toISOString();
	}

	buildCampaignPosterOverlayData(renderer, sourceOverlayData) {
		if (!renderer) {
			return null;
		}

		const overlayData = this.cloneCampaignJson(sourceOverlayData) || { overlay: {} };
		const overlay = overlayData.overlay || (overlayData.overlay = {});
		const existingTexts = Array.isArray(overlay.texts) ? overlay.texts : [];
		const existingTextsById = new Map();

		existingTexts.forEach((text, index) => {
			if (text && text.id !== undefined && text.id !== null) {
				existingTextsById.set(String(text.id), text);
			} else {
				existingTextsById.set(`index:${index}`, text);
			}
		});

		overlay.width = renderer.canvas?.width || overlay.width || 0;
		overlay.height = renderer.canvas?.height || overlay.height || 0;
		overlay.texts = renderer.textBlocks.map((block, index) => {
			const existingText = block.id !== undefined && block.id !== null
				? existingTextsById.get(String(block.id))
				: existingTextsById.get(`index:${index}`);
			const serializedText = existingText && typeof existingText === 'object'
				? { ...existingText }
				: {};

			serializedText.id = block.id ?? serializedText.id ?? null;
			serializedText.text = block.text ?? '';
			serializedText.x = this.asCampaignNumber(block.x, 0);
			serializedText.y = this.asCampaignNumber(block.y, 0);
			serializedText.fontSize = this.asCampaignNumber(block.fontSize, 16);
			serializedText.fontFamily = block.fontFamily || serializedText.fontFamily || 'Arial';
			serializedText.fontWeight = block.fontWeight || serializedText.fontWeight || 'normal';
			serializedText.fontStyle = block.fontStyle || serializedText.fontStyle || 'normal';
			serializedText.textAlign = block.textAlign || serializedText.textAlign || 'left';
			serializedText.color = block.fillStyle || serializedText.color || '#FFFFFF';
			serializedText.rotation = this.asCampaignNumber(block.rotation, 0);
			serializedText.opacity = block.opacity !== undefined ? this.asCampaignNumber(block.opacity, 1) : (serializedText.opacity ?? 1);
			serializedText.lineHeight = block.lineHeight !== undefined ? this.asCampaignNumber(block.lineHeight, 1.3) : (serializedText.lineHeight ?? 1.3);
			serializedText.maxWidth = block.maxWidth !== undefined ? this.asCampaignNumber(block.maxWidth, 0) : (serializedText.maxWidth ?? 0);
			serializedText.letterSpacing = block.letterSpacing !== undefined ? this.asCampaignNumber(block.letterSpacing, 0) : (serializedText.letterSpacing ?? 0);
			serializedText.backgroundColor = block.backgroundColor !== undefined ? block.backgroundColor : (serializedText.backgroundColor ?? null);
			serializedText.backgroundPadding = block.backgroundPadding !== undefined ? block.backgroundPadding : (serializedText.backgroundPadding ?? '8px 12px');
			serializedText.shadow = block.shadow !== undefined ? block.shadow : serializedText.shadow;
			serializedText.overlaySource = true;
			if (block.fontRef !== undefined || serializedText.fontRef !== undefined) {
				serializedText.fontRef = block.fontRef ?? serializedText.fontRef ?? null;
			}
			if (block.fontUrl !== undefined || serializedText.fontUrl !== undefined) {
				serializedText.fontUrl = block.fontUrl ?? serializedText.fontUrl ?? null;
			}
			if (block.googleFont !== undefined || serializedText.googleFont !== undefined) {
				serializedText.googleFont = block.googleFont ?? serializedText.googleFont ?? null;
			}
			if (block.googleFontUrl !== undefined || serializedText.googleFontUrl !== undefined) {
				serializedText.googleFontUrl = block.googleFontUrl ?? serializedText.googleFontUrl ?? null;
			}
			if (block.fontProvider !== undefined || serializedText.fontProvider !== undefined) {
				serializedText.fontProvider = block.fontProvider ?? serializedText.fontProvider ?? null;
			}

			return serializedText;
		});

		overlay.ornaments = Array.isArray(renderer.ornaments)
			? this.cloneCampaignJson(renderer.ornaments)
			: [];
		delete overlay.shapes;
		delete overlay.lines;

		return overlayData;
	}

	cloneCampaignJson(value) {
		if (value === null || value === undefined) {
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

	asCampaignNumber(value, fallback) {
		const numericValue = Number(value);
		return Number.isFinite(numericValue) ? numericValue : fallback;
	}

	handleCampaignOutputHtmlMutated(outputType, html) {
		const nextHtml = String(html || '').trim();
		if (!nextHtml) {
			return;
		}

		if (outputType === 'miniapp') {
			this.state.currentCampaign.outputs.miniappHtml = nextHtml;
		} else {
			this.state.currentCampaign.outputs.presentationHtml = nextHtml;
		}
		this.hasManualOutputEdits = true;
		this.state.currentCampaign.updatedAt = new Date().toISOString();
	}

	handleCampaignPresentationAction(action) {
		if (action === 'regenerate') {
			void this.regenerateCampaignPresentation();
			return;
		}

		if (action === 'cancel') {
			this.cancelArtifactRegeneration('presentation');
			return;
		}

		if (action === 'save') {
			this.saveCampaignPresentationToDisk();
		}
	}

	handleCampaignMiniappAction(action) {
		if (action === 'regenerate') {
			void this.regenerateCampaignMiniapp();
			return;
		}

		if (action === 'cancel') {
			this.cancelArtifactRegeneration('miniapp');
			return;
		}

		if (action === 'save') {
			this.saveCampaignMiniappToDisk();
		}
	}

	getArtifactRegenerationState(target) {
		const normalizedTarget = String(target || '').trim().toLowerCase();
		const registry = this.state.artifactRegeneration || {};
		return registry[normalizedTarget] || { isPending: false, abortController: null };
	}

	beginArtifactRegeneration(target) {
		const normalizedTarget = String(target || '').trim().toLowerCase();
		if (!normalizedTarget || !this.state.artifactRegeneration?.[normalizedTarget]) {
			return null;
		}

		const abortController = new AbortController();
		this.state.artifactRegeneration[normalizedTarget] = {
			isPending: true,
			abortController
		};
		return abortController;
	}

	finishArtifactRegeneration(target) {
		const normalizedTarget = String(target || '').trim().toLowerCase();
		if (!normalizedTarget || !this.state.artifactRegeneration?.[normalizedTarget]) {
			return;
		}

		this.state.artifactRegeneration[normalizedTarget] = {
			isPending: false,
			abortController: null
		};
	}

	cancelArtifactRegeneration(target) {
		const normalizedTarget = String(target || '').trim().toLowerCase();
		const regenerationState = this.getArtifactRegenerationState(normalizedTarget);
		if (!regenerationState.isPending || !regenerationState.abortController) {
			return;
		}

		regenerationState.abortController.abort();
		this.setFooterStatus(Lang.get('campaignWorkflowCancellingStatus'));
		if (normalizedTarget === 'poster' && this.state.activeViewport === 'poster') {
			this.updateCampaignPosterActionState();
			return;
		}

		this.renderViewport();
	}

	async regenerateCampaignPresentation() {
		if (this.state.isWorkflowPending || this.getArtifactRegenerationState('presentation').isPending) {
			return;
		}

		const payload = this.buildWorkflowPayload('generate');
		if (!String(payload?.model?.value || '').trim()) {
			this.setFooterStatus(Lang.get('noModelSelected'));
			return;
		}

		const abortController = this.beginArtifactRegeneration('presentation');
		this.renderViewport();
		this.setFooterStatus(
			Lang.get('campaignArtifactQueuedStatus')
				.replace('{action}', Lang.get('regenerateMessage'))
				.replace('{target}', this.getCampaignTargetLabel('presentation'))
		);

		try {
			await this.handleArtifactRequested({
				target: 'presentation',
				action: 'generate',
				reason: 'Regenerate only the presentation using the latest campaign brief, palette guidance, and current campaign context.',
				model: payload.model,
				campaign: payload.campaign,
				prompt: payload.prompt || '',
				images: Array.isArray(payload.images) ? payload.images : [],
				signal: abortController?.signal || null
			});
		} finally {
			this.finishArtifactRegeneration('presentation');
			this.renderViewport();
		}
	}

	async saveCampaignPresentationToDisk() {
		if (this.isSavingCampaignPresentation) {
			return;
		}

		const presentationHtml = String(this.state.currentCampaign?.outputs?.presentationHtml || '').trim();
		if (!presentationHtml) {
			return;
		}

		this.isSavingCampaignPresentation = true;
		this.renderViewport();

		try {
			await this.waitForCampaignActionPaint();
			const fileName = `${this.sanitizeCampaignFileName(this.state.currentCampaign.name || this.state.currentCampaign.brief.title || Lang.get('campaignPresentationView'))}-presentation.html`;
			this.logCampaignExportDiagnostics('presentation source', presentationHtml);
			const exportHtml = await this.buildCampaignExportHtml(presentationHtml);
			this.logCampaignExportDiagnostics('presentation export', exportHtml || presentationHtml);
			this.downloadCampaignTextFile(exportHtml || presentationHtml, fileName, 'text/html;charset=utf-8');
		} finally {
			this.isSavingCampaignPresentation = false;
			this.renderViewport();
		}
	}

	async regenerateCampaignMiniapp() {
		if (this.state.isWorkflowPending || this.getArtifactRegenerationState('miniapp').isPending) {
			return;
		}

		const payload = this.buildWorkflowPayload('generate');
		if (!String(payload?.model?.value || '').trim()) {
			this.setFooterStatus(Lang.get('noModelSelected'));
			return;
		}

		const abortController = this.beginArtifactRegeneration('miniapp');
		this.renderViewport();
		this.setFooterStatus(
			Lang.get('campaignArtifactQueuedStatus')
				.replace('{action}', Lang.get('regenerateMessage'))
				.replace('{target}', this.getCampaignTargetLabel('miniapp'))
		);

		try {
			await this.handleArtifactRequested({
				target: 'miniapp',
				action: 'generate',
				reason: 'Regenerate only the mini app using the latest campaign brief, palette guidance, and current campaign context.',
				model: payload.model,
				campaign: payload.campaign,
				prompt: payload.prompt || '',
				images: Array.isArray(payload.images) ? payload.images : [],
				signal: abortController?.signal || null
			});
		} finally {
			this.finishArtifactRegeneration('miniapp');
			this.renderViewport();
		}
	}

	async saveCampaignMiniappToDisk() {
		if (this.isSavingCampaignMiniapp) {
			return;
		}

		const miniappHtml = String(this.state.currentCampaign?.outputs?.miniappHtml || '').trim();
		if (!miniappHtml) {
			return;
		}

		this.isSavingCampaignMiniapp = true;
		this.renderViewport();

		try {
			await this.waitForCampaignActionPaint();
			const fileName = `${this.sanitizeCampaignFileName(this.state.currentCampaign.name || this.state.currentCampaign.brief.title || Lang.get('campaignMiniAppView'))}-miniapp.html`;
			this.logCampaignExportDiagnostics('miniapp source', miniappHtml);
			const exportHtml = await this.buildCampaignExportHtml(miniappHtml);
			this.logCampaignExportDiagnostics('miniapp export', exportHtml || miniappHtml);
			this.downloadCampaignTextFile(exportHtml || miniappHtml, fileName, 'text/html;charset=utf-8');
		} finally {
			this.isSavingCampaignMiniapp = false;
			this.renderViewport();
		}
	}

	async buildCampaignExportHtml(html) {
		const htmlContent = String(html || '').trim();
		if (!htmlContent) {
			return '';
		}

		const workflow = window.PromptedPresentationWorkflow;
		if (!workflow || typeof workflow.buildStandalonePromptableHtml !== 'function') {
			//console.log('CampaignTab: using local scrubber fallback for export');
			return this.stripCampaignPromptableEditingMarkup(htmlContent);
		}

		try {
			const standaloneHtml = await workflow.buildStandalonePromptableHtml(htmlContent, null, { includeEditorShell: false });
			return this.stripCampaignPromptableEditingMarkup(standaloneHtml || htmlContent);
		} catch (error) {
			console.warn('CampaignTab: failed to build non-editable export HTML, falling back to current HTML', error);
			return this.stripCampaignPromptableEditingMarkup(htmlContent);
		}
	}

	logCampaignExportDiagnostics(label, html) {
		const htmlContent = String(html || '');
		const diagnostics = {
			label,
			length: htmlContent.length,
			hasContenteditable: /contenteditable\s*=\s*["']?true/i.test(htmlContent),
			editableTextMarkers: (htmlContent.match(/data-pw-editable-text/gi) || []).length,
			editableMarkers: (htmlContent.match(/data-pw-editable=/gi) || []).length,
			imageSelectedMarkers: (htmlContent.match(/data-pw-image-selected/gi) || []).length,
			promptableTextStyles: (htmlContent.match(/pw-promptable-text-edit-style/gi) || []).length,
			promptableImageStyles: (htmlContent.match(/pw-promptable-image-edit-style/gi) || []).length,
			standaloneToolbarNodes: (htmlContent.match(/pw-standalone-editor-toolbar/gi) || []).length
		};
		//console.log('CampaignTab: export diagnostics', diagnostics);
	}

	stripCampaignPromptableEditingMarkup(html) {
		const htmlContent = String(html || '').trim();
		if (!htmlContent) {
			return '';
		}

		try {
			const parser = new DOMParser();
			const documentRef = parser.parseFromString(htmlContent, 'text/html');
			if (!documentRef) {
				return htmlContent;
			}

			Array.from(documentRef.querySelectorAll('#pw-standalone-editor-toolbar, #pw-standalone-editor-image-input, #pw-standalone-editor-style, #pw-standalone-editor-script, #pw-promptable-text-edit-style, #pw-promptable-image-edit-style')).forEach(node => node.remove());

			Array.from(documentRef.querySelectorAll('[contenteditable], [spellcheck], [data-pw-editable], [data-pw-editable-text], [data-pw-image-selected]')).forEach(node => {
				node.removeAttribute('contenteditable');
				node.removeAttribute('spellcheck');
				node.removeAttribute('data-pw-editable');
				node.removeAttribute('data-pw-editable-text');
				node.removeAttribute('data-pw-image-selected');
			});

			if (documentRef.body) {
				documentRef.body.classList.remove('pw-standalone-editing');
			}
			if (documentRef.documentElement) {
				documentRef.documentElement.classList.remove('pw-standalone-editing');
			}

			return `<!DOCTYPE html>\n${documentRef.documentElement.outerHTML}`;
		} catch (error) {
			console.warn('CampaignTab: failed to strip promptable editing markup from export HTML', error);
			return htmlContent;
		}
	}

	openStudio() {
		this.modalElement?.classList.add('is-open');
		this.updateModalContent();
	}

	closeStudio() {
		if (this.state.workflowProgress?.isOpen) {
			return;
		}
		this.teardownCampaignOutputEditor();
		this.teardownCampaignPosterEditor();
		this.modalElement?.classList.remove('is-open');
	}

	setActiveViewport(viewport) {
		this.state.activeViewport = viewport;
		this.renderViewSwitcher();
		this.renderViewport();
	}

	handleAction(action) {
		if (action === 'save') {
			this.saveCurrentCampaign();
			return;
		}

		if (action === 'generate' && !this.state.imageRegistry.length) {
			const message = Lang.get('campaignPosterImageRequired');
				this.showWarning(message);
			return;
		}

		const payload = this.buildWorkflowPayload(action);
		this.state.isWorkflowPending = action === 'generate';

		window.dispatchEvent(new CustomEvent('campaign:workflow-requested', {
			detail: {
				action,
				payload
			}
		}));

		window.dispatchEvent(new CustomEvent('campaign:action-requested', {
			detail: {
				action,
				state: this.state,
				payload
			}
		}));

		const footerStatus = this.modalElement?.querySelector('#campaign-footer-status');
		if (footerStatus) {
			footerStatus.textContent = Lang.get('campaignActionQueued').replace('{action}', Lang.get(`campaignActionLabel_${action}`));
		}

		this.updatePromptComposerState();
		this.updateModalContent();
	}

	sortArtifactRequestsForStagedFeedback(requests) {
		const stageOrder = {
			presentation: 0,
			miniapp: 1,
			poster: 2
		};

		return [...(Array.isArray(requests) ? requests : [])].sort((left, right) => {
			const leftTarget = String(left?.target || '').trim().toLowerCase();
			const rightTarget = String(right?.target || '').trim().toLowerCase();
			return (stageOrder[leftTarget] ?? 99) - (stageOrder[rightTarget] ?? 99);
		});
	}

	openWorkflowProgress(action, requests) {
		const queue = this.sortArtifactRequestsForStagedFeedback(requests);
		this.state.workflowProgress = {
			isOpen: queue.length > 0,
			action: String(action || '').trim().toLowerCase(),
			currentTarget: '',
			currentStageIndex: -1,
			completedStageCount: 0,
			totalStages: queue.length,
			targets: queue.map(request => String(request?.target || '').trim().toLowerCase()).filter(Boolean),
			statusMessage: queue.length ? Lang.get('campaignWorkflowPreparingStatus') : '',
			abortController: queue.length ? new AbortController() : null,
			isCancelling: false
		};
		this.renderWorkflowProgress();
		return this.state.workflowProgress.abortController;
	}

	updateWorkflowProgress(nextState = {}) {
		this.state.workflowProgress = {
			...this.createWorkflowProgressState(),
			...(this.state.workflowProgress || {}),
			...nextState
		};
		this.renderWorkflowProgress();
	}

	hideWorkflowProgress() {
		this.state.workflowProgress = this.createWorkflowProgressState();
		this.renderWorkflowProgress();
	}

	renderWorkflowProgress() {
		const overlay = this.modalElement?.querySelector('#campaign-workflow-progress');
		if (!overlay) {
			return;
		}

		const progress = this.state.workflowProgress || this.createWorkflowProgressState();
		overlay.classList.toggle('is-open', !!progress.isOpen);
		overlay.classList.toggle('is-cancelling', !!progress.isCancelling);
		overlay.classList.toggle('is-failed', !!progress.isFailed);
		overlay.setAttribute('aria-hidden', progress.isOpen ? 'false' : 'true');

		const setText = (selector, value) => {
			const element = this.modalElement?.querySelector(selector);
			if (element) {
				element.textContent = value || '';
			}
		};

		if (!progress.isOpen) {
			setText('#campaign-progress-eyebrow', '');
			setText('#campaign-progress-title', '');
			setText('#campaign-progress-body', '');
			const steps = this.modalElement?.querySelector('#campaign-progress-steps');
			if (steps) {
				steps.innerHTML = '';
			}
			return;
		}

		const currentStep = Math.max(progress.currentStageIndex + 1, 1);
		setText('#campaign-progress-eyebrow', Lang.get('campaignWorkflowBlockingTitle'));
		setText(
			'#campaign-progress-title',
			progress.isFailed
				? this.buildWorkflowErrorStatus(progress.failedTarget || progress.currentTarget)
				: Lang.get('campaignWorkflowRunningTitle')
					.replace('{current}', String(Math.min(currentStep, Math.max(progress.totalStages, 1))))
					.replace('{total}', String(Math.max(progress.totalStages, 1)))
		);
		setText('#campaign-progress-body', progress.statusMessage || this.buildWorkflowProgressStatus(progress));

		const cancelButton = this.modalElement?.querySelector('#campaign-progress-cancel');
		if (cancelButton) {
			cancelButton.disabled = !!progress.isCancelling;
			cancelButton.textContent = progress.isFailed
				? (Lang.get('closeButton') || 'Close')
				: Lang.get('campaignWorkflowCancelButton');
		}

		const steps = this.modalElement?.querySelector('#campaign-progress-steps');
		if (!steps) {
			return;
		}

		steps.innerHTML = progress.targets.map((target, index) => {
			const isComplete = index < progress.completedStageCount;
			const isActive = progress.currentStageIndex === index && !progress.isCancelling;
			const isError = progress.isFailed && progress.currentStageIndex === index;
			const classes = [
				'campaign-progress-step',
				isComplete ? 'is-complete' : '',
				isActive ? 'is-active' : '',
				isError ? 'is-error' : ''
			].filter(Boolean).join(' ');
			return `
				<div class="${classes}">
					<span class="campaign-progress-step-label">${this.escapeHtml(this.getCampaignTargetLabel(target))}</span>
				</div>
			`;
		}).join('');
	}

	buildWorkflowProgressStatus(progress) {
		if (progress.isCancelling) {
			return Lang.get('campaignWorkflowCancellingStatus');
		}

		if (progress.isFailed) {
			return progress.failureDetail || this.buildWorkflowErrorStatus(progress.failedTarget || progress.currentTarget);
		}

		if (!progress.currentTarget) {
			return Lang.get('campaignWorkflowPreparingStatus');
		}

		return Lang.get('campaignWorkflowRunningStatus')
			.replace('{target}', this.getCampaignTargetLabel(progress.currentTarget))
			.replace('{current}', String(Math.max(progress.currentStageIndex + 1, 1)))
			.replace('{total}', String(Math.max(progress.totalStages, 1)));
	}

	buildWorkflowErrorStatus(target) {
		return Lang.get('campaignWorkflowErrorCreatingStatus')
			.replace('{target}', this.getCampaignTargetLabel(target || ''));
	}

	cancelActiveWorkflowSequence() {
		const progress = this.state.workflowProgress;
		if (!progress?.isOpen || progress.isCancelling) {
			return;
		}

		this.updateWorkflowProgress({
			isCancelling: true,
			isFailed: false,
			statusMessage: Lang.get('campaignWorkflowCancellingStatus')
		});

		if (progress.abortController) {
			progress.abortController.abort();
		}

		if (this.workflowManager && typeof this.workflowManager.cancelActiveArtifact === 'function') {
			this.workflowManager.cancelActiveArtifact(progress.currentTarget);
		}

		this.setFooterStatus(Lang.get('campaignWorkflowCancellingStatus'));
	}

	cancelPendingWorkflowRequest() {
		const pending = this.state.pendingWorkflow;
		if (!pending || pending.action !== 'discuss') {
			return;
		}

		const abortController = pending.abortController || pending.payload?.abortController;
		if (abortController && !abortController.signal?.aborted) {
			abortController.abort();
		}

		this.setFooterStatus(Lang.get('campaignWorkflowCancellingStatus'));
	}

	isWorkflowExecutionAction(action) {
		return action === 'generate';
	}

	updatePromptComposerState() {
		const promptInput = this.modalElement?.querySelector('#campaign-prompt-input');
		const sendButton = this.modalElement?.querySelector('#campaign-send-button');
		if (promptInput) {
			promptInput.disabled = this.state.isWorkflowPending && this.state.pendingWorkflow?.action !== 'discuss';
		}
		if (!sendButton) {
			return;
		}

		if (this.state.isWorkflowPending && this.state.pendingWorkflow?.action === 'discuss') {
			sendButton.disabled = false;
			const sendText = sendButton.querySelector('.campaign-send-text');
			if (sendText) {
				sendText.textContent = Lang.get('cancelButton') || 'Cancel';
			} else {
				sendButton.textContent = Lang.get('cancelButton') || 'Cancel';
			}
			sendButton.classList.add('cancel-state');
			sendButton.classList.add('is-loading');
		} else {
			sendButton.disabled = !String(this.state.draftPrompt || '').trim() || this.state.isWorkflowPending;
			const sendText = sendButton.querySelector('.campaign-send-text');
			if (sendText) {
				sendText.textContent = Lang.get('sendButton') || 'Send';
			} else {
				sendButton.textContent = Lang.get('sendButton') || 'Send';
			}
			sendButton.classList.remove('cancel-state');
			sendButton.classList.remove('is-loading');
		}
	}

	hasCampaignContent() {
		const brief = this.state.currentCampaign?.brief || {};
		const outputs = this.state.currentCampaign?.outputs || {};
		const keyPoints = Array.isArray(brief.keyPoints) ? brief.keyPoints : [];
		return Boolean(
			String(brief.title || '').trim()
			|| String(brief.coreMessage || '').trim()
			|| String(brief.audience || '').trim()
			|| String(brief.tone || '').trim()
			|| keyPoints.length
			|| String(outputs.presentationHtml || '').trim()
			|| String(outputs.miniappHtml || '').trim()
			|| outputs.posterPng
		);
	}

	submitPromptMessage() {
		const prompt = String(this.state.draftPrompt || '').trim();
		if (!prompt) {
			return;
		}

		const payload = this.buildWorkflowPayload('discuss');
        const abortController = new AbortController();
        payload.abortController = abortController;
        payload.abortSignal = abortController.signal;

        this.appendChatMessage('user', prompt);
        this.state.isWorkflowPending = true;
        this.state.pendingWorkflow = {
            action: 'discuss',
            requestedAt: new Date().toISOString(),
            payload,
            abortController
        };
		window.dispatchEvent(new CustomEvent('campaign:workflow-requested', {
			detail: {
				action: 'discuss',
				payload
			}
		}));

		this.state.draftPrompt = '';
		this.updatePromptComposerState();
		this.updateModalContent();
	}

	async handleWorkflowRequested(detail) {
		await this.ensureWorkflowManagerReady();
		const action = detail.action || '';
		const payload = detail.payload || this.buildWorkflowPayload(action);
		const isWorkflowExecutionAction = this.isWorkflowExecutionAction(action);

		let abortController = null;
		if (action === 'discuss') {
			abortController = payload.abortController instanceof AbortController ? payload.abortController : new AbortController();
			if (!payload.abortSignal) {
				payload.abortSignal = abortController.signal;
			}
			payload.abortController = abortController;
		}

		this.state.pendingWorkflow = {
			action,
			requestedAt: new Date().toISOString(),
			payload,
			abortController
		};

		const modelLabel = payload?.model?.label || Lang.get('campaignModelUnknown');
		if (isWorkflowExecutionAction) {
			this.setFooterStatus(
				Lang.get('campaignWorkflowQueuedStatus')
					.replace('{action}', Lang.get(`campaignActionLabel_${action}`))
					.replace('{model}', modelLabel)
			);
		}

		const response = this.workflowManager && typeof this.workflowManager.runWorkflow === 'function'
			? (isWorkflowExecutionAction && typeof this.workflowManager.buildExecutionResponse === 'function'
				? await this.workflowManager.buildExecutionResponse(action, payload)
				: await this.workflowManager.runWorkflow(action, payload))
			: {
				chatMessage: Lang.get('campaignOrchestratorUnavailable'),
				statusMessage: Lang.get('campaignOrchestratorUnavailable')
			};

		window.dispatchEvent(new CustomEvent('campaign:workflow-response', {
			detail: response || {}
		}));

		if (isWorkflowExecutionAction && response?.workflow) {

			window.dispatchEvent(new CustomEvent('campaign:workflow-planned', {
				detail: {
					action,
					workflow: response.workflow,
					artifactRequests: Array.isArray(response.artifactRequests) ? response.artifactRequests : []
				}
			}));

			const sequenceResult = await this.runArtifactSequence(response.artifactRequests || []);
			this.finishPendingWorkflow({ preserveProgress: !!sequenceResult?.failed });
			return;
		}

		if (isWorkflowExecutionAction) {
			this.finishPendingWorkflow();
		}
	}

	handleWorkflowResponse(detail) {
		if (detail.campaign_brief) {
			this.state.currentCampaign.brief = this.mergeBriefFromWorkflow(detail.campaign_brief);
		}

		if (Array.isArray(detail.palette)) {
			this.state.currentCampaign.palette = [...detail.palette];
		}

		if (detail.outputs && typeof detail.outputs === 'object') {
			if (target === 'poster'
				&& (detail.outputs.poster_png || detail.outputs.posterPng || detail.outputs.poster_overlay_data || detail.outputs.posterOverlayData)) {
				this.skipCampaignPosterStateSyncOnce = true;
			}

			this.state.currentCampaign.outputs = {
				posterPng: detail.outputs.poster_png || detail.outputs.posterPng || this.state.currentCampaign.outputs.posterPng || '',
				posterOverlayData: detail.outputs.poster_overlay_data || detail.outputs.posterOverlayData || this.cloneCampaignJson(this.state.currentCampaign.outputs.posterOverlayData) || null,
				posterBackgroundImage: detail.outputs.poster_background_image || detail.outputs.posterBackgroundImage || this.state.currentCampaign.outputs.posterBackgroundImage || '',
				presentationHtml: detail.outputs.presentation_html || detail.outputs.presentationHtml || this.state.currentCampaign.outputs.presentationHtml || '',
				miniappHtml: detail.outputs.miniapp_html || detail.outputs.miniappHtml || this.state.currentCampaign.outputs.miniappHtml || ''
			};
		}

		const assistantMessage = typeof detail.chatMessage === 'string' ? detail.chatMessage.trim() : '';

		if (typeof detail.statusMessage === 'string' && detail.statusMessage.trim()) {
			this.setFooterStatus(detail.statusMessage.trim());
		} else {
			this.setFooterStatus(Lang.get('campaignWorkflowAppliedStatus'));
		}

		this.renderViewport();

		if (assistantMessage) {
			void this.animateChatMessage('assistant', assistantMessage).finally(() => {
				if (!this.isWorkflowExecutionAction(this.state.pendingWorkflow?.action || '')) {
					this.finishPendingWorkflow();
				}
			});
			return;
		}

		if (!this.isWorkflowExecutionAction(this.state.pendingWorkflow?.action || '')) {
			this.finishPendingWorkflow();
		}
	}

	handleWorkflowPlanned(detail) {
		if (!this.state.pendingWorkflow) {
			return;
		}

		this.state.pendingWorkflow.plan = detail.workflow || null;
		const requestedTargets = Array.isArray(detail.workflow?.targets) ? detail.workflow.targets : [];
		if (!requestedTargets.length) {
			return;
		}

		this.setFooterStatus(Lang.get('campaignWorkflowPlanMessage').replace('{targets}', requestedTargets.join(', ')));
	}

	async handleArtifactRequested(detail) {
		await this.ensureWorkflowManagerReady();
		const target = String(detail?.target || '').trim().toLowerCase();
		const action = String(detail?.action || '').trim().toLowerCase();
		if (!target || !action) {
			return;
		}

		this.state.pendingArtifacts = [
			...this.state.pendingArtifacts.filter(item => !(item.target === target && item.action === action)),
			{ ...detail, queuedAt: new Date().toISOString() }
		];

		const targetLabel = this.getCampaignTargetLabel(target);
		this.setFooterStatus(
			Lang.get('campaignArtifactQueuedStatus')
				.replace('{action}', action)
				.replace('{target}', targetLabel)
		);

		const response = this.workflowManager && typeof this.workflowManager.consumeArtifactRequest === 'function'
			? await this.workflowManager.consumeArtifactRequest(detail)
			: {
				target,
				action,
				chatMessage: Lang.get('campaignArtifactLaunchFailed'),
				statusMessage: Lang.get('campaignArtifactLaunchFailed')
			};

		window.dispatchEvent(new CustomEvent('campaign:artifact-response', {
			detail: response || {}
		}));

		return response || {};
	}

	handleArtifactResponse(detail) {
		const target = String(detail?.target || '').trim().toLowerCase();
		const action = String(detail?.action || '').trim().toLowerCase();
		if (target && action) {
			this.state.pendingArtifacts = this.state.pendingArtifacts.filter(item => !(item.target === target && item.action === action));
		}

		if (detail.outputs && typeof detail.outputs === 'object') {
			const currentOutputs = this.state.currentCampaign.outputs || {};
			const hasPosterPng = Object.prototype.hasOwnProperty.call(detail.outputs, 'poster_png')
				|| Object.prototype.hasOwnProperty.call(detail.outputs, 'posterPng');
			const hasPosterOverlayData = Object.prototype.hasOwnProperty.call(detail.outputs, 'poster_overlay_data')
				|| Object.prototype.hasOwnProperty.call(detail.outputs, 'posterOverlayData');
			const hasPosterBackgroundImage = Object.prototype.hasOwnProperty.call(detail.outputs, 'poster_background_image')
				|| Object.prototype.hasOwnProperty.call(detail.outputs, 'posterBackgroundImage');
			const isPosterResponse = target === 'poster' && (hasPosterPng || hasPosterOverlayData || hasPosterBackgroundImage);
			const nextPosterPng = hasPosterPng
				? (detail.outputs.poster_png || detail.outputs.posterPng || '')
				: (currentOutputs.posterPng || '');
			const nextPosterOverlayData = isPosterResponse
				? this.cloneCampaignJson(detail.outputs.poster_overlay_data ?? detail.outputs.posterOverlayData ?? null)
				: (this.cloneCampaignJson(detail.outputs.poster_overlay_data || detail.outputs.posterOverlayData) || this.cloneCampaignJson(currentOutputs.posterOverlayData) || null);
			const nextPosterBackgroundImage = isPosterResponse
				? String(detail.outputs.poster_background_image ?? detail.outputs.posterBackgroundImage ?? '').trim()
				: String(detail.outputs.poster_background_image || detail.outputs.posterBackgroundImage || currentOutputs.posterBackgroundImage || '').trim();

			if (isPosterResponse) {
				this.skipCampaignPosterStateSyncOnce = true;
			}

			this.state.currentCampaign.outputs = {
				posterPng: nextPosterPng,
				posterOverlayData: nextPosterOverlayData,
				posterBackgroundImage: nextPosterBackgroundImage,
				presentationHtml: detail.outputs.presentation_html || detail.outputs.presentationHtml || currentOutputs.presentationHtml || '',
				miniappHtml: detail.outputs.miniapp_html || detail.outputs.miniappHtml || currentOutputs.miniappHtml || ''
			};
			if (isPosterResponse) {

				if (nextPosterPng && (!nextPosterOverlayData || !nextPosterBackgroundImage)) {
					console.warn('CampaignTab: poster artifact response missing editable overlay/background data; falling back to PNG-only poster view');
				}
			}
			if (target === 'poster' || target === 'presentation' || target === 'miniapp') {
				this.state.activeViewport = target;
				this.renderViewSwitcher();
			}
		}

		if (typeof detail.statusMessage === 'string' && detail.statusMessage.trim()) {
			this.setFooterStatus(detail.statusMessage.trim());
		}

			const warningMessage = String(detail?.chatMessage || '').trim();
			if (!detail?.outputs && warningMessage && (
				warningMessage === Lang.get('campaignPosterImageRequired')
				|| warningMessage === Lang.get('campaignPosterVisualModelRequired')
			)) {
				this.showWarning(warningMessage);
			}

		if (detail?.cancelled && target === 'poster' && this.state.activeViewport === 'poster') {
			this.updateCampaignPosterActionState();
			return;
		}

		this.renderViewport();
	}

	async runArtifactSequence(requests) {
		const queue = this.sortArtifactRequestsForStagedFeedback(requests);
		const abortController = this.openWorkflowProgress(this.state.pendingWorkflow?.action || '', queue);
		for (let index = 0; index < queue.length; index += 1) {
			const request = queue[index];
			const target = String(request?.target || '').trim().toLowerCase();
			const action = String(request?.action || '').trim().toLowerCase();

			if (abortController?.signal?.aborted) {
				this.setFooterStatus(Lang.get('campaignWorkflowCancelledStatus'));
				this.hideWorkflowProgress();
				return { cancelled: true };
			}

			this.updateWorkflowProgress({
				currentTarget: target,
				currentStageIndex: index,
				completedStageCount: index,
				statusMessage: Lang.get('campaignWorkflowRunningStatus')
					.replace('{target}', this.getCampaignTargetLabel(target))
					.replace('{current}', String(index + 1))
					.replace('{total}', String(queue.length))
			});

			const response = await this.handleArtifactRequested({
				...request,
				signal: abortController?.signal || null,
				stageIndex: index,
				stageCount: queue.length
			});

			if (response?.cancelled || abortController?.signal?.aborted) {
				this.setFooterStatus(Lang.get('campaignWorkflowCancelledStatus'));
				this.hideWorkflowProgress();
				return { cancelled: true };
			}

			const hasOutputs = !!(response?.outputs && Object.values(response.outputs).some(value => !!value));
			if (!hasOutputs) {
				console.warn('CampaignTab: artifact sequence stopped after failed target', {
					target,
					action,
					statusMessage: String(response?.statusMessage || ''),
					chatMessage: String(response?.chatMessage || '')
				});
				this.markWorkflowProgressFailed(target);
				return { failed: true, target };
			}

			this.updateWorkflowProgress({
				completedStageCount: index + 1,
				statusMessage: String(response?.statusMessage || '').trim() || this.buildWorkflowProgressStatus({
					...this.state.workflowProgress,
					currentTarget: target,
					currentStageIndex: index,
					completedStageCount: index + 1
				})
			});
		}

		this.hideWorkflowProgress();
		return { cancelled: false };
	}

	finishPendingWorkflow(options = {}) {
		this.state.isWorkflowPending = false;
		this.state.pendingWorkflow = null;
		if (!options.preserveProgress) {
			this.hideWorkflowProgress();
		}
		this.updatePromptComposerState();
		this.renderViewport();
	}

	markWorkflowProgressFailed(target, detail = '') {
		const failureMessage = String(detail || '').trim() || this.buildWorkflowErrorStatus(target);
		this.updateWorkflowProgress({
			isOpen: true,
			isCancelling: false,
			isFailed: true,
			failedTarget: target,
			currentTarget: target,
			failureDetail: failureMessage,
			statusMessage: failureMessage,
			abortController: null
		});
		this.setFooterStatus(failureMessage);
	}

	buildWorkflowPayload(action) {
		const modelSelector = document.getElementById('model-selector');
		const selectedOption = modelSelector?.selectedOptions?.[0] || null;
		return {
			action,
			prompt: this.state.draftPrompt,
			model: {
				value: modelSelector?.value || '',
				label: selectedOption?.textContent?.trim() || modelSelector?.value || ''
			},
			campaign: {
				id: this.state.currentCampaign.id || '',
				name: this.state.currentCampaign.name || '',
				brief: this.normalizeBriefForStorage(this.state.currentCampaign.brief),
				palette: Array.isArray(this.state.currentCampaign.palette) ? [...this.state.currentCampaign.palette] : [],
				outputs: {
					poster_png: this.state.currentCampaign.outputs.posterPng || '',
					poster_overlay_data: this.cloneCampaignJson(this.state.currentCampaign.outputs.posterOverlayData),
					poster_background_image: this.state.currentCampaign.outputs.posterBackgroundImage || '',
					presentation_html: this.state.currentCampaign.outputs.presentationHtml || '',
					miniapp_html: this.state.currentCampaign.outputs.miniappHtml || ''
				}
			},
			images: this.state.imageRegistry.map(image => ({
				id: image.id,
				name: image.name,
				mimeType: image.type,
				dataUrl: image.dataUrl
			}))
		};
	}

	appendChatMessage(role, content) {
		if (!content) {
			return;
		}

		this.state.chatMessages.push({
			id: `campaign-chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			role,
			content,
			createdAt: new Date().toISOString()
		});
		this.renderChatLog({ forceScrollToBottom: role === 'user' });
	}

	updateChatMessage(messageId, content) {
		const targetMessage = this.state.chatMessages.find(message => message.id === messageId);
		if (!targetMessage) {
			return;
		}

		targetMessage.content = content;
		this.renderChatLog();
	}

	async animateChatMessage(role, content) {
		this.cancelActiveChatAnimation();

		const tokens = String(content || '').match(/\S+\s*/g) || [String(content || '')];
		const messageId = `campaign-chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
		this.state.chatMessages.push({
			id: messageId,
			role,
			content: '',
			createdAt: new Date().toISOString()
		});
		this.renderChatLog();

		return new Promise(resolve => {
			const animationState = {
				cancelled: false,
				timer: null
			};
			this.activeChatAnimation = animationState;
			let index = 0;

			const flushNextToken = () => {
				if (animationState.cancelled) {
					resolve();
					return;
				}

				const nextContent = tokens.slice(0, index + 1).join('');
				this.updateChatMessage(messageId, nextContent);

				if (index >= tokens.length - 1) {
					this.activeChatAnimation = null;
					resolve();
					return;
				}

				index += 1;
				animationState.timer = window.setTimeout(flushNextToken, 45);
			};

			flushNextToken();
		});
	}

	cancelActiveChatAnimation() {
		if (!this.activeChatAnimation) {
			return;
		}

		this.activeChatAnimation.cancelled = true;
		if (this.activeChatAnimation.timer) {
			window.clearTimeout(this.activeChatAnimation.timer);
		}
		this.activeChatAnimation = null;
	}

	async handleUploadSelection(fileList) {
		const files = Array.from(fileList || []);
		if (!files.length) {
			return;
		}

		const file = files[files.length - 1];
		const image = await this.readFileAsDataUrl(file).then(dataUrl => ({
			id: `campaign-image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			name: file.name,
			size: file.size,
			type: file.type,
			dataUrl
		}));

		this.state.imageRegistry = [image];
		this.renderImageRegistry();
		this.setFooterStatus(Lang.get('campaignImagesQueued').replace('{count}', '1'));

		const input = this.modalElement?.querySelector('#campaign-upload-input');
		if (input) {
			input.value = '';
		}
	}

	removeImageFromRegistry(imageId) {
		this.state.imageRegistry = this.state.imageRegistry.filter(image => image.id !== imageId);
		this.renderImageRegistry();
		this.setFooterStatus(Lang.get('campaignImageRemoved'));
	}

	getBriefPreviewText() {
		const brief = this.state.currentCampaign?.brief || {};
		const posterCopy = brief.posterCopy || {};
		const miniappCustomization = brief.miniappCustomization || {};
		const parts = [];

		if (brief.title) {
			parts.push(`${Lang.get('campaignBriefFieldTitle')}: ${brief.title}`);
		}
		if (brief.subtitle) {
			parts.push(`${Lang.get('paperworkSubtitle')}: ${brief.subtitle}`);
		}
		if (brief.coreMessage) {
			parts.push(`${Lang.get('campaignBriefFieldCoreMessage')}: ${brief.coreMessage}`);
		}
		if (brief.audience) {
			parts.push(`${Lang.get('campaignBriefFieldAudience')}: ${brief.audience}`);
		}
		if (Array.isArray(brief.keyPoints) && brief.keyPoints.length) {
			parts.push(`${Lang.get('campaignBriefFieldKeyPoints')}: ${brief.keyPoints.join(', ')}`);
		}
		if (brief.colorPalette) {
			parts.push(`${Lang.get('campaignBriefFieldColorPalette')}: ${brief.colorPalette}`);
		}
		if (brief.tone) {
			parts.push(`${Lang.get('campaignBriefFieldTone')}: ${brief.tone}`);
		}
		if (posterCopy.header) {
			parts.push(`${Lang.get('campaignBriefFieldPosterHeader')}: ${posterCopy.header}`);
		}
		if (posterCopy.subheader) {
			parts.push(`${Lang.get('campaignBriefFieldPosterSubheader')}: ${posterCopy.subheader}`);
		}
		if (posterCopy.body) {
			parts.push(`${Lang.get('campaignBriefFieldPosterBody')}: ${posterCopy.body}`);
		}
		if (posterCopy.footer) {
			parts.push(`${Lang.get('campaignBriefFieldPosterFooter')}: ${posterCopy.footer}`);
		}
		if (miniappCustomization.add) {
			parts.push(`${Lang.get('campaignBriefFieldMiniappAdd')}: ${miniappCustomization.add}`);
		}
		if (miniappCustomization.remove) {
			parts.push(`${Lang.get('campaignBriefFieldMiniappRemove')}: ${miniappCustomization.remove}`);
		}

		return parts.length ? parts.join('\n') : Lang.get('campaignBriefPlaceholder');
	}

	getBriefPreviewMarkup() {
		const brief = this.state.currentCampaign?.brief || {};
		const posterCopy = brief.posterCopy || {};
		const miniappCustomization = brief.miniappCustomization || {};
		const title = String(brief.title || '').trim();
		const subtitle = String(brief.subtitle || '').trim();
		const keyPointsText = Array.isArray(brief.keyPoints)
			? brief.keyPoints.filter(point => String(point || '').trim()).join('\n')
			: '';
		const renderField = (label, fieldPath, value, options = {}) => `
			<div class="campaign-brief-field">
				<div class="campaign-brief-field-label">${this.escapeHtml(label)}</div>
				${options.multiline
					? `<textarea class="campaign-brief-textarea${options.className ? ` ${this.escapeHtml(options.className)}` : ''}" data-campaign-brief-field="${this.escapeHtml(fieldPath)}"${this.state.isWorkflowPending ? ' disabled' : ''}>${this.escapeHtml(value)}</textarea>`
					: `<input class="campaign-brief-input${options.variant ? ` ${this.escapeHtml(options.variant)}` : ''}" data-campaign-brief-field="${this.escapeHtml(fieldPath)}" value="${this.escapeHtml(value)}"${this.state.isWorkflowPending ? ' disabled' : ''}>`
				}
			</div>
		`;

		return `
			<div class="campaign-brief-preview">
				<div class="campaign-brief-header">
					<div class="campaign-brief-kicker">${this.escapeHtml(Lang.get('campaignBriefFieldTitle'))}</div>
					${renderField(Lang.get('campaignBriefFieldTitle'), 'title', title, { variant: 'title' })}
					${renderField(Lang.get('paperworkSubtitle'), 'subtitle', subtitle, { variant: 'subtitle' })}
				</div>
				<div class="campaign-brief-section">
					<h4 class="campaign-brief-section-title">${this.escapeHtml(Lang.get('campaignBriefView'))}</h4>
					<div class="campaign-brief-fields">
						${renderField(Lang.get('campaignBriefFieldCoreMessage'), 'coreMessage', String(brief.coreMessage || ''), { multiline: true })}
						${renderField(Lang.get('campaignBriefFieldAudience'), 'audience', String(brief.audience || ''))}
						${renderField(Lang.get('campaignBriefFieldTone'), 'tone', String(brief.tone || ''))}
						${renderField(Lang.get('campaignBriefFieldKeyPoints'), 'keyPoints', keyPointsText, {
							multiline: true,
							className: 'keypoints'
						})}
					</div>
				</div>
				<div class="campaign-brief-section">
					<h4 class="campaign-brief-section-title">${this.escapeHtml(Lang.get('campaignBriefFieldColorPalette'))}</h4>
					<div class="campaign-brief-fields">
						${renderField(Lang.get('campaignBriefFieldColorPalette'), 'colorPalette', String(brief.colorPalette || ''), { multiline: true })}
					</div>
				</div>
				<div class="campaign-brief-section poster">
					<h4 class="campaign-brief-section-title">${this.escapeHtml(Lang.get('campaignPosterView'))}</h4>
					<div class="campaign-brief-fields">
						${renderField(Lang.get('campaignBriefFieldPosterHeader'), 'posterCopy.header', String(posterCopy.header || ''))}
						${renderField(Lang.get('campaignBriefFieldPosterSubheader'), 'posterCopy.subheader', String(posterCopy.subheader || ''))}
						${renderField(Lang.get('campaignBriefFieldPosterBody'), 'posterCopy.body', String(posterCopy.body || ''), { multiline: true })}
						${renderField(Lang.get('campaignBriefFieldPosterFooter'), 'posterCopy.footer', String(posterCopy.footer || ''))}
					</div>
				</div>
				<div class="campaign-brief-section">
					<h4 class="campaign-brief-section-title">${this.escapeHtml(Lang.get('campaignMiniAppView'))}</h4>
					<div class="campaign-brief-fields">
						${renderField(Lang.get('campaignBriefFieldMiniappAdd'), 'miniappCustomization.add', String(miniappCustomization.add || ''), { multiline: true })}
						${renderField(Lang.get('campaignBriefFieldMiniappRemove'), 'miniappCustomization.remove', String(miniappCustomization.remove || ''), { multiline: true })}
					</div>
				</div>
			</div>
		`;
	}

	handleBriefFieldInput(fieldPath, rawValue) {
		const path = String(fieldPath || '').trim();
		if (!path) {
			return;
		}

		const nextValue = String(rawValue || '');
		const brief = {
			...(this.state.currentCampaign?.brief || {}),
			posterCopy: {
				...((this.state.currentCampaign?.brief || {}).posterCopy || {})
			},
			miniappCustomization: {
				...((this.state.currentCampaign?.brief || {}).miniappCustomization || {})
			}
		};

		if (path === 'keyPoints') {
			brief.keyPoints = nextValue
				.split(/\r?\n|,/g)
				.map(point => point.trim())
				.filter(Boolean);
		} else if (path === 'colorPalette') {
			brief.colorPalette = nextValue.trim();
		} else if (path.startsWith('posterCopy.')) {
			const posterField = path.slice('posterCopy.'.length);
			if (!posterField) {
				return;
			}
			brief.posterCopy[posterField] = nextValue;
		} else if (path.startsWith('miniappCustomization.')) {
			const miniappField = path.slice('miniappCustomization.'.length);
			if (!miniappField) {
				return;
			}
			brief.miniappCustomization[miniappField] = nextValue;
		} else {
			brief[path] = nextValue;
		}

		this.state.currentCampaign.brief = brief;
	}

	getCampaignTargetLabel(target) {
		const labels = {
			brief: Lang.get('campaignBriefView'),
			poster: Lang.get('campaignPosterView'),
			presentation: Lang.get('campaignPresentationView'),
			miniapp: Lang.get('campaignMiniAppView')
		};

		return labels[target] || target;
	}

	getChatRoleLabel(role) {
		if (role === 'warning') {
			return Lang.get('campaignWarningRole');
		}

		return role === 'assistant' ? Lang.get('campaignAssistantRole') : Lang.get('campaignUserRole');
	}

	async saveCurrentCampaign() {
		this.flushCampaignPosterStateSync();
		const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
		const databaseApi = this.getDatabaseApi();
		if (!hashedMasterKey || !databaseApi || typeof databaseApi.saveCampaign !== 'function') {
			this.setFooterStatus(Lang.get('campaignSaveFailed'));
			return;
		}

		const suggestedName = this.state.currentCampaign.name || this.state.currentCampaign.brief.title || '';
		const campaignName = window.prompt(Lang.get('campaignSaveNamePrompt'), suggestedName);
		if (campaignName === null) {
			this.setFooterStatus(Lang.get('saveToDiskCancelled'));
			return;
		}

		const trimmedName = String(campaignName || '').trim();
		if (!trimmedName) {
			this.setFooterStatus(Lang.get('campaignSaveFailed'));
			return;
		}

		try {
			const existingCampaignName = String(this.state.currentCampaign.name || '').trim();
			const shouldForkVariant = !!this.state.currentCampaign.id && (
				this.hasManualOutputEdits || trimmedName !== existingCampaignName
			);
			const createdAt = shouldForkVariant ? new Date().toISOString() : (this.state.currentCampaign.createdAt || new Date().toISOString());
			const previousContextKey = String(this.state.currentCampaign.id || 'draft').trim() || 'draft';
			const persistedContext = this.getPersistedOrchestratorContext();
			const campaignId = await databaseApi.saveCampaign(hashedMasterKey, {
				id: shouldForkVariant ? undefined : (this.state.currentCampaign.id || undefined),
				name: trimmedName,
				campaign_brief: this.normalizeBriefForStorage(this.state.currentCampaign.brief),
				poster_png: this.state.currentCampaign.outputs.posterPng || '',
				poster_overlay_data: this.cloneCampaignJson(this.state.currentCampaign.outputs.posterOverlayData),
				poster_background_image: this.state.currentCampaign.outputs.posterBackgroundImage || '',
				presentation_html: this.state.currentCampaign.outputs.presentationHtml || '',
				miniapp_html: this.state.currentCampaign.outputs.miniappHtml || '',
				palette: this.state.currentCampaign.palette || [],
				chat_history: this.serializeChatHistory(),
				orchestrator_context: this.getPersistedOrchestratorContext(),
				created_at: createdAt
			});

			this.state.currentCampaign.id = campaignId;
			this.state.currentCampaign.name = trimmedName;
			this.state.currentCampaign.createdAt = createdAt;
			this.state.currentCampaign.updatedAt = new Date().toISOString();
			if (shouldForkVariant) {
				this.restorePersistedOrchestratorContext(campaignId, persistedContext);
			} else {
				this.rekeyPersistedOrchestratorContext(previousContextKey, campaignId);
			}
			this.hasManualOutputEdits = false;
			await this.loadSavedCampaigns();
			this.renderTab();
			this.renderViewport();
			this.setFooterStatus(Lang.get('campaignSaveSuccess').replace('{name}', trimmedName));
		} catch (error) {
			console.error('CampaignTab: save failed', error);
			this.setFooterStatus(Lang.get('campaignSaveFailed'));
		}
	}

	async loadCampaignById(campaignId) {
		const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
		const databaseApi = this.getDatabaseApi();
		if (!hashedMasterKey || !campaignId || !databaseApi || typeof databaseApi.loadCampaign !== 'function') {
			this.setFooterStatus(Lang.get('campaignLoadFailed'));
			return;
		}

		try {
			const campaign = await databaseApi.loadCampaign(hashedMasterKey, campaignId);
			if (!campaign) {
				this.setFooterStatus(Lang.get('campaignLoadFailed'));
				return;
			}

			this.state.currentCampaign = {
				id: campaign.id || '',
				name: campaign.name || '',
				createdAt: campaign.created_at || '',
				updatedAt: campaign.updated_at || '',
				brief: this.normalizeBriefFromStorage(campaign.campaign_brief),
				palette: Array.isArray(campaign.palette) ? campaign.palette : [],
				outputs: {
					posterPng: campaign.poster_png || '',
					posterOverlayData: this.cloneCampaignJson(campaign.poster_overlay_data),
					posterBackgroundImage: campaign.poster_background_image || '',
					presentationHtml: campaign.presentation_html || '',
					miniappHtml: campaign.miniapp_html || ''
				}
			};
			this.campaignPosterZoom = 1;
			this.state.chatMessages = this.normalizeChatHistory(campaign.chat_history);
			this.restorePersistedOrchestratorContext(this.state.currentCampaign.id, campaign.orchestrator_context);
			this.hasManualOutputEdits = false;

			this.openStudio();
			if (!this.state.chatMessages.length) {
				this.appendChatMessage('assistant', Lang.get('campaignLoadedIntoStudio').replace('{name}', this.state.currentCampaign.name || Lang.get('campaignUntitledName')));
			} else {
				this.renderChatLog();
			}
			this.renderViewport();
			this.setFooterStatus(Lang.get('campaignLoadSuccess').replace('{name}', this.state.currentCampaign.name || Lang.get('campaignUntitledName')));
		} catch (error) {
			console.error('CampaignTab: load failed', error);
			this.setFooterStatus(Lang.get('campaignLoadFailed'));
		}
	}

	async deleteCampaignById(campaignId) {
		const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
		const databaseApi = this.getDatabaseApi();
		if (!hashedMasterKey || !campaignId || !databaseApi || typeof databaseApi.deleteCampaign !== 'function') {
			this.setFooterStatus(Lang.get('campaignDeleteFailed'));
			return;
		}

		if (!window.confirm(Lang.get('campaignDeleteConfirm'))) {
			return;
		}

		try {
			const deleted = await databaseApi.deleteCampaign(hashedMasterKey, campaignId);
			if (!deleted) {
				this.setFooterStatus(Lang.get('campaignDeleteFailed'));
				return;
			}
			this.clearPersistedOrchestratorContext(campaignId);

			if (this.state.currentCampaign.id === campaignId) {
				this.resetCurrentCampaign();
			}

			await this.loadSavedCampaigns();
			this.renderTab();
			this.renderViewport();
			this.setFooterStatus(Lang.get('campaignDeleteSuccess'));
		} catch (error) {
			console.error('CampaignTab: delete failed', error);
			this.setFooterStatus(Lang.get('campaignDeleteFailed'));
		}
	}

	resetCurrentCampaign() {
		this.teardownCampaignPosterEditor();
		const currentContextKey = String(this.state.currentCampaign?.id || 'draft').trim() || 'draft';
		this.clearPersistedOrchestratorContext(currentContextKey);
		this.state.activeViewport = 'brief';
		this.state.isWorkflowPending = false;
		this.state.workflowProgress = this.createWorkflowProgressState();
		this.state.currentCampaign = {
			id: '',
			name: '',
			createdAt: '',
			updatedAt: '',
			brief: {
				title: '',
				subtitle: '',
				coreMessage: '',
				audience: '',
				keyPoints: [],
				colorPalette: '',
				tone: '',
				posterCopy: {
					header: '',
					subheader: '',
					body: '',
					footer: ''
				},
				miniappCustomization: {
					add: '',
					remove: ''
				}
			},
			palette: [],
			outputs: {
				posterPng: '',
				posterOverlayData: null,
				posterBackgroundImage: '',
				presentationHtml: '',
				miniappHtml: ''
			}
		};
		this.state.draftPrompt = '';
		this.state.chatMessages = [];
		this.state.imageRegistry = [];
		this.state.pendingArtifacts = [];
		this.state.pendingWorkflow = null;
		this.campaignPosterZoom = 1;
		this.hasManualOutputEdits = false;
		this.renderChatLog();
		this.renderImageRegistry();
		this.renderViewport();
	}

	normalizeBriefForStorage(brief) {
		const posterCopy = brief?.posterCopy || {};
		const miniappCustomization = brief?.miniappCustomization || {};
		return {
			title: brief?.title || '',
			subtitle: brief?.subtitle || '',
			core_message: brief?.coreMessage || '',
			audience: brief?.audience || '',
			key_points: Array.isArray(brief?.keyPoints) ? brief.keyPoints : [],
			color_palette: brief?.colorPalette || '',
			tone: brief?.tone || '',
			poster_copy: {
				header: posterCopy.header || '',
				subheader: posterCopy.subheader || '',
				body: posterCopy.body || '',
				footer: posterCopy.footer || ''
			},
			miniapp_customization: {
				add: miniappCustomization.add || '',
				remove: miniappCustomization.remove || ''
			}
		};
	}

	normalizeBriefFromStorage(brief) {
		const posterCopy = brief?.posterCopy || brief?.poster_copy || {};
		const miniappCustomization = brief?.miniappCustomization || brief?.miniapp_customization || {};
		return {
			title: brief?.title || '',
			subtitle: brief?.subtitle || '',
			coreMessage: brief?.coreMessage || brief?.core_message || '',
			audience: brief?.audience || '',
			keyPoints: Array.isArray(brief?.keyPoints) ? brief.keyPoints : (Array.isArray(brief?.key_points) ? brief.key_points : []),
			colorPalette: brief?.colorPalette || brief?.color_palette || '',
			tone: brief?.tone || '',
			posterCopy: {
				header: posterCopy.header || '',
				subheader: posterCopy.subheader || '',
				body: posterCopy.body || '',
				footer: posterCopy.footer || ''
			},
			miniappCustomization: {
				add: miniappCustomization.add || '',
				remove: miniappCustomization.remove || ''
			}
		};
	}

	mergeBriefFromWorkflow(rawBrief) {
		const currentBrief = this.normalizeBriefFromStorage(this.state.currentCampaign?.brief || {});
		const nextBrief = this.normalizeBriefFromStorage(rawBrief || {});
		const hasOwn = (value, key) => !!value && Object.prototype.hasOwnProperty.call(value, key);
		const nextPosterCopy = rawBrief?.posterCopy || rawBrief?.poster_copy || null;
		const nextMiniappCustomization = rawBrief?.miniappCustomization || rawBrief?.miniapp_customization || null;

		return {
			title: hasOwn(rawBrief, 'title') ? nextBrief.title : currentBrief.title,
			subtitle: hasOwn(rawBrief, 'subtitle') ? nextBrief.subtitle : currentBrief.subtitle,
			coreMessage: (hasOwn(rawBrief, 'coreMessage') || hasOwn(rawBrief, 'core_message')) ? nextBrief.coreMessage : currentBrief.coreMessage,
			audience: hasOwn(rawBrief, 'audience') ? nextBrief.audience : currentBrief.audience,
			keyPoints: (hasOwn(rawBrief, 'keyPoints') || hasOwn(rawBrief, 'key_points')) ? nextBrief.keyPoints : currentBrief.keyPoints,
			colorPalette: (hasOwn(rawBrief, 'colorPalette') || hasOwn(rawBrief, 'color_palette')) ? nextBrief.colorPalette : currentBrief.colorPalette,
			tone: hasOwn(rawBrief, 'tone') ? nextBrief.tone : currentBrief.tone,
			posterCopy: {
				header: nextPosterCopy && hasOwn(nextPosterCopy, 'header') ? nextBrief.posterCopy.header : currentBrief.posterCopy.header,
				subheader: nextPosterCopy && hasOwn(nextPosterCopy, 'subheader') ? nextBrief.posterCopy.subheader : currentBrief.posterCopy.subheader,
				body: nextPosterCopy && hasOwn(nextPosterCopy, 'body') ? nextBrief.posterCopy.body : currentBrief.posterCopy.body,
				footer: nextPosterCopy && hasOwn(nextPosterCopy, 'footer') ? nextBrief.posterCopy.footer : currentBrief.posterCopy.footer
			},
			miniappCustomization: {
				add: nextMiniappCustomization && hasOwn(nextMiniappCustomization, 'add') ? nextBrief.miniappCustomization.add : currentBrief.miniappCustomization.add,
				remove: nextMiniappCustomization && hasOwn(nextMiniappCustomization, 'remove') ? nextBrief.miniappCustomization.remove : currentBrief.miniappCustomization.remove
			}
		};
	}

	setFooterStatus(message) {
		const footerStatus = this.modalElement?.querySelector('#campaign-footer-status');
		if (footerStatus) {
			footerStatus.textContent = message;
		}
	}

	formatBytes(value) {
		const size = Number(value || 0);
		if (!Number.isFinite(size) || size <= 0) {
			return '0 B';
		}

		const units = ['B', 'KB', 'MB', 'GB'];
		let current = size;
		let index = 0;
		while (current >= 1024 && index < units.length - 1) {
			current /= 1024;
			index += 1;
		}

		return `${current.toFixed(current >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
	}

	readFileAsDataUrl(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result || '');
			reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
			reader.readAsDataURL(file);
		});
	}

	downloadCampaignTextFile(content, fileName, mimeType) {
		const blob = new Blob([content || ''], { type: mimeType });
		const objectUrl = URL.createObjectURL(blob);
		this.downloadCampaignUrl(objectUrl, fileName, true);
	}

	downloadCampaignPng(value, fileName) {
		const src = String(value || '').trim();
		if (!src) {
			return;
		}
		const href = src.startsWith('data:') ? src : `data:image/png;base64,${src}`;
		this.downloadCampaignUrl(href, fileName);
	}

	downloadCampaignUrl(url, fileName, revoke = false) {
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = fileName;
		document.body.appendChild(anchor);
		anchor.click();
		anchor.remove();
		if (revoke) {
			setTimeout(() => URL.revokeObjectURL(url), 0);
		}
	}

	sanitizeCampaignFileName(value) {
		return String(value || 'campaign')
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/gi, '-')
			.replace(/^-+|-+$/g, '') || 'campaign';
	}

	formatCampaignDate(value) {
		if (!value) {
			return Lang.get('campaignDateUnknown');
		}

		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) {
			return String(value);
		}

		try {
			return new Intl.DateTimeFormat(Lang.currentLang || undefined, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit'
			}).format(parsed);
		} catch (_error) {
			return parsed.toLocaleString();
		}
	}

	escapeHtml(value) {
		return String(value ?? '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	formatChatMessageContent(message) {
		const content = String(message?.content || '');
		if (message?.role !== 'assistant') {
			return this.escapeHtml(content).replace(/\n/g, '<br>');
		}

		return this.renderSimpleMarkdown(content);
	}

	renderSimpleMarkdown(markdown) {
		const escaped = this.escapeHtml(markdown);
		const blocks = escaped.split(/\n{2,}/).map(block => block.trim()).filter(Boolean);
		if (!blocks.length) {
			return '';
		}

		return blocks.map(block => {
			const lines = block.split('\n').map(line => line.trimEnd());
			const listType = this.getMarkdownListType(lines);
			if (listType) {
				const items = lines.map(line => listType === 'ol'
					? line.replace(/^\d+\.\s+/, '')
					: line.replace(/^[-*]\s+/, ''));
				return `<${listType}>${items.map(item => `<li>${this.renderInlineMarkdown(item)}</li>`).join('')}</${listType}>`;
			}

			return `<p>${this.renderInlineMarkdown(lines.join('<br>'))}</p>`;
		}).join('');
	}

	getMarkdownListType(lines) {
		if (lines.length && lines.every(line => /^[-*]\s+/.test(line))) {
			return 'ul';
		}

		if (lines.length && lines.every(line => /^\d+\.\s+/.test(line))) {
			return 'ol';
		}

		return '';
	}

	renderInlineMarkdown(text) {
		return String(text || '')
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
			.replace(/__([^_]+)__/g, '<strong>$1</strong>')
			.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
			.replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>')
			.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
	}
}

window.CampaignTab = CampaignTab;
