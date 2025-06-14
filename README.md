# k6-microservices

✅ Folder Layout

k6-microservices/
├── config/
│   └── configStage.js
├── data/
│   └── phoneNumbers.json
├── tests/
│   ├── auth/
│   │   ├── loginRequest.stress.js        # Only request-login
│   │   ├── loginVerify.stress.js         # request-login + verify-login
│   ├── user/
│   │   ├── profile.test.js               # profile get/update
│   │   └── referral.test.js              # check-referral, etc.
│   ├── bike/
│   │   └── createBike.test.js
│   ├── notif/
│   │   └── listNotifications.test.js
│   ├── admin/
│   │   └── createUser.test.js
│   └── scenarios/
│       └── smokeSuite.js                 # optional: multi-step 
test
├── utils/
│   ├── auth.js
│   ├── client.js
│   ├── checkers.js
│   └── phone.js
├── k6.config.js                          # stress test stages & thresholds
├── docker-compose.yml
├── run.sh                                # CLI to run any test
├── .gitignore
└── README.md

✅ Structure
🗂 Domain-based folders (auth/, bike/, etc.)	Scalable as endpoints grow
🔁 utils/ for shared logic	Token reuse, cleaner tests
📦 scenarios/ folder	Multi-step chained scenarios
🔧 Central k6.config.js	Reusable config across tests
🧪 Single run.sh	Run any test with one command