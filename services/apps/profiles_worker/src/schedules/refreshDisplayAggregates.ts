import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'

import { svc } from '../main'
import { calculateLeafSegmentAggregates } from '../workflows/calculateLeafSegmentAggregates'
import { refreshMemberDisplayAggregates } from '../workflows/member/refreshMemberDisplayAggregates'
import { refreshOrganizationDisplayAggregates } from '../workflows/organization/refreshOrganizationDisplayAggregates'

/**
 * Schedule leaf segment aggregate calculation every 5 minutes.
 * This calculates aggregates from activityRelations for subproject-level segments.
 */
export const scheduleCalculateLeafSegmentAggregates = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'calculate-leaf-segment-aggregates',
      spec: {
        cronExpressions: ['*/5 * * * *'], // Every 5 minutes
      },
      policies: {
        overlap: ScheduleOverlapPolicy.SKIP, // Skip if previous run is still running
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: calculateLeafSegmentAggregates,
        taskQueue: 'profiles',
        args: [],
        workflowExecutionTimeout: '4 hours',
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

/**
 * Schedule member aggregate rollup every 10 minutes.
 * This rolls up leaf segment aggregates to project and project-group levels.
 */
export const scheduleRefreshMemberDisplayAggregates = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'refresh-member-display-aggregates',
      spec: {
        cronExpressions: ['*/10 * * * *'], // Every 10 minutes
      },
      policies: {
        overlap: ScheduleOverlapPolicy.SKIP, // Skip if previous run is still running
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: refreshMemberDisplayAggregates,
        taskQueue: 'profiles',
        args: [{}],
        workflowExecutionTimeout: '6 hours',
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

/**
 * Schedule organization aggregate rollup every 10 minutes.
 * This rolls up leaf segment aggregates to project and project-group levels.
 */
export const scheduleRefreshOrganizationDisplayAggregates = async () => {
  try {
    await svc.temporal.schedule.create({
      scheduleId: 'refresh-organization-display-aggregates',
      spec: {
        cronExpressions: ['*/10 * * * *'], // Every 10 minutes
      },
      policies: {
        overlap: ScheduleOverlapPolicy.SKIP, // Skip if previous run is still running
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: refreshOrganizationDisplayAggregates,
        taskQueue: 'profiles',
        args: [{}],
        workflowExecutionTimeout: '6 hours',
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
