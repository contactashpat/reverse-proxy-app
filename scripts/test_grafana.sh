#!/usr/bin/env bash
set -euo pipefail

# Default admin/admin login
base="http://localhost:3000/api"

# 1. Health endpoint
curl -sS "$base/health" | jq '{database, version}' \
  || { echo "❌ Grafana health check failed"; exit 1; }
echo "✅ Grafana API is healthy"

# 2. Datasource exists
exists=$(curl -sS "$base/datasources" \
  | jq -e '.[] | select(.name=="Prometheus")')
if [[ -z "$exists" ]]; then
  echo "❌ Prometheus data source missing in Grafana"
  exit 1
fi
echo "✅ Prometheus data source configured in Grafana"
