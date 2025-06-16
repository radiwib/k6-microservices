import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 5,
  duration: '10s',
};

export default function () {
  // Get URLs from environment variables or use staging defaults
  const userUrl = __ENV.USER_URL || 'https://ionusers-s.ionmobility.net';
  const bikeUrl = __ENV.BIKE_URL || 'https://ionbikes-s.ionmobility.net';
  const notifUrl = __ENV.NOTIF_URL || 'https://notifications-s.ionmobility.net';
  
  console.log(`✅ Testing staging microservices...`);
  
  // Test Users microservice
  let userRes = http.get(`${userUrl}/health`);
  check(userRes, {
    'Users API - status is 200': (r) => r.status === 200,
    'Users API - response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  // Test Bikes microservice
  let bikeRes = http.get(`${bikeUrl}/health`);
  check(bikeRes, {
    'Bikes API - status is 200': (r) => r.status === 200,
    'Bikes API - response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  // Test Notifications microservice
  let notifRes = http.get(`${notifUrl}/health`);
  check(notifRes, {
    'Notifications API - status is 200': (r) => r.status === 200,
    'Notifications API - response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  console.log(`Users: ${userUrl}, Bikes: ${bikeUrl}, Notifications: ${notifUrl}`);
  sleep(1);
}
