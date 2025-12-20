# Build Library - Shared PowerShell functions for IdaJS build scripts
# This file contains reusable functions used by build.ps1, devenv.ps1, and other build scripts.
# Do not run this file directly - it should be dot-sourced by other scripts.

# Visual Studio 2022 installation paths to check (in priority order)
$script:VSInstallations = @(
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\BuildTools",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\BuildTools",
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\Enterprise",
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\Professional",
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\Community",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\Enterprise",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\Professional",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\Community"
)

<#
.SYNOPSIS
    Checks if v143 platform toolset is present in a Visual Studio installation.

.DESCRIPTION
    This function verifies that a Visual Studio installation contains the v143 platform toolset
    (MSVC 14.30.* through 14.4x.*) with the required x86 compiler and libraries.

.PARAMETER vsBasePath
    The base path to the Visual Studio installation (e.g., "${env:ProgramFiles}\Microsoft Visual Studio\2022\Community")

.RETURNS
    $true if v143 toolset with x86 support is found, $false otherwise.

.EXAMPLE
    Test-V143Toolset -vsBasePath "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\BuildTools"
#>
function Test-V143Toolset {
    param (
        [Parameter(Mandatory = $true)]
        [string]$vsBasePath
    )
    
    # Construct the path to the MSVC tools directory
    $toolsetPath = Join-Path $vsBasePath "VC\Tools\MSVC"
    
    if (-not (Test-Path $toolsetPath)) {
        return $false
    }
    
    # Get all MSVC toolset versions
    $toolsetVersions = Get-ChildItem -Path $toolsetPath -Directory -ErrorAction SilentlyContinue | 
    Where-Object { $_.Name -match "^\d+\.\d+\.\d+(\.\d+)?$" }
    
    if (-not $toolsetVersions) {
        return $false
    }
    
    # Sort versions numerically (not alphabetically) and check for v143 (14.3x.* or 14.4x.*)
    $sortedVersions = $toolsetVersions | Sort-Object { [version]$_.Name } -Descending
    
    foreach ($toolsetVersion in $sortedVersions) {
        $versionNumber = $toolsetVersion.Name
        
        # v143 toolset uses MSVC versions 14.30.* through 14.4x.*
        if ($versionNumber -match "^14\.[34]\d\.\d+(\.\d+)?$") {
            # Verify the x86 compiler exists - prefer x64-hosted, fallback to x86-hosted
            $compilerPath = Join-Path $toolsetVersion.FullName "bin\Hostx64\x86\cl.exe"
            
            if (-not (Test-Path $compilerPath)) {
                # Fallback to 32-bit hosted compiler if 64-bit hosted not available
                $compilerPath = Join-Path $toolsetVersion.FullName "bin\Hostx86\x86\cl.exe"
            }
            
            if (Test-Path $compilerPath) {
                # Additional verification: check for required lib path
                $libPath = Join-Path $toolsetVersion.FullName "lib\x86"
                
                if (Test-Path $libPath) {
                    return $true
                }
            }
        }
    }
    
    return $false
}
