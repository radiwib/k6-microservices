import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { CONFIG } from '../../config/configEnv.js';
import { getToken} from '../../utils/authDynamic.js';
import { assertStatus } from '../../utils/checkers.js';
import { getNotificationId } from '../../utils/getNotificationId.js';
import { loadProfiles } from  '../../config/configVu.js';
import { handleSummary } from '../../utils/handleSummary.js';


// Function to set up the load profile for this test
export let options = loadProfiles.quickTest;

// Always use CONFIG.urlNotifs to ensure proper URL with protocol
const BASE_URL = CONFIG.urlNotifs;
const ENDPOINT = CONFIG.updateNotificationEndpoint;

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
      console.error(`- BASE_URL for notifications: ${CONFIG.urlNotifs}`);
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

  // Get a notification ID to update
  const notificationId = getNotificationId();

  if (!notificationId) {
    console.error('❌ No notification ID available to update');
    return;
  }

  // Prepare the request URL and headers
  const url = `${BASE_URL}${ENDPOINT}/${notificationId}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Prepare the payload with updated data (extensible for more fields)
  const updatePayload = {
    is_read: true, // Example field to update
    // Add more fields here as needed for broader test coverage
    // e.g., title: "Updated Title", message: "Updated message"
  };
  const body = JSON.stringify(updatePayload);

  // Make the PATCH request to update the notification
  const response = http.patch(url, body, { headers });

  // Assert the response status code
  assertStatus(response, [200, 20]);

  // Log the response for debugging
  console.log(`Response status: ${response.status}`);
  
  // Optional sleep to simulate user think time
  sleep(1);
}

// Execute handleSummary function for test summary
export { handleSummary };

