// src/handlers/adminRoutes/adminRoute.ts
import { IncomingMessage, ServerResponse } from 'http';
import { ParsedUrlQuery } from 'querystring';

/**
 * Represents a pluggable Admin API route.
 * Each route decides if it matches an incoming request
 * and handles the request if so.
 */
export interface AdminRoute {
  /**
   * Return true if this route should handle the request.
   * @param pathname The URL pathname (e.g. '/admin/waf/rules')
   * @param method   The HTTP method (e.g. 'GET')
   */
  matches(pathname: string, method: string): boolean;

  /**
   * Handle the request. Must send a response on res.
   * @param req    The incoming HTTP request
   * @param res    The server response
   * @param query  Parsed querystring parameters for GET/DELETE
   * @param body   Parsed JSON body for POST/DELETE (optional)
   */
  handle(
    req: IncomingMessage,
    res: ServerResponse,
    query: ParsedUrlQuery,
    body?: any
  ): void;
}
