import { RegisterServerRoute } from '../../../src/handlers/adminRoutes';
import * as healthChecker from '../../../src/healthChecker';

jest.mock('../../../src/healthChecker');

describe('RegisterServerRoute', () => {
  const route = new RegisterServerRoute();

  it('matches only POST /admin/server/register', () => {
    expect(route.matches('/admin/server/register', 'POST')).toBe(true);
    expect(route.matches('/admin/server/register', 'GET')).toBe(false);
    expect(route.matches('/admin/server/deregister', 'POST')).toBe(false);
  });

  it('registers a server and responds with success', () => {
    const req: any = {};
    const res: any = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const body = { host: '127.0.0.1', port: 5999 };

    route.handle(req, res, {}, body);

    expect(healthChecker.registerServer).toHaveBeenCalledWith({
      host: '127.0.0.1',
      port: 5999,
    });
    expect(res.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
    });
    expect(res.end).toHaveBeenCalledWith(
      JSON.stringify({ success: true })
    );
  });
});
