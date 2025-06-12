window.THINKING_MODELS = [
    'deepseek-r1',
    'deepseek-r1:1.5b',
    'deepseek-r1:7b',
    'deepseek-r1:8b',
    'deepseek-r1:14b',
    'deepseek-r1:32b',
    'deepseek-r1:70b',
    'deepseek-r1:671b',
    'qwen3',
    'qwen3:0.5b',
    'qwen3:1.5b',
    'qwen3:3b',
    'qwen3:7b',
    'qwen3:14b',
    'qwen3:32b',
    'qwen3:70b'
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
        return baseModelName === normalizedThinkingModel || baseModelName.startsWith(normalizedThinkingModel + ':');
    });
    
    //console.log('ThinkingModels: Model', modelName, 'supports thinking:', isSupported);
    return isSupported;
};

//console.log('ThinkingModels: Thinking models support loaded');