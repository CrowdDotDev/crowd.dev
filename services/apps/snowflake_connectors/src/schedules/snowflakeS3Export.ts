import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'

import { SlackChannel, SlackPersona, sendSlackNotification } from '@crowd/slack'

import { svc } from '../main'
import { snowflakeS3ExportScheduler } from '../workflows'

export const scheduleSnowflakeS3Export = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'snowflake-s3-export',
      spec: {
        cronExpressions: ['0 0 * * *'],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.SKIP,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: snowflakeS3ExportScheduler,
        taskQueue: 'snowflakeConnectors',
        retry: {
          initialInterval: '15 seconds',
          backoffCoefficient: 2,
          maximumAttempts: 3,
        },
        args: [],
      },
    })
  } catch (err) {
    if (err instanceof ScheduleAlreadyRunning) {
      svc.log.info('Schedule already registered in Temporal.')
      svc.log.info('Configuration may have changed since. Please make sure they are in sync.')
    } else {
      svc.log.error({ err }, 'Failed to create snowflake-s3-export schedule')
      sendSlackNotification(
        SlackChannel.INTEGRATION_NOTIFICATIONS,
        SlackPersona.ERROR_REPORTER,
        'Snowflake S3 Export Schedule Failed',
        `Failed to create the \`snowflake-s3-export\` Temporal schedule.\n\n*Error:* ${err.message || err}`,
      )
    }
  }
}
