class SubjectiveInteractions {


    // Determines if a user's message is likely to contain insight-worthy information about their personality.
    static isMessageInsightWorthy(userPrompt) {
        const normalizedPrompt = userPrompt.trim();
        const lowerPrompt = normalizedPrompt.toLowerCase();
        const wordCount = normalizedPrompt.split(/\s+/).filter(Boolean).length;
        const charCount = normalizedPrompt.length;
        const hasPunctuation = /[.!?]/.test(normalizedPrompt);
        const hasComplexStructure = normalizedPrompt.includes(',') || normalizedPrompt.includes(' and ');
        const containsNameInfo = lowerPrompt.includes('name') || lowerPrompt.includes('nombre') || lowerPrompt.includes('nom');

        const personalPatterns = [
            "i'm", "i am", "i like", "i don't like", "i dont like", "this is", "i feel", "i think", "i believe", "i want", "i need", "i love", "i hate", "i prefer", "my", "mine", "i know", "i work", "i live", "i enjoy", "i used to",
            "yo soy", "me gusta", "no me gusta", "quiero", "necesito", "mi", "mío", "soy", "me siento", "pienso", "creo", "amo", "odio", "prefiero", "trabajo", "vivo",
            "je suis", "j'aime", "je n'aime pas", "j'ai", "je veux", "j'ai besoin", "mon", "ma", "mes", "je pense", "je crois", "j'adore", "je déteste", "je préfère", "je travaille", "j'habite",
            "ich bin", "ich mag", "ich hasse", "ich brauche", "ich möchte", "mein", "meine", "ich liebe", "ich denke", "ich glaube", "ich arbeite", "ich lebe",
            "sono", "mi piace", "non mi piace", "voglio", "ho bisogno", "mio", "mia", "io penso", "io credo", "amo", "odio", "preferisco", "lavoro", "vivo",
            "我", "我喜欢", "我不喜欢", "我想", "我需要", "我觉得", "我认为", "我是", "我的", "我爱", "我讨厌", "我偏好", "我工作", "我住", "我曾",
            "私", "僕", "好き", "嫌い", "仕事", "住んで", "欲しい", "必要", "思う", "考える", "愛してる",
            "저는", "나는", "좋아", "싫어", "원해", "필요", "일해", "살아요", "사랑"
        ];

        const containsPersonalSignal = personalPatterns.some(pattern => lowerPrompt.includes(pattern));

        const cjkMatches = normalizedPrompt.match(/[\u2E80-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/gu);
        const cjkCount = cjkMatches ? cjkMatches.length : 0;
        const isMostlyCJK = cjkCount > 0 && cjkCount / Math.max(charCount, 1) > 0.4;

        const hasStrongCJKSignal = isMostlyCJK && /我|私|僕|저는|나는|喜欢|讨厌|想|需要|觉得|认为|好き|嫌い|원해|필요/.test(normalizedPrompt);

        return (
            containsNameInfo ||
            containsPersonalSignal ||
            wordCount >= 4 ||
            charCount > 20 ||
            (wordCount >= 3 && (hasPunctuation || hasComplexStructure)) ||
            (hasStrongCJKSignal && cjkCount >= 6)
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
        /*if (text !== cleanedText) {
           console.log('Removed thinking content from insight');
           console.log('Original:', text);
           console.log('Cleaned:', cleanedText);
        }*/

        return cleanedText;
    }

    static normalizeInsightText(insight) {
        if (!insight) return '';
        return insight
            .trim()
            .replace(/^['"“”‘’]+|['"“”‘’]+$/g, '')
            .replace(/[。！？.!?]+$/g, '')
            .replace(/[\uFE30-\uFE4F]/g, '')
            .replace(/\s+/g, ' ')
            .toLowerCase();
    }

    static parseInsightResponse(rawResponse) {
        const cleanedResponse = this.cleanThinkingContent(String(rawResponse || '')).trim();
        let jsonText = '';

        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        } else {
            const firstBrace = cleanedResponse.indexOf('{');
            const lastBrace = cleanedResponse.lastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace) {
                jsonText = cleanedResponse.slice(firstBrace, lastBrace + 1);
            }
        }

        if (jsonText) {
            try {
                const parsed = JSON.parse(jsonText);
                const insight = String(parsed.insight || parsed.insight_text || '').trim();
                const category = String(parsed.category || parsed.type || 'other').trim() || 'other';
                const confidence = Number(parsed.confidence || parsed.score || 0) || 0;
                return {
                    insight,
                    category,
                    confidence: Math.min(Math.max(confidence, 0), 1)
                };
            } catch (error) {
               //console.log('Failed to parse insight JSON, falling back to text output', error);
            }
        }

        const fallbackInsight = cleanedResponse.replace(/^['"“”‘’]+|['"“”‘’]+$/g, '').trim();
        return {
            insight: fallbackInsight,
            category: 'other',
            confidence: fallbackInsight ? 0.5 : 0
        };
    }

    static buildInsightAnalysisPrompt(userPrompt) {
        return `Extract a single, meaningful insight about the user from this message: "${userPrompt}"
Return valid JSON with the following shape exactly:
{
  "insight": "A short user-specific insight phrase in the same language as the user's message if possible.",
  "category": "identity|preference|personality|background|habit|interest|location|occupation|tone|other",
  "confidence": confidence_score_as_a_number_between_0_and_1
}
Only return JSON. Do not include any other text outside the JSON object. If a clear user-specific insight cannot be extracted, set "insight" to an empty string and "confidence" to 0.0.`;
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
            const analysisPrompt = this.buildInsightAnalysisPrompt(userPrompt);
            const systemPrompt = "You are an AI assistant that extracts concise insights about users from their messages. Keep responses brief, structured, and user-focused. Return only valid JSON with insight, category, and confidence. Use the same language as the user's message when possible, and avoid personal identifiers.";
            const routing = await OllamaAPI.getOpenAIRoutingForModel(selectedModel);

            // OpenAI-compatible single-turn completion (standard messages context).
            const payload = OllamaAPI.buildOpenAIChatPayload({
                model: routing.modelName || selectedModel,
                system: systemPrompt,
                userPrompt: analysisPrompt,
                contextSize: 8192,
                modelParams: {},
                think: false,
                stream: false,
                historyMessages: []
            });

            const response = await fetch(`${routing.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...routing.headers },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 429) {
                    throw new Error(`${(window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.'}${errorText ? `\n${errorText}` : ''}`);
                }
                throw new Error(`Ollama API error (${response.status}): ${errorText || response.statusText}`);
            }

            const analysis = await response.json();
            const rawResponse = analysis?.choices?.[0]?.message?.content || '';
            const insightData = this.parseInsightResponse(rawResponse);

            insightData.insight = this.cleanThinkingContent(insightData.insight || '').trim();
            if (insightData.insight.endsWith('.')) {
                insightData.insight = insightData.insight.slice(0, -1).trim();
            }

            if (!insightData.insight) {
                return {
                    insight: '',
                    category: 'other',
                    confidence: 0
                };
            }

            return insightData;
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

    static async findDuplicateInsight(hashedMasterKey, insight) {
        const normalizedNewInsight = this.normalizeInsightText(insight);
        if (!normalizedNewInsight) return false;

        const db = await PaiperworkDB.getDatabase(hashedMasterKey);
        const result = db.exec(`
            SELECT insight_content
            FROM subjective_insights_${hashedMasterKey}
        `);

        if (!result[0]?.values) {
            return false;
        }

        for (const [encryptedInsight] of result[0].values) {
            const decryptedInsight = await PaiperworkDB.decrypt(
                hashedMasterKey,
                JSON.parse(encryptedInsight)
            );

            if (this.normalizeInsightText(decryptedInsight) === normalizedNewInsight) {
                return true;
            }
        }

        return false;
    }

    // Stores a single subjective insight for a given user (by hashed master key) in the database.
    static async storeInsight(hashedMasterKey, insightData) {
       //console.log('Storing individual insight for masterkey:', hashedMasterKey);

        const payload = typeof insightData === 'string'
            ? { insight: insightData, category: 'other', confidence: 0.5 }
            : {
                insight: String(insightData.insight || '').trim(),
                category: String(insightData.category || 'other').trim() || 'other',
                confidence: Number(insightData.confidence || 0) || 0,
                relatedConversationId: insightData.relatedConversationId || null
            };

        let cleanedInsight = this.cleanThinkingContent(payload.insight || '').trim();
        if (cleanedInsight.endsWith('.')) {
            cleanedInsight = cleanedInsight.slice(0, -1).trim();
        }
        if (!cleanedInsight) {
            return false;
        }

        if (await this.findDuplicateInsight(hashedMasterKey, cleanedInsight)) {
           //console.log('Duplicate insight detected, skipping save:', cleanedInsight);
            return false;
        }

        const db = await PaiperworkDB.getDatabase(hashedMasterKey);
        const timestamp = new Date().toISOString();
        const insightId = crypto.randomUUID();

        const encryptedInsight = await PaiperworkDB.encrypt(hashedMasterKey, cleanedInsight);

        db.run(`
        INSERT INTO subjective_insights_${hashedMasterKey}
        (insight_id, insight_type, insight_content, confidence, timestamp, related_conversation_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [insightId, payload.category, JSON.stringify(encryptedInsight), payload.confidence, timestamp, payload.relatedConversationId]);

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

        const insightArray = Array.isArray(insights) ? insights : [insights];
        let storedCount = 0;

        for (const item of insightArray) {
            if (!item) continue;

            const payload = typeof item === 'string'
                ? { insight: item, category: 'other', confidence: 0.5 }
                : item;

            const saved = await this.storeInsight(hashedMasterKey, payload);
            if (saved) storedCount += 1;
        }

        return storedCount > 0;
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

if (typeof window !== 'undefined') {
    window.SubjectiveInteractions = SubjectiveInteractions;
}