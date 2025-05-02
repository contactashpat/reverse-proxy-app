// waf.test.ts
import { applyWAF } from '../src/waf';

describe('Web Application Firewall (WAF)', () => {
  it('blocks requests matching malicious patterns', () => {
    const req: any = { url: '/etc/passwd?debug=true' };
    const res: any = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };

    const blocked = applyWAF(req, res);

    expect(blocked).toBe(true);
    expect(res.writeHead).toHaveBeenCalledWith(403, { 'Content-Type': 'text/plain' });
    expect(res.end).toHaveBeenCalledWith('Forbidden');
  });

  it('allows requests that do not match any pattern', () => {
    const req: any = { url: '/api/v1/users?limit=10' };
    const res: any = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };

    const blocked = applyWAF(req, res);

    expect(blocked).toBe(false);
    expect(res.writeHead).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
  });
});
