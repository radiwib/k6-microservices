export const CONFIG = {
  urlBikes: `${__ENV.BIKE_URL}`,
  urlUsers: `${__ENV.USER_URL}`,
  urlNotifications: `${__ENV.NOTIFICATION_URL}`,
  phone: `${__ENV.PHONE}`,
  type: `${__ENV.TYPE || 'whatsapp'}`,
  code: `${__ENV.CODE}`,
};
export const ACCESS_TOKEN = __ENV.ACCESS_TOKEN
