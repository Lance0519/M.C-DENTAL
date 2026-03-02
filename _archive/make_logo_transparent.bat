@echo off
echo ========================================
echo Making Logo Transparent
echo ========================================
echo.

REM Try different Python commands
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Found: python
    python make_logo_transparent.py
    goto :end
)

python3 --version >nul 2>&1
if %errorlevel% == 0 (
    echo Found: python3
    python3 make_logo_transparent.py
    goto :end
)

py --version >nul 2>&1
if %errorlevel% == 0 (
    echo Found: py
    py make_logo_transparent.py
    goto :end
)

echo.
echo ERROR: Python not found!
echo.
echo Please install Python from https://www.python.org/downloads/
echo Or install Pillow and run manually:
echo   pip install Pillow
echo   python make_logo_transparent.py
echo.
pause

:end

