// src/healthChecker.ts - Backend health monitoring and dynamic discovery

import http from 'http';
import settings from '../config/settings';
import { BackendServer } from './types';
import { sendAlert } from './emailAlert';

export let allServers: BackendServer[] = [...settings.proxy.backendServers];
export let healthyServers: BackendServer[] = [...allServers];
const unhealthyServers = new Set<number>();

import logger from './logger';

// assume you have:
// const allServers: BackendServer[] = [...]
// const unhealthyServers = new Set<number>();

export async function checkServerHealth(): Promise<void> {
  const checks = allServers.map(server =>
    new Promise<void>(resolve => {
      const url = `http://${server.host}:${server.port}/health`;
      const req = http.get(url, async res => {
        if (res.statusCode === 200) {
          // only alert on recovery
          if (unhealthyServers.has(server.port)) {
            unhealthyServers.delete(server.port);
            logger.info(`✅ Server ${server.port} is back online.`);
            await sendAlert(
              `Backend ${server.port} is back online`,
              `The backend on port ${server.port} has recovered.`
            );
          }
        } else {
          // only alert once per down
          if (!unhealthyServers.has(server.port)) {
            unhealthyServers.add(server.port);
            logger.warn(`❌ Server ${server.port} is down.`);
            await sendAlert(
              `Backend ${server.port} is down`,
              `The backend on port ${server.port} failed its health check.`
            );
          }
        }
        resolve();
      });

      req.on('error', async () => {
        if (!unhealthyServers.has(server.port)) {
          unhealthyServers.add(server.port);
          logger.warn(`❌ Server ${server.port} is down (network error).`);
          await sendAlert(
            `Backend ${server.port} is down`,
            `The backend on port ${server.port} is unreachable.`
          );
        }
        resolve();
      });
    })
  );

  // Wait until every single check (and its alerts) is done
  await Promise.all(checks);
}
function markUnhealthy(server: BackendServer): void {
  healthyServers = healthyServers.filter(s => s.port !== server.port);
  if (!unhealthyServers.has(server.port)) {
    console.warn(`❌ Server ${server.port} is down.`);
    sendAlert(`Server Down: ${server.port}`, `Server on port ${server.port} is DOWN or UNHEALTHY.`);
    unhealthyServers.add(server.port);
  }
}

export function registerServer(server: BackendServer): void {
  if (!allServers.find(s => s.port === server.port)) {
    allServers.push(server);
    console.log(`➕ Registered backend: ${server.host}:${server.port}`);
  }
}

export function deregisterServer(port: number): void {
  allServers = allServers.filter(s => s.port !== port);
  healthyServers = healthyServers.filter(s => s.port !== port);
  unhealthyServers.delete(port);
  console.log(`➖ Deregistered backend: port ${port}`);
}

setInterval(checkServerHealth, 5000);
