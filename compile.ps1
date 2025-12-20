<#
.SYNOPSIS
    A script to run the complete development setup, configuration, and build process for LBA2 Community - IdaJS project.

.DESCRIPTION
    This script runs four PowerShell scripts in sequence:
    1. devenv.ps1 - Sets up the development environment
    2. configure.ps1 - Configures the project
    3. build.ps1 - Builds the project
    4. cfg.ps1 - Configures language settings
    
    The script ensures that PATH updates from devenv.ps1 are preserved and available
    in the subsequent scripts by running all scripts in the same PowerShell session.
    
    Works on Windows 10 and Windows 11 with PowerShell 7.

.EXAMPLE
    .\compile.ps1
#>

param ()

# Function to refresh PATH environment variable
function Update-PathEnvironment {
    Write-Host "Refreshing PATH environment..." -ForegroundColor Yellow
    
    # Get system and user PATH variables
    $machinePath = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
    $userPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
    
    # Combine them, removing duplicates
    $combinedPath = ($machinePath + ";" + $userPath) -split ";" | Where-Object { $_ -ne "" } | Sort-Object -Unique
    $newPath = $combinedPath -join ";"
    
    # Update current session PATH
    $env:PATH = $newPath
    
    # Also try to refresh from common installation paths that might not be in registry yet
    $commonPaths = @(
        "${env:ProgramFiles}\Git\cmd",
        "${env:ProgramFiles(x86)}\Git\cmd",
        "${env:LOCALAPPDATA}\Programs\Git\cmd",
        "${env:ProgramData}\chocolatey\bin",
        "${env:LOCALAPPDATA}\Microsoft\WindowsApps"
    )
    
    foreach ($path in $commonPaths) {
        if ((Test-Path $path) -and ($env:PATH -notlike "*$path*")) {
            $env:PATH += ";$path"
        }
    }
    
    Write-Host "[v] PATH refreshed" -ForegroundColor Green
}

# Function to run a PowerShell script and handle errors
function Invoke-ProjectScript {
    param(
        [string]$ScriptPath,
        [string]$ScriptName,
        [string]$Description,
        [string]$WorkingDirectory,
        [string]$Arguments = ""
    )
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Running $ScriptName..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "$Description" -ForegroundColor White
    Write-Host ""
    
    try {
        # Save current directory and set working directory to script directory
        $originalLocation = Get-Location
        Set-Location -Path $WorkingDirectory
        
        # Run the script in the current session to preserve environment variables
        # Redirect all output streams to ensure nothing is buffered
        if ($Arguments) {
            # Use Invoke-Expression to properly handle PowerShell parameters
            $command = "& '$ScriptPath' $Arguments"
            Invoke-Expression $command *>&1 | ForEach-Object { Write-Host $_ }
        }
        else {
            & $ScriptPath *>&1 | ForEach-Object { Write-Host $_ }
        }
        
        if ($LASTEXITCODE -ne 0 -and $null -ne $LASTEXITCODE) {
            throw "Script exited with code $LASTEXITCODE"
        }
        
        Write-Host ""
        Write-Host "[v] $ScriptName completed successfully!" -ForegroundColor Green
        
        # Refresh PATH after each script in case it installed new tools
        Update-PathEnvironment
        
        return $true
    }
    catch {
        Write-Host ""
        Write-Host "[x] ERROR: $ScriptName execution failed" -ForegroundColor Red
        Write-Host "Error details: $_" -ForegroundColor Red
        return $false
    }
    finally {
        # Always restore the original location
        Set-Location -Path $originalLocation
    }
}

# Main execution
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LBA2 Community - IdaJS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will run the complete setup and build process:" -ForegroundColor White
Write-Host "1. Development environment setup (devenv.ps1)" -ForegroundColor White
Write-Host "2. Project configuration (configure.ps1)" -ForegroundColor White
Write-Host "3. Project build (build.ps1)" -ForegroundColor White
Write-Host "4. Language configuration (cfg.ps1)" -ForegroundColor White
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Define the scripts to run
$scripts = @(
    @{
        Path           = Join-Path $scriptDir "devenv.ps1"
        Name           = "devenv.ps1"
        Description    = "Setting up development environment (Git, NuGet, Visual Studio Build Tools)..."
        SuccessMessage = "Development environment setup did not complete"
        FailureMessage = @"
The development environment setup did not complete. This could be due to:
- Terminated by user
- Network connectivity issues
- Permission problems (try running as Administrator)
- Antivirus software blocking downloads
- Insufficient disk space

Please check the error messages above and try again.
"@
    },
    @{
        Path           = Join-Path $scriptDir "configure.ps1"
        Name           = "configure.ps1"
        Description    = "Configuring project dependencies and build settings..."
        SuccessMessage = "Project configuration did not complete"
        FailureMessage = @"
Project configuration did not complete. This could be due to:
- Terminated by user
- Missing development tools (devenv.ps1 may not have completed successfully)
- Network issues downloading dependencies
- Missing directory with the LBA2 game assets

The development environment was set up successfully, but project configuration failed.
You can run configure.ps1 manually later to complete the setup.
"@
    },
    @{
        Path           = Join-Path $scriptDir "build.ps1"
        Name           = "build.ps1"
        Description    = "Building the LBA2 project..."
        SuccessMessage = "Project build did not complete"
        FailureMessage = @"
Project build was terminated before completion. This could be due to:
- Terminated by user
- Missing dependencies or tools
- Configuration issues
- Source code compilation errors
- Insufficient disk space

The development environment and project configuration completed successfully,
but the build failed. You can run build.ps1 manually later to attempt the build again.
"@
    },
    @{
        Path           = Join-Path $scriptDir "cfg.ps1"
        Name           = "cfg.ps1"
        Description    = "Configuring language settings..."
        Arguments      = "-LangSelectOnly -DontShowSuccess"
        SuccessMessage = "Language configuration completed successfully"
        FailureMessage = @"
Language configuration did not complete. This could be due to:
- Terminated by user
- Missing Release configuration files
- Invalid language settings

The project build completed successfully, but language configuration failed.
You can run cfg.ps1 manually later to configure language settings.
"@
    }
)

# Track overall success
$overallSuccess = $true
$completedSteps = @()

# Run each script in sequence
for ($i = 0; $i -lt $scripts.Count; $i++) {
    $script = $scripts[$i]
    
    # Check if script exists
    if (-not (Test-Path $script.Path)) {
        Write-Host "[x] ERROR: Script not found: $($script.Path)" -ForegroundColor Red
        $overallSuccess = $false
        break
    }
    
    # Run the script
    $arguments = if ($script.Arguments) { $script.Arguments } else { "" }
    $success = Invoke-ProjectScript -ScriptPath $script.Path -ScriptName $script.Name -Description $script.Description -WorkingDirectory $scriptDir -Arguments $arguments
    
    if ($success) {
        $completedSteps += $script.Name
        Write-Host $script.SuccessMessage -ForegroundColor Green
    }
    else {
        Write-Host ""
        Write-Host $script.FailureMessage -ForegroundColor Yellow
        $overallSuccess = $false
        break
    }
}

# Final status report
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($overallSuccess) {
    Write-Host "Complete Setup and Build Finished Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your IdaJS is fully set up and the project has been built!" -ForegroundColor Green
    Write-Host ""
    Write-Host "What was completed:" -ForegroundColor White
    Write-Host "1. [v] Development environment setup (devenv.ps1)" -ForegroundColor Green
    Write-Host "2. [v] Project configuration (configure.ps1)" -ForegroundColor Green
    Write-Host "3. [v] Project build (build.ps1)" -ForegroundColor Green
    Write-Host ""
    Write-Host "The built executable LBA2.exe and configuration file LBA2.cfg are available in the Release folder." -ForegroundColor White
    Write-Host "Put the mods to GameRun/mods folder." -ForegroundColor White
    Write-Host "  For example, create a folder GameRun/mods/my_mod, put the index.js and any possible other files there." -ForegroundColor Yellow
    Write-Host "To change the mod that should be loaded, edit the Release/LBA2.cfg file, use the 'Mod:' setting" -ForegroundColor White
    Write-Host "  For example, to load the mod in GameRun/mods/my_mod, set 'Mod: my_mod'" -ForegroundColor Yellow
    Write-Host "The save game files are in GameRun/save folder, grouped by mod names." -ForegroundColor White
    Write-Host ""
    Write-Host "To import mods automatically, and change the language, run setup_cfg.bat" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now start playing LBA2 with IdaJS mods!" -ForegroundColor White
    Write-Host "  - go to Release folder" -ForegroundColor Green
    Write-Host "  - run LBA2.exe" -ForegroundColor Green
}
else {
    Write-Host "Setup and Build Process Terminated before completion" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "The process was terminated by user or failed during one of the steps." -ForegroundColor Red
    Write-Host ""
    Write-Host "Completed steps:" -ForegroundColor White
    
    if ($completedSteps.Count -eq 0) {
        Write-Host "  None" -ForegroundColor Red
    }
    else {
        foreach ($step in $completedSteps) {
            Write-Host "  [v] $step" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    Write-Host "Please check the error messages above and try running the individual scripts manually in PowerShell 7:" -ForegroundColor Yellow
    Write-Host "  .\devenv.ps1     - Set up development environment" -ForegroundColor White
    Write-Host "  .\configure.ps1  - Configure project" -ForegroundColor White
    Write-Host "  .\build.ps1      - Build project" -ForegroundColor White
    Write-Host "  .\cfg.ps1        - Configure language settings" -ForegroundColor White
    
    exit 1
}
