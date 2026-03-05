let currentSummaryRequestId = null;
let isSummaryGenerating = false;
let summaryAbortController = null;
let selectedDocumentId = null;
const summaryModelCapabilityCache = new Map();
let documentProcessingState = {
    isProcessing: false,
    currentProgress: 0,
    statusMessage: '',
    isPaused: false,
    originalStatusMessage: '',
    filesBeingProcessed: [],
    startTime: null
};
let documentUIElements = {
    uploadZone: null,
    fileInput: null,
    progressContainer: null,
    progressBar: null,
    progressStatus: null,
    documentsList: null,
    documentSort: null,
    hashedMasterKey: null,
    initialized: false
};

async function modelSupportsSummaryGeneration(model) {
    if (!model) {
        return null;
    }

    if (summaryModelCapabilityCache.has(model)) {
        return summaryModelCapabilityCache.get(model);
    }

    try {
        const response = await fetch('http://localhost:11434/api/show', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, name: model })
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const capabilities = Array.isArray(data?.capabilities)
            ? data.capabilities.map(entry => String(entry).toLowerCase())
            : [];

        // Empty capability list means unknown support, so avoid blocking in that case.
        if (capabilities.length === 0) {
            return null;
        }

        const supportsGeneration =
            capabilities.includes('completion') ||
            capabilities.includes('generate') ||
            capabilities.includes('chat');

        summaryModelCapabilityCache.set(model, supportsGeneration);
        return supportsGeneration;
    } catch (_error) {
        return null;
    }
}

// Ensures the documents table exists in the database for the given master key
async function ensureDocumentsTableExists(hashedMasterKey) {
    //console.log('RAG_Utils: Ensuring documents table exists for masterkey:', hashedMasterKey);

    try {
        if (!RAG) {
            console.error('RAG_Utils: RAG module not available');
            return false;
        }

        // Get metadata DB only
        const db = await PaiperworkDB.getDatabase(hashedMasterKey);
        if (!db) {
            console.error('RAG_Utils: Database not available');
            return false;
        }

        // Check if table exists first
        let tableExists = false;
        try {
            const result = db.exec(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='documents_${hashedMasterKey}'
            `);
            tableExists = result && result.length > 0 && result[0]?.values.length > 0;
            //console.log(`RAG_Utils: Table documents_${hashedMasterKey} exists:`, tableExists);
        } catch (error) {
            console.error('RAG_Utils: Error checking if table exists:', error);
        }

        //console.log('RAG_Utils: Creating documents table for masterkey:', hashedMasterKey);

        // Create the documents table using the retrieved database WITH DOCUMENT_ PREFIX
        db.exec(`
            CREATE TABLE IF NOT EXISTS documents_${hashedMasterKey} (
                document_id TEXT PRIMARY KEY,
                document_name TEXT NOT NULL,
                document_metadata TEXT,
                date_added TEXT,
                embedding_status TEXT DEFAULT 'processing',
                total_chunks INTEGER DEFAULT 0
            )
        `);

        // Save metadata DB changes
        await PaiperworkDB.saveToStorage(db.export(), hashedMasterKey);

        //console.log('RAG_Utils: Document tables created or verified successfully');
        return true;

    } catch (error) {
        console.error('RAG_Utils: Error creating document tables:', error);
        return false;
    }
}

// Builds the system prompt for document analysis mode
async function buildDocumentSystemPrompt() {
    return `You are a document analysis assistant focusing exclusively on the provided document content.

    IMPORTANT: Base your responses ONLY on the document excerpts provided - never introduce external information.
    
    Guidelines:
    1. Analyze only the document content in your response
    2. Answer the user's query directly and concisely
    3. When citing information, mention document names and page numbers where available
    4. If the documents don't contain sufficient information to answer, clearly acknowledge this limitation
    5. Maintain objectivity in your analysis
    6. Organize information logically when providing multiple points`;
}

// Initializes the document UI and sets up event handlers
function initializeDocumentUI() {
    //console.log('RAG_Utils: initializeDocumentUI called');

    // Get the current masterkey hash
    documentUIElements.hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
    //console.log('RAG_Utils: hashedMasterKey retrieved:', documentUIElements.hashedMasterKey);

    // If no masterkey hash, we can't set up the documents tab properly
    if (!documentUIElements.hashedMasterKey) {
        console.error('RAG_Utils: No masterkey hash found in localStorage');
        return;
    }

    // Migrate plaintext ragQuestioningDocumentName to encrypted storage if present
    (async () => {
        try {
            await PaiperworkDB.migratePlaintextLocalStorageKeyToEncrypted('ragQuestioningDocumentName');
        } catch (err) {
            console.error('Migration of ragQuestioningDocumentName failed:', err);
        }
    })();

    const documentsTab = document.getElementById('documents-tab');
    //console.log('RAG_Utils: documents-tab element found:', !!documentsTab);

    if (!documentsTab) {
        console.error('RAG_Utils: documents-tab element not found');
        return;
    }
    // Add explicit progress bar styles first
    addProgressBarStyles();
    // Set up the document UI structure first
    setupDocumentUI(documentsTab);

    // Now get UI elements after the structure is created
    documentUIElements.uploadZone = document.getElementById('document-upload-zone');
    documentUIElements.fileInput = document.getElementById('file-input');
    documentUIElements.progressContainer = document.getElementById('upload-progress');
    documentUIElements.progressBar = document.getElementById('progress-bar-fill');
    documentUIElements.progressStatus = document.getElementById('progress-status');
    documentUIElements.documentsList = document.getElementById('documents-list');

    /*//console.log('RAG_Utils: UI elements found:', {
    uploadZone: !!documentUIElements.uploadZone,
        fileInput: !!documentUIElements.fileInput,
        documentsList: !!documentUIElements.documentsList
    });*/

    // Early return if required elements aren't found
    if (!documentUIElements.uploadZone || !documentUIElements.fileInput) {
        console.error('RAG_Utils: Essential UI elements not found after setup');
        return;
    }

    // Set up drag and drop events
    setupDragAndDrop();

    // Handle browse button click
    const browseText = documentUIElements.uploadZone.querySelector('.browse-text');
    if (browseText) {
        browseText.addEventListener('click', () => {
            documentUIElements.fileInput.click();
        });
        //console.log('RAG_Utils: Browse button click handler attached');
    }

    // Handle file selection via input
    documentUIElements.fileInput.addEventListener('change', () => {
        //console.log('RAG_Utils: File input change detected');
        handleFiles(documentUIElements.fileInput.files);
    });




    // Automatically load documents list when the tab is shown
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            if (e.currentTarget.getAttribute('data-tab') === 'documents-tab') {
                //console.log('RAG_Utils: Documents tab clicked, loading documents');
                // Small delay to ensure UI is ready
                setTimeout(() => {
                    // Check if we're processing and restore that state if needed
                    if (documentProcessingState.isProcessing) {
                        restoreProcessingState();
                    } else {
                        updateDocumentsList(true);
                    }
                }, 100);
            }
        });
    });

    // Also check processing state immediately if we're already on the documents tab
    if (document.querySelector('.tab-button[data-tab="documents-tab"].active')) {
        //console.log('RAG_Utils: Documents tab is already active');
        // Small delay to ensure UI is fully initialized
        setTimeout(() => {
            if (documentProcessingState.isProcessing) {
                restoreProcessingState();
            } else {
                updateDocumentsList(true);
            }
        }, 300);
    }

    //console.log('RAG_Utils: Document initialization complete');
    documentUIElements.initialized = true;
}

// Sets up the HTML structure for the documents tab UI
function setupDocumentUI(documentsTab) {
    //console.log('RAG_Utils: Setting up document UI structure');

    // Clear out any existing content first
    documentsTab.innerHTML = `
    <div class="documents-area" style="max-width: 360px; margin: 0 auto; padding: 16px; box-sizing: border-box;">
                <div class="document-search-info" style="margin-bottom: 20px; padding: 12px; background: var(--accent-color, #4f46e5); color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <div style="font-size: 24px; margin-top: 2px;"><i class="fa-solid fa-circle-info"></i></div>
                <div>
                    <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${Lang.get('documentSearchEnabled') || 'Document Search Enabled'}</h3>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">
                        ${Lang.get('documentSearchInfo') || 'While in this tab, the main prompt will search across all your documents.'}
                    </p>
                    <p style="margin: 5px 0 0 0; font-size: 13px; font-style: italic;">
                        ${Lang.get('documentSpecificInfo') || 'If you select a specific document for questioning, that will take priority.'}
                    </p>
                </div>
            </div>
        </div>
    <div class="upload-zone" id="document-upload-zone" style="width: calc(100% - 80px); padding: 20px;">
            <div class="upload-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4v12m0-12l-4 4m4-4l4 4m-10 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="upload-text" style="font-size: 14px;">
                <p>${Lang.get('ragDragDropText')}</p>
                <p><span class="browse-text" style="color: #4f46e5; text-decoration: underline; cursor: pointer;">${Lang.get('ragBrowseFiles')}</span></p>
            </div>
            <input type="file" id="file-input" multiple accept=".pdf,.txt" style="display: none;">
        </div>
        
        <div class="upload-progress" id="upload-progress" style="display: none;">
            <div class="progress-bar-container" style="height: 6px; background-color: #e0e0e0; border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
                <div class="progress-bar-fill" id="progress-bar-fill" style="height: 100%; background-color: #4f46e5; width: 0%; transition: width 0.3s ease;"></div>
            </div>
            <div class="progress-status" id="progress-status">${Lang.get('ragProcessingStatus')}</div>
        </div>
        
        <div class="documents-list-container">
            <div class="documents-list" id="documents-list">
            </div>
        </div>
    </div>
`;

    //console.log('RAG_Utils: Document UI structure setup complete');
}

// Sets up drag and drop functionality for the upload zone
function setupDragAndDrop() {
    const { uploadZone } = documentUIElements;
    if (!uploadZone) return;

    // Prevent default behaviors for all drag events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop zone when file is dragged over - but only if zone is visible
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            // Only add highlight if the upload zone is currently visible
            if (uploadZone.style.display !== 'none') {
                uploadZone.classList.add('highlight');
            }
        });
    });

    // Remove highlight when file leaves the drop zone or is dropped
    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.classList.remove('highlight');
        });
    });

    // Handle file drop - only if upload zone is visible (not during processing)
    uploadZone.addEventListener('drop', (e) => {
        if (uploadZone.style.display !== 'none' &&
            documentUIElements.progressContainer.style.display === 'none') {
            handleFiles(e.dataTransfer.files);
        } else {
            //console.log('RAG_Utils: Document processing in progress, drop ignored');
        }
    });

    uploadZone.addEventListener('click', (e) => {
        // Only trigger file input if the upload zone is visible and not processing
        if (uploadZone.style.display !== 'none' &&
            documentUIElements.progressContainer.style.display === 'none') {
            documentUIElements.fileInput.click();
        }
    });
    const browseText = uploadZone.querySelector('.browse-text');
    if (browseText) {
        browseText.addEventListener('click', (e) => {
            // Stop propagation to prevent double triggering
            e.stopPropagation();
            // Trigger file input
            documentUIElements.fileInput.click();
        });
        //console.log('RAG_Utils: Browse text click handler attached');
    } else {
        console.error('RAG_Utils: Browse text element not found');
    }
}

// Handles files dropped or selected for upload and processing
async function handleFiles(files) {
    if (!files || !files.length) return;

    const { uploadZone, progressContainer, progressStatus, hashedMasterKey } = documentUIElements;
    if (!uploadZone || !progressContainer) return;

    // Check if model is selected
    const modelSelector = document.getElementById('model-selector');
    if (!modelSelector?.value) {
        alert(Lang.get('ragModelSelect'));
        return;
    }

    // Filter to only PDF and TXT files
    const validFiles = Array.from(files).filter(file =>
        file.type === 'application/pdf' || file.type === 'text/plain'
    );

    if (validFiles.length === 0) {
        alert(Lang.get('ragFileType'));
        return;
    }

    // Show progress UI and hide upload zone
    uploadZone.style.display = 'none';
    progressContainer.style.display = 'block';

    // Reset progress bar
    const progressBarFill = document.getElementById('progress-bar-fill');
    if (progressBarFill) {
        progressBarFill.style.width = '0%';
        progressBarFill.style.backgroundColor = '#4f46e5';
        progressBarFill.style.transition = 'width 0.3s ease';
        progressBarFill.style.height = '100%';
    }

    // Show initial status
    if (progressStatus) {
        progressStatus.textContent = Lang.get('ragPreprocessingFiles') || 'Checking files for text content...';
    }

    // Initialize filesToProcess
    let filesToProcess = [];

    try {
        // Check PDF files for text content before processing
        let emptyPdfFiles = [];

        for (const file of validFiles) {
            if (file.type === 'application/pdf') {
                // Show checking status for current file
                if (progressStatus) {
                    progressStatus.textContent = Lang.get('ragCheckingFile', { filename: file.name }) ||
                        `Checking ${file.name} for text content...`;
                }

                const hasText = await checkPdfForText(file);
                if (hasText) {
                    filesToProcess.push(file);
                } else {
                    emptyPdfFiles.push(file.name);
                }
            } else {
                // TXT files always have text, add them directly
                filesToProcess.push(file);
            }
        }

        // If we found empty PDFs, show warning
        if (emptyPdfFiles.length > 0) {
            const warningMsg = emptyPdfFiles.length === 1
                ? Lang.get('ragEmptyPdfSingle', { filename: emptyPdfFiles[0] }) ||
                `The file "${emptyPdfFiles[0]}" appears to contain no extractable text (possibly only images). It cannot be processed.`
                : Lang.get('ragEmptyPdfMultiple', { count: emptyPdfFiles.length }) ||
                `${emptyPdfFiles.length} files contain no extractable text (possibly only images) and cannot be processed.`;

            // Show warning in UI
            showNotification(warningMsg);
            console.warn('Empty PDF files detected:', emptyPdfFiles);

            // If all files were empty, reset UI and return
            if (filesToProcess.length === 0) {
                uploadZone.style.display = 'flex';
                progressContainer.style.display = 'none';
                if (documentUIElements.fileInput) documentUIElements.fileInput.value = '';
                return;
            }
        }
    } catch (error) {
        // Handle any errors in PDF checking
        console.error('Error checking PDF text content:', error);
        showNotification(Lang.get('ragPdfCheckError') || 'Error checking PDF content');

        // Continue with all valid files as if they have text
        filesToProcess = validFiles;
    }

    // Update global processing state
    documentProcessingState.isProcessing = true;
    documentProcessingState.currentProgress = 0;
    documentProcessingState.statusMessage = Lang.get('ragProcessingStatus');
    documentProcessingState.filesBeingProcessed = filesToProcess.map(f => f.name);
    documentProcessingState.startTime = Date.now();
    documentProcessingState.isPaused = false;
    documentProcessingState.originalStatusMessage = '';

    // Set up pause state monitoring with a global reference
    if (window.documentPauseStateInterval) {
        clearInterval(window.documentPauseStateInterval);
    }
    window.documentPauseStateInterval = setInterval(updateDocumentProcessingPauseState, 500);

    // Show progress UI and hide upload zone
    uploadZone.style.display = 'none';
    progressContainer.style.display = 'block';

    // Get a direct reference to the progress bar element
    if (progressBarFill) {
        progressBarFill.style.width = '0%';
        // Make sure the progress bar fill has the right color
        progressBarFill.style.backgroundColor = '#4f46e5'; // Accent color
        progressBarFill.style.transition = 'width 0.3s ease';
        progressBarFill.style.height = '100%';
        //console.log('Progress bar reset to 0% and styled properly');
    }

    try {
        // Disable all document-related UI during processing to prevent multiple uploads
        const uploadButton = document.getElementById('load-documents-button');
        if (uploadButton) uploadButton.disabled = true;

        if (progressStatus) {
            progressStatus.textContent = Lang.get('ragProcessingStatus');
        }

        // Get current model to use for embeddings
        const currentModel = modelSelector.value;
        //console.log('Using model for document processing:', currentModel);

        // Process the files - pass the current model
        await RAG.processDocuments(filesToProcess, hashedMasterKey, (progress, status) => {
            //console.log(`Progress callback received:`, progress, status);

            // Update global state
            documentProcessingState.currentProgress = progress;
            if (status) documentProcessingState.statusMessage = status;

            if (progress !== null && progress !== undefined) {
                // Convert progress to percentage and update the progress bar width
                const percentComplete = Math.round(progress * 100);
                //console.log(`Converting progress ${progress} to ${percentComplete}%`);

                // Force DOM update with requestAnimationFrame for smoother updates
                requestAnimationFrame(() => {
                    const progressBarElement = document.getElementById('progress-bar-fill');
                    if (progressBarElement) {
                        progressBarElement.style.width = `${percentComplete}%`;
                        //console.log(`Set progress bar width to ${percentComplete}%`);

                        // Check if processing is now complete
                        if (percentComplete === 100) {
                            documentProcessingState.statusMessage = Lang.get('ragDocumentsProcessed');
                            if (progressStatus) {
                                progressStatus.textContent = Lang.get('ragDocumentsProcessed');
                            }
                        }
                    }
                });
            }

            // Only update status message if not paused by AI
            if (status && progressStatus && !documentProcessingState.isPaused) {
                progressStatus.textContent = status;
                //console.log('Updated status text:', status);
            }
        }, currentModel);

        //console.log('Document processing completed successfully');

        const wasProcessing = documentProcessingState.isProcessing;
        documentProcessingState.isProcessing = false;

        await new Promise(resolve => setTimeout(resolve, 300));
        // Update the documents list
        await updateDocumentsList(true);

        documentProcessingState.isProcessing = wasProcessing;

        // Show success message
        if (progressStatus) {
            progressStatus.textContent = Lang.get('ragDocumentsProcessed');
            const finalProgressBar = document.getElementById('progress-bar-fill');
            if (finalProgressBar) {
                finalProgressBar.style.width = '100%';
                //console.log('Set final progress to 100%');
            }
        }
    } catch (error) {
        console.error('Error processing documents:', error);
        if (progressStatus) {
            progressStatus.textContent = Lang.get('ragProcessingError');
        }
    } finally {
        // Clear any pause state monitoring interval
        if (window.documentPauseStateInterval) {
            clearInterval(window.documentPauseStateInterval);
            window.documentPauseStateInterval = null;
        }

        // Re-enable the upload button if it exists
        const uploadButton = document.getElementById('load-documents-button');
        if (uploadButton) uploadButton.disabled = false;

        // Reset UI after a delay - show upload zone again
        setTimeout(() => {
            uploadZone.style.display = 'flex';
            progressContainer.style.display = 'none';
            if (documentUIElements.fileInput) documentUIElements.fileInput.value = '';

            // Reset processing state
            documentProcessingState.isProcessing = false;
            documentProcessingState.isPaused = false;
        }, 2000);
        setTimeout(async () => {
            if (document.querySelector('.tab-button[data-tab="documents-tab"].active')) {
                //console.log('Documents tab still active, doing final refresh');
                await updateDocumentsList(true);
            }
        }, 2500);
    }
}

// Checks if a PDF file contains extractable text
async function checkPdfForText(file) {
    try {
        // Use pdf.js to check for text content
        const arrayBuffer = await file.arrayBuffer();
        const pdfLoadOptions = { data: arrayBuffer };
        if (window.pdfjsLib?.VerbosityLevel && typeof window.pdfjsLib.VerbosityLevel.ERRORS !== 'undefined') {
            pdfLoadOptions.verbosity = window.pdfjsLib.VerbosityLevel.ERRORS;
        }
        const pdf = await pdfjsLib.getDocument(pdfLoadOptions).promise;

        // Check first 3 pages or all pages if less than 3
        const maxPagesToCheck = Math.min(3, pdf.numPages);
        let totalTextLength = 0;

        for (let i = 1; i <= maxPagesToCheck; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            totalTextLength += pageText.trim().length;

            // If we found a decent amount of text, no need to check more pages
            if (totalTextLength > 50) {
                return true;
            }
        }

        // If we checked all sample pages and found very little or no text
        return totalTextLength > 10;
    } catch (error) {
        console.error('Error checking PDF for text:', error);
        // If there's an error in detection, assume it has text to avoid false negatives
        return true;
    }
}

// Updates the documents list UI with current document metadata
async function updateDocumentsList(forceReload = false) {
    //console.log('RAG_Utils: Updating documents list (metadata only)');
    const { hashedMasterKey, documentsList, documentSearch } = documentUIElements;
    if (!documentsList) return;
    // Check if we're in the middle of processing documents
    if (documentProcessingState.isProcessing) {
        //console.log('Document processing in progress, restoring processing UI');
        restoreProcessingState();
        return;
    }

    // Show loading state
    documentsList.innerHTML = `<div class="loading-indicator">${Lang.get('ragLoadingDocuments')}</div>`;

    try {
        // Check if RAG exists
        if (!window.RAG) {
            throw new Error('RAG module not available');
        }
        // Ensure tables exist before attempting to query
        const tablesCreated = await ensureDocumentsTableExists(hashedMasterKey);
        if (!tablesCreated) {
            documentsList.innerHTML = `
            <div class="empty-state">
                <p>${Lang.get('ragErrorStorage')}</p>
            </div>
        `;
            return;
        }

        // Get only document metadata (no embeddings/chunks)
        let documents;
        let db;
        try {
            // Get database directly for a lightweight query
            db = await PaiperworkDB.getDatabase(hashedMasterKey);

            // Query just document metadata (no joins with chunks)
            const result = db.exec(`
                SELECT document_id, document_name, document_metadata, 
                       date_added, embedding_status, total_chunks
                FROM documents_${hashedMasterKey}
                ORDER BY date_added DESC
            `);

            // Don't try to release the database - just continue
            // Instead, we'll save any changes at the end if needed

            // Map results to document objects
            documents = [];
            if (result && result.length > 0 && result[0].values) {
                for (const [id, encName, encMetadata, dateAdded, status, totalChunks] of result[0].values) {
                    try {
                        const name = await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encName));
                        const metadata = JSON.parse(await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encMetadata)));
                        documents.push({
                            id,
                            name,
                            metadata,
                            dateAdded,
                            status,
                            totalChunks
                        });
                    } catch (err) {
                        console.error('Error decrypting document metadata:', err);
                    }
                }
            }
        } catch (error) {
            console.error('RAG_Utils: Error loading document metadata:', error);
            documentsList.innerHTML = `
            <div class="empty-state">
                <p>${Lang.get('ragLoadingError', { error: error.message })}</p>
            </div>
        `;
            return;
        }

        // Update UI - show empty state if no documents
        if (!documents || documents.length === 0) {
            documentsList.innerHTML = `
                <div class="empty-state">
                   <p>${Lang.get('ragNoDocuments')}</p>
                    <p>${Lang.get('ragUploadPrompt')}</p>
                </div>
            `;
            selectedDocumentId = null;
            // Remove any existing selection panel
            removeSelectionPanel();
            return;
        }

        //console.log(`RAG_Utils: Found ${documents.length} documents (metadata only)`);

        // Render document list with updated layout
        try {
            // When rendering the document list, add the selected class if applicable
            documentsList.innerHTML = documents.map(doc => {
                // Get page count if available (for PDFs)
                const pageCount = doc.metadata?.pageCount ?
                    `<span class="document-pages"><strong>${Lang.get('ragDocumentSectionPages', { count: doc.metadata.pageCount })}</strong></span>` : '';

                // Format filename for display - keep original for search but limit display length
                const displayName = doc.name || Lang.get('ragDocumentSectionUntitled');

                // Check if this document is selected
                const isSelected = doc.id === selectedDocumentId;
                const selectedClass = isSelected ? 'selected' : '';

                // Fix date formatting - ensure it's a valid date first
                let formattedDate = 'Unknown';
                try {
                    if (doc.dateAdded) {
                        //console.log('Raw dateAdded:', doc.dateAdded); // Debug log

                        // Try to handle different date formats
                        let dateObj;

                        // If it's already a Date object
                        if (doc.dateAdded instanceof Date) {
                            dateObj = doc.dateAdded;
                        }
                        // If it's a timestamp number or string number
                        else if (!isNaN(Number(doc.dateAdded))) {
                            dateObj = new Date(Number(doc.dateAdded));
                        }
                        // If it's a JSON string representation of a date
                        else if (typeof doc.dateAdded === 'string') {
                            // Try direct parsing first
                            dateObj = new Date(doc.dateAdded);

                            // If that fails, try to extract timestamp from string
                            if (isNaN(dateObj.getTime())) {
                                // Look for a timestamp in the string
                                const match = doc.dateAdded.match(/(\d{13}|\d{10})/);
                                if (match) {
                                    const timestamp = match[0];
                                    dateObj = new Date(timestamp.length === 10 ? Number(timestamp) * 1000 : Number(timestamp));
                                }
                            }
                        }

                        // Format the date if we have a valid date object
                        if (dateObj && !isNaN(dateObj.getTime())) {
                            formattedDate = dateObj.toLocaleDateString();
                        } else {
                            // Use a current date if all else fails
                            formattedDate = new Date().toLocaleDateString();
                        }
                    }
                } catch (e) {
                    console.error('Error formatting date:', e);
                    // Default to current date if there's an error
                    formattedDate = new Date().toLocaleDateString();
                }

                return `
                <div class="document-item ${selectedClass}" data-id="${doc.id}">
                    <div class="document-info">
                        <h4 class="document-title" title="${displayName}">${displayName}</h4>
                        <div class="document-metadata">
                            <span class="document-author"><strong>${Lang.get('ragDocumentSectionAuthor', { author: doc.metadata?.author || 'Unknown' })}</strong></span>
                            <span class="document-date"><strong>${Lang.get('ragDocumentSectionAdded', { date: formattedDate })}</strong></span>
                            ${pageCount}
                            <span class="document-chunks"><strong>${Lang.get('ragDocumentSectionChunks', { count: doc.totalChunks || 0 })}</strong></span>
                        </div>
                    </div>
                    <div class="document-actions">
                        <div class="status-container">
                            ${doc.status === 'processing' ?
                        '<span class="status-badge processing">Processing</span>' :
                        '<span class="status-badge completed">Indexed</span>'
                    }
                            <button class="delete-document" data-id="${doc.id}">Delete</button>
                        </div>
                    </div>
                </div>
                `;
            }).join('');

            // Remove any existing selection panel before potentially adding a new one
            removeSelectionPanel();

            // Add selected document actions panel if a document is selected
            if (selectedDocumentId) {
                addSelectionPanel(documentsList, documents);
            }

            // Replace the click handler logic for document items
            documentsList.querySelectorAll('.document-item').forEach(item => {
                item.addEventListener('click', async (e) => {
                    // Check if user is selecting text - if so, don't do anything
                    const selection = window.getSelection();
                    if (selection.toString().length > 0) {
                        return; // User is selecting text, don't interfere
                    }

                    // Check if clicked on delete button - if so, don't do selection
                    if (e.target.closest('.delete-document')) {
                        return; // Clicked on delete button, handled by other event listener
                    }

                    const documentId = item.getAttribute('data-id');

                    // Toggle selection
                    if (selectedDocumentId === documentId) {
                        // Deselect if clicking the same document again
                        selectedDocumentId = null;

                        // Remove the selection panel when deselecting
                        removeSelectionPanel();

                        // Update just the selection status without full reload
                        item.classList.remove('selected');

                        // Also exit document questioning mode if it's active for this document
                        const activeDocumentId = localStorage.getItem('ragQuestioningDocumentId');
                        if (activeDocumentId === documentId) {
                            exitDocumentQuestioningMode();
                        }
                    } else {
                        // Deselect any previously selected document
                        documentsList.querySelectorAll('.document-item.selected').forEach(
                            selected => selected.classList.remove('selected')
                        );

                        // Select this document
                        selectedDocumentId = documentId;
                        item.classList.add('selected');

                        // If there was any document mode active for another document, exit it
                        const activeDocumentId = localStorage.getItem('ragQuestioningDocumentId');
                        if (activeDocumentId && activeDocumentId !== documentId) {
                            exitDocumentQuestioningMode();
                        }

                        // Add the selection panel for the newly selected document
                        addSelectionPanel(documentsList, documents);
                    }
                });
            });
            documentsList.querySelectorAll('.delete-document').forEach(button => {
                button.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const documentId = button.getAttribute('data-id');
                    if (!documentId) return;

                    // Show confirmation dialog
                    if (confirm(Lang.get('ragDeleteConfirm'))) {
                        try {
                            // Show loading state on the button
                            const originalText = button.textContent;
                            button.textContent = Lang.get('ragDeleting');
                            button.disabled = true;

                            // Call RAG's deleteDocument method
                            const success = await RAG.deleteDocument(documentId, hashedMasterKey);

                            if (success) {
                                // If the deleted document was selected, clear selection
                                if (documentId === selectedDocumentId) {
                                    selectedDocumentId = null;
                                    removeSelectionPanel();
                                }

                                // Refresh the document list to reflect the deletion
                                updateDocumentsList(true);
                                showNotification(Lang.get('ragDeleteSuccess'));
                            } else {
                                // Restore button state if deletion failed
                                button.textContent = originalText;
                                button.disabled = false;
                                showNotification(Lang.get('ragDeleteFailed'));
                            }
                        } catch (error) {
                            console.error('Error deleting document:', error);
                            showNotification(Lang.get('ragDeleteError', { error: error.message }));
                            button.textContent = Lang.get('ragDocumentSectionDelete');
                            button.disabled = false;
                        }
                    }
                });
            });
        } catch (renderError) {
            console.error('RAG_Utils: Error rendering document list:', renderError);
            documentsList.innerHTML = `
            <div class="empty-state">
                <p>${Lang.get('ragDisplayError', { error: renderError.message })}</p>
            </div>
        `;
        }
    } catch (error) {
        console.error('RAG_Utils: Error updating documents list:', error);
        documentsList.innerHTML = `
    <div class="empty-state">
        <p>${Lang.get('ragLoadingError', { error: error.message })}</p>
    </div>
`;
    }
}

// Removes the selected document actions panel from the UI
function removeSelectionPanel() {
    const existingPanel = document.querySelector('.selected-document-actions');
    if (existingPanel) {
        existingPanel.remove();
    }

    // If we are removing selection, also check if we need to disable document mode
    if (!selectedDocumentId) {
        const activeDocumentId = localStorage.getItem('ragQuestioningDocumentId');
        if (activeDocumentId) {
            // Get the button element from the document mode indicator
            const exitButton = document.querySelector('.exit-questioning');
            if (exitButton) {
                // Simulate clicking the exit button to ensure proper cleanup
                exitButton.click();
            } else {
                // No button found, manually exit document mode
                exitDocumentQuestioningMode();
            }
        }
    }
}

// Helper function to show notifications with proper function name
function showNotification(message) {
    // Check if notification element exists, create if not
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #10B981;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(notification);
    }

    // Set message and show
    notification.textContent = message;
    notification.style.opacity = '1';

    // Hide after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 5000);
}

// Helper function to add the selection panel
function addSelectionPanel(documentsList, documents) {
    // First, remove any existing panel
    removeSelectionPanel();

    // Find the selected document
    const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
    if (!selectedDoc) {
        // Document not found - clear selection
        selectedDocumentId = null;
        return;
    }

    const actionsPanel = document.createElement('div');
    actionsPanel.className = 'selected-document-actions';
    actionsPanel.innerHTML = `
        <div class="selected-document-info">
            <span>${Lang.get('ragDocumentSelected')}</span>
            <button id="deselect-document">${Lang.get('ragDocumentDeselect')}</button>
        </div>
        <div class="selected-document-buttons">
            <button id="generate-summary" class="primary-action">${Lang.get('ragDocumentGenerateSummary')}</button>
            <button id="ask-document" class="secondary-action">${Lang.get('ragDocumentAskQuestions')}</button>
        </div>
    `;
    documentsList.parentNode.insertBefore(actionsPanel, documentsList);

    // Add event listeners for the action buttons
    document.getElementById('deselect-document').addEventListener('click', () => {
        // Clear selection
        selectedDocumentId = null;
        // Remove selection styling from any selected document
        document.querySelectorAll('.document-item.selected').forEach(
            item => item.classList.remove('selected')
        );
        // Remove the panel
        removeSelectionPanel();
    });

    document.getElementById('generate-summary').addEventListener('click', async () => {
        await showDocumentSummary(selectedDocumentId, selectedDoc.name, sessionStorage.getItem('hashedMasterKey'));
    });

    document.getElementById('ask-document').addEventListener('click', () => {
        enableDocumentQuestioningMode(selectedDocumentId);
    });
}

// Update the enableDocumentQuestioningMode function to handle UI positioning properly
function enableDocumentQuestioningMode(documentId) {
    //console.debug('[documents_tab] enableDocumentQuestioningMode called for documentId:', documentId);

    // Ensure the Documents tab is currently active - only allow document mode from Documents tab
    try {
        const activeTab = document.querySelector('.tab-button.active')?.getAttribute('data-tab') || document.querySelector('.tab-button[data-tab="documents"].active')?.getAttribute('data-tab');
        if (activeTab !== 'documents' && activeTab !== 'documents-tab') {
            showNotification(Lang.get('ragDocumentModeOnlyOnDocuments') || 'Document mode can only be enabled from the Documents tab.');
            return;
        }
    } catch (err) {
        // If any error occurs while checking tab state, log but continue - we'll still attempt to enable
        console.error('Could not determine active tab when enabling document questioning mode:', err);
    }

    // Check if we're already in document mode for this document
    const activeDocumentId = localStorage.getItem('ragQuestioningDocumentId');
    if (activeDocumentId === documentId) {
        //console.debug('[documents_tab] enableDocumentQuestioningMode - already active for this document:', documentId);
        return;
    }

    // If we're in document mode for a different document, exit it first
    if (activeDocumentId) {
        exitDocumentQuestioningMode();
    }

    // Use a self-executing async function to handle the async operations
    (async () => {
        try {
            // Get the masterkey hash
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            if (!hashedMasterKey) {
                console.error('No masterkey hash found in localStorage');
                return;
            }

            // Get database connection
            const db = await PaiperworkDB.getDatabase(hashedMasterKey);
            if (!db) {
                console.error('Could not connect to database');
                return;
            }

            // Query the document info
            const result = db.exec(`
                SELECT document_name
                FROM documents_${hashedMasterKey}
                WHERE document_id = ?
            `, [documentId]);

            // Check if document was found
            if (!result || result.length === 0 || !result[0].values || !result[0].values.length === 0) {
                console.error('Document not found in database:', documentId);
                return;
            }

            // Decrypt the document name
            const encName = result[0].values[0][0];
            const docName = await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encName));

            // Store document info for chat (encrypt the document name)
            try {
                localStorage.setItem('ragQuestioningDocumentId', documentId);
                await PaiperworkDB.secureLocalStorageSet('ragQuestioningDocumentName', docName);
            } catch (err) {
                // Fallback to plain localStorage if secure storage fails
                console.error('Could not securely store ragQuestioningDocumentName, falling back to plain localStorage', err);
                localStorage.setItem('ragQuestioningDocumentId', documentId);
                localStorage.setItem('ragQuestioningDocumentName', docName);
            }

            // Ensure document mode styles are available
            addDocumentModeStyles();

            // Add a notification explaining the mode
            setTimeout(() => {
                showNotification(
                    `${Lang.get('ragDocumentModeEnabled') || 'Document questioning mode enabled.'} 
            ${Lang.get('ragDocumentModePriority') || 'This will take priority even when in Documents tab.'}`
                );
            }, 500);
            // Disable the "Ask Questions" button for this document until document mode is exited
            // This prevents users from enabling document mode multiple times for the same document
            const askDocumentButton = document.getElementById('ask-document');
            if (askDocumentButton) {
                askDocumentButton.disabled = true;
                askDocumentButton.textContent = Lang.get('ragDocumentModeEnabled');
                askDocumentButton.style.opacity = '0.6';
                askDocumentButton.style.cursor = 'not-allowed';
            }

            // Add a visual highlight to the Chat tab to guide the user
            const chatTab = document.querySelector('.tab-button[data-tab="chat"]');
            if (chatTab) {
                chatTab.classList.add('highlight-tab');
                setTimeout(() => {
                    chatTab.classList.remove('highlight-tab');
                }, 3000);
            }

            // Find the chat interface where we'll add the green bar
            const chatContainer = document.querySelector('.chat-container');
            const progressBar = document.getElementById('progress-bar');

            if (chatContainer) {
                // Add class to chat container to reposition other elements
                document.body.classList.add('document-questioning-active');

                // Create the document questioning indicator
                const indicator = document.createElement('div');
                indicator.className = 'document-questioning-indicator';
                indicator.id = 'document-mode-indicator';

                indicator.innerHTML = `
                    <div class="document-questioning-info">
                        <div class="mode-indicator document-mode">
                            <span class="mode-icon">📄</span>
                            <span class="mode-label">${Lang.get('ragDocumentModeLabel')}</span>
                        </div>
                        <div class="document-details">
                            <span class="document-name" title="${docName}">${Lang.get('ragDocumentModeAsking', { document: docName })}</span>
                            <button class="exit-questioning">${Lang.get('ragDocumentModeExit')}</button>
                        </div>
                    </div>
                `;
                // Insert right after the progress bar
                if (progressBar && progressBar.nextSibling) {
                    chatContainer.insertBefore(indicator, progressBar.nextSibling);
                } else {
                    chatContainer.insertBefore(indicator, chatContainer.firstChild);
                }

                // Add event listener to exit button
                indicator.querySelector('.exit-questioning').addEventListener('click', () => {
                    exitDocumentQuestioningMode();
                });

                // Update input placeholder if it exists
                const promptInput = document.getElementById('prompt-input');
                if (promptInput) {
                    const originalPlaceholder = promptInput.getAttribute('data-original-placeholder') ||
                        promptInput.getAttribute('placeholder') ||
                        Lang.get('ragPromptDefault');

                    // Save original placeholder if not already saved
                    if (!promptInput.getAttribute('data-original-placeholder')) {
                        promptInput.setAttribute('data-original-placeholder', originalPlaceholder);
                    }

                    // Update placeholder
                    promptInput.setAttribute('placeholder', Lang.get('ragDocumentModePlaceholder', { document: docName }));
                }
            }

        } catch (error) {
            console.error('Error enabling document questioning mode:', error);
            showNotification(Lang.get('ragEnableError'));
        }
    })();

}

// Update the exitDocumentQuestioningMode function to match
function exitDocumentQuestioningMode() {
    //console.debug('[documents_tab] exitDocumentQuestioningMode called');

    // Get the currently active document ID before clearing
    const activeDocumentId = localStorage.getItem('ragQuestioningDocumentId');

    // Clear document mode data
    localStorage.removeItem('ragQuestioningDocumentId');
    // Removing the key is the same for both encrypted and plaintext storage
    localStorage.removeItem('ragQuestioningDocumentName');

    // Remove document questioning active class from body
    document.body.classList.remove('document-questioning-active');

    // Hide and remove the document questioning indicator
    const indicator = document.querySelector('.document-questioning-indicator');
    if (indicator) {
        // Add exit animation
        indicator.classList.add('fade-out');

        // Remove after animation completes
        setTimeout(() => {
            indicator.remove();
        }, 300);
    }

    // Re-enable the "Ask Questions" button if it exists
    const askDocumentButton = document.getElementById('ask-document');
    if (askDocumentButton) {
        askDocumentButton.disabled = false;
        askDocumentButton.textContent = Lang.get('ragDocumentAskQuestions');
        askDocumentButton.style.opacity = '1';
        askDocumentButton.style.cursor = 'pointer';
    }

    // Deselect the document card if we have an activeDocumentId
    if (activeDocumentId && selectedDocumentId === activeDocumentId) {
        // Find the selected document item by data-id attribute and remove selected class
        const selectedItem = document.querySelector(`.document-item[data-id="${activeDocumentId}"]`);
        if (selectedItem) {
            selectedItem.classList.remove('selected');
        }

        // Clear the selectedDocumentId variable
        selectedDocumentId = null;

        // Remove any selection panel if it exists
        removeSelectionPanel();
    }

    // Show confirmation notification
    showNotification(Lang.get('ragReturnToChat'));

    // Reset input placeholder back to default if needed
    const promptInput = document.getElementById('prompt-input');
    if (promptInput) {
        const originalPlaceholder = promptInput.getAttribute('data-original-placeholder');
        if (originalPlaceholder) {
            promptInput.setAttribute('placeholder', originalPlaceholder);
            promptInput.removeAttribute('data-original-placeholder');
        }
    }
}

function updateDocumentQuestioningUI() {
    // Check if we're in document questioning mode and currently in the chat tab
    const documentId = localStorage.getItem('ragQuestioningDocumentId');
    const isChatTabActive = document.querySelector('.tab-button[data-tab="chat-tab"].active') !== null;

    // Remove any existing indicator first for a clean state
    const existingIndicator = document.querySelector('.document-questioning-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    // If no document mode or not in chat tab, we're done early
    if (!documentId || !isChatTabActive) {
        return;
    }

    // We need to get the (possibly encrypted) document name asynchronously
    (async () => {
        let documentName;
        try {
            documentName = await PaiperworkDB.secureLocalStorageGet('ragQuestioningDocumentName');
        } catch (err) {
            console.error('Error loading secure ragQuestioningDocumentName, falling back to plain localStorage', err);
            documentName = localStorage.getItem('ragQuestioningDocumentName');
        }

        if (!documentName) return;

        // Find a good place to insert the indicator
        const insertionPoint = document.querySelector('.chat-interface') ||
            document.querySelector('.message-input-container')?.parentElement ||
            document.querySelector('.ai-replies')?.parentElement;

        if (!insertionPoint) {
            console.error('Could not find insertion point for document questioning indicator');
            return;
        }

        // Create the document questioning indicator
        const indicator = document.createElement('div');
        indicator.className = 'document-questioning-indicator';

        indicator.innerHTML = `
            <div class="document-questioning-info">
                <div class="mode-indicator document-mode">
                    <span class="mode-icon">📄</span>
                    <span class="mode-label">${Lang.get('ragDocumentModeLabel')}</span>
                </div>
                <div class="document-details">
                    <span class="document-name" title="${documentName}">${Lang.get('ragDocumentModeAsking', { document: documentName })}</span>
                    <button class="exit-questioning">${Lang.get('ragDocumentModeExit')}</button>
                </div>
            </div>
        `;

        // Insert at the beginning of the chat interface
        insertionPoint.insertBefore(indicator, insertionPoint.firstChild);

        // Update input placeholder if present
        const promptInput = document.getElementById('prompt-input');
        if (promptInput) {
            const originalPlaceholder = promptInput.getAttribute('data-original-placeholder') ||
                promptInput.getAttribute('placeholder') ||
                Lang.get('ragPromptDefault');

            // Save original placeholder if not already saved
            if (!promptInput.getAttribute('data-original-placeholder')) {
                promptInput.setAttribute('data-original-placeholder', originalPlaceholder);
            }

            // Update placeholder
            promptInput.setAttribute('placeholder', Lang.get('ragDocumentModePlaceholder', { document: documentName }));
        }

        // Add event listener to exit button
        indicator.querySelector('.exit-questioning').addEventListener('click', () => {
            exitDocumentQuestioningMode();
        });
    })();
}


async function expandQuery(query, model) {
    try {
        const enhancedSystemPrompt = "You are a search query expansion expert. Generate 3-5 alternative phrasings of the query that might better match text in documents. Return ONLY the alternative queries separated by '|' symbols without any other text.";

        const response = await OllamaAPI.sendToOllama(
            query,
            enhancedSystemPrompt,
            4096,
            null,
            null,
            `query_expansion_${Date.now()}`
        );

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let expansionText = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const data = JSON.parse(line);
                        if (data.response) {
                            expansionText += data.response;
                        }
                    } catch (error) {
                        console.error('Error parsing JSON line:', error);
                    }
                }
            }
        }

        expansionText = cleanThinkingContent(expansionText);

        // Extract alternative queries
        const alternativeQueries = expansionText.split('|')
            .map(q => q.trim())
            .filter(q => q && q !== query && !q.includes("Alternative") && !q.includes("Query"))
            .slice(0, 3);

        //console.log('Query expansion results:', alternativeQueries);

        // Return original query plus alternatives
        return [query, ...alternativeQueries];
    } catch (error) {
        console.error('Error expanding query:', error);
        return [query]; // Return original query if expansion fails
    }
}
function cleanThinkingContent(text) {
    if (!text) return text;

    // Define all possible thinking tag patterns
    const thinkPatterns = [
        /<think>[\s\S]*?<\/think>/gi,
        /<thinking>[\s\S]*?<\/thinking>/gi,
        /<reflection>[\s\S]*?<\/reflection>/gi,
        /<reasoning>[\s\S]*?<\/reasoning>/gi,
        /<cot>[\s\S]*?<\/cot>/gi
    ];

    // Remove all thinking sections
    let cleanedText = text;
    thinkPatterns.forEach(pattern => {
        cleanedText = cleanedText.replace(pattern, '');
    });

    // Trim whitespace and handle potential double spaces
    cleanedText = cleanedText.trim().replace(/\s+/g, ' ');

    // Log if thinking content was removed
    if (text !== cleanedText) {
        //console.log('Removed thinking content from query expansion');
    }

    return cleanedText;
}

async function diverseDocumentSearch(query, hashedMasterKey, model) {
    //console.log('Starting sequential document search for:', query);

    // Get expanded queries early
    const expandedQueries = await expandQuery(query, model);
    //console.log(`Expanded query alternatives:`, expandedQueries);

    // Combine them for better coverage
    const combinedQuery = expandedQueries.join(' OR ');

    // STEP 1: First get ONLY document IDs and names (lightweight metadata)
    const db = await PaiperworkDB.getDatabase(hashedMasterKey);
    const docListResult = db.exec(`
        SELECT document_id, document_name, total_chunks 
        FROM documents_${hashedMasterKey}
        WHERE embedding_status = 'completed'
    `);

    // If no documents exist, exit early
    if (!docListResult?.length || !docListResult[0]?.values?.length) {
        //console.log('No documents found to search in');
        return [];
    }

    // Build lightweight list of document IDs/names only
    const docList = [];
    for (const [docId, encName] of docListResult[0].values) {
        try {
            const docName = await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encName));
            docList.push({ id: docId, name: docName });
        } catch (err) {
            console.error('Error decrypting document name:', err);
        }
    }

    //console.log(`Found ${docList.length} documents to search through sequentially`);

    // STEP 2: Process each document INDIVIDUALLY to manage memory
    const allResults = [];
    const PER_DOC_LIMIT = 5; // Limit results per document for fairness
    const MIN_SIMILARITY = 0.3; // Minimum similarity threshold

    // Store document count statistics for UI updates
    let processedCount = 0;

    // Optional UI feedback if available
    const progressStatus = document.getElementById('progress-status');
    if (progressStatus) {
        progressStatus.textContent = `Searching documents (0/${docList.length})...`;
    }

    // Process each document sequentially
    for (const doc of docList) {
        try {
            // Show per-document progress
            processedCount++;
            if (progressStatus) {
                progressStatus.textContent = `Searching documents (${processedCount}/${docList.length}): ${doc.name}`;
            }

            //console.log(`Searching document ${processedCount}/${docList.length}: ${doc.name}`);

            // IMPORTANT: Create a lightweight search function that doesn't load ALL chunks at once
            const docResults = await searchSingleDocument(
                doc.id,
                doc.name,
                combinedQuery,
                hashedMasterKey,
                model,
                PER_DOC_LIMIT,
                MIN_SIMILARITY
            );

            // Add results from this document (if any)
            if (docResults?.length) {
                //console.log(`Found ${docResults.length} matches in "${doc.name}"`);
                allResults.push(...docResults);
            }

            // Force browser to collect garbage if possible
            if (window.gc) window.gc();
            else if (global && global.gc) global.gc();

            // Add a small delay to let browser breathe between documents
            await new Promise(resolve => setTimeout(resolve, 50));

        } catch (error) {
            console.error(`Error searching document ${doc.name}:`, error);
        }
    }

    // If no results from any document, return empty
    if (allResults.length === 0) {
        //console.log('No search results found across any documents');
        return [];
    }

    // Sort by similarity and apply final processing
    allResults.sort((a, b) => b.adjustedSimilarity - a.adjustedSimilarity);

    // Return just the top results (max 15)
    const MAX_RESULTS = 15;
    return createDiverseResultSet(allResults, docList, MAX_RESULTS);
}

// New helper function to search a single document
async function searchSingleDocument(docId, docName, query, hashedMasterKey, model, limit, minSimilarity) {
    try {
        // Create a timeout promise to prevent hanging on any single document
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Search timeout')), 15000)
        );

        // Set up constraints for this specific document only
        const constraints = { documentId: docId };

        // Get chunks for ONLY this document with direct SQL for better memory management
        const db = await PaiperworkDB.getDatabase(hashedMasterKey, 'rag');
        const result = db.exec(`
            SELECT chunk_id, chunk_text, chunk_embedding, chunk_metadata
            FROM document_chunks_${hashedMasterKey}
            WHERE document_id = ?
        `, [docId]);

        if (!result?.length || !result[0]?.values?.length) {
            return []; // No chunks for this document
        }

        // Process chunks in smaller batches (5-10 at a time) if there are many
        const chunks = [];
        const BATCH_SIZE = 10;
        let batchIndex = 0;

        while (batchIndex < result[0].values.length) {
            const batch = result[0].values.slice(
                batchIndex,
                batchIndex + BATCH_SIZE
            );

            // Process this batch of chunks
            for (const [chunkId, encText, encEmbedding, encMetadata] of batch) {
                try {
                    const text = await PaiperworkDB.decrypt(
                        hashedMasterKey,
                        JSON.parse(encText)
                    );

                    const embeddingStr = await PaiperworkDB.decrypt(
                        hashedMasterKey,
                        JSON.parse(encEmbedding)
                    );

                    const metadata = JSON.parse(await PaiperworkDB.decrypt(
                        hashedMasterKey,
                        JSON.parse(encMetadata)
                    ));

                    // Parse embedding from string to actual vector
                    const embedding = JSON.parse(embeddingStr);

                    chunks.push({
                        id: chunkId,
                        text,
                        embedding,
                        metadata,
                        documentId: docId
                    });
                } catch (err) {
                    console.error('Error decrypting chunk:', err);
                }
            }

            batchIndex += BATCH_SIZE;

            // Small delay between batches to prevent freezing
            if (batchIndex < result[0].values.length) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        // Generate query embedding
        const queryEmbedding = await RAG.generateEmbedding(query, model);

        // Perform similarity search locally
        const searchResults = chunks.map(chunk => {
            const similarity = calculateCosineSimilarity(queryEmbedding, chunk.embedding);
            return {
                text: chunk.text,
                similarity,
                adjustedSimilarity: similarity, // Will be adjusted later
                documentId: docId,
                documentName: docName,
                metadata: chunk.metadata
            };
        });

        // Sort by similarity and get top results
        searchResults.sort((a, b) => b.similarity - a.similarity);
        const topResults = searchResults
            .filter(r => r.similarity >= minSimilarity)
            .slice(0, limit);

        // Apply content weighting
        topResults.forEach(result => {
            // Adjust weights based on metadata or document name
            let contentWeight = 1.0;

            // If it's a relevant document type, boost it
            const docNameLower = docName.toLowerCase();
            if (docNameLower.includes('research') ||
                docNameLower.includes('report') ||
                docNameLower.includes('memo')) {
                contentWeight = 1.15;
            }

            // Apply the weight
            result.adjustedSimilarity = result.similarity * contentWeight;
        });

        // If there are no significant results but we have chunks,
        // include at least some results anyway
        if (topResults.length === 0 && chunks.length > 0) {
            // Take top 3 regardless of similarity
            const forcedResults = searchResults
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 3);

            if (forcedResults.length) {
                //console.log(`Including ${forcedResults.length} low-relevance results from ${docName}`);
                return forcedResults;
            }
        }

        // Free up memory as soon as we're done
        chunks.length = 0;

        // Return document's results
        return topResults;

    } catch (error) {
        console.error(`Error in searchSingleDocument for ${docName}:`, error);
        return []; // Return empty results on error
    }
}

// Helper function to calculate cosine similarity
function calculateCosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
        return 0;
    }

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        mag1 += vec1[i] * vec1[i];
        mag2 += vec2[i] * vec2[i];
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) {
        return 0;
    }

    return dotProduct / (mag1 * mag2);
}

// Helper to create a diverse result set with representation from all documents
function createDiverseResultSet(allResults, docList, maxResults) {
    // First ensure each document has at least one result if available
    const diverseResults = [];
    const documentCounts = {};
    const seenDocuments = new Set();

    // First pass: add one result from each document that has results
    for (const result of allResults) {
        if (!seenDocuments.has(result.documentId) && diverseResults.length < maxResults) {
            diverseResults.push(result);
            seenDocuments.add(result.documentId);
            documentCounts[result.documentId] = 1;
        }
    }

    // Second pass: add more results with priority to most relevant
    const remainingSlots = maxResults - diverseResults.length;
    if (remainingSlots > 0) {
        // Get remaining results not yet included
        const remainingResults = allResults.filter(
            r => !diverseResults.includes(r)
        );

        // Add up to remainingSlots results, sorted by adjusted similarity
        diverseResults.push(
            ...remainingResults
                .sort((a, b) => b.adjustedSimilarity - a.adjustedSimilarity)
                .slice(0, remainingSlots)
        );
    }

    // Final sort by relevance
    diverseResults.sort((a, b) => b.adjustedSimilarity - a.adjustedSimilarity);

    return diverseResults;
}

function addDocumentSearchStyles() {
    // Check if styles are already added
    if (document.getElementById('document-search-styles')) return;

    // Create style element
    const styleEl = document.createElement('style');
    styleEl.id = 'document-search-styles';
    styleEl.textContent = `
        .document-search-results {
            margin: 16px 0;
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .document-result {
            margin-bottom: 12px;
            background-color: var(--message-bg-color, rgba(255, 255, 255, 0.05));
            border-radius: 6px;
            overflow: hidden;
        }
        
        .document-name {
            font-weight: bold;
            padding: 8px 12px;
            background-color: var(--accent-color-light, rgba(79, 70, 229, 0.1));
            border-bottom: 1px solid var(--border-color, #e0e0e0);
        }
        
        .matches-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .match-item {
            padding: 10px 12px;
            border-bottom: 1px solid var(--border-color-light, rgba(224, 224, 224, 0.5));
        }
        
        .match-item:last-child {
            border-bottom: none;
        }
        
        .match-snippet {
            font-size: 0.9em;
            margin-bottom: 4px;
            line-height: 1.5;
        }
        
        .match-page {
            font-size: 0.8em;
            color: var(--label-color, #888);
        }
        
        .searching-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            color: var(--label-color, #888);
        }
        
        .searching-indicator i {
            margin-right: 8px;
            animation: pulse 1.5s infinite;
        }
        
        .no-results {
            padding: 16px;
            text-align: center;
            color: var(--label-color, #888);
        }
        
        .search-results-header, .ai-analysis-header {
            margin: 16px 0 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border-color, #e0e0e0);
        }
        
        .search-results-header h3, .ai-analysis-header h3 {
            margin: 0;
            font-size: 1.1em;
            font-weight: 600;
        }

            /* Document citation styles */
        .document-citation {
            display: inline-flex;
            align-items: center;
            color: var(--accent-color, #4f46e5);
            cursor: pointer;
            padding: 2px 4px;
            border-radius: 3px;
            background-color: rgba(79, 70, 229, 0.1);
            transition: background-color 0.2s;
        }
        
        .document-citation:hover {
            background-color: rgba(79, 70, 229, 0.2);
        }
            
            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }
        `;

    // Add to document head
    document.head.appendChild(styleEl);
}

async function showDocumentSummary(documentId, documentTitle, hashedMasterKey) {
    // If a summary is already being generated, show a notification and return
    if (isSummaryGenerating) {
        showNotification(Lang.get('ragSummaryGenerating'));
        return;
    }

    // Get the current context size setting
    const contextSize = parseInt(document.getElementById('context-selector')?.value || 8192);
    //console.log('Current context size setting:', contextSize);

    // First, let's check if the document size is appropriate for the selected context
    try {
        // Retrieve all chunks for this document
        const db = await PaiperworkDB.getDatabase(hashedMasterKey, 'rag');
        const chunksResult = db.exec(`
            SELECT chunk_id, chunk_text, chunk_metadata
            FROM document_chunks_${hashedMasterKey}
            WHERE document_id = '${documentId}'
            ORDER BY page_number ASC
        `);

        if (!chunksResult || chunksResult.length === 0 || !chunksResult[0].values) {
            showNotification(Lang.get('ragSummaryNoContent'));
            return;
        }

        // Decrypt chunk texts and calculate approximate size
        let chunks = [];
        let totalTextSize = 0;

        for (const [chunkId, encText, encMetadata] of chunksResult[0].values) {
            try {
                const text = await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encText));
                totalTextSize += text.length;
                chunks.push({
                    id: chunkId,
                    text: text,
                    metadata: JSON.parse(await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encMetadata)))
                });
            } catch (err) {
                console.error('Error decrypting chunk:', err);
            }
        }

        // Estimate tokens: roughly 4 characters per token for English text
        const estimatedTokens = Math.ceil(totalTextSize / 4);
        const sizeInKB = (new Blob([chunks.map(chunk => chunk.text).join('\n\n')])).size / 1024;

        // Estimate required context based on document size
        // We need extra room for the prompt and AI response
        let recommendedContextSize = 0;

        if (sizeInKB < 15) {
            recommendedContextSize = 4096; // Small document
        } else if (sizeInKB < 30) {
            recommendedContextSize = 8192; // Medium document
        } else if (sizeInKB < 60) {
            recommendedContextSize = 16384; // Large document
        } else if (sizeInKB < 120) {
            recommendedContextSize = 32768; // Very large document
        } else {
            recommendedContextSize = 65536; // Huge document
        }

        //console.log(`Document size: ${sizeInKB.toFixed(2)}KB, estimated tokens: ${estimatedTokens}, recommended context: ${recommendedContextSize}`);

        // If context is insufficient, warn the user
        if (contextSize < recommendedContextSize) {
            // Create a custom warning notification
            const warningModal = document.createElement('div');
            warningModal.className = 'modal context-warning-modal';
            warningModal.style.cssText = `
                display: block;
                position: fixed;
                z-index: 1050;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: auto;
                background-color: rgba(0,0,0,0.4);
            `;

            warningModal.innerHTML = `
                <div class="modal-content" style="background-color: var(--bg-color); margin: 15% auto; padding: 20px; border: 1px solid var(--border-color); width: 80%; max-width: 500px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); position: relative;">
                    <div style="display: flex; align-items: center; margin-bottom: 16px;">
                        <div style="color: #f97316; font-size: 24px; margin-right: 12px;">⚠️</div>
                        <h3 style="margin: 0; color: var(--text-color);">Context Size Warning</h3>
                    </div>
                    
                    <p style="margin-bottom: 12px; color: var(--text-color);">The current context size (${contextSize} tokens) may not be sufficient for this document (${sizeInKB.toFixed(1)}KB, est. ${estimatedTokens} tokens).</p>
                    
                    <p style="margin-bottom: 16px; color: var(--text-color);">Recommended context: <strong>${recommendedContextSize} tokens</strong></p>
                    
                    <div style="display: flex; justify-content: flex-end; gap: 10px;">
                        <button id="cancel-summary" style="background: none; border: 1px solid var(--border-color); padding: 8px 16px; border-radius: 4px; cursor: pointer; color: var(--text-color);">Cancel</button>
                        <button id="increase-context" style="background-color: #10B981; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Increase Context Size</button>
                        <button id="proceed-anyway" style="background-color: #f97316; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Proceed Anyway</button>
                    </div>
                </div>
            `;

            document.body.appendChild(warningModal);

            // Add event listeners
            document.getElementById('cancel-summary').addEventListener('click', () => {
                document.body.removeChild(warningModal);
            });

            document.getElementById('increase-context').addEventListener('click', () => {
                // Set the context selector to the recommended value
                const contextSelector = document.getElementById('context-selector');
                if (contextSelector) {
                    // Find the closest available option
                    const options = Array.from(contextSelector.options).map(o => parseInt(o.value));
                    const closestOption = options.reduce((prev, curr) => {
                        return (curr >= recommendedContextSize && curr < prev) ? curr : prev;
                    }, Infinity);

                    const newValue = closestOption !== Infinity ? closestOption : Math.max(...options);
                    contextSelector.value = newValue;

                    // Trigger a change event so the system knows the value has changed
                    const event = new Event('change', { bubbles: true });
                    contextSelector.dispatchEvent(event);

                    // Show notification about context change
                    showNotification(`Context size increased to ${newValue} tokens`);
                }

                // Remove the modal
                document.body.removeChild(warningModal);

                // Start summary generation with new context size
                setTimeout(() => showDocumentSummary(documentId, documentTitle, hashedMasterKey), 500);
            });

            document.getElementById('proceed-anyway').addEventListener('click', () => {
                document.body.removeChild(warningModal);
                // Continue with the summary process
                continueWithSummaryGeneration(documentId, documentTitle, hashedMasterKey, chunks, sizeInKB);
            });

            return; // Stop here and wait for user decision
        }

        // If context is sufficient, continue with summary generation
        continueWithSummaryGeneration(documentId, documentTitle, hashedMasterKey, chunks, sizeInKB);
    } catch (error) {
        console.error('Error checking document size:', error);
        // Continue anyway as we couldn't determine the size
        continueWithSummaryGeneration(documentId, documentTitle, hashedMasterKey);
    }
}
// Function to continue with summary generation after context size check
async function continueWithSummaryGeneration(documentId, documentTitle, hashedMasterKey, preLoadedChunks = null, preCalculatedSize = null) {
    // Set the flag to indicate we're generating a summary
    isSummaryGenerating = true;

    // Create a fresh AbortController for this summary generation
    summaryAbortController = new AbortController();

    const modal = createSummaryModal();

    resetSummaryModalState();

    // Update title
    document.getElementById('document-summary-title').textContent = Lang.get('ragSummaryTitle', { title: documentTitle });

    // Show loading state
    document.getElementById('document-summary-body').innerHTML = `<div class="loading-indicator">${Lang.get('ragSummaryPreparing')}</div>`;
    document.getElementById('document-summary-progress').style.display = 'block';

    // Hide all action buttons except cancel during generation
    document.getElementById('document-summary-copy').style.display = 'none';
    document.getElementById('document-summary-export').style.display = 'none'; // Hide export button
    document.getElementById('document-summary-reset').style.display = 'none'; // Hide reset button
    document.getElementById('document-summary-restore').style.display = 'none';
    document.getElementById('document-summary-cancel').style.display = 'block'; // Show only cancel button

    // Now modal is the actual DOM element, not a Promise
    modal.style.display = 'block';

    // Add the cancel button click handler AFTER the modal is created
    const cancelBtn = document.getElementById('document-summary-cancel');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            if (confirm(Lang.get('ragSummaryCancelConfirm'))) {
                // Use our local summaryAbortController instead of window.cancelOllamaGeneration
                if (summaryAbortController) {
                    //console.log('RAG_Utils: Cancelling summary generation');
                    summaryAbortController.abort();
                    summaryAbortController = null;
                }

                // Update UI to reflect cancellation
                document.getElementById('document-summary-status').textContent = Lang.get('ragSummaryCancelled');
                document.getElementById('document-summary-cancel').style.display = 'none';

                // Show any partial summary that may have been generated
                const summaryBody = document.getElementById('document-summary-body');
                if (summaryBody.querySelector('.incremental-summary') &&
                    summaryBody.querySelector('.incremental-summary').textContent.trim().length > 40) {
                    // There's meaningful content, add warning but keep it
                    summaryBody.innerHTML += `<p><em>${Lang.get('ragSummaryPartialWarning')}</em></p>`;

                    // Show copy button since there's useful content
                    document.getElementById('document-summary-copy').style.display = 'inline-flex';
                } else {
                    // No meaningful content, show cancellation message and hide copy button
                    summaryBody.innerHTML = `<p>${Lang.get('ragSummaryCancelledByUser')}</p>`;
                    document.getElementById('document-summary-copy').style.display = 'none';
                }

                // Reset the generating flag
                isSummaryGenerating = false;
            }
        };
    }

    // Also handle the close button properly
    const closeBtn = document.getElementById('document-summary-close');
    if (closeBtn) {
        closeBtn.onclick = () => {
            // If summary is still generating, ask if the user wants to cancel
            if (isSummaryGenerating) {
                const shouldCancel = confirm(Lang.get('ragSummaryCancelConfirm'));

                if (shouldCancel) {
                    // User confirmed cancellation - cancel generation and close modal
                    if (summaryAbortController) {
                        //console.log('RAG_Utils: Cancelling summary generation via close button');
                        summaryAbortController.abort();
                        summaryAbortController = null;
                    }

                    modal.style.display = 'none';
                    showNotification(Lang.get('ragSummaryCancelled'));
                    isSummaryGenerating = false;
                } else {
                    // User wants to continue - keep modal open
                    showNotification(Lang.get('ragSummaryContinuing'));
                    // Don't close the modal - just return
                    return;
                }
            } else {
                // No active generation, safe to close the modal
                modal.style.display = 'none';
            }
        };
    }

    try {
        // Get the model from the selector
        const selectedModel = document.getElementById('model-selector').value;

        if (!selectedModel) {
            document.getElementById('document-summary-body').innerHTML = `<p>${Lang.get('ollamaSelectModelPrompt')}</p>`;
            document.getElementById('document-summary-progress').style.display = 'none';
            document.getElementById('document-summary-copy').style.display = 'none';
            isSummaryGenerating = false;
            return;
        }

        const supportsSummaryGeneration = await modelSupportsSummaryGeneration(selectedModel);
        if (supportsSummaryGeneration === false) {
            const incompatibleMessage = `Model "${selectedModel}" does not support text generation. Please choose a chat/completion model to generate summaries.`;
            document.getElementById('document-summary-body').innerHTML =
                `<p>${Lang.get('ragSummaryError', { error: incompatibleMessage })}</p>`;
            document.getElementById('document-summary-progress').style.display = 'none';
            document.getElementById('document-summary-copy').style.display = 'none';
            showNotification(incompatibleMessage, 5000);
            isSummaryGenerating = false;
            return;
        }

        // Use preloaded chunks if provided, otherwise fetch them
        let chunks = preLoadedChunks;
        if (!chunks) {
            // Retrieve all chunks for this document
            const db = await PaiperworkDB.getDatabase(hashedMasterKey, 'rag');
            const chunksResult = db.exec(`
                SELECT chunk_id, chunk_text, chunk_metadata
                FROM document_chunks_${hashedMasterKey}
                WHERE document_id = '${documentId}'
                ORDER BY page_number ASC
            `);

            if (!chunksResult || chunksResult.length === 0 || !chunksResult[0].values) {
                document.getElementById('document-summary-body').innerHTML = `<p>${Lang.get('ragSummaryNoContent')}</p>`;
                document.getElementById('document-summary-progress').style.display = 'none';
                document.getElementById('document-summary-copy').style.display = 'block';
                isSummaryGenerating = false; // Reset the flag
                return;
            }

            // Decrypt chunk texts
            chunks = [];
            for (const [chunkId, encText, encMetadata] of chunksResult[0].values) {
                try {
                    const text = await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encText));
                    const metadata = JSON.parse(await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encMetadata)));
                    chunks.push({
                        id: chunkId,
                        text: text,
                        metadata: metadata
                    });
                } catch (err) {
                    console.error('Error decrypting chunk:', err);
                }
            }
        }

        document.getElementById('document-summary-status').textContent = Lang.get('ragSummarySections', { count: chunks.length });
        document.getElementById('document-summary-progress-fill').style.width = '10%';

        // Combine all text first to check total size
        const fullText = chunks.map(chunk => chunk.text).join('\n\n');
        const textSize = preCalculatedSize || (new Blob([fullText]).size / 1024); // Size in KB

        document.getElementById('document-summary-status').textContent = Lang.get('ragSummaryProcessing', { size: Math.round(textSize) });

        let summaries = [];
        let displayedSummary = '';

        // Create a wrapper for real-time summary updates
        const summaryDisplay = document.createElement('div');
        summaryDisplay.className = 'incremental-summary';
        document.getElementById('document-summary-body').innerHTML = '';
        document.getElementById('document-summary-body').appendChild(summaryDisplay);

        // Add a status indicator for actively processing parts
        const processingIndicator = document.createElement('div');
        processingIndicator.className = 'processing-indicator';
        processingIndicator.innerHTML = `<div class="pulse-dot"></div> ${Lang.get('ragSummaryProcessing')}`;
        document.getElementById('document-summary-body').appendChild(processingIndicator);

        // Process the document as before...
        // If the document is small enough (under 15KB), process it all at once
        if (textSize < 15 || chunks.length <= 5) {
            document.getElementById('document-summary-status').textContent = Lang.get('ragSummaryGenerating');
            document.getElementById('document-summary-progress-fill').style.width = '30%';

            const summary = await generateSummaryWithAI(fullText, documentTitle, selectedModel);
            summaries = [summary];

            // Display the summary immediately
            displayedSummary = summary;
            let cleanSummary = displayedSummary;
            // Remove any thinking tags that might be in the raw text
            cleanSummary = cleanSummary.replace(/<think>[\s\S]*?<\/think>/gi, '')
                .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
                .replace(/<reflection>[\s\S]*?<\/reflection>/gi, '')
                .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
                .replace(/<cot>[\s\S]*?<\/cot>/gi, '');
            summaryDisplay.innerHTML = formatSummaryForDisplay(cleanSummary);

            document.getElementById('document-summary-progress-fill').style.width = '100%';
        } else {
            // For larger documents, process in batches SEQUENTIALLY
            const CHUNK_LIMIT = 5;
            const batches = [];

            for (let i = 0; i < chunks.length; i += CHUNK_LIMIT) {
                batches.push(chunks.slice(i, i + CHUNK_LIMIT));
            }

            const totalBatches = batches.length;
            document.getElementById('document-summary-status').textContent =
                Lang.get('ragSummaryBatches', { total: totalBatches });

            // Process batches one at a time
            for (let i = 0; i < batches.length; i++) {
                const batchNum = i + 1;
                const batchChunks = batches[i];
                const batchText = batchChunks.map(chunk => chunk.text).join('\n\n');

                document.getElementById('document-summary-status').textContent =
                    Lang.get('ragSummaryPart', { current: batchNum, total: totalBatches });

                // Calculate and update progress...
                const progress = 10 + ((i / totalBatches) * 80);
                document.getElementById('document-summary-progress-fill').style.width = `${progress}%`;

                // Process this batch
                const summary = await generateSummaryWithAI(
                    batchText,
                    documentTitle,  // Use just the document title without "Part X"
                    selectedModel,
                    false,
                    batchNum,  // Pass the batch number as a separate parameter for internal tracking
                    totalBatches
                );

                summaries.push(summary);
                displayedSummary = summaries.join(`\n\n${Lang.get('ragSectionBreak')}\n\n`);
                let cleanSummary = displayedSummary;
                // Remove any thinking tags that might be in the raw text
                cleanSummary = cleanSummary.replace(/<think>[\s\S]*?<\/think>/gi, '')
                    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
                    .replace(/<reflection>[\s\S]*?<\/reflection>/gi, '')
                    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
                    .replace(/<cot>[\s\S]*?<\/cot>/gi, '');
                summaryDisplay.innerHTML = formatSummaryForDisplay(cleanSummary);

                function scrollSummaryToBottom() {
                    // Find all potentially scrollable elements
                    const summaryBody = document.getElementById('document-summary-body');
                    const modalContent = document.querySelector('.document-summary-content');

                    // Create array of elements to scroll (in descending order of priority)
                    const scrollTargets = [summaryDisplay, summaryBody, modalContent];

                    // Try to scroll each element
                    scrollTargets.forEach(element => {
                        if (element && element.scrollHeight > element.clientHeight) {
                            requestAnimationFrame(() => {
                                element.scrollTop = element.scrollHeight;
                            });
                        }
                    });
                }
                scrollSummaryToBottom();

                const newProgress = 10 + (((i + 1) / totalBatches) * 80);
                document.getElementById('document-summary-progress-fill').style.width = `${newProgress}%`;
            }

            // Handle final summary
            if (summaries.length > 1) {
                document.getElementById('document-summary-status').textContent = Lang.get('ragSummaryFinalizing');
                document.getElementById('document-summary-progress-fill').style.width = '90%';

                const combinedSummaryText = summaries.join(`\n\n${Lang.get('ragSectionBreak')}\n\n`);
                const combinedSize = new Blob([combinedSummaryText]).size / 1024;

                processingIndicator.innerHTML = `<div class="pulse-dot"></div> ${Lang.get('ragSummaryCreatingFinal')}`;

                // Store the original partial summaries before replacing them
                const partialSummaries = [...summaries];

                document.getElementById('document-summary-status').textContent = Lang.get('ragSummaryCreatingFinal');

                const finalSummary = await generateSummaryWithAI(
                    combinedSummaryText,
                    Lang.get('ragSummaryFinalTitle', { title: documentTitle }),
                    selectedModel,
                    true
                );

                displayedSummary = finalSummary;
                summaries = [finalSummary];

                // Store the partial summaries in the modal for later use
                const summaryModal = document.getElementById('document-summary-modal');
                if (summaryModal) {
                    summaryModal.setAttribute('data-partial-summaries', JSON.stringify(partialSummaries));
                }
            }
        }

        processingIndicator.remove();

        // Display the final summary - save original for reset button
        const finalSummaryText = summaries.join(`\n\n${Lang.get('ragSectionBreak')}\n\n`);
        const cleanFinalSummary = finalSummaryText.replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
            .replace(/<reflection>[\s\S]*?<\/reflection>/gi, '')
            .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
            .replace(/<cot>[\s\S]*?<\/cot>/gi, '');

        // Use cleanFinalSummary instead of finalSummaryText
        const formattedSummary = formatSummaryForDisplay(cleanFinalSummary);

        // Update the summary body with formatted content and make it editable
        const summaryBody = document.getElementById('document-summary-body');
        summaryBody.innerHTML = formattedSummary;
        summaryBody.contentEditable = 'true';
        summaryBody.setAttribute('data-original-content', formattedSummary);

        // Add a mutation observer to preserve formatting
        const observer = new MutationObserver(() => {
            // Ensure all formatted elements retain their styling
            summaryBody.querySelectorAll('strong, em, code, a').forEach(el => {
                if (el.tagName === 'CODE' && !el.classList.contains('inline-code')) {
                    el.classList.add('inline-code');
                }
            });
        });

        // Start observing the summary for changes
        observer.observe(summaryBody, {
            childList: true,
            subtree: true,
            characterData: true
        });

        // Add an editable notice at the top of the summary
        const editableNotice = document.createElement('div');
        editableNotice.className = 'editable-notice';
        editableNotice.innerHTML = `<p><em>${Lang.get('editableContent') || 'This summary is editable. Feel free to modify it as needed.'}</em></p>`;
        editableNotice.style.cssText = `
            padding: 8px 12px;
            background-color: rgba(79, 70, 229, 0.1);
            border-left: 3px solid var(--accent-color, #4f46e5);
            margin-bottom: 16px;
            font-size: 14px;
            color: var(--text-color-secondary, #666);
            border-radius: 3px;
        `;
        summaryBody.insertBefore(editableNotice, summaryBody.firstChild);

        // Add table of contents for longer summaries
        if (summaryBody.textContent.length > 1000) { // Only for longer summaries
            addTableOfContents(summaryBody);
        }
        scrollSummaryToTop();

        document.getElementById('document-summary-status').textContent = Lang.get('ragSummaryComplete');

        // Show all action buttons now that the summary is complete
        const copyButton = document.getElementById('document-summary-copy');
        copyButton.style.display = 'inline-flex';
        copyButton.style.fontSize = '16px';
        copyButton.style.padding = '10px 20px';
        copyButton.style.marginTop = '20px';
        copyButton.style.textAlign = 'center';

        // Show the export button
        const exportButton = document.getElementById('document-summary-export');
        if (exportButton) {
            exportButton.style.display = 'inline-flex';
            exportButton.style.fontSize = '16px';
            exportButton.style.padding = '10px 20px';
            exportButton.style.marginTop = '20px';
            exportButton.style.textAlign = 'center';
        }

        // Show reset button now that we have content to reset
        const resetButton = document.getElementById('document-summary-reset');
        if (resetButton) {
            resetButton.style.display = 'inline-flex';
        }

        // Show restore partial summaries button only if we had multiple summaries initially
        const restoreButton = document.getElementById('document-summary-restore');
        const summaryModalElement = document.getElementById('document-summary-modal');
        if (restoreButton && summaryModalElement && summaryModalElement.hasAttribute('data-partial-summaries')) {
            restoreButton.style.display = 'inline-flex';
        }

        // Hide cancel button
        document.getElementById('document-summary-cancel').style.display = 'none';
        document.getElementById('document-summary-progress-fill').style.width = '100%';

        // Update the tokens used via OllamaAPI method
        const tokenCount = OllamaAPI.countTokens(finalSummaryText);
        const contextSize = parseInt(document.getElementById('context-selector')?.value || 8192);
        const percentUsed = Math.min(100, Math.round((tokenCount / contextSize) * 100));
        const remainingPercentage = 100 - percentUsed;

        // Update the notification
        showNotification(Lang.get('ragSummaryTokenCount', {
            tokens: tokenCount,
            percent: percentUsed
        }));

        // Update the main context indicator
        const contextLabel = document.getElementById('context-remaining-label');
        if (contextLabel) {
            contextLabel.textContent = Lang.get('ollamaContextRemaining', { percent: remainingPercentage });

            // Use same color logic as in OllamaAPI
            contextLabel.style.color = ''; // Reset color first
            if (remainingPercentage <= 20) {
                contextLabel.style.color = 'orange';
            }
            if (remainingPercentage <= 10) {
                contextLabel.style.color = 'red';
            }
        }

    } catch (error) {
        console.error('Error generating document summary:', error);

        // Check if this was an abort error
        if (error.name === 'AbortError') {
            document.getElementById('document-summary-body').innerHTML =
                `<p>${Lang.get('ragSummaryCancelled')}</p>`;
        } else {
            const lowerMessage = String(error?.message || '').toLowerCase();
            const unsupportedGenerateModel =
                lowerMessage.includes('does not support generate') ||
                lowerMessage.includes('does not support chat');

            if (unsupportedGenerateModel) {
                const selectedModel = document.getElementById('model-selector')?.value || '';
                const compatibilityMessage = selectedModel
                    ? `Model "${selectedModel}" does not support text generation. Please choose a chat/completion model and try again.`
                    : 'The selected model does not support text generation. Please choose a chat/completion model and try again.';
                document.getElementById('document-summary-body').innerHTML =
                    `<p>${Lang.get('ragSummaryError', { error: compatibilityMessage })}</p>`;
            } else {
            document.getElementById('document-summary-body').innerHTML =
                `<p>${Lang.get('ragSummaryError', { error: error.message })}</p>`;
            }
        }

        // Hide all action buttons since there's nothing to act on
        document.getElementById('document-summary-cancel').style.display = 'none';
        document.getElementById('document-summary-copy').style.display = 'none';
        document.getElementById('document-summary-export').style.display = 'none';
        document.getElementById('document-summary-reset').style.display = 'none';

    } finally {
        // Clear current request ID and controller
        currentSummaryRequestId = null;
        summaryAbortController = null;

        // Reset the isSummaryGenerating flag to allow new summaries
        isSummaryGenerating = false;

        // Hide the progress bar after a delay
        setTimeout(() => {
            document.getElementById('document-summary-progress').style.display = 'none';
        }, 1000);
    }
}

function resetSummaryModalState() {
    // Reset progress bar to 0%
    const progressFill = document.getElementById('document-summary-progress-fill');
    if (progressFill) {
        progressFill.style.width = '0%';
    }

    // Reset status message
    const statusElement = document.getElementById('document-summary-status');
    if (statusElement) {
        statusElement.textContent = Lang.get('ragSummaryPreparing') || 'Preparing document summary...';
    }

    // Reset content to loading indicator
    const summaryBody = document.getElementById('document-summary-body');
    if (summaryBody) {
        summaryBody.innerHTML = `<div class="loading-indicator">${Lang.get('ragSummaryPreparing') || 'Preparing document summary...'}</div>`;
        summaryBody.contentEditable = 'false'; // Reset editability until summary is ready
        summaryBody.removeAttribute('data-original-content'); // Clear saved content
    }

    // Hide all action buttons except cancel
    document.getElementById('document-summary-copy').style.display = 'none';
    document.getElementById('document-summary-export').style.display = 'none';
    document.getElementById('document-summary-reset').style.display = 'none';
    document.getElementById('document-summary-cancel').style.display = 'block';

    // Show progress bar
    document.getElementById('document-summary-progress').style.display = 'block';
}

function createSummaryModal() {
    // Check if modal already exists
    const existingModal = document.getElementById('document-summary-modal');
    if (existingModal) {
        return existingModal;
    }

    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'document-summary-modal';
    modal.className = 'document-summary-modal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background-color: rgba(0,0,0,0.4);
    `;

    // Create modal content with proper theme variables
    const modalContent = document.createElement('div');
    modalContent.className = 'document-summary-content';
    modalContent.style.cssText = `
        background-color: var(--bg-color);
        color: var(--text-color);
        margin: 5% auto;
        padding: 20px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        width: 80%;
        max-width: 1200px;
        max-height: 85vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    `;

    // Create header
    const header = document.createElement('div');
    header.className = 'document-summary-header';
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border-color);
        position: sticky;
        top: 0;
        background-color: var(--bg-color);
        z-index: 10;
    `;

    // Create title
    const title = document.createElement('h3');
    title.id = 'document-summary-title';
    title.textContent = 'Document Summary';
    title.style.cssText = `
        margin: 0;
        color: var(--text-color);
        font-size: 18px;
    `;

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.id = 'document-summary-close';
    closeBtn.textContent = '×';
    closeBtn.className = 'close-button';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--text-color);
    `;

    // Create body
    const body = document.createElement('div');
    body.id = 'document-summary-body';
    body.className = 'document-summary-body';
    body.style.cssText = `
        margin-bottom: 16px;
        line-height: 1.5;
        color: var(--text-color);
        flex-grow: 1;
        overflow-y: auto;
    `;

    // Add progress container
    const progress = document.createElement('div');
    progress.id = 'document-summary-progress';
    progress.className = 'document-summary-progress';
    progress.style.cssText = `
        margin-bottom: 16px;
        display: none;
        position: sticky;
        top: 50px;
        background-color: var(--bg-color);
        z-index: 5;
        padding: 8px 0;
    `;

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar-container';
    progressBar.style.cssText = `
        height: 6px;
        background-color: var(--border-color);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 8px;
    `;

    const progressFill = document.createElement('div');
    progressFill.id = 'document-summary-progress-fill';
    progressFill.className = 'progress-bar-fill';
    progressFill.style.cssText = `
        height: 100%;
        background-color: var(--accent-color, #4f46e5);
        width: 0;
        transition: width 0.3s ease;
    `;

    const progressStatus = document.createElement('div');
    progressStatus.id = 'document-summary-status';
    progressStatus.className = 'progress-status';
    progressStatus.textContent = 'Generating summary...';
    progressStatus.style.cssText = `
        font-size: 14px;
        color: var(--label-color);
        text-align: center;
    `;

    // Create action buttons container with improved alignment
    const actionButtons = document.createElement('div');
    actionButtons.className = 'summary-action-buttons';
    actionButtons.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        position: sticky;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: var(--bg-color);
        padding: 15px 0;
        margin-top: 16px;
        border-top: 1px solid var(--border-color);
        z-index: 20;
        width: 100%;
    `;

    // Left side for reset button
    const leftButtonsGroup = document.createElement('div');
    leftButtonsGroup.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px; 
    `;

    // Right side for action buttons
    const rightButtonsGroup = document.createElement('div');
    rightButtonsGroup.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
    `;

    // Standardized button style function
    const applyStandardButtonStyle = (button) => {
        const baseStyle = `
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
            transition: background-color 0.2s;
            height: 36px;
            line-height: 20px;
            min-width: 100px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-top: 0;
            margin-bottom: 0;
            text-align: center;
        `;

        // Apply the baseStyle first
        button.style.cssText = baseStyle;

        // Then apply any additional styles
        if (button.style.display === 'none') {
            // Save the display:none property to apply after showing
            button.dataset.originalDisplay = 'none';
        }

        // Ensure text-align center is applied directly to the button
        button.style.textAlign = 'center';
    };

    // Create reset button with standard styling
    const resetBtn = document.createElement('button');
    resetBtn.id = 'document-summary-reset';
    resetBtn.textContent = Lang.get('resetSummary') || 'Reset';
    resetBtn.className = 'reset-button';

    // First apply standard styles
    applyStandardButtonStyle(resetBtn);

    // Then apply custom styles AFTER the standard styling
    resetBtn.style.backgroundColor = 'var(--border-color, #ddd)';
    resetBtn.style.color = 'var(--text-color, #333)';
    //resetBtn.style.marginRight = '10px'; // This will now stick

    resetBtn.onclick = () => {
        const originalContent = body.getAttribute('data-original-content');
        if (originalContent) {
            body.innerHTML = originalContent;
        }
        restoreBtn.style.display = 'inline-flex';
    };
    // Create restore partial summaries button with standard styling
    const restoreBtn = document.createElement('button');
    restoreBtn.id = 'document-summary-restore';
    restoreBtn.textContent = Lang.get('restorePartialSummaries') || 'Restore partial summaries';
    restoreBtn.className = 'restore-button';
    restoreBtn.style.cssText = `
        background-color: var(--secondary-accent-color, #8b5cf6);
        color: white !important;
        display: none;
    `;
    applyStandardButtonStyle(restoreBtn);
    restoreBtn.onclick = () => {
        // Get the partial summaries stored in the modal
        const summaryModal = document.getElementById('document-summary-modal');
        if (!summaryModal) return;

        try {
            const partialSummariesStr = summaryModal.getAttribute('data-partial-summaries');
            if (!partialSummariesStr) return;

            const partialSummaries = JSON.parse(partialSummariesStr);
            if (!partialSummaries || !partialSummaries.length) return;

            const summaryBody = document.getElementById('document-summary-body');
            if (!summaryBody) return;

            // Create notice for partial summaries
            const partialSummariesNotice = document.createElement('div');
            partialSummariesNotice.className = 'partial-summaries-notice';
            partialSummariesNotice.innerHTML = `<p><strong>${Lang.get('partialSummariesNotice') || 'Partial summaries used for this summary:'}</strong></p>`;
            partialSummariesNotice.style.cssText = `
                margin-top: 32px;
                padding: 12px 16px;
                background-color: rgba(139, 92, 246, 0.1);
                border-left: 3px solid var(--secondary-accent-color, #8b5cf6);
                border-radius: 4px;
            `;

            // Format partial summaries
            const partialSummariesContent = document.createElement('div');
            partialSummariesContent.className = 'partial-summaries-content';

            // Join all partial summaries with section breaks
            const formattedSummaries = partialSummaries.map(summary => {
                return formatSummaryForDisplay(summary);
            }).join(`<div class="section-break">${Lang.get('ragSectionBreak') || '--- Section Break ---'}</div>`);

            partialSummariesContent.innerHTML = formattedSummaries;

            // Append to the summary body
            summaryBody.appendChild(partialSummariesNotice);
            summaryBody.appendChild(partialSummariesContent);

            // Scroll to where the partial summaries begin
            partialSummariesNotice.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Hide the restore button after use to prevent duplicate appends
            restoreBtn.style.display = 'none';
        } catch (error) {
            console.error('Error restoring partial summaries:', error);
        }
    };
    // Create cancel button with standard styling
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'document-summary-cancel';
    cancelBtn.textContent = Lang.get('ragSummaryCancel');
    cancelBtn.className = 'cancel-button';
    cancelBtn.style.cssText = `
        background-color: var(--danger-color, #dc3545);
        color: white !important;
        display: none;
    `;
    applyStandardButtonStyle(cancelBtn);

    // Create copy button with standard styling
    const copyBtn = document.createElement('button');
    copyBtn.id = 'document-summary-copy';
    copyBtn.textContent = Lang.get('ragSummaryCopy');
    copyBtn.className = 'use-in-chat';
    copyBtn.style.cssText = `
        background-color: var(--accent-color, #4f46e5);
        color: white !important;
        display: none;
    `;
    applyStandardButtonStyle(copyBtn);

    copyBtn.onclick = () => {
        // Get the summary body and create a clone to safely manipulate
        const summaryBody = document.getElementById('document-summary-body');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = summaryBody.innerHTML;

        // Remove the editable notice
        const editableNotice = tempDiv.querySelector('.editable-notice');
        if (editableNotice) {
            editableNotice.remove();
        }

        // Create an invisible div for proper text extraction
        const textDiv = document.createElement('div');
        textDiv.style.cssText = 'white-space: pre-wrap; position: absolute; left: -9999px;';
        textDiv.innerHTML = tempDiv.innerHTML;
        document.body.appendChild(textDiv);

        // Extract properly formatted plain text with preserved structure
        const textToCopy = textDiv.innerText || textDiv.textContent;
        document.body.removeChild(textDiv);

        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                copyBtn.textContent = Lang.get('ragSummaryCopied');
                copyBtn.style.backgroundColor = '#10B981';
                setTimeout(() => {
                    copyBtn.textContent = Lang.get('ragSummaryCopy');
                    copyBtn.style.backgroundColor = '';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    };

    // Create export button with standard styling
    const exportBtn = document.createElement('button');
    exportBtn.id = 'document-summary-export';
    exportBtn.textContent = Lang.get('exportSummary') || 'Export Summary';
    exportBtn.className = 'export-summary';
    exportBtn.style.cssText = `
        background-color: var(--secondary-accent-color, #06b6d4);
        color: white !important;
        display: none;
    `;
    applyStandardButtonStyle(exportBtn);
    exportBtn.onclick = () => {
        const summaryBody = document.getElementById('document-summary-body');
        const documentTitle = document.getElementById('document-summary-title')?.textContent || 'Document Summary';

        // Clone the body to avoid modifying the original
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = summaryBody.innerHTML;

        // Remove the editable notice
        const editableNotice = tempDiv.querySelector('.editable-notice');
        if (editableNotice) {
            editableNotice.remove();
        }

        // Remove the table of contents if present
        const tableOfContents = tempDiv.querySelector('.summary-toc');
        if (tableOfContents) {
            tableOfContents.remove();
        }

        // Get the clean HTML content
        const summaryHTML = tempDiv.innerHTML;

        // Extract text content without preserving all the whitespace
        // This is the key change - don't use pre-wrap for export
        const summaryText = tempDiv.textContent.trim();

        // Format the export text with minimal spacing
        const exportText = `# ${documentTitle}\n\n${summaryText}`;

        if (window.export && typeof window.export.exportDocumentSummary === 'function') {
            // Pass the formatted text with controlled spacing
            window.export.exportDocumentSummary(exportText, documentTitle);
        } else {
            console.error('Export functionality not available');
            showNotification(Lang.get('exportFunctionNotAvailable') || 'Export functionality not available');
        }
    }

    // Organize buttons into left and right groups
    leftButtonsGroup.appendChild(resetBtn);
    leftButtonsGroup.appendChild(restoreBtn);
    rightButtonsGroup.appendChild(cancelBtn);
    rightButtonsGroup.appendChild(copyBtn);
    rightButtonsGroup.appendChild(exportBtn);

    // Add button groups to action buttons container
    actionButtons.appendChild(leftButtonsGroup);
    actionButtons.appendChild(rightButtonsGroup);

    // Assemble the modal
    progressBar.appendChild(progressFill);
    progress.appendChild(progressBar);
    progress.appendChild(progressStatus);

    header.appendChild(title);
    header.appendChild(closeBtn);

    modalContent.appendChild(header);
    modalContent.appendChild(progress);
    modalContent.appendChild(body);
    modalContent.appendChild(actionButtons);

    modal.appendChild(modalContent);

    // Make sure we're returning the modal element
    document.body.appendChild(modal);

    // Add modal resize handling to ensure it stays in viewport
    window.addEventListener('resize', () => {
        if (modal.style.display === 'block') {
            const viewportHeight = window.innerHeight;
            const maxHeight = Math.min(viewportHeight * 0.85, viewportHeight - 100);
            modalContent.style.maxHeight = `${maxHeight}px`;

            const modalRect = modalContent.getBoundingClientRect();
            if (modalRect.bottom > viewportHeight) {
                const currentMarginTop = parseInt(getComputedStyle(modalContent).marginTop);
                const adjustment = modalRect.bottom - viewportHeight + 20;
                modalContent.style.marginTop = `${Math.max(currentMarginTop - adjustment, 20)}px`;
            }
        }
    });

    return modal;
}

function formatSummaryForDisplay(summaryText) {
    // First check if there's a text-based TOC and remove it
    let formatted = summaryText;

    // Remove the text-based TOC if it exists
    const tocPattern = /Table of Contents\s*\n\s*(?:\n|Comprehensive Summary.*?\n)((?:#.*?\n)+)/i;
    formatted = formatted.replace(tocPattern, '');

    // Process the text line by line for block elements and inline markdown
    const lines = formatted.split('\n');
    const processedLines = [];

    for (let i = 0; i < lines.length; i++) {
        // Trim whitespace from beginning and end, but preserve spaces after trimming
        const line = lines[i].trim();

        if (line === '') {
            // Handle empty lines 
            processedLines.push('');
            continue;
        }

        // Use regex to better match heading patterns and extract text
        const h3Match = line.match(/^###\s+(.*)/);
        const h2Match = line.match(/^##\s+(.*)/);
        const h1Match = line.match(/^#\s+(.*)/);

        if (h3Match) {
            // Process h3 headings - apply inline markdown to extracted text
            const headingText = processInlineMarkdown(h3Match[1]);
            processedLines.push(`<h3 id="heading-${i}" class="summary-h3">${headingText}</h3>`);
        } else if (h2Match) {
            // Process h2 headings - apply inline markdown to extracted text
            const headingText = processInlineMarkdown(h2Match[1]);
            processedLines.push(`<h2 id="heading-${i}" class="summary-h2">${headingText}</h2>`);
        } else if (h1Match) {
            // Process h1 headings - apply inline markdown to extracted text
            const headingText = processInlineMarkdown(h1Match[1]);
            processedLines.push(`<h1 id="heading-${i}" class="summary-h1">${headingText}</h1>`);
        } else {
            // Process regular paragraph text with inline markdown
            processedLines.push(`<p class="summary-paragraph">${processInlineMarkdown(line)}</p>`);
        }
    }

    // Join lines with proper spacing
    formatted = processedLines.join('\n');

    return `<div class="summary-content">
        <div class="summary-body" style="font-family: inherit; line-height: 1.6;">${formatted}</div>
    </div>`;
}
function processInlineMarkdown(text) {
    // Bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic (both styles)
    text = text.replace(/\b_([^_]+)_\b/g, '<em>$1</em>');
    text = text.replace(/\*([^\*]+)\*/g, '<em>$1</em>');

    // Code
    text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    return text;
}
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
// Add a new function to show theme-aware notifications
function showNotification(message) {
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll('.summary-notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'summary-notification';

    // Apply theme-aware styling
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 16px;
        background-color: var(--bg-color);
        color: var(--text-color);
        border: 1px solid var(--border-color);
        border-left: 4px solid var(--accent-color, #4f46e5);
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1100;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;

    // Add the message text
    notification.innerHTML = `<p style="margin: 0; color: var(--text-color);">${message}</p>`;

    // Add to the document
    document.body.appendChild(notification);

    // Remove the notification after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 5000);
}

// Adds the selected document actions panel to the UI (duplicate, can be merged)
function addSelectionPanel(documentsList, documents) {
    // First, remove any existing panel
    removeSelectionPanel();

    // Find the selected document
    const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
    if (!selectedDoc) {
        // Document not found - clear selection
        selectedDocumentId = null;
        return;
    }

    const actionsPanel = document.createElement('div');
    actionsPanel.className = 'selected-document-actions';
    actionsPanel.innerHTML = `
        <div class="selected-document-info">
            <span>${Lang.get('ragDocumentSelected')}</span>
            <button id="deselect-document">${Lang.get('ragDocumentDeselect')}</button>
        </div>
        <div class="selected-document-buttons">
            <button id="generate-summary" class="primary-action">${Lang.get('ragDocumentGenerateSummary')}</button>
            <button id="ask-document" class="secondary-action">${Lang.get('ragDocumentAskQuestions')}</button>
        </div>
    `;
    documentsList.parentNode.insertBefore(actionsPanel, documentsList);

    // Add event listeners for the action buttons
    document.getElementById('deselect-document').addEventListener('click', () => {
        // Clear selection
        selectedDocumentId = null;
        // Remove selection styling from any selected document
        document.querySelectorAll('.document-item.selected').forEach(
            item => item.classList.remove('selected')
        );
        // Remove the panel
        removeSelectionPanel();
    });

    document.getElementById('generate-summary').addEventListener('click', async () => {
        await showDocumentSummary(selectedDocumentId, selectedDoc.name, sessionStorage.getItem('hashedMasterKey'));
    });

    document.getElementById('ask-document').addEventListener('click', () => {
        enableDocumentQuestioningMode(selectedDocumentId);
    });
}

// Enables document questioning mode for a selected document (duplicate, can be merged)
function enableDocumentQuestioningMode(documentId) {
    //console.log('Enabling document questioning mode for document ID:', documentId);

    // Check if we're already in document mode for this document
    const activeDocumentId = localStorage.getItem('ragQuestioningDocumentId');
    if (activeDocumentId === documentId) {
        //console.log('Document is already in questioning mode');
        return;
    }

    // If we're in document mode for a different document, exit it first
    if (activeDocumentId) {
        exitDocumentQuestioningMode();
    }

    // Use a self-executing async function to handle the async operations
    (async () => {
        try {
            // Get the masterkey hash
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            if (!hashedMasterKey) {
                console.error('No masterkey hash found in localStorage');
                return;
            }

            // Get database connection
            const db = await PaiperworkDB.getDatabase(hashedMasterKey);
            if (!db) {
                console.error('Could not connect to database');
                return;
            }

            // Query the document info
            const result = db.exec(`
                SELECT document_name
                FROM documents_${hashedMasterKey}
                WHERE document_id = ?
            `, [documentId]);

            // Check if document was found
            if (!result || result.length === 0 || !result[0].values || !result[0].values.length === 0) {
                console.error('Document not found in database:', documentId);
                return;
            }

            // Decrypt the document name
            const encName = result[0].values[0][0];
            const docName = await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encName));

            // Store document info for chat (encrypt document name)
            try {
                localStorage.setItem('ragQuestioningDocumentId', documentId);
                await PaiperworkDB.secureLocalStorageSet('ragQuestioningDocumentName', docName);
            } catch (err) {
                console.error('Could not securely store ragQuestioningDocumentName, falling back to plain localStorage', err);
                localStorage.setItem('ragQuestioningDocumentId', documentId);
                localStorage.setItem('ragQuestioningDocumentName', docName);
            }

            // Ensure document mode styles are available
            addDocumentModeStyles();

            // Add a notification explaining the mode
            setTimeout(() => {
                showNotification(
                    `${Lang.get('ragDocumentModeEnabled') || 'Document questioning mode enabled.'} 
            ${Lang.get('ragDocumentModePriority') || 'This will take priority even when in Documents tab.'}`
                );
            }, 500);
            // Disable the "Ask Questions" button for this document until document mode is exited
            // This prevents users from enabling document mode multiple times for the same document
            const askDocumentButton = document.getElementById('ask-document');
            if (askDocumentButton) {
                askDocumentButton.disabled = true;
                askDocumentButton.textContent = 'Document Mode Enabled';
                askDocumentButton.style.opacity = '0.6';
                askDocumentButton.style.cursor = 'not-allowed';
            }

            // Add a visual highlight to the Chat tab to guide the user
            const chatTab = document.querySelector('.tab-button[data-tab="chat"]');
            if (chatTab) {
                chatTab.classList.add('highlight-tab');
                setTimeout(() => {
                    chatTab.classList.remove('highlight-tab');
                }, 3000);
            }

            // Find the chat interface where we'll add the green bar
            const chatContainer = document.querySelector('.chat-container');
            const progressBar = document.getElementById('progress-bar');

            if (chatContainer) {
                // Add class to chat container to reposition other elements
                document.body.classList.add('document-questioning-active');

                // Create the document questioning indicator
                const indicator = document.createElement('div');
                indicator.className = 'document-questioning-indicator';
                indicator.id = 'document-mode-indicator';

                indicator.innerHTML = `
                <div class="document-questioning-info">
                    <div class="mode-indicator document-mode">
                        <span class="mode-icon">📄</span>
                        <span class="mode-label">${Lang.get('ragDocumentModeLabel')}</span>
                    </div>
                    <span class="document-name" title="${docName}">${docName}</span>
                    <div class="document-details">
                        <button class="exit-questioning">${Lang.get('ragDocumentModeExit')}</button>
                    </div>
                </div>
            `;
                // Insert right after the progress bar
                if (progressBar && progressBar.nextSibling) {
                    chatContainer.insertBefore(indicator, progressBar.nextSibling);
                } else {
                    chatContainer.insertBefore(indicator, chatContainer.firstChild);
                }

                // Add event listener to exit button
                indicator.querySelector('.exit-questioning').addEventListener('click', () => {
                    exitDocumentQuestioningMode();
                });

                // Update input placeholder if it exists
                const promptInput = document.getElementById('prompt-input');
                if (promptInput) {
                    const originalPlaceholder = promptInput.getAttribute('data-original-placeholder') ||
                        promptInput.getAttribute('placeholder') ||
                        Lang.get('ragPromptDefault');

                    // Save original placeholder if not already saved
                    if (!promptInput.getAttribute('data-original-placeholder')) {
                        promptInput.setAttribute('data-original-placeholder', originalPlaceholder);
                    }

                    // Update placeholder
                    promptInput.setAttribute('placeholder', Lang.get('ragDocumentModePlaceholder', { document: docName }));
                }
            }

        } catch (error) {
            console.error('Error enabling document questioning mode:', error);
            showNotification(Lang.get('ragEnableError'));
        }
    })();

}

// Exits document questioning mode and resets related UI
function exitDocumentQuestioningMode() {
    // Get the currently active document ID before clearing
    const activeDocumentId = localStorage.getItem('ragQuestioningDocumentId');

    // Clear document mode data
    localStorage.removeItem('ragQuestioningDocumentId');
    localStorage.removeItem('ragQuestioningDocumentName');

    // Remove document questioning active class from body
    document.body.classList.remove('document-questioning-active');

    // Hide and remove the document questioning indicator
    const indicator = document.querySelector('.document-questioning-indicator');
    if (indicator) {
        // Add exit animation
        indicator.classList.add('fade-out');

        // Remove after animation completes
        setTimeout(() => {
            indicator.remove();
        }, 300);
    }

    // Re-enable the "Ask Questions" button if it exists
    const askDocumentButton = document.getElementById('ask-document');
    if (askDocumentButton) {
        askDocumentButton.disabled = false;
        askDocumentButton.textContent = Lang.get('ragDocumentAskQuestions');
        askDocumentButton.style.opacity = '1';
        askDocumentButton.style.cursor = 'pointer';
    }

    // Deselect the document card if we have an activeDocumentId
    if (activeDocumentId && selectedDocumentId === activeDocumentId) {
        // Find the selected document item by data-id attribute and remove selected class
        const selectedItem = document.querySelector(`.document-item[data-id="${activeDocumentId}"]`);
        if (selectedItem) {
            selectedItem.classList.remove('selected');
        }

        // Clear the selectedDocumentId variable
        selectedDocumentId = null;

        // Remove any selection panel if it exists
        removeSelectionPanel();
    }

    // Show confirmation notification
    showNotification(Lang.get('ragReturnToChat'));

    // Reset input placeholder back to default if needed
    const promptInput = document.getElementById('prompt-input');
    if (promptInput) {
        const originalPlaceholder = promptInput.getAttribute('data-original-placeholder');
        if (originalPlaceholder) {
            promptInput.setAttribute('placeholder', originalPlaceholder);
            promptInput.removeAttribute('data-original-placeholder');
        }
    }
}

// Updates the document questioning mode UI banner in the chat tab
function updateDocumentQuestioningUI(forceShow = false) {
    // Check if we're in document questioning mode
    const documentId = localStorage.getItem('ragQuestioningDocumentId');
    const documentName = localStorage.getItem('ragQuestioningDocumentName');

    // Remove any existing indicator first for a clean state
    const existingIndicator = document.querySelector('.document-questioning-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    // If no document mode, we're done
    if (!documentId || !documentName) {
        return;
    }

    // Check if we're in the chat tab or if we should force show the banner
    const isChatTabActive = forceShow ||
        document.querySelector('.tab-button[data-tab="chat-tab"].active') !== null ||
        document.querySelector('.tab-button[data-tab="chat"].active') !== null;

    // If not in chat tab and not forced, we're done
    if (!isChatTabActive) {
        return;
    }

    // Try multiple possible insertion points with more robust fallbacks
    let insertionPoint =
        document.querySelector('.chat-interface') ||
        document.querySelector('.message-input-container')?.parentElement ||
        document.querySelector('.ai-replies')?.parentElement ||
        document.querySelector('.chat-container') ||
        document.querySelector('#chat-tab');  // Last resort fallback

    // If no insertion point, try more general containers
    if (!insertionPoint) {
        insertionPoint = document.querySelector('.tab-content[data-tab="chat-tab"]') ||
            document.querySelector('.tab-content[data-tab="chat"]');
    }

    if (!insertionPoint) {
        console.error('Could not find insertion point for document questioning indicator');

        // Last resort: Try again after a delay
        if (!window.bannerRetryAttempt) {
            window.bannerRetryAttempt = true;
            setTimeout(() => {
                updateDocumentQuestioningUI(true);
                window.bannerRetryAttempt = false;
            }, 500);
        }
        return;
    }

    //console.log('Found insertion point for document banner:', insertionPoint);

    // Create the document questioning indicator
    const indicator = document.createElement('div');
    indicator.className = 'document-questioning-indicator';
    indicator.id = 'document-mode-indicator';

    indicator.innerHTML = `
        <div class="document-questioning-info">
            <div class="mode-indicator document-mode">
                <span class="mode-icon">📄</span>
                <span class="mode-label">${Lang.get('ragDocumentModeLabel') || 'Document Mode'}</span>
            </div>
            <span class="document-name" title="${documentName}">${documentName}</span>
            <div class="document-details">
                <button class="exit-questioning">${Lang.get('ragDocumentModeExit') || 'Exit'}</button>
            </div>
        </div>
    `;

    // Now we need to be more adaptive about where we insert
    if (insertionPoint.firstChild) {
        insertionPoint.insertBefore(indicator, insertionPoint.firstChild);
    } else {
        insertionPoint.appendChild(indicator);
    }

    //console.log('Document questioning banner inserted');

    // Update input placeholder if present
    const promptInput = document.getElementById('prompt-input');
    if (promptInput) {
        const originalPlaceholder = promptInput.getAttribute('data-original-placeholder') ||
            promptInput.getAttribute('placeholder') ||
            Lang.get('ragPromptDefault') || 'Ask a question...';

        // Save original placeholder if not already saved
        if (!promptInput.getAttribute('data-original-placeholder')) {
            promptInput.setAttribute('data-original-placeholder', originalPlaceholder);
        }

        // Update placeholder
        promptInput.setAttribute('placeholder', Lang.get('ragDocumentModePlaceholder', { document: documentName }) || `Ask about ${documentName}...`);
    }

    // Add event listener to exit button
    indicator.querySelector('.exit-questioning').addEventListener('click', () => {
        exitDocumentQuestioningMode();
    });
}

async function handleDocumentGlobalSearch() {
    //console.log('Performing global document search across all documents');
    const aiReplies = document.querySelector('.ai-replies');
    const sendButton = document.getElementById('send-prompt');
    const promptInput = document.getElementById('prompt-input');
    const progressBar = document.getElementById('progress-bar');

    // If currently generating, this click means "cancel"
    if (window.isGenerating || this.isGenerating) {
        window.cancelOllamaGeneration();
        return;
    }

    // Get prompt text
    const prompt = promptInput.value.trim();
    if (!prompt) {
        return;
    }

    // Check if a model is selected
    const modelSelector = document.getElementById('model-selector');
    if (!modelSelector.value) {
        alert(Lang.get('selectModelPrompt'));
        return;
    }

    // Set generating flag FIRST before any async operations
    window.isGenerating = true;
    window.isGenerating = true;

    // Apply inline styles for the button
    sendButton.textContent = Lang.get('cancelButton');
    sendButton.style.backgroundColor = '#ef4444';
    sendButton.style.color = 'white';
    sendButton.classList.add('cancel-state');

    // Create a new AbortController for this request
    const abortController = new AbortController();
    window.globalAbortController = abortController;

    progressBar.classList.add('active', 'indeterminate');

    // Add user message to chat
    const userDiv = document.createElement('div');
    userDiv.className = 'user-message';
    userDiv.innerHTML = `<div class="message-bubble">${prompt}</div><br>`;
    aiReplies.appendChild(userDiv);
    if (window.autoScrollEnabled) {
        requestAnimationFrame(() => {
            aiReplies.scrollTop = aiReplies.scrollHeight;
        });
    }

    // Clear input
    promptInput.value = '';

    try {
        // Create the AI response container ahead of time
        const aiDiv = document.createElement('div');
        aiDiv.className = 'assistant-message';
        aiReplies.appendChild(aiDiv);

        const streamProcessor = new StreamProcessor();
        aiDiv.appendChild(streamProcessor.responseContainer);

        // Show searching state
        streamProcessor.processChunk(`<div class="searching-indicator">
            <p><i class="fa-solid fa-magnifying-glass-chart"></i> ${Lang.get('searchingDocuments') || 'Searching across all your documents...'}</p>
        </div>`);

        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');

        // MEMORY OPTIMIZATION 1: Add search parameters to limit initial result size
        const searchParams = {
            maxResultsPerDocument: 3, // Limit results per document
            maxTotalResults: 12,      // Limit total results
            minSimilarity: 0.35,      // Raise minimum similarity threshold 
            searchTimeout: 20000      // Add a timeout to prevent hanging
        };

        // Let the search know this is a global search (different from single document mode)
        searchParams.globalSearch = true;

        const searchResults = await diverseDocumentSearch(prompt, hashedMasterKey, modelSelector.value, searchParams);

        // Check if it was an embedding capability issue
        if (!searchResults || searchResults.length === 0) {
            const modelName = modelSelector.options[modelSelector.selectedIndex].text || modelSelector.value;

            if (window.lastEmbeddingError) {
                streamProcessor.processChunk(`<div class="no-results error-message">
                    <p><i class="fa-solid fa-triangle-exclamation"></i> ${Lang.get('embeddingModelError') || `The selected model "${modelName}" does not support embeddings.`}</p>
                    <p>${Lang.get('embeddingModelSuggestion') || 'Please select an embedding-capable model to search documents.'}</p>
                </div>`);

                window.chat.addMessageActionsToMessage(aiDiv);
                streamProcessor.finishResponse();
                window.lastEmbeddingError = null;
                return;
            } else {
                streamProcessor.processChunk(`<div class="no-results">
                    <p>${Lang.get('noDocumentResults') || 'No relevant information found in your documents.'}</p>
                </div>`);

                window.chat.addMessageActionsToMessage(aiDiv);
                streamProcessor.finishResponse();
                return;
            }
        }

        // MEMORY OPTIMIZATION 2: Process and free document list immediately
        const documentMap = {};
        searchResults.forEach(result => {
            if (result.documentId && result.documentName) {
                documentMap[result.documentId] = result.documentName;
            }
        });

        // MEMORY OPTIMIZATION 3: Build context with document boundaries more efficiently
        let context = '';

        // Group chunks by document
        const resultsByDocument = {};
        searchResults.forEach(result => {
            if (!resultsByDocument[result.documentId]) {
                resultsByDocument[result.documentId] = {
                    name: result.documentName,
                    chunks: []
                };
            }
            resultsByDocument[result.documentId].chunks.push(result);
        });

        // Limit number of documents to include (prevents excessive context)
        const MAX_DOCS_IN_CONTEXT = 5;
        const documentIds = Object.keys(resultsByDocument).slice(0, MAX_DOCS_IN_CONTEXT);

        // Build context document by document
        documentIds.forEach(docId => {
            const doc = resultsByDocument[docId];
            context += `\n\n### Document: ${doc.name}\n\n`;

            // Sort chunks by page number if available
            doc.chunks.sort((a, b) => {
                const pageA = a.metadata?.pageNumber || 0;
                const pageB = b.metadata?.pageNumber || 0;
                return pageA - pageB;
            });

            // Add chunks with page information
            doc.chunks.forEach(chunk => {
                context += `[Page ${chunk.metadata?.pageNumber || 'unknown'}]: ${chunk.text.substring(0, 800)}\n\n`;
            });
        });

        // MEMORY OPTIMIZATION 4: Release search results after building context
        // This frees memory as we no longer need the detailed results
        searchResults.length = 0;

        // Force garbage collection if available
        if (window.gc) window.gc();

        // Add a brief artificial delay to allow browser to clean up memory
        await new Promise(resolve => setTimeout(resolve, 100));

        // MEMORY OPTIMIZATION 5: Create a streamlined system prompt
        streamProcessor.processChunk(`<div class="ai-analysis-header">
            <h3>${Lang.get('aiAnalysis') || 'AI Analysis'}</h3>
        </div>`);

        // Use a more memory-efficient system prompt
        const documentSystemPrompt = await buildDocumentSystemPrompt();

        const contextPrompt = `${documentSystemPrompt}\n\n
        You're analyzing search results from the user's documents. Here are relevant passages:
        
        ${context}
        
        Based ONLY on this information:
        1. Provide a concise analysis
        2. Answer the query directly
        3. Cite sources when relevant
        4. Acknowledge if information is insufficient`;

        // Generate a unique request ID
        window.currentRequestId = `docsearch_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

        // Get AI response based on the context
        const contextSize = document.getElementById('context-selector').value;
        const response = await OllamaAPI.sendToOllama(
            prompt,
            contextPrompt,
            contextSize,
            null, // No previous context
            window.globalAbortController?.signal,
            window.currentRequestId
        );

        // MEMORY OPTIMIZATION 6: Release context after sending to API
        context = '';

        // Process the response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        // Process the response stream
        while (true) {
            const { value, done } = await reader.read();

            if (window.globalAbortController?.signal?.aborted) {
                throw new DOMException('The user aborted a request.', 'AbortError');
            }

            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const data = JSON.parse(line);
                        if (data.done) {
                            // Complete the response
                            OllamaAPI.previousContext = data.context;
                            OllamaAPI.updateContextRemaining(data.context.length);
                            window.chat.addMessageActionsToMessage(aiDiv);
                            streamProcessor.finishResponse();

                            // Store conversation in database - use simplified approach
                            const aiResponse = streamProcessor.responseContainer.outerHTML;
                            await PaiperworkDB.storeConversationOnly(
                                hashedMasterKey,
                                prompt,
                                aiResponse,
                                false // Don't force new group
                            );

                            // MEMORY OPTIMIZATION 7: Clean up any unused context or data
                            if (data.context) {
                                // Store the minimal necessary context, not the full object
                                OllamaAPI.previousContextLength = data.context.length;
                                // Delete or minimize the actual content
                                data.context = null;
                            }
                        } else {
                            streamProcessor.processChunk(data.response);
                        }
                    } catch (parseError) {
                        console.error('Error parsing response chunk:', parseError);
                    }
                }
            }
        }

        // After producing the document-based answer, optionally enhance it with web search
        // if the user has web search enabled in the UI.
        try {
            const webSearchEnabled = document.getElementById('web-search')?.classList.contains('active');

            if (webSearchEnabled) {
                // Insert a visual transition
                streamProcessor.processChunk(`\n\n<div class="search-transition">${Lang.get('webSearchTransition')}</div>\n\n`);

                // Capture the document answer text
                const documentAnswer = streamProcessor.responseContainer.textContent || '';

                // Prepare a prompt to generate a concise web search query
                let searchQuery = '';
                try {
                    const webSearchPrompt = `Based on the document answer below, create a VERY SHORT search query (10-15 words) that will find ADDITIONAL information to expand the answer.

DOCUMENT ANSWER:
--------------------
${documentAnswer.substring(0, 1000)}
--------------------

Focus on: 
1. Key terms from the answer that need more information
2. Aspects mentioned but not detailed in the answer
3. Potential gaps in the document's coverage of the topic

When citing sources in your response, ALWAYS use Markdown link format like [Title or description](URL) - never use [REF] or reference numbers.

Return ONLY the search query words with no explanations, quotes or additional text.`;

                    const searchQueryResponse = await OllamaAPI.sendToOllama(
                        webSearchPrompt,
                        Lang.get('searchQueryOptimizerPrompt'),
                        contextSize,
                        null,
                        window.globalAbortController?.signal,
                        window.currentRequestId + "_query",
                        null
                    );

                    if (searchQueryResponse && !searchQueryResponse.success) {
                        const searchQueryReader = searchQueryResponse.body.getReader();
                        const decoder = new TextDecoder();

                        while (true) {
                            const { value, done } = await searchQueryReader.read();
                            if (done) break;

                            const chunk = decoder.decode(value);
                            const lines = chunk.split('\n');

                            for (const line of lines) {
                                if (line.trim()) {
                                    try {
                                        const data = JSON.parse(line);
                                        searchQuery += data.response;
                                        if (data.done) break;
                                    } catch (error) {
                                        console.error('Documents: Error processing search query response:', error);
                                    }
                                }
                            }
                        }
                    }

                    // Clean up search query
                    searchQuery = searchQuery.trim()
                        .replace(/^['"]|['"]$/g, '')
                        .replace(/^search\s+for\s+|^find\s+|^query\s+|^search\s+/i, '')
                        .replace(/\.$/, '');

                    if (!searchQuery || searchQuery.length < 3) {
                        const words = prompt.split(/\s+/);
                        searchQuery = words.slice(0, Math.min(words.length, 10)).join(' ');
                    }

                } catch (err) {
                    console.error('Documents: Error generating web search query:', err);
                }

                // Add header and perform web search enhancement using the optimized helper
                streamProcessor.processChunk(`<h3>${Lang.get('webSearchInfo')}</h3>`);
                this.scrollToTop?.();

                try {
                    await OllamaAPI.sendToOllamaWithWebSearch(
                        searchQuery,
                        `You are examining web search results to enhance information from a set of documents.

Document information provided:
${documentAnswer.substring(0, 2000) || ''}

Instructions:
1. Focus ONLY on information that complements or updates what's in the document(s)
2. ALWAYS cite web sources using Markdown link format like [Title](URL)
3. Make clear when you're providing web information vs document information
4. Present the web information as a helpful extension to the document-based answer`,
                        true,
                        window.globalAbortController?.signal,
                        documentAnswer.substring(0, 2000),
                        true
                    );

                    // Store updated conversation (now includes web enhancement)
                    const aiResponse = streamProcessor.responseContainer.outerHTML;
                    await PaiperworkDB.storeConversationOnly(
                        hashedMasterKey,
                        prompt,
                        aiResponse,
                        false
                    );

                } catch (error) {
                    console.error('Documents: Error enhancing with web search:', error);
                    if (error.name !== 'AbortError') {
                        streamProcessor.processChunk(`<p><em>Error enhancing with web search: ${error.message}</em></p>`);
                    }
                }
            }
        } catch (err) {
            console.error('Documents: Unexpected error in web search enhancement:', err);
        }

        // Add CSS styles for document search results
        window.addDocumentSearchStyles();

    } catch (error) {
        console.error('Error in document search:', error);

        if (error.name === 'AbortError') {
            window.cleanupIncompleteResponses();
        } else {
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'system-message';
            errorDiv.innerHTML = `<div class="message-bubble error">${Lang.get('documentSearchError') || 'Error searching documents:'} ${error.message}</div>`;
            aiReplies.appendChild(errorDiv);
        }
    } finally {
        // MEMORY OPTIMIZATION 8: Perform thorough cleanup after request
        window.globalAbortController = null;
        window.currentRequestId = null;

        // Reset UI state
        progressBar.classList.remove('active', 'indeterminate');
        sendButton.textContent = Lang.get('sendButton');
        sendButton.classList.remove('cancel-state');
        sendButton.style.backgroundColor = '';
        sendButton.style.color = '';
        window.isGenerating = false;
        window.isGenerating = false;

        // Add a small delay for browser to clean up DOM operations
        setTimeout(() => {
            if (window.gc) window.gc();
        }, 200);
    }
}

async function diverseDocumentSearch(query, hashedMasterKey, model, searchParams = {}) {
    //console.log('Performing diverse document search for:', query);

    // Set default parameters if not provided
    const params = {
        maxResultsPerDocument: searchParams.maxResultsPerDocument || 5,
        maxTotalResults: searchParams.maxTotalResults || 15,
        minSimilarity: searchParams.minSimilarity || 0.3,
        searchTimeout: searchParams.searchTimeout || 15000,
        globalSearch: searchParams.globalSearch || false
    };

    window.lastEmbeddingError = null;

    // OPTIMIZATION: Only expand query if really needed
    let expandedQueries = [query];
    if (params.globalSearch) {
        // Only do query expansion for global search to save memory in document mode
        try {
            expandedQueries = await expandQuery(query, model);
            //console.log(`Expanded original query to alternatives:`, expandedQueries);
        } catch (err) {
            console.warn('Query expansion failed, using original query only:', err);
        }
    }

    // Memory efficient document loading - get only IDs and names first
    const db = await PaiperworkDB.getDatabase(hashedMasterKey);
    const docListResult = db.exec(`
        SELECT document_id, document_name 
        FROM documents_${hashedMasterKey}
        WHERE embedding_status = 'completed'
    `);

    if (!docListResult || docListResult.length === 0 || !docListResult[0].values) {
        //console.log('No documents found to search in');
        return [];
    }

    // Build lightweight list of document IDs/names only
    const docList = [];

    // OPTIMIZATION: Process document names in batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < docListResult[0].values.length; i += BATCH_SIZE) {
        const batch = docListResult[0].values.slice(i, i + BATCH_SIZE);

        for (const row of batch) {
            const [docId, encName, totalChunksRaw] = row;
            try {
                const docName = await PaiperworkDB.decrypt(hashedMasterKey, JSON.parse(encName));
                const totalChunks = Number.isFinite(Number(totalChunksRaw)) ? Number(totalChunksRaw) : 0;
                docList.push({ id: docId, name: docName, totalChunks });
            } catch (err) {
                console.error('Error decrypting document name:', err);
            }
        }

        // Add a small delay between batches to prevent memory pressure
        if (i + BATCH_SIZE < docListResult[0].values.length) {
            await new Promise(resolve => setTimeout(resolve, 5));
        }
    }

    //console.log(`Found ${docList.length} documents to search in`);

    // OPTIMIZATION: Process each document INDIVIDUALLY with limits
    const allResults = [];
    const MAX_DOCS_TO_SEARCH = params.globalSearch ? 15 : 1; // Limit docs for global search
    const docsToSearch = docList.slice(0, MAX_DOCS_TO_SEARCH);

    // Keep track of top results across all documents to free memory
    const topResultsTracker = {
        results: [],
        worstScore: 0,

        // Method to add a result and maintain only the best ones
        addResult(result) {
            if (this.results.length < params.maxTotalResults) {
                this.results.push(result);
                // Sort and update worst score if we've reached capacity
                if (this.results.length === params.maxTotalResults) {
                    this.results.sort((a, b) => b.similarity - a.similarity);
                    this.worstScore = this.results[this.results.length - 1].similarity;
                }
                return true;
            }

            // Only add if this is better than our worst result
            if (result.similarity > this.worstScore) {
                // Replace the worst result
                this.results.pop();
                this.results.push(result);
                this.results.sort((a, b) => b.similarity - a.similarity);
                this.worstScore = this.results[this.results.length - 1].similarity;
                return true;
            }

            return false;
        }
    };

    // Process documents sequentially
    let processedCount = 0;
    const progressStatus = document.getElementById('progress-status');

    for (const doc of docsToSearch) {
        try {
            // Update UI on progress
            processedCount++;
            if (progressStatus) {
                progressStatus.textContent = `Searching documents (${processedCount}/${docsToSearch.length}): ${doc.name}`;
            }

            // OPTIMIZATION: Create a timeout promise for this document search
            const computedSearchTimeout = Math.min(
                90000,
                Math.max(
                    params.searchTimeout,
                    params.searchTimeout + Math.max(0, Number(doc.totalChunks || 0)) * 30
                )
            );
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Search timeout')), computedSearchTimeout)
            );

            // Set up constraints for this specific document
            const constraints = { documentId: doc.id };

            // Search this document with optimized chunk loading
            let docResults;
            try {
                // Use Promise.race to enforce timeout
                docResults = await Promise.race([
                    RAG.searchDocumentsWithConstraint(query, hashedMasterKey, model, constraints),
                    timeoutPromise
                ]);
            } catch (err) {
                console.warn(`Search timeout or error for document "${doc.name}":`, err);
                docResults = [];
            }

            // Add document results to global tracker
            if (docResults && docResults.length > 0) {
                // Process each chunk without keeping the full docResults array
                for (const result of docResults) {
                    // Verify result belongs to this document & meets similarity threshold
                    if (result.documentId === doc.id &&
                        result.similarity >= params.minSimilarity) {

                        // Make sure documentName is set
                        if (!result.documentName) {
                            result.documentName = doc.name;
                        }

                        // Try to add to our tracker
                        topResultsTracker.addResult(result);
                    }
                }

                // Free up memory from docResults
                docResults.length = 0;
            }

            // Force browser to collect garbage if possible
            if (window.gc) {
                window.gc();
            } else if (typeof globalThis !== 'undefined' && globalThis.gc) {
                globalThis.gc();
            }

            // Add a small delay for browser to breathe between documents
            await new Promise(resolve => setTimeout(resolve, 20));

        } catch (error) {
            console.error(`Error searching document ${doc.name}:`, error);
        }
    }

    // OPTIMIZATION: Retrieve final results and ensure diversity
    if (topResultsTracker.results.length === 0) {
        //console.log('No search results found across any documents');
        return [];
    }

    // Ensure document diversity in results
    const finalResults = createDiverseResultSet(
        topResultsTracker.results,
        docsToSearch,
        Math.min(params.maxTotalResults, 15)
    );

    return finalResults;
}
function addDocumentSearchStyles() {
    // Check if styles are already added
    if (document.getElementById('document-search-styles')) return;

    // Create style element
    const styleEl = document.createElement('style');
    styleEl.id = 'document-search-styles';
    styleEl.textContent = `
        .document-search-results {
            margin: 16px 0;
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .document-result {
            margin-bottom: 12px;
            background-color: var(--message-bg-color, rgba(255, 255, 255, 0.05));
            border-radius: 6px;
            overflow: hidden;
        }
        
        .document-name {
            font-weight: bold;
            padding: 8px 12px;
            background-color: var(--accent-color-light, rgba(79, 70, 229, 0.1));
            border-bottom: 1px solid var(--border-color, #e0e0e0);
        }
        
        .matches-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .match-item {
            padding: 10px 12px;
            border-bottom: 1px solid var(--border-color-light, rgba(224, 224, 224, 0.5));
        }
        
        .match-item:last-child {
            border-bottom: none;
        }
        
        .match-snippet {
            font-size: 0.9em;
            margin-bottom: 4px;
            line-height: 1.5;
        }
        
        .match-page {
            font-size: 0.8em;
            color: var(--label-color, #888);
        }
        
        .searching-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            color: var(--label-color, #888);
        }
        
        .searching-indicator i {
            margin-right: 8px;
            animation: pulse 1.5s infinite;
        }
        
        .no-results {
            padding: 16px;
            text-align: center;
            color: var(--label-color, #888);
        }
        
        .search-results-header, .ai-analysis-header {
            margin: 16px 0 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border-color, #e0e0e0);
        }
        
        .search-results-header h3, .ai-analysis-header h3 {
            margin: 0;
            font-size: 1.1em;
            font-weight: 600;
        }

            /* Document citation styles */
        .document-citation {
            display: inline-flex;
            align-items: center;
            color: var(--accent-color, #4f46e5);
            cursor: pointer;
            padding: 2px 4px;
            border-radius: 3px;
            background-color: rgba(79, 70, 229, 0.1);
            transition: background-color 0.2s;
        }
        
        .document-citation:hover {
            background-color: rgba(79, 70, 229, 0.2);
        }
            
            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }
        `;

    // Add to document head
    document.head.appendChild(styleEl);
}


async function generateSummaryWithAI(text, documentTitle, model, isMetaSummary = false, partNumber = null, totalParts = null) {
    // Check if we've been cancelled before even starting
    if (!summaryAbortController || summaryAbortController.signal.aborted) {
        throw new AbortError('Summary generation was cancelled');
    }

    // Prepare prompt for the AI
    let prompt;

    if (isMetaSummary) {
        prompt = `Below are summaries of different sections of the document "${documentTitle}". 
        Create a comprehensive but short final summary that captures the most important points across all sections.
        Organize the summary into sections if appropriate, and highlight key findings, arguments, or conclusions.
        
        ${text}`;
          } else {
              // Add internal note about which part this is - for logging purposes only
              const partInfo = partNumber ? ` (Processing part ${partNumber}/${totalParts})` : '';
              //console.log(`Generating summary for "${documentTitle}"${partInfo}`);
      
              prompt = `Please provide a comprehensive but short summary of the following document titled "${documentTitle}".
        Focus on the main points, key arguments, and important details.
        Organize the summary into sections if appropriate, and highlight any conclusions or recommendations.
        Do not mention part numbers or section numbers in your summary.
        
        ${text}`;
    }

    // Generate a unique request ID so we can potentially cancel it
    currentSummaryRequestId = `summary_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    const hashedMasterKey = documentUIElements.hashedMasterKey;
    const contextSize = document.getElementById('context-selector')?.value || 8192;
    //console.log('Using context size for summary:', contextSize);
    const systemPrompt = await buildSummarySystemPrompt(documentTitle);

    //console.log('System prompt built successfully, length:', systemPrompt?.length || 0);
    if (!systemPrompt || systemPrompt.length === 0) {
        console.warn('Warning: System prompt is empty despite successful building');
    }
    // Call the AI API with the prompt
    try {
        // Use OllamaAPI to send the request with proper handling of system prompt and parameters
        const response = await OllamaAPI.sendToOllama(
            prompt,                     // userPrompt 
            systemPrompt,               // systemPrompt
            contextSize,                // contextSize
            null,                       // previousContext
            summaryAbortController?.signal, // abortSignal
            currentSummaryRequestId     // requestId
        );

        if (!response || !response.body) {
            throw new Error('No response from Ollama');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        // Process the stream to extract just the response text
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const data = JSON.parse(line);
                        if (data.response) {
                            fullText += data.response;
                        }
                    } catch (error) {
                        console.error('Error parsing JSON line:', error);
                    }
                }
            }
        }

        //console.log('Summary: Successfully extracted response text');

        // CLEAN THINKING CONTAINERS HERE - before returning the summary
        fullText = fullText.replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
            .replace(/<reflection>[\s\S]*?<\/reflection>/gi, '')
            .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
            .replace(/<cot>[\s\S]*?<\/cot>/gi, '');

        return fullText;
    } catch (error) {
        // Error handling remains the same
        if (error.name === 'AbortError') {
            //console.log('Summary generation cancelled via AbortController');
        } else {
            console.error('Error generating AI summary:', error);
        }
        throw error;
    }

}
// Add this to documents_tab.js
async function buildSummarySystemPrompt(documentTitle) {
    return `You are a document summarization assistant. Your task is to create a clear, accurate, and objective summary of the provided document "${documentTitle}".
    
    Follow these guidelines:
    1. Maintain factual accuracy - never add information not present in the document
    2. Organize information logically using appropriate headings and sections
    3. Highlight key findings, insights, and important details
    4. Use bullet points for lists of related items
    5. Preserve the meaning and intent of the original document
    6. Format your summary with Markdown for better readability
    
    Focus solely on the document content without adding personal opinions or insights.`;
}
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
// Add a new function to display search results

function displaySearchResults(query, results) {
    const { documentsList } = documentUIElements;

    if (!results || results.length === 0) {
        documentsList.innerHTML = `
            <div class="empty-state">
                <p>No documents found matching "${query}"</p>
                <button id="clear-search" class="clear-search-button">Clear Search</button>
            </div>
        `;

        document.getElementById('clear-search').addEventListener('click', () => {
            documentUIElements.documentSearch.value = '';
            updateDocumentsList(true);
        });
        return;
    }

    // Show a header with search info
    documentsList.innerHTML = `
        <div class="search-results-header">
            <p>Found ${results.length} results for "${query}"</p>
            <button id="clear-search" class="clear-search-button">Clear Search</button>
        </div>
        <div class="search-results">
            ${results.map(result => {
        return `
                <div class="search-result-item">
                    <div class="result-document">
                        <h4 class="document-title" title="${result.documentName}">${result.documentName}</h4>
                        <span class="result-similarity">${Math.round(result.similarity * 100)}% match</span>
                    </div>
                    <div class="result-text">
                        ${highlightSearchText(result.text, query)}
                    </div>
                    <div class="result-actions">
                        <button class="copy-result" data-text="${encodeURIComponent(result.text)}">
                            Copy
                        </button>
                    </div>
                </div>
                `;
    }).join('')}
        </div>
    `;

    // Add event listener to clear search button
    document.getElementById('clear-search').addEventListener('click', () => {
        documentUIElements.documentSearch.value = '';
        updateDocumentsList(true);
    });

    // Add event listeners to "Copy" buttons (replaced from "Use in Chat")
    documentsList.querySelectorAll('.copy-result').forEach(button => {
        button.addEventListener('click', () => {
            const text = decodeURIComponent(button.dataset.text);

            // Copy text to clipboard
            navigator.clipboard.writeText(text)
                .then(() => {
                    // Change button text to indicate success
                    const originalText = button.textContent;
                    button.textContent = 'Copied!';
                    button.style.backgroundColor = '#10B981'; // Success green

                    // Reset the button after a short delay
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.backgroundColor = ''; // Reset to default color
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy text:', err);
                    button.textContent = 'Error';
                    setTimeout(() => {
                        button.textContent = 'Copy';
                    }, 2000);
                });
        });
    });
}

// Highlights search terms in result text for display
function highlightSearchText(text, query) {
    // Simple highlighting - can be improved with better matching
    const terms = query.split(' ').filter(term => term.length > 2);
    let highlightedText = text;

    terms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });

    return highlightedText;
}

// Adds CSS styles for the documents tab and related UI elements
function addDocumentStyles() {
    //console.log('RAG_Utils: Adding document styles');

    // Check if styles already exist
    if (document.getElementById('document-styles')) {
        //console.log('RAG_Utils: Document styles already exist');
        return;
    }

    const style = document.createElement('style');
    style.id = 'document-styles';
    style.textContent = `
    /* Document Tab Styles */
    #documents-tab {
        max-width: 360px !important;
        width: 100% !important;
        margin: 0 auto !important;
        padding: 0 !important;
        box-sizing: border-box !important;
    }
    
    .documents-area {
        padding: 16px !important;
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        max-width: 360px !important;
        width: 100% !important;
        margin: 0 auto !important;
        align-items: center !important;
        box-sizing: border-box !important; /* This is the key property */
    }
      .documents-area * {
        box-sizing: border-box !important;
    }
    .upload-zone {
        border: 2px dashed var(--border-color, #ccc) !important;
        border-radius: 8px !important;
        padding: 15px !important; /* Further reduced padding */
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        margin: 0 auto 20px auto !important;
        width: 300px !important; /* Hard-coded width */
        max-width: 300px !important;
        transition: all 0.3s ease !important;
        cursor: pointer !important;
        box-sizing: border-box !important;
    }
    
    .upload-icon {
        margin-bottom: 8px !important;
        color: var(--text-color-secondary, #666) !important;
    }
    
    .upload-icon svg {
        width: 48px !important; /* Further reduced */
        height: 24px !important;
    }
    .upload-text {
        text-align: center;
        color: var(--text-color-secondary, #666);
        font-size: 14px; /* Added smaller font size */
    }
    
    .browse-text {
        color: var(--accent-color, #4f46e5);
        cursor: pointer;
        text-decoration: underline;
    }
    
    .upload-progress {
        width: calc(100% - 50px);
        margin: 0 auto 20px auto;
    }
    
    .progress-bar-container {
        height: 6px;
        background-color: var(--border-color, #eee);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 8px;
    }
    
    .progress-bar-fill {
        height: 100%;
        background-color: var(--accent-color, #4f46e5);
        width: 0;
        transition: width 0.3s ease;
    }
    
    .progress-status {
        font-size: 14px;
        color: var(--text-color-secondary, #666);
        text-align: center;
    }
    
    .documents-list-container {
        flex: 1;
        overflow: auto;
        width: calc(100% - 50px);
        margin: 8px auto 0; /* Increase top margin */
        border-top: 0;
        padding-top: 0;
    }
    
    .documents-list-container h3 {
        margin-top: 0;
        margin-bottom: 4px; /* Reduce even more from 8px to 4px */
        color: var(--text-color-secondary, #666);
        font-size: 13px; /* Make the heading smaller */
        font-weight: 500;
    }
    
    .documents-list {
        display: flex;
        flex-direction: column;
        gap: 6px; /* Further reduce from 8px to 6px */
        padding-top: 0;
        max-height: none; /* Remove the max height */
        border: none; /* Remove the border */
        width: 100%;
        
    }
    
    .document-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 8px;
        background-color: var(--card-bg, #fff);
        border: 1px solid var(--border-color, #eee);
        border-radius: 6px;
        transition: all 0.2s ease;
        overflow: hidden; /* Prevent content overflow */
        cursor: pointer; /* Add pointer cursor to indicate clickable */
    }
    
    /* Add hover effect to document items */
    .document-item:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transform: translateY(-1px);
        border-color: var(--accent-color, #4f46e5);
    }
    .document-info {
        flex: 1;
        min-width: 0; /* This is crucial for text wrapping in flex items */
        padding-right: 8px; /* Add some space between info and actions */
    }
    
    .document-metadata {
        display: flex;
        flex-direction: column;
        gap: 4px; /* Reduce from 6px to 4px */
        font-size: 12px;
        color: var(--text-color-secondary, #666);
    }
    
    .document-title {
        margin: 0 0 6px 0;
        font-size: 15px;
        color: var(--text-color) !important; /* Use theme variable instead */
        font-weight: 600;
        word-wrap: break-word;
        word-break: break-word;
        overflow-wrap: break-word;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.3;
        max-width: 100%;
    }
        
        /* Show full title on hover */
        .document-item:hover .document-title {
            -webkit-line-clamp: initial; /* Remove line clamp on hover */
            overflow: visible; /* Show all content */
            z-index: 1; /* Show above other elements if needed */
        }
        
        .document-actions {
            display: flex;
            align-items: flex-end;
            flex-direction: column;
            gap: 8px;
            flex-shrink: 0; /* Prevent shrinking */
        }
        
        .status-container {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
        }
        
        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap; /* Keep status on one line */
        }
        
        .status-badge.processing {
            background-color: #fff8e6;
            color: #b45309;
        }
        
        .status-badge.completed {
            background-color: #ecfdf5;
            color: #047857;
        }
        
        .delete-document {
            background: none;
            border: none;
            color: #ef4444;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            transition: all 0.2s;
        }
        
        .delete-document:hover {
            background-color: #fef2f2;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 0;
            color: var(--text-color-secondary, #666);
        }
        
        .loading-indicator {
            text-align: center;
            padding: 20px 0;
            color: var(--text-color-secondary, #666);
        }
            
        `;
        style.textContent += `
        /* Updated Search Results Styles */
        .search-results-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding: 4px 0;
            border-bottom: 1px solid var(--border-color, #eee);
        }
        
        .search-results-header p {
            margin: 0;
            font-size: 14px;
            color: var(--text-color, #333);
        }
        
        .clear-search-button {
            background: none;
            border: 1px solid var(--border-color, #ccc);
            border-radius: 4px;
            padding: 3px 8px;
            font-size: 12px;
            cursor: pointer;
            color: var(--text-color, #333);
        }
        
        .search-result-item {
            padding: 8px;
            border: 1px solid var(--border-color, #eee);
            border-radius: 6px;
            margin-bottom: 8px;
            background-color: var(--card-bg, #fff);
        }
        
        .result-document {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }
        
        /* Apply same document-title styling to search results */
        .result-document h4.document-title {
            margin: 0;
            font-size: 14px;
            color: var(--text-color, #f0f0f0) !important;
            font-weight: 600;
            word-wrap: break-word;
            word-break: break-word;
            overflow-wrap: break-word;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            line-height: 1.3;
            max-width: 75%;
        }
        
        /* Show full title on hover for search results */
        .search-result-item:hover .document-title {
            -webkit-line-clamp: initial;
            overflow: visible;
            z-index: 1;
        }
        
        .result-similarity {
            font-size: 12px;
            color: var(--accent-color, #4f46e5);
            padding: 2px 6px;
            background-color: rgba(79, 70, 229, 0.1);
            border-radius: 12px;
            white-space: nowrap;
        }
        
        .result-text {
            font-size: 12px;
            line-height: 1.5;
            color: #333 !important;
            margin-bottom: 8px;
            max-height: 100px;
            overflow-y: auto;
            padding: 4px;
            background-color: #f9f9f9;
            border-radius: 4px;
        }
        
        .result-text mark {
            background-color: rgba(255, 213, 86, 0.4);
            padding: 0 2px;
            border-radius: 2px;
            color: #000 !important;
        }
        
        .result-actions {
            display: flex;
            justify-content: flex-end;
        }
        
        /* Style for the new Copy button (replacing Use in Chat) */
        .copy-result {
            background-color: var(--accent-color, #4f46e5);
            color: white !important;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .copy-result:hover {
            background-color: #4338ca;
            color: white !important;
        }
        
        /* Override any other styles that might affect the copy button text */
        .result-actions button.copy-result {
            color: white !important;
        }
        
        /* Exception for all buttons in search results with white text */
        .search-results button.copy-result, 
        .search-result-item button.copy-result {
            color: white !important;
        }
        
        .search-button {
            margin-top: 8px;
            width: 100%;
            padding: 8px 12px;
            height: 36px; /* Match input field height */
            background-color: var(--accent-color, #4f46e5);
            color: white !important;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            transition: background-color 0.2s;
            margin-bottom: 16px; /* Add space after the button */
        }
        .search-button:hover {
            background-color: #4338ca;
        }
        
        /* Ensure proper spacing between input and button */
        #document-search {
            width: 100%;
            padding: 8px 30px 8px 10px;
            border: 1px solid var(--border-color, #ccc);
            border-radius: 4px;
            font-size: 14px;
            margin-bottom: 8px;
            height: 36px; /* Explicitly set height */
        }
        
         .search-container {
            position: relative;
            display: flex;
            flex-direction: column;
            margin-bottom: 10px;
        }
        
        #document-search {
            width: 100%;
            padding: 8px 30px 8px 10px;
            border: 1px solid var(--border-color, #ccc);
            border-radius: 4px;
            font-size: 14px;
            margin-bottom: 8px;
        }
        `;
        style.textContent += `
        /* Fix for search result text color */
        .search-result-item {
            color: #333 !important; /* Force dark text color */
        }
        
        .result-text {
            color: #333 !important; /* Force dark text for result text */
            background-color: #f9f9f9;
        }
        
        .result-document h4 {
            color: #333 !important; /* Force dark text for document titles */
        }
        
        /* Ensure contrast for marks (highlighted text) */
        .result-text mark {
            background-color: rgba(255, 213, 86, 0.4);
            color: #000 !important;
        }
        
        /* Force dark text in all elements within results */
        .search-results * {
            color: #333 !important;
        }
        
        /* Exception for buttons */
        .use-in-chat {
            color: white !important;
        }
        `;
        style.textContent += `
        /* Document Summary Modal Styles with Theme Support */
        .document-summary-modal {
            font-family: inherit;
        }
        
        .document-summary-content {
            position: relative;
            animation: modalFadeIn 0.3s;
            background-color: var(--card-bg, #fff);
            color: var(--text-color, #333);
            border-color: var(--border-color, #ccc);
        }
        
        @keyframes modalFadeIn {
            from {opacity: 0; transform: translateY(-20px);}
            to {opacity: 1; transform: translateY(0);}
        }
        
        .document-summary-body {
            line-height: 1.6;
            color: var(--text-color, #333);
        }
        
        .document-summary-body h1, 
        .document-summary-body h2, 
        .document-summary-body h3 {
            color: var(--text-color, #333);
            margin-top: 20px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .document-summary-body h1 {
            font-size: 24px;
            border-bottom: 1px solid var(--border-color, #eee);
            padding-bottom: 6px;
        }
        
        .document-summary-body h2 {
            font-size: 20px;
        }
        
        .document-summary-body h3 {
            font-size: 18px;
        }
      .document-summary-body h4 {
        color: var(--text-color, #333);
        margin-top: 16px;
        margin-bottom: 8px;
        font-size: 16px;
        font-weight: 600;
    }
    
    /* Dark theme compatibility */
    body.dark-theme .document-summary-body h4 {
        color: var(--text-color, #f0f0f0);
    }
        .document-summary-body p {
            margin-bottom: 16px;
            color: var(--text-color, #333);
        }
        
        .document-summary-body ul, 
        .document-summary-body ol {
            margin-bottom: 16px;
            padding-left: 20px;
            color: var(--text-color, #333);
        }
        
        .document-summary-body li {
            margin-bottom: 4px;
        }
        
        .document-summary-body strong {
            color: var(--text-color, #333);
            font-weight: 600;
        }
        
        .document-summary-body .code-block {
            margin: 16px 0;
            background-color: var(--code-bg, #f6f8fa);
            border-radius: 6px;
            overflow: hidden;
        }
        
        .document-summary-body .inline-code {
            background-color: var(--code-bg, rgba(0,0,0,0.05));
            padding: 2px 4px;
            border-radius: 3px;
            font-family: monospace;
        }
        
        .document-summary-body blockquote {
            border-left: 4px solid var(--border-color, #eee);
            padding-left: 16px;
            margin: 16px 0;
            color: var(--text-color-secondary, #666);
        }
        
        /* Section breaks styling */
        .document-summary-body hr {
            border: 0;
            height: 1px;
            background-color: var(--border-color, #eee);
            margin: 24px 0;
        }
        
        /* Dark mode specific overrides */
        body.dark-theme .document-summary-body .code-block {
            background-color: var(--code-bg, #2d2d2d);
            border: 1px solid var(--border-color, #444);
        }
        
        body.dark-theme .document-summary-body .inline-code {
            background-color: rgba(255,255,255,0.1);
        }
        
        /* Improve the copy button */
        #document-summary-copy {
            margin-top: 16px;
            background-color: var(--accent-color, #4f46e5);
        }
        
        #document-summary-copy:hover {
            background-color: var(--accent-color-hover, #4338ca);
        }
        
        /* Style section breaks that come from our "--- Section Break ---" text */
        .document-summary-body p:contains("Section Break") {
            display: none;
        }
        
        .document-summary-body p:contains("Section Break") + * {
            margin-top: 24px;
        }
        `;
        style.textContent += `
        /* Processing indicator styles */
        .processing-indicator {
            display: flex;
            align-items: center;
            margin-top: 12px;
            padding: 8px 12px;
            background-color: var(--card-bg, #f5f5f5);
            border-radius: 4px;
            font-size: 14px;
            color: var(--text-color-secondary, #666);
        }
        
        .pulse-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--accent-color, #4f46e5);
            margin-right: 8px;
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% {
                transform: scale(0.95);
                opacity: 0.8;
            }
            50% {
                transform: scale(1.1);
                opacity: 1;
            }
            100% {
                transform: scale(0.95);
                opacity: 0.8;
            }
        }
        
        /* Summary notification styles */
        .summary-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 16px;
        background-color: var(--card-bg, #fff);
        border: 1px solid var(--border-color, #eee);
        border-left: 4px solid var(--accent-color, #4f46e5);
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1100;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    }
    
    .summary-notification p {
        margin: 0 0 8px;
        font-size: 14px;
        color: var(--text-color, #333);
    }
    
    .summary-notification p:last-child {
        margin-bottom: 0;
        font-size: 12px;
        color: var(--text-color-secondary, #666);
    }
    
    .summary-notification.fade-out {
        animation: fadeOut 0.5s ease-out forwards;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(50px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
        `;
        style.textContent += `
        /* Document selection styles */
        .document-item.selected {
            border: 2px solid #10B981;
            box-shadow: 0 0 0 1px #10B981;
            position: relative;
        }
        
        .document-item.selected::before {
            content: "✓";
            position: absolute;
            top: -8px;
            right: -8px;
            width: 20px;
            height: 20px;
            background-color: #10B981;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .selected-document-actions {
            background-color: #f0fdf4;
            border: 1px solid #10B981;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .selected-document-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .selected-document-info span {
            font-weight: 500;
            color: #047857;
        }
        
        .selected-document-buttons {
            display: flex;
            gap: 8px;
        }
        
        .selected-document-buttons button {
            flex: 1;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            border: none;
        }
        
        .selected-document-buttons .primary-action {
            background-color: #10B981;
            color: white;
        }
        
        .selected-document-buttons .secondary-action {
            background-color: white;
            border: 1px solid #10B981;
            color: #10B981;
        }
        
        #deselect-document {
            background: none;
            border: none;
            color: #6B7280;
            cursor: pointer;
            font-size: 12px;
            text-decoration: underline;
        }
        
        /* Document questioning indicator styles */
        .document-questioning-indicator {
            background-color: #f0fdf4;
            border: 1px solid #10B981;
            border-radius: 6px;
            padding: 10px 16px;
            margin-bottom: 12px;
        }
        
        .document-questioning-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .document-questioning-info span {
            font-weight: 500;
            color: #047857;
            font-size: 14px;
        }
        
        .exit-questioning {
            background: none;
            border: 1px solid #10B981;
            color: #10B981;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            cursor: pointer;
        }
        
        /* Dark theme compatibility */
        body.dark-theme .document-item.selected {
            border-color: #059669;
            box-shadow: 0 0 0 1px #059669;
        }
        
        body.dark-theme .document-item.selected::before {
            background-color: #059669;
        }
        
        body.dark-theme .selected-document-actions {
            background-color: rgba(5, 150, 105, 0.1);
            border-color: #059669;
        }
        
        body.dark-theme .selected-document-info span {
            color: #34D399;
        }
        
        body.dark-theme .selected-document-buttons .primary-action {
            background-color: #059669;
        }
        
        body.dark-theme .selected-document-buttons .secondary-action {
            background-color: transparent;
            border-color: #059669;
            color: #34D399;
        }
        
        body.dark-theme .document-questioning-indicator {
            background-color: rgba(5, 150, 105, 0.1);
            border-color: #059669;
        }
        
        body.dark-theme .document-questioning-info span {
            color: #34D399;
        }
        
        body.dark-theme .exit-questioning {
            border-color: #059669;
            color: #34D399;
        }
        
        body.dark-theme .exit-questioning:hover {
            background-color: #059669;
            color: white;
        }
        `;
    
        style.textContent += `
        /* Enhanced Document Summary Styling */
        .summary-content {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.7;
            color: var(--text-color, #333);
        }
        
        /* Heading styles with visual hierarchy */
        .summary-h1 {
            font-size: 24px;
            color: var(--accent-color, #4f46e5);
            margin: 24px 0 16px 0;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border-color, #eee);
            font-weight: 700;
        }
        
        .summary-h2 {
            font-size: 20px;
            color: var(--text-color, #333);
            margin: 20px 0 14px 0;
            font-weight: 600;
        }
        
        .summary-h3 {
            font-size: 18px;
            color: var(--text-color, #333);
            margin: 18px 0 12px 0;
            font-weight: 600;
        }
        
        .summary-h4 {
            font-size: 16px;
            color: var(--text-color-secondary, #555);
            margin: 16px 0 10px 0;
            font-weight: 600;
        }
        
        /* Make first heading have no top margin */
        .summary-content > .summary-h1:first-child,
        .summary-content > .summary-h2:first-child,
        .summary-content > .summary-h3:first-child,
        .summary-content > .summary-h4:first-child {
            margin-top: 0;
        }
        
        /* Paragraph styling */
        .summary-paragraph {
            margin: 0 0 16px 0;
            line-height: 1.7;
        }
        
        /* List styling */
        .summary-list {
            padding-left: 24px;
            margin: 0 0 16px 0;
        }
        
        .summary-list-item {
            margin-bottom: 8px;
            line-height: 1.6;
            position: relative;
        }
        
        /* Section dividers */
        .section-divider {
            height: 1px;
            background: linear-gradient(to right, transparent, var(--border-color, #ddd), transparent);
            margin: 24px 0;
        }
        
        /* Code styling */
        .document-summary-body pre.code-block {
            background-color: var(--code-bg, #f6f8fa);
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 16px 0;
            border: 1px solid var(--border-color, #eee);
        }
        
        .document-summary-body code.inline-code {
            background-color: var(--code-bg, #f6f8fa);
            padding: 2px 4px;
            border-radius: 4px;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
            font-size: 0.9em;
            color: var(--accent-color, #4f46e5);
        }
        
        /* Dark theme support */
        body.dark-theme .summary-h1 {
            color: var(--accent-color, #6366f1);
        }
        
        body.dark-theme .summary-h2,
        body.dark-theme .summary-h3 {
            color: var(--text-color, #e0e0e0);
        }
        
        body.dark-theme .summary-h4 {
            color: var(--text-color-secondary, #b0b0b0);
        }
        
        body.dark-theme .document-summary-body pre.code-block {
            background-color: var(--code-bg, #282c34);
            border-color: var(--border-color, #3e4451);
        }
        
        body.dark-theme .document-summary-body code.inline-code {
            background-color: var(--code-bg, #282c34);
            color: #7dd3fc;
        }
        
        /* Content editable hint styling */
        .document-summary-body .editable-notice {
            background-color: rgba(79, 70, 229, 0.1);
            border-left: 3px solid var(--accent-color, #4f46e5);
            padding: 10px 12px;
            margin-bottom: 16px;
            border-radius: 4px;
            font-size: 14px;
            color: var(--text-color-secondary, #666);
            display: flex;
            align-items: center;
        }
        
        .document-summary-body .editable-notice::before {
            content: "✏️";
            margin-right: 8px;
            font-size: 16px;
        }
    `;
    document.head.appendChild(style);
    //console.log('RAG_Utils: Document styles added to page');
}
// Function to explicitly add progress bar styles
function addProgressBarStyles() {
    // Create a style element if it doesn't exist
    let styleElement = document.getElementById('rag-progress-styles');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'rag-progress-styles';
        document.head.appendChild(styleElement);
    }

    // Add explicit styles for the progress bar
    const styles = `
        .progress-bar-container {
            height: 6px;
            background-color: #e0e0e0;
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 8px;
        }
        
        .progress-bar-fill {
            height: 100%;
            background-color: #4f46e5;
            width: 0%;
            transition: width 0.3s ease;
        }
        
        /* Add dark mode support */
        [data-theme="dark"] .progress-bar-container {
            background-color: #444;
        }
        
        [data-theme="dark"] .progress-bar-fill {
            background-color: #6366f1;
        }
    `;

    styleElement.textContent = styles;
    //console.log('Progress bar styles added to document');
}

// Add a function to add document mode styles
function addDocumentModeStyles() {
    // Check if styles already exist
    if (document.getElementById('document-mode-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'document-mode-styles';
    style.textContent = `
    /* Document Mode Indicator Styles */
    .document-questioning-indicator {
        position: relative;
        background-color: #f0fdf4;
        border: 1px solid #10B981;
        border-radius: 6px;
        padding: 10px 16px;
        margin: 0 auto 12px;
        width: 800px; /* Match the chat width */
        box-sizing: border-box;
        z-index: 5;
        animation: slideDown 0.3s ease-out;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    @keyframes slideDown {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    .document-questioning-indicator.fade-out {
        animation: fadeOut 0.3s ease-out forwards;
    }

    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
    }

    .document-questioning-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
    }

    .mode-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .mode-indicator.document-mode .mode-icon {
        color: #059669;
        font-size: 16px;
    }

    .mode-indicator.document-mode .mode-label {
        font-weight: 500;
        color: #047857;
    }

    .document-details {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .document-name {
        max-width: 300px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #047857;
        font-weight: 400;
    }

    .exit-questioning {
        background: none;
        border: 1px solid #10B981;
        color: #10B981;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .exit-questioning:hover {
        background-color: #10B981;
        color: white;
    }

    /* Tab highlight animation */
    .highlight-tab {
        animation: highlightPulse 3s ease-out;
    }

    @keyframes highlightPulse {
        0%, 100% { background-color: transparent; }
        50% { background-color: rgba(16, 185, 129, 0.2); }
    }

    /* Dark theme compatibility */
    body.dark-theme .document-questioning-indicator {
        background-color: rgba(5, 150, 105, 0.1);
        border-color: #059669;
    }

    body.dark-theme .mode-indicator.document-mode .mode-icon,
    body.dark-theme .mode-indicator.document-mode .mode-label,
    body.dark-theme .document-name {
        color: #34D399;
    }

    body.dark-theme .exit-questioning {
        border-color: #059669;
        color: #34D399;
    }

    body.dark-theme .exit-questioning:hover {
        background-color: #059669;
        color: white;
    }
        
    `;

    const sectionBreakStyle = document.createElement('style');
    sectionBreakStyle.textContent = `
    .section-break {
        text-align: center;
        margin: 20px 0;
        color: var(--text-color-secondary, #666);
        font-size: 14px;
        font-style: italic;
        position: relative;
    }
    
    .section-break::before,
    .section-break::after {
        content: "";
        display: inline-block;
        height: 1px;
        width: 80px;
        background-color: var(--border-color, #ddd);
        vertical-align: middle;
        margin: 0 10px;
    }
    
    .partial-summaries-content {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--border-color, #eee);
    }
`;
    const markdownEditableStyles = document.createElement('style');
    markdownEditableStyles.textContent = `
  /* Ensure inline styles work in contentEditable fields */
  [contenteditable] strong, 
  [contenteditable] .summary-h1 strong,
  [contenteditable] .summary-h2 strong, 
  [contenteditable] .summary-h3 strong {
    font-weight: bold !important;
  }
  
  [contenteditable] em,
  [contenteditable] .summary-h1 em,
  [contenteditable] .summary-h2 em,
  [contenteditable] .summary-h3 em {
    font-style: italic !important;
  }
  
  [contenteditable] code.inline-code {
    background-color: var(--code-bg, rgba(0,0,0,0.05)) !important;
    padding: 2px 4px !important;
    border-radius: 3px !important;
    font-family: monospace !important;
    display: inline !important;
  }
  
  [contenteditable] a {
    color: var(--accent-color, #4f46e5) !important;
    text-decoration: underline !important;
  }
`;
    document.head.appendChild(markdownEditableStyles);
    document.head.appendChild(sectionBreakStyle);
    document.head.appendChild(style);
}
function restoreProcessingState() {
    if (!documentProcessingState.isProcessing) return;

    //console.log('Restoring document processing UI state');

    const { uploadZone, progressContainer, progressStatus } = documentUIElements;

    if (uploadZone) uploadZone.style.display = 'none';
    if (progressContainer) progressContainer.style.display = 'block';

    // Restore progress bar
    const progressBarFill = document.getElementById('progress-bar-fill');
    if (progressBarFill) {
        const percentComplete = Math.round(documentProcessingState.currentProgress * 100);
        progressBarFill.style.width = `${percentComplete}%`;
    }

    // Check if processing is complete (progress at or near 100%)
    if (documentProcessingState.currentProgress >= 0.99) {
        if (progressStatus) {
            progressStatus.textContent = Lang.get('ragDocumentsProcessed');
        }

        // Add this code to properly reset the UI when the processing is complete
        // This ensures the UI resets when returning to the documents tab after completion
        setTimeout(() => {
            // Reset UI elements
            if (uploadZone) uploadZone.style.display = 'flex';
            if (progressContainer) progressContainer.style.display = 'none';
            if (documentUIElements.fileInput) documentUIElements.fileInput.value = '';

            // Reset processing state flags
            documentProcessingState.isProcessing = false;
            documentProcessingState.isPaused = false;

            // Clear any monitoring interval
            if (window.documentPauseStateInterval) {
                clearInterval(window.documentPauseStateInterval);
                window.documentPauseStateInterval = null;
            }

            //console.log('Document processing UI reset due to completed state');

            // Refresh the documents list to show the newly processed documents
            updateDocumentsList(true);
        }, 1500);

        return;
    }

    // IMPORTANT: Add check to fetch latest processing status from RAG module
    if (window.RAG && typeof window.RAG.getProcessingStatus === 'function') {
        try {
            const latestStatus = window.RAG.getProcessingStatus();
            if (latestStatus) {
                documentProcessingState.statusMessage = latestStatus;
            }
        } catch (error) {
            console.error('Error getting latest processing status:', error);
        }
    }

    // Rest of the function remains the same...
    if (progressStatus) {
        // Check if AI is generating (causing a pause)
        const isAIGenerating = window.isGenerating === true;

        if (isAIGenerating) {
            // AI is generating, show pause message
            documentProcessingState.isPaused = true;
            if (!documentProcessingState.originalStatusMessage) {
                documentProcessingState.originalStatusMessage = documentProcessingState.statusMessage;
            }
            progressStatus.textContent = Lang.get('ragProcessingPaused') ||
                'Document processing paused until AI finishes current conversation';
        } else {
            // AI is not generating, show normal status
            progressStatus.textContent = documentProcessingState.statusMessage;

            // If it had been paused before, update flags
            if (documentProcessingState.isPaused) {
                documentProcessingState.isPaused = false;
            }
        }
    }

    // If processing has been going on for more than 5 minutes and not paused, show elapsed time
    const elapsedTime = Math.round((Date.now() - documentProcessingState.startTime) / 1000 / 60);
    if (elapsedTime >= 5 && !documentProcessingState.isPaused) {
        let timeStatus = `${documentProcessingState.statusMessage} (${elapsedTime} minutes elapsed)`;
        if (progressStatus) progressStatus.textContent = timeStatus;
    }

    // Start the pause state monitoring again
    if (!window.documentPauseStateInterval) {
        window.documentPauseStateInterval = setInterval(updateDocumentProcessingPauseState, 500);
    }
}

function updateDocumentProcessingPauseState() {
    // Only proceed if we're processing documents
    if (!documentProcessingState.isProcessing) return;

    const { progressStatus } = documentUIElements;
    if (!progressStatus) return;

    // Check if AI is generating (causing processing to pause)
    const isAIGenerating = window.isGenerating === true;

    // Check if processing is complete (100%)
    const progressBarFill = document.getElementById('progress-bar-fill');
    const isComplete = progressBarFill && progressBarFill.style.width === '100%';

    // If processing is complete, show success message regardless of AI state
    if (isComplete) {
        progressStatus.textContent = Lang.get('ragDocumentsProcessed');
        return;
    }

    // Otherwise handle pause/resume as before
    if (isAIGenerating && !documentProcessingState.isPaused) {
        // AI just started generating - set paused state
        documentProcessingState.isPaused = true;
        documentProcessingState.originalStatusMessage = documentProcessingState.statusMessage;

        // Update the UI to show processing is paused
        progressStatus.textContent = Lang.get('ragProcessingPaused') ||
            'Document processing paused until AI finishes current conversation';

        //console.log('Document processing paused due to AI generation');
    }
    else if (!isAIGenerating && documentProcessingState.isPaused) {
        // AI finished generating - restore processing state
        documentProcessingState.isPaused = false;

        // Restore the original status message, but don't override completion
        if (documentProcessingState.originalStatusMessage) {
            progressStatus.textContent = documentProcessingState.statusMessage =
                documentProcessingState.originalStatusMessage;
        } else {
            progressStatus.textContent = documentProcessingState.statusMessage =
                Lang.get('ragProcessingStatus');
        }

        //console.log('Document processing resumed after AI generation');
    }
}

function addTableOfContents(summaryBody) {
    // Only add TOC if there are enough headings
    const headings = summaryBody.querySelectorAll('h1, h2, h3');
    if (headings.length <= 2) return; // Not enough headings for a TOC

    const tocContainer = document.createElement('div');
    tocContainer.className = 'summary-toc';
    tocContainer.innerHTML = `<h2 class="toc-title">${Lang.get('tocTitle') || 'Table of Contents'}</h2><ul class="toc-list"></ul>`;

    const tocList = tocContainer.querySelector('.toc-list');

    // Add each heading to the TOC
    headings.forEach((heading, index) => {
        // Create ID for the heading if it doesn't have one
        if (!heading.id) {
            heading.id = `heading-${index}`;
        }

        const tocItem = document.createElement('li');
        tocItem.className = `toc-item toc-${heading.tagName.toLowerCase()}`;

        // Create anchor element without setting its content yet
        const tocLink = document.createElement('a');
        tocLink.href = `#${heading.id}`;
        tocLink.className = 'toc-link';

        // Clone heading's content nodes to preserve ALL formatting exactly as-is
        // This is more reliable than using innerHTML for formatted content
        heading.childNodes.forEach(node => {
            const clonedNode = node.cloneNode(true);
            tocLink.appendChild(clonedNode);
        });

        // If nothing got copied (empty heading), use textContent as fallback
        if (!tocLink.hasChildNodes()) {
            tocLink.textContent = heading.textContent;
        }

        tocItem.appendChild(tocLink);
        tocList.appendChild(tocItem);

        // Add click event for smooth scrolling
        tocLink.addEventListener('click', (e) => {
            e.preventDefault();
            heading.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Insert TOC after the editable notice
    const editableNotice = summaryBody.querySelector('.editable-notice');
    if (editableNotice) {
        editableNotice.after(tocContainer);
    } else {
        summaryBody.prepend(tocContainer);
    }

    // Add TOC styles
    const tocStyles = document.createElement('style');
    tocStyles.textContent = `
        .summary-toc {
    background-color: var(--card-bg, #f9fafb);
    border-radius: 6px;
    padding: 16px;
    margin: 0 0 24px 0;
    border: 1px solid var(--border-color, #eee);
    }
    
    .toc-title {
        margin: 0 0 12px 0;
        font-size: 18px;
        color: var(--text-color, #333);
        font-weight: 600;
    }
    
    .toc-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    
    .toc-item {
        margin-bottom: 6px;
        line-height: 1.4;
    }
    
    .toc-h1 {
        font-weight: 600;
    }
    
    .toc-h2 {
        padding-left: 16px;
        font-size: 0.95em;
    }
    
    .toc-h3 {
        padding-left: 32px;
        font-size: 0.9em;
    }
    
    .toc-link {
        color: var(--accent-color, #4f46e5);
        text-decoration: none;
        display: block;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s;
    }
    
    .toc-link:hover {
        background-color: rgba(79, 70, 229, 0.1);
        padding-left: 12px;
    }
            
            /* Use media queries to match the rest of the theme system */
            @media (prefers-color-scheme: dark) {
                .summary-toc {
                    background-color: var(--card-bg, #2b2b2b);
                    border-color: var(--card-border, #404040);
                }
                
                .toc-title {
                    color: var(--card-title, #f5f5f5);
                }
                
                .toc-link {
                    color: var(--accent-color,rgb(180, 176, 250));
                }
                
                .toc-link:hover {
                    background-color: var(--accent-color-hover,rgb(255, 255, 255));
                    color: var(--accent-text, white);
                }
            }
        `;
    document.head.appendChild(tocStyles);
}

function scrollSummaryToTop() {
    // Find all potentially scrollable elements
    const summaryBody = document.getElementById('document-summary-body');
    const modalContent = document.querySelector('.document-summary-content');

    // Create array of elements to scroll (in descending order of priority)
    const scrollTargets = [summaryBody, modalContent];

    // Try to scroll each element to the top
    scrollTargets.forEach(element => {
        if (element) {
            requestAnimationFrame(() => {
                element.scrollTop = 0;
            });
        }
    });
}
addDocumentStyles();

// Create a custom AbortError class
class AbortError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AbortError';
    }
}

window.initializeDocumentUI = initializeDocumentUI;
window.updateDocumentQuestioningUI = updateDocumentQuestioningUI;
window.addDocumentModeStyles = addDocumentModeStyles;
// Export the module functions
window.RAG_Utils = {
    initializeDocumentUI,
    updateDocumentsList,
    enableDocumentQuestioningMode,
    exitDocumentQuestioningMode,
    updateDocumentQuestioningUI,
    showNotification,
    handleDocumentGlobalSearch,
    addDocumentSearchStyles,
    isDocumentProcessing: () => !!documentProcessingState.isProcessing
};

window.documentsTabLoaded = true;