import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'

import { svc } from '../main'
import { getMembersForLFIDEnrichment, getMembersToEnrich } from '../workflows'
import { IS_DEV_ENV, IS_TEST_ENV } from '@crowd/common'

export const scheduleMembersEnrichment = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'members-enrichment',
      spec: {
        cronExpressions: IS_DEV_ENV || IS_TEST_ENV ? ['*/2 * * * *'] : ['*/30 * * * *'],
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

export const scheduleMembersLFIDEnrichment = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'members-lfid-enrichment-2',
      spec: {
        cronExpressions: IS_DEV_ENV || IS_TEST_ENV ? ['*/2 * * * *'] : ['0 0 1 */2 *'],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: getMembersForLFIDEnrichment,
        taskQueue: 'members-enrichment',
        retry: {
          initialInterval: '2 seconds',
          backoffCoefficient: 2,
          maximumAttempts: 3,
        },
        args: [
          {
            afterId: null,
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
