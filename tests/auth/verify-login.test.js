import { check, sleep } from 'k6';
import { CONFIG } from '../../config/configEnv.js';
import { post } from '../../utils/client.js';

// Test Configuration
export let options = {
  vus: 5,
  iterations: 5,
};

export default function () {
  console.log(' Testing login request and verify-login endpoints...');
  console.log(`Config loaded - User URL: ${CONFIG.urlUsers}`);
  console.log(`Phone: ${CONFIG.phone}, Code: ${CONFIG.code}`);
  console.log(`Login Request Endpoint: ${CONFIG.loginRequestEndpoint}`);
  console.log(`Verify Login Endpoint: ${CONFIG.verifyLoginEndpoint}`);
  
  try {
    // Step 1: Hit login request endpoint first
    console.log('Step 1: Requesting login code...');
    
    const loginRequestUrl = `${CONFIG.urlUsers}${CONFIG.loginRequestEndpoint}`;
    console.log(`Making POST request to: ${loginRequestUrl}`);
    
    const loginPayload = {
      identity: CONFIG.phone,
      type: CONFIG.type,
    };
    
    console.log(`Login request payload: ${JSON.stringify(loginPayload)}`);
    
    const loginResponse = post(loginRequestUrl, loginPayload);
    
    console.log(`Login request status: ${loginResponse.status}`);
    console.log(`Login request body: ${loginResponse.body}`);
    
    // Check login request status code is 200
    const loginStatusCheck = check(loginResponse, {
      'login-request status is 200': (r) => r.status === 200,
    });
    
    if (!loginStatusCheck) {
      console.log(`❌ Login request failed. Expected: 200, Got: ${loginResponse.status}`);
      console.log('⚠️  Continuing with verify-login test anyway...');
    } else {
      console.log('✅ Login request successful!');
    }
    
    // Add a small delay between requests
    sleep(2);
    
    // Step 2: Test verify-login endpoint
    console.log('Step 2: Attempting to verify login with OTP code...');
    
    const verifyLoginUrl = `${CONFIG.urlUsers}${CONFIG.verifyLoginEndpoint}`;
    console.log(`Making POST request to: ${verifyLoginUrl}`);
    
    const payload = {
      identity: CONFIG.phone,
      code: CONFIG.code,
    };
    
    console.log(`Request payload: ${JSON.stringify(payload)}`);
    
    const response = post(verifyLoginUrl, payload);
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response body: ${response.body}`);
    
    // Check status code is 200
    const statusCheck = check(response, {
      'verify-login status is success': (r) => r.status === 201,
    });
    
    if (!statusCheck) {
      console.log(`❌ Status check failed. Expected: 201, Got: ${response.status}`);
      return;
    }
    
    // Parse response body
    let responseData;
    try {
      responseData = response.json();
    } catch (error) {
      console.log(`❌ Failed to parse response JSON: ${error}`);
      console.log(`Response body: ${response.body}`);
      return;
    }
    
    console.log(`Parsed response data: ${JSON.stringify(responseData, null, 2)}`);
    
    // Check response body contains access_token and refresh_token
    const tokenChecks = check(responseData, {
      'response has access_token': (data) => data.access_token !== undefined && data.access_token !== null && data.access_token !== '',
      'response has refresh_token': (data) => data.refresh_token !== undefined && data.refresh_token !== null && data.refresh_token !== '',
      'access_token is string': (data) => typeof data.access_token === 'string',
      'refresh_token is string': (data) => typeof data.refresh_token === 'string',
      'access_token is not empty': (data) => data.access_token.length > 0,
      'refresh_token is not empty': (data) => data.refresh_token.length > 0,
    });
    
    if (tokenChecks) {
      console.log('✅ All checks passed!');
      console.log(`✅ Access token: ${responseData.access_token.substring(0, 20)}...`);
      console.log(`✅ Refresh token: ${responseData.refresh_token.substring(0, 20)}...`);
      console.log('✅ Verify-login endpoint test successful!');
    } else {
      console.log('❌ Some token checks failed');
      console.log(`Response data keys: ${Object.keys(responseData)}`);
    }
    
  } catch (error) {
    console.log(`❌ Verify-login test failed: ${error}`);
    console.log(`Error stack: ${error.stack}`);
  }
  
  sleep(1);
}

// Summary function to display test results
export function handleSummary(data) {
  console.log('\nTest Summary:');
  console.log(`- Total checks: ${data.metrics.checks.values.passes + data.metrics.checks.values.fails}`);
  console.log(`- Passed: ${data.metrics.checks.values.passes}`);
  console.log(`- Failed: ${data.metrics.checks.values.fails}`);
  console.log(`- Success rate: ${((data.metrics.checks.values.passes / (data.metrics.checks.values.passes + data.metrics.checks.values.fails)) * 100).toFixed(2)}%`);
  
  return {
    'stdout': '\n✅ Verify-login endpoint test completed\n',
  };
}

