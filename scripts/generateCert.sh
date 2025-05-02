

#!/usr/bin/env bash
set -e

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
