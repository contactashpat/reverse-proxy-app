// src/websocketHandler.ts
import { IncomingMessage } from 'http';
import httpProxy = require('http-proxy');
// Derive the correct ProxyServer type from the factory
type ProxyServer = ReturnType<typeof httpProxy.createProxyServer>;
import * as crypto from 'crypto';
import settings from '../config/settings';
import { BackendServer } from './types';
import { healthyServers } from './healthChecker';

/**
 * Determines backend index based on sticky session mode.
 */
function selectBackendIndex(req: IncomingMessage, servers: BackendServer[]): number {
  const clientIp = req.socket.remoteAddress || '';
  if (settings.proxy.stickySessionMode === 'ip-hash') {
    const hash = crypto.createHash('sha256').update(clientIp).digest('hex');
    return parseInt(hash.substr(0, 8), 16) % servers.length;
  } else {
    const cookie = req.headers['cookie'] || '';
    const match = cookie.match(/SESSIONID=(\d+)/);
    if (match) {
      const idx = parseInt(match[1], 10);
      if (!isNaN(idx) && idx >= 0 && idx < servers.length) {
        return idx;
      }
    }
    // assign randomly if no valid cookie
    return Math.floor(Math.random() * servers.length);
  }
}

/**
 * Handles WebSocket upgrade requests by proxying them to the selected backend.
 * @param proxy The http-proxy server instance
 * @param req Incoming HTTP request
 * @param socket Raw network socket
 * @param head Protocol head buffer
 */
export function handleWebSocketUpgrade(
  proxy: ProxyServer,
  req: IncomingMessage,
  socket: any,
  head: Buffer
): void {
  if (healthyServers.length === 0) {
    socket.destroy();
    return;
  }

  const backendIndex = selectBackendIndex(req, healthyServers);
  const target: BackendServer = healthyServers[backendIndex];
  const targetUrl = `http://${target.host}:${target.port}`;

  proxy.ws(req, socket, head, { target: targetUrl });
}
