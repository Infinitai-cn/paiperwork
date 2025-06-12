// Global variables for code preview functionality

let htmlPreviewOriginalContent = '';
let htmlPreviewIsErrorPage = false;


function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve();
        script.onerror = (e) => reject(new Error(`Failed to load script: ${url}`));
        document.head.appendChild(script);
    });
}

// HTML code execution functionality
window.runHtmlCode = function (button) {
    //console.log('Running HTML code...');
    const codeBlock = button.closest('.code-block');
    if (!codeBlock) return;

    const codeElement = codeBlock.querySelector('code');
    if (!codeElement) return;

    // Get clean HTML code
    let htmlContent = codeElement.dataset.cleanCode || extractTextContent(codeElement);


    //console.log('HTML content to run:', htmlContent.substring(0, 50) + '...');

    // Create and get modal if it doesn't exist
    let modal = document.getElementById('html-preview-modal');
    let iframe = document.getElementById('html-preview-frame');

    if (!modal || !iframe) {
        createHtmlPreviewModal();
        modal = document.getElementById('html-preview-modal');
        iframe = document.getElementById('html-preview-frame');
        if (!modal || !iframe) {
            alert(Lang.get('previewModalCreateError'));
            return;
        }
    }

    // Try to run the HTML code, handling errors gracefully
    try {
        // Parse the HTML to find any obvious syntax errors
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const parseErrors = doc.querySelectorAll('parsererror');

        if (parseErrors.length > 0) {
            throw new Error('HTML parsing error: ' + parseErrors[0].textContent);
        }

        // Add error handling to inline scripts
        htmlContent = addErrorHandlingToScripts(htmlContent);

        // Set the global flag to indicate this is NOT an error page
        htmlPreviewIsErrorPage = false;

        // Add this to the beginning of iframe content loading in window.runHtmlCode

        // Before writing content to iframe, show loading indicator
        const loadingHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f8f9fa;
            font-family: system-ui, sans-serif;
        }
        .loader {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-left-color: #09f;
            animation: spin 1s linear infinite;
            margin-bottom: 15px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .message {
            font-size: 16px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="loader">
        <div class="spinner"></div>
        <div class="message">${Lang.get('previewLoadingMessage')}</div>
    </div>
</body>
</html>
`;

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(loadingHTML);
        iframeDoc.close();

        // Add a slight delay to show loading indicator before rendering actual content
        setTimeout(() => {
            // Then write the actual content
            iframeDoc.open();
            iframeDoc.write(htmlContent);
            iframeDoc.close();

            // Store content for refresh
            htmlPreviewOriginalContent = htmlContent;
        }, 300);

        // Store content for refresh
        htmlPreviewOriginalContent = htmlContent;

        // Display the modal
        modal.style.display = 'block';
        //console.log('HTML preview modal opened');
    } catch (error) {
        console.error('Error preparing HTML preview:', error);
        showHtmlErrorPage(iframe, error, htmlContent);
    }
};

// Helper function to extract text from DOM elements
function extractTextContent(element) {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = element.innerHTML;

    // Extract text content
    let plainText = '';
    const extractTextFromNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            plainText += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            for (const childNode of node.childNodes) {
                extractTextFromNode(childNode);
            }
        }
    };

    for (const childNode of tempElement.childNodes) {
        extractTextFromNode(childNode);
    }

    // Unescape HTML entities
    return plainText
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
}

// Add error handling to scripts in HTML content
function addErrorHandlingToScripts(htmlContent) {
    // Get the translated error message text before injecting into script
    const errorMessage = Lang.get('previewJsError');

    // Create the error handler with the pre-translated text
    const errorHandler = `
    <script>
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('Error in preview:', message, 'at', source, lineno, colno);
        if (!document.querySelector('.js-error-overlay')) {
            var errorDiv = document.createElement('div');
            errorDiv.className = 'js-error-overlay';
            errorDiv.style.cssText = 'position:fixed; bottom:0; left:0; right:0; background:#f44336; color:white; padding:10px; z-index:9999; font-family:sans-serif;';
            errorDiv.innerHTML = '<strong>${errorMessage}</strong> ' + message + (source ? ' in ' + source.split('/').pop() + ':' + lineno : '');
            document.body.appendChild(errorDiv);
        }
        return true; // Prevents default error handling
    };
    </script>
    `;

    // Wrap inline scripts with try-catch
    htmlContent = htmlContent.replace(/<script([^>]*)>([\s\S]*?)<\/script>/gi, function (match, attrs, code) {
        return `<script${attrs}>
    try {
    ${code}
    } catch (error) {
        console.error('Script error:', error);
        document.body.innerHTML += '<div style="position:fixed; bottom:0; left:0; right:0; background:#f44336; color:white; padding:10px; z-index:9999; font-family:sans-serif;">' + '${Lang.get('previewJsError')}' + ': ' + error.message + '</div>';
    }
    </script>`;
    });

    // Insert the error handler at the beginning of the content
    const headEndPos = htmlContent.indexOf('</head>');
    if (headEndPos !== -1) {
        htmlContent = htmlContent.slice(0, headEndPos) + errorHandler + htmlContent.slice(headEndPos);
    } else {
        // No head tag found, add one
        const htmlStartPos = htmlContent.indexOf('<html');
        if (htmlStartPos !== -1) {
            const htmlEndPos = htmlContent.indexOf('>', htmlStartPos) + 1;
            htmlContent = htmlContent.slice(0, htmlEndPos) +
                '<head>' + errorHandler + '</head>' +
                htmlContent.slice(htmlEndPos);
        } else {
            // No html tag, just prepend
            htmlContent = '<html><head>' + errorHandler + '</head>' + htmlContent + '</html>';
        }
    }

    return htmlContent;
}
// Show error page in HTML preview
function showHtmlErrorPage(iframe, error, htmlContent) {
    // Set the global flag to indicate this IS an error page
    htmlPreviewIsErrorPage = true;

    // NEW: Extract line number from error if available
    let lineNumber = null;
    let columnNumber = null;
    let errorMessage = error.message;

    // Try to extract line info from the error message
    const lineMatch = error.message.match(/line\s+(\d+)/i) ||
        error.message.match(/at\s+line\s+(\d+)/i);

    if (lineMatch) {
        lineNumber = parseInt(lineMatch[1], 10);
    }

    // Use error's line number property if available
    if (error.lineNumber) lineNumber = error.lineNumber;
    if (error.columnNumber) columnNumber = error.columnNumber;

    // If we have a line number, show the relevant code snippet
    let codeSnippet = '';
    if (lineNumber) {
        const lines = htmlContent.split('\n');

        // Get a few lines before and after the error line
        const startLine = Math.max(0, lineNumber - 3);
        const endLine = Math.min(lines.length - 1, lineNumber + 2);

        for (let i = startLine; i <= endLine; i++) {
            const line = lines[i] || '';
            const isErrorLine = i + 1 === lineNumber;

            if (isErrorLine && columnNumber) {
                // Highlight the specific column if available
                const spacer = ' '.repeat(columnNumber - 1);
                codeSnippet += `<div class="line-number">${i + 1}</div>
                                <pre class="error-line">${line}</pre>
                                <pre class="error-indicator">${spacer}^</pre>`;
            } else {
                codeSnippet += `<div class="line-number">${i + 1}</div>
                                <pre class="${isErrorLine ? 'error-line' : ''}">${line}</pre>`;
            }
        }
    }

    // Create an error page with simpler structure for better resizing
    const errorContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${Lang.get('previewHtmlError')}</title>
        <style>
            html, body {
                height: 100%;
                margin: 0;
                padding: 0;
                font-family: sans-serif;
                overflow: auto;
            }
            body {
                padding: 20px;
                box-sizing: border-box;
                height: 100%;
            }
            .error-banner {
                position: sticky;
                top: 0;
                background-color: #f44336;
                color: white;
                padding: 10px;
                border-radius: 4px;
                margin-bottom: 20px;
                z-index: 100;
            }
            pre {
                background-color: #f5f5f5;
                padding: 10px;
                border-radius: 4px;
                border: 1px solid #ddd;
                overflow: auto;
                max-height: calc(100vh - 200px);
                margin: 0;
            }
            .error-specific {
                margin: 10px 0 20px 0;
                padding: 10px;
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
            }
            .error-line {
                background-color: #ffebee;
                color: #d32f2f;
                font-weight: bold;
            }
            .error-indicator {
                color: #d32f2f;
                margin-top: -10px;
                font-weight: bold;
            }
            .line-number {
                display: inline-block;
                width: 30px;
                color: #888;
                text-align: right;
                margin-right: 10px;
                user-select: none;
            }
            #content-wrapper {
                height: 100%;
                width: 100%;
                overflow: auto;
                box-sizing: border-box;
            }
        </style>
    </head>
    <body>
        <div id="content-wrapper">
            <div class="error-banner">
                <h2>${Lang.get('previewErrorInCode')}</h2>
                <p>${errorMessage}</p>
            </div>
            
            ${lineNumber ? `
            <div class="error-specific">
                <h3>${Lang.get('previewErrorOnLine')} ${lineNumber}${columnNumber ? ', ' + Lang.get('previewColumn') + ' ' + columnNumber : ''}</h3>
                ${codeSnippet}
            </div>
            ` : ''}
            
            <h3>${Lang.get('previewYourCode')}</h3>
            <pre>${htmlContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </div>
    </body>
    </html>
    `;

    htmlPreviewOriginalContent = errorContent;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(errorContent);
    iframeDoc.close();

    document.getElementById('html-preview-modal').style.display = 'block';
}

// Create the modal for HTML preview
function createHtmlPreviewModal() {
    //console.log('Creating HTML preview modal');
    const modal = document.createElement('div');
    modal.id = 'html-preview-modal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 1000;
    `;

    const container = document.createElement('div');
    container.id = 'html-preview-container';
    container.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    height: 80%;
    background-color: var(--bg-color, white);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    resize: both;
    overflow: auto;
    min-width: 300px;
    min-height: 200px;
    box-shadow: 0 5px 25px var(--preview-shadow, rgba(0, 0, 0, 0.3));
    border: 2px solid var(--preview-border, rgba(180, 180, 180, 0.5));
    transition: box-shadow 0.3s ease;
`;

    const header = document.createElement('div');
    header.id = 'html-preview-header';
    header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 10px;
    background-color: var(--preview-header-bg, #333);
    color: var(--text-color, white);
    height: 40px;
    cursor: move;
    box-sizing: border-box;
    width: 100%;
`;

    const titleContainer = document.createElement('div');
    titleContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    // Add an icon with proper sizing
    const icon = document.createElement('div');
    icon.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: var(--text-color, white);
    flex-shrink: 0;
`;

    icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; max-height: 100%">
    <path d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5z" stroke="currentColor" stroke-width="2"/>
    <path d="M9 9l-2 2 2 2M15 9l2 2-2 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;

    const title = document.createElement('h3');
    title.textContent = Lang.get('previewTitle');
    title.style.cssText = `
        margin: 0;
        font-size: 15px;
        font-weight: 500;
    `;

    titleContainer.appendChild(icon);
    titleContainer.appendChild(title);

    // Create toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'preview-toolbar';
    toolbar.style.cssText = `
        display: flex;
        margin-bottom: 8px;
        background: var(--preview-toolbar-bg, #f5f5f5);
        padding: 6px 10px;
        border-bottom: 1px solid var(--preview-border, #ddd);
    `;

    // Add responsive view buttons
    const viewButtons = [
        { name: 'Desktop', width: '100%', icon: '🖥️' },
        { name: 'Tablet', width: '820px', aspectRatio: '3/2', icon: '📱' }, // More panoramic tablet ratio
        { name: 'Mobile', width: '390px', aspectRatio: '9/19', icon: '📱' }  // Modern smartphone ratio
    ];

    viewButtons.forEach(view => {
        const viewBtn = document.createElement('button');
        viewBtn.innerHTML = `${view.icon} <span>${view.name}</span>`;
        viewBtn.title = `${Lang.get('previewViewAs' + view.name)}`;
        viewBtn.style.cssText = `
            background: none;
            border: none;
            padding: 5px 10px;
            margin-right: 8px;
            font-size: 12px;
            cursor: pointer;
            color: var(--preview-toolbar-text, #555);
            display: flex;
            align-items: center;
            gap: 4px;
            border-radius: 4px;
        `;

        viewBtn.addEventListener('mouseover', function () {
            this.style.background = 'var(--preview-button-hover, #eee)';
        });

        viewBtn.addEventListener('mouseout', function () {
            this.style.background = 'none';
        });

        // Update the viewBtn click event handler in the viewButtons.forEach loop:
        viewBtn.addEventListener('click', function () {
            // Update iframe width and aspect ratio
            const iframe = document.getElementById('html-preview-frame');
            const container = iframe.parentElement;
            const headerElement = document.getElementById('html-preview-header');
            const toolbarElement = container.querySelector('.preview-toolbar');

            if (iframe) {
                // First remove any existing frame styles
                const frameStyles = container.querySelector('.device-frame');
                if (frameStyles) {
                    frameStyles.remove();
                }

                // Remove any existing status bar
                const existingStatusBar = container.querySelector('.mobile-status-bar');
                if (existingStatusBar) {
                    existingStatusBar.remove();
                }

                if (view.width === '100%') {
                    // Desktop view - full width
                    iframe.style.width = '100%';
                    iframe.style.height = '100%';
                    iframe.style.margin = '0';
                    iframe.style.marginBottom = '0';
                    iframe.style.aspectRatio = 'auto';

                    // Reset container layout
                    container.style.display = 'flex';
                    container.style.flexDirection = 'column';
                    container.style.alignItems = 'stretch';
                    container.style.justifyContent = 'flex-start';

                    // Reset header and toolbar to full width
                    headerElement.style.width = '100%';
                    toolbarElement.style.width = '100%';

                    // Reset any transforms on the iframe
                    iframe.style.transform = 'none';
                    iframe.style.borderRadius = '0';
                    iframe.style.boxShadow = 'inset 0 0 0 1px rgba(180, 180, 180, 0.3)';
                } else {
                    // Mobile/Tablet - centered with specific dimensions
                    iframe.style.width = view.width;
                    iframe.style.margin = '0 auto';
                    iframe.style.marginTop = '20px';

                    // Set container to flex column with centered alignment
                    container.style.display = 'flex';
                    container.style.flexDirection = 'column';
                    container.style.alignItems = 'center';

                    // Keep header and toolbar at full container width
                    headerElement.style.width = '100%';
                    toolbarElement.style.width = '100%';

                    // Apply aspect ratio if specified
                    if (view.aspectRatio) {
                        iframe.style.aspectRatio = view.aspectRatio;
                        iframe.style.height = 'auto'; // Let aspect ratio control height

                        // Add extra space at the bottom for scrolling
                        iframe.style.marginBottom = '50px';
                    } else {
                        iframe.style.height = '100%';
                        iframe.style.aspectRatio = 'auto';
                    }

                    // Add device frame styling if needed
                    if (view.name !== 'Desktop') {
                        // Add device frame styling
                        const frameStyle = document.createElement('style');
                        frameStyle.className = 'device-frame';
                        frameStyle.textContent = `
                    #html-preview-frame {
                        border-radius: ${view.name === 'Mobile' ? '20px' : '12px'};
                        box-shadow: 0 0 0 2px #333, 0 0 20px rgba(0,0,0,0.15);
                        transition: all 0.3s ease;
                    }
                `;
                        container.appendChild(frameStyle);

                        // Add status bar for mobile and notch
                        if (view.name === 'Mobile') {
                            // Calculate position to ensure status bar sits perfectly on the iframe
                            const statusBar = document.createElement('div');
                            statusBar.className = 'mobile-status-bar';

                            // Position the status bar to match exactly with the iframe's top edge
                            statusBar.style.cssText = `
                        position: absolute;
                        width: ${view.width};
                        height: 40px;
                        background: rgba(0,0,0,0.8);
                        border-top-left-radius: 20px;
                        border-top-right-radius: 20px;
                        z-index: 10;
                        pointer-events: none;
                    `;

                            // Create notch
                            const notch = document.createElement('div');
                            notch.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 150px;
                        height: 24px;
                        background: #000;
                        border-bottom-left-radius: 14px;
                        border-bottom-right-radius: 14px;
                    `;

                            statusBar.appendChild(notch);
                            container.appendChild(statusBar);

                            // Position the status bar after it's been added to the DOM
                            setTimeout(() => {
                                const updatedIframeRect = iframe.getBoundingClientRect();
                                const containerRect = container.getBoundingClientRect();
                                statusBar.style.top = (updatedIframeRect.top - containerRect.top) + 'px';
                            }, 10);
                        }
                    }
                }

                // Force a refresh to properly apply the new view
                if (htmlPreviewOriginalContent) {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    iframeDoc.open();
                    iframeDoc.write(htmlPreviewOriginalContent);
                    iframeDoc.close();
                }
            }

            // Highlight active button and reset others
            viewButtons.forEach(v => {
                const btn = toolbar.querySelector(`[title="View as ${v.name}"]`);
                if (btn) {
                    if (v.name === view.name) {
                        btn.style.fontWeight = 'bold';
                        btn.style.color = 'var(--text-color, #000)';
                    } else {
                        btn.style.fontWeight = 'normal';
                        btn.style.color = 'var(--preview-toolbar-text, #555)';
                    }
                }
            });
        });

        toolbar.appendChild(viewBtn);
    });

    // Add refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.innerHTML = '🔄'; // Removed "Refresh" text, keeping only the icon
    refreshBtn.title = Lang.get('previewRefreshTooltip');
    refreshBtn.style.cssText = `
        background: none;
        border: none;
        color: var(--preview-toolbar-text, #555);
        font-size: 16px;
        cursor: pointer;
        padding: 2px 5px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 24px;
        width: 24px;
        border-radius: 4px;
        margin-left: auto;
        margin-right: 8px; /* Add right margin to prevent edge issues */
    `;

    refreshBtn.addEventListener('mouseover', function () {
        this.style.background = 'var(--preview-button-hover, #eee)';
    });

    refreshBtn.addEventListener('mouseout', function () {
        this.style.background = 'none';
    });

    refreshBtn.addEventListener('click', function () {
        const iframe = document.getElementById('html-preview-frame');
        if (iframe && htmlPreviewOriginalContent) {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(htmlPreviewOriginalContent);
            iframeDoc.close();
        }
    });

    toolbar.appendChild(refreshBtn);
    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = `
        display: flex;
        align-items: center;
        gap: 5px;
        margin-left: 10px;
        padding-right: 2px;
    `;


    // Add maximize button
    const maximizeButton = document.createElement('button');
    maximizeButton.textContent = '⛶';
    maximizeButton.title = Lang.get('previewMaximize');
    maximizeButton.style.cssText = `
        background: none;
        border: none;
        color: var(--text-color, white);
        font-size: 16px;
        cursor: pointer;
        padding: 2px 5px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 24px;
        width: 24px;
    `;


    let isMaximized = false;
    let prevStyles = {};

    // Replace the entire maximizeButton.onclick function:

    maximizeButton.onclick = function () {
        const container = document.getElementById('html-preview-container');
        if (container) {
            if (!isMaximized) {
                // Save current styles before maximizing
                prevStyles = {
                    width: container.style.width,
                    height: container.style.height,
                    top: container.style.top,
                    left: container.style.left,
                    transform: container.style.transform
                };

                // Maximize
                container.style.width = '95%';
                container.style.height = '95%';
                container.style.top = '50%';
                container.style.left = '50%';
                container.style.transform = 'translate(-50%, -50%)';
                maximizeButton.textContent = '⧉';
                maximizeButton.title = Lang.get('previewRestore');
                isMaximized = true;
            } else {
                // Restore previous size
                if (prevStyles.transform) {
                    // If we had a transform, restore it
                    container.style.transform = prevStyles.transform;
                } else if (prevStyles.top && prevStyles.left) {
                    // If we have specific positions, use those
                    container.style.transform = 'none';
                    container.style.top = prevStyles.top;
                    container.style.left = prevStyles.left;
                } else {
                    // Default back to center if we don't have position info
                    container.style.transform = 'translate(-50%, -50%)';
                    container.style.top = '50%';
                    container.style.left = '50%';
                }

                // Restore size
                container.style.width = prevStyles.width || '80%';
                container.style.height = prevStyles.height || '80%';

                maximizeButton.textContent = '⛶';
                maximizeButton.title = Lang.get('previewMaximize');
                isMaximized = false;
            }
        }
    };

    const closeButton = document.createElement('button');
    closeButton.id = 'html-preview-close';
    closeButton.textContent = '✖';
    closeButton.title = Lang.get('previewClose');
    closeButton.style.cssText = `
        background: none;
        border: none;
        color: var(--text-color, white);
        font-size: 16px;
        cursor: pointer;
        padding: 2px 5px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 24px;
        width: 24px;
    `;
    closeButton.onclick = function () {
        document.getElementById('html-preview-modal').style.display = 'none';
    };

    const iframe = document.createElement('iframe');
    iframe.id = 'html-preview-frame';
    iframe.style.cssText = `
        flex: 1;
        width: 100%;
        border: none;
        background-color: white;
        box-shadow: inset 0 0 0 1px rgba(180, 180, 180, 0.3);
    `;

    controlsDiv.appendChild(maximizeButton);
    controlsDiv.appendChild(closeButton);

    header.appendChild(titleContainer);
    header.appendChild(controlsDiv);

    container.appendChild(header);
    container.appendChild(toolbar);
    container.appendChild(iframe);
    modal.appendChild(container);
    document.body.appendChild(modal);

    //console.log('HTML preview modal created and added to DOM');

    // Set up resize observer for iframe refresh
    setupResizeObserver(container, iframe);

    // Highlight Desktop view as default
    const desktopBtn = toolbar.querySelector('[title="View as Desktop"]');
    if (desktopBtn) {
        desktopBtn.style.fontWeight = 'bold';
        desktopBtn.style.color = 'var(--text-color, #000)';
    }
}
function setupResizeObserver(container, iframe) {
    let resizeTimeout;

    // Create the ResizeObserver with a debounce mechanism
    const resizeObserver = new ResizeObserver(() => {
        clearTimeout(resizeTimeout);

        // Handle size changes with a delay
        resizeTimeout = setTimeout(() => {
            //console.log('Resize detected, refreshing iframe content');

            if (htmlPreviewOriginalContent) {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                iframeDoc.open();
                iframeDoc.write(htmlPreviewOriginalContent);
                iframeDoc.close();

                // For error pages, adjust the pre element's max height
                if (htmlPreviewIsErrorPage) {
                    setTimeout(() => {
                        const preElement = iframeDoc.querySelector('pre');
                        if (preElement) {
                            preElement.style.maxHeight = 'calc(100vh - 200px)';
                        }
                    }, 50);
                }
            }
        }, 500);
    });

    // Start observing size changes
    resizeObserver.observe(container);

    return {
        observer: resizeObserver,
        cleanup: function () {
            resizeObserver.disconnect();
        }
    };
}
// Extract text content from code elements, properly handling HTML entities
function extractCodeContent(codeElement) {
    // First check if clean code is stored in data attribute
    if (codeElement.dataset.cleanCode) {
        return codeElement.dataset.cleanCode;
    }

    // Create a temp element and extract text, removing HTML tags
    const tempElement = document.createElement('div');
    tempElement.innerHTML = codeElement.innerHTML;

    let plainText = '';
    const extractTextFromNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            plainText += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            for (const childNode of node.childNodes) {
                extractTextFromNode(childNode);
            }
        }
    };

    for (const childNode of tempElement.childNodes) {
        extractTextFromNode(childNode);
    }

    // Unescape HTML entities
    return plainText
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
}
// Consolidated function to create generic modal structure
function createBaseModal(id, headerColor, title, options = {}) {
    // Check if modal already exists
    if (document.getElementById(id)) {
        return document.getElementById(id);
    }

    //console.log(`Creating ${title} modal`);
    const modal = document.createElement('div');
    modal.id = id;
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 1000;
    `;

    const container = document.createElement('div');
    container.id = `${id}-container`;
    container.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80%;
        height: 80%;
        background-color: white;
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        resize: both; /* Use built-in resize */
        overflow: auto; /* Required for built-in resize to work */
        min-width: 300px;
        min-height: 200px;
        box-shadow: 0 5px 25px rgba(0, 0, 0, 0.3);
        border: 2px solid rgba(180, 180, 180, 0.5);
    `;

    const header = document.createElement('div');
    header.id = `${id}-header`;
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 10px;
        background-color: ${headerColor};
        color: white;
        height: 32px;
        cursor: move;
    `;

    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    titleElement.style.cssText = `
        margin: 0;
        font-size: 14px;
        font-weight: 500;
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = '✖';
    closeButton.title = Lang.get('previewClose');
    closeButton.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 16px;
        cursor: pointer;
        padding: 2px 5px;
    `;
    closeButton.onclick = function () {
        modal.style.display = 'none';
    };

    // Create header content - either simple or with extras
    if (options.extraHeaderContent) {
        const headerContentWrapper = document.createElement('div');
        headerContentWrapper.style.display = 'flex';
        headerContentWrapper.style.alignItems = 'center';
        headerContentWrapper.appendChild(titleElement);
        headerContentWrapper.appendChild(options.extraHeaderContent);
        header.appendChild(headerContentWrapper);
    } else {
        header.appendChild(titleElement);
    }

    header.appendChild(closeButton);
    container.appendChild(header);

    // If content provided, add it
    if (options.content) {
        container.appendChild(options.content);
    }

    modal.appendChild(container);
    document.body.appendChild(modal);

    // Setup dragging behavior
    setupModalDragging(header, container);

    // Return the created modal and container for further customization
    return {
        modal,
        container,
        header,
        closeButton
    };
}
function setupModalDragging(header, container) {
    if (!header || !container) {
        console.error('Invalid header or container for drag function');
        return;
    }

    // Safari-specific detection
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // Drag state tracking
    let dragState = {
        active: false,
        offsetX: 0,
        offsetY: 0
    };

    // Clean up any existing global handlers
    document.removeEventListener('mousemove', globalMouseMoveHandler);
    document.removeEventListener('mouseup', globalMouseUpHandler);

    // Global handlers that can be referenced consistently
    function globalMouseMoveHandler(e) {
        if (!dragState.active) return;

        e.preventDefault();
        e.stopPropagation();

        // Calculate new position
        const newX = e.clientX - dragState.offsetX;
        const newY = e.clientY - dragState.offsetY;

        // Apply new position
        container.style.top = newY + 'px';
        container.style.left = newX + 'px';
    }

    function globalMouseUpHandler(e) {
        if (!dragState.active) return;

        //console.log('Ending drag operation');
        e.preventDefault();
        e.stopPropagation();

        // Reset drag state
        dragState.active = false;

        // Remove document-level listeners
        document.removeEventListener('mousemove', globalMouseMoveHandler);
        document.removeEventListener('mouseup', globalMouseUpHandler);
    }

    // Handle mousedown to start dragging
    function handleMouseDown(e) {
        //console.log('Starting drag operation');
        e.preventDefault();
        e.stopPropagation();

        // First remove any existing listeners to be safe
        document.removeEventListener('mousemove', globalMouseMoveHandler);
        document.removeEventListener('mouseup', globalMouseUpHandler);

        // Calculate offset from container's top-left corner
        const containerRect = container.getBoundingClientRect();

        // Set drag state
        dragState = {
            active: true,
            offsetX: e.clientX - containerRect.left,
            offsetY: e.clientY - containerRect.top
        };

        // Remove transform to use absolute positioning
        container.style.transform = 'none';
        container.style.top = containerRect.top + 'px';
        container.style.left = containerRect.left + 'px';

        // Add document-level listeners with passive false for Safari
        document.addEventListener('mousemove', globalMouseMoveHandler, { passive: false });
        document.addEventListener('mouseup', globalMouseUpHandler, { passive: false });
    }

    // Clean up any existing mouse down listener
    if (header._dragCleanup) {
        header._dragCleanup();
    }

    // Add the new mousedown listener
    header.addEventListener('mousedown', handleMouseDown);

    // Store cleanup function
    header._dragCleanup = function () {
        header.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', globalMouseMoveHandler);
        document.removeEventListener('mouseup', globalMouseUpHandler);
        dragState.active = false;
    };

    // Safari-specific workaround for mouseup not firing properly
    if (isSafari) {
        window.addEventListener('blur', function () {
            if (dragState.active) {
                //console.log('Window blur detected, ending drag');
                dragState.active = false;
                document.removeEventListener('mousemove', globalMouseMoveHandler);
                document.removeEventListener('mouseup', globalMouseUpHandler);
            }
        });
    }
}

// Export necessary functions and variables globally
window.htmlPreviewOriginalContent = '';
window.htmlPreviewIsErrorPage = false;