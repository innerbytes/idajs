# Pre-build script to update version in src/version.h from package.json
# Calculates dev version based on git commits since the last tag using SemVer format

# Read package.json to get the version
try {
    $packageJsonPath = "package.json"
    $packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json
    $packageVersion = $packageJson.version
    
    Write-Host "Found version in package.json: $packageVersion"
    
    # Use git describe to get version info
    try {
        $gitDescribe = git describe --tags --long --match "v*" 2>&1
        
        if ($LASTEXITCODE -eq 0 -and $gitDescribe -match "^v?(\d+\.\d+\.\d+)-(\d+)-g([a-f0-9]+)$") {
            $tagVersion = $matches[1]
            $commitCount = [int]$matches[2]
            $commitHash = $matches[3]
            
            Write-Host "Git describe: v$tagVersion-$commitCount-g$commitHash"
            
            if ($commitCount -eq 0) {
                # No commits since tag, use clean version
                $finalVersion = $packageVersion
                Write-Host "No commits since tag, using clean version: $finalVersion"
            }
            else {
                # Commits exist, append dev pre-release identifier
                $finalVersion = "$packageVersion-dev.$commitCount"
                Write-Host "Calculated dev version: $finalVersion (based on $commitCount commits since v$tagVersion)"
            }
        }
        else {
            Write-Host "Could not parse git describe output, using package.json version as-is"
            $finalVersion = $packageVersion
        }
    }
    catch {
        Write-Host "Git describe failed, using package.json version as-is"
        $finalVersion = $packageVersion
    }
    
    # Path to version.h file
    $versionHeaderPath = "src\version.h"
    
    $versionContent = @"
#pragma once
#define IDA_VERSION "$finalVersion"
"@
    
    # Write the content to version.h
    $versionContent | Out-File -FilePath $versionHeaderPath -Encoding UTF8
    
    Write-Host "Updated IDA_VERSION to: $finalVersion"
    Write-Host "Version header updated successfully!"
    
}
catch {
    Write-Error "Failed to update version: $($_.Exception.Message)"
    exit 1
}
