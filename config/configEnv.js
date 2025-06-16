export const CONFIG = {
  // Base URLs
  urlUsers: __ENV.USER_URL,
  urlBikes: __ENV.BIKE_URL,
  urlNotifs: __ENV.NOTIF_URL,
  
  // API Endpoints
  loginRequestEndpoint: __ENV.LOGIN_REQUEST_ENDPOINT,
  verifyLoginEndpoint: __ENV.VERIFY_LOGIN_ENDPOINT,
  logoutEndpoint: __ENV.LOGOUT_ENDPOINT,
  listNotificationsEndpoint: __ENV.LIST_NOTIFICATIONS_ENDPOINT,
  listBikesEndpoint: __ENV.LIST_BIKES_ENDPOINT,
  userProfileEndpoint: __ENV.USER_PROFILE_ENDPOINT,
  healthEndpoint: __ENV.HEALTH_ENDPOINT,
  
  // Test Configuration
  phone: __ENV.PHONE,
  type: __ENV.TYPE || 'whatsapp',
  code: __ENV.CODE,
};


