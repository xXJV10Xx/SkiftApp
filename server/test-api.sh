#!/bin/bash

# 🧪 API Test Script för Skiftbyte-funktionalitet
# Detta skript testar alla API-endpoints för att säkerställa att de fungerar korrekt

set -e  # Avsluta vid fel

# Färger för output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Konfiguration
API_BASE="http://localhost:8000"
TEST_USER_ID="test-user-123"
TEST_SHIFT_ID="test-shift-456"
TEST_TOKEN="your-test-jwt-token-here"

echo -e "${BLUE}🧪 Startar API-tester för Skiftbyte-funktionalitet${NC}"
echo "=================================================="

# Funktion för att testa endpoints
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -e "\n${YELLOW}Testar: $description${NC}"
    echo "Endpoint: $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer $TEST_TOKEN" \
            -H "Content-Type: application/json" \
            "$API_BASE$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $TEST_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE$endpoint")
    fi
    
    # Separera response body och status code
    body=$(echo "$response" | head -n -1)
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS - Status: $status${NC}"
        if [ ! -z "$body" ] && [ "$body" != "null" ]; then
            echo "Response: $(echo $body | jq . 2>/dev/null || echo $body)"
        fi
    else
        echo -e "${RED}❌ FAIL - Expected: $expected_status, Got: $status${NC}"
        echo "Response: $body"
        return 1
    fi
}

# Starta tester
echo -e "\n${BLUE}1. Health Check${NC}"
test_endpoint "GET" "/health" "" "200" "Server health check"

echo -e "\n${BLUE}2. Schedule API${NC}"
test_endpoint "GET" "/api/schedule/$TEST_USER_ID" "" "200" "Hämta användarschema"

echo -e "\n${BLUE}3. Skiftbyte API${NC}"
test_endpoint "POST" "/api/shifts/trade" \
    '{"shiftId":"'$TEST_SHIFT_ID'","message":"Behöver byta pga läkarbesök"}' \
    "200" "Skapa skiftbyte-förfrågan"

test_endpoint "GET" "/api/shifts/trade-requests" "" "200" "Hämta teamets trade requests"

echo -e "\n${BLUE}4. Intresse-API${NC}"
test_endpoint "POST" "/api/shifts/trade/interested" \
    '{"tradeRequestId":"test-trade-123"}' \
    "200" "Visa intresse för skiftbyte"

echo -e "\n${BLUE}5. Skifttilldelning${NC}"
test_endpoint "PUT" "/api/shifts/$TEST_SHIFT_ID/assign" \
    '{"newOwnerId":"new-owner-789"}' \
    "200" "Tilldela skift till ny ägare"

echo -e "\n${GREEN}🎉 Alla tester avslutade!${NC}"
echo "=================================================="

# Sammanfattning
echo -e "\n${BLUE}📋 Test Summary:${NC}"
echo "- Health check: Server är igång"
echo "- Schedule API: Hämtar användarschema"
echo "- Trade API: Skapar och hämtar skiftbyte-förfrågningar"
echo "- Interest API: Registrerar intresse för skiftbyten"
echo "- Assignment API: Tilldelar skift till nya ägare"

echo -e "\n${YELLOW}⚠️  Notera:${NC}"
echo "- Ersätt TEST_TOKEN med en giltig JWT från Supabase"
echo "- Uppdatera TEST_USER_ID och TEST_SHIFT_ID med riktiga ID:n"
echo "- Kontrollera att Deno-servern körs på port 8000"

echo -e "\n${GREEN}✅ API-testning klar!${NC}"