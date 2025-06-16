#!/bin/bash

# macOS/Linux shell wrapper for K6 Test Runner with Report Generation
# Usage: ./workflows/run-test-with-report-mac.sh <test-file> [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_message() {
    echo -e "${1}${2}${NC}"
}

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    print_message "$RED" "❌ Error: Node.js is not installed or not in PATH"
    print_message "$YELLOW" "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if K6 is available
if ! command -v k6 &> /dev/null; then
    print_message "$RED" "❌ Error: K6 is not installed or not in PATH"
    print_message "$YELLOW" "Please install K6 from https://k6.io/docs/getting-started/installation/"
    exit 1
fi

print_message "$BLUE" "🔬 K6 Test Runner (macOS/Linux)"
print_message "$GREEN" "Node.js version: $(node --version)"
print_message "$GREEN" "K6 version: $(k6 version | head -n1)"
echo

# Run the Node.js script with all arguments
node workflows/run-test-with-report.js "$@"

