class ArtworkPreviewWindow {
    constructor(generatedCode, title = 'Generated Design', backgroundImage = null) {
        //console.log('ArtworkPreviewWindow: Constructor called with:');
        //console.log('- Title:', title);
        //console.log('- Code preview:', generatedCode ? generatedCode.substring(0, 200) + '...' : 'No code');
        //console.log('- Background image:', backgroundImage ? 'Present' : 'None');

        this.generatedCode = generatedCode;
        this.title = title;
        this.isVisible = false;
        this.currentView = 'code'; // 'code' or 'preview'
        this.container = null;
        this.codeEditor = null;
        this.previewFrame = null;
        this.backgroundImage = backgroundImage; // Store the background image
        this.position = {
            x: 0,
            y: 0,
            isDragging: false,
            startX: 0,
            startY: 0
        };

        // FIXED: Improve markdown detection - only true rationale content should be treated as markdown
        this.isMarkdown = title.includes('Rationale') && !this.containsHTMLCode(generatedCode);
        //console.log('ArtworkPreviewWindow: Is markdown content:', this.isMarkdown);

        // Set up event listener for preview window close
        document.addEventListener('artworkPreviewClosed', async (event) => {
            // Find ArtworksTab instance and restore prompt if possible
            if (window.artworksTab && typeof window.artworksTab.restoreSystemPrompt === 'function') {
                await window.artworksTab.restoreSystemPrompt();
            }
        });

        // Ensure CodeStyler syntax styles are added if available
        if (window.CodeStyler && typeof window.CodeStyler.addSyntaxStyles === 'function') {
            window.CodeStyler.addSyntaxStyles();
        }

        // Create window content
        this.createWindow();

        // Set up theme listener
        this.setupThemeListener();

        // FIXED: Always use setCode for HTML content, even if it comes with markdown blocks
        if (this.isMarkdown) {
            //console.log('ArtworkPreviewWindow: Processing as true markdown content (rationale)');
            // For design rationales, set content and switch to preview
            if (this.codeEditor) {
                this.codeEditor.textContent = this.generatedCode;
                this.switchView('preview'); // Show formatted preview by default
            }
        } else {
            //console.log('ArtworkPreviewWindow: Processing as code content');
            // For HTML/code content, use code processing
            this.setCode(this.generatedCode);
            this.switchView('preview');
        }

        this.show();
    }

    // Method to detect HTML code vs pure markdown
    containsHTMLCode(content) {
        if (!content || typeof content !== 'string') return false;

        // Check for HTML indicators
        const htmlIndicators = [
            /<!DOCTYPE/i,
            /<html/i,
            /<head>/i,
            /<body>/i,
            /<style>/i,
            /<script>/i,
            /```html/i,
            /```css/i,
            /```javascript/i
        ];

        return htmlIndicators.some(pattern => pattern.test(content));
    }

    // Creates the preview window DOM structure and sets up initial state
    createWindow() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'artwork-preview-window maximized';

        // Determine button text based on content type
        const copyButtonText = (this.isMarkdown || this.title.includes('Rationale'))
            ? Lang.get('artworkCopyText')
            : Lang.get('artworkCopyCode');

        this.container.innerHTML = `
        <div class="preview-window-header">
            <div class="preview-window-title">${this.title}</div>
            <div class="preview-window-controls">
                <button class="preview-window-maximize-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="8" y1="3" x2="8" y2="21"></line>
                        <line x1="16" y1="3" x2="16" y2="21"></line>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                    </svg>
                </button>
                <button class="preview-window-close-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
        <div class="preview-window-view-controls">
            <button class="preview-view-btn code " data-view="code">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
                ${Lang.get('artworkCode')}
            </button>
            <button class="preview-view-btn preview active" data-view="preview">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                 ${Lang.get('artworkPreview')}
            </button>
        </div>
        <div class="preview-window-content">
            <div class="preview-code-view active">
                <div class="code-editor" contenteditable="true"></div>
            </div>
            <div class="preview-preview-view">
               <iframe class="preview-iframe" sandbox="allow-scripts allow-same-origin allow-modals"></iframe>
            </div>
        </div>
        <div class="preview-window-footer">
            <button class="copy-code-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                ${copyButtonText}
            </button>
            <button class="export-png-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <polyline points="8 12 12 16 16 12"></polyline>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                </svg>
                 ${Lang.get('artworkExportPNG')}
            </button>
            <button class="close-preview-btn">${Lang.get('artworkClose')}</button>
        </div>
    `;


        // Set to full viewport size instead of calculating centered position
        this.container.style.width = '100vw';
        this.container.style.height = '100vh';
        this.container.style.left = '0';
        this.container.style.top = '0';

        // Store the default (maximized) dimensions for the toggle function
        this.container.dataset.prevWidth = '80vw';  // Fallback size when un-maximized
        this.container.dataset.prevHeight = '80vh';
        this.container.dataset.prevLeft = '10vw';   // Centered when un-maximized
        this.container.dataset.prevTop = '10vh';

        // Append to body
        document.body.appendChild(this.container);

        // Cache DOM elements
        this.codeEditor = this.container.querySelector('.code-editor');
        this.previewFrame = this.container.querySelector('.preview-iframe');

        // Setup event listeners
        this.setupEventListeners();
    }
    // Sets up all event listeners for the preview window (buttons, drag, etc.)
    setupEventListeners() {
        // Close button (X)
        const closeBtn = this.container.querySelector('.preview-window-close-btn');
        //console.log('Close button found:', closeBtn); // Debug log
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                //console.log('Close button clicked'); // Debug log
                this.close();
            });
        }

        // Footer close button
        const footerCloseBtn = this.container.querySelector('.close-preview-btn');
        //console.log('Footer close button found:', footerCloseBtn); // Debug log
        if (footerCloseBtn) {
            footerCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                //console.log('Footer close button clicked'); // Debug log
                this.close();
            });
        }

        // Copy code button
        const copyBtn = this.container.querySelector('.copy-code-btn');
        copyBtn.addEventListener('click', () => this.copyCode());

        const exportPngBtn = this.container.querySelector('.export-png-btn');
        if (exportPngBtn) {
            exportPngBtn.addEventListener('click', () => this.captureAndDownloadImage());
        }
        // Maximize button
        const maximizeBtn = this.container.querySelector('.preview-window-maximize-btn');
        maximizeBtn.addEventListener('click', () => this.toggleMaximize());

        // View switcher buttons
        const viewBtns = this.container.querySelectorAll('.preview-view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });

        // Dragging functionality
        const header = this.container.querySelector('.preview-window-header');
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.preview-window-controls')) return;

            this.position.isDragging = true;
            this.position.startX = e.clientX;
            this.position.startY = e.clientY;
            this.position.x = this.container.offsetLeft;
            this.position.y = this.container.offsetTop;

            header.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.position.isDragging) return;

            const dx = e.clientX - this.position.startX;
            const dy = e.clientY - this.position.startY;

            this.container.style.left = `${this.position.x + dx}px`;
            this.container.style.top = `${this.position.y + dy}px`;
        });

        document.addEventListener('mouseup', () => {
            if (!this.position.isDragging) return;

            this.position.isDragging = false;
            header.style.cursor = 'grab';
        });

        // Code editor change event
        this.codeEditor.addEventListener('input', () => {
            // If in preview mode, update the preview when code changes
            if (this.currentView === 'preview') {
                this.updatePreview();
            }
        });
    }
    // Processes and sets the code content in the editor, applies syntax highlighting, and updates the preview
    setCode(code) {
        if (!code) return;

        //console.log('ArtworkPreviewWindow: setCode called with:', code.substring(0, 200) + '...');

        // Extract HTML content if it's embedded in markdown code blocks
        let htmlCode = code;

        // Check if code is a string before using string methods
        if (typeof code === 'string') {
            //console.log('ArtworkPreviewWindow: Processing string content');

            // ENHANCED: Remove explanatory text that comes before code blocks
            // Look for patterns like "Here's the HTML..." or "Okay, here's the HTML..."
            const explanationPatterns = [
                /^.*?(?=```)/s,  // Remove everything before first ```
                /Key improvements.*$/s,  // Remove "Key improvements" section
                /\*\*.*?\*\*.*$/s,  // Remove bold text explanations
                /This revised response.*$/s  // Remove concluding explanations
            ];

            // First, try to find and extract just the code block content
            let codeBlockFound = false;

            // Try to extract HTML from markdown code blocks (most specific first)
            if (code.includes('```html')) {
                //console.log('ArtworkPreviewWindow: Found ```html block');
                const htmlMatch = code.match(/```html\s*([\s\S]*?)\s*```/);
                if (htmlMatch && htmlMatch[1]) {
                    htmlCode = htmlMatch[1].trim();
                    codeBlockFound = true;
                    //console.log('ArtworkPreviewWindow: Extracted HTML from ```html block');
                }
            }
            else if (code.includes('```markup')) {
                //console.log('ArtworkPreviewWindow: Found ```markup block');
                const markupMatch = code.match(/```markup\s*([\s\S]*?)\s*```/);
                if (markupMatch && markupMatch[1]) {
                    htmlCode = markupMatch[1].trim();
                    codeBlockFound = true;
                    //console.log('ArtworkPreviewWindow: Extracted HTML from ```markup block');
                }
            }
            // Try to extract CSS from markdown code blocks
            else if (code.includes('```css')) {
                //console.log('ArtworkPreviewWindow: Found ```css block');
                const cssMatch = code.match(/```css\s*([\s\S]*?)\s*```/);
                if (cssMatch && cssMatch[1]) {
                    htmlCode = cssMatch[1].trim();
                    codeBlockFound = true;
                    //console.log('ArtworkPreviewWindow: Extracted CSS from ```css block');
                }
            }
            // Try to extract JavaScript from markdown code blocks
            else if (code.includes('```javascript') || code.includes('```js')) {
                //console.log('ArtworkPreviewWindow: Found JavaScript block');
                const jsMatch = code.match(/```(?:javascript|js)\s*([\s\S]*?)\s*```/);
                if (jsMatch && jsMatch[1]) {
                    htmlCode = jsMatch[1].trim();
                    codeBlockFound = true;
                    //console.log('ArtworkPreviewWindow: Extracted JavaScript from code block');
                }
            }
            // NEW: Handle generic code blocks that might contain HTML
            else if (code.includes('```')) {
                //console.log('ArtworkPreviewWindow: Found generic ``` block');
                // Look for any code block that contains HTML-like content
                const genericCodeMatch = code.match(/```[a-zA-Z]*\s*([\s\S]*?)\s*```/);
                if (genericCodeMatch && genericCodeMatch[1]) {
                    const potentialHtml = genericCodeMatch[1].trim();
                    //console.log('ArtworkPreviewWindow: Potential HTML content:', potentialHtml.substring(0, 100) + '...');

                    // Check if it looks like HTML
                    if (potentialHtml.includes('<!DOCTYPE') ||
                        potentialHtml.includes('<html') ||
                        (potentialHtml.includes('<') && potentialHtml.includes('>') && potentialHtml.includes('</'))) {
                        htmlCode = potentialHtml;
                        codeBlockFound = true;
                        //console.log('ArtworkPreviewWindow: Extracted HTML from generic code block');
                    }
                }
            }

            // If no code block was found, but the content looks like it has HTML mixed with text
            if (!codeBlockFound) {
                //console.log('ArtworkPreviewWindow: No code block found, checking for inline HTML');

                // NEW: Try to extract HTML that might be mixed with explanatory text
                // Look for patterns that start with <!DOCTYPE or <html
                const htmlDocMatch = code.match(/(<!DOCTYPE[\s\S]*?<\/html>)/i);
                if (htmlDocMatch && htmlDocMatch[1]) {
                    htmlCode = htmlDocMatch[1].trim();
                    codeBlockFound = true;
                    //console.log('ArtworkPreviewWindow: Extracted complete HTML document from mixed content');
                }
                // Fallback: look for any substantial HTML-like content
                else if (code.includes('<html') && code.includes('</html>')) {
                    const htmlStartIndex = code.indexOf('<html');
                    const htmlEndIndex = code.lastIndexOf('</html>') + 7;
                    if (htmlStartIndex !== -1 && htmlEndIndex > htmlStartIndex) {
                        htmlCode = code.substring(htmlStartIndex, htmlEndIndex).trim();
                        codeBlockFound = true;
                        //console.log('ArtworkPreviewWindow: Extracted HTML by finding <html> tags');
                    }
                }
            }

            // Additional cleanup: Remove any remaining triple backticks that might be at start/end
            htmlCode = htmlCode.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '').trim();

            // NEW: Remove any explanatory text that might still be attached
            if (codeBlockFound) {
                // Remove common explanatory phrases that might be at the start
                const cleanupPatterns = [
                    /^.*?(?=<!DOCTYPE)/s,
                    /^.*?(?=<html)/s,
                    /^Here's.*?:/,
                    /^Okay.*?:/,
                    /^.*?code.*?:/i
                ];

                for (const pattern of cleanupPatterns) {
                    const beforeCleanup = htmlCode;
                    htmlCode = htmlCode.replace(pattern, '').trim();
                    if (htmlCode !== beforeCleanup) {
                        //console.log('ArtworkPreviewWindow: Removed explanatory text with pattern:', pattern);
                        break;
                    }
                }
            }

            //console.log('ArtworkPreviewWindow: Final processed code length:', htmlCode.length);
            //console.log('ArtworkPreviewWindow: Code starts with:', htmlCode.substring(0, 50));
        }

        // Add background image comments directly to the code in the editor
        if (this.backgroundImage) {
            htmlCode = this.addBackgroundImageComments(htmlCode);
            //console.log('ArtworkPreviewWindow: Added background image comments');
        }

        // Set code to editor
        this.codeEditor.textContent = htmlCode;

        // Apply syntax highlighting using CodeStyler
        if (window.CodeStyler) {
            const highlighted = this.highlightCode(htmlCode);
            this.codeEditor.innerHTML = highlighted;
            //console.log('ArtworkPreviewWindow: Applied syntax highlighting');
        }

        // Update preview
        this.updatePreview();
        //console.log('ArtworkPreviewWindow: Preview updated');
    }

    // Adds instructional comments to code where a background image placeholder is used
    addBackgroundImageComments(code) {
        if (!code) return code;

        // First, add a comment before any background-image that uses our placeholder
        let processedCode = code.replace(
            /background-image\s*:\s*url\s*\(\s*window\.backgroundImage\s*\)/g,
            `/* ${Lang.get('artworkBackgroundImageWarning')}
     * ${Lang.get('artworkBackgroundImageInstructions')}
     * background-image: url('your-image.jpg');
     */
    background-image: url(window.backgroundImage)`
        );

        // Then add an inline comment for any other instances of window.backgroundImage
        processedCode = processedCode.replace(
            /url\s*\(\s*window\.backgroundImage\s*\)/g,
            function (match) {
                // Only replace if it doesn't already have our comment
                if (!match.includes('/* IMPORTANT')) {
                    return `url(window.backgroundImage) /* ${Lang.get('artworkBackgroundImageReplace')} */`;
                }
                return match;
            }
        );

        return processedCode;
    }

    // Updates the content of the preview iframe based on the current code/editor state
    updatePreview() {
        if (!this.previewFrame) return;

        //console.log('ArtworkPreviewWindow: updatePreview called');

        // Get current code from editor
        let code = this.codeEditor.textContent || this.codeEditor.innerText;
        //console.log('ArtworkPreviewWindow: Raw code from editor:', code.substring(0, 200) + '...');

        // NEW: If the code still contains markdown formatting, extract the HTML
        if (code.includes('```html') || code.includes('```') || code.includes('Okay, here\'s')) {
            //console.log('ArtworkPreviewWindow: Code still contains markdown, extracting...');

            // Try to extract HTML from markdown code blocks
            if (code.includes('```html')) {
                const htmlMatch = code.match(/```html\s*([\s\S]*?)\s*```/);
                if (htmlMatch && htmlMatch[1]) {
                    code = htmlMatch[1].trim();
                    //console.log('ArtworkPreviewWindow: Extracted HTML from markdown block');
                }
            }
            // Handle generic code blocks
            else if (code.includes('```')) {
                const genericMatch = code.match(/```[a-zA-Z]*\s*([\s\S]*?)\s*```/);
                if (genericMatch && genericMatch[1]) {
                    const potentialHtml = genericMatch[1].trim();
                    if (potentialHtml.includes('<!DOCTYPE') || potentialHtml.includes('<html')) {
                        code = potentialHtml;
                        //console.log('ArtworkPreviewWindow: Extracted HTML from generic code block');
                    }
                }
            }

            // Remove explanatory text that might still be present
            code = code.replace(/^.*?(?=<!DOCTYPE|<html)/s, '').trim();

            // Update the editor with the cleaned code
            this.codeEditor.textContent = code;
            //console.log('ArtworkPreviewWindow: Updated editor with cleaned code');
        }

        // Process code for preview
        let processedCode = code;

        // NEW: Handle background image replacement - Convert blob URLs to base64 for iframe
        if (this.backgroundImage) {
            //console.log('ArtworkPreviewWindow: Processing background image for iframe');

            // Check if we have a blob URL that needs to be converted
            const blobUrlMatch = code.match(/url\(['"]?(blob:[^'")\s]+)['"]?\)/);
            if (blobUrlMatch) {
                const blobUrl = blobUrlMatch[1];
                //console.log('ArtworkPreviewWindow: Found blob URL, converting to base64 for iframe:', blobUrl);

                // Convert blob URL to base64 for iframe compatibility
                fetch(blobUrl)
                    .then(response => response.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const base64Data = reader.result;
                            //console.log('ArtworkPreviewWindow: Converted blob to base64 for iframe');

                            // Replace blob URL with base64 data URL
                            const updatedCode = code.replace(
                                new RegExp(`url\\(['"]?${blobUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]?\\)`, 'g'),
                                `url('${base64Data}')`
                            );

                            // Continue with the preview update using base64
                            this.writeToIframe(updatedCode);
                        };
                        reader.readAsDataURL(blob);
                    })
                    .catch(error => {
                        console.error('ArtworkPreviewWindow: Error converting blob to base64:', error);
                        // Fallback to original background image
                        const fallbackCode = code.replace(
                            /url\(['"]?blob:[^'")\s]+['"]?\)/g,
                            `url('${this.backgroundImage}')`
                        );
                        this.writeToIframe(fallbackCode);
                    });

                return; // Exit early, writeToIframe will be called asynchronously
            } else {
                // Handle other background image patterns
                processedCode = processedCode.replace(
                    /url\s*\(\s*window\.backgroundImage\s*\)/gi,
                    `url("${this.backgroundImage}")`
                );
                //console.log('ArtworkPreviewWindow: Background image URLs replaced with direct reference');
            }
        }

        // Continue with normal processing
        this.writeToIframe(processedCode);
    }

    // Writes processed code or HTML to the preview iframe, handling markdown if needed
    writeToIframe(processedCode) {
        // FIXED: Only convert to HTML if this is truly markdown content (rationale), not HTML code
        if (this.isMarkdown && this.title.includes('Rationale') && !this.containsHTMLCode(processedCode)) {
            //console.log('ArtworkPreviewWindow: Converting true markdown to HTML');
            processedCode = this.convertMarkdownToHTML(processedCode);
        } else {
            //console.log('ArtworkPreviewWindow: Using HTML code as-is');
        }

        // Validate that we have valid content
        if (!processedCode || processedCode.trim() === '') {
            console.error('ArtworkPreviewWindow: No content found, aborting preview update');
            return;
        }

        //console.log('ArtworkPreviewWindow: Final processed code preview:', processedCode.substring(0, 100) + '...');

        // Get iframe document
        const frameDoc = this.previewFrame.contentDocument || this.previewFrame.contentWindow.document;

        try {
            // For HTML code content, write it directly
            if (!this.isMarkdown && this.containsHTMLCode(processedCode)) {
                //console.log('ArtworkPreviewWindow: Writing HTML code directly to iframe');
                frameDoc.open();
                frameDoc.write(processedCode);
                frameDoc.close();
            } else {
                // For markdown or other content, wrap it with our template
                //console.log('ArtworkPreviewWindow: Writing wrapped content to iframe');
                frameDoc.open();
                frameDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    /* Reset styles */
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                        line-height: 1.6;
                        color: var(--text-color, #333);
                        background-color: var(--bg-color, #ffffff);
                        padding: 20px;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    
                    /* Markdown-specific styles for design rationale */
                    h1, h2, h3, h4, h5, h6 {
                        margin-top: 1.5em;
                        margin-bottom: 0.5em;
                        font-weight: 600;
                        line-height: 1.3;
                    }
                    
                    h1 { font-size: 2em; color: var(--accent-color, #4f46e5); }
                    h2 { font-size: 1.6em; color: var(--text-color, #333); }
                    h3 { font-size: 1.4em; color: var(--text-color, #333); }
                    h4 { font-size: 1.2em; color: var(--text-color, #555); }
                    h5 { font-size: 1.1em; color: var(--text-color, #555); }
                    h6 { font-size: 1em; color: var(--text-color, #666); font-weight: 500; }
                    
                    p {
                        margin-bottom: 1em;
                        text-align: justify;
                    }
                    
                    ul, ol {
                        margin-bottom: 1em;
                        padding-left: 2em;
                    }
                    
                    li {
                        margin-bottom: 0.5em;
                    }
                    
                    strong {
                        font-weight: 600;
                        color: var(--accent-color, #4f46e5);
                    }
                    
                    em {
                        font-style: italic;
                        color: var(--text-color, #555);
                    }
                    
                    blockquote {
                        border-left: 4px solid var(--accent-color, #4f46e5);
                        padding-left: 1em;
                        margin: 1em 0;
                        font-style: italic;
                        color: var(--text-color, #666);
                    }
                    
                    code {
                        background-color: var(--code-bg, #f1f5f9);
                        padding: 0.2em 0.4em;
                        border-radius: 3px;
                        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
                        font-size: 0.9em;
                    }
                    
                    /* Dark mode support */
                    @media (prefers-color-scheme: dark) {
                        body {
                            background-color: var(--bg-color, #1a1a1a);
                            color: var(--text-color, #e5e5e5);
                        }
                        
                        h1 { color: var(--accent-color, #818cf8); }
                        h2, h3 { color: var(--text-color, #e5e5e5); }
                        h4, h5 { color: var(--text-color, #d1d5db); }
                        h6 { color: var(--text-color, #9ca3af); }
                        
                        strong { color: var(--accent-color, #818cf8); }
                        em { color: var(--text-color, #d1d5db); }
                        blockquote { color: var(--text-color, #9ca3af); }
                    }
                </style>
            </head>
            <body>
                ${processedCode}
            </body>
            </html>
        `);
                frameDoc.close();
            }

            //console.log('ArtworkPreviewWindow: Preview updated successfully');
        } catch (error) {
            console.error('ArtworkPreviewWindow: Error updating preview:', error);
            console.error('ArtworkPreviewWindow: Problematic code:', processedCode.substring(0, 500));
        }
    }
    // Applies syntax highlighting to code using CodeStyler or escapes HTML if unavailable
    highlightCode(code) {
        // If CodeStyler isn't available, return escaped code
        if (!window.CodeStyler) {
            return code
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        try {
            // Make sure CodeStyler syntax styles are loaded
            if (typeof window.CodeStyler.addSyntaxStyles === 'function') {
                window.CodeStyler.addSyntaxStyles();
            }

            // Detect language from content
            let language = this.detectLanguage(code);

            // Use the proper highlighting method based on language
            if (language === 'markup' || language === 'html') {
                // Use the enhanced highlightMarkup method for HTML
                const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');

                // For debugging, we can use the debug version
                if (window.CodeStyler.highlightMarkupDebug && false) { // Set to true to enable debug mode
                    return window.CodeStyler.highlightMarkupDebug(escapedCode);
                }

                return window.CodeStyler.highlightMarkup(escapedCode);
            } else if (language && typeof window.CodeStyler.highlightCode === 'function') {
                // Use the enhanced highlightCode method for other languages
                const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return window.CodeStyler.highlightCode(escapedCode, language);
            } else {
                // Fallback to simple markup highlighting
                return window.CodeStyler.highlightMarkup(
                    code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
                );
            }
        } catch (error) {
            console.error('Error applying syntax highlighting:', error);
            // Return escaped code if highlighting fails
            return code
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }
    }

    // Attempts to detect the programming language of the provided code for highlighting
    detectLanguage(code) {
        //console.log('detectLanguage called with:',
            //code ? code.substring(0, 30) + '...' : 'undefined');

        if (!code) {
            //console.log('Code is empty, defaulting to markup');
            return 'markup';
        }

        // For HTML content
        if (code.includes('<html') ||
            code.includes('<!DOCTYPE') ||
            (code.includes('<') && code.includes('>') && code.includes('</') && !code.includes('{'))) {
            //console.log('Detected HTML/markup content');
            return 'markup';
        }

        // For CSS content - check for typical CSS patterns
        if (code.includes('{') && code.includes('}') &&
            (code.includes('px') || code.includes('rgb') || code.includes('#') ||
                code.includes('margin') || code.includes('padding') || code.includes('@media'))) {
            //console.log('Detected CSS content');
            return 'css';
        }

        // For JavaScript content - check for JS keywords and patterns
        if (code.includes('function') || code.includes('const ') ||
            code.includes('var ') || code.includes('let ') ||
            code.includes('return ') || code.includes('=> {') ||
            code.includes('//console.log')) {
            //console.log('Detected JavaScript content');
            return 'javascript';
        }

        // Default to markup for unknown types
        //console.log('Could not determine language, defaulting to markup');
        return 'markup';
    }
    // Switches between code and preview views, recreating the iframe for preview mode
    switchView(view) {
        if (view === this.currentView) return;

        this.currentView = view;

        // Update buttons
        const buttons = this.container.querySelectorAll('.preview-view-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === view) {
                btn.classList.add('active');
            }
        });

        // Update views
        const codeView = this.container.querySelector('.preview-code-view');
        const previewView = this.container.querySelector('.preview-preview-view');

        if (view === 'code') {
            codeView.classList.add('active');
            previewView.classList.remove('active');
        } else {
            codeView.classList.remove('active');
            previewView.classList.add('active');

            // Create a fresh iframe each time we switch to preview
            const previewContainer = this.container.querySelector('.preview-preview-view');

            // Remove the old iframe if it exists
            if (this.previewFrame) {
                this.previewFrame.remove();
            }

            // Create a new iframe
            const newIframe = document.createElement('iframe');
            newIframe.className = 'preview-iframe';
            newIframe.sandbox = 'allow-scripts allow-same-origin allow-modals';

            // Add the new iframe to the DOM
            previewContainer.appendChild(newIframe);

            // Update the reference
            this.previewFrame = newIframe;

            // Now update the preview with fresh content
            this.updatePreview();
        }
    }
    // Copies the code or rationale text to the clipboard, stripping markdown if needed
    copyCode() {
        let code;

        // For design rationale (markdown content), copy clean text without markdown
        if (this.isMarkdown || this.title.includes('Rationale')) {
            // Get the raw markdown content and strip formatting
            const rawCode = this.codeEditor.textContent || this.codeEditor.innerText;
            code = this.stripMarkdownFormatting(rawCode);
        } else {
            // For regular code content, copy the raw code from editor
            code = this.codeEditor.textContent || this.codeEditor.innerText;
        }

        // Copy to clipboard
        navigator.clipboard.writeText(code)
            .then(() => {
                // Show a temporary success message
                const copyBtn = this.container.querySelector('.copy-code-btn');
                const originalText = copyBtn.innerHTML;

                copyBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                ${Lang.get('artworkCopied')}
            `;

                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy code:', err);
                alert(Lang.get('artworkCopyFailed'));
            });
    }

    // Toggles the preview window between maximized and previous size/position
    toggleMaximize() {
        this.container.classList.toggle('maximized');

        if (this.container.classList.contains('maximized')) {
            // Store current dimensions for later restoration
            this.container.dataset.prevWidth = this.container.style.width;
            this.container.dataset.prevHeight = this.container.style.height;
            this.container.dataset.prevLeft = this.container.style.left;
            this.container.dataset.prevTop = this.container.style.top;

            // Maximize
            this.container.style.width = '100%';
            this.container.style.height = '100%';
            this.container.style.left = '0';
            this.container.style.top = '0';
        } else {
            // Restore previous dimensions
            this.container.style.width = this.container.dataset.prevWidth;
            this.container.style.height = this.container.dataset.prevHeight;
            this.container.style.left = this.container.dataset.prevLeft;
            this.container.style.top = this.container.dataset.prevTop;
        }
    }

    // Shows the preview window and overlay, and updates the preview
    show() {
        //console.log('Show method called, isVisible:', this.isVisible); // Debug log
        if (this.isVisible) return;

        this.container.style.display = 'flex';
        this.isVisible = true;

        // Add an overlay behind the window
        const overlay = document.createElement('div');
        overlay.className = 'artwork-preview-overlay';
        document.body.appendChild(overlay);
        this.overlay = overlay;

        // Update preview
        this.updatePreview();

        //console.log('Window shown, isVisible now:', this.isVisible); // Debug log
    }

    // Closes the preview window, removes overlay, and dispatches close event
    close() {
        //console.log('Close method called'); // Debug log
        if (!this.isVisible) {
            //console.log('Window already closed');
            return;
        }

        if (this.container) {
            //console.log('Removing container from DOM'); // Debug log
            // Instead of just hiding, completely remove from DOM
            this.container.remove();
        }

        this.isVisible = false;

        // Remove overlay
        if (this.overlay) {
            //console.log('Removing overlay'); // Debug log
            this.overlay.remove();
        }

        // Trigger an event that the tab can listen for to restore system prompt
        const closeEvent = new CustomEvent('artworkPreviewClosed', {
            detail: { timestamp: Date.now() }
        });
        document.dispatchEvent(closeEvent);

        //console.log('Window closed successfully'); // Debug log
    }

    // Removes the preview window and cleans up resources
    destroy() {
        this.close();
        this.container.remove();
    }

    // Sets up a listener to update the theme when the system color scheme changes
    setupThemeListener() {
        // Check if the browser supports matchMedia
        if (window.matchMedia) {
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            // Add event listener for theme changes
            if (darkModeMediaQuery.addEventListener) {
                darkModeMediaQuery.addEventListener('change', () => this.updateTheme());
            } else if (darkModeMediaQuery.addListener) {
                // Fallback for older browsers
                darkModeMediaQuery.addListener(() => this.updateTheme());
            }
        }
    }
    // Updates the preview and syntax highlighting to match the current theme
    updateTheme() {
        // Update the preview iframe content when theme changes
        if (this.currentView === 'preview') {
            this.updatePreview();
        }

        // Re-apply syntax highlighting with new theme
        if (window.CodeStyler && this.codeEditor) {
            const code = this.codeEditor.textContent || this.codeEditor.innerText;
            this.codeEditor.innerHTML = this.highlightCode(code);
        }
    }

    // Captures the preview as a PNG image and triggers a download, showing notifications
    captureAndDownloadImage() {
        // Make sure we're in preview mode first
        if (this.currentView !== 'preview') {
            this.switchView('preview');
            setTimeout(() => this.captureAndDownloadImage(), 500);
            return;
        }

        const iframe = this.previewFrame;
        if (!iframe) return;

        try {
            // Create a progress notification with consistent styling
            const notification = document.createElement('div');
            notification.className = 'export-notification';
            notification.innerHTML = `
            <div class="export-notification-content">
                <h3>${Lang.get('artworkExportingPNG')}</h3>
                <p>${Lang.get('artworkExportWait')}</p>
                <div class="export-progress"></div>
                <div class="button-container">
                    <button class="dismiss-export-btn" style="display: none;">${Lang.get('artworkClose')}</button>
                </div>
            </div>
        `;
            document.body.appendChild(notification);

            // Get the iframe document and window
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const iframeBody = iframeDoc.body;

            // Use html2canvas to capture the iframe content
            if (typeof html2canvas !== 'function') {
                throw new Error('html2canvas not found. Make sure it is properly loaded.');
            }

            html2canvas(iframeBody, {
                scale: 4,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#FFFFFF',
                logging: true,
                imageTimeout: 0,
                removeContainer: false
            }).then(canvas => {
                try {
                    // Convert canvas to PNG with maximum quality
                    const imgData = canvas.toDataURL('image/png', 1.0);
                    const link = document.createElement('a');
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    link.download = `design-export-${timestamp}.png`;
                    link.href = imgData;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // Update the existing notification content instead of replacing it
                    const content = notification.querySelector('.export-notification-content');
                    const h3 = content.querySelector('h3');
                    const p = content.querySelector('p');
                    const progress = content.querySelector('.export-progress');
                    const button = content.querySelector('.dismiss-export-btn');

                    h3.textContent = Lang.get('artworkExportSuccess');
                    p.textContent = Lang.get('artworkExportDownloaded');
                    progress.style.display = 'none'; // Hide progress bar
                    button.style.display = 'inline-block'; // Show close button

                    // Add event listener to the existing button
                    button.addEventListener('click', () => {
                        notification.remove();
                    });

                    // Auto-dismiss after 3 seconds
                    setTimeout(() => {
                        if (document.body.contains(notification)) {
                            notification.remove();
                        }
                    }, 3000);

                } catch (e) {
                    console.error('Error creating PNG:', e);
                    this.showExportInstructions(notification);
                }
            }).catch(error => {
                console.error('Error with html2canvas:', error);
                this.showExportInstructions(notification);
            });
        } catch (error) {
            console.error('Error exporting as PNG:', error);
            this.showExportInstructions();
        }
    }
    // Shows fallback instructions for exporting an image if PNG export fails
    showExportInstructions(existingNotification = null) {
        const notification = existingNotification || document.createElement('div');
        notification.className = 'export-notification';
        notification.innerHTML = `
    <div class="export-notification-content">
        <h3>${Lang.get('artworkExportPNG')}</h3>
        <p>${Lang.get('artworkExportInstructions')}</p>
        <ol>
            <li>${Lang.get('artworkExportScreenshot')}
                <ul>
                    <li><strong>Mac:</strong> ${Lang.get('artworkExportMac')}</li>
                    <li><strong>Windows:</strong> ${Lang.get('artworkExportWindows')}</li>
                </ul>
            </li>
            <li>${Lang.get('artworkExportPasteSave')}</li>
        </ol>
        <div style="text-align: right;">
            <button class="dismiss-export-btn">${Lang.get('artworkExportGotIt')}</button>
        </div>
    </div>
`;

        if (!existingNotification) {
            document.body.appendChild(notification);
        }

        const dismissBtn = notification.querySelector('.dismiss-export-btn');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                notification.remove();
            });
        }
    }
    // Detects if the provided content is likely markdown (used for rationale)
    detectMarkdownContent(content) {
        if (!content || typeof content !== 'string') return false;

        // Look for markdown indicators
        const markdownIndicators = [
            /^#{1,6}\s/m,           // Headers (# ## ### etc.)
            /\*\*.*?\*\*/,          // Bold text
            /\*.*?\*/,              // Italic text
            /^-\s/m,                // Bullet points
            /^\d+\.\s/m             // Numbered lists
        ];

        return markdownIndicators.some(pattern => pattern.test(content));
    }
    // Converts markdown text to HTML for rationale preview
    convertMarkdownToHTML(markdown) {
        if (!markdown) return '';

        let html = markdown;

        // Convert headers (### becomes <h3>, #### becomes <h4>, etc.)
        html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

        // Convert bold text (**text** becomes <strong>text</strong>)
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Convert italic text (*text* becomes <em>text</em>)
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Convert bullet points (- item becomes <li>item</li>)
        html = html.replace(/^- (.*$)/gm, '<li>$1</li>');

        // Wrap consecutive <li> elements in <ul>
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        html = html.replace(/<\/li>\s*<li>/g, '</li><li>');

        // Convert line breaks to paragraphs
        html = html.split('\n\n').map(paragraph => {
            paragraph = paragraph.trim();
            if (!paragraph) return '';

            // Don't wrap headers or lists in <p> tags
            if (paragraph.startsWith('<h') ||
                paragraph.startsWith('<ul') ||
                paragraph.startsWith('<ol') ||
                paragraph.startsWith('<li')) {
                return paragraph;
            }

            return `<p>${paragraph}</p>`;
        }).join('\n');

        // Clean up any remaining single line breaks
        html = html.replace(/\n/g, '<br>');

        return html;
    }
    // Strips markdown formatting from text for clean copying
    stripMarkdownFormatting(markdown) {
        if (!markdown) return '';

        let text = markdown;

        // Remove markdown headers (### Header becomes Header)
        text = text.replace(/^#{1,6}\s+(.*)$/gm, '$1');

        // Remove bold formatting (**text** becomes text)
        text = text.replace(/\*\*(.*?)\*\*/g, '$1');

        // Remove italic formatting (*text* becomes text)
        text = text.replace(/\*(.*?)\*/g, '$1');

        // Remove bullet points (- item becomes item)
        text = text.replace(/^-\s+(.*)$/gm, '$1');

        // Remove numbered list formatting (1. item becomes item)
        text = text.replace(/^\d+\.\s+(.*)$/gm, '$1');

        // Clean up multiple consecutive line breaks (keep max 2)
        text = text.replace(/\n{3,}/g, '\n\n');

        // Trim whitespace
        text = text.trim();

        return text;
    }
}

(function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .artwork-preview-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 9998;
        }
        
        .artwork-preview-window {
            position: fixed;
            display: flex;
            flex-direction: column;
            background-color: var(--bg-color, #ffffff);
            border: 1px solid var(--border-color, #ddd);
            border-radius: 8px;
            box-shadow: 0 10px 25px var(--preview-shadow, rgba(0, 0, 0, 0.2));
            z-index: 9999;
            min-width: 400px;
            min-height: 300px;
            max-width: 100%;
            max-height: 100%;
            overflow: hidden;
            color: var(--text-color, #333);
        }
        
        .preview-window-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background-color: var(--preview-header-bg, #f5f5f5);
            border-bottom: 1px solid var(--border-color, #ddd);
            cursor: grab;
        }
        
        .preview-window-title {
            font-weight: bold;
            font-size: 14px;
            color: var(--text-color, #333);
        }
        
        .preview-window-controls {
            display: flex;
            gap: 8px;
        }
        
        .preview-window-controls button {
            background: none;
            border: none;
            color: var(--text-color, #666);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .preview-window-controls button:hover {
            background-color: rgba(127, 127, 127, 0.1);
        }
        
        .preview-window-view-controls {
            display: flex;
            padding: 8px 15px;
            border-bottom: 1px solid var(--border-color, #ddd);
            background-color: var(--preview-toolbar-bg, #f5f5f5);
        }
        
        .preview-view-btn {
            background: none;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--text-color, #666);
        }
        
        .preview-view-btn:hover {
            background-color: rgba(127, 127, 127, 0.1);
        }
        
        .preview-view-btn.active {
            background-color: var(--accent-color, #4f46e5);
            color: white;
        }
        
        .preview-view-btn.active svg {
            stroke: white;
        }
        
        .preview-window-content {
            flex: 1;
            overflow: hidden;
            position: relative;
            background-color: var(--bg-color, #ffffff);
        }
        
        .preview-code-view,
        .preview-preview-view {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            display: none;
        }
        
        .preview-code-view.active,
        .preview-preview-view.active {
            display: block;
        }
        
        .code-editor {
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            padding: 15px;
            min-height: 100%;
            white-space: pre-wrap;
            outline: none;
            overflow: auto;
            color: var(--text-color, #333);
            background-color: var(--bg-color, #ffffff);
        }
        
        .preview-iframe {
            width: 100%;
            height: 100%;
            border: none;
            background-color: white;
        }
        
        .preview-window-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 10px 15px;
            border-top: 1px solid var(--border-color, #ddd);
            background-color: var(--preview-header-bg, #f5f5f5);
        }
        
        .copy-code-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background-color: var(--bg-color, #fff);
            border: 1px solid var(--border-color, #ddd);
            border-radius: 4px;
            cursor: pointer;
            color: var(--text-color, #333);
        }
        
        .copy-code-btn:hover {
            background-color: var(--button-bg, rgba(127, 127, 127, 0.1));
        }
        
        .close-preview-btn {
            padding: 6px 15px;
            background-color: var(--accent-color, #4f46e5);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .close-preview-btn:hover {
            background-color: var(--accent-color-hover, #3c359e);
        }
        
        .export-png-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background-color: var(--accent-color, #4f46e5);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .export-png-btn:hover {
            background-color: var(--accent-color-hover, #3c359e);
        }
        
        /* Maximized state */
        .artwork-preview-window.maximized {
            border-radius: 0;
            width: 100vw !important;
            height: 100vh !important;
            left: 0 !important;
            top: 0 !important;
        }
        
        /* Export Notification Styles - Theme Compatible */
        .export-notification {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .export-notification-content {
            background-color: var(--bg-color, #ffffff);
            padding: 20px;
            border-radius: 8px;
            max-width: 500px;
            box-shadow: 0 4px 15px var(--db-notification-shadow, rgba(0, 0, 0, 0.2));
            color: var(--text-color, #333);
            border: 1px solid var(--border-color, #e0e0e0);
        }
        
        .export-notification-content h3 {
            margin-top: 0;
            margin-bottom: 10px;
            color: var(--text-color, #333);
            text-align: center;
        }
        
        .export-notification-content p {
            color: var(--text-color, #333);
            text-align: center;
            margin-bottom: 10px;
        }
        
        .export-notification-content ol {
            text-align: left;
            padding-left: 20px;
            color: var(--text-color, #333);
        }
        
        .export-notification-content li {
            color: var(--text-color, #333);
            margin-bottom: 5px;
        }
        
        .export-notification-content ul {
            margin-top: 5px;
        }
        
        .export-notification-content strong {
            color: var(--text-color, #333);
        }
        
        .export-progress {
            height: 4px;
            width: 100%;
            background-color: var(--border-color, #e2e8f0);
            margin-top: 15px;
            border-radius: 2px;
            overflow: hidden;
            position: relative;
        }
        
        .export-progress::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 30%;
            background-color: var(--accent-color, #4f46e5);
            animation: progress 1.5s infinite linear;
        }
        
        @keyframes progress {
            0% { left: -30%; }
            100% { left: 100%; }
        }
        
        .button-container {
            text-align: right;
            margin-top: 15px;
        }
        
        .dismiss-export-btn {
            padding: 8px 16px;
            background-color: var(--accent-color, #4f46e5);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .dismiss-export-btn:hover {
            background-color: var(--accent-color-hover, #3c359e);
        }
        
        /* Syntax highlighting styles - complete set */
        .syntax-tag { color: var(--syntax-tag-color, #22863a); }
        .syntax-attr { color: var(--syntax-attr-color, #6f42c1); }
        .syntax-string { color: var(--syntax-string-color, #032f62); }
        .syntax-comment { color: var(--syntax-comment-color, #6a737d); }
        .syntax-doctype { color: var(--syntax-doctype-color, #6a737d); }
        .syntax-keyword { color: var(--syntax-keyword-color, #d73a49); }
        .syntax-builtin { color: var(--syntax-builtin-color, #005cc5); }
        .syntax-operator { color: var(--syntax-operator-color, #d73a49); }
        .syntax-special-char { color: var(--syntax-special-char-color, #032f62); }
        
        /* Dark mode syntax highlighting */
        @media (prefers-color-scheme: dark) {
            .syntax-tag { color: #7ee787; }
            .syntax-attr { color: #d2a8ff; }
            .syntax-string { color: #a5d6ff; }
            .syntax-comment { color: #8b949e; }
            .syntax-doctype { color: #8b949e; }
            .syntax-keyword { color: #ff7b72; }
            .syntax-builtin { color: #79c0ff; }
            .syntax-operator { color: #ff7b72; }
            .syntax-special-char { color: #79c0ff; }
            
            /* Adjust preview iframe for dark mode content */
            .preview-iframe {
                background-color: #ffffff;
                /* We keep the iframe background white because most generated 
                   content expects a light background */
            }
        }
    `;

    document.head.appendChild(style);
})();