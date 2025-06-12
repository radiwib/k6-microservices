export const USER_URL = `https://ionuser-s.${__ENV.BASE_URL}`;
export const BIKE_URL = `https://ionbikes-s.${__ENV.BASE_URL}`;
export const NOTIFICATION_URL = `https://notifications-s.${__ENV.BASE_URL}`;
export const ENDPOINTS = {
  getBikes: `${BIKE_URL}/api/v2/bikes`,
  getUser: `${USER_URL}/api/v2/users`,
  getNotifications: `${NOTIFICATION_URL}/api/v2/notifications`,
  getUserById: (id) => `${USER_URL}/api/v2/users/${id}`,
  getBikeById: (bike_id) => `${BIKE_URL}/api/v2/bikes/${bike_id}`,
  login: `${USER_URL}/api/v2/request-login`,
  verifyLogin: `${USER_URL}/api/v2/verify-login`,
};
export const ACCESS_TOKEN = __ENV.ACCESS_TOKEN
export const USER_CREDENTIALS = {
  username: __ENV.PHONE || '6281122334455',
  password: __ENV.TYPE || 'whatsapp',
};
export const USER_VERIFY = {
  code: __ENV.CODE || '123456',
};
