// Visual models are matched by substring against the selected model name, and
// OllamaAPI.getModelMatchCandidates() already extracts the family token (the
// part before ':'). So family entries below match ANY variant of that family
// (sizes, quants, mtp, mlx, coding, etc.) — new tags never need re-adding.
window.VISUAL_MODELS = [
    // Base vision identifiers (family names cover all variants)
    'gemma3',
    'llava',
    'llava-llama3',
    'bakllava',
    'llama3-vision',
    'llava-phi3',
    'phi3-vision',
    'llama3.2-vision',
    'minicpm-v',
    'moondream',
    'granite3.2-vision',
    'mistral-small3.1',
    'mistral-small3.2',
    'llama4',
    'qwen2.5vl',
    'kimi-k2.6',
    'kimi-k2.5',
    // Qwen3 — only the listed variant is known vision-capable
    'qwen3:30b-a3b-thinking-2507',
    // Qwen3.5 / 3.6 / 3.8 — all variants support vision
    'qwen3.5',
    'qwen3.6',
    'qwen3.8',
    // Qwen3-VL family (all variants are vision)
    'qwen3-vl',
    // Gemma4 family
    'gemma4',
    // Ministral-3 family
    'ministral-3',
    // Mistral-large-3 family
    'mistral-large-3',
];