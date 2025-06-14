#!/bin/bash

# Usage: ./run.sh [env] [testFile]
# Example: ./run.sh stage tests/auth/loginRequest.stress.js

ENV_NAME=$1
TEST_FILE=$2

# Set defaults
ENV_FILE=".env"
SCRIPT_PATH="tests/auth/loginRequest.stress.js"

# If an env name is passed, change to matching .env file
if [ "$ENV_NAME" != "" ]; then
  ENV_FILE=".env.$ENV_NAME"
fi

# If a test file is passed, use it
if [ "$TEST_FILE" != "" ]; then
  SCRIPT_PATH=$TEST_FILE
fi

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Environment file '$ENV_FILE' not found!"
  exit 1
fi

echo "✅ Running K6 with:"
echo "   ▶ Env File: $ENV_FILE"
echo "   ▶ Test File: $SCRIPT_PATH"
# Run the K6 test using Docker
docker run --rm -i \
  -v "${PWD//\\//}":/scripts \
  -w /scripts \
  --env-file "$ENV_FILE" \
  grafana/k6 run "$SCRIPT_PATH"
