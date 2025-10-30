// src/healthChecker.ts - Backend health monitoring and dynamic discovery

import http from 'http';
import settings from '../config/settings';
import { BackendServer } from './types';
import { sendAlert } from './emailAlert';

export let allServers: BackendServer[] = [...settings.proxy.backendServers];
export let healthyServers: BackendServer[] = [...allServers];
const unhealthyServers = new Set<number>();

import logger from './logger';

const serverKey = (server: BackendServer): string => `${server.host}:${server.port}`;

function findServer(host: string, port: number): BackendServer | undefined {
  return allServers.find(s => s.host === host && s.port === port);
}

function refreshHealthyServers(): void {
  healthyServers = allServers.filter(server => !unhealthyServers.has(server.port));
}

async function markHealthy(server: BackendServer): Promise<void> {
  const wasUnhealthy = unhealthyServers.delete(server.port);
  refreshHealthyServers();
  if (wasUnhealthy) {
    logger.info(`✅ Server ${server.port} is back online.`);
    await sendAlert(
      `Backend ${server.port} is back online`,
      `The backend on port ${server.port} has recovered.`
    );
  }
}

async function markUnhealthy(server: BackendServer, reason: string): Promise<void> {
  const isNewlyUnhealthy = !unhealthyServers.has(server.port);
  unhealthyServers.add(server.port);
  refreshHealthyServers();
  if (isNewlyUnhealthy) {
    logger.warn(`❌ Server ${server.port} is down (${reason}).`);
    await sendAlert(
      `Backend ${server.port} is down`,
      `The backend on port ${server.port} failed its health check (${reason}).`
    );
  }
}

export async function checkServerHealth(): Promise<void> {
  const checks = allServers.map(server =>
    new Promise<void>(resolve => {
      const url = `http://${server.host}:${server.port}/health`;
      const req = http.get(url, async res => {
        if (res.statusCode === 200) {
          await markHealthy(server);
        } else {
          await markUnhealthy(server, `status ${res.statusCode}`);
        }
        resolve();
      });

      req.on('error', async () => {
        await markUnhealthy(server, 'network error');
        resolve();
      });
    })
  );

  // Wait until every single check (and its alerts) is done
  await Promise.all(checks);
}

export function markServerUnhealthy(host: string, port: number, reason: string): void {
  const server = findServer(host, port);
  if (!server) {
    logger.warn(`⚠️ Received failure report for unknown backend ${host}:${port}`);
    return;
  }
  markUnhealthy(server, reason).catch(err =>
    logger.error(`❌ Failed to mark backend ${serverKey(server)} unhealthy: ${err.message}`)
  );
}

export function markTargetUnhealthy(targetUrl: string, reason: string): void {
  try {
    const parsed = new URL(targetUrl);
    const port = parseInt(parsed.port || (parsed.protocol === 'https:' ? '443' : '80'), 10);
    if (Number.isNaN(port)) {
      logger.warn(`⚠️ Unable to extract port from target ${targetUrl}`);
      return;
    }
    markServerUnhealthy(parsed.hostname, port, reason);
  } catch (err: any) {
    logger.error(`❌ Failed to parse target URL "${targetUrl}": ${err.message}`);
  }
}

export function registerServer(server: BackendServer): void {
  if (!allServers.find(s => s.port === server.port)) {
    allServers.push(server);
    console.log(`➕ Registered backend: ${server.host}:${server.port}`);
    refreshHealthyServers();
  }
}

export function deregisterServer(port: number): void {
  allServers = allServers.filter(s => s.port !== port);
  healthyServers = healthyServers.filter(s => s.port !== port);
  unhealthyServers.delete(port);
  console.log(`➖ Deregistered backend: port ${port}`);
}

setInterval(checkServerHealth, 5000);
checkServerHealth().catch(err =>
  logger.error(`❌ Initial backend health check failed: ${err instanceof Error ? err.message : err}`)
);
