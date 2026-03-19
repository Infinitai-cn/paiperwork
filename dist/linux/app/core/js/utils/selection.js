document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('Start-button');
    Lang.initialize();
    startButton.addEventListener('click', async function (e) {
        e.preventDefault();
        const masterkey = document.getElementById('masterkey-input').value;
    
        if (!masterkey) {
            alert(Lang.get('masterkeyRequired'));
            return;
        }
    
        try {
            // Show loading indicator
            startButton.disabled = true;
            startButton.textContent = Lang.get('initializing');
            
            // Ensure database exists first
           //console.log('Ensuring database exists before any operations');
            await PaiperworkDB.ensureDatabaseExists();
            
            // Now it's safe to hash the masterkey
            const hashedMasterKey = await PaiperworkDB.hashMasterKeyValue(masterkey);
    
            // Encrypt the masterkey
            const encryptedMasterKey = await PaiperworkDB.encrypt(hashedMasterKey, masterkey);
    
            // Store encrypted and hashed values
            sessionStorage.setItem('hashedMasterKey', hashedMasterKey);
            sessionStorage.setItem('encryptedMasterKey', JSON.stringify(encryptedMasterKey));
    
            // Initialize database with tables for this masterkey
           //console.log('Initializing database before navigation');
            const dbInitialized = await PaiperworkDB.initializeDatabase(hashedMasterKey);
            
            if (!dbInitialized) {
                throw new Error('Failed to initialize database');
            }
            
            // Add a small delay to ensure IndexedDB operations complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Navigate to the generation page
            window.location.href = 'core/generation.html';
        } catch (error) {
            console.error('Error initializing conversation:', error);
            alert(Lang.get('errorStartingConversation'));
            // Reset button state
            startButton.disabled = false;
            startButton.textContent = Lang.get('startButton');
        }
    });

    function updateWelcomePageText() {
        document.getElementById('page-title').textContent = Lang.get('welcomePageTitle');
        document.querySelector('.masterkey-label').textContent = Lang.get('masterkeyInputLabel');
        document.getElementById('masterkey-input').placeholder = Lang.get('masterkeyInput');
        document.getElementById('Start-button').textContent = Lang.get('startButton');
        document.getElementById('help-button').textContent = Lang.get('helpButton');
        document.getElementById('check-updates').textContent = Lang.get('checkUpdatesButton');
        document.getElementById('logo').alt = Lang.get('logoAltText');
    }

});