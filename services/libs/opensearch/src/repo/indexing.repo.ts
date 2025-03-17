import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'

import { IndexedEntityType } from './indexing.data'

export class IndexingRepository extends RepositoryBase<IndexingRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async deleteIndexedEntities(type: IndexedEntityType): Promise<void> {
    await this.db().none(
      `
      delete from indexed_entities where type = $(type)
      `,
      {
        type,
      },
    )
  }

  public async markEntitiesIndexed(type: IndexedEntityType, data: string[]): Promise<void> {
    if (data.length > 0) {
      const values = data.map((d) => `('${type}', '${d}')`)
      const query = `
        insert into indexed_entities(type, entity_id)
        values ${values.join(',\n')}
        on conflict (type, entity_id)
        do update set indexed_at = now()
      `
      await this.db().none(query)
    }
  }

  public async getLatestIndexedEntityId(type: IndexedEntityType): Promise<string | null> {
    const result = await this.db().oneOrNone<{ entity_id: string }>(
      `
      select entity_id
      from indexed_entities
      where type = $(type)
      order by entity_id desc
      limit 1
      `,
      {
        type,
      },
    )

    return result?.entity_id ?? null
  }
}
