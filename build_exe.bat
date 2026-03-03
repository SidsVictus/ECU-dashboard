@echo off
REM ══════════════════════════════════════════════════════════════
REM  ECU Dashboard — Build OBD2 Bridge .exe (Windows)
REM  Run this ONCE on your developer machine to create the .exe
REM  Then upload dist/ECU_OBD2_Bridge.exe to GitHub Releases
REM ══════════════════════════════════════════════════════════════

echo.
echo  ECU Dashboard — Building OBD2 Bridge .exe
echo  ==========================================
echo.

REM Check Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Python not found. Install Python 3.8+ from python.org
    pause
    exit /b 1
)

REM Install / upgrade pip dependencies
echo  [1/3] Installing dependencies...
pip install pyinstaller obd flask flask-cors --quiet
if %errorlevel% neq 0 (
    echo  ERROR: pip install failed. Check your internet connection.
    pause
    exit /b 1
)

echo  [2/3] Building .exe with PyInstaller...
pyinstaller ^
    --onefile ^
    --noconsole ^
    --name "ECU_OBD2_Bridge" ^
    --add-data "README.md;." ^
    obd2_bridge.py

if %errorlevel% neq 0 (
    echo  ERROR: PyInstaller build failed.
    pause
    exit /b 1
)

echo.
echo  [3/3] Done!
echo.
echo  ✓ Output: dist\ECU_OBD2_Bridge.exe
echo.
echo  Next steps:
echo    1. Go to github.com/YOUR_USERNAME/ecu-dashboard/releases
echo    2. Click "Create a new release"
echo    3. Upload dist\ECU_OBD2_Bridge.exe
echo    4. Update the download URL in src/components/OBDModal.tsx
echo.

pause
