import http from 'k6/http';
import { check } from 'k6';
import { CONFIG } from '../config/configEnv.js';
import { post } from './client.js';
import { assertStatus } from './checkers.js';

export function loginStage() {
  const res = post(`${CONFIG.urlUsers}${CONFIG.loginRequestEndpoint}`, {
    identity: CONFIG.phone,
    type: CONFIG.type,
  });
  assertStatus(res);
  return res;
}

export function verifyOTPStage() {
  const res = post(`${CONFIG.urlUsers}${CONFIG.verifyLoginEndpoint}`, {
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
