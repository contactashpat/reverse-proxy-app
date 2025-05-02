import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import settings from '../config/settings';
import logger from './logger';
import { handleRequest } from './handlers/requestHandler';
import { handleUpgrade } from './handlers/upgradeHandler';

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

httpsServer.on('upgrade', handleUpgrade);

httpsServer.listen(settings.proxy.httpsPort, () => {
  logger.info(`✅ HTTPS Reverse Proxy running on port ${settings.proxy.httpsPort}`);
});
httpServer.listen(settings.proxy.httpRedirectPort, () => {
  logger.info(`➡️ Redirecting HTTP to HTTPS on port ${settings.proxy.httpRedirectPort}`);
});
