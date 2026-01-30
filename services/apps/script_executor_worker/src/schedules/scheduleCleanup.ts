import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'

import { svc } from '../main'
import { cleanupMembers } from '../workflows/cleanup/members'
import { cleanupOrganizations } from '../workflows/cleanup/organizations'
import {
  cleanupMemberSegmentsAgg,
  cleanupOrganizationSegmentAgg,
} from '../workflows/cleanup/segments-agg'

export const scheduleMembersCleanup = async () => {
  try {
    // Try to delete existing schedule first to ensure fresh config
    try {
      const handle = svc.temporal.schedule.getHandle('cleanupMembers')
      await handle.delete()
      svc.log.info('Deleted existing cleanupMembers schedule to recreate with new config')
    } catch (err) {
      // Schedule doesn't exist, that's fine
    }

    await svc.temporal.schedule.create({
      scheduleId: 'cleanupMembers',
      spec: {
        cronExpressions: ['0 9 * * 3'],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: cleanupMembers,
        taskQueue: 'script-executor',
        retry: {
          initialInterval: '15 seconds',
          backoffCoefficient: 2,
          maximumAttempts: 3,
        },
        args: [
          {
            batchSize: 500,
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

export const scheduleOrganizationsCleanup = async () => {
  try {
    // Try to delete existing schedule first to ensure fresh config
    try {
      const handle = svc.temporal.schedule.getHandle('cleanupOrganizations')
      await handle.delete()
      svc.log.info('Deleted existing cleanupOrganizations schedule to recreate with new config')
    } catch (err) {
      // Schedule doesn't exist, that's fine
    }

    await svc.temporal.schedule.create({
      scheduleId: 'cleanupOrganizations',
      spec: {
        cronExpressions: ['0 9 * * 3'],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: cleanupOrganizations,
        taskQueue: 'script-executor',
        retry: {
          initialInterval: '15 seconds',
          backoffCoefficient: 2,
          maximumAttempts: 3,
        },
        args: [
          {
            batchSize: 500,
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

export const scheduleMemberSegmentsAggCleanup = async () => {
  try {
    svc.log.info('Creating schedule for member segments agg cleanup...')

    // Try to delete existing schedule first to ensure fresh config
    try {
      const handle = svc.temporal.schedule.getHandle('cleanupMemberSegmentsAgg')
      await handle.delete()
      svc.log.info('Deleted existing cleanupMemberSegmentsAgg schedule to recreate with new config')
    } catch (err) {
      // Schedule doesn't exist, that's fine
    }

    await svc.temporal.schedule.create({
      scheduleId: 'cleanupMemberSegmentsAgg',
      spec: {
        // Run every 5 minutes
        cronExpressions: ['*/5 * * * *'],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: cleanupMemberSegmentsAgg,
        taskQueue: 'script-executor',
        retry: {
          initialInterval: '15 seconds',
          backoffCoefficient: 2,
          maximumAttempts: 3,
        },
        args: [
          {
            batchSize: 500,
          },
        ],
      },
    })
    svc.log.info('Schedule for member segments agg cleanup created successfully!')
  } catch (err) {
    if (err instanceof ScheduleAlreadyRunning) {
      svc.log.info('Schedule cleanupMemberSegmentsAgg already registered in Temporal.')
      svc.log.info('Configuration may have changed since. Please make sure they are in sync.')
    } else {
      svc.log.error({ err }, 'Error creating schedule for member segments agg cleanup')
      throw new Error(err)
    }
  }
}

export const scheduleOrganizationSegmentAggCleanup = async () => {
  try {
    svc.log.info('Creating schedule for organization segment agg cleanup...')

    // Try to delete existing schedule first to ensure fresh config
    try {
      const handle = svc.temporal.schedule.getHandle('cleanupOrganizationSegmentAgg')
      await handle.delete()
      svc.log.info(
        'Deleted existing cleanupOrganizationSegmentAgg schedule to recreate with new config',
      )
    } catch (err) {
      // Schedule doesn't exist, that's fine
    }

    await svc.temporal.schedule.create({
      scheduleId: 'cleanupOrganizationSegmentAgg',
      spec: {
        // Run every 5 minutes
        cronExpressions: ['*/5 * * * *'],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: cleanupOrganizationSegmentAgg,
        taskQueue: 'script-executor',
        retry: {
          initialInterval: '15 seconds',
          backoffCoefficient: 2,
          maximumAttempts: 3,
        },
        args: [
          {
            batchSize: 500,
          },
        ],
      },
    })
    svc.log.info('Schedule for organization segment agg cleanup created successfully!')
  } catch (err) {
    if (err instanceof ScheduleAlreadyRunning) {
      svc.log.info('Schedule cleanupOrganizationSegmentAgg already registered in Temporal.')
      svc.log.info('Configuration may have changed since. Please make sure they are in sync.')
    } else {
      svc.log.error({ err }, 'Error creating schedule for organization segment agg cleanup')
      throw new Error(err)
    }
  }
}
