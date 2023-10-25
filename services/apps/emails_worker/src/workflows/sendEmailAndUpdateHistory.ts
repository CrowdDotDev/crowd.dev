import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { UserTenant } from '../types'

// Configure timeouts and retry policies to fetch content from third-party sources.
const { fetchFromEagleEye, fetchFromDatabase } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 seconds',
})

// Configure timeouts and retry policies to build the content of the email to send.
const { buildEmailContent } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 seconds',
})

// Configure timeouts and retry policies to actually send the email.
const { sendEmail } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 seconds',
})

// Configure timeouts and retry policies to update email history in the database.
const { updateEmailHistory, updateNextEmailAt } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
})

/*
sendEmailAndUpdateHistory is a Temporal workflow that:
  - [Async Activities]: Fetch posts from EagleEye API and the database.
  - [Activity]: Build the content of the email to send based on the posts
    previously found.
  - [Activity]: Actually send the email to the user's email address using the
    SendGrid API.
  - [Async Activities]: Update email history and digest status in the database.
*/
export async function sendEmailAndUpdateHistory(row: UserTenant): Promise<void> {
  const [fetchedFromEagleEye, fetchedFromDatabase] = await Promise.all([
    fetchFromEagleEye(row),
    fetchFromDatabase(row),
  ])

  // No need to continue the workflow if no data was fetched.
  if (fetchedFromEagleEye.length == 0 && fetchedFromDatabase.length == 0) {
    return
  }

  const content = await buildEmailContent({
    fromDatabase: fetchedFromDatabase,
    fromEagleEye: fetchedFromEagleEye,
  })

  // No need to continue the workflow if content of email built is empty.
  if (content.length == 0) {
    return
  }

  const email = await sendEmail({
    userId: row.userId,
    tenantId: row.tenantId,
    settings: row.settings,
    content: content,
  })

  await Promise.all([
    updateEmailHistory({
      ...row,
      sentAt: email.sentAt,
    }),
    updateNextEmailAt({
      ...row,
      sentAt: email.sentAt,
    }),
  ])
}
