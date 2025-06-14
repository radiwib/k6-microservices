import http from 'k6/http';
import { check } from 'k6';
import { options as stressOptions } from '../../k6.config.js';
import { CONFIG } from '../../config/configStage.js';
import { generateSequentialPhone } from '../../utils/phone.js';

export { stressOptions as options };

const headers = { 'Content-Type': 'application/json' };

export default function () {
  const phone = generateSequentialPhone(__VU); // e.g. 6281200000001
  const res = http.post(`${CONFIG.urlUsers}/api/v2/request-login`, JSON.stringify({
    identity: phone,
    type: 'whatsapp',
  }), { headers });

  check(res, {
    '(P) Login request is 200': (r) => r.status === 200,
    '(P) Response time < 500ms': (r) => r.timings.duration < 500,
  });
}
