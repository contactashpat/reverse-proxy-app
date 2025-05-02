import { IncomingMessage } from 'http';
import settings from '../config/settings';

function parseAuthorizationHeader(header?: string): { username: string, password: string } | null {
  if (!header || !header.startsWith('Basic ')) return null;
  const base64Credentials = header.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  return { username, password };
}

export function isAuthorized(req: IncomingMessage): boolean {
  const clientIp = req.socket.remoteAddress || '';
  if (!settings.admin.allowedAdminIps.includes(clientIp)) {
    console.warn(`Blocked IP: ${clientIp}`);
    return false;
  }

  const authHeader = req.headers['authorization'];
  const credentials = parseAuthorizationHeader(authHeader);

  if (!credentials) {
    console.warn('Missing or invalid Authorization header');
    return false;
  }

  const { username, password } = credentials;
  if (
    username === settings.admin.username &&
    password === settings.admin.password
  ) {
    return true;
  }

  console.warn(`Invalid credentials attempt from ${clientIp}`);
  return false;
}
