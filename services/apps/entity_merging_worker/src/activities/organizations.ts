import { RedisPubSubEmitter } from '@crowd/redis'
import { svc } from '../main'
import { ApiWebsocketMessage } from '@crowd/types'

export async function deleteOrganization(organizationId: string): Promise<void> {
  await svc.postgres.writer.connection().query(
    `
      DELETE FROM "organizationSegments"
      WHERE "organizationId" = $1
    `,
    [organizationId],
  )
  await svc.postgres.writer.connection().query(
    `
      DELETE FROM organizations
      WHERE id = $1
    `,
    [organizationId],
  )
}

export async function moveActivitiesBetweenOrgs(
  primaryId: string,
  secondaryId: string,
  tenantId: string,
): Promise<boolean> {
  const result = await svc.postgres.writer.connection().result(
    `
      UPDATE "activities"
      SET "organizationId" = $1
      WHERE id IN (
        SELECT id
        FROM "activities"
        WHERE "tenantId" = $3
          AND "organizationId" = $2
        LIMIT 5000
      )
    `,
    [primaryId, secondaryId, tenantId],
  )

  return result.rowCount > 0
}

export async function markMergeActionDone(
  primaryId: string,
  secondaryId: string,
  tenantId: string,
): Promise<void> {
  await svc.postgres.writer.connection().query(
    `
      UPDATE "mergeActions"
      SET state = $4
      WHERE "tenantId" = $3
        AND type = $5
        AND "primaryId" = $1
        AND "secondaryId" = $2
        AND state != $4
    `,
    [primaryId, secondaryId, tenantId, 'done', 'org'],
  )
}

export async function notifyFrontend(
  primaryOrgId: string,
  secondaryOrgId: string,
  original: string,
  toMerge: string,
  tenantId: string,
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
