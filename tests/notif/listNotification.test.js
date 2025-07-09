import { check, sleep, group } from 'k6';
import { CONFIG } from '../../config/configEnv.js';
import { loadProfiles } from  '../../config/configVu.js';
import { handleSummary } from '../../utils/handleSummary.js';
import { getNotifications } from '../../utils/getNotifications.js';
import { initEndpointTracker, trackApiEndpoint } from '../../utils/endpointTracker.js';

//Function to set up the load profile for this test
export let options = loadProfiles.quickTest;

// Initialize endpoint tracking
initEndpointTracker('List Notifications Test', 'test');

// Log API configuration for debugging
console.log('📋 API Configuration:');
console.log(`- NOTIF_URL from ENV: ${__ENV.NOTIF_URL}`);
console.log(`- BASE_URL (CONFIG.urlNotifs): ${CONFIG.urlNotifs}`);
console.log(`- ENDPOINT: ${CONFIG.listNotificationsEndpoint}`);

export default function () {
  console.log(`📝 VU ${__VU}: Starting notification list test...`);
  
  // Use the utility function to get notifications
  const result = getNotifications();
  
  // Check if the request was successful
  if (!result) {
    console.error('❌ Failed to get notifications - null result');
    return;
  }
  
  // Extract response for validation
  const res = result.response;

  group('Response Validation', function () {
    // Use the result data if successful, otherwise fall back to response parsing
    let responseData;
    const requiredFields = ['id', 'user_id', 'bike_id'];
    const otherFields = ['title','description','is_read','created_at','updated_at','notification_type','category','group'];

    if (result.success && result.data) {
      responseData = { data: result.data };
      
      check(res, {
        '(P) Status is 200': (r) => r.status === 200,
        '(P) Response data exists': () => result.data !== undefined,
        '(P) Data is array': () => Array.isArray(result.data),
      });

      if (Array.isArray(result.data)) {
        result.data.forEach((item, index) => {
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

    } else if (res && res.status === 401) {
      responseData = res.json();
      check(res, {
        '(N) Unauthorized access - token expired': (r) => r.status === 401,
        '(N) Message is correct': () => responseData.message === 'You are not authorized',
        '(N) Error key is correct': () => responseData.error_key === 'ErrorUnauthorized',
      });
    } else {
      // Handle cases where response might be null (e.g., authentication failure)
      if (res) {
        check(res, {
          '(N) Error response is 400/404/500': (r) => [400, 404, 500].includes(r.status),
          '(N) Response is not 200': (r) => r.status !== 200,
        });
      }
      
      // Always check if request failed
      check(result, {
        '(N) Request failed': (r) => !r.success,
        '(N) Error message exists': (r) => r.error !== undefined,
      });
    }
  });
  
  // Add a small sleep to avoid overwhelming the API
  sleep(0.5);
}

// Execute handleSummary function for test summary
export { handleSummary };
