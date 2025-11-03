import settings from '../../config/settings';
import env from '../env';
import logger from '../logger';
import { getOpenBaoClient, isOpenBaoEnabled, readSecret } from '../common/openbaoClient';

let secretsPromise: Promise<void> | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildKvPath(relativePath: string): string {
  const mount = env.OPENBAO_KV_MOUNT.replace(/\/$/, '');
  const cleanedPath = relativePath.replace(/^\//, '');

  if (env.OPENBAO_KV_VERSION === 2) {
    return `${mount}/data/${cleanedPath}`;
  }

  return `${mount}/${cleanedPath}`;
}

async function fetchSecret(relativePath: string, attempt = 1): Promise<Record<string, any>> {
  try {
    const response = await readSecret(buildKvPath(relativePath));
    if (!response?.data) {
      return {};
    }
    if (env.OPENBAO_KV_VERSION === 2 && response.data.data) {
      return response.data.data as Record<string, any>;
    }
    return response.data as Record<string, any>;
  } catch (error: any) {
    const shouldRetry = attempt < env.OPENBAO_RETRY_ATTEMPTS;
    logger.warn(
      `⚠️ Attempt ${attempt} to read OpenBao secret at ${relativePath} failed: ${error.message}${
        shouldRetry ? ' – retrying' : ''
      }`
    );
    if (shouldRetry) {
      await sleep(env.OPENBAO_RETRY_DELAY_MS);
      return fetchSecret(relativePath, attempt + 1);
    }
    logger.error(`❌ Exhausted retries fetching OpenBao secret at ${relativePath}.`);
    return {};
  }
}

function applyAdminSecrets(secret: Record<string, any>): void {
  const username = secret.username ?? secret.admin_username;
  const password = secret.password ?? secret.admin_password;

  if (username) {
    settings.admin.username = username;
  }
  if (password) {
    settings.admin.password = password;
  }
}

function applyEmailSecrets(secret: Record<string, any>): void {
  const smtpUser = secret.smtp_user ?? secret.username;
  const smtpPass = secret.smtp_pass ?? secret.password;
  const sendgridKey = secret.sendgrid_api_key ?? secret.sendgridKey ?? secret.sendgrid;
  const smtpHost = secret.smtp_host;
  const smtpPort = secret.smtp_port;
  const from = secret.email_from ?? secret.from;
  const to = secret.email_to ?? secret.to;

  if (smtpUser) {
    settings.email.username = smtpUser;
  }
  if (smtpPass) {
    settings.email.password = smtpPass;
  }
  if (typeof smtpHost === 'string' && smtpHost.trim()) {
    settings.email.smtpHost = smtpHost.trim();
  }
  if (typeof smtpPort === 'number') {
    settings.email.smtpPort = smtpPort;
  } else if (typeof smtpPort === 'string' && smtpPort.trim().length > 0) {
    const parsed = parseInt(smtpPort, 10);
    if (!Number.isNaN(parsed)) {
      settings.email.smtpPort = parsed;
    }
  }
  if (from) {
    settings.email.from = from;
  }
  if (to) {
    settings.email.to = to;
  }
  if (sendgridKey) {
    settings.email.sendgridApiKey = sendgridKey;
  }
}

async function loadSecrets(): Promise<void> {
  if (!isOpenBaoEnabled()) {
    logger.debug('OpenBao integration disabled; using environment-based secrets.');
    return;
  }

  if (!getOpenBaoClient()) {
    logger.warn('OpenBao client unavailable. Falling back to environment secrets.');
    return;
  }

  const [adminSecret, emailSecret] = await Promise.all([
    fetchSecret(env.OPENBAO_ADMIN_SECRET_PATH),
    fetchSecret(env.OPENBAO_EMAIL_SECRET_PATH),
  ]);

  applyAdminSecrets(adminSecret);
  applyEmailSecrets(emailSecret);
}

export function ensureSecretsLoaded(): Promise<void> {
  if (!secretsPromise) {
    secretsPromise = loadAndLog();
  }
  return secretsPromise;
}

async function loadAndLog(): Promise<void> {
  await loadSecrets();
  logger.debug('Secret loading step completed.');
}
