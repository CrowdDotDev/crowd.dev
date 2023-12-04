import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'

import { svc } from '../main'
import { weeklyGetAndSendNextEmails } from '../workflows'
import { TemporalWorkflowId } from '@crowd/types'

export const scheduleEmailAnalyticsWeekly = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'email-analytics-weekly',
      spec: {
        cronExpressions: ['0 8 * * MON'],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        workflowId: TemporalWorkflowId.EMAIL_WEEKLY_ANALYTICS,
        type: 'startWorkflow',
        workflowType: weeklyGetAndSendNextEmails,
        taskQueue: 'emails',
        workflowExecutionTimeout: '5 minutes',
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
