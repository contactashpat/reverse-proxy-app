// src/resilience/breaker.ts
import httpProxy = require('http-proxy');
import CircuitBreaker from 'opossum';
import logger from '../logger';
import { IncomingMessage, ServerResponse } from 'http';

const proxy = httpProxy.createProxyServer({});

// Wrap proxy.web into a Promise for opossum
async function httpProxyAction(args: {
  req: IncomingMessage;
  res: ServerResponse;
  options: { target: string; proxyTimeout: number; timeout: number };
}): Promise<void> {
  const { req, res, options } = args;
  return new Promise((resolve, reject) => {
    proxy.web(req, res, options, err => (err ? reject(err) : resolve()));
  });
}

// Circuit-breaker defaults
const breakerOptions = {
  timeout: 6000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
};

export const proxyBreaker = new CircuitBreaker(httpProxyAction, breakerOptions);

// Log state transitions
proxyBreaker.on('open',    () => logger.warn('🚨 Circuit opened – failing fast'));
proxyBreaker.on('halfOpen',() => logger.info('🔧 Circuit half-open – testing backend'));
proxyBreaker.on('close',   () => logger.info('✅ Circuit closed – backend healthy'));

// Fallback if breaker open
proxyBreaker.fallback(() => Promise.reject(new Error('Circuit open – service unavailable')));

/**
 * If the circuit-breaker path fails, do a raw retry with exponential backoff.
 */
export function attemptProxy(
  req: IncomingMessage,
  res: ServerResponse,
  target: string,
  retries = 2,
  delay = 200
): void {
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
