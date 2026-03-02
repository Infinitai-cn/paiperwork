
window.helpContent = {

    // Getting Started section
    gettingstarted: {
        title: "Start",
        intro:
            "Welcome to Paiperwork, a secure web interface for Ollama that prioritizes data privacy and ease of use. This professional-focused assistant offers productivity features while keeping your data local and protected.",
        articles: [
            {
                id: "gs-welcome",
                title: "Welcome Screen",
                content: `
            <p>** If you have a laptop or a computer without a powerful graphic card, always choose small size models for better performance (unless you have a machine with lots of ram and you know what you are doing)**</p>
            <p>** Please note that Paiperwork uses instructions for it's features, <b>Instruction Models are required</b> (do not use base models or text/chat models)**</p>
            <p>The welcome screen is your starting point for all interactions with Paiperwork.</p>
            <p>From here, you can:</p>
            <ul>
            <li>Start new conversations and use all app options with the AI by entering a Master Key (Different Master Keys will create separated Chats/settings/data inside the database)</li>
            <li>Access your conversation history by using previously entered Master Key</li>
            <li>Check for updates to the program</li>
            <li>Access the help documentation</li>
        </ul>
        
        <div class="note">
            <p><strong>Important:</strong> The Master Key you enter serves two critical purposes:</p>
            <ul>
                <li>It can create separated work environments (Using different Master Keys)</li>
                <li>It acts as your encryption key for storing conversation data securely (your data will be stored locally in your browser's storage in the form of a database). No data will ever be sent outside of your system with the exception of search prompts when the web button is activated for web searches or the Research function (sending a web search query to Microsoft's Bing search engine) or Ollama models query/download. No telemetry is collected. Please note that if you change your browser, there will be no previous database on it, so you will start fresh.</li>
            </ul>
            <p>To access a previous conversation, you must enter the <em>exact same Master Key</em> (case-sensitive) that you used when creating it.</p>
        </div>
        
        <div class="note">
            <p><strong>Language Compatibility:</strong> While Paiperwork's interface supports multiple languages, for optimal experience you should use AI models that are trained in your preferred language. If you're using a non-English interface language, consider using models that support your language for best results. When requesting information in features like Research or general chat, if you don;t get the reply/result in your language, you may need to specify your preferred response language in your prompt, for example: "Why do cats have white hair? (Provide this research in Spanish)" or "(Respond in French)" to ensure the AI responds in your desired language rather than defaulting to English.</p>
        </div>
        
         <div class="note">
          <p><strong>AI Response Language:</strong> Paiperwork now automatically enforces AI responses in your preferred language based on your selection from the language dropdown on the main page (index.html). The system automatically adds language enforcement instructions to ensure all AI responses match your chosen interface language. If you need responses in a different language for specific conversations, you can override this by adding "You always reply in [specific language]" to your System Prompt in the Chat tab. (Response language consistency will depend on the AI model quality)</p>
         </div>
        
        <div class="note">
            <p><strong>Low-End System Compatibility:</strong> Paiperwork has been tested and optimized for compatibility with smaller AI models (such as Qwen3.1 1.7B and Gemma3 4B) to ensure effective performance on low-end systems. These smaller models provide good results while requiring significantly less VRAM and system resources, making Paiperwork accessible to users with limited hardware capabilities.</p>
        </div>
        
        <div class="note">
            <p><strong>Translation Support:</strong> If you find any missing or incorrect translations in Paiperwork, please let us know at our <a href="https://github.com/discussions" target="_blank" rel="noopener noreferrer">GitHub Discussions</a>. Your feedback helps us improve the multilingual experience for all users.</p>
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
            
                <h4>Managing Conversations</h4>
                <p>At the top right of the welcome screen, you'll find the "Delete All information" button. Use this with caution, as it will permanently remove ALL your saved conversations and data.</p>
            `,
                image: "clickstart.png",
                imageAlt: "Starting a new conversation",
                imageCaption:
                    "Enter your Master key and click Start to begin a new chat session",
            },
            {
                id: "gs-password-protection",
                title: "Protection Password Feature",
                content: `
                <p>Paiperwork includes an optional protection password feature that adds an extra layer of security against accidental data deletion for your stored databases.</p>
                
                <h4>What is the Protection Password?</h4>
                <p>The protection password is a security feature that:</p>
                <ul>
                    <li>Prevents accidental deletion of all your data and conversations</li>
                    <li>Requires password verification before performing the "Delete All Information" action</li>
                    <li>Is completely optional - you can choose whether to set one up (only required to delete all information from the database)</li>
                    <li>Is stored securely using encryption with salt-based hashing</li>
                </ul>
                
                <h4>Setting Up Protection Password</h4>
                <p>When you first try to delete all information:</p>
                <ol>
                    <li>Click the "Delete All Information" button on the welcome screen</li>
                    <li>If no protection password exists, you'll be prompted to set one up</li>
                    <li>Choose whether to set up a protection password or skip this feature (just close this window)</li>
                    <li>If you choose to set up: enter a password (minimum 6 characters) and confirm it</li>
                    <li>The password will be securely encrypted and stored locally</li>
                </ol>
                
                <h4>Using Protection Password</h4>
                <p>Once a protection password is set:</p>
                <ul>
                    <li>Any attempt to delete all information will require password verification</li>
                    <li>Enter your protection password in the verification dialog</li>
                    <li>Only with the correct password can you proceed with deletion</li>
                    <li>The password verification includes a "Reset Password" option if you need to change it</li>
                </ul>
                
                <h4>Resetting Your Protection Password</h4>
                <p>If you need to change your protection password:</p>
                <ol>
                    <li>Attempt to delete all information to bring up the password verification dialog</li>
                    <li>Enter your current password in the input field</li>
                    <li>Click the "Reset Password" button</li>
                    <li>If your current password is correct, you'll be guided through setting a new password</li>
                </ol>
                
                <h4>Security Details</h4>
                <ul>
                    <li><strong>Encryption</strong> - Passwords are hashed using SHA-256 with unique salts</li>
                    <li><strong>Local Storage</strong> - Protection passwords are stored only on your device</li>
                    <li><strong>No Recovery</strong> - If you forget your protection password, you cannot recover it</li>
                    <li><strong>Optional Feature</strong> - You can skip setting up a protection password if preferred (only required to delete all information from the database)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Important:</strong> The protection password is designed to prevent accidental deletion. If you forget your protection password, there is no recovery method (you will need to delete your browser's local storage for localhost to start clean, losing all your stored information for Paiperwork). Choose a password you'll remember but that's different from easily guessed options.</p>
                </div>
            `,
                image: "protection_password.png",
                imageAlt: "Protection Password Setup",
                imageCaption: "The protection password setup dialog for securing data deletion",
            },
        ],
    },

    // Chat Features section
    chat: {
        title: "Chat",
        intro:
            "The chat interface provides powerful AI conversation capabilities with several advanced features to enhance your interactions.",
        articles: [
            {
                id: "chat-basics",
                title: "Chat Basics",
                content: `
                <p>The chat interface is where your conversations with the AI take place. It's designed to be intuitive yet powerful, with several key features that help you get the most from your interactions.</p>
                <div class="note">
                    <p><strong>Important:</strong> We update the AI system prompt with the current date for date context purposes. AI models may get confused about current events as their knowledge cutoff is very probably earlier than the current date. It is suggested to use web search when asking for current events.</p>
                </div>
                <h4>Core Chat Elements</h4>
                <ul>
                    <li><strong>Message Area</strong> - Where your conversation history appears, with user messages on the right and AI responses on the left</li>
                    <li><strong>Input Field</strong> - Type your messages here and press Enter or click Send to submit</li>
                    <li><strong>Send Button</strong> - Submits your message and transforms into a Cancel button during AI response generation</li>
                    <li><strong>Model Selector</strong> - Choose different AI models depending on your task requirements</li>
                    <li><strong>Master Key Display</strong> - Shows your current Master Key (masked for security). Click to reveal the actual key temporarily, which helps refresh your memory of which encryption key you're currently using</li>
                </ul>
                
                <h4>Master Key Display Feature</h4>
                <p>The Master Key display in the chat interface helps you keep track of your current encryption key:</p>
                <ul>
                    <li><strong>Security Display</strong> - By default, the Master Key is shown as dots (••••••••••••) to protect your privacy</li>
                    <li><strong>Click to Reveal</strong> - Click on the Master Key display to temporarily show the actual key text</li>
                    <li><strong>Auto-Hide</strong> - The key automatically hides again after 3 seconds for security</li>
                    <li><strong>Memory Aid</strong> - Useful for confirming which Master Key you're currently using, especially when working with multiple projects</li>
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
                    <p><strong>Tip:</strong> To keep your conversations organized, try using different Master keys for different subjects or projects. Use the Master Key display feature to confirm you're in the right context before starting important conversations.</p>
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
                        alt: "Encrypted database for chats and data",
                        caption: "Encrypted database for chats and data"
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
                    <li><strong>Selective Analysis</strong> - Only messages that contain personal preferences are analyzed</li>
                    <li><strong>Non-Identifying</strong> - The system focuses on general traits rather than specific personal details</li>
                    <li><strong>Processing Time</strong> - If you use a reasoning model, insights will take significantly more time to be generated as the model will reason for some time before creating the insight</li>
                </ul>
                
                <h4>Managing Insights</h4>
                <p>You have complete control over the Insights feature:</p>
                
                <h5>Enabling or Disabling Insights Collection</h5>
                <ol>
                    <li>Click on the "Chat" tab in the chat interface</li>
                    <li>Find the "Insights" toggle switch (at the top)</li>
                    <li>Switch it on or off to disable</li>
                </ol>
                <p>When disabled, no new insights will be collected from your future messages. Previously stored insights remain in the database and will still be loaded and used to enhance the AI's understanding of you.</p>
                
                <h5>Viewing and Managing Stored Insights</h5>
                <p>You can view, edit, and delete stored insights:</p>
                <ol>
                    <li>Find the small "e" button to the left of the Insights toggle</li>
                    <li>Click this button to open the Insights Editor</li>
                    <li>In the editor window, you can:</li>
                    <ul>
                        <li><strong>View</strong> - See all insights the system has collected about you</li>
                        <li><strong>Edit</strong> - Modify any existing insight that's inaccurate or needs updating</li>
                        <li><strong>Delete</strong> - Remove specific insights you don't want the AI to use</li>
                        <li><strong>Add</strong> - Create new insights manually to guide the AI's understanding</li>
                    </ul>
                    <li>Click "Save Changes" to apply your modifications</li>
                </ol>
                <p>After saving changes, the system prompt will be automatically rebuilt to incorporate your updated preferences.</p>
                
                <h4>How Insights Are Always Available</h4>
                <p>Insights work differently from the collection toggle:</p>
                <ul>
                    <li><strong>Always Loaded</strong> - When you start a conversation, all stored insights are automatically loaded from the database</li>
                    <li><strong>Continuous Enhancement</strong> - Your insights enhance every conversation, helping the AI understand your preferences</li>
                    <li><strong>Toggle Controls Collection Only</strong> - The toggle only controls whether new insights are created from future messages</li>
                    <li><strong>Manual Management</strong> - Use the "e" button to manage existing insights regardless of toggle state</li>
                </ul>
                
                <h4>What Gets Analyzed</h4>
                <p>The system selectively analyzes messages that contain:</p>
                <ul>
                    <li>Self-references (phrases starting with "I" like "I prefer..." or "I enjoy...")</li>
                    <li>Longer, more detailed messages (typically 5+ words)</li>
                    <li>Messages containing personal preferences or opinions</li>
                </ul>
                
                <div class="note">
                    <p><strong>Privacy Note:</strong> All insights are encrypted with your Master Key and stored locally on your device. They are only accessible when you enter the exact same Master key that was used to encrypt them. Insights are always loaded when available to enhance your conversations, but you can delete them individually using the insights editor if you no longer want them used.</p>
                </div>
                `,
                images: [
                    {
                        src: "insights_feature.png",
                        alt: "Insights Feature Toggle",
                        caption: "The Insights toggle in the Settings tab of the chat interface"
                    },
                    {
                        src: "insights_editor.png",
                        alt: "Insights Editor",
                        caption: "The Insights Editor interface for managing stored insights"
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
                         <li><strong>Resource Conservation</strong> - Initially capped at 8K to prevent excessive resource usage, but can be manually increased</li>
                         <li><strong>Manual Adjustment</strong> - Select your desired context size from the dropdown menu (from 1K to 10M tokens) to override the automatic setting</li>
                         <li><strong>Persistent Settings</strong> - Your context size preference is remembered across sessions for each model</li>
                     </ul>
                     
                     <h5>How Context Size Affects Memory Usage</h5>
                     <p>Context size has a direct impact on RAM and VRAM (graphics card memory) requirements:</p>
                     <ul>
                         <li><strong>Memory calculation</strong> - For each token in your context window, the model needs to allocate memory for attention calculations</li>
                         <li><strong>Scaling relationship</strong> - Memory usage scales quadratically with context size, not linearly (doubling context size can quadruple memory requirements)</li>
                         <li><strong>Combined factors</strong> - Total memory usage depends on both model size (parameters) and context length</li>
                     </ul>
                     
                     <h5>Manual Context Size Guidelines</h5>
                     <p>As a general guideline for memory requirements:</p>
                     <ul>
                         <li><strong>4K context</strong> - Requires approximately 1GB of VRAM/RAM</li>
                         <li><strong>8K context</strong> - Requires approximately 2GB of VRAM/RAM</li>
                         <li><strong>16K context</strong> - Requires approximately 4GB of VRAM/RAM</li>
                         <li><strong>32K context</strong> - Requires approximately 8GB of VRAM/RAM</li>
                         <li><strong>64K context</strong> - Requires approximately 16GB of VRAM/RAM</li>
                         <li><strong>128K+ context</strong> - Requires 32GB+ VRAM/RAM for high-end systems</li>
                     </ul>
                     
                     <p>When you increase context size, watch for these signs of memory pressure:</p>
                     <ul>
                         <li>The model reply is nonsensical or the model dumps the system prompt in the reply (lower the context to a small size setting first to verify the reply is correct, then increase with caution)</li>
                         <li>Slower response generation</li>
                         <li>System becoming less responsive</li>
                         <li>Ollama errors related to out-of-memory conditions</li>
                         <li>Context percentage indicator turning orange or red</li>
                     </ul>
                     
                     <div class="note">
                         <p><strong>Tip:</strong>If you experience memory issues, always try a conservative setting first.</p>
                     </div>
                     
                     <h4>Native Thinking Models (Ollama 0.9.0+)</h4>
                     <p>Paiperwork supports Ollama's native thinking functionality for compatible reasoning models, which allows AI models to show their step-by-step reasoning process:</p>
                     
                     <h5>System Requirements</h5>
                     <ul>
                         <li><strong>Ollama Version</strong> - Requires Ollama 0.9.0 or higher for native thinking support</li>
                         <li><strong>Compatible Models</strong> - Works with thinking-enabled models like DeepSeek-R1 and qwen3 reasoning models (more to come in future versions)</li>
                         <li><strong>Automatic Detection</strong> - Paiperwork automatically detects your Ollama version and model compatibility</li>
                     </ul>
                     
                     <h5>Thinking Toggle Button</h5>
                     <p>When you select a compatible thinking model with Ollama 0.9.0+, a thinking toggle button automatically appears:</p>
                     <ul>
                         <li><strong>Automatic Appearance</strong> - The button only shows when both Ollama version and model support thinking</li>
                         <li><strong>Toggle Control</strong> - Click to enable or disable the model's thinking process display</li>
                         <li><strong>Visual Indicator</strong> - The button shows an active state when thinking is enabled</li>
                         <li><strong>Persistent Setting</strong> - Your thinking preference is remembered across sessions</li>
                     </ul>
                     
                     <h5>How Native Thinking Works</h5>
                     <ul>
                         <li><strong>Thinking Display</strong> - When enabled, you'll see the model's internal reasoning process in a separate thinking section</li>
                         <li><strong>Real-time Processing</strong> - Watch the AI work through problems step-by-step as it generates responses</li>
                         <li><strong>Collapsible Sections</strong> - Thinking content can be collapsed to focus on the final answer</li>
                         <li><strong>Performance Impact</strong> - Thinking mode typically takes longer as the model processes more thoroughly</li>
                     </ul>
                     
                     <h5>Non-Ollama Thinking Models</h5>
                     <p>Paiperwork also supports reasoning models that have built-in thinking capabilities but don't use Ollama's native thinking API:</p>
                     <ul>
                         <li><strong>No Toggle Button</strong> - These models won't show the thinking toggle as they handle reasoning internally, but will display the thinking container</li>
                         <li><strong>Built-in Reasoning</strong> - Models like Reflection may show reasoning as part of their normal response</li>
                         <li><strong>System prompt modification</strong> - Models like Cogito require a special command in the system prompt: Enable deep thinking subroutine, others may need this command (/think, /no_think) in the System prompt or the user prompt</li>
                     </ul>
                     
                     <h5>Using Thinking Models Effectively</h5>
                     <ul>
                         <li><strong>Complex Problems</strong> - Best suited for multi-step reasoning, math problems, or complex analysis</li>
                         <li><strong>Debugging Code</strong> - Excellent for understanding how the AI approaches code problems</li>
                         <li><strong>Learning Tool</strong> - Watch how the AI breaks down complex topics for educational purposes</li>
                         <li><strong>Quality vs Speed</strong> - Enable thinking for higher quality responses; disable for faster, direct answers</li>
                     </ul>
                     
                     <div class="note">
                         <p><strong>Important:</strong> If you don't see the thinking toggle button, check that you're using Ollama 0.9.0 or higher and have selected a compatible thinking model. Some older reasoning models may not support the native thinking API but can still provide reasoning as part of their normal response generation.</p>
                     </div>
                     
                     <h4>Image Upload (Visual Models)</h4>
                     <p>When using visual AI models like Mistral small 3.1 or Gemma3, you can upload images to discuss:</p>
                     <ul>
                         <li>Click the image button next to the input field</li>
                         <li>Select an image from your device or drag and drop into the upload area</li>
                         <li>For Gemma3 models, you can upload multiple images at once (3 max)</li>
                         <li>Make transcriptions (OCR), ask questions or get descriptions based on the uploaded images</li>
                     </ul>
                     
                     <h4>Web Search Integration</h4>
                     <p>Enable real-time web search to help the AI provide up-to-date information:</p>
                     <ul>
                         <li>Click the Web button to toggle web search capability</li>
                         <li>When enabled, the AI can search the internet for current information</li>
                         <li>This is especially useful for questions about recent events or specific facts</li>
                         <li>Web search only send the search prompt to the web (Bing.com) for queries, no personal data, statistics or metrics is ever sent</li>
                     </ul>
                     
                     <h4>Image + Web Search (Advanced Feature)</h4>
                     <p>Combine image analysis with web search for powerful visual research capabilities:</p>
                     <h5>How It Works</h5>
                     <ol>
                         <li><strong>Upload an Image</strong> - Add an image using the image upload button</li>
                         <li><strong>Enable Web Search</strong> - Make sure the Web button is activated (Orange)</li>
                         <li><strong>Ask Your Question</strong> - Describe what you want to find about or similar to your image</li>
                         <li><strong>AI Analysis</strong> - The AI first analyzes your image to generate search terms</li>
                         <li><strong>Web Search</strong> - The system searches the web using AI-generated keywords</li>
                         <li><strong>Combined Response</strong> - You receive both visual analysis and web search results</li>
                     </ol>
                     
                     <h5>Perfect for:</h5>
                     <ul>
                         <li>Finding similar images or products online</li>
                         <li>Researching architectural styles, artwork, or designs</li>
                         <li>Identifying plants, animals, or objects with additional context</li>
                         <li>Getting market information about products you photograph</li>
                         <li>Finding historical or cultural context for images</li>
                         <li>Reverse image searching with AI enhancement</li>
                     </ul>
                     
                     <h5>Requirements:</h5>
                     <ul>
                         <li>Visual AI model selected (Qwen2.5vl, Mistral-small3.1, Gemma3, LLaVA, etc.)</li>
                         <li>Web search enabled (Web button active)</li>
                         <li>Clear, high-quality image uploaded (size: 5mb max)</li>
                         <li>Internet connection for web search functionality</li>
                     </ul>
                     
                     <h5>Example Usage:</h5>
                     <p class="example-prompt"><strong>Sample Prompt:</strong> "Find images and information about furniture similar to this chair. I'm looking for mid-century modern pieces with similar design elements and want to know about pricing and where to buy them."</p>
                     <p>This would result in:</p>
                     <ol>
                         <li>AI analyzing the chair's style, materials, and design features</li>
                         <li>Web search for "mid-century modern chair wooden legs upholstered seat design furniture"</li>
                         <li>Combined response with visual analysis + similar products + pricing + retailers</li>
                     </ol>
                     
                     <div class="note">
                         <p><strong>Pro Tip:</strong> Be specific about what you want to find. Instead of just "find similar images," try "find similar vintage posters from the 1950s with pricing information" or "identify this plant species and find care instructions."</p>
                     </div>
                     
                    <h4>Export Conversations</h4>
                     <p>You can export your entire conversation history in different formats:</p>
                     <ul>
                         <li>Navigate to the Chat tab and scroll to the bottom of the interface</li>
                         <li>Click the "Export Conversation" button located just above the "Clear Current Session" button</li>
                         <li>Choose from plain text (.txt), markdown (.md), or HTML (.html) formats</li>
                         <li>Downloaded files include all messages and preserve code formatting</li>
                     </ul>
                 `,
                images: [
                    {
                        src: "chat_advanced_features.png",
                        alt: "Context size calculator",
                        caption: "The context calculator interface"
                    },
                    {
                        src: "chat_export.png",
                        alt: "Chat export ",
                        caption: "Chat export features"
                    },
                    {
                        src: "thinking_toggle_button.png",
                        alt: "Native Thinking Toggle",
                        caption: "The thinking toggle button that appears with compatible models and Ollama 0.9.0+"
                    }
                ]
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
        title: "Documents",
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
                id: "docs-model-compatibility",
                title: "Model Compatibility for Documents",
                content: `
                <p>The Documents feature requires AI models that support embeddings to function properly. Understanding model compatibility will help you avoid issues and optimize your document workflow.</p>
                
                <h4>Models and Embedding Support</h4>
                <p>For the document processing and search functionality to work, you need models that support generating embeddings:</p>
                <ul>
                  <li><strong>Compatible models</strong> include: nomic-embed-text, llama3 (various sizes), mistral, mixtral, and other models specifically designed to support embeddings (Deepseek, Qwen, etc)</li>
                  <li><strong>Incompatible models</strong>: Some models don't support embeddings and will trigger a warning notification if you attempt to use them with the Documents feature</li>
                  <li><strong>Visual models</strong>: Visual models sometimes get the embeddings processing removed from their code</li>
                </ul>
                
                <h4>Embedding Warning System</h4>
                <p>When you try to use a model that doesn't support embeddings for document operations, the system will:</p>
                <ul>
                  <li>Display a prominent warning notification</li>
                  <li>Explain that the selected model is incompatible with document search functionality</li>
                  <li>Suggest alternative models that support embeddings</li>
                  <li>Provide a link to find embedding-capable models</li>
                </ul>
                <p>The warning notification will automatically dismiss after 30 seconds or you can close it manually by clicking the "I Understand" button.</p>
                
                <h4>Workflow Optimization</h4>
                <p>You can optimize your document workflow by understanding when embeddings are created and used:</p>
                <ul>
                  <li><strong>Initial document processing</strong>: Embeddings are created when you first upload and process documents</li>
                  <li><strong>Subsequent document queries</strong>: After documents are processed, you can switch to a different model (with embeddings support) for querying without needing to regenerate embeddings</li>
                </ul>
                
                <h4>Using Different Models for Different Tasks</h4>
                <p>A useful workflow strategy:</p>
                <ol>
                  <li>Select a smaller embedding-capable model (like nomic-embed-text) when uploading and processing documents</li>
                  <li>After documents are processed, you can switch to a more powerful model (with embeddings support) for better question answering</li>
                  <li>The system will use the stored embeddings from the original processing regardless of which model you currently have selected</li>
                </ol>
                
                <div class="note">
                  <p><strong>Pro Tip:</strong> For optimal results, use dedicated embedding models like nomic-embed-text for initial document processing, then switch to larger language models like llama3:70b, Gemma3, Qwen3, etc, for more sophisticated document queries and analysis.</p>
                </div>
              `,
                image: "model-embedding-warning.png",
                imageAlt: "Model Embedding Warning",
                imageCaption: "Warning notification when attempting to use a model that doesn't support embeddings"
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
                
                <h4>Context Size Requirements</h4>
                <p>The bigger the document summary, the more context you need in your AI model. As a general guideline:</p>
                <ul>
                    <li><strong>Small documents</strong> (under 5,000 words) - 4K context size is usually sufficient</li>
                    <li><strong>Medium documents</strong> (5,000-15,000 words) - 8K context size recommended</li>
                    <li><strong>Large documents</strong> (15,000-50,000 words) - 16K context size or larger</li>
                    <li><strong>Very large documents</strong> (50,000+ words) - 32K context size or larger</li>
                </ul>
                <p>For context, a typical single-spaced page contains approximately 500 words, so a 20-page PDF would need at least 8K context for effective summarization.</p>
                
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
            {
                id: "docs-memory-limits",
                title: "Memory Limitations and Best Practices",
                content: `
                <p>When working with documents in Paiperwork, it's important to understand how memory usage affects performance, especially when using global document search.</p>
                
                <h4>Memory Considerations with Global Search</h4>
                <p>Global document search (searching across all documents simultaneously) can be memory-intensive because:</p>
                <ul>
                    <li>All relevant document chunks must be loaded into memory at once</li>
                    <li>The AI model needs to process these chunks alongside your query</li>
                    <li>Web browsers have limited memory allocation compared to desktop applications</li>
                    <li>As document count and size increase, memory requirements grow exponentially</li>
                </ul>
                
                <h4>Signs of Memory Pressure</h4>
                <p>Watch for these indicators that you're approaching memory limits:</p>
                <ul>
                    <li>Browser becoming sluggish or unresponsive</li>
                    <li>Long delays when switching between tabs</li>
                    <li>Error messages about "out of memory" or similar warnings</li>
                    <li>Browser tab crashes or freezes</li>
                    <li>Unexpectedly terminated AI responses</li>
                </ul>
                
                <h4>Best Practices for Document Management</h4>
                <p>To avoid memory issues while working with documents:</p>
                <ul>
                    <li><strong>Use Document-Specific Mode</strong> - When working with large documents, select a specific document and use "Ask Questions" to enter document mode instead of global search</li>
                    <li><strong>Limit Global Search Usage</strong> - Reserve global search for scenarios with smaller document collections or when you specifically need to find information across multiple documents</li>
                    <li><strong>Organize Documents Strategically</strong> - Group related documents so you can work with targeted subsets rather than your entire library</li>
                    <li><strong>Close Other Applications</strong> - When working with large documents, close other memory-intensive applications and browser tabs</li>
                    <li><strong>Restart Occasionally</strong> - For extended document work sessions, restart your browser periodically to clear memory</li>
                </ul>
                
                <h4>Document Size Recommendations</h4>
                <p>As a general guideline for global search:</p>
                <ul>
                    <li><strong>Safe usage</strong>: 5-10 small to medium documents (under 20 pages each)</li>
                    <li><strong>Caution needed</strong>: 10-20 documents or several larger documents (20-50 pages)</li>
                    <li><strong>Not recommended</strong>: 20+ documents or multiple large documents (50+ pages)</li>
                </ul>
                
                <div class="note">
                    <p><strong>Important:</strong> Global document search is designed for convenient access across a moderate collection of documents. For intensive research involving large documents or extensive collections, use document-specific questioning mode instead. This focuses memory resources on a single document at a time, providing better performance and stability.</p>
                </div>
            `,
            }
        ],
    },

    // Dataviz Tab section
    dataviz: {
        title: "DataViz",
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
        title: "Paperwork",
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
                    <li><strong>Direct translations</strong> - Prepend "Translate to (language):" at the start of the text and click Enhance with Ai</li>
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
                    <li><strong>Text Export</strong> - Copy the text with it's formatting ready to be pasted in any text processor</li>
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
        title: "Research",
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
                    <p><strong>Important:</strong> The Research tab uses the model currently selected in the Chat tab. Make sure to select an appropriate model in the Chat tab before using the Research features. For research tasks, non-reasoning models (like Mistral3, Qwen2.5 or LLaMA) perform best.</p>
                    <p><strong>Performance Note:</strong> Using reasoning AI models (like Cogito, Qwen3 or Deepseek R1) will significantly increase research time as these models perform detailed thinking at each step of the process. For faster research results, prefer standard instruction models that process information more directly.</p>
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
                    <li>Make sure you've selected an appropriate model in the Chat tab (the Research tab uses your Chat tab model)</li>
                    <li>Enter your research question in the input field</li>
                    <li>Choose a report size (detailed below)</li>
                    <li>Configure Deep Search options if needed (detailed below)</li>
                    <li>Click the "Research" button to begin the research process</li>
                </ol>
                
                <h4>Report Size Options</h4>
                <p>Select the appropriate report size based on your needs and available system resources:</p>
                <ul>
                    <li><strong>Concise</strong> - Brief 500-800 word summary with core facts
                        <br><em>Recommended context: 8K-16K (2-4GB VRAM/RAM)</em></li>
                    <li><strong>Standard</strong> - Balanced 1000-1500 word report with key details
                        <br><em>Recommended context: 16K-32K (4-8GB VRAM/RAM)</em></li>
                    <li><strong>Detailed</strong> - Comprehensive 2000-3000 word analysis
                        <br><em>Recommended context: 32K-64K (8-16GB VRAM/RAM)</em></li>
                    <li><strong>Comprehensive</strong> - In-depth 4000-5000 word examination
                        <br><em>Recommended context: 64K-128K (16-32GB VRAM/RAM)</em></li>
                    <li><strong>Extensive</strong> - Thorough 6000+ word exploration with maximum detail
                        <br><em>Recommended context: 128K+ (32GB+ VRAM/RAM for high-end systems)</em></li>
                </ul>
                
                <div class="note">
                    <p><strong>Context Requirements Explained:</strong> The Research Assistant processes information in multiple stages - first summarizing individual sources, then generating partial reports in batches, and finally combining everything into the final report. Larger reports require more context to maintain coherence across all sources and ensure comprehensive analysis. If you experience memory issues or incomplete reports, try reducing the report size or increasing your context size in the Chat tab.</p>
                </div>
                
                <h4>Optimizing Research Performance</h4>
                <p>For best research results:</p>
                <ul>
                    <li><strong>Match report size to your system</strong> - Use the context calculator in the Chat tab to determine optimal settings</li>
                    <li><strong>Monitor memory usage</strong> - Watch for signs of memory pressure like incomplete reports or system slowdowns</li>
                    <li><strong>Consider Deep Search impact</strong> - Deep Search with multiple levels significantly increases the amount of content to process</li>
                    <li><strong>Use appropriate models</strong> - Non-reasoning models (Mistral, Qwen2.5, LLaMA) process research faster than reasoning models</li>
                </ul>
                
                <h4>Deep Search Configuration</h4>
                <p>The Deep Search feature provides enhanced research capabilities with granular control:</p>
                <ul>
                    <li><strong>Enable/Disable Toggle</strong> - Turn Deep Search on or off for your research session</li>
                    <li><strong>Search Depth</strong> - Choose from 1-3 levels of link following:
                        <ul>
                            <li>Level 1: Follow immediate links from search results</li>
                            <li>Level 2: Follow links from the first level of discovered pages</li>
                            <li>Level 3: Maximum depth exploration for comprehensive coverage</li>
                        </ul>
                    </li>
                    <li><strong>Links Per Page</strong> - Select 1-5 links to follow from each discovered page</li>
                    <li><strong>Enhanced PDF Processing</strong> - When enabled, Deep Search automatically detects and processes PDF documents with enhanced extraction capabilities</li>
                </ul>
                <p>Hover over the Deep Search options to see detailed tooltips explaining each setting's impact on research thoroughness and processing time.</p>
                
                <h4>Research Process with Floating Window</h4>
                <p>When you initiate research, the system displays a floating progress window that shows:</p>
                <ol>
                    <li><strong>Query Generation</strong> - Creates optimized search queries based on your research question</li>
                    <li><strong>Web Search</strong> - Searches the web using multiple targeted queries</li>
                    <li><strong>Content Analysis</strong> - Analyzes and extracts key information from search results</li>
                    <li><strong>PDF Detection & Processing</strong> - Automatically identifies PDF documents and processes them with enhanced extraction</li>
                    <li><strong>Deep Search Execution</strong> - If enabled, follows links at your specified depth and quantity</li>
                    <li><strong>Report Generation</strong> - Synthesizes all gathered information into your selected report size</li>
                </ol>
                
                <p>The floating progress window provides real-time updates and allows you to:</p>
                <ul>
                    <li>Monitor current research phase and progress</li>
                    <li>Cancel the research process at any time</li>
                    <li>See estimated completion time</li>
                    <li>Track the number of sources being processed</li>
                </ul>
                
                <h4>Enhanced PDF Handling</h4>
                <p>The Research Assistant includes advanced PDF processing capabilities:</p>
                <ul>
                    <li><strong>Automatic Detection</strong> - Identifies PDF documents in search results using multiple patterns (file extensions, URL patterns, academic sources)</li>
                    <li><strong>Enhanced Extraction</strong> - Uses specialized extraction methods for academic papers and technical documents</li>
                    <li><strong>Content Integration</strong> - Seamlessly incorporates PDF content into the research synthesis</li>
                    <li><strong>Source Attribution</strong> - Maintains clear citations to original PDF sources</li>
                </ul>
                
                <div class="note">
                    <p><strong>Performance Note:</strong> Deep Search with higher depth levels and more links per page provides more comprehensive results but increases research time. PDF processing adds additional time but significantly enhances research quality for academic and technical topics.</p>
                </div>
                `,
            },

            // Update the research-results article with editing capabilities and export formats
            {
                id: "research-results",
                title: "Working with Research Results",
                content: `
                <p>After your research is complete, the system generates a comprehensive research report in an editable floating window.</p>
                
                <h4>Research Results Window Features</h4>
                <p>The research results appear in a floating window that provides:</p>
                <ul>
                    <li><strong>Full Editability</strong> - Click anywhere in the content area to edit the research report directly</li>
                    <li><strong>Real-time Editing</strong> - Make changes to content, add your own notes, or reorganize sections</li>
                    <li><strong>Source Link Management</strong> - Edit, update, or remove source citations as needed</li>
                    <li><strong>Maximizable Interface</strong> - Expand the window for full-screen editing and review</li>
                    <li><strong>Drag and Reposition</strong> - Move the window to your preferred screen position</li>
                </ul>
                
                <h4>Research Report Structure</h4>
                <p>The research report is structured for clarity and comprehensiveness:</p>
                <ul>
                    <li><strong>Executive Summary</strong> - Key findings and main conclusions</li>
                    <li><strong>Detailed Analysis</strong> - Comprehensive examination organized by subtopics</li>
                    <li><strong>Supporting Evidence</strong> - Relevant data, quotes, and examples from sources</li>
                    <li><strong>Conclusion</strong> - Synthesized insights and implications</li>
                    <li><strong>Source References</strong> - Complete citations with clickable links to original content</li>
                </ul>
                
                <h4>Editing Research Content</h4>
                <p>The research results are fully editable, allowing you to:</p>
                <ul>
                    <li>Add your own analysis and commentary</li>
                    <li>Reorganize sections for better flow</li>
                    <li>Highlight key findings that matter to your specific needs</li>
                    <li>Remove irrelevant information</li>
                    <li>Update or correct source information</li>
                    <li>Add additional context or explanations</li>
                </ul>
                
                <h4>Export Options</h4>
                <p>The research results can be exported in multiple formats through the integrated export utility:</p>
                <ul>
                    <li><strong>Plain Text (.txt)</strong> - Clean text format with markdown formatting stripped for universal compatibility</li>
                    <li><strong>Markdown (.md)</strong> - Preserves formatting, structure, headers, and links in markdown syntax</li>
                    <li><strong>HTML (.html)</strong> - Full formatting with proper styling, converted markdown elements, and clickable links</li>
                </ul>
                
                <h4>Saving to Knowledge Base</h4>
                <p>When saving research to your Knowledge Base, you have enhanced options:</p>
                <ul>
                    <li><strong>Collection Selection</strong> - Choose an existing collection or create a new one during the save process</li>
                    <li><strong>Save Sources Separately</strong> - Option to save source references as separate entries in your knowledge base</li>
                    <li><strong>Content Customization</strong> - Save your edited version including any modifications you made</li>
                    <li><strong>Metadata Preservation</strong> - Maintains research date, query, and parameters for future reference</li>
                </ul>
                
                <h4>Window Management</h4>
                <p>The floating results window provides:</p>
                <ul>
                    <li><strong>Resizable Interface</strong> - Drag corners to resize for optimal viewing</li>
                    <li><strong>Minimize/Maximize</strong> - Temporarily hide or expand to full screen</li>
                    <li><strong>Stay on Top</strong> - Option to keep results visible while working in other areas</li>
                    <li><strong>Multiple Window Support</strong> - Keep previous research results open while starting new research</li>
                </ul>
                
                <div class="note">
                    <p><strong>Pro Tip:</strong> Take advantage of the editing capabilities to customize research reports for your specific needs. You can add personal insights, reorganize content, and create a personalized knowledge resource before saving to your Knowledge Base.</p>
                </div>
                `,
                image: "research_results_editable.png",
                imageAlt: "Editable Research Results Window",
                imageCaption: "The floating research results window showing editing capabilities and export options"
            },

            {
                id: "knowledge-base-intro",
                title: "Knowledge Base Overview",
                content: `
                <p>The Knowledge Base allows you to store, organize, and manually browse through collections of information that you want to keep for future reference.</p>
                
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
                
                <h4>Storage and Organization</h4>
                <p>The Knowledge Base serves as a simple but effective storage system:</p>
                <ul>
                    <li><strong>Manual Organization</strong> - Browse through your collections to find stored information</li>
                    <li><strong>Research Storage</strong> - Perfect for storing completed research reports from the Research Assistant</li>
                    <li><strong>Personal Notes</strong> - Store your own notes, ideas, and information</li>
                    <li><strong>No Search Required</strong> - Simple browsing through organized collections</li>
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
                id: "knowledge-browse",
                title: "Browsing Your Knowledge Base",
                content: `
                <p>The Knowledge Base provides a simple way to browse and organize your stored information through collections and entries.</p>
                
                <h4>Navigating Collections</h4>
                <ol>
                    <li>From the Knowledge Base main view, you'll see all your collections listed</li>
                    <li>Click "View" on any collection to see its contents</li>
                    <li>Browse through the entries within each collection</li>
                    <li>Click on individual entries to read their full content</li>
                </ol>
                
                <h4>Finding Information</h4>
                <p>To locate specific information in your Knowledge Base:</p>
                <ul>
                    <li><strong>Browse by Collection</strong> - Check collections related to your topic</li>
                    <li><strong>Descriptive Naming</strong> - Use clear, descriptive names for collections and entries</li>
                    <li><strong>Logical Organization</strong> - Group related information in the same collection</li>
                    <li><strong>Manual Review</strong> - Browse through entries to find what you need</li>
                </ul>
                
                <h4>Organization Tips</h4>
                <p>For effective knowledge management:</p>
                <ul>
                    <li>Create collections for different projects, subjects, or time periods</li>
                    <li>Use clear, descriptive titles for both collections and entries</li>
                    <li>Consider date-based organization for research reports</li>
                    <li>Keep related information together in the same collection</li>
                </ul>
                
                <div class="note">
                    <p><strong>Tip:</strong> Good organization upfront makes it much easier to find information later. Consider your naming conventions and collection structure before adding many entries.</p>
                </div>
                `,
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
        title: "Artworks",
        intro:
            "The Artworks tab allows you to use AI vision models to analyze design choices, generate website prototypes based on visual designs, and create text overlays for images.",
        articles: [
            {
                id: "artworks-getting-started",
                title: "Getting Started with Visual Design Studio",
                content: `
                    <div class="note">
                        <p><strong>Initial Release:</strong> Artworks tab is a new feature in its initial release. We're excited to share this innovative AI-powered design tool with you and would love to hear your feedback and ideas for future additions and improvements. Your suggestions help us make Paiperwork better for everyone!</p>
                    </div>
                    
                    <p>Artworks tab provides AI-powered tools to transform images into functional web designs and analyze visual compositions.</p>
                    
                    <h4>Requirements and Setup</h4>
                    <ul>
                        <li><strong>Visual AI Model Required</strong> - You need a vision-capable model installed in Ollama (LLaVA, Gemma3, Phi3-Vision, etc.)</li>
                        <li><strong>Model Selection</strong> - Choose your visual model from the dropdown at the top of the tab</li>
                        <li><strong>Image Requirements</strong> - Upload clear, high-quality images (max 5MB) in PNG, JPEG, GIF, or WebP format</li>
                    </ul>
                    
                    <h4>Compatible Visual Models</h4>
                    <ul>
                        <li><strong>Mistral-small3.1</strong> - Mistral visual model with superb capabilities and multilanguage support</li>
                        <li><strong>Gemma3</strong> - Google's visual model with strong code generation capabilities</li>
                        <li><strong>LLaVA & BakLLaVA</strong> - Large Language and Vision Assistant variants</li>
                        <li><strong>Phi3-Vision</strong> - Microsoft's vision model with good design understanding</li>
                        <li>Any other Ollama model with vision capabilities</li>
                    </ul>
                    
                    <h4>Installing Visual Models</h4>
                    <p>If no compatible models are available:</p>
                    <ol>
                        <li>Click "Go to Models Tab" from the warning screen</li>
                        <li>Install a vision-capable model using Ollama</li>
                        <li>Return to Visual Design Studio after installation</li>
                    </ol>
                    
                    <div class="note">
                        <p><strong>Important:</strong> When switching away from artworks tab, image data is cleared from memory to prevent resource usage issues, and chat context resets for regular conversations.</p>
                    </div>
                `,
                image: "artworks_intro.png",
                imageAlt: "Visual Design Studio Overview",
                imageCaption: "Artworks tab interface showing model selection and upload area",
            },
            {
                id: "artworks-workflow",
                title: "Design Workflow and Modes",
                content: `
                <h4>Complete Workflow</h4>
                <ol>
                    <li><strong>Select Visual Model</strong> - Choose from the dropdown (selection saved for future sessions)</li>
                    <li><strong>Choose Design Mode</strong> - Pick HTML Style Transfer, Text Overlay, or Design Rationale</li>
                    <li><strong>Upload Image</strong> - Drag/drop or click to upload (system analyzes dimensions and orientation)</li>
                    <li><strong>Write Instructions</strong> - Provide specific guidance (placeholder text changes based on mode)</li>
                    <li><strong>Generate & Preview</strong> - Click "Generate Design" or press Enter; results open in interactive preview window</li>
                </ol>
                
                <h4>Design Modes Explained</h4>
                
                <h5>HTML Style Transfer</h5>
                <ul>
                    <li>Converts visual design elements into functional HTML/CSS code</li>
                    <li>Extracts color schemes, layouts, and styling patterns</li>
                    <li>Option to "Use as background image" incorporates the actual uploaded image</li>
                    <li>Perfect for transforming design inspiration into web interfaces</li>
                </ul>
                
                <h5>Text Overlay</h5>
                <ul>
                    <li>Analyzes images to find optimal text placement areas</li>
                    <li>Generates responsive HTML/CSS for text overlays</li>
                    <li>Considers image dimensions and orientation for proper positioning</li>
                    <li>Ideal for marketing materials, banners, and product showcases</li>
                </ul>
                
                <h5>Design Rationale</h5>
                <ul>
                    <li>Provides professional analysis of design choices and principles</li>
                    <li>Explains color theory, typography, layout, and visual hierarchy</li>
                    <li>Offers insights into user experience impact</li>
                    <li>Great for learning design principles or understanding successful designs</li>
                </ul>
                
                <h4>Image Management</h4>
                <ul>
                    <li><strong>Upload Process</strong> - System shows dimensions, orientation (Landscape/Portrait/Square), and aspect ratio</li>
                    <li><strong>Background Option</strong> - In Style Transfer mode, choose whether to include the actual image in generated code</li>
                    <li><strong>Replace Images</strong> - Click "×" on preview to upload a new image</li>
                </ul>
                
                <div class="note">
                    <p><strong>Tip:</strong> Press Enter (without Shift) in the instructions field to immediately start generation when all requirements are met.</p>
                </div>
            `,
            },
            {
                id: "artworks-examples",
                title: "Example Instructions and Best Practices",
                content: `
                <h4>HTML Style Transfer Examples</h4>
                
                <h5>Brutalist Website (Comprehensive Example)</h5>
                <p class="example-prompt">"Create a brutalist style website with all the usual header buttons and footer links, create a button in the middle of the viewport that says 'log in', use the colors from the image for the website color palette on all components including the background color for the page and footer/header (make them semi transparent), make sure the background image fills the body of the webpage and the footer is sticky to the bottom of the viewport"</p>
                
                <h5>Modern E-commerce Site</h5>
                <p class="example-prompt">"Transform this into a modern e-commerce product page with a clean navigation bar, product gallery section, customer reviews area, and prominent 'Add to Cart' button. Use the color scheme from the image and create a minimalist layout with plenty of white space."</p>
                
                <h5>Creative Portfolio</h5>
                <p class="example-prompt">"Create a creative portfolio website with a full-screen hero section, animated navigation menu, project showcase grid, and contact form. Extract the artistic color palette from the image and apply it throughout the design with subtle gradients and hover effects."</p>
                
                <h5>Corporate Landing Page</h5>
                <p class="example-prompt">"Design a professional corporate landing page with a header navigation, hero section with call-to-action, three-column feature section, testimonials carousel, and footer with company links. Use the sophisticated color palette from the image to convey trust and authority."</p>
                
                <h5>Restaurant/Food Site</h5>
                <p class="example-prompt">"Transform this into an appetizing restaurant website with menu sections, reservation form, photo gallery of dishes, chef's story, and location information. Use warm, inviting colors from the food image to create a cozy, welcoming atmosphere."</p>
                
                <h4>Text Overlay Examples</h4>
                
                <h5>Product Showcase</h5>
                <p class="example-prompt">"Add the following text to this product image: Main heading: 'Premium Wireless Headphones', Subheading: 'Immersive Sound Experience', Key features: 'Noise Cancelling • 30Hr Battery • Bluetooth 5.0', Price: '$149.99', Call-to-action button: 'Shop Now'"</p>
                
                <h5>Event Promotion</h5>
                <p class="example-prompt">"Create promotional text overlay: Event title: 'Summer Music Festival 2024', Date: 'July 15-17, 2024', Location: 'Central Park, NYC', Headliners: 'Featured Artists TBA', Ticket info: 'Early Bird $89', Button: 'Get Tickets'"</p>
                
                <h4>Design Rationale Examples</h4>
                
                <h5>Layout Analysis</h5>
                <p class="example-prompt">"Analyze the layout and composition of this design. Explain how the visual hierarchy guides user attention and how the spacing and alignment choices impact readability and user flow."</p>
                
                <h5>Color Psychology</h5>
                <p class="example-prompt">"Examine the color choices in this design and explain their psychological impact. How do these colors affect user emotions and decision-making? What does this color palette communicate about the brand?"</p>
                
                <h4>Writing Effective Instructions</h4>
                <ul>
                    <li><strong>Be Specific</strong> - Include design style, target audience, and key components needed</li>
                    <li><strong>Mention Image Elements</strong> - Reference specific colors, layouts, or features from your uploaded image</li>
                    <li><strong>Define Purpose</strong> - Explain the goal (marketing, portfolio, e-commerce, etc.)</li>
                    <li><strong>Request Features</strong> - Specify responsive behavior, animations, or interactive elements</li>
                </ul>
                
                <h4>Choosing the Right Images</h4>
                <ul>
                    <li><strong>Style Transfer</strong> - Use images with distinct design elements and clear color schemes</li>
                    <li><strong>Text Overlay</strong> - Select images with clear areas for text placement</li>
                    <li><strong>Design Rationale</strong> - Choose professional designs with intentional elements</li>
                    <li><strong>Quality Matters</strong> - High-resolution images with good lighting produce better results</li>
                </ul>
                
                <div class="note">
                    <p><strong>Pro Tip:</strong> When using "Use as background image" in HTML Style Transfer mode, the system automatically handles image integration with placeholder comments showing exactly where the image is used.</p>
                </div>
            `,

                images: [
                    {
                        src: "artworks_examples.png",
                        alt: "Example Instructions",
                        caption:
                            "Example of design instructions for a headset promo prototype",
                    },
                    {
                        src: "artworks_examples2.png",
                        alt: "Final prototype result",
                        caption: "Example of design prototype for a headset promo",
                    },
                ]

            },
            {
                id: "artworks-results-management",
                title: "Working with Results and Troubleshooting",
                content: `
                <h4>Generation Process</h4>
                <ul>
                    <li><strong>Progress Window</strong> - Shows AI analyzing your image (typically 30-60 seconds)</li>
                    <li><strong>Cancel Anytime</strong> - Click close button in progress window to stop generation</li>
                    <li><strong>Results Display</strong> - Output appears in directly in preview mode</li>
                </ul>
                
                <h4>Interactive Preview Window</h4>
                <p>Results open in a floating window where you can:</p>
                <ul>
                    <li><strong>Switch Views</strong> - Toggle between code view and live preview</li>
                    <li><strong>Edit Directly</strong> - Modify generated code in real-time</li>
                    <li><strong>Copy Code</strong> - Use for your own projects</li>
                    <li><strong>Export PNG</strong> - Save screenshot of the design</li>
                </ul>
                
                <h4>Working with Generated Code</h4>
                <ul>
                    <li><strong>Starting Point</strong> - Consider code as a foundation you can refine further</li>
                    <li><strong>Browser Testing</strong> - Test across different browsers and screen sizes</li>
                    <li><strong>Direct Editing</strong> - Modify and preview code directly in the result window</li>
                    <li><strong>Regeneration</strong> - Try again with more specific instructions if needed</li>
                </ul>
                
                <h4>Important: Temporary Image URLs created for background use during generation</h4>
                <div class="warning">
                    <p><strong>Replace Blob URLs Before Deployment:</strong></p>
                    <ul>
                        <li>Generated code contains temporary blob URLs like <code>blob:http://localhost:8182/...</code></li>
                        <li>These are stored in memory for preview only and won't work outside your session</li>
                        <li>Look for CSS properties like <code>background-image: url('blob:http://...')</code></li>
                        <li>Replace blob URLs with paths to your actual image files before using the code</li>
                    </ul>
                </div>
                
                <h4>Troubleshooting Common Issues</h4>
                
                <h5>Generation Failures</h5>
                <ul>
                    <li><strong>Solution:</strong> Try a different visual model or smaller image</li>
                    <li><strong>Prevention:</strong> Use clear images with distinct design elements</li>
                    <li><strong>Retry:</strong> Due to the probabilistic nature of Ai models, you should retry several times before giving up</li>
                </ul>
                
                <h5>Slow Performance</h5>
                <ul>
                    <li><strong>Solution:</strong> Use smaller images, simplify instructions, use smaller AI models</li>
                    <li><strong>Note:</strong> Complex designs and larger images require more processing time</li>
                </ul>
                
                <h5>Incomplete Code Output</h5>
                <ul>
                    <li><strong>Solution:</strong> Ask AI to continue or complete the code in regular chat after generation</li>
                    <li><strong>Alternative:</strong> Break complex requests into smaller, specific generations</li>
                </ul>
                
                <h5>Poor Text Placement (Overlay Mode)</h5>
                <ul>
                    <li><strong>Solution:</strong> Specify preferred positions in your instructions</li>
                    <li><strong>Example:</strong> "Place heading in top-left corner, price in bottom-right"</li>
                </ul>
                
                <div class="note">
                    <p><strong>Performance Tip:</strong> Visual processing is resource-intensive. For best results, close unnecessary applications and use high-quality, clearly composed images.</p>
                </div>
            `,
                image: "artworks_examples3.png",
                imageAlt: "Results Management",
                imageCaption: "The interactive preview window with editing and export capabilities",
            },
        ],
    },

    // SlideForge Tab section
    presentation: {
        title: "SlideForge",
        intro: "Create slide decks from documents using AI-assisted extraction and a preview editor.",
        articles: [
            {
                id: "presentation-overview",
                title: "Overview",
                content: `
            <p>The SlideForge tab converts supported documents (.pdf, .docx, .txt, .md) into a sequence of slides. The tab extracts text from your file, uses the AI to generate slide content, optionally retrieves images for slides, and opens an interactive preview where you can review and export the result.</p>
            <p>Quick flow:</p>
            <ol>
                <li>Upload a document using drag & drop or the Browse button.</li>
                <li>Choose number of slides and bullets per slide.</li>
                <li>Add an optional extra prompt to control tone or style.</li>
                <li>Click Generate to run extraction and AI generation.</li>
                <li>Review and edit slides in the preview window, then export.</li>
            </ol>
        `,
                image: "tab_overview.png",
                imageAlt: "SlideForge tab overview",
                imageCaption: "Overview of the SlideForge tab",
            },
            {
                id: "presentation-direct-copy",
                title: "Direct copy mode",
                content: `
            <p>Use Direct copy when your document already contains slide-ready text you want to keep exactly as written. The AI only structures and splits content; it does not paraphrase.</p>

            <h4>How to prepare your document</h4>
            <ul>
                <li><strong>Label slides explicitly:</strong> add "cover:" for the first slide, then "Slide 1:", "Slide 2:", and so on in order.</li>
                <li><strong>Provide cover text:</strong> after "cover:" include a title and optionally a subtitle separated by a comma.</li>
                <li><strong>One section per slide:</strong> place each slide's text right after its label; keep the order and language consistent.</li>
                <li><strong>Match bullet count:</strong> set the bullets-per-slide selector to how you want the text split. The AI will chunk sequentially without rewriting and pad empty items if needed.</li>
                <li><strong>Stay within context:</strong> keep total text reasonable (context selector controls the max length) so all labeled slides are captured.</li>
            </ul>

            <h4>How to run Direct copy</h4>
            <ol>
                <li>Select "Direct copy" in the mode selector.</li>
                <li>Set slide count and bullets per slide (slide 1 is always the cover).</li>
                <li>Drop your labeled document or paste text, and optionally add an extra prompt for minor instructions (for example: casing or spacing preferences).</li>
                <li>Click Generate; the output mirrors your wording. Missing slides or bullets are left as empty strings instead of being rewritten.</li>
            </ol>

            <p>Tip: If you see unexpected rewrites, confirm the mode is "Direct copy" and that labels are spelled exactly ("Slide 1:", "Slide 2:", etc.).</p>
        `,
                image: "tab_overview.png",
                imageAlt: "Direct copy mode",
                imageCaption: "Label slides and run Direct copy",
            },
            {
                id: "presentation-promptable",
                title: "Promptable presentation",
                content: `
            <p><strong>Promptable presentation</strong> opens a dedicated full-screen workspace for prompt-based deck creation.</p>
            <ul>
                <li><strong>Number of slides</strong> — choose the exact slide count (1 to 20).</li>
                <li><strong>Add text</strong> — opens a floating text window where you can paste long source content.</li>
                <li><strong>Text persistence</strong> — when you close and reopen the Add text window, your previously saved text appears again.</li>
                <li><strong>Send workflow</strong> — Send builds the user prompt automatically using the selected slide count and saved source text.</li>
                <li><strong>Extra request (optional)</strong> — use the Extra request button for style/layout instructions (for example: "use red colors" or "round image frames"); when provided, it is added before the main source text in the prompt.</li>
                <li><strong>Mode selection</strong> — use <strong>Interactive mode</strong> for presentations navigated with <strong>Prev/Next</strong> buttons, or <strong>Scrollable mode</strong> for presentations you scroll from top to bottom.</li>
                <li><strong>Web search toggle</strong> — after <strong>Send</strong>, use the <strong>Web</strong> toggle to build presentation content from web search results using your Add text content as the search prompt; when active, the Add text button changes to <strong>Web search prompt</strong>.</li>
                <li><strong>Web prompt tip</strong> — in this mode, write only the topic to research for the presentation. Avoid phrases like “create a presentation about...” because they can bias the web search; provide just the topic.</li>
                <li><strong>Recommended model</strong> — for this feature, <strong>GLM 4.7 Flash</strong> is a very good presentation model.</li>
                <li><strong>Saved presentations</strong> — generated HTML decks can be saved encrypted to your DB and listed in the right sidebar.</li>
                <li><strong>Open from sidebar</strong> — click a saved presentation to load it in the landscape preview area.</li>
                <li><strong>Delete safety</strong> — deleting a saved presentation asks for confirmation first.</li>
            </ul>
            <p>Tip: keep the source text in logical sections and set a realistic slide count to get clearer slide structure.</p>
        `,
                image: "tab_overview.png",
                imageAlt: "Promptable presentation workflow",
                imageCaption: "Promptable presentation workspace and controls",
            },
            {
                id: "presentation-generating",
                title: "Generating SlideForges",
                content: `
            <p>After you click Generate the system performs several steps and shows a progress modal:</p>
            <ul>
                <li><strong>Text extraction</strong> — document text is extracted for AI consumption.</li>
                <li><strong>AI generation</strong> — the AI transforms extracted text into slide content (the extra prompt is included when provided).</li>
                <li><strong>Parsing & images</strong> — AI output is parsed into structured slides and images are downloaded if available.</li>
                <li><strong>Error handling</strong> — the tab automatically retries once on malformed AI replies; errors are shown in the loading modal.</li>
            </ul>
            <p>You can cancel generation at any time using the close/abort button in the loading modal. Aborting will stop background tasks and close the modal.</p>
        `,
                image: "generating_presentation.png",
                imageAlt: "Generating presentations",
                imageCaption: "Generation process and progress indicators",
            },
            {
                id: "presentation-preview-export",
                title: "Preview, Edit & Export",
                content: `
            <p>When generation succeeds a full-screen Preview Window opens. Key features of the preview:</p>
            <ul>
                <li><strong>Large slide view</strong> — review the currently selected slide rendered as HTML.</li>
                <li><strong>Thumbnails</strong> — navigate slides with the thumbnail bar and jump to any slide.</li>
                <li><strong>Inline editing</strong> — edit slide text directly in the preview (the preview applies slide data via the PreviewWindow API).</li>
                <li><strong>Export options</strong> — use the preview controls to copy slide text, export images, or download HTML (exact export menu is provided by the preview UI).</li>
            </ul>
            <p>Tips: keep document text clear for best extraction, use a reasonable slide count relative to content length, and add an extra prompt when you need a specific tone or style.</p>
        `,
                image: "preview_editing_export.png",
                imageAlt: "Preview and export",
                imageCaption: "Preview window, editing and export options",
            },
            {
                id: "presentation-sidebar",
                title: "SlideForge Sidebar",
                content: `
            <p>The SlideForge Sidebar provides per-slide and global controls to style slides, edit text, manage images, and apply AI-powered text changes.</p>
            <h4>Tabs</h4>
            <ul>
                <li><strong>Style</strong> — pick and apply presentation styles (prebuilt cards such as Classic, Dark mode, Product, Corporate, and many theme presets). The <em>DIY</em> style opens a style manager where you can create or reuse custom styles stored locally.</li>
                <li><strong>Text</strong> — contains global text controls (font, color, bullets) and node-specific controls for selected text elements.</li>
                <li><strong>Pic</strong> — image tools including import/replace, change cover image, search images by description, and a thumbnail gallery for quick replacement.</li>
            </ul>

            <h4>Global vs Selected Controls</h4>
            <p>The Text tab exposes global text controls applied to bullets and default text styles. When you select a text node on a slide, node-specific controls appear (font size, color, AI text modification) allowing per-node adjustments.</p>

            <h4>AI Text Modification</h4>
            <ul>
                <li>Enter an instruction in the AI text box (example: "Translate to Spanish" or "Make these bullets more concise").</li>
                <li>Use the <em>Modify</em> button to apply changes to the currently selected nodes.</li>
                <li>Enable the <em>Apply to all text</em> switch to run the modification over all matching text nodes; the sidebar will attempt a batched, progress-reported path when available.</li>
                <li>The Modify button toggles to <em>Cancel</em> while running — it aborts the operation using the shared presentation AbortController.</li>
            </ul>

            <h4>Picture Tools</h4>
            <ul>
                <li><strong>Import picture</strong> — replace the selected slide image or, when toggled, replace the cover image on the first stage.</li>
                <li><strong>Change cover</strong> — helper-aware flow to replace a full-stage cover image; falls back to the standard import flow if a helper is not available.</li>
                <li><strong>Search images</strong> — enter a description and click Search; results populate the thumbnail grid where you can pick an image to replace the selected picture.</li>
                <li>The picture thumbnail grid is sized to show multiple rows and supplies progress/status messages while importing or replacing images.</li>
            </ul>

            <h4>Style Cards & DIY</h4>
            <p>Style cards let you quickly apply visual themes. The DIY card either opens the style manager if custom styles exist (in-memory or in the DB) or launches a creation modal. Cards reflect availability and selection state visually.</p>

            <h4>Helper Integration</h4>
            <p>The sidebar relies on selection helpers attached to presentation stages to perform image replacement, batch AI edits, and node operations. If a helper is not found, the sidebar displays helpful messages and falls back to available global flows.</p>
        `,
                image: "sidebar_controls.png",
                imageAlt: "SlideForge sidebar",
                imageCaption: "Sidebar controls for styling, text, and images",
            },
            {
                id: "presentation-export-note",
                title: "Export PDF: What is exported",
                content: `
            <p><strong>Note:</strong> The <em>Export PDF</em> button exports the presentation exactly as it appears on screen — including slide text, images, shapes, and background visuals.</p>
        `,
                image: "export_slides.png",
                imageAlt: "Export PDF note",
                imageCaption: "Exports slides as seen in the preview",
            },
        ],
    },

    // Translate Tab section
    translate: {
        title: "Translate",
        intro: "The Translate tab converts document text with AI and provides a floating preview window for review, live updates, and export.",
        articles: [
            {
                id: "translate-overview",
                title: "Overview",
                content: `
            <p>The Translate tab is a document-focused workflow for translating files and reviewing results before export.</p>

            <h4>Supported formats</h4>
            <ul>
                <li><strong>PDF</strong> - editable overlay preview with page rendering</li>
                <li><strong>TXT</strong> - plain text translation with preserved line/paragraph structure</li>
                <li><strong>MD</strong> - markdown-aware translation with structure preservation</li>
            </ul>

            <h4>Main controls</h4>
            <ul>
                <li><strong>Drag & drop area</strong> - drop a file or click to browse</li>
                <li><strong>Scope selector</strong> - choose Selection, Page, or Document before running translation</li>
                <li><strong>Instruction field</strong> - write a directive such as <em>"Translate to French this document"</em></li>
                <li><strong>Translate button</strong> - starts translation for the current document</li>
                <li><strong>Export translated document</strong> - exports the translated output from the current preview state</li>
            </ul>

            <h4>Scope selector</h4>
            <ul>
                <li><strong>Selection</strong> - target one or more selected pages in the preview.</li>
                <li><strong>Page</strong> - target only the currently selected page.</li>
                <li><strong>Document</strong> - target the full document (all pages/blocks).</li>
            </ul>

            <div class="note">
                <p><strong>Tip:</strong> For best quality, use a translation-focused model such as TranslateGemma from the model library.</p>
            </div>
        `,
                image: "Translate-1.png",
                imageAlt: "Translate Tab Overview",
                imageCaption:
                    "The translate tab interface showing drag and drop section",
            },
            {
                id: "translate-preview",
                title: "Floating Preview Window",
                content: `
            <p>After loading a document, Translate opens a floating preview window where you can inspect and refine results.</p>

            <h4>Window controls</h4>
            <ul>
                <li><strong>Maximize/restore</strong> - switch between compact and expanded workspace</li>
                <li><strong>Close/reopen</strong> - close the preview and use <em>Open Preview Window</em> to bring it back</li>
            </ul>

            <h4>PDF behavior</h4>
            <ul>
                <li>Text blocks are mapped over PDF pages and can be edited directly.</li>
                <li>Streaming translation updates apply progressively to matching text blocks.</li>
                <li>You can review and adjust translated text before exporting.</li>
            </ul>

            <h4>TXT / MD behavior</h4>
            <ul>
                <li>Preview uses a text-document style layout for easier reading.</li>
                <li>Streaming replacements update content progressively (not only at the end).</li>
                <li>Line breaks and document structure are preserved as much as possible.</li>
            </ul>
        `,
                image: "Translate-2.png",
                imageAlt: "Translate floating window Overview",
                imageCaption:
                    "The translate window interface showing controls and a loaded pdf",
            },
            {
                id: "translate-export-troubleshooting",
                title: "Export and Troubleshooting",
                content: `
            <p>Use the export control after review to save your translated result.</p>

            <h4>Export output</h4>
            <ul>
                <li><strong>PDF input</strong> - translated PDF export</li>
                <li><strong>TXT input</strong> - exported as <code>-translated.txt</code></li>
                <li><strong>MD input</strong> - exported as <code>-translated.md</code></li>
            </ul>

            <h4>Common issues</h4>
            <ul>
                <li><strong>No extractable PDF text</strong> - scanned/image-only PDFs may not provide editable text blocks.</li>
                <li><strong>Quality mismatch</strong> - refine the instruction or switch to a better translation model.</li>
                <li><strong>Context workflow</strong> - after translation changes, closing the preview can trigger a continue-conversation flow in Chat.</li>
            </ul>

            <div class="note">
                <p><strong>Note:</strong> Translation in this tab is document-oriented. Add explicit tone/style requirements in the instruction field when needed.</p>
            </div>
        `,
            },
        ],
    },

    // Models Tab section
    models: {
        title: "Models",
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
                    <li><strong>General purpose</strong> - Models like Gemma3, Llama, Qwen2.5 and Mistral for everyday tasks</li>
                    <li><strong>Code-specialized</strong> - Models like Qwen2.5 coder, CodeLlama and WizardCoder optimized for programming</li>
                    <li><strong>Vision-capable</strong> - Models like Mistral3.1 and Gemma3 that can analyze images</li>
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
                        <li>A cancel button will appear allowing you to stop the download if needed</li>
                    </ol>
                    
                    <h4>Download Process</h4>
                    <p>During download, you'll see:</p>
                    <ul>
                        <li>Progress information showing downloaded size and total size</li>
                        <li>Status updates for different stages (pulling manifest, downloading files, verifying)</li>
                        <li>The model selector, size selector, and "Fetch Ollama Models" button will be disabled during download</li>
                        <li>Confirmation when the download is complete</li>
                    </ul>
                    
                    <h4>Cancelling Downloads</h4>
                    <p>If you need to cancel a download in progress:</p>
                    <ul>
                        <li>Click the "Cancel Download" button that appears below the download button (If you want to resume, click the download button again)</li>
                        <li>Confirm cancellation when prompted</li>
                        <li>After cancellation, a message will appear recommending you restart Ollama to clean up partially downloaded files</li>
                        <li>This message will automatically disappear after 30 seconds</li>
                        <li>The model selector, size selector, and "Fetch Ollama Models" button will be re-enabled</li>
                    </ul>
                    
                    <h4>Switching Between Tabs</h4>
                    <p>If you switch to another tab during a download:</p>
                    <ul>
                        <li>The download will continue in the background</li>
                        <li>When you return to the Models tab, the current download status will be shown</li>
                        <li>The interface will show what file is currently being downloaded and the overall progress</li>
                    </ul>
                    
                    <div class="note">
                        <p><strong>Important:</strong> Model downloads can be large (from hundreds of MB to hundreds of GB). Ensure you have sufficient disk space and a stable internet connection before starting a download. If you need to fetch new models while a download is in progress, you must cancel the current download first.</p>
                    </div>
                `,
                image: "models_downloading.png",
                imageAlt: "Downloading Models",
                imageCaption: "The model download interface showing download progress and size selection",
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
                        <li>Ensure you're using a compatible Ollama version (currently:0.6.6)</li>
                    </ul>
                    
                    <h4>Download Problems</h4>
                    <p>If model downloads fail or stall:</p>
                    <ul>
                        <li>Check your internet connection stability</li>
                        <li>Ensure you have enough disk space</li>
                        <li>Try canceling and restarting the download</li>
                        <li>Restart Ollama after cancelling to clean up incomplete files</li>
                        <li>Try downloading a smaller model size first</li>
                    </ul>
                    
                    <h4>Incomplete Download Cleanup</h4>
                    <p>If you cancelled a download and need to clean up files:</p>
                    <ul>
                        <li>Restart the Ollama service on your system</li>
                        <li>This allows Ollama to clean up any partially downloaded model files</li>
                        <li>After restarting, you can attempt a new download</li>
                    </ul>
                    
                    <h4>UI Element Issues</h4>
                    <p>If UI elements in the Models tab appear stuck or disabled:</p>
                    <ul>
                        <li>If selectors remain disabled after a download completes or is cancelled, refresh the page</li>
                        <li>If the "Fetch Ollama Models" button is disabled without an active download, refresh the page</li>
                        <li>After multiple download errors, the system will eventually re-enable all controls automatically</li>
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
            }
        ],
    },

    // Database Tab section
    database: {
        title: "Database",
        intro: "The Database tab provides tools to monitor and maintain your local database, ensuring optimal performance and data integrity while preserving complete privacy.",
        articles: [
            {
                id: "database-intro",
                title: "Introduction to Database Management",
                content: `
                <p>The Database tab gives you visibility and control over Paiperwork's local database system that stores all your conversations, documents, and application data.</p>
                
                <p>Key features of the Database tab include:</p>
                <ul>
                    <li>Real-time statistics about database size and contents</li>
                    <li>Tools to identify and clean up orphaned data</li>
                    <li>Database optimization capabilities</li>
                    <li>Information about your storage method and security</li>
                </ul>
                
                <p>All data in Paiperwork is stored locally in a SQLite database within your browser's storage. This database is fully encrypted using your Master Key, ensuring complete privacy and security.</p>
                
                <div class="note">
                    <p><strong>Important:</strong> Unlike cloud-based applications, Paiperwork's database requires occasional maintenance to ensure optimal performance. The Database tab provides the tools you need for this maintenance.</p>
                </div>
            `,
                image: "database_overview.png",
                imageAlt: "Database Tab Overview",
                imageCaption: "The Database tab showing statistics and management tools"
            },
            {
                id: "database-stats",
                title: "Understanding Database Statistics",
                content: `
                <p>The Database Statistics panel provides important insights about your local database:</p>
                
                <h4>Key Statistics</h4>
                <ul>
                    <li><strong>Database Size</strong> - Total disk space used by your database</li>
                    <li><strong>Documents</strong> - Number of documents stored in your database</li>
                    <li><strong>Total Chunks</strong> - Text segments used for document searching and retrieval</li>
                    <li><strong>Database Health</strong> - Status indicator for database integrity</li>
                </ul>
                
                <h4>Health Indicators</h4>
                <p>The Database Health indicator can show:</p>
                <ul>
                    <li><strong>Healthy</strong> - Green checkmark indicates your database is optimized and has no orphaned data</li>
                    <li><strong>Orphaned Chunks</strong> - Yellow warning appears when orphaned chunks are detected, showing how many chunks are orphaned</li>
                </ul>
                
                <h4>Storage Method</h4>
                <p>The "About Your Database" section shows your current storage method:</p>
                <ul>
                    <li><strong>OPFS (Origin Private File System)</strong> - Modern, high-performance storage available in newer browsers</li>
                    <li><strong>IndexedDB</strong> - Fallback storage method for browsers without OPFS support</li>
                </ul>
                
                <h4>Refreshing Statistics</h4>
                <p>To get the most up-to-date information:</p>
                <ol>
                    <li>Click the "Refresh Statistics" button</li>
                    <li>Wait for the system to analyze your database</li>
                    <li>Review the updated statistics</li>
                </ol>
                
                <div class="note">
                    <p><strong>Note:</strong> Database statistics are automatically loaded when you first open the Database tab and when you return to it after using other tabs.</p>
                </div>
            `,
            },
            {
                id: "database-orphaned",
                title: "Managing Orphaned Data",
                content: `
                <p>When you delete documents or conversations, sometimes small pieces of data can become "orphaned" - disconnected from their parent content but still taking up space in your database.</p>
                
                <h4>What Are Orphaned Chunks?</h4>
                <p>Orphaned chunks are text segments that were once part of a document or conversation but are no longer associated with any existing content. They occur when:</p>
                <ul>
                    <li>Documents are deleted without properly cleaning up all associated chunks</li>
                    <li>Operation interruptions occur during document deletion</li>
                    <li>System errors prevent complete cleanup during normal operations</li>
                </ul>
                
                <h4>Identifying Orphaned Data</h4>
                <p>The Database tab automatically detects orphaned chunks and alerts you with:</p>
                <ul>
                    <li>A yellow warning indicator in the Database Health section</li>
                </ul>
                
                <h4>Cleaning Up Orphaned Data</h4>
                <ol>
                    <li>When orphaned chunks are detected, click the "Clean database" button</li>
                    <li>The system will identify and remove all orphaned chunks</li>
                    <li>A success message will appear showing how many chunks were removed and how much space was recovered</li>
                    <li>Database statistics will automatically refresh to show the improved state</li>
                </ol>
                
                <div class="note">
                    <p><strong>Important:</strong> Cleaning up orphaned data only removes unneeded fragments - it does not affect any of your actual documents, conversations, or stored information.</p>
                </div>
            `,
                image: "database_orphaned.png",
                imageAlt: "Orphaned Data Cleanup",
                imageCaption: "The database cleaned up message"
            },
            {
                id: "database-optimize",
                title: "Optimizing Database Performance",
                content: `
                <p>Over time, as you add and delete content, your database may become fragmented and use more space than necessary. The Database tab provides tools to optimize performance and reclaim unused space.</p>
                
                <h4>When to Optimize Your Database</h4>
                <p>Consider running database optimization when:</p>
                <ul>
                    <li>You've deleted large documents or many conversations</li>
                    <li>The application seems slower than usual</li>
                    <li>You notice the database size is larger than expected</li>
                    <li>You want to reclaim disk space</li>
                </ul>
                
                <h4>How Database Size Changes</h4>
                <p>Understanding how database size works in SQLite:</p>
                <ul>
                    <li>When you add content, the database grows to accommodate it</li>
                    <li>When you delete content, the database file doesn't automatically shrink</li>
                    <li>Deleted space is marked as available for reuse but still counts in the total file size</li>
                    <li>Only optimization (VACUUM) actually reduces the file size by rebuilding the database</li>
                </ul>
                
                <h4>Running Database Optimization</h4>
                <ol>
                    <li>Click the "Clean Database" button in the Database tab</li>
                    <li>Wait for the optimization process to complete (this may take a moment for larger databases)</li>
                    <li>A notification will appear showing how much space was recovered</li>
                    <li>Database statistics will automatically refresh</li>
                </ol>
                
                <h4>What Optimization Does</h4>
                <ul>
                    <li>Rebuilds the database file to remove unused space</li>
                    <li>Defragments data for more efficient storage</li>
                    <li>Reorganizes indexes for faster queries</li>
                    <li>Shrinks the database file to its optimal size</li>
                </ul>
                
                <div class="note">
                    <p><strong>Tip:</strong> Make it a habit to run database optimization after deleting large documents or multiple conversations to maintain optimal performance. Unlike many cloud applications, local database applications like Paiperwork require occasional maintenance to keep running smoothly.</p>
                </div>
            `,
            },
            {
                id: "database-maintenance",
                title: "Database Maintenance Best Practices",
                content: `
                <p>Proper database maintenance ensures Paiperwork continues to run smoothly and efficiently. Follow these best practices to keep your database healthy.</p>
                
                <h4>Regular Maintenance Schedule</h4>
                <p>Establish a routine maintenance schedule:</p>
                <ul>
                    <li><strong>Weekly</strong> - Check database statistics and clean up orphaned data if found</li>
                    <li><strong>Monthly</strong> - Run database optimization to reclaim space and improve performance</li>
                    <li><strong>After bulk operations</strong> - Optimize after deleting multiple documents or conversations</li>
                </ul>
                
                <h4>Performance Indicators</h4>
                <p>Watch for signs that your database needs maintenance:</p>
                <ul>
                    <li>Slower application response times</li>
                    <li>Delays when switching between tabs</li>
                    <li>Longer loading times for documents or conversations</li>
                    <li>Unexpected growth in database size</li>
                </ul>
                
                <h4>Preventative Maintenance</h4>
                <ul>
                    <li>Clean up unnecessary documents and conversations regularly</li>
                    <li>Run optimization after deleting significant amounts of data</li>
                    <li>Check for orphaned chunks periodically even if no warning appears</li>
                    <li>Restart the application occasionally to allow browser storage optimization</li>
                </ul>
                
                <h4>Understanding Database Growth</h4>
                <p>It's normal for your database to grow over time as you:</p>
                <ul>
                    <li>Add more documents for RAG processing</li>
                    <li>Have more conversations with the AI</li>
                    <li>Create knowledge base entries and collections</li>
                    <li>Generate and save more research reports</li>
                </ul>
                <p>What's not normal is when the database remains large after you've deleted this content - that's when optimization is needed.</p>
                
                <div class="note">
                    <p><strong>Important:</strong> Unlike cloud applications, local database apps don't have automatic maintenance processes running on servers. The Database tab gives you the tools to perform this maintenance yourself, keeping your application running smoothly.</p>
                </div>
            `,
            },
            {
                id: "database-troubleshooting",
                title: "Troubleshooting Database Issues",
                content: `
                <p>If you encounter problems with the database or notice performance issues, here are some troubleshooting steps:</p>
                
                <h4>Common Issues and Solutions</h4>
                
                <h5>Slow Application Performance</h5>
                <ul>
                    <li><strong>Issue:</strong> Paiperwork feels sluggish or takes longer to respond</li>
                    <li><strong>Solution:</strong> Run database optimization by clicking the "Clean Database" button</li>
                    <li><strong>Prevention:</strong> Schedule regular optimization, especially after large deletions</li>
                </ul>
                
                <h5>Large Database Size</h5>
                <ul>
                    <li><strong>Issue:</strong> Database size seems disproportionately large compared to your content</li>
                    <li><strong>Solution 1:</strong> Check for and clean up orphaned chunks</li>
                    <li><strong>Solution 2:</strong> Run database optimization to reclaim unused space</li>
                    <li><strong>Solution 3:</strong> Review and delete unnecessary documents and conversations</li>
                </ul>
                
                <h5>Missing Content After Session Changes</h5>
                <ul>
                    <li><strong>Issue:</strong> Content appears to be missing when changing Master Keys</li>
                    <li><strong>Solution:</strong> Verify you're using the correct Master Key for that content</li>
                    <li><strong>Explanation:</strong> Different Master Keys create separate secure storage areas</li>
                </ul>
                
                <h5>Statistics Not Updating</h5>
                <ul>
                    <li><strong>Issue:</strong> Database statistics don't seem to reflect recent changes</li>
                    <li><strong>Solution:</strong> Click the "Refresh Statistics" button to update manually</li>
                    <li><strong>Explanation:</strong> Some statistics are cached and need manual refresh</li>
                </ul>
                
                <h5>Persistent Orphaned Chunks</h5>
                <ul>
                    <li><strong>Issue:</strong> Orphaned chunks reappear after cleaning</li>
                    <li><strong>Solution 1:</strong> Try running the cleanup process again</li>
                    <li><strong>Solution 2:</strong> Refresh the browser and try cleaning again</li>
                    <li><strong>Solution 3:</strong> Run database optimization after cleanup</li>
                </ul>
                
                <h4>Last Resort: Database Reset</h4>
                <p>If persistent issues occur and normal maintenance doesn't help:</p>
                <ol>
                    <li>Export any important conversations or documents first</li>
                    <li>Return to the welcome screen</li>
                    <li>Click "Delete All Information" to reset the database</li>
                    <li>This will remove all data and create a fresh database</li>
                </ol>
                
                <div class="note">
                    <p><strong>Warning:</strong> Database reset is irreversible and will delete all your data. Always export important information first.</p>
                </div>
            `,
            }
        ],
    },
};
window.helpContentLoaded = true;
/* console.log(
    "help-content.js loaded successfully, helpContent object created with sections:",
    Object.keys(helpContent)
); */
