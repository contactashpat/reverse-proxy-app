# Reverse Proxy App

A dynamic, TypeScript-based reverse proxy with health checks, load balancing, sticky sessions, admin API, metrics, and alerting.

## Table of Contents

- [Functional Aspect](#functional-aspect)
- [Technical Aspect](#technical-aspect)
- [Architectural Aspect](#architectural-aspect)
- [Getting Started](#getting-started)
- [Usage Examples](#usage-examples)
- [Configuration](#configuration)
- [Docker & Compose](#docker--compose)
- [Automated Testing](#automated-testing)
- [Contributing](#contributing)
- [License](#license)

## Functional Aspect

This section describes what the proxy does from an end-user or operator perspective:
- **Health Checks & Failover**  
  Monitors registered backend servers on `/health` endpoint and automatically removes or reinstates them based on status.
- **Load Balancing**  
  Distributes incoming traffic across healthy backends using configurable sticky session strategies (IP hashing or cookie-based).
- **Admin API**  
  Secure endpoints to change proxy behavior at runtime:
    - `POST /admin/sticky-mode` to switch between `ip-hash` and `cookie` modes.
    - `POST /admin/server/register` to add a backend.
    - `POST /admin/server/deregister` to remove a backend.
- **Metrics & Monitoring**  
  Exposes Prometheus‑style metrics at `/metrics` for request counts, active requests, queued requests, and average response time.
- **Alerting**  
  Sends email alerts when backends go down or recover.

## Technical Aspect

Details about implementation and technologies used:
- **Language & Runtime**
    - TypeScript, Node.js (LTS)
- **Core Modules**
    - `http-proxy` for proxying HTTP and WebSocket traffic
    - `nodemailer` for SMTP email alerts
    - `dotenv` for environment-based configuration
    - `pino` for structured, colorized logging (via `pino-pretty`)
    - `zod` for runtime environment validation
    - `@sendgrid/mail` for HTTP‐based email alerts (replacing SMTP)
    - `prom-client` for Prometheus metric collection with correct Content-Type
- **Process Management**
    - PM2 in cluster mode for zero‑downtime restarts and multi-core utilization
    - Dockerfile (multi-stage) for container builds
    - `docker-compose.yml` for full-stack local development (proxy, backends, MailHog, Prometheus, Grafana)
- **Testing & Development**
    - `ts-node-dev` for hot reload during development
    - `jest` + `ts-jest` for unit and integration tests
    - End-to-end smoke tests via shell scripts (`scripts/*.sh`)
    - Setup file for Jest (`test/setupEnv.ts`) to bootstrap environment variables
- **Build & Deployment**
    - `tsc` for compilation
    - Dockerfile (to be added) for containerization
- **Resilience & Reliability**
    - Connection timeouts on backend requests (5s proxyTimeout, 10s socket inactivity timeout)
    - Automatic retries with exponential backoff (2 retry attempts with exponential delays)
    - Circuit-breaker mechanism using `opossum` for fast-fail and backend recovery

## Architectural Aspect

High-level design and flow:
```text
        ┌─────────────┐
        │   Client    │
        └──────┬──────┘
               ↓
   ┌────────────────────────┐
   │      HTTPS Proxy       │
   │  (TLS termination,     │
   │   load balancing,      │
   │   sticky sessions,     │
   │   admin API, metrics)  │
   └───────┬───┬───────────┘
           │   │
      ┌────┘   └────┐
      ↓              ↓
┌──────────┐    ┌──────────┐
│ Backend  │    │ Backend  │
│ Server 1 │    │ Server 2 │
└──────────┘    └──────────┘
(… additional backends …)
```

- **Dynamic Discovery**: Backends can be registered/deregistered at runtime.
- **Health Monitoring**: Periodic health pings ensure traffic is only routed to healthy nodes.
- **Prometheus Integration**: Metrics endpoint for monitoring systems.
- **Alerting**: Email notifications for critical events.

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm
- OpenSSL (for self‑signed cert generation)

### Installation

```bash
git clone <repo-url>
cd reverse-proxy-app
npm install
chmod +x scripts/generateCert.sh
./scripts/generateCert.sh
```

<!-- If using ACME with a real domain, run: -->
<!--
export USE_ACME=true
export DOMAIN=your.domain.com
export WEBROOT=/path/to/webroot
chmod +x scripts/generateCert.sh
./scripts/generateCert.sh
-->

### Running in Development

```bash
npm run dev
```

### Running in Production

```bash
npm run build
pm2 start pm2.config.js
```

## Usage Examples

- **Test proxy**
  ```bash
  curl -k https://localhost:8443/
  ```

- **Change sticky mode**
  ```bash
  curl -k -u adminuser:securepassword \
       -X POST https://localhost:8443/admin/sticky-mode \
       -H "Content-Type: application/json" \
       -d '{"mode":"cookie"}'
  ```

- **Register a backend**
  ```bash
  curl -k -u adminuser:securepassword \
       -X POST https://localhost:8443/admin/server/register \
       -H "Content-Type: application/json" \
       -d '{"host":"localhost","port":3004}'
  ```

## Configuration

All settings are controlled via environment variables. See `.env.example` for details.

## Docker & Compose

A one‑command local stack for development:

```bash
docker compose up --build
```

This brings up:
- Reverse proxy on ports 8080 (HTTP) and 8443 (HTTPS)
- Three dummy backends (ports 3001–3003)
- MailHog (SMTP/UI)
- Prometheus on port 9090 (scraping `/metrics` with `fallback_scrape_protocol: http`)
- Grafana on port 3000

## Automated Testing

The repository includes automated test suites:

- **Unit/Integration:** Jest (`__tests__/*.test.ts`), mocking `sendAlert` and using `checkServerHealth()`
- **End-to-End:** `scripts/*.sh` for IP-hash, cookie, dynamic backend, and observability checks
- **Prometheus/Grafana checks:** Scripts under `scripts/` can verify target health and dashboard config

## Contributing

PRs and issues are welcome! Please follow the existing code style and add tests for new features.

## License

MIT License
