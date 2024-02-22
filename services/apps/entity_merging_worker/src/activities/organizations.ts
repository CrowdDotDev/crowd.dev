import { RedisPubSubEmitter } from '@crowd/redis'
import { svc } from '../main'
import { ApiWebsocketMessage } from '@crowd/types'
import {
  deleteOrganizationById,
  deleteOrganizationCacheLinks,
  deleteOrganizationSegments,
  moveActivitiesToNewOrg,
} from '@crowd/data-access-layer/src/old/apps/entity_merging_worker/orgs'

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

export async function notifyFrontend(
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
