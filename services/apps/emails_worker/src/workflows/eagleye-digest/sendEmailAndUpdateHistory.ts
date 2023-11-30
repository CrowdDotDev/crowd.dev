import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'
import { UserTenant } from '../../types/user'

// Configure timeouts and retry policies to fetch content from third-party sources.
const { eagleeyeFetchFromEagleEye, eagleeyeFetchFromDatabase } = proxyActivities<typeof activities>(
  {
    startToCloseTimeout: '10 seconds',
  },
)

// Configure timeouts and retry policies to build the content of the email to send.
const { eagleeyeBuildEmailContent } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 seconds',
})

// Configure timeouts and retry policies to actually send the email.
const { eagleeyeSendEmail } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 seconds',
})

// Configure timeouts and retry policies to update email history in the database.
const { updateEmailHistory, eagleeyeUpdateNextEmailAt } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
})

/*
eagleeyeSendEmailAndUpdateHistory is a Temporal workflow that:
  - [Async Activities]: Fetch posts from EagleEye API and the database.
  - [Activity]: Build the content of the email to send based on the posts
    previously found.
  - [Activity]: Actually send the email to the user's email address using the
    SendGrid API.
  - [Async Activities]: Update email history and digest status in the database.
*/
export async function eagleeyeSendEmailAndUpdateHistory(row: UserTenant): Promise<void> {
  const [fetchedFromEagleEye, fetchedFromDatabase] = await Promise.all([
    eagleeyeFetchFromEagleEye(row),
    eagleeyeFetchFromDatabase(row),
  ])

  // No need to continue the workflow if no data was fetched.
  if (fetchedFromEagleEye.length == 0 && fetchedFromDatabase.length == 0) {
    return
  }

  const content = await eagleeyeBuildEmailContent({
    fromDatabase: fetchedFromDatabase,
    fromEagleEye: fetchedFromEagleEye,
  })

  // No need to continue the workflow if content of email built is empty. But we
  // still need to make sure the next EagleEeye email digest will be sent on daily
  // or weekly basis so the email address is not retrieved on the next run.
  if (content.length == 0) {
    eagleeyeUpdateNextEmailAt({
      ...row,
      type: 'eagle-eye-digest',
      emails: [row.settings.eagleEye.emailDigest?.email || row.email],
      sentAt: new Date(Date.now()),
    })

    return
  }

  const email = await eagleeyeSendEmail({
    email: row.email,
    userId: row.userId,
    tenantId: row.tenantId,
    settings: row.settings,
    content: content,
  })

  await Promise.all([
    updateEmailHistory({
      ...row,
      type: 'eagle-eye-digest',
      emails: [row.settings.eagleEye.emailDigest?.email || row.email],
      sentAt: email.sentAt,
    }),
    eagleeyeUpdateNextEmailAt({
      ...row,
      type: 'eagle-eye-digest',
      emails: [row.settings.eagleEye.emailDigest?.email || row.email],
      sentAt: email.sentAt,
    }),
  ])
}
