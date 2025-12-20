<#
.SYNOPSIS
    A script to prepare user machine environment for building the LBA2 Community - IdaJS project.

.DESCRIPTION
    This script automatically installs required build tools and dependencies:
    - Package manager (Chocolatey or winget) for Git and NuGet
    - Git version control system
    - NuGet CLI for package management
    - Visual Studio Build Tools 2022 with v143 platform toolset and Windows SDK 10.0.$WindowsSdkVersion
    
    Works on Windows 10 and Windows 11.

.EXAMPLE
    ./setup.ps1
#>

param ()

# ************************** Includes ************************************
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

. (Join-Path $scriptRoot "build-lib.ps1")
# ************************ End Includes **********************************

# Configuration - Windows SDK settings
$WindowsSdkVersion = "19041"
$WindowsSdkComponent = "Microsoft.VisualStudio.Component.Windows10SDK.19041"

# Force using Chocolatey also on Windows 11
# This is good to have single flow of execution, and also choco is needed for users who want to install nodejs later
$forceChoco = $true

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IdaJS - Development Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

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

# Function to install Chocolatey
function Install-Chocolatey {
    Write-Host "Installing Chocolatey package manager..." -ForegroundColor Yellow
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh environment variables
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
        
        Write-Host "[v] Chocolatey installed successfully!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "[x] Failed to install Chocolatey: $_" -ForegroundColor Red
        return $false
    }
}

# Function to check if winget is available and working
function Test-Winget {
    try {
        # First check if winget command exists in PATH
        if (Get-Command "winget" -ErrorAction SilentlyContinue) {
            # Try to run a simple winget command to verify it's working
            $result = & winget --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                return $true
            }
        }
        
        # Fallback: check if winget exists in common locations
        $wingetPaths = @(
            "$env:LOCALAPPDATA\Microsoft\WindowsApps"
        )
        
        # Also check for Microsoft.DesktopAppInstaller path
        $appInstallerPath = Get-ChildItem "$env:ProgramFiles\WindowsApps\Microsoft.DesktopAppInstaller*" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($appInstallerPath) {
            $wingetPaths += $appInstallerPath.FullName
        }
        
        foreach ($wingetDir in $wingetPaths) {
            $wingetExe = Join-Path $wingetDir "winget.exe"
            if (Test-Path $wingetExe) {
                # Try to run winget from the specific path
                $result = & $wingetExe --version 2>$null
                if ($LASTEXITCODE -eq 0) {
                    # Add the directory to PATH if it's not already there
                    $currentPath = $env:PATH
                    if ($currentPath -notlike "*$wingetDir*") {
                        $env:PATH = "$wingetDir;$currentPath"
                        Write-Host "[v] Added winget directory to PATH: $wingetDir" -ForegroundColor Green
                    }
                    
                    return $true
                }
            }
        }
        
        return $false
    }
    catch {
        return $false
    }
}

# Step 1: Package Manager Detection and Installation
Write-Host "Step 1: Checking for package managers..." -ForegroundColor Blue

$useWinget = $false
$useChoco = $false

if (!$forceChoco -and (Test-Winget)) {
    Write-Host "[v] winget is available and will be used" -ForegroundColor Green
    $useWinget = $true
}
elseif (Test-Command "choco") {
    Write-Host "[v] Chocolatey is available and will be used" -ForegroundColor Green
    $useChoco = $true
}
else {
    Write-Host "No package manager found. Installing Chocolatey..." -ForegroundColor Yellow
    if (Install-Chocolatey) {
        $useChoco = $true
    }
    else {
        Write-Host "[x] Failed to install package manager. Please install Chocolatey manually." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 2: Git Detection and Installation
Write-Host "Step 2: Checking for Git..." -ForegroundColor Blue

if (Test-Command "git") {
    $gitVersion = git --version
    Write-Host "[v] Git is already installed: $gitVersion" -ForegroundColor Green
}
else {
    Write-Host "Git not found. Installing Git..." -ForegroundColor Yellow
    
    if ($useWinget) {
        try {
            winget install --id Git.Git --silent --accept-package-agreements --accept-source-agreements
            Write-Host "[v] Git installed successfully via winget!" -ForegroundColor Green
        }
        catch {
            Write-Host "[x] Failed to install Git via winget: $_" -ForegroundColor Red
            exit 1
        }
    }
    elseif ($useChoco) {
        try {
            choco install git -y
            Write-Host "[v] Git installed successfully via Chocolatey!" -ForegroundColor Green
        }
        catch {
            Write-Host "[x] Failed to install Git via Chocolatey: $_" -ForegroundColor Red
            exit 1
        }
    }
    
    # Refresh PATH to make git available
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
}

Write-Host ""

# Step 3: NuGet CLI Detection and Installation
Write-Host "Step 3: Checking for NuGet CLI..." -ForegroundColor Blue

if (Test-Command "nuget") {
    $nugetVersion = nuget help | Select-String "NuGet Version" | Select-Object -First 1
    Write-Host "[v] NuGet CLI is already installed: $nugetVersion" -ForegroundColor Green
}
else {
    Write-Host "NuGet CLI not found. Installing NuGet CLI..." -ForegroundColor Yellow
    
    if ($useWinget) {
        try {
            winget install --id Microsoft.NuGet --silent --accept-package-agreements --accept-source-agreements
            Write-Host "[v] NuGet CLI installed successfully via winget!" -ForegroundColor Green
        }
        catch {
            Write-Host "[x] Failed to install NuGet CLI via winget: $_" -ForegroundColor Red
            Write-Host "Attempting alternative installation method..." -ForegroundColor Yellow
            
            # Fallback: Download nuget.exe directly
            try {
                $nugetPath = Join-Path $env:LOCALAPPDATA "Microsoft\WindowsApps"
                if (-not (Test-Path $nugetPath)) {
                    New-Item -ItemType Directory -Path $nugetPath -Force | Out-Null
                }
                $nugetExePath = Join-Path $nugetPath "nuget.exe"
                
                Write-Host "Downloading nuget.exe..." -ForegroundColor Yellow
                Invoke-WebRequest -Uri "https://dist.nuget.org/win-x86-commandline/latest/nuget.exe" -OutFile $nugetExePath
                Write-Host "[v] NuGet CLI downloaded and installed!" -ForegroundColor Green
            }
            catch {
                Write-Host "[x] Failed to download NuGet CLI: $_" -ForegroundColor Red
                Write-Host ""
                Write-Host "========================================" -ForegroundColor Red
                Write-Host "Setup Failed!" -ForegroundColor Red
                Write-Host "========================================" -ForegroundColor Red
                Write-Host ""
                Write-Host "Could not install NuGet CLI through any available method." -ForegroundColor Red
                Write-Host "Please install NuGet CLI manually and run this script again." -ForegroundColor Yellow
                Write-Host "Download from: https://www.nuget.org/downloads" -ForegroundColor Yellow
                Write-Host ""
                exit 1
            }
        }
    }
    elseif ($useChoco) {
        try {
            choco install nuget.commandline -y
            Write-Host "[v] NuGet CLI installed successfully via Chocolatey!" -ForegroundColor Green
        }
        catch {
            Write-Host "[x] Failed to install NuGet CLI via Chocolatey: $_" -ForegroundColor Red
            Write-Host "Attempting alternative installation method..." -ForegroundColor Yellow
            
            # Fallback: Download nuget.exe directly
            try {
                $nugetPath = Join-Path $env:LOCALAPPDATA "Microsoft\WindowsApps"
                if (-not (Test-Path $nugetPath)) {
                    New-Item -ItemType Directory -Path $nugetPath -Force | Out-Null
                }
                $nugetExePath = Join-Path $nugetPath "nuget.exe"
                
                Write-Host "Downloading nuget.exe..." -ForegroundColor Yellow
                Invoke-WebRequest -Uri "https://dist.nuget.org/win-x86-commandline/latest/nuget.exe" -OutFile $nugetExePath
                Write-Host "[v] NuGet CLI downloaded and installed!" -ForegroundColor Green
            }
            catch {
                Write-Host "[x] Failed to download NuGet CLI: $_" -ForegroundColor Red
                Write-Host ""
                Write-Host "========================================" -ForegroundColor Red
                Write-Host "Setup Failed!" -ForegroundColor Red
                Write-Host "========================================" -ForegroundColor Red
                Write-Host ""
                Write-Host "Could not install NuGet CLI through any available method." -ForegroundColor Red
                Write-Host "Please install NuGet CLI manually and run this script again." -ForegroundColor Yellow
                Write-Host "Download from: https://www.nuget.org/downloads" -ForegroundColor Yellow
                Write-Host ""
                exit 1
            }
        }
    }
    
    # Refresh PATH to make nuget available
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
}

Write-Host ""

# Step 4: Visual Studio Build Tools Detection and Installation
Write-Host "Step 4: Checking for Visual Studio Build Tools..." -ForegroundColor Blue

# Check for MSBuild and required platform toolset (v143)
$msbuildFound = $false
$platformToolsetFound = $false
$windowsSdkFound = $false

foreach ($vsBasePath in $script:VSInstallations) {
    $msbuildPath = Join-Path $vsBasePath "MSBuild\Current\Bin\MSBuild.exe"
    
    # Check if MSBuild exists
    if (Test-Path $msbuildPath) {
        if (-not $msbuildFound) {
            Write-Host "[v] MSBuild found at: $msbuildPath" -ForegroundColor Green
            $msbuildFound = $true
        }
        
        # Check if this installation also has v143 toolset
        if (Test-V143Toolset -vsBasePath $vsBasePath) {
            # Get the version details for display
            $toolsetPath = Join-Path $vsBasePath "VC\Tools\MSVC"
            $toolsetVersions = Get-ChildItem -Path $toolsetPath -Directory -ErrorAction SilentlyContinue | 
            Where-Object { $_.Name -match "^\d+\.\d+\.\d+(\.\d+)?$" }
            $sortedVersions = $toolsetVersions | Sort-Object { [version]$_.Name } -Descending
            
            foreach ($toolsetVersion in $sortedVersions) {
                if ($toolsetVersion.Name -match "^14\.[34]\d\.\d+(\.\d+)?$") {
                    $versionNumber = $toolsetVersion.Name
                    $compilerPath = Join-Path $toolsetVersion.FullName "bin\Hostx64\x86\cl.exe"
                    if (-not (Test-Path $compilerPath)) {
                        $compilerPath = Join-Path $toolsetVersion.FullName "bin\Hostx86\x86\cl.exe"
                    }
                    
                    Write-Host "[v] Visual C++ v143 platform toolset found" -ForegroundColor Green
                    Write-Host "    MSVC toolset version: $versionNumber" -ForegroundColor Green
                    Write-Host "    Compiler: $compilerPath" -ForegroundColor Green
                    $platformToolsetFound = $true
                    break
                }
            }
            break
        }
    }
}

if (-not $platformToolsetFound) {
    Write-Host "[x] Visual C++ v143 platform toolset not found" -ForegroundColor Red
    Write-Host "    Required: VS 2022 with MSVC toolset 14.3x.* or 14.4x.* and x86 build tools" -ForegroundColor Yellow
}

# Check for Windows SDK 10.0 with complete installation (Include directory)
$sdkPaths = @(
    "${env:ProgramFiles(x86)}\Windows Kits\10",
    "${env:ProgramFiles}\Windows Kits\10"
)

foreach ($path in $sdkPaths) {
    if (Test-Path $path) {
        # Check if it's a complete SDK installation with Include directory
        $includePath = Join-Path $path "Include"
        if (Test-Path $includePath -PathType Container) {
            $sdkVersions = Get-ChildItem $includePath -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "^10\.0\.$WindowsSdkVersion\.0$" }
            if ($sdkVersions) {
                Write-Host "[v] Windows SDK 10.0.$WindowsSdkVersion.0 found with complete installation" -ForegroundColor Green
                $windowsSdkFound = $true
                break
            }
            else {
                Write-Host "⚠ Windows SDK directory found but version 10.0.$WindowsSdkVersion.0 is not installed" -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "⚠ Windows SDK 10.0 directory found but incomplete (missing Include directory)" -ForegroundColor Yellow
        }
    }
}

# Install Visual Studio Build Tools if needed
if (-not $msbuildFound -or -not $platformToolsetFound -or -not $windowsSdkFound) {
    Write-Host "Installing Visual Studio Build Tools 2022..." -ForegroundColor Yellow
    Write-Host "This will install:" -ForegroundColor Yellow
    Write-Host "  - MSBuild" -ForegroundColor Yellow
    Write-Host "  - Visual C++ 2022 toolset (v143)" -ForegroundColor Yellow
    Write-Host "  - Windows 10 SDK ($WindowsSdkVersion) - compatible with Windows 10 & 11" -ForegroundColor Yellow
    Write-Host ""
    
    # Check if Visual Studio or Visual Studio Installer are running
    Write-Host "Checking for running Visual Studio processes..." -ForegroundColor Yellow
    
    $vsProcesses = @(
        "devenv",              # Visual Studio IDE
        "vs_installer",        # Visual Studio Installer
        "vs_installershell",   # Visual Studio Installer Shell
        "vslauncher",          # Visual Studio Launcher
        "ServiceHub.Host.CLR", # Visual Studio Service Host
        "ServiceHub.Host.dotnet"
    )
    
    $runningProcesses = @()
    foreach ($processName in $vsProcesses) {
        $proc = Get-Process -Name $processName -ErrorAction SilentlyContinue
        if ($proc) {
            $runningProcesses += $processName
        }
    }
    
    if ($runningProcesses.Count -gt 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "Visual Studio processes are running!" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "The following Visual Studio related processes must be closed:" -ForegroundColor Yellow
        foreach ($proc in $runningProcesses) {
            Write-Host "  - $proc" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "Please close all Visual Studio instances and the Visual Studio Installer," -ForegroundColor Yellow
        Write-Host "then run this script again." -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
    
    Write-Host "[v] No Visual Studio processes running" -ForegroundColor Green
    Write-Host ""
    
    # Use direct installer download for reliable installation
    try {
        Write-Host "Downloading Visual Studio Build Tools 2022 installer..." -ForegroundColor Yellow
        
        # Download the official installer
        $installerPath = Join-Path $env:TEMP "vs_buildtools.exe"
        Invoke-WebRequest -Uri "https://aka.ms/vs/17/release/vs_buildtools.exe" -OutFile $installerPath
        Write-Host "[v] Installer downloaded successfully" -ForegroundColor Green
        
        Write-Host "Installing Visual Studio Build Tools 2022..." -ForegroundColor Yellow
        Write-Host "Installation may take a few minutes..." -ForegroundColor Yellow
        
        # Install with v143 platform toolset and Windows SDK components
        $installerArgs = @(
            # "--add", "Microsoft.VisualStudio.Workload.VCTools",
            "--add", "Microsoft.VisualStudio.Component.MSBuild", 
            "--add", "Microsoft.VisualStudio.Component.VC.CoreBuildTools",
            "--add", "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
            "--add", $WindowsSdkComponent,
            "--passive",
            "--wait",
            "--norestart"
        )
        
        # Run installer with proper blocking
        $process = Start-Process -FilePath $installerPath -ArgumentList $installerArgs -Wait -NoNewWindow -PassThru
        
        if ($process.ExitCode -eq 0) {
            Write-Host "[v] Visual Studio Build Tools 2022 installed successfully!" -ForegroundColor Green
        }
        elseif ($process.ExitCode -eq 3010) {
            Write-Host "[v] Visual Studio Build Tools 2022 installed successfully!" -ForegroundColor Green
            Write-Host "⚠ A reboot may be required to complete the installation." -ForegroundColor Yellow
        }
        else {
            throw "Installation failed with exit code: $($process.ExitCode)"
        }
        
        # Clean up installer
        Remove-Item $installerPath -ErrorAction SilentlyContinue
    }
    catch {
        Write-Host "[x] Failed to install Visual Studio Build Tools: $_" -ForegroundColor Red
        Write-Host "You may need to install Visual Studio Build Tools 2022 manually." -ForegroundColor Yellow
        Write-Host "Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "Setup Failed!" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "The development environment setup could not be completed due to Visual Studio Build Tools installation failure." -ForegroundColor Red
        Write-Host "Please install Visual Studio Build Tools 2022 manually and run this script again." -ForegroundColor Yellow
        Write-Host ""
        
        # Clean up installer on error
        if (Test-Path $installerPath) {
            Remove-Item $installerPath -ErrorAction SilentlyContinue
        }
        
        # Exit with error code
        exit 1
    }
}
else {
    Write-Host "[v] All required Visual Studio Build Tools are already installed!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your development environment is now ready for configuring and building LBA2 Community - IdaJS." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: .\configure.ps1" -ForegroundColor White
Write-Host "2. Build the project using .\build.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Required tools installed:" -ForegroundColor Yellow
Write-Host "  - Package manager (Chocolatey or winget)" -ForegroundColor White
Write-Host "  - Git version control" -ForegroundColor White
Write-Host "  - NuGet CLI for package management" -ForegroundColor White
Write-Host "  - Visual Studio Build Tools 2022 (v143 toolset)" -ForegroundColor White
Write-Host "  - Windows SDK 10.0.$WindowsSdkVersion" -ForegroundColor White
Write-Host ""
