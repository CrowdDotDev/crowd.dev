import { DbConnection, DbTransaction, RepositoryBase } from '@crowd/database'

export interface IOrgCacheToMerge {
  name: string
  data: {
    id: string
    website: string
  }[]
}

export async function getOrganizationsToFix(db: DbConnection): Promise<IOrgCacheToMerge[]> {
  const results = await db.any(
    `
            select name,
                   json_agg(json_build_object(
                           'id', id,
                           'website', website
                            )) as data
            from "organizationCacheIdentities"
            group by name
            having count(id) > 1;
        `,
  )

  return results
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getOrganizationCaches(db: DbConnection, ids: string[]): Promise<any[]> {
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

export async function updateCacheIdentityWebsite(
  db: DbTransaction,
  id: string,
  website: string,
): Promise<void> {
  await db.none(
    `update "organizationCacheIdentities"
                   set website = $(website)
                   where id = $(id)`,
    {
      id,
      website,
    },
  )
}

export async function moveLinksToNewCacheId(
  db: DbTransaction,
  fromIds: string[],
  toId: string,
): Promise<void> {
  const existingLinks = await db.any(
    `
            select "organizationId", "organizationCacheId"
            from "organizationCacheLinks"
            where "organizationCacheId" in ($(ids:csv))
        `,
    {
      ids: fromIds.concat([toId]),
    },
  )

  const toLinks = existingLinks.filter((l) => l.organizationCacheId === toId)
  const toRemove: any[] = [] // eslint-disable-line @typescript-eslint/no-explicit-any
  const toMove: any[] = [] // eslint-disable-line @typescript-eslint/no-explicit-any
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
      `delete
             from "organizationCacheLinks"
             where "organizationId" = $(organizationId)
               and "organizationCacheId" = $(organizationCacheId)`,
      {
        organizationId: link.organizationId,
        organizationCacheId: link.organizationCacheId,
      },
    )
  }

  for (const link of toMove) {
    await db.none(
      `update "organizationCacheLinks"
             set "organizationCacheId" = $(toId)
             where "organizationId" = $(organizationId)
               and "organizationCacheId" = $(organizationCacheId)`,
      {
        organizationId: link.organizationId,
        organizationCacheId: link.organizationCacheId,
        toId,
      },
    )
  }
}

export async function removeCaches(db: DbTransaction, ids: string[]): Promise<void> {
  await db.none(
    `delete
                   from "organizationCaches"
                   where id in ($(ids:csv))`,
    { ids },
  )
}

export async function removeCacheIdentities(db: DbTransaction, ids: string[]): Promise<void> {
  await db.none(
    `delete
                   from "organizationCacheIdentities"
                   where id in ($(ids:csv))`,
    { ids },
  )
}

export const columnsToIgnore = [
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

export async function updateOrganizationCacheData(dbInstance, db, id, data) {
  const keys = Object.keys(data).filter((k) => !columnsToIgnore.includes(k))

  if (keys.length !== 0) {
    const dynamicColumnSet = new dbInstance.helpers.ColumnSet(keys, {
      table: 'organizationCaches',
    })

    if (data.naics) {
      data.naics = JSON.stringify(data.naics)
    }

    const prepared = RepositoryBase.prepare(data, dynamicColumnSet)
    const query = dbInstance.helpers.update(prepared, dynamicColumnSet)

    const condition = dbInstance.as.format('where id = $(id)', { id })
    const result = await db.result(`${query} ${condition}`)

    if (result.rowCount !== 1) {
      throw new Error('Updated row count not equal to 1!')
    }
  }
}
