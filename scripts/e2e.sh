#!/usr/bin/env bash
# scripts/e2e.sh

# 1. Bring up stack
docker compose up -d

# 2. Wait for services to be healthy
sleep 5

# 3. Run individual scripts, fail early if any fails
./scripts/test_ip_hash.sh   || exit 1
./scripts/test_cookie.sh    || exit 1
./scripts/test_dynamic_backend.sh || exit 1

# 4. Check metrics, Prometheus & Grafana
./scripts/test_prometheus.sh  || exit 1
./scripts/test_grafana.sh     || exit 1

# 5. Tear down
docker compose down
echo "✅ All smoke tests passed!"
