// src/handlers/requestHandler.ts
import { IncomingMessage, ServerResponse } from 'http';
import settings from '../../config/settings';
import { applyWAF } from './waf';
import { handleAdminApi } from "./adminApi";
import { selectTarget } from '../routing/selector';
import { proxyBreaker, attemptProxy } from '../resilience/breaker';
import logger from '../logger';

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

  // Proxy with circuit breaker and retry
  const target = selectTarget(req, res);
  try {
    await proxyBreaker.fire({ req, res, options: { target, proxyTimeout: 5000, timeout: 10000 } });
  } catch (err: any) {
    logger.warn('🚧 Circuit-breaker proxy failed:', err.message);
    attemptProxy(req, res, target);
  }
}
