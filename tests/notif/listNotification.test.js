import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { CONFIG } from '../../config/configEnv.js';
import { post } from '../../utils/client.js';
import { loginStage, verifyOTPStage } from '../../utils/authStage.js';
import { assertStatus } from '../../utils/checkers.js';

// Function to request OTP and get a valid token by complete auth flow
function getToken() {
  console.log('🔐 No valid ACCESS_TOKEN found, starting complete authentication flow...');
  
  try {
    // Step 1: Request OTP
    console.log('📱 Step 1: Requesting OTP code...');
    console.log(`Making POST request to: ${CONFIG.urlUsers}${CONFIG.loginRequestEndpoint}`);
    console.log(`Phone: ${CONFIG.phone}, Type: ${CONFIG.type}`);
    
    const loginResponse = loginStage();
    
    console.log(`Login response status: ${loginResponse.status}`);
    
    if (loginResponse.status !== 200) {
      console.log(`❌ Failed to request OTP. Status: ${loginResponse.status}`);
      console.log(`Response: ${loginResponse.body}`);
      return null;
    }
    
    console.log('✅ OTP request successful! OTP code should be sent.');
    sleep(1); // Small delay between requests
    
    // Step 2: Verify OTP to get token
    console.log('🔑 Step 2: Verifying OTP code to get access token...');
    console.log(`Making POST request to: ${CONFIG.urlUsers}${CONFIG.verifyLoginEndpoint}`);
    
    const payload = {
      identity: CONFIG.phone,
      code: CONFIG.code,
    };
    
    console.log(`Request payload: ${JSON.stringify(payload)}`);
    
    const verifyResponse = post(`${CONFIG.urlUsers}${CONFIG.verifyLoginEndpoint}`, payload);
    
    console.log(`Verify response status: ${verifyResponse.status}`);
    
    if (verifyResponse.status !== 200 && verifyResponse.status !== 201) {
      console.log(`❌ Failed to verify OTP. Status: ${verifyResponse.status}`);
      console.log(`Response: ${verifyResponse.body}`);
      return null;
    }
    
    const responseData = verifyResponse.json();
    console.log(`✅ Successfully obtained new access token`);
    
    return responseData.access_token;
  } catch (error) {
    console.log(`❌ Error in authentication flow: ${error}`);
    return null;
  }
}

// Alternative function using authStage utilities
function getTokenWithUtilities() {
  console.log('🔐 Using auth utilities to obtain token...');
  
  try {
    // Step 1: Request OTP using loginStage utility
    console.log('📱 Step 1: Requesting OTP code using loginStage()...');
    const loginResponse = loginStage();
    
    if (loginResponse.status !== 200) {
      console.log(`❌ Failed to request OTP. Status: ${loginResponse.status}`);
      return null;
    }
    
    console.log('✅ OTP request successful! OTP code should be sent.');
    sleep(1); // Small delay between requests
    
    // Step 2: Verify OTP using verifyOTPStage utility
    console.log('🔑 Step 2: Verifying OTP code using verifyOTPStage()...');
    const authTokens = verifyOTPStage();
    
    console.log(`✅ Successfully obtained tokens using auth utilities`);
    return authTokens.accessToken;
  } catch (error) {
    console.log(`❌ Error in authentication utilities: ${error}`);
    return null;
  }
}

export let options = {
  vus: 5,
  duration: '10s',
};

// Set default values for BASE_URL and ENDPOINT if not provided
const BASE_URL = __ENV.BASE_URL || CONFIG.urlNotifs;
const ENDPOINT = __ENV.ENDPOINT || CONFIG.listNotificationsEndpoint;

// Setup function to perform at test initialization
function setup() {
  console.log('🚀 Setting up test...');
  
  // Get token from environment variable or fetch a new one
  let token = __ENV.ACCESS_TOKEN;
  
  if (!token) {
    console.log('⚠️ ACCESS_TOKEN not provided in environment variables');
    console.log('🔄 Starting authentication flow to obtain token...');
    
    // Use the full auth flow function (getToken) or utility-based function (getTokenWithUtilities)
    // Uncomment the preferred method:
    token = getToken();
    // token = getTokenWithUtilities();
    
    if (!token) {
      console.error('❌ Failed to obtain ACCESS_TOKEN');
      console.error('ℹ️ Please ensure CONFIG values are correct in your environment:');
      console.error(`- USER_URL: ${CONFIG.urlUsers}`);
      console.error(`- PHONE: ${CONFIG.phone}`);
      console.error(`- CODE: ${CONFIG.code}`);
      console.error(`- TYPE: ${CONFIG.type}`);
      console.error('ℹ️ Or provide a token directly: k6 run -e ACCESS_TOKEN=your_token tests/notif/listNotification.test.js');
    } else {
      console.log(`✅ Successfully obtained ACCESS_TOKEN: ${token.substring(0, 20)}...`);
    }
  } else {
    console.log(`🔑 Using provided ACCESS_TOKEN: ${token.substring(0, 20)}...`);
  }
  
  return { token };
}

// Export the setup function
export { setup };

// We'll use the token from setup() in the default function
const data = setup();
const TOKEN = data.token;

export default function () {
  // Skip test if no token was obtained
  if (!TOKEN) {
    console.error('❌ Skipping test because no valid token is available');
    return;
  }

  console.log('📝 Executing notification list test...');
  const url = `${BASE_URL}${ENDPOINT}`;
  console.log(`🔗 Request URL: ${url}`);
  
  const params = {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  console.log('🚀 Sending GET request for notifications...');
  const res = http.get(url, params);
  console.log(`📊 Response status: ${res.status}`);

  group('Response Validation', function () {
    const response = res.json();
    const requiredFields = ['id', 'user_id', 'bike_id'];
    const otherFields = ['title','description','is_read','created_at','updated_at','notification_type','category','group'];

    if (res.status === 200 && TOKEN) {
      check(res, {
        '(P) Status is 200 or 201': (r) => [200, 201].includes(response.status_code),
        '(P) Response data exists': () => response.data !== undefined,
      });

      if (Array.isArray(response.data)) {
        response.data.forEach((item, index) => {
          requiredFields.forEach((field) => {
            check(item, {
              [`(P) Required field "${field}" exists in item ${index + 1}`]: (obj) => obj[field] !== undefined && obj[field] !== null,
            });
          });

          otherFields.forEach((field) => {
            check(item, {
              [`(P) Optional field "${field}" exists in item ${index + 1}`]: (obj) => obj[field] !== undefined,
            });
          });
        });
      }

    } else if (res.status === 401) {
      check(res, {
        '(N) Unauthorized access - token expired': (r) => r.status === 401,
        '(N) Message is correct': () => response.message === 'You are not authorized',
        '(N) Error key is correct': () => response.error_key === 'ErrorUnauthorized',
      });
    } else {
      check(res, {
        '(N) Error response is 400/404/500': (r) => [400, 404, 500].includes(r.status),
        '(N) Response is not 200': (r) => r.status !== 200,
      });
    }
  });
  
  // Add a small sleep to avoid overwhelming the API
  sleep(0.5);
}

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
