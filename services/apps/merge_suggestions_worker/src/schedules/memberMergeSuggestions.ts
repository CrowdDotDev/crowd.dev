import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'

import { svc } from '../main'
import { spawnSuggestionsForAllTenants } from 'workflows/spawnSuggestionsForAllTenants'
// import { eagleeyeGetAndSendNextEmails } from '../workflows'

export const scheduleGenerateMemberMergeSuggestions = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'member-merge-suggestions-v2',
      spec: {
        intervals: [
          {
            every: '1 minute',
          },
        ],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: spawnSuggestionsForAllTenants,
        taskQueue: 'merge-suggestions',
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
