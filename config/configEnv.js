export const CONFIG = {
  // Base URLs
  urlUsers: __ENV.USER_URL,
  urlBikes: __ENV.BIKE_URL,
  urlNotifs: __ENV.NOTIF_URL,
  
  //# API Endpoints
  //## Ion-user API Endpoints
  //### Authentication Endpoints
  loginRequestEndpoint: __ENV.LOGIN_REQUEST_ENDPOINT,
  verifyLoginEndpoint: __ENV.VERIFY_LOGIN_ENDPOINT,
  logoutEndpoint: __ENV.LOGOUT_ENDPOINT,

  // Test Configuration
  phone: __ENV.PHONE,
  type: __ENV.TYPE || 'whatsapp',
  code: __ENV.CODE,

  //### Profile Endpoints
  userProfileEndpoint: __ENV.USER_PROFILE_ENDPOINT,
  deleteAccountEndpoint: __ENV.DELETE_ACCOUNT_ENDPOINT,
  verifyDeleteAccountEndpoint: __ENV.VERIFY_DELETE_ACCOUNT_ENDPOINT,
  requestChangeEmailEndpoint: __ENV.REQUEST_CHANGE_EMAIL_ENDPOINT,
  verifyChangeEmailEndpoint: __ENV.VERIFY_CHANGE_EMAIL_ENDPOINT,
  addressEndpoint: __ENV.ADDRESS_ENDPOINT,
  checkReferralEndpoint: __ENV.CHECK_REFERRAL_ENDPOINT,

  //### Geography Endpoints
  countriesEndpoint: __ENV.GEO_COUNTRIES_ENDPOINT,
  provincesEndpoint: __ENV.GEO_PROVINCES_ENDPOINT,
  citiesEndpoint: __ENV.GEO_CITIES_ENDPOINT,

  //### Guest Management Endpoints
  guestsEndpoint: __ENV.GUESTS_ENDPOINT,

  //### Admin Endpoints
  getUsersEndpoint: __ENV.GET_USERS_ENDPOINT,
  summaryUsersEndpoint: __ENV.SUMMARY_USERS_ENDPOINT,

  //## Ion-Bikes Endpoints
  //### Bike Management Endpoints
  listBikesEndpoint: __ENV.LIST_BIKES_ENDPOINT,

  //### Notification Management Endpoints
  listNotificationsEndpoint: __ENV.LIST_NOTIFICATIONS_ENDPOINT,

  //### Health Check Endpoint
  healthEndpoint: __ENV.HEALTH_ENDPOINT,
  
};


