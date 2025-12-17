import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'

import { svc } from '../main'
import { refreshMemberDisplayAggregates } from '../workflows/member/refreshMemberDisplayAggregates'
import { refreshOrganizationDisplayAggregates } from '../workflows/organization/refreshOrganizationDisplayAggregates'

export const scheduleRefreshMemberDisplayAggregates = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'refresh-member-display-aggregates',
      spec: {
        cronExpressions: ['0 10 * * *'],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: refreshMemberDisplayAggregates,
        taskQueue: 'profiles',
        args: [{}],
        workflowExecutionTimeout: '2 hours',
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

export const scheduleRefreshOrganizationDisplayAggregates = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'refresh-organization-display-aggregates',
      spec: {
        cronExpressions: ['0 10 * * *'],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: refreshOrganizationDisplayAggregates,
        taskQueue: 'profiles',
        args: [{}],
        workflowExecutionTimeout: '2 hours',
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
