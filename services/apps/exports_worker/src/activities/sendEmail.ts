import sendgrid, { MailDataRequired } from '@sendgrid/mail'

import { EmailSent, EmailToSend } from '../types/email'

/*
exportSendEmail is a Temporal activity that sends an email to a user's email address
using the SendGrid API. It contains the link to the S3 pre-signed URL previously
created.

The link can sometimes be "null". This is expected. If previous activities of the
workflow failed for some reasons, we still send an email to the user. The dynamic
template in SendGrid informs the user if the CSV export was a success or not based
on the link value. If the link is indeed "null" then the export failed, otherwsie
it's a success and the link points to the S3 pre-signed URL.
*/
export async function exportSendEmail(input: EmailToSend): Promise<EmailSent> {
  const email: MailDataRequired = {
    to: input.sendTo,
    from: {
      name: process.env['CROWD_SENDGRID_NAME_FROM'],
      email: process.env['CROWD_SENDGRID_EMAIL_FROM'],
    },
    templateId: process.env['CROWD_SENDGRID_TEMPLATE_CSV_EXPORT'],
    dynamicTemplateData: {
      link: input.link,
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
