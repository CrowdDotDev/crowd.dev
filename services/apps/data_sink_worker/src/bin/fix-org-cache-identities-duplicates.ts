import {
  DbConnection,
  DbInstance,
  getDbConnection,
  getDbInstance,
} from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { DB_CONFIG } from '../conf'

import {
  IOrgCacheToMerge,
  columnsToIgnore,
  getOrganizationsToFix,
  getOrganizationCaches,
  updateOrganizationCacheData,
  moveLinksToNewCacheId,
  removeCacheIdentities,
  removeCaches,
  updateCacheIdentityWebsite,
} from '@crowd/data-access-layer/src/old/apps/data_sink_worker/scripts/fix-org-cache-identities-duplicates'

/* eslint-disable @typescript-eslint/no-explicit-any */

const log = getServiceLogger()

async function processOrgCache(
  db: DbConnection,
  dbInstance: DbInstance,
  result: IOrgCacheToMerge,
): Promise<void> {
  const ids = result.data.map((d) => d.id)

  const caches = await getOrganizationCaches(db, ids)

  if (ids.length > 1) {
    // need to merge all datapoints together
    if (ids.length !== caches.length) {
      throw new Error(`Did not find all org cache entries for these ids: [${ids.join(', ')}]`)
    }

    // pick the most completed entry
    let index = 0
    let max = 0
    for (let i = 0; i < caches.length; i++) {
      const filledKeys = Object.keys(caches[i]).filter(
        (k) => !columnsToIgnore.includes(k) && caches[i][k] !== null,
      )

      if (filledKeys.length > max) {
        max = filledKeys.length
        index = i
      }
    }

    const data = caches[index]

    const toUpdate: any = {}
    for (let i = 0; i < caches.length; i++) {
      if (i === index) {
        continue
      }
      for (const key of Object.keys(data)) {
        if (data[key] === null && caches[i][key] !== null) {
          toUpdate[key] = caches[i][key]
        }
      }
    }

    try {
      await db.tx(async (tx) => {
        if (Object.keys(toUpdate).length > 0) {
          await updateOrganizationCacheData(dbInstance, tx, data.id, toUpdate)
        }
        const cacheIdsToRemove = caches.filter((c) => c.id !== data.id).map((c) => c.id)

        await moveLinksToNewCacheId(tx, cacheIdsToRemove, data.id)
        await removeCacheIdentities(tx, cacheIdsToRemove)

        // do we need to set the website?
        const website = result.data
          .filter((d) => d.id !== data.id)
          .reduce((prev, curr) => {
            if (!prev || prev === '') {
              return curr.website
            }
          }, '')

        if (website && website !== '') {
          await updateCacheIdentityWebsite(tx, data.id, website)
        }

        await removeCaches(tx, cacheIdsToRemove)
      })
    } catch (err) {
      log.error(err, { id: data.id }, 'Error while processing organization caches!')
      throw err
    }
  } else {
    throw new Error('should not happen')
  }
}

setImmediate(async () => {
  const db = await getDbConnection(DB_CONFIG())
  const dbInstance = getDbInstance()

  let results = await getOrganizationsToFix(db)

  let count = 0
  while (results.length > 0) {
    for (const result of results) {
      await processOrgCache(db, dbInstance, result)
      count++
      log.info({ count }, `Processed org cache!`)
    }

    results = await getOrganizationsToFix(db)
  }

  process.exit(0)
})
