# Paiperwork Quick Reminder

To build the app in dev mode: cd /Users/infinitai/paiperwork-main/dev/server && bash dev-build.sh; pkill -f "Paiperwork-server-dev-osx" || true; cd /Users/infinitai/paiperwork-main/dev && ./Paiperwork-server-dev-osx, to build the app in production mode:cd /Users/infinitai/paiperwork-main/dev/server && bash build.sh, use VScode terminal so is easy to start/kill server and see logs.

## What is Paiperwork?
Paiperwork is a **local-first, privacy-focused AI desktop web app** powered by Ollama, designed to run on consumer hardware and keep your work on your own machine.

Core idea:
- AI chat + document intelligence + research + visual/data tools in one workspace
- Local encrypted storage (Master Key-based data separation)
- Minimal external data sharing (mainly web search queries and model pull/query operations)

## Main Tabs / Sections (English Help)

### Start
- Entry point where you choose language, set/enter Master Key, and start a session.
- Master Key separates and protects local data spaces (chats, settings, documents, knowledge).
- Optional protection password exists for sensitive actions (such as full data deletion safeguards).

### Chat
- General AI conversation interface with model selection and configurable system prompt.
- Supports insights/memory behavior, conversation sessions, regenerate/copy/export options.
- Advanced options include web search mode, thinking/reasoning model handling, image upload (for visual models), and code block execution/preview features.

### Documents
- Upload and manage text/PDF files for AI-assisted analysis.
- Ask questions about one document (document mode) or search across document collections.
- Includes summarization, extraction/search workflows, and guidance on model compatibility (embedding support) and memory/performance limits.

### DataViz
- Generate charts from natural language prompts and data context.
- Supports common visualization types and iterative prompt-based refinement.
- Useful for quick analysis and presentation-ready visuals.

### Paperwork
- AI-assisted professional document creation (e.g., letters, reports, templates).
- Structured generation workflow with customizable content and formatting options.
- Focuses on productivity for formal/business writing tasks.

### Research
- Web-assisted AI research workflow with source gathering and synthesis.
- Can build structured research outputs and store findings for reuse.
- Designed for deeper discovery beyond static local files.

### Artworks
- Visual/design helper features (image-to-HTML/CSS style support, text overlays, design-oriented generation flows).
- Focuses on creative outputs and front-end style ideation.

### SlideForge (Presentation)
- Presentation/slide generation workflow using AI.
- Helps draft and structure slide content with export-oriented usage.

### Models
- Manage Ollama models (discover/select/download/remove depending on availability and permissions).
- Configure model behavior for task fit and hardware constraints.

### Connectors
- Connect external channels to Paiperwork, currently focused on WhatsApp integration.
- Supports personal mode and bot mode, device pairing/unpairing, server startup, and QR-based linking.
- WhatsApp messages can route into Paiperwork workflows such as normal chat, web-assisted chat, document-check, research, DataViz, and SlideForge presentation generation.
- In personal WhatsApp usage, the user can ask for installed models and switch the active Chat model directly from WhatsApp.
- Model commands now support a list-and-switch workflow with local/cloud separation, for example:
	- "Show me my models"
	- "Use Gemma4 Local"
- The model switch updates the same Chat tab selector used in the UI, persists the selected model/provider, and future WhatsApp replies use that chosen model.

### Database
- Local database monitoring and maintenance utilities.
- Storage/cleanup controls plus safety-related settings around local data handling.

## Practical Usage Pattern
1. Start session with Master Key.
2. Pick a model in Chat.
3. Use specialized tabs by task:
	- Documents for file Q&A/search/summaries
	- Research for web synthesis
	- DataViz for charts
	- Paperwork for formal docs
	- Artworks/SlideForge for creative/presentation output
	- Connectors for WhatsApp access to chat and workflow commands
4. Use Models/Database tabs for maintenance and optimization.

## WhatsApp Notes
- WhatsApp orchestration replies are localized to the detected/requested language where translation keys exist.
- The WhatsApp model list separates local and cloud models so similarly named models can be selected safely.
- For explicit switching, include the provider in the message when needed, e.g. "Use Gemma4 Local" vs. "Use Gemma4 Cloud".
- Because this is intended as a personal app workflow, the WhatsApp model change is allowed to modify the global Chat model selector directly.

## One-line Summary
Paiperwork is a private, local AI productivity suite that combines chat, document intelligence, research, visualization, writing, presentations, and WhatsApp-connected workflows behind a Master Key-based local data model.

## Libraries Overview (dev/app/core/js/libraries)

- **html2canvas (v1.4.1)**: Captures rendered HTML UI into images/canvas snapshots, used for visual export/preview workflows.
- **JSZip (v3.10.1)**: Creates and reads ZIP packages, used for document packaging/extraction tasks.
- **Konva.js (v9.3.20)**: 2D canvas framework for interactive visual editing, drawing, and layout features.
- **SQL.js (WASM)**: In-browser SQLite engine (`sql-wasm.js` + `sql-wasm.wasm`) for local structured data storage and querying.
- **PDF.js + jsPDF**: PDF.js (`pdf.mjs`) handles PDF rendering/parsing; jsPDF (`jspdf.umd.min.js`) handles PDF generation/export.
- **PptxGenJS bundle**: PowerPoint (`.pptx`) presentation generation library (bundled here as `pptxgen.bundle.js`) used by SlideForge/export flows.

In short: these libraries provide Paiperwork’s local document handling, export generation (PDF/PPTX/ZIP), canvas-based visual tools, and local database capabilities.

### How Libraries Are Loaded (Header + TabLoader)

- **Header preloads (always available):** `generation.html` preloads core/shared dependencies (`SQL.js`, `html2canvas`, `jsPDF`) and imports `PDF.js` as an ES module, then assigns `window.pdfjsLib` and configures `pdf.worker.mjs`.
- **Welcome page is lightweight:** `welcome.html` only loads startup essentials (`SQL.js`, language, database, selection/version utilities), keeping first-screen load small.
- **Lazy tab loading:** `tabloader.js` loads optional tab scripts only when a tab is opened (e.g., Documents, DataViz, Paperwork, Research, Artworks, Models, SlideForge).
- **Per-tab dependency bundles:** heavy features can include libraries inside tab bundles; for example, SlideForge loads `JSZip`, `Konva`, and `jsPDF` on demand.
- **Safety controls:** TabLoader prevents duplicate loads (`loadedModules`/`loadingPromises`), loads scripts in order, waits for global readiness flags/classes, then initializes tab instances.

So the pattern is: **core basics in HTML headers**, **feature-heavy modules/libraries deferred by TabLoader**, which balances startup speed and functionality.

### Runtime Control Flow (from app.js)

- **Boot sequence:** on `DOMContentLoaded`, Paiperwork initializes language (`Lang.initialize()`), context size, and tab switching handlers; if a `hashedMasterKey` exists, it initializes the local DB and boots Chat UI (`ChatTab.initialize()`).
- **Session gate:** most core startup depends on `sessionStorage.hashedMasterKey`, reinforcing the Master Key session model before loading user settings/state.
- **Tab lifecycle orchestration:** clicking a tab deactivates previous panes, activates the target pane, runs tab-specific handlers (`handleChatTab`, `handleDocumentsTab`, etc.), and calls `handleTabChange(true/false)` when tab modules expose lifecycle hooks.
- **Lazy module readiness checks:** each heavy tab handler waits/polls for required globals/classes (`DataViz`, `RAG_Utils`, `Paperwork`, `ResearchTab`, `Artworks`, `presentation`, `DatabaseTab`, `ModelDownloader`) before initializing/reusing instances.
- **Resilience pattern:** handlers provide user-facing fallback UIs on failure (localized error + retry button), which aligns with TabLoader retries and avoids hard crashes when scripts are delayed.
- **Model-state sync in Chat:** when Chat tab opens, model list is refreshed from Ollama, previous model selection is validated, and stale/deleted model selections are cleaned from settings/session.
- **Cross-tab safety cleanup:** after tab switches, app exits document-questioning mode if active and applies special-case UI safeguards (e.g., preserving Documents processing state visibility).
- **Unified cancellation path:** `cancelOllamaGeneration()` delegates to `chatTab`/`chat`, falls back to abort controllers + UI reset, and is exposed globally (`window.cancelOllamaGeneration`) for consistent stop behavior.

In practice, `app.js` is the runtime conductor: it coordinates startup, tab activation, lazy feature initialization, and recovery/cancellation behavior across all Paiperwork tools.

