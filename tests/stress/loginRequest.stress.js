import http from 'k6/http';
import { check, sleep } from 'k6';
import { options as stressOptions } from '../../k6.config.js';
import { CONFIG } from '../../config/configEnv.js';
// import { generateSequentialPhone } from '../../utils/phone.js'; // ❌ Commented out - no longer using generated phone numbers

export { stressOptions as options };

const headers = { 'Content-Type': 'application/json' };

export default function () {
  // ✅ Use only whitelisted phone number from environment configuration
  // This ensures we only test with approved test phone numbers (PHONE=6281122334455)
  const phone = CONFIG.phone;
  
  // Validate that phone number is configured
  if (!phone) {
    throw new Error('No phone number configured. Check PHONE variable in environment file.');
  }
  
  // 📊 Track iteration count for this VU
  const currentIteration = __ITER + 1;
  
  // 🔍 Enhanced debug logging with iteration tracking
  console.log(`[DEBUG] VU ${__VU} - Iteration ${currentIteration}: Using whitelisted phone: ${phone}`);
  console.log(`[DEBUG] VU ${__VU} - Iteration ${currentIteration}: Target URL: ${CONFIG.urlUsers}`);
  console.log(`[DEBUG] VU ${__VU} - Iteration ${currentIteration}: Environment: ${__ENV.ENVIRONMENT || 'not specified'}`);

  // 📱 Send login request using whitelisted phone from environment
  const res = http.post(`${CONFIG.urlUsers}${CONFIG.loginRequestEndpoint}`, JSON.stringify({
    identity: phone, // Uses PHONE=6281122334455 from .env.stage/.env.prod
    type: CONFIG.type || 'whatsapp', // Uses TYPE from environment
  }), { headers });

  // ✅ Validate response with phone number context
  const checkResults = check(res, {
    [`(P) Login request is 200 [phone: ${phone}]`]: (r) => r.status === 200,
    [`(P) Response time < 500ms [phone: ${phone}]`]: (r) => r.timings.duration < 500,
    [`(P) Response has expected content [phone: ${phone}]`]: (r) => {
      // Basic validation that response is not an error
      return r.status !== 500 && r.status !== 404;
    },
  });
  
  // 📊 Log iteration results with phone number
  console.log(`[INFO] VU ${__VU} - Iteration ${currentIteration}: Phone ${phone} - Status: ${res.status} - Duration: ${res.timings.duration.toFixed(2)}ms`);
  
  // 📊 Additional response logging for debugging
  if (res.status !== 200) {
    console.warn(`[WARN] VU ${__VU} - Iteration ${currentIteration}: Login request failed with status ${res.status} for phone ${phone}`);
    console.warn(`[WARN] Response body: ${res.body}`);
  } else {
    console.log(`[SUCCESS] VU ${__VU} - Iteration ${currentIteration}: Phone ${phone} login request successful`);
  }
  
  // ⏱️ Small delay to prevent overwhelming the service with the same phone number
  sleep(0.1);
}
