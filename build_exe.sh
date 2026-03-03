#!/bin/bash
# ══════════════════════════════════════════════════════════════
#  ECU Dashboard — Build OBD2 Bridge binary (Mac / Linux)
#  Run this ONCE on your developer machine
#  Then upload dist/ECU_OBD2_Bridge to GitHub Releases
# ══════════════════════════════════════════════════════════════

set -e

echo ""
echo "  ECU Dashboard — Building OBD2 Bridge"
echo "  ======================================"
echo ""

# Install dependencies
echo "  [1/3] Installing dependencies..."
pip install pyinstaller obd flask flask-cors --quiet

echo "  [2/3] Building binary with PyInstaller..."
pyinstaller \
    --onefile \
    --name "ECU_OBD2_Bridge" \
    --add-data "README.md:." \
    obd2_bridge.py

echo ""
echo "  [3/3] Done!"
echo ""
echo "  ✓ Output: dist/ECU_OBD2_Bridge"
echo ""
echo "  Next steps:"
echo "    1. Go to github.com/YOUR_USERNAME/ecu-dashboard/releases"
echo "    2. Create a new release and upload dist/ECU_OBD2_Bridge"
echo "    3. Update the download URL in src/components/OBDModal.tsx"
echo ""
