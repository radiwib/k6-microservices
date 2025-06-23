// Add summary function to display test results
export function handleSummary(data) {
  console.log('\n📊 Notification List Test Summary:');
  console.log(`- Total checks: ${data.metrics.checks.values.passes + data.metrics.checks.values.fails}`);
  console.log(`- Passed: ${data.metrics.checks.values.passes}`);
  console.log(`- Failed: ${data.metrics.checks.values.fails}`);
  
  if (data.metrics.checks.values.passes + data.metrics.checks.values.fails > 0) {
    console.log(`- Success rate: ${((data.metrics.checks.values.passes / (data.metrics.checks.values.passes + data.metrics.checks.values.fails)) * 100).toFixed(2)}%`);
  } else {
    console.log(`- Success rate: N/A (no checks executed)`);
  }
  
  return {
    'stdout': '\n✅ Notification list test completed\n',
  };
}