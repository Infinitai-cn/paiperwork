class ArtifactsTab {
    constructor() {
        this.isInitialized = false;
        this.tabElement = document.getElementById('artifacts-tab');
    }

    initialize() {
        if (this.isInitialized || !this.tabElement) {
            return;
        }

        const descriptionText = Lang.get('artifactsDescription') ||
            'Artifacts are self contained html files that can be prompted to create any kind of functionality (sandboxed), Artifacts can be saved into the internal database or to downloads folder.';
        const openButtonText = Lang.get('openArtifactsButton') || 'Open artifacts';

        this.tabElement.innerHTML = `
            <div class="artifacts-container">
                <p class="artifacts-description">
                    ${descriptionText}
                </p>
                <button id="open-artifacts-button" class="artifacts-open-button" type="button">
                    ${openButtonText}
                </button>
            </div>
        `;

        const openButton = document.getElementById('open-artifacts-button');
        if (openButton) {
            openButton.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('artifacts:open-requested'));
            });
        }

        this.isInitialized = true;
    }
}

window.ArtifactsTab = ArtifactsTab;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.artifactsTab = new ArtifactsTab();
    });
} else {
    window.artifactsTab = new ArtifactsTab();
}
