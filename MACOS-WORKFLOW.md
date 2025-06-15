# K6 Microservices Performance Testing - macOS Workflow

This document explains how to use the macOS-optimized workflows for K6 performance testing.

## Files Created

1. **`.github/workflows/k6-testing-macos.yml`** - GitHub Actions workflow for macOS runners
2. **`run-tests-mac.sh`** - Shell script for local macOS testing
3. **`Makefile`** - Convenience commands for common operations
4. **`MACOS-WORKFLOW.md`** - This documentation file

## Local Testing on macOS

### Prerequisites

- macOS 10.15 (Catalina) or later
- Bash 3.2+ (included with macOS)
- Homebrew (recommended for K6 installation)
- Internet connection (for downloading K6 if not installed)

### Quick Start

#### Option 1: Using Make Commands (Recommended)

```bash
# Setup the project (one-time)
make setup

# Validate all test scripts
make validate

# Run smoke tests on staging
make smoke

# Run load tests with verbose output
make load VERBOSE=1

# Run stress tests and open results
make stress OPEN_RESULTS=1

# Run production tests (use with caution)
make smoke-prod
```

#### Option 2: Using Shell Script Directly

```bash
# Make script executable (one-time)
chmod +x run-tests-mac.sh

# Validate all test scripts
./run-tests-mac.sh validate

# Run smoke tests on staging
./run-tests-mac.sh smoke stage

# Install K6 automatically and run load tests
./run-tests-mac.sh load stage --install-k6

# Run tests with verbose output and open results
./run-tests-mac.sh smoke stage --verbose --open-results
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

### Shell Script Options

| Option | Description |
|--------|-------------|
| `--install-k6` | Auto-install K6 using Homebrew if not found |
| `--open-results` | Open results directory after test completion |
| `--verbose` | Enable verbose output for debugging |
| `--help` | Show detailed help message |

### Make Command Options

| Variable | Description | Example |
|----------|-------------|----------|
| `VERBOSE=1` | Enable verbose output | `make smoke VERBOSE=1` |
| `OPEN_RESULTS=1` | Open results directory | `make load OPEN_RESULTS=1` |

## Installation

### Automatic Installation

```bash
# Using Make (recommended)
make setup

# Using shell script
./run-tests-mac.sh validate --install-k6
```

### Manual Installation

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install K6
brew install k6

# Verify installation
k6 version
```

## Examples

### Basic Usage

```bash
# Quick setup and validation
make dev-setup
make validate

# Run a complete test suite
make test-all

# Quick smoke test
make quick-test
```

### Advanced Usage

```bash
# Run load tests with all options
make load VERBOSE=1 OPEN_RESULTS=1

# Run production stress test (manual confirmation required)
make stress-prod VERBOSE=1

# Clean up old results and run fresh tests
make clean
make smoke
```

### Shell Script Examples

```bash
# Validate with verbose error details
./run-tests-mac.sh validate --verbose

# Run smoke tests and automatically open results
./run-tests-mac.sh smoke stage --open-results

# Run production load test with all options
./run-tests-mac.sh load prod --verbose --open-results
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
3. Select "K6 Microservices Performance Testing (macOS)"
4. Click "Run workflow"
5. Choose:
   - **Environment**: `stage` or `prod`
   - **Test type**: `smoke`, `load`, `stress`, or `spike`

### Workflow Jobs

1. **Validate** - Validates all K6 scripts using Homebrew installation
2. **Smoke Test** - Runs on push/PR or manual trigger
3. **Load Test** - Runs on schedule or manual trigger
4. **Stress Test** - Manual trigger only
5. **Spike Test** - Manual trigger only
6. **Production Test** - Manual trigger with production environment protection
7. **Report** - Generates summary report and uploads artifacts

### Artifacts

The workflow saves test results as artifacts:
- JSON output files with detailed metrics
- Summary files with aggregated results
- Test reports in Markdown format (tagged with macOS)
- Retention: 30 days for test results, 90 days for reports

## File Structure

Your project should have this structure:

```
k6-microservices/
├── .github/
│   └── workflows/
│       ├── k6-testing-macos.yml
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
├── run-tests-mac.sh
├── run-tests.ps1
├── run-tests.bat
├── Makefile
├── MACOS-WORKFLOW.md
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

### Environment Variable Loading

The macOS script automatically:
- Filters out comments (lines starting with `#`)
- Skips empty lines
- Removes quotes from values
- Exports variables to the current shell session

## Troubleshooting

### Common Issues

1. **Script Not Executable**:
   ```bash
   chmod +x run-tests-mac.sh
   ```

2. **Homebrew Not Found**:
   ```bash
   # Install Homebrew
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

3. **K6 Not Found**:
   ```bash
   # Auto-install
   ./run-tests-mac.sh validate --install-k6
   # Or manual install
   brew install k6
   ```

4. **Test Script Not Found**:
   - Ensure test files exist in the `tests/` directory
   - Check that file names match the test type (e.g., `smoke.js` for smoke tests)
   - Use `make env-info` to see available test files

5. **Environment Variables Not Loading**:
   - Check that `.env.stage` or `.env.prod` files exist
   - Verify the format: `KEY=value` (no spaces around =)
   - Use `--verbose` flag to see which variables are loaded

### Debugging

```bash
# Check environment information
make env-info

# Run with verbose output
./run-tests-mac.sh smoke stage --verbose

# Validate scripts with detailed error output
./run-tests-mac.sh validate --verbose
```

### Getting Help

```bash
# Show Make commands
make help

# Show shell script help
./run-tests-mac.sh --help

# Check current environment
make env-info
```

## Platform Differences

### macOS vs Windows

| Feature | macOS | Windows |
|---------|--------|----------|
| Package Manager | Homebrew | Manual download |
| Script Type | Bash shell script | PowerShell script |
| File Permissions | `chmod +x` required | Not required |
| Path Separators | `/` | `\` |
| Environment Loading | Built-in shell features | PowerShell parsing |
| Results Opening | `open` command | `explorer.exe` |

### GitHub Actions

- **macOS runners**: Use `macos-latest` (currently macOS 12)
- **Windows runners**: Use `windows-latest` (currently Windows Server 2022)
- Both workflows are functionally identical but optimized for their respective platforms

## Best Practices

1. **Always validate** scripts before running performance tests:
   ```bash
   make validate
   ```

2. **Start with smoke tests** to verify functionality:
   ```bash
   make quick-test
   ```

3. **Use staging environment** for most testing:
   ```bash
   make smoke  # defaults to staging
   ```

4. **Be cautious with production testing**:
   ```bash
   make smoke-prod  # only when necessary
   ```

5. **Use verbose mode for debugging**:
   ```bash
   make smoke VERBOSE=1
   ```

6. **Clean up results periodically**:
   ```bash
   make clean
   ```

7. **Monitor system resources** during stress and spike tests

## Development Workflow

### Initial Setup

```bash
# Clone and setup
git clone <your-repo>
cd k6-microservices
make dev-setup
```

### Daily Development

```bash
# Validate changes
make validate

# Quick functional test
make quick-test

# Full test suite (if needed)
make test-all
```

### Before Deployment

```bash
# Comprehensive testing
make validate
make smoke
make load

# Production smoke test (careful!)
make smoke-prod
```

## Next Steps

1. **Customize test scripts** in the `tests/` directory for your microservices
2. **Update environment variables** in `.env.*` files with your endpoints
3. **Modify K6 configuration** in `k6.config.js` for your requirements
4. **Run initial setup**: `make dev-setup`
5. **Start with validation**: `make validate`
6. **Begin testing**: `make quick-test`

## Advanced Features

### Custom Make Targets

Add your own targets to the Makefile:

```makefile
# Custom target for API-specific tests
api-test:
	./run-tests-mac.sh load stage --verbose
	./run-tests-mac.sh stress stage

# Integration test suite
integration:
	make validate
	make smoke
	make load
	echo "✓ Integration tests complete"
```

### CI/CD Integration

```bash
# Use in CI pipelines
make validate || exit 1
make smoke || exit 1

# Conditional production testing
if [ "$BRANCH" = "main" ]; then
  make smoke-prod
fi
```

