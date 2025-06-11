import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 5,
  duration: '10s',
};

const BASE_URL = __ENV.BASE_URL;
const ENDPOINT = __ENV.ENDPOINT;
const TOKEN = __ENV.ACCESS_TOKEN;

export default function () {
  const url = `${BASE_URL}${ENDPOINT}`;
  const params = {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  const res = http.get(url, params);

  group('Response Validation', function () {
    const response = res.json();
    const requiredFields = ['id', 'user_id', 'bike_id'];
    const otherFields = ['title','description','is_read','created_at','updated_at','notification_type','category','group'];

    if (res.status === 200 && TOKEN) {
      check(res, {
        '(P) Status is 200 or 201': (r) => [200, 201].includes(response.status_code),
        '(P) Response data exists': () => response.data !== undefined,
      });

      if (Array.isArray(response.data)) {
        response.data.forEach((item, index) => {
          requiredFields.forEach((field) => {
            check(item, {
              [`(P) Required field "${field}" exists in item ${index + 1}`]: (obj) => obj[field] !== undefined && obj[field] !== null,
            });
          });

          otherFields.forEach((field) => {
            check(item, {
              [`(P) Optional field "${field}" exists in item ${index + 1}`]: (obj) => obj[field] !== undefined,
            });
          });
        });
      }

    } else if (res.status === 401) {
      check(res, {
        '(N) Unauthorized access - token expired': (r) => r.status === 401,
        '(N) Message is correct': () => response.message === 'You are not authorized',
        '(N) Error key is correct': () => response.error_key === 'ErrorUnauthorized',
      });
    } else {
      check(res, {
        '(N) Error response is 400/404/500': (r) => [400, 404, 500].includes(r.status),
        '(N) Response is not 200': (r) => r.status !== 200,
      });
    }
  });
}