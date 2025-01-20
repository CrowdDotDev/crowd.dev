import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'

import { svc } from '../main'
import { spawnDashboardCacheRefresh } from '../workflows'

export const scheduleRefreshDashboardCacheDaily = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'refreshDashboardCacheDaily',
      spec: {
        cronExpressions: ['30 0 * * *'],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: spawnDashboardCacheRefresh,
        taskQueue: 'cache',
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
