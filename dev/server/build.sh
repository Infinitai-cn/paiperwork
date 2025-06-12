#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔨 Building Paiperwork for production distribution..."

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed or not in PATH"
    exit 1
fi

# Check and download dependencies
echo "📦 Checking dependencies..."
if [ -f "go.mod" ]; then
    echo "  Found go.mod, downloading dependencies..."
    go mod download
    if [ $? -ne 0 ]; then
        echo "  ❌ Failed to download dependencies"
        exit 1
    fi
    echo "  ✅ Dependencies ready"
else
    echo "  ℹ️  No go.mod found, using standard library only"
fi

# Remove existing dist directories if they exist
echo "🧹 Cleaning previous builds..."
rm -rf ../../dist/windows
rm -rf ../../dist/mac
rm -rf ../../dist/linux

# Create fresh dist directories
mkdir -p ../../dist/windows
mkdir -p ../../dist/mac
mkdir -p ../../dist/linux

echo "📦 Building executables..."

# Build for Windows (AMD64) - Disable CGO for pure Go builds
echo "  Building for Windows (AMD64)..."
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o ../../dist/windows/Paiperwork-server.exe main.go

if [ $? -eq 0 ]; then
    echo "  ✅ Windows build successful"
else
    echo "  ❌ Windows build failed"
    exit 1
fi

# Build for Mac (Apple Silicon - ARM64)
echo "  Building for macOS (Apple Silicon)..."
CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w" -o ../../dist/mac/Paiperwork-server main.go

if [ $? -eq 0 ]; then
    echo "  ✅ macOS (ARM64) build successful"
else
    echo "  ❌ macOS (ARM64) build failed"
    exit 1
fi

# Build for Mac (Intel - AMD64) - for compatibility
echo "  Building for macOS (Intel)..."
CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -ldflags="-s -w" -o ../../dist/mac/Paiperwork-server-intel main.go

if [ $? -eq 0 ]; then
    echo "  ✅ macOS (Intel) build successful"
else
    echo "  ❌ macOS (Intel) build failed"
    exit 1
fi

# Build for Linux (AMD64)
echo "  Building for Linux (AMD64)..."
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o ../../dist/linux/Paiperwork-server main.go

if [ $? -eq 0 ]; then
    echo "  ✅ Linux build successful"
else
    echo "  ❌ Linux build failed"
    exit 1
fi

echo "📁 Copying app files to distribution folders..."

# Copy app files to each platform
if [ -d "../app" ]; then
    cp -r ../app ../../dist/windows/
    cp -r ../app ../../dist/mac/
    cp -r ../app ../../dist/linux/
    echo "  ✅ App files copied to all platforms"
else
    echo "  ⚠️  Warning: ../app directory not found"
fi

# Create version info files
echo "📝 Creating version info..."
DATE=$(date "+%Y-%m-%d %H:%M:%S")
COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

for platform in windows mac linux; do
    cat > "../../dist/$platform/build-info.txt" << EOF
Paiperwork Server
Built: $DATE
Commit: $COMMIT
Platform: $platform
Go Version: $(go version)
EOF
done

# Make executables executable on Unix-like systems
chmod +x ../../dist/mac/Paiperwork-server
chmod +x ../../dist/mac/Paiperwork-server-intel
chmod +x ../../dist/linux/Paiperwork-server

echo ""
echo "🎉 Production build complete! Distribution packages created:"
echo "   📦 ../../dist/windows/ (Windows AMD64)"
echo "   📦 ../../dist/mac/ (macOS ARM64 + Intel)"
echo "   📦 ../../dist/linux/ (Linux AMD64)"
echo ""
echo "💡 Each package contains:"
echo "   • Paiperwork-server executable"
echo "   • app/ folder with web interface"
echo "   • build-info.txt with version details"
echo ""
echo "🚀 Ready for distribution!"