import { RedisPubSubEmitter } from '@crowd/redis'
import { svc } from '../main'
import { ApiWebsocketMessage, TemporalWorkflowId } from '@crowd/types'
import {
  deleteOrganizationById,
  deleteOrganizationCacheLinks,
  deleteOrganizationSegments,
  findOrganizationCacheIdFromIdentities,
  findOrganizationIdentities,
  moveActivitiesToNewOrg,
  linkOrganizationToCacheId,
} from '@crowd/data-access-layer/src/old/apps/entity_merging_worker/orgs'
import { SearchSyncApiClient } from '@crowd/opensearch'
import {
  findOrganizationSegments,
  markOrganizationAsManuallyCreated,
} from '@crowd/data-access-layer/src/old/apps/entity_merging_worker'
import { WorkflowIdReusePolicy } from '@temporalio/workflow'

export async function deleteOrganization(organizationId: string): Promise<void> {
  await deleteOrganizationCacheLinks(svc.postgres.writer, organizationId)
  await deleteOrganizationSegments(svc.postgres.writer, organizationId)
  await deleteOrganizationById(svc.postgres.writer, organizationId)
}

export async function moveActivitiesBetweenOrgs(
  primaryId: string,
  secondaryId: string,
  tenantId: string,
): Promise<boolean> {
  const result = await moveActivitiesToNewOrg(svc.postgres.writer, primaryId, secondaryId, tenantId)

  return result.rowCount > 0
}

export async function recalculateActivityAffiliationsOfOrganizationSynchronous(
  organizationId: string,
  tenantId: string,
): Promise<void> {
  await svc.temporal.workflow.execute('organizationUpdate', {
    taskQueue: 'profiles',
    workflowId: `${TemporalWorkflowId.ORGANIZATION_UPDATE}/${tenantId}/${organizationId}`,
    workflowIdReusePolicy: WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
    retry: {
      maximumAttempts: 10,
    },
    args: [
      {
        tenantId,
        organization: {
          id: organizationId,
        },
      },
    ],
    searchAttributes: {
      TenantId: [tenantId],
    },
  })
}

export async function syncOrganization(
  organizationId: string,
  secondaryOrganizationId: string,
): Promise<void> {
  const syncApi = new SearchSyncApiClient({
    baseUrl: process.env['CROWD_SEARCH_SYNC_API_URL'],
  })

  // check if org has any activities
  const result = await findOrganizationSegments(svc.postgres.writer, organizationId)

  if (result.segmentIds) {
    // segment information can be deduced from activities, no need to send segmentIds explicitly on merging
    await syncApi.triggerOrganizationSync(organizationId)
    await syncApi.triggerOrganizationMembersSync(null, organizationId)
    return
  }

  // check if secondary org has any activities
  const secondaryResult = await findOrganizationSegments(
    svc.postgres.writer,
    secondaryOrganizationId,
  )

  if (secondaryResult.segmentIds) {
    await markOrganizationAsManuallyCreated(svc.postgres.writer, organizationId)
    // organization doesn't have any activity to deduce segmentIds for syncing, use the secondary member's activity segments
    await syncApi.triggerOrganizationSync(organizationId, secondaryResult.segmentIds)
  }

  // also sync organization members
  await syncApi.triggerOrganizationMembersSync(null, organizationId)
}

export async function notifyFrontendOrganizationUnmergeSuccessful(
  primaryId: string,
  secondaryId: string,
  primaryDisplayName: string,
  secondaryDisplayName: string,
  tenantId: string,
  userId: string,
): Promise<void> {
  const emitter = new RedisPubSubEmitter(
    'api-pubsub',
    svc.redis,
    (err) => {
      svc.log.error({ err }, 'Error in api-ws emitter!')
    },
    svc.log,
  )

  emitter.emit(
    'user',
    new ApiWebsocketMessage(
      'organization-unmerge',
      JSON.stringify({
        success: true,
        tenantId,
        userId,
        primaryId,
        secondaryId,
        primaryDisplayName,
        secondaryDisplayName,
      }),
      undefined,
      tenantId,
    ),
  )
}

export async function notifyFrontendOrganizationMergeSuccessful(
  primaryOrgId: string,
  secondaryOrgId: string,
  original: string,
  toMerge: string,
  tenantId: string,
  userId: string,
): Promise<void> {
  const emitter = new RedisPubSubEmitter(
    'api-pubsub',
    svc.redis,
    (err) => {
      svc.log.error({ err }, 'Error in api-ws emitter!')
    },
    svc.log,
  )

  emitter.emit(
    'user',
    new ApiWebsocketMessage(
      'org-merge',
      JSON.stringify({
        success: true,
        tenantId,
        userId,
        primaryOrgId,
        secondaryOrgId,
        original,
        toMerge,
      }),
      undefined,
      tenantId,
    ),
  )
}

export async function linkOrganizationToCache(organizationId: string): Promise<void> {
  const identities = await findOrganizationIdentities(svc.postgres.writer, organizationId)

  const cacheId = await findOrganizationCacheIdFromIdentities(svc.postgres.writer, identities)

  if (cacheId) {
    await linkOrganizationToCacheId(svc.postgres.writer, organizationId, cacheId)
  }
}
