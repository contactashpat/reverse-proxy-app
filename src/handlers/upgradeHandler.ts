// src/handlers/upgradeHandler.ts
import httpProxy from 'http-proxy';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { handleWebSocketUpgrade } from '../websocketHandler';

// Single proxy instance for WebSocket upgrades
const proxy = httpProxy.createProxyServer({});

/**
 * WebSocket upgrade handler.
 * @param req HTTP incoming message
 * @param socket Network socket
 * @param head Buffer containing the first packet of the upgraded stream
 */
export function handleUpgrade(
  req: IncomingMessage,
  socket: Socket,
  head: Buffer
): void {
  handleWebSocketUpgrade(proxy, req, socket, head);
}
