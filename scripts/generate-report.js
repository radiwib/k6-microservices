import fs from 'fs';
import path from 'path';

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
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>K6 Test Report - ${testName}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 10px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .metric-card { 
            background: #f8f9fa; 
            border-radius: 8px; 
            padding: 20px; 
            border-left: 4px solid #007bff; 
        }
        .metric-card.success { border-left-color: #28a745; }
        .metric-card.warning { border-left-color: #ffc107; }
        .metric-card.error { border-left-color: #dc3545; }
        .metric-value { font-size: 2em; font-weight: bold; color: #333; }
        .metric-label { color: #666; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section h2 { 
            color: #333; 
            border-bottom: 2px solid #007bff; 
            padding-bottom: 10px; 
        }
        .checks-table { 
            width: 100%; 
            border-collapse: collapse; 
            background: white; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        }
        .checks-table th, .checks-table td { 
            padding: 15px; 
            text-align: left; 
            border-bottom: 1px solid #eee; 
        }
        .checks-table th { 
            background: #f8f9fa; 
            font-weight: 600; 
        }
        .status-pass { color: #28a745; font-weight: bold; }
        .status-fail { color: #dc3545; font-weight: bold; }
        .performance-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
        }
        .perf-metric { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 6px; 
            text-align: center; 
        }
        .perf-value { font-size: 1.5em; font-weight: bold; color: #007bff; }
        .perf-label { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Authentication Test Report</h1>
            <p>Generated on ${timestamp}</p>
            <p>Test: ${testName}</p>
        </div>
        
        <div class="content">
            <!-- Summary Cards -->
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
            
            <!-- Checks Section -->
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
            
            <!-- Performance Metrics -->
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
                        <div class="perf-value">${(metrics.data_received?.count || 0)} bytes</div>
                        <div class="perf-label">Data Received</div>
                    </div>
                </div>
            </div>
            
            <!-- Raw Data -->
            <div class="section">
                <h2>📋 Raw Test Data</h2>
                <details>
                    <summary style="cursor: pointer; padding: 10px; background: #f8f9fa; border-radius: 5px;">Click to view raw JSON data</summary>
                    <pre style="background: #f8f9fa; padding: 20px; border-radius: 5px; overflow-x: auto; margin-top: 10px;">${JSON.stringify(summaryData, null, 2)}</pre>
                </details>
            </div>
        </div>
    </div>
</body>
</html>
    `;
    
    fs.writeFileSync(outputFile, html);
    console.log(`✅ HTML report generated: ${outputFile}`);
    
  } catch (error) {
    console.error(`❌ Error generating report: ${error.message}`);
  }
}

// Get the latest summary file from results directory
const resultsDir = 'results';
const summaryFiles = fs.readdirSync(resultsDir)
  .filter(file => file.includes('summary') && file.endsWith('.json'))
  .map(file => ({
    name: file,
    path: path.join(resultsDir, file),
    mtime: fs.statSync(path.join(resultsDir, file)).mtime
  }))
  .sort((a, b) => b.mtime - a.mtime);

if (summaryFiles.length > 0) {
  const latestSummary = summaryFiles[0];
  const outputFile = latestSummary.path.replace('.json', '.html');
  generateHTMLReport(latestSummary.path, outputFile);
} else {
  console.log('❌ No summary files found in results directory');
}

