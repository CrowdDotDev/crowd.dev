import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'

import { svc } from '../main'
import { getMembersToEnrich } from '../workflows'

export const scheduleMembersEnrichment = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'members-enrichment',
      spec: {
        cronExpressions: ['*/30 * * * *'],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: getMembersToEnrich,
        taskQueue: 'members-enrichment',
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
