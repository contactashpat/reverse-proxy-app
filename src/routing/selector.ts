// src/routing/selector.ts
import { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import settings from '../../config/settings';
import { healthyServers } from '../healthChecker';

/**
 * Pick a server index by hashing the client IP.
 */
function getServerIndexByIp(ip: string): number {
  const hash = crypto.createHash('sha256').update(ip).digest('hex');
  return parseInt(hash.substr(0, 8), 16) % healthyServers.length;
}

/**
 * Pick a server index by reading a cookie; fallback to random.
 */
function getServerIndexByCookie(req: IncomingMessage): number {
  const cookie = req.headers['cookie'] || '';
  const match = cookie.match(/SESSIONID=(\d+)/);
  if (match) {
    const idx = parseInt(match[1], 10);
    if (!isNaN(idx) && idx >= 0 && idx < healthyServers.length) {
      return idx;
    }
  }
  return Math.floor(Math.random() * healthyServers.length);
}

/**
 * Send a sticky cookie back to the client.
 */
export function setStickyCookie(res: ServerResponse, index: number): void {
  res.setHeader('Set-Cookie', `SESSIONID=${index}; Path=/; HttpOnly`);
}

/**
 * Main selector: choose target based on configured stickySessionMode.
 */
export function selectTarget(req: IncomingMessage, res: ServerResponse): string {
  let idx: number;
  const ip = req.socket.remoteAddress || '';
  if (settings.proxy.stickySessionMode === 'ip-hash') {
    idx = getServerIndexByIp(ip);
  } else {
    idx = getServerIndexByCookie(req);
    setStickyCookie(res, idx);
  }
  const target = healthyServers[idx];
  return `http://${target.host}:${target.port}`;
}
