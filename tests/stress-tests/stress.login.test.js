import { SharedArray } from 'k6/data';
import http from 'k6/http';
import { check } from 'k6';
import { options as stressOptions } from '../k6.config.js';
import { CONFIG } from '../config/configStage.js';

export { stressOptions as options };

/* // 🗂 Load phone numbers from JSON file once at init time
const PHONE_NUMBERS = new SharedArray('phoneNumbers', () =>
  JSON.parse(open('../data/phoneNumbers.json'))
); 
 */

/**
 * 🔢 Generate a deterministic phone number per VU
 * Format: 6281200000000 + __VU
 * Example: VU 1 -> 6281200000001
 */
function generatePhoneNumber(vuId) {
    const base = 6281200000000;
    return String(base + vuId);
}

const headers = { 'Content-Type': 'application/json' };

export default function () {
    const phone = generatePhoneNumber(__VU);
    //   const otp = CONFIG.OTP;

    const loginRes = http.post(`${CONFIG.USER_URL}/api/v2/request-login`, JSON.stringify({
        identity: phone,
        type: 'whatsapp',
    }), { headers });

    check(loginRes, {
        '(P) Login status is 200': (r) => r.status === 200,
    });

    /* const verifyRes = http.post(`${CONFIG.USER_URL}/api/v2/verify-login`, JSON.stringify({
      identity: phone,
      code: otp,
    }), { headers });
  
    check(verifyRes, {
      '(P) OTP status is 201': (r) => r.status === 201,
      '(P) Token present': (r) => r.json('access_token') !== undefined,
    }); */

    // log phone/token
    console.log(`VU${__VU} requested login for phone ${phone}`);
}
