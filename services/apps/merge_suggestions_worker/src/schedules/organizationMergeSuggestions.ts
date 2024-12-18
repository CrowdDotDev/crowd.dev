import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'

import { IS_DEV_ENV, IS_TEST_ENV } from '@crowd/common'

import { svc } from '../main'
import { spawnOrganizationMergeSuggestionsForAllTenants } from '../workflows/spawnOrganizationMergeSuggestionsForAllTenants'

export const scheduleGenerateOrganizationMergeSuggestions = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'organization-merge-suggestions',
      spec:
        IS_DEV_ENV || IS_TEST_ENV
          ? {
              cronExpressions: ['*/2 * * * *'],
            }
          : {
              intervals: [
                {
                  every: '2 hours',
                },
              ],
            },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: spawnOrganizationMergeSuggestionsForAllTenants,
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
