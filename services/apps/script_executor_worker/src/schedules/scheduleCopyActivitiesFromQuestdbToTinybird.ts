import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'

import { svc } from '../main'
import { copyActivitiesFromQuestdbToTinybird } from '../workflows'

export const scheduleCopyActivitiesFromQuestdbToTinybird = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'copyActivitiesFromQuestdbToTinybird',
      spec: {
        cronExpressions: ['30 0 * * *'],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: copyActivitiesFromQuestdbToTinybird,
        taskQueue: 'script-executor',
        retry: {
          initialInterval: '15 seconds',
          backoffCoefficient: 2,
          maximumAttempts: 3,
        },
        args: [
          {
            batchSizePerRun: 50000,
            deleteIndexedEntities: false,
            segmentIds: [
              '7b7bf9ce-6051-4c97-85eb-35c790203a0c',
              'f809d51c-68fa-401a-8aea-eb67989285c1',
              'e2fa0373-7379-416f-a651-70b1fc1b89b9',
              'e2c3321f-0d85-4a16-b603-66fd9f882a06',
              '2cd61b6e-de33-4a51-bb17-fbe33cc0ac0c',
            ],
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
