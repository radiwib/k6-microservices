#!/bin/bash

# Default env file
ENV_FILE=".env"

# If the user passed an environment name, switch to corresponding file
if [ "$1" != "" ]; then
  ENV_FILE=".env.$1"
fi

# Check if the environment file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Environment file '$ENV_FILE' not found!"
  exit 1
fi

# Run k6 using dotenv-cli with the selected env file
echo "✅ Running k6 with env file: $ENV_FILE"
dotenv -e "$ENV_FILE" -- k6 run scripts/k6-env-script.js

# Docker run
TEST_PATH=$1
docker run --rm -i \
  -v "$(pwd)":/scripts \
  -w /scripts \
  grafana/k6 run "$TEST_PATH"
