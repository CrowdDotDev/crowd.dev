import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'

const { fixForeignKeys } = proxyActivities<typeof activities>({
  startToCloseTimeout: '60 minutes',
})

export async function fixForeignKeyswf(): Promise<void> {
  await fixForeignKeys()
}
