#!/bin/bash
# K6 Microservices Performance Testing Script for macOS
# Usage: ./run-tests-mac.sh <test_type> [environment] [options]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
TEST_TYPE=""
ENVIRONMENT="stage"
INSTALL_K6=false
OPEN_RESULTS=false
VERBOSE=false

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print usage
show_usage() {
    cat << EOF
K6 Microservices Performance Testing Script for macOS

Usage: $0 <test_type> [environment] [options]

Test Types:
  validate    Validate all K6 test scripts without running them
  smoke       Quick tests with minimal load to verify functionality
  load        Normal load testing with expected traffic patterns
  stress      High load testing to find breaking points
  spike       Sudden load increases to test elasticity

Environments:
  stage       Staging environment (default)
  prod        Production environment

Options:
  --install-k6    Auto-install K6 using Homebrew if not found
  --open-results  Open results directory after test completion
  --verbose       Enable verbose output
  --help          Show this help message

Examples:
  $0 validate
  $0 smoke stage
  $0 load stage --install-k6
  $0 stress prod --open-results
  $0 smoke stage --verbose --open-results

EOF
}

# Function to check if K6 is installed
check_k6_installation() {
    if command -v k6 &> /dev/null; then
        local version=$(k6 version 2>&1 | head -n1)
        print_message "$GREEN" "✓ K6 is installed: $version"
        return 0
    else
        print_message "$RED" "✗ K6 is not installed or not in PATH"
        return 1
    fi
}

# Function to install K6 using Homebrew
install_k6() {
    print_message "$YELLOW" "Installing K6 using Homebrew..."
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        print_message "$RED" "✗ Homebrew is not installed. Please install Homebrew first:"
        print_message "$CYAN" "/bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        return 1
    fi
    
    # Install K6
    if brew install k6; then
        print_message "$GREEN" "✓ K6 installed successfully"
        k6 version
        return 0
    else
        print_message "$RED" "✗ Failed to install K6"
        return 1
    fi
}

# Function to load environment variables
load_environment_variables() {
    local env_file="env/.env.$1"
    
    if [ -f "$env_file" ]; then
        print_message "$CYAN" "Loading environment variables from $env_file"
        
        # Load environment variables, filtering out comments and empty lines
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            [[ $key =~ ^#.*$ || -z $key ]] && continue
            
            # Remove quotes if present
            value=$(echo "$value" | sed 's/^"\(.*\)"$/\1/' | sed "s/^'\(.*\)'$/\1/")
            
            # Export the variable
            export "$key=$value"
            
            if [ "$VERBOSE" = true ]; then
                print_message "$GREEN" "  Set $key"
            fi
        done < "$env_file"
    else
        print_message "$YELLOW" "Environment file $env_file not found"
    fi
}

# Function to validate K6 scripts
validate_k6_scripts() {
    print_message "$CYAN" "Validating K6 test scripts..."
    
    local test_files=(tests/*.js)
    
    if [ ! -e "${test_files[0]}" ]; then
        print_message "$YELLOW" "No test files found in tests directory"
        return 1
    fi
    
    local all_valid=true
    
    for test_file in "${test_files[@]}"; do
        if [ -f "$test_file" ]; then
            local filename=$(basename "$test_file")
            print_message "$CYAN" "  Validating $filename..."
            
            if k6 validate "$test_file" > /dev/null 2>&1; then
                print_message "$GREEN" "    ✓ Valid"
            else
                print_message "$RED" "    ✗ Invalid"
                all_valid=false
                
                if [ "$VERBOSE" = true ]; then
                    print_message "$RED" "    Error details:"
                    k6 validate "$test_file" 2>&1 | sed 's/^/      /'
                fi
            fi
        fi
    done
    
    if [ "$all_valid" = true ]; then
        return 0
    else
        return 1
    fi
}

# Function to run K6 test
run_k6_test() {
    local test_script="$1"
    local test_type="$2"
    local environment="$3"
    
    local timestamp=$(date +"%Y%m%d-%H%M%S")
    local results_dir="results"
    
    # Create results directory
    mkdir -p "$results_dir"
    
    local json_output="$results_dir/$test_type-test-results-$timestamp.json"
    local summary_output="$results_dir/$test_type-test-summary-$timestamp.json"
    
    print_message "$CYAN" "Running $test_type test for $environment environment..."
    print_message "$CYAN" "Test script: $test_script"
    print_message "$CYAN" "Results will be saved to: $json_output"
    
    # Build K6 command arguments
    local k6_args=(
        "run"
        "--config" "k6.config.js"
        "--env" "ENVIRONMENT=$environment"
        "--tag" "testType=$test_type"
        "--out" "json=$json_output"
        "--summary-export=$summary_output"
    )
    
    if [ "$VERBOSE" = true ]; then
        k6_args+=("--verbose")
    fi
    
    k6_args+=("$test_script")
    
    # Run the test
    if k6 "${k6_args[@]}"; then
        local exit_code=$?
        if [ $exit_code -eq 0 ]; then
            print_message "$GREEN" "✓ Test completed successfully"
        else
            print_message "$YELLOW" "⚠ Test completed with exit code $exit_code"
        fi
        
        echo "json_output=$json_output"
        echo "summary_output=$summary_output"
        return 0
    else
        print_message "$RED" "✗ Test failed"
        return 1
    fi
}

# Function to open results directory
open_results_directory() {
    local results_path="$1"
    
    if [ -d "$results_path" ]; then
        print_message "$CYAN" "Opening results directory..."
        open "$results_path"
    else
        print_message "$YELLOW" "Results directory not found: $results_path"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        validate|smoke|load|stress|spike)
            if [ -z "$TEST_TYPE" ]; then
                TEST_TYPE="$1"
            else
                print_message "$RED" "Error: Multiple test types specified"
                show_usage
                exit 1
            fi
            shift
            ;;
        stage|prod)
            ENVIRONMENT="$1"
            shift
            ;;
        --install-k6)
            INSTALL_K6=true
            shift
            ;;
        --open-results)
            OPEN_RESULTS=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_message "$RED" "Error: Unknown option $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate required arguments
if [ -z "$TEST_TYPE" ]; then
    print_message "$RED" "Error: Test type is required"
    show_usage
    exit 1
fi

# Main execution
print_message "$CYAN" "=== K6 Microservices Performance Testing (macOS) ==="
print_message "$CYAN" "Test Type: $TEST_TYPE"
print_message "$CYAN" "Environment: $ENVIRONMENT"
if [ "$VERBOSE" = true ]; then
    print_message "$CYAN" "Verbose mode: enabled"
fi
echo

# Check if K6 is installed
if ! check_k6_installation; then
    if [ "$INSTALL_K6" = true ]; then
        if ! install_k6; then
            print_message "$RED" "Failed to install K6. Exiting."
            exit 1
        fi
    else
        print_message "$RED" "K6 is not installed. Use --install-k6 option to install it automatically."
        print_message "$YELLOW" "Or install manually using: brew install k6"
        exit 1
    fi
fi

# Load environment variables
load_environment_variables "$ENVIRONMENT"

# Execute based on test type
case "$TEST_TYPE" in
    "validate")
        print_message "$YELLOW" "Validating all K6 scripts..."
        if validate_k6_scripts; then
            print_message "$GREEN" "✓ All scripts are valid"
            exit 0
        else
            print_message "$RED" "✗ Some scripts have validation errors"
            exit 1
        fi
        ;;
    
    *)
        test_script="tests/$TEST_TYPE.js"
        
        if [ ! -f "$test_script" ]; then
            print_message "$RED" "Test script not found: $test_script"
            print_message "$YELLOW" "Available test scripts:"
            for file in tests/*.js; do
                if [ -f "$file" ]; then
                    print_message "$YELLOW" "  - $(basename "$file")"
                fi
            done
            exit 1
        fi
        
        # Run the test
        if run_k6_test "$test_script" "$TEST_TYPE" "$ENVIRONMENT"; then
            echo
            print_message "$GREEN" "=== Test Results ==="
            print_message "$GREEN" "Results saved to: results/"
            
            if [ "$OPEN_RESULTS" = true ]; then
                open_results_directory "results"
            fi
        else
            print_message "$RED" "Test execution failed"
            exit 1
        fi
        ;;
esac

echo
print_message "$GREEN" "=== Test Execution Complete ==="


