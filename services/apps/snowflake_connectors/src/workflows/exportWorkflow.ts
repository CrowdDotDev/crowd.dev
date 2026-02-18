import { executeChild, proxyActivities } from '@temporalio/workflow'

import type * as activities from '../activities/exportActivity'

const { getEnabledPlatforms } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
})

const { executeExport } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 hour',
  retry: {
    initialInterval: '2s',
    backoffCoefficient: 2,
    maximumInterval: '60s',
    maximumAttempts: 3,
  },
})

export async function snowflakeS3ExportScheduler(): Promise<void> {
  const platforms = await getEnabledPlatforms()

  const childWorkflows = platforms.map((platform) => {
    const now = new Date().toISOString().slice(0, 19)
    return executeChild('exportSnowflakeData', {
      workflowId: `snowflake-export/${platform}/${now}`,
      args: [platform],
      retry: {
        initialInterval: '2s',
        backoffCoefficient: 2,
        maximumAttempts: 3,
      },
    })
  })

  await Promise.allSettled(childWorkflows)
}

export async function exportSnowflakeData(platform: string): Promise<void> {
  await executeExport(platform)
}
