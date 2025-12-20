param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("Debug", "Release")]
    [string]$BuildType
)

# Copy test files
Remove-Item '..\GameRun\mods\tests' -Recurse -Force -ErrorAction SilentlyContinue
mkdir '..\GameRun\mods\tests' -Force
Copy-Item -Path 'srcjs\tests\*' -Destination '..\GameRun\mods\tests' -Recurse -Force

# Copy engine files to be available for unit tests
mkdir '..\GameRun\mods\tests\srcjs' -Force
Copy-Item -Path 'srcjs\*.js' -Destination '..\GameRun\mods\tests\srcjs' -Recurse -Exclude 'srcjs\tests\*'

# Set environment variables
$env:LBA_IDA_MOD = 'tests'
$env:LBA_IDA_TESTMODE = 1
$env:LBA_IDA_NOLOGO = 1
$env:LBA_IDA_CFG = '..\Ida\srcjs\tests\test.cfg'
$env:ADELINE = '..\GameRun'

# Helper function to try using a specific build type
function TryBuildType($buildType) {
    $exePath = "..\$buildType\LBA2.exe"
    if (Test-Path $exePath) {
        Write-Host "Using $buildType build: $exePath"
        return @{
            ExePath    = $exePath
            WorkingDir = "..\$buildType"
            Found      = $true
        }
    }
    return @{ Found = $false }
}

# Run the executable and wait for it to finish
$result = $null

if ($BuildType) {
    # BuildType parameter specified - only look for the specified build
    $result = TryBuildType $BuildType
    if (-not $result.Found) {
        Write-Error "LBA2.exe not found in $BuildType folder. Please build the $BuildType configuration first."
        exit 1
    }
}
else {
    # No BuildType specified - try Debug first, then Release
    $result = TryBuildType "Debug"
    if (-not $result.Found) {
        $result = TryBuildType "Release"
        if (-not $result.Found) {
            Write-Error "LBA2.exe not found in either Debug or Release folders. Please build the project first."
            exit 1
        }
    }
}

$exePath = $result.ExePath
$workingDir = $result.WorkingDir

$process = Start-Process -FilePath $exePath -WorkingDirectory $workingDir -NoNewWindow -Wait -PassThru

# Propagate exit code from LBA2.exe
exit $process.ExitCode
