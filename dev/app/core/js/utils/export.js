class Export {
    constructor() {
        this.initialized = false;
    }


    // Initializes the export system and exposes it globally
    initialize() {
        if (this.initialized) return;

        // Add export button to chat interface if needed
        document.addEventListener('DOMContentLoaded', () => {
            // Expose to window for global access
            window.export = this;
        });

        this.initialized = true;
       //console.log('Export system initialized');
    }

    // Exports the current conversation from the chat interface
    async exportConversation() {
       //console.log('Export: Exporting conversation with enhanced UTF-8 support');

        const aiReplies = document.querySelector('.ai-replies');
        if (!aiReplies) return;

        const allMessages = Array.from(aiReplies.querySelectorAll('.user-message, .assistant-message'));

        // Get conversation title from the first user message as default
        let conversationTitle = 'Conversation';
        try {
            const firstUserMessage = allMessages.find(msg => msg.classList.contains('user-message'));
            if (firstUserMessage) {
                const messageText = firstUserMessage.querySelector('.message-bubble')?.textContent?.trim();
                if (messageText && messageText.length > 0) {
                    // Use first few words of the first message as the title
                    conversationTitle = messageText.split(' ').slice(0, 5).join(' ');
                    if (messageText.length > conversationTitle.length) {
                        conversationTitle += '...';
                    }
                }
            }

            // Get current date as fallback
            const now = new Date();
            const dateStr = now.toLocaleDateString();
            if (conversationTitle === 'Conversation') {
                conversationTitle = `${Lang.get('conversationPrefix', 'Conversation')}_${dateStr}`;
            }
        } catch (error) {
            console.error('Export: Error getting conversation title:', error);
        }

        // Create the export options dialog
        this.showExportOptionsDialog(conversationTitle, allMessages);
    }
    // Exports a document summary with export format options
    exportDocumentSummary(summaryText, documentTitle) {
       //console.log('Export: Exporting document summary');

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'export-modal-overlay';
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        `;

        // Create modal container using theme variables
        const modal = document.createElement('div');
        modal.className = 'export-modal';
        modal.style.cssText = `
          background-color: var(--bg-color, #ffffff);
          color: var(--text-color, #000000);
          border-radius: 10px;
          padding: 24px;
          width: 450px;
          max-width: 90%;
          box-shadow: 0 5px 15px var(--preview-shadow, rgba(0, 0, 0, 0.3));
        `;

        // Modal header
        modal.innerHTML = `
          <h2 style="margin-top: 0; font-size: 1.5rem; color: var(--text-color, #000);">
            ${Lang.get('exportSummary') || 'Export Summary'}
          </h2>
          <p style="margin-bottom: 20px; color: var(--label-color, #666);">
            ${Lang.get('exportDescription') || 'Choose your preferred export format:'}
          </p>
        `;

        // Format options
        const formatContainer = document.createElement('div');
        formatContainer.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        `;

        // Helper for option row
        const createFormatOption = (id, icon, title, description) => {
            const option = document.createElement('div');
            option.className = 'export-option';
            option.style.cssText = `
            display: flex;
            align-items: center;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.2s;
            border: 2px solid transparent;
          `;
            option.innerHTML = `
            <input type="radio" id="${id}" name="export-format" value="${id}" style="margin-right: 12px;">
            <div style="margin-right: 16px; font-size: 24px; color: var(--accent-color, #4f46e5);">
                ${icon}
            </div>
            <div>
                <div style="font-weight: 600; margin-bottom: 4px; color: var(--text-color, #000);">${title}</div>
                <div style="font-size: 0.9rem; color: var(--label-color, #666);">${description}</div>
            </div>
          `;

            option.addEventListener('click', () => {
                // Select this radio button
                const radio = option.querySelector('input[type="radio"]');
                radio.checked = true;

                // Update styling for all options
                document.querySelectorAll('.export-option').forEach(opt => {
                    if (opt.querySelector('input[type="radio"]').checked) {
                        opt.style.backgroundColor = 'var(--chat-bubble-bg, rgba(79, 70, 229, 0.1))';
                        opt.style.borderColor = 'var(--accent-color, #4f46e5)';
                    } else {
                        opt.style.backgroundColor = '';
                        opt.style.borderColor = 'transparent';
                    }
                });
            });

            return option;
        };

        // Add format options
        formatContainer.appendChild(createFormatOption(
            'text',
            '<i class="fa-solid fa-file-lines"></i>',
            Lang.get('plainTextFormat') || 'Plain Text (.txt)',
            Lang.get('plainTextDescription') || 'Simple, compatible with all text editors'
        ));

        formatContainer.appendChild(createFormatOption(
            'markdown',
            '<i class="fa-brands fa-markdown"></i>',
            Lang.get('markdownFormat') || 'Markdown (.md)',
            Lang.get('markdownDescription') || 'Preserves formatting, code blocks, and links'
        ));

        formatContainer.appendChild(createFormatOption(
            'html',
            '<i class="fa-solid fa-file-code"></i>',
            Lang.get('htmlFormat') || 'HTML (.html)',
            Lang.get('htmlDescription') || 'Full formatting with proper styling'
        ));

        // Set markdown as default
        formatContainer.querySelector('input[value="text"]').checked = true;
        formatContainer.querySelector('.export-option:nth-child(1)').style.backgroundColor = 'var(--chat-bubble-bg, rgba(79, 70, 229, 0.1))';
        formatContainer.querySelector('.export-option:nth-child(1)').style.borderColor = 'var(--accent-color, #4f46e5)';

        modal.appendChild(formatContainer);

        // Buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 12px;
        `;

        const cancelButton = document.createElement('button');
        cancelButton.textContent = Lang.get('cancel') || 'Cancel';
        cancelButton.style.cssText = `
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid var(--border-color, #ddd);
          background-color: transparent;
          color: var(--text-color, #000);
          font-size: 14px;
          cursor: pointer;
        `;

        const exportButton = document.createElement('button');
        exportButton.textContent = Lang.get('export') || 'Export';
        exportButton.style.cssText = `
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          background-color: var(--accent-color, #4f46e5);
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        `;

        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(exportButton);
        modal.appendChild(buttonContainer);

        // Add modal to overlay and overlay to document
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Events
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });


        exportButton.addEventListener('click', () => {
            const selectedFormat = modal.querySelector('input[name="export-format"]:checked').value;
            document.body.removeChild(overlay);

            const now = new Date();
            const timestamp = now.toLocaleString();
            const sanitizedTitle = documentTitle
                .replace(/Summary of |Summary for |Summary:/gi, '')
                .replace(/[^a-z0-9]/gi, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');

            // Get summary body and create a clone to safely manipulate
            const summaryBody = document.getElementById('document-summary-body');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = summaryBody.innerHTML;

            // Remove editable notice
            const editableNotice = tempDiv.querySelector('.editable-notice');
            if (editableNotice) {
                editableNotice.remove();
            }

            // Get cleaned content ready for export
            const cleanedHTML = tempDiv.innerHTML;

            // Create a proper text representation with preserved formatting
            const textDiv = document.createElement('div');
            textDiv.style.cssText = 'white-space: pre-wrap; position: absolute; left: -9999px;';
            textDiv.innerHTML = cleanedHTML;
            document.body.appendChild(textDiv);

            // Extract properly formatted plain text
            const formattedText = textDiv.innerText;
            document.body.removeChild(textDiv);

            switch (selectedFormat) {
                case 'text':
                    const txtContent = `${documentTitle}\n\nGenerated on: ${timestamp}\n\n${formattedText}`;
                    this.downloadConversation(txtContent, `${sanitizedTitle}_Summary_${Date.now()}.txt`, 'text/plain; charset=utf-8');
                    break;

                case 'markdown':
                    // For markdown, preserve the exact plain text structure
                    let mdContent = `# ${documentTitle}\n\n`;
                    mdContent += `*Generated on: ${timestamp}*\n\n---\n\n`;

                    // Preserve exact formatting but enhance with minimal markdown
                    // Convert section headers, but keep spacing and indentation
                    let mdBody = formattedText
                        // Convert section headers to markdown headings
                        .replace(/^([A-Z][a-zA-Z\s\-&]+):$/gm, '## $1')
                        // Convert bullet points
                        .replace(/^(\s*)[-•]\s+/gm, '$1* ');

                    mdContent += mdBody;
                    this.downloadConversation(mdContent, `${sanitizedTitle}_Summary_${Date.now()}.md`, 'text/markdown; charset=utf-8');
                    break;

                case 'html':
                    // For HTML, we'll create proper paragraph and list elements
                    // First get the clean HTML content
                    const cleanedContent = cleanedHTML
                        // Fix any potential encoding issues
                        .replace(/&nbsp;/g, ' ')
                        .replace(/&amp;/g, '&');

                    const htmlContent = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${this.escapeHtml(documentTitle)}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    margin-bottom: 30px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 10px;
                }
                .timestamp {
                    color: #666;
                    font-size: 0.9rem;
                    margin-bottom: 20px;
                }
                .content {
                    white-space: pre-wrap;
                }
                h1, h2, h3, h4, h5, h6 {
                    color: #333;
                    margin-top: 24px;
                    margin-bottom: 16px;
                }
                ul, ol {
                    padding-left: 25px;
                    margin: 16px 0;
                }
                li {
                    margin-bottom: 8px;
                }
                pre {
                    background-color: #f6f8fa;
                    padding: 16px;
                    border-radius: 6px;
                    overflow: auto;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${this.escapeHtml(documentTitle)}</h1>
                <div class="timestamp">Generated on: ${timestamp}</div>
            </div>
            <div class="content">
                ${cleanedContent}
            </div>
        </body>
        </html>`;
                    this.downloadConversation(htmlContent, `${sanitizedTitle}_Summary_${Date.now()}.html`, 'text/html; charset=utf-8');
                    break;

                default:
                    console.error('Unknown export format', selectedFormat);
            }
        });
    }

    // Shows the export options dialog/modal for the user to select format and filename
    showExportOptionsDialog(masterkeyvalue, allMessages) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'export-modal-overlay';
        overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `;

        // Create modal container using theme variables
        const modal = document.createElement('div');
        modal.className = 'export-modal';
        modal.style.cssText = `
      background-color: var(--bg-color, #ffffff);
      color: var(--text-color, #000000);
      border-radius: 10px;
      padding: 24px;
      width: 450px;
      max-width: 90%;
      box-shadow: 0 5px 15px var(--preview-shadow, rgba(0, 0, 0, 0.3));
    `;

        // Modal header
        modal.innerHTML = `
      <h2 style="margin-top: 0; font-size: 1.5rem; color: var(--text-color, #000);">
          ${Lang.get('exportConversation') || 'Export Conversation'}
      </h2>
      <p style="margin-bottom: 20px; color: var(--label-color, #666);">
          ${Lang.get('exportDescription') || 'Choose your preferred export format:'}
      </p>
    `;

        // Add filename input field
        const filenameContainer = document.createElement('div');
        filenameContainer.style.cssText = `
      margin-bottom: 20px;
    `;

        // Create label for filename
        filenameContainer.innerHTML = `
      <label for="export-filename" style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text-color, #000);">
        ${Lang.get('exportFilename') || 'Filename'}:
      </label>
    `;

        // Create filename input with the masterkeyvalue as default
        const filenameInput = document.createElement('input');
        filenameInput.id = 'export-filename';
        filenameInput.type = 'text';
        filenameInput.value = masterkeyvalue.replace(/[^a-z0-9\s-]/gi, ' ').trim();
        filenameInput.style.cssText = `
      width: 100%;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid var(--border-color, #ddd);
      background-color: var(--input-bg, #fff);
      color: var(--text-color, #000);
      font-size: 14px;
      box-sizing: border-box;
    `;

        filenameContainer.appendChild(filenameInput);
        modal.appendChild(filenameContainer);

        // Format options
        const formatContainer = document.createElement('div');
        formatContainer.style.cssText = `
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        `;

        // Helper for option row
        const createFormatOption = (id, icon, title, description) => {
            const option = document.createElement('div');
            option.className = 'export-option';
            option.style.cssText = `
            display: flex;
            align-items: center;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.2s;
            border: 2px solid transparent;
        `;
            option.innerHTML = `
           <input type="radio" id="${id}" name="export-format" value="${id}" style="margin-right: 12px;">
           <div style="margin-right: 16px; font-size: 24px; color: var(--accent-color, #4f46e5);">
               ${icon}
           </div>
           <div>
               <div style="font-weight: 600; margin-bottom: 4px; color: var(--text-color, #000);">${title}</div>
               <div style="font-size: 0.9rem; color: var(--label-color, #666);">${description}</div>
           </div>
       `;

            option.addEventListener('click', () => {
                // Select this radio button
                const radio = option.querySelector('input[type="radio"]');
                radio.checked = true;

                // Update styling for all options
                document.querySelectorAll('.export-option').forEach(opt => {
                    if (opt.querySelector('input[type="radio"]').checked) {
                        opt.style.backgroundColor = 'var(--chat-bubble-bg, rgba(79, 70, 229, 0.1))';
                        opt.style.borderColor = 'var(--accent-color, #4f46e5)';
                    } else {
                        opt.style.backgroundColor = '';
                        opt.style.borderColor = 'transparent';
                    }
                });
            });

            return option;
        };

        // Add format options
        formatContainer.appendChild(createFormatOption(
            'text',
            '<i class="fa-solid fa-file-lines"></i>',
            Lang.get('plainTextFormat') || 'Plain Text (.txt)',
            Lang.get('plainTextDescription') || 'Simple, compatible with all text editors'
        ));

        formatContainer.appendChild(createFormatOption(
            'markdown',
            '<i class="fa-brands fa-markdown"></i>',
            Lang.get('markdownFormat') || 'Markdown (.md)',
            Lang.get('markdownDescription') || 'Preserves formatting, code blocks, and links'
        ));

        formatContainer.appendChild(createFormatOption(
            'html',
            '<i class="fa-solid fa-file-code"></i>',
            Lang.get('htmlFormat') || 'HTML (.html)',
            Lang.get('htmlDescription') || 'Full formatting with proper styling'
        ));

        // Set first option as default
        formatContainer.querySelector('input[type="radio"]').checked = true;
        formatContainer.querySelector('.export-option').style.backgroundColor = 'var(--chat-bubble-bg, rgba(79, 70, 229, 0.1))';
        formatContainer.querySelector('.export-option').style.borderColor = 'var(--accent-color, #4f46e5)';

        modal.appendChild(formatContainer);

        // Buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
         display: flex;
         justify-content: flex-end;
         gap: 12px;
         margin-top: 12px;
       `;

        const cancelButton = document.createElement('button');
        cancelButton.textContent = Lang.get('cancel') || 'Cancel';
        cancelButton.style.cssText = `
         padding: 8px 16px;
         border-radius: 6px;
         border: 1px solid var(--border-color, #ddd);
         background-color: transparent;
         color: var(--text-color, #000);
         font-size: 14px;
         cursor: pointer;
       `;

        const exportButton = document.createElement('button');
        exportButton.textContent = Lang.get('export') || 'Export';
        exportButton.style.cssText = `
         padding: 8px 16px;
         border-radius: 6px;
         border: none;
         background-color: var(--accent-color, #4f46e5);
         color: white;
         font-size: 14px;
         font-weight: 500;
         cursor: pointer;
       `;

        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(exportButton);
        modal.appendChild(buttonContainer);

        // Add modal to overlay and overlay to document
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Events
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        exportButton.addEventListener('click', () => {
            const selectedFormat = modal.querySelector('input[name="export-format"]:checked').value;
            const userFilename = filenameInput.value.trim();

            // Validate filename
            if (!userFilename) {
                // Show error message if filename is empty
                alert(Lang.get('filenameRequired') || 'Please enter a filename');
                return;
            }

            document.body.removeChild(overlay);

            // Sanitize the filename provided by user
            const sanitizedFilename = userFilename.replace(/[^a-z0-9\s-]/gi, '_').replace(/\s+/g, '_').replace(/_+/g, '_');

            // Check if content is a string (from knowledge base) or DOM elements (from chat)
            const isStringContent = typeof allMessages === 'string';

            // Generate the export based on selected format
            switch (selectedFormat) {
                case 'text':
                    if (isStringContent) {
                        this.exportTextContent(sanitizedFilename, allMessages);
                    } else {
                        this.generatePlainTextExport(sanitizedFilename, allMessages);
                    }
                    break;
                case 'markdown':
                    if (isStringContent) {
                        // If content is already in markdown format (from KB), just export it directly
                        this.exportTextContent(sanitizedFilename, allMessages, 'markdown');
                    } else {
                        this.generateMarkdownExport(sanitizedFilename, allMessages);
                    }
                    break;
                case 'html':
                    if (isStringContent) {
                        this.exportContentAsHtml(sanitizedFilename, allMessages);
                    } else {
                        this.generateHtmlExport(sanitizedFilename, allMessages);
                    }
                    break;
                default:
                    if (isStringContent) {
                        this.exportTextContent(sanitizedFilename, allMessages);
                    } else {
                        this.generatePlainTextExport(sanitizedFilename, allMessages);
                    }
            }
        });
    }

    // Exports plain or markdown text content from the knowledge base
    exportTextContent(filename, content, format = 'text') {
        const now = new Date();
        const timestamp = now.toLocaleString();

        // Clean the content based on format
        let cleanedContent;
        if (format === 'text') {
            cleanedContent = this.cleanKnowledgeBaseContent(this.stripMarkdownFormatting(content));
        } else {
            cleanedContent = this.cleanKnowledgeBaseContent(content);
        }

        // DON'T add a header since the content already includes the collection name
        // Just add the export timestamp if it's not already there
        let finalContent = cleanedContent;

        // Only add timestamp if it's not already in the content
        ///if (!finalContent.includes('Exported on:') && !finalContent.includes('Exportado el:')) {
        //    finalContent = `Exported on: ${timestamp}\n\n${finalContent}`;
        //}

        // Generate filename
        let finalFilename;
        let mimeType;

        if (format === 'markdown') {
            finalFilename = `${filename}_${Date.now()}.md`;
            mimeType = 'text/markdown; charset=utf-8';
        } else {
            finalFilename = `${filename}_${Date.now()}.txt`;
            mimeType = 'text/plain; charset=utf-8';
        }

        this.downloadConversation(finalContent, finalFilename, mimeType);
    }

    // Cleans up exported knowledge base content by removing metadata and formatting artifacts
    cleanKnowledgeBaseContent(text) {
        if (!text) return '';

        return text
            // Remove duplicate titles (keep only the first occurrence)
            .replace(/^(.+)\n\1$/gm, '$1')

            // Remove all "Exported on:" lines (English only)
            .replace(/^Exported on:.*$/gm, '')
            .replace(/^\*Exported on:.*$/gm, '')
            .replace(/^Generated on:.*$/gm, '')
            .replace(/^\*Generated on:.*$/gm, '')

            // Remove standalone "#" lines
            .replace(/^#\s*$/gm, '')

            // Remove entry count lines (English only)
            .replace(/^Total entries:.*$/gm, '')
            .replace(/^\*Total entries:.*$/gm, '')

            // Clean up entry metadata (English only)
            .replace(/^Created:.*$/gm, '')
            .replace(/^\*Created:.*$/gm, '')
            .replace(/^Last updated:.*$/gm, '')
            .replace(/^\*Last updated:.*$/gm, '')
            .replace(/^Source:.*$/gm, '')
            .replace(/^\*Source:.*$/gm, '')
            .replace(/^This entry was created as a source reference.*$/gm, '')
            .replace(/^\*This entry was created as a source reference.*$/gm, '')

            // Remove separator lines
            .replace(/^-{3,}.*$/gm, '')
            .replace(/^=+$/gm, '')

            // Remove "Source from research:" lines
            .replace(/^Source from research:.*$/gm, '')
            .replace(/^\*Source from research:.*$/gm, '')

            // Remove duplicate titles that appear after "Source from research:"
            .replace(/Source from research: "([^"]+)"\s*\n\s*#\s*\1/gm, 'Source from research: "$1"')

            // Remove empty markdown headers
            .replace(/^#+\s*$/gm, '')

            // Remove lines that are just whitespace
            .replace(/^\s+$/gm, '')

            // Clean up multiple consecutive newlines (more than 2)
            .replace(/\n{4,}/g, '\n\n\n')

            // Remove the repeated filename at the beginning if it appears multiple times
            .replace(/^(.+)\n\1\n/m, '$1\n')

            // Trim whitespace from start and end
            .trim();
    }

    // Strips markdown formatting from a string, leaving only plain text
    stripMarkdownFormatting(text) {
        if (!text) return '';

        return text
            // Remove headers
            .replace(/^#+\s+/gm, '')
            // Remove bold
            .replace(/\*\*(.*?)\*\*/g, '$1')
            // Remove italic
            .replace(/\*(.*?)\*/g, '$1')
            // Remove code blocks
            .replace(/```[\s\S]*?```/g, function (match) {
                // Extract just the code content without the backticks and language
                return match
                    .replace(/```[\w]*\n/, '') // Remove opening ```language
                    .replace(/```$/, '')        // Remove closing ```
                    .trim();
            })
            // Remove inline code
            .replace(/`(.*?)`/g, '$1')
            // Remove horizontal rules
            .replace(/^---+$/gm, '')
            // Remove blockquotes
            .replace(/^>\s+/gm, '')
            // Simplify links
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            // Remove image references
            .replace(/!\[(.*?)\]\(.*?\)/g, '[Image: $1]')
            // Clean up any multiple blank lines that resulted from removals
            .replace(/\n{3,}/g, '\n\n');
    }
    // Exports string content as HTML, converting markdown if needed
    exportContentAsHtml(title, content) {
        const now = new Date();
        const timestamp = now.toLocaleString();

        // Clean the content first
        const cleanedContent = this.cleanKnowledgeBaseContent(content);

        // Convert content from markdown to HTML if needed
        let htmlBody = cleanedContent;
        if (cleanedContent.includes('# ') || cleanedContent.includes('## ')) {
            // Simple markdown to HTML conversion for headings
            htmlBody = cleanedContent
                .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
                .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
                .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');

            // Wrap in paragraphs
            htmlBody = '<p>' + htmlBody + '</p>';

            // Fix empty paragraphs
            htmlBody = htmlBody.replace(/<p><\/p>/g, '').replace(/<p><br><\/p>/g, '');
        }

        // Create HTML document
        const htmlContent = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${this.escapeHtml(title)}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    margin-bottom: 30px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 10px;
                }
                .timestamp {
                    color: #666;
                    font-size: 0.9rem;
                    margin-bottom: 20px;
                }
                h1, h2, h3 { margin-top: 1.5em; margin-bottom: 0.5em; }
                h1 { font-size: 1.8em; }
                h2 { font-size: 1.5em; }
                h3 { font-size: 1.3em; }
                hr { border: none; border-top: 1px solid #eee; margin: 2em 0; }
                p { margin-bottom: 1em; }
            </style>
        </head>
        <body>
            <div class="content">
                ${htmlBody}
            </div>
        </body>
        </html>`;

        // Generate filename
        const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
        const filename = `${sanitizedTitle}_${Date.now()}.html`;

        // Download as HTML file
        this.downloadConversation(htmlContent, filename, 'text/html; charset=utf-8');
    }
    // Formats summary text for display or export, preserving structure and newlines
    formatSummaryText(text) {
        if (!text) return '';

        // First clean the text
        const cleanedText = this.cleanText(text);

        // Format the text with proper structure
        let formattedText = cleanedText
            // Ensure sections end with double newlines
            .replace(/^(.+):$/gm, '$1:\n\n')

            // Add line break after standalone headers (all caps sections)
            .replace(/^([A-Z][A-Z\s]+[A-Z])$/gm, '$1\n\n')

            // Ensure bullet points have proper spacing
            .replace(/^([-*•]\s.+)$/gm, '$1\n')

            // Ensure section titles have space after them
            .replace(/\n([A-Z][a-zA-Z\s]*:)/g, '\n\n$1')

            // Fix any potential heading issues (title followed by content)
            .replace(/(^|\n)([A-Z][a-zA-Z\s]+)(\n|$)/g, '$1$2\n\n')

            // Normalize paragraph spacing - ensure exactly two newlines between paragraphs
            .replace(/\n{3,}/g, '\n\n');

        // Instead of replacing newlines with <br> tags, we'll use a custom data-attribute
        // to keep track of where newlines should be preserved
        const wrappedText = `<div class="summary-content" data-preserve-newlines="true">${formattedText.split('\n').map(line =>
            `<div class="summary-line">${line || '&nbsp;'}</div>`
        ).join('')
            }</div>`;

        // Store the original formatted text with proper newlines as a data attribute
        // This way we can extract it later for text/markdown export
        const container = document.createElement('div');
        container.innerHTML = wrappedText;
        container.firstChild.setAttribute('data-original-text', formattedText);

        return container.innerHTML;
    }

    // Generates and downloads a plain text export of the conversation
    generatePlainTextExport(filename, allMessages) {
        const now = new Date();
        const timestamp = now.toLocaleString();
        let textContent = `${filename} - ${timestamp}\n\n`;

        // Filter out non-conversation messages
        const validMessages = Array.from(allMessages).filter(message => {
            // Skip welcome messages
            if (message.classList.contains('welcome-message')) return false;

            // Skip continuation containers
            if (message.classList.contains('continuation-container') ||
                message.classList.contains('continue-conversation-container') ||
                message.classList.contains('continue-button-container') ||
                message.classList.contains('context-reset-note')) return false;

            // Skip system messages
            if (message.classList.contains('system-message')) return false;

            // Include only user and assistant messages that aren't special types
            return message.classList.contains('user-message') ||
                (message.classList.contains('assistant-message') && !message.classList.contains('welcome-message'));
        });

        // Process each message as plain text
        for (const message of validMessages) {
            if (message.classList.contains('user-message')) {
                // Extract only the message content, not any continuation text
                const userBubble = message.querySelector('.message-bubble');
                let userContent = '';

                if (userBubble) {
                    // Create a clone to safely extract content
                    const clone = userBubble.cloneNode(true);

                    // Remove continuation prompts
                    const allElements = clone.querySelectorAll('*');
                    allElements.forEach(el => {
                        if (el.textContent && (
                            el.textContent.includes('Continuation from previous conversation') ||
                            el.textContent.includes('Continue the conversation naturally') ||
                            el.textContent.includes('Consider the context below')
                        )) {
                            el.remove();
                        }
                    });

                    // Remove any image references
                    const images = clone.querySelectorAll('img');
                    images.forEach(img => img.remove());

                    userContent = clone.textContent || '';

                    // Handle JSON image content
                    try {
                        if (userContent.startsWith('{') && userContent.includes('"text"') && userContent.includes('"images"')) {
                            const parsed = JSON.parse(userContent);
                            if (parsed.text) {
                                userContent = parsed.text; // Extract just the text part
                            }
                        }
                    } catch (e) {
                        // Not valid JSON, use as is
                    }

                    // Clean the content and strip markdown formatting for plain text
                    userContent = this.stripMarkdownFormatting(this.cleanText(userContent));
                }

                textContent += `User:\n${userContent}\n\n`;
            }
            else if (message.classList.contains('assistant-message')) {
                const aiContainer = message.querySelector('.ai-response-container');
                if (aiContainer) {
                    // Create a clone to manipulate
                    const clone = aiContainer.cloneNode(true);

                    // Remove all interactive and non-content elements
                    const elementsToRemove = [
                        '.message-actions',
                        '.copy-response-container',
                        '.code-copy-btn',
                        'button',
                        '.cancel-note',
                        '.regenerate-inline-button',
                        '.continuation-container',
                        '.continue-conversation-container',
                        '.continue-button-container',
                        '.context-reset-note',
                        '[onclick]',
                        'script',
                        'style',
                        'img'  // Remove all images
                    ];

                    // Remove all unwanted elements
                    elementsToRemove.forEach(selector => {
                        const elements = clone.querySelectorAll(selector);
                        elements.forEach(el => el.remove());
                    });

                    // Remove continuation text
                    this.removeContinuationText(clone);

                    // Get text content and strip markdown formatting for plain text
                    const assistantText = this.stripMarkdownFormatting(this.cleanText(clone.textContent.trim()));
                    textContent += `Assistant:\n${assistantText}\n\n`;
                }
            }
        }

        // Generate filename
        const finalFilename = `${filename}_${Date.now()}.txt`;

        // Download as plain text file
        this.downloadConversation(textContent, finalFilename, 'text/plain; charset=utf-8');
    }

    // Generates and downloads a markdown export of the conversation
    generateMarkdownExport(filename, allMessages) {
        const now = new Date();
        const timestamp = now.toLocaleString();
        let mdContent = `# ${filename}\n\n`;
        //mdContent += `*Exported on: ${timestamp}*\n\n---\n\n`;

        // Filter out non-conversation messages
        const validMessages = Array.from(allMessages).filter(message => {
            // Skip welcome messages
            if (message.classList.contains('welcome-message')) return false;

            // Skip continuation containers
            if (message.classList.contains('continuation-container') ||
                message.classList.contains('continue-conversation-container') ||
                message.classList.contains('continue-button-container') ||
                message.classList.contains('context-reset-note')) return false;

            // Skip system messages
            if (message.classList.contains('system-message')) return false;

            // Include only user and assistant messages that aren't special types
            return message.classList.contains('user-message') ||
                (message.classList.contains('assistant-message') && !message.classList.contains('welcome-message'));
        });

        // Process each message
        for (const message of validMessages) {
            if (message.classList.contains('user-message')) {
                // Extract only the message content, not any continuation text
                const userBubble = message.querySelector('.message-bubble');
                let userContent = '';

                if (userBubble) {
                    // Create a clone to safely extract content
                    const clone = userBubble.cloneNode(true);

                    // Remove continuation prompts
                    const allElements = clone.querySelectorAll('*');
                    allElements.forEach(el => {
                        if (el.textContent && (
                            el.textContent.includes('Continuation from previous conversation') ||
                            el.textContent.includes('Continue the conversation naturally') ||
                            el.textContent.includes('Consider the context below')
                        )) {
                            el.remove();
                        }
                    });

                    // Remove any image elements
                    const images = clone.querySelectorAll('img');
                    images.forEach(img => img.remove());

                    userContent = clone.textContent || '';

                    // Handle JSON image content
                    try {
                        if (userContent.startsWith('{') && userContent.includes('"text"') && userContent.includes('"images"')) {
                            const parsed = JSON.parse(userContent);
                            if (parsed.text) {
                                userContent = parsed.text; // Extract just the text part
                            }
                        }
                    } catch (e) {
                        // Not valid JSON, use as is
                    }

                    // Clean the content
                    userContent = this.cleanText(userContent);
                }

                // Add user message heading and content
                mdContent += `## User\n\n${userContent}\n\n`;
            }
            else if (message.classList.contains('assistant-message')) {
                const aiContainer = message.querySelector('.ai-response-container');
                if (aiContainer) {
                    // Create a deep clone to avoid modifying original
                    const clone = aiContainer.cloneNode(true);

                    // Remove all interactive and non-content elements
                    const elementsToRemove = [
                        '.message-actions',
                        '.copy-response-container',
                        '.code-copy-btn',
                        'button',
                        '.cancel-note',
                        '.regenerate-inline-button',
                        '.continuation-container',
                        '.continue-conversation-container',
                        '.continue-button-container',
                        '.context-reset-note',
                        '[onclick]', // Remove elements with onclick attributes
                        'script',    // Remove any script elements
                        'style',     // Remove any style elements
                        'img'        // Remove all image elements
                    ];

                    // Remove all unwanted elements
                    elementsToRemove.forEach(selector => {
                        const elements = clone.querySelectorAll(selector);
                        elements.forEach(el => el.remove());
                    });

                    // Remove continuation text
                    this.removeContinuationText(clone);

                    // Add assistant message heading
                    mdContent += `## Assistant\n\n`;

                    // Convert HTML to Markdown
                    const markdownText = this.convertHtmlToMarkdown(clone);

                    // Add the markdown
                    mdContent += markdownText;
                    mdContent += '\n\n';
                }
            }
        }

        // Generate filename
        const finalFilename = `${filename}_${Date.now()}.md`;

        // Download as markdown file
        this.downloadConversation(mdContent, finalFilename, 'text/markdown; charset=utf-8');
    }

    // Generates and downloads an HTML export of the conversation
    generateHtmlExport(filename, allMessages) {
       //console.log('Export: Generating HTML export');

        const now = new Date();
        const timestamp = now.toLocaleString();

        // Create a full HTML document with styling
        let htmlContent = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${this.escapeHtml(filename)}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    margin-bottom: 30px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 10px;
                }
                .timestamp {
                    color: #666;
                    font-size: 0.9rem;
                    margin-bottom: 20px;
                }
                .message {
                    margin-bottom: 25px;
                }
                .message-header {
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .user-message .message-header {
                    color: #4f46e5;
                }
                .assistant-message .message-header {
                    color: #10b981;
                }
                .message-content {
                    background-color: #f9f9f9;
                    padding: 15px;
                    border-radius: 5px;
                }
                code {
                    font-family: Menlo, Monaco, "Courier New", monospace;
                    background-color: #f0f0f0;
                    padding: 2px 4px;
                    border-radius: 3px;
                }
                pre {
                    background-color: #f0f0f0;
                    padding: 10px;
                    border-radius: 5px;
                    overflow-x: auto;
                }
                pre code {
                    background-color: transparent;
                    padding: 0;
                }
                .code-block {
                    margin: 15px 0;
                }
                .code-header {
                    background-color: #e0e0e0;
                    padding: 5px 10px;
                    border-top-left-radius: 5px;
                    border-top-right-radius: 5px;
                    font-weight: bold;
                    font-size: 0.9rem;
                }
                .code-content {
                    margin-top: 0;
                    border-top-left-radius: 0;
                    border-top-right-radius: 0;
                }
                .user-message-images {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-top: 10px;
                }
                .user-message-images img {
                    max-width: 100%;
                    max-height: 400px;
                    border-radius: 5px;
                    object-fit: contain;
                }
            </style>
        </head>
        <body>
          <div class="header">
              <h1>${this.escapeHtml(filename)}</h1>
          </div>
        `;

        // Filter valid messages
        const validMessages = Array.from(allMessages).filter(message => {
            // Skip welcome messages
            if (message.classList.contains('welcome-message')) return false;

            // Skip continuation containers
            if (message.classList.contains('continuation-container') ||
                message.classList.contains('continue-conversation-container') ||
                message.classList.contains('continue-button-container') ||
                message.classList.contains('context-reset-note')) return false;

            // Skip system messages
            if (message.classList.contains('system-message')) return false;

            // Include only user and assistant messages that aren't special types
            return message.classList.contains('user-message') ||
                (message.classList.contains('assistant-message') && !message.classList.contains('welcome-message'));
        });

        // Process each message
        for (const message of validMessages) {
            if (message.classList.contains('user-message')) {
                // Extract only the message content, not any continuation text
                const userBubble = message.querySelector('.message-bubble');
                let userContent = '';

                if (userBubble) {
                    // Create a clone to safely extract content
                    const clone = userBubble.cloneNode(true);

                    // Remove any continuation prompts 
                    const allElements = clone.querySelectorAll('*');
                    allElements.forEach(el => {
                        if (el.textContent && (
                            el.textContent.includes('Continuation from previous conversation') ||
                            el.textContent.includes('Continue the conversation naturally') ||
                            el.textContent.includes('Consider the context below')
                        )) {
                            el.remove();
                        }
                    });

                    userContent = clone.textContent || '';

                    // Check if content looks like a JSON string with image data
                    try {
                        if (userContent.startsWith('{') && userContent.includes('"text"') && userContent.includes('"images"')) {
                            const parsed = JSON.parse(userContent);
                            if (parsed.text) {
                                userContent = parsed.text; // Extract just the text part
                            }
                        }
                    } catch (e) {
                        // Not valid JSON, use as is
                    }

                    // Clean the content and convert markdown to HTML for HTML export
                    userContent = this.convertMarkdownToHtml(this.cleanText(userContent));
                }

                // Start user message container
                htmlContent += `
                <div class="message user-message">
                    <div class="message-header">User</div>
                    <div class="message-content">${userContent}`;

                // Check for images in the user message
                const imageElements = message.querySelectorAll('img');
                if (imageElements && imageElements.length > 0) {
                    htmlContent += `
                    <div class="user-message-images">`;

                    // Process each image
                    imageElements.forEach(img => {
                        // Use the full image source if available (from dataset)
                        const imgSrc = img.dataset.fullImage || img.src;
                        if (imgSrc && !imgSrc.endsWith('...')) {
                            htmlContent += `
                            <img src="${imgSrc}" alt="User shared image">`;
                        }
                    });

                    htmlContent += `
                    </div>`;
                }

                // Close user message container
                htmlContent += `
                    </div>
                </div>`;
            }
            else if (message.classList.contains('assistant-message')) {
                const aiContainer = message.querySelector('.ai-response-container');
                if (aiContainer) {
                    // Create a deep clone to avoid modifying original
                    const clone = aiContainer.cloneNode(true);

                    // Remove all interactive and non-content elements
                    const elementsToRemove = [
                        '.message-actions',
                        '.copy-response-container',
                        '.code-copy-btn',
                        'button',
                        '.cancel-note',
                        '.regenerate-inline-button',
                        '.continuation-container',
                        '.continue-conversation-container',
                        '.continue-button-container',
                        '.context-reset-note',
                        '[onclick]', // Remove elements with onclick attributes
                        'script',    // Remove any script elements
                        'style'      // Remove any style elements
                    ];

                    // Remove all unwanted elements
                    elementsToRemove.forEach(selector => {
                        const elements = clone.querySelectorAll(selector);
                        elements.forEach(el => el.remove());
                    });

                    // Remove continuation text
                    this.removeContinuationText(clone);

                    // For HTML export, we need to process any markdown in the text content
                    // while preserving existing HTML structure
                    this.processMarkdownInHtml(clone);

                    // Format the assistant's response
                    htmlContent += `
                    <div class="message assistant-message">
                    <div class="message-header">Assistant</div>
                    <div class="message-content">${this.cleanHtmlForExport(clone)}</div>
                    </div>
                    `;
                }
            }
        }

        // Close HTML document
        htmlContent += `
        </body>
        </html>`;

        // Generate filename
        const finalFilename = `${filename}_${Date.now()}.html`;

        // Download as HTML file
        this.downloadConversation(htmlContent, finalFilename, 'text/html; charset=utf-8');
    }

    // Converts markdown-formatted text to HTML
    convertMarkdownToHtml(text) {
        if (!text) return '';

        return text
            // Convert headers
            .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
            .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
            .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
            // Convert bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Convert italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Convert inline code
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Convert links
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
            // Convert line breaks
            .replace(/\n/g, '<br>');
    }

    // Processes markdown within an existing HTML container, converting text nodes
    processMarkdownInHtml(container) {
        // Find all text nodes and process markdown in them
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            const originalText = textNode.textContent;

            // Skip if this text is already inside code blocks or other formatted elements
            const parent = textNode.parentElement;
            if (parent && (parent.tagName === 'CODE' || parent.tagName === 'PRE' ||
                parent.classList.contains('code-block'))) {
                return;
            }

            // Convert markdown in this text node
            const htmlText = this.convertMarkdownToHtml(originalText);

            // Only replace if there was markdown to convert
            if (htmlText !== originalText) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlText;

                // Replace the text node with the converted HTML
                const fragment = document.createDocumentFragment();
                while (tempDiv.firstChild) {
                    fragment.appendChild(tempDiv.firstChild);
                }
                textNode.parentNode.replaceChild(fragment, textNode);
            }
        });
    }

    // Removes continuation prompt text from a DOM element
    removeContinuationText(element) {
        if (!element) return;

        // Find all elements that might contain continuation text
        const allElements = element.querySelectorAll('*');
        allElements.forEach(el => {
            if (el.textContent && (
                el.textContent.includes('Continuation from previous conversation') ||
                el.textContent.includes('Continue the conversation naturally') ||
                el.textContent.includes('Consider the context below')
            )) {
                el.remove();
            }
        });

        // Additionally check text nodes directly under the element
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        const textsToRemove = [];

        while (walker.nextNode()) {
            const textNode = walker.currentNode;
            if (textNode.textContent.includes('Continuation from previous conversation') ||
                textNode.textContent.includes('Continue the conversation naturally') ||
                textNode.textContent.includes('Consider the context below')) {
                textsToRemove.push(textNode);
            }
        }

        // Remove the identified text nodes
        textsToRemove.forEach(node => {
            const parent = node.parentNode;
            if (parent) {
                // Remove the whole paragraph if it contains continuation text
                if (parent.tagName === 'P' || parent.tagName === 'DIV') {
                    parent.remove();
                } else {
                    node.remove();
                }
            }
        });

        return element;
    }

    // Cleans up text by normalizing line breaks and removing unwanted characters
    cleanText(text) {
        if (!text) return '';

        return text
            .replace(/\r\n/g, '\n')  // Normalize line breaks
            .replace(/\ufffd/g, '') // Remove replacement character
            .replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu, '') // Remove emojis
            .replace(/â€™/g, "'")  // Fix apostrophes
            .replace(/â€œ/g, '"')  // Fix left double quotes
            .replace(/â€/g, '"')   // Fix right double quotes
            .replace(/â€¦/g, '...') // Fix ellipsis
            .replace(/â€"/g, '—')  // Fix em dash
            .replace(/Â/g, '')     // Remove non-breaking space artifact
            .replace(/ðŸ.{1,3}/g, ''); // Remove emoji codes
    }

    escapeHtml(text) {
        if (!text) return '';

        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Cleans HTML for export by removing styles, classes, and unwanted attributes
    cleanHtmlForExport(container) {
        // Get just the HTML we need
        const cleanHtml = container.innerHTML
            // Remove any inline styles
            .replace(/ style="[^"]*"/g, '')
            // Remove any class attributes
            .replace(/ class="[^"]*"/g, '')
            // Remove any data attributes
            .replace(/ data-[^=]*="[^"]*"/g, '')
            // Fix any encoding issues in attributes
            .replace(/â€™/g, "'")
            .replace(/â€œ/g, '"')
            .replace(/â€/g, '"')
            .replace(/â€¦/g, '...')
            .replace(/â€"/g, '—')
            .replace(/Â/g, '');

        return cleanHtml;
    }

    // Converts HTML content to markdown format for export
    convertHtmlToMarkdown(container) {
        // Create a deep clone to avoid modifying the original
        const clone = container.cloneNode(true);

        // Remove UI elements
        const nonContentElements = clone.querySelectorAll('.message-actions, .copy-response-container, .code-copy-btn, button, .cancel-note');
        nonContentElements.forEach(el => el.remove());

        let markdown = '';

        // Process code blocks first
        const codeBlocks = clone.querySelectorAll('.code-block');
        codeBlocks.forEach(block => {
            const language = block.querySelector('.code-language')?.textContent?.trim() || '';
            const code = block.querySelector('code')?.textContent?.trim() || '';

            // Add a placeholder we can replace later
            const placeholder = `CODE_BLOCK_${Math.random().toString(36).substring(2)}`;
            const codeMarkdown = `\`\`\`${language}\n${code}\n\`\`\``;

            block.textContent = placeholder;
            markdown += codeMarkdown;
        });

        // Process headings
        for (let i = 1; i <= 6; i++) {
            const headings = clone.querySelectorAll(`h${i}`);
            headings.forEach(heading => {
                const text = heading.textContent.trim();
                const placeholder = `HEADING_${i}_${Math.random().toString(36).substring(2)}`;
                const headingMarkdown = `${'#'.repeat(i)} ${text}\n\n`;

                heading.textContent = placeholder;
                markdown = markdown.replace(placeholder, headingMarkdown);
            });
        }

        // Process lists
        const lists = clone.querySelectorAll('ul, ol');
        lists.forEach(list => {
            const items = list.querySelectorAll('li');
            const isOrdered = list.tagName.toLowerCase() === 'ol';

            let listMarkdown = '\n';

            items.forEach((item, index) => {
                const bullet = isOrdered ? `${index + 1}. ` : '* ';
                listMarkdown += `${bullet}${item.textContent.trim()}\n`;
            });

            listMarkdown += '\n';

            const placeholder = `LIST_${Math.random().toString(36).substring(2)}`;
            list.textContent = placeholder;
            markdown = markdown.replace(placeholder, listMarkdown);
        });

        // Process links
        const links = clone.querySelectorAll('a');
        links.forEach(link => {
            const text = link.textContent.trim();
            const href = link.getAttribute('href');

            if (href) {
                const placeholder = `LINK_${Math.random().toString(36).substring(2)}`;
                const linkMarkdown = `[${text}](${href})`;

                link.textContent = placeholder;
                markdown = markdown.replace(placeholder, linkMarkdown);
            }
        });

        // Process basic formatting
        const boldElements = clone.querySelectorAll('strong, b');
        boldElements.forEach(bold => {
            const text = bold.textContent.trim();
            const placeholder = `BOLD_${Math.random().toString(36).substring(2)}`;
            const boldMarkdown = `**${text}**`;

            bold.textContent = placeholder;
            markdown = markdown.replace(placeholder, boldMarkdown);
        });

        const italicElements = clone.querySelectorAll('em, i:not(.fa-solid):not(.fa)');
        italicElements.forEach(italic => {
            const text = italic.textContent.trim();
            const placeholder = `ITALIC_${Math.random().toString(36).substring(2)}`;
            const italicMarkdown = `*${text}*`;

            italic.textContent = placeholder;
            markdown = markdown.replace(placeholder, italicMarkdown);
        });

        // Get the final text content and clean it
        const content = this.cleanText(clone.textContent);
        markdown = content + markdown;

        // Replace any remaining placeholders with their counterparts
        markdown = markdown.replace(/CODE_BLOCK_[a-z0-9]+/g, '');
        markdown = markdown.replace(/HEADING_\d+_[a-z0-9]+/g, '');
        markdown = markdown.replace(/LIST_[a-z0-9]+/g, '');
        markdown = markdown.replace(/LINK_[a-z0-9]+/g, '');
        markdown = markdown.replace(/BOLD_[a-z0-9]+/g, '');
        markdown = markdown.replace(/ITALIC_[a-z0-9]+/g, '');

        // Clean up extra whitespace
        markdown = markdown.replace(/\n{3,}/g, '\n\n');

        return markdown;
    }

    // Downloads the exported conversation as a file with the specified format
    downloadConversation(content, filename, mimeType = 'text/plain') {
        try {
            // Create a blob with explicit UTF-8 encoding
            const blob = new Blob([new TextEncoder().encode(content)], { type: mimeType });
            const url = URL.createObjectURL(blob);

            // Create an anchor element for downloading
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);

            // Trigger the download
            a.click();

            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);

            // Show success notification
            this.showExportSuccessNotification(filename);

           //console.log('Export: Successfully downloaded conversation as', filename);
            return true;
        } catch (error) {
            console.error('Export: Error exporting conversation:', error);
            this.showExportErrorNotification(error.message);
            return false;
        }
    }

    // Shows a toast notification for successful export
    showExportSuccessNotification(filename) {
        // Get or create toast container
        const toastContainer = document.getElementById('toast-container') || document.createElement('div');
        if (!toastContainer.id) {
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
            document.body.appendChild(toastContainer);
        }

        // Get file type for the message
        const fileType = filename.split('.').pop().toUpperCase();

        // Create the toast
        const toast = document.createElement('div');
        toast.className = 'toast export-success';
        toast.style.cssText = `
          background-color: #10b981;
          color: white;
          padding: 14px 18px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.3s, transform 0.3s;
          max-width: 350px;
      `;

        toast.innerHTML = `
          <div style="background-color: rgba(255,255,255,0.2); border-radius: 50%; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center;">
              <i class="fa-solid fa-check" style="font-size: 16px;"></i>
          </div>
          <div>
              <div style="font-weight: 500; margin-bottom: 2px;">${Lang.get('exportSuccess') || 'Export Successful'}</div>
              <div style="font-size: 13px; opacity: 0.9;">${Lang.get('conversationDownloaded') || 'Conversation downloaded as'} ${fileType}</div>
          </div>
      `;

        toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);

        // Remove after delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';

            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }

                // Also remove container if empty
                if (toastContainer.children.length === 0) {
                    if (toastContainer.parentNode) {
                        toastContainer.parentNode.removeChild(toastContainer);
                    }
                }
            }, 300);
        }, 4000);
    }

    // Shows a toast notification for export errors
    showExportErrorNotification(errorMessage) {
        // Get or create toast container
        const toastContainer = document.getElementById('toast-container') || document.createElement('div');
        if (!toastContainer.id) {
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
            document.body.appendChild(toastContainer);
        }

        // Create the toast
        const toast = document.createElement('div');
        toast.className = 'toast export-error';
        toast.style.cssText = `
          background-color: #ef4444;
          color: white;
          padding: 14px 18px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.3s, transform 0.3s;
          max-width: 350px;
      `;

        toast.innerHTML = `
          <div style="background-color: rgba(255,255,255,0.2); border-radius: 50%; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center;">
              <i class="fa-solid fa-xmark" style="font-size: 16px;"></i>
          </div>
          <div>
              <div style="font-weight: 500; margin-bottom: 2px;">${Lang.get('exportError') || 'Export Failed'}</div>
              <div style="font-size: 13px; opacity: 0.9;">${errorMessage}</div>
          </div>
      `;

        toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);

        // Remove after delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';

            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }

                // Also remove container if empty
                if (toastContainer.children.length === 0) {
                    if (toastContainer.parentNode) {
                        toastContainer.parentNode.removeChild(toastContainer);
                    }
                }
            }, 300);
        }, 5000);
    }

    // Adds an export button to the chat interface next to the delete button
    addExportButton(deleteButton) {
        if (!deleteButton) return;

       //console.log('Export: Adding export conversation button');

        // Create export button with same styling as delete button
        const exportButton = document.createElement('button');
        exportButton.id = 'export-conversation';
        exportButton.className = 'primary-button';
        exportButton.innerHTML = `<i class="fa-solid fa-file-export"></i> ${Lang.get('exportConversation') || 'Export Conversation'}`;

        // Copy styles from delete button but change color
        exportButton.style.cssText = deleteButton.style.cssText;
        exportButton.style.marginBottom = '10px';
        exportButton.style.backgroundColor = '#4f46e5'; // Use accent color instead of delete button red

        // Insert before delete button
        deleteButton.parentNode.insertBefore(exportButton, deleteButton);

        // Add click handler for export functionality
        exportButton.addEventListener('click', () => {
            if (window.export && typeof window.export.exportConversation === 'function') {
                window.export.exportConversation();
            } else {
                console.error('Export: Export instance or exportConversation method not available');
                alert(Lang.get('errorExportingConversation') || 'Error exporting conversation: Export functionality not available');
            }
        });

       //console.log('Export: Export button added successfully');
    }

}

// Initialize Export on page load
document.addEventListener('DOMContentLoaded', () => {
    window.export = new Export();
    window.export.initialize();
   //console.log('Export system initialized and attached to window.export');
});