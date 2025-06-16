import http from 'k6/http';
import { check, sleep } from 'k6';
import { CONFIG } from '../config/configEnv.js';

export let options = {
  vus: 5,
  duration: '10s',
};

export default function () {
  console.log(`✅ Testing microservices with environment configuration...`);
  
  // Test Users microservice health endpoint
  let userRes = http.get(`${CONFIG.urlUsers}${CONFIG.healthEndpoint}`);
  check(userRes, {
    'Users API - status is 200': (r) => r.status === 200,
    'Users API - response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  // Test Bikes microservice health endpoint
  let bikeRes = http.get(`${CONFIG.urlBikes}${CONFIG.healthEndpoint}`);
  check(bikeRes, {
    'Bikes API - status is 200': (r) => r.status === 200,
    'Bikes API - response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  // Test Notifications microservice health endpoint
  let notifRes = http.get(`${CONFIG.urlNotifs}${CONFIG.healthEndpoint}`);
  check(notifRes, {
    'Notifications API - status is 200': (r) => r.status === 200,
    'Notifications API - response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  console.log(`Users: ${CONFIG.urlUsers}, Bikes: ${CONFIG.urlBikes}, Notifications: ${CONFIG.urlNotifs}`);
  sleep(1);
}
