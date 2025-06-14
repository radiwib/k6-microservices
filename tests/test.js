import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 5,
  duration: '10s',
};

export default function () {
  let res = http.get('https://test-api.k6.io/');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}

export default function () {
  console.log("✅ Hello from K6 inside Docker!");
}
