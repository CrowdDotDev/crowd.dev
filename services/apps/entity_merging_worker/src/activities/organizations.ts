import { RedisPubSubEmitter } from '@crowd/redis'
import { svc } from '../main'
import { ApiWebsocketMessage, TemporalWorkflowId } from '@crowd/types'
import {
  deleteOrganizationById,
  deleteOrganizationSegments,
  moveActivitiesToNewOrg,
} from '@crowd/data-access-layer/src/old/apps/entity_merging_worker/orgs'
import { SearchSyncApiClient } from '@crowd/opensearch'
import {
  cleanupForOganization,
  deleteOrgAttributesByOrganizationId,
} from '@crowd/data-access-layer/src/organizations'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'

export async function deleteOrganization(organizationId: string): Promise<void> {
  await deleteOrganizationSegments(svc.postgres.writer, organizationId)

  const qx = dbStoreQx(svc.postgres.writer)
  await deleteOrgAttributesByOrganizationId(qx, organizationId)
  await cleanupForOganization(qx, organizationId)

  await deleteOrganizationById(svc.postgres.writer, organizationId)
}

export async function moveActivitiesBetweenOrgs(
  primaryId: string,
  secondaryId: string,
  tenantId: string,
): Promise<boolean> {
  const result = await moveActivitiesToNewOrg(svc.questdbSQL.$dc, primaryId, secondaryId, tenantId)

  return result.rowCount > 0
}

export async function recalculateActivityAffiliationsOfOrganizationSynchronous(
  organizationId: string,
  tenantId: string,
): Promise<void> {
  await svc.temporal.workflow.start('organizationUpdate', {
    taskQueue: 'profiles',
    workflowId: `${TemporalWorkflowId.ORGANIZATION_UPDATE}/${tenantId}/${organizationId}`,
    followRuns: true,
    retry: {
      maximumAttempts: 10,
    },
    args: [
      {
        tenantId,
        organization: {
          id: organizationId,
        },
        recalculateAffiliations: true,
        syncOptions: {
          doSync: false,
          withAggs: false,
        },
      },
    ],
    searchAttributes: {
      TenantId: [tenantId],
    },
  })

  await svc.temporal.workflow.result(
    `${TemporalWorkflowId.ORGANIZATION_UPDATE}/${tenantId}/${organizationId}`,
  )
}

export async function syncOrganization(organizationId: string): Promise<void> {
  const syncApi = new SearchSyncApiClient({
    baseUrl: process.env['CROWD_SEARCH_SYNC_API_URL'],
  })

  await syncApi.triggerOrganizationSync(organizationId)
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
