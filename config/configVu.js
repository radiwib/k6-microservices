// config/loadProfiles.js
export const loadProfiles = {
    quickTest: { vus: 5, duration: '10s' },
    smokeTest: { vus: 1, duration: '5s' },
    stressTest: {
        stages: [{ duration: '30s', target: 20 },   // ramp up to 20 VUs
        { duration: '1m', target: 20 },    // hold at 20 VUs
        { duration: '30s', target: 40 },   // spike to 40 VUs
        { duration: '1m', target: 40 },    // hold at 40 VUs
        { duration: '30s', target: 100 },   // spike to 100 VUs
        { duration: '2m', target: 100 },    // hold at 100 VUs
        { duration: '30s', target: 0 },    // ramp down
        ],
        thresholds: {
            http_req_duration: ['p(50)<500'], // 50% requests should be < 500ms
            http_req_failed: ['rate<0.01'],   // < 1% requests should fail
        },
    },
    spikeTest: {
        stages: [
            { duration: '2m', target: 2000 }, // fast ramp-up to a high point
            // No plateau
            { duration: '1m', target: 0 }, // quick ramp-down to 0 users
        ],
    }, // 1000 VUs for 30 seconds

};



