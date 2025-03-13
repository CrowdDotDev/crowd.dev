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
              '1da9d822-d1a9-41e3-9d68-199275a51522',
              '7e7200a1-b7ab-49ef-9b83-476875388b2c',
              'dcc22e8a-9008-49d3-aa4e-6250abc8052d',
              '58554d20-ebec-4605-a2f3-c19c32a87b8b',
              '24ab48d4-3484-4e59-87d0-1b3b72e38f90',
              '591b1aa5-97fc-42c7-8f43-fc29b8c78ff1',
              '8656081c-f2fc-485f-b5f2-389ffcd5621a',
              '2738d650-38a0-4c0d-9c7e-1c3fc5f18254',
              'd4457ee2-32ca-4454-ae4f-840b569b41d9',
              '7627fb7c-7320-4948-9e29-5822af41edbb',
              'ed148448-536b-4dd4-9882-58e668c7ca3e',
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
