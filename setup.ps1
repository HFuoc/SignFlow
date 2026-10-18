[CmdletBinding()]
param([switch]$WithTests, [switch]$DesktopOnly)

$ErrorActionPreference = 'Stop'
$RepoRoot = $PSScriptRoot

function Invoke-SetupCommand {
    param([string]$Executable, [string[]]$Arguments)
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Setup failed: $Executable (exit $LASTEXITCODE)"
    }
}

foreach ($Tool in @('uv', 'npm.cmd', 'node')) {
    if (-not (Get-Command $Tool -ErrorAction SilentlyContinue)) {
        throw "Missing $Tool. Install uv and Node.js; see README.md, then reopen PowerShell."
    }
}
$NodeVersionText = & node --version
if ($LASTEXITCODE -ne 0) { throw 'Cannot read Node.js version.' }
$NodeVersion = [version]($NodeVersionText.Trim().TrimStart('v'))
if (-not (($NodeVersion.Major -eq 22 -and $NodeVersion.Minor -ge 12) -or $NodeVersion.Major -eq 24)) {
    throw 'Use Node 22.12+ (22.x) or 24.x.'
}

Push-Location $RepoRoot
try {
    $Python = Join-Path $RepoRoot '.venv\Scripts\python.exe'
    if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot '.venv'))) {
        Invoke-SetupCommand uv @('venv', '--python', '3.12', '.venv')
    }
    if (-not (Test-Path -LiteralPath $Python)) {
        throw 'Existing .venv has no Windows Python executable. Preserve it and resolve the environment before retrying.'
    }
    Invoke-SetupCommand $Python @('-c', 'import sys; sys.exit(sys.version_info[:2] != (3,12))')
    $Project = if ($WithTests) { '.[test]' } else { '.' }
    Invoke-SetupCommand uv @('pip', 'install', '--python', $Python, '-e', $Project)
    if (-not $DesktopOnly) {
        $WorkerRoot = Join-Path $RepoRoot '.design-cache\kvsl-phase0a\extraction-env'
        $WorkerPython = Join-Path $WorkerRoot 'Scripts\python.exe'
        if (-not (Test-Path -LiteralPath $WorkerRoot)) {
            Invoke-SetupCommand uv @('venv', '--python', '3.12', $WorkerRoot)
        }
        if (-not (Test-Path -LiteralPath $WorkerPython)) {
            throw 'Existing recognition environment is incomplete. It has been preserved.'
        }
        Invoke-SetupCommand $WorkerPython @('-c', 'import sys; sys.exit(sys.version_info[:2] != (3,12))')
        Invoke-SetupCommand uv @('pip', 'install', '--python', $WorkerPython, '-r', 'configs/recognition-requirements.txt')
        Invoke-SetupCommand $Python @('-m', 'app.desktop_collector.install_recognition_assets')
    }
    Push-Location (Join-Path $RepoRoot 'app\desktop_collector\web')
    try {
        Invoke-SetupCommand npm.cmd @('ci')
        Invoke-SetupCommand npm.cmd @('run', 'build')
    }
    finally { Pop-Location }
    Write-Host 'Desktop setup complete. Launch: .\run_app.ps1 -SkipBuild'
    if ($DesktopOnly) { Write-Host 'Recognition was skipped (-DesktopOnly).' }
    else { Write-Host 'CPU ViSign and TCN recognition installed. Additional providers: see README.md.' }
}
finally { Pop-Location }
