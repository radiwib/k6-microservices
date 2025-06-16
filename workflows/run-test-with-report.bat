@echo off
REM Windows batch wrapper for K6 Test Runner with Report Generation
REM Usage: workflows\run-test-with-report.bat <test-file> [environment]

setlocal enabledelayedexpansion

REM Check if Node.js is available
node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

REM Check if K6 is available
k6 version >nul 2>&1
if !errorlevel! neq 0 (
    echo Error: K6 is not installed or not in PATH
    echo Please install K6 from https://k6.io/docs/getting-started/installation/
    exit /b 1
)

REM Run the Node.js script with all arguments
node workflows\run-test-with-report.js %*

