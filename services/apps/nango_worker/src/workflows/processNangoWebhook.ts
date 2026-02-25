import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities/nangoActivities'
import { IProcessNangoWebhookArguments } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '3 minutes',
  retry: { maximumAttempts: 20, backoffCoefficient: 2 },
})

export async function processNangoWebhook(args: IProcessNangoWebhookArguments): Promise<void> {
  let nextCursor = await activity.processNangoWebhook(args)

  while (nextCursor) {
    nextCursor = await activity.processNangoWebhook({
      ...args,
      nextPageCursor: nextCursor,
    })
  }
}
