#!/usr/bin/env bash
# scripts/start-backends.sh — starts 3 dummy HTTP servers

ports=(3001 3002 3003)
for port in "${ports[@]}"; do
  node -e "
    const http = require('http');
    const PORT = ${port};
    http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200);
        return res.end('OK');
      }
      res.writeHead(200);
      res.end('Hello from backend on port ' + PORT);
    }).listen(PORT, () => console.log('✅ Backend listening on port ' + PORT));
  " &
done

echo "Started dummy backends on ports: ${ports[*]}"
