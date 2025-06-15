@echo off
REM K6 Microservices Performance Testing Batch Wrapper
REM This script calls the PowerShell script with parameters

REM Check if PowerShell is available
powershell -Command "Write-Host 'PowerShell is available'" >nul 2>&1
if %errorlevel% neq 0 (
    echo PowerShell is not available. Please install PowerShell.
    pause
    exit /b 1
)

REM Execute PowerShell script with all passed arguments
powershell -ExecutionPolicy Bypass -File "%~dp0run-tests.ps1" %*

REM Pause to see results if run directly
if "%1"=="" (
    echo.
    echo Usage examples:
    echo   run-tests.bat -TestType smoke -Environment stage
    echo   run-tests.bat -TestType load -Environment stage -InstallK6
    echo   run-tests.bat -TestType validate
    echo   run-tests.bat -TestType stress -Environment prod -OpenResults
    echo.
    pause
)

