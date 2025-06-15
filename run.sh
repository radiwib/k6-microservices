#!/bin/bash

# Usage: ./run.sh [env] [testPath]
ENV_NAME=$1
TEST_FILE=$2

# Defaults
ENV_FILE=".env"
SCRIPT_PATH="tests/auth/loginRequest.stress.js"

if [ "$ENV_NAME" != "" ]; then ENV_FILE=".env.$ENV_NAME"; fi
if [ "$TEST_FILE" != "" ]; then SCRIPT_PATH="$TEST_FILE"; fi
if [ ! -f "$ENV_FILE" ]; then echo "❌ Env file '$ENV_FILE' not found!"; exit 1; fi

# Extract clean file name from path
BASENAME=$(basename "$SCRIPT_PATH")           # loginRequest.stress.js
NAME_WITHOUT_EXT="${BASENAME%.*}"             # loginRequest.stress
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create results folder if not exists
mkdir -p results
SUMMARY_FILE="results/${NAME_WITHOUT_EXT}_${TIMESTAMP}.json"

echo "✅ Running $SCRIPT_PATH with $ENV_FILE"
echo "📝 Summary will be saved to $SUMMARY_FILE"

# Run K6 with dotenv and export summary
npx dotenv -e "$ENV_FILE" -- k6 run "$SCRIPT_PATH" --summary-export="$SUMMARY_FILE"
if [ $? -eq 0 ]; then
    echo "✅ Test completed successfully!"
else
    echo "❌ Test failed!"
fi