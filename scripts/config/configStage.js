export const ENDPOINTS = {
  getBikes: `${__ENV.BIKE_URL}/api/v2/bikes`,
  getUser: `${__ENV.USER_URL}/api/v2/users`,
  getNotifications: `${__ENV.NOTIFICATION_URL}/api/v2/notifications`,
  getUserById: (id) => `${__ENV.USER_URL}/api/v2/users/${id}`,
  getBikeById: (bike_id) => `${__ENV.BIKE_URL}/api/v2/bikes/${bike_id}`,
  login: `${__ENV.USER_URL}/api/v2/request-login`,
  verifyLogin: `${__ENV.USER_URL}/api/v2/verify-login`,
};
export const ACCESS_TOKEN = __ENV.ACCESS_TOKEN
export const LOGIN = {
  identity: __ENV.PHONE || '6281122334455',
  type: __ENV.TYPE || 'whatsapp',
};
export const VERIFY = {
  code: __ENV.CODE || '123456',
};
