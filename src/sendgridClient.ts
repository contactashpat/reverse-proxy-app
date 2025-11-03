import sgMail from '@sendgrid/mail';
import type { ClientResponse } from '@sendgrid/mail';
import settings from '../config/settings';
import logger from './logger';
import { ensureSecretsLoaded } from './secrets/openbaoSecrets';

let cachedApiKey: string | null = null;
let missingKeyWarned = false;

async function ensureClientReady(): Promise<boolean> {
  await ensureSecretsLoaded();

  const apiKey = settings.email.sendgridApiKey?.trim();
  if (!apiKey) {
    if (!missingKeyWarned) {
      logger.warn('SendGrid API key not available; email alerts disabled.');
      missingKeyWarned = true;
    }
    return false;
  }

  if (cachedApiKey !== apiKey) {
    sgMail.setApiKey(apiKey);
    cachedApiKey = apiKey;
    missingKeyWarned = false;
  }

  return true;
}

export async function sendAlertEmail(subject: string, text: string): Promise<ClientResponse | null> {
  const ready = await ensureClientReady();
  if (!ready) {
    return null;
  }
  const msg = {
    to: settings.email.to,
    from: settings.email.from,
    subject,
    text,
  };
  const [response] = await sgMail.send(msg);
  return response;
}
