import fs from 'fs'

import { BatchProcessor } from '@crowd/common'
import { createOrUpdateRelations } from '@crowd/data-access-layer'
import { streamActivities } from '@crowd/data-access-layer/src/activities/update'
import { WRITE_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { IActivityRelationCreateOrUpdateData } from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/activity.data'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceLogger } from '@crowd/logging'
import { getClientSQL } from '@crowd/questdb'

const log = getServiceLogger()

interface IActivityBatchItem extends IActivityRelationCreateOrUpdateData {
  updatedAt: string
}

const errorBatchesFile = 'error-batches.txt'
const fromUpdatedAt = new Date('2025-05-15T05:00:25.000Z')
const toUpdatedAt = new Date('2025-05-15T15:15:20+02:00')

function createOrRecreateFile(filePath: string): void {
  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Delete the existing file
    fs.unlinkSync(filePath)
  }

  // Create the file (by writing an empty string to it)
  fs.writeFileSync(filePath, '')

  log.info(`File created: ${filePath}`)
}

// Function to append text to a file
function appendToFile(filePath: string, content: string): void {
  fs.appendFileSync(filePath, content)
}

setImmediate(async () => {
  createOrRecreateFile(errorBatchesFile)

  const dbConnection = await getDbConnection(WRITE_DB_CONFIG())
  const qdbConnection = await getClientSQL()

  let totalProcessed = 0

  const start = performance.now()

  const batchProcessor = new BatchProcessor<IActivityBatchItem>(
    100,
    10,
    async (batch) => {
      if (batch.length > 0) {
        await createOrUpdateRelations(pgpQx(dbConnection), batch, true)
        totalProcessed += batch.length

        const duration = performance.now() - start
        const rate = (totalProcessed / (duration / 1000)).toFixed(2)

        log.info(`So far processed ${totalProcessed} activities! Rate: ${rate} activities/s`)
      }
    },
    async (batch, err) => {
      log.error(err, 'Error while processing batch!')
      if (batch.length > 0) {
        let minUpdatedAt = new Date(batch[0].updatedAt)
        let maxUpdatedAt = new Date(batch[0].updatedAt)

        for (const activity of batch) {
          const updatedAt = new Date(activity.updatedAt)
          if (updatedAt.getTime() < minUpdatedAt.getTime()) {
            minUpdatedAt = updatedAt
          }

          if (updatedAt.getTime() > maxUpdatedAt.getTime()) {
            maxUpdatedAt = updatedAt
          }
        }

        appendToFile(
          errorBatchesFile,
          `
          -----------------------------------------------------------------------------------------------
          Batch error
          Message: ${err.message}
          Stack: ${JSON.stringify(err.stack)}
          Whole error: ${JSON.stringify(err)}
          Min updated at: ${minUpdatedAt.toISOString()}
          Max updated at: ${maxUpdatedAt.toISOString()}
          `,
        )
      }
    },
  )

  let currentFrom = fromUpdatedAt
  let interval = 5 * 60000 // start with 5 minutes

  while (currentFrom < toUpdatedAt) {
    const currentTo = new Date(currentFrom.getTime() + interval)
    let processed = 0
    try {
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
            updatedAt: activity.updatedAt,
          })

          processed++
        },
        `
        "updatedAt" >= $(fromUpdatedAt) and "updatedAt" <= $(toUpdatedAt)
      `,
        {
          fromUpdatedAt: currentFrom,
          toUpdatedAt: currentTo,
        },
      )

      log.info(
        `Processed ${processed} activities for period ${currentFrom.toISOString()} - ${currentTo.toISOString()}`,
      )

      currentFrom = currentTo
      interval = 5 * 60000
    } catch (err) {
      if ((err.message as string).includes('timeout, query aborted')) {
        interval -= 60000
        totalProcessed -= processed
        log.info(`Timeout, reducing interval... by 60 seconds! New interval: ${interval}`)
      } else {
        log.error(err, 'Error while processing activities!')
        throw err
      }
    }

    if (interval <= 0) {
      log.error(
        `Interval is 0, breaking...! From: ${currentFrom.toISOString()} To: ${currentTo.toISOString()}`,
      )
      break
    }
  }
})
