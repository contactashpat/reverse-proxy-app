import sgMail from '@sendgrid/mail';
import settings from '../config/settings';

sgMail.setApiKey(settings.email.sendgridApiKey);

export async function sendAlertEmail(subject: string, text: string) {
  const msg = {
    to: settings.email.to,
    from: settings.email.from,
    subject,
    text,
  };
  const [response] = await sgMail.send(msg);
  return response;
}
