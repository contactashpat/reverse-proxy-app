// src/handlers/adminRoutes/adminRoutes.ts
import fs from 'fs';
import { ParsedUrlQuery } from 'querystring';
import { IncomingMessage, ServerResponse } from 'http';
import settings from '../../config/settings';
import { reloadRules } from './waf';
import { AdminRoute } from './adminRoute';
import { registerServer, deregisterServer } from '../healthChecker';

// List current WAF rules
export class GetWafRulesRoute implements AdminRoute {
  matches(pathname: string, method: string): boolean {
    return pathname === '/admin/waf/rules' && method === 'GET';
  }
  handle(req: IncomingMessage, res: ServerResponse, query: ParsedUrlQuery): void {
    const data = fs.readFileSync(settings.waf.rulesPath, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(data);
  }
}

// Add a new WAF rule
export class AddWafRuleRoute implements AdminRoute {
  matches(pathname: string, method: string): boolean {
    return pathname === '/admin/waf/rules' && method === 'POST';
  }
  handle(req: IncomingMessage, res: ServerResponse, query: ParsedUrlQuery, body: any): void {
    const file = JSON.parse(fs.readFileSync(settings.waf.rulesPath, 'utf-8'));
    if (!file.patterns.includes(body.pattern)) {
      file.patterns.push(body.pattern);
      fs.writeFileSync(settings.waf.rulesPath, JSON.stringify(file, null, 2));
      reloadRules();
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(file));
  }
}

// Remove an existing WAF rule
export class DeleteWafRuleRoute implements AdminRoute {
  matches(pathname: string, method: string): boolean {
    return pathname === '/admin/waf/rules' && method === 'DELETE';
  }
  handle(req: IncomingMessage, res: ServerResponse, query: ParsedUrlQuery, body: any): void {
    const file = JSON.parse(fs.readFileSync(settings.waf.rulesPath, 'utf-8'));
    file.patterns = file.patterns.filter((p: string) => p !== body.pattern);
    fs.writeFileSync(settings.waf.rulesPath, JSON.stringify(file, null, 2));
    reloadRules();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(file));
  }
}

// Toggle sticky session mode
export class StickyModeRoute implements AdminRoute {
  matches(pathname: string, method: string): boolean {
    return pathname === '/admin/sticky-mode' && method === 'POST';
  }
  handle(req: IncomingMessage, res: ServerResponse, query: ParsedUrlQuery, body: any): void {
    const mode = body.mode;
    if (mode === 'ip-hash' || mode === 'cookie') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, mode }));
    } else {
      res.writeHead(400);
      res.end('Invalid mode');
    }
  }
}

// Register a dynamic backend
export class RegisterServerRoute implements AdminRoute {
  matches(pathname: string, method: string): boolean {
    return pathname === '/admin/server/register' && method === 'POST';
  }
  handle(req: IncomingMessage, res: ServerResponse, query: ParsedUrlQuery, body: any): void {
    registerServer({ host: body.host, port: body.port });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  }
}

// Deregister a dynamic backend
export class DeregisterServerRoute implements AdminRoute {
  matches(pathname: string, method: string): boolean {
    return pathname === '/admin/server/deregister' && method === 'POST';
  }
  handle(req: IncomingMessage, res: ServerResponse, query: ParsedUrlQuery, body: any): void {
    deregisterServer(body.port);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  }
}
