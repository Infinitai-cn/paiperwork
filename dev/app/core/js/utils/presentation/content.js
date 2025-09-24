class Content {

    constructor() {
        this.abortController = null;
    }

    // Attach stable pw_id metadata to a parsed slidesVars object.
    // This ensures parsedSlides.cover and parsedSlides.slides[] carry identifiers for each text field
    static _assignPwIds(slidesVars) {
        try {
            if (!slidesVars) return;
            // Ensure cover exists
            if (!slidesVars.cover) slidesVars.cover = { title: '', subtitle: '' };
            // generate simple deterministic ids using timestamp + random to avoid collisions across sessions
            const mk = (prefix, idx) => `${prefix}_${Date.now().toString(36)}_${(Math.floor(Math.random() * 0x10000)).toString(36)}${idx !== undefined ? `_${idx}` : ''}`;
            try {
                slidesVars.cover._pw = slidesVars.cover._pw || { id: mk('pw_cover') };
                slidesVars.cover._pw.titleId = slidesVars.cover._pw.titleId || mk('pw_cover_title');
                slidesVars.cover._pw.subtitleId = slidesVars.cover._pw.subtitleId || mk('pw_cover_subtitle');
            } catch (e) { /* ignore */ }

            if (!Array.isArray(slidesVars.slides)) slidesVars.slides = [];
            for (let i = 0; i < slidesVars.slides.length; i++) {
                try {
                    const s = slidesVars.slides[i] = slidesVars.slides[i] || { title: '', content: [] };
                    s._pw = s._pw || { id: mk('pw_slide', i) };
                    s._pw.titleId = s._pw.titleId || mk('pw_slide_title', i);
                    // ensure content array exists and assign ids per content item
                    if (!Array.isArray(s.content)) s.content = [];
                    s._pw.contentIds = s._pw.contentIds || [];
                    for (let ci = 0; ci < s.content.length; ci++) {
                        s._pw.contentIds[ci] = s._pw.contentIds[ci] || mk('pw_slide_content', `${i}_${ci}`);
                    }
                } catch (e) { /* per-slide ignore */ }
            }
        } catch (e) { /* ignore */ }
    }

    // Attach stable pw_id metadata for images (cover + one image per slide)
    static _assignPwImageIds(slidesVars) {
        try {
            if (!slidesVars) return;
            const mk = (prefix, idx) => `${prefix}_${Date.now().toString(36)}_${(Math.floor(Math.random() * 0x10000)).toString(36)}${idx !== undefined ? `_${idx}` : ''}`;
            try {
                slidesVars.cover = slidesVars.cover || {};
                slidesVars.cover._pw = slidesVars.cover._pw || { id: mk('pw_cover') };
                slidesVars.cover._pw.imageId = slidesVars.cover._pw.imageId || mk('pw_cover_image');
            } catch (e) { /* ignore */ }

            if (!Array.isArray(slidesVars.slides)) slidesVars.slides = [];
            for (let i = 0; i < slidesVars.slides.length; i++) {
                try {
                    const s = slidesVars.slides[i] = slidesVars.slides[i] || {};
                    s._pw = s._pw || { id: mk('pw_slide', i) };
                    s._pw.imageId = s._pw.imageId || mk('pw_slide_image', i);
                } catch (e) { /* per-slide ignore */ }
            }
        } catch (e) { /* ignore */ }
    }

    async searchSlideImage(slideData) {
        let searchQuery;
        if (slideData.imageQuery && typeof slideData.imageQuery === 'string' && slideData.imageQuery.trim().length > 2) {
            searchQuery = this.cleanThinkTags(slideData.imageQuery.trim());
        } else {
            searchQuery = slideData.title ? slideData.title.substring(0, 50) : 'professional presentation';
        }
        try {
            const response = await fetch(`/api/proxy/image-search?q=${encodeURIComponent(searchQuery)}`);
            if (!response.ok) {
                if (response.status === 503) {
                    throw new Error(Lang.get('imageSearchServiceUnavailable'));
                } else if (response.status === 404) {
                    throw new Error(Lang.get('noRelevantImagesFound'));
                } else {
                    const _msg = Lang.get('imageSearchFailedWithStatus').replace('{status}', response.status);
                    throw new Error(_msg);
                }
            }
            const result = await response.json();
            if (result.success && result.imageUrl) {
                // Download image and convert to base64
                const imgResponse = await fetch(result.imageUrl);
                if (!imgResponse.ok) throw new Error(Lang.get('failedToDownloadImage'));
                const blob = await imgResponse.blob();
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
                return base64;
                } else {
                throw new Error(result.error || Lang.get('noImageFoundForSlideContent'));
            }
        } catch (error) {
            // Retry logic: after error, wait 3 seconds and retry with first 4 words of imageQuery
            let retried = false;
            if (slideData.imageQuery && typeof slideData.imageQuery === 'string' && slideData.imageQuery.trim().length > 2) {
                const first4Words = slideData.imageQuery.trim().split(/\s+/).slice(0, 4).join(' ');
                if (first4Words.length > 0) {
                    retried = true;
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    try {
                        const retryQuery = this.cleanThinkTags(first4Words);
                        const retryResponse = await fetch(`/api/proxy/image-search?q=${encodeURIComponent(retryQuery)}`);
                        if (retryResponse.ok) {
                            const retryResult = await retryResponse.json();
                            if (retryResult.success && retryResult.imageUrl) {
                                const imgResponse = await fetch(retryResult.imageUrl);
                                if (!imgResponse.ok) throw new Error(Lang.get('failedToDownloadImageRetry'));
                                const blob = await imgResponse.blob();
                                const base64 = await new Promise((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.onerror = reject;
                                    reader.readAsDataURL(blob);
                                });
                                return base64;
                            }
                        }
                    } catch (retryError) {
                        // Ignore, will track failure below
                    }
                }
            }
            this.trackImageSearchFailure(slideData.title, error.message + (retried ? ' (retry failed)' : ''));
            return null;
        }
    }

    trackImageSearchFailure(slideTitle, errorMessage) {
        if (!this.imageSearchFailures) {
            this.imageSearchFailures = [];
        }
        this.imageSearchFailures.push({
            slide: slideTitle,
            error: errorMessage
        });
    }

    showImageSearchSummary() {
        if (this.imageSearchFailures && this.imageSearchFailures.length > 0) {
            const failureCount = this.imageSearchFailures.length;
            const uniqueErrors = [...new Set(this.imageSearchFailures.map(f => f.error))];
            let message = `${Lang.get('imageSearchIssues')}: ${failureCount} ${Lang.get('slidesCouldNotGetImages')}\n\n`;
            message += `${Lang.get('commonIssues')}:\n`;
            uniqueErrors.forEach(error => {
                message += `• ${error}\n`;
            });
            message += `\n${Lang.get('pptStillGenerated')}`;
            setTimeout(() => {
                alert(message);
                this.imageSearchFailures = [];
            }, 500);
        }
    }

    async downloadAllSlideImages(parsedSlides, logCallback) {
        logCallback && logCallback('[Content] [Images] Downloading images for all slides...');
        const coverImage = await this.searchSlideImage(parsedSlides.cover);
        logCallback && logCallback('[Content] [Images] Cover image downloaded.');
        const slideImages = [];
        // Download all images, keep track of successful ones
        for (let i = 0; i < parsedSlides.slides.length; i++) {
            const img = await this.searchSlideImage(parsedSlides.slides[i]);
            logCallback && logCallback(`[Content] [Images] Slide ${i + 1} image downloaded.`);
            slideImages.push(img);
        }
        // Substitute failed images with any other successful image
        const validImages = slideImages.filter(img => !!img);
        for (let i = 0; i < slideImages.length; i++) {
            if (!slideImages[i] && validImages.length > 0) {
                // Use a random valid image as substitute
                slideImages[i] = validImages[Math.floor(Math.random() * validImages.length)];
            }
        }
        // Do NOT show any alert about failed downloads
        // this.showImageSearchSummary();
        return { coverImage, slideImages };
    }

    async parseSlideForgeAIReply(aiReply, numberOfSlides, logCallback) {
        logCallback && logCallback('[Content] [Parse] Parsing AI reply...');
        let fullText = aiReply;
        fullText = this.cleanThinkTags(fullText);
        // Try JSON first
        let structuredData = null;
        let jsonError = null;
        const jsonMatch = fullText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            logCallback && logCallback('[Content] [Parse] Attempting JSON reply parsing...');
            try {
                structuredData = Content.cleanAIResponse(jsonMatch[0]);
            } catch (err) {
                jsonError = err;
                logCallback && logCallback('[Content] [Parse] JSON parsing failed: ' + err.message);
            }
            } else {
            logCallback && logCallback('[Content] [Parse] No JSON detected in AI reply.');
        }
    if (structuredData && structuredData.slides && Array.isArray(structuredData.slides)) {
            logCallback && logCallback('[Content] [Parse] JSON reply parsing succeeded.');
            // Separate slides
            const slidesVars = { cover: null, slides: [] };
            if (structuredData.slides.length > 0) {
                slidesVars.cover = {
                    title: structuredData.title || '',
                    subtitle: structuredData.subtitle || '',
                    ...structuredData.slides[0]
                };
                for (let i = 1; i < structuredData.slides.length; i++) {
                    const slide = structuredData.slides[i];
                    slidesVars.slides.push({
                        title: slide.title || '',
                        content: slide.content || [],
                        imageQuery: slide.imageQuery || '',
                        type: slide.type || 'content',
                        notes: slide.notes || ''
                    });
                }
            }
            // ensure stable pw ids/meta for parsedSlides so callers can persist edits immediately
            try { Content._assignPwIds(slidesVars); } catch (e) { /* ignore */ }
            try { Content._assignPwImageIds(slidesVars); } catch (e) { /* ignore */ }
            return slidesVars;
        }
    // Markdown fallback
        logCallback && logCallback('[Content] [Parse] Attempting markdown reply parsing...');
        // Log the full AI reply here to aid debugging when markdown parsing is used
        try { logCallback && logCallback('[Content] [Parse] Markdown fallback - full AI reply:\n' + fullText); } catch (e) { }
        try { console.debug && console.debug('[Content] [Parse] Markdown fallback - full AI reply:', fullText); } catch (e) { }
        try {
            structuredData = this.parseMarkdownSlideForgeResponse(fullText, window.colorMode || 'light');
                if (structuredData.slides && Array.isArray(structuredData.slides)) {
                logCallback && logCallback('[Content] [Parse] Markdown reply parsing succeeded.');
                const slidesVars = { cover: null, slides: [] };
                if (structuredData.slides.length > 0) {
                    const first = structuredData.slides[0] || {};
                    slidesVars.cover = {
                        title: structuredData.title || '',
                        subtitle: structuredData.subtitle || '',
                        ...first,
                        notes: first.notes || ''
                    };
                    for (let i = 1; i < structuredData.slides.length; i++) {
                        const slide = structuredData.slides[i];
                        slidesVars.slides.push({
                            title: slide.title || '',
                            content: slide.content || [],
                            imageQuery: slide.imageQuery || '',
                            type: slide.type || 'content',
                            notes: slide.notes || ''
                        });
                    }
                }
                // attach stable pw ids/meta so parsedSlides carries identifiers for each text field
                try { Content._assignPwIds(slidesVars); } catch (e) { /* ignore */ }
                try { Content._assignPwImageIds(slidesVars); } catch (e) { /* ignore */ }
                return slidesVars;
                    } else {
                logCallback && logCallback('[Content] [Parse] Markdown parsing failed: Invalid markdown response structure.');
                throw new Error(Lang.get('invalidMarkdownResponseStructure'));
            }
        } catch (markdownError) {
            logCallback && logCallback('[Content] [Parse] Markdown parsing error: ' + markdownError.message);
            throw markdownError;
        }
    // If neither JSON nor markdown parsing succeeded, log for debugging
        logCallback && logCallback('[Content] [Parse] No valid JSON or markdown detected in AI reply. Raw reply: ' + fullText);
    throw new Error(Lang.get('noValidJsonOrMarkdownDetected'));
    }

    // Parse a markdown-formatted presentation response into structured slides.
    // Returns an object: { title: '', subtitle: '', slides: [ { title:'', content:[], imageQuery:'', type:'content', notes:'' }, ... ] }
    parseMarkdownSlideForgeResponse(markdownText, colorMode = 'light') {
        const md = String(markdownText || '').replace(/\r/g, '');
        // remove fenced code blocks
        const cleaned = md.replace(/```[\s\S]*?```/g, '\n');
        const lines = cleaned.split(/\n/).map(l => l.replace(/\t/g, '    ').trimRight());

        let title = '';
        let subtitle = '';
        const slides = [];
        let current = null;
        let paragraphBuffer = [];

        const flushParagraphBuffer = () => {
            if (!current) return;
            if (paragraphBuffer.length === 0) return;
            const para = paragraphBuffer.join(' ').trim();
            if (para) {
                // split into sentences, but keep reasonably sized blocks
                const parts = para.split(/(?<=[\.\!?])\s+/).map(s => s.trim()).filter(Boolean);
                for (let p of parts) {
                    if (!current.content) current.content = [];
                    if (current.content.length < 6) current.content.push(p);
                }
            }
            paragraphBuffer = [];
        };

        for (let i = 0; i < lines.length; i++) {
            const raw = lines[i];
            const line = raw.trim();
            if (!line) {
                // blank line: flush paragraph
                flushParagraphBuffer();
                continue;
            }
            // H1 -> document title
            const h1 = line.match(/^#\s+(.*)$/);
            if (h1 && !title) { title = h1[1].trim(); continue; }
            // H2/H3 -> slide delimiter
            const h2 = line.match(/^#{2,6}\s+(.*)$/);
            if (h2) {
                // start new slide
                flushParagraphBuffer();
                if (current) slides.push(current);
                current = { title: h2[1].trim(), content: [], imageQuery: '', type: 'content', notes: '' };
                continue;
            }
            // horizontal rule as slide separator
            if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
                flushParagraphBuffer();
                if (current) slides.push(current);
                current = { title: '', content: [], imageQuery: '', type: 'content', notes: '' };
                continue;
            }
            // bullet lists
            const bullet = line.match(/^(?:[-\*\+]\s+|\d+\.\s+)(.*)$/);
            if (bullet) {
                flushParagraphBuffer();
                if (!current) current = { title: '', content: [], imageQuery: '', type: 'content', notes: '' };
                const txt = bullet[1].trim();
                if (txt) {
                    current.content = current.content || [];
                    if (current.content.length < 6) current.content.push(txt);
                }
                continue;
            }
            // blockquote lines -> treat as paragraph
            const bq = line.match(/^>\s?(.*)$/);
            if (bq) {
                paragraphBuffer.push(bq[1].trim());
                continue;
            }
            // image or image syntax -> use alt text as possible visual prompt
            const img = line.match(/!?\[([^\]]*)\]\([^\)]+\)/);
            if (img) {
                // attach to current slide as imageQuery if none
                if (!current) current = { title: '', content: [], imageQuery: '', type: 'content', notes: '' };
                if (!current.imageQuery) current.imageQuery = img[1].trim();
                continue;
            }
            // plain text: accumulate into paragraph buffer
            paragraphBuffer.push(line);
        }
        // flush remaining
        flushParagraphBuffer();
        if (current) slides.push(current);

        // If no slides detected, attempt to chunk by double-newline paragraphs into slides
        if (slides.length === 0) {
            const paragraphs = cleaned.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
            for (let p of paragraphs) {
                const titleLine = p.split(/\n/)[0].trim();
                const rest = p.split(/\n/).slice(1).join(' ').trim();
                const s = { title: titleLine || '', content: [], imageQuery: '', type: 'content', notes: '' };
                const parts = rest.split(/(?<=[\.\!?])\s+/).map(s => s.trim()).filter(Boolean);
                for (let part of parts.slice(0, 6)) s.content.push(part);
                slides.push(s);
            }
        }

        // Fallback: if still no title, derive from first slide title or first content
        if (!title) {
            if (slides.length && slides[0].title) title = slides[0].title;
            else if (slides.length && slides[0].content && slides[0].content[0]) title = slides[0].content[0].substring(0, 60);
        }
        // Attempt subtitle: first non-title short paragraph after title
        if (!subtitle) {
            for (let s of slides) {
                if (s.content && s.content.length) { subtitle = s.content[0].substring(0, 200); break; }
            }
        }

        return { title: title || '', subtitle: subtitle || '', slides };
    }

    async extractTextFromDocument(file, onProgress) {
        this.abortController = new AbortController();
        const signal = this.abortController.signal;
        const fileType = file.type || this.getFileTypeFromName(file.name);
        onProgress && onProgress(`[Content] Starting text extraction for ${fileType}`);
        try {
            switch (fileType) {
                case 'application/pdf':
                    onProgress && onProgress('[Content] Extracting PDF...');
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + '\n';
                        onProgress && onProgress(`[Content] Extracted page ${i}/${pdf.numPages}`);
                    }
                    onProgress && onProgress('[Content] PDF extraction complete');
                    return fullText.trim();
                case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                    onProgress && onProgress('[Content] Extracting DOCX...');
                    // Read full ArrayBuffer first
                    const docxArrayBuffer = await file.arrayBuffer();
                    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

                    try {
                        // Use JSZip (loaded globally as JSZip) to extract word/document.xml
                        const zip = await JSZip.loadAsync(docxArrayBuffer);
                        const docFile = zip.file('word/document.xml');
                        if (!docFile) throw new Error(Lang.get('docxWordXmlNotFound'));

                        const documentXml = await docFile.async('string');
                        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

                        const parser = new DOMParser();
                        const xml = parser.parseFromString(documentXml, 'application/xml');

                        // Collect paragraph text by concatenating all <w:t> inside each <w:p>
                        const paragraphs = Array.from(xml.getElementsByTagName('w:p')).map(p => {
                            const texts = Array.from(p.getElementsByTagName('w:t')).map(t => t.textContent || '');
                            return texts.join('');
                        }).filter(Boolean);

                        const extractedText = paragraphs.join('\n\n').trim();

                        if (!extractedText || extractedText.length === 0) {
                            throw new Error(Lang.get('noTextExtractedFromDocx'));
                        }

                        onProgress && onProgress('[Content] DOCX extraction complete');
                        return extractedText;
                    } catch (zipErr) {
                        console.warn('[Content] DOCX JSZip extraction failed, attempting fallback parser', zipErr);
                        // Fallback: try existing byte-scan parser using parseDocxZip
                        try {
                            const uint8Array = new Uint8Array(docxArrayBuffer);
                            const fallbackText = await this.parseDocxZip(uint8Array);
                            if (fallbackText && fallbackText.trim().length > 0) {
                                onProgress && onProgress('[Content] DOCX extraction (fallback) complete');
                                return fallbackText;
                            }
                        } catch (fallbackErr) {
                            console.warn('[Content] DOCX fallback parser also failed', fallbackErr);
                        }
                        throw zipErr;
                    }

                case 'text/plain':
                    onProgress && onProgress('[Content] Extracting TXT...');
                    const txt = await file.text();
                    onProgress && onProgress('[Content] TXT extraction complete');
                    return txt.trim();
                case 'text/markdown':
                    onProgress && onProgress('[Content] Extracting Markdown...');
                    try {
                        const md = await file.text();
                        // Remove YAML frontmatter if present
                        let cleaned = md.replace(/^---\s*[\s\S]*?---\s*/m, '');
                        // Remove fenced code blocks ``` ```
                        cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
                        // Remove inline code `code`
                        cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
                        // Convert images ![alt](url) -> alt
                        cleaned = cleaned.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1');
                        // Convert links [text](url) -> text
                        cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
                        // Remove headings markers (#, ##, etc.)
                        cleaned = cleaned.replace(/^#{1,6}\s*/gm, '');
                        // Remove blockquote markers
                        cleaned = cleaned.replace(/^>\s?/gm, '');
                        // Remove remaining markdown emphasis characters
                        cleaned = cleaned.replace(/\*\*|\*|__|_/g, '');
                        // Remove HTML tags if any
                        cleaned = cleaned.replace(/<[^>]+>/g, '');
                        // Normalize whitespace
                        cleaned = cleaned.replace(/\n{2,}/g, '\n\n').trim();
                        onProgress && onProgress('[Content] Markdown extraction complete');
                        return cleaned;
                    } catch (mdErr) {
                        onProgress && onProgress('[Content] Markdown extraction error: ' + mdErr.message);
                        throw mdErr;
                    }
                default:
                    throw new Error(Lang.get('unsupportedFileType'));
            }
        } catch (err) {
            onProgress && onProgress('[Content] Error: ' + err.message);
            throw err;
        }
    }

    getFileTypeFromName(filename) {
        const extension = filename.toLowerCase().split('.').pop();
        switch (extension) {
            case 'pdf':
                return 'application/pdf';
            case 'docx':
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            case 'txt':
                return 'text/plain';
            case 'md':
                return 'text/markdown';
            default:
                return 'unknown';
        }
    }

    async parseDocxZip(uint8Array) {
        try {
            const textDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
            const content = textDecoder.decode(uint8Array);
            const textMatches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
            if (textMatches && textMatches.length > 0) {
                const extractedText = textMatches
                    .map(match => {
                        const textContent = match.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '');
                        return this.decodeXmlEntities(textContent);
                    })
                    .join(' ');
                if (extractedText.trim().length > 50) {
                    return extractedText.trim();
                }
            }
            const xmlTextMatches = content.match(/>([^<]{10,})</g);
            if (xmlTextMatches && xmlTextMatches.length > 0) {
                const extractedText = xmlTextMatches
                    .map(match => match.substring(1, match.length - 1).trim())
                    .filter(text => {
                        return text.length > 5 && !text.match(/^[\d\.\-\:\s]*$/) && !text.includes('xmlns') && !text.includes('rels/');
                    })
                    .join(' ');
                if (extractedText.trim().length > 50) {
                    return extractedText.trim();
                }
            }
            const docXmlIndex = content.indexOf('word/document.xml');
            if (docXmlIndex !== -1) {
                const startPos = Math.max(0, docXmlIndex - 1000);
                const endPos = Math.min(content.length, docXmlIndex + 10000);
                const docSection = content.substring(startPos, endPos);
                const docTextMatches = docSection.match(/>([^<]{5,})</g);
                if (docTextMatches) {
                    const extractedText = docTextMatches
                        .map(match => match.substring(1, match.length - 1).trim())
                        .filter(text => text.length > 3)
                        .join(' ');
                    if (extractedText.trim().length > 20) {
                        return extractedText.trim();
                    }
                }
            }
            throw new Error('No text content found in DOCX structure');
        } catch (error) {
            console.error('[Content] Error parsing DOCX ZIP:', error);
            throw error;
        }
    }

    decodeXmlEntities(text) {
        return text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'");
    }

    abortExtraction() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    async generateSlideForgeRawAIReply(file, numberOfSlides, onProgress) {
        try {
            onProgress && onProgress('[Content] Step 1: Extracting text from document...');
            //console.log('[Content] Step 1: Extracting text from document...');
            const extractedText = await this.extractTextFromDocument(file, msg => {
                onProgress && onProgress('[Content] ' + msg);
                //console.log('[Content] ' + msg);
            });
            onProgress && onProgress('[Content] Step 2: Building AI prompt...');
            //console.log('[Content] Step 2: Building AI prompt...');
            const prompt = Content.buildSlideForgeStructuringPrompt(extractedText, numberOfSlides);
            //console.log('[Content] [Debug] Prompt built:', prompt);
            onProgress && onProgress('[Content] Step 3: Preparing AI call...');
            //console.log('[Content] Step 3: Preparing AI call...');
            // Setup abort controller for AI generation. Reuse global controller if already created (e.g., by the UI modal)
            try {
                if (!window.SlideForgeAbortController) window.SlideForgeAbortController = new AbortController();
            } catch (e) { window.SlideForgeAbortController = new AbortController(); }
            const abortSignal = window.SlideForgeAbortController.signal;
            const modelSelector = document.getElementById('model-selector');
            const selectedModel = modelSelector?.value;
            //console.log('[Content] [Debug] Selected model:', selectedModel);
            if (!selectedModel || selectedModel === '') {
                onProgress && onProgress('[Content] Error: No model selected.');
                console.error('[Content] [Error] No model selected');
                throw new Error(Lang.get('noModelSelected'));
            }
            const contextSize = document.getElementById('context-selector')?.value || 8192;
            //console.log('[Content] [Debug] Context size:', contextSize);

            const systemPrompt = Content.buildSlideForgeSystemPrompt(extractedText, numberOfSlides, window.colorMode || 'light');
            //console.log('[Content] [Debug] System prompt:', systemPrompt);
            onProgress && onProgress('[Content] Step 3: Sending prompt to AI (Ollama)...');
            //console.log('[Content] Step 3: Sending prompt to AI (Ollama)...');
            // Use StyleDIY's non-streaming helper to call Ollama (avoids 'thinking' streaming mode issues)
            try {
                //console.log('[Content] [Debug] Calling StyleDIY.sendToOllama (non-stream)');
                // Generate requestId to correlate server responses in logs
                const requestId = 'content-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 0x10000).toString(36);
                // Ensure any user-specified extra request is prepended to the system prompt (but avoid double-injection)
                let effectiveSystem = String(systemPrompt || '');
                try {
                    const extraEl = document.getElementById('presentation-extra-prompt');
                    if (extraEl && typeof extraEl.value === 'string' && extraEl.value.trim().length) {
                        const extraReq = String(extraEl.value || '').replace(/\r\n?/g, '\n').trim();
                        if (!/^\s*REQUEST:/i.test(effectiveSystem)) {
                            effectiveSystem = `REQUEST:\n${extraReq}\n\n` + effectiveSystem;
                        }
                    }
                } catch (e) { /* ignore DOM read errors */ }

                // Prepend language enforcement so it appears before any REQUEST block and avoid duplication
                try {
                    if (languageEnforcement && String(languageEnforcement).trim()) {
                        const le = String(languageEnforcement).trim();
                        if (String(effectiveSystem || '').indexOf(le) === -1) {
                            effectiveSystem = le + ' ' + effectiveSystem;
                        }
                    }
                } catch (e) { /* ignore */ }

                try { //console.log('[Content] [Debug] final system prompt sent to StyleDIY (first 1200 chars):', String(effectiveSystem || '').replace(/\n/g, '\\n').substring(0, 1200)); 
                } catch (e) { }
                const fullText = await StyleDIY.sendToOllama(prompt, effectiveSystem, selectedModel, abortSignal, requestId);
                onProgress && onProgress('[Content] Step 4: AI content received.');
                //console.log('[Content] [Debug] AI reply length:', fullText ? fullText.length : 0);
                return fullText;
            } catch (apiError) {
                onProgress && onProgress('[Content] Error: Ollama (StyleDIY) API call failed: ' + apiError.message);
                console.error('[Content] [Error] StyleDIY.sendToOllama failed:', apiError);
                throw apiError;
            }
        } catch (err) {
            onProgress && onProgress('[Content] Workflow error: ' + err.message);
            console.error('[Content] [Error] Workflow error:', err);
            throw err;
        } finally {
            // Clean up abort controller after completion
            window.SlideForgeAbortController = null;
        }
    }

    static buildSlideForgeSystemPrompt(text, numberOfSlides, colorMode) {
        
        // ADD LANGUAGE ENFORCEMENT: Detect user's language and add enforcement
            let languageEnforcement = '';
            try {

                // Get user's language from browser or saved preference
                let userLanguage = 'English'; // Default fallback

                // Try to get language from Lang system if available
                if (window.Lang && typeof window.Lang.getCurrentLanguage === 'function') {
                    const langCode = window.Lang.getCurrentLanguage();
                    userLanguage = this.getLanguageDisplayName(langCode);
                } else {
                    // Fallback to browser language
                    const browserLang = navigator.language || navigator.userLanguage || 'en';
                    userLanguage = this.getLanguageDisplayName(browserLang);
                }

                // Create language enforcement instruction
                languageEnforcement = `Always respond in ${userLanguage}. Match the user's language and communication style. If the user writes in ${userLanguage}, respond in ${userLanguage}.\n`;

                //console.log('Content DEBUG: Language enforcement added for:', userLanguage);
            } catch (error) {
                console.error('Content: Error adding language enforcement:', error);
                // Continue without language enforcement if there's an error
            }
        // If the SlideForge tab contains an extra user request, prepend it to the system prompt
        let extraPrefix = '';
        try {
            const extraEl = document.getElementById('presentation-extra-prompt');
            if (extraEl && typeof extraEl.value === 'string' && extraEl.value.trim().length) {
                const extraReq = String(extraEl.value || '').replace(/\r\n?/g, '\n').trim();
                extraPrefix = `REQUEST:\n${extraReq}\n\n`;
            }
        } catch (e) { /* ignore when DOM is not available */ }

    // Strongly request JSON format, fallback to markdown if not possible
    // Prepend language enforcement (if any) before the user REQUEST block / system prompt
    const langPrefix = (typeof languageEnforcement === 'string' && languageEnforcement.trim()) ? String(languageEnforcement).trim() + '\n\n' : '';
    return langPrefix + extraPrefix + `You are an expert presentation generator. Your reply MUST be in JSON format as described below. If you cannot reply in JSON, reply in markdown format.

REPLY FORMAT PRIORITY:
1. JSON (preferred)
2. Markdown (fallback)

JSON FORMAT EXAMPLE:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Main Title",
      "subtitle": "Main Subtitle",
      "imageQuery": "cover style image search query based on the text content MAXIMUM 4 words",
      "type": "cover"
      // NO content for cover slide
    },
    {
      "slideNumber": 2,
      "title": "Content Slide Title",
      "content": ["Multi-sentence summary 1", "Multi-sentence summary 2", ...],
      "imageQuery": "image search query based on the text content MAXIMUM 4 words",
      "type": "content"
    },
    ...
  ]
}

MANDATORY REQUIREMENTS:
- The slides array MUST start with slide 1 as the cover slide, containing ONLY the main title, subtitle, and a cover-style imageQuery (no content).
- The cover slide's imageQuery should be a visual concept suitable for a presentation cover background, based on the main title and subtitle.
- Do NOT reply with separate title/subtitle fields outside the slides array.
- Each content slide must have a title and several multi-sentence summaries.
- Each slide must include an image search query.
- If JSON is not possible, reply in markdown with the same structure.
- Do not use single sentences or short phrases.`;
    }

    static cleanAIResponse(responseText) {
        try {
            // Log the raw AI reply before cleaning
            //console.log('[Content] [Parse] Raw AI reply before cleaning:', responseText);
            // Remove trailing commas from arrays and objects
            let sanitizedText = responseText.replace(/,\s*(?=[}\]])/g, '');
            // Remove backslash escape characters (for example, from logs)
            sanitizedText = sanitizedText.replace(/\\(["'])/g, '$1');
            // Log the cleaned AI reply before parsing
            //console.log('[Content] [Parse] Cleaned AI reply for JSON.parse:', sanitizedText);
            return JSON.parse(sanitizedText);
        } catch (error) {
            // Create a more descriptive error for debugging but don't log here
            // Let the calling function handle the logging to avoid cascade
            const detailsForDebugging = {
                originalError: error.message,
                responseLength: responseText ? responseText.length : 0,
                hasJson: responseText ? responseText.includes('{') : false,
                firstChars: responseText ? responseText.substring(0, 100) : ''
            };

            console.error('[Content] [Parse] Error parsing AI reply:', error, detailsForDebugging);
            const cleanError = new Error('Invalid AI response format');
            cleanError.details = detailsForDebugging;
            throw cleanError;
        }
    }

    static buildSlideForgeStructuringPrompt(text, numberOfSlides) {
        // Get user-selected context size from context-selector (default to 6000 if not set)
        let maxLength = 6000;
        const contextSelector = document.getElementById('context-selector');
        if (contextSelector && contextSelector.value) {
            const parsed = parseInt(contextSelector.value, 10);
            if (!isNaN(parsed) && parsed > 0) {
                maxLength = parsed;
            }
        }
        // Truncate text if too long (keep within context limits)
        const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

        // Determine desired number of bullet points per content slide from the presentation UI
        // Default to 3 and clamp between 1 and 4 to match the selector options
        let bulletsPerSlide = 3;
        try {
            const bulletsSelector = document.getElementById('presentation-bullets-selector');
            const parsedBullets = bulletsSelector ? parseInt(bulletsSelector.value, 10) : NaN;
            if (!isNaN(parsedBullets)) {
                bulletsPerSlide = Math.min(4, Math.max(1, parsedBullets));
            }
        } catch (e) {
            bulletsPerSlide = 3;
        }

        return `ANALYZE the following document and CREATE a ${numberOfSlides}-slide PowerPoint presentation.
MANDATORY REQUIREMENTS:
- CREATE a comprehensive presentation that covers ALL major points from the document
- FOR EACH content slide, CREATE exactly ${bulletsPerSlide} bullet points that comprehensively cover the content. DO NOT exceed ${bulletsPerSlide} bullets per slide.
- WRITE every bullet point as a multi-sentence, detailed summary (2 sentences)
- DO NOT use single sentences or short phrases - this is FAILURE
- PROVIDE a short, focused image search query (MAXIMUM 4 words) for each slide
- FOCUS on visual concepts suitable for stock photo search

Document content:
${truncatedText}

EXECUTE NOW:`;
    }

    cleanThinkTags(text) {
        if (!text || typeof text !== 'string') {
            return text;
        }

        return text
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
            .replace(/<reflection>[\s\S]*?<\/reflection>/gi, '')
            .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
            .replace(/<cot>[\s\S]*?<\/cot>/gi, '')
            .replace(/<analysis>[\s\S]*?<\/analysis>/gi, '')
            .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
            .trim();
    }

        // Converts a language code (e.g., 'en-US') to a human-readable language name.
    static getLanguageDisplayName(langCode) {
        const languageMap = {
            'en': 'English',
            'en-US': 'English',
            'en-GB': 'English',
            'es': 'Spanish',
            'es-ES': 'Spanish',
            'es-MX': 'Spanish',
            'fr': 'French',
            'fr-FR': 'French',
            'de': 'German',
            'de-DE': 'German',
            'it': 'Italian',
            'it-IT': 'Italian',
            'pt': 'Portuguese',
            'pt-BR': 'Portuguese',
            'pt-PT': 'Portuguese',
            'ru': 'Russian',
            'ru-RU': 'Russian',
            'ja': 'Japanese',
            'ja-JP': 'Japanese',
            'ko': 'Korean',
            'ko-KR': 'Korean',
            'zh': 'Chinese',
            'zh-CN': 'Chinese',
            'zh-TW': 'Chinese',
            'ar': 'Arabic',
            'ar-SA': 'Arabic',
            'hi': 'Hindi',
            'hi-IN': 'Hindi',
            'nl': 'Dutch',
            'nl-NL': 'Dutch',
            'sv': 'Swedish',
            'sv-SE': 'Swedish',
            'da': 'Danish',
            'da-DK': 'Danish',
            'no': 'Norwegian',
            'nb-NO': 'Norwegian',
            'fi': 'Finnish',
            'fi-FI': 'Finnish',
            'pl': 'Polish',
            'pl-PL': 'Polish',
            'tr': 'Turkish',
            'tr-TR': 'Turkish',
            'el': 'Greek',
            'el-GR': 'Greek',
            'he': 'Hebrew',
            'he-IL': 'Hebrew',
            'th': 'Thai',
            'th-TH': 'Thai',
            'vi': 'Vietnamese',
            'vi-VN': 'Vietnamese',
            'id': 'Indonesian',
            'id-ID': 'Indonesian',
            'ms': 'Malay',
            'ms-MY': 'Malay',
            'uk': 'Ukrainian',
            'uk-UA': 'Ukrainian',
            'cs': 'Czech',
            'cs-CZ': 'Czech',
            'sk': 'Slovak',
            'sk-SK': 'Slovak',
            'hu': 'Hungarian',
            'hu-HU': 'Hungarian',
            'ro': 'Romanian',
            'ro-RO': 'Romanian',
            'bg': 'Bulgarian',
            'bg-BG': 'Bulgarian',
            'hr': 'Croatian',
            'hr-HR': 'Croatian',
            'sr': 'Serbian',
            'sr-RS': 'Serbian',
            'sl': 'Slovenian',
            'sl-SI': 'Slovenian',
            'et': 'Estonian',
            'et-EE': 'Estonian',
            'lv': 'Latvian',
            'lv-LV': 'Latvian',
            'lt': 'Lithuanian',
            'lt-LT': 'Lithuanian'
        };

        // Get base language code (e.g., 'en-US' -> 'en')
        const baseCode = langCode.toLowerCase().split('-')[0];

        // Try exact match first, then base code, then default to English
        return languageMap[langCode.toLowerCase()] ||
            languageMap[baseCode] ||
            'English';
    }

}

window.Content = Content;
