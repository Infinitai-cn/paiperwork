// Hosted/cloud deployments can run without local Ollama by rewriting hardcoded localhost fetches.
(function bootstrapHostedFetchCompatibility() {
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;

    const host = String(window.location.hostname || '').toLowerCase();
    const protocol = String(window.location.protocol || '').toLowerCase();
    const isLocalHost = host === 'localhost'
        || host === '127.0.0.1'
        || host === '::1'
        || host === '0.0.0.0';
    const isLocalProtocol = protocol === 'file:'
        || protocol === 'app:'
        || protocol === 'tauri:'
        || protocol === 'capacitor:'
        || protocol === 'electron:';
    const isPrivateNetworkHost = /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[0-1])\.)/.test(host);
    const isLikelyLocalRuntime = isLocalHost || isLocalProtocol || isPrivateNetworkHost || !host;
    window.PAIPERWORK_IS_LOCAL_RUNTIME = isLikelyLocalRuntime;

    const queryFlag = new URLSearchParams(window.location.search || '').get('cloudOnly');
    const cloudOnlyByQuery = queryFlag === '1' || queryFlag === 'true';
    const cloudOnlyByStorage = !isLikelyLocalRuntime && localStorage.getItem('cloudOnlyMode') === 'true';
    const cloudOnlyByHost = !isLikelyLocalRuntime;
    const cloudOnlyMode = cloudOnlyByQuery || cloudOnlyByStorage || cloudOnlyByHost;

    // Avoid stale cloud-only preference leaking into local desktop runs.
    if (isLikelyLocalRuntime) {
        try {
            localStorage.removeItem('cloudOnlyMode');
        } catch (_err) {
            // Ignore storage failures in restricted contexts.
        }
    }

    window.PAIPERWORK_CLOUD_ONLY = cloudOnlyMode;
    if (!cloudOnlyMode) return;

    const originalFetch = window.fetch.bind(window);
    const unsupportedCloudEndpoints = new Set(['ps', 'version', 'delete']);

    function makeNotSupportedResponse(path) {
        return new Response(
            JSON.stringify({
                error: 'This operation is unavailable in cloud-only mode.',
                path
            }),
            {
                status: 501,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }

    function rewriteLocalhostTarget(resource) {
        const raw = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
        if (!raw) return null;

        if (raw.startsWith('http://localhost:8182/api/library') || raw.startsWith('http://127.0.0.1:8182/api/library')) {
            return { rewritten: raw.replace(/^http:\/\/(localhost|127\.0\.0\.1):8182/, '') };
        }

        const localPrefixMatch = raw.match(/^http:\/\/(localhost|127\.0\.0\.1):11434\/api\/(.+)$/i);
        if (!localPrefixMatch) return null;

        const endpointAndQuery = localPrefixMatch[2] || '';
        const endpoint = endpointAndQuery.split('?')[0].toLowerCase();
        if (unsupportedCloudEndpoints.has(endpoint)) {
            return { response: makeNotSupportedResponse(endpoint) };
        }

        return { rewritten: '/api/cloud/' + endpointAndQuery };
    }

    window.fetch = function(resource, init) {
        const rewriteResult = rewriteLocalhostTarget(resource);
        if (!rewriteResult) {
            return originalFetch(resource, init);
        }

        if (rewriteResult.response) {
            return Promise.resolve(rewriteResult.response);
        }

        return originalFetch(rewriteResult.rewritten, init);
    };
})();

function getWhatsappUserScopedHeadersForSessionReset(hashedMasterKey, extraHeaders = null) {
    const headers = { ...(extraHeaders || {}) };
    const resolvedMasterKey = String(hashedMasterKey || '').trim();
    if (resolvedMasterKey) {
        headers['X-Paiperwork-User'] = resolvedMasterKey;
    }
    return headers;
}

function appendWhatsappUserScopeForSessionReset(params, hashedMasterKey) {
    const resolvedParams = params instanceof URLSearchParams ? params : new URLSearchParams(params || '');
    const resolvedMasterKey = String(hashedMasterKey || '').trim();
    if (resolvedMasterKey) {
        resolvedParams.set('user', resolvedMasterKey);
    }
    return resolvedParams;
}

async function waitForWhatsappGatewayStopForSessionReset(hashedMasterKey, timeoutMs = 15000, intervalMs = 400) {
    const resolvedMasterKey = String(hashedMasterKey || '').trim();
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        try {
            const params = appendWhatsappUserScopeForSessionReset(new URLSearchParams(), resolvedMasterKey);
            const res = await fetch('/api/whatsapp/gateway-info?' + params.toString(), {
                cache: 'no-store',
                headers: getWhatsappUserScopedHeadersForSessionReset(resolvedMasterKey)
            });
            if (res.ok) {
                const data = await res.json();
                if (!data || data.gatewayRunning !== true) {
                    return true;
                }
            }
        } catch (err) {
            console.warn('App: gateway-info poll during session reset stop failed', err);
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    return false;
}

async function stopWhatsappServerForSessionReset() {
    if (typeof window === 'undefined' || typeof fetch !== 'function') {
        return false;
    }

    const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
    if (!hashedMasterKey) {
        return false;
    }

    try {
        if (window.connectorsTab && typeof window.connectorsTab.stopWhatsappServer === 'function') {
            await window.connectorsTab.stopWhatsappServer();
            return true;
        }

        const gatewayInfoParams = appendWhatsappUserScopeForSessionReset(new URLSearchParams(), hashedMasterKey);
        const gatewayInfoHeaders = getWhatsappUserScopedHeadersForSessionReset(hashedMasterKey);

        try {
            const gatewayInfoRes = await fetch('/api/whatsapp/gateway-info?' + gatewayInfoParams.toString(), {
                cache: 'no-store',
                headers: gatewayInfoHeaders
            });
            if (gatewayInfoRes.ok) {
                const gatewayInfo = await gatewayInfoRes.json();
                if (!gatewayInfo || gatewayInfo.gatewayRunning !== true) {
                    return true;
                }
            }
        } catch (err) {
            console.warn('App: initial gateway-info check before session reset stop failed', err);
        }

        const stopParams = appendWhatsappUserScopeForSessionReset(new URLSearchParams({ stop: 'true' }), hashedMasterKey);
        const stopRes = await fetch('/api/whatsapp/qr?' + stopParams.toString(), {
            method: 'POST',
            headers: getWhatsappUserScopedHeadersForSessionReset(hashedMasterKey, { 'Content-Type': 'application/json' })
        });

        if (!stopRes.ok) {
            console.warn('App: stop WhatsApp server during session reset failed', await stopRes.text());
        }

        await waitForWhatsappGatewayStopForSessionReset(hashedMasterKey);
        return true;
    } catch (err) {
        console.warn('App: stopWhatsappServerForSessionReset failed', err);
        return false;
    }
}

async function stopWechatServerForSessionReset() {
    if (typeof window === 'undefined' || typeof fetch !== 'function') {
        return false;
    }

    try {
        if (window.connectorsTab && typeof window.connectorsTab.stopWechatServer === 'function') {
            await window.connectorsTab.stopWechatServer();
            return true;
        }

        const stopRes = await fetch('/api/wechat/stop', {
            method: 'POST',
            keepalive: true
        });

        return stopRes.ok;
    } catch (err) {
        console.warn('App: stopWechatServerForSessionReset failed', err);
        return false;
    }
}

if (typeof window !== 'undefined') {
    window.PaiperworkSessionReset = {
        stopWhatsappServerForSessionReset,
        stopWechatServerForSessionReset
    };
}

async function ensureSubjectiveInteractionsLoaded() {
    if (typeof window === 'undefined') {
        throw new Error('SubjectiveInteractions can only be loaded in the browser');
    }

    if (window.SubjectiveInteractions) {
        return window.SubjectiveInteractions;
    }

    if (typeof SubjectiveInteractions !== 'undefined') {
        window.SubjectiveInteractions = SubjectiveInteractions;
        return window.SubjectiveInteractions;
    }

    if (!window._subjectiveInteractionsLoadPromise) {
        const scriptSrc = 'js/utils/settings/subjectiveinteractions.js';

        if (window.tabLoader && typeof window.tabLoader.loadScript === 'function') {
            window._subjectiveInteractionsLoadPromise = window.tabLoader.loadScript(scriptSrc);
        } else {
            window._subjectiveInteractionsLoadPromise = new Promise((resolve, reject) => {
                const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
                if (existingScript) {
                    existingScript.addEventListener('load', () => resolve());
                    existingScript.addEventListener('error', () => reject(new Error('Failed to load subjectiveinteractions.js')));
                    return;
                }

                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = scriptSrc;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load subjectiveinteractions.js'));
                document.head.appendChild(script);
            });
        }
    }

    await window._subjectiveInteractionsLoadPromise;

    if (window.SubjectiveInteractions) {
        return window.SubjectiveInteractions;
    }

    if (typeof SubjectiveInteractions !== 'undefined') {
        window.SubjectiveInteractions = SubjectiveInteractions;
        return window.SubjectiveInteractions;
    }

    throw new Error('SubjectiveInteractions is not available after loading');
}

if (typeof window !== 'undefined') {
    window.ensureSubjectiveInteractionsLoaded = ensureSubjectiveInteractionsLoaded;
}

function getTabLauncherIcon(tab) {
    const icons = {
        chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18.5A8.38 8.38 0 0 1 3.5 12 8.5 8.5 0 0 1 12 3.5 8.5 8.5 0 0 1 20.5 12 8.5 8.5 0 0 1 12 20.5c-1.52 0-2.95-.4-4.18-1.1L4 20z"/><path d="M8.5 10.5h.01"/><path d="M12 10.5h.01"/><path d="M15.5 10.5h.01"/></svg>',
        documents: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>',
        translate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7h9"/><path d="M9 4v3"/><path d="M8 7a10 10 0 0 1-3 7"/><path d="M6 11c1.1 2.2 2.7 4.1 4.8 5.5"/><path d="M14 13l4 8"/><path d="M12.5 18h7"/><path d="M16 13l-3.5 8"/></svg>',
        dataviz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20v-4"/></svg>',
        paperwork: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2h5.5A2.5 2.5 0 0 1 20 9.5v8A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5z"/></svg>',
        research: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
        artwork: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1 0 1.8-.8 1.8-1.8 0-.42-.14-.8-.14-1.2 0-1 1-1.7 2-1.7h1.3A3.57 3.57 0 0 0 20.5 12 8.5 8.5 0 0 0 12 3.5z"/><circle cx="7.5" cy="11" r=".8" fill="currentColor" stroke="none"/><circle cx="10.5" cy="8" r=".8" fill="currentColor" stroke="none"/><circle cx="14.5" cy="8.5" r=".8" fill="currentColor" stroke="none"/><circle cx="16.5" cy="12" r=".8" fill="currentColor" stroke="none"/></svg>',
        campaign: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5h10"/><path d="M4 12h16"/><path d="M4 17.5h9"/><path d="M17.5 4 20 6.5l-5.5 5.5H12v-2.5z"/></svg>',
        presentation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h16v10H4z"/><path d="M12 15.5v5"/><path d="M9 20.5h6"/><path d="M8 9.5l2.5 2.5L16 7"/></svg>',
        artifacts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.8 19 6.8v10.4l-7 4-7-4V6.8z"/><path d="M12 2.8v8.4"/><path d="M19 6.8 12 11.2 5 6.8"/></svg>',
        models: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 4v10l-7 4-7-4V7z"/><path d="M5 7l7 4 7-4"/><path d="M12 11v10"/></svg>',
        database: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6"/><path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6"/></svg>',
        connectors: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 7v4"/><path d="M15 7v4"/><path d="M8 11h8"/><path d="M12 11v5"/><path d="M9.5 16h5"/><path d="M8.5 20h7"/><path d="M7 7.5A1.5 1.5 0 0 1 8.5 6h7A1.5 1.5 0 0 1 17 7.5V11a5 5 0 0 1-5 5 5 5 0 0 1-5-5z"/></svg>'
    };

    return icons[tab] || icons.chat;
}

window.renderTabLauncherCards = function renderTabLauncherCards() {
    document.querySelectorAll('.tab-button').forEach(button => {
        const tab = button.getAttribute('data-tab');
        const title = Lang.get(`${tab}Tab`);
        const descriptionKey = `${tab}TabDescription`;
        const localizedDescription = Lang.get(descriptionKey);
        const description = localizedDescription === descriptionKey
            ? (button.dataset.description || '')
            : localizedDescription;
        const iconMarkup = getTabLauncherIcon(tab);

        button.innerHTML = `
            <span class="tab-card-icon" aria-hidden="true">${iconMarkup}</span>
            <span class="tab-card-copy">
                <span class="tab-card-title">${title}</span>
                <span class="tab-card-description">${description}</span>
            </span>
            <span class="tab-card-arrow" aria-hidden="true">&rsaquo;</span>
        `;
    });
};

document.addEventListener('DOMContentLoaded', async function () {
   //console.log('DOM Content Loaded');
    await Lang.initialize();

    // Localize tab labels after language data is loaded
    const tabTranslations = {
        chat: 'chatTab',
        connectors: 'connectorsTab',
        documents: 'documentsTab',
        translate: 'translateTab',
        dataviz: 'datavizTab',
        paperwork: 'paperworkTab',
        research: 'researchTab',
        artwork: 'artworkTab',
        campaign: 'campaignTab',
        presentation: 'presentationTab',
        artifacts: 'artifactsTab',
        models: 'modelsTab',
        database: 'databaseTab'
    };

    if (typeof window.renderTabLauncherCards === 'function') {
        window.renderTabLauncherCards();
    }

    hideLocalOnlyTabsForCloudOnly();

    // Auto-generate a session admin key silently in cloud-only deployments
    try {
        if (window.PAIPERWORK_CLOUD_ONLY) {
            const existing = sessionStorage.getItem('pa_admin_key');
            if (!existing || !String(existing).trim()) {
                try {
                    const arr = new Uint8Array(32);
                    if (window.crypto && crypto.getRandomValues) {
                        crypto.getRandomValues(arr);
                    } else {
                        for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
                    }
                    const key = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
                    sessionStorage.setItem('pa_admin_key', key);
                } catch (genErr) {
                    // Non-fatal; if generation fails we'll fall back to on-demand prompt elsewhere
                    console.warn('Failed to auto-generate pa_admin_key:', genErr);
                }
            }
        }
    } catch (e) {
        // sessionStorage may be restricted in some contexts; ignore failures
    }

    OllamaAPI.currentContextSize = parseInt(document.getElementById('context-selector')?.value || 16384);
    setupTabSwitching();

    // Initialize app with database and UI elements
    const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
    if (hashedMasterKey && document.getElementById('model-selector')) {
       //console.log('Starting initialization');
        window.__paiperworkDbBootPromise = (async () => {
            const dbInitialized = await PaiperworkDB.initializeDatabase(hashedMasterKey);
            if (!dbInitialized) {
                return false;
            }

            await PaiperworkDB.loadSettings(hashedMasterKey);

            // Ensure any legacy localStorage entries for selected model/provider do not override
            // database-backed settings; database is now the single source of truth.
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.removeItem('selectedModel');
                    localStorage.removeItem('selectedModelProvider');
                }
            } catch (_cleanupErr) {
                // Non-fatal; app should still continue startup.
            }

            // Warm API key lookup cache so first cloud send after refresh is not racing storage init.
            try {
                await PaiperworkDB.getOllamaApiKey(hashedMasterKey);
            } catch (_warmErr) {
                // Non-fatal warmup failure.
            }

            return true;
        })();

        try {
            const dbInitialized = await window.__paiperworkDbBootPromise;
            if (dbInitialized) {
                const settings = await PaiperworkDB.loadSettings(hashedMasterKey);
               //console.log('Settings loaded');

                // Initialize UI using ChatTab instead
               //console.log('App.js: Initializing ChatTab');
                await ChatTab.initialize();
               //console.log('App.js: ChatTab UI initialization complete');

                await ensureChatTabVisibleWhenModelMissing(settings);
            }
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }
});

function updateChatModelSelectorHint() {
    const modelSelector = document.getElementById('model-selector');
    const hint = document.getElementById('chat-model-selector-hint');
    if (!hint) {
        return;
    }

    if (!modelSelector) {
        hint.style.display = 'none';
        return;
    }

    const selectedValue = String(modelSelector.value || '').trim();
    const selectedIndex = modelSelector.selectedIndex;
    const noModelSelected = !selectedValue || selectedIndex === 0;

    if (noModelSelected) {
        const hintText = document.getElementById('chat-model-selector-hint-text');
        if (hintText) {
            hintText.textContent = (window.Lang && typeof Lang.get === 'function')
                ? Lang.get('chatModelSelectorHint')
                : 'Select a model to start using Paiperwork';
        }

        const rect = modelSelector.getBoundingClientRect();
        hint.style.display = 'block';
        hint.style.left = `${Math.max(12, rect.left - hint.offsetWidth - 14)}px`;
        hint.style.top = `${rect.top + window.scrollY + rect.height / 2 - hint.offsetHeight / 2}px`;
        hint.style.maxWidth = '240px';
        hint.style.width = 'auto';
        hint.style.right = 'auto';

        if (!modelSelector.__modelSelectorHintBound) {
            modelSelector.addEventListener('change', updateChatModelSelectorHint);
            modelSelector.__modelSelectorHintBound = true;
        }
    } else {
        hint.style.display = 'none';
    }
}

async function ensureChatTabVisibleWhenModelMissing(settings = null) {
    const chatButton = document.querySelector('.tab-button[data-tab="chat"]');
    if (!chatButton || typeof chatButton.click !== 'function') {
        return;
    }

    const hasPersistedModel = !!String(settings && settings.model ? settings.model : '').trim();
    if (hasPersistedModel) {
        return;
    }

    let modelSelector = document.getElementById('model-selector');
    if (!modelSelector && window.chatTab && typeof window.chatTab.switchToChatTabFromModelWarning === 'function') {
        window.chatTab.switchToChatTabFromModelWarning();
        return;
    }

    for (let attempt = 0; attempt < 5; attempt++) {
        if (modelSelector && modelSelector.options && modelSelector.options.length > 0) {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 120));
        modelSelector = document.getElementById('model-selector');
    }

    const selectedValue = modelSelector ? String(modelSelector.value || '').trim() : '';
    const selectedIndex = modelSelector ? modelSelector.selectedIndex : -1;
    const noModelSelected = !selectedValue || selectedIndex === 0;

    if (noModelSelected) {
        chatButton.click();
        window.setTimeout(updateChatModelSelectorHint, 120);
    }
}

function hideLocalOnlyTabsForCloudOnly() {
    let localOnlyTabs;
    if (window.PAIPERWORK_CLOUD_ONLY) {
        localOnlyTabs = ['models', 'documents', 'translate', 'connectors'];
    } else {
        localOnlyTabs = ['translate'];
    }

    let hiddenTabWasActive = false;

    localOnlyTabs.forEach((tabName) => {
        const tabButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
        const tabPane = document.getElementById(`${tabName}-tab`);

        if ((tabButton && tabButton.classList.contains('active')) || (tabPane && tabPane.classList.contains('active'))) {
            hiddenTabWasActive = true;
        }

        if (tabButton) {
            tabButton.style.display = 'none';
            tabButton.setAttribute('aria-hidden', 'true');
            tabButton.setAttribute('tabindex', '-1');
            tabButton.classList.remove('active');
        }

        if (tabPane) {
            tabPane.classList.remove('active');
            tabPane.style.display = 'none';
            tabPane.setAttribute('aria-hidden', 'true');
        }
    });

    if (hiddenTabWasActive) {
        const fallbackTabButton = document.querySelector('.tab-button[data-tab="chat"]')
            || document.querySelector('.tab-button[data-tab="research"]')
            || document.querySelector('.tab-button:not([style*="display: none"])');
        if (fallbackTabButton && typeof fallbackTabButton.click === 'function') {
            fallbackTabButton.click();
        }
    }
}


// Sets up tab switching logic and handles tab activation/deactivation events
function setupTabSwitching() {
    //console.debug('[app] setupTabSwitching initializing');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const tabContainer = document.querySelector('.tab-container');
    const tabButtonsContainer = document.querySelector('.tab-buttons');
    const tabContent = document.querySelector('.tab-content');
    const orderedTabButtons = Array.from(tabButtons);

   //console.log('App: Setting up tab buttons:', tabButtons.length);
   //console.log('App: Setting up tab panes:', tabPanes.length);

    let previousTab = document.querySelector('.tab-button.active')?.dataset?.tab || null;

    orderedTabButtons.forEach((button, index) => {
        button.dataset.originalLauncherIndex = String(index);
    });

    const animateTabButtonReorder = mutateLayout => {
        if (!tabButtonsContainer) {
            mutateLayout();
            return;
        }

        const buttonsBefore = Array.from(tabButtonsContainer.querySelectorAll('.tab-button'));
        const firstRects = new Map(buttonsBefore.map(button => [button, button.getBoundingClientRect()]));

        mutateLayout();

        Array.from(tabButtonsContainer.querySelectorAll('.tab-button')).forEach(button => {
            const firstRect = firstRects.get(button);
            if (!firstRect) {
                return;
            }

            const lastRect = button.getBoundingClientRect();
            const deltaX = firstRect.left - lastRect.left;
            const deltaY = firstRect.top - lastRect.top;

            if (!deltaX && !deltaY) {
                return;
            }

            button.style.transition = 'none';
            button.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

            void button.offsetWidth;

            requestAnimationFrame(() => {
                button.style.transition = 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease, filter 0.2s ease';
                button.style.transform = '';

                window.setTimeout(() => {
                    if (!button.matches(':hover') && !button.classList.contains('active')) {
                        button.style.transition = '';
                    }
                }, 320);
            });
        });
    };

    const moveSelectedCardToTop = selectedButton => {
        if (!tabButtonsContainer || !selectedButton) {
            return;
        }

        animateTabButtonReorder(() => {
            const buttonsInOriginalOrder = Array.from(tabButtonsContainer.querySelectorAll('.tab-button'))
                .sort((leftButton, rightButton) => Number(leftButton.dataset.originalLauncherIndex) - Number(rightButton.dataset.originalLauncherIndex));

            tabButtonsContainer.prepend(selectedButton);
            buttonsInOriginalOrder.forEach(button => {
                if (button !== selectedButton) {
                    tabButtonsContainer.appendChild(button);
                }
            });
        });
    };

    const restoreOriginalCardOrder = () => {
        if (!tabButtonsContainer) {
            return;
        }

        animateTabButtonReorder(() => {
            Array.from(tabButtonsContainer.querySelectorAll('.tab-button'))
                .sort((leftButton, rightButton) => Number(leftButton.dataset.originalLauncherIndex) - Number(rightButton.dataset.originalLauncherIndex))
                .forEach(button => {
                    tabButtonsContainer.appendChild(button);
                });

            if (tabContent) {
                tabButtonsContainer.insertAdjacentElement('afterend', tabContent);
            }
        });
    };

    const setTabSelectionState = hasActiveTab => {
        if (tabContainer) {
            tabContainer.classList.toggle('has-active-tab', hasActiveTab);
        }
    };

    const scrollActiveTabCardIntoView = selectedButton => {
        if (!tabContainer || !selectedButton) {
            return;
        }

        tabContainer.scrollTop = 0;

        requestAnimationFrame(() => {
            tabContainer.scrollTop = 0;
            if (typeof selectedButton.scrollIntoView === 'function') {
                selectedButton.scrollIntoView({ block: 'start', inline: 'nearest' });
            }
            tabContainer.scrollTop = 0;
        });
    };

    const deactivateTab = async (tabName, nextTabName = null) => {
        if (!tabName) {
            return;
        }

        const prevTabInstance = window[`${tabName}Tab`];
        if (prevTabInstance && typeof prevTabInstance.handleTabChange === 'function') {
           //console.log(`App: Notifying ${tabName}Tab it's being deactivated`);
            prevTabInstance.handleTabChange(false);
        }

        if (tabName === 'documents' && nextTabName !== 'documents' && window.PaiperworkDB) {
            const isStillProcessingDocs = !!(window.RAG_Utils &&
                typeof window.RAG_Utils.isDocumentProcessing === 'function' &&
                window.RAG_Utils.isDocumentProcessing());

            if (!isStillProcessingDocs && typeof window.PaiperworkDB.closeRagDatabases === 'function') {
                await window.PaiperworkDB.closeRagDatabases(sessionStorage.getItem('hashedMasterKey'));
            }
        }

        const leavesHtmlTabs = (tabName === 'artifacts' || tabName === 'presentation') &&
            nextTabName !== 'artifacts' &&
            nextTabName !== 'presentation';

        if (leavesHtmlTabs && window.PaiperworkDB) {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');

            if (typeof window.PaiperworkDB.closePresentationsDatabases === 'function') {
                await window.PaiperworkDB.closePresentationsDatabases(hashedMasterKey);
            }

            if (typeof window.PaiperworkDB.closeArtifactDatabases === 'function') {
                await window.PaiperworkDB.closeArtifactDatabases(hashedMasterKey);
            }
        }

        if (tabName === 'research' && nextTabName !== 'research' && window.PaiperworkDB && typeof window.PaiperworkDB.closeKnowledgeDatabases === 'function') {
            await window.PaiperworkDB.closeKnowledgeDatabases(sessionStorage.getItem('hashedMasterKey'));
        }
    };

    const activateTab = async button => {
        if (!button) {
            return;
        }

       //console.log('App: Tab clicked:', button.dataset.tab);

        const clickedTab = button.dataset.tab;
        const isClosingActiveTab = previousTab === clickedTab && button.classList.contains('active');

        // Remove active class from all buttons and panes
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));

        if (isClosingActiveTab) {
            await deactivateTab(clickedTab, null);
            setTabSelectionState(false);
            restoreOriginalCardOrder();
            previousTab = null;
            return;
        }

        // Add active class to clicked button
        button.classList.add('active');
        setTabSelectionState(true);

        moveSelectedCardToTop(button);

        if (tabButtonsContainer && tabContent) {
            button.insertAdjacentElement('afterend', tabContent);
        }

        scrollActiveTabCardIntoView(button);

        // Get corresponding tab pane and activate it
        const tabId = `${button.dataset.tab}-tab`;
        const tabElement = document.getElementById(tabId);
       //console.log(`App: Looking for tab element: ${tabId}`, !!tabElement);

        if (tabElement) {
            tabElement.classList.add('active');

            // Force repaint to ensure consistent styling
            void tabElement.offsetWidth;
        }
        // Notify the previous tab it's being deactivated (if it has a handler)
        if (previousTab && previousTab !== button.dataset.tab) {
            await deactivateTab(previousTab, button.dataset.tab);
        }
        // Handle specific tab activations
        if (button.dataset.tab === 'models') {
            handleModelsTab();
        } else if (button.dataset.tab === 'chat') {
            await handleChatTab();
        } else if (button.dataset.tab === 'documents') {
            await handleDocumentsTab();
        } else if (button.dataset.tab === 'dataviz') {
            await handleDataVizTab();
        } else if (button.dataset.tab === 'paperwork') {
            await handlePaperworkTab();
        } else if (button.dataset.tab === 'artwork') {
            await handleArtworksTab();
        } else if (button.dataset.tab === 'research') {
            await handleResearchTab();
            if (window.researchTab && typeof window.researchTab.clearModelWarningIfModelSelected === 'function') {
                window.researchTab.clearModelWarningIfModelSelected();
            }
        } else if (button.dataset.tab === 'campaign') {
            await handleCampaignTab();
        } else if (button.dataset.tab === 'presentation') {
            await handlepresentationtab();
        } else if (button.dataset.tab === 'database') {
            await handleDatabaseTab();
        } else if (button.dataset.tab === 'connectors') {
            await handleConnectorsTab();
        }
        // Notify the new tab it's being activated (if it has a handler)
        const newTabInstance = window[`${button.dataset.tab}Tab`];
        if (newTabInstance && typeof newTabInstance.handleTabChange === 'function') {
           //console.log(`App: Notifying ${button.dataset.tab}Tab it's being activated`);
            newTabInstance.handleTabChange(true);
        }
        // Special case: SlideForge tab (ensure UI always renders)
       /* ß */
        // Apply consistent styling to tab container
        if (tabContainer) {
            tabContainer.classList.add('tab-switched');
            setTimeout(() => {
                tabContainer.classList.remove('tab-switched');
            }, 50);
        }

        // If documents tab and progressContainer is showing, disable upload zone
        if (button.dataset.tab === 'documents' &&
            window.RAG_Utils &&
            window.RAG_Utils.documentUIElements &&
            window.RAG_Utils.documentUIElements.progressContainer &&
            window.RAG_Utils.documentUIElements.progressContainer.style.display !== 'none') {

            // Processing in progress - make sure upload zone is hidden
            if (window.RAG_Utils.documentUIElements.uploadZone) {
                window.RAG_Utils.documentUIElements.uploadZone.style.display = 'none';
            }
        }

        previousTab = button.dataset.tab;
    };

    tabButtons.forEach(button => {
        button.addEventListener('click', async () => {
            await activateTab(button);
        });
    });

    window.tabManager = {
        switchTab(tabIdOrName) {
            const normalizedTab = String(tabIdOrName || '').replace(/-tab$/, '');
            const targetButton = document.querySelector(`.tab-button[data-tab="${normalizedTab}"]`);
            if (targetButton) {
                targetButton.click();
            }
        }
    };

    setTabSelectionState(!!document.querySelector('.tab-button.active'));
}

// Handles initialization and UI setup for the DataViz tab
async function handleDataVizTab() {
   //console.log('App: DataViz tab clicked');

    try {
        // Wait for scripts to load first
        if (!window.DataViz) {
           //console.log('App: Waiting for DataViz library to load...');
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.DataViz) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts > 10) { // 2 seconds timeout
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for DataViz to load'));
                    }
                }, 200);
            });
        }

        // Now initialize DataViz
        if (window.dataViz) {
            await window.dataViz.initialize();
           //console.log('App: DataViz library initialized');
        } else {
           //console.log('App: Creating new DataViz instance');
            window.dataViz = new window.DataViz();
            await window.dataViz.initialize();
        }

        // Similarly wait for DataVizTab
        if (!window.DataVizTab) {
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.DataVizTab) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts > 10) {
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for DataVizTab to load'));
                    }
                }, 200);
            });
        }

        // Initialize DataViz UI
        if (window.dataVizTab) {
           //console.log('App: Initializing DataViz UI');
            await window.dataVizTab.initialize();
        } else {
           //console.log('App: Creating new DataVizTab instance');
            window.dataVizTab = new window.DataVizTab();
            await window.dataVizTab.initialize();
        }
    } catch (error) {
        console.error('App: Error initializing DataViz:', error);

        // Show error message in the tab
        const datavizTab = document.getElementById('dataviz-tab');
        if (datavizTab) {
            datavizTab.innerHTML = `
            <div class="dataviz-error" style="padding: 20px; text-align: center; color: #e74c3c;">
                <h3>${Lang.get('errorLoadingModels')}</h3>
                <p>${error.message || Lang.get('errorTryAgain')}</p>
                <button onclick="window.tabLoader.retryLoad('dataviz')" 
                        style="padding: 8px 16px; margin-top: 10px; background: var(--accent-color, #4f46e5); color: white; border: none; border-radius: 4px; cursor: pointer;">
                    ${Lang.get('retryButton')}
                </button>
            </div>
        `;
        }
    }
}

// Handles initialization for the Connectors tab
async function handleConnectorsTab() {
    // Wait briefly for tab scripts to load in case this is invoked before loadTabScripts finishes.
    let attempts = 0;
    while (!window.ConnectorsTab && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (!window.connectorsTab && window.ConnectorsTab) {
        window.connectorsTab = new window.ConnectorsTab();
    }

    if (window.connectorsTab && typeof window.connectorsTab.initialize === 'function') {
        try {
            window.connectorsTab.initialize();
        } catch (err) {
            console.error('App: Error initializing ConnectorsTab:', err);
        }
    } else {
        console.warn('App: ConnectorsTab is unavailable');
    }
}

// Handles refreshing and setting the model selector in the Chat tab
async function handleChatTab() {
   //console.log('Chat tab clicked - refreshing model list');
    const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
    const lastDeletedModel = sessionStorage.getItem('lastDeletedModel');

    // Give the DOM time to update after tab switch
    setTimeout(async () => {
        const settings = await PaiperworkDB.loadSettings(hashedMasterKey);
                       
        const modelSelector = document.getElementById('model-selector');
       //console.log('Model selector present:', !!modelSelector);

        if (modelSelector) {
            try {
                // Preserve current UI selection as a fallback for tab switches.
                const previousOption = modelSelector.options[modelSelector.selectedIndex] || null;
                const previousModel = modelSelector.value || '';
                const previousProvider = (previousOption && previousOption.dataset && previousOption.dataset.provider)
                    ? previousOption.dataset.provider
                    : ((window.OllamaAPI && typeof window.OllamaAPI.getModelSource === 'function')
                        ? (window.OllamaAPI.getModelSource(previousModel) || 'local')
                        : 'local');

                // Clear existing options
                modelSelector.innerHTML = `<option value="">${Lang.get('selectModel')}</option>`;

                // Wait for models to load and populate
                const modelsLoaded = await OllamaAPI.loadOllamaModels();
                if (!modelsLoaded) {
                    console.warn('App: Skipping model restore because model list failed to load');
                    return;
                }

                // IMPORTANT: Prefer the model that is currently selected in UI memory.
                // Database-backed settings are now the single source of truth for persisted selection.
                const targetModel = previousModel || ((settings && settings.model) ? settings.model : '');
                const targetProvider = previousModel
                    ? previousProvider
                    : ((settings && settings.modelProvider && String(settings.modelProvider).trim())
                        ? String(settings.modelProvider).trim().toLowerCase()
                        : previousProvider);

                // Check if previously selected model still exists
                if (targetModel) {
                   //console.log('Checking for previously selected model:', settings.model);
                    const desiredProvider = targetProvider;

                    const exactProviderOption = Array.from(modelSelector.options).find(option =>
                        option.value === targetModel &&
                        option.dataset &&
                        option.dataset.provider === desiredProvider
                    );

                    const modelExists = !!exactProviderOption || Array.from(modelSelector.options)
                        .some(option => option.value === targetModel);

                    if (modelExists) {
                        if (exactProviderOption) {
                            modelSelector.value = exactProviderOption.value;
                            modelSelector.selectedIndex = exactProviderOption.index;
                        } else {
                            modelSelector.value = targetModel;
                        }
                       //console.log('Successfully set model to:', targetModel);
                    } else {
                        // Check if this was the model we just deleted
                        if (lastDeletedModel && lastDeletedModel === targetModel) {
                            alert(Lang.get('modelDeleted').replace('{model}', targetModel));
                            sessionStorage.removeItem('lastDeletedModel'); // Clear the reference
                        }
                        // Only clear persisted model if it came from settings; do not clear
                        // when this was only an in-memory fallback selection.
                        if (settings && settings.model) {
                            await PaiperworkDB.saveModel(hashedMasterKey, '');
                        }
                        console.warn('Previously selected model not found:', targetModel);
                    }
                }
            } catch (error) {
                console.error('Error setting model:', error);
            }

            updateChatModelSelectorHint();
        }
    }, 100);
}

// Initializes or refreshes the Documents tab and its UI
async function handleDocumentsTab() {
   //console.log('App: Documents tab clicked');

    // Keep model list in sync with current local/cloud state (same behavior intent as Chat tab).
    const modelSelector = document.getElementById('model-selector');
    if (modelSelector && window.OllamaAPI && typeof window.OllamaAPI.loadOllamaModels === 'function') {
        try {
            const previousOption = modelSelector.options[modelSelector.selectedIndex] || null;
            const previousModel = modelSelector.value || '';
            const previousProvider = (previousOption && previousOption.dataset && previousOption.dataset.provider)
                ? previousOption.dataset.provider
                : ((window.OllamaAPI && typeof window.OllamaAPI.getModelSource === 'function')
                    ? (window.OllamaAPI.getModelSource(previousModel) || 'local')
                    : 'local');

            const modelsLoaded = await window.OllamaAPI.loadOllamaModels();
            if (modelsLoaded && previousModel) {
                const exactProviderOption = Array.from(modelSelector.options).find(option =>
                    option.value === previousModel &&
                    option.dataset &&
                    option.dataset.provider === previousProvider
                );

                const fallbackOption = Array.from(modelSelector.options).find(option =>
                    option.value === previousModel
                );

                const optionToRestore = exactProviderOption || fallbackOption;
                if (optionToRestore) {
                    modelSelector.value = optionToRestore.value;
                    modelSelector.selectedIndex = optionToRestore.index;
                }
            }
        } catch (modelRefreshError) {
            console.error('App: Error refreshing model list for Documents tab:', modelRefreshError);
        }
    }

    // Create a helper function to initialize or refresh documents
    const initOrRefreshDocuments = async (retry = false) => {
        if (window.RAG_Utils) {
            if (!window.RAG_Utils.initialized) {
               //console.log('App: Initializing document UI');
                window.RAG_Utils.initializeDocumentUI();
                // Additional wait to ensure documents load
                setTimeout(() => {
                    window.RAG_Utils.updateDocumentsList(true).catch(error => {
                        console.error('App: Error updating documents list after init:', error);
                    });
                }, 200);
            } else {
               //console.log('App: Document UI already initialized, refreshing document list');
                window.RAG_Utils.updateDocumentsList(true).catch(error => {
                    console.error('App: Error updating documents list:', error);
                });
            }
            return true;
        }
        return false;
    };

    // First attempt to initialize or refresh documents
    let success = await initOrRefreshDocuments();
    if (success && window.RAG_Utils && typeof window.RAG_Utils.refreshEmbeddingModelSelectorWithPrompt === 'function') {
        window.RAG_Utils.refreshEmbeddingModelSelectorWithPrompt();
    }

    // If RAG_Utils isn't available yet, wait and retry with increasing intervals
    if (!success) {
       //console.log('App: RAG_Utils not available, waiting 100ms...');
        await new Promise(resolve => setTimeout(resolve, 100));
        success = await initOrRefreshDocuments();
        if (success && window.RAG_Utils && typeof window.RAG_Utils.refreshEmbeddingModelSelectorWithPrompt === 'function') {
            window.RAG_Utils.refreshEmbeddingModelSelectorWithPrompt();
        }

        if (!success) {
           //console.log('App: RAG_Utils still not available, waiting 300ms...');
            await new Promise(resolve => setTimeout(resolve, 300));
            success = await initOrRefreshDocuments(true);
            if (success && window.RAG_Utils && typeof window.RAG_Utils.refreshEmbeddingModelSelectorWithPrompt === 'function') {
                window.RAG_Utils.refreshEmbeddingModelSelectorWithPrompt();
            }

            if (!success) {
                console.error('App: RAG_Utils still not available after multiple attempts');

                // Create placeholder UI
                const documentsTab = document.getElementById('documents-tab');
                if (documentsTab) {
                    documentsTab.innerHTML = `
                    <div class="documents-area">
                        <div class="empty-state">
                            <p>${Lang.get('documentSystemUnavailable')}</p>
                            <p>${Lang.get('refreshPage')}</p>
                        </div>
                    </div>
                `;
                }
            }
        }
    }
}

// Initializes and displays the Paperwork tab and its tools
async function handlePaperworkTab() {
   //console.log('App: Paperwork tab clicked');

    try {
        // Get the paperwork tab element
        const paperworkTab = document.getElementById('paperwork-tab');

        // Clear any existing content first to ensure we start fresh
        if (paperworkTab) {
            paperworkTab.innerHTML = `<div style="text-align:center; padding:20px;">${Lang.get('loadingDocumentTools')}</div>`;
            paperworkTab.removeAttribute('data-initialized');
        }

        // Check if Paperwork class is available
        if (!window.Paperwork) {
            //console.warn('App: Paperwork class not loaded, waiting...');

            // Wait for Paperwork class to be available with timeout
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 10;
                const checkInterval = setInterval(() => {
                    if (window.Paperwork) {
                        clearInterval(checkInterval);
                        resolve();
                    } else if (++attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        reject(new Error('Paperwork class failed to load'));
                    }
                }, 200);
            });
        }

        // Create a new Paperwork instance if it doesn't exist yet
        if (!window.paperworkInstance) {
           //console.log('App: Creating new Paperwork instance');
            window.paperworkInstance = new window.Paperwork();

            // Initialize the paperwork instance
            await window.paperworkInstance.initialize();
        }

        // Wait for PaperworkTab to be available
        if (!window.paperworkTab) {
           //console.log('App: Waiting for PaperworkTab to load...');
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 10;
                const checkInterval = setInterval(() => {
                    if (window.paperworkTab) {
                        clearInterval(checkInterval);
                        resolve();
                    } else if (++attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        reject(new Error('PaperworkTab instance failed to load'));
                    }
                }, 200);
            });

            // Initialize PaperworkTab if it hasn't been initialized
            if (!window.paperworkTab.initialized) {
                await window.paperworkTab.initialize();
            }
        }

        // Now call showPaperworkTab from the global paperworkTab instance
       //console.log('App: Showing paperwork tab content');
        window.paperworkTab.showPaperworkTab();

    } catch (error) {
        console.error('App: Error initializing Paperwork:', error);

        // Show error message in the paperwork tab
        const paperworkTab = document.getElementById('paperwork-tab');
        if (paperworkTab) {
            paperworkTab.innerHTML = `
                <div style="text-align:center; padding:20px; color:#e74c3c;">
                    <h3>${Lang.get('failedLoadDocumentTools')}</h3>
                    <p>${error.message}</p>
                    <button onclick="handlePaperworkTab()" 
                            style="padding:8px 16px; background:#4f46e5; color:white; 
                            border:none; border-radius:4px; margin-top:10px; cursor:pointer;">
                        ${Lang.get('retryButton')}
                    </button>
                </div>
            `;
        }
    }
}

// Initializes and displays the Research tab and its tools
async function handleResearchTab() {
   //console.log('App: Research tab clicked');

    try {
        // Ensure research scripts are at least requested (use tabLoader if available)
        if (!window.ResearchTab && window.tabLoader && typeof window.tabLoader.loadTabScripts === 'function') {
           //console.log('App: Loading research tab scripts via tabLoader');
            try {
                await window.tabLoader.loadTabScripts('research');
            } catch (loadErr) {
                console.warn('App: tabLoader.loadTabScripts(research) failed', loadErr);
            }
        }

        // Wait for Research classes to be available
        if (!window.ResearchTab) {
           //console.log('App: Waiting for ResearchTab to load...');
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = (window.tabLoader && typeof window.tabLoader.getTabLoadMaxAttempts === 'function') ? window.tabLoader.getTabLoadMaxAttempts() : 100;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.ResearchTab) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for Research module'));
                    }
                }, 200);
            });
        }

        // Initialize Research tab
        if (window.researchTab) {
           //console.log('App: Research module already initialized');
            if (!window.researchTab.initialized) {
                await window.researchTab.initialize();
            } else {
                // Simply notify the tab that it's being activated
                if (typeof window.researchTab.handleTabChange === 'function') {
                    window.researchTab.handleTabChange(true);
                }
            }
        } else {
           //console.log('App: Creating new ResearchTab instance');
            window.researchTab = new ResearchTab();
            await window.researchTab.initialize();
        }
    } catch (error) {
        console.error('App: Error initializing Research tab:', error);

        // Show error message
        const researchTab = document.getElementById('research-tab');
        if (researchTab) {
            researchTab.innerHTML = `
                <div style="text-align:center; padding:20px; color:#e74c3c;">
                    <h3>${Lang.get('failedLoadResearchTools')}</h3>
                    <p>${error.message}</p>
                    <button onclick="handleResearchTab()" 
                            style="padding:8px 16px; background:#4f46e5; color:white; 
                            border:none; border-radius:4px; margin-top:10px; cursor:pointer;">
                     ${Lang.get('retryButton')}
                    </button>
                </div>
            `;
        }
    }
}

// Initializes and displays the Artworks tab and its tools
async function handleArtworksTab() {
   //console.log('App: Artwork tab clicked');

    try {
        // Wait for scripts to load first
        if (!window.Artworks) {
           //console.log('App: Waiting for Artworks library to load...');
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.Artworks) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts > 10) { // 2 seconds timeout
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for Artworks to load'));
                    }
                }, 200);
            });
        }

        // Now initialize Artworks instance if needed
        if (!window.artworksInstance) {
           //console.log('App: Creating new Artworks instance');
            window.artworksInstance = new window.Artworks();
            await window.artworksInstance.initialize();
        }

        // Wait for ArtworksTab
        if (!window.ArtworksTab) {
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.ArtworksTab) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts > 10) {
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for ArtworksTab to load'));
                    }
                }, 200);
            });
        }

        // Initialize ArtworksTab UI
        if (window.artworksTab) {
           //console.log('App: Initializing Artworks UI');
            await window.artworksTab.initialize();
        } else {
           //console.log('App: Creating new ArtworksTab instance');
            window.artworksTab = new window.ArtworksTab();
            await window.artworksTab.initialize();
        }

        // Reset Ollama context to ensure no lingering images
        OllamaAPI.resetContext();

    } catch (error) {
        console.error('App: Error initializing Artworks:', error);

        // Show error message in the tab
        const artworkTab = document.getElementById('artwork-tab');
        if (artworkTab) {
            artworkTab.innerHTML = `
                <div class="artwork-error" style="padding: 20px; text-align: center; color: #e74c3c;">
                    <h3>${Lang.get('errorLoadingVisualModels') || 'Error Loading Visual Models'}</h3>
                    <p>${error.message || Lang.get('errorTryAgain') || 'Please try again later.'}</p>
                    <button onclick="window.handleArtworksTab()" 
                            style="padding: 8px 16px; margin-top: 10px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ${Lang.get('retryButton') || 'Retry'}
                    </button>
                </div>
            `;
        }
    }
}

async function handleCampaignTab() {
    try {
        if (window.tabLoader && typeof window.tabLoader.loadTabScripts === 'function') {
            await window.tabLoader.loadTabScripts('campaign');
        }

        if (!window.CampaignTab) {
            throw new Error('CampaignTab is not available');
        }

        if (window.campaignTab) {
            await window.campaignTab.initialize();
        } else {
            window.campaignTab = new window.CampaignTab();
            await window.campaignTab.initialize();
        }
    } catch (error) {
        console.error('Error initializing Campaign tab:', error);

        const campaignTab = document.getElementById('campaign-tab');
        if (campaignTab) {
            campaignTab.innerHTML = `
                <div style="text-align:center; padding:20px; color:#e74c3c;">
                    <h3>${Lang.get('failedLoadCampaignStudio') || 'Failed to load Campaign Studio'}</h3>
                    <p>${error.message}</p>
                    <button onclick="window.handleCampaignTab()"
                            style="padding:8px 16px; background:#4f46e5; color:white;
                            border:none; border-radius:4px; margin-top:10px; cursor:pointer;">
                       ${Lang.get('retryButton') || 'Retry'}
                    </button>
                </div>
            `;
        }
    }
}

// Initializes and displays the SlideForge tab and its document processing tools
async function handlepresentationtab() {
   //console.log('App: SlideForge tab clicked');

    const isOnlineMode = (() => {
        if (window.PAIPERWORK_CLOUD_ONLY === true) return true;
        if (window.PAIPERWORK_IS_LOCAL_RUNTIME === true) return false;
        const host = String(window.location.hostname || '').toLowerCase();
        const protocol = String(window.location.protocol || '').toLowerCase();
        const isLocal = host === 'localhost'
            || host === '127.0.0.1'
            || host === '::1'
            || host === '0.0.0.0'
            || /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[0-1])\.)/.test(host)
            || protocol === 'file:'
            || protocol === 'app:'
            || protocol === 'tauri:'
            || protocol === 'capacitor:'
            || protocol === 'electron:';
        return !isLocal;
    })();

    const maxAttempts = isOnlineMode ? 90 : 10;
    const intervalMs = 200;

    try {
        // Wait for scripts to load first
        if (!window.presentation) {
           //console.log('App: Waiting for SlideForge library to load...');
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.presentation) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts > maxAttempts) {
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for SlideForge to load'));
                    }
                }, intervalMs);
            });
        }

        // Now initialize SlideForge instance if needed
        if (!window.presentation) {
           //console.log('App: Creating new SlideForge instance');
            window.presentation = new window.presentation();
            await window.presentation.initialize();
        }

        // Wait for presentationtab
        if (!window.presentationtab) {
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.presentationtab) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts > maxAttempts) {
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for presentationtab to load'));
                    }
                }, intervalMs);
            });
        }

        // Initialize presentationtab UI
        if (window.presentationtab) {
           //console.log('App: Initializing SlideForge UI');
            await window.presentationtab.initialize();
        } else {
           //console.log('App: Creating new presentationtab instance');
            window.presentationtab = new window.presentationtab();
            await window.presentationtab.initialize();
        }

    } catch (error) {
        console.error('App: Error initializing SlideForge:', error);

        // Show error message in the tab
        const presentationtab = document.getElementById('presentation-tab');
        if (presentationtab) {
            presentationtab.innerHTML = `
                <div class="presentation-error" style="padding: 20px; text-align: center; color: #e74c3c;">
                    <h3>${Lang.get('errorLoadingSlideForgeTools') || 'Error Loading SlideForge Tools'}</h3>
                    <p>${error.message || Lang.get('errorTryAgain') || 'Please try again later.'}</p>
                    <button onclick="window.handlepresentationtab()" 
                            style="padding: 8px 16px; margin-top: 10px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ${Lang.get('retryButton') || 'Retry'}
                    </button>
                </div>
            `;
        }
    }
}

// Initializes and displays the Models tab and its model downloader UI
async function handleModelsTab() {

   //console.log('Models tab clicked - initializing model downloader UI');

    try {
        // Wait for ModelDownloader to be available
        if (!window.ModelDownloader) {
           //console.log('Waiting for ModelDownloader to load...');
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.ModelDownloader) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts > 50) { // 5 seconds timeout
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for ModelDownloader'));
                    }
                }, 100);
            });
        }

        // Initialize ModelDownloader first
        if (typeof window.ModelDownloader.initialize === 'function') {
            window.ModelDownloader.initialize();
        }
        // Initialize UI immediately with empty models array
        // This will create the UI structure and immediately start loading local models
        window.ModelDownloader.displayModels([]);



    } catch (error) {
        console.error('Error in models tab:', error);
        const modelsTab = document.getElementById('models-tab');
        if (modelsTab) {
            modelsTab.innerHTML = `
                <div class="error-message" style="padding: 20px; text-align: center; color: #e74c3c;">
                    <h3>${Lang.get('errorLoadingModels')}</h3>
                    <p>${error.message}</p>
                    <button onclick="window.tabLoader.retryLoad('models')" 
                            style="padding: 8px 16px; margin-top: 10px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        ${Lang.get('retryButton')}
                    </button>
                </div>
            `;
        }
    }

}

// Initializes and displays the Database tab and its management UI
async function handleDatabaseTab() {
   //console.log('Database tab clicked');

    try {
        // Check if DatabaseTab is available
        if (!window.DatabaseTab) {
           //console.log('Waiting for DatabaseTab to load...');
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.DatabaseTab) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                    if (attempts > 10) { // 2 seconds timeout
                        clearInterval(checkInterval);
                        reject(new Error('Timeout waiting for DatabaseTab to load'));
                    }
                }, 200);
            });
        }

        // Initialize Database tab
        if (window.databaseTab) {
           //console.log('Database module already initialized');
            if (!window.databaseTab.initialized) {
                await window.databaseTab.initialize();
            } else {
                // Simply notify the tab that it's being activated
                if (typeof window.databaseTab.handleTabChange === 'function') {
                    window.databaseTab.handleTabChange(true);
                }
            }
        } else {
           //console.log('Creating new DatabaseTab instance');
            window.databaseTab = new DatabaseTab();
            await window.databaseTab.initialize();
        }
    } catch (error) {
        console.error('Error initializing Database tab:', error);

        // Show error message
        const databaseTab = document.getElementById('database-tab');
        if (databaseTab) {
            databaseTab.innerHTML = `
                <div style="text-align:center; padding:20px; color:#e74c3c;">
                    <h3>${Lang.get('failedLoadDatabaseManagement')}</h3>
                    <p>${error.message}</p>
                    <button onclick="handleDatabaseTab()" 
                            style="padding:8px 16px; background:#4f46e5; color:white; 
                            border:none; border-radius:4px; margin-top:10px; cursor:pointer;">
                       ${Lang.get('retryButton')}
                    </button>
                </div>
            `;
        }
    }
}

// Sets up event handlers and styles for the chat interface
function setupChatHandlers(sendButton, promptInput) {
    const aiReplies = document.querySelector('.ai-replies');

}

// Cancels the current Ollama generation process and resets UI state
function cancelOllamaGeneration() {
   //console.log('App: Delegating cancellation to Chat instance');

    // Simply delegate to ChatTab or Chat
    if (window.chatTab) {
        // Let ChatTab handle the cancellation entirely
        if (typeof window.chatTab.handleCancelGeneration === 'function') {
            return window.chatTab.handleCancelGeneration();
        }
    }

    // Fall back to Chat if ChatTab isn't available
    if (window.chat && window.chat.initialized) {
        return window.chat.cancelOllamaGeneration();
    }

    // Last resort fallback
    console.warn('App: No chat instances available for cancellation');

    // Reset UI state as a last resort
    const sendButton = document.getElementById('send-prompt');
    if (sendButton) {
        sendButton.textContent = Lang.get('sendButton');
        sendButton.style.backgroundColor = '';
        sendButton.style.color = '';
        sendButton.classList.remove('cancel-state');
    }

    // Additionally, abort any global abort controller used by other flows (e.g., Documents tab)
    try {
        if (window.globalAbortController) {
            try {
                window.globalAbortController.abort();
            } catch (e) {
                // ignore
            }
            window.globalAbortController = null;
        }
    } catch (err) {
        console.warn('App: Error aborting globalAbortController during cancel:', err);
    }

    window.isGenerating = false;
    return false;
}

window.cancelOllamaGeneration = cancelOllamaGeneration;
window.handlePaperworkTab = handlePaperworkTab;
window.handleArtworksTab = handleArtworksTab;
window.handleCampaignTab = handleCampaignTab;
window.handlepresentationtab = handlepresentationtab;
window.handleDatabaseTab = handleDatabaseTab;