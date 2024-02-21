import { DbColumnSet, DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'

export class IndexingRepository extends RepositoryBase<IndexingRepository> {
  private readonly indexedEntitiesColumnSet: DbColumnSet

  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)

    this.indexedEntitiesColumnSet = new dbStore.dbInstance.helpers.ColumnSet(
      ['entity_id', 'attempt_id', 'tenant_id'],
      {
        table: 'indexed_entities',
      },
    )
  }

  public async markEntitiesIndexed(
    ids: string[],
    attemptId: string,
    tenantId: string,
  ): Promise<void> {
    if (ids.length > 0) {
      const values = ids.map((id) => `('${id}', '${attemptId}', '${tenantId}')`)
      const query = `
        insert into indexed_entities(entity_id, attempt_id, tenant_id)
        values ${values.join(',\n')}
        on conflict (entity_id, attempt_id, tenant_id)
        do update set indexed_at = now()
      `
      await this.db().none(query)
    }
  }
}
