// src/emailAlert.ts – HTTP API–based alerting via SendGrid
import logger from './logger';
import { sendAlertEmail } from './sendgridClient';

/**
 * Send an alert email using SendGrid HTTP API.
 * @param subject The message subject
 * @param message The message body
 */
export async function sendAlert(subject: string, message: string): Promise<void> {
  try {
    const response = await sendAlertEmail(subject, message);
    if (!response) {
      logger.info('📧 Email alerts are disabled; skipping SendGrid send.');
      return;
    }
    // Extract SendGrid message ID from headers
    const messageId = (response.headers?.['x-message-id'] || response.headers?.['x-message-id'.toLowerCase()]) as string;
    logger.info(`📧 Alert email sent: ${messageId}`);
  } catch (err: any) {
    logger.error(`❌ SendGrid email failed: ${err.message}`);
  }
}
