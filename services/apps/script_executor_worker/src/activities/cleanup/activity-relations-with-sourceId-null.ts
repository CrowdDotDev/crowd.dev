/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  deleteActivityRelationsById,
  fetchActivityRelationsWithNullSourceId,
} from '@crowd/data-access-layer'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'

import { svc } from '../../main'

export async function getActivityRelationsWithNullSourceId(limit: number): Promise<string[]> {
  const qx = pgpQx(svc.postgres.reader.connection())
  return fetchActivityRelationsWithNullSourceId(qx, limit)
}

export async function deleteActivityRelations(activityIds: string[]): Promise<void> {
  const qx = pgpQx(svc.postgres.writer.connection())
  return deleteActivityRelationsById(qx, activityIds)
}
