// src/proxy.ts - Main reverse proxy entry point (with HTTPS, admin API, sticky sessions)

import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as url from 'url';
import httpProxy = require('http-proxy');
import * as crypto from 'crypto';
import settings from '../config/settings';
import { isAuthorized } from './secureAdminApi';
import { registerServer, deregisterServer, healthyServers } from './healthChecker';
import { BackendServer } from './types';

import { handleWebSocketUpgrade } from './websocketHandler';

import CircuitBreaker from 'opossum';
import pino from 'pino';
import pretty from 'pino-pretty';

// Logger instance
const logger = pino({}, pretty({ colorize: true }));

let stickySessionMode = settings.proxy.stickySessionMode;

const proxy = httpProxy.createProxyServer({});

// --- Resilience: Timeouts, retry/backoff, and circuit breaker --- //

// Wrap proxy.web into a promise for circuit-breaker
function httpProxyAction({ req, res, options }: { req: http.IncomingMessage; res: http.ServerResponse; options: any; }): Promise<void> {
  return new Promise((resolve, reject) => {
    proxy.web(req, res, options, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Circuit-breaker configuration
const breakerOptions = {
  timeout: 6000,               // 6s overall timeout
  errorThresholdPercentage: 50,// open circuit if 50% of calls fail
  resetTimeout: 30000          // try again after 30s
};

const proxyBreaker = new CircuitBreaker(httpProxyAction, breakerOptions);
proxyBreaker.fallback(() => Promise.reject(new Error('Circuit open – service unavailable')));
proxyBreaker.on('open',    () => logger.warn('🚨 Circuit opened – failing fast'));
proxyBreaker.on('halfOpen',() => logger.info('🔧 Circuit half-open – testing backend'));
proxyBreaker.on('close',   () => logger.info('✅ Circuit closed – backend healthy'));

// Retry with exponential backoff
function attemptProxy(req: http.IncomingMessage, res: http.ServerResponse, target: string, retries = 2, delay = 200) {
  const options = { target, proxyTimeout: 5000, timeout: 10000 };
  proxy.web(req, res, options, err => {
    if (err) {
      if (retries > 0) {
        logger.warn(`Proxy to ${target} failed, retrying in ${delay}ms…`);
        setTimeout(() => attemptProxy(req, res, target, retries - 1, delay * 2), delay);
      } else {
        logger.error(`Proxy to ${target} ultimately failed.`);
        res.writeHead(502).end('Bad Gateway');
      }
    }
  });
}
// ------------------------------------------------------------- //

function getServerIndexByIp(ip: string, servers: BackendServer[]): number {
  const hash = crypto.createHash('sha256').update(ip).digest('hex');
  return parseInt(hash.substr(0, 8), 16) % servers.length;
}

function getServerIndexByCookie(req: http.IncomingMessage, servers: BackendServer[]): number {
  const cookie = req.headers['cookie'] || '';
  const match = cookie.match(/SESSIONID=(\d+)/);
  if (match) {
    const index = parseInt(match[1], 10);
    if (!isNaN(index) && index >= 0 && index < servers.length) {
      return index;
    }
  }
  return Math.floor(Math.random() * servers.length);
}

function setStickyCookie(res: http.ServerResponse, index: number) {
  res.setHeader('Set-Cookie', `SESSIONID=${index}; Path=/; HttpOnly`);
}

function selectTarget(req: http.IncomingMessage, res: http.ServerResponse): string {
  let index;
  const ip = req.socket.remoteAddress || '';
  if (stickySessionMode === 'ip-hash') {
    index = getServerIndexByIp(ip, healthyServers);
  } else {
    index = getServerIndexByCookie(req, healthyServers);
    setStickyCookie(res, index);
  }
  const target = healthyServers[index];
  return `http://${target.host}:${target.port}`;
}

function handleAdminApi(req: http.IncomingMessage, res: http.ServerResponse): boolean {
  const parsed = url.parse(req.url || '', true);
  if (!parsed.pathname?.startsWith('/admin')) return false;
  if (!isAuthorized(req)) {
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Admin Area"' });
    res.end('Unauthorized');
    return true;
  }
  if (parsed.pathname === '/admin/sticky-mode' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const { mode } = JSON.parse(body);
        if (mode === 'ip-hash' || mode === 'cookie') {
          stickySessionMode = mode;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, mode }));
        } else throw new Error('Invalid mode');
      } catch {
        res.writeHead(400).end('Invalid JSON or mode');
      }
    });
    return true;
  }
  if (parsed.pathname === '/admin/server/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const { host, port } = JSON.parse(body);
        if (host && port) {
          registerServer({ host, port });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else throw new Error();
      } catch {
        res.writeHead(400).end('Invalid payload');
      }
    });
    return true;
  }
  if (parsed.pathname === '/admin/server/deregister' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const { port } = JSON.parse(body);
        if (port) {
          deregisterServer(port);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else throw new Error();
      } catch {
        res.writeHead(400).end('Invalid payload');
      }
    });
    return true;
  }
  return false;
}

function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  // Liveness endpoint
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('OK');
  }
  if (handleAdminApi(req, res)) return;
  const target = selectTarget(req, res);
  // Use circuit-breaker with fallback to retry/backoff
  proxyBreaker.fire({ req, res, options: { target, proxyTimeout: 5000, timeout: 10000 } })
    .catch(err => {
      logger.warn('🚧 Circuit-breaker proxy failed:', err.message);
      attemptProxy(req, res, target);
    });
}

function handleUpgrade(req: http.IncomingMessage, socket: any, head: Buffer) {
  const target = selectTarget(req, {} as http.ServerResponse);
  const options = { target, proxyTimeout: 5000, timeout: 10000 };
  proxy.ws(req, socket, head, options);
}

const sslOptions = {
  key: fs.readFileSync(settings.ssl.keyPath),
  cert: fs.readFileSync(settings.ssl.certPath)
};

const httpsServer = https.createServer(sslOptions, handleRequest);
const httpServer = http.createServer((req, res) => {
  const host = req.headers.host;
  res.writeHead(301, { Location: `https://${host}${req.url}` });
  res.end();
});

httpsServer.on('upgrade', (req, socket, head) => {
  handleWebSocketUpgrade(proxy, req, socket, head);
});

httpsServer.listen(settings.proxy.httpsPort, () => {
  logger.info(`✅ HTTPS Reverse Proxy running on port ${settings.proxy.httpsPort}`);
});

httpServer.listen(settings.proxy.httpRedirectPort, () => {
  logger.info(`➡️ Redirecting HTTP to HTTPS on port ${settings.proxy.httpRedirectPort}`);
});

