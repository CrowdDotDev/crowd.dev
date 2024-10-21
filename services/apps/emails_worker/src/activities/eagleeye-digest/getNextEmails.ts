import * as eagleeye from '@crowd/data-access-layer/src/old/apps/emails_worker/eagleeye'

import { svc } from '../../main'
import { UserTenant } from '../../types/user'

/*
eagleeyeGetNextEmails is a Temporal activity that fetches all users along their
EagleEye settings to send emails to. This relies on some settings, such as when
the next email should send at.
*/
export async function eagleeyeGetNextEmails(): Promise<UserTenant[]> {
  let rows: UserTenant[] = []
  try {
    rows = await eagleeye.getNextEmails(svc.postgres.reader)
  } catch (err) {
    throw new Error(err)
  }

  return rows
}
