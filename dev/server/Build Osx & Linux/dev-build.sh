# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔨 Building Paiperwork server for development..."

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed or not in PATH"
    exit 1
fi

# Check and download dependencies
echo "📦 Checking dependencies..."
if [ -f "go.mod" ]; then
    echo "  Found go.mod, ensuring dependencies are ready..."
    go mod download
    if [ $? -ne 0 ]; then
        echo "  ❌ Failed to download dependencies"
        exit 1
    fi
    echo "  ✅ Dependencies ready"
fi

# Build directly in dev folder for development
echo "Building for macOS..."
go build -o ../Paiperwork-server-dev-osx main.go

# Build directly in dev folder for development
echo "Building for macOS (current platform)..."
go build -o ../Paiperwork-server-dev-osx main.go

if [ $? -eq 0 ]; then
    echo "✅ macOS build successful"
else
    echo "❌ macOS build failed"
    exit 1
fi

# Build for Windows using cross-compilation
echo "Building for Windows..."
GOOS=windows GOARCH=amd64 go build -o ../Paiperwork-server-dev-win.exe main.go

if [ $? -eq 0 ]; then
    echo "✅ Windows build successful"
else
    echo "❌ Windows build failed"
    exit 1
fi

# Build for Linux using cross-compilation
echo "Building for Linux..."
GOOS=linux GOARCH=amd64 go build -o ../Paiperwork-server-dev-linux main.go

if [ $? -eq 0 ]; then
    echo "✅ Linux build successful"
else
    echo "❌ Linux build failed"
    exit 1
fi

echo ""
echo "🎉 Development build complete! Executables created in dev folder:"
echo "   📦 Paiperwork-server-dev-osx (macOS)"
echo "   📦 Paiperwork-server-dev-win.exe (Windows)"
echo "   📦 Paiperwork-server-dev-linux (Linux)"
echo ""
echo "💡 To run the development server:"
echo "   ./Paiperwork-server-dev-osx"