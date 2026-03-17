class SubjectiveInteractions {


    // Determines if a user's message is likely to contain insight-worthy information about their personality.
    static isMessageInsightWorthy(userPrompt) {
        const wordCount = userPrompt.trim().split(/\s+/).length;
        const charCount = userPrompt.trim().length;
        const hasPunctuation = /[.!?]/.test(userPrompt);
        const hasComplexStructure = userPrompt.includes(',') || userPrompt.includes('and');
        const containsNameInfo = userPrompt.toLowerCase().includes('name');
        const containsSelfReference = userPrompt.toLowerCase().includes("i'm") ||
            userPrompt.toLowerCase().includes("i am") ||
            userPrompt.toLowerCase().includes("i like") ||
            userPrompt.toLowerCase().includes("i don't like") ||
            userPrompt.toLowerCase().includes("this is") ||
            userPrompt.toLowerCase().includes("i feel") ||
            userPrompt.toLowerCase().includes("i think") ||
            userPrompt.toLowerCase().includes("i believe") ||
            userPrompt.toLowerCase().includes("i want") ||
            userPrompt.toLowerCase().includes("i need") ||
            userPrompt.toLowerCase().includes("i love") ||
            userPrompt.toLowerCase().includes("i hate") ||
            userPrompt.toLowerCase().includes("i prefer") ||
            userPrompt.toLowerCase().includes("my") ||
            userPrompt.toLowerCase().includes("mine") ||
            userPrompt.toLowerCase().includes("i know") ||
            userPrompt.toLowerCase().includes("i work") ||
            userPrompt.toLowerCase().includes("i live") ||
            userPrompt.toLowerCase().includes("i enjoy") ||
            userPrompt.toLowerCase().includes("i used to");


        /*console.log('Message insight analysis:', {
            wordCount,
            charCount,
            hasPunctuation,
            hasComplexStructure,
            containsNameInfo,
            containsSelfReference
        });*/

        return (
            containsNameInfo ||
            containsSelfReference ||
            wordCount >= 5 ||
            (charCount > 30) ||
            (wordCount >= 3 && (hasPunctuation || hasComplexStructure))
        );
    }
    // Removes any "thinking" or reasoning tags and their content from a given text string.
    static cleanThinkingContent(text) {
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

        // Log what was removed if anything changed
        if (text !== cleanedText) {
           //console.log('Removed thinking content from insight');
           //console.log('Original:', text);
           //console.log('Cleaned:', cleanedText);
        }

        return cleanedText;
    }

    // Analyzes a user's message to extract a single, concise insight about their identity, preferences, or personality.
    static async analyzeUserMessage(userPrompt, promptInput, sendButton) {
        const modelSelector = document.getElementById('model-selector');
        const selectedModel = modelSelector.value;
        const progressBar = document.getElementById('progress-bar');

        // Show insight generation indicator
        this.showInsightGenerationIndicator();

        // Disable input
        promptInput.disabled = true;
        sendButton.disabled = true;
        progressBar.classList.add('active');

        try {
           //console.log('Starting subjective analysis for:', userPrompt);
            const analysisPrompt = `Extract a single, meaningful insight about the user from this message: "${userPrompt}"
            Focus on identity, personality traits, or personal information.
            Respond with only the insight, for example: "Name is John" or "Shows friendly personality"`;

            // ADD SYSTEM PROMPT for better results
            const systemPrompt = "You are an AI assistant that extracts concise insights about users from their messages. Keep responses brief, focused only on extracting a single meaningful insight about the user's identity, preferences, or personality. Remove identifying personal details.";
            const routing = await OllamaAPI.getApiRoutingForModel(selectedModel);

            const response = await fetch(`${routing.baseUrl}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...routing.headers },
                body: JSON.stringify({
                    model: routing.modelName || selectedModel,
                    prompt: analysisPrompt,
                    system: systemPrompt,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 429) {
                    throw new Error(`${(window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached (429). You may have hit a daily or weekly limit. Please wait for reset or upgrade your Ollama plan: https://ollama.com/upgrade'}${errorText ? `\n${errorText}` : ''}`);
                }
                throw new Error(`Ollama API error (${response.status}): ${errorText || response.statusText}`);
            }

            const analysis = await response.json();
            let insight = analysis?.response || analysis?.message?.content || '';

            insight = this.cleanThinkingContent(insight);

            // ADDED: Remove trailing period if present
            if (insight.endsWith('.')) {
                insight = insight.slice(0, -1);
               //console.log('Removed trailing period from analysis result:', insight);
            }

           //console.log('Analysis result (cleaned):', insight);
            return insight;
        } finally {
            // Re-enable input
            promptInput.disabled = false;
            sendButton.disabled = false;
            progressBar.classList.remove('active');

            // Hide insight generation indicator
            this.hideInsightGenerationIndicator();
        }
    }

    // Loads all stored subjective insights for a given user (by hashed master key) from the database.
    static async loadInsights(hashedMasterKey) {
        // REMOVED: Toggle check that was preventing insights from loading
        // The toggle should only control gathering NEW insights, not loading existing ones

       //console.log('Loading insights for masterkey:', hashedMasterKey);
        const db = await PaiperworkDB.getDatabase(hashedMasterKey);
        const result = db.exec(`
        SELECT insight_content, timestamp
        FROM subjective_insights_${hashedMasterKey}
        ORDER BY timestamp ASC
    `);

        if (!result[0]?.values) {
           //console.log('No insights found');
            return [];
        }

        const insights = [];
        for (const [encryptedInsight] of result[0].values) {
            const decryptedInsight = await PaiperworkDB.decrypt(
                hashedMasterKey,
                JSON.parse(encryptedInsight)
            );
            insights.push(decryptedInsight);
        }

       //console.log('Loaded insights:', insights);
        return insights;
    }
    // Clears all subjective insights for a given user (by hashed master key) from the database.
    static async clearInsights(hashedMasterKey) {
       //console.log('Clearing all insights for masterkey:', hashedMasterKey);

        try {
            const db = await PaiperworkDB.getDatabase(hashedMasterKey);

            // Delete all insights
            db.run(`
            DELETE FROM subjective_insights_${hashedMasterKey}
        `);

            await PaiperworkDB.saveToStorage(db.export(), hashedMasterKey);
           //console.log('All insights cleared successfully');

            if (window.OllamaAPI && typeof window.OllamaAPI.notifyInsightsChanged === 'function') {
                window.OllamaAPI.notifyInsightsChanged(hashedMasterKey);
            }

            return true;
        } catch (error) {
            console.error('Error clearing insights:', error);
            return false;
        }
    }

    // Stores a single subjective insight for a given user (by hashed master key) in the database.
    static async storeInsight(hashedMasterKey, insight) {
       //console.log('Storing individual insight for masterkey:', hashedMasterKey);

        // ADDED: Clean the insight by removing trailing period if present
        let cleanedInsight = insight;
        if (cleanedInsight.endsWith('.')) {
            cleanedInsight = cleanedInsight.slice(0, -1);
           //console.log('Removed trailing period from insight:', cleanedInsight);
        }

        const db = await PaiperworkDB.getDatabase(hashedMasterKey);
        const timestamp = new Date().toISOString();
        const insightId = crypto.randomUUID();

        // Encrypt insight before storage
        const encryptedInsight = await PaiperworkDB.encrypt(hashedMasterKey, cleanedInsight);

        db.run(`
        INSERT INTO subjective_insights_${hashedMasterKey}
        (insight_id, insight_content, timestamp)
        VALUES (?, ?, ?)
    `, [insightId, JSON.stringify(encryptedInsight), timestamp]);

        await PaiperworkDB.saveToStorage(db.export(), hashedMasterKey);
       //console.log('Individual insight stored successfully');

        if (window.OllamaAPI && typeof window.OllamaAPI.notifyInsightsChanged === 'function') {
            window.OllamaAPI.notifyInsightsChanged(hashedMasterKey);
        }

        return true;
    }

    // Stores multiple subjective insights for a given user (by hashed master key) in the database.
    static async storeInsights(hashedMasterKey, insights) {
       //console.log('Storing insights for masterkey:', hashedMasterKey);

        // Clean the insight by removing trailing period and surrounding quotes
        let cleanedInsight = insights;

        // Remove trailing period if present
        if (cleanedInsight.endsWith('.')) {
            cleanedInsight = cleanedInsight.slice(0, -1);
           //console.log('Removed trailing period from insight:', cleanedInsight);
        }

        // Remove surrounding quotes if present
        if (cleanedInsight.startsWith('"') && cleanedInsight.endsWith('"')) {
            cleanedInsight = cleanedInsight.slice(1, -1);
           //console.log('Removed surrounding quotes from insight:', cleanedInsight);
        }

        const db = await PaiperworkDB.getDatabase(hashedMasterKey);
        const timestamp = new Date().toISOString();
        const insightId = crypto.randomUUID();

        // Encrypt insights before storage - USE CLEANED VERSION
        const encryptedInsights = await PaiperworkDB.encrypt(hashedMasterKey, cleanedInsight);

        db.run(`
            INSERT INTO subjective_insights_${hashedMasterKey}
            (insight_id, insight_content, timestamp)
            VALUES (?, ?, ?)
        `, [insightId, JSON.stringify(encryptedInsights), timestamp]);

        await PaiperworkDB.saveToStorage(db.export(), hashedMasterKey);
       //console.log('Insights stored successfully');

        if (window.OllamaAPI && typeof window.OllamaAPI.notifyInsightsChanged === 'function') {
            window.OllamaAPI.notifyInsightsChanged(hashedMasterKey);
        }

        return true;
    }

    // Displays a visual indicator to show that insight generation is in progress.
    static showInsightGenerationIndicator() {
        // Check if indicator already exists
        if (document.getElementById('insight-indicator')) {
            document.getElementById('insight-indicator').style.display = 'flex';
            return;
        }

        // Create indicator
        const indicator = document.createElement('div');
        indicator.id = 'insight-indicator';
        indicator.className = 'insight-generation-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(79, 70, 229, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
            backdrop-filter: blur(4px);
        `;

        // Add spinner
        const spinner = document.createElement('div');
        spinner.className = 'insight-spinner';
        spinner.style.cssText = `
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: insight-spin 1s linear infinite;
            margin-right: 10px;
        `;

        // Add text
        const text = document.createElement('span');
        text.textContent = Lang.get('generatingInsight');

        // Add style for spinner animation
        if (!document.getElementById('insight-spinner-style')) {
            const style = document.createElement('style');
            style.id = 'insight-spinner-style';
            style.textContent = `
                @keyframes insight-spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        // Assemble and add to document
        indicator.appendChild(spinner);
        indicator.appendChild(text);
        document.body.appendChild(indicator);

        // Trigger animation after a small delay (for transition to work)
        setTimeout(() => {
            indicator.style.opacity = '1';
        }, 10);
    }

    // Hides the visual indicator for insight generation.
    static hideInsightGenerationIndicator() {
        const indicator = document.getElementById('insight-indicator');
        if (!indicator) return;

        // Animate out
        indicator.style.opacity = '0';

        // Remove after animation completes
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 300);
    }
}