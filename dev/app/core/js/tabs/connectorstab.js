class ConnectorsTab {
    constructor() {
        this.isInitialized = false;
        this.tabElement = document.getElementById('connectors-tab');
        this.whatsappButton = null;
        this.isPaired = false;
        this.serverStarted = false;
        this.serverStarting = false;
        this.serverStopping = false;
        this.pollInterval = null; // status button poll interval
        this.qrPollInterval = null; // QR modal poll interval
        this.qrCountdownInterval = null;
        this.qrCountdownSeconds = 0;
        this.qrRefreshNoticeTimeout = null;
        this.lastQrDataUrl = '';
        this.lastQrSignature = '';
        this.lastQrTimestamp = 0;
        this.whatsappQrTTL = 20000;
        this.whatsappQrWaitingForRefresh = false;
        this._currentQrObjectUrl = null;
        this.whatsappRequestGeneration = 0;
        this.whatsappPendingFetchControllers = new Set();
        this.whatsappQrRetryTimeout = null;
        this.whatsappManualStopRequested = false;
        this.whatsappWebsocketShouldReconnect = false;
        this.whatsappPairModalDismissed = false;
        this.whatsappRestartBlockedUntil = 0;
        this.whatsappRestartCooldownTimer = null;
        // Incoming WhatsApp polling state (messages from gateway)
        this.incomingPollInterval = null;
        this.incomingPollIntervalMs = 2500;

        this.whatsappWs = null;
        this.whatsappWsReconnectTimer = null;
        this.whatsappWsStartupTimer = null;
        this.whatsappMode = null; // personal or bot
        this.whatsappPersonalModeButton = null;
        this.whatsappBotModeButton = null;
        this.whatsappModelLockButton = null;
        this.whatsappPairNewDeviceButton = null;
        this.whatsappDeleteAllPairedButton = null;
        this.whatsappModelLocked = false;
        this.whatsappUnpairButton = null;
        this.savedWhatsappDeviceId = null;
        this.savedWhatsappDevices = [];
        this.whatsappFreshPairRequested = false;
        this.whatsappFreshPairDeviceId = null;
        this.whatsappSessionImportedForDevice = null;
        this.whatsappSessionRestoreSkippedForDevice = null;
        this.whatsappSessionRestoreStatus = '';
        this.whatsappStalePreferredDeviceCleared = null;
        this.whatsappRemoteLogoutNoticeShown = null;
        this.whatsappModalPhase = 'starting';
        this.whatsappQrGraceUntil = 0;
        this.whatsappQrGraceMs = 5000;
        this._boundWhatsappPairingWindowCloseHandler = () => {
            this._handleWhatsappPairingWindowClose();
        };
    }

    initialize() {
        if (this.isInitialized || !this.tabElement) {
            return;
        }

        const descriptionText = Lang.get('connectorsDescription') ||
            'Connectors allow you to connect to your Whatsapp account and chat with your selected Ai models in Chat Tab';

        this.tabElement.innerHTML = `
            <div class="connectors-container">
                <p class="connectors-description">
                    ${descriptionText}
                </p>

                <div class="connectors-card connectors-card-whatsapp">
                    <div id="whatsapp-status-card" class="connectors-status-card">
                        ${Lang.get('whatsappNotPairedCard') || 'WhatsApp not paired'}
                    </div>
                    <div class="whatsapp-button-container">
                        <button id="whatsapp-pair-btn" class="connectors-whatsapp-button" title="${Lang.get('startServerButton') || 'Start server'}">${Lang.get('startServerButton') || 'Start server'}</button>
                    </div>
                    <div class="whatsapp-mode-button-container">
                        <button id="whatsapp-personal-mode-btn" class="connectors-mode-button" title="${Lang.get('whatsappPersonalModeButtonTitle') || 'Personal mode'}">${Lang.get('whatsappPersonalModeButton') || 'Personal'}</button>
                        <button id="whatsapp-bot-mode-btn" class="connectors-mode-button" title="${Lang.get('whatsappBotModeButtonTitle') || 'Bot mode'}">${Lang.get('whatsappBotModeButton') || 'Bot'}</button>
                    </div>
                    <div class="whatsapp-model-lock-button-container">
                        <button id="whatsapp-model-lock-btn" class="connectors-mode-button connectors-mode-button-full" title="Lock AI model">Lock AI model</button>
                    </div>
                    <div class="whatsapp-new-device-button-container" style="margin-top:16px;">
                        <button id="whatsapp-pair-new-device-btn" class="connectors-mode-button connectors-mode-button-full" title="Pair a new WhatsApp device">Pair new device</button>
                    </div>
                    <div class="whatsapp-delete-all-devices-button-container" style="margin-top:12px;">
                        <button id="whatsapp-delete-all-paired-btn" class="connectors-mode-button connectors-mode-button-full connectors-mode-button-danger" title="Deleted paired device(s)">Deleted paired device(s)</button>
                    </div>
                </div>

            </div>
        `;

        this.whatsappButton = document.getElementById('whatsapp-pair-btn');
        if (this.whatsappButton) {
            this.setupWhatsappButton();
        }

        this.isInitialized = true;

        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', this._boundWhatsappPairingWindowCloseHandler);
            window.addEventListener('pagehide', this._boundWhatsappPairingWindowCloseHandler);
        }
    }

    setupWhatsappButton() {
        if (!this.whatsappButton) return;

        //console.log('ConnectorsTab: setupWhatsappButton called');

        // Reference mode buttons
        this.whatsappPersonalModeButton = document.getElementById('whatsapp-personal-mode-btn');
        this.whatsappBotModeButton = document.getElementById('whatsapp-bot-mode-btn');
        this.whatsappModelLockButton = document.getElementById('whatsapp-model-lock-btn');
        this.whatsappPairNewDeviceButton = document.getElementById('whatsapp-pair-new-device-btn');
        this.whatsappDeleteAllPairedButton = document.getElementById('whatsapp-delete-all-paired-btn');

        if (this.whatsappPersonalModeButton) {
            this.whatsappPersonalModeButton.addEventListener('click', async () => {
                await this.setWhatsappMode('personal');
            });
        }
        if (this.whatsappBotModeButton) {
            this.whatsappBotModeButton.addEventListener('click', async () => {
                await this.setWhatsappMode('bot');
            });
        }
        if (this.whatsappModelLockButton) {
            this.whatsappModelLockButton.addEventListener('click', async () => {
                await this.setWhatsappModelLock(!this.whatsappModelLocked);
            });
        }
        if (this.whatsappPairNewDeviceButton) {
            this.whatsappPairNewDeviceButton.addEventListener('click', async () => {
                if (this._isWhatsappPairNewDeviceBlocked()) {
                    return;
                }
                await this.startWhatsappFreshPairing();
            });
        }
        if (this.whatsappDeleteAllPairedButton) {
            this.whatsappDeleteAllPairedButton.addEventListener('click', async () => {
                await this.deleteAllPairedWhatsappDevices();
            });
        }


        // Initialize mode state from DB
        this.loadWhatsappModeFromDb().catch(err => {
            console.warn('ConnectorsTab: loadWhatsappModeFromDb failed', err);
            this.setWhatsappMode(null);
        });
        this.loadWhatsappModelLockFromDb().catch(err => {
            console.warn('ConnectorsTab: loadWhatsappModelLockFromDb failed', err);
            this.setWhatsappModelLock(false, true);
        });

        // Load any saved device from persistent Paiperwork DB and sync to server state
        this._loadSavedWhatsappDeviceInfo().then(async info => {
            if (this._hasMultipleSavedWhatsappDevices()) {
                this.savedWhatsappDeviceId = null;
                try {
                    await this._clearPreferredWhatsappDeviceOnServer('multiple-saved-devices-awaiting-selection');
                } catch (syncErr) {
                    console.warn('ConnectorsTab: initial preferred-device clear failed', syncErr);
                }
                return;
            }

            if (info && this.savedWhatsappDeviceId) {
                try {
                    await this._syncPreferredWhatsappDeviceWithServer(false);
                } catch (syncErr) {
                    console.warn('ConnectorsTab: initial preferred-device sync failed', syncErr);
                }
            }
        }).catch(err => {
            console.warn('ConnectorsTab: initial _loadSavedWhatsappDeviceInfo failed', err);
        });

        // Initialize button state
        this.setWhatsappPairButtonState(false);

        // Check connection once at startup (no continuous polling until user starts pairing).
        (async () => {
            await this._loadSavedWhatsappDeviceInfo();

            if (this._hasMultipleSavedWhatsappDevices()) {
                this.savedWhatsappDeviceId = null;
                await this._clearPreferredWhatsappDeviceOnServer('multiple-saved-devices-awaiting-selection');
                return;
            }

            await this._syncPreferredWhatsappDeviceWithServer(false);
            const status = await this.refreshWhatsappPairButton({ check: true });
            if (status && status.gatewayRunning) {
                this.serverStarted = true;
                const alreadyPaired = !!status.loggedIn;
                this.setWhatsappPairButtonState(alreadyPaired);
                if (!alreadyPaired) {
                    this.openWhatsappPairModal();
                }
            }
        })();

        // Add click event listener
        this.whatsappButton.addEventListener('click', async () => {
            //console.log('ConnectorsTab: whatsapp button click detected');
            if (this.serverStopping) {
                return;
            }
            if (!this.serverStarted) {
                await this.startWhatsappServer();
                return;
            }
            await this.stopWhatsappServer();
        });
    }

    _beginWhatsappRequestGeneration() {
        this.whatsappManualStopRequested = false;
        this.whatsappRequestGeneration += 1;
        return this.whatsappRequestGeneration;
    }

    _setWhatsappFreshPairRequested(isFreshPair) {
        this.whatsappFreshPairRequested = !!isFreshPair;
        if (!this.whatsappFreshPairRequested) {
            this.whatsappFreshPairDeviceId = null;
        }
    }

    async _setWhatsappPreferredDeviceOnServer(deviceId = '', meta = '') {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!hashedMasterKey) return;

        try {
            const params = this._appendWhatsappUserScope(new URLSearchParams());
            const res = await fetch('/api/whatsapp/preferred-device?' + params.toString(), {
                method: 'POST',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    device_id: String(deviceId || '').trim(),
                    meta: typeof meta === 'string' ? meta : JSON.stringify(meta || {})
                })
            });
            if (!res.ok) {
                console.warn('ConnectorsTab: _setWhatsappPreferredDeviceOnServer failed', await res.text());
            }
        } catch (err) {
            console.warn('ConnectorsTab: _setWhatsappPreferredDeviceOnServer failed', err);
        }
    }

    _getWhatsappStopRequestUrl() {
        const stopParams = this._appendWhatsappUserScope(new URLSearchParams({ stop: 'true' }));
        return '/api/whatsapp/qr?' + stopParams.toString();
    }

    async _requestWhatsappServerStop(options = {}) {
        const { keepalive = false } = options;
        const stopUrl = this._getWhatsappStopRequestUrl();
        const headers = this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' });
        return fetch(stopUrl, {
            method: 'POST',
            headers,
            keepalive: !!keepalive
        });
    }

    _teardownWhatsappPairModalUi() {
        this.whatsappPairModalDismissed = true;
        this.closeWhatsappPairModal();
        try {
            if (this._currentQrObjectUrl) {
                URL.revokeObjectURL(this._currentQrObjectUrl);
                this._currentQrObjectUrl = null;
            }
        } catch (_) {}
        this.stopPolling();
        this.stopWhatsappModalCountdown();
        this.clearWhatsappQrCountdown();
    }

    async _cancelWhatsappPairingAndStopServer(source = 'modal-close') {
        console.log('ConnectorsTab: _cancelWhatsappPairingAndStopServer', {
            source,
            serverStarted: this.serverStarted,
            serverStarting: this.serverStarting,
            serverStopping: this.serverStopping,
            isPaired: this.isPaired
        });

        this._teardownWhatsappPairModalUi();

        if (this.serverStarted || this.serverStarting || this.serverStopping) {
            await this.stopWhatsappServer();
            return;
        }

        this.setWhatsappPairButtonState(this.isPaired);
    }

    _handleWhatsappPairingWindowClose() {
        if (this.isPaired) {
            return;
        }

        const modal = document.getElementById('wa-pair-modal');
        if (!modal) {
            return;
        }

        if (!(this.serverStarted || this.serverStarting || this.serverStopping)) {
            return;
        }

        this.whatsappPairModalDismissed = true;
        this.whatsappWebsocketShouldReconnect = false;
        this.stopPolling();
        this.stopWhatsappModalCountdown();

        const stopUrl = this._getWhatsappStopRequestUrl();
        try {
            if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
                navigator.sendBeacon(stopUrl, new Blob([], { type: 'application/json' }));
                return;
            }
        } catch (_) {}

        try {
            fetch(stopUrl, {
                method: 'POST',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' }),
                keepalive: true
            }).catch(() => {});
        } catch (_) {}
    }

    _getWhatsappSelectedModel() {
        const modelSelector = document.getElementById('model-selector');
        return modelSelector && modelSelector.value ? String(modelSelector.value).trim() : '';
    }

    _ensureWhatsappModelSelected() {
        const selectedModel = this._getWhatsappSelectedModel();
        if (selectedModel) {
            return true;
        }

        const errorMsg = (window.Lang && typeof Lang.get === 'function' && Lang.get('whatsappNoModelSelected')) || 'No AI model selected, please select a model in Chat Tab first.';
        this.setWhatsappPairButtonState(false);
        this._showNoModelSelectedModal(errorMsg);
        return false;
    }

    _getWhatsappUserScopedHeaders(extraHeaders = null) {
        const headers = { ...(extraHeaders || {}) };
        const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
        if (hashedMasterKey) {
            headers['X-Paiperwork-User'] = hashedMasterKey;
        }
        return headers;
    }

    _appendWhatsappUserScope(params) {
        const resolvedParams = params instanceof URLSearchParams ? params : new URLSearchParams(params || '');
        const hashedMasterKey = String(sessionStorage.getItem('hashedMasterKey') || '').trim();
        if (hashedMasterKey) {
            resolvedParams.set('user', hashedMasterKey);
        }
        return resolvedParams;
    }

    _resolveWhatsappEventDeviceId(payload) {
        if (!payload || typeof payload !== 'object') {
            return '';
        }

        const result = payload.result && typeof payload.result === 'object'
            ? payload.result
            : (payload.Result && typeof payload.Result === 'object' ? payload.Result : null);
        const directDeviceId = String(payload.device_id || payload.deviceId || '').trim();
        if (directDeviceId) {
            return directDeviceId;
        }
        if (result) {
            const resultDeviceId = String(result.device_id || result.deviceId || '').trim();
            const jid = String(result.jid || result.JID || '').trim();

            // Keep the exact paired device variant (for example "861...:65@s.whatsapp.net")
            // when it belongs to the same WhatsApp identity as the JID. This preserves
            // the user's modal selection in multi-device setups while still allowing a
            // fallback to jid when older payloads only expose a transient placeholder id.
            if (resultDeviceId) {
                const normalizedResultDeviceId = this._normalizeWhatsappDeviceIdentity(resultDeviceId);
                const normalizedJid = this._normalizeWhatsappDeviceIdentity(jid);
                if (!jid || (normalizedResultDeviceId && normalizedResultDeviceId === normalizedJid)) {
                    return resultDeviceId;
                }
            }
            if (jid) {
                return jid;
            }
            return resultDeviceId;
        }
        return '';
    }

    _normalizeWhatsappDeviceIdentity(deviceId) {
        const value = String(deviceId || '').trim().toLowerCase();
        if (!value) {
            return '';
        }

        const withoutDomain = value.includes('@') ? value.split('@')[0] : value;
        return withoutDomain.includes(':') ? withoutDomain.split(':')[0] : withoutDomain;
    }

    _getWhatsappDeviceAccountKey(deviceId = '', metadata = null) {
        const entry = metadata && typeof metadata === 'object' ? metadata : {};
        const candidate = String(
            entry.phone_number
            || entry.phoneNumber
            || entry.jid
            || entry.JID
            || deviceId
            || ''
        ).trim();
        if (!candidate) {
            return '';
        }

        const normalized = this._normalizeWhatsappDeviceIdentity(candidate);
        return normalized || candidate.toLowerCase();
    }

    _getWhatsappDeviceCatalogRank(entry) {
        const deviceId = String(entry && entry.deviceId || '').trim();
        const state = String(entry && entry.state || '').trim().toLowerCase();
        let rank = 0;

        if (deviceId.includes('@') && deviceId.includes(':')) {
            rank += 4;
        } else if (deviceId.includes('@')) {
            rank += 2;
        }
        if (state === 'logged_in') {
            rank += 1;
        }

        return rank;
    }

    _isWhatsappPairedDeviceId(deviceId) {
        const resolvedDeviceId = String(deviceId || '').trim();
        return !!(resolvedDeviceId && resolvedDeviceId.includes('@') && resolvedDeviceId.includes(':'));
    }

    _shouldReplaceWhatsappDeviceCatalogEntry(existingEntry, nextEntry) {
        if (!existingEntry) {
            return true;
        }
        if (!nextEntry) {
            return false;
        }

        const existingRank = this._getWhatsappDeviceCatalogRank(existingEntry);
        const nextRank = this._getWhatsappDeviceCatalogRank(nextEntry);
        if (nextRank !== existingRank) {
            return nextRank > existingRank;
        }

        const existingSavedAt = String(existingEntry.savedAt || existingEntry.created_at || '').trim();
        const nextSavedAt = String(nextEntry.savedAt || nextEntry.created_at || '').trim();
        return !!nextSavedAt && nextSavedAt >= existingSavedAt;
    }

    _matchesWhatsappDeviceReference(entry, deviceId = '', metadata = null) {
        const candidateDeviceId = String(entry && entry.deviceId || '').trim();
        const resolvedDeviceId = String(deviceId || '').trim();
        if (!candidateDeviceId || !resolvedDeviceId && !metadata) {
            return false;
        }

        if (resolvedDeviceId && candidateDeviceId === resolvedDeviceId) {
            return true;
        }

        const referenceAccountKey = this._getWhatsappDeviceAccountKey(resolvedDeviceId, metadata);
        const candidateAccountKey = this._getWhatsappDeviceAccountKey(candidateDeviceId, entry);
        if (referenceAccountKey && candidateAccountKey) {
            return referenceAccountKey === candidateAccountKey;
        }

        const normalizedReference = this._normalizeWhatsappDeviceIdentity(resolvedDeviceId);
        return !!(normalizedReference && normalizedReference === this._normalizeWhatsappDeviceIdentity(candidateDeviceId));
    }

    _findBestWhatsappDeviceCatalogEntry(entries = [], deviceId = '', metadata = null) {
        const matches = (Array.isArray(entries) ? entries : [])
            .filter(entry => this._matchesWhatsappDeviceReference(entry, deviceId, metadata));
        if (!matches.length) {
            return null;
        }

        return matches.sort((left, right) => this._getWhatsappDeviceCatalogRank(right) - this._getWhatsappDeviceCatalogRank(left))[0] || null;
    }

    _resolvePersistableWhatsappEventDeviceId(payload) {
        const result = payload && payload.result && typeof payload.result === 'object'
            ? payload.result
            : (payload && payload.Result && typeof payload.Result === 'object' ? payload.Result : {});
        const directPayloadDeviceId = String(payload && (payload.device_id || payload.deviceId) || '').trim();
        const directResultDeviceId = String(result && (result.device_id || result.deviceId) || '').trim();
        const resolvedEventDeviceId = String(this._resolveWhatsappEventDeviceId(payload) || '').trim();

        if (this._isWhatsappPairedDeviceId(directPayloadDeviceId)) {
            return directPayloadDeviceId;
        }
        if (this._isWhatsappPairedDeviceId(directResultDeviceId)) {
            return directResultDeviceId;
        }
        if (this._isWhatsappPairedDeviceId(resolvedEventDeviceId)) {
            return resolvedEventDeviceId;
        }

        const sameAccountSavedEntry = this._findBestWhatsappDeviceCatalogEntry(
            this.savedWhatsappDevices,
            resolvedEventDeviceId || directResultDeviceId || directPayloadDeviceId,
            result
        );
        if (sameAccountSavedEntry && sameAccountSavedEntry.deviceId) {
            return String(sameAccountSavedEntry.deviceId || '').trim();
        }

        return '';
    }

    async _migrateSavedWhatsappSessionBundle(sourceDeviceIds = [], targetDeviceId = '') {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        const resolvedTargetDeviceId = String(targetDeviceId || '').trim();
        if (!hashedMasterKey || !resolvedTargetDeviceId) {
            return false;
        }

        try {
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasGetFn = dbHandle && typeof dbHandle.getWhatsappSessionBundle === 'function';
            const hasSaveFn = dbHandle && typeof dbHandle.saveWhatsappSessionBundle === 'function';
            const hasClearFn = dbHandle && typeof dbHandle.clearWhatsappSessionBundle === 'function';
            if (!hasGetFn || !hasSaveFn || !hasClearFn) {
                return false;
            }

            const uniqueSourceIds = [...new Set((Array.isArray(sourceDeviceIds) ? sourceDeviceIds : [])
                .map(deviceId => String(deviceId || '').trim())
                .filter(deviceId => deviceId && deviceId !== resolvedTargetDeviceId))];
            if (!uniqueSourceIds.length) {
                return false;
            }

            let targetBundle = await dbHandle.getWhatsappSessionBundle(hashedMasterKey, resolvedTargetDeviceId);
            let migrated = false;

            for (const sourceDeviceId of uniqueSourceIds) {
                const sourceBundle = await dbHandle.getWhatsappSessionBundle(hashedMasterKey, sourceDeviceId);
                if (sourceBundle && sourceBundle.session && typeof sourceBundle.session === 'object' && !targetBundle) {
                    await dbHandle.saveWhatsappSessionBundle(hashedMasterKey, resolvedTargetDeviceId, sourceBundle.session, {
                        ...(sourceBundle.metadata && typeof sourceBundle.metadata === 'object' ? sourceBundle.metadata : {}),
                        migratedFrom: sourceDeviceId,
                        migratedAt: new Date().toISOString()
                    });
                    targetBundle = sourceBundle;
                    migrated = true;
                }

                await dbHandle.clearWhatsappSessionBundle(hashedMasterKey, sourceDeviceId);
            }

            if (migrated) {
                console.log('ConnectorsTab: migrated whatsapp session bundle to canonical device', {
                    targetDeviceId: resolvedTargetDeviceId,
                    sourceDeviceIds: uniqueSourceIds
                });
            }

            return migrated;
        } catch (err) {
            console.warn('ConnectorsTab: _migrateSavedWhatsappSessionBundle failed', err);
            return false;
        }
    }

    _shouldAcceptWhatsappLoginEventDevice(payload) {
        const resolvedEventDeviceId = String(this._resolveWhatsappEventDeviceId(payload) || '').trim();
        if (!resolvedEventDeviceId) {
            return true;
        }

        const selectedDeviceId = String(this.savedWhatsappDeviceId || '').trim();
        if (!selectedDeviceId) {
            return true;
        }

        const result = payload && payload.result && typeof payload.result === 'object'
            ? payload.result
            : (payload && payload.Result && typeof payload.Result === 'object' ? payload.Result : {});
        const selectedEntry = this._findBestWhatsappDeviceCatalogEntry(this.savedWhatsappDevices, selectedDeviceId) || { deviceId: selectedDeviceId };
        const selectedAccountKey = this._getWhatsappDeviceAccountKey(selectedDeviceId, selectedEntry);
        const eventAccountKey = this._getWhatsappDeviceAccountKey(resolvedEventDeviceId, result);

        if (selectedAccountKey && eventAccountKey) {
            return selectedAccountKey === eventAccountKey;
        }

        return this._normalizeWhatsappDeviceIdentity(selectedDeviceId) === this._normalizeWhatsappDeviceIdentity(resolvedEventDeviceId);
    }

    async _persistWhatsappDeviceFromLoginEvent(payload) {
        const persistDeviceId = this._resolvePersistableWhatsappEventDeviceId(payload);
        if (!persistDeviceId) {
            return false;
        }

        const result = payload && payload.result && typeof payload.result === 'object'
            ? payload.result
            : (payload && payload.Result && typeof payload.Result === 'object' ? payload.Result : {});
        const rawJid = String(result.jid || result.JID || persistDeviceId || '').trim();
        const phoneNumber = String(result.phone_number || result.phoneNumber || '').trim() || this._normalizeWhatsappDeviceIdentity(rawJid);
        const displayName = String(
            result.display_name
            || result.displayName
            || result.push_name
            || result.pushName
            || ''
        ).trim();

        const metadata = { state: 'logged_in' };
        if (phoneNumber) {
            metadata.phone_number = phoneNumber;
        }
        if (displayName) {
            metadata.display_name = displayName;
        }
        if (rawJid) {
            metadata.jid = rawJid;
        }

        return this._upsertSavedWhatsappDevice(persistDeviceId, metadata);
    }

    _resolveSavedWhatsappCatalogDeviceId(deviceId = null) {
        const requested = String(deviceId || '').trim();
        if (!requested) {
            return String(this.savedWhatsappDeviceId || '').trim();
        }

        if (Array.isArray(this.savedWhatsappDevices)) {
            const directMatch = this.savedWhatsappDevices.find(entry => String(entry && entry.deviceId || '').trim() === requested);
            const bestMatch = this._findBestWhatsappDeviceCatalogEntry(this.savedWhatsappDevices, requested, directMatch || null);
            if (bestMatch && bestMatch.deviceId) {
                return String(bestMatch.deviceId).trim();
            }

            const normalizedRequested = this._normalizeWhatsappDeviceIdentity(requested);
            if (normalizedRequested) {
                const identityMatch = this.savedWhatsappDevices.find(entry => {
                    return this._normalizeWhatsappDeviceIdentity(entry && entry.deviceId) === normalizedRequested;
                });
                if (identityMatch && identityMatch.deviceId) {
                    return String(identityMatch.deviceId).trim();
                }
            }
        }

        return requested;
    }

    _sameWhatsappDeviceCatalogEntries(left, right) {
        const normalize = (entries) => {
            const list = Array.isArray(entries) ? entries : [];
            return list
                .map(entry => this._sanitizeWhatsappDeviceCatalogEntry(entry))
                .filter(Boolean)
                .map(entry => `${entry.deviceId}|${entry.display_name}|${entry.phone_number}|${entry.state}|${entry.created_at}`)
                .sort();
        };

        const normalizedLeft = normalize(left);
        const normalizedRight = normalize(right);
        if (normalizedLeft.length !== normalizedRight.length) {
            return false;
        }

        return normalizedLeft.every((value, index) => value === normalizedRight[index]);
    }

    _hasMultipleSavedWhatsappDevices() {
        return Array.isArray(this.savedWhatsappDevices) && this.savedWhatsappDevices.length > 1;
    }

    async _syncWhatsappLoginSuccessToServer(deviceOrPayload = null, maxAttempts = 6) {
        const payload = deviceOrPayload && typeof deviceOrPayload === 'object' ? deviceOrPayload : null;
        const payloadPersistDeviceId = payload ? this._resolvePersistableWhatsappEventDeviceId(payload) : '';
        const explicitDeviceId = typeof deviceOrPayload === 'string' ? String(deviceOrPayload || '').trim() : '';
        const resolvedSavedDeviceId = this._resolveSavedWhatsappCatalogDeviceId(this.savedWhatsappDeviceId || '');
        const resolvedDeviceId = String(
            payloadPersistDeviceId
            || explicitDeviceId
            || resolvedSavedDeviceId
            || ''
        ).trim();
        const result = payload && payload.result && typeof payload.result === 'object'
            ? payload.result
            : (payload && payload.Result && typeof payload.Result === 'object' ? payload.Result : null);
        const resolvedPhoneNumber = String(
            (result && (result.phone_number || result.phoneNumber))
            || (payload && (payload.phone_number || payload.phoneNumber))
            || ''
        ).trim();

        if (!resolvedDeviceId || !this._isWhatsappPairedDeviceId(resolvedDeviceId)) {
            return false;
        }

        const sendDbSync = async () => {
            const syncPayload = {};
            if (resolvedDeviceId) {
                syncPayload.device_id = resolvedDeviceId;
            }
            if (resolvedPhoneNumber) {
                syncPayload.phone_number = resolvedPhoneNumber;
            }
            await fetch('/api/whatsapp/db-sync', {
                method: 'POST',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(syncPayload)
            });
        };

        try {
            await sendDbSync();
        } catch (syncErr) {
            console.warn('ConnectorsTab: immediate whatsapp db-sync after login failed', syncErr);
        }

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
                const params = this._appendWhatsappUserScope(new URLSearchParams({ check: 'true' }));
                if (resolvedDeviceId) {
                    params.set('device_id', resolvedDeviceId);
                }

                const response = await fetch(`/api/whatsapp/qr?${params.toString()}`, {
                    headers: this._getWhatsappUserScopedHeaders(),
                    cache: 'no-store'
                });

                if (response.ok) {
                    const data = await response.json().catch(() => null);
                    if (data && data.loggedIn) {
                        try {
                            await sendDbSync();
                        } catch (syncErr) {
                            console.warn('ConnectorsTab: whatsapp db-sync after login failed', syncErr);
                        }
                        return true;
                    }
                }
            } catch (err) {
                console.warn('ConnectorsTab: post-login whatsapp sync failed', { attempt, err });
            }

            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return false;
    }

    _isWhatsappRequestActive(requestGeneration, allowDuringManualStop = false) {
        if (typeof requestGeneration === 'number' && requestGeneration !== this.whatsappRequestGeneration) {
            return false;
        }
        if (!allowDuringManualStop && this.whatsappManualStopRequested) {
            return false;
        }
        return true;
    }

    _cancelWhatsappAsyncWork({ manualStop = false } = {}) {
        if (manualStop) {
            this.whatsappManualStopRequested = true;
        }

        this.whatsappRequestGeneration += 1;

        if (this.whatsappQrRetryTimeout) {
            clearTimeout(this.whatsappQrRetryTimeout);
            this.whatsappQrRetryTimeout = null;
        }

        if (this.whatsappPendingFetchControllers && this.whatsappPendingFetchControllers.size) {
            for (const controller of Array.from(this.whatsappPendingFetchControllers)) {
                try {
                    controller.abort();
                } catch (_) {}
            }
            this.whatsappPendingFetchControllers.clear();
        }
    }

    _clearWhatsappRestartCooldownTimer() {
        if (this.whatsappRestartCooldownTimer) {
            clearTimeout(this.whatsappRestartCooldownTimer);
            this.whatsappRestartCooldownTimer = null;
        }
    }

    _isWhatsappRestartBlocked() {
        return !!(this.whatsappRestartBlockedUntil && Date.now() < this.whatsappRestartBlockedUntil);
    }

    _isWhatsappPairNewDeviceBlocked() {
        return !!(
            this.serverStarted
            || this.serverStopping
            || this.serverStarting
            || this._isWhatsappRestartBlocked()
        );
    }

    _setWhatsappRestartBlocked(ms = 0) {
        this._clearWhatsappRestartCooldownTimer();
        if (!(ms > 0)) {
            this.whatsappRestartBlockedUntil = 0;
            return;
        }

        this.whatsappRestartBlockedUntil = Date.now() + ms;
        this.whatsappRestartCooldownTimer = setTimeout(() => {
            this.whatsappRestartCooldownTimer = null;
            this.whatsappRestartBlockedUntil = 0;
            this.setWhatsappPairButtonState(this.isPaired);
        }, ms);
    }

    _handleWhatsappManualStopInProgress(message = 'Manual stop in progress') {
        this.serverStarted = false;
        this.serverStarting = false;
        this.serverStopping = false;
        this.isPaired = false;
        this._setWhatsappFreshPairRequested(false);
        this._setWhatsappRestartBlocked(5000);
        this.closeWhatsappPairModal();
        this.stopPolling();
        this.stopWhatsappModalCountdown();
        this.clearWhatsappQrCountdown();
        this.setWhatsappPairButtonState(false);
        this.setWhatsappModalStatus(message);
    }

    _getWhatsappRemoteLogoutWarningMessage() {
        return (window.Lang && typeof Lang.get === 'function' && Lang.get('whatsappRemoteLogoutRestartWarning'))
            || 'This WhatsApp device was removed from your phone. Start the server again to create a fresh pairing.';
    }

    async _handleWhatsappRemoteLogout(eventDeviceId = null, { force = false } = {}) {
        const resolvedDeviceId = String(eventDeviceId || this.savedWhatsappDeviceId || '').trim();
        const noticeKey = resolvedDeviceId || 'remote_logout';
        if (!force && this.whatsappRemoteLogoutNoticeShown === noticeKey) {
            return;
        }
        this.whatsappRemoteLogoutNoticeShown = noticeKey;

        try {
            await this._forgetSavedWhatsappDeviceAfterUnpair(resolvedDeviceId || null, 'event-remote_logout');
        } catch (err) {
            console.warn('ConnectorsTab: failed to forget saved device after REMOTE_LOGOUT', err);
        }

        this.serverStarted = false;
        this.serverStarting = false;
        this.serverStopping = false;
        this.isPaired = false;
        this._setWhatsappFreshPairRequested(false);
        this.stopWhatsappWebsocketListener();
        this.stopPolling();
        this.stopWhatsappModalCountdown();
        this.clearWhatsappQrCountdown();
        this.closeWhatsappPairModal();
        this.setWhatsappPairButtonState(false);
        this.setWhatsappModalStatus(this._getWhatsappRemoteLogoutWarningMessage());

        if (typeof window.alert === 'function') {
            window.alert(this._getWhatsappRemoteLogoutWarningMessage());
        }
    }

    _getWhatsappQrSignature(data, qrUrl) {
        const normalizedQr = String(qrUrl || '').trim();
        const qrTimestamp = Number(data && data.qrTimestamp);
        if (normalizedQr && Number.isFinite(qrTimestamp) && qrTimestamp > 0) {
            return `${normalizedQr}::${qrTimestamp}`;
        }
        return normalizedQr;
    }

    _syncWhatsappQrTTL(data = null) {
        const qrDuration = Number(data && data.qrDuration);
        if (Number.isFinite(qrDuration) && qrDuration > 0) {
            this.whatsappQrTTL = qrDuration * 1000;
            return;
        }

        if (!(this.whatsappQrTTL > 0)) {
            this.whatsappQrTTL = 20000;
        }
    }

    _getWhatsappQrIssuedAt(data = null) {
        const qrTimestamp = Number(data && data.qrTimestamp);
        if (Number.isFinite(qrTimestamp) && qrTimestamp > 0) {
            return qrTimestamp;
        }

        return Date.now();
    }

    _logWhatsappQrUpdate(kind, data = null, qrUrl = '') {
        const payload = {
            kind: String(kind || 'update'),
            qrTimestamp: Number(data && data.qrTimestamp) || 0,
            qrDuration: Number(data && data.qrDuration) || 0,
            qrSource: String(qrUrl || '').startsWith('data:') ? 'data-url' : 'proxy-url'
        };

        console.info('ConnectorsTab: WhatsApp QR update', payload);
    }

    setWhatsappPairButtonState(isPaired) {
        //console.log('ConnectorsTab: setWhatsappPairButtonState', { isPaired });
        if (!this.whatsappButton) {
            console.warn('ConnectorsTab: setWhatsappPairButtonState called but whatsappButton is null');
            return;
        }
        this.isPaired = isPaired;
        this.whatsappButton.dataset.whatsappPaired = isPaired ? 'true' : 'false';
        this.whatsappButton.style.height = '56px';
        this.whatsappButton.style.minHeight = '56px';

        // Initialize QR countdown timer state
        if (typeof this.whatsappQrTTL === 'undefined') {
            this.whatsappQrTTL = 20000;
        }
        if (typeof this.qrCountdownTimer === 'undefined') {
            this.qrCountdownTimer = null;
        }
        this.whatsappButton.style.padding = '0 16px';
        this.whatsappButton.style.borderRadius = '8px';
        this.whatsappButton.style.fontWeight = '600';

        const statusCard = document.getElementById('whatsapp-status-card');
        if (statusCard) {
            if (this.serverStarted) {
                statusCard.textContent = isPaired
                    ? (Lang.get('whatsappPairedCard') || 'WhatsApp paired')
                    : (Lang.get('whatsappNotPairedCard') || 'WhatsApp not paired');
            } else {
                statusCard.textContent = (Lang.get('whatsappNotPairedCard') || 'WhatsApp not paired');
            }
        }

        if (this.serverStopping) {
            this.whatsappButton.textContent = 'Stopping the server...';
            this.whatsappButton.title = 'Stopping the server...';
            this.whatsappButton.disabled = true;
        } else if (this.serverStarted) {
            this.whatsappButton.textContent = 'Stop server';
            this.whatsappButton.title = 'Stop server';
            this.whatsappButton.disabled = false;
        } else if (this._isWhatsappRestartBlocked()) {
            this.whatsappButton.textContent = 'Please wait...';
            this.whatsappButton.title = 'Please wait before starting the server again';
            this.whatsappButton.disabled = true;
        } else if (this.serverStarting) {
            this.whatsappButton.textContent = Lang.get('serverStartingButton') || 'Starting server...';
            this.whatsappButton.title = Lang.get('serverStartingButton') || 'Starting server...';
            this.whatsappButton.disabled = true;
        } else {
            this.whatsappButton.textContent = Lang.get('startServerButton') || 'Start server';
            this.whatsappButton.title = Lang.get('startServerButton') || 'Start server';
            this.whatsappButton.disabled = !this.whatsappMode;
        }

        if (this.whatsappButton.disabled) {
            this.whatsappButton.style.backgroundColor = '#c4c4ca';
            this.whatsappButton.style.color = '#575f6b';
            this.whatsappButton.style.cursor = 'not-allowed';
        } else {
            this.whatsappButton.style.backgroundColor = '';
            this.whatsappButton.style.color = '';
            this.whatsappButton.style.cursor = 'pointer';
        }

        if (this.whatsappPairNewDeviceButton) {
            this.whatsappPairNewDeviceButton.style.width = '100%';
            this.whatsappPairNewDeviceButton.style.padding = '12px 16px';
            this.whatsappPairNewDeviceButton.style.borderRadius = '8px';
            this.whatsappPairNewDeviceButton.style.fontWeight = '600';
            this.whatsappPairNewDeviceButton.disabled = this._isWhatsappPairNewDeviceBlocked() || !this.whatsappMode;
            if (this._isWhatsappRestartBlocked()) {
                this.whatsappPairNewDeviceButton.textContent = 'Please wait...';
                this.whatsappPairNewDeviceButton.title = 'Please wait before pairing a new device';
            } else {
                this.whatsappPairNewDeviceButton.textContent = 'Pair new device';
                this.whatsappPairNewDeviceButton.title = 'Pair a new WhatsApp device';
            }
            if (this.whatsappPairNewDeviceButton.disabled) {
                this.whatsappPairNewDeviceButton.style.backgroundColor = '#c4c4ca';
                this.whatsappPairNewDeviceButton.style.color = '#575f6b';
                this.whatsappPairNewDeviceButton.style.cursor = 'not-allowed';
            } else {
                this.whatsappPairNewDeviceButton.style.backgroundColor = '#f9b31c';
                this.whatsappPairNewDeviceButton.style.color = '#262626';
                this.whatsappPairNewDeviceButton.style.cursor = 'pointer';
            }
        }

        if (this.whatsappDeleteAllPairedButton) {
            this.whatsappDeleteAllPairedButton.style.width = '100%';
            this.whatsappDeleteAllPairedButton.style.padding = '12px 16px';
            this.whatsappDeleteAllPairedButton.style.borderRadius = '8px';
            this.whatsappDeleteAllPairedButton.style.fontWeight = '600';
            this.whatsappDeleteAllPairedButton.disabled = false;
            this.whatsappDeleteAllPairedButton.textContent = (window.Lang && typeof Lang.get === 'function' && Lang.get('whatsappDeleteAllPairedButton')) || 'Deleted paired device(s)';
            this.whatsappDeleteAllPairedButton.title = (window.Lang && typeof Lang.get === 'function' && Lang.get('whatsappDeleteAllPairedButtonTitle')) || 'Deleted paired device(s)';
            this.whatsappDeleteAllPairedButton.style.backgroundColor = '#d64545';
            this.whatsappDeleteAllPairedButton.style.borderColor = '#b91c1c';
            this.whatsappDeleteAllPairedButton.style.color = '#ffffff';
            this.whatsappDeleteAllPairedButton.style.cursor = 'pointer';
        }

        // Notify other parts of the app about pairing state
        if (isPaired) {
            this.stopWhatsappWebsocketListener();
        }

        try {
            if (isPaired) {
                //console.log('ConnectorsTab: dispatching whatsappPaired');
                window.dispatchEvent(new CustomEvent('whatsappPaired'));
            } else {
                //console.log('ConnectorsTab: dispatching whatsappUnpaired');
                window.dispatchEvent(new CustomEvent('whatsappUnpaired'));
            }
        } catch (e) {
            console.warn('ConnectorsTab: CustomEvent dispatch failed', e);
        }
    }

    async setWhatsappMode(mode, fromDB = false) {
        const normalized = mode === 'personal' || mode === 'bot' ? mode : null;
        //console.log('ConnectorsTab: setWhatsappMode called', { mode, normalized, fromDB });
        this.whatsappMode = normalized;

        if (this.whatsappPersonalModeButton) {
            this.whatsappPersonalModeButton.classList.toggle('active', normalized === 'personal');
        }
        if (this.whatsappBotModeButton) {
            this.whatsappBotModeButton.classList.toggle('active', normalized === 'bot');
        }

        if (typeof window !== 'undefined') {
            window.whatsappSelectedMode = normalized;
        }

        const dbInstance = window.PaiperworkDB || (typeof PaiperworkDB !== 'undefined' ? PaiperworkDB : null);
        if (!fromDB && dbInstance && typeof dbInstance.saveWhatsappMode === 'function') {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            if (hashedMasterKey) {
                try {
                    const saveResult = await dbInstance.saveWhatsappMode(hashedMasterKey, normalized || '');
                    if (!saveResult) {
                        console.warn('ConnectorsTab: saveWhatsappMode returned false');
                    }
                } catch (err) {
                    console.warn('ConnectorsTab: saveWhatsappMode failed', err);
                }
            }
        } else if (fromDB) {
            // loaded from DB, no need to re-save
        } else {
            console.warn('ConnectorsTab: saveWhatsappMode skipped - dbInstance missing or method missing');
        }

        try {
            await fetch('/api/whatsapp/mode', {
                method: 'POST',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ mode: normalized || '' })
            });
        } catch (err) {
            console.warn('ConnectorsTab: _updateWhatsappServerMode failed', err);
        }

        // Re-adjust the start server button state now that mode changed.
        this.setWhatsappPairButtonState(this.isPaired);
    }

    async setWhatsappModelLock(locked, fromDB = false) {
        const normalizedLocked = locked === true || String(locked).toLowerCase() === 'true';
        this.whatsappModelLocked = normalizedLocked;

        if (this.whatsappModelLockButton) {
            this.whatsappModelLockButton.classList.toggle('active', normalizedLocked);
            this.whatsappModelLockButton.textContent = normalizedLocked ? 'AI model locked' : 'Lock AI model';
            this.whatsappModelLockButton.title = normalizedLocked ? 'AI model locked' : 'Lock AI model';
            this.whatsappModelLockButton.setAttribute('aria-pressed', normalizedLocked ? 'true' : 'false');
        }

        if (typeof window !== 'undefined') {
            window.whatsappModelLocked = normalizedLocked;
        }

        const dbInstance = window.PaiperworkDB || (typeof PaiperworkDB !== 'undefined' ? PaiperworkDB : null);
        if (!fromDB && dbInstance && typeof dbInstance.saveWhatsappModelLock === 'function') {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            if (hashedMasterKey) {
                try {
                    const saveResult = await dbInstance.saveWhatsappModelLock(hashedMasterKey, normalizedLocked);
                    if (!saveResult) {
                        console.warn('ConnectorsTab: saveWhatsappModelLock returned false');
                    }
                } catch (err) {
                    console.warn('ConnectorsTab: saveWhatsappModelLock failed', err);
                }
            }
        }
    }

    async unpairWhatsappDevice() {
        //console.log('ConnectorsTab: unpairWhatsappDevice called');
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!hashedMasterKey) {
            console.warn('ConnectorsTab: unpairWhatsappDevice missing master key');
            return;
        }

        const activeDeviceId = String(this.savedWhatsappDeviceId || '').trim();

        try {
            // Stop the gateway server and clear UI state first.
            await this.stopWhatsappServer();

            const params = this._appendWhatsappUserScope(new URLSearchParams());
            const res = await fetch('/api/whatsapp/preferred-device?' + params.toString(), {
                method: 'DELETE',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' })
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error('preferred-device delete failed: ' + text);
            }

            if (activeDeviceId) {
                await this._removeSavedWhatsappDevice(activeDeviceId, {
                    syncServer: false,
                    reason: 'manual-unpair',
                    selectReplacement: 'none'
                });
            } else {
                await this._clearSavedWhatsappDeviceInfo();
            }
            this.isPaired = false;
            this.setWhatsappPairButtonState(false);
            this.closeWhatsappPairModal();
            this.stopPolling();
            this.setWhatsappModalStatus('WhatsApp unpaired and cleared from Paiperwork.');
            this.setWhatsappMode(null);
        } catch (err) {
            console.warn('ConnectorsTab: unpairWhatsappDevice failed', err);
            this.setWhatsappModalStatus('Failed to unpair WhatsApp. See console logs.');
        }
    }

    async deleteAllPairedWhatsappDevices() {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!hashedMasterKey) {
            console.warn('ConnectorsTab: deleteAllPairedWhatsappDevices missing master key');
            return;
        }

        const confirmMessage = (window.Lang && typeof Lang.get === 'function' && Lang.get('whatsappDeleteAllPairedConfirm'))
            || 'You are about to delete pairing information from Paiperwork, are you sure?';
        if (typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm(confirmMessage)) {
            return;
        }

        try {
            this.serverStopping = true;
            const response = await fetch('/api/whatsapp/pairing-data/delete-all', {
                method: 'POST',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' })
            });
            if (!response.ok) {
                throw new Error(await response.text());
            }

            await this._waitForWhatsappGatewayStop();

            await this._clearSavedWhatsappDeviceInfo();

            this.serverStarted = false;
            this.serverStarting = false;
            this.serverStopping = false;
            this.isPaired = false;
            this.whatsappRemoteLogoutNoticeShown = null;
            this.whatsappSessionImportedForDevice = null;
            this.whatsappSessionRestoreSkippedForDevice = null;
            this._setWhatsappFreshPairRequested(false);
            this.whatsappFreshPairDeviceId = null;
            this.stopWhatsappWebsocketListener();
            this.stopPolling();
            this.stopWhatsappModalCountdown();
            this.clearWhatsappQrCountdown();
            this.closeWhatsappPairModal();
            this.setWhatsappPairButtonState(false);
            this.setWhatsappModalStatus((window.Lang && typeof Lang.get === 'function' && Lang.get('whatsappDeleteAllPairedSuccess')) || 'Paiperwork pairing data deleted. You can pair a new device now.');
        } catch (err) {
            console.warn('ConnectorsTab: deleteAllPairedWhatsappDevices failed', err);
            this.setWhatsappModalStatus((window.Lang && typeof Lang.get === 'function' && Lang.get('whatsappDeleteAllPairedFailed')) || 'Failed to delete Paiperwork pairing data. See console logs.');
        } finally {
            this.serverStopping = false;
        }
    }

    async loadWhatsappModeFromDb(retryCount = 0) {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        const dbHandle = window.PaiperworkDB || (typeof PaiperworkDB !== 'undefined' ? PaiperworkDB : null);
        //console.log('ConnectorsTab: loadWhatsappModeFromDb begin', { hashedMasterKey, retryCount, hasDBClass: !!dbHandle });

        if (!hashedMasterKey || !dbHandle || typeof dbHandle.getWhatsappMode !== 'function') {
            console.warn('ConnectorsTab: loadWhatsappModeFromDb missing prerequisites', {
                hashedMasterKey,
                hasDBClass: !!dbHandle,
                hasFn: dbHandle && typeof dbHandle.getWhatsappMode === 'function'
            });

            if (retryCount < 5) {
                setTimeout(() => this.loadWhatsappModeFromDb(retryCount + 1), 300);
                return;
            }

            this.setWhatsappMode(null);
            return;
        }

        try {
            const dbInstance = window.PaiperworkDB || (typeof PaiperworkDB !== 'undefined' ? PaiperworkDB : null);
            if (!dbInstance) {
                throw new Error('PaiperworkDB is not available');
            }
            //console.log('ConnectorsTab: initializeDatabase call');
            const initResult = await dbInstance.initializeDatabase(hashedMasterKey);
            //console.log('ConnectorsTab: initializeDatabase result', { initResult });

            const mode = await dbInstance.getWhatsappMode(hashedMasterKey);
            //console.log('ConnectorsTab: read Whatsapp mode from DB', { mode });

            if (!mode) {
                //console.log('ConnectorsTab: no mode found in DB, leaving unselected');
                this.setWhatsappMode(null, true);
            } else {
                this.setWhatsappMode(mode, true);
            }
        } catch (err) {
            console.warn('ConnectorsTab: loadWhatsappModeFromDb failed', err);
            if (retryCount < 5) {
                setTimeout(() => this.loadWhatsappModeFromDb(retryCount + 1), 300);
                return;
            }
            this.setWhatsappMode(null);
        }
    }

    async loadWhatsappModelLockFromDb(retryCount = 0) {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        const dbHandle = window.PaiperworkDB || (typeof PaiperworkDB !== 'undefined' ? PaiperworkDB : null);

        if (!hashedMasterKey || !dbHandle || typeof dbHandle.getWhatsappModelLock !== 'function') {
            if (retryCount < 5) {
                setTimeout(() => this.loadWhatsappModelLockFromDb(retryCount + 1), 300);
                return;
            }

            this.setWhatsappModelLock(false, true);
            return;
        }

        try {
            const dbInstance = window.PaiperworkDB || (typeof PaiperworkDB !== 'undefined' ? PaiperworkDB : null);
            if (!dbInstance) {
                throw new Error('PaiperworkDB is not available');
            }

            await dbInstance.initializeDatabase(hashedMasterKey);
            const locked = await dbInstance.getWhatsappModelLock(hashedMasterKey);
            await this.setWhatsappModelLock(locked, true);
        } catch (err) {
            console.warn('ConnectorsTab: loadWhatsappModelLockFromDb failed', err);
            if (retryCount < 5) {
                setTimeout(() => this.loadWhatsappModelLockFromDb(retryCount + 1), 300);
                return;
            }
            this.setWhatsappModelLock(false, true);
        }
    }

    async _syncPreferredWhatsappDeviceWithServer(isPaired) {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!hashedMasterKey) return;

        let deviceInfo = await this._loadSavedWhatsappDeviceInfo();
        if (!deviceInfo) {
            const { available, devices } = await this._fetchAuthoritativeWhatsappDevicesFromServer();
            if (!available) {
                return;
            }

            if (devices.length === 1 && devices[0] && devices[0].deviceId) {
                const singleDevice = this._sanitizeWhatsappDeviceCatalogEntry(devices[0]);
                if (singleDevice && singleDevice.deviceId) {
                    const saveResult = await this._writeWhatsappDeviceCatalog(singleDevice.deviceId, [singleDevice], {
                        devices: [singleDevice],
                        selectedDeviceId: singleDevice.deviceId,
                        phone_number: singleDevice.phone_number || '',
                        display_name: singleDevice.display_name || '',
                        alias: singleDevice.alias || '',
                        state: singleDevice.state || '',
                        created_at: singleDevice.created_at || '',
                        savedAt: singleDevice.savedAt || ''
                    });
                    if (saveResult) {
                        deviceInfo = await this._loadSavedWhatsappDeviceInfo();
                    }
                }
            } else if (devices.length > 1) {
                try {
                    await this._clearPreferredWhatsappDeviceOnServer('multiple-saved-devices-awaiting-selection');
                } catch (clearErr) {
                    console.warn('ConnectorsTab: _syncPreferredWhatsappDeviceWithServer multi-device clear failed', clearErr);
                }
                return;
            } else {
                try {
                    await this._clearPreferredWhatsappDeviceOnServer('no-saved-devices');
                } catch (clearErr) {
                    console.warn('ConnectorsTab: _syncPreferredWhatsappDeviceWithServer clear failed', clearErr);
                }
                return;
            }
        }

        if (!deviceInfo) {
            return;
        }

        const normalized = this._normalizeWhatsappDeviceCatalog(deviceInfo);
        const selectedEntry = this._findBestWhatsappDeviceCatalogEntry(normalized.devices, normalized.selectedDeviceId, normalized.meta || null);
        const selectedDeviceId = String(selectedEntry && selectedEntry.deviceId || normalized.selectedDeviceId || '').trim();

        if (!normalized.devices.length) {
            const { available, devices } = await this._fetchAuthoritativeWhatsappDevicesFromServer();
            if (!available) {
                return;
            }
            if (devices.length > 1) {
                try {
                    await this._clearPreferredWhatsappDeviceOnServer('multiple-saved-devices-awaiting-selection');
                } catch (clearErr) {
                    console.warn('ConnectorsTab: _syncPreferredWhatsappDeviceWithServer empty-catalog multi-device clear failed', clearErr);
                }
            } else if (devices.length === 0) {
                try {
                    await this._clearPreferredWhatsappDeviceOnServer('no-saved-devices');
                } catch (clearErr) {
                    console.warn('ConnectorsTab: _syncPreferredWhatsappDeviceWithServer empty-catalog clear failed', clearErr);
                }
            }
            return;
        }

        const deviceValue = (isPaired || !!selectedDeviceId) && this._isWhatsappPairedDeviceId(selectedDeviceId)
            ? selectedDeviceId
            : '';
        const metaValue = (isPaired || !!normalized.meta) ? JSON.stringify(normalized.meta || {}) : '';

        try {
            const params = this._appendWhatsappUserScope(new URLSearchParams());
            const res = await fetch('/api/whatsapp/preferred-device?' + params.toString(), {
                method: 'POST',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    device_id: deviceValue,
                    meta: metaValue
                })
            });
            if (!res.ok) {
                console.warn('ConnectorsTab: _syncPreferredWhatsappDeviceWithServer failed', await res.text());
            }
        } catch (err) {
            console.warn('ConnectorsTab: _syncPreferredWhatsappDeviceWithServer failed', err);
        }
    }

    async _getPaiperworkDBHandle(retryCount = 0) {
        const dbHandle = window.PaiperworkDB || (typeof PaiperworkDB !== 'undefined' ? PaiperworkDB : null);
        if (dbHandle) {
            return dbHandle;
        }

        if (retryCount < 8) {
            await new Promise(resolve => setTimeout(resolve, 200));
            return this._getPaiperworkDBHandle(retryCount + 1);
        }

        console.warn('ConnectorsTab: _getPaiperworkDBHandle timeout, DB handle not available');
        return null;
    }

    _sanitizeWhatsappDeviceCatalogEntry(entry, fallbackDeviceId = '') {
        if (!entry || typeof entry !== 'object') {
            return null;
        }

        const deviceId = String(entry.deviceId || entry.device_id || entry.id || entry.device || fallbackDeviceId || '').trim();
        if (!deviceId) {
            return null;
        }

        const rawJid = String(entry.jid || (deviceId.includes('@') ? deviceId : '')).trim();
        const normalizedPhone = String(entry.phone_number || '').trim() || this._normalizeWhatsappDeviceIdentity(rawJid || deviceId);

        return {
            deviceId,
            jid: rawJid,
            phone_number: normalizedPhone,
            display_name: String(entry.display_name || entry.displayName || entry.push_name || entry.pushName || entry.name || '').trim(),
            alias: String(entry.alias || '').trim(),
            state: String(entry.state || '').trim(),
            created_at: String(entry.created_at || entry.createdAt || '').trim(),
            savedAt: String(entry.savedAt || entry.saved_at || '').trim()
        };
    }

    async _fetchAuthoritativeWhatsappDevicesFromServer() {
        try {
            const params = this._appendWhatsappUserScope(new URLSearchParams());
            const response = await fetch(`/api/whatsapp/devices?${params.toString()}`, {
                headers: this._getWhatsappUserScopedHeaders(),
                cache: 'no-store'
            });

            if (!response.ok) {
                console.warn('ConnectorsTab: _fetchAuthoritativeWhatsappDevicesFromServer failed', response.status);
                return { available: false, devices: [] };
            }

            const body = await response.json().catch(() => null);
            const results = Array.isArray(body && body.results) ? body.results : (Array.isArray(body) ? body : []);
            const devices = results
                .map(entry => this._sanitizeWhatsappDeviceCatalogEntry(entry))
                .filter(Boolean);

            return { available: true, devices };
        } catch (err) {
            console.warn('ConnectorsTab: _fetchAuthoritativeWhatsappDevicesFromServer failed', err);
            return { available: false, devices: [] };
        }
    }

    async _reconcileSavedWhatsappDevicesWithAuthoritativeDevices(reason = 'runtime-refresh') {
        const { available, devices } = await this._fetchAuthoritativeWhatsappDevicesFromServer();
        if (!available || !Array.isArray(devices) || !devices.length) {
            return false;
        }

        const info = await this._loadSavedWhatsappDeviceInfo();
        const normalized = this._normalizeWhatsappDeviceCatalog(info);
        if (!Array.isArray(normalized.devices) || normalized.devices.length === 0) {
            return false;
        }

        const authoritativeKeys = new Set(
            devices
                .map(entry => this._normalizeWhatsappDeviceIdentity(entry && entry.deviceId))
                .filter(Boolean)
        );
        if (!authoritativeKeys.size) {
            return false;
        }

        const removedDevices = normalized.devices.filter(entry => {
            const deviceKey = this._normalizeWhatsappDeviceIdentity(entry && entry.deviceId);
            return deviceKey && !authoritativeKeys.has(deviceKey);
        });
        if (!removedDevices.length) {
            return false;
        }

        const remainingDevices = normalized.devices.filter(entry => {
            const deviceKey = this._normalizeWhatsappDeviceIdentity(entry && entry.deviceId);
            return !deviceKey || authoritativeKeys.has(deviceKey);
        });
        const selectedDeviceKey = this._normalizeWhatsappDeviceIdentity(normalized.selectedDeviceId);
        const nextSelectedDeviceId = (remainingDevices.find(entry => this._normalizeWhatsappDeviceIdentity(entry && entry.deviceId) === selectedDeviceKey) || remainingDevices[0] || {}).deviceId || '';

        console.log('ConnectorsTab: _reconcileSavedWhatsappDevicesWithAuthoritativeDevices pruning stale saved devices', {
            reason,
            authoritativeDeviceIds: devices.map(entry => entry.deviceId),
            removedDeviceIds: removedDevices.map(entry => entry.deviceId),
            remainingDeviceIds: remainingDevices.map(entry => entry.deviceId),
            nextSelectedDeviceId
        });

        if (!remainingDevices.length) {
            await this._clearSavedWhatsappDeviceInfo();
        } else {
            const saveResult = await this._writeWhatsappDeviceCatalog(nextSelectedDeviceId, remainingDevices, normalized.meta);
            if (!saveResult) {
                console.warn('ConnectorsTab: _reconcileSavedWhatsappDevicesWithAuthoritativeDevices failed to persist pruned catalog', {
                    reason,
                    removedDeviceIds: removedDevices.map(entry => entry.deviceId)
                });
                return false;
            }
        }

        for (const removedDevice of removedDevices) {
            const removedDeviceId = String(removedDevice && removedDevice.deviceId || '').trim();
            if (removedDeviceId) {
                await this._clearSavedWhatsappSessionBundle(removedDeviceId);
            }
        }

        const postReconcile = await this._readSavedWhatsappDeviceCatalogFromDb();
        console.log('ConnectorsTab: _reconcileSavedWhatsappDevicesWithAuthoritativeDevices post-reconcile catalog snapshot', {
            reason,
            selectedDeviceId: postReconcile && postReconcile.normalized ? postReconcile.normalized.selectedDeviceId : '',
            remainingDeviceIds: postReconcile && postReconcile.normalized && Array.isArray(postReconcile.normalized.devices)
                ? postReconcile.normalized.devices.map(entry => entry.deviceId)
                : []
        });

        return true;
    }

    _composeWhatsappDeviceInfoWithAuthoritativeDevices(info = null, preferredInfo = null, authoritativeDevices = []) {
        const baseInfo = info && typeof info === 'object' ? { ...info } : {};
        const baseMeta = baseInfo.meta && typeof baseInfo.meta === 'object' ? { ...baseInfo.meta } : {};
        const devices = Array.isArray(authoritativeDevices)
            ? authoritativeDevices.map(entry => this._sanitizeWhatsappDeviceCatalogEntry(entry)).filter(Boolean)
            : [];

        const preferredDeviceId = String(preferredInfo && preferredInfo.deviceId ? preferredInfo.deviceId : '').trim();
        const baseNormalized = this._normalizeWhatsappDeviceCatalog(baseInfo);
        const requestedSelectedDeviceId = String(baseNormalized.selectedDeviceId || baseInfo.deviceId || '').trim();

        let selectedDeviceId = '';
        const normalizedPreferredDeviceId = this._normalizeWhatsappDeviceIdentity(preferredDeviceId);
        const normalizedRequestedSelectedDeviceId = this._normalizeWhatsappDeviceIdentity(requestedSelectedDeviceId);

        if (preferredDeviceId) {
            const preferredEntry = devices.find(entry => {
                const candidateDeviceId = String(entry && entry.deviceId || '').trim();
                return candidateDeviceId === preferredDeviceId
                    || (normalizedPreferredDeviceId && this._normalizeWhatsappDeviceIdentity(candidateDeviceId) === normalizedPreferredDeviceId);
            });
            if (preferredEntry && preferredEntry.deviceId) {
                selectedDeviceId = preferredEntry.deviceId;
            }
        }

        if (!selectedDeviceId && requestedSelectedDeviceId) {
            const requestedEntry = devices.find(entry => {
                const candidateDeviceId = String(entry && entry.deviceId || '').trim();
                return candidateDeviceId === requestedSelectedDeviceId
                    || (normalizedRequestedSelectedDeviceId && this._normalizeWhatsappDeviceIdentity(candidateDeviceId) === normalizedRequestedSelectedDeviceId);
            });
            if (requestedEntry && requestedEntry.deviceId) {
                selectedDeviceId = requestedEntry.deviceId;
            }
        } else if (devices[0] && devices[0].deviceId) {
            selectedDeviceId = devices[0].deviceId;
        }

        const selectedEntry = devices.find(entry => entry.deviceId === selectedDeviceId) || null;
        baseMeta.devices = devices;
        baseMeta.selectedDeviceId = selectedEntry ? selectedEntry.deviceId : '';
        baseMeta.phone_number = selectedEntry ? selectedEntry.phone_number || '' : '';
        baseMeta.display_name = selectedEntry ? selectedEntry.display_name || '' : '';
        baseMeta.alias = selectedEntry ? selectedEntry.alias || '' : '';
        baseMeta.state = selectedEntry ? selectedEntry.state || '' : '';
        baseMeta.created_at = selectedEntry ? selectedEntry.created_at || '' : '';

        return {
            ...baseInfo,
            deviceId: selectedEntry ? selectedEntry.deviceId : '',
            meta: baseMeta
        };
    }

    _normalizeWhatsappDeviceCatalog(info = null) {
        const deviceInfo = info && typeof info === 'object' ? info : null;
        const meta = deviceInfo && deviceInfo.meta && typeof deviceInfo.meta === 'object' ? { ...deviceInfo.meta } : {};
        const devices = [];
        const seen = new Set();

        const pushEntry = (entry, fallbackDeviceId = '') => {
            const normalized = this._sanitizeWhatsappDeviceCatalogEntry(entry, fallbackDeviceId);
            const identityKey = this._getWhatsappDeviceAccountKey(normalized && normalized.deviceId, normalized)
                || this._normalizeWhatsappDeviceIdentity(normalized && normalized.deviceId)
                || String(normalized && normalized.deviceId || '').trim();
            if (!normalized || !identityKey) {
                return;
            }

            const existingIndex = devices.findIndex(entry => {
                const candidateKey = this._getWhatsappDeviceAccountKey(entry && entry.deviceId, entry)
                    || this._normalizeWhatsappDeviceIdentity(entry && entry.deviceId)
                    || String(entry && entry.deviceId || '').trim();
                return candidateKey === identityKey;
            });
            if (existingIndex >= 0) {
                if (this._shouldReplaceWhatsappDeviceCatalogEntry(devices[existingIndex], normalized)) {
                    devices[existingIndex] = normalized;
                }
                seen.add(identityKey);
                return;
            }

            seen.add(identityKey);
            devices.push(normalized);
        };

        if (Array.isArray(meta.devices)) {
            meta.devices.forEach(entry => pushEntry(entry));
        }

        if (deviceInfo && deviceInfo.deviceId) {
            pushEntry({
                deviceId: deviceInfo.deviceId,
                phone_number: meta.phone_number || '',
                display_name: meta.display_name || '',
                alias: meta.alias || '',
                state: meta.state || '',
                created_at: meta.created_at || '',
                savedAt: meta.savedAt || meta.saved_at || ''
            }, deviceInfo.deviceId);
        }

        const hasExplicitSelectedDevice = Object.prototype.hasOwnProperty.call(meta, 'selectedDeviceId');
        const explicitSelectedDeviceId = String(meta.selectedDeviceId || '').trim();
        const requestedDeviceId = String(deviceInfo && deviceInfo.deviceId ? deviceInfo.deviceId : '').trim();
        const normalizedExplicitSelectedDeviceId = this._normalizeWhatsappDeviceIdentity(explicitSelectedDeviceId);
        const normalizedRequestedDeviceId = this._normalizeWhatsappDeviceIdentity(requestedDeviceId);
        let selectedDeviceId = '';

        if (hasExplicitSelectedDevice) {
            const explicitEntry = this._findBestWhatsappDeviceCatalogEntry(devices, explicitSelectedDeviceId);
            selectedDeviceId = explicitEntry && explicitEntry.deviceId ? explicitEntry.deviceId : '';
        } else if (requestedDeviceId) {
            const requestedEntry = this._findBestWhatsappDeviceCatalogEntry(devices, requestedDeviceId);
            selectedDeviceId = requestedEntry && requestedEntry.deviceId ? requestedEntry.deviceId : '';
        } else {
            selectedDeviceId = devices[0] && devices[0].deviceId ? devices[0].deviceId : '';
        }

        return { devices, selectedDeviceId, meta };
    }

    _applyWhatsappDeviceCatalogState(info = null) {
        const normalized = this._normalizeWhatsappDeviceCatalog(info);
        this.savedWhatsappDevices = normalized.devices;
        this.savedWhatsappDeviceId = normalized.selectedDeviceId || null;
        return normalized;
    }

    async _loadPreferredWhatsappDeviceInfo() {
        try {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasFn = dbHandle && typeof dbHandle.getWhatsappPreferredDeviceInfo === 'function';
            if (!hashedMasterKey || !dbHandle || !hasFn) {
                return null;
            }

            if (typeof dbHandle.initializeDatabase === 'function') {
                await dbHandle.initializeDatabase(hashedMasterKey);
            }

            return await dbHandle.getWhatsappPreferredDeviceInfo(hashedMasterKey);
        } catch (err) {
            console.warn('ConnectorsTab: _loadPreferredWhatsappDeviceInfo failed', err);
            return null;
        }
    }

    async _savePreferredWhatsappDeviceInfo(deviceId, metadata = '') {
        try {
            const resolvedDeviceId = String(deviceId || '').trim();
            if (resolvedDeviceId && !this._isWhatsappPairedDeviceId(resolvedDeviceId)) {
                console.warn('ConnectorsTab: refusing to persist non-paired preferred device id locally', {
                    deviceId: resolvedDeviceId
                });
                return false;
            }
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasFn = dbHandle && typeof dbHandle.saveWhatsappPreferredDeviceInfo === 'function';
            if (!hashedMasterKey || !dbHandle || !hasFn) {
                return false;
            }

            return !!(await dbHandle.saveWhatsappPreferredDeviceInfo(hashedMasterKey, resolvedDeviceId, metadata));
        } catch (err) {
            console.warn('ConnectorsTab: _savePreferredWhatsappDeviceInfo failed', err);
            return false;
        }
    }

    async _clearPreferredWhatsappDeviceInfo() {
        try {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasFn = dbHandle && typeof dbHandle.clearWhatsappPreferredDeviceInfo === 'function';
            if (!hashedMasterKey || !dbHandle || !hasFn) {
                return false;
            }

            return !!(await dbHandle.clearWhatsappPreferredDeviceInfo(hashedMasterKey));
        } catch (err) {
            console.warn('ConnectorsTab: _clearPreferredWhatsappDeviceInfo failed', err);
            return false;
        }
    }

    _buildWhatsappDeviceInfoPayload(selectedDeviceId, devices, fallbackMeta = null) {
        const normalizedDevices = Array.isArray(devices)
            ? devices.map(entry => this._sanitizeWhatsappDeviceCatalogEntry(entry)).filter(Boolean)
            : [];
        const meta = fallbackMeta && typeof fallbackMeta === 'object' ? { ...fallbackMeta } : {};
        delete meta.devices;
        delete meta.phone_number;
        delete meta.display_name;
        delete meta.alias;
        delete meta.state;
        delete meta.created_at;
        delete meta.savedAt;
        delete meta.saved_at;

        const resolvedSelectedDeviceId = String(selectedDeviceId || '').trim();
    const selectedEntry = this._findBestWhatsappDeviceCatalogEntry(normalizedDevices, resolvedSelectedDeviceId) || null;
        meta.devices = normalizedDevices;
        meta.selectedDeviceId = selectedEntry ? selectedEntry.deviceId : '';

        if (selectedEntry) {
            meta.phone_number = selectedEntry.phone_number || '';
            meta.display_name = selectedEntry.display_name || '';
            meta.alias = selectedEntry.alias || '';
            meta.state = selectedEntry.state || '';
            meta.created_at = selectedEntry.created_at || '';
            meta.savedAt = selectedEntry.savedAt || '';
        }

        return {
            deviceId: selectedEntry ? selectedEntry.deviceId : '',
            meta
        };
    }

    async _writeWhatsappDeviceCatalog(selectedDeviceId, devices, fallbackMeta = null) {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        const dbHandle = await this._getPaiperworkDBHandle();
        const hasFn = dbHandle && typeof dbHandle.saveWhatsappDeviceInfo === 'function';
        if (!hashedMasterKey || !dbHandle || !hasFn) {
            console.log('ConnectorsTab: _writeWhatsappDeviceCatalog skipped', {
                hasHashedMasterKey: !!hashedMasterKey,
                hasDbHandle: !!dbHandle,
                hasSaveWhatsappDeviceInfo: !!hasFn,
                selectedDeviceId,
                deviceIds: Array.isArray(devices) ? devices.map(entry => entry && entry.deviceId).filter(Boolean) : []
            });
            return false;
        }

        const payload = this._buildWhatsappDeviceInfoPayload(selectedDeviceId, devices, fallbackMeta);
        console.log('ConnectorsTab: _writeWhatsappDeviceCatalog saving payload', {
            selectedDeviceId,
            payloadDeviceId: payload.deviceId,
            payloadSelectedDeviceId: payload.meta && payload.meta.selectedDeviceId,
            payloadDeviceIds: Array.isArray(payload.meta && payload.meta.devices) ? payload.meta.devices.map(entry => entry && entry.deviceId).filter(Boolean) : []
        });
        const saveResult = await dbHandle.saveWhatsappDeviceInfo(hashedMasterKey, payload.deviceId, payload.meta);
        if (saveResult) {
            if (typeof dbHandle.saveWhatsappDeviceCatalog === 'function') {
				const catalogDevices = Array.isArray(payload.meta && payload.meta.devices) ? payload.meta.devices : [];
				const catalogSaveResult = await dbHandle.saveWhatsappDeviceCatalog(hashedMasterKey, catalogDevices);
                if (!catalogSaveResult) {
                    console.warn('ConnectorsTab: failed to persist WhatsApp device catalog registry');
                }
            }
            const preferredSaveResult = payload.deviceId
                ? await this._savePreferredWhatsappDeviceInfo(payload.deviceId, payload.meta)
                : await this._clearPreferredWhatsappDeviceInfo();
            if (!preferredSaveResult && payload.deviceId) {
                console.warn('ConnectorsTab: failed to persist preferred WhatsApp device info');
            }
            this._applyWhatsappDeviceCatalogState(payload);
        }
        return !!saveResult;
    }

    async _loadSavedWhatsappDevices() {
        const info = await this._loadSavedWhatsappDeviceInfo();
        return this._normalizeWhatsappDeviceCatalog(info).devices;
    }

    async _readSavedWhatsappDeviceCatalogFromDb(retryCount = 0) {
        try {
            const info = await this._loadSavedWhatsappDeviceInfo(retryCount);
            const normalized = this._normalizeWhatsappDeviceCatalog(info);
            console.log('ConnectorsTab: _readSavedWhatsappDeviceCatalogFromDb loaded catalog', {
                info,
                deviceCount: normalized.devices.length,
                selectedDeviceId: normalized.selectedDeviceId,
                deviceIds: normalized.devices.map(entry => entry.deviceId)
            });
            return {
                info,
                normalized
            };
        } catch (err) {
            console.warn('ConnectorsTab: _readSavedWhatsappDeviceCatalogFromDb failed', err);
            return { info: null, normalized: this._normalizeWhatsappDeviceCatalog(null) };
        }
    }

    async _selectSavedWhatsappDevice(deviceId, sourceDevices = null) {
        const resolvedDeviceId = String(deviceId || '').trim();
        if (!resolvedDeviceId) {
            return false;
        }

        const normalized = Array.isArray(sourceDevices)
            ? this._normalizeWhatsappDeviceCatalog(this._composeWhatsappDeviceInfoWithAuthoritativeDevices(null, null, sourceDevices))
            : this._normalizeWhatsappDeviceCatalog(await this._loadSavedWhatsappDeviceInfo());
        const resolvedEntry = this._findBestWhatsappDeviceCatalogEntry(normalized.devices, resolvedDeviceId);
        if (!resolvedEntry || !resolvedEntry.deviceId) {
            return false;
        }
        const canonicalSelectedDeviceId = String(resolvedEntry.deviceId || '').trim();

        const previousDeviceId = String(this.savedWhatsappDeviceId || '').trim();
        console.log('ConnectorsTab: _selectSavedWhatsappDevice', {
            resolvedDeviceId: canonicalSelectedDeviceId,
            previousDeviceId,
            availableDeviceIds: normalized.devices.map(entry => entry.deviceId)
        });
        const saveResult = await this._writeWhatsappDeviceCatalog(canonicalSelectedDeviceId, normalized.devices, normalized.meta);
        if (!saveResult) {
            return false;
        }

        if (previousDeviceId && previousDeviceId !== canonicalSelectedDeviceId) {
            this.whatsappSessionImportedForDevice = null;
            this.whatsappSessionRestoreSkippedForDevice = null;
        }

        try {
            await this._syncPreferredWhatsappDeviceWithServer(false);
        } catch (syncErr) {
            console.warn('ConnectorsTab: _selectSavedWhatsappDevice sync failed', syncErr);
        }

        return true;
    }

    async _upsertSavedWhatsappDevice(deviceId, metadata = {}, options = {}) {
        const resolvedDeviceId = String(deviceId || '').trim();
        if (!resolvedDeviceId) {
            return false;
        }

        const info = await this._loadSavedWhatsappDeviceInfo();
        const normalized = this._normalizeWhatsappDeviceCatalog(info);
        const previousSelectedDeviceId = String(this.savedWhatsappDeviceId || normalized.selectedDeviceId || '').trim();
        const matchingEntries = normalized.devices.filter(entry => this._matchesWhatsappDeviceReference(entry, resolvedDeviceId, metadata));
        const existingEntry = matchingEntries.sort((left, right) => this._getWhatsappDeviceCatalogRank(right) - this._getWhatsappDeviceCatalogRank(left))[0] || {};
        const nextEntry = this._sanitizeWhatsappDeviceCatalogEntry({
            ...existingEntry,
            ...metadata,
            deviceId: resolvedDeviceId,
            savedAt: new Date().toISOString()
        }, resolvedDeviceId);
        const removedDeviceIds = matchingEntries
            .map(entry => String(entry && entry.deviceId || '').trim())
            .filter(candidateDeviceId => candidateDeviceId && candidateDeviceId !== resolvedDeviceId);
        const nextDevices = normalized.devices.filter(entry => !this._matchesWhatsappDeviceReference(entry, resolvedDeviceId, metadata));
        nextDevices.unshift(nextEntry);

        const shouldSelect = options.select !== false;
        const nextSelectedDeviceId = shouldSelect
            ? nextEntry.deviceId
            : ((this._findBestWhatsappDeviceCatalogEntry(nextDevices, normalized.selectedDeviceId || previousSelectedDeviceId) || {}).deviceId || nextEntry.deviceId);
        console.log('ConnectorsTab: _upsertSavedWhatsappDevice', {
            resolvedDeviceId,
            previousSelectedDeviceId,
            shouldSelect,
            nextSelectedDeviceId,
            existingDeviceIds: normalized.devices.map(entry => entry.deviceId),
            nextDeviceIds: nextDevices.map(entry => entry.deviceId),
            removedDeviceIds
        });
        const saveResult = await this._writeWhatsappDeviceCatalog(nextSelectedDeviceId, nextDevices, normalized.meta);
        if (!saveResult) {
            return false;
        }

        if (removedDeviceIds.length) {
            await this._migrateSavedWhatsappSessionBundle(removedDeviceIds, nextEntry.deviceId);
        }

        if (previousSelectedDeviceId && previousSelectedDeviceId !== nextEntry.deviceId && shouldSelect) {
            this.whatsappSessionImportedForDevice = null;
            this.whatsappSessionRestoreSkippedForDevice = null;
        }

        try {
            await this._syncPreferredWhatsappDeviceWithServer(shouldSelect);
        } catch (syncErr) {
            console.warn('ConnectorsTab: _upsertSavedWhatsappDevice sync failed', syncErr);
        }

        return true;
    }

    async _removeSavedWhatsappDevice(deviceId, options = {}) {
        const resolvedDeviceId = String(deviceId || this.savedWhatsappDeviceId || '').trim();
        if (!resolvedDeviceId) {
            return false;
        }

        const info = await this._loadSavedWhatsappDeviceInfo();
        const normalized = this._normalizeWhatsappDeviceCatalog(info);
        const normalizedResolvedDeviceId = this._normalizeWhatsappDeviceIdentity(resolvedDeviceId);
        const matchesResolvedDevice = (candidateDeviceId) => {
            const resolvedCandidateDeviceId = String(candidateDeviceId || '').trim();
            if (!resolvedCandidateDeviceId) {
                return false;
            }
            if (resolvedCandidateDeviceId === resolvedDeviceId) {
                return true;
            }
            return normalizedResolvedDeviceId && this._normalizeWhatsappDeviceIdentity(resolvedCandidateDeviceId) === normalizedResolvedDeviceId;
        };
        const remainingDevices = normalized.devices.filter(entry => !matchesResolvedDevice(entry && entry.deviceId));
        const wasSelected = matchesResolvedDevice(normalized.selectedDeviceId);
        const fallbackSelection = options.selectReplacement === 'none'
            ? ''
            : (remainingDevices[0] && remainingDevices[0].deviceId ? remainingDevices[0].deviceId : '');
        const nextSelectedDeviceId = wasSelected ? fallbackSelection : (normalized.selectedDeviceId || fallbackSelection);
        console.log('ConnectorsTab: _removeSavedWhatsappDevice', {
            resolvedDeviceId,
            reason: options.reason || '',
            wasSelected,
            previousSelectedDeviceId: normalized.selectedDeviceId || '',
            remainingDeviceIds: remainingDevices.map(entry => entry.deviceId),
            nextSelectedDeviceId
        });

        if (!remainingDevices.length) {
            await this._clearSavedWhatsappDeviceInfo();
            console.log('ConnectorsTab: _removeSavedWhatsappDevice cleared all saved device info', {
                resolvedDeviceId,
                reason: options.reason || ''
            });
        } else {
            const saveResult = await this._writeWhatsappDeviceCatalog(nextSelectedDeviceId, remainingDevices, normalized.meta);
            if (!saveResult) {
                console.warn('ConnectorsTab: _removeSavedWhatsappDevice failed to persist updated device catalog', {
                    resolvedDeviceId,
                    reason: options.reason || '',
                    attemptedRemainingDeviceIds: remainingDevices.map(entry => entry.deviceId)
                });
                return false;
            }
            console.log('ConnectorsTab: _removeSavedWhatsappDevice persisted updated device catalog', {
                resolvedDeviceId,
                reason: options.reason || '',
                remainingDeviceIds: remainingDevices.map(entry => entry.deviceId),
                nextSelectedDeviceId
            });
        }

        await this._clearSavedWhatsappSessionBundle(resolvedDeviceId);
        if (matchesResolvedDevice(this.whatsappSessionImportedForDevice)) {
            this.whatsappSessionImportedForDevice = null;
        }
        if (matchesResolvedDevice(this.whatsappSessionRestoreSkippedForDevice)) {
            this.whatsappSessionRestoreSkippedForDevice = null;
        }

        if (options.syncServer !== false) {
            if (this.savedWhatsappDeviceId) {
                try {
                    await this._syncPreferredWhatsappDeviceWithServer(false);
                } catch (syncErr) {
                    console.warn('ConnectorsTab: _removeSavedWhatsappDevice sync failed', syncErr);
                }
            } else {
                await this._clearPreferredWhatsappDeviceOnServer(options.reason || 'device-removed');
            }
        }

		const postDeleteCatalog = await this._readSavedWhatsappDeviceCatalogFromDb();
		console.log('ConnectorsTab: _removeSavedWhatsappDevice post-delete catalog snapshot', {
			resolvedDeviceId,
			reason: options.reason || '',
			selectedDeviceId: postDeleteCatalog && postDeleteCatalog.normalized ? postDeleteCatalog.normalized.selectedDeviceId : '',
			remainingDeviceIds: postDeleteCatalog && postDeleteCatalog.normalized && Array.isArray(postDeleteCatalog.normalized.devices)
				? postDeleteCatalog.normalized.devices.map(entry => entry.deviceId)
				: []
		});

        return true;
    }

    async _forgetSavedWhatsappDeviceAfterUnpair(deviceId = null, reason = 'remote-unpair') {
        try {
            const resolvedDeviceId = this._resolveSavedWhatsappCatalogDeviceId(deviceId || this.savedWhatsappDeviceId || '');
			console.log('ConnectorsTab: _forgetSavedWhatsappDeviceAfterUnpair begin', {
				deviceId: deviceId || null,
				resolvedDeviceId: resolvedDeviceId || null,
				reason
			});
            await this._clearWhatsappRuntimeSession(resolvedDeviceId || null);

            if (!resolvedDeviceId) {
                await this._clearSavedWhatsappDeviceInfo();
				console.log('ConnectorsTab: _forgetSavedWhatsappDeviceAfterUnpair cleared all saved device info because no resolved device remained', {
					reason
				});
                return;
            }

            await this._removeSavedWhatsappDevice(resolvedDeviceId, {
                reason,
                selectReplacement: 'none'
            });

            this.whatsappStalePreferredDeviceCleared = resolvedDeviceId;
			console.log('ConnectorsTab: _forgetSavedWhatsappDeviceAfterUnpair completed', {
				resolvedDeviceId,
				reason,
				whatsappStalePreferredDeviceCleared: this.whatsappStalePreferredDeviceCleared
			});
        } catch (err) {
            console.warn('ConnectorsTab: _forgetSavedWhatsappDeviceAfterUnpair failed', err);
        }
    }

    _formatWhatsappSavedDeviceLabel(device) {
        const entry = this._sanitizeWhatsappDeviceCatalogEntry(device);
        if (!entry) {
            return {
                primary: 'Unknown device',
                secondary: '',
                deviceId: ''
            };
        }

        const primary = entry.alias || entry.display_name || entry.phone_number || `Device ${entry.deviceId.slice(-8)}`;
        const secondary = [entry.phone_number, entry.display_name, entry.state, entry.created_at]
            .filter(value => !!value && value !== primary)
            .join(' | ');

        return {
            primary,
            secondary,
            deviceId: entry.deviceId
        };
    }

    _closeWhatsappDeviceChooserModal() {
        const existing = document.getElementById('wa-device-chooser-modal');
        if (existing && existing.parentNode) {
            existing.parentNode.removeChild(existing);
        }
    }

    async _showWhatsappDeviceChooserModal(devices) {
        const entries = Array.isArray(devices)
            ? devices.map(entry => this._sanitizeWhatsappDeviceCatalogEntry(entry)).filter(Boolean)
            : [];
        if (entries.length <= 1) {
            return entries[0] ? entries[0].deviceId : null;
        }

        this._closeWhatsappDeviceChooserModal();

        return new Promise(resolve => {
            let currentEntries = [...entries];
            const overlay = document.createElement('div');
            overlay.id = 'wa-device-chooser-modal';
            overlay.style.cssText = 'position:fixed;inset:0;background:var(--modal-overlay-bg, rgba(15,23,42,0.55));display:flex;align-items:center;justify-content:center;z-index:100001;padding:16px;';

            const dialog = document.createElement('div');
            dialog.style.cssText = 'width:min(520px,100%);max-height:min(80vh,720px);overflow:auto;background:var(--card-bg,#fff);color:var(--text-color,#111);border:1px solid var(--border-color,#d0d7de);border-radius:14px;box-shadow:var(--wa-modal-shadow, 0 18px 55px rgba(15,23,42,0.22));padding:18px;';

            const title = document.createElement('h3');
            title.textContent = 'Choose a saved WhatsApp device';
            title.style.cssText = 'margin:0 0 8px 0;font-size:20px;line-height:1.2;';

            const description = document.createElement('p');
            description.textContent = 'Select the device Paiperwork should reconnect before opening the QR flow.';
            description.style.cssText = 'margin:0 0 16px 0;color:var(--wa-modal-muted,#5b6573);line-height:1.45;';

            const list = document.createElement('div');
            list.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

            const finish = (value) => {
                this._closeWhatsappDeviceChooserModal();
                resolve(value);
            };

            const renderList = () => {
                list.innerHTML = '';

                if (!currentEntries.length) {
                    const empty = document.createElement('div');
                    empty.textContent = 'No saved WhatsApp devices remain.';
                    empty.style.cssText = 'padding:14px 16px;border:1px dashed var(--border-color,#d0d7de);border-radius:12px;color:var(--wa-modal-muted,#5b6573);text-align:center;';
                    list.appendChild(empty);
                    return;
                }

                currentEntries.forEach(entry => {
                    const label = this._formatWhatsappSavedDeviceLabel(entry);
                    const item = document.createElement('div');
                    item.style.cssText = 'display:flex;flex-direction:column;gap:8px;width:100%;';

                    const card = document.createElement('div');
                    card.tabIndex = 0;
                    card.setAttribute('role', 'button');
                    card.setAttribute('aria-label', `Select ${label.primary}`);
                    card.style.cssText = 'display:flex;flex-direction:column;align-items:flex-start;gap:4px;box-sizing:border-box;width:100%;padding:14px 16px;border:1px solid var(--border-color,#d0d7de);border-radius:12px;background:var(--panel-background, var(--card-bg,#fff));color:var(--text-color,#111);cursor:pointer;text-align:left;transition:border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease;';

                    const primary = document.createElement('span');
                    primary.textContent = label.primary;
                    primary.style.cssText = 'font-size:15px;font-weight:600;color:var(--text-color,#111);';

                    const secondary = document.createElement('span');
                    secondary.textContent = label.secondary || `Device ID: ${label.deviceId}`;
                    secondary.style.cssText = 'font-size:12px;color:var(--wa-modal-muted,#5b6573);line-height:1.4;';

                    card.appendChild(primary);
                    card.appendChild(secondary);
                    card.addEventListener('click', () => finish(label.deviceId));
                    card.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            finish(label.deviceId);
                        }
                    });
                    card.addEventListener('mouseenter', () => {
                        card.style.borderColor = 'var(--accent-color, #4f46e5)';
                        card.style.background = 'var(--hover-background, var(--panel-background, var(--card-bg,#fff)))';
                        card.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--accent-color, #4f46e5) 18%, transparent)';
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.borderColor = 'var(--border-color,#d0d7de)';
                        card.style.background = 'var(--panel-background, var(--card-bg,#fff))';
                        card.style.boxShadow = 'none';
                    });
                    card.addEventListener('focus', () => {
                        card.style.borderColor = 'var(--accent-color, #4f46e5)';
                        card.style.background = 'var(--hover-background, var(--panel-background, var(--card-bg,#fff)))';
                        card.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--accent-color, #4f46e5) 20%, transparent)';
                    });
                    card.addEventListener('blur', () => {
                        card.style.borderColor = 'var(--border-color,#d0d7de)';
                        card.style.background = 'var(--panel-background, var(--card-bg,#fff))';
                        card.style.boxShadow = 'none';
                    });

                    const deleteButton = document.createElement('button');
                    deleteButton.type = 'button';
                    deleteButton.textContent = 'Delete from saved devices';
                    deleteButton.style.cssText = 'align-self:flex-start;margin-left:2px;padding:8px 12px;border:1px solid var(--danger-color, #dc3545);border-radius:9px;background:transparent;color:var(--danger-color, #dc3545);cursor:pointer;font-weight:600;font-size:12px;transition:background-color 120ms ease, color 120ms ease, border-color 120ms ease;';
                    deleteButton.addEventListener('mouseenter', () => {
                        deleteButton.style.background = 'var(--danger-color, #dc3545)';
                        deleteButton.style.color = 'var(--accent-text, #ffffff)';
                        deleteButton.style.borderColor = 'var(--danger-color, #dc3545)';
                    });
                    deleteButton.addEventListener('mouseleave', () => {
                        deleteButton.style.background = 'transparent';
                        deleteButton.style.color = 'var(--danger-color, #dc3545)';
                        deleteButton.style.borderColor = 'var(--danger-color, #dc3545)';
                    });
                    deleteButton.addEventListener('focus', () => {
                        deleteButton.style.background = 'var(--danger-color, #dc3545)';
                        deleteButton.style.color = 'var(--accent-text, #ffffff)';
                        deleteButton.style.borderColor = 'var(--danger-color, #dc3545)';
                    });
                    deleteButton.addEventListener('blur', () => {
                        deleteButton.style.background = 'transparent';
                        deleteButton.style.color = 'var(--danger-color, #dc3545)';
                        deleteButton.style.borderColor = 'var(--danger-color, #dc3545)';
                    });
                    deleteButton.addEventListener('click', async (event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        const confirmed = window.confirm(
                            `Are you sure you want to delete ${label.primary} from the saved device list? This removes the device from Paiperwork's database list and you may need to pair it again later with a new QR code.`
                        );
                        if (!confirmed) {
                            return;
                        }

                        deleteButton.disabled = true;
                        deleteButton.textContent = 'Deleting...';

                        try {
                            const removed = await this._removeSavedWhatsappDevice(label.deviceId, {
                                reason: 'chooser-delete',
                                selectReplacement: 'none'
                            });
                            if (!removed) {
                                deleteButton.disabled = false;
                                deleteButton.textContent = 'Delete from saved devices';
                                return;
                            }

                            currentEntries = currentEntries.filter(item => item.deviceId !== label.deviceId);
                            renderList();

                            if (!currentEntries.length) {
                                finish(null);
                            }
                        } catch (err) {
                            console.warn('ConnectorsTab: failed to delete saved whatsapp device from chooser', err);
                            deleteButton.disabled = false;
                            deleteButton.textContent = 'Delete from saved devices';
                        }
                    });

                    item.appendChild(card);
                    item.appendChild(deleteButton);
                    list.appendChild(item);
                });
            };

            renderList();

            const footer = document.createElement('div');
            footer.style.cssText = 'display:flex;justify-content:flex-end;margin-top:16px;';

            const cancel = document.createElement('button');
            cancel.type = 'button';
            cancel.textContent = 'Cancel';
            cancel.style.cssText = 'padding:10px 14px;border:1px solid var(--border-color,#d0d7de);border-radius:10px;background:var(--button-secondary-bg, var(--panel-background, #e5e7eb));color:var(--button-secondary-text, var(--text-color, #111));cursor:pointer;font-weight:600;';
            cancel.addEventListener('click', () => finish(null));

            footer.appendChild(cancel);
            dialog.appendChild(title);
            dialog.appendChild(description);
            dialog.appendChild(list);
            dialog.appendChild(footer);
            overlay.appendChild(dialog);
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    finish(null);
                }
            });
            document.body.appendChild(overlay);
        });
    }

    async _chooseSavedWhatsappDeviceForStart() {
        const { normalized } = await this._readSavedWhatsappDeviceCatalogFromDb();
        const devices = Array.isArray(normalized && normalized.devices) ? normalized.devices : [];
        console.log('ConnectorsTab: _chooseSavedWhatsappDeviceForStart resolved devices', {
            deviceCount: devices.length,
            savedWhatsappDeviceId: this.savedWhatsappDeviceId,
            deviceIds: devices.map(entry => entry.deviceId)
        });

        if (!Array.isArray(devices) || devices.length <= 1) {
            if (devices[0] && devices[0].deviceId) {
                console.log('ConnectorsTab: _chooseSavedWhatsappDeviceForStart auto-selecting single device', {
                    deviceId: devices[0].deviceId
                });
                await this._selectSavedWhatsappDevice(devices[0].deviceId, devices);
            }
            return true;
        }

        console.log('ConnectorsTab: _chooseSavedWhatsappDeviceForStart opening chooser modal');
        const chosenDeviceId = await this._showWhatsappDeviceChooserModal(devices);
        if (!chosenDeviceId) {
            console.log('ConnectorsTab: _chooseSavedWhatsappDeviceForStart chooser cancelled');
            return false;
        }

        console.log('ConnectorsTab: _chooseSavedWhatsappDeviceForStart chooser selected device', { chosenDeviceId });
        return this._selectSavedWhatsappDevice(chosenDeviceId, devices);
    }

    async _recoverWhatsappPreferredDeviceRequirement(errorBody = {}, options = {}, requestGeneration = this.whatsappRequestGeneration) {
        if (!this._isWhatsappRequestActive(requestGeneration)) {
            return null;
        }

        const message = String((errorBody && errorBody.message) || '').trim()
            || 'A preferred WhatsApp device is required before reconnecting this runtime.';
        const candidateCount = Number((errorBody && errorBody.candidateCount) || 0);
        const interactiveRecovery = !!options.start || !!this.serverStarting;
        const { normalized } = await this._readSavedWhatsappDeviceCatalogFromDb();
        const devices = Array.isArray(normalized && normalized.devices) ? normalized.devices : [];

        if (devices.length === 1 && devices[0] && devices[0].deviceId) {
            const recoveredDeviceId = String(devices[0].deviceId || '').trim();
            const selected = await this._selectSavedWhatsappDevice(recoveredDeviceId, devices);
            if (selected) {
                this.setWhatsappModalStatus('Recovered saved WhatsApp device selection. Retrying...');
                return this.refreshWhatsappPairButton({
                    ...options,
                    requestGeneration,
                    allowPreferredDeviceRecovery: false
                });
            }
        }

        if (devices.length > 1 && interactiveRecovery) {
            this.setWhatsappModalStatus('Choose which saved WhatsApp device should reconnect.');
            const chosenDeviceId = await this._showWhatsappDeviceChooserModal(devices);
            if (chosenDeviceId) {
                const selected = await this._selectSavedWhatsappDevice(chosenDeviceId, devices);
                if (selected) {
                    this.setWhatsappModalStatus('Saved WhatsApp device selected. Retrying...');
                    return this.refreshWhatsappPairButton({
                        ...options,
                        requestGeneration,
                        allowPreferredDeviceRecovery: false
                    });
                }
            }
        }

        if (!devices.length && options.start) {
            this.setWhatsappModalStatus('No saved WhatsApp device is available. Switching to fresh pairing...');
            this._setWhatsappFreshPairRequested(true);
            this.whatsappFreshPairDeviceId = null;
            await this._setWhatsappPreferredDeviceOnServer('', '');
            return this.refreshWhatsappPairButton({
                ...options,
                requestGeneration,
                freshPair: true,
                allowPreferredDeviceRecovery: false
            });
        }

        this.setWhatsappPairButtonState(false);
        if (candidateCount > 1 && devices.length > 1) {
            this.setWhatsappModalStatus('Choose a saved WhatsApp device before reconnecting, or use Pair new device.');
        } else {
            this.setWhatsappModalStatus(message);
        }
        return null;
    }

    async _loadSavedWhatsappDeviceInfo(retryCount = 0) {
        try {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasFn = dbHandle && typeof dbHandle.getWhatsappDeviceInfo === 'function';
            //console.log('ConnectorsTab: _loadSavedWhatsappDeviceInfo called', { hashedMasterKey, hasDbHandle: !!dbHandle, hasFn, retryCount });

            if (!hashedMasterKey || !dbHandle || !hasFn) {
                const missingMetas = {
                    hashedMasterKey: !!hashedMasterKey,
                    dbHandle: !!dbHandle,
                    getWhatsappDeviceInfoFn: hasFn
                };
                //console.log('ConnectorsTab: _loadSavedWhatsappDeviceInfo missing hashed key or DB handle', missingMetas);

                if (retryCount < 6 && hashedMasterKey) {
                    // Wait for PaiperworkDB to initialize in the app startup flow.
                    await new Promise(resolve => setTimeout(resolve, 250));
                    return this._loadSavedWhatsappDeviceInfo(retryCount + 1);
                }

                return null;
            }

            if (typeof dbHandle.initializeDatabase === 'function') {
                //console.log('ConnectorsTab: _loadSavedWhatsappDeviceInfo initializing DB handle');
                await dbHandle.initializeDatabase(hashedMasterKey);
            }

            let info = await dbHandle.getWhatsappDeviceInfo(hashedMasterKey);
            const preferredInfo = await this._loadPreferredWhatsappDeviceInfo();
            const registryCatalog = typeof dbHandle.getWhatsappDeviceCatalog === 'function'
                ? await dbHandle.getWhatsappDeviceCatalog(hashedMasterKey)
                : [];
            if (Array.isArray(registryCatalog) && registryCatalog.length > 0) {
                info = this._composeWhatsappDeviceInfoWithAuthoritativeDevices(info, preferredInfo, registryCatalog);
            }
            if (!info) {
                //console.log('ConnectorsTab: _loadSavedWhatsappDeviceInfo no WhatsApp device info found');
            } else {
                //console.log('ConnectorsTab: _loadSavedWhatsappDeviceInfo retrieved info', info);
            }

            const normalized = this._applyWhatsappDeviceCatalogState(info);
            const preferredDeviceId = String(preferredInfo && preferredInfo.deviceId ? preferredInfo.deviceId : '').trim();
            const selectedDeviceId = String(normalized.selectedDeviceId || '').trim();
            const preferredEntry = preferredDeviceId
                ? this._findBestWhatsappDeviceCatalogEntry(normalized.devices, preferredDeviceId, preferredInfo && preferredInfo.meta ? preferredInfo.meta : null)
                : null;
            const selectedEntry = selectedDeviceId
                ? this._findBestWhatsappDeviceCatalogEntry(normalized.devices, selectedDeviceId, normalized.meta || null)
                : null;
            if (preferredEntry && preferredEntry.deviceId) {
                this.savedWhatsappDeviceId = preferredEntry.deviceId;
            } else if (selectedEntry && selectedEntry.deviceId) {
                this.savedWhatsappDeviceId = selectedEntry.deviceId;
            } else if (normalized.devices.length === 1 && normalized.devices[0] && normalized.devices[0].deviceId) {
                this.savedWhatsappDeviceId = normalized.devices[0].deviceId;
            } else {
                this.savedWhatsappDeviceId = null;
            }

            return info;
        } catch (err) {
            console.warn('ConnectorsTab: _loadSavedWhatsappDeviceInfo failed', err);
            return null;
        }
    }

    async _saveCurrentWhatsappDeviceInfo(targetDeviceId = null, retryCount = 0) {
        try {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasFn = dbHandle && typeof dbHandle.saveWhatsappDeviceInfo === 'function';
            //console.log('ConnectorsTab: _saveCurrentWhatsappDeviceInfo called', { hashedMasterKey, hasDbHandle: !!dbHandle, hasFn, retryCount });

            if (!hashedMasterKey || !dbHandle || !hasFn) {
                /*console.log('ConnectorsTab: _saveCurrentWhatsappDeviceInfo missing hashed key or DB handle', {
                    hashedMasterKey: !!hashedMasterKey,
                    dbHandle: !!dbHandle,
                    saveFn: hasFn
                });*/

                if (retryCount < 6 && hashedMasterKey) {
                    await new Promise(resolve => setTimeout(resolve, 250));
                    return this._saveCurrentWhatsappDeviceInfo(targetDeviceId, retryCount + 1);
                }

                return;
            }

            const params = this._appendWhatsappUserScope(new URLSearchParams());
            const res = await fetch(`/api/whatsapp/devices?${params.toString()}`, {
                headers: this._getWhatsappUserScopedHeaders(),
                cache: 'no-store'
            });
            //console.log('ConnectorsTab: /api/whatsapp/devices returned', { status: res.status });
            if (!res.ok) {
                console.warn('ConnectorsTab: _saveCurrentWhatsappDeviceInfo no devices, status', res.status);
                return;
            }
            const body = await res.json();
            const devices = Array.isArray(body.results) ? body.results : (Array.isArray(body) ? body : []);
            //console.log('ConnectorsTab: _saveCurrentWhatsappDeviceInfo devices', devices);
            const desiredDeviceId = this._resolveSavedWhatsappCatalogDeviceId(targetDeviceId || this.savedWhatsappDeviceId || '');
            const normalizedDesiredDeviceId = this._normalizeWhatsappDeviceIdentity(desiredDeviceId);
            const desiredDeviceIsPaired = this._isWhatsappPairedDeviceId(desiredDeviceId);
            const connectedDevices = devices.filter(d => d && d.state === 'logged_in');
            let connectedDevice = null;

            if (normalizedDesiredDeviceId) {
                connectedDevice = connectedDevices.find(d => {
                    const candidateDeviceId = String((d && (d.id || d.device || d.device_id)) || '').trim();
                    return this._normalizeWhatsappDeviceIdentity(candidateDeviceId) === normalizedDesiredDeviceId;
                }) || null;

				// When the user explicitly chose a device from the multi-device modal,
				// do not silently overwrite that choice with another logged-in device
				// just because the gateway returned a different device first.
				if (!connectedDevice && connectedDevices.length > 0) {
                    if (desiredDeviceIsPaired) {
                        console.warn('ConnectorsTab: _saveCurrentWhatsappDeviceInfo preserving explicit paired device selection because no connected device matched the requested identity', {
                            desiredDeviceId,
                            connectedDeviceIds: connectedDevices.map(d => String((d && (d.id || d.device || d.device_id)) || '').trim()).filter(Boolean)
                        });
                        return;
                    }

                    console.warn('ConnectorsTab: _saveCurrentWhatsappDeviceInfo ignoring transient placeholder selection and promoting the connected paired device for persistence', {
                        desiredDeviceId,
                        connectedDeviceIds: connectedDevices.map(d => String((d && (d.id || d.device || d.device_id)) || '').trim()).filter(Boolean)
                    });
				}
            }

            if (!connectedDevice) {
                connectedDevice = connectedDevices[0] || null;
            }

            const resolvedConnectedDeviceId = String((connectedDevice && (connectedDevice.id || connectedDevice.device || connectedDevice.device_id)) || '').trim();
            if (!connectedDevice || !resolvedConnectedDeviceId) {
                //console.log('ConnectorsTab: _saveCurrentWhatsappDeviceInfo found no connected device');
                return;
            }

            const metadata = {};
            if (connectedDevice.phone_number) {
                metadata.phone_number = connectedDevice.phone_number;
            }
            if (connectedDevice.display_name) {
                metadata.display_name = connectedDevice.display_name;
            }
            if (connectedDevice.jid) {
                metadata.jid = connectedDevice.jid;
            }
            if (connectedDevice.state) {
                metadata.state = connectedDevice.state;
            }
            if (connectedDevice.created_at) {
                metadata.created_at = connectedDevice.created_at;
            }

            await this._upsertSavedWhatsappDevice(resolvedConnectedDeviceId, metadata);
            try {
                await this._captureWhatsappSessionBundle(resolvedConnectedDeviceId);
            } catch (captureErr) {
                console.warn('ConnectorsTab: failed to capture session bundle after save', captureErr);
            }
            if (this.whatsappUnpairButton) {
                this.whatsappUnpairButton.disabled = false;
                this.whatsappUnpairButton.style.display = 'inline-block';
            }
        } catch (err) {
            console.warn('ConnectorsTab: _saveCurrentWhatsappDeviceInfo failed', err);
        }
    }

    async _clearSavedWhatsappDeviceInfo() {
        try {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasFn = dbHandle && typeof dbHandle.clearWhatsappDeviceInfo === 'function';
            if (!hashedMasterKey || !dbHandle || !hasFn) {
                //console.log('ConnectorsTab: _clearSavedWhatsappDeviceInfo skipped - missing hashed key or DB handle', { hashedMasterKey: !!hashedMasterKey, dbHandle: !!dbHandle, clearFn: hasFn });
                return;
            }
            await dbHandle.clearWhatsappDeviceInfo(hashedMasterKey);
            if (typeof dbHandle.clearWhatsappDeviceCatalog === 'function') {
                await dbHandle.clearWhatsappDeviceCatalog(hashedMasterKey);
            }
            if (typeof dbHandle.clearAllWhatsappSessionBundles === 'function') {
                await dbHandle.clearAllWhatsappSessionBundles(hashedMasterKey);
            }
            await this._clearPreferredWhatsappDeviceInfo();
            this.savedWhatsappDeviceId = null;
            this.savedWhatsappDevices = [];
            if (this.whatsappUnpairButton) {
                this.whatsappUnpairButton.disabled = true;
                this.whatsappUnpairButton.style.display = 'none';
            }
            //console.log('ConnectorsTab: Cleared saved WhatsApp device info from DB');
        } catch (err) {
            console.warn('ConnectorsTab: _clearSavedWhatsappDeviceInfo failed', err);
        }
    }

    async _clearPreferredWhatsappDeviceOnServer(reason = '') {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!hashedMasterKey) {
            return;
        }

        try {
            const params = new URLSearchParams();
            params.set('user', hashedMasterKey);
            if (reason) {
                params.set('reason', String(reason));
            }
            const res = await fetch('/api/whatsapp/preferred-device?' + params.toString(), {
                method: 'DELETE',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' })
            });
            if (!res.ok) {
                console.warn('ConnectorsTab: _clearPreferredWhatsappDeviceOnServer failed', await res.text());
            }
        } catch (err) {
            console.warn('ConnectorsTab: _clearPreferredWhatsappDeviceOnServer request failed', err);
        }
    }

    async _resetStoredWhatsappDeviceForFreshPairing(reason = '') {
        try {
            //console.log('ConnectorsTab: resetting stored WhatsApp device for fresh pairing', { reason });
            const activeDeviceId = String(this.savedWhatsappDeviceId || '').trim();
            await this._clearWhatsappRuntimeSession(activeDeviceId || null);
            await this._clearStoredPreferredWhatsappDeviceReferences(activeDeviceId || null, reason || 'device-reset');
        } catch (err) {
            console.warn('ConnectorsTab: _resetStoredWhatsappDeviceForFreshPairing failed', err);
        }
    }

    async _clearStoredPreferredWhatsappDeviceReferences(deviceId = null, reason = 'device-reset') {
        try {
            const resolvedDeviceId = String(deviceId || this.savedWhatsappDeviceId || '').trim();
            const info = await this._loadSavedWhatsappDeviceInfo();
            const normalized = this._normalizeWhatsappDeviceCatalog(info);

            await this._clearPreferredWhatsappDeviceOnServer(reason);

            if (!normalized.devices.length) {
                await this._clearSavedWhatsappDeviceInfo();
            } else {
                const saveResult = await this._writeWhatsappDeviceCatalog('', normalized.devices, normalized.meta);
                if (!saveResult) {
                    console.warn('ConnectorsTab: failed to clear selected WhatsApp device while preserving saved catalog', {
                        reason,
                        deviceId: resolvedDeviceId || null
                    });
                }
            }
            if (resolvedDeviceId) {
                this.whatsappStalePreferredDeviceCleared = resolvedDeviceId;
            }
        } catch (err) {
            console.warn('ConnectorsTab: _clearStoredPreferredWhatsappDeviceReferences failed', err);
        }
    }

    async _maybeClearStalePreferredDeviceOnQrFallback(data) {
        const hadSavedDevice = String(this.savedWhatsappDeviceId || '').trim();
        const hasQrFallback = !!(data && data.qrDataUrl);
        const isConnected = !!(data && data.loggedIn);
        if (!hadSavedDevice || !hasQrFallback || isConnected) {
            return;
        }

        // Do not clear preferred device just because QR exists.
        // In NoDisk/startup races, backend can temporarily return a QR while the preferred
        // device is still valid. Only clear when backend signals explicit stale/deleted state.
        const statusText = [
            String((data && data.status) || ''),
            String((data && data.reason) || ''),
            String((data && data.message) || ''),
            String((data && data.error) || ''),
            String((data && data.details) || '')
        ].join(' ').toLowerCase();

        const explicitStaleDevice = /(remote logout|logged out from phone|removed from phone whatsapp|device unlinked from phone|remote_logout)/.test(statusText);
        if (!explicitStaleDevice) {
            /*console.log('ConnectorsTab: keeping preferred device during QR fallback (no explicit stale-device signal)', {
                hadSavedDevice,
                status: data && data.status,
                reason: data && data.reason
            });*/
            return;
        }

        if (this.whatsappStalePreferredDeviceCleared === hadSavedDevice) {
            return;
        }

        //console.log('ConnectorsTab: removing saved device because QR fallback indicates explicit phone-side unlink', { hadSavedDevice });
        await this._forgetSavedWhatsappDeviceAfterUnpair(hadSavedDevice, 'qr-fallback-remote-unpair');
        this.setWhatsappSessionRestoreStatus('Session restore: unpaired device removed from saved list, waiting for fresh pairing.');
    }

    async _clearSavedWhatsappSessionBundle(deviceId = null) {
        try {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            const resolvedDeviceId = String(deviceId || this.savedWhatsappDeviceId || '').trim();
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasFn = dbHandle && typeof dbHandle.clearWhatsappSessionBundle === 'function';
            if (!hashedMasterKey || !resolvedDeviceId || !dbHandle || !hasFn) {
				console.log('ConnectorsTab: _clearSavedWhatsappSessionBundle skipped', {
					hasHashedMasterKey: !!hashedMasterKey,
					resolvedDeviceId,
					hasDbHandle: !!dbHandle,
					hasClearFunction: !!hasFn
				});
                return;
            }

            await dbHandle.clearWhatsappSessionBundle(hashedMasterKey, resolvedDeviceId);
			console.log('ConnectorsTab: _clearSavedWhatsappSessionBundle cleared session bundle', {
				resolvedDeviceId
			});
        } catch (err) {
            console.warn('ConnectorsTab: _clearSavedWhatsappSessionBundle failed', err);
        }
    }

    async _clearWhatsappRuntimeSession(deviceId = null) {
        try {
            const resolvedDeviceId = String(deviceId || this.savedWhatsappDeviceId || '').trim();
            const params = new URLSearchParams();
            if (resolvedDeviceId) {
                params.set('device_id', resolvedDeviceId);
            }
            this._appendWhatsappUserScope(params);
            await fetch('/api/whatsapp/session?' + params.toString(), {
                method: 'DELETE',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' })
            });
        } catch (err) {
            console.warn('ConnectorsTab: _clearWhatsappRuntimeSession failed', err);
        }
    }

    async _captureWhatsappSessionBundle(deviceId = null) {
        const resolvedDeviceId = String(deviceId || this.savedWhatsappDeviceId || '').trim();
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!resolvedDeviceId || !hashedMasterKey) {
            return false;
        }

        try {
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasFn = dbHandle && typeof dbHandle.saveWhatsappSessionBundle === 'function';
            if (!hasFn) {
                return false;
            }

            const params = new URLSearchParams();
            params.set('device_id', resolvedDeviceId);
            this._appendWhatsappUserScope(params);
            const response = await fetch('/api/whatsapp/session/export?' + params.toString(), {
                method: 'GET',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' })
            });
            if (!response.ok) {
                return false;
            }

            const payload = await response.json();
            const session = payload && payload.results && payload.results.session;
            if (!session || typeof session !== 'object') {
                return false;
            }

            await dbHandle.saveWhatsappSessionBundle(hashedMasterKey, resolvedDeviceId, session, {
                source: 'gowa-export',
                capturedAt: new Date().toISOString()
            });

            return true;
        } catch (err) {
            console.warn('ConnectorsTab: _captureWhatsappSessionBundle failed', err);
            return false;
        }
    }

    async _hasSavedWhatsappSessionBundle(deviceId = null) {
        const resolvedDeviceId = String(deviceId || this.savedWhatsappDeviceId || '').trim();
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!resolvedDeviceId || !hashedMasterKey) {
            return false;
        }

        try {
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasGetFn = dbHandle && typeof dbHandle.getWhatsappSessionBundle === 'function';
            if (!hasGetFn) {
                return false;
            }
            const stored = await dbHandle.getWhatsappSessionBundle(hashedMasterKey, resolvedDeviceId);
            return !!(stored && stored.session && typeof stored.session === 'object');
        } catch (err) {
            console.warn('ConnectorsTab: _hasSavedWhatsappSessionBundle failed', err);
            return false;
        }
    }

    async _canonicalizeSavedWhatsappDeviceForRestore(deviceId) {
        const resolvedDeviceId = String(deviceId || '').trim();
        if (!resolvedDeviceId) {
            return '';
        }

        const savedEntry = (Array.isArray(this.savedWhatsappDevices) ? this.savedWhatsappDevices : [])
            .find(entry => String(entry && entry.deviceId || '').trim() === resolvedDeviceId) || null;

        const { available, devices } = await this._fetchAuthoritativeWhatsappDevicesFromServer();
        if (!available || !Array.isArray(devices) || !devices.length) {
            return resolvedDeviceId;
        }

        const bestEntry = this._findBestWhatsappDeviceCatalogEntry(devices, resolvedDeviceId, savedEntry)
            || this._findBestWhatsappDeviceCatalogEntry(this.savedWhatsappDevices, resolvedDeviceId, savedEntry);
        const canonicalDeviceId = String(bestEntry && bestEntry.deviceId || resolvedDeviceId).trim();
        if (!canonicalDeviceId || canonicalDeviceId === resolvedDeviceId) {
            return resolvedDeviceId;
        }

        await this._upsertSavedWhatsappDevice(canonicalDeviceId, bestEntry || {}, { select: true });
        return canonicalDeviceId;
    }

    async _resolveSavedWhatsappSessionBundle(deviceId) {
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        const resolvedDeviceId = String(deviceId || '').trim();
        if (!hashedMasterKey || !resolvedDeviceId) {
            return { deviceId: resolvedDeviceId, stored: null };
        }

        const savedEntry = (Array.isArray(this.savedWhatsappDevices) ? this.savedWhatsappDevices : [])
            .find(entry => String(entry && entry.deviceId || '').trim() === resolvedDeviceId) || null;

        const dbHandle = await this._getPaiperworkDBHandle();
        const hasGetFn = dbHandle && typeof dbHandle.getWhatsappSessionBundle === 'function';
        const hasSaveFn = dbHandle && typeof dbHandle.saveWhatsappSessionBundle === 'function';
        const hasClearFn = dbHandle && typeof dbHandle.clearWhatsappSessionBundle === 'function';
        if (!hasGetFn) {
            return { deviceId: resolvedDeviceId, stored: null };
        }

        const directStored = await dbHandle.getWhatsappSessionBundle(hashedMasterKey, resolvedDeviceId);
        if (directStored && directStored.session && typeof directStored.session === 'object') {
            return { deviceId: resolvedDeviceId, stored: directStored };
        }

        const matchingEntries = (Array.isArray(this.savedWhatsappDevices) ? this.savedWhatsappDevices : [])
            .filter(entry => this._matchesWhatsappDeviceReference(entry, resolvedDeviceId, savedEntry));
        const candidateIds = [...new Set(matchingEntries
            .sort((left, right) => this._getWhatsappDeviceCatalogRank(right) - this._getWhatsappDeviceCatalogRank(left))
            .map(entry => String(entry && entry.deviceId || '').trim())
            .filter(candidateDeviceId => candidateDeviceId && candidateDeviceId !== resolvedDeviceId))];

        for (const candidateDeviceId of candidateIds) {
            const stored = await dbHandle.getWhatsappSessionBundle(hashedMasterKey, candidateDeviceId);
            if (!stored || !stored.session || typeof stored.session !== 'object') {
                continue;
            }

            if (hasSaveFn && hasClearFn) {
                await dbHandle.saveWhatsappSessionBundle(hashedMasterKey, resolvedDeviceId, stored.session, {
                    ...(stored.metadata && typeof stored.metadata === 'object' ? stored.metadata : {}),
                    migratedFrom: candidateDeviceId,
                    migratedAt: new Date().toISOString()
                });
                await dbHandle.clearWhatsappSessionBundle(hashedMasterKey, candidateDeviceId);
            }

            console.log('ConnectorsTab: resolved whatsapp session bundle from alias device', {
                resolvedDeviceId,
                candidateDeviceId
            });
            return {
                deviceId: resolvedDeviceId,
                stored: {
                    ...stored,
                    deviceId: resolvedDeviceId
                }
            };
        }

        return { deviceId: resolvedDeviceId, stored: null };
    }

    async _restoreWhatsappSessionBundleIfNeeded(force = false) {
        let resolvedDeviceId = String(this.savedWhatsappDeviceId || '').trim();
        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!resolvedDeviceId || !hashedMasterKey) {
            this.setWhatsappSessionRestoreStatus('Session restore: no saved session found.');
            return false;
        }

        resolvedDeviceId = await this._canonicalizeSavedWhatsappDeviceForRestore(resolvedDeviceId);
        if (resolvedDeviceId && resolvedDeviceId !== this.savedWhatsappDeviceId) {
            this.savedWhatsappDeviceId = resolvedDeviceId;
        }

        if (!force && this.whatsappSessionImportedForDevice === resolvedDeviceId) {
            this.setWhatsappSessionRestoreStatus('Session restore: already loaded for this device.');
            return false;
        }

        if (!force && this.whatsappSessionRestoreSkippedForDevice === resolvedDeviceId) {
            this.setWhatsappSessionRestoreStatus('Session restore: using persisted gateway session for this device.');
            return false;
        }

        try {
            const dbHandle = await this._getPaiperworkDBHandle();
            const hasGetFn = dbHandle && typeof dbHandle.getWhatsappSessionBundle === 'function';
            if (!hasGetFn) {
                this.setWhatsappSessionRestoreStatus('Session restore: local session API unavailable.');
                return false;
            }

            const { stored } = await this._resolveSavedWhatsappSessionBundle(resolvedDeviceId);
            if (!stored || !stored.session || typeof stored.session !== 'object') {
                this.whatsappSessionRestoreSkippedForDevice = resolvedDeviceId;
                this.setWhatsappSessionRestoreStatus('Session restore: no local bundle found, continuing with persisted gateway session.');
                return false;
            }

            const response = await fetch('/api/whatsapp/session/import', {
                method: 'POST',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    device_id: resolvedDeviceId,
                    session: stored.session
                })
            });

            if (!response.ok) {
                console.warn('ConnectorsTab: _restoreWhatsappSessionBundleIfNeeded import failed', await response.text());
                this.whatsappSessionRestoreSkippedForDevice = resolvedDeviceId;
                this.setWhatsappSessionRestoreStatus('Session restore: import failed, continuing with persisted gateway session.');
                return false;
            }

            const reconnectResponse = await fetch('/api/whatsapp/session/reconnect', {
                method: 'POST',
                headers: this._getWhatsappUserScopedHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    device_id: resolvedDeviceId
                })
            });
            if (!reconnectResponse.ok) {
                console.warn('ConnectorsTab: _restoreWhatsappSessionBundleIfNeeded reconnect failed', await reconnectResponse.text());
                this.whatsappSessionRestoreSkippedForDevice = resolvedDeviceId;
                this.setWhatsappSessionRestoreStatus('Session restore: reconnect request failed, continuing with persisted gateway session.');
                return false;
            }

            this.whatsappSessionImportedForDevice = resolvedDeviceId;
            this.whatsappSessionRestoreSkippedForDevice = null;
            this.setWhatsappSessionRestoreStatus('Session restore: imported successfully, reconnecting saved device.');
            return true;
        } catch (err) {
            console.warn('ConnectorsTab: _restoreWhatsappSessionBundleIfNeeded failed', err);
            this.whatsappSessionRestoreSkippedForDevice = resolvedDeviceId;
            this.setWhatsappSessionRestoreStatus('Session restore: error, continuing with persisted gateway session.');
            return false;
        }
    }

    async _enableWhatsappFreshPairFallback(reason = 'session-restore-unavailable') {
        const hasMultipleSavedDevices = this._hasMultipleSavedWhatsappDevices();
        const activeSavedDeviceId = String(this.savedWhatsappDeviceId || '').trim();
        console.log('ConnectorsTab: _enableWhatsappFreshPairFallback requested', {
            reason,
            savedWhatsappDeviceId: activeSavedDeviceId || null,
            hasMultipleSavedDevices
        });

        if (hasMultipleSavedDevices && activeSavedDeviceId) {
            this.whatsappSessionImportedForDevice = null;
            this.whatsappSessionRestoreSkippedForDevice = null;
            try {
                await this._setWhatsappPreferredDeviceOnServer('', '');
            } catch (err) {
                console.warn('ConnectorsTab: _enableWhatsappFreshPairFallback failed to clear server preferred device during multi-device recovery', err);
            }
            try {
                await this._clearPreferredWhatsappDeviceInfo();
            } catch (err) {
                console.warn('ConnectorsTab: _enableWhatsappFreshPairFallback failed to clear local preferred device during multi-device recovery', err);
            }
            this.savedWhatsappDeviceId = null;
            if (this.serverStarted && !this.serverStopping) {
                await this.stopWhatsappServer();
                this.setWhatsappModalPhase('starting', 'Saved device restore failed. Server stopped; choose another saved device or pair new.');
            } else {
                this.setWhatsappModalStatus('Saved device restore failed. Choose another saved device or use Pair new device.');
            }
            return;
        }

        if (this.whatsappFreshPairRequested) {
            return;
        }

        this._setWhatsappFreshPairRequested(true);
        this.whatsappFreshPairDeviceId = null;
        this.whatsappSessionImportedForDevice = null;
        this.whatsappSessionRestoreSkippedForDevice = null;

        try {
            await this._setWhatsappPreferredDeviceOnServer('', '');
        } catch (err) {
            console.warn('ConnectorsTab: _enableWhatsappFreshPairFallback failed to clear preferred device', err);
        }

        try {
            await this._clearPreferredWhatsappDeviceInfo();
        } catch (err) {
            console.warn('ConnectorsTab: _enableWhatsappFreshPairFallback failed to clear local preferred device', err);
        }

        try {
            await this._clearWhatsappRuntimeSession(this.savedWhatsappDeviceId || null);
        } catch (err) {
            console.warn('ConnectorsTab: _enableWhatsappFreshPairFallback failed to clear runtime session', err);
        }

        console.log('ConnectorsTab: _enableWhatsappFreshPairFallback', {
            reason,
            savedWhatsappDeviceId: this.savedWhatsappDeviceId
        });
    }

    _collectWhatsappEventText(payload) {
        const chunks = [];
        const push = (value) => {
            if (value === null || typeof value === 'undefined') return;
            const text = String(value).trim();
            if (text) chunks.push(text.toLowerCase());
        };

        push(payload && payload.code);
        push(payload && payload.Code);
        push(payload && payload.message);
        push(payload && payload.Message);

        const result = payload && payload.result;
        if (result && typeof result === 'object') {
            push(result.reason);
            push(result.error);
            push(result.message);
            push(result.details);
            push(result.status);
            push(result.code);
        } else {
            push(result);
        }

        return chunks.join(' | ');
    }

    _isTransientConnectivityFailure(payload) {
        const text = this._collectWhatsappEventText(payload);
        if (!text) return false;

        return /(network|offline|timeout|timed out|temporary|temporarily|unreachable|context canceled|connection refused|dns|econn|etimedout|503|502|504|transport|gateway unavailable)/.test(text);
    }

    _shouldResetStoredDeviceForEvent(code, payload) {
        const normalized = String(code || '').toUpperCase();

        if (normalized === 'DISCONNECTED') {
            return false;
        }

        if (normalized === 'REMOTE_LOGOUT') {
            return true;
        }

        return false;
    }

    _shouldDeleteSavedDeviceForEvent(code, payload) {
        const normalized = String(code || '').toUpperCase();
        if (normalized === 'REMOTE_LOGOUT') {
            return true;
        }

        if (normalized !== 'LOGOUT_COMPLETE' && normalized !== 'LOGGED_OUT') {
            return false;
        }

        const text = this._collectWhatsappEventText(payload);
        return /(remote logout|logged out from phone|removed from phone whatsapp|device unlinked from phone|remote_logout)/.test(text);
    }

    _armWhatsappQrGracePeriod() {
        const shouldDelayQr = !!this.savedWhatsappDeviceId;
        this.whatsappQrGraceUntil = shouldDelayQr ? (Date.now() + this.whatsappQrGraceMs) : 0;
    }

    _isWhatsappQrGraceActive() {
        return !!(this.whatsappQrGraceUntil && Date.now() < this.whatsappQrGraceUntil);
    }

    _shouldDelayWhatsappQrRender(data = null) {
        if (!this.savedWhatsappDeviceId) {
            return false;
        }

        if (this.isPaired || (data && data.loggedIn)) {
            return false;
        }

        return this._isWhatsappQrGraceActive();
    }

    _getWhatsappQrWithheldStatusMessage(data = null) {
        if (data && data.qrWithheld && this.savedWhatsappDeviceId) {
            return 'Saved WhatsApp device found. Waiting for a confirmed reconnect result before showing a QR code. If you unpaired it from the phone, remove it from saved devices or use Pair new device.';
        }

        if (this.savedWhatsappDeviceId) {
            return 'Recovering saved WhatsApp session, please wait...';
        }

        return 'Recovering WhatsApp session, please wait...';
    }

    setWhatsappModalStatus(message, whiteText = false) {
        const statusDiv = document.getElementById('wa-status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.style.color = whiteText ? 'var(--wa-modal-status-strong, var(--text-color, #ffffff))' : 'var(--wa-modal-status-color, #666)';
        }
    }

    setWhatsappModalActivitySpinner(isVisible) {
        const spinnerWrap = document.getElementById('wa-starting-spinner');
        if (!spinnerWrap) {
            return;
        }

        spinnerWrap.style.display = isVisible ? 'flex' : 'none';
    }

    setWhatsappModalPhase(phase, statusMessage = '') {
        const normalized = phase === 'qr' ? 'qr' : 'starting';
        const desiredStartingMessage = statusMessage || 'Server starting, please wait...';
        const currentPhase = this.whatsappModalPhase;

        // Keep starting-phase UI stable during poll ticks: only update text.
        if (normalized === 'starting' && currentPhase === 'starting') {
            this.setWhatsappModalStatus(desiredStartingMessage);
            this.setWhatsappModalActivitySpinner(true);
            return;
        }

        this.whatsappModalPhase = normalized;

        const titleEl = document.getElementById('wa-modal-title');
        const qrLegend = document.getElementById('wa-qr-legend');
        const qrContainer = document.getElementById('wa-qr-container');
        const statusDiv = document.getElementById('wa-status');
        const restoreStatusDiv = document.getElementById('wa-session-restore-status');

        if (normalized === 'starting') {
            this.setWhatsappModalStartStatus(false);
            this.setWhatsappModalActivitySpinner(true);
            if (titleEl) {
                titleEl.style.display = 'none';
            }
            if (qrLegend) {
                qrLegend.style.display = 'none';
                qrLegend.textContent = '';
            }
            if (qrContainer) {
                qrContainer.innerHTML = '';
            }
            if (restoreStatusDiv) {
                restoreStatusDiv.textContent = '';
                restoreStatusDiv.style.display = 'none';
            }
            if (statusDiv) {
                statusDiv.style.fontSize = '20px';
                statusDiv.style.fontWeight = '700';
                statusDiv.style.textAlign = 'center';
                statusDiv.style.color = 'var(--wa-modal-status-strong, #2f3742)';
            }
            this.clearWhatsappQrCountdown();
            this.setWhatsappModalStatus(desiredStartingMessage);
            return;
        }

        if (titleEl) {
            titleEl.style.display = 'block';
        }
        this.setWhatsappModalStartStatus(false);
        this.setWhatsappModalActivitySpinner(false);
        if (qrLegend) {
            qrLegend.style.display = 'block';
            qrLegend.innerHTML = 'Scan this QR code in WhatsApp.<br><span style="font-size:12px;color:var(--wa-modal-muted, #6d7784);">Phone: Settings > Linked devices > Link a device</span>';
        }
        if (statusDiv) {
            statusDiv.style.fontSize = '14px';
            statusDiv.style.fontWeight = '400';
            statusDiv.style.textAlign = 'center';
            statusDiv.style.color = 'var(--wa-modal-status-color, #666)';
        }
        if (statusMessage) {
            this.setWhatsappModalStatus(statusMessage);
        } else {
            this.setWhatsappModalStatus('');
        }
    }

    setWhatsappSessionRestoreStatus(message) {
        this.whatsappSessionRestoreStatus = String(message || '').trim();
        const statusDiv = document.getElementById('wa-session-restore-status');
        if (!statusDiv) {
            return;
        }
        // Keep runtime value for diagnostics, but hide from modal to reduce noise.
        statusDiv.textContent = '';
        statusDiv.style.display = 'block';
    }

    setWhatsappQrCountdown(remainingMs) {
        const countdownDiv = document.getElementById('wa-qr-countdown');
        if (!countdownDiv) return;

        if (remainingMs <= 0) {
            countdownDiv.textContent = 'QR code expired, waiting for refresh...';
            countdownDiv.style.display = 'block';
            return;
        }

        const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
        countdownDiv.textContent = `QR code valid for ${seconds}s`;
        countdownDiv.style.display = 'block';
    }

    clearWhatsappQrCountdown() {
        const countdownDiv = document.getElementById('wa-qr-countdown');
        if (!countdownDiv) return;
        countdownDiv.textContent = '';
        countdownDiv.style.display = 'none';

        if (this.qrCountdownTimer) {
            clearInterval(this.qrCountdownTimer);
            this.qrCountdownTimer = null;
        }
    }

    startWhatsappQrCountdown() {
        if (this.qrCountdownTimer) {
            clearInterval(this.qrCountdownTimer);
            this.qrCountdownTimer = null;
        }

        if (!this.lastQrTimestamp) {
            this.clearWhatsappQrCountdown();
            return;
        }

        this.qrCountdownTimer = setInterval(() => {
            const elapsed = Date.now() - this.lastQrTimestamp;
            const remaining = this.whatsappQrTTL - elapsed;
            if (remaining <= 0) {
                if (!this.whatsappQrWaitingForRefresh) {
                    this.whatsappQrWaitingForRefresh = true;
                    this.setWhatsappModalRefreshNote('Waiting for a refreshed QR code...');
                }
                this.setWhatsappQrCountdown(0);
                if (this.qrCountdownTimer) {
                    clearInterval(this.qrCountdownTimer);
                    this.qrCountdownTimer = null;
                }
                return;
            }
            this.setWhatsappQrCountdown(remaining);
        }, 1000);

        // immediate update
        const elapsed = Date.now() - this.lastQrTimestamp;
        this.setWhatsappQrCountdown(this.whatsappQrTTL - elapsed);
    }

    setWhatsappModalRefreshNote(message) {
        const noteDiv = document.getElementById('wa-qr-refresh-note');
        if (!noteDiv) return;

        // Also update countdown visibility when refresh note is set to non-empty
        const countdownDiv = document.getElementById('wa-qr-countdown');
        if (countdownDiv && message) {
            countdownDiv.style.display = 'block';
        }

        if (!message) {
            noteDiv.style.visibility = 'hidden';
            noteDiv.style.opacity = '0';
            noteDiv.textContent = '';
            return;
        }

        noteDiv.textContent = message;
        noteDiv.style.visibility = 'visible';
        noteDiv.style.opacity = '1';

        if (this.qrRefreshNoticeTimeout) {
            clearTimeout(this.qrRefreshNoticeTimeout);
            this.qrRefreshNoticeTimeout = null;
        }

        this.qrRefreshNoticeTimeout = setTimeout(() => {
            this.setWhatsappModalRefreshNote('');
        }, 3000);
    }

    setWhatsappModalCountdown(seconds) {
        // Countdown removed per requirement.
        // This function exists for backward compatibility.
    }

    startWhatsappModalCountdown() {
        this.stopWhatsappModalCountdown();
        this.qrCountdownSeconds = 60;
        this.setWhatsappModalCountdown(this.qrCountdownSeconds);
        this.qrCountdownInterval = setInterval(() => {
            this.qrCountdownSeconds = Math.max(0, this.qrCountdownSeconds - 1);
            this.setWhatsappModalCountdown(this.qrCountdownSeconds);
            if (this.qrCountdownSeconds <= 0) {
                this.stopWhatsappModalCountdown();
            }
        }, 1000);
    }

    stopWhatsappModalCountdown() {
        if (this.qrCountdownInterval) {
            clearInterval(this.qrCountdownInterval);
            this.qrCountdownInterval = null;
        }
    }

    async startWhatsappServer() {
        console.log('ConnectorsTab: startWhatsappServer called', {
            serverStarted: this.serverStarted,
            serverStarting: this.serverStarting,
            savedWhatsappDeviceId: this.savedWhatsappDeviceId,
            savedDeviceCount: Array.isArray(this.savedWhatsappDevices) ? this.savedWhatsappDevices.length : 0
        });

        this.whatsappRemoteLogoutNoticeShown = null;

        if (this._isWhatsappRestartBlocked()) {
            this.setWhatsappPairButtonState(false);
            return;
        }

        if (!this._ensureWhatsappModelSelected()) {
            return;
        }

        this._setWhatsappFreshPairRequested(false);
        const deviceChoiceResolved = await this._chooseSavedWhatsappDeviceForStart();
        if (!deviceChoiceResolved) {
            return;
        }

        const requestGeneration = this._beginWhatsappRequestGeneration();
        this.whatsappPairModalDismissed = false;
        this.serverStarted = true;
        this.serverStarting = true;
        this.serverStopping = false;
        this.openWhatsappPairModal(true);
        this.setWhatsappModalPhase('starting', 'Starting WhatsApp server, please wait...');
        this.setWhatsappPairButtonState(this.isPaired);

        try {
            // Try to rehydrate stored device information from the encrypted per-user DB.
            await this._loadSavedWhatsappDeviceInfo();
            await this._syncPreferredWhatsappDeviceWithServer(false);
            this._armWhatsappQrGracePeriod();

            const data = await this.refreshWhatsappPairButton({ start: true, check: true, requestGeneration });

            if (!this._isWhatsappRequestActive(requestGeneration)) {
                return;
            }

            this.serverStarting = false;
            if (data && !(data.gatewayRunning || data.connected)) {
                this.serverStarted = false;
            }

            this.setWhatsappPairButtonState(this.isPaired);

            if (this.serverStarted && !this.isPaired && !this.whatsappPairModalDismissed) {
                this.openWhatsappPairModal(true);
            }
        } catch (err) {
            if (!this._isWhatsappRequestActive(requestGeneration, true)) {
                return;
            }
            this.serverStarted = false;
            this.serverStarting = false;
            this.serverStopping = false;
            this.setWhatsappPairButtonState(false);
            console.error('ConnectorsTab: failed to start server', err);
        }
    }

    async startWhatsappFreshPairing() {
        if (!this._ensureWhatsappModelSelected()) {
            return;
        }

        this._setWhatsappFreshPairRequested(true);
        this.whatsappFreshPairDeviceId = null;
        await this._setWhatsappPreferredDeviceOnServer('', '');

        if (this.serverStarted) {
            this.whatsappPairModalDismissed = false;
            this.serverStarting = false;
            this.openWhatsappPairModal(true);
            this._armWhatsappQrGracePeriod();
            await this.refreshWhatsappPairButton({ check: true, freshPair: true, requestGeneration: this.whatsappRequestGeneration });
            return;
        }

        const requestGeneration = this._beginWhatsappRequestGeneration();
        this.whatsappPairModalDismissed = false;
        this.serverStarted = true;
        this.serverStarting = true;
        this.serverStopping = false;
        this.setWhatsappPairButtonState(this.isPaired);

        try {
            if (!this.isPaired) {
                this.openWhatsappPairModal();
            }
        } catch (e) {
            console.warn('ConnectorsTab: openWhatsappPairModal failed during fresh pair start', e);
        }

        try {
            await this._loadSavedWhatsappDeviceInfo();
            this._armWhatsappQrGracePeriod();

            const data = await this.refreshWhatsappPairButton({ start: true, check: true, requestGeneration, freshPair: true });

            if (!this._isWhatsappRequestActive(requestGeneration)) {
                return;
            }

            this.serverStarting = false;
            if (data && !(data.gatewayRunning || data.connected)) {
                this.serverStarted = false;
            }

            this.setWhatsappPairButtonState(this.isPaired);

            if (this.serverStarted && !this.isPaired && !this.whatsappPairModalDismissed) {
                this.openWhatsappPairModal(true);
            }
        } catch (err) {
            if (!this._isWhatsappRequestActive(requestGeneration, true)) {
                return;
            }
            this.serverStarted = false;
            this.serverStarting = false;
            this.serverStopping = false;
            this._setWhatsappFreshPairRequested(false);
            this.setWhatsappPairButtonState(false);
            console.error('ConnectorsTab: failed to start fresh WhatsApp pairing', err);
        }
    }

    async _waitForWhatsappGatewayStop(timeoutMs = 15000, intervalMs = 400) {
        const deadline = Date.now() + timeoutMs;

        while (Date.now() < deadline) {
            try {
                const params = this._appendWhatsappUserScope(new URLSearchParams());
                const res = await fetch('/api/whatsapp/gateway-info?' + params.toString(), {
                    cache: 'no-store',
                    headers: this._getWhatsappUserScopedHeaders()
                });
                if (res.ok) {
                    const data = await res.json();
                    if (!data || data.gatewayRunning !== true) {
                        return true;
                    }
                }
            } catch (err) {
                console.warn('ConnectorsTab: gateway-info poll during stop failed', err);
            }

            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }

        return false;
    }

    async _fetchWhatsappGatewayInfo() {
        try {
            const params = this._appendWhatsappUserScope(new URLSearchParams());
            const res = await fetch('/api/whatsapp/gateway-info?' + params.toString(), {
                cache: 'no-store',
                headers: this._getWhatsappUserScopedHeaders()
            });
            if (!res.ok) {
                return null;
            }
            return await res.json();
        } catch (err) {
            console.warn('ConnectorsTab: gateway-info fetch failed', err);
            return null;
        }
    }

    async _closeWhatsappPairModalIfGatewayRecovered(modal, requestGeneration, source = 'gateway-info') {
        const gatewayInfo = await this._fetchWhatsappGatewayInfo();
        if (!this._isWhatsappRequestActive(requestGeneration)) {
            return false;
        }
        if (gatewayInfo && gatewayInfo.gatewayRunning && gatewayInfo.loggedIn) {
            console.log('ConnectorsTab: closing QR modal after recovered gateway login', {
                source,
                gatewayInfo
            });
            this._completeWhatsappPairingFlow(modal, source);
            return true;
        }
        return false;
    }

    _showNoModelSelectedModal(message) {
        const existing = document.getElementById('wa-no-model-modal');
        if (existing) {
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'wa-no-model-modal';
        overlay.style.cssText = 'position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:99999;';

        const dialog = document.createElement('div');
        dialog.style.cssText = 'width:min(440px,calc(100vw-32px)); background:var(--card-bg,#fff); color:var(--text-color,#000); border:1px solid var(--border-color,#ccc); border-radius:10px; padding:18px; text-align:center;';

        const title = document.createElement('h3');
        title.style.margin = '0 0 10px 0';
        title.style.fontSize = '18px';
        title.textContent = (window.Lang && Lang.get('modelSelectionRequired')) || 'Model selection required';

        const msg = document.createElement('p');
        msg.style.margin = '0 0 14px 0';
        msg.style.lineHeight = '1.45';
        msg.textContent = message;

        const chatBtn = document.createElement('button');
        chatBtn.style.cssText = 'margin:0 8px 0 0; padding:9px 14px; border:none; border-radius:8px; background:var(--accent-color,#4f46e5); color:#fff; cursor:pointer; font-weight:600;';
        chatBtn.textContent = (window.Lang && Lang.get('switchToChatTab')) || 'Go to Chat Tab';
        chatBtn.addEventListener('click', () => {
            if (window.tabManager && typeof window.tabManager.switchTab === 'function') {
                window.tabManager.switchTab('chat-tab');
            } else {
                const chatTabButton = document.querySelector('.tab-button[data-tab="chat"]');
                if (chatTabButton) {
                    chatTabButton.click();
                }
            }
            if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
        });

        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = 'padding:9px 14px; border:none; border-radius:8px; background:#e5e7eb; color:#111; cursor:pointer; font-weight:600;';
        closeBtn.textContent = (window.Lang && Lang.get('cancel')) || 'Cancel';
        closeBtn.addEventListener('click', () => {
            if (overlay.parentNode) { overlay.parentNode.removeChild(overlay); }
        });

        dialog.appendChild(title);
        dialog.appendChild(msg);
        dialog.appendChild(chatBtn);
        dialog.appendChild(closeBtn);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }

    async stopWhatsappServer() {
        //console.log('ConnectorsTab: stopWhatsappServer called');
        this.serverStopping = true;
        this.serverStarting = false;
        this._setWhatsappFreshPairRequested(false);
        this.setWhatsappPairButtonState(this.isPaired);
        this._cancelWhatsappAsyncWork({ manualStop: true });
        this.whatsappWebsocketShouldReconnect = false;
        try {
            const res = await this._requestWhatsappServerStop();
            if (!res.ok) {
                console.warn('ConnectorsTab: stop Whatsapp server failed', await res.text());
            }
        } catch (err) {
            console.warn('ConnectorsTab: stopWhatsappServer request failed', err);
        }

        await this._waitForWhatsappGatewayStop();

        this.serverStarted = false;
        this.serverStarting = false;
        this.serverStopping = false;
        this.whatsappPairModalDismissed = false;
        this._setWhatsappRestartBlocked(5000);
        this.isPaired = false;
        this.closeWhatsappPairModal();
        this.stopWhatsappWebsocketListener();
        this.stopPolling();
        this.stopWhatsappModalCountdown();
        this.setWhatsappPairButtonState(false);
        this.setWhatsappModalStatus('WhatsApp server stopped.');
    }

    async refreshWhatsappPairButton(options = { start: false, check: true }) {
        //console.log('ConnectorsTab: refreshWhatsappPairButton called', options);
        if (!this.whatsappButton) {
            console.warn('ConnectorsTab: refreshWhatsappPairButton called but whatsappButton missing');
            return;
        }

        const requestGeneration = typeof options.requestGeneration === 'number'
            ? options.requestGeneration
            : this.whatsappRequestGeneration;

        if (!this._isWhatsappRequestActive(requestGeneration)) {
            return null;
        }

        let controller = null;

        try {
            const params = new URLSearchParams();
            if (options.start) params.set('start', 'true');
            if (options.check) params.set('check', 'true');
            const freshPairRequested = !!options.freshPair || this.whatsappFreshPairRequested;
            const activeFreshPairDeviceId = String(this.whatsappFreshPairDeviceId || '').trim();
            if (freshPairRequested) {
                params.set('fresh_pair', 'true');
            }

            let candidateSavedDeviceId = '';
            if (freshPairRequested) {
                candidateSavedDeviceId = activeFreshPairDeviceId;
            } else {
                candidateSavedDeviceId = String(this.savedWhatsappDeviceId || '').trim();
            }
            if (!freshPairRequested && !candidateSavedDeviceId) {
                const info = await this._loadSavedWhatsappDeviceInfo();
                const normalizedInfo = this._normalizeWhatsappDeviceCatalog(info);
                if (normalizedInfo.selectedDeviceId) {
                    candidateSavedDeviceId = String(normalizedInfo.selectedDeviceId || '').trim();
                    this.savedWhatsappDeviceId = candidateSavedDeviceId;
                } else if (this._hasMultipleSavedWhatsappDevices()) {
                    candidateSavedDeviceId = '';
                } else if (info && info.deviceId) {
                    candidateSavedDeviceId = String(info.deviceId || '').trim();
                    this.savedWhatsappDeviceId = candidateSavedDeviceId;
                }
            }
            if (candidateSavedDeviceId) {
                params.set('device_id', candidateSavedDeviceId);
				if (await this._hasSavedWhatsappSessionBundle(candidateSavedDeviceId)) {
					params.set('restore_session', 'true');
				}
            }

            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            if (hashedMasterKey) {
                params.set('user', hashedMasterKey);
            }

            const url = `/api/whatsapp/qr?${params.toString()}`;

            //console.log('ConnectorsTab: refreshWhatsappPairButton fetching', url);
            const fetchOptions = {};
            if (typeof AbortController !== 'undefined') {
                controller = new AbortController();
                this.whatsappPendingFetchControllers.add(controller);
                fetchOptions.signal = controller.signal;
            }
            const res = await fetch(url, fetchOptions);
            if (controller) {
                this.whatsappPendingFetchControllers.delete(controller);
                controller = null;
            }
            //console.log('ConnectorsTab: refreshWhatsappPairButton response status', res.status);
            if (res.status === 409) {
                const errorBody = await res.json().catch(() => ({}));
                if (!this._isWhatsappRequestActive(requestGeneration)) {
                    return null;
                }
                const message = errorBody.message || 'WhatsApp gateway locked to another user session. Please stop and restart for this user key.';
                this.setWhatsappPairButtonState(false);
                this.setWhatsappModalStatus(message);
                console.warn('ConnectorsTab: refreshWhatsappPairButton user mismatch', errorBody);
                return;
            }
            if (res.status === 412) {
                const errorBody = await res.json().catch(() => ({}));
                if (!this._isWhatsappRequestActive(requestGeneration)) {
                    return null;
                }
                if (errorBody && errorBody.error === 'preferred-device-required' && options.allowPreferredDeviceRecovery !== false) {
                    return this._recoverWhatsappPreferredDeviceRequirement(errorBody, options, requestGeneration);
                }
                this.setWhatsappPairButtonState(false);
                this.setWhatsappModalStatus(String((errorBody && errorBody.message) || 'A preferred WhatsApp device must be selected before reconnecting.'));
                return null;
            }
            if (!res.ok) {
                if (!this._isWhatsappRequestActive(requestGeneration)) {
                    return null;
                }
                await this.setWhatsappPairButtonState(false);
                return;
            }

            const data = await res.json();
            if (!this._isWhatsappRequestActive(requestGeneration)) {
                return null;
            }

            const responseDeviceId = String((data && (data.deviceId || data.device_id)) || '').trim();
            if (responseDeviceId) {
                if (freshPairRequested) {
                    this.whatsappFreshPairDeviceId = responseDeviceId;
                    if (data && data.loggedIn) {
                        this.savedWhatsappDeviceId = responseDeviceId;
                    }
                } else if (candidateSavedDeviceId && this._isWhatsappPairedDeviceId(responseDeviceId)) {
                    this.savedWhatsappDeviceId = responseDeviceId;
                } else if (data && data.loggedIn && this._isWhatsappPairedDeviceId(responseDeviceId)) {
                    this.savedWhatsappDeviceId = responseDeviceId;
                }
            }

            this._syncWhatsappQrTTL(data);

            if (data && data.status === 'stopped' && typeof data.message === 'string' && data.message.toLowerCase().includes('manual stop')) {
                this._handleWhatsappManualStopInProgress(data.message);
                return data;
            }

            if (data && data.status === 'stopped' && String(data.reason || '').toLowerCase() === 'remote_logout') {
                await this._handleWhatsappRemoteLogout(String((data && (data.deviceId || data.device_id)) || '').trim() || this.savedWhatsappDeviceId || null);
                return data;
            }

            //console.log('ConnectorsTab: refreshWhatsappPairButton data', data);

            await this._maybeClearStalePreferredDeviceOnQrFallback(data);

            const justStarted = this.serverStarted == false && data.gatewayRunning;
            if (data.gatewayRunning) {
                this.serverStarted = true;
                if (this.whatsappWebsocketShouldReconnect || options.start || this.serverStarting) {
                    this.whatsappWebsocketShouldReconnect = true;
                    this.ensureWhatsappWebsocketListener(data);
                }
                if (!freshPairRequested && !!data.loggedIn) {
					await this._reconcileSavedWhatsappDevicesWithAuthoritativeDevices('refreshWhatsappPairButton');
				}
            }

            // Do not automatically stop the gateway while pairing checks are in flight.
            // This avoids race conditions when gowa is starting and reporting gatewayRunning=true but not yet connected.
            // if (!data.connected && data.gatewayRunning && !options.start) {
            //     //console.log('ConnectorsTab: gateway running but not connected, stopping gateway to reset');
            //     await fetch('/api/whatsapp/qr?stop=true');
            // }

            // Treat only authenticated session as paired.
            // `connected=true` can happen during QR phase before login completes.
            const isPaired = !!data.loggedIn;

            // Only attempt session import once gateway is actually running.
            // This avoids calling session import during passive tab checks
            // when the embedded gateway has not been started yet.
            if (!freshPairRequested && !isPaired && data.gatewayRunning && this.savedWhatsappDeviceId) {
                await this._restoreWhatsappSessionBundleIfNeeded();
            }

            const shouldSaveDevice = isPaired;
            const shouldClearDeviceInfo = !isPaired && this.serverStarted && !data.gatewayRunning && !options.start;
            let modalStatus;

            if (options.start) {
                modalStatus = 'Starting gateway...';
            } else if (data.gatewayRunning) {
                if (data.loggedIn) {
                    modalStatus = 'WhatsApp connected.';
                } else if (data.qrWithheld) {
                    modalStatus = this._getWhatsappQrWithheldStatusMessage(data);
                } else if (data.qrDataUrl) {
                    modalStatus = 'Gateway running, scan QR code in the window.';
                } else {
                    modalStatus = 'Gateway running; waiting for session recovery (no QR yet).';
                }
            } else {
                modalStatus = 'WhatsApp gateway is not running. Click Pair to start.';
            }

            // Avoid flicker: keep the explicit starting-phase message stable
            // while polling/status checks run.
            const isStartingPhase = this.whatsappModalPhase === 'starting';
            if (!isStartingPhase || isPaired || !!data.qrDataUrl) {
                this.setWhatsappModalStatus(modalStatus);
            }

            // Do not set `lastQrDataUrl`/`lastQrTimestamp` here - leave DOM
            // updates and timestamping to the QR polling logic to avoid a
            // race where refresh sets the cached value before the modal has
            // actually inserted the image element.

            await this.setWhatsappPairButtonState(isPaired);
            if (isPaired) {
				if (shouldSaveDevice) {
                    await this._saveCurrentWhatsappDeviceInfo(this.savedWhatsappDeviceId || null);
				}
				this.whatsappSessionImportedForDevice = this.savedWhatsappDeviceId || null;
                this.whatsappSessionRestoreSkippedForDevice = null;
                this.whatsappStalePreferredDeviceCleared = null;
				if (!shouldSaveDevice) {
					await this._syncPreferredWhatsappDeviceWithServer(isPaired);
                    //console.log('ConnectorsTab: refreshWhatsappPairButton deferring device save until connected', { data });
                }
            } else if (shouldClearDeviceInfo) {
                // Preserve the saved catalog across stop/unpaired transitions so users can
                // choose among previously paired devices on the next start.
                await this._clearStoredPreferredWhatsappDeviceReferences(this.savedWhatsappDeviceId || null, 'gateway-stopped-unpaired');
            } else {
                //console.log('ConnectorsTab: refreshWhatsappPairButton not clearing saved device info (startup/unconfirmed state)', { data, serverStarted: this.serverStarted });
            }

            return data;
        } catch (err) {
            if (controller) {
                this.whatsappPendingFetchControllers.delete(controller);
            }
            if (err && err.name === 'AbortError') {
                return null;
            }
            if (!this._isWhatsappRequestActive(requestGeneration, true)) {
                return null;
            }
            console.warn('ConnectorsTab: refreshWhatsappPairButton failed', err);
            await this.setWhatsappPairButtonState(false);
            return null;
        }
    }

    startPolling() {
        // Clear existing interval if any
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }

        // Poll every 5 seconds
        this.pollInterval = setInterval(async () => {
            await this.refreshWhatsappPairButton();
        }, 5000);
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        if (this.qrPollInterval) {
            clearInterval(this.qrPollInterval);
            this.qrPollInterval = null;
        }
        if (this.whatsappQrRetryTimeout) {
            clearTimeout(this.whatsappQrRetryTimeout);
            this.whatsappQrRetryTimeout = null;
        }
        this.stopWhatsappModalCountdown();
    }

    startWhatsappWebsocketListener() {
        if (this.whatsappWs || typeof WebSocket === 'undefined') {
            return;
        }

        if (this.whatsappWsStartupTimer) {
            clearTimeout(this.whatsappWsStartupTimer);
            this.whatsappWsStartupTimer = null;
        }

        this.whatsappWebsocketShouldReconnect = true;

        const wsUrl = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + '127.0.0.1:3000/ws';
        let socketOpened = false;

        try {
            this.whatsappWs = new WebSocket(wsUrl);
        } catch (err) {
            console.warn('ConnectorsTab: failed to open whatsapp websocket', err);
            return;
        }

        this.whatsappWs.onopen = () => {
            socketOpened = true;
            //console.log('ConnectorsTab: whatsapp websocket connected');
        };

        this.whatsappWs.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                const code = (payload && (payload.Code || payload.code || '')).toString();

                if (code === 'LOGIN_SUCCESS' || code === 'LOGGED_IN') {
                    const eventDeviceId = this._resolveWhatsappEventDeviceId(payload);
                    const persistDeviceId = this._resolvePersistableWhatsappEventDeviceId(payload);
                    if (eventDeviceId && !this._shouldAcceptWhatsappLoginEventDevice(payload)) {
                        console.warn('ConnectorsTab: ignoring websocket login event for non-selected device during restore', {
                            eventDeviceId,
                            savedWhatsappDeviceId: this.savedWhatsappDeviceId || null
                        });
                        return;
                    }
                    if (persistDeviceId) {
                        this.savedWhatsappDeviceId = persistDeviceId;
                        this.whatsappStalePreferredDeviceCleared = null;
                        // Only sync an authoritative preferred device when we have an
                        // exact paired ID or an existing canonical entry for this account.
                        this._setWhatsappPreferredDeviceOnServer(persistDeviceId, '').catch(err => {
                            console.warn('ConnectorsTab: failed to set preferred device after LOGIN_SUCCESS', err);
                        });
                    }
                    this._persistWhatsappDeviceFromLoginEvent(payload).catch(err => {
                        console.warn('ConnectorsTab: failed to persist device after websocket LOGIN_SUCCESS', err);
                    });
                    this.whatsappRemoteLogoutNoticeShown = null;
                    //console.log('ConnectorsTab: whatsapp event indicates paired', payload);
                    this._completeWhatsappPairingFlow(null, 'websocket:' + code);
                    this._syncWhatsappLoginSuccessToServer(payload).catch(err => {
                        console.warn('ConnectorsTab: post-login whatsapp backend sync failed', err);
                    });
                    if (typeof this._saveCurrentWhatsappDeviceInfo === 'function') {
						this._saveCurrentWhatsappDeviceInfo(persistDeviceId || eventDeviceId || this.savedWhatsappDeviceId || null).catch(err => {
                            console.warn('ConnectorsTab: save device info after websocket LOGIN_SUCCESS failed', err);
                        });
						setTimeout(() => {
							this._saveCurrentWhatsappDeviceInfo(persistDeviceId || eventDeviceId || this.savedWhatsappDeviceId || null).catch(err => {
								console.warn('ConnectorsTab: delayed save device info after websocket LOGIN_SUCCESS failed', err);
							});
						}, 5000);
                    }
                    this._captureWhatsappSessionBundle(persistDeviceId || eventDeviceId || null).catch(err => {
                        console.warn('ConnectorsTab: capture session after websocket LOGIN_SUCCESS failed', err);
                    });
                    return;
                }

                if (code === 'REMOTE_LOGOUT') {
                    const eventDeviceId = this._resolveWhatsappEventDeviceId(payload);
                    this._handleWhatsappRemoteLogout(eventDeviceId || this.savedWhatsappDeviceId || null, { force: true }).catch(err => {
                        console.warn('ConnectorsTab: failed to handle WhatsApp REMOTE_LOGOUT event', err);
                    });
                    this.setWhatsappPairButtonState(false);
                    return;
                }

                if (code === 'LOGOUT_COMPLETE' || code === 'DISCONNECTED' || code === 'LOGGED_OUT') {
                    //console.log('ConnectorsTab: whatsapp event indicates unpaired', payload);
                    const eventDeviceId = this._resolveWhatsappEventDeviceId(payload);
                    if (this._shouldDeleteSavedDeviceForEvent(code, payload)) {
                        (async () => {
                            await this._forgetSavedWhatsappDeviceAfterUnpair(eventDeviceId || this.savedWhatsappDeviceId || null, 'event-' + String(code || '').toLowerCase());
                        })().catch(err => {
                            console.warn('ConnectorsTab: failed to forget saved device after WhatsApp unpair event', err);
                        });
                        this.setWhatsappPairButtonState(false);
                        return;
                    } else if (this._shouldResetStoredDeviceForEvent(code, payload)) {
                        this._resetStoredWhatsappDeviceForFreshPairing(code).catch(err => {
                            console.warn('ConnectorsTab: failed to reset stored device after logout event', err);
                        });
                    }
                    this.setWhatsappPairButtonState(false);
                    if (this.serverStarted && !this.whatsappPairModalDismissed) {
                        this.openWhatsappPairModal();
                    }
                    return;
                }

                if (code === 'AUTHENTICATION_FAILED') {
                    //console.log('ConnectorsTab: whatsapp event indicates authentication issue', payload);
                    this.setWhatsappPairButtonState(false);
                    if (this.serverStarted && !this.whatsappPairModalDismissed) {
                        this.openWhatsappPairModal();
                    }
                    return;
                }

            } catch (err) {
                console.warn('ConnectorsTab: failed to parse whatsapp websocket message', err);
            }
        };

        this.whatsappWs.onclose = (event) => {
            //console.log('ConnectorsTab: whatsapp websocket closed', event);
            this.whatsappWs = null;
            if (this.whatsappWsReconnectTimer) {
                clearTimeout(this.whatsappWsReconnectTimer);
            }
            if (!this.whatsappWebsocketShouldReconnect || this.whatsappManualStopRequested || !this.serverStarted) {
                this.whatsappWsReconnectTimer = null;
                return;
            }
            this.whatsappWsReconnectTimer = setTimeout(() => {
                this.whatsappWsReconnectTimer = null;
                this.ensureWhatsappWebsocketListener();
            }, 3000);
        };

        this.whatsappWs.onerror = (err) => {
            if (!socketOpened && this.whatsappWebsocketShouldReconnect && this.serverStarted) {
                console.info('ConnectorsTab: whatsapp websocket not ready yet; will retry');
                return;
            }
            console.warn('ConnectorsTab: whatsapp websocket error', err);
        };
    }

    stopWhatsappWebsocketListener() {
        this.whatsappWebsocketShouldReconnect = false;
        if (this.whatsappWsStartupTimer) {
            clearTimeout(this.whatsappWsStartupTimer);
            this.whatsappWsStartupTimer = null;
        }
        if (this.whatsappWs) {
            try {
                this.whatsappWs.close();
            } catch (err) {
                console.warn('ConnectorsTab: failed to close whatsapp websocket', err);
            }
            this.whatsappWs = null;
        }
        if (this.whatsappWsReconnectTimer) {
            clearTimeout(this.whatsappWsReconnectTimer);
            this.whatsappWsReconnectTimer = null;
        }
    }

    async ensureWhatsappWebsocketListener(gatewayInfo = null) {
        if (this.whatsappWs || typeof WebSocket === 'undefined') {
            return;
        }

        if (!this.serverStarted || this.serverStopping || this.whatsappManualStopRequested) {
            return;
        }

        const resolvedGatewayInfo = gatewayInfo || await this._fetchWhatsappGatewayInfo();
        if (resolvedGatewayInfo && resolvedGatewayInfo.gatewayRunning && resolvedGatewayInfo.websocketReady) {
            this.startWhatsappWebsocketListener();
            return;
        }

        if (this.whatsappWsStartupTimer || !this.whatsappWebsocketShouldReconnect) {
            return;
        }

        this.whatsappWsStartupTimer = setTimeout(() => {
            this.whatsappWsStartupTimer = null;
            this.ensureWhatsappWebsocketListener();
        }, 1000);
    }

    closeWhatsappPairModal() {
        const modal = document.getElementById('wa-pair-modal');
        if (modal && document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    }

    _completeWhatsappPairingFlow(modal = null, source = 'unknown') {
        //console.log('ConnectorsTab: _completeWhatsappPairingFlow', { source, isPaired: this.isPaired });
        this.stopPolling();
        this.stopWhatsappModalCountdown();
        this.clearWhatsappQrCountdown();
        this._setWhatsappFreshPairRequested(false);
        this.setWhatsappPairButtonState(true);
        this.setWhatsappModalStatus('');
        this.setWhatsappModalStartStatus(false);

        const targetModal = modal || document.getElementById('wa-pair-modal');
        if (targetModal && document.body.contains(targetModal)) {
            document.body.removeChild(targetModal);
        }

        if (window.showSuccessInfo) {
            window.showSuccessInfo((window.Lang && typeof Lang.get === 'function' && Lang.get('whatsappPairedCard')) || 'WhatsApp paired successfully');
        }
    }

    // Polling for incoming WhatsApp messages is implemented in `connectorWhatsapp.js`.
    // Call the global `window.connectors` API directly (startIncomingPolling/stopIncomingPolling).

    // Sending messages and presence is implemented in `connectorWhatsapp.js`.
    // Call the global `window.connectors.postWhatsappText` and
    // `window.connectors.postWhatsappPresence` APIs directly.

    openWhatsappPairModal(force = false) {
        //console.log('ConnectorsTab: openWhatsappPairModal called');
        if (this.isPaired) {
            //console.log('ConnectorsTab: openWhatsappPairModal skipped because already paired');
            return;
        }
        if (this.whatsappPairModalDismissed && !force) {
            //console.log('ConnectorsTab: openWhatsappPairModal skipped because modal was dismissed');
            return;
        }
        this.whatsappPairModalDismissed = false;
        let modal = document.getElementById('wa-pair-modal');
        if (!modal) {
            //console.log('ConnectorsTab: creating wa-pair-modal');
            modal = document.createElement('div');
            modal.id = 'wa-pair-modal';
            modal.className = 'wa-pair-modal';
            modal.style.position = 'fixed';
            modal.style.left = '50%';
            modal.style.top = '50%';
            modal.style.transform = 'translate(-50%, -50%)';
            modal.style.width = '360px';
            modal.style.maxWidth = 'calc(100vw - 24px)';
            modal.style.background = 'var(--modal-background, white)';
            modal.style.color = 'var(--text-color, #111111)';
            modal.style.border = '1px solid var(--border-color, #ccc)';
            modal.style.padding = '12px';
            modal.style.boxSizing = 'border-box';
            modal.style.maxHeight = 'calc(100vh - 32px)';
            modal.style.overflowY = 'auto';
            modal.style.zIndex = '9999';
            modal.style.boxShadow = 'var(--wa-modal-shadow, 0 4px 20px rgba(0,0,0,0.15))';
            modal.style.borderRadius = '12px';
            modal.style.fontFamily = 'var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)';
        } else {
            //console.log('ConnectorsTab: wa-pair-modal already exists');
        }

        // Create modal content
        modal.innerHTML = `
            <div class="wa-pair-modal-content">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
                    <h2 id="wa-modal-title" style="margin: 0; font-size: 18px; font-weight: 600;">Pair WhatsApp</h2>
                    <button id="wa-close-modal-x" type="button" aria-label="Close pairing" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:1px solid var(--border-color, #ccc);border-radius:999px;background:var(--panel-background, #f3f4f6);color:var(--text-color, #111111);cursor:pointer;font-size:20px;line-height:1;">&times;</button>
                </div>
                <div id="wa-start-status" style="display: none; align-items: center; justify-content: center; gap: 8px; font-size: 13px; color: #0b74de; margin-bottom: 8px;">
                    <div class="wa-loading-spinner" style="width: 16px; height: 16px; border: 3px solid var(--wa-modal-spinner-track, #c4c4c4); border-top-color: var(--wa-modal-spinner-accent, #0b74de); border-top-left-radius: 50%; border-radius: 50%; margin: 0; animation: wa-spin 0.9s linear infinite;"></div>
                    <span id="wa-start-status-text">Server starting...</span>
                </div>
                <div id="wa-qr-container" style="text-align: center; margin-top: 16px; margin-bottom: 16px;"></div>
                <div id="wa-qr-legend" style="text-align: center; font-size: 13px; color: var(--wa-modal-status-color, #4d4d4d); margin-top: 4px; margin-bottom: 8px; display: none;"></div>
                <div id="wa-status" style="text-align: center; font-size: 14px; color: var(--wa-modal-status-color, #666);"></div>
                <div id="wa-starting-spinner" style="display: none; justify-content: center; align-items: center; margin-top: 18px; margin-bottom: 2px;">
                    <div class="wa-loading-spinner" style="width: 22px; height: 22px; border: 3px solid var(--wa-modal-spinner-track, #c4c4c4); border-top-color: var(--wa-modal-spinner-accent, #0b74de); border-top-left-radius: 50%; border-radius: 50%; animation: wa-spin 0.9s linear infinite;"></div>
                </div>
                <div id="wa-session-restore-status" style="text-align: center; font-size: 12px; color: var(--wa-modal-muted, #7a7a7a); margin-top: 6px; min-height: 16px; display: none;"></div>
                <div id="wa-qr-countdown" style="text-align: center; font-size: 13px; color: var(--wa-modal-status-color, #4d4d4d); margin-top: 6px; min-height: 18px; display: none;"></div>
                <div id="wa-qr-refresh-note" style="text-align: center; font-size: 13px; color: var(--wa-modal-link, #007bff); margin-top: 8px; min-height: 18px; visibility: hidden; opacity: 0; transition: opacity 0.25s;"></div>
                <button id="wa-close-modal" style="margin-top: 18px; width: 100%; padding: 10px; background: var(--wa-modal-close-btn-bg, #4CAF50); color: var(--wa-modal-close-btn-text, #ffffff); border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">Close</button>
            </div>
        `;

        document.body.appendChild(modal);
        // Ensure modal is visible even if CSS rules set it to hidden by default
        try { modal.style.display = 'block'; } catch (_) {}

        // Start listening for gowa websocket events once the gateway is really up.
        this.whatsappWebsocketShouldReconnect = true;
        this.ensureWhatsappWebsocketListener();
        this.setWhatsappSessionRestoreStatus(this.whatsappSessionRestoreStatus);

        // Reset any cached QR URL so the poller always inserts a fresh
        // image into the modal (avoids stale/duplicate QR interference).
        try { this.lastQrDataUrl = ''; this.lastQrSignature = ''; this.lastQrTimestamp = 0; } catch (_) {}
        this.setWhatsappModalRefreshNote('');

        // Add close button handler
        const closeBtn = document.getElementById('wa-close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this._cancelWhatsappPairingAndStopServer('modal-close-button').catch(err => {
                    console.warn('ConnectorsTab: failed to stop WhatsApp server after modal close', err);
                });
            });
        }

        const closeModalX = document.getElementById('wa-close-modal-x');
        if (closeModalX) {
            closeModalX.addEventListener('click', () => {
                this._cancelWhatsappPairingAndStopServer('modal-close-x').catch(err => {
                    console.warn('ConnectorsTab: failed to stop WhatsApp server after modal x close', err);
                });
            });
        }

        // Ensure spinner animation keyframes exist in DOM
        if (!document.getElementById('wa-spinner-keyframes')) {
            const spinnerStyle = document.createElement('style');
            spinnerStyle.id = 'wa-spinner-keyframes';
            spinnerStyle.textContent = `
                @keyframes wa-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(spinnerStyle);
        }

        this.setWhatsappModalPhase('starting', 'Server starting, please wait...');

        // Start polling for QR code
        this.startQrPolling(modal, this.whatsappRequestGeneration);
    }

    setWhatsappModalStartStatus(isActive, text = 'Server starting...', showSpinner = true) {
        const startStatus = document.getElementById('wa-start-status');
        const startText = document.getElementById('wa-start-status-text');

        if (!startStatus || !startText) {
            return;
        }

        startText.textContent = text;
        startText.style.color = 'var(--wa-modal-status-strong, var(--text-color, #ffffff))';

        const spinner = startStatus.querySelector('.wa-loading-spinner') || startStatus.querySelector('.loading-spinner');

        if (isActive) {
            startStatus.style.display = 'flex';
            startStatus.style.color = 'var(--wa-modal-status-strong, var(--text-color, #ffffff))';
            if (spinner) {
                spinner.style.display = showSpinner ? 'inline-block' : 'none';
            }
        } else {
            startStatus.style.display = 'none';
            if (spinner) {
                spinner.style.display = 'none';
            }
        }
    }

    async startQrPolling(modal, requestGeneration = this.whatsappRequestGeneration) {
        if (this.isPaired) {
            //console.log('ConnectorsTab: startQrPolling skipped because already paired');
            return;
        }

        let pollCount = 0;
        let unavailablePollCount = 0;
        const maxPolls = 20; // 60 seconds * 20 = 20 minutes max
        const qrTTL = this.whatsappQrTTL || 20000;

        const pollQr = async () => {
            if (!this._isWhatsappRequestActive(requestGeneration)) {
                return;
            }

            if (this.isPaired) {
                //console.log('ConnectorsTab: pollQr stopped because already paired');
                this.stopPolling();
                return;
            }

            pollCount++;
            //console.log('ConnectorsTab: pollQr tick', { pollCount });
            if (pollCount > maxPolls) {
                this.stopPolling();
                //console.log('ConnectorsTab: pollQr maxPolls reached; stopping');
                return;
            }

            try {
                let data = await this.refreshWhatsappPairButton({ check: true, requestGeneration });
                if (!this._isWhatsappRequestActive(requestGeneration)) {
                    return;
                }
                if (this.isPaired) {
                    // Pairing may have been confirmed by websocket or an earlier refresh.
                    // Ignore stale QR payloads and close the modal immediately.
                    this._completeWhatsappPairingFlow(modal, 'poll:state-isPaired');
                    return;
                }
                if (!data) {
                    unavailablePollCount += 1;

                    // If status remains unavailable for several polls, treat it as
                    // a stopped/unreachable gateway and stop background polling.
                    if (unavailablePollCount >= 5) {
                        const gatewayInfo = await this._fetchWhatsappGatewayInfo();
                        if (!this._isWhatsappRequestActive(requestGeneration)) {
                            return;
                        }

                        if (gatewayInfo && gatewayInfo.gatewayRunning) {
                            //console.log('ConnectorsTab: pollQr detected repeated unavailable status but gateway still running; keeping recovery state active');
                            this.serverStarted = true;
                            this.serverStarting = false;
                            this.setWhatsappPairButtonState(false);
                            this.setWhatsappModalPhase('starting', 'Recovering WhatsApp session, please wait...');
                            unavailablePollCount = 0;
                            return;
                        }

                        //console.log('ConnectorsTab: pollQr detected repeated unavailable status; stopping poll loop');
                        this.serverStarted = false;
                        this.serverStarting = false;
                        this.stopPolling();
                        this.stopWhatsappWebsocketListener();
                        this.setWhatsappPairButtonState(false);
                        this.setWhatsappModalPhase('starting', 'WhatsApp server stopped. Click Pair to start.');
                        return;
                    }

                    // If the status endpoint is unavailable (503) while the
                    // bundled gateway is still starting, attempt to fetch a
                    // server-cached QR image directly. The server will return
                    // cached image bytes even when the gateway API is transient.
                    const startupWaitMessage = this._shouldDelayWhatsappQrRender()
                        ? 'Recovering WhatsApp session, please wait...'
                        : 'Server starting, please wait...';
                    this.setWhatsappModalPhase('starting', startupWaitMessage);
                    if (this._shouldDelayWhatsappQrRender()) {
                        return;
                    }
                    try {
                        const qrContainer = document.getElementById('wa-qr-container');
                        const proxyParams = this._appendWhatsappUserScope(new URLSearchParams({ ts: String(Date.now()) }));
                        const proxyUrl = '/api/whatsapp/qr-image?' + proxyParams.toString();
                        const blob = await this._fetchProxiedQrBlob(proxyUrl);
                        if (!this._isWhatsappRequestActive(requestGeneration)) {
                            return;
                        }
                        if (blob) {
                            if (qrContainer) {
                                try { if (this._currentQrObjectUrl) URL.revokeObjectURL(this._currentQrObjectUrl); } catch (_) {}
                                const obj = URL.createObjectURL(blob);
                                this._currentQrObjectUrl = obj;
                                qrContainer.innerHTML = '';
                                const img = document.createElement('img');
                                img.alt = 'WhatsApp QR Code';
                                img.style.maxWidth = '200px';
                                img.style.maxHeight = '200px';
                                img.style.borderRadius = '8px';
                                img.style.border = '2px solid var(--wa-modal-qr-border, #ddd)';
                                img.src = obj;
                                qrContainer.appendChild(img);
                                //console.log('ConnectorsTab: proxied cached QR blob loaded, size=', blob.size);
                            }
                            try { this.lastQrTimestamp = Date.now(); this.startWhatsappQrCountdown(); } catch (_) {}
                            return;
                        }
                    } catch (err) {
                        console.warn('ConnectorsTab: cached QR fetch attempt failed', err);
                    }

                    this.setWhatsappModalPhase('starting', 'Server starting, please wait...');
                    return;
                }

                unavailablePollCount = 0;

                if (data.loggedIn) {
                    this._completeWhatsappPairingFlow(modal, 'poll:data-connected');
                    return;
                }

                if (data.qrWithheld) {
                    this.setWhatsappModalPhase('starting', this._getWhatsappQrWithheldStatusMessage(data));
                    const qrContainer = document.getElementById('wa-qr-container');
                    if (qrContainer) {
                        qrContainer.innerHTML = '';
                    }
                    this.clearWhatsappQrCountdown();
                    return;
                }

                if (!data.loggedIn && !data.qrDataUrl && data.gatewayRunning) {
                    const recovered = await this._closeWhatsappPairModalIfGatewayRecovered(modal, requestGeneration, 'poll:gateway-info-recovered');
                    if (recovered) {
                        return;
                    }
                }

                if (this.isPaired) {
                    this._completeWhatsappPairingFlow(modal, 'poll:post-connected-check');
                    return;
                }

                let qrUrl = data.qrDataUrl || data.qr;
                if (data.qrWithheld) {
                    qrUrl = '';
                }
                if (!qrUrl && data.gatewayRunning && !data.connected && !data.loggedIn) {
                    // In startup edge-cases, check-only polling can return running status
                    // without QR payload. Re-trigger a start/check request to force QR generation.
                    //console.log('ConnectorsTab: pollQr missing QR while gateway running, forcing start+check refresh');
                    const refreshed = await this.refreshWhatsappPairButton({ start: true, check: true, requestGeneration });
                    if (refreshed) {
                        data = refreshed;
                        qrUrl = data.qrWithheld ? '' : (data.qrDataUrl || data.qr);
                    }
                }

                if (!this._isWhatsappRequestActive(requestGeneration)) {
                    return;
                }

                if (this.isPaired || data.loggedIn) {
                    this._completeWhatsappPairingFlow(modal, 'poll:before-render-qr');
                    return;
                }

                if (!qrUrl && data.gatewayRunning) {
                    const recovered = await this._closeWhatsappPairModalIfGatewayRecovered(modal, requestGeneration, 'poll:before-stale-qr-render');
                    if (recovered) {
                        return;
                    }
                }

                if (!qrUrl) {
                    const noQrStatus = data.qrWithheld
                        ? this._getWhatsappQrWithheldStatusMessage(data)
                        : 'Server starting, please wait...';
                    this.setWhatsappModalPhase('starting', noQrStatus);
                }

                const qrLogPreview = !qrUrl
                    ? ''
                    : (String(qrUrl).startsWith('data:')
                        ? `<data-url len=${String(qrUrl).length}>`
                        : `${String(qrUrl).slice(0, 180)}${String(qrUrl).length > 180 ? '...(truncated)' : ''}`);
                //console.log('ConnectorsTab: pollQr got data.qrDataUrl', qrLogPreview);
                // Use the server proxy for absolute gateway URLs to avoid
                // mixed-content/CORS problems when the frontend is served over HTTPS.
                if (qrUrl) {
                    if (this._shouldDelayWhatsappQrRender(data)) {
                        this.setWhatsappModalPhase('starting', this._getWhatsappQrWithheldStatusMessage(data));
                        return;
                    }
                    this.setWhatsappModalPhase('qr');
                    const currentQr = qrUrl;
                    const currentQrIssuedAt = this._getWhatsappQrIssuedAt(data);
                    const currentQrSignature = this._getWhatsappQrSignature(data, currentQr);
                    const isNewQr = currentQrSignature !== this.lastQrSignature;

                    if (isNewQr) {
                        const updateKind = this.lastQrSignature ? 'refreshed' : 'initial';
                        this.lastQrDataUrl = currentQr;
                        this.lastQrSignature = currentQrSignature;
                        this.lastQrTimestamp = currentQrIssuedAt;
                        this.whatsappQrWaitingForRefresh = false;
                        this._logWhatsappQrUpdate(updateKind, data, currentQr);
                        this.setWhatsappModalRefreshNote(updateKind === 'refreshed' ? 'QR code refreshed.' : '');
                        this.startWhatsappQrCountdown();
                    } else if (!this.qrCountdownTimer && this.lastQrTimestamp) {
                        // Ensure countdown continues after accidental timer stop.
                        this.startWhatsappQrCountdown();
                    }

                    if (isNewQr) {
                        const qrContainer = document.getElementById('wa-qr-container');
                        const statusDiv = document.getElementById('wa-status');

                    if (qrContainer) {
                        // Clear and prepare an <img> element with handlers so we
                        // can detect load/error and only mark the QR as current
                        // when it successfully loads.
                        qrContainer.innerHTML = '';
                        const img = document.createElement('img');
                        img.alt = 'WhatsApp QR Code';
                        img.style.maxWidth = '200px';
                        img.style.maxHeight = '200px';
                        img.style.borderRadius = '8px';
                        img.style.border = '2px solid var(--wa-modal-qr-border, #ddd)';

                        const placeholderHTML = '<div class="loading-spinner"></div><p style="margin:12px 0 0 0; font-size:14px; color:var(--wa-modal-status-color, #666);">Waiting for QR...</p>' +
                            '<p style="font-size:12px;color:var(--wa-modal-muted, #444);margin-top:8px;">If QR does not appear, open <a id="wa-qr-link" style="color:var(--wa-modal-link, #007bff);" target="_blank" rel="noopener noreferrer">direct link</a></p>';

                        const showPlaceholder = () => {
                            qrContainer.innerHTML = placeholderHTML;
                            const link = document.getElementById('wa-qr-link');
                            if (link) link.href = currentQr;
                            try { this.lastQrDataUrl = ''; this.lastQrSignature = ''; this.lastQrTimestamp = 0; this.whatsappQrWaitingForRefresh = false; } catch (_) {}
                            if (this.whatsappQrRetryTimeout) {
                                clearTimeout(this.whatsappQrRetryTimeout);
                            }
                            this.whatsappQrRetryTimeout = setTimeout(() => {
                                this.whatsappQrRetryTimeout = null;
                                pollQr();
                            }, 1000);
                        };

                        // If we received an inline data URL, use it directly to avoid
                        // long URL encoding issues and proxy indirection.
                        if (currentQr.startsWith('data:')) {
                            try { if (this._currentQrObjectUrl) URL.revokeObjectURL(this._currentQrObjectUrl); } catch (_) {}
                            img.onload = () => {
                                //console.log('ConnectorsTab: inline QR data URL loaded');
                                try { this.lastQrDataUrl = currentQr; this.lastQrSignature = currentQrSignature; this.lastQrTimestamp = currentQrIssuedAt; this.startWhatsappQrCountdown(); } catch (_) {}
                                this.setWhatsappModalStartStatus(false);
                            };
                            img.onerror = (e) => {
                                console.warn('ConnectorsTab: inline QR data URL error', e);
                                showPlaceholder();
                            };
                            img.src = currentQr;
                            qrContainer.appendChild(img);
                        } else {
                            // Try server-cached proxied blob first (fast, accurate).
                            const proxyParams = this._appendWhatsappUserScope(new URLSearchParams({ ts: String(Date.now()) }));
                            const proxyUrl = '/api/whatsapp/qr-image?' + proxyParams.toString();
                            //console.log('ConnectorsTab: fetching proxied QR at', proxyUrl);
                            try {
                                const blob = await this._fetchProxiedQrBlob(proxyUrl);
                                if (blob) {
                                    try { if (this._currentQrObjectUrl) URL.revokeObjectURL(this._currentQrObjectUrl); } catch (_) {}
                                    const obj = URL.createObjectURL(blob);
                                    this._currentQrObjectUrl = obj;
                                    img.onload = () => {
                                        //console.log('ConnectorsTab: proxied QR image loaded');
                                        try { this.lastQrDataUrl = currentQr; this.lastQrSignature = currentQrSignature; this.lastQrTimestamp = currentQrIssuedAt; this.startWhatsappQrCountdown(); } catch (_) {}
                                        this.setWhatsappModalStartStatus(false);
                                    };
                                    img.onerror = (e) => {
                                        console.warn('ConnectorsTab: proxied QR image error', e);
                                        showPlaceholder();
                                    };
                                    img.src = obj;
                                    qrContainer.appendChild(img);
                                    //console.log('ConnectorsTab: proxied QR blob appended, size=', blob.size);
                                } else {
                                    // Fallback: let the browser fetch the proxied URL
                                    // directly (this will surface server-side errors
                                    // via the image onerror handler).
                                    const directProxyParams = this._appendWhatsappUserScope(new URLSearchParams({
                                        url: currentQr,
                                        ts: String(Date.now())
                                    }));
                                    const directProxy = '/api/whatsapp/qr-image?' + directProxyParams.toString();
                                    img.onload = () => {
                                        //console.log('ConnectorsTab: direct-proxy QR image loaded');
                                        try { this.lastQrDataUrl = currentQr; this.lastQrSignature = currentQrSignature; this.lastQrTimestamp = currentQrIssuedAt; this.startWhatsappQrCountdown(); } catch (_) {}
                                        this.setWhatsappModalStartStatus(false);
                                    };
                                    img.onerror = (e) => {
                                        console.warn('ConnectorsTab: direct-proxy QR image error', e);
                                        showPlaceholder();
                                    };
                                    img.src = directProxy;
                                    qrContainer.appendChild(img);
                                }
                            } catch (err) {
                                console.warn('ConnectorsTab: error fetching proxied QR', err);
                                // Final fallback: try direct image URL via proxy
                                const directProxyParams = this._appendWhatsappUserScope(new URLSearchParams({
                                    url: currentQr,
                                    ts: String(Date.now())
                                }));
                                const directProxy = '/api/whatsapp/qr-image?' + directProxyParams.toString();
                                img.onload = () => {
                                    //console.log('ConnectorsTab: direct-proxy QR image loaded after fetch error');
                                    try { this.lastQrDataUrl = currentQr; this.lastQrSignature = currentQrSignature; this.lastQrTimestamp = currentQrIssuedAt; this.startWhatsappQrCountdown(); } catch (_) {}
                                    this.setWhatsappModalStartStatus(false);
                                };
                                img.onerror = (e) => {
                                    console.warn('ConnectorsTab: direct-proxy QR image error after fetch error', e);
                                    showPlaceholder();
                                };
                                img.src = directProxy;
                                qrContainer.appendChild(img);
                            }
                        }
                    }
                }
            }

                if (this.lastQrDataUrl && Date.now() - this.lastQrTimestamp > qrTTL) {
                    if (!this.whatsappQrWaitingForRefresh) {
                        this.whatsappQrWaitingForRefresh = true;
                        this.setWhatsappModalRefreshNote('Waiting for a refreshed QR code...');
                    }
                    this.setWhatsappQrCountdown(0);
                }

            } catch (err) {
                if (!this._isWhatsappRequestActive(requestGeneration, true)) {
                    return;
                }
                console.warn('ConnectorsTab: QR polling failed', err);
                this.stopPolling();
            }
        };

    

        //console.log('ConnectorsTab: starting QR polling');
        // Countdown removed; we show refresh status message instead.
        await this.refreshWhatsappPairButton({ start: true, check: true, requestGeneration });
        if (!this._isWhatsappRequestActive(requestGeneration)) {
            return;
        }
        await pollQr();

        if (this.qrPollInterval) {
            clearInterval(this.qrPollInterval);
            this.qrPollInterval = null;
        }

        this.qrPollInterval = setInterval(() => {
            //console.log('ConnectorsTab: polling QR');
            pollQr();
        }, 3000); // 3 seconds between refresh attempts until paired
    }

    destroy() {
        this.stopPolling();
        if (this.whatsappButton) {
            this.whatsappButton.removeEventListener('click', this.openWhatsappPairModal);
        }
    }

    // Fetch a proxied QR image URL and return a Blob if successful.
    async _fetchProxiedQrBlob(proxyUrl) {
        try {
            const res = await fetch(proxyUrl, { cache: 'no-store' });
            if (!res.ok) {
                console.warn('ConnectorsTab: _fetchProxiedQrBlob non-OK status', res.status, res.statusText);
                return null;
            }
            const ct = res.headers.get('Content-Type') || '';
            if (!ct.startsWith('image')) {
                console.warn('ConnectorsTab: _fetchProxiedQrBlob non-image content-type', ct);
                return null;
            }
            const blob = await res.blob();
            return blob;
        } catch (err) {
            console.warn('ConnectorsTab: _fetchProxiedQrBlob failed', err);
            return null;
        }
    }
}

window.ConnectorsTab = ConnectorsTab;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.connectorsTab = new ConnectorsTab();
    });
} else {
    window.connectorsTab = new ConnectorsTab();
}
