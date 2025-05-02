// src/handlers/adminApi.ts
import { IncomingMessage, ServerResponse } from 'http';
import url from 'url';
import { isAuthorized } from '../secureAdminApi';
import { registerServer, deregisterServer } from '../healthChecker';

/**
 * Returns true if this request was an Admin API call (and has been handled).
 */
export function handleAdminApi(req: IncomingMessage, res: ServerResponse): boolean {
  const parsed = url.parse(req.url || '', true);
  if (!parsed.pathname?.startsWith('/admin')) return false;

  if (!isAuthorized(req)) {
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Admin Area"' });
    res.end('Unauthorized');
    return true;
  }

  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', () => {
    try {
      const payload = JSON.parse(body);
      // Sticky-mode toggle
      if (parsed.pathname === '/admin/sticky-mode' && req.method === 'POST') {
        const mode = payload.mode;
        if (mode === 'ip-hash' || mode === 'cookie') {
          // We’ll update stickySessionMode in-memory elsewhere
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, mode }));
        }
      }
      // Dynamic server register
      if (parsed.pathname === '/admin/server/register' && req.method === 'POST') {
        const { host, port } = payload;
        registerServer({ host, port });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true }));
      }
      // Dynamic server deregister
      if (parsed.pathname === '/admin/server/deregister' && req.method === 'POST') {
        const { port } = payload;
        deregisterServer(port);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true }));
      }
      throw new Error();
    } catch {
      res.writeHead(400);
      return res.end('Invalid Admin Payload');
    }
  });

  return true;
}
