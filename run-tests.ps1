# K6 Microservices Performance Testing Script for Windows
# Usage: .\run-tests.ps1 -TestType smoke -Environment stage

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("smoke", "load", "stress", "spike", "validate")]
    [string]$TestType,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("stage", "prod")]
    [string]$Environment = "stage",
    
    [Parameter(Mandatory=$false)]
    [switch]$InstallK6,
    
    [Parameter(Mandatory=$false)]
    [switch]$OpenResults
)

# Colors for output
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-K6Installation {
    try {
        $version = k6 version
        Write-ColorOutput "✓ K6 is installed: $version" $Green
        return $true
    } catch {
        Write-ColorOutput "✗ K6 is not installed or not in PATH" $Red
        return $false
    }
}

function Install-K6 {
    Write-ColorOutput "Installing K6 for Windows..." $Yellow
    
    # Create tools directory if it doesn't exist
    $toolsDir = Join-Path $PWD "tools"
    if (-not (Test-Path $toolsDir)) {
        New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
    }
    
    # Download K6
    $k6ZipPath = Join-Path $toolsDir "k6.zip"
    $k6ExtractPath = Join-Path $toolsDir "k6"
    $downloadUrl = "https://github.com/grafana/k6/releases/latest/download/k6-v0.47.0-windows-amd64.zip"
    
    try {
        Write-ColorOutput "Downloading K6..." $Cyan
        Invoke-WebRequest -Uri $downloadUrl -OutFile $k6ZipPath -UseBasicParsing
        
        Write-ColorOutput "Extracting K6..." $Cyan
        Expand-Archive -Path $k6ZipPath -DestinationPath $k6ExtractPath -Force
        
        # Add to PATH for current session
        $k6BinPath = Join-Path $k6ExtractPath "k6-v0.47.0-windows-amd64"
        $env:PATH = "$k6BinPath;$env:PATH"
        
        # Clean up zip file
        Remove-Item $k6ZipPath -Force
        
        Write-ColorOutput "✓ K6 installed successfully to $k6BinPath" $Green
        Write-ColorOutput "Note: K6 is added to PATH for this session only" $Yellow
        
        return $true
    } catch {
        Write-ColorOutput "✗ Failed to install K6: $($_.Exception.Message)" $Red
        return $false
    }
}

function Import-EnvironmentVariables {
    param([string]$EnvFile)
    
    if (Test-Path $EnvFile) {
        Write-ColorOutput "Loading environment variables from $EnvFile" $Cyan
        
        Get-Content $EnvFile | ForEach-Object {
            if ($_ -match '^([^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                
                # Remove quotes if present
                if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
                
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
                Write-ColorOutput "  Set $key" $Green
            }
        }
    } else {
        Write-ColorOutput "Environment file $EnvFile not found" $Yellow
    }
}

function Invoke-K6Test {
    param(
        [string]$TestScript,
        [string]$TestType,
        [string]$Environment
    )
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $resultsDir = "results"
    
    # Create results directory
    if (-not (Test-Path $resultsDir)) {
        New-Item -ItemType Directory -Path $resultsDir -Force | Out-Null
    }
    
    $jsonOutput = Join-Path $resultsDir "$TestType-test-results-$timestamp.json"
    $summaryOutput = Join-Path $resultsDir "$TestType-test-summary-$timestamp.json"
    
    Write-ColorOutput "Running $TestType test for $Environment environment..." $Cyan
    Write-ColorOutput "Test script: $TestScript" $Cyan
    Write-ColorOutput "Results will be saved to: $jsonOutput" $Cyan
    
    $k6Args = @(
        "run"
        "--config", "k6.config.js"
        "--env", "ENVIRONMENT=$Environment"
        "--tag", "testType=$TestType"
        "--out", "json=$jsonOutput"
        "--summary-export=$summaryOutput"
        $TestScript
    )
    
    try {
        & k6 @k6Args
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-ColorOutput "✓ Test completed successfully" $Green
        } else {
            Write-ColorOutput "⚠ Test completed with exit code $exitCode" $Yellow
        }
        
        return @{
            Success = $true
            JsonOutput = $jsonOutput
            SummaryOutput = $summaryOutput
        }
    } catch {
        Write-ColorOutput "✗ Test failed: $($_.Exception.Message)" $Red
        return @{ Success = $false }
    }
}

function Test-K6Scripts {
    Write-ColorOutput "Validating K6 test scripts..." $Cyan
    
    $testFiles = Get-ChildItem -Path "tests\*.js" -ErrorAction SilentlyContinue
    
    if (-not $testFiles) {
        Write-ColorOutput "No test files found in tests directory" $Yellow
        return $false
    }
    
    $allValid = $true
    
    foreach ($testFile in $testFiles) {
        Write-ColorOutput "  Validating $($testFile.Name)..." $Cyan
        
        try {
            & k6 validate $testFile.FullName
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "    ✓ Valid" $Green
            } else {
                Write-ColorOutput "    ✗ Invalid" $Red
                $allValid = $false
            }
        } catch {
            Write-ColorOutput "    ✗ Error: $($_.Exception.Message)" $Red
            $allValid = $false
        }
    }
    
    return $allValid
}

function Show-TestResults {
    param([string]$ResultsPath)
    
    if (Test-Path $ResultsPath) {
        Write-ColorOutput "Opening results directory..." $Cyan
        Start-Process explorer.exe $ResultsPath
    }
}

# Main execution
Write-ColorOutput "=== K6 Microservices Performance Testing ==="  $Cyan
Write-ColorOutput "Test Type: $TestType" $Cyan
Write-ColorOutput "Environment: $Environment" $Cyan
Write-ColorOutput "" 

# Check if K6 is installed
if (-not (Test-K6Installation)) {
    if ($InstallK6) {
        if (-not (Install-K6)) {
            Write-ColorOutput "Failed to install K6. Exiting." $Red
            exit 1
        }
    } else {
        Write-ColorOutput "K6 is not installed. Use -InstallK6 parameter to install it automatically." $Red
        Write-ColorOutput "Or install manually from: https://k6.io/docs/get-started/installation/" $Yellow
        exit 1
    }
}

# Load environment variables
$envFile = ".env.$Environment"
Import-EnvironmentVariables -EnvFile $envFile

# Execute based on test type
switch ($TestType) {
    "validate" {
        Write-ColorOutput "Validating all K6 scripts..." $Yellow
        $isValid = Test-K6Scripts
        
        if ($isValid) {
            Write-ColorOutput "✓ All scripts are valid" $Green
            exit 0
        } else {
            Write-ColorOutput "✗ Some scripts have validation errors" $Red
            exit 1
        }
    }
    
    default {
        $testScript = "tests\$TestType.js"
        
        if (-not (Test-Path $testScript)) {
            Write-ColorOutput "Test script not found: $testScript" $Red
            Write-ColorOutput "Available test scripts:" $Yellow
            Get-ChildItem -Path "tests\*.js" | ForEach-Object {
                Write-ColorOutput "  - $($_.Name)" $Yellow
            }
            exit 1
        }
        
        # Run the test
        $result = Invoke-K6Test -TestScript $testScript -TestType $TestType -Environment $Environment
        
        if ($result.Success) {
            Write-ColorOutput "" 
            Write-ColorOutput "=== Test Results ===" $Green
            Write-ColorOutput "JSON Output: $($result.JsonOutput)" $Green
            Write-ColorOutput "Summary Output: $($result.SummaryOutput)" $Green
            
            if ($OpenResults) {
                Show-TestResults -ResultsPath "results"
            }
        } else {
            Write-ColorOutput "Test execution failed" $Red
            exit 1
        }
    }
}

Write-ColorOutput "" 
Write-ColorOutput "=== Test Execution Complete ===" $Green

