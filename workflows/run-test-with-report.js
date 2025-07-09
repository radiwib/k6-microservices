#!/usr/bin/env node

/**
 * Cross-platform K6 Test Runner with Automatic Report Generation
 * Works on both macOS and Windows
 * Usage: node workflows/run-test-with-report.js <test-file> [environment]
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const os = require('os');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function printMessage(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function loadEnvFile(envFile) {
  try {
    const envContent = fs.readFileSync(envFile, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=');
          // Remove quotes if present
          value = value.replace(/^["']|["']$/g, '');
          envVars[key] = value;
        }
      }
    });
    
    return envVars;
  } catch (error) {
    throw new Error(`Failed to load environment file: ${error.message}`);
  }
}

function generateHTMLReport(summaryFile, outputFile) {
  try {
    const summaryData = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
    const timestamp = new Date().toLocaleString();
    const testName = path.basename(summaryFile).replace('-summary-', '-').replace('.json', '');
    
    const metrics = summaryData.metrics;
    const checks = summaryData.root_group.checks;
    
    // Try to load endpoint data if it exists
    let endpointData = null;
    const endpointFile = summaryFile.replace('-summary-', '-endpoints-');
    try {
      if (fs.existsSync(endpointFile)) {
        endpointData = JSON.parse(fs.readFileSync(endpointFile, 'utf8'));
      }
    } catch (error) {
      console.log(`Note: No endpoint data found (${error.message})`);
    }
    
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
        .platform-info { background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        
        /* Endpoint Tracking Styles */
        .endpoints-container { margin-top: 30px; }
        .endpoints-container h3 { color: #374151; font-size: 1.4em; margin-bottom: 20px; }
        .endpoints-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        .service-card { background: #f8fafc; border-radius: 10px; padding: 20px; border: 1px solid #e5e7eb; }
        .service-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .service-header h4 { margin: 0; color: #1f2937; font-size: 1.1em; }
        .service-count { background: #3b82f6; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.8em; font-weight: 500; }
        .endpoints-list { space-y: 10px; }
        .endpoint-item { background: white; border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 4px solid #e5e7eb; }
        .endpoint-method { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.75em; font-weight: 600; color: white; margin-right: 10px; }
        .endpoint-method.get { background: #10b981; }
        .endpoint-method.post { background: #3b82f6; }
        .endpoint-method.put { background: #f59e0b; }
        .endpoint-method.delete { background: #ef4444; }
        .endpoint-method.patch { background: #8b5cf6; }
        .endpoint-path { display: inline-block; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 0.9em; color: #374151; font-weight: 500; }
        .endpoint-info { margin-top: 8px; }
        .endpoint-desc { color: #6b7280; font-size: 0.85em; margin-right: 10px; }
        .call-count { background: #fef3c7; color: #d97706; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; font-weight: 500; margin-right: 10px; }
        .status-codes { background: #ecfdf5; color: #059669; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; font-weight: 500; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 K6 Test Report</h1>
            <p>Generated on ${timestamp}</p>
            <p>Test: ${testName}</p>
            <p>Platform: ${os.platform()} ${os.arch()}</p>
        </div>
        
        <div class="content">
            <div class="platform-info">
                <strong>🖥️ System Info:</strong> ${os.type()} ${os.release()} | Node.js ${process.version}
            </div>
            
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
            
            ${endpointData ? `
            <div class="section">
                <h2>🔗 Endpoints Tested</h2>
                <div class="summary-grid">
                    <div class="metric-card">
                        <div class="metric-value">${endpointData.totalEndpoints || 0}</div>
                        <div class="metric-label">Total Endpoints</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${endpointData.totalCalls || 0}</div>
                        <div class="metric-label">Total API Calls</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${Object.keys(endpointData.endpoints?.reduce((acc, ep) => ({ ...acc, [ep.baseUrl]: true }), {}) || {}).length}</div>
                        <div class="metric-label">Services Tested</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${endpointData.testType || 'test'}</div>
                        <div class="metric-label">Test Type</div>
                    </div>
                </div>
                
                ${endpointData.endpoints && endpointData.endpoints.length > 0 ? `
                <div class="endpoints-container">
                    <h3>📋 Endpoint Details</h3>
                    <div class="endpoints-grid">
                        ${Object.entries(endpointData.endpoints.reduce((acc, ep) => {
                            if (!acc[ep.baseUrl]) acc[ep.baseUrl] = [];
                            acc[ep.baseUrl].push(ep);
                            return acc;
                        }, {})).map(([service, endpoints]) => `
                        <div class="service-card">
                            <div class="service-header">
                                <h4>🌐 ${service}</h4>
                                <span class="service-count">${endpoints.length} endpoint${endpoints.length > 1 ? 's' : ''}</span>
                            </div>
                            <div class="endpoints-list">
                                ${endpoints.map(ep => `
                                <div class="endpoint-item">
                                    <div class="endpoint-method ${ep.method.toLowerCase()}">${ep.method}</div>
                                    <div class="endpoint-path">${ep.endpoint}</div>
                                    <div class="endpoint-info">
                                        ${ep.description ? `<span class="endpoint-desc">${ep.description}</span>` : ''}
                                        ${ep.callCount > 1 ? `<span class="call-count">${ep.callCount} calls</span>` : ''}
                                        ${ep.statusCodes && ep.statusCodes.length > 0 ? `<span class="status-codes">Status: ${[...new Set(ep.statusCodes)].join(', ')}</span>` : ''}
                                    </div>
                                </div>
                                `).join('')}
                            </div>
                        </div>
                        `).join('')}
                    </div>
                </div>
                ` : '<p>No endpoint details available</p>'}
            </div>
            ` : ''}
            
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
    printMessage(colors.green, `✅ HTML report generated: ${outputFile}`);
    
  } catch (error) {
    printMessage(colors.red, `❌ Error generating report: ${error.message}`);
    throw error;
  }
}

function openFile(filePath) {
  const platform = os.platform();
  let command;
  
  switch (platform) {
    case 'darwin': // macOS
      command = `open "${filePath}"`;
      break;
    case 'win32': // Windows
      command = `start "" "${filePath}"`;
      break;
    case 'linux': // Linux
      command = `xdg-open "${filePath}"`;
      break;
    default:
      printMessage(colors.yellow, `⚠️ Cannot auto-open file on platform: ${platform}`);
      return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    exec(command, (error) => {
      if (error) {
        printMessage(colors.yellow, `⚠️ Could not open file: ${error.message}`);
        resolve(); // Don't fail the whole process
      } else {
        printMessage(colors.green, '🌐 Report opened in default application');
        resolve();
      }
    });
  });
}

function runK6Test(testFile, envVars, outputFiles) {
  return new Promise((resolve, reject) => {
    // Initialize the k6Args array with base arguments
    const k6Args = [
      'run',
      testFile
    ];
    
    // Dynamically add all environment variables
    for (const [key, value] of Object.entries(envVars)) {
      if (value !== undefined && value !== null) {
        k6Args.push('--env', `${key}=${value}`);
      }
    }
    
    // Add output file arguments
    k6Args.push(
      '--out', `json=${outputFiles.json}`,
      '--summary-export', outputFiles.summary
    );
    
    // Log all environment variables being passed (for debugging)
    printMessage(colors.yellow, `Passing ${Object.keys(envVars).length} environment variables to k6`);
    
    printMessage(colors.blue, '🚀 Running K6 test...');
    
    // Create a buffer to capture stdout for endpoint data
    let stdoutBuffer = '';
    
    const k6Process = spawn('k6', k6Args, {
      stdio: ['inherit', 'pipe', 'inherit'],
      shell: true
    });
    
    // Capture stdout to look for endpoint data
    k6Process.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output); // Still show output to user
      stdoutBuffer += output;
    });
    
    k6Process.on('close', (code) => {
      if (code === 0) {
        printMessage(colors.green, '✅ Test completed successfully!');
        
        // Try to extract endpoint data from stdout
        try {
          const endpointDataMatch = stdoutBuffer.match(/ENDPOINT_DATA_EXPORT:(.+)/g);
          if (endpointDataMatch) {
            // Get the last match (most recent/complete one)
            const lastMatch = endpointDataMatch[endpointDataMatch.length - 1];
            const endpointDataJson = lastMatch.replace('ENDPOINT_DATA_EXPORT:', '');
            const endpointData = JSON.parse(endpointDataJson);
            
            // Save endpoint data to file
            const endpointFile = outputFiles.summary.replace('-summary-', '-endpoints-');
            fs.writeFileSync(endpointFile, JSON.stringify(endpointData, null, 2));
            printMessage(colors.green, `📋 Endpoint data saved to: ${endpointFile}`);
            printMessage(colors.green, `📋 Found ${endpointData.totalEndpoints} endpoints in ${endpointDataMatch.length} export(s)`);
          } else {
            printMessage(colors.yellow, '⚠️ No endpoint data found in test output');
            // Debug: show what we're looking for
            const hasExportLine = stdoutBuffer.includes('ENDPOINT_DATA_EXPORT:');
            printMessage(colors.yellow, `🔍 Debug: ENDPOINT_DATA_EXPORT line found: ${hasExportLine}`);
          }
        } catch (error) {
          printMessage(colors.yellow, `⚠️ Could not extract endpoint data: ${error.message}`);
        }
        
        resolve();
      } else {
        reject(new Error(`K6 test failed with exit code ${code}`));
      }
    });
    
    k6Process.on('error', (error) => {
      reject(new Error(`Failed to start K6: ${error.message}`));
    });
  });
}

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      printMessage(colors.red, '❌ Error: Test file is required');
      console.log('Usage: node workflows/run-test-with-report.js <test-file> [environment]');
      console.log('Example: node workflows/run-test-with-report.js tests/auth/auth-test.js stage');
      process.exit(1);
    }
    
    const testFile = args[0];
    const environment = args[1] || 'stage';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const testName = path.basename(testFile, '.js');
    
    // Check if test file exists
    if (!fs.existsSync(testFile)) {
      printMessage(colors.red, `❌ Error: Test file '${testFile}' not found`);
      process.exit(1);
    }
    
    // Check if environment file exists
    const envFile = `env/.env.${environment}`;
    if (!fs.existsSync(envFile)) {
      printMessage(colors.red, `❌ Error: Environment file '${envFile}' not found`);
      process.exit(1);
    }
    
    printMessage(colors.blue, '🔬 Running K6 Test with Report Generation');
    printMessage(colors.yellow, `Test File: ${testFile}`);
    printMessage(colors.yellow, `Environment: ${environment}`);
    printMessage(colors.yellow, `Platform: ${os.platform()} ${os.arch()}`);
    printMessage(colors.yellow, `Timestamp: ${timestamp}`);
    
    // Load environment variables
    printMessage(colors.blue, `📋 Loading environment variables from ${envFile}...`);
    const envVars = loadEnvFile(envFile);
    envVars.ENVIRONMENT = environment;
    
    // Create results directory
    const resultsDir = 'results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    // Define output files
    const outputFiles = {
      json: path.join(resultsDir, `${testName}-results-${timestamp}.json`),
      summary: path.join(resultsDir, `${testName}-summary-${timestamp}.json`),
      html: path.join(resultsDir, `${testName}-report-${timestamp}.html`)
    };
    
    // Run K6 test
    await runK6Test(testFile, envVars, outputFiles);
    
    // Generate HTML report
    printMessage(colors.blue, '📊 Generating HTML report...');
    generateHTMLReport(outputFiles.summary, outputFiles.html);
    
    printMessage(colors.green, '📊 Reports generated:');
    printMessage(colors.yellow, `  JSON: ${outputFiles.json}`);
    printMessage(colors.yellow, `  Summary: ${outputFiles.summary}`);
    printMessage(colors.yellow, `  HTML: ${outputFiles.html}`);
    
    // Ask if user wants to open the HTML report
    if (process.stdin.isTTY) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('Open HTML report in browser? (y/N): ', async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          await openFile(outputFiles.html);
        }
        rl.close();
        printMessage(colors.green, '🎉 Test run completed successfully!');
      });
    } else {
      printMessage(colors.green, '🎉 Test run completed successfully!');
    }
    
  } catch (error) {
    printMessage(colors.red, `❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, generateHTMLReport, loadEnvFile };


