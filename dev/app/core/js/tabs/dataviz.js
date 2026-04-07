class DataViz {
    constructor() {
        this.initialized = false;
        this.colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];
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

        // Get the appropriate system prompt based on vizType
        const systemPrompt = this.getSystemPrompt(vizType);

        try {
            // Create a new AbortController specifically for this visualization request
            window.globalAbortController = new AbortController();

            // Show loading indicator with cancel button
            this.showFloatingWindow(`
            <div class="dataviz-loading">
            ${Lang.get('datavizGenerating', { chartType: this.getVizTypeName(vizType) })}
            <button id="cancel-chart-generation" style="display: block; background: #ef4444; color: white; 
                border: none; border-radius: 4px; padding: 5px 10px; margin: 10px auto; cursor: pointer;">
                ${Lang.get('datavizCancel')}
            </button>
                </div>
            `);

            // Add event listener to cancel button after the window is shown
            setTimeout(() => {
                const cancelButton = document.getElementById('cancel-chart-generation');
                if (cancelButton) {
                    cancelButton.addEventListener('click', () => {
                        if (window.globalAbortController) {
                           //console.log('DataViz: Chart generation cancelled by user');
                            window.globalAbortController.abort();

                            // Close the loading window
                            const floatingWindow = document.querySelector('.dataviz-floating-window');
                            if (floatingWindow) {
                                floatingWindow.remove();

                                // Show cancellation message
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

            // Call the AI using OllamaAPI with abort signal
            const response = await OllamaAPI.sendToOllama(
                userPrompt,
                systemPrompt,
                8192, // context size
                null, // no previous context
                window.globalAbortController.signal, // pass the abort signal
                `dataviz_${Date.now()}` // unique request ID
            );

            // Process the response
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
            // Strip thinking containers from raw AI response
            jsonData = jsonData.replace(/<think>[\s\S]*?<\/think>/gi, '')
                .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
                .replace(/<reflection>[\s\S]*?<\/reflection>/gi, '')
                .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
                .replace(/<cot>[\s\S]*?<\/cot>/gi, '');

            // Handle special case for line charts with multiple datasets
            if (vizType === 'line' && jsonData.includes('"title":') && jsonData.includes('}\n\n{')) {
                // Multiple JSON objects detected
               //console.log('Multiple datasets detected in line chart response');

                // Remove code block markers
                let cleanedJson = jsonData.replace(/```json|```/g, '').trim();

                // Split by the pattern that separates multiple JSON objects
                const jsonObjects = cleanedJson.split(/}\s*\n+\s*{/);

                if (jsonObjects.length > 1) {
                   //console.log('Successfully split multiple JSON objects:', jsonObjects.length);

                    // Process the first object (add closing brace if needed)
                    let firstObject = jsonObjects[0];
                    if (!firstObject.endsWith('}')) {
                        firstObject += '}';
                    }

                    try {
                        // Parse the first object as our base chart data
                        let chartData = JSON.parse(firstObject);

                        // For each additional object, parse it and merge its series into the base object
                        for (let i = 1; i < jsonObjects.length; i++) {
                            let additionalObject = '{' + jsonObjects[i];
                            // Add closing brace if needed
                            if (!additionalObject.endsWith('}')) {
                                additionalObject += '}';
                            }

                            try {
                                const additionalData = JSON.parse(additionalObject);
                                if (additionalData.series && Array.isArray(additionalData.series)) {
                                    // Add the additional series to the base chart data
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
                        // Continue with standard parsing methods
                    }
                }
            }

            // Standard JSON extraction methods if the special case didn't work
            let chartData;
            try {
                // First, try to parse the entire response as JSON
                chartData = JSON.parse(jsonData.trim());
            } catch (e) {
                // If that fails, try to extract JSON using regex
                try {
                    const jsonMatch = jsonData.match(/(\{[\s\S]*\})/);
                    if (!jsonMatch) {
                        throw new Error('Could not extract valid JSON from AI response');
                    }

                    const extractedJson = jsonMatch[0].trim();
                   //console.log('Extracted JSON:', extractedJson);

                    // Try to parse the extracted JSON
                    chartData = JSON.parse(extractedJson);
                } catch (innerError) {
                    console.error('JSON extraction failed:', innerError);

                    // Last resort: Try to fix common JSON issues and parse again
                    try {
                        // Remove any markdown code block markers
                        let cleanedJson = jsonData.replace(/```json|```/g, '').trim();
                        // Remove any text before first { and after last }
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

            // Render the chart with the successfully parsed data
            this.renderChart(vizType, chartData);

            // Attempt to capture the chart as image data URL for external uses
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
            // Check if this is an abort error
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
            // Always clean up the global abort controller
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
                return this.getPieChartPrompt(); // Default to pie chart
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
                      "data": [
                        {"label": "Category 1", "value": 25}, 
                        {"label": "Category 2", "value": 75}
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
                      "data": [
                        {"label": "Category 1", "value": 25}, 
                        {"label": "Category 2", "value": 75}
                      ]
                    },
                    {
                      "name": "Series 2 Name",
                      "data": [
                        {"label": "Category 1", "value": 35}, 
                        {"label": "Category 2", "value": 65}
                      ]
                    }
                  ]
                }
                
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
        // Create a single conic gradient for the pie chart
        let legendItems = '';

        // Calculate total for percentages
        const total = chartData.data.reduce((sum, item) => sum + item.value, 0);
       //console.log('DataViz: Rendering pie chart with total:', total);

        // Build the conic gradient string
        let conicGradientStops = '';
        let currentAngle = 0;

        // IMPORTANT: Use the data array in its original order
        // The pie slices will appear in the exact order provided by the user
        chartData.data.forEach((item, index) => {
            const percentage = (item.value / total) * 100;
            const color = this.colors[index % this.colors.length];

            // Calculate the angle for this slice
            const startAngle = currentAngle;
            const endAngle = currentAngle + percentage;

            // Add to the conic gradient string
            conicGradientStops += `${color} ${startAngle}%, ${color} ${endAngle}%, `;

            // Create legend item
            legendItems += `
                <div class="legend-item">
                    <span class="color-box" style="background-color: ${color}"></span>
                    <span class="legend-label">${item.label}: ${item.value} (${percentage.toFixed(1)}%)</span>
                </div>
            `;

            // Update the current angle for the next slice
            currentAngle = endAngle;
        });

        // Trim the trailing comma and space
        conicGradientStops = conicGradientStops.slice(0, -2);

       //console.log('DataViz: Generated conic gradient stops:', conicGradientStops);

        // Generate HTML for the chart with improved styling
        const chartHtml = `
        <style>
            .chart-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin: 0 auto;
                max-width: 100%;
                font-family: sans-serif;
            }
            
            .pie-container {
                width: 250px;
                height: 250px;
                position: relative;
                margin: 0 auto;
            }
            
            .pie-chart {
                width: 250px;
                height: 250px;
                border-radius: 50%;
                background: conic-gradient(${conicGradientStops});
                transform: rotate(-90deg);
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            
            .legend-container {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                justify-content: center;
                margin-top: 20px;
                width: 100%;
                padding: 10px;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                margin: 5px 10px;
                font-size: 13px;
            }
            
            .color-box {
                width: 15px;
                height: 15px;
                margin-right: 8px;
                border-radius: 2px;
                border: 1px solid rgba(0,0,0,0.2);
                flex-shrink: 0;
            }
            
            .legend-label {
                font-size: 13px;
                color: #333;
            }
            
            .chart-title {
                text-align: center;
                margin-bottom: 5px;
                font-size: 18px;
                font-weight: bold;
                color: #333;
            }
            </style>
            
            <div class="chart-container">
                <div class="chart-title">${chartData.title || Lang.get('datavizPieChart')}</div>
                
                <div class="pie-container">
                    <div class="pie-chart"></div>
                </div>
                
                <div class="legend-container">
                    ${legendItems}
                </div>
            </div>
        `;

        // Show the chart in a floating window
        this.showFloatingWindow(chartHtml);

       //console.log('DataViz: Pie chart rendering complete');
    }
    // Renders a bar chart (single or multi-series) using the provided chart data
    renderBarChart(chartData) {
       //console.log('DataViz: Bar chart data received:', JSON.stringify(chartData, null, 2));

        // Determine if we have single-series or multi-series data
        let isSingleSeries = chartData.data && Array.isArray(chartData.data);
        let isMultiSeries = chartData.series && Array.isArray(chartData.series);

       //console.log(`DataViz: Data format - Single Series: ${isSingleSeries}, Multi Series: ${isMultiSeries}`);

        if (!isSingleSeries && !isMultiSeries) {
            console.error('DataViz: Invalid chart data structure');
            return this.showFloatingWindow(`
            <div class="dataviz-error">
                <h3>${Lang.get('datavizErrorBarChart')}</h3>
                <p>${Lang.get('datavizErrorInvalidData', { errorType: Lang.get('datavizErrorMissingData') })}</p>
            </div>
        `);
        }

        // Generate bars and legend items
        let bars = '';
        let legendItems = '';

        if (isSingleSeries) {
            // Process single series format (original format)
           //console.log('DataViz: Processing single series data');

            // Find the maximum value for scaling
            const maxValue = Math.max(...chartData.data.map(item => Number(item.value) || 0));

            // Generate bars and legend items
            chartData.data.forEach((item, index) => {
                // Use 65% max height to ensure bars aren't too tall
                const height = (item.value / maxValue) * 65;
                const color = this.colors[index % this.colors.length];

                bars += `
                <div class="bar" style="height: ${height}%; background-color: ${color};">
                    <div class="bar-value">${item.value}</div>
                    <div class="bar-label">${item.label}</div>
                </div>`;

                legendItems += `
                <div class="legend-item">
                    <span class="color-box" style="background-color: ${color}"></span>
                    <span class="legend-label">${item.label}</span>
                </div>`;
            });
        } else {
            // Process multi-series format
           //console.log('DataViz: Processing multi-series data with', chartData.series.length, 'series');

            // For a single series in the multi-series format, display it as a normal bar chart
            if (chartData.series.length === 1 && chartData.series[0].data) {
               //console.log('DataViz: Single series in multi-series format - simplifying');

                const series = chartData.series[0];
                const maxValue = Math.max(...series.data.map(item => Number(item.value) || 0));

                series.data.forEach((item, index) => {
                    // Use 65% max height to ensure bars aren't too tall
                    const height = (item.value / maxValue) * 65;
                    const color = this.colors[index % this.colors.length];

                    bars += `
                    <div class="bar" style="height: ${height}%; background-color: ${color};">
                        <div class="bar-value">${item.value}</div>
                        <div class="bar-label">${item.label}</div>
                    </div>`;

                    legendItems += `
                    <div class="legend-item">
                        <span class="color-box" style="background-color: ${color}"></span>
                        <span class="legend-label">${item.label}</span>
                    </div>`;
                });
            } else {
               //console.log('DataViz: Multiple series detected - using advanced rendering');

                // Get all unique labels across all series
                const seenLabels = new Set();
                const uniqueOrderedLabels = [];

                // Process each series in the order provided
                chartData.series.forEach(series => {
                    if (series.data && Array.isArray(series.data)) {
                        // Process each data point in the order provided
                        series.data.forEach(item => {
                            if (item && item.label && !seenLabels.has(item.label)) {
                                uniqueOrderedLabels.push(item.label);
                                seenLabels.add(item.label);
                            }
                        });
                    }
                });

                // Use uniqueOrderedLabels instead of uniqueLabels in the rest of the method
                const uniqueLabels = uniqueOrderedLabels;
               //console.log('DataViz: Unique labels across all series:', uniqueLabels);

                // Calculate maximum value for scaling
                let maxValue = 0;
                chartData.series.forEach(series => {
                    if (series.data && Array.isArray(series.data)) {
                        const seriesMax = Math.max(...series.data.map(item => Number(item.value) || 0));
                        maxValue = Math.max(maxValue, seriesMax);
                    }
                });
               //console.log('DataViz: Max value across all series:', maxValue);

                // Calculate bar width and spacing
                const totalSeries = chartData.series.length;
                // Maintain double width - 60px minimum width for bars
                const barWidth = Math.max(60, Math.min(80, 150 / (uniqueLabels.length * totalSeries)));
                // Increased group spacing
                const groupWidth = (barWidth * totalSeries) + 60;

               //console.log(`DataViz: Bar dimensions - width: ${barWidth}px, group width: ${groupWidth}px`);

                // First, define series colors consistently
                const seriesColors = chartData.series.map((series, idx) => {
                    // Use specific colors for certain named series combinations
                    if (chartData.series[0].name === "Browser Market Share" &&
                        chartData.series.length > 1 &&
                        chartData.series[1].name === "Phone Use") {
                        return idx === 0 ? '#ef4444' : '#047857'; // Red for browsers, dark green for phones
                    }
                    // Otherwise use the default color palette
                    return this.colors[idx % this.colors.length];
                });

                // Generate the legend items first - using consistent colors
                chartData.series.forEach((series, seriesIndex) => {
                    const color = seriesColors[seriesIndex];
                    legendItems += `
                        <div class="legend-item">
                            <span class="color-box" style="background-color: ${color}"></span>
                            <span class="legend-label">${series.name || `Series ${seriesIndex + 1}`}</span>
                        </div>`;
                });

                // Start the bars container
                bars = '<div class="bar-groups-container">';

                // Generate the bars with the same consistent colors
                uniqueLabels.forEach(label => {
                    bars += `
                        <div class="bar-group" style="width: ${groupWidth}px; min-height: 250px; margin: 0 15px;">
                    `;

                    // Add each series bar within this group
                    chartData.series.forEach((series, seriesIndex) => {
                        if (!series.data || !Array.isArray(series.data)) {
                            console.warn(`DataViz: Invalid data for series ${seriesIndex}`);
                            return;
                        }

                        // Find item with this label in this series
                        const item = series.data.find(d => d && d.label === label);

                        // Use the consistently defined colors
                        const color = seriesColors[seriesIndex];

                       //console.log(`DataViz: For label "${label}", series ${seriesIndex} has item:`, item);

                        if (item) {
                            const value = Number(item.value) || 0;
                            // Use a more reasonable max scaling - cap at 65% to avoid cutoff at top
                            const height = Math.min(65, Math.max(1, (value / maxValue) * 65));

                           //console.log(`DataViz: Bar height for "${label}" in series ${seriesIndex}: ${height}%`);

                            // Add !important to ensure CSS rules aren't overridden
                            bars += `
                                <div class="bar" style="height: ${height}% !important; background-color: ${color}; width: ${barWidth}px; min-height: 4px; margin: 0 3px !important;">
                                    <div class="bar-value">${value}</div>
                                </div>
                            `;
                        } else {
                            // Empty placeholder for missing data
                            bars += `<div class="bar empty-bar" style="width: ${barWidth}px;"></div>`;
                        }
                    });

                    // Add label for this group
                    bars += `<div class="bar-group-label">${label}</div>`;
                    bars += '</div>';
                });

                bars += '</div>';
            }
        }

        // Update the CSS section in chartHtml to fix bar positioning and ensure tall bars are fully visible
        const chartHtml = `
    <style>
        .chart-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 0 auto;
            max-width: 100%;
            font-family: sans-serif;
            position: relative;
        }
        
        .bar-chart-container {
            width: 100%;
            height: 350px; /* INCREASED to 350px for taller bars */
            display: flex;
            align-items: flex-end;
            justify-content: center; 
            margin: 0px 0 20px 0; /* INCREASED top margin to 60px for taller values */
            border-bottom: 1px solid #ddd;
            position: relative;
            padding-bottom: 35px; /* Space for labels */
            overflow-x: auto; /* Horizontal scroll for many categories */
            

        }
        
        /* Ensure the container allows bars to sit on the bottom */
        .bar-groups-container {
            display: flex;
            align-items: flex-end; 
            justify-content: center; /* Center the groups */
            height: 100%;
            min-height: 200px;
            padding: 0 10px;
            width: 100%;
        }
        
        /* Fix bar groups to properly anchor at bottom */
        .bar-group {
            display: flex;
            align-items: flex-end !important; 
            justify-content: center;
            margin: 0 10px; /* Increased from 5px to 10px */
            position: relative;
            height: 100%; 
            padding-bottom: 25px; /* Reduced space for label to avoid gap */
        }
        
        /* Critical fix - make sure bars sit at the bottom */
        .bar {
            position: relative;
            margin: 0 7px; /* Increased from 5px to 7px */
            transition: height 0.5s ease;
            border-radius: 4px 4px 0 0;
            border: 1px solid rgba(0,0,0,0.2);
            border-bottom: 2px solid rgba(0,0,0,0.3);
            align-self: flex-end !important;
            bottom: 0 !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
            background-clip: padding-box;
            min-width: 50px; /* DOUBLE THICK BARS - 50px width */
            min-height: 4px;
        }
        
        .bar-group {
            outline: 1px dashed rgba(0,0,0,0.05);
        }
        
        .empty-bar {
            height: 0 !important;
            border: none !important;
            min-height: 0 !important;
            box-shadow: none !important;
        }
        
        .bar-label {
            position: absolute;
            bottom: -30px;
            width: 100%;
            text-align: center;
            font-size: 11px;
            white-space: nowrap;
            color: var(--chart-text, var(--text-color, #333)); /* Changed from hardcoded #000000 */
        }
        
        .bar-group-label {
            position: absolute;
            bottom: -20px; 
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            font-size: 11px;
            white-space: nowrap;
            max-width: 100%;
            color: var(--chart-text, var(--text-color, #333)); /* Changed from hardcoded #000000 */
            font-weight: bold;
        }
        
        /* Also update .bar-value for consistency */
        .bar-value {
            position: absolute;
            top: -30px;
            width: 100%;
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            color: var(--chart-text, var(--text-color, #333)); /* Changed from hardcoded #000000 */
            background: var(--chart-bg, var(--bg-color, rgba(255, 255, 255, 0.9))); /* Made background theme-aware */
            padding: 3px 0;
            border-radius: 3px;
            box-shadow: 0 0 3px rgba(0,0,0,0.1);
        }
                
        .legend-container {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
            margin-top: 20px;
            width: 100%;
            padding: 12px 8px;
            background-color: var(--chart-legend-bg, var(--background-secondary, rgba(0,0,0,0.02)));
            border-radius: 4px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            margin: 6px 12px;
            font-size: 13px;
            min-width: 120px; /* Added to maintain consistent sizing */
        }
        
        .color-box {
            width: 16px;
            height: 16px;
            min-width: 16px; /* Added to ensure consistent size */
            margin-right: 8px;
            border-radius: 3px;
            border: 1px solid var(--chart-plot-border, var(--border-color, rgba(0,0,0,0.2)));
                
        .legend-label {
            font-size: 13px;
            color: var(--chart-text, var(--text-color, #333));
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .chart-title {
            text-align: center;
            margin-bottom: 5px;
            font-size: 18px;
            font-weight: bold;
            color: var(--chart-title, var(--text-color, #333));
        }
    </style>
    
    <div class="chart-container">
        <div class="chart-title">${chartData.title || Lang.get('datavizBarChart')}</div>
        
        <div class="bar-chart-container">
            ${bars}
        </div>
        
        <div class="legend-container">
            ${legendItems}
        </div>
    </div>
    `;

        // Show the chart in a floating window
        this.showFloatingWindow(chartHtml);

       //console.log('DataViz: Bar chart rendering complete');
    }
    renderLineChart(chartData) {
       //console.log('DataViz: Line chart data received:', JSON.stringify(chartData, null, 2));

        // Check if we received data in simple format (data array) instead of line chart format (series array)
        const hasSimpleFormat = chartData.data && Array.isArray(chartData.data) && !chartData.series;

        // If we got simple data format, convert it to line chart format
        if (hasSimpleFormat) {
           //console.log('DataViz: Converting simple data array to line chart format');
            chartData = {
                title: chartData.title || 'Line Chart',
                xAxisLabel: 'Categories',
                yAxisLabel: 'Values',
                series: [
                    {
                        name: chartData.title || Lang.get('datavizDataSeries'),
                        data: chartData.data.map(item => ({
                            x: item.label,
                            y: item.value
                        }))
                    }
                ]
            };
        }

        // Now validate the (potentially converted) data
        if (!chartData.series || !Array.isArray(chartData.series) || chartData.series.length === 0) {
            console.error('DataViz: Invalid line chart data structure');
            return this.showFloatingWindow(`
             <div class="dataviz-error">
                 <h3>${Lang.get('datavizErrorLineChart')}</h3>
                 <p>${Lang.get('datavizErrorInvalidData', { errorType: Lang.get('datavizErrorEmptyData') })}</p>
             </div>
            `);
        }

        // Find the min/max values across all series for scaling
        let allXValues = [];
        let allYValues = [];

        chartData.series.forEach(series => {
            if (series.data && Array.isArray(series.data)) {
                series.data.forEach(point => {
                    if (point && point.x !== undefined && point.y !== undefined) {
                        allXValues.push(point.x);
                        allYValues.push(Number(point.y) || 0);
                    }
                });
            }
        });


        const uniqueOrderedXValues = [];
        const seenValues = new Set();
        allXValues.forEach(value => {
            if (!seenValues.has(value)) {
                uniqueOrderedXValues.push(value);
                seenValues.add(value);
            }
        });
        allXValues = uniqueOrderedXValues;

        const minY = Math.min(...allYValues);
        const maxY = Math.max(...allYValues);

        // Use a padding factor to avoid points touching edges
        const yPadding = (maxY - minY) * 0.1;
        const adjustedMinY = Math.max(0, minY - yPadding);
        const adjustedMaxY = maxY + yPadding;

       //console.log(`DataViz: Line chart value ranges - X: ${allXValues.length} values, Y: ${adjustedMinY} to ${adjustedMaxY}`);

        // Define chart dimensions with improved padding
        const chartWidth = 600;
        const chartHeight = 400;
        const yAxisWidth = 85; // Increased from 70px to 85px
        // Increase height for x-axis based on number of series to accommodate stacked labels
        const seriesCount = chartData.series ? chartData.series.length : 1;
        const xAxisLabelRowHeight = 20; // Height per series row
        const xAxisHeight = 80 + (seriesCount > 1 ? (seriesCount * xAxisLabelRowHeight) : 0);
        const plotWidth = chartWidth - yAxisWidth - 20;
        const plotHeight = chartHeight - xAxisHeight - 20;
        const topPadding = 20;

        // Generate series colors consistently
        const seriesColors = chartData.series.map((series, idx) => this.colors[idx % this.colors.length]);

        // Generate the SVG paths for each series
        let seriesPaths = [];
        let legendItems = '';

        chartData.series.forEach((series, seriesIndex) => {
            const color = seriesColors[seriesIndex];

            // Add to legend
            legendItems += `
                <div class="legend-item">
                    <span class="color-box" style="background-color: ${color}"></span>
                    <span class="legend-label">${series.name || `Series ${seriesIndex + 1}`}</span>
                </div>`;

            // Skip if no data points
            if (!series.data || !Array.isArray(series.data) || series.data.length === 0) {
                return;
            }

            // Sort data points by x value to ensure proper line connection
            const sortedData = [...series.data].sort((a, b) => {
                const xA = allXValues.indexOf(a.x);
                const xB = allXValues.indexOf(b.x);
                return xA - xB;
            });

            // Generate SVG path for the series
            let pathData = '';
            let pointsHtml = '';

            sortedData.forEach((point, pointIndex) => {
                // Calculate point position - adjusted for padding
                const xPos = yAxisWidth + (allXValues.indexOf(point.x) / (allXValues.length - 1 || 1)) * plotWidth;
                const yPos = topPadding + ((adjustedMaxY - Number(point.y)) / (adjustedMaxY - adjustedMinY || 1)) * plotHeight;

                // Start the path if it's the first point
                if (pointIndex === 0) {
                    pathData = `M ${xPos} ${yPos}`;
                } else {
                    pathData += ` L ${xPos} ${yPos}`;
                }

                // Add point markers
                pointsHtml += `
                    <circle 
                        cx="${xPos}" 
                        cy="${yPos}" 
                        r="4"
                        fill="${color}"
                        stroke="white"
                        stroke-width="1.5"
                        class="data-point"
                        data-series="${series.name || `Series ${seriesIndex + 1}`}"
                        data-x="${point.x}"
                        data-y="${point.y}"
                    />
                `;
            });

            // Add series path to the array
            seriesPaths.push({
                path: pathData,
                color: color,
                points: pointsHtml
            });
        });

        // Generate Y-axis tick marks and labels
        const yAxisTicks = 5; // Number of tick marks
        let yAxisTicksHtml = '';

        // Add background rectangle for plot area - adjusted for padding
        const backgroundRect = `
            <rect 
                x="${yAxisWidth}" 
                y="${topPadding}" 
                width="${plotWidth}" 
                height="${plotHeight}" 
                fill="#f8f9fa" 
                stroke="#e9ecef" 
                stroke-width="1"
            />
        `;

        for (let i = 0; i <= yAxisTicks; i++) {
            const yValue = adjustedMinY + (adjustedMaxY - adjustedMinY) * (i / yAxisTicks);
            const yPos = topPadding + ((adjustedMaxY - yValue) / (adjustedMaxY - adjustedMinY)) * plotHeight;

            yAxisTicksHtml += `
                <line 
                    x1="${yAxisWidth - 5}" 
                    y1="${yPos}" 
                    x2="${yAxisWidth + plotWidth}" 
                    y2="${yPos}" 
                    stroke="${i === 0 ? '#adb5bd' : '#dee2e6'}" 
                    stroke-dasharray="${i === 0 ? 'none' : '3,3'}"
                    stroke-width="${i === 0 ? 1 : 0.5}" 
                />
                <text 
                    x="${yAxisWidth - 10}" 
                    y="${yPos}" 
                    text-anchor="end" 
                    dominant-baseline="middle" 
                    class="axis-label"
                >
                    ${Math.round(yValue * 10) / 10}
                </text>
            `;
        }

        // Vertical axis line - adjusted for padding
        const yAxisLine = `
            <line 
                x1="${yAxisWidth}" 
                y1="${topPadding}" 
                x2="${yAxisWidth}" 
                y2="${topPadding + plotHeight}" 
                stroke="#adb5bd" 
                stroke-width="1" 
            />
        `;
        const xAxisLine = `
        <line 
            x1="${yAxisWidth}" 
            y1="${topPadding + plotHeight}" 
            x2="${yAxisWidth + plotWidth}" 
            y2="${topPadding + plotHeight}" 
            stroke="#adb5bd" 
            stroke-width="1" 
        />
    `;
        // Generate X-axis tick marks and labels - now below the chart
        let xAxisTicksHtml = '';

        if (seriesCount === 1) {
            // First draw the tick lines and labels (standard way)
            allXValues.forEach((xValue, i) => {
                const xPos = yAxisWidth + (i / (allXValues.length - 1 || 1)) * plotWidth;

                xAxisTicksHtml += `
                    <line 
                        x1="${xPos}" 
                        y1="${topPadding + plotHeight}" 
                        x2="${xPos}" 
                        y2="${topPadding + plotHeight + 5}" 
                        stroke="#adb5bd" 
                        stroke-width="1" 
                    />
                    <text 
                        x="${xPos}" 
                        y="${topPadding + plotHeight + 25}" 
                        text-anchor="middle" 
                        font-weight="bold"
                        class="axis-label"
                    >
                        ${xValue}
                    </text>
                `;
            });
        } else {
            // For multiple series, only draw tick marks but not the default labels
            allXValues.forEach((xValue, i) => {
                const xPos = yAxisWidth + (i / (allXValues.length - 1 || 1)) * plotWidth;

                // Just draw the tick mark without the label
                xAxisTicksHtml += `
                    <line 
                        x1="${xPos}" 
                        y1="${topPadding + plotHeight}" 
                        x2="${xPos}" 
                        y2="${topPadding + plotHeight + 5}" 
                        stroke="#adb5bd" 
                        stroke-width="1" 
                    />
                `;
            });

            // Now add the series-specific rows
            chartData.series.forEach((series, seriesIndex) => {
                if (!series.data || !Array.isArray(series.data) || series.data.length === 0) return;

                const color = seriesColors[seriesIndex];
                // Adjust vertical position - move up slightly since we don't have default labels anymore
                const yOffset = topPadding + plotHeight + 20 + (seriesIndex * xAxisLabelRowHeight);

                // Add series name at the beginning of the row
                xAxisTicksHtml += `
                    <text 
                        x="${yAxisWidth - 30}" 
                        y="${yOffset}" 
                        text-anchor="end" 
                        fill="${color}"
                        font-weight="bold"
                        class="axis-label"
                    >
                        ${series.name || `Series ${seriesIndex + 1}`}:
                    </text>
                `;

                // Add each x-value label for this series
                series.data.forEach(point => {
                    const xIndex = allXValues.indexOf(point.x);
                    if (xIndex !== -1) {
                        const xPos = yAxisWidth + (xIndex / (allXValues.length - 1 || 1)) * plotWidth;

                        xAxisTicksHtml += `
                        <text 
                            x="${xPos}" 
                            y="${yOffset}" 
                            text-anchor="middle"
                            fill="${color}"
                            class="axis-label x-value-label"
                            style="fill: ${color}; color: ${color}; font-weight: 500;"
                        >
                            ${point.x}
                        </text>
                    `;
                    }
                });
            });
        }

        // Update the CSS for the chart to support the new axis label format
        const chartHtml = `
        <style>
            .chart-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin: 0 auto;
                max-width: 100%;
                font-family: sans-serif;
            }
            
            .line-chart-container {
                width: ${chartWidth}px;
                height: ${chartHeight}px;
                position: relative;
                margin: 20px auto;
                overflow: visible;
            }
            .x-value-label {
                font-size: 11px;
                font-weight: normal;
            }
            .axis-label {
                font-size: 11px;
                fill: #666;
            }
            
            .series-value {
                font-size: 10px;
            }
            
            .legend-container {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                justify-content: center;
                margin-top: 10px;
                width: 100%;
                padding: 8px;
                background-color: rgba(0,0,0,0.02);
                border-radius: 4px;
                ${seriesCount > 1 ? 'margin-top: 20px;' : ''}
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                margin: 5px 10px;
                font-size: 13px;
                color: #333;
            }
            
            .color-box {
                width: 15px;
                height: 15px;
                margin-right: 8px;
                border-radius: 2px;
                border: 1px solid rgba(0,0,0,0.2);
            }
            
            .chart-title {
                text-align: center;
                margin-bottom: 15px;
                font-size: 18px;
                font-weight: bold;
                color: #333;
            }
            
            .line-path {
                fill: none;
                stroke-width: 2.5;
                stroke-linecap: round;
                stroke-linejoin: round;
            }
            
            .data-point {
                cursor: pointer;
                transition: r 0.2s ease;
            }
            
            .data-point:hover {
                r: 6;
            }
            
            .tooltip {
                position: absolute;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 12px;
                pointer-events: none;
                z-index: 10;
                display: none;
            }
            
            .axis-labels {
                width: 100%;
                text-align: center;
                margin-top: 10px;
                font-size: 14px;
                color: #555;
            }
            
            .y-axis-title {
                position: absolute;
                left: -30px;
                top: ${topPadding + plotHeight / 2}px;
                transform: translateY(-50%) rotate(-90deg);
                font-size: 12px;
                color: #666;
            }
            
            .x-axis-title {
                position: absolute;
                bottom: 5px;
                left: ${yAxisWidth + plotWidth / 2}px;
                transform: translateX(-50%);
                font-size: 12px;
                color: #666;
            }
        </style>
        
        <div class="chart-container">
            <div class="chart-title">${chartData.title || Lang.get('datavizLineChart')}</div>
            
            <div class="line-chart-container">
                <div class="y-axis-title">${chartData.yAxisLabel || Lang.get('datavizYValues')}</div>
                
                <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}">
                    <!-- Background rectangle -->
                    ${backgroundRect}
                    
                    <!-- Y-axis ticks and grid lines -->
                    ${yAxisTicksHtml}
                    ${yAxisLine}
                    
                    <!-- X-axis ticks and labels -->
                    ${xAxisLine}
                    ${xAxisTicksHtml}
                    
                    <!-- Series paths -->
                    ${seriesPaths.map(series => `
                        <path 
                            d="${series.path}" 
                            stroke="${series.color}" 
                            class="line-path" 
                        />
                    `).join('')}
                    
                    <!-- Data points (circles) -->
                    ${seriesPaths.map(series => series.points).join('')}
                </svg>
                
                <div class="x-axis-title">${chartData.xAxisLabel || Lang.get('datavizXValues')}</div>
                <div class="tooltip"></div>
            </div>
            
            <div class="legend-container">
                ${legendItems}
            </div>
        </div>
        
        <script>
            // Add tooltip functionality
            document.querySelectorAll('.data-point').forEach(point => {
                point.addEventListener('mouseover', function(e) {
                    const tooltip = document.querySelector('.tooltip');
                    tooltip.innerHTML = \`
                        <strong>\${this.getAttribute('data-series')}</strong><br>
                        \${this.getAttribute('data-x')}: \${this.getAttribute('data-y')}
                    \`;
                    tooltip.style.left = (e.pageX + 10) + 'px';
                    tooltip.style.top = (e.pageY - 30) + 'px';
                    tooltip.style.display = 'block';
                });
                
                point.addEventListener('mouseout', function() {
                    document.querySelector('.tooltip').style.display = 'none';
                });
            });
        </script>
        `;

        // Show the chart in a floating window with adjusted width
        this.showFloatingWindow(chartHtml);

        // Also update the showFloatingWindow method to make line charts full width
        const floatingWindow = document.querySelector('.dataviz-floating-window');
        if (floatingWindow && chartHtml.includes('line-chart-container')) {
            floatingWindow.style.width = '650px'; // Ensure enough width for line charts
            floatingWindow.style.maxWidth = '95vw';
        }

       //console.log('DataViz: Line chart rendering complete');
    }
    // Renders a scatter plot using the provided chart data
    renderScatterPlot(chartData) {
       //console.log('DataViz: Scatter plot data received:', JSON.stringify(chartData, null, 2));

        // Check if we received data in simple format (data array) instead of series format
        const hasSimpleFormat = chartData.data && Array.isArray(chartData.data) && !chartData.series;

        // If we got simple data format, convert it to series format
        if (hasSimpleFormat) {
           //console.log('DataViz: Converting simple data array to scatter plot format');
            chartData = {
                title: chartData.title || Lang.get('datavizScatterPlot'),
                xAxisLabel: chartData.xAxisLabel || Lang.get('datavizXValues'),
                yAxisLabel: chartData.yAxisLabel || Lang.get('datavizYValues'),
                series: [
                    {
                        name: chartData.title || Lang.get('datavizDataPoints'),
                        data: chartData.data.map(item => ({
                            x: item.x || 0,
                            y: item.y || 0,
                            label: item.label || ''
                        }))
                    }
                ]
            };
        }

        // Now validate the (potentially converted) data
        if (!chartData.series || !Array.isArray(chartData.series) || chartData.series.length === 0) {
            console.error('DataViz: Invalid scatter plot data structure');
            return this.showFloatingWindow(`
            <div class="dataviz-error">
                <h3>${Lang.get('datavizErrorScatterPlot')}</h3>
                <p>${Lang.get('datavizErrorInvalidData', { errorType: Lang.get('datavizErrorEmptyData') })}</p>
            </div>
        `);
        }

        // SPECIAL CASE: Check if we have two datasets with one-dimensional data (like your example)
        const hasTwoCategoricalDatasets = chartData.series.length === 2 &&
            chartData.series[0].data?.some(point => point.y === 0) &&
            chartData.series[1].data?.some(point => point.x === 0);

        if (hasTwoCategoricalDatasets) {
           //console.log('DataViz: Detected two categorical datasets - converting to meaningful scatter plot');

            // Extract series names
            const xSeriesName = chartData.series[0].name || 'Series 1';
            const ySeriesName = chartData.series[1].name || 'Series 2';

            // Create a new combined dataset for proper scatter plot
            const combinedData = [];

            // Find all unique labels for first series (X axis)
            const xLabels = chartData.series[0].data
                .filter(point => point && point.label)
                .map(point => point.label);

            // Find all unique labels for second series (Y axis)
            const yLabels = chartData.series[1].data
                .filter(point => point && point.label)
                .map(point => point.label);

            // Create a grid of points by creating a cartesian product of the two datasets
            xLabels.forEach((xLabel, xi) => {
                // Find x-value percentage
                const xPoint = chartData.series[0].data.find(p => p.label === xLabel);
                const xValue = xPoint ? Number(xPoint.x) : 0;

                if (xValue > 0) { // Only process points with non-zero values
                    yLabels.forEach((yLabel, yi) => {
                        // Find y-value percentage
                        const yPoint = chartData.series[1].data.find(p => p.label === yLabel);
                        const yValue = yPoint ? Number(yPoint.y) : 0;

                        if (yValue > 0) { // Only process points with non-zero values
                            combinedData.push({
                                x: xValue,
                                y: yValue,
                                label: `${xLabel} / ${yLabel}`,
                                xLabel: xLabel,
                                yLabel: yLabel
                            });
                        }
                    });
                }
            });

            // Replace with transformed data
            chartData = {
                title: `${xSeriesName} vs ${ySeriesName}`,
                xAxisLabel: xSeriesName,
                yAxisLabel: ySeriesName,
                series: [
                    {
                        name: Lang.get('datavizCombinedData'),
                        data: combinedData
                    }
                ]
            };

           //console.log('DataViz: Transformed data for better visualization:', chartData);
        }

        // Find the min/max values across all series for proper scaling
        let allXValues = [];
        let allYValues = [];
        let hasLabels = false;

        // Collect all x and y values while maintaining original order
        chartData.series.forEach(series => {
            if (series.data && Array.isArray(series.data)) {
                series.data.forEach(point => {
                    if (point) {
                        const x = Number(point.x) || 0;
                        const y = Number(point.y) || 0;
                        allXValues.push(x);
                        allYValues.push(y);
                        if (point.label) hasLabels = true;
                    }
                });
            }
        });
        // Create ordered unique lists that preserve original order
        const uniqueOrderedXValues = [];
        const uniqueOrderedYValues = [];
        const seenXValues = new Set();
        const seenYValues = new Set();

        // Preserve first occurrence order for X values
        allXValues.forEach(value => {
            if (!seenXValues.has(value)) {
                uniqueOrderedXValues.push(value);
                seenXValues.add(value);
            }
        });

        // Preserve first occurrence order for Y values
        allYValues.forEach(value => {
            if (!seenYValues.has(value)) {
                uniqueOrderedYValues.push(value);
                seenYValues.add(value);
            }
        });

        // Calculate min/max for scaling
        const minX = Math.min(...uniqueOrderedXValues);
        const maxX = Math.max(...uniqueOrderedXValues);
        const minY = Math.min(...uniqueOrderedYValues);
        const maxY = Math.max(...uniqueOrderedYValues);
        // Add padding to avoid points touching the edges
        const xPadding = Math.max(0.1, (maxX - minX) * 0.1);
        const yPadding = Math.max(0.1, (maxY - minY) * 0.1);

        const adjustedMinX = Math.max(0, minX - xPadding); // Ensure non-negative
        const adjustedMaxX = maxX + xPadding;
        const adjustedMinY = Math.max(0, minY - yPadding); // Ensure non-negative
        const adjustedMaxY = maxY + yPadding;

       //console.log(`DataViz: Scatter plot value ranges - X: ${adjustedMinX} to ${adjustedMaxX}, Y: ${adjustedMinY} to ${adjustedMaxY}`);

        // Define chart dimensions
        const chartWidth = 650;
        const chartHeight = 400;
        const yAxisWidth = 60;
        const xAxisHeight = 60;
        const plotWidth = chartWidth - yAxisWidth - 20;
        const plotHeight = chartHeight - xAxisHeight - 20;
        const topPadding = 20;

        // Generate series colors consistently
        const seriesColors = chartData.series.map((series, idx) => this.colors[idx % this.colors.length]);

        // Generate the SVG elements for each series
        let seriesPoints = [];
        let legendItems = '';

        chartData.series.forEach((series, seriesIndex) => {
            const color = seriesColors[seriesIndex];

            // Add to legend
            legendItems += `
                <div class="legend-item">
                    <span class="color-box" style="background-color: ${color}"></span>
                    <span class="legend-label">${series.name || `Series ${seriesIndex + 1}`}</span>
                </div>`;

            // Skip if no data points
            if (!series.data || !Array.isArray(series.data) || series.data.length === 0) {
                return;
            }

            // For combined datasets, scale point sizes based on values
            const useVariablePointSizes = hasTwoCategoricalDatasets || series.data.some(p => p.xLabel && p.yLabel);
            const minPointRadius = 4;
            const maxPointRadius = 12;

            // Generate points HTML
            let pointsHtml = '';

            series.data.forEach((point, pointIndex) => {
                if (!point) return;

                const x = Number(point.x) || 0;
                const y = Number(point.y) || 0;
                const label = point.label || '';
                const xLabel = point.xLabel || '';
                const yLabel = point.yLabel || '';

                // Calculate point radius - larger values get larger circles
                let pointRadius = minPointRadius;

                if (useVariablePointSizes) {
                    const scaleFactor = Math.min((x + y) / 100, 1); // Scale based on combined value
                    pointRadius = minPointRadius + (maxPointRadius - minPointRadius) * scaleFactor;
                }

                // Calculate point position in the plot area
                const xPos = yAxisWidth + ((x - adjustedMinX) / (adjustedMaxX - adjustedMinX)) * plotWidth;
                const yPos = topPadding + (1 - ((y - adjustedMinY) / (adjustedMaxY - adjustedMinY))) * plotHeight;

                pointsHtml += `
                    <circle 
                        cx="${xPos}" 
                        cy="${yPos}" 
                        r="${pointRadius}"
                        fill="${color}"
                        fill-opacity="0.7"
                        stroke="${color}"
                        stroke-width="1.5"
                        class="data-point"
                        data-series="${series.name || `Series ${seriesIndex + 1}`}"
                        data-x="${x}"
                        data-y="${y}"
                        data-label="${label}"
                        data-x-label="${xLabel}"
                        data-y-label="${yLabel}"
                    />
                `;

                // Add text labels for significant points
                if (useVariablePointSizes && (x > maxX * 0.7 || y > maxY * 0.7)) {
                    pointsHtml += `
                        <text
                            x="${xPos}"
                            y="${yPos - pointRadius - 5}"
                            text-anchor="middle"
                            class="point-label"
                            font-size="11"
                            fill="#333"
                        >
                            ${xLabel || yLabel || label}
                        </text>
                    `;
                }
            });

            // Add series points to the array
            seriesPoints.push({
                points: pointsHtml,
                color: color
            });
        });

        // Generate Y-axis tick marks and labels
        const yAxisTicks = 5; // Number of tick marks
        let yAxisTicksHtml = '';

        // Add background rectangle for plot area
        const backgroundRect = `
            <rect 
                x="${yAxisWidth}" 
                y="${topPadding}" 
                width="${plotWidth}" 
                height="${plotHeight}" 
                fill="#f8f9fa" 
                stroke="#e9ecef" 
                stroke-width="1"
            />
        `;

        for (let i = 0; i <= yAxisTicks; i++) {
            const yValue = adjustedMinY + (adjustedMaxY - adjustedMinY) * (i / yAxisTicks);
            const yPos = topPadding + ((adjustedMaxY - yValue) / (adjustedMaxY - adjustedMinY)) * plotHeight;
            const formattedValue = Number.isInteger(yValue) ? yValue : yValue.toFixed(1);

            yAxisTicksHtml += `
                <line 
                    x1="${yAxisWidth - 5}" 
                    y1="${yPos}" 
                    x2="${yAxisWidth + plotWidth}" 
                    y2="${yPos}" 
                    stroke="${i === 0 ? '#adb5bd' : '#dee2e6'}" 
                    stroke-dasharray="${i === 0 ? 'none' : '3,3'}"
                    stroke-width="${i === 0 ? 1 : 0.5}" 
                />
                <text 
                    x="${yAxisWidth - 10}" 
                    y="${yPos}" 
                    text-anchor="end" 
                    dominant-baseline="middle" 
                    class="axis-label"
                >
                    ${formattedValue}${hasTwoCategoricalDatasets ? '%' : ''}
                </text>
            `;
        }

        // Generate X-axis tick marks and labels
        const xAxisTicks = 5;
        let xAxisTicksHtml = '';

        for (let i = 0; i <= xAxisTicks; i++) {
            const xValue = adjustedMinX + (adjustedMaxX - adjustedMinX) * (i / xAxisTicks);
            const xPos = yAxisWidth + (i / xAxisTicks) * plotWidth;
            const formattedValue = Number.isInteger(xValue) ? xValue : xValue.toFixed(1);

            xAxisTicksHtml += `
            <line 
                x1="${xPos}" 
                y1="${topPadding + plotHeight}" 
                x2="${xPos}" 
                y2="${topPadding + plotHeight + 5}" 
                stroke="#adb5bd" 
                stroke-width="1" 
            />
            <text 
                x="${xPos}" 
                y="${topPadding + plotHeight + 20}" 
                text-anchor="middle" 
                class="axis-label"
            >
                ${formattedValue}${hasTwoCategoricalDatasets ? '%' : ''}
            </text>
        `;
        }

        // Vertical axis line
        const yAxisLine = `
            <line 
                x1="${yAxisWidth}" 
                y1="${topPadding}" 
                x2="${yAxisWidth}" 
                y2="${topPadding + plotHeight}" 
                stroke="#adb5bd" 
                stroke-width="1" 
            />
        `;

        // Horizontal axis line
        const xAxisLine = `
            <line 
                x1="${yAxisWidth}" 
                y1="${topPadding + plotHeight}" 
                x2="${yAxisWidth + plotWidth}" 
                y2="${topPadding + plotHeight}" 
                stroke="#adb5bd" 
                stroke-width="1" 
            />
        `;

        const chartHtml = `
        <style>
            .chart-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin: 0 auto;
                max-width: 100%;
                font-family: sans-serif;
            }
            
            .scatter-plot-container {
                width: ${chartWidth}px;
                height: ${chartHeight}px;
                position: relative;
                margin: 20px auto;
                overflow: visible;
            }
            
            .axis-label {
                font-size: 11px;
                fill: #666;
            }
            
            .legend-container {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                justify-content: center;
                margin-top: 10px;
                width: 100%;
                padding: 8px;
                background-color: rgba(0,0,0,0.02);
                border-radius: 4px;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                margin: 5px 10px;
                font-size: 13px;
                color: #333;
            }
            
            .color-box {
                width: 15px;
                height: 15px;
                margin-right: 8px;
                border-radius: 2px;
                border: 1px solid rgba(0,0,0,0.2);
            }
            
            .chart-title {
                text-align: center;
                margin-bottom: 15px;
                font-size: 18px;
                font-weight: bold;
                color: #333;
            }
            
            .data-point {
                cursor: pointer;
                transition: r 0.2s ease;
            }
            
            .data-point:hover {
                stroke-width: 2;
                fill-opacity: 0.9;
            }
            
            .tooltip {
                position: absolute;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 12px;
                pointer-events: none;
                z-index: 10;
                display: none;
            }
            
            .axis-labels {
                width: 100%;
                text-align: center;
                margin-top: 10px;
                font-size: 14px;
                color: #555;
            }
            
            .y-axis-title {
                position: absolute;
                left: -60px; /* Change from -30px to -50px */
                top: ${topPadding + plotHeight / 2}px;
                transform: translateY(-50%) rotate(-90deg);
                font-size: 12px;
                color: #666;
            }
            
            .x-axis-title {
                position: absolute;
                bottom: 5px;
                left: ${yAxisWidth + plotWidth / 2}px;
                transform: translateX(-50%);
                font-size: 12px;
                color: #666;
            }
            
            .point-label {
                pointer-events: none;
                text-shadow: 0 0 2px white, 0 0 2px white, 0 0 2px white, 0 0 2px white;
            }
        </style>
        
        <div class="chart-container">
            <div class="chart-title">${chartData.title || Lang.get('datavizScatterPlot')}</div>
            
            <div class="scatter-plot-container">
                <div class="y-axis-title">${chartData.yAxisLabel || Lang.get('datavizYValues')}</div>
                
                <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}">
                    <!-- Background rectangle -->
                    ${backgroundRect}
                    
                    <!-- Y-axis ticks and grid lines -->
                    ${yAxisTicksHtml}
                    ${yAxisLine}
                    
                    <!-- X-axis ticks and labels -->
                    ${xAxisLine}
                    ${xAxisTicksHtml}
                    
                    <!-- Data points (circles) -->
                    ${seriesPoints.map(series => series.points).join('')}
                </svg>
                
                <div class="x-axis-title">${chartData.xAxisLabel || Lang.get('datavizXValues')}</div>
                <div class="tooltip"></div>
            </div>
            
            <div class="legend-container">
                ${legendItems}
            </div>
        </div>
        
        <script>
            // Add tooltip functionality
            document.querySelectorAll('.data-point').forEach(point => {
                point.addEventListener('mouseover', function(e) {
                    const tooltip = document.querySelector('.tooltip');
                    const series = this.getAttribute('data-series');
                    const x = this.getAttribute('data-x');
                    const y = this.getAttribute('data-y');
                    const label = this.getAttribute('data-label');
                    const xLabel = this.getAttribute('data-x-label');
                    const yLabel = this.getAttribute('data-y-label');
                    
                    let tooltipContent = \`<strong>\${series}</strong><br>\`;
                    
                    if (xLabel && yLabel) {
                        tooltipContent += \`\${xLabel}: \${x}%, \${yLabel}: \${y}%\`;
                    } else {
                        tooltipContent += \`X: \${x}, Y: \${y}\`;
                    }
                    
                    if (label && label !== xLabel && label !== yLabel) {
                        tooltipContent += \`<br>\${label}\`;
                    }
                    
                    tooltip.innerHTML = tooltipContent;
                    tooltip.style.left = (e.pageX + 10) + 'px';
                    tooltip.style.top = (e.pageY - 30) + 'px';
                    tooltip.style.display = 'block';
                });
                
                point.addEventListener('mouseout', function() {
                    document.querySelector('.tooltip').style.display = 'none';
                });
            });
        </script>
        `;

        // Show the chart in a floating window with adjusted width
        this.showFloatingWindow(chartHtml);

        // Make sure the window is wide enough for scatter plots
        const floatingWindow = document.querySelector('.dataviz-floating-window');
        if (floatingWindow) {
            floatingWindow.style.width = '700px';
            floatingWindow.style.maxWidth = '95vw';
        }

       //console.log('DataViz: Scatter plot rendering complete');
    }
    renderAreaChart(chartData) {
       //console.log('DataViz: Area chart data received:', JSON.stringify(chartData, null, 2));

        // Check if we received data in simple format (data array) instead of series format
        const hasSimpleFormat = chartData.data && Array.isArray(chartData.data) && !chartData.series;

        // If we got simple data format, convert it to series format
        if (hasSimpleFormat) {
           //console.log('DataViz: Converting simple data array to area chart format');
            chartData = {
                title: chartData.title || Lang.get('datavizAreaChart'),
                xAxisLabel: 'Categories',
                yAxisLabel: 'Values',
                series: [
                    {
                        name: chartData.title || 'Data Series',
                        data: chartData.data.map(item => ({
                            x: item.label,
                            y: item.value
                        }))
                    }
                ]
            };
        }

        // Now validate the (potentially converted) data
        if (!chartData.series || !Array.isArray(chartData.series) || chartData.series.length === 0) {
            console.error('DataViz: Invalid area chart data structure');
            return this.showFloatingWindow(`
            <div class="dataviz-error">
                <h3>${Lang.get('datavizErrorAreaChart')}</h3>
                <p>${Lang.get('datavizErrorInvalidData', { errorType: Lang.get('datavizErrorEmptyData') })}</p>
            </div>
        `);
        }

        // Check if this is a stacked area chart
        const isStacked = chartData.stacked === true;
        const isPercentage = chartData.percentage === true;

       //console.log(`DataViz: Chart type - Stacked: ${isStacked}, Percentage: ${isPercentage}`);

        // Find the min/max values across all series for scaling
        let allXValues = [];
        let allYValues = [];
        let stackedYValues = {}; // For storing cumulative y values at each x position

        chartData.series.forEach(series => {
            if (series.data && Array.isArray(series.data)) {
                series.data.forEach(point => {
                    if (point && point.x !== undefined && point.y !== undefined) {
                        allXValues.push(point.x);

                        // For stacked charts, we need to track cumulative values
                        if (isStacked) {
                            if (!stackedYValues[point.x]) {
                                stackedYValues[point.x] = 0;
                            }
                            stackedYValues[point.x] += Number(point.y) || 0;
                            allYValues.push(stackedYValues[point.x]);
                        } else {
                            allYValues.push(Number(point.y) || 0);
                        }
                    }
                });
            }
        });

        // Get unique sorted X values
        allXValues = [...new Set(allXValues)].sort();

        // For percentage charts, we need to normalize the data to make each stack sum to 100%
        if (isPercentage && isStacked) {
            // First, calculate total at each x position
            const totals = {};
            allXValues.forEach(x => {
                totals[x] = 0;
                chartData.series.forEach(series => {
                    const point = series.data.find(p => p.x === x);
                    if (point) {
                        totals[x] += Number(point.y) || 0;
                    }
                });
            });

            // Then normalize each value
            chartData.series.forEach(series => {
                series.data.forEach(point => {
                    if (totals[point.x] > 0) {
                        point.originalY = point.y; // Store original value
                        point.y = (point.y / totals[point.x]) * 100;
                    }
                });
            });

            // Update allYValues for proper scaling
            allYValues = isStacked ? [100] : allYValues.map(y => Math.min(100, y));
        }

        const minY = Math.min(...allYValues, 0); // Ensure we include 0
        const maxY = Math.max(...allYValues);

        // For percentage charts, use exact 0-100 range without padding
        // For regular charts, add padding to avoid points touching edges
        let adjustedMinY, adjustedMaxY;
        if (isPercentage) {
            adjustedMinY = 0;
            adjustedMaxY = 100;
        } else {
            const yPadding = (maxY - minY) * 0.1;
            adjustedMinY = Math.max(0, minY - yPadding); // Ensure non-negative
            adjustedMaxY = maxY + yPadding;
        }

       //console.log(`DataViz: Area chart value ranges - X: ${allXValues.length} values, Y: ${adjustedMinY} to ${adjustedMaxY}`);

        // Define chart dimensions
        const chartWidth = 650;
        const chartHeight = 400;
        const yAxisWidth = 70;
        const xAxisHeight = 60;
        const plotWidth = chartWidth - yAxisWidth - 20;
        const plotHeight = chartHeight - xAxisHeight - 20;
        const topPadding = 20;

        // Generate series colors consistently with semi-transparency for fills
        const seriesColors = chartData.series.map((series, idx) => {
            const baseColor = series.fillColor || this.colors[idx % this.colors.length];
            // If color already has transparency, use it as is
            if (baseColor.includes('rgba') || baseColor.includes('#') && baseColor.length > 7) {
                return baseColor;
            }
            // Otherwise add 50% transparency
            if (baseColor.startsWith('#')) {
                return `${baseColor}80`; // Add 50% alpha
            } else {
                // For named colors or rgb, convert to rgba
                return baseColor.replace('rgb(', 'rgba(').replace(')', ', 0.5)');
            }
        });

        // Generate the SVG paths for each series
        let seriesPaths = [];
        let legendItems = '';

        // Process series in reverse for stacked charts so first series is on top visually
        const seriesToProcess = isStacked ? [...chartData.series].reverse() : chartData.series;

        seriesToProcess.forEach((series, seriesIndex) => {
            const actualIndex = isStacked ? chartData.series.length - 1 - seriesIndex : seriesIndex;
            const color = seriesColors[actualIndex];
            const strokeColor = series.fillColor || this.colors[actualIndex % this.colors.length];

            // Add to legend (use actual index for legend ordering)
            legendItems = `
                <div class="legend-item">
                    <span class="color-box" style="background-color: ${strokeColor}"></span>
                    <span class="legend-label">${series.name || `Series ${actualIndex + 1}`}</span>
                </div>
            ` + legendItems; // Prepend for stacked charts to match visual order

            // Skip if no data points
            if (!series.data || !Array.isArray(series.data) || series.data.length === 0) {
                return;
            }

            // Sort data points by x value to ensure proper connection
            const sortedData = [...series.data].sort((a, b) => {
                const xA = allXValues.indexOf(a.x);
                const xB = allXValues.indexOf(b.x);
                return xA - xB;
            });

            // Generate SVG path for the series
            let pathData = '';
            let areaPathData = '';
            let pointsHtml = '';

            // For stacked charts, we need to calculate cumulative values
            let stackedValues = {};
            if (isStacked && actualIndex < chartData.series.length - 1) {
                // Skip this for the first series (bottom of stack)
                // Calculate stacked values from previous series
                for (let i = actualIndex + 1; i < chartData.series.length; i++) {
                    const prevSeries = chartData.series[i];
                    prevSeries.data.forEach(point => {
                        if (!stackedValues[point.x]) {
                            stackedValues[point.x] = 0;
                        }
                        stackedValues[point.x] += Number(point.y) || 0;
                    });
                }
            }

            sortedData.forEach((point, pointIndex) => {
                const x = point.x;
                const y = Number(point.y) || 0;
                const stackedY = (isStacked && stackedValues[x]) ? y + stackedValues[x] : y;

                // Calculate point position - adjusted for padding
                const xPos = yAxisWidth + (allXValues.indexOf(x) / (allXValues.length - 1 || 1)) * plotWidth;
                const yPos = topPadding + ((adjustedMaxY - stackedY) / (adjustedMaxY - adjustedMinY || 1)) * plotHeight;
                const baselineYPos = isStacked && stackedValues[x] ?
                    topPadding + ((adjustedMaxY - stackedValues[x]) / (adjustedMaxY - adjustedMinY || 1)) * plotHeight :
                    topPadding + plotHeight; // Bottom of chart for non-stacked

                // Start the path if it's the first point
                if (pointIndex === 0) {
                    pathData = `M ${xPos} ${yPos}`;
                    areaPathData = `M ${xPos} ${baselineYPos} L ${xPos} ${yPos}`;
                } else {
                    pathData += ` L ${xPos} ${yPos}`;
                    areaPathData += ` L ${xPos} ${yPos}`;
                }

                // Add point markers
                pointsHtml += `
                    <circle 
                        cx="${xPos}" 
                        cy="${yPos}" 
                        r="3.5"
                        fill="white"
                        stroke="${strokeColor}"
                        stroke-width="1.5"
                        class="data-point"
                        data-series="${series.name || `Series ${actualIndex + 1}`}"
                        data-x="${x}"
                        data-y="${isPercentage && point.originalY ? point.originalY : y}"
                        data-stacked-y="${stackedY}"
                        data-percent="${isPercentage ? 'true' : 'false'}"
                    />
                `;
            });

            // Close the area path
            if (sortedData.length > 0) {
                const lastX = yAxisWidth + (allXValues.indexOf(sortedData[sortedData.length - 1].x) / (allXValues.length - 1 || 1)) * plotWidth;
                const baselineYPos = isStacked ?
                    topPadding + ((adjustedMaxY - stackedValues[sortedData[sortedData.length - 1].x] || 0) / (adjustedMaxY - adjustedMinY || 1)) * plotHeight :
                    topPadding + plotHeight;

                areaPathData += ` L ${lastX} ${baselineYPos}`;

                // If stacked, we need to draw the path back to the start along the bottom edge of this area
                if (isStacked && actualIndex < chartData.series.length - 1) {
                    // Go back in reverse order following the bottom edge of this area (top edge of series below)
                    for (let i = sortedData.length - 1; i >= 0; i--) {
                        const point = sortedData[i];
                        const xPos = yAxisWidth + (allXValues.indexOf(point.x) / (allXValues.length - 1 || 1)) * plotWidth;
                        const prevStackedVal = stackedValues[point.x] || 0;
                        const baseYPos = topPadding + ((adjustedMaxY - prevStackedVal) / (adjustedMaxY - adjustedMinY || 1)) * plotHeight;
                        areaPathData += ` L ${xPos} ${baseYPos}`;
                    }
                } else {
                    // For non-stacked or bottom series, just close to the baseline
                    areaPathData += ` L ${yAxisWidth} ${baselineYPos}`;
                }

                areaPathData += ' Z'; // Close the path
            }

            // Add series paths to the array
            seriesPaths.push({
                path: pathData,
                areaPath: areaPathData,
                color: color,
                strokeColor: strokeColor,
                points: pointsHtml,
                zIndex: isStacked ? actualIndex : 0 // For controlling drawing order in stacked charts
            });
        });

        // Sort paths by zIndex for proper layering in stacked charts
        seriesPaths.sort((a, b) => a.zIndex - b.zIndex);

        // Generate Y-axis tick marks and labels
        const yAxisTicks = 5; // Number of tick marks
        let yAxisTicksHtml = '';

        // Add background rectangle for plot area
        const backgroundRect = `
            <rect 
                x="${yAxisWidth}" 
                y="${topPadding}" 
                width="${plotWidth}" 
                height="${plotHeight}" 
                fill="#f8f9fa" 
                stroke="#e9ecef" 
                stroke-width="1"
            />
        `;

        for (let i = 0; i <= yAxisTicks; i++) {
            const yValue = adjustedMinY + (adjustedMaxY - adjustedMinY) * (i / yAxisTicks);
            const yPos = topPadding + ((adjustedMaxY - yValue) / (adjustedMaxY - adjustedMinY)) * plotHeight;
            const displayValue = isPercentage ? `${Math.round(yValue)}%` : Math.round(yValue * 10) / 10;

            yAxisTicksHtml += `
                <line 
                    x1="${yAxisWidth - 5}" 
                    y1="${yPos}" 
                    x2="${yAxisWidth + plotWidth}" 
                    y2="${yPos}" 
                    stroke="${i === 0 ? '#adb5bd' : '#dee2e6'}" 
                    stroke-dasharray="${i === 0 ? 'none' : '3,3'}"
                    stroke-width="${i === 0 ? 1 : 0.5}" 
                />
                <text 
                    x="${yAxisWidth - 10}" 
                    y="${yPos}" 
                    text-anchor="end" 
                    dominant-baseline="middle" 
                    class="axis-label"
                >
                    ${displayValue}
                </text>
            `;
        }

        // Vertical axis line
        const yAxisLine = `
            <line 
                x1="${yAxisWidth}" 
                y1="${topPadding}" 
                x2="${yAxisWidth}" 
                y2="${topPadding + plotHeight}" 
                stroke="#adb5bd" 
                stroke-width="1" 
            />
        `;

        // Horizontal axis line
        const xAxisLine = `
            <line 
                x1="${yAxisWidth}" 
                y1="${topPadding + plotHeight}" 
                x2="${yAxisWidth + plotWidth}" 
                y2="${topPadding + plotHeight}" 
                stroke="#adb5bd" 
                stroke-width="1" 
            />
        `;

        // Generate X-axis tick marks and labels
        let xAxisTicksHtml = '';

        // Draw X-axis labels for all unique x values
        allXValues.forEach((xValue, i) => {
            const xPos = yAxisWidth + (i / (allXValues.length - 1 || 1)) * plotWidth;
            const rotation = allXValues.length > 7 ? -45 : 0; // Rotate labels if many points
            const yOffset = rotation !== 0 ? 15 : 20;
            const textAnchor = rotation !== 0 ? 'end' : 'middle';

            xAxisTicksHtml += `
                <line 
                    x1="${xPos}" 
                    y1="${topPadding + plotHeight}" 
                    x2="${xPos}" 
                    y2="${topPadding + plotHeight + 5}" 
                    stroke="#adb5bd" 
                    stroke-width="1" 
                />
                <text 
                    x="${xPos}" 
                    y="${topPadding + plotHeight + yOffset}" 
                    text-anchor="${textAnchor}"
                    transform="rotate(${rotation}, ${xPos}, ${topPadding + plotHeight + yOffset})"
                    class="axis-label"
                >
                    ${xValue}
                </text>
            `;
        });

        const chartHtml = `
        <style>
            .chart-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin: 0 auto;
                max-width: 100%;
                font-family: sans-serif;
            }
            
            .area-chart-container {
                width: ${chartWidth}px;
                height: ${chartHeight}px;
                position: relative;
                margin: 20px auto;
                overflow: visible;
            }
            
            .axis-label {
                font-size: 11px;
                fill: #666;
            }
            
            .legend-container {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                justify-content: center;
                margin-top: 10px;
                width: 100%;
                padding: 8px;
                background-color: rgba(0,0,0,0.02);
                border-radius: 4px;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                margin: 5px 10px;
                font-size: 13px;
                color: #333;
            }
            
            .color-box {
                width: 15px;
                height: 15px;
                margin-right: 8px;
                border-radius: 2px;
                border: 1px solid rgba(0,0,0,0.2);
            }
            
            .chart-title {
                text-align: center;
                margin-bottom: 15px;
                font-size: 18px;
                font-weight: bold;
                color: #333;
            }
            
            .area-path {
                stroke: none;
            }
            
            .line-path {
                fill: none;
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
            }
            
            .data-point {
                cursor: pointer;
                transition: r 0.2s ease;
            }
            
            .data-point:hover {
                r: 5;
            }
            
            .tooltip {
                position: absolute;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 12px;
                pointer-events: none;
                z-index: 10;
                display: none;
            }
            
            .axis-labels {
                width: 100%;
                text-align: center;
                margin-top: 10px;
                font-size: 14px;
                color: #555;
            }
            
            .y-axis-title {
                position: absolute;
                left: -60px;
                top: ${topPadding + plotHeight / 2}px;
                transform: translateY(-50%) rotate(-90deg);
                font-size: 12px;
                color: #666;
            }
            
            .x-axis-title {
                position: absolute;
                bottom: 0px;
                left: ${yAxisWidth + plotWidth / 2}px;
                transform: translateX(-60%);
                font-size: 12px;
                color: #666;
            }
            
            .chart-type-indicator {
                position: absolute;
                top: 5px;
                right: 10px;
                font-size: 11px;
                color: #666;
                background: rgba(255,255,255,0.7);
                padding: 2px 6px;
                border-radius: 3px;
            }
        </style>
        
        <div class="chart-container">
            <div class="chart-title">${chartData.title || Lang.get('datavizAreaChart')}</div>
            
            <div class="area-chart-container">
                <div class="y-axis-title">${chartData.yAxisLabel || ''}</div>
                
                <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}">
                    <!-- Background rectangle -->
                    ${backgroundRect}
                    
                    <!-- Y-axis ticks and grid lines -->
                    ${yAxisTicksHtml}
                    ${yAxisLine}
                    
                    <!-- X-axis ticks and labels -->
                    ${xAxisLine}
                    ${xAxisTicksHtml}
                    
                    <!-- Area paths (drawn first) -->
                    ${seriesPaths.map(series => `
                        <path 
                            d="${series.areaPath}" 
                            fill="${series.color}" 
                            class="area-path" 
                        />
                    `).join('')}
                    
                    <!-- Line paths (drawn on top of areas) -->
                    ${seriesPaths.map(series => `
                        <path 
                            d="${series.path}" 
                            stroke="${series.strokeColor}" 
                            class="line-path" 
                        />
                    `).join('')}
                    
                    <!-- Data points (circles) -->
                    ${seriesPaths.map(series => series.points).join('')}
                </svg>
                
                <div class="x-axis-title">${chartData.xAxisLabel || Lang.get('datavizXValues')}</div>
                <div class="tooltip"></div>
                
                ${isStacked ? `
                    <div class="chart-type-indicator">
                        ${isPercentage ? Lang.get('datavizPercentageAreaChart') : Lang.get('datavizStackedAreaChart')} ${Lang.get('datavizAreaChart')}
                    </div>
                ` : ''}
            </div>
            
            <div class="legend-container">
                ${legendItems}
            </div>
        </div>
        
        <script>
            // Add tooltip functionality
            document.querySelectorAll('.data-point').forEach(point => {
                point.addEventListener('mouseover', function(e) {
                    const tooltip = document.querySelector('.tooltip');
                    const series = this.getAttribute('data-series');
                    const x = this.getAttribute('data-x');
                    const y = this.getAttribute('data-y');
                    const stackedY = this.getAttribute('data-stacked-y');
                    const isPercent = this.getAttribute('data-percent') === 'true';
                    
                    const yValue = isPercent ? 
                        \`\${y} (\${parseFloat(stackedY).toFixed(1)}%)\` : 
                        \`\${y}\${stackedY !== y ? \` (Total: \${stackedY})\` : ''}\`;
                    
                    tooltip.innerHTML = \`
                        <strong>\${series}</strong><br>
                        \${x}: \${yValue}
                    \`;
                    tooltip.style.left = (e.pageX + 10) + 'px';
                    tooltip.style.top = (e.pageY - 30) + 'px';
                    tooltip.style.display = 'block';
                });
                
                point.addEventListener('mouseout', function() {
                    document.querySelector('.tooltip').style.display = 'none';
                });
            });
        </script>
        `;

        // Show the chart in a floating window with adjusted width
        this.showFloatingWindow(chartHtml);

        // Make sure the window is wide enough for area charts
        const floatingWindow = document.querySelector('.dataviz-floating-window');
        if (floatingWindow) {
            floatingWindow.style.width = '700px';
            floatingWindow.style.maxWidth = '95vw';
        }

       //console.log('DataViz: Area chart rendering complete');
    }
    renderRadarChart(chartData) {
       //console.log('DataViz: Radar chart data received:', JSON.stringify(chartData, null, 2));

        // Validate the data structure
        if (!chartData.categories || !Array.isArray(chartData.categories) || chartData.categories.length < 3 ||
            !chartData.series || !Array.isArray(chartData.series) || chartData.series.length === 0) {
            console.error('DataViz: Invalid radar chart data structure');
            return this.showFloatingWindow(`
            <div class="dataviz-error">
                <h3>${Lang.get('datavizErrorRadarChart')}</h3>
                <p>${Lang.get('datavizErrorInvalidData', { errorType: Lang.get('datavizErrorRadarRequirement') })}</p>
            </div>
        `);
        }

        // Generate series colors consistently
        const seriesColors = chartData.series.map((series, idx) => {
            if (series.color) return series.color;
            return this.colors[idx % this.colors.length];
        });

        // Find the max value for scaling
        let maxValue = chartData.maxValue || 0;
        if (!maxValue) {
            chartData.series.forEach(series => {
                if (series.data) {
                    const seriesMax = Math.max(...series.data);
                    maxValue = Math.max(maxValue, seriesMax);
                }
            });
            // Round up to nearest sensible value
            maxValue = Math.ceil(maxValue / 10) * 10;
        }

        // Chart dimensions
        const size = 690;
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size * 0.35; // 40% of chart size
        const categoryCount = chartData.categories.length;

        // Generate SVG paths for the web and series polygons
        let webPaths = '';
        let axisPaths = '';
        let seriesPaths = [];
        let legendItems = '';

        // Create web rings (circles at different radii)
        const rings = 5; // Number of concentric circles
        for (let i = 1; i <= rings; i++) {
            const ringRadius = (i / rings) * radius;
            webPaths += `
                <circle 
                    cx="${centerX}" 
                    cy="${centerY}" 
                    r="${ringRadius}" 
                    fill="none" 
                    stroke="#e5e7eb" 
                    stroke-width="1" 
                    stroke-dasharray="${i === rings ? 'none' : '2,2'}"
                />
            `;
        }

        // Create axis lines and labels
        const angleStep = (Math.PI * 2) / categoryCount;
        chartData.categories.forEach((category, i) => {
            const angle = i * angleStep - Math.PI / 2; // Start from top (subtract 90°)
            const axisX = centerX + Math.cos(angle) * radius;
            const axisY = centerY + Math.sin(angle) * radius;

            // Draw axis line
            axisPaths += `
                <line 
                    x1="${centerX}" 
                    y1="${centerY}" 
                    x2="${axisX}" 
                    y2="${axisY}" 
                    stroke="#e5e7eb" 
                    stroke-width="1" 
                />
            `;

            // Calculate label position (a bit beyond the chart edge)
            const labelPadding = 25; // Move labels slightly outward
            const labelX = centerX + Math.cos(angle) * (radius + labelPadding);
            const labelY = centerY + Math.sin(angle) * (radius + labelPadding);

            // Determine text anchor based on position
            let textAnchor = 'middle';
            if (Math.abs(Math.cos(angle)) > 0.7) {
                textAnchor = Math.cos(angle) > 0 ? 'start' : 'end';
            }

            // Position the label
            axisPaths += `
                <text 
                    x="${labelX}" 
                    y="${labelY}" 
                    text-anchor="${textAnchor}" 
                    dominant-baseline="central" 
                    class="category-label"
                >
                    ${category}
                </text>
            `;
        });

        // Generate value markers on axes with labels
        let valueMarkers = '';
        for (let i = 1; i <= rings; i++) {
            const markerValue = Math.round((i / rings) * maxValue);
            // Only add text at 12 o'clock position
            valueMarkers += `
                <text 
                    x="${centerX}" 
                    y="${centerY - (i / rings) * radius - 5}" 
                    text-anchor="middle" 
                    class="value-marker"
                >
                    ${markerValue}
                </text>
            `;
        }

        // Create polygon paths for each series
        chartData.series.forEach((series, seriesIndex) => {
            const color = seriesColors[seriesIndex];

            // Add to legend
            legendItems += `
                <div class="legend-item">
                    <span class="color-box" style="background-color: ${color}"></span>
                    <span class="legend-label">${series.name || `Series ${seriesIndex + 1}`}</span>
                </div>`;

            // Skip if no data points
            if (!series.data || !Array.isArray(series.data) || series.data.length !== categoryCount) {
                console.warn(`DataViz: Series ${seriesIndex} has incorrect data length`);
                return;
            }

            let polygonPoints = '';
            let pointsHtml = '';

            // Create the polygon/path by calculating points for each category
            series.data.forEach((value, i) => {
                const ratio = Math.min(value / maxValue, 1); // Capped at 1 for safety
                const angle = i * angleStep - Math.PI / 2; // Start from top (subtract 90°)
                const pointX = centerX + Math.cos(angle) * radius * ratio;
                const pointY = centerY + Math.sin(angle) * radius * ratio;

                polygonPoints += `${pointX},${pointY} `;

                // Add point markers
                pointsHtml += `
                    <circle 
                        cx="${pointX}" 
                        cy="${pointY}" 
                        r="4"
                        fill="white"
                        stroke="${color}"
                        stroke-width="2"
                        class="data-point"
                        data-series="${series.name || `Series ${seriesIndex + 1}`}"
                        data-category="${chartData.categories[i]}"
                        data-value="${value}"
                    />
                `;
            });

            seriesPaths.push({
                polygon: polygonPoints.trim(),
                color: color,
                points: pointsHtml
            });
        });

        // Generate HTML for the chart
        const chartHtml = `
        <style>
            .chart-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin: 0 auto;
                max-width: 100%;
                font-family: sans-serif;
            }
            
            .radar-chart-container {
                width: ${size}px;
                height: ${size}px;
                position: relative;
                margin: 0px auto;
            }
            
            .category-label {
                font-size: 12px;
                fill: #666;
                font-weight: 500;
            }
            
            .value-marker {
                font-size: 10px;
                fill: #888;
            }
            
            .legend-container {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                justify-content: center;
                margin-top: 0px;
                width: 100%;
                padding: 8px;
                background-color: rgba(0,0,0,0.02);
                border-radius: 4px;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                margin: 5px 10px;
                font-size: 13px;
            }
            
            .color-box {
                width: 15px;
                height: 15px;
                margin-right: 8px;
                border-radius: 2px;
                border: 1px solid rgba(0,0,0,0.2);
            }
            
            .chart-title {
                text-align: center;
                margin-bottom: 0px;
                font-size: 18px;
                font-weight: bold;
                color: #333;
            }
            
            .series-polygon {
                stroke-width: 2;
                stroke-linejoin: round;
                fill-opacity: 0.25;
                transition: fill-opacity 0.2s;
            }
            
            .series-polygon:hover {
                fill-opacity: 0.4;
            }
            
            .data-point {
                cursor: pointer;
                transition: r 0.2s ease;
            }
            
            .data-point:hover {
                r: 6;
            }
            
            .tooltip {
                position: absolute;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 12px;
                pointer-events: none;
                z-index: 10;
                display: none;
            }
        </style>
        
        <div class="chart-container">
            <div class="chart-title">${chartData.title || Lang.get('datavizRadarChart')}</div>
            
            <div class="radar-chart-container">
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                    <!-- Web/grid rings -->
                    ${webPaths}
                    
                    <!-- Axes and category labels -->
                    ${axisPaths}
                    
                    <!-- Value markers -->
                    ${valueMarkers}
                    
                    <!-- Series polygons -->
                    ${seriesPaths.map(series => `
                        <polygon 
                            points="${series.polygon}"
                            stroke="${series.color}"
                            fill="${series.color}"
                            class="series-polygon"
                        />
                    `).join('')}
                    
                    <!-- Data points -->
                    ${seriesPaths.map(series => series.points).join('')}
                </svg>
                
                <div class="tooltip"></div>
            </div>
            
            <div class="legend-container">
                ${legendItems}
            </div>
        </div>
        
        <script>
            // Add tooltip functionality
            document.querySelectorAll('.data-point').forEach(point => {
                point.addEventListener('mouseover', function(e) {
                    const tooltip = document.querySelector('.tooltip');
                    tooltip.innerHTML = \`
                        <strong>\${this.getAttribute('data-series')}</strong><br>
                        \${this.getAttribute('data-category')}: \${this.getAttribute('data-value')}
                    \`;
                    tooltip.style.left = (e.pageX + 10) + 'px';
                    tooltip.style.top = (e.pageY - 30) + 'px';
                    tooltip.style.display = 'block';
                });
                
                point.addEventListener('mouseout', function() {
                    document.querySelector('.tooltip').style.display = 'none';
                });
            });
        </script>
        `;

        // Show the chart in a floating window
        this.showFloatingWindow(chartHtml);

       //console.log('DataViz: Radar chart rendering complete');
    }
    renderHeatMap(chartData) {
       //console.log('DataViz: Heat map data received:', JSON.stringify(chartData, null, 2));

        // Validate the data structure
        if (!chartData.xLabels || !chartData.yLabels || !chartData.data ||
            !Array.isArray(chartData.xLabels) || !Array.isArray(chartData.yLabels) || !Array.isArray(chartData.data)) {
            console.error('DataViz: Invalid heat map data structure');
            return this.showFloatingWindow(`
            <div class="dataviz-error">
                <h3>${Lang.get('datavizErrorHeatMap')}</h3>
                <p>${Lang.get('datavizErrorInvalidData', { errorType: Lang.get('datavizErrorHeatMapRequirement') })}</p>
            </div>
        `);
        }

        // Ensure all rows have correct length
        const allRowsValid = chartData.data.every(row => Array.isArray(row) && row.length === chartData.xLabels.length);
        if (!allRowsValid || chartData.data.length !== chartData.yLabels.length) {
            console.error('DataViz: Heat map data dimensions mismatch');
            return this.showFloatingWindow(`
            <div class="dataviz-error">
                <h3>${Lang.get('datavizErrorHeatMap')}</h3>
                <p>${Lang.get('datavizErrorHeatMapDimensions')}</p>
            </div>
        `);
        }

        // Define color scale
        const colorScale = chartData.colorScale || {
            min: null,
            max: null,
            minColor: '#f7fbff', // Light blue
            maxColor: '#08306b'  // Dark blue
        };

        // Find min/max if not specified
        if (colorScale.min === null || colorScale.max === null) {
            let minVal = Infinity;
            let maxVal = -Infinity;

            chartData.data.forEach(row => {
                row.forEach(val => {
                    minVal = Math.min(minVal, val);
                    maxVal = Math.max(maxVal, val);
                });
            });

            colorScale.min = colorScale.min === null ? minVal : colorScale.min;
            colorScale.max = colorScale.max === null ? maxVal : colorScale.max;
        }

       //console.log(`DataViz: Heat map color scale - min: ${colorScale.min}, max: ${colorScale.max}`);

        // Calculate dimensions
        const cellSize = Math.min(
            Math.max(15, 600 / chartData.xLabels.length), // Min size 15px, try to fit in 600px width
            Math.max(15, 500 / chartData.yLabels.length)  // Min size 15px, try to fit in 500px height
        );

        // Font size adjustment based on cell size
        const fontSize = Math.max(9, Math.min(12, cellSize / 3));

        // Adjust margins based on label lengths
        const maxXLabelLength = Math.max(...chartData.xLabels.map(label => String(label).length));
        const maxYLabelLength = Math.max(...chartData.yLabels.map(label => String(label).length));

        const leftMargin = Math.max(50, maxYLabelLength * 7);
        const bottomMargin = Math.max(100, maxXLabelLength * 5);

        // CHANGE THIS LINE: Reduce the top position value from 60 to 30 for all y positions
        const topMargin = 30; // Changed from the hardcoded 60 used everywhere

        const width = leftMargin + (chartData.xLabels.length * cellSize);
        const height = topMargin + (chartData.yLabels.length * cellSize) + bottomMargin;

        // Generate cell rectangles with hover effects
        let cells = '';
        chartData.data.forEach((row, y) => {
            row.forEach((value, x) => {
                // Calculate position - Update this line to use topMargin
                const posX = leftMargin + (x * cellSize);
                const posY = topMargin + (y * cellSize); // Changed from hardcoded 60

                // Calculate color intensity
                const ratio = Math.max(0, Math.min(1, (value - colorScale.min) / (colorScale.max - colorScale.min || 1)));

                // Interpolate color
                const color = interpolateColor(colorScale.minColor, colorScale.maxColor, ratio);

                // Add cell rectangle with data attributes for tooltip
                cells += `
                <rect 
                    x="${posX}" 
                    y="${posY}" 
                    width="${cellSize}" 
                    height="${cellSize}" 
                    fill="${color}" 
                    stroke="#fff" 
                    stroke-width="1" 
                    class="heat-cell" 
                    data-x="${chartData.xLabels[x]}" 
                    data-y="${chartData.yLabels[y]}" 
                    data-value="${value}"
                />
                <text 
                    x="${posX + cellSize / 2}" 
                    y="${posY + cellSize / 2}" 
                    dominant-baseline="middle" 
                    text-anchor="middle" 
                    style="${getBestTextColor(color)}" 
                    font-size="${fontSize}px" 
                    class="cell-text heat-map-cell-text"
                >
                    ${value}
                </text>
            `;
            });
        });

        // Generate x-axis labels
        let xAxisLabels = '';
        chartData.xLabels.forEach((label, i) => {
            const posX = leftMargin + (i * cellSize) + (cellSize / 2);
            xAxisLabels += `
                <text 
                    x="${posX}" 
                    y="${topMargin + (chartData.yLabels.length * cellSize) + 20}" 
                    text-anchor="middle" 
                    transform="rotate(45, ${posX}, ${topMargin + (chartData.yLabels.length * cellSize) + 20})" 
                    class="axis-label x-label"
                >
                    ${label}
                </text>
            `;
        });

        // Generate y-axis labels - Update this line too
        let yAxisLabels = '';
        chartData.yLabels.forEach((label, i) => {
            const posY = topMargin + (i * cellSize) + (cellSize / 2); // Changed from hardcoded 60
            yAxisLabels += `
                <text 
                    x="${leftMargin - 10}" 
                    y="${posY}" 
                    text-anchor="end" 
                    dominant-baseline="middle" 
                    class="axis-label y-label"
                >
                    ${label}
                </text>
            `;
        });

        // Generate color scale legend
        const legendWidth = 200;
        const legendHeight = 20;
        const legendX = width / 2 - legendWidth / 2;
        // Move the legend to the top of the chart, below the title
        const legendY = 10; // Changed from height - 100 to 25 (positioning it below title)

        // Create gradient for legend
        const gradientId = `heat-gradient-${Date.now()}`;
        const gradient = `
            <defs>
                <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="${colorScale.minColor}" />
                    <stop offset="100%" stop-color="${colorScale.maxColor}" />
                </linearGradient>
            </defs>
        `;

        // Create legend rectangle and labels
        const legend = `
        <text 
            x="${legendX + legendWidth / 2}" 
            y="${legendY - 50}" 
            text-anchor="middle" 
            class="legend-title"
        >
             ${Lang.get('datavizValueScale')}
        </text>
        `;

        // Generate the HTML for the chart
        const chartHtml = `
        <style>
            .chart-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin: 0 auto;
                max-width: 100%;
                font-family: sans-serif;
                overflow-x: auto;
            }
            
            .chart-title {
                text-align: center;
                margin-bottom: 5px;
                font-size: 18px;
                font-weight: bold;
                color: #333;
            }
            
            .axis-label {
                font-size: 11px;
                fill: #333;
            }
            
            .x-label {
                font-size: 10px;
            }
            
            .legend-label {
                font-size: 10px;
                fill: #555;
            }
            
            .legend-title {
                font-size: 12px;
                fill: #333;
                font-weight: 500;
            }
            
            .heat-cell {
                transition: opacity 0.2s;
            }
            
            .heat-cell:hover {
                opacity: 0.8;
                stroke: #000;
                stroke-width: 1.5;
            }
            
            .cell-text {
                user-select: none;
                pointer-events: none;
            }
            
            .tooltip {
                position: absolute;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 12px;
                pointer-events: none;
                z-index: 10;
                display: none;
            }
                .heat-map-cell-text {
                /* This prevents CSS variables from overriding our set colors */
                --chart-text: unset !important;
                --text-color: unset !important;
                fill: currentColor !important;
            }
        </style>
        
        <div class="chart-container">
            <div class="chart-title">${chartData.title || Lang.get('datavizHeatMap')}</div>
            
            <div class="heat-map-container">
                <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                    <!-- Gradient definition for legend -->
                    ${gradient}
                    
                    <!-- Heat map cells -->
                    ${cells}
                    
                    <!-- X-axis labels -->
                    ${xAxisLabels}
                    
                    <!-- Y-axis labels -->
                    ${yAxisLabels}
                    
                    <!-- Color scale legend -->
                    ${legend}
                </svg>
                
                <div class="tooltip"></div>
            </div>
        </div>
        
        <script>
            // Add tooltip functionality
            document.querySelectorAll('.heat-cell').forEach(cell => {
                cell.addEventListener('mouseover', function(e) {
                    const tooltip = document.querySelector('.tooltip');
                    tooltip.innerHTML = \`
                        <strong>\${this.getAttribute('data-y')}, \${this.getAttribute('data-x')}</strong><br>
                        ${Lang.get('datavizValue')}: \${this.getAttribute('data-value')}
                    \`;
                    tooltip.style.left = (e.pageX + 10) + 'px';
                    tooltip.style.top = (e.pageY - 30) + 'px';
                    tooltip.style.display = 'block';
                });
                
                cell.addEventListener('mouseout', function() {
                    document.querySelector('.tooltip').style.display = 'none';
                });
            });
        </script>
        `;

        // Show the chart in a floating window
        this.showFloatingWindow(chartHtml);

       //console.log('DataViz: Heat map rendering complete');

        // Helper function to interpolate between two colors
        function interpolateColor(color1, color2, factor) {
            // Parse colors to RGB
            let c1 = parseColor(color1);
            let c2 = parseColor(color2);

            // Interpolate each component
            const r = Math.round(c1.r + factor * (c2.r - c1.r));
            const g = Math.round(c1.g + factor * (c2.g - c1.g));
            const b = Math.round(c1.b + factor * (c2.b - c1.b));

            return `rgb(${r}, ${g}, ${b})`;
        }

        // Helper function to parse color string to RGB
        function parseColor(color) {
            // Handle hex
            if (color.startsWith('#')) {
                const hex = color.substring(1);
                return {
                    r: parseInt(hex.substring(0, 2), 16),
                    g: parseInt(hex.substring(2, 4), 16),
                    b: parseInt(hex.substring(4, 6), 16)
                };
            }
            // Handle rgb/rgba
            else if (color.startsWith('rgb')) {
                const match = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
                return {
                    r: parseInt(match[1]),
                    g: parseInt(match[2]),
                    b: parseInt(match[3])
                };
            }
            // Default fallback
            return { r: 0, g: 0, b: 0 };
        }

        // Helper to determine best text color (black/white) based on background
        function getBestTextColor(bgColor) {
            const rgb = parseColor(bgColor);

            // Calculate relative luminance using sRGB formula
            const r = rgb.r / 255;
            const g = rgb.g / 255;
            const b = rgb.b / 255;

            const R = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
            const G = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
            const B = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

            const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;

            // Return the color with the special style attribute to bypass theme overrides
            return luminance < 0.5 ?
                "fill:#ffffff !important; -webkit-text-fill-color:#ffffff !important; color:#ffffff !important;" :
                "fill:#000000 !important; -webkit-text-fill-color:#000000 !important; color:#000000 !important;";
        }
    }
    renderBubbleChart(chartData) {
       //console.log('DataViz: Bubble chart data received:', JSON.stringify(chartData, null, 2));

        // Validate the data structure
        if (!chartData.series || !Array.isArray(chartData.series) || chartData.series.length === 0) {
            console.error('DataViz: Invalid bubble chart data structure');
            return this.showFloatingWindow(`
            <div class="dataviz-error">
                <h3>${Lang.get('datavizErrorBubbleChart')}</h3>
                <p>${Lang.get('datavizErrorInvalidData', { errorType: Lang.get('datavizErrorBubbleRequirement') })}</p>
            </div>
        `);
        }

        // Find the min/max values across all series for proper scaling
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minSize = Infinity, maxSize = -Infinity;
        let hasLabels = false;

        chartData.series.forEach(series => {
            if (series.data && Array.isArray(series.data)) {
                series.data.forEach(point => {
                    if (point) {
                        const x = Number(point.x) || 0;
                        const y = Number(point.y) || 0;
                        const size = Number(point.size) || 1;
                        minX = Math.min(minX, x);
                        maxX = Math.max(maxX, x);
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                        minSize = Math.min(minSize, size);
                        maxSize = Math.max(maxSize, size);
                        if (point.label) hasLabels = true;
                    }
                });
            }
        });

        // Add padding to avoid points touching the edges
        const xPadding = Math.max(0.1, (maxX - minX) * 0.1);
        const yPadding = Math.max(0.1, (maxY - minY) * 0.1);

        const adjustedMinX = Math.max(0, minX - xPadding); // Ensure non-negative
        const adjustedMaxX = maxX + xPadding;
        const adjustedMinY = Math.max(0, minY - yPadding); // Ensure non-negative
        const adjustedMaxY = maxY + yPadding;

       //console.log(`DataViz: Bubble chart ranges - X: ${adjustedMinX} to ${adjustedMaxX}, Y: ${adjustedMinY} to ${adjustedMaxY}, Size: ${minSize} to ${maxSize}`);

        // Define chart dimensions
        const chartWidth = 700;
        const chartHeight = 450;
        const yAxisWidth = 60;
        const xAxisHeight = 60;
        const plotWidth = chartWidth - yAxisWidth - 20;
        const plotHeight = chartHeight - xAxisHeight - 20;
        const topPadding = 20;

        // Scale for bubble sizes - min 5px, max 40px radius
        const minRadius = 5;
        const maxRadius = 40;
        const sizeScale = size => {
            if (maxSize === minSize) return (minRadius + maxRadius) / 2; // If all bubbles are the same size
            return minRadius + ((size - minSize) / (maxSize - minSize)) * (maxRadius - minRadius);
        };

        // Generate series colors consistently
        const seriesColors = chartData.series.map((series, idx) => {
            const baseColor = this.colors[idx % this.colors.length];
            // Add semi-transparency to allow overlapping bubbles to be visible
            if (baseColor.startsWith('#')) {
                return `${baseColor}80`; // Add 50% alpha
            } else if (baseColor.startsWith('rgb(')) {
                return baseColor.replace('rgb(', 'rgba(').replace(')', ', 0.5)');
            }
            return baseColor;
        });

        // Generate the SVG elements for each series
        let seriesBubbles = [];
        let legendItems = '';

        chartData.series.forEach((series, seriesIndex) => {
            const color = seriesColors[seriesIndex];
            const strokeColor = this.colors[seriesIndex % this.colors.length]; // Solid color for stroke

            // Add to legend
            legendItems += `
                <div class="legend-item">
                    <span class="color-box" style="background-color: ${strokeColor}; opacity: 0.5;"></span>
                    <span class="legend-label">${series.name || `Series ${seriesIndex + 1}`}</span>
                </div>`;

            // Skip if no data points
            if (!series.data || !Array.isArray(series.data) || series.data.length === 0) {
                return;
            }

            // Generate bubbles HTML
            let bubblesHtml = '';

            series.data.forEach((point, pointIndex) => {
                if (!point) return;

                const x = Number(point.x) || 0;
                const y = Number(point.y) || 0;
                const size = Number(point.size) || 1;
                const label = point.label || '';

                // Calculate bubble radius based on size
                const radius = sizeScale(size);

                // Calculate bubble position in the plot area
                const xPos = yAxisWidth + ((x - adjustedMinX) / (adjustedMaxX - adjustedMinX)) * plotWidth;
                const yPos = topPadding + ((adjustedMaxY - y) / (adjustedMaxY - adjustedMinY)) * plotHeight;

                bubblesHtml += `
                    <circle 
                        cx="${xPos}" 
                        cy="${yPos}" 
                        r="${radius}"
                        fill="${color}"
                        stroke="${strokeColor}"
                        stroke-width="1"
                        class="bubble"
                        data-series="${series.name || `Series ${seriesIndex + 1}`}"
                        data-x="${x}"
                        data-y="${y}"
                        data-size="${size}"
                        data-label="${label}"
                    />
                `;

                if (label) {
                    if (radius > 20) {
                        // For large bubbles, place label inside
                        bubblesHtml += `
                            <text
                                x="${xPos}"
                                y="${yPos}"
                                text-anchor="middle"
                                dominant-baseline="middle"
                                class="bubble-label"
                                fill="#333"
                                font-size="${Math.min(radius * 0.8, 12)}px"
                            >
                                ${label}
                            </text>
                        `;
                    } else {
                        // For small bubbles, place label below
                        bubblesHtml += `
                        <text
                            x="${xPos}"
                            y="${yPos + radius + 10}"
                            text-anchor="middle"
                            dominant-baseline="hanging"
                            class="bubble-label outside-label"
                            fill="var(--chart-text, var(--text-color, #333))"
                            font-size="11px"
                            stroke="var(--chart-bg, var(--bg-color, white))"
                            stroke-width="1.5"
                            paint-order="stroke"
                        >
                            ${label}
                        </text>
                        `;
                    }
                }
            });

            // Add series bubbles to the array
            seriesBubbles.push({
                bubbles: bubblesHtml,
                color: color,
                zIndex: seriesIndex // For potential layering control
            });
        });

        // Generate Y-axis tick marks and labels
        const yAxisTicks = 5; // Number of tick marks
        let yAxisTicksHtml = '';

        // Add background rectangle for plot area
        const backgroundRect = `
            <rect 
                x="${yAxisWidth}" 
                y="${topPadding}" 
                width="${plotWidth}" 
                height="${plotHeight}" 
                fill="#f8f9fa" 
                stroke="#e9ecef" 
                stroke-width="1"
            />
        `;

        for (let i = 0; i <= yAxisTicks; i++) {
            const yValue = adjustedMinY + (adjustedMaxY - adjustedMinY) * (i / yAxisTicks);
            const yPos = topPadding + ((adjustedMaxY - yValue) / (adjustedMaxY - adjustedMinY)) * plotHeight;
            const formattedValue = Number.isInteger(yValue) ? yValue : yValue.toFixed(1);

            yAxisTicksHtml += `
                <line 
                    x1="${yAxisWidth - 5}" 
                    y1="${yPos}" 
                    x2="${yAxisWidth + plotWidth}" 
                    y2="${yPos}" 
                    stroke="${i === 0 ? '#adb5bd' : '#dee2e6'}" 
                    stroke-dasharray="${i === 0 ? 'none' : '3,3'}"
                    stroke-width="${i === 0 ? 1 : 0.5}" 
                />
                <text 
                    x="${yAxisWidth - 10}" 
                    y="${yPos}" 
                    text-anchor="end" 
                    dominant-baseline="middle" 
                    class="axis-label"
                >
                    ${formattedValue}
                </text>
            `;
        }

        // Generate X-axis tick marks and labels
        const xAxisTicks = 5;
        let xAxisTicksHtml = '';

        for (let i = 0; i <= xAxisTicks; i++) {
            const xValue = adjustedMinX + (adjustedMaxX - adjustedMinX) * (i / xAxisTicks);
            const xPos = yAxisWidth + (i / xAxisTicks) * plotWidth;
            const formattedValue = Number.isInteger(xValue) ? xValue : xValue.toFixed(1);

            xAxisTicksHtml += `
            <line 
                x1="${xPos}" 
                y1="${topPadding + plotHeight}" 
                x2="${xPos}" 
                y2="${topPadding + plotHeight + 5}" 
                stroke="#adb5bd" 
                stroke-width="1" 
            />
            <text 
                x="${xPos}" 
                y="${topPadding + plotHeight + 20}" 
                text-anchor="middle" 
                class="axis-label"
            >
                ${formattedValue}
            </text>
        `;
        }



        // Vertical axis line
        const yAxisLine = `
            <line 
                x1="${yAxisWidth}" 
                y1="${topPadding}" 
                x2="${yAxisWidth}" 
                y2="${topPadding + plotHeight}" 
                stroke="#adb5bd" 
                stroke-width="1" 
            />
        `;

        // Horizontal axis line
        const xAxisLine = `
            <line 
                x1="${yAxisWidth}" 
                y1="${topPadding + plotHeight}" 
                x2="${yAxisWidth + plotWidth}" 
                y2="${topPadding + plotHeight}" 
                stroke="#adb5bd" 
                stroke-width="1" 
            />
        `;

        const chartHtml = `
        <style>
            .chart-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin: 0 auto;
                max-width: 100%;
                font-family: sans-serif;
            }
            
            .bubble-chart-container {
                width: ${chartWidth}px;
                height: ${chartHeight}px;
                position: relative;
                margin: 20px auto;
                overflow: visible;
            }
            
            .axis-label {
                font-size: 11px;
                fill: #666;
            }
            
            .size-label {
                font-size: 9px;
                fill: #666;
            }
            
            .legend-title {
                font-size: 11px;
                font-weight: bold;
                fill: #333;
            }
            
            .legend-container {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                justify-content: center;
                margin-top: 10px;
                width: 100%;
                padding: 8px;
                background-color: rgba(0,0,0,0.02);
                border-radius: 4px;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                margin: 5px 10px;
                font-size: 13px;
                color: #555;
            }
            
            .color-box {
                width: 15px;
                height: 15px;
                margin-right: 8px;
                border-radius: 2px;
                border: 1px solid rgba(0,0,0,0.2);
            }
            
            .chart-title {
                text-align: center;
                margin-bottom: 15px;
                font-size: 18px;
                font-weight: bold;
                color: #333;
            }
            
            .bubble {
                cursor: pointer;
                transition: opacity 0.2s ease;
            }
            
            .bubble:hover {
                opacity: 0.9;
                stroke-width: 2;
            }
            
            .bubble-label {
                pointer-events: none;
                user-select: none;
            }
            
            .tooltip {
                position: absolute;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 12px;
                pointer-events: none;
                z-index: 10;
                display: none;
            }
            
            .axis-labels {
                width: 100%;
                text-align: center;
                margin-top: 10px;
                font-size: 14px;
                color: #555;
            }
            
            .y-axis-title {
                position: absolute;
                left: 0px; /* Move closer to the axis */
                top: ${topPadding + plotHeight / 2}px;
                transform-origin: left center; /* Set the rotation point first */
                transform: rotate(-90deg) translateX(-50%); /* Rotate first, then move left by half width */
                font-size: 12px;
                color: #666;
                white-space: nowrap;
                width: auto;
                text-align: center;
             }

            
            .x-axis-title {
                position: absolute;
                bottom: 5px;
                left: ${yAxisWidth + plotWidth / 2}px;
                transform: translateX(-50%);
                font-size: 12px;
                color: #666;
            }
        </style>
        
        <div class="chart-container">
            <div class="chart-title">${chartData.title || Lang.get('datavizBubbleChart')}</div>
            
            <div class="bubble-chart-container">
                <div class="y-axis-title">${chartData.yAxisLabel || Lang.get('datavizYValues')}</div>
                
                <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}">
                    <!-- Background rectangle -->
                    ${backgroundRect}
                    
                    <!-- Y-axis ticks and grid lines -->
                    ${yAxisTicksHtml}
                    ${yAxisLine}
                    
                    <!-- X-axis ticks and labels -->
                    ${xAxisLine}
                    ${xAxisTicksHtml}
                    
                    <!-- Bubbles (circles) - sorted by size to ensure smaller bubbles appear on top -->
                    ${seriesBubbles.map(series => series.bubbles).join('')}
                    
                </svg>
                
                <div class="x-axis-title">${chartData.xAxisLabel || Lang.get('datavizXValues')}</div>
                <div class="tooltip"></div>
            </div>
            
            <div class="legend-container">
                ${legendItems}
            </div>
        </div>
        
        <script>
            // Add tooltip functionality
            document.querySelectorAll('.bubble').forEach(bubble => {
                bubble.addEventListener('mouseover', function(e) {
                    const tooltip = document.querySelector('.tooltip');
                    const series = this.getAttribute('data-series');
                    const x = this.getAttribute('data-x');
                    const y = this.getAttribute('data-y');
                    const size = this.getAttribute('data-size');
                    const label = this.getAttribute('data-label');
                    
                    let tooltipContent = \`<strong>\${series}</strong><br>\`;
                    tooltipContent += \`X: \${x}, Y: \${y}<br>\`;
                    tooltipContent += \`Size: \${size}\`;
                    
                    if (label) {
                        tooltipContent += \`<br>\${label}\`;
                    }
                    
                    tooltip.innerHTML = tooltipContent;
                    tooltip.style.left = (e.pageX + 10) + 'px';
                    tooltip.style.top = (e.pageY - 30) + 'px';
                    tooltip.style.display = 'block';
                });
                
                bubble.addEventListener('mouseout', function() {
                    document.querySelector('.tooltip').style.display = 'none';
                });
            });
        </script>
        `;

        // Show the chart in a floating window with adjusted width
        this.showFloatingWindow(chartHtml);

        // Make sure the window is wide enough for bubble charts
        const floatingWindow = document.querySelector('.dataviz-floating-window');
        if (floatingWindow) {
            floatingWindow.style.width = '750px';
            floatingWindow.style.maxWidth = '95vw';
        }

       //console.log('DataViz: Bubble chart rendering complete');
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
            exportButton.style.background = '#4f46e5';
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

            // Special handling for pie charts
            const pieChartElement = chartContent.querySelector('.pie-chart');
            if (pieChartElement) {
                // Save more complete original styles
                const originalBackground = pieChartElement.style.background;
                const originalPosition = pieChartElement.style.position;
                const originalBoxShadow = pieChartElement.style.boxShadow;
                const originalBorder = pieChartElement.style.border;
                const originalBorderRadius = pieChartElement.style.borderRadius;

                // Convert conic-gradient to a Canvas element
                const legendItems = chartContent.querySelectorAll('.legend-item');
                const colors = [];
                const values = [];
                let total = 0;

                // Extract color and percentage data from legend items
                legendItems.forEach(item => {
                    const colorBox = item.querySelector('.color-box');
                    const color = window.getComputedStyle(colorBox).backgroundColor;
                    colors.push(color);

                    const label = item.querySelector('.legend-label').textContent;
                    const percentMatch = label.match(/\(([\d.]+)%\)/);
                    const percent = percentMatch ? parseFloat(percentMatch[1]) : 0;
                    values.push(percent);
                    total += percent;
                });

                // Create a temporary canvas with the current theme background
                const tempCanvas = document.createElement('canvas');
                const pieRect = pieChartElement.getBoundingClientRect();
                tempCanvas.width = pieRect.width * 2;
                tempCanvas.height = pieRect.height * 2;
                const ctx = tempCanvas.getContext('2d');

                const centerX = tempCanvas.width / 2;
                const centerY = tempCanvas.height / 2;
                const radius = Math.min(centerX, centerY) * 0.9;

                // Fill background with current theme color
                ctx.fillStyle = currentBgColor;
                ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                let startAngle = -0.5 * Math.PI;

                // Draw each slice
                colors.forEach((color, index) => {
                    const percent = values[index];
                    const sliceAngle = (percent / 100) * 2 * Math.PI;

                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
                    ctx.closePath();
                    ctx.fillStyle = color;
                    ctx.fill();

                    // Get theme-appropriate stroke color
                    const strokeColor = isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)';
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    startAngle += sliceAngle;
                });

                // Replace the conic-gradient with our canvas temporarily
                const originalPieStyle = pieChartElement.getAttribute('style') || '';
                pieChartElement.style.background = 'none';
                pieChartElement.style.position = 'relative';
                pieChartElement.appendChild(tempCanvas);
                tempCanvas.style.position = 'absolute';
                tempCanvas.style.top = '0';
                tempCanvas.style.left = '0';
                tempCanvas.style.width = '100%';
                tempCanvas.style.height = '100%';
                tempCanvas.style.borderRadius = '50%';

                // Apply background color to all elements to ensure no transparency
                const allElements = chartContent.querySelectorAll('*');
                allElements.forEach(el => {
                    // Skip text elements that should remain transparent
                    if (el.classList.contains('bar-label') ||
                        el.classList.contains('legend-label') ||
                        el.classList.contains('axis-label') ||
                        el.tagName === 'TEXT') {
                        return;
                    }

                    // For other elements, replace transparency with background color
                    if (getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)' ||
                        getComputedStyle(el).backgroundColor === 'transparent') {
                        el.style.backgroundColor = 'inherit';
                    }
                });

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
                        // Restore original pie chart styles
                        if (pieChartElement.contains(tempCanvas)) {
                            pieChartElement.removeChild(tempCanvas);
                        }

                        pieChartElement.style.background = originalBackground;
                        pieChartElement.style.position = originalPosition;
                        pieChartElement.style.boxShadow = originalBoxShadow;
                        pieChartElement.style.border = originalBorder;
                        pieChartElement.style.borderRadius = originalBorderRadius;

                        // Also restore the conic gradient styling
                        const conicGradientMatch = originalPieStyle.match(/background:\s*conic-gradient\([^)]+\)/);
                        if (conicGradientMatch) {
                            pieChartElement.style.background = conicGradientMatch[0].split('background:')[1].trim();
                        }

                        // Restore all other styles
                        originalStyles.forEach(item => {
                            // First apply the original style
                            item.element.style.cssText = item.cssText;

                            // Restore SVG attributes
                            if (item.svgAttributes) {
                                Object.entries(item.svgAttributes).forEach(([attr, value]) => {
                                    item.element.setAttribute(attr, value);
                                });
                            }

                            // Special handling for rect elements to reconnect with theme variables
                            if (item.element.tagName === 'rect' && item.element.hasAttribute('data-original-fill')) {
                                // Restore the exact original fill value to reconnect with CSS theme selectors
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

                    // Restore original pie chart styles
                    if (pieChartElement.contains(tempCanvas)) {
                        pieChartElement.removeChild(tempCanvas);
                    }

                    pieChartElement.style.background = originalBackground;
                    pieChartElement.style.position = originalPosition;
                    pieChartElement.style.boxShadow = originalBoxShadow;
                    pieChartElement.style.border = originalBorder;
                    pieChartElement.style.borderRadius = originalBorderRadius;

                    // Restore all styles
                    originalStyles.forEach(item => {
                        // First apply the original style
                        item.element.style.cssText = item.cssText;

                        // Restore SVG attributes
                        if (item.svgAttributes) {
                            Object.entries(item.svgAttributes).forEach(([attr, value]) => {
                                item.element.setAttribute(attr, value);
                            });
                        }

                        // Special handling for rect elements to reconnect with theme variables
                        if (item.element.tagName === 'rect' && item.element.hasAttribute('data-original-fill')) {
                            // Restore the exact original fill value to reconnect with CSS theme selectors
                            const originalFill = item.element.getAttribute('data-original-fill');
                            if (originalFill) {
                                item.element.setAttribute('fill', originalFill);
                            }
                            item.element.removeAttribute('data-original-fill');
                        }
                    });

                    document.body.removeChild(loadingIndicator);
                });

            } else {
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
                        // Just restore all styles - no pie chart specific code needed here
                        originalStyles.forEach(item => {
                            // First apply the original style
                            item.element.style.cssText = item.cssText;

                            // Restore SVG attributes
                            if (item.svgAttributes) {
                                Object.entries(item.svgAttributes).forEach(([attr, value]) => {
                                    item.element.setAttribute(attr, value);
                                });
                            }

                            // Special handling for rect elements to reconnect with theme variables
                            if (item.element.tagName === 'rect' && item.element.hasAttribute('data-original-fill')) {
                                // Restore the exact original fill value to reconnect with CSS theme selectors
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
                    // Error handler with identical style restoration
                    console.error('DataViz: HTML2Canvas error:', error);
                    this.showScreenshotInstructions();

                    // Just restore all styles - no pie chart specific code needed here
                    originalStyles.forEach(item => {
                        // First apply the original style
                        item.element.style.cssText = item.cssText;

                        // Restore SVG attributes
                        if (item.svgAttributes) {
                            Object.entries(item.svgAttributes).forEach(([attr, value]) => {
                                item.element.setAttribute(attr, value);
                            });
                        }

                        // Special handling for rect elements to reconnect with theme variables
                        if (item.element.tagName === 'rect' && item.element.hasAttribute('data-original-fill')) {
                            // Restore the exact original fill value to reconnect with CSS theme selectors
                            const originalFill = item.element.getAttribute('data-original-fill');
                            if (originalFill) {
                                item.element.setAttribute('fill', originalFill);
                            }
                            item.element.removeAttribute('data-original-fill');
                        }
                    });

                    document.body.removeChild(loadingIndicator);
                });
            }
        } catch (error) {
            // Added missing catch block to complete the try-catch structure
            console.error('DataViz: Error during export process:', error);
            this.showScreenshotInstructions();
        }
    }

    async captureChartAsDataUrl() {
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