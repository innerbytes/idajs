<#
.SYNOPSIS
    A script to build the IdaJS project from the command line.

.DESCRIPTION
    This script builds the entire IdaJS and LBA2 Classic solution including all dependencies.
    It handles NuGet package restoration, pre-build steps, and post-build steps automatically.
    
    Requires PowerShell 7+ and Visual Studio Build Tools 2022.

.PARAMETER BuildType
    Specifies the build configuration. Acceptable values are "Debug" or "Release".

.PARAMETER Clean
    If specified, performs a clean build (rebuild all).

.PARAMETER ShowVerbose
    If specified, shows detailed build output.

.PARAMETER Passive
    If specified, skips the license disclaimer modal dialog and prints it to console instead.
    The build continues automatically after displaying the disclaimer.

.EXAMPLE
    ./build.ps1 -BuildType Debug
    
.EXAMPLE
    ./build.ps1 -BuildType Release -Clean -ShowVerbose

.EXAMPLE
    ./build.ps1 -BuildType Release -Passive
#>

param (
    [Parameter()]
    [ValidateSet("Debug", "Release")]
    [string]$BuildType = "Release",
    
    [Parameter()]
    [switch]$Clean,
    
    [Parameter()]
    [switch]$ShowVerbose,
    
    [Parameter()]
    [switch]$Passive
)

# ************************** Includes ************************************
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptRoot

. (Join-Path $scriptRoot "build-lib.ps1")
# ************************ End Includes **********************************

# Detect whether user explicitly passed -BuildType (bound parameter)
$__UserSpecifiedBuildType = $PSBoundParameters.ContainsKey('BuildType')

# Set error action preference
$ErrorActionPreference = "Stop"

# Platform is always Win32 for this project
$Platform = "Win32"

# If user did not specify BuildType, attempt to load from configure.build.json
if (-not $__UserSpecifiedBuildType) {
    $configJsonPath = Join-Path $scriptRoot 'configure.build.json'
    if (Test-Path $configJsonPath) {
        try {
            $json = Get-Content $configJsonPath -Raw | ConvertFrom-Json
            if ($json.buildType -and ($json.buildType -in @('Debug', 'Release'))) {
                Write-Host "Using build type from configure.build.json: $($json.buildType)" -ForegroundColor DarkCyan
                $BuildType = $json.buildType
            }
            else {
                Write-Warning "configure.build.json found but buildType property missing or invalid. Falling back to default ($BuildType)."
            }
        }
        catch {
            Write-Warning "Failed to parse configure.build.json: $($_.Exception.Message). Using default BuildType ($BuildType)."
        }
    }
}

# If user did NOT explicitly pass -Passive, auto-enable it if configure.build.json records prior acceptance (ndaAccepted=true)
if (-not $PSBoundParameters.ContainsKey('Passive')) {
    $configJsonPath = Join-Path $scriptRoot 'configure.build.json'
    if (Test-Path $configJsonPath) {
        try {
            $licenseJson = Get-Content $configJsonPath -Raw | ConvertFrom-Json
            if ($licenseJson.ndaAccepted -eq $true) {
                $Passive = $true
                Write-Host "Passive mode auto-enabled (prior license disclaimer acceptance)." -ForegroundColor DarkCyan
            }
        }
        catch {
            Write-Verbose "Could not read ndaAccepted flag from configure.build.json: $($_.Exception.Message)"
        }
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IdaJS - Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Configuration: $BuildType" -ForegroundColor Yellow
Write-Host "Platform: $Platform" -ForegroundColor Yellow
Write-Host "Clean Build: $Clean" -ForegroundColor Yellow
Write-Host ""

# Function to find MSBuild with v143 toolset
function Find-MSBuild {
    foreach ($vsBasePath in $script:VSInstallations) {
        $msbuildPath = Join-Path $vsBasePath "MSBuild\Current\Bin\MSBuild.exe"
        
        # Check if MSBuild exists AND v143 toolset is present
        if ((Test-Path $msbuildPath) -and (Test-V143Toolset -vsBasePath $vsBasePath)) {
            Write-Host "Found MSBuild with v143 toolset at: $msbuildPath" -ForegroundColor Green
            return $msbuildPath
        }
    }
    
    throw "MSBuild with v143 platform toolset not found. Please install Visual Studio 2022 or Visual Studio Build Tools 2022 with the Desktop development with C++ workload, Windows 10 SDK, and v143 toolset."
}

# Function to check if a command exists
function Test-Command($command) {
    try {
        Get-Command $command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to check for V8 packages and show license disclaimer
function Test-V8PackagesAndShowDisclaimer {
    $packagesConfigPath = Join-Path "Ida" "packages.config"
    
    # Check if packages.config exists
    if (-not (Test-Path $packagesConfigPath)) {
        return $true  # No packages.config, no need to check
    }
    
    # Read and parse packages.config
    try {
        [xml]$packagesXml = Get-Content $packagesConfigPath
        
        # Check specifically for the V8 packages we're concerned about
        $hasV8Redist = $packagesXml.packages.package | Where-Object { $_.id -match "^v8\.redist-v\d+-x86$" }
        $hasV8Core = $packagesXml.packages.package | Where-Object { $_.id -match "^v8-v\d+-x86$" }
        
        if ($hasV8Redist -or $hasV8Core) {
            Write-Host "V8 JavaScript engine packages detected in project." -ForegroundColor Yellow
            
            if ($Passive) {
                # In passive mode, print disclaimer to console and continue
                Write-Host "By building this you accept the below:" -ForegroundColor Yellow
                Write-Host ""
                Show-ConsoleDisclaimer
                Write-Host ""
                Write-Host "Continuing build in passive mode..." -ForegroundColor Green
            }
            else {
                # Show modal disclaimer dialog
                Write-Host "Showing license compatibility disclaimer..." -ForegroundColor Yellow
                $disclaimerResult = Show-LicenseDisclaimer
                
                if ($disclaimerResult -eq $false) {
                    Write-Host "Build cancelled by user due to license concerns." -ForegroundColor Red
                    exit 1
                }
                else {
                    Write-Host "User accepted license disclaimer. Continuing build..." -ForegroundColor Green
                    # Persist acceptance to configure.build.json (after line 181 per requirement)
                    try {
                        $configJsonPath = Join-Path $scriptRoot 'configure.build.json'
                        $configData = $null
                        if (Test-Path $configJsonPath) {
                            try {
                                $raw = Get-Content $configJsonPath -Raw
                                if ($raw.Trim().Length -gt 0) {
                                    $configData = $raw | ConvertFrom-Json
                                }
                            }
                            catch {
                                Write-Warning "Existing configure.build.json could not be parsed; it will be recreated (reason: $($_.Exception.Message))"
                            }
                        }

                        if (-not $configData) { $configData = [PSCustomObject]@{} }

                        # Preserve existing buildType if present; otherwise store current
                        if (-not ($configData.PSObject.Properties | Where-Object { $_.Name -eq 'buildType' })) {
                            $configData | Add-Member -NotePropertyName buildType -NotePropertyValue $BuildType -Force
                        }

                        # Store acceptance flag
                        $configData | Add-Member -NotePropertyName ndaAccepted -NotePropertyValue $true -Force

                        # Write back to disk
                        $configData | ConvertTo-Json -Depth 5 | Set-Content -Path $configJsonPath -Encoding UTF8
                        Write-Host "Recorded license disclaimer acceptance (ndaAccepted=true) in configure.build.json." -ForegroundColor DarkCyan
                    }
                    catch {
                        Write-Warning "Failed to persist license acceptance flag: $($_.Exception.Message)"
                    }
                }
            }
        }
    }
    catch {
        Write-Warning "Failed to parse packages.config: $($_.Exception.Message)"
        exit 1
    }
    
    return $true
}

# Function to get the license disclaimer text
function Get-LicenseDisclaimerText {
    return @"
LICENSE COMPATIBILITY WARNING

This source code is licensed under GPL v2. You have added Google V8 JavaScript engine packages, which include dependencies licensed under Apache 2.0.

Important: The Apache 2.0 license is not compatible with GPL v2 for distribution.

If you continue with this build:
• You may use the resulting binary executable and libraries for private use only
• You may run them in your own private environment
• You do not have the legal right to redistribute the combined binary or libraries
• You do not have the legal right to distribute this GPL v2 source code together with the V8 packages
• Redistributing the combined work would constitute a GPL v2 license violation

Note: You may freely create and distribute your own JavaScript mods or other original content that you created to run on this product, provided they are not derivative works of the GPL v2-licensed source code of this product.

Do you understand and accept these license restrictions?
"@
}

# Function to show license disclaimer in console
function Show-ConsoleDisclaimer {
    $disclaimerText = Get-LicenseDisclaimerText
    # Remove the question for console output
    $disclaimerText = $disclaimerText -replace "`r?`nDo you understand and accept these license restrictions\?", ""
    Write-Host $disclaimerText -ForegroundColor Cyan
}

# Function to show license disclaimer modal dialog
function Show-LicenseDisclaimer {
    # Load Windows Forms assembly
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    
    # Create the form
    $form = New-Object System.Windows.Forms.Form
    $form.Text = "GPL v2 License Compatibility Warning"
    $form.Size = New-Object System.Drawing.Size(700, 500)
    $form.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
    $form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    $form.TopMost = $true
    $form.Icon = [System.Drawing.SystemIcons]::Warning
    
    # Create warning icon
    $iconLabel = New-Object System.Windows.Forms.Label
    $iconLabel.Location = New-Object System.Drawing.Point(20, 20)
    $iconLabel.Size = New-Object System.Drawing.Size(40, 40)
    $iconLabel.Image = [System.Drawing.SystemIcons]::Warning.ToBitmap()
    $form.Controls.Add($iconLabel)
    
    # Get disclaimer text
    $disclaimerText = Get-LicenseDisclaimerText
    
    $textLabel = New-Object System.Windows.Forms.Label
    $textLabel.Location = New-Object System.Drawing.Point(80, 20)
    $textLabel.Size = New-Object System.Drawing.Size(550, 380)
    $textLabel.Text = $disclaimerText
    $textLabel.Font = New-Object System.Drawing.Font("Segoe UI", 9)
    $textLabel.AutoSize = $false
    $form.Controls.Add($textLabel)
    
    # Create Yes button
    $yesButton = New-Object System.Windows.Forms.Button
    $yesButton.Location = New-Object System.Drawing.Point(450, 420)
    $yesButton.Size = New-Object System.Drawing.Size(100, 30)
    $yesButton.Text = "Yes, I Accept"
    $yesButton.Font = New-Object System.Drawing.Font("Segoe UI", 9)
    $yesButton.DialogResult = [System.Windows.Forms.DialogResult]::Yes
    $form.Controls.Add($yesButton)
    
    # Create No button
    $noButton = New-Object System.Windows.Forms.Button
    $noButton.Location = New-Object System.Drawing.Point(560, 420)
    $noButton.Size = New-Object System.Drawing.Size(100, 30)
    $noButton.Text = "No, Cancel"
    $noButton.Font = New-Object System.Drawing.Font("Segoe UI", 9)
    $noButton.DialogResult = [System.Windows.Forms.DialogResult]::No
    $form.Controls.Add($noButton)
    
    # Set default buttons
    $form.AcceptButton = $yesButton
    $form.CancelButton = $noButton
    
    # Show the dialog
    $result = $form.ShowDialog()
    
    # Clean up
    $form.Dispose()
    
    return ($result -eq [System.Windows.Forms.DialogResult]::Yes)
}

# Function to run pre-build steps
function Invoke-PreBuildSteps {
    Write-Host "Step 1: Running pre-build steps..." -ForegroundColor Blue
    
    # Run version.ps1 script for Ida project
    $idaVersionScript = Join-Path "Ida" "version.ps1"
    if (Test-Path $idaVersionScript) {
        Write-Host "  → Updating version from package.json..." -ForegroundColor Gray
        try {
            Set-Location "Ida"
            & pwsh -ExecutionPolicy Bypass -File "version.ps1"
            Set-Location $scriptRoot
            Write-Host "  [v] Version updated successfully" -ForegroundColor Green
        }
        catch {
            Write-Warning "  ⚠ Failed to update version: $($_.Exception.Message)"
            Set-Location $scriptRoot
        }
    }
    
    Write-Host ""
}

# Function to restore NuGet packages
function Restore-NuGetPackages {
    Write-Host "Step 2: Restoring NuGet packages..." -ForegroundColor Blue
    
    if (-not (Test-Command "nuget")) {
        throw "NuGet CLI not found. Please run setup.ps1 first to install required tools."
    }
    
    # Restore packages for SOURCES project
    $sourcesPackagesConfig = "SOURCES\packages.config"
    if (Test-Path $sourcesPackagesConfig) {
        Write-Host "  → Restoring packages for SOURCES project..." -ForegroundColor Gray
        try {
            & nuget restore $sourcesPackagesConfig -PackagesDirectory packages
            Write-Host "  [v] SOURCES packages restored" -ForegroundColor Green
        }
        catch {
            Write-Warning "  ⚠ Failed to restore SOURCES packages: $($_.Exception.Message)"
        }
    }
    
    # Restore packages for Ida project
    $idaPackagesConfig = "Ida\packages.config"
    if (Test-Path $idaPackagesConfig) {
        Write-Host "  → Restoring packages for Ida project..." -ForegroundColor Gray
        try {
            & nuget restore $idaPackagesConfig -PackagesDirectory packages
            Write-Host "  [v] Ida packages restored" -ForegroundColor Green
        }
        catch {
            Write-Warning "  ⚠ Failed to restore Ida packages: $($_.Exception.Message)"
        }
    }
    
    Write-Host ""
}

# Function to build the solution
function Build-Solution {
    Write-Host "Step 3: Building solution..." -ForegroundColor Blue
    
    $msbuild = Find-MSBuild
    Write-Host "  → Using MSBuild: $msbuild" -ForegroundColor Gray
    
    $solutionFile = "LBA2.sln"
    if (-not (Test-Path $solutionFile)) {
        throw "Solution file LBA2.sln not found."
    }
    
    # Prepare MSBuild arguments
    $msbuildArgs = @(
        $solutionFile,
        "/p:Configuration=$BuildType",
        "/p:Platform=$Platform",
        "/m",  # Multi-processor build
        "/nodeReuse:false", # Disable node reuse for MSBuild not to keep processes alive after build
        "/nologo"
    )
    
    if ($Clean) {
        $msbuildArgs += "/t:Rebuild"
        Write-Host "  → Performing clean rebuild..." -ForegroundColor Gray
    }
    else {
        $msbuildArgs += "/t:Build"
        Write-Host "  → Performing incremental build..." -ForegroundColor Gray
    }
    
    if ($ShowVerbose) {
        $msbuildArgs += "/v:detailed"
    }
    else {
        $msbuildArgs += "/v:minimal"
    }
    
    Write-Host "  → Building $BuildType configuration for $Platform platform..." -ForegroundColor Gray
    
    try {
        & $msbuild @msbuildArgs
        if ($LASTEXITCODE -ne 0) {
            throw "MSBuild failed with exit code $LASTEXITCODE"
        }
        Write-Host "  [v] Solution built successfully" -ForegroundColor Green
    }
    catch {
        throw "Build failed: $($_.Exception.Message)"
    }
    
    Write-Host ""
}

# Function to run post-build steps
function Invoke-PostBuildSteps {
    Write-Host "Step 4: Running post-build steps..." -ForegroundColor Blue
    
    # Post-build steps from LBA2.vcxproj
    $sourceDir = if ($BuildType -eq "Debug") { "Win32\Debug" } else { "Win32\Release" }
    $targetDir = if ($BuildType -eq "Debug") { "Debug" } else { "Release" }
    
    if (Test-Path $sourceDir) {
        Write-Host "  → Copying build outputs from $sourceDir to $targetDir..." -ForegroundColor Gray
        try {
            # Create target directory if it doesn't exist
            if (-not (Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
            }
            
            # Copy all files from source to target
            Copy-Item -Path "$sourceDir\*" -Destination $targetDir -Recurse -Force
            Write-Host "  [v] Build outputs copied successfully" -ForegroundColor Green
        }
        catch {
            Write-Warning "  ⚠ Failed to copy build outputs: $($_.Exception.Message)"
        }
    }
    
    # Copy LBA2.cfg if it exists
    $configFile = "GameRun\LBA2.cfg"
    if (Test-Path $configFile) {
        Write-Host "  → Copying LBA2.cfg to $targetDir..." -ForegroundColor Gray
        try {
            Copy-Item -Path $configFile -Destination $targetDir -Force
            Write-Host "  [v] LBA2.cfg copied successfully" -ForegroundColor Green
        }
        catch {
            Write-Warning "  ⚠ Failed to copy LBA2.cfg: $($_.Exception.Message)"
        }
    }
    
    Write-Host ""
}

# Function to display build summary
function Show-BuildSummary {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Build Summary" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    $targetDir = if ($BuildType -eq "Debug") { "Debug" } else { "Release" }
    $exePath = Join-Path $targetDir "LBA2.exe"
    
    if (Test-Path $exePath) {
        Write-Host "[v] Build completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Executable location: $exePath" -ForegroundColor Yellow
        Write-Host "Build configuration: $BuildType" -ForegroundColor Yellow
        Write-Host "Platform: Win32" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To run the game:" -ForegroundColor Yellow
        Write-Host "  cd $targetDir" -ForegroundColor White
        Write-Host "  .\LBA2.exe" -ForegroundColor White
    }
    else {
        Write-Host "[x] Build may have failed - executable not found at expected location" -ForegroundColor Red
        Write-Host "Expected location: $exePath" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

# Main execution
try {
    # Check if cfg-defines.h exists (generated by configure.ps1)
    if (-not (Test-Path "SOURCES\cfg-defines.h")) {
        Write-Warning "cfg-defines.h not found. Please run ./configure.ps1 first to set up the project."
        $runConfigure = Read-Host "Would you like to run configure.ps1 now? (Y/n)"
        if ($runConfigure -eq "" -or $runConfigure -match "^[Yy]") {
            $configureScript = Join-Path $scriptRoot "configure.ps1"
            if (Test-Path $configureScript) {
                Write-Host "Running configure.ps1..." -ForegroundColor Yellow
                & $configureScript -BuildType $BuildType
            }
            else {
                throw "configure.ps1 not found in the project directory."
            }
        }
        else {
            throw "Configuration required. Please run ./configure.ps1 first."
        }
    }
    
    # Check for V8 packages and show license disclaimer if needed
    Test-V8PackagesAndShowDisclaimer
    
    # Execute build steps
    Invoke-PreBuildSteps
    Restore-NuGetPackages
    Build-Solution
    Invoke-PostBuildSteps
    Show-BuildSummary
    
    Write-Host "Build process completed successfully!" -ForegroundColor Green
    
    # Create .idajs.json in user home folder on successful build
    try {
        $homeFolder = [Environment]::GetFolderPath("UserProfile")
        $idajsPath = Join-Path $homeFolder ".idajs.json"
        $installDir = $scriptRoot -replace '\\', '/'
        $idajsContent = @{
            installDir = $installDir
        } | ConvertTo-Json -Depth 1
        
        Set-Content -Path $idajsPath -Value $idajsContent -Encoding UTF8 -Force
        Write-Host "Created $idajsPath" -ForegroundColor DarkCyan
    }
    catch {
        Write-Warning "Failed to create .idajs.json: $($_.Exception.Message)"
    }
}
catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Build Failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    # Delete .idajs.json from user home folder on build failure
    try {
        $homeFolder = [Environment]::GetFolderPath("UserProfile")
        $idajsPath = Join-Path $homeFolder ".idajs.json"
        if (Test-Path $idajsPath) {
            Remove-Item -Path $idajsPath -Force
            Write-Host "Removed $idajsPath due to build failure" -ForegroundColor DarkCyan
        }
    }
    catch {
        Write-Verbose "Could not remove .idajs.json: $($_.Exception.Message)"
    }
    
    exit 1
}
