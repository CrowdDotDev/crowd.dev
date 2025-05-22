import fs from 'fs'

import { BatchProcessor } from '@crowd/common'
import { WRITE_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { DbConnection } from '@crowd/database'
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

const checkedIds: string[] = []
const incorrectIds: string[] = []

async function findLastMemberId(
  db: DbConnection,
  qdb: DbConnection,
  id: string,
): Promise<string | null> {
  const data = await db.oneOrNone(
    `select * from "mergeActions" where type = 'member' and "secondaryId" = $(id) and state = 'merged' order by "updatedAt" desc limit 1`,
    { id },
  )

  if (data) {
    // check if member exists
    const member = await db.oneOrNone(
      `select id from members where "deletedAt" is null and id = $(id)`,
      { id: data.primaryId },
    )

    if (!member) {
      return findLastMemberId(db, qdb, data.primaryId)
    }

    return member.id
  }

  // lets find an activity and then the member by identity

  const activity = await qdb.oneOrNone(
    `select * from activities where "objectMemberId" = $(id) and "deletedAt" is null limit 1`,
    { id },
  )

  if (activity) {
    const data = await db.oneOrNone(
      `select * from "memberIdentities" where platform = $(platform) and type = 'username' and verified = true and value = $(username) limit 1`,
      {
        platform: activity.platform,
        value: activity.objectMemberUsername,
      },
    )
    if (data) {
      return data.memberId
    }
  }

  return null
}

setImmediate(async () => {
  createOrRecreateFile('incorrect-object-member-ids.txt')

  const dbConnection = await getDbConnection(WRITE_DB_CONFIG())
  const qdbConnection = await getClientSQL()

  const batchProcessor = new BatchProcessor<string>(
    100,
    10,
    async (batch) => {
      if (batch.length > 0) {
        const newIds = batch.filter((id) => !checkedIds.includes(id))

        if (newIds.length > 0) {
          checkedIds.push(...newIds)
          const results = await dbConnection.any(
            `select id from members where "deletedAt" is null and id in ($(ids:csv))`,
            {
              ids: newIds,
            },
          )

          for (const id of newIds) {
            const existing = results.find((row) => row.id === id)

            if (!existing) {
              incorrectIds.push(id)
              const newMemberId = await findLastMemberId(dbConnection, qdbConnection, id)

              if (newMemberId) {
                await qdbConnection.result(
                  `update activities set "objectMemberId" = $(newId) where "objectMemberId" = $(oldId)`,
                  {
                    newId: newMemberId,
                    oldId: id,
                  },
                )
                appendToFile('incorrect-object-member-ids.txt', `${id} -> ${newMemberId}\n`)
              } else {
                appendToFile('incorrect-object-member-ids.txt', `${id} -> NOT FOUND!\n`)
              }
            }
          }
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
        const results = await qdbConnection.any(
          `select distinct "objectMemberId" from activities where "deletedAt" is null and "objectMemberId" is not null and "updatedAt" >= $(fromUpdatedAt) and "updatedAt" <= $(toUpdatedAt)`,
          {
            fromUpdatedAt: currentFrom,
            toUpdatedAt: currentTo,
          },
        )

        for (const { objectMemberId } of results) {
          if (objectMemberId && objectMemberId !== 'null') {
            await batchProcessor.addToBatch(objectMemberId)
            processed++
          }
        }

        log.info(
          `Processed ${processed} object member ids (${incorrectIds.length} incorrect) for period ${currentFrom.toISOString()} - ${currentTo.toISOString()}`,
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

  log.info(`Found ${incorrectIds.length} incorrect ids!`)
  process.exit(0)
})
