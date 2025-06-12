import http from 'k6/http';
import { check } from 'k6';
import { USER_URL, ENDPOINTS, USER_CREDENTIALS } from './configStage.js';

export function loginAndGetToken() {
  const loginRes = http.post(ENDPOINTS.login, JSON.stringify(USER_CREDENTIALS), {
    headers: { 
        'Content-Type': 'application/json', 
        'Content-Length': JSON.stringify(USER_CREDENTIALS).length,
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'k6/0.38.0',
        'Accept': 'application/json, text/plain, */*',
        'Connection': 'keep-alive',
    },
  });

  check(loginRes, {
    '(P) Login response time < 500ms': (r) => r.timings.duration < 500,
    '(P) Login status is 200 or 201': (r) => [200, 201].includes(r.status),
  });

  if (![200, 201].includes(loginRes.status)) {
    console.error(`❌ Login failed with status: ${loginRes.status}`);
    return null;
  }

  const body = loginRes.json();

  check(body, {
    '(P) access_token exists': (b) => !!b.access_token,
    '(P) refresh_token exists': (b) => !!b.refresh_token,
    '(P) access_token length = 266': (b) => b.access_token.length === 266,
    '(P) refresh_token length = 266': (b) => b.refresh_token.length === 266,
  });

  const access_token_mf = body.access_token;
  const refresh_token_mf = body.refresh_token;
  const jwt_token = `JWT ${access_token_mf}`;

  console.log(`✅ JWT token stored: ${jwt_token.substring(0, 30)}...`);

  return {
    access_token_mf,
    refresh_token_mf,
    jwt_token,
  };
}
