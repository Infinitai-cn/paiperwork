window.THINKING_MODELS = [
    'deepseek-r1:1.5b',
    'deepseek-r1:7b',
    'deepseek-r1:8b',
    'deepseek-r1:14b',
    'deepseek-r1:32b',
    'deepseek-r1:70b',
    'deepseek-r1:671b',
    'qwen3:0.5b',
    'qwen3:1.7b',
    'qwen3:3b',
    'qwen3:7b',
    'qwen3:14b',
    'qwen3:32b',
    'qwen3:70b',
    'qwen3.5:35b-a3b',
    'magistral:24b',
    'gpt-oss',
    'qwen3:30b-a3b-thinking-2507',
    'deepseek-v3.1',
    'glm-4.7-flash:q4_K_M',
    'glm-4.7-flash:q8_0',
];

// Function to extract base model name (remove quantization suffix)
window.getBaseModelName = function(fullModelName) {
    if (!fullModelName) return '';
    
    // Remove quantization suffixes like -q4_0, -q8_0, -fp16, etc.
    // Pattern: anything after a dash followed by 'q', 'fp', or 'int'
    const baseModel = fullModelName.replace(/-(?:q\d+(?:_\d+)?|fp\d+|int\d+)(?:_\w+)?$/i, '');
    
    return baseModel.toLowerCase();
};

// Improved function to check if a model supports thinking
window.isThinkingModel = function(modelName) {
    if (!modelName) return false;
    
    // Extract base model name without quantization
    const baseModelName = window.getBaseModelName(modelName);
    
    //console.log('ThinkingModels: Checking model:', modelName, 'Base name:', baseModelName);
    
    // Check if the base model name matches any thinking model
    const isSupported = window.THINKING_MODELS.some(thinkingModel => {
        const normalizedThinkingModel = thinkingModel.toLowerCase();

        // Exact match is always allowed
        if (baseModelName === normalizedThinkingModel) return true;

        // If the thinking model entry includes an explicit variant (e.g. 'qwen3:3b'), require exact match
        if (normalizedThinkingModel.includes(':')) {
            return baseModelName === normalizedThinkingModel;
        }

        // Otherwise the entry is a base model (e.g. 'qwen3').
        // Only accept baseModel:VARIANT where VARIANT is a pure size token like '3b' or '1.5b'
        // This prevents matching extended qualifiers like '4b-instruct-2507'.
        if (baseModelName.startsWith(normalizedThinkingModel + ':')) {
            const afterColon = baseModelName.slice(normalizedThinkingModel.length + 1);
            // Accept variants such as '3b', '1.5b', '24b' etc. (integers or decimals followed by 'b')
            const pureSizeRegex = /^\d+(?:\.\d+)?b$/i;
            return pureSizeRegex.test(afterColon);
        }

        return false;
    });
    
    //console.log('ThinkingModels: Model', modelName, 'supports thinking:', isSupported);
    return isSupported;
};

//console.log('ThinkingModels: Thinking models support loaded');