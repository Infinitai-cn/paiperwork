/**
 * Help content organized by sections and articles
 * Each tab has standardized content following the format:
 * - Title
 * - Intro text
 * - Articles (each with title, content text, and image at the end)
 */
window.helpContent = {
    // Getting Started section
    "getting-started": {
        title: "Getting Started with Paiperwork",
        intro:
            "Welcome to Paiperwork, a secure web interface for Ollama that prioritizes data privacy and ease of use. This professional-focused assistant offers productivity features while keeping your data local and protected.",
        articles: [
            {
                id: "gs-welcome",
                title: "Welcome Screen",
                content: `
                    <p>** Please note that Paiperwork uses instructions for it's features, <b>Instruction Models are required</b> (do not use base models or text/chat models)**</p>
                    <p>The welcome screen is your starting point for all interactions with Paiperwork.</p>
                    <p>From here, you can:</p>
                    <ul>
                        <li>Start new conversations with the AI by entering a Master Key (Different Master Keys will create a separated Chats inside the database)</li>
                        <li>Access your conversation history by using previously entered Master Key</li>
                        <li>Change language settings using the dropdown menu</li>
                        <li>Check for updates to the program</li>
                        <li>Access the help documentation</li>
                    </ul>
                    
                    <div class="note">
                        <p><strong>Important:</strong> The Master Key you enter serves two critical purposes:</p>
                        <ul>
                            <li>It can create separated Chats (Using different Master Keys)</li>
                            <li>It acts as your encryption key for storing conversation data securely (your data will be stored locally in your browser's storage in the form of a database). No data will ever be sent outside of your system with the exception of search prompts when the web button is activated for web searches (sending a web search query to Microsoft's Bing search engine). No telemetry is collected. Please note that if you change your browser, there will be no previous database on it, so you will start fresh.</li>
                        </ul>
                        <p>To access a previous conversation, you must enter the <em>exact same Master Key</em> (case-sensitive) that you used when creating it.</p>
                    </div>
                `,
                image: "welcome.png",
                imageAlt: "Paiperwork Welcome Screen",
                imageCaption:
                    "The Paiperwork welcome screen showing the Master Key input field",
            },
            {
                id: "gs-topics",
                title: "Using Master Key Effectively",
                content: `
                  <p>Master Key are fundamental to how Paiperwork works. They primarily provide security for your conversations.</p>
                  
                  <h4>Master Key as Security Keys</h4>
                  <p>Your Master Key acts as an encryption key that secures your conversation data. This means:</p>
                  <ul>
                    <li>Master Key are <strong>case-sensitive</strong> - "My Project" and "my project" are treated as different Master Key</li>
                    <li>You must enter the exact same Master key to access a previous conversation</li>
                    <li>If you forget a Master Key, you cannot recover that conversation</li>
                    <li>Choose short, memorable Master Key that you can easily recall later</li>
                  </ul>
                  
                  <h4>Creating Effective Master Key</h4>
                  <p>For best results with your Master Key:</p>
                  <ul>
                    <li>Keep them short and easy to remember (e.g., "ItalyTrip2025" or "Garden Plans")</li>
                    <li>Use simple patterns you'll recall (e.g., "Home-2023" or "Recipe-Book")</li>
                    <li>Avoid complex phrases with special characters or unusual spacing</li>
                    <li>Consider using personal memory aids that only you would recognize</li>
                  </ul>
                  
                  <div class="note">
                    <p><strong>Tip:</strong> Consider keeping a secure record of important Master Keys you use frequently, especially for long-term projects. Think of Master Keys like passwords - they need to be memorable and secure.</p>
                  </div>
                `,
                image: "memorabletopic.png",
                imageAlt: "Master Key Entry Example",
                imageCaption: "Example of entering a short, memorable Master Key",
            },
            {
                id: "gs-conversation",
                title: "Starting a Conversation",
                content: `
                    <p>To start a new conversation with the AI:</p>
                    <ol>
                        <li>Enter a Master Key in the "Enter Master key here..." field</li>
                        <li>Make sure your Master Key is both descriptive and memorable</li>
                        <li>Click the "Start" button</li>
                        <li>The chat interface will open with your new conversation</li>
                    </ol>
                    <p>If you've used this Master Key before, Paiperwork will load your previous conversation history.</p>
                    <p>If it's a new Master Key, a fresh conversation will begin.</p>
                    
                    <h4>Language Selection</h4>
                    <p>Before starting a conversation, you can select your preferred language from the dropdown menu. Paiperwork's interface will display in your selected language, though you can communicate with the AI in any language regardless of this setting.</p>
                    
                    <h4>Managing Conversations</h4>
                    <p>At the bottom of the welcome screen, you'll find the "Delete All information" button. Use this with caution, as it will permanently remove ALL your saved conversations and data.</p>
                `,
                image: "clickstart.png",
                imageAlt: "Starting a new conversation",
                imageCaption:
                    "Enter your Master key and click Start to begin a new chat session",
            },
        ],
    },

    // Chat Features section
    chat: {
        title: "Chat Features",
        intro:
            "The chat interface provides powerful AI conversation capabilities with several advanced features to enhance your interactions.",
        articles: [
            {
                id: "chat-basics",
                title: "Chat Basics",
                content: `
                <p>The chat interface is where your conversations with the AI take place. It's designed to be intuitive yet powerful, with several key features that help you get the most from your interactions.</p>
                
                <h4>Core Chat Elements</h4>
                <ul>
                    <li><strong>Message Area</strong> - Where your conversation history appears, with user messages on the right and AI responses on the left</li>
                    <li><strong>Input Field</strong> - Type your messages here and press Enter or click Send to submit</li>
                    <li><strong>Send Button</strong> - Submits your message and transforms into a Cancel button during AI response generation</li>
                    <li><strong>Model Selector</strong> - Choose different AI models depending on your task requirements</li>
                </ul>
                
                <h4>Message Controls</h4>
                <p>Each AI response includes action buttons at the bottom that allow you to:</p>
                <ul>
                    <li><strong>Regenerate</strong> - Creates a new response to your last message, useful if you want a different answer</li>
                    <li><strong>Delete</strong> - Removes the message pair (your message and the AI's response) from the conversation</li>
                    <li><strong>Copy</strong> - Copies the full content of the AI's response to your clipboard</li>
                </ul>
                
                <h4>Canceling Generation</h4>
                <p>If you want to stop the AI while it's generating a response, simply click the red Cancel button (which replaced the Send button). This immediately stops the generation process and marks the incomplete response.</p>
                
                <div class="note">
                    <p><strong>Tip:</strong> To keep your conversations organized, try using different Master keys for different subjects or projects.</p>
                </div>
            `,
                images: [
                    {
                        src: "chat_interface.png",
                        alt: "Chat Interface",
                        caption:
                            "The chat interface showing conversation controls and message options",
                    },
                    {
                        src: "Encrypted-database.png",
                        alt: "Totally encrypted database for chats and data",
                        caption: "Totally encrypted database for chats and data"
                    }
                ]

            },
            {
                id: "chat-system-prompt",
                title: "Using System Prompts",
                content: `
                <p>The system prompt is a powerful way to control how the AI behaves in your conversation. Think of it as setting instructions for the AI's personality, knowledge focus, and response style.</p>
                
                <h4>Accessing the System Prompt</h4>
                <p>To view and edit the system prompt:</p>
                <ol>
                    <li>Click on the "System Prompt" tab in the chat interface</li>
                    <li>Edit the text in the large text field</li>
                    <li>Click "Save" to apply your changes</li>
                </ol>
                
                <h4>Effective System Prompts</h4>
                <p>For best results when customizing your system prompt:</p>
                <ul>
                    <li>Be specific about the AI's role (e.g., "You are a helpful coding assistant specializing in JavaScript")</li>
                    <li>Define the preferred style and format of responses</li>
                    <li>Specify any limitations or boundaries</li>
                    <li>Include any specialized knowledge domains the AI should focus on</li>
                </ul>
                
                <div class="note">
                    <p><strong>Note:</strong> Changing the system prompt will reset the conversation context, but a "Continue Conversation" button will appear to help maintain conversation flow.</p>
                </div>
            `,
                image: "system_prompt.png",
                imageAlt: "System Prompt Editor",
                imageCaption:
                    "The system prompt editor allows you to customize the AI's behavior",
            },
            {
                id: "chat-insights",
                title: "Conversation Insights",
                content: `
                <p>The Insights feature helps the AI understand you better over time by automatically learning from your messages.</p>
                
                <h4>How Insights Work</h4>
                <p>When enabled, Paiperwork analyzes your messages to extract relevant information about your preferences, interests, and communication style. This helps the AI provide more personalized responses the more you interact with it.</p>
                
                <ul>
                    <li><strong>Privacy-Focused</strong> - Insights are securely encrypted using your Master Key and stored locally on your device</li>
                    <li><strong>Selective Analysis</strong> - Only messages that contain personal details or preferences are analyzed</li>
                    <li><strong>Non-Identifying</strong> - The system focuses on general traits rather than specific personal details</li>
                </ul>
                
                <h4>Enabling or Disabling Insights</h4>
                <p>You can control the Insights feature at any time:</p>
                <ol>
                    <li>Click on the "Chat" tab in the chat interface</li>
                    <li>Find the "Insights" toggle switch (at the top)</li>
                    <li>Switch it on (Purple) to enable insights or off (gray) to disable</li>
                </ol>
                <p>When disabled, no new insights will be collected and previously stored ones won't be used next time the APP starts (you can also refresh the browser and insights won't be loaded), previously collected insights remain stored (encrypted) until you delete the conversation data.</p>
                
                <h4>What Gets Analyzed</h4>
                <p>The system selectively analyzes messages that contain:</p>
                <ul>
                    <li>Self-references (phrases starting with "I" like "I prefer..." or "I enjoy...")</li>
                    <li>Longer, more detailed messages (typically 5+ words)</li>
                    <li>Messages containing personal preferences or opinions</li>
                </ul>
                
                <h4>How Insights Are Used</h4>
                <p>When you return to a previous conversation, the collected insights are automatically included in the AI's context if insights toggle is switched on, helping it remember important details about your preferences without needing to repeat them in every conversation.</p>
                
                <div class="note">
                    <p><strong>Privacy Note:</strong> All insights are encrypted with your Master Key and stored locally on your device. They are only accessible when you enter the exact same Master key that was used to encrypt them.</p>
                </div>
            `,
                images: [
                    {
                        src: "insights_feature.png",
                        alt: "Insights Feature Toggle",
                        caption: "The Insights toggle in the Settings tab of the chat interface"
                    },
                    {
                        src: "Insightslog.png",
                        alt: "Insights Feature logs",
                        caption: "The Insights logs in the browser console"
                    }
                ]
            },
            {
                id: "chat-advanced-features",
                title: "Advanced Chat Features",
                content: `
<h4>Context Size Control</h4>
<p>The context size determines how much of your previous conversation the AI can "remember" and use when generating responses:</p>
<ul>
    <li><strong>Automatic Context Size</strong> - When selecting a model, the system automatically sets the optimal context size based on the model's capabilities</li>
    <li><strong>Model-Specific Optimization</strong> - Each model's native context window is detected and applied</li>
    <li><strong>Resource Conservation</strong> - Initially capped at 32K to prevent excessive resource usage, but can be manually increased</li>
    <li><strong>Manual Adjustment</strong> - Select your desired context size from the dropdown menu (from 1K to 10M tokens) to override the automatic setting</li>
    <li><strong>Persistent Settings</strong> - Your context size preference is remembered across sessions</li>
</ul>

<h5>How Context Size Affects Memory Usage</h5>
<p>Context size has a direct impact on RAM and VRAM (graphics card memory) requirements:</p>
<ul>
    <li><strong>Memory calculation</strong> - For each token in your context window, the model needs to allocate memory for attention calculations</li>
    <li><strong>Scaling relationship</strong> - Memory usage scales quadratically with context size, not linearly (doubling context size can quadruple memory requirements)</li>
    <li><strong>Combined factors</strong> - Total memory usage depends on both model size (parameters) and context length</li>
</ul>

<h5>Approximate Memory Requirements</h5>
<p>As a general guideline for memory requirements:</p>
<ul>
    <li><strong>4K context</strong> - Suitable for systems with 8GB VRAM for smaller models</li>
    <li><strong>8K context</strong> - Requires 12-16GB VRAM for medium-sized models</li>
    <li><strong>32K context</strong> - Needs 24GB+ VRAM for most models</li>
    <li><strong>100K+ context</strong> - Requires high-end GPUs with 32GB+ VRAM or specialized setups</li>
</ul>

<p>When you increase context size, watch for these signs of memory pressure:</p>
<ul>
    <li>Slower response generation</li>
    <li>System becoming less responsive</li>
    <li>Ollama errors related to out-of-memory conditions</li>
    <li>Context percentage indicator turning orange or red</li>
</ul>

<div class="note">
    <p><strong>Tip:</strong> The automatic context size feature ensures optimal performance for each model. Only increase the context size manually if you specifically need longer conversation history and have sufficient system resources to handle it.</p>
</div>
                
                <h4>Image Upload (Visual Models)</h4>
                <p>When using visual AI models like Mistral small 3.1 or Gemma3, you can upload images to discuss:</p>
                <ul>
                    <li>Click the image button next to the input field</li>
                    <li>Select an image from your device or drag and drop into the upload area</li>
                    <li>For Gemma3 models, you can upload multiple images at once</li>
                    <li>Make transcriptions (OCR), ask questions or get descriptions based on the uploaded images</li>
                </ul>
                
                <h4>Web Search Integration</h4>
                <p>Enable real-time web search to help the AI provide up-to-date information:</p>
                <ul>
                    <li>Click the Web button to toggle web search capability</li>
                    <li>When enabled, the AI can search the internet for current information</li>
                    <li>This is especially useful for questions about recent events or specific facts</li>
                    <li>Web search only send the search prompt to the web (Bing.com) for queries, no personal data, stadistics or metrics is ever sent</li>
                </ul>
                
                <h4>Export Conversations</h4>
                <p>You can export your entire conversation history in different formats:</p>
                <ul>
                    <li>Click the "Export Conversation" button at the bottom of the chat</li>
                    <li>Choose from plain text (.txt), markdown (.md), or HTML (.html) formats</li>
                    <li>Downloaded files include all messages and preserve code formatting</li>
                </ul>
            `,
                image: "chat_advanced_features.png",
                imageAlt: "Advanced Chat Features",
                imageCaption: "Export chat window",
            },
            {
                id: "chat-code-blocks",
                title: "Working with Code Blocks",
                content: `
                <p>Paiperwork provides enhanced support for code blocks within conversations:</p>
                
                <h4>Code Block Features</h4>
                <ul>
                    <li><strong>Syntax Highlighting</strong> - Code is color-coded based on the programming language</li>
                    <li><strong>Language Detection</strong> - AI automatically identifies and labels the code language</li>
                    <li><strong>Copy Button</strong> - One-click copying of code blocks to clipboard</li>
                    <li><strong>Line Numbers</strong> - For easier reference in longer snippets</li>
                </ul>
                
                <h4>Running Code</h4>
                <p>For supported languages, you can run code directly from the chat interface:</p>
                <ul>
                    <li><strong>HTML Preview</strong> - Renders HTML code to see the result immediately. Tip: Ask the AI to include any CSS or JavaScript code inside the HTML to avoid errors, as the HTML code will be sandboxed in a floating window without access to other configuration or code files</li>
                </ul>
                
                <div class="note">
                    <p><strong>Security Note:</strong> Code execution happens in isolated sandboxes to ensure safety.</p>
                </div>
            `,

                images: [
                    {
                        src: "code_blocks.png",
                        alt: "Code Block Features",
                        caption:
                            "HTML Code block with syntax highlighting and execution options",
                    },
                    {
                        src: "HTML-sandboxed.png",
                        alt: "IHTML code running on sandbox",
                        caption: "HTML code running on a sandboxed floating window."
                    }
                ]
            },
            {
                id: "chat-scroll-behavior",
                title: "Scrolling and Navigation",
                content: `
                <p>The chat interface includes intelligent scrolling behavior to enhance usability during conversations:</p>
                
                <h4>Auto-scroll</h4>
                <ul>
                    <li>New messages automatically scroll into view</li>
                    <li>During AI response generation, the view follows the message as it grows</li>
                    <li>Auto-scroll temporarily disables when you manually scroll up to read previous messages</li>
                    <li>Auto-scroll re-enables after a period of inactivity (approximately 5 seconds)</li>
                    <li>Auto-scroll immediately re-enables if you scroll all the way to the bottom</li>
                </ul>
                
                <h4>Long Conversations</h4>
                <p>For navigating long conversations:</p>
                <ul>
                    <li>Scroll freely to review earlier messages</li>
                    <li>The sticky navigation bar remains accessible at the top</li>
                    <li>Changes to system prompt or context size will add a "Continue Conversation" button to help maintain context, also note that if you run out of context, the continue button will appear (The continue button will always calculate how many past messages to recap based on your current context size and use 25% of it to avoid past messages overflowing your context)</li>
                </ul>
            `,
            },
            {
                id: "chat-conversation-sessions",
                title: "Managing Conversation Sessions",
                content: `
                <p>Paiperwork organizes your conversations into session groups that help you keep track of different discussion threads within the same topic.</p>
                
                <h4>Conversation Session List</h4>
                <p>The left sidebar in chat view displays your conversation sessions:</p>
                <ul>
                    <li>Each session shows a preview of the first message</li>
                    <li>Sessions display the date and time they were created</li>
                    <li>Sessions are separated by subtle divider lines for easy distinction</li>
                    <li>The most recent sessions appear at the top</li>
                </ul>
                
                <h4>Working with Sessions</h4>
                <ul>
                    <li><strong>Load a session</strong> - Click on any session to load the conversation</li>
                    <li><strong>Delete a session</strong> - Hover over a session and click the "×" button that appears</li>
                    <li><strong>Active session</strong> - The currently loaded session is highlighted</li>
                </ul>
                
                <h4>Starting a New Conversation</h4>
                <p>To begin a fresh conversation without changing your topic:</p>
                <ol>
                    <li>Click the "New Chat" button at the top of the session list</li>
                    <li>This clears the current conversation and resets the context</li>
                    <li>A welcome message appears indicating you've started a new conversation</li>
                    <li>All previous sessions remain accessible in the sidebar</li>
                </ol>
                
                <h4>Continuing Conversations</h4>
                <p>When you select a previous session:</p>
                <ul>
                    <li>The complete conversation history is loaded</li>
                    <li>A "Continue Conversation" button appears at the bottom</li>
                    <li>Click this button to resume the conversation with full context</li>
                    <li>The input field remains disabled until you click continue, preventing accidental messages</li>
                </ul>
                
                <div class="note">
                    <p><strong>Note:</strong> Deleting a session is permanent and cannot be undone. When you delete a conversation group, only that specific thread is removed - all other sessions within the same Master key remain intact.</p>
                </div>
            `,
                image: "conversations-list.png",
                imageAlt: "Conversation Sessions Interface",
                imageCaption: "The session list showing multiple conversation threads with preview text and timestamps",
            },
        ],
    },

    // Documents section

    documents: {
        title: "Documents Tab",
        intro:
            "The Documents tab allows you to upload, manage, and interact with your documents using AI assistance.",
        articles: [
            {
                id: "docs-intro",
                title: "Introduction to Documents",
                content: `
                <p>The Documents tab enables you to work with your text and PDF documents, leveraging AI to help you understand and extract information from them.</p>
                
                <p>With the Documents feature, you can:</p>
                <ul>
                    <li>Upload PDF and text files</li>
                    <li>Ask questions about specific documents</li>
                    <li>Generate comprehensive summaries</li>
                    <li>Search across your document collection</li>
                    <li>Manage your document library</li>
                </ul>
                
                <div class="note">
                    <p><strong>Note:</strong> Documents are securely encrypted using your Master Key and stored locally on your device, ensuring your sensitive information remains private.</p>
                </div>
            `,
                image: "documents_intro.png",
                imageAlt: "Documents Tab Overview",
                imageCaption:
                    "The Documents tab interface showing the upload area and document list",
            },
            {
                id: "docs-uploading",
                title: "Uploading Documents",
                content: `
                <p>You can easily add documents to your library through the upload interface.</p>
                
                <h4>How to Upload Documents</h4>
                <ol>
                    <li>Navigate to the Documents tab</li>
                    <li>Drag and drop PDF or text files onto the upload zone, or click the upload area to browse for files</li>
                    <li>Select one or more files from your device</li>
                    <li>Wait for the processing to complete</li>
                </ol>
                
                <h4>Processing Your Documents</h4>
                <p>When you upload documents, the system:</p>
                <ul>
                    <li>Checks PDF files for extractable text content</li>
                    <li>Splits the content into manageable chunks</li>
                    <li>Creates AI-friendly representations (embeddings) of the content</li>
                    <li>Securely encrypts and stores everything locally</li>
                    <li>Makes the document available for questioning and searching</li>
                </ul>
                
                <h4>PDF Text Detection</h4>
                <p>Paiperwork automatically checks PDF files to ensure they contain extractable text:</p>
                <ul>
                    <li>Each PDF is analyzed to detect text content before processing begins</li>
                    <li>If a PDF contains no extractable text (such as scanned images without OCR), you'll receive a warning notification</li>
                    <li>PDFs without text cannot be processed for RAG as they require text content for embedding and searching</li>
                    <li>For image-only PDFs, consider using a visual AI model for text extraction or OCR tool to convert images to text before uploading</li>
                </ul>
                
                <div class="note">
                    <p><strong>Important:</strong> Make sure you have selected an AI model before uploading documents in the Chat tab. The selected model will be used for processing the documents.</p>
                </div>
            `,
                image: "documents-upload.png",
                imageAlt: "Document Upload Process",
                imageCaption:
                    "Upload zone with progress indicator for document processing",
            },
            {
                id: "docs-management",
                title: "Managing Your Documents",
                content: `
                <p>After uploading, your documents appear in the documents list where you can manage them.</p>
                
                <h4>Document Information</h4>
                <p>Each document entry shows:</p>
                <ul>
                    <li>Document title/filename</li>
                    <li>Author information (when available)</li>
                    <li>Date added to your library</li>
                    <li>Page count (for PDF files)</li>
                    <li>Number of text chunks created</li>
                    <li>Processing status (Processing or Indexed)</li>
                </ul>
                
                <h4>Document Actions</h4>
                <p>You can perform several actions with your documents:</p>
                <ul>
                    <li><strong>Select/Deselect</strong> - Click on a document to select it and access additional options</li>
                    <li><strong>Delete</strong> - Remove a document from your library</li>
                    <li><strong>Generate Summary</strong> - Create a comprehensive summary of the document's content</li>
                    <li><strong>Ask Questions</strong> - Enter Document Mode to ask specific questions about the document</li>
                </ul>
            `,
                image: "documents_management.png",
                imageAlt: "Document Management Interface",
                imageCaption:
                    "The document management interface showing document entries and action buttons",
            },
            {
                id: "docs-summaries",
                title: "Document Summaries",
                content: `
                <p>The summary feature creates a comprehensive overview of your document's content, helping you quickly understand its key points.</p>
                
                <h4>Generating a Summary</h4>
                <ol>
                    <li>Select a document from your library (click on it)</li>
                    <li>Click the "Generate Summary" button that appears</li>
                    <li>Wait while the AI reads and analyzes your document</li>
                    <li>Review the generated summary in the modal window</li>
                </ol>
                
                <h4>Summary Features</h4>
                <ul>
                    <li><strong>Progress Tracking</strong> - Watch the progress bar as the AI works through your document</li>
                    <li><strong>Incremental Display</strong> - See the summary build up in real-time for longer documents</li>
                    <li><strong>Copy Button</strong> - Copy the entire summary to your clipboard with one click</li>
                    <li><strong>Cancel Option</strong> - Stop summary generation if needed</li>
                </ul>
                
                <div class="note">
                    <p><strong>Tip:</strong> For large documents, the system processes them in smaller batches and then creates an overall summary, ensuring comprehensive coverage even for lengthy content.</p>
                </div>
            `,
                image: "document_summary.png",
                imageAlt: "Document Summary Modal",
                imageCaption:
                    "Summary modal showing generated document overview with copy option",
            },
            {
                id: "docs-questioning",
                title: "Asking Questions About Documents",
                content: `
                <p>The Document Mode allows you to have a conversation with the AI specifically about a single document.</p>
                
                <h4>Entering Document Mode</h4>
                <ol>
                    <li>Select a document from your library</li>
                    <li>Click the "Ask Questions" button</li>
                    <li>The system will redirect you to the Chat tab with Document Mode enabled</li>
                    <li>A special indicator will appear showing you're in Document Mode</li>
                </ol>
                
                <h4>Using Document Mode</h4>
                <ul>
                    <li>Ask specific questions about the document's content</li>
                    <li>Request explanations of concepts mentioned in the document</li>
                    <li>Ask for comparisons between different sections</li>
                    <li>Request factual information contained in the document</li>
                </ul>
                
                <h4>Exiting Document Mode</h4>
                <p>When you're finished working with a specific document:</p>
                <ul>
                    <li>Click the "Exit Document Mode" button on the indicator bar</li>
                    <li>You'll return to normal chat mode where you can discuss general topics</li>
                </ul>
                
                <div class="note">
                    <p><strong>Important:</strong> In Document Mode, the AI focuses exclusively on the content of the selected document, using its knowledge to help interpret but not adding external information.</p>
                </div>
            `,
                image: "document_mode.png",
                imageAlt: "Document Mode Interface",
                imageCaption:
                    "Chat interface showing Document Mode indicator when asking questions about a specific document",
            },

            // Update the docs-searching article in the documents section

            {
                id: "docs-searching",
                title: "Searching Across Documents",
                content: `
        <p>Paiperwork makes it easy to search for information across all your uploaded documents directly from the chat interface.</p>
        
        <h4>Global Document Search</h4>
        <p>When you're in the Documents tab, any questions you ask through the Chat interface will automatically search across all your documents:</p>
        <ol>
            <li>Switch to the Documents tab first to activate document search functionality</li>
            <li>Type your search query or question in the chat input field</li>
            <li>The AI will automatically search across all your documents for relevant information</li>
            <li>Results from multiple documents will be combined into a comprehensive answer</li>
        </ol>
        
        <h4>Search Results</h4>
        <p>When using document search, the AI will:</p>
        <ul>
            <li>Show a "Searching documents..." indicator while gathering information</li>
            <li>Find the most relevant passages across all your documents</li>
            <li>Prioritize results from diverse documents to provide comprehensive coverage</li>
            <li>Use semantic search to understand the meaning of your query, not just match keywords</li>
            <li>Generate a response that synthesizes information from all relevant documents</li>
            <li>Include citations to source documents when appropriate</li>
        </ul>
        
        <h4>Semantic vs. Keyword Search</h4>
        <p>Paiperwork uses semantic search technology that understands the meaning behind your questions:</p>
        <ul>
            <li>You can ask in natural language rather than using specific keywords</li>
            <li>The system will find conceptually related information even when the exact terms differ</li>
            <li>Search is context-aware and understands synonyms and related concepts</li>
            <li>Results are ranked by relevance to your specific question</li>
        </ul>
        
        <div class="note">
            <p><strong>Tip:</strong> For best results, ask specific questions about the information you're looking for rather than using generic search terms. For example, ask "What are the quarterly sales figures for 2024?" instead of just "sales data."</p>
        </div>
    `,

            },
        ],
    },

    // Dataviz Tab section
    dataviz: {
        title: "DataViz Tab",
        intro:
            "The DataViz tab allows you to create interactive data visualizations by describing your data to the AI.",
        articles: [
            {
                id: "dataviz-intro",
                title: "Introduction to Data Visualization",
                content: `
                <p>The DataViz tab enables you to generate various charts and graphs from natural language descriptions of your data. Simply select a visualization type and describe your data to the AI.</p>
                
                <p>With DataViz, you can:</p>
                <ul>
                    <li>Create visualizations from text descriptions</li>
                    <li>Generate charts without manually formatting data</li>
                    <li>Choose from multiple visualization types</li>
                    <li>See results immediately in an interactive window</li>
                    <li>Copy generated visualizations for use in other applications</li>
                </ul>
                
                <p>DataViz is perfect for quickly visualizing concepts, comparing data points, or exploring trends without the need for spreadsheets or specialized tools.</p>
            `,
                image: "dataviz_intro.png",
                imageAlt: "DataViz Tab Overview",
                imageCaption:
                    "The DataViz tab interface showing visualization type options",
            },
            {
                id: "dataviz-types",
                title: "Available Visualization Types",
                content: `
                <p>DataViz offers several visualization options to suit different types of data and analytical needs:</p>
                
                <h4>Pie Charts</h4>
                <p>Best for showing proportions of a whole or comparing parts of a total. Ideal for:</p>
                <ul>
                    <li>Market share distribution</li>
                    <li>Budget allocation</li>
                    <li>Survey response breakdowns</li>
                    <li>Any data where components sum to 100%</li>
                </ul>
                
                <h4>Bar Charts</h4>
                <p>Perfect for comparing quantities across different categories. Good for:</p>
                <ul>
                    <li>Sales comparisons by region</li>
                    <li>Population statistics</li>
                    <li>Survey results with multiple choice questions</li>
                    <li>Performance metrics across time periods</li>
                </ul>
                
                <h4>Line Charts</h4>
                <p>Ideal for showing trends over time or continuous data. Use for:</p>
                <ul>
                    <li>Stock prices over time</li>
                    <li>Temperature changes</li>
                    <li>Revenue growth</li>
                    <li>Any data with a clear progression</li>
                </ul>
                
                <h4>Scatter Plots</h4>
                <p>Best for showing relationships between two variables. Perfect for:</p>
                <ul>
                    <li>Correlation analysis</li>
                    <li>Distribution patterns</li>
                    <li>Identifying outliers</li>
                    <li>Clustering similar data points</li>
                </ul>
                
                <h4>Area Charts</h4>
                <p>Similar to line charts but with filled areas below the lines. Good for:</p>
                <ul>
                    <li>Showing volume changes over time</li>
                    <li>Comparing cumulative totals</li>
                    <li>Visualizing part-to-whole relationships over time</li>
                    <li>Emphasizing magnitude of changes</li>
                </ul>
                
                <h4>Radar Charts</h4>
                <p>Displays multivariate data as a two-dimensional chart with three or more quantitative variables. Ideal for:</p>
                <ul>
                    <li>Performance comparisons across multiple dimensions</li>
                    <li>Skill assessments</li>
                    <li>Feature comparisons of products</li>
                    <li>Any data with multiple attributes to compare</li>
                </ul>
                
                <h4>Heat Maps</h4>
                <p>Uses color intensity to represent values in a matrix format. Perfect for:</p>
                <ul>
                    <li>Correlation matrices</li>
                    <li>Geographical data intensity</li>
                    <li>Website click patterns</li>
                    <li>Showing patterns in complex datasets</li>
                </ul>
                
                <h4>Bubble Charts</h4>
                <p>Like scatter plots but with an additional dimension represented by bubble size. Good for:</p>
                <ul>
                    <li>Comparing three dimensions of data</li>
                    <li>Portfolio analysis</li>
                    <li>Resource allocation visualization</li>
                    <li>Demographic comparisons</li>
                </ul>
            `,
                image: "chart_types.png",
                imageAlt: "Chart Types",
                imageCaption: "The various visualization types available in DataViz",
            },
            {
                id: "dataviz-usage",
                title: "Creating Visualizations",
                content: `
                <p>Creating data visualizations with DataViz is straightforward:</p>
                
                <h4>Step 1: Select a Visualization Type</h4>
                <ol>
                    <li>Navigate to the DataViz tab</li>
                    <li>Browse the available chart types</li>
                    <li>Click on your preferred visualization (pie, bar, line, etc.)</li>
                </ol>
                
                <h4>Step 2: Describe Your Data</h4>
                <ol>
                    <li>After selecting a chart type, you'll be returned to the chat interface</li>
                    <li>Notice the input field now shows a specialized prompt for your selected chart</li>
                    <li>Describe the data you want to visualize in natural language</li>
                    <li>Be as specific as possible about categories, values, and relationships</li>
                </ol>
                
                <h4>Step 3: Generate and View the Visualization</h4>
                <ol>
                    <li>The AI will process your description and generate a suitable chart</li>
                    <li>A floating window will display the visualization</li>
                    <li>If the chart doesn't match your expectations, you can modify it by providing clearer instructions</li>
                </ol>
                
                <div class="note">
                    <p><strong>Tip:</strong> For best results, include specific numeric values in your description. For example, instead of saying "sales were higher in Q2," say "sales were $12,000 in Q1 and $15,500 in Q2."</p>
                </div>
            `,
                image: "dataviz_create.png",
                imageAlt: "Creating a Visualization",
                imageCaption:
                    "The process of creating a data visualization from a text description",
            },
            {
                id: "dataviz-examples",
                title: "Example Prompts",
                content: `
                <p>Here are some example prompts to help you get started with different visualization types:</p>
                
                <h4>Pie Chart Example</h4>
                <p class="example-prompt">"Create a pie chart showing browser market share with Chrome at 65%, Safari at 18%, Firefox at 8%, Edge at 5%, and Others at 4%."</p>
                
                <h4>Bar Chart Example</h4>
                <p class="example-prompt">"Generate a bar chart comparing monthly sales for Q1 2024: January $45,000, February $52,000, and March $61,000."</p>
                
                <h4>Line Chart Example</h4>
                <p class="example-prompt">"Show a line chart of average temperatures in New York over 2023: Jan 32°F, Feb 34°F, Mar 42°F, Apr 52°F, May 63°F, Jun 72°F, Jul 78°F, Aug 77°F, Sep 70°F, Oct 58°F, Nov 47°F, Dec 38°F."</p>
                
                <h4>Multi-Series Example</h4>
                <p class="example-prompt">"Create a bar chart comparing smartphone usage hours by age group: Teens (14 hrs/week), Young Adults (12 hrs/week), Middle-aged (8 hrs/week), and Seniors (4 hrs/week). Also include social media usage hours: Teens (10 hrs/week), Young Adults (8 hrs/week), Middle-aged (5 hrs/week), and Seniors (2 hrs/week)."</p>
                
                <h4>Scatter Plot Example</h4>
                <p class="example-prompt">"Generate a scatter plot showing the relationship between study hours (x-axis) and test scores (y-axis) for 10 students: (2 hrs, 65%), (3 hrs, 70%), (5 hrs, 85%), (8 hrs, 95%), (4 hrs, 75%), (6 hrs, 90%), (2 hrs, 60%), (7 hrs, 92%), (3.5 hrs, 72%), (5.5 hrs, 88%)."</p>
                
                <h4>Radar Chart Example</h4>
                <p class="example-prompt">"Create a radar chart comparing three smartphones across five categories: Phone A (Battery: 90, Camera: 85, Performance: 95, Design: 80, Price: 70), Phone B (Battery: 75, Camera: 95, Performance: 90, Design: 85, Price: 65), Phone C (Battery: 95, Camera: 75, Performance: 80, Design: 90, Price: 85)."</p>
                
                <h4>Heat Map Example</h4>
                <p class="example-prompt">"Create a heat map showing the correlation between different programming languages and their popularity across various industry sectors in 2025. Include data for languages like Python (AI/ML: 98, Finance: 85, Healthcare: 70, Gaming: 60, E-commerce: 92), JavaScript (Finance: 95, Healthcare: 55, Gaming: 75, E-commerce: 98, Media: 90), Rust (Finance: 45, Healthcare: 35, Gaming: 90, IoT: 80, Cybersecurity: 85), Go (Finance: 55, Healthcare: 45, Gaming: 35, IoT: 95, Cloud: 85), and PHP (E-commerce: 60, Media: 50, Education: 40, Government: 30, Healthcare: 35). Use a color scale from light blue to dark blue, where darker colors represent higher adoption rates."</p>

                <h4>Bubble Chart Example</h4>
                <p class="example-prompt">"Generate a bubble chart comparing different countries' renewable energy adoption. On the x-axis, show GDP per capita (USA: 65000, Germany: 48000, China: 12000, India: 2500, Brazil: 7000, Japan: 40000). On the y-axis, show percentage of renewable energy in total energy mix (USA: 20%, Germany: 45%, China: 25%, India: 35%, Brazil: 85%, Japan: 30%). Use bubble size to represent population in millions (USA: 330, Germany: 83, China: 1400, India: 1380, Brazil: 212, Japan: 126). Label each bubble with the country name and title the chart 'Renewable Energy Adoption vs. Economic Development (2025)'."</p>
                
                <div class="note">
                    <p><strong>Note:</strong> If your first attempt doesn't produce the exact visualization you want, try refining your description with more specific details about categories, values, and relationships.</p>
                </div>
            `,
                image: "dataviz_examples.png",
                imageAlt: "Example Visualizations",
                imageCaption:
                    "Examples of visualizations created from text descriptions",
            },
            {
                id: "dataviz-advanced",
                title: "Advanced Tips",
                content: `
                <p>Get the most out of DataViz with these advanced techniques:</p>
                
                <h4>Customizing Visualizations</h4>
                <p>You can request specific customizations in your prompt:</p>
                <ul>
                    <li>"Use blue and green colors for the chart"</li>
                    <li>"Make it a stacked bar chart"</li>
                    <li>"Show percentages on the pie slices"</li>
                    <li>"Use a logarithmic scale for the y-axis"</li>
                </ul>
                
                <h4>Working with Complex Data</h4>
                <p>For larger datasets:</p>
                <ul>
                    <li>Break down complex data into logical groups</li>
                    <li>Consider using multiple charts to tell a complete story</li>
                    <li>Use trends and patterns rather than every data point</li>
                    <li>Be explicit about which dimensions to show and which to omit</li>
                </ul>
                
                <h4>Handling Generation Failures</h4>
                <p>If your chart fails to generate properly:</p>
                <ul>
                    <li>Make sure you've specified precise numeric values</li>
                    <li>Check that your data is appropriate for the selected chart type</li>
                    <li>Simplify complex descriptions into clearer, structured information</li>
                    <li>Reduce the number of categories or data points</li>
                </ul>
                
                <h4>Canceling Chart Generation</h4>
                <p>If you need to stop a chart from being generated:</p>
                <ul>
                    <li>Click the "Cancel" button in the loading window</li>
                    <li>The process will terminate immediately</li>
                    <li>You can then try again with a modified prompt</li>
                </ul>
                
                <div class="note">
                    <p><strong>Important:</strong> When you switch to a different tab, the DataViz mode will be automatically deactivated, and you'll return to normal conversation mode.</p>
                </div>
            `,
                image: "dataviz_advanced.png",
                imageAlt: "Advanced DataViz Techniques",
                imageCaption:
                    "Advanced techniques for creating customized visualizations",
            },
        ],
    },

    //Paperwork section
    paperworks: {
        title: "Paperwork Tab",
        intro:
            "The Paperwork tab helps you create and manage professional document templates and forms with AI assistance, while keeping all your data private and local.",
        articles: [
            {
                id: "paperworks-intro",
                title: "Introduction to Paperwork",
                content: `
                <p>The Paperwork tab provides a powerful document creation system that helps you generate professional documents, templates, and forms using AI assistance.</p>
                
                <p>Key features of the Paperwork tab include:</p>
                <ul>
                    <li>Pre-designed document templates for common business needs</li>
                    <li>Custom template creation with AI guidance</li>
                    <li>Form generation for data collection</li>
                    <li>Document preview and editing</li>
                    <li>Export options for various formats</li>
                </ul>
                
                <p>All document processing happens locally and on your device, ensuring your sensitive business information remains private and secure. Like all features in Paiperwork, Paperwork uses your Master encryption key to protect any saved templates or forms.</p>
            `,
                image: "paperworks_intro.png",
                imageAlt: "Paperwork Tab Overview",
                imageCaption:
                    "The Paperwork dashboard showing document creation options",
            },
            {
                id: "paperworks-templates",
                title: "Document Templates",
                content: `
                <p>The Paperwork tab displays a grid of document templates that you can select to create various professional documents.</p>
                
                <h4>Available Template Types</h4>
                <ul>
                    <li><strong>Meeting Minutes</strong> - Create structured, professional meeting minutes</li>
                    <li><strong>Business Letter</strong> - Generate a professional business letter</li>
                    <li><strong>Technical Report</strong> - Create a detailed technical report with sections and images</li>
                    <li><strong>Contract</strong> - Create a legal contract document</li>
                    <li><strong>Proposal</strong> - Generate a compelling business proposal</li>
                    <li><strong>Memo</strong> - Create a professional company memo</li>
                </ul>
                
                <h4>Using Templates</h4>
                <p>To create a document from a template:</p>
                <ol>
                    <li>Click on a template card from the grid</li>
                    <li>Fill in the required information in the form fields</li>
                    <li>Click "Generate Document" to create your document</li>
                    <li>Preview, edit, or export your completed document</li>
                </ol>
                
                <div class="note">
                    <p><strong>Note:</strong> Templates are customizable starting points. You can modify any generated document to better suit your specific needs.</p>
                </div>
            `,
                image: "document_templates.png",
                imageAlt: "Document Templates Grid",
                imageCaption: "The document templates selection grid",
            },
            {
                id: "paperworks-technical-reports",
                title: "Creating Technical Reports",
                content: `
                <p>The Technical Report creator offers powerful document design capabilities with an intuitive visual editor and AI-assistance.</p>
                
                <h4>Visual Template Designer</h4>
                <p>When you select the Technical Report template, you'll access the visual template designer that allows you to:</p>
                <ul>
                    <li>Design professional multi-page documents with a visual editor</li>
                    <li>Build your report by adding different section types from the sidebar</li>
                    <li>Customize layout and structure with simplicity</li>
                    <li>Add images and visual elements with easy upload</li>
                    <li>Preview the document exactly as it will appear when printed</li>
                    <li>Maximize the designer window for a full-screen editing experience</li>
                </ul>
                
                <h4>Available Section Types</h4>
                <ul>
                    <li><strong>Document Header</strong> - Title and subtitle for your report</li>
                    <li><strong>Section Header</strong> - Divides your report into logical sections</li>
                    <li><strong>Text Area</strong> - For paragraphs and longer text content</li>
                    <li><strong>Text + Image (Right)</strong> - Text with an image on the right side</li>
                    <li><strong>Image + Text (Right)</strong> - Image with text on the right side</li>
                    <li><strong>Picture Gallery</strong> - Grid layout for multiple images</li>
                    <li><strong>Picture Row</strong> - Horizontal arrangement of images with optional caption</li>
                    <li><strong>Divider</strong> - Visual separator between sections</li>
                    <li><strong>Empty Space</strong> - Adjustable blank space with resize capability</li>
                </ul>
                
                <h4>Intelligent Layout Features</h4>
                <ul>
                    <li><strong>Multi-page support</strong> - Content automatically flows across multiple pages</li>
                    <li><strong>Page breaks</strong> - Visual indicators show where content will split between pages</li>
                    <li><strong>Automatic pagination</strong> - Page numbers are added automatically</li>
                    <li><strong>A4 format</strong> - Standard document size with proper margins</li>
                    <li><strong>Section controls</strong> - Move, edit, or delete sections with easy-access buttons</li>
                    <li><strong>Flexible spacing</strong> - Option to expand empty sections to fill a page</li>
                </ul>
                
                <h4>Content Enhancement</h4>
                <ul>
                    <li><strong>AI enhancement</strong> - One-click improvement of text content using AI assistance</li>
                    <li><strong>Direct editing</strong> - Edit text directly in the preview for WYSIWYG experience</li>
                    <li><strong>Image uploading</strong> - Drag and drop or click to upload images</li>
                    <li><strong>Content placeholders</strong> - Helpful placeholders show where to add content</li>
                    <li><strong>Undo capability</strong> - Revert AI enhancements if needed</li>
                </ul>
                <h4>Font Selection and PDF Preview</h4>
                <ul>
                    <li><strong>Font Selection</strong> - Choose from a variety of fonts using the dropdown menu above the editor</li>
                    <li><strong>Font Preview</strong> - See how your document looks with different fonts in real-time</li>
                    <li><strong>Font Persistence</strong> - Your selected font is remembered between sessions for consistency</li>
                    <li><strong>Preview PDF</strong> - View an accurate preview of how your document will appear as a PDF</li>
                    <li><strong>Page Layout</strong> - See exactly how content is distributed across pages with proper A4 sizing</li>
                    <li><strong>Page Breaks</strong> - Preview shows clear page break indicators between document pages</li>
                </ul>               

                <h4>Using PDF Preview</h4>
                <ol>
                    <li>Click the "Preview" button next to the font selector</li>
                    <li>A modal window will open showing your document as it would appear in PDF format</li>
                    <li>Each page is shown at proper A4 size with exact layout positioning</li>
                    <li>Review pagination and ensure content is properly distributed</li>
                    <li>Close the preview when finished to return to editing</li>
                </ol>
                <h4>Creating a Technical Report</h4>
                <ol>
                    <li>Enter a name for your report at the top of the designer</li>
                    <li>Click on design presets from the right panel to add them to your document</li>
                    <li>Fill in content for each section by clicking and typing directly in the section</li>
                    <li>Upload images by clicking on image placeholders</li>
                    <li>Enhance text with the AI buttons beneath editable text areas</li>
                    <li>Rearrange sections using the up/down arrow controls</li>
                    <li>Once complete, save your report and export or print it</li>
                </ol>
                
                <div class="note">
                    <p><strong>Tip:</strong> Maximize the editor window using the maximize button in the top-right corner for a more comfortable editing experience with larger documents. The interface automatically adjusts to provide optimal layout in both regular and maximized views.</p>
                </div>
                `,
                images: [
                    {
                        src: "technical_report_designer.png",
                        alt: "Technical report",
                        caption:
                            "The visual technical report designer showing the document layout and section types",
                    },
                    {
                        src: "preview-window-technical-report.png",
                        alt: "The preview window for technical reports",
                        caption: "The preview window for technical reports"
                    }
                ]
            },
            {
                id: "paperworks-document-generation",
                title: "Document Generation",
                content: `
                <p>Paperwork uses AI assistance to help you generate professional document content based on your inputs.</p>
                
                <h4>Document Generation Process</h4>
                <ol>
                    <li>Select a document template</li>
                    <li>Fill in the required form fields with your information</li>
                    <li>Click "Generate Document" to create your document</li>
                    <li>Review the generated content</li>
                    <li>Edit or refine the content as needed</li>
                    <li>Export or save your finalized document</li>
                </ol>
                
                <h4>AI Enhancement</h4>
                <p>The AI assistance can help you:</p>
                <ul>
                    <li>Format your content professionally</li>
                    <li>Suggest appropriate phrasing and terminology</li>
                    <li>Ensure consistency throughout your document</li>
                    <li>Generate complete sections based on your inputs</li>
                </ul>
                
                <div class="note">
                    <p><strong>Note:</strong> To use the AI enhancement features, make sure you have selected an AI model in the Chat tab first.</p>
                </div>
            `,
                image: "document_generation.png",
                imageAlt: "Document Generation Process",
                imageCaption: "The document generation form interface",
            },
            {
                id: "paperworks-export",
                title: "Exporting Documents",
                content: `
                <p>Once you've created and refined your document, you can export it in various formats.</p>
                
                <h4>Available Export Options</h4>
                <ul>
                    <li><strong>Text Export</strong> - Copy the text with it't formatting ready to be pasted in any text processor</li>
                    <li><strong>Email it</strong> - Open your default email  program, fills the subject and email body</li>
                </ul>
                
                <h4>Exporting Your Document</h4>
                <ol>
                    <li>After generating your document, review the preview</li>
                    <li>Make any final adjustments as needed</li>
                    <li>Click on the appropriate export button (Copy, Email)</li>
                    <li>Follow the prompts to save or send your document</li>
                </ol>
                
                <p>All exported documents maintain the formatting and styling from your preview, ensuring professional presentation regardless of format.</p>
            `,
                image: "document_export.png",
                imageAlt: "Document Export Options",
                imageCaption: "The document export interface showing format options",
            },
        ],
    },

    //Research section
    research: {
        title: "Research Tab",
        intro: "The Research Tab provides powerful AI-assisted research capabilities and a personal knowledge base for storing and retrieving information.",
        articles: [
            {
               id: "research-intro",
title: "Introduction to Research Tools",
content: `
    <p>The Research tab offers two powerful tools to help you gather, analyze, and store information:</p>
    
    <ul>
        <li><strong>Research Assistant</strong> - AI-powered web research that helps you find, analyze, and synthesize information on any topic</li>
        <li><strong>Knowledge Base</strong> - A personal database where you can store, organize, and retrieve important information for future reference</li>
    </ul>
    
    <h4>Privacy and Data Security</h4>
    <p>The Research tab maintains Paiperwork's commitment to privacy and data security:</p>
    <ul>
        <li><strong>Internet Connection Required</strong> - The Research Assistant requires an internet connection to perform web searches</li>
        <li><strong>Limited Data Transmission</strong> - Only search queries are sent to the internet (via Bing Search). No personal or business data is ever transmitted</li>
        <li><strong>Local Processing</strong> - All search results are processed locally on your device by your chosen AI model</li>
        <li><strong>Encrypted Storage</strong> - Research results and knowledge base entries are encrypted using your Master Key in your local database</li>
        <li><strong>Completely Offline Knowledge Base</strong> - The Knowledge Base operates entirely locally, requiring no internet connection once entries are created</li>
    </ul>
    
    <h4>Switching Between Tools</h4>
    <p>Use the sub-tab navigation at the top of the Research tab to switch between the Research Assistant and Knowledge Base:</p>
    <ul>
        <li>Click <strong>Research</strong> to use the AI-powered web search and analysis tool</li>
        <li>Click <strong>Knowledge Base</strong> to access your stored information collections</li>
    </ul>
    
    <div class="note">
        <p><strong>Important:</strong> Select a model from the dropdown before using either research tool. For research tasks, non-reasoning models (like Mistral or LLaMA) perform best, as reasoning models may interfere with web search functionality.</p>
    </div>
`,
image: "research_tab_overview.png",
imageAlt: "Research Tab Overview",
imageCaption: "The Research tab showing the sub-tab navigation between Research Assistant and Knowledge Base"
            },
            {
                id: "research-assistant",
                title: "Using the Research Assistant",
                content: `
                <p>The Research Assistant combines web search, AI analysis, and report generation to help you research any topic thoroughly.</p>
                
                <h4>Starting Your Research</h4>
                <ol>
                    <li>Select a model from the "Research Model" dropdown at the top of the Research tab</li>
                    <li>Enter your research question in the input field</li>
                    <li>Click the "Research" button to begin the research process</li>
                </ol>
                
                <h4>Research Process</h4>
                <p>When you initiate research, the system performs several steps:</p>
                <ol>
                    <li><strong>Query Generation</strong> - Creates optimized search queries based on your research question</li>
                    <li><strong>Web Search</strong> - Searches the web for relevant information using multiple queries</li>
                    <li><strong>Content Analysis</strong> - Analyzes and extracts key information from search results</li>
                    <li><strong>PDF Handling</strong> - Identifies and processes relevant PDF documents when available</li>
                    <li><strong>Report Generation</strong> - Synthesizes all gathered information into a comprehensive report</li>
                </ol>
                
                <p>During the research process, a progress window shows you the current status and allows you to cancel at any time.</p>
                
                <h4>Deep Search Option</h4>
                <p>The Deep Search feature enhances research by following relevant links found in search results:</p>
                <ul>
                    <li>Toggle the "Deep Search" option to enable or disable this feature</li>
                    <li>When enabled, the system will explore links from initial results to find more in-depth information</li>
                    <li>This provides more thorough coverage but increases research time</li>
                </ul>
                
                <div class="note">
                    <p><strong>Tip:</strong> For complex or academic topics, enabling Deep Search often provides more comprehensive and authoritative information.</p>
                </div>
            `,
                image: "research_assistant.png",
                imageAlt: "Research Assistant Interface",
                imageCaption: "The Research Assistant interface showing query input and controls"
            },
            {
                id: "research-results",
                title: "Working with Research Results",
                content: `
                <p>After your research is complete, the system generates a comprehensive research report with all findings.</p>
                
                <h4>Research Report Structure</h4>
                <p>The research report is structured for clarity and comprehensiveness:</p>
                <ul>
                    <li><strong>Introduction</strong> - Summarizes the research question and approach</li>
                    <li><strong>Main Findings</strong> - Presents key information organized by subtopics</li>
                    <li><strong>Conclusion</strong> - Synthesizes the most important insights</li>
                    <li><strong>Sources</strong> - Lists all references with links to the original content</li>
                </ul>
                
                <h4>Report Controls</h4>
                <p>The results window provides several options for working with your research report:</p>
                <ul>
                    <li><strong>Export</strong> - Save the report as plain text, markdown, or HTML</li>
                    <li><strong>Copy</strong> - Copy the entire report to your clipboard</li>
                    <li><strong>Save to Knowledge Base</strong> - Store the report in your knowledge base for future reference</li>
                    <li><strong>Close</strong> - Close the results window</li>
                </ul>
                
                <h4>Exporting Research Reports</h4>
                <p>When you click the Export button, you can choose from several formats:</p>
                <ul>
                    <li><strong>Plain Text (.txt)</strong> - Simple, compatible with all text editors</li>
                    <li><strong>Markdown (.md)</strong> - Preserves formatting, code blocks, and links</li>
                    <li><strong>HTML (.html)</strong> - Full formatting with proper styling</li>
                </ul>
                
                <div class="note">
                    <p><strong>Tip:</strong> If you plan to use your research in other applications, HTML format provides the most complete formatting, while Markdown offers the best balance between formatting and compatibility.</p>
                </div>
            `,
                image: "research_results.png",
                imageAlt: "Research Results",
                imageCaption: "A completed research report with export and save options"
            },
            {
                id: "knowledge-base-intro",
                title: "Knowledge Base Overview",
                content: `
                <p>The Knowledge Base allows you to create, organize, and search through collections of information that you want to keep for future reference.</p>
                
                <h4>Knowledge Base Structure</h4>
                <p>Your knowledge is organized into collections and entries:</p>
                <ul>
                    <li><strong>Collections</strong> - Folders or categories that contain related entries (e.g., "Project Research" or "Cooking Recipes")</li>
                    <li><strong>Entries</strong> - Individual pieces of information stored within collections</li>
                </ul>
                
                <h4>Creating a Collection</h4>
                <ol>
                    <li>Enter a name for your new collection in the "New collection name..." field</li>
                    <li>Click the "Create Collection" button</li>
                    <li>Your new collection will appear in the collections list below</li>
                </ol>
                
                <h4>Managing Collections</h4>
                <p>Each collection in your list has several action buttons:</p>
                <ul>
                    <li><strong>View</strong> - Open the collection to see its contents</li>
                    <li><strong>Edit</strong> - Rename the collection</li>
                    <li><strong>Export</strong> - Save the collection and its entries to a file</li>
                    <li><strong>Delete</strong> - Remove the collection and all its entries</li>
                </ul>
                
                <div class="note">
                    <p><strong>Important:</strong> Knowledge Base data is encrypted using your Master Key and stored locally on your device. This ensures privacy but also means you must use the same Master Key to access your knowledge in future sessions.</p>
                </div>
            `,
                image: "knowledge_base_collections.png",
                imageAlt: "Knowledge Base Collections",
                imageCaption: "The Knowledge Base showing a list of collections with management options"
            },
            {
                id: "knowledge-entries",
                title: "Working with Knowledge Entries",
                content: `
                <p>Knowledge entries are individual pieces of information stored within your collections.</p>
                
                <h4>Types of Knowledge Entries</h4>
                <p>You can create two types of entries in your Knowledge Base:</p>
                <ul>
                    <li><strong>Manual Entries</strong> - Information you write or paste directly</li>
                    <li><strong>Research Entries</strong> - Information saved from your research reports</li>
                </ul>
                
                <h4>Creating a New Entry</h4>
                <ol>
                    <li>Open a collection by clicking the "View" button</li>
                    <li>Click the "+ New Entry" button at the top of the collection view</li>
                    <li>Enter a title for your entry</li>
                    <li>Add your content in the text area (Markdown formatting is supported)</li>
                    <li>Click "Save Entry" to add it to your collection</li>
                </ol>
                
                <h4>Viewing and Managing Entries</h4>
                <p>From the collection view, you can:</p>
                <ul>
                    <li>Click on any entry to view its full content</li>
                    <li>Use the "Edit Entry" button to modify an entry's content</li>
                    <li>Use the "Delete Entry" button to remove an entry</li>
                    <li>Click the "← Back to Entries" button to return to the collection view</li>
                </ul>
                
                <h4>Markdown Support</h4>
                <p>When creating or editing entries, you can use Markdown formatting:</p>
                <ul>
                    <li><strong>Headers</strong> - Use # for heading level 1, ## for level 2, etc.</li>
                    <li><strong>Formatting</strong> - Use *italic* for italics and **bold** for bold text</li>
                    <li><strong>Lists</strong> - Create bullet lists with * or numbered lists with 1., 2., etc.</li>
                    <li><strong>Links</strong> - Create links with [text](URL) syntax</li>
                </ul>
                
                <div class="note">
                    <p><strong>Tip:</strong> Markdown formatting makes your entries more organized and readable, especially for technical or structured content.</p>
                </div>
            `,
                image: "knowledge_entries.png",
                imageAlt: "Knowledge Entries",
                imageCaption: "A collection view showing multiple knowledge entries"
            },
            {
                id: "knowledge-search",
                title: "Searching Your Knowledge Base",
                content: `
                <p>The Knowledge Base includes a powerful search feature that helps you find information across all your collections.</p>
                
                <h4>Using the Search Feature</h4>
                <ol>
                    <li>Navigate to the Knowledge Base tab</li>
                    <li>Enter your search query in the "Search your knowledge..." input field</li>
                    <li>Click the "Search" button</li>
                    <li>Review the matching entries that appear in the results section</li>
                </ol>
                
                <h4>Search Results</h4>
                <p>Search results will show:</p>
                <ul>
                    <li>The title of each matching entry</li>
                    <li>The collection it belongs to</li>
                    <li>A preview of the relevant content</li>
                    <li>Options to view the full entry or go to its collection</li>
                </ul>
                
                <h4>Optimizing Your Searches</h4>
                <p>For best results when searching your knowledge base:</p>
                <ul>
                    <li>Use specific keywords rather than vague phrases</li>
                    <li>Try both singular and plural forms if you don't find what you're looking for</li>
                    <li>Search for major concepts rather than minor details</li>
                    <li>For complex topics, try multiple shorter searches instead of one long query</li>
                </ul>
                
                <div class="note">
                    <p><strong>Note:</strong> The search system automatically analyzes your content to understand its meaning, allowing it to find relevant entries even when they don't contain the exact words from your search query.</p>
                </div>
            `,
                image: "knowledge_search.png",
                imageAlt: "Knowledge Base Search",
                imageCaption: "The Knowledge Base search interface showing search results"
            },
            {
                id: "research-to-knowledge",
                title: "From Research to Knowledge",
                content: `
                <p>One of the most powerful features of the Research tab is the integration between the Research Assistant and Knowledge Base.</p>
                
                <h4>Saving Research to Knowledge Base</h4>
                <p>After completing a research session:</p>
                <ol>
                    <li>Click the "Save to Knowledge Base" button in the research results window</li>
                    <li>Select an existing collection or create a new one</li>
                    <li>Confirm your selection to save the research</li>
                </ol>
                
                <p>The research report will be saved as a new entry in your selected collection, including:</p>
                <ul>
                    <li>The full research report content</li>
                    <li>The original research question as the entry title</li>
                    <li>Metadata about when the research was conducted</li>
                    <li>All sources from the research</li>
                </ul>
                
                <h4>Source Management</h4>
                <p>When saving research to your Knowledge Base, you have options for handling sources:</p>
                <ul>
                    <li><strong>Save with Sources</strong> - Includes all reference links and citations</li>
                    <li><strong>Save Content Only</strong> - Saves only the research content without sources</li>
                </ul>
                
                <h4>Building Your Knowledge Library</h4>
                <p>By regularly saving your research to the Knowledge Base, you can:</p>
                <ul>
                    <li>Build a personal library of verified information</li>
                    <li>Avoid repeating research on topics you've already explored</li>
                    <li>Quickly reference previous findings in new projects</li>
                    <li>Create connections between related topics</li>
                </ul>
                
                <div class="note">
                    <p><strong>Pro Tip:</strong> Create themed collections for different areas of interest or projects, then use the search function to find connections across your entire knowledge library.</p>
                </div>
            `,
                image: "research_to_knowledge.png",
                imageAlt: "Saving Research to Knowledge Base",
                imageCaption: "The dialog for saving research results to a Knowledge Base collection"
            }
        ],
    },

    artworks: {
        title: "Visual Design Studio",
        intro:
            "The Visual Design Studio tab allows you to use AI vision models to: analyze design choices in images, generate website prototypes based on visual designs, and create text overlays for images.",
        articles: [
            {
                id: "artworks-intro",
                title: "Introduction to Visual Design Studio",
                content: `
                <p>The Visual Design Studio provides tools to analyze images and generate web code using AI visual models.</p>
                
                <p>Key features include:</p>
                <ul>
                    <li>HTML Style Transfer - Convert images into web designs with HTML/CSS code</li>
                    <li>Text Overlay - Add responsive text overlays to images with automatic positioning</li>
                    <li>Design Rationale - Get professional analysis of design choices in your images</li>
                </ul>
                
                <h4>Requirements</h4>
                <p>To use these features effectively:</p>
                <ul>
                    <li>You need a visual AI model installed in Ollama (such as LLaVA, Gemma3, or another vision-capable model)</li>
                    <li>The model must be able to interpret visual inputs and generate code</li>
                    <li>Upload clear, high-quality images for best results (Maximum 5mb)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Note:</strong> Visual processing can be resource-intensive. More complex images and detailed prompts may take longer to process.</p>
                </div>
            `,
                image: "artworks_intro.png",
                imageAlt: "Visual Design Studio Tab Overview",
                imageCaption:
                    "The Visual Design Studio tab showing the model selector and mode options",
            },
            {
                id: "artworks-models",
                title: "Working with Visual Models",
                content: `
                <p>Visual Design Studio requires special AI models that can interpret images.</p>
                
                <h4>Selecting a Visual Model</h4>
                <ol>
                    <li>At the top of the Visual Design Studio tab, you'll find the model selector dropdown</li>
                    <li>Choose from available visual models installed on your system</li>
                    <li>If no models are available, you'll see a message with instructions to install compatible models</li>
                </ol>
                
                <h4>Compatible Visual Models</h4>
                <p>The following models are compatible with Visual Design Studio:</p>
                <ul>
                    <li><strong>Gemma3</strong> - Google's visual model with strong code generation</li>
                    <li><strong>LLaVA</strong> - Large Language and Vision Assistant</li>
                    <li><strong>BakLLaVA</strong> - Optimized variant of LLaVA</li>
                    <li><strong>Phi3-Vision</strong> - Microsoft's vision model with good design understanding</li>
                    <li>Any other Ollama model with vision capabilities</li>
                </ul>
                
                <h4>Installing Visual Models</h4>
                <p>If you don't have any compatible models:</p>
                <ol>
                    <li>Click the "Go to Models Tab" button on the warning screen</li>
                    <li>In the Models tab, install a vision-capable model using Ollama</li>
                    <li>Return to the Visual Design Studio tab after installation is complete</li>
                </ol>
                
                <div class="note">
                    <p><strong>Tip:</strong> Vision models with stronger coding abilities (like Gemma3) typically produce better HTML and CSS output.</p>
                </div>
            `,
                image: "artworks_models.png",
                imageAlt: "Visual Model Selection",
                imageCaption:
                    "The visual model selection dropdown showing compatible installed models",
            },
            {
                id: "artworks-modes",
                title: "Design Modes",
                content: `
                <p>The Visual Design Studio offers three specialized modes for working with images:</p>
                
                <h4>HTML Style Transfer</h4>
                <p>This mode analyzes the visual design elements of your image and creates matching HTML/CSS code:</p>
                <ul>
                    <li>Converts color schemes, layouts, and visual elements into web code</li>
                    <li>Generates a complete, responsive web page based on the image style</li>
                    <li>Perfect for using design inspiration photos to create web interfaces</li>
                    <li>Option to use your uploaded image as a background in the generated design</li>
                </ul>
                
                <h4>Text Overlay</h4>
                <p>This mode helps you add text content to images in a responsive, well-positioned way:</p>
                <ul>
                    <li>Analyzes your image to find optimal text placement areas</li>
                    <li>Generates HTML/CSS for text overlays that work across device sizes</li>
                    <li>Ideal for creating marketing materials, banners, or product showcases</li>
                    <li>Considers image dimensions and orientation for proper text positioning</li>
                </ul>
                
                <h4>Design Rationale</h4>
                <p>This mode provides professional analysis of design choices in your image:</p>
                <ul>
                    <li>Explains why certain design elements work well together</li>
                    <li>Analyzes color theory, typography, layout principles, and visual hierarchy</li>
                    <li>Offers insights into how the design affects user experience</li>
                    <li>Great for learning design principles or understanding successful designs</li>
                </ul>
                
                <div class="note">
                    <p><strong>Note:</strong> Each mode has specialized prompts tailored to its purpose. The mode you select will change the placeholder text in the instructions field to guide you.</p>
                </div>
            `,
                image: "artworks_modes.png",
                imageAlt: "Design Modes",
                imageCaption:
                    "The three design modes available in the Visual Design Studio",
            },
            {
                id: "artworks-uploading",
                title: "Working with Images",
                content: `
                <p>The image you upload serves as the foundation for all design operations in the Visual Design Studio.</p>
                
                <h4>Uploading Images</h4>
                <ol>
                    <li>Click on the upload area or drag and drop an image file</li>
                    <li>Supported formats include PNG, JPEG, GIF, and WebP</li>
                    <li>Maximum file size is 5MB</li>
                    <li>Once uploaded, you'll see a preview of your image</li>
                </ol>
                
                <h4>Image Orientation Information</h4>
                <p>After uploading, the system will analyze your image and show:</p>
                <ul>
                    <li>Image dimensions (width × height in pixels)</li>
                    <li>Orientation type (Landscape, Portrait, or Square)</li>
                    <li>Aspect ratio</li>
                </ul>
                <p>This information is particularly useful in Text Overlay mode for planning proper text placement.</p>
                
                <h4>Background Image Option</h4>
                <p>In HTML Style Transfer mode, you'll see a checkbox option to "Use as background image":</p>
                <ul>
                    <li>When checked, your image will be incorporated as a background in the generated design</li>
                    <li>When unchecked, the AI will only use the style elements from your image without including the actual image</li>
                </ul>
                
                <h4>Replacing Images</h4>
                <p>To replace your current image:</p>
                <ol>
                    <li>Click the "×" button in the corner of the image preview</li>
                    <li>Upload a new image using the upload area</li>
                </ol>
                
                <div class="note">
                    <p><strong>Tip:</strong> For best results, use clear images with distinct design elements. Images with good contrast, clean layouts, and visible structure work best for style transfer.</p>
                </div>
            `,
                image: "artworks_images.png",
                imageAlt: "Image Upload and Management",
                imageCaption:
                    "The image upload area, preview, and options in the Visual Design Studio",
            },
            {
                id: "artworks-instructions",
                title: "Design Instructions",
                content: `
                <p>The "Design Instructions" text area is where you guide the AI in creating your desired output.</p>
                
                <h4>Writing Effective Instructions</h4>
                <p>Your instructions should be clear, specific, and match your selected mode:</p>
                
                <h5>For HTML Style Transfer mode:</h5>
                <ul>
                    <li><strong>Good example:</strong> "Create a modern e-commerce product page based on this design. Include a navigation bar, product gallery, and call-to-action buttons. Use the cool blue and gray color scheme from the image."</li>
                    <li><strong>Poor example:</strong> "Make a website."</li>
                </ul>
                
                <h5>For Text Overlay mode:</h5>
                <ul>
                    <li><strong>Good example:</strong> "Add the following text to this product image: Heading: 'Premium Wireless Headphones', Subheading: 'Immersive Sound Experience', Price: '$149.99', Button text: 'Shop Now'"</li>
                    <li><strong>Poor example:</strong> "Put some text on it."</li>
                </ul>
                
                <h5>For Design Rationale mode:</h5>
                <ul>
                    <li><strong>Good example:</strong> "Analyze the color scheme, typography, and layout of this landing page. Explain how these elements work together to create a professional feeling and how they guide the user's attention."</li>
                    <li><strong>Poor example:</strong> "Why is this good?"</li>
                </ul>
                
                <h4>Key Elements to Include</h4>
                <ul>
                    <li>Specific design style or theme you want (minimalist, retro, corporate, etc.)</li>
                    <li>Key components to include (navigation, forms, product displays, etc.)</li>
                    <li>Color preferences or modifications to the image style</li>
                    <li>Target audience or purpose of the design</li>
                    <li>Responsive behavior requirements (if applicable)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Tip:</strong> You can press Enter (without Shift) in the instruction field to immediately start generation when the Generate button is enabled.</p>
                </div>
            `,
                image: "artworks_instructions.png",
                imageAlt: "Design Instructions",
                imageCaption: "The design instructions text area with example prompt",
            },
            {
                id: "artworks-generation",
                title: "Generating Designs",
                content: `
                <p>Once you've selected a model, uploaded an image, and provided instructions, you're ready to generate your design.</p>
                
                <h4>Starting Generation</h4>
                <ol>
                    <li>Verify that all required elements are complete (the Generate button will become active)</li>
                    <li>Click the "Generate Design" button</li>
                    <li>A progress window will appear showing the generation status</li>
                    <li>Wait for the AI to analyze your image and create the output (typically 30-60 seconds)</li>
                </ol>
                
                <h4>During Generation</h4>
                <p>While the AI is working:</p>
                <ul>
                    <li>The chat interface controls will be temporarily disabled</li>
                    <li>You can cancel generation at any time by clicking the close button in the progress window</li>
                    <li>For complex designs or larger images, the process may take longer</li>
                </ul>
                
                <h4>Viewing Results</h4>
                <p>After generation completes:</p>
                <ul>
                    <li>The output will be displayed in the chat interface</li>
                    <li>HTML/CSS code will be formatted with syntax highlighting</li>
                    <li>You can copy the code using the copy button in the code block</li>
                    <li>For HTML outputs, you'll see a "Preview HTML" button to view the rendered result</li>
                </ul>
                
                <div class="note">
                    <p><strong>Important:</strong> When switching away from the Visual Design Studio tab, any active image data is cleared from memory to prevent resource usage issues. The system also resets the chat context to prepare for regular conversations.</p>
                </div>
            `,
                image: "artworks_generation.png",
                imageAlt: "Design Generation Process",
                imageCaption: "The results display window",
            },
            {
                id: "artworks-tips",
                title: "Tips and Best Practices",
                content: `
                <p>Get the most out of the Visual Design Studio with these expert tips:</p>
                
                <h4>Choosing the Right Images</h4>
                <ul>
                    <li>Use high-quality images with clear details and good lighting</li>
                    <li>For style transfer, choose images with distinct design elements and color schemes</li>
                    <li>For text overlay, select images with clear areas where text can be placed</li>
                    <li>For design rationale, professional designs with intentional elements work best</li>
                </ul>
                
                <h4>Crafting Effective Instructions</h4>
                <ul>
                    <li>Be specific about what you want the AI to focus on</li>
                    <li>Mention any particular elements from the image you want emphasized</li>
                    <li>Specify the target audience or purpose of the design</li>
                    <li>For code generation, mention any particular features needed (responsive, animations, etc.)</li>
                </ul>
                
<h4>Working with Generated Code</h4>
<ul>
    <li>Generated code may need minor adjustments for perfect results, code can be modified and previewed directly</li>
    <li>Test the code in different browsers and screen sizes</li>
    <li>Consider the code as a starting point that you can refine further</li>
    <li>If the result isn't what you expected, try regenerating with more specific instructions</li>
    <li><strong>Replace temporary image URLs</strong> - Generated code contains temporary blob URLs (like 'blob:http://localhost:8182/e47bea1c-1b8b-4695-91cd-32e26c4494da') for images. These are temporarily stored in memory for preview and will not work outside your current session. Replace them with your own image paths when using the code.</li>
    <li><strong>Look for background-image properties</strong> - Check CSS properties like <code>background-image: url('blob:http://...')</code> and replace the blob URL with a path to your actual image file.</li>
</ul>
                
                <h4>Troubleshooting</h4>
                <ul>
                    <li>If generation fails, try a different visual model</li>
                    <li>For slow performance, use smaller images or simplify your instructions</li>
                    <li>If text placement isn't ideal in overlay mode, specify preferred positions in your instructions</li>
                    <li>For complex designs, try breaking down your request into multiple smaller generations</li>
                </ul>
                
                <div class="note">
                    <p><strong>Pro Tip:</strong> If you're getting incomplete or cut-off code, try asking the AI to continue or complete the code in a regular chat message after the generation is complete.</p>
                </div>
            `,
                image: "artworks_tips.png",
                imageAlt: "Visual Design Studio Tips",
                imageCaption:
                    "Temporal code placement for image to display in preview",
            },
        ],
    },

    // Models Tab section
    models: {
        title: "Models Tab",
        intro:
            "The Models tab allows you to browse, download, and manage AI models from Ollama used by Paiperwork with full local control.",
        articles: [
            {
                id: "models-intro",
                title: "Introduction to Models",
                content: `
                <p>The Models tab provides a central interface for managing the AI models that power your Paiperwork experience.</p>
                
                <p>Key features of the Models tab include:</p>
                <ul>
                    <li>Browse available models in the Ollama library</li>
                    <li>Download new models to your local system</li>
                    <li>Manage your installed models</li>
                    <li>Configure model parameters for optimal performance</li>
                    <li>Delete models you no longer need</li>
                </ul>
                
                <p>All models run locally on your device through Ollama, ensuring your data remains private and secure while still benefiting from powerful AI capabilities.</p>
                
                <h4>Reasoning Models</h4>
                <p>Some specialized models have enhanced reasoning capabilities that can be activated with specific system prompts:</p>
                <ul>
                    <li><strong>Cogito</strong> and other reasoning-focused models may require a special system prompt to activate their full capabilities</li>
                    <li>For Cogito models, add <code>"Enable deep thinking subroutine."</code> (without quotes) to your system prompt</li>
                    <li>This activates advanced reasoning features, allowing for more structured, step-by-step thinking</li>
                    <li>Different reasoning models may have different activation phrases - check the model's documentation for details</li>
                </ul>
                
                <div class="note">
                    <p><strong>Note:</strong> The models in Paiperwork are powered by Ollama, which must be installed and running on your system. Model availability depends on your local Ollama installation.</p>
                </div>
            `,
                image: "models_intro.png",
                imageAlt: "Models Tab Overview",
                imageCaption:
                    "The Models tab interface showing available and local models sections",
            },
            {
                id: "models-browsing",
                title: "Browsing Available Models",
                content: `
                <p>Paiperwork allows you to browse the entire Ollama model library directly from the application interface.</p>
                
                <h4>Fetching Available Models</h4>
                <ol>
                    <li>Navigate to the Models tab</li>
                    <li>Click the "Fetch Ollama Models" button at the top of the screen</li>
                    <li>Wait as Paiperwork connects to the Ollama library</li>
                    <li>Once complete, a status message will confirm how many models were found</li>
                </ol>
                
                <h4>Exploring Model Options</h4>
                <p>After fetching models, you can:</p>
                <ul>
                    <li>Browse the models using the dropdown selector</li>
                    <li>View model descriptions that explain their capabilities</li>
                    <li>See model popularity information (number of pulls)</li>
                </ul>
                
                <h4>Model Types</h4>
                <p>The Ollama library includes models with different specializations:</p>
                <ul>
                    <li><strong>General purpose</strong> - Models like Gemma, Llama, Qwen2.5 and Mistral for everyday tasks</li>
                    <li><strong>Code-specialized</strong> - Models like Qwen2.5 coder, CodeLlama and WizardCoder optimized for programming</li>
                    <li><strong>Vision-capable</strong> - Models like LLaVA and Gemma3 that can analyze images</li>
                    <li><strong>Fine-tuned</strong> - Models trained for specific use cases or with particular characteristics</li>
                </ul>
                
                <div class="note">
                    <p><strong>Tip:</strong> Read the model descriptions carefully to understand each model's strengths and capabilities before downloading.</p>
                </div>
            `,
                image: "models_browsing.png",
                imageAlt: "Browsing Available Models",
                imageCaption:
                    "The model selection dropdown displaying available models from the Ollama library",
            },
            {
                id: "models-downloading",
                title: "Downloading Models",
                content: `
                <p>Once you've identified a model you want to use, you can download it directly to your local system.</p>
                
                <h4>Selecting a Model Size</h4>
                <ol>
                    <li>Select a model from the dropdown list</li>
                    <li>Review the model description</li>
                    <li>When you choose a model, the size options will automatically appear</li>
                    <li>Select the appropriate size version that matches your needs and system capabilities</li>
                </ol>
                
                <h4>Understanding Model Sizes</h4>
                <p>Most models are available in multiple size variants:</p>
                <ul>
                    <li><strong>Larger sizes</strong> (7B, 13B, 34B parameters) - These larger models provide better quality but require more VRAM (graphic card memory, exceeding the model size due to context inclusion, please note that screen resolution will affect memory usage), RAM (same as with VRAM, please note your operating system also uses RAM, so not all of it will be available for AI model+context use), and processing power (the faster the CPU, the merrier).</li>
                    <li><strong>Smaller sizes</strong> (3B, 1.5B parameters) - More efficient but may have reduced capabilities</li>
                    <li><strong>Quantized versions</strong> (Q4_K_M, Q5_K_S) - Compressed models that use less memory while maintaining quality</li>
                </ul>
                
                <h4>VRAM Requirements Example</h4>
                <p>To give you an idea of hardware requirements for running models with an 8K context window:</p>
                <ul>
                    <li><strong>Small models (3B)</strong>: ~4-6GB VRAM with quantization (Q4/Q5)</li>
                    <li><strong>Medium models (7B)</strong>: ~8-10GB VRAM with quantization (Q4/Q5)</li>
                    <li><strong>Large models (13B)</strong>: ~14-16GB VRAM with quantization (Q4/Q5)</li>
                    <li><strong>Very large models (34B+)</strong>: 24GB+ VRAM with quantization (Q4/Q5)</li>
                </ul>
                <p>These requirements can vary based on specific models and system configurations. Consider starting with smaller or more heavily quantized models if you have limited VRAM.</p>
                
                <h4>Starting the Download</h4>
                <ol>
                    <li>Click the "Download Model" button</li>
                    <li>The button will show download progress information</li>
                    <li>A status message below will show the current operation (downloading, processing)</li>
                    <li>A cancel button will appear if you need to stop the download, restart Ollama to clean up incomplete downloads</li>
                </ol>
                
                <h4>Download Process</h4>
                <p>During download, you'll see:</p>
                <ul>
                    <li>Progress information showing downloaded size and total size</li>
                    <li>Status updates for different stages (downloading, unpacking, verifying)</li>
                    <li>Confirmation when the download is complete</li>
                </ul>
                
                <div class="note">
                    <p><strong>Important:</strong> Model downloads can be large (from hundreds of MB to several GB). Ensure you have sufficient disk space and a stable internet connection before starting a download.</p>
                </div>
            `,
                image: "models_downloading.png",
                imageAlt: "Downloading Models",
                imageCaption:
                    "The model download interface showing download progress and size selection",
            },
            {
                id: "models-managing",
                title: "Managing Local Models",
                content: `
                <p>After downloading models, you can manage them through the Local Models section of the Models tab.</p>
                
                <h4>Viewing Installed Models</h4>
                <p>The Local Models section shows all models currently installed on your system:</p>
                <ul>
                    <li>Models are listed in a dropdown selector</li>
                    <li>Select a model to access management options</li>
                    <li>The most recently downloaded model is automatically selected</li>
                </ul>
                
                <h4>Deleting Models</h4>
                <p>To remove models you no longer need:</p>
                <ol>
                    <li>Select the model from the Local Models dropdown</li>
                    <li>Click the "Delete" button</li>
                    <li>Confirm the deletion when prompted</li>
                    <li>Wait for the process to complete</li>
                </ol>
                <p>Deleting unused models helps free up disk space on your system.</p>
                
                <div class="note">
                    <p><strong>Note:</strong> If you delete a model that's currently being used in a conversation, you'll need to select a new model to continue chatting.</p>
                </div>
            `,
                image: "models_managing.png",
                imageAlt: "Managing Local Models",
                imageCaption:
                    "The local models section showing model management options",
            },
            {
                id: "models-configuration",
                title: "Configuring Model Parameters",
                content: `
                <p>Fine-tune how models respond by adjusting their parameters in the modelparameters.js file.</p>
                
                <h4>Parameter Configuration</h4>
                <p>Model parameters are now configured directly in the <code>modelparameters.js</code> file:</p>
                <ul>
                    <li>Open the <code>modelparameters.js</code> file in your code editor</li>
                    <li>Add your model to the <code>MODEL_PARAMETERS</code> object or modify existing entries</li>
                    <li>Save the file and restart the application to apply changes</li>
                </ul>
                
                <h4>Example for Adding a New Model</h4>
                <pre><code>// Add to MODEL_PARAMETERS object in modelparameters.js
'your-model-name': {
    temperature: 0.7,
    top_k: 50,
    top_p: 0.9,
    min_p: 0.05,
    repeat_penalty: 1.1
}</code></pre>
                
                <h4>Available Parameters</h4>
                <p>The following parameters can be adjusted for most models:</p>
                <ul>
                    <li><strong>Temperature</strong> (0.0-2.0) - Controls randomness in responses. Higher values produce more diverse, creative outputs, while lower values make responses more focused and deterministic.</li>
                    <li><strong>Top P</strong> (0.0-1.0) - Controls diversity by limiting token selection to a cumulative probability threshold. Lower values create more focused responses.</li>
                    <li><strong>Top K</strong> (1-100+) - Restricts token selection to the top K most likely tokens. Lower values create more predictable responses.</li>
                    <li><strong>Min P</strong> (0.0-1.0) - Sets a minimum probability threshold for token selection. Higher values force the model to be more decisive.</li>
                    <li><strong>Repeat Penalty</strong> (1.0-2.0) - Discourages repetition by penalizing previously used tokens. Higher values reduce repetition more aggressively.</li>
                </ul>
                
                <h4>Parameter Recommendations</h4>
                <p>Different tasks benefit from different parameter settings:</p>
                <ul>
                    <li><strong>Creative writing</strong> - Higher temperature (0.7-1.0), higher top_p (0.9)</li>
                    <li><strong>Factual responses</strong> - Lower temperature (0.1-0.3), low top_k (40)</li>
                    <li><strong>Code generation</strong> - Lower temperature (0.1-0.4), higher repeat_penalty (1.1)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Important:</strong> After modifying the modelparameters.js file, you need to restart the application for changes to take effect.</p>
                </div>
                `,
                image: "models_configuration.png",
                imageAlt: "Model Configuration Interface",
                imageCaption: "Example of the modelparameters.js file with custom configuration",
            },
            {
                id: "models-troubleshooting",
                title: "Troubleshooting Model Issues",
                content: `
                <p>If you encounter problems with models in Paiperwork, here are some common issues and solutions:</p>
                
                <h4>Model Fetch Failures</h4>
                <p>If you can't fetch models from the Ollama library:</p>
                <ul>
                    <li>Verify that Ollama is running on your system</li>
                    <li>Check your internet connection</li>
                    <li>Restart Ollama and try again</li>
                    <li>Ensure you're using a compatible Ollama version (currently:0.6.2)</li>
                </ul>
                
                <h4>Download Problems</h4>
                <p>If model downloads fail or stall:</p>
                <ul>
                    <li>Check your internet connection stability</li>
                    <li>Ensure you have enough disk space</li>
                    <li>Try canceling and restarting the download</li>
                    <li>Restart Ollama and try downloading again</li>
                    <li>Try downloading a smaller model size first</li>
                </ul>
                
                <h4>Model Performance Issues</h4>
                <p>If a model is running slowly or crashing:</p>
                <ul>
                    <li>Check your system resources (VRAM, RAM and CPU usage)</li>
                    <li>Try a smaller model or quantized version</li>
                    <li>Close other resource-intensive applications</li>
                    <li>Adjust context size in the Chat tab to a smaller value</li>
                </ul>
                
                <h4>Model Not Appearing in Chat</h4>
                <p>If a downloaded model isn't showing up in the model selection dropdown in Chat:</p>
                <ul>
                    <li>Verify the model download completed successfully</li>
                    <li>Refresh the Chat tab or restart the application</li>
                    <li>Check if the model requires specific features or configurations</li>
                </ul>
                
                <div class="note">
                    <p><strong>Note:</strong> If problems persist, check the Ollama documentation or look for Ollama logs on your system for more detailed error information.</p>
                </div>
            `,
            },
        ],
    },
};
window.helpContentLoaded = true;
console.log(
    "help-content.js loaded successfully, helpContent object created with sections:",
    Object.keys(helpContent)
);
