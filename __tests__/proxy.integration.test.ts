// __tests__/proxy.integration.test.ts
import request from 'supertest';
import { startProxy, stopProxy } from '../src/proxy';  // export helpers

let servers: any;
beforeAll(async () => {
  servers = await startProxy();
});
afterAll(async () => {
  await stopProxy(servers);
});

test('IP-hash sticky session', async () => {
  const agent = request(servers.httpsServer);
  const res1 = await agent.get('/');
  const res2 = await agent.get('/');
  expect(res1.text).toEqual(res2.text);
});
