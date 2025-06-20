import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { CONFIG } from '../../config/configEnv.js';
import { getToken } from '../../utils/authDynamic.js';
import { assertStatus } from '../../utils/checkers.js';
import { loadProfiles } from  '../../config/configVu.js';

//Function to set up the load profile for this test
export let options = loadProfiles.quickTest;

// Always use CONFIG.urlNotifs to ensure proper URL with protocol
const BASE_URL = CONFIG.urlNotifs;
const ENDPOINT = CONFIG.listNotificationsEndpoint;

// Log API configuration for debugging
console.log('📋 API Configuration:');
console.log(`- NOTIF_URL from ENV: ${__ENV.NOTIF_URL}`);
console.log(`- BASE_URL (CONFIG.urlNotifs): ${BASE_URL}`);
console.log(`- ENDPOINT: ${ENDPOINT}`);

// Token cache to store tokens per VU
const tokenCache = {};

export default function () {
  // Get token from cache or acquire a new one for this VU
  let token = tokenCache[__VU];

  // If no token in cache for this VU, try to get one
  if (!token) {
    console.log(`🔄 VU ${__VU}: Getting token for first request...`);

    if (!token) {
      // No token in environment, try to get one through authentication
      token = getToken();
      
      if (!token) {
        console.error('❌ Failed to obtain token. Check your configuration:');
        console.error(`- USER_URL: ${CONFIG.urlUsers}`);
        console.error(`- PHONE: ${CONFIG.phone}`);
        console.error(`- TYPE: ${CONFIG.type}`);
        console.error(`- CODE: ${CONFIG.code}`);
        console.error(`- LOGIN_REQUEST_ENDPOINT: ${CONFIG.loginRequestEndpoint}`);
        console.error(`- VERIFY_LOGIN_ENDPOINT: ${CONFIG.verifyLoginEndpoint}`);
        console.error(`- BASE_URL for notifications: ${CONFIG.urlNotifs}`);
        console.error(`- ENV variables available: ${Object.keys(__ENV).join(', ')}`);
      } else {
        console.log(`✅ Token acquired for VU ${__VU}`);
        // Cache the token for this VU
        tokenCache[__VU] = token;
      }
    } else {
      console.log(`🔑 Using environment token for VU ${__VU}`);
      // Cache the token for this VU
      tokenCache[__VU] = token;
    }
  }

  // Skip test if no token was obtained
  if (!token) {
    console.error('❌ Skipping test because no valid token is available');
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
  console.log(`📝 VU ${__VU}: Requesting notifications from ${url}`);
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
