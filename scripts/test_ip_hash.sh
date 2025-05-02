#!/usr/bin/env bash
# scripts/test_ip_hash.sh — testing IP-hash sticky session with verbose output

# Ensure proxy is running on 8443
echo "➡️  Checking proxy on https://localhost:8443/"
curl -Ik -m 5 https://localhost:8443/ || { echo "❌ Proxy not reachable."; exit 1; }
echo

# Clear previous results
> /tmp/roundrobin.txt

# Hit the proxy multiple times—should always go to the same backend (IP-hash)
for i in {1..5}; do
  echo "---- Request #$i ----" | tee -a /tmp/roundrobin.txt
  curl -vsk --max-time 5 https://localhost:8443/ 2>&1 | tee -a /tmp/roundrobin.txt
  echo "" | tee -a /tmp/roundrobin.txt
done

echo "📋 Results:"
cat /tmp/roundrobin.txt
