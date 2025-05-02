// config/settings.ts - Load validated settings
import env from '../src/env';
import { AppSettings } from '../src/types';

const settings: AppSettings = {
  ssl: {
    keyPath: env.SSL_KEY_PATH,
    certPath: env.SSL_CERT_PATH,
  },
  proxy: {
    httpsPort: env.HTTPS_PORT,
    httpRedirectPort: env.HTTP_REDIRECT_PORT,
    stickySessionMode: env.STICKY_SESSION_MODE,
    rateLimit: {
      requests: env.RATE_LIMIT_REQUESTS,
      windowMs: env.RATE_LIMIT_WINDOW_MS,
    },
    allowedIps: env.ALLOWED_IPS.split(','),
    backendServers: env.BACKEND_SERVERS,
  },
  admin: {
    username: env.ADMIN_USERNAME,
    password: env.ADMIN_PASSWORD,
    allowedAdminIps: env.ALLOWED_ADMIN_IPS.split(','),
  },
  email: {
    smtpHost: env.SMTP_HOST,
    smtpPort: env.SMTP_PORT,
    username: env.SMTP_USER,
    password: env.SMTP_PASS,
    from: env.EMAIL_FROM,
    to: env.EMAIL_TO,
    sendgridApiKey: env.SENDGRID_API_KEY,
  },
  waf: {
    enabled: env.WAF_ENABLED,
    rulesPath: env.WAF_RULES_PATH,
  },
};

export default settings;
