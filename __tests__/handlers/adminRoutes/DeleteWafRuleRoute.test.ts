import fs from 'fs';
import { DeleteWafRuleRoute } from '../../../src/handlers/adminRoutes';

jest.mock('fs');

describe('DeleteWafRuleRoute', () => {
  const route = new DeleteWafRuleRoute();

  beforeEach(() => {
    jest.resetAllMocks();
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify({ patterns: ['foo', 'bar'] })
    );
  });

  it('matches the correct path and method', () => {
    expect(route.matches('/admin/waf/rules', 'DELETE')).toBe(true);
    expect(route.matches('/admin/waf/rules', 'POST')).toBe(false);
  });

  it('removes the specified pattern and responds with updated file', () => {
    const req: any = {};
    const res: any = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const body = { pattern: 'foo' };

    route.handle(req, res, {}, body);

    expect(fs.readFileSync).toHaveBeenCalledWith(
      expect.any(String),
      'utf-8'
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify({ patterns: ['bar'] }, null, 2)
    );
    expect(res.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
    });
    expect(res.end).toHaveBeenCalledWith(
      JSON.stringify({ patterns: ['bar'] })
    );
  });
});
