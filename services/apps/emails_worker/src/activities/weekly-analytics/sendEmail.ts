import sendgrid, { MailDataRequired } from '@sendgrid/mail'

import { EmailToSend, EmailSent } from '../../types/email'

/*
sendEmail is a Temporal activity that sends an email to a user's email address
using the SendGrid API.
*/
export async function sendEmail(toSend: EmailToSend): Promise<EmailSent> {
  const email: MailDataRequired = {
    to: toSend.email,
    from: {
      name: process.env['CROWD_SENDGRID_NAME_FROM'],
      email: process.env['CROWD_SENDGRID_EMAIL_FROM'],
    },
    templateId: process.env['CROWD_SENDGRID_TEMPLATE_WEEKLY_ANALYTICS'],
    dynamicTemplateData: {
      ...toSend.content,
      appHost: process.env['CROWD_API_FRONTEND_URL'],
    },
  }

  try {
    await sendgrid.send(email)
  } catch (err) {
    throw new Error(err)
  }

  return {
    sentAt: new Date(),
  }
}
