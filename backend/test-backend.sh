#!/bin/bash

# CheckInBuddy Backend Testing Script
# This script tests the backend API endpoints and validates functionality

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000"
TIMEOUT=10

echo -e "${BLUE}🚀 CheckInBuddy Backend Testing Suite${NC}"
echo "=================================================="

# Function to make HTTP requests
make_request() {
    local method=$1
    local endpoint=$2
    local headers=$3
    local data=$4
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
             -H "Content-Type: application/json" \
             $headers \
             -d "$data" \
             --max-time $TIMEOUT \
             "$BASE_URL$endpoint"
    else
        curl -s -X "$method" \
             $headers \
             --max-time $TIMEOUT \
             "$BASE_URL$endpoint"
    fi
}

# Function to check if service is running
check_service() {
    echo -e "${YELLOW}🔍 Checking if backend is running...${NC}"
    
    if make_request "GET" "/health" "" "" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Backend is not running or not accessible${NC}"
        echo -e "${YELLOW}💡 Try running: npm run start:dev${NC}"
        return 1
    fi
}

# Function to test health endpoints
test_health() {
    echo -e "\n${YELLOW}🏥 Testing Health Endpoints${NC}"
    
    # Basic health check
    echo -n "Health check: "
    response=$(make_request "GET" "/health" "" "")
    if echo "$response" | grep -q '"status":"ok"'; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "Response: $response"
    fi
    
    # Database health check
    echo -n "Database health: "
    response=$(make_request "GET" "/health/db" "" "")
    if echo "$response" | grep -q '"database":"connected"'; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${YELLOW}⚠️  WARNING${NC} (Database might not be configured)"
        echo "Response: $response"
    fi
}

# Function to test authentication (requires Firebase token)
test_auth() {
    echo -e "\n${YELLOW}🔐 Testing Authentication${NC}"
    
    if [ -z "$FIREBASE_TOKEN" ]; then
        echo -e "${YELLOW}⚠️  Skipping auth tests (FIREBASE_TOKEN not provided)${NC}"
        echo -e "${BLUE}💡 Set FIREBASE_TOKEN environment variable to test authentication${NC}"
        return
    fi
    
    echo -n "Firebase login: "
    auth_data='{
        "idToken": "'$FIREBASE_TOKEN'",
        "name": "Test User",
        "phone": "+390123456789"
    }'
    
    response=$(make_request "POST" "/auth/login" "" "$auth_data")
    if echo "$response" | grep -q '"accessToken"'; then
        echo -e "${GREEN}✅ PASS${NC}"
        JWT_TOKEN=$(echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
        export JWT_TOKEN
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "Response: $response"
    fi
}

# Function to test protected endpoints
test_protected() {
    echo -e "\n${YELLOW}🛡️  Testing Protected Endpoints${NC}"
    
    if [ -z "$JWT_TOKEN" ]; then
        echo -e "${YELLOW}⚠️  Skipping protected endpoint tests (JWT_TOKEN not available)${NC}"
        return
    fi
    
    auth_header="-H \"Authorization: Bearer $JWT_TOKEN\""
    
    echo -n "Get user profile: "
    response=$(make_request "GET" "/users/me" "$auth_header" "")
    if echo "$response" | grep -q '"id"'; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "Response: $response"
    fi
}

# Function to test validation
test_validation() {
    echo -e "\n${YELLOW}📝 Testing Input Validation${NC}"
    
    # Test invalid request body
    echo -n "Invalid check-in request: "
    invalid_data='{"invalidField": "invalid_value"}'
    response=$(make_request "POST" "/check-in" "" "$invalid_data")
    if echo "$response" | grep -q '"statusCode":40'; then
        echo -e "${GREEN}✅ PASS${NC} (Validation working)"
    else
        echo -e "${YELLOW}⚠️  WARNING${NC} (Validation might be too permissive)"
    fi
    
    # Test missing authorization
    echo -n "Missing authorization: "
    response=$(make_request "GET" "/users/me" "" "")
    if echo "$response" | grep -q '"statusCode":401'; then
        echo -e "${GREEN}✅ PASS${NC} (Auth protection working)"
    else
        echo -e "${RED}❌ FAIL${NC} (Endpoints not properly protected)"
    fi
}

# Function to test error handling
test_errors() {
    echo -e "\n${YELLOW}🚨 Testing Error Handling${NC}"
    
    # Test 404
    echo -n "404 handling: "
    response=$(make_request "GET" "/nonexistent-endpoint" "" "")
    if echo "$response" | grep -q '"statusCode":404'; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${YELLOW}⚠️  WARNING${NC}"
    fi
    
    # Test invalid method
    echo -n "Invalid method: "
    response=$(make_request "DELETE" "/health" "" "")
    if echo "$response" | grep -q '"statusCode":40'; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${YELLOW}⚠️  WARNING${NC}"
    fi
}

# Function to test database connection
test_database() {
    echo -e "\n${YELLOW}🗄️  Testing Database Connection${NC}"
    
    # This requires TypeORM connection to be successful
    if [ -n "$DATABASE_URL" ] || [ -n "$DATABASE_HOST" ]; then
        echo -e "${GREEN}✅ Database configuration detected${NC}"
    else
        echo -e "${YELLOW}⚠️  No database configuration detected${NC}"
        echo -e "${BLUE}💡 Set DATABASE_* environment variables${NC}"
    fi
}

# Function to generate test report
generate_report() {
    echo -e "\n${BLUE}📊 Test Summary${NC}"
    echo "=================================================="
    echo "Test completed at: $(date)"
    echo "Base URL: $BASE_URL"
    
    if [ -n "$JWT_TOKEN" ]; then
        echo "Authentication: ✅ Tested"
    else
        echo "Authentication: ⚠️  Not tested (Firebase token required)"
    fi
    
    echo -e "\n${BLUE}🔧 Next Steps${NC}"
    echo "1. Configure environment variables in .env file"
    echo "2. Set up Firebase service account"
    echo "3. Configure AWS S3 and Stripe for full functionality"
    echo "4. Run integration tests with real data"
    
    echo -e "\n${GREEN}✨ Backend testing completed!${NC}"
}

# Main execution
main() {
    # Check if backend is running
    if ! check_service; then
        exit 1
    fi
    
    # Run tests
    test_health
    test_auth
    test_protected
    test_validation
    test_errors
    test_database
    
    # Generate report
    generate_report
}

# Help function
show_help() {
    echo "CheckInBuddy Backend Testing Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Environment Variables:"
    echo "  FIREBASE_TOKEN    Firebase ID token for authentication tests"
    echo "  BASE_URL          Backend URL (default: http://localhost:3000)"
    echo ""
    echo "Examples:"
    echo "  $0                           # Run basic tests"
    echo "  FIREBASE_TOKEN=xxx $0        # Run with authentication"
    echo "  BASE_URL=https://api.app $0  # Test remote backend"
    echo ""
}

# Check for help flag
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# Override base URL if provided
if [ -n "$1" ]; then
    BASE_URL="$1"
fi

# Run main function
main 