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
    'qwen3.5:9b-q8_0',
    'qwen3.5:27b-q8_0',
    'qwen3.5:35b-a3b',
    'qwen3.5:35b',
    'qwen3.5:397b',
    'qwen3.6:27b-q8_0',
    'qwen3.6:35b-a3b-q8_0',
    'qwen3.6:27b-coding-mxfp8',
    'qwen3.6:35b-a3b-coding-nvfp4',
    'qwen3.6:35b-mlx',
    'qwen3.6:27b-mlx',
    'qwen3.6:27b-mtp-q8_0',
    'qwen3.8:27b',
    'magistral:24b',
    'gpt-oss',
    'qwen3:30b-a3b-thinking-2507',
    'deepseek-v3.1',
    'glm-4.7',
    'glm-5',
    'glm-5.1',
    'glm-4.7-flash:q4_K_M',
    'glm-4.7-flash:q8_0',
    'gemma4:26b-a4b-it-q8_0',
    'gemma4:31b',
    'deepseek-v4-pro',
    'deepseek-v4-flash',
];

// Function to extract base model name (remove quantization suffix)
window.getBaseModelName = function(fullModelName) {
    if (!fullModelName) return '';
    
    // Remove quantization suffixes like -q4_0, -q8_0, -fp16, etc.
    // Pattern: anything after a dash followed by 'q', 'fp', or 'int'
    const baseModel = fullModelName.replace(/-(?:q\d+(?:_\d+)?|fp\d+|int\d+)(?:_\w+)?$/i, '');
    
    return baseModel.toLowerCase();
};

// Normalize model names used in thinking matching.
// Keeps family/variant identity while removing representation-only suffixes.
window.normalizeThinkingModelName = function(modelName) {
    if (!modelName) return '';

    let normalized = window.getBaseModelName(modelName).trim().toLowerCase();

    // Treat :latest as equivalent to the base tag for matching.
    normalized = normalized.replace(/:latest$/i, '');

    return normalized;
};

// Improved function to check if a model supports thinking
window.isThinkingModel = function(modelName) {
    if (!modelName) return false;
    
    // Normalize selected model so quantized aliases resolve to the same token.
    const normalizedSelectedModel = window.normalizeThinkingModelName(modelName);
    
   //console.log('ThinkingModels: Checking model:', modelName, 'Base name:', baseModelName);
    
    // Check if the base model name matches any thinking model
    const isSupported = window.THINKING_MODELS.some(thinkingModel => {
        const normalizedThinkingModel = window.normalizeThinkingModelName(thinkingModel);

        // Exact match is always allowed
        if (normalizedSelectedModel === normalizedThinkingModel) return true;

        // If the thinking model entry includes an explicit variant (e.g. 'qwen3:3b'), require exact match
        if (normalizedThinkingModel.includes(':')) {
            return normalizedSelectedModel === normalizedThinkingModel;
        }

        // Otherwise the entry is a base model (e.g. 'qwen3').
        // Only accept baseModel:VARIANT where VARIANT is a pure size token like '3b' or '1.5b'
        // This prevents matching extended qualifiers like '4b-instruct-2507'.
        if (normalizedSelectedModel.startsWith(normalizedThinkingModel + ':')) {
            const afterColon = normalizedSelectedModel.slice(normalizedThinkingModel.length + 1);
            // Accept variants such as '3b', '1.5b', '24b' etc. (integers or decimals followed by 'b')
            const pureSizeRegex = /^\d+(?:\.\d+)?b$/i;
            return pureSizeRegex.test(afterColon);
        }

        return false;
    });
    
   //console.log('ThinkingModels: Model', modelName, 'supports thinking:', isSupported);
    return isSupported;
};

// Reasoning-effort models: models that expose a Low/Mid/High reasoning effort
// selector instead of a plain thinking on/off toggle. Currently the gpt-oss
// family (20b/120b) and Qwen3.8 (27b), which supports reasoning_effort
// (low / medium / xhigh).
window.isReasoningEffortModel = function(modelName) {
    if (!modelName) return false;

    const base = (window.getBaseModelName && window.getBaseModelName(modelName)) || String(modelName);
    const baseOnly = String(base).toLowerCase().split(':')[0].trim();
    if (!baseOnly) return false;

    // gpt-oss family: 'gpt-oss', 'gpt-oss:20b', 'gpt-oss:120b', ...
    if (baseOnly === 'gpt-oss') return true;
    // Qwen3.8 family: 'qwen3.8', 'qwen3.8:27b', 'qwen3.8-27b', ...
    if (baseOnly.startsWith('qwen3.8')) return true;

    return false;
};

//console.log('ThinkingModels: Thinking models support loaded');