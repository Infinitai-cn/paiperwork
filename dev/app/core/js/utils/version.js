const AppVersion = {
    current: "1.2.3",
    releaseDate: "2026-03-22",

    // Parse version string into components for comparison
    parseVersion: function (versionStr) {
        const parts = versionStr.split('.').map(part => parseInt(part, 10));
        return {
            major: parts[0] || 0,
            minor: parts[1] || 0,
            patch: parts[2] || 0
        };
    },

    // Compare two version strings
    isNewerVersion: function (currentVersion, newVersion) {
        const current = this.parseVersion(currentVersion);
        const newer = this.parseVersion(newVersion);

        if (newer.major > current.major) return true;
        if (newer.major === current.major && newer.minor > current.minor) return true;
        if (newer.major === current.major && newer.minor === current.minor && newer.patch > current.patch) return true;

        return false;
    },

    checkForUpdates: async function () {
        const updateStatusEl = document.getElementById('update-status');
        if (updateStatusEl) {
            updateStatusEl.textContent = Lang.get('checkingForUpdates');
            updateStatusEl.style.display = "block";
        }

        try {
            // Use our local proxy endpoint instead of GitHub directly
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/version-check?t=${timestamp}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
           //console.log("Update check result:", data);

            if (this.isNewerVersion(this.current, data.version)) {
                this.showUpdateDialog(data);
                return true;
            } else {
                this.showNoUpdateDialog();
                return false;
            }
        } catch (error) {
            console.error("Error checking for updates:", error);
            this.showErrorDialog(error.message);
            return false;
        } finally {
            if (updateStatusEl) {
                updateStatusEl.style.display = "none";
            }
        }
    },

    showUpdateDialog: function (updateData) {
        const overlay = document.createElement('div');
        overlay.className = 'update-overlay';
        overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(3px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;

        const dialog = document.createElement('div');
        dialog.className = 'update-dialog';
        dialog.style.cssText = `
        background-color: var(--bg-color);
        color: var(--text-color);
        border-radius: 8px;
        box-shadow: 0 4px 20px var(--preview-shadow);
        border: 1px solid var(--card-border);
        padding: 24px;
        max-width: 500px;
        width: 90%;
    `;

        dialog.innerHTML = `
        <h2 style="margin-top: 0; color: var(--accent-color);">${Lang.get('updateAvailable')}</h2>
        <p>${Lang.get('newVersionAvailable')}</p>
        <div class="update-info">
            <p><strong>${Lang.get('currentVersion')}:</strong> <span style="color: var(--card-meta);">${this.current}</span></p>
            <p><strong>${Lang.get('newVersion')}:</strong> <span style="color: var(--accent-color);">${updateData.version}</span></p>
            <p><strong>${Lang.get('released')}:</strong> <span style="color: var(--card-meta);">${new Date(updateData.releaseDate).toLocaleDateString()}</span></p>
        </div>
        ${updateData.notes ? `<div class="release-notes">
            <h3 style="color: var(--heading-color);">${Lang.get('whatsNew')}:</h3>
            <div style="
                max-height: 150px; 
                overflow-y: auto; 
                padding: 10px; 
                background: var(--chart-plot-bg); 
                border: 1px solid var(--card-border);
                border-radius: 4px; 
                margin-bottom: 15px;
                color: var(--text-color);
            ">
                ${updateData.notes}
            </div>
        </div>` : ''}
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button id="close-update-dialog" style="
                padding: 8px 16px; 
                border: 1px solid var(--border-color); 
                background: transparent; 
                color: var(--text-color);
                border-radius: 4px;
                cursor: pointer;
            ">${Lang.get('later')}</button>
            <button id="download-update" style="
                padding: 8px 16px; 
                background: var(--accent-color); 
                color: var(--accent-text); 
                border: none; 
                border-radius: 4px;
                cursor: pointer;
            ">${Lang.get('downloadUpdate')}</button>
        </div>
    `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Add event listeners
        document.getElementById('close-update-dialog').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        document.getElementById('download-update').addEventListener('click', () => {
            window.open(updateData.downloadUrl || 'https://github.com/Infinitai-cn/paiperwork/releases', '_blank');
            document.body.removeChild(overlay);
        });
    },

    // Show no update available dialog
    showNoUpdateDialog: function () {
        const overlay = document.createElement('div');
        overlay.className = 'update-overlay';
        overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(3px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;

        const dialog = document.createElement('div');
        dialog.className = 'update-dialog';
        dialog.style.cssText = `
        background-color: var(--bg-color);
        color: var(--text-color);
        border-radius: 8px;
        box-shadow: 0 4px 20px var(--preview-shadow);
        border: 1px solid var(--card-border);
        padding: 24px;
        max-width: 400px;
        width: 90%;
        text-align: center;
    `;

        dialog.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 10px; color: var(--accent-color);">✓</div>
        <h2 style="margin-top: 0; color: var(--heading-color);">${Lang.get('upToDate')}</h2>
        <p>${Lang.get('runningLatestVersion')} (<span style="color: var(--card-meta);">${this.current}</span>).</p>
        <div style="margin-top: 20px;">
            <button id="close-update-dialog" style="
                padding: 8px 16px; 
                background: var(--accent-color); 
                color: var(--accent-text); 
                border: none; 
                border-radius: 4px;
                cursor: pointer;
            ">${Lang.get('ok')}</button>
        </div>
    `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Add event listener
        document.getElementById('close-update-dialog').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
    },

    // Show error dialog
    showErrorDialog: function (errorMessage) {
        const overlay = document.createElement('div');
        overlay.className = 'update-overlay';
        overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(3px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;

        const dialog = document.createElement('div');
        dialog.className = 'update-dialog';
        dialog.style.cssText = `
        background-color: var(--bg-color);
        color: var(--text-color);
        border-radius: 8px;
        box-shadow: 0 4px 20px var(--preview-shadow);
        border: 1px solid var(--card-border);
        padding: 24px;
        max-width: 400px;
        width: 90%;
    `;

        dialog.innerHTML = `
        <h2 style="margin-top: 0; color: var(--danger-color);">${Lang.get('updateCheckFailed')}</h2>
        <p>${Lang.get('unableToCheckUpdates')}</p>
        <p style="
            background: var(--chart-plot-bg); 
            border: 1px solid var(--card-border);
            padding: 10px; 
            border-radius: 4px; 
            font-family: monospace; 
            font-size: 12px;
            color: var(--card-meta);
            overflow-x: auto;
        ">${errorMessage}</p>
        <p>${Lang.get('tryAgainLater')}</p>
        <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
            <button id="close-update-dialog" style="
                padding: 8px 16px; 
                background: var(--accent-color); 
                color: var(--accent-text); 
                border: none; 
                border-radius: 4px;
                cursor: pointer;
            ">${Lang.get('ok')}</button>
        </div>
    `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Add event listener
        document.getElementById('close-update-dialog').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
    }
};