$ErrorActionPreference = 'Stop'

$detectorRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvRoot = Join-Path $detectorRoot '.venv'
$venvPython = Join-Path $venvRoot 'Scripts\python.exe'

Push-Location -LiteralPath $detectorRoot
try {
    if (-not (Test-Path -LiteralPath $venvPython)) {
        $pythonCommand = Get-Command py -ErrorAction SilentlyContinue
        if ($pythonCommand) {
            & py -3.12 -m venv $venvRoot
        } else {
            $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
            if (-not $pythonCommand) {
                throw "Python 3.12 is required. Install it from python.org and enable Add Python to PATH."
            }
            & python -m venv $venvRoot
        }

        if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $venvPython)) {
            throw "Unable to create the Python environment. Install Python 3.12 x64 and run this script again."
        }
    }

    & $venvPython -m pip install --upgrade pip
    if ($LASTEXITCODE -ne 0) { throw "Unable to upgrade pip." }

    & $venvPython -m pip install -r (Join-Path $detectorRoot 'requirements.txt')
    if ($LASTEXITCODE -ne 0) { throw "Unable to install edge-server dependencies." }

    $envPath = Join-Path $detectorRoot '.env'
    if (-not (Test-Path -LiteralPath $envPath)) {
        Copy-Item -LiteralPath (Join-Path $detectorRoot '.env.example') -Destination $envPath
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "ISMP Edge Stream Service is ready." -ForegroundColor Green
Write-Host "Start it with: powershell -ExecutionPolicy Bypass -File .\run_windows.ps1"
Write-Host "Or double-click start_windows.cmd."
