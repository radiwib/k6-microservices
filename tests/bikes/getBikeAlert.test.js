import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { CONFIG } from '../../config/configEnv.js';
import { post } from '../../utils/client.js';
import { loginDynamic, verifyOTPDynamic } from '../../utils/authDynamic.js';
import { assertStatus } from '../../utils/checkers.js';
import { loadProfiles } from  '../../config/configVu.js';
import { getBikeId } from '../../utils/getBikeId.js';

// Function to request OTP and get a valid token by complete auth flow
function getToken() {
  console.log('🔐 Acquiring token for test...');
  console.log('📋 Auth configuration:');
  console.log(`- USER_URL: ${CONFIG.urlUsers}`);
  console.log(`- PHONE: ${CONFIG.phone}`);
  console.log(`- TYPE: ${CONFIG.type}`);
  console.log(`- LOGIN_REQUEST_ENDPOINT: ${CONFIG.loginRequestEndpoint}`);
  console.log(`- VERIFY_LOGIN_ENDPOINT: ${CONFIG.verifyLoginEndpoint}`);
  console.log(`- CODE: ${CONFIG.code}`);

   try {
    // Step 1: Request OTP
    console.log('📱 Requesting OTP code...');
    const loginResponse = loginDynamic();
    
    if (!loginResponse) {
      console.error('❌ Login response is null or undefined');
      return null;
    }
    
    if (loginResponse.status !== 200) {
      console.error(`❌ Failed to request OTP. Status: ${loginResponse.status}`);
      console.error(`Response body: ${JSON.stringify(loginResponse.body || {})}`);
      return null;
    }
    
    console.log('✅ OTP request successful');
    sleep(1); // Small delay between requests
    
    // Step 2: Verify OTP to get token
    console.log('🔑 Verifying OTP code...');
    try {
      const verifyResponse = verifyOTPDynamic();
      
      if (!verifyResponse) {
        console.error('❌ Verify OTP response is null or undefined');
        return null;
      }
    
      if (!verifyResponse.accessToken) {
        console.error('❌ No access token in verify response');
        console.error(`Response data: ${JSON.stringify(verifyResponse)}`);
        return null;
      }
      
      console.log('✅ Token acquired successfully');
      return verifyResponse.accessToken;
    } catch (verifyError) {
      console.error(`❌ Error during OTP verification: ${verifyError.message || verifyError}`);
      if (verifyError.response) {
        console.error(`Response status: ${verifyError.response.status}`);
        console.error(`Content-Type: ${verifyError.response.headers['Content-Type'] || 'unknown'}`);
        
        try {
          // Try to parse as JSON first
          const jsonBody = JSON.parse(verifyError.response.body);
          console.error(`Response body (JSON): ${JSON.stringify(jsonBody)}`);
        } catch (parseError) {
          // If not JSON, log as text
          console.error(`Response body (text): ${verifyError.response.body}`);
          console.error(`Response body is not valid JSON: ${parseError.message}`);
        }
      }
      return null;
    }
  } catch (error) {
    console.error(`❌ Error in authentication flow: ${error.message || error}`);
    console.error(`Stack trace: ${error.stack || 'No stack trace'}`);
    return null;
  }
}

// Import the load profile for this test
export let options = loadProfiles.quickTest;

// Always use CONFIG.urlBikes to ensure proper URL with protocol
const BASE_URL = CONFIG.urlBikes;

// Log API configuration for debugging
console.log('📋 API Configuration:');
console.log(`- NOTIF_URL from ENV: ${__ENV.NOTIF_URL}`);
console.log(`- BASE_URL (CONFIG.urlBikes): ${BASE_URL}`);

// Token cache to store tokens per VU
const tokenCache = {};

// Bike ID cache to store bike IDs per VU (since getBikeId makes HTTP requests)
const bikeIdCache = {};

export default function () {
  // Get token from cache or acquire a new one for this VU
  let token = tokenCache[__VU];

  // If no token in cache for this VU, try to get one
  if (!token) {
    console.log(`🔄 VU ${__VU}: Getting token for first request...`);

      // Try to get one through authentication
      token = getToken();
      
      if (!token) {
        console.error('❌ Failed to obtain token. Check your configuration:');
        console.error(`- USER_URL: ${CONFIG.urlUsers}`);
        console.error(`- PHONE: ${CONFIG.phone}`);
        console.error(`- TYPE: ${CONFIG.type}`);
        console.error(`- CODE: ${CONFIG.code}`);
        console.error(`- LOGIN_REQUEST_ENDPOINT: ${CONFIG.loginRequestEndpoint}`);
        console.error(`- VERIFY_LOGIN_ENDPOINT: ${CONFIG.verifyLoginEndpoint}`);
        console.error(`- BASE_URL for bike: ${CONFIG.urlBikes}`);
        console.error(`- ENV variables available: ${Object.keys(__ENV).join(', ')}`);
      } else {
        console.log(`✅ Token acquired for VU ${__VU}`);
        // Cache the token for this VU
        tokenCache[__VU] = token;
      }
  }

  // Skip test if no token was obtained
  if (!token) {
    console.error('❌ Skipping test because no valid token is available');
    return;
  }

  // Get bike ID from cache or acquire a new one for this VU
  let bikeId = bikeIdCache[__VU];
  
  // If no bike ID in cache for this VU, get one
  if (!bikeId) {
    console.log(`🔄 VU ${__VU}: Getting bike ID for first request...`);
    
    try {
      bikeId = getBikeId();
      
      if (!bikeId) {
        console.error('❌ Failed to obtain bike ID. Check your configuration:');
        console.error(`- BIKE_URL: ${CONFIG.urlBikes}`);
        console.error(`- LIST_BIKES_ENDPOINT: ${CONFIG.listBikesEndpoint}`);
        return;
      } else {
        console.log(`✅ Bike ID acquired for VU ${__VU}: ${bikeId}`);
        // Cache the bike ID for this VU
        bikeIdCache[__VU] = bikeId;
      }
    } catch (error) {
      console.error(`❌ Error getting bike ID: ${error}`);
      return;
    }
  }
  
  // Construct the endpoint with the bike ID
  const ENDPOINT = `${CONFIG.listBikesEndpoint}/${bikeId}/notifications`;
  console.log(`📋 Using endpoint: ${ENDPOINT}`);
  console.log(`🚲 Using bike ID: ${bikeId}`);
  
  // Skip test if no bike ID was obtained
  if (!bikeId) {
    console.error('❌ Skipping test because no valid bike ID is available');
    return;
  }

  // Prepare notification list request with proper URL joining
  let url;
  
  // Ensure proper URL joining by handling trailing/leading slashes
  if (BASE_URL && ENDPOINT) {
    if (BASE_URL.endsWith('/') && ENDPOINT.startsWith('/')) {
      url = `${BASE_URL}${ENDPOINT.substring(1)}`;
    } else if (!BASE_URL.endsWith('/') && !ENDPOINT.startsWith('/')) {
      url = `${BASE_URL}/${ENDPOINT}`;
    } else {
      url = `${BASE_URL}${ENDPOINT}`;
    }
  } else {
    console.error('❌ BASE_URL or ENDPOINT is undefined');
    url = '';
  }
  
  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // Execute the request
  console.log(`📝 VU ${__VU}: Requesting bike alert notification from ${url}`);
  const res = http.get(url, params);
  console.log(`📊 Response status: ${res.status}`);

  group('Response Validation', function () {
    const response = res.json();
    const requiredFields = ['id', 'user_id', 'bike_id'];
    const otherFields = ['title','description','is_read','created_at','updated_at','notification_type','category','group'];

    if (res.status === 200 && token) {
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