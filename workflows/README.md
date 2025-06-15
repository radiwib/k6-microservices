# K6 Microservices Workflows

This folder contains all the local workflow scripts and documentation for running K6 performance tests.

## Files

### macOS/Linux
- **`run-tests-macos.sh`** - Shell script for running tests on macOS/Linux
- **`macos-workflow.md`** - Documentation for macOS/Linux workflows

### Windows
- **`run-tests-windows.ps1`** - PowerShell script for running tests on Windows
- **`run-tests-windows.bat`** - Batch wrapper for the PowerShell script
- **`windows-workflow.md`** - Documentation for Windows workflows

## Quick Start

### macOS/Linux
```bash
# Make executable and run
chmod +x workflows/run-tests-macos.sh
./workflows/run-tests-macos.sh smoke stage
```

### Windows
```cmd
# Run using batch file
workflows\run-tests-windows.bat -TestType smoke -Environment stage
```

```powershell
# Or use PowerShell directly
.\workflows\run-tests-windows.ps1 -TestType smoke -Environment stage
```

## Note

GitHub Actions workflows are still located in `.github/workflows/` as required by GitHub.
This folder only contains local execution scripts and their documentation.

