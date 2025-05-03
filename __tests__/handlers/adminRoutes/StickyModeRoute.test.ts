import { StickyModeRoute } from '../../../src/handlers/adminRoutes';

describe('StickyModeRoute', () => {
  const route = new StickyModeRoute();

  it('matches the correct path and method', () => {
    expect(route.matches('/admin/sticky-mode', 'POST')).toBe(true);
    expect(route.matches('/admin/sticky-mode', 'GET')).toBe(false);
  });

  it('responds success for valid mode', () => {
    const req: any = {};
    const res: any = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const body = { mode: 'cookie' };

    route.handle(req, res, {}, body);
    expect(res.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
    });
    expect(res.end).toHaveBeenCalledWith(
      JSON.stringify({ success: true, mode: 'cookie' })
    );
  });

  it('responds 400 for invalid mode', () => {
    const req: any = {};
    const res: any = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const body = { mode: 'invalid' };

    route.handle(req, res, {}, body);
    expect(res.writeHead).toHaveBeenCalledWith(400);
    expect(res.end).toHaveBeenCalledWith('Invalid mode');
  });
});
