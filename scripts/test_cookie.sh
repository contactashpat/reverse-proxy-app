#!/usr/bin/env bash
# scripts/test_cookie.sh — testing cookie-based sticky session

# 1) Switch to cookie mode
echo "➡️  Switching to cookie mode"
curl -sk -u adminuser:securepassword \
  -X POST https://localhost:8443/admin/sticky-mode \
  -H 'Content-Type: application/json' \
  -d '{"mode":"cookie"}' && echo -e "\n"

# 2) Hit once to get the SESSIONID cookie
echo "➡️  First request (capture cookie)"
curl -sk -c scripts/cookiejar.txt https://localhost:8443/ -i
echo -e "\n"

# 3) Subsequent requests with the cookie
echo "➡️  Replaying 4 more requests with same cookie"
for i in {1..4}; do
  echo "---- Request #$i ----"
  curl -sk -b scripts/cookiejar.txt https://localhost:8443/ -i
  echo -e "\n"
done
