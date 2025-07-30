import { fetchMemberIdentities, getMemberById, getOrganizationById, pgpQx } from '@crowd/data-access-layer'
import {
  getIncompleteMergeActions,
  queryMergeActions,
  updateMergeAction,
} from '@crowd/data-access-layer/src/mergeActions/repo'
import { MergeActionState, MergeActionStep, MergeActionType } from '@crowd/types'

import { svc } from '../main'

export async function getCancelledMergeAndUnmergeWorkflows(
  type: MergeActionType,
  step: MergeActionStep,
  limit?: number,
) {
  const qx = pgpQx(svc.postgres.reader.connection())

  return getIncompleteMergeActions(qx, type, step, limit)
}

export async function resetMergeActionState(primaryId: string, secondaryId: string) {
  const qx = pgpQx(svc.postgres.writer.connection())

  await updateMergeAction(qx, primaryId, secondaryId, 'pending')
}

export async function triggerUnmergeWorkflow(
  primaryId: string,
  secondaryId: string,
  type: MergeActionType,
  actionBy: string,
) {
  const tenantId = '875c38bd-2b1b-4e91-ad07-0cfbabb4c49f'
  const taskQueue = 'entity-merging'

  const qx = pgpQx(svc.postgres.reader.connection())

  if (type === MergeActionType.MEMBER) {
    const primaryMember = await getMemberById(svc.postgres.reader, primaryId)

    const secondaryMember = await getMemberById(svc.postgres.reader, secondaryId)
    const secondaryMemberIdentities = await fetchMemberIdentities(qx, secondaryId)

    await svc.temporal.workflow.start('finishMemberUnmerging', {
      taskQueue,
      workflowId: `finishMemberUnmerging/${primaryId}/${secondaryId}`,
      retry: {
        maximumAttempts: 10,
      },
      args: [
        primaryId,
        secondaryId,
        secondaryMemberIdentities,
        primaryMember.displayName,
        secondaryMember.displayName,
        actionBy,
      ],
      searchAttributes: {
        TenantId: [tenantId],
      },
    })
  } else {    
    const primaryOrganization = await getOrganizationById(qx, primaryId)
    const secondaryOrganization = await getOrganizationById(qx, secondaryId)

    await svc.temporal.workflow.start('finishOrganizationUnmerging', {
      taskQueue,
      workflowId: `finishOrganizationUnmerging/${primaryId}/${secondaryId}`,
      retry: {
        maximumAttempts: 10,
      },
      args: [
        primaryId,
        secondaryId,
        primaryOrganization.displayName,
        secondaryOrganization.displayName,
        actionBy,
      ],
      searchAttributes: {
        TenantId: [tenantId],
      },
    })
  }
}

export async function getOrganizationMergesWithPendingState() {
  const qx = pgpQx(svc.postgres.reader.connection())

  return queryMergeActions(qx, {
    fields: ['id', 'step', 'primaryId', 'secondaryId', 'actionBy'],
    filter: {
      and: [
        {
          state: {
            eq: 'pending',
          },
          type: {
            eq: MergeActionType.ORG,
          },
        },
      ],
    },
    orderBy: '"updatedAt" DESC',
  })
}