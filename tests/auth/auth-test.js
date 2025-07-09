import { check, sleep } from 'k6';
import { CONFIG } from '../../config/configEnv.js';
import { loginDynamic } from '../../utils/authDynamic.js';
import { initProgress, updateProgress, progressCheck, showCompletion } from '../../utils/progressBar.js';

export let options = {
  vus: 1,
  iterations: 1,
};

// Initialize progress bar
const progressBar = initProgress('Authentication Test', [{ duration: '30s', target: 1 }]);

export default function () {
  // Update progress at the start of each iteration
  updateProgress();
  
  console.log('🔐 Testing authentication utilities...');
  console.log(`Config loaded - User URL: ${CONFIG.urlUsers}`);
  console.log(`Phone: ${CONFIG.phone}, Type: ${CONFIG.type}`);
  
  try {
    // Test login request (this will send OTP)
    console.log('📱 Attempting login request...');
    const loginRes = loginDynamic();
    console.log(`Login response status: ${loginRes.status}`);
    
    // Use progressCheck instead of regular check
    progressCheck(loginRes, {
      'login request successful': (r) => r.status === 200,
      'response time < 5000ms': (r) => r.timings.duration < 5000,
    });
    
    if (loginRes.status === 200) {
      console.log('✅ Login request successful - OTP should be sent');
    } else {
      console.log(`❌ Login request failed with status: ${loginRes.status}`);
      console.log(`Response: ${loginRes.body}`);
    }
  } catch (error) {
    console.log(`❌ Authentication test failed: ${error}`);
  }
  
  sleep(1);
}

// Show completion summary at the end
export function teardown() {
  showCompletion();
}

