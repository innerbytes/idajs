@echo off
REM Import Mod - Batch launcher for PowerShell 7
REM This batch file runs the cfg.ps1 script in PowerShell 7

echo Starting Mod Import Tool...

REM Run cfg.ps1 with PowerShell 7 - use full path to avoid PATH issues
REM First try the full path, then fall back to PATH-based execution
if exist "%ProgramFiles%\PowerShell\7\pwsh.exe" (
    "%ProgramFiles%\PowerShell\7\pwsh.exe" -ExecutionPolicy Bypass -Command "Set-Location '%~dp0'; & '%~dp0cfg.ps1'"
) else (
    pwsh.exe -ExecutionPolicy Bypass -Command "Set-Location '%~dp0'; & '%~dp0cfg.ps1'"
)

echo.
