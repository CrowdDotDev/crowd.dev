import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'
import { svc } from '../main'
import { createConversations } from '../workflows/createConversations'

export const scheduleCreateConversations = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'create-conversations',
      spec: {
        intervals: [
          {
            every: '5 minutes',
          },
        ],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: createConversations,
        taskQueue: 'activities',
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
