[CmdletBinding()]
param(
    [switch]$NoAutoConnect,
    [switch]$SkipBuild,
    [switch]$Legacy,
    [switch]$SmokeTest
)

$RepoRoot = $PSScriptRoot
$PythonPath = Join-Path $RepoRoot ".venv\Scripts\python.exe"
$WebRoot = Join-Path $RepoRoot "app\desktop_collector\web"
$BuildRoot = Join-Path $WebRoot "build"

function Stop-Launch {
    param(
        [Parameter(Mandatory)]
        [string]$Message,
        [int]$ExitCode = 1
    )
2
    [Console]::Error.WriteLine($Message)
    exit $ExitCode
}

function Test-ProductionBuild {
    $IndexPath = Join-Path $BuildRoot "index.html"
    $AssetsPath = Join-Path $BuildRoot "assets"
    if (-not (Test-Path -LiteralPath $IndexPath -PathType Leaf)) {
        return $false
    }
    if (-not (Test-Path -LiteralPath $AssetsPath -PathType Container)) {
        return $false
    }

    $JavaScriptBundle = @(Get-ChildItem -LiteralPath $AssetsPath -Filter "*.js" -File -ErrorAction SilentlyContinue)
    $StyleBundle = @(Get-ChildItem -LiteralPath $AssetsPath -Filter "*.css" -File -ErrorAction SilentlyContinue)
    return $JavaScriptBundle.Count -gt 0 -and $StyleBundle.Count -gt 0
}

if (-not (Test-Path -LiteralPath $PythonPath -PathType Leaf)) {
    Stop-Launch @"
Khong tim thay Python cua du an tai .venv.
Hay tao .venv bang Python 3.12 va cai du an truoc khi chay lai.
"@
}

$VersionOk = & $PythonPath -c "import sys; print(int(sys.version_info[:2] == (3, 12)))"
if ($LASTEXITCODE -ne 0 -or $VersionOk -ne "1") {
    Stop-Launch "Ung dung yeu cau .venv dung Python 3.12."
}

if ($Legacy) {
    if ($SkipBuild) {
        Stop-Launch "-SkipBuild chi dung voi giao dien React/PyWebView mac dinh."
    }

    $Arguments = @("-m", "app.desktop_collector.main")
    if ($NoAutoConnect) {
        $Arguments += "--no-auto-connect"
    }
    if ($SmokeTest) {
        $Arguments += "--smoke-test"
    }
}
else {
    if ($NoAutoConnect) {
        Stop-Launch "-NoAutoConnect hien chi ho tro duong lui PySide: .\run_app.ps1 -Legacy -NoAutoConnect"
    }

    if ($SkipBuild) {
        if (-not (Test-ProductionBuild)) {
            Stop-Launch "Khong tim thay ban build React hop le. Hay chay .\run_app.ps1 khong kem -SkipBuild."
        }
    }
    else {
        if (-not (Test-Path -LiteralPath (Join-Path $WebRoot "package.json") -PathType Leaf)) {
            Stop-Launch "Khong tim thay cau hinh React/Vite tai app\desktop_collector\web."
        }
        if (-not (Test-Path -LiteralPath (Join-Path $WebRoot "node_modules") -PathType Container)) {
            Stop-Launch "Thieu dependency web. Hay tu chay npm ci trong app\desktop_collector\web roi thu lai."
        }

        [string]$NpmExecutable = Get-Command "npm.cmd" -ErrorAction SilentlyContinue |
            Select-Object -First 1 -ExpandProperty Path
        if ([string]::IsNullOrWhiteSpace($NpmExecutable)) {
            Stop-Launch "Khong tim thay npm. Hay cai Node.js/npm roi thu lai."
        }

        Push-Location $WebRoot
        try {
            & $NpmExecutable run build
            $BuildExitCode = $LASTEXITCODE
        }
        finally {
            Pop-Location
        }
        if ($BuildExitCode -ne 0) {
            $ReportedBuildExitCode = if ($null -eq $BuildExitCode) { 1 } else { $BuildExitCode }
            Stop-Launch "Build React that bai; ung dung khong chuyen sang PySide." $ReportedBuildExitCode
        }
        if (-not (Test-ProductionBuild)) {
            Stop-Launch "Build React hoan tat nhung khong tao bundle production hop le."
        }
    }

    $Arguments = @("-m", "app.desktop_collector.shell")
    if ($SmokeTest) {
        $Arguments += "--smoke-test"
    }
}

$ApplicationExitCode = 1
Push-Location $RepoRoot
try {
    & $PythonPath @Arguments
    if ($null -ne $LASTEXITCODE) {
        $ApplicationExitCode = $LASTEXITCODE
    }
}
finally {
    Pop-Location
}

if ($ApplicationExitCode -ne 0) {
    Stop-Launch "Ung dung khoi dong that bai (ma thoat $ApplicationExitCode)." $ApplicationExitCode
}

exit $ApplicationExitCode
