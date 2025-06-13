export const CONFIG_STAGE = {
  urlBikesStage: `${__ENV.BIKE_URL}`,
  urlUsersStage: `${__ENV.USER_URL}`,
  urlNotificationsStage: `${__ENV.NOTIFICATION_URL}`,
  phone: `${__ENV.PHONE}`,
  type: `${__ENV.TYPE || 'whatsapp'}`,
  code: `${__ENV.CODE}`,
};

export const CONFIG_PROD = {
  urlBikes: `${__ENV.BIKE_URL}`,
  urlUsers: `${__ENV.USER_URL}`,
  urlNotifications: `${__ENV.NOTIFICATION_URL}`,
  phone: `${__ENV.PHONE}`,
  type: `${__ENV.TYPE || 'whatsapp'}`,
  code: `${__ENV.CODE}`,
};
