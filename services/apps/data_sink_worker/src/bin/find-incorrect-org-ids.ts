import fs from 'fs'

import { BatchProcessor } from '@crowd/common'
import { WRITE_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { streamQuery } from '@crowd/data-access-layer/src/utils'
import { getServiceLogger } from '@crowd/logging'
import { getClientSQL } from '@crowd/questdb'

const log = getServiceLogger()

const intervals: { from: Date; to: Date }[] = [
  {
    from: new Date('2025-05-14T22:00:25+02:00'),
    to: new Date('2025-05-15T15:15:20+02:00'),
  },
]

const maxInterval = 5 * 60000

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

const checkedOrgIds: string[] = []
const incorrectOrgIds: string[] = []

setImmediate(async () => {
  createOrRecreateFile('incorrect-org-ids.txt')

  const dbConnection = await getDbConnection(WRITE_DB_CONFIG())
  const qdbConnection = await getClientSQL()

  const batchProcessor = new BatchProcessor<string>(
    100,
    10,
    async (batch) => {
      if (batch.length > 0) {
        const newOrgIds = batch.filter((orgId) => !checkedOrgIds.includes(orgId))

        if (newOrgIds.length > 0) {
          checkedOrgIds.push(...newOrgIds)
          const results = await dbConnection.any(
            `select id from organizations where "deletedAt" is null and id in ($(ids:csv))`,
            {
              ids: newOrgIds,
            },
          )

          for (const orgId of newOrgIds) {
            const existing = results.find((row) => row.id === orgId)

            if (!existing) {
              incorrectOrgIds.push(orgId)
              appendToFile('incorrect-org-ids.txt', orgId + '\n')
            }
          }

          log.info(`So far found ${incorrectOrgIds.length} incorrect org ids!`)
        }
      }
    },
    async (_, err) => {
      log.error(err, 'Error while processing batch!')
    },
  )

  for (const entry of intervals) {
    let currentFrom = entry.from
    let interval = 5 * 60000 // start with 5 minutes

    while (currentFrom < entry.to) {
      const currentTo = new Date(currentFrom.getTime() + interval)
      let processed = 0
      try {
        await streamQuery(
          qdbConnection,
          async (row: { organizationId: string }) => {
            await batchProcessor.addToBatch(row.organizationId)
            processed++
          },
          `select distinct "organizationId" from activities where "deletedAt" is null and "updatedAt" >= $(fromUpdatedAt) and "updatedAt" <= $(toUpdatedAt)`,
          {
            fromUpdatedAt: currentFrom,
            toUpdatedAt: currentTo,
          },
        )

        log.info(
          `Processed ${processed} distinct org ids for period ${currentFrom.toISOString()} - ${currentTo.toISOString()}`,
        )

        currentFrom = currentTo
        if (interval <= maxInterval) {
          interval += 10000
          log.info(`Increasing interval by 10 seconds! New interval: ${interval}`)
        }
      } catch (err) {
        if ((err.message as string).includes('timeout, query aborted')) {
          interval = 5000
          log.info(`Timeout, reducing interval to 5 seconds!`)
        } else {
          log.error(err, 'Error while processing distinct org ids!')
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
  }
})
