// src/env.ts - Environment variable validation with Zod
import { z } from 'zod';
import { BackendServer } from './types';

const envSchema = z.object({
  SSL_KEY_PATH: z.string(),
  SSL_CERT_PATH: z.string(),
  HTTP_REDIRECT_PORT: z.string().transform(val => parseInt(val, 10)),
  HTTPS_PORT: z.string().transform(val => parseInt(val, 10)),
  STICKY_SESSION_MODE: z.enum(['ip-hash', 'cookie']).default('ip-hash'),
  RATE_LIMIT_REQUESTS: z.string().transform(val => parseInt(val, 10)).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val, 10)).default('60000'),
  ALLOWED_IPS: z.string().default('127.0.0.1,::1'),
  BACKEND_SERVERS: z.string()
    .default('[{"host":"localhost","port":3001},{"host":"localhost","port":3002},{"host":"localhost","port":3003}]')
    .transform(val => JSON.parse(val) as BackendServer[]),
  ADMIN_USERNAME: z.string(),
  ADMIN_PASSWORD: z.string(),
  ALLOWED_ADMIN_IPS: z.string().default('127.0.0.1,::1'),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform(val => parseInt(val, 10)),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  EMAIL_FROM: z.string(),
  EMAIL_TO: z.string(),
  WAF_RULES_PATH: z.string().default('config/waf-rules.json'),
  WAF_ENABLED: z.string().default('false').transform(val => val === 'true'),
  SENDGRID_API_KEY: z.string(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Environment variable validation error:', parsed.error.format());
  process.exit(1);
}

export default parsed.data;
