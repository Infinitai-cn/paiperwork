#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}" )" && pwd)"
cd "$SCRIPT_DIR"

echo "🔨 Building Paiperwork for production distribution..."

build_macos_binary() {
    local arch="$1"
    local output="$2"

    local clang_bin
    local clangxx_bin
    local sdkroot_path

    clang_bin=$(xcrun --sdk macosx -f clang 2>/dev/null)
    clangxx_bin=$(xcrun --sdk macosx -f clang++ 2>/dev/null)
    sdkroot_path=$(xcrun --sdk macosx --show-sdk-path 2>/dev/null)

    if [ -z "$clang_bin" ] || [ -z "$clangxx_bin" ] || [ -z "$sdkroot_path" ]; then
        echo "  ❌ Xcode command line tools are required (clang/clang++/SDK missing)"
        exit 1
    fi

    GOOS=darwin GOARCH="$arch" CGO_ENABLED=1 \
    CC="$clang_bin" CXX="$clangxx_bin" SDKROOT="$sdkroot_path" \
    go build -ldflags="-linkmode external -s -w" -o "$output" .

    if [ $? -ne 0 ]; then
        echo "  ❌ macOS ($arch) build failed"
        exit 1
    fi

    echo "  ✅ macOS ($arch) build successful"
}

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed or not in PATH"
    exit 1
fi

MODULE_FILE=$(go env GOMOD 2>/dev/null)
MODULE_DIR=""
if [ -n "$MODULE_FILE" ] && [ "$MODULE_FILE" != "/dev/null" ]; then
    MODULE_DIR="$(dirname "$MODULE_FILE")"
fi

# Check and download dependencies
echo "📦 Checking dependencies..."
if [ -n "$MODULE_DIR" ] && [ -f "$MODULE_DIR/go.mod" ]; then
    echo "  Found go.mod at $MODULE_DIR, downloading dependencies..."
    (
        cd "$MODULE_DIR" && go mod download
    )
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

pushd "$SCRIPT_DIR" > /dev/null

# Build for Windows (AMD64) - Disable CGO for pure Go builds
echo "  Building for Windows (AMD64)..."
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o ../../dist/windows/Paiperwork-server.exe .

if [ $? -eq 0 ]; then
    echo "  ✅ Windows build successful"
else
    echo "  ❌ Windows build failed"
    exit 1
fi

# Build for Mac (Apple Silicon - ARM64)
echo "  Building for macOS (Apple Silicon)..."
build_macos_binary arm64 ../../dist/mac/Paiperwork-server

# Build for Mac (Intel - AMD64) - for compatibility
echo "  Building for macOS (Intel)..."
build_macos_binary amd64 ../../dist/mac/Paiperwork-server-intel

# Build for Linux (AMD64)
echo "  Building for Linux (AMD64)..."
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o ../../dist/linux/Paiperwork-server .

if [ $? -eq 0 ]; then
    echo "  ✅ Linux build successful"
else
    echo "  ❌ Linux build failed"
    popd > /dev/null
    exit 1
fi

popd > /dev/null

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