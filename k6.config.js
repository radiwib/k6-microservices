export const options = {
  stages: [
    { duration: '30s', target: 20 },   // ramp up to 20 VUs
    { duration: '1m', target: 20 },    // hold at 20 VUs
    { duration: '30s', target: 40 },   // spike to 40 VUs
    { duration: '1m', target: 40 },    // hold at 40 VUs
    { duration: '30s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(50)<500'], // 50% requests should be < 500ms
    http_req_failed: ['rate<0.01'],   // < 1% requests should fail
  },
};