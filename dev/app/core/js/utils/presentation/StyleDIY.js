
class StyleDIY {

    // Store the last generated custom style (raw code)
    static lastGeneratedStyle = null;

    // Store the last generated style info as JSON object: { name, prompt, code }
    static lastGeneratedStyleInfo = null;

    // Store multiple saved styles (for future expansion)
    static savedStyles = [];

    // Abort controller for style generation
    static generationAbortController = null;

    // Main DIY Style rendering method
    static async renderDIY(stages, parsedSlides, slideImagesResult, customStyleCode) {
        /* console.log('StyleDIY: renderDIY called with:', {
            stages: stages ? stages.length : 'null',
            parsedSlides: parsedSlides ? Object.keys(parsedSlides) : 'null',
            slideImagesResult: slideImagesResult ? Object.keys(slideImagesResult) : 'null',
            customStyleCode: customStyleCode ? 'provided' : 'null',
            lastGeneratedStyle: StyleDIY.lastGeneratedStyle ? 'available' : 'null'
        }); */

        // If no custom code provided, check if we have a generated style, otherwise fallback to classic
        if (!customStyleCode) {
            // Try to use the last generated style if available
            if (StyleDIY.lastGeneratedStyle) {
               //  //console.log('StyleDIY: Using last generated style');
                customStyleCode = StyleDIY.lastGeneratedStyle;
            } else {
               //  //console.log('StyleDIY: No custom style available, falling back to classic');
                return await SlideStyles.renderClassic(stages, parsedSlides, slideImagesResult);
            }
        }

        try {
           //  //console.log('StyleDIY: Parsing custom function...');
            // Parse and execute custom style function
            const customFunction = StyleDIY.parseCustomFunction(customStyleCode);
           //  //console.log('StyleDIY: Custom function parsed successfully, executing...');

            const result = await customFunction(stages, parsedSlides, slideImagesResult);
           //  //console.log('StyleDIY: Custom style rendering completed successfully');
            return result;
        } catch (error) {
            console.error('DIY Style Error:', error);
            console.error('StyleDIY: Error details:', {
                message: error.message,
                stack: error.stack,
                customStyleCode: customStyleCode ? customStyleCode.substring(0, 200) + '...' : 'null'
            });
            // Fallback to classic style on error
           //  //console.log('StyleDIY: Falling back to classic style due to error');
            return await SlideStyles.renderClassic(stages, parsedSlides, slideImagesResult);
        }
    }

    // Parse and validate custom function from AI response
    static parseCustomFunction(styleCode) {
        // Extract function from <custom_style> tags if present. If no tags are present,
        // fall back to the raw response (strip Markdown code fences if present).
        let functionCode = '';
        const tagMatch = styleCode.match(/<custom_style>([\s\S]*?)<\/custom_style>/i);
        if (tagMatch) {
            functionCode = tagMatch[1].trim();
           //  //console.log('StyleDIY: Found <custom_style> tags, using inner content');
        } else {
            // Try to strip common Markdown code fences ``` or ```javascript
            const mdMatch = styleCode.match(/```(?:javascript|js)?\n?([\s\S]*?)```/i);
            if (mdMatch) {
                functionCode = mdMatch[1].trim();
               //  //console.log('StyleDIY: Found Markdown code fence, using fenced content');
            } else {
                // No tags or fences — assume the entire response is the function/source
                functionCode = String(styleCode || '').trim();
               //  //console.log('StyleDIY: No <custom_style> tags or code fences found, using full response');
            }
        }

        // Extract AI-generated function name for better style identification
        let aiFunctionName = null;

        // Check if AI generated a complete function declaration and extract both name and body
        const functionMatch = functionCode.match(/static\s+async\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*)\}\s*$/);
        if (functionMatch) {
            aiFunctionName = functionMatch[1];
            functionCode = functionMatch[2].trim();
           //  //console.log('StyleDIY: Extracted function name:', aiFunctionName, 'and body from static declaration');
        } else {
            // Check for regular async function pattern
            const asyncFunctionMatch = functionCode.match(/async\s+function\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*)\}\s*$/);
            if (asyncFunctionMatch) {
                aiFunctionName = asyncFunctionMatch[1];
                functionCode = asyncFunctionMatch[2].trim();
               //  //console.log('StyleDIY: Extracted function name:', aiFunctionName, 'and body from async function declaration');
            }
        }

        // Validate and sanitize the AI function name
        let finalFunctionName = StyleDIY.sanitizeAndValidateFunctionName(aiFunctionName);

        // Remove 'render' prefix if present (case-insensitive) for display name
        let displayFunctionName = finalFunctionName.replace(/^render/i, '');
        if (!displayFunctionName) displayFunctionName = finalFunctionName;

        // Store the display name for later use (for DB, manager, etc.)
        StyleDIY._lastParsedFunctionName = displayFunctionName;

       //  //console.log('StyleDIY: Final function name will be:', finalFunctionName, '| Display name:', displayFunctionName);

        // Security validation - check for dangerous patterns
    // Focused blacklist for dangerous window identifiers. We only treat these as violations
    // so that legitimate usage like `window.Konva` is allowed.
    // Add any other dangerous global properties you want blocked here.
    const windowDangerousIdents = /window\s*(?:\?\.)?\s*\.\s*(?:location|document|localStorage|sessionStorage|opener|parent|top|frames|process|global|require|XMLHttpRequest|fetch)\b/i;

        const dangerousPatterns = [
            /eval\s*\(/,
            /Function\s*\(/,
            /document\./,
            /localStorage/,
            /sessionStorage/,
            // Block attempts to access environment or filesystem
            /process\s*\.\s*env/,        // process.env
            /\b__dirname\b/,              // __dirname
            /\b__filename\b/,             // __filename
            /\bDeno\b/,                   // Deno runtime
            /\bfs\b/,                     // bare fs identifier (also caught via require/import below)
            /require\s*\(\s*['"]fs['"]\s*\)/,
            /import\s*\(\s*['"]fs['"]\s*\)/,
            /require\s*\(\s*['"]child_process['"]\s*\)/,
            /import\s*\(\s*['"]child_process['"]\s*\)/,
            /\bspawn\s*\(/,
            /\bexec\s*\(/,
            /fetch\s*\(/,
            /XMLHttpRequest/,
            /import\s*\(/,
            /require\s*\(/,
            /process\./,
            /global\./,
            /console\.(?!log|error|warn)/  // Allow basic console methods
        ];

        for (const pattern of dangerousPatterns) {
            // We handle window.<ident> checks separately via a focused blacklist so we don't
            // accidentally block safe uses like window.Konva.
            if (windowDangerousIdents.test(functionCode)) {
                // Extract the offending identifier for clearer error messages
                const m = functionCode.match(/window\s*(?:\?\.)?\s*\.\s*([A-Za-z_$][A-Za-z0-9_$]*)/i);
                const off = (m && m[1]) ? m[1] : '<unknown>';
                throw new Error(`Security violation: Dangerous window access detected - '${off}'`);
            }
            // Continue to check the rest of the patterns below

            if (pattern.test(functionCode)) {
                throw new Error(`Security violation: Dangerous pattern detected - ${pattern}`);
            }
        }

        try {
            // Small safety transform: ensure Konva.Text constructors in AI code have pw_id present.
            // We inject a helper __pw_makeText and rewrite common constructor patterns to call it.
            // This is conservative: it covers `new window.Konva.Text({` and `new Konva.Text({` patterns.
            const helperDef = `const __pw_makeText = (props) => { props = props || {}; if (!Object.prototype.hasOwnProperty.call(props, 'pw_id')) props.pw_id = undefined; return new window.Konva.Text(props); };
const __pw_makeImage = (props) => { props = props || {}; if (!Object.prototype.hasOwnProperty.call(props, 'pw_id')) props.pw_id = undefined; return new window.Konva.Image(props); };`;

            // Replace typical constructor uses with the helpers. Keep original code as fallback if patterns not matched.
            let transformedFunctionCode = functionCode
                .replace(/new\s+window\.Konva\.Text\s*\(/g, '__pw_makeText(')
                .replace(/new\s+Konva\.Text\s*\(/g, '__pw_makeText(')
                .replace(/new\s+window\.Konva\.Image\s*\(/g, '__pw_makeImage(')
                .replace(/new\s+Konva\.Image\s*\(/g, '__pw_makeImage(');

            // Create function with AI-generated name for better identification
            const wrappedCode = `
                return (async function ${finalFunctionName}(stages, parsedSlides, slideImagesResult) {
                    ${helperDef}
                    ${transformedFunctionCode}
                });
            `;

           //  //console.log('StyleDIY: Creating function with name:', finalFunctionName);
           //  //console.log('StyleDIY: Original function code length:', functionCode.length);
           //  //console.log('StyleDIY: Transformed function code length:', transformedFunctionCode.length);
           //  //console.log('StyleDIY: Function code preview:', transformedFunctionCode.substring(0, 300) + '...');

            // Execute in controlled environment (provide SlideStyles so demo templates can reference it)
            const createFunction = new Function('window', 'SlideStyles', wrappedCode);
            const customFunction = createFunction(window, SlideStyles);

           //  //console.log('StyleDIY: Function created successfully, type:', typeof customFunction);
            return customFunction;
        } catch (error) {
            console.error('StyleDIY: Function parsing failed with error:', error);
            // wrappedCode may not be in scope if earlier error; attempt to log transformedFunctionCode
            try { console.error('StyleDIY: Transformed code preview:', (typeof transformedFunctionCode === 'string') ? transformedFunctionCode.substring(0,300) + '...' : '<none>'); } catch (e) {}
            throw new Error(`Function parsing failed: ${error.message}`);
        }
    }

    // Helper method to sanitize and validate AI-generated function names
    static sanitizeAndValidateFunctionName(aiFunctionName) {
        // If no AI name provided, use generic fallback
        if (!aiFunctionName || typeof aiFunctionName !== 'string') {
            return 'renderCustomStyle';
        }

        // Remove any non-alphanumeric characters and ensure it starts with a letter
        let sanitized = aiFunctionName.replace(/[^a-zA-Z0-9]/g, '');

        // Ensure it starts with a letter (JavaScript requirement)
        if (!/^[a-zA-Z]/.test(sanitized)) {
            sanitized = 'render' + sanitized;
        }

        // Ensure it's not empty after sanitization
        if (!sanitized || sanitized.length === 0) {
            return 'renderCustomStyle';
        }

        // Ensure it's not a reserved word (basic check)
        const reservedWords = ['function', 'var', 'let', 'const', 'return', 'if', 'else', 'for', 'while', 'class', 'new', 'this'];
        if (reservedWords.includes(sanitized.toLowerCase())) {
            return 'render' + sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
        }

        // Ensure it has a reasonable length (max 50 characters)
        if (sanitized.length > 50) {
            sanitized = sanitized.substring(0, 50);
        }

       //  //console.log('StyleDIY: Sanitized function name from', aiFunctionName, 'to', sanitized);
        return sanitized;
    }

    // Update DIY card visual indicator when style is available
    static updateDIYCardBehavior() {
        try {
            const diyCard = document.querySelector('.sidebar-style-card.diy');
            if (diyCard) {
                // Check if we have any styles (current or saved)
                const hasCurrentStyle = !!StyleDIY.lastGeneratedStyleInfo;
                const hasSavedStyles = StyleDIY.savedStyles.length > 0;
                const hasAnyStyles = hasCurrentStyle || hasSavedStyles;

               //  //console.log('StyleDIY: updateDIYCardBehavior - hasCurrentStyle:', hasCurrentStyle, 'hasSavedStyles:', hasSavedStyles, 'hasAnyStyles:', hasAnyStyles);

                if (hasAnyStyles) {
                    // Show indicator that styles are available
                    diyCard.style.border = '2px solid #00ff00';
                    diyCard.style.position = 'relative';

                    if (hasCurrentStyle) {
                        diyCard.title = (window.Lang ? Lang.get('styleDIYCardActive') : '🎨 DIY Style (Custom Style Active - Click to Manage Styles)');
                    } else {
                        diyCard.title = (window.Lang ? Lang.get('styleDIYCardSaved') : '🎨 DIY Style (Saved Styles Available - Click to Manage Styles)');
                    }

                    // Add a small "gear" icon to indicate management functionality
                    let manageIcon = diyCard.querySelector('.diy-manage-icon');
                    if (!manageIcon) {
                        manageIcon = document.createElement('span');
                        manageIcon.className = 'diy-manage-icon';
                        manageIcon.innerHTML = '⚙️';
                        manageIcon.style.cssText = `
                            position: absolute;
                            top: 2px;
                            right: 2px;
                            background: #00ff00;
                            color: white;
                            border-radius: 50%;
                            width: 16px;
                            height: 16px;
                            font-size: 10px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                        `;
                        manageIcon.title = (window.Lang ? Lang.get('styleDIYManageIconTitle') : 'Click to manage DIY styles');
                        diyCard.appendChild(manageIcon);
                    }

                    // Update the onclick handler to open style manager when styles are present
                    diyCard.onclick = () => {
                       //  //console.log('StyleDIY: DIY card clicked with styles present - opening style manager');
                        StyleDIY.openDIYStyleManager();
                    };

                } else {
                    // No styles available - reset to default appearance
                    diyCard.style.border = '';
                    diyCard.style.position = '';
                    diyCard.title = (window.Lang ? Lang.get('styleDIYCardCreate') : '🎨 DIY Style (Create Custom AI-Generated Styles)');

                    // Remove the gear icon if present
                    const manageIcon = diyCard.querySelector('.diy-manage-icon');
                    if (manageIcon) {
                        manageIcon.remove();
                    }

                    // Update the onclick handler to open create modal when no styles are present
                    diyCard.onclick = () => {
                       //  //console.log('StyleDIY: DIY card clicked with no styles - opening create modal');
                        StyleDIY.openDIYModal();
                    };
                }

               //  //console.log('StyleDIY: Updated DIY card behavior based on available styles');
            } else {
                console.warn('StyleDIY: Could not find DIY card to update behavior');
            }
        } catch (error) {
            console.error('StyleDIY: Error updating DIY card behavior:', error);
        }
    }

    // Helper to find sidebar instance
    static findSidebarInstance() {
        // Try different approaches to find the sidebar instance
        if (window.presentationSidebar) {
            return window.presentationSidebar;
        }

        if (window.previewWindow && window.previewWindow.sidebar) {
            return window.previewWindow.sidebar;
        }

        // Search through window objects
        const sidebarInstances = Object.keys(window).filter(key =>
            window[key] && typeof window[key].selectStyle === 'function'
        );

        return sidebarInstances.length > 0 ? window[sidebarInstances[0]] : null;
    }

    // Demo template function for AI reference (now selected from known SlideStyles)
    static getDemoTemplate() {
        try {
            // Known styles (match sidebar.js list)
            const styles = [
                { key: 'classic', label: 'Classic', render: 'renderClassic' },
                { key: 'purple-glass', label: 'Purple Glass', render: 'renderPurpleGlass' },
                { key: 'brutalist', label: 'Brutalist', render: 'renderBrutalist' },
                { key: 'corporate', label: 'Corporate', render: 'renderCorporate' },
                { key: 'wilderness', label: 'Wilderness', render: 'renderWilderness' },
                { key: 'sophie', label: 'Sophie', render: 'renderSophie' },
                { key: 'enchanted', label: 'Enchanted', render: 'renderEnchanted' },
                { key: 'darkmode', label: 'Dark mode', render: 'renderDarkMode' },
                { key: 'lightmode', label: 'Light mode', render: 'renderLightMode' },
                { key: 'product', label: 'Product', render: 'renderProductShowcase' },
                { key: 'finance', label: 'Finance', render: 'renderFinance' },
                { key: 'data', label: 'Data', render: 'renderData' },
                { key: 'hobby', label: 'Hobby', render: 'renderHobby' },
                { key: 'pets', label: 'Pets', render: 'renderPets' }
            ];

            // Read selected template key from the modal hidden input (set in openDIYModal)
            let selectedKey = null;
            try {
                const sel = document.getElementById('diy-template-selected');
                if (sel && sel.value) selectedKey = sel.value;
            } catch (e) {
                console.warn('StyleDIY: Could not read diy-template-selected element:', e);
            }

           //  //console.log('StyleDIY: getDemoTemplate - selectedKey:', selectedKey);

            // Find style entry from the known list
            const styleEntry = styles.find(s => String(s.key) === String(selectedKey));
            if (!styleEntry) {
                console.warn('StyleDIY: No matching style entry for selectedKey:', selectedKey);
                return '';
            }

            const renderFnName = styleEntry.render;
           //  //console.log('StyleDIY: getDemoTemplate - matched styleEntry:', styleEntry);

            if (!window.SlideStyles || typeof window.SlideStyles[renderFnName] !== 'function') {
                console.warn(`StyleDIY: SlideStyles.${renderFnName} not found or not a function`);
                return '';
            }

            // Get function source
            let fnSource = window.SlideStyles[renderFnName].toString();
            const detectedName = window.SlideStyles[renderFnName].name || renderFnName;
           //  //console.log(`StyleDIY: Found SlideStyles.${renderFnName} (detected name: ${detectedName})`);
           //  //console.log('StyleDIY: Original function source preview:', fnSource.substring(0, 300));

            // Normalize the function name to renderDemoStyle and enforce parameter list
            let normalized = fnSource;

            // Always produce a class-style `static async renderDemoStyle(...)` regardless of the original prefix
            const prefixRegex = /^\s*(?:static\s+)?(?:async\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\s*(?=\()/m;
            try {
                if (prefixRegex.test(normalized)) {
                    // Replace the optional leading tokens and original name with our canonical class static async method
                    normalized = normalized.replace(prefixRegex, 'static async renderDemoStyle');
                } else {
                    // Fallback: find first '(' and insert canonical prefix before it
                    const parenIndex = normalized.indexOf('(');
                    if (parenIndex > 0) {
                        normalized = 'static async renderDemoStyle' + normalized.slice(parenIndex);
                    } else {
                        // Last-resort: wrap the provided source as method body
                        normalized = 'static async renderDemoStyle(stages, parsedSlides, slideImagesResult) {\n' + fnSource + '\n}';
                    }
                }
            } catch (e) {
                console.warn('StyleDIY: Error forcing static async normalization, using safe wrapper', e);
                normalized = 'static async renderDemoStyle(stages, parsedSlides, slideImagesResult) {\n' + fnSource + '\n}';
            }

            // Enforce the standard parameter list for the demo template (idempotent)
            normalized = normalized.replace(/renderDemoStyle\s*\([^)]*\)/, 'renderDemoStyle(stages, parsedSlides, slideImagesResult)');

           //  //console.log('StyleDIY: Normalized demo function (preview):', normalized.substring(0, 3000));
            return normalized;

        } catch (error) {
            console.error('StyleDIY: Error in getDemoTemplate:', error);
            return '';
        }
    }

    // System prompt for AI style generation
    static getDIYSystemPrompt() {
        return `You are an expert presentation designer creating custom Konva.js slide rendering functions. Generate production-ready code that follows exact specifications.

TEMPLATE FUNCTION (MANDATORY REFERENCE):
${StyleDIY.getDemoTemplate()}

CRITICAL RULES - NO EXCEPTIONS:
1. OUTPUT: Return ONLY the complete function wrapped in <custom_style></custom_style> tags
2. FUNCTION NAME: Create a descriptive function name based on the user's style request (e.g., "renderFerrariRacing", "renderMinimalElegant", "renderNeonCyber")
3. STRUCTURE: Copy the exact function signature, Promise structure, and core logic flow
4. OVERFLOW PROTECTION: Include ALL overflow fix logic (while loops reducing fontSize) - NEVER remove this
5. SLIDES: Handle both cover slide (index 0) and content slides (index 1+)
6. RENDERING: Use only window.Konva elements for all visual components
7. KONVA ELEMENTS: Only use existing Konva elements like Rect, Circle, Text, Line, RegularPolygon, Path, etc. DO NOT use non-existent elements like Konva.SVG or Konva.Image without proper setup

FUNCTION NAMING RULES:
- Always start with "render" prefix
- Use PascalCase (e.g., renderCorporateBlue, renderVintageWood)
- Make it descriptive of the style theme
- Keep it concise but meaningful (2-4 words max)
- Examples: renderFerrariRacing, renderAppleMinimal, renderGoldLuxury, renderNeonGaming

CUSTOMIZATION SCOPE:
- Colors, gradients, and visual effects
- Typography and font styling
- Layout positioning and spacing
- Visual themes and aesthetics, ALL text MUST HAVE the proper contrast (e.g., white text on dark backgrounds or dark text on light backgrounds)
- Decorative elements and patterns

REQUIRED: ADD DIFFERENT GORGEOUS SVG DECORATIONS TO ALL SLIDES
- MUST include 3-5 custom unique SVG decorative elements per slide that match the style theme requested
- Examples: icons, ornaments, borders, geometric patterns, logos, symbols  
- Position strategically to enhance visual appeal without interfering with text
- Apply appropriate colors, opacity, and transformations to match your style
- CRITICAL: SVG decorations should be thematically appropriate (e.g., Ferrari style = racing elements, Corporate = professional icons)

To use SVG PATHS in the function, use the Konva.Path class to render vector shapes:
The Konva.Path class enables you to render vector shapes using SVG path data (the "d" attribute). 
To add a vector image or icon, instantiate a Konva.Path and set its "data" property to your SVG path 
string—this will display the shape on the canvas as a scalable vector. 
If you plan to add a new image or icon to your design, always use this method (Konva.Path with SVG path data) instead of raster images or <img> tags. 
This ensures your design remains fully vector-based, scalable, and consistent with Konva’s rendering system.

// Example 1: Add a decorative star icon
layer.add(new window.Konva.Path({
    x: 100,
    y: 150,
    data: 'M12,2l3.09,6.26L22,9.27l-5,4.87L18.18,22L12,18.77L5.82,22L7,14.14L2,9.27l6.91-1.01L12,2Z',
    fill: '#ff6b6b',
    scaleX: 1.5,
    scaleY: 1.5,
    opacity: 0.8,
    rotation: 15,
    shadowColor: '#000',
    shadowBlur: 8,
    shadowOpacity: 0.3
}));

// Example 2: Add a decorative wave border at bottom
layer.add(new window.Konva.Path({
    x: 0,
    y: h - 40,
    data: 'M0,20 Q50,0 100,20 T200,20 T300,20 T400,20 T500,20 T600,20',
    stroke: '#4ecdc4',
    strokeWidth: 3,
    fill: 'transparent',
    opacity: 0.7
}));

// Example 3: Add a gear/settings icon for tech themes
layer.add(new window.Konva.Path({
    x: w - 60,
    y: 30,
    data: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    fill: '#45b7d1',
    scaleX: 2,
    scaleY: 2,
    opacity: 0.6
}));

// Example 4: Add a decorative checkmark for success themes
layer.add(new window.Konva.Path({
    x: 50,
    y: 100,
    data: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z',
    fill: '#4CAF50',
    scaleX: 3,
    scaleY: 3,
    opacity: 0.8,
    shadowColor: '#388E3C',
    shadowBlur: 6,
    shadowOpacity: 0.4
}));

FORBIDDEN MODIFICATIONS:
- Function signature or Promise structure
- Overflow prevention logic (fontSize reduction loops)
- Core rendering flow or error handling
- Security patterns or validation logic

EXECUTION REQUIREMENTS:
- Generate a complete, functional static async method with custom name
- Ensure code compiles and executes without errors
- Maintain responsive design principles
- Apply the user's requested visual theme consistently across all slides

OUTPUT FORMAT: <custom_style>[COMPLETE FUNCTION CODE WITH CUSTOM NAME]</custom_style>



`
            ;
    }

    // AI Integration methods
    static async generateCustomStyle() {
        const modelSelect = document.getElementById('diy-model-select');
        const promptInput = document.getElementById('diy-prompt-input');
        const createButton = document.querySelector('.diy-btn-primary');

        if (!modelSelect || !promptInput) return;

        const selectedModel = modelSelect.value;
        const prompt = promptInput.value.trim();

        if (!selectedModel) {
            alert(window.Lang ? Lang.get('stylePleaseSelectModel') : 'Please select an AI model');
            return;
        }

        if (!prompt) {
            alert(window.Lang ? Lang.get('stylePleaseEnterDescription') : 'Please enter a style description');
            return;
        }

        // Create abort controller for this generation
        StyleDIY.generationAbortController = new AbortController();

        // Show loading state and update cancel button
        const originalText = createButton.textContent;
    createButton.textContent = (window.Lang ? Lang.get('creatingEllipsis') : 'Creating...');
        createButton.disabled = true;

        // Update cancel button to show abort functionality
        const cancelButton = document.querySelector('.diy-btn-secondary');
            if (cancelButton) {
            cancelButton.textContent = (window.Lang ? Lang.get('cancelGeneration') : 'Cancel Generation');
            cancelButton.onclick = () => StyleDIY.abortgeneration();
        }

        // Show progress in button
        let dots = 0;
        const loadingInterval = setInterval(() => {
            dots = (dots + 1) % 4;
            createButton.textContent = 'Creating' + '.'.repeat(dots);
        }, 500);

        try {
           //  //console.log('Generating style with model:', selectedModel);
           //  //console.log('Prompt:', prompt);

            // STEP 1: Unload any previously loaded models to ensure clean memory
            createButton.textContent = (window.Lang ? Lang.get('preparingAI') : 'Preparing AI...');
            try {
                await StyleDIY.unloadOllamaModels();
               //  //console.log('StyleDIY: Successfully unloaded previous models');
            } catch (unloadError) {
                console.warn('StyleDIY: Warning - could not unload models:', unloadError.message);
                // Don't fail the entire process if unloading fails, just log the warning
            }

            // STEP 2: Generate the custom style
            createButton.textContent = (window.Lang ? Lang.get('generatingStyle') : 'Generating Style...');
            const systemPrompt = StyleDIY.getDIYSystemPrompt();
            const response = await StyleDIY.sendToOllama(prompt, systemPrompt, selectedModel, StyleDIY.generationAbortController.signal);

            // Log the raw AI response for debugging
           //  //console.log('=== RAW AI RESPONSE START ===');
           //  //console.log('Raw response:', response);
           //  //console.log('=== RAW AI RESPONSE END ===');

            if (response && response.trim()) {
               //  //console.log('Generated custom style code:', response);

                // Parse and validate the generated code
                try {
                    const customFunction = StyleDIY.parseCustomFunction(response);
                   //  //console.log('Custom style function parsed successfully');

                    // TASK 2: If there's already a style present, move it to saved styles
                    if (StyleDIY.lastGeneratedStyleInfo) {
                       //  //console.log('StyleDIY: Moving current style to saved styles:', StyleDIY.lastGeneratedStyleInfo.name);
                        // Add the current style to saved styles array if not already there
                        const existingIndex = StyleDIY.savedStyles.findIndex(style =>
                            style.name === StyleDIY.lastGeneratedStyleInfo.name &&
                            style.prompt === StyleDIY.lastGeneratedStyleInfo.prompt &&
                            style.model === StyleDIY.lastGeneratedStyleInfo.model
                        );
                        if (existingIndex === -1) {
                            StyleDIY.savedStyles.push({ ...StyleDIY.lastGeneratedStyleInfo });
                           //  //console.log('StyleDIY: Added previous style to saved styles');
                        }
                    }

                    // Store the generated style for immediate use (raw code)
                    StyleDIY.lastGeneratedStyle = response;

                    // Check for name collisions and resolve them before storing
                    let finalStyleName = StyleDIY._lastParsedFunctionName || 'Custom Style';
                    let finalFunctionName = StyleDIY.sanitizeAndValidateFunctionName(StyleDIY._lastParsedFunctionName);

                    // Check if this name already exists in saved styles or current style
                    const nameExists = (name) => {
                        // Check current style
                        if (StyleDIY.lastGeneratedStyleInfo && StyleDIY.lastGeneratedStyleInfo.name === name) {
                            return true;
                        }
                        // Check saved styles
                        return StyleDIY.savedStyles.some(style => style.name === name);
                    };

                    // If name collision detected, append a counter
                    if (nameExists(finalStyleName)) {
                        let counter = 2;
                        let originalName = finalStyleName;
                        while (nameExists(`${originalName} ${counter}`)) {
                            counter++;
                        }
                        finalStyleName = `${originalName} ${counter}`;
                       //  //console.log(`StyleDIY: Name collision detected, renamed from "${originalName}" to "${finalStyleName}"`);

                        // Also update the function name to match
                        finalFunctionName = StyleDIY.sanitizeAndValidateFunctionName(`render${originalName}${counter}`);

                        // Update the stored function name for consistency
                        StyleDIY._lastParsedFunctionName = finalStyleName;
                    }

                    // Store the style info as JSON for future DB storage: { name, prompt, code, model }
                    StyleDIY.lastGeneratedStyleInfo = {
                        name: finalStyleName,
                        prompt: prompt,
                        code: response,
                        model: selectedModel
                    };

                   //  //console.log('StyleDIY: Stored new style info for DB:', StyleDIY.lastGeneratedStyleInfo);
                   //  //console.log('StyleDIY: Current saved styles count:', StyleDIY.savedStyles.length);

                    // Update DIY card behavior to allow selection
                    StyleDIY.updateDIYCardBehavior();

                    // Close modal 
                    StyleDIY.closeDIYModal();

                    // Auto-select DIY style in sidebar and trigger re-render - WAIT for completion
                    createButton.textContent = (window.Lang ? Lang.get('applyingStyle') : 'Applying Style...');

                    try {
                        await StyleDIY.activateDIYStyleAndWaitForCompletion();

                        // If we get here, the style was applied successfully
                        alert(window.Lang ? Lang.get('customStyleCreatedApplied') : 'Custom style created and applied successfully!');

                    } catch (styleError) {
                        console.error('StyleDIY: Error applying generated style:', styleError);

                        // Clear the problematic style
                        StyleDIY.lastGeneratedStyle = null;
                        StyleDIY.lastGeneratedStyleInfo = null;
                        StyleDIY._lastParsedFunctionName = null;

                        // Reset DIY card to default appearance
                        const diyCard = document.querySelector('.sidebar-style-card.diy');
                        if (diyCard) {
                            diyCard.style.border = '';
                            diyCard.title = (window.Lang ? Lang.get('styleDIYCardCreate') : '🎨 DIY Style (Create Custom AI-Generated Styles)');
                        }

                        alert(window.Lang ? Lang.get('styleNotCompatible') : 'The AI-generated style is not compatible with the presentation system. Please try again with a different description or model.');
                    }

                    // TODO: Apply the style immediately or notify the main presentation system
                    // For now, we'll store it and let the user know it's ready

                } catch (parseError) {
                    console.error('Error parsing generated style:', parseError);
                    alert(window.Lang ? Lang.get('aiGeneratedCodeIssues') : 'The AI generated code has issues. Please try again with a different description.');
                }
            } else {
                alert(window.Lang ? Lang.get('noResponseFromAI') : 'No response received from AI. Please try again.');
            }

        } catch (error) {
            console.error('Style generation error:', error);

            // Check if it was an abort error
            if (error.name === 'AbortError') {
               //  //console.log('StyleDIY: Style generation was cancelled by user');
                alert(window.Lang ? Lang.get('styleGenerationCancelled') : 'Style generation cancelled.');
            } else {
                alert(window.Lang ? Lang.get('errorGeneratingStyleOllama') : 'Error generating style. Please check that Ollama is running and try again.');
            }
        } finally {
            clearInterval(loadingInterval);
            createButton.textContent = originalText;
            createButton.disabled = false;

            // Reset cancel button
            const cancelButton = document.querySelector('.diy-btn-secondary');
            if (cancelButton) {
                cancelButton.textContent = 'Cancel';
                cancelButton.onclick = () => StyleDIY.closeDIYModal();
            }

            // Clear abort controller
            StyleDIY.generationAbortController = null;
        }
    }

    // Adapted model parameters function for DIY (from OllamaAPI.getModelParameters)
    static getDIYModelParameters(modelName) {
        // If no parameters file is loaded or no model name provided, return empty object
        if (!window.MODEL_PARAMETERS || !modelName) {
            return {};
        }

        // Get the base model name (before any ":" separator)
        const baseModelName = modelName.split(':')[0].toLowerCase().trim();

        // First try exact match
        if (window.MODEL_PARAMETERS[baseModelName]) {
           //  //console.log(`StyleDIY: Using custom parameters for ${baseModelName} (exact match)`);
            return window.MODEL_PARAMETERS[baseModelName];
        }

        // Sort parameter keys by length (descending) to prioritize more specific matches
        const sortedKeys = Object.keys(window.MODEL_PARAMETERS).sort((a, b) => b.length - a.length);

        // Then look for most specific prefix match
        for (const prefix of sortedKeys) {
            if (baseModelName.startsWith(prefix)) {
               //  //console.log(`StyleDIY: Using custom parameters for ${baseModelName} (matched prefix ${prefix})`);
                return window.MODEL_PARAMETERS[prefix];
            }
        }

        // Finally, try substring match as fallback
        for (const key of sortedKeys) {
            if (baseModelName.includes(key)) {
               //  //console.log(`StyleDIY: Using custom parameters for ${baseModelName} (matched substring ${key})`);
                return window.MODEL_PARAMETERS[key];
            }
        }

        // No match found, return empty object (use Ollama defaults)
       //  //console.log(`StyleDIY: No custom parameters for ${baseModelName}, using defaults`);
        return {};
    }

    // Simplified Ollama API call for DIY style generation (adapted from OllamaAPI.sendToOllama)
    static async sendToOllama(userPrompt, systemPrompt, selectedModel, abortSignal = null, requestId = null) {
       //  //console.log('StyleDIY: Sending request to Ollama...', { requestId: requestId || '<none>' });

        const modelParams = StyleDIY.getDIYModelParameters(selectedModel);
        const contextSelector = document.getElementById('context-selector');
        const selectedContext = contextSelector ? parseInt(contextSelector.value, 10) : NaN;
        const contextSize = Number.isFinite(selectedContext) && selectedContext > 0 ? selectedContext : 8192;

        // Prepare request payload (simplified - no streaming, no visual, no thinking)
        const jsonPost = {
            model: selectedModel,
            keep_alive: "-1s",
            stream: false, // We want complete response, not streaming
            system: systemPrompt,
            prompt: userPrompt,
            raw: false,
            think: false,
            options: {
                num_ctx: contextSize,
                ...modelParams  // Spread in any model-specific parameters
            }
        };

        try {
            let routing = await OllamaAPI.getApiRoutingForModel(selectedModel);

            // Keep cloud auth flow consistent with chat before direct cloud calls.
            if (routing && routing.source === 'cloud') {
                const ensureCloudKey = window.chatTab && typeof window.chatTab.ensureCloudApiKeyForSend === 'function'
                    ? window.chatTab.ensureCloudApiKeyForSend.bind(window.chatTab)
                    : null;

                if (ensureCloudKey) {
                    const hasCloudKey = await ensureCloudKey();
                    if (!hasCloudKey) {
                        throw new Error('Cloud API key required');
                    }
                    routing = await OllamaAPI.getApiRoutingForModel(selectedModel);
                }
            }

            const payload = {
                ...jsonPost,
                model: routing.modelName || selectedModel
            };

            if (routing && routing.source === 'cloud') {
                // Cloud gateway is stricter than local daemon for some fields.
                delete payload.keep_alive;
                delete payload.raw;
                delete payload.think;
                if (payload.options && Object.prototype.hasOwnProperty.call(payload.options, 'num_ctx')) {
                    delete payload.options.num_ctx;
                }
            }

            const fetchOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...routing.headers
                },
                body: JSON.stringify(payload),
                signal: abortSignal // Add abort signal to fetch options
            };

           //  //console.log('StyleDIY: Sending request to Ollama API...', { requestId: requestId || '<none>' });
            let response = await fetch(`${routing.baseUrl}/generate`, fetchOptions);

            // Retry once for cloud 400 using a minimal options payload.
            if (!response.ok && response.status === 400 && routing && routing.source === 'cloud') {
                try {
                    const retryPayload = {
                        ...payload,
                        options: { ...(payload.options || {}) }
                    };
                    delete retryPayload.options.num_ctx;
                    const retryFetchOptions = {
                        ...fetchOptions,
                        body: JSON.stringify(retryPayload)
                    };
                    response = await fetch(`${routing.baseUrl}/generate`, retryFetchOptions);
                } catch (_retryError) {
                    // Keep original response handling below.
                }
            }

            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 429) {
                    throw new Error(`${(window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached. You may have hit a daily or weekly limit. Please wait for reset. Visit: https://ollama.com/settings to confirm your usage.'}${errorText ? `\n${errorText}` : ''}`);
                }
                if (response.status === 500) {
                    throw new Error('Ollama server error. Please restart Ollama and try again.');
                }
                throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
            }


            // Since we're not streaming, we get the complete response
            const data = await response.json();

            // Debug: Log whether the AI response contains 'thinking' and 'response' fields
            try {
                const hasThinkingData = data && Object.prototype.hasOwnProperty.call(data, 'thinking');
                const hasResponseData = !!(data && (Object.prototype.hasOwnProperty.call(data, 'response') || data?.message?.content));
               //  //console.log('StyleDIY: Ollama non-stream response - thinking field present?', hasThinkingData, 'response field present?', hasResponseData, 'model:', selectedModel, 'requestId:', requestId || '<none>');
            } catch (logErr) {
                console.warn('StyleDIY: Failed to inspect Ollama response for thinking field', logErr);
            }

            if (data.error) {
                throw new Error(`Ollama error: ${data.error}`);
            }

            // Return the generated response (log summary with requestId)
            const responseText = data?.response || data?.message?.content || '';
            try { //console.log('StyleDIY: Returning response length:', responseText ? String(responseText).length : 0, 'requestId:', requestId || '<none>'); 
            } catch (e) {}
            return responseText;

        } catch (error) {
            console.error('StyleDIY Ollama connection error:', error);

            if (error.message.includes('Failed to fetch')) {
                throw new Error('Could not connect to Ollama. Please make sure Ollama is running.');
            }

            throw error;
        }
    }

    // Helper method to unload all models from Ollama to ensure clean memory
    static async unloadOllamaModels() {
        try {
            const modelName = document.getElementById('model-selector')?.value || '';
            const selectedProvider = (window.OllamaAPI && typeof window.OllamaAPI.getSelectedModelSource === 'function')
                ? (window.OllamaAPI.getSelectedModelSource() || window.OllamaAPI.getModelSource?.(modelName) || 'local')
                : 'local';

            // Unload uses local daemon endpoints and should not run for cloud-only model selections.
            if (selectedProvider === 'cloud') {
                return;
            }

           //  //console.log('StyleDIY: Getting list of loaded Ollama models...');

            // First, get the list of currently loaded models using /api/ps
            const psResponse = await fetch('http://localhost:11434/api/ps', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!psResponse.ok) {
                throw new Error(`HTTP ${psResponse.status}: ${psResponse.statusText}`);
            }

            const psData = await psResponse.json();
           //  //console.log('StyleDIY: Ollama /api/ps response:', psData);

            // Extract loaded models from the response
            let loadedModels = [];
            if (psData && psData.models && Array.isArray(psData.models)) {
                loadedModels = psData.models.map(model => model.name || model.model).filter(Boolean);
            }

           //  //console.log('StyleDIY: Found loaded models:', loadedModels);

            if (loadedModels.length === 0) {
               //  //console.log('StyleDIY: No models currently loaded. Skipping unload.');
                return;
            }

            // Unload each model individually
            const unloadPromises = loadedModels.map(async (modelName) => {
                try {
                   //  //console.log('StyleDIY: Unloading model:', modelName);

                    const unloadResponse = await fetch('http://localhost:11434/api/generate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: modelName,
                            keep_alive: 0,
                            stream: false
                        })
                    });

                    let unloadData = null;
                    try {
                        unloadData = await unloadResponse.json();
                    } catch (_jsonErr) {
                        unloadData = null;
                    }
                    /* console.log(`StyleDIY: Unload response for ${modelName}:`, {
                        status: unloadResponse.status,
                        ok: unloadResponse.ok,
                        data: unloadData
                    }); */

                    if (!unloadResponse.ok) {
                        if (unloadResponse.status === 429) {
                            console.warn(`StyleDIY: Unload rate-limited (429) for ${modelName}.`, (window.Lang && typeof Lang.get === 'function' && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached (429).');
                            return;
                        }
                        console.warn(`StyleDIY: Warning - failed to unload ${modelName}: ${unloadResponse.status} ${unloadResponse.statusText}`);
                    } else {
                       //  //console.log(`StyleDIY: Successfully triggered unload for model: ${modelName}`);
                    }

                } catch (modelError) {
                    console.error(`StyleDIY: Error unloading model ${modelName}:`, modelError);
                }
            });

            // Wait for all unload operations to complete
            await Promise.all(unloadPromises);

           //  //console.log('StyleDIY: All model unload operations completed');

            // Wait a brief moment for the unloads to complete
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error('StyleDIY: Error in unloadOllamaModels:', error);
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Could not connect to Ollama to unload models.');
            }
            throw error;
        }
    }

    // Helper method to activate DIY style in the sidebar and trigger re-render
    static activateDIYStyle() {
        try {
           //  //console.log('StyleDIY: Attempting to activate DIY style in sidebar');

            // Find the presentation sidebar instance
            const sidebarElement = document.querySelector('.presentation-sidebar');
            if (sidebarElement) {
               //  //console.log('StyleDIY: Found sidebar element');

                // Find the DIY style card and simulate click to select it
                const diyCard = sidebarElement.querySelector('.sidebar-style-card.diy');
                if (diyCard) {
                   //  //console.log('StyleDIY: Found DIY style card');

                    // Remove selected class from all cards
                    const allCards = sidebarElement.querySelectorAll('.sidebar-style-card');
                    allCards.forEach(card => {
                        card.classList.remove('selected');
                       //  //console.log('StyleDIY: Removed selected from card:', card.className);
                    });

                    // Add selected class to DIY card
                    diyCard.classList.add('selected');
                   //  //console.log('StyleDIY: Added selected class to DIY card');

                    // Try different approaches to find the sidebar instance and trigger re-render
                    const sidebarInstance = StyleDIY.findSidebarInstance();

                    // If we found a sidebar instance, trigger the style selection
                    if (sidebarInstance && typeof sidebarInstance.selectStyle === 'function') {
                       //  //console.log('StyleDIY: Calling sidebar selectStyle method');
                        sidebarInstance.selectStyle('diy');
                       //  //console.log('StyleDIY: Style selection triggered successfully');
                    } else {
                        console.warn('StyleDIY: No sidebar instance found, trying manual re-render approach');

                        // Alternative approach: Try to find preview window and manually trigger render
                        StyleDIY.tryManualRerender();
                    }

                   //  //console.log('StyleDIY: Activated DIY style in sidebar');
                } else {
                    console.warn('StyleDIY: Could not find DIY style card in sidebar');
                    // List all available style cards for debugging
                    const allCards = sidebarElement.querySelectorAll('.sidebar-style-card');
                    /* console.log('StyleDIY: Available style cards:',
                        Array.from(allCards).map(card => card.className)); */
                }
            } else {
                console.warn('StyleDIY: Could not find presentation sidebar');
            }
        } catch (error) {
            console.error('StyleDIY: Error activating DIY style:', error);
        }
    }

    // Enhanced method that waits for DIY style activation to complete and validates success
    static async activateDIYStyleAndWaitForCompletion() {
        return new Promise((resolve, reject) => {
            let renderingStarted = false;
            let renderingCompleted = false;
            let hasError = false;

           //  //console.log('StyleDIY: Starting DIY style activation with completion tracking');

            // Set up error monitoring - listen for DIY style errors
            const originalConsoleError = console.error;
            const errorListener = (...args) => {
                const errorMessage = args.join(' ');
                if (errorMessage.includes('DIY Style Error:') ||
                    errorMessage.includes('undefined is not a constructor') ||
                    errorMessage.includes('StyleDIY: Error details:')) {
                    hasError = true;
                   //  //console.log('StyleDIY: Detected rendering error during activation');
                }
                originalConsoleError.apply(console, args);
            };
            console.error = errorListener;

            // Set up success monitoring - listen for completion signals
            const originalConsoleLog = console.log;
            const logListener = (...args) => {
                const logMessage = args.join(' ');
                if (logMessage.includes('StyleDIY: Custom style rendering completed successfully')) {
                    renderingCompleted = true;
                   //  //console.log('StyleDIY: Detected successful rendering completion');
                } else if (logMessage.includes('StyleDIY: Falling back to classic style due to error')) {
                    hasError = true;
                   //  //console.log('StyleDIY: Detected fallback to classic style');
                }
                originalConsoleLog.apply(console, args);
            };
            //console.log = logListener;

            // Timeout function to avoid waiting forever
            const timeout = setTimeout(() => {
                console.error = originalConsoleError;
                //console.log = originalConsoleLog;

                if (!renderingStarted) {
                    reject(new Error('DIY style activation timed out - rendering never started'));
                } else if (hasError) {
                    reject(new Error('DIY style rendering failed with errors'));
                } else if (!renderingCompleted) {
                    reject(new Error('DIY style rendering timed out'));
                } else {
                    resolve();
                }
            }, 5000); // 5 second timeout

            // Start the activation process
            try {
                StyleDIY.activateDIYStyle();

                // Also try clicking the DIY card directly as backup
                setTimeout(() => {
                    const diyCard = document.querySelector('.sidebar-style-card.diy');
                    if (diyCard && diyCard.onclick) {
                       //  //console.log('StyleDIY: Triggering DIY card click handler as backup');
                        diyCard.click();
                        renderingStarted = true;
                    }
                }, 100);

                // Check periodically for completion
                const checkInterval = setInterval(() => {
                    if (renderingCompleted && !hasError) {
                        clearTimeout(timeout);
                        clearInterval(checkInterval);
                        console.error = originalConsoleError;
                        //console.log = originalConsoleLog;
                       //  //console.log('StyleDIY: Style activation completed successfully');
                        resolve();
                    } else if (hasError) {
                        clearTimeout(timeout);
                        clearInterval(checkInterval);
                        console.error = originalConsoleError;
                        //console.log = originalConsoleLog;
                        reject(new Error('DIY style rendering failed - AI generated incompatible code'));
                    }
                }, 200); // Check every 200ms

            } catch (activationError) {
                clearTimeout(timeout);
                console.error = originalConsoleError;
                //console.log = originalConsoleLog;
                reject(new Error(`DIY style activation failed: ${activationError.message}`));
            }
        });
    }

    // Alternative manual re-render approach
    static tryManualRerender() {
        try {
           //  //console.log('StyleDIY: Attempting manual re-render');

            // Search for preview window instances or stage containers
            const previewWindows = Object.keys(window).filter(key =>
                window[key] &&
                typeof window[key] === 'object' &&
                (window[key].stages || window[key].sidebar)
            );

           //  //console.log('StyleDIY: Found potential preview instances:', previewWindows);

            for (const windowKey of previewWindows) {
                const instance = window[windowKey];
                if (instance.stages && instance.parsedSlides && instance.sidebar) {
                   //  //console.log('StyleDIY: Found complete preview instance, triggering manual render');

                    // Set the sidebar's selected style to DIY
                    if (instance.sidebar) {
                        instance.sidebar.selectedStyle = 'diy';
                       //  //console.log('StyleDIY: Set sidebar selectedStyle to diy');

                        // Trigger the re-render
                        if (typeof instance.sidebar.renderSelectedStyle === 'function') {
                            instance.sidebar.renderSelectedStyle(
                                instance.stages,
                                instance.parsedSlides,
                                instance.slideImagesResult
                            ).then(() => {
                               //  //console.log('StyleDIY: Manual re-render completed successfully');
                            }).catch(error => {
                                console.error('StyleDIY: Manual re-render failed:', error);
                            });
                            return; // Success, exit
                        }
                    }
                }
            }

            console.warn('StyleDIY: Could not find suitable preview instance for manual re-render');
        } catch (error) {
            console.error('StyleDIY: Error in manual re-render:', error);
        }
    }


    // TASK 2: Methods for managing saved styles
    static makeStyleActive(styleInfo) {
        try {
           //  //console.log('StyleDIY: Making style active:', styleInfo.name);

            // DO NOT automatically save the current style to saved styles
            // The user should explicitly choose to save styles they want to keep
            // This prevents cluttering saved styles with unwanted styles

            // DO NOT remove the selected style from saved styles - keep all saved styles intact!
            // The saved styles array should remain intact as a permanent collection
           //  //console.log('StyleDIY: Keeping selected style in saved styles collection');

            // Set the selected style as current (make a copy to avoid reference issues)
            StyleDIY.lastGeneratedStyle = styleInfo.code;
            StyleDIY.lastGeneratedStyleInfo = { ...styleInfo };

           //  //console.log('StyleDIY: Style activated successfully');
           //  //console.log('StyleDIY: Saved styles count after activation:', StyleDIY.savedStyles.length);

            // Update DIY card behavior and activate the style
            StyleDIY.updateDIYCardBehavior();
            StyleDIY.activateDIYStyle();
            StyleDIY.closeDIYStyleManager();

            alert((window.Lang ? Lang.get('styleNowActive') : 'Style "{name}" is now active!').replace('{name}', styleInfo.name));

        } catch (error) {
            console.error('StyleDIY: Error making style active:', error);
            alert(window.Lang ? Lang.get('errorActivatingStyle') : 'Error activating style. Please try again.');
        }
    }

    static async saveStyleToDatabase(styleInfo) {
        try {
           //  //console.log('StyleDIY: Saving style to database (START):', styleInfo && styleInfo.name);

            // Determine owner key from sessionStorage (hashed masterkey)
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
           //  //console.log('StyleDIY: saveStyleToDatabase - hashedMasterKey:', hashedMasterKey);
            if (!hashedMasterKey) {
                alert(window.Lang ? Lang.get('cannotSaveNoMasterKey') : 'Cannot save style: no master key available in session. Please re-open the app and enter your master key.');
                return;
            }

            // Prepare styleInfo copy and default fields
            const info = {
                name: styleInfo.name || 'Custom Style',
                prompt: styleInfo.prompt || '',
                code: styleInfo.code || '',
                model: styleInfo.model || '',
                is_active: styleInfo.is_active ? 1 : 0
            };

           //  //console.log('StyleDIY: saveStyleToDatabase - payload:', info);

            try {
                const id = await PaiperworkDB.insertCustomStyle(hashedMasterKey, info);
               //  //console.log('StyleDIY: Style saved to DB with id:', id);
                alert((window.Lang ? Lang.get('styleSavedToDatabase') : 'Style "{name}" saved to database!').replace('{name}', info.name));
                // Refresh manager UI so it reads from DB
                try { await StyleDIY.openDIYStyleManager(); } catch (e) { console.warn('StyleDIY: Could not re-open manager after save:', e); }
            } catch (dbErr) {
                console.error('StyleDIY: insertCustomStyle threw error:', dbErr);
                alert(window.Lang ? Lang.get('errorSavingStyleToDatabaseDetails') : 'Error saving style to database. See console for details.');
            }

        } catch (error) {
            console.error('StyleDIY: Error saving style to database:', error);
            alert(window.Lang ? Lang.get('errorSavingStyleToDatabase') : 'Error saving style to database. Please try again.');
        }
    }

    static async deleteStyle(styleInfo) {
        try {
            const confirmDelete = confirm((window.Lang ? Lang.get('styleDIYConfirmDeleteStyle') : `Are you sure you want to delete the style "{name}"? This action cannot be undone.`).replace('{name}', styleInfo.name));
            if (!confirmDelete) return;
           //  //console.log('StyleDIY: Deleting style:', styleInfo.name);

            // If the style has a DB id, prefer deleting from DB
            if (styleInfo.id) {
                try {
                    const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                    if (!hashedMasterKey) throw new Error('No master key');
                    await PaiperworkDB.deleteCustomStyle(hashedMasterKey, styleInfo.id);
                   //  //console.log('StyleDIY: Deleted style from DB id=', styleInfo.id);
                    alert((window.Lang ? Lang.get('styleHasBeenDeleted') : 'Style "{name}" has been deleted.').replace('{name}', styleInfo.name));
                    // Refresh the manager to reflect DB state
                    try { await StyleDIY.openDIYStyleManager(); } catch (e) { console.warn('StyleDIY: Could not re-open manager after delete:', e); }
                    return;
                } catch (err) {
                    console.error('StyleDIY: Error deleting style from DB:', err);
                    alert(window.Lang ? Lang.get('errorDeletingStyleDetails') : 'Error deleting style from database. See console for details.');
                    return;
                }
            }

            // Fallback: remove from saved styles array
            const styleIndex = StyleDIY.savedStyles.findIndex(style =>
                style.name === styleInfo.name && style.prompt === styleInfo.prompt
            );

            if (styleIndex !== -1) {
                StyleDIY.savedStyles.splice(styleIndex, 1);
               //  //console.log('StyleDIY: Style deleted from memory');
                // Refresh the style manager to update the UI
                try { StyleDIY.openDIYStyleManager(); } catch (e) { console.warn('StyleDIY: Could not re-open manager after memory delete:', e); }
                    alert((window.Lang ? Lang.get('styleHasBeenDeleted') : 'Style "{name}" has been deleted.').replace('{name}', styleInfo.name));
            } else {
                console.warn('StyleDIY: Style not found in saved styles');
                alert(window.Lang ? Lang.get('styleNotFound') : 'Style not found. It may have already been deleted.');
            }

        } catch (error) {
            console.error('StyleDIY: Error deleting style:', error);
            alert(window.Lang ? Lang.get('errorDeletingStyle') : 'Error deleting style. Please try again.');
        }
    }

    // Simple methods for current style management using existing functions
    static async saveCurrentStyleToSaved() {
        try {
            if (!StyleDIY.lastGeneratedStyleInfo) {
                alert(window.Lang ? Lang.get('noActiveStyleToSave') : 'No active style to save.');
                return;
            }

            // Prepare style payload
            const style = { ...StyleDIY.lastGeneratedStyleInfo };

            // Ensure master key is present
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            if (!hashedMasterKey) {
                alert(window.Lang ? Lang.get('cannotSaveNoMasterKey') : 'Cannot save style: no master key available in session. Please re-open the app and enter your master key.');
                return;
            }

           //  //console.log('StyleDIY: Saving current style to DB:', style.name);
            try {
                const id = await PaiperworkDB.insertCustomStyle(hashedMasterKey, style);
               //  //console.log('StyleDIY: saveCurrentStyleToSaved - saved id=', id);
                alert((window.Lang ? Lang.get('styleHasBeenSaved') : 'Style "{name}" has been saved!').replace('{name}', style.name));
                // Refresh manager to show DB-backed list
                try { await StyleDIY.openDIYStyleManager(); } catch (e) { console.warn('StyleDIY: Could not open manager after saving current style:', e); }
            } catch (err) {
                console.error('StyleDIY: Error saving current style to DB:', err);
                alert(window.Lang ? Lang.get('errorSavingStyleDetails') : 'Error saving style. See console for details.');
            }

        } catch (error) {
            console.error('StyleDIY: Error saving current style:', error);
            alert(window.Lang ? Lang.get('errorSavingStyle') : 'Error saving style. Please try again.');
        }
    }

    static deleteCurrentStyleAndReset() {
        try {
            if (!StyleDIY.lastGeneratedStyleInfo) {
                alert(window.Lang ? Lang.get('noActiveStyleToDelete') : 'No active style to delete.');
                return;
            }

            const confirmDelete = confirm((window.Lang ? Lang.get('styleDIYConfirmDeleteActive') : `Are you sure you want to delete the active style "{name}"? This will switch back to the Classic style.`).replace('{name}', StyleDIY.lastGeneratedStyleInfo.name));
            if (!confirmDelete) return;

           //  //console.log('StyleDIY: Deleting current style only, preserving saved styles');
           //  //console.log('StyleDIY: Saved styles count before deletion:', StyleDIY.savedStyles.length);

            // Clear ONLY the current style - DO NOT touch savedStyles array
            StyleDIY.lastGeneratedStyle = null;
            StyleDIY.lastGeneratedStyleInfo = null;
            StyleDIY._lastParsedFunctionName = null;

            // Update DIY card behavior based on whether we have saved styles
            StyleDIY.updateDIYCardBehavior();

            // Close the style manager
            StyleDIY.closeDIYStyleManager();

            // Switch to classic style properly
            try {
                // First, try using the sidebar instance
                const sidebarInstance = StyleDIY.findSidebarInstance();
                if (sidebarInstance && typeof sidebarInstance.selectStyle === 'function') {
                   //  //console.log('StyleDIY: Switching to classic style via sidebar instance');
                    sidebarInstance.selectStyle('classic');
                } else {
                    // Fallback: manually update the UI
                   //  //console.log('StyleDIY: Manually switching to classic style');
                    const sidebarElement = document.querySelector('.presentation-sidebar');
                    if (sidebarElement) {
                        // Remove selected class from DIY card
                        const diyCard = sidebarElement.querySelector('.sidebar-style-card.diy');
                        if (diyCard) {
                            diyCard.classList.remove('selected');
                        }

                        // Add selected class to classic card
                        const classicCard = sidebarElement.querySelector('.sidebar-style-card.classic');
                        if (classicCard) {
                            classicCard.classList.add('selected');
                            // Trigger click to ensure proper activation
                            if (classicCard.onclick) {
                                classicCard.click();
                            }
                        }
                    }
                }

               //  //console.log('StyleDIY: Successfully switched to classic style');
               //  //console.log('StyleDIY: Saved styles count after deletion:', StyleDIY.savedStyles.length);

                alert(window.Lang ? Lang.get('currentStyleDeletedSwitchedClassic') : 'Current style deleted successfully! Switched back to Classic style.');

            } catch (switchError) {
                console.error('StyleDIY: Error switching to classic style:', switchError);
                alert(window.Lang ? Lang.get('styleDeletedSwitchIssue') : 'Style deleted, but there was an issue switching to Classic style. Please manually select Classic style.');
            }

        } catch (error) {
            console.error('StyleDIY: Error deleting current style:', error);
            alert(window.Lang ? Lang.get('errorDeletingStyle') : 'Error deleting style. Please try again.');
        }
    }

    // DIY Modal functionality
    static openDIYModal() {
        // Remove existing modal if any
        StyleDIY.closeDIYModal();

        // Check if there's already a generated style
        const hasExistingStyle = !!StyleDIY.lastGeneratedStyleInfo;

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'diy-modal-overlay';
        overlay.onclick = (e) => {
            if (e.target === overlay) StyleDIY.closeDIYModal();
        };

        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'diy-modal';

        // Modal header
        const header = document.createElement('div');
        header.className = 'diy-modal-header';
            header.innerHTML = `
            <h2>${window.Lang ? Lang.get('styleDIYModalCreateTitle') : 'Create Custom Style'}</h2>
            <button class="diy-modal-close" onclick="window.StyleDIY.closeDIYModal()">×</button>
        `;

        // Modal content
        const content = document.createElement('div');
        content.className = 'diy-modal-content';

        // Status section (show if there's an existing style)
        if (hasExistingStyle) {
            const statusSection = document.createElement('div');
            statusSection.className = 'diy-form-section diy-status-section';
            statusSection.innerHTML = `
                <div class="diy-status-info">
                    <span class="diy-status-icon">✅</span>
                    <span>${window.Lang ? Lang.get('styleDIYStatusExistingActive') : 'A custom style is already active. Creating a new one will replace it.'}</span>
                </div>
            `;
            content.appendChild(statusSection);
        }

        // --- TEMPLATE CARDS: small rounded cards with available SlideStyles names ---
        // Gather styles from the sidebar DOM if available
        let templateStyles = [];
        try {
            const sidebarCards = document.querySelectorAll('.presentation-sidebar .sidebar-style-card');
            sidebarCards.forEach(card => {
                // pick a class that represents the style key (exclude generic classes)
                const cls = Array.from(card.classList).find(c => c !== 'sidebar-style-card' && c !== 'selected');
                const key = cls || (card.dataset && card.dataset.key) || card.getAttribute('data-key') || card.title || card.textContent.trim();
                const label = card.title || card.textContent.trim() || key;
                // Skip the diy card itself (it's a control, not a style)
                if (String(key).toLowerCase().includes('diy')) return;
                templateStyles.push({ key: key, label: label });
            });
        } catch (e) {
            console.warn('StyleDIY: Could not read sidebar styles:', e);
        }

        // Fallback small list if none found
        if (!templateStyles || templateStyles.length === 0) {
            templateStyles = [
                { key: 'classic', label: 'Classic' },
                { key: 'purple-glass', label: 'Purple Glass' },
                { key: 'brutalist', label: 'Brutalist' },
                { key: 'corporate', label: 'Corporate' }
            ];
        }

        // Create container for template cards
        const templatesContainer = document.createElement('div');
        templatesContainer.className = 'diy-form-section diy-template-cards-section';
    templatesContainer.innerHTML = `<label>${window.Lang ? Lang.get('styleDIYLabelTemplateReference') : 'Template Reference:'}</label>`;
        const row = document.createElement('div');
        row.className = 'diy-template-cards-row';

        // Hidden input to store selection
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = 'diy-template-selected';
        hiddenInput.value = templateStyles[0] ? templateStyles[0].key : '';
        templatesContainer.appendChild(hiddenInput);

        templateStyles.forEach((s, idx) => {
            const cardBtn = document.createElement('button');
            cardBtn.type = 'button';
            cardBtn.className = 'diy-template-card' + (idx === 0 ? ' selected' : '');
            cardBtn.textContent = s.label;
            cardBtn.dataset.styleKey = s.key;
            cardBtn.onclick = (ev) => {
                ev.stopPropagation();
                row.querySelectorAll('.diy-template-card').forEach(c => c.classList.remove('selected'));
                cardBtn.classList.add('selected');
                document.getElementById('diy-template-selected').value = s.key;
            };
            row.appendChild(cardBtn);
        });
        templatesContainer.appendChild(row);
        content.appendChild(templatesContainer);
        // --- end template cards ---

        // Model selection
        const modelSection = document.createElement('div');
        modelSection.className = 'diy-form-section';
        modelSection.innerHTML = `
            <label for="diy-model-select">${window.Lang ? Lang.get('styleDIYLabelModel') : 'AI Model:'}</label>
            <select id="diy-model-select" class="diy-select">
                <option value="">${window.Lang ? Lang.get('styleDIYPlaceholderLoadingModels') : 'Loading models...'}</option>
            </select>
        `;

        // Style prompt input
        const promptSection = document.createElement('div');
        promptSection.className = 'diy-form-section';
        promptSection.innerHTML = `
            <label for="diy-prompt-input">${window.Lang ? Lang.get('styleDIYPromptLabel') : 'Style Description:'}</label>
            <textarea id="diy-prompt-input" class="diy-textarea" 
                placeholder="${window.Lang ? Lang.get('styleDIYPromptPlaceholder') : 'Example: Create a Ferrari racing style with red and black colors, carbon fiber textures, and speed-inspired elements'}"></textarea>
        `;

        // Action buttons
        const actions = document.createElement('div');
        actions.className = 'diy-modal-actions';
        const buttonText = hasExistingStyle ? (window.Lang ? Lang.get('styleDIYRegenerateStyle') : 'Regenerate Style') : (window.Lang ? Lang.get('styleDIYCreateStyle') : 'Create Style');
        actions.innerHTML = `
            <button class="diy-btn diy-btn-secondary" onclick="window.StyleDIY.closeDIYModal()">${window.Lang ? Lang.get('styleDIYCancel') : 'Cancel'}</button>
            <button class="diy-btn diy-btn-primary" onclick="window.StyleDIY.generateCustomStyle()">${buttonText}</button>
        `;

        content.appendChild(modelSection);
        content.appendChild(promptSection);
        content.appendChild(actions);

        modal.appendChild(header);
        modal.appendChild(content);
        overlay.appendChild(modal);

        // Inject modal styles
        StyleDIY.injectModalStyles();

        // Add minimal styles for template cards (avoid duplicate injection)
        if (!document.getElementById('diy-template-cards-styles')) {
            const css = document.createElement('style');
            css.id = 'diy-template-cards-styles';
            css.textContent = `
            .diy-template-cards-section { margin-bottom: 12px; }
            .diy-template-cards-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:6px; }
            .diy-template-card { background: linear-gradient(180deg,#ffffff,#f3f4f6); border:1px solid #e5e7eb; padding:6px 10px; border-radius:10px; cursor:pointer; font-size:13px; }
            .diy-template-card.selected { background: linear-gradient(135deg,#667eea,#764ba2); color:white; border-color:#5b21b6; box-shadow:0 8px 20px rgba(102,126,234,0.18); transform:translateY(-2px); }
            @media (prefers-color-scheme: dark) { .diy-template-card { background: #374151; border-color: #4b5563; color:#e5e7eb; } .diy-template-card.selected { background: linear-gradient(135deg,#10b981,#059669); color:white; } }
            `;
            document.head.appendChild(css);
        }

        // Add to document
        document.body.appendChild(overlay);

        // Load available models
        StyleDIY.loadOllamaModels();

        // Focus on prompt input
        setTimeout(() => {
            const promptInput = document.getElementById('diy-prompt-input');
            if (promptInput) promptInput.focus();
        }, 100);
    }

    static closeDIYModal() {
        const overlay = document.querySelector('.diy-modal-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // DIY Style Manager Modal - Shows when user already has styles
    static async openDIYStyleManager() {
        // Remove existing modals if any
        StyleDIY.closeDIYModal();
        StyleDIY.closeDIYStyleManager();

       //  //console.log('StyleDIY: Opening style manager modal');
        // Load saved styles from database (if master key available) before rendering
        let dbStyles = [];
        try {
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
            if (!hashedMasterKey) {
                console.warn('StyleDIY: No hashedMasterKey in sessionStorage; opening manager without DB styles');
            } else {
                dbStyles = await PaiperworkDB.getCustomStyles(hashedMasterKey) || [];
               //  //console.log('StyleDIY: Loaded', dbStyles.length, 'styles from DB');
                // Keep in-memory savedStyles in sync with DB to avoid UI mismatches
                try {
                    StyleDIY.savedStyles = Array.isArray(dbStyles) ? dbStyles.slice() : [];
                   //  //console.log('StyleDIY: synced in-memory savedStyles with DB, count=', StyleDIY.savedStyles.length);
                } catch (syncErr) {
                    console.warn('StyleDIY: Could not sync savedStyles with DB:', syncErr);
                }
            }
        } catch (err) {
            console.error('StyleDIY: Error loading saved styles from DB:', err);
        }

        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'diy-manager-overlay';
        overlay.onclick = (e) => {
            if (e.target === overlay) StyleDIY.closeDIYStyleManager();
        };

        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'diy-manager-modal';

        // Modal header
        const header = document.createElement('div');
        header.className = 'diy-manager-header';
        header.innerHTML = `
            <h2>DIY Style Manager</h2>
            <button class="diy-manager-close" onclick="window.StyleDIY.closeDIYStyleManager()">×</button>
        `;

        // Modal content
        const content = document.createElement('div');
        content.className = 'diy-manager-content';

        // Create new style card (reduced height to 30px as requested)
        const createNewCard = document.createElement('div');
        createNewCard.className = 'diy-style-card diy-create-new-card';
        createNewCard.style.minHeight = '30px';
        createNewCard.style.padding = '8px 16px';
        createNewCard.innerHTML = `
            <div class="diy-card-title">${window.Lang ? Lang.get('styleDIYCreateNewCardTitle') : 'Create New Style'}</div>
            <div class="diy-card-description">${window.Lang ? Lang.get('styleDIYCreateNewCardDescription') : 'Generate a new custom presentation style with AI'}</div>
        `;
        createNewCard.onclick = () => {
            StyleDIY.closeDIYStyleManager();
            StyleDIY.openDIYModal();
        };
        content.appendChild(createNewCard);

        // Current active style card (if exists) - now uses the JSON structure
        if (StyleDIY.lastGeneratedStyleInfo) {
            const currentStyleCard = document.createElement('div');
            currentStyleCard.className = 'diy-style-card diy-current-style-card';
            currentStyleCard.style.minHeight = 'auto'; // Allow card to expand for buttons
            currentStyleCard.style.padding = '16px';
            currentStyleCard.innerHTML = `
                <div class="diy-card-title">${StyleDIY.lastGeneratedStyleInfo.name}</div>
                <div class="diy-card-description">${window.Lang ? Lang.get('styleDIYCurrentStyleDescription') : 'Your latest AI-generated style (Currently Active)'}</div>
                <div class="diy-card-status">${window.Lang ? Lang.get('styleDIYStatusActive') : '✅ Active'}</div>
                <div class="diy-current-style-actions">
                    <button class="diy-current-action-btn diy-save-current-btn" onclick="event.stopPropagation(); window.StyleDIY.saveCurrentStyleToSaved()">
                        ${window.Lang ? Lang.get('styleDIYSaveStyle') : '💾 Save Style'}
                    </button>
                    <button class="diy-current-action-btn diy-delete-current-btn" onclick="event.stopPropagation(); window.StyleDIY.deleteCurrentStyleAndReset()">
                        ${window.Lang ? Lang.get('styleDIYDeleteStyle') : '🗑️ Delete Style'}
                    </button>
                </div>
            `;
            content.appendChild(currentStyleCard);
        }

        // TASK 2: Saved styles section with actual functionality
        const savedStylesSection = document.createElement('div');
        savedStylesSection.className = 'diy-saved-styles-section';

        // Create section header
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'diy-section-header';
        sectionHeader.innerHTML = `
            <h3>${window.Lang ? Lang.get('styleDIYSavedStylesHeader') : 'Saved Styles'}</h3>
            <span class="diy-section-subtitle">${(window.Lang ? Lang.get('styleDIYSavedCount') : '{count} Saved').replace('{count}', dbStyles.length)}</span>
        `;
        savedStylesSection.appendChild(sectionHeader);

        // Create saved styles container
        const savedStylesContainer = document.createElement('div');
        savedStylesContainer.className = 'diy-saved-styles-container';

        if (!dbStyles || dbStyles.length === 0) {
            // Show placeholder when no saved styles
            const placeholderCard = document.createElement('div');
            placeholderCard.className = 'diy-placeholder-card';
            placeholderCard.innerHTML = (window.Lang ? Lang.get('styleDIYNoSavedStyles') : `<div class="diy-placeholder-icon">💾</div><div class="diy-placeholder-text">No saved styles yet.<br>Create multiple styles to see them here.</div>`);
            savedStylesContainer.appendChild(placeholderCard);
        } else {
            // Display each DB-backed saved style as a list item
            dbStyles.forEach((styleInfo, index) => {
                const styleItem = document.createElement('div');
                styleItem.className = 'diy-saved-style-item';

                const name = styleInfo.name || 'Custom Style';
                const promptPreview = (styleInfo.prompt || '').substring(0, 60) + ((styleInfo.prompt || '').length > 60 ? '...' : '');

                const infoDiv = document.createElement('div');
                infoDiv.className = 'diy-saved-style-info';
                infoDiv.innerHTML = `<div class="diy-saved-style-name">${name}</div><div class="diy-saved-style-prompt">${promptPreview}</div>`;

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'diy-saved-style-actions';

                // Make Active button
                const makeActiveBtn = document.createElement('button');
                makeActiveBtn.className = 'diy-action-btn diy-make-active-btn';
                makeActiveBtn.textContent = (window.Lang ? Lang.get('styleDIYMakeActive') : 'Make Active');
                makeActiveBtn.onclick = (ev) => {
                    ev.stopPropagation();
                    // Use the DB-backed style object
                    StyleDIY.makeStyleActive({ ...styleInfo, code: styleInfo.code });
                };

                // NOTE: Removed per-item "Save" button — saved DB rows don't need a redundant Save control.

                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'diy-action-btn diy-delete-btn';
                deleteBtn.textContent = (window.Lang ? Lang.get('styleDIYDeleteBtn') : 'Delete');
                deleteBtn.onclick = async (ev) => {
                    ev.stopPropagation();
                    const confirmDelete = confirm((window.Lang ? Lang.get('styleDIYConfirmDeleteStyle') : `Are you sure you want to delete the style "{name}"? This action cannot be undone.`).replace('{name}', name));
                    if (!confirmDelete) return;
                    try {
                        const hashedMasterKey = sessionStorage.getItem('hashedMasterKey');
                        if (!hashedMasterKey) throw new Error('No master key');
                        await PaiperworkDB.deleteCustomStyle(hashedMasterKey, styleInfo.id);
                        alert((window.Lang ? Lang.get('styleHasBeenDeleted') : 'Style "{name}" deleted.').replace('{name}', name));
                        // refresh manager
                        StyleDIY.openDIYStyleManager();
                    } catch (err) {
                        console.error('StyleDIY: Error deleting style from DB:', err);
                        alert(window.Lang ? Lang.get('errorDeletingStyle') : 'Error deleting style. See console for details.');
                    }
                };

                actionsDiv.appendChild(makeActiveBtn);
                actionsDiv.appendChild(deleteBtn);

                styleItem.appendChild(infoDiv);
                styleItem.appendChild(actionsDiv);

                savedStylesContainer.appendChild(styleItem);
            });
        }

        savedStylesSection.appendChild(savedStylesContainer);
        content.appendChild(savedStylesSection);

        modal.appendChild(header);
        modal.appendChild(content);
        overlay.appendChild(modal);

        // Inject manager styles
        StyleDIY.injectManagerStyles();

        // Add to document
        document.body.appendChild(overlay);
    }

    static closeDIYStyleManager() {
        const overlay = document.querySelector('.diy-manager-overlay');
        if (overlay) {
            overlay.remove();
        }
    }


    // Helper method to apply the current style and trigger re-render
    static applyCurrentStyle() {
        try {
           //  //console.log('StyleDIY: Applying current custom style');

            // Find sidebar instance and trigger DIY style selection
            const sidebarInstance = StyleDIY.findSidebarInstance();
            if (sidebarInstance && typeof sidebarInstance.selectStyle === 'function') {
                sidebarInstance.selectStyle('diy');
               //  //console.log('StyleDIY: Successfully applied current custom style');
            } else {
                console.warn('StyleDIY: Could not find sidebar instance to apply style');
                // Try manual re-render as fallback
                StyleDIY.tryManualRerender();
            }
        } catch (error) {
            console.error('StyleDIY: Error applying current style:', error);
        }
    }

    // Inject styles for the DIY Style Manager modal
    static injectManagerStyles() {
        if (document.getElementById('diy-manager-styles')) return;

        const style = document.createElement('style');
        style.id = 'diy-manager-styles';
        style.textContent = `
            .diy-manager-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
                z-index: 10060;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: diyFadeIn 0.3s ease-out;
            }
            
            .diy-manager-modal {
                background: var(--background-color, #ffffff);
                border-radius: 24px;
                box-shadow: 0 32px 80px rgba(0, 0, 0, 0.25);
                width: 100%;
                max-width: 700px;
                max-height: 90vh;
                overflow: hidden;
                animation: diySlideIn 0.3s ease-out;
                border: 1px solid var(--border-color, #e5e7eb);
            }
            
            .diy-manager-header {
                padding: 10px 32px 10px 32px;
                border-bottom: 1px solid var(--border-color, #e5e7eb);
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .diy-manager-header h2 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                color: white;
            }
            
            .diy-manager-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                font-size: 24px;
                color: white;
                cursor: pointer;
                padding: 8px;
                border-radius: 12px;
                transition: all 0.2s ease;
                line-height: 1;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .diy-manager-close:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.05);
            }
            
            .diy-manager-content {
                padding: 32px;
                overflow-y: auto;
                max-height: calc(90vh - 140px);
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
            }
            
            .diy-style-card {
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                border: 2px solid #e2e8f0;
                border-radius: 16px;
                padding: 24px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .diy-style-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
                border-color: #667eea;
            }
            
            .diy-create-new-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-color: #667eea;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                height: 100%;
            }
            
            .diy-create-new-card:hover {
                background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
                box-shadow: 0 12px 32px rgba(102,126,234,0.4);
            }
            
            .diy-current-style-card {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                border-color: #10b981;
            }
            
            .diy-current-style-card:hover {
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
                box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4);
            }
            
            .diy-card-icon {
                font-size: 48px;
                margin-bottom: 16px;
                text-align: center;
            }
            
            .diy-card-title {
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 8px;
                text-align: center;
            }
            
            .diy-card-description {
                font-size: 14px;
                opacity: 0.9;
                text-align: center;
                line-height: 1.5;
                margin-bottom: 12px;
            }
            
            .diy-card-status {
                background: rgba(255, 255, 255, 0.2);
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-align: center;
                margin-top: 8px;
            }
            
            /* Action buttons for current active style card */
            .diy-current-style-actions {
                display: flex;
                gap: 8px;
                margin-top: 16px;
                justify-content: flex-start;
            }
            
            .diy-current-action-btn {
                padding: 8px 12px;
                border: none;
                border-radius: 8px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .diy-current-action-btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
            }
            
            .diy-save-current-btn:hover {
                background: rgba(16, 185, 129, 0.8);
                border-color: rgba(16, 185, 129, 0.9);
            }
            
            .diy-delete-current-btn:hover {
                background: rgba(239, 68, 68, 0.8);
                border-color: rgba(239, 68, 68, 0.9);
            }
            
            .diy-saved-styles-section {
                grid-column: 1 / -1;
                margin-top: 20px;
            }
            
            .diy-section-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 2px solid var(--border-color, #e5e7eb);
            }
            
            .diy-section-header h3 {
                margin: 0;
                font-size: 24px;
                font-weight: 700;
                color: var(--text-color, #1f2937);
            }
            
            .diy-section-subtitle {
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
            }
            
            .diy-placeholder-card {
                background: #f9fafb;
                border: 2px dashed #d1d5db;
                border-radius: 16px;
                padding: 40px;
                text-align: center;
                color: #6b7280;
            }
            
            .diy-placeholder-icon {
                font-size: 48px;
                margin-bottom: 16px;
                opacity: 0.5;
            }
            
            .diy-placeholder-text {
                font-size: 16px;
                line-height: 1.5;
                opacity: 0.7;
            }
            
            /* TASK 2: Saved styles list items and action buttons */
            .diy-saved-styles-container {
                max-height: 300px;
                overflow-y: auto;
                padding-right: 8px;
            }
            
            /* Custom scrollbar for saved styles container */
            .diy-saved-styles-container::-webkit-scrollbar {
                width: 6px;
            }
            
            .diy-saved-styles-container::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 3px;
            }
            
            .diy-saved-styles-container::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 3px;
            }
            
            .diy-saved-styles-container::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
            }
            
            .diy-saved-style-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 12px;
                transition: all 0.2s ease;
            }
            
            .diy-saved-style-item:hover {
                background: #f1f5f9;
                border-color: #cbd5e1;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .diy-saved-style-info {
                flex: 1;
                margin-right: 16px;
            }
            
            .diy-saved-style-name {
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 4px;
            }
            
            .diy-saved-style-prompt {
                font-size: 13px;
                color: #6b7280;
                line-height: 1.4;
            }
            
            .diy-saved-style-actions {
                display: flex;
                gap: 8px;
                flex-shrink: 0;
            }
            
            .diy-action-btn {
                padding: 6px 12px;
                border: none;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .diy-make-active-btn {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
            }
            
            .diy-make-active-btn:hover {
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }
            
            .diy-save-btn {
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
            }
            
            .diy-save-btn:hover {
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }
            
            .diy-delete-btn {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
            }
            
            .diy-delete-btn:hover {
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            }
            
            /* Dark mode styles */
            @media (prefers-color-scheme: dark) {
                .diy-manager-modal {
                    background: var(--background-color, #1f2937);
                    border-color: var(--border-color, #374151);
                }
                
                .diy-manager-header {
                    background: var(--header-background, #111827);
                    border-color: var(--border-color, #374151);
                }
                
                .diy-style-card {
                    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
                    border-color: #6b7280;
                    color: #f9fafb;
                }
                
                .diy-section-header {
                    border-color: var(--border-color, #374151);
                }
                
                .diy-section-header h3 {
                    color: var(--text-color, #f9fafb);
                }
                
                .diy-placeholder-card {
                    background: #374151;
                    border-color: #6b7280;
                    color: #9ca3af;
                }
                
                /* TASK 2: Dark mode styles for saved styles */
                .diy-saved-style-item {
                    background: #374151;
                    border-color: #6b7280;
                }
                
                .diy-saved-style-item:hover {
                    background: #4b5563;
                    border-color: #9ca3af;
                }
                
                .diy-saved-style-name {
                    color: #f9fafb;
                }
                
                .diy-saved-style-prompt {
                    color: #d1d5db;
                }
                
                /* Dark mode scrollbar styles */
                .diy-saved-styles-container::-webkit-scrollbar-track {
                    background: #4b5563;
                }
                
                .diy-saved-styles-container::-webkit-scrollbar-thumb {
                    background: #6b7280;
                }
                
                .diy-saved-styles-container::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
                
                /* Dark mode styles for current action buttons */
                .diy-current-action-btn {
                    background: rgba(75, 85, 99, 0.8);
                    color: #f9fafb;
                    border-color: rgba(107, 114, 128, 0.6);
                }
                
                .diy-current-action-btn:hover {
                    background: rgba(107, 114, 128, 0.9);
                    box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
                }
            }
        `;
        document.head.appendChild(style);
    }

    static async loadOllamaModels() {
        const select = document.getElementById('diy-model-select');
        if (!select) return;

        try {
            const cloudApiKey = (window.OllamaAPI && typeof window.OllamaAPI.getStoredCloudApiKey === 'function')
                ? await window.OllamaAPI.getStoredCloudApiKey()
                : '';

            const [localResult, cloudResult] = await Promise.allSettled([
                fetch('http://localhost:11434/api/tags'),
                fetch('/api/cloud/tags', {
                    headers: cloudApiKey ? { 'Authorization': `Bearer ${cloudApiKey}` } : undefined
                })
            ]);

            const localModels = (localResult.status === 'fulfilled' && localResult.value.ok)
                ? ((await localResult.value.json()).models || [])
                : [];
            const cloudModels = (cloudResult.status === 'fulfilled' && cloudResult.value.ok)
                ? ((await cloudResult.value.json()).models || [])
                : [];

            if (cloudResult.status === 'fulfilled' && cloudResult.value.status === 429) {
                console.warn('StyleDIY: Cloud model listing hit rate limit (429).', (window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached (429).');
            }
            if (localResult.status === 'fulfilled' && localResult.value.status === 429) {
                console.warn('StyleDIY: Local model listing hit rate limit (429).', (window.Lang && Lang.get('ollamaRateLimitExceeded')) || 'Ollama Cloud usage limit reached (429).');
            }

            if (window.OllamaAPI) {
                if (!(window.OllamaAPI.localModelNames instanceof Set)) window.OllamaAPI.localModelNames = new Set();
                if (!(window.OllamaAPI.cloudModelNames instanceof Set)) window.OllamaAPI.cloudModelNames = new Set();
                localModels.forEach(model => model?.name && window.OllamaAPI.localModelNames.add(model.name));
                cloudModels.forEach(model => {
                    if (!model?.name) return;
                    const normalizedCloudName = window.OllamaAPI.normalizeCloudModelName
                        ? window.OllamaAPI.normalizeCloudModelName(model.name)
                        : model.name;
                    window.OllamaAPI.cloudModelNames.add(normalizedCloudName);
                });
            }

            const allModels = [
                ...localModels.map(model => ({ ...model, provider: 'local' })),
                ...cloudModels.map(model => ({
                    ...model,
                    name: (window.OllamaAPI && window.OllamaAPI.normalizeCloudModelName)
                        ? window.OllamaAPI.normalizeCloudModelName(model.name)
                        : model.name,
                    provider: 'cloud'
                }))
            ];

            select.innerHTML = '<option value="">' + (window.Lang ? Lang.get('styleDIYSelectModel') : 'Select a model...') + '</option>';

            if (allModels && allModels.length > 0) {
                // Populate the dropdown with available models
                allModels.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.name;
                    option.textContent = model.name;
                    option.dataset.provider = model.provider || 'local';
                    select.appendChild(option);
                });

                // 2. Select the same model that is already selected in ChatTab
                const chatTabModelSelector = document.getElementById('model-selector');
                let selectedModel = null;

                if (chatTabModelSelector && chatTabModelSelector.value) {
                    selectedModel = chatTabModelSelector.value;
                   //  //console.log('StyleDIY: Found selected model in ChatTab:', selectedModel);

                    // Check if the ChatTab model exists in our available models
                    const modelExists = allModels.some(model => model.name === selectedModel);

                    if (modelExists) {
                        select.value = selectedModel;
                       //  //console.log('StyleDIY: Successfully synced with ChatTab model:', selectedModel);
                    } else {
                        console.warn('StyleDIY: ChatTab model not found in available models:', selectedModel);
                        selectedModel = null;
                    }
                }

                // Fallback: if no ChatTab model or it doesn't exist, auto-select first available model
                if (!selectedModel && allModels.length > 0) {
                    const fallbackModel = allModels[0].name;
                    select.value = fallbackModel;
                   //  //console.log('StyleDIY: Using fallback model:', fallbackModel);
                }

            } else {
                select.innerHTML = '<option value="">' + (window.Lang ? Lang.get('styleDIYNoModelsFound') : 'No models found') + '</option>';
                console.warn('StyleDIY: No models returned from Ollama');
            }
        } catch (error) {
            console.error('StyleDIY: Error loading Ollama models:', error);

            // Since the app already checks if Ollama is down on startup, this shouldn't happen
            // But if it does, show an error message instead of fallback options
                select.innerHTML = '<option value="">' + (window.Lang ? Lang.get('styleDIYModelsLoadError') : 'Error loading models - check Ollama connection') + '</option>';

            // Try to sync with ChatTab even if Ollama fetch failed
            const chatTabModelSelector = document.getElementById('model-selector');
            if (chatTabModelSelector && chatTabModelSelector.value) {
                const chatModel = chatTabModelSelector.value;
                const option = document.createElement('option');
                option.value = chatModel;
                option.textContent = `${chatModel} (From ChatTab)`;
                select.appendChild(option);
                select.value = chatModel;
               //  //console.log('StyleDIY: Synced with ChatTab model despite Ollama error:', chatModel);
            }
        }
    }

    static injectModalStyles() {
        if (document.getElementById('diy-modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'diy-modal-styles';
        style.textContent = `
            .diy-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
                z-index: 10050;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: diyFadeIn 0.3s ease-out;
            }
            
            .diy-modal {
                background: var(--background-color, #ffffff);
                border-radius: 20px;
                box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
                width: 100%;
                max-width: 600px;
                max-height: 90vh;
                overflow: hidden;
                animation: diySlideIn 0.3s ease-out;
                border: 1px solid var(--border-color, #e5e7eb);
            }
            
            .diy-modal-header {
                padding: 10px;
                border-bottom: 1px solid var(--border-color, #e5e7eb);
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: var(--header-background, #f9fafb);
            }
            
            .diy-modal-header h2 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
                color: var(--text-color, #1f2937);
            }
            
            .diy-modal-close {
                background: none;
                border: none;
                font-size: 28px;
                color: var(--text-color-secondary, #6b7280);
                cursor: pointer;
                padding: 4px;
                border-radius: 8px;
                transition: all 0.2s ease;
                line-height: 1;
            }
            
            .diy-modal-close:hover {
                background: var(--hover-background, #f3f4f6);
                color: var(--text-color, #1f2937);
            }
            
            .diy-modal-content {
                padding: 24px;
                overflow-y: auto;
                max-height: calc(90vh - 140px);
            }
            
            .diy-form-section {
                margin-bottom: 24px;
            }
            
            .diy-status-section {
                background: var(--status-background, #f0fdf4);
                border: 1px solid var(--status-border, #bbf7d0);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 24px;
            }
            
            .diy-status-info {
                display: flex;
                align-items: center;
                gap: 12px;
                color: var(--status-color, #166534);
                font-size: 14px;
                font-weight: 500;
            }
            
            .diy-status-icon {
                font-size: 16px;
                flex-shrink: 0;
            }
            
            .diy-form-section label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: var(--text-color, #1f2937);
                font-size: 14px;
            }
            
            .diy-select, .diy-textarea {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid var(--border-color, #e5e7eb);
                border-radius: 12px;
                font-size: 14px;
                color: var(--text-color, #1f2937);
                background: var(--input-background, #ffffff);
                transition: all 0.2s ease;
                font-family: inherit;
                box-sizing: border-box;
            }
            
            .diy-select:focus, .diy-textarea:focus {
                outline: none;
                border-color: #6366f1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            }
            
            .diy-textarea {
                resize: vertical;
                min-height: 100px;
                line-height: 1.5;
            }
            
            .diy-modal-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                padding-top: 24px;
                border-top: 1px solid var(--border-color, #e5e7eb);
            }
            
            .diy-btn {
                padding: 12px 24px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
                min-width: 100px;
            }
            
            .diy-btn-secondary {
                background: var(--secondary-background, #f3f4f6);
                color: var(--text-color, #1f2937);
                border: 1px solid var(--border-color, #e5e7eb);
            }
            
            .diy-btn-secondary:hover {
                background: var(--secondary-hover, #e5e7eb);
            }
            
            .diy-btn-primary {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: #ffffff;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            }
            
            .diy-btn-primary:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
            }
            
            .diy-btn-primary:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            
            @keyframes diyFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes diySlideIn {
                from { 
                    opacity: 0;
                    transform: translateY(-20px) scale(0.95);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            /* Dark mode styles */
            @media (prefers-color-scheme: dark) {
                .diy-modal {
                    background: var(--background-color, #1f2937);
                    border-color: var(--border-color, #374151);
                }
                
                .diy-modal-header {
                    background: var(--header-background, #111827);
                    border-color: var(--border-color, #374151);
                }
                
                .diy-modal-header h2 {
                    color: var(--text-color, #f9fafb);
                }
                
                .diy-modal-close {
                    color: var(--text-color-secondary, #9ca3af);
                }
                
                .diy-modal-close:hover {
                    background: var(--hover-background, #374151);
                    color: var(--text-color, #f9fafb);
                }
                
                .diy-form-section label {
                    color: var(--text-color, #f9fafb);
                }
                
                .diy-status-section {
                    background: var(--status-background, #064e3b);
                    border-color: var(--status-border, #047857);
                }
                
                .diy-status-info {
                    color: var(--status-color, #6ee7b7);
                }
                
                .diy-select, .diy-textarea {
                    background: var(--input-background, #374151);
                    border-color: var(--border-color, #4b5563);
                    color: var(--text-color, #f9fafb);
                }
                
                .diy-select:focus, .diy-textarea:focus {
                    border-color: #8b5cf6;
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
                }
                
                .diy-modal-actions {
                    border-color: var(--border-color, #374151);
                }
                
                .diy-btn-secondary {
                    background: var(--secondary-background, #374151);
                    color: var(--text-color, #f9fafb);
                    border-color: var(--border-color, #4b5563);
                }
                
                .diy-btn-secondary:hover {
                    background: var(--secondary-hover, #4b5563);
                }
            }
        `;
        document.head.appendChild(style);
    }

    static abortgeneration() {
       //  //console.log('StyleDIY: Aborting style generation...');

        // Abort StyleDIY generation if active
        if (StyleDIY.generationAbortController && typeof StyleDIY.generationAbortController.abort === 'function') {
            StyleDIY.generationAbortController.abort();
           //  //console.log('StyleDIY: Style generation aborted');
        }

        // Close modal after abort
        StyleDIY.closeDIYModal();
    }
}



window.StyleDIY = StyleDIY;
