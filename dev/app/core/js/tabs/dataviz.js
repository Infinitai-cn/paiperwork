class DataViz {
    constructor() {
        this.initialized = false;
        this.colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#84cc16', '#f97316', '#dc2626', '#0ea5e9', '#a855f7', '#d946ef', '#22c55e', '#eab308', '#3b82f6', '#f43f5e', '#7c3aed'];
        this.currentChartRenderState = null;
    }

    // Initializes the DataViz instance and performs any one-time setup
    async initialize() {
        if (this.initialized) return;

       //console.log('DataViz: Initializing visualization engine');
        // Any one-time setup goes here

        this.initialized = true;
    }
        // Creates a visualization based on the given type and user prompt, handling AI response and rendering
        async createVisualization(vizType, userPrompt) {
             //console.log(`DataViz: Creating ${vizType} visualization from prompt: "${userPrompt}"`);

                const systemPrompt = this.getSystemPrompt(vizType);

                try {
                        window.globalAbortController = new AbortController();

                        this.showFloatingWindow(`
                        <div class="dataviz-loading">
                        ${Lang.get('datavizGenerating', { chartType: this.getVizTypeName(vizType) })}
                        <button id="cancel-chart-generation" style="display: block; background: #ef4444; color: white; 
                                border: none; border-radius: 4px; padding: 5px 10px; margin: 10px auto; cursor: pointer;">
                                ${Lang.get('datavizCancel')}
                        </button>
                                </div>
                        `);

                        setTimeout(() => {
                                const cancelButton = document.getElementById('cancel-chart-generation');
                                if (cancelButton) {
                                        cancelButton.addEventListener('click', () => {
                                                if (window.globalAbortController) {
                                                     //console.log('DataViz: Chart generation cancelled by user');
                                                        window.globalAbortController.abort();
                                                        const floatingWindow = document.querySelector('.dataviz-floating-window');
                                                        if (floatingWindow) {
                                                                floatingWindow.remove();

                                                                this.showFloatingWindow(`
                                                                <div class="dataviz-error" style="text-align: center; padding: 20px;">
                                                                        <h3>${Lang.get('datavizGenerationCancelled')}</h3>
                                                                        <p>${Lang.get('datavizCancelledMessage')}</p>
                                                                </div>
                                                                `);
                                                        }
                                                }
                                        });
                                }
                        }, 100);

                        const response = await OllamaAPI.sendToOllama(
                                userPrompt,
                                systemPrompt,
                                8192,
                                null,
                                window.globalAbortController.signal,
                                `dataviz_${Date.now()}`
                        );

                        const reader = response.body.getReader();
                        const decoder = new TextDecoder();
                        let jsonData = '';
                        let pendingLine = '';

                        const appendChunk = value => {
                                if (typeof value === 'string' && value) {
                                        jsonData += value;
                                }
                        };

                        const processStreamLine = rawLine => {
                                const trimmed = String(rawLine || '').trim();
                                if (!trimmed) {
                                        return;
                                }

                                let payload = trimmed;
                                if (payload.startsWith('data:')) {
                                        payload = payload.slice(5).trim();
                                }

                                if (!payload || payload === '[DONE]') {
                                        return;
                                }

                                try {
                                        const data = JSON.parse(payload);
                                        if (typeof data.response === 'string') {
                                                appendChunk(data.response);
                                                return;
                                        }

                                        const cloudMessageContent = data?.message?.content;
                                        if (typeof cloudMessageContent === 'string') {
                                                appendChunk(cloudMessageContent);
                                        }
                                } catch (error) {
                                        console.error('Error parsing response chunk:', error);
                                }
                        };

                        while (true) {
                                const { value, done } = await reader.read();
                                if (done) break;

                                pendingLine += decoder.decode(value, { stream: true });
                                const lines = pendingLine.split(/\r?\n/);
                                pendingLine = lines.pop() || '';
                                lines.forEach(processStreamLine);
                        }

                        pendingLine += decoder.decode();
                        if (pendingLine.trim()) {
                                processStreamLine(pendingLine);
                        }

                         //console.log('Raw response from AI:', jsonData);
                        jsonData = jsonData.replace(/<think>[\s\S]*?<\/think>/gi, '')
                                .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
                                .replace(/<reflection>[\s\S]*?<\/reflection>/gi, '')
                                .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
                                .replace(/<cot>[\s\S]*?<\/cot>/gi, '');

                        if (vizType === 'line' && jsonData.includes('"title":') && jsonData.includes('}\n\n{')) {
                                 //console.log('Multiple datasets detected in line chart response');

                                let cleanedJson = jsonData.replace(/```json|```/g, '').trim();
                                const jsonObjects = cleanedJson.split(/}\s*\n+\s*{/);

                                if (jsonObjects.length > 1) {
                                         //console.log('Successfully split multiple JSON objects:', jsonObjects.length);

                                        let firstObject = jsonObjects[0];
                                        if (!firstObject.endsWith('}')) {
                                                firstObject += '}';
                                        }

                                        try {
                                                let chartData = JSON.parse(firstObject);

                                                for (let i = 1; i < jsonObjects.length; i++) {
                                                        let additionalObject = '{' + jsonObjects[i];
                                                        if (!additionalObject.endsWith('}')) {
                                                                additionalObject += '}';
                                                        }

                                                        try {
                                                                const additionalData = JSON.parse(additionalObject);
                                                                if (additionalData.series && Array.isArray(additionalData.series)) {
                                                                        if (!chartData.series) {
                                                                                chartData.series = [];
                                                                        }
                                                                        chartData.series = chartData.series.concat(additionalData.series);
                                                                         //console.log(`Added ${additionalData.series.length} series from object ${i + 1}`);
                                                                }
                                                        } catch (err) {
                                                                console.error(`Error parsing additional JSON object ${i + 1}:`, err);
                                                        }
                                                }

                                                 //console.log('Merged chart data:', chartData);
                                                this.renderChart(vizType, chartData);
                                                return;
                                        } catch (err) {
                                                console.error('Error parsing first JSON object:', err);
                                        }
                                }
                        }

                        let chartData;
                        try {
                                chartData = JSON.parse(jsonData.trim());
                        } catch (e) {
                                try {
                                        const jsonMatch = jsonData.match(/(\{[\s\S]*\})/);
                                        if (!jsonMatch) {
                                                throw new Error('Could not extract valid JSON from AI response');
                                        }

                                        const extractedJson = jsonMatch[0].trim();
                                         //console.log('Extracted JSON:', extractedJson);
                                        chartData = JSON.parse(extractedJson);
                                } catch (innerError) {
                                        console.error('JSON extraction failed:', innerError);

                                        try {
                                                let cleanedJson = jsonData.replace(/```json|```/g, '').trim();
                                                cleanedJson = cleanedJson.substring(
                                                        cleanedJson.indexOf('{'),
                                                        cleanedJson.lastIndexOf('}') + 1
                                                );
                                                 //console.log('Cleaned JSON:', cleanedJson);
                                                chartData = JSON.parse(cleanedJson);
                                        } catch (finalError) {
                                                throw new Error('Failed to parse JSON response: ' + finalError.message);
                                        }
                                }
                        }

                         //console.log('Parsed chart data:', chartData);
                        this.renderChart(vizType, chartData);

                        try {
                                const imageDataUrl = await this.captureChartAsDataUrl();
                                if (imageDataUrl) {
                                        return imageDataUrl;
                                }
                        } catch (captureError) {
                                console.warn('DataViz: Failed to capture chart image', captureError);
                        }

                        return null;

                } catch (error) {
                        if (error.name === 'AbortError') {
                                 //console.log('DataViz: Chart generation cancelled by user');
                                this.showFloatingWindow(`
    <div class="dataviz-error" style="text-align: center; padding: 20px; color: #000000;">
        <h3>${Lang.get('datavizChartGenerationCancelled')}</h3>
        <p>${Lang.get('datavizCancelledByUser')}</p>
    </div>
                                `);
                        } else {
                                const isRateLimited = this.isRateLimitError(error);
                                console.error('Error creating visualization:', error);
                                if (isRateLimited) {
                                        this.showCloudUsageLimitNotice(error);
                                } else {
                                        this.showFloatingWindow(`
    <div class="dataviz-error" style="color: #000000;">
        <h3>${Lang.get('datavizErrorCreating')}</h3>
        <p>${error.message}</p>
        <p>${Lang.get('datavizErrorMessage')}</p>
        <p>${Lang.get('datavizErrorSuggestion')}</p>
    </div>
                                        `);
                                }
                        }
                } finally {
                        window.globalAbortController = null;
                }
        }

        isRateLimitError(error) {
                const message = String(error?.message || '').toLowerCase();
                return message.includes('429')
                        || message.includes('420')
                        || message.includes('too many requests')
                        || message.includes('weekly usage')
                        || message.includes('daily limit')
                        || message.includes('rate limit');
        }

        showCloudUsageLimitNotice(error) {
                const safeMessage = this.escapeHtml(String(error?.message || error || ''));
                const title = (window.Lang && typeof Lang.get === 'function' && Lang.get('artifactCloudLimitTitle')) || 'Cloud usage limit reached';
                const rateLimitMessage = (window.Lang && typeof Lang.get === 'function' && Lang.get('artifactCloudLimitBody'))
                        || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.';

                this.showFloatingWindow(`
    <div class="dataviz-error" style="text-align: center; padding: 20px; color: #000000;">
        <h3 style="color:#b91c1c; margin-bottom: 10px;">${this.escapeHtml(title)}</h3>
        <p style="margin-bottom:10px; line-height:1.45;">${this.escapeHtml(rateLimitMessage)}</p>
        <p style="margin-bottom:12px; white-space:pre-wrap; line-height:1.4;">${safeMessage}</p>
        <p style="margin:0;"><a href="https://ollama.com/settings" target="_blank" rel="noopener noreferrer">https://ollama.com/settings</a></p>
    </div>
                `);
        }

        escapeHtml(text) {
                return String(text || '')
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;');
        }

        // Returns base system prompt prefix for all chart types
        getBaseSystemPromptHeader() {
                return `You are a data visualization expert. Supported chart types: pie, bar, line, scatter, area, radar, heatmap, bubble.
                                You must extract data from the user's request and return ONLY valid JSON in the format required for the selected chart type.`;
        }

        // Returns the appropriate system prompt string for the specified visualization type
        getSystemPrompt(vizType) {
                switch (vizType) {
                        case 'pie':
                                return this.getPieChartPrompt();
                        case 'bar':
                                return this.getBarChartPrompt();
                        case 'line':
                                return this.getLineChartPrompt();
                        case 'scatter':
                                return this.getScatterPlotPrompt();
                        case 'area':
                                return this.getAreaChartPrompt();
                        case 'radar':
                                return this.getRadarChartPrompt();
                        case 'heatmap':
                                return this.getHeatMapPrompt();
                        case 'bubble':
                                return this.getBubbleChartPrompt();
                        default:
                                console.warn(`DataViz: No system prompt for chart type: ${vizType}, using default`);
                                return this.getPieChartPrompt();
                }
        }

        // Returns the system prompt for generating a pie chart
        getPieChartPrompt() {
                return `${this.getBaseSystemPromptHeader()}
                                You are a data visualization expert specializing in pie charts. 
                                Extract data from the user request and return ONLY valid JSON in this format:
                                {
                                    "title": "Chart title",
                                    "data": [
                                        {"label": "Category 1", "value": 25}, 
                                        {"label": "Category 2", "value": 75}
                                    ]
                                }
                                Include nothing except this JSON data structure.`;
        }

        // Returns the system prompt for generating a bar chart
        getBarChartPrompt() {
                return `${this.getBaseSystemPromptHeader()}
                                You are a data visualization expert specializing in bar charts. 
                                Extract data from the user request and return ONLY valid JSON in this format:
                                {
                                    "title": "Chart title",
                                    "xAxisLabel": "X-Axis Label",
                                    "yAxisLabel": "Y-Axis Label",
                                    "series": [
                                        {
                                            "name": "Series Name",
                                            "color": "#eab308",
                                            "data": [
                                                {"label": "Category 1", "value": 25, "color": "#eab308"}, 
                                                {"label": "Category 2", "value": 75, "color": "#eab308"}
                                            ]
                                        }
                                    ]
                                }
                
                                If multiple data series are mentioned (like comparing different products, years, etc.), 
                                organize them as separate series with the same category labels:
                                {
                                    "title": "Chart title",
                                    "xAxisLabel": "X-Axis Label",
                                    "yAxisLabel": "Y-Axis Label",
                                    "series": [
                                        {
                                            "name": "Series 1 Name",
                                            "color": "#eab308",
                                            "data": [
                                                {"label": "Category 1", "value": 25, "color": "#eab308"}, 
                                                {"label": "Category 2", "value": 75, "color": "#eab308"}
                                            ]
                                        },
                                        {
                                            "name": "Series 2 Name",
                                            "color": "#2563eb",
                                            "data": [
                                                {"label": "Category 1", "value": 35, "color": "#2563eb"}, 
                                                {"label": "Category 2", "value": 65, "color": "#2563eb"}
                                            ]
                                        }
                                    ]
                                }

                                If the user requests a specific bar color or palette, include explicit \`color\` fields in the JSON.
                                Use \`series.color\` for a whole series color and \`data[].color\` for per-bar overrides.
                                When a color is requested, do not omit the \`color\` field.
                                Prefer hex color values like \`#eab308\` for yellow, \`#2563eb\` for blue, \`#ef4444\` for red, and \`#10b981\` for green.
                
                                Include nothing except this JSON data structure.`;
        }

        // Returns the system prompt for generating a line chart
        getLineChartPrompt() {
                return `${this.getBaseSystemPromptHeader()}
                                You are a data visualization expert specializing in line charts.
                                Extract data from the user request and return ONLY valid JSON in this format:
                                {
                                    "title": "Chart title",
                                    "xAxisLabel": "X-Axis Label",
                                    "yAxisLabel": "Y-Axis Label",
                                    "series": [
                                        {
                                            "name": "Series Name",
                                            "data": [
                                                {"x": "2020", "y": 25}, 
                                                {"x": "2021", "y": 50},
                                                {"x": "2022", "y": 75}
                                            ]
                                        }
                                    ]
                                }
                
                                If multiple data series are mentioned (like comparing different categories, years, etc.),
                                include them as separate series objects within the SAME JSON structure:
                                {
                                    "title": "Comparison Chart",
                                    "xAxisLabel": "X-Axis Label",
                                    "yAxisLabel": "Y-Axis Label",
                                    "series": [
                                        {
                                            "name": "First Series",
                                            "data": [
                                                {"x": "Category A", "y": 65},
                                                {"x": "Category B", "y": 18},
                                                {"x": "Category C", "y": 8}
                                            ]
                                        },
                                        {
                                            "name": "Second Series",
                                            "data": [
                                                {"x": "Category A", "y": 50},
                                                {"x": "Category B", "y": 40},
                                                {"x": "Category C", "y": 10}
                                            ]
                                        }
                                    ]
                                }
                
                                Do not create separate JSON objects for different data series. Always combine all series into a single JSON object.
                
                                If the data doesn't represent a time series or trend, but rather categories (like comparing browser market shares),
                                you can use the category names as x-values.
                
                                Include nothing except this JSON data structure.`;
        }

        // Returns the system prompt for generating a scatter plot
        getScatterPlotPrompt() {
                return `${this.getBaseSystemPromptHeader()}
                                You are a data visualization expert specializing in scatter plots.
                                Extract data from the user request and return ONLY valid JSON in this format:
                                {
                                    "title": "Chart title",
                                    "xAxisLabel": "X-Axis Label",
                                    "yAxisLabel": "Y-Axis Label",
                                    "series": [
                                        {
                                            "name": "Series Name",
                                            "data": [
                                                {"x": 10, "y": 25, "label": "Point 1"}, 
                                                {"x": 15, "y": 50, "label": "Point 2"},
                                                {"x": 20, "y": 75, "label": "Point 3"}
                                            ]
                                        }
                                    ]
                                }
                
                                Each point should have x and y values (numeric), and optionally a label.
                
                                If multiple data series are mentioned (like comparing different categories or groups),
                                include them as separate series objects within the SAME JSON structure:
                                {
                                    "title": "Comparison Scatter Plot",
                                    "xAxisLabel": "X-Axis Label",
                                    "yAxisLabel": "Y-Axis Label",
                                    "series": [
                                        {
                                            "name": "Group A",
                                            "data": [
                                                {"x": 10, "y": 65, "label": "A1"},
                                                {"x": 20, "y": 18, "label": "A2"},
                                                {"x": 30, "y": 42, "label": "A3"}
                                            ]
                                        },
                                        {
                                            "name": "Group B",
                                            "data": [
                                                {"x": 15, "y": 55, "label": "B1"},
                                                {"x": 25, "y": 45, "label": "B2"},
                                                {"x": 35, "y": 12, "label": "B3"}
                                            ]
                                        }
                                    ]
                                }
                
                                Do not create separate JSON objects for different data series. Always combine all series into a single JSON object.
                                Ensure all x and y values are numeric. If a value is mentioned as a range or approximate, use the midpoint or best estimate.
                
                                Include nothing except this JSON data structure.`;
        }

        // Returns the system prompt for generating an area chart
        getAreaChartPrompt() {
                return `${this.getBaseSystemPromptHeader()}
                                You are a data visualization expert specializing in area charts.
                                Extract data from the user request and return ONLY valid JSON in this format:
                                {
                                    "title": "Chart title",
                                    "xAxisLabel": "X-Axis Label (often time periods)",
                                    "yAxisLabel": "Y-Axis Label (measured values)",
                                    "series": [
                                        {
                                            "name": "Series Name",
                                            "data": [
                                                {"x": "Jan", "y": 25}, 
                                                {"x": "Feb", "y": 50},
                                                {"x": "Mar", "y": 75}
                                            ],
                                            "fillColor": "#4f46e580" // Optional, will use default if not provided
                                        }
                                    ]
                                }
                
                                If multiple data series are mentioned (like comparing different categories over time),
                                include them as separate series objects within the SAME JSON structure:
                                {
                                    "title": "Comparison Area Chart",
                                    "xAxisLabel": "Months",
                                    "yAxisLabel": "Values",
                                    "series": [
                                        {
                                            "name": "Series A",
                                            "data": [
                                                {"x": "Jan", "y": 65},
                                                {"x": "Feb", "y": 78},
                                                {"x": "Mar", "y": 90}
                                            ]
                                        },
                                        {
                                            "name": "Series B",
                                            "data": [
                                                {"x": "Jan", "y": 40},
                                                {"x": "Feb", "y": 35},
                                                {"x": "Mar", "y": 55}
                                            ]
                                        }
                                    ],
                                    "stacked": false
                                }
                
                                You can also specify "stacked": true for a stacked area chart where values are cumulative.
                
                                If the data represents percentages or proportions that should sum to 100%, include "percentage": true
                
                                Do not create separate JSON objects for different data series. Always combine all series into a single JSON object.
                                Include nothing except this JSON data structure.`;
        }

        // Returns the system prompt for generating a radar chart
        getRadarChartPrompt() {
                 //console.log("getRadarChartPrompt called");
                return `${this.getBaseSystemPromptHeader()}
                                You are a data visualization expert specializing in radar charts.
                                Extract data from the user request and return ONLY valid JSON in this format:
                                {
                                    "title": "Chart title",
                                    "categories": ["Category 1", "Category 2", "Category 3", "Category 4", "Category 5"],
                                    "series": [
                                        {
                                            "name": "Series Name",
                                            "data": [85, 50, 90, 40, 70],
                                            "color": "#4f46e5" // Optional, will use default if not provided
                                        }
                                    ],
                                    "maxValue": 100 // Optional, will be calculated if not provided
                                }
                
                                Each series must have exactly the same number of data points as there are categories.
                
                                If multiple data series are mentioned (like comparing different entities),
                                include them as separate series objects within the SAME JSON structure:
                                {
                                    "title": "Comparison Radar Chart",
                                    "categories": ["Speed", "Power", "Range", "Durability", "Accuracy"],
                                    "series": [
                                        {
                                            "name": "Product A",
                                            "data": [80, 90, 60, 85, 70]
                                        },
                                        {
                                            "name": "Product B",
                                            "data": [65, 75, 90, 80, 60]
                                        }
                                    ]
                                }
                
                                All data values must be numeric and should represent the same scale across all categories.
                                Values are typically between 0 and 100, but can be any range as long as they're consistent.
                
                                Do not create separate JSON objects for different data series. Always combine all series into a single JSON object.
                                Include nothing except this JSON data structure.`;
        }

        // Returns the system prompt for generating a heat map
        getHeatMapPrompt() {
                return `${this.getBaseSystemPromptHeader()}
                                You are a data visualization expert specializing in heat maps.
                                Extract data from the user request and return ONLY valid JSON in this format:
                                {
                                    "title": "Heat Map Title",
                                    "xLabels": ["X1", "X2", "X3", "X4"],
                                    "yLabels": ["Y1", "Y2", "Y3", "Y4"],
                                    "data": [
                                        [10, 20, 30, 40],
                                        [50, 60, 70, 80],
                                        [90, 100, 110, 120],
                                        [130, 140, 150, 160]
                                    ],
                                    "colorScale": {
                                        "min": 0,
                                        "max": 160,
                                        "minColor": "#f7fbff",
                                        "maxColor": "#08306b"
                                    }
                                }
                
                                The data array should contain rows of values, where each row corresponds to a yLabel and
                                each column corresponds to an xLabel. All rows should have the same length as xLabels.
                
                                Values in the data array represent the intensity or magnitude at each x,y coordinate.
                                The colorScale is optional - if not provided, a default blue scale will be used.
                
                                For categorical data, format it as a matrix of numbers representing the strength of correlation
                                or frequency of occurrence between the categories.
                
                                Include nothing except this JSON data structure.`;
        }

        // Returns the system prompt for generating a bubble chart
        getBubbleChartPrompt() {
                return `${this.getBaseSystemPromptHeader()}
                                You are a data visualization expert specializing in bubble charts.
                                Extract data from the user request and return ONLY valid JSON in this format:
                                {
                                    "title": "Chart title",
                                    "xAxisLabel": "X-Axis Label",
                                    "yAxisLabel": "Y-Axis Label",
                                    "series": [
                                        {
                                            "name": "Series Name",
                                            "data": [
                                                {"x": 10, "y": 20, "size": 15, "label": "Point A"},
                                                {"x": 30, "y": 40, "size": 30, "label": "Point B"},
                                                {"x": 50, "y": 10, "size": 20, "label": "Point C"}
                                            ]
                                        }
                                    ]
                                }
                
                                Each point must have x, y, and size values (all numeric), and optionally a label.
                                The size value determines the bubble diameter/area and should be proportional to what the bubble represents.
                
                                If multiple data series are mentioned (like comparing different categories or groups),
                                include them as separate series objects within the SAME JSON structure:
                                {
                                    "title": "Comparison Bubble Chart",
                                    "xAxisLabel": "X-Axis Label",
                                    "yAxisLabel": "Y-Axis Label",
                                    "series": [
                                        {
                                            "name": "Group A",
                                            "data": [
                                                {"x": 10, "y": 20, "size": 15, "label": "A1"},
                                                {"x": 30, "y": 40, "size": 30, "label": "A2"}
                                            ]
                                        },
                                        {
                                            "name": "Group B",
                                            "data": [
                                                {"x": 15, "y": 25, "size": 10, "label": "B1"},
                                                {"x": 35, "y": 35, "size": 25, "label": "B2"}
                                            ]
                                        }
                                    ]
                                }
                
                                Do not create separate JSON objects for different data series. Always combine all series into a single JSON object.
                                Ensure all x, y, and size values are numeric.
                
                                Include nothing except this JSON data structure.`;
        }
    // Routes the parsed chart data to the appropriate chart rendering function based on type
    renderChart(vizType, chartData) {
        this.currentChartRenderState = null;

        // Route to the appropriate chart renderer based on type
        switch (vizType) {
            case 'pie':
                return this.renderPieChart(chartData);
            case 'bar':
                return this.renderBarChart(chartData);
            case 'line':
                return this.renderLineChart(chartData);
            case 'scatter':
                return this.renderScatterPlot(chartData);
            case 'area':
                return this.renderAreaChart(chartData);
            case 'radar':
                return this.renderRadarChart(chartData);
            case 'heatmap':
                return this.renderHeatMap(chartData);
            case 'bubble':
                return this.renderBubbleChart(chartData);
            default:
                console.warn(`DataViz: No valid chart type specified: ${vizType}`);
                return this.showFloatingWindow(`
    <div class="dataviz-error" style="text-align: center; padding: 30px;">
        <h3>${Lang.get('datavizNoChartType')}</h3>
        <p>${Lang.get('datavizSelectChartPrompt')}</p>
        <div style="margin-top: 20px;">
            <button onclick="document.querySelector('.dataviz-floating-window .close-button').click()" 
                    style="background: #4f46e5; color: white; border: none; border-radius: 4px; padding: 10px 15px; cursor: pointer;">
                ${Lang.get('datavizOkSelect')}
            </button>
        </div>
    </div>
                `);
        }
    }
    // Renders a pie chart using the provided chart data
    renderPieChart(chartData) {
        if (!window.DataVizPieChart || typeof window.DataVizPieChart.render !== 'function') {
            console.error('DataViz: Pie chart renderer is not available');
            return this.showFloatingWindow(`
             <div class="dataviz-error">
                 <h3>${Lang.get("datavizErrorPieChart")}</h3>
                 <p>${Lang.get("datavizErrorMessage")}</p>
             </div>
            `);
        }

        return window.DataVizPieChart.render(this, chartData);
    }
    // Renders a bar chart (single or multi-series) using the provided chart data
    renderBarChart(chartData) {
        if (!window.DataVizBarChart || typeof window.DataVizBarChart.render !== 'function') {
            console.error('DataViz: Bar chart renderer is not available');
            return this.showFloatingWindow(`
            <div class="dataviz-error">
                <h3>${Lang.get('datavizErrorBarChart')}</h3>
                <p>${Lang.get('datavizErrorMessage')}</p>
            </div>
        `);
        }

        return window.DataVizBarChart.render(this, chartData);
    }
    renderLineChart(chartData) {
        if (!window.DataVizLineChart || typeof window.DataVizLineChart.render !== 'function') {
            console.error('DataViz: Line chart renderer is not available');
            return this.showFloatingWindow(`
             <div class="dataviz-error">
                 <h3>${Lang.get("datavizErrorLineChart")}</h3>
                 <p>${Lang.get("datavizErrorMessage")}</p>
             </div>
            `);
        }

        return window.DataVizLineChart.render(this, chartData);
    }
    // Renders a scatter plot using the provided chart data
    renderScatterPlot(chartData) {
		if (!window.DataVizScatterPlotChart || typeof window.DataVizScatterPlotChart.render !== 'function') {
			console.error('DataViz: Scatter plot renderer is not available');
			return this.showFloatingWindow(`
			<div class="dataviz-error">
				<h3>${Lang.get('datavizErrorScatterPlot')}</h3>
				<p>${Lang.get('datavizErrorMessage')}</p>
			</div>
		`);
		}

		return window.DataVizScatterPlotChart.render(this, chartData);
    }
    renderAreaChart(chartData) {
        if (!window.DataVizAreaChart || typeof window.DataVizAreaChart.render !== 'function') {
            console.error('DataViz: Area chart renderer is not available');
            return this.showFloatingWindow(`
            <div class="dataviz-error">
                <h3>${Lang.get('datavizErrorAreaChart')}</h3>
                <p>${Lang.get('datavizErrorMessage')}</p>
            </div>
        `);
        }

        return window.DataVizAreaChart.render(this, chartData);
    }
    renderRadarChart(chartData) {
		if (!window.DataVizRadarChart || typeof window.DataVizRadarChart.render !== 'function') {
			console.error('DataViz: Radar chart renderer is not available');
			return this.showFloatingWindow(`
			<div class="dataviz-error">
				<h3>${Lang.get('datavizErrorRadarChart')}</h3>
				<p>${Lang.get('datavizErrorMessage')}</p>
			</div>
		`);
		}

		return window.DataVizRadarChart.render(this, chartData);
    }
    renderHeatMap(chartData) {
		if (!window.DataVizHeatMapChart || typeof window.DataVizHeatMapChart.render !== 'function') {
			console.error('DataViz: Heat map renderer is not available');
			return this.showFloatingWindow(`
			<div class="dataviz-error">
				<h3>${Lang.get('datavizErrorHeatMap')}</h3>
				<p>${Lang.get('datavizErrorMessage')}</p>
			</div>
		`);
		}

		return window.DataVizHeatMapChart.render(this, chartData);
    }
    renderBubbleChart(chartData) {
		if (!window.DataVizBubbleChart || typeof window.DataVizBubbleChart.render !== 'function') {
			console.error('DataViz: Bubble chart renderer is not available');
			return this.showFloatingWindow(`
			<div class="dataviz-error">
				<h3>${Lang.get('datavizErrorBubbleChart')}</h3>
				<p>${Lang.get('datavizErrorMessage')}</p>
			</div>
		`);
		}

		return window.DataVizBubbleChart.render(this, chartData);
    }
    // Generates SVG coordinates for a pie slice between two angles (used for gradients)
    generateCoordinates(startAngle, endAngle) {
        const coords = [];
        for (let angle = startAngle; angle <= endAngle; angle += 1) {
            const radians = (angle - 90) * (Math.PI / 180);
            const x = 50 + 50 * Math.cos(radians);
            const y = 50 + 50 * Math.sin(radians);
            coords.push(`${x}% ${y}%`);
        }
        return coords.join(', ');
    }

    // Returns a human-readable name for a given visualization type
    getVizTypeName(vizType) {
        const names = {
            'pie': Lang.get('datavizPieChart'),
            'bar': Lang.get('datavizBarChart'),
            'line': Lang.get('datavizLineChart'),
            'scatter': Lang.get('datavizScatterPlot'),
            'area': Lang.get('datavizAreaChart'),
            'radar': Lang.get('datavizRadarChart'),
            'heatmap': Lang.get('datavizHeatMap'),
            'bubble': Lang.get('datavizBubbleChart')
        };

        return names[vizType] || Lang.get('datavizChart');
    }

    // Closes the current DataViz floating window and backdrop if present
    closeFloatingWindow() {
        const floatingWindow = document.querySelector('.dataviz-floating-window');
        if (floatingWindow) {
            floatingWindow.remove();
        }
        const backdrop = document.querySelector('.dataviz-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    }

    // Displays a floating modal window with the provided chart HTML content and header controls
    showFloatingWindow(content, options = {}) {
        // Remove any existing floating window
        const existingWindow = document.querySelector('.dataviz-floating-window');
        if (existingWindow) {
            document.body.removeChild(existingWindow);
            const existingBackdrop = document.querySelector('.dataviz-backdrop');
            if (existingBackdrop) {
                document.body.removeChild(existingBackdrop);
            }
        }

        // Create backdrop (same style as paperwork.js)
        const backdrop = document.createElement('div');
        backdrop.className = 'dataviz-backdrop';
        backdrop.style.position = 'fixed';
        backdrop.style.top = '0';
        backdrop.style.left = '0';
        backdrop.style.right = '0';
        backdrop.style.bottom = '0';
        backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        backdrop.style.zIndex = '999'; // Below the window
        backdrop.style.backdropFilter = 'blur(2px)';
        document.body.appendChild(backdrop);

        // Create floating window with theme variables
        const floatingWindow = document.createElement('div');
        floatingWindow.className = 'dataviz-floating-window';
        floatingWindow.style.position = 'fixed';
        floatingWindow.style.top = '50%';
        floatingWindow.style.left = '50%';
        floatingWindow.style.transform = 'translate(-50%, -50%)';
        floatingWindow.style.backgroundColor = 'var(--chart-bg, var(--bg-color, #ffffff))';
        floatingWindow.style.color = 'var(--chart-text, var(--text-color, #333333))';
        floatingWindow.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        floatingWindow.style.padding = '0';
        floatingWindow.style.borderRadius = '6px';
        floatingWindow.style.zIndex = '1000';
        floatingWindow.style.overflow = 'auto';
        floatingWindow.style.width = '550px';
        floatingWindow.style.height = 'auto';
        floatingWindow.style.maxWidth = '95vw';
        floatingWindow.style.maxHeight = '90vh';

        // Remove resize functionality to simplify
        // floatingWindow.style.resize = 'both'; 
        floatingWindow.style.overflow = 'auto';
        floatingWindow.style.width = '550px';
        floatingWindow.style.height = 'auto';
        floatingWindow.style.maxWidth = '95vw';
        floatingWindow.style.maxHeight = '90vh';

        // Determine chart type for sizing adjustments
        const isMultiSeriesBar = content.includes('bar-groups-container');
        const isBarChart = content.includes('bar-chart-container');
        const isLineChart = content.includes('line-chart-container');
        const isScatterPlot = content.includes('scatter-plot-container');
        const isAreaChart = content.includes('area-chart-container');
        const isRadarChart = content.includes('radar-chart-container');
        const isBubbleChart = content.includes('bubble-chart-container');
        const isHeatMap = content.includes('heat-map-container');
        const isLoading = content.includes('dataviz-loading');
        const isPieChart = content.includes('pie-chart') || content.includes('pie-container');

        // Adjust width based on chart type
        if (isMultiSeriesBar || isBubbleChart) {
            floatingWindow.style.width = '750px';
        } else if (isLineChart || isScatterPlot || isAreaChart) {
            floatingWindow.style.width = '700px';
        } else if (isRadarChart) {
            floatingWindow.style.width = '720px';
        } else if (isHeatMap) {
            floatingWindow.style.width = '700px';
        } else if (isPieChart) {
            floatingWindow.style.width = '550px';
        } else if (isLoading) {
            floatingWindow.style.width = '400px';
        }

        // Create header with title and close button
        const header = document.createElement('div');
        header.style.padding = '10px 15px';
        header.style.background = 'var(--chart-legend-bg, var(--background-secondary, #f8f9fa))';
        header.style.borderBottom = '1px solid var(--chart-plot-border, var(--border-color, #eee))';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.className = 'chart-header';

        // Left section for title
        const titleSection = document.createElement('div');
        titleSection.style.display = 'flex';
        titleSection.style.alignItems = 'center';
        titleSection.style.gap = '10px';

        // Add chart icon if not in loading state
        if (!isLoading) {
            const chartIcon = document.createElement('span');
            chartIcon.innerHTML = '📊';
            chartIcon.style.fontSize = '16px';
            titleSection.appendChild(chartIcon);
        }

        // Detect title from content or use default
        let title = isLoading ? '' : Lang.get('datavizChartView');


        const titleEl = document.createElement('div');
        titleEl.textContent = title;
        titleEl.style.fontWeight = 'bold';
        titleEl.style.color = 'var(--chart-title, var(--text-color, #333))';
        titleSection.appendChild(titleEl);

        // Add the title section to the header
        header.appendChild(titleSection);

        // Right section for buttons
        const buttonsSection = document.createElement('div');
        buttonsSection.style.display = 'flex';
        buttonsSection.style.alignItems = 'center';
        buttonsSection.style.gap = '10px';

        // Add export button (except for loading state)
        if (!isLoading) {
            const exportButton = document.createElement('button');
            exportButton.innerHTML = Lang.get('datavizExportPNG');
            exportButton.className = 'export-button';
            exportButton.style.background = '#b06629';
            exportButton.style.color = 'white';
            exportButton.style.border = 'none';
            exportButton.style.borderRadius = '4px';
            exportButton.style.padding = '5px 10px';
            exportButton.style.fontSize = '12px';
            exportButton.style.cursor = 'pointer';
            exportButton.style.display = 'flex';
            exportButton.style.alignItems = 'center';
            exportButton.style.gap = '4px';

            // Add click handler
            exportButton.onclick = () => this.exportChartAsPng();

            buttonsSection.appendChild(exportButton);
        }
        // Always add close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.className = 'close-button';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.fontSize = '20px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.padding = '0 5px';
        closeButton.style.color = 'var(--chart-text, var(--text-color, #666))';
        // Modified close handler for the loading state
        if (isLoading) {
            closeButton.onclick = () => {
                // If we're in the loading state, also abort the generation
                if (window.globalAbortController) {
                   //console.log('DataViz: Chart generation cancelled via close button');
                    window.globalAbortController.abort();
                    window.globalAbortController = null;
                }

                // Then remove the window
                document.body.removeChild(floatingWindow);
                document.body.removeChild(backdrop);
                // Show cancellation message
                this.showFloatingWindow(`
                <div class="dataviz-error" style="text-align: center; padding: 20px;">
                    <h3>${Lang.get('datavizGenerationCancelled')}</h3>
                    <p>${Lang.get('datavizCancelledMessage')}</p>
                </div>
            `);
            };
        } else {
            backdrop.addEventListener('click', () => {
                document.body.removeChild(floatingWindow);
                document.body.removeChild(backdrop);
            });
            // Standard close handler for non-loading windows
            closeButton.onclick = () => {
                document.body.removeChild(floatingWindow);
                document.body.removeChild(backdrop);
            };
        }
        buttonsSection.appendChild(closeButton);

        header.appendChild(buttonsSection);

        // Create container for content
        const contentContainer = document.createElement('div');
        contentContainer.id = 'chart-content';
        contentContainer.style.padding = '10px';
        contentContainer.style.overflow = 'auto';
        contentContainer.style.maxHeight = 'calc(90vh - 40px)';
        contentContainer.style.color = 'var(--chart-text, var(--text-color, #333))';
        contentContainer.className = 'chart-content';

        // Handle loading state with nicer styling
        if (isLoading) {

            const spinnerColor = 'var(--chart-title, var(--accent-color, #4f46e5))';
            const spinnerBg = 'var(--chart-grid, var(--border-color, #f3f3f3))';
            const textColor = 'var(--chart-text, var(--text-color, #333))';
            const subtextColor = 'var(--chart-axis, var(--text-secondary, #666))';

            contentContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 250px; padding: 20px; text-align: center;">
                <div style="width: 50px; height: 50px; border: 5px solid ${spinnerBg}; border-top: 5px solid ${spinnerColor}; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
                <h3 style="margin-bottom: 10px; color: ${textColor};">${Lang.get('datavizGeneratingChart')}</h3>
                <p style="color: ${subtextColor}; font-size: 14px;">${Lang.get('datavizAnalyzingData')}</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        } else {
            const themeCompatibilityCSS = `
            <style>
                /* Theme compatibility CSS */
                #chart-content .chart-title { color: var(--chart-title, var(--text-color, #333)) !important; }
                #chart-content .axis-label { fill: var(--chart-axis, var(--text-secondary, #666)) !important; }
                #chart-content text { fill: var(--chart-text, var(--text-color, #333)) !important; }
                #chart-content .legend-label { color: var(--chart-text, var(--text-color, #333)) !important; }
                #chart-content rect[fill="#f8f9fa"] { fill: var(--chart-plot-bg, var(--background-secondary, #f8f9fa)) !important; }
                #chart-content rect[stroke="#e9ecef"] { stroke: var(--chart-plot-border, var(--border-color, #e9ecef)) !important; }
                #chart-content line[stroke="#adb5bd"] { stroke: var(--chart-axis, var(--border-color, #adb5bd)) !important; }
                #chart-content .tooltip { 
                    background: var(--chart-tooltip-bg, rgba(0, 0, 0, 0.8)) !important; 
                    color: var(--chart-tooltip-text, #ffffff) !important; 
                }
            </style>
            `;

            contentContainer.innerHTML = themeCompatibilityCSS + content;
        }

        // Assemble the window
        floatingWindow.appendChild(header);
        floatingWindow.appendChild(contentContainer);
        document.body.appendChild(floatingWindow);

        return floatingWindow;
    }

    truncateText(ctx, text, maxWidth) {
        if (ctx.measureText(text).width <= maxWidth) {
            return text;
        }

        let truncated = text;
        while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
        }

        return truncated + '...';
    }

    showScreenshotInstructions() {
        const instructionModal = document.createElement('div');
        instructionModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            padding: 20px;
        `;

        instructionModal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; text-align: center;">
                <h3 style="margin-top: 0;">${Lang.get('datavizExportChartImage')}</h3>
                <p>${Lang.get('datavizExportRestriction')}</p>
                <p>${Lang.get('datavizExportMethods')}</p>
                <ul style="text-align: left; margin: 20px 0;">
                    <li>${Lang.get('datavizExportScreenshot')}
                        <ul>
                            <li>${Lang.get('datavizExportMac')}</li>
                            <li>${Lang.get('datavizExportWindows')}</li>
                        </ul>
                    </li>
                    <li>${Lang.get('datavizExportRightClick')}</li>
                </ul>
                <button id="close-instruction" style="background: #4f46e5; color: white; border: none; border-radius: 4px; padding: 10px 20px; cursor: pointer;">
                    ${Lang.get('datavizExportUnderstand')}
                </button>
            </div>
        `;

        document.body.appendChild(instructionModal);

        // Add event listener for the close button
        document.getElementById('close-instruction').addEventListener('click', () => {
            document.body.removeChild(instructionModal);
        });
    }
    // Exports the currently displayed chart as a PNG image, handling theme and style adjustments
    exportChartAsPng() {
       //console.log('DataViz: Starting chart export to PNG');

        if (window.DataVizBarChart && typeof window.DataVizBarChart.exportPng === 'function' &&
            this.currentChartRenderState && this.currentChartRenderState.type === 'bar') {
            const exported = window.DataVizBarChart.exportPng(this);
            if (exported) {
                return;
            }
        }

        if (window.DataVizPieChart && typeof window.DataVizPieChart.exportPng === 'function' &&
            this.currentChartRenderState && this.currentChartRenderState.type === 'pie') {
            const exported = window.DataVizPieChart.exportPng(this);
            if (exported) {
                return;
            }
        }

        if (window.DataVizLineChart && typeof window.DataVizLineChart.exportPng === 'function' &&
            this.currentChartRenderState && this.currentChartRenderState.type === 'line') {
            const exported = window.DataVizLineChart.exportPng(this);
            if (exported) {
                return;
            }
        }

        if (window.DataVizScatterPlotChart && typeof window.DataVizScatterPlotChart.exportPng === 'function' &&
            this.currentChartRenderState && this.currentChartRenderState.type === 'scatter') {
            const exported = window.DataVizScatterPlotChart.exportPng(this);
            if (exported) {
                return;
            }
        }

        if (window.DataVizAreaChart && typeof window.DataVizAreaChart.exportPng === 'function' &&
            this.currentChartRenderState && this.currentChartRenderState.type === 'area') {
            const exported = window.DataVizAreaChart.exportPng(this);
            if (exported) {
                return;
            }
        }

        if (window.DataVizRadarChart && typeof window.DataVizRadarChart.exportPng === 'function' &&
            this.currentChartRenderState && this.currentChartRenderState.type === 'radar') {
            const exported = window.DataVizRadarChart.exportPng(this);
            if (exported) {
                return;
            }
        }

        if (window.DataVizHeatMapChart && typeof window.DataVizHeatMapChart.exportPng === 'function' &&
            this.currentChartRenderState && this.currentChartRenderState.type === 'heatmap') {
            const exported = window.DataVizHeatMapChart.exportPng(this);
            if (exported) {
                return;
            }
        }

        if (window.DataVizBubbleChart && typeof window.DataVizBubbleChart.exportPng === 'function' &&
            this.currentChartRenderState && this.currentChartRenderState.type === 'bubble') {
            const exported = window.DataVizBubbleChart.exportPng(this);
            if (exported) {
                return;
            }
        }

        // Get the chart container
        const chartContent = document.getElementById('chart-content');
        if (!chartContent) {
            console.error('DataViz: Chart content not found for export');
            return;
        }

        // Check if html2canvas is available
        if (typeof html2canvas === 'undefined') {
            console.error('DataViz: html2canvas library not loaded');
            this.showScreenshotInstructions();
            return;
        }

        try {
            // Get chart title for filename
            let chartTitle = "chart";
            const titleElement = chartContent.querySelector('.chart-title');
            if (titleElement) {
                chartTitle = titleElement.textContent.trim().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').toLowerCase();
            }

            // Create a loading indicator that respects current theme
            const loadingIndicator = document.createElement('div');
            loadingIndicator.textContent = Lang.get('datavizGeneratingImage');
            loadingIndicator.style.cssText = `
                position: absolute;
                bottom: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--chart-tooltip-bg, rgba(0, 0, 0, 0.7));
                color: var(--chart-tooltip-text, white);
                padding: 8px 15px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 2000;
            `;
            document.body.appendChild(loadingIndicator);

            // Detect if we're in dark mode
            const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ||
                document.documentElement.classList.contains('dark-mode') ||
                getComputedStyle(document.documentElement).backgroundColor === 'rgb(0, 0, 0)' ||
                getComputedStyle(document.documentElement).color === 'rgb(255, 255, 255)';

            // Set appropriate background color based on theme
            const currentBgColor = isDarkMode ?
                '#1a1a1a' :  // Dark background
                '#ffffff';   // Light background

           //console.log(`DataViz: Exporting with ${isDarkMode ? 'dark' : 'light'} mode background`);

            // Save original styles to restore after export
            const originalStyles = [];

            // Save all element styles before modification
            chartContent.querySelectorAll('*').forEach(el => {
                const svgAttributes = {};

                // Save special SVG attributes (for rect, path, line elements)
                if (el.tagName === 'rect' || el.tagName === 'path' || el.tagName === 'line' || el.tagName === 'circle' || el.tagName === 'text') {
                    ['fill', 'stroke', 'stroke-width', 'stroke-dasharray'].forEach(attr => {
                        if (el.hasAttribute(attr)) {
                            svgAttributes[attr] = el.getAttribute(attr);
                        }
                    });

                    // For text elements, also save font attributes
                    if (el.tagName === 'text') {
                        ['font-size', 'font-weight', 'text-anchor', 'dominant-baseline'].forEach(attr => {
                            if (el.hasAttribute(attr)) {
                                svgAttributes[attr] = el.getAttribute(attr);
                            }
                        });
                    }
                }

                originalStyles.push({
                    element: el,
                    cssText: el.style.cssText,
                    svgAttributes: svgAttributes
                });
            });

            // Apply theme-specific styles selectively
            chartContent.querySelectorAll('*').forEach(el => {
                // 1. PRESERVE COLORED ELEMENTS: Skip elements that should maintain their background colors
                if (el.classList.contains('bar') ||
                    el.classList.contains('color-box') ||
                    el.classList.contains('series-polygon') ||
                    el.classList.contains('bubble') ||
                    el.classList.contains('area-path') ||
                    el.classList.contains('heat-cell')) {
                    // Only adjust text color within these elements if needed
                    if (el.childNodes.length > 0 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
                        el.style.color = isDarkMode ? '#ffffff' : '#333333';
                    }
                }
                // 2. TEXT ELEMENTS: Ensure text has appropriate color and transparent background
                else if (el.classList.contains('bar-label') ||
                    el.classList.contains('legend-label') ||
                    el.classList.contains('axis-label') ||
                    el.classList.contains('bar-value') ||
                    el.classList.contains('bar-group-label') ||
                    el.classList.contains('chart-title') ||
                    el.tagName === 'TEXT') {
                    el.style.color = isDarkMode ? '#ffffff' : '#333333';

                    // Set explicit fill color for SVG text elements
                    if (el.tagName === 'TEXT') {
                        el.setAttribute('fill', isDarkMode ? '#ffffff' : '#333333');
                    }

                    // Ensure transparent background for text elements
                    el.style.backgroundColor = 'transparent';
                    el.style.background = 'transparent';
                }
                // 3. CONTAINERS: Set appropriate background for container elements
                else if (el.classList.contains('chart-container') ||
                    el.classList.contains('line-chart-container') ||
                    el.classList.contains('scatter-plot-container') ||
                    el.classList.contains('area-chart-container') ||
                    el.classList.contains('radar-chart-container') ||
                    el.classList.contains('bubble-chart-container') ||
                    el.classList.contains('heat-map-container') ||
                    el.classList.contains('bar-chart-container') ||
                    el.id === 'chart-content') {
                    // Main containers should have the theme background
                    el.style.backgroundColor = currentBgColor;
                }
                // 4. BACKGROUNDS: Handle explicit plot backgrounds like rect elements
                else if (el.tagName === 'rect' &&
                    !el.classList.contains('heat-cell')) {
                    if (!el.hasAttribute('data-original-fill')) {
                        el.setAttribute('data-original-fill', el.getAttribute('fill') || '');
                    }

                    // Plot backgrounds should be slightly lighter/darker than main background
                    if (isDarkMode) {
                        el.setAttribute('fill', '#2a2a2a');
                    } else {
                        el.setAttribute('fill', '#f8f9fa');
                    }
                }
                // 5. LINES: Set appropriate color for grid lines and axes
                else if (el.tagName === 'line' || el.tagName === 'path') {
                    const currentStroke = el.getAttribute('stroke');
                    if (currentStroke && (
                        currentStroke === '#adb5bd' ||
                        currentStroke === '#dee2e6' ||
                        currentStroke === '#e9ecef')) {
                        // Use a lighter color for grid lines in dark mode
                        el.setAttribute('stroke', isDarkMode ? '#555555' : currentStroke);
                    }
                }
            });

            // Use html2canvas with explicit theme background
            html2canvas(chartContent, {
                scale: 2,
                backgroundColor: currentBgColor,
                logging: false,
                useCORS: true,
                allowTaint: true
            }).then(canvas => {
                try {
                    const dataURL = canvas.toDataURL('image/png');
                    this.downloadImage(dataURL, chartTitle);
                } catch (error) {
                    console.error('DataViz: Error in export operation:', error);
                    this.showScreenshotInstructions();
                } finally {
                    originalStyles.forEach(item => {
                        item.element.style.cssText = item.cssText;

                        if (item.svgAttributes) {
                            Object.entries(item.svgAttributes).forEach(([attr, value]) => {
                                item.element.setAttribute(attr, value);
                            });
                        }

                        if (item.element.tagName === 'rect' && item.element.hasAttribute('data-original-fill')) {
                            const originalFill = item.element.getAttribute('data-original-fill');
                            if (originalFill) {
                                item.element.setAttribute('fill', originalFill);
                            }
                            item.element.removeAttribute('data-original-fill');
                        }
                    });

                    document.body.removeChild(loadingIndicator);
                }
            }).catch(error => {
                console.error('DataViz: HTML2Canvas error:', error);
                this.showScreenshotInstructions();

                originalStyles.forEach(item => {
                    item.element.style.cssText = item.cssText;

                    if (item.svgAttributes) {
                        Object.entries(item.svgAttributes).forEach(([attr, value]) => {
                            item.element.setAttribute(attr, value);
                        });
                    }

                    if (item.element.tagName === 'rect' && item.element.hasAttribute('data-original-fill')) {
                        const originalFill = item.element.getAttribute('data-original-fill');
                        if (originalFill) {
                            item.element.setAttribute('fill', originalFill);
                        }
                        item.element.removeAttribute('data-original-fill');
                    }
                });

                document.body.removeChild(loadingIndicator);
            });
        } catch (error) {
            // Added missing catch block to complete the try-catch structure
            console.error('DataViz: Error during export process:', error);
            this.showScreenshotInstructions();
        }
    }

    async captureChartAsDataUrl() {
        if (window.DataVizBarChart && typeof window.DataVizBarChart.captureDataUrl === 'function' &&
            this.currentChartRenderState && this.currentChartRenderState.type === 'bar') {
            return window.DataVizBarChart.captureDataUrl(this);
        }

        if (window.DataVizPieChart && typeof window.DataVizPieChart.captureDataUrl === 'function' &&
            this.currentChartRenderState && this.currentChartRenderState.type === 'pie') {
            return window.DataVizPieChart.captureDataUrl(this);
        }

        if (window.DataVizLineChart && typeof window.DataVizLineChart.captureDataUrl === 'function' &&
            this.currentChartRenderState && this.currentChartRenderState.type === 'line') {
            return window.DataVizLineChart.captureDataUrl(this);
        }

        if (window.DataVizScatterPlotChart && typeof window.DataVizScatterPlotChart.captureDataUrl === 'function' &&
            this.currentChartRenderState && this.currentChartRenderState.type === 'scatter') {
            return window.DataVizScatterPlotChart.captureDataUrl(this);
        }

        if (window.DataVizAreaChart && typeof window.DataVizAreaChart.captureDataUrl === 'function' &&
            this.currentChartRenderState && this.currentChartRenderState.type === 'area') {
            return window.DataVizAreaChart.captureDataUrl(this);
        }

        if (window.DataVizRadarChart && typeof window.DataVizRadarChart.captureDataUrl === 'function' &&
            this.currentChartRenderState && this.currentChartRenderState.type === 'radar') {
            return window.DataVizRadarChart.captureDataUrl(this);
        }

        if (window.DataVizHeatMapChart && typeof window.DataVizHeatMapChart.captureDataUrl === 'function' &&
            this.currentChartRenderState && this.currentChartRenderState.type === 'heatmap') {
            return window.DataVizHeatMapChart.captureDataUrl(this);
        }

        if (window.DataVizBubbleChart && typeof window.DataVizBubbleChart.captureDataUrl === 'function' &&
            this.currentChartRenderState && this.currentChartRenderState.type === 'bubble') {
            return window.DataVizBubbleChart.captureDataUrl(this);
        }

        const chartContent = document.getElementById('chart-content');
        if (!chartContent) {
            console.warn('DataViz: No chart content found for capture');
            return null;
        }

        if (typeof html2canvas === 'undefined') {
            console.warn('DataViz: html2canvas is not available for capture');
            return null;
        }

        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ||
            document.documentElement.classList.contains('dark-mode') ||
            getComputedStyle(document.documentElement).backgroundColor === 'rgb(0, 0, 0)' ||
            getComputedStyle(document.documentElement).color === 'rgb(255, 255, 255)';

        const backgroundColor = isDarkMode ? '#1a1a1a' : '#ffffff';

        const canvas = await html2canvas(chartContent, {
            scale: 2,
            backgroundColor: backgroundColor,
            logging: false,
            useCORS: true,
            allowTaint: true
        });

        return canvas.toDataURL('image/png');
    }

    downloadImage(dataURL, chartTitle) {
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `${chartTitle}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
       //console.log('DataViz: Chart exported successfully');
    }
    // Shows a fallback error message if export fails and suggests manual screenshot
    showExportError() {
        console.error('DataViz: Export failed, showing error message');
        alert('Failed to export chart as PNG. This may be due to browser security restrictions.');

        // Fallback: offer manual screenshot option
        alert('Please use your system screenshot tool to capture the chart instead.');
    }

}

// Create a global instance for use throughout the app
document.addEventListener('DOMContentLoaded', () => {
    window.dataViz = new DataViz();
   //console.log('DataViz: Instance created and assigned to window.dataViz');
});

// Register the class on the window object immediately
window.DataViz = DataViz;
// Signal that the class is available
window.DataVizLoaded = true;