class WebSearch {

    static {
        this.abortController = new AbortController();
        this.isCancelled = false;
        this.webSearch = this;
        this.activeRequests = 0;
        this.operationCounts = {
            searches: 0,
            extractions: 0,
            pdfProcessing: 0
        };

        // For backward compatibility - can be cleaned up later
        this.pendingOperations = [];
    }

    // Returns statistics about current and past web search operations.
    static getOperationStats() {
        return {
            pendingOperations: this.pendingOperations.length,
            activeRequests: this.activeRequests,
            operationCounts: { ...this.operationCounts },
            isCancelled: this.isCancelled
        };
    }

    // Increments the count of active web search requests.
    static incrementActiveRequest() {
        this.activeRequests++;
       //console.log(`WebSearch: Incremented active requests: ${this.activeRequests}`);
    }

    // Decrements the count of active web search requests.
    static decrementActiveRequest() {
        if (this.activeRequests > 0) this.activeRequests--;
       //console.log(`WebSearch: Decremented active requests: ${this.activeRequests}`);
    }

    // Increments the count for a specific operation type (e.g., searches, extractions).
    static incrementOperation(type) {
        if (!this.operationCounts) this.operationCounts = {};
        if (!this.operationCounts[type]) this.operationCounts[type] = 0;
        this.operationCounts[type]++;
       //console.log(`WebSearch: Incremented ${type} operations: ${this.operationCounts[type]}`);
    }

    // Decrements the count for a specific operation type.
    static decrementOperation(type) {
        if (!this.operationCounts) return;
        if (this.operationCounts[type] > 0) this.operationCounts[type]--;
       //console.log(`WebSearch: Decremented ${type} operations: ${this.operationCounts[type]}`);
    }

    // Returns statistics about current and past web search operations.
    static getOperationStats() {
        return {
            pendingOperations: this.pendingOperations.length,
            activeRequests: this.activeRequests,
            operationCounts: { ...this.operationCounts },
            isCancelled: this.isCancelled
        };
    }

    // Returns true if there are no active requests or pending operations.
    static isIdle() {
        return this.activeRequests === 0 && this.pendingOperations.length === 0;
    }
    // Performs a smart web search, cleans the query, handles different modes, and enhances results.
    static async smartSearch(query, abortOrDate = new Date(), optionFlag = false) {
       //console.log('Starting web search for query:', query);

        // Track this operation
        this.incrementOperation('searches');

        try {
            // IMPORTANT: Reset cancellation state when a new search starts
            if (this.isCancelled) {
               //console.log('WebSearch: Resetting cancellation state for new search');
                this.isCancelled = false;
                // Create a fresh AbortController if needed
                if (!this.abortController || this.abortController.signal.aborted) {
                    this.abortController = new AbortController();
                }
            }

            // ALWAYS clean thinking tags from the query FIRST - this is critical
            // This applies to ALL query types including document+websearch mode
            if (query && typeof query === 'string') {
                // Check if we have any thinking tags
                const thinkingPatterns = [
                    /<think>[\s\S]*?<\/think>/g,
                    /<thinking>[\s\S]*?<\/thinking>/g,
                    /<reflection>[\s\S]*?<\/reflection>/g,
                    /<reasoning>[\s\S]*?<\/reasoning>/g,
                    /<cot>[\s\S]*?<\/cot>/g
                ];

                let hasThinkingContent = false;
                const originalQuery = query;

                // Apply each pattern to remove thinking content
                for (const pattern of thinkingPatterns) {
                    if (pattern.test(query)) {
                        hasThinkingContent = true;
                        query = query.replace(pattern, '');
                    }
                    // Reset regex lastIndex
                    pattern.lastIndex = 0;
                }

                // Also handle any malformed thinking tags that might not have closing tags
                const openTagPatterns = [
                    /<think>[\s\S]*/g,
                    /<thinking>[\s\S]*/g,
                    /<reflection>[\s\S]*/g,
                    /<reasoning>[\s\S]*/g,
                    /<cot>[\s\S]*/g
                ];

                for (const pattern of openTagPatterns) {
                    if (pattern.test(query)) {
                        hasThinkingContent = true;
                        query = query.replace(pattern, '');
                    }
                    // Reset regex lastIndex
                    pattern.lastIndex = 0;
                }

                // Clean up extra whitespace and normalize
                if (hasThinkingContent) {
                    query = query.replace(/\s+/g, ' ').trim();

                    // Remove surrounding quotation marks that often appear around the actual query
                    query = query.replace(/^["'](.+)["']$/, '$1');   // Remove outer quotes
                    query = query.replace(/\\"/g, '"');              // Fix escaped quotes

                   //console.log('WebSearch: Removed thinking tags from query');
                   //console.log(`Original query (${originalQuery.length} chars) → Cleaned query (${query.length} chars): "${query}"`);
                }
            }
           //console.log('🔍 CLEANED QUERY FOR SEARCH:', query);

            // Parameter detection code
            let abortController = null;
            let currentDate = new Date();

            if (abortOrDate instanceof Date) {
                currentDate = abortOrDate;
            } else if (abortOrDate && typeof abortOrDate.abort === 'function') {
                abortController = abortOrDate;
            }

            let isDocumentWebSearch = false;
            let isResearchMode = false;

            // Determine what mode we're operating in
            if (abortController && optionFlag === true) {
                isResearchMode = true;
               //console.log('Research mode detected (PDF processing enabled)');
            } else {
                isDocumentWebSearch = optionFlag;
               //console.log(`Mode: ${isDocumentWebSearch ? 'Document+WebSearch' : 'Standard WebSearch'}`);
            }

           //console.log(`Query characteristics: ${query.length} characters, ~${query.split(/\s+/).length} words`);

            // Check for problematic queries
            if (!query || query.trim().length === 0) {
                console.warn('Empty query provided to smartSearch');
                return {
                    type: 'general',
                    items: [],
                    references: [],
                    error: Lang.get('webSearchEmptyQuery'),
                    searchStrategy: 'error',
                    searchTime: new Date().toISOString()
                };
            }

            // For document+websearch mode, we want to use the query as-is
            // since it's already been optimized (but still cleaned of thinking tags)
            if (isDocumentWebSearch) {
                // For document+websearch mode, preserve the query (after cleaning thinking tags)
               //console.log('Document+WebSearch mode detected - preserving cleaned search query');
               //console.log(`DOCUMENT+WEBSEARCH QUERY: "${query}"`);

                // Save the cleaned query for debugging (securely when possible)
                try { await PaiperworkDB.secureLocalStorageSet('last_docwebsearch_query', query); } catch (e) { try { localStorage.setItem('last_docwebsearch_query', query); } catch (err) {} }
            } else if (isResearchMode) {
                // Keep the research query as-is as well
               //console.log('Research mode detected - preserving cleaned search query');
               //console.log(`RESEARCH QUERY: "${query}"`);
            } else if (query.length > 300) {
                // Only modify query further in standard search mode for long queries
               //console.log('Long query detected in standard search mode - attempting extraction');

                // Attempt to extract a more focused query if this appears to be a complex prompt
                if (query.includes('Document context:') ||
                    query.includes('Based on') ||
                    query.includes('search query')) {

                   //console.log('Extracting focused search query from complex prompt');

                    // Try to extract just the query part
                    let focusedQuery = query;

                    // Look for specific patterns at the end that might indicate the actual query
                    const queryExtractPatterns = [
                        /search query:[\s\n]+"([^"]+)"/i,
                        /search query:[\s\n]+(.+?)(?:\n|$)/i,
                        /Generate a concise search query[^:]*:[\s\n]+(.+?)(?:\n|$)/i,
                        /"([^"]{5,100})"/   // Look for quoted text that might be the query
                    ];

                    for (const pattern of queryExtractPatterns) {
                        const match = query.match(pattern);
                        if (match && match[1] && match[1].length > 3) {
                            focusedQuery = match[1].trim();
                           //console.log(`Extracted focused query using pattern: ${focusedQuery}`);
                            break;
                        }
                    }

                    // If we couldn't extract a specific query but it's still too long,
                    // try to use just the first part of the user's question
                    if (focusedQuery === query) {
                        const userQuestionMatch = query.match(/User question:[\s\n]+(.+?)(?:\n|$)/i);
                        if (userQuestionMatch && userQuestionMatch[1]) {
                            // Take just the first 8-10 words of the user question
                            const questionWords = userQuestionMatch[1].split(/\s+/);
                            if (questionWords.length > 8) {
                                focusedQuery = questionWords.slice(0, 8).join(' ');
                               //console.log(`Using simplified user question: ${focusedQuery}`);
                            } else {
                                focusedQuery = userQuestionMatch[1];
                            }
                        } else {
                            // Last resort: take just the first 50 characters
                            focusedQuery = query.substring(0, 50).trim();
                           //console.log(`Using truncated query: ${focusedQuery}`);
                        }
                    }

                    // Use the focused query instead
                   //console.log(`Original query (${query.length} chars) -> Focused query (${focusedQuery.length} chars): ${focusedQuery}`);
                    query = focusedQuery;
                } else {
                    // If it's just a long query without a clear structure, truncate it
                    query = query.substring(0, 200).trim();
                   //console.log(`Truncated long query to: ${query}`);
                }
            }

            // Set the abort controller from parameter or create a new one
            this.abortController = abortController || new AbortController();

            // MAIN SEARCH OPERATION - First get base search results
            const searchResults = await this.searchBing(query, isDocumentWebSearch);

            // Process results for PDFs if in research mode
            if (isResearchMode && searchResults && searchResults.items) {
               //console.log(`📄 PDF SCAN: Checking ${searchResults.items.length} search results for PDFs`);

                searchResults.items.forEach((item, index) => {
                    const url = item.link?.toLowerCase() || '';
                    const isPdf = url.endsWith('.pdf') ||
                        url.includes('/pdf/') ||
                        url.includes('document/d/') ||
                        url.includes('arxiv.org');

                    if (isPdf) {
                       //console.log(`📄 PDF DETECTED in search results [${index}]:`, item.link);
                        // Mark the item as PDF
                        item.isPdf = true;
                    }
                });

                // Log summary
                const pdfCount = searchResults.items.filter(item => item.isPdf).length;
               //console.log(`📄 PDF SCAN COMPLETE: Found ${pdfCount} PDFs in search results`);
            }

            // PARALLEL CONTENT ENHANCEMENT - Only if we have search results
            if (searchResults && searchResults.items && searchResults.items.length > 0) {
                // Increment counter for content enhancement operation
                this.incrementOperation('extractions');

                try {
                   //console.log(`Starting parallel content enhancement for ${Math.min(isResearchMode ? 5 : 5, searchResults.items.length)} results`);

                    // Pass the proper flags for content enhancement
                    // Research mode gets more extractions and PDF processing
                    const extractionLimit = isResearchMode ? 5 : 5;

                    // This will run content extraction in parallel
                    const enhancedResults = await this.enhanceWithPageContent(
                        searchResults,
                        extractionLimit,
                        isResearchMode
                    );

                    return enhancedResults;
                } catch (error) {
                    console.error('Content enhancement error:', error);
                    // Even with enhancement error, return the base search results
                    return searchResults;
                } finally {
                    // Always decrement the content enhancement operation counter
                    this.decrementOperation('extractions');
                }
            } else {
                return searchResults;
            }
        } catch (error) {
            console.error('Search error:', error);

            // Handle cancellation specially
            if (error.name === 'AbortError' || this.isCancelled) {
               //console.log('WebSearch: Search was cancelled');
                return {
                    type: 'general',
                    items: [],
                    references: [],
                    error: Lang.get('webSearchCancelled'),
                    searchStrategy: 'cancelled',
                    searchTime: new Date().toISOString()
                };
            }

            // Return error info with proxy URL for any other errors
            const encodedQuery = encodeURIComponent(query || '');
            return {
                type: 'general',
                items: [{
                    title: Lang.get('webSearchErrorOccurred'),
                    link: `/api/search/bing?q=${encodedQuery}`,
                    snippet: Lang.get('webSearchErrorDetails', { error: error.message }),
                    source: Lang.get('webSearchErrorSource')
                }],
                references: [{
                    id: 1,
                    url: `/api/search/bing?q=${encodedQuery}`,
                    title: Lang.get('webSearchErrorOccurred')
                }],
                error: Lang.get('webSearchFailed', { error: error.message }),
                searchStrategy: 'error',
                searchTime: new Date().toISOString()
            };
        } finally {
            // CRITICAL: Always decrement the search operation counter
            this.decrementOperation('searches');
           //console.log('WebSearch: smartSearch operation complete');
        }
    }
    // Performs a Bing search using the provided query and parses the results from HTML.
    static async searchBing(query, isDocumentWebSearch = false) {
        try {
            // Track this as a separate operation
            const operationId = Date.now();
            this.pendingOperations.push(operationId);

            // Check cancellation
            if (this.isCancelled) {
               //console.log('WebSearch: Skipping search due to cancellation flag');
                throw new DOMException('Search operation was cancelled', 'AbortError');
            }
            this.pendingOperations.push(operationId);
           //console.log('Starting Bing search for query:', query);
           //console.log(`Search type: ${isDocumentWebSearch ? 'Document+WebSearch' : 'Standard WebSearch'}`);

            const encodedQuery = encodeURIComponent(query);
            const timestamp = new Date().getTime();

            // Add a parameter to identify document+websearch queries
            const proxyUrl = `/api/search/bing?q=${encodedQuery}&_t=${timestamp}${isDocumentWebSearch ? '&mode=doc' : ''}`;
           //console.log(`Making Bing search request to: ${proxyUrl}`);

            // Log the original query for easy copy-pasting to a browser for comparison
            if (isDocumentWebSearch) {
               //console.log(`BING COMPARE URL: https://www.bing.com/search?q=${encodedQuery}`);
            }

            const response = await fetch(proxyUrl, {
                signal: this.abortController.signal
            });

            // Check cancellation after fetch
            if (this.isCancelled) {
                throw new DOMException('Search operation was cancelled', 'AbortError');
            }

            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
            }

            const htmlText = await response.text();

            // Log details about the response
           //console.log('DEBUG: Response size:', htmlText.length, 'bytes');
           //console.log('DEBUG: Response is valid HTML?', htmlText.startsWith('<!DOCTYPE html>'));

            // Save search query type and HTML sample for comparison (securely when possible)
            const searchType = isDocumentWebSearch ? 'document_websearch' : 'normal_websearch';
            try { await PaiperworkDB.secureLocalStorageSet(`last_${searchType}_query`, query); } catch (e) { try { localStorage.setItem(`last_${searchType}_query`, query); } catch (err) {} }
            try { await PaiperworkDB.secureLocalStorageSet(`last_${searchType}_html_sample`, htmlText.substring(0, 5000)); } catch (e) { try { localStorage.setItem(`last_${searchType}_html_sample`, htmlText.substring(0, 5000)); } catch (err) {} }

            // Parse the HTML to extract search results
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(htmlText, 'text/html');
            // Add diagnostics to check if we received a proper search results page
            const hasSearchResults = htmlText.includes('b_algo');
            const hasResultsList = htmlDoc.querySelector('#b_results') !== null;
            const hasCaptcha = htmlText.includes('captcha') || htmlText.includes('unusual traffic');

           //console.log('DEBUG: HTML contains b_results:', hasResultsList);
           //console.log('DEBUG: HTML contains b_algo:', hasSearchResults);
           //console.log('DEBUG: HTML shows signs of CAPTCHA/blocking:', hasCaptcha);

            // Add a safety check to detect API blocking
            if (hasCaptcha) {
                console.warn('WARNING: Bing appears to be blocking our requests with a CAPTCHA challenge.');
                // Save the HTML for debugging (securely when possible)
                try { await PaiperworkDB.secureLocalStorageSet('bing_blocked_html', htmlText.substring(0, 10000)); } catch (e) { try { localStorage.setItem('bing_blocked_html', htmlText.substring(0, 10000)); } catch (err) {} }
            }

            // If we're missing search results but have HTML, add a special debug file
            if (!hasSearchResults && htmlText.length > 1000) {
                console.warn('WARNING: Response does not contain search results markers');
                try { await PaiperworkDB.secureLocalStorageSet('bing_no_results_html', htmlText.substring(0, 10000)); } catch (e) { try { localStorage.setItem('bing_no_results_html', htmlText.substring(0, 10000)); } catch (err) {} }
            }
            // Extract search results from the HTML
            const results = {
                type: 'general',
                items: [],
                references: [],
                searchStrategy: 'bing',
                searchTime: new Date().toISOString()
            };

            // Try to find the count of results
            const countElement = htmlDoc.querySelector('.sb_count');
            if (countElement) {
                results.resultCount = countElement.textContent.trim();
               //console.log(`Results count from page: ${results.resultCount}`);
            }

            // IMPROVED: More comprehensive selector approach
            let resultElements = [];

            // Try different selector strategies in order of preference
            const selectorStrategies = [
                { name: 'Standard Bing Algorithm Results', selector: '#b_results .b_algo' },
                { name: 'Li-based Algorithm Results', selector: 'li.b_algo' },
                { name: 'Results in Content Area', selector: '#b_content li.b_algo' },
                { name: 'Alternative Content Structure', selector: '.b_algo' },
                { name: 'Title-based Results', selector: 'h2 a' },
                { name: 'Deep Link Search', selector: '#b_results a[href^="http"]' }
            ];

            for (const strategy of selectorStrategies) {
                const elements = htmlDoc.querySelectorAll(strategy.selector);
               //console.log(`Selector strategy '${strategy.name}' (${strategy.selector}): found ${elements.length} elements`);

                if (elements.length > 0) {
                    resultElements = Array.from(elements);
                   //console.log(`Using strategy: ${strategy.name} with ${resultElements.length} results`);
                    break;
                }
            }

            // If no structured results found, fall back to all links that look like search results
            if (resultElements.length === 0) {
               //console.log('No results found with structured selectors, falling back to link extraction');
                const allLinks = htmlDoc.querySelectorAll('a[href^="http"]');

                // Filter links to only include those that look like search results
                resultElements = Array.from(allLinks).filter(link => {
                    const href = link.getAttribute('href');
                    // Filter out navigation, image links, Bing links, etc.
                    return href &&
                        href.length > 20 &&
                        !href.includes('/images/') &&
                        !href.includes('/videos/') &&
                        !href.includes('bing.com') &&
                        !href.includes('microsoft.com') &&
                        !href.includes('msn.com') &&
                        link.textContent.trim().length > 10;
                });

               //console.log(`Extracted ${resultElements.length} potential result links`);
            }

            // Process the found elements
            let refCounter = 1;
            let processedUrls = new Set();

           //console.log(`Processing ${resultElements.length} result elements`);

            // IMPROVED: More robust element processing
            resultElements.forEach((element) => {
                try {
                    // First, try to extract a link element
                    let linkElement = element;

                    // If this isn't a link element itself, try to find a link within it
                    if (element.tagName !== 'A') {
                        linkElement = element.querySelector('a') ||
                            element.querySelector('h2 a') ||
                            element.querySelector('.b_title a');

                        if (!linkElement) {
                            return; // Skip if no link found
                        }
                    }

                    const url = linkElement.getAttribute('href');
                    if (!url || !url.startsWith('http')) {
                        return; // Skip invalid URLs
                    }

                    // Skip duplicate URLs
                    if (processedUrls.has(url)) {
                        return;
                    }
                    processedUrls.add(url);

                    // Extract title
                    let title = linkElement.textContent.trim();
                    if (!title || title.length < 3) {
                        // Try to find title from other elements
                        const titleElement = element.querySelector('h2') ||
                            element.querySelector('.b_title') ||
                            element.querySelector('strong');

                        if (titleElement) {
                            title = titleElement.textContent.trim();
                        } else {
                            // Use URL as fallback title
                            try {
                                const urlObj = new URL(url);
                                title = urlObj.hostname;
                            } catch {
                                title = Lang.get('webSearchDefaultTitle');
                            }
                        }
                    }

                    // Extract snippet
                    let snippet = '';
                    const snippetElement = element.querySelector('.b_caption p') ||
                        element.querySelector('p') ||
                        element.querySelector('.snippet') ||
                        element.querySelector('span');

                    if (snippetElement) {
                        snippet = snippetElement.textContent.trim();
                    } else if (element.textContent) {
                        // Use element text content but remove the title part
                        const fullText = element.textContent.trim();
                        if (fullText.length > title.length) {
                            snippet = fullText.replace(title, '').trim();
                        }
                    }

                    // Extract source
                    let source;
                    try {
                        const sourceElement = element.querySelector('.b_attribution cite') ||
                            element.querySelector('cite') ||
                            element.querySelector('.visurl');

                        if (sourceElement) {
                            source = sourceElement.textContent.trim();
                        } else {
                            // Extract domain from URL
                            const urlObj = new URL(url);
                            source = urlObj.hostname.replace('www.', '');
                        }
                    } catch {
                        source = Lang.get('webSearchUnknownSource');
                    }

                    // Add to references
                    results.references.push({
                        id: refCounter,
                        url: url,
                        title: title
                    });

                    // Add to search results
                    results.items.push({
                        title,
                        link: url,
                        snippet,
                        source,
                        refId: refCounter
                    });

                    refCounter++;

                    // Limit to first 10 results
                    if (refCounter > 10) return;
                } catch (err) {
                    console.error('Error processing search result:', err);
                }
            });

            // FIXED: Move this log statement outside of catch block
           //console.log(`Found ${processedUrls.size} unique URLs from ${resultElements.length} elements`);

            // Add a fallback result with synthetic data if nothing was found
            if (results.items.length === 0) {
               //console.log('No search results found in the HTML response');

                // FIXED: Use the proxy URL instead of direct Bing link
                // Add a synthetic search result that points to the proxy
                results.items.push({
                    title: Lang.get('webSearchResultsForQuery', { query }),
                    link: `/api/search/bing?q=${encodedQuery}`,
                    snippet: Lang.get('webSearchProxyMessage'),
                    source: Lang.get('webSearchProxySource')
                });

                // Add to references too
                results.references.push({
                    id: 1,
                    url: `/api/search/bing?q=${encodedQuery}`,
                    title: Lang.get('webSearchResultsForQuery', { query })
                });
            } else {
               //console.log(`Successfully extracted ${results.items.length} search results`);
            }
            const index = this.pendingOperations.indexOf(operationId);
            if (index > -1) this.pendingOperations.splice(index, 1);

            return results;
        } catch (error) {
            console.error('Search error:', error);

            // Handle cancellation specially
            if (error.name === 'AbortError' || this.isCancelled) {
               //console.log('WebSearch: Search was cancelled');
                return {
                    type: 'general',
                    items: [],
                    references: [],
                    error: Lang.get('webSearchCancelled'),
                    searchStrategy: 'cancelled',
                    searchTime: new Date().toISOString()
                };
            }
            // FIXED: Use proxy URL in error case too
            const encodedQuery = encodeURIComponent(query);

            // Return error info
            return {
                type: 'general',
                items: [{
                    title: Lang.get('webSearchErrorOccurred'),
                    link: `/api/search/bing?q=${encodedQuery}`,
                    snippet: Lang.get('webSearchErrorDetails', { error: error.message }),
                    source: Lang.get('webSearchErrorSource')
                }],
                references: [{
                    id: 1,
                    url: `/api/search/bing?q=${encodedQuery}`,
                    title: Lang.get('webSearchErrorOccurred')
                }],
                error: Lang.get('webSearchFailed', { error: error.message }),
                searchStrategy: 'error',
                searchTime: new Date().toISOString()
            };
        }
    }

    // Formats the search results and enhanced content into a readable string.
    static formatSearchResults(results, isDocumentWebSearch = false) {
       //console.log(`Formatting search results (mode: ${isDocumentWebSearch ? 'Document+WebSearch' : 'Standard WebSearch'})`);

        let formattedResults = '';

        // Add search metadata
        const searchTime = results.searchTime || new Date().toISOString();
        formattedResults += `${Lang.get('webSearchPerformed')}: ${new Date(searchTime).toLocaleString()}\n`;

        if (results.searchStrategy) {
            formattedResults += `${Lang.get('webSearchStrategy')}: ${results.searchStrategy}\n`;
        }
        formattedResults += '\n';

        // Check for error state
        if (results.error) {
            formattedResults += `⚠️ ${Lang.get('webSearchEncounteredIssue')}: ${results.error}\n\n`;
        }

        // Add extracted content section if available
        if (results.enhancedContent && results.enhancedContent.length > 0) {
            formattedResults += `${Lang.get('webSearchExtractedContent')}:\n\n`;

            results.enhancedContent.forEach(content => {
                formattedResults += `${Lang.get('webSearchFromRef', { refId: content.refId, title: content.title })}:\n`;

                // Format based on content type
                if (content.contentType === 'weather') {
                    formattedResults += `🌤️ ${Lang.get('webSearchWeatherInfo')}:\n${content.extractedContent}\n\n`;
                } else {
                    formattedResults += `${content.extractedContent}\n\n`;
                }
            });

            formattedResults += '---\n\n';
        }

        // Format standard search results with a clear heading
        formattedResults += `${Lang.get('webSearchResults')}:\n\n`;

        // Add the actual search results
        // Use numeric refs internally (item.refId) but present markdown links for UI and model consumption.
        const escapeMarkdown = (text = '') => {
            // Escape characters that can break markdown links or formatting
            return String(text).replace(/[\\\[\]\(\)\*_`]/g, '\\$&');
        };

        if (results.items && results.items.length > 0) {
            results.items.forEach(item => {
                const title = item.title || item.link || '';
                const safeTitle = escapeMarkdown(title);
                const safeUrl = item.link || '';

                // Format: [refId] [Title](<url>) — wrap URL in angle brackets to avoid breaking markdown when URLs contain parentheses
                formattedResults += `[${item.refId}] [${safeTitle}](<${safeUrl}>)\n`;

                if (item.snippet) {
                    formattedResults += `${item.snippet}\n`;
                }

                if (item.source) {
                    formattedResults += `${Lang.get('webSearchSource')}: ${item.source}\n`;
                }

                formattedResults += '\n';
            });
        } else {
            formattedResults += `${Lang.get('webSearchNoResultsFound')}.\n\n`;
        }

        return formattedResults;
    }
    // Enhances search results by extracting content from top result pages in parallel.
    static async enhanceWithPageContent(results, maxExtractionsCount = 5, isResearchMode = false) {
        // Add proper operation tracking here
        this.incrementOperation('extractions');
       //console.log(`🔍 [Content Extraction] Starting parallel extraction of content for ${Math.min(maxExtractionsCount, results.items?.length || 0)} results`);

        try {
            if (this.isCancelled) {
               //console.log('WebSearch: Skipping content enhancement due to cancellation');
                return results;
            }

            // Select top results to extract content from, with configurable limit
            const extractionLimit = Math.min(maxExtractionsCount, results.items?.length || 0);
            const topResults = extractionLimit > 0 ? results.items.slice(0, extractionLimit) : [];

            if (!topResults.length) {
               //console.log('🔍 [Content Extraction] No results to enhance');
                return results;
            }

            // Keep track of which results were enhanced
            const enhancedResults = { ...results };
            enhancedResults.enhancedContent = [];

            // PARALLEL PROCESSING: Process all extractions simultaneously
           //console.log(`🔍 [Content Extraction] Beginning parallel extraction of ${topResults.length} results`);

            // Create an array of promises for parallel execution
            const extractionPromises = topResults.map((item, index) =>
                this.extractSingleResult(item, index, isResearchMode)
            );

            // Wait for all extractions to complete in parallel
           //console.log(`🔍 [Content Extraction] Waiting for ${extractionPromises.length} parallel extractions to complete`);
            const extractionResults = await Promise.all(extractionPromises);

            // Filter out null results (failed extractions)
            enhancedResults.enhancedContent = extractionResults.filter(result => result !== null);

            // Log extraction summary
           //console.log(`🔍 [Content Extraction] Completed with ${enhancedResults.enhancedContent.length}/${topResults.length} successful extractions`);

            // PDF summary if in research mode
            if (isResearchMode) {
                const pdfCount = enhancedResults.enhancedContent.filter(r => r.isPdf || r.contentType === 'pdf').length;
               //console.log(`📄 PDF DETECTION: Found ${pdfCount} PDFs among the enhanced content`);
            }

            return enhancedResults;
        } catch (error) {
            console.error('Error during content enhancement:', error);

            // On error, return original results
            return results;
        } finally {
            // CRITICAL: Always decrement the extraction operation counter
            this.decrementOperation('extractions');
           //console.log('🔍 [Content Extraction] Enhancement operation complete');
        }
    }
    // Extracts content from a single search result, handling PDFs and HTML pages.
    static async extractSingleResult(item, index, isResearchMode) {
        const startTime = performance.now();

        try {
            // Skip if URL doesn't look valid
            const url = item.link;
            if (!url || !url.startsWith('http')) {
               //console.log(`🔍 [Content Extraction] [${index + 1}] ⚠️ Skipping invalid URL: ${url}`);
                return null;
            }

            // Check for PDF content
            const isPdf = url.includes('.pdf') ||
                url.toLowerCase().includes('/pdf/') ||
                url.toLowerCase().includes('pdf.') ||
                url.toLowerCase().includes('document/d/');

            // Only skip PDFs if we're NOT in research mode
            if ((isPdf && !isResearchMode) ||
                url.includes('.jpg') ||
                url.includes('.png') ||
                url.includes('/image') ||
                url.includes('/video')) {
               //console.log(`🔍 [Content Extraction] [${index + 1}] ${isResearchMode ? '📄 Processing PDF in research mode:' : '⚠️ Skipping non-HTML content URL:'} ${url}`);

                // If we're in research mode and this is a PDF, return a special marker
                if (isPdf && isResearchMode) {
                    return {
                        originalIndex: index,
                        refId: item.refId,
                        title: item.title,
                        url: url,
                        contentType: 'pdf',
                        extractedContent: null,
                        isPdf: true,
                        requiresSpecialExtraction: true
                    };
                }

                return null;
            }

            // Increment PDF processing counter if needed (tracking for PDF operations)
            if (isPdf && isResearchMode) {
                this.incrementOperation('pdfProcessing');
            }

            const encodedUrl = encodeURIComponent(url);
            const timestamp = new Date().getTime();
            const extractionUrl = `/api/extract/content?url=${encodedUrl}&_t=${timestamp}`;

            const response = await fetch(extractionUrl, {
                signal: this.abortController.signal
            });

            if (this.isCancelled) {
                throw new DOMException('Content extraction was cancelled', 'AbortError');
            }

            if (!response.ok) {
                throw new Error(`Extraction failed with status: ${response.status} ${response.statusText}`);
            }

            const extractionData = await response.json();

           //console.log(`🔍 [Content Extraction] [${index + 1}] ✅ Extracted ${extractionData.content.length} chars from ${url} in ${Math.round(performance.now() - startTime)}ms`);

            return {
                originalIndex: index,
                refId: item.refId,
                title: item.title,
                url: url,
                contentType: extractionData.contentType,
                extractedContent: extractionData.content,
                extractedAt: extractionData.extractedAt,
                processingTimeMs: Math.round(performance.now() - startTime)
            };
        } catch (error) {
            console.error(`🔍 [Content Extraction] [${index + 1}] ❌ Error extracting content from ${item.link}:`, error);
            return null;
        } finally {
            // Decrement PDF processing counter if needed
            if (item.isPdf && isResearchMode) {
                this.decrementOperation('pdfProcessing');
            }
        }
    }
    // Cancels all ongoing and pending web search operations.
    static cancelAllOperations() {
       //console.log('WebSearch: Cancelling all search operations');

        // Set cancellation flag immediately
        this.isCancelled = true;

        // Abort any ongoing fetch operations
        if (this.abortController) {
            this.abortController.abort();
            // Create a fresh AbortController 
            this.abortController = new AbortController();
        }

        // Reset counter
        this.activeRequests = 0;

        // Reset the flag after a delay to allow for new operations
        setTimeout(() => {
           //console.log('WebSearch: Resetting cancellation state');
            this.isCancelled = false;
        }, 1000);

       //console.log('WebSearch: Cancellation complete');
        return true;
    }

}
window.webSearch = WebSearch;
window.WebSearch = WebSearch;

