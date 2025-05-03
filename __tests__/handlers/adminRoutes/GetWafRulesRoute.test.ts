import fs from 'fs';
import { GetWafRulesRoute } from '../../../src/handlers/adminRoutes';

jest.mock('fs');

describe('GetWafRulesRoute', () => {
  const route = new GetWafRulesRoute();
  const dummyData = JSON.stringify({ patterns: ['one', 'two'] });

  beforeEach(() => {
    jest.resetAllMocks();
    (fs.readFileSync as jest.Mock).mockReturnValue(dummyData);
  });

  it('matches only GET /admin/waf/rules', () => {
    expect(route.matches('/admin/waf/rules', 'GET')).toBe(true);
    expect(route.matches('/admin/waf/rules', 'POST')).toBe(false);
    expect(route.matches('/admin/other', 'GET')).toBe(false);
  });

  it('reads rules file and returns JSON data', () => {
    const req: any = {};
    const res: any = {
      writeHead: jest.fn(),
      end: jest.fn(),
    };

    route.handle(req, res, {});

    expect(fs.readFileSync).toHaveBeenCalledWith(
      expect.any(String),
      'utf-8'
    );
    expect(res.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
    });
    expect(res.end).toHaveBeenCalledWith(dummyData);
  });
});
