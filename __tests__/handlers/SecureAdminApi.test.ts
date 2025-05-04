import { isAuthorized } from '../../src/secureAdminApi';
import settings from '../../config/settings';
import {IncomingMessage} from "http";

describe('secureAdminApi.isAuthorized', () => {
  beforeAll(() => {
    // force a known admin and IP whitelist
    settings.admin.username = 'adminuser';
    settings.admin.password = 'securepassword';
    settings.admin.allowedAdminIps = ['127.0.0.1', '::1', '192.168.65.1'];
  });

  function makeReq(auth?: string, remoteAddress = '127.0.0.1') {
    return {
      headers: auth ? { authorization: auth } : {},
      socket: { remoteAddress },
    } as any as IncomingMessage;
  }

  it('accepts correct Basic creds from allowed IP', () => {
    const cred = Buffer.from('adminuser:securepassword').toString('base64');
    const req = makeReq(`Basic ${cred}`, '127.0.0.1');
    expect(isAuthorized(req)).toBe(true);
  });

  it('rejects bad credentials', () => {
    const cred = Buffer.from('adminuser:wrongpass').toString('base64');
    const req = makeReq(`Basic ${cred}`, '127.0.0.1');
    expect(isAuthorized(req)).toBe(false);
  });

  it('rejects missing header', () => {
    expect(isAuthorized(makeReq(undefined))).toBe(false);
  });

  it('rejects disallowed IP', () => {
    const cred = Buffer.from('adminuser:securepassword').toString('base64');
    const req = makeReq(`Basic ${cred}`, '10.0.0.5');
    expect(isAuthorized(req)).toBe(false);
  });
});
