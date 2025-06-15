# K6 Microservices Performance Testing - Windows Workflow

This document explains how to use the Windows-optimized workflows for K6 performance testing.

## Files Created

1. **`.github/workflows/k6-testing-windows.yml`** - GitHub Actions workflow for Windows runners
2. **`run-tests.ps1`** - PowerShell script for local testing
3. **`run-tests.bat`** - Batch file wrapper for easier execution
4. **`WINDOWS-WORKFLOW.md`** - This documentation file

## Local Testing on Windows

### Prerequisites

- Windows 10/11 or Windows Server
- PowerShell 5.1 or higher
- Internet connection (for downloading K6 if not installed)

### Quick Start

1. **Using the Batch File (Easiest)**:
   ```cmd
   # Validate all test scripts
   run-tests.bat -TestType validate
   
   # Run smoke tests on staging
   run-tests.bat -TestType smoke -Environment stage
   
   # Install K6 automatically and run load tests
   run-tests.bat -TestType load -Environment stage -InstallK6
   
   # Run tests and open results folder
   run-tests.bat -TestType smoke -Environment stage -OpenResults
   ```

2. **Using PowerShell Directly**:
   ```powershell
   # Set execution policy (if needed)
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   
   # Run tests
   .\run-tests.ps1 -TestType smoke -Environment stage
   ```

### Available Test Types

- **`validate`** - Validates all K6 test scripts without running them
- **`smoke`** - Quick tests with minimal load to verify functionality
- **`load`** - Normal load testing with expected traffic patterns
- **`stress`** - High load testing to find breaking points
- **`spike`** - Sudden load increases to test elasticity

### Available Environments

- **`stage`** - Staging environment (default)
- **`prod`** - Production environment

### PowerShell Script Parameters

| Parameter | Required | Description | Values |
|-----------|----------|-------------|--------|
| `-TestType` | Yes | Type of test to run | `validate`, `smoke`, `load`, `stress`, `spike` |
| `-Environment` | No | Target environment | `stage`, `prod` (default: `stage`) |
| `-InstallK6` | No | Auto-install K6 if not found | Switch parameter |
| `-OpenResults` | No | Open results folder after test | Switch parameter |

### Examples

```powershell
# Validate all scripts
.\run-tests.ps1 -TestType validate

# Run smoke tests on staging
.\run-tests.ps1 -TestType smoke -Environment stage

# Run load tests on production
.\run-tests.ps1 -TestType load -Environment prod

# Install K6 and run stress tests
.\run-tests.ps1 -TestType stress -InstallK6

# Run tests and open results automatically
.\run-tests.ps1 -TestType smoke -OpenResults
```

## GitHub Actions Workflow

### Triggers

The workflow runs automatically on:
- **Push** to `main` or `develop` branches (smoke tests only)
- **Pull requests** to `main` or `develop` branches (smoke tests only)
- **Schedule** - Daily at 2 AM UTC (load tests)
- **Manual trigger** - Choose test type and environment

### Manual Workflow Trigger

1. Go to your repository on GitHub
2. Click on "Actions" tab
3. Select "K6 Microservices Performance Testing (Windows)"
4. Click "Run workflow"
5. Choose:
   - **Environment**: `stage` or `prod`
   - **Test type**: `smoke`, `load`, `stress`, or `spike`

### Workflow Jobs

1. **Validate** - Validates all K6 scripts
2. **Smoke Test** - Runs on push/PR or manual trigger
3. **Load Test** - Runs on schedule or manual trigger
4. **Stress Test** - Manual trigger only
5. **Report** - Generates summary report and uploads artifacts

### Artifacts

The workflow saves test results as artifacts:
- JSON output files with detailed metrics
- Summary files with aggregated results
- Test reports in Markdown format
- Retention: 30 days for test results, 90 days for reports

## File Structure

Your project should have this structure:

```
k6-microservices/
├── .github/
│   └── workflows/
│       └── k6-testing-windows.yml
├── tests/
│   ├── smoke.js
│   ├── load.js
│   ├── stress.js
│   └── spike.js
├── results/
│   └── (test output files)
├── config/
├── data/
├── utils/
├── .env.stage
├── .env.prod
├── k6.config.js
├── run-tests.ps1
├── run-tests.bat
└── WINDOWS-WORKFLOW.md
```

## Environment Configuration

### Environment Files

- **`.env.stage`** - Staging environment variables
- **`.env.prod`** - Production environment variables

Example `.env.stage`:
```env
BASE_URL=https://api-staging.example.com
API_KEY=your-staging-api-key
MAX_VUS=100
DURATION=5m
```

### K6 Configuration

The `k6.config.js` file contains global K6 settings that apply to all tests.

## Troubleshooting

### Common Issues

1. **PowerShell Execution Policy**:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **K6 Not Found**:
   - Use `-InstallK6` parameter to auto-install
   - Or download manually from https://k6.io/docs/get-started/installation/

3. **Test Script Not Found**:
   - Ensure test files exist in the `tests/` directory
   - Check that file names match the test type (e.g., `smoke.js` for smoke tests)

4. **Environment Variables Not Loading**:
   - Check that `.env.stage` or `.env.prod` files exist
   - Verify the format: `KEY=value` (no spaces around =)

### Getting Help

- Run without parameters to see usage examples
- Check the test files in the `tests/` directory
- Review the K6 configuration in `k6.config.js`
- Check environment variables in `.env.*` files

## Best Practices

1. **Always validate** scripts before running performance tests
2. **Start with smoke tests** to verify functionality
3. **Use staging environment** for most testing
4. **Be cautious with production testing** - use manual triggers only
5. **Monitor results** and adjust test parameters as needed
6. **Archive important results** beyond the retention period

## Next Steps

1. Customize the test scripts in the `tests/` directory
2. Update environment variables in `.env.*` files
3. Modify K6 configuration in `k6.config.js`
4. Run initial validation: `run-tests.bat -TestType validate`
5. Start with smoke tests: `run-tests.bat -TestType smoke -Environment stage`

