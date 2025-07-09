import { getTrackedEndpoints, formatEndpointList } from './endpointTracker.js';

// Enhanced summary function to display test results with endpoint tracking
export function handleSummary(data) {
  // Get endpoint tracking data
  const endpointData = getTrackedEndpoints();
  const testTitle = endpointData.testName || 'K6 Test';
  const testType = endpointData.testType || 'test';
  
  // Export endpoint data for HTML report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const endpointFileName = `endpoint-data-${timestamp}.json`;
  
  // Add the endpoint data to the return object for file export
  const endpointDataForExport = {
    ...endpointData,
    exportedAt: new Date().toISOString(),
    testMetrics: {
      totalChecks: data.metrics.checks.values.passes + data.metrics.checks.values.fails,
      passedChecks: data.metrics.checks.values.passes,
      failedChecks: data.metrics.checks.values.fails,
      httpRequests: data.metrics.http_reqs?.values.count || 0,
      avgResponseTime: data.metrics.http_req_duration?.values.avg || 0,
      iterations: data.metrics.iterations?.values.count || 0
    }
  };
  
  console.log(`\n📊 ${testTitle} Summary:`);
  console.log('=' .repeat(50));
  
  // Test execution metrics
  console.log('\n🎯 Test Execution Metrics:');
  console.log(`- Total checks: ${data.metrics.checks.values.passes + data.metrics.checks.values.fails}`);
  console.log(`- Passed: ${data.metrics.checks.values.passes}`);
  console.log(`- Failed: ${data.metrics.checks.values.fails}`);
  
  if (data.metrics.checks.values.passes + data.metrics.checks.values.fails > 0) {
    console.log(`- Success rate: ${((data.metrics.checks.values.passes / (data.metrics.checks.values.passes + data.metrics.checks.values.fails)) * 100).toFixed(2)}%`);
  } else {
    console.log(`- Success rate: N/A (no checks executed)`);
  }
  
  // VU and iteration metrics
  if (data.metrics.iterations && data.metrics.iterations.values.count > 0) {
    console.log(`- Iterations: ${data.metrics.iterations.values.count}`);
  }
  
  if (data.metrics.vus && data.metrics.vus.values.value > 0) {
    console.log(`- Virtual Users: ${data.metrics.vus.values.value}`);
  }
  
  // HTTP request metrics
  if (data.metrics.http_reqs && data.metrics.http_reqs.values.count > 0) {
    console.log(`- HTTP Requests: ${data.metrics.http_reqs.values.count}`);
  }
  
  // Performance metrics
  if (data.metrics.http_req_duration && data.metrics.http_req_duration.values.avg) {
    console.log(`- Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  }
  
  // Endpoint tracking section
  console.log('\n🔗 Endpoints Tested:');
  console.log(`- Total unique endpoints: ${endpointData.totalEndpoints}`);
  console.log(`- Total endpoint calls: ${endpointData.totalCalls}`);
  
  if (endpointData.endpoints.length > 0) {
    console.log(formatEndpointList());
  } else {
    console.log('  (No endpoints tracked - ensure endpoint tracking is enabled)');
  }
  
  // Test completion message
  console.log('\n' + '=' .repeat(50));
  const completionMessage = testType === 'stress' ? 
    `✅ ${testTitle} stress test completed` : 
    `✅ ${testTitle} test completed`;
  
  console.log(completionMessage);
  
  // Export endpoint data for HTML report (this will be captured by the test runner)
  // Export even if empty to help debug the issue
  console.log(`ENDPOINT_DATA_EXPORT:${JSON.stringify(endpointDataForExport)}`);
  
  // Debug logging
  console.log(`🔍 Debug: Endpoint data has ${endpointData.endpoints.length} endpoints`);
  console.log(`🔍 Debug: Endpoint data: ${JSON.stringify(endpointData, null, 2)}`);
  
  return {
    'stdout': `\n${completionMessage}\n`,
  };
}
