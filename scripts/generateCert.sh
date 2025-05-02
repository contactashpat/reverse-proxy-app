#!/usr/bin/env bash
set -e

# Use ACME (Let's Encrypt) if USE_ACME=true is set
if [ "${USE_ACME:-false}" = "true" ]; then
  # Ensure DOMAIN and WEBROOT are provided
  if [ -z "${DOMAIN}" ] || [ -z "${WEBROOT}" ]; then
    echo "⚠️ For ACME issuance, set USE_ACME=true and provide DOMAIN and WEBROOT."
    exit 1
  fi

  SSL_DIR="$(dirname "$0")/../ssl"
  mkdir -p "$SSL_DIR"

  echo "🌐 Issuing certificate for ${DOMAIN} via ACME..."
  # Use acme.sh (https://github.com/acmesh-official/acme.sh)
  acme.sh --issue \
    -d "${DOMAIN}" \
    --webroot "${WEBROOT}" \
    --key-file "${SSL_DIR}/private.key" \
    --fullchain-file "${SSL_DIR}/certificate.crt"

  echo "✅ ACME certificate and key generated:"
  echo "   - ${SSL_DIR}/private.key"
  echo "   - ${SSL_DIR}/certificate.crt"
  exit 0
fi

# Directory for SSL certificates
SSL_DIR="$(dirname "$0")/../ssl"

# Create the directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Generate a self-signed certificate and private key
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$SSL_DIR/private.key" \
  -out "$SSL_DIR/certificate.crt" \
  -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=localhost"

echo "✅ Self-signed certificate and key generated:"
echo "   - $SSL_DIR/private.key"
echo "   - $SSL_DIR/certificate.crt"
