#!/usr/bin/env bash
set -euo pipefail

# Query Prometheus for proxy health
health=$(curl -sS http://localhost:9090/api/v1/targets \
  | jq -r '.data.activeTargets[]
            | select(.labels.job=="proxy")
            | .health')

if [[ "$health" != "up" ]]; then
  echo "❌ Prometheus proxy target is $health"
  exit 1
fi

echo "✅ Prometheus proxy target is up"
