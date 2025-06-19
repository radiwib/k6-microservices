// config/loadProfiles.js
export const loadProfiles = {
  quickTest: { vus: 5, duration: '10s' },
  smokeTest: { vus: 2, duration: '5s' },
  stressTest: { stages: [ { duration: '1m', target: 20 } ] },
};



