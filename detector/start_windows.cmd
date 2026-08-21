@echo off
setlocal
cd /d "%~dp0"

if not exist "%~dp0.venv\Scripts\python.exe" (
    echo The Python environment is missing.
    echo Run install_windows.cmd first.
    pause
    exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run_windows.ps1"
if errorlevel 1 (
    echo.
    echo The edge server stopped with an error.
    pause
    exit /b 1
)
