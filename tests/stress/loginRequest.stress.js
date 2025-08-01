import { check, sleep } from 'k6';
import { CONFIG } from '../../config/configEnv.js';
import { handleSummary } from '../../utils/handleSummary.js';
import { loadProfiles } from '../../config/configVu.js';
import { 
    loginDynamic, 
    verifyOTPDynamic, 
    getAuthVersionForEnvironment, 
    getToken 
} from '../../utils/authDynamic.js';
import { initEndpointTracker, trackAuthEndpoint } from '../../utils/endpointTracker.js';
import { initProgress, updateProgress, progressCheck, showCompletion } from '../../utils/progressBar.js';

//export { stressOptions as options };
export let options = loadProfiles.stressTest;

// Initialize endpoint tracking for stress test
initEndpointTracker('Login Request Stress Test', 'stress');

// Initialize progress bar with stress test stages
const progressBar = initProgress('Login Request Stress Test', loadProfiles.stressTest.stages || []);

// Log test configuration
console.log('📋 Stress Test Configuration:');
console.log(`- Environment: ${__ENV.ENVIRONMENT || 'not specified'}`);
console.log(`- Auth Version: ${getAuthVersionForEnvironment()}`);
console.log(`- Phone: ${CONFIG.phone}`);
console.log(`- Type: ${CONFIG.type}`);
console.log(`- User URL: ${CONFIG.urlUsers}`);
console.log(`- Login Endpoint: ${CONFIG.loginRequestEndpoint}`);

export default function () {
  // Update progress at the start of each iteration
  updateProgress();
  
  // Validate that required configuration is available
  if (!CONFIG.phone) {
    throw new Error('No phone number configured. Check PHONE variable in environment file.');
  }
  
  if (!CONFIG.urlUsers || !CONFIG.loginRequestEndpoint) {
    throw new Error('Missing URL configuration. Check USER_URL and LOGIN_REQUEST_ENDPOINT.');
  }
  
  // 📊 Track iteration count for this VU
  const currentIteration = __ITER + 1;
  
  // 🔍 Enhanced debug logging with iteration tracking
  console.log(`[DEBUG] VU ${__VU} - Iteration ${currentIteration}: Using phone: ${CONFIG.phone}`);
  console.log(`[DEBUG] VU ${__VU} - Iteration ${currentIteration}: Environment: ${__ENV.ENVIRONMENT || 'default'}`);

  // 📱 Use authDynamic utility for login request
  const startTime = Date.now();
  
  try {
    const loginResponse = loginDynamic();
    const duration = Date.now() - startTime;
    
    // Track the login endpoint
    if (loginResponse) {
      trackAuthEndpoint(CONFIG.urlUsers, CONFIG.loginRequestEndpoint, 'Login Request (Stress)', loginResponse.status);
    }
    
    // ✅ Validate response using progress-aware check
    const checkResults = progressCheck(loginResponse, {
      [`(P) Login request is 200 [phone: ${CONFIG.phone}]`]: (r) => r && r.status === 200,
      [`(P) Response time < 500ms [phone: ${CONFIG.phone}]`]: () => duration < 500,
      [`(P) Response exists [phone: ${CONFIG.phone}]`]: (r) => r !== null && r !== undefined,
      [`(P) Response has valid status [phone: ${CONFIG.phone}]`]: (r) => r && r.status && r.status !== 500 && r.status !== 404,
    });
    
    // 📊 Log iteration results
    const status = loginResponse ? loginResponse.status : 'unknown';
    console.log(`[INFO] VU ${__VU} - Iteration ${currentIteration}: Phone ${CONFIG.phone} - Status: ${status} - Duration: ${duration}ms`);
    
    // 📊 Additional response logging for debugging
    if (!loginResponse || loginResponse.status !== 200) {
      console.warn(`[WARN] VU ${__VU} - Iteration ${currentIteration}: Login request failed with status ${status} for phone ${CONFIG.phone}`);
      if (loginResponse && loginResponse.body) {
        console.warn(`[WARN] Response body: ${typeof loginResponse.body === 'string' ? loginResponse.body : JSON.stringify(loginResponse.body)}`);
      }
    } else {
      console.log(`[SUCCESS] VU ${__VU} - Iteration ${currentIteration}: Phone ${CONFIG.phone} login request successful`);
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Handle errors from authDynamic utility
    console.error(`[ERROR] VU ${__VU} - Iteration ${currentIteration}: Login request failed for phone ${CONFIG.phone}`);
    console.error(`[ERROR] Error: ${error.message || error}`);
    console.error(`[ERROR] Duration: ${duration}ms`);
    
    // Fail checks for error cases using progress-aware check
    progressCheck(false, {
      [`(N) Login request failed with error [phone: ${CONFIG.phone}]`]: () => false,
      [`(N) Error occurred during login [phone: ${CONFIG.phone}]`]: () => false,
    });
  }
  
  // ⏱️ Small delay to prevent overwhelming the service
  sleep(0.1);
}

// Show completion summary at the end
export function teardown() {
  showCompletion();
}

// Execute handleSummary function for test summary
export { handleSummary };
