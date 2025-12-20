#requires -version 7.0

<#
.SYNOPSIS
    Import a mod for the game from either a folder or zip file.

.DESCRIPTION
    This script provides a Windows UI to select and import a mod from either:
    - A folder containing index.js (directly or in src/ subfolder)
    - A zip file containing the mod structure

    The mod will be imported to GameRun/mods/ and the LBA2.cfg file will be updated.

.NOTES
    Requires PowerShell 7.0 or later
    Requires Windows Forms (available on Windows)
#>

param(
    [Parameter(Mandatory = $false)]
    [switch]$LangSelectOnly,
    
    [Parameter(Mandatory = $false)]
    [switch]$DontShowSuccess
)

# Ensure we're running PowerShell 7+
if ($PSVersionTable.PSVersion.Major -lt 7) {
    Write-Error "This script requires PowerShell 7.0 or later. Current version: $($PSVersionTable.PSVersion)"
    exit 1
}

# Add Windows Forms assembly
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Global variables
$script:GameRunModsPath = "GameRun/mods"
$script:DebugLBACfgPath = "Debug/LBA2.cfg"
$script:ReleaseLBACfgPath = "Release/LBA2.cfg"
$script:LanguageAction = $null

function Get-LanguageSettingsFromCfg {
    <#
    .SYNOPSIS
    Reads current Language and LanguageCD settings from a cfg file
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$ConfigPath
    )
    
    $defaultResult = @{
        TextLanguage  = "English"
        AudioLanguage = "English"
    }
    
    if (-not (Test-Path $ConfigPath)) {
        return $defaultResult
    }
    
    try {
        $content = Get-Content $ConfigPath
        $textLanguage = "English"
        $audioLanguage = "English"
        
        foreach ($line in $content) {
            $trimmedLine = $line.TrimStart()
            
            if ($trimmedLine.StartsWith("Language:")) {
                $textLanguage = ($trimmedLine -replace "Language:\s*", "").Trim()
            }
            elseif ($trimmedLine.StartsWith("LanguageCD:")) {
                $audioLanguage = ($trimmedLine -replace "LanguageCD:\s*", "").Trim()
            }
        }
        
        return @{
            TextLanguage  = $textLanguage
            AudioLanguage = $audioLanguage
        }
    }
    catch {
        Write-Host "Error reading language settings from ${ConfigPath}: $($_.Exception.Message)" -ForegroundColor Yellow
        return $defaultResult
    }
}

function Show-LanguageSelectionDialog {
    <#
    .SYNOPSIS
    Shows a dialog for selecting text and audio languages
    #>
    param(
        [Parameter(Mandatory = $false)]
        [string]$InitialTextLanguage = "English",
        
        [Parameter(Mandatory = $false)]
        [string]$InitialAudioLanguage = "English",
        
        [Parameter(Mandatory = $false)]
        [string]$ConfigType = "Release"
    )
    
    # Available languages based on the cfg comments
    $textLanguages = @("English", "Français", "Deutsch", "Español", "Italiano", "Portugues")
    $audioLanguages = @("English", "Français", "Deutsch")
    
    # Create main form
    $form = New-Object System.Windows.Forms.Form
    $form.Text = "Language Selection ($ConfigType)"
    $form.Size = New-Object System.Drawing.Size(410, 450)
    $form.StartPosition = "CenterScreen"
    $form.FormBorderStyle = "FixedDialog"
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    
    # Text Language Group
    $groupTextLang = New-Object System.Windows.Forms.GroupBox
    $groupTextLang.Location = New-Object System.Drawing.Point(20, 20)
    $groupTextLang.Size = New-Object System.Drawing.Size(340, 180)
    $groupTextLang.Text = "Text Language"
    $form.Controls.Add($groupTextLang)
    
    # Text language radio buttons
    $textRadioButtons = @{}
    $yPos = 25
    foreach ($lang in $textLanguages) {
        $radio = New-Object System.Windows.Forms.RadioButton
        $radio.Location = New-Object System.Drawing.Point(15, $yPos)
        $radio.Size = New-Object System.Drawing.Size(300, 20)
        $radio.Text = $lang
        $radio.Name = "text_$lang"
        if ($lang -eq $InitialTextLanguage) { $radio.Checked = $true }
        $textRadioButtons[$lang] = $radio
        $groupTextLang.Controls.Add($radio)
        $yPos += 25
    }
    
    # Audio Language Group
    $groupAudioLang = New-Object System.Windows.Forms.GroupBox
    $groupAudioLang.Location = New-Object System.Drawing.Point(20, 220)
    $groupAudioLang.Size = New-Object System.Drawing.Size(340, 110)
    $groupAudioLang.Text = "Audio Language"
    $form.Controls.Add($groupAudioLang)
    
    # Audio language radio buttons
    $audioRadioButtons = @{}
    $yPos = 25
    foreach ($lang in $audioLanguages) {
        $radio = New-Object System.Windows.Forms.RadioButton
        $radio.Location = New-Object System.Drawing.Point(15, $yPos)
        $radio.Size = New-Object System.Drawing.Size(300, 20)
        $radio.Text = $lang
        $radio.Name = "audio_$lang"
        if ($lang -eq $InitialAudioLanguage) { $radio.Checked = $true }
        $audioRadioButtons[$lang] = $radio
        $groupAudioLang.Controls.Add($radio)
        $yPos += 25
    }
    
    # Confirm button
    $buttonConfirm = New-Object System.Windows.Forms.Button
    $buttonConfirm.Location = New-Object System.Drawing.Point(100, 360)
    $buttonConfirm.Size = New-Object System.Drawing.Size(180, 30)
    $buttonConfirm.Text = "Confirm Language Selection"
    $buttonConfirm.Add_Click({
            # Get selected languages
            $selectedTextLang = $null
            $selectedAudioLang = $null
        
            foreach ($lang in $textLanguages) {
                if ($textRadioButtons[$lang].Checked) {
                    $selectedTextLang = $lang
                    break
                }
            }
        
            foreach ($lang in $audioLanguages) {
                if ($audioRadioButtons[$lang].Checked) {
                    $selectedAudioLang = $lang
                    break
                }
            }
        
            # Store results in form tag for retrieval
            $form.Tag = @{
                TextLanguage  = $selectedTextLang
                AudioLanguage = $selectedAudioLang
            }
        
            $form.DialogResult = [System.Windows.Forms.DialogResult]::OK
            $form.Close()
        })
    $form.Controls.Add($buttonConfirm)
    
    # Cancel button
    $buttonCancel = New-Object System.Windows.Forms.Button
    $buttonCancel.Location = New-Object System.Drawing.Point(300, 360)
    $buttonCancel.Size = New-Object System.Drawing.Size(80, 30)
    $buttonCancel.Text = "Cancel"
    $buttonCancel.Add_Click({
            $form.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
            $form.Close()
        })
    $form.Controls.Add($buttonCancel)
    
    $result = $form.ShowDialog()
    
    if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
        return $form.Tag
    }
    
    return $null
}

function Show-MainDialog {
    <#
    .SYNOPSIS
    Shows a dialog for selecting mod source (folder or zip file)
    #>
    
    # Check if cfg files exist first (needed for form sizing)
    $releaseExists = Test-Path $script:ReleaseLBACfgPath
    $debugExists = Test-Path $script:DebugLBACfgPath
    
    # Create main form
    $form = New-Object System.Windows.Forms.Form
    $form.Text = "LBA2 IdaJS Tools"
    # Adjust form height based on button layout
    $formHeight = 240  # Base height
    if ($debugExists) {
        $formHeight = 280  # Extra height when both buttons are present vertically
    }
    $form.Size = New-Object System.Drawing.Size(450, $formHeight)
    $form.StartPosition = "CenterScreen"
    $form.FormBorderStyle = "FixedDialog"
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    
    # Mod Import Section
    $labelModImport = New-Object System.Windows.Forms.Label
    $labelModImport.Location = New-Object System.Drawing.Point(20, 20)
    $labelModImport.Size = New-Object System.Drawing.Size(400, 20)
    $labelModImport.Text = "Import Mod:"
    $labelModImport.Font = New-Object System.Drawing.Font("Microsoft Sans Serif", 9, [System.Drawing.FontStyle]::Bold)
    $form.Controls.Add($labelModImport)
    
    # Folder button
    $buttonFolder = New-Object System.Windows.Forms.Button
    $buttonFolder.Location = New-Object System.Drawing.Point(50, 50)
    $buttonFolder.Size = New-Object System.Drawing.Size(120, 30)
    $buttonFolder.Text = "Select Folder"
    $buttonFolder.Add_Click({
            $form.DialogResult = [System.Windows.Forms.DialogResult]::Yes
            $form.Close()
        })
    $form.Controls.Add($buttonFolder)
    
    # Zip file button
    $buttonZip = New-Object System.Windows.Forms.Button
    $buttonZip.Location = New-Object System.Drawing.Point(250, 50)
    $buttonZip.Size = New-Object System.Drawing.Size(120, 30)
    $buttonZip.Text = "Select ZIP File"
    $buttonZip.Add_Click({
            $form.DialogResult = [System.Windows.Forms.DialogResult]::No
            $form.Close()
        })
    $form.Controls.Add($buttonZip)
    
    # Other Settings Section
    $labelOtherSettings = New-Object System.Windows.Forms.Label
    $labelOtherSettings.Location = New-Object System.Drawing.Point(20, 100)
    $labelOtherSettings.Size = New-Object System.Drawing.Size(400, 20)
    $labelOtherSettings.Text = "Other Settings:"
    $labelOtherSettings.Font = New-Object System.Drawing.Font("Microsoft Sans Serif", 9, [System.Drawing.FontStyle]::Bold)
    $form.Controls.Add($labelOtherSettings)
    
    # Language Settings buttons configuration
    $languageButtons = @()
    $currentY = 130
    
    # Define button configurations based on existence
    if ($releaseExists) {
        $languageButtons += @{
            Text    = "Language Settings"
            Action  = "LanguageRelease"
            Enabled = $true
            Tooltip = $null
        }
    }
    
    if ($debugExists) {
        $languageButtons += @{
            Text    = "Language Settings (Debug)"
            Action  = "LanguageDebug"
            Enabled = $true
            Tooltip = $null
        }
    }
    
    # Add grayed out Release button if needed
    if (-not $releaseExists) {
        $languageButtons += @{
            Text    = "Language Settings"
            Action  = $null
            Enabled = $false
            Tooltip = "Run project setup first"
        }
    }
    
    # Create and position buttons
    foreach ($buttonConfig in $languageButtons) {
        $button = New-Object System.Windows.Forms.Button
        $button.Location = New-Object System.Drawing.Point(50, $currentY)
        $button.Size = New-Object System.Drawing.Size(140, 40)
        $button.Text = $buttonConfig.Text
        $button.Enabled = $buttonConfig.Enabled
        
        if ($buttonConfig.Action) {
            # Create click handler with proper variable scoping
            $button | Add-Member -MemberType NoteProperty -Name "ActionValue" -Value $buttonConfig.Action
            $button.Add_Click({
                    $script:LanguageAction = $this.ActionValue
                    $form.DialogResult = [System.Windows.Forms.DialogResult]::Retry
                    $form.Close()
                })
        }
        
        # Add warning label for disabled buttons instead of tooltip
        if ($buttonConfig.Tooltip) {
            $warningLabel = New-Object System.Windows.Forms.Label
            $warningLabel.Location = New-Object System.Drawing.Point(50, ($currentY + 45))
            $warningLabel.Size = New-Object System.Drawing.Size(300, 20)
            $warningLabel.Text = $buttonConfig.Tooltip
            $warningLabel.ForeColor = [System.Drawing.Color]::Red
            $warningLabel.Font = New-Object System.Drawing.Font("Microsoft Sans Serif", 8, [System.Drawing.FontStyle]::Italic)
            $form.Controls.Add($warningLabel)
            $currentY += 25  # Extra space for the warning label
        }
        
        $form.Controls.Add($button)
        $currentY += 45
    }
    
    # Cancel button - positioned to the right of the language buttons
    $buttonCancel = New-Object System.Windows.Forms.Button
    $buttonCancel.Location = New-Object System.Drawing.Point(250, 130)
    $buttonCancel.Size = New-Object System.Drawing.Size(80, 30)
    $buttonCancel.Text = "Cancel"
    $buttonCancel.Add_Click({
            $form.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
            $form.Close()
        })
    $form.Controls.Add($buttonCancel)
    
    return $form.ShowDialog()
}

function Select-ModFolder {
    <#
    .SYNOPSIS
    Opens a folder browser dialog to select a mod folder
    #>
    
    $folderBrowser = New-Object System.Windows.Forms.FolderBrowserDialog
    $folderBrowser.Description = "Select the mod folder containing index.js"
    $folderBrowser.ShowNewFolderButton = $false
    
    if ($folderBrowser.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        return $folderBrowser.SelectedPath
    }
    
    return $null
}

function Select-ModZipFile {
    <#
    .SYNOPSIS
    Opens a file dialog to select a mod zip file
    #>
    
    $fileDialog = New-Object System.Windows.Forms.OpenFileDialog
    $fileDialog.Title = "Select the mod ZIP file"
    $fileDialog.Filter = "ZIP files (*.zip)|*.zip|All files (*.*)|*.*"
    $fileDialog.FilterIndex = 1
    
    if ($fileDialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        return $fileDialog.FileName
    }
    
    return $null
}

function Test-IndexJsExists {
    <#
    .SYNOPSIS
    Tests if index.js exists in the specified path or src subfolder
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )
    
    $indexJsPath = Join-Path $Path "index.js"
    $srcIndexJsPath = Join-Path $Path "src/index.js"
    
    if (Test-Path $indexJsPath) {
        return @{ Found = $true; Path = $indexJsPath; IsInSrc = $false }
    }
    elseif (Test-Path $srcIndexJsPath) {
        return @{ Found = $true; Path = $srcIndexJsPath; IsInSrc = $true }
    }
    else {
        return @{ Found = $false; Path = $null; IsInSrc = $false }
    }
}

function Confirm-Overwrite {
    <#
    .SYNOPSIS
    Shows a confirmation dialog for overwriting existing mod
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$ModName
    )
    
    $result = [System.Windows.Forms.MessageBox]::Show(
        "Mod '$ModName' already exists. Do you want to overwrite it?",
        "Overwrite Confirmation",
        [System.Windows.Forms.MessageBoxButtons]::YesNo,
        [System.Windows.Forms.MessageBoxIcon]::Question
    )
    
    return $result -eq [System.Windows.Forms.DialogResult]::Yes
}

function Import-ModFromFolder {
    <#
    .SYNOPSIS
    Imports a mod from a selected folder
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$FolderPath
    )
    
    try {
        Write-Host "Importing mod from folder: $FolderPath"
        
        # Check if index.js exists
        $indexJsTest = Test-IndexJsExists -Path $FolderPath
        if (-not $indexJsTest.Found) {
            [System.Windows.Forms.MessageBox]::Show(
                "No index.js file found in the selected folder or src subfolder.",
                "Error",
                [System.Windows.Forms.MessageBoxButtons]::OK,
                [System.Windows.Forms.MessageBoxIcon]::Error
            )
            return $false
        }
        
        # Get mod folder name
        $modName = Split-Path $FolderPath -Leaf
        $destModPath = Join-Path $script:GameRunModsPath $modName
        
        # Check if destination exists and confirm overwrite
        if (Test-Path $destModPath) {
            if (-not (Confirm-Overwrite -ModName $modName)) {
                Write-Host "Import cancelled by user."
                return $false
            }
            Remove-Item $destModPath -Recurse -Force
        }
        
        # Create destination directory
        New-Item -Path $destModPath -ItemType Directory -Force | Out-Null
        
        # Handle different source scenarios
        if ($indexJsTest.IsInSrc) {
            # Case 3: index.js is in src folder - copy contents of src folder + media folder if exists
            $sourceDir = Join-Path $FolderPath "src"
            Write-Host "Found index.js in src folder, copying all contents from src recursively"
            
            # Copy all files and folders from src directory
            $items = Get-ChildItem -Path $sourceDir -Force
            foreach ($item in $items) {
                $destItemPath = Join-Path $destModPath $item.Name
                if ($item.PSIsContainer) {
                    Copy-Item -Path $item.FullName -Destination $destItemPath -Recurse -Force
                    Write-Host "Copied folder from src: $($item.Name)"
                }
                else {
                    Copy-Item -Path $item.FullName -Destination $destItemPath -Force
                    Write-Host "Copied file from src: $($item.Name)"
                }
            }
            
            # Also check for media folder at the same level as src
            $mediaPath = Join-Path $FolderPath "media"
            if (Test-Path $mediaPath) {
                $destMediaPath = Join-Path $destModPath "media"
                Copy-Item -Path $mediaPath -Destination $destMediaPath -Recurse -Force
                Write-Host "Copied media folder from root"
            }
        }
        else {
            # Case 4: index.js is in root - copy all contents of the folder
            $sourceDir = $FolderPath
            Write-Host "Found index.js in root folder, copying all contents recursively"
            
            # Copy all files and folders from source directory
            $items = Get-ChildItem -Path $sourceDir -Force
            foreach ($item in $items) {
                $destItemPath = Join-Path $destModPath $item.Name
                if ($item.PSIsContainer) {
                    Copy-Item -Path $item.FullName -Destination $destItemPath -Recurse -Force
                    Write-Host "Copied folder: $($item.Name)"
                }
                else {
                    Copy-Item -Path $item.FullName -Destination $destItemPath -Force
                    Write-Host "Copied file: $($item.Name)"
                }
            }
        }
        
        return $modName
    }
    catch {
        Write-Host "Error in Import-ModFromFolder: $($_.Exception.Message)" -ForegroundColor Red
        [System.Windows.Forms.MessageBox]::Show(
            "Failed to import mod from folder: $($_.Exception.Message)",
            "Import Error",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        )
        return $false
    }
}

function Import-ModFromZip {
    <#
    .SYNOPSIS
    Imports a mod from a selected zip file
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$ZipPath
    )
    
    Write-Host "Importing mod from zip: $ZipPath"
    
    # Create temporary directory
    $tempPath = Join-Path $env:TEMP "ModImport_$(Get-Random)"
    New-Item -Path $tempPath -ItemType Directory -Force | Out-Null
    
    try {
        # Extract zip file
        Expand-Archive -Path $ZipPath -DestinationPath $tempPath -Force
        
        # Find index.js in extracted contents
        $extractedContents = Get-ChildItem $tempPath
        $indexJsInfo = $null
        $modSourcePath = $null
        $modName = $null
        
        # Check root level first - only look for index.js directly in root
        $rootIndexJsPath = Join-Path $tempPath "index.js"
        if (Test-Path $rootIndexJsPath) {
            $indexJsInfo = @{ Found = $true; Path = $rootIndexJsPath; IsInSrc = $false }
            $modSourcePath = $tempPath
            $modName = [System.IO.Path]::GetFileNameWithoutExtension($ZipPath)
        }
        else {
            # Check one level down (subfolders) - only look for index.js directly in subfolder root
            foreach ($item in $extractedContents) {
                if ($item.PSIsContainer) {
                    $subfolderIndexJsPath = Join-Path $item.FullName "index.js"
                    if (Test-Path $subfolderIndexJsPath) {
                        $indexJsInfo = @{ Found = $true; Path = $subfolderIndexJsPath; IsInSrc = $false }
                        $modSourcePath = $item.FullName
                        $modName = $item.Name
                        break
                    }
                }
            }
        }
        
        if (-not $indexJsInfo) {
            [System.Windows.Forms.MessageBox]::Show(
                "No index.js file found in the ZIP file (checked root and one level down).",
                "Error",
                [System.Windows.Forms.MessageBoxButtons]::OK,
                [System.Windows.Forms.MessageBoxIcon]::Error
            )
            return $false
        }
        
        # Create destination mod path
        $destModPath = Join-Path $script:GameRunModsPath $modName
        
        # Check if destination exists and confirm overwrite
        if (Test-Path $destModPath) {
            if (-not (Confirm-Overwrite -ModName $modName)) {
                Write-Host "Import cancelled by user."
                return $false
            }
            Remove-Item $destModPath -Recurse -Force
        }
        
        # Create destination directory
        New-Item -Path $destModPath -ItemType Directory -Force | Out-Null
        
        # For ZIP files, index.js is always in the root of the source directory
        $sourceDir = $modSourcePath
        if ($modSourcePath -eq $tempPath) {
            Write-Host "Found index.js in ZIP root, copying all contents recursively"
        }
        else {
            Write-Host "Found index.js in subfolder root, copying all contents recursively"
        }
        
        # Copy all files and folders from source directory
        $items = Get-ChildItem -Path $sourceDir -Force
        foreach ($item in $items) {
            $destItemPath = Join-Path $destModPath $item.Name
            if ($item.PSIsContainer) {
                Copy-Item -Path $item.FullName -Destination $destItemPath -Recurse -Force
                Write-Host "Copied folder: $($item.Name)"
            }
            else {
                Copy-Item -Path $item.FullName -Destination $destItemPath -Force
                Write-Host "Copied file: $($item.Name)"
            }
        }
        
        return $modName
    }
    finally {
        # Clean up temporary directory
        if (Test-Path $tempPath) {
            Remove-Item $tempPath -Recurse -Force
        }
    }
}

function Update-LanguageInSingleLBACfg {
    <#
    .SYNOPSIS
    Updates Language and LanguageCD settings in a single LBA2.cfg file
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$ConfigPath,
        
        [Parameter(Mandatory = $true)]
        [string]$TextLanguage,
        
        [Parameter(Mandatory = $true)]
        [string]$AudioLanguage
    )
    
    if (-not (Test-Path $ConfigPath)) {
        Write-Host "LBA2.cfg file not found at: $ConfigPath" -ForegroundColor Yellow
        return $false
    }
    
    try {
        $content = Get-Content $ConfigPath
        $languageUpdated = $false
        $languageCDUpdated = $false
        
        # Update existing lines
        for ($i = 0; $i -lt $content.Length; $i++) {
            $line = $content[$i]
            $trimmedLine = $line.TrimStart()
            
            if ($trimmedLine.StartsWith("Language:")) {
                $content[$i] = $line -replace "Language:.*", "Language: $TextLanguage"
                $languageUpdated = $true
                Write-Host "Updated Language setting in ${ConfigPath} to: $TextLanguage"
            }
            elseif ($trimmedLine.StartsWith("LanguageCD:")) {
                $content[$i] = $line -replace "LanguageCD:.*", "LanguageCD: $AudioLanguage"
                $languageCDUpdated = $true
                Write-Host "Updated LanguageCD setting in ${ConfigPath} to: $AudioLanguage"
            }
        }
        
        # Add missing settings at the beginning if not found
        $newContent = @()
        $addedSettings = @()
        
        if (-not $languageUpdated) {
            $addedSettings += "Language: $TextLanguage"
            Write-Host "Added Language setting to ${ConfigPath}: $TextLanguage"
        }
        
        if (-not $languageCDUpdated) {
            $addedSettings += "LanguageCD: $AudioLanguage"
            Write-Host "Added LanguageCD setting to ${ConfigPath}: $AudioLanguage"
        }
        
        if ($addedSettings.Count -gt 0) {
            # Add new settings at the beginning of the file
            $newContent += $addedSettings
            $newContent += ""
            $newContent += $content
        }
        else {
            $newContent = $content
        }
        
        Set-Content -Path $ConfigPath -Value $newContent
        Write-Host "Successfully updated language settings in $ConfigPath"
        return $true
    }
    catch {
        Write-Host "Error updating language settings in ${ConfigPath}: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Update-SingleLanguageSettings {
    <#
    .SYNOPSIS
    Updates Language and LanguageCD settings in a specific LBA2.cfg file
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$ConfigPath,
        
        [Parameter(Mandatory = $true)]
        [string]$TextLanguage,
        
        [Parameter(Mandatory = $true)]
        [string]$AudioLanguage,
        
        [Parameter(Mandatory = $true)]
        [string]$ConfigType,
        
        [Parameter(Mandatory = $false)]
        [switch]$DontShowSuccess
    )
    
    if (-not (Test-Path $ConfigPath)) {
        [System.Windows.Forms.MessageBox]::Show(
            "$ConfigType configuration file not found. Please build the project first.",
            "Error",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        )
        return $false
    }
    
    Write-Host "Updating $ConfigType configuration language settings..."
    if (Update-LanguageInSingleLBACfg -ConfigPath $ConfigPath -TextLanguage $TextLanguage -AudioLanguage $AudioLanguage) {
        if (-not $DontShowSuccess) {
            [System.Windows.Forms.MessageBox]::Show(
                "Successfully updated $ConfigType language settings.$([Environment]::NewLine)Text Language: $TextLanguage$([Environment]::NewLine)Audio Language: $AudioLanguage",
                "Language Settings Updated",
                [System.Windows.Forms.MessageBoxButtons]::OK,
                [System.Windows.Forms.MessageBoxIcon]::Information
            )
        }
        return $true
    }
    else {
        [System.Windows.Forms.MessageBox]::Show(
            "Failed to update $ConfigType language settings. Please check the error messages above.",
            "Error",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        )
        return $false
    }
}

function Update-SingleLBACfg {
    <#
    .SYNOPSIS
    Updates a single LBA2.cfg file to set the mod
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$ConfigPath,
        
        [Parameter(Mandatory = $true)]
        [string]$ModName
    )
    
    if (-not (Test-Path $ConfigPath)) {
        Write-Host "LBA2.cfg file not found at: $ConfigPath" -ForegroundColor Yellow
        return $false
    }
    
    try {
        $content = Get-Content $ConfigPath
        $updated = $false
        
        for ($i = 0; $i -lt $content.Length; $i++) {
            $line = $content[$i]
            $trimmedLine = $line.TrimStart()
            
            if ($trimmedLine.StartsWith("Mod:")) {
                $content[$i] = $line -replace "Mod:.*", "Mod: $ModName"
                $updated = $true
                break
            }
        }
        
        if ($updated) {
            Set-Content -Path $ConfigPath -Value $content
            Write-Host "Updated ${ConfigPath} with mod: $ModName"
        }
        else {
            # No 'Mod:' line found, add one after "Configuration file" line or at the beginning
            Write-Host "No 'Mod:' line found in ${ConfigPath}, adding new one"
            
            # Look for "Configuration file" line
            $configLineIndex = -1
            for ($i = 0; $i -lt $content.Length; $i++) {
                if ($content[$i] -match "Configuration file") {
                    $configLineIndex = $i
                    break
                }
            }
            
            if ($configLineIndex -ge 0) {
                # Insert after the "Configuration file" line
                Write-Host "Found 'Configuration file' line, adding Mod line after it"
                $newContent = @()
                $newContent += $content[0..$configLineIndex]
                $newContent += "Mod: $ModName"
                $newContent += ""
                if ($configLineIndex + 1 -lt $content.Length) {
                    $newContent += $content[($configLineIndex + 1)..($content.Length - 1)]
                }
            }
            else {
                # Add at the beginning if no "Configuration file" line found
                Write-Host "No 'Configuration file' line found, adding Mod line at the beginning"
                $newContent = @("Mod: $ModName", "") + $content
            }
            
            Set-Content -Path $ConfigPath -Value $newContent
            Write-Host "Added new Mod line to ${ConfigPath} with mod: $ModName"
        }
        
        return $true
    }
    catch {
        Write-Host "Error updating ${ConfigPath}: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Update-LBACfg {
    <#
    .SYNOPSIS
    Updates LBA2.cfg files in Debug and/or Release folders to set the mod
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$ModName
    )
    
    $debugExists = Test-Path $script:DebugLBACfgPath
    $releaseExists = Test-Path $script:ReleaseLBACfgPath
    
    if (-not $debugExists -and -not $releaseExists) {
        [System.Windows.Forms.MessageBox]::Show(
            "Neither Debug nor Release folder found. Cannot update LBA2.cfg files.",
            "Warning",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Warning
        )
        return $false
    }
    
    $updateCount = 0
    $totalAttempts = 0
    
    # Update Debug config if Debug folder exists
    if ($debugExists) {
        $totalAttempts++
        Write-Host "Updating Debug configuration..."
        if (Update-SingleLBACfg -ConfigPath $script:DebugLBACfgPath -ModName $ModName) {
            $updateCount++
        }
    }
    
    # Update Release config if Release folder exists
    if ($releaseExists) {
        $totalAttempts++
        Write-Host "Updating Release configuration..."
        if (Update-SingleLBACfg -ConfigPath $script:ReleaseLBACfgPath -ModName $ModName) {
            $updateCount++
        }
    }
    
    if ($updateCount -eq 0) {
        [System.Windows.Forms.MessageBox]::Show(
            "Failed to update any LBA2.cfg files. Please check the error messages above.",
            "Error",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        )
        return $false
    }
    else {
        Write-Host "Successfully updated $updateCount of $totalAttempts configuration files."
        return $true
    }
}

# Main execution
function Main {
    try {
        Write-Host "LBA2 IdaJs configuration Tool"
        Write-Host "=============================="
        
        # Check if we should only show language selection for Release
        if ($LangSelectOnly) {
            Write-Host "Language selection only mode for Release configuration"
            
            # Check if Release cfg exists
            if (-not (Test-Path $script:ReleaseLBACfgPath)) {
                Write-Error "Release configuration file not found at: $script:ReleaseLBACfgPath"
                Write-Error "Please build the Release configuration first."
                exit 1
            }
            
            # Show Release language selection dialog directly
            $currentSettings = Get-LanguageSettingsFromCfg -ConfigPath $script:ReleaseLBACfgPath
            $languageSelection = Show-LanguageSelectionDialog -InitialTextLanguage $currentSettings.TextLanguage -InitialAudioLanguage $currentSettings.AudioLanguage -ConfigType "Release"
            
            if ($languageSelection) {
                Update-SingleLanguageSettings -ConfigPath $script:ReleaseLBACfgPath -TextLanguage $languageSelection.TextLanguage -AudioLanguage $languageSelection.AudioLanguage -ConfigType "Release" -DontShowSuccess:$DontShowSuccess
                Write-Host "Language settings updated successfully."
            }
            else {
                Write-Host "Language selection cancelled."
            }
            
            return  # Exit after language selection in this mode
        }
        
        # Ensure GameRun/mods directory exists (only needed for full mode)
        if (-not (Test-Path $script:GameRunModsPath)) {
            New-Item -Path $script:GameRunModsPath -ItemType Directory -Force | Out-Null
            Write-Host "Created mods directory: $script:GameRunModsPath"
        }
        
        # Main dialog loop - keeps showing main dialog until user chooses to exit
        do {
            $continueLoop = $false
            
            # Show selection dialog
            $dialogResult = Show-MainDialog
            
            switch ($dialogResult) {
                ([System.Windows.Forms.DialogResult]::Retry) {
                    # User chose language settings
                    try {
                        $languageSelection = $null
                        
                        if ($script:LanguageAction -eq "LanguageRelease") {
                            # Handle Release language settings
                            $currentSettings = Get-LanguageSettingsFromCfg -ConfigPath $script:ReleaseLBACfgPath
                            $languageSelection = Show-LanguageSelectionDialog -InitialTextLanguage $currentSettings.TextLanguage -InitialAudioLanguage $currentSettings.AudioLanguage -ConfigType "Release"
                            if ($languageSelection) {
                                Update-SingleLanguageSettings -ConfigPath $script:ReleaseLBACfgPath -TextLanguage $languageSelection.TextLanguage -AudioLanguage $languageSelection.AudioLanguage -ConfigType "Release" -DontShowSuccess:$DontShowSuccess
                                $continueLoop = $true  # Return to main dialog after successful update
                            }
                            else {
                                Write-Host "Release language selection cancelled."
                                $continueLoop = $true  # Return to main dialog
                            }
                        }
                        elseif ($script:LanguageAction -eq "LanguageDebug") {
                            # Handle Debug language settings
                            $currentSettings = Get-LanguageSettingsFromCfg -ConfigPath $script:DebugLBACfgPath
                            $languageSelection = Show-LanguageSelectionDialog -InitialTextLanguage $currentSettings.TextLanguage -InitialAudioLanguage $currentSettings.AudioLanguage -ConfigType "Debug"
                            if ($languageSelection) {
                                Update-SingleLanguageSettings -ConfigPath $script:DebugLBACfgPath -TextLanguage $languageSelection.TextLanguage -AudioLanguage $languageSelection.AudioLanguage -ConfigType "Debug" -DontShowSuccess:$DontShowSuccess
                                $continueLoop = $true  # Return to main dialog after successful update
                            }
                            else {
                                Write-Host "Debug language selection cancelled."
                                $continueLoop = $true  # Return to main dialog
                            }
                        }
                        
                        # Reset the action
                        $script:LanguageAction = $null
                    }
                    catch {
                        Write-Host "Error during language settings: $($_.Exception.Message)" -ForegroundColor Red
                        [System.Windows.Forms.MessageBox]::Show(
                            "Language settings failed: $($_.Exception.Message)",
                            "Language Settings Error",
                            [System.Windows.Forms.MessageBoxButtons]::OK,
                            [System.Windows.Forms.MessageBoxIcon]::Error
                        )
                        $script:LanguageAction = $null
                        $continueLoop = $true  # Return to main dialog on error
                    }
                }
                ([System.Windows.Forms.DialogResult]::Yes) {
                    # User chose folder
                    try {
                        $folderPath = Select-ModFolder
                        if ($folderPath) {
                            $modName = Import-ModFromFolder -FolderPath $folderPath
                            if ($modName -and $modName -ne $false) {
                                if (Update-LBACfg -ModName $modName) {
                                    [System.Windows.Forms.MessageBox]::Show(
                                        "Mod '$modName' imported successfully!",
                                        "Success",
                                        [System.Windows.Forms.MessageBoxButtons]::OK,
                                        [System.Windows.Forms.MessageBoxIcon]::Information
                                    )
                                }
                                else {
                                    throw "Failed to update LBA.cfg file"
                                }
                            }
                            else {
                                Write-Host "Folder import failed or was cancelled."
                            }
                        }
                        else {
                            Write-Host "No folder selected."
                        }
                        $continueLoop = $true  # Return to main dialog after folder import
                    }
                    catch {
                        Write-Host "Error during folder import: $($_.Exception.Message)" -ForegroundColor Red
                        [System.Windows.Forms.MessageBox]::Show(
                            "Import failed: $($_.Exception.Message)",
                            "Import Error",
                            [System.Windows.Forms.MessageBoxButtons]::OK,
                            [System.Windows.Forms.MessageBoxIcon]::Error
                        )
                        $continueLoop = $true  # Return to main dialog on error
                    }
                }
                ([System.Windows.Forms.DialogResult]::No) {
                    # User chose zip file
                    try {
                        $zipPath = Select-ModZipFile
                        if ($zipPath) {
                            $modName = Import-ModFromZip -ZipPath $zipPath
                            if ($modName -and $modName -ne $false) {
                                if (Update-LBACfg -ModName $modName) {
                                    [System.Windows.Forms.MessageBox]::Show(
                                        "Mod '$modName' imported successfully!",
                                        "Success",
                                        [System.Windows.Forms.MessageBoxButtons]::OK,
                                        [System.Windows.Forms.MessageBoxIcon]::Information
                                    )
                                }
                                else {
                                    throw "Failed to update LBA.cfg file"
                                }
                            }
                            else {
                                Write-Host "ZIP import failed or was cancelled."
                            }
                        }
                        else {
                            Write-Host "No ZIP file selected."
                        }
                        $continueLoop = $true  # Return to main dialog after ZIP import
                    }
                    catch {
                        Write-Host "Error during ZIP import: $($_.Exception.Message)" -ForegroundColor Red
                        [System.Windows.Forms.MessageBox]::Show(
                            "Import failed: $($_.Exception.Message)",
                            "Import Error",
                            [System.Windows.Forms.MessageBoxButtons]::OK,
                            [System.Windows.Forms.MessageBoxIcon]::Error
                        )
                        $continueLoop = $true  # Return to main dialog on error
                    }
                }
                ([System.Windows.Forms.DialogResult]::Cancel) {
                    Write-Host "Application cancelled by user."
                }
            }
        } while ($continueLoop)
    }
    catch {
        Write-Host "Critical error in main function: $($_.Exception.Message)" -ForegroundColor Red
        [System.Windows.Forms.MessageBox]::Show(
            "Critical error occurred: $($_.Exception.Message)",
            "Critical Error",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        )
    }
}

# Run the main function
Main
