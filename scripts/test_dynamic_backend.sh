#!/usr/bin/env bash
# scripts/test_dynamic_backend.sh — end-to-end dynamic backend registration test

# 1. Start a dummy backend on port 3004
node -e "
  const http = require('http');
  const PORT = 3004;
  http.createServer((req, res) => {
    if (req.url === '/health') return res.end('OK');
    res.end('Hello from dynamic backend on port ' + PORT);
  }).listen(PORT, () => console.log('✅ Dynamic backend listening on port ' + PORT));
" &

# Give the dummy server a moment to start
sleep 1

# 2. Register the dynamic backend with the proxy
echo "➡️  Registering dynamic backend (port 3004)"
curl -sk -u adminuser:securepassword \
  -X POST https://localhost:8443/admin/server/register \
  -H "Content-Type: application/json" \
  -d '{"host":"localhost","port":3004}' && echo -e "\n"

# Allow immediate health check to run
sleep 1

# 3. Hit the proxy repeatedly and expect to see the dynamic backend included
echo "➡️  Hitting proxy to verify dynamic backend in rotation"
for i in {1..15}; do
  printf "Response #%02d: " "$i"
  curl -sk https://localhost:8443/
  echo
done

# 4. Deregister the dynamic backend
echo -e "\n➡️  Deregistering dynamic backend (port 3004)"
curl -sk -u adminuser:securepassword \
  -X POST https://localhost:8443/admin/server/deregister \
  -H "Content-Type: application/json" \
  -d '{"port":3004}' && echo -e "\n"

# 5. Hit the proxy again to confirm removal of dynamic backend
echo "➡️  Hitting proxy to confirm deregistration"
for i in {1..5}; do
  printf "Response #%02d: " "$i"
  curl -sk https://localhost:8443/
  echo
done
