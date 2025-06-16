# Cross-Platform K6 Test Runner with Report Generation

This directory contains cross-platform scripts for running K6 tests with automatic HTML report generation that works on both **macOS** and **Windows**.

## 📋 Files Overview

- `run-test-with-report.js` - Main Node.js script (cross-platform)
- `run-test-with-report-mac.sh` - macOS/Linux wrapper script
- `run-test-with-report.bat` - Windows batch wrapper script
- `README-test-runner.md` - This documentation

## 🛠️ Prerequisites

### Required Software

1. **Node.js** (v14 or later)
   - macOS: `brew install node` or download from [nodejs.org](https://nodejs.org/)
   - Windows: Download from [nodejs.org](https://nodejs.org/)

2. **K6** (v0.40 or later)
   - macOS: `brew install k6`
   - Windows: Download from [k6.io](https://k6.io/docs/getting-started/installation/)

3. **Environment Files**
   - `.env.stage` - Staging environment configuration
   - `.env.prod` - Production environment configuration

## 🚀 Usage

### Method 1: Direct Node.js Script (Recommended)

**Works on both macOS and Windows:**

```bash
# Basic usage
node workflows/run-test-with-report.js <test-file> [environment]

# Examples
node workflows/run-test-with-report.js tests/auth/auth-test.js stage
node workflows/run-test-with-report.js tests/test.js stage
node workflows/run-test-with-report.js tests/auth/auth-test.js prod
```

### Method 2: Platform-Specific Wrappers

**macOS/Linux:**
```bash
./workflows/run-test-with-report-mac.sh tests/auth/auth-test.js stage
```

**Windows:**
```cmd
workflows\run-test-with-report.bat tests/auth/auth-test.js stage
```

## 📏 Generated Reports

The script generates three types of output files in the `results/` directory:

1. **JSON Results** - Raw K6 test data
   - `{test-name}-results-{timestamp}.json`

2. **Summary JSON** - Processed metrics and checks
   - `{test-name}-summary-{timestamp}.json`

3. **HTML Report** - Beautiful, readable test report
   - `{test-name}-report-{timestamp}.html`

### HTML Report Features

- 📊 **Visual Metrics Dashboard** - Success rate, response times, error rates
- ✅ **Test Checks Table** - Pass/fail status for all checks
- 📊 **Performance Metrics Grid** - Detailed timing information
- 🖥️ **System Information** - Platform, Node.js version, timestamp
- 📋 **Raw Data Section** - Expandable JSON data for debugging
- 🎨 **Responsive Design** - Works on desktop and mobile

## 🔧 Environment Configuration

### .env.stage Example
```bash
# Staging Environment Configuration
ACCESS_TOKEN=staging_token
BASE_URL=ionmobility.net

# Microservices URLs - Staging
USER_URL=https://ionusers-s.ionmobility.net
BIKE_URL=https://ionbikes-s.ionmobility.net
NOTIF_URL=https://notifications-s.ionmobility.net

# Test Configuration
PHONE=6281122334455
TYPE=whatsapp
CODE=123456
```

### .env.prod Example
```bash
# Production Environment Configuration
ACCESS_TOKEN=production_token
BASE_URL=ionmobility.net

# Microservices URLs - Production
USER_URL=https://ionusers.ionmobility.net
BIKE_URL=https://ionbikes.ionmobility.net
NOTIF_URL=https://notifications.ionmobility.net

# Test Configuration
PHONE=6281122334455
TYPE=whatsapp
CODE=123456
```

## 📝 Example Output

```bash
🔬 Running K6 Test with Report Generation
Test File: tests/auth/auth-test.js
Environment: stage
Platform: darwin arm64
Timestamp: 2025-06-16T05-41-42

📋 Loading environment variables from .env.stage...
🚀 Running K6 test...

# K6 test output here...

✅ Test completed successfully!
📊 Generating HTML report...
✅ HTML report generated: results/auth-test-report-2025-06-16T05-41-42.html

📊 Reports generated:
  JSON: results/auth-test-results-2025-06-16T05-41-42.json
  Summary: results/auth-test-summary-2025-06-16T05-41-42.json
  HTML: results/auth-test-report-2025-06-16T05-41-42.html

Open HTML report in browser? (y/N):
```

## 🌍 Cross-Platform Features

### Automatic File Opening
- **macOS**: Uses `open` command
- **Windows**: Uses `start` command
- **Linux**: Uses `xdg-open` command

### Path Handling
- Automatically handles Windows vs Unix path separators
- Works with relative and absolute paths

### Environment Loading
- Supports both Unix and Windows line endings
- Handles quoted and unquoted environment variables
- Filters out comments and empty lines

## 🔍 Troubleshooting

### Common Issues

1. **"Node.js not found"**
   - Install Node.js from [nodejs.org](https://nodejs.org/)
   - Ensure it's in your system PATH

2. **"K6 not found"**
   - Install K6 from [k6.io](https://k6.io/docs/getting-started/installation/)
   - Ensure it's in your system PATH

3. **"Environment file not found"**
   - Create `.env.stage` or `.env.prod` files in the project root
   - Use the examples above as templates

4. **"Test file not found"**
   - Check the path to your test file
   - Ensure the file exists and has `.js` extension

### Debug Mode

For debugging, you can run the Node.js script directly to see detailed error messages:

```bash
node workflows/run-test-with-report.js tests/your-test.js stage
```

## 📜 Integration with Existing Workflows

This cross-platform runner integrates with the existing project structure:

- Uses existing `.env.*` files
- Works with existing `tests/` directory structure
- Outputs to existing `results/` directory
- Compatible with existing `Makefile` and shell scripts

## 🔗 Quick Links

- [K6 Documentation](https://k6.io/docs/)
- [Node.js Downloads](https://nodejs.org/)
- [Project README](../README.md)
- [Makefile Commands](../Makefile)

---

**Happy Testing!** 🎉

