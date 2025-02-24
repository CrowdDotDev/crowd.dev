import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'

import { svc } from '../main'
import { populateActivityRelations } from '../workflows'

export const schedulePopulateActivityRelations = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'populateActivityRelations',
      spec: {
        cronExpressions: ['30 0 * * *'],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: populateActivityRelations,
        taskQueue: 'script-executor',
        retry: {
          initialInterval: '15 seconds',
          backoffCoefficient: 2,
          maximumAttempts: 3,
        },
        args: [
          {
            batchSizePerRun: 10000,
            deleteIndexedEntities: false,
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
