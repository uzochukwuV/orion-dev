#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Orion Dev - API Test Suite ===${NC}\n"

API_URL="${1:-http://localhost:3001}"
echo -e "Testing API at: ${YELLOW}${API_URL}${NC}\n"

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local name=$3
  local expected_code=$4
  
  echo -n "Testing $name... "
  
  response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" 2>/dev/null)
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [[ "$http_code" == "$expected_code"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAIL${NC} (HTTP $http_code, expected $expected_code)"
    ((FAILED++))
  fi
  
  if [ ! -z "$body" ] && [ "$body" != "null" ]; then
    echo "  Response: $(echo $body | head -c 80)"
    if [ ${#body} -gt 80 ]; then echo "..."; fi
    echo
  fi
}

# Test endpoints
echo -e "${BLUE}Public Endpoints:${NC}"
test_endpoint "GET" "/health" "Health Check" "200"

echo -e "\n${BLUE}API Endpoints (Authentication Required):${NC}"
test_endpoint "GET" "/api/auth/me" "Get Current User" "400"
test_endpoint "GET" "/api/dashboard" "Dashboard Stats" "404"
test_endpoint "GET" "/api/entities/Business" "Business Entities" "401"

echo -e "\n${BLUE}Agent Routes:${NC}"
test_endpoint "GET" "/api/agents" "List Agents" "404"
test_endpoint "GET" "/api/intelligence" "Intelligence Routes" "404"

echo -e "\n${BLUE}WhatsApp Integration:${NC}"
test_endpoint "GET" "/api/whatsapp" "WhatsApp Routes" "404"

echo -e "\n${BLUE}=== Test Summary ===${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Total:  $(($PASSED + $FAILED))"

if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed! ✓${NC}"
  exit 0
else
  echo -e "\n${RED}Some tests failed. Check the API configuration.${NC}"
  exit 1
fi
