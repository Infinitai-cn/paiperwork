# Paiperwork

**A Privacy-First AI Document Assistant powered by Ollama**

Paiperwork is a local-first AI Javascript Desktop application (not intended for phone use) that transforms how you work with documents, data, and knowledge. Built with a Go backend server and modern JavaScript frontend, it provides a comprehensive suite of AI-powered tools while keeping all your data secure and private on your local machine.

## Credits & Acknowledgments

We're grateful to the amazing open-source community and the brilliant developers behind these essential libraries that make Paiperwork possible:

- **[Llama.cpp](https://github.com/ggml-org/llama.cpp)** - The backbone for running LLMs locally, ensuring privacy and control *(MIT License)*
- **[Ollama](https://ollama.com/)** - For making it easy to download and use Ai models *(MIT License)*
- **[html2canvas](https://html2canvas.hertzen.com/)** - For capturing and converting HTML elements to images, enabling our visual design features *(MIT License)*
- **[PDF.js](https://mozilla.github.io/pdf.js/)** - Mozilla's powerful PDF rendering library that powers our document processing capabilities *(Apache-2.0 License)*
- **[SQL.js](https://sql.js.org/)** - SQLite compiled to JavaScript, providing our local database functionality with privacy-first storage *(MIT License)*
- **[Konva.js](https://konvajs.org/)** - Powerful 2D canvas library for desktop and mobile applications, enabling our interactive visual design and presentation features *(MIT License)*
- **[JSZip](https://stuk.github.io/jszip/)** - JavaScript library for creating, reading and editing .zip files, enabling our Word document processing and file extraction capabilities *(MIT License)*


These incredible tools enable us to deliver a rich, offline-first experience while maintaining our commitment to data privacy. Thank you to all the contributors who make these projects possible! 

## Why Paiperwork?

**Runs on Consumer Hardware** - We tested it with Core i3 laptops with 16GB of RAM on CPU mode (Qwen3 1.7b) and it performed well, so Paiperwork is good for not-so-powerful consumer hardware.

**Truly Portable** - Nothing to install, it's a portable app. Simply download and run.

**Version-Safe Updates** - When updating, nothing gets overwritten. You keep both the previous and updated apps in different folders with names like `Paiperwork V1.0.0`, `Paiperwork V1.0.1`, so you can always go back to a previous version if needed (unless there is a database upgrade - we'll inform about this in the app release notes).

## Documentation

Visit our [documentation site](https://Infinitai-cn.github.io/paiperwork/) for complete guides and tutorials (multi language).

Note: You may need to enable Paiperwork in Privacy and security in your system if it is detected as not safe when you try to open it.

## For Developers

Want to contribute or build from source? Check out our [**Developer Guide**](developer.md) for:
- Go environment setup (Windows, macOS, Linux)
- Source code compilation
- Development workflow
- Build scripts and tools
- Contribution guidelines


## Architecture

- **Backend**: Go server (`main.go`) that handles API requests and Ollama integration
- **Frontend**: Modern JavaScript application with modular architecture
- **Database**: Local encrypted storage with master key protection
- **AI Engine**: Powered by [Ollama](https://ollama.ai/) for local LLM inference
- **Cross-Platform**: Available for Windows, macOS, and Linux


## Core Features

### Privacy-First Foundation
- **Local Data Processing** - All AI operations run locally through Ollama, ensuring your data never leaves your device
- **End-to-End Encryption** - Conversations and documents encrypted using your Master Key
- **Zero Data Collection** - No telemetry or user data collected
- **Privacy-Focused Web Search** - Only search queries sent to the internet, never your personal data

### Intelligent Conversation
- **Advanced Chat Interface** - Intuitive messaging with regenerate, delete, and copy controls
- **Custom System Prompts** - Define exactly how the AI responds to your queries
- **Adaptive Insights** - AI learns your preferences over time for more personalized responses
- **Flexible Context Control** - Adjust memory capacity from 1K to 10M tokens based on your needs and system capabilities.
- **Visual Understanding** - Upload and discuss images with compatible models
- **Multiple Conversation Sessions** - Organize chats within the same Master Key topic
- **Export Options** - Save conversations as text, markdown, or HTML

### Code & Development
- **Syntax Highlighting** - Automatic language detection and color coding
- **Copy Code Functionality** - One-click code copying
- **Code Execution** - Run HTML code directly in a sandboxed environment
- **Line Numbers** - For easier code reference and discussion

### Document Intelligence
- **PDF & Text Processing** - Upload and analyze documents while maintaining privacy
- **Document Q&A** - Ask specific questions about your documents
- **Comprehensive Summaries** - Generate complete overviews of document content
- **Cross-Document Search** - Find information across your entire document collection
- **Semantic Understanding** - Search by meaning, not just keywords

### Translate
- **Document Translation** - Translate `.pdf`, `.txt`, and `.md` files with local AI models
- **Floating Preview Window** - Review and edit translated content before exporting
- **Flexible Scope Control** - Apply translation to selected pages, current page, or full document
- **Streaming Updates** - See translation updates progressively while generation is running
- **Export Translated Files** - Export final results as translated document outputs

### Data Visualization
- **Natural Language Charts** - Create visualizations by describing your data
- **Multiple Chart Types** - Pie, bar, line, scatter, area, radar, heat maps, and bubble charts
- **Interactive Results** - View and interact with generated visualizations
- **Custom Styling** - Specify colors, labels, and formatting in natural language

## Professional Document Creation
- **Document Templates** - Meeting minutes, business letters, technical reports, contracts, and more
- **Visual Template Designer** - Intuitive interface for creating multi-page documents
- **AI-Enhanced Content** - Improve text with intelligent suggestions
- **Export Options** - Share via email or copy formatted text

## Research Assistant
- **AI-Powered Web Research** - Intelligent search and information synthesis
- **Deep Search Option** - Follow links from initial results for comprehensive coverage
- **Research Reports** - Automatically organized findings with sources
- **Knowledge Base** - Store and organize research findings in personal collections
- **Knowledge Search** - Find connections across your stored information

## Visual Design Tools
- **HTML Style Transfer** - Convert image designs into working HTML/CSS code
- **Text Overlay Generator** - Create responsive text overlays for images
- **Design Rationale Analysis** - Get professional insights into design principles
- **Code Preview** - See generated HTML code in action

## Model Management
- **Ollama Integration** - Browse, download, and manage AI models
- **Size Options** - Choose model variants based on your hardware capabilities
- **Local Control** - Full management of your AI models
- **Parameter Customization** - Fine-tune model behavior for different tasks

## System Management
- **Database Monitoring** - Track storage usage and performance
- **Optimization Tools** - Clean and maintain your local database
- **Multilingual Interface** - Select your preferred language for the application
- **Performance Controls** - Balance capability and resource usage

---

*Paiperwork combines the power of AI with complete privacy, giving you a professional assistant that respects your data while providing powerful productivity tools across multiple domains.*
