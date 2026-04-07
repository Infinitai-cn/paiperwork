@echo off
setlocal enabledelayedexpansion

REM Get the directory where the script is located
cd /d "%~dp0"

echo 🔨 Building Paiperwork for production distribution...
echo ⚠️  macOS binaries now require Apple's clang/SDK on macOS (Tahoe update).
echo ⚠️  Run build.sh on macOS to produce mac distributions; this Windows script skips them.

REM Check if Go is installed
go version >nul 2>&1
if errorlevel 1 (
    echo ❌ Go is not installed or not in PATH
    exit /b 1
)

set "MODULE_FILE="
set "MODULE_DIR="
for /f "usebackq delims=" %%i in (`go env GOMOD 2^>nul`) do set "MODULE_FILE=%%i"
if defined MODULE_FILE (
    if /I not "!MODULE_FILE!"=="NUL" (
        for %%i in ("!MODULE_FILE!") do set "MODULE_DIR=%%~dpi"
        if defined MODULE_DIR if "!MODULE_DIR:~-1!"=="\" set "MODULE_DIR=!MODULE_DIR:~0,-1!"
    )
)

REM Check and download dependencies
echo 📦 Checking dependencies...
if defined MODULE_DIR if exist "!MODULE_DIR!\go.mod" (
    echo   Found go.mod at !MODULE_DIR!, downloading dependencies...
    pushd "!MODULE_DIR!" >nul
    go mod download
    set "DOWNLOAD_EXIT=!ERRORLEVEL!"
    popd >nul
    if not "!DOWNLOAD_EXIT!"=="0" (
        echo   ❌ Failed to download dependencies
        exit /b 1
    )
    echo   ✅ Dependencies ready
) else (
    echo   ℹ️  No go.mod found, using standard library only
)

REM Remove existing dist directories if they exist
echo 🧹 Cleaning previous builds...
if exist "..\..\dist\windows" rmdir /s /q "..\..\dist\windows"
if exist "..\..\dist\mac" rmdir /s /q "..\..\dist\mac"
if exist "..\..\dist\linux" rmdir /s /q "..\..\dist\linux"

REM Create fresh dist directories
mkdir "..\..\dist\windows" 2>nul
mkdir "..\..\dist\mac" 2>nul
mkdir "..\..\dist\linux" 2>nul

echo 📦 Building executables...

REM Build for Windows (AMD64)
echo   Building for Windows (AMD64)...
set CGO_ENABLED=0
set GOOS=windows
set GOARCH=amd64
go build -ldflags="-s -w" -o "..\..\dist\windows\Paiperwork-server.exe" main.go

if errorlevel 1 (
    echo   ❌ Windows build failed
    exit /b 1
)
echo   ✅ Windows build successful

REM macOS (Apple Silicon) build disabled on Windows (requires Xcode toolchain)
REM echo   Building for macOS (Apple Silicon)...
REM set GOOS=darwin
REM set GOARCH=arm64
REM go build -ldflags="-s -w" -o "..\..\dist\mac\Paiperwork-server" main.go
REM 
REM if errorlevel 1 (
REM     echo   ❌ macOS (ARM64) build failed
REM     exit /b 1
REM )
REM echo   ✅ macOS (ARM64) build successful

REM macOS (Intel) build disabled on Windows (requires Xcode toolchain)
REM echo   Building for macOS (Intel)...
REM set GOOS=darwin
REM set GOARCH=amd64
REM go build -ldflags="-s -w" -o "..\..\dist\mac\Paiperwork-server-intel" main.go
REM 
REM if errorlevel 1 (
REM     echo   ❌ macOS (Intel) build failed
REM     exit /b 1
REM )
REM echo   ✅ macOS (Intel) build successful

REM Build for Linux (AMD64)
echo   Building for Linux (AMD64)...
set GOOS=linux
set GOARCH=amd64
go build -ldflags="-s -w" -o "..\..\dist\linux\Paiperwork-server" main.go

if errorlevel 1 (
    echo   ❌ Linux build failed
    exit /b 1
)
echo   ✅ Linux build successful

echo 📁 Copying app files to distribution folders...

REM Copy app files to each platform
if exist "..\app" (
    xcopy "..\app" "..\..\dist\windows\app\" /e /i /y >nul
    xcopy "..\app" "..\..\dist\mac\app\" /e /i /y >nul
    xcopy "..\app" "..\..\dist\linux\app\" /e /i /y >nul
    echo   ✅ App files copied to all platforms
) else (
    echo   ⚠️  Warning: ..\app directory not found
)

REM Create version info files
echo 📝 Creating version info...
for /f "tokens=*" %%i in ('date /t') do set BUILD_DATE=%%i
for /f "tokens=*" %%i in ('time /t') do set BUILD_TIME=%%i
for /f "tokens=*" %%i in ('git rev-parse --short HEAD 2^>nul') do set COMMIT=%%i
if "!COMMIT!"=="" set COMMIT=unknown

for %%p in (windows mac linux) do (
    echo Paiperwork Server > "..\..\dist\%%p\build-info.txt"
    echo Built: !BUILD_DATE! !BUILD_TIME! >> "..\..\dist\%%p\build-info.txt"
    echo Commit: !COMMIT! >> "..\..\dist\%%p\build-info.txt"
    echo Platform: %%p >> "..\..\dist\%%p\build-info.txt"
    go version >> "..\..\dist\%%p\build-info.txt"
)

echo.
echo 🎉 Production build complete! Distribution packages created:
echo    📦 ..\..\dist\windows\ (Windows AMD64)
echo    📦 ..\..\dist\mac\ (macOS ARM64 + Intel)
echo    📦 ..\..\dist\linux\ (Linux AMD64)
echo.
echo 💡 Each package contains:
echo    • Paiperwork-server executable
echo    • app\ folder with web interface
echo    • build-info.txt with version details
echo.
echo 🚀 Ready for distribution!

pause