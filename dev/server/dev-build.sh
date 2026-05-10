#!/bin/bash

# Always build from the server directory, regardless of where the script is run from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}" )" && pwd)"
cd "$SCRIPT_DIR"


echo "🔨 Building Paiperwork server for development..."

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

# Remove previous dev binaries
echo "🧹 Cleaning previous dev binaries..."
rm -f "$SCRIPT_DIR/../Paiperwork-server-dev-osx"
rm -f "$SCRIPT_DIR/../Paiperwork-server-dev-win.exe"
rm -f "$SCRIPT_DIR/../Paiperwork-server-dev-linux"
rm -f "$SCRIPT_DIR/../Paiperwork-server-dev-osx-intel"

echo "📦 Building executables..."

# Always build from the server directory, never from whatsapp-gateway-go
pushd "$SCRIPT_DIR" > /dev/null

# Build for Windows (AMD64) - Disable CGO for pure Go builds
echo "  Building for Windows (AMD64)..."
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o ../Paiperwork-server-dev-win.exe .
if [ $? -eq 0 ]; then
    echo "  ✅ Windows build successful"
else
    echo "  ❌ Windows build failed"
    exit 1
fi

# Build for Mac (Apple Silicon - ARM64)
echo "  Building for macOS (Apple Silicon)..."
build_macos_binary arm64 ../Paiperwork-server-dev-osx

# Build for Mac (Intel - AMD64) - for compatibility
echo "  Building for macOS (Intel)..."
build_macos_binary amd64 ../Paiperwork-server-dev-osx-intel

# Build for Linux (AMD64)
echo "  Building for Linux (AMD64)..."
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o ../Paiperwork-server-dev-linux .
if [ $? -eq 0 ]; then
    echo "  ✅ Linux build successful"
else
    echo "  ❌ Linux build failed"
    exit 1
fi

chmod +x ../Paiperwork-server-dev-osx
chmod +x ../Paiperwork-server-dev-osx-intel
chmod +x ../Paiperwork-server-dev-linux

popd > /dev/null

# --- Build WhatsApp Gateway ---
echo ""
echo "🎉 Development build complete! Executables created in dev folder:"
echo "   📦 Paiperwork-server-dev-osx (macOS arm64)"
echo "   📦 Paiperwork-server-dev-osx-intel (macOS amd64)"
echo "   📦 Paiperwork-server-dev-win.exe (Windows amd64)"
echo "   📦 Paiperwork-server-dev-linux (Linux amd64)"
echo ""
echo "💡 To run the development server on macOS:"
echo "   ./Paiperwork-server-dev-osx"
