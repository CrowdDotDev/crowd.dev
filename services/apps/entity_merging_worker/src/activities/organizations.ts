import { DEFAULT_TENANT_ID } from '@crowd/common'
import {
  deleteOrganizationById,
  deleteOrganizationSegments,
  moveActivitiesToNewOrg,
} from '@crowd/data-access-layer/src/old/apps/entity_merging_worker/orgs'
import {
  cleanupForOganization,
  deleteOrgAttributesByOrganizationId,
} from '@crowd/data-access-layer/src/organizations'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { SearchSyncApiClient } from '@crowd/opensearch'
import { RedisPubSubEmitter } from '@crowd/redis'
import { ApiWebsocketMessage, TemporalWorkflowId } from '@crowd/types'

import { svc } from '../main'

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
): Promise<void> {
  await moveActivitiesToNewOrg(
    svc.questdbSQL,
    svc.postgres.writer.connection(),
    svc.queue,
    primaryId,
    secondaryId,
  )
}

export async function recalculateActivityAffiliationsOfOrganizationSynchronous(
  organizationId: string,
): Promise<void> {
  await svc.temporal.workflow.start('organizationUpdate', {
    taskQueue: 'profiles',
    workflowId: `${TemporalWorkflowId.ORGANIZATION_UPDATE}/${organizationId}`,
    followRuns: true,
    retry: {
      maximumAttempts: 10,
    },
    args: [
      {
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
  })

  await svc.temporal.workflow.result(`${TemporalWorkflowId.ORGANIZATION_UPDATE}/${organizationId}`)
}

export async function syncOrganization(organizationId: string, syncStart: Date): Promise<void> {
  const syncApi = new SearchSyncApiClient({
    baseUrl: process.env['CROWD_SEARCH_SYNC_API_URL'],
  })

  await syncApi.triggerOrganizationSync(organizationId)
  await syncApi.triggerOrganizationMembersSync(organizationId, null, syncStart)
}

export async function notifyFrontendOrganizationUnmergeSuccessful(
  primaryId: string,
  secondaryId: string,
  primaryDisplayName: string,
  secondaryDisplayName: string,
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
        tenantId: DEFAULT_TENANT_ID,
        userId,
        primaryId,
        secondaryId,
        primaryDisplayName,
        secondaryDisplayName,
      }),
      undefined,
      DEFAULT_TENANT_ID,
    ),
  )
}

export async function notifyFrontendOrganizationMergeSuccessful(
  primaryOrgId: string,
  secondaryOrgId: string,
  original: string,
  toMerge: string,
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
        userId,
        tenantId: DEFAULT_TENANT_ID,
        primaryOrgId,
        secondaryOrgId,
        original,
        toMerge,
      }),
      undefined,
      DEFAULT_TENANT_ID,
    ),
  )
}
