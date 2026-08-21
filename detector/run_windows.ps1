$ErrorActionPreference = 'Stop'

$detectorRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvPython = Join-Path $detectorRoot '.venv\Scripts\python.exe'

if (-not (Test-Path -LiteralPath $venvPython)) {
    throw "Python environment not found. Run detector\setup_windows.ps1 first."
}

Set-Location -LiteralPath $detectorRoot
& $venvPython run.py

if ($LASTEXITCODE -ne 0) {
    throw "ISMP Edge Stream Service stopped with exit code $LASTEXITCODE."
}
