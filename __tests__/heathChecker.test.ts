// __tests__/healthChecker.test.ts
import { allServers, checkServerHealth } from '../src/healthChecker';
import { sendAlert } from '../src/emailAlert';

// Mock the sendAlert function
jest.mock('../src/emailAlert', () => ({
  sendAlert: jest.fn(),
}));

describe('Health Checker Email Alerts', () => {
  beforeEach(() => {
    // Clear servers and mock state
    allServers.length = 0;
    (sendAlert as jest.Mock).mockClear();
  });

  it('should send an alert when a backend is down', async () => {
    // Add a server that will fail (port not listening)
    allServers.push({ host: '127.0.0.1', port: 59999 });

    // Run the health check
    await checkServerHealth();

    expect(sendAlert).toHaveBeenCalledTimes(1);
    const [subject, message] = (sendAlert as jest.Mock).mock.calls[0];
    expect(subject).toMatch(/is down/);
    expect(message).toContain('59999');
  });

  it('should send a recovery alert when a backend comes back online', async () => {
    // Simulate initial down
    allServers.push({ host: '127.0.0.1', port: 59998 });
    await checkServerHealth();
    expect(sendAlert).toHaveBeenCalledTimes(1);

    // Clear mock and start a dummy HTTP server on that port
    (sendAlert as jest.Mock).mockClear();
    const http = require('http');
    const server = http.createServer((req: any, res: any) => {
      if (req.url === '/health') res.end('OK');
      else res.end('Hello');
    }).listen(59998);

    // Run health check again
    await checkServerHealth();

    expect(sendAlert).toHaveBeenCalledTimes(1);
    const [subject] = (sendAlert as jest.Mock).mock.calls[0];
    expect(subject).toMatch(/back online/);

    server.close();
  });
});
