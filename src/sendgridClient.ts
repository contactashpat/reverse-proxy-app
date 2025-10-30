import sgMail from '@sendgrid/mail';
import type { ClientResponse } from '@sendgrid/mail';
import settings from '../config/settings';
import logger from './logger';

const apiKey = settings.email.sendgridApiKey?.trim();

if (apiKey) {
  sgMail.setApiKey(apiKey);
} else {
  logger.warn('SendGrid API key not provided; email alerts disabled.');
}

export async function sendAlertEmail(subject: string, text: string): Promise<ClientResponse | null> {
  if (!apiKey) {
    logger.debug('Skipping SendGrid alert send; API key missing.');
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
