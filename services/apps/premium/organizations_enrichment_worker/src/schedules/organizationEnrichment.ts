import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'
import { svc } from '../main'
import { triggerOrganizationCacheEnrichment, triggerUpdateTenantOrganizations } from '../workflows'
import { IS_DEV_ENV, IS_TEST_ENV } from '@crowd/common'

export const scheduleOrganizationCachesEnrichment = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'organization-caches-enrichment',
      spec: {
        // every hour (at minute 0)
        cronExpressions: IS_DEV_ENV || IS_TEST_ENV ? ['*/2 * * * *'] : ['0 * * * *'],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: triggerOrganizationCacheEnrichment,
        taskQueue: 'organizations-enrichment',
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

export const scheduleOrganizationUpdate = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'tenant-organization-enrichment-update',
      spec: {
        // every hour (at minute 0)
        cronExpressions: IS_DEV_ENV || IS_TEST_ENV ? ['*/2 * * * *'] : ['0 * * * *'],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: triggerUpdateTenantOrganizations,
        taskQueue: 'organizations-enrichment',
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
