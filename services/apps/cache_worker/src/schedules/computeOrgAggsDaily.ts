import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'

import { svc } from '../main'
import { dailyGetAndComputeOrgAggs } from '../workflows'

export const scheduleComputeOrgAggsDaily = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'compute-org-aggs-daily',
      spec: {
        cronExpressions: ['0 8 * * *'],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: dailyGetAndComputeOrgAggs,
        taskQueue: 'cache',
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
