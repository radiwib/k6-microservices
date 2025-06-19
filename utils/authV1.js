import http from 'k6/http';
import { check } from 'k6';
import { CONFIG } from '../config/configEnv.js';
import { post } from './client.js';
import { assertStatus } from './checkers.js';

export function login() {
  const res = post(`${CONFIG.urlUsers}${CONFIG.loginRequestEndpoint}`, {
    phone: CONFIG.phone,
    type: CONFIG.type,
  });
  assertStatus(res);
  return res;
}

export function verifyOTP() {
  const res = post(`${CONFIG.urlUsers}${CONFIG.verifyLoginEndpoint}`, {
    to: CONFIG.phone,
    code: CONFIG.code,
  });
  assertStatus(res, 200);
  const { access_token, refresh_token } = res.json().data;
  return {
    jwtToken: `JWT ${access_token}`,
    accessToken: access_token,
    refreshToken: refresh_token,
  };
}
