import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  startChild,
  workflowInfo,
} from '@temporalio/workflow'

import { ISyncSegmentsArgs } from '../../types'

import { syncMembers } from './members'
import { syncOrganizations } from './organizations'

export async function syncSegments(args: ISyncSegmentsArgs): Promise<void> {
  const { segmentIds, entityType, ...syncArgs } = args
  const info = workflowInfo()

  console.log('Starting syncSegments with args:', { ...args })

  // wait for both member and organization syncs to complete before moving to next segment
  // process segments sequentially to manage db load
  for (const segmentId of segmentIds) {
    console.log(`Processing segment: ${segmentId}`)
    const segmentWorkflows = []

    if (!entityType || entityType === 'member') {
      segmentWorkflows.push(
        startChild(syncMembers, {
          workflowId: `${info.workflowId}/${segmentId}/members`,
          cancellationType: ChildWorkflowCancellationType.WAIT_CANCELLATION_COMPLETED,
          parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_TERMINATE,
          args: [
            {
              segmentId,
              ...syncArgs,
            },
          ],
        }),
      )
    }

    if (!entityType || entityType === 'organization') {
      segmentWorkflows.push(
        startChild(syncOrganizations, {
          workflowId: `${info.workflowId}/${segmentId}/organizations`,
          cancellationType: ChildWorkflowCancellationType.WAIT_CANCELLATION_COMPLETED,
          parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_TERMINATE,
          args: [
            {
              segmentId,
              ...syncArgs,
            },
          ],
        }),
      )
    }

    await Promise.all(segmentWorkflows)
  }

  console.log('Completed processing all segments')
}
