// src/handlers/requestHandler.ts
import { IncomingMessage, ServerResponse } from 'http';
import settings from '../../config/settings';
import { applyWAF } from './waf';
import { handleAdminApi } from "./adminApi";
import { selectTarget } from '../routing/selector';
import { proxyBreaker } from '../resilience/breaker';
import logger from '../logger';
import { markTargetUnhealthy } from '../healthChecker';

function targetKey(target: string): string {
  try {
    const url = new URL(target);
    return `${url.hostname}:${url.port || (url.protocol === 'https:' ? '443' : '80')}`;
  } catch {
    return target;
  }
}

/**
 * Main HTTP request handler.
 */
export async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // Liveness probe
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // WAF filtering
  if (settings.waf.enabled && applyWAF(req, res)) {
    return;
  }

  // Admin API
  if (handleAdminApi(req, res)) {
    return;
  }

  const attemptedTargets = new Set<string>();
  let attemptCount = 0;
  let lastError: Error | null = null;

  while (true) {
    const target = selectTarget(req, res, {
      exclude: attemptedTargets,
      setCookie: attemptCount === 0,
    });

    if (!target) {
      break;
    }

    attemptCount++;

    try {
      await proxyBreaker.fire({ req, res, options: { target, proxyTimeout: 5000, timeout: 10000 } });
      return;
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.warn(`🚧 Proxy to ${target} failed (${lastError.message}). Attempting failover…`);
      const key = targetKey(target);
      attemptedTargets.add(key);
      markTargetUnhealthy(target, lastError.message);
    }
  }

  if (attemptCount === 0) {
    logger.error('❌ No healthy backend servers available to handle request.');
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    res.end('Service Unavailable');
    return;
  }

  logger.error(
    `❌ Exhausted all backend targets for ${req.url}${lastError ? `: ${lastError.message}` : ''}`
  );
  res.writeHead(502, { 'Content-Type': 'text/plain' });
  res.end('Bad Gateway');
}
