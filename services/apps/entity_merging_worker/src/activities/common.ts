import { MergeActionState } from '@crowd/types'
import { svc } from '../main'

export async function setMergeActionState(
  primaryId: string,
  secondaryId: string,
  tenantId: string,
  state: MergeActionState,
): Promise<void> {
  await svc.postgres.writer.connection().query(
    `
        UPDATE "mergeActions"
        SET state = $4
        WHERE "tenantId" = $3
          AND "primaryId" = $1
          AND "secondaryId" = $2
          AND state != $4
      `,
    [primaryId, secondaryId, tenantId, state],
  )
}
