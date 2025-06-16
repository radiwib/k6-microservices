#!/bin/bash

# K6 Test Runner with Automatic Report Generation
# Usage: ./scripts/run-test-with-report.sh <test-file> [environment]

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

# Check if test file is provided
if [ -z "$1" ]; then
    print_message "$RED" "❌ Error: Test file is required"
    echo "Usage: $0 <test-file> [environment]"
    echo "Example: $0 tests/auth/auth-test.js stage"
    exit 1
fi

TEST_FILE="$1"
ENVIRONMENT="${2:-stage}"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
TEST_NAME=$(basename "$TEST_FILE" .js)

# Check if test file exists
if [ ! -f "$TEST_FILE" ]; then
    print_message "$RED" "❌ Error: Test file '$TEST_FILE' not found"
    exit 1
fi

# Check if environment file exists
ENV_FILE=".env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
    print_message "$RED" "❌ Error: Environment file '$ENV_FILE' not found"
    exit 1
fi

print_message "$BLUE" "🔬 Running K6 Test with Report Generation"
print_message "$YELLOW" "Test File: $TEST_FILE"
print_message "$YELLOW" "Environment: $ENVIRONMENT"
print_message "$YELLOW" "Timestamp: $TIMESTAMP"

# Load environment variables
print_message "$BLUE" "📋 Loading environment variables from $ENV_FILE..."
source "$ENV_FILE"

# Create results directory if it doesn't exist
mkdir -p results

# Define output files
JSON_OUTPUT="results/${TEST_NAME}-results-${TIMESTAMP}.json"
SUMMARY_OUTPUT="results/${TEST_NAME}-summary-${TIMESTAMP}.json"
HTML_OUTPUT="results/${TEST_NAME}-report-${TIMESTAMP}.html"

print_message "$BLUE" "🚀 Running K6 test..."

# Run K6 test with environment variables and output files
if k6 run "$TEST_FILE" \
    --env USER_URL="$USER_URL" \
    --env BIKE_URL="$BIKE_URL" \
    --env NOTIF_URL="$NOTIF_URL" \
    --env PHONE="$PHONE" \
    --env TYPE="$TYPE" \
    --env CODE="$CODE" \
    --env ENVIRONMENT="$ENVIRONMENT" \
    --out "json=$JSON_OUTPUT" \
    --summary-export="$SUMMARY_OUTPUT"; then
    
    print_message "$GREEN" "✅ Test completed successfully!"
    
    # Generate HTML report
    print_message "$BLUE" "📊 Generating HTML report..."
    
    # Use Node.js to generate the HTML report
    cat > temp_report_generator.js << 'EOF'
const fs = require('fs');
const path = require('path');

const summaryFile = process.argv[2];
const outputFile = process.argv[3];

try {
    const summaryData = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
    const timestamp = new Date().toLocaleString();
    const testName = path.basename(summaryFile).replace('-summary-', '-').replace('.json', '');
    
    const metrics = summaryData.metrics;
    const checks = summaryData.root_group.checks;
    
    // Calculate success rate
    const totalChecks = Object.values(checks).reduce((sum, check) => sum + check.passes + check.fails, 0);
    const passedChecks = Object.values(checks).reduce((sum, check) => sum + check.passes, 0);
    const successRate = totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(2) : 0;
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>K6 Test Report - ${testName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 600; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 1.1em; }
        .content { padding: 40px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-bottom: 40px; }
        .metric-card { background: #f8fafc; border-radius: 12px; padding: 24px; border-left: 4px solid #3b82f6; transition: transform 0.2s; }
        .metric-card:hover { transform: translateY(-2px); }
        .metric-card.success { border-left-color: #10b981; }
        .metric-card.warning { border-left-color: #f59e0b; }
        .metric-card.error { border-left-color: #ef4444; }
        .metric-value { font-size: 2.5em; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
        .metric-label { color: #6b7280; font-weight: 500; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #1f2937; font-size: 1.8em; font-weight: 600; border-bottom: 3px solid #3b82f6; padding-bottom: 12px; margin-bottom: 24px; }
        .checks-table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .checks-table th, .checks-table td { padding: 16px 20px; text-align: left; }
        .checks-table th { background: #f8fafc; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
        .checks-table td { border-bottom: 1px solid #f3f4f6; }
        .checks-table tr:hover { background: #f9fafb; }
        .status-pass { color: #10b981; font-weight: 600; }
        .status-fail { color: #ef4444; font-weight: 600; }
        .performance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .perf-metric { background: #f8fafc; padding: 20px; border-radius: 10px; text-align: center; border: 1px solid #e5e7eb; }
        .perf-value { font-size: 1.8em; font-weight: 600; color: #3b82f6; margin-bottom: 4px; }
        .perf-label { color: #6b7280; font-size: 0.9em; font-weight: 500; }
        .raw-data { background: #f8fafc; border-radius: 8px; padding: 20px; }
        .raw-data pre { background: #1f2937; color: #f9fafb; padding: 20px; border-radius: 8px; overflow-x: auto; font-size: 0.85em; }
        details summary { cursor: pointer; padding: 12px 16px; background: #3b82f6; color: white; border-radius: 6px; font-weight: 500; }
        details[open] summary { border-radius: 6px 6px 0 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 K6 Test Report</h1>
            <p>Generated on ${timestamp}</p>
            <p>Test: ${testName}</p>
        </div>
        
        <div class="content">
            <div class="summary-grid">
                <div class="metric-card ${successRate === '100.00' ? 'success' : successRate > '80' ? 'warning' : 'error'}">
                    <div class="metric-value">${successRate}%</div>
                    <div class="metric-label">Success Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${metrics.http_reqs?.count || 0}</div>
                    <div class="metric-label">HTTP Requests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${(metrics.http_req_duration?.avg || 0).toFixed(2)}ms</div>
                    <div class="metric-label">Avg Response Time</div>
                </div>
                <div class="metric-card ${metrics.http_req_failed?.value === 0 ? 'success' : 'error'}">
                    <div class="metric-value">${((metrics.http_req_failed?.value || 0) * 100).toFixed(2)}%</div>
                    <div class="metric-label">Error Rate</div>
                </div>
            </div>
            
            <div class="section">
                <h2>✅ Test Checks</h2>
                <table class="checks-table">
                    <thead>
                        <tr>
                            <th>Check Name</th>
                            <th>Status</th>
                            <th>Passes</th>
                            <th>Fails</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(checks).map(([name, check]) => `
                        <tr>
                            <td>${check.name}</td>
                            <td class="${check.fails === 0 ? 'status-pass' : 'status-fail'}">
                                ${check.fails === 0 ? '✅ PASS' : '❌ FAIL'}
                            </td>
                            <td>${check.passes}</td>
                            <td>${check.fails}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>📊 Performance Metrics</h2>
                <div class="performance-grid">
                    <div class="perf-metric">
                        <div class="perf-value">${(metrics.http_req_duration?.avg || 0).toFixed(2)}ms</div>
                        <div class="perf-label">Average Duration</div>
                    </div>
                    <div class="perf-metric">
                        <div class="perf-value">${(metrics.http_req_duration?.min || 0).toFixed(2)}ms</div>
                        <div class="perf-label">Minimum Duration</div>
                    </div>
                    <div class="perf-metric">
                        <div class="perf-value">${(metrics.http_req_duration?.max || 0).toFixed(2)}ms</div>
                        <div class="perf-label">Maximum Duration</div>
                    </div>
                    <div class="perf-metric">
                        <div class="perf-value">${(metrics.http_req_duration?.['p(95)'] || 0).toFixed(2)}ms</div>
                        <div class="perf-label">95th Percentile</div>
                    </div>
                    <div class="perf-metric">
                        <div class="perf-value">${metrics.iterations?.count || 0}</div>
                        <div class="perf-label">Total Iterations</div>
                    </div>
                    <div class="perf-metric">
                        <div class="perf-value">${(metrics.data_received?.count || 0)}</div>
                        <div class="perf-label">Data Received (bytes)</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h2>📋 Raw Test Data</h2>
                <div class="raw-data">
                    <details>
                        <summary>Click to view detailed JSON data</summary>
                        <pre>${JSON.stringify(summaryData, null, 2)}</pre>
                    </details>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
    
    fs.writeFileSync(outputFile, html);
    console.log(`✅ HTML report generated: ${outputFile}`);
    
} catch (error) {
    console.error(`❌ Error generating report: ${error.message}`);
    process.exit(1);
}
EOF
    
    node temp_report_generator.js "$SUMMARY_OUTPUT" "$HTML_OUTPUT"
    rm temp_report_generator.js
    
    print_message "$GREEN" "📊 Reports generated:"
    print_message "$YELLOW" "  JSON: $JSON_OUTPUT"
    print_message "$YELLOW" "  Summary: $SUMMARY_OUTPUT"
    print_message "$YELLOW" "  HTML: $HTML_OUTPUT"
    
    # Ask if user wants to open the HTML report
    if command -v open >/dev/null 2>&1; then
        read -p "$(echo -e "${BLUE}Open HTML report in browser? (y/N): ${NC}")" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "$HTML_OUTPUT"
            print_message "$GREEN" "🌐 Report opened in browser"
        fi
    fi
    
else
    print_message "$RED" "❌ Test failed"
    exit 1
fi

print_message "$GREEN" "🎉 Test run completed successfully!"

