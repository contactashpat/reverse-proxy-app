// src/handlers/adminApi.ts
import url from 'url';
import { IncomingMessage, ServerResponse } from 'http';
import { isAuthorized } from '../secureAdminApi';
import {
  GetWafRulesRoute,
  AddWafRuleRoute,
  DeleteWafRuleRoute,
  StickyModeRoute,
  RegisterServerRoute,
  DeregisterServerRoute,
} from './adminRoutes';

/**
 * Returns true if this request was an Admin API call (and has been handled).
 */
export function handleAdminApi(req: IncomingMessage, res: ServerResponse): boolean {
  const routes = [
    new GetWafRulesRoute(),
    new AddWafRuleRoute(),
    new DeleteWafRuleRoute(),
    new StickyModeRoute(),
    new RegisterServerRoute(),
    new DeregisterServerRoute(),
  ];

  const parsedUrl = url.parse(req.url || '', true);
  const { pathname = '', query } = parsedUrl;
  if (pathname && !pathname.startsWith('/admin')) return false;

  // Authorization
  if (!isAuthorized(req)) {
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Admin Area"' });
    res.end('Unauthorized');
    return true;
  }

  // Collect body for non-GET methods
  let bodyData = '';
  req.on('data', chunk => (bodyData += chunk));
  req.on('end', () => {
    const body = bodyData ? JSON.parse(bodyData) : undefined;

    // Dispatch to the first matching route
    for (const route of routes) {
      if (pathname && route.matches(pathname, req.method || 'GET')) {
        return route.handle(req, res, query, body);
      }
    }

    // No route matched
    res.writeHead(404);
    res.end('Not Found');
  });

  return true;
}
