import sendgrid, { MailDataRequired } from '@sendgrid/mail'
import moment from 'moment'

import { EmailSent, EmailToSend } from '../../types/email'

/*
eagleeyeSendEmail is a Temporal activity that sends an EagleEye digest email to
a user's email address using the SendGrid API.
*/
export async function eagleeyeSendEmail(toSend: EmailToSend): Promise<EmailSent> {
  const email: MailDataRequired = {
    to: toSend.settings.eagleEye.emailDigest?.email || toSend.email,
    from: {
      name: process.env['CROWD_SENDGRID_NAME_FROM'],
      email: process.env['CROWD_SENDGRID_EMAIL_FROM'],
    },
    templateId: process.env['CROWD_SENDGRID_TEMPLATE_EAGLE_EYE_DIGEST'],
    dynamicTemplateData: {
      content: toSend.content,
      frequency: toSend.settings.eagleEye.emailDigest.frequency,
      date: moment.utc().format('D MMM YYYY'),
      appHost: process.env['CROWD_API_FRONTEND_URL'],
    },
    customArgs: {
      tenantId: toSend.tenantId,
      userId: toSend.userId,
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
