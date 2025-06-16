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
    const k6Args = [
      'run',
      testFile,
      '--env', `USER_URL=${envVars.USER_URL}`,
      '--env', `BIKE_URL=${envVars.BIKE_URL}`,
      '--env', `NOTIF_URL=${envVars.NOTIF_URL}`,
      '--env', `PHONE=${envVars.PHONE}`,
      '--env', `TYPE=${envVars.TYPE}`,
      '--env', `CODE=${envVars.CODE}`,
      '--env', `ENVIRONMENT=${envVars.ENVIRONMENT}`,
      '--out', `json=${outputFiles.json}`,
      '--summary-export', outputFiles.summary
    ];
    
    printMessage(colors.blue, '🚀 Running K6 test...');
    
    const k6Process = spawn('k6', k6Args, {
      stdio: 'inherit',
      shell: true
    });
    
    k6Process.on('close', (code) => {
      if (code === 0) {
        printMessage(colors.green, '✅ Test completed successfully!');
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
    const envFile = `.env.${environment}`;
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

