import http from 'k6/http';
import { check } from 'k6';
import { CONFIG } from '../config/configEnv.js';
import { post } from './client.js';
import { assertStatus } from './checkers.js';

export function loginProd() {
  const res = post(`${CONFIG.urlUsers}/api/v2/request-login`, {
    identity: CONFIG.phone,
    type: CONFIG.type,
  });
  assertStatus(res);
  return res;
}

export function verifyOTPProd() {
  const res = post(`${CONFIG.urlUsers}/api/v2/verify-login`, {
    identity: CONFIG.phone,
    code: CONFIG.code,
  });
  assertStatus(res, 201);
  const { access_token, refresh_token } = res.json();
  return {
    jwtToken: `JWT ${access_token}`,
    accessToken: access_token,
    refreshToken: refresh_token,
  };
}
