class CodeStyler {

    static languageAliases = {
        'bash': 'sh',
        'shell': 'sh',
        'zsh': 'sh',
        'html': 'markup',
        'htm': 'markup',
        'xml': 'markup',
        'yml': 'yaml',
        'js': 'javascript',
        'py': 'python',
        'rb': 'ruby',
        'ts': 'typescript',
        'jsx': 'javascript',
        'tsx': 'typescript',
        'objc': 'objective-c',
        'rs': 'rust',
        'cpp': 'c++',
        'cc': 'c++',
        'tex': 'latex',
        'latex': 'latex',
        'swift': 'swift'

    };

    static syntaxRules = {
        python: {
            keywords: ['def', 'if', 'else', 'elif', 'for', 'while', 'in', 'return', 'import', 'from', 'as', 'class', '__init__', '__name__', '__main__'],
            builtins: ['print', 'input', 'len', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple'],
            operators: ['=', '+', '-', '*', '/', '==', '!=', '>', '<', '>=', '<=', 'and', 'or', 'not'],
            specialChars: ['(', ')', '[', ']', '{', '}', ':', ',']
        },
        javascript: {
            keywords: ['const', 'let', 'var', 'function', 'if', 'else', 'return', 'class', 'new', 'for', 'while', 'do', 'switch', 'case', 'break'],
            builtins: ['console', 'log', 'document', 'window', 'Array', 'Object', 'String', 'Number', 'Boolean'],
            operators: ['=', '+', '-', '*', '/', '===', '!==', '>', '<', '>=', '<=', '&&', '||', '!'],
            specialChars: ['(', ')', '[', ']', '{', '}', ':', ',', ';']
        },
        c: {
            keywords: ['auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while'],
            builtins: ['printf', 'scanf', 'malloc', 'free', 'calloc', 'realloc', 'memcpy', 'strlen', 'strcmp', 'strcpy', 'FILE', 'NULL'],
            operators: ['=', '+', '-', '*', '/', '==', '!=', '>', '<', '>=', '<=', '&&', '||', '!', '&', '|', '^', '~', '<<', '>>'],
            specialChars: ['(', ')', '[', ']', '{', '}', ':', ',', ';', '*', '&']
        },
        swift: {
            keywords: ['class', 'struct', 'enum', 'protocol', 'extension', 'func', 'var', 'let', 'if', 'else', 'guard', 'switch', 'case', 'default', 'for', 'while', 'repeat', 'break', 'continue', 'return', 'throw', 'throws', 'rethrows', 'try', 'catch', 'defer', 'import', 'init', 'deinit', 'static', 'final', 'open', 'public', 'internal', 'private', 'fileprivate'],
            builtins: ['String', 'Int', 'Double', 'Bool', 'Array', 'Dictionary', 'Set', 'Optional', 'print', 'min', 'max', 'sorted', 'filter', 'map', 'reduce'],
            operators: ['=', '+', '-', '*', '/', '==', '!=', '>', '<', '>=', '<=', '&&', '||', '!', '??', '->'],
            specialChars: ['(', ')', '[', ']', '{', '}', ':', ',', ';', '@']
        },
        kotlin: {
            keywords: ['fun', 'val', 'var', 'class', 'interface', 'object', 'if', 'else', 'when', 'while', 'for', 'do', 'try', 'catch', 'finally', 'throw', 'break', 'continue', 'return', 'constructor', 'init', 'companion', 'private', 'protected', 'public', 'internal', 'import', 'package', 'suspend', 'sealed'],
            builtins: ['String', 'Int', 'Boolean', 'Double', 'List', 'Map', 'Set', 'println', 'print', 'arrayOf', 'listOf', 'mapOf', 'setOf'],
            operators: ['=', '+', '-', '*', '/', '==', '!=', '>', '<', '>=', '<=', '&&', '||', '!', '?.', '?:', '::'],
            specialChars: ['(', ')', '[', ']', '{', '}', ':', ',', ';', '@']
        },
        php: {
            keywords: ['abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch', 'class', 'clone', 'const', 'continue', 'declare', 'default', 'die', 'do', 'echo', 'else', 'elseif', 'empty', 'enddeclare', 'endfor', 'endforeach', 'endif', 'endswitch', 'endwhile', 'eval', 'exit', 'extends', 'final', 'finally', 'fn', 'for', 'foreach', 'function', 'global', 'goto', 'if', 'implements', 'include', 'include_once', 'instanceof', 'insteadof', 'interface', 'isset', 'list', 'namespace', 'new', 'or', 'print', 'private', 'protected', 'public', 'require', 'require_once', 'return', 'static', 'switch', 'throw', 'trait', 'try', 'unset', 'use', 'var', 'while', 'xor', 'yield'],
            builtins: ['array_push', 'count', 'strlen', 'str_replace', 'implode', 'explode', 'trim', 'json_encode', 'json_decode', 'mysqli_connect', 'PDO'],
            operators: ['=', '+', '-', '*', '/', '==', '!=', '===', '!==', '>', '<', '>=', '<=', '&&', '||', '!', '.', '=>'],
            specialChars: ['(', ')', '[', ']', '{', '}', ':', ',', ';', '$', '@']
        },
        ruby: {
            keywords: ['alias', 'and', 'begin', 'break', 'case', 'class', 'def', 'defined?', 'do', 'else', 'elsif', 'end', 'ensure', 'false', 'for', 'if', 'in', 'module', 'next', 'nil', 'not', 'or', 'redo', 'rescue', 'retry', 'return', 'self', 'super', 'then', 'true', 'undef', 'unless', 'until', 'when', 'while', 'yield'],
            builtins: ['puts', 'print', 'attr_accessor', 'attr_reader', 'attr_writer', 'require', 'include', 'extend', 'raise', 'lambda', 'proc'],
            operators: ['=', '+', '-', '*', '/', '==', '!=', '>', '<', '>=', '<=', '&&', '||', '!', '=>', '..', '...'],
            specialChars: ['(', ')', '[', ']', '{', '}', ':', ',', ';', '@', '$']
        },
        scala: {
            keywords: ['abstract', 'case', 'catch', 'class', 'def', 'do', 'else', 'extends', 'false', 'final', 'finally', 'for', 'forSome', 'if', 'implicit', 'import', 'lazy', 'match', 'new', 'null', 'object', 'override', 'package', 'private', 'protected', 'return', 'sealed', 'super', 'this', 'throw', 'trait', 'try', 'true', 'type', 'val', 'var', 'while', 'with', 'yield'],
            builtins: ['String', 'Int', 'Boolean', 'Double', 'List', 'Map', 'Set', 'Option', 'println', 'print', 'None', 'Some'],
            operators: ['=', '+', '-', '*', '/', '==', '!=', '>', '<', '>=', '<=', '&&', '||', '!', '=>', '<-', '←', '→'],
            specialChars: ['(', ')', '[', ']', '{', '}', ':', ',', ';', '@']
        },
        java: {
            keywords: ['public', 'private', 'protected', 'class', 'interface', 'void', 'boolean', 'int', 'long', 'float', 'double', 'String', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'new', 'this', 'super', 'extends', 'implements', 'throws'],
            builtins: ['System', 'out', 'println', 'print', 'ArrayList', 'HashMap', 'String', 'Integer', 'Boolean', 'Double', 'List', 'Map'],
            operators: ['=', '+', '-', '*', '/', '==', '!=', '>', '<', '>=', '<=', '&&', '||', '!'],
            specialChars: ['(', ')', '[', ']', '{', '}', ':', ',', ';']
        },
        cpp: {
            keywords: ['alignas', 'alignof', 'asm', 'auto', 'bool', 'break', 'case', 'catch', 'char', 'char16_t', 'char32_t', 'class', 'const', 'constexpr', 'const_cast', 'continue', 'decltype', 'default', 'delete', 'do', 'double', 'dynamic_cast', 'else', 'enum', 'explicit', 'export', 'extern', 'false', 'float', 'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable', 'namespace', 'new', 'noexcept', 'nullptr', 'operator', 'private', 'protected', 'public', 'register', 'reinterpret_cast', 'return', 'short', 'signed', 'sizeof', 'static', 'static_assert', 'static_cast', 'struct', 'switch', 'template', 'this', 'thread_local', 'throw', 'true', 'try', 'typedef', 'typeid', 'typename', 'union', 'unsigned', 'using', 'virtual', 'void', 'volatile', 'wchar_t', 'while'],
            builtins: ['cout', 'cin', 'endl', 'string', 'vector', 'map', 'set', 'queue', 'stack', 'pair', 'array', 'shared_ptr', 'unique_ptr', 'make_shared', 'make_unique'],
            operators: ['=', '+', '-', '*', '/', '==', '!=', '>', '<', '>=', '<=', '&&', '||', '!', '::', '->', '<<', '>>', '++', '--'],
            specialChars: ['(', ')', '[', ']', '{', '}', ':', ',', ';', '<', '>', '#']
        },
        rust: {
            keywords: ['fn', 'let', 'mut', 'if', 'else', 'match', 'while', 'for', 'in', 'loop', 'return', 'struct', 'enum', 'trait', 'impl', 'pub', 'use', 'mod', 'where', 'async', 'await', 'move'],
            builtins: ['String', 'Vec', 'Option', 'Result', 'println', 'panic', 'unwrap', 'expect', 'Some', 'None', 'Ok', 'Err'],
            operators: ['=', '+', '-', '*', '/', '==', '!=', '>', '<', '>=', '<=', '&&', '||', '!', '=>', '::'],
            specialChars: ['(', ')', '[', ']', '{', '}', ':', ',', ';']
        },
        go: {
            keywords: ['func', 'var', 'const', 'type', 'struct', 'interface', 'map', 'if', 'else', 'for', 'range', 'return', 'package', 'import', 'go', 'chan', 'defer', 'select', 'case'],
            builtins: ['string', 'int', 'bool', 'float64', 'make', 'len', 'cap', 'append', 'println', 'print', 'error'],
            operators: ['=', '+', '-', '*', '/', '==', '!=', '>', '<', '>=', '<=', '&&', '||', '!', ':='],
            specialChars: ['(', ')', '[', ']', '{', '}', ':', ',', ';']
        },
        'objective-c': {
            keywords: ['@interface', '@implementation', '@end', '@protocol', '@property', '@synthesize', '@dynamic', '@public', '@private', '@protected', '@class', '@selector', '@try', '@catch', '@finally', '@throw', '@synchronized', 'self', 'super', 'id', 'nil', 'BOOL', 'YES', 'NO', 'if', 'else', 'while', 'for', 'do', 'switch', 'case', 'break', 'continue', 'return', 'goto'],
            builtins: ['NSString', 'NSArray', 'NSDictionary', 'NSNumber', 'NSObject', 'UIView', 'UIViewController', 'NSLog', 'alloc', 'init', 'retain', 'release', 'autorelease'],
            operators: ['=', '+', '-', '*', '/', '==', '!=', '>', '<', '>=', '<=', '&&', '||', '!', '@'],
            specialChars: ['(', ')', '[', ']', '{', '}', ':', ',', ';', '*']
        },

        objectivec: {
            keywords: ['@interface', '@implementation', '@end', '@protocol', '@property', '@synthesize', '@dynamic', '@public', '@private', '@protected', '@class', '@selector', '@try', '@catch', '@finally', '@throw', '@synchronized', 'self', 'super', 'id', 'nil', 'BOOL', 'YES', 'NO', 'if', 'else', 'while', 'for', 'do', 'switch', 'case', 'break', 'continue', 'return', 'goto'],
            builtins: ['NSString', 'NSArray', 'NSDictionary', 'NSNumber', 'NSObject', 'UIView', 'UIViewController', 'NSLog', 'alloc', 'init', 'retain', 'release', 'autorelease'],
            operators: ['=', '+', '-', '*', '/', '==', '!=', '>', '<', '>=', '<=', '&&', '||', '!', '@'],
            specialChars: ['(', ')', '[', ']', '{', '}', ':', ',', ';', '*']
        },
        xojo: {
            keywords: ['Var', 'Dim', 'As', 'New', 'If', 'Then', 'Else', 'End', 'For', 'Next', 'While', 'Wend', 'Do', 'Loop', 'Until', 'Select', 'Case', 'Function', 'Sub', 'Return', 'Module', 'Class', 'Interface', 'Property', 'Get', 'Set', 'Private', 'Protected', 'Public', 'Shared', 'Static', 'Try', 'Catch', 'Finally', 'Break', 'Continue', 'True', 'False', 'Nil'],
            builtins: ['Integer', 'String', 'Double', 'Boolean', 'Date', 'Object', 'Variant', 'Array', 'Dictionary', 'MsgBox', 'Print', 'WriteLine', 'ReadLine', 'Str', 'Val', 'Len', 'Left', 'Right', 'Mid', 'Trim', 'UBound', 'LBound'],
            operators: ['=', '+', '-', '*', '/', '<>', '>', '<', '>=', '<=', 'And', 'Or', 'Not', '&', 'Mod'],
            specialChars: ['(', ')', '[', ']', ',', '.', ':', ';']
        },
        sh: {
            keywords: ['if', 'then', 'else', 'elif', 'fi', 'case', 'esac', 'for', 'while', 'until', 'do', 'done', 'in', 'function', 'time', 'coproc'],
            builtins: ['echo', 'cd', 'pwd', 'mkdir', 'rm', 'cp', 'mv', 'ls', 'cat', 'grep', 'sed', 'awk', 'curl', 'wget', 'sudo', 'apt', 'yum', 'dnf'],
            operators: ['-eq', '-ne', '-lt', '-le', '-gt', '-ge', '-z', '-n', '-d', '-f', '-r', '-w', '-x', '&&', '||', '|', '>', '<', '>=', '<='],
            specialChars: ['(', ')', '[', ']', '{', '}', ':', ',', ';', '$', '#', '`']
        },
        markup: {
            keywords: ['html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'script', 'style', 'link', 'meta', 'title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th'],
            builtins: ['class', 'id', 'href', 'src', 'rel', 'type', 'charset', 'name', 'content'],
            operators: ['=', '<', '>', '/'],
            specialChars: ['"', "'", '/', '<', '>', '!']
        },
        'latex': {
            keywords: ['\\documentclass', '\\usepackage', '\\begin', '\\end', '\\title',
                '\\author', '\\date', '\\maketitle', '\\section', '\\subsection',
                '\\displaystyle', '\\int', '\\sum', '\\frac', '\\sqrt', '\\tanh',
                '\\left', '\\right', '\\pi', '\\infty', '\\alpha', '\\beta'],
            builtins: ['document', 'article', 'equation', 'align', 'itemize', 'enumerate',
                'matrix', 'pmatrix', 'bmatrix'],
            operators: ['_', '^', '+', '-', '=', '<', '>', '!', ',', '\\'],
            specialChars: ['{', '}', '[', ']', '(', ')', '$']
        },
    };

    // Returns the normalized language name for syntax highlighting, handling aliases.
    static normalizeLanguage(lang) {
        if (!lang) return '';

        // Convert to lowercase and remove any whitespace
        const normalized = lang.toLowerCase().trim();

        // Check if it's an alias
        if (this.languageAliases[normalized]) {
            return this.languageAliases[normalized];
        }

        // Check if it's a supported language
        if (this.syntaxRules[normalized]) {
            return normalized;
        }

        return ''; // Return empty string if language is not supported
    }

    // Adds the CSS styles for syntax highlighting to the document head if not already present.
    static addSyntaxStyles() {
        // Check if styles are already added
        if (document.getElementById('codestyler-syntax-styles')) {
            return;
        }

        //console.log('Adding syntax highlighting styles');
        const style = document.createElement('style');
        style.id = 'codestyler-syntax-styles';
        style.textContent = `
        /* Base code styling */
        pre code {
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            tab-size: 4;
        }
        
        /* Line numbers styling with proper theme support */
        .line-number-item {
            color: var(--syntax-comment-color, #6a737d);
            user-select: none;
            text-align: right;
            padding-right: 8px;
            line-height: 1.5;
            opacity: 0.7;
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
        }
        
        /* Line numbers container theme support */
        .line-numbers {
            background-color: var(--bg-color, #f6f8fa) !important;
            border-right-color: var(--border-color, #d1d9e0) !important;
        }
        
        /* Ensure line numbers are visible when displayed */
        .line-numbers[style*="display: block"] {
            display: block !important;
            visibility: visible !important;
        }
        
        /* Code syntax highlighting styles - light mode (VS Code-inspired) */
        .syntax-tag { color: var(--syntax-tag-color, #569cd6); }
        .syntax-attr { color: var(--syntax-attr-color, #9cdcfe); }
        .syntax-string { color: var(--syntax-string-color, #ce9178); }
        .syntax-comment { color: var(--syntax-comment-color, #6a737d); }
        .syntax-doctype { color: var(--syntax-doctype-color, #6a737d); }
        .syntax-keyword { color: var(--syntax-keyword-color, #569cd6); }
        .syntax-builtin { color: var(--syntax-builtin-color, #4ec9b0); }
        .syntax-operator { color: var(--syntax-operator-color, #d4d4d4); }
        .syntax-special-char { color: var(--syntax-special-char-color, #d4d4d4); }
        .syntax-attr-name { color: var(--syntax-attr-color, #9cdcfe); }
        .syntax-attr-value { color: var(--syntax-string-color, #ce9178); }
        
        /* Dark mode syntax highlighting - VS Code Dark+ theme */
        @media (prefers-color-scheme: dark) {
            .line-number-item {
                color: var(--syntax-comment-color, #6A9955);
                opacity: 0.6;
            }
            
            .line-numbers {
                background-color: var(--bg-color, #181818) !important;
                border-right-color: var(--border-color, #404040) !important;
            }
            
            .syntax-tag { color: #569cd6; }
            .syntax-attr { color: #9cdcfe; }
            .syntax-string { color: #ce9178; }
            .syntax-comment { color: #6A9955; }
            .syntax-doctype { color: #6A9955; }
            .syntax-keyword { color: #569cd6; }
            .syntax-builtin { color: #4ec9b0; }
            .syntax-operator { color: #d4d4d4; }
            .syntax-special-char { color: #d4d4d4; }
            .syntax-attr-name { color: #9cdcfe; }
            .syntax-attr-value { color: #ce9178; }
        }
        
        /* Light mode specific overrides */
        @media (prefers-color-scheme: light) {
            .line-number-item {
                color: var(--syntax-comment-color, #6a737d);
                opacity: 0.7;
            }
            
            .line-numbers {
                background-color: var(--bg-color, #ffffff) !important;
                border-right-color: var(--border-color, #d1d9e0) !important;
            }
        }
        
        /* Rest of existing styles... */
        .artwork-preview-code-view {
            background-color: var(--bg-color, #ffffff);
            color: var(--text-color, #333333);
        }
        
        code.inline-code {
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            background-color: var(--inline-code-bg, rgba(0, 0, 0, 0.05));
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 0.85em;
            color: var(--inline-code-text);
        }
        
        .latex-expression {
            font-family: 'Times New Roman', serif;
            font-style: italic;
            padding: 0 3px;
            color: var(--accent-color, #0066cc);
        }
        
        .thinking-content::-webkit-scrollbar {
            display: none;
        }
    `;

        document.head.appendChild(style);
        //console.log('Syntax styles added to document head');
    }

    // Highlights operators in the code string for the given language.
    static applyOperatorHighlighting(code, language) {
        if (!code || !language) return code;

        const rules = this.syntaxRules[language];
        if (!rules || !rules.operators || !rules.operators.length) return code;

        // Escape special characters for regex
        const escapedOperators = rules.operators.map(op =>
            op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        );

        // Create regex pattern for operators, being careful about word boundaries
        const opPattern = new RegExp(
            `(${escapedOperators.join('|')})(?![\\w-])`, 'g');

        // Replace operators with highlighted spans
        return code.replace(opPattern,
            '<span class="syntax-operator">$1</span>');
    }

    // Highlights special characters in the code string for the given language.
    static applySpecialCharHighlighting(code, language) {
        if (!code || !language) return code;

        const rules = this.syntaxRules[language];
        if (!rules || !rules.specialChars || !rules.specialChars.length) return code;

        // Escape special characters for regex
        const escapedChars = rules.specialChars.map(char =>
            char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        );

        // Create regex pattern for special chars
        const charPattern = new RegExp(
            `(${escapedChars.join('|')})`, 'g');

        // Replace special chars with highlighted spans
        return code.replace(charPattern,
            '<span class="syntax-special-char">$1</span>');
    }

    // Highlights code syntax for the given language using defined rules.
    static highlightCode(code, language) {
        // First, escape HTML special characters
        const escapedCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        const normalizedLang = this.normalizeLanguage(language);
        if (!normalizedLang) return escapedCode;

        // Use a tokenization approach instead of regex replacements
        let tokenized = escapedCode;
        const rules = this.syntaxRules[normalizedLang];

        if (!rules) return escapedCode;

        // For HTML specifically, use tag-based approach
        if (normalizedLang === 'markup' || normalizedLang === 'html') {
            // Use a more careful HTML token approach
            return this.highlightMarkup(escapedCode);
        }


        // Handle keywords with word boundaries
        if (rules.keywords && rules.keywords.length) {
            const keywordPattern = new RegExp(`\\b(${rules.keywords.join('|')})\\b`, 'g');
            tokenized = tokenized.replace(keywordPattern,
                '<span class="syntax-keyword">$1</span>');
        }

        // Handle builtins with word boundaries
        if (rules.builtins && rules.builtins.length) {
            const builtinPattern = new RegExp(`\\b(${rules.builtins.join('|')})\\b`, 'g');
            tokenized = tokenized.replace(builtinPattern,
                '<span class="syntax-builtin">$1</span>');
        }

        return tokenized;
    }
    // Highlights markup (HTML/XML) code with tag and attribute coloring.
    static highlightMarkup(code) {
        // Ensure styles are added
        this.addSyntaxStyles();

        // Tags with attributes
        let html = code.replace(/(&lt;)(\/?[a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z0-9-]+(?:=&quot;.*?&quot;|\=&#039;.*?&#039;|\=[^\s&]*)?)*\s*)(&gt;)/g,
            (match, open, tagName, attrs, close) => {
                // Process attributes if present
                let processedAttrs = attrs;

                if (attrs.trim()) {
                    // Fix: Improved attribute regex pattern that handles both quoted and unquoted values
                    processedAttrs = attrs.replace(/\s+([a-zA-Z0-9-]+)(=)(?:(&quot;|&#039;)(.*?)(\3)|([^\s>]*))/g,
                        (attrMatch, attrName, eq, quote, quotedValue, endQuote, unquotedValue) => {
                            if (quote) {
                                // Quoted attribute (with &quot; or &#039;)
                                return ' <span class="syntax-attr">' + attrName + '</span>' + eq +
                                    '<span class="syntax-string">' + quote + quotedValue + endQuote + '</span>';
                            } else if (unquotedValue) {
                                // Unquoted attribute
                                return ' <span class="syntax-attr">' + attrName + '</span>' + eq +
                                    '<span class="syntax-string">' + unquotedValue + '</span>';
                            } else {
                                // Boolean attribute (without value)
                                return ' <span class="syntax-attr">' + attrName + '</span>';
                            }
                        });
                }

                return `<span class="syntax-tag">${open}${tagName}</span>${processedAttrs}<span class="syntax-tag">${close}</span>`;
            });

        // HTML comments
        html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g,
            '<span class="syntax-comment">$1</span>');

        // Doctype
        html = html.replace(/(&lt;!DOCTYPE\s+[^&]+&gt;)/i,
            '<span class="syntax-doctype">$1</span>');

        return html;
    }
}

class StreamProcessor {
    constructor() {
        this.responseContainer = document.createElement('div');
        this.responseContainer.className = 'ai-response-container';
        document.querySelector('.ai-replies').appendChild(this.responseContainer);
        this.tempBackticksBuffer = '';
        this.backticksBuffer = '';
        this.existingCodeBlockCount = 0;
        this.state = {
            isInCodeBlock: false,
            currentLanguage: '',
            codeBlockContent: '',
            markdownBuffer: '',
            currentCodeBlock: null,
            inMarkdownPattern: false,
            cleanCodeContent: ''
        };
        /* this.logger = {
            info: (msg, data) => console.log(`[StreamProcessor] ${msg}`, data || '')
        }; */
        this.fullResponseText = '';
        this.rawResponseHtml = ''; // Store the raw HTML before processing references
        this.updateTimer = null;
        this.updateDelay = 50; // milliseconds
        this.thinkingMode = {
            active: false,
            content: '',
            startTime: null,
            endTime: null,
            container: null,
            timer: null,
            timerElement: null,
            elapsedSeconds: 0,
            isNative: false,
            id: null
        };

        //  CRITICAL FIX: Always get fresh localStorage value on initialization
    this._cachedThinkingEnabled = (window.ThinkingState && typeof window.ThinkingState.getEffectiveThinkingEnabled === 'function')
        ? window.ThinkingState.getEffectiveThinkingEnabled()
        : ((localStorage.getItem('thinkingEnabledGptOss') === 'true') || (localStorage.getItem('thinkingEnabled') === 'true'));
        this._lastThinkingCheck = Date.now();

        // Listen for thinking state changes
        this._setupThinkingStateListener();
        this.finalResponseStarted = false;

    //  NEW: Log the initial state to help debugging
    //console.log('🧠 StreamProcessor: Initialized with thinking enabled:', this._cachedThinkingEnabled);
    }
    _setupThinkingStateListener() {
        // Listen for storage events (when localStorage changes in other tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === 'thinkingEnabled' || e.key === 'thinkingEnabledGptOss') {
                this._cachedThinkingEnabled = (window.ThinkingState && typeof window.ThinkingState.getEffectiveThinkingEnabled === 'function')
                    ? window.ThinkingState.getEffectiveThinkingEnabled()
                    : ((localStorage.getItem('thinkingEnabledGptOss') === 'true') || (localStorage.getItem('thinkingEnabled') === 'true'));
                //console.log('🧠 StreamProcessor: Thinking state changed via storage event:', this._cachedThinkingEnabled);
            }
        });

        // Listen for custom events when thinking is toggled in same tab
        window.addEventListener('thinkingStateChanged', (e) => {
            this._cachedThinkingEnabled = e.detail.enabled;
            //console.log('🧠 StreamProcessor: Thinking state changed via custom event:', this._cachedThinkingEnabled);
        });
    }
    // In the processChunk method, fix the native thinking detection:

    processChunk(chunk) {

        this.fullResponseText += chunk;

        //  OPTIMIZED: Use cached thinking state instead of localStorage
        // But allow a per-model override for gpt-oss: if this response is for a gpt-oss model
        // and the gpt-oss-specific flag is set, prefer that. We attempt to detect the model
        // from the nearest assistant message dataset or from a global chatInstance when available.
        let thinkingEnabled = this._cachedThinkingEnabled;
    try {
            // Detect model for this response (safe fallback if not available)
            let modelForThisResponse = '';
            const assistantMsg = this.responseContainer.closest('.assistant-message');
            if (assistantMsg && assistantMsg.dataset && assistantMsg.dataset.model) {
                modelForThisResponse = assistantMsg.dataset.model;
            } else if (window.chatInstance && window.chatInstance.currentModel) {
                modelForThisResponse = window.chatInstance.currentModel;
            }
            if (modelForThisResponse) {
                console.log('🧠 StreamProcessor: detected modelForThisResponse=', modelForThisResponse);
                const base = (window.getBaseModelName && window.getBaseModelName(modelForThisResponse)) || (modelForThisResponse || '').toLowerCase();
                const baseOnly = (base || '').split(':')[0];
                console.log('🧠 StreamProcessor: normalized baseOnly=', baseOnly);
                if (baseOnly === 'gpt-oss') {
                    // If the gpt-oss-specific localStorage key is explicitly true, enable thinking
                    const gptOssFlag = localStorage.getItem('thinkingEnabledGptOss');
                    console.log('🧠 StreamProcessor: thinkingEnabledGptOss from storage=', gptOssFlag);
                    if (gptOssFlag === 'true') {
                        thinkingEnabled = true;
                    }
                }
            }
        } catch (e) {
            // If anything goes wrong while detecting model, fall back to cached value
            //console.warn('StreamProcessor: error detecting per-model thinking override', e);
            thinkingEnabled = this._cachedThinkingEnabled;
        }

        // Only log this occasionally to avoid spam
        if (Date.now() - this._lastThinkingCheck > 5000) { // Every 5 seconds
            //console.log('🧠 StreamProcessor: Thinking enabled (cached):', thinkingEnabled);
            this._lastThinkingCheck = Date.now();
        }

        // CRITICAL FIX: Always check for code blocks first, regardless of thinking mode
        // This ensures code blocks are properly detected even when mixed with thinking content

        // Standard processing for code blocks - IMPROVED LOGIC with split backticks handling
        if (this.state.isInCodeBlock) {
            // SPECIAL CASE: Handle split closing backticks
            if (chunk === '``') {
                //console.log('🔧 StreamProcessor: Found potential split closing backticks, creating temporary buffer');
                this.tempBackticksBuffer = '``';
                return; // Wait for next chunk to determine if this closes the code block
            }

            // Check if we have a temporary buffer and this chunk might complete the closing
            if (this.tempBackticksBuffer === '``') {
                if (chunk.startsWith('`')) {
                    //console.log('🔧 StreamProcessor: Completing split closing backticks, ending code block');
                    // Complete the closing backticks
                    this.endCodeBlock();
                    this.tempBackticksBuffer = '';

                    // Process any remaining content after the closing `
                    const remainingContent = chunk.substring(1);
                    if (remainingContent.trim()) {
                        this.processRegularContent(remainingContent);
                    }
                    return;
                } else {
                    //console.log('🔧 StreamProcessor: False alarm on split backticks, processing as code content');
                    // False alarm - process the buffered `` as code content
                    this.processCodeContent(this.tempBackticksBuffer);
                    this.tempBackticksBuffer = '';
                    // Continue processing current chunk normally
                }
            }

            // Regular code block processing
            if (chunk.includes('```')) {
                const lines = chunk.split('\n');
                let foundClosing = false;
                let processedLines = [];
                let remainingContent = '';

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];

                    if (line.trim() === '```' || line.trim().startsWith('```')) {
                        // Found closing backticks
                        foundClosing = true;

                        // Process any code content before the closing
                        if (processedLines.length > 0) {
                            this.processCodeContent(processedLines.join('\n'));
                        }

                        this.endCodeBlock();

                        // Everything after this line should be regular content
                        if (i + 1 < lines.length) {
                            remainingContent = lines.slice(i + 1).join('\n');
                        }
                        break;
                    } else {
                        processedLines.push(line);
                    }
                }

                if (foundClosing) {
                    // Process any remaining content as regular markdown
                    if (remainingContent.trim()) {
                        this.processRegularContent(remainingContent);
                    }
                    return;
                } else {
                    // No closing found, treat entire chunk as code content
                    this.processCodeContent(chunk);
                    return;
                }
            } else {
                // No backticks in chunk, all code content
                this.processCodeContent(chunk);
                return;
            }
        }

        // Check for code block start - ALWAYS check this regardless of thinking mode
        if (chunk.includes('```')) {
            if (!this.state.isInCodeBlock) {
                // Starting a code block - IMPROVED DETECTION
                const lines = chunk.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.includes('```')) {
                        // Process any content before the code block
                        if (i > 0) {
                            const beforeContent = lines.slice(0, i).join('\n');
                            if (beforeContent.trim()) {
                                this.processRegularContent(beforeContent);
                            }
                        }

                        // Extract language from the opening line
                        const codeLineMatch = line.match(/```(\w+)?/);
                        if (codeLineMatch) {
                            this.state.currentLanguage = codeLineMatch[1] || '';
                            this.startCodeBlock();

                            // Process any code content on the same line after ```
                            const afterBackticks = line.substring(line.indexOf('```') + 3 + (codeLineMatch[1] || '').length);
                            if (afterBackticks.trim()) {
                                this.processCodeContent(afterBackticks);
                            }

                            // Process remaining lines as code
                            if (i + 1 < lines.length) {
                                const codeContent = lines.slice(i + 1).join('\n');
                                if (codeContent.trim()) {
                                    this.processCodeContent(codeContent);
                                }
                            }
                            return;
                        }
                    }
                }
            }
        }

        // NOW handle native thinking after code block processing
        // Look for the specific pattern that indicates native thinking from Ollama
        if (thinkingEnabled && (chunk.includes('<think>') || this.fullResponseText.includes('<think>'))) {
            //console.log('🧠 StreamProcessor: Native thinking content detected in chunk');

            // Check if we need to start native thinking mode
            if (!this.thinkingMode.active || !this.thinkingMode.isNative) {
                //console.log('🧠 StreamProcessor: Starting native thinking mode - reason:',
                    //!this.thinkingMode.active ? 'Not active' : 'Not native');
                this.startNativeThinkingMode();
            }

            // Extract thinking content between <think> tags
            const thinkRegex = /<think>([\s\S]*?)(?:<\/think>|$)/g;
            let match;
            let hasThinkingContent = false;

            while ((match = thinkRegex.exec(this.fullResponseText)) !== null) {
                const thinkingContent = match[1];
                if (thinkingContent.trim()) {
                    hasThinkingContent = true;
                    // Only append new content that hasn't been processed yet
                    const currentLength = this.thinkingMode.content.length;
                    const newContent = thinkingContent.substring(currentLength);
                    if (newContent) {
                        this.appendThinkingContent(newContent);
                    }
                }
            }

            // Check if thinking is complete (has closing tag)
            if (this.fullResponseText.includes('</think>')) {
                //console.log('🧠 StreamProcessor: Native thinking complete, ending thinking mode');
                this.endThinkingMode();
                this.finalResponseStarted = true;

                // CRITICAL FIX: Extract final response after thinking and process it recursively
                // This ensures code blocks and other content are properly handled
                const afterThinking = this.fullResponseText.split('</think>')[1];
                if (afterThinking && afterThinking.trim()) {
                    // Recursively process the content after thinking to handle code blocks
                    this.processChunk(afterThinking.trim());
                }

                //  MODIFIED: Always ensure finishResponse is called and message actions are added
                setTimeout(() => {
                    //console.log('🧠 StreamProcessor: Adding message actions after native thinking completion');
                    this.finishResponse();

                    const assistantMessage = this.responseContainer.closest('.assistant-message');
                    if (assistantMessage && !assistantMessage.querySelector('.message-actions, .copy-response-container')) {
                        if (window.chat && typeof window.chat.addMessageActionsToMessage === 'function') {
                            window.chat.addMessageActionsToMessage(assistantMessage);
                        } else {
                            this.addSimpleMessageActions();
                        }
                    }
                }, 100);
                return;
            }

            // If we're still in thinking mode, don't process regular content
            if (this.thinkingMode.active && this.thinkingMode.isNative) {
                return;
            }
        }

        // Check for various thinking mode tags (keep existing XML-based thinking support)
        const thinkingStartPatterns = [
            '<thinking>', '<reflection>', '<reasoning>', '<cot>'
        ];

        const thinkingEndPatterns = [
            '</thinking>', '</reflection>', '</reasoning>', '</cot>'
        ];

        let thinkingStarted = false;
        let startTag = '';

        // Only process XML thinking if we're not already in native thinking mode
        if (!this.thinkingMode.isNative) {
            // Check for thinking start patterns
            for (const pattern of thinkingStartPatterns) {
                if (chunk.includes(pattern) || this.fullResponseText.includes(pattern)) {
                    thinkingStarted = true;
                    startTag = pattern;
                    break;
                }
            }

            if (thinkingStarted && !this.thinkingMode.active) {
                //console.log('StreamProcessor: XML thinking mode detected, starting thinking mode');
                this.startThinkingMode();
            }

            // Handle thinking content for XML mode
            if (this.thinkingMode.active && !this.thinkingMode.isNative) {
                // Check for thinking end patterns
                let thinkingEnded = false;
                for (const pattern of thinkingEndPatterns) {
                    if (chunk.includes(pattern) || this.fullResponseText.includes(pattern)) {
                        thinkingEnded = true;
                        break;
                    }
                }

                if (thinkingEnded) {
                    //console.log('StreamProcessor: XML thinking mode ended');
                    this.endThinkingMode();
                } else {
                    // Continue processing thinking content
                    this.appendThinkingContent(chunk);
                    return;
                }
            }
        }

        // Process regular content
        this.processRegularContent(chunk);

        if (window.autoScrollEnabled) {
            this.scrollIfNeeded();
        }
    }

    // Add a method to get conversation ID
    getCurrentConversationId() {
        return sessionStorage.getItem('hashedMasterKey') || 'default';
    }
    processRegularContent(content) {
        try {

            // Skip if this is code block content 
            if (this.state.isInCodeBlock) return;

            // Handle markdown patterns like tables and formatting
            if (this.state.inMarkdownPattern) {
                this.state.markdownBuffer += content;
                if (this.isMarkdownPatternComplete()) {
                    const processed = this.processMarkdownPattern();
                    this.rawResponseHtml += processed;
                    this.updateResponseDisplay();
                    this.state.markdownBuffer = '';
                    this.state.inMarkdownPattern = false;
                }
                return;
            }

            // Check if this chunk starts a new markdown pattern
            if (this.startsMarkdownPattern(content)) {
                this.state.inMarkdownPattern = true;
                this.state.markdownBuffer = content;
                return;
            }
            //this.fullResponseText += content; 

            let processedContent = content.replace(/\n/g, '<br>');

            this.rawResponseHtml += processedContent;

            // Update the display
            this.updateResponseDisplay();

        } catch (error) {
            console.error('Error processing content:', error);
            // Add the content as plain text if processing fails
            this.rawResponseHtml += content.replace(/\n/g, '<br>');
            this.updateResponseDisplay();
        }
    }

    // Add this new helper method to update the display
    updateResponseDisplay() {
        cancelAnimationFrame(this.updateTimer);
        this.updateTimer = requestAnimationFrame(() => {
            this.responseContainer.innerHTML = this.rawResponseHtml;
            this.scrollIfNeeded();
        });
    }
    scrollIfNeeded() {
        if (window.autoScrollEnabled) {
            const aiReplies = document.querySelector('.ai-replies');
            if (aiReplies) aiReplies.scrollTop = aiReplies.scrollHeight;
        }
    }

    startsMarkdownPattern(text) {
        return text.includes('###') ||
            text.includes('**') ||
            text.includes('`') ||
            text.match(/\[([^\]]+)\]\(([^)]+)\)/);
    }

    isMarkdownPatternComplete() {
        const buffer = this.state.markdownBuffer;
        return (buffer.includes('###') && buffer.includes('\n')) ||
            (buffer.match(/\*\*.*\*\*/)) ||
            (buffer.match(/`[^`]+`/)) ||
            (buffer.match(/\[([^\]]+)\]\(([^)]+)\)/));
    }

    processMarkdownPattern() {
        let processed = this.state.markdownBuffer;

        // Standard markdown processing
        if (processed.includes('###')) {
            processed = processed.replace(/###\s+(.+?)(?:\n|$)/g, '<h3>$1</h3>');
        }

        if (processed.includes('**')) {
            processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        }

        if (processed.includes('`')) {
            processed = processed.replace(/`([^`]+)`/g, (match, codeContent) => {
                const escapedCode = codeContent
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                return `<code class="inline-code">${escapedCode}</code>`;
            });
        }



        return processed.replaceAll('\n', '<br>');
    }


    startCodeBlock() {
        this.state.isInCodeBlock = true;
        this.state.codeBlockContent = '';

        const codeBlock = document.createElement('div');
        codeBlock.className = 'code-block';
        codeBlock.id = `code-block-${++this.existingCodeBlockCount}`;

        // Add code container first
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        pre.appendChild(code);
        codeBlock.appendChild(pre);

        // Create header and append at the bottom
        const header = document.createElement('div');
        header.className = 'code-header flex justify-between items-center';

        const langSpan = document.createElement('span');
        langSpan.className = 'code-language';
        header.appendChild(langSpan);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'flex gap-2';

        // Add copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'code-copy-btn';
        copyButton.textContent = Lang.get('codeCopyButton');
        copyButton.setAttribute('onclick', 'window.copyCodeBlock(this)');
        buttonsContainer.appendChild(copyButton);

        // Add new "copy with line numbers" button
        const copyWithLineNumsButton = document.createElement('button');
        copyWithLineNumsButton.className = 'code-copy-with-lines-btn';
        copyWithLineNumsButton.textContent = Lang.get('codeCopyWithLinesButton') || 'Copy with #';
        copyWithLineNumsButton.setAttribute('onclick', 'window.copyCodeBlockWithLineNumbers(this)');
        copyWithLineNumsButton.style.display = 'none'; // Initially hidden, show when code is longer
        buttonsContainer.appendChild(copyWithLineNumsButton);

        header.appendChild(buttonsContainer);
        codeBlock.appendChild(header);

        // Add line numbers container (hidden by default)
        const lineNumbersContainer = document.createElement('div');
        lineNumbersContainer.className = 'line-numbers';
        lineNumbersContainer.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        padding: 1em 0;
        background-color: var(--bg-color, #f6f8fa);
        border-right: 1px solid var(--border-color, #d1d9e0);
        user-select: none;
        display: none;
        visibility: hidden;
        width: 3em;
        box-sizing: border-box;
        font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
        font-size: 14px;
        z-index: 1;
    `;

        pre.style.position = 'relative'; // Ensure pre is positioned for absolute children
        pre.appendChild(lineNumbersContainer);

        // Add toggle button for line numbers
        const toggleLineNumbersBtn = document.createElement('button');
        toggleLineNumbersBtn.className = 'toggle-line-numbers';
        toggleLineNumbersBtn.textContent = Lang.get('codeToggleLineNumbers') || '#';
        toggleLineNumbersBtn.title = Lang.get('codeToggleLineNumbersTitle') || 'Toggle line numbers';
        toggleLineNumbersBtn.style.cssText = `
            padding: 2px 6px;
            font-size: 10px;
            background-color: var(--button-bg);
            color: var( --text-color);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            cursor: pointer;
            margin-right: 8px;
        `;
        toggleLineNumbersBtn.setAttribute('onclick', 'window.toggleCodeLineNumbers(this)');
        buttonsContainer.insertBefore(toggleLineNumbersBtn, buttonsContainer.firstChild);

        this.state.currentCodeBlock = codeBlock;
        this.state.cleanCodeContent = '';
        this.responseContainer.appendChild(codeBlock);

        // Update raw HTML too
        this.rawResponseHtml = this.responseContainer.innerHTML;
    }
    endCodeBlock() {
        //this.logger.info('Ending code block');
        if (this.state.currentCodeBlock) {
            const codeElement = this.state.currentCodeBlock.querySelector('code');
            if (codeElement) {
                const cleanHtml = codeElement.innerHTML.replace(/```\s*$/, '');
                codeElement.innerHTML = cleanHtml;

                if (this.state.cleanCodeContent) {
                    // Store the original clean code with newlines intact
                    const rawCleanCode = this.state.cleanCodeContent.replace(/```\s*$/, '');

                    // IMPORTANT: We need to store the code in multiple ways to ensure it survives serialization

                    // 1. Use setAttribute directly - more reliable than dataset for serialization
                    codeElement.setAttribute('data-saved-code', rawCleanCode);

                    // 2. Also set the dataset property for internal use
                    codeElement.dataset.cleanCode = rawCleanCode;

                    // 3. Add a special comment node as a backup storage mechanism
                    const codeComment = document.createComment(`SAVED_CODE_BACKUP:${btoa(unescape(encodeURIComponent(rawCleanCode)))
                        }`);
                    codeElement.appendChild(codeComment);




                }
            }
        }

        this.state.isInCodeBlock = false;
        this.state.currentLanguage = '';
        this.state.currentCodeBlock = null;
        this.state.codeBlockContent = '';
        this.state.cleanCodeContent = '';
        this.tempBackticksBuffer = '';

        // Update raw HTML
        this.rawResponseHtml = this.responseContainer.innerHTML;
    }

    // Processes a chunk of code content, applying syntax highlighting and updating the code block.
    processCodeContent(chunk) {
        if (this.state.currentCodeBlock) {
            if (!this.state.codeBlockContent) {
                const normalizedLang = CodeStyler.normalizeLanguage(chunk.trim());
                if (normalizedLang) {
                    const langSpan = this.state.currentCodeBlock.querySelector('.code-language');
                    this.state.currentLanguage = normalizedLang;
                    if (langSpan) {
                        langSpan.textContent = normalizedLang.charAt(0).toUpperCase() +
                            normalizedLang.slice(1);

                        const buttonsContainer = this.state.currentCodeBlock.querySelector('.code-header .flex.gap-2');
                        if (buttonsContainer) {
                            // Add Run button for HTML
                            if (normalizedLang === 'markup' || normalizedLang === 'html') {
                                this.addRunButton(buttonsContainer, {
                                    className: 'code-run-btn',
                                    text: 'Run',
                                    color: '#22c55e',
                                    onclick: 'window.runHtmlCode(this)'
                                });
                            }
                        }
                    }
                    // Make sure cleanCodeContent is initialized
                    this.state.cleanCodeContent = '';
                    return;
                }
            }

            if (!this.state.cleanCodeContent) {
                this.state.cleanCodeContent = '';
            }
            this.state.cleanCodeContent += chunk;
            this.state.codeBlockContent += chunk;

            const codeElement = this.state.currentCodeBlock.querySelector('code');
            if (codeElement) {
                codeElement.dataset.cleanCode = this.state.cleanCodeContent;

                if (this.state.currentLanguage) {
                    try {
                        const highlightedCode = CodeStyler.highlightCode(this.state.cleanCodeContent, this.state.currentLanguage);
                        codeElement.innerHTML = highlightedCode;
                    } catch (error) {
                        console.error('Error applying syntax highlighting:', error);
                        codeElement.textContent = this.state.cleanCodeContent;
                    }
                } else {
                    codeElement.textContent = this.state.cleanCodeContent;
                }
            }

            // Update raw HTML
            this.rawResponseHtml = this.responseContainer.innerHTML;
            this.scrollIfNeeded();
        }
    }
    processMarkdownTable(tableText) {
        if (!tableText || !tableText.includes('|')) return tableText;

        // Split by lines
        const lines = tableText.trim().split('\n');
        if (lines.length < 2) return tableText;

        // Check if this looks like a table
        const hasHeaderSeparator = lines.some(line =>
            line.trim().startsWith('|') &&
            line.includes('-') &&
            line.trim().endsWith('|'));

        if (!hasHeaderSeparator) return tableText;

        // Build table HTML
        let tableHtml = '<div class="markdown-table-container"><table class="markdown-table">';
        let isHeader = true;

        for (const line of lines) {
            // Skip the separator line
            if (line.includes('---') || line.includes('+-')) continue;

            const cells = line.split('|').filter(cell => cell.trim() !== '');
            if (cells.length === 0) continue;

            tableHtml += isHeader ? '<thead><tr>' : '<tr>';

            for (const cell of cells) {
                const tag = isHeader ? 'th' : 'td';
                tableHtml += `<${tag}>${cell.trim()}</${tag}>`;
            }

            tableHtml += isHeader ? '</tr></thead><tbody>' : '</tr>';
            isHeader = false;
        }

        tableHtml += '</tbody></table></div>';
        return tableHtml;
    }
    processThinking(thinkingText) {
        //  CRITICAL: Always check localStorage fresh for each thinking chunk
        // Prefer centralized ThinkingState helper if available to respect model-specific overrides
        const currentThinkingEnabled = (window.ThinkingState && typeof window.ThinkingState.getEffectiveThinkingEnabled === 'function')
            ? window.ThinkingState.getEffectiveThinkingEnabled()
            : (localStorage.getItem('thinkingEnabled') === 'true');

        if (!currentThinkingEnabled) {
            console.log('🧠 StreamProcessor: currentThinkingEnabled is false, skipping thinking data. cached=', this._cachedThinkingEnabled, 'currentEffective=', currentThinkingEnabled);
            return;
        }

        //  FIX: Always check if we need to start native thinking mode
        // Don't rely on the active flag alone, check if we have a valid container
        const hasValidContainer = this.thinkingMode.container &&
            this.thinkingMode.container.parentNode &&
            this.thinkingMode.active &&
            this.thinkingMode.isNative;

        // If we don't have a valid native thinking container, start one
        if (!hasValidContainer) {
            console.log('🧠 StreamProcessor: Starting native thinking mode - reason: No valid container');
            this.startNativeThinkingMode();
        }

        // Now append the thinking content
        if (this.thinkingMode.isNative && this.thinkingMode.container) {
            this.appendThinkingContent(thinkingText);
        } else {
            console.error('🧠 StreamProcessor: Failed to create or find thinking container');
        }
    }

    // Starts the (non-native) thinking mode, creating the UI and timer.
    startThinkingMode() {
        //console.log('StreamProcessor: Starting thinking mode');
        this.thinkingMode.active = true;
        this.thinkingMode.content = '';
        this.thinkingMode.startTime = new Date();
        this.thinkingMode.elapsedSeconds = 0;

        // Generate a truly unique ID with message-specific information
        const messageId = this.responseContainer.closest('.assistant-message')?.dataset?.messageId || '';
        // Add message timestamp for additional uniqueness
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substring(2, 10);
        // Combine message ID, timestamp and random string for true uniqueness
        const thinkingId = `thinking_${messageId}_${timestamp}_${randomPart}`;

        //console.log(`Generated unique thinking ID: ${thinkingId}`);
        this.thinkingMode.id = thinkingId;

        // Register in global registry with this unique ID
        window.activeThinkingModes = window.activeThinkingModes || new Map();
        window.activeThinkingModes.set(thinkingId, this.thinkingMode);

        // Track the container's creation order for proper backup restoration
        window.thinkingContainerCount = (window.thinkingContainerCount || 0) + 1;
        const containerOrder = window.thinkingContainerCount;

        // Create thinking mode container with unique attributes
        const thinkingContainer = document.createElement('div');
        thinkingContainer.className = 'thinking-mode-container';
        thinkingContainer.dataset.thinking = 'true';
        thinkingContainer.dataset.thinkingId = thinkingId;
        thinkingContainer.dataset.containerOrder = containerOrder;
        thinkingContainer.id = `thinking-container-${thinkingId}`;
        thinkingContainer.style.cssText = `
            margin: 10px 0;
            padding: 10px;
            border-radius: 8px;
            background-color: var(--thinking-bg, rgba(247, 237, 226, 0.1));
            border: 1px solid var(--thinking-border, rgba(214, 158, 46, 0.1));
            transition: all 0.3s ease;
        `;
        // Create header with timer
        const header = document.createElement('div');
        header.className = 'thinking-header';
        header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between; /* This ensures space between left items and right items */
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--thinking-header-color, #d69e2e);
    `;

        // Left side container for icon and label
        const leftContainer = document.createElement('div');
        leftContainer.style.cssText = 'display: flex; align-items: center;';

        const thinkingIcon = document.createElement('span');
        thinkingIcon.innerHTML = `<i class="fa-solid fa-lightbulb" style="margin-right: 8px;"></i>`;
        leftContainer.appendChild(thinkingIcon);

        const thinkingLabel = document.createElement('span');
        thinkingLabel.textContent = Lang.get('modelThinking') || 'Model thinking: ';
        leftContainer.appendChild(thinkingLabel);

        const timer = document.createElement('span');
        timer.className = 'thinking-timer';
        timer.textContent = '0s';
        timer.style.marginLeft = '5px';
        leftContainer.appendChild(timer);

        header.appendChild(leftContainer);

        // Right side - toggle button with clearer text
        const toggleButton = document.createElement('button');
        toggleButton.className = 'thinking-toggle-btn';
        toggleButton.innerHTML = `<i class="fa-solid fa-chevron-down"></i> <span class="toggle-text">${Lang.get('thinkingCollapsed') || 'Show thinking'}</span>`;
        toggleButton.style.cssText = `
        margin-left: auto;
        padding: 4px 8px;
        background-color: var(--thinking-toggle-bg, rgba(214, 158, 46, 0.1));
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        font-size: 0.85em;
    `;

        // Define global toggle handler with improved content restoration
        if (typeof window.toggleThinkingVisibility !== 'function') {
            window.toggleThinkingVisibility = function (btn) {
                //console.log('Global toggle thinking visibility called');
                const container = btn.closest('.thinking-mode-container');
                if (!container) return;

                const content = container.querySelector('.thinking-content');
                if (!content) return;

                const isExpanded = content.style.maxHeight !== '0px' && content.style.maxHeight !== '';
                //console.log('Toggling thinking, current state:', isExpanded ? 'expanded' : 'collapsed');

                if (isExpanded) {
                    // Collapse
                    content.style.maxHeight = '0px';
                    content.style.borderTop = '0px solid var(--thinking-separator, rgba(214, 158, 46, 0.1))';
                    content.style.paddingTop = '0';
                    content.style.marginTop = '0';
                    btn.innerHTML = `<i class="fa-solid fa-chevron-down"></i> <span class="toggle-text">${Lang.get('thinkingCollapsed') || 'Show thinking'}</span>`;
                    btn.setAttribute('title', Lang.get('thinkingCollapsed') || 'Show thinking process');

                } else {
                    // Expand - ALWAYS try to restore content from backup
                    //console.log('Expanding thinking content, attempting to restore from backup');

                    // Try to restore from backup EVERY time we expand, not just when empty
                    if (content.id) {
                        const backupDiv = document.getElementById(`${content.id}-backup`);
                        if (backupDiv) {
                            //console.log('Found backup div, restoring content');
                            content.innerHTML = backupDiv.innerHTML;
                        } else if (window.thinkingBackups && window.thinkingBackups[content.id]) {
                            //console.log('Found global backup, restoring content');
                            content.innerHTML = window.thinkingBackups[content.id];
                        } else {
                            //console.log('No backup found for ID:', content.id);
                        }
                    }

                    // Ensure content is visible and styled correctly
                    content.style.display = 'block';

                    // Force a reflow before setting max-height to ensure scrollHeight is calculated correctly
                    void content.offsetWidth;

                    // Set max-height after a short delay to ensure content is rendered
                    setTimeout(() => {
                        const newHeight = Math.max(300, content.scrollHeight) + 'px';
                        content.style.maxHeight = newHeight;
                        //console.log('Set content max-height to:', newHeight);

                        // Wait for the transition to complete (300ms + a small buffer)
                        setTimeout(() => {
                            // Get the main scrollable container instead of just scrolling the thinking container
                            const aiReplies = document.querySelector('.ai-replies');
                            if (aiReplies) {
                                // Calculate where to scroll to ensure the thinking container is visible
                                // Get container position relative to the scrollable area
                                const containerRect = container.getBoundingClientRect();
                                const aiRepliesRect = aiReplies.getBoundingClientRect();

                                // Calculate how much we need to scroll to center the expanded thinking content
                                const scrollTarget = container.offsetTop - (aiReplies.clientHeight / 2) + (containerRect.height / 2);

                                // Perform the scroll with animation
                                aiReplies.scrollTo({
                                    top: Math.max(0, scrollTarget),
                                    behavior: 'smooth'
                                });
                            }
                        }, 320); // Wait for the 0.3s transition to complete
                    }, 10);

                    content.style.overflow = 'auto';
                    content.style.scrollbarWidth = 'none';
                    content.style.msOverflowStyle = 'none';
                    content.style.borderTop = '1px solid var(--thinking-separator, rgba(214, 158, 46, 0.1))';
                    content.style.paddingTop = '10px';
                    content.style.marginTop = '8px';
                    btn.innerHTML = `<i class="fa-solid fa-chevron-up"></i> <span class="toggle-text">${Lang.get('thinkingExpanded') || 'Hide thinking'}</span>`;
                    btn.setAttribute('title', Lang.get('thinkingExpanded') || 'Hide thinking process');
                }

                return false; // Prevent default
            };
        }

        // Use the global function directly with the onclick attribute
        toggleButton.setAttribute('onclick', 'window.toggleThinkingVisibility(this); return false;');

        header.appendChild(toggleButton);
        thinkingContainer.appendChild(header);

        // Create content area (collapsed by default, with lighter text)
        const content = document.createElement('div');
        content.className = 'thinking-content';
        content.id = `thinking-content-${thinkingId}`;
        content.style.cssText = `
            font-family: monospace;
            white-space: pre-wrap;
            font-size: 0.9em;
            color: var(--text-color);
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            border-top: 0px solid var(--thinking-separator, rgba(214, 158, 46, 0.1));
            
            /* Hide scrollbars but keep scrolling functionality */
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE and Edge */
        `;

        // Add a style tag to handle the webkit scrollbar (can't be done inline)
        if (!document.getElementById('thinking-scrollbar-style')) {
            const style = document.createElement('style');
            style.id = 'thinking-scrollbar-style';
            style.textContent = `
                .thinking-content::-webkit-scrollbar {
                    display: none; /* Chrome, Safari, Opera */
                }
            `;
            document.head.appendChild(style);
        }
        thinkingContainer.appendChild(content);

        content.dataset.backupVersion = timestamp;
        thinkingContainer.dataset.backupVersion = timestamp;

        // Store references
        this.thinkingMode.container = thinkingContainer;
        this.thinkingMode.timerElement = timer;

        // Append to response
        this.responseContainer.appendChild(thinkingContainer);

        requestAnimationFrame(() => {
            const aiReplies = document.querySelector('.ai-replies');
            if (aiReplies) {
                // Scroll thinking container into view
                thinkingContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Alternative approach: scroll the entire container to the bottom
                // aiReplies.scrollTop = aiReplies.scrollHeight;
            }
        });

        // Start timer
        this.thinkingMode.incrementSeconds = () => {
            if (!this.thinkingMode.active) return; // Safety check
            this.thinkingMode.elapsedSeconds++;
            if (this.thinkingMode.timerElement) {
                this.thinkingMode.timerElement.textContent = `${this.thinkingMode.elapsedSeconds}s`;
            }
        };

        // Clear any existing timer first
        if (this.thinkingMode.timer) {
            clearInterval(this.thinkingMode.timer);
            this.thinkingMode.timer = null;
        }

        // Start a new timer with the named function
        this.thinkingMode.timer = setInterval(this.thinkingMode.incrementSeconds, 1000);

        // Update raw HTML
        this.rawResponseHtml = this.responseContainer.innerHTML;
    }

    cancelThinkingMode() {
        //console.log('StreamProcessor: Cancelling thinking mode due to abort');
        // Remove from global registry
        if (this.thinkingMode.id) {
            window.activeThinkingModes.delete(this.thinkingMode.id);
        }
        // Safety check - prevent multiple cancellations
        if (this.thinkingMode._cancelInProgress) {
            //console.log('StreamProcessor: Cancellation already in progress, skipping');
            return;
        }

        // Mark cancellation in progress
        this.thinkingMode._cancelInProgress = true;

        // 1. IMMEDIATELY update UI to visually indicate cancellation
        if (this.thinkingMode.timerElement) {
            const cancelledText = Lang.get('cancelled') || 'cancelled';
            this.thinkingMode.timerElement.textContent = `${this.thinkingMode.elapsedSeconds}s (${cancelledText})`;
            this.thinkingMode.timerElement.style.color = 'var(--thinking-cancelled-color, #e53e3e)';
            this.thinkingMode.timerElement.style.textDecoration = 'line-through';
            this.thinkingMode.timerElement.dataset.timerState = 'cancelled';
        }

        // 2. DISABLE incrementSeconds function before clearing timer
        const originalIncrement = this.thinkingMode.incrementSeconds;
        this.thinkingMode.incrementSeconds = function () {
            //console.log('StreamProcessor: Prevented increment after cancellation');
            return;
        };

        // 3. Capture timer ID in local variable AND null the property immediately
        const timerIdToCancel = this.thinkingMode.timer;
        this.thinkingMode.timer = null;

        // 4. Set cancelled state flags
        this.thinkingMode.active = false;
        this.thinkingMode.cancelled = true;
        this.thinkingMode.endTime = new Date();

        // 5. Clear the timer with multiple approaches
        if (timerIdToCancel) {
            try {
                // Try multiple clearInterval approaches
                window.clearInterval(timerIdToCancel);
                clearInterval(timerIdToCancel);

                // Force garbage collection on the timer
                setTimeout(() => {
                    try {
                        window.clearInterval(timerIdToCancel);
                    } catch (e) { }
                }, 100);

                //console.log('StreamProcessor: Timer successfully cleared with ID:', timerIdToCancel);
            } catch (e) {
                console.error('StreamProcessor: Error clearing timer:', e);
            }
        }

        // 6. Update UI elements to show cancelled state
        if (this.thinkingMode.container) {
            const header = this.thinkingMode.container.querySelector('.thinking-header');
            if (header) {
                // Update visual elements
                header.style.color = 'var(--thinking-cancelled-color, #e53e3e)';

                const label = header.querySelector('span:nth-child(2)');
                if (label) {
                    label.textContent = Lang.get('modelThinkingCancelled') || 'Thinking cancelled: ';
                }

                const icon = header.querySelector('i.fa-lightbulb');
                if (icon) {
                    icon.className = 'fa-solid fa-ban';
                }

                // Keep toggle button visible
                const toggleBtn = header.querySelector('.thinking-toggle-btn');
                if (toggleBtn) {
                    toggleBtn.style.opacity = '1';
                }

                this.thinkingMode.container.classList.add('thinking-cancelled');
            }
        }

        // 7. Add a global cancellation flag as extra protection
        window._thinkingCancelled = true;

        //console.log('StreamProcessor: Thinking mode cancellation complete');

        // 8. Remove cancellation in progress flag after a delay
        setTimeout(() => {
            this.thinkingMode._cancelInProgress = false;
        }, 500);
    }

    finishResponse() {
        // If we have an active code block, end it properly
        if (this.state.isInCodeBlock) {
            this.endCodeBlock();
        }

        // Handle thinking mode cleanup
        if (this.thinkingMode.timer) {
            //console.log('StreamProcessor: Timer interval cleared in finishResponse');
            clearInterval(this.thinkingMode.timer);
            this.thinkingMode.timer = null;
        }

        // End thinking mode if it's still active
        if (this.thinkingMode.active) {
            this.endThinkingMode();
        }

        // Set flag indicating this is a complete response
        this.isFullResponse = true;

        this.cleanLatexExpressions();
        this.postProcessMarkdownLinks();
        this.postProcessTextTables();
        //console.log('StreamProcessor: finishResponse - ensuring message actions are added');

        // Store the StreamProcessor instance for reference
        this.responseContainer.streamProcessor = this;

        // Try to add message actions if not already present
        const assistantMessage = this.responseContainer.closest('.assistant-message');
        if (assistantMessage && !assistantMessage.querySelector('.message-actions, .copy-response-container')) {
            // Use a timeout to ensure DOM is stable before adding actions
            setTimeout(() => {
                if (window.chat && typeof window.chat.addMessageActionsToMessage === 'function') {
                    //console.log('StreamProcessor: Adding message actions via window.chat');
                    window.chat.addMessageActionsToMessage(assistantMessage);
                } else {
                    //console.log('StreamProcessor: Using fallback message actions');
                    this.addSimpleMessageActions();
                }
            }, 50);
        }

        // Add thinking summary if we had thinking
        if (this.thinkingMode.container && this.thinkingMode.elapsedSeconds > 0) {
            const summaryElement = document.createElement('div');
            summaryElement.className = 'thinking-summary';
            summaryElement.style.cssText = `
            margin-top: 8px;
            padding: 6px 10px;
            background-color: var(--thinking-summary-bg, rgba(214, 158, 46, 0.05));
            border-radius: 4px;
            font-size: 0.85em;
            color: var(--thinking-summary-color, #8b7355);
            font-style: italic;
        `;
            summaryElement.textContent = `${Lang.get('thinkingCompletedIn') || 'Thinking completed in'} ${this.thinkingMode.elapsedSeconds}s`;

            if (this.thinkingMode.container) {
                this.thinkingMode.container.appendChild(summaryElement);
            }
        }

        //  FIX: Complete reset of thinking mode state
        this.thinkingMode = {
            active: false,
            content: '',
            startTime: null,
            endTime: null,
            container: null,
            timer: null,
            timerElement: null,
            elapsedSeconds: 0,
            isNative: false,
            id: null
        };
    }

    endThinkingMode() {
        //console.log('StreamProcessor: Ending thinking mode');

        // Remove from global registry
        if (this.thinkingMode.id) {
            window.activeThinkingModes.delete(this.thinkingMode.id);
        }

        // IMPORTANT: Stop timer first to prevent race conditions
        if (this.thinkingMode.timer) {
            clearInterval(this.thinkingMode.timer);
            this.thinkingMode.timer = null;
            //console.log('StreamProcessor: Timer interval cleared in endThinkingMode');
        }

        // Now mark inactive since timer has been stopped
        this.thinkingMode.active = false;
        this.thinkingMode.endTime = new Date();

        // Update timer display to show final time
        if (this.thinkingMode.timerElement) {
            const totalSeconds = this.thinkingMode.elapsedSeconds;
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            let timeDisplay = '';
            if (minutes > 0) {
                timeDisplay = `${minutes}m ${seconds}s`;
            } else {
                timeDisplay = `${seconds}s`;
            }

            this.thinkingMode.timerElement.textContent = timeDisplay;
        }

        // Update container styling to show it's complete
        if (this.thinkingMode.container) {
            const contentElement = this.thinkingMode.container.querySelector('.thinking-content');

            if (contentElement && contentElement.innerHTML) {
                // Get message ID for better association
                const messageElement = this.thinkingMode.container.closest('.assistant-message');
                const messageId = messageElement?.dataset?.messageId || '';

                // Use the existing thinkingId instead of creating a new one
                const uniqueId = this.thinkingMode.id;
                const backupVersion = this.thinkingMode.container.dataset.backupVersion;

                // Create a versioned backup ID that won't overwrite previous backups
                const backupDivId = `${uniqueId}-backup-${backupVersion}`;

                // Store this specific association
                this.thinkingMode.container.dataset.backupDivId = backupDivId;
                this.thinkingMode.container.dataset.messageId = messageId;

                //console.log(`Creating backup with unique ID: ${backupDivId}, messageId: ${messageId}`);

                // BACKUP METHOD 1: Create a permanent, hidden backup div with message and version info
                const backupDiv = document.createElement('div');
                backupDiv.id = backupDivId;
                backupDiv.className = 'thinking-backup';
                backupDiv.dataset.thinkingId = uniqueId;
                backupDiv.dataset.backupVersion = backupVersion;
                backupDiv.dataset.containerOrder = this.thinkingMode.container.dataset.containerOrder;
                backupDiv.dataset.messageId = messageId;
                backupDiv.dataset.timestamp = Date.now();
                backupDiv.style.cssText = 'display: none !important; position: absolute !important;';
                backupDiv.innerHTML = contentElement.innerHTML;
                document.body.appendChild(backupDiv);

                // BACKUP METHOD 2: Store in global variable with message and version information
                window.thinkingBackups = window.thinkingBackups || {};

                // Add a version key that includes message ID
                const msgVersionKey = `${messageId}_${uniqueId}_v${backupVersion}`;
                window.thinkingBackups[msgVersionKey] = contentElement.innerHTML;

                // Use a compound key that includes container info and backup version
                const backupKey = `${uniqueId}_v${backupVersion}`;
                window.thinkingBackups[backupKey] = contentElement.innerHTML;

                // Also keep the simple lookup by thinking ID (for backward compatibility)
                window.thinkingBackups[uniqueId] = contentElement.innerHTML;

                // NEW: Group backups by message ID
                window.thinkingBackupsByMessage = window.thinkingBackupsByMessage || {};
                window.thinkingBackupsByMessage[messageId] = window.thinkingBackupsByMessage[messageId] || [];
                window.thinkingBackupsByMessage[messageId].push({
                    id: uniqueId,
                    containerId: this.thinkingMode.container.id,
                    backupDivId: backupDivId,
                    containerOrder: this.thinkingMode.container.dataset.containerOrder,
                    timestamp: Date.now(),
                    content: contentElement.innerHTML
                });

                // Add a registry of all backups by container order for last-resort fallbacks
                window.thinkingBackupsByOrder = window.thinkingBackupsByOrder || {};
                window.thinkingBackupsByOrder[this.thinkingMode.container.dataset.containerOrder] = {
                    id: uniqueId,
                    messageId: messageId,
                    version: backupVersion,
                    backupDivId: backupDivId,
                    content: contentElement.innerHTML
                };

                // BACKUP METHOD 3: Store directly on the content element
                contentElement.dataset.originalContent = contentElement.innerHTML;

                // BACKUP METHOD 4: Store on the container element with clear attribute name
                this.thinkingMode.container.dataset.thinkingContent = contentElement.innerHTML;

                // BACKUP METHOD 5: Keep a reference in the thinking mode object
                this.thinkingMode.contentHTML = contentElement.innerHTML;

                // Add metadata to help debugging
                contentElement.dataset.backupId = uniqueId;
                contentElement.dataset.contentLength = contentElement.innerHTML.length;

                //console.log(`Backed up thinking container #${this.thinkingMode.container.dataset.containerOrder} with ID ${uniqueId} for message ${messageId}`);
            } else {
                console.warn('No thinking content to back up or content element not found');
            }

            // Rest of the styling code...
            const header = this.thinkingMode.container.querySelector('.thinking-header');
            if (header) {
                header.style.color = 'var(--thinking-complete-color, #68d391)';

                // Update label to show completion
                const label = header.querySelector('span:nth-child(2)');
                if (label) {
                    label.textContent = Lang.get('modelThoughtComplete') || 'Thinking complete: ';
                }

                // Update icon
                const icon = header.querySelector('i.fa-lightbulb');
                if (icon) {
                    icon.className = 'fa-solid fa-check';
                }

                // CRITICAL: Ensure the toggle button remains highly visible and clickable
                const toggleBtn = header.querySelector('.thinking-toggle-btn');
                if (toggleBtn) {
                    toggleBtn.style.cssText = `
                        opacity: 1 !important;
                        visibility: visible !important;
                        display: flex !important;
                        align-items: center !important;
                        cursor: pointer !important;
                        pointer-events: auto !important;
                        background-color: var(--thinking-toggle-bg, rgba(104, 211, 145, 0.1)) !important;
                        padding: 4px 8px !important;
                        border-radius: 4px !important;
                        transition: none !important;
                        margin-left: auto !important;
                        z-index: 1000 !important;
                        border: none !important;
                        font-size: 0.85em !important;
                    `;

                    // ENSURE the onclick attribute is properly set and won't be overridden
                    toggleBtn.setAttribute('onclick', 'window.toggleThinkingVisibility(this); return false;');

                    // Remove any existing event listeners to avoid duplicates
                    const newToggleBtn = toggleBtn.cloneNode(true);
                    toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);

                    // Add extra protection against event loss
                    newToggleBtn.addEventListener('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.toggleThinkingVisibility(this);
                        return false;
                    });
                }
            }

            // Important: PRESERVE CURRENT STATE (open or closed)
            const content = this.thinkingMode.container.querySelector('.thinking-content');
            if (content) {
                // Check current state and preserve it
                const isCurrentlyExpanded = content.style.maxHeight !== '0px' && content.style.maxHeight !== '';
                this.thinkingMode.container.dataset.thinkingState = isCurrentlyExpanded ? 'expanded' : 'collapsed';
            }
        }
    }

    appendThinkingContent(content) {
        if (!this.thinkingMode.active || !this.thinkingMode.container) return;

        this.thinkingMode.content += content;
        const contentElement = this.thinkingMode.container.querySelector('.thinking-content');
        if (!contentElement) return;

        // Process the thinking content with basic formatting
        const processed = content
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');

        // Check if we need to update expanded container
        const toggleBtn = this.thinkingMode.container.querySelector('.thinking-toggle-btn');
        const isExpanded = toggleBtn && toggleBtn.innerHTML.includes('fa-chevron-up');

        if (!isExpanded) {
            // If collapsed, just update the content without scrolling
            contentElement.innerHTML += processed;
            return;
        }

        // Add smooth scroll property if not already present
        if (contentElement.style.scrollBehavior !== 'smooth') {
            contentElement.style.scrollBehavior = 'smooth';
        }

        // IMPORTANT: Batch DOM operations to prevent visual jitter
        window.cancelAnimationFrame(this._scrollRAF);
        this._scrollRAF = window.requestAnimationFrame(() => {
            // 1. Add content first
            contentElement.innerHTML += processed;

            // 2. Calculate if user has scrolled up manually
            const isScrolledToBottom = Math.abs(
                (contentElement.scrollHeight - contentElement.scrollTop) -
                contentElement.clientHeight
            ) < 50; // 50px threshold

            // 3. Update height with some extra buffer to reduce future resizes
            const newMaxHeight = Math.max(300, contentElement.scrollHeight + 100) + 'px';
            contentElement.style.maxHeight = newMaxHeight;

            // 4. Only auto-scroll if user hasn't manually scrolled up
            if (isScrolledToBottom) {
                // Slight delay to let the height update take effect first
                setTimeout(() => {
                    contentElement.scrollTop = contentElement.scrollHeight;

                    // Handle parent container scroll if needed
                    const aiReplies = document.querySelector('.ai-replies');
                    if (aiReplies) {
                        const container = this.thinkingMode.container;
                        const containerRect = container.getBoundingClientRect();
                        const aiRepliesRect = aiReplies.getBoundingClientRect();

                        // Only scroll parent if the container bottom is out of view
                        if ((containerRect.bottom + 50) > aiRepliesRect.bottom) {
                            aiReplies.scrollBy({
                                top: 50, // Scroll just a little each time
                                behavior: 'smooth'
                            });
                        }
                    }
                }, 10);
            }
        });
    }

    startNativeThinkingMode() {
        //console.log('🧠 StreamProcessor: Starting native thinking mode');

        // Use the same logic as startThinkingMode but mark it as native
        this.thinkingMode.active = true;
        this.thinkingMode.content = '';
        this.thinkingMode.startTime = new Date();
        this.thinkingMode.elapsedSeconds = 0;
        this.thinkingMode.isNative = true; // Mark as native thinking

        // Generate a unique ID for native thinking
        const messageId = this.responseContainer.closest('.assistant-message')?.dataset?.messageId || '';
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substring(2, 10);
        const thinkingId = `native_thinking_${messageId}_${timestamp}_${randomPart}`;

        //console.log(`Generated unique native thinking ID: ${thinkingId}`);
        this.thinkingMode.id = thinkingId;

        // Register in global registry
        window.activeThinkingModes = window.activeThinkingModes || new Map();
        window.activeThinkingModes.set(thinkingId, this.thinkingMode);

        window.thinkingContainerCount = (window.thinkingContainerCount || 0) + 1;
        const containerOrder = window.thinkingContainerCount;

        // Create thinking mode container (reuse existing styling)
        const thinkingContainer = document.createElement('div');
        thinkingContainer.className = 'thinking-mode-container native-thinking';
        thinkingContainer.dataset.thinking = 'true';
        thinkingContainer.dataset.thinkingId = thinkingId;
        thinkingContainer.dataset.containerOrder = containerOrder;
        thinkingContainer.dataset.isNative = 'true';
        thinkingContainer.id = `thinking-container-${thinkingId}`;
        thinkingContainer.style.cssText = `
        margin: 10px 0;
        padding: 10px;
        border-radius: 8px;
        background-color: var(--thinking-bg, rgba(247, 237, 226, 0.1));
        border: 1px solid var(--thinking-border, rgba(214, 158, 46, 0.1));
        transition: all 0.3s ease;
    `;

        // Create header with timer (same as existing)
        const header = document.createElement('div');
        header.className = 'thinking-header';
        header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--thinking-header-color, #d69e2e);
    `;

        // Left side container for icon and label
        const leftContainer = document.createElement('div');
        leftContainer.style.cssText = 'display: flex; align-items: center;';

        const thinkingIcon = document.createElement('span');
        thinkingIcon.innerHTML = `<i class="fa-solid fa-lightbulb" style="margin-right: 8px;"></i>`;
        leftContainer.appendChild(thinkingIcon);

        const thinkingLabel = document.createElement('span');
        thinkingLabel.textContent = Lang.get('modelThinking') || 'Model thinking: ';
        leftContainer.appendChild(thinkingLabel);

        const timer = document.createElement('span');
        timer.className = 'thinking-timer';
        timer.textContent = '0s';
        timer.style.marginLeft = '5px';
        leftContainer.appendChild(timer);

        header.appendChild(leftContainer);

        // Right side - toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'thinking-toggle-btn';
        toggleButton.innerHTML = `<i class="fa-solid fa-chevron-down"></i> <span class="toggle-text">${Lang.get('thinkingCollapsed') || 'Show thinking'}</span>`;
        toggleButton.style.cssText = `
        margin-left: auto;
        padding: 4px 8px;
        background-color: var(--thinking-toggle-bg, rgba(214, 158, 46, 0.1));
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        font-size: 0.85em;
    `;

        toggleButton.setAttribute('onclick', 'window.toggleThinkingVisibility(this); return false;');
        header.appendChild(toggleButton);
        thinkingContainer.appendChild(header);

        // Create content area (collapsed by default)
        const content = document.createElement('div');
        content.className = 'thinking-content';
        content.id = `thinking-content-${thinkingId}`;
        content.style.cssText = `
        font-family: monospace;
        white-space: pre-wrap;
        font-size: 0.9em;
        color: var(--text-color);
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;
        border-top: 0px solid var(--thinking-separator, rgba(214, 158, 46, 0.1));
        scrollbar-width: none;
        -ms-overflow-style: none;
    `;

        thinkingContainer.appendChild(content);

        content.dataset.backupVersion = timestamp;
        thinkingContainer.dataset.backupVersion = timestamp;

        // Store references
        this.thinkingMode.container = thinkingContainer;
        this.thinkingMode.timerElement = timer;

        // Append to response
        this.responseContainer.appendChild(thinkingContainer);

        // Start timer (reuse existing timer logic)
        this.thinkingMode.incrementSeconds = () => {
            if (!this.thinkingMode.active) return;
            this.thinkingMode.elapsedSeconds++;
            if (this.thinkingMode.timerElement) {
                this.thinkingMode.timerElement.textContent = `${this.thinkingMode.elapsedSeconds}s`;
            }
        };

        if (this.thinkingMode.timer) {
            clearInterval(this.thinkingMode.timer);
            this.thinkingMode.timer = null;
        }

        this.thinkingMode.timer = setInterval(this.thinkingMode.incrementSeconds, 1000);

        // Update raw HTML
        this.rawResponseHtml = this.responseContainer.innerHTML;

        // Scroll into view
        requestAnimationFrame(() => {
            const aiReplies = document.querySelector('.ai-replies');
            if (aiReplies) {
                thinkingContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }
    getCleanResponseText() {
        // Create a clone of response container
        const clone = this.responseContainer.cloneNode(true);

        // Remove thinking containers
        const thinkingContainers = clone.querySelectorAll('.thinking-mode-container, .thinking-summary');
        thinkingContainers.forEach(container => container.remove());

        // Also remove UI elements
        const uiElements = clone.querySelectorAll('.message-actions, .copy-response-container');
        uiElements.forEach(el => el.remove());

        // Get just the text content
        return clone.textContent.trim();
    }

    getCleanResponseHTML() {
        // Create a clone of response container to avoid modifying the displayed version
        const clone = this.responseContainer.cloneNode(true);

        // 1. Remove thinking containers and summaries from the clone
        const thinkingElements = clone.querySelectorAll(
            '.thinking-mode-container, .thinking-summary, .thinking-transition, [data-thinking="true"], [class*="thinking-"]'
        );
        thinkingElements.forEach(el => el.remove());

        // 2. Remove empty divs and paragraphs that might remain after thinking removal
        const emptyElements = clone.querySelectorAll('div:empty, p:empty, span:empty');
        emptyElements.forEach(el => el.remove());

        // CRITICAL: Ensure code blocks have their formatting preserved by explicitly
        // copying the data-saved-code attribute to the cloned code elements
        const codeElements = clone.querySelectorAll('.code-block code');
        codeElements.forEach(clonedCodeElement => {
            // Find the corresponding original code element in the actual DOM
            const originalCodeId = clonedCodeElement.id;
            let originalCodeElement;

            if (originalCodeId) {
                originalCodeElement = document.getElementById(originalCodeId);
            } else {
                // If no ID, find by position in the same order
                const originalCodeBlocks = this.responseContainer.querySelectorAll('.code-block code');
                const clonedCodeBlocks = clone.querySelectorAll('.code-block code');

                // Find the matching index position
                for (let i = 0; i < clonedCodeBlocks.length; i++) {
                    if (clonedCodeBlocks[i] === clonedCodeElement) {
                        originalCodeElement = originalCodeBlocks[i];
                        break;
                    }
                }
            }

            // If we found the original, copy its attributes that store formatted code
            if (originalCodeElement) {
                // Check for data-saved-code first (most reliable)
                if (originalCodeElement.hasAttribute('data-saved-code')) {
                    const savedCode = originalCodeElement.getAttribute('data-saved-code');
                    clonedCodeElement.setAttribute('data-saved-code', savedCode);
                    //console.log('Preserved data-saved-code attribute for code block');
                }

                // Also check data-clean-code as backup
                if (originalCodeElement.dataset.cleanCode) {
                    clonedCodeElement.dataset.cleanCode = originalCodeElement.dataset.cleanCode;
                }

                // Ensure the cloned code element has the raw content with proper formatting
                if (!clonedCodeElement.textContent && originalCodeElement.textContent) {
                    clonedCodeElement.textContent = originalCodeElement.textContent;
                }
            }
        });

        // 5. Remove any hidden elements
        const hiddenElements = clone.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"]');
        hiddenElements.forEach(el => el.remove());

        // 6. Clean up whitespace in the HTML, but be careful not to affect spacing in code blocks
        let html = clone.outerHTML;

        // Only collapse multiple spaces in non-code content
        // This regex-based approach is imperfect but helps preserve code formatting
        html = html.replace(/(<code[^>]*>)([\s\S]*?)(<\/code>)/g, (match, openTag, codeContent, closeTag) => {
            // Preserve the code content exactly as is
            return openTag + codeContent + closeTag;
        });

        // Only apply whitespace cleanup outside of code tags
        html = html.replace(/(<code[^>]*>[\s\S]*?<\/code>)|(\s{2,})/g, (match, codeBlock, spaces) => {
            if (codeBlock) return codeBlock;  // Return code blocks unchanged
            if (spaces) return ' ';           // Collapse multiple spaces
            return match;
        });

        // Don't replace <br> tags with spaces to preserve line breaks
        // html = html.replace(/([,.;:!?])(<br\s*\/?>\s*)(?!<br\s*\/?>)/g, '$1 ');

        //console.log("getCleanResponseHTML generated HTML with preserved formatting (sample):",
            //html.substring(0, 100) + "...");

        return html;
    }
    // Post-processes markdown links, references, and URLs in the response container.
    postProcessMarkdownLinks() {
        //console.log('Post-processing links in finished response');

        // Get the current HTML content
        const container = this.responseContainer;
        if (!container) return;

        // Add this debug to track document+websearch mode specifically
        const isDocumentWebSearch = document.querySelector('.document-questioning-indicator') !== null &&
            document.getElementById('web-search').classList.contains('active');

        //console.log('Processing links in mode:', isDocumentWebSearch ? 'Document+WebSearch' : 'Standard');

        // FIRST PASS: Handle markdown links [text](url) - IMPROVED
        const processMarkdownLinks = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent.includes('[') && node.textContent.includes('](')) {
                    const content = node.textContent;
                    //  IMPROVED: Better markdown link pattern that handles more edge cases
                    const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;

                    if (pattern.test(content)) {
                        let processed = content.replace(pattern, (match, text, url) => {
                            //  IMPROVED: Smarter URL cleaning that preserves valid closing parentheses
                            let cleanUrl = url.trim();

                            // Only remove trailing punctuation if it's clearly not part of the URL
                            // Don't remove ) if the URL contains ( (balanced parentheses)
                            const openParens = (cleanUrl.match(/\(/g) || []).length;
                            const closeParens = (cleanUrl.match(/\)/g) || []).length;

                            if (openParens === closeParens) {
                                // Balanced parentheses, don't remove trailing )
                                cleanUrl = cleanUrl.replace(/[.,;:"']+$/, '');
                            } else {
                                // Unbalanced, safe to remove trailing punctuation including )
                                cleanUrl = cleanUrl.replace(/[.,;:"')\]]+$/, '');
                            }

                            //console.log(`Processing markdown link: [${text}](${url}) -> cleaned: ${cleanUrl}`);

                            // Skip reference links
                            if (text.startsWith('REF')) {
                                return match;
                            }

                            // Handle case where text is the full URL
                            if (text === url && text.startsWith('http')) {
                                return formatUrl(cleanUrl);
                            }

                            // Regular case: create proper clickable link
                            return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
                        });

                        // Only replace if changes were made
                        if (processed !== content) {
                            const fragment = document.createRange().createContextualFragment(processed);
                            node.parentNode.replaceChild(fragment, node);
                            return true; // Indicate a replacement was made
                        }
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Skip elements that shouldn't contain markdown
                if (node.tagName === 'CODE' || node.tagName === 'PRE' ||
                    node.tagName === 'A' || node.tagName === 'SCRIPT' ||
                    node.tagName === 'STYLE') {
                    return false;
                }

                // Process child nodes - need to work with a copy since we're modifying the DOM
                const childNodes = Array.from(node.childNodes);
                let replacementMade = false;

                for (const child of childNodes) {
                    const replaced = processMarkdownLinks(child);
                    replacementMade = replacementMade || replaced;
                }

                return replacementMade;
            }

            return false;
        };

        // SECOND PASS: Handle numbered references [1], [2], etc. AND [REF]1[/REF] format - IMPROVED
        const processNumberedLinks = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const content = node.textContent;

                // FIXED: Handle both individual [1] and consecutive [1][2][3] patterns
                const referencesPattern = /(\[REF\](\d+)\[\/REF\]|\[(\d+)\](?!\())/g;

                if (!referencesPattern.test(content)) {
                    return false;
                }

                // Reset the pattern for use in the loop
                referencesPattern.lastIndex = 0;

                // Collect all reference URLs first
                const allText = container.textContent;
                const referenceUrls = {};

                // IMPROVED: Better reference pattern matching including REF format
                const refDefinitionPatterns = [
                    /\[(\d+)\]:\s+(https?:\/\/[^\s,]+)/g,                        // [1]: http://example.com
                    /\[(\d+)\]\s+(https?:\/\/[^\s,]+)/g,                         // [1] http://example.com
                    /\[(\d+)\]:?\s+"[^"]*"\s+(https?:\/\/[^\s,]+)/g,             // [1]: "Title" http://example.com
                    /\[(\d+)\]\s+\([^)]+\)\s+(https?:\/\/[^\s,]+)/g,             // [1] (source) http://example.com
                    /\[(\d+)\](?::|)\s+.*?(https?:\/\/[^\s,]+)/g,                // [1]: text with http://example.com in it
                    /\[REF\](\d+)\[\/REF\]:\s+(https?:\/\/[^\s,]+)/g,            // [REF]1[/REF]: http://example.com
                    /\[REF\](\d+)\[\/REF\]\s+(https?:\/\/[^\s,]+)/g              // [REF]1[/REF] http://example.com
                ];

                for (const pattern of refDefinitionPatterns) {
                    const matches = allText.matchAll(pattern);
                    for (const match of matches) {
                        const refNumber = match[1];
                        const url = match[2];
                        if (refNumber && url) {
                            referenceUrls[refNumber] = url;
                            //console.log(`Found reference definition: [${refNumber}] -> ${url}`);
                        }
                    }
                }

                // Also check numbered line references
                const refLines = allText.split('\n');
                for (const line of refLines) {
                    const lineMatch = line.match(/^(\d+)[.:]?\s+(https?:\/\/[^\s,]+)/);
                    if (lineMatch && lineMatch[1] && lineMatch[2]) {
                        referenceUrls[lineMatch[1]] = lineMatch[2];
                        //console.log(`Found line reference: [${lineMatch[1]}] -> ${lineMatch[2]}`);
                    }
                }

                // CRITICAL FIX: Process all numbered references in one pass to handle consecutive ones
                let result = content.replace(referencesPattern, (match, fullREFMatch, refRefNumber, standardRefNumber, offset) => {
                    // Extract reference number from either [REF]2[/REF] or [2] format
                    const refNumber = refRefNumber || standardRefNumber;

                    // Add the reference as a link or plain text
                    if (referenceUrls[refNumber]) {
                        if (fullREFMatch && fullREFMatch.includes('[REF]')) {
                            // For REF format, show a cleaner display
                            return `<a href="${referenceUrls[refNumber]}" target="_blank" rel="noopener noreferrer">[${refNumber}]</a>`;
                        } else {
                            // For standard format
                            return `<a href="${referenceUrls[refNumber]}" target="_blank" rel="noopener noreferrer">[${refNumber}]</a>`;
                        }
                    } else {
                        // If no URL found, just return the reference as plain text
                        return match;
                    }
                });

                // Only replace if we actually modified something
                if (result !== content) {
                    const fragment = document.createRange().createContextualFragment(result);
                    node.parentNode.replaceChild(fragment, node);
                    return true;
                }

                return false;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Skip elements that shouldn't contain markdown
                if (node.tagName === 'CODE' || node.tagName === 'PRE' ||
                    node.tagName === 'A' || node.tagName === 'SCRIPT' ||
                    node.tagName === 'STYLE') {
                    return false;
                }

                // Process child nodes - need a copy since DOM will be modified
                const childNodes = Array.from(node.childNodes);
                let replacementMade = false;

                for (const child of childNodes) {
                    const replaced = processNumberedLinks(child);
                    replacementMade = replacementMade || replaced;
                }

                return replacementMade;
            }

            return false;
        };
        // THIRD PASS: Handle plain URLs like https://example.com - IMPROVED
        const processPlainUrls = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                // IMPROVED: More restrictive URL regex that requires valid domain structure
                const urlRegex = /(?<!(href="|src="|>|\]\())(\(?)(https?:\/\/[a-zA-Z0-9][a-zA-Z0-9.-]+[a-zA-Z0-9][^\s<>"'\)]*?)(\)?)/g;
                const content = node.textContent;

                if (urlRegex.test(content)) {
                    //console.log('Processing plain URLs in text node:', content.substring(0, 50));

                    // Reset regex
                    urlRegex.lastIndex = 0;

                    let processed = content.replace(urlRegex, (match, leadingParen, url, trailingParen, offset) => {
                        // CRITICAL FIX: Validate that we actually have a proper URL
                        if (!url || url.length < 10 || !url.includes('.')) {
                            //console.log('Skipping invalid URL:', url);
                            return match; // Return original if not a valid URL
                        }

                        // Additional validation: must start with http/https and have valid domain
                        if (!url.match(/^https?:\/\/[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
                            //console.log('Skipping malformed URL:', url);
                            return match;
                        }

                        const fullString = content;

                        // Make sure this isn't part of an HTML tag or attribute
                        const prevText = fullString.substring(Math.max(0, offset - 20), offset);
                        if (prevText.includes('href="') || prevText.includes('src="') || prevText.includes('](')) {
                            return match; // Don't process URLs that are already in attributes or markdown links
                        }

                        // Handle parentheses in URLs correctly
                        let cleanUrl = url;
                        let finalMatch = match;

                        // If URL is wrapped in parentheses like (https://example.com), handle it specially
                        if (leadingParen === '(' && trailingParen === ')') {
                            // Check if the URL itself contains parentheses
                            const openParens = (cleanUrl.match(/\(/g) || []).length;
                            const closeParens = (cleanUrl.match(/\)/g) || []).length;

                            if (openParens === closeParens) {
                                // Balanced parentheses in URL, include the wrapping parentheses in the link
                                cleanUrl = url;
                                finalMatch = `(${formatUrl(cleanUrl)})`;
                            } else {
                                // Unbalanced, the wrapping parentheses are probably sentence punctuation
                                cleanUrl = url.replace(/[.,;:"')\]]+$/, '');
                                finalMatch = `(${formatUrl(cleanUrl)})`;
                            }
                        } else {
                            // No wrapping parentheses, clean normally
                            const openParens = (cleanUrl.match(/\(/g) || []).length;
                            const closeParens = (cleanUrl.match(/\)/g) || []).length;

                            if (openParens === closeParens) {
                                // Balanced parentheses, don't remove trailing )
                                cleanUrl = cleanUrl.replace(/[.,;:"']+$/, '');
                            } else {
                                // Unbalanced, safe to remove trailing punctuation
                                cleanUrl = cleanUrl.replace(/[.,;:"')\]]+$/, '');
                            }
                            finalMatch = formatUrl(cleanUrl);
                        }

                        //console.log(`Found plain URL: ${url} -> cleaned: ${cleanUrl}`);
                        return finalMatch;
                    });

                    // Only replace if changes were made
                    if (processed !== content) {
                        const fragment = document.createRange().createContextualFragment(processed);
                        node.parentNode.replaceChild(fragment, node);
                        return true;
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Skip elements that shouldn't contain plain URLs
                if (node.tagName === 'CODE' || node.tagName === 'PRE' ||
                    node.tagName === 'A' || node.tagName === 'SCRIPT' ||
                    node.tagName === 'STYLE') {
                    return false;
                }

                // Process child nodes - need to work with a copy
                const childNodes = Array.from(node.childNodes);
                let replacementMade = false;

                for (const child of childNodes) {
                    const replaced = processPlainUrls(child);
                    replacementMade = replacementMade || replaced;
                }

                return replacementMade;
            }

            return false;
        };

        // FOURTH PASS: Handle reference links like [fandom.com] - IMPROVED
        const processReferenceLinks = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                // Pattern to detect reference links like [fandom.com] or [Hulu]
                const content = node.textContent;
                const refPattern = /\[([^\]\d][^\]]*)\](?!\()/g;

                if (refPattern.test(content)) {
                    // Find all corresponding reference URLs that might be at the bottom
                    const allText = container.textContent;
                    const referenceUrls = {};

                    //  IMPROVED: Better reference URL detection
                    const refDefinitions = allText.match(/\[([^\]\d][^\]]*)\](?::|)\s+(https?:\/\/[^\s,]+)/g);

                    if (refDefinitions) {
                        refDefinitions.forEach(def => {
                            const match = def.match(/\[([^\]\d][^\]]*)\](?::|)\s+(https?:\/\/[^\s,]+)/);
                            if (match && match[1] && match[2]) {
                                let url = match[2].trim();

                                // Apply improved URL cleaning
                                const openParens = (url.match(/\(/g) || []).length;
                                const closeParens = (url.match(/\)/g) || []).length;

                                if (openParens === closeParens) {
                                    url = url.replace(/[.,;:"']+$/, '');
                                } else {
                                    url = url.replace(/[.,;:"')\]]+$/, '');
                                }

                                referenceUrls[match[1].trim()] = url;
                            }
                        });
                    }

                    //  REMOVED: No more hardcoded knownSites
                    // Instead, try to intelligently construct URLs for common patterns

                    let processed = content.replace(refPattern, (match, refName) => {
                        const trimmedName = refName.trim();

                        // If we have a URL for this reference name, make it a link
                        if (referenceUrls[trimmedName]) {
                            return `<a href="${referenceUrls[trimmedName]}" target="_blank" rel="noopener noreferrer">${trimmedName}</a>`;
                        }

                        //  NEW: Try to intelligently construct URLs for domain-like references
                        if (this.looksLikeDomain(trimmedName)) {
                            const constructedUrl = this.constructUrlFromDomain(trimmedName);
                            if (constructedUrl) {
                                return `<a href="${constructedUrl}" target="_blank" rel="noopener noreferrer">${trimmedName}</a>`;
                            }
                        }

                        // Otherwise leave it as is
                        return match;
                    });

                    // Only replace if changes were made
                    if (processed !== content) {
                        const fragment = document.createRange().createContextualFragment(processed);
                        node.parentNode.replaceChild(fragment, node);
                        return true;
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Skip elements that shouldn't contain markdown
                if (node.tagName === 'CODE' || node.tagName === 'PRE' ||
                    node.tagName === 'A' || node.tagName === 'SCRIPT' ||
                    node.tagName === 'STYLE') {
                    return false;
                }

                // Process child nodes
                const childNodes = Array.from(node.childNodes);
                let replacementMade = false;

                for (const child of childNodes) {
                    const replaced = processReferenceLinks(child);
                    replacementMade = replacementMade || replaced;
                }

                return replacementMade;
            }

            return false;
        };

        // Process in four distinct passes to avoid interference
        //console.log('Starting markdown link processing...');
        processMarkdownLinks(container);

        //console.log('Starting numbered link processing...');
        processNumberedLinks(container);

        //console.log('Starting plain URL processing...');
        processPlainUrls(container);

        //console.log('Starting reference link processing...');
        processReferenceLinks(container);

        // Helper function to format URLs nicely - IMPROVED
        function formatUrl(url) {
            // CRITICAL FIX: Validate URL before processing
            if (!url || typeof url !== 'string' || url.length < 10) {
                console.warn('Invalid URL passed to formatUrl:', url);
                return url; // Return as-is if invalid
            }

            // Additional validation: must be a proper URL
            if (!url.match(/^https?:\/\/[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
                console.warn('Malformed URL passed to formatUrl:', url);
                return url; // Return as-is if malformed
            }

            try {
                // Try to extract a cleaner display from the URL
                const urlObj = new URL(url);

                // Get hostname without www. prefix
                let displayText = urlObj.hostname.replace(/^www\./, '');

                // If there's a meaningful path, add the first segment
                if (urlObj.pathname && urlObj.pathname !== '/') {
                    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
                    if (pathSegments.length > 0) {
                        displayText += `/${pathSegments[0]}`;
                        if (pathSegments.length > 1) {
                            displayText += '...';
                        }
                    }
                }

                return `<a href="${url}" target="_blank" rel="noopener noreferrer" title="${url}">${displayText}</a>`;
            } catch (e) {
                console.error('URL processing error:', e);

                // IMPROVED: More robust fallback
                try {
                    // Fallback to domain extraction regex
                    const domainMatch = url.match(/^https?:\/\/(?:www\.)?([^\/]+)/i);
                    if (domainMatch && domainMatch[1]) {
                        return `<a href="${url}" target="_blank" rel="noopener noreferrer" title="${url}">${domainMatch[1]}</a>`;
                    }
                } catch (fallbackError) {
                    console.error('Fallback URL processing also failed:', fallbackError);
                }

                // Last resort: return the URL as a basic link if it still looks valid
                if (url.startsWith('http')) {
                    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
                }

                // If nothing works, return the original text
                return url;
            }
        }
    }

        // Converts markdown-style text tables (|...|...|) in the response container to HTML tables for better display
    postProcessTextTables() {
        const container = this.responseContainer;
        if (!container) return;
        
        let html = container.innerHTML;
        
        // Use a safer approach: find and replace complete table blocks without losing any content
        // First, identify all valid table blocks with their exact positions
        const lines = html.split('<br>');
        let processedHtml = html;
        
        // Find table blocks by scanning through lines
        let i = 0;
        const tableBlocks = [];
        
        while (i < lines.length) {
            const line = lines[i].trim();
            
            // Check if this line could be the start of a table
            if (line.includes('|') && line.match(/^\s*\|.*\|\s*$/)) {
                const tableStartIndex = i;
                const potentialTableLines = [line];
                let foundSeparator = false;
                let separatorIndex = -1;
                
                // Look for consecutive table-like lines
                let j = i + 1;
                while (j < lines.length) {
                    const nextLine = lines[j].trim();
                    
                    // If we hit a completely empty line, stop looking
                    if (!nextLine) {
                        break;
                    }
                    
                    // If the line doesn't contain |, it's not part of the table
                    if (!nextLine.includes('|')) {
                        break;
                    }
                    
                    // Check if this is a separator line (contains dashes)
                    if (nextLine.match(/^\s*\|?\s*[-:]+\s*(\|\s*[-:]+\s*)*\|?\s*$/)) {
                        foundSeparator = true;
                        separatorIndex = potentialTableLines.length;
                    }
                    
                    potentialTableLines.push(nextLine);
                    j++;
                }
                
                // Validate: must have header + separator + at least one data row
                if (foundSeparator && potentialTableLines.length >= 3 && separatorIndex > 0) {
                    // This is a valid table, store its position and content
                    tableBlocks.push({
                        startIndex: tableStartIndex,
                        endIndex: j - 1,
                        lines: potentialTableLines,
                        originalText: lines.slice(tableStartIndex, j).join('<br>')
                    });
                    i = j; // Skip to after this table
                } else {
                    // Not a valid table, move to next line
                    i++;
                }
            } else {
                i++;
            }
        }
        
        // Now replace each valid table block with its HTML version
        // Process in reverse order to maintain correct positions
        for (let t = tableBlocks.length - 1; t >= 0; t--) {
            const block = tableBlocks[t];
            const tableHtml = this.convertLinesToTable(block.lines);
            
            if (tableHtml) {
                // Replace the original table text with the HTML table
                processedHtml = processedHtml.replace(block.originalText, tableHtml);
            }
        }
        
        container.innerHTML = processedHtml;
    }
    
    // Helper function to convert an array of table lines to HTML table
    convertLinesToTable(lines) {
        if (lines.length < 3) return null;
        
        // Find the separator line
        const sepIdx = lines.findIndex(l => /^\s*\|?\s*[-:]+\s*(\|\s*[-:]+\s*)*\|?\s*$/.test(l));
        if (sepIdx < 1) return null;
        
        const headerLine = lines[0];
        const dataLines = lines.slice(sepIdx + 1);
        
        // Parse header cells
        const headerCells = headerLine.split('|')
            .map(c => c.trim())
            .filter(c => c !== ''); // Remove empty cells from start/end
        
        if (headerCells.length < 2) return null;
        
        // Build table HTML
        let tableHtml = '<div class="markdown-table-container"><table class="markdown-table"><thead><tr>';
        headerCells.forEach(cell => {
            tableHtml += `<th>${cell}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        
        // Process data rows
        dataLines.forEach(rowLine => {
            if (!rowLine.trim()) return; // Skip empty lines
            
            const cells = rowLine.split('|')
                .map(c => c.trim())
                .filter(c => c !== ''); // Remove empty cells from start/end
            
            // Only add row if it has the same number of cells as the header
            if (cells.length === headerCells.length) {
                tableHtml += '<tr>';
                cells.forEach(cell => {
                    tableHtml += `<td>${cell}</td>`;
                });
                tableHtml += '</tr>';
            }
        });
        
        tableHtml += '</tbody></table></div>';
        return tableHtml;
    }
    looksLikeDomain(text) {
        // Check if text looks like a domain name
        return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/.test(text.toLowerCase()) ||
            /^[a-zA-Z0-9][a-zA-Z0-9-]*\.fandom\.com$/.test(text.toLowerCase()) ||
            /^[a-zA-Z0-9][a-zA-Z0-9-]*\.wikipedia\.org$/.test(text.toLowerCase());
    }

    constructUrlFromDomain(domainText) {
        const lower = domainText.toLowerCase();

        // If it already looks like a full domain, just add https://
        if (lower.includes('.')) {
            // Handle special cases where www. should be added
            if (lower.match(/^[^.]+\.(com|org|net|edu|gov)$/)) {
                return `https://www.${lower}`;
            }
            // Otherwise use as-is
            return `https://${lower}`;
        }

        // For single words, only try to construct URLs for very obvious cases
        // that are commonly referenced but don't require hardcoding
        return null; // Let it remain as plain text rather than guessing
    }
    // Processes a code block element, restoring saved code and applying syntax highlighting.
    static processSavedCodeBlock(codeBlock) {
        //console.log('Processing saved code block');

        // Skip if not a valid code block
        if (!codeBlock) return;

        // Get language and code element
        const langElement = codeBlock.querySelector('.code-language');
        const codeElement = codeBlock.querySelector('code');
        if (!langElement || !codeElement) return;

        const language = langElement.textContent.toLowerCase();
        const normalizedLang = CodeStyler.normalizeLanguage(language);

        // First check if we have saved code in the data-saved-code attribute
        let rawContent;
        if (codeElement.hasAttribute('data-saved-code')) {
            // Use the pre-saved code that has proper newlines
            //console.log('Found data-saved-code attribute with stored code!');
            rawContent = codeElement.getAttribute('data-saved-code');
            //console.log('data-saved-code newlines:', (rawContent.match(/\n/g) || []).length);
        } else {
            // Fall back to text content
            //console.log('No data-saved-code attribute found, using text content');
            rawContent = codeElement.textContent || codeElement.innerText;
        }

        // Format the code based on language
        let formattedCode = rawContent;

        // Only apply formatting if needed (when the saved code attribute wasn't found)
        if (!codeElement.hasAttribute('data-saved-code')) {
            if (normalizedLang === 'markup' || normalizedLang === 'html') {
                // Use HTML-specific formatting
                formattedCode = this.formatHtmlWithIndentation(rawContent);
            } else {
                // Use generic code formatting for other languages
                formattedCode = this.formatCodeWithIndentation(rawContent, normalizedLang);
            }
        }

        // Store the clean version
        codeElement.dataset.cleanCode = formattedCode;

        try {
            // Apply highlighting with special handling for HTML/markup
            if (normalizedLang === 'markup' || normalizedLang === 'html') {
                // Create HTML with highlighting manually to ensure it's not double-escaped
                let highlightedHtml = '';
                const lines = formattedCode.split("\n");

                for (const line of lines) {
                    // Escape HTML entities in the line
                    const escapedLine = line
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');

                    // Apply highlighting that matches the highlightMarkup() method
                    const highlightedLine = escapedLine.replace(
                        /(&lt;)(\/?[a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z0-9-]+(?:=&quot;.*?&quot;|\=&#039;.*?&#039;|\=[^\s&]*)?)*\s*)(&gt;)/g,
                        (match, open, tagName, attrs, close) => {
                            // Process attributes if present
                            let processedAttrs = attrs;

                            if (attrs.trim()) {
                                processedAttrs = attrs.replace(/\s+([a-zA-Z0-9-]+)(=)(?:(&quot;|&#039;)(.*?)(\3)|([^\s>]*))/g,
                                    (attrMatch, attrName, eq, quote, quotedValue, endQuote, unquotedValue) => {
                                        return ' <span class="syntax-attr">' + attrName + '</span>' + eq +
                                            (quote ? '<span class="syntax-string">' + quote + quotedValue + endQuote + '</span>' :
                                                '<span class="syntax-string">' + unquotedValue + '</span>');
                                    });
                            }

                            return `<span class="syntax-tag">${open}${tagName}</span>${processedAttrs}<span class="syntax-tag">${close}</span>`;
                        }
                    );

                    highlightedHtml += highlightedLine + "\n";
                }

                // Set the highlighted HTML directly
                codeElement.innerHTML = highlightedHtml;
            } else if (normalizedLang) {
                // Standard syntax highlighting for other languages
                const highlightedCode = CodeStyler.highlightCode(formattedCode, normalizedLang);
                codeElement.innerHTML = highlightedCode;
            } else {
                // If no language is specified, just escape the HTML entities
                codeElement.textContent = formattedCode;
            }
        } catch (error) {
            console.error('Error applying syntax highlighting:', error);
            // Fallback to showing the plain text safely
            codeElement.textContent = formattedCode;
        }

        //console.log(`Code block processed for language: ${normalizedLang}`);
    }
    // Formats code with indentation and newlines for non-HTML languages.
    static formatCodeWithIndentation(code, language) {
        /*console.log('formatCodeWithIndentation called with:', {
            codeLength: code ? code.length : 0,
            language: language,
            containsNewlines: code ? code.includes('\n') : false,
            newlineCount: code ? code.split('\n').length - 1 : 0,
            escapedNewlineCount: code ? (code.match(/\\n/g) || []).length : 0
        });*/

        if (!code) return '';

        // If code already has proper newlines (very few escaped \n but many actual newlines)
        // then don't modify it - it's already in good shape
        if (code.split('\n').length > 5 && (code.match(/\\n/g) || []).length < 3) {
            //console.log('Code already has proper formatting, returning as is');
            return code;
        }

        // Convert escaped newlines to actual newlines
        let formattedCode = code
            .replace(/\\n/g, '\n')       // Replace escaped newlines with real ones
            .replace(/\\r\\n/g, '\n')    // Replace Windows-style escaped newlines
            .replace(/\\t/g, '    ');    // Replace tabs with spaces

        // Clean up double newlines that might have been created
        formattedCode = formattedCode.replace(/\n\n+/g, '\n\n');

        //console.log('FORMATTED CODE AFTER NEWLINE CONVERSION:');
        //console.log(formattedCode);
        //console.log('Formatted newline count:', (formattedCode.match(/\n/g) || []).length);

        // Return the clean version
        return formattedCode;
    }

    // Formats HTML code with indentation and newlines.
    static formatHtmlWithIndentation(html) {
        //console.log('formatHtmlWithIndentation called with HTML length:', html.length);

        // First check if the input is valid
        if (!html || typeof html !== 'string') {
            console.error('Invalid HTML input:', html);
            return html || '';
        }

        try {
            // Very simple indentation algorithm for HTML
            let result = '';
            let indent = 0;
            const indentSize = 2;
            let inScript = false;
            let inStyle = false;
            let inPreTag = false;

            // Split by angle brackets to process tags and content separately
            const tokens = html.split(/(<\/?[^>]+>)/g);

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];

                // Skip empty tokens
                if (!token) continue;

                // Check if we're entering special tags where formatting should be preserved
                if (token.match(/<(pre|script|style)(\s|>)/i)) {
                    if (token.match(/<pre/i)) inPreTag = true;
                    if (token.match(/<script/i)) inScript = true;
                    if (token.match(/<style/i)) inStyle = true;
                }

                // Check if we're exiting special tags
                if (token.match(/<\/(pre|script|style)>/i)) {
                    if (token.match(/<\/pre>/i)) inPreTag = false;
                    if (token.match(/<\/script>/i)) inScript = false;
                    if (token.match(/<\/style>/i)) inStyle = false;
                }

                // If we're in a special tag, don't adjust indentation or add newlines
                if (inPreTag || inScript || inStyle) {
                    result += token;
                    continue;
                }

                // Handle opening tags
                if (token.startsWith('<') && !token.startsWith('</') && !token.endsWith('/>')) {
                    // Add newline and indent for opening tags
                    result += '\n' + ' '.repeat(indent);
                    result += token;

                    // Only increase indent for non-self-closing tags and non-empty tags
                    if (!token.match(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\s|>)/i)) {
                        indent += indentSize;
                    }
                }
                // Handle closing tags
                else if (token.startsWith('</')) {
                    // Decrease indent for closing tags
                    indent = Math.max(0, indent - indentSize);

                    // Add newline and indent for closing tags
                    result += '\n' + ' '.repeat(indent);
                    result += token;
                }
                // Handle self-closing tags
                else if (token.startsWith('<') && token.endsWith('/>')) {
                    // Add newline and indent for self-closing tags
                    result += '\n' + ' '.repeat(indent);
                    result += token;
                }
                // Handle text content
                else if (token.trim()) {
                    // Only add a newline if the token has content
                    result += '\n' + ' '.repeat(indent);
                    // Preserve the text content (space trimming only at start/end)
                    result += token.replace(/^\s+|\s+$/g, '');
                }
            }
            return result.trim();
        } catch (error) {
            console.error('Error formatting HTML:', error);
            // Return the original input if formatting fails
            return html;
        }
    }
    // Cleans up LaTeX expressions in the response, replacing with Unicode and formatting.
    cleanLatexExpressions() {
        if (!this.responseContainer) return;

        // Get all paragraphs that aren't inside code blocks
        const paragraphs = this.responseContainer.querySelectorAll('p:not(.code-block p)');

        paragraphs.forEach(paragraph => {
            // Skip if this paragraph is inside a code block
            if (paragraph.closest('.code-block')) return;

            let html = paragraph.innerHTML;

            // 1. Format LaTeX expressions like \[ ... \]
            html = html.replace(/\\(\[|\()(.*?)\\(\]|\))/gs, (match, open, content, close) => {
                // Remove backslashes from common LaTeX commands in the content
                const cleanedContent = content.replace(/\\([a-zA-Z]+)/g, '$1');
                return `<span class="latex-expression">${open === '[' ? '[' : '('}${cleanedContent}${close === ']' ? ']' : ')'}</span>`;
            });

            // 2. Replace common LaTeX symbols with Unicode characters
            const mathSymbolMap = {
                '\\alpha': 'α',
                '\\beta': 'β',
                '\\gamma': 'γ',
                '\\delta': 'δ',
                '\\epsilon': 'ε',
                '\\theta': 'θ',
                '\\lambda': 'λ',
                '\\mu': 'μ',
                '\\pi': 'π',
                '\\sigma': 'σ',
                '\\tau': 'τ',
                '\\omega': 'ω',
                '\\Omega': 'Ω',
                '\\infty': '∞',
                '\\hbar': 'ℏ',
                '\\nabla': '∇',
                '\\partial': '∂',
                '\\sum': '∑',
                '\\int': '∫',
                '\\times': '×',
                '\\cdot': '⋅',
                '\\div': '÷',
                '\\approx': '≈',
                '\\neq': '≠',
                '\\leq': '≤',
                '\\geq': '≥',
                '\\subset': '⊂',
                '\\supset': '⊃',
                '\\cup': '∪',
                '\\cap': '∩'
            };

            // Replace common LaTeX symbols with Unicode equivalents
            Object.keys(mathSymbolMap).forEach(symbol => {
                const regex = new RegExp(symbol.replace(/\\/g, '\\\\'), 'g');
                html = html.replace(regex, mathSymbolMap[symbol]);
            });

            // 3. Clean up remaining backslashes 
            // But be careful not to replace escaped backslashes in HTML entities
            html = html.replace(/\\(?![a-z]+;)/gi, '');

            paragraph.innerHTML = html;
        });

        // Update raw HTML
        this.rawResponseHtml = this.responseContainer.innerHTML;
    }
    // Helper method to add run buttons
    addRunButton(container, options) {
        const button = document.createElement('button');
        button.className = options.className;
        button.textContent = Lang.get('codeRunButton');
        button.style.cssText = `
            padding: 2px 8px;
            font-size: 12px;
            color: #fff;
            background-color: ${options.color};
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
            margin-right: 8px;
        `;
        button.setAttribute('onclick', options.onclick);
        container.insertBefore(button, container.firstChild);
    }
    addMessageActions() {
        // Find the parent assistant message
        const assistantMessage = this.responseContainer.closest('.assistant-message');
        if (!assistantMessage) {
            console.error('Cannot find parent assistant message for action buttons');
            return;
        }

        // Store the StreamProcessor instance on the responseContainer for reference
        this.responseContainer.streamProcessor = this;

        //console.log('StreamProcessor: Calling Chat.addMessageActionsToMessage');

        try {
            // Try different ways to access the Chat instance
            if (window.chat && typeof window.chat.addMessageActionsToMessage === 'function') {
                window.chat.addMessageActionsToMessage(assistantMessage);
                return;
            }

            if (window.chatInstance && typeof window.chatInstance.addMessageActionsToMessage === 'function') {
                window.chatInstance.addMessageActionsToMessage(assistantMessage);
                return;
            }

            // Fallback: Add a simple copy button if we can't find the Chat method
            this.addSimpleMessageActions();
        } catch (error) {
            console.error('Error calling Chat.addMessageActionsToMessage:', error);
            this.addSimpleMessageActions();
        }
    }
    // Keep the simple fallback implementation
    addSimpleMessageActions() {
        //console.log('Using fallback simple message actions');

    const container = document.createElement('div');
    container.className = 'message-actions copy-response-container';
    container.style.cssText = `
        text-align: right;
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
        padding-top: 0.5rem;
        opacity: 0.7;
        border-top: 1px solid var(--border-color);
        `;

        const self = this;

        // Only add a copy button in the fallback
        const copyButton = document.createElement('a');
        copyButton.href = '#';
        copyButton.textContent = Lang.get('copy') || 'Copy';
        copyButton.style.cssText = `
                color: inherit;
                text-decoration: none;
                cursor: pointer;
            `;

        copyButton.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            self.copyFullResponse();
        });

        container.appendChild(copyButton);
        this.responseContainer.appendChild(container);
    }
    // Copies the full response text to the clipboard, including code blocks and optional metadata.
    copyFullResponse() {
        // First check if user wants to include metadata in copied text
        const includeMetadata = localStorage.getItem('copyIncludeMetadata') === 'true';

        const collectTextContent = (element) => {
            let text = '';
            for (const node of element.childNodes) {
                // Skip copy response containers and message actions
                if (node.classList &&
                    (node.classList.contains('copy-response-container') ||
                        node.classList.contains('message-actions'))) {
                    continue;
                }

                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent;
                }
                else if (node.classList && node.classList.contains('code-block')) {
                    const codeElement = node.querySelector('code');
                    if (codeElement) {
                        // Use the clean code data attribute if available, which doesn't contain UI elements
                        const cleanCode = codeElement.dataset.cleanCode || codeElement.textContent;
                        const language = node.querySelector('.code-language')?.textContent || '';

                        text += '\n\n```' + language.toLowerCase() + '\n';
                        text += cleanCode;
                        text += '\n```\n\n';
                    }
                }
                else if (node.classList && node.classList.contains('text-content')) {
                    text += node.textContent + '\n';
                }
                // Skip the header section of code blocks which contains buttons
                else if (node.classList && node.classList.contains('code-header')) {
                    continue;
                }
                // Skip line number containers
                else if (node.classList && node.classList.contains('line-numbers')) {
                    continue;
                }
                // Process other nodes recursively
                else if (node.childNodes && node.childNodes.length > 0) {
                    text += collectTextContent(node);
                }
            }
            return text;
        };

        let fullText = collectTextContent(this.responseContainer);

        // Add metadata if enabled
        if (includeMetadata) {
            const model = document.getElementById('model-selector')?.value || 'unknown';
            const timestamp = new Date().toLocaleString();
            const hashedMasterKey = sessionStorage.getItem('hashedMasterKey') || 'unknown';

            // Add metadata footer
            const metadataText = `\n\n---\nGenerated with: ${model}\nDate: ${timestamp}\nMasterKey ID: ${hashedMasterKey}\n`;
            fullText += metadataText;
        }

        navigator.clipboard.writeText(fullText).then(() => {
            //console.log('Full text copied to clipboard, length:', fullText.length);
            const copyLinks = this.responseContainer.querySelectorAll('.copy-response-container a, .message-actions a');

            // Find the copy link - look through all links to find the one with "Copy" text
            const copyLink = Array.from(copyLinks).find(link =>
                link.textContent.toLowerCase().includes('copy') &&
                !link.textContent.toLowerCase().includes('copied'));

            if (copyLink) {
                const originalText = copyLink.textContent;
                copyLink.textContent = 'Copied!';
                setTimeout(() => {
                    copyLink.textContent = originalText;
                }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy response:', err);
        });
    }
}

// Global utility functions
window.copyCodeBlock = function (button) {
    //console.log('Copy button clicked');
    const codeBlock = button.closest('.code-block');
    if (codeBlock) {
        const codeElement = codeBlock.querySelector('code');
        if (codeElement) {
            const codeText = codeElement.dataset.cleanCode || codeElement.textContent;
            //console.log('Copying code text:', codeText.substring(0, 30) + '...');

            navigator.clipboard.writeText(codeText)
                .then(() => {
                    //console.log('Text copied successfully');
                    const originalText = button.textContent;
                    button.textContent = Lang.get('codeCopied');
                    setTimeout(() => {
                        button.textContent = originalText;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy code:', err);
                    button.textContent = Lang.get('codeCopyError');
                    setTimeout(() => {
                        button.textContent = 'Copy';
                    }, 2000);
                });
        } else {
            console.error('No code element found in code block');
        }
    } else {
        console.error('No code block found from button');
    }
};


window.copyCodeBlockWithLineNumbers = function (button) {
    const codeBlock = button.closest('.code-block');
    if (!codeBlock) return;

    const codeElement = codeBlock.querySelector('code');
    if (!codeElement) return;

    const codeText = codeElement.dataset.cleanCode || codeElement.textContent;
    const lines = codeText.split('\n');

    // Format with line numbers
    let numberedCode = '';
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        numberedCode += `${lineNum.toString().padStart(3, ' ')}| ${line}\n`;
    });

    navigator.clipboard.writeText(numberedCode)
        .then(() => {
            const originalText = button.textContent;
            button.textContent = Lang.get('codeCopied');
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy code with line numbers:', err);
            button.textContent = Lang.get('codeCopyError');
            setTimeout(() => {
                button.textContent = Lang.get('codeCopyWithLinesButton') || 'Copy with #';
            }, 2000);
        });
};
window.toggleCodeLineNumbers = function (button) {
    //console.log('🌍 GLOBAL toggleCodeLineNumbers called with button:', button);
    //console.log('🌍 Button element:', button.tagName, button.className);

    const codeBlock = button.closest('.code-block');
    if (!codeBlock) {
        console.error('🌍 No code block found from button');
        return;
    }

    //console.log('🌍 Found code block:', codeBlock);

    const pre = codeBlock.querySelector('pre');
    const codeElement = codeBlock.querySelector('code');
    let lineNumbersContainer = codeBlock.querySelector('.line-numbers');

    //console.log('🌍 Elements found - pre:', !!pre, 'code:', !!codeElement, 'lineNumbers:', !!lineNumbersContainer);

    //  CRITICAL FIX: Create line numbers container if it doesn't exist
    if (!lineNumbersContainer && pre && codeElement) {
        //console.log('🌍 Creating missing line numbers container...');
        lineNumbersContainer = document.createElement('div');
        lineNumbersContainer.className = 'line-numbers';
        lineNumbersContainer.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            padding: 1em 0;
            background-color: var(--bg-color, #f6f8fa);
            border-right: 1px solid var(--border-color, #d1d9e0);
            user-select: none;
            display: none;
            visibility: hidden;
            width: 3em;
            box-sizing: border-box;
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            z-index: 1;
        `;

        // Ensure pre has relative positioning
        pre.style.position = 'relative';
        pre.appendChild(lineNumbersContainer);
        //console.log('✅ Line numbers container created and added');
    }

    if (!lineNumbersContainer || !pre || !codeElement) {
        console.error('🌍 Missing required elements for line numbers');
        return;
    }

    // Check current visibility - need to check both display and visibility
    const isVisible = lineNumbersContainer.style.display === 'block' ||
        lineNumbersContainer.style.visibility === 'visible';

    //console.log('🌍 Current visibility state:', isVisible);
    //console.log('🌍 Display style:', lineNumbersContainer.style.display);
    //console.log('🌍 Visibility style:', lineNumbersContainer.style.visibility);

    if (isVisible) {
        // Hide line numbers
        //console.log('🌍 Hiding line numbers');
        lineNumbersContainer.style.display = 'none';
        lineNumbersContainer.style.visibility = 'hidden';
        pre.style.paddingLeft = '1em';
        codeElement.style.paddingLeft = '';
    } else {
        // Show line numbers
        //console.log('🌍 Showing line numbers');

        // Get the code content - prioritize data-saved-code for loaded conversations
        let cleanCode = codeElement.dataset.savedCode ||
            codeElement.dataset.cleanCode ||
            codeElement.textContent ||
            codeElement.innerText || '';

        //console.log('🌍 Code sources checked:');
        //console.log('  - data-saved-code:', !!codeElement.dataset.savedCode);
        //console.log('  - data-clean-code:', !!codeElement.dataset.cleanCode);
        //console.log('  - textContent length:', codeElement.textContent?.length || 0);
        //console.log('🌍 Selected code length:', cleanCode.length);

        if (!cleanCode.trim()) {
            console.warn('🌍 No code content found for line numbers');
            return;
        }

        const lines = cleanCode.split('\n');
        const lineCount = lines.length;

        //console.log('🌍 Code length:', cleanCode.length, 'Line count:', lineCount);

        // Generate line numbers HTML with proper CSS classes
        let lineNumbersHTML = '';
        for (let i = 1; i <= lineCount; i++) {
            lineNumbersHTML += `<div class="line-number-item" style="padding: 0 0.5em; text-align: right; color: #666;">${i}</div>`;
        }

        lineNumbersContainer.innerHTML = lineNumbersHTML;

        // IMPORTANT: Set all necessary style properties to ensure visibility
        lineNumbersContainer.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            padding: 1em 0;
            background-color: var(--bg-color, #f6f8fa);
            border-right: 1px solid var(--border-color, #d1d9e0);
            user-select: none;
            display: block !important;
            visibility: visible !important;
            width: 3em;
            box-sizing: border-box;
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            z-index: 1;
            line-height: 1.4;
        `;

        // Adjust the pre and code element padding to make room for line numbers
        pre.style.position = 'relative';
        pre.style.paddingLeft = '3.5em';
        codeElement.style.paddingLeft = '0.5em';

        //console.log('🌍 Line numbers should now be visible');
        //console.log('🌍 Container HTML:', lineNumbersContainer.innerHTML.substring(0, 100) + '...');
    }
};
window.toggleThinkingVisibility = function (btn) {
    //console.log('Global toggle thinking visibility called');
    const container = btn.closest('.thinking-mode-container');
    if (!container) {
        console.error('Cannot find thinking container');
        return false;
    }

    const content = container.querySelector('.thinking-content');
    if (!content) {
        console.error('Cannot find thinking content element');
        return false;
    }

    const isExpanded = content.style.maxHeight !== '0px' && content.style.maxHeight !== '';
    //console.log('Toggling thinking, current state:', isExpanded ? 'expanded' : 'collapsed');

    if (isExpanded) {
        // Collapse - preserve content, just hide it
        content.style.maxHeight = '0px';
        content.style.borderTop = '0px solid var(--thinking-separator, rgba(214, 158, 46, 0.1))';
        content.style.paddingTop = '0';
        content.style.marginTop = '0';
        btn.innerHTML = `<i class="fa-solid fa-chevron-down"></i> <span class="toggle-text">${Lang.get('thinkingCollapsed') || 'Show thinking'}</span>`;

        // Store collapsed state
        container.dataset.thinkingState = 'collapsed';
    } else {
        // Check if thinking is still active
        const thinkingId = container.dataset.thinkingId;
        const isThinkingActive = thinkingId && window.activeThinkingModes &&
            window.activeThinkingModes.has(thinkingId);

        //console.log('Expanding thinking content, active:', isThinkingActive ? 'yes' : 'no');

        if (isThinkingActive) {
            // If thinking is still active, just expand without trying to restore
            // The content is still being streamed into the container
            //console.log('Thinking still active, not restoring from backup');
        } else {
            // Thinking is complete, check if content needs restoration
            //console.log('Thinking complete, checking if content needs restoration');

            // Check if content is empty or very short (needs restoration)
            if (!content.innerHTML.trim() || content.innerHTML.length < 10) {
                // Now proceed with the backup restoration logic
                const contentId = content.id;
                const backupDivId = container.dataset.backupDivId;
                const containerOrder = container.dataset.containerOrder;
                const messageId = container.closest('.assistant-message')?.dataset?.messageId;

                //console.log(`Container IDs: thinkingId=${thinkingId}, contentId=${contentId}, backupDivId=${backupDivId}, order=${containerOrder}, messageId=${messageId}`);

                let contentRestored = false;

                // METHOD 1: Try the direct backup div association using backupDivId
                if (backupDivId) {
                    const exactBackupDiv = document.getElementById(backupDivId);
                    if (exactBackupDiv) {
                        //console.log(`Found exact backup div by ID: ${backupDivId}`);
                        content.innerHTML = exactBackupDiv.innerHTML;
                        contentRestored = true;
                    } else {
                        // Try with -backup suffix
                        const backupWithSuffix = document.getElementById(`${backupDivId}-backup`);
                        if (backupWithSuffix) {
                            //console.log(`Found backup with -backup suffix: ${backupDivId}-backup`);
                            content.innerHTML = backupWithSuffix.innerHTML;
                            contentRestored = true;
                        }
                    }
                }

                // METHOD 2: Try content ID based backups
                if (!contentRestored && contentId) {
                    const contentBackup = document.getElementById(`${contentId}-backup`);
                    if (contentBackup) {
                        //console.log(`Found backup by content ID: ${contentId}-backup`);
                        content.innerHTML = contentBackup.innerHTML;
                        contentRestored = true;
                    }
                }

                // METHOD 3: Look for container-specific backups in the global store
                if (!contentRestored && window.thinkingBackups) {
                    // Try exact container ID first
                    if (container.id && window.thinkingBackups[container.id]) {
                        //console.log(`Found global backup by container ID: ${container.id}`);
                        content.innerHTML = window.thinkingBackups[container.id];
                        contentRestored = true;
                    }
                    // Then try thinking ID
                    else if (thinkingId && window.thinkingBackups[thinkingId]) {
                        //console.log(`Found global backup by thinking ID: ${thinkingId}`);
                        content.innerHTML = window.thinkingBackups[thinkingId];
                        contentRestored = true;
                    }
                    // Try versioned backups
                    else if (thinkingId && container.dataset.backupVersion) {
                        const versionedKey = `${thinkingId}_v${container.dataset.backupVersion}`;
                        if (window.thinkingBackups[versionedKey]) {
                            //console.log(`Found versioned global backup: ${versionedKey}`);
                            content.innerHTML = window.thinkingBackups[versionedKey];
                            contentRestored = true;
                        }
                    }
                }

                // METHOD 4: Try container order registry
                if (!contentRestored && containerOrder && window.thinkingBackupsByOrder) {
                    const orderBackup = window.thinkingBackupsByOrder[containerOrder];
                    if (orderBackup && orderBackup.content) {
                        //console.log(`Found backup by container order: ${containerOrder}`);
                        content.innerHTML = orderBackup.content;
                        contentRestored = true;
                    }
                }

                // METHOD 5: Try data attributes if still not restored
                if (!contentRestored) {
                    if (container.dataset.thinkingContent) {
                        //console.log('Restoring from container data attribute');
                        content.innerHTML = container.dataset.thinkingContent;
                        contentRestored = true;
                    } else if (content.dataset.originalContent) {
                        //console.log('Restoring from content element data attribute');
                        content.innerHTML = content.dataset.originalContent;
                        contentRestored = true;
                    }
                }

                // METHOD 6: Last resort - look for message-specific backups
                if (!contentRestored && messageId) {
                    // Find backups that match this message ID
                    const messageBackups = document.querySelectorAll(`div[id*="${messageId}"][id$="-backup"]`);
                    if (messageBackups.length > 0) {
                        //console.log(`Found ${messageBackups.length} backups for message ID: ${messageId}`);
                        // Use the one that matches this container's order if possible
                        const matchingOrderBackup = Array.from(messageBackups).find(b =>
                            b.dataset.containerOrder === containerOrder
                        );

                        if (matchingOrderBackup) {
                            //console.log('Found backup matching both message ID and container order');
                            content.innerHTML = matchingOrderBackup.innerHTML;
                        } else {
                            // Otherwise use the most recent one for this message
                            //console.log('Using most recent backup for this message');
                            content.innerHTML = messageBackups[messageBackups.length - 1].innerHTML;
                        }
                        contentRestored = true;
                    }
                }

                // METHOD 7: Absolute last resort - any backup div
                if (!contentRestored) {
                    const allBackups = document.querySelectorAll('div[id$="-backup"]');
                    if (allBackups.length > 0) {
                        //console.log('Found', allBackups.length, 'backup divs, using most recent');
                        content.innerHTML = allBackups[allBackups.length - 1].innerHTML;
                        contentRestored = true;
                    }
                }

                // If still empty, show error message
                if (!contentRestored || !content.innerHTML.trim() || content.innerHTML.length < 10) {
                    content.innerHTML = `<div style="color:#d69e2e;padding:10px;font-family:monospace;">${Lang.get('thinkingContentNotRestored')}</div>`;
                }
            }
        }

        // Always ensure content is visible with proper styling
        content.style.display = 'block';

        // Force a reflow before setting max-height
        void content.offsetWidth;

        setTimeout(() => {
            const newHeight = Math.max(300, content.scrollHeight) + 'px';
            content.style.maxHeight = newHeight;
            //console.log('Set content max-height to:', newHeight);
        }, 10);

        content.style.overflow = 'auto';
        content.style.scrollbarWidth = 'none';
        content.style.msOverflowStyle = 'none';
        content.style.borderTop = '1px solid var(--thinking-separator, rgba(214, 158, 46, 0.1))';
        content.style.paddingTop = '10px';
        content.style.marginTop = '8px';
        btn.innerHTML = `<i class="fa-solid fa-chevron-up"></i> <span class="toggle-text">${Lang.get('thinkingExpanded') || 'Hide thinking'}</span>`;

        // Store expanded state
        container.dataset.thinkingState = 'expanded';
    }

    return false; // Prevent default action
};
// Export classes globally
window.CodeStyler = CodeStyler;
window.StreamProcessor = StreamProcessor;
window.activeThinkingModes = new Map();
window.thinkingContentDebug = true;
