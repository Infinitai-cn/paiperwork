class DatabaseTab {
    constructor() {
        this.initialized = false;
        this.tabElement = document.getElementById('database-tab');
        this.hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
    }

    // Initializes the DatabaseTab, sets up the tab structure, and loads statistics
    async initialize() {
        if (this.initialized) return;
        
       //console.log('Initializing Database Tab');
        
        // Create tab structure
        this.createTabStructure();
        
        // Check tracked DB handles first to avoid unnecessary reopen churn.
        const openState = PaiperworkDB.getOpenDatabaseState(this.hashedMasterKey);
        // Load statistics (will reuse open handles when available)
        await this.refreshDatabaseStats();

        if (!openState.main || !openState.rag || !openState.presentations || !openState.artifacts || !openState.campaigns || !openState.kb || !openState.whatsapp) {
            //console.info('DatabaseTab: One or more DB roles were not open; opened on-demand for stats.');
        }
        
        this.initialized = true;
       //console.log('Database Tab initialized');
    }

    // Creates the HTML structure for the database tab and attaches event listeners
    createTabStructure() {
        this.tabElement.innerHTML = `
            <div class="database-container">
                <div class="database-header">
                    <h2>${Lang.get('databaseManagementTitle') || 'Database Management'}</h2>
                    <p>${Lang.get('databaseManagementDesc') || 'Monitor and manage your local database to ensure optimal performance.'}</p>
                </div>
                
                <div class="database-stats-panel">
                    <div class="stats-loading">
                        <div class="spinner"></div>
                        <span>${Lang.get('loadingDatabaseStats') || 'Loading database statistics...'}</span>
                    </div>
                </div>
                
                <div class="database-actions hidden">
                    <div class="action-buttons">
                        <button id="refresh-db-stats" class="action-button">
                            <i class="fas fa-sync-alt"></i> ${Lang.get('refreshStats') || 'Refresh Statistics'}
                        </button>
                        <button id="cleanup-database" class="action-button warning hidden">
                            <i class="fas fa-broom"></i> ${Lang.get('cleanupOrphaned') || 'Clean Up Orphaned Data'}
                        </button>
                        <button id="vacuum-database" class="action-button">
                            <i class="fas fa-compress-alt"></i> ${Lang.get('optimizeDatabase') || 'Optimize Database'}
                        </button>
                    </div>
                    <div class="action-buttons secondary-actions">
                        <div class="secondary-action-row">
                            <button id="export-database" class="action-button">
                                <i class="fas fa-file-export"></i> ${Lang.get('exportDatabase') || 'Export Database'}
                            </button>
                            <button id="import-database" class="action-button">
                                <i class="fas fa-file-import"></i> ${Lang.get('importDatabase') || 'Import Database'}
                            </button>
                        </div>
                        <button id="delete-all-databases" class="action-button warning" style="background-color: #b91c1c; color: white; width: auto; min-width: 220px; text-align: center;">
                            <i class="fas fa-trash"></i> ${Lang.get('deleteAllButton') || 'Delete All Information'}
                        </button>
                        <input id="import-database-file" type="file" accept=".pwdb,.json,.db,application/json,application/octet-stream" style="display:none" tabindex="-1" aria-hidden="true">
                    </div>
                </div>
                
                <div class="database-info-section">
                    <h3>${Lang.get('aboutDatabaseTitle') || 'About Your Database'}</h3>
                    <p>${Lang.get('aboutDatabaseDesc') || 'Paiperwork stores all your data locally in a secure SQLite database within your browser. Your data never leaves your device unless you explicitly export it.'}</p>
                    <div class="tech-info">
                        <div class="info-item">
                            <span class="info-label">${Lang.get('storageMethod') || 'Storage Method'}:</span>
                            <span id="storage-method" class="info-value">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">${Lang.get('encryptionStatus') || 'Encryption'}:</span>
                            <span class="info-value encrypted">${Lang.get('enabled') || 'Enabled'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('refresh-db-stats')?.addEventListener('click', () => this.refreshDatabaseStats());
        document.getElementById('cleanup-database')?.addEventListener('click', () => this.cleanupOrphanedChunks());
        document.getElementById('vacuum-database')?.addEventListener('click', () => this.vacuumDatabase());
        document.getElementById('export-database')?.addEventListener('click', () => this.exportDatabase());
        document.getElementById('import-database')?.addEventListener('click', () => this.openImportDialog());
        document.getElementById('import-database-file')?.addEventListener('change', (event) => this.importDatabase(event));

        // Delete all database content (user-level destructive action)
        const deleteAllBtn = document.getElementById('delete-all-databases');
        if (deleteAllBtn) {
            deleteAllBtn.addEventListener('click', async () => {
                const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                if (!hashedMasterKey) {
                    alert(Lang.get('securityNotLoggedIn') || 'Please log in before deleting databases');
                    return;
                }

                const confirmed = confirm(Lang.get('securityFinalDeleteWarning') || 'This will permanently delete all data. Are you sure?');
                if (!confirmed) return;

                deleteAllBtn.disabled = true;
                const originalText = deleteAllBtn.textContent;
                deleteAllBtn.textContent = Lang.get('securityDeleting') || 'Deleting...';

                try {
                    if (window.PaiperworkSessionReset && typeof window.PaiperworkSessionReset.stopWhatsappServerForSessionReset === 'function') {
                        await window.PaiperworkSessionReset.stopWhatsappServerForSessionReset();
                    }
                    const ok = await PaiperworkDB.deleteAllDatabases();
                    if (ok) {
                        alert(Lang.get('securityDataDeletedSuccess') || 'All data deleted successfully');
                        sessionStorage.clear();
                        window.location.href = '../index.html';
                    } else {
                        alert(Lang.get('securityDeleteError') || 'Error deleting data');
                        deleteAllBtn.disabled = false;
                        deleteAllBtn.textContent = originalText;
                    }
                } catch (err) {
                    console.error('Error deleting databases', err);
                    alert(Lang.get('securityDeletionError') || 'Deletion failed');
                    deleteAllBtn.disabled = false;
                    deleteAllBtn.textContent = originalText;
                }
            });
        }
        
        // Add styles
        this.addStyles();
    }

    bindClearWhatsappPhoneContextsButton(buttonElement, refreshStatsCallback = null) {
        return DatabaseTab.bindClearWhatsappPhoneContextsButton(buttonElement, refreshStatsCallback);
    }

    static bindClearWhatsappPhoneContextsButton(buttonElement, refreshStatsCallback = null) {
        if (!buttonElement || buttonElement.dataset.whatsappContextsBound === 'true') {
            return;
        }

        buttonElement.dataset.whatsappContextsBound = 'true';
        buttonElement.addEventListener('click', async () => {
            await DatabaseTab.clearWhatsappPhoneContextsFromButton(buttonElement, refreshStatsCallback);
        });
    }

    static async clearWhatsappPhoneContextsFromButton(buttonElement, refreshStatsCallback = null) {
        if (!buttonElement) {
            return;
        }

        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
        if (!hashedMasterKey) {
            alert(Lang.get('securityNotLoggedIn') || 'Please log in before deleting databases');
            return;
        }

        const confirmed = confirm(
            Lang.get('clearWhatsappPhoneContextsConfirm')
            || 'This will permanently delete all stored WhatsApp per-phone context memory. Paired devices, replay/history tracking, and the rest of your database will be preserved. Continue?'
        );
        if (!confirmed) return;

        buttonElement.disabled = true;
        const originalHtml = buttonElement.innerHTML;
        buttonElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${Lang.get('clearWhatsappPhoneContextsDeleting') || 'Clearing WhatsApp phone contexts...'}`;

        try {
            const result = await PaiperworkDB.clearAllWhatsappPhoneContexts(hashedMasterKey);
            if (result && result.success) {
                if (window.connectors && typeof window.connectors.clearAllWhatsappPerPhoneRuntimeState === 'function') {
                    window.connectors.clearAllWhatsappPerPhoneRuntimeState();
                }

                if (typeof refreshStatsCallback === 'function') {
                    await refreshStatsCallback();
                } else if (window.databaseTab && typeof window.databaseTab.refreshDatabaseStats === 'function') {
                    await window.databaseTab.refreshDatabaseStats();
                }

                alert(
                    Lang.get('clearWhatsappPhoneContextsSuccess', { count: Number(result.count || 0) })
                    || `Cleared ${Number(result.count || 0)} WhatsApp phone context entries.`
                );
            } else {
                alert(Lang.get('clearWhatsappPhoneContextsFailed') || 'Failed to clear WhatsApp phone contexts.');
            }
        } catch (err) {
            console.error('Error clearing WhatsApp phone contexts', err);
            alert(Lang.get('clearWhatsappPhoneContextsFailed') || 'Failed to clear WhatsApp phone contexts.');
        } finally {
            buttonElement.disabled = false;
            buttonElement.innerHTML = originalHtml;
        }
    }
    
    // Fetches and displays the latest database statistics in the stats panel
    async refreshDatabaseStats() {
        const statsPanel = document.querySelector('.database-stats-panel');
        if (!statsPanel) return;
        
        // Show loading state
        statsPanel.innerHTML = `
            <div class="stats-loading">
                <div class="spinner"></div>
                <span>${Lang.get('loadingDatabaseStats') || 'Loading database statistics...'}</span>
            </div>
        `;
        
        // Show storage method
        const storageMethod = document.getElementById('storage-method');
        if (storageMethod) {
            storageMethod.textContent = PaiperworkDB.opfsSupported ? 
                'OPFS (Origin Private File System)' : 
                'IndexedDB';
        }
        
        // Get database statistics
        try {
            const stats = await PaiperworkDB.getDatabaseStatistics(this.hashedMasterKey);
            if (!stats) {
                statsPanel.innerHTML = `<div class="stats-error">Could not retrieve database statistics</div>`;
                return;
            }
            
            // Update actions visibility
            const cleanupButton = document.getElementById('cleanup-database');
            if (cleanupButton) {
                if (stats.health.hasOrphanedChunks) {
                    cleanupButton.classList.remove('hidden');
                } else {
                    cleanupButton.classList.add('hidden');
                }
            }
            
            document.querySelector('.database-actions')?.classList.remove('hidden');
            
            // Build the stats HTML
            const openState = PaiperworkDB.getOpenDatabaseState(this.hashedMasterKey);
            const breakdown = stats.dbBreakdown || {};

            let html = `
                <div class="stats-header">
                    <h3>${Lang.get('databaseStats') || 'Database Statistics'}</h3>
                </div>
                <div class="stats-body">
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${stats.totalSize.formatted}</div>
                            <div class="stat-label">${Lang.get('databaseSize') || 'Database Size'}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.documents.count}</div>
                            <div class="stat-label">${Lang.get('documents') || 'Documents'}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${stats.chunks.count}</div>
                            <div class="stat-label">${Lang.get('totalChunks') || 'Total Chunks'}</div>
                        </div>
            `;
            
            // Add health status
            if (stats.health.hasOrphanedChunks) {
                html += `
                    <div class="stat-item warning">
                        <div class="stat-value attention">${stats.chunks.orphaned}</div>
                        <div class="stat-label">${Lang.get('orphanedChunks') || 'Orphaned Chunks'}</div>
                    </div>
                </div>
                <div class="db-cleanup-section">
                    <div class="cleanup-info">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>${Lang.get('orphanedChunksFound').replace('{count}', stats.chunks.orphaned) || 
                            `Found ${stats.chunks.orphaned} orphaned chunks that are not associated with any document. 
                            These may be leftover from deleted documents and are taking up unnecessary space.`}</p>
                    </div>
                </div>
                `;
            } else {
                html += `
                    <div class="stat-item healthy">
                        <div class="stat-value"><i class="fas fa-check-circle"></i></div>
                        <div class="stat-label">${Lang.get('databaseHealth') || 'Database Health'}</div>
                    </div>
                </div>`;
            }

            html += `
                <div class="db-breakdown-section">
                    <h4>${Lang.get('databaseBreakdown') || 'Database Breakdown'}</h4>
                    <div class="db-breakdown-grid">
                        <div class="db-breakdown-card">
                            <div class="db-breakdown-title">${Lang.get('databaseMain') || 'Main'}</div>
                            <div class="db-breakdown-size">${breakdown.main?.formatted || '-'}</div>
                            <div class="db-breakdown-meta">${openState.main ? (Lang.get('databaseOpenStatus') || 'Open') : (Lang.get('databaseClosedStatus') || 'Closed')}</div>
                        </div>
                        <div class="db-breakdown-card">
                            <div class="db-breakdown-title">${Lang.get('databaseRag') || 'RAG'}</div>
                            <div class="db-breakdown-size">${breakdown.rag?.formatted || '-'}</div>
                            <div class="db-breakdown-meta">${openState.rag ? (Lang.get('databaseOpenStatus') || 'Open') : (Lang.get('databaseClosedStatus') || 'Closed')}</div>
                        </div>
                        <div class="db-breakdown-card">
                            <div class="db-breakdown-title">${Lang.get('presentationTab') || 'Presentations'}</div>
                            <div class="db-breakdown-size">${breakdown.presentations?.formatted || '-'}</div>
                            <div class="db-breakdown-meta">${openState.presentations ? (Lang.get('databaseOpenStatus') || 'Open') : (Lang.get('databaseClosedStatus') || 'Closed')} | ${Lang.get('databaseCountLabel') || 'Count'}: ${breakdown.presentations?.count || 0}</div>
                        </div>
                        <div class="db-breakdown-card">
                            <div class="db-breakdown-title">${Lang.get('artifactsTab') || 'Artifacts'}</div>
                            <div class="db-breakdown-size">${breakdown.artifacts?.formatted || '-'}</div>
                            <div class="db-breakdown-meta">${openState.artifacts ? (Lang.get('databaseOpenStatus') || 'Open') : (Lang.get('databaseClosedStatus') || 'Closed')} | ${Lang.get('databaseCountLabel') || 'Count'}: ${breakdown.artifacts?.count || 0}</div>
                        </div>
                        <div class="db-breakdown-card">
                            <div class="db-breakdown-title">${Lang.get('campaignTab') || 'Campaigns'}</div>
                            <div class="db-breakdown-size">${breakdown.campaigns?.formatted || '-'}</div>
                            <div class="db-breakdown-meta">${openState.campaigns ? (Lang.get('databaseOpenStatus') || 'Open') : (Lang.get('databaseClosedStatus') || 'Closed')} | ${Lang.get('databaseCountLabel') || 'Count'}: ${breakdown.campaigns?.count || 0} | ${Lang.get('databasePayloadLabel') || 'Payload'}: ${breakdown.campaigns?.payloadFormatted || '0 B'}</div>
                        </div>
                        <div class="db-breakdown-card">
                            <div class="db-breakdown-title">${Lang.get('knowledgeBaseTitle') || 'Knowledge Base'}</div>
                            <div class="db-breakdown-size">${breakdown.knowledgeBase?.formatted || '-'}</div>
                            <div class="db-breakdown-meta">${openState.kb ? (Lang.get('databaseOpenStatus') || 'Open') : (Lang.get('databaseClosedStatus') || 'Closed')} | ${Lang.get('databaseCollectionsLabel') || 'Collections'}: ${breakdown.knowledgeBase?.collections || 0}</div>
                        </div>
                        <div class="db-breakdown-card">
                            <div class="db-breakdown-title">${Lang.get('images') || 'Images'}</div>
                            <div class="db-breakdown-size">${breakdown.images?.formatted || '-'}</div>
                            <div class="db-breakdown-meta">${openState.images ? (Lang.get('databaseOpenStatus') || 'Open') : (Lang.get('databaseClosedStatus') || 'Closed')} | ${Lang.get('databaseCountLabel') || 'Count'}: ${breakdown.images?.count || 0}</div>
                        </div>
                        <div class="db-breakdown-card">
                            <div class="db-breakdown-title">WhatsApp</div>
                            <div class="db-breakdown-size">${breakdown.whatsapp?.formatted || '-'}</div>
                            <div class="db-breakdown-meta">${openState.whatsapp ? (Lang.get('databaseOpenStatus') || 'Open') : (Lang.get('databaseClosedStatus') || 'Closed')} | ${Lang.get('deviceCountLabel') || 'Devices'}: ${breakdown.whatsapp?.devices || 0} | ${Lang.get('databaseSessionsLabel') || 'Sessions'}: ${breakdown.whatsapp?.sessions || 0} (${breakdown.whatsapp?.sessionFormatted || '0 B'}) | ${Lang.get('databaseContextsLabel') || 'Contexts'}: ${breakdown.whatsapp?.contexts || 0} (${breakdown.whatsapp?.contextFormatted || '0 B'})</div>
                        </div>
                        <div class="db-breakdown-card">
                            <div class="db-breakdown-title">WeChat</div>
                            <div class="db-breakdown-size">${breakdown.wechat?.formatted || '-'}</div>
                            <div class="db-breakdown-meta">${openState.wechat ? (Lang.get('databaseOpenStatus') || 'Open') : (Lang.get('databaseClosedStatus') || 'Closed')} | Accounts: ${breakdown.wechat?.accounts || 0} | Sessions: ${breakdown.wechat?.sessions || 0} | Events: ${breakdown.wechat?.events || 0} (${breakdown.wechat?.eventsPayloadFormatted || '0 B'}) | Logs: ${breakdown.wechat?.logs || 0} | Peer contexts: ${breakdown.wechat?.peerContexts || 0} (${breakdown.wechat?.peerContextFormatted || '0 B'}) | Account contexts: ${breakdown.wechat?.accountContexts || 0} (${breakdown.wechat?.accountContextFormatted || '0 B'})</div>
                        </div>
                    </div>
                </div>
            `;
            
            // Update the panel content
            statsPanel.innerHTML = html;
        } catch (error) {
            console.error('Error getting database stats:', error);
            statsPanel.innerHTML = `<div class="stats-error">Error: ${error.message}</div>`;
        }
    }
    
    // Cleans up orphaned chunks from the database and updates the UI accordingly
    async cleanupOrphanedChunks() {
        const cleanupButton = document.getElementById('cleanup-database');
        if (!cleanupButton) return;
        
        cleanupButton.disabled = true;
        cleanupButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Cleaning...';
        
        try {
            const result = await PaiperworkDB.cleanupOrphanedChunks(this.hashedMasterKey);
            
            if (result.success) {
                // Show success message
                const dbCleanupSection = document.querySelector('.db-cleanup-section');
                if (dbCleanupSection) {
                    dbCleanupSection.innerHTML = `
                        <div class="cleanup-success">
                            <i class="fas fa-check-circle"></i>
                            <div>
                                <p>${Lang.get('orphanedChunksRemoved').replace('{count}', result.orphanedChunksRemoved) || 
                                    `Successfully removed ${result.orphanedChunksRemoved} orphaned chunks.`}</p>
                                <p>${Lang.get('databaseSizeReduced').replace('{size}', result.savedFormatted) || 
                                    `Database size reduced by ${result.savedFormatted}.`}</p>
                            </div>
                        </div>
                    `;
                }
                
                // Refresh stats after a delay
                setTimeout(() => {
                    this.refreshDatabaseStats();
                }, 3000);
            } else {
                cleanupButton.innerHTML = Lang.get('cleanupFailed') || 'Clean Up Failed';
                setTimeout(() => {
                    cleanupButton.innerHTML = Lang.get('tryAgain') || 'Try Again';
                    cleanupButton.disabled = false;
                }, 2000);
            }
        } catch (error) {
            console.error('Error during cleanup:', error);
            cleanupButton.innerHTML = Lang.get('error') || 'Error';
            cleanupButton.disabled = false;
        }
    }
    
    // Runs the VACUUM operation to optimize the database and updates the UI
    async vacuumDatabase() {
        const vacuumButton = document.getElementById('vacuum-database');
        if (!vacuumButton) return;
        
        vacuumButton.disabled = true;
        vacuumButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Optimizing...';
        
        try {
            const result = await PaiperworkDB.vacuumDatabase(this.hashedMasterKey);
            
            if (result.success) {
                // Show success notification
                this.showNotification('success', 
                    Lang.get('databaseOptimized').replace('{size}', result.savedFormatted) || 
                    `Database optimized successfully. Saved ${result.savedFormatted}.`);
                
                // Refresh stats
                await this.refreshDatabaseStats();
            } else {
                this.showNotification('error', 
                    Lang.get('databaseOptimizeFailed') || 
                    'Database optimization failed.');
            }
            
            vacuumButton.innerHTML = '<i class="fas fa-compress-alt"></i> ' + 
                (Lang.get('optimizeDatabase') || 'Optimize Database');
            vacuumButton.disabled = false;
        } catch (error) {
            console.error('Error during database vacuum:', error);
            
            this.showNotification('error', 
                Lang.get('databaseError') || 
                'An error occurred while optimizing the database.');
                
            vacuumButton.innerHTML = '<i class="fas fa-compress-alt"></i> ' + 
                (Lang.get('optimizeDatabase') || 'Optimize Database');
            vacuumButton.disabled = false;
        }
    }

    async exportDatabase() {
        const exportButton = document.getElementById('export-database');
        if (!exportButton) return;

        exportButton.disabled = true;
        exportButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Exporting...';

        try {
            await this.refreshDatabaseStats();
            const bundleText = await PaiperworkDB.exportDatabaseBundle(this.hashedMasterKey);
            const blob = new Blob([bundleText], { type: 'application/json' });
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = 'Paiperwork-Backup.pwdb';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(downloadUrl);

            await this.refreshDatabaseStats();

            this.showNotification('success', Lang.get('databaseExported') || 'Database backup exported successfully.');
        } catch (error) {
            console.error('Error exporting database:', error);
            this.showNotification('error', Lang.get('databaseExportFailed') || 'Database export failed.');
        } finally {
            exportButton.innerHTML = '<i class="fas fa-file-export"></i> ' +
                (Lang.get('exportDatabase') || 'Export Database');
            exportButton.disabled = false;
        }
    }

    openImportDialog() {
        const fileInput = document.getElementById('import-database-file');
        if (!fileInput) return;
        fileInput.value = '';
        fileInput.click();
    }

    async importDatabase(event) {
        const importButton = document.getElementById('import-database');
        const fileInput = event?.target;
        const file = fileInput?.files?.[0];

        if (!importButton || !file) {
            return;
        }

        const confirmed = confirm(
            Lang.get('importDatabaseConfirm') ||
            'Importing a backup will replace only the database roles included in the backup. Missing roles will be preserved locally. Continue?'
        );
        if (!confirmed) {
            return;
        }

        importButton.disabled = true;
        importButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Importing...';

        try {
            const buffer = await file.arrayBuffer();
            const importResult = await PaiperworkDB.importDatabaseBundle(this.hashedMasterKey, new Uint8Array(buffer));
            const importedRoles = Array.isArray(importResult?.importedRoles) && importResult.importedRoles.length
                ? importResult.importedRoles
                : ['main'];
            const preservedRoles = Array.isArray(importResult?.preservedRoles)
                ? importResult.preservedRoles
                : [];
            const importedRolesText = importedRoles.join(', ');
            const preservedRolesText = preservedRoles.length
                ? preservedRoles.join(', ')
                : (Lang.get('databaseImportRolesNone') || 'none');

            if (window.PaiperworkSessionReset && typeof window.PaiperworkSessionReset.stopWhatsappServerForSessionReset === 'function') {
                await window.PaiperworkSessionReset.stopWhatsappServerForSessionReset();
            }
            await PaiperworkDB.closeAllDatabases(this.hashedMasterKey);
            try {
                sessionStorage.removeItem('hashedMasterKey');
            } catch (_error) {
                // Ignore session storage cleanup errors.
            }

            alert(
                `${Lang.get('databaseImportedReturnWarning') || 'Database imported successfully. Click OK to return to the welcome screen.'}\n\n${Lang.get('databaseImportRolesImportedLabel') || 'Imported roles'}: ${importedRolesText}\n${Lang.get('databaseImportRolesPreservedLabel') || 'Preserved local roles'}: ${preservedRolesText}`
            );

            window.location.href = '../welcome.html';
        } catch (error) {
            console.error('Error importing database:', error);
            this.showNotification('error', error?.message || Lang.get('databaseImportFailed') || 'Database import failed.');
            importButton.innerHTML = '<i class="fas fa-file-import"></i> ' +
                (Lang.get('importDatabase') || 'Import Database');
            importButton.disabled = false;
        } finally {
            if (fileInput) {
                fileInput.value = '';
            }
        }
    }
    
    // Displays a notification message of a given type (success or error) to the user
    showNotification(type, message) {
        // Create notification container if it doesn't exist
        let notificationContainer = document.querySelector('.notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Handle close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.add('hide');
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('hide');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
    // Handles actions when the database tab becomes active (e.g., refresh stats)
    handleTabChange(active) {
        if (active && this.initialized) {
            // Check if DBs are already open before acting on them.
            const openState = PaiperworkDB.getOpenDatabaseState(this.hashedMasterKey);
            if (!openState.main || !openState.rag || !openState.presentations || !openState.artifacts || !openState.campaigns || !openState.kb || !openState.whatsapp) {
                //console.info('DatabaseTab: Refreshing stats with on-demand DB open.', openState);
            }
            // Refresh when tab becomes active
            this.refreshDatabaseStats();
        }
    }
    // Handles theme changes by re-applying styles and refreshing statistics
    handleThemeChange() {
        // Re-apply styles to ensure they pick up new theme variables
        this.addStyles();
        
        // Refresh statistics to update visual elements
        if (this.initialized) {
            this.refreshDatabaseStats();
        }
    }
    // Injects the required CSS styles for the database tab into the document
    addStyles() {
        const styleId = 'database-tab-styles';
        if (document.getElementById(styleId)) return;
        
        const styleEl = document.createElement('style');
        styleEl.id = styleId;

        styleEl.textContent = `
        .database-container {
            padding: 20px;
            max-width: 100%;
            overflow-x: hidden;
        }
        
        .database-header {
            margin-bottom: 24px;
        }
        
        .database-header h2 {
            margin: 0 0 8px 0;
            font-size: 20px;
            font-weight: 600;
            color: var(--text-color);
        }
        
        .database-header p {
            margin: 0;
            color: var(--label-color);
        }
        
        .database-stats-panel {
            margin: 16px 0;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            overflow: hidden;
            background-color: var(--bg-color-secondary);
        }
        
        .stats-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-color);
            background-color: var(--bg-color);
        }
        
        .stats-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-color);
        }
        
        .stats-body {
            padding: 16px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 16px;
        }
        
        .stat-item {
            padding: 12px;
            border-radius: 6px;
            background-color: var(--bg-color);
            text-align: center;
            box-shadow: 0 1px 3px var(--db-stats-card-shadow);
        }
        
        .stat-value {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 4px;
            color: var(--text-color);
        }
        
        .stat-label {
            font-size: 13px;
            color: var(--label-color);
        }
        
        .warning {
            border-left: 3px solid var(--db-warning-color);
            background-color: var(--db-warning-bg);
        }
        
        .attention {
            color: var(--db-warning-color);
        }
        
        .healthy {
            border-left: 3px solid var(--db-success-color);
            background-color: var(--db-success-bg);
        }
        
        .healthy .stat-value {
            color: var(--db-success-color);
        }
        
        .db-cleanup-section {
            margin-top: 16px;
            padding: 16px;
            background-color: var(--db-warning-bg);
            border-radius: 6px;
        }
        
        .cleanup-info {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 16px;
        }
        
        .cleanup-info i {
            color: var(--db-warning-color);
            font-size: 18px;
        }
        
        .cleanup-info p {
            margin: 0;
            font-size: 14px;
            color: var(--text-color);
        }
        
        .cleanup-success {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .cleanup-success i {
            color: var(--db-success-color);
            font-size: 24px;
        }
        
        .cleanup-success p {
            margin: 5px 0;
            font-size: 14px;
            color: var(--text-color);
        }
        
        .stats-loading, .stats-error {
            padding: 20px;
            text-align: center;
            color: var(--label-color);
        }
        
        .stats-loading .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid var(--db-spinner-bg);
            border-radius: 50%;
            border-top-color: var(--accent-color);
            animation: spin 1s linear infinite;
            margin-right: 8px;
            vertical-align: middle;
        }

        .db-breakdown-section {
            margin-top: 18px;
            padding-top: 14px;
            border-top: 1px solid var(--border-color);
        }

        .db-breakdown-section h4 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: var(--text-color);
        }

        .db-breakdown-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
            gap: 10px;
        }

        .db-breakdown-card {
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 10px;
            background: var(--bg-color);
        }

        .db-breakdown-title {
            font-size: 12px;
            color: var(--label-color);
            margin-bottom: 4px;
        }

        .db-breakdown-size {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-color);
        }

        .db-breakdown-meta {
            margin-top: 3px;
            font-size: 12px;
            color: var(--label-color);
        }
        
        .database-actions {
            margin: 20px 0;
        }
        
        .database-actions.hidden {
            display: none;
        }
        
        .action-buttons {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
        }

        .action-buttons.secondary-actions {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            width: 100%;
        }

        .action-buttons.secondary-actions .secondary-action-row {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
        }

        .action-buttons.secondary-actions .secondary-action-row .action-button {
            flex: 1 1 0;
            min-width: 0;
            width: auto;
        }

        .secondary-actions {
            margin-top: 10px;
        }
        
        .action-button {
            padding: 8px 16px;
            width: 100%;
            border: none;
            border-radius: 4px;
            background-color: var(--accent-color);
            color: var(--accent-text);
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .action-button.warning {
            background-color: var(--db-warning-color);
        }
        
        .action-button.warning:hover {
            background-color: var(--db-warning-color);
            filter: brightness(0.9);
        }
        
        .action-button.hidden {
            display: none;
        }
        
        .action-button:hover {
            background-color: var(--accent-color-hover);
        }
        
        .action-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }
        
        .database-info-section {
            margin-top: 30px;
            padding: 20px;
            border-radius: 8px;
            background-color: var(--bg-color-secondary);
            border: 1px solid var(--border-color);
        }
        
        .database-info-section h3 {
            margin: 0 0 12px 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--text-color);
        }
        
        .database-info-section p {
            color: var(--text-color);
        }
        
        .tech-info {
            margin-top: 16px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
            padding: 12px;
            background-color: var(--bg-color);
            border-radius: 6px;
            box-shadow: 0 1px 2px var(--db-stats-card-shadow);
        }
        
        .info-label {
            font-size: 12px;
            color: var(--label-color);
            margin-bottom: 4px;
        }
        
        .info-value {
            font-weight: 500;
            color: var(--text-color);
        }
        
        .info-value.encrypted {
            color: var(--db-success-color);
        }
        
        .notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .notification {
            padding: 12px 16px;
            border-radius: 6px;
            background-color: var(--bg-color);
            box-shadow: 0 4px 12px var(--db-notification-shadow);
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            max-width: 400px;
            animation: slide-in 0.3s ease-out forwards;
            opacity: 0;
            transform: translateX(30px);
            border-left: 4px solid transparent;
        }
        
        .notification.success {
            border-left-color: var(--db-success-color);
        }
        
        .notification.error {
            border-left-color: var(--db-error-color);
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--text-color);
        }
        
        .notification-content i {
            font-size: 18px;
        }
        
        .notification.success i {
            color: var(--db-success-color);
        }
        
        .notification.error i {
            color: var(--db-error-color);
        }
        
        .notification-close {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: var(--label-color);
        }
        
        .notification.hide {
            animation: slide-out 0.3s ease-in forwards;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @keyframes slide-in {
            from {
                opacity: 0;
                transform: translateX(30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slide-out {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(30px);
            }
        }
    `;
        
        document.head.appendChild(styleEl);
    }
}

// Export the class globally
window.DatabaseTab = DatabaseTab;

// Only create the instance when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.databaseTab = new DatabaseTab();
  });
} else {
  // DOM already loaded, create instance now
  window.databaseTab = new DatabaseTab();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (window.databaseTab) {
        window.databaseTab.handleThemeChange();
    }
});
}