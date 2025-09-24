class ThinkingState {
    static STORAGE_KEY_USER = 'thinkingEnabled';
    static STORAGE_KEY_GPT_OSS = 'thinkingEnabledGptOss';

    // Returns effective thinking enabled for the current model context.
    // If isGptOss is true, prefer the gpt-oss key. If not provided, prefer gpt-oss if set.
    static getEffectiveThinkingEnabled(isGptOss = undefined) {
        try {
            const gptOss = localStorage.getItem(ThinkingState.STORAGE_KEY_GPT_OSS);
            const user = localStorage.getItem(ThinkingState.STORAGE_KEY_USER);

            if (isGptOss === true) return gptOss === 'true' || user === 'true';
            if (isGptOss === false) return user === 'true';

            // If not specified, prefer gpt-oss when present
            if (gptOss !== null) return gptOss === 'true' || user === 'true';
            return user === 'true';
        } catch (err) {
            // localStorage may be unavailable in some contexts; sensible default
            return false;
        }
    }

    static getUserThinkingEnabled() {
        try {
            return localStorage.getItem(ThinkingState.STORAGE_KEY_USER) === 'true';
        } catch (err) {
            return false;
        }
    }

    static setUserThinkingEnabled(enabled) {
        try {
            localStorage.setItem(ThinkingState.STORAGE_KEY_USER, enabled ? 'true' : 'false');
            window.dispatchEvent(new CustomEvent('thinkingStateChanged', { detail: { enabled } }));
        } catch (err) {
            // ignore
        }
    }

    static setGptOssThinkingEnabled(enabled) {
        try {
            localStorage.setItem(ThinkingState.STORAGE_KEY_GPT_OSS, enabled ? 'true' : 'false');
            // Also dispatch storage-like event for same-tab listeners
            window.dispatchEvent(new CustomEvent('thinkingStateChanged', { detail: { enabled } }));
        } catch (err) {
            // ignore
        }
    }

    static addChangeListener(callback) {
        const handler = (e) => {
            if (e.key === ThinkingState.STORAGE_KEY_USER || e.key === ThinkingState.STORAGE_KEY_GPT_OSS) {
                callback(ThinkingState.getEffectiveThinkingEnabled());
            }
        };
        window.addEventListener('storage', handler);
        window.addEventListener('thinkingStateChanged', (e) => callback(!!e.detail?.enabled));
        return {
            dispose: () => {
                window.removeEventListener('storage', handler);
            }
        };
    }
}

// Export for UMD-like simple include (no module bundler in this repo)
window.ThinkingState = ThinkingState;
