window.THINKING_MODELS = [
    // DeepSeek R1 family (all sizes support native thinking)
    'deepseek-r1',
    // Qwen3 — explicit size entries kept because only the listed variants are
    // guaranteed thinking-capable (avoids matching non-thinking variants such
    // as 'qwen3:4b-instruct-2507').
    'qwen3',
    // Qwen3.5 / 3.6 / 3.8 — all variants support thinking. Family entries cover
    // any current or future tag (sizes, quants, mtp, mlx, coding, etc.).
    'qwen3.5',
    'qwen3.6',
    'qwen3.8',
    'magistral',
    'gpt-oss',
    'deepseek-v3.1',
    'glm-4.7',
    'glm-5',
    'glm-5.1',
    'glm-4.7-flash',
    'gemma4',
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

// Extract the family token of a model name: the part before any ':' after
// removing quantization suffixes.
//   'qwen3.8:27b-mtp-q8_0' -> 'qwen3.8'
//   'qwen3.8-27b'          -> 'qwen3.8-27b'
//   'gpt-oss:20b'          -> 'gpt-oss'
window.getModelFamily = function(modelName) {
    if (!modelName) return '';

    const base = (window.getBaseModelName && window.getBaseModelName(modelName)) || String(modelName);
    return String(base).toLowerCase().split(':')[0].trim();
};

// Improved function to check if a model supports thinking
window.isThinkingModel = function(modelName) {
    if (!modelName) return false;

    // Reasoning-effort models (gpt-oss family, Qwen3.8) always support thinking,
    // regardless of the exact tag variant (e.g. 'qwen3.8-27b' vs 'qwen3.8:27b').
    if (window.isReasoningEffortModel && window.isReasoningEffortModel(modelName)) return true;

    const normalizedSelectedModel = window.normalizeThinkingModelName(modelName);
    const selectedFamily = window.getModelFamily(modelName);

    // Check if the model matches any thinking entry.
    // Family entries (no ':') match ANY variant of that family, so new
    // tags/sizes never need re-adding.
    const isSupported = window.THINKING_MODELS.some(thinkingModel => {
        const normalizedEntry = window.normalizeThinkingModelName(thinkingModel);

        // 1) Exact match is always allowed (covers dash-form tags like 'qwen3.8-27b').
        if (normalizedSelectedModel === normalizedEntry) return true;

        // 2) Explicit variant entries (e.g. 'qwen3:3b', 'glm-4.7-flash:q4_K_M')
        //    require an exact match. This preserves precision for models where
        //    only the listed variants are guaranteed thinking-capable.
        if (normalizedEntry.includes(':')) {
            return normalizedSelectedModel === normalizedEntry;
        }

        // 3) Family entry: match any variant of that family. Boundary checks
        //    prevent a family like 'qwen3' from matching 'qwen3.5' / 'qwen3.6'.
        const entryFamily = window.getModelFamily(thinkingModel);
        if (selectedFamily === entryFamily) return true;                         // 'qwen3.8:27b-mtp-q8_0'
        if (selectedFamily.startsWith(entryFamily + '-')) return true;           // 'qwen3.8-27b'
        if (normalizedSelectedModel.startsWith(entryFamily + ':')) return true;  // 'qwen3.8:27b'

        return false;
    });

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