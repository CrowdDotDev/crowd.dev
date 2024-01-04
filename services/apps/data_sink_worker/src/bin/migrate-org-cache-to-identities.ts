import {
  DbConnection,
  DbInstance,
  DbTransaction,
  RepositoryBase,
  getDbConnection,
  getDbInstance,
} from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { DB_CONFIG } from '../conf'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface IOrgCacheToMerge {
  website: string
  ids: string[]
}

async function getOrganizationCachesToMigrate(db: DbConnection): Promise<IOrgCacheToMerge[]> {
  const results = await db.any(
    `
select oc."oldWebsite", array_agg(oc.id) as ids
from "organizationCaches" oc
where oc."oldWebsite" is not null
  and not exists (select 1 from "organizationCacheIdentities" oci where oci.website = oc."oldWebsite")
group by oc."oldWebsite"
limit 100;
`,
  )

  return results
}

async function getOrganizationCaches(db: DbConnection, ids: string[]): Promise<any[]> {
  const results = await db.any(
    `
select *
from "organizationCaches"
where id in ($(ids:csv))
`,
    { ids },
  )

  return results
}

async function createOrgCacheIdentity(
  db: DbTransaction,
  id: string,
  website: string | null,
  name: string,
): Promise<void> {
  await db.none(
    `insert into "organizationCacheIdentities"(id, name, website) values($(id), $(name), $(website));`,
    {
      id,
      name,
      website,
    },
  )
}

async function moveLinksToNewCacheId(
  db: DbTransaction,
  fromIds: string[],
  toId: string,
): Promise<void> {
  const existingLinks = await db.any(
    `
    select "organizationId", "organizationCacheId" from "organizationCacheLinks"
    where "organizationCacheId" in ($(ids:csv))
    `,
    {
      ids: fromIds.concat([toId]),
    },
  )

  const toLinks = existingLinks.filter((l) => l.organizationCacheId === toId)
  const toRemove: any[] = []
  const toMove: any[] = []
  for (const fromId of fromIds) {
    const fromIdLinks = existingLinks.filter((l) => l.organizationCacheId === fromId)
    for (const fromIdLink of fromIdLinks) {
      // if we already have a link to the same organization we can just remove the old link
      // otherwise we need to move the link to the new cache id
      if (toLinks.find((l) => l.organizationId === fromIdLink.organizationId)) {
        toRemove.push(fromIdLink)
      } else {
        toMove.push(fromIdLink)
      }
    }
  }

  for (const link of toRemove) {
    await db.none(
      `delete from "organizationCacheLinks" where "organizationId" = $(organizationId) and "organizationCacheId" = $(organizationCacheId)`,
      {
        organizationId: link.organizationId,
        organizationCacheId: link.organizationCacheId,
      },
    )
  }

  for (const link of toMove) {
    await db.none(
      `update "organizationCacheLinks" set "organizationCacheId" = $(toId) where "organizationId" = $(organizationId) and "organizationCacheId" = $(organizationCacheId)`,
      {
        organizationId: link.organizationId,
        organizationCacheId: link.organizationCacheId,
        toId,
      },
    )
  }
}

async function removeCaches(db: DbTransaction, ids: string[]): Promise<void> {
  await db.none(`delete from "organizationCaches" where id in ($(ids:csv))`, { ids })
}

const columnsToIgnore = [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'enriched',
  'lastEnrichedAt',
  'manuallyCreated',
  'oldName',
  'oldWebsite',
]

async function updateOrganizationCacheData(dbInstance, db, id, data) {
  const keys = Object.keys(data).filter((k) => !columnsToIgnore.includes(k) && k != 'naics')

  if (keys.length !== 0) {
    const dynamicColumnSet = new dbInstance.helpers.ColumnSet(keys, {
      table: 'organizationCaches',
    })

    const prepared = RepositoryBase.prepare(data, dynamicColumnSet)
    const query = dbInstance.helpers.update(prepared, dynamicColumnSet)

    const condition = dbInstance.as.format('where id = $(id)', { id })
    const result = await db.result(`${query} ${condition}`)

    if (result.rowCount !== 1) {
      throw new Error('Updated row count not equal to 1!')
    }
  }

  if ('naics' in data) {
    const formattedNaicsData = data.naics.map((item) => JSON.stringify(item))
    const query = `UPDATE "organizationCaches" 
               SET "naics" = ARRAY[${formattedNaicsData
                 .map((item) => `'${item}'::jsonb`)
                 .join(', ')}] 
               WHERE id = '${id}'`
    const result = await db.result(query)
    if (result.rowCount !== 1) {
      throw new Error('Updated row count not equal to 1!')
    }
  }
}

const log = getServiceLogger()

async function processOrgCache(
  db: DbConnection,
  dbInstance: DbInstance,
  result: IOrgCacheToMerge,
): Promise<void> {
  const ids = result.ids

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
        await createOrgCacheIdentity(tx, data.id, data.oldWebsite, data.oldName)
        if (Object.keys(toUpdate).length > 0) {
          await updateOrganizationCacheData(dbInstance, tx, data.id, toUpdate)
        }
        const cacheIdsToRemove = caches.filter((c) => c.id !== caches[index].id).map((c) => c.id)
        await moveLinksToNewCacheId(tx, cacheIdsToRemove, data.id)
        await removeCaches(tx, cacheIdsToRemove)
      })
    } catch (err) {
      log.error(err, { id: data.id }, 'Error while processing organization caches!')
      throw err
    }
  } else if (ids.length === 1) {
    if (caches.length !== 1) {
      throw new Error(`Did not find org cache for id: ${ids[0]}`)
    }
    // no need to merge datapoints just extract identity into organizationCacheIdentities
    const data = caches[0]
    try {
      await db.tx(async (tx) => {
        await createOrgCacheIdentity(tx, data.id, data.oldWebsite, data.oldName)
      })
    } catch (err) {
      log.error(err, { id: data.id }, 'Error while processing organization cache!')
      throw err
    }
  } else {
    throw new Error(`No ids found!`)
  }
}

setImmediate(async () => {
  const db = await getDbConnection(DB_CONFIG())
  const dbInstance = getDbInstance()

  let results = await getOrganizationCachesToMigrate(db)

  let count = 0
  while (results.length > 0) {
    for (const result of results) {
      await processOrgCache(db, dbInstance, result)
      count++
      log.info({ count }, `Processed org cache!`)
    }

    results = await getOrganizationCachesToMigrate(db)
  }

  process.exit(0)
})
