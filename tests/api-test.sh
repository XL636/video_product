#!/bin/bash

# Phase 1 API Integration Test Script
# Testing: Registration, Login, JWT Token, File Upload, API Health

BASE_URL="http://localhost:8000/api/v1"

echo "========================================"
echo "Phase 1 API Integration Test"
echo "========================================"

# Color output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

# Test helper functions
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}PASS${NC}: $2"
        ((PASS_COUNT++))
    else
        echo -e "${RED}FAIL${NC}: $2"
        ((FAIL_COUNT++))
    fi
}

echo ""
echo "Test 1: Health Check"
response=$(curl -s -w "%{http_code}" -o /tmp/health.json http://localhost:8000/health)
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    health_data=$(cat /tmp/health.json)
    echo "Response: $health_data"
    test_result 0 "Health check returns 200 OK"
else
    test_result 1 "Health check failed with code $http_code"
fi

echo ""
echo "Test 2: API Documentation"
response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:8000/docs)
if [ "$response" = "200" ]; then
    test_result 0 "API docs endpoint is accessible"
else
    test_result 1 "API docs endpoint failed with code $response"
fi

# Generate unique test user
TIMESTAMP=$(date +%s)
TEST_USERNAME="testuser_${TIMESTAMP}"
TEST_EMAIL="test_${TIMESTAMP}@example.com"
TEST_PASSWORD="Test123456!"

echo ""
echo "Test 3: User Registration"
echo "Username: $TEST_USERNAME"
echo "Email: $TEST_EMAIL"

register_response=$(curl -s -w "%{http_code}" -o /tmp/register.json -X POST \
    "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"$TEST_USERNAME\",
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

http_code="${register_response: -3}"
register_data=$(cat /tmp/register.json)
echo "Response ($http_code): $register_data"

if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
    test_result 0 "User registration successful"
else
    test_result 1 "User registration failed with code $http_code"
fi

echo ""
echo "Test 4: User Login"
login_response=$(curl -s -w "%{http_code}" -o /tmp/login.json -X POST \
    "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

http_code="${login_response: -3}"
login_data=$(cat /tmp/login.json)
echo "Response ($http_code): $login_data"

if [ "$http_code" = "200" ]; then
    test_result 0 "User login successful"
    # Extract access token
    ACCESS_TOKEN=$(echo $login_data | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')
    echo "JWT Token: ${ACCESS_TOKEN:0:50}..."
else
    test_result 1 "User login failed with code $http_code"
    ACCESS_TOKEN=""
fi

echo ""
echo "Test 5: Authenticated User Profile Request"
if [ -n "$ACCESS_TOKEN" ]; then
    profile_response=$(curl -s -w "%{http_code}" -o /tmp/profile.json \
        "$BASE_URL/auth/me" \
        -H "Authorization: Bearer $ACCESS_TOKEN")

    http_code="${profile_response: -3}"
    profile_data=$(cat /tmp/profile.json)
    echo "Response ($http_code): $profile_data"

    if [ "$http_code" = "200" ]; then
        test_result 0 "User profile retrieval successful"
    else
        test_result 1 "User profile retrieval failed with code $http_code"
    fi
else
    test_result 1 "Cannot test profile - no access token available"
fi

echo ""
echo "Test 6: File Upload Presigned URL Generation"
if [ -n "$ACCESS_TOKEN" ]; then
    upload_response=$(curl -s -w "%{http_code}" -o /tmp/upload.json -X POST \
        "$BASE_URL/upload/presigned" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "filename": "test-image.png",
            "content_type": "image/png"
        }')

    http_code="${upload_response: -3}"
    upload_data=$(cat /tmp/upload.json)
    echo "Response ($http_code): $upload_data"

    if [ "$http_code" = "200" ]; then
        test_result 0 "File upload presigned URL generation successful"
    else
        test_result 1 "File upload presigned URL generation failed with code $http_code"
    fi
else
    test_result 1 "Cannot test upload - no access token available"
fi

echo ""
echo "Test 7: Settings API Key Storage"
if [ -n "$ACCESS_TOKEN" ]; then
    settings_response=$(curl -s -w "%{http_code}" -o /tmp/settings.json -X POST \
        "$BASE_URL/settings/api-keys" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "provider": "kling",
            "api_key": "test_key_12345"
        }')

    http_code="${settings_response: -3}"
    settings_data=$(cat /tmp/settings.json)
    echo "Response ($http_code): $settings_data"

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        test_result 0 "API key storage successful"
    else
        test_result 1 "API key storage failed with code $http_code"
    fi
else
    test_result 1 "Cannot test settings - no access token available"
fi

echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "Passed: ${GREEN}$PASS_COUNT${NC}"
echo -e "Failed: ${RED}$FAIL_COUNT${NC}"
echo "Total: $((PASS_COUNT + FAIL_COUNT))"
echo "========================================"

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
