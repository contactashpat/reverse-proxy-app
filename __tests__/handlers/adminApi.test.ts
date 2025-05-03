import { handleAdminApi } from '../../src/handlers/adminApi';
import { IncomingMessage, ServerResponse } from 'http';
import { isAuthorized } from '../../src/secureAdminApi';

jest.mock('../../src/secureAdminApi', () => ({
  isAuthorized: jest.fn(),
}));

describe('Admin API Dispatcher', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    jest.resetAllMocks();
    req = {
      url: '',
      method: '',
      headers: {},
      on: (event: string, cb: Function) => {
        if (event === 'data') return;
        if (event === 'end') cb();
      },
    } as any as IncomingMessage;
    res = {
      writeHead: jest.fn(),
      end: jest.fn(),
    } as unknown as ServerResponse;
  });

  it('returns false for non-/admin paths', () => {
    req.url = '/foo';
    req.method = 'GET';
    expect(handleAdminApi(req, res)).toBe(false);
  });

  it('401s when unauthorized', () => {
    req.url = '/admin/waf/rules';
    req.method = 'GET';
    (isAuthorized as jest.Mock).mockReturnValue(false);

    const result = handleAdminApi(req, res);
    expect(result).toBe(true);
    expect(res.writeHead).toHaveBeenCalledWith(
      401,
      { 'WWW-Authenticate': 'Basic realm="Admin Area"' }
    );
    expect(res.end).toHaveBeenCalledWith('Unauthorized');
  });

  it('404s when no route matches', () => {
    req.url = '/admin/unknown';
    req.method = 'GET';
    (isAuthorized as jest.Mock).mockReturnValue(true);

    handleAdminApi(req, res);
    // The 'end' callback should have been called via our stub
    expect(res.writeHead).toHaveBeenCalledWith(404);
    expect(res.end).toHaveBeenCalledWith('Not Found');
  });
});
