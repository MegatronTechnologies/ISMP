@echo off
setlocal
cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_windows.ps1"
if errorlevel 1 (
    echo.
    echo Installation failed. Read the error above.
    pause
    exit /b 1
)

echo.
echo Installation completed. Start the server with start_windows.cmd.
pause
