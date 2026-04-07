@echo off
setlocal enabledelayedexpansion

REM Get the directory where the script is located
cd /d "%~dp0"

echo 🔨 Building Paiperwork server for development...
echo ⚠️  macOS binaries now require Apple's toolchain on macOS (Tahoe update).
echo ⚠️  This Windows script will build Windows/Linux only. Run dev-build.sh on macOS for mac binaries.

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
    echo   Found go.mod at !MODULE_DIR!, ensuring dependencies are ready...
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

REM Build for Windows (current platform)
echo Building for Windows (current platform)...
go build -o "..\Paiperwork-server-dev-win.exe" main.go

if errorlevel 1 (
    echo ❌ Windows build failed
    exit /b 1
)
echo ✅ Windows build successful

REM macOS cross-compilation disabled on Windows (requires Xcode toolchain)
REM echo Building for macOS...
REM set GOOS=darwin
REM set GOARCH=amd64
REM go build -o "..\Paiperwork-server-dev-osx" main.go
REM 
REM if errorlevel 1 (
REM     echo ❌ macOS build failed
REM     exit /b 1
REM )
REM echo ✅ macOS build successful

REM Build for Linux using cross-compilation
echo Building for Linux...
set GOOS=linux
set GOARCH=amd64
go build -o "..\Paiperwork-server-dev-linux" main.go

if errorlevel 1 (
    echo ❌ Linux build failed
    exit /b 1
)
echo ✅ Linux build successful

echo.
echo 🎉 Development build complete! Executables created in dev folder:
echo    📦 Paiperwork-server-dev-win.exe (Windows)
echo    📦 Paiperwork-server-dev-linux (Linux)
echo.
echo ⚠️  macOS dev binaries are not produced by this Windows batch script.
echo    Run dev-build.sh on macOS for:
echo    • Paiperwork-server-dev-osx (macOS arm64)
echo    • Paiperwork-server-dev-osx-intel (macOS amd64)
echo.
echo 💡 To run the development server:
echo    ..\Paiperwork-server-dev-win.exe

pause