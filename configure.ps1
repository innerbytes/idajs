<#
.SYNOPSIS
    A script to configure the project by generating cfg-defines.h and preparing necessary folders.

.DESCRIPTION
    This script generates cfg-defines.h based on the build type (Debug or Release) and user input.
    In Debug mode, it prompts the user to select the LBA2 Common directory, ensuring it contains LBA2.HQR.

.PARAMETER BuildType
    Specifies the build type. Acceptable values are "Debug" or "Release".

.EXAMPLE
    ./configure.ps1 -BuildType Debug
#>

param (
    [string]$BuildType = "Release"
)

# Ensure the BuildType parameter is valid
if ($BuildType -notin @("Debug", "Release")) {
    Write-Error "Invalid BuildType. Use 'Debug' or 'Release'."
    exit 1
}

# Define hardcoded revisions for git submodules (used when downloading from ZIP)
# IMPORTANT: Update these revisions when git modules are updated in the repository
$submoduleRevisions = @{
    "SDL"    = "fa24d868ac2f8fd558e4e914c9863411245db8fd"
    "soloud" = "e82fd32c1f62183922f08c14c814a02b58db1873"
}

# Function to show folder selection dialog
function Select-Folder {
    Add-Type -AssemblyName System.Windows.Forms
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = "Select LBA2 Common directory (where HQR files are):"
    $dialog.ShowNewFolderButton = $true
    if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        return $dialog.SelectedPath
    }
    else {
        Write-Host "No folder selected. Exiting." -ForegroundColor Yellow
        exit 1
    }
}

# Function to validate directory contains LBA2.HQR
function Validate-LBA2Directory($directory) {
    $requiredFile = Join-Path $directory "LBA2.HQR"
    return Test-Path $requiredFile
}

# Function to normalize paths and ensure they end with a single backslash and wrapped in quotes
function Normalize-Path($path) {
    $normalizedPath = $path.TrimEnd('\') + '\'
    $normalizedPath = $normalizedPath -replace '\\+', '\\'
    return "`"$normalizedPath`""
}

$isDebug = $BuildType -eq "Debug"

# if packages.config doesn't exist in Ida, warning the user
if (-not (Test-Path (Join-Path "Ida" "packages.config"))) {
    Write-Host "Warning: packages.config not found in Ida directory. The project might not build if it depends on any NuGet packages." -ForegroundColor Yellow
} 
else {
    Copy-Item -Path (Join-Path "Ida" "packages.config") -Destination (Join-Path "SOURCES" "packages.config") -Force
}

# Prompt user to select LBA2 Common directory (Debug mode only)
$pathResource = ""
# if ($isDebug) {
do {
    Write-Host "Please select the LBA2 Common directory from your Steam or GoG game installation. This configuration script or IdaJS will not modify any files in your game directory. It will only read the game assets from it." -ForegroundColor Yellow
    Write-Host "Opening folder selection dialog for LBA2 Common directory..."
    $pathResource = Select-Folder
    if (-not (Validate-LBA2Directory $pathResource)) {
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show("LBA2.HQR not found in the selected directory. Please select a valid LBA2 Common directory.", "Error", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
    }
} while (-not (Validate-LBA2Directory $pathResource))
Write-Host "Selected valid LBA2 Common directory: $pathResource" -ForegroundColor Green
#}

$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Definition

# if ($isDebug) {

# Create necessary folders if they don't exist
$gameRunFolders = @(
    "GameRun",
    "GameRun\\save",
    "GameRun\\save\\shoot",
    "GameRun\\bugs",
    "GameRun\\mods",
    "Debug",
    "Release"
)

foreach ($folder in $gameRunFolders) {
    $fullPath = Join-Path $scriptDirectory $folder
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
    }
}

# Copy LBA2.cfg from SOURCES to the appropriate build folder only if it doesn't already exist
$buildFolder = if ($isDebug) { "Debug" } else { "Release" }
$buildConfigPath = Join-Path $buildFolder "LBA2.cfg"
if (-not (Test-Path $buildConfigPath)) {
    Copy-Item -Path (Join-Path "SOURCES" "LBA2.cfg") -Destination $buildConfigPath
}

# In Release mode, modify the config file to enable fullscreen by default
if (-not $isDebug -and (Test-Path $buildConfigPath)) {
    $configContent = Get-Content $buildConfigPath -Raw
    $configContent = $configContent -replace "FullScreen: 0", "FullScreen: 1"
    Set-Content -Path $buildConfigPath -Value $configContent -NoNewline
}

$pathResource = Normalize-Path $pathResource
$pathSave = Normalize-Path (Join-Path $scriptDirectory "GameRun\save\")
$pathPcxSave = Normalize-Path (Join-Path $scriptDirectory "GameRun\save\shoot\")
$pathSaveBugs = Normalize-Path (Join-Path $scriptDirectory "GameRun\bugs\")
$pathMods = Normalize-Path (Join-Path $scriptDirectory "GameRun\mods\")
$displayFps = if ($isDebug) { 1 } else { 0 }
$logLevel = if ($isDebug) { "LogLevel::DEBUG" } else { "LogLevel::INFO" }
# }
# This would prepare a distributable version, but redistribution of the derived binary might be not allowed if user uses non-GPLv2 compliant libraries
# else {
#     $pathResource = Normalize-Path "Common"

#     $buildFolder = Join-Path $scriptDirectory "dist"
#     if (Test-Path $buildFolder) {
#         Remove-Item -Recurse -Force -Path $buildFolder
#     }
#     New-Item -ItemType Directory -Path $buildFolder | Out-Null

#     # Create the required folder structure inside the build folder
#     $buildSubfolders = @(
#         "save",
#         "save\\shoot",
#         "bugs",
#         "mods"
#     )
#     foreach ($folder in $buildSubfolders) {
#         $fullPath = Join-Path $buildFolder $folder
#         New-Item -ItemType Directory -Path $fullPath | Out-Null
#     }

#     # Copy LBA2.cfg from SOURCES to the build folder
#     Copy-Item -Path (Join-Path "SOURCES" "LBA2.cfg") -Destination (Join-Path $buildFolder "LBA2.cfg") -Force
# }

# Path to template and output files
$templateFile = "configure.defines.h"
$outputFile = "cfg-defines.h"

# Ensure the template file exists
if (-not (Test-Path $templateFile)) {
    Write-Error "Template file '$templateFile' not found. Ensure it exists in the project directory."
    exit 1
}

# Generate the cfg-defines.h file
Write-Host "Generating $outputFile with the following values:"
Write-Host "  PATH_RESOURCE: $pathResource"
Write-Host "  PATH_SAVE: $pathSave"
Write-Host "  PATH_PCX_SAVE: $pathPcxSave"
Write-Host "  PATH_MODS: $pathMods"
Write-Host "  PATH_SAVE_BUGS: $pathSaveBugs"
Write-Host "  DISPLAY_FPS: $displayFps"
Write-Host "  LOGLEVEL: $logLevel"

$templateContent = Get-Content $templateFile -Raw
$templateContent = $templateContent -replace "\$\{PATH_RESSOURCE\}", $pathResource
$templateContent = $templateContent -replace "\$\{PATH_SAVE\}", $pathSave
$templateContent = $templateContent -replace "\$\{PATH_PCX_SAVE\}", $pathPcxSave
$templateContent = $templateContent -replace "\$\{PATH_MODS\}", $pathMods
$templateContent = $templateContent -replace "\$\{PATH_SAVE_BUGS\}", $pathSaveBugs
$templateContent = $templateContent -replace "\$\{DISPLAY_FPS\}", $displayFps
$templateContent = $templateContent -replace "\$\{LOGLEVEL\}", $logLevel

$outputFileSources = Join-Path "SOURCES" $outputFile
Set-Content -Path $outputFileSources -Value $templateContent

Write-Host "$outputFile has been successfully generated." -ForegroundColor Green

# Initialize git submodules
Write-Host "Initializing git submodules..." -ForegroundColor Yellow

# Check if we're in a git repository
$isGitRepo = Test-Path ".git"

if ($isGitRepo) {
    # We're in a git repository, use standard git submodule command
    try {
        $gitSubmoduleResult = git submodule update --init --recursive
        if ($LASTEXITCODE -ne 0) {
            throw "Git submodule command failed with exit code $LASTEXITCODE"
        }
        Write-Host "[v] Git submodules initialized successfully." -ForegroundColor Green
    }
    catch {
        Write-Host "[x] Failed to initialize git submodules: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "This is required for the project to build properly." -ForegroundColor Red
        exit 1
    }
}
else {
    # Not in a git repository (downloaded as ZIP), manually clone submodules
    Write-Host "Not in a git repository. Manually downloading submodules..." -ForegroundColor Yellow
    
    # Read .gitmodules file to get submodule paths and URLs
    $gitmodulesFile = ".gitmodules"
    if (-not (Test-Path $gitmodulesFile)) {
        throw ".gitmodules file not found. Cannot determine submodule configuration."
    }
    
    # Parse .gitmodules file
    $gitmodulesContent = Get-Content $gitmodulesFile
    $submodules = @{}
    $currentSubmodule = $null
    
    foreach ($line in $gitmodulesContent) {
        $line = $line.Trim()
        if ($line -match '^\[submodule "(.+)"\]$') {
            $currentSubmodule = $matches[1]
            $submodules[$currentSubmodule] = @{}
        }
        elseif ($line -match '^\s*path\s*=\s*(.+)$' -and $currentSubmodule) {
            $submodules[$currentSubmodule].path = $matches[1].Trim()
        }
        elseif ($line -match '^\s*url\s*=\s*(.+)$' -and $currentSubmodule) {
            $submodules[$currentSubmodule].url = $matches[1].Trim()
        }
    }
    
    try {
        foreach ($submoduleName in $submodules.Keys) {
            $submoduleInfo = $submodules[$submoduleName]
            $submodulePath = $submoduleInfo.path
            $submoduleUrl = $submoduleInfo.url
            $submoduleRevision = $submoduleRevisions[$submoduleName]
            
            if (-not $submodulePath -or -not $submoduleUrl) {
                Write-Warning "  ⚠ Incomplete configuration for submodule '$submoduleName', skipping..."
                continue
            }
            
            if (-not $submoduleRevision) {
                Write-Warning "  ⚠ No hardcoded revision for submodule '$submoduleName', skipping..."
                continue
            }
            
            # Check if directory exists and is not empty (excluding hidden/system entries)
            if (Test-Path $submodulePath) {
                $nonHiddenItems = Get-ChildItem $submodulePath | Where-Object { ($_.Attributes -band [IO.FileAttributes]::Hidden) -eq 0 -and ($_.Attributes -band [IO.FileAttributes]::System) -eq 0 }
                if ($nonHiddenItems.Count -gt 0) {
                    Write-Host "  [v] $submoduleName directory already exists and is not empty, skipping clone." -ForegroundColor Green
                    continue
                }
            }
            
            Write-Host "  → Cloning $submoduleName to $submodulePath..." -ForegroundColor Gray
            
            # Remove existing directory if it exists (it would be empty at this point)
            if (Test-Path $submodulePath) {
                Remove-Item -Recurse -Force $submodulePath
            }
            
            # Clone the repository
            git clone $submoduleUrl $submodulePath
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to clone $submoduleName from $submoduleUrl"
            }
            
            # Checkout specific revision
            Push-Location $submodulePath
            try {
                git checkout $submoduleRevision
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to checkout revision $submoduleRevision for $submoduleName"
                }
                Write-Host "  [v] $submoduleName cloned and checked out to revision $submoduleRevision." -ForegroundColor Green
            }
            finally {
                Pop-Location
            }
        }
        Write-Host "[v] All submodules downloaded successfully." -ForegroundColor Green
    }
    catch {
        Write-Host "[x] Failed to download submodules: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "This is required for the project to build properly." -ForegroundColor Red
        exit 1
    }
}

# Persist build configuration for subsequent build.ps1 runs
try {
    $configState = @{ buildType = $BuildType }
    $configJsonPath = Join-Path $scriptDirectory "configure.build.json"
    $configState | ConvertTo-Json -Depth 3 | Set-Content -Encoding UTF8 $configJsonPath
    Write-Host "Saved build configuration to $configJsonPath" -ForegroundColor DarkGreen
}
catch {
    Write-Warning "Failed to write configure.build.json: $($_.Exception.Message)"
}

Write-Host "You can now build the game by running .\build.ps1" -ForegroundColor Green
