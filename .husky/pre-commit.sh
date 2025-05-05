#!/usr/bin/env sh
. "$(dirname "$0")/_/husky.sh"

npm run encode-puml && npm test
