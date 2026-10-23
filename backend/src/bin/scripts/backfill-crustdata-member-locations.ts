import commandLineArgs from 'command-line-args'

import { DB_CONFIG } from '@/conf'
import { getSearchSyncApiClient } from '@/utils/apiClients'
import {
  getAttributeValue,
  getCountry,
  hasAttributeValue,
  replaceDoubleQuotes,
  setAttributesDefaultValues,
} from '@crowd/common'
import {
  ICrustdataMemberLocation,
  fetchCrustdataMemberLocations,
  fetchMemberAttributes,
  pgpQx,
  updateMemberAttributes,
} from '@crowd/data-access-layer'
import { getDbConnection } from '@crowd/data-access-layer/src/database'
import { getPlatformPriorityArray } from '@crowd/data-access-layer/src/members/attributeSettings'
import { chunkArray } from '@crowd/data-access-layer/src/old/apps/merge_suggestions_worker/utils'
import { getServiceLogger } from '@crowd/logging'
import { IAttributes } from '@crowd/types'

const log = getServiceLogger()

const options = [
  {
    name: 'testRun',
    alias: 't',
    type: Boolean,
    description: 'Run in test mode (limit to 1 batch and 10 members).',
  },
  {
    name: 'afterMemberId',
    alias: 'a',
    type: String,
    description: 'The member ID to start processing after.',
  },
  {
    name: 'batchSize',
    alias: 'b',
    type: Number,
    description: 'The number of Crustdata cache rows to fetch in each batch.',
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Print this usage guide.',
  },
]

const parameters = commandLineArgs(options)

async function buildLocationAttributes(
  attributes: IAttributes,
  { location, country }: ICrustdataMemberLocation,
  priorities: string[],
): Promise<IAttributes | null> {
  const changed: IAttributes = {}

  if (location && !attributes.location?.enrichment) {
    changed.location = { ...attributes.location, enrichment: replaceDoubleQuotes(location) }
  }

  if (country && !attributes.country?.enrichment) {
    changed.country = { ...attributes.country, enrichment: replaceDoubleQuotes(country) }
  }

  if (Object.keys(changed).length === 0) {
    return null
  }

  const nextCountry = changed.country ?? attributes.country
  if (!hasAttributeValue(nextCountry)) {
    const inferredCountry = getCountry(getAttributeValue(changed.location ?? attributes.location))
    if (inferredCountry) {
      changed.country = { ...nextCountry, system: inferredCountry }
    }
  }

  return (await setAttributesDefaultValues(changed, priorities)) as IAttributes
}

setImmediate(async () => {
  const testRun = parameters.testRun ?? false
  const BATCH_SIZE = parameters.batchSize ?? (testRun ? 10 : 500)
  let afterMemberId = parameters.afterMemberId ?? undefined

  const db = await getDbConnection({
    host: DB_CONFIG.writeHost,
    port: DB_CONFIG.port,
    database: DB_CONFIG.database,
    user: DB_CONFIG.username,
    password: DB_CONFIG.password,
  })

  const qx = pgpQx(db)
  const searchSyncApi = await getSearchSyncApiClient()
  const priorities = await getPlatformPriorityArray(qx)

  log.info({ testRun, BATCH_SIZE, afterMemberId }, 'Running script with the following parameters!')

  let hasMore = true
  let updatedCount = 0

  while (hasMore) {
    const rows = await fetchCrustdataMemberLocations(qx, BATCH_SIZE, afterMemberId)

    if (rows.length === 0) {
      break
    }

    const candidates = rows.filter((row) => row.location || row.country)

    for (const chunk of chunkArray(candidates, 20)) {
      await Promise.all(
        chunk.map(async (candidate) => {
          const { memberId } = candidate

          try {
            const attributes = await fetchMemberAttributes(qx, memberId)
            if (!attributes) {
              return
            }

            const changed = await buildLocationAttributes(attributes, candidate, priorities)
            if (!changed) {
              return
            }

            if (testRun) {
              log.info(
                {
                  memberId,
                  before: { location: attributes.location, country: attributes.country },
                  after: changed,
                },
                'Previewing changes for member.',
              )
            }

            await updateMemberAttributes(qx, memberId, { ...attributes, ...changed })
            await searchSyncApi.triggerMemberSync(memberId)
            updatedCount++
          } catch (err) {
            log.error({ memberId, err }, 'Failed to process member!')
            throw err
          }
        }),
      )
    }

    afterMemberId = rows[rows.length - 1].memberId

    log.info(
      { lastMemberId: afterMemberId, scanned: rows.length, candidates: candidates.length },
      'Batch processed!',
    )

    if (testRun || rows.length < BATCH_SIZE) {
      hasMore = false
    }
  }

  log.info({ updatedCount }, 'Backfill finished!')

  process.exit(0)
})
