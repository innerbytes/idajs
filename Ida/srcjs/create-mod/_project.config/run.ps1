npm run sync

# Function to read IdaJS installation directory from .idajs.json
function Get-IdaJsPath {
    # Try local config first, then user home config
    $configPaths = @(
        (Join-Path -Path $PSScriptRoot -ChildPath ".idajs.json"),
        (Join-Path -Path $env:USERPROFILE -ChildPath ".idajs.json")
    )
    
    foreach ($configPath in $configPaths) {
        if (Test-Path $configPath) {
            $config = Get-Content $configPath -Raw | ConvertFrom-Json
            if ($config.installDir) {
                return $config.installDir
            }
        }
    }
    
    return $null
}

# Get IdaJS installation path
$idaJsPath = Get-IdaJsPath
if (-not $idaJsPath) {
    Write-Error "Error: .idajs.json not found in current directory or user home directory."
    Write-Error "Please build IdaJS first."
    exit 1
}

if (-not (Test-Path $idaJsPath)) {
    Write-Error "Error: IdaJS installation directory does not exist: $idaJsPath"
    Write-Error "Please build IdaJS first."
    exit 1
}

# Look for LBA2.exe in Debug folder first, then Release
$exePath = $null
$workingDir = $null

$debugPath = Join-Path -Path $idaJsPath -ChildPath "Debug\LBA2.exe"
if (Test-Path $debugPath) {
    $exePath = $debugPath
    $workingDir = Join-Path -Path $idaJsPath -ChildPath "Debug"
}
else {
    $releasePath = Join-Path -Path $idaJsPath -ChildPath "Release\LBA2.exe"
    if (Test-Path $releasePath) {
        $exePath = $releasePath
        $workingDir = Join-Path -Path $idaJsPath -ChildPath "Release"
    }
}

if (-not $exePath) {
    Write-Error "Error: LBA2.exe not found in Debug or Release folders."
    Write-Error "Please build IdaJS first."
    exit 1
}

# Set environment variables
$env:LBA_IDA_MOD = $args[0]
$env:LBA_IDA_NOLOGO = '1'

# Run the executable and wait for it to finish
Start-Process -FilePath $exePath -WorkingDirectory $workingDir
npm run watch
