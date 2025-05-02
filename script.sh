# Hit the proxy multiple times—should always go to the same backend (IP-hash)
for i in {1..5}; do
  curl -sk https://localhost:8443/ | tee -a /tmp/roundrobin.txt
done
cat /tmp/roundrobin.txt
# Expect all responses from the same port (e.g. “Hello from backend on port 3001”)
