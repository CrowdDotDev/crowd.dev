import CronTime from 'cron-time-generator'

import { TEMPORAL_CONFIG, WorkflowIdReusePolicy, getTemporalClient } from '@crowd/temporal'

import { IJobDefinition } from '../types'

const job: IJobDefinition = {
  name: 'snowflake-s3-export',
  cronTime: CronTime.every(24).hours(),
  timeout: 60, // 1 minute — just triggers the workflow
  process: async (ctx) => {
    ctx.log.info('Triggering Snowflake export workflow')

    const temporal = await getTemporalClient(TEMPORAL_CONFIG())

    const today = new Date().toISOString().slice(0, 10)

    await temporal.workflow.start('snowflakeS3ExportScheduler', {
      taskQueue: 'snowflakeConnectors',
      workflowId: `snowflake-export/${today}`,
      workflowIdReusePolicy: WorkflowIdReusePolicy.ALLOW_DUPLICATE_FAILED_ONLY,
      retry: {
        initialInterval: '15s',
        backoffCoefficient: 2,
        maximumAttempts: 3,
      },
      args: [],
    })

    ctx.log.info('Snowflake export workflow triggered!')
  },
}

export default job
