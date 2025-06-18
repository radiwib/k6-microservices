import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { CONFIG } from '../../config/configEnv.js';
import { post } from '../../utils/client.js';
import { loginStage, verifyOTPStage } from '../../utils/authStage.js';
import { assertStatus } from '../../utils/checkers.js';

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
    const loginResponse = loginStage();
    
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
      const verifyResponse = verifyOTPStage();
      
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