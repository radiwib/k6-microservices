// config/loadProfiles.js
export const loadProfiles = {
    quickTest: { vus: 5, duration: '10s' },
    smokeTest: { vus: 1, duration: '5s' },
    stressTest: {
        stages: [{ duration: '20s', target: 100 },   // stage up to 100 VUs
        { duration: '20s', target: 100 },    // stage up to 100 VUs
        { duration: '20s', target: 100 },   // stage up to 100 VUs
        { duration: '20s', target: 100 },    // stage up to 100 VUs
        { duration: '20s', target: 200 },   // stage up to 200 VUs
        ],
        thresholds: {
            http_req_duration: ['p(50)<500'], // 70% requests should be < 500ms
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



