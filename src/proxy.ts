import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import settings from '../config/settings';
import logger from './logger';
import { handleRequest } from './handlers/requestHandler';
import { handleUpgrade } from './handlers/upgradeHandler';
import type { Server as HttpServer } from 'http';

/**
 * Start the proxy servers.
 * Returns a promise that resolves with the server instances once both are listening.
 */
export function startProxy(): Promise<{ httpsServer: HttpServer; httpServer: HttpServer }> {
  return new Promise(resolve => {
    const httpsServer = https.createServer(sslOptions, handleRequest);
    const httpServer = http.createServer((req, res) => {
      const host = req.headers.host;
      res.writeHead(301, { Location: `https://${host}${req.url}` });
      res.end();
    });

    httpsServer.on('upgrade', handleUpgrade);

    let readyCount = 0;
    const onReady = () => {
      if (++readyCount === 2) {
        resolve({ httpsServer, httpServer });
      }
    };

    httpsServer.listen(settings.proxy.httpsPort, () => {
      logger.info(`✅ HTTPS Reverse Proxy running on port ${settings.proxy.httpsPort}`);
      onReady();
    });
    httpServer.listen(settings.proxy.httpRedirectPort, () => {
      logger.info(`➡️ Redirecting HTTP to HTTPS on port ${settings.proxy.httpRedirectPort}`);
      onReady();
    });
  });
}

/**
 * Stop the proxy servers.
 * Returns a promise that resolves once both servers are closed.
 */
export function stopProxy(servers: { httpsServer: HttpServer; httpServer: HttpServer }): Promise<void> {
  return Promise.all([
    new Promise<void>(res => servers.httpsServer.close(() => res())),
    new Promise<void>(res => servers.httpServer.close(() => res())),
  ]).then(() => undefined);
}

// If this script is run directly, start the servers immediately
if (require.main === module) {
  startProxy();
}

const sslOptions = {
  key: fs.readFileSync(settings.ssl.keyPath),
  cert: fs.readFileSync(settings.ssl.certPath)
};
