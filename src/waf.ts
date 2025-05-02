// src/waf.ts
import fs from 'fs';
import path from 'path';
import { IncomingMessage, ServerResponse } from 'http';
import settings from '../config/settings';

interface WAFRules {
  patterns: string[];
}

// Load and compile regex patterns
const configPath = path.resolve(settings.waf.rulesPath);
const raw = fs.readFileSync(configPath, 'utf-8');
const { patterns } = JSON.parse(raw) as WAFRules;
const rules = patterns.map(pat => new RegExp(pat, 'i'));

/**
 * Apply WAF rules to a request.
 * @returns true if the request was blocked (response sent), false otherwise.
 */
export function applyWAF(req: IncomingMessage, res: ServerResponse): boolean {
  const target = req.url || '';
  for (const rule of rules) {
    if (rule.test(target)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return true;
    }
  }
  return false;
}
