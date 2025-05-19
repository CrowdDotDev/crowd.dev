import { BatchProcessor } from '@crowd/common'
import { createOrUpdateRelations } from '@crowd/data-access-layer'
import { streamActivities } from '@crowd/data-access-layer/src/activities/update'
import { WRITE_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { IActivityRelationCreateOrUpdateData } from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/activity.data'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceLogger } from '@crowd/logging'
import { getClientSQL } from '@crowd/questdb'

const log = getServiceLogger()

setImmediate(async () => {
  const dbConnection = await getDbConnection(WRITE_DB_CONFIG())
  const qdbConnection = await getClientSQL()

  let totalProcessed = 0

  const start = performance.now()

  const batchProcessor = new BatchProcessor<IActivityRelationCreateOrUpdateData>(
    10,
    10,
    async (batch) => {
      await createOrUpdateRelations(pgpQx(dbConnection), batch, true)
      totalProcessed += batch.length

      const duration = performance.now() - start
      const rate = (totalProcessed / (duration / 1000)).toFixed(2)

      log.info(`So far processed ${totalProcessed} activities! Rate: ${rate} activities/s`)
    },
    async (_, err) => {
      log.error(err, 'Error while processing batch!')
    },
  )

  await streamActivities(
    qdbConnection,
    async (activity) => {
      await batchProcessor.addToBatch({
        activityId: activity.id,
        segmentId: activity.segmentId,
        memberId: activity.memberId,
        objectMemberId: activity.objectMemberId,
        organizationId: activity.organizationId,
        platform: activity.platform,
        username: activity.username,
        objectMemberUsername: activity.objectMemberUsername,
      })
    },
    `
    "updatedAt" >= $(fromUpdatedAt) and "updatedAt" <= $(toUpdatedAt)
  `,
    {
      fromUpdatedAt: '2025-05-14T21:10:25+02:00',
      toUpdatedAt: '2025-05-15T15:15:20+02:00',
    },
  )
})
