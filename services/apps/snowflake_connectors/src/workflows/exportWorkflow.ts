import { executeChild, proxyActivities } from '@temporalio/workflow'

import type * as activities from '../activities/exportActivity'

const { getEnabledPlatforms } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
})

const { executeExport } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 hour',
})

export async function snowflakeS3ExportScheduler(): Promise<void> {
  const platforms = await getEnabledPlatforms()

  const childWorkflows = platforms.map((platform) => {
    const today = new Date().toISOString().slice(0, 10)
    return executeChild('exportPlatformWorkflow', {
      workflowId: `snowflake-export/${platform}/${today}`,
      args: [platform],
    })
  })

  await Promise.allSettled(childWorkflows)
}

export async function exportPlatformWorkflow(platform: string): Promise<void> {
  await executeExport(platform)
}
