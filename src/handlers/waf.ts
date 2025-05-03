// src/handlers/waf.ts
import fs from 'fs';
import path from 'path';
import { IncomingMessage, ServerResponse } from 'http';
import settings from '../../config/settings';
import chokidar from 'chokidar';

interface WAFRules {
  patterns: string[];
}

const configPath = path.resolve(settings.waf.rulesPath);
let rules: RegExp[] = [];

/** Load the JSON rules file and compile regexes */
function loadRules(): void {
  let raw: string;
  try {
    raw = fs.readFileSync(configPath, 'utf-8');
  } catch {
    // Missing or unreadable rules file → clear rules
    rules = [];
    return;
  }
  let parsed: WAFRules;
  try {
    parsed = JSON.parse(raw) as WAFRules;
  } catch {
    // Invalid JSON → clear rules
    rules = [];
    return;
  }
  if (!parsed.patterns || !Array.isArray(parsed.patterns)) {
    // Malformed structure → clear rules
    rules = [];
    return;
  }
  rules = parsed.patterns.map(pat => new RegExp(pat, 'i'));
}

// Initial load & watch for changes
loadRules();
chokidar.watch(configPath, { ignoreInitial: true })
  .on('add', loadRules)
  .on('change', loadRules)
  .on('unlink', loadRules);

/**
 * Manually trigger a reload (e.g. from Admin API)
 */
export function reloadRules(): void {
  loadRules();
}

/**
 * Apply WAF rules to an incoming request.
 * @param req The HTTP request object
 * @param res The HTTP response object
 * @returns true if blocked (response sent), false otherwise
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
