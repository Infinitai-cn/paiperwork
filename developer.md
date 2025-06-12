# 🛠️ Developer Guide

Welcome to Paiperwork development! This guide will help you set up your development environment and contribute to the project.

## 📋 Prerequisites

### System Requirements
- **Go 1.22.3+** - Backend server
- **Modern Web Browser** - For testing (Chrome, Firefox, Safari, Edge)
- **Git** - Version control
- **Text Editor/IDE** - VS Code, GoLand, or your preferred editor

### Recommended Tools
- **Go Extension** for VS Code
- **Live Server Extension** for frontend testing
- **Thunder Client** or Postman for API testing

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Infinitai-cn/paiperwork.git
cd paiperwork
```

### 2. Set Up Go Environment

#### Windows
1. Download Go from [golang.org](https://golang.org/download/)
2. Install the MSI package
3. Verify installation:
   ```cmd
   go version
   ```

#### macOS
```bash
# Using Homebrew (recommended)
brew install go

# Or download from golang.org
# Verify installation
go version
```

#### Linux (Ubuntu/Debian)
```bash
# Remove old Go versions
sudo rm -rf /usr/local/go

# Download and install Go 1.22.3+
wget https://golang.org/dl/go1.22.3.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.22.3.linux-amd64.tar.gz

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH=$PATH:/usr/local/go/bin

# Verify installation
go version
```

### 3. Initialize Go Module (if needed)

If the `go.mod` file is missing in the development folder:

```bash
cd dev/server
go mod init Paiperwork
go mod tidy
```

## 🔧 Development Workflow

### Project Structure
```
paiperwork/
├── dev/
│   ├── app/                    # Frontend application
│   │   ├── index.html         # Main entry point
│   │   ├── welcome.html       # Welcome screen
│   │   └── core/              # Core application files
│   │       ├── js/            # JavaScript modules
│   │       ├── css/           # Stylesheets
│   │       └── images/        # Assets
│   └── server/                # Go backend server
│       ├── main.go           # Server entry point
│       ├── dev-build.sh      # Development build script
│       ├── dev-build.bat     # Development build (Windows)
│       ├── build.sh          # Production build script
│       └── build.bat         # Production build (Windows)
├── github-help/              # Documentation website
└── go.mod                    # Go module file

// developer.md, readme.md, version.json, and licenses are part of github setup, not needed for project functionality.
```

### Development Builds

Development builds include debug information and are optimized for development:

#### Linux/macOS
```bash
cd dev/server
./dev-build.sh
```

#### Windows
```cmd
cd dev\server
dev-build.bat
```

This creates platform-specific development binaries:
- `Paiperwork-server-dev-linux`
- `Paiperwork-server-dev-osx` 
- `Paiperwork-server-dev-win.exe`

This binaries will be created at the app folder level.

### Production Builds

Production builds are optimized and smaller:

#### Linux/macOS
```bash
cd dev/server
./build.sh
```

#### Windows
```cmd
cd dev\server
build.bat
```

This binaries and js files will be created inside the dist folder.

## 🧑‍💻 Development Setup

### 1. Start the Development Server

```bash
cd dev
./Paiperwork-server-dev-osx    # macOS
./Paiperwork-server-dev-linux  # Linux
# or
Paiperwork-server-dev-win.exe  # Windows
```

The server will start on `http://localhost:7777` by default.

### 2. Frontend Development

The frontend is pure JavaScript/HTML/CSS. Key files:

- **`dev/app/index.html`** - Main application entry
- **`dev/app/core/js/app.js`** - Main application logic
- **`dev/app/core/js/`** - Modular JavaScript components
- **`dev/app/core/css/`** - Styling and themes

### 3. Making Changes

1. **Frontend changes** - Edit files in `dev/app/` and refresh browser
2. **Backend changes** - Edit `dev/server/main.go` and rebuild:
   ```bash
   cd dev/server
   ./dev-build.sh  # or dev-build.bat on Windows
   ```

## 🔍 Key Development Areas

### Frontend Architecture
- **Modular Design** - Each feature is in its own JS module
- **No Build Process** - Direct JavaScript, no webpack/bundling required
- **Modern JS** - Uses ES6+ features, async/await
- **Local Storage** - Encrypted database using SQL.js

### Backend (Go Server)
- **Simple HTTP Server** - Handles API requests and static files
- **Ollama Integration** - Proxies requests to Ollama API
- **CORS Handling** - Enables frontend-backend communication
- **File Operations** - Document upload/processing

### Key Technologies
- **Frontend**: Vanilla JavaScript, HTML5, CSS3, SQL.js, PDF.js, html2canvas
- **Backend**: Go standard library, HTTP server
- **AI**: Ollama integration for local LLM inference
- **Database**: Local encrypted storage with SQL.js

## 🧪 Testing

### Manual Testing
1. Start development server
2. Open `http://localhost:7777` in browser
3. Test features:
   - Chat functionality
   - Document upload
   - Data visualization
   - Model management

### Browser Developer Tools
- Use browser DevTools for debugging
- Check console for JavaScript errors
- Monitor network requests to backend

## 🚦 Common Development Tasks

### Adding New Features
1. Create new JS module in `dev/app/core/js/`
2. Add HTML structure to appropriate page
3. Add CSS styling in `dev/app/core/css/`
4. Test functionality

### Modifying the Server
1. Edit `dev/server/main.go`
2. Run development build
3. Restart server
4. Test API endpoints

### Adding Dependencies
```bash
cd dev/server
go get package-name
go mod tidy
```

## 🐛 Debugging

### Common Issues

**Server won't start:**
- Check if Ollama is running
- Verify Go installation
- Check for port conflicts (7777)

**Frontend errors:**
- Check browser console
- Verify server is running
- Check CORS settings

**Build failures:**
- Ensure Go version is 1.22.3+
- Run `go mod tidy`
- Check file permissions on build scripts

### Debug Mode
Development builds include additional logging and debug information.

## 📝 Code Style

### JavaScript
- Use ES6+ features
- Async/await for asynchronous operations
- Modular structure with clear separation of concerns
- Comments for complex logic

### Go
- Follow standard Go conventions
- Use `gofmt` for formatting
- Clear variable names
- Error handling for all operations

## 🚀 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**
   ```bash
   git commit -m "Add amazing feature for document processing"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Create a Pull Request**

## 📚 Additional Resources

### Go Learning Resources
- [Official Go Documentation](https://golang.org/doc/)
- [Go by Example](https://gobyexample.com/)
- [Effective Go](https://golang.org/doc/effective_go.html)

### JavaScript Resources
- [MDN Web Docs](https://developer.mozilla.org/)
- [JavaScript.info](https://javascript.info/)

### Project-Specific
- [Ollama Documentation](https://github.com/ollama/ollama)
- [SQL.js Documentation](https://sql.js.org/documentation/)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)

## 💡 Tips for Success

1. **Start Small** - Begin with minor changes to understand the codebase
2. **Use the Browser** - Most debugging can be done with browser DevTools
3. **Read the Code** - The JavaScript is well-structured and readable
4. **Test Often** - Frequent testing prevents complex debugging sessions
5. **Ask Questions** - Use GitHub Issues for questions and discussions

## 🎯 Next Steps

Ready to contribute? Here are some good starting points:

1. **Fix a Bug** - Check [GitHub Issues](https://github.com/Infinitai-cn/paiperwork/issues) for bugs
2. **Improve Documentation** - Help make the docs even better
3. **Add Features** - Propose new functionality
4. **Optimize Performance** - Find areas for improvement

Happy coding! 🎉
