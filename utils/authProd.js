import http from 'k6/http';
import { check } from 'k6';
import { CONFIG } from '../config/configStage.js';

export function loginProd() {
  const res = post(`${CONFIG.urlUsersStage}/api/v2/request-login`, {
    identity: CONFIG.phoneStage,
    type: 'whatsapp',
  });
  assertStatus(res);
  return res;
}

export function verifyOTPProd() {
  const res = post(`${CONFIG.urlUsersStage}/api/v2/verify-login`, {
    identity: CONFIG.phoneStage,
    code: CONFIG.codeStage,
  });
  assertStatus(res, 201);
  const { access_token, refresh_token } = res.json();
  return {
    jwtToken: `JWT ${access_token}`,
    accessToken: access_token,
    refreshToken: refresh_token,
  };
}