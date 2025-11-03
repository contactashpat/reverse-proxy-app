import 'dotenv/config';
// src/env.ts - Environment variable validation with Zod
import { z, ZodIssueCode } from 'zod';
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
  ADMIN_USERNAME: z.string().default(''),
  ADMIN_PASSWORD: z.string().default(''),
  ALLOWED_ADMIN_IPS: z.string().default('127.0.0.1,::1'),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform(val => parseInt(val, 10)),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string(),
  EMAIL_TO: z.string(),
  WAF_RULES_PATH: z.string().default('config/waf-rules.json'),
  WAF_ENABLED: z.string().default('false').transform(val => val === 'true'),
  SENDGRID_API_KEY: z.string().default(''),
  OPENBAO_ENABLED: z.string().default('false').transform(val => val === 'true'),
  OPENBAO_ADDR: z.string().default(''),
  OPENBAO_TOKEN: z.string().default(''),
  OPENBAO_KV_MOUNT: z.string().default('secret'),
  OPENBAO_ADMIN_SECRET_PATH: z.string().default('reverse-proxy/admin'),
  OPENBAO_EMAIL_SECRET_PATH: z.string().default('reverse-proxy/email'),
  OPENBAO_KV_VERSION: z.string().default('2').transform(val => {
    const parsed = parseInt(val, 10);
    return Number.isNaN(parsed) ? 2 : parsed;
  }),
  OPENBAO_TIMEOUT_MS: z.string().default('5000').transform(val => {
    const parsed = parseInt(val, 10);
    return Number.isNaN(parsed) ? 5000 : parsed;
  }),
  OPENBAO_RETRY_ATTEMPTS: z.string().default('5').transform(val => {
    const parsed = parseInt(val, 10);
    return Number.isNaN(parsed) ? 5 : parsed;
  }),
  OPENBAO_RETRY_DELAY_MS: z.string().default('1000').transform(val => {
    const parsed = parseInt(val, 10);
    return Number.isNaN(parsed) ? 1000 : parsed;
  }),
}).superRefine((data, ctx) => {
  if (data.OPENBAO_ENABLED) {
    if (!data.OPENBAO_ADDR) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'OPENBAO_ADDR is required when OpenBao integration is enabled.',
      });
    }
    if (!data.OPENBAO_TOKEN) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'OPENBAO_TOKEN is required when OpenBao integration is enabled.',
      });
    }
  }
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Environment variable validation error:', parsed.error.format());
  process.exit(1);
}

export default parsed.data;
