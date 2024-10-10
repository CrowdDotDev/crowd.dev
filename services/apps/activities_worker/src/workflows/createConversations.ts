import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities/createConversations'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '3 minutes',
})

export async function createConversations(): Promise<void> {
  await activity.createConversations()
}
