import http from 'k6/http';
import { check } from 'k6';
import { USER_URL, ENDPOINTS, LOGIN, USER_VERIFY } from './configStage.js';

export function loginAndGetToken() {

    const payload = JSON.stringify(LOGIN);
    const loginRes = http.post(ENDPOINTS.login, payload, {
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length,
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

}

export function verifyLogin() {
    const payload = JSON.stringify(VERIFY);
    const verifyRes = http.post(ENDPOINTS.verifyLogin, payload, {
        headers: {
            'Content-Type': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br',
            'User-Agent': 'k6/0.38.0',
            'Accept': 'application/json, text/plain, */*',
            'Connection': 'keep-alive',
        },
    });

    check(verifyRes, {
        '(P) Verify login response time < 500ms': (r) => r.timings.duration < 500,
        '(P) Verify login status is 200 or 201': (r) => [200, 201].includes(r.status),
    });

    if (![200, 201].includes(verifyRes.status)) {
        console.error(`❌ Verify login failed with status: ${verifyRes.status}`);
        return null;
    }

    const body = verifyRes.json();

    check(body, {
        '(P) access_token exists': (b) => !!b.access_token,
        '(P) refresh_token exists': (b) => !!b.refresh_token,
        '(P) access_token length = 266': (b) => b.access_token.length === 266,
        '(P) refresh_token length = 266': (b) => b.refresh_token.length === 266,
    });

    console.log(`✅ User verified with ID: ${body.data.id}`);

    const access_token = body.access_token;
    const refresh_token = body.refresh_token;
    const jwt_token = `JWT ${access_token_mf}`;

    console.log(`✅ JWT token stored: ${jwt_token.substring(0, 30)}...`);

    return {
        access_token,
        refresh_token,
        jwt_token,
    };
}