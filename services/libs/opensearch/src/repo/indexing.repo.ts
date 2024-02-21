import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IEntityData } from './indexing.data'

export class IndexingRepository extends RepositoryBase<IndexingRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async markEntitiesIndexed(data: IEntityData[]): Promise<void> {
    if (data.length > 0) {
      const values = data.map((d) => `('${d.id}', '${d.tenantId}')`)
      const query = `
        insert into indexed_entities(entity_id, tenant_id)
        values ${values.join(',\n')}
        on conflict (entity_id, tenant_id)
        do update set indexed_at = now()
      `
      await this.db().none(query)
    }
  }
}
