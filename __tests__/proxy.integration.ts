// __tests__/proxy.integration.ts
import request from 'supertest';
import { startProxy, stopProxy } from '../src/proxy';  // export helpers

let server;
beforeAll(async () => { server = await startProxy(); });
afterAll(() => stopProxy(server));

test('IP-hash sticky session', async () => {
  const res1 = await request(server).get('/');
  const res2 = await request(server).get('/');
  expect(res1.text).toEqual(res2.text);
});
