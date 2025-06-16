import http from 'k6/http';
import { check, sleep } from 'k6';
import { CONFIG } from '../../config/configEnv.js';
import { loginStage } from '../../utils/authStage.js';
import { assertStatus } from '../../utils/checkers.js';

export let options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  console.log('🔐 Testing authentication utilities...');
  console.log(`Config loaded - User URL: ${CONFIG.urlUsers}`);
  console.log(`Phone: ${CONFIG.phone}, Type: ${CONFIG.type}`);
  
  try {
    // Test login request (this will send OTP)
    console.log('📱 Attempting login request...');
    const loginRes = loginStage();
    console.log(`Login response status: ${loginRes.status}`);
    
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

