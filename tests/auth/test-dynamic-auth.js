import { getAuthVersionForEnvironment } from '../../utils/authDynamic.js';

export let options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  console.log('🧪 Testing dynamic authentication version selection...');
  
  // Test different environment scenarios
  const testCases = [
    { env: 'stagev1', expected: 'V1' },
    { env: 'prodv1', expected: 'V1' },
    { env: 'STAGEV1', expected: 'V1' },
    { env: 'PRODV1', expected: 'V1' },
    { env: 'stage', expected: 'V2' },
    { env: 'prod', expected: 'V2' },
    { env: 'dev', expected: 'V2' },
    { env: 'test', expected: 'V2' },
    { env: null, expected: 'V2' },
    { env: '', expected: 'V2' }
  ];
  
  let allTestsPassed = true;
  
  testCases.forEach(({ env, expected }) => {
    // For explicit testing, we need to pass the environment directly rather than relying on default behavior
    let result;
    if (env === null || env === '') {
      // Test the default behavior when no environment is provided
      result = getAuthVersionForEnvironment(env === null ? null : env);
    } else {
      result = getAuthVersionForEnvironment(env);
    }
    const passed = result === expected;
    
    if (passed) {
      console.log(`✅ ${env || 'null'} -> ${result} (expected: ${expected})`);
    } else {
      console.log(`❌ ${env || 'null'} -> ${result} (expected: ${expected})`);
      allTestsPassed = false;
    }
  });
  
  if (allTestsPassed) {
    console.log('🎉 All dynamic authentication tests passed!');
  } else {
    console.log('❌ Some dynamic authentication tests failed!');
  }
  
  // Test with current environment
  const currentEnv = __ENV.ENVIRONMENT || 'default';
  const currentVersion = getAuthVersionForEnvironment(__ENV.ENVIRONMENT);
  console.log(`🌍 Current environment '${currentEnv}' will use auth version: ${currentVersion}`);
}

