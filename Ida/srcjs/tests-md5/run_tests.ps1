# PowerShell script to run MD5 tests with direct output comparison
Write-Host "===============================" -ForegroundColor Green
Write-Host "MD5 Implementation Comparison Test" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host ""

# Copy latest MD5 implementations from project
Write-Host "Copying latest MD5 implementations..." -ForegroundColor Cyan

# Get the project root (2 levels up from srcjs/tests-md5)
$projectRoot = Split-Path -Parent (Split-Path -Parent (Get-Location))

# Source paths
$md5HeaderPath = Join-Path $projectRoot "lib\md5\MD5.h"
$md5JsPath = Join-Path $projectRoot "srcjs\tests\js-md5\md5.js"

# Copy MD5.h
if (Test-Path $md5HeaderPath) {
    Copy-Item $md5HeaderPath -Destination "MD5.h" -Force
    Write-Host "[v] Copied MD5.h from lib/md5/" -ForegroundColor Green
}
else {
    Write-Host "[x] ERROR: Could not find MD5.h at $md5HeaderPath" -ForegroundColor Red
    exit 1
}

# Copy md5.js
if (Test-Path $md5JsPath) {
    Copy-Item $md5JsPath -Destination "md5.js" -Force
    Write-Host "[v] Copied md5.js from srcjs/tests/js-md5/" -ForegroundColor Green
}
else {
    Write-Host "[x] ERROR: Could not find md5.js at $md5JsPath" -ForegroundColor Red
    exit 1
}

Write-Host ""

# First, let's find and set up Visual Studio environment
$vsPath = ""
$possiblePaths = @(
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\Enterprise\VC\Auxiliary\Build\vcvars64.bat",
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\Professional\VC\Auxiliary\Build\vcvars64.bat",
    "${env:ProgramFiles}\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\Enterprise\VC\Auxiliary\Build\vcvars64.bat",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\Professional\VC\Auxiliary\Build\vcvars64.bat",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvars64.bat"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $vsPath = $path
        break
    }
}

if ($vsPath -eq "") {
    Write-Host "ERROR: Could not find Visual Studio installation" -ForegroundColor Red
    exit 1
}

Write-Host "Found Visual Studio at: $vsPath" -ForegroundColor Yellow
Write-Host ""

# Test cases to compare directly
$testCases = @(
    @{input = ""; name = "Empty string" },
    @{input = "a"; name = "Single 'a'" },
    @{input = "abc"; name = "abc" },
    @{input = "message digest"; name = "Message digest" },
    @{input = "abcdefghijklmnopqrstuvwxyz"; name = "Alphabet" },
    @{input = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; name = "Alphanumeric" },
    @{input = "The quick brown fox jumps over the lazy dog"; name = "Quick brown fox" },
    @{input = "12345678901234567890123456789012345678901234567890123456789012345678901234567890"; name = "80 digits" }
)

# Compile C++ hash utility
Write-Host "Compiling C++ hash utility..." -ForegroundColor Cyan
$tempBat = "temp_compile.bat"
@"
@echo off
call "$vsPath" > nul 2>&1
cl /EHsc /std:c++17 hash_cpp.cpp /Fe:hash_cpp.exe > nul 2>&1
"@ | Out-File -FilePath $tempBat -Encoding ASCII

$compileResult = & cmd /c $tempBat 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: C++ compilation failed" -ForegroundColor Red
    Write-Host $compileResult
    exit 1
}
Remove-Item $tempBat -ErrorAction SilentlyContinue
Write-Host "C++ compilation successful" -ForegroundColor Green
Write-Host ""

Write-Host "Running direct comparison tests..." -ForegroundColor Cyan
Write-Host ""

$allMatch = $true
$testNum = 1

foreach ($testCase in $testCases) {
    $input = $testCase.input
    $name = $testCase.name
    
    Write-Host "Test $testNum ($name):" -ForegroundColor White
    Write-Host "  Input: `"$input`"" -ForegroundColor Gray
    
    # Get JavaScript result
    try {
        $escapedInput = $input -replace '"', '\"' -replace '\\', '\\'
        $jsCommand = "console.log(require('./md5.js')('$escapedInput'));"
        $jsResult = (& node -e $jsCommand 2>&1).Trim()
        Write-Host "  JS:    $jsResult" -ForegroundColor Cyan
    }
    catch {
        Write-Host "  JS:    ERROR - $_" -ForegroundColor Red
        $allMatch = $false
        continue
    }
    
    # Get C++ result
    try {
        $cppResult = (& .\hash_cpp.exe $input 2>&1).Trim()
        Write-Host "  C++:   $cppResult" -ForegroundColor Yellow
    }
    catch {
        Write-Host "  C++:   ERROR - $_" -ForegroundColor Red
        $allMatch = $false
        continue
    }
    
    # Compare results
    if ($jsResult -eq $cppResult) {
        Write-Host "  [v] MATCH" -ForegroundColor Green
    }
    else {
        Write-Host "  [x] MISMATCH" -ForegroundColor Red
        $allMatch = $false
    }
    
    Write-Host ""
    $testNum++
}

# Also run the comprehensive tests for verification
Write-Host "Running comprehensive test suites..." -ForegroundColor Cyan
Write-Host ""

Write-Host "JavaScript comprehensive test:" -ForegroundColor Cyan
try {
    $jsResult = & node test_js.js 2>&1
    $jsExitCode = $LASTEXITCODE
    if ($jsExitCode -eq 0) {
        Write-Host "[v] JavaScript tests: ALL PASSED" -ForegroundColor Green
    }
    else {
        Write-Host "[x] JavaScript tests: FAILED" -ForegroundColor Red
        $allMatch = $false
    }
}
catch {
    Write-Host "[x] JavaScript tests: ERROR - $_" -ForegroundColor Red
    $allMatch = $false
}

Write-Host ""
Write-Host "C++ comprehensive test:" -ForegroundColor Cyan
try {
    $tempBat2 = "temp_test.bat"
    @"
@echo off
call "$vsPath" > nul 2>&1
cl /EHsc /std:c++17 test_cpp.cpp /Fe:test_cpp.exe > nul 2>&1
if %errorlevel% neq 0 exit /b 1
test_cpp.exe
"@ | Out-File -FilePath $tempBat2 -Encoding ASCII
    
    $cppResult = & cmd /c $tempBat2 2>&1
    $cppExitCode = $LASTEXITCODE
    Remove-Item $tempBat2 -ErrorAction SilentlyContinue
    
    if ($cppExitCode -eq 0) {
        Write-Host "[v] C++ tests: ALL PASSED" -ForegroundColor Green
    }
    else {
        Write-Host "[x] C++ tests: FAILED" -ForegroundColor Red
        $allMatch = $false
    }
}
catch {
    Write-Host "[x] C++ tests: ERROR - $_" -ForegroundColor Red
    $allMatch = $false
}

# Clean up
Remove-Item "hash_cpp.exe" -ErrorAction SilentlyContinue
Remove-Item "test_cpp.exe" -ErrorAction SilentlyContinue
Remove-Item "*.obj" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "===============================" -ForegroundColor Green
Write-Host "Final Comparison Summary:" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

if ($allMatch) {
    Write-Host "SUCCESS: All MD5 outputs match perfectly!" -ForegroundColor Green
    Write-Host "The C++ implementation produces identical results to the JavaScript reference." -ForegroundColor Green
    exit 0
}
else {
    Write-Host "FAILURE: MD5 outputs don't match!" -ForegroundColor Red
    Write-Host "The C++ implementation needs fixing." -ForegroundColor Red
    exit 1
}
