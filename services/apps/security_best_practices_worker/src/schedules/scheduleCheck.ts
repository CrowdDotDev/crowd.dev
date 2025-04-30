import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'

import { svc } from '../main'
import { triggerSecurityInsightsCheckForRepos } from '../workflows'

export const scheduleTriggerSecurityInsightsCheckForRepos = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'triggerSecurityInsightsCheckForRepos',
      spec: {
        cronExpressions: ['0 8 * * *'],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: triggerSecurityInsightsCheckForRepos,
        taskQueue: 'security-best-practices',
        retry: {
          initialInterval: '15 seconds',
          backoffCoefficient: 2,
          maximumAttempts: 3,
        },
        args: [
          {
            failedRepos: [],
          },
        ],
      },
    })
  } catch (err) {
    if (err instanceof ScheduleAlreadyRunning) {
      svc.log.info('Schedule already registered in Temporal.')
      svc.log.info('Configuration may have changed since. Please make sure they are in sync.')
    } else {
      throw new Error(err)
    }
  }
}
