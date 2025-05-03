import fs from 'fs';
import { AddWafRuleRoute } from '../../../src/handlers/adminRoutes';

jest.mock('fs');

describe('AddWafRuleRoute', () => {
  const route = new AddWafRuleRoute();

  beforeEach(() => {
    jest.resetAllMocks();
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify({ patterns: [] })
    );
  });

  it('matches the correct path and method', () => {
    expect(route.matches('/admin/waf/rules', 'POST')).toBe(true);
    expect(route.matches('/admin/waf/rules', 'GET')).toBe(false);
  });

  it('adds a new pattern and responds with updated file', () => {
    const req: any = {};
    const res: any = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    const body = { pattern: 'evil' };

    route.handle(req, res, {}, body);

    expect(fs.readFileSync).toHaveBeenCalledWith(
      expect.any(String),
      'utf-8'
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify({ patterns: ['evil'] }, null, 2)
    );
    expect(res.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
    });
    expect(res.end).toHaveBeenCalledWith(
      JSON.stringify({ patterns: ['evil'] })
    );
  });
});
