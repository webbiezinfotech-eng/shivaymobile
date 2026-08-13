#!/usr/bin/env bash
# API security audit via curl. Requires Apache + MySQL running.
# Usage: bash backend/tests/api_audit.sh

BASE="http://localhost/Shivay%20Mobile/backend"
COOKIE_JAR="/tmp/shivay_audit_cookies.txt"
PASS=0
FAIL=0

check() {
  local desc="$1"
  local expected_code="$2"
  local actual_code="$3"
  if [ "$actual_code" = "$expected_code" ]; then
    echo "[PASS] $desc (HTTP $actual_code)"
    PASS=$((PASS + 1))
  else
    echo "[FAIL] $desc (expected HTTP $expected_code, got $actual_code)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== API Security Audit ==="

# Owner login
CODE=$(curl -s -o /dev/null -w "%{http_code}" -c "$COOKIE_JAR" -X POST "$BASE/auth/login.php" \
  -H "Content-Type: application/json" \
  -d '{"username":"owner","password":"owner123"}')
check "Owner login" "200" "$CODE"

# Sameer login (separate jar)
SAMEER_JAR="/tmp/shivay_sameer_cookies.txt"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -c "$SAMEER_JAR" -X POST "$BASE/auth/login.php" \
  -H "Content-Type: application/json" \
  -d '{"username":"sameer","password":"sameer123"}')
check "Sameer login" "200" "$CODE"

# Wrong password
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login.php" \
  -H "Content-Type: application/json" \
  -d '{"username":"owner","password":"wrong"}')
check "Wrong password rejected" "401" "$CODE"

# Sameer cannot access owner dashboard
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$SAMEER_JAR" "$BASE/dashboard/owner.php")
check "Sameer blocked from owner dashboard" "403" "$CODE"

# Sameer cannot access monthly report
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$SAMEER_JAR" "$BASE/reports/monthly.php")
check "Sameer blocked from monthly report" "403" "$CODE"

# Sameer cannot settle
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$SAMEER_JAR" -X POST "$BASE/entries/settle.php" \
  -H "Content-Type: application/json" \
  -d '{"entry_id":1}')
check "Sameer blocked from settle API" "403" "$CODE"

# Owner can access dashboard
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/dashboard/owner.php")
check "Owner can access dashboard" "200" "$CODE"

# Unauthenticated me.php
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/me.php")
check "Unauthenticated me.php returns 401" "401" "$CODE"

# Sameer create entry with fake profit (backend should ignore)
RESP=$(curl -s -b "$SAMEER_JAR" -X POST "$BASE/entries/create.php" \
  -H "Content-Type: application/json" \
  -d '{"entry_date":"2026-08-10","item_name":"Audit Test","customer_name":"Test","customer_amount":90,"purchase_cost":20,"source_shop":"V.M","profit":999999,"created_by":999}')
PROFIT=$(echo "$RESP" | php -r 'echo json_decode(file_get_contents("php://stdin"))->data->profit ?? "missing";')
if [ "$PROFIT" = "70" ]; then
  echo "[PASS] Backend ignores fake profit (got 70)"
  PASS=$((PASS + 1))
else
  echo "[FAIL] Backend should calculate profit=70, got $PROFIT"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "Passed: $PASS | Failed: $FAIL"
rm -f "$COOKIE_JAR" "$SAMEER_JAR"
exit $FAIL
