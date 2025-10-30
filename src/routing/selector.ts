// src/routing/selector.ts
import { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import settings from '../../config/settings';
import { healthyServers } from '../healthChecker';
import { BackendServer } from '../types';

function toServerKey(server: BackendServer): string {
  return `${server.host}:${server.port}`;
}

/**
 * Pick a server index by hashing the client IP.
 */
function getServerIndexByIp(ip: string, servers: BackendServer[]): number {
  const hash = crypto.createHash('sha256').update(ip).digest('hex');
  return parseInt(hash.substr(0, 8), 16) % servers.length;
}

/**
 * Pick a server index by reading a cookie; fallback to random.
 */
function getServerIndexByCookie(req: IncomingMessage, servers: BackendServer[]): number {
  const cookie = req.headers['cookie'] || '';
  const match = cookie.match(/SESSIONID=(\d+)/);
  if (match) {
    const idx = parseInt(match[1], 10);
    if (!isNaN(idx) && idx >= 0 && idx < servers.length) {
      return idx;
    }
  }
  return Math.floor(Math.random() * servers.length);
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
export function selectTarget(
  req: IncomingMessage,
  res: ServerResponse,
  options: { exclude?: Set<string>; setCookie?: boolean } = {}
): string | null {
  const exclude = options.exclude ?? new Set<string>();
  const shouldSetCookie = options.setCookie ?? true;
  const candidates = healthyServers.filter(server => !exclude.has(toServerKey(server)));

  if (candidates.length === 0) {
    return null;
  }

  let idx: number;
  const ip = req.socket.remoteAddress || '';
  if (settings.proxy.stickySessionMode === 'ip-hash') {
    idx = getServerIndexByIp(ip, candidates);
  } else {
    idx = getServerIndexByCookie(req, candidates);
    if (shouldSetCookie) {
      setStickyCookie(res, idx);
    }
  }
  const target = candidates[idx];
  if (!target) {
    return null;
  }
  return `http://${target.host}:${target.port}`;
}
