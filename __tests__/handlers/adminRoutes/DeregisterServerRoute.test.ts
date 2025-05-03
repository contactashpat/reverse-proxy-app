import { DeregisterServerRoute } from '../../../src/handlers/adminRoutes';
import * as healthChecker from '../../../src/healthChecker';

jest.mock('../../../src/healthChecker');

describe('DeregisterServerRoute', () => {
  const route = new DeregisterServerRoute();

  it('matches only POST /admin/server/deregister', () => {
    expect(route.matches('/admin/server/deregister', 'POST')).toBe(true);
    expect(route.matches('/admin/server/deregister', 'GET')).toBe(false);
    expect(route.matches('/admin/server/register', 'POST')).toBe(false);
  });

  it('deregisters a server and responds with success', () => {
    const req: any = {};
    const res: any = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const body = { port: 5999 };

    route.handle(req, res, {}, body);

    expect(healthChecker.deregisterServer).toHaveBeenCalledWith(5999);
    expect(res.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
    });
    expect(res.end).toHaveBeenCalledWith(
      JSON.stringify({ success: true })
    );
  });
});
