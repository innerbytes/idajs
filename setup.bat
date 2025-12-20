@echo off
setlocal enabledelayedexpansion

REM Check if running as administrator
echo Checking administrator privileges...
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR: Administrator privileges required
    echo ========================================
    echo.
    echo This script must be run as Administrator to install PowerShell 7
    echo and set up the development environment properly.
    echo.
    echo Please:
    echo 1. Right-click on this batch file
    echo 2. Select "Run as administrator"
    echo 3. Click "Yes" when prompted by User Account Control
    echo.
    pause
    exit /b 1
)

echo Administrator privileges confirmed.
echo.

echo ====================================================================
echo LBA2 Community - IdaJS - Easy Build Script
echo ====================================================================
echo.

REM Check if we're running on Windows 10 or 11
echo Checking Windows Kernel NT version...

REM Simple check: look for "Version 10." in ver command output
REM Both Windows 10 and Windows 11 use NT kernel version 10
ver | findstr /C:"Version 10." >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Windows version check passed: Windows 10 or 11 detected
) else (
    echo ERROR: This script requires Windows 10 or Windows 11.
    echo Your current version:
    ver
    echo Please upgrade your Windows and try again.
    pause
    exit /b 1
)
echo.

REM Check if PowerShell 7 is installed
echo Checking for PowerShell 7...
pwsh.exe -Command "Write-Host 'PowerShell 7 detected'" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo PowerShell 7 is already installed.
    goto :run_setup
)

echo PowerShell 7 not found. Downloading and installing...
echo.

REM Create temp directory for download
set TEMP_DIR=%TEMP%\PS7Setup
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

REM Detect architecture
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    set ARCH=x64
) else if "%PROCESSOR_ARCHITECTURE%"=="ARM64" (
    set ARCH=arm64
) else (
    set ARCH=x86
)

echo Detected architecture: %ARCH%

REM Download PowerShell 7 MSI
set PS7_URL=https://github.com/PowerShell/PowerShell/releases/download/v7.5.2/PowerShell-7.5.2-win-%ARCH%.msi
set PS7_MSI=%TEMP_DIR%\PowerShell-7.5.2-win-%ARCH%.msi

echo Downloading PowerShell 7 from: %PS7_URL%
powershell.exe -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; $webClient = New-Object System.Net.WebClient; $webClient.DownloadFile('%PS7_URL%', '%PS7_MSI%'); $webClient.Dispose()}"

if not exist "%PS7_MSI%" (
    echo ERROR: Failed to download PowerShell 7 installer.
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo Download completed successfully.
echo Installing PowerShell 7...

REM Install PowerShell 7 silently and wait for completion
msiexec /i "%PS7_MSI%" /quiet /norestart /l*v "%TEMP%\PS7Install.log"
set INSTALL_EXIT_CODE=%ERRORLEVEL%

if %INSTALL_EXIT_CODE% NEQ 0 (
    echo ERROR: PowerShell 7 installation failed with exit code %INSTALL_EXIT_CODE%
    echo Installation log available at: %TEMP%\PS7Install.log
    echo.
    echo Common solutions:
    echo - Run this script as Administrator
    echo - Check if Windows Installer service is running
    echo - Ensure no other installations are in progress
    pause
    exit /b %INSTALL_EXIT_CODE%
)

REM Wait longer for installation to fully complete and PATH to be updated
echo Waiting for installation to complete and PATH to be updated...
timeout /t 30 /nobreak >nul

REM Try to refresh environment variables
call :RefreshEnv

REM Clean up
if exist "%PS7_MSI%" del "%PS7_MSI%"
if exist "%TEMP_DIR%" rmdir "%TEMP_DIR%"

REM Verify installation with multiple attempts
echo Verifying PowerShell 7 installation...
set VERIFICATION_ATTEMPTS=0

:VerifyLoop
set /a VERIFICATION_ATTEMPTS+=1
if %VERIFICATION_ATTEMPTS% GTR 15 goto :VerifyFailed

REM Try direct path first
if exist "%ProgramFiles%\PowerShell\7\pwsh.exe" (
    "%ProgramFiles%\PowerShell\7\pwsh.exe" -Command "Write-Host 'PowerShell 7 installation verified'" >nul 2>&1
    if !ERRORLEVEL! EQU 0 goto :VerifySuccess
)

REM Try PATH-based execution
pwsh.exe -Command "Write-Host 'PowerShell 7 installation verified'" >nul 2>&1
if %ERRORLEVEL% EQU 0 goto :VerifySuccess

echo Attempt %VERIFICATION_ATTEMPTS%: PowerShell 7 not ready yet, waiting...
timeout /t 5 /nobreak >nul
goto :VerifyLoop

:VerifyFailed
echo ERROR: PowerShell 7 installation failed or PowerShell 7 is not accessible.
echo Installation log available at: %TEMP%\PS7Install.log
echo.
echo Please try the following:
echo 1. Restart your command prompt as Administrator and run this script again
echo 2. Manually add %ProgramFiles%\PowerShell\7\ to your PATH
echo 3. Check the installation log for detailed error information
pause
exit /b 1

:VerifySuccess
echo PowerShell 7 installed and verified successfully!
echo.

:run_setup
echo Running complete build process using PowerShell 7...
echo.

REM Run compile.ps1 with PowerShell 7 - use full path to avoid PATH issues
REM First try the full path, then fall back to PATH-based execution
if exist "C:\Program Files\PowerShell\7\pwsh.exe" (
    "C:\Program Files\PowerShell\7\pwsh.exe" -ExecutionPolicy Bypass -Command "Set-Location '%~dp0'; & '%~dp0compile.ps1'"
) else (
    pwsh.exe -ExecutionPolicy Bypass -Command "Set-Location '%~dp0'; & '%~dp0compile.ps1'"
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: compile.ps1 execution failed with exit code %ERRORLEVEL%
    echo.
    echo The complete build process failed. Please check the error messages above.
    echo To run the complete process again run: .\compile.ps1 from PowerShell 7.
    pause
    exit /b %ERRORLEVEL%
)

echo.
pause

:RefreshEnv
REM Refresh environment variables without requiring a restart
for /f %%i in ('echo %PATH%') do set CURRENT_PATH=%%i
for /f "skip=2 tokens=3*" %%a in ('reg query HKLM\SYSTEM\CurrentControlSet\Control\Session" "Manager\Environment /v PATH') do set SYSTEM_PATH=%%b
for /f "skip=2 tokens=3*" %%a in ('reg query HKCU\Environment /v PATH 2^>nul') do set USER_PATH=%%b
if defined USER_PATH (
    set "PATH=%SYSTEM_PATH%;%USER_PATH%"
) else (
    set "PATH=%SYSTEM_PATH%"
)
goto :eof
